// Redaktionscheck für das Lagebild: wertet vorhandene Felder und Kennsätze aus (SOP-LEAD A.3/A.4/A.7/A.8).
// Er ersetzt nicht die fachliche Prüfung: Gleiche Ereignisart heißt nicht gleicher Sachverhalt, und die Zahl
// der Meldungen belegt keine Verschärfung. Ein Abschnitt ohne Befund heißt nur, dass die automatischen Regeln
// dieses Abschnitts nichts gefunden haben; nicht konfigurierte Regeln weist die Abdeckung aus.

import { kennsatz, kennsaetzeAlle, leseFrist } from "../kern/kennsaetze";
import { offenePlatzhalter } from "../kern/feldhilfen";
import { holeWert } from "../kern/pfad";
import { quellenHinweise } from "../kern/quellen";
import { bezeichnung } from "../kern/ui";
import { datumDE } from "../kern/ausgabe";
import { isoLokalZuZeitpunkt, tagInZone, zeitpunktDE, zeitpunktInZone, zoneOder } from "../kern/zeit";
import type { Profil } from "../kern/typen";
import {
  absender,
  alleSachverhalte,
  hochStufen,
  mehrfachMeldungen,
  statusVon,
  svKennung,
  verschaerfungsWert,
  zeitpunktVon,
  type LagebildEintrag,
  type SvEintrag,
} from "./lagebild";

/** Einstufung: alert = zeitkritisch, warn = zu klären, info = Information, ok = ohne Befund */
export type Klasse = "ok" | "warn" | "alert" | "info";

export interface Zeitfenster {
  sv: SvEintrag;
  text: string;
  datum: Date | null;
  /** „minute“ mit Uhrzeit, „tag“ ohne (Tagesende angenommen) */
  genauigkeit: "minute" | "tag";
  /** Hinweis zur Lesart der Zeitangabe */
  hinweis?: string;
  status: string;
  klasse: Klasse;
}

export interface ArtGruppe {
  art: string;
  liste: SvEintrag[];
  meldungen: number;
  /** Beurteilungen unterscheiden sich */
  abweichend: boolean;
  /** Tendenzen unterscheiden sich (z. B. Stabilisierung und Verschärfung) */
  tendenzAbweichend: boolean;
  /** Tendenzen sind gegenläufig: Entspannung und Verschärfung zugleich */
  tendenzGegenlaeufig: boolean;
  baustein?: string;
}

export interface QuellenBefund {
  eintrag: LagebildEintrag;
  zeilen: string[];
  schema: number;
  quellen: number;
  klasse: Klasse;
}

/** Ein Kennsatz, der vorhanden, aber leer oder ausdrücklich offen ist */
export interface MarkerBefund {
  sv: SvEintrag;
  kennsatz: string;
  art: "leer" | "offen";
  text: string;
}

export interface Pruefstand {
  /** Zeitpunkt, auf den sich Fristen beziehen */
  jetzt: Date;
  /** Beginn der nächsten Ausgabe; ohne Uhrzeit der Tagesbeginn */
  /** null, wenn die Angabe nicht lesbar ist */
  ausgabe: Date | null;
  ausgabeMitUhrzeit: boolean;
  zeitzone: string;
}

export interface Abdeckung {
  /** Meldungen nach dem Schema des Profils (ausgewertet) */
  meldungen: number;
  /** Meldungen fremder Schemata (nicht ausgewertet) */
  fremd: number;
  /** Regeln, die mangels Profilangabe nicht laufen */
  nichtKonfiguriert: string[];
  /** Hinweise zur Lesart, z. B. aus dem Schema abgeleitete Schwelle */
  hinweise: string[];
}

