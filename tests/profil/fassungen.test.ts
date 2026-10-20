// Gültigkeitsstand in Teil A: Fassungen aus den Köpfen der Profildokumente.
import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { repoPfad } from "../support/dateien";
describe("Gültigkeitsstand in Teil A", () => {
  it("nennt die Fassungen, die in den Köpfen der Dokumente stehen", () => {
    const ordner = repoPfad("profile/lead-beispiel");
    const teilA = readFileSync(join(ordner, "sop/A_Gemeinsame-Regeln.md"), "utf8");
    const zeile = (beginn: string) =>
      teilA
        .split("\n")
        .find((z) => z.startsWith(`| ${beginn}`))!
        .split("|")[2]
        .trim();
    const kopf = (datei: string) =>
      readFileSync(join(ordner, datei), "utf8")
        .slice(0, 600)
        .match(/Fassung\s+(\d+(?:\.\d+)*)/)![1];
    expect(zeile("Kodierleitfaden")).toBe(kopf("kodierleitfaden.md"));
    expect(zeile("Arbeitsanweisung Erfassung")).toBe(kopf("anweisung-erfassung.md"));
    expect(zeile("Arbeitsanweisung Verdichtung")).toBe(kopf("anweisung-verdichtung.md"));
    expect(zeile("Arbeitsanweisung Kurzfassung")).toBe(kopf("anweisung-kurzfassung.md"));
    expect(zeile("SOP-LEAD-Sammelmappe")).toBe(kopf("sop/README.md"));
    const profilVersion = JSON.parse(readFileSync(join(ordner, "profil.json"), "utf8")).version;
    // Versionen numerisch vergleichen („1.9.0“ liegt vor „1.10.0“)
    const teile = (v: string) => v.split(".").map(Number);
    const vorOderGleich = (a: string, b: string) => {
      const [x, y] = [teile(a), teile(b)];
      for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0);
      return true;
    };
    expect(vorOderGleich(zeile("Darstellungsdatei").replace("Profilversion ", ""), profilVersion)).toBe(true);
  });
});
