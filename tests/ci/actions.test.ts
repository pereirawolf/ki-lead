// Lieferkette der CI: Einbindung der GitHub Actions und Prüfung bekannter Schwachstellen.
// Grundlage: Befunddatei ki-lead-befund_technik_2026-W44.json vom 30.10.2026 (Arbeitspaket A7 „CI-Pflege“),
// TP-2026-W44-36 (Actions per Commit-SHA) und TP-2026-W44-37 (npm audit in der CI, Stufe „high“).
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";

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
  it("TP-2026-W44-36: die Workflows binden Actions ein (Wächter gegen eine leere Prüfung; seit 0.6.17 mit „Betreiberbuild“)", () => {
    expect(dateien).toEqual(["betreiberbuild.yml", "mistral-probe.yml", "pages.yml", "release.yml"]);
    expect(einbindungen.length).toBe(15);
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
});
