import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./styles.css";
import App from "./App";
import { anwenden, aufloesen, systemVorgabe } from "./darstellung/thema";
import { startLesen } from "./darstellung/speicher";

// Nach einer Neuveröffentlichung fehlen in einer noch offenen älteren Seite die nachgeladenen Teile (z. B. für PDF).
// Vite meldet das als „vite:preloadError“; dann einmal neu laden, damit Seite und Dateien wieder zusammenpassen.
window.addEventListener("vite:preloadError", (ereignis) => {
  try {
    const zuletzt = Number(sessionStorage.getItem("ki-lead-neu-geladen") || 0);
    if (Date.now() - zuletzt < 60_000) return;
    sessionStorage.setItem("ki-lead-neu-geladen", String(Date.now()));
  } catch {
    return;
  }
  ereignis.preventDefault();
  window.location.reload();
});

// Gewähltes Farbschema vor dem ersten Zeichnen anwenden (maßgeblich bleibt die Auswahl in IndexedDB)
try {
  const start = startLesen();
  anwenden(aufloesen(start.auswahl, start.profil, undefined, systemVorgabe()));
} catch {
  /* Standarddarstellung */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
