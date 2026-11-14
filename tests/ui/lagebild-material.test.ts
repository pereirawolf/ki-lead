// @vitest-environment jsdom
// Kennzahlen-Bausteine in der Auswertung (seit 0.8.2, UP-2026-W45-05): Beispiel „Ilka“ mit Material, Liste mit
// Prüfstand und Rechenhilfe, keine zusätzlichen Meldungen; Übergabe mit der Rolle „material“, gültige Bausteine
// vorausgewählt. Soll unabhängig vom Code: die fiktiven Meldungen und Bausteine des Landesprofils.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil } from "../support/dateien";
import { aushaengen, einhaengen, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
  vi.resetModules();
});

describe("UP-2026-W45-05: Kennzahlen-Bausteine als Material in der Auswertung", () => {
  it("Beispiel Ilka: vier Meldungen und fünf Bausteine als Material mit Rechenhilfe; Übergabe mit Rolle „material“", async () => {
    const { LagebildAnsicht } = await import("../../src/ui/Lagebild");
    const p = (await profil("lead-thueringen")).profil!;
    const uebergeben = vi.fn();
    await einhaengen(React.createElement(LagebildAnsicht, { profil: p, uebergeben, oeffnen: () => {} }));
    await klick(knopf(/Beispiel laden: Orkantief/));
    expect(document.querySelector(".lb-zahl")!.textContent).toMatch(/^4 Meldungen · /);
    expect(seitentext()).not.toContain("Nicht eingelesen");
    const liste = document.querySelector(".lb-material")!;
    expect(liste.querySelector("summary")!.textContent).toBe("Material: Kennzahlen-Bausteine (5)");
    const zeilen = [...liste.querySelectorAll(".lb-material-liste li")].map((li) => li.textContent);
    expect(zeilen).toHaveLength(5);
    expect(zeilen.find((z) => z!.startsWith("Thüringen (16)"))).toMatch(
      /Datenstand 14\.10\.2026, 10:30 · 32 Kennzahlen · 7 Einsatzmeldungen · Thessa 0\.3, FIKTIV · Schema erfüllt.*erfasster Ausschnitt, Vollständigkeit nicht angegeben/,
    );
    expect(liste.querySelector(".lb-rechenhilfe pre")!.textContent).toContain("Rechenhilfe der App");
    // Bausteine erscheinen nicht in der Dateiliste der Meldungen und nicht im Meldestatus
    expect([...document.querySelectorAll(".lb-dateien .lb-datei-name")].map((e) => e.textContent).some((n) => n!.startsWith("kennzahlen_"))).toBe(false);

    await klick(knopf("An KI-Verdichtung übergeben"));
    const dialog = document.querySelector(".lb-uebergabe")!;
    expect(dialog.querySelector(".lb-uebergabe-material legend")!.textContent).toBe("Material: Kennzahlen-Bausteine");
    expect(dialog.querySelectorAll(".lb-uebergabe-material input:checked")).toHaveLength(5);
    expect(dialog.querySelector(".lb-uebergabe-summe")!.textContent).toContain("5 Kennzahlen-Bausteine als Material");
    await klick(knopf(/Meldungen und 5 Bausteine übergeben/, dialog));
    const liste2 = uebergeben.mock.calls[0]![0] as { name: string; rolle: string }[];
    expect(liste2.filter((d) => d.rolle === "material").map((d) => d.name)).toEqual([
      "kennzahlen_Ilm-Kreis_2026-10-14T10-00_FIKTIV.json",
      "kennzahlen_Landkreis-Hildburghausen_2026-10-14T10-00_FIKTIV.json",
      "kennzahlen_Landkreis-Sonneberg_2026-10-14T10-00_FIKTIV.json",
      "kennzahlen_Landkreis-Sonneberg_2026-10-14T10-30_FIKTIV.json",
      "kennzahlen_Thueringen_2026-10-14T10-30_FIKTIV.json",
    ]);
    expect(liste2.filter((d) => d.rolle !== "material").every((d) => !d.name.startsWith("kennzahlen_"))).toBe(true);
  });
});
