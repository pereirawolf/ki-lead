// Kennsätze (SOP-LEAD A.4) und unverbindliche Ausfüllhinweise (A.4/A.5/A.8).

import { feldhilfeFelder, offenePlatzhalter } from "./feldhilfen";
import { holeWert } from "./pfad";
import { quellenHinweise, sachverhalte } from "./quellen";
import { zeitstrahlHinweise } from "./zeitstrahl";
import { feldUi } from "./ui";
import { isoLokalZuZeitpunkt, tagInZone, zeitpunktInZone, zoneOder } from "./zeit";
import type { Befund, Meldung, TextGliederung, UiKonfig } from "./typen";

export const DATUM_RE = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/;

/**
 * Kennsätze, die die App selbst auswertet; seit 0.6.3 (TP-2026-W44-27, Profilformat 1.20) Pflicht in `kennsaetze` der
 * Darstellungsdatei. Fehlt einer, lädt das Profil mit einer Warnung (`KENNSATZ_FEHLT`).
 * - `handlungsrelevant`: Fristen für Management Summary und Redaktionscheck
 * - `aenderung`: Änderungsvermerk einer Fortschreibung (Redaktionscheck)
 * - `abweichung`: abweichende Bewertungen bei der Verdichtung (Redaktionscheck, Textbaustein, Standardtext Verdichtung)
 */
export const PFLICHT_KENNSAETZE = ["handlungsrelevant", "aenderung", "abweichung"] as const;
export type PflichtKennsatz = (typeof PFLICHT_KENNSAETZE)[number];

/**
 * Ersatztexte der App, wo sie ohne Kennsatz des Profils dennoch einen Satzanfang braucht (Fristenblock der Management
 * Summary, Textbaustein „Abweichende Bewertung“, Standardtext Verdichtung). Gleich den Kennsätzen des Beispielprofils.
 */
export const KENNSATZ_ERSATZ: Record<PflichtKennsatz, string> = {
  handlungsrelevant: "Handlungsrelevant bis:",
  aenderung: "Änderung zur Vormeldung:",
  abweichung: "Abweichende Bewertung:",
};

/** Pflichtkennsätze, die eine Darstellungsdatei nicht (oder leer) liefert */
export function fehlendeKennsaetze(ui: Pick<UiKonfig, "kennsaetze">): PflichtKennsatz[] {
  return PFLICHT_KENNSAETZE.filter((k) => !ui.kennsaetze?.[k]?.trim());
}

export function kennsatz(text: unknown, prefix: string | undefined): string | null {
  if (!prefix) return null;
  const hit = String(text || "")
    .split(/\r?\n/)
    .find((l) => l.trim().toLowerCase().startsWith(prefix.toLowerCase()));
  return hit ? hit.trim().slice(prefix.length).trim() : null;
}

/** Alle Zeilen mit diesem Kennsatz (ohne den Satzanfang), in der Reihenfolge des Texts. */
export function kennsaetzeAlle(text: unknown, prefix: string | undefined): string[] {
  if (!prefix) return [];
  return String(text || "")
    .split(/\r?\n/)
    .filter((l) => l.trim().toLowerCase().startsWith(prefix.toLowerCase()))
    .map((l) => l.trim().slice(prefix.length).trim());
}

/**
 * Kennsätze, die nur mitten in einer Zeile vorkommen (nicht am Zeilenanfang) und deshalb nicht als Kennsatz
 * gelten. Steht derselbe Kennsatz zusätzlich korrekt am Zeilenanfang, wird er nicht gemeldet.
 */
export function kennsaetzeImFliesstext(text: unknown, prefixe: (string | undefined)[]): string[] {
  const zeilen = String(text || "").split(/\r?\n/);
  return prefixe.filter((p): p is string => {
    if (!p) return false;
    const klein = p.toLowerCase();
    const amAnfang = zeilen.some((l) => l.trim().toLowerCase().startsWith(klein));
    return !amAnfang && zeilen.some((l) => l.toLowerCase().indexOf(klein) > 0);
  });
}

