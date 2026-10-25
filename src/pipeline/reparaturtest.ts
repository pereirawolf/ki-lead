// Prüffall Reparatur (S3) für die Wahl des Reparaturmodells (seit 0.5.13, Befund AV-2026-W43-25). Die Musterfassung Ilka
// (evaluation/material/ilka-musterfassung.json) wird gezielt beschädigt und als Antwort von S2 eingespielt; S1 entfällt
// (fester Gegenstand evaluation/material/ilka-s1-zuschnitt-a.json, zwei Sachverhalte wie die Musterfassung). Danach
// läuft die Pipeline wie in der App: Nachbearbeitung, Schemaprüfung und bis zu zwei Reparaturen mit dem gewählten
// Modell. Nur S3 ruft einen Anbieter auf.
//
// Gemessen je Fall: schemakonform nach der Reparatur, Zahl der Reparaturen, Erhalt der übrigen Inhalte gegenüber dem
// unbeschädigten Durchlauf (Soll, ohne KI-Aufruf ermittelt), Kosten, Dauer und Token von S3. Alle Inhalte sind fiktiv.

import JSZip from "jszip";
import MUSTER_TEXT from "../../evaluation/material/ilka-musterfassung.json?raw";
import ZUSCHNITT_TEXT from "../../evaluation/material/ilka-s1-zuschnitt-a.json?raw";
import PLAN from "../../evaluation/plaene/reparatur-ilka.json";
import { aufschlag, kostenAnfrage } from "../anbieter/preise";
import { leereNutzung, type Aufwand, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "../anbieter/typen";
import { anbieterVon } from "../anbieter/verteiler";
import type { Meldung } from "../kern/typen";
import { sha256 } from "../profil/laden";
import { aufwandAngeboten, aufwandFuer, modellFuer, type Einstellungen } from "./einstellungen";
import { APP_KENNUNG, neuerLauf, ohneBase64, type Lauf, type S1Vorschlag } from "./lauf";
import { stufe2und3, type Kontext } from "./stufen";
import { csv, fallAuftrag, fallMaterial, type FallDaten } from "./vergleichslauf";

export const ENTWURF_DATEI = "evaluation/material/ilka-musterfassung.json";
export const S1_DATEI = "evaluation/material/ilka-s1-zuschnitt-a.json";
const MUSTER = JSON.parse(MUSTER_TEXT);
const ZUSCHNITT = JSON.parse(ZUSCHNITT_TEXT);

/** Variante des Plans reparatur-ilka: Modell und Aufwand der Reparatur */
export interface ReparaturVariante {
  kennung: string;
  reparatur: { modell: string; aufwand: Aufwand };
}

/** Plan reparatur-ilka (evaluation/plaene/reparatur-ilka.json) mit den Varianten der App-Auswahl */
export const PLAN_REPARATUR = {
  id: PLAN.id,
  wiederholungen: PLAN.wiederholungen,
  varianten: PLAN.varianten as unknown as ReparaturVariante[],
};

export const DURCHGAENGE_MAX = 5;
export const durchgaengeBegrenzt = (n: number) => Math.max(1, Math.min(DURCHGAENGE_MAX, Math.round(Number(n) || 1)));

/** Einstellungen für eine Variante: nur Modell und Aufwand der Reparatur ändern sich */
export function einstellungenFuerReparatur(e: Einstellungen, v: ReparaturVariante): Einstellungen {
  return { ...e, modelle: { ...e.modelle, reparatur: v.reparatur.modell }, aufwand: { ...e.aufwand, reparatur: v.reparatur.aufwand } };
}

/**
 * Grobe Schätzung der Kosten je Reparatur nach Listenpreisen, ohne Messwert: Eingabe etwa 10.000–14.000 Token
 * (Anweisung, Schema-Befunde und Entwurf), Ausgabe etwa 8.000–16.000 Token (vollständiger Entwurf, mit Nachdenken
 * mehr). Mistral mit dem Aufschlag des EU-Endpunkts.
 */
export function schaetzeReparatur(modell: string, optionen: { mistralEndpunkt?: "eu" | "global" } = {}): [number, number] | null {
  const preis = (eingabe: number, ausgabe: number) => kostenAnfrage(modell, { eingabe, ausgabe, cacheLesen: 0, cacheSchreiben: 0, websuchen: 0, abrufe: 0 });
  const von = preis(10_000, 8_000);
  const bis = preis(14_000, 16_000);
  if (von === null || bis === null) return null;
  const f = aufschlag(modell, optionen);
  return [von * f, bis * f];
}

/**
 * Kosten eines Prüffalls: je Fall eine Reparatur (untere Grenze) bis zwei Reparaturen (obere Grenze, Höchstzahl);
 * der unbeschädigte Durchlauf ruft keinen Anbieter auf.
 */
export function schaetzePrueffall(modell: string, durchgaenge: number, optionen: { mistralEndpunkt?: "eu" | "global" } = {}): [number, number] | null {
  const je = schaetzeReparatur(modell, optionen);
  const faelle = DEFEKTE.length * durchgaengeBegrenzt(durchgaenge);
  return je ? [je[0] * faelle, je[1] * faelle * 2] : null;
}

/** Aufwand so, wie das Modell ihn anbietet (AV-2026-W43-02) */
export const aufwandDerReparatur = (v: ReparaturVariante) => aufwandAngeboten(v.reparatur.modell, v.reparatur.aufwand);

/** Platzhalter für S2: liefert den präparierten Entwurf, ruft keinen Anbieter auf */
export const ENTWURF_MODELL = "praeparierter-entwurf";

export interface Defekt {
  id: string;
  titel: string;
  /** beschädigte Stellen (Pfade wie in der Meldung, z. B. sachverhalte[1].sofort.lagenradar.d2) */
  pfade: string[];
  anwenden(m: any): void;
}

const radar = (sv: number, achse: string) => `sachverhalte[${sv}].sofort.lagenradar.${achse}`;

/**
 * Fehlerarten, die die Nachbearbeitung nicht behebt und die Schemaprüfung meldet (geprüft in
 * tests/pipeline/reparaturtest.test.ts). Sachverhalt 1: Sturmfolgen, Sachverhalt 2: Stromausfall.
 */
export const DEFEKTE: Defekt[] = [
  {
    id: "R1-radar-skala",
    titel: "Radarwert außerhalb der Skala (D2 = 7 im Stromausfall)",
    pfade: [radar(1, "d2")],
    anwenden: (m) => (m.sachverhalte[1].sofort.lagenradar.d2 = 7),
  },
  {
    id: "R2-beurteilung",
    titel: "Unzulässige Beurteilung „hoch“ im Stromausfall",
    pfade: ["sachverhalte[1].sofort.beurteilung"],
    anwenden: (m) => (m.sachverhalte[1].sofort.beurteilung = "hoch"),
  },
  {
    id: "R3-ereignisart",
    titel: "Unbekannte Ereignisart „Orkan“ bei den Sturmfolgen",
    pfade: ["sachverhalte[0].art"],
    anwenden: (m) => (m.sachverhalte[0].art = ["Orkan"]),
  },
  {
    id: "R4-typ",
    titel: "Radarwert als Text („3“ statt 3) bei den Sturmfolgen",
    pfade: [radar(0, "d4")],
    anwenden: (m) => (m.sachverhalte[0].sofort.lagenradar.d4 = String(m.sachverhalte[0].sofort.lagenradar.d4 ?? 3)),
  },
  {
    id: "R5-mehrere",
    titel: "Drei Fehler zugleich (R1, R2 und R3)",
    pfade: [radar(1, "d2"), "sachverhalte[1].sofort.beurteilung", "sachverhalte[0].art"],
    anwenden: (m) => {
      m.sachverhalte[1].sofort.lagenradar.d2 = 7;
      m.sachverhalte[1].sofort.beurteilung = "hoch";
      m.sachverhalte[0].art = ["Orkan"];
    },
  },
];

/** Unbeschädigte Musterfassung (frische Kopie) */
export function musterfassung(): Meldung {
  return structuredClone(MUSTER) as unknown as Meldung;
}

/** Musterfassung mit einem Defekt (frische Kopie) */
export function beschaedigt(d: Defekt): Meldung {
  const m = musterfassung();
  d.anwenden(m);
  return m;
}

/** Antwort von S2 mit dem präparierten Entwurf, ohne Kosten */
function entwurfAntwort(m: Meldung, kennung: string): LlmAntwort {
  const text = `Präparierter Entwurf für den Prüffall Reparatur (${kennung}); kein KI-Aufruf.\n\n\`\`\`json\n${JSON.stringify(m, null, 1)}\n\`\`\``;
  return {
    modell: ENTWURF_MODELL,
    text,
    inhalt: [{ type: "text", text }],
    zitate: [],
    fundstellen: [],
    suchen: [],
    abrufe: [],
    abrufFehler: [],
    nutzung: leereNutzung(),
    kostenUsd: 0,
    stopGrund: "end_turn",
    dauerMs: 0,
    runden: 1,
  };
}

/** Anbieter, der S2 mit dem präparierten Entwurf beantwortet und alle anderen Aufrufe weitergibt */
export function weiche(entwurf: Meldung, kennung: string, echt: LlmAnbieter): LlmAnbieter {
  return {
    id: `prueffall-reparatur+${echt.id}`,
    senden: (a: LlmAnfrage) => (a.modell === ENTWURF_MODELL ? Promise.resolve(entwurfAntwort(entwurf, kennung)) : echt.senden(a)),
  };
}

/** Pfade und Werte der geprüften Inhalte; die App-Felder (_entstehung, _status, freigabe) zählen nicht */
export function inhaltsfelder(m: any): Map<string, string> {
  const out = new Map<string, string>();
  const ablegen = (pfad: string, v: unknown) => {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) for (const [k, x] of Object.entries(v)) ablegen(`${pfad}.${k}`, x);
    else out.set(pfad, JSON.stringify(v ?? null));
  };
  for (const k of ["land", "meldende_stelle", "meldezeitpunkt", "meldezeitraum", "quellen"]) ablegen(k, m?.[k]);
  (Array.isArray(m?.sachverhalte) ? m.sachverhalte : []).forEach((sv: any, i: number) => {
    for (const k of ["eintritt", "art", "ort", "bezeichnung", "analyse", "sofort"]) ablegen(`sachverhalte[${i}].${k}`, sv?.[k]);
  });
  return out;
}

