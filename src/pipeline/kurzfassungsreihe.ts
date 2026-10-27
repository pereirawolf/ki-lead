// Testlauf „Management Summary (aus Musterfassung)“ (bis 0.5.16 „Vergleichslauf MS“, seit 0.5.12): Management Summary der festen Musterfassung Ilka, mehrfach
// hintereinander mit derselben Konfiguration (Plan evaluation/plaene/management-summary-ilka.json, Fall
// evaluation/faelle/ilka-management-summary.json). Jeder Lauf ist ein Aufruf über dieselbe Funktion wie die App
// (kurzfassungErstellen); die Musterfassung wird vor dem ersten Aufruf gegen die Prüfsumme des Plans geprüft.
//
// Genutzt von „Einstellungen → Testläufe“ und vom Skript
// evaluation/abnahmen/kurzfassung.lauf.ts. Die Vorprüfung liefert Beobachtungen für die Prüfung von Hand, kein
// Bestehen und keine Note. Alle Inhalte sind fiktiv.

import JSZip from "jszip";
import FALL from "../../evaluation/faelle/ilka-management-summary.json";
import PLAN from "../../evaluation/plaene/management-summary-ilka.json";
import type { LlmAnbieter } from "../anbieter/typen";
import { anbieterVon, type AnbieterId } from "../anbieter/verteiler";
import { migriere } from "../kern/migration";
import type { Meldung, Profil } from "../kern/typen";
import { sha256 } from "../profil/laden";
import { aufwandFuer, modellFuer, type Einstellungen } from "./einstellungen";
import { GRENZEN, kurzfassungErstellen, woerter, type KurzfassungStruktur } from "./kurzfassung";
import { APP_KENNUNG, laufId, type StufenEintrag } from "./lauf";
import { anzahlBegrenzt, type ReiheStand } from "./vergleichslauf";
import { csv, dateiKurz, dateiStempel } from "./vergleichslauf-export";

export const MS_PLAN_ID: string = PLAN.id;
export const MS_FALL_ID: string = FALL.id;
/** Feste Musterfassung des Plans (Pfad im Repository und Prüfsumme) */
export const MUSTERFASSUNG: { datei: string; sha256: string } = PLAN.meldung_fest;
/** Eingabetoken eines Aufrufs für die Schätzung vor dem Start: Arbeitsanweisung und Musterfassung (rund 30 000 Zeichen) */
export const MS_EINGABE_TOKEN = 12_000;

// ── Vorprüfung (bis 0.5.11 in evaluation/abnahmen/kurzfassung.pruefung.ts) ─────────────────────────────────────────

export interface KurzfassungBeobachtung {
  /** Wörter in Kernaussage und Abschnitten (seit 0.5.15 höchstens 180) */
  woerter: number;
  /** über der Obergrenze der App */
  zu_lang: boolean;
  /** ein Kurztitel je Sachverhalt der Musterfassung */
  kurztitel_passend: boolean;
  /** 20.700 genannt, aber nicht als Mindestwert gekennzeichnet */
  mindestwert_fehlt: boolean;
  /** Gesamtzahl mit Hochrechnung (rund 28.500 bis 30.400, „29.000“) ohne Kennzeichnung als Hochrechnung oder Schätzung */
  hochrechnung_ungekennzeichnet: boolean;
  /** Nachbetankung als erledigt dargestellt; die Musterfassung belegt keinen Vollzug */
  nachbetankung_als_erledigt: boolean;
  /** Quellenmarker, URL oder Radarwert im Text */
  marker_im_text: boolean;
  /**
   * Kernaussage beginnt mit „Klärungsbedarf“ (seit 0.5.16, AV-2026-W43-41). Die Musterfassung enthält keinen wesentlichen
   * Widerspruch, der den Kennsatz trüge. Fehlt in Reihendateien vor 0.5.16.
   */
  klaerungsbedarf?: boolean;
}

/** Zahl der Sachverhalte der Musterfassung */
export const SACHVERHALTE_MUSTER = 2;

