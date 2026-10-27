// Profilmanifest mit falschen Datentypen (Review 20.10.2026, F05).
import { describe, expect, it } from "vitest";
import { leseOrdner } from "../support/dateien";
import { ladeProfil } from "../../src/profil/laden";

import { repoPfad } from "../support/dateien";
describe("F05: Profilmanifest mit falschen Datentypen", () => {
  const basis = () => leseOrdner(repoPfad("profile/lead-beispiel"));
  const mit = async (aendern: (m: any) => void) => {
    const d = basis();
    const m = JSON.parse(d["profil.json"]);
    aendern(m);
    d["profil.json"] = JSON.stringify(m);
    return ladeProfil(d);
  };

  it.each<[string, (m: any) => void, RegExp]>([
    ["name als Objekt", (m) => (m.name = { falsch: true }), /„name“ muss ein nicht leerer Text sein/],
    ["id als Zahl", (m) => (m.id = 42), /„id“ muss ein nicht leerer Text sein/],
    ["version als Liste", (m) => (m.version = ["1"]), /„version“ muss ein nicht leerer Text sein/],
    ["leerer Name", (m) => (m.name = "  "), /„name“ muss ein nicht leerer Text sein/],
    ["sop.dateien als Zahl", (m) => (m.sop = { dateien: 5 }), /„sop“ braucht „dateien“/],
    ["sop.dateien als Text", (m) => (m.sop = { dateien: "abc" }), /„sop“ braucht „dateien“/],
    ["anweisungen als Text", (m) => (m.anweisungen = "x"), /„anweisungen“ muss ein Objekt/],
    ["meldung.schema als Zahl", (m) => (m.meldung.schema = 5), /„meldung.schema“ muss ein Dateipfad/],
    ["beispiele mit null", (m) => (m.beispiele = [null]), /„beispiele“ braucht/],
    ["migrationen als Text", (m) => (m.migrationen = "x"), /„migrationen“ braucht/],
    ["kodierleitfaden als Zahl", (m) => (m.kodierleitfaden = 1), /„kodierleitfaden“ muss ein Text sein/],
  ])("%s: abgewiesen mit Befund, ohne Ausnahme", async (_, aendern, meldung) => {
    const e = await mit(aendern);
    expect(e.profil).toBeNull();
    expect(
      e.befunde
        .filter((b) => b.stufe === "fehler")
        .map((b) => b.text)
        .join("\n"),
    ).toMatch(meldung);
  });

  it("null bei optionalen Texten gilt wie eine fehlende Angabe", async () => {
    const e = await mit((m) => (m.beschreibung = null));
    expect(e.profil).not.toBeNull();
  });

  it("profil.json als Liste wird abgewiesen", async () => {
    const d = basis();
    d["profil.json"] = "[]";
    const e = await ladeProfil(d);
    expect(e.profil).toBeNull();
    expect(e.befunde[0].text).toMatch(/muss ein JSON-Objekt enthalten/);
  });
});

describe("Modellkennungen im Manifest (TP-2026-W44-26)", () => {
  it("TP-2026-W44-26: eine Kennung ohne Anbieter ergibt beim Laden eine Warnung statt stiller Zuordnung; bekannte Kennungen nicht", async () => {
    const d = leseOrdner(repoPfad("profile/lead-beispiel"));
    const m = JSON.parse(d["profil.json"]);
    m.modelle = { ...m.modelle, erfassung: "llama3", kurzfassung: "ollama:llama3.1", reparatur: "mistral-small-2603" };
    d["profil.json"] = JSON.stringify(m);
    const e = await ladeProfil(d);
    expect(e.profil).not.toBeNull();
    const w = e.befunde.filter((b) => b.code === "MODELL_UNBEKANNT");
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ stufe: "warnung" });
    expect(w[0]!.text).toContain("„llama3“");
    expect(w[0]!.text).toContain("„erfassung“");
    // Die mitgelieferten Profile nennen nur bekannte Kennungen
    for (const name of ["lead-beispiel", "muster"]) {
      const g = await ladeProfil(leseOrdner(repoPfad("profile", name)));
      expect(
        g.befunde.filter((b) => b.code === "MODELL_UNBEKANNT"),
        name,
      ).toEqual([]);
    }
  });
});
