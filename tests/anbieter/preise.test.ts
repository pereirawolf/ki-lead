// Preise der Modelle (Anthropic-Staffel, OpenAI, seit 0.5.6 Mistral mit eigenem Preis je Websuche).
import { describe, expect, it } from "vitest";
import { aufschlag, ausgabePreis, kostenAnfrage } from "../../src/anbieter/preise";
import { aufschlagFuer } from "../../src/anbieter/verteiler";

describe("Preise", () => {
  it("rechnet Haiku oberhalb von 100 000 Token mit dem höheren Satz", () => {
    const n = { eingabe: 150_000, ausgabe: 1000, cacheSchreiben: 0, cacheLesen: 0, websuchen: 0, abrufe: 0 };
    expect(kostenAnfrage("claude-haiku-5-5", n)).toBeCloseTo((150_000 * 0.5 + 1000 * 2.5) / 1e6, 10);
    expect(kostenAnfrage("unbekannt", n)).toBeNull();
  });
});

describe("Verteiler", () => {
  it("kennt OpenAI-Preise", () => {
    expect(kostenAnfrage("gpt-6-luna", { eingabe: 1_000_000, ausgabe: 1_000_000, cacheLesen: 0, cacheSchreiben: 0, websuchen: 0, abrufe: 0 })).toBeCloseTo(0.6);
  });
});

describe("Mistral", () => {
  const leer = { eingabe: 0, ausgabe: 0, cacheLesen: 0, cacheSchreiben: 0, websuchen: 0, abrufe: 0 };
  it("kennt die Listenpreise vom 24.10.2026 (USD je Million Token: Eingabe/Ausgabe)", () => {
    const million = { ...leer, eingabe: 1_000_000, ausgabe: 1_000_000 };
    expect(kostenAnfrage("mistral-small-2603", million)).toBeCloseTo(0.15 + 0.6, 10);
    expect(kostenAnfrage("mistral-medium-3-5", million)).toBeCloseTo(1.5 + 7.5, 10);
    expect(kostenAnfrage("mistral-large-4", million)).toBeCloseTo(1.36 + 4.18, 10);
  });

  it("rechnet die Websuche mit 0,03 USD statt 0,01 USD; Seitenabrufe kosten nichts extra", () => {
    expect(kostenAnfrage("mistral-small-2603", { ...leer, websuchen: 2, abrufe: 5 })).toBeCloseTo(0.06, 10);
    expect(kostenAnfrage("claude-sonnet-5-5", { ...leer, websuchen: 2 })).toBeCloseTo(0.02, 10);
  });

  it("AV-2026-W43-06: Aufschlag 1,1 nur für Mistral am EU-Endpunkt", () => {
    for (const m of ["mistral-small-2603", "mistral-medium-3-5", "mistral-large-4"]) {
      expect(aufschlagFuer(m, { mistral: { endpunkt: "eu" } }), m).toBe(1.1);
      expect(aufschlagFuer(m, { mistral: { endpunkt: "global" } }), m).toBe(1);
      expect(aufschlagFuer(m), m).toBe(1);
      // Preisregel allein: Faktor nur, wenn der regionale Endpunkt gewählt ist
      expect(aufschlag(m, true), m).toBe(1.1);
      expect(aufschlag(m, false), m).toBe(1);
    }
    for (const m of ["claude-opus-5-5", "gpt-6-astra", "ollama:llama3.1", "unbekannt"]) expect(aufschlagFuer(m, { mistral: { endpunkt: "eu" } }), m).toBe(1);
  });

  it("TP-2026-W44-26: lokale Modelle über Ollama kosten 0 USD, nicht „unbekannt“", () => {
    const viel = { ...leer, eingabe: 1_000_000, ausgabe: 1_000_000, cacheLesen: 50_000, websuchen: 3 };
    expect(kostenAnfrage("ollama:llama3.1", viel)).toBe(0);
    expect(kostenAnfrage("ollama:qwen3:32b", viel)).toBe(0);
    expect(ausgabePreis("ollama:llama3.1")).toBe(0);
    // ohne Präfix kein Preis
    expect(kostenAnfrage("llama3.1", viel)).toBeNull();
  });
});
