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
  beurteilung: { n: number; gleich: number };
  tendenz: { n: number; gleich: number };
  arten: { n: number; gleich: number };
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
export function zuordnen(ki: Meldung, ref: Meldung, profil: Profil): { ki?: SvKurz; ref?: SvKurz; aehnlichkeit: number }[] {
  const a = kurz(ki, profil);
  const b = kurz(ref, profil);
  const sva = sachverhalte(ki, profil.ui);
  const svb = sachverhalte(ref, profil.ui);
  if (a.length === 1 && b.length === 1) return [{ ki: a[0], ref: b[0], aehnlichkeit: jaccard(merkmal(a[0], sva[0], profil), merkmal(b[0], svb[0], profil)) }];
  const kandidaten: { i: number; j: number; w: number }[] = [];
  a.forEach((x, i) => b.forEach((y, j) => kandidaten.push({ i, j, w: jaccard(merkmal(x, sva[i], profil), merkmal(y, svb[j], profil)) })));
  kandidaten.sort((x, y) => y.w - x.w);
  const belegtA = new Set<number>();
  const belegtB = new Set<number>();
  const paare: { ki?: SvKurz; ref?: SvKurz; aehnlichkeit: number }[] = [];
  for (const k of kandidaten) {
    if (k.w < 0.08 || belegtA.has(k.i) || belegtB.has(k.j)) continue;
    belegtA.add(k.i);
    belegtB.add(k.j);
    paare.push({ ki: a[k.i], ref: b[k.j], aehnlichkeit: k.w });
  }
  a.forEach((x, i) => !belegtA.has(i) && paare.push({ ki: x, aehnlichkeit: 0 }));
  b.forEach((y, j) => !belegtB.has(j) && paare.push({ ref: y, aehnlichkeit: 0 }));
  return paare.sort((x, y) => (x.ki?.index ?? 99) - (y.ki?.index ?? 99) || (x.ref?.index ?? 99) - (y.ref?.index ?? 99));
}

export function vergleiche(ki: Meldung, ref: Meldung, profil: Profil): Vergleich {
  const def = radarDef(profil);
  const paare: SvPaar[] = zuordnen(ki, ref, profil).map((p) => ({
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
  return {
    paare,
    achsen,
    beurteilung: { n: voll.length, gleich: voll.filter((p) => p.ki!.beurteilung === p.ref!.beurteilung).length },
    tendenz: { n: voll.length, gleich: voll.filter((p) => p.ki!.tendenz === p.ref!.tendenz).length },
    arten: { n: voll.length, gleich: voll.filter((p) => gleichMenge(p.ki!.arten, p.ref!.arten)).length },
  };
}

export interface GespeicherterVergleich {
  referenz: string;
  erstellt: string;
  ergebnis: Vergleich;
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
