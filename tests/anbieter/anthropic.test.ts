// Anthropic-Adapter: Anfragekörper, Stromauswertung, pause_turn, Wiederholungen, Abruffehler, Verbindungsabbruch.
import { describe, expect, it } from "vitest";
import { abreissenderStrom, ohneWarten, sseAntwort as stromAntwort, sseText as sse } from "../support/anbieter";
import { AnthropicAnbieter, anfrageKoerper } from "../../src/anbieter/anthropic";
import { AnbieterFehler, type LlmAnfrage } from "../../src/anbieter/typen";

const RECHERCHE = [
  {
    type: "message_start",
    message: { model: "claude-sonnet-5-5", usage: { input_tokens: 1000, cache_creation_input_tokens: 5000, cache_read_input_tokens: 0, output_tokens: 1 } },
  },
  { type: "content_block_start", index: 0, content_block: { type: "server_tool_use", id: "srv1", name: "web_search", input: {} } },
  { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"query":"Orkan' } },
  { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: ' Ilka Schäden"}' } },
  { type: "content_block_stop", index: 0 },
  {
    type: "content_block_start",
    index: 1,
    content_block: {
      type: "web_search_tool_result",
      tool_use_id: "srv1",
      content: [{ type: "web_search_result", url: "https://beispiel.invalid/a", title: "Bericht A", encrypted_content: "xyz", page_age: "14.10.2026" }],
    },
  },
  { type: "content_block_stop", index: 1 },
  { type: "content_block_start", index: 2, content_block: { type: "text", text: "" } },
  { type: "content_block_delta", index: 2, delta: { type: "text_delta", text: "Kernaussage: " } },
  {
    type: "content_block_delta",
    index: 2,
    delta: {
      type: "citations_delta",
      citation: { type: "web_search_result_location", url: "https://beispiel.invalid/a", title: "Bericht A", cited_text: "Schäden" },
    },
  },
  { type: "content_block_delta", index: 2, delta: { type: "text_delta", text: "Lage stabil." } },
  { type: "content_block_stop", index: 2 },
  { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2000, server_tool_use: { web_search_requests: 1 } } },
  { type: "message_stop" },
];

const anfrage: LlmAnfrage = {
  modell: "claude-sonnet-5-5",
  maxTokens: 1000,
  aufwand: "high",
  system: [{ text: "fest", cache: true }, { text: "variabel" }],
  nachrichten: [{ role: "user", content: "Los" }],
  werkzeuge: { websuche: { maxUses: 5, land: "DE", zeitzone: "Europe/Berlin" }, abruf: { maxUses: 3 } },
};

