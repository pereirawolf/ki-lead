// Vergleichslauf Ilka (seit 0.5.8): Verdichtung der sechs fiktiven Ländermeldungen zum Orkantief „Ilka“ mit einer
// festen Konfiguration von Modell und Aufwand, mehrfach hintereinander. Gleicher Fall, gleiches Beispielprofil
// (Koordinierungsstelle, Referenzraum Bevölkerungsschutz in Deutschland), gleicher Auftrag (t0 14.10.2026 14:00,
// ohne Websuche), S1-Vorschlag unverändert übernommen. Dieselben Funktionen wie die App und das Abnahmeskript M4
// (evaluation/abnahmen/m4.lauf.ts); das Skript nutzt die Prüfpunkte und die Reihendatei von hier.
//
// Ergebnis: je Lauf Laufprotokoll, Entwurf, Prüfpunkte T1–T8 der Abnahme M4 und Vergleich mit der Redaktionsfassung,
// dazu eine Reihendatei (ki-lead-abnahme/1) und eine Übersicht als CSV; als ZIP zum Weiterverarbeiten und zum
// Vergleich verschiedener Konfigurationen. Alle Inhalte sind fiktiv.

import JSZip from "jszip";
import FALL from "../../evaluation/faelle/orkantief-ilka-verdichtung.json";
import type { Fortschritt, LlmAnbieter } from "../anbieter/typen";
import { anbieterVon, type AnbieterId } from "../anbieter/verteiler";
import { migriere } from "../kern/migration";
import type { Meldung, Profil } from "../kern/typen";
import { pruefeGegenSchema } from "../kern/validierung";
import { sha256 } from "../profil/laden";
import { modellFuer, type Einstellungen, type Rolle } from "./einstellungen";
import { APP_KENNUNG, neuerLauf, ohneBase64, type Auftrag, type Lauf } from "./lauf";
import { dateiLesen, istVerdichtung, type Material } from "./material";
import { stufe1, stufe2und3, type Kontext } from "./stufen";
import { VERGLEICH_VERFAHREN, vergleiche, vergleichTabelle, zuordnungAus } from "./vergleich";
import { eingangsquellenPruefen, type QuellenZuordnung } from "./vermerke";

export const FALL_ID: string = FALL.id;
export const FALL_TITEL: string = FALL.titel;
/** Ordner des Beispielprofils, aus dem Material und Redaktionsfassung stammen */
export const PROFIL_ORDNER = "lead-beispiel";
const PROFIL_PFAD = `profile/${PROFIL_ORDNER}/`;
/** Redaktionsfassung der Koordinierungsstelle (Bezug des Vergleichs), relativ zum Profilordner */
export const REFERENZ = "beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
export const ANZAHL_VORGABE = 3;
export const ANZAHL_MAX = 10;
/** Aufgaben, die ein Vergleichslauf nutzt */
export const VERGLEICH_ROLLEN: Rolle[] = ["vorverarbeitung", "verdichtung", "reparatur"];

/** Material des Falls: Dateipfade relativ zum Profilordner */
export const FALL_MATERIAL: string[] = FALL.material.map((m) => m.datei.slice(PROFIL_PFAD.length));

/** Auftrag des Falls; Websuche immer aus, t0 und Stichtag fest */
export function fallAuftrag(): Auftrag {
  const a = FALL.auftrag;
  return {
    sachverhalt: a.sachverhalt,
    stichworte: a.stichworte,
    urls: [],
    stichtag: a.stichtag,
    prueffrage: "",
    websuche: false,
    meldezeitpunkt: a.meldezeitpunkt,
  };
}

/** Beispielprofil mit seinen Dateien (Pfad relativ zum Profilordner → Text) */
export interface FallDaten {
  profil: Profil;
  dateien: Record<string, string>;
}

/** Prüft, ob die Dateien des Falls vorhanden sind; liefert die fehlenden Pfade. */
export function fehlendeFalldateien(dateien: Record<string, string>): string[] {
  return [...FALL_MATERIAL, REFERENZ].filter((p) => typeof dateien[p] !== "string");
}

