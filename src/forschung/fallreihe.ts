// Fallreihe (seit 0.7.2, TP-2026-W44-62, -65, -66): beliebige Erfassungs- und Verdichtungsfälle nacheinander mit
// denselben Pipeline-Funktionen wie eine Erfassung in der App (S1, unveränderte Bestätigung, S2 mit S3 bei Bedarf).
// Reihenfolge: je Fall alle Varianten, dann die nächste Wiederholung, dann der nächste Fall; so hinterlässt eine
// gebremste oder abgebrochene Reihe vollständige Fälle. Die Kostenbremse hält vor dem Lauf an, der den Deckel
// überschreiten würde.

import type { Fortschritt, LlmAnbieter } from "../anbieter/typen";
import { anbieterVon, type AnbieterId } from "../anbieter/verteiler";
import { ausfuellHinweise } from "../kern/kennsaetze";
import { holeWert } from "../kern/pfad";
import { parseQuellen, sachverhalte } from "../kern/quellen";
import type { Meldung, Profil } from "../kern/typen";
import { pruefeGegenSchema } from "../kern/validierung";
import { APP_KENNUNG } from "../kern/version";
import { aufwandFuer, modellFuer, type Einstellungen, type Rolle } from "../pipeline/einstellungen";
import { neuerLauf, type Auftrag, type Lauf } from "../pipeline/lauf";
import { dateiLesen, rolleSetzen, type Material } from "../pipeline/material";
import { rechercheNachweis } from "../pipeline/recherchebefunde";
import { stufe1 } from "../pipeline/s1";
import { stufe2und3 } from "../pipeline/s2s3";
import { schaetzeStufe, summe } from "../pipeline/schaetzung";
import type { Kontext } from "../pipeline/stufen";
import type { StufeId } from "../pipeline/recherchetiefe";
import type { Fall, KatalogFall } from "./fallkatalog";
import { einstellungenFuerLauf, s2Rolle, type ReihenVariante } from "./fallplan";

export const REIHE_FORMAT = "ki-lead-fallreihe/1";

/** Vorbehalt je Lauf, wenn weder eine Schätzung noch ein bisheriger Lauf derselben Variante vorliegt (USD) */
export const VORBEHALT_USD = 5;

/** Ein geplanter Lauf */
export interface GeplanterLauf {
  nr: number;
  fall: KatalogFall;
  variante: ReihenVariante;
  wiederholung: number;
}

/** Läufe in der Reihenfolge der Ausführung: je Fall und Wiederholung alle Varianten */
export function laufplan(faelle: KatalogFall[], varianten: ReihenVariante[], wiederholungen: number): GeplanterLauf[] {
  const out: GeplanterLauf[] = [];
  for (const fall of faelle)
    for (let w = 1; w <= wiederholungen; w++) for (const variante of varianten) out.push({ nr: out.length + 1, fall, variante, wiederholung: w });
  return out;
}

/** Rollen, die ein Lauf nutzt (die Reparatur nur bei Schemafehlern) */
export const laufRollen = (k: KatalogFall): Rolle[] => ["vorverarbeitung", s2Rolle(k.art)];

/** Geschätzte Kosten eines Laufs (S1 + S2, mit Aufschlag des Mistral-EU-Endpunkts); null, wenn eine Stufe keine Schätzung hat */
export function laufSchaetzung(k: KatalogFall, e: Einstellungen, profil: Profil | null): [number, number] | null {
  const s1 = schaetzeStufe("s1", modellFuer("vorverarbeitung", e, profil), e.aufwand.vorverarbeitung, e.anbieterOptionen);
  const r = s2Rolle(k.art);
  const s2 = schaetzeStufe(r, modellFuer(r, e, profil), e.aufwand[r], e.anbieterOptionen);
  return summe([s1.usd, s2.usd]);
}

/**
 * Obergrenze des nächsten Laufs für die Kostenbremse: der größere Wert aus oberer Schätzung und teuerstem bisherigem
 * Lauf derselben Variante; ohne beides der Vorbehalt.
 */
