// Beispielprofil für den Vergleichslauf Ilka aus den mit der App ausgelieferten Profilen (seit 0.5.8).
// Getrennt von vergleichslauf.ts, damit das Abnahmeskript M4 und Werkzeuge außerhalb von Vite die Pipeline
// ohne die eingebetteten Profile (import.meta.glob) nutzen können.

import { eingebauteProfile } from "../profil/eingebaut";
import { ladeProfil } from "../profil/laden";
import { fehlendeFalldateien, PROFIL_ORDNER, type FallDaten } from "./vergleichslauf";

/** Lädt das mit der App ausgelieferte Beispielprofil samt Ilka-Beispielen. */
export async function fallDatenEingebaut(): Promise<FallDaten> {
  const eintrag = eingebauteProfile().find((p) => p.ordner === PROFIL_ORDNER);
  if (!eintrag) throw new Error(`Das Beispielprofil „${PROFIL_ORDNER}“ ist in dieser Ausgabe der App nicht enthalten.`);
  const fehlend = fehlendeFalldateien(eintrag.dateien);
  if (fehlend.length) throw new Error(`Dateien des Falls fehlen im Beispielprofil: ${fehlend.join(", ")}`);
  const geladen = await ladeProfil(eintrag.dateien);
  if (!geladen.profil) throw new Error(`Das Beispielprofil „${PROFIL_ORDNER}“ ist nicht ladbar.`);
  return { profil: geladen.profil, dateien: eintrag.dateien };
}
