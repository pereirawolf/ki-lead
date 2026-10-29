// Aufwand je Modell und Standard-Profile nach dem Vergleichslauf Ilka (seit 0.5.10, Befunde AV-2026-W43-01 bis -03, -10,
// -13, -14). Sollwerte fest: Stufen nach der Dokumentation der Anbieter (Stand 24.10.2026), Profile nach der Freigabe
// des Herausgebers vom 25.10.2026.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { profil, repoPfad } from "../support/dateien";
import { llmAntwort, skriptAnbieter } from "../support/anbieter";
import { pipelineKontext, s1Vorschlag } from "../support/pipeline";
import { aufwandStufenFuer, naechsteStufe } from "../../src/anbieter/aufwand";
import { anfrageKoerperMistralChat, mistralAufwand } from "../../src/anbieter/mistral";
import {
  APP_MODELLE,
  AUFWAND_STUFEN,
  aufwandAuswahl,
  aufwandFuer,
  MODELL_GRUPPEN,
  ROLLEN,
  STANDARD,
  STANDARD_PROFILE,
  type Einstellungen,
} from "../../src/pipeline/einstellungen";
import { konfiguration } from "../../src/pipeline/vergleichslauf";
import { stufe1 } from "../../src/pipeline/s1";

const ALLE = ["low", "medium", "high", "xhigh", "max"];

describe("AV-2026-W43-01: angebotene Stufen je Modell", () => {
  it("Anthropic und OpenAI alle fünf, Mistral nur niedrig (none) und hoch (high), unbekannte alle", () => {
    for (const m of ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1", "gpt-6-luna", "gpt-6.1-sol", "gpt-6-astra"])
      expect(aufwandStufenFuer(m), m).toEqual(ALLE);
    for (const m of ["mistral-small-2603", "mistral-medium-3-5", "mistral-large-4"]) expect(aufwandStufenFuer(m), m).toEqual(["low", "high"]);
    expect(aufwandStufenFuer("unbekannt-1")).toEqual(ALLE);
  });

  it("jedes Modell der Auswahl hat eine nichtleere Teilmenge der Stufen der App", () => {
    const ids = AUFWAND_STUFEN.map((a) => a.id as string);
    for (const m of MODELL_GRUPPEN.flatMap((g) => g.modelle)) {
      const s = aufwandStufenFuer(m);
      expect(s.length, m).toBeGreaterThan(0);
      for (const x of s) expect(ids, m).toContain(x);
    }
  });

  it("Auswahl mit deutscher Bezeichnung; bei Mistral mit und ohne Nachdenken", () => {
    expect(aufwandAuswahl("claude-opus-5-5").map((a) => a.titel)).toEqual(["niedrig", "mittel", "hoch", "sehr hoch", "maximal"]);
    expect(aufwandAuswahl("mistral-medium-3-5")).toEqual([
      { id: "low", titel: "niedrig – ohne Nachdenken" },
      { id: "high", titel: "hoch – mit Nachdenken" },
    ]);
  });

  it("an die Mistral-API gehen weiter nur none und high", () => {
    expect(["low", "medium", "high", "xhigh", "max"].map((a) => mistralAufwand(a as any))).toEqual(["none", "high", "high", "high", "high"]);
    expect(mistralAufwand(undefined)).toBeUndefined();
    const koerper = anfrageKoerperMistralChat({ modell: "mistral-medium-3-5", aufwand: "medium", maxTokens: 10, system: [], nachrichten: [] });
    expect(koerper.reasoning_effort).toBe("high");
  });
});

describe("AV-2026-W43-02: wirksame Stufe", () => {
  it("nächsthöhere angebotene Stufe, ohne höhere die nächstniedrigere", () => {
    expect(naechsteStufe("medium", ["low", "high"])).toBe("high");
    expect(naechsteStufe("max", ["low", "high"])).toBe("high");
    expect(naechsteStufe("low", ["low", "high"])).toBe("low");
    expect(naechsteStufe("max", ["low", "medium"])).toBe("medium");
    expect(naechsteStufe("medium", ALLE as any)).toBe("medium");
  });

  it("aufwandFuer folgt dem wirksamen Modell der Aufgabe", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const mistral: Einstellungen = { ...STANDARD, modelle: { ...STANDARD.modelle, verdichtung: "mistral-medium-3-5" } };
    expect(STANDARD.aufwand.verdichtung).toBe("medium");
    expect(aufwandFuer("verdichtung", mistral, p!)).toBe("high");
    expect(aufwandFuer("verdichtung", { ...mistral, aufwand: { ...mistral.aufwand, verdichtung: "low" } }, p!)).toBe("low");
    // Anthropic: jede Stufe bleibt
    for (const a of ALLE) expect(aufwandFuer("verdichtung", { ...STANDARD, aufwand: { ...STANDARD.aufwand, verdichtung: a as any } }, p!)).toBe(a);
  });

  it("Laufprotokoll und Anfrage nennen die tatsächlich gesendete Stufe", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att);
    k.einstellungen = {
      ...STANDARD,
      modelle: { ...STANDARD.modelle, vorverarbeitung: "mistral-small-2603" },
      aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium" },
    };
    await stufe1(k);
    expect(att.anfragen[0].aufwand).toBe("high");
    expect(k.lauf.stufen[0].aufwand).toBe("high");
  });

  it("die Konfiguration des Vergleichslaufs nennt die wirksame Stufe", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const e: Einstellungen = { ...STANDARD, modelle: { ...STANDARD.modelle, vorverarbeitung: "mistral-small-2603", verdichtung: "mistral-large-4" } };
    const k = konfiguration({ ...e, aufwand: { ...e.aufwand, vorverarbeitung: "max", verdichtung: "medium" } }, p!);
    expect([k.s1.aufwand, k.s2.aufwand]).toEqual(["high", "high"]);
  });
});

