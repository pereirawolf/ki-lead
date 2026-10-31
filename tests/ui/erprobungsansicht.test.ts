// @vitest-environment jsdom
// Erprobungsansicht im Ergebnis der KI-Erfassung (seit 0.6.16). Grundlage: Befunddatei
// ki-lead-befund_technik_2026-W44-A5.json vom 31.10.2026 (Arbeitspaket A5), TP-2026-W44-46.
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { aushaengen, einhaengen, reactUmgebung } from "../support/dom";
import { profilPflicht } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { Ergebnis } from "../../src/ui/kiErfassung/Ergebnis";
import type { Lauf } from "../../src/pipeline/lauf";

beforeAll(reactUmgebung);
afterEach(aushaengen);

/** Lauf mit fertigem Ergebnis (nur die Felder, die die Ansicht liest) */
const lauf = () =>
  ({
    id: "L-TEST",
    auftrag: { websuche: false, urls: [] },
    material: [],
    stufen: [],
    ergebnis: { meldung: ilkaMeldung("Bund"), kurzantwort: "", schemakonform: true, befunde: [], fundstellen: [], suchen: [] },
  }) as unknown as Lauf;

describe("TP-2026-W44-46: Vergleich mit einer Referenzfassung nur mit Forschungsfunktionen", () => {
  it.each([
    [true, 1],
    [false, 0],
    [undefined, 0],
  ])("forschung = %s", async (forschung, anzahl) => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(Ergebnis, {
        profil,
        aendern: () => {},
        lauf: lauf(),
        fehler: null,
        uebernehmen: () => {},
        exportieren: () => {},
        forschung,
      }),
    );
    const summaries = [...document.querySelectorAll("summary")].filter((s) => s.textContent?.startsWith("Vergleich mit einer Referenzfassung"));
    expect(summaries.length).toBe(anzahl);
    // Laufprotokoll bleibt in jedem Fall
    expect([...document.querySelectorAll("summary")].some((s) => s.textContent?.startsWith("Laufprotokoll"))).toBe(true);
  });
});
