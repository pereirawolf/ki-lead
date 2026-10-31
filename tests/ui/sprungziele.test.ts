// @vitest-environment jsdom
// Sprungziele nach einem Wechsel von Schritt, Bereich, Reiter, Phase oder Ansicht (seit 0.6.7, Rückmeldung des
// Herausgebers vom 29.10.2026): Bis 0.6.6 blieb nach „Weiter: …“ die Scrollhöhe stehen, die neue Ansicht stand am
// Seitenende. jsdom rechnet kein Layout; die Lage der Elemente wird hier gesetzt, wo es auf sie ankommt. Die echte
// Ausrichtung im Browser prüft tests/browser/sprungziele.spec.ts.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profilPflicht } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung, scrollAufrufe } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD, type Einstellungen } from "../../src/pipeline/einstellungen";
import type { Meldung } from "../../src/kern/typen";
import { ausstehendenSprungAusfuehren, springeZu } from "../../src/ui/sprung";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

import { MeldungAnsicht } from "../../src/ui/Meldung";
import { EinstellungenAnsicht } from "../../src/ui/Einstellungen";

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
  localStorage.clear();
  vi.restoreAllMocks();
  vi.resetModules();
  setzeScrollY(0);
});

function setzeScrollY(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
}

/** Lage eines Elements im Fenster vorgeben (jsdom liefert sonst überall 0) */
function lage(el: Element, top: number, hoehe = 40) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + hoehe,
    height: hoehe,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
}

describe("springeZu", () => {
  function aufbau() {
    document.body.innerHTML = `<header class="kopf"></header><main><button id="knopf">Knopf</button><section id="ziel"><h2 id="titel">Titel</h2></section></main>`;
    lage(document.querySelector(".kopf")!, 0, 60);
    return { ziel: document.getElementById("ziel")!, titel: document.getElementById("titel")!, knopf: document.getElementById("knopf")! };
  }

  it("richtet den Anfang des Ziels unter dem Kopf aus (Kopfhöhe plus 12 px) und fokussiert die Überschrift", () => {
    const { ziel, titel } = aufbau();
    setzeScrollY(2000);
    lage(ziel, 500);
    expect(springeZu(ziel, titel, { fokus: true })).toBe(true);
    expect(scrollAufrufe()).toEqual([2000 + 500 - 72]);
    expect(document.activeElement).toBe(titel);
    // programmatisch fokussierbar, ohne in die Tab-Reihenfolge zu kommen
    expect(titel.getAttribute("tabindex")).toBe("-1");
  });

  it("nicht über den Seitenanfang hinaus", () => {
    const { ziel } = aufbau();
    lage(ziel, 30);
    springeZu(ziel);
    expect(scrollAufrufe()).toEqual([0]);
  });

  it("nurWennNoetig: steht der Anfang im oberen Teil des Fensters, bleibt die Ansicht stehen", () => {
    const { ziel } = aufbau();
    lage(ziel, 120);
    springeZu(ziel, null, { nurWennNoetig: true });
    expect(scrollAufrufe()).toEqual([]);
    lage(ziel, -300);
    springeZu(ziel, null, { nurWennNoetig: true });
    expect(scrollAufrufe()).toHaveLength(1);
    lage(ziel, window.innerHeight * 0.8);
    springeZu(ziel, null, { nurWennNoetig: true });
    expect(scrollAufrufe()).toHaveLength(1);
  });

  it("„wenn-verloren“ lässt einen fokussierten Knopf in Ruhe, holt aber einen verlorenen Fokus", () => {
    const { ziel, titel, knopf: k } = aufbau();
    k.focus();
    springeZu(ziel, titel, { fokus: "wenn-verloren" });
    expect(document.activeElement).toBe(k);
    k.remove();
    springeZu(ziel, titel, { fokus: "wenn-verloren" });
    expect(document.activeElement).toBe(titel);
  });

  it("in einer verborgenen Ansicht: kein Sprung, aber vorgemerkt und beim Zeigen nachgeholt (ohne Fokus)", () => {
    document.body.innerHTML = `<div id="rahmen" hidden><section id="ziel"><h2 id="titel">T</h2></section></div><button id="nav">Nav</button>`;
    const rahmen = document.getElementById("rahmen")!;
    const nav = document.getElementById("nav")!;
    nav.focus();
    expect(springeZu(document.getElementById("ziel"), document.getElementById("titel"), { fokus: true })).toBe(false);
    expect(scrollAufrufe()).toEqual([]);
    rahmen.hidden = false;
    expect(ausstehendenSprungAusfuehren(rahmen)).toBe(true);
    expect(scrollAufrufe()).toHaveLength(1);
    expect(document.activeElement).toBe(nav);
    expect(ausstehendenSprungAusfuehren(rahmen)).toBe(false);
  });
});

