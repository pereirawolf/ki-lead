// Redaktionscheck für das Lagebild: wertet vorhandene Felder und Kennsätze aus (SOP-LEAD A.3/A.4/A.7/A.8).
// Er ersetzt nicht die fachliche Prüfung: Gleiche Ereignisart heißt nicht gleicher Sachverhalt, und die Zahl
// der Meldungen belegt keine Verschärfung.

import { kennsatz, kennsaetzeAlle, parseDatumDE } from "../kern/kennsaetze";
import { holeWert } from "../kern/pfad";
import { quellenHinweise } from "../kern/quellen";
import { bezeichnung } from "../kern/ui";
import type { Profil } from "../kern/typen";
import { absender, alleSachverhalte, mehrfachMeldungen, statusVon, type LagebildEintrag, type SvEintrag } from "./lagebild";

export type Klasse = "ok" | "warn" | "alert" | "info";

export interface Zeitfenster {
  sv: SvEintrag;
  text: string;
  datum: Date | null;
  status: string;
  klasse: Klasse;
}

export interface ArtGruppe {
  art: string;
  liste: SvEintrag[];
  meldungen: number;
  abweichend: boolean;
  tendenzAbweichend: boolean;
  baustein?: string;
}

export interface QuellenBefund {
  eintrag: LagebildEintrag;
  zeilen: string[];
  schema: number;
  quellen: number;
  klasse: Klasse;
}

export interface Redaktion {
  zeit: Zeitfenster[];
  gruppen: ArtGruppe[];
  vermerkt: { sv: SvEintrag; text: string }[];
  nachlauf: SvEintrag[];
  abschluss: { sv: SvEintrag; text: string; rueckblick: boolean }[];
  aenderung: { sv: SvEintrag; text: string }[];
  mehrfach: { stelle: string; eintraege: LagebildEintrag[] }[];
  kern: { sv: SvEintrag; fehlt: string[] }[];
  quellen: QuellenBefund[];
  anzahl: number;
}

/** Textbaustein nach A.7.2: Bewertungen nebeneinander, mit Urheber und Platz für den tragenden Grund. */
export function abweichungsBaustein(liste: SvEintrag[], profil: Profil): string {
  const prefix = profil.ui.kennsaetze?.abweichung || "Abweichende Bewertung:";
  const teile = liste.filter((s) => s.beurteilung).map((s) => `${absender(s.eintrag, profil)} „${s.beurteilung}“ – [tragender Grund]`);
  return `${prefix} ${teile.join("; ")}. Ursache: [Bezugsraum / Datenstand / Zielzustand / Maßstab]. Klärend wäre: [Information].`;
}

