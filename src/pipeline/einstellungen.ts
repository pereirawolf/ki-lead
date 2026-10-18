// Einstellungen der KI-Pipeline. Leere Modellfelder bedeuten: Vorgabe des Profils bzw. der App.

import { del, get, set } from "idb-keyval";
import type { Aufwand } from "../anbieter/typen";
import { LEERE_SCHLUESSEL, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import type { Profil } from "../kern/typen";

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
  maxTokensErfassung: number;
  /** Fassung der gespeicherten Einstellungen (für Umstellungen der Vorgaben) */
  fassung?: number;
}

export const APP_MODELLE: Record<Rolle, string> = {
  vorverarbeitung: "claude-haiku-5-5",
  erfassung: "claude-sonnet-5-5",
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
  aufwand: { vorverarbeitung: "medium", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  websucheMax: 15,
  abrufMax: 10,
  abrufMaxTokens: 15000,
  suchland: "DE",
  maxTokensErfassung: 128000,
  fassung: 2,
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

// Der API-Schlüssel liegt getrennt von den übrigen Einstellungen und wird nie exportiert.
export async function schluesselLesen(anbieter = "anthropic"): Promise<string> {
  return ((await get(`schluessel:${anbieter}`)) as string | undefined) || "";
}

export async function schluesselSchreiben(wert: string, anbieter = "anthropic"): Promise<void> {
  if (wert) await set(`schluessel:${anbieter}`, wert);
  else await del(`schluessel:${anbieter}`);
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
