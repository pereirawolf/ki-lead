// Testprofil nach LEAD-Meldung-v2 (seit 0.7.0, UP-2026-W45-02): Beispiel- bzw. Landesprofil mit dem zusammengestellten
// v2-Schema (formate/lead-meldung-v2/beispiel bzw. beispiel-land), Migration „lead-meldung-v2“ und Rollen als Pfade.
// Seit 0.7.3 (UP-2026-W45-03) mit der Darstellungsdatei formate/lead-meldung-v2/beispiel/meldung.ui.json (Vorlage für
// die Umstellung der Profile in Paket 6); ohne Darstellung (`mitDarstellung: false`) nur die Rollen, wie in Paket 2.
import { readFileSync } from "node:fs";
import type { Profil } from "../../src/kern/typen";
import { profilPflicht, repoPfad } from "./dateien";

export const ROLLEN_V2 = {
  schema_feld: "schema",
  status_feld: "status",
  status_entwurf: "entwurf",
  status_final: "zur_freigabe",
  entstehung_feld: "entstehung",
  land: "absender.gebiet.name",
  meldende_stelle: "absender.stelle",
  meldezeitpunkt: "meldezeitpunkt",
  quellen: "quellen",
  sachverhalte: "sachverhalte",
  sv_kennung: "kennung",
  sv_bezeichnung: "bezeichnung",
  sv_art: "module.lead-bevoelkerungsschutz.ereignisarten",
  sv_ort: "raum.beschreibung",
  sv_beurteilung: "bewertung.beurteilung.stufe",
  sv_tendenz: "bewertung.tendenz.richtung",
  sv_textfelder: ["analyse.lage_ereignis", "analyse.risiken_auswirkungen", "analyse.abhaengigkeiten_interdependenzen", "bewertung.kernaussage"],
  sv_analysefelder: ["analyse.lage_ereignis", "analyse.risiken_auswirkungen", "analyse.abhaengigkeiten_interdependenzen"],
  beurteilung_hoch: ["erheblich", "kritisch"],
  tendenz_entspannung: "Entspannung",
  tendenz_verschaerfung: "Verschärfung",
};

export const DARSTELLUNG_V2 = "formate/lead-meldung-v2/beispiel/meldung.ui.json";

export async function v2Profil(ebene: "bund" | "land" = "bund", { mitDarstellung = false } = {}): Promise<Profil> {
  const p = structuredClone(await profilPflicht(ebene === "land" ? "lead-thueringen" : "lead-beispiel"));
  const ordner = ebene === "land" ? "beispiel-land" : "beispiel";
  p.schema = JSON.parse(readFileSync(repoPfad(`formate/lead-meldung-v2/${ordner}/meldung.schema.json`), "utf-8"));
  p.manifest.meldung = { ...p.manifest.meldung, schema_id: "LEAD-Meldung-v2", eingang_schema_ids: ["LEAD-Meldung-v2"], eingang_schemata: {} };
  p.eingangSchemata = {};
  p.manifest.migrationen = [
    { von: "LEAD-Meldung-v1", verfahren: "lead-meldung-v2" },
    { von: "LEAD-Meldung-Land-v1", verfahren: "lead-meldung-v2" },
  ];
  p.ui = mitDarstellung
    ? { ...JSON.parse(readFileSync(repoPfad(DARSTELLUNG_V2), "utf-8")), kennung: p.ui.kennung }
    : { ...p.ui, rollen: ROLLEN_V2 as any, felder: {}, schritte: [] };
  return p;
}
