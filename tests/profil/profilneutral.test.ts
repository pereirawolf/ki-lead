// Profilneutrale Texte der Oberfläche (GK-2026-W44-13 bis -15, Nachprüfung der Gesamtkonsistenz KW 44 vom 01.11.2026).
// Soll: Angezeigte Texte der App nennen Abschnitte nur über die Verweise des Profils (`lagebild.verweise`); feste
// Fundstellen des Beispielprofils gelten in anderen Profilen nicht (SOP-LEAD A.10.1, Teil A des Justizprofils).
// Ausgenommen sind KI-Prompts (src/pipeline/kontext.ts) und die Forschungswerkzeuge (src/forschung/).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { verweisKlammer } from "../../src/kern/ui";
import { profil } from "../support/dateien";

function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((n) => {
    const p = join(ordner, n);
    return statSync(p).isDirectory() ? dateien(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}

/** Zeilen außerhalb von Kommentaren */
function codeZeilen(text: string): string[] {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((z) => !/^\s*\/\//.test(z));
}

describe("Profilneutrale Texte der Oberfläche", () => {
  it("GK-2026-W44-13: kein festes „SOP-LEAD A.“ in angezeigten Texten der App", () => {
    const pruefen = ["src/ui", "src/lagebild", "src/kern", "src/pipeline", "src/profil"]
      .flatMap((o) => dateien(o))
      .filter((d) => !d.endsWith(join("pipeline", "kontext.ts")));
    const treffer = pruefen.flatMap((d) =>
      codeZeilen(readFileSync(d, "utf8"))
        .filter((z) => /SOP-LEAD A\.\d/.test(z))
        .map((z) => `${d}: ${z.trim().slice(0, 80)}`),
    );
    expect(treffer).toEqual([]);
    // Gegenprobe: die frühere Zeile würde gefunden
    expect(codeZeilen("zusammenführen lassen (SOP-LEAD A.7.1).").filter((z) => /SOP-LEAD A\.\d/.test(z))).toHaveLength(1);
  });

  it("GK-2026-W44-13: der Verweis kommt aus dem Profil", async () => {
    const beispiel = (await profil("lead-beispiel")).profil!;
    const justiz = (await profil("lead-justiz")).profil!;
    expect(verweisKlammer(beispiel.ui, "zusammenhang")).toBe(" (SOP-LEAD A.7.1, A.7.2)");
    expect(verweisKlammer(justiz.ui, "zusammenhang")).toBe(" (Teil A, A.7, A.7.1)");
    expect(verweisKlammer({ ...justiz.ui, lagebild: {} }, "zusammenhang")).toBe("");
  });

  // Soll: Kategorien des Profils (quellen.kategorien; Beispiel A/B/W/M/P, Justiz A/B/K/W/V/M/P); Warnungen nennen keine
  // feste Kategorienliste als Alternative zu A.
  it("GK-2026-W44-14: die Warnung zu Eingangsmeldungen nennt keine feste Kategorienliste", () => {
    const s2s3 = readFileSync("src/pipeline/s2s3.ts", "utf8");
    expect(s2s3).not.toMatch(/dann B oder P/);
    expect(s2s3).toContain("Kategorie nach ihrer Rolle (Kodierleitfaden des Profils, Quellenkategorien)");
  });
});