describe("Anthropic-Anbieter", () => {
  it("baut den Anfragekörper mit Cache, Werkzeugen und Aufwand", () => {
    const b = anfrageKoerper({ ...anfrage, jsonSchema: { type: "object" } });
    expect(b.stream).toBe(true);
    expect(b.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(b.system[1].cache_control).toBeUndefined();
    expect(b.tools.map((t: any) => t.type)).toEqual(["web_search_20250305", "web_fetch_20250910"]);
    expect(b.tools[0].user_location).toEqual({ type: "approximate", country: "DE", timezone: "Europe/Berlin" });
    expect(b.output_config).toEqual({ effort: "high", format: { type: "json_schema", schema: { type: "object" } } });
  });

  it("liest einen Strom mit Websuche, Zitaten und Nutzung", async () => {
    const aufrufe: any[] = [];
    const fortschritt: string[] = [];
    const a = new AnthropicAnbieter("sk-test", "https://api.test/v1/messages", (async (_url: any, init: any) => {
      aufrufe.push({ headers: init.headers, body: JSON.parse(init.body) });
      return stromAntwort(sse(RECHERCHE));
    }) as any);
    const r = await a.senden({ ...anfrage, fortschritt: (f) => fortschritt.push(f.art) });
    expect(aufrufe[0].headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
    expect(aufrufe[0].headers["x-api-key"]).toBe("sk-test");
    expect(r!.text).toBe("Kernaussage: Lage stabil.");
    expect(r.suchen).toEqual(["Orkan Ilka Schäden"]);
    expect(r.fundstellen).toEqual([{ url: "https://beispiel.invalid/a", titel: "Bericht A", stand: "14.10.2026" }]);
    expect(r.zitate[0].text).toBe("Schäden");
    expect(r.nutzung).toEqual({ eingabe: 1000, ausgabe: 2000, cacheSchreiben: 5000, cacheLesen: 0, websuchen: 1, abrufe: 0 });
    // 1000×2 + 5000×2,5 + 2000×10 je Mio. Token + 1 Suche × 0,01 USD
    expect(r.kostenUsd).toBeCloseTo((2000 + 12500 + 20000) / 1e6 + 0.01, 8);
    expect(fortschritt).toContain("suche");
    expect(fortschritt).toContain("schreibt");
    expect(r.inhalt[1].content[0].encrypted_content).toBe("xyz");
  });

  it("setzt pause_turn fort und schickt die angehaltene Runde unverändert zurück", async () => {
    const koerper: any[] = [];
    let n = 0;
    const pause = RECHERCHE.slice(0, 7).concat([{ type: "message_delta", delta: { stop_reason: "pause_turn" }, usage: { output_tokens: 50 } } as any]);
    const a = new AnthropicAnbieter("k", "https://api.test", (async (_u: any, init: any) => {
      koerper.push(JSON.parse(init.body));
      const fortsetzung = [RECHERCHE[0], ...RECHERCHE.slice(7).map((e: any) => ("index" in e ? { ...e, index: e.index - 2 } : e))];
      return stromAntwort(sse(n++ === 0 ? pause : fortsetzung));
    }) as any);
    const r = await a.senden(anfrage);
    expect(koerper).toHaveLength(2);
    expect(koerper[1].messages).toHaveLength(2);
    expect(koerper[1].messages[1].role).toBe("assistant");
    expect(koerper[1].messages[1].content.map((b: any) => b.type)).toEqual(["server_tool_use", "web_search_tool_result"]);
    expect(koerper[1].messages[1].content[0].input).toEqual({ query: "Orkan Ilka Schäden" });
    expect(r.runden).toBe(2);
    expect(r!.text).toBe("Kernaussage: Lage stabil.");
    expect(r.suchen).toEqual(["Orkan Ilka Schäden"]);
  });

  it("wiederholt bei Überlastung und meldet Schlüsselfehler verständlich", async () => {
    let n = 0;
    const a = new AnthropicAnbieter("k", "https://api.test", (async () => {
      if (n++ === 0)
        return new Response(JSON.stringify({ error: { type: "overloaded_error", message: "Overloaded" } }), {
          status: 529,
          headers: { "retry-after": "0.01" },
        });
      return stromAntwort(sse(RECHERCHE));
    }) as any);
    const r = await ohneWarten(() => a.senden(anfrage));
    expect(r.wert!.text).toContain("Lage stabil");
    expect(n).toBe(2);
    expect(r.dauerMs).toBe(10); // retry-after 0.01 s

    const b = new AnthropicAnbieter(
      "falsch",
      "https://api.test",
      (async () => new Response(JSON.stringify({ error: { type: "authentication_error", message: "invalid x-api-key" } }), { status: 401 })) as any,
    );
    await expect(b.senden(anfrage)).rejects.toThrow(AnbieterFehler);
    await expect(b.senden(anfrage)).rejects.toThrow(/API-Schlüssel wurde abgelehnt/);
  });
});

describe("Abruffehler", () => {
  it("ordnet verweigerte Abrufe ihrer URL zu und begrenzt die Seitenlänge", async () => {
    const { auswerten } = await import("../../src/anbieter/anthropic");
    const a = auswerten([
      { type: "server_tool_use", id: "f1", name: "web_fetch", input: { url: "https://www.ndr.de/x.html" } },
      { type: "web_fetch_tool_result", tool_use_id: "f1", content: { type: "web_fetch_tool_result_error", error_code: "url_not_allowed" } },
    ]);
    expect(a.abrufFehler).toEqual([{ url: "https://www.ndr.de/x.html", code: "url_not_allowed" }]);
    const b = anfrageKoerper({ ...anfrage, werkzeuge: { abruf: { maxUses: 3, maxTokens: 15000 } } });
    expect(b.tools[0]).toMatchObject({ type: "web_fetch_20250910", max_content_tokens: 15000 });
  });
});

describe("Verbindungsabbruch", () => {
  // Suche mit Ergebnis vollständig, dann reißt die Verbindung im Text ab
  const BIS_ERGEBNIS = sse(RECHERCHE.slice(0, 7)) + sse([RECHERCHE[7], RECHERCHE[8]]);

  it("setzt nach Abbruch mit vollständigem Suchergebnis fort", async () => {
    const koerper: any[] = [];
    let n = 0;
    const fortschritt: string[] = [];
    const a = new AnthropicAnbieter("k", "https://api.test", (async (_u: any, init: any) => {
      koerper.push(JSON.parse(init.body));
      if (n++ === 0) return abreissenderStrom(BIS_ERGEBNIS);
      const fortsetzung = [RECHERCHE[0], ...RECHERCHE.slice(7).map((e: any) => ("index" in e ? { ...e, index: e.index - 2 } : e))];
      return stromAntwort(sse(fortsetzung));
    }) as any);
    const { wert: r, dauerMs } = await ohneWarten(() => a.senden({ ...anfrage, fortschritt: (f) => f.art === "wiederholung" && fortschritt.push(f.grund) }));
    expect(dauerMs).toBe(1500);
    expect(koerper).toHaveLength(2);
    expect(koerper[1].messages[1].role).toBe("assistant");
    // halber Textblock ist nicht dabei, Suche und Ergebnis schon
    expect(koerper[1].messages[1].content.map((b: any) => b.type)).toEqual(["server_tool_use", "web_search_tool_result"]);
    expect(r!.text).toBe("Kernaussage: Lage stabil.");
    expect(fortschritt[0]).toMatch(/fortgesetzt/);
  });

  it("stellt die Anfrage ohne verwertbare Teilantwort neu und gibt nach drei Abbrüchen auf", async () => {
    const koerper: any[] = [];
    const a = new AnthropicAnbieter("k", "https://api.test", (async (_u: any, init: any) => {
      koerper.push(JSON.parse(init.body));
      return abreissenderStrom(sse(RECHERCHE.slice(0, 3)));
    }) as any);
    const { fehler, dauerMs } = await ohneWarten(() => a.senden(anfrage));
    expect(fehler?.message).toMatch(/Verbindung zum Anbieter ist während der Antwort abgerissen/);
    expect(koerper).toHaveLength(3);
    expect(dauerMs).toBe(2 * 1500);
    expect(koerper.every((k) => k.messages.length === 1)).toBe(true);
  });
});
