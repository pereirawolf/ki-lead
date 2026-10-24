// Vergleich zweier Meldungen nach demselben Profil, z. B. KI-Entwurf gegen eine Redaktionsfassung
// (Abnahme M4) oder zwei Kodierungen desselben Sachverhalts (Inter-Rater-Konsistenz).
// Verglichen wird je zugeordnetem Sachverhalt: Beurteilung, Tendenz, Ereignisarten und jede Radarachse.
// Es gibt bewusst keinen Gesamtscore über Achsen verschiedener Bedeutung; die Kennzahlen stehen je Achse.

import { holeWert } from "../kern/pfad";
import { sachverhalte } from "../kern/quellen";
import { feldUi, radarFuer } from "../kern/ui";
import type { Meldung, Profil, RadarDef } from "../kern/typen";

export interface SvKurz {
  index: number;
  bezeichnung: string;
  arten: string[];
  beurteilung: string;
  tendenz: string;
  radar: Record<string, number | null>;
}

export interface AchsenWert {
  key: string;
  label: string;
  ki: number | null;
  ref: number | null;
  /** ki − ref, null wenn eine Seite offen ist */
  diff: number | null;
}

export interface SvPaar {
  ki?: SvKurz;
  ref?: SvKurz;
  aehnlichkeit: number;
  achsen: AchsenWert[];
}

export interface AchsenStatistik {
  key: string;
  label: string;
  /** Paare, in denen beide Seiten einen Wert haben */
  n: number;
  gleich: number;
  /** Abweichung höchstens eine Stufe */
  nah: number;
  /** mittlere absolute Abweichung */
  mittel: number | null;
  /** nur auf einer Seite offen */
  offenEinseitig: number;
}

export interface Vergleich {
  paare: SvPaar[];
  achsen: AchsenStatistik[];
  /** n: Paare mit Angabe auf beiden Seiten; fehlend: Paare, in denen mindestens eine Seite leer ist */
  beurteilung: { n: number; gleich: number; fehlend: number };
  tendenz: { n: number; gleich: number; fehlend: number };
  arten: { n: number; gleich: number; fehlend: number };
  zugeordnet: number;
  ohneGegenstueck: number;
}

const STOPP = new Set([
  "und",
  "oder",
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "mit",
  "nach",
  "von",
  "vom",
  "zum",
  "zur",
  "fiktiv",
  "sowie",
  "durch",
  "über",
  "ohne",
]);

