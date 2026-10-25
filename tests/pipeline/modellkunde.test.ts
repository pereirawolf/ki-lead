// Angaben zu den Modellen in der Wahl je Lauf (seit 0.5.22): Anzeigenamen, Kostenklasse, Vermerke aus den Testläufen.
// Vorschläge zu „Modelle für diesen Lauf“ vom 25.10.2026, Punkte 1 und 4. Soll als feste Werte aus den Ergebnisberichten.
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MODELL_AUSWAHL } from "../../src/pipeline/einstellungen";
import { kostenklasse, modellName, preisSatz, VERMERKE, vermerkFuer } from "../../src/pipeline/modellkunde";

describe("Punkt 1: Anzeigenamen", () => {
  it("jedes wählbare Modell hat einen Namen; unbekannte Modelle behalten ihre Kennung", () => {
    for (const m of MODELL_AUSWAHL) expect(modellName(m), m).not.toBe(m);
    expect(modellName("claude-opus-5-5")).toBe("Opus 5.5");
    expect(modellName("gpt-6.1-sol")).toBe("GPT-6.1 Sol");
    expect(modellName("mistral-small-2603")).toBe("Mistral Small 4");
    expect(modellName("eigenes-modell-1")).toBe("eigenes-modell-1");
  });
});

describe("Punkt 4: Kostenklasse nach Listenpreis der Ausgabe", () => {
  it("niedrig bis 1, mittel bis 12, hoch bis 25, darüber sehr hoch (USD je Million)", () => {
    expect(kostenklasse("claude-haiku-5-5")).toBe("niedrig"); // 0,5
    expect(kostenklasse("mistral-small-2603")).toBe("niedrig"); // 0,6
    expect(kostenklasse("mistral-large-4")).toBe("mittel"); // 4,18
    expect(kostenklasse("claude-sonnet-5-5")).toBe("mittel"); // 10
    expect(kostenklasse("claude-opus-5-5")).toBe("hoch"); // 20
    expect(kostenklasse("claude-fable-5-1")).toBe("sehr hoch"); // 50
    expect(kostenklasse("gpt-6-astra")).toBe("sehr hoch"); // 50
    expect(kostenklasse("unbekannt")).toBeNull();
    expect(preisSatz("claude-opus-5-5")).toBe("Listenpreis 20 USD je Million Ausgabetoken.");
  });
});

describe("Punkt 4: Vermerke aus den vergleichenden Testläufen", () => {
  it("nennen nur, was die Berichte feststellen", () => {
    expect(vermerkFuer("vorverarbeitung", "gpt-6-luna")?.art).toBe("vorn");
    expect(vermerkFuer("vorverarbeitung", "mistral-small-2603")).toBeUndefined();
    expect(vermerkFuer("verdichtung", "claude-opus-5-5")).toMatchObject({ art: "vorn", aufwand: "medium" });
    expect(vermerkFuer("verdichtung", "claude-sonnet-5-5")?.art).toBe("bewährt");
    expect(vermerkFuer("verdichtung", "gpt-6-astra")).toBeUndefined();
    expect(vermerkFuer("reparatur", "gpt-6-luna")).toBeUndefined();
    expect(vermerkFuer("kurzfassung", "claude-sonnet-5-5")?.art).toBe("vorn");
    // Für die Erfassung (S2 Recherche und Entwurf) gibt es noch keine Vergleichsläufe
    expect(VERMERKE.filter((v) => v.rolle === "erfassung")).toEqual([]);
  });

  it("jeder Vermerk verweist auf einen vorhandenen Ergebnisbericht und ein wählbares Modell", () => {
    for (const v of VERMERKE) {
      expect(existsSync(`evaluation/abnahmen/${v.bericht}`), v.bericht).toBe(true);
      expect(MODELL_AUSWAHL).toContain(v.modell);
    }
  });
});
