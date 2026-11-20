// Versatz an den Umstellungen der Sommerzeit (seit 0.9.6, Grunddesign 1.12, LD-T04): mitVersatz in
// src/kern/meldung-v2.js (Migration, KI-Nachbearbeitung, t0) und wanduhrMitVersatz/zeitpunktInZone in src/kern/zeit.ts
// (Erfassungsmaske) folgen derselben Regel. In der doppelt vorkommenden Stunde gilt die frühere, eine ausgefallene
// Uhrzeit rückt um den Sprung nach vorn. meldung-v2.js bleibt ohne Importe; der Gleichlauf ist deshalb hier geprüft,
// minutengenau über ganze Umstellungstage.
import { describe, expect, it } from "vitest";
import { mitVersatz } from "../../src/kern/meldung-v2.js";
import { wanduhrMitVersatz, zeitpunktInZone } from "../../src/kern/zeit";

const B = "Europe/Berlin";
const p = (n: number) => String(n).padStart(2, "0");
const minutenDesTags = (tag: string) => Array.from({ length: 1440 }, (_, i) => `${tag}T${p(Math.floor(i / 60))}:${p(i % 60)}`);

describe("mitVersatz an den Umstellungen (Europe/Berlin)", () => {
  it("Ende der Sommerzeit am 25.10.2026: in der doppelten Stunde die frühere (+02:00), danach +01:00", () => {
    expect(mitVersatz("2026-10-25T01:59", B)).toBe("2026-10-25T01:59+02:00");
    expect(mitVersatz("2026-10-25T02:00", B)).toBe("2026-10-25T02:00+02:00");
    expect(mitVersatz("2026-10-25T02:30", B)).toBe("2026-10-25T02:30+02:00");
    expect(mitVersatz("2026-10-25T02:59", B)).toBe("2026-10-25T02:59+02:00");
    expect(mitVersatz("2026-10-25T03:00", B)).toBe("2026-10-25T03:00+01:00");
    expect(Date.parse(mitVersatz("2026-10-25T02:30", B) ?? "")).toBe(zeitpunktInZone(2026, 10, 25, 2, 30, B).getTime());
  });

  it("Beginn der Sommerzeit am 29.03.2026: ausgefallene Uhrzeit um den Sprung nach vorn, kein falscher Zeitpunkt", () => {
    expect(mitVersatz("2026-03-29T01:59", B)).toBe("2026-03-29T01:59+01:00");
    expect(mitVersatz("2026-03-29T02:00", B)).toBe("2026-03-29T03:00+02:00");
    expect(mitVersatz("2026-03-29T02:30", B)).toBe("2026-03-29T03:30+02:00");
    expect(mitVersatz("2026-03-29T02:59", B)).toBe("2026-03-29T03:59+02:00");
    expect(mitVersatz("2026-03-29T03:00", B)).toBe("2026-03-29T03:00+02:00");
    expect(Date.parse(mitVersatz("2026-03-29T02:30", B) ?? "")).toBe(zeitpunktInZone(2026, 3, 29, 2, 30, B).getTime());
    // Sekunden bleiben erhalten, auch beim Sprung
    expect(mitVersatz("2026-03-29T02:30:15", B)).toBe("2026-03-29T03:30:15+02:00");
    expect(mitVersatz("2026-10-25T02:30:15", B)).toBe("2026-10-25T02:30:15+02:00");
  });

  it("außerhalb der Umstellungen unverändert: Text bleibt, Versatz der Jahreszeit; Unlesbares ergibt null", () => {
    expect(mitVersatz("2026-11-16T17:36", B)).toBe("2026-11-16T17:36+01:00");
    expect(mitVersatz("2026-10-14T10:30", B)).toBe("2026-10-14T10:30+02:00");
    expect(mitVersatz("2026-11-16T17:36", "UTC")).toBe("2026-11-16T17:36+00:00");
    expect(mitVersatz("16.11.2026 17:36", B)).toBeNull();
  });
});

describe("Gleichlauf mitVersatz und wanduhrMitVersatz", () => {
  const faelle: [string, string][] = [
    [B, "2026-03-29"],
    [B, "2026-10-25"],
    [B, "2027-03-28"],
    [B, "2027-10-31"],
    [B, "2026-11-16"],
    ["America/New_York", "2026-03-08"],
    ["America/New_York", "2026-11-01"],
    ["Australia/Lord_Howe", "2026-04-05"],
    ["Australia/Lord_Howe", "2026-10-04"],
    ["UTC", "2026-10-25"],
  ];
  for (const [zone, tag] of faelle) {
    it(`${zone}, ${tag}: jede Minute gleich`, () => {
      const abweichend = minutenDesTags(tag).filter((l) => mitVersatz(l, zone) !== wanduhrMitVersatz(l, zone));
      expect(abweichend).toEqual([]);
    });
  }
});
