// Waagerecht scrollbare Abschnittsleisten auf schmalen Bildschirmen (seit 0.6.20, UX-2026-W44-04): Nach jedem Wechsel
// rückt der aktive Abschnitt ins Bild, statt rechts abgeschnitten zu bleiben. Nur die Leiste scrollt, nie die Seite.

import { useEffect, useLayoutEffect, type RefObject } from "react";

/** Scrollt die Liste in `rahmen` so, dass der aktive Eintrag ganz sichtbar ist; ohne Überlauf geschieht nichts */
export function aktivInsBild(rahmen: HTMLElement | null): void {
  const liste = rahmen?.querySelector<HTMLElement>("ol");
  if (!liste || liste.scrollWidth <= liste.clientWidth) return;
  const aktiv = liste.querySelector<HTMLElement>("[aria-current], .aktiv");
  if (!aktiv) return;
  const links = aktiv.offsetLeft - liste.offsetLeft;
  const rechts = links + aktiv.offsetWidth;
  const rand = 24;
  if (links - rand < liste.scrollLeft) liste.scrollLeft = Math.max(0, links - rand);
  else if (rechts + rand > liste.scrollLeft + liste.clientWidth) liste.scrollLeft = rechts + rand - liste.clientWidth;
}

/** Hält den aktiven Eintrag der Leiste in `rahmen` im Bild, sobald sich `aktiv` ändert */
export function useAktivImBild(rahmen: RefObject<HTMLElement | null>, aktiv: unknown): void {
  useLayoutEffect(() => {
    aktivInsBild(rahmen.current);
  }, [rahmen, aktiv]);
}

/**
 * Setzt an der Liste in `rahmen` die Attribute data-rest-links und data-rest-rechts, solange dort weitere Einträge
 * außerhalb des Bildes liegen; das Stylesheet blendet die Einträge an diesem Rand aus (seit UX-2026-W46-03). Anders
 * als ein Verlauf im Hintergrund der Liste wirkt das auch bei Einträgen mit deckender Fläche.
 */
export function randVerlaufSetzen(rahmen: HTMLElement | null): void {
  const liste = rahmen?.querySelector<HTMLElement>("ol");
  if (!liste) return;
  const links = liste.scrollLeft > 1;
  const rechts = liste.scrollLeft + liste.clientWidth < liste.scrollWidth - 1;
  liste.toggleAttribute("data-rest-links", links);
  liste.toggleAttribute("data-rest-rechts", rechts);
}

/** Hält die Randattribute der Leiste in `rahmen` beim Scrollen der Leiste und bei Größenänderungen aktuell */
export function useRandVerlauf(rahmen: RefObject<HTMLElement | null>, aktiv: unknown): void {
  useEffect(() => {
    const liste = rahmen.current?.querySelector<HTMLElement>("ol");
    if (!liste) return;
    const setzen = () => randVerlaufSetzen(rahmen.current);
    setzen();
    liste.addEventListener("scroll", setzen, { passive: true });
    const beobachter = typeof ResizeObserver === "function" ? new ResizeObserver(setzen) : undefined;
    beobachter?.observe(liste);
    return () => {
      liste.removeEventListener("scroll", setzen);
      beobachter?.disconnect();
    };
  }, [rahmen, aktiv]);
}
