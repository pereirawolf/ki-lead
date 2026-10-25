// Vergleichslauf Ilka (seit 0.5.8): Verdichtung der sechs fiktiven Ländermeldungen zum Orkantief „Ilka“ mit einer
// festen Konfiguration von Modell und Aufwand, mehrfach hintereinander. Gleicher Fall, gleiches Beispielprofil
// (Koordinierungsstelle, Referenzraum Bevölkerungsschutz in Deutschland), gleicher Auftrag (t0 14.10.2026 14:00,
// ohne Websuche), S1-Vorschlag unverändert übernommen. Dieselben Funktionen wie die App und das Abnahmeskript M4
// (evaluation/abnahmen/m4.lauf.ts); das Skript nutzt die Prüfpunkte und die Reihendatei von hier.
//
// Ergebnis: je Lauf Laufprotokoll, Entwurf, Prüfpunkte T1–T8 der Abnahme M4 und Vergleich mit der Redaktionsfassung,
// dazu eine Reihendatei (ki-lead-abnahme/1) und eine Übersicht als CSV; als ZIP zum Weiterverarbeiten und zum
// Vergleich verschiedener Konfigurationen. Alle Inhalte sind fiktiv.
//
// Umfang (seit 0.5.12): „S1“, „S1 + S2“ und „S1 + S2 + S3“ aus den sechs Eingängen (Rohdaten), „S2 + S3“ mit dem
// Zuschnitt der Musterfassung als festem S1-Gegenstand; „MS“ aus der Musterfassung liegt in kurzfassungsreihe.ts.

import JSZip from "jszip";
import FALL from "../../evaluation/faelle/orkantief-ilka-verdichtung.json";
import PLAN from "../../evaluation/plaene/standardprofile-ilka.json";
import PLAN_MIX from "../../evaluation/plaene/anbietermix-ilka.json";
import PLAN_S2 from "../../evaluation/plaene/s2-isoliert-ilka.json";
import PLAN_MS from "../../evaluation/plaene/management-summary-ilka.json";
import S1_MUSTER from "../../evaluation/material/ilka-s1-zuschnitt-a.json";
import type { Aufwand, Fortschritt, LlmAnbieter } from "../anbieter/typen";
import { anbieterVon, type AnbieterId } from "../anbieter/verteiler";
import { migriere } from "../kern/migration";
import type { Meldung, Profil } from "../kern/typen";
import { pruefeGegenSchema } from "../kern/validierung";
import { sha256 } from "../profil/laden";
import { aufwandFuer, modellFuer, STANDARD_PROFILE, type Einstellungen, type Rolle } from "./einstellungen";
import { plausibilitaetPruefen, type PlausibilitaetsBefund } from "./plausibilitaet";
import { APP_KENNUNG, neuerLauf, ohneBase64, type Auftrag, type Lauf, type S1Vorschlag } from "./lauf";
import { dateiLesen, istVerdichtung, type Material } from "./material";
import { s1Strukturfehler, stufe1, stufe2und3, type Kontext } from "./stufen";
import { VERGLEICH_VERFAHREN, vergleiche, vergleichTabelle, zuordnungAus, type Vergleich } from "./vergleich";
import { reiheUmfang, UMFANG_VORGABE, umfangInfo, type Umfang } from "./vergleichsumfang";
import { eingangsquellenPruefen, type QuellenZuordnung } from "./vermerke";

export { reiheUmfang, rollenFuer, UMFAENGE, UMFANG_VORGABE, umfangInfo, type Umfang, type UmfangInfo } from "./vergleichsumfang";

export const FALL_ID: string = FALL.id;
export const FALL_TITEL: string = FALL.titel;
/** Ordner des Beispielprofils, aus dem Material und Redaktionsfassung stammen */
export const PROFIL_ORDNER = "lead-beispiel";
const PROFIL_PFAD = `profile/${PROFIL_ORDNER}/`;
/** Redaktionsfassung der Koordinierungsstelle (Bezug des Vergleichs), relativ zum Profilordner */
export const REFERENZ = "beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
export const ANZAHL_VORGABE = 3;
export const ANZAHL_MAX = 10;
/** Aufgaben, die ein Vergleichslauf nutzt (Umfang „S1 + S2 + S3“; je Umfang: rollenFuer) */
export const VERGLEICH_ROLLEN: Rolle[] = ["vorverarbeitung", "verdichtung", "reparatur"];

/** Zuschnitt der Musterfassung = fester S1-Gegenstand des Plans s2-isoliert-ilka (Datei und Prüfsumme) */
export const S1_ZUSCHNITT: { datei: string; sha256: string } = PLAN_S2.s1_fest;

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

/**
 * Variante eines Bewertungsplans unter evaluation/plaene/ (standardprofile-ilka: AV-2026-W43-04, -10;
 * anbietermix-ilka: -23; s2-isoliert-ilka nur S2; management-summary-ilka nur Management Summary)
 */
export interface PlanVariante {
  kennung: string;
  s1?: { modell: string; aufwand: Aufwand };
  s2?: { modell: string; aufwand: Aufwand };
  kurzfassung?: { modell: string; aufwand: Aufwand };
}

