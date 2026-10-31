// @vitest-environment jsdom
// Testläufe unter „Einstellungen → Testläufe“ (seit 0.5.17; bis 0.5.16 „Vergleichslauf Ilka“ seit 0.5.8 und „Prüffall
// Reparatur“ seit 0.5.13 unter „Modelle & Verarbeitung“): Anzeige der Konfiguration, Vorgabe drei Läufe, fehlender
// Schlüssel, Ablauf mit Attrappe und ZIP-Datei, Wahl der Testart (seit 0.5.12 Umfang), S3 Reparatur, Archiv.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import JSZip from "jszip";
import { readFileSync } from "node:fs";
import { leseOrdner, profilPflicht, repoPfad } from "../support/dateien";
import { aushaengen, bisWahr, dialogAntwort, eingeben, einhaengen, klick, knopf, reactUmgebung } from "../support/dom";
import { llmAntwort, meldungsAntwort } from "../support/anbieter";
import { STANDARD, standardProfilAnwenden } from "../../src/pipeline/einstellungen";
import type { LlmAnbieter } from "../../src/anbieter/typen";
import type { Schluessel } from "../../src/anbieter/verteiler";

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: Blob }[] }));
const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as import("../support/speicher").SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));
vi.mock("../../src/speicher/speicher", async (orig) => {
  const echt = await orig<typeof import("../../src/speicher/speicher")>();
  return { ...echt, dateiAnbieten: (inhalt: Blob, name: string) => void downloads.liste.push({ name, inhalt }) };
});

import { TestlaufAbschnitt } from "../../src/ui/Testlaeufe";
import { EinstellungenAnsicht } from "../../src/ui/Einstellungen";
import { speicherLeeren } from "../support/speicher";

beforeAll(reactUmgebung);
afterEach(async () => {
  downloads.liste = [];
  speicherLeeren(speicher);
  vi.restoreAllMocks();
  await aushaengen();
});

const OHNE: Schluessel = { anthropic: "", openai: "", mistral: "" };
const REFERENZ = "beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
const text = () => document.body.textContent || "";
const anzahlFeld = () => document.querySelector('input[type="number"]') as HTMLInputElement;