export interface Redaktion {
  stand: Pruefstand;
  zeit: Zeitfenster[];
  gruppen: ArtGruppe[];
  vermerkt: { sv: SvEintrag; text: string }[];
  nachlauf: SvEintrag[];
  abschluss: { sv: SvEintrag; text: string; rueckblick: boolean }[];
  aenderung: { sv: SvEintrag; text: string }[];
  marker: MarkerBefund[];
  mehrfach: { stelle: string; eintraege: LagebildEintrag[] }[];
  kern: { sv: SvEintrag; fehlt: string[] }[];
  /** Für Abschnitt 4 verwendete hohe Beurteilungen */
  hoch: { stufen: string[]; abgeleitet: boolean };
  quellen: QuellenBefund[];
  abdeckung: Abdeckung;
  /** Befunde je Einstufung; zeitkritisch und zu klären bilden die Anzahl */
  uebersicht: { zeitkritisch: number; zuKlaeren: number; info: number };
  /** Befunde je Abschnitt 1–5 (zeitkritisch und zu klären) */
  abschnitte: [number, number, number, number, number];
  /** Zahl der zu bearbeitenden Befunde (zeitkritisch + zu klären) */
  anzahl: number;
}

/** Kurze Antworten, die keinen Abschluss aussagen („Abschluss im Lagebild: nein“) */
const OFFEN = /^(nein|offen|noch offen|noch nicht|nicht abgeschlossen|nicht beendet|kein abschluss|unklar|ausstehend|tbd|k\.\s?a\.|\?|–|-)(?=$|[\s.,;:!?)])/i;

/** Textbaustein nach A.7.2: Bewertungen nebeneinander, mit Urheber, Sachverhalt, Stand und Platz für den tragenden Grund. */
export function abweichungsBaustein(liste: SvEintrag[], profil: Profil): string {
  const prefix = profil.ui.kennsaetze?.abweichung || "Abweichende Bewertung:";
  const teile = liste
    .filter((s) => s.beurteilung)
    .map((s) => {
      const stand = datumDE(zeitpunktVon(s.eintrag, profil));
      return `${absender(s.eintrag, profil)} (${s.bezeichnung || "ohne Bezeichnung"}${stand ? `, Stand ${stand}` : ""}) „${s.beurteilung}“ – [tragender Grund]`;
    });
  return `${prefix} ${teile.join("; ")}. Ursache: [Bezugsraum / Datenstand / Zielzustand / Maßstab]. Klärend wäre: [Information].`;
}

/**
 * Nächste Ausgabe als „JJJJ-MM-TT“ oder „JJJJ-MM-TTThh:mm“ (Wanduhrzeit der Profilzeitzone) oder als Zeitpunkt.
 * Ohne Uhrzeit reicht der Ausgabetag von beginn bis ende.
 */
function ausgabeAufloesen(a: string | Date, zone: string): { beginn: Date; ende: Date; mitUhrzeit: boolean } | null {
  if (a instanceof Date) return isNaN(a.getTime()) ? null : { beginn: a, ende: a, mitUhrzeit: true };
  const z = isoLokalZuZeitpunkt(a, zone);
  // Nicht lesbare Ausgabe: keine Ersatzzeit, sonst gälte jede künftige Frist still als unkritisch
  if (!z) return null;
  if (z.mitUhrzeit) return { beginn: z.datum, ende: z.datum, mitUhrzeit: true };
  const [j, m, t] = a.slice(0, 10).split("-").map(Number) as [number, number, number];
  return { beginn: z.datum, ende: zeitpunktInZone(j, m, t + 1, 0, 0, zone), mitUhrzeit: false };
}

/** Einstufung einer Frist gegen Prüfzeitpunkt und nächste Ausgabe. */
function fristEinstufen(
  datum: Date | null,
  genauigkeit: "minute" | "tag",
  jetzt: Date,
  aus: { beginn: Date; ende: Date; mitUhrzeit: boolean } | null,
  zone: string,
): [string, Klasse] {
  if (!datum) return ["Datum nicht erkennbar (TT.MM.JJJJ)", "warn"];
  const t = datum.getTime();
  if (t <= jetzt.getTime()) return ["Zeitfenster abgelaufen – Aktualität prüfen", "warn"];
  if (!aus) return ["nächste Ausgabe nicht lesbar – Einstufung offen", "warn"];
  if (t < aus.beginn.getTime()) return ["vor der nächsten Ausgabe – frühere Weitergabe prüfen", "alert"];
  if (aus.mitUhrzeit && t === aus.beginn.getTime()) return ["zeitgleich mit der nächsten Ausgabe – Weitergabe vorher prüfen", "alert"];
  if (!aus.mitUhrzeit && t < aus.ende.getTime()) return ["am Tag der nächsten Ausgabe; deren Uhrzeit ist nicht angegeben – Reihenfolge klären", "warn"];
  if (genauigkeit === "tag" && tagInZone(datum, zone) === tagInZone(aus.beginn, zone))
    return ["am Tag der nächsten Ausgabe, Frist ohne Uhrzeit – Reihenfolge klären", "warn"];
  return ["nach der nächsten Ausgabe – aus dieser Frist kein Anlass für eine frühere Weitergabe", "ok"];
}

