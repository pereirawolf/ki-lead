// @vitest-environment jsdom
// Farbschema in der Oberfläche: Auswahl unter „Einstellungen“, Speicherung, eigene Profilfarben.
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import React, { act } from "react";
import { leseOrdner, repoPfad } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, eingeben, klick, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(db);
  localStorage.clear();
  vi.resetModules();
});

/** App zeigen; fertig, sobald Profil und Farbschema angewendet sind */
async function zeigeApp() {
  const { default: App } = await import("../../src/App");
  await einhaengen(React.createElement(App));
  await bisWahr(() => document.querySelector(".chip-name") !== null && !!document.documentElement.dataset.farbschema);
}
async function einstellungen() {
  await klick("Einstellungen");
  await bisWahr(() => expect(farbSelect()).toBeTruthy());
}
function waehle(select: HTMLSelectElement, wert: string) {
  select.value = wert;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}
const farbSelect = () =>
  [...document.querySelectorAll("label.feld")].find((l) => l.textContent?.startsWith("Farbschema"))?.querySelector("select") as HTMLSelectElement;

it("Auswahl wirkt sofort auf das Dokument, wird gespeichert und nennt das verwendete Schema", async () => {
  await zeigeApp();
  await einstellungen();
  const optgroups = [...farbSelect().querySelectorAll("optgroup")].map((g) => g.label);
  expect(optgroups).toEqual(["Neutral", "Kontrast", "Bund", "Bundesländer", "Profil"]);
  expect(farbSelect().querySelectorAll("option")).toHaveLength(24);
  await act(async () => waehle(farbSelect(), "de-th"));
  await bisWahr(() => expect(db.werte.get("darstellung")).toEqual({ version: 1, auswahl: "de-th" }));
  expect(document.documentElement.dataset.farbschema).toBe("de-th");
  expect(document.documentElement.style.getPropertyValue("--amt")).toBe("#006F9C");
  expect(db.werte.get("darstellung")).toEqual({ version: 1, auswahl: "de-th" });
  expect(seitentext()).toContain("Verwendet: Thüringen");
  await act(async () => waehle(farbSelect(), "automatisch"));
  await bisWahr(() => expect(db.werte.get("darstellung")).toEqual({ version: 1, auswahl: "automatisch" }));
  // „Automatisch“ = Neutral · Hell oder Neutral · Night Mode nach System (hier hell), kein eigenes Schema
  expect(document.documentElement.dataset.farbschema).toBe("neutral-hell");
  expect(seitentext()).toContain("Automatisch: Neutral · Hell");
});

it("„Farben des aktiven Profils“ ohne Profilfarben: Ersatz mit Erklärung", async () => {
  await zeigeApp();
  await einstellungen();
  await act(async () => waehle(farbSelect(), "profil"));
  await bisWahr(() => expect(seitentext()).toContain("definiert kein Farbschema"));
  expect(document.documentElement.dataset.farbschema).toBe("neutral-hell");
});

it("eigene Profilfarben: Kontrastfehler verhindern das Speichern, gültige werden lokal gespeichert und verwendet", async () => {
  await zeigeApp();
  await einstellungen();
  const editor = document.querySelector("details.farb-editor") as HTMLDetailsElement;
  editor.open = true;
  const primaer = document.getElementById("farbe-amt") as HTMLInputElement;
  await eingeben(primaer, "#EEEEEE");
  expect(editor.textContent).toContain("„auf-amt“ auf „amt“");
  const speichern = [...editor.querySelectorAll("button")].find((b) => b.textContent === "Speichern und verwenden") as HTMLButtonElement;
  expect(speichern.disabled).toBe(true);
  await eingeben(primaer, "#234D68");
  expect(speichern.disabled).toBe(false);
  await klick(speichern);
  await bisWahr(() => [...db.werte.keys()].some((k) => k.startsWith("darstellung:profil:")));
  const schluessel = [...db.werte.keys()].find((k) => k.startsWith("darstellung:profil:"));
  expect(schluessel).toMatch(/^darstellung:profil:lead-beispiel#[0-9a-f]{64}$/);
  expect(db.werte.get(schluessel!).definition.farben.amt).toBe("#234D68");
  expect(document.documentElement.style.getPropertyValue("--amt")).toBe("#234D68");
  expect(farbSelect().value).toBe("profil");
});

it("ein fehlerhaftes Farbschema eines importierten Profils lässt die Einstellungen nicht abstürzen", async () => {
  const dateien = leseOrdner(repoPfad("profile/lead-beispiel"));
  const m = JSON.parse(dateien["profil.json"]);
  dateien["profil.json"] = JSON.stringify({ ...m, id: "kaputt", version: "9.9.9", farbschema: { basis: "neutral-hell", name: {}, farben: { amt: 5 } } });
  db.werte.set("profil:kaputt@9.9.9", { schluessel: "kaputt@9.9.9", quelle: "importiert", dateien });
  db.werte.set("aktives-profil", "kaputt@9.9.9");
  await zeigeApp();
  await einstellungen();
  expect(seitentext()).toContain("Darstellung");
  (document.querySelector("details.farb-editor") as HTMLDetailsElement).open = true;
  expect(farbSelect().querySelector('option[value="profil"]')!.textContent).toContain("keine definiert");
});

it("Editor: Vorschau mit Kontrastbasis zeigt die Signalfarben des Kontrastschemas", async () => {
  await zeigeApp();
  await einstellungen();
  const editor = document.querySelector("details.farb-editor") as HTMLDetailsElement;
  editor.open = true;
  const basis = [...editor.querySelectorAll("label.feld")]
    .find((l) => l.textContent?.startsWith("Ausgangsschema"))!
    .querySelector("select") as HTMLSelectElement;
  await act(async () => waehle(basis, "kontrast-hell"));
  const vorschau = editor.querySelector(".farb-vorschau") as HTMLElement;
  await bisWahr(() => expect(vorschau.style.getPropertyValue("--erheblich")).toBe("#8A3300"));
  expect(vorschau.style.getPropertyValue("--erheblich")).toBe("#8A3300");
  expect(vorschau.style.getPropertyValue("--band")).toBe("none");
});

it("Systemeinstellung „mehr Kontrast“: „Automatisch“ verwendet das Kontrastschema und folgt einer Änderung", async () => {
  const hoerer: Array<() => void> = [];
  let mehr = true;
  const original = window.matchMedia;
  window.matchMedia = ((q: string) => ({
    media: q,
    get matches() {
      return q === "(prefers-contrast: more)" ? mehr : false;
    },
    addEventListener: (_: string, f: () => void) => hoerer.push(f),
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  try {
    await zeigeApp();
    expect(document.documentElement.dataset.farbschema).toBe("kontrast-hell");
    expect(document.documentElement.dataset.kontrast).toBe("erhoeht");
    await einstellungen();
    expect(seitentext()).toContain("Systemeinstellung „mehr Kontrast“");
    expect(farbSelect().value).toBe("automatisch");
    mehr = false;
    await act(async () => hoerer.forEach((f) => f()));
    await bisWahr(() => expect(document.documentElement.dataset.farbschema).toBe("neutral-hell"));
    expect(document.documentElement.dataset.kontrast).toBeUndefined();
  } finally {
    window.matchMedia = original;
  }
});
