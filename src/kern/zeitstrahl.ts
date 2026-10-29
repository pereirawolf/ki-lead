// Zeitstrahl je Sachverhalt (seit 0.6.9, ZS-2026-W44-01): ein Textfeld auf Meldungsebene (Rolle „zeitstrahl“) neben
// dem Quellenverzeichnis, eine Zeile je relevantem Ereignis in fester Form
//
//   [Z1] 2026-10-14T06:00 · DE-TH-20261014-K7QM · Warnung – DWD: Unwetterwarnung Stufe 3 für Küstenkreise [Q2]
//
// Nummer, Zeitpunkt (Tag oder Tag mit Uhrzeit), Kennung des Sachverhalts (Rolle „sv_kennung“), Typ aus der Liste des
// Profils und Kurztext mit Quellenverweis. Der Zeitstrahl führt nur eingetretene, belegte Ereignisse bis zum
// Meldezeitpunkt; Bewertungszeilen setzt die App bei der Fortschreibung selbst. Regeln: Kodierleitfaden des Profils.
// Diese Datei kennt kein Quellenverzeichnis (kern/quellen.ts liest umgekehrt die Verweise des Zeitstrahls).

import { holeWert } from "./pfad";
import { istKennung } from "./kennung";
import type { Befund, Meldung, UiKonfig, ZeitstrahlKonfig } from "./typen";
import { feldUi } from "./ui";

/** Typen, wenn das Profil keine festlegt (die des Beispielprofils) */
export const STANDARD_TYPEN = ["Ereignis", "Warnung", "Maßnahme", "Wendepunkt", "Wiederherstellung", "Bewertung", "Berichtigung"];
export const STANDARD_RICHTWERT = 12;

export interface ZeitstrahlEintrag {
  nr: number;
  /** „JJJJ-MM-TT“ oder „JJJJ-MM-TTThh:mm“ */
  zeit: string;
  kennung: string;
  typ: string;
  text: string;
  /** Zeile wie im Feld (ohne führende und folgende Leerzeichen) */
  zeile: string;
  /** Zeilennummer im Feld, ab 1 */
  zeilenNr: number;
}

export interface ZeitstrahlLesung {
  eintraege: ZeitstrahlEintrag[];
  /** Nicht leere Zeilen, die nicht der Form entsprechen */
  ungueltig: { zeilenNr: number; zeile: string }[];
}

/** Trennzeichen „·“ (auch „|“), zwischen Typ und Text ein Gedankenstrich (auch „-“ mit Leerzeichen) */
const ZEILE_RE = /^\[Z(\d{1,4})\]\s+(\S+)\s+[·|]\s+(\S+)\s+[·|]\s+(.+?)\s+[–—-]\s+(.*\S)$/u;
const ZEIT_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

export function zeitstrahlKonfig(ui: UiKonfig): Required<ZeitstrahlKonfig> {
  const z = ui.zeitstrahl || {};
  const typen = Array.isArray(z.typen) && z.typen.length ? z.typen : STANDARD_TYPEN;
  return {
    typen,
    typ_bewertung: z.typ_bewertung || (typen.includes("Bewertung") ? "Bewertung" : ""),
    typ_berichtigung: z.typ_berichtigung || (typen.includes("Berichtigung") ? "Berichtigung" : ""),
    richtwert_je_sachverhalt:
      Number.isInteger(z.richtwert_je_sachverhalt) && z.richtwert_je_sachverhalt! > 0 ? z.richtwert_je_sachverhalt! : STANDARD_RICHTWERT,
  };
}

/** Kalendarisch gültiger Zeitpunkt in der Form des Zeitstrahls */
export function istZeitstrahlZeit(z: string): boolean {
  const m = z.match(ZEIT_RE);
  if (!m) return false;
  const [j, mo, t] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(j, mo - 1, t));
  if (d.getUTCFullYear() !== j || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== t) return false;
  return m[4] === undefined || (Number(m[4]) < 24 && Number(m[5]) < 60);
}

export function parseZeitstrahl(text: unknown): ZeitstrahlLesung {
  const eintraege: ZeitstrahlEintrag[] = [];
  const ungueltig: ZeitstrahlLesung["ungueltig"] = [];
  String(text ?? "")
    .split(/\r?\n/)
    .forEach((roh, i) => {
      const zeile = roh.trim();
      if (!zeile) return;
      const m = zeile.match(ZEILE_RE);
      if (!m) {
        ungueltig.push({ zeilenNr: i + 1, zeile });
        return;
      }
      eintraege.push({ nr: Number(m[1]), zeit: m[2]!, kennung: m[3]!, typ: m[4]!.trim(), text: m[5]!, zeile, zeilenNr: i + 1 });
    });
  return { eintraege, ungueltig };
}

/** Zeile in der festen Form */
export function zeitstrahlZeile(e: Pick<ZeitstrahlEintrag, "nr" | "zeit" | "kennung" | "typ" | "text">): string {
  return `[Z${e.nr}] ${e.zeit} · ${e.kennung} · ${e.typ} – ${e.text}`;
}

