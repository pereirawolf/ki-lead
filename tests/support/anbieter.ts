// Anbieterattrappen und Antwortfabriken: skriptierte LLM-Antworten für die Pipeline, SSE-Ströme für die
// Anbieteradapter. Jede Fabrik liefert frische Objekte; Sollwerte werden nie aus Produktionsfunktionen berechnet.
import { vi } from "vitest";
import { leereNutzung, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "../../src/anbieter/typen";

/** Vollständige LLM-Antwort mit festen, kleinen Kosten; Einzelfelder über extra überschreiben. */
export function llmAntwort(text: string, extra: Partial<LlmAntwort> = {}): LlmAntwort {
  return {
    modell: "claude-test",
    text,
    inhalt: [{ type: "text", text }],
    zitate: [],
    fundstellen: [],
    suchen: [],
    abrufe: [],
    abrufFehler: [],
    nutzung: { ...leereNutzung(), eingabe: 100, ausgabe: 50 },
    kostenUsd: 0.01,
    stopGrund: "end_turn",
    dauerMs: 5,
    runden: 1,
    ...extra,
  };
}

/** Antwort mit Kurzantwort und JSON-Codeblock nach dem Ausgabevertrag der App */
export function meldungsAntwort(meldung: unknown, kurz = "Kurz.", extra: Partial<LlmAntwort> = {}): LlmAntwort {
  return llmAntwort(`${kurz}\n\n\`\`\`json\n${JSON.stringify(meldung)}\n\`\`\``, extra);
}

export type AntwortSchritt = LlmAntwort | Error | ((anfrage: LlmAnfrage) => Promise<LlmAntwort>);

export interface SkriptAnbieter extends LlmAnbieter {
  /** Alle gestellten Anfragen in Reihenfolge (das AbortSignal bleibt unverändert erhalten) */
  anfragen: LlmAnfrage[];
  /** Noch nicht verbrauchte Schritte */
  verbleibend: () => number;
}

/** Anbieter, der die Schritte der Reihe nach abarbeitet; fehlt ein Schritt, scheitert er mit Aufrufnummer. */
export function skriptAnbieter(schritte: AntwortSchritt[]): SkriptAnbieter {
  const rest = [...schritte];
  const anfragen: LlmAnfrage[] = [];
  return {
    id: "skript",
    anfragen,
    verbleibend: () => rest.length,
    async senden(a: LlmAnfrage) {
      anfragen.push(a);
      const s = rest.shift();
      if (s === undefined) throw new Error(`Skriptanbieter: keine Antwort für Aufruf ${anfragen.length} (${a.modell})`);
      if (s instanceof Error) throw s;
      return typeof s === "function" ? s(a) : s;
    },
  };
}

// ── SSE ───────────────────────────────────────────────────────────────────────

/** Ereignisse im SSE-Format („event:“ + „data:“, Leerzeile als Trenner) */
export function sseText(ereignisse: { type: string; [k: string]: any }[]): string {
  return ereignisse.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
}

/**
 * Antwort mit Ereignisstrom. Der Text wird zuerst vollständig als UTF-8 kodiert und dann an Bytepositionen
 * geteilt (teilung: Anzahl gleich großer Stücke oder ausdrückliche Schnittpositionen). So lassen sich auch
 * Netzwerkchunks modellieren, die mitten in einem mehrbyteigen Zeichen enden.
 */
export function sseAntwort(text: string, teilung: number | number[] = 7, status = 200): Response {
  const bytes = new TextEncoder().encode(text);
  const schnitte = Array.isArray(teilung)
    ? [...teilung].sort((a, b) => a - b)
    : Array.from({ length: Math.max(0, teilung - 1) }, (_, i) => Math.round(((i + 1) * bytes.length) / teilung));
  const grenzen = [0, ...schnitte.filter((s) => s > 0 && s < bytes.length), bytes.length];
  const stuecke = grenzen.slice(1).map((ende, i) => bytes.slice(grenzen[i], ende));
  const strom = new ReadableStream<Uint8Array>({
    start(c) {
      for (const s of stuecke) if (s.length) c.enqueue(s);
      c.close();
    },
  });
  return new Response(strom, { status, headers: { "content-type": "text/event-stream" } });
}

/** Strom, der nach dem ersten Stück mit einem Netzwerkfehler abreißt */
export function abreissenderStrom(text: string): Response {
  let gesendet = false;
  const strom = new ReadableStream<Uint8Array>({
    pull(c) {
      if (!gesendet) {
        gesendet = true;
        c.enqueue(new TextEncoder().encode(text));
      } else c.error(new TypeError("Load failed"));
    },
  });
  return new Response(strom, { status: 200 });
}

/** JSON-Fehlerantwort eines Anbieters */
export function fehlerAntwort(status: number, fehler: object, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: fehler }), { status, headers });
}

// ── Gefälschte Uhr für Wiederholungen ─────────────────────────────────────────

export interface UhrErgebnis<T> {
  wert?: T;
  fehler?: any;
  /** Auf der gefälschten Uhr verstrichene Zeit (Summe aller Wartezeiten) */
  dauerMs: number;
}

/**
 * Führt einen Anbieteraufruf mit gefälschter Uhr aus: Wartezeiten zwischen Versuchen vergehen sofort, die
 * verstrichene Zeit wird gemessen. Gefälscht werden nur setTimeout und Date; Ströme und Mikrotasks laufen echt.
 * Vor dem Lauf lässt sich mit vorher() ein Zeitgeber auf der gefälschten Uhr anlegen (etwa ein Abbruch nach 1 s).
 */
export async function ohneWarten<T>(lauf: () => Promise<T>, vorher?: () => void): Promise<UhrErgebnis<T>> {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  try {
    const start = Date.now();
    vorher?.();
    let fertig = false;
    const p = lauf().then(
      (wert) => ({ wert }),
      (fehler) => ({ fehler }),
    );
    void p.finally(() => (fertig = true));
    for (let i = 0; !fertig && i < 10_000; i++) {
      if (vi.getTimerCount() > 0) await vi.advanceTimersToNextTimerAsync();
      else await new Promise((r) => setImmediate(r));
    }
    const erg = await p;
    return { ...erg, dauerMs: Date.now() - start };
  } finally {
    vi.useRealTimers();
  }
}
