// Auswertung mehrerer Vergleichsläufe Ilka (Befund AV-2026-W43-04, 24.10.2026). Liest die ZIP-Dateien aus
// „Einstellungen → Testläufe“, bis 0.5.16 „Vergleichslauf Ilka“ (oder entpackte Ordner bzw. reihe.json-Dateien),
// fasst sie je Konfiguration zusammen und stellt jede Konfiguration dem Bezug gegenüber. Keine KI-Aufrufe.
//
// Aufruf: npm run vergleichslauf:auswerten -- <datei.zip | ordner | reihe.json> … [--bezug <kennung>] [--md <datei>] [--json <datei>]
//   --bezug  Kennung der Bezugskonfiguration (Plan-Variante, z. B. A-anthropic-standard); Vorgabe: Standard-Profil Anthropic
//   --md     Bericht zusätzlich als Markdown-Datei schreiben
//   --json   Auswertung als JSON schreiben
//
// Laufprotokolle und Entwürfe gehören nicht ins Repository (docs/ERPROBUNG.md, Abschnitt 6); Ergebnisberichte
// ohne Rohdaten können unter evaluation/abnahmen/ abgelegt werden.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";
import JSZip from "jszip";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const OPTIONEN = ["--bezug", "--md", "--json"];
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const quellen = args.filter((a, i) => !a.startsWith("--") && !OPTIONEN.includes(args[i - 1]));
if (!quellen.length) {
  console.error("Aufruf: npm run vergleichslauf:auswerten -- <datei.zip | ordner | reihe.json> … [--bezug <kennung>] [--md <datei>] [--json <datei>]");
  process.exit(2);
}

async function reihenAus(pfad) {
  if (!existsSync(pfad)) throw new Error(`nicht gefunden: ${pfad}`);
  if (statSync(pfad).isDirectory()) {
    const out = [];
    for (const name of readdirSync(pfad).sort()) {
      const p = join(pfad, name);
      if (statSync(p).isDirectory() || /\.zip$/i.test(name) || name === "reihe.json" || /^reihe-.*\.json$/.test(name)) out.push(...(await reihenAus(p)));
    }
    return out;
  }
  if (/\.zip$/i.test(pfad)) {
    const zip = await JSZip.loadAsync(readFileSync(pfad));
    const datei = zip.file("reihe.json");
    if (!datei) throw new Error(`${pfad}: keine reihe.json`);
    return [JSON.parse(await datei.async("string"))];
  }
  return [JSON.parse(readFileSync(pfad, "utf-8"))];
}

const reihen = [];
for (const q of quellen) reihen.push(...(await reihenAus(q)));
const falsch = reihen.filter((r) => r?.format !== "ki-lead-abnahme/1");
if (falsch.length) {
  console.error(`${falsch.length} Datei(en) ohne Format ki-lead-abnahme/1`);
  process.exit(1);
}

const { auswerten, berichtMarkdown } = (await runnerImport(join(REPO, "src/pipeline/vergleichsauswertung.ts"), { configFile: false, logLevel: "error" }))
  .module;
const ergebnis = auswerten(reihen, option("--bezug"));
const bericht = berichtMarkdown(ergebnis);
console.log(bericht);
if (option("--md")) writeFileSync(option("--md"), bericht + "\n");
if (option("--json")) writeFileSync(option("--json"), JSON.stringify(ergebnis, null, 2));
