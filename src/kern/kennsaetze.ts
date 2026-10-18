// Kennsätze (SOP-LEAD A.4) und unverbindliche Ausfüllhinweise (A.4/A.5/A.8).

import { holeWert } from "./pfad";
import { quellenHinweise, sachverhalte } from "./quellen";
import { feldUi } from "./ui";
import type { Befund, Meldung, UiKonfig } from "./typen";

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