/** Material frisch aus den Dateien des Falls, wie beim Hochladen in der App */
export async function fallMaterial(d: FallDaten): Promise<Material[]> {
  const out: Material[] = [];
  for (const pfad of FALL_MATERIAL) out.push(await dateiLesen(new File([d.dateien[pfad]], pfad.split("/").pop()!), d.profil));
  return out;
}

/** Konfiguration der Reihe: wirksames Modell und Aufwand je genutzter Aufgabe */
export interface Konfiguration {
  s1: { modell: string; aufwand: string; anbieter: AnbieterId };
  s2: { modell: string; aufwand: string; anbieter: AnbieterId };
  reparatur: { modell: string; aufwand: string; anbieter: AnbieterId };
  /** nur, wenn eine Aufgabe Mistral nutzt */
  mistral_endpunkt?: string;
}

export function konfiguration(e: Einstellungen, profil: Profil): Konfiguration {
  const teil = (r: Rolle) => {
    const modell = modellFuer(r, e, profil);
    return { modell, aufwand: e.aufwand[r], anbieter: anbieterVon(modell) };
  };
  const k: Konfiguration = { s1: teil("vorverarbeitung"), s2: teil("verdichtung"), reparatur: teil("reparatur") };
  if ([k.s1, k.s2, k.reparatur].some((t) => t.anbieter === "mistral")) k.mistral_endpunkt = e.mistralEndpunkt ?? "eu";
  return k;
}

export type Pruefpunkt = { nr: string; erfuellt: boolean; angabe: string };

/** Technische Prüfpunkte T1–T8 der Abnahme M4 (evaluation/plaene/2026-10-23-abnahme-m4.md) */
export function pruefpunkte(l: Lauf, material: Material[], meldung: Meldung | undefined, quellen: QuellenZuordnung[]): Pruefpunkt[] {
  const s1 = l.stufen.find((s) => s.stufe.startsWith("S1"));
  const s2 = l.stufen.find((s) => s.stufe === "S2 Verdichtung");
  const reparaturen = l.stufen.filter((s) => s.stufe.startsWith("S3 Reparatur")).length;
  const eingaenge = material.filter((m) => m.art === "eingang");
  const vermerk = "Vermerke der App aus dem Redaktionscheck";
  const stufenVollstaendig = l.stufen.every((s) => s.modell && s.aufwand && s.nutzung && typeof s.dauerMs === "number" && s.kostenUsd !== undefined);
  return [
    {
      nr: "T1",
      erfuellt: eingaenge.length === FALL_MATERIAL.length && istVerdichtung(material) && !!s2,
      angabe: `${eingaenge.length} Eingänge, Stufe „${s2?.stufe ?? "–"}“`,
    },
    { nr: "T2", erfuellt: l.status === "fertig", angabe: `Status ${l.status}${l.fehler ? `: ${l.fehler}` : ""}` },
    { nr: "T3", erfuellt: !!l.ergebnis?.schemakonform && reparaturen <= 2, angabe: `schemakonform ${!!l.ergebnis?.schemakonform}, Reparaturen ${reparaturen}` },
    { nr: "T4", erfuellt: meldung?.meldezeitpunkt === FALL.auftrag.meldezeitpunkt, angabe: `t0 ${meldung?.meldezeitpunkt ?? "–"}` },
    {
      nr: "T5",
      erfuellt:
        !!s2 &&
        !s2.anfrage?.werkzeuge &&
        !!s2.anfrage?.system.some((t) => t.includes(vermerk)) &&
        JSON.stringify(s1?.anfrage?.nachrichten ?? "").includes("Vermerke der App"),
      angabe: `Werkzeuge in S2: ${s2?.anfrage?.werkzeuge ? "ja" : "nein"}; Vermerke an S1 und S2`,
    },
    {
      nr: "T6",
      erfuellt: !!l.profil.hash && l.material.length === FALL_MATERIAL.length && l.material.every((m) => !!m.hash) && stufenVollstaendig,
      angabe: `${l.stufen.length} Stufen, Profil ${l.profil.version} (${l.profil.hash.slice(0, 12)}…)`,
    },
    { nr: "T7", erfuellt: !!meldung && quellen.length === FALL_MATERIAL.length, angabe: quellen.map((q) => `${q.stelle}: ${q.status}`).join("; ") || "–" },
    { nr: "T8", erfuellt: !!l.vergleich?.ergebnis && !!l.vergleich.referenzHash, angabe: l.vergleich ? `${l.vergleich.ergebnis.paare.length} Paare` : "–" },
  ];
}

