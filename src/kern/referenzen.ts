// Prüfebene 2 für Meldungen nach LEAD-Meldung-v2 in der App (seit 0.7.0, UP-2026-W45-02): Verweise und Konsistenz,
// die ein JSON-Schema nicht ausdrücken kann (docs/LEAD-MELDUNG-V2.md, Abschnitt 8). Dieselbe Umsetzung wie
// `npm run meldung:v2 -- pruefe` (src/kern/meldung-v2.js). Für v1-Meldungen leer: dort prüfen die Textregeln
// in kennsaetze.ts, quellen.ts und zeitstrahl.ts.

import { FASSUNG, mitVersatz, pruefeReferenzen, SCHEMA_ID } from "./meldung-v2.js";
import { holeWert } from "./pfad";
import type { Befund, UiKonfig } from "./typen";

/** Meldung nach LEAD-Meldung-v2 (Schemakennung im Feld der Rolle schema_feld, ersatzweise „schema“) */
export function istV2(d: unknown, ui?: Pick<UiKonfig, "rollen">): boolean {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  return (holeWert(d, ui?.rollen?.schema_feld || "schema") ?? (d as Record<string, unknown>).schema) === SCHEMA_ID;
}

/** Modul- und Meldungsmodulkennungen, die ein zusammengestelltes Profilschema einbindet (seit 0.9.0) */
export function moduleImSchema(schema: unknown): string[] {
  const defs = (schema as { $defs?: Record<string, { properties?: Record<string, unknown> }> } | undefined)?.$defs;
  return [...Object.keys(defs?.module?.properties ?? {}), ...Object.keys(defs?.meldungsmodule?.properties ?? {})];
}

/**
 * Befunde der Referenzprüfung mit Pfad; Code REFERENZ_FEHLER bzw. REFERENZ_HINWEIS. `module`: Kennungen der Module des
 * Profilschemas (moduleImSchema), die nicht als unbekannt gelten (seit 0.9.0).
 */
export function referenzBefunde(d: unknown, ui?: Pick<UiKonfig, "rollen">, module: string[] = []): Befund[] {
  if (!istV2(d, ui)) return [];
  return pruefeReferenzen(d, { module }).map((b) => ({
    stufe: b.stufe,
    code: b.stufe === "fehler" ? "REFERENZ_FEHLER" : "REFERENZ_HINWEIS",
    pfad: b.pfad,
    text: `Referenzprüfung: ${b.text} (${b.pfad}).`,
  }));
}

/**
 * Kopf einer neuen, leeren Meldung nach LEAD-Meldung-v2 (seit 0.9.0, UP-2026-W45-06): Formatfassung, neue meldung_id,
 * Zeitzone und Meldezeitpunkt mit UTC-Versatz. Die leere Instanz aus dem Schema trägt dort Leerwerte, die das Schema
 * nicht annimmt; v1-Meldungen bleiben unverändert. Verändert `d`.
 */
export function v2KopfSetzen(d: Record<string, unknown>, zone = "Europe/Berlin", t0Lokal?: string): void {
  if (!istV2(d)) return;
  if (!d.fassung) d.fassung = FASSUNG;
  if (!d.meldung_id) d.meldung_id = globalThis.crypto.randomUUID();
  if (!d.zeitzone) d.zeitzone = zone;
  if (t0Lokal && "meldezeitpunkt" in d) d.meldezeitpunkt = mitVersatz(t0Lokal.slice(0, 16), String(d.zeitzone)) ?? null;
}
