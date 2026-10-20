// Barrierefreiheit der Darstellung: Radarwerte als Text, Auswahl nicht nur über Farbe, Systemfarben (forced-colors).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RadarGrafik } from "../src/ui/Radar";

const css = readFileSync(join(__dirname, "../src/styles.css"), "utf8");
/** Regelblock eines Selektors (erster Treffer) */
const regel = (selektor: string, quelle = css) => {
  const i = quelle.indexOf(`${selektor} {`);
  expect(i, selektor).toBeGreaterThanOrEqual(0);
  return quelle.slice(i, quelle.indexOf("}", i));
};

describe("Lagenradar", () => {
  it("nennt alle Achsenwerte im zugänglichen Namen, auch „offen“", () => {
    const def = {
      max: 4,
      achsen: [
        { key: "d1", label: "D1 Gefahrenlage" },
        { key: "d2", label: "D2 Versorgung" },
        { key: "d3", label: "D3 Kommunikation" },
      ],
    };
    const html = renderToStaticMarkup(React.createElement(RadarGrafik, { def: def as never, wert: { d1: 2, d2: null, d3: 0 } }));
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Lagenradar: D1 Gefahrenlage: 2 von 4; D2 Versorgung: offen; D3 Kommunikation: 0 von 4"');
  });
});

describe("Stylesheet", () => {
  it("ausgewählte Navigation, Reiter und Stufen sind auch ohne Farbe erkennbar", () => {
    for (const s of [".nav.aktiv", ".lb-reiter .segment.aktiv", ".stufe.aktiv"]) expect(regel(s), s).toMatch(/text-decoration: underline/);
    expect(regel(".segment.an")).toMatch(/font-weight: 700[\s\S]*text-decoration: underline/);
  });

  it("Systemfarben: Auswahl über Highlight, kein Farbverlauf im Band, Radar in Systemfarben", () => {
    const i = css.indexOf("@media (forced-colors: active)");
    expect(i).toBeGreaterThan(0);
    const block = css.slice(i);
    expect(block).toMatch(/\.kopf,\s*\.farb-vorschau-kopf \{\s*border-image: none;/);
    expect(block).toMatch(/\.stufe\.aktiv,[\s\S]*?background: Highlight;[\s\S]*?color: HighlightText;/);
    expect(regel(".radar-flaeche", block)).toMatch(/fill: none/);
    // gewählte Bewertungen (.segment.an.wert-…) dürfen die Systemhervorhebung nicht überstimmen
    expect(block).toMatch(/\.segmente \.segment\.an,/);
    expect(regel(".lb-balken-wert", block)).toMatch(/background: CanvasText/);
    // keine globale Abschaltung der Systemfarben
    expect(css).not.toMatch(/(html|body|:root|\*)\s*\{[^}]*forced-color-adjust:\s*none/);
  });

  it("Kontrastschemata verstärken Konturen", () => {
    expect(css).toMatch(/\[data-kontrast="erhoeht"\] textarea \{\s*border-width: 2px;/);
    expect(regel('[data-kontrast="erhoeht"] .lb-flag')).toMatch(/border: 1px solid currentColor/);
    expect(regel('[data-kontrast="erhoeht"] .segment.an')).toMatch(/inset 0 0 0 2px currentColor/);
    // „linie-zart“ ist im Kontrastschema eine Konturfarbe; Text darauf wäre unter 3:1
    expect(regel('[data-kontrast="erhoeht"] .schritt-zahl')).toMatch(/background: var\(--papier\)/);
  });
});
