// Wahl je Anbieter über den Schlüssel hinaus (seit 0.6.3, TP-2026-W44-26): ersetzt die Einzeleinstellung
// `mistralEndpunkt` durch einen Eintrag je Anbieter. Anthropic und OpenAI haben keine Optionen.

import type { MistralEndpunkt } from "./mistral";
import { OLLAMA_STANDARD_MODELL, OLLAMA_STANDARD_URL } from "./ollama";

export interface AnbieterOptionen {
  anthropic: Record<string, never>;
  openai: Record<string, never>;
  /** Mistral: regionaler EU-Endpunkt (Vorgabe, ohne Websuche) oder globaler Endpunkt mit Websuche */
  mistral: { endpunkt: MistralEndpunkt };
  /**
   * Ollama (lokal): Basisadresse der OpenAI-kompatiblen Schnittstelle und lokales Modell des Standard-Profils. Die
   * Sicherheitsrichtlinie der App lässt nur localhost bzw. 127.0.0.1 mit Port 11434 zu (docs/SICHERHEIT.md).
   */
  ollama: { basisUrl: string; modell: string };
}

/** Teilangabe, etwa aus älteren Einstellungen oder in Tests; fehlende Werte ergänzt `optionenVollstaendig` */
export type AnbieterOptionenTeil = { [K in keyof AnbieterOptionen]?: Partial<AnbieterOptionen[K]> };

export const STANDARD_ANBIETER_OPTIONEN: AnbieterOptionen = {
  anthropic: {},
  openai: {},
  mistral: { endpunkt: "eu" },
  ollama: { basisUrl: OLLAMA_STANDARD_URL, modell: OLLAMA_STANDARD_MODELL },
};

/** Optionen mit den Vorgaben ergänzt */
export function optionenVollstaendig(o: AnbieterOptionenTeil = {}): AnbieterOptionen {
  const s = STANDARD_ANBIETER_OPTIONEN;
  return {
    anthropic: {},
    openai: {},
    mistral: { endpunkt: o.mistral?.endpunkt === "global" ? "global" : s.mistral.endpunkt },
    ollama: { basisUrl: o.ollama?.basisUrl?.trim() || s.ollama.basisUrl, modell: o.ollama?.modell?.trim() || s.ollama.modell },
  };
}