/** Vergleich mit dem Soll ohne die beschädigten Stellen */
export function inhaltVergleichen(ist: Meldung | undefined, soll: Meldung, ausnahmen: string[]): { geprueft: number; gleich: number; abweichungen: string[] } {
  const s = inhaltsfelder(soll);
  const i = inhaltsfelder(ist);
  const ausgenommen = (p: string) => ausnahmen.some((a) => p === a || p.startsWith(`${a}.`) || p.startsWith(`${a}[`));
  let geprueft = 0;
  let gleich = 0;
  const abweichungen: string[] = [];
  for (const [pfad, wert] of s) {
    if (ausgenommen(pfad)) continue;
    geprueft++;
    if (i.get(pfad) === wert) gleich++;
    else abweichungen.push(pfad);
  }
  return { geprueft, gleich, abweichungen };
}

/** Wert an einem Pfad wie „sachverhalte[1].sofort.lagenradar.d2“ */
export function wertAn(m: any, pfad: string): unknown {
  return pfad
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce((x, k) => (x == null ? undefined : x[k]), m);
}

export interface ReparaturFall {
  defekt: string;
  wiederholung: number;
  lauf: string;
  status: string;
  /** Schemabefunde nach der Nachbearbeitung des präparierten Entwurfs */
  befunde_vorher: string[];
  befunde_nachher: string[];
  schemakonform: boolean;
  reparaturen: number;
  /** übrige Inhalte gegenüber dem unbeschädigten Durchlauf */
  felder_geprueft: number;
  felder_gleich: number;
  anteil_erhalten: number | null;
  abweichungen: string[];
  /** Wert an den beschädigten Stellen: unbeschädigt, präpariert, nach der Reparatur */
  stellen: { pfad: string; original: unknown; praepariert: unknown; repariert: unknown }[];
  /**
   * Alle beschädigten Stellen haben nach der Reparatur wieder den Originalwert (seit 0.5.15, AV-2026-W43-35). Ein leerer
   * Wert zählt nicht als Originalwert. Fehlt in Reihendateien vor 0.5.15.
   */
  stellen_wie_original?: boolean;
  kosten_usd: number | null;
  dauer_s: number | null;
  ausgabetoken: number | null;
  fehler: string | null;
}

