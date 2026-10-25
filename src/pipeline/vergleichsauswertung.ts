// Auswertung mehrerer Vergleichsläufe Ilka (seit 0.5.8, Befund AV-2026-W43-04): fasst Reihendateien
// (ki-lead-abnahme/1) je Konfiguration zusammen und stellt jede Konfiguration dem Bezug gegenüber, in der Regel dem
// Standard-Profil Anthropic. Kein Gesamtwert über die Kennzahlen: Die Tabelle ist nach dem Radarabstand sortiert,
// die Entscheidung über ein Standard-Profil bleibt eine begründete Abwägung.
//
// Aufruf über scripts/vergleichslauf-auswerten.mjs (npm run vergleichslauf:auswerten -- <ZIP-Dateien oder Ordner>).

import { STANDARD_PROFILE } from "./einstellungen";
import type { Kennzahlen, Reihe } from "./vergleichslauf";
import { reiheUmfang, umfangInfo } from "./vergleichsumfang";

export const KENNZAHLEN: (keyof Kennzahlen)[] = [
  "sachverhalte",
  "achsen_gesetzt",
  "tendenz_gesetzt",
  "beurteilung_gleich",
  "tendenz_gleich",
  "aehnlichkeit_mittel",
  "achsen_abweichung_mittel",
  "achsen_nah",
  "plausibilitaet_befunde",
];

export interface Spanne {
  mittel: number | null;
  min: number | null;
  max: number | null;
}

export interface Zusammenfassung {
  /** Plan-Variante oder S2-Modell und Aufwand */
  kennung: string;
  /** Schlüssel der Konfiguration (S1, S2, Endpunkt) */
  schluessel: string;
  konfiguration: string;
  app: string[];
  laeufe: number;
  bestanden: number;
  kosten_usd: Spanne;
  dauer_s: Spanne;
  kennzahlen: Record<keyof Kennzahlen, Spanne>;
  /** je Sachverhalt der Redaktionsfassung (Index) und Achse: Median der gesetzten Werte und Anteil „offen“ */
  radar: Record<string, Record<string, { median: number | null; offen: number; n: number }>>;
  /** Anteil der Sachverhalte der Redaktionsfassung, denen ein Lauf einen Sachverhalt zugeordnet hat */
  zuordnung: number | null;
  /**
   * Sachverhalte je Lauf ohne Gegenstück in der Redaktionsfassung (LS-2026-W43-16): Ansatzpunkte für die Prüfung der
   * Abdeckung von Hand (evaluation/bewertungshilfen/orkantief-ilka.md, Abschnitt C); keine Abwertung.
   */
  ohne_gegenstueck: { lauf: string; sachverhalte: string[] }[];
  /** Prüfsummen fester S1-Gegenstände der Reihen (LS-2026-W43-15); leer, wenn S1 in jedem Lauf neu lief */
  s1_fest: string[];
}

export interface Abstand {
  kennung: string;
  /** mittlerer Betrag der Differenz der Mediane je Sachverhalt und Achse, wo beide einen Wert haben */
  radar: number | null;
  /** mittlerer Betrag der Differenz der Anteile „offen“ */
  offen: number | null;
  /** Zahl der Achsen (je Sachverhalt der Redaktionsfassung), die in den Radarabstand eingehen (seit 0.5.10, AV-2026-W43-19) */
  achsen_verglichen: number;
  /** Zahl der Achsen des Bezugs */
  achsen_bezug: number;
  /** Betrag der Differenz der Mittelwerte je Kennzahl */
  kennzahlen: Record<keyof Kennzahlen, number | null>;
}