export function obergrenze(schaetzung: [number, number] | null, teuersterBisher: number | undefined): number {
  const w = Math.max(schaetzung?.[1] ?? 0, teuersterBisher ?? 0);
  return w > 0 ? w : VORBEHALT_USD;
}

/** Greift die Bremse vor dem nächsten Lauf? */
export const bremseGreift = (bisher: number, naechster: number, deckel: number | undefined): boolean => deckel !== undefined && bisher + naechster > deckel;

/** Auftrag aus dem Fall, wie ihn die Eingabe in der App ergäbe */
export function auftragAusFall(f: Fall, websuche: boolean): Auftrag {
  const a = f.auftrag;
  return {
    sachverhalt: a.sachverhalt,
    stichworte: a.stichworte ?? "",
    urls: a.urls ?? [],
    stichtag: a.stichtag ?? a.meldezeitpunkt?.slice(0, 10) ?? "",
    prueffrage: a.prueffrage ?? "",
    websuche,
    ...(a.meldezeitpunkt ? { meldezeitpunkt: a.meldezeitpunkt } : {}),
  };
}

/** Material des Falls wie beim Hochladen in der App; Rolle „eingang“ bzw. „vormeldung“ ausdrücklich gesetzt */
export async function materialAusFall(k: KatalogFall, profil: Profil): Promise<Material[]> {
  const out: Material[] = [];
  for (const m of k.fall.material) {
    if (!m.datei) throw new Error(`Fall ${k.fall.id}: Material nur als Verweis (extern).`);
    const inhalt = k.lesen(m.datei);
    if (inhalt === undefined) throw new Error(`Fall ${k.fall.id}: Material ${m.datei} fehlt.`);
    const datei = new File([inhalt as BlobPart], m.datei.split("/").pop()!);
    let mat = await dateiLesen(datei, profil);
    if (m.rolle === "eingang") mat = rolleSetzen(mat, "eingang", profil);
    if (m.rolle === "vormeldung") mat = rolleSetzen(mat, "meldung", profil);
    out.push(mat);
  }
  return out;
}

/** Automatische Prüfungen je Lauf (TP-2026-W44-66); null, wenn eine Angabe für diesen Lauf oder dieses Profil nicht vorliegt */
export interface Pruefungen {
  status: string;
  schemakonform: boolean | null;
  schemabefunde: number | null;
  kosten_usd: number | null;
  /** Schätzung der App vor dem Lauf (untere und obere Grenze) */
  schaetzung_usd: [number, number] | null;
  dauer_s: number;
  /** Fristen („Handlungsrelevant bis“) auf oder vor t0 ohne Kennzeichnung „überfällig“, wie im Redaktionscheck */
  fristen_vor_t0: number | null;
  sachverhalte: number | null;
  /** Anteil der Sachverhalte mit Tendenz (0–1) */
  tendenz_gesetzt: number | null;
  quellen: number | null;
  websuchen: number;
  abrufe: number;
}

const FRIST_HINWEIS = "liegt auf oder vor dem Meldezeitpunkt";

/** Zahl der Quellen: Liste (LEAD-Meldung-v2) oder Quellenverzeichnis als Text (v1) */
export function quellenZahl(m: Meldung, profil: Profil): number | null {
  const pfad = profil.ui.rollen.quellen;
  if (!pfad) return null;
  const q = holeWert(m, pfad);
  if (Array.isArray(q)) return q.length;
  if (typeof q === "string") return parseQuellen(q).length;
  return q == null ? 0 : null;
}

/** Tendenz je Sachverhalt: Text (v1) oder Objekt mit Richtung (v2) */
function tendenzGesetzt(wert: unknown): boolean {
  if (wert && typeof wert === "object") return !!(wert as { richtung?: unknown }).richtung;
  return typeof wert === "string" ? !!wert.trim() : false;
}

