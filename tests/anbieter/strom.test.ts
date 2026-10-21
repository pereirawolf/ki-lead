// SSE-Leser: Ereignisse über Chunk-Grenzen (Review 18.10.2026, F09), Zeilenenden CRLF/CR/LF, fehlendes Ende und
// UTF-8 über Bytegrenzen durch beide Anbieteradapter (Netzwerkchunks enden mitten in einem Zeichen).
import { describe, expect, it } from "vitest";
import { SseLeser } from "../../src/anbieter/strom";
import { AnthropicAnbieter } from "../../src/anbieter/anthropic";
import { OpenAiAnbieter } from "../../src/anbieter/openai";
import type { LlmAnfrage } from "../../src/anbieter/typen";
import { sseAntwort, sseText as sse } from "../support/anbieter";

describe("SSE", () => {
  it("setzt Ereignisse über Chunk-Grenzen zusammen", () => {
    const l = new SseLeser();
    const text = sse([{ type: "ping" }, { type: "message_stop" }]);
    const a = l.lies(text.slice(0, 10));
    const b = l.lies(text.slice(10));
    expect([...a, ...b].map((e) => e.event)).toEqual(["ping", "message_stop"]);
  });
});

describe("F09: SSE unabhängig von Chunk-Grenzen", () => {
  const text = 'event: a\r\ndata: {"x":1}\r\n\r\nevent: b\r\ndata: {"y":2}\r\n\r\n: kommentar\r\n\r\nevent: c\rdata: {"z":3}\r\r\n';
  // Soll unabhängig vom Leser: Kommentarzeilen entfallen, CR und CRLF gelten wie LF
  const erwartet = JSON.stringify([
    { event: "a", data: { x: 1 } },
    { event: "b", data: { y: 2 } },
    { event: "c", data: { z: 3 } },
  ]);
  it("an jeder Position geteilt ergibt dasselbe", () => {
    expect(JSON.stringify(new SseLeser().lies(text))).toBe(erwartet);
    for (let i = 0; i <= text.length; i++) {
      const l = new SseLeser();
      expect(JSON.stringify([...l.lies(text.slice(0, i)), ...l.lies(text.slice(i))])).toBe(erwartet);
    }
  });
});

describe("SSE: Ende und Zeilenenden", () => {
  it("gibt ein Ereignis ohne abschließende Leerzeile nicht aus, bis sie folgt", () => {
    const l = new SseLeser();
    expect(l.lies('event: a\ndata: {"x":1}\n')).toEqual([]);
    expect(l.lies("\n")).toEqual([{ event: "a", data: { x: 1 } }]);
  });

  it("liest LF, CRLF und CR gleich, auch mit mehrzeiligen Daten und ohne Ereignisnamen", () => {
    for (const nl of ["\n", "\r\n", "\r"]) {
      const l = new SseLeser();
      const text = ["event: x", 'data: {"a":', "data: 1}", "", "data: [DONE]", "", ""].join(nl);
      // Ein CR am Chunkende kann zu einem CRLF gehören und wartet auf das nächste Zeichen; ein Kommentar löst es auf
      expect([...l.lies(text), ...l.lies(": ende" + nl)], JSON.stringify(nl)).toEqual([
        { event: "x", data: { a: 1 } },
        { event: "message", data: "[DONE]" },
      ]);
    }
  });
});

describe("UTF-8 über Bytegrenzen", () => {
  // Zwei-, drei- und vierbyteige Zeichen; jede Teilung innerhalb eines Zeichens muss dasselbe ergeben
  const TEXT = "Größe ✓ 😀 Straße";
  const anfrage = (modell: string): LlmAnfrage => ({ modell, maxTokens: 100, system: [], nachrichten: [{ role: "user", content: "Los" }] });

  const anthropicStrom = sse([
    { type: "message_start", message: { model: "claude-sonnet-5-5", usage: { input_tokens: 1, output_tokens: 1 } } },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: TEXT } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2 } },
    { type: "message_stop" },
  ]);
  const openAiStrom = sse([
    {
      type: "response.completed",
      response: {
        status: "completed",
        model: "gpt-6.1-sol",
        output: [{ type: "message", content: [{ type: "output_text", text: TEXT, annotations: [] }] }],
        usage: { input_tokens: 1, output_tokens: 2 },
      },
    },
  ]);

  /** Bytepositionen, die mitten in einem mehrbyteigen Zeichen liegen */
  function schnitteImZeichen(text: string): number[] {
    const bytes = new TextEncoder().encode(text);
    return [...bytes.keys()].filter((i) => i > 0 && (bytes[i] & 0b1100_0000) === 0b1000_0000);
  }

  it.each([
    ["Anthropic", anthropicStrom, "claude-sonnet-5-5", (r: Response) => new AnthropicAnbieter("k", "https://x", (async () => r) as any)],
    ["OpenAI", openAiStrom, "gpt-6.1-sol", (r: Response) => new OpenAiAnbieter("k", "https://x", (async () => r) as any)],
  ] as const)("%s: Text bleibt bei jeder Teilung innerhalb eines Zeichens unverändert", async (_, strom, modell, neu) => {
    const schnitte = schnitteImZeichen(strom);
    expect(schnitte.length).toBeGreaterThanOrEqual(8);
    for (const s of schnitte) {
      const r = await neu(sseAntwort(strom, [s])).senden(anfrage(modell));
      expect(r.text, `Schnitt bei Byte ${s}`).toBe(TEXT);
    }
    // Und alle Schnitte zugleich: jedes Byte einzeln
    const einzeln = [...new TextEncoder().encode(strom).keys()].slice(1);
    expect((await neu(sseAntwort(strom, einzeln)).senden(anfrage(modell))).text).toBe(TEXT);
  });
});
