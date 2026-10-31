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
  laufModelle,
  mitModellwahl,
  wahlAbweichend,
  modellFuer,
  werkzeugeFuer,
} = await import("../../src/pipeline/einstellungen");
const { einstellungenLesen, einstellungenSchreiben } = await import("../../src/speicher/einstellungsSpeicher");
const { alleSchluesselLesen, schluesselLesen, schluesselSchreiben } = await import("../../src/schluessel/ablage");

describe("Vorgaben und Umstellung der Einstellungen", () => {
  beforeEach(() => speicher.clear());

  it("S1 arbeitet ab Fassung 3 mit hohem Aufwand; neue Einstellungen tragen Fassung 7 (seit 0.6.16)", async () => {
    expect(STANDARD.aufwand.vorverarbeitung).toBe("high");
    expect(STANDARD.fassung).toBe(7);
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("high");
  });

  it("hebt die alte Vorgabe „medium“ aus Fassung 2 an", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 2, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium", verdichtung: "low" } });
    const e = await einstellungenLesen();
    expect(e.aufwand.vorverarbeitung).toBe("high");
    expect(e.aufwand.verdichtung).toBe("low");
    expect(e.fassung).toBe(7);
  });

  it("Mistral-Endpunkt (seit 0.5.6): ohne gespeicherten Wert EU, eine Wahl bleibt", async () => {
    const { anbieterOptionen: _ohne, ...alt } = STANDARD;
    speicher.set("einstellungen", { ...alt, fassung: 5 });
    const e = await einstellungenLesen();
    expect(e.anbieterOptionen.mistral.endpunkt).toBe("eu");
    speicher.set("einstellungen", { ...alt, fassung: 5, mistralEndpunkt: "global" });
    expect((await einstellungenLesen()).anbieterOptionen.mistral.endpunkt).toBe("global");
  });

  it("TP-2026-W44-26: Fassung 5 → 6 überführt mistralEndpunkt in anbieterOptionen und ergänzt die Vorgaben für Ollama", async () => {
    const { anbieterOptionen: _ohne, ...alt } = STANDARD;
    speicher.set("einstellungen", { ...alt, fassung: 5, mistralEndpunkt: "global", websucheMax: 7 });
    const e = await einstellungenLesen();
    expect(e.fassung).toBe(7);
    expect(e.anbieterOptionen).toEqual({
      anthropic: {},
      openai: {},
      mistral: { endpunkt: "global" },
      ollama: { basisUrl: "http://localhost:11434/v1", modell: "llama3.1" },
    });
    expect("mistralEndpunkt" in e).toBe(false);
    expect(e.websucheMax).toBe(7);
    // Fassung 6 mit Teilangaben: Fehlendes kommt aus den Vorgaben, Gesetztes bleibt
    speicher.set("einstellungen", { ...STANDARD, anbieterOptionen: { ollama: { modell: "qwen3" } } });
    expect((await einstellungenLesen()).anbieterOptionen).toEqual({
      anthropic: {},
      openai: {},
      mistral: { endpunkt: "eu" },
      ollama: { basisUrl: "http://localhost:11434/v1", modell: "qwen3" },
    });
    // gespeicherte Einstellungen ohne Fassung durchlaufen die ganze Kette
    speicher.set("einstellungen", { modelle: STANDARD.modelle, mistralEndpunkt: "global" });
    const ganz = await einstellungenLesen();
    expect(ganz.fassung).toBe(7);
    expect(ganz.anbieterOptionen.mistral.endpunkt).toBe("global");
  });

  it("Werkzeuge je Modell und Endpunkt: Mistral EU keine, Mistral global nur Websuche, sonst beide", () => {
    expect(werkzeugeFuer("mistral-medium-3-5", { anbieterOptionen: { ...STANDARD.anbieterOptionen, mistral: { endpunkt: "eu" } } })).toEqual({
      websuche: false,
      abruf: false,
    });
    expect(werkzeugeFuer("mistral-medium-3-5", { anbieterOptionen: { ...STANDARD.anbieterOptionen, mistral: { endpunkt: "global" } } })).toEqual({
      websuche: true,
      abruf: false,
    });
    expect(werkzeugeFuer("claude-opus-5-5", { anbieterOptionen: { ...STANDARD.anbieterOptionen, mistral: { endpunkt: "eu" } } })).toEqual({
      websuche: true,
      abruf: true,
    });
    expect(werkzeugeFuer("gpt-6-astra", { anbieterOptionen: { ...STANDARD.anbieterOptionen, mistral: { endpunkt: "eu" } } })).toEqual({
      websuche: true,
      abruf: true,
    });
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
    expect(e.fassung).toBe(7);
  });

  it("nach Fassung 3 bleibt „medium“ eine bewusste Wahl", async () => {
    speicher.set("einstellungen", { ...STANDARD, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium" } });
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("medium");
  });

  // Soll unabhängig vom Code: die Standard-Profile bis 0.5.14 laut Spezifikation 0.5.14, Abschnitt 5.4
  const ALT_ANTHROPIC = {
    modelle: {
      vorverarbeitung: "claude-haiku-5-5",
      erfassung: "claude-opus-5-5",
      verdichtung: "claude-opus-5-5",
      reparatur: "claude-sonnet-5-5",
      kurzfassung: "claude-sonnet-5-5",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  };
  const ALT_OPENAI = {
    modelle: { vorverarbeitung: "gpt-6-luna", erfassung: "gpt-6-astra", verdichtung: "gpt-6-astra", reparatur: "gpt-6.1-sol", kurzfassung: "gpt-6.1-sol" },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "high", reparatur: "low", kurzfassung: "medium" },
  };
  const ALT_MISTRAL = {
    modelle: {
      vorverarbeitung: "mistral-small-2603",
      erfassung: "mistral-medium-3-5",
      verdichtung: "mistral-medium-3-5",
      reparatur: "mistral-small-2603",
      kurzfassung: "mistral-medium-3-5",
    },
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
    expect(e.fassung).toBe(7);
  });

  it("AV-2026-W43-39: Fassung 4 mit dem Mistral-Standard aus 0.5.15 (Reparatur Medium) repariert danach mit Small", async () => {
    // Soll unabhängig vom Code: Mistral-Standard 0.5.15 laut Spezifikation 0.5.15, Abschnitt 5.4
    const modelle015 = { ...ALT_MISTRAL.modelle, reparatur: "mistral-medium-3-5" };
    speicher.set("einstellungen", { ...STANDARD, fassung: 4, websucheMax: 9, modelle: modelle015, aufwand: ALT_MISTRAL.aufwand });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual(ALT_MISTRAL.modelle);
    expect(e.aufwand).toEqual(ALT_MISTRAL.aufwand);
    expect(e.websucheMax).toBe(9);
    expect(e.fassung).toBe(7);
  });

  it("AV-2026-W43-39: eine abweichende Wahl der Fassung 4 bleibt stehen", async () => {
    const eigen = { ...ALT_MISTRAL.modelle, reparatur: "mistral-medium-3-5", kurzfassung: "mistral-large-4" };
    speicher.set("einstellungen", { ...STANDARD, fassung: 4, modelle: eigen, aufwand: ALT_MISTRAL.aufwand });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual(eigen);
    expect(e.fassung).toBe(7);
  });

  it("AV-2026-W43-32: eine abweichende Wahl der Fassung 3 bleibt stehen", async () => {
    const eigen = { ...ALT_ANTHROPIC.modelle, kurzfassung: "claude-opus-5-5" };
    speicher.set("einstellungen", { ...STANDARD, fassung: 3, modelle: eigen, aufwand: ALT_ANTHROPIC.aufwand });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual(eigen);
    expect(e.fassung).toBe(7);
  });

  it("AV-2026-W43-32: leere Modellfelder (Vorgaben des Profils) bleiben leer", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 3 });
    const e = await einstellungenLesen();
    expect(e.modelle).toEqual(STANDARD.modelle);
    expect(e.fassung).toBe(7);
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
    expect(MIX_PROFILE["mix-sonnet"]).toMatchObject({
      titel: "Mix: OpenAI S1 + Anthropic Sonnet",
      anbieter: ["openai", "anthropic"],
      ...soll("claude-sonnet-5-5"),
    });
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

  it("Punkt 8 (0.5.22): Recherchetiefe je Lauf mit allen drei Werten, in den Bereichen wie unter „Recherche & Grenzen“", () => {
    const e = STANDARD;
    const r = mitModellwahl(e, { websucheMax: 30, abrufMax: 20, abrufMaxTokens: 30000 });
    expect([r.websucheMax, r.abrufMax, r.abrufMaxTokens]).toEqual([30, 20, 30000]);
    expect([e.websucheMax, e.abrufMax, e.abrufMaxTokens]).toEqual([15, 10, 15000]);
    // Bereiche: Seiten 0–50, Lesemenge 1 000–100 000 oder 0 (Seiten nie kürzen)
    const g = mitModellwahl(e, { abrufMax: 99, abrufMaxTokens: 500 });
    expect([g.abrufMax, g.abrufMaxTokens]).toEqual([50, 1000]);
    expect(mitModellwahl(e, { abrufMaxTokens: 0 }).abrufMaxTokens).toBe(0);
    expect(mitModellwahl(e, { abrufMax: Number.NaN })).toBe(e);
    // abweichend nur, wenn der Lauf recherchiert
    expect(wahlAbweichend({ abrufMax: 3 }, ["erfassung"], true)).toBe(true);
    expect(wahlAbweichend({ abrufMax: 3 }, ["erfassung"], false)).toBe(false);
  });
});

