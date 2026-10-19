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
      const a = +r[1];
      const b = r[2] ? +r[2] : a;
      for (let i = Math.min(a, b); i <= Math.max(a, b) && i - a < 50; i++) refs.add(i);
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
    out.push({ stufe: "hinweis", text: "Das Quellenverzeichnis enthält keine Einträge im Format „[Q1] A – …“; Verweise im Text sind so nicht prüfbar." });
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