export interface Auswertung {
  bezug: string | null;
  zusammenfassungen: Zusammenfassung[];
  abstaende: Abstand[];
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;

function spanne(werte: (number | null | undefined)[]): Spanne {
  const w = werte.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (!w.length) return { mittel: null, min: null, max: null };
  return { mittel: r3(w.reduce((a, b) => a + b, 0) / w.length), min: r3(Math.min(...w)), max: r3(Math.max(...w)) };
}

function median(w: number[]): number | null {
  if (!w.length) return null;
  const s = [...w].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Schlüssel der Konfiguration (S1, S2, Endpunkt); seit 0.5.12 mit dem Umfang, wenn er nicht die ganze Kette ist,
 * damit z. B. „S1 + S2“ und „S1 + S2 + S3“ derselben Modelle getrennt bleiben.
 */
export function konfigSchluessel(r: Reihe): string {
  const m = r.modelle;
  const u = reiheUmfang(r);
  return [m.s1.modell, m.s1.aufwand, m.s2.modell, m.s2.aufwand, r.mistral_endpunkt ?? "", ...(u === "s1-s2-s3" ? [] : [u])].join("|");
}

function konfigText(r: Reihe): string {
  const m = r.modelle;
  const u = reiheUmfang(r);
  const s1 = u === "s2-s3" ? "S1 fest" : `S1 ${m.s1.modell} (${m.s1.aufwand})`;
  return `${s1} · S2 ${m.s2.modell} (${m.s2.aufwand})${u === "s1-s2" ? " ohne S3" : ""}${r.mistral_endpunkt ? ` · Mistral ${r.mistral_endpunkt}` : ""}`;
}

/** Standard-Profil Anthropic als Bezug (S1 und Verdichtung nach STANDARD_PROFILE.anthropic) */
export function istAnthropicStandard(r: Reihe): boolean {
  const s = STANDARD_PROFILE.anthropic;
  const m = r.modelle;
  return (
    m.s1.modell === s.modelle.vorverarbeitung &&
    m.s1.aufwand === s.aufwand.vorverarbeitung &&
    m.s2.modell === s.modelle.verdichtung &&
    m.s2.aufwand === s.aufwand.verdichtung
  );
}

/** Fasst Reihen je Konfiguration zusammen (mehrere Dateien derselben Konfiguration werden vereinigt). */
export function zusammenfassen(reihen: Reihe[]): Zusammenfassung[] {
  const gruppen = new Map<string, Reihe[]>();
  for (const r of reihen) {
    const k = konfigSchluessel(r);
    gruppen.set(k, [...(gruppen.get(k) ?? []), r]);
  }
  return [...gruppen.entries()].map(([schluessel, rs]) => {
    const laeufe = rs.flatMap((r) => r.laeufe).filter((l) => !l.attrappe || rs.every((r) => r.attrappe));
    const variante = rs.find((r) => r.variante)?.variante;
    const u = reiheUmfang(rs[0]);
    // Umfang in der Kennung, wo sie sonst mit der ganzen Kette zusammenfiele (seit 0.5.12)
    const zusatz = u === "s1-s2" || (u === "s2-s3" && !variante) ? `@${u}` : "";
    const kennung =
      (variante
        ? variante.split("/").pop()!
        : `${rs[0].modelle.s2.modell}-${rs[0].modelle.s2.aufwand}${rs[0].mistral_endpunkt ? `-${rs[0].mistral_endpunkt}` : ""}`) + zusatz;
    const kz = {} as Record<keyof Kennzahlen, Spanne>;
    for (const k of KENNZAHLEN) kz[k] = spanne(laeufe.map((l) => l.kennzahlen?.[k] ?? null));
    // Radar je Sachverhalt der Redaktionsfassung
    const sammlung: Record<string, Record<string, (number | null)[]>> = {};
    let refGesamt = 0;
    let refZugeordnet = 0;
    const ohneGegenstueck: Zusammenfassung["ohne_gegenstueck"] = [];
    for (const l of laeufe) {
      const v = l.beobachtungen?.vergleich as {
        paare?: { ref_index?: number | null; ki_radar?: Record<string, number | null> | null; ki?: string | null }[];
      } | null;
      const paare = v?.paare ?? [];
      const ohne = paare.filter((p) => p.ki && typeof p.ref_index !== "number").map((p) => p.ki!);
      if (ohne.length) ohneGegenstueck.push({ lauf: l.lauf, sachverhalte: ohne });
      const refs = paare.filter((p) => typeof p.ref_index === "number");
      refGesamt += refs.length;
      for (const p of refs) {
        if (!p.ki || !p.ki_radar) continue;
        refZugeordnet++;
        const ziel = (sammlung[String(p.ref_index)] ??= {});
        for (const [achse, wert] of Object.entries(p.ki_radar)) (ziel[achse] ??= []).push(typeof wert === "number" ? wert : null);
      }
    }
    const radar: Zusammenfassung["radar"] = {};
    for (const [ref, achsen] of Object.entries(sammlung)) {
      radar[ref] = {};
      for (const [achse, werte] of Object.entries(achsen)) {
        const gesetzt = werte.filter((w): w is number => w !== null);
        radar[ref][achse] = { median: median(gesetzt), offen: r3((werte.length - gesetzt.length) / werte.length), n: werte.length };
      }
    }
    return {
      kennung,
      schluessel,
      konfiguration: konfigText(rs[0]),
      app: [...new Set(rs.map((r) => r.app))],
      laeufe: laeufe.length,
      bestanden: laeufe.filter((l) => l.technisch_bestanden).length,
      kosten_usd: spanne(laeufe.map((l) => l.kosten_usd)),
      dauer_s: spanne(laeufe.map((l) => l.dauer_s)),
      kennzahlen: kz,
      radar,
      zuordnung: refGesamt ? r3(refZugeordnet / refGesamt) : null,
      ohne_gegenstueck: ohneGegenstueck,
      s1_fest: [...new Set(rs.flatMap((r) => (r.s1_fest ? [r.s1_fest.sha256] : [])))],
    };
  });
}

/** Abstand einer Konfiguration zum Bezug */
export function abstand(x: Zusammenfassung, bezug: Zusammenfassung): Abstand {
  const radar: number[] = [];
  const offen: number[] = [];
  let achsenBezug = 0;
  for (const [ref, achsen] of Object.entries(bezug.radar))
    for (const [achse, b] of Object.entries(achsen)) {
      achsenBezug++;
      const w = x.radar[ref]?.[achse];
      if (!w) continue;
      offen.push(Math.abs(w.offen - b.offen));
      if (w.median !== null && b.median !== null) radar.push(Math.abs(w.median - b.median));
    }
  const kennzahlen = {} as Record<keyof Kennzahlen, number | null>;
  for (const k of KENNZAHLEN) {
    const a = x.kennzahlen[k].mittel;
    const b = bezug.kennzahlen[k].mittel;
    kennzahlen[k] = a !== null && b !== null ? r3(Math.abs(a - b)) : null;
  }
  const mittel = (w: number[]) => (w.length ? r3(w.reduce((a, b) => a + b, 0) / w.length) : null);
  return { kennung: x.kennung, radar: mittel(radar), offen: mittel(offen), achsen_verglichen: radar.length, achsen_bezug: achsenBezug, kennzahlen };
}

/** Auswertung mehrerer Reihen; Bezug über die Kennung oder, ohne Angabe, das Standard-Profil Anthropic */
export function auswerten(reihen: Reihe[], bezugKennung?: string): Auswertung {
  // Reihen im Umfang „S1“ haben keine Entwürfe (seit 0.5.12); ihr Vergleich mit der Musterfassung steht in der Reihe selbst
  const nurS1 = reihen.filter((r) => reiheUmfang(r) === "s1");
  if (nurS1.length)
    throw new Error(
      `${nurS1.length} Reihe(n) im Umfang „${umfangInfo("s1").titel}“ ohne Entwürfe; ihr Vergleich mit dem Zuschnitt der Musterfassung steht in reihe.json (s1_vergleich) und uebersicht.csv.`,
    );
  const zusammenfassungen = zusammenfassen(reihen);
  const bezug =
    (bezugKennung ? zusammenfassungen.find((z) => z.kennung === bezugKennung) : undefined) ??
    (bezugKennung ? undefined : zusammenfassungen.find((z) => reihen.some((r) => konfigSchluessel(r) === z.schluessel && istAnthropicStandard(r))));
  if (bezugKennung && !bezug) throw new Error(`Bezug „${bezugKennung}“ nicht unter den Reihen (${zusammenfassungen.map((z) => z.kennung).join(", ")})`);
  const abstaende = bezug
    ? zusammenfassungen
        .filter((z) => z !== bezug)
        .map((z) => abstand(z, bezug))
        .sort((a, b) => (a.radar ?? Infinity) - (b.radar ?? Infinity))
    : [];
  return { bezug: bezug?.kennung ?? null, zusammenfassungen, abstaende };
}

const zahl = (x: number | null | undefined, stellen = 2) =>
  x === null || x === undefined ? "–" : x.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
const sp = (s: Spanne, stellen = 2) => (s.mittel === null ? "–" : `${zahl(s.mittel, stellen)} (${zahl(s.min, stellen)}–${zahl(s.max, stellen)})`);

/** Bericht als Markdown */
export function berichtMarkdown(a: Auswertung): string {
  const z = a.zusammenfassungen;
  const zeilen = [
    "# Auswertung Vergleichslauf Ilka",
    "",
    `Bezug: ${a.bezug ?? "kein Bezug (Standard-Profil Anthropic nicht unter den Reihen; mit --bezug wählen)"}. Mittelwert (Spanne) über die Läufe je Konfiguration.`,
    "",
    // LS-2026-W43-15: S2 übernimmt die Zahl der Sachverhalte aus der bestätigten S1-Gliederung
    z.some((s) => s.s1_fest.length)
      ? `S1-Gegenstand fest vorgegeben (Prüfsumme ${[...new Set(z.flatMap((s) => s.s1_fest))].map((h) => `${h.slice(0, 12)}…`).join(", ")}); Unterschiede gehen auf S2 zurück.`
      : "Die Zahl der Sachverhalte übernimmt S2 aus der bestätigten S1-Gliederung; sie misst S1, nicht das Verdichtungsmodell.",
    "",
    "| Kennung | Konfiguration | Läufe (T1–T8) | Kosten USD | Dauer s | Sachverhalte | Achsen gesetzt | Tendenz gesetzt | Beurteilung gleich | Ähnlichkeit | Achsenabweichung | Plausibilität |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
    ...z.map(
      (s) =>
        `| ${s.kennung}${s.kennung === a.bezug ? " (Bezug)" : ""} | ${s.konfiguration} | ${s.laeufe} (${s.bestanden}) | ${sp(s.kosten_usd)} | ${sp(s.dauer_s, 0)} | ${sp(s.kennzahlen.sachverhalte, 1)} | ${sp(s.kennzahlen.achsen_gesetzt)} | ${sp(s.kennzahlen.tendenz_gesetzt)} | ${sp(s.kennzahlen.beurteilung_gleich)} | ${sp(s.kennzahlen.aehnlichkeit_mittel)} | ${sp(s.kennzahlen.achsen_abweichung_mittel)} | ${sp(s.kennzahlen.plausibilitaet_befunde, 1)} |`,
    ),
    "",
  ];
  if (a.bezug) {
    zeilen.push(
      `## Abstand zum Bezug (${a.bezug})`,
      "",
      "Sortiert nach dem Radarabstand (mittlerer Betrag der Differenz der Mediane je Sachverhalt der Redaktionsfassung und Achse); kein Gesamtwert. Der Radarabstand zählt nur Achsen, die Bezug und Konfiguration beide gesetzt haben (Spalte „Achsen verglichen“); wie viele offen bleiben, zeigt „Abstand offen“.",
      "",
      "| Kennung | Radarabstand | Achsen verglichen | Abstand „offen“ | Δ Sachverhalte | Δ Achsen gesetzt | Δ Tendenz gesetzt | Δ Beurteilung gleich | Δ Tendenz gleich | Δ Ähnlichkeit | Δ Achsenabweichung | Δ Achsen ≤ 1 | Δ Plausibilität |",
      "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
      ...a.abstaende.map(
        (d) =>
          `| ${d.kennung} | ${zahl(d.radar)} | ${d.achsen_verglichen} von ${d.achsen_bezug} | ${zahl(d.offen)} | ${zahl(d.kennzahlen.sachverhalte, 1)} | ${zahl(d.kennzahlen.achsen_gesetzt)} | ${zahl(d.kennzahlen.tendenz_gesetzt)} | ${zahl(d.kennzahlen.beurteilung_gleich)} | ${zahl(d.kennzahlen.tendenz_gleich)} | ${zahl(d.kennzahlen.aehnlichkeit_mittel)} | ${zahl(d.kennzahlen.achsen_abweichung_mittel)} | ${zahl(d.kennzahlen.achsen_nah)} | ${zahl(d.kennzahlen.plausibilitaet_befunde, 1)} |`,
      ),
      "",
    );
  }
  const ohne = z.filter((s) => s.ohne_gegenstueck.length);
  if (ohne.length)
    zeilen.push(
      "## Sachverhalte ohne Gegenstück in der Redaktionsfassung",
      "",
      "Arbeitshilfe für die Prüfung der Abdeckung von Hand; ein anderer Zuschnitt ist kein Mangel.",
      "",
      ...ohne.flatMap((s) => s.ohne_gegenstueck.map((o) => `- ${s.kennung}, ${o.lauf}: ${o.sachverhalte.join("; ")}`)),
      "",
    );
  const apps = [...new Set(z.flatMap((s) => s.app))];
  if (apps.length > 1)
    zeilen.push(`Hinweis: Die Reihen stammen aus verschiedenen App-Versionen (${apps.join(", ")}); Unterschiede können auch daher rühren.`, "");
  return zeilen.join("\n");
}
