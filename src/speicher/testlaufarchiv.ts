// Archiv der Testläufe (seit 0.5.17): Jeder Testlauf unter „Einstellungen → Testläufe“, der mindestens ein Ergebnis
// hat, bleibt mit seiner ZIP-Datei auf dem Gerät, bis er gelöscht wird. Eigene IndexedDB-Datenbank, damit die
// ZIP-Dateien nicht mit den übrigen Einträgen (Laufprotokolle, Profile) gelesen werden. Je Testlauf zwei Einträge:
// „eintrag:<id>“ mit den Angaben für die Liste und „zip:<id>“ mit der Datei.

import { createStore, del, get, keys, set, type UseStore } from "idb-keyval";

/** Kurzangaben eines archivierten Testlaufs für die Liste */
export interface TestlaufEintrag {
  id: string;
  /** Zeitpunkt der Erstellung (ISO) */
  erstellt: string;
  /** Art des Testlaufs (Umfang oder „reparatur“) */
  art: string;
  /** Titel der Art, z. B. „S1 + S2 + S3 (aus Rohdaten)“ */
  titel: string;
  /** Konfiguration in Kurzform, z. B. „claude-opus-5-5 (mittel)“ oder Kennung der Plan-Variante */
  konfiguration: string;
  /** abgeschlossene und geplante Läufe */
  laeufe: number;
  geplant: number;
  /** Grund eines vorzeitigen Endes, z. B. „abgebrochen“ */
  beendet?: string;
  kostenUsd: number | null;
  /** Dateiname der ZIP-Datei */
  name: string;
  /** Größe der ZIP-Datei in Byte */
  groesse: number;
  /** App-Version, mit der der Testlauf entstand */
  app: string;
}

let ablage: UseStore | null = null;
/** Datenbank erst bei Bedarf öffnen; ohne IndexedDB (z. B. in Tests) wirft der Aufruf, die Oberfläche fängt das ab */
function db(): UseStore {
  ablage ??= createStore("ki-lead-testlaeufe", "testlaeufe");
  return ablage;
}

const E = "eintrag:";
const Z = "zip:";

export async function testlaufArchivieren(eintrag: TestlaufEintrag, zip: Uint8Array): Promise<void> {
  // Datei zuerst: Ein Eintrag ohne Datei soll nicht entstehen
  await set(Z + eintrag.id, zip, db());
  await set(E + eintrag.id, eintrag, db());
}

/** Alle archivierten Testläufe, die jüngsten zuerst */
export async function testlaeufeLaden(): Promise<TestlaufEintrag[]> {
  const alle = (await keys(db())).filter((k): k is string => typeof k === "string" && k.startsWith(E));
  const eintraege = await Promise.all(alle.map((k) => get<TestlaufEintrag>(k, db())));
  return eintraege.filter((x): x is TestlaufEintrag => !!x).sort((a, b) => b.erstellt.localeCompare(a.erstellt) || b.id.localeCompare(a.id));
}

export async function testlaufZip(id: string): Promise<Uint8Array | undefined> {
  return get<Uint8Array>(Z + id, db());
}

export async function testlaeufeLoeschen(ids: string[]): Promise<void> {
  for (const id of ids) {
    await del(E + id, db());
    await del(Z + id, db());
  }
}

/** Kennung eines Testlaufs aus Zeitpunkt und Zufall, z. B. 20261025-141503-k3zq */
export function testlaufId(d = new Date()): string {
  const s = d.toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "-");
  return `${s}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Größe in Byte als Text, z. B. „1,4 MB“ oder „820 kB“ */
export function groesseText(byte: number): string {
  if (byte >= 1_000_000) return `${(byte / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(byte / 1000)).toLocaleString("de-DE")} kB`;
}
