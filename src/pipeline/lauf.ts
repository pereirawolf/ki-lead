// Laufprotokoll: Jeder KI-Lauf ist eine eigene Entität mit Profilbezug (ID, Version, Hash),
// vollständigen Prompts, Rohantworten, Token, Kosten und Dauer je Stufe. Exportierbar als JSON.

import type { GespeicherterVergleich } from "./vergleich";
import { del, entries, get, set } from "idb-keyval";
import { AnbieterFehler, type AbrufFehler, type Fundstelle, type Nutzung } from "../anbieter/typen";
import { formatUsd } from "../anbieter/preise";
import type { Befund, Meldung, Profil } from "../kern/typen";

export const APP_KENNUNG = "KI-LEAD 0.4.21";

export interface Auftrag {
  sachverhalt: string;
  stichworte: string;
  urls: string[];
  stichtag: string;
  prueffrage: string;
  /** Websuche und Seitenabruf erlauben (Standard: ja; bei Verdichtung: nein) */
  websuche?: boolean;
  /** Vorgegebener Meldezeitpunkt t0 (JJJJ-MM-TTThh:mm), sonst schlägt S1 ihn vor */
  meldezeitpunkt?: string;
}

export interface S1Sachverhalt {
  titel: string;
  ereignisarten: string[];
  sops: string[];
  begruendung: string;
  /** Bei Verdichtung: zugeordnete Eingangsmeldungen (Dateinamen) */
  eingangsmeldungen?: string[];
}

export interface S1Vorschlag {
  gegenstand: string;
  stichtag: string;
  /** Meldezeitpunkt t0 der eigenen Meldung (JJJJ-MM-TTThh:mm) */
  meldezeitpunkt?: string;
  referenzbezug: string;
  horizont: string;
  sachverhalte: S1Sachverhalt[];
  prueffrage: string;
  /** Prüffrage, die S1 ohne Vorgabe im Auftrag vorgeschlagen hat; gilt erst, wenn die Person sie übernimmt */
  prueffrageVorschlag?: string;
  hinweise: string;
  /** Hinweise der App zum Vorschlag (z. B. korrigierter t0) */
  appHinweise?: string[];
}

export interface StufenEintrag {
  stufe: string;
  start: string;
  ende?: string;
  dauerMs?: number;
  modell?: string;
  aufwand?: string;
  anfrage?: { system: string[]; nachrichten: unknown[]; werkzeuge?: unknown; jsonSchema?: unknown; maxTokens?: number };
  antwort?: { text: string; inhalt: unknown[]; stopGrund: string; runden: number };
  nutzung?: Nutzung;
  kostenUsd?: number | null;
  befunde?: string[];
  notiz?: string;
  fehler?: string;
}

export type LaufStatus = "s1" | "bestaetigen" | "s2" | "s3" | "fertig" | "fehler" | "abgebrochen";

export interface Lauf {
  format: "ki-lead-lauf/1";
  id: string;
  app: string;
  profil: { id: string; name: string; version: string; hash: string };
  erstellt: string;
  aktualisiert: string;
  status: LaufStatus;
  auftrag: Auftrag;
  /** Material des Laufs; bei Meldungen die tatsächlich verwendete Rolle (art) und ob sie gewählt oder erkannt wurde */
  material: { name: string; art: string; groesse: number; hash: string; rolleGewaehlt?: boolean }[];
  vorschlag?: S1Vorschlag;
  bestaetigt?: S1Vorschlag;
  stufen: StufenEintrag[];
  ergebnis?: {
    meldung: Meldung;
    kurzantwort: string;
    befunde: Befund[];
    fundstellen: Fundstelle[];
    suchen: string[];
    abrufFehler?: AbrufFehler[];
    schemakonform: boolean;
  };
  /** Geschätzte Gesamtkosten; null, wenn nicht alle Stufen erfasst sind */
  kostenUsd: number | null;
  /** Bei unvollständiger Erfassung: Summe der erfassten Stufen (Untergrenze) */
  kostenBekanntUsd?: number;
  fehler?: string;
  /** Vergleich des Ergebnisses mit einer Referenzfassung (Abnahme, Forschung) */
  vergleich?: GespeicherterVergleich;
}