export interface ReparaturReihe {
  format: "ki-lead-reparaturtest/1";
  quelle: "app" | "skript";
  variante?: string;
  erstellt: string;
  app: string;
  profil: { id: string; version: string; hash: string };
  entwurf: { datei: string; sha256: string };
  s1_fest: { datei: string; sha256: string };
  reparatur: { modell: string; aufwand: string; anbieter: string };
  mistral_endpunkt?: string;
  wiederholungen: number;
  /** Unbeschädigter Durchlauf: muss ohne Reparatur schemakonform sein */
  basis: { schemakonform: boolean; reparaturen: number };
  faelle: ReparaturFall[];
  summe: {
    faelle: number;
    schemakonform: number;
    reparaturen: number;
    anteil_erhalten_mittel: number | null;
    /** Fälle, in denen alle beschädigten Stellen wieder den Originalwert haben (seit 0.5.15, AV-2026-W43-35) */
    stellen_wie_original?: number;
    kosten_usd: number | null;
    dauer_s: number | null;
  };
}

/** Wert leer im Sinne der Kennzahl: fehlt, null, leere Zeichenkette oder leere Liste */
function leer(w: unknown): boolean {
  return w === undefined || w === null || w === "" || (Array.isArray(w) && w.length === 0);
}

/** Haben alle beschädigten Stellen wieder ihren Originalwert? Leere Werte zählen nicht (AV-2026-W43-35). */
export function stellenWieOriginal(stellen: { original: unknown; repariert: unknown }[]): boolean {
  return stellen.length > 0 && stellen.every((s) => !leer(s.repariert) && JSON.stringify(s.repariert) === JSON.stringify(s.original));
}

