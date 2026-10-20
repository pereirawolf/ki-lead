// SSE-Leser: Ereignisse über Chunk-Grenzen (Review 18.10.2026, F09).
import { describe, expect, it } from "vitest";
import { SseLeser } from "../../src/anbieter/strom";

function sse(ereignisse: any[]): string {
  return ereignisse.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
}

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
  const erwartet = JSON.stringify(new SseLeser().lies(text));
  it("an jeder Position geteilt ergibt dasselbe", () => {
    expect(JSON.parse(erwartet).map((e: any) => e.event)).toEqual(["a", "b", "c"]);
    for (let i = 0; i <= text.length; i++) {
      const l = new SseLeser();
      expect(JSON.stringify([...l.lies(text.slice(0, i)), ...l.lies(text.slice(i))])).toBe(erwartet);
    }
  });
});
