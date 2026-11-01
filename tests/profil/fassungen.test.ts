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

  // GK-2026-W44-05: Die Zeile nennt die Profilversion der letzten Änderung der Darstellungsdatei. Soll ist die jüngste
  // Profilversion, deren Eintrag im Profil-CHANGELOG eine Änderung der Darstellungsdatei aufführt („- **Darstellungsdatei“);
  // nicht pauschal die Manifestversion, denn reine Schema- oder Dokumentänderungen lassen die Darstellungsdatei unverändert.
  const letzteUiAenderung = (changelog: string): { version: string; stand: string } | null => {
    for (const abschnitt of changelog.split(/^## /m).slice(1)) {
      const kopf = abschnitt.match(/^(\d+\.\d+\.\d+) – (\d{2}\.\d{2}\.\d{4})/);
      if (kopf && /^- \*\*Darstellungsdatei/m.test(abschnitt)) return { version: kopf[1]!, stand: kopf[2]! };
    }
    return null;
  };
  const uiZeile = (teilA: string) =>
    teilA
      .split("\n")
      .find((z) => z.startsWith("| Darstellungsdatei"))!
      .split("|")
      .map((x) => x.trim());

  it("GK-2026-W44-05: Darstellungsdatei mit Profilversion und Stand ihrer letzten Änderung laut Profil-CHANGELOG", () => {
    const ordner = repoPfad("profile/lead-beispiel");
    const soll = letzteUiAenderung(readFileSync(join(ordner, "CHANGELOG.md"), "utf8"))!;
    expect(soll).not.toBeNull();
    const z = uiZeile(readFileSync(join(ordner, "sop/A_Gemeinsame-Regeln.md"), "utf8"));
    expect([z[2], z[3]]).toEqual([`Profilversion ${soll.version}`, soll.stand]);
  });

  it("GK-2026-W44-05: Negativfall – ein veralteter Stand besteht die Prüfung nicht", () => {
    const changelog =
      "# V\n\n## 1.35.1 – 01.11.2026\n\n- **Darstellungsdatei, Analysebereich:** x\n\n## 1.34.0 – 30.10.2026\n\n- Schema, Darstellungsdatei sind unverändert.\n\n## 1.33.1 – 30.10.2026\n\n- **Darstellungsdatei (Profilversion 1.33.1):** y\n";
    expect(letzteUiAenderung(changelog)).toEqual({ version: "1.35.1", stand: "01.11.2026" });
    const z = uiZeile("| Darstellungsdatei `meldung.ui.json` (…) | Profilversion 1.33.1 | 30.10.2026 | H | K |");
    expect(z[2]).not.toBe(`Profilversion ${letzteUiAenderung(changelog)!.version}`);
  });
});
