// Liste der Dateien, die der Service Worker der PWA bei der Installation vorhält, und deren Version.
// Läuft beim Build (vite.config.ts) und in den Tests, nicht im Browser.

/** Dateien, die nicht vorgehalten werden: Quellkarten, der Service Worker selbst, Lizenz- und Hilfsdateien */
const AUSSCHLUSS = [/\.map$/, /^sw\.js$/, /(^|\/)\.[^/]+$/, /\.txt$/];

/**
 * Sortierte, eindeutige Liste relativer Pfade (ohne führenden Schrägstrich), wie sie der Build erzeugt.
 * `index.html` ist immer dabei, weil die App offline von dort startet.
 */
export function precacheListe(dateien: string[]): string[] {
  const relativ = dateien.map((d) => d.replace(/^\.?\//, "")).filter((d) => d && !AUSSCHLUSS.some((m) => m.test(d)));
  return [...new Set(["index.html", ...relativ])].sort();
}

/**
 * Version des Caches: App-Version plus kurze Prüfsumme über die Dateinamen. Da Vite Inhalte mit Hash im Dateinamen
 * ausliefert, ändert sich die Prüfsumme mit jedem Build, dessen Inhalt sich ändert (FNV-1a, 32 Bit).
 */
export function precacheVersion(appVersion: string, liste: string[], inhalte: Record<string, string> = {}): string {
  let h = 0x811c9dc5;
  for (const zeichen of liste.map((d) => `${d}\n${inhalte[d] ?? ""}`).join("\n")) {
    h ^= zeichen.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${appVersion}-${h.toString(16).padStart(8, "0")}`;
}

/** Quelltext des Service Workers mit eingesetzter Liste und Version */
export function serviceWorkerQuelle(vorlage: string, version: string, liste: string[]): string {
  return vorlage.replace('"__VERSION__"', JSON.stringify(version)).replace('["__DATEIEN__"]', JSON.stringify(liste));
}
