// Zentrales Quellenverzeichnis: Einträge „[Qn] K – …“, Verweise „[Q1]“, „[Q2, Q4]“, „[Q1–Q3]“.
// Generische Quellenlogik, gesteuert über Rollen und Kategorien des Profils.

import { holeWert } from "./pfad";
import type { Befund, Meldung, UiKonfig } from "./typen";

export interface QuellenEintrag {
  nr: number;
  code: string;
  text: string;
}

const ALT_QZEILE = /^\s*\[Q\d+\]\s*[A-Z]\s*[–\-·:|]/;

export function parseQuellen(text: unknown): QuellenEintrag[] {
  const entries: QuellenEintrag[] = [];
  String(text || "")
    .split(/\r?\n/)
    .forEach((line) => {
      const m = line.match(/^\s*\[Q(\d+)\]\s*(.*)$/);
      if (m) {
        const c = m[2].match(/^([A-Z])(?=\s*[–\-·:|,]|\s|$)/);
        entries.push({ nr: +m[1], code: c ? c[1] : "", text: line.trim() });
      } else if (line.trim() && entries.length) {
        entries[entries.length - 1].text += "\n" + line.trim();
      }
    });
  return entries;
}

/** Größte Zahl an Quellennummern, die ein Bereich wie [Q1–Q5] ergibt */
const MAX_BEREICH = 50;

export function verweise(text: unknown): Set<number> {
  const refs = new Set<number>();
  const re = /\[([^\]\n]{1,60})\]/g;
  const s = String(text || "");
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const inner = m[1];
    if (!/^\s*Q\d+/.test(inner)) continue;
    inner.split(/[,;]/).forEach((tok) => {
      const r = tok.match(/^\s*Q(\d+)\s*(?:[–-]\s*Q?(\d+))?\s*$/);
      if (!r) return;
      const a = Number(r[1]);
      const b = r[2] ? Number(r[2]) : a;
      // Höchstens MAX_BEREICH Nummern je Bereich, auch rückwärts ([Q9–Q1]). Gezählt wird über einen kleinen
      // Abstand statt über die Nummer selbst: Oberhalb von 2^53 ändert i++ eine JavaScript-Zahl nicht mehr.
      const von = Math.min(a, b);
      const anzahl = Math.min(Math.max(a, b) - von, MAX_BEREICH - 1);
      for (let k = 0; k <= anzahl; k++) refs.add(von + k);
    });
  }
  return refs;
}

export function sachverhalte(d: Meldung, ui: UiKonfig): any[] {
  const liste = holeWert(d, ui.rollen.sachverhalte);
  return Array.isArray(liste) ? liste : [];
}

/** Alle Fließtexte eines Sachverhalts ohne Quellenzeilen im Altformat. */
export function svTexte(sv: any, ui: UiKonfig): string {
  return (ui.rollen.sv_textfelder || [])
    .map((p) => String(holeWert(sv, p) || ""))
    .join("\n")
    .split(/\r?\n/)
    .filter((l) => !ALT_QZEILE.test(l))
    .join("\n");
}

export function altQuellenZeilen(d: Meldung, ui: UiKonfig): { sv: number; feld: string; zeile: string }[] {
  const out: { sv: number; feld: string; zeile: string }[] = [];
  sachverhalte(d, ui).forEach((sv, i) => {
    (ui.rollen.sv_analysefelder || []).forEach((feld) => {
      String(holeWert(sv, feld) || "")
        .split(/\r?\n/)
        .forEach((l) => {
          if (/^\s*\[Q\d+\]\s*\S/.test(l)) out.push({ sv: i, feld, zeile: l });
        });
    });
  });
  return out;
}

export function quellenFuerSachverhalt(quellenText: unknown, sv: any, ui: UiKonfig): QuellenEintrag[] | null {
  const entries = parseQuellen(quellenText);
  if (!entries.length) return null;
  const refs = verweise(svTexte(sv, ui));
  const hit = entries.filter((e) => refs.has(e.nr));
  return hit.length ? hit : null;
}