/** Chronologisch (Zeitpunkt, bei Gleichstand Nummer); ein Tag ohne Uhrzeit steht vor den Uhrzeiten desselben Tags */
export function chronologisch<T extends Pick<ZeitstrahlEintrag, "zeit" | "nr">>(eintraege: T[]): T[] {
  return [...eintraege].sort((a, b) => (a.zeit < b.zeit ? -1 : a.zeit > b.zeit ? 1 : a.nr - b.nr));
}

/** Text chronologisch geordnet; Zeilen außerhalb der Form bleiben in ihrer Reihenfolge am Ende erhalten */
export function zeitstrahlOrdnen(text: unknown): string {
  const { eintraege, ungueltig } = parseZeitstrahl(text);
  return [...chronologisch(eintraege).map((e) => e.zeile), ...ungueltig.map((u) => u.zeile)].join("\n");
}

/** Einträge eines Sachverhalts, chronologisch */
export function eintraegeFuer(text: unknown, kennung: string): ZeitstrahlEintrag[] {
  if (!kennung) return [];
  return chronologisch(parseZeitstrahl(text).eintraege.filter((e) => e.kennung === kennung));
}

/** Nächste freie Nummer */
export function naechsteZNr(text: unknown): number {
  const nrs = parseZeitstrahl(text).eintraege.map((e) => e.nr);
  return nrs.length ? Math.max(...nrs) + 1 : 1;
}

/** „14.10.2026 06:00“ bzw. „14.10.2026“ */
export function zeitstrahlZeitDE(zeit: string): string {
  const m = zeit.match(ZEIT_RE);
  if (!m) return zeit;
  return `${m[3]}.${m[2]}.${m[1]}${m[4] !== undefined ? ` ${m[4]}:${m[5]}` : ""}`;
}

/** Lesbare Zeile ohne Kennung für Ausgaben je Sachverhalt: „[Z1] 14.10.2026 06:00 · Warnung – …“ */
export function zeitstrahlAnzeige(e: ZeitstrahlEintrag): string {
  return `[Z${e.nr}] ${zeitstrahlZeitDE(e.zeit)} · ${e.typ} – ${e.text}`;
}

/** Text des Zeitstrahls einer Meldung (leer ohne Rolle) */
export function zeitstrahlText(d: Meldung | undefined, ui: UiKonfig): string {
  const rolle = ui.rollen.zeitstrahl;
  return d && rolle ? String(holeWert(d, rolle) ?? "") : "";
}

