// @vitest-environment jsdom
// Vergleichslauf Ilka unter „Einstellungen → Modelle & Verarbeitung“ (seit 0.5.8): Anzeige der Konfiguration,
// Vorgabe drei Läufe, fehlender Schlüssel, Ablauf mit Attrappe und ZIP-Datei; seit 0.5.12 Wahl des Umfangs.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import JSZip from "jszip";
import { leseOrdner, profilPflicht, repoPfad } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung } from "../support/dom";
import { llmAntwort, meldungsAntwort } from "../support/anbieter";
import { STANDARD, standardProfilAnwenden } from "../../src/pipeline/einstellungen";
import type { LlmAnbieter } from "../../src/anbieter/typen";
import type { Schluessel } from "../../src/anbieter/verteiler";

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: Blob }[] }));
vi.mock("../../src/speicher/speicher", async (orig) => {
  const echt = await orig<typeof import("../../src/speicher/speicher")>();
  return { ...echt, dateiAnbieten: (inhalt: Blob, name: string) => void downloads.liste.push({ name, inhalt }) };
});

import { VergleichslaufAbschnitt } from "../../src/ui/Vergleichslauf";
import { EinstellungenAnsicht } from "../../src/ui/Einstellungen";

beforeAll(reactUmgebung);
afterEach(async () => {
  downloads.liste = [];
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

describe("Vergleichslauf Ilka in den Einstellungen", () => {
  it("steht unter „Modelle & Verarbeitung“ und zeigt die wirksame Konfiguration mit drei Läufen als Vorgabe", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(EinstellungenAnsicht, {
        profil,
        einstellungen: STANDARD,
        setEinstellungen: () => {},
        schluessel: OHNE,
        setSchluessel: () => {},
        bereich: "modelle",
      }),
    );
    expect(document.querySelector("#vergleichslauf-titel")?.textContent).toBe("Vergleichslauf Ilka");
    expect(text()).toContain("S1: claude-haiku-5-5 (hoch) · Anthropic");
    expect(text()).toContain("S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic");
    expect(anzahlFeld().value).toBe("3");
    // ohne Schlüssel nicht startbar, mit Hinweis auf den fehlenden Anbieter
    expect(knopf("Vergleichslauf starten")?.disabled).toBe(true);
    expect(text()).toContain("fehlt der Schlüssel für Anthropic");
  });

  it("startet mit der Mistral-Konfiguration, zeigt die Läufe und bietet die ZIP-Datei an", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const e = { ...standardProfilAnwenden(STANDARD, "mistral"), mistralEndpunkt: "global" as const };
    const anbieterFuer = vi.fn(() => attrappe(JSON.parse(dateien[REFERENZ])));
    await einhaengen(
      React.createElement(VergleichslaufAbschnitt, {
        profil,
        einstellungen: e,
        schluessel: { ...OHNE, mistral: "test" },
        datenLaden: async () => ({ profil: await profilPflicht("lead-beispiel"), dateien }),
        anbieterFuer,
      }),
    );
    expect(text()).toContain("Mistral-Endpunkt: global (api.mistral.ai)");
    await klick("Vergleichslauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(anbieterFuer).toHaveBeenCalledTimes(1);
    const [s, eLauf] = anbieterFuer.mock.calls[0] as unknown as [Schluessel, typeof e];
    expect(s.mistral).toBe("test");
    expect(eLauf.modelle).toMatchObject({ vorverarbeitung: "mistral-small-2603", verdichtung: "mistral-medium-3-5", reparatur: "mistral-small-2603" });
    expect(eLauf.mistralEndpunkt).toBe("global");
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Vergleichslauf_Ilka_mistral-medium-3-5-[a-z]+_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    expect(JSON.parse(await zip.file("reihe.json")!.async("string")).laeufe).toHaveLength(3);
    expect(document.querySelectorAll(".vergleichslauf tbody tr")).toHaveLength(3);
    expect(text()).toContain("3 von 3 Läufen, technisch bestanden (T1–T8): 3");
    await klick("ZIP herunterladen");
    expect(downloads.liste).toHaveLength(2);
  });

  it("AV-2026-W43-04: Variante des Plans standardprofile-ilka wählen, ohne die Einstellungen zu ändern", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(VergleichslaufAbschnitt, { profil, einstellungen: STANDARD, schluessel: { ...OHNE, anthropic: "x" } }));
    const auswahl = document.querySelector(".vergleichslauf select") as HTMLSelectElement;
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
    expect(knopf("Vergleichslauf starten")?.disabled).toBe(true);
  });

  it("AV-2026-W43-23, -24: Mix-Variante M1 mit S1 OpenAI, S2 Anthropic und Reparatur Haiku (seit 0.5.15); fehlender OpenAI-Schlüssel gemeldet", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(VergleichslaufAbschnitt, { profil, einstellungen: STANDARD, schluessel: { ...OHNE, anthropic: "x" } }));
    const auswahl = document.querySelector(".vergleichslauf select") as HTMLSelectElement;
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
    expect(knopf("Vergleichslauf starten")?.disabled).toBe(true);
  });
});

