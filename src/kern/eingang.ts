// Grundform einer Eingangsmeldung (Meldung einer anderen Stelle). Seit 0.6.3 (TP-2026-W44-23) hier statt in
// src/pipeline/material.ts, damit Lagebild und Pipeline sie ohne gegenseitigen Import nutzen.

import type { Profil } from "./typen";

export interface EingangsInfo {
  stelle: string;
  land: string;
  zeitpunkt: string;
  sachverhalte: number;
  schema: string;
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
  const stelle = String(o[r.meldende_stelle || "meldende_stelle"] ?? o.meldende_stelle ?? "");
  const land = String(o[r.land || "land"] ?? o.land ?? "");
  if (!stelle && !land) return null;
  return {
    stelle,
    land,
    zeitpunkt: String(o[r.meldezeitpunkt || "meldezeitpunkt"] ?? o.meldezeitpunkt ?? ""),
    sachverhalte: svs.length,
    schema: String(o[r.schema_feld] ?? o.schema ?? ""),
  };
}
