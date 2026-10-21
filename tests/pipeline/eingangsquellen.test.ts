// Quellenprüfung der Eingangsmeldungen (A-Einträge je Eingang).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { eingangsquellenPruefen } from "../../src/pipeline/vermerke";
import { type Material } from "../../src/pipeline/material";

describe("Quellenprüfung der Eingangsmeldungen", () => {
  const ein = (name: string, stelle: string, zeitpunkt = "2026-10-14T10:00", land = ""): Material => ({
    id: name,
    art: "eingang",
    name,
    groesse: 1,
    hash: name,
    eingang: { stelle, land, zeitpunkt, sachverhalte: 1, schema: "x" },
  });
  it("verlangt je Eingang einen eigenen A-Eintrag und unterscheidet ähnliche Stellen", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const nord = ein("n.json", "Lagezentrum (Nord)");
    const sued = ein("s.json", "Lagezentrum (Süd)");
    const z = eingangsquellenPruefen([nord, sued], { quellen: "[Q1] M – Lagezentrum (Nord) (14.10.2026): Lagemeldung" }, p!);
    expect(z.map((x) => x.status)).toEqual(["kategorie", "fehlt"]);
    const ok = eingangsquellenPruefen([nord, sued], { quellen: "[Q1] A – Lagezentrum (Nord): Lagemeldung\n[Q2] A – Lagezentrum (Süd): Lagemeldung" }, p!);
    expect(ok.map((x) => [x.status, x.eintrag])).toEqual([
      ["nachgewiesen", 1],
      ["nachgewiesen", 2],
    ]);
  });
  it("trennt zwei Zeitstände derselben Stelle über die Uhrzeit", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const frueh = ein("a.json", "Lagezentrum X", "2026-10-14T08:00");
    const spaet = ein("b.json", "Lagezentrum X", "2026-10-14T12:00");
    const nurEiner = eingangsquellenPruefen([frueh, spaet], { quellen: "[Q1] A – Lagezentrum X (14.10.2026): Lagemeldung" }, p!);
    expect(nurEiner.map((x) => x.status)).toEqual(["unsicher", "fehlt"]);
    const beide = eingangsquellenPruefen(
      [frueh, spaet],
      { quellen: "[Q1] A – Lagezentrum X: Lagemeldung 08:00 Uhr\n[Q2] A – Lagezentrum X: Lagemeldung 12:00 Uhr" },
      p!,
    );
    expect(beide.map((x) => x.status)).toEqual(["nachgewiesen", "nachgewiesen"]);
  });
});
