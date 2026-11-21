// @vitest-environment jsdom
// Maske „Ereignisse und Sachverhalte“ (seit 0.9.10, Profilformat 1.38; Entscheidungen des Herausgebers vom 21.11.2026).
// Soll unabhängig vom Code:
// - Ein Zusatz „(optional)“ am Ende einer Beschriftung steht klein hinter ihr wie der Pflichtzusatz, nicht in ihrer Schrift;
//   Klammern, die zur Bezeichnung gehören („Meldezeitpunkt (t0)“), bleiben Teil der Beschriftung.
// - Ein Sachverhalt zeigt Analyse, dann Fachmodul (Ereignisart, Lagenradar), dann Bewertung – wie die Arbeitsanweisung der
//   Erfassung (Ereignisart, Analyse, Achsen D1–D8, danach Beurteilung und Tendenz). Schema und Meldung bleiben unverändert.
// - Der Kodierleitfaden ist in der Einleitung des Schritts einmal verlinkt und öffnet sich darunter, ohne die Erfassung zu
//   verlassen; ein Link auf eine Datei außerhalb des Pakets ergibt beim Laden eine Warnung.
import { readFileSync } from "node:fs";
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { einleitungsTeile } from "../../src/kern/einleitung";
import { ordneFelder } from "../../src/kern/ui";
import { ladeProfil, pruefeUiGegenSchema, pruefeUiStruktur } from "../../src/profil/laden";
import { teileBeschriftung } from "../../src/ui/Beschriftung";
import { Einleitung } from "../../src/ui/Einleitung";
import { Feld } from "../../src/ui/Feld";
import type { Befund } from "../../src/kern/typen";
import { aushaengen, einhaengen, klick, reactUmgebung } from "../support/dom";
import { profil, profilPflicht, repoPfad } from "../support/dateien";

beforeAll(reactUmgebung);
afterEach(aushaengen);

describe("Beschriftung mit Zusatz", () => {
  it("„(optional)“ und „(nur bei …)“ werden abgetrennt, andere Klammern bleiben", () => {
    expect(teileBeschriftung("Stellenkennung (optional)")).toEqual({ haupt: "Stellenkennung", zusatz: "(optional)" });
    expect(teileBeschriftung("Bezugsgröße (nur bei Verhältnis)")).toEqual({ haupt: "Bezugsgröße", zusatz: "(nur bei Verhältnis)" });
    for (const l of ["Meldezeitpunkt (t0)", "Adresse (URL)", "Ereignisart(en)", "Grund (offen)", "Bevölkerungsschutz (Modul)"])
      expect(teileBeschriftung(l), l).toEqual({ haupt: l });
  });

  it("in der Maske: „Stellenkennung“ in der Labelschrift, „(optional)“ im leisen Zusatz; zugänglicher Name vollständig", async () => {
    const p = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(Feld, { profil: p, knoten: p.schema, segs: [], wert: { absender: {} }, setze: () => {} }));
    const label = [...document.querySelectorAll("label.feld-label")].find((l) => l.textContent?.startsWith("Stellenkennung"))!;
    expect(label.querySelector(".label-zusatz")?.textContent).toBe("(optional)");
    expect(label.textContent).toBe("Stellenkennung (optional)");
    const t0 = [...document.querySelectorAll("label.feld-label, .feld-label")].find((l) => l.textContent?.startsWith("Meldezeitpunkt"));
    expect(t0?.querySelector(".label-zusatz")).toBeNull();
  });
});