export function redaktionscheck(eintraege: LagebildEintrag[], profil: Profil, naechsteAusgabe: Date, jetzt = new Date()): Redaktion {
  const ui = profil.ui;
  const r = ui.rollen;
  const ks = ui.kennsaetze || {};
  const svs = alleSachverhalte(eintraege, profil);
  const hoch = new Set(r.beurteilung_hoch || []);

  // 1) Zeitfenster „Handlungsrelevant bis“ (A.5 Nr. 2, A.7.3)
  const zeit: Zeitfenster[] = [];
  if (ks.handlungsrelevant) {
    // Jede Kennsatzzeile zählt einzeln, wie in der Kurzfassung (fristen): eine zweite, frühere Frist
    // desselben Sachverhalts darf nicht hinter der ersten verschwinden.
    for (const sv of svs)
      for (const t of kennsaetzeAlle(sv.bewertungText, ks.handlungsrelevant)) {
        const datum = parseDatumDE(t);
        let status: string;
        let klasse: Klasse;
        if (!datum) [status, klasse] = ["Datum nicht erkennbar (TT.MM.JJJJ)", "warn"];
        else if (datum < jetzt) [status, klasse] = ["Zeitfenster abgelaufen – Aktualität prüfen", "warn"];
        else if (datum < naechsteAusgabe) [status, klasse] = ["vor der nächsten Ausgabe – frühere Weitergabe prüfen", "alert"];
        else [status, klasse] = ["nach der nächsten Ausgabe – keine Sonderweitergabe nötig", "ok"];
        zeit.push({ sv, text: t, datum, status, klasse });
      }
    zeit.sort((a, b) => (a.datum?.getTime() ?? 0) - (b.datum?.getTime() ?? 0));
  }

  // 2) Zusammenhang und abweichende Bewertungen (A.7.1, A.7.2)
  const nachArt = new Map<string, SvEintrag[]>();
  for (const sv of svs) for (const a of sv.arten) nachArt.set(a, [...(nachArt.get(a) || []), sv]);
  const gruppen: ArtGruppe[] = [...nachArt.entries()]
    .map(([art, liste]) => {
      const meldungen = new Set(liste.map((s) => s.eintrag.id)).size;
      const abweichend = new Set(liste.map((s) => s.beurteilung).filter(Boolean)).size > 1;
      const tendenzAbweichend = new Set(liste.map((s) => s.tendenz).filter(Boolean)).size > 1;
      return { art, liste, meldungen, abweichend, tendenzAbweichend, baustein: abweichend ? abweichungsBaustein(liste, profil) : undefined };
    })
    .filter((g) => g.meldungen > 1)
    .sort((a, b) => Number(b.abweichend) - Number(a.abweichend) || b.liste.length - a.liste.length);
  const vermerkt = ks.abweichung
    ? svs.map((sv) => ({ sv, text: kennsatz(sv.bewertungText, ks.abweichung) })).filter((x): x is { sv: SvEintrag; text: string } => x.text !== null)
    : [];

  // 3) Fortschreibung, Nachlauf und Abschluss (A.8.1, A.8.2)
  const nachlauf: SvEintrag[] = [];
  const abschluss: Redaktion["abschluss"] = [];
  const aenderung: Redaktion["aenderung"] = [];
  for (const sv of svs) {
    const abs = ks.abschluss ? kennsatz(sv.bewertungText, ks.abschluss) : null;
    const aen = ks.aenderung ? kennsatz(sv.bewertungText, ks.aenderung) : null;
    if (abs !== null) abschluss.push({ sv, text: abs, rueckblick: hoch.has(sv.beurteilung) });
    else if (r.tendenz_entspannung && sv.tendenz === r.tendenz_entspannung) nachlauf.push(sv);
    if (aen !== null) aenderung.push({ sv, text: aen });
  }
  const mehrfach = mehrfachMeldungen(eintraege, profil);

  // 4) Kernaussage und Anschlussfähigkeit bei hohen Beurteilungen (A.4, A.5)
  const kern: Redaktion["kern"] = [];
  const massnahmenLabel = r.sv_massnahmen ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_massnahmen}`) : "";
  for (const sv of svs) {
    if (!hoch.has(sv.beurteilung)) continue;
    if (ks.abschluss && kennsatz(sv.bewertungText, ks.abschluss) !== null) continue;
    const fehlt: string[] = [];
    if (r.sv_bewertung_text && !sv.bewertungText.trim()) fehlt.push("kein Bewertungstext");
    else if (ks.neubewertung && kennsatz(sv.bewertungText, ks.neubewertung) === null) fehlt.push(`kein Kennsatz „${ks.neubewertung}“`);
    if (r.sv_massnahmen && !String(holeWert(sv.sv, r.sv_massnahmen) || "").trim()) fehlt.push(`keine Angaben in „${massnahmenLabel}“`);
    if (fehlt.length) kern.push({ sv, fehlt });
  }

  // 5) Quellen, Schema und Status (A.3, A.4)
  const quellen: QuellenBefund[] = [];
  for (const e of eintraege) {
    if (e.fremd) {
      quellen.push({
        eintrag: e,
        zeilen: [`Fremdes Schema „${e.herkunft}“: nicht in den Auswertungen enthalten, aber an die KI-Verdichtung übergebbar.`],
        schema: 0,
        quellen: 0,
        klasse: "info",
      });
      continue;
    }
    const q = quellenHinweise(e.daten, ui).filter((h) => h.stufe !== "hinweis");
    const zeilen = [
      ...e.hinweise,
      ...(statusVon(e, profil) === r.status_entwurf ? [`Status „${r.status_entwurf}“: Die Meldung ist nicht als final gekennzeichnet.`] : []),
      ...e.schema.slice(0, 8).map((b) => `Schema: ${b.text}`),
      ...(e.schema.length > 8 ? [`Schema: … und ${e.schema.length - 8} weitere`] : []),
      ...q.map((h) => `Quellen: ${h.text}`),
    ];
    if (zeilen.length) quellen.push({ eintrag: e, zeilen, schema: e.schema.length, quellen: q.length, klasse: e.schema.length ? "alert" : "warn" });
  }

  const anzahl =
    quellen.filter((q) => q.klasse !== "info").length +
    zeit.filter((z) => z.klasse !== "ok").length +
    gruppen.filter((g) => g.abweichend).length +
    nachlauf.length +
    mehrfach.length +
    kern.length;

  return { zeit, gruppen, vermerkt, nachlauf, abschluss, aenderung, mehrfach, kern, quellen, anzahl };
}
