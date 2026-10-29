// Hinweise der PWA: ohne Netz (was weiter geht, was nicht) und bereitstehende neue Fassung.
import { useEffect, useState, useSyncExternalStore } from "react";
import { jetztAktualisieren, pwaBeobachten, pwaZustand, type PwaZustand } from "../pwa/registrieren";

/** Zustand der PWA (Netz, neue Fassung) für Komponenten; folgt den Ereignissen online/offline (seit 0.6.5, TP-2026-W44-20) */
export function usePwaZustand(): PwaZustand {
  return useSyncExternalStore(pwaBeobachten, pwaZustand);
}

export interface PwaHinweisProps {
  /** Fester Zustand (Tests); ohne Angabe folgt der Hinweis dem Zustand der App */
  zustand?: PwaZustand;
}

export function PwaHinweis({ zustand: vorgabe }: PwaHinweisProps) {
  const [z, setZ] = useState<PwaZustand>(vorgabe ?? pwaZustand());
  useEffect(() => (vorgabe ? undefined : pwaBeobachten(setZ)), [vorgabe]);
  if (!z.offline && !z.aktualisierung) return null;
  return (
    <div className="pwa-hinweise">
      {z.offline && (
        <div className="hinweisband pwa-offline" role="status">
          Ohne Netzverbindung: Meldungen, Lagebild, Profile und Ausgaben funktionieren weiter; KI-Erfassung, Verdichtung und Management Summary brauchen eine
          Verbindung.
        </div>
      )}
      {z.aktualisierung && (
        <div className="hinweisband pwa-aktualisierung" role="status">
          Eine neue Fassung von KI-LEAD ist bereit.{" "}
          <button type="button" className="knopf klein" onClick={jetztAktualisieren}>
            Neu laden
          </button>{" "}
          Der automatisch gesicherte Zwischenstand bleibt erhalten; ein laufender KI-Lauf wird dabei abgebrochen.
        </div>
      )}
    </div>
  );
}
