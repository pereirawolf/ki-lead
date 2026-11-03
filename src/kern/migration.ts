// Einlesen fremder oder älterer Meldungen: Migration nach den Regeln des Profils.

import { migriereV1, type MigrationsOptionen } from "./meldung-v2.js";
import { holeWert } from "./pfad";
import { altQuellenZeilen } from "./quellen";
import type { Meldung, Profil } from "./typen";

export interface MigrationsErgebnis {
  daten: Meldung;
  hinweise: string[];
  herkunft: string;
  /** true, wenn die Schemakennung zum Profil passt (direkt oder über eine Migration) */
  bekannt: boolean;
}

/** `v2`: Optionen der Überführung nach LEAD-Meldung-v2 (feste Kennung und Uhr in Tests); die Zeitzone kommt aus dem Profil. */
export function migriere(roh: unknown, profil: Profil, v2: Omit<MigrationsOptionen, "zeitzone"> = {}): MigrationsErgebnis {
  const r = profil.ui.rollen;
  const d: Meldung = JSON.parse(JSON.stringify(roh ?? {}));
  delete d._fileName;
  const kennung = holeWert(d, r.schema_feld);
  const herkunft = typeof kennung === "string" ? kennung : "(ohne Schemakennung)";
  const hinweise: string[] = [];
  const zielId = profil.manifest.meldung.schema_id;
  let bekannt = herkunft === zielId || (profil.manifest.meldung.eingang_schema_ids || []).includes(herkunft);

  const regel = (profil.manifest.migrationen || []).find((m) => m.von === herkunft);
  // Überführung v1 → LEAD-Meldung-v2 nach docs/LEAD-MELDUNG-V2.md, Abschnitt 11 (seit 0.7.0, UP-2026-W45-02)
  if (regel?.verfahren === "lead-meldung-v2") {
    try {
      const { meldung, hinweise: mh } = migriereV1(d, { ...v2, zeitzone: profil.manifest.variablen?.zeitzone || "Europe/Berlin" });
      hinweise.push(`Von ${herkunft} nach LEAD-Meldung-v2 überführt; zur Durchsicht bestimmt, keine neue Freigabe.`, ...mh);
      if (regel.hinweis) hinweise.push(regel.hinweis);
      return { daten: meldung, hinweise, herkunft, bekannt: true };
    } catch (e) {
      hinweise.push(`Überführung nach LEAD-Meldung-v2 nicht möglich: ${(e as Error).message}`);
      return { daten: d, hinweise, herkunft, bekannt: false };
    }
  }
  if (regel) {
    for (const [k, v] of Object.entries(regel.setze || {})) d[k] = v;
    for (const [k, v] of Object.entries(regel.ergaenze || {})) if (d[k] === undefined) d[k] = v;
    if (regel.hinweis) hinweise.push(regel.hinweis);
    if (altQuellenZeilen(d, profil.ui).length) hinweise.push("Quellenzeilen stehen noch in den Analysefeldern – ins Quellenverzeichnis übernehmen.");
    bekannt = true;
  }
  if (!bekannt) hinweise.push(`Schemakennung „${herkunft}“ gehört nicht zu diesem Profil (erwartet „${zielId}“).`);
  return { daten: d, hinweise, herkunft, bekannt };
}
