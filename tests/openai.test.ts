import { describe, expect, it } from "vitest";
import { anfrageKoerperOpenAi, OpenAiAnbieter, strengesSchema, auswertenOpenAi } from "../src/anbieter/openai";
import { anbieterVon, fehlendeSchluessel, Verteiler } from "../src/anbieter/verteiler";
import { kostenAnfrage } from "../src/anbieter/preise";
import type { LlmAnbieter, LlmAnfrage, LlmAntwort } from "../src/anbieter/typen";

const sse = (events: object[]) => events.map((e: any) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");

function strom(text: string, status = 200): Response {
  const body = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode(text));
      c.close();
    },
  });
  return new Response(body, { status, headers: { "content-type": "text/event-stream" } });
}

const fertig = (output: any[], extra: object = {}) => ({
  type: "response.completed",
  response: {
    status: "completed",
    model: "gpt-6.1-sol",
    output,
    usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 400 }, output_tokens: 200, output_tokens_details: { reasoning_tokens: 50 } },
    ...extra,
  },
});

const anfrage: LlmAnfrage = {
  modell: "gpt-6.1-sol",
  maxTokens: 5000,
  aufwand: "medium",
  system: [{ text: "Teil A", cache: true }, { text: "Teil B" }],
  nachrichten: [
    {
      role: "user",
      content: [
        { type: "text", text: "Hallo" },
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: "QUJD" }, title: "Lage.pdf" },
      ],
    },
  ],
};

describe("OpenAI: Anfrage", () => {
  it("übersetzt System, Nachrichten, PDF, Aufwand, Werkzeuge und Schema", () => {
    const b = anfrageKoerperOpenAi({
      ...anfrage,
      werkzeuge: { websuche: { maxUses: 10, land: "DE", zeitzone: "Europe/Berlin" }, abruf: { maxUses: 5, maxTokens: 15000 } },
      jsonSchema: { type: "object", properties: { a: { type: "string" }, b: { type: "integer" } }, required: ["a"] },
    });
    expect(b.instructions).toBe("Teil A\n\nTeil B");
    expect(b.store).toBe(false);
    expect(b.stream).toBe(true);
    expect(b.max_output_tokens).toBe(5000);
    expect(b.reasoning).toEqual({ effort: "medium" });
    expect(b.input[0].content).toEqual([
      { type: "input_text", text: "Hallo" },
      { type: "input_file", filename: "Lage.pdf", file_data: "data:application/pdf;base64,QUJD" },
    ]);
    expect(b.tools).toEqual([{ type: "web_search", user_location: { type: "approximate", country: "DE", timezone: "Europe/Berlin" } }]);
    expect(b.max_tool_calls).toBe(15);
    expect(b.text.format.strict).toBe(true);
    expect(b.text.format.schema.required).toEqual(["a", "b"]);
    expect(b.text.format.schema.properties.b.type).toEqual(["integer", "null"]);
    expect(b.text.format.schema.additionalProperties).toBe(false);
  });

  it("macht verschachtelte Schemata streng", () => {
    const s = strengesSchema({
      type: "object",
      properties: { l: { type: "array", items: { type: "object", properties: { x: { type: "string" } } } } },
      required: ["l"],
    });
    expect(s.properties.l.items).toMatchObject({ required: ["x"], additionalProperties: false, properties: { x: { type: ["string", "null"] } } });
  });
});

