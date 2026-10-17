// Einlesen fremder oder älterer Meldungen: Migration nach den Regeln des Profils.

import { altQuellenZeilen } from "./quellen";
import type { Meldung, Profil } from "./typen";

export interface MigrationsErgebnis {
  daten: Meldung;
  hinweise: string[];
  herkunft: string;
  /** true, wenn die Schemakennung zum Profil passt (direkt oder über eine Migration) */
  bekannt: boolean;
}

export function migriere(roh: unknown, profil: Profil): MigrationsErgebnis {
  const r = profil.ui.rollen;
  const d: Meldung = JSON.parse(JSON.stringify(roh ?? {}));
  delete d._fileName;
  const herkunft = typeof d[r.schema_feld] === "string" ? d[r.schema_feld] : "(ohne Schemakennung)";
  const hinweise: string[] = [];
  const zielId = profil.manifest.meldung.schema_id;
  let bekannt = herkunft === zielId || (profil.manifest.meldung.eingang_schema_ids || []).includes(herkunft);

  const regel = (profil.manifest.migrationen || []).find((m) => m.von === herkunft);
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
