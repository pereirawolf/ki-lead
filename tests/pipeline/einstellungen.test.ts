import { beforeEach, describe, expect, it, vi } from "vitest";
import { profil } from "../support/dateien";

const speicher = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: async (k: string) => structuredClone(speicher.get(k)),
  set: async (k: string, v: unknown) => void speicher.set(k, structuredClone(v)),
  del: async (k: string) => void speicher.delete(k),
}));

const {
  MIX_IDS,
  MIX_PROFILE,
  MODELL_AUSWAHL,
  ROLLEN,
  STANDARD,
  STANDARD_PROFILE_FASSUNG_3,
  aufwandStufenFuer,
  mixProfilAktiv,
  mixProfilAnwenden,
  standardProfilAktiv,
  alleSchluesselLesen,
  einstellungenLesen,
  einstellungenSchreiben,
  laufModelle,
  mitModellwahl,
  modellFuer,
  schluesselLesen,
  schluesselSchreiben,
  werkzeugeFuer,
} = await import("../../src/pipeline/einstellungen");

describe("Vorgaben und Umstellung der Einstellungen", () => {
  beforeEach(() => speicher.clear());

  it("S1 arbeitet ab Fassung 3 mit hohem Aufwand; neue Einstellungen tragen Fassung 5", async () => {
    expect(STANDARD.aufwand.vorverarbeitung).toBe("high");
    expect(STANDARD.fassung).toBe(5);
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("high");
  });

  it("hebt die alte Vorgabe „medium“ aus Fassung 2 an", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 2, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium", verdichtung: "low" } });
    const e = await einstellungenLesen();
    expect(e.aufwand.vorverarbeitung).toBe("high");
    expect(e.aufwand.verdichtung).toBe("low");
    expect(e.fassung).toBe(5);
  });

  it("Mistral-Endpunkt (seit 0.5.6): ohne gespeicherten Wert EU, eine Wahl bleibt, Fassung unverändert", async () => {
    const { mistralEndpunkt: _ohne, ...alt } = STANDARD;
    speicher.set("einstellungen", alt);
    const e = await einstellungenLesen();
    expect(e.mistralEndpunkt).toBe("eu");
    expect(e.fassung).toBe(5);
    speicher.set("einstellungen", { ...alt, mistralEndpunkt: "global" });
    expect((await einstellungenLesen()).mistralEndpunkt).toBe("global");
  });

  it("Werkzeuge je Modell und Endpunkt: Mistral EU keine, Mistral global nur Websuche, sonst beide", () => {
    expect(werkzeugeFuer("mistral-medium-3-5", { mistralEndpunkt: "eu" })).toEqual({ websuche: false, abruf: false });
    expect(werkzeugeFuer("mistral-medium-3-5", { mistralEndpunkt: "global" })).toEqual({ websuche: true, abruf: false });
    expect(werkzeugeFuer("claude-opus-5-5", { mistralEndpunkt: "eu" })).toEqual({ websuche: true, abruf: true });
    expect(werkzeugeFuer("gpt-6-astra", { mistralEndpunkt: "eu" })).toEqual({ websuche: true, abruf: true });
  });

  it("lässt eine bewusst andere Wahl stehen", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 2, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "low" } });
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("low");
  });

  it("stellt Fassung 1 in einem Schritt auf Fassung 5 um", async () => {
    speicher.set("einstellungen", { maxTokensErfassung: 64000, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium", erfassung: "high" } });
    const e = await einstellungenLesen();
    expect(e.maxTokensErfassung).toBe(128000);
    expect(e.aufwand.erfassung).toBe("medium");
    expect(e.aufwand.vorverarbeitung).toBe("high");
    expect(e.fassung).toBe(5);
  });

  it("nach Fassung 3 bleibt „medium“ eine bewusste Wahl", async () => {
    speicher.set("einstellungen", { ...STANDARD, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium" } });
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("medium");
  });

  // Soll unabhängig vom Code: die Standard-Profile bis 0.5.14 laut Spezifikation 0.5.14, Abschnitt 5.4
  const ALT_ANTHROPIC = {
    modelle: { vorverarbeitung: "claude-haiku-5-5", erfassung: "claude-opus-5-5", verdichtung: "claude-opus-5-5", reparatur: "claude-sonnet-5-5", kurzfassung: "claude-sonnet-5-5" },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  };
  const ALT_OPENAI = {
    modelle: { vorverarbeitung: "gpt-6-luna", erfassung: "gpt-6-astra", verdichtung: "gpt-6-astra", reparatur: "gpt-6.1-sol", kurzfassung: "gpt-6.1-sol" },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "high", reparatur: "low", kurzfassung: "medium" },
  };
  const ALT_MISTRAL = {
    modelle: { vorverarbeitung: "mistral-small-2603", erfassung: "mistral-medium-3-5", verdichtung: "mistral-medium-3-5", reparatur: "mistral-small-2603", kurzfassung: "mistral-medium-3-5" },
    aufwand: { vorverarbeitung: "high", erfassung: "high", verdichtung: "high", reparatur: "low", kurzfassung: "high" },
  };

  it("AV-2026-W43-32, -33, -37: die Standard-Profile der Fassung 3 sind die bis 0.5.14 gültigen", () => {
    expect(STANDARD_PROFILE_FASSUNG_3).toEqual({ anthropic: ALT_ANTHROPIC, openai: ALT_OPENAI, mistral: ALT_MISTRAL });
  });

  it.each([
    ["anthropic", ALT_ANTHROPIC, { reparatur: "claude-haiku-5-5" }, {}],
    ["openai", ALT_OPENAI, {}, { erfassung: "high" }],
    ["mistral", ALT_MISTRAL, {}, {}], // seit 0.5.16 wieder wie bis 0.5.14 (AV-2026-W43-39)
  ] as const)("AV-2026-W43-32, -33, -37: Fassung 3 mit dem alten Standard-Profil %s folgt danach dem heutigen", async (_a, alt, modelle, aufwand) => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 3, websucheMax: 7, modelle: alt.modelle, aufwand: alt.aufwand });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual({ ...alt.modelle, ...modelle });
    expect(e.aufwand).toEqual({ ...alt.aufwand, ...aufwand });
    expect(e.websucheMax).toBe(7);
    expect(e.fassung).toBe(5);
  });

  it("AV-2026-W43-39: Fassung 4 mit dem Mistral-Standard aus 0.5.15 (Reparatur Medium) repariert danach mit Small", async () => {
    // Soll unabhängig vom Code: Mistral-Standard 0.5.15 laut Spezifikation 0.5.15, Abschnitt 5.4
    const modelle015 = { ...ALT_MISTRAL.modelle, reparatur: "mistral-medium-3-5" };
    speicher.set("einstellungen", { ...STANDARD, fassung: 4, websucheMax: 9, modelle: modelle015, aufwand: ALT_MISTRAL.aufwand });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual(ALT_MISTRAL.modelle);
    expect(e.aufwand).toEqual(ALT_MISTRAL.aufwand);
    expect(e.websucheMax).toBe(9);
    expect(e.fassung).toBe(5);
  });

  it("AV-2026-W43-39: eine abweichende Wahl der Fassung 4 bleibt stehen", async () => {
    const eigen = { ...ALT_MISTRAL.modelle, reparatur: "mistral-medium-3-5", kurzfassung: "mistral-large-4" };
    speicher.set("einstellungen", { ...STANDARD, fassung: 4, modelle: eigen, aufwand: ALT_MISTRAL.aufwand });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual(eigen);
    expect(e.fassung).toBe(5);
  });

  it("AV-2026-W43-32: eine abweichende Wahl der Fassung 3 bleibt stehen", async () => {
    const eigen = { ...ALT_ANTHROPIC.modelle, kurzfassung: "claude-opus-5-5" };
    speicher.set("einstellungen", { ...STANDARD, fassung: 3, modelle: eigen, aufwand: ALT_ANTHROPIC.aufwand });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual(eigen);
    expect(e.fassung).toBe(5);
  });

  it("AV-2026-W43-32: leere Modellfelder (Vorgaben des Profils) bleiben leer", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 3 });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual(STANDARD.modelle);
    expect(e.fassung).toBe(5);
  });
});

