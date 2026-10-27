// Angaben zu den wählbaren Modellen für die Wahl je Lauf (seit 0.5.22, Vorschläge zu „Modelle für diesen Lauf“ vom
// 25.10.2026, Punkte 1 und 4): Anzeigenamen, Kostenklasse nach Listenpreis und Vermerke aus den vergleichenden
// Testläufen. Reine Daten und Funktionen; die Oberfläche steht in src/ui/ModellWahl.tsx. Laufprotokoll, Pipeline und
// gespeicherte Einstellungen verwenden weiter die Kennungen der Anbieter.
import { OLLAMA_PRAEFIX } from "../anbieter/ollama";
import { ausgabePreis } from "../anbieter/preise";
import type { Aufwand } from "../anbieter/typen";
import type { Rolle } from "./einstellungen";

/** Anzeigenamen der Modelle; die Kennung des Anbieters bleibt im Laufprotokoll und im Hilfetext sichtbar */
export const MODELL_NAMEN: Record<string, string> = {
  "claude-haiku-5-5": "Haiku 5.5",
  "claude-sonnet-5-5": "Sonnet 5.5",
  "claude-opus-5-5": "Opus 5.5",
  "claude-fable-5-1": "Fable 5.1",
  "gpt-6-luna": "GPT-6 Luna",
  "gpt-6.1-sol": "GPT-6.1 Sol",
  "gpt-6-astra": "GPT-6 Astra",
  "mistral-small-2603": "Mistral Small 4",
  "mistral-medium-3-5": "Mistral Medium 3.5",
  "mistral-large-4": "Mistral Large 4",
};

/**
 * Anzeigename; unbekannte Modelle (etwa aus einem Profil) erscheinen mit ihrer Kennung, lokale Modelle über Ollama (seit
 * 0.6.3, TP-2026-W44-26) mit ihrem Namen und „(lokal)“
 */
export function modellName(modell: string): string {
  if (modell.startsWith(OLLAMA_PRAEFIX)) return `${modell.slice(OLLAMA_PRAEFIX.length)} (lokal)`;
  return MODELL_NAMEN[modell] || modell;
}

/** „keine“ seit 0.6.3 für lokale Modelle ohne Kosten beim Anbieter */
export type Kostenklasse = "keine" | "niedrig" | "mittel" | "hoch" | "sehr hoch";

/**
 * Kostenklasse nach dem Listenpreis der Ausgabetoken (USD je Million): bis 1 niedrig, bis 12 mittel, bis 25 hoch,
 * darüber sehr hoch; „keine“ bei Preis 0 (lokal); null ohne Preis. Grobe Orientierung für die Auswahl, keine Schätzung eines Laufs.
 */
export function kostenklasse(modell: string): Kostenklasse | null {
  const p = ausgabePreis(modell);
  if (p === null) return null;
  if (p === 0) return "keine";
  if (p <= 1) return "niedrig";
  if (p <= 12) return "mittel";
  if (p <= 25) return "hoch";
  return "sehr hoch";
}

/** Listenpreis als Satz, z. B. „Listenpreis 20 USD je Million Ausgabetoken.“ */
export function preisSatz(modell: string): string {
  const p = ausgabePreis(modell);
  if (p === 0) return "Lokales Modell über Ollama, ohne Kosten beim Anbieter.";
  return p === null ? "Kein Listenpreis hinterlegt." : `Listenpreis ${p.toLocaleString("de-DE")} USD je Million Ausgabetoken.`;
}

export interface Vermerk {
  rolle: Rolle;
  modell: string;
  aufwand: Aufwand;
  /** „vorn“: in der Auswertung am besten; „bewährt“: ohne Beanstandung oder knapp dahinter */
  art: "vorn" | "bewährt";
  /** Befund in einem Satz, mit Zahl der Läufe */
  befund: string;
  /** Ergebnisbericht unter evaluation/abnahmen/ */
  bericht: string;
}

const STANDARDPROFILE = "2026-10-25-standardprofile-ilka-ergebnis.md";
const REPARATUR = "2026-10-25-reparatur-ilka-ergebnis.md";
const MS = "2026-10-25-management-summary-ilka-ergebnis.md";

