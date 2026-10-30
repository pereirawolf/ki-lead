// Sicherung, Wiederherstellung und Löschen des Gerätestands (seit 0.6.13, TP-2026-W44-44, -45).
//
// Der Arbeitsstand liegt nur im Browser bzw. in der App (IndexedDB): Profile und Archiv, Zwischenstände, Lagebild,
// Kurzfassungen, Laufprotokolle, Einstellungen und das Archiv der Testläufe. Die Sicherung schreibt ihn als eine
// JSON-Datei, die Wiederherstellung spielt sie auf diesem oder einem anderen Gerät wieder ein.
//
// - API-Schlüssel und alles zu ihrer Ablage (Schlüssel, verschlüsselte Schlüssel, Kopf der Passphrase, Wahl der Ablage)
//   stehen nie in der Sicherung und bleiben bei der Wiederherstellung unberührt: Einträge, deren Schlüssel mit
//   „schluessel“ beginnt.
// - Binärdaten (ZIP-Dateien im Testlaufarchiv) und Zeitpunkte werden lesbar kodiert, damit die Datei reines JSON bleibt.
// - Das Löschen leert beide Datenbanken vollständig, einschließlich der Schlüssel im Gerätespeicher. Farbschema im
//   localStorage und Schlüssel im Schlüsselbund des Systems löscht die Oberfläche dazu (andere Schichten).

import { clear, entries, setMany } from "idb-keyval";
import { APP_VERSION } from "../kern/version";
import { testlaufAblage } from "./testlaufarchiv";

export const SICHERUNG_FORMAT = "ki-lead-sicherung/1";

/** Inhalt einer Sicherungsdatei */
export interface Sicherung {
  format: typeof SICHERUNG_FORMAT;
  app: string;
  erstellt: string;
  /** Einträge des Gerätespeichers ohne Schlüssel */
  geraetespeicher: [string, unknown][];
  /** Einträge des Testlaufarchivs */
  testlaeufe: [string, unknown][];
}

/** Schlüssel und ihre Ablage bleiben außerhalb jeder Sicherung */
export function ausgeschlossen(schluessel: IDBValidKey): boolean {
  return String(schluessel).startsWith("schluessel");
}

function b64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function ausB64(s: string): Uint8Array {
  const roh = atob(s);
  const out = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) out[i] = roh.charCodeAt(i);
  return out;
}

/** Wert JSON-tauglich machen: Uint8Array/ArrayBuffer als {"$bytes"}, Date als {"$datum"} */
export function kodieren(wert: unknown): unknown {
  // Art über toString statt instanceof: Werte aus IndexedDB können aus einem anderen Realm stammen
  const art = Object.prototype.toString.call(wert);
  if (art === "[object Uint8Array]") return { $bytes: b64(wert as Uint8Array) };
  if (art === "[object ArrayBuffer]") return { $bytes: b64(new Uint8Array(wert as ArrayBuffer)) };
  if (art === "[object Date]") return { $datum: (wert as Date).toISOString() };
  if (Array.isArray(wert)) return wert.map(kodieren);
  if (wert && typeof wert === "object") return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, kodieren(v)]));
  return wert;
}

/** Gegenstück zu kodieren() */
export function dekodieren(wert: unknown): unknown {
  if (Array.isArray(wert)) return wert.map(dekodieren);
  if (wert && typeof wert === "object") {
    const o = wert as Record<string, unknown>;
    const k = Object.keys(o);
    if (k.length === 1 && typeof o.$bytes === "string") return ausB64(o.$bytes);
    if (k.length === 1 && typeof o.$datum === "string") return new Date(o.$datum);
    return Object.fromEntries(Object.entries(o).map(([s, v]) => [s, dekodieren(v)]));
  }
  return wert;
}

/** Erstellt die Sicherung des Gerätestands als JSON-Text */
export async function sicherungErstellen(jetzt = new Date()): Promise<{ text: string; eintraege: number }> {
  const geraet = (await entries()).filter(([k]) => !ausgeschlossen(k));
  const testlaeufe = await entries(testlaufAblage());
  const s: Sicherung = {
    format: SICHERUNG_FORMAT,
    app: APP_VERSION,
    erstellt: jetzt.toISOString(),
    geraetespeicher: geraet.map(([k, v]) => [String(k), kodieren(v)]),
    testlaeufe: testlaeufe.map(([k, v]) => [String(k), kodieren(v)]),
  };
  return { text: JSON.stringify(s), eintraege: geraet.length + testlaeufe.length };
}

const istEintragsliste = (x: unknown): x is [string, unknown][] =>
  Array.isArray(x) && x.every((e) => Array.isArray(e) && e.length === 2 && typeof e[0] === "string");

/** Liest und prüft eine Sicherungsdatei; wirft mit lesbarer Meldung, wenn sie nicht passt */
export function sicherungLesen(text: string): Sicherung {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("Die Datei ist kein gültiges JSON.");
  }
  const s = roh as Partial<Sicherung> | null;
  if (!s || typeof s !== "object" || s.format !== SICHERUNG_FORMAT)
    throw new Error(`Die Datei ist keine Sicherung von KI-LEAD (erwartet: Format „${SICHERUNG_FORMAT}“).`);
  if (!istEintragsliste(s.geraetespeicher) || !istEintragsliste(s.testlaeufe)) throw new Error("Die Sicherung ist unvollständig oder beschädigt.");
  if (s.geraetespeicher.some(([k]) => ausgeschlossen(k))) throw new Error("Die Sicherung enthält Einträge zu API-Schlüsseln und wird nicht eingespielt.");
  return s as Sicherung;
}

/**
 * Ersetzt den Gerätestand durch die Sicherung. Schlüssel und ihre Ablage bleiben, alles andere wird zuvor entfernt,
 * damit keine Reste des bisherigen Stands bleiben.
 */
export async function sicherungEinspielen(s: Sicherung): Promise<number> {
  // Gerätespeicher ist der Standardspeicher von idb-keyval (dieselbe Datenbank wie get/set in speicher.ts)
  const behalten = (await entries()).filter(([k]) => ausgeschlossen(k));
  await clear();
  await setMany([...behalten, ...s.geraetespeicher.map(([k, v]) => [k, dekodieren(v)] as [IDBValidKey, unknown])]);
  const tl = testlaufAblage();
  await clear(tl);
  await setMany(
    s.testlaeufe.map(([k, v]) => [k, dekodieren(v)] as [IDBValidKey, unknown]),
    tl,
  );
  return s.geraetespeicher.length + s.testlaeufe.length;
}

/** Leert Gerätespeicher (einschließlich Schlüssel) und Testlaufarchiv vollständig */
export async function geraetestandLoeschen(): Promise<void> {
  await clear();
  await clear(testlaufAblage());
}
