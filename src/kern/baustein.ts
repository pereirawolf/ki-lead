// Kennzahlen-Bausteine aus Thessa (format „Thessa-Kennzahlen“) als eigene Materialart (seit 0.6.24, UP-2026-W45-01).
// Profilneutral: Erkennung, Prüfung gegen das eingebettete, gebündelte Schema (formate/fremd/thessa-kennzahlen/), die
// Projektion für die KI ohne „herleitung“ und der Vorschlag einer Quellenzeile für Profile mit LEAD-Meldung-v1
// (Übergangsregel h). Die Schemata reicht der Aufrufer herein, weil kern aus keinem anderen Verzeichnis importiert.

import { pruefeRoh } from "./validierung";

export const BAUSTEIN_FORMAT = "Thessa-Kennzahlen";
/** Bekannte Fassungen; 0.1 ist aus 0.2 abgeleitet (ohne Pflicht für einsatzmeldungen, siehe herkunft.json) */
export const BAUSTEIN_FASSUNGEN = ["0.2", "0.1"] as const;
export type BausteinFassung = (typeof BAUSTEIN_FASSUNGEN)[number];
/** Einheiten der Kennzahlen eines Bausteins (Thessa, docs/DATENMODELL.md) */
export const BAUSTEIN_EINHEITEN = ["Einsatzmittel", "Einsätze", "Einsatzkräfte", "Ausrückebereiche", "Einheiten"] as const;

export interface BausteinKennzahl {
  id: string;
  gegenstand: string;
  einheit: string;
  art: string;
  wert: number | null;
  mindestwert: boolean;
  erhebung: string;
  raum?: string;
  datenstand: string | null;
  teilmenge_von?: string;
  quellen: string[];
}

export interface BausteinInfo {
  fassung: BausteinFassung;
  raum: { name: string; schluessel?: string };
  datenstand: string;
  erzeugt: string;
  fiktiv: boolean;
  kennzahlen: number;
  einsatzmeldungen: number;
  quelle: { kategorie: string; herausgeber: string; titel: string; zugang: string | null; zugriff: string | null; datenstand?: string | null };
}

export type BausteinErkennung =
  { status: "gueltig"; info: BausteinInfo } | { status: "unbekannte_fassung"; fassung: string } | { status: "befunde"; fassung: string; befunde: string[] };

const istObjekt = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);

/**
 * Erkennt einen Kennzahlen-Baustein. null: kein Baustein (anderes JSON). Sonst gültig, unbekannte Fassung oder
 * Schemabefunde; in den beiden letzten Fällen bleibt das Material JSON wie bisher.
 */
export function erkenneBaustein(obj: unknown, schemata: Record<string, object>): BausteinErkennung | null {
  if (!istObjekt(obj) || obj.format !== BAUSTEIN_FORMAT) return null;
  const fassung = String(obj.fassung ?? "");
  const schema = (BAUSTEIN_FASSUNGEN as readonly string[]).includes(fassung) ? schemata[fassung] : undefined;
  if (!schema) return { status: "unbekannte_fassung", fassung };
  const fehler = pruefeRoh(schema, obj);
  if (fehler.length) return { status: "befunde", fassung, befunde: fehler.map((f) => `${f.pfad || "(Wurzel)"}: ${f.text}`) };
  const q = obj.quellen[0];
  return {
    status: "gueltig",
    info: {
      fassung: fassung as BausteinFassung,
      raum: { name: obj.raum.name, ...(obj.raum.schluessel ? { schluessel: obj.raum.schluessel } : {}) },
      datenstand: obj.datenstand,
      erzeugt: obj.erzeugt,
      fiktiv: obj.fiktiv === true,
      kennzahlen: obj.kennzahlen.length,
      einsatzmeldungen: Array.isArray(obj.einsatzmeldungen) ? obj.einsatzmeldungen.length : 0,
      quelle: {
        kategorie: q.kategorie,
        herausgeber: q.herausgeber,
        titel: q.titel,
        zugang: q.zugang ?? null,
        zugriff: q.zugriff ?? null,
        ...(q.datenstand !== undefined ? { datenstand: q.datenstand } : {}),
      },
    },
  };
}

