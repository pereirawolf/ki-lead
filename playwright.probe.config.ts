// Mistral-Probe (seit 0.5.6): echte Aufrufe an Mistral mit einem Testschlüssel aus dem Secret MISTRAL_API_KEY.
// Nicht Teil von `npm test` oder `npm run test:browser`; läuft nur über den Workflow „Mistral-Probe“ oder lokal mit
// `MISTRAL_API_KEY=… npx playwright test -c playwright.probe.config.ts`. Ohne Schlüssel werden alle Prüfungen
// übersprungen. Keine Aufzeichnungen (Trace, Video, Bildschirmfotos), damit der Schlüssel nirgends gespeichert wird.
import { defineConfig, devices } from "@playwright/test";

const PORT = 4174;
const chromiumPfad = process.env.PLAYWRIGHT_CHROMIUM_PFAD;

export default defineConfig({
  testDir: "tests/probe",
  testMatch: "**/*.spec.ts",
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
  webServer: {
    command:
      process.env.KI_LEAD_BUILD_VORHANDEN === "1"
        ? `npx vite preview --port ${PORT} --strictPort`
        : `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
