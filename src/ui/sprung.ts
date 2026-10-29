// Sprungziele nach einem Wechsel von Schritt, Phase, Bereich, Reiter oder Ansicht (seit 0.6.7). Bis 0.6.6 tauschte die
// App nur den Inhalt aus; das Dokument behielt seine Scrollhöhe, und nach „Weiter: …“ am Ende eines langen Schritts
// stand die Ansicht am Ende des neuen Schritts. Jetzt richtet die App den Anfang des neuen Inhalts unter dem
// mitlaufenden Kopf aus (sofort, ohne Animation: ein sanfter Lauf über viele Bildschirmhöhen orientiert nicht) und
// setzt den Fokus auf dessen Überschrift, wenn der auslösende Knopf verschwindet oder an anderer Stelle steht.

import { useCallback, useLayoutEffect, useRef, useState } from "react";

export interface SprungOptionen {
  /**
   * Fokus auf `fokus` (sonst das Ziel): `true` immer, `"wenn-verloren"` nur, wenn der Fokus auf dem Dokument liegt
   * (der fokussierte Knopf ist verschwunden), `false` nie (Vorgabe).
   */
  fokus?: boolean | "wenn-verloren";
  /** Nur scrollen, wenn der Anfang des Ziels nicht schon im oberen Teil des sichtbaren Bereichs steht */
  nurWennNoetig?: boolean;
}

/** Abstand zwischen dem Kopf der App und dem Sprungziel in Pixeln */
const ABSTAND = 12;
/** Mit `nurWennNoetig` bleibt die Ansicht stehen, wenn der Anfang des Ziels im oberen Anteil des Fensters steht */
const OBERER_ANTEIL = 0.4;

/** Höhe des mitlaufenden Kopfs der App (ein- oder zweizeilig je nach Breite) */
export function kopfHoehe(): number {
  const kopf = document.querySelector<HTMLElement>(".kopf");
  return kopf ? kopf.getBoundingClientRect().height : 0;
}

/** Sprünge in einer verborgenen Ansicht (KI-Erfassung im Hintergrund), nachgeholt beim Zeigen der Ansicht */
const ausstehend = new WeakMap<Element, () => void>();

/** Holt den Sprung nach, den eine verborgene Ansicht vorgemerkt hat; true, wenn es einen gab */
export function ausstehendenSprungAusfuehren(rahmen: Element | null | undefined): boolean {
  if (!rahmen) return false;
  const f = ausstehend.get(rahmen);
  if (!f) return false;
  ausstehend.delete(rahmen);
  f();
  return true;
}

function fokusVerloren(): boolean {
  const a = document.activeElement;
  return !a || a === document.body || a === document.documentElement || !a.isConnected;
}

/** Scrollt das Fenster an eine Position; jsdom kennt window.scrollTo nicht */
export function fensterScrollen(top: number): void {
  try {
    window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: "auto" });
  } catch {
    // ohne Scrollen weiter
  }
}

/**
 * Richtet den Anfang von `ziel` unter dem Kopf der App aus und fokussiert nach `optionen.fokus` `fokus` (sonst das
 * Ziel). Steht das Ziel in einer verborgenen Ansicht, merkt sich die Funktion den Sprung (ohne Fokus) für
 * ausstehendenSprungAusfuehren. Liefert true, wenn gesprungen wurde.
 */
export function springeZu(ziel: HTMLElement | null | undefined, fokus?: HTMLElement | null, optionen: SprungOptionen = {}): boolean {
  if (!ziel || !ziel.isConnected) return false;
  const verborgen = ziel.closest("[hidden]");
  if (verborgen) {
    ausstehend.set(verborgen, () => springeZu(ziel, null, { nurWennNoetig: optionen.nurWennNoetig }));
    return false;
  }
  const oben = kopfHoehe() + ABSTAND;
  const top = ziel.getBoundingClientRect().top;
  const sichtbar = top >= oben - 1 && top <= window.innerHeight * OBERER_ANTEIL;
  if (!optionen.nurWennNoetig || !sichtbar) fensterScrollen(window.scrollY + top - oben);
  const f = optionen.fokus ?? false;
  if (f === true || (f === "wenn-verloren" && fokusVerloren())) fokussieren(fokus ?? ziel);
  return true;
}

/** Fokus ohne Scrollen; Überschriften und Bereiche werden dafür programmatisch fokussierbar (tabindex="-1") */
export function fokussieren(el: HTMLElement): void {
  if (el.tabIndex < 0 && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

/** An den Seitenanfang; mit `fokus` auf dieses Element (etwa die Überschrift der Ansicht) */
export function zumSeitenanfang(fokus?: HTMLElement | null): void {
  fensterScrollen(0);
  if (fokus) fokussieren(fokus);
}

/**
 * Plant einen Sprung für die Zeit nach dem nächsten Zeichnen: Der neue Inhalt steht dann im Dokument. Aufrufe im
 * selben Ereignis werden mit dem Zustandswechsel gebündelt; der letzte geplante Sprung gilt.
 */
export function useSprung(): (auftrag: () => void) => void {
  const auftragRef = useRef<(() => void) | null>(null);
  const [nr, setNr] = useState(0);
  useLayoutEffect(() => {
    const a = auftragRef.current;
    auftragRef.current = null;
    a?.();
  }, [nr]);
  return useCallback((auftrag: () => void) => {
    auftragRef.current = auftrag;
    setNr((n) => n + 1);
  }, []);
}
