// Gestaffelte Prüfung in der CI (scripts/pruefumfang.mjs): Welche Änderungen eines Pull Requests lösen welche
// Browsertests aus? Grundsatz „im Zweifel prüfen“. Dazu Wächter, damit die Pfadlisten bei Umbenennungen nicht
// unbemerkt ins Leere laufen. Grundlage: Vorschläge zur Konsolidierung der Tests vom 24.10.2026.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error: reines ES-Modul ohne Typdeklaration
import { NUR_INHALT, PWA, pruefumfang } from "../../scripts/pruefumfang.mjs";
import { REPO, repoPfad } from "../support/dateien";

const KEINE = { kern: false, pwa: false };
const NUR_KERN = { kern: true, pwa: false };
const ALLE = { kern: true, pwa: true };

describe("Prüfumfang je Änderung", () => {
  it.each([
    ["SOP-Teil", ["profile/lead-beispiel/sop/teil-b/B01.md"], KEINE],
    ["Quellenregister der SOP", ["profile/lead-beispiel/sop/quellenregister.json"], KEINE],
    ["Arbeitsanweisung und Kodierleitfaden", ["profile/lead-beispiel/anweisung-erfassung.md", "profile/lead-beispiel/kodierleitfaden.md"], KEINE],
    ["Profil-Changelog", ["profile/muster/CHANGELOG.md"], KEINE],
    ["Dokumentation und Changelog", ["docs/TESTS.md", "CHANGELOG.md", "README.md"], KEINE],
    ["Bewertungsfälle", ["evaluation/faelle/f01.json", "evaluation/README.md"], KEINE],
    ["Vorlage für Issues", [".github/ISSUE_TEMPLATE/barrierefreiheit.yml"], KEINE],
    ["Bedienoberfläche aus dem Profil", ["profile/lead-beispiel/meldung.ui.json"], NUR_KERN],
    ["Schema des Profils", ["profile/lead-beispiel/meldung.schema.json"], NUR_KERN],
    ["Manifest des Profils", ["profile/lead-beispiel/profil.json"], NUR_KERN],
    ["Beispielmeldungen des Profils", ["profile/lead-beispiel/beispiele/ilka.json"], NUR_KERN],
    ["unbekannte Datei im Profil", ["profile/lead-beispiel/neu.yaml"], NUR_KERN],
    ["Komponente der Oberfläche", ["src/ui/Lagebild.tsx"], NUR_KERN],
    ["Unit-Test", ["tests/kern/zeit.test.ts"], NUR_KERN],
    ["Kern-Browsertest", ["tests/browser/hauptablauf.spec.ts"], NUR_KERN],
    ["Inhalt und Code gemischt", ["profile/lead-beispiel/sop/teil-b/B01.md", "src/kern/zeit.ts"], NUR_KERN],
    ["Service Worker", ["src/pwa/sw-vorlage.js"], ALLE],
    ["App-Rahmen", ["src/App.tsx"], ALLE],
    ["Startprüfung", ["public/start-pruefung.js"], ALLE],
    ["Build-Konfiguration", ["vite.config.ts"], ALLE],
    ["Abhängigkeiten", ["package-lock.json"], ALLE],
    ["PWA-Browsertest", ["tests/browser/pwa-update.spec.ts"], ALLE],
    ["Workflow", [".github/workflows/pages.yml"], ALLE],
    ["dieses Skript", ["scripts/pruefumfang.mjs"], ALLE],
    ["leere Liste (Basis nicht ermittelbar)", [], ALLE],
    ["nur Leerzeilen", ["", "  "], ALLE],
  ])("%s", (_name, dateien, soll) => {
    expect(pruefumfang(dateien)).toEqual(soll);
  });

  it("Aufruf als Skript liest die Standardeingabe und schreibt Zeilen für GITHUB_OUTPUT", () => {
    const aus = execFileSync(process.execPath, [repoPfad("scripts", "pruefumfang.mjs")], {
      input: "docs/TESTS.md\nprofile/lead-beispiel/meldung.ui.json\n",
      encoding: "utf-8",
    });
    expect(aus).toBe("kern=true\npwa=false\n");
  });

  it("Aufruf als Skript gelingt auch aus einem Pfad mit Leerzeichen und Umlaut und über eine symbolische Verknüpfung", () => {
    const ordner = mkdtempSync(join(tmpdir(), "Prüf umfang "));
    try {
      const kopie = join(ordner, "prüf umfang.mjs");
      copyFileSync(repoPfad("scripts", "pruefumfang.mjs"), kopie);
      const verknuepfung = join(ordner, "verknüpfung.mjs");
      symlinkSync(kopie, verknuepfung);
      for (const pfad of [kopie, verknuepfung])
        expect(execFileSync(process.execPath, [pfad], { input: "src/pwa/precache.ts\n", encoding: "utf-8" }), pfad).toBe("kern=true\npwa=true\n");
    } finally {
      rmSync(ordner, { recursive: true, force: true });
    }
  });
});

/** Alle Dateien unter einem Ordner, relativ zur Repositorywurzel */
function dateienUnter(ordner: string): string[] {
  const out: string[] = [];
  const lauf = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) lauf(p);
      else out.push(relative(REPO, p).split("\\").join("/"));
    }
  };
  lauf(repoPfad(ordner));
  return out;
}

describe("Wächter der Pfadlisten", () => {
  it("jede einzeln genannte Datei der PWA-Liste existiert", () => {
    const einzeln = (PWA as RegExp[])
      .map((m) => m.source)
      .filter((s) => /^\^[\w/\\.-]+\$$/.test(s) && !s.includes("("))
      .map((s) => s.slice(1, -1).replace(/\\(.)/g, "$1"));
    expect(einzeln.length).toBeGreaterThan(5);
    for (const pfad of einzeln) expect(existsSync(repoPfad(pfad)), pfad).toBe(true);
  });

  it("jede Quelldatei, die den Service Worker anspricht oder den Startfehler zeigt, löst die PWA-Browsertests aus", () => {
    const betroffen = dateienUnter("src").filter((d) => /serviceWorker|ki-lead-startfehler|Eine neue Fassung/.test(readFileSync(repoPfad(d), "utf-8")));
    expect(betroffen.length).toBeGreaterThan(0);
    for (const d of betroffen.filter((d) => !d.endsWith(".css"))) expect(pruefumfang([d]).pwa, d).toBe(true);
  });

  it("jeder Browsertest mit „pwa“ im Namen löst die PWA-Browsertests aus, jeder andere nur die Kern-Browsertests", () => {
    const specs = dateienUnter("tests/browser").filter((d) => d.endsWith(".spec.ts"));
    expect(specs.length).toBeGreaterThan(5);
    for (const d of specs) expect(pruefumfang([d]), d).toEqual(/\/pwa[^/]*\.spec\.ts$/.test(d) ? ALLE : NUR_KERN);
  });

  it("keine Datei unter src/, public/ oder tests/ gilt als reiner Inhalt", () => {
    for (const d of [...dateienUnter("src"), ...dateienUnter("public"), ...dateienUnter("tests")])
      expect(
        (NUR_INHALT as RegExp[]).some((m) => m.test(d)),
        d,
      ).toBe(false);
  });
});
