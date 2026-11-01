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
import { MEHRERE_FRISTEN_HINWEIS, pflichtHinweise } from "../../src/kern/kennsaetze";
import { zeitstrahlNachbearbeiten } from "../../src/pipeline/zeitstrahl";
import { zeitstrahlSteuerung } from "../../src/pipeline/kontext";
import type { Befund } from "../../src/kern/typen";

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
    expect([m.version, m.lizenz, m.herausgeber]).toEqual(["0.1.2", "CC-BY-4.0", "Heiko Pereira Wolf (https://www.pereirawolf.de)"]);
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

  // Soll: docs/PROFILFORMAT.md – die Paketversion steht maßgeblich nur in profil.json; die README darf eine eigene
  // Dokumentfassung tragen, aber keinen abweichenden statischen Paketstand.
  it("GK-2026-W44-06: der README-Kopf verweist für die Profilversion auf profil.json und nennt keinen eigenen Paketstand", () => {
    const kopf = dateien["README.md"].split("\n").find((z: string) => z.startsWith("Fassung "))!;
    expect(kopf).toContain("Profilversion siehe [profil.json](profil.json)");
    expect(Object.keys(dateien)).toContain("profil.json");
    expect(kopf).not.toMatch(/Profilversion\s+\d+\.\d+\.\d+/);
    // Negativfall: die frühere Kopfzeile wird zurückgewiesen
    expect("Fassung 0.1.0 vom 31.10.2026 · Profilversion 0.1.0 · Schemakennung").toMatch(/Profilversion\s+\d+\.\d+\.\d+/);
  });

  // Soll: Entscheidung des Herausgebers vom 01.11.2026 zu GK-2026-W44-08 (Option A): Das Justizprofil führt die Regeln
  // „je Frist eine eigene Zeile“ und „stabile Quellennummern bei der Fortschreibung“ in seinem Teil A; die Texte der App
  // nennen keine Abschnittsnummer, weil die Abschnitte je Profil verschieden sind (A.10.1).
  it("GK-2026-W44-08: Teil A führt beide Regeln, die Texte der App nennen keine Abschnittsnummer", async () => {
    const teilA = dateien["sop/A_Gemeinsame-Regeln.md"];
    expect(teilA).toContain("Je Frist steht eine eigene Zeile „Handlungsrelevant bis:“");
    expect(teilA).toContain("bei einer Fortschreibung jedoch mit stabilen Nummern");
    const { profil: p } = await profil(NAME);
    // Fortschreibung der eigenen Vormeldung, in der Q1 und Q2 die Plätze tauschen
    const datei = beispiele.find((b) => b.includes("ERV-Stoerung"))!;
    const vor = { ...json(datei), meldende_stelle: "Lagestelle Justiz (Beispiel)" };
    const d = { ...json(datei), meldende_stelle: "Lagestelle Justiz (Beispiel)", meldezeitpunkt: "2026-10-13T15:30" };
    const q = String(d.quellen).split("\n");
    d.quellen = q.map((z: string) => (z.startsWith("[Q1]") ? z.replace("[Q1]", "[Q2]") : z.startsWith("[Q2]") ? z.replace("[Q2]", "[Q1]") : z)).join("\n");
    const befunde: Befund[] = [];
    const material = [{ id: "v", art: "meldung" as const, name: "v.json", groesse: 1, hash: "v", meldung: vor }];
    zeitstrahlNachbearbeiten(d, p!, { material, jetzt: new Date("2026-10-13T13:31:00Z"), zufall: () => 0.3 }, befunde);
    const konflikt = befunde.find((b) => b.code === "ZEITSTRAHL_QUELLE");
    expect(konflikt).toBeDefined();
    const steuerung = zeitstrahlSteuerung({ vormeldung: true, verdichtung: false }, {
      felder: { zeitstrahl: "zeitstrahl" },
      kennungenVormeldung: ["DE-TH-20261013-K7QM"],
      naechsteZ: 5,
      typBewertung: "Bewertung",
      typBerichtigung: "Berichtigung",
    } as any).join("\n");
    for (const text of [MEHRERE_FRISTEN_HINWEIS, konflikt!.text, steuerung]) expect(text).not.toMatch(/\bA\.\d|Abschnitt \d/);
    // Gegenprobe: der frühere Hinweis mit Abschnittsnummer wird erkannt
    expect("je Frist eine eigene Zeile (A.4)").toMatch(/\bA\.\d|Abschnitt \d/);
  });
});