async function zeigeMeldung(meldung: Meldung) {
  const profil = await profilPflicht("lead-beispiel");
  function Halter() {
    const [m, setM] = React.useState(meldung);
    return React.createElement(MeldungAnsicht, {
      profil,
      meldung: m,
      setMeldung: setM,
      neu: () => {},
      ki: { schluessel: { anthropic: "", openai: "", mistral: "", stelle: "" }, einstellungen: STANDARD },
    });
  }
  await einhaengen(React.createElement(Halter));
  scrollAufrufe();
  return profil;
}
const titel = () => document.getElementById("schritt-titel");
const schrittKnopf = (name: RegExp) => [...document.querySelectorAll<HTMLButtonElement>("nav.schritte button")].find((b) => name.test(b.textContent || ""))!;

describe("Meldung: Sprungziele der Schritte", () => {
  it("„Weiter: …“ und „Zurück: …“ springen an den Anfang des Arbeitsbereichs und fokussieren die neue Überschrift", async () => {
    await zeigeMeldung(ilkaMeldung("Bund"));
    setzeScrollY(3000);
    lage(document.querySelector(".meldung .arbeitsbereich")!, -2500);
    await klick(/^Weiter: Ereignisse\/Sachverhalte/);
    expect(titel()?.textContent).toBe("Ereignisse/Sachverhalte");
    expect(scrollAufrufe()).toEqual([3000 - 2500 - 12]);
    expect(document.activeElement).toBe(titel());

    await klick(/^Weiter: Quellen & Referenzen/);
    expect(titel()?.textContent).toBe("Quellen & Referenzen");
    expect(scrollAufrufe()).toHaveLength(1);
    expect(document.activeElement).toBe(titel());

    await klick(/^Zurück: Ereignisse\/Sachverhalte/);
    expect(titel()?.textContent).toBe("Ereignisse/Sachverhalte");
    expect(scrollAufrufe()).toHaveLength(1);
    expect(document.activeElement).toBe(titel());
  });

  it("bis „Weiter: Management Summary“: jeder Schritt beginnt oben", async () => {
    const profil = await zeigeMeldung(ilkaMeldung("Bund"));
    for (const s of profil.ui.schritte) {
      expect(titel()?.textContent).toBe(s.titel);
      const weiter = knopf(/^Weiter:/)!;
      await klick(weiter);
      expect(scrollAufrufe(), `nach „${weiter.textContent}“`).toHaveLength(1);
      expect(document.activeElement).toBe(titel());
    }
    expect(titel()?.textContent).toBe("Management Summary");
  });

  it("Schrittleiste: Fokus bleibt auf dem Knopf; gescrollt wird nur, wenn der Anfang nicht im Bild ist", async () => {
    await zeigeMeldung(ilkaMeldung("Bund"));
    const bereich = document.querySelector(".meldung .arbeitsbereich")!;
    lage(bereich, 150);
    const k = schrittKnopf(/Quellen & Referenzen/);
    k.focus();
    await klick(k);
    expect(scrollAufrufe()).toEqual([]);
    expect(document.activeElement).toBe(k);
    lage(bereich, -800);
    const k2 = schrittKnopf(/Lagedarstellung|Ereignisse/);
    k2.focus();
    await klick(k2);
    expect(scrollAufrufe()).toHaveLength(1);
    expect(document.activeElement).toBe(k2);
  });

  it("„Ereignis/Sachverhalt hinzufügen“ fokussiert das erste Feld des neuen Eintrags; „Entfernen“ den vorigen Eintrag", async () => {
    await zeigeMeldung(ilkaMeldung("Bund"));
    await klick(schrittKnopf(/Ereignisse\/Sachverhalte/));
    const eintraege = () => [...document.querySelectorAll<HTMLElement>(".schritt-inhalt .liste > .element")];
    const vorher = eintraege().length;
    scrollAufrufe();
    await klick("Ereignis/Sachverhalt hinzufügen");
    expect(eintraege()).toHaveLength(vorher + 1);
    const neu = eintraege().at(-1)!;
    expect(scrollAufrufe()).toHaveLength(1);
    expect(neu.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.matches("input, select, textarea")).toBe(true);

    await klick(knopf(`Ereignis/Sachverhalt ${vorher + 1} entfernen`)!);
    await bisWahr(() => expect(eintraege()).toHaveLength(vorher));
    expect(document.activeElement).toBe(eintraege().at(-1)!.querySelector("h3"));
  });
});

