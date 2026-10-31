// Adresse der Ansicht im Hash (seit 0.6.5, TP-2026-W44-20): Ansicht, Bereich der Einstellungen und Reiter des Lagebilds
// stehen in der Adresse, etwa „#/einstellungen/modelle“ oder „#/lagebild/redaktion“. Neuladen behält die Ansicht,
// Zurück und Vor im Browser wechseln sie, Tiefenlinks öffnen sie. Bis 0.6.4 hielt die App sie nur im Speicher; ein
// Neuladen sprang auf „Meldung“. Inhalte (Meldungen, Profile) stehen nie in der Adresse.

import type { EinstellungsBereich } from "../Einstellungen";

export type Ansicht = "meldung" | "ki" | "lagebild" | "profile" | "einstellungen";

export const ANSICHTEN: readonly Ansicht[] = ["meldung", "ki", "lagebild", "profile", "einstellungen"];

export const EINSTELLUNGS_BEREICHE: readonly EinstellungsBereich[] = [
  "uebersicht",
  "anbieter",
  "modelle",
  "testlaeufe",
  "recherche",
  "darstellung",
  "daten",
  "ueber",
];

export const LAGEBILD_REITER = ["uebersicht", "meldungen", "sachverhalte", "radar", "redaktion", "kopiervorlage", "tabelle"] as const;
export type LagebildReiter = (typeof LAGEBILD_REITER)[number];

export interface Adresse {
  ansicht: Ansicht;
  /** nur bei „einstellungen“ */
  bereich?: EinstellungsBereich;
  /** nur bei „lagebild“ */
  reiter?: LagebildReiter;
}

const enthalten = <T extends string>(liste: readonly T[], wert: string | undefined): wert is T => !!wert && (liste as readonly string[]).includes(wert);

/** Liest „#/ansicht/teil“; Unbekanntes ergibt die Meldung bzw. lässt den Teil weg */
export function adresseLesen(hash: string): Adresse {
  const [ansicht, teil] = hash.replace(/^#\/?/, "").split("/");
  if (!enthalten(ANSICHTEN, ansicht)) return { ansicht: "meldung" };
  if (ansicht === "einstellungen") return enthalten(EINSTELLUNGS_BEREICHE, teil) ? { ansicht, bereich: teil } : { ansicht };
  if (ansicht === "lagebild") return enthalten(LAGEBILD_REITER, teil) ? { ansicht, reiter: teil } : { ansicht };
  return { ansicht };
}

/** Hash zur Adresse: „#/einstellungen/modelle“ */
export function adresseText(a: Adresse): string {
  const teil = a.ansicht === "einstellungen" ? a.bereich : a.ansicht === "lagebild" ? a.reiter : undefined;
  return `#/${a.ansicht}${teil ? `/${teil}` : ""}`;
}
