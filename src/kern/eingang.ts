// Grundform einer Eingangsmeldung (Meldung einer anderen Stelle). Seit 0.6.3 (TP-2026-W44-23) hier statt in
// src/pipeline/material.ts, damit Lagebild und Pipeline sie ohne gegenseitigen Import nutzen.

import { holeWert } from "./pfad";
import type { Profil } from "./typen";

export interface EingangsInfo {
  stelle: string;
  land: string;
  zeitpunkt: string;
  sachverhalte: number;
  schema: string;
  /** Kennung der Meldungsfassung (LEAD-Meldung-v2, seit 0.7.0) */
  meldung_id?: string;
}

/**
 * Erkennt Meldungen auch fremder Schemata an ihrer Grundform: Liste von Sachverhalten plus
 * meldende Stelle oder Land. So lassen sich Meldungen anderer Ebenen verdichten (rekursives Prinzip).
 */
export function eingangsInfo(obj: unknown, profil: Profil): EingangsInfo | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const o = obj as Record<string, any>;
  const r = profil.ui.rollen;
  const svs = o[r.sachverhalte] ?? o.sachverhalte;
  if (!Array.isArray(svs) || !svs.length || typeof svs[0] !== "object") return null;
  // Rollen dürfen Pfade sein (seit 0.7.0); Grundform v2: absender.stelle und absender.gebiet.name (UP-2026-W45-02)
  const wert = (pfad: string | undefined) => (pfad ? holeWert(o, pfad) : undefined);
  const stelle = String(wert(r.meldende_stelle || "meldende_stelle") ?? o.meldende_stelle ?? o.absender?.stelle ?? "");
  const schema = String(wert(r.schema_feld) ?? o.schema ?? "");
  // Gebiet nach dem Eintrag des fremden Schemas (seit 0.6.19, TP-2026-W44-60), sonst nach der eigenen Rolle „land“
  const gebiet = profil.eingangSchemata?.[schema]?.gebiet;
  const land = String((gebiet ? wert(gebiet) : undefined) ?? wert(r.land || "land") ?? o.land ?? o.absender?.gebiet?.name ?? "");
  if (!stelle && !land) return null;
  return {
    stelle,
    land,
    zeitpunkt: String(wert(r.meldezeitpunkt || "meldezeitpunkt") ?? o.meldezeitpunkt ?? ""),
    sachverhalte: svs.length,
    schema,
    ...(typeof o.meldung_id === "string" ? { meldung_id: o.meldung_id } : {}),
  };
}