function attrappe(referenz: unknown): LlmAnbieter {
  return {
    id: "attrappe",
    async senden(a) {
      if (a.jsonSchema)
        return llmAntwort(
          JSON.stringify({
            gegenstand: "Sturmfolgen",
            stichtag: "2026-10-14",
            meldezeitpunkt: "2026-10-14T14:00",
            referenzbezug: "Bund",
            horizont: "",
            sachverhalte: [{ titel: "Sturmfolgen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "", eingangsmeldungen: [] }],
            prueffrage: "",
            hinweise: "",
          }),
        );
      return meldungsAntwort(referenz);
    },
  };
}

describe("Testläufe in den Einstellungen", () => {
  it("stehen im Bereich „Testläufe“ und zeigen die wirksame Konfiguration mit drei Läufen als Vorgabe", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(EinstellungenAnsicht, {
        profil,
        einstellungen: { ...STANDARD, forschung: true },
        setEinstellungen: () => {},
        schluessel: OHNE,
        setSchluessel: () => {},
        bereich: "testlaeufe",
      }),
    );
    expect(document.querySelector("#testlauf-titel")?.textContent).toBe("Neuer Testlauf");
    expect(text()).toContain("S1: claude-haiku-5-5 (hoch) · Anthropic");
    expect(text()).toContain("S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic");
    expect(anzahlFeld().value).toBe("3");
    // ohne Schlüssel nicht startbar, mit Hinweis auf den fehlenden Anbieter
    expect(knopf("Testlauf starten")?.disabled).toBe(true);
    expect(text()).toContain("fehlt der Schlüssel für Anthropic");
  });

  it("startet mit der Mistral-Konfiguration, zeigt die Läufe und bietet die ZIP-Datei an", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const e = { ...standardProfilAnwenden(STANDARD, "mistral"), anbieterOptionen: { ...STANDARD.anbieterOptionen, mistral: { endpunkt: "global" as const } } };
    const anbieterFuer = vi.fn(() => attrappe(JSON.parse(dateien[REFERENZ])));
    await einhaengen(
      React.createElement(TestlaufAbschnitt, {
        profil,
        einstellungen: e,
        schluessel: { ...OHNE, mistral: "test" },
        datenLaden: async () => ({ profil: await profilPflicht("lead-beispiel"), dateien }),
        anbieterFuer,
      }),
    );
    expect(text()).toContain("Mistral-Endpunkt: global (api.mistral.ai)");
    await klick("Testlauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(anbieterFuer).toHaveBeenCalledTimes(1);
    const [s, eLauf] = anbieterFuer.mock.calls[0] as unknown as [Schluessel, typeof e];
    expect(s.mistral).toBe("test");
    expect(eLauf.modelle).toMatchObject({ vorverarbeitung: "mistral-small-2603", verdichtung: "mistral-medium-3-5", reparatur: "mistral-small-2603" });
    expect(eLauf.anbieterOptionen.mistral.endpunkt).toBe("global");
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Testlauf_Ilka_mistral-medium-3-5-[a-z]+_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    expect(JSON.parse(await zip.file("reihe.json")!.async("string")).laeufe).toHaveLength(3);
    expect(document.querySelectorAll(".testlauf tbody tr")).toHaveLength(3);
    expect(text()).toContain("3 von 3 Läufen, technisch bestanden (T1–T8): 3");
    await klick("ZIP herunterladen");
    expect(downloads.liste).toHaveLength(2);
  });

  it("AV-2026-W43-04: Variante des Plans standardprofile-ilka wählen, ohne die Einstellungen zu ändern", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(TestlaufAbschnitt, { profil, einstellungen: { ...STANDARD, forschung: true }, schluessel: { ...OHNE, anthropic: "x" } }),
    );
    const auswahl = document.querySelector(".testlauf select") as HTMLSelectElement;
    expect([...auswahl.options].map((o) => o.value)).toEqual([
      "",
      "standardprofile-ilka/A-anthropic-standard",
      "standardprofile-ilka/B-anthropic-sonnet",
      "standardprofile-ilka/C-openai-standard",
      "standardprofile-ilka/D-openai-astra-hoch",
      "standardprofile-ilka/E-mistral-standard",
      "standardprofile-ilka/F-mistral-large",
      "anbietermix-ilka/M1-luna-opus",
      "anbietermix-ilka/M2-luna-sonnet",
    ]);
    await act(async () => {
      auswahl.value = "standardprofile-ilka/F-mistral-large";
      auswahl.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(text()).toContain("S2 Verdichtung: mistral-large-4 (hoch) · Mistral");
    expect(text()).toContain("S3 Reparatur: mistral-small-2603 (niedrig) · Mistral");
    expect(text()).toContain("fehlt der Schlüssel für Mistral");
    expect(knopf("Testlauf starten")?.disabled).toBe(true);
  });

  it("AV-2026-W43-23, -24: Mix-Variante M1 mit S1 OpenAI, S2 Anthropic und Reparatur Haiku (seit 0.5.15); fehlender OpenAI-Schlüssel gemeldet", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(TestlaufAbschnitt, { profil, einstellungen: { ...STANDARD, forschung: true }, schluessel: { ...OHNE, anthropic: "x" } }),
    );
    const auswahl = document.querySelector(".testlauf select") as HTMLSelectElement;
    expect([...auswahl.querySelectorAll("optgroup")].map((g) => g.label)).toEqual(["Bewertungsplan standardprofile-ilka", "Bewertungsplan anbietermix-ilka"]);
    await act(async () => {
      auswahl.value = "anbietermix-ilka/M1-luna-opus";
      auswahl.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(text()).toContain("S1: gpt-6-luna (hoch) · OpenAI");
    expect(text()).toContain("S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic");
    expect(text()).toContain("S3 Reparatur: claude-haiku-5-5 (niedrig) · Anthropic");
    expect(text()).toContain("Die Varianten kombinieren Anbieter je Stufe");
    expect(text()).toContain("fehlt der Schlüssel für OpenAI");
    expect(knopf("Testlauf starten")?.disabled).toBe(true);
  });
});

