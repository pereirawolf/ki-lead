// Abbruch während der Wartezeit vor einem neuen Versuch (Review 20.10.2026, F09).
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiAnbieter } from "../../src/anbieter/openai";
import { AnthropicAnbieter } from "../../src/anbieter/anthropic";
import { MistralAnbieter } from "../../src/anbieter/mistral";
import { LeseFehler, sseLesen } from "../../src/anbieter/http";
import { SseLeser } from "../../src/anbieter/strom";
import { istVerbindungsabbruch } from "../../src/anbieter/typen";
import { warte } from "../../src/anbieter/warten";
import { abreissenderStrom, ohneWarten, sseAntwort } from "../support/anbieter";

describe("F09: Abbruch während der Wartezeit vor einem neuen Versuch", () => {
  afterEach(() => vi.useRealTimers());

  it("warte endet sofort bei bereits abgebrochenem Signal und räumt den Listener ab", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(warte(60_000, ctrl.signal)).rejects.toMatchObject({ name: "AbortError" });
    const offen = new AbortController();
    const weg = vi.spyOn(offen.signal, "removeEventListener");
    await warte(1, offen.signal);
    expect(weg).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it.each([
    ["OpenAI", OpenAiAnbieter],
    ["Anthropic", AnthropicAnbieter],
  ] as const)("%s: Abbruch beim Lesen einer Fehlerantwort beendet sofort, ohne weiteren Abruf", async (_, Klasse) => {
    vi.useFakeTimers();
    const ctrl = new AbortController();
    let aufrufe = 0;
    const abruf = vi.fn(async () => {
      aufrufe++;
      return {
        ok: false,
        status: 503,
        headers: new Headers({ "retry-after": "60" }),
        json: async () => {
          ctrl.abort();
          throw new DOMException("aborted", "AbortError");
        },
      };
    });
    const a = new Klasse("test", "https://example.invalid", abruf as any);
    let fehler: any;
    const lauf = a.senden({ modell: "test", maxTokens: 10, system: [], nachrichten: [], signal: ctrl.signal } as any).catch((e) => (fehler = e));
    await vi.advanceTimersByTimeAsync(1);
    await lauf;
    expect(fehler?.name).toBe("AbortError");
    expect(aufrufe).toBe(1);
  });
});

// Verbindungsabbruch nur am Ort des Lesens (seit 0.6.2, TP-2026-W44-04): Ein TypeError aus der Verarbeitung der
// Ereignisse ist ein Programmierfehler und darf keine bezahlte Wiederholung der Anfrage auslösen.
let aufrufe = 0;
const abruf = async () => {
  aufrufe++;
  return sseAntwort("event: a\ndata: {}\n\n", 1);
};

describe("TP-2026-W44-04: TypeError aus der Verarbeitung ist kein Netzabbruch", () => {
  it("istVerbindungsabbruch prüft nur die Meldungsmuster, nicht die Fehlerklasse", () => {
    expect(istVerbindungsabbruch(new TypeError("Failed to fetch"))).toBe(true);
    expect(istVerbindungsabbruch(new Error("Load failed"))).toBe(true);
    expect(istVerbindungsabbruch(new TypeError("Cannot read properties of undefined (reading 'type')"))).toBe(false);
    expect(istVerbindungsabbruch(new TypeError("x is not a function"))).toBe(false);
  });

  it("sseLesen reicht einen Fehler der Verarbeitung unverändert weiter, einen Lesefehler als LeseFehler", async () => {
    const antwort = () => sseAntwort("event: a\ndata: {}\n\n", 1);
    const programmierfehler = new TypeError("x is not a function");
    await expect(
      sseLesen(antwort(), undefined, () => {
        throw programmierfehler;
      }),
    ).rejects.toBe(programmierfehler);
    await expect(sseLesen(abreissenderStrom("event: a\ndata: {}\n\n"), undefined, () => undefined)).rejects.toBeInstanceOf(LeseFehler);
  });

  it.each([
    ["OpenAI", () => new OpenAiAnbieter("k", "https://api.test", abruf as typeof fetch)],
    ["Mistral", () => new MistralAnbieter("k", "https://api.test", abruf as typeof fetch, "global")],
    ["Anthropic", () => new AnthropicAnbieter("k", "https://api.test", abruf as typeof fetch)],
  ])("%s: ein TypeError in der Stromverarbeitung wird nicht wiederholt, sondern gemeldet", async (_, neu) => {
    aufrufe = 0;
    const a = neu();
    // Die Verarbeitung der Ereignisse scheitert mit einem TypeError, der Transport nicht
    const programmierfehler = new TypeError("Verarbeitung gescheitert (Test)");
    const verarbeite = vi.spyOn(SseLeser.prototype, "lies").mockImplementation(() => {
      throw programmierfehler;
    });
    try {
      const r = await ohneWarten(() => a.senden({ modell: "m", maxTokens: 10, system: [], nachrichten: [{ role: "user", content: "Los" }] }));
      expect(r.fehler).toBe(programmierfehler);
      expect(aufrufe).toBe(1);
      expect(r.dauerMs).toBe(0);
    } finally {
      verarbeite.mockRestore();
    }
  });
});
