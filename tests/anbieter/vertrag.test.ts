// Gemeinsames Verhalten beider Anbieteradapter bei Fehlern, Wiederholungen und Abbruch – mit gefälschter Uhr,
// damit Wartezeiten sofort vergehen und ihre Länge prüfbar ist. Erwartete Wartezeiten stehen als feste Zahlen hier:
// Netzwerkfehler 2 s, 4 s, 6 s; Überlastung ohne retry-after 4 s, 8 s, 16 s; retry-after höchstens 60 s;
// nach drei Wiederholungen (vier Abrufen) ist Schluss.
import { describe, expect, it } from "vitest";
import { AnthropicAnbieter } from "../../src/anbieter/anthropic";
import { OpenAiAnbieter } from "../../src/anbieter/openai";
import { AnbieterFehler, type LlmAnbieter, type LlmAnfrage } from "../../src/anbieter/typen";
import { fehlerAntwort, ohneWarten, sseAntwort, sseText } from "../support/anbieter";

type Abruf = (url: string, init: RequestInit) => Promise<Response>;

interface Fall {
  name: string;
  neu: (abruf: Abruf) => LlmAnbieter;
  modell: string;
  /** Vollständige, erfolgreiche Antwort mit dem Text „ok“ */
  erfolg: () => Response;
  /** Fehler, der sofort und ohne Wiederholung zur Person gehört */
  schluesselFehler: () => Response;
}

const FAELLE: Fall[] = [
  {
    name: "Anthropic",
    neu: (abruf) => new AnthropicAnbieter("k", "https://api.test", abruf as typeof fetch),
    modell: "claude-sonnet-5-5",
    erfolg: () =>
      sseAntwort(
        sseText([
          { type: "message_start", message: { model: "claude-sonnet-5-5", usage: { input_tokens: 10, output_tokens: 1 } } },
          { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
          { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "ok" } },
          { type: "content_block_stop", index: 0 },
          { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2 } },
          { type: "message_stop" },
        ]),
      ),
    schluesselFehler: () => fehlerAntwort(401, { type: "authentication_error", message: "invalid x-api-key" }),
  },
  {
    name: "OpenAI",
    neu: (abruf) => new OpenAiAnbieter("k", "https://api.test", abruf as typeof fetch),
    modell: "gpt-6.1-sol",
    erfolg: () =>
      sseAntwort(
        sseText([
          {
            type: "response.completed",
            response: {
              status: "completed",
              model: "gpt-6.1-sol",
              output: [{ type: "message", content: [{ type: "output_text", text: "ok", annotations: [] }] }],
              usage: { input_tokens: 10, output_tokens: 2 },
            },
          },
        ]),
      ),
    schluesselFehler: () => fehlerAntwort(401, { code: "invalid_api_key", message: "bad key" }),
  },
];

const anfrage = (f: Fall, extra: Partial<LlmAnfrage> = {}): LlmAnfrage => ({
  modell: f.modell,
  maxTokens: 100,
  system: [],
  nachrichten: [{ role: "user", content: "Los" }],
  ...extra,
});

/** Abrufattrappe: arbeitet die Schritte der Reihe nach ab (Response oder geworfener Fehler), danach Erfolg */
function abrufFolge(f: Fall, schritte: (Response | Error)[]) {
  const aufrufe: RequestInit[] = [];
  const abruf: Abruf = async (_url, init) => {
    aufrufe.push(init);
    const s = schritte.shift();
    if (s instanceof Error) throw s;
    return s ?? f.erfolg();
  };
  return { abruf, aufrufe };
}

/** Wartezeiten aus den Fortschrittsmeldungen der Adapter */
function wartezeitenMerken() {
  const ms: number[] = [];
  return { ms, fortschritt: (x: { art: string; warteMs?: number }) => void (x.art === "wiederholung" && ms.push(x.warteMs!)) };
}

const netzfehler = () => new TypeError("Failed to fetch");
const ueberlastet = (headers: Record<string, string> = {}) => fehlerAntwort(503, { type: "overloaded_error", message: "busy" }, headers);