describe("OpenAI: Antwort", () => {
  it("liest Text, Zitate, Suchen, Nutzung und Kosten aus dem Strom", async () => {
    const output = [
      { type: "reasoning", summary: [] },
      {
        type: "web_search_call",
        status: "completed",
        action: { type: "search", query: "Sturm Thüringen", sources: [{ type: "url", url: "https://www.dwd.de/a" }] },
      },
      { type: "web_search_call", status: "completed", action: { type: "open_page", url: "https://www.dwd.de/a" } },
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "Antwort", annotations: [{ type: "url_citation", url: "https://www.dwd.de/a", title: "DWD" }] }],
      },
    ];
    const fortschritt: string[] = [];
    const fetch = async () =>
      strom(
        sse([
          { type: "response.created" },
          { type: "response.output_item.added", item: { type: "reasoning" } },
          { type: "response.output_item.done", item: output[1] },
          { type: "response.output_text.delta", delta: "Ant" },
          { type: "response.output_text.delta", delta: "wort" },
          fertig(output),
        ]),
      );
    const a = await new OpenAiAnbieter("k", "https://x", fetch as any).senden({ ...anfrage, fortschritt: (f) => fortschritt.push(f.art) });
    expect(a.text).toBe("Antwort");
    expect(a.zitate).toEqual([{ url: "https://www.dwd.de/a", titel: "DWD" }]);
    expect(a.suchen).toEqual(["Sturm Thüringen"]);
    expect(a.abrufe).toEqual(["https://www.dwd.de/a"]);
    expect(a.nutzung).toMatchObject({ eingabe: 600, cacheLesen: 400, ausgabe: 200, websuchen: 1, abrufe: 1 });
    expect(a.stopGrund).toBe("end_turn");
    // 600×2 + 400×0,1 + 200×10 = 3240 µUSD; zwei Werkzeugaufrufe je 0,01 USD
    expect(a.kostenUsd).toBeCloseTo(0.00324 + 0.02, 6);
    expect(fortschritt).toEqual(expect.arrayContaining(["denkt", "suche", "schreibt"]));
  });

  it("meldet abgeschnittene Antworten als max_tokens", async () => {
    const r = fertig([{ type: "message", content: [{ type: "output_text", text: '{"a":', annotations: [] }] }], {
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
    });
    const fetch = async () => strom(sse([{ ...r, type: "response.incomplete" }]));
    const a = await new OpenAiAnbieter("k", "https://x", fetch as any).senden(anfrage);
    expect(a.stopGrund).toBe("max_tokens");
  });

  it("wiederholt bei 429, bricht bei fehlendem Guthaben und falschem Schlüssel mit deutscher Meldung ab", async () => {
    let n = 0;
    const fetch429 = async () =>
      ++n === 1
        ? new Response(JSON.stringify({ error: { code: "rate_limit_exceeded" } }), { status: 429, headers: { "retry-after": "0.01" } })
        : strom(sse([fertig([])]));
    await new OpenAiAnbieter("k", "https://x", fetch429 as any).senden(anfrage);
    expect(n).toBe(2);
    const quota = async () => new Response(JSON.stringify({ error: { code: "insufficient_quota", message: "quota" } }), { status: 429 });
    await expect(new OpenAiAnbieter("k", "https://x", quota as any).senden(anfrage)).rejects.toThrow(/Guthaben/);
    const auth = async () => new Response(JSON.stringify({ error: { code: "invalid_api_key" } }), { status: 401 });
    await expect(new OpenAiAnbieter("k", "https://x", auth as any).senden(anfrage)).rejects.toThrow(/OpenAI-Schlüssel wurde abgelehnt/);
  });

  it("stellt die Anfrage nach einem Stromabbruch neu", async () => {
    let n = 0;
    const fetch = async () =>
      ++n === 1
        ? strom(sse([{ type: "response.output_text.delta", delta: "x" }]))
        : strom(sse([fertig([{ type: "message", content: [{ type: "output_text", text: "ok", annotations: [] }] }])]));
    const a = await new OpenAiAnbieter("k", "https://x", fetch as any).senden(anfrage);
    expect(a.text).toBe("ok");
    expect(n).toBe(2);
  });

  it("erkennt Ablehnungen", () => {
    expect(auswertenOpenAi([{ type: "message", content: [{ type: "refusal", refusal: "nein" }] }]).abgelehnt).toBe(true);
  });
});

describe("Verteiler", () => {
  it("wählt den Anbieter nach dem Modell und verlangt den passenden Schlüssel", async () => {
    expect(anbieterVon("gpt-6-luna")).toBe("openai");
    expect(anbieterVon("claude-opus-5-5")).toBe("anthropic");
    expect(fehlendeSchluessel(["claude-haiku-5-5", "gpt-6.1-sol"], { anthropic: "a", openai: "" })).toEqual(["openai"]);
    const genutzt: string[] = [];
    const attrappe = (id: string): LlmAnbieter => ({ id, senden: async () => (genutzt.push(id), { text: id } as LlmAntwort) });
    const v = new Verteiler({ anthropic: "a", openai: "" }, (id) => attrappe(id));
    await v.senden({ ...anfrage, modell: "claude-sonnet-5-5" });
    expect(genutzt).toEqual(["anthropic"]);
    await expect(v.senden(anfrage)).rejects.toThrow(/Für OpenAI \(gpt-6.1-sol\) ist kein API-Schlüssel/);
  });

  it("kennt OpenAI-Preise", () => {
    expect(kostenAnfrage("gpt-6-luna", { eingabe: 1_000_000, ausgabe: 1_000_000, cacheLesen: 0, cacheSchreiben: 0, websuchen: 0, abrufe: 0 })).toBeCloseTo(0.6);
  });
});
