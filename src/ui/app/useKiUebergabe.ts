// Übergabe von Meldungen aus dem Lagebild an die KI-Erfassung (seit 0.6.5, TP-2026-W44-17 aus App.tsx). Jede Übergabe
// trägt eine laufende Nummer und den Profil-Hash; die Erfassung quittiert sie, damit sie nicht wiederholt wird.

import { useCallback, useRef, useState } from "react";
import type { Profil } from "../../kern/typen";
import type { KiUebergabe, UebergabeMeldung } from "../../pipeline/material";
import { kurzfassungLeeren } from "../Kurzfassung";

export function useKiUebergabe(profil: Profil | null, zurKi: () => void) {
  const [uebergabe, setUebergabe] = useState<KiUebergabe | null>(null);
  /** Laufende Nummer der Übergaben; bleibt nach dem Quittieren erhalten, damit jede Übergabe neu ist */
  const nr = useRef(0);

  const uebergeben = (dateien: UebergabeMeldung[]) => {
    // Aus der Verdichtung entsteht eine neue Meldung: die bisherige Management Summary gilt nicht mehr
    if (!profil) return;
    void kurzfassungLeeren(profil.manifest.id);
    nr.current += 1;
    setUebergabe({ nr: nr.current, profilHash: profil.hash, dateien });
    zurKi();
  };

  const quittieren = useCallback((n: number) => setUebergabe((alt) => (alt?.nr === n ? null : alt)), []);
  /** Eine noch nicht verarbeitete Übergabe gehört zum bisherigen Profil (Profilwechsel) */
  const verwerfen = useCallback(() => setUebergabe(null), []);

  return { uebergabe, uebergeben, quittieren, verwerfen };
}
