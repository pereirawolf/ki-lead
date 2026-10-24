// Mistral-Adapter (seit 0.5.6): Anfrage an die Conversations-API, Stromauswertung mit Websuche und Fundstellen,
// Nutzung und Kosten, Fehler, grobe Stufe des Nachdenkens, Abschneiden an der Ausgabegrenze, Neustart nach Abbruch.
// Erwartete Werte stehen fest im Test; die Ereignisse folgen den Typen des SDK @mistralai/mistralai 3.2.0.
import { describe, expect, it } from "vitest";
import { abreissenderStrom, fehlerAntwort, ohneWarten, sseAntwort, sseText as sse } from "../support/anbieter";
import { anfrageKoerperMistral, MistralAnbieter, nutzungMistral } from "../../src/anbieter/mistral";
import type { LlmAnfrage } from "../../src/anbieter/typen";

const strom = (text: string, status = 200) => sseAntwort(text, 1, status);

const anfrage: LlmAnfrage = {
  modell: "mistral-medium-3-5",
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

const delta = (content: unknown, extra: object = {}) => ({
  type: "message.output.delta",
  output_index: 1,
  id: "m1",
  content_index: 0,
  model: "mistral-medium-3-5",
  role: "assistant",
  content,
  ...extra,
});
const fertig = (usage: object) => ({ type: "conversation.response.done", usage });

/** Abrufattrappe, die Anfragen mitschreibt */
function attrappe(antworten: (() => Response)[]) {
  const koerper: any[] = [];
  const urls: string[] = [];
  const kopf: Record<string, string>[] = [];
  const abruf = async (url: string, init: RequestInit) => {
    urls.push(url);
    koerper.push(JSON.parse(String(init.body)));
    kopf.push(init.headers as Record<string, string>);
    return antworten.shift()!();
  };
  return { abruf: abruf as unknown as typeof fetch, koerper, urls, kopf };
}

describe("Mistral: Anfrage", () => {
  it("übersetzt System, Nachrichten, PDF, Aufwand, Websuche und Schema für /v1/conversations", () => {
    const b = anfrageKoerperMistral({
      ...anfrage,
      werkzeuge: { websuche: { maxUses: 10, land: "DE", zeitzone: "Europe/Berlin" }, abruf: { maxUses: 5, maxTokens: 15000 } },
      jsonSchema: { type: "object", properties: { a: { type: "string" }, b: { type: "integer" } }, required: ["a"] },
    });
    expect(b.model).toBe("mistral-medium-3-5");
    expect(b.instructions).toBe("Teil A\n\nTeil B");
    expect(b.stream).toBe(true);
    expect(b.store).toBe(false);
    expect(b.inputs).toEqual([
      {
        type: "message.input",
        role: "user",
        content: [
          { type: "text", text: "Hallo" },
          { type: "document_url", document_url: "data:application/pdf;base64,QUJD", document_name: "Lage.pdf" },
        ],
      },
    ]);
    expect(b.completion_args.max_tokens).toBe(5000);
    expect(b.completion_args.reasoning_effort).toBe("medium");
    // Nur die Websuche; keine Höchstzahl, kein Abrufwerkzeug
    expect(b.tools).toEqual([{ type: "web_search" }]);
    const rf = b.completion_args.response_format;
    expect(rf.type).toBe("json_schema");
    expect(rf.json_schema.name).toBe("antwort");
    expect(rf.json_schema.strict).toBe(true);
    expect(rf.json_schema.schema.required).toEqual(["a", "b"]);
    expect(rf.json_schema.schema.properties.b.type).toEqual(["integer", "null"]);
    expect(rf.json_schema.schema.additionalProperties).toBe(false);
  });

  it("ohne Websuche keine Werkzeuge (auch nicht bei erlaubtem Seitenabruf), ohne Aufwand kein reasoning_effort", () => {
    const b = anfrageKoerperMistral({ ...anfrage, aufwand: undefined, werkzeuge: { abruf: { maxUses: 5 } } });
    expect(b.tools).toBeUndefined();
    expect(b.completion_args).toEqual({ max_tokens: 5000 });
    expect(b.inputs[0].content).toEqual([
      { type: "text", text: "Hallo" },
      { type: "document_url", document_url: "data:application/pdf;base64,QUJD", document_name: "Lage.pdf" },
    ]);
  });

  it("bildet die Stufen der App auf reasoning_effort ab; „maximal“ wird zu „xhigh“", () => {
    const stufe = (aufwand: LlmAnfrage["aufwand"]) => anfrageKoerperMistral({ ...anfrage, aufwand }).completion_args.reasoning_effort;
    expect([stufe("low"), stufe("medium"), stufe("high"), stufe("xhigh"), stufe("max")]).toEqual(["low", "medium", "high", "xhigh", "xhigh"]);
  });

  it("Text als Zeichenkette bleibt Zeichenkette; Textdokumente werden zu Text mit Überschrift", () => {
    expect(anfrageKoerperMistral({ ...anfrage, nachrichten: [{ role: "user", content: "Los" }] }).inputs[0].content).toBe("Los");
    const b = anfrageKoerperMistral({
      ...anfrage,
      nachrichten: [{ role: "user", content: [{ type: "document", source: { type: "text", data: "Inhalt" }, title: "Notiz" }] }],
    });
    expect(b.inputs[0].content).toEqual([{ type: "text", text: "# Notiz\n\nInhalt" }]);
  });
});

describe("Mistral: Antwort", () => {
  it("liest Text, Denken, Suchen, Fundstellen, Nutzung und Kosten aus dem Strom", async () => {
    const fortschritt: string[] = [];
    const { abruf, urls, kopf } = attrappe([
      () =>
        strom(
          sse([
            { type: "conversation.response.started", conversation_id: "c1" },
            delta({ type: "thinking", thinking: [{ type: "text", text: "Überlege" }] }),
            { type: "tool.execution.started", output_index: 0, id: "t1", name: "web_search", arguments: '{"query":"Hochwasser Elbe"}' },
            { type: "tool.execution.done", output_index: 0, id: "t1", name: "web_search" },
            delta('{"a":'),
            delta({ type: "tool_reference", tool: "web_search", title: "Pegel Dresden", url: "https://pegel.example/dresden", description: "Wasserstand" }),
            delta({ type: "tool_reference", tool: "web_search", title: "Pegel Dresden", url: "https://pegel.example/dresden" }),
            delta({ type: "text", text: '"x"}' }),
            fertig({ prompt_tokens: 1000, completion_tokens: 200, total_tokens: 1200, connector_tokens: 300, connectors: { web_search: 1 } }),
          ]),
        ),
    ]);
    const a = new MistralAnbieter("k", "https://api.test", abruf);
    const r = await a.senden({ ...anfrage, werkzeuge: { websuche: { maxUses: 5 } }, fortschritt: (f) => void fortschritt.push(f.art) });
    expect(urls).toEqual(["https://api.test"]);
    expect(kopf[0].authorization).toBe("Bearer k");
    expect(r.text).toBe('{"a":"x"}');
    expect(r.modell).toBe("mistral-medium-3-5");
    expect(r.suchen).toEqual(["Hochwasser Elbe"]);
    expect(r.abrufe).toEqual([]);
    expect(r.fundstellen).toEqual([{ url: "https://pegel.example/dresden", titel: "Pegel Dresden" }]);
    expect(r.zitate).toHaveLength(2);
    expect(r.zitate[0]).toEqual({ url: "https://pegel.example/dresden", titel: "Pegel Dresden", text: "Wasserstand" });
    // Eingabe = prompt_tokens + connector_tokens (vorsichtig), keine Cache-Angaben
    expect(r.nutzung).toEqual({ eingabe: 1300, ausgabe: 200, cacheSchreiben: 0, cacheLesen: 0, websuchen: 1, abrufe: 0 });
    // 1300 × 1,5 + 200 × 7,5 je Million = 0,00345 USD; dazu eine Websuche zu 0,03 USD
    expect(r.kostenUsd).toBeCloseTo(0.00195 + 0.0015 + 0.03, 10);
    expect(r.stopGrund).toBe("end_turn");
    expect(r.runden).toBe(1);
    expect(r.inhalt[0]).toEqual({ type: "ki-lead.parameter", anbieter: "mistral", reasoning_effort: "medium", websuche_hoechstzahl_durchgesetzt: false });
    expect(fortschritt).toEqual(expect.arrayContaining(["denkt", "suche", "schreibt"]));
  });

  it("meldet eine Antwort an der Ausgabegrenze als max_tokens", async () => {
    const { abruf } = attrappe([() => strom(sse([delta("abgeschnit"), fertig({ prompt_tokens: 10, completion_tokens: 5000, total_tokens: 5010 })]))]);
    const r = await new MistralAnbieter("k", "https://api.test", abruf).senden(anfrage);
    expect(r.stopGrund).toBe("max_tokens");
  });

  it("zählt Websuchen aus usage.connectors, wenn der Strom keine Werkzeugereignisse zeigt", () => {
    expect(nutzungMistral({ prompt_tokens: 1, completion_tokens: 2, connectors: { web_search: 3, code_interpreter: 9 } }, 1).websuchen).toBe(3);
    expect(nutzungMistral({ prompt_tokens: 1, completion_tokens: 2 }, 2).websuchen).toBe(2);
  });

  it("ein Fehlerereignis im Strom wird zur deutschen Meldung ohne Wiederholung", async () => {
    const { abruf, koerper } = attrappe([() => strom(sse([delta("Teil"), { type: "conversation.response.error", message: "kaputt", code: 500 }]))]);
    await expect(new MistralAnbieter("k", "https://api.test", abruf).senden(anfrage)).rejects.toThrow(/Mistral ist gerade gestört.*kaputt/);
    expect(koerper).toHaveLength(1);
  });
});

describe("Mistral: Fehler und Wiederholungen", () => {
  it("abgelehnter Schlüssel mit flacher Fehlerantwort von Mistral", async () => {
    const { abruf } = attrappe([() => new Response(JSON.stringify({ message: "Unauthorized", request_id: "r" }), { status: 401 })]);
    await expect(new MistralAnbieter("k", "https://api.test", abruf).senden(anfrage)).rejects.toThrow(
      "Der Mistral-Schlüssel wurde abgelehnt. Bitte unter „Einstellungen“ prüfen. (Unauthorized)",
    );
  });

  it("422 mit Liste in „detail“ nennt die Feldfehler", async () => {
    const { abruf } = attrappe([() => new Response(JSON.stringify({ detail: [{ msg: "field required", loc: ["body", "inputs"] }] }), { status: 422 })]);
    await expect(new MistralAnbieter("k", "https://api.test", abruf).senden(anfrage)).rejects.toThrow(
      "Die Anfrage wurde von Mistral abgelehnt (field required).",
    );
  });

  it("lehnt das Modell die Stufe des Nachdenkens ab, folgt genau ein Versuch mit der groben Stufe; das Laufprotokoll nennt sie", async () => {
    const { abruf, koerper } = attrappe([
      () => fehlerAntwort(400, { message: "Invalid reasoning_effort for this model", type: "invalid_request_error" }),
      () => strom(sse([delta("ok"), fertig({ prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 })])),
    ]);
    const r = await ohneWarten(() => new MistralAnbieter("k", "https://api.test", abruf).senden({ ...anfrage, aufwand: "xhigh" }));
    expect(r.wert!.text).toBe("ok");
    expect(koerper.map((k) => k.completion_args.reasoning_effort)).toEqual(["xhigh", "high"]);
    expect(r.wert!.inhalt[0].reasoning_effort).toBe("high");
    expect(r.dauerMs).toBe(0);
  });

  it("niedriger Aufwand fällt auf „none“ zurück; ein zweites Ablehnen wird gemeldet statt wiederholt", async () => {
    const ablehnung = () => fehlerAntwort(422, { message: "reasoning_effort not supported" });
    const { abruf, koerper } = attrappe([ablehnung, ablehnung]);
    const r = await ohneWarten(() => new MistralAnbieter("k", "https://api.test", abruf).senden({ ...anfrage, aufwand: "low" }));
    expect(r.fehler?.message).toMatch(/von Mistral abgelehnt/);
    expect(koerper.map((k) => k.completion_args.reasoning_effort)).toEqual(["low", "none"]);
  });

  it("stellt die Anfrage nach einem Stromabbruch neu", async () => {
    const { abruf, koerper } = attrappe([
      () => abreissenderStrom(sse([delta("Teil")])),
      () => strom(sse([delta("ganz"), fertig({ prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 })])),
    ]);
    const r = await ohneWarten(() => new MistralAnbieter("k", "https://api.test", abruf).senden(anfrage));
    expect(r.wert!.text).toBe("ganz");
    expect(koerper).toHaveLength(2);
    expect(r.dauerMs).toBe(1500);
  });

  it("ein Strom ohne Abschlussereignis gilt als abgebrochen und wird neu gestellt", async () => {
    const { abruf, koerper } = attrappe([
      () => strom(sse([delta("Teil")])),
      () => strom(sse([delta("ganz"), fertig({ prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 })])),
    ]);
    const r = await ohneWarten(() => new MistralAnbieter("k", "https://api.test", abruf).senden(anfrage));
    expect(r.wert!.text).toBe("ganz");
    expect(koerper).toHaveLength(2);
  });

  it("dauerhafter Netzwerkfehler nennt auch eine mögliche Sperre des direkten Aufrufs im Browser", async () => {
    const abruf = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    const r = await ohneWarten(() => new MistralAnbieter("k", "https://api.test", abruf).senden(anfrage));
    expect(r.fehler?.message).toMatch(/Keine Verbindung zu Mistral\. Netz prüfen\..*api\.mistral\.ai blockiert/);
  });
});
