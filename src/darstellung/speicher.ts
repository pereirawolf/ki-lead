// Speicherung der Farbschema-Auswahl und eigener Profilfarben. Maßgeblich ist IndexedDB; ein kleiner Eintrag im
// localStorage erlaubt, das Schema vor dem ersten Zeichnen anzuwenden (kein Aufblitzen). Gespeichert werden nur die
// Auswahl und geprüfte Farbdefinitionen, nie Meldungen, Schlüssel oder Profilrohdaten.

import { del, get, set } from "idb-keyval";
import { AUTOMATISCH, PROFIL, katalogEintrag, profilFarbschemaFehler } from "./thema";
import type { Darstellung, ProfilFarbschema } from "./typen";

const SCHLUESSEL = "darstellung";
const START = "ki-lead-darstellung";

export function gueltigeAuswahl(a: unknown): string {
  return typeof a === "string" && (a === AUTOMATISCH || a === PROFIL || !!katalogEintrag(a)) ? a : AUTOMATISCH;
}

export async function darstellungLesen(): Promise<Darstellung> {
  const g = (await get(SCHLUESSEL)) as Partial<Darstellung> | undefined;
  return { version: 1, auswahl: gueltigeAuswahl(g?.auswahl) };
}

export async function darstellungSchreiben(d: Darstellung): Promise<void> {
  await set(SCHLUESSEL, { version: 1, auswahl: gueltigeAuswahl(d.auswahl) });
}

/** Schlüssel der lokalen Profilfarben: an Profilschlüssel und Prüfsumme gebunden, nie an den Anzeigenamen */
export function lokalSchluessel(profilSchluessel: string, hash: string): string {
  return `darstellung:profil:${encodeURIComponent(profilSchluessel)}#${hash}`;
}

export async function lokaleFarbenLesen(profilSchluessel: string, hash: string): Promise<ProfilFarbschema | undefined> {
  const g = (await get(lokalSchluessel(profilSchluessel, hash))) as { version?: number; definition?: unknown } | undefined;
  return g?.definition && !profilFarbschemaFehler(g.definition).length ? (g.definition as ProfilFarbschema) : undefined;
}

export async function lokaleFarbenSchreiben(profilSchluessel: string, hash: string, definition: ProfilFarbschema): Promise<void> {
  const f = profilFarbschemaFehler(definition);
  if (f.length) throw new Error(f[0]);
  await set(lokalSchluessel(profilSchluessel, hash), { version: 1, profilSchluessel, profilHash: hash, definition });
}

export async function lokaleFarbenLoeschen(profilSchluessel: string, hash: string): Promise<void> {
  await del(lokalSchluessel(profilSchluessel, hash));
}

/** Startcache: Auswahl und (bei „profil“) die zuletzt verwendete, geprüfte Profildefinition */
export function startLesen(): { auswahl: string; profil?: ProfilFarbschema } {
  try {
    const roh = JSON.parse(localStorage.getItem(START) || "null");
    const auswahl = gueltigeAuswahl(roh?.auswahl);
    const profil = auswahl === PROFIL && roh?.profil && !profilFarbschemaFehler(roh.profil).length ? (roh.profil as ProfilFarbschema) : undefined;
    return { auswahl, ...(profil ? { profil } : {}) };
  } catch {
    return { auswahl: AUTOMATISCH };
  }
}

export function startSchreiben(auswahl: string, profil?: ProfilFarbschema): void {
  try {
    localStorage.setItem(START, JSON.stringify({ version: 1, auswahl, ...(profil ? { profil } : {}) }));
  } catch {
    /* privater Modus o. Ä.: dann nur ohne Startcache */
  }
}