describe("API-Schlüssel je Anbieter", () => {
  beforeEach(() => speicher.clear());

  it("werden je Anbieter getrennt gesetzt, gelesen und gelöscht und nie mit den Einstellungen gespeichert", async () => {
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "", openai: "", mistral: "", stelle: "" });
    await schluesselSchreiben("sk-ant-A");
    await schluesselSchreiben("sk-oai-B", "openai");
    expect(await schluesselLesen()).toBe("sk-ant-A");
    expect(await schluesselLesen("openai")).toBe("sk-oai-B");
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "sk-oai-B", mistral: "", stelle: "" });

    // Ein leerer Wert löscht nur den Schlüssel dieses Anbieters
    await schluesselSchreiben("", "openai");
    expect(speicher.has("schluessel:openai")).toBe(false);
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "", mistral: "", stelle: "" });

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
    // Ollama (seit 0.6.3) wählt ein frei benanntes lokales Modell; es steht nicht in der festen Liste (eigener Test)
    for (const [anbieter, p] of Object.entries(STANDARD_PROFILE).filter(([a]) => a !== "ollama" && a !== "stelle")) {
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

describe("Ollama als vierter Anbieter (TP-2026-W44-26)", () => {
  it("TP-2026-W44-26: Standard-Profil Ollama mit frei wählbarem lokalem Modell, ohne Werkzeuge, mit fester Stufe", async () => {
    const { STANDARD_PROFILE, ROLLEN, standardProfilAnwenden, standardProfilAktiv, modellGruppen, aufwandAuswahl } =
      await import("../../src/pipeline/einstellungen");
    for (const r of ROLLEN) {
      expect(STANDARD_PROFILE.ollama.modelle[r], r).toBe("ollama:llama3.1");
      expect(STANDARD_PROFILE.ollama.aufwand[r], r).toBe("medium");
    }
    const eigen = { ...STANDARD, anbieterOptionen: { ...STANDARD.anbieterOptionen, ollama: { basisUrl: "http://localhost:11434/v1", modell: "qwen3:32b" } } };
    const neu = standardProfilAnwenden(eigen, "ollama");
    expect(Object.values(neu.modelle)).toEqual(Array(5).fill("ollama:qwen3:32b"));
    expect(standardProfilAktiv(neu, "ollama")).toBe(true);
    expect(standardProfilAktiv(neu, "anthropic")).toBe(false);
    expect(werkzeugeFuer("ollama:qwen3:32b", neu)).toEqual({ websuche: false, abruf: false });
    expect(aufwandAuswahl("ollama:qwen3:32b")).toEqual([{ id: "medium", titel: "fest – bestimmt das lokale Modell" }]);
    // Auswahl: feste Gruppen der Anbieter, dazu das lokale Modell und ein abweichend gewähltes
    const gruppen = modellGruppen({ ...neu, modelle: { ...neu.modelle, kurzfassung: "ollama:llama3.1" } });
    expect(gruppen.map((g) => g.anbieter)).toEqual(["Anthropic", "OpenAI", "Mistral", "Ollama (lokal)"]);
    expect(gruppen[3]!.modelle).toEqual(["ollama:qwen3:32b", "ollama:llama3.1"]);
  });

  it("TP-2026-W44-26: eine Modellvorgabe des Profils ohne Anbieter gilt nicht; es gilt die Vorgabe der App", async () => {
    const { APP_MODELLE, modellHerkunft } = await import("../../src/pipeline/einstellungen");
    const p = (await profil("lead-beispiel")).profil!;
    const mitLlama = { ...p, manifest: { ...p.manifest, modelle: { ...p.manifest.modelle, erfassung: "llama3" } } };
    expect(modellFuer("erfassung", STANDARD, mitLlama)).toBe(APP_MODELLE.erfassung);
    expect(modellHerkunft("erfassung", STANDARD, mitLlama)).toBe("app");
    const mitOllama = { ...p, manifest: { ...p.manifest, modelle: { ...p.manifest.modelle, erfassung: "ollama:llama3.1" } } };
    expect(modellFuer("erfassung", STANDARD, mitOllama)).toBe("ollama:llama3.1");
    expect(modellHerkunft("erfassung", STANDARD, mitOllama)).toBe("profil");
  });
});

// Schalter „Forschungsfunktionen anzeigen“ (seit 0.6.16). Grundlage: Befunddatei ki-lead-befund_technik_2026-W44-A5.json
// vom 31.10.2026 (Arbeitspaket A5), TP-2026-W44-46; Vorgabe aus nach Entscheidung des Herausgebers.
describe("TP-2026-W44-46: Forschungsfunktionen", () => {
  it("Vorgabe aus; Fassung 6 erhält beim Umstellen „aus“, eine gespeicherte Wahl ab Fassung 7 bleibt", async () => {
    const { einstellungenMigrieren } = await import("../../src/pipeline/einstellungen");
    expect(STANDARD.forschung).toBe(false);
    expect(einstellungenMigrieren(undefined).forschung).toBe(false);
    expect(einstellungenMigrieren({ ...STANDARD, fassung: 6, forschung: undefined as unknown as boolean }).forschung).toBe(false);
    expect(einstellungenMigrieren({ ...STANDARD, fassung: 7, forschung: true })).toMatchObject({ forschung: true, fassung: 7 });
  });
});
