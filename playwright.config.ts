// Browsertests (Playwright, nur Chromium) gegen den Produktionsbuild in der Vorschau von Vite.
// Keine echten KI-Aufrufe: Die Tests simulieren den Anbieter am Netzwerkrand und brechen jede andere Anfrage
// nach außen ab. Lokal ohne heruntergeladenen Browser: PLAYWRIGHT_CHROMIUM_PFAD auf eine Chromium-Datei setzen.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const chromiumPfad = process.env.PLAYWRIGHT_CHROMIUM_PFAD;

export default defineConfig({
  testDir: "tests/browser",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    trace: "retain-on-failure",
    acceptDownloads: true,
    // Der Service Worker der PWA würde Anfragen am Abfangen vorbeiführen
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(chromiumPfad ? { launchOptions: { executablePath: chromiumPfad } } : {}) },
    },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
