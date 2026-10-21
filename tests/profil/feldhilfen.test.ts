// LEAD-Eingabehilfen beim Laden eines Profils: fehlerhafte Konfiguration deaktiviert nur die Hilfen (A14).
import { describe, expect, it } from "vitest";
import { leseOrdner, profil, repoPfad } from "../support/dateien";
import { ladeProfil } from "../../src/profil/laden";

describe("LEAD-Eingabehilfen im Profil", () => {
  it("fehlerhafte Konfiguration: Warnung, Profil bleibt nutzbar, Hilfen entfallen", async () => {
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const ui = JSON.parse(dateien["meldung.ui.json"]);
    ui.feldhilfen.felder["analyse.lage_ereignis"].vorlagen[0].vorlage = "{{radar}}";
    const erg = await ladeProfil({ ...dateien, "meldung.ui.json": JSON.stringify(ui) });
    expect(erg.profil).toBeTruthy();
    expect(erg.profil!.ui.feldhilfen).toBeUndefined();
    expect(erg.befunde.filter((b) => b.stufe === "warnung" && /LEAD-Eingabehilfen werden nicht verwendet/.test(b.text))).toHaveLength(1);
    expect(erg.befunde.filter((b) => b.stufe === "fehler")).toEqual([]);
  });

  it("Beispielprofil mit, Musterprofil ohne Eingabehilfen, beide ohne Befund dazu", async () => {
    const beispiel = await profil("lead-beispiel");
    expect(Object.keys(beispiel.profil!.ui.feldhilfen!.felder)).toEqual([
      "analyse.lage_ereignis",
      "analyse.risiken_auswirkungen",
      "analyse.massnahmen_empfehlungen",
      "analyse.abhaengigkeiten_interdependenzen",
      "sofort.bewertung_text",
    ]);
    const muster = await profil("muster");
    expect(muster.profil!.ui.feldhilfen).toBeUndefined();
    for (const e of [beispiel, muster]) expect(e.befunde.filter((b) => /Eingabehilfen/.test(b.text))).toEqual([]);
  });
});
