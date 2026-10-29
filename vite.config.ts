import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fehlendeVerweise, precacheListe, precacheVersion, serviceWorkerQuelle } from "./src/pwa/precache.ts";

/** Alle Dateien eines Ordners (rekursiv) als Pfad relativ zum Ordner → Inhalt */
function ordnerDateien(ordner: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(ordner)) return out;
  const lauf = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) lauf(p);
      else out[relative(ordner, p).split("\\").join("/")] = readFileSync(p).toString("base64");
    }
  };
  lauf(ordner);
  return out;
}

/**
 * Service Worker der PWA (Meilenstein 5): erzeugt beim Build sw.js aus src/pwa/sw-vorlage.js mit der Liste aller
 * ausgelieferten Dateien. Ohne zusätzliche Abhängigkeit; nur im Produktionsbuild.
 */
function serviceWorker(): Plugin {
  return {
    name: "ki-lead-service-worker",
    apply: "build",
    enforce: "post",
    generateBundle(_optionen, bundle) {
      const oeffentlich = ordnerDateien(join(import.meta.dirname, "public"));
      const inhalte: Record<string, string> = { ...oeffentlich };
      // Dateien ohne Hash im Namen (index.html) gehen mit ihrem Inhalt in die Version ein
      for (const [name, datei] of Object.entries(bundle)) if (datei.type === "asset" && !/-[\w-]{8}\.\w+$/.test(name)) inhalte[name] = String(datei.source);
      const liste = precacheListe([...Object.keys(bundle), ...Object.keys(oeffentlich)]);
      // Der Service Worker installiert nur eine stimmige Fassung; ein Build, der das nicht wäre, bricht hier ab
      const index = bundle["index.html"];
      const fehlend = index && index.type === "asset" ? fehlendeVerweise(String(index.source), liste) : ["index.html"];
      if (fehlend.length) this.error(`index.html verweist auf Dateien außerhalb der Vorhalteliste: ${fehlend.join(", ")}`);
      const app = APP_VERSION;
      const vorlage = readFileSync(join(import.meta.dirname, "src/pwa/sw-vorlage.js"), "utf-8");
      this.emitFile({ type: "asset", fileName: "sw.js", source: serviceWorkerQuelle(vorlage, precacheVersion(app, liste, inhalte), liste) });
    },
  };
}

const APP_VERSION = JSON.parse(readFileSync(join(import.meta.dirname, "package.json"), "utf-8")).version as string;

// Relative Basis, damit derselbe Build als PWA (Unterverzeichnis) und in Capacitor läuft.
// Eigene Profile aus privat/profile/ nur im Entwicklungsserver oder auf ausdrücklichen Wunsch (KI_LEAD_PRIVAT=1).
export default defineConfig(({ command }) => ({
  base: "./",
  define: {
    __KI_LEAD_PRIVAT__: JSON.stringify(command === "serve" || process.env.KI_LEAD_PRIVAT === "1"),
    // Versionsnummer aus package.json statt Handpflege in lauf.ts (seit 0.6.2, TP-2026-W44-08); gilt auch unter Vitest
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [react(), serviceWorker()],
  build: {
    outDir: "dist",
    sourcemap: true,
    // Lizenzhinweise aller gebündelten Pakete (MIT, BSD, Apache, OFL verlangen sie in jeder Kopie); siehe THIRD-PARTY-NOTICES.md
    license: { fileName: "lizenzen.md" },
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Abdeckung (seit 0.6.2, TP-2026-W44-08): nur mit `npm run test:coverage`, Schwellen für die Fachlogik ohne Oberfläche.
    // Die Werte liegen knapp unter dem Stand vom 26.10.2026; sie sollen Rückschritte anzeigen, nicht Ziele setzen.
    coverage: {
      provider: "v8",
      include: ["src/kern/**", "src/pipeline/**", "src/anbieter/**"],
      reporter: ["text-summary", "html"],
      reportsDirectory: "coverage",
      // Stand 26.10.2026: Anweisungen 93,1 %, Zweige 79,0 %, Funktionen 96,6 %, Zeilen 96,3 %
      thresholds: { statements: 93, branches: 78, functions: 96, lines: 96 },
    },
  },
}));
