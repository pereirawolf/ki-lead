// Farbtoken für den Start ohne JavaScript (seit 0.6.5, TP-2026-W44-19). katalog.ts ist die einzige Farbquelle: Das
// Vite-Plugin `farbtokenFallback()` (vite.config.ts) setzt diese Regeln im Entwicklungsserver und im Build als <style>
// in index.html. Sie gelten nur, bis main.tsx ein Farbschema anwendet (Inline-Stil am Wurzelelement geht vor).
// Bis 0.6.4 stand in styles.css eine eigene Palette („Lagekartenpapier“, Papier #eef1ee), die vom Katalog abwich.

import { aufloesen } from "./thema.ts";

/** Kennung des <style>-Elements in index.html */
export const FALLBACK_ID = "ki-lead-farbtoken";

/** Farbtoken eines Modus: „Neutral · Hell“ bzw. „Neutral · Night Mode“ samt Signalfarben und Band, wie die App sie anwendet */
export function fallbackTokens(modus: "hell" | "dunkel"): Record<string, string> {
  return aufloesen(modus === "hell" ? "neutral-hell" : "neutral-dunkel").tokens;
}

const zeilen = (t: Record<string, string>, einzug: string) =>
  Object.entries(t)
    .map(([k, v]) => `${einzug}--${k}: ${v};`)
    .join("\n");

/** CSS des Fallbacks: hell als Vorgabe, dunkel bei Systemeinstellung dunkel, solange kein Farbschema gewählt ist */
export function fallbackCss(): string {
  return [
    "/* Erzeugt aus src/darstellung/katalog.ts (neutral-hell, neutral-dunkel); nicht von Hand ändern */",
    ":root {",
    zeilen(fallbackTokens("hell"), "  "),
    "  color-scheme: light;",
    "}",
    "@media (prefers-color-scheme: dark) {",
    "  :root:not([data-farbschema]) {",
    zeilen(fallbackTokens("dunkel"), "    "),
    "    color-scheme: dark;",
    "  }",
    "}",
  ].join("\n");
}

/** Vite-Plugin ohne Abhängigkeit von Vite: setzt den Fallback ans Ende des Kopfs von index.html (nach meta charset) */
export function farbtokenFallback(): {
  name: string;
  transformIndexHtml: () => { tag: string; attrs: Record<string, string>; children: string; injectTo: "head" }[];
} {
  return {
    name: "ki-lead-farbtoken-fallback",
    transformIndexHtml: () => [{ tag: "style", attrs: { id: FALLBACK_ID }, children: fallbackCss(), injectTo: "head" }],
  };
}
