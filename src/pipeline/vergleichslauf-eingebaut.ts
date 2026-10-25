// Beispielprofil für den Vergleichslauf Ilka aus den mit der App ausgelieferten Profilen (seit 0.5.8), seit 0.5.12
// auch Musterfassung und Zuschnitt.
// Getrennt von vergleichslauf.ts, damit das Abnahmeskript M4 und Werkzeuge außerhalb von Vite die Pipeline
// ohne die eingebetteten Profile (import.meta.glob) nutzen können.

import MUSTER_TEXT from "../../evaluation/material/ilka-musterfassung.json?raw";
import ZUSCHNITT_TEXT from "../../evaluation/material/ilka-s1-zuschnitt-a.json?raw";
import { eingebauteProfile } from "../profil/eingebaut";
import { ladeProfil, sha256 } from "../profil/laden";
import { musterfassungAus, type Musterfassung } from "./kurzfassungsreihe";
import { fehlendeFalldateien, PROFIL_ORDNER, S1_ZUSCHNITT, s1FestPruefen, type FallDaten, type S1Fest } from "./vergleichslauf";

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

// Musterfassung Ilka und ihr Zuschnitt als Text, mit der App ausgeliefert (seit 0.5.12): Grundlage der Umfänge
// „S2 + S3 (aus Musterfassung)“ und „MS (aus Musterfassung)“. Als Text eingebettet, damit die Prüfsumme der Datei im
// Repository gilt; beide werden vor dem ersten Aufruf gegen die Prüfsummen der Pläne geprüft.

export interface MusterDaten {
  musterfassung: Musterfassung;
  /** Zuschnitt der Musterfassung als fester S1-Gegenstand (Plan s2-isoliert-ilka) */
  s1Fest: S1Fest;
}

/** Lädt Musterfassung und Zuschnitt aus der App und prüft beide gegen die Prüfsummen der Pläne. */
export async function musterDatenEingebaut(texte = { muster: MUSTER_TEXT, zuschnitt: ZUSCHNITT_TEXT }): Promise<MusterDaten> {
  const musterfassung = await musterfassungAus(texte.muster);
  const summe = await sha256(texte.zuschnitt);
  if (summe !== S1_ZUSCHNITT.sha256)
    throw new Error(
      `Der Zuschnitt ${S1_ZUSCHNITT.datei} weicht von der Prüfsumme des Plans s2-isoliert-ilka ab (${summe.slice(0, 12)}… statt ${S1_ZUSCHNITT.sha256.slice(0, 12)}…). Nach einer Änderung ist der Plan fortzuschreiben.`,
    );
  const vorschlag = JSON.parse(texte.zuschnitt);
  const befunde = s1FestPruefen(vorschlag);
  if (befunde.length) throw new Error(`Der Zuschnitt ${S1_ZUSCHNITT.datei} ist unbrauchbar: ${befunde.join("; ")}`);
  return { musterfassung, s1Fest: { datei: S1_ZUSCHNITT.datei, sha256: summe, vorschlag } };
}