describe("Vergleichslauf Ilka: Umfang wählen (seit 0.5.12)", () => {
  const umfangFeld = (titel: string) =>
    [...document.querySelectorAll<HTMLInputElement>('input[name="vergleichslauf-umfang"]')].find((i) => i.closest("label")?.textContent?.startsWith(titel))!;
  async function umfangWaehlen(titel: string) {
    await act(async () => {
      umfangFeld(titel).click();
    });
  }
  const auswahl = () => document.querySelector(".vergleichslauf select") as HTMLSelectElement;
  // React bemerkt die Eingabe nur über den nativen Setter
  async function anzahlSetzen(wert: string) {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(anzahlFeld(), wert);
      anzahlFeld().dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  const konfiguration = () => [...document.querySelectorAll(".vergleichslauf-konfiguration li")].map((li) => li.textContent);

  it("bietet fünf Umfänge als Radiogruppe; Vorgabe ist S1 + S2 + S3 aus Rohdaten", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(VergleichslaufAbschnitt, { profil, einstellungen: STANDARD, schluessel: { ...OHNE, anthropic: "x" } }));
    const gruppe = document.querySelector(".vergleichslauf fieldset")!;
    expect(gruppe.querySelector("legend")?.textContent).toBe("Was wird getestet?");
    const felder = [...gruppe.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    expect(felder.map((f) => f.closest("label")?.querySelector("strong")?.textContent)).toEqual([
      "S1 (aus Rohdaten)",
      "S1 + S2 (aus Rohdaten)",
      "S1 + S2 + S3 (aus Rohdaten)",
      "S2 + S3 (aus Musterfassung)",
      "MS (aus Musterfassung)",
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

    await umfangWaehlen("MS (aus Musterfassung)");
    expect(konfiguration()).toEqual(["Management Summary: claude-sonnet-5-5 (mittel) · Anthropic"]);
    expect([...auswahl().querySelectorAll("optgroup")].map((g) => g.label)).toEqual(["Bewertungsplan management-summary-ilka"]);
    expect(text()).toContain("(grob, ohne Messwert für diese Konfiguration)");
    expect(knopf("Vergleichslauf starten")?.disabled).toBe(false);
  });

  it("eine Variante gilt nur für die Umfänge ihres Plans", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(VergleichslaufAbschnitt, { profil, einstellungen: STANDARD, schluessel: { ...OHNE, anthropic: "x" } }));
    await umfangWaehlen("MS (aus Musterfassung)");
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
      React.createElement(VergleichslaufAbschnitt, {
        profil,
        einstellungen: STANDARD,
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil, dateien }),
        anbieterFuer: () => anbieter,
      }),
    );
    await umfangWaehlen("S1 (aus Rohdaten)");
    await anzahlSetzen("2");
    await klick("Vergleichslauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(senden).toHaveBeenCalledTimes(2);
    expect(senden.mock.calls.every(([a]) => !!a.jsonSchema)).toBe(true);
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Vergleichslauf_Ilka_S1_claude-haiku-5-5-high_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    expect(JSON.parse(await zip.file("reihe.json")!.async("string")).umfang).toBe("s1");
    expect(Object.keys(zip.files).filter((n) => n.startsWith("s1/") && !zip.files[n].dir)).toHaveLength(2);
    expect(text()).toContain("S1 (aus Rohdaten): 2 von 2 Läufen, technisch bestanden (T1, T2, T4–T6): 2");
    expect([...document.querySelectorAll(".vergleichslauf thead th")].map((th) => th.textContent)).toContain("Gliederung wie Musterfassung");
    // ein Sachverhalt statt zwei: nicht wie die Musterfassung
    expect(document.querySelector(".vergleichslauf tbody tr")?.textContent).toContain("nein");
  });

  it("MS aus Musterfassung: Management Summary je Lauf, Vorprüfung in der Tabelle, ZIP mit Texten", async () => {
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
      React.createElement(VergleichslaufAbschnitt, {
        profil,
        einstellungen: STANDARD,
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil, dateien }),
        anbieterFuer: () => anbieter,
      }),
    );
    await umfangWaehlen("MS (aus Musterfassung)");
    await klick("Vergleichslauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(anfragen).toEqual(["claude-sonnet-5-5", "claude-sonnet-5-5", "claude-sonnet-5-5"]);
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Vergleichslauf_Ilka_MS-Muster_claude-sonnet-5-5-medium_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
    expect(reihe).toMatchObject({ format: "ki-lead-kurzfassung-reihe/1", umfang: "ms", quelle: "app", ohne_auffaelligkeit: 3 });
    expect(Object.keys(zip.files).filter((n) => n.startsWith("kurzfassungen/") && !zip.files[n].dir)).toHaveLength(3);
    expect(text()).toContain("MS (aus Musterfassung): 3 von 3 Läufen, ohne Auffälligkeit der Vorprüfung: 3");
    expect([...document.querySelectorAll(".vergleichslauf tbody tr td:last-child")].map((td) => td.textContent)).toEqual(["keine", "keine", "keine"]);
  });

  it("S2 + S3 aus Musterfassung: kein S1-Aufruf, fester Zuschnitt in der Reihe", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const anbieter = attrappe(JSON.parse(dateien[REFERENZ]));
    const senden = vi.spyOn(anbieter, "senden");
    await einhaengen(
      React.createElement(VergleichslaufAbschnitt, {
        profil,
        einstellungen: STANDARD,
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil, dateien }),
        anbieterFuer: () => anbieter,
      }),
    );
    await umfangWaehlen("S2 + S3 (aus Musterfassung)");
    await anzahlSetzen("1");
    await klick("Vergleichslauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(senden).toHaveBeenCalledTimes(1);
    expect(senden.mock.calls[0][0].jsonSchema).toBeUndefined();
    const zip = await JSZip.loadAsync(await downloads.liste[0].inhalt.arrayBuffer());
    const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
    expect(reihe).toMatchObject({ umfang: "s2-s3", s1_fest: { datei: "evaluation/material/ilka-s1-zuschnitt-a.json" } });
    expect(downloads.liste[0].name).toMatch(/^KI-LEAD_Vergleichslauf_Ilka_S2-S3-Muster_claude-opus-5-5-medium_/);
  });
});
