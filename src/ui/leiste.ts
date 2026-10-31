// Waagerecht scrollbare Abschnittsleisten auf schmalen Bildschirmen (seit 0.6.20, UX-2026-W44-04): Nach jedem Wechsel
// rückt der aktive Abschnitt ins Bild, statt rechts abgeschnitten zu bleiben. Nur die Leiste scrollt, nie die Seite.

import { useLayoutEffect, type RefObject } from "react";

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
