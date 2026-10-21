// Abbruch während der Wartezeit vor einem neuen Versuch (Review 20.10.2026, F09).
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiAnbieter } from "../../src/anbieter/openai";
import { AnthropicAnbieter } from "../../src/anbieter/anthropic";
import { warte } from "../../src/anbieter/warten";

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
