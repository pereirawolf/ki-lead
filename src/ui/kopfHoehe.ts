// Höhe des mitlaufenden Kopfs der App als CSS-Variable --kopf-hoehe (seit UX-2026-W45-03 aus Profile.tsx): Leisten,
// die unter dem Kopf stehen bleiben (Sprungleiste der Profile, Reiter der Auswertung), richten sich danach. Der Kopf
// bricht je nach Breite um.

import { useEffect } from "react";

export function useKopfHoehe(): void {
  useEffect(() => {
    const kopf = document.querySelector<HTMLElement>(".kopf");
    if (!kopf || typeof ResizeObserver === "undefined") return;
    const setzen = () => document.documentElement.style.setProperty("--kopf-hoehe", `${kopf.getBoundingClientRect().height}px`);
    setzen();
    const beobachter = new ResizeObserver(setzen);
    beobachter.observe(kopf);
    return () => beobachter.disconnect();
  }, []);
}
