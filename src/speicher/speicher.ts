// Lokale Ablage im Browser bzw. in der App-WebView (IndexedDB). Später ergänzt um das
// Capacitor-Dateisystem; die Schnittstelle bleibt gleich.

import { del, get, keys, set } from "idb-keyval";
import type { Meldung } from "../kern/typen";

export interface GespeichertesProfil {
  schluessel: string;
  quelle: "eingebaut" | "importiert";
  dateien: Record<string, string>;
  importiertAm?: string;
}

const P = "profil:";

export async function profileLaden(): Promise<GespeichertesProfil[]> {
  const alle = (await keys()).filter((k) => String(k).startsWith(P));
  const out: GespeichertesProfil[] = [];
  for (const k of alle) {
    const v = await get<GespeichertesProfil>(k);
    if (v) out.push(v);
  }
  return out;
}

export async function profilSpeichern(p: GespeichertesProfil): Promise<void> {
  await set(P + p.schluessel, p);
}

export async function profilLoeschen(schluessel: string): Promise<void> {
  await del(P + schluessel);
}

export async function aktivesProfilLesen(): Promise<string | undefined> {
  return get<string>("aktives-profil");
}

export async function aktivesProfilSetzen(schluessel: string): Promise<void> {
  await set("aktives-profil", schluessel);
}

export interface Zwischenstand {
  gespeichertAm: string;
  daten: Meldung;
  dateiname?: string;
}

export async function zwischenstandLesen(profilId: string): Promise<Zwischenstand | undefined> {
  return get<Zwischenstand>("entwurf:" + profilId);
}

export async function zwischenstandSchreiben(profilId: string, z: Zwischenstand): Promise<void> {
  await set("entwurf:" + profilId, z);
}

export async function zwischenstandLoeschen(profilId: string): Promise<void> {
  await del("entwurf:" + profilId);
}

/** Datei an den Nutzer übergeben (Browser: Download; in der App später: Teilen-Menü). */
export function dateiAnbieten(inhalt: BlobPart, dateiname: string, typ: string): void {
  const blob = inhalt instanceof Blob ? inhalt : new Blob([inhalt], { type: typ });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