/** Bewertungsplan mit Varianten, die der Vergleichslauf anbietet */
export interface VergleichsPlan {
  id: string;
  wiederholungen: number;
  varianten: PlanVariante[];
  /** kurze Erklärung unter der Auswahl */
  kurz: string;
  /** Umfänge, für die der Plan gilt (seit 0.5.12) */
  umfaenge: Umfang[];
}

const ROHDATEN: Umfang[] = ["s1", "s1-s2", "s1-s2-s3"];

export const PLAN_STANDARDPROFILE: VergleichsPlan = {
  id: PLAN.id,
  wiederholungen: PLAN.wiederholungen,
  varianten: PLAN.varianten as unknown as PlanVariante[],
  kurz: "Die Varianten vergleichen die KI-Profile der Anbieter mit dem Bezug Anthropic (A).",
  umfaenge: ROHDATEN,
};

/**
 * Plan anbietermix-ilka (seit 0.5.11, AV-2026-W43-23): S1 und S2 von verschiedenen Anbietern nach der Auswertung je
 * Stufe vom 25.10.2026; Bezug bleibt Variante A des Plans standardprofile-ilka.
 */
export const PLAN_ANBIETERMIX: VergleichsPlan = {
  id: PLAN_MIX.id,
  wiederholungen: PLAN_MIX.wiederholungen,
  varianten: PLAN_MIX.varianten as unknown as PlanVariante[],
  kurz: "Die Varianten kombinieren Anbieter je Stufe (S1 OpenAI, S2 Anthropic); Bezug ist Variante A des Plans standardprofile-ilka.",
  umfaenge: ROHDATEN,
};

/** Plan s2-isoliert-ilka (LS-2026-W43-15, seit 0.5.12 in der App): Verdichtung mit dem Zuschnitt der Musterfassung */
export const PLAN_S2_ISOLIERT: VergleichsPlan = {
  id: PLAN_S2.id,
  wiederholungen: PLAN_S2.wiederholungen,
  varianten: PLAN_S2.varianten as unknown as PlanVariante[],
  kurz: "Die Varianten vergleichen die Verdichtungsmodelle bei festem Zuschnitt der Musterfassung; Bezug ist Variante A (Opus).",
  umfaenge: ["s2-s3"],
};

/** Plan management-summary-ilka (seit 0.5.12 in der App): Management Summary der Musterfassung je KI-Profil */
export const PLAN_MANAGEMENT_SUMMARY: VergleichsPlan = {
  id: PLAN_MS.id,
  wiederholungen: PLAN_MS.wiederholungen,
  varianten: PLAN_MS.varianten as unknown as PlanVariante[],
  kurz: "Die Varianten vergleichen die Management Summary derselben Musterfassung je KI-Profil.",
  umfaenge: ["ms"],
};

/** Pläne in der Auswahl des Vergleichslaufs (seit 0.5.11 mehrere, AV-2026-W43-24; seit 0.5.12 je Umfang) */
export const VERGLEICHS_PLAENE: VergleichsPlan[] = [PLAN_STANDARDPROFILE, PLAN_ANBIETERMIX, PLAN_S2_ISOLIERT, PLAN_MANAGEMENT_SUMMARY];

/** Pläne, deren Varianten für den Umfang wählbar sind */
export function plaeneFuer(u: Umfang): VergleichsPlan[] {
  return VERGLEICHS_PLAENE.filter((p) => p.umfaenge.includes(u));
}

/** Variante zu „<Plan>/<Kennung>“, z. B. „anbietermix-ilka/M1-luna-opus“; undefined, wenn es sie nicht gibt */
export function planVarianteZu(wert: string): { plan: VergleichsPlan; variante: PlanVariante } | undefined {
  const [planId, kennung] = wert.split("/");
  const plan = VERGLEICHS_PLAENE.find((p) => p.id === planId);
  const variante = plan?.varianten.find((v) => v.kennung === kennung);
  return plan && variante ? { plan, variante } : undefined;
}

/**
 * Fester S1-Gegenstand für den isolierten Vergleich der Verdichtung (LS-2026-W43-15, nur Evaluation): Statt S1 neu
 * laufen zu lassen, gilt dieser bestätigte Gegenstand in jedem Lauf. Datei und Prüfsumme gehen in die Reihendatei.
 * Die App nutzt das nicht; Aufruf über das Abnahmeskript (KI_LEAD_S1_FEST).
 */
export interface S1Fest {
  /** Pfad im Repository, z. B. evaluation/material/ilka-s1-zuschnitt-a.json */
  datei: string;
  sha256: string;
  vorschlag: S1Vorschlag;
}

/**
 * Prüft einen festen S1-Gegenstand gegen den Fall: Struktur wie ein S1-Vorschlag, t0 des Falls, nur Eingänge des
 * Falls und jeder Eingang mindestens einem Sachverhalt zugeordnet. Liefert die Befunde (leer = brauchbar).
 */