/**
 * Vermerke aus den vergleichenden Testläufen vom 25.10.2026 (Entscheidung des Herausgebers vom selben Tag, Punkt 4).
 * Nur was die Berichte ausdrücklich feststellen; für S2 „Recherche und Entwurf“ (Erfassung) gibt es noch keine
 * Vergleichsläufe (Spezifikation, offener Punkt 6), deshalb keine Vermerke.
 */
export const VERMERKE: Vermerk[] = [
  {
    rolle: "vorverarbeitung",
    modell: "gpt-6-luna",
    aufwand: "high",
    art: "vorn",
    befund: "In S1 am besten: ein Sachverhalt wie in der Redaktionsfassung in 9 von 9 Läufen (Vergleichslauf Ilka, Auswertung je Stufe).",
    bericht: STANDARDPROFILE,
  },
  {
    rolle: "vorverarbeitung",
    modell: "claude-haiku-5-5",
    aufwand: "high",
    art: "bewährt",
    befund: "In S1 knapp hinter GPT-6 Luna (Vergleichslauf Ilka, 6 Läufe).",
    bericht: STANDARDPROFILE,
  },
  {
    rolle: "verdichtung",
    modell: "claude-opus-5-5",
    aufwand: "medium",
    art: "vorn",
    befund: "In der Verdichtung am besten: vollständig, ohne gefundenen Zahlenfehler, Tendenz in jedem Lauf (Vergleichslauf Ilka, 3 Läufe).",
    bericht: STANDARDPROFILE,
  },
  {
    rolle: "verdichtung",
    modell: "claude-sonnet-5-5",
    aufwand: "medium",
    art: "bewährt",
    befund: "In der Verdichtung knapp hinter Opus zum halben Preis; lässt die Tendenz meist offen (Vergleichslauf Ilka, 3 Läufe).",
    bericht: STANDARDPROFILE,
  },
  ...(["claude-haiku-5-5", "gpt-6.1-sol", "mistral-small-2603", "mistral-medium-3-5"] as const).map((modell): Vermerk => ({
    rolle: "reparatur",
    modell,
    aufwand: "low",
    art: "bewährt",
    befund: "Im Prüffall Reparatur 10 von 10 Stellen wie im Original (Nachtest mit der Anweisung seit 0.5.15).",
    bericht: REPARATUR,
  })),
  {
    rolle: "reparatur",
    modell: "claude-sonnet-5-5",
    aufwand: "low",
    art: "bewährt",
    befund: "Im Prüffall Reparatur 10 von 10 Stellen wie im Original, rund zwanzigmal so teuer wie Haiku.",
    bericht: REPARATUR,
  },
  {
    rolle: "kurzfassung",
    modell: "claude-sonnet-5-5",
    aufwand: "medium",
    art: "vorn",
    befund: "Inhaltlich am vollständigsten, alle Muss-Punkte in 3 von 3 Läufen.",
    bericht: MS,
  },
  {
    rolle: "kurzfassung",
    modell: "claude-opus-5-5",
    aufwand: "medium",
    art: "bewährt",
    befund: "Inhaltlich gleichwertig mit Sonnet, kostet aber rund das Dreifache.",
    bericht: MS,
  },
  {
    rolle: "kurzfassung",
    modell: "gpt-6.1-sol",
    aufwand: "medium",
    art: "bewährt",
    befund: "Unter 180 Wörtern, ohne Faktenfehler (3 Läufe).",
    bericht: MS,
  },
];

/** Vermerk für Modell und Aufgabe, falls vorhanden */
export function vermerkFuer(rolle: Rolle, modell: string): Vermerk | undefined {
  return VERMERKE.find((v) => v.rolle === rolle && v.modell === modell);
}

/** Kurzform für die Auswahlliste, z. B. „im Test vorn mit mittel“ */
export function vermerkKurz(v: Vermerk, aufwandTitel: (a: Aufwand) => string): string {
  return `${v.art === "vorn" ? "im Test vorn" : "im Test bewährt"} mit ${aufwandTitel(v.aufwand)}`;
}
