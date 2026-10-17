import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Relative Basis, damit derselbe Build als PWA (Unterverzeichnis) und in Capacitor läuft.
// Eigene Profile aus privat/profile/ nur im Entwicklungsserver oder auf ausdrücklichen Wunsch (KI_LEAD_PRIVAT=1).
export default defineConfig(({ command }) => ({
  base: "./",
  define: {
    __KI_LEAD_PRIVAT__: JSON.stringify(command === "serve" || process.env.KI_LEAD_PRIVAT === "1"),
  },
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
}));
