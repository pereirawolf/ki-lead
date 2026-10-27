// Hilfen für die Update-Tests der PWA: Fassungen aus dem aktuellen Build ableiten und wie GitHub Pages ausliefern
// (Unterordner /ki-lead/, Cache-Control max-age=600, umschaltbares Deployment). Läuft im Testprozess, nicht im Browser.
import { createServer, type Server } from "node:http";
import { cpSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import type { AddressInfo } from "node:net";
import { serviceWorkerQuelle } from "../../src/pwa/precache";

const TYPEN: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const DIST = join(import.meta.dirname, "..", "..", "dist");
const VORLAGE_NEU = readFileSync(join(import.meta.dirname, "..", "..", "src", "pwa", "sw-vorlage.js"), "utf-8");
const VORLAGE_051 = readFileSync(join(import.meta.dirname, "fixtures", "sw-vorlage-0.5.1.js"), "utf-8");

export interface Fassung {
  ordner: string;
  /** Startdatei laut index.html */
  start: string;
}

/** Liste und Version aus dem sw.js eines Builds */
function swDaten(ordner: string): { version: string; liste: string[] } {
  const sw = readFileSync(join(ordner, "sw.js"), "utf-8");
  return { version: sw.match(/const VERSION = "([^"]+)"/)![1], liste: JSON.parse(sw.match(/const DATEIEN = (\[.*?\]);/)![1]) };
}

/**
 * Fassung aus dem aktuellen Build: optional mit umbenannter Startdatei (wie ein neuer Build mit anderem Inhalt),
 * mit der Service-Worker-Vorlage von 0.5.1 oder der aktuellen, und optional mit fremder index.html.
 */
export function fassung(
  wurzel: string,
  name: string,
  {
    endung = "",
    sw = "neu",
    indexVon,
    ohneDatei,
  }: {
    endung?: string;
    sw?: "neu" | "0.5.1";
    indexVon?: Fassung;
    /** Datei der Liste auf dem Server entfernen (Installation bricht beim Laden ab, wie bei einem Netzfehler) */
    ohneDatei?: RegExp;
  } = {},
): Fassung {
  const ordner = join(wurzel, name);
  cpSync(DIST, ordner, { recursive: true });
  const { version, liste } = swDaten(ordner);
  let html = readFileSync(join(ordner, "index.html"), "utf-8");
  let start = html.match(/assets\/(index-[^"]+\.js)/)![1];
  let neueListe = liste;
  if (endung) {
    const neu = start.replace(/\.js$/, `${endung}.js`);
    renameSync(join(ordner, "assets", start), join(ordner, "assets", neu));
    // Nachgeladene Teile (seit 0.6.5 Lagebild, Profile, Einstellungen; vorgeladen nach dem ersten Zeichnen) importieren
    // gemeinsamen Code aus der Startdatei; ihre Verweise ziehen mit, wie in einem echten Build. Sonst scheitert das
    // Vorladen, und main.tsx lädt nach „vite:preloadError“ neu.
    for (const d of readdirSync(join(ordner, "assets")).filter((x) => x.endsWith(".js"))) {
      const pfad = join(ordner, "assets", d);
      const text = readFileSync(pfad, "utf-8");
      if (text.includes(start)) writeFileSync(pfad, text.split(start).join(neu));
    }
    html = html.replace(`assets/${start}`, `assets/${neu}`);
    neueListe = liste.map((d) => (d === `assets/${start}` ? `assets/${neu}` : d));
    start = neu;
  }
  if (sw === "0.5.1") {
    // Wie damals veröffentlicht: ohne Startprüfung und Reparaturseite
    html = html.replace(/\s*<!--[^>]*Startprüfung[^>]*-->\s*<script src="\.\/start-pruefung\.js"><\/script>/, "");
    neueListe = neueListe.filter((d) => !/^(start-pruefung\.js|reparatur\.(html|js))$/.test(d));
    for (const d of ["start-pruefung.js", "reparatur.html", "reparatur.js"]) rmSync(join(ordner, d), { force: true });
  }
  writeFileSync(join(ordner, "index.html"), indexVon ? readFileSync(join(indexVon.ordner, "index.html")) : html);
  if (ohneDatei) for (const d of neueListe.filter((x) => ohneDatei.test(x))) rmSync(join(ordner, d), { force: true });
  writeFileSync(join(ordner, "sw.js"), serviceWorkerQuelle(sw === "0.5.1" ? VORLAGE_051 : VORLAGE_NEU, `${version}${endung}-${sw}`, neueListe));
  return { ordner, start };
}

export interface PagesServer {
  url: string;
  /** Deployment umschalten */
  veroeffentlichen: (f: Fassung) => void;
  /** Anfragen seit dem letzten Abruf („200 /ki-lead/…“) */
  protokoll: () => string[];
  schliessen: () => Promise<void>;
  wurzel: string;
}

export async function pagesServer(): Promise<PagesServer> {
  const wurzel = mkdtempSync(join(tmpdir(), "ki-lead-pwa-"));
  let aktiv = "";
  let log: string[] = [];
  const server: Server = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://x");
    if (!url.pathname.startsWith("/ki-lead/")) {
      res.statusCode = 404;
      res.end();
      return;
    }
    const rel = decodeURIComponent(url.pathname.slice("/ki-lead/".length));
    const pfad = join(aktiv, rel ? normalize(rel) : "index.html");
    if (!pfad.startsWith(aktiv) || !existsSync(pfad) || statSync(pfad).isDirectory()) {
      log.push(`404 ${url.pathname}`);
      res.statusCode = 404;
      res.end();
      return;
    }
    log.push(`200 ${url.pathname}`);
    res.setHeader("content-type", TYPEN[extname(pfad)] || "application/octet-stream");
    res.setHeader("cache-control", "max-age=600");
    res.end(readFileSync(pfad));
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}/ki-lead/`,
    wurzel,
    veroeffentlichen: (f) => {
      aktiv = f.ordner;
    },
    protokoll: () => {
      const z = log;
      log = [];
      return z;
    },
    schliessen: async () => {
      server.closeAllConnections();
      await new Promise<void>((ok) => server.close(() => ok()));
      rmSync(wurzel, { recursive: true, force: true });
    },
  };
}