describe("Testläufe: Testart wählen (seit 0.5.12 Umfang, seit 0.5.17 mit S3 Reparatur)", () => {
  const umfangFeld = (titel: string) =>
    [...document.querySelectorAll<HTMLInputElement>('input[name="testlauf-art"]')].find((i) => i.closest("label")?.textContent?.startsWith(titel))!;
  async function umfangWaehlen(titel: string) {
    await act(async () => {
      umfangFeld(titel).click();
    });
  }
  const auswahl = () => document.querySelector(".testlauf select") as HTMLSelectElement;
  // React bemerkt die Eingabe nur über den nativen Setter
  async function anzahlSetzen(wert: string) {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(anzahlFeld(), wert);
      anzahlFeld().dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  const konfiguration = () => [...document.querySelectorAll(".testlauf-konfiguration li")].map((li) => li.textContent);

  it("bietet sechs Testarten als Radiogruppe; Vorgabe ist S1 + S2 + S3 aus Rohdaten", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(TestlaufAbschnitt, { profil, einstellungen: { ...STANDARD, forschung: true }, schluessel: { ...OHNE, anthropic: "x" } }),
    );
    const gruppe = document.querySelector(".testlauf fieldset")!;
    expect(gruppe.querySelector("legend")?.textContent).toBe("Was wird getestet?");
    const felder = [...gruppe.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    expect(felder.map((f) => f.closest("label")?.querySelector("strong")?.textContent)).toEqual([
      "S1 (aus Rohdaten)",
      "S1 + S2 (aus Rohdaten)",
      "S1 + S2 + S3 (aus Rohdaten)",
      "S2 + S3 (aus Musterfassung)",
      "S3 Reparatur (aus Musterfassung)",
      "Management Summary (aus Musterfassung)",
    ]);
    expect(felder.filter((f) => f.checked).map((f) => f.value)).toEqual(["s1-s2-s3"]);
    expect(konfiguration()).toEqual([
      "S1: claude-haiku-5-5 (hoch) · Anthropic",
      "S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic",
      "S3 Reparatur: claude-haiku-5-5 (niedrig) · Anthropic · nur bei Schemafehlern",
    ]);

    await umfangWaehlen("S1 (aus Rohdaten)");
    expect(konfiguration()).toEqual(["S1: claude-haiku-5-5 (hoch) · Anthropic"]);
    expect(text()).toContain("verglichen mit dem Zuschnitt der Musterfassung");

    await umfangWaehlen("S1 + S2 (aus Rohdaten)");
    expect(konfiguration()).toEqual([
      "S1: claude-haiku-5-5 (hoch) · Anthropic",
      "S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic",
      "S3: entfällt, Entwurf ohne Vervollständigung und Reparatur",
    ]);

    await umfangWaehlen("S2 + S3 (aus Musterfassung)");
    expect(konfiguration()).toEqual([
      "S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic",
      "S3 Reparatur: claude-haiku-5-5 (niedrig) · Anthropic · nur bei Schemafehlern",
      "S1: entfällt, Zuschnitt der Musterfassung (zwei Sachverhalte)",
    ]);
    expect([...auswahl().querySelectorAll("optgroup")].map((g) => g.label)).toEqual(["Bewertungsplan s2-isoliert-ilka"]);

    await umfangWaehlen("Management Summary (aus Musterfassung)");
    expect(konfiguration()).toEqual(["Management Summary: claude-sonnet-5-5 (mittel) · Anthropic"]);
    expect([...auswahl().querySelectorAll("optgroup")].map((g) => g.label)).toEqual(["Bewertungsplan management-summary-ilka"]);
    expect(text()).toContain("(grob, ohne Messwert für diese Konfiguration)");
    expect(knopf("Testlauf starten")?.disabled).toBe(false);
  });

  it("eine Variante gilt nur für die Umfänge ihres Plans", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(TestlaufAbschnitt, { profil, einstellungen: { ...STANDARD, forschung: true }, schluessel: { ...OHNE, anthropic: "x" } }),
    );
    await umfangWaehlen("Management Summary (aus Musterfassung)");
    await act(async () => {
      auswahl().value = "management-summary-ilka/D-openai-standard";
      auswahl().dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(konfiguration()).toEqual(["Management Summary: gpt-6.1-sol (mittel) · OpenAI"]);
    expect(text()).toContain("fehlt der Schlüssel für OpenAI");
    // zurück zur ganzen Kette: Variante verworfen, Einstellungen gelten wieder
    await umfangWaehlen("S1 + S2 + S3 (aus Rohdaten)");
    expect(auswahl().value).toBe("");
    expect(konfiguration()[1]).toBe("S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic");
    expect(text()).not.toContain("fehlt der Schlüssel");
  });

  it("S1 aus Rohdaten: nur S1-Aufrufe, Tabelle mit Gliederung, ZIP mit S1-Vorschlägen", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const anbieter = attrappe(JSON.parse(dateien[REFERENZ]));
    const senden = vi.spyOn(anbieter, "senden");
    await einhaengen(
      React.createElement(TestlaufAbschnitt, {
        profil,
        einstellungen: { ...STANDARD, forschung: true },
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil, dateien }),
        anbieterFuer: () => anbieter,
      }),
    );
    await umfangWaehlen("S1 (aus Rohdaten)");
    await anzahlSetzen("2");
    await klick("Testlauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(senden).toHaveBeenCalledTimes(2);
    expect(senden.mock.calls.every(([a]) => !!a.jsonSchema)).toBe(true);
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Testlauf_Ilka_S1_claude-haiku-5-5-high_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    expect(JSON.parse(await zip.file("reihe.json")!.async("string")).umfang).toBe("s1");
    expect(Object.keys(zip.files).filter((n) => n.startsWith("s1/") && !zip.files[n].dir)).toHaveLength(2);
    expect(text()).toContain("S1 (aus Rohdaten): 2 von 2 Läufen, technisch bestanden (T1, T2, T4–T6): 2");
    expect([...document.querySelectorAll(".testlauf thead th")].map((th) => th.textContent)).toContain("Gliederung wie Musterfassung");
    // ein Sachverhalt statt zwei: nicht wie die Musterfassung
    expect(document.querySelector(".testlauf tbody tr")?.textContent).toContain("nein");
  });

  it("Management Summary aus Musterfassung: Management Summary je Lauf, Vorprüfung in der Tabelle, ZIP mit Texten", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const kurz = {
      kernaussage: "Nach dem Orkantief sind noch mindestens rund 20.700 Menschen ohne Strom; in Sonneberg enden Notstrompuffer vor der Wiederversorgung.",
      abschnitte: {},
      kurztitel: ["Sturmfolgen", "Stromausfälle"],
    };
    const anfragen: string[] = [];
    const anbieter: LlmAnbieter = {
      id: "attrappe",
      async senden(a) {
        anfragen.push(a.modell);
        return llmAntwort(JSON.stringify(kurz));
      },
    };
    await einhaengen(
      React.createElement(TestlaufAbschnitt, {
        profil,
        einstellungen: { ...STANDARD, forschung: true },
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil, dateien }),
        anbieterFuer: () => anbieter,
      }),
    );
    await umfangWaehlen("Management Summary (aus Musterfassung)");
    await klick("Testlauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(anfragen).toEqual(["claude-sonnet-5-5", "claude-sonnet-5-5", "claude-sonnet-5-5"]);
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Testlauf_Ilka_MS-Muster_claude-sonnet-5-5-medium_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
    expect(reihe).toMatchObject({ format: "ki-lead-kurzfassung-reihe/1", umfang: "ms", quelle: "app", ohne_auffaelligkeit: 3 });
    expect(Object.keys(zip.files).filter((n) => n.startsWith("kurzfassungen/") && !zip.files[n].dir)).toHaveLength(3);
    expect(text()).toContain("Management Summary (aus Musterfassung): 3 von 3 Läufen, ohne Auffälligkeit der Vorprüfung: 3");
    expect([...document.querySelectorAll(".testlauf tbody tr td:last-child")].map((td) => td.textContent)).toEqual(["keine", "keine", "keine"]);
  });

  it("S2 + S3 aus Musterfassung: kein S1-Aufruf, fester Zuschnitt in der Reihe", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const anbieter = attrappe(JSON.parse(dateien[REFERENZ]));
    const senden = vi.spyOn(anbieter, "senden");
    await einhaengen(
      React.createElement(TestlaufAbschnitt, {
        profil,
        einstellungen: { ...STANDARD, forschung: true },
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil, dateien }),
        anbieterFuer: () => anbieter,
      }),
    );
    await umfangWaehlen("S2 + S3 (aus Musterfassung)");
    await anzahlSetzen("1");
    await klick("Testlauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(senden).toHaveBeenCalledTimes(1);
    expect(senden.mock.calls[0][0].jsonSchema).toBeUndefined();
    const zip = await JSZip.loadAsync(await downloads.liste[0].inhalt.arrayBuffer());
    const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
    expect(reihe).toMatchObject({ umfang: "s2-s3", s1_fest: { datei: "evaluation/material/ilka-s1-zuschnitt-a.json" } });
    expect(downloads.liste[0].name).toMatch(/^KI-LEAD_Testlauf_Ilka_S2-S3-Muster_claude-opus-5-5-medium_/);
  });
});

