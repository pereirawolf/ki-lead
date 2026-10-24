// Mehrfachvergleich mehrerer Kodierungen derselben Lage (Befund LS-2026-W43-04, 24.10.2026).
// Liest LEAD-Meldungen aus einem lokalen Ordner und gibt je Sachverhalt und Achse Kennzahlen aus, dazu
// Krippendorffs Alpha (ordinal) je Achse über alle Sachverhalte als Einheiten. Keine KI-Aufrufe.
//
// Aufruf: npm run vergleich:mehrfach -- <ordner> [--profil lead-beispiel] [--fall <fall-id>]
//   <ordner>   JSON-Meldungen einer Lage; enthält er Unterordner, gilt jeder Unterordner als eigene Lage und
//              Alpha wird über die Sachverhalte aller Lagen gebildet. Die erste Meldung (nach Dateinamen) ist Bezug.
//   --profil   Profil unter profile/ oder privat/profile/ (Vorgabe lead-beispiel)
//   --fall     Bewertungsfall unter evaluation/faelle/, dessen erwartungen.radar mit ausgewertet wird
//
// Meldungen und Laufprotokolle gehören nicht ins Repository (docs/ERPROBUNG.md, Abschnitt 6); der Ordner liegt
// deshalb in der Regel unter privat/ oder außerhalb des Repositorys.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const ordner = args.find((a, i) => !a.startsWith("--") && !["--profil", "--fall"].includes(args[i - 1]));
if (!ordner || !existsSync(ordner)) {
  console.error("Aufruf: npm run vergleich:mehrfach -- <ordner> [--profil lead-beispiel] [--fall <fall-id>]");
  process.exit(2);
}

const lade = async (pfad) => (await runnerImport(join(REPO, pfad), { configFile: false, logLevel: "error" })).module;
const { ladeProfil } = await lade("src/profil/laden.ts");
const { migriere } = await lade("src/kern/migration.ts");
const { vergleicheMehrere, krippendorffAlphaOrdinal } = await lade("src/pipeline/vergleich.ts");

function leseOrdner(dir) {
  const out = {};
  const lauf = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) lauf(p);
      else if (/\.(json|md)$/.test(name)) out[relative(dir, p)] = readFileSync(p, "utf-8");
    }
  };
  lauf(dir);
  return out;
}

const profilName = option("--profil") || "lead-beispiel";
const profilOrdner = [join(REPO, "profile", profilName), join(REPO, "privat", "profile", profilName)].find(existsSync);
if (!profilOrdner) {
  console.error(`Profil „${profilName}“ nicht gefunden.`);
  process.exit(2);
}
const { profil, befunde } = await ladeProfil(leseOrdner(profilOrdner));
if (!profil) {
  console.error(`Profil „${profilName}“ nicht ladbar: ${JSON.stringify(befunde, null, 2)}`);
  process.exit(2);
}

let erwartung;
const fallId = option("--fall");
if (fallId) {
  const fallPfad = join(REPO, "evaluation", "faelle", `${fallId}.json`);
  if (!existsSync(fallPfad)) {
    console.error(`Fall „${fallId}“ nicht gefunden.`);
    process.exit(2);
  }
  erwartung = JSON.parse(readFileSync(fallPfad, "utf-8")).erwartungen.radar;
  if (!erwartung) console.warn(`Hinweis: Fall „${fallId}“ enthält keine erwarteten Radarwerte.`);
}

const jsonIn = (d) =>
  readdirSync(d)
    .filter((n) => n.endsWith(".json"))
    .sort()
    .map((n) => join(d, n));
const unterordner = readdirSync(ordner)
  .sort()
  .map((n) => join(ordner, n))
  .filter((p) => statSync(p).isDirectory());
const lagen = unterordner.length
  ? unterordner.map((d) => ({ name: relative(ordner, d), dateien: jsonIn(d) }))
  : [{ name: basename(ordner), dateien: jsonIn(ordner) }];
if (fallId && lagen.length > 1) console.warn("Hinweis: --fall gilt für jede Lage; bei mehreren Lagen meist nicht gemeint.");

const zahl = (x) => (x === null || x === undefined ? "–" : Number.isInteger(x) ? String(x) : x.toFixed(2).replace(".", ","));
const zeile = (zellen) => `| ${zellen.join(" | ")} |`;
const einheiten = new Map();

for (const lage of lagen) {
  const meldungen = lage.dateien.map((d) => {
    const m = migriere(JSON.parse(readFileSync(d, "utf-8")), profil);
    if (!m.bekannt) console.warn(`Hinweis: ${basename(d)} hat ein unbekanntes Schema (${m.herkunft}).`);
    return m.daten;
  });
  const v = vergleicheMehrere(meldungen, profil, erwartung);
  console.log(`\n## ${lage.name}\n\n${v.meldungen} Meldungen, Bezug: ${lage.dateien[0] ? basename(lage.dateien[0]) : "–"}`);
  if (v.ohneGegenstueck) console.log(`${v.ohneGegenstueck} Sachverhalte ohne Gegenstück in der Bezugsmeldung`);
  for (const g of v.gruppen) {
    const mitSoll = g.achsen.some((a) => a.imSoll !== undefined);
    console.log(`\n### ${g.bezeichnung || "(ohne Bezeichnung)"} – ${g.kodierungen} Kodierungen\n`);
    console.log(zeile(["Achse", "Werte", "mit Wert", "offen", "Median", "Spannweite", "Paare ≤ 1 Stufe", ...(mitSoll ? ["im Soll"] : [])]));
    console.log(zeile(["---", "---", "---:", "---:", "---:", "---", "---:", ...(mitSoll ? ["---:"] : [])]));
    for (const a of g.achsen) {
      const spanne = a.min === null ? "–" : a.min === a.max ? String(a.min) : `${a.min}–${a.max}`;
      const soll = mitSoll ? [a.imSoll === undefined ? "–" : `${a.imSoll}/${g.kodierungen}`] : [];
      console.log(
        zeile([
          a.label,
          a.werte.map((w) => (w === null ? "U" : w)).join(" "),
          a.n,
          a.offen,
          zahl(a.median),
          spanne,
          a.paare ? `${a.nah}/${a.paare}` : "–",
          ...soll,
        ]),
      );
      const liste = einheiten.get(a.key) || { label: a.label, werte: [] };
      liste.werte.push(a.werte);
      einheiten.set(a.key, liste);
    }
  }
}

console.log("\n## Krippendorffs Alpha (ordinal) je Achse\n");
console.log(
  "Einheiten sind die Sachverhalte (aller Lagen) mit mindestens zwei Werten. Bei wenigen Einheiten ist der Wert unsicher; ohne zwei solche Einheiten oder ohne Streuung entfällt er.\n",
);
console.log(zeile(["Achse", "Alpha", "Einheiten"]));
console.log(zeile(["---", "---:", "---:"]));
for (const { label, werte } of einheiten.values()) {
  const n = werte.filter((e) => e.filter((w) => w !== null).length >= 2).length;
  console.log(zeile([label, zahl(krippendorffAlphaOrdinal(werte)), n]));
}