export function pruefungen(l: Lauf, meldung: Meldung | undefined, profil: Profil, schaetzung: [number, number] | null): Pruefungen {
  const ui = profil.ui;
  const r = ui.rollen;
  const sv = meldung ? sachverhalte(meldung, ui) : [];
  const tendenzPfad = r.sv_tendenz;
  const s2 = l.stufen.filter((s) => s.stufe.startsWith("S2"));
  const recherche = l.ergebnis?.recherche ?? rechercheNachweis({ nutzung: s2[s2.length - 1]?.nutzung, suchen: l.ergebnis?.suchen });
  const fristPruefbar = !!meldung && !!ui.kennsaetze?.handlungsrelevant && !!r.sv_bewertung_text;
  return {
    status: l.status,
    schemakonform: l.ergebnis ? l.ergebnis.schemakonform : meldung ? null : false,
    schemabefunde: meldung ? pruefeGegenSchema(profil.schema, meldung, ui).length : null,
    kosten_usd: l.kostenUsd ?? l.kostenBekanntUsd ?? null,
    schaetzung_usd: schaetzung,
    dauer_s: Math.round((Date.parse(l.aktualisiert) - Date.parse(l.erstellt)) / 1000),
    fristen_vor_t0: fristPruefbar
      ? ausfuellHinweise(meldung, ui, profil.manifest.variablen?.zeitzone, profil.manifest.referenzraum).filter((b) => b.text.includes(FRIST_HINWEIS)).length
      : null,
    sachverhalte: meldung ? sv.length : null,
    tendenz_gesetzt:
      meldung && tendenzPfad && sv.length ? Math.round((sv.filter((s) => tendenzGesetzt(holeWert(s, tendenzPfad))).length / sv.length) * 1000) / 1000 : null,
    quellen: meldung ? quellenZahl(meldung, profil) : null,
    websuchen: recherche.websuchen,
    abrufe: recherche.abrufe,
  };
}

/** Ergebnis eines Laufs der Fallreihe */
export interface FallLaufErgebnis {
  nr: number;
  fall: string;
  titel: string;
  quelle: KatalogFall["quelle"];
  variante: string;
  wiederholung: number;
  profil: { id: string; version: string; hash: string };
  modelle: Record<"s1" | "s2", { modell: string; aufwand: string; anbieter: AnbieterId }>;
  mistral_endpunkt?: string;
  recherche: { websucheMax: number; abrufMax: number; abrufMaxTokens: number } | null;
  pruefungen: Pruefungen;
  /** Kennung des Entwurfs für die Sichtung (Dateinamen und Bewertungsvorlage) */
  kennung: string;
  lauf: Lauf;
  meldung?: Meldung;
}

export interface LaufOptionen {
  geplant: GeplanterLauf;
  profil: Profil;
  anbieter: LlmAnbieter;
  einstellungen: Einstellungen;
  schaetzung: [number, number] | null;
  signal?: AbortSignal;
  aktualisiert?: (l: Lauf) => void;
  fortschritt?: (f: Fortschritt) => void;
}