/** Kategorien in der Reihenfolge der Quellenpriorität des Profils; nicht genannte Kategorien folgen in Dateireihenfolge. */
export function kategorienGeordnet(ui: UiKonfig): [string, string][] {
  const kategorien = ui.quellen?.kategorien || {};
  const rang = (ui.quellen?.rangfolge || []).filter((c) => c in kategorien);
  const rest = Object.keys(kategorien).filter((c) => !rang.includes(c));
  return [...rang, ...rest].map((c) => [c, kategorien[c]]);
}

/** Lesbare Quellenpriorität, z. B. „A > B > W > M > P“; leer, wenn das Profil keine Rangfolge angibt. */
export function rangfolgeText(ui: UiKonfig): string {
  const kategorien = ui.quellen?.kategorien || {};
  return (ui.quellen?.rangfolge || []).filter((c) => c in kategorien).join(" > ");
}

export function quellenHinweise(d: Meldung, ui: UiKonfig): Befund[] {
  const out: Befund[] = [];
  const rolle = ui.rollen.quellen;
  if (!rolle) return out;
  const quellenText = String(holeWert(d, rolle) || "");
  const kategorien = ui.quellen?.kategorien || {};
  const alt = ui.quellen?.altkategorien || {};
  const entries = parseQuellen(quellenText);
  const nrs = new Set(entries.map((e) => e.nr));
  const refsAll = new Set<number>();
  const svs = sachverhalte(d, ui);
  svs.forEach((sv) => verweise(svTexte(sv, ui)).forEach((n) => refsAll.add(n)));
  const hatText = svs.some((sv) => svTexte(sv, ui).trim());
  const istFinal = holeWert(d, ui.rollen.status_feld) === ui.rollen.status_final;

  if (!quellenText.trim()) {
    if (refsAll.size) out.push({ stufe: "warnung", text: "Der Text verweist auf Quellen ([Q…]), das Quellenverzeichnis ist aber leer." });
    else if (hatText && istFinal) out.push({ stufe: "warnung", text: "Keine Quellen angegeben. Belege im Quellenverzeichnis führen." });
  } else if (!entries.length) {
    // Mit Verweisen im Text ist das eine Warnung: Ob [Q…] belegt ist, lässt sich nicht prüfen (keine stille Entwarnung)
    if (refsAll.size)
      out.push({
        stufe: "warnung",
        text: `Verweise ${[...refsAll]
          .sort((a, b) => a - b)
          .slice(0, 5)
          .map((n) => `[Q${n}]`)
          .join(", ")}${refsAll.size > 5 ? " …" : ""} nicht prüfbar: Das Quellenverzeichnis enthält keine Einträge im Format „[Q1] A – …“.`,
      });
    else out.push({ stufe: "hinweis", text: "Das Quellenverzeichnis enthält keine Einträge im Format „[Q1] A – …“; Verweise im Text sind so nicht prüfbar." });
  }
  [...refsAll]
    .sort((a, b) => a - b)
    .forEach((n) => {
      if (entries.length && !nrs.has(n)) out.push({ stufe: "warnung", text: `[Q${n}] wird im Text zitiert, fehlt aber im Quellenverzeichnis.` });
    });
  const gesehen = new Set<number>();
  entries.forEach((e) => {
    if (gesehen.has(e.nr)) out.push({ stufe: "warnung", text: `[Q${e.nr}] ist mehrfach vergeben.` });
    gesehen.add(e.nr);
    if (alt[e.code]) out.push({ stufe: "warnung", text: `[Q${e.nr}]: Kategorie „${e.code}“ (alt) – jetzt „${alt[e.code]}“.` });
    else if (Object.keys(kategorien).length && !kategorien[e.code])
      out.push({
        stufe: "warnung",
        text: `[Q${e.nr}]: Kategorie fehlt oder ungültig (${kategorienGeordnet(ui)
          .map(([c]) => c)
          .join(", ")}).`,
      });
    if (!/(Zugriff|Abruf)/i.test(e.text)) out.push({ stufe: "hinweis", text: `[Q${e.nr}]: Zugriffsdatum fehlt („[Zugriff: TT.MM.JJJJ]“).` });
    if (refsAll.size && !refsAll.has(e.nr)) out.push({ stufe: "hinweis", text: `[Q${e.nr}] wird im Text nicht zitiert.` });
  });
  const altZeilen = altQuellenZeilen(d, ui);
  if (altZeilen.length) {
    const nummern = [...new Set(altZeilen.map((x) => x.sv + 1))].join(", ");
    out.push({ stufe: "warnung", text: `Quellenzeilen in Analysefeldern (Sachverhalt ${nummern}) – ins Quellenverzeichnis verschieben.` });
  }
  return out;
}

