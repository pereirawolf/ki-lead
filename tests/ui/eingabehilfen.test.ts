// @vitest-environment jsdom
// LEAD-Eingabehilfen in der Meldungsmaske: zugeklappter Bereich je Textfeld, Einfügen nur im Zielfeld, Markierung,
// Rücknahme, gesperrte Vorlagen und Dopplungen; keine KI und keine Anfrage nach außen.
// Grundlage: Umsetzungsbeschreibung vom 21.10.2026 (A01, A02, A05–A07, A09, A10, A12, A13).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { profilPflicht } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { aushaengen, bisWahr, einhaengen, eingeben, klick, knopf, reactUmgebung } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

/** Jeder Anbieteraufruf wird gezählt und scheitert */
const aufrufe = vi.hoisted(() => ({ zahl: 0 }));
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    async senden() {
      aufrufe.zahl++;
      throw new Error("Kein Anbieteraufruf erwartet");
    }
  }
  return { ...echt, Verteiler };
});

let profilId = "";
beforeAll(async () => {
  reactUmgebung();
  profilId = (await profilPflicht()).manifest.id;
});
// Gefälschte Uhr nur für setTimeout: Das Autospeichern der App (1,2 s nach der letzten Eingabe) läuft über
// bisWahr() ohne echte Wartezeit ab; geprüft wird weiterhin der tatsächlich gespeicherte Zwischenstand.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});
afterEach(async () => {
  await aushaengen();
  vi.useRealTimers();
  speicherLeeren(db);
  aufrufe.zahl = 0;
  localStorage.clear();
  vi.restoreAllMocks();
  vi.resetModules();
});

const ENTWURF = () => `entwurf:${profilId}`;
const gespeichert = () => db.werte.get(ENTWURF())?.daten;

/** App mit einem gespeicherten Zwischenstand zeigen und zum Schritt der Sachverhalte wechseln */
async function zeigeApp(meldung: any, schluessel = "") {
  db.werte.set(ENTWURF(), { gespeichertAm: "2026-10-21T08:00:00Z", daten: structuredClone(meldung), profilVersion: "x", profilHash: "x" });
  if (schluessel) db.werte.set("schluessel:anthropic", schluessel);
  const { default: App } = await import("../../src/App");
  await einhaengen(React.createElement(App));
  await bisWahr(() => document.querySelector("nav.schritte") !== null);
  await zuSachverhalten();
}
async function zuSachverhalten() {
  await klick([...document.querySelectorAll("nav.schritte button")].find((e) => /Ereignisse/.test(e.textContent || "")) as HTMLButtonElement);
  await bisWahr(() => expect(document.querySelectorAll("details.eingabehilfen").length).toBeGreaterThan(0));
}
/** Textfeld-Block über die Feldbezeichnung (erster Sachverhalt) */
const feld = (label: string) =>
  [...document.querySelectorAll(".feld-lang")].find((f) => f.querySelector(":scope > label")?.textContent?.trim() === label) as HTMLElement;
const textfeld = (label: string) => feld(label).querySelector("textarea") as HTMLTextAreaElement;
const bereich = (label: string) => feld(label).querySelector("details.eingabehilfen") as HTMLDetailsElement;
const vorlage = (label: string, satz: string) => knopf(`${satz} einfügen in ${label}, Ereignis/Sachverhalt 1`, bereich(label));
const ohne = (d: any, pfad: (string | number)[]) => {
  const k = structuredClone(d);
  let o = k;
  for (const s of pfad.slice(0, -1)) o = o[s];
  delete o[pfad[pfad.length - 1]];
  return k;
};

const ANALYSE = ["Lage & Ereignis", "Risiken & Auswirkungen", "Maßnahmen & Handlungsempfehlungen", "Abhängigkeiten & Interdependenzen"];