/** Was an die KI geht: der Baustein ohne „herleitung“ (Kennungen einzelner Einsatzmittel; Anforderung i, Datenminimierung). */
export function bausteinProjektion(obj: Record<string, unknown>): Record<string, unknown> {
  const { herleitung: _h, ...rest } = obj;
  return rest;
}

/** „2026-10-14T10:00+02:00“ → „14.10.2026, 10:00“; ein Kalendertag ohne Uhrzeit → „14.10.2026“ (Wanduhrzeit wie angegeben) */
export function zeitDE(wert: string | null | undefined): string {
  const m = String(wert || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return "";
  return `${m[3]}.${m[2]}.${m[1]}${m[4] ? `, ${m[4]}:${m[5]}` : ""}`;
}

const ohneFiktiv = (s: string) => s.replace(/\s*\(FIKTIV\)\s*$/, "").trim();

/** Zugangsvermerk der Quellenzeile nach dem Kodierleitfaden (Abschnitt 5) */
function zugangVermerk(zugang: string | null, fiktiv: boolean): string {
  const teile = [zugang === "behoerdenintern" ? "behördenintern" : zugang === "paywall" ? "Paywall" : "", fiktiv ? "FIKTIV" : ""].filter(Boolean);
  return teile.length ? ` (${teile.join(", ")})` : "";
}

/**
 * Vorschlag einer Quellenzeile ohne Nummer für Profile mit LEAD-Meldung-v1 (Übergangsregel h), in der Form der
 * Quellenverzeichnisse der Beispielprofile: „A – Herausgeber (Tag): Titel (behördenintern, FIKTIV) [Zugriff: Tag].
 * Datenstand: Tag, Uhrzeit“.
 */
export function quellenzeileV1(info: BausteinInfo): string {
  const q = info.quelle;
  const stand = q.datenstand ?? info.datenstand;
  const tag = zeitDE(stand).slice(0, 10);
  const zugriff = q.zugriff ? ` [Zugriff: ${zeitDE(q.zugriff)}]` : "";
  return `${q.kategorie} – ${ohneFiktiv(q.herausgeber)} (${tag}): ${ohneFiktiv(q.titel)}${zugangVermerk(q.zugang, info.fiktiv)}${zugriff}. Datenstand: ${zeitDE(stand)}`;
}

/** Kurzbeschreibung für die Anzeige im Auftrag (Anforderung b). */
export function bausteinHinweis(info: BausteinInfo): string {
  const raum = info.raum.schluessel ? `${info.raum.name} (${info.raum.schluessel})` : info.raum.name;
  const em =
    info.fassung === "0.1" ? "Fassung 0.1 – keine Einsatzmeldungen" : `${info.einsatzmeldungen} Einsatzmeldung${info.einsatzmeldungen === 1 ? "" : "en"}`;
  return `Kennzahlen-Baustein (Thessa ${info.fassung}${info.fiktiv ? ", FIKTIV" : ""}): ${raum}, Datenstand ${zeitDE(info.datenstand)}, ${info.kennzahlen} Kennzahl${info.kennzahlen === 1 ? "" : "en"}, ${em}. Kennzahlen werden unverändert übernommen.`;
}

/** Hinweis, wenn ein Baustein nicht verwendet werden kann und als JSON-Material bleibt. */
export function bausteinAblehnung(e: Exclude<BausteinErkennung, { status: "gueltig" }>): string {
  if (e.status === "unbekannte_fassung")
    return `Kennzahlen-Baustein der Fassung „${e.fassung || "ohne Angabe"}“ ist unbekannt (bekannt: ${BAUSTEIN_FASSUNGEN.join(", ")}); als JSON-Material übernommen, Kennzahlen ohne Prüfung.`;
  return `Kennzahlen-Baustein (Fassung ${e.fassung}) entspricht nicht dem Schema (${e.befunde.length} Befund${e.befunde.length === 1 ? "" : "e"}, etwa ${e.befunde[0]}); als JSON-Material übernommen, Kennzahlen ohne Prüfung.`;
}
