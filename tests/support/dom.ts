// Hilfen für Oberflächentests (React DOM in jsdom): Einhängen, Aufräumen, Eingaben, Schaltflächen und
// bedingtes Warten auf einen Zustand statt fester Pausen.
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { expect, vi, type Mock } from "vitest";

let wurzel: Root | undefined;

/** Antwort auf Bestätigungsdialoge der App; Vorgabe: bestätigen (wie bis 0.6.4 window.confirm in den Tests) */
const vorgabeAntwort = () => true;
let antwort: (frage: string) => boolean = vorgabeAntwort;
/** Bestätigungsdialoge bleiben offen, statt beantwortet zu werden (Tests des Dialogs selbst) */
let dialogOffenLassen = false;

/**
 * React-act-Umgebung und Bestätigungsdialoge (einmal je Datei in beforeAll). Seit 0.6.5 (TP-2026-W44-20) fragt die App
 * nicht mehr mit window.confirm, sondern mit einem eigenen <dialog> (src/ui/bestaetigung.ts). jsdom kennt showModal
 * nicht; hier öffnet es den Dialog und beantwortet ihn sofort mit `antwort` (siehe dialogAntwort), so wie bis 0.6.4
 * der Stub von window.confirm.
 */
export function reactUmgebung(): void {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof HTMLDialogElement === "undefined") return;
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
    if (dialogOffenLassen) return;
    const frage = this.querySelector(".bestaetigung-text")?.textContent ?? "";
    const ja = antwort(frage);
    (this.querySelector(`[data-antwort="${ja ? "ja" : "nein"}"]`) as HTMLButtonElement | null)?.click();
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
}

/**
 * Antworten auf die nächsten Bestätigungsdialoge; liefert eine Attrappe, die mit dem Fragetext aufgerufen wird (wie bis
 * 0.6.4 vi.spyOn(window, "confirm")). Gilt bis zum Aushängen.
 */
export function dialogAntwort(ja: boolean | ((frage: string) => boolean) = true): Mock<(frage: string) => boolean> {
  const f = vi.fn((frage: string) => (typeof ja === "function" ? ja(frage) : ja));
  antwort = f;
  return f;
}

/** Bestätigungsdialoge offen lassen, um sie selbst zu bedienen (bis zum Aushängen) */
export function dialogeOffenLassen(): void {
  dialogOffenLassen = true;
}

/** Hängt ein Element in ein neues Wurzelelement ein */
export async function einhaengen(el: React.ReactElement): Promise<void> {
  const ziel = document.createElement("div");
  document.body.appendChild(ziel);
  wurzel = createRoot(ziel);
  await act(async () => wurzel!.render(el));
}

/**
 * Hängt das zuletzt eingehängte Element aus und leert das Dokument (für afterEach). Seit 0.6.5 auch die Adresse
 * (Hash-Routing der App, TP-2026-W44-20) und die Antwort auf Bestätigungsdialoge, damit kein Test den nächsten prägt.
 */
export async function aushaengen(): Promise<void> {
  if (wurzel) await act(async () => wurzel!.unmount());
  wurzel = undefined;
  document.body.innerHTML = "";
  antwort = vorgabeAntwort;
  dialogOffenLassen = false;
  if (typeof location !== "undefined" && location.hash) history.replaceState(null, "", location.pathname + location.search);
}

/** setTimeout beim Laden dieser Datei, also vor jedem vi.useFakeTimers() eines Tests */
const echtesSetTimeout = globalThis.setTimeout;

/**
 * Lässt React und ausstehende Promises einmal laufen (ein Makrotask). Ist im Test setTimeout gefälscht
 * (`vi.useFakeTimers({ toFake: ["setTimeout", …] })`), wird die Uhr um `ms` vorgestellt statt real zu warten;
 * Zeitgeber der App (etwa die Verzögerung des Autospeicherns) laufen dann ohne echte Wartezeit ab. Fälscht ein
 * Test nur Date oder setInterval, wartet takt() wie bisher real.
 */
export async function takt(ms = 0): Promise<void> {
  if (vi.isFakeTimers() && globalThis.setTimeout !== echtesSetTimeout) {
    await act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
    return;
  }
  await act(async () => void (await new Promise((r) => setTimeout(r, ms))));
}

/**
 * Wartet, bis die Prüfung ohne Fehler durchläuft (und nicht false liefert), höchstens runden × 10 ms.
 * Zählt Runden statt die Uhr zu lesen, damit Tests mit gefälschtem Date nicht hängen bleiben.
 * Bei Zeitüberschreitung wird der letzte Fehler der Prüfung geworfen.
 */
export async function bisWahr(pruefung: () => unknown, { runden = 300 } = {}): Promise<void> {
  let letzter: unknown;
  for (let i = 0; i <= runden; i++) {
    try {
      if ((await pruefung()) !== false) return;
      letzter = new Error("Bedingung nicht erfüllt");
    } catch (e) {
      letzter = e;
    }
    await takt(10);
  }
  throw letzter;
}

/** Schaltfläche über ihren Text oder ihr aria-label (genau) */
export function knopf(text: string | RegExp, im: ParentNode = document): HTMLButtonElement | undefined {
  return [...im.querySelectorAll("button")].find((b) => {
    const t = b.textContent?.trim() || "";
    return typeof text === "string" ? t === text || b.getAttribute("aria-label") === text : text.test(t);
  }) as HTMLButtonElement | undefined;
}

/** Klickt eine vorhandene Schaltfläche (scheitert verständlich, wenn sie fehlt) */
export async function klick(ziel: string | RegExp | HTMLElement | undefined, im: ParentNode = document): Promise<void> {
  const el = typeof ziel === "string" || ziel instanceof RegExp ? knopf(ziel, im) : ziel;
  expect(el, `Schaltfläche ${String(ziel)}`).toBeTruthy();
  await act(async () => el!.click());
}

/** Setzt den Wert eines kontrollierten Eingabefelds so, dass React die Änderung erhält */
export function setzen(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, wert: string): void {
  const proto =
    el instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, wert);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

/** setzen() innerhalb von act */
export async function eingeben(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, wert: string): Promise<void> {
  await act(async () => setzen(el, wert));
}

/** Textinhalt des Dokuments */
export const seitentext = () => document.body.textContent || "";