export interface ReparaturStand {
  nr: number;
  anzahl: number;
  defekt: string;
  kostenUsd: number;
}

interface DurchlaufErgebnis {
  lauf: Lauf;
  meldung?: Meldung;
}

async function durchlauf(
  daten: FallDaten,
  echt: LlmAnbieter,
  e: Einstellungen,
  entwurf: Meldung,
  kennung: string,
  signal?: AbortSignal,
): Promise<DurchlaufErgebnis> {
  const profil = daten.profil;
  const material = await fallMaterial(daten);
  const lauf = neuerLauf(
    profil,
    fallAuftrag(),
    material.map((m) => ({ name: m.name, art: m.art, groesse: m.groesse, hash: m.hash })),
  );
  const k: Kontext = {
    profil,
    anbieter: weiche(entwurf, kennung, echt),
    einstellungen: { ...e, modelle: { ...e.modelle, verdichtung: ENTWURF_MODELL } },
    lauf,
    material,
    signal,
    aktualisiert: () => undefined,
  };
  const vorschlag = structuredClone(ZUSCHNITT) as unknown as S1Vorschlag;
  lauf.vorschlag = vorschlag;
  try {
    const r = await stufe2und3(k, structuredClone(vorschlag));
    return { lauf, meldung: r.meldung };
  } catch (err) {
    lauf.status = signal?.aborted ? "abgebrochen" : "fehler";
    lauf.fehler ??= String((err as Error)?.message || err);
    return { lauf };
  }
}

const reparaturStufen = (l: Lauf) => l.stufen.filter((s) => /^S3 Reparatur/.test(s.stufe));
const summeOder = (w: (number | null | undefined)[]) => (w.some((x) => typeof x !== "number") ? null : (w as number[]).reduce((a, b) => a + b, 0));
const r3 = (x: number) => Math.round(x * 1000) / 1000;

export interface ReparaturOptionen {
  daten: FallDaten;
  anbieter: LlmAnbieter;
  /** Einstellungen; maßgeblich sind Modell und Aufwand der Reparatur */
  einstellungen: Einstellungen;
  /** Durchgänge über alle Defekte (Vorgabe 1) */
  wiederholungen?: number;
  defekte?: Defekt[];
  signal?: AbortSignal;
  stand?: (s: ReparaturStand) => void;
  quelle?: "app" | "skript";
  variante?: string;
}