export function kurzfassungPruefen(k: KurzfassungStruktur): KurzfassungBeobachtung {
  const teile = [k.kernaussage, ...Object.values(k.abschnitte)];
  const text = teile.join("\n");
  const n = teile.reduce((s, t) => s + woerter(t), 0);
  const saetze = text.split(/(?<=[.!?])\s+/);
  const mitZahl = saetze.filter((s) => /20\.700/.test(s));
  const gesamt = saetze.filter((s) => /\b(?:28\.500|29\.000|29\.400|30\.400)\b/.test(s));
  return {
    woerter: n,
    zu_lang: n > GRENZEN.woerterGesamt,
    kurztitel_passend: k.kurztitel.length === SACHVERHALTE_MUSTER,
    mindestwert_fehlt: mitZahl.some((s) => !/mindestens|Mindestwert|wenigstens/i.test(s)),
    hochrechnung_ungekennzeichnet: gesamt.some((s) => !/hochgerechnet|Hochrechnung|geschätzt|Schätzung|einschließlich/i.test(s)),
    nachbetankung_als_erledigt: /Nachbetankung\s+(?:ist|wurde|wird)\s+(?:bereits\s+)?(?:gesichert|sichergestellt|erfolgt|abgeschlossen)/i.test(text),
    marker_im_text: /\[Q\d|https?:\/\/|\bD[1-8]\s*=/.test(text),
    klaerungsbedarf: /^\s*Klärungsbedarf/i.test(k.kernaussage),
  };
}

/** Auffälligkeiten einer Vorprüfung in Worten (leer = keine); keine Bewertung, nur Anlass zur Prüfung von Hand */
export function auffaelligkeiten(b: KurzfassungBeobachtung): string[] {
  return [
    b.zu_lang ? `${b.woerter} Wörter (höchstens ${GRENZEN.woerterGesamt})` : "",
    b.kurztitel_passend ? "" : `Kurztitel nicht je Sachverhalt (${SACHVERHALTE_MUSTER} erwartet)`,
    b.mindestwert_fehlt ? "20.700 ohne Kennzeichnung als Mindestwert" : "",
    b.hochrechnung_ungekennzeichnet ? "Gesamtzahl mit Hochrechnung ungekennzeichnet" : "",
    b.nachbetankung_als_erledigt ? "Nachbetankung als erledigt dargestellt" : "",
    b.marker_im_text ? "Quellenmarker, URL oder Radarwert im Text" : "",
    b.klaerungsbedarf ? "Kernaussage mit „Klärungsbedarf“ ohne Widerspruch in der Musterfassung" : "",
  ].filter(Boolean);
}

// ── Musterfassung ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Musterfassung als Text, wie sie im Repository liegt */
export interface Musterfassung {
  datei: string;
  sha256: string;
  text: string;
}

/** Prüft den Text gegen die Prüfsumme des Plans; liefert die Musterfassung oder wirft mit Hinweis auf den Plan. */
export async function musterfassungAus(text: string): Promise<Musterfassung> {
  const summe = await sha256(text);
  if (summe !== MUSTERFASSUNG.sha256)
    throw new Error(
      `Die Musterfassung ${MUSTERFASSUNG.datei} weicht von der Prüfsumme des Plans ${MS_PLAN_ID} ab (${summe.slice(0, 12)}… statt ${MUSTERFASSUNG.sha256.slice(0, 12)}…). Nach einer Änderung ist der Plan fortzuschreiben.`,
    );
  return { datei: MUSTERFASSUNG.datei, sha256: summe, text };
}

/** Musterfassung als Meldung des Profils (migriert wie eine geladene Meldung) */
export function musterMeldung(m: Musterfassung, profil: Profil): Meldung {
  return migriere(JSON.parse(m.text), profil).daten;
}

// ── Reihe ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface KurzfassungsEintrag {
  nr: number;
  /** Kennung des Laufs wie bei den anderen Vergleichsläufen, z. B. 20261025-031500-ab12 */
  lauf: string;
  variante: string | null;
  status: "fertig" | "fehler" | "abgebrochen";
  modell: string;
  aufwand: string;
  fehler: string | null;
  kosten_usd: number | null;
  dauer_s: number | null;
  eingabetoken: number | null;
  ausgabetoken: number | null;
  stop: string | null;
  hinweise_app: string[];
  vorpruefung: KurzfassungBeobachtung | null;
  auffaelligkeiten: string[];
  struktur: KurzfassungStruktur | null;
  text: string | null;
}

