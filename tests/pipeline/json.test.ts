// JSON aus KI-Antworten: Kurzantwort und letzter JSON-Block.
import { describe, expect, it } from "vitest";
import { zerlegeAntwort } from "../../src/pipeline/json";

describe("JSON aus Antworten", () => {
  it("trennt Kurzantwort und letzten JSON-Block", () => {
    const z = zerlegeAntwort('Kurz.\n\n```json\n{"a": 1}\n```');
    expect(z).toMatchObject({ kurzantwort: "Kurz.", json: { a: 1 } });
    expect(zerlegeAntwort('Text {"b": "}"} Ende').json).toEqual({ b: "}" });
    expect(zerlegeAntwort('```json\n{"a": \n```').fehler).toMatch(/nicht lesbar/);
    expect(zerlegeAntwort("nur Text").fehler).toMatch(/keinen JSON-Block/);
  });
});
