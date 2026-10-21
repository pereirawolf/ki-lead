// Zwei eingebaute Profile mit gleichem Inhalt, aber anderer Kennung (andere Prüfsumme), für Tests des Profilwechsels.
// Verwendung: vi.mock("../../src/profil/eingebaut", async () => (await import("../support/eingebaut")).zweiProfile());
import { leseOrdner, repoPfad } from "../support/dateien";

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
