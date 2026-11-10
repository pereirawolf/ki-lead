// Höhe des mitlaufenden Kopfbereichs der App als CSS-Variable --kopf-hoehe (seit UX-2026-W45-03 aus Profile.tsx): Leisten,
// die unter dem Kopf stehen bleiben (Sprungleiste der Profile, Reiter der Auswertung, Schrittleiste, Lagenradar), richten
// sich danach. Seit 0.7.15 (Grunddesign 1.6, LD-R01) misst der Haken den Kopfbereich aus Kopfleiste, Identitätsband
// und Hinweisband; er bricht je nach Breite um und wird beim Scrollen kompakter (kopfKompakt.ts).

import { useEffect } from "react";

/** Der mitlaufende Kopfbereich der App (Kopfleiste, Identitätsband, Hinweisband) */
export const KOPFBEREICH = ".kopfbereich";

export function useKopfHoehe(): void {
  useEffect(() => {
    const kopf = document.querySelector<HTMLElement>(KOPFBEREICH);
    if (!kopf || typeof ResizeObserver === "undefined") return;
    const setzen = () => document.documentElement.style.setProperty("--kopf-hoehe", `${kopf.getBoundingClientRect().height}px`);
    setzen();
    const beobachter = new ResizeObserver(setzen);
    beobachter.observe(kopf);
    return () => beobachter.disconnect();
  }, []);
}