/** Nächster freier Eintrag nach der Vorlage des Profils. */
export function neuerQuellenEintrag(quellenText: string, ui: UiKonfig, heute: string): string {
  const nrs = parseQuellen(quellenText).map((e) => e.nr);
  const n = nrs.length ? Math.max(...nrs) + 1 : 1;
  const vorlage = ui.quellen?.vorlage || "[Q{n}] A – Herausgeber (Datum): Titel [Zugriff: {heute}]";
  return vorlage.replace("{n}", String(n)).replace("{heute}", heute);
}

// ── Baukasten für neue Quellenzeilen ─────────────────────────────────────────
// Kategorie (aus dem Profil) + Art der Quelle + Zusätze ergeben eine Zeile im Format der Profilvorlage
// „[Qn] K – Herausgeber (Datum): Titel …“. Platzhalter sind Wörter, die nach dem Einfügen markiert und überschrieben werden.

export interface QuellenArt {
  id: string;
  name: string;
  /** Vorgeschlagene Kategorie (wird nur übernommen, wenn das Profil sie kennt) */
  kategorie?: string;
  /** Rumpf ohne „[Qn] K – “; {heute} = Zugriffsdatum */
  rumpf: string;
}

export const QUELLEN_ARTEN: QuellenArt[] = [
  { id: "url", name: "Online-Quelle (URL)", rumpf: "Herausgeber (Datum): Titel. Online abrufbar unter: URL [Zugriff: {heute}]" },
  {
    id: "pressemitteilung",
    name: "Pressemitteilung",
    kategorie: "A",
    rumpf: "Herausgeber (Datum): Pressemitteilung „Titel“. Online abrufbar unter: URL [Zugriff: {heute}]",
  },
  {
    id: "lagebild",
    name: "Lagebild/Lagebericht",
    kategorie: "A",
    rumpf: "Herausgeber (Datum, Uhrzeit): Lagebild „Bezeichnung“, Ausgabe Nr. (behördenintern) [Zugriff: {heute}]",
  },
  { id: "lagemeldung", name: "Meldung aus dem Lagebild", kategorie: "A", rumpf: "Stelle (Datum, Uhrzeit): Lagemeldung (behördenintern) [Zugriff: {heute}]" },
  {
    id: "datensatz",
    name: "Datensatz/Dashboard",
    rumpf: "Herausgeber (Datum): Titel (Datensatz). Online abrufbar unter: URL [Zugriff: {heute}] · Datenstand: TT.MM.JJJJ",
  },
  {
    id: "social",
    name: "Beitrag in sozialen Medien",
    kategorie: "P",
    rumpf: "Konto (@Kennung) (Datum, Uhrzeit): Beitrag auf Plattform. Online abrufbar unter: URL [Zugriff: {heute}]",
  },
  {
    id: "auskunft",
    name: "Auskunft (Telefon, E-Mail)",
    kategorie: "B",
    rumpf: "Stelle, Funktion (Datum, Uhrzeit): Auskunft per Telefon bzw. E-Mail zu Gegenstand (nicht öffentlich)",
  },
  { id: "dokument", name: "Dokument ohne URL", kategorie: "W", rumpf: "Herausgeber (Jahr): Titel. Verlag bzw. Reihe" },
];

