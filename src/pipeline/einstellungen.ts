// Einstellungen der KI-Pipeline. Leere Modellfelder bedeuten: Vorgabe des Profils bzw. der App.

import { get, set } from "idb-keyval";
import { aufwandAngeboten, aufwandStufenFuer } from "../anbieter/aufwand";
import type { Aufwand } from "../anbieter/typen";
import { mistralWerkzeuge, type MistralEndpunkt } from "../anbieter/mistral";
import { anbieterVon, LEERE_SCHLUESSEL, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
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
  /**
   * Mistral (seit 0.5.6): „eu“ = regionaler Endpunkt api.eu.mistral.ai ohne Websuche (Vorgabe), „global“ =
   * api.mistral.ai mit Websuche. Fehlt der Wert in gespeicherten Einstellungen, gilt die Vorgabe.
   */
  mistralEndpunkt: MistralEndpunkt;
  /** Fassung der gespeicherten Einstellungen (für Umstellungen der Vorgaben) */
  fassung?: number;
}

/**
 * Vorgaben der App für Profile ohne eigene Modellvorgabe; gleich dem Standard-Profil Anthropic. Verdichtung seit 0.5.10
 * mit Opus statt Sonnet (AV-2026-W43-10, entschieden am 25.10.2026): Sonnet kam im Vergleichslauf Ilka den Radarwerten
 * von Opus nahe, ließ aber die Tendenz im Stromausfall-Sachverhalt in zwei von drei Läufen offen; Bezug, Messwerte und
 * Standard-Profil beruhen auf Opus (evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md).
 */
export const APP_MODELLE: Record<Rolle, string> = {
  vorverarbeitung: "claude-haiku-5-5",
  erfassung: "claude-opus-5-5",
  verdichtung: "claude-opus-5-5",
  reparatur: "claude-sonnet-5-5",
  kurzfassung: "claude-sonnet-5-5",
};

