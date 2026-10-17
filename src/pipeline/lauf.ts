// Laufprotokoll: Jeder KI-Lauf ist eine eigene Entität mit Profilbezug (ID, Version, Hash),
// vollständigen Prompts, Rohantworten, Token, Kosten und Dauer je Stufe. Exportierbar als JSON.

import { del, entries, get, set } from "idb-keyval";
import type { AbrufFehler, Fundstelle, Nutzung } from "../anbieter/typen";
import type { Befund, Meldung, Profil } from "../kern/typen";

export const APP_KENNUNG = "KI-LEAD 0.2";

export interface Auftrag {
  sachverhalt: string;
  stichworte: string;
  urls: string[];
  stichtag: string;
  prueffrage: string;
  /** Websuche und Seitenabruf erlauben (Standard: ja; bei Verdichtung: nein) */
  websuche?: boolean;
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
  hinweise: string;
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
  material: { name: string; art: string; groesse: number; hash: string }[];
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
  kostenUsd: number | null;
  fehler?: string;
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

export function kostenSumme(lauf: Lauf): number | null {
  let s = 0;
  for (const st of lauf.stufen) {
    if (st.kostenUsd === null) return null;
    s += st.kostenUsd || 0;
  }
  return s;
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