export interface Frist {
  /** Zeitpunkt; null, wenn kein gültiges Datum erkennbar ist */
  datum: Date | null;
  /** „minute“ mit genannter Uhrzeit, „tag“ ohne (dann gilt das Tagesende 23:59) */
  genauigkeit: "minute" | "tag";
  /** Hinweis, wenn eine Zeitangabe zwar vorkommt, aber nicht sicher zuzuordnen ist */
  hinweis?: string;
}

const UHRZEIT_NACH_DATUM = [
  // „12:00“, „, 12:00“, „um 12:00 Uhr“
  /^\s*,?\s*(?:(?:um|gegen)\s+)?(\d{1,2}):(\d{2})(?!\d)(?:\s*Uhr\b)?/i,
  // „12.00 Uhr“ nur mit „Uhr“: ohne wäre „21.10.2026, 21.10.“ oder „10.15 Euro“ nicht von einer Uhrzeit zu unterscheiden
  /^\s*,?\s*(?:(?:um|gegen)\s+)?(\d{1,2})\.(\d{2})\s*Uhr\b/i,
  // „um 12 Uhr“, „12 Uhr“
  /^\s*,?\s*(?:(?:um|gegen)\s+)?(\d{1,2})\s*Uhr\b/i,
];

/**
 * Frist „TT.MM.JJJJ“ mit optionaler Uhrzeit („hh:mm“, „hh.mm“, „um hh:mm Uhr“, „hh Uhr“). Ohne Uhrzeit gilt das
 * Tagesende 23:59 (Genauigkeit „tag“). Ungültige Angaben (31.02., Monat 13, 25:99) ergeben datum null, statt still
 * umgerechnet zu werden. Mit Zeitzone wird die Wanduhrzeit dort gelesen (Profilzeitzone), sonst in der Gerätezeit.
 * Steht hinter dem Datum eine Zeitangabe in anderer Form („ab 8:00“), wird sie nicht geraten: Tagesende plus Hinweis.
 */
export function leseFrist(s: unknown, zeitzone?: string): Frist {
  const text = String(s || "");
  const m = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (!m) return { datum: null, genauigkeit: "tag" };
  const [tag, monat, jahr] = [+m[1]!, +m[2]!, +m[3]!];
  const rest = text.slice(m.index! + m[0].length);
  let stunde = 23;
  let minute = 59;
  let genauigkeit: Frist["genauigkeit"] = "tag";
  let hinweis: string | undefined;
  const zeit = UHRZEIT_NACH_DATUM.map((re) => rest.match(re)).find(Boolean);
  if (zeit) {
    stunde = +zeit[1]!;
    minute = zeit[2] !== undefined ? +zeit[2] : 0;
    genauigkeit = "minute";
  } else if (/^[^\n]{0,24}?\b\d{1,2}(?::\d{2}\b|(?:\.\d{2})?\s*Uhr\b)/i.test(rest.split(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/)[0] ?? "")) {
    hinweis = "Uhrzeit nicht eindeutig zuzuordnen; gewertet wird das Tagesende (23:59).";
  }
  // „24 Uhr“ / „24:00“ ist das Tagesende: 0 Uhr des Folgetags
  const tagesende = stunde === 24 && minute === 0;
  if (monat < 1 || monat > 12 || tag < 1 || (stunde > 23 && !tagesende) || minute > 59) return { datum: null, genauigkeit };
  const probe = new Date(Date.UTC(jahr, monat - 1, tag));
  if (probe.getUTCFullYear() !== jahr || probe.getUTCMonth() !== monat - 1 || probe.getUTCDate() !== tag) return { datum: null, genauigkeit };
  const [t, h] = tagesende ? [tag + 1, 0] : [tag, stunde];
  const datum = zeitzone ? zeitpunktInZone(jahr, monat, t, h, minute, zeitzone) : new Date(jahr, monat - 1, t, h, minute);
  return { datum, genauigkeit, ...(hinweis ? { hinweis } : {}) };
}

/** Zeitpunkt einer Frist (siehe leseFrist); null, wenn kein gültiges Datum erkennbar ist. */
export function parseDatumDE(s: unknown, zeitzone?: string): Date | null {
  return leseFrist(s, zeitzone).datum;
}

