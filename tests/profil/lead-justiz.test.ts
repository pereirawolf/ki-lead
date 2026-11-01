// Profil „Lagebild Justiz“ (profile/lead-justiz, Erprobungsentwurf 0.1.0): lädt ohne Fehler und Warnungen, hält
// die Kopplungen des Anwendungskerns ein (Teil A mit A.1, A.6, A.7, A.7.1, A.8, A.8.1 und Fristgrundlage;
// Quellenkategorien A „amtlich“ und B „Betreiber“), trennt die vier Bewertungsmerkmale und liefert nur fiktive,
// schemakonforme Beispielmeldungen. Die fachliche Abnahme ersetzt der Test nicht.
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leseOrdner, profil, repoPfad } from "../support/dateien";
import { pruefeGegenSchema } from "../../src/kern/validierung";
import { migriere } from "../../src/kern/migration";
import { quellenHinweise } from "../../src/kern/quellen";
import { pflichtHinweise } from "../../src/kern/kennsaetze";

const NAME = "lead-justiz";
const dateien = leseOrdner(repoPfad("profile", NAME));
const json = (pfad: string) => JSON.parse(dateien[pfad]);
const beispiele = Object.keys(dateien).filter((p) => p.startsWith("beispiele/") && p.endsWith(".json"));

const FUNKTIONEN = [
  "F1 Rechtsschutz und Eilrechtsschutz",
  "F2 Richterlicher Bereitschaftsdienst",
  "F3 Zeitkritische Strafverfolgung und Haftsachen",
  "F4 Sicherer und menschenwürdiger Vollzug",
  "F5 Register und sonstige Rechtspflege",
  "F6 Vollstreckung",
  "F7 Ambulante soziale Dienste",
  "F8 Ausbildung und Nachwuchssicherung",
  "Sonstiges",
];

