// PWA (Meilenstein 5): Dateiliste und Version des Service Workers, Bedingungen der Anmeldung, Hinweise der Oberfläche,
// Manifest und Symbole. Der Offline-Start selbst wird im Browsertest geprüft (tests/browser/pwa.spec.ts).
import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fehlendeVerweise, htmlVerweise, precacheListe, precacheVersion, serviceWorkerQuelle } from "../../src/pwa/precache";
import { serviceWorkerMoeglich } from "../../src/pwa/registrieren";
import { PwaHinweis } from "../../src/ui/PwaHinweis";
import { repoPfad } from "../support/dateien";

describe("PWA: Dateiliste und Version des Service Workers", () => {
  it("hält alle ausgelieferten Dateien vor, ohne Quellkarten und ohne sich selbst", () => {
    const liste = precacheListe([
      "assets/index-ab12cd34.js",
      "assets/index-ab12cd34.js.map",
      "sw.js",
      "./manifest.webmanifest",
      "/icons/icon-192.png",
      "assets/index-ab12cd34.js",
    ]);
    expect(liste).toEqual(["assets/index-ab12cd34.js", "icons/icon-192.png", "index.html", "manifest.webmanifest"]);
  });

  it("ändert die Version mit Dateinamen oder Inhalt ungehashter Dateien, sonst nicht", () => {
    const liste = ["assets/a-11111111.js", "index.html"];
    const v = precacheVersion("0.5.0", liste, { "index.html": "<html>1" });
    expect(v).toMatch(/^0\.5\.0-[0-9a-f]{8}$/);
    expect(precacheVersion("0.5.0", liste, { "index.html": "<html>1" })).toBe(v);
    expect(precacheVersion("0.5.0", liste, { "index.html": "<html>2" })).not.toBe(v);
    expect(precacheVersion("0.5.0", ["assets/a-22222222.js", "index.html"], { "index.html": "<html>1" })).not.toBe(v);
    expect(precacheVersion("0.5.1", liste, { "index.html": "<html>1" })).not.toBe(v);
  });

  it("setzt Version und Liste in die Vorlage ein; das Ergebnis ist gültiges JavaScript", () => {
    const vorlage = readFileSync(repoPfad("src", "pwa", "sw-vorlage.js"), "utf-8");
    const quelle = serviceWorkerQuelle(vorlage, "0.5.0-deadbeef", ["index.html", "assets/a-11111111.js"]);
    expect(quelle).toContain('const VERSION = "0.5.0-deadbeef";');
    expect(quelle).toContain('const DATEIEN = ["index.html","assets/a-11111111.js"];');
    expect(quelle).not.toContain("__VERSION__");
    expect(quelle).not.toContain("__DATEIEN__");
    expect(() => new Function(quelle)).not.toThrow();
  });

  it("fängt nur eigene GET-Anfragen ab, nie die KI-Anbieter", () => {
    const vorlage = readFileSync(repoPfad("src", "pwa", "sw-vorlage.js"), "utf-8");
    expect(vorlage).toContain('if (anfrage.method !== "GET") return;');
    expect(vorlage).toContain("url.origin !== self.location.origin");
    // Kein automatischer Wechsel der Fassung: nur auf Wunsch der Person
    const install = vorlage.slice(vorlage.indexOf('addEventListener("install"'), vorlage.indexOf('addEventListener("activate"'));
    expect(install).toContain("addAll");
    // Sofortige Übernahme nur, wenn die bisherige Fassung beschädigt ist (0.5.2)
    expect(install.match(/skipWaiting/g)).toHaveLength(1);
    expect(install).toContain("if (await aeltereBeschaedigt()) await self.skipWaiting();");
  });
});

describe("PWA: Anmeldung und Hinweise", () => {
  it("meldet den Service Worker nur im Produktionsbuild, im sicheren Kontext und nicht nativ an", () => {
    const basis = { prod: true, sicher: true, unterstuetzt: true, nativ: false };
    expect(serviceWorkerMoeglich(basis)).toBe(true);
    expect(serviceWorkerMoeglich({ ...basis, prod: false })).toBe(false);
    expect(serviceWorkerMoeglich({ ...basis, sicher: false })).toBe(false);
    expect(serviceWorkerMoeglich({ ...basis, unterstuetzt: false })).toBe(false);
    expect(serviceWorkerMoeglich({ ...basis, nativ: true })).toBe(false);
  });

  it("zeigt Hinweise nur bei fehlendem Netz oder bereitstehender Fassung", () => {
    const html = (offline: boolean, aktualisierung: boolean) => renderToStaticMarkup(createElement(PwaHinweis, { zustand: { offline, aktualisierung } }));
    expect(html(false, false)).toBe("");
    expect(html(true, false)).toContain("Ohne Netzverbindung");
    expect(html(true, false)).toContain("brauchen eine Verbindung");
    expect(html(false, true)).toContain("neue Fassung");
    expect(html(false, true)).toContain("Neu laden");
    expect(html(false, true)).not.toContain("Ohne Netzverbindung");
  });
});