/** Ergebnis eines einzelnen Laufs */
export interface EinzelErgebnis {
  lauf: Lauf;
  meldung?: Meldung;
  /** Eintrag der Reihendatei (Prüfpunkte, Beobachtungen, Kennzahlen je Stufe, Kurzantwort, Entwurf) */
  eintrag: ReiheEintrag;
  /** Vergleich mit der Redaktionsfassung als Tabelle (Zeilen, Zellen) */
  vergleichTabelle?: string[][];
}

export interface ReiheEintrag {
  lauf: string;
  attrappe: boolean;
  anbieter: AnbieterId;
  status: string;
  technisch_bestanden: boolean;
  pruefpunkte: Pruefpunkt[];
  beobachtungen: Record<string, unknown>;
  stufen: {
    stufe: string;
    modell: string | null;
    aufwand: string | null;
    dauer_s: number | null;
    eingabetoken: number | null;
    ausgabetoken: number | null;
    kosten_usd: number | null;
    stop: string | null;
    fehler: string | null;
  }[];
  kosten_usd: number | null;
  dauer_s: number;
  kurzantwort: string | null;
  meldung: Meldung | null;
}

/** Fortschritt einer Reihe für die Anzeige */
export interface ReiheStand {
  /** laufende Nummer des Laufs (1 …) */
  nr: number;
  anzahl: number;
  /** Stufe, die gerade läuft, z. B. „S2 Verdichtung“ */
  stufe: string;
  /** bisher geschriebene Zeichen der laufenden Stufe */
  zeichen: number;
  /** Kosten der bisherigen Läufe und Stufen (Listenpreise) */
  kostenUsd: number;
}

export interface LaufOptionen {
  daten: FallDaten;
  anbieter: LlmAnbieter;
  einstellungen: Einstellungen;
  attrappe?: boolean;
  signal?: AbortSignal;
  fortschritt?: (f: Fortschritt) => void;
  /** nach jeder Änderung am Lauf (Anzeige, Speichern) */
  aktualisiert?: (l: Lauf) => void | Promise<void>;
}

