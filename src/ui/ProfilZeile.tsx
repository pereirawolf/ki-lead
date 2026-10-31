// Aktives Profil im Seitenkopf von Erfassung, KI-Erfassung und Auswertung (seit 0.6.20, UX-2026-W44-14): Name und
// Fassung mit Weg zur Ansicht „Profile“. Bewusst nicht in der Kopfleiste; dort entfiel der Profil-Chip mit 0.5.21.

import type { Profil } from "../kern/typen";

export function ProfilZeile({ profil }: { profil: Profil }) {
  return (
    <p className="profilzeile">
      Profil: {profil.manifest.name} {profil.manifest.version} ·{" "}
      <a href="#/profile" aria-label={`Profile ansehen oder wechseln (aktiv: ${profil.manifest.name})`}>
        Profile
      </a>
    </p>
  );
}
