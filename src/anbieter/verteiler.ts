// Wählt den Anbieter nach der Modellkennung. Die Pipeline kennt nur LlmAnbieter.

import { AnthropicAnbieter } from "./anthropic";
import { OpenAiAnbieter } from "./openai";
import { AnbieterFehler, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "./typen";

export type AnbieterId = "anthropic" | "openai";

export type Schluessel = Record<AnbieterId, string>;

export const LEERE_SCHLUESSEL: Schluessel = { anthropic: "", openai: "" };

export const ANBIETER_NAME: Record<AnbieterId, string> = { anthropic: "Anthropic", openai: "OpenAI" };

export function anbieterVon(modell: string): AnbieterId {
  return /^(gpt-|o\d|chatgpt-)/i.test(modell) ? "openai" : "anthropic";
}

/** Anbieter ohne Schlüssel unter den genannten Modellen (für Hinweise vor dem Start). */
export function fehlendeSchluessel(modelle: string[], s: Schluessel): AnbieterId[] {
  return [...new Set(modelle.filter(Boolean).map(anbieterVon))].filter((a) => !s[a]);
}

export class Verteiler implements LlmAnbieter {
  id = "verteiler";
  private cache: Partial<Record<AnbieterId, LlmAnbieter>> = {};
  constructor(
    private schluessel: Schluessel,
    private fabrik: (id: AnbieterId, schluessel: string) => LlmAnbieter = (id, k) => (id === "openai" ? new OpenAiAnbieter(k) : new AnthropicAnbieter(k)),
  ) {}

  senden(a: LlmAnfrage): Promise<LlmAntwort> {
    const id = anbieterVon(a.modell);
    const k = this.schluessel[id];
    if (!k)
      return Promise.reject(
        new AnbieterFehler(`Für ${ANBIETER_NAME[id]} (${a.modell}) ist kein API-Schlüssel hinterlegt. Bitte unter „Einstellungen“ eintragen.`, 0, "schluessel"),
      );
    return (this.cache[id] ??= this.fabrik(id, k)).senden(a);
  }
}