/** Ein Lauf: S1, unveränderte Bestätigung, S2 Verdichtung (mit S3 bei Bedarf), Quellenprüfung, Vergleich. */
export async function einLauf(o: LaufOptionen): Promise<EinzelErgebnis> {
  const { daten, einstellungen } = o;
  const profil = daten.profil;
  const material = await fallMaterial(daten);
  const lauf = neuerLauf(
    profil,
    fallAuftrag(),
    material.map((m) => ({ name: m.name, art: m.art, groesse: m.groesse, hash: m.hash })),
  );
  const k: Kontext = {
    profil,
    anbieter: o.anbieter,
    einstellungen,
    lauf,
    material,
    signal: o.signal,
    aktualisiert: o.aktualisiert ?? (() => undefined),
    fortschritt: o.fortschritt,
  };
  let meldung: Meldung | undefined;
  try {
    const vorschlag = await stufe1(k);
    // Bestätigung ohne Eingriff: Vorschlag unverändert, keine vorgeschlagene Prüffrage übernommen (wie in der App ohne Änderung)
    const e = await stufe2und3(k, structuredClone(vorschlag));
    meldung = e.meldung ?? undefined;
  } catch (err) {
    if (o.signal?.aborted) {
      lauf.status = "abgebrochen";
      lauf.fehler ??= "Vom Nutzer abgebrochen";
    } else {
      lauf.status = lauf.status === "fertig" ? lauf.status : "fehler";
      lauf.fehler ??= String((err as Error)?.message || err);
    }
  }

  const quellen = meldung ? eingangsquellenPruefen(material, meldung, profil) : [];
  let tabelle: string[][] | undefined;
  if (meldung) {
    const refText = daten.dateien[REFERENZ];
    const mig = migriere(JSON.parse(refText), profil);
    const ergebnis = vergleiche(meldung, mig.daten, profil);
    lauf.vergleich = {
      referenz: REFERENZ.split("/").pop()!,
      referenzHash: await sha256(refText),
      referenzDaten: mig.daten,
      verfahren: VERGLEICH_VERFAHREN,
      manuell: false,
      zuordnung: zuordnungAus(ergebnis),
      erstellt: new Date().toISOString(),
      ergebnis,
    };
    tabelle = vergleichTabelle(ergebnis);
  }
  await k.aktualisiert(lauf);

  const punkte = pruefpunkte(lauf, material, meldung, quellen);
  const s1 = lauf.vorschlag;
  const zugeordnet = new Set((s1?.sachverhalte ?? []).flatMap((s) => s.eingangsmeldungen ?? []));
  const eintrag: ReiheEintrag = {
    lauf: lauf.id,
    attrappe: !!o.attrappe,
    anbieter: anbieterVon(modellFuer("verdichtung", einstellungen, profil)),
    status: lauf.status,
    technisch_bestanden: punkte.every((p) => p.erfuellt),
    pruefpunkte: punkte,
    beobachtungen: {
      s1_zugeordnete_eingaenge: zugeordnet.size,
      s1_sachverhalte: s1?.sachverhalte.length ?? 0,
      s1_app_hinweise: s1?.appHinweise ?? [],
      quellen,
      schemabefunde_endfassung: meldung ? pruefeGegenSchema(profil.schema, meldung, profil.ui).length : null,
      befunde: lauf.ergebnis?.befunde ?? [],
      vergleich: lauf.vergleich?.ergebnis
        ? {
            paare: lauf.vergleich.ergebnis.paare.map((p) => ({
              ki: p.ki?.bezeichnung ?? null,
              ref: p.ref?.bezeichnung ?? null,
              aehnlichkeit: p.aehnlichkeit,
            })),
            beurteilung: lauf.vergleich.ergebnis.beurteilung,
            tendenz: lauf.vergleich.ergebnis.tendenz,
            arten: lauf.vergleich.ergebnis.arten,
            achsen: lauf.vergleich.ergebnis.achsen,
          }
        : null,
    },
    stufen: lauf.stufen.map((s) => ({
      stufe: s.stufe,
      modell: s.modell ?? null,
      aufwand: s.aufwand ?? null,
      dauer_s: s.dauerMs ? Math.round(s.dauerMs / 100) / 10 : null,
      eingabetoken: s.nutzung?.eingabe ?? null,
      ausgabetoken: s.nutzung?.ausgabe ?? null,
      kosten_usd: s.kostenUsd ?? null,
      stop: s.antwort?.stopGrund ?? null,
      fehler: s.fehler ?? null,
    })),
    kosten_usd: lauf.kostenUsd,
    dauer_s: Math.round((Date.parse(lauf.aktualisiert) - Date.parse(lauf.erstellt)) / 1000),
    // Kurzantwort und Entwurf eingebettet, damit die Reihe als eine Datei inhaltlich auswertbar ist; alle Inhalte fiktiv
    kurzantwort: lauf.ergebnis?.kurzantwort ?? null,
    meldung: meldung ?? null,
  };
  return { lauf, meldung, eintrag, vergleichTabelle: tabelle };
}

/** Reihendatei im Format ki-lead-abnahme/1 (ohne Schlüssel) */
export interface Reihe {
  format: "ki-lead-abnahme/1";
  plan: string;
  /** „app“ (Einstellungen → Vergleichslauf Ilka) oder „skript“ (evaluation/abnahmen/m4.lauf.ts) */
  quelle: "app" | "skript";
  fall: string;
  erstellt: string;
  app: string;
  profil: { id: string; version: string; hash: string };
  anbieter: AnbieterId;
  mistral_endpunkt?: string;
  attrappe: boolean;
  modelle: Konfiguration;
  laeufe_geplant: number;
  technisch_bestanden: number;
  kosten_usd_summe: number;
  /** Abbruch der Reihe (Nutzer, Budget) */
  beendet?: string;
  laeufe: ReiheEintrag[];
}

