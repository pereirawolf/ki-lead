// Angebotene Stufen des Aufwands (Effort, reasoning effort) je Modell (seit 0.5.10, Befunde AV-2026-W43-01 und -02).
//
// Quellen, Stand 24.10.2026: Anthropic, Effort-Dokumentation (Haiku 5.5, Sonnet 5.5, Opus 5.5 und Fable 5.1 kennen alle
// fünf Stufen); OpenAI, Modellseite gpt-6-astra (low bis max; luna und sol nach einer Drittquelle ebenso, „none“ bietet
// die App nicht an); Mistral, Reasoning-Dokumentation und Modellkarte Medium 3.5 (Small 4, Medium 3.5 und Large 4 nur
// „none“ und „high“). „high“ ist bei Mistral am EU-Endpunkt erprobt (Vergleichslauf Ilka, 24.10.2026), „none“ nicht.
// Unbekannte Modelle erhalten alle Stufen; dort entscheidet der Anbieter.

import type { Aufwand } from "./typen";

/** Alle Stufen der App in aufsteigender Reihenfolge */
export const ALLE_STUFEN: Aufwand[] = ["low", "medium", "high", "xhigh", "max"];

/** Stufen der Mistral-Modelle: „niedrig“ = ohne Nachdenken (none), „hoch“ = mit Nachdenken (high) */
export const MISTRAL_STUFEN: Aufwand[] = ["low", "high"];

export const AUFWAND_JE_MODELL: { muster: RegExp; stufen: Aufwand[] }[] = [
  { muster: /^claude-(haiku|sonnet|opus)-5-5|^claude-fable-5-1/, stufen: ALLE_STUFEN },
  { muster: /^gpt-6-(luna|astra)|^gpt-6\.1-sol/, stufen: ALLE_STUFEN },
  { muster: /^mistral-(small-2603|medium-3-5|large-4)/, stufen: MISTRAL_STUFEN },
];

/** Stufen, die das Modell anbietet; unbekannte Modelle: alle */
export function aufwandStufenFuer(modell: string): Aufwand[] {
  return AUFWAND_JE_MODELL.find((x) => x.muster.test(modell))?.stufen ?? ALLE_STUFEN;
}

/**
 * Die Stufe aus `stufen`, die für `aufwand` gilt: dieselbe, wenn angeboten, sonst die nächsthöhere angebotene, ohne
 * höhere die nächstniedrigere (Mistral: mittel, sehr hoch und maximal → hoch).
 */
export function naechsteStufe(aufwand: Aufwand, stufen: Aufwand[]): Aufwand {
  if (stufen.includes(aufwand)) return aufwand;
  const i = ALLE_STUFEN.indexOf(aufwand);
  const hoeher = ALLE_STUFEN.slice(i + 1).find((s) => stufen.includes(s));
  if (hoeher) return hoeher;
  return [...ALLE_STUFEN.slice(0, i)].reverse().find((s) => stufen.includes(s)) ?? aufwand;
}

/** Die Stufe, die das Modell für die eingestellte Stufe tatsächlich erhält */
export function aufwandAngeboten(modell: string, aufwand: Aufwand): Aufwand {
  return naechsteStufe(aufwand, aufwandStufenFuer(modell));
}