describe("Reihenfolge der Unterfelder", () => {
  it("genannte Felder zuerst, übrige in Schemareihenfolge, unbekannte und doppelte Namen entfallen", () => {
    expect(ordneFelder(["a", "b", "c", "d"], ["c", "x", "a", "c"])).toEqual(["c", "a", "b", "d"]);
    expect(ordneFelder(["a", "b"], undefined)).toEqual(["a", "b"]);
  });

  it.each(["lead-beispiel", "lead-thueringen", "muster"])("%s: Sachverhalt zeigt Analyse, Fachmodul, Bewertung in dieser Reihenfolge", async (name) => {
    const p = await profilPflicht(name);
    const sv = { bezeichnung: "Test", analyse: {}, bewertung: {}, module: {} };
    await einhaengen(React.createElement(Feld, { profil: p, knoten: p.schema, segs: [], wert: { sachverhalte: [sv] }, setze: () => {} }));
    const titel = [...document.querySelectorAll("legend")].map((l) => l.textContent?.trim());
    const pos = (t: string) => titel.indexOf(t);
    expect(pos("Analyse")).toBeGreaterThan(-1);
    expect(pos("Fachmodule")).toBeGreaterThan(pos("Analyse"));
    expect(pos("Bewertung")).toBeGreaterThan(pos("Fachmodule"));
    expect(pos("Kennzahlen")).toBeGreaterThan(pos("Bewertung"));
  });

  it("Prüfung beim Laden: Reihenfolge als Liste von Texten, unbekannte Namen als Warnung; mitgelieferte Profile ohne Befund", async () => {
    const p = await profilPflicht("lead-beispiel");
    const b: Befund[] = [];
    const ui = structuredClone(p.ui);
    (ui.felder as any)["sachverhalte[]"] = { reihenfolge: ["bewertung", "gibtsnicht"] };
    pruefeUiGegenSchema(ui, p.schema, b);
    expect(b.map((x) => x.text)).toEqual(["Darstellungsdatei: Reihenfolge von „sachverhalte[]“ nennt unbekannte Felder: gibtsnicht."]);
    const fehler: Befund[] = [];
    pruefeUiStruktur({ ...structuredClone(p.ui), felder: { x: { reihenfolge: "a" } } }, fehler);
    expect(fehler.map((x) => x.text)).toContain("Darstellungsdatei: Feld „x“: „reihenfolge“ muss eine Liste von Feldnamen sein.");
    for (const name of ["lead-beispiel", "lead-thueringen", "muster"]) {
      const { befunde } = await profil(name);
      expect(
        befunde.filter((x) => /Reihenfolge|Einleitung/.test(x.text)),
        name,
      ).toEqual([]);
    }
  });
});

describe("Kodierleitfaden in der Einleitung", () => {
  it("Link auf eine Datei des Pakets wird Link, sonst Text", () => {
    expect(einleitungsTeile("Siehe [Leitfaden](kl.md) und [fremd](x.md).", { "kl.md": "# KL" })).toEqual([
      { text: "Siehe " },
      { text: "Leitfaden", ziel: "kl.md" },
      { text: " und " },
      { text: "fremd" },
      { text: "." },
    ]);
  });

  it("Klick öffnet den Kodierleitfaden unter der Einleitung, zweiter Klick schließt ihn", async () => {
    const p = await profilPflicht("lead-beispiel");
    const text = p.ui.schritte.find((s) => s.id === "sachverhalte")!.einleitung!;
    expect(text).toContain("[Kodierleitfaden des Profils](kodierleitfaden.md)");
    await einhaengen(React.createElement(Einleitung, { text, profil: p }));
    const knopf = document.querySelector<HTMLButtonElement>("button.text-knopf")!;
    expect(knopf.textContent).toBe("Kodierleitfaden des Profils");
    expect(document.querySelector(".einleitung")?.textContent).toBe(
      "Je Ereignis oder Sachverhalt ein Eintrag. Maßgeblich für die Kodierung ist der Kodierleitfaden des Profils.",
    );
    expect(knopf.getAttribute("aria-expanded")).toBe("false");
    await klick(knopf);
    expect(knopf.getAttribute("aria-expanded")).toBe("true");
    const dok = document.getElementById(knopf.getAttribute("aria-controls")!)!;
    expect(dok.hidden).toBe(false);
    const kl = readFileSync(repoPfad("profile/lead-beispiel/kodierleitfaden.md"), "utf-8");
    const ueberschrift = kl.match(/^# (.+)$/m)![1]!;
    expect(dok.textContent).toContain(ueberschrift);
    await klick(knopf);
    expect(dok.hidden).toBe(true);
  });

  it("Link auf eine fehlende Datei: Warnung beim Laden", async () => {
    const p = await profilPflicht("lead-beispiel");
    const ui = structuredClone(p.ui);
    ui.schritte.find((s) => s.id === "sachverhalte")!.einleitung = "Siehe [Leitfaden](fehlt.md).";
    const dateien = { ...p.dateien, "meldung.ui.json": JSON.stringify(ui) };
    const erg = await ladeProfil(dateien);
    expect(erg.befunde.map((b) => b.text)).toContain(
      "Darstellungsdatei: Einleitung des Schritts „Ereignisse und Sachverhalte“ verlinkt „fehlt.md“, das nicht im Paket liegt.",
    );
  });
});
