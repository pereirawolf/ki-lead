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

// Zaun vor dem ersten „{“ (seit 0.6.2, TP-2026-W44-10)
describe("TP-2026-W44-10: Zaun, Kurzantwort mit „{“ und abgeschnittene Antworten", () => {
  it("CRLF-Zeilenenden im Codeblock", () => {
    const z = zerlegeAntwort('Kurz.\r\n\r\n```json\r\n{"a": 1}\r\n```\r\n');
    expect(z.ok).toBe(true);
    expect(z.json).toEqual({ a: 1 });
    expect(z.kurzantwort).toBe("Kurz.");
  });

  it("Codeblock mit Folgetext: der Folgetext gehört zur Kurzantwort", () => {
    const z = zerlegeAntwort('Kurz.\n```json\n{"a": 1}\n```\nNachsatz.');
    expect(z.json).toEqual({ a: 1 });
    expect(z.kurzantwort).toBe("Kurz.\n\nNachsatz.");
  });

  it("ein „{“ in der Kurzantwort verschiebt den Kandidaten nicht, wenn ein offener Zaun folgt", () => {
    // Abgeschnittene Antwort: Zaun geöffnet, nie geschlossen; die Kurzantwort enthält geschweifte Klammern
    const z = zerlegeAntwort('Kurz {Hinweis}: Lage stabil.\n\n```json\n{"a": 1, "b": [1, 2');
    expect(z.ok).toBe(false);
    expect(z.fehler).toMatch(/unvollständig/);
    expect(z.jsonText).toBe('{"a": 1, "b": [1, 2');
    expect(z.kurzantwort).toBe("Kurz {Hinweis}: Lage stabil.");
  });

  it("abgeschnittener Zaun mit vollständigem Objekt: das Objekt zählt, der Zaunrest nicht", () => {
    const z = zerlegeAntwort('Kurz.\n```json\n{"a": 1}');
    expect(z.ok).toBe(true);
    expect(z.json).toEqual({ a: 1 });
    expect(z.kurzantwort).toBe("Kurz.");
  });

  it("ohne Zaun bleibt das erste ausgeglichene Objekt maßgeblich", () => {
    const z = zerlegeAntwort('Hinweis {kein JSON} dann {"a": 1} Ende');
    expect(z.ok).toBe(false);
    expect(z.fehler).toMatch(/nicht lesbar/);
    expect(z.jsonText).toBe("{kein JSON}");
  });
});