export interface KurzfassungsErgebnis {
  eintrag: KurzfassungsEintrag;
  /** Anfrage, Antwort, Token, Dauer und Kosten des Aufrufs (wie ein Stufeneintrag im Laufprotokoll) */
  protokoll?: StufenEintrag;
}

/** Reihendatei der Management Summary (ohne Schlüssel) */
export interface KurzfassungsReihe {
  format: "ki-lead-kurzfassung-reihe/1";
  plan: string;
  /** „app“ (Einstellungen → Testläufe) oder „skript“ (evaluation/abnahmen/kurzfassung.lauf.ts) */
  quelle: "app" | "skript";
  /** Umfang des Testlaufs, immer „ms“ */
  umfang: "ms";
  variante: string | null;
  fall: string;
  meldung: { datei: string; sha256: string };
  erstellt: string;
  app: string;
  profil: { id: string; version: string; hash: string };
  anbieter: AnbieterId;
  mistral_endpunkt?: string;
  attrappe: boolean;
  modell: { modell: string; aufwand: string };
  laeufe_geplant: number;
  /** Läufe mit Kurzfassung und ohne Auffälligkeit der Vorprüfung */
  ohne_auffaelligkeit: number;
  kosten_usd_summe: number;
  beendet?: string;
  laeufe: KurzfassungsEintrag[];
}

export interface KurzfassungsReihenOptionen {
  profil: Profil;
  musterfassung: Musterfassung;
  anbieter: LlmAnbieter;
  einstellungen: Einstellungen;
  anzahl: number;
  budgetUsd?: number;
  signal?: AbortSignal;
  stand?: (s: ReiheStand) => void;
  attrappe?: boolean;
  quelle?: "app" | "skript";
  variante?: string;
}

const STUFE = "Management Summary";

