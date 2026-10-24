// Wählt den Anbieter nach der Modellkennung. Die Pipeline kennt nur LlmAnbieter.

import { AnthropicAnbieter } from "./anthropic";
import { MistralAnbieter } from "./mistral";
import { OpenAiAnbieter } from "./openai";
import { AnbieterFehler, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "./typen";

export type AnbieterId = "anthropic" | "openai" | "mistral";

export type Schluessel = Record<AnbieterId, string>;

export const LEERE_SCHLUESSEL: Schluessel = { anthropic: "", openai: "", mistral: "" };

/** Reihenfolge der Anbieter in Listen und Auswahlfeldern */
export const ANBIETER_IDS = Object.keys(LEERE_SCHLUESSEL) as AnbieterId[];

export const ANBIETER_NAME: Record<AnbieterId, string> = { anthropic: "Anthropic", openai: "OpenAI", mistral: "Mistral" };

export function anbieterVon(modell: string): AnbieterId {
  if (/^(gpt-|o\d|chatgpt-)/i.test(modell)) return "openai";
  if (/^(mistral-|ministral-|magistral-|codestral-|pixtral-|open-mistral-)/i.test(modell)) return "mistral";
  return "anthropic";
}

/** Namen mehrerer Anbieter als Aufzählung: „Anthropic“, „Anthropic und OpenAI“, „Anthropic, OpenAI und Mistral“ */
export function anbieterListe(ids: AnbieterId[]): string {
  const n = ids.map((a) => ANBIETER_NAME[a]);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} und ${n[n.length - 1]}` : n.join("");
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
    private fabrik: (id: AnbieterId, schluessel: string) => LlmAnbieter = (id, k) =>
      id === "openai" ? new OpenAiAnbieter(k) : id === "mistral" ? new MistralAnbieter(k) : new AnthropicAnbieter(k),
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