export const MODELL_GRUPPEN: { anbieter: string; modelle: string[] }[] = [
  { anbieter: "Anthropic", modelle: ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1"] },
  { anbieter: "OpenAI", modelle: ["gpt-6-luna", "gpt-6.1-sol", "gpt-6-astra"] },
  { anbieter: "Mistral", modelle: ["mistral-small-2603", "mistral-medium-3-5", "mistral-large-4"] },
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
  mistralEndpunkt: "eu",
  fassung: 3,
};

/**
 * Standard-Profil je Anbieter: Modell und Aufwand je Aufgabe, mit einem Klick unter „Einstellungen“ zu setzen.
 * Anthropic entspricht den Vorgaben der App und des Beispielprofils (Verdichtung mit Opus wie in der Abnahme M4);
 * OpenAI nimmt die Gegenstücke gleicher Größe (klein, mittel, groß).
 * Mistral (seit 0.5.6): Mistral Small 4 für S1 und S3, Mistral Medium 3.5 für S2 und die Management Summary, jeweils mit
 * Nachdenken („hoch“, seit 0.5.10; Mistral kennt nur „niedrig“ = ohne und „hoch“ = mit, AV-2026-W43-03). Erprobt mit
 * der Verdichtung Ilka am 24.10.2026: EU-Endpunkt 7 Läufe, globaler Endpunkt 3 Läufe, ohne Websuche.
 *
 * Bezug (AV-2026-W43-04, entschieden am 24.10.2026): Das Standard-Profil Anthropic ist der Maßstab. Die Standard-Profile
 * OpenAI und Mistral werden so gewählt, dass sie bei der Verdichtung Ilka in den Kennzahlen des Vergleichslaufs der
 * Anthropic-Reihe am nächsten kommen (evaluation/plaene/standardprofile-ilka.json, Auswertung mit
 * npm run vergleichslauf:auswerten); ein teureres Modell oder eine höhere Stufe ist dafür zulässig. Kosten und Dauer
 * werden berichtet, entscheiden aber nicht.
 *
 * Ergebnis (25.10.2026, je drei Läufe, evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md):
 * - OpenAI (AV-2026-W43-13): Verdichtung mit gpt-6-astra „high“ (Variante D), weil sie in Radarabstand (0,80 statt 1,20),
 *   Tendenz und Ähnlichkeit näher an der Anthropic-Reihe liegt als „medium“ (Variante C, zweitbeste Option); beide lassen
 *   D2 und D4 offen und führen die Zahl der Stromlosen nicht zusammen. Erfassung bleibt „medium“ (nicht verglichen).
 *   Folgereihe 25.10.2026 mit „xhigh“ (AV-2026-W43-21): nicht näher, ohne Tendenz und mit weniger gesetzten Achsen;
 *   „high“ bleibt.
 * - Mistral (AV-2026-W43-14): Verdichtung mit mistral-medium-3-5 „high“ (Variante E), weil sie in Beurteilung,
 *   Achsenabweichung, Muss-Punkten und Zahlentreue näher an der Anthropic-Reihe liegt als mistral-large-4 „high“
 *   (Variante F, zweitbeste Option; nur im Radarabstand knapp näher, Public Preview, mehr Zahlenfehler).
 */
export const STANDARD_PROFILE: Record<AnbieterId, { modelle: Record<Rolle, string>; aufwand: Record<Rolle, Aufwand> }> = {
  anthropic: {
    modelle: {
      vorverarbeitung: "claude-haiku-5-5",
      erfassung: "claude-opus-5-5",
      verdichtung: "claude-opus-5-5",
      reparatur: "claude-sonnet-5-5",
      kurzfassung: "claude-sonnet-5-5",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  },
  openai: {
    modelle: {
      vorverarbeitung: "gpt-6-luna",
      erfassung: "gpt-6-astra",
      verdichtung: "gpt-6-astra",
      reparatur: "gpt-6.1-sol",
      kurzfassung: "gpt-6.1-sol",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "high", reparatur: "low", kurzfassung: "medium" },
  },
  mistral: {
    modelle: {
      vorverarbeitung: "mistral-small-2603",
      erfassung: "mistral-medium-3-5",
      verdichtung: "mistral-medium-3-5",
      reparatur: "mistral-small-2603",
      kurzfassung: "mistral-medium-3-5",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "high", verdichtung: "high", reparatur: "low", kurzfassung: "high" },
  },
};

/** Setzt Modell und Aufwand aller Aufgaben auf das Standard-Profil des Anbieters; alles andere bleibt. */
export function standardProfilAnwenden(e: Einstellungen, anbieter: AnbieterId): Einstellungen {
  const s = STANDARD_PROFILE[anbieter];
  return { ...e, modelle: { ...s.modelle }, aufwand: { ...s.aufwand } };
}

/**
 * Modelle leeren (Vorgabe des aktiven Profils bzw. der App) und den Aufwand auf die Vorgaben der App setzen;
 * alles andere bleibt.
 */
export function profilvorgabeAnwenden(e: Einstellungen): Einstellungen {
  return { ...e, modelle: { ...STANDARD.modelle }, aufwand: { ...STANDARD.aufwand } };
}

/** Folgen Modell und Aufwand aller Aufgaben gerade den Vorgaben des Profils (keine eigene Wahl)? */
export function profilvorgabeAktiv(e: Einstellungen): boolean {
  return ROLLEN.every((r) => !e.modelle[r] && e.aufwand[r] === STANDARD.aufwand[r]);
}

/** Sind Modell und Aufwand aller Aufgaben gerade genau das Standard-Profil des Anbieters? */
export function standardProfilAktiv(e: Einstellungen, anbieter: AnbieterId): boolean {
  const s = STANDARD_PROFILE[anbieter];
  return (Object.keys(s.modelle) as Rolle[]).every((r) => e.modelle[r] === s.modelle[r] && e.aufwand[r] === s.aufwand[r]);
}

export function modellFuer(rolle: Rolle, e: Einstellungen, profil: Profil): string {
  return e.modelle[rolle] || profil.manifest.modelle?.[rolle] || APP_MODELLE[rolle];
}

/**
 * Wirksamer Aufwand einer Aufgabe (seit 0.5.10, AV-2026-W43-02): die eingestellte Stufe, wenn das wirksame Modell sie
 * anbietet, sonst die nächsthöhere angebotene, ohne höhere die nächstniedrigere (Mistral: „mittel“ → „hoch“). Pipeline,
 * Schätzung, Vergleichslauf und Laufprotokoll verwenden diese Stufe.
 */
export function aufwandFuer(rolle: Rolle, e: Einstellungen, profil: Profil): Aufwand {
  return aufwandAngeboten(modellFuer(rolle, e, profil), e.aufwand[rolle]);
}

/** Stufen des Aufwands, die das Modell anbietet, mit deutscher Bezeichnung (Auswahl in Einstellungen und je Lauf) */
export function aufwandAuswahl(modell: string): { id: Aufwand; titel: string }[] {
  const stufen = aufwandStufenFuer(modell);
  const nurAnAus = stufen.length === 2 && stufen.includes("low") && stufen.includes("high");
  return AUFWAND_STUFEN.filter((a) => stufen.includes(a.id)).map((a) =>
    nurAnAus ? { id: a.id, titel: a.id === "low" ? "niedrig – ohne Nachdenken" : "hoch – mit Nachdenken" } : a,
  );
}

export { aufwandAngeboten, aufwandStufenFuer };

/** Woher das wirksame Modell einer Aufgabe stammt: eigene Einstellung, Vorgabe des Profils oder der App */
export function modellHerkunft(rolle: Rolle, e: Einstellungen, profil: Profil | null): "einstellung" | "profil" | "app" {
  if (e.modelle[rolle]) return "einstellung";
  return profil?.manifest.modelle?.[rolle] ? "profil" : "app";
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

/**
 * Werkzeuge, die das Modell mit diesen Einstellungen tatsächlich nutzen kann. Anthropic und OpenAI: beide;
 * Mistral: über den EU-Endpunkt keine, global nur die Websuche.
 */
export function werkzeugeFuer(modell: string, e: Pick<Einstellungen, "mistralEndpunkt">): { websuche: boolean; abruf: boolean } {
  if (anbieterVon(modell) === "mistral") return mistralWerkzeuge(e.mistralEndpunkt ?? "eu");
  return { websuche: true, abruf: true };
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