describe("AV-2026-W43-25: Testart S3 Reparatur (bis 0.5.16 „Prüffall Reparatur“)", () => {
  const MUSTER_TEXT = readFileSync(repoPfad("evaluation/material/ilka-musterfassung.json"), "utf-8");
  const abschnitt = () => document.querySelector(".testlauf") as HTMLElement;
  const auswahl = () => abschnitt().querySelector("select") as HTMLSelectElement;
  async function reparaturWaehlen() {
    const feld = [...document.querySelectorAll<HTMLInputElement>('input[name="testlauf-art"]')].find((i) => i.value === "reparatur")!;
    await act(async () => feld.click());
  }
  /** Reparatur als Attrappe: gibt die unbeschädigte Musterfassung zurück */
  function reparaturAttrappe(): LlmAnbieter & { modelle: string[] } {
    const modelle: string[] = [];
    return {
      id: "attrappe",
      modelle,
      async senden(a) {
        modelle.push(a.modell);
        return llmAntwort("```json\n" + MUSTER_TEXT + "\n```", { modell: a.modell, kostenUsd: 0.01 });
      },
    };
  }

  it("Vorgabe: Reparaturmodell der Einstellungen, zwei Läufe; zurück zu einer Kette wieder drei", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(TestlaufAbschnitt, { profil, einstellungen: { ...STANDARD, forschung: true }, schluessel: OHNE }));
    await reparaturWaehlen();
    expect([...abschnitt().querySelectorAll(".testlauf-konfiguration li")].map((li) => li.textContent)).toEqual([
      "S3 Reparatur: claude-haiku-5-5 (niedrig) · Anthropic",
      "S1 und S2: ohne KI-Aufruf, beschädigte Musterfassung",
    ]);
    expect(anzahlFeld().value).toBe("2");
    expect(anzahlFeld().max).toBe("5");
    expect(abschnitt().textContent).toContain("2 Läufe mit je 5 Fällen, also 10 Fälle mit einer bis zwei Reparaturen");
    expect(abschnitt().textContent).toContain("fehlt der Schlüssel für Anthropic");
    expect(knopf("Testlauf starten")?.disabled).toBe(true);
    const zurueck = [...document.querySelectorAll<HTMLInputElement>('input[name="testlauf-art"]')].find((i) => i.value === "s1")!;
    await act(async () => zurueck.click());
    expect(anzahlFeld().value).toBe("3");
    expect(anzahlFeld().max).toBe("10");
  });

  it("bietet die sechs Varianten des Plans an (R-F seit Fassung 2, AV-2026-W43-38), ohne die Einstellungen zu ändern; Mistral mit Endpunkt und Aufschlag", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(TestlaufAbschnitt, { profil, einstellungen: { ...STANDARD, forschung: true }, schluessel: { ...OHNE, anthropic: "x" } }),
    );
    await reparaturWaehlen();
    expect([...auswahl().options].map((o) => o.value)).toEqual([
      "",
      "reparatur-ilka/R-A-sonnet-niedrig",
      "reparatur-ilka/R-B-haiku-niedrig",
      "reparatur-ilka/R-C-sol-niedrig",
      "reparatur-ilka/R-D-luna-niedrig",
      "reparatur-ilka/R-E-mistral-small",
      "reparatur-ilka/R-F-mistral-medium-niedrig",
    ]);
    expect(auswahl().options[0].textContent).toBe("Aktuelle Einstellungen (Modelle & Aufwand)");
    expect(knopf("Testlauf starten")?.disabled).toBe(false);
    await eingeben(auswahl(), "reparatur-ilka/R-E-mistral-small");
    expect(text()).toContain("S3 Reparatur: mistral-small-2603 (niedrig) · Mistral");
    expect(text()).toContain("Mistral-Endpunkt: EU (api.eu.mistral.ai)");
    expect(text()).toContain("inkl. 10 % Aufschlag am EU-Endpunkt");
    expect(text()).toContain("fehlt der Schlüssel für Mistral");
    expect(knopf("Testlauf starten")?.disabled).toBe(true);
    // Die Variante gehört zum Plan reparatur-ilka: beim Wechsel zur Kette fällt sie weg
    const kette = [...document.querySelectorAll<HTMLInputElement>('input[name="testlauf-art"]')].find((i) => i.value === "s1-s2-s3")!;
    await act(async () => kette.click());
    expect(auswahl().value).toBe("");
    expect(text()).not.toContain("fehlt der Schlüssel");
  });

  it("läuft mit der Variante Haiku, zeigt die Fälle, bietet die ZIP-Datei an und archiviert den Testlauf", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const att = reparaturAttrappe();
    await einhaengen(
      React.createElement(TestlaufAbschnitt, {
        profil,
        einstellungen: { ...STANDARD, forschung: true },
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil: await profilPflicht("lead-beispiel"), dateien }),
        anbieterFuer: () => att,
      }),
    );
    await reparaturWaehlen();
    await eingeben(auswahl(), "reparatur-ilka/R-B-haiku-niedrig");
    await eingeben(anzahlFeld(), "1");
    await klick("Testlauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    // Soll: je Defekt genau eine Reparatur mit Haiku, kein Aufruf für S1 oder S2
    expect(att.modelle).toEqual(Array(5).fill("claude-haiku-5-5"));
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Testlauf_Ilka_S3-Reparatur_claude-haiku-5-5-low_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
    expect(reihe).toMatchObject({ format: "ki-lead-reparaturtest/1", quelle: "app", variante: "reparatur-ilka/R-B-haiku-niedrig", wiederholungen: 1 });
    expect((await zip.file("LIESMICH.txt")!.async("string")).split("\n")[0]).toBe("KI-LEAD – Testlauf Ilka: S3 Reparatur (aus Musterfassung, FIKTIV)");
    expect(abschnitt().querySelectorAll("tbody tr")).toHaveLength(5);
    expect(text()).toContain(
      "S3 Reparatur (aus Musterfassung): 5 Fälle, schemakonform nach der Reparatur: 5, Reparaturen: 5, beschädigte Stellen wie im Original: 5, übrige Inhalte erhalten im Mittel: 100 %",
    );
    expect([...abschnitt().querySelectorAll("thead th")].map((t) => t.textContent)).toEqual([
      "Defekt",
      "Lauf",
      "Schemakonform",
      "Reparaturen",
      "Stellen wie Original",
      "Inhalte erhalten",
      "Kosten",
    ]);
    await klick("ZIP herunterladen");
    expect(downloads.liste).toHaveLength(2);
    // Archiv: Angaben für die Liste und dieselbe Datei
    await bisWahr(() => [...speicher.werte.keys()].some((k) => k.startsWith("eintrag:")));
    const [eintrag] = [...speicher.werte.entries()].filter(([k]) => k.startsWith("eintrag:")).map(([, v]) => v);
    expect(eintrag).toMatchObject({
      art: "reparatur",
      titel: "S3 Reparatur (aus Musterfassung)",
      konfiguration: "R-B-haiku-niedrig · S3 Reparatur claude-haiku-5-5 (niedrig)",
      laeufe: 1,
      geplant: 1,
      name,
    });
    expect(eintrag.beendet).toBeUndefined();
    expect(speicher.werte.get(`zip:${eintrag.id}`)).toHaveLength(eintrag.groesse);
  });
});