/** Führt die Reihe aus; bei Abbruch oder erreichter Budgetgrenze endet sie mit den bisherigen Läufen. */
export async function kurzfassungsreihe(o: KurzfassungsReihenOptionen): Promise<{ reihe: KurzfassungsReihe; ergebnisse: KurzfassungsErgebnis[] }> {
  const anzahl = anzahlBegrenzt(o.anzahl);
  const p = o.profil;
  const meldung = musterMeldung(o.musterfassung, p);
  const modell = modellFuer("kurzfassung", o.einstellungen, p);
  const aufwand = aufwandFuer("kurzfassung", o.einstellungen, p);
  const ergebnisse: KurzfassungsErgebnis[] = [];
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
    o.stand?.({ nr, anzahl, stufe: STUFE, zeichen: 0, kostenUsd: bisher });
    const id = laufId();
    const start = Date.now();
    let e: KurzfassungsEintrag;
    let protokoll: StufenEintrag | undefined;
    try {
      const k = await kurzfassungErstellen(p, meldung, o.anbieter, o.einstellungen, o.signal);
      protokoll = k.eintrag;
      const vorpruefung = kurzfassungPruefen(k.struktur);
      e = {
        nr,
        lauf: id,
        variante: o.variante ?? null,
        status: "fertig",
        modell: k.eintrag.modell ?? modell,
        aufwand: k.eintrag.aufwand ?? aufwand,
        fehler: null,
        kosten_usd: k.eintrag.kostenUsd ?? null,
        dauer_s: k.eintrag.dauerMs !== undefined ? Math.round(k.eintrag.dauerMs / 100) / 10 : null,
        eingabetoken: k.eintrag.nutzung ? k.eintrag.nutzung.eingabe + k.eintrag.nutzung.cacheLesen + k.eintrag.nutzung.cacheSchreiben : null,
        ausgabetoken: k.eintrag.nutzung?.ausgabe ?? null,
        stop: k.eintrag.antwort?.stopGrund ?? null,
        hinweise_app: k.hinweise,
        vorpruefung,
        auffaelligkeiten: auffaelligkeiten(vorpruefung),
        struktur: k.struktur,
        text: k.text,
      };
    } catch (err) {
      const abgebrochen = !!o.signal?.aborted;
      e = {
        nr,
        lauf: id,
        variante: o.variante ?? null,
        status: abgebrochen ? "abgebrochen" : "fehler",
        modell,
        aufwand,
        fehler: abgebrochen ? "Vom Nutzer abgebrochen" : String((err as Error)?.message || err),
        kosten_usd: null,
        dauer_s: Math.round((Date.now() - start) / 100) / 10,
        eingabetoken: null,
        ausgabetoken: null,
        stop: null,
        hinweise_app: [],
        vorpruefung: null,
        auffaelligkeiten: [],
        struktur: null,
        text: null,
      };
    }
    ergebnisse.push({ eintrag: e, protokoll });
    bisher += e.kosten_usd ?? 0;
    if (e.status === "abgebrochen") {
      beendet = "abgebrochen";
      break;
    }
  }
  const { mistralEndpunkt } = o.einstellungen;
  const anbieter = anbieterVon(modell);
  const reihe: KurzfassungsReihe = {
    format: "ki-lead-kurzfassung-reihe/1",
    plan: MS_PLAN_ID,
    quelle: o.quelle ?? "app",
    umfang: "ms",
    variante: o.variante ?? null,
    fall: MS_FALL_ID,
    meldung: { datei: o.musterfassung.datei, sha256: o.musterfassung.sha256 },
    erstellt: new Date().toISOString(),
    app: APP_KENNUNG,
    profil: { id: p.manifest.id, version: p.manifest.version, hash: p.hash },
    anbieter,
    ...(anbieter === "mistral" ? { mistral_endpunkt: mistralEndpunkt ?? "eu" } : {}),
    attrappe: !!o.attrappe,
    modell: { modell, aufwand },
    laeufe_geplant: anzahl,
    ohne_auffaelligkeit: ergebnisse.filter((x) => x.eintrag.status === "fertig" && !x.eintrag.auffaelligkeiten.length).length,
    kosten_usd_summe: Math.round(bisher * 10000) / 10000,
    ...(beendet ? { beendet } : {}),
    laeufe: ergebnisse.map((x) => x.eintrag),
  };
  return { reihe, ergebnisse };
}

// ── Ausgabe ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** Übersicht: eine Zeile je Lauf (Semikolon, Dezimalkomma) */
export function kurzfassungsUebersicht(reihe: KurzfassungsReihe): unknown[][] {
  const kopf = [
    "lauf",
    "variante",
    "status",
    "modell",
    "aufwand",
    "mistral_endpunkt",
    "dauer_s",
    "ausgabetoken",
    "kosten_usd",
    "woerter",
    "zu_lang",
    "kurztitel_passend",
    "mindestwert_fehlt",
    "hochrechnung_ungekennzeichnet",
    "nachbetankung_als_erledigt",
    "marker_im_text",
    "klaerungsbedarf",
    "hinweise_app",
    "kurztitel",
    "kernaussage",
    "fehler",
  ];
  const ja = (b: boolean | undefined) => (b === undefined ? null : b ? "ja" : "nein");
  return [
    kopf,
    ...reihe.laeufe.map((l) => [
      l.lauf,
      l.variante ?? "",
      l.status,
      l.modell,
      l.aufwand,
      reihe.mistral_endpunkt ?? "",
      l.dauer_s,
      l.ausgabetoken,
      l.kosten_usd,
      l.vorpruefung?.woerter ?? null,
      ja(l.vorpruefung?.zu_lang),
      ja(l.vorpruefung?.kurztitel_passend),
      ja(l.vorpruefung?.mindestwert_fehlt),
      ja(l.vorpruefung?.hochrechnung_ungekennzeichnet),
      ja(l.vorpruefung?.nachbetankung_als_erledigt),
      ja(l.vorpruefung?.marker_im_text),
      ja(l.vorpruefung?.klaerungsbedarf),
      l.hinweise_app.length,
      l.struktur?.kurztitel.join(" | ") ?? null,
      l.struktur?.kernaussage ?? null,
      l.fehler,
    ]),
  ];
}

