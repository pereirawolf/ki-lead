// Prüfebene 2 für Meldungen nach LEAD-Meldung-v2 in der App (seit 0.7.0, UP-2026-W45-02): Verweise und Konsistenz,
// die ein JSON-Schema nicht ausdrücken kann (docs/LEAD-MELDUNG-V2.md, Abschnitt 8). Dieselbe Umsetzung wie
// `npm run meldung:v2 -- pruefe` (src/kern/meldung-v2.js). Für v1-Meldungen leer: dort prüfen die Textregeln
// in kennsaetze.ts, quellen.ts und zeitstrahl.ts.

import { pruefeReferenzen, SCHEMA_ID } from "./meldung-v2.js";
import { holeWert } from "./pfad";
import type { Befund, UiKonfig } from "./typen";

/** Meldung nach LEAD-Meldung-v2 (Schemakennung im Feld der Rolle schema_feld, ersatzweise „schema“) */
export function istV2(d: unknown, ui?: Pick<UiKonfig, "rollen">): boolean {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  return (holeWert(d, ui?.rollen?.schema_feld || "schema") ?? (d as Record<string, unknown>).schema) === SCHEMA_ID;
}

/** Befunde der Referenzprüfung mit Pfad; Code REFERENZ_FEHLER bzw. REFERENZ_HINWEIS */
export function referenzBefunde(d: unknown, ui?: Pick<UiKonfig, "rollen">): Befund[] {
  if (!istV2(d, ui)) return [];
  return pruefeReferenzen(d).map((b) => ({
    stufe: b.stufe,
    code: b.stufe === "fehler" ? "REFERENZ_FEHLER" : "REFERENZ_HINWEIS",
    pfad: b.pfad,
    text: `Referenzprüfung: ${b.text} (${b.pfad}).`,
  }));
}
