// Importierte Fallpakete der Fallreihe (seit 0.7.2, TP-2026-W44-63; Entscheidung des Herausgebers: bis zur Löschung
// auf dem Gerät). Ablage in der Datenbank des Testlaufarchivs unter „fallpaket:<sha256>“ mit der ZIP-Datei, wie sie
// importiert wurde; so gelten Sicherung und „Gerätestand löschen“ auch für die Pakete. Das Paket verlässt das Gerät nur
// in den Anfragen an die gewählten Anbieter.

import { del, get, keys, set } from "idb-keyval";
import { testlaufAblage } from "./testlaufarchiv";

const P = "fallpaket:";

export interface GespeichertesFallpaket {
  name: string;
  sha256: string;
  importiert: string;
  zip: Uint8Array;
}

export async function fallpaketSpeichern(p: GespeichertesFallpaket): Promise<void> {
  await set(P + p.sha256, p, testlaufAblage());
}

/** Alle gespeicherten Fallpakete, die jüngsten zuerst */
export async function fallpaketeLaden(): Promise<GespeichertesFallpaket[]> {
  const ks = (await keys(testlaufAblage())).filter((k): k is string => typeof k === "string" && k.startsWith(P));
  const alle = await Promise.all(ks.map((k) => get<GespeichertesFallpaket>(k, testlaufAblage())));
  return alle.filter((x): x is GespeichertesFallpaket => !!x).sort((a, b) => b.importiert.localeCompare(a.importiert));
}

export async function fallpaketLoeschen(sha256: string): Promise<void> {
  await del(P + sha256, testlaufAblage());
}
