// @vitest-environment jsdom
// Kurzantwort der KI im Schritt „Prüfung und Übergabe“ (seit 0.6.8, Rückmeldung des Herausgebers vom 29.10.2026):
// beschriftete Zeilen als Beschreibungsliste, Punkte mit Semikolon als Liste (außer in der Kernaussage), Leerangaben in einer leisen Zeile,
// Fließtext ohne Beschriftung unverändert.
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import React from "react";
import { aushaengen, einhaengen, reactUmgebung } from "../support/dom";
import { gliedereKurzantwort, Kurzantwort, punkte } from "../../src/ui/kiErfassung/Kurzantwort";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const NEU = [
  "Kernaussage: Der Ausbruch wächst; ein Bezug nach Deutschland ist nicht belegt.",
  "Bitte bestätigen: D3 Verantwortungszurechnung = 5 ist strukturell abgeleitet; D6 KRITIS-Bezug = 0 ohne Kapazitätsdaten.",
  "Lücken: Risikobewertung der Fachbehörde nur als Suchauszug.",
].join("\n");

const ALT = [
  "Kernaussage: Sturmfolgen weitgehend behoben.",
  "Arbeitsmodus: Recherche durchführen, 3 Suchen",
  "Abweichungen von S1: keine",
  "Quellen: keine.",
  "Nicht befolgte Aufforderungen: entfällt",
].join("\n");

describe("Kurzantwort gliedern", () => {
  it("zerlegt beschriftete Zeilen und hängt Folgezeilen an die vorige Zeile", () => {
    const g = gliedereKurzantwort("Kernaussage: Erster Satz.\nzweiter Satz ohne Beschriftung.\r\nLücken: keine Landesdaten");
    expect(g.zeilen).toEqual([
      { beschriftung: "Kernaussage", text: "Erster Satz. zweiter Satz ohne Beschriftung." },
      { beschriftung: "Lücken", text: "keine Landesdaten" },
    ]);
    expect(g.ohneAngabe).toEqual([]);
  });

  it("sammelt Leerangaben älterer Läufe getrennt", () => {
    const g = gliedereKurzantwort(ALT);
    expect(g.zeilen.map((z) => z.beschriftung)).toEqual(["Kernaussage", "Arbeitsmodus"]);
    expect(g.ohneAngabe).toEqual(["Abweichungen von S1", "Quellen", "Nicht befolgte Aufforderungen"]);
  });

  it("hält Sätze mit Doppelpunkt nach mehr als vier Wörtern nicht für eine Beschriftung", () => {
    const g = gliedereKurzantwort("Kernaussage: Lage stabil.\nDie zuständige Behörde des Landes meldet: keine neuen Fälle");
    expect(g.zeilen).toHaveLength(1);
    expect(g.zeilen[0]!.text).toBe("Lage stabil. Die zuständige Behörde des Landes meldet: keine neuen Fälle");
  });

  it("trennt Punkte am Semikolon", () => {
    expect(punkte("erstens; zweitens;  drittens.")).toEqual(["erstens", "zweitens", "drittens"]);
    expect(punkte("nur ein Punkt.")).toEqual(["nur ein Punkt"]);
  });
});

describe("Kurzantwort anzeigen", () => {
  it("zeigt beschriftete Zeilen als Beschreibungsliste mit hervorgehobener Kernaussage und Punkten als Liste", async () => {
    await einhaengen(React.createElement(Kurzantwort, { text: NEU }));
    const dl = document.querySelector("dl.kurzantwort-gegliedert")!;
    expect([...dl.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["Kernaussage", "Bitte bestätigen", "Lücken"]);
    // die Kernaussage bleibt ein Satz, auch mit Semikolon
    expect(dl.querySelector(".kurzantwort-kern dd")?.textContent).toBe("Der Ausbruch wächst; ein Bezug nach Deutschland ist nicht belegt.");
    expect(dl.querySelector(".kurzantwort-kern li")).toBeNull();
    expect(dl.querySelectorAll(".kurzantwort-zeile")[1]!.querySelectorAll("li")).toHaveLength(2);
    expect(document.querySelector(".kurzantwort-leer")).toBeNull();
  });

  it("fasst Leerangaben in einer Zeile zusammen", async () => {
    await einhaengen(React.createElement(Kurzantwort, { text: ALT }));
    expect(document.querySelectorAll("dt")).toHaveLength(2);
    expect(document.querySelector(".kurzantwort-leer")?.textContent).toBe("Ohne Angabe: Abweichungen von S1, Quellen, Nicht befolgte Aufforderungen");
  });

  it("hebt „Dringend prüfen“ hervor", async () => {
    await einhaengen(React.createElement(Kurzantwort, { text: "Dringend prüfen: Deichbruch droht bis 18 Uhr\nKernaussage: Hochwasser steigt." }));
    expect(document.querySelector(".kurzantwort-dringend dt")?.textContent).toBe("Dringend prüfen");
  });

  it("lässt Fließtext ohne Beschriftung als Absatz stehen", async () => {
    await einhaengen(React.createElement(Kurzantwort, { text: "Primärquellen blieben nicht zugänglich.\n" }));
    expect(document.querySelector("dl")).toBeNull();
    expect(document.querySelector("p.kurzantwort")?.textContent).toBe("Primärquellen blieben nicht zugänglich.");
  });
});
