// Einstellungen der KI-Pipeline. Leere Modellfelder bedeuten: Vorgabe des Profils bzw. der App.

import { get, set } from "idb-keyval";
import type { Aufwand } from "../anbieter/typen";
import { LEERE_SCHLUESSEL, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import type { Profil } from "../kern/typen";
import { schluesselAusAblage, schluesselInAblage } from "../schluessel/ablage";

export type Rolle = "vorverarbeitung" | "erfassung" | "verdichtung" | "reparatur" | "kurzfassung";

export interface Einstellungen {
  modelle: Record<Rolle, string>;
  aufwand: Record<Rolle, Aufwand>;
  websucheMax: number;
  abrufMax: number;
  /** Höchstlänge je abgerufener Seite (Token); begrenzt Kosten bei sehr langen Seiten */
  abrufMaxTokens: number;
  /** ISO-Ländercode für die Lokalisierung der Websuche */
  suchland: string;
  /**
   * Höchstzahl Ausgabetoken für jeden KI-Aufruf (S1, S2, S3, Management Summary). Der Name stammt aus der Zeit,
   * als der Wert nur für S2 und S3 galt; er bleibt, damit gespeicherte Einstellungen gültig bleiben.
   */
  maxTokensErfassung: number;
  /** Fassung der gespeicherten Einstellungen (für Umstellungen der Vorgaben) */
  fassung?: number;
}

export const APP_MODELLE: Record<Rolle, string> = {
  vorverarbeitung: "claude-haiku-5-5",
  erfassung: "claude-opus-5-5",
  verdichtung: "claude-sonnet-5-5",
  reparatur: "claude-sonnet-5-5",
  kurzfassung: "claude-sonnet-5-5",
};

export const MODELL_GRUPPEN: { anbieter: string; modelle: string[] }[] = [
  { anbieter: "Anthropic", modelle: ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1"] },
  { anbieter: "OpenAI", modelle: ["gpt-6-luna", "gpt-6.1-sol", "gpt-6-astra"] },
];

export const MODELL_AUSWAHL = MODELL_GRUPPEN.flatMap((g) => g.modelle);

export const STANDARD: Einstellungen = {
  modelle: { vorverarbeitung: "", erfassung: "", verdichtung: "", reparatur: "", kurzfassung: "" },
  aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  websucheMax: 15,
  abrufMax: 10,
  abrufMaxTokens: 15000,
  suchland: "DE",
  maxTokensErfassung: 128000,
  fassung: 3,
};

export function modellFuer(rolle: Rolle, e: Einstellungen, profil: Profil): string {
  return e.modelle[rolle] || profil.manifest.modelle?.[rolle] || APP_MODELLE[rolle];
}

export async function einstellungenLesen(): Promise<Einstellungen> {
  const g = (await get("einstellungen")) as Partial<Einstellungen> | undefined;
  // Fassung 1 → 2: S2 brauchte bei hohem Aufwand bis zu 60 000 Token zum Nachdenken und brach an
  // der alten Grenze von 64 000 Ausgabetoken ab. Alte Vorgaben werden daher angehoben.
  if (g && !g.fassung) {
    if (g.maxTokensErfassung === 64000) g.maxTokensErfassung = 128000;
    if (g.aufwand?.erfassung === "high") g.aufwand = { ...g.aufwand, erfassung: "medium" };
    g.fassung = 2;
  }
  // Fassung 2 → 3: S1 hielt bei mittlerem Aufwand Regeln zu t0 und Prüffrage oft nicht ein. Die alte
  // Vorgabe „medium“ wird auf „high“ angehoben; eine bewusst andere Wahl bleibt stehen.
  if (g && g.fassung === 2) {
    if (g.aufwand?.vorverarbeitung === "medium") g.aufwand = { ...g.aufwand, vorverarbeitung: "high" };
    g.fassung = 3;
  }
  return {
    ...STANDARD,
    ...g,
    modelle: { ...STANDARD.modelle, ...(g?.modelle || {}) },
    aufwand: { ...STANDARD.aufwand, ...(g?.aufwand || {}) },
  };
}

export async function einstellungenSchreiben(e: Einstellungen): Promise<void> {
  await set("einstellungen", e);
}

// Der API-Schlüssel liegt getrennt von den übrigen Einstellungen und wird nie exportiert. Wo er liegt, wählt die
// Person unter „Einstellungen“ (src/schluessel/ablage.ts: Gerätespeicher, nur Sitzung, Schlüsselbund des Systems).
export async function schluesselLesen(anbieter: AnbieterId = "anthropic"): Promise<string> {
  return schluesselAusAblage(anbieter);
}

export async function schluesselSchreiben(wert: string, anbieter: AnbieterId = "anthropic"): Promise<void> {
  return schluesselInAblage(anbieter, wert);
}

export async function alleSchluesselLesen(): Promise<Schluessel> {
  const out: Schluessel = { ...LEERE_SCHLUESSEL };
  for (const id of Object.keys(out) as AnbieterId[]) out[id] = await schluesselLesen(id);
  return out;
}

/** Modelle, die ein Lauf der KI-Erfassung voraussichtlich nutzt. */
export function laufModelle(e: Einstellungen, profil: Profil, verdichtung: boolean): string[] {
  return [modellFuer("vorverarbeitung", e, profil), modellFuer(verdichtung ? "verdichtung" : "erfassung", e, profil), modellFuer("reparatur", e, profil)];
}

/** Stufen des Aufwands mit deutscher Bezeichnung (Einstellungen und Wahl je Lauf) */
export const AUFWAND_STUFEN: { id: Aufwand; titel: string }[] = [
  { id: "low", titel: "niedrig" },
  { id: "medium", titel: "mittel" },
  { id: "high", titel: "hoch" },
  { id: "xhigh", titel: "sehr hoch" },
  { id: "max", titel: "maximal" },
];

export const ROLLEN: Rolle[] = ["vorverarbeitung", "erfassung", "verdichtung", "reparatur", "kurzfassung"];

/** Höchstzahl der Websuchen je Lauf (wie unter „Einstellungen“) */
export const WEBSUCHE_GRENZE = 50;

/**
 * Wahl nur für einen Lauf, abweichend von den Einstellungen (leer = Standard): Modell je Stufe als Schlüssel der
 * Rolle, dazu optional Aufwand je Stufe und die Höchstzahl der Websuchen.
 */
export type ModellWahl = Partial<Record<Rolle, string>> & {
  aufwand?: Partial<Record<Rolle, Aufwand>>;
  websucheMax?: number;
};

/** Ob die Wahl etwas von den Einstellungen abweichen lässt */
export function wahlAbweichend(wahl: ModellWahl, rollen: Rolle[] = ROLLEN, mitWebsuche = true): boolean {
  return rollen.some((r) => !!wahl[r] || !!wahl.aufwand?.[r]) || (mitWebsuche && wahl.websucheMax !== undefined);
}

/** Einstellungen mit der für diesen Lauf getroffenen Wahl; nicht gewählte Stufen behalten ihre Vorgabe */
export function mitModellwahl(e: Einstellungen, wahl: ModellWahl): Einstellungen {
  const modelle = Object.fromEntries(ROLLEN.filter((r) => !!wahl[r]).map((r) => [r, wahl[r]!]));
  const aufwand = Object.fromEntries(ROLLEN.filter((r) => !!wahl.aufwand?.[r]).map((r) => [r, wahl.aufwand![r]!]));
  const websuche = wahl.websucheMax !== undefined && Number.isFinite(wahl.websucheMax);
  if (!Object.keys(modelle).length && !Object.keys(aufwand).length && !websuche) return e;
  return {
    ...e,
    modelle: { ...e.modelle, ...modelle },
    aufwand: { ...e.aufwand, ...aufwand },
    ...(websuche ? { websucheMax: Math.min(WEBSUCHE_GRENZE, Math.max(0, Math.round(wahl.websucheMax!))) } : {}),
  };
}
