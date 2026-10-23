// Eigene Konfiguration für Abnahmeläufe mit echten KI-Aufrufen. Nie Teil von `npm test`:
// Die Hauptkonfiguration (vite.config.ts) bindet nur tests/**/*.test.ts ein.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: fileURLToPath(new URL("../..", import.meta.url)),
  test: {
    environment: "node",
    include: ["evaluation/abnahmen/*.lauf.ts"],
    // Ein Lauf dauert 5–10 Minuten; mehrere Läufe nacheinander, keine Parallelität
    testTimeout: 60 * 60 * 1000,
    fileParallelism: false,
    reporters: ["verbose"],
  },
});