export const PLAN_M4 = "evaluation/plaene/2026-10-23-abnahme-m4.md";

export function reiheErstellen(o: {
  daten: FallDaten;
  einstellungen: Einstellungen;
  ergebnisse: EinzelErgebnis[];
  geplant: number;
  quelle: "app" | "skript";
  attrappe?: boolean;
  beendet?: string;
}): Reihe {
  const k = konfiguration(o.einstellungen, o.daten.profil);
  const summe = o.ergebnisse.reduce((s, e) => s + (e.lauf.kostenUsd ?? e.lauf.kostenBekanntUsd ?? 0), 0);
  const { mistral_endpunkt, ...modelle } = k;
  return {
    format: "ki-lead-abnahme/1",
    plan: PLAN_M4,
    quelle: o.quelle,
    fall: FALL_ID,
    erstellt: new Date().toISOString(),
    app: APP_KENNUNG,
    profil: { id: o.daten.profil.manifest.id, version: o.daten.profil.manifest.version, hash: o.daten.profil.hash },
    anbieter: k.s2.anbieter,
    ...(mistral_endpunkt ? { mistral_endpunkt } : {}),
    attrappe: !!o.attrappe,
    modelle: modelle as Konfiguration,
    laeufe_geplant: o.geplant,
    technisch_bestanden: o.ergebnisse.filter((e) => e.eintrag.technisch_bestanden).length,
    kosten_usd_summe: Math.round(summe * 10000) / 10000,
    ...(o.beendet ? { beendet: o.beendet } : {}),
    laeufe: o.ergebnisse.map((e) => e.eintrag),
  };
}

export interface ReihenOptionen {
  daten: FallDaten;
  anbieter: LlmAnbieter;
  einstellungen: Einstellungen;
  anzahl: number;
  /** Reihe endet, sobald die Summe der Kosten diese Grenze erreicht (Listenpreise) */
  budgetUsd?: number;
  signal?: AbortSignal;
  stand?: (s: ReiheStand) => void;
  attrappe?: boolean;
  quelle?: "app" | "skript";
}

/** Anzahl der Läufe auf 1 … ANZAHL_MAX begrenzt */
export function anzahlBegrenzt(n: unknown): number {
  const z = Math.floor(Number(n));
  return Number.isFinite(z) ? Math.max(1, Math.min(ANZAHL_MAX, z)) : ANZAHL_VORGABE;
}

/** Führt die Reihe aus; bei Abbruch oder erreichter Budgetgrenze endet sie mit den bisherigen Läufen. */
export async function vergleichsreihe(o: ReihenOptionen): Promise<{ reihe: Reihe; ergebnisse: EinzelErgebnis[] }> {
  const anzahl = anzahlBegrenzt(o.anzahl);
  const ergebnisse: EinzelErgebnis[] = [];
  let bisher = 0;
  let beendet: string | undefined;
  for (let nr = 1; nr <= anzahl; nr++) {
    if (o.signal?.aborted) {
      beendet = "abgebrochen";
      break;
    }
    if (o.budgetUsd !== undefined && bisher >= o.budgetUsd) {
      beendet = `Budgetgrenze ${o.budgetUsd} USD erreicht`;
      break;
    }
    let stufe = "S1";
    let zeichen = 0;
    let laufend = 0;
    const melden = () => o.stand?.({ nr, anzahl, stufe, zeichen, kostenUsd: bisher + laufend });
    melden();
    const e = await einLauf({
      daten: o.daten,
      anbieter: o.anbieter,
      einstellungen: o.einstellungen,
      attrappe: o.attrappe,
      signal: o.signal,
      aktualisiert: (l) => {
        const letzte = l.stufen[l.stufen.length - 1];
        if (letzte && letzte.stufe !== stufe) {
          stufe = letzte.stufe;
          zeichen = 0;
        }
        laufend = l.kostenUsd ?? l.kostenBekanntUsd ?? 0;
        melden();
      },
      fortschritt: (f) => {
        if (f.art === "schreibt") {
          zeichen = f.zeichen;
          melden();
        }
      },
    });
    ergebnisse.push(e);
    bisher += e.lauf.kostenUsd ?? e.lauf.kostenBekanntUsd ?? 0;
    if (e.lauf.status === "abgebrochen") {
      beendet = "abgebrochen";
      break;
    }
  }
  const reihe = reiheErstellen({
    daten: o.daten,
    einstellungen: o.einstellungen,
    ergebnisse,
    geplant: anzahl,
    quelle: o.quelle ?? "app",
    attrappe: o.attrappe,
    beendet,
  });
  return { reihe, ergebnisse };
}

