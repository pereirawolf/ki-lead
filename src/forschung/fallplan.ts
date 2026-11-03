// Bewertungsplan für die Fallreihe (seit 0.7.1, TP-2026-W44-64): Plan nach evaluation/plaene/plan.schema.json laden,
// prüfen und in eine Auswahl aus Fällen, Varianten, Wiederholungen, Recherchetiefe und Deckel übersetzen. Ohne Plan
// bilden die gewählten Anbieter die Varianten (Matrix Fälle × Anbieter).

import planSchema from "../../evaluation/plaene/plan.schema.json";
import type { Aufwand } from "../anbieter/typen";
import type { AnbieterId } from "../anbieter/verteiler";
import { pruefeRoh } from "../kern/validierung";
import { sha256 } from "../profil/laden";
import { standardProfilAnwenden, type Einstellungen } from "../pipeline/einstellungen";
import { RECHERCHE_STUFEN, type StufeId } from "../pipeline/recherchetiefe";
import type { FallArt, KatalogFall } from "./fallkatalog";

export const PLAN_FORMAT = "ki-lead-bewertungsplan/1";

/** Höchstzahl der Wiederholungen je Fall und Variante */
export const WIEDERHOLUNGEN_MAX = 5;

/** Anbieter, die eine Fallreihe als Standardprofil führt */
export type ReihenAnbieter = Extract<AnbieterId, "anthropic" | "openai" | "mistral">;
export const REIHEN_ANBIETER: ReihenAnbieter[] = ["anthropic", "openai", "mistral"];

export interface Stufe {
  modell: string;
  aufwand: Aufwand;
}

/** Variante einer Fallreihe: Standardprofil eines Anbieters und/oder Modelle für S1 und S2 */
export interface ReihenVariante {
  kennung: string;
  ki_profil?: ReihenAnbieter;
  s1?: Stufe;
  s2?: Stufe;
  mistral_endpunkt?: "eu" | "global";
}

export interface Bewertungsplan {
  format: typeof PLAN_FORMAT;
  id: string;
  stand: string;
  fragestellung: string;
  faelle: string[];
  varianten?: (ReihenVariante & { material?: string; kurzfassung?: Stufe; reparatur?: Stufe })[];
  wiederholungen?: number;
  budget_usd?: number;
  recherche?: StufeId;
  fallpaket?: { name?: string; sha256: string };
  meldung_fest?: unknown;
  s1_fest?: unknown;
  hinweis?: string;
}

export interface GeladenerPlan {
  plan: Bewertungsplan;
  /** SHA-256 der Plandatei, wie sie geladen wurde */
  sha256: string;
  name: string;
}

/**
 * Liest und prüft eine Plandatei. Wirft mit lesbarer Meldung, wenn sie kein Plan ist oder für die Fallreihe nicht taugt
 * (Schemafehler, feste Meldung oder fester S1-Gegenstand, Varianten mit Material, Management Summary oder Reparatur).
 */
export async function planLesen(text: string, name: string): Promise<GeladenerPlan> {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error(`${name}: kein gültiges JSON.`);
  }
  if ((obj as Bewertungsplan | null)?.format !== PLAN_FORMAT) throw new Error(`${name}: kein Bewertungsplan (erwartet: Format „${PLAN_FORMAT}“).`);
  const fehler = pruefeRoh(planSchema, obj);
  if (fehler.length)
    throw new Error(
      `${name} entspricht nicht plan.schema.json: ${fehler
        .slice(0, 3)
        .map((f) => `${f.pfad || "/"}: ${f.text}`)
        .join("; ")}`,
    );
  const plan = obj as Bewertungsplan;
  if (plan.meldung_fest || plan.s1_fest) throw new Error(`${name}: Pläne mit fester Meldung oder festem S1-Gegenstand laufen über die Testarten am Fall Ilka.`);
  const fremd = (plan.varianten ?? []).find((v) => v.material || v.kurzfassung || v.reparatur);
  if (fremd) throw new Error(`${name}: Variante ${fremd.kennung} nennt Material, Management Summary oder Reparatur; die Fallreihe kennt nur S1 und S2.`);
  const ohne = (plan.varianten ?? []).find((v) => !v.ki_profil && !v.s1 && !v.s2);
  if (ohne) throw new Error(`${name}: Variante ${ohne.kennung} nennt weder ein KI-Profil noch Modelle für S1 oder S2.`);
  const kennungen = (plan.varianten ?? []).map((v) => v.kennung);
  const doppelt = kennungen.find((k, i) => kennungen.indexOf(k) !== i);
  if (doppelt) throw new Error(`${name}: Variante ${doppelt} steht mehrfach im Plan.`);
  return { plan, sha256: await sha256(text), name };
}

/** Auswahl der Fallreihe */
export interface Auswahl {
  faelle: string[];
  varianten: ReihenVariante[];
  wiederholungen: number;
  budgetUsd?: number;
  recherche?: StufeId;
}

export interface PlanAbgleich {
  auswahl: Auswahl;
  /** Fälle des Plans, die weder mitgeliefert noch im Paket sind */
  fehlend: string[];
  /** Fälle des Plans, die die Fallreihe nicht laufen lassen kann, mit Grund */
  unzulaessig: { id: string; grund: string }[];
  /** Fälle des Plans aus einem Paket mit anderer Prüfsumme als im Plan */
  paketAbweichung: string[];
  /** Hindernisse für den Start (leer = startbereit) */
  sperren: string[];
}