describe("Standard-Profile und App-Vorgabe nach dem Vergleichslauf Ilka", () => {
  it("AV-2026-W43-03: jede Stufe der Standard-Profile ist für das Modell der Aufgabe angeboten", () => {
    for (const [anbieter, p] of Object.entries(STANDARD_PROFILE))
      for (const r of ROLLEN) expect(aufwandStufenFuer(p.modelle[r]), `${anbieter} ${r}`).toContain(p.aufwand[r]);
    expect(STANDARD_PROFILE.mistral.aufwand).toEqual({
      vorverarbeitung: "high",
      erfassung: "high",
      verdichtung: "high",
      reparatur: "low",
      kurzfassung: "high",
    });
  });

  it("AV-2026-W43-13, -37: OpenAI verdichtet und erfasst seit 0.5.15 mit gpt-6-astra „high“", () => {
    expect([STANDARD_PROFILE.openai.modelle.verdichtung, STANDARD_PROFILE.openai.aufwand.verdichtung]).toEqual(["gpt-6-astra", "high"]);
    expect([STANDARD_PROFILE.openai.modelle.erfassung, STANDARD_PROFILE.openai.aufwand.erfassung]).toEqual(["gpt-6-astra", "high"]);
  });

  it("AV-2026-W43-32, -39: Reparatur Anthropic mit Haiku, OpenAI mit sol, Mistral mit Small, jeweils „low“", () => {
    expect([STANDARD_PROFILE.anthropic.modelle.reparatur, STANDARD_PROFILE.openai.modelle.reparatur, STANDARD_PROFILE.mistral.modelle.reparatur]).toEqual([
      "claude-haiku-5-5",
      "gpt-6.1-sol",
      "mistral-small-2603",
    ]);
    expect(Object.values(STANDARD_PROFILE).map((s) => s.aufwand.reparatur)).toEqual(["low", "low", "low"]);
    expect(readFileSync(repoPfad("evaluation/abnahmen/2026-10-25-reparatur-ilka-ergebnis.md"), "utf-8")).toContain("# Prüffall Reparatur");
  });

  it("AV-2026-W43-14: Mistral verdichtet weiter mit mistral-medium-3-5", () => {
    expect(STANDARD_PROFILE.mistral.modelle.verdichtung).toBe("mistral-medium-3-5");
  });

  it("AV-2026-W43-13, -14: der Kommentar begründet die Wahl mit dem Ergebnisbericht und nennt die zweitbeste Option", () => {
    const quelle = readFileSync(repoPfad("src/pipeline/einstellungen.ts"), "utf-8");
    expect(quelle).toContain("evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md");
    expect(quelle).toMatch(/Variante C, zweitbeste Option/);
    expect(quelle).toMatch(/Variante F, zweitbeste Option/);
    expect(readFileSync(repoPfad("evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md"), "utf-8")).toContain("# Vergleichslauf Ilka");
  });

  it("AV-2026-W43-10: die App-Vorgabe gleicht dem Standard-Profil Anthropic, Verdichtung mit Opus", () => {
    expect(APP_MODELLE).toEqual(STANDARD_PROFILE.anthropic.modelle);
    expect(APP_MODELLE.verdichtung).toBe("claude-opus-5-5");
  });
});