const csvZelle = (c: unknown) => {
  const s = c === null || c === undefined ? "" : typeof c === "number" ? String(c).replace(".", ",") : String(c);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function csv(zeilen: unknown[][]): string {
  return zeilen.map((z) => z.map(csvZelle).join(";")).join("\r\n") + "\r\n";
}

/** Radarachsen, wie der Vergleich sie liefert (Beispielprofil: d1 … d8) */
function radarAchsen(ergebnisse: EinzelErgebnis[]): string[] {
  for (const e of ergebnisse) for (const p of e.lauf.vergleich?.ergebnis.paare ?? []) if (p.ki) return Object.keys(p.ki.radar);
  return ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"];
}

/** Übersicht der Reihe: eine Zeile je Sachverhalt eines Laufs, mit Konfiguration und Kennzahlen (Semikolon, Dezimalkomma) */
export function uebersichtZeilen(reihe: Reihe, ergebnisse: EinzelErgebnis[]): unknown[][] {
  const RADAR = radarAchsen(ergebnisse);
  const kopf = [
    "lauf",
    "status",
    "technisch_bestanden",
    "s1_modell",
    "s1_aufwand",
    "s2_modell",
    "s2_aufwand",
    "reparatur_modell",
    "mistral_endpunkt",
    "s1_dauer_s",
    "s2_dauer_s",
    "dauer_s",
    "s1_ausgabetoken",
    "s2_ausgabetoken",
    "kosten_usd",
    "sachverhalte",
    "sv",
    "sv_bezeichnung",
    "beurteilung",
    "tendenz",
    ...RADAR,
    "ref_gegenstueck",
    "aehnlichkeit",
  ];
  const zeilen: unknown[][] = [kopf];
  for (const e of ergebnisse) {
    const st = (p: string) => e.eintrag.stufen.find((s) => s.stufe.startsWith(p));
    const basis = [
      e.lauf.id,
      e.lauf.status,
      e.eintrag.technisch_bestanden ? "ja" : "nein",
      reihe.modelle.s1.modell,
      reihe.modelle.s1.aufwand,
      reihe.modelle.s2.modell,
      reihe.modelle.s2.aufwand,
      reihe.modelle.reparatur.modell,
      reihe.mistral_endpunkt ?? "",
      st("S1")?.dauer_s ?? null,
      st("S2")?.dauer_s ?? null,
      e.eintrag.dauer_s,
      st("S1")?.ausgabetoken ?? null,
      st("S2")?.ausgabetoken ?? null,
      e.lauf.kostenUsd ?? e.lauf.kostenBekanntUsd ?? null,
    ];
    const paare = (e.lauf.vergleich?.ergebnis.paare ?? []).filter((p) => p.ki);
    const svs = paare.length ? paare : [undefined];
    const anzahlSv = paare.length;
    svs.forEach((p, i) => {
      zeilen.push([
        ...basis,
        anzahlSv,
        p ? i + 1 : null,
        p?.ki?.bezeichnung ?? null,
        p?.ki?.beurteilung ?? null,
        p?.ki?.tendenz ?? null,
        ...RADAR.map((d) => (p?.ki ? (p.ki.radar[d] ?? "offen") : null)),
        p?.ref?.bezeichnung ?? null,
        p ? Math.round(p.aehnlichkeit * 100) / 100 : null,
      ]);
    });
  }
  return zeilen;
}

const kurz = (s: string) =>
  s
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** Dateiname der ZIP-Datei, z. B. KI-LEAD_Vergleichslauf_Ilka_mistral-medium-3-5-high_20261024-2130.zip */
export function zipDateiname(reihe: Reihe): string {
  const d = new Date(reihe.erstellt);
  const p = (n: number) => String(n).padStart(2, "0");
  const stempel = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  return `KI-LEAD_Vergleichslauf_Ilka_${kurz(`${reihe.modelle.s2.modell}-${reihe.modelle.s2.aufwand}`)}_${stempel}.zip`;
}

function liesmich(reihe: Reihe, ergebnisse: EinzelErgebnis[]): string {
  const m = reihe.modelle;
  return [
    `KI-LEAD – Vergleichslauf Ilka (${FALL_TITEL})`,
    "",
    `Erstellt: ${reihe.erstellt} mit ${reihe.app}, Profil ${reihe.profil.id} ${reihe.profil.version} (${reihe.profil.hash.slice(0, 12)}…)`,
    `Fall: ${reihe.fall} (evaluation/faelle/${reihe.fall}.json); t0 ${FALL.auftrag.meldezeitpunkt}, ohne Websuche, S1-Vorschlag unverändert übernommen.`,
    `S1: ${m.s1.modell} (${m.s1.aufwand}) · S2 Verdichtung: ${m.s2.modell} (${m.s2.aufwand}) · Reparatur: ${m.reparatur.modell} (${m.reparatur.aufwand})` +
      (reihe.mistral_endpunkt ? ` · Mistral-Endpunkt: ${reihe.mistral_endpunkt}` : ""),
    `Läufe: ${ergebnisse.length} von ${reihe.laeufe_geplant}${reihe.beendet ? ` (${reihe.beendet})` : ""}; technisch bestanden (T1–T8): ${reihe.technisch_bestanden}; Kosten zusammen ${reihe.kosten_usd_summe} USD (Listenpreise, ohne Gewähr).`,
    "",
    "Inhalt:",
    "- reihe.json: Reihendatei (Format ki-lead-abnahme/1) mit Prüfpunkten, Kennzahlen je Stufe, Kurzantwort und Entwurf je Lauf",
    "- uebersicht.csv: eine Zeile je Sachverhalt und Lauf (Semikolon, Dezimalkomma), zum Vergleich mehrerer Konfigurationen",
    "- laeufe/<lauf>.lauf.json: vollständige Laufprotokolle (ki-lead-lauf/1) mit Prompts, Rohantworten, Token, Dauer und Kosten",
    "- meldungen/<lauf>.meldung.json: Entwürfe (LEAD-Meldung-v1)",
    "- vergleiche/<lauf>.vergleich.csv: Vergleich mit der Redaktionsfassung je Sachverhalt und Achse",
    "",
    "Mehrfachvergleich der Entwürfe im Repository: npm run vergleich:mehrfach -- <entpackter Ordner>/meldungen --fall orkantief-ilka-verdichtung",
    "Alle Inhalte sind fiktiv. Laufprotokolle gehören nicht ins öffentliche Repository (docs/ERPROBUNG.md, Abschnitt 6).",
    "",
  ].join("\r\n");
}

/** ZIP mit Reihendatei, Übersicht, Laufprotokollen, Entwürfen und Vergleichen */
export async function reiheZip(reihe: Reihe, ergebnisse: EinzelErgebnis[]): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("LIESMICH.txt", liesmich(reihe, ergebnisse));
  zip.file("reihe.json", JSON.stringify(reihe, null, 2));
  zip.file("uebersicht.csv", "﻿" + csv(uebersichtZeilen(reihe, ergebnisse)));
  for (const e of ergebnisse) {
    zip.file(`laeufe/${e.lauf.id}.lauf.json`, JSON.stringify(ohneBase64(e.lauf), null, 2));
    if (e.meldung) zip.file(`meldungen/${e.lauf.id}.meldung.json`, JSON.stringify(e.meldung, null, 2));
    if (e.vergleichTabelle) zip.file(`vergleiche/${e.lauf.id}.vergleich.csv`, "﻿" + csv(e.vergleichTabelle));
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