export const wiederholungenBegrenzt = (n: unknown): number => {
  const z = Math.floor(Number(n));
  return Number.isFinite(z) ? Math.max(1, Math.min(WIEDERHOLUNGEN_MAX, z)) : 1;
};

/** Übersetzt den Plan in eine Auswahl und prüft sie gegen den Katalog */
export function planAbgleichen(g: GeladenerPlan, katalog: KatalogFall[]): PlanAbgleich {
  const p = g.plan;
  const nachId = new Map(katalog.map((k) => [k.fall.id, k]));
  const fehlend = p.faelle.filter((id) => !nachId.has(id));
  const unzulaessig = p.faelle.flatMap((id) => {
    const k = nachId.get(id);
    return k && !k.zulaessig ? [{ id, grund: k.grund ?? "nicht zulässig" }] : [];
  });
  const paketAbweichung = p.fallpaket ? p.faelle.filter((id) => nachId.get(id)?.quelle === "paket" && nachId.get(id)?.paket !== p.fallpaket!.sha256) : [];
  const ausPaket = p.faelle.some((id) => nachId.get(id)?.quelle === "paket");
  const sperren = [
    ...(fehlend.length
      ? [
          `Fälle fehlen: ${fehlend.join(", ")}${p.fallpaket ? ` (Fallpaket ${p.fallpaket.name ?? ""} mit SHA-256 ${p.fallpaket.sha256.slice(0, 12)}… importieren)` : ""}`,
        ]
      : []),
    ...unzulaessig.map((u) => `${u.id}: ${u.grund}`),
    ...(paketAbweichung.length ? [`Fallpaket weicht von der Prüfsumme des Plans ab: ${paketAbweichung.join(", ")}`] : []),
    ...(ausPaket && !p.fallpaket ? ["Der Plan nennt Fälle aus einem Fallpaket, aber keine Prüfsumme (fallpaket.sha256)."] : []),
    ...(!(p.varianten ?? []).length ? ["Der Plan nennt keine Varianten."] : []),
  ];
  return {
    auswahl: {
      faelle: p.faelle.filter((id) => nachId.has(id)),
      varianten: (p.varianten ?? []).map(({ kennung, ki_profil, s1, s2, mistral_endpunkt }) => ({
        kennung,
        ...(ki_profil ? { ki_profil } : {}),
        ...(s1 ? { s1 } : {}),
        ...(s2 ? { s2 } : {}),
        ...(mistral_endpunkt ? { mistral_endpunkt } : {}),
      })),
      wiederholungen: wiederholungenBegrenzt(p.wiederholungen ?? 1),
      ...(p.budget_usd !== undefined ? { budgetUsd: p.budget_usd } : {}),
      ...(p.recherche ? { recherche: p.recherche } : {}),
    },
    fehlend,
    unzulaessig,
    paketAbweichung,
    sperren,
  };
}

/** Varianten der Matrix: Standardprofil je gewähltem Anbieter, Mistral mit dem gewählten Endpunkt */
export function matrixVarianten(anbieter: ReihenAnbieter[], mistralEndpunkt: "eu" | "global"): ReihenVariante[] {
  return REIHEN_ANBIETER.filter((a) => anbieter.includes(a)).map((a) =>
    a === "mistral" ? { kennung: `mistral-${mistralEndpunkt}`, ki_profil: a, mistral_endpunkt: mistralEndpunkt } : { kennung: a, ki_profil: a },
  );
}

/**
 * Einstellungen für einen Lauf: Standardprofil der Variante, dann S1 (Vorverarbeitung) und S2 (Erfassung und
 * Verdichtung) nach der Variante, Mistral-Endpunkt und Recherchetiefe; alles andere aus den Einstellungen.
 */
export function einstellungenFuerLauf(e: Einstellungen, v: ReihenVariante, recherche?: StufeId): Einstellungen {
  let x = v.ki_profil ? standardProfilAnwenden(e, v.ki_profil) : { ...e, modelle: { ...e.modelle }, aufwand: { ...e.aufwand } };
  if (v.s1) {
    x.modelle.vorverarbeitung = v.s1.modell;
    x.aufwand.vorverarbeitung = v.s1.aufwand;
  }
  if (v.s2) {
    x.modelle.erfassung = x.modelle.verdichtung = v.s2.modell;
    x.aufwand.erfassung = x.aufwand.verdichtung = v.s2.aufwand;
  }
  if (v.mistral_endpunkt) x = { ...x, anbieterOptionen: { ...x.anbieterOptionen, mistral: { ...x.anbieterOptionen.mistral, endpunkt: v.mistral_endpunkt } } };
  if (recherche) x = { ...x, ...RECHERCHE_STUFEN.find((s) => s.id === recherche)!.werte };
  return x;
}

/** Rolle der Stufe S2 für die Art des Falls */
export const s2Rolle = (art: FallArt): "erfassung" | "verdichtung" => (art === "verdichtung" ? "verdichtung" : "erfassung");