function woerter(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[„“"'’()\[\]:;,.!?/–—-]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPP.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 0;
  let schnitt = 0;
  for (const w of a) if (b.has(w)) schnitt++;
  return schnitt / (a.size + b.size - schnitt);
}

function radarDef(profil: Profil): RadarDef | undefined {
  const r = profil.ui.rollen;
  return r.sv_radar ? radarFuer(profil.ui, feldUi(profil.ui, `${r.sachverhalte}[].${r.sv_radar}`)) : undefined;
}

function kurz(m: Meldung, profil: Profil): SvKurz[] {
  const r = profil.ui.rollen;
  const def = radarDef(profil);
  const t = (sv: any, p?: string) => (p ? String(holeWert(sv, p) ?? "") : "");
  return sachverhalte(m, profil.ui).map((sv, index) => {
    const art = r.sv_art ? holeWert(sv, r.sv_art) : [];
    const roh = r.sv_radar ? holeWert(sv, r.sv_radar) || {} : {};
    const radar: Record<string, number | null> = {};
    for (const a of def?.achsen || []) radar[a.key] = Number.isInteger(roh[a.key]) ? roh[a.key] : null;
    return {
      index,
      bezeichnung: t(sv, r.sv_bezeichnung),
      arten: Array.isArray(art) ? art.map(String) : art ? [String(art)] : [],
      beurteilung: t(sv, r.sv_beurteilung),
      tendenz: t(sv, r.sv_tendenz),
      radar,
    };
  });
}

function merkmal(s: SvKurz, sv: any, profil: Profil): Set<string> {
  const r = profil.ui.rollen;
  return woerter([s.bezeichnung, s.arten.join(" "), r.sv_ort ? String(holeWert(sv, r.sv_ort) ?? "") : ""].join(" "));
}

/** Ordnet Sachverhalte nach Ähnlichkeit von Bezeichnung, Ereignisarten und Ort einander zu (gierig, eins zu eins). */
export const MIN_AEHNLICHKEIT = 0.08;

export const VERGLEICH_VERFAHREN = "ki-lead-vergleich/2";

export interface Zuordnung {
  ki: number;
  ref: number;
}

/**
 * Ordnet Sachverhalte nach Ähnlichkeit von Bezeichnung, Ereignisarten und Ort einander zu (gierig, eins zu eins,
 * Mindestähnlichkeit auch bei nur einem Sachverhalt je Seite). Eine manuelle Zuordnung geht vor.
 */
export function zuordnen(ki: Meldung, ref: Meldung, profil: Profil, manuell?: Zuordnung[]): { ki?: SvKurz; ref?: SvKurz; aehnlichkeit: number }[] {
  const a = kurz(ki, profil);
  const b = kurz(ref, profil);
  const sva = sachverhalte(ki, profil.ui);
  const svb = sachverhalte(ref, profil.ui);
  const w = (i: number, j: number) => jaccard(merkmal(a[i], sva[i], profil), merkmal(b[j], svb[j], profil));
  const belegtA = new Set<number>();
  const belegtB = new Set<number>();
  const paare: { ki?: SvKurz; ref?: SvKurz; aehnlichkeit: number }[] = [];
  if (manuell) {
    for (const z of manuell) {
      if (!a[z.ki] || !b[z.ref] || belegtA.has(z.ki) || belegtB.has(z.ref)) continue;
      belegtA.add(z.ki);
      belegtB.add(z.ref);
      paare.push({ ki: a[z.ki], ref: b[z.ref], aehnlichkeit: w(z.ki, z.ref) });
    }
  } else {
    const kandidaten: { i: number; j: number; w: number }[] = [];
    a.forEach((_, i) => b.forEach((_, j) => kandidaten.push({ i, j, w: w(i, j) })));
    kandidaten.sort((x, y) => y.w - x.w);
    for (const k of kandidaten) {
      if (k.w < MIN_AEHNLICHKEIT || belegtA.has(k.i) || belegtB.has(k.j)) continue;
      belegtA.add(k.i);
      belegtB.add(k.j);
      paare.push({ ki: a[k.i], ref: b[k.j], aehnlichkeit: k.w });
    }
  }
  a.forEach((x, i) => !belegtA.has(i) && paare.push({ ki: x, aehnlichkeit: 0 }));
  b.forEach((y, j) => !belegtB.has(j) && paare.push({ ref: y, aehnlichkeit: 0 }));
  return paare.sort((x, y) => (x.ki?.index ?? 99) - (y.ki?.index ?? 99) || (x.ref?.index ?? 99) - (y.ref?.index ?? 99));
}

export function vergleiche(ki: Meldung, ref: Meldung, profil: Profil, manuell?: Zuordnung[]): Vergleich {
  const def = radarDef(profil);
  const paare: SvPaar[] = zuordnen(ki, ref, profil, manuell).map((p) => ({
    ...p,
    achsen: (def?.achsen || []).map((a) => {
      const x = p.ki?.radar[a.key] ?? null;
      const y = p.ref?.radar[a.key] ?? null;
      return { key: a.key, label: a.label, ki: x, ref: y, diff: x !== null && y !== null ? x - y : null };
    }),
  }));
  const voll = paare.filter((p) => p.ki && p.ref);
  const achsen: AchsenStatistik[] = (def?.achsen || []).map((a, i) => {
    const werte = voll.map((p) => p.achsen[i]);
    const mit = werte.filter((w) => w.diff !== null);
    return {
      key: a.key,
      label: a.label,
      n: mit.length,
      gleich: mit.filter((w) => w.diff === 0).length,
      nah: mit.filter((w) => Math.abs(w.diff!) <= 1).length,
      mittel: mit.length ? mit.reduce((s, w) => s + Math.abs(w.diff!), 0) / mit.length : null,
      offenEinseitig: werte.filter((w) => (w.ki === null) !== (w.ref === null)).length,
    };
  });
  const gleichMenge = (x: string[], y: string[]) => x.length === y.length && x.every((v) => y.includes(v));
  // Nur beidseitig vorhandene Werte zählen; fehlende Angaben stehen gesondert
  const kennzahl = (wert: (s: SvKurz) => string | string[]) => {
    const da = (x: string | string[]) => (Array.isArray(x) ? x.length > 0 : !!x);
    const beide = voll.filter((p) => da(wert(p.ki!)) && da(wert(p.ref!)));
    return {
      n: beide.length,
      gleich: beide.filter((p) => {
        const x = wert(p.ki!);
        const y = wert(p.ref!);
        return Array.isArray(x) ? gleichMenge(x, y as string[]) : x === y;
      }).length,
      fehlend: voll.length - beide.length,
    };
  };
  return {
    paare,
    achsen,
    beurteilung: kennzahl((s) => s.beurteilung),
    tendenz: kennzahl((s) => s.tendenz),
    arten: kennzahl((s) => s.arten),
    zugeordnet: voll.length,
    ohneGegenstueck: paare.length - voll.length,
  };
}

export interface GespeicherterVergleich {
  /** Dateiname der Referenzfassung */
  referenz: string;
  /** SHA-256 des Dateiinhalts der Referenzfassung */
  referenzHash?: string;
  /** Referenzfassung nach Migration, damit sich die Zuordnung später ändern und der Vergleich nachvollziehen lässt */
  referenzDaten?: Meldung;
  verfahren?: string;
  /** true, wenn die Zuordnung von Hand geändert wurde */
  manuell?: boolean;
  zuordnung?: Zuordnung[];
  erstellt: string;
  ergebnis: Vergleich;
}

export function zuordnungAus(v: Vergleich): Zuordnung[] {
  return v.paare.filter((p) => p.ki && p.ref).map((p) => ({ ki: p.ki!.index, ref: p.ref!.index }));
}

/** Tabelle für CSV: eine Zeile je Paar und Achse. */
export function vergleichTabelle(v: Vergleich): string[][] {
  const z: string[][] = [
    [
      "Sachverhalt KI",
      "Sachverhalt Referenz",
      "Ähnlichkeit",
      "Beurteilung KI",
      "Beurteilung Referenz",
      "Tendenz KI",
      "Tendenz Referenz",
      "Achse",
      "Stufe KI",
      "Stufe Referenz",
      "Abweichung",
    ],
  ];
  for (const p of v.paare) {
    for (const a of p.achsen.length ? p.achsen : [undefined]) {
      z.push([
        p.ki?.bezeichnung ?? "",
        p.ref?.bezeichnung ?? "",
        p.aehnlichkeit.toFixed(2),
        p.ki?.beurteilung ?? "",
        p.ref?.beurteilung ?? "",
        p.ki?.tendenz ?? "",
        p.ref?.tendenz ?? "",
        a?.label ?? "",
        a?.ki === null || a?.ki === undefined ? "" : String(a.ki),
        a?.ref === null || a?.ref === undefined ? "" : String(a.ref),
        a?.diff === null || a?.diff === undefined ? "" : String(a.diff),
      ]);
    }
  }
  return z;
}

// Mehrfachvergleich (Befund LS-2026-W43-04, 24.10.2026): n unabhängige Kodierungen derselben Lage,
// etwa mehrere Personen, Wiederholungen eines Modells oder Varianten eines Bewertungsplans.
// Wie beim paarweisen Vergleich gibt es keinen Gesamtscore über Achsen; alle Kennzahlen stehen je Achse.

/** Erwarteter Radarwert einer Achse (erwartungen.radar eines Bewertungsfalls) */
export interface RadarErwartung {
  offen?: boolean;
  min?: number;
  max?: number;
}

export interface MehrfachAchse {
  key: string;
  label: string;
  /** Werte der Kodierungen in der Reihenfolge der Meldungen, null = offen */
  werte: (number | null)[];
  /** Kodierungen mit Wert */
  n: number;
  /** Kodierungen ohne Wert */
  offen: number;
  median: number | null;
  min: number | null;
  max: number | null;
  /** Paare von Kodierungen, die beide einen Wert haben */
  paare: number;
  /** davon höchstens eine Stufe Abstand */
  nah: number;
  /** Kodierungen, die der Erwartung entsprechen; fehlt ohne Erwartung zu dieser Achse */
  imSoll?: number;
}

export interface MehrfachGruppe {
  /** Bezeichnung des Sachverhalts in der ersten Meldung */
  bezeichnung: string;
  /** Kodierungen, die diesem Sachverhalt zugeordnet sind (einschließlich der ersten Meldung) */
  kodierungen: number;
  achsen: MehrfachAchse[];
}

export interface Mehrfachvergleich {
  verfahren: string;
  meldungen: number;
  gruppen: MehrfachGruppe[];
  /** Sachverhalte weiterer Meldungen ohne Gegenstück in der ersten Meldung */
  ohneGegenstueck: number;
  /** Krippendorffs Alpha (ordinal) je Achse über die Sachverhalte als Einheiten */
  alpha: { key: string; label: string; wert: number | null; einheiten: number }[];
}

export const MEHRFACH_VERFAHREN = "ki-lead-mehrfachvergleich/1";

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function imSoll(w: number | null, e: RadarErwartung): boolean {
  if (e.offen) return w === null;
  return w !== null && e.min !== undefined && e.max !== undefined && w >= e.min && w <= e.max;
}

/**
 * Krippendorffs Alpha für ordinale Werte. Einheiten sind z. B. Sachverhalte, je Einheit stehen die Werte der
 * Kodierungen (null = offen, zählt nicht). Nur Einheiten mit mindestens zwei Werten gehen ein. null, wenn weniger
 * als zwei solche Einheiten vorliegen (eine einzelne Einheit ergibt keine aussagekräftige Erwartung) oder alle
 * Werte gleich sind. Bei wenigen Einheiten ist der Wert unsicher; er steht deshalb immer mit der Zahl der Einheiten.
 */
export function krippendorffAlphaOrdinal(einheiten: (number | null)[][]): number | null {
  const paarbar = einheiten.map((e) => e.filter((w): w is number => w !== null)).filter((e) => e.length >= 2);
  if (paarbar.length < 2) return null;
  const werte = [...new Set(paarbar.flat())].sort((a, b) => a - b);
  const pos = new Map(werte.map((w, i) => [w, i]));
  const k = werte.length;
  const o = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (const e of paarbar)
    for (let i = 0; i < e.length; i++) for (let j = 0; j < e.length; j++) if (i !== j) o[pos.get(e[i])!][pos.get(e[j])!] += 1 / (e.length - 1);
  const nc = o.map((zeile) => zeile.reduce((s, x) => s + x, 0));
  const n = nc.reduce((s, x) => s + x, 0);
  const delta = (c: number, d: number) => {
    const [a, b] = c <= d ? [c, d] : [d, c];
    let s = 0;
    for (let g = a; g <= b; g++) s += nc[g];
    return (s - (nc[a] + nc[b]) / 2) ** 2;
  };
  let beobachtet = 0;
  let erwartet = 0;
  for (let c = 0; c < k; c++)
    for (let d = 0; d < k; d++) {
      const dl = delta(c, d);
      beobachtet += o[c][d] * dl;
      erwartet += nc[c] * nc[d] * dl;
    }
  if (erwartet === 0) return null;
  return 1 - ((n - 1) * beobachtet) / erwartet;
}

/**
 * Vergleicht mehrere Kodierungen derselben Lage. Bezug sind die Sachverhalte der ersten Meldung; die Sachverhalte
 * jeder weiteren Meldung werden ihnen wie beim paarweisen Vergleich zugeordnet. Eine Erwartung (erwartungen.radar
 * eines Bewertungsfalls) gilt nur, wenn die erste Meldung genau einen Sachverhalt hat.
 */
export function vergleicheMehrere(meldungen: Meldung[], profil: Profil, erwartung?: Record<string, RadarErwartung>): Mehrfachvergleich {
  const def = radarDef(profil);
  const achsen = def?.achsen || [];
  if (!meldungen.length) return { verfahren: MEHRFACH_VERFAHREN, meldungen: 0, gruppen: [], ohneGegenstueck: 0, alpha: [] };
  const [erste, ...weitere] = meldungen;
  const bezug = kurz(erste, profil);
  // je Sachverhalt der ersten Meldung die zugeordneten Sachverhalte aller Meldungen
  const spalten: SvKurz[][] = bezug.map((s) => [s]);
  let ohneGegenstueck = 0;
  for (const m of weitere) {
    for (const p of zuordnen(m, erste, profil)) {
      if (p.ki && p.ref) spalten[p.ref.index].push(p.ki);
      else if (p.ki) ohneGegenstueck++;
    }
  }
  const soll = bezug.length === 1 ? erwartung : undefined;
  const gruppen: MehrfachGruppe[] = spalten.map((kodiert, i) => ({
    bezeichnung: bezug[i].bezeichnung,
    kodierungen: kodiert.length,
    achsen: achsen.map((a) => {
      const werte = kodiert.map((s) => s.radar[a.key] ?? null);
      const mit = werte.filter((w): w is number => w !== null);
      let paare = 0;
      let nah = 0;
      for (let x = 0; x < mit.length; x++)
        for (let y = x + 1; y < mit.length; y++) {
          paare++;
          if (Math.abs(mit[x] - mit[y]) <= 1) nah++;
        }
      const e = soll?.[a.key];
      return {
        key: a.key,
        label: a.label,
        werte,
        n: mit.length,
        offen: werte.length - mit.length,
        median: median(mit),
        min: mit.length ? Math.min(...mit) : null,
        max: mit.length ? Math.max(...mit) : null,
        paare,
        nah,
        ...(e ? { imSoll: werte.filter((w) => imSoll(w, e)).length } : {}),
      };
    }),
  }));
  const alpha = achsen.map((a, i) => {
    const einheiten = gruppen.map((g) => g.achsen[i].werte);
    return {
      key: a.key,
      label: a.label,
      wert: krippendorffAlphaOrdinal(einheiten),
      einheiten: einheiten.filter((e) => e.filter((w) => w !== null).length >= 2).length,
    };
  });
  return { verfahren: MEHRFACH_VERFAHREN, meldungen: meldungen.length, gruppen, ohneGegenstueck, alpha };
}
