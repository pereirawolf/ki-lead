// Einstellungen der KI-Pipeline. Leere Modellfelder bedeuten: Vorgabe des Profils bzw. der App.

import { del, get, set } from "idb-keyval";
import type { Aufwand } from "../anbieter/typen";
import type { Profil } from "../kern/typen";

export type Rolle = "vorverarbeitung" | "erfassung" | "reparatur";

export interface Einstellungen {
  modelle: Record<Rolle, string>;
  aufwand: Record<Rolle, Aufwand>;
  websucheMax: number;
  abrufMax: number;
  /** ISO-Ländercode für die Lokalisierung der Websuche */
  suchland: string;
  maxTokensErfassung: number;
}

export const APP_MODELLE: Record<Rolle, string> = {
  vorverarbeitung: "claude-haiku-5-5",
  erfassung: "claude-sonnet-5-5",
  reparatur: "claude-sonnet-5-5",
};

export const MODELL_AUSWAHL = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1"];

export const STANDARD: Einstellungen = {
  modelle: { vorverarbeitung: "", erfassung: "", reparatur: "" },
  aufwand: { vorverarbeitung: "medium", erfassung: "high", reparatur: "low" },
  websucheMax: 15,
  abrufMax: 10,
  suchland: "DE",
  maxTokensErfassung: 64000,
};

export function modellFuer(rolle: Rolle, e: Einstellungen, profil: Profil): string {
  return e.modelle[rolle] || profil.manifest.modelle?.[rolle] || APP_MODELLE[rolle];
}

export async function einstellungenLesen(): Promise<Einstellungen> {
  const g = (await get("einstellungen")) as Partial<Einstellungen> | undefined;
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