describe.each(FAELLE)("$name: Wiederholungen und Abbruch", (f) => {
  it("wiederholt nach Netzwerkfehlern mit 2 s und 4 s Pause und liefert dann die Antwort", async () => {
    const { abruf, aufrufe } = abrufFolge(f, [netzfehler(), netzfehler()]);
    const w = wartezeitenMerken();
    const r = await ohneWarten(() => f.neu(abruf).senden(anfrage(f, { fortschritt: w.fortschritt })));
    expect(r.fehler).toBeUndefined();
    expect(r.wert!.text).toBe("ok");
    expect(aufrufe).toHaveLength(3);
    expect(w.ms).toEqual([2000, 4000]);
    expect(r.dauerMs).toBe(6000);
  });

  it("gibt nach drei Wiederholungen bei dauerhaftem Netzwerkfehler mit verständlicher Meldung auf", async () => {
    const { abruf, aufrufe } = abrufFolge(f, [netzfehler(), netzfehler(), netzfehler(), netzfehler(), netzfehler()]);
    const r = await ohneWarten(() => f.neu(abruf).senden(anfrage(f)));
    expect(r.fehler).toBeInstanceOf(AnbieterFehler);
    expect(r.fehler.art).toBe("netz");
    expect(r.fehler.message).toMatch(/Netz prüfen/);
    expect(aufrufe).toHaveLength(4);
    expect(r.dauerMs).toBe(2000 + 4000 + 6000);
  });

  it("wartet bei Überlastung ohne retry-after 4 s, 8 s, 16 s und meldet danach den Status", async () => {
    const { abruf, aufrufe } = abrufFolge(f, [ueberlastet(), ueberlastet(), ueberlastet(), ueberlastet()]);
    const w = wartezeitenMerken();
    const r = await ohneWarten(() => f.neu(abruf).senden(anfrage(f, { fortschritt: w.fortschritt })));
    expect(r.fehler).toBeInstanceOf(AnbieterFehler);
    expect(r.fehler.status).toBe(503);
    expect(aufrufe).toHaveLength(4);
    expect(w.ms).toEqual([4000, 8000, 16000]);
    expect(r.dauerMs).toBe(28000);
  });

  it("folgt retry-after und begrenzt es auf 60 s", async () => {
    const { abruf, aufrufe } = abrufFolge(f, [ueberlastet({ "retry-after": "2" }), ueberlastet({ "retry-after": "600" })]);
    const w = wartezeitenMerken();
    const r = await ohneWarten(() => f.neu(abruf).senden(anfrage(f, { fortschritt: w.fortschritt })));
    expect(r.wert?.text).toBe("ok");
    expect(aufrufe).toHaveLength(3);
    expect(w.ms).toEqual([2000, 60000]);
    expect(r.dauerMs).toBe(62000);
  });

  it("wiederholt einen abgelehnten Schlüssel nicht", async () => {
    const { abruf, aufrufe } = abrufFolge(f, [f.schluesselFehler()]);
    const r = await ohneWarten(() => f.neu(abruf).senden(anfrage(f)));
    expect(r.fehler).toBeInstanceOf(AnbieterFehler);
    expect(r.fehler.status).toBe(401);
    expect(r.fehler.message).toMatch(/Schlüssel wurde abgelehnt/);
    expect(aufrufe).toHaveLength(1);
    expect(r.dauerMs).toBe(0);
  });

  it("ruft bei bereits abgebrochenem Signal gar nicht erst ab", async () => {
    const { abruf, aufrufe } = abrufFolge(f, []);
    const ctrl = new AbortController();
    ctrl.abort();
    const r = await ohneWarten(() => f.neu(abruf).senden(anfrage(f, { signal: ctrl.signal })));
    expect(r.fehler?.name).toBe("AbortError");
    expect(aufrufe).toHaveLength(0);
  });

  it("beendet die Wartezeit vor dem nächsten Versuch sofort beim Abbruch", async () => {
    const { abruf, aufrufe } = abrufFolge(f, [ueberlastet({ "retry-after": "60" })]);
    const ctrl = new AbortController();
    const r = await ohneWarten(
      () => f.neu(abruf).senden(anfrage(f, { signal: ctrl.signal })),
      () => setTimeout(() => ctrl.abort(), 1000),
    );
    expect(r.fehler?.name).toBe("AbortError");
    expect(aufrufe).toHaveLength(1);
    expect(r.dauerMs).toBe(1000);
  });

  it("bricht einen laufenden Strom ab, ohne neu anzufragen", async () => {
    const ctrl = new AbortController();
    const aufrufe: RequestInit[] = [];
    const abruf: Abruf = async (_url, init) => {
      aufrufe.push(init);
      const strom = new ReadableStream<Uint8Array>({
        start(c) {
          // Wie fetch: Der Abbruch lässt den laufenden Antwortstrom mit AbortError scheitern
          init.signal?.addEventListener("abort", () => c.error(new DOMException("Abgebrochen", "AbortError")));
          c.enqueue(new TextEncoder().encode("event: ping\ndata: {}\n\n"));
          setTimeout(() => ctrl.abort(), 500);
        },
      });
      return new Response(strom, { status: 200 });
    };
    const r = await ohneWarten(() => f.neu(abruf).senden(anfrage(f, { signal: ctrl.signal })));
    expect(r.fehler?.name).toBe("AbortError");
    expect(aufrufe).toHaveLength(1);
    expect(r.dauerMs).toBe(500);
  });
});

describe("OpenAI: fehlendes Guthaben", () => {
  it("wiederholt 429 mit insufficient_quota nicht", async () => {
    const f = FAELLE[1];
    const { abruf, aufrufe } = abrufFolge(f, [fehlerAntwort(429, { code: "insufficient_quota", message: "quota" })]);
    const r = await ohneWarten(() => f.neu(abruf).senden(anfrage(f)));
    expect(r.fehler).toBeInstanceOf(AnbieterFehler);
    expect(r.fehler.message).toMatch(/Guthaben/);
    expect(aufrufe).toHaveLength(1);
    expect(r.dauerMs).toBe(0);
  });
});