export function s1FestPruefen(v: unknown): string[] {
  const struktur = s1Strukturfehler(v);
  if (struktur) return [struktur];
  const x = v as S1Vorschlag;
  const befunde: string[] = [];
  if (x.meldezeitpunkt !== FALL.auftrag.meldezeitpunkt) befunde.push(`t0 ${x.meldezeitpunkt ?? "fehlt"} statt ${FALL.auftrag.meldezeitpunkt}`);
  const namen = new Set(FALL_MATERIAL.map((p) => p.split("/").pop()!));
  const zugeordnet = new Set<string>();
  x.sachverhalte.forEach((s, i) => {
    if (!Array.isArray(s.sops) || !s.sops.length) befunde.push(`Sachverhalt ${i + 1}: keine SOP`);
    if (!Array.isArray(s.ereignisarten) || !s.ereignisarten.length) befunde.push(`Sachverhalt ${i + 1}: keine Ereignisart`);
    for (const e of s.eingangsmeldungen ?? []) {
      if (!namen.has(e)) befunde.push(`Sachverhalt ${i + 1}: unbekannter Eingang ${e}`);
      zugeordnet.add(e);
    }
  });
  for (const n of namen) if (!zugeordnet.has(n)) befunde.push(`Eingang ${n} keinem Sachverhalt zugeordnet`);
  return befunde;
}

/**
 * Einstellungen für eine Plan-Variante: S1, S2 Verdichtung und Management Summary nach dem Plan, soweit die Variante
 * sie nennt; Reparatur nach dem Standard-Profil des S2-Anbieters (Aufwand „niedrig“); alles andere (z. B.
 * Mistral-Endpunkt) aus den Einstellungen.
 */
export function einstellungenFuerVariante(e: Einstellungen, v: PlanVariante): Einstellungen {
  const modelle = { ...e.modelle };
  const aufwand = { ...e.aufwand };
  if (v.s1) {
    modelle.vorverarbeitung = v.s1.modell;
    aufwand.vorverarbeitung = v.s1.aufwand;
  }
  if (v.s2) {
    const rep = STANDARD_PROFILE[anbieterVon(v.s2.modell)];
    modelle.verdichtung = v.s2.modell;
    aufwand.verdichtung = v.s2.aufwand;
    modelle.reparatur = rep.modelle.reparatur;
    aufwand.reparatur = rep.aufwand.reparatur;
  }
  if (v.kurzfassung) {
    modelle.kurzfassung = v.kurzfassung.modell;
    aufwand.kurzfassung = v.kurzfassung.aufwand;
  }
  return { ...e, modelle, aufwand };
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
    return { modell, aufwand: aufwandFuer(r, e, profil), anbieter: anbieterVon(modell) };
  };
  const k: Konfiguration = { s1: teil("vorverarbeitung"), s2: teil("verdichtung"), reparatur: teil("reparatur") };
  if ([k.s1, k.s2, k.reparatur].some((t) => t.anbieter === "mistral")) k.mistral_endpunkt = e.mistralEndpunkt ?? "eu";
  return k;
}

export type Pruefpunkt = { nr: string; erfuellt: boolean; angabe: string };

/**
 * Technische Prüfpunkte T1–T8 der Abnahme M4 (evaluation/plaene/2026-10-23-abnahme-m4.md). Mit festem S1-Gegenstand
 * (LS-2026-W43-15) gibt es keine S1-Anfrage; T5 prüft dann nur die Vermerke an S2. Im Umfang „S1“ (seit 0.5.12) gelten
 * nur T1, T2, T4, T5 und T6, bezogen auf S1 und den Vorschlag; T3, T7 und T8 setzen einen Entwurf voraus.
 */
