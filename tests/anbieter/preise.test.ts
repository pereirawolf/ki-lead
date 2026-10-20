// Preise der Modelle (Anthropic-Staffel, OpenAI).
import { describe, expect, it } from "vitest";
import { kostenAnfrage } from "../../src/anbieter/preise";

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