/** Prüffall Reparatur: unbeschädigter Durchlauf als Soll, dann jeder Defekt je Wiederholung */
export async function reparaturReihe(o: ReparaturOptionen): Promise<{ reihe: ReparaturReihe; laeufe: DurchlaufErgebnis[] }> {
  const { daten, einstellungen: e } = o;
  const profil = daten.profil;
  const defekte = o.defekte ?? DEFEKTE;
  const wiederholungen = durchgaengeBegrenzt(o.wiederholungen ?? 1);
  const basis = await durchlauf(daten, o.anbieter, e, musterfassung(), "unbeschädigt", o.signal);
  if (!basis.meldung) throw new Error(`Unbeschädigter Durchlauf ohne Meldung: ${basis.lauf.fehler ?? basis.lauf.status}`);
  const soll = basis.meldung;
  const faelle: ReparaturFall[] = [];
  const laeufe: DurchlaufErgebnis[] = [basis];
  const anzahl = defekte.length * wiederholungen;
  let kosten = 0;
  for (let w = 1; w <= wiederholungen; w++)
    for (const d of defekte) {
      if (o.signal?.aborted) break;
      o.stand?.({ nr: faelle.length + 1, anzahl, defekt: d.id, kostenUsd: kosten });
      const entwurf = beschaedigt(d);
      const r = await durchlauf(daten, o.anbieter, e, entwurf, d.id, o.signal);
      laeufe.push(r);
      const s2 = r.lauf.stufen.find((s) => s.modell === ENTWURF_MODELL);
      const rep = reparaturStufen(r.lauf);
      const letzte = r.lauf.stufen[r.lauf.stufen.length - 1];
      const vgl = inhaltVergleichen(r.meldung, soll, d.pfade);
      const k = summeOder(rep.map((s) => s.kostenUsd));
      if (typeof k === "number") kosten += k;
      const stellen = d.pfade.map((pfad) => ({
        pfad,
        original: wertAn(musterfassung(), pfad) ?? null,
        praepariert: wertAn(entwurf, pfad) ?? null,
        repariert: r.meldung ? (wertAn(r.meldung, pfad) ?? null) : null,
      }));
      faelle.push({
        defekt: d.id,
        wiederholung: w,
        lauf: r.lauf.id,
        status: r.lauf.status,
        befunde_vorher: s2?.befunde ?? [],
        befunde_nachher: rep.length ? (letzte?.befunde ?? []) : (s2?.befunde ?? []),
        schemakonform: !!r.lauf.ergebnis?.schemakonform,
        reparaturen: rep.length,
        felder_geprueft: vgl.geprueft,
        felder_gleich: vgl.gleich,
        anteil_erhalten: r.meldung && vgl.geprueft ? r3(vgl.gleich / vgl.geprueft) : null,
        abweichungen: vgl.abweichungen.slice(0, 20),
        stellen,
        stellen_wie_original: stellenWieOriginal(stellen),
        kosten_usd: k === null ? null : r3(k * 1000) / 1000,
        dauer_s: rep.length ? Math.round(rep.reduce((a, s) => a + (s.dauerMs ?? 0), 0) / 100) / 10 : 0,
        ausgabetoken: rep.reduce((a, s) => a + (s.nutzung?.ausgabe ?? 0), 0),
        fehler: r.lauf.fehler ?? null,
      });
    }
  const modell = modellFuer("reparatur", e, profil);
  const anteile = faelle.map((f) => f.anteil_erhalten).filter((x): x is number => typeof x === "number");
  const reihe: ReparaturReihe = {
    format: "ki-lead-reparaturtest/1",
    quelle: o.quelle ?? "app",
    ...(o.variante ? { variante: o.variante } : {}),
    erstellt: new Date().toISOString(),
    app: APP_KENNUNG,
    profil: { id: profil.manifest.id, version: profil.manifest.version, hash: basis.lauf.profil.hash },
    entwurf: { datei: ENTWURF_DATEI, sha256: await sha256(MUSTER_TEXT) },
    s1_fest: { datei: S1_DATEI, sha256: await sha256(ZUSCHNITT_TEXT) },
    reparatur: { modell, aufwand: aufwandFuer("reparatur", e, profil), anbieter: anbieterVon(modell) },
    ...(anbieterVon(modell) === "mistral" ? { mistral_endpunkt: e.mistralEndpunkt ?? "eu" } : {}),
    wiederholungen,
    basis: { schemakonform: !!basis.lauf.ergebnis?.schemakonform, reparaturen: reparaturStufen(basis.lauf).length },
    faelle,
    summe: {
      faelle: faelle.length,
      schemakonform: faelle.filter((f) => f.schemakonform).length,
      reparaturen: faelle.reduce((a, f) => a + f.reparaturen, 0),
      anteil_erhalten_mittel: anteile.length ? r3(anteile.reduce((a, b) => a + b, 0) / anteile.length) : null,
      stellen_wie_original: faelle.filter((f) => f.stellen_wie_original).length,
      kosten_usd: summeOder(faelle.map((f) => f.kosten_usd)) === null ? null : r3(summeOder(faelle.map((f) => f.kosten_usd))! * 1000) / 1000,
      dauer_s: Math.round(faelle.reduce((a, f) => a + (f.dauer_s ?? 0), 0)),
    },
  };
  return { reihe, laeufe };
}