export function pruefpunkte(
  l: Lauf,
  material: Material[],
  meldung: Meldung | undefined,
  quellen: QuellenZuordnung[],
  s1Fest = false,
  umfang: Umfang = s1Fest ? "s2-s3" : UMFANG_VORGABE,
): Pruefpunkt[] {
  const s1 = l.stufen.find((s) => s.stufe.startsWith("S1"));
  const s2 = l.stufen.find((s) => s.stufe === "S2 Verdichtung");
  const reparaturen = l.stufen.filter((s) => s.stufe.startsWith("S3 Reparatur")).length;
  const eingaenge = material.filter((m) => m.art === "eingang");
  const vermerk = "Vermerke der App aus dem Redaktionscheck";
  const stufenVollstaendig = l.stufen.every((s) => s.modell && s.aufwand && s.nutzung && typeof s.dauerMs === "number" && s.kostenUsd !== undefined);
  if (umfang === "s1") {
    const t6 = !!l.profil.hash && l.material.length === FALL_MATERIAL.length && l.material.every((m) => !!m.hash) && stufenVollstaendig;
    return [
      {
        nr: "T1",
        erfuellt: eingaenge.length === FALL_MATERIAL.length && istVerdichtung(material) && !!s1,
        angabe: `${eingaenge.length} Eingänge, Stufe „${s1?.stufe ?? "–"}“`,
      },
      { nr: "T2", erfuellt: l.status === "bestaetigen" && !!l.vorschlag, angabe: `Status ${l.status}${l.fehler ? `: ${l.fehler}` : ""}` },
      { nr: "T4", erfuellt: l.vorschlag?.meldezeitpunkt === FALL.auftrag.meldezeitpunkt, angabe: `t0 ${l.vorschlag?.meldezeitpunkt ?? "–"}` },
      {
        nr: "T5",
        erfuellt: !!s1 && !s1.anfrage?.werkzeuge && JSON.stringify(s1.anfrage?.nachrichten ?? "").includes("Vermerke der App"),
        angabe: `Werkzeuge in S1: ${s1?.anfrage?.werkzeuge ? "ja" : "nein"}; Vermerke an S1`,
      },
      { nr: "T6", erfuellt: t6, angabe: `${l.stufen.length} Stufen, Profil ${l.profil.version} (${l.profil.hash.slice(0, 12)}…)` },
    ];
  }
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
        (s1Fest ? !s1 : JSON.stringify(s1?.anfrage?.nachrichten ?? "").includes("Vermerke der App")),
      angabe: `Werkzeuge in S2: ${s2?.anfrage?.werkzeuge ? "ja" : "nein"}; ${s1Fest ? "S1 fest vorgegeben, Vermerke an S2" : "Vermerke an S1 und S2"}`,
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

/**
 * Kennzahlen eines Laufs für den Vergleich von Konfigurationen (AV-2026-W43-04): Zuschnitt, Vollständigkeit und
 * Abstand zur Redaktionsfassung. Kein Gesamtwert über die Kennzahlen.
 */
export interface Kennzahlen {
  sachverhalte: number;
  /** Anteil gesetzter Radarachsen über alle Sachverhalte (0–1) */
  achsen_gesetzt: number | null;
  /** Anteil der Sachverhalte mit Tendenz (0–1) */
  tendenz_gesetzt: number | null;
  /** Anteil gleicher Beurteilung bzw. Tendenz in den Paaren mit der Redaktionsfassung */
  beurteilung_gleich: number | null;
  tendenz_gleich: number | null;
  /** mittlere Ähnlichkeit der zugeordneten Sachverhalte */
  aehnlichkeit_mittel: number | null;
  /** mittlerer Betrag der Abweichung je Achse, wo KI und Redaktionsfassung einen Wert haben */
  achsen_abweichung_mittel: number | null;
  /** Anteil dieser Achsen mit höchstens einer Stufe Abstand */
  achsen_nah: number | null;
  plausibilitaet_befunde: number;
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const anteil = (z: number, n: number) => (n > 0 ? r3(z / n) : null);

export function kennzahlen(v: Vergleich | undefined, plausibilitaet: PlausibilitaetsBefund[]): Kennzahlen {
  const ki = (v?.paare ?? []).filter((p) => p.ki).map((p) => p.ki!);
  const werte = ki.flatMap((s) => Object.values(s.radar));
  const gepaart = (v?.paare ?? []).filter((p) => p.ki && p.ref);
  const diffs = gepaart.flatMap((p) => p.achsen.filter((a) => typeof a.diff === "number").map((a) => Math.abs(a.diff!)));
  return {
    sachverhalte: ki.length,
    achsen_gesetzt: anteil(werte.filter((w) => w !== null).length, werte.length),
    tendenz_gesetzt: anteil(ki.filter((s) => s.tendenz).length, ki.length),
    beurteilung_gleich: v ? anteil(v.beurteilung.gleich, v.beurteilung.n) : null,
    tendenz_gleich: v ? anteil(v.tendenz.gleich, v.tendenz.n) : null,
    aehnlichkeit_mittel: gepaart.length ? r3(gepaart.reduce((a, p) => a + p.aehnlichkeit, 0) / gepaart.length) : null,
    achsen_abweichung_mittel: diffs.length ? r3(diffs.reduce((a, b) => a + b, 0) / diffs.length) : null,
    achsen_nah: anteil(diffs.filter((d) => d <= 1).length, diffs.length),
    plausibilitaet_befunde: plausibilitaet.length,
  };
}

/** Zuschnitt der Musterfassung als S1-Vorschlag (evaluation/material/ilka-s1-zuschnitt-a.json) */
export const S1_MUSTER_VORSCHLAG = S1_MUSTER as unknown as S1Vorschlag;

/**
 * Vergleich eines S1-Vorschlags mit dem Zuschnitt der Musterfassung (seit 0.5.12): Zahl, Reihenfolge und Ereignisarten
 * der Sachverhalte, Zuordnung der Eingänge und SOP-Auswahl. Kein Gesamtwert; ein anderer Zuschnitt kann fachlich
 * vertretbar sein (evaluation/bewertungshilfen/orkantief-ilka.md).
 */
export interface S1Vergleich {
  sachverhalte: number;
  /** gleiche Zahl der Sachverhalte und je Position dieselben Ereignisarten wie die Musterfassung */
  gliederung_wie_muster: boolean;
  /** je Position dieselben Eingänge wie die Musterfassung */
  zuordnung_wie_muster: boolean;
  /** Eingänge des Falls, die mindestens einem Sachverhalt zugeordnet sind */
  eingaenge_zugeordnet: number;
  /** Anteil der SOPs und Bausteine der Musterfassung (alle Sachverhalte), die der Vorschlag ebenfalls wählt (0–1) */
  sop_abdeckung: number | null;
  /** SOPs und Bausteine des Vorschlags, die die Musterfassung nicht wählt */
  sops_zusaetzlich: string[];
  /** SOPs und Bausteine der Musterfassung, die dem Vorschlag fehlen */
  sops_fehlend: string[];
  /** Befunde wie beim festen Gegenstand (t0, unbekannte oder nicht zugeordnete Eingänge, Sachverhalt ohne SOP) */
  befunde: string[];
}

const menge = (xs: string[] | undefined) => [...new Set((xs ?? []).map((x) => x.toLowerCase()))].sort().join("|");

export function s1Vergleich(v: S1Vorschlag | undefined, muster: S1Vorschlag = S1_MUSTER_VORSCHLAG): S1Vergleich | null {
  if (!v || s1Strukturfehler(v)) return null;
  const m = muster.sachverhalte;
  const gleicheZahl = v.sachverhalte.length === m.length;
  const sops = (x: S1Vorschlag) => new Set(x.sachverhalte.flatMap((s) => (s.sops ?? []).map((id) => id.toLowerCase())));
  const soll = sops(muster);
  const ist = sops(v);
  const namen = new Set(FALL_MATERIAL.map((p) => p.split("/").pop()!));
  return {
    sachverhalte: v.sachverhalte.length,
    gliederung_wie_muster: gleicheZahl && v.sachverhalte.every((s, i) => menge(s.ereignisarten) === menge(m[i].ereignisarten)),
    zuordnung_wie_muster: gleicheZahl && v.sachverhalte.every((s, i) => menge(s.eingangsmeldungen) === menge(m[i].eingangsmeldungen)),
    eingaenge_zugeordnet: new Set(v.sachverhalte.flatMap((s) => s.eingangsmeldungen ?? []).filter((n) => namen.has(n))).size,
    sop_abdeckung: anteil([...soll].filter((x) => ist.has(x)).length, soll.size),
    sops_zusaetzlich: [...ist].filter((x) => !soll.has(x)).sort(),
    sops_fehlend: [...soll].filter((x) => !ist.has(x)).sort(),
    befunde: s1FestPruefen(v),
  };
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
  /** seit 0.5.8: Kennzahlen für den Vergleich der Konfigurationen und Plausibilitätsprüfung der Zahlen */
  kennzahlen: Kennzahlen;
  /** seit 0.5.12: S1-Vorschlag gegenüber dem Zuschnitt der Musterfassung; fehlt, wenn S1 nicht lief */
  s1_vergleich?: S1Vergleich | null;
  plausibilitaet: PlausibilitaetsBefund[];
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
  /** fester S1-Gegenstand statt S1 (LS-2026-W43-15, nur Evaluation) */
  s1Fest?: S1Fest;
  /**
   * Umfang (seit 0.5.12); ohne Angabe „S1 + S2 + S3“, mit festem S1-Gegenstand „S2 + S3“. „S2 + S3“ verlangt s1Fest,
   * „MS“ läuft über kurzfassungsreihe.ts.
   */
  umfang?: Umfang;
}

/** Wirksamer Umfang eines Laufs oder einer Reihe; prüft, ob er zum festen Gegenstand passt */
export function umfangPruefen(umfang: Umfang | undefined, s1Fest: S1Fest | undefined): Umfang {
  const u = umfang ?? (s1Fest ? "s2-s3" : UMFANG_VORGABE);
  if (u === "ms") throw new Error("Die Management Summary läuft über kurzfassungsreihe, nicht über einLauf.");
  if (u === "s2-s3" && !s1Fest) throw new Error("Der Umfang „S2 + S3“ braucht einen festen S1-Gegenstand.");
  if (u !== "s2-s3" && s1Fest) throw new Error(`Ein fester S1-Gegenstand passt nur zum Umfang „S2 + S3“, nicht zu „${umfangInfo(u).titel}“.`);
  return u;
}

/**
 * Ein Lauf: S1, unveränderte Bestätigung, S2 Verdichtung (mit S3 bei Bedarf), Quellenprüfung, Vergleich. Mit
 * festem S1-Gegenstand entfällt S1; der Gegenstand wird unverändert bestätigt. Im Umfang „S1“ endet der Lauf nach dem
 * Vorschlag (Status „bestaetigen“), im Umfang „S1 + S2“ ohne KI-Aufrufe in S3.
 */
export async function einLauf(o: LaufOptionen): Promise<EinzelErgebnis> {
  const { daten, einstellungen } = o;
  const umfang = umfangPruefen(o.umfang, o.s1Fest);
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
    let vorschlag: S1Vorschlag;
    if (o.s1Fest) {
      const befunde = s1FestPruefen(o.s1Fest.vorschlag);
      if (befunde.length) throw new Error(`Fester S1-Gegenstand ${o.s1Fest.datei} unbrauchbar: ${befunde.join("; ")}`);
      vorschlag = structuredClone(o.s1Fest.vorschlag);
      lauf.vorschlag = vorschlag;
      lauf.status = "bestaetigen";
      await k.aktualisiert(lauf);
    } else vorschlag = await stufe1(k);
    if (umfang !== "s1") {
      // Bestätigung ohne Eingriff: Vorschlag unverändert, keine vorgeschlagene Prüffrage übernommen (wie in der App ohne Änderung)
      const e = await stufe2und3(k, structuredClone(vorschlag), { ohneS3: umfang === "s1-s2" });
      meldung = e.meldung ?? undefined;
    }
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

  const punkte = pruefpunkte(lauf, material, meldung, quellen, !!o.s1Fest, umfang);
  const plausibilitaet = meldung ? plausibilitaetPruefen(meldung) : [];
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
      ...(o.s1Fest ? { s1_fest: { datei: o.s1Fest.datei, sha256: o.s1Fest.sha256 } } : {}),
      quellen,
      schemabefunde_endfassung: meldung ? pruefeGegenSchema(profil.schema, meldung, profil.ui).length : null,
      befunde: lauf.ergebnis?.befunde ?? [],
      vergleich: lauf.vergleich?.ergebnis
        ? {
            paare: lauf.vergleich.ergebnis.paare.map((p) => ({
              ki: p.ki?.bezeichnung ?? null,
              ref: p.ref?.bezeichnung ?? null,
              ref_index: p.ref?.index ?? null,
              aehnlichkeit: p.aehnlichkeit,
              ki_beurteilung: p.ki?.beurteilung ?? null,
              ki_tendenz: p.ki?.tendenz ?? null,
              ki_radar: p.ki?.radar ?? null,
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
    kennzahlen: kennzahlen(lauf.vergleich?.ergebnis, plausibilitaet),
    ...(o.s1Fest ? {} : { s1_vergleich: s1Vergleich(lauf.vorschlag) }),
    plausibilitaet,
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
  /** „app“ (Einstellungen → Testläufe) oder „skript“ (evaluation/abnahmen/m4.lauf.ts) */
  quelle: "app" | "skript";
  /** Variante eines Bewertungsplans, z. B. „standardprofile-ilka/A-anthropic-standard“ */
  variante?: string;
  /**
   * Umfang (seit 0.5.12); fehlt in älteren Reihendateien: dann „s1-s2-s3“, mit s1_fest „s2-s3“. Die Konfiguration
   * unter `modelle` nennt alle Aufgaben, auch die, die der Umfang nicht nutzt.
   */
  umfang?: Exclude<Umfang, "ms">;
  /** fester S1-Gegenstand statt S1 (LS-2026-W43-15) */
  s1_fest?: { datei: string; sha256: string };
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
  variante?: string;
  s1Fest?: S1Fest;
  umfang?: Umfang;
}): Reihe {
  const umfang = umfangPruefen(o.umfang, o.s1Fest) as Exclude<Umfang, "ms">;
  const k = konfiguration(o.einstellungen, o.daten.profil);
  const summe = o.ergebnisse.reduce((s, e) => s + (e.lauf.kostenUsd ?? e.lauf.kostenBekanntUsd ?? 0), 0);
  const { mistral_endpunkt, ...modelle } = k;
  return {
    format: "ki-lead-abnahme/1",
    plan: PLAN_M4,
    quelle: o.quelle,
    ...(o.variante ? { variante: o.variante } : {}),
    umfang,
    ...(o.s1Fest ? { s1_fest: { datei: o.s1Fest.datei, sha256: o.s1Fest.sha256 } } : {}),
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
  variante?: string;
  s1Fest?: S1Fest;
  /** Umfang (seit 0.5.12), siehe LaufOptionen */
  umfang?: Umfang;
}

/** Anzahl der Läufe auf 1 … ANZAHL_MAX begrenzt */
export function anzahlBegrenzt(n: unknown): number {
  const z = Math.floor(Number(n));
  return Number.isFinite(z) ? Math.max(1, Math.min(ANZAHL_MAX, z)) : ANZAHL_VORGABE;
}

/** Führt die Reihe aus; bei Abbruch oder erreichter Budgetgrenze endet sie mit den bisherigen Läufen. */
export async function vergleichsreihe(o: ReihenOptionen): Promise<{ reihe: Reihe; ergebnisse: EinzelErgebnis[] }> {
  const umfang = umfangPruefen(o.umfang, o.s1Fest);
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
    let stufe = o.s1Fest ? "S2 Verdichtung" : "S1";
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
      s1Fest: o.s1Fest,
      umfang,
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
    variante: o.variante,
    s1Fest: o.s1Fest,
    umfang,
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

/** Übersicht im Umfang „S1“: eine Zeile je Sachverhalt des Vorschlags, mit dem Vergleich zum Zuschnitt der Musterfassung */
function s1UebersichtZeilen(reihe: Reihe, ergebnisse: EinzelErgebnis[]): unknown[][] {
  const kopf = [
    "lauf",
    "variante",
    "status",
    "technisch_bestanden",
    "s1_modell",
    "s1_aufwand",
    "mistral_endpunkt",
    "s1_dauer_s",
    "s1_ausgabetoken",
    "kosten_usd",
    "sachverhalte",
    "gliederung_wie_muster",
    "zuordnung_wie_muster",
    "eingaenge_zugeordnet",
    "sop_abdeckung",
    "sops_zusaetzlich",
    "sops_fehlend",
    "befunde",
    "sv",
    "sv_titel",
    "ereignisarten",
    "sops",
    "eingaenge",
  ];
  const ja = (b: boolean | undefined) => (b === undefined ? null : b ? "ja" : "nein");
  const zeilen: unknown[][] = [kopf];
  for (const e of ergebnisse) {
    const st = e.eintrag.stufen.find((s) => s.stufe.startsWith("S1"));
    const v = e.eintrag.s1_vergleich ?? undefined;
    const basis = [
      e.lauf.id,
      reihe.variante ?? "",
      e.lauf.status,
      e.eintrag.technisch_bestanden ? "ja" : "nein",
      reihe.modelle.s1.modell,
      reihe.modelle.s1.aufwand,
      reihe.modelle.s1.anbieter === "mistral" ? (reihe.mistral_endpunkt ?? "") : "",
      st?.dauer_s ?? null,
      st?.ausgabetoken ?? null,
      e.lauf.kostenUsd ?? e.lauf.kostenBekanntUsd ?? null,
      v?.sachverhalte ?? null,
      ja(v?.gliederung_wie_muster),
      ja(v?.zuordnung_wie_muster),
      v?.eingaenge_zugeordnet ?? null,
      v?.sop_abdeckung ?? null,
      v?.sops_zusaetzlich.join(", ") ?? null,
      v?.sops_fehlend.join(", ") ?? null,
      v?.befunde.join("; ") ?? null,
    ];
    const svs = e.lauf.vorschlag?.sachverhalte ?? [];
    if (!svs.length) zeilen.push([...basis, null, null, null, null, null]);
    svs.forEach((s, i) =>
      zeilen.push([...basis, i + 1, s.titel, (s.ereignisarten ?? []).join(", "), (s.sops ?? []).join(", "), (s.eingangsmeldungen ?? []).length]),
    );
  }
  return zeilen;
}

/**
 * Übersicht der Reihe: eine Zeile je Sachverhalt eines Laufs, mit Konfiguration und Kennzahlen (Semikolon,
 * Dezimalkomma). Im Umfang „S1“ eine Zeile je Sachverhalt des S1-Vorschlags.
 */
export function uebersichtZeilen(reihe: Reihe, ergebnisse: EinzelErgebnis[]): unknown[][] {
  if (reiheUmfang(reihe) === "s1") return s1UebersichtZeilen(reihe, ergebnisse);
  const RADAR = radarAchsen(ergebnisse);
  const kopf = [
    "lauf",
    "variante",
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
    "plausibilitaet_befunde",
    "sachverhalte",
    "sv",
    "sv_bezeichnung",
    "beurteilung",
    "tendenz",
    ...RADAR,
    "ref_gegenstueck",
    "aehnlichkeit",
    "umfang",
  ];
  const zeilen: unknown[][] = [kopf];
  for (const e of ergebnisse) {
    const st = (p: string) => e.eintrag.stufen.find((s) => s.stufe.startsWith(p));
    const basis = [
      e.lauf.id,
      reihe.variante ?? "",
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
      e.eintrag.kennzahlen.plausibilitaet_befunde,
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
        reiheUmfang(reihe),
      ]);
    });
  }
  return zeilen;
}

/** Teil eines Dateinamens: nur Buchstaben, Ziffern, Punkt und Bindestrich */
export const dateiKurz = (s: string) =>
  s
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** Zeitstempel für Dateinamen in Ortszeit, z. B. 20261024-2130 */
export function dateiStempel(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Kennzeichen des Umfangs im Dateinamen; die ganze Kette (Vorgabe) bleibt ohne, wie bis 0.5.11 */
const UMFANG_DATEI: Record<Exclude<Umfang, "ms">, string> = { s1: "S1_", "s1-s2": "S1-S2_", "s1-s2-s3": "", "s2-s3": "S2-S3-Muster_" };

/**
 * Dateiname der ZIP-Datei, z. B. KI-LEAD_Testlauf_Ilka_mistral-medium-3-5-high_20261024-2130.zip; mit Umfang
 * z. B. KI-LEAD_Testlauf_Ilka_S1_gpt-6-luna-high_… (bis 0.5.16 KI-LEAD_Vergleichslauf_Ilka_…) (benannt nach dem Modell der ersten genutzten Stufe)
 */
export function zipDateiname(reihe: Reihe): string {
  const u = reiheUmfang(reihe);
  const variante = reihe.variante ? `${dateiKurz(reihe.variante.split("/").pop()!)}_` : "";
  const m = u === "s1" ? reihe.modelle.s1 : reihe.modelle.s2;
  return `KI-LEAD_Testlauf_Ilka_${UMFANG_DATEI[u]}${variante}${dateiKurz(`${m.modell}-${m.aufwand}`)}_${dateiStempel(reihe.erstellt)}.zip`;
}

function liesmich(reihe: Reihe, ergebnisse: EinzelErgebnis[]): string {
  const m = reihe.modelle;
  const u = reiheUmfang(reihe);
  const stufen = [
    u !== "s2-s3" ? `S1: ${m.s1.modell} (${m.s1.aufwand})` : "",
    u !== "s1" ? `S2 Verdichtung: ${m.s2.modell} (${m.s2.aufwand})` : "",
    u === "s1-s2-s3" || u === "s2-s3" ? `Reparatur: ${m.reparatur.modell} (${m.reparatur.aufwand})` : "",
  ].filter(Boolean);
  const punkte = u === "s1" ? "T1, T2, T4–T6" : "T1–T8";
  return [
    `KI-LEAD – Testlauf Ilka: ${umfangInfo(u).titel} (${FALL_TITEL})`,
    "",
    `Erstellt: ${reihe.erstellt} mit ${reihe.app}, Profil ${reihe.profil.id} ${reihe.profil.version} (${reihe.profil.hash.slice(0, 12)}…)`,
    ...(reihe.variante ? [`Variante: ${reihe.variante}`] : []),
    `Fall: ${reihe.fall} (evaluation/faelle/${reihe.fall}.json); t0 ${FALL.auftrag.meldezeitpunkt}, ohne Websuche, ${
      reihe.s1_fest
        ? `S1-Gegenstand fest vorgegeben (${reihe.s1_fest.datei}, ${reihe.s1_fest.sha256.slice(0, 12)}…)`
        : u === "s1"
          ? `nur S1; Vergleich mit dem Zuschnitt der Musterfassung (${S1_ZUSCHNITT.datei})`
          : "S1-Vorschlag unverändert übernommen"
    }${u === "s1-s2" ? "; ohne S3 (keine Vervollständigung, keine Reparatur)" : ""}.`,
    stufen.join(" · ") + (reihe.mistral_endpunkt ? ` · Mistral-Endpunkt: ${reihe.mistral_endpunkt}` : ""),
    `Läufe: ${ergebnisse.length} von ${reihe.laeufe_geplant}${reihe.beendet ? ` (${reihe.beendet})` : ""}; technisch bestanden (${punkte}): ${reihe.technisch_bestanden}; Kosten zusammen ${reihe.kosten_usd_summe} USD (Listenpreise, ohne Gewähr).`,
    "",
    "Inhalt:",
    ...(u === "s1"
      ? [
          "- reihe.json: Reihendatei (Format ki-lead-abnahme/1, umfang „s1“) mit Prüfpunkten, Kennzahlen je Stufe und dem Vergleich mit dem Zuschnitt der Musterfassung (s1_vergleich)",
          "- uebersicht.csv: eine Zeile je Sachverhalt des S1-Vorschlags und Lauf (Semikolon, Dezimalkomma)",
          "- laeufe/<lauf>.lauf.json: vollständige Laufprotokolle (ki-lead-lauf/1) mit Prompt, Rohantwort, Token, Dauer und Kosten",
          "- s1/<lauf>.s1.json: S1-Vorschläge",
        ]
      : [
          "- reihe.json: Reihendatei (Format ki-lead-abnahme/1) mit Prüfpunkten, Kennzahlen je Stufe und je Lauf, Plausibilitätsbefunden, Kurzantwort und Entwurf",
          "- uebersicht.csv: eine Zeile je Sachverhalt und Lauf (Semikolon, Dezimalkomma), zum Vergleich mehrerer Konfigurationen",
          "- laeufe/<lauf>.lauf.json: vollständige Laufprotokolle (ki-lead-lauf/1) mit Prompts, Rohantworten, Token, Dauer und Kosten",
          "- meldungen/<lauf>.meldung.json: Entwürfe (LEAD-Meldung-v1)",
          "- vergleiche/<lauf>.vergleich.csv: Vergleich mit der Redaktionsfassung je Sachverhalt und Achse",
          "",
          "Vergleich mehrerer Konfigurationen im Repository: npm run vergleichslauf:auswerten -- <ZIP-Dateien> (Bezug: KI-Profil Anthropic)",
          "Mehrfachvergleich der Entwürfe im Repository: npm run vergleich:mehrfach -- <entpackter Ordner>/meldungen --fall orkantief-ilka-verdichtung",
        ]),
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
    if (reiheUmfang(reihe) === "s1" && e.lauf.vorschlag) zip.file(`s1/${e.lauf.id}.s1.json`, JSON.stringify(e.lauf.vorschlag, null, 2));
    if (e.vergleichTabelle) zip.file(`vergleiche/${e.lauf.id}.vergleich.csv`, "﻿" + csv(e.vergleichTabelle));
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
