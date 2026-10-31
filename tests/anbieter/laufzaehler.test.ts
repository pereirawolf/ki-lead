// Zähler laufender KI-Anfragen (seit 0.6.12, KP-2026-W44-01): Soll nach der Entscheidung des Herausgebers vom
// 26./30.10.2026 – jede KI-Nutzung zählt vom Start bis zum Ende (Antwort, Fehler oder Abbruch), auch gleichzeitige.
import { describe, expect, it } from "vitest";
import { Verteiler } from "../../src/anbieter/verteiler";
import { abonniereAnfragen, anfrageBeginnt, laufendeAnfragen } from "../../src/anbieter/laufzaehler";
import type { LlmAnbieter, LlmAnfrage, LlmAntwort } from "../../src/anbieter/typen";

const anfrage = { modell: "claude-haiku-5-5", maxTokens: 10, system: [{ text: "x" }], nachrichten: [{ role: "user", content: "y" }] } as LlmAnfrage;

/** Anbieter, dessen Antwort der Test selbst auslöst */
function steuerbar() {
  const offen: { ja: (a: LlmAntwort) => void; nein: (e: Error) => void }[] = [];
  const anbieter: LlmAnbieter = { id: "a", senden: () => new Promise<LlmAntwort>((ja, nein) => offen.push({ ja, nein })) };
  return { offen, v: new Verteiler({ anthropic: "k", openai: "", mistral: "", stelle: "" }, () => anbieter) };
}

describe("KP-2026-W44-01: zentraler Zähler laufender KI-Anfragen", () => {
  it("zählt jede Anfrage über den Verteiler bis zur Antwort oder zum Fehler, auch gleichzeitige", async () => {
    const start = laufendeAnfragen();
    const verlauf: number[] = [];
    const ab = abonniereAnfragen((n) => verlauf.push(n - start));
    const { offen, v } = steuerbar();
    const p1 = v.senden(anfrage);
    const p2 = v.senden(anfrage);
    expect(laufendeAnfragen() - start).toBe(2);
    offen[0]!.ja({ text: "ok" } as LlmAntwort);
    await p1;
    expect(laufendeAnfragen() - start).toBe(1);
    offen[1]!.nein(new Error("abgebrochen"));
    await expect(p2).rejects.toThrow("abgebrochen");
    expect(laufendeAnfragen() - start).toBe(0);
    ab();
    expect(verlauf).toEqual([1, 2, 1, 0]);
  });

  it("eine abgelehnte Anfrage ohne Schlüssel oder mit unbekanntem Modell zählt nicht", async () => {
    const start = laufendeAnfragen();
    const v = new Verteiler({ anthropic: "", openai: "", mistral: "", stelle: "" });
    await expect(v.senden(anfrage)).rejects.toThrow(/kein API-Schlüssel/);
    await expect(v.senden({ ...anfrage, modell: "llama3" })).rejects.toThrow();
    expect(laufendeAnfragen()).toBe(start);
  });

  it("ein doppelter Abschluss senkt den Zähler nur einmal", () => {
    const start = laufendeAnfragen();
    const ende = anfrageBeginnt();
    ende();
    ende();
    expect(laufendeAnfragen()).toBe(start);
  });
});
