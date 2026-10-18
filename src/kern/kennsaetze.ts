// Kennsätze (SOP-LEAD A.4) und unverbindliche Ausfüllhinweise (A.4/A.5/A.8).

import { holeWert } from "./pfad";
import { quellenHinweise, sachverhalte } from "./quellen";
import { feldUi } from "./ui";
import type { Befund, Meldung, TextGliederung, UiKonfig } from "./typen";

export const DATUM_RE = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/;

export function kennsatz(text: unknown, prefix: string | undefined): string | null {
  if (!prefix) return null;
  const hit = String(text || "")
    .split(/\r?\n/)
    .find((l) => l.trim().toLowerCase().startsWith(prefix.toLowerCase()));
  return hit ? hit.trim().slice(prefix.length).trim() : null;
}

/**
 * Datum „TT.MM.JJJJ“ mit optionaler Uhrzeit „hh:mm“ (lokale Zeit des Geräts; die Profile nutzen
 * Europe/Berlin). Ohne Uhrzeit gilt 23:59. Ungültige Angaben (31.02., Monat 13, 25:99) ergeben null,
 * statt stillschweigend umgerechnet zu werden.
 */
export function parseDatumDE(s: unknown): Date | null {
  const m = String(s || "").match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [tag, monat, jahr] = [+m[1], +m[2], +m[3]];
  const stunde = m[4] ? +m[4] : 23;
  const minute = m[5] ? +m[5] : 59;
  if (monat < 1 || monat > 12 || tag < 1 || stunde > 23 || minute > 59) return null;
  const d = new Date(jahr, monat - 1, tag, stunde, minute);
  if (isNaN(d.getTime()) || d.getFullYear() !== jahr || d.getMonth() !== monat - 1 || d.getDate() !== tag) return null;
  return d;
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

export function ausfuellHinweise(d: Meldung, ui: UiKonfig): Befund[] {
  const r = ui.rollen;
  const ks = ui.kennsaetze || {};
  const out: Befund[] = [];
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
    const hb = kennsatz(bt, ks.handlungsrelevant);
    if (hb !== null && !DATUM_RE.test(hb)) {
      out.push({ stufe: "hinweis", text: `${name}: „${ks.handlungsrelevant}“ bitte mit Datum im Format TT.MM.JJJJ angeben.` });
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
  const zeile = [...(g.zeile || []), ...ks].map(rx).filter(Boolean) as RegExp[];
  const kurz = Number.isInteger(g.kurzlabel) && g.kurzlabel! > 0 ? rx(kurzlabelQuelle(Math.min(g.kurzlabel!, 8))) : null;
  const alle = [
    ...absatz.map((r) => ({ r, art: "absatz" as const })),
    ...zeile.map((r) => ({ r, art: "zeile" as const })),
    ...(kurz ? [{ r: kurz, art: "kurz" as const }] : []),
  ];
  const ende = { absatz: ENDE_ABSATZ, zeile: ENDE_ZEILE, kurz: ENDE_KURZ };
  // 1. Gliederungsanfänge mitten in einer Zeile: nach Satzende einen Umbruch setzen
  for (const { r, art } of alle) {
    const muster = new RegExp(`(${ende[art]})[ \\t]+(?=${r.source})`, "gu");
    t = t.replace(muster, art === "absatz" ? "$1\n\n" : "$1\n");
  }
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
