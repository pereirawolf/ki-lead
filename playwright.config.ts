// Browsertests (Playwright, nur Chromium) gegen den Produktionsbuild in der Vorschau von Vite.
// Keine echten KI-Aufrufe: Die Tests simulieren den Anbieter am Netzwerkrand und brechen jede andere Anfrage
// nach außen ab. Lokal ohne heruntergeladenen Browser: PLAYWRIGHT_CHROMIUM_PFAD auf eine Chromium-Datei setzen.
//
// Drei Projekte (siehe docs/TESTS.md, „Gestaffelte Prüfung“):
// - kern:   Chromium; Hauptablauf, Abbruch, Wiederherstellung, Speicherfehler, Barrierefreiheit, Eingabehilfen, Einstellungen
// - pwa:    Chromium; Service Worker, Offline-Start und Versionswechsel (pwa.spec.ts, pwa-update.spec.ts)
// - webkit: WebKit (Safari, auch iOS); dieselben Dateien wie kern (seit 0.6.5, TP-2026-W44-22)
// `npm run test:browser` führt kern und pwa aus und braucht damit nur Chromium; WebKit läuft eigens mit
// `npm run test:browser:webkit` (in der CI nach `npx playwright install --with-deps webkit`).
//
// KI_LEAD_BUILD_VORHANDEN=1 verwendet einen bereits erzeugten Ordner dist/ (in der CI direkt nach `npm run build`),
// statt vor den Tests erneut zu bauen. Getestet wird damit genau der Build, der auch veröffentlicht wird.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const chromiumPfad = process.env.PLAYWRIGHT_CHROMIUM_PFAD;
const chromium = { ...devices["Desktop Chrome"], ...(chromiumPfad ? { launchOptions: { executablePath: chromiumPfad } } : {}) };
const PWA = /pwa.*\.spec\.ts$/;
const vorschau = `npx vite preview --port ${PORT} --strictPort`;

export default defineConfig({
  testDir: "tests/browser",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  // Die GitHub-Runner haben mindestens zwei Kerne; die Vorgabe (halbe Kernzahl) ergäbe dort oft nur einen Worker.
  // Die Tests sind unabhängig (eigener Browserkontext, PWA-Server je Test auf freiem Port).
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    trace: "retain-on-failure",
    acceptDownloads: true,
    // Der Service Worker der PWA würde Anfragen am Abfangen vorbeiführen (pwa*.spec.ts lassen ihn eigens zu)
    serviceWorkers: "block",
  },
  projects: [
    { name: "kern", testIgnore: PWA, use: chromium },
    { name: "pwa", testMatch: PWA, use: chromium },
    { name: "webkit", testIgnore: PWA, use: devices["Desktop Safari"] },
  ],
  webServer: {
    command: process.env.KI_LEAD_BUILD_VORHANDEN === "1" ? vorschau : `npx vite build && ${vorschau}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