describe("Einstellungen: Sprungziele der Bereiche", () => {
  function MitZustand({ profil }: { profil: any }) {
    const [e, setE] = React.useState<Einstellungen>(STANDARD);
    return React.createElement(EinstellungenAnsicht, {
      profil,
      einstellungen: e,
      setEinstellungen: setE,
      schluessel: { anthropic: "", openai: "", mistral: "" } as any,
      setSchluessel: () => {},
    });
  }

  it("aus der Übersicht in einen Bereich: Anfang des Arbeitsbereichs, Fokus auf dessen Überschrift", async () => {
    await einhaengen(React.createElement(MitZustand, { profil: await profilPflicht() }));
    scrollAufrufe();
    await klick("Schlüssel hinterlegen");
    const h2 = document.querySelector(".bereich-inhalt h2");
    expect(h2?.textContent).toBe("KI-Anbieter & API");
    expect(scrollAufrufe()).toHaveLength(1);
    expect(document.activeElement).toBe(h2);
  });

  it("über die Bereichsleiste: Fokus bleibt auf dem Knopf", async () => {
    await einhaengen(React.createElement(MitZustand, { profil: null }));
    const nav = document.querySelector('nav[aria-label="Bereiche der Einstellungen"]') as HTMLElement;
    const k = knopf("Recherche & Grenzen", nav)!;
    k.focus();
    await klick(k);
    expect(document.activeElement).toBe(k);
  });
});

describe("App: Sprungziele beim Wechsel der Ansicht", () => {
  async function zeigeApp() {
    const { default: App } = await import("../../src/App");
    await einhaengen(React.createElement(App));
    await bisWahr(() => expect(document.querySelector(".meldung .arbeitsbereich")).toBeTruthy());
    scrollAufrufe();
  }
  const scrollen = (y: number) => {
    setzeScrollY(y);
    window.dispatchEvent(new Event("scroll"));
  };

  it("Hauptnavigation: Seitenanfang; die KI-Erfassung kehrt an die zuletzt gesehene Stelle zurück", async () => {
    await zeigeApp();
    scrollen(1500);
    await klick(knopf("KI-Erfassung", document.querySelector(".hauptnav")!)!);
    // KI zum ersten Mal: zuletzt gesehene Stelle ist der Anfang
    expect(scrollAufrufe()).toEqual([0]);
    scrollen(900);
    await klick(knopf("Einstellungen", document.querySelector(".hauptnav")!)!);
    await bisWahr(() => expect(document.querySelector(".einstellungen")).toBeTruthy());
    expect(scrollAufrufe()).toEqual([0]);
    scrollen(400);
    await klick(knopf("KI-Erfassung", document.querySelector(".hauptnav")!)!);
    expect(scrollAufrufe()).toEqual([900]);
    await klick(knopf("Erfassung", document.querySelector(".hauptnav")!)!);
    expect(scrollAufrufe()).toEqual([0]);
  });
});
