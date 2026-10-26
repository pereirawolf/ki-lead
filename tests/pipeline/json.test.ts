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

// Zerlegung als diskriminierte Union (seit 0.6.2, TP-2026-W44-07)
describe("TP-2026-W44-07: Zerlegung unterscheidet ok und Fehler", () => {
  it("mit JSON: ok, json und jsonText gesetzt, kein fehler", () => {
    const z = zerlegeAntwort('Kurz.\n\n```json\n{"a": 1}\n```');
    expect(z.ok).toBe(true);
    expect(z.fehler).toBeUndefined();
    expect(z.jsonText).toBe('{"a": 1}');
  });

  it("ohne JSON: ok false, fehler gesetzt, json undefined; der Kandidat bleibt als jsonText", () => {
    const kaputt = zerlegeAntwort('```json\n{"a": \n```');
    expect(kaputt.ok).toBe(false);
    expect(kaputt.json).toBeUndefined();
    expect(kaputt.jsonText).toBe('{"a":');
    const leer = zerlegeAntwort("nur Text");
    expect(leer).toEqual({ ok: false, kurzantwort: "nur Text", fehler: "Die Antwort enthält keinen JSON-Block." });
  });
});
