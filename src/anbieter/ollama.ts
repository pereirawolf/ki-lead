// Ollama als vierter Anbieter (seit 0.6.3, TP-2026-W44-26, Maßgabe des Herausgebers): lokale Modelle über die
// OpenAI-kompatible Schnittstelle von Ollama (POST <basis>/responses, Doku: https://docs.ollama.com/openai, Responses
// seit Ollama 0.13.3, nur ohne Zustand). Der Adapter ist der OpenAI-Adapter mit anderer Basisadresse
// (src/anbieter/openai.ts); Inhalte verlassen das Gerät bzw. das lokale Netz nicht.
//
// - Modellkennung in der App: „ollama:<modell>“ (z. B. „ollama:llama3.1“); an Ollama geht das Modell ohne Präfix.
// - Kein Schlüssel; keine Websuche und kein Seitenabruf (die App sendet keine Werkzeuge); kein Aufwand (das lokale
//   Modell bestimmt, ob und wie lange es nachdenkt); Kosten 0 USD (Rechenzeit und Strom des eigenen Geräts zählen nicht).
// - Adresse: Vorgabe http://localhost:11434/v1. Die Sicherheitsrichtlinie der App (connect-src in index.html) lässt nur
//   localhost und 127.0.0.1 mit Port 11434 zu; andere Adressen weist der Adapter vor dem Senden ab.
// - Ruft die App Ollama aus dem Browser auf, muss Ollama die Herkunft der App zulassen (Umgebungsvariable OLLAMA_ORIGINS);
//   für localhost ist das die Vorgabe von Ollama.
// - Nicht erprobt: Ergebnisqualität lokaler Modelle in der LEAD-Pipeline, strukturierte Ausgabe (text.format) und PDF-Material.
//   CI-Tests laufen nur mit gefälschtem fetch.

import { OpenAiAnbieter } from "./openai";
import { kostenAnfrage } from "./preise";
import { AnbieterFehler, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "./typen";

export const OLLAMA_PRAEFIX = "ollama:";
export const OLLAMA_STANDARD_URL = "http://localhost:11434/v1";
/** Vorgabe für das lokale Modell des Standard-Profils Ollama; frei wählbar unter „Einstellungen“ */
export const OLLAMA_STANDARD_MODELL = "llama3.1";

/** Zulässige Adressen: nur localhost bzw. 127.0.0.1 mit Port 11434 (wie connect-src in index.html) */
const ZULAESSIG = /^http:\/\/(localhost|127\.0\.0\.1):11434(\/[^\s?#]*)?$/;

/** Ob die Adresse für Ollama zulässig ist (Sicherheitsrichtlinie der App) */
export function ollamaAdresseZulaessig(url: string): boolean {
  return ZULAESSIG.test(url.trim());
}

/** Modell ohne das Präfix „ollama:“, wie Ollama es erwartet */
export function ollamaModell(kennung: string): string {
  return kennung.slice(OLLAMA_PRAEFIX.length);
}

export function fehlerTextOllama(status: number, code?: string, meldung?: string): string {
  const m = meldung ? ` (${meldung})` : "";
  if (status === 404 || code === "model_not_found" || /not found/i.test(meldung || ""))
    return `Das Modell ist in Ollama nicht vorhanden; mit „ollama pull <modell>“ laden oder unter „Einstellungen“ ein anderes wählen${m}.`;
  if (status === 400) return "Die Anfrage wurde von Ollama abgelehnt" + m + ".";
  if (status === 401 || status === 403) return "Ollama bzw. ein vorgeschalteter Dienst hat den Zugriff abgelehnt" + m + ".";
  if (status === 429 || status === 503) return "Ollama ist ausgelastet. Bitte kurz warten." + m;
  if (status >= 500) return "Ollama meldet einen Fehler. Läuft das Modell und reicht der Speicher?" + m;
  return `Fehler bei Ollama${status ? ` (HTTP ${status})` : ""}${m}.`;
}

export class OllamaAnbieter implements LlmAnbieter {
  id = "ollama";
  private innen: OpenAiAnbieter;
  constructor(
    private basisUrl = OLLAMA_STANDARD_URL,
    abruf: typeof fetch = (...x) => fetch(...x),
  ) {
    this.innen = new OpenAiAnbieter("", basisUrl, abruf, {
      id: "ollama",
      fehlerText: fehlerTextOllama,
      netzFehler: `Keine Verbindung zu Ollama unter ${basisUrl}. Läuft Ollama auf diesem Gerät, und lässt es die Herkunft der App zu (OLLAMA_ORIGINS)?`,
      aufwand: false,
    });
  }

  async senden(a: LlmAnfrage): Promise<LlmAntwort> {
    if (!ollamaAdresseZulaessig(this.basisUrl))
      throw new AnbieterFehler(
        `Die Adresse „${this.basisUrl}“ ist für Ollama nicht zulässig. Erlaubt sind nur http://localhost:11434 und http://127.0.0.1:11434 (Sicherheitsrichtlinie der App).`,
        0,
        "adresse",
      );
    // Lokal ohne Werkzeuge: Websuche und Seitenabruf bietet Ollama über diese Schnittstelle nicht an
    const r = await this.innen.senden({ ...a, modell: ollamaModell(a.modell), werkzeuge: undefined });
    return {
      ...r,
      modell: `${OLLAMA_PRAEFIX}${r.modell.startsWith(OLLAMA_PRAEFIX) ? ollamaModell(r.modell) : r.modell}`,
      kostenUsd: kostenAnfrage(a.modell, r.nutzung),
    };
  }
}
