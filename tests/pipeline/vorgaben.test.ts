// Modellvorgaben nach der Testreihe vom 20.10.2026 (App und Beispielprofil).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { APP_MODELLE, modellFuer, STANDARD } from "../../src/pipeline/einstellungen";

describe("Vorgaben nach der Testreihe", () => {
  it("Erfassung mit Opus in App und Beispielprofil, S1 bleibt Haiku mit hohem Aufwand", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(APP_MODELLE.erfassung).toBe("claude-opus-5-5");
    expect(p!.manifest.modelle?.erfassung).toBe("claude-opus-5-5");
    expect(modellFuer("erfassung", STANDARD, p!)).toBe("claude-opus-5-5");
    expect(STANDARD.aufwand.erfassung).toBe("medium");
    expect(modellFuer("vorverarbeitung", STANDARD, p!)).toBe("claude-haiku-5-5");
    expect(STANDARD.aufwand.vorverarbeitung).toBe("high");
    // eine Wahl in den Einstellungen geht weiter vor
    expect(modellFuer("erfassung", { ...STANDARD, modelle: { ...STANDARD.modelle, erfassung: "claude-sonnet-5-5" } }, p!)).toBe("claude-sonnet-5-5");
  });
});
