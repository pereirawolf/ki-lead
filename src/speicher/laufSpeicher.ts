// Laufprotokolle im Gerätespeicher (seit 0.6.3, TP-2026-W44-24, aus src/pipeline/lauf.ts): Speichern, Lesen, Löschen,
// gesammelte Ausgabe als ZIP (PR #79) und Schutz des Speichers vor automatischer Räumung. Das Laufformat selbst
// (`ki-lead-lauf/1`) bleibt in der Pipeline.

import { del, get, getMany, keys, set } from "idb-keyval";
import type { Lauf } from "../pipeline/lauf";

export async function laufSpeichern(l: Lauf): Promise<void> {
  await set(`lauf:${l.id}`, l);
}

export async function laufLesen(id: string): Promise<Lauf | undefined> {
  return get<Lauf>(`lauf:${id}`);
}

export async function laufLoeschen(id: string): Promise<void> {
  await del(`lauf:${id}`);
}

/** Löscht mehrere Läufe samt Protokoll. */
export async function laeufeLoeschen(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => del(`lauf:${id}`)));
}

/**
 * ZIP mit je einem Laufprotokoll (ki-lead-lauf/1) als JSON-Datei. Inhalt und Dateinamen stammen vom Einzelexport;
 * `dateiname` bestimmt den Namen je Lauf (die Lauf-ID macht ihn eindeutig).
 */
export async function laeufeAlsZip(laeufe: Lauf[], dateiname: (l: Lauf) => string): Promise<Blob> {
  // jszip erst bei Bedarf laden (seit 0.6.5, TP-2026-W44-18): nicht im Haupt-JavaScript
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const l of laeufe) zip.file(dateiname(l), JSON.stringify(l, null, 2));
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/**
 * Alle Laufprotokolle. Seit 0.6.2 (TP-2026-W44-10) über keys() und getMany() nur die Schlüssel „lauf:…“, statt mit
 * entries() den ganzen Speicher samt Profilen und Dateitexten zu laden.
 */
export async function laeufeLaden(): Promise<Lauf[]> {
  const schluessel = (await keys()).filter((k): k is string => typeof k === "string" && k.startsWith("lauf:"));
  const werte = await getMany<Lauf | undefined>(schluessel);
  return werte.filter((v): v is Lauf => !!v).sort((a, b) => b.erstellt.localeCompare(a.erstellt));
}

/**
 * Bittet den Browser, den Speicher der App vor automatischer Räumung zu schützen (navigator.storage.persist, seit 0.6.2,
 * TP-2026-W44-10). Einmal je Sitzung, nur im Browser; ohne Unterstützung oder bei Ablehnung ohne Folgen.
 */
let persistAngefragt = false;
export async function speicherSchuetzen(): Promise<boolean | null> {
  if (persistAngefragt) return null;
  persistAngefragt = true;
  try {
    const st = (globalThis as { navigator?: { storage?: { persist?: () => Promise<boolean> } } }).navigator?.storage;
    if (!st?.persist) return null;
    return await st.persist();
  } catch {
    return null;
  }
}