/** Ein Lauf: S1, unveränderte Bestätigung, S2 (mit S3 bei Bedarf); Fehler und Abbruch landen im Laufprotokoll */
export async function fallLauf(o: LaufOptionen): Promise<FallLaufErgebnis> {
  const { geplant: g, profil, einstellungen: e } = o;
  const k = g.fall;
  const material = await materialAusFall(k, profil);
  const lauf = neuerLauf(
    profil,
    auftragAusFall(k.fall, k.websuche),
    material.map((m) => ({ name: m.name, art: m.art, groesse: m.groesse, hash: m.hash, ...(m.rolleGewaehlt ? { rolleGewaehlt: true } : {}) })),
  );
  const ktx: Kontext = {
    profil,
    anbieter: o.anbieter,
    einstellungen: e,
    lauf,
    material,
    signal: o.signal,
    aktualisiert: (l) => o.aktualisiert?.(l),
    fortschritt: o.fortschritt,
  };
  let meldung: Meldung | undefined;
  try {
    const vorschlag = await stufe1(ktx);
    // Bestätigung ohne Eingriff wie in der App ohne Änderung; keine Orientierungssuche
    const erg = await stufe2und3(ktx, structuredClone(vorschlag));
    meldung = erg.meldung ?? undefined;
  } catch (err) {
    if (o.signal?.aborted) {
      lauf.status = "abgebrochen";
      lauf.fehler ??= "Vom Nutzer abgebrochen";
    } else {
      lauf.status = lauf.status === "fertig" ? lauf.status : "fehler";
      lauf.fehler ??= String((err as Error)?.message || err);
    }
  }
  const rolle = s2Rolle(k.art);
  const teil = (r: Rolle) => {
    const modell = modellFuer(r, e, profil);
    return { modell, aufwand: aufwandFuer(r, e, profil), anbieter: anbieterVon(modell) };
  };
  const modelle = { s1: teil("vorverarbeitung"), s2: teil(rolle) };
  const mistral = modelle.s1.anbieter === "mistral" || modelle.s2.anbieter === "mistral";
  return {
    nr: g.nr,
    fall: k.fall.id,
    titel: k.fall.titel,
    quelle: k.quelle,
    variante: g.variante.kennung,
    wiederholung: g.wiederholung,
    profil: { id: profil.manifest.id, version: profil.manifest.version, hash: profil.hash },
    modelle,
    ...(mistral ? { mistral_endpunkt: e.anbieterOptionen.mistral.endpunkt } : {}),
    recherche: k.websuche ? { websucheMax: e.websucheMax, abrufMax: e.abrufMax, abrufMaxTokens: e.abrufMaxTokens } : null,
    pruefungen: pruefungen(lauf, meldung, profil, o.schaetzung),
    kennung: `E${String(g.nr).padStart(3, "0")}`,
    lauf,
    ...(meldung ? { meldung } : {}),
  };
}

/** Reihendatei der Fallreihe (ohne Schlüssel, ohne Laufprotokolle) */
export interface FallreiheDatei {
  format: typeof REIHE_FORMAT;
  erstellt: string;
  app: string;
  attrappe: boolean;
  /** Plan, aus dem die Auswahl stammt; abweichend, wenn Fälle, Varianten oder Vorgaben in der App geändert wurden */
  plan: { id: string; name: string; sha256: string; abweichend?: boolean } | null;
  fallpakete: { name: string; sha256: string }[];
  recherche: StufeId | null;
  budget_usd: number | null;
  laeufe_geplant: number;
  kosten_usd_summe: number;
  /** Grund eines vorzeitigen Endes (abgebrochen, Kostenbremse) */
  beendet?: string;
  varianten: ReihenVariante[];
  faelle: { id: string; titel: string; quelle: KatalogFall["quelle"]; profil: string; art: string; websuche: boolean; paket?: string }[];
  laeufe: (Omit<FallLaufErgebnis, "lauf" | "meldung"> & { lauf_id: string; laufprotokoll: string; entwurf: string | null; fehler: string | null })[];
}

export interface ReihenOptionen {
  geplant: GeplanterLauf[];
  einstellungen: Einstellungen;
  profilFuer: (id: string) => Promise<Profil>;
  anbieterFuer: (e: Einstellungen) => LlmAnbieter;
  recherche?: StufeId;
  budgetUsd?: number;
  plan?: { id: string; name: string; sha256: string; abweichend?: boolean };
  fallpakete?: { name: string; sha256: string }[];
  attrappe?: boolean;
  signal?: AbortSignal;
  /** Fortschritt für die Anzeige */
  stand?: (s: { nr: number; anzahl: number; fall: string; variante: string; stufe: string; zeichen: number; kostenUsd: number }) => void;
  jetzt?: () => Date;
}

export const dateiBasis = (e: Pick<FallLaufErgebnis, "kennung" | "fall" | "variante">) =>
  `${e.kennung}_${e.fall}_${e.variante}`.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-");