describe("Testläufe: Archiv (seit 0.5.17)", () => {
  const liste = () => [...document.querySelectorAll(".testlauf-archiv-liste li")];
  const eintrag = (id: string, erstellt: string, titel: string): import("../../src/speicher/testlaufarchiv").TestlaufEintrag => ({
    id,
    erstellt,
    art: "s1",
    titel,
    konfiguration: "S1 claude-haiku-5-5 (hoch)",
    laeufe: 2,
    geplant: 3,
    beendet: "abgebrochen",
    kostenUsd: 0.02,
    name: `KI-LEAD_Testlauf_Ilka_S1_${id}.zip`,
    groesse: 4,
    app: "KI-LEAD 0.5.17",
  });
  function archivFuellen() {
    for (const [id, zeit] of [
      ["a", "2026-10-25T08:00:00.000Z"],
      ["b", "2026-10-25T10:00:00.000Z"],
      ["c", "2026-10-25T09:00:00.000Z"],
    ]) {
      speicher.werte.set(`eintrag:${id}`, eintrag(id, zeit, `S1 (aus Rohdaten) ${id}`));
      speicher.werte.set(`zip:${id}`, new Uint8Array([1, 2, 3, id.charCodeAt(0)]));
    }
  }
  async function bereichZeigen() {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(EinstellungenAnsicht, {
        profil,
        einstellungen: { ...STANDARD, forschung: true },
        setEinstellungen: () => {},
        schluessel: OHNE,
        setSchluessel: () => {},
        bereich: "testlaeufe",
      }),
    );
    await bisWahr(() => !document.querySelector(".testlauf-archiv")?.textContent?.includes("wird geladen"));
  }

  it("ohne Einträge: Hinweis, keine Löschknöpfe", async () => {
    await bereichZeigen();
    expect(document.querySelector(".testlauf-archiv")!.textContent).toContain("Noch keine Testläufe archiviert.");
    expect(knopf("Alle löschen")).toBeUndefined();
  });

  it("listet die jüngsten zuerst mit Läufen, Kosten und Größe und lädt die ZIP-Datei nachträglich herunter", async () => {
    archivFuellen();
    await bereichZeigen();
    expect(liste().map((li) => li.querySelector("strong")!.textContent)).toEqual([
      expect.stringContaining("S1 (aus Rohdaten) b"),
      expect.stringContaining("S1 (aus Rohdaten) c"),
      expect.stringContaining("S1 (aus Rohdaten) a"),
    ]);
    expect(liste()[0].textContent).toContain("2 von 3 Läufen (abgebrochen) · 0,02 USD · 1 kB · KI-LEAD 0.5.17");
    expect(document.querySelector(".testlauf-archiv")!.textContent).toContain("3 Testläufe, zusammen 1 kB, nur auf diesem Gerät.");
    await klick("ZIP herunterladen: KI-LEAD_Testlauf_Ilka_S1_c.zip");
    expect(downloads.liste.map((d) => d.name)).toEqual(["KI-LEAD_Testlauf_Ilka_S1_c.zip"]);
    expect([...new Uint8Array(await downloads.liste[0].inhalt.arrayBuffer())]).toEqual([1, 2, 3, "c".charCodeAt(0)]);
  });

  it("löscht ausgewählte Testläufe nach Rückfrage mit Eintrag und Datei; bei Ablehnung bleibt alles", async () => {
    archivFuellen();
    const frage = dialogAntwort().mockReturnValueOnce(false).mockReturnValueOnce(true);
    await bereichZeigen();
    expect(knopf(/^Ausgewählte löschen/)?.disabled).toBe(true);
    const kaestchen = () => liste().map((li) => li.querySelector('input[type="checkbox"]') as HTMLInputElement);
    await act(async () => kaestchen()[0].click());
    await act(async () => kaestchen()[2].click());
    expect(knopf("Ausgewählte löschen (2)")?.disabled).toBe(false);
    await klick("Ausgewählte löschen (2)");
    expect(frage).toHaveBeenLastCalledWith("2 archivierte Testläufe löschen? Die ZIP-Dateien lassen sich danach nicht wiederherstellen.");
    expect(liste()).toHaveLength(3);
    await klick("Ausgewählte löschen (2)");
    await bisWahr(() => liste().length === 1);
    expect(liste()[0].textContent).toContain("S1 (aus Rohdaten) c");
    expect([...speicher.werte.keys()].sort()).toEqual(["eintrag:c", "zip:c"]);
    expect(knopf(/^Ausgewählte löschen/)?.textContent).toBe("Ausgewählte löschen");
  });

  it("„Alle auswählen“ und „Alle löschen“ leeren das Archiv", async () => {
    archivFuellen();
    const frage = dialogAntwort(true);
    await bereichZeigen();
    const alle = document.querySelector(".testlauf-archiv-alle input") as HTMLInputElement;
    await act(async () => alle.click());
    expect(knopf("Ausgewählte löschen (3)")).toBeTruthy();
    await act(async () => alle.click());
    expect(knopf("Ausgewählte löschen")?.disabled).toBe(true);
    await klick("Alle löschen");
    expect(frage).toHaveBeenLastCalledWith("Alle 3 archivierten Testläufe löschen? Die ZIP-Dateien lassen sich danach nicht wiederherstellen.");
    await bisWahr(() => document.querySelector(".testlauf-archiv")!.textContent!.includes("Noch keine Testläufe archiviert."));
    expect(speicher.werte.size).toBe(0);
  });

  it("ein Fehler beim Ablegen verhindert die ZIP-Datei nicht und wird angezeigt", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    speicher.schreiben = () => Promise.reject(new Error("Der Speicherplatz ist erschöpft."));
    await einhaengen(
      React.createElement(TestlaufAbschnitt, {
        profil,
        einstellungen: { ...STANDARD, forschung: true },
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil, dateien }),
        anbieterFuer: () => attrappe(JSON.parse(dateien[REFERENZ])),
      }),
    );
    await act(async () => [...document.querySelectorAll<HTMLInputElement>('input[name="testlauf-art"]')].find((i) => i.value === "s1")!.click());
    await eingeben(anzahlFeld(), "1");
    await klick("Testlauf starten");
    await bisWahr(() => text().includes("ließ sich nicht im Archiv ablegen"), { runden: 600 });
    expect(downloads.liste).toHaveLength(1);
    expect(text()).toContain("Der Testlauf ließ sich nicht im Archiv ablegen (Der Speicherplatz ist erschöpft.); die ZIP-Datei wurde trotzdem angeboten.");
  });
});
