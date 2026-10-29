// Farbtoken aus einer Quelle (seit 0.6.5, TP-2026-W44-19): katalog.ts ist die einzige Farbquelle. Der CSS-Fallback für den
// Start ohne JavaScript entsteht beim Build und im Entwicklungsserver aus „Neutral · Hell“ und „Neutral · Night Mode“
// samt Signalfarben; die Stylesheets setzen keine Farbtoken mehr selbst.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";
import { FARBSCHEMAS } from "../../src/darstellung/katalog";
import { SEMANTIK } from "../../src/darstellung/thema";
import { UI_TOKENS } from "../../src/darstellung/typen";
import { FALLBACK_ID, fallbackCss, farbtokenFallback } from "../../src/darstellung/fallback";

/** Variablen eines CSS-Blocks („--name: wert;“) */
function variablen(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
}

/** Alle Stylesheets der App: styles.css und die Teildateien unter src/styles/ */
function stylesheets(): { datei: string; text: string }[] {
  const teile = readdirSync(repoPfad("src", "styles"))
    .filter((d) => d.endsWith(".css"))
    .map((d) => ({ datei: `src/styles/${d}`, text: readFileSync(repoPfad("src", "styles", d), "utf-8") }));
  return [{ datei: "src/styles.css", text: readFileSync(repoPfad("src", "styles.css"), "utf-8") }, ...teile];
}

describe("Farbtoken-Fallback aus dem Katalog", () => {
  const css = fallbackCss();
  const dunkelAb = css.indexOf("@media (prefers-color-scheme: dark)");
  const hell = variablen(css.slice(0, dunkelAb));
  const dunkel = variablen(css.slice(dunkelAb));
  const katalog = (id: string) => FARBSCHEMAS.find((s) => s.id === id)!.tokens;

  it("TP-2026-W44-19: Fallback-Tokens hell gleich „Neutral · Hell“ und den hellen Signalfarben", () => {
    for (const t of UI_TOKENS) expect(hell[t], t).toBe(katalog("neutral-hell")[t]);
    for (const [t, w] of Object.entries(SEMANTIK.hell)) expect(hell[t], t).toBe(w);
    expect(hell.papier).toBe("#F5F6F7");
  });

  it("TP-2026-W44-19: Fallback-Tokens dunkel gleich „Neutral · Night Mode“ und den dunklen Signalfarben, nur ohne gewähltes Schema", () => {
    for (const t of UI_TOKENS) expect(dunkel[t], t).toBe(katalog("neutral-dunkel")[t]);
    for (const [t, w] of Object.entries(SEMANTIK.dunkel)) expect(dunkel[t], t).toBe(w);
    expect(css.slice(dunkelAb)).toContain(":root:not([data-farbschema])");
  });

  it("TP-2026-W44-19: das Vite-Plugin setzt den Fallback als <style> in index.html", () => {
    const plugin = farbtokenFallback();
    expect(plugin.transformIndexHtml()).toEqual([{ tag: "style", attrs: { id: FALLBACK_ID }, children: css, injectTo: "head" }]);
    expect(readFileSync(repoPfad("vite.config.ts"), "utf-8")).toMatch(/plugins: \[[^\]]*farbtokenFallback\(\)/);
  });

  it("TP-2026-W44-19: die Stylesheets setzen keine Farbtoken des Katalogs selbst", () => {
    const tokens = new Set([...UI_TOKENS, ...Object.keys(SEMANTIK.hell), "band"]);
    const gesetzt = stylesheets().flatMap(({ datei, text }) =>
      Object.keys(variablen(text))
        .filter((v) => tokens.has(v))
        .map((v) => `${datei}: --${v}`),
    );
    expect(gesetzt).toEqual([]);
  });

  it("TP-2026-W44-19: jede verwendete Variable ist im Fallback oder in den Stylesheets definiert", () => {
    const alle = stylesheets()
      .map((s) => s.text)
      .join("\n");
    const definiert = new Set([...Object.keys(hell), ...Object.keys(variablen(alle))]);
    // Variablen mit eigenem Ersatzwert (var(--x, …)) gelten als definiert
    const ohneErsatz = [...alle.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]!);
    expect([...new Set(ohneErsatz.filter((v) => !definiert.has(v)))]).toEqual([]);
  });
});