describe("Profil Lagebild Justiz (Erprobungsentwurf)", () => {
  it("lädt ohne Fehler und Warnungen, nur mit Teil A und ohne Radar", async () => {
    const { profil: p, befunde } = await profil(NAME);
    expect(befunde.filter((b) => b.stufe === "fehler" || b.stufe === "warnung")).toEqual([]);
    expect(p!.sops.map((s) => s.id)).toEqual(["teil-a"]);
    expect(p!.ui.radare ?? {}).toEqual({});
    expect(p!.ui.rollen.sv_radar).toBeUndefined();
  });

  it("das Beispielprofil bleibt das erste mitgelieferte Profil (aktiv beim ersten Start der App)", () => {
    expect(readdirSync(repoPfad("profile")).sort()[0]).toBe("lead-beispiel");
  });

  it("Manifest: Version, Lizenz und Herausgeber wie die übrigen Inhalte unter profile/", () => {
    const m = json("profil.json");
    expect([m.version, m.lizenz, m.herausgeber]).toEqual(["0.1.1", "CC-BY-4.0", "Heiko Pereira Wolf (https://www.pereirawolf.de)"]);
    expect(m.variablen.land).toBe("Thüringen");
    expect(Object.keys(m.anweisungen).sort()).toEqual(["erfassung", "kurzfassung", "verdichtung"]);
  });

  it("Funktionskatalog F1–F8 mit „Sonstiges“ als Auswahlschlüssel, Beurteilung in aufsteigender Schwere", () => {
    const s = json("meldung.schema.json");
    expect(s.$defs.funktion.enum).toEqual(FUNKTIONEN);
    expect(s.$defs.sachverhalt.properties.primaerfunktion.enum).toEqual(["", ...FUNKTIONEN]);
    expect(s.$defs.sachverhalt.properties.bewertung.properties.beurteilung.enum).toEqual(["", "geringfügig", "erheblich", "kritisch"]);
    const ui = json("meldung.ui.json");
    expect(ui.rollen.sv_art).toBe("funktionen");
    // Die Tendenz endet auf „nicht bestimmbar“; die Verschärfung muss deshalb ausdrücklich benannt sein
    expect(ui.rollen.tendenz_verschaerfung).toBe("Verschärfung");
  });

  it("vier Bewertungsmerkmale getrennt; Nichtwerte der Funktionslage sind eigene Werte", () => {
    const s = json("meldung.schema.json");
    expect(Object.keys(s.$defs.sachverhalt.properties.bewertung.properties)).toEqual([
      "beurteilung",
      "dringlichkeit",
      "tendenz",
      "erkenntnissicherheit",
      "bewertung_text",
    ]);
    expect(s.$defs.funktionsstatus.properties.status.enum).toEqual(
      expect.arrayContaining(["gesichert", "nicht betroffen", "nicht zuständig", "unbekannt", "nicht gemeldet"]),
    );
  });

  it("Pflichtkennsätze und Quellenkategorien passend zu den festen Prüfungen des Kerns (A amtlich, B Betreiber)", () => {
    const ui = json("meldung.ui.json");
    for (const k of ["handlungsrelevant", "aenderung", "abweichung"]) expect(ui.kennsaetze[k], k).toBeTruthy();
    expect(ui.quellen.rangfolge).toEqual(["A", "B", "K", "W", "V", "M", "P"]);
    expect(ui.quellen.kategorien.A).toMatch(/^amtlich – /);
    expect(ui.quellen.kategorien.B).toMatch(/^Betreiber – /);
    expect(ui.rollen.herkunft_kategorie["IT-Betreiber"]).toBe("B");
  });

  it("Teil A führt die Nummern, auf die der Kern verweist, und keine Platzhalter", () => {
    const a = dateien["sop/A_Gemeinsame-Regeln.md"];
    for (const nr of ["### A.1 ", "### A.6 ", "### A.7 ", "#### A.7.1 ", "### A.8 ", "#### A.8.1 "]) expect(a, nr).toContain(nr);
    expect(a).toContain("(Fristgrundlage)");
    expect(a).not.toMatch(/\{\{/);
    expect(dateien["kodierleitfaden.md"]).not.toMatch(/\{\{/);
  });

  it("Arbeitsanweisungen ohne laufabhängige Platzhalter; Kurzfassung trägt die Regeln selbst", () => {
    for (const d of ["anweisung-erfassung.md", "anweisung-verdichtung.md", "anweisung-kurzfassung.md"]) {
      expect(dateien[d], d).not.toMatch(/\{\{(auftrag\.|jetzt)/);
      expect(dateien[d], d).toMatch(/Fassung 0\.1\.0 vom 31\.10\.2026/);
    }
    expect(dateien["anweisung-erfassung.md"]).toContain("{{app.ausgabevertrag}}");
    const k = dateien["anweisung-kurzfassung.md"];
    expect(k).toContain("Kein Gesamtscore, kein Mittelwert");
    expect(k).toContain("Nichtwissen ist keine Entwarnung");
  });

  it("drei fiktive Beispielmeldungen", () => {
    expect(beispiele).toHaveLength(3);
    expect(json("profil.json").beispiele[0].titel).toContain("FIKTIV");
  });

  it.each(beispiele)("%s: fiktiv, schemakonform, Quellen und Pflichtfelder stimmig", async (pfad) => {
    expect(pfad).toContain("FIKTIV");
    expect(dateien[pfad]).toContain("FIKTIV");
    const { profil: p } = await profil(NAME);
    const mig = migriere(json(pfad), p!);
    expect(mig.bekannt).toBe(true);
    expect(pruefeGegenSchema(p!.schema, mig.daten, p!.ui)).toEqual([]);
    expect(quellenHinweise(mig.daten, p!.ui).filter((b) => b.stufe === "warnung")).toEqual([]);
    expect(pflichtHinweise(mig.daten, p!.ui)).toEqual([]);
  });

  it.each(beispiele)("%s: „gesichert“ nur mit Stand und Beleg; primäre Funktion unter den betroffenen", (pfad) => {
    const d = json(pfad);
    for (const f of d.funktionslage.filter((x: any) => x.status === "gesichert")) {
      expect(f.stand, f.funktion).not.toBe("");
      expect(f.hinweis, f.funktion).toMatch(/\[Q\d+\]/);
    }
    for (const sv of d.sachverhalte) if (sv.primaerfunktion) expect(sv.funktionen).toContain(sv.primaerfunktion);
  });
});
