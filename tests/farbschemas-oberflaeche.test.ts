// @vitest-environment jsdom
// Farbschema in der Oberfläche: Auswahl unter „Einstellungen“, Speicherung, eigene Profilfarben.
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }));
vi.mock("idb-keyval", () => ({
  get: vi.fn(async (k: string) => structuredClone(db.werte.get(k))),
  set: vi.fn(async (k: string, v: any) => void db.werte.set(k, structuredClone(v))),
  del: vi.fn(async (k: string) => void db.werte.delete(k)),
  keys: vi.fn(async () => [...db.werte.keys()]),
  entries: vi.fn(async () => [...db.werte.entries()]),
}));

let root: Root | undefined;
beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.confirm = () => true;
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  document.body.innerHTML = "";
  db.werte.clear();
  localStorage.clear();
  vi.resetModules();
});

const warte = (ms = 40) => act(async () => void (await new Promise((r) => setTimeout(r, ms))));
async function zeigeApp() {
  const { default: App } = await import("../src/App");
  const ziel = document.createElement("div");
  document.body.appendChild(ziel);
  root = createRoot(ziel);
  await act(async () => root!.render(React.createElement(App)));
  await warte(80);
}
async function klick(text: string) {
  const b = [...document.querySelectorAll("button")].find((e) => e.textContent?.trim() === text);
  expect(b, text).toBeTruthy();
  await act(async () => b!.click());
  await warte();
}
function waehle(select: HTMLSelectElement, wert: string) {
  select.value = wert;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}
const farbSelect = () =>
  [...document.querySelectorAll("label.feld")].find((l) => l.textContent?.startsWith("Farbschema"))!.querySelector("select") as HTMLSelectElement;

it("Auswahl wirkt sofort auf das Dokument, wird gespeichert und nennt das verwendete Schema", async () => {
  await zeigeApp();
  await klick("Einstellungen");
  const optgroups = [...farbSelect().querySelectorAll("optgroup")].map((g) => g.label);
  expect(optgroups).toEqual(["Neutral", "Kontrast", "Bund", "Bundesländer", "Profil"]);
  expect(farbSelect().querySelectorAll("option")).toHaveLength(24);
  await act(async () => waehle(farbSelect(), "de-th"));
  await warte();
  expect(document.documentElement.dataset.farbschema).toBe("de-th");
  expect(document.documentElement.style.getPropertyValue("--amt")).toBe("#006F9C");
  expect(db.werte.get("darstellung")).toEqual({ version: 1, auswahl: "de-th" });
  expect(document.body.textContent).toContain("Verwendet: Thüringen");
  await act(async () => waehle(farbSelect(), "automatisch"));
  await warte();
  expect(document.documentElement.dataset.farbschema).toBeUndefined();
});

it("„Farben des aktiven Profils“ ohne Profilfarben: Ersatz mit Erklärung", async () => {
  await zeigeApp();
  await klick("Einstellungen");
  await act(async () => waehle(farbSelect(), "profil"));
  await warte();
  expect(document.documentElement.dataset.farbschema).toBe("neutral-hell");
  expect(document.body.textContent).toContain("definiert kein Farbschema");
});

it("eigene Profilfarben: Kontrastfehler verhindern das Speichern, gültige werden lokal gespeichert und verwendet", async () => {
  await zeigeApp();
  await klick("Einstellungen");
  const editor = document.querySelector("details.farb-editor") as HTMLDetailsElement;
  editor.open = true;
  const primaer = document.getElementById("farbe-amt") as HTMLInputElement;
  const setzen = (el: HTMLInputElement, wert: string) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, wert);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  await act(async () => setzen(primaer, "#EEEEEE"));
  await warte();
  expect(editor.textContent).toContain("„auf-amt“ auf „amt“");
  const speichern = [...editor.querySelectorAll("button")].find((b) => b.textContent === "Speichern und verwenden") as HTMLButtonElement;
  expect(speichern.disabled).toBe(true);
  await act(async () => setzen(primaer, "#234D68"));
  await warte();
  expect(speichern.disabled).toBe(false);
  await act(async () => speichern.click());
  await warte();
  const schluessel = [...db.werte.keys()].find((k) => k.startsWith("darstellung:profil:"));
  expect(schluessel).toMatch(/^darstellung:profil:lead-beispiel#[0-9a-f]{64}$/);
  expect(db.werte.get(schluessel!).definition.farben.amt).toBe("#234D68");
  expect(document.documentElement.style.getPropertyValue("--amt")).toBe("#234D68");
  expect(farbSelect().value).toBe("profil");
});

it("ein fehlerhaftes Farbschema eines importierten Profils lässt die Einstellungen nicht abstürzen", async () => {
  const { leseOrdner } = await import("./hilfen");
  const { join } = await import("node:path");
  const dateien = leseOrdner(join(__dirname, "../profile/lead-beispiel"));
  const m = JSON.parse(dateien["profil.json"]);
  dateien["profil.json"] = JSON.stringify({ ...m, id: "kaputt", version: "9.9.9", farbschema: { basis: "neutral-hell", name: {}, farben: { amt: 5 } } });
  db.werte.set("profil:kaputt@9.9.9", { schluessel: "kaputt@9.9.9", quelle: "importiert", dateien });
  db.werte.set("aktives-profil", "kaputt@9.9.9");
  await zeigeApp();
  await klick("Einstellungen");
  expect(document.body.textContent).toContain("Darstellung");
  (document.querySelector("details.farb-editor") as HTMLDetailsElement).open = true;
  await warte();
  expect(farbSelect().querySelector('option[value="profil"]')!.textContent).toContain("keine definiert");
});