/** Dateiname, z. B. KI-LEAD_Testlauf_Ilka_MS-Muster_claude-sonnet-5-5-medium_20261025-0315.zip */
export function kurzfassungsZipName(reihe: KurzfassungsReihe): string {
  const variante = reihe.variante ? `${dateiKurz(reihe.variante.split("/").pop()!)}_` : "";
  return `KI-LEAD_Testlauf_Ilka_MS-Muster_${variante}${dateiKurz(`${reihe.modell.modell}-${reihe.modell.aufwand}`)}_${dateiStempel(reihe.erstellt)}.zip`;
}

function liesmich(reihe: KurzfassungsReihe): string {
  return [
    "KI-LEAD – Testlauf Ilka: Management Summary (aus Musterfassung)",
    "",
    `Erstellt: ${reihe.erstellt} mit ${reihe.app}, Profil ${reihe.profil.id} ${reihe.profil.version} (${reihe.profil.hash.slice(0, 12)}…)`,
    ...(reihe.variante ? [`Variante: ${reihe.variante}`] : []),
    `Fall: ${reihe.fall} (evaluation/faelle/${reihe.fall}.json), Plan ${reihe.plan}. Einzige Eingabe ist die Musterfassung ${reihe.meldung.datei} (${reihe.meldung.sha256.slice(0, 12)}…); S1 und S2 entfallen.`,
    `Management Summary: ${reihe.modell.modell} (${reihe.modell.aufwand})${reihe.mistral_endpunkt ? ` · Mistral-Endpunkt: ${reihe.mistral_endpunkt}` : ""}`,
    `Läufe: ${reihe.laeufe.length} von ${reihe.laeufe_geplant}${reihe.beendet ? ` (${reihe.beendet})` : ""}; ohne Auffälligkeit der Vorprüfung: ${reihe.ohne_auffaelligkeit}; Kosten zusammen ${reihe.kosten_usd_summe} USD (Listenpreise, ohne Gewähr).`,
    "",
    "Inhalt:",
    "- reihe.json: Reihendatei (Format ki-lead-kurzfassung-reihe/1) mit Text, Struktur, Hinweisen der App, Vorprüfung, Token, Dauer und Kosten je Lauf",
    "- uebersicht.csv: eine Zeile je Lauf (Semikolon, Dezimalkomma)",
    "- kurzfassungen/<lauf>.txt: Management Summary, wie die App sie ausgibt",
    "- protokolle/<lauf>.kurzfassung.json: Anfrage (Prompt), Rohantwort, Token, Dauer und Kosten des Aufrufs",
    "",
    "Die Vorprüfung liefert Beobachtungen, keine Bewertung: Die Muss- und Darf-nicht-Punkte des Falls prüft eine Person.",
    "Alle Inhalte sind fiktiv. Protokolle gehören nicht ins öffentliche Repository (docs/ERPROBUNG.md, Abschnitt 6).",
    "",
  ].join("\r\n");
}

/** ZIP mit Reihendatei, Übersicht, Texten und Protokollen */
export async function kurzfassungsZip(reihe: KurzfassungsReihe, ergebnisse: KurzfassungsErgebnis[]): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("LIESMICH.txt", liesmich(reihe));
  zip.file("reihe.json", JSON.stringify(reihe, null, 2));
  zip.file("uebersicht.csv", "﻿" + csv(kurzfassungsUebersicht(reihe)));
  for (const x of ergebnisse) {
    if (x.eintrag.text) zip.file(`kurzfassungen/${x.eintrag.lauf}.txt`, x.eintrag.text);
    if (x.protokoll) zip.file(`protokolle/${x.eintrag.lauf}.kurzfassung.json`, JSON.stringify(x.protokoll, null, 2));
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
