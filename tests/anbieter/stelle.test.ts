// Endpunkt der Stelle (seit 0.6.17, TP-2026-W44-49): Chat Completions mit gefälschtem fetch. Anfragekörper, Strom,
// Nutzung und Kosten nach den Preisen der Konfiguration, Fehlertexte mit dem Namen des Dienstes, PDF-Abweisung, Adresse
// außerhalb der Konfiguration. Echte Aufrufe prüft die Mistral-Probe (tests/probe/stelle.spec.ts).

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { betriebFuerTests, betriebPruefen } from "../../src/anbieter/betrieb";
import { anfrageKoerperStelle, STELLE_PDF_HINWEIS, StelleAnbieter } from "../../src/anbieter/stelle";
import type { LlmAnfrage } from "../../src/anbieter/typen";
import { LEERE_SCHLUESSEL, Verteiler } from "../../src/anbieter/verteiler";
import { fehlerAntwort, sseAntwort } from "../support/anbieter";

const KONFIG = betriebPruefen({
  format: "ki-lead-betrieb/1",
  bezeichnung: "Test",
  anbieter: ["stelle"],
  stelle: { name: "KI-Dienst Test", basisUrl: "https://ki.example.de/v1/", modell: "llama-3.3-70b", preise: { eingabe: 1, ausgabe: 2 } },
});

const anfrage: LlmAnfrage = {
  modell: "stelle:llama-3.3-70b",
  maxTokens: 5000,
  aufwand: "high",
  system: [{ text: "Teil A", cache: true }, { text: "Teil B" }],
  nachrichten: [
    {
      role: "user",
      content: [
        { type: "text", text: "Frage" },
        { type: "document", source: { type: "text", media_type: "text/plain", data: "Inhalt" }, title: "notiz.txt" },
      ],
    },
  ],
  jsonSchema: { type: "object", properties: { a: { type: "string" } }, required: ["a"] },
  werkzeuge: { websuche: { maxUses: 3 }, abruf: { maxUses: 3 } },
};

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

const stueck = (content: string) => ({
  object: "chat.completion.chunk",
  model: "llama-3.3-70b",
  choices: [{ index: 0, delta: { content }, finish_reason: null }],
});
const ende = (finish_reason: string, usage?: object) => ({
  model: "llama-3.3-70b",
  choices: [{ index: 0, delta: { content: "" }, finish_reason }],
  ...(usage ? { usage } : {}),
});
const strom = (teile: object[]) => sseAntwort(teile.map((t) => `data: ${JSON.stringify(t)}\n\n`).join("") + "data: [DONE]\n\n", 1);

beforeEach(() => betriebFuerTests({ konfiguration: KONFIG, sha256: "a".repeat(64) }));
afterEach(() => betriebFuerTests(null));

