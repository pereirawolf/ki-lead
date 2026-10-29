// Gemeinsame HTTP-Mechanik der Anbieteradapter (seit 0.6.2, TP-2026-W44-02/-03/-04): Wiederholung mit Backoff,
// Lesen eines SSE-Stroms mit Inaktivitätsgrenze und Neustart nach einem Verbindungsabbruch. Die Adapter liefern nur
// noch Anfragekörper, Fehlerregeln und die Verarbeitung der Ereignisse; was hier steht, gilt für alle drei gleich.
//
// Feste Werte (tests/anbieter/vertrag.test.ts): Netzwerkfehler 2 s, 4 s, 6 s; Überlastung ohne retry-after 4 s, 8 s,
// 16 s; retry-after höchstens 60 s; nach drei Wiederholungen (vier Abrufen) ist Schluss; Neustart nach Abriss 1,5 s,
// höchstens zweimal.

import { SseLeser, type SseEreignis } from "./strom";
import { AnbieterFehler, TEXT_VERBINDUNGSABBRUCH, type LlmAnfrage } from "./typen";
import { abbruchPruefen, warte } from "./warten";

export const MAX_WIEDERHOLUNGEN = 3;
export const MAX_NEUSTARTS = 2;

/**
 * Längste Pause zwischen zwei Datenstücken eines Antwortstroms (TP-2026-W44-02). Ein Strom, der offen bleibt, aber
 * keine Bytes mehr liefert, würde sonst ohne Fehler und damit ohne Wiederaufnahme stehen; die Person sähe nur den
 * laufenden Sekundenzähler. Fest 120 s, keine Einstellung (Maßgabe des Herausgebers).
 */
export const INAKTIVITAET_MS = 120_000;

// ── Fehler beim Lesen des Stroms ────────────────────────────────────────────────

/**
 * Fehler des Transports beim Lesen des Stroms (Netz, Inaktivitätsgrenze, Ende ohne Abschluss), im Unterschied zu
 * Fehlern aus der Verarbeitung der Ereignisse. Nur diese Fehler gelten als Verbindungsabbruch, den der Adapter mit
 * Fortsetzung oder Neustart beantwortet (TP-2026-W44-04); ein Programmierfehler in der Verarbeitung wird nicht als
 * Netzproblem maskiert und löst keine bezahlte Wiederholung aus.
 */
export class LeseFehler extends Error {
  constructor(public ursache: unknown) {
    super(String((ursache as any)?.message || ursache));
    this.name = "LeseFehler";
  }
}

/** Inaktivitätsgrenze überschritten */
export class StromInaktiv extends Error {
  constructor(ms: number) {
    super(`Keine Daten vom Anbieter seit ${Math.round(ms / 1000)} s.`);
    this.name = "StromInaktiv";
  }
}

// ── Wiederholung ────────────────────────────────────────────────────────────────

/** Zerlegte Fehlerantwort eines Anbieters */
export interface FehlerInfo {
  code?: string;
  meldung?: string;
  /** Rohtext der Antwort, soweit lesbar */
  roh: string;
}

/** Was ein Adapter über die Fehlerantworten seines Anbieters weiß */
export interface Fehlerregeln {
  /** Fehlerantwort zerlegen; darf nicht werfen (ein Abbruch beim Lesen gehört zum Signal und wird vom Warten erkannt) */
  fehlerAus: (antwort: Response) => Promise<FehlerInfo>;
  /** Wird die Anfrage bei diesem Status wiederholt? */
  wiederholbar: (status: number, f: FehlerInfo) => boolean;
  /** Verständlicher Text; ohne meldung für den Fortschritt, mit meldung für den endgültigen Fehler */
  fehlerText: (status: number, code?: string, meldung?: string) => string;
  /** Text, wenn gar keine Verbindung zustande kommt */
  netzFehler: string;
  /**
   * Eingriff vor der Entscheidung (Mistral: abgelehntes reasoning_effort). Liefert true, wenn der Adapter die Anfrage
   * geändert hat und sofort neu senden will; der Versuch zählt dann nicht.
   */
  anpassen?: (status: number, f: FehlerInfo) => boolean;
}

/** Fehlerantwort als JSON; ohne lesbares JSON undefined. */
export async function fehlerJson(antwort: Response): Promise<any> {
  try {
    return await antwort.json();
  } catch {
    return undefined;
  }
}