/**
 * Redaktionscheck. naechsteAusgabe als „JJJJ-MM-TT[Thh:mm]“ in der Zeitzone des Profils (oder als Zeitpunkt),
 * jetzt ist der Prüfzeitpunkt (Echtzeit oder ausdrücklich gewählter Stichtag).
 */
export function redaktionscheck(eintraege: LagebildEintrag[], profil: Profil, naechsteAusgabe: string | Date, jetzt = new Date()): Redaktion {
  const ui = profil.ui;
  const r = ui.rollen;
  const ks = ui.kennsaetze || {};
  const zone = zoneOder(profil.manifest.variablen?.zeitzone);
  const aus = ausgabeAufloesen(naechsteAusgabe, zone);
  const svs = alleSachverhalte(eintraege, profil);
  const hoch = hochStufen(profil);
  const hochSet = new Set(hoch.stufen);
  const marker: MarkerBefund[] = [];

  // 1) Zeitfenster „Handlungsrelevant bis“ (A.5 Nr. 2, A.7.3). Jede Kennsatzzeile zählt einzeln.
  const zeit: Zeitfenster[] = [];
  if (ks.handlungsrelevant) {
    for (const sv of svs)
      for (const t of kennsaetzeAlle(sv.bewertungText, ks.handlungsrelevant)) {
        const f = leseFrist(t, zone);
        const [status, klasse] = fristEinstufen(f.datum, f.genauigkeit, jetzt, aus, zone);
        // Aus einer Vorlage mit noch offenen Stellen ⟦…⟧: als unvollständig kennzeichnen
        const offen = offenePlatzhalter(t).length ? "offene Vorlagenstellen ⟦…⟧ – Angaben unvollständig, bitte ausfüllen oder streichen" : "";
        const hinweis = [f.hinweis, offen].filter(Boolean).join("; ");
        zeit.push({ sv, text: t, datum: f.datum, genauigkeit: f.genauigkeit, ...(hinweis ? { hinweis } : {}), status, klasse });
      }
    // Nicht lesbare Fristen zuerst (sie brauchen Klärung), danach zeitlich
    zeit.sort((a, b) => (a.datum?.getTime() ?? -Infinity) - (b.datum?.getTime() ?? -Infinity));
  }

  // 2) Zusammenhang und abweichende Bewertungen (A.7.1, A.7.2)
  const entspannung = r.tendenz_entspannung;
  const verschaerfung = verschaerfungsWert(profil);
  const nachArt = new Map<string, SvEintrag[]>();
  for (const sv of svs) for (const a of sv.arten) nachArt.set(a, [...(nachArt.get(a) || []), sv]);
  const gruppen: ArtGruppe[] = [...nachArt.entries()]
    .map(([art, liste]) => {
      const meldungen = new Set(liste.map((s) => s.eintrag.id)).size;
      const abweichend = new Set(liste.map((s) => s.beurteilung).filter(Boolean)).size > 1;
      const tendenzen = new Set(liste.map((s) => s.tendenz).filter(Boolean));
      const tendenzGegenlaeufig = !!entspannung && !!verschaerfung && tendenzen.has(entspannung) && tendenzen.has(verschaerfung);
      return {
        art,
        liste,
        meldungen,
        abweichend,
        tendenzAbweichend: tendenzen.size > 1,
        tendenzGegenlaeufig,
        baustein: abweichend ? abweichungsBaustein(liste, profil) : undefined,
      };
    })
    .filter((g) => g.meldungen > 1)
    .sort(
      (a, b) =>
        Number(b.abweichend || b.tendenzGegenlaeufig) - Number(a.abweichend || a.tendenzGegenlaeufig) ||
        b.liste.length - a.liste.length ||
        a.art.localeCompare(b.art, "de"),
    );
  const vermerkt: Redaktion["vermerkt"] = [];
  if (ks.abweichung)
    for (const sv of svs) {
      const t = kennsatz(sv.bewertungText, ks.abweichung);
      if (t === null) continue;
      if (offenePlatzhalter(t).length) marker.push({ sv, kennsatz: ks.abweichung, art: "offen", text: "offene Vorlagenstellen ⟦…⟧ – noch kein Vermerk" });
      else if (t) vermerkt.push({ sv, text: t });
      else marker.push({ sv, kennsatz: ks.abweichung, art: "leer", text: "Kennsatz ohne Inhalt" });
    }

  // 3) Fortschreibung, Nachlauf und Abschluss (A.8.1, A.8.2). Ein leerer oder offener Abschlusskennsatz ist kein Abschluss.
  const nachlauf: SvEintrag[] = [];
  const abschluss: Redaktion["abschluss"] = [];
  const aenderung: Redaktion["aenderung"] = [];
  /** Sachverhalte mit Abschlusskennsatz (auch leer/offen): Die Nachlauffrage steckt dann im Befund dazu */
  const abschlussZeile = new Set<SvEintrag>();
  /** Sachverhalte mit inhaltlichem Abschluss: keine Vollständigkeitsprüfung mehr */
  const abgeschlossen = new Set<SvEintrag>();
  for (const sv of svs) {
    const abs = ks.abschluss ? kennsatz(sv.bewertungText, ks.abschluss) : null;
    if (abs !== null && ks.abschluss) {
      // Bei Tendenz Entspannung schließt der Markerbefund die Nachlauffrage ein (ein Befund, nicht zwei)
      const nachlaufZusatz = entspannung && sv.tendenz === entspannung ? `; Tendenz „${entspannung}“ – Nachlauf prüfen` : "";
      if (!abs) marker.push({ sv, kennsatz: ks.abschluss, art: "leer", text: `Abschlusskennsatz ohne Inhalt – kein Abschluss erkennbar${nachlaufZusatz}` });
      else if (OFFEN.test(abs)) marker.push({ sv, kennsatz: ks.abschluss, art: "offen", text: `„${abs}“ – kein Abschluss ausgesagt${nachlaufZusatz}` });
      // Vorlage aus dem Baukasten, noch nicht ausgefüllt: kein Abschluss
      else if (offenePlatzhalter(abs).length)
        marker.push({ sv, kennsatz: ks.abschluss, art: "offen", text: `offene Vorlagenstellen ⟦…⟧ – kein Abschluss ausgesagt${nachlaufZusatz}` });
      else {
        abschluss.push({ sv, text: abs, rueckblick: hochSet.has(sv.beurteilung) });
        abgeschlossen.add(sv);
      }
      abschlussZeile.add(sv);
    }
    if (!abschlussZeile.has(sv) && entspannung && sv.tendenz === entspannung) nachlauf.push(sv);
    const aen = ks.aenderung ? kennsatz(sv.bewertungText, ks.aenderung) : null;
    if (aen !== null && ks.aenderung) {
      if (offenePlatzhalter(aen).length)
        marker.push({ sv, kennsatz: ks.aenderung, art: "offen", text: "offene Vorlagenstellen ⟦…⟧ – noch keine Änderung vermerkt" });
      else if (aen) aenderung.push({ sv, text: aen });
      else marker.push({ sv, kennsatz: ks.aenderung, art: "leer", text: "Kennsatz ohne Inhalt" });
    }
  }
  const mehrfach = mehrfachMeldungen(eintraege, profil);

  // 4) Formale Vollständigkeit bei hoher Beurteilung (A.4, A.5): Bewertungstext, Neubewertung, Maßnahmen
  const kern: Redaktion["kern"] = [];
  const massnahmenLabel = r.sv_massnahmen ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_massnahmen}`) : "";
  for (const sv of svs) {
    if (!hochSet.has(sv.beurteilung) || abgeschlossen.has(sv)) continue;
    const fehlt: string[] = [];
    if (r.sv_bewertung_text && !sv.bewertungText.trim()) fehlt.push("kein Bewertungstext");
    else if (ks.neubewertung) {
      const nb = kennsatz(sv.bewertungText, ks.neubewertung);
      if (nb === null) fehlt.push(`kein Kennsatz „${ks.neubewertung}“`);
      else if (!nb) fehlt.push(`Kennsatz „${ks.neubewertung}“ ohne Inhalt`);
      else if (offenePlatzhalter(nb).length) fehlt.push(`Kennsatz „${ks.neubewertung}“ mit offenen Vorlagenstellen`);
    }
    if (r.sv_massnahmen && !String(holeWert(sv.sv, r.sv_massnahmen) || "").trim()) fehlt.push(`keine Angaben in „${massnahmenLabel}“`);
    if (fehlt.length) kern.push({ sv, fehlt });
  }

  // 5) Quellen, Schema und Status (A.3, A.4). Hinweise der Quellenprüfung bleiben nachrangig; nicht prüfbare
  // Verweise meldet die Quellenprüfung selbst als Warnung.
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
      ...e.schema.map((b) => `Schema: ${b.text}`),
      ...q.map((h) => `Quellen: ${h.text}`),
    ];
    if (zeilen.length) quellen.push({ eintrag: e, zeilen, schema: e.schema.length, quellen: q.length, klasse: e.schema.length ? "alert" : "warn" });
  }

  // Abdeckung: welche Regeln mangels Profilangabe nicht laufen
  const nichtKonfiguriert: string[] = [];
  if (!ks.handlungsrelevant) nichtKonfiguriert.push("Zeitfenster: kein Kennsatz „Handlungsrelevant bis“ im Profil");
  else if (!aus) nichtKonfiguriert.push("Zeitfenster: nächste Ausgabe nicht lesbar – Fristen nur gegen den Prüfzeitpunkt eingestuft");
  if (!r.sv_beurteilung) nichtKonfiguriert.push("Abweichende Bewertungen: keine Beurteilung im Profil");
  if (!ks.abschluss) nichtKonfiguriert.push("Abschluss: kein Abschlusskennsatz im Profil");
  if (!entspannung) nichtKonfiguriert.push("Nachlauf: keine Tendenz „Entspannung“ im Profil");
  if (!hoch.stufen.length) nichtKonfiguriert.push("Formale Vollständigkeit: keine hohen Beurteilungsstufen bestimmbar");
  else if (!r.sv_bewertung_text && !ks.neubewertung && !r.sv_massnahmen)
    nichtKonfiguriert.push("Formale Vollständigkeit: weder Bewertungstext, Neubewertung noch Maßnahmen im Profil");
  if (!r.quellen) nichtKonfiguriert.push("Quellen: kein Quellenverzeichnis im Profil");
  const hinweise: string[] = [];
  if (hoch.abgeleitet && hoch.stufen.length)
    hinweise.push(`Hohe Beurteilung aus dem Schema abgeleitet (${hoch.stufen.map((s) => `„${s}“`).join(", ")}); das Profil nennt keine „beurteilung_hoch“.`);
  const abdeckung: Abdeckung = {
    meldungen: eintraege.filter((e) => !e.fremd).length,
    fremd: eintraege.filter((e) => e.fremd).length,
    nichtKonfiguriert,
    hinweise,
  };

  const abschnitte: Redaktion["abschnitte"] = [
    zeit.filter((z) => z.klasse === "alert" || z.klasse === "warn").length,
    gruppen.filter((g) => g.abweichend || g.tendenzGegenlaeufig).length,
    nachlauf.length + mehrfach.length + marker.length,
    kern.length,
    quellen.filter((q) => q.klasse !== "info").length,
  ];
  const zeitkritisch = zeit.filter((z) => z.klasse === "alert").length;
  const anzahl = abschnitte.reduce((a, b) => a + b, 0);
  const info =
    gruppen.filter((g) => !g.abweichend && !g.tendenzGegenlaeufig).length +
    quellen.filter((q) => q.klasse === "info").length +
    vermerkt.length +
    aenderung.length +
    abschluss.length;

  return {
    stand: { jetzt, ausgabe: aus?.beginn ?? null, ausgabeMitUhrzeit: aus?.mitUhrzeit ?? false, zeitzone: zone },
    zeit,
    gruppen,
    vermerkt,
    nachlauf,
    abschluss,
    aenderung,
    marker,
    mehrfach,
    kern,
    hoch,
    quellen,
    abdeckung,
    uebersicht: { zeitkritisch, zuKlaeren: anzahl - zeitkritisch, info },
    abschnitte,
    anzahl,
  };
}

/** Ein einzelner Befund des Redaktionschecks (für Bericht, Zählung und Export) */
export interface Befundzeile {
  abschnitt: 1 | 2 | 3 | 4 | 5;
  klasse: Klasse;
  /** Meldung (Dateiname), auf die sich der Befund bezieht; bei Gruppen leer */
  datei?: string;
  /** Kennung der Meldung im Lagebild (Inhaltskennung) */
  meldung?: string;
  bezug: string;
  text: string;
}

export const ABSCHNITTE = [
  "Zeitfenster",
  "Zusammenhang und abweichende Bewertungen",
  "Fortschreibung, Nachlauf und Abschluss",
  "Formale Vollständigkeit bei hoher Beurteilung",
  "Quellen, Schema und Status",
] as const;

/** Alle Befunde als Zeilen; zeitkritisch und zu klären ergeben zusammen die Anzahl des Checks. */
export function befundListe(red: Redaktion, profil: Profil): Befundzeile[] {
  const ks = profil.ui.kennsaetze || {};
  const sv = (x: SvEintrag) => ({ datei: x.eintrag.name, meldung: x.eintrag.id, bezug: svKennung(x, profil) });
  const out: Befundzeile[] = [];
  for (const z of red.zeit)
    out.push({
      abschnitt: 1,
      klasse: z.klasse,
      ...sv(z.sv),
      text: `${ks.handlungsrelevant || "Handlungsrelevant bis:"} ${z.text} → ${z.status}${z.hinweis ? ` (${z.hinweis})` : ""}`,
    });
  for (const g of red.gruppen) {
    const merkmale = [
      g.abweichend ? "Bewertungen weichen ab" : "",
      g.tendenzGegenlaeufig ? "Tendenzen gegenläufig" : g.tendenzAbweichend ? "Tendenzen unterschiedlich" : "",
    ].filter(Boolean);
    out.push({
      abschnitt: 2,
      klasse: g.abweichend || g.tendenzGegenlaeufig ? "warn" : "info",
      bezug: g.art,
      text: `${g.liste.length} Sachverhalte aus ${g.meldungen} Meldungen${merkmale.length ? ` – ${merkmale.join(", ")}` : " – möglicher Zusammenhang"}: ${g.liste
        .map((s) => `${absender(s.eintrag, profil)} „${s.beurteilung || "keine Angabe"}“${s.tendenz ? `/${s.tendenz}` : ""}`)
        .join("; ")}`,
    });
  }
  for (const x of red.vermerkt) out.push({ abschnitt: 2, klasse: "info", ...sv(x.sv), text: `${ks.abweichung} ${x.text}` });
  for (const m of red.mehrfach)
    out.push({
      abschnitt: 3,
      klasse: "warn",
      bezug: m.stelle,
      text: `Mehrere Meldungen derselben Stelle: ${m.eintraege.map((e) => `${e.name} (${datumDE(zeitpunktVon(e, profil)) || "ohne Zeitpunkt"})`).join(", ")}`,
    });
  for (const x of red.marker) out.push({ abschnitt: 3, klasse: "warn", ...sv(x.sv), text: `„${x.kennsatz}“ – ${x.text}` });
  for (const x of red.nachlauf) out.push({ abschnitt: 3, klasse: "warn", ...sv(x), text: `Tendenz „${x.tendenz}“ ohne Abschlussvermerk – Nachlauf prüfen` });
  for (const x of red.abschluss)
    out.push({ abschnitt: 3, klasse: "info", ...sv(x.sv), text: `${ks.abschluss} ${x.text}${x.rueckblick ? " – Rückblick einplanen" : ""}` });
  for (const x of red.aenderung) out.push({ abschnitt: 3, klasse: "info", ...sv(x.sv), text: `${ks.aenderung} ${x.text}` });
  for (const x of red.kern) out.push({ abschnitt: 4, klasse: "warn", ...sv(x.sv), text: x.fehlt.join(" · ") });
  for (const q of red.quellen)
    out.push({
      abschnitt: 5,
      // Schemaabweichungen sind schwer, aber nicht zeitkritisch: in der Liste „zu klären“ (die Anzeige bleibt rot markiert)
      klasse: q.klasse === "info" ? "info" : "warn",
      datei: q.eintrag.name,
      meldung: q.eintrag.id,
      bezug: `${absender(q.eintrag, profil)} · ${q.eintrag.name}`,
      text: q.zeilen.join(" | "),
    });
  return out;
}

const KLASSE_TEXT: Record<Klasse, string> = { alert: "zeitkritisch", warn: "zu klären", info: "Information", ok: "ohne Befund" };

/**
 * Redaktionsbericht zum Ablegen: Prüfstand, Profil (mit Prüfsumme), berücksichtigte Meldungen (mit Inhaltskennung),
 * Abdeckung und alle Befunde. Er dokumentiert den automatischen Check, keine fachliche Freigabe.
 */
export function redaktionsbericht(red: Redaktion, eintraege: LagebildEintrag[], profil: Profil, app: string) {
  const zone = red.stand.zeitzone;
  const befunde = befundListe(red, profil);
  const daten = {
    format: "ki-lead-redaktionsbericht/1",
    app,
    profil: { id: profil.manifest.id, version: profil.manifest.version, pruefsumme: profil.hash },
    pruefstand: {
      geprueft_fuer: zeitpunktDE(red.stand.jetzt, zone),
      naechste_ausgabe: !red.stand.ausgabe
        ? "nicht lesbar"
        : red.stand.ausgabeMitUhrzeit
          ? zeitpunktDE(red.stand.ausgabe, zone)
          : `${zeitpunktDE(red.stand.ausgabe, zone).slice(0, 10)} (Uhrzeit offen)`,
      zeitzone: zone,
    },
    abdeckung: red.abdeckung,
    uebersicht: red.uebersicht,
    meldungen: eintraege.map((e) => ({
      datei: e.name,
      kennung: e.id,
      stelle: absender(e, profil),
      zeitpunkt: zeitpunktVon(e, profil),
      ausgewertet: !e.fremd,
    })),
    befunde: befunde.map((b) => ({ ...b, abschnitt: `${b.abschnitt} ${ABSCHNITTE[b.abschnitt - 1]}`, einstufung: KLASSE_TEXT[b.klasse] })),
    hinweis: "Automatischer Redaktionscheck nach Feldern und Kennsätzen. Keine fachliche Prüfung oder Freigabe.",
  };
  const z: string[] = [
    `Redaktionsbericht – ${profil.ui.lagebild?.titel || "Lagebild"}`,
    `${app} · Profil ${profil.manifest.id} ${profil.manifest.version} (Prüfsumme ${profil.hash.slice(0, 12)}…)`,
    `Geprüft für: ${daten.pruefstand.geprueft_fuer} · Nächste Ausgabe: ${daten.pruefstand.naechste_ausgabe} · Zeitzone ${zone}`,
    `Ausgewertet: ${red.abdeckung.meldungen} Meldung(en) nach Profilschema${red.abdeckung.fremd ? `; ${red.abdeckung.fremd} in fremdem Schema nicht ausgewertet` : ""}`,
    ...red.abdeckung.nichtKonfiguriert.map((x) => `Nicht geprüft: ${x}`),
    ...red.abdeckung.hinweise.map((x) => `Hinweis: ${x}`),
    `Befunde: ${red.uebersicht.zeitkritisch} zeitkritisch · ${red.uebersicht.zuKlaeren} zu klären · ${red.uebersicht.info} Information(en)`,
    "",
  ];
  ABSCHNITTE.forEach((titel, i) => {
    const liste = befunde.filter((b) => b.abschnitt === i + 1);
    z.push(`${i + 1} ${titel}`);
    if (!liste.length) z.push("  – keine Befunde der automatischen Prüfungen");
    for (const b of liste) z.push(`  [${KLASSE_TEXT[b.klasse]}] ${b.bezug}: ${b.text}`);
    z.push("");
  });
  z.push(
    "Meldungen:",
    ...eintraege.map(
      (e) =>
        `  ${e.name} · ${absender(e, profil)} · ${datumDE(zeitpunktVon(e, profil)) || "ohne Zeitpunkt"} · Kennung ${e.id}${e.fremd ? " · fremdes Schema" : ""}`,
    ),
    "",
  );
  z.push(daten.hinweis);
  return { json: JSON.stringify(daten, null, 2) + "\n", text: z.join("\n") + "\n" };
}
