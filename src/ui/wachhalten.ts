// Hält während laufender KI-Anfragen den Bildschirm wach (Screen Wake Lock API, Safari ab iOS 16.4)
// und merkt sich, ob die Seite zwischendurch im Hintergrund war. Eine gesperrte oder verlassene
// Seite kann die laufende Verbindung zum Anbieter abbrechen.

import { useEffect, useRef } from "react";

export function useWachhalten(aktiv: boolean) {
  const hintergrund = useRef(0);
  useEffect(() => {
    if (!aktiv) return;
    hintergrund.current = 0;
    let sperre: any = null;
    let verborgenSeit = 0;
    const holen = async () => {
      try {
        sperre = await (navigator as any).wakeLock?.request("screen");
      } catch {
        sperre = null; // nicht unterstützt oder verweigert
      }
    };
    const sichtbarkeit = () => {
      if (document.visibilityState === "hidden") verborgenSeit = Date.now();
      else {
        if (verborgenSeit) hintergrund.current += Date.now() - verborgenSeit;
        verborgenSeit = 0;
        void holen();
      }
    };
    void holen();
    document.addEventListener("visibilitychange", sichtbarkeit);
    return () => {
      document.removeEventListener("visibilitychange", sichtbarkeit);
      if (verborgenSeit) hintergrund.current += Date.now() - verborgenSeit;
      sperre?.release?.().catch?.(() => undefined);
    };
  }, [aktiv]);
  /** Millisekunden, die die Seite während des aktiven Zeitraums im Hintergrund war */
  return hintergrund;
}