function leer(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Pflichtfelder laut Darstellungsdatei (nur Hinweise; die Schemaprüfung bleibt maßgeblich). */
export function pflichtHinweise(d: Meldung, ui: UiKonfig): Befund[] {
  const out: Befund[] = [];
  const sv = ui.rollen.sachverhalte;
  for (const [pfad, f] of Object.entries(ui.felder)) {
    if (!f.pflicht) continue;
    if (pfad.includes("*")) continue;
    if (pfad.startsWith(sv + "[].")) {
      const rest = pfad.slice(sv.length + 3);
      sachverhalte(d, ui).forEach((element, i) => {
        if (leer(holeWert(element, rest)))
          out.push({ stufe: "warnung", pfad: `${sv}[${i}].${rest}`, text: `${feldUi(ui, sv).element_label || "Eintrag"} ${i + 1}: ${f.label || rest} fehlt.` });
      });
    } else if (!pfad.includes("[]")) {
      if (leer(holeWert(d, pfad))) out.push({ stufe: "warnung", pfad, text: `${f.label || pfad} fehlt.` });
    }
  }
  if (sachverhalte(d, ui).length === 0) out.push({ stufe: "warnung", text: `Es ist kein ${feldUi(ui, sv).element_label || "Eintrag"} erfasst.` });
  return out;
}

export function ausfuellHinweise(d: Meldung, ui: UiKonfig, zeitzone?: string): Befund[] {
  const r = ui.rollen;
  const ks = ui.kennsaetze || {};
  const out: Befund[] = [];
  const zone = zoneOder(zeitzone);
  const t0 = r.meldezeitpunkt ? isoLokalZuZeitpunkt(String(holeWert(d, r.meldezeitpunkt) || ""), zone) : null;
  const elementName = feldUi(ui, r.sachverhalte).element_label || "Sachverhalt";
  sachverhalte(d, ui).forEach((sv, i) => {
    const bez = r.sv_bezeichnung ? holeWert(sv, r.sv_bezeichnung) : "";
    const name = `${elementName} ${i + 1}${bez ? ` („${bez}“)` : ""}`;
    const beurteilung = r.sv_beurteilung ? holeWert(sv, r.sv_beurteilung) : "";
    const tendenz = r.sv_tendenz ? holeWert(sv, r.sv_tendenz) : "";
    const bt = r.sv_bewertung_text ? String(holeWert(sv, r.sv_bewertung_text) || "") : "";
    if (beurteilung && r.sv_bewertung_text && !bt.trim()) {
      out.push({
        stufe: "hinweis",
        text: `${name}: Bewertung „${beurteilung}“ ohne Text – erster Satz: Was bedeutet das für den Bevölkerungsschutz, und warum jetzt?`,
      });
    }
    const imFliesstext = kennsaetzeImFliesstext(bt, Object.values(ks));
    if (imFliesstext.length) {
      out.push({
        stufe: "hinweis",
        text: `${name}: ${imFliesstext.map((k) => `„${k}“`).join(", ")} steht im Fließtext. Kennsätze beginnen eine eigene Zeile, sonst erkennen Lagebild und Redaktionscheck sie nicht.`,
      });
    }
    if (kennsaetzeAlle(bt, ks.handlungsrelevant).some((hb) => !DATUM_RE.test(hb))) {
      out.push({ stufe: "hinweis", text: `${name}: „${ks.handlungsrelevant}“ bitte mit Datum im Format TT.MM.JJJJ angeben.` });
    }
    // Frist auf oder vor t0 (seit 0.6.15, TP-2026-W44-43): eine bei Ausgabe schon erreichte Frist ist als überfällig zu
    // kennzeichnen (SOP-LEAD A.7.3). Ohne Uhrzeit zählt der Tag: derselbe Tag wie t0 gilt als „auf t0“.
    if (t0) {
      for (const hb of kennsaetzeAlle(bt, ks.handlungsrelevant)) {
        if (/überfällig/i.test(hb)) continue;
        const f = leseFrist(hb, zone);
        if (!f.datum) continue;
        const erreicht = f.genauigkeit === "tag" ? tagInZone(f.datum, zone) <= tagInZone(t0.datum, zone) : f.datum.getTime() <= t0.datum.getTime();
        if (erreicht)
          out.push({
            stufe: "hinweis",
            text: `${name}: „${ks.handlungsrelevant} ${hb.match(DATUM_RE)?.[0] ?? ""}“ liegt auf oder vor dem Meldezeitpunkt. Eine bei Ausgabe schon erreichte Frist als „überfällig, Erledigung ungeklärt“ kennzeichnen oder den nächsten offenen Termin nennen.`,
          });
      }
    }
    // Offene Stellen aus Vorlagen der LEAD-Eingabehilfen (⟦…⟧) sind noch auszufüllen oder zu streichen
    for (const feld of new Set([...(r.sv_textfelder || []), ...feldhilfeFelder(ui).keys()])) {
      const offen = offenePlatzhalter(String(holeWert(sv, feld) || ""));
      if (offen.length)
        out.push({
          stufe: "hinweis",
          text: `${name}, ${feldUi(ui, `${r.sachverhalte}[].${feld}`).label || feld}: offene Vorlagenstelle${offen.length === 1 ? "" : "n"} ${offen.slice(0, 4).join(", ")}${offen.length > 4 ? " …" : ""} – ausfüllen oder streichen.`,
        });
    }
    if (r.tendenz_entspannung && tendenz === r.tendenz_entspannung && ks.abschluss && kennsatz(bt, ks.abschluss) === null) {
      out.push({
        stufe: "hinweis",
        text: `${name}: Tendenz „${tendenz}“ – falls das Ereignis beendet ist, „${ks.abschluss}“ mit offenen Punkten und Stelle für die Nachsorge ergänzen; sonst Stand des Wiederanlaufs nennen.`,
      });
    }
  });
  const finalSicht = { ...d, [r.status_feld]: r.status_final };
  quellenHinweise(finalSicht, ui).forEach((b) => out.push({ ...b, text: "Quellen: " + b.text }));
  // Zeitstrahl, Kennungen und Bezug (seit 0.6.9)
  zeitstrahlHinweise(finalSicht, ui).forEach((b) => out.push({ ...b, text: `${b.code?.startsWith("ZEITSTRAHL") ? "Zeitstrahl" : "Kennung"}: ${b.text}` }));
  return out;
}

function rx(quelle: string): RegExp | null {
  try {
    return new RegExp(quelle, "u");
  } catch {
    return null;
  }
}

/**
 * Satzende vor einem Gliederungsanfang: . ; ! ? ) ] “ " – vor Zeilenanfängen zusätzlich der Doppelpunkt
 * (Aufzählung nach „Prüfbedarf:“); vor kurzen Aspektbegriffen weder „)“ noch der Punkt einer Ordnungszahl,
 * damit „(1) Landkreis: …“ und „1. Land: …“ zusammenbleiben.
 */
const ENDE_ABSATZ = `[.;!?)\\]“"]`;
const ENDE_ZEILE = `[.;:!?)\\]“"]`;
const ENDE_KURZ = `(?<!(?:^|\\n|[ (])\\d{1,3})[.;!?\\]“"]`;

/**
 * Kurzer Aspektbegriff mit Doppelpunkt am Satzanfang („Strom:“, „Verkehr → Versorgung:“, „Weg:“,
 * „Land (Behörde):“): höchstens n Wörter, das erste großgeschrieben, optional ein Klammerzusatz.
 */
function kurzlabelQuelle(n: number): string {
  const wort = "[\\p{L}\\d][\\p{L}\\d\\-/]*";
  return `\\p{Lu}[\\p{L}\\d\\-/]*(?:[ ]+(?:→[ ]+)?${wort}){0,${n - 1}}(?:[ ]+\\([^()\\n]{1,40}\\))?:(?=[ \\n])`;
}

/**
 * Gliedert einen Freitext für Ausgaben (PDF, Kopiervorlage, Tabellen): Satzanfänge aus `absatz` beginnen mit
 * Leerzeile, solche aus `zeile` auf neuer Zeile (auch direkt nach einem Doppelpunkt, etwa Aufzählungen „(1) …“).
 * Mit `kurzlabel` (Anzahl Wörter) beginnt zusätzlich jeder kurze Aspektbegriff mit Doppelpunkt eine neue Zeile.
 * Kennsätze stehen auf eigener Zeile, der erste eröffnet einen Absatz. Der Inhalt bleibt unverändert; nur
 * Zeilenumbrüche werden ergänzt. Gespeicherte Meldungen werden nicht verändert.
 */
export function gliedere(text: unknown, g: TextGliederung | undefined, kennsaetze: string[] = []): string {
  let t = String(text ?? "").replace(/\r\n?/g, "\n");
  if (!t.trim()) return t;
  g = g || {};
  const ks = kennsaetze.filter(Boolean).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const absatz = (g.absatz || []).map(rx).filter(Boolean) as RegExp[];
  const zeile = (g.zeile || []).map(rx).filter(Boolean) as RegExp[];
  const kennsatz = ks.map(rx).filter(Boolean) as RegExp[];
  const kurz = Number.isInteger(g.kurzlabel) && g.kurzlabel! > 0 ? rx(kurzlabelQuelle(Math.min(g.kurzlabel!, 8))) : null;
  const alle = [
    ...absatz.map((r) => ({ r, art: "absatz" as const })),
    ...zeile.map((r) => ({ r, art: "zeile" as const })),
    ...(kurz ? [{ r: kurz, art: "kurz" as const }] : []),
  ];
  const ende = { absatz: ENDE_ABSATZ, zeile: ENDE_ZEILE, kurz: ENDE_KURZ };
  const umbruch = (text: string, r: RegExp, art: keyof typeof ende) =>
    text.replace(new RegExp(`(${ende[art]})[ \\t]+(?=${r.source})`, "gu"), art === "absatz" ? "$1\n\n" : "$1\n");
  // 1a. Kennsätze mitten in einer Zeile beginnen eine eigene Zeile
  for (const r of kennsatz) t = umbruch(t, r, "zeile");
  // 1b. Übrige Gliederungsanfänge nach Satzende, aber nicht innerhalb einer Kennsatzzeile: Ein Kennsatz reicht bis
  // zum Zeilenende („Änderung zur Vormeldung: …; Beurteilung „erheblich“ → „geringfügig““ bleibt eine Zeile)
  const kennsatzZeile = ks.length ? new RegExp(`^(?:${ks.join("|")})`, "u") : null;
  t = t
    .split("\n")
    .map((z) => {
      if (kennsatzZeile?.test(z)) return z;
      for (const { r, art } of alle) z = umbruch(z, r, art);
      return z;
    })
    .join("\n");
  // 2. Absatzanfänge am Zeilenanfang: Leerzeile davor
  for (const r of absatz) t = t.replace(new RegExp(`([^\\n])\\n(?=${r.source})`, "gu"), "$1\n\n");
  // 3. Der erste Kennsatz eröffnet einen eigenen Absatz
  const kRx = ks.length ? new RegExp(`\\n(?=(${ks.join("|")}))`, "u") : null;
  if (kRx) {
    const m = kRx.exec(t);
    if (m && t[m.index - 1] !== "\n") t = t.slice(0, m.index) + "\n" + t.slice(m.index);
  }
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

/** Bewertungstext gliedern: Kernaussage, Referenzraum, Beurteilung, Tendenz, Achsen, Kennsätze (bewertung_gliederung). */
export function gliedereBewertung(text: unknown, ui: UiKonfig): string {
  return gliedere(text, ui.bewertung_gliederung, Object.values(ui.kennsaetze || {}));
}

/** Analysefeld gliedern: Schlüsselsätze, die einen neuen Aspekt einleiten (analyse_gliederung). */
export function gliedereAnalyse(text: unknown, ui: UiKonfig): string {
  return gliedere(text, ui.analyse_gliederung);
}

/**
 * Gliederung nach Feldpfad: `pfad` ist der Profilpfad („sachverhalte[].analyse.lage_ereignis“) oder der Pfad
 * innerhalb eines Sachverhalts („analyse.lage_ereignis“). Andere Felder bleiben unverändert.
 */
export function gliedereFeld(pfad: string, text: string, ui: UiKonfig): string {
  const r = ui.rollen;
  const p = r.sachverhalte && pfad.startsWith(`${r.sachverhalte}[].`) ? pfad.slice(r.sachverhalte.length + 3) : pfad;
  if (r.sv_bewertung_text && p === r.sv_bewertung_text) return gliedereBewertung(text, ui);
  if ((r.sv_analysefelder || []).includes(p)) return gliedereAnalyse(text, ui);
  return text;
}
