import { beforeEach, describe, expect, it, vi } from "vitest";
import { profil } from "../support/dateien";

const speicher = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: async (k: string) => structuredClone(speicher.get(k)),
  set: async (k: string, v: unknown) => void speicher.set(k, structuredClone(v)),
  del: async (k: string) => void speicher.delete(k),
}));

const {
  STANDARD,
  alleSchluesselLesen,
  einstellungenLesen,
  einstellungenSchreiben,
  laufModelle,
  mitModellwahl,
  modellFuer,
  schluesselLesen,
  schluesselSchreiben,
} = await import("../../src/pipeline/einstellungen");

describe("Vorgaben und Umstellung der Einstellungen", () => {
  beforeEach(() => speicher.clear());

  it("S1 arbeitet ab Fassung 3 mit hohem Aufwand", async () => {
    expect(STANDARD.aufwand.vorverarbeitung).toBe("high");
    expect(STANDARD.fassung).toBe(3);
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("high");
  });

  it("hebt die alte Vorgabe „medium“ aus Fassung 2 an", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 2, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium", verdichtung: "low" } });
    const e = await einstellungenLesen();
    expect(e.aufwand.vorverarbeitung).toBe("high");
    expect(e.aufwand.verdichtung).toBe("low");
    expect(e.fassung).toBe(3);
  });

  it("lässt eine bewusst andere Wahl stehen", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 2, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "low" } });
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("low");
  });

  it("stellt Fassung 1 in einem Schritt auf Fassung 3 um", async () => {
    speicher.set("einstellungen", { maxTokensErfassung: 64000, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium", erfassung: "high" } });
    const e = await einstellungenLesen();
    expect(e.maxTokensErfassung).toBe(128000);
    expect(e.aufwand.erfassung).toBe("medium");
    expect(e.aufwand.vorverarbeitung).toBe("high");
    expect(e.fassung).toBe(3);
  });

  it("nach Fassung 3 bleibt „medium“ eine bewusste Wahl", async () => {
    speicher.set("einstellungen", { ...STANDARD, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium" } });
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("medium");
  });
});

describe("mitModellwahl", () => {
  it("überschreibt nur gewählte Stufen und lässt die Einstellungen unverändert", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const e = { ...STANDARD, modelle: { ...STANDARD.modelle, erfassung: "claude-opus-5-5" } };
    expect(mitModellwahl(e, {})).toBe(e);
    expect(mitModellwahl(e, { vorverarbeitung: "" })).toBe(e);
    expect(mitModellwahl(e, { aufwand: {} })).toBe(e);
    const a = mitModellwahl(e, { aufwand: { erfassung: "high" }, websucheMax: 99 });
    expect(a.aufwand.erfassung).toBe("high");
    expect(a.aufwand.vorverarbeitung).toBe(e.aufwand.vorverarbeitung);
    expect(a.websucheMax).toBe(50);
    expect(mitModellwahl(e, { websucheMax: 0 }).websucheMax).toBe(0);
    expect(e.aufwand.erfassung).toBe("medium");
    const m = mitModellwahl(e, { vorverarbeitung: "gpt-6-luna" });
    expect(modellFuer("vorverarbeitung", m, p)).toBe("gpt-6-luna");
    expect(modellFuer("erfassung", m, p)).toBe("claude-opus-5-5");
    expect(e.modelle.vorverarbeitung).toBe("");
    expect(laufModelle(m, p, false)).toContain("gpt-6-luna");
  });
});

describe("API-Schlüssel je Anbieter", () => {
  beforeEach(() => speicher.clear());

  it("werden je Anbieter getrennt gesetzt, gelesen und gelöscht und nie mit den Einstellungen gespeichert", async () => {
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "", openai: "", mistral: "" });
    await schluesselSchreiben("sk-ant-A");
    await schluesselSchreiben("sk-oai-B", "openai");
    expect(await schluesselLesen()).toBe("sk-ant-A");
    expect(await schluesselLesen("openai")).toBe("sk-oai-B");
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "sk-oai-B", mistral: "" });

    // Ein leerer Wert löscht nur den Schlüssel dieses Anbieters
    await schluesselSchreiben("", "openai");
    expect(speicher.has("schluessel:openai")).toBe(false);
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "", mistral: "" });

    await einstellungenSchreiben(STANDARD);
    expect(JSON.stringify(speicher.get("einstellungen"))).not.toContain("sk-ant-A");
  });
});

describe("Standard-Profile je Anbieter", () => {
  it("nutzen nur Modelle des jeweiligen Anbieters mit Preisangabe und gültigem Aufwand", async () => {
    const { STANDARD_PROFILE, MODELL_GRUPPEN, AUFWAND_STUFEN, ROLLEN } = await import("../../src/pipeline/einstellungen");
    const { anbieterVon } = await import("../../src/anbieter/verteiler");
    const { ausgabePreis } = await import("../../src/anbieter/preise");
    const modelle = MODELL_GRUPPEN.flatMap((g) => g.modelle);
    for (const [anbieter, p] of Object.entries(STANDARD_PROFILE)) {
      for (const r of ROLLEN) {
        expect(modelle, `${anbieter} ${r}`).toContain(p.modelle[r]);
        expect(anbieterVon(p.modelle[r]), `${anbieter} ${r}`).toBe(anbieter);
        expect(ausgabePreis(p.modelle[r]), `${anbieter} ${r}: Preis`).not.toBeNull();
        expect(AUFWAND_STUFEN.map((a) => a.id)).toContain(p.aufwand[r]);
      }
    }
  });

  it("Anthropic entspricht den Vorgaben von App und Beispielprofil", async () => {
    const { STANDARD_PROFILE, modellFuer, ROLLEN } = await import("../../src/pipeline/einstellungen");
    const p = await profil("lead-beispiel");
    for (const r of ROLLEN) {
      expect(STANDARD_PROFILE.anthropic.modelle[r], r).toBe(modellFuer(r, STANDARD, p.profil!));
      expect(STANDARD_PROFILE.anthropic.aufwand[r], r).toBe(STANDARD.aufwand[r]);
    }
  });

  it("setzt nur Modelle und Aufwand und erkennt das aktive Profil", async () => {
    const { standardProfilAnwenden, standardProfilAktiv } = await import("../../src/pipeline/einstellungen");
    const start = { ...STANDARD, websucheMax: 3, maxTokensErfassung: 64000 };
    expect(standardProfilAktiv(start, "openai")).toBe(false);
    const neu = standardProfilAnwenden(start, "openai");
    expect(neu.websucheMax).toBe(3);
    expect(neu.maxTokensErfassung).toBe(64000);
    expect(standardProfilAktiv(neu, "openai")).toBe(true);
    expect(standardProfilAktiv(neu, "anthropic")).toBe(false);
    // Eine einzelne Abweichung hebt den Status auf
    expect(standardProfilAktiv({ ...neu, aufwand: { ...neu.aufwand, reparatur: "medium" } }, "openai")).toBe(false);
  });
});