describe("AV-2026-W43-31: Mix-Profile", () => {
  it("belegen alle Aufgaben wie die Varianten M1 und M2 des Plans anbietermix-ilka, Reparatur Haiku, Management Summary Sonnet", () => {
    expect(MIX_IDS).toEqual(["mix-opus", "mix-sonnet"]);
    const soll = (s2: string) => ({
      modelle: { vorverarbeitung: "gpt-6-luna", erfassung: s2, verdichtung: s2, reparatur: "claude-haiku-5-5", kurzfassung: "claude-sonnet-5-5" },
      aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
    });
    expect(MIX_PROFILE["mix-opus"]).toMatchObject({ titel: "Mix: OpenAI S1 + Anthropic Opus", anbieter: ["openai", "anthropic"], ...soll("claude-opus-5-5") });
    expect(MIX_PROFILE["mix-sonnet"]).toMatchObject({ titel: "Mix: OpenAI S1 + Anthropic Sonnet", anbieter: ["openai", "anthropic"], ...soll("claude-sonnet-5-5") });
  });

  it("nutzen nur angebotene Modelle und Stufen", () => {
    for (const id of MIX_IDS)
      for (const r of ROLLEN) {
        const m = MIX_PROFILE[id].modelle[r];
        expect(MODELL_AUSWAHL).toContain(m);
        expect(aufwandStufenFuer(m)).toContain(MIX_PROFILE[id].aufwand[r]);
      }
  });

  it("Anwenden und Erkennen sind invers; alles andere bleibt; kein Standard-Profil gilt dann als aktiv", () => {
    const start = { ...STANDARD, websucheMax: 3 };
    for (const id of MIX_IDS) {
      const e = mixProfilAnwenden(start, id);
      expect(mixProfilAktiv(e, id)).toBe(true);
      expect(e.websucheMax).toBe(3);
      expect(MIX_IDS.filter((m) => mixProfilAktiv(e, m))).toEqual([id]);
      expect((["anthropic", "openai", "mistral"] as const).some((a) => standardProfilAktiv(e, a))).toBe(false);
    }
    expect(mixProfilAktiv(start, "mix-opus")).toBe(false);
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