describe("LEAD-Eingabehilfen in der Meldungsmaske", () => {
  it("A01/A02: ohne API-Schlüssel zugeklappt und bedienbar; keine KI-Schaltfläche, keine Modellwahl", async () => {
    await zeigeApp(ilkaMeldung("HE"));
    for (const label of [...ANALYSE, "Bewertung & Tendenz"]) {
      const b = bereich(label);
      expect(b, label).toBeTruthy();
      expect(b.open).toBe(false);
      expect(b.querySelector("summary")!.textContent).toMatch(/^LEAD-Eingabehilfen: /);
      expect(b.querySelector(".modellwahl")).toBeNull();
      expect(feld(label).textContent).not.toMatch(/KI-Unterst\u00fctzung/);
    }
    // Andere Textfelder (z. B. Bezeichnung) haben keinen Bereich
    expect(document.querySelectorAll("details.eingabehilfen").length).toBe(5 * ilkaMeldung("HE").sachverhalte.length);
  });

  it("A09/A12/A13: Einfügen ändert nur das Zielfeld, markiert die offene Stelle; Rücknahme exakt, nach Handeingabe gesperrt; null Anfragen", async () => {
    const abruf = vi.spyOn(globalThis, "fetch");
    const m = ilkaMeldung("HE");
    m.sachverhalte[0].analyse.risiken_auswirkungen = "Notstrom läuft [Q2].";
    await zeigeApp(m, "sk-test-NICHT-EXPORTIEREN-7f3a");
    const label = "Risiken & Auswirkungen";
    bereich(label).open = true;
    await klick(vorlage(label, "Szenario:"));
    const t = textfeld(label);
    expect(t.value).toBe("Notstrom läuft [Q2].\n\nSzenario: ⟦Annahme, Bedingung und mögliche Folge; Zeithorizont, soweit vorhanden⟧.");
    expect(document.activeElement).toBe(t);
    expect(t.value.slice(t.selectionStart, t.selectionEnd)).toBe("⟦Annahme, Bedingung und mögliche Folge; Zeithorizont, soweit vorhanden⟧");
    expect(bereich(label).querySelector("[role=status]")!.textContent).toMatch(/„Szenario:“ eingefügt/);

    // Gespeicherter Stand: nur dieses Feld anders
    await bisWahr(() => expect(gespeichert().sachverhalte[0].analyse.risiken_auswirkungen).toBe(t.value));
    const pfad = ["sachverhalte", 0, "analyse", "risiken_auswirkungen"];
    expect(ohne(gespeichert(), pfad)).toEqual(ohne(m, pfad));

    await klick(knopf(`Einfügung rückgängig: ${label}, Ereignis/Sachverhalt 1`, bereich(label)));
    expect(textfeld(label).value).toBe("Notstrom läuft [Q2].");
    expect(document.activeElement).toBe(textfeld(label));
    await bisWahr(() => expect(gespeichert()).toEqual(m));

    // Nach einer Handeingabe ist die Rücknahme gesperrt und nennt den Grund
    await klick(vorlage(label, "Eingetretene Wirkungen:"));
    await eingeben(textfeld(label), textfeld(label).value + " Ergänzt.");
    const zurueck = knopf(`Einfügung rückgängig: ${label}, Ereignis/Sachverhalt 1`, bereich(label))!;
    expect(zurueck.getAttribute("aria-disabled")).toBe("true");
    expect(bereich(label).textContent).toContain("Text wurde seit der Einfügung geändert");
    // Erreichbar, aber ohne Wirkung; der Grund wird angesagt
    const vorher = textfeld(label).value;
    await klick(zurueck);
    expect(textfeld(label).value).toBe(vorher);
    await bisWahr(() => expect(bereich(label).querySelector("[role=status]")!.textContent).toMatch(/Rücknahme ist deshalb gesperrt/));

    expect(aufrufe.zahl).toBe(0);
    expect(abruf).not.toHaveBeenCalled();
  });

  it("A10: Status ohne Vorauswahl; Quellenwahl setzt nur einen vorhandenen Marker", async () => {
    const m = ilkaMeldung("HE");
    m.sachverhalte[0].analyse.massnahmen_empfehlungen = "";
    await zeigeApp(m);
    const label = "Maßnahmen & Handlungsempfehlungen";
    bereich(label).open = true;
    const status = bereich(label).querySelector('select[aria-label^="Status"]') as HTMLSelectElement;
    const quelle = bereich(label).querySelector('select[aria-label^="Quelle"]') as HTMLSelectElement;
    expect(status.value).toBe("");
    expect([...status.options].map((o) => o.value)).toEqual(["", "geplant", "angefordert", "angeordnet", "begonnen", "umgesetzt", "wirksam", "beendet"]);
    expect(quelle.value).toBe("");
    await eingeben(status, "begonnen");
    await eingeben(quelle, "[Q2]");
    await klick(vorlage(label, "Bestehende Maßnahmen:"));
    expect(textfeld(label).value).toBe(
      "Bestehende Maßnahmen: ⟦verantwortliche Stelle⟧ – ⟦dokumentierte Maßnahme⟧; Status: begonnen; Stand: ⟦Datenstand⟧; [Q2].",
    );
    await bisWahr(() => expect(gespeichert().quellen).toBe(m.quellen));
  });

  it("A05–A07: Beurteilung erst mit Wert; Kernaussage und Kennsatz werden nicht gedoppelt; Radar und Auswahl bleiben", async () => {
    const m = ilkaMeldung("HE");
    const sv = m.sachverhalte[0];
    sv.sofort.beurteilung = "";
    sv.sofort.bewertung_text = "Kernaussage: K.\n\nText.\nHandlungsrelevant bis: 23.10.2026 – Rückmeldung, Betreiber; Grundlage: [Q1]";
    await zeigeApp(m);
    const label = "Bewertung & Tendenz";
    bereich(label).open = true;
    const beurteilung = vorlage(label, "Beurteilung „…“:")!;
    expect(beurteilung.getAttribute("aria-disabled")).toBe("true");
    expect(bereich(label).textContent).toContain("Erst eine Beurteilung wählen");
    await klick(beurteilung);
    expect(textfeld(label).value).toBe(sv.sofort.bewertung_text);
    expect(bereich(label).querySelector("[role=status]")!.textContent).toMatch(/Erst eine Beurteilung wählen/);

    await klick(vorlage(label, "Kernaussage:"));
    await klick(vorlage(label, "Handlungsrelevant bis:"));
    expect(textfeld(label).value).toBe(sv.sofort.bewertung_text);
    expect(bereich(label).querySelector("[role=status]")!.textContent).toMatch(/Weitere Fristen in dieser Zeile ergänzen, die früheste zuerst/);

    await klick(vorlage(label, "Neubewertung bei:"));
    expect(textfeld(label).value).toBe(
      "Kernaussage: K.\n\nText.\nNeubewertung bei: ⟦Indikator oder Bedingung, die eine Neubewertung erfordern würde⟧\nHandlungsrelevant bis: 23.10.2026 – Rückmeldung, Betreiber; Grundlage: [Q1]",
    );
    await bisWahr(() => expect(gespeichert().sachverhalte[0].sofort.bewertung_text).toBe(textfeld(label).value));
    const nach = gespeichert().sachverhalte[0].sofort;
    expect([nach.beurteilung, nach.tendenz, nach.lagenradar]).toEqual([sv.sofort.beurteilung, sv.sofort.tendenz, sv.sofort.lagenradar]);
  });

  it("Verlauf: bleibt beim Wechsel der Ansicht, entfällt mit „Neue Meldung“", async () => {
    await zeigeApp(ilkaMeldung("HE"));
    const label = "Lage & Ereignis";
    bereich(label).open = true;
    await eingeben(textfeld(label), "Sachstand.");
    await klick(vorlage(label, "Einordnung „…“:"));
    const nav = (n: RegExp) => knopf(n, document.querySelector(".hauptnav")!);
    await klick(nav(/^KI-Erfassung/));
    await klick(nav(/^Meldung/));
    await zuSachverhalten();
    expect(knopf(`Einfügung rückgängig: ${label}, Ereignis/Sachverhalt 1`)).toBeTruthy();
    await klick(knopf("Neue Meldung"));
    await zuSachverhalten();
    expect(knopf(`Einfügung rückgängig: ${label}, Ereignis/Sachverhalt 1`)).toBeUndefined();
  });

  it("Verlauf entfällt, wenn sich die Zahl der Sachverhalte ändert; Doppelklick fügt nur einmal ein", async () => {
    const m = ilkaMeldung("HE");
    m.sachverhalte[0].analyse.lage_ereignis = "Sachstand.";
    await zeigeApp(m);
    const label = "Lage & Ereignis";
    bereich(label).open = true;
    const k = vorlage(label, "Bestätigt ist")!;
    await klick(k);
    await klick(k);
    expect(textfeld(label).value).toBe("Sachstand.\n\nBestätigt ist ⟦tatsächlich bestätigter Sachstand⟧ (Stand: ⟦Datenstand⟧; ⟦Quellenverweis⟧).");
    expect(knopf(`Einfügung rückgängig: ${label}, Ereignis/Sachverhalt 1`)).toBeTruthy();
    await klick(knopf("Ereignis/Sachverhalt hinzufügen"));
    await bisWahr(() => expect(knopf(`Einfügung rückgängig: ${label}, Ereignis/Sachverhalt 1`)).toBeUndefined());
  });

  it("A13: Rücknahme stellt auch einen zuvor fehlenden Teil des Pfades exakt wieder her", async () => {
    const m = ilkaMeldung("HE");
    delete m.sachverhalte[0].analyse;
    await zeigeApp(m);
    const label = "Lage & Ereignis";
    bereich(label).open = true;
    await klick(vorlage(label, "Kernaussage:"));
    await bisWahr(() => expect(gespeichert().sachverhalte[0].analyse?.lage_ereignis).toBe("Kernaussage: ⟦zentrale Aussage zur Lage⟧."));
    await klick(knopf(`Einfügung rückgängig: ${label}, Ereignis/Sachverhalt 1`, bereich(label)));
    await bisWahr(() => expect("analyse" in gespeichert().sachverhalte[0]).toBe(false));
    expect(gespeichert()).toStrictEqual(m);
  });

  it("A13: Rücknahme setzt einen zuvor leeren Wert (null) wieder ein", async () => {
    const m = ilkaMeldung("HE");
    m.sachverhalte[0].analyse.lage_ereignis = null;
    await zeigeApp(m);
    const label = "Lage & Ereignis";
    bereich(label).open = true;
    await klick(vorlage(label, "Kernaussage:"));
    await bisWahr(() => expect(gespeichert().sachverhalte[0].analyse.lage_ereignis).toBe("Kernaussage: ⟦zentrale Aussage zur Lage⟧."));
    await klick(knopf(`Einfügung rückgängig: ${label}, Ereignis/Sachverhalt 1`, bereich(label)));
    await bisWahr(() => expect(gespeichert().sachverhalte[0].analyse.lage_ereignis).toBeNull());
    expect(gespeichert()).toStrictEqual(m);
  });
});