describe("TP-2026-W44-49: Endpunkt der Stelle über Chat Completions", () => {
  it("Anfragekörper: Modell ohne Präfix, System zuerst, Text statt Blöcken, strenges Schema, ohne Werkzeuge und Aufwand", () => {
    const b = anfrageKoerperStelle(anfrage);
    expect(b.model).toBe("llama-3.3-70b");
    expect(b.messages).toEqual([
      { role: "system", content: "Teil A\n\nTeil B" },
      { role: "user", content: "Frage\n\n# notiz.txt\n\nInhalt" },
    ]);
    expect(b.max_tokens).toBe(5000);
    expect(b.stream).toBe(true);
    expect(b.response_format.type).toBe("json_schema");
    expect(b.response_format.json_schema.strict).toBe(true);
    expect(b.response_format.json_schema.schema.additionalProperties).toBe(false);
    expect(b).not.toHaveProperty("reasoning_effort");
    expect(b).not.toHaveProperty("tools");
  });

  it("sendet an <basisUrl>/chat/completions mit Bearer-Schlüssel; Text, Nutzung, Kosten und Protokoll aus dem Strom", async () => {
    const a = attrappe([() => strom([stueck('{"a":'), stueck('"x"}'), ende("stop", { prompt_tokens: 1_000_000, completion_tokens: 2_000 })])]);
    const antwort = await new StelleAnbieter("geheim", KONFIG.stelle, a.abruf).senden(anfrage);
    expect(a.urls).toEqual(["https://ki.example.de/v1/chat/completions"]);
    expect(a.kopf[0]!.authorization).toBe("Bearer geheim");
    expect(antwort.text).toBe('{"a":"x"}');
    expect(antwort.modell).toBe("stelle:llama-3.3-70b");
    expect(antwort.nutzung).toMatchObject({ eingabe: 1_000_000, ausgabe: 2_000, websuchen: 0 });
    expect(antwort.kostenUsd).toBeCloseTo(1 + 0.004, 6);
    expect(antwort.stopGrund).toBe("end_turn");
    expect(antwort.inhalt[0]).toEqual({ type: "ki-lead.parameter", anbieter: "stelle", endpunkt: "ki.example.de", websuche: false });
    expect(antwort.suchen).toEqual([]);
  });

  it("ohne Nutzungsangaben bleiben die Kosten unbekannt; „length“ gilt als abgeschnitten", async () => {
    const a = attrappe([() => strom([stueck("abc"), ende("length")])]);
    const antwort = await new StelleAnbieter("k", KONFIG.stelle, a.abruf).senden(anfrage);
    expect(antwort.kostenUsd).toBeNull();
    expect(antwort.stopGrund).toBe("max_tokens");
  });

  it("Fehlertexte nennen den Dienst; 401 wird nicht wiederholt", async () => {
    const a = attrappe([() => fehlerAntwort(401, { error: { message: "invalid api key", type: "auth" } })]);
    const fehler = await new StelleAnbieter("k", KONFIG.stelle, a.abruf).senden(anfrage).catch((e: Error) => e);
    expect((fehler as Error).message).toMatch(/^Der Schlüssel für „KI-Dienst Test“ wurde abgelehnt\. Bitte unter „Einstellungen“ prüfen\./);
    expect(a.urls).toHaveLength(1);
  });

  it("PDF-Material wird vor dem Senden mit Hinweis abgewiesen", async () => {
    const a = attrappe([]);
    const mitPdf: LlmAnfrage = {
      ...anfrage,
      nachrichten: [
        { role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: "JVBERi0=" }, title: "a.pdf" }] },
      ],
    };
    await expect(new StelleAnbieter("k", KONFIG.stelle, a.abruf).senden(mitPdf)).rejects.toThrow(STELLE_PDF_HINWEIS);
    expect(a.urls).toEqual([]);
  });

  it("eine Adresse außerhalb der Konfiguration wird nicht angesprochen", async () => {
    const a = attrappe([]);
    const fremd = { ...KONFIG.stelle!, basisUrl: "https://anderer.example.de/v1" };
    await expect(new StelleAnbieter("k", fremd, a.abruf).senden(anfrage)).rejects.toThrow(/nicht freigegeben/);
    betriebFuerTests(null);
    await expect(new StelleAnbieter("k", KONFIG.stelle, a.abruf).senden(anfrage)).rejects.toThrow(/nicht freigegeben/);
    expect(a.urls).toEqual([]);
  });

  it("der Verteiler baut für „stelle:…“ den Adapter der Stelle und verlangt einen Schlüssel", async () => {
    await expect(new Verteiler(LEERE_SCHLUESSEL).senden(anfrage)).rejects.toThrow(/Für Endpunkt der Stelle \(stelle:llama-3.3-70b\) ist kein API-Schlüssel/);
    const gebaut: string[] = [];
    const v = new Verteiler({ ...LEERE_SCHLUESSEL, stelle: "s" }, (id) => {
      gebaut.push(id);
      return { id, senden: async () => ({ text: id }) as any };
    });
    expect((await v.senden(anfrage)).text).toBe("stelle");
    expect(gebaut).toEqual(["stelle"]);
  });
});