describe("PWA: Manifest und Symbole", () => {
  const manifest = JSON.parse(readFileSync(repoPfad("public", "manifest.webmanifest"), "utf-8"));

  it("ist installierbar beschrieben: relativer Start und Bereich, eigenständige Anzeige, Symbole 192 und 512", () => {
    expect(manifest).toMatchObject({ short_name: "KI-LEAD", start_url: "./", scope: "./", display: "standalone", lang: "de" });
    const groessen = manifest.icons.map((i: any) => i.sizes);
    expect(groessen).toContain("192x192");
    expect(groessen).toContain("512x512");
    expect(manifest.icons.some((i: any) => i.purpose === "maskable")).toBe(true);
    for (const i of manifest.icons) expect(existsSync(repoPfad("public", i.src)), i.src).toBe(true);
  });

  it("bindet Manifest und Symbole in index.html ein", () => {
    const html = readFileSync(repoPfad("index.html"), "utf-8");
    expect(html).toContain('<link rel="manifest" href="./manifest.webmanifest" />');
    expect(html).toContain('rel="apple-touch-icon"');
    for (const m of html.matchAll(/href="\.\/(icons\/[^"]+)"/g)) expect(existsSync(repoPfad("public", m[1])), m[1]).toBe(true);
  });
});

/** Quelltext ohne Zeilenkommentare (Kommentare dürfen die Begriffe erklären) */
const ohneKommentare = (code: string) => code.replace(/^\s*\/\/.*$/gm, "");

describe("PWA: stimmige Fassung beim Update (0.5.2, Startfehler nach 0.5.1)", () => {
  const vorlage = readFileSync(repoPfad("src", "pwa", "sw-vorlage.js"), "utf-8");

  it("lädt bei der Installation am HTTP-Cache vorbei", () => {
    expect(vorlage).toContain('new Request(adresse(d), { cache: "reload" })');
  });

  it("erkennt die Verweise einer index.html und meldet Dateien außerhalb der Liste", () => {
    const html =
      '<link rel="manifest" href="./manifest.webmanifest" /><script src="./start-pruefung.js"></script><script type="module" crossorigin src="./assets/index-ALT.js"></script><link rel="stylesheet" href="./assets/index-X.css"><a href="https://example.org/">x</a>';
    expect(htmlVerweise(html)).toEqual(["manifest.webmanifest", "start-pruefung.js", "assets/index-ALT.js", "assets/index-X.css"]);
    expect(fehlendeVerweise(html, ["manifest.webmanifest", "start-pruefung.js", "assets/index-NEU.js", "assets/index-X.css"])).toEqual(["assets/index-ALT.js"]);
    // Der Service Worker verwendet dieselbe Regel
    expect(vorlage).toContain('html.matchAll(/(?:src|href)="\\.\\/([^"?#]+)"/g)');
  });

  it("verwirft eine unstimmige Installation, statt sie zu übernehmen", () => {
    const install = vorlage.slice(vorlage.indexOf('addEventListener("install"'), vorlage.indexOf('addEventListener("activate"'));
    expect(install).toMatch(
      /if \(fremd\.length \|\| !\(await stimmig\(cache\)\)\) \{\s*\/\/[^\n]*\n[^\n]*\n\s*await caches\.delete\(CACHE\);\s*throw new Error/,
    );
  });

  it("berührt nur eigene Caches und nie IndexedDB oder localStorage; die Reparaturseite wird nie ersetzt", () => {
    expect(ohneKommentare(vorlage)).not.toMatch(/indexedDB|localStorage/);
    expect(vorlage).toContain("n.startsWith(PRAEFIX) && n !== CACHE");
    expect(vorlage).toContain("url.pathname.endsWith(`/${REPARATUR}`)");
  });

  it("der Build verweist in index.html nur auf vorgehaltene Dateien und lädt die Startprüfung ohne Inline-Skript", () => {
    const html = readFileSync(repoPfad("index.html"), "utf-8");
    expect(html).toContain('<script src="./start-pruefung.js"></script>');
    expect(html).not.toMatch(/<script>(?!<\/script>)/);
    for (const d of ["start-pruefung.js", "reparatur.html", "reparatur.js"]) expect(existsSync(repoPfad("public", d)), d).toBe(true);
  });
});

describe("Reparaturseite und Startprüfung", () => {
  const seite = readFileSync(repoPfad("public", "reparatur.html"), "utf-8");
  const skript = readFileSync(repoPfad("public", "reparatur.js"), "utf-8");
  const pruefung = readFileSync(repoPfad("public", "start-pruefung.js"), "utf-8");

  it("ist eigenständig (kein App-Bundle) und hält die Sicherheitsrichtlinie ohne Inline-Skript ein", () => {
    expect(seite).toContain("script-src 'self'");
    expect(seite).not.toMatch(/assets\//);
    expect(seite).toContain('<script src="./reparatur.js"></script>');
    expect(seite).not.toMatch(/<script>/);
  });

  it("entfernt nur die Registrierung dieses Bereichs und Caches mit dem Präfix ki-lead-, nie gespeicherte Daten", () => {
    expect(skript).toContain("r.scope === BEREICH");
    expect(skript).toContain('var PRAEFIX = "ki-lead-"');
    expect(skript).toContain("n.indexOf(PRAEFIX) === 0");
    expect(ohneKommentare(skript)).not.toMatch(/indexedDB|localStorage|sessionStorage|clear\(\)/);
    // nur nach ausdrücklicher Betätigung, ohne automatisches Neuladen
    expect(skript).toContain('knopf.addEventListener("click"');
    expect(skript).not.toMatch(/location\.reload|location\.replace|location\.href\s*=/);
  });

  it("Startprüfung lädt nie selbst neu und berührt keine Daten", () => {
    expect(ohneKommentare(pruefung)).not.toMatch(/indexedDB|localStorage|caches\.|serviceWorker/);
    // Neuladen nur auf Klick
    expect(pruefung.match(/location\.reload/g)).toHaveLength(1);
    expect(pruefung).toMatch(/addEventListener\("click", function \(\) \{\s*window\.location\.reload\(\);/);
  });
});
