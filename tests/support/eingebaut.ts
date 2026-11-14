// Zwei eingebaute Profile mit gleichem Inhalt, aber anderer Kennung (andere Prüfsumme), für Tests des Profilwechsels.
// Verwendung: vi.mock("../../src/profil/eingebaut", async () => (await import("../support/eingebaut")).zweiProfile());
import { vi } from "vitest";
import { leseOrdner, repoPfad, v1ProfilDateien } from "../support/dateien";

export function zweiProfile() {
  const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
  const m = JSON.parse(dateien["profil.json"]);
  const b = { ...dateien, "profil.json": JSON.stringify({ ...m, id: "profil-b", name: "Profil B" }) };
  return {
    eingebauteProfile: () => [
      { ordner: "a", dateien },
      { ordner: "b", dateien: b },
    ],
  };
}

/**
 * Eingebaute Profile wie im Repository, das Beispielprofil aber in der eingefrorenen v1-Fassung (seit 0.9.0, UP-2026-W45-06)
 * – für Tests der Maske und der Eingabehilfen, die an Feldern von LEAD-Meldung-v1 prüfen.
 * Verwendung: vi.mock("../../src/profil/eingebaut", async () => (await import("../support/eingebaut")).mitV1Beispiel());
 */
export async function mitV1Beispiel() {
  const echt = await vi.importActual<typeof import("../../src/profil/eingebaut")>("../../src/profil/eingebaut");
  const v1 = v1ProfilDateien();
  return {
    ...echt,
    eingebauteProfile: () => echt.eingebauteProfile().map((p) => (p.ordner === "lead-beispiel" ? { ordner: p.ordner, dateien: v1 } : p)),
  };
}
