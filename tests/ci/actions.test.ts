// Lieferkette der CI: Einbindung der GitHub Actions und Prüfung bekannter Schwachstellen.
// Grundlage: Befunddatei ki-lead-befund_technik_2026-W44.json vom 30.10.2026 (Arbeitspaket A7 „CI-Pflege“),
// TP-2026-W44-36 (Actions per Commit-SHA) und TP-2026-W44-37 (npm audit in der CI, Stufe „high“).
// Seit 10.11.2026 (Nachtrag zu 0.7.15): Browsertests im Containerbild von Playwright, minimatch ab 11.0.1.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";

const require = createRequire(import.meta.url);

const WORKFLOWS = repoPfad(".github", "workflows");
const dateien = readdirSync(WORKFLOWS)
  .filter((n) => /\.ya?ml$/.test(n))
  .sort();

/** Alle Zeilen mit `uses:` je Workflow-Datei */
const einbindungen = dateien.flatMap((datei) =>
  readFileSync(`${WORKFLOWS}/${datei}`, "utf-8")
    .split(/\r?\n/)
    .map((zeile, i) => ({ datei, nr: i + 1, zeile }))
    .filter((z) => /^\s*(-\s+)?uses:/.test(z.zeile)),
);

describe("GitHub Actions", () => {
  it("TP-2026-W44-36: die Workflows binden Actions ein (Wächter gegen eine leere Prüfung; seit 0.6.17 mit „Betreiberbuild“, seit 10.11.2026 mit dem Job „browser“)", () => {
    expect(dateien).toEqual(["betreiberbuild.yml", "mistral-probe.yml", "pages.yml", "release.yml"]);
    expect(einbindungen.length).toBe(18);
  });

  it("TP-2026-W44-51: der Betreiberbuild startet nur von Hand, liest nur und veröffentlicht nichts", () => {
    // ohne Kommentarzeilen, die das Ausgeschlossene beim Namen nennen
    const text = readFileSync(`${WORKFLOWS}/betreiberbuild.yml`, "utf-8")
      .split(/\r?\n/)
      .filter((z) => !/^\s*#/.test(z))
      .join("\n");
    expect(text).toMatch(/^on:\n  workflow_dispatch:\n/m);
    expect(text).not.toMatch(/^\s+(push|pull_request|schedule|release):/m);
    expect(text).toMatch(/^permissions:\n  contents: read\n/m);
    expect(text).not.toMatch(/deploy-pages|upload-pages-artifact|softprops|zenodo|npm sbom|npm publish/i);
  });

  it.each(einbindungen.map((e) => [`${e.datei}:${e.nr}`, e.zeile] as const))(
    "TP-2026-W44-36: %s verweist auf einen vollständigen Commit-SHA mit Versionskommentar",
    (_stelle, zeile) => {
      expect(zeile).toMatch(/uses:\s+[\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
    },
  );

  it("TP-2026-W44-37: pages.yml prüft nach npm ci die ausgelieferten Pakete mit npm audit ab Stufe high", () => {
    const zeilen = readFileSync(`${WORKFLOWS}/pages.yml`, "utf-8").split(/\r?\n/);
    const ci = zeilen.findIndex((z) => /^\s*- run: npm ci$/.test(z));
    const audit = zeilen.findIndex((z) => /^\s*- run: npm audit --omit=dev --audit-level=high$/.test(z));
    expect(ci).toBeGreaterThanOrEqual(0);
    expect(audit).toBeGreaterThan(ci);
  });

  it("Containerbild: pages.yml führt die Browsertests im Bild von Playwright in der installierten Version aus, ohne Systempakete über apt", () => {
    // ohne Kommentarzeilen, die den früheren Weg beim Namen nennen
    const text = readFileSync(`${WORKFLOWS}/pages.yml`, "utf-8")
      .split(/\r?\n/)
      .filter((z) => !/^\s*#/.test(z))
      .join("\n");
    expect(text).toMatch(/^ {6}playwright: \$\{\{ steps\.playwright\.outputs\.version \}\}$/m);
    expect(text).toMatch(
      /^ {2}browser:\n {4}needs: pruefen\n[\s\S]*?^ {6}image: mcr\.microsoft\.com\/playwright:v\$\{\{ needs\.pruefen\.outputs\.playwright \}\}-noble$/m,
    );
    expect(text).toMatch(/^ {4}needs: \[pruefen, browser\]$/m);
    expect(text).not.toMatch(/install-deps|--with-deps|playwright install/);
  });
});

describe("Lieferkette der Entwicklungsabhängigkeiten", () => {
  it("Dependabot-Warnung #10: minimatch ab 11.0.1 (GHSA-g3hv-75wg-m249) und glob ab 14.0.2 (GHSA-3g3m-2fjr-6pw4)", () => {
    const version = (paket: string) => (require(`${paket}/package.json`) as { version: string }).version.split(".").map(Number);
    const mindestens = (ist: number[], soll: number[]) => (ist[0] !== soll[0] ? ist[0] > soll[0] : ist[1] !== soll[1] ? ist[1] > soll[1] : ist[2] >= soll[2]);
    expect(mindestens(version("minimatch"), [11, 0, 1])).toBe(true);
    expect(mindestens(version("glob"), [14, 0, 2])).toBe(true);
  });
});
