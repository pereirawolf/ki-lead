// Mistral-Probe (seit 0.5.6): echte Aufrufe an Mistral mit einem Testschlüssel aus dem Secret MISTRAL_API_KEY.
// Seit 0.6.17 (TP-2026-W44-52) zwei Projekte: „mistral“ gegen den öffentlichen Build (Port 4174) und „stelle“ gegen den
// Betreiberbuild mit betrieb/probe-mistral-eu.json in dist-betrieb/ (Port 4175).
// Nicht Teil von `npm test` oder `npm run test:browser`; läuft nur über den Workflow „Mistral-Probe“ oder lokal mit
// `MISTRAL_API_KEY=… npx playwright test -c playwright.probe.config.ts`. Ohne Schlüssel werden alle Prüfungen
// übersprungen. Keine Aufzeichnungen (Trace, Video, Bildschirmfotos), damit der Schlüssel nirgends gespeichert wird.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4174;
const PORT_BETRIEB = 4175;
const vorhanden = process.env.KI_LEAD_BUILD_VORHANDEN === "1";
const chromiumPfad = process.env.PLAYWRIGHT_CHROMIUM_PFAD;

export default defineConfig({
  testDir: "tests/probe",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    trace: "off",
    video: "off",
    screenshot: "off",
    serviceWorkers: "block",
    ...devices["Desktop Chrome"],
    ...(chromiumPfad ? { launchOptions: { executablePath: chromiumPfad } } : {}),
  },
  projects: [
    { name: "mistral", testMatch: "mistral.spec.ts" },
    { name: "stelle", testMatch: "stelle.spec.ts", use: { baseURL: `http://localhost:${PORT_BETRIEB}/` } },
  ],
  webServer: [
    {
      command: vorhanden ? `npx vite preview --port ${PORT} --strictPort` : `npx vite build && npx vite preview --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: vorhanden
        ? `npx vite preview --outDir dist-betrieb --port ${PORT_BETRIEB} --strictPort`
        : `KI_LEAD_BETRIEB=betrieb/probe-mistral-eu.json npx vite build --outDir dist-betrieb && npx vite preview --outDir dist-betrieb --port ${PORT_BETRIEB} --strictPort`,
      url: `http://localhost:${PORT_BETRIEB}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