/** Wörter, die beim Einfügen als Platzhalter markiert werden (in dieser Reihenfolge gesucht) */
export const QUELLEN_PLATZHALTER = [
  "Herausgeber",
  "Stelle, Funktion",
  "Stelle",
  "Konto",
  "Datum",
  "Uhrzeit",
  "Titel",
  "Bezeichnung",
  "Gegenstand",
  "Plattform",
  "URL",
  "TT.MM.JJJJ",
];

export interface QuellenZusaetze {
  datenstand?: boolean;
  paywall?: boolean;
  nichtAusgewertet?: boolean;
}

/** Nächste freie Quellennummer */
export function naechsteQuellenNr(quellenText: string): number {
  const nrs = parseQuellen(quellenText).map((e) => e.nr);
  return nrs.length ? Math.max(...nrs) + 1 : 1;
}

/**
 * Baut eine Quellenzeile. Ohne Art („profil“) gilt die Vorlage des Profils; eine gewählte Kategorie ersetzt dort
 * die Kategorie der Vorlage. `rumpf` ersetzt den Rumpf der Art (z. B. für eine konkrete Lagemeldung).
 */
export function quellenZeile(
  o: { nr: number; kategorie?: string; art?: string; rumpf?: string; zusaetze?: QuellenZusaetze; heute: string },
  ui: UiKonfig,
): string {
  const kategorien = ui.quellen?.kategorien || {};
  const k = o.kategorie && o.kategorie in kategorien ? o.kategorie : "";
  const art = QUELLEN_ARTEN.find((a) => a.id === o.art);
  let zeile: string;
  if (!art && !o.rumpf) {
    const vorlage = ui.quellen?.vorlage || "[Q{n}] A – Herausgeber (Datum): Titel [Zugriff: {heute}]";
    zeile = vorlage.replace("{n}", String(o.nr)).replace("{heute}", o.heute);
    if (k) zeile = zeile.replace(/^(\[Q\d+\]\s*)[A-Z](?=\s*[–\-·:|])/, `$1${k}`);
  } else {
    const rumpf = (o.rumpf ?? art!.rumpf).replace("{heute}", o.heute);
    zeile = `[Q${o.nr}] ${k ? `${k} – ` : ""}${rumpf}`;
  }
  const z = o.zusaetze || {};
  if (z.paywall) zeile = /\bURL\b/.test(zeile) ? zeile.replace(/\bURL\b/, "URL (Paywall)") : `${zeile} (Paywall)`;
  if (z.datenstand && !/Datenstand:/.test(zeile)) zeile += " · Datenstand: TT.MM.JJJJ";
  if (z.nichtAusgewertet) zeile += " · nicht ausgewertet";
  return zeile;
}

/** Kategorie, die eine Art vorschlägt, sofern das Profil sie kennt */
export function vorgeschlageneKategorie(artId: string, ui: UiKonfig): string | undefined {
  const k = QUELLEN_ARTEN.find((a) => a.id === artId)?.kategorie;
  return k && k in (ui.quellen?.kategorien || {}) ? k : undefined;
}

/** Erste Platzhalterstelle in einer Zeile: [Anfang, Ende] relativ zur Zeile oder null */
export function erstePlatzhalterstelle(zeile: string): [number, number] | null {
  const kopf = zeile.match(/^\[Q\d+\]\s*(?:[A-Z]\s*–\s*)?/)?.[0] ?? "";
  const rest = zeile.slice(kopf.length);
  let best: [number, number] | null = null;
  for (const p of QUELLEN_PLATZHALTER) {
    const muster = new RegExp(`(?<=^|[\\s(„])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[\\s).,:“])`);
    const i = rest.search(muster);
    if (i >= 0 && (!best || kopf.length + i < best[0])) best = [kopf.length + i, kopf.length + i + p.length];
  }
  return best;
}