/** Übersicht als CSV: eine Zeile je Fall */
export function reparaturZeilen(r: ReparaturReihe): unknown[][] {
  return [
    [
      "reparatur_modell",
      "aufwand",
      "defekt",
      "wiederholung",
      "lauf",
      "schemakonform",
      "reparaturen",
      "stellen_wie_original",
      "anteil_erhalten",
      "abweichungen",
      "kosten_usd",
      "dauer_s",
      "ausgabetoken",
    ],
    ...r.faelle.map((f) => [
      r.reparatur.modell,
      r.reparatur.aufwand,
      f.defekt,
      f.wiederholung,
      f.lauf,
      f.schemakonform ? "ja" : "nein",
      f.reparaturen,
      f.stellen_wie_original === undefined ? "" : f.stellen_wie_original ? "ja" : "nein",
      f.anteil_erhalten,
      f.abweichungen.length,
      f.kosten_usd,
      f.dauer_s,
      f.ausgabetoken,
    ]),
  ];
}

export function reparaturDateiname(r: ReparaturReihe): string {
  const stempel = r.erstellt.slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
  const kurz = (s: string) => s.replace(/[^a-z0-9.-]+/gi, "-");
  return `KI-LEAD_Prueffall_Reparatur_${kurz(`${r.reparatur.modell}-${r.reparatur.aufwand}`)}_${stempel}.zip`;
}

/** ZIP mit Reihendatei, Übersicht, Laufprotokollen und reparierten Entwürfen */
export async function reparaturZip(r: ReparaturReihe, laeufe: DurchlaufErgebnis[]): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("reihe.json", JSON.stringify(r, null, 2));
  zip.file("uebersicht.csv", csv(reparaturZeilen(r)));
  for (const l of laeufe) {
    zip.file(`laeufe/${l.lauf.id}.lauf.json`, JSON.stringify(ohneBase64(l.lauf), null, 1));
    if (l.meldung) zip.file(`meldungen/${l.lauf.id}.meldung.json`, JSON.stringify(l.meldung, null, 1));
  }
  zip.file(
    "LIESMICH.txt",
    [
      "KI-LEAD – Prüffall Reparatur (S3) mit der Musterfassung Ilka (FIKTIV)",
      "",
      `Erstellt: ${r.erstellt} mit ${r.app}, Profil ${r.profil.id} ${r.profil.version}`,
      `Reparatur: ${r.reparatur.modell} (${r.reparatur.aufwand})${r.mistral_endpunkt ? ` · Mistral ${r.mistral_endpunkt}` : ""}`,
      `Entwurf: ${r.entwurf.datei}, beschädigt nach den Defekten R1–R5; S1 fest: ${r.s1_fest.datei}; S2 ohne KI-Aufruf.`,
      `Fälle: ${r.summe.faelle}; schemakonform nach der Reparatur: ${r.summe.schemakonform}; Reparaturen: ${r.summe.reparaturen}; beschädigte Stellen wie im Original: ${r.summe.stellen_wie_original ?? "–"}; übrige Inhalte erhalten im Mittel: ${r.summe.anteil_erhalten_mittel ?? "–"}; Kosten ${r.summe.kosten_usd ?? "unbekannt"} USD (Listenpreise).`,
      "",
      "Inhalt: reihe.json (ki-lead-reparaturtest/1), uebersicht.csv, laeufe/ (Laufprotokolle, erster ohne Defekt als Soll), meldungen/ (reparierte Entwürfe).",
      "Alle Inhalte sind fiktiv. Laufprotokolle gehören nicht ins öffentliche Repository (docs/ERPROBUNG.md, Abschnitt 6).",
    ].join("\n"),
  );
  return zip.generateAsync({ type: "uint8array" });
}
