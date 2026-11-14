// Sachverhaltskennung (seit 0.6.9, ZS-2026-W44-02): eindeutig über viele meldende Stellen, ohne zentrales Register,
// ohne Zählerstand und auch offline. Form „<Präfix>-<JJJJMMTT>-<4 Zeichen>“, z. B. „DE-TH-20261014-K7QM“: Präfix nach
// der Herkunft (aus dem Feld der Rolle „land“, Zuordnung in der Darstellungsdatei unter „kennung.praefixe“),
// Anlagedatum und vier Zufallszeichen aus dem Base32-Alphabet nach Crockford (ohne I, L, O, U). Bei der Fortschreibung
// bleibt die einmal vergebene Kennung unverändert; ein Sachverhalt, der aus anderen hervorgeht, erhält eine eigene
// Kennung und nennt die anderen in der Rolle „sv_bezug“.

import { holeWert } from "./pfad";
import type { Meldung, UiKonfig } from "./typen";

/** Base32 nach Crockford: Ziffern und Großbuchstaben ohne I, L, O, U (keine Verwechslung beim Abschreiben) */
export const KENNUNG_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Präfix: ein bis vier Segmente aus Großbuchstaben und Ziffern, je bis acht Zeichen, z. B. „DE“, „DE-TH“ */
export const PRAEFIX_RE = /^[A-Z0-9]{1,8}(?:-[A-Z0-9]{1,8}){0,3}$/;

/** Vollständige Kennung; dasselbe Muster steht im Schema des Beispielprofils */
export const KENNUNG_RE = /^[A-Z0-9]{1,8}(?:-[A-Z0-9]{1,8}){0,3}-\d{8}-[0-9A-HJKMNP-TV-Z]{4}$/;

/**
 * Kennung nach LEAD-Meldung-v2 (Abschnitt 3): Zufallsteil 4 bis 8 Zeichen; neu vergebene Kennungen erhalten 6 Zeichen
 * (seit 0.8.0, UP-2026-W45-04). Bestehende Kennungen mit vier Zeichen bleiben gültig.
 */
export const KENNUNG_V2_RE = /^[A-Z0-9]{1,8}(?:-[A-Z0-9]{1,8}){0,3}-\d{8}-[0-9A-HJKMNP-TV-Z]{4,8}$/;

/** Länge des Zufallsteils neu vergebener Kennungen nach LEAD-Meldung-v2 */
export const ZUFALL_V2 = 6;

export function istKennungV2(s: unknown): s is string {
  return typeof s === "string" && KENNUNG_V2_RE.test(s);
}

/** Platzhalter der KI für neue Sachverhalte; die App ersetzt sie nach S2 durch vergebene Kennungen */
export const PLATZHALTER_RE = /^NEU-(\d{1,3})$/;

/** Präfix, wenn das Profil keines festlegt */
export const STANDARD_PRAEFIX = "SV";

export function istKennung(s: unknown): s is string {
  return typeof s === "string" && KENNUNG_RE.test(s);
}

/** Präfix zur Herkunft (Wert des Felds der Rolle „land“); unbekannte oder leere Herkunft: `kennung.standard`. */
export function praefixFuer(ui: UiKonfig, herkunft: unknown): string {
  const k = ui.kennung || {};
  const wert = typeof herkunft === "string" ? herkunft.trim() : "";
  const p = (wert && k.praefixe?.[wert]) || k.standard || STANDARD_PRAEFIX;
  return PRAEFIX_RE.test(p) ? p : STANDARD_PRAEFIX;
}

/** Zufallszeichen (Vorgabe vier); `zufall` liefert Zahlen in [0, 1) (Tests), sonst kryptografischer Zufall des Geräts */
export function zufallsteil(zufall?: () => number, laenge = 4): string {
  let out = "";
  if (zufall) {
    for (let i = 0; i < laenge; i++) out += KENNUNG_ALPHABET[Math.floor(zufall() * 32) % 32];
    return out;
  }
  const z = new Uint8Array(laenge);
  globalThis.crypto.getRandomValues(z);
  for (const b of z) out += KENNUNG_ALPHABET[b % 32];
  return out;
}

/**
 * Neue Kennung. `datum` ist das Anlagedatum als „JJJJ-MM-TT“ (oder Zeitstempel „JJJJ-MM-TTThh:mm“) in der Zeitzone
 * des Profils. `vergeben` verhindert eine Doppelung innerhalb derselben Meldung (bei vier Zeichen ohnehin selten).
 */
export function neueKennung(ui: UiKonfig, herkunft: unknown, datum: string, vergeben: Iterable<string> = [], zufall?: () => number, laenge = 4): string {
  const tag = (datum.match(/^(\d{4})-(\d{2})-(\d{2})/) || []).slice(1).join("");
  if (tag.length !== 8) throw new Error(`Anlagedatum „${datum}“ ist kein Datum im Format JJJJ-MM-TT.`);
  const belegt = new Set(vergeben);
  const praefix = praefixFuer(ui, herkunft);
  for (let versuch = 0; versuch < 64; versuch++) {
    const k = `${praefix}-${tag}-${zufallsteil(zufall, laenge)}`;
    if (!belegt.has(k)) return k;
  }
  throw new Error("Keine freie Kennung gefunden.");
}

/** Kennungen aller Sachverhalte einer Meldung (nur gültige, in der Reihenfolge der Liste) */
export function kennungenDerMeldung(d: Meldung | undefined, ui: UiKonfig): string[] {
  const r = ui.rollen;
  if (!d || !r.sv_kennung) return [];
  const liste = holeWert(d, r.sachverhalte);
  if (!Array.isArray(liste)) return [];
  return liste.map((sv) => holeWert(sv, r.sv_kennung!)).filter(istKennung);
}

/** Bezugskennungen eines Sachverhalts als Liste von Texten (ohne Leereinträge) */
export function bezugVon(sv: unknown, ui: UiKonfig): string[] {
  const rolle = ui.rollen.sv_bezug;
  if (!rolle || !sv || typeof sv !== "object") return [];
  const wert = holeWert(sv, rolle);
  // LEAD-Meldung-v2: Einträge als Objekte {kennung, meldung_id?, art?} (seit 0.8.3, UP-2026-W45-06)
  return Array.isArray(wert)
    ? wert.map((x) => String((x && typeof x === "object" ? (x as Record<string, unknown>).kennung : x) ?? "").trim()).filter(Boolean)
    : [];
}