export function laufId(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const zufall = Math.random().toString(36).slice(2, 6);
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${zufall}`;
}

export function neuerLauf(profil: Profil, auftrag: Auftrag, material: Lauf["material"]): Lauf {
  const jetzt = new Date().toISOString();
  return {
    format: "ki-lead-lauf/1",
    id: laufId(),
    app: APP_KENNUNG,
    profil: { id: profil.manifest.id, name: profil.manifest.name, version: profil.manifest.version, hash: profil.hash },
    erstellt: jetzt,
    aktualisiert: jetzt,
    status: "s1",
    auftrag,
    material,
    stufen: [],
    kostenUsd: 0,
  };
}

/** Ersetzt große Base64-Inhalte (PDF) im Protokoll durch einen Verweis. */
export function ohneBase64<T>(wert: T): T {
  return JSON.parse(
    JSON.stringify(wert, (k, v) => {
      if (k === "data" && typeof v === "string" && v.length > 2000)
        return `[Base64, ${Math.round((v.length * 3) / 4).toLocaleString("de-DE")} Byte, nicht im Protokoll]`;
      return v;
    }),
  );
}

/**
 * Erfasste Kosten eines Laufs: Summe der Stufen mit bekannten Kosten und ob alle Stufen erfasst sind.
 * Eine Stufe ohne Kostenangabe (Abbruch, Verbindungsfehler, Modell ohne Preis) gilt als nicht erfasst,
 * nicht als kostenlos.
 */
export function kostenStand(lauf: Pick<Lauf, "stufen">): { bekannt: number; vollstaendig: boolean } {
  let bekannt = 0;
  let vollstaendig = true;
  for (const st of lauf.stufen) {
    if (typeof st.kostenUsd === "number") bekannt += st.kostenUsd;
    else vollstaendig = false;
  }
  return { bekannt, vollstaendig };
}

/** Gesamtkosten, wenn alle Stufen erfasst sind, sonst null. */
export function kostenSumme(lauf: Pick<Lauf, "stufen">): number | null {
  const k = kostenStand(lauf);
  return k.vollstaendig ? k.bekannt : null;
}

/**
 * Kosten einer fehlgeschlagenen Stufe: 0 nur, wenn sicher nichts gesendet wurde (kein Schlüssel hinterlegt);
 * sonst unbekannt. Auch ein HTTP-Fehler kann erst nach bereits berechneten Runden (Fortsetzung, Neustart) kommen.
 */
export function kostenNachFehler(e: unknown): number | null {
  return e instanceof AnbieterFehler && e.art === "schluessel" ? 0 : null;
}

/** Anzeige der Laufkosten; bei unvollständiger Erfassung mit bekannter Untergrenze. */
export function laufKostenText(lauf: Pick<Lauf, "kostenUsd" | "kostenBekanntUsd"> | null | undefined): string {
  if (!lauf) return formatUsd(undefined);
  if (typeof lauf.kostenUsd === "number") return formatUsd(lauf.kostenUsd);
  if (lauf.kostenBekanntUsd) return `mindestens ${formatUsd(lauf.kostenBekanntUsd)} (nicht alle Stufen erfasst)`;
  return formatUsd(null);
}

export async function laufSpeichern(l: Lauf): Promise<void> {
  await set(`lauf:${l.id}`, l);
}

export async function laufLesen(id: string): Promise<Lauf | undefined> {
  return (await get(`lauf:${id}`)) as Lauf | undefined;
}

export async function laufLoeschen(id: string): Promise<void> {
  await del(`lauf:${id}`);
}

export async function laeufeLaden(): Promise<Lauf[]> {
  const alle = await entries();
  return alle
    .filter(([k]) => typeof k === "string" && k.startsWith("lauf:"))
    .map(([, v]) => v as Lauf)
    .sort((a, b) => b.erstellt.localeCompare(a.erstellt));
}