/**
 * Sendet die Anfrage und wiederholt sie bei Netzwerkfehlern und wiederholbaren Fehlerantworten mit Backoff; liefert die
 * erste erfolgreiche Antwort (status 2xx) oder wirft einen AnbieterFehler. `senden` baut den Abruf jedes Mal neu, damit
 * ein geänderter Körper (anpassen) wirkt.
 */
export async function mitWiederholung(a: LlmAnfrage, senden: () => Promise<Response>, regeln: Fehlerregeln): Promise<Response> {
  for (let versuch = 0; ; versuch++) {
    abbruchPruefen(a.signal);
    let antwort: Response;
    try {
      antwort = await senden();
    } catch (e: any) {
      if (e?.name === "AbortError") throw e;
      if (versuch < MAX_WIEDERHOLUNGEN) {
        a.fortschritt?.({ art: "wiederholung", grund: "Netzwerkfehler", warteMs: 2000 * (versuch + 1) });
        await warte(2000 * (versuch + 1), a.signal);
        continue;
      }
      throw new AnbieterFehler(regeln.netzFehler, 0, "netz");
    }
    if (antwort.ok) return antwort;
    const f = await regeln.fehlerAus(antwort);
    abbruchPruefen(a.signal);
    if (regeln.anpassen?.(antwort.status, f)) {
      versuch--;
      continue;
    }
    if (regeln.wiederholbar(antwort.status, f) && versuch < MAX_WIEDERHOLUNGEN) {
      const ra = Number(antwort.headers.get("retry-after"));
      const ms = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 60_000) : 4000 * 2 ** versuch;
      a.fortschritt?.({ art: "wiederholung", grund: regeln.fehlerText(antwort.status, f.code), warteMs: ms });
      await warte(ms, a.signal);
      continue;
    }
    throw new AnbieterFehler(regeln.fehlerText(antwort.status, f.code, f.meldung), antwort.status, f.code);
  }
}

// ── Strom lesen ─────────────────────────────────────────────────────────────────

/**
 * Liest den Antwortstrom als SSE-Ereignisse und reicht jedes an verarbeite weiter. Vergeht zwischen zwei Datenstücken
 * mehr als inaktivitaetMs, wird der Strom beendet und ein LeseFehler mit StromInaktiv geworfen. Netzfehler beim Lesen
 * ergeben ebenfalls einen LeseFehler; AbortError und Fehler aus verarbeite gehen unverändert weiter.
 */
export async function sseLesen(
  antwort: Response,
  signal: AbortSignal | undefined,
  verarbeite: (ev: SseEreignis) => void,
  inaktivitaetMs = INAKTIVITAET_MS,
): Promise<void> {
  const leser = new SseLeser();
  const reader = antwort.body!.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    let stueck: ReadableStreamReadResult<string>;
    try {
      stueck = await mitInaktivitaetsgrenze(reader.read(), inaktivitaetMs);
    } catch (e: any) {
      if (e?.name === "AbortError" || signal?.aborted) throw e;
      if (e instanceof StromInaktiv) void reader.cancel(e).catch(() => undefined);
      throw new LeseFehler(e);
    }
    if (stueck.done) return;
    for (const ev of leser.lies(stueck.value)) verarbeite(ev);
  }
}

/** Wartet auf das nächste Stück, höchstens ms Millisekunden; der Zeitgeber wird in jedem Fall entfernt. */
function mitInaktivitaetsgrenze<T>(lesen: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const grenze = new Promise<never>((_, nein) => {
    t = setTimeout(() => nein(new StromInaktiv(ms)), ms);
  });
  return Promise.race([lesen, grenze]).finally(() => clearTimeout(t));
}

// ── Neustart nach Abriss ────────────────────────────────────────────────────────

/**
 * Führt eine Runde aus und stellt sie nach einem LeseFehler neu, höchstens MAX_NEUSTARTS-mal mit 1,5 s Pause (OpenAI,
 * Mistral: ohne Fortsetzung einer Teilantwort). Danach AnbieterFehler „verbindung“. Andere Fehler gehen unverändert weiter.
 */
export async function mitNeustart<T>(a: LlmAnfrage, runde: () => Promise<T>): Promise<T> {
  for (let neustart = 0; ; neustart++) {
    try {
      return await runde();
    } catch (e) {
      if (!(e instanceof LeseFehler)) throw e;
      if (neustart >= MAX_NEUSTARTS) throw new AnbieterFehler(TEXT_VERBINDUNGSABBRUCH, 0, "verbindung");
      a.fortschritt?.({ art: "wiederholung", grund: "Verbindung unterbrochen; die Anfrage wird neu gestellt.", warteMs: 1500 });
      await warte(1500, a.signal);
    }
  }
}
