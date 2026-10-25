// Prüfumfang eines Pull Requests: Welche Browsertests braucht eine Änderung? (siehe docs/TESTS.md, „Gestaffelte Prüfung“)
//
// Aufruf in der CI:  git diff --name-only BASIS...HEAD | node scripts/pruefumfang.mjs >> "$GITHUB_OUTPUT"
// Ausgabe:           kern=true|false und pwa=true|false, je eine Zeile
//
// Grundsatz „im Zweifel prüfen“: Die Kern-Browsertests entfallen nur, wenn JEDE geänderte Datei auf der Liste reiner
// Inhalte steht (Dokumentation, Bewertungsfälle, SOP und Markdown-Texte der Profile) und nicht in die App eingebettet
// ist. Jede andere oder unbekannte Datei löst sie aus. Die PWA-Browsertests laufen, wenn eine Datei des PWA-Mechanismus oder der Testumgebung betroffen ist.
// Eine leere oder nicht ermittelbare Dateiliste löst alles aus. Auf main, im Wochenlauf und bei manuellem Start läuft
// ohnehin alles; dieses Skript wirkt nur auf Pull Requests.

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Reine Inhalte: ändern weder Programmcode noch Bedienoberfläche des Builds */
export const NUR_INHALT = [
  /^docs\//,
  /^evaluation\//,
  /^[^/]+\.md$/, // README.md, CHANGELOG.md
  /^CITATION\.cff$/,
  /^LICENSE(-CONTENT|-CC0)?$/,
  /^\.github\/ISSUE_TEMPLATE\//,
  /^profile\/[^/]+\/sop\//, // SOP-Sammelmappe, Quellenregister
  /^profile\/[^/]+\/[^/]+\.md$/, // Arbeitsanweisungen, Kodierleitfaden, Profil-Changelog
];

/**
 * Ausnahmen von NUR_INHALT: Dateien unter evaluation/, die die App einbettet (Vergleichslauf Ilka, seit 0.5.12 auch
 * Musterfassung und Zuschnitt, seit 0.5.13 Plan des Prüffalls Reparatur). Ein Wächter in tests/ci/pruefumfang.test.ts
 * prüft, dass jeder Import aus evaluation/ unter src/ hier steht und jede Regel mindestens einen Import trifft.
 */
export const IN_DER_APP = [
  /^evaluation\/faelle\/(orkantief-ilka-verdichtung|ilka-management-summary)\.json$/,
  /^evaluation\/plaene\/(standardprofile-ilka|anbietermix-ilka|s2-isoliert-ilka|management-summary-ilka|reparatur-ilka)\.json$/,
  /^evaluation\/material\/(ilka-musterfassung|ilka-s1-zuschnitt-a)\.json$/,
];

/** PWA-Mechanismus und alles, wovon die PWA-Browsertests unmittelbar abhängen */
export const PWA = [
  /^src\/pwa\//,
  /^src\/main\.tsx$/,
  /^src\/App\.tsx$/,
  /^src\/ui\/PwaHinweis\.tsx$/,
  /^public\//,
  /^index\.html$/,
  /^vite\.config\.ts$/,
  /^tsconfig\.json$/,
  /^package(-lock)?\.json$/,
  /^playwright\.config\.ts$/,
  /^tests\/browser\/(pwa[^/]*|hilfen\.ts|fixtures\/.*)$/,
  /^\.github\/workflows\//,
  /^scripts\/pruefumfang\.mjs$/,
];

/**
 * @param {string[]} dateien geänderte Pfade relativ zur Repositorywurzel
 * @returns {{ kern: boolean, pwa: boolean }}
 */
export function pruefumfang(dateien) {
  const liste = dateien.map((d) => d.trim()).filter(Boolean);
  if (liste.length === 0) return { kern: true, pwa: true };
  const passt = (muster, d) => muster.some((m) => m.test(d));
  return {
    kern: liste.some((d) => !passt(NUR_INHALT, d) || passt(IN_DER_APP, d)),
    pwa: liste.some((d) => passt(PWA, d)),
  };
}

// Als Skript: Dateiliste von der Standardeingabe lesen. Vergleich über realpath und Datei-URL, damit Pfade mit
// Leerzeichen, Umlauten oder symbolischen Verknüpfungen den Aufruf nicht still ins Leere laufen lassen.
const alsSkript = (() => {
  try {
    return !!process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
})();
if (alsSkript) {
  let eingabe = "";
  process.stdin.setEncoding("utf-8");
  for await (const teil of process.stdin) eingabe += teil;
  const { kern, pwa } = pruefumfang(eingabe.split("\n"));
  process.stdout.write(`kern=${kern}\npwa=${pwa}\n`);
}