const QVERWEIS_RE = /\[Q\d/;
const ZVERWEIS_RE = /\[Z(\d{1,4})\]/g;

/**
 * Formale Hinweise zu Zeitstrahl, Kennungen und Bezug einer Meldung (Prüfschritt, KI-Ergebnis). Sie prüfen Form und
 * Zuordnung, nicht den Inhalt. Ob Quellenverweise im Verzeichnis stehen, prüft das Quellenverzeichnis (kern/quellen.ts).
 */
export function zeitstrahlHinweise(d: Meldung, ui: UiKonfig): Befund[] {
  const out: Befund[] = [];
  const r = ui.rollen;
  const liste = holeWert(d, r.sachverhalte);
  const svs: any[] = Array.isArray(liste) ? liste : [];
  const elementName = feldUi(ui, r.sachverhalte).element_label || "Sachverhalt";
  const name = (i: number) => {
    const bez = r.sv_bezeichnung ? String(holeWert(svs[i], r.sv_bezeichnung) ?? "") : "";
    return `${elementName} ${i + 1}${bez ? ` („${bez}“)` : ""}`;
  };

  // Kennungen und Bezug
  const kennungen = new Map<string, number[]>();
  if (r.sv_kennung)
    svs.forEach((sv, i) => {
      const k = String(holeWert(sv, r.sv_kennung!) ?? "").trim();
      if (!k) out.push({ stufe: "hinweis", code: "KENNUNG_FEHLT", text: `${name(i)} hat keine Kennung; im Sachverhalt „Kennung vergeben“ wählen.` });
      else kennungen.set(k, [...(kennungen.get(k) || []), i]);
    });
  for (const [k, idx] of kennungen)
    if (idx.length > 1)
      out.push({
        stufe: "warnung",
        code: "KENNUNG_DOPPELT",
        text: `Kennung ${k} steht bei mehreren Sachverhalten (${idx.map((i) => i + 1).join(", ")}); jeder Sachverhalt braucht eine eigene.`,
      });
  if (r.sv_bezug)
    svs.forEach((sv, i) => {
      const eigene = r.sv_kennung ? String(holeWert(sv, r.sv_kennung) ?? "") : "";
      const bezug = holeWert(sv, r.sv_bezug!);
      if (eigene && Array.isArray(bezug) && bezug.includes(eigene))
        out.push({ stufe: "warnung", code: "BEZUG_SELBST", text: `${name(i)} nennt die eigene Kennung als Bezug.` });
    });

  const text = zeitstrahlText(d, ui);
  if (!r.zeitstrahl || !text.trim()) return out;
  const kz = zeitstrahlKonfig(ui);
  const { eintraege, ungueltig } = parseZeitstrahl(text);
  for (const u of ungueltig.slice(0, 5))
    out.push({
      stufe: "warnung",
      code: "ZEITSTRAHL_FORMAT",
      text: `Zeile ${u.zeilenNr} hat nicht die Form „[Zn] JJJJ-MM-TT[Thh:mm] · Kennung · Typ – Text [Qn]“: „${u.zeile.slice(0, 80)}${u.zeile.length > 80 ? " …" : ""}“.`,
    });
  if (ungueltig.length > 5)
    out.push({ stufe: "warnung", code: "ZEITSTRAHL_FORMAT", text: `${ungueltig.length - 5} weitere Zeilen haben nicht die feste Form.` });

  const t0 = r.meldezeitpunkt ? String(holeWert(d, r.meldezeitpunkt) ?? "") : "";
  const nummern = new Map<number, number>();
  const jeKennung = new Map<string, number>();
  for (const e of eintraege) {
    nummern.set(e.nr, (nummern.get(e.nr) || 0) + 1);
    const z = `[Z${e.nr}]`;
    if (!istZeitstrahlZeit(e.zeit))
      out.push({ stufe: "warnung", code: "ZEITSTRAHL_ZEIT", text: `${z}: Zeitpunkt „${e.zeit}“ ist kein gültiges Datum (JJJJ-MM-TT oder JJJJ-MM-TTThh:mm).` });
    else if (t0 && (e.zeit.length > 10 ? e.zeit > t0 : e.zeit > t0.slice(0, 10)))
      out.push({
        stufe: "warnung",
        code: "ZEITSTRAHL_NACH_T0",
        text: `${z} liegt nach dem Meldezeitpunkt. Der Zeitstrahl führt nur eingetretene Ereignisse; Erwartetes gehört in „Risiken & Auswirkungen“ und „Neubewertung bei:“.`,
      });
    if (!istKennung(e.kennung))
      out.push({ stufe: "warnung", code: "ZEITSTRAHL_KENNUNG_UNBEKANNT", text: `${z}: „${e.kennung}“ ist keine Sachverhaltskennung.` });
    else if (r.sv_kennung && !kennungen.has(e.kennung))
      out.push({
        stufe: "warnung",
        code: "ZEITSTRAHL_KENNUNG_UNBEKANNT",
        text: `${z} verweist auf ${e.kennung}; kein Sachverhalt dieser Meldung trägt diese Kennung.`,
      });
    if (!kz.typen.includes(e.typ))
      out.push({ stufe: "warnung", code: "ZEITSTRAHL_TYP", text: `${z}: Typ „${e.typ}“ ist nicht vorgesehen (${kz.typen.join(", ")}).` });
    if (e.typ !== kz.typ_bewertung && !QVERWEIS_RE.test(e.text))
      out.push({ stufe: "warnung", code: "ZEITSTRAHL_OHNE_BELEG", text: `${z} hat keinen Quellenverweis [Qn].` });
    if (kz.typ_berichtigung && e.typ === kz.typ_berichtigung) {
      const ziele = [...e.text.matchAll(ZVERWEIS_RE)].map((m) => Number(m[1]));
      if (!ziele.length || ziele.some((n) => !eintraege.some((x) => x.nr === n)))
        out.push({ stufe: "hinweis", code: "ZEITSTRAHL_BERICHTIGUNG", text: `${z}: Eine Berichtigung nennt die berichtigte Zeile („zu [Zn]: …“).` });
    }
    jeKennung.set(e.kennung, (jeKennung.get(e.kennung) || 0) + 1);
  }
  for (const [nr, n] of nummern) if (n > 1) out.push({ stufe: "warnung", code: "ZEITSTRAHL_NUMMER_DOPPELT", text: `[Z${nr}] ist mehrfach vergeben.` });
  const geordnet = chronologisch(eintraege);
  if (geordnet.some((e, i) => e !== eintraege[i]))
    out.push({ stufe: "hinweis", code: "ZEITSTRAHL_REIHENFOLGE", text: "Die Zeilen stehen nicht in zeitlicher Reihenfolge („Chronologisch ordnen“)." });
  for (const [k, n] of jeKennung)
    if (n > kz.richtwert_je_sachverhalt && kennungen.has(k))
      out.push({
        stufe: "hinweis",
        code: "ZEITSTRAHL_RICHTWERT",
        text: `${name(kennungen.get(k)![0]!)}: ${n} Zeilen, Richtwert ${kz.richtwert_je_sachverhalt}. Neu aufnehmen nur Wendepunkte; frühere Zeilen bleiben stehen.`,
      });
  return out;
}