/** Führt die Fallreihe aus; endet bei Abbruch oder Kostenbremse mit den bisherigen Läufen */
export async function fallreihe(o: ReihenOptionen): Promise<{ reihe: FallreiheDatei; ergebnisse: FallLaufErgebnis[] }> {
  const jetzt = o.jetzt ?? (() => new Date());
  const erstellt = jetzt().toISOString();
  const ergebnisse: FallLaufErgebnis[] = [];
  const teuerster = new Map<string, number>();
  let bisher = 0;
  let beendet: string | undefined;
  const profile = new Map<string, Profil>();
  for (const g of o.geplant) {
    if (o.signal?.aborted) {
      beendet = "abgebrochen";
      break;
    }
    const profil = profile.get(g.fall.profilId) ?? (await o.profilFuer(g.fall.profilId));
    profile.set(g.fall.profilId, profil);
    const e = einstellungenFuerLauf(o.einstellungen, g.variante, g.fall.websuche ? o.recherche : undefined);
    const schaetzung = laufSchaetzung(g.fall, e, profil);
    const grenze = obergrenze(schaetzung, teuerster.get(g.variante.kennung));
    if (bremseGreift(bisher, grenze, o.budgetUsd)) {
      const usd = (x: number) => (Math.round(x * 100) / 100).toLocaleString("de-DE");
      beendet = `Kostenbremse vor Lauf ${g.nr}: bisher ${usd(bisher)} USD, nächster Lauf bis ${usd(grenze)} USD, Deckel ${usd(o.budgetUsd!)} USD`;
      break;
    }
    let stufe = "S1";
    let zeichen = 0;
    let laufend = 0;
    const melden = () =>
      o.stand?.({ nr: g.nr, anzahl: o.geplant.length, fall: g.fall.fall.id, variante: g.variante.kennung, stufe, zeichen, kostenUsd: bisher + laufend });
    melden();
    const erg = await fallLauf({
      geplant: g,
      profil,
      anbieter: o.anbieterFuer(e),
      einstellungen: e,
      schaetzung,
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
    ergebnisse.push(erg);
    const kosten = erg.pruefungen.kosten_usd ?? 0;
    bisher += kosten;
    teuerster.set(g.variante.kennung, Math.max(teuerster.get(g.variante.kennung) ?? 0, kosten));
    if (erg.lauf.status === "abgebrochen") {
      beendet = "abgebrochen";
      break;
    }
  }
  const faelle = [...new Map(o.geplant.map((g) => [g.fall.fall.id, g.fall])).values()];
  const reihe: FallreiheDatei = {
    format: REIHE_FORMAT,
    erstellt,
    app: APP_KENNUNG,
    attrappe: !!o.attrappe,
    plan: o.plan ?? null,
    fallpakete: o.fallpakete ?? [],
    recherche: o.recherche ?? null,
    budget_usd: o.budgetUsd ?? null,
    laeufe_geplant: o.geplant.length,
    kosten_usd_summe: Math.round(bisher * 10000) / 10000,
    ...(beendet ? { beendet } : {}),
    varianten: [...new Map(o.geplant.map((g) => [g.variante.kennung, g.variante])).values()],
    faelle: faelle.map((k) => ({
      id: k.fall.id,
      titel: k.fall.titel,
      quelle: k.quelle,
      profil: k.profilId,
      art: k.art,
      websuche: k.websuche,
      ...(k.paket ? { paket: k.paket } : {}),
    })),
    laeufe: ergebnisse.map(({ lauf, meldung, ...rest }) => ({
      ...rest,
      lauf_id: lauf.id,
      laufprotokoll: `laeufe/${dateiBasis(rest)}.lauf.json`,
      entwurf: meldung ? `entwuerfe/${dateiBasis(rest)}.meldung.json` : null,
      fehler: lauf.fehler ?? null,
    })),
  };
  return { reihe, ergebnisse };
}
