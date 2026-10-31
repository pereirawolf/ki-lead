// Meldungsformat LEAD-Meldung-v2 (Entwurf 2.0, docs/LEAD-MELDUNG-V2.md, 01.11.2026): Kern- und Modulschema, erzeugte
// Profilschemata aktuell, Beispiele gültig (Ajv und eigener Prüfer im Gleichlauf), Vollständigkeit ab „zur_freigabe“,
// Referenzprüfung (Prüfebene 2) und Migration aller mitgelieferten v1-Meldungen.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { migriereV1, mitVersatz, pruefeReferenzen, quellenV1, stelleSchemaZusammen, verweise, zeitstrahlV1 } from "../../scripts/lead-meldung-v2.mjs";
import { schemaFehler } from "../../src/kern/validierung";
import { ajvGueltig, gleichWieAjv, referenzAjv } from "../support/ajv";
import { repoPfad } from "../support/dateien";

const ORDNER = "formate/lead-meldung-v2";
const json = (pfad: string) => JSON.parse(readFileSync(repoPfad(pfad), "utf-8"));
const kopie = <T>(x: T): T => JSON.parse(JSON.stringify(x));

const ZUSAMMENSTELLUNGEN = [
  ["lead-beispiel", "beispiel"],
  ["lead-thueringen", "beispiel-land"],
] as const;
const SCHEMA_BUND = json(`${ORDNER}/beispiel/meldung.schema.json`);
const SCHEMA_LAND = json(`${ORDNER}/beispiel-land/meldung.schema.json`);
const BEISPIEL_TH = json(`${ORDNER}/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json`);
const BEISPIEL_SL = json(`${ORDNER}/beispiele/LEAD-Meldung-v2_SL_2026-10-14T10-00_FIKTIV_Fehlanzeige.json`);
const FEST = { meldungId: () => "019a2b4c-6d10-7e3a-9f21-000000000000", jetzt: () => new Date("2026-11-01T09:00:00Z") };

const fehlerDerReferenzpruefung = (m: unknown) => pruefeReferenzen(m).filter((b: { stufe: string }) => b.stufe === "fehler");

describe("LEAD-Meldung-v2: Schemata", () => {
  it("Kern- und Modulschema sind gültige Schemata nach Draft 2020-12", () => {
    for (const datei of ["kern.schema.json", "module/lead-bevoelkerungsschutz.schema.json"])
      expect(() => referenzAjv().compile(json(`${ORDNER}/${datei}`)), datei).not.toThrow();
  });

  it.each(ZUSAMMENSTELLUNGEN)("Zusammenstellung %s: erzeugtes Schema ist aktuell (sonst „npm run meldung:v2 -- schema …“)", (name, ziel) => {
    const erzeugt = stelleSchemaZusammen(json(`${ORDNER}/zusammenstellungen/${name}.json`));
    expect(json(`${ORDNER}/${ziel}/meldung.schema.json`)).toEqual(erzeugt);
  });

  it.each(ZUSAMMENSTELLUNGEN)("Zusammenstellung %s: nur Schlüsselwörter, die der eigene Prüfer der App kennt", (_name, ziel) => {
    expect(schemaFehler(json(`${ORDNER}/${ziel}/meldung.schema.json`))).toBeNull();
  });

  it("das Modul ist im zusammengestellten Schema Pflicht, unbekannte Module bleiben zulässig", () => {
    const ohneModul = kopie(BEISPIEL_TH);
    delete ohneModul.sachverhalte[0].module["lead-bevoelkerungsschutz"];
    gleichWieAjv(SCHEMA_BUND, ohneModul, false);
    const fremd = kopie(BEISPIEL_TH);
    fremd.sachverhalte[0].module["lagebild-justiz"] = { fassung: "0.1", funktionen: { F1: "eingeschränkt" } };
    gleichWieAjv(SCHEMA_BUND, fremd, true);
    expect(pruefeReferenzen(fremd).some((b: { pfad: string; stufe: string }) => b.stufe === "hinweis" && b.pfad.endsWith("module.lagebild-justiz"))).toBe(true);
  });
});

describe("LEAD-Meldung-v2: Beispiele", () => {
  it.each([
    ["Thüringen, zwei Sachverhalte", BEISPIEL_TH],
    ["Saarland, Fehlanzeige", BEISPIEL_SL],
  ])("%s: gültig nach Schema (Ajv und eigener Prüfer) und ohne Fehler der Referenzprüfung", (_n, m) => {
    gleichWieAjv(SCHEMA_BUND, m, true);
    expect(fehlerDerReferenzpruefung(m)).toEqual([]);
  });

  it("das Beispiel zeigt die neuen Strukturen: Kennzahlen mit Teilmenge, Maßnahmen mit Status, Frist mit Empfehlung, Mindestwert-fähiges Radar", () => {
    const sv = BEISPIEL_TH.sachverhalte[1];
    expect(sv.kennzahlen.find((k: { id: string }) => k.id === "K3").teilmenge_von).toBe("K2");
    expect(sv.handlungsbedarf.massnahmen.map((m: { status: string }) => m.status)).toEqual(["umgesetzt", "begonnen", "umgesetzt"]);
    expect(sv.handlungsbedarf.fristen[0].empfehlung).toBe("E1");
    expect(sv.module["lead-bevoelkerungsschutz"].lagenradar.d2).toMatchObject({ stufe: 3, status: "belegt" });
  });
});

describe("LEAD-Meldung-v2: Vollständigkeit und Konsistenz im Schema", () => {
  it("Befund der Fremdprüfung vom 31.10.2026: eine freigegebene Meldung ohne Quellen, Lagetext und Zeichnung ist ungültig", () => {
    const m = kopie(BEISPIEL_TH);
    m.quellen = [];
    m.sachverhalte[0].analyse.lage_ereignis = "";
    m.freigabe = {};
    expect(ajvGueltig(SCHEMA_BUND, m)).toBe(false);
    const fehler = referenzAjv();
    fehler.validate(SCHEMA_BUND, m);
    const pfade = (fehler.errors || []).map((e) => e.instancePath);
    expect(pfade).toEqual(expect.arrayContaining(["/quellen", "/sachverhalte/0/analyse/lage_ereignis", "/freigabe"]));
    gleichWieAjv(SCHEMA_BUND, m, false);
  });

  it("im Entwurf sind leere Felder, Platzhalter-Kennungen und fehlender Meldezeitpunkt zulässig", () => {
    const m = kopie(BEISPIEL_TH);
    m.status = "entwurf";
    m.meldezeitpunkt = null;
    m.quellen = [];
    m.freigabe = {};
    m.sachverhalte[0].kennung = "NEU-1";
    m.sachverhalte[0].bewertung.kernaussage = "";
    gleichWieAjv(SCHEMA_BUND, m, true);
    m.status = "zur_freigabe";
    gleichWieAjv(SCHEMA_BUND, m, false);
  });

  it.each([
    [
      "offene Achse mit Stufe",
      (m: any) =>
        (m.sachverhalte[0].module["lead-bevoelkerungsschutz"].lagenradar.d1 = {
          stufe: 2,
          status: "offen",
          offen_grund: "kein_beleg",
          begruendung: "x",
          quellen: [],
        }),
    ],
    [
      "offene Achse ohne Grund",
      (m: any) => (m.sachverhalte[0].module["lead-bevoelkerungsschutz"].lagenradar.d1 = { stufe: null, status: "offen", begruendung: "x", quellen: [] }),
    ],
    [
      "belegte Achse ohne Stufe",
      (m: any) => (m.sachverhalte[0].module["lead-bevoelkerungsschutz"].lagenradar.d1 = { stufe: null, status: "belegt", begruendung: "x", quellen: [] }),
    ],
    ["Stufe 7", (m: any) => (m.sachverhalte[0].module["lead-bevoelkerungsschutz"].lagenradar.d1.stufe = 7)],
    ["Zeitpunkt ohne UTC-Versatz", (m: any) => (m.meldezeitpunkt = "2026-10-14T10:30")],
    [
      "Berichtigung ohne berichtigte Zeile",
      (m: any) =>
        m.sachverhalte[1].zeitstrahl.push({ id: "Z99", zeit: "2026-10-14", typ: "Berichtigung", text: "x", quellen: ["Q1"], erstmals_gemeldet: null }),
    ],
    [
      "Zeitstrahlzeile ohne Beleg",
      (m: any) => m.sachverhalte[1].zeitstrahl.push({ id: "Z98", zeit: "2026-10-14", typ: "Ereignis", text: "x", quellen: [], erstmals_gemeldet: null }),
    ],
    ["Fehlanzeige neben Sachverhalten", (m: any) => (m.fehlanzeige = { umfang: "x", zeitraum: { von: "2026-10-13", bis: "2026-10-14" }, erklaerung: "x" })],
    ["Eintritt unbekannt mit Zeit", (m: any) => (m.sachverhalte[0].eintritt = { zeit: "2026-10-13", genauigkeit: "unbekannt" })],
    ["Maßnahme mit Status außerhalb von SOP-LEAD A.4", (m: any) => (m.sachverhalte[1].handlungsbedarf.massnahmen[0].status = "erledigt")],
    ["Absender außerhalb der Gebietsliste", (m: any) => (m.absender.gebiet.name = "Landkreis Sonneberg")],
    ["Quellenkategorie außerhalb des Profils", (m: any) => (m.quellen[0].kategorie = "K")],
  ])("ungültig: %s", (_n, aendern) => {
    const m = kopie(BEISPIEL_TH);
    aendern(m);
    gleichWieAjv(SCHEMA_BUND, m, false);
  });

  it("Landesschema: Kreise als Absender, Bundesebene ausgeschlossen", () => {
    const m = kopie(BEISPIEL_TH);
    m.absender = { stelle: "Landratsamt Sonneberg, Krisenstab", ebene: "Kreis", gebiet: { name: "Landkreis Sonneberg", schluessel: "16072" } };
    gleichWieAjv(SCHEMA_LAND, m, true);
    m.absender = { stelle: "Koordinierungsstelle", ebene: "Bund", gebiet: { name: "Bund", schluessel: "DE" } };
    gleichWieAjv(SCHEMA_LAND, m, false);
  });
});

describe("LEAD-Meldung-v2: Referenzprüfung (Prüfebene 2)", () => {
  it.each([
    ["Verweis im Text ohne Quelle", (m: any) => (m.sachverhalte[0].analyse.lage_ereignis += " [Q42]"), "Q42 steht nicht im Quellenverzeichnis"],
    [
      "Beleg einer Achse ohne Quelle",
      (m: any) => m.sachverhalte[0].module["lead-bevoelkerungsschutz"].lagenradar.d1.quellen.push("Q9"),
      "Q9 steht nicht im Quellenverzeichnis",
    ],
    ["doppelte Quellen-ID", (m: any) => m.quellen.push({ ...m.quellen[0] }), "doppelte Quellen-ID Q1"],
    ["Ursprung verweist auf sich selbst", (m: any) => (m.quellen[0].ursprung = ["Q1"]), "Quelle verweist auf sich selbst"],
    [
      "Zeitstrahl nach t0",
      (m: any) =>
        (m.sachverhalte[1].zeitstrahl = [{ id: "Z1", zeit: "2026-10-14T12:00+02:00", typ: "Ereignis", text: "x", quellen: ["Q3"], erstmals_gemeldet: null }]),
      "Ereigniszeit nach dem Meldezeitpunkt",
    ],
    ["Teilmenge ohne Gesamtmenge", (m: any) => (m.sachverhalte[1].kennzahlen[2].teilmenge_von = "K7"), "K7 ist keine andere Kennzahl"],
    ["Mindestwert ohne Wert", (m: any) => Object.assign(m.sachverhalte[1].kennzahlen[0], { wert: null, mindestwert: true }), "Mindestwert ohne Wert"],
    ["Frist verweist auf fehlende Empfehlung", (m: any) => (m.sachverhalte[1].handlungsbedarf.fristen[0].empfehlung = "E9"), "E9 gibt es nicht"],
    [
      "Achse ohne Begründung ab zur_freigabe",
      (m: any) => (m.sachverhalte[0].module["lead-bevoelkerungsschutz"].lagenradar.d3.begruendung = ""),
      "D3 ohne Begründung",
    ],
    ["doppelte Kennung", (m: any) => (m.sachverhalte[1].kennung = m.sachverhalte[0].kennung), "doppelt"],
  ])("Fehler: %s", (_n, aendern, text) => {
    const m = kopie(BEISPIEL_TH);
    aendern(m);
    expect(
      fehlerDerReferenzpruefung(m)
        .map((b: { text: string }) => b.text)
        .join(" | "),
    ).toContain(text);
  });

  it("Quellenverweise einschließlich Bereichen", () => {
    expect(verweise("a [Q1] b [Q2, Q4] c [Q5–Q7] d [Q9-Q10]")).toEqual(["Q1", "Q2", "Q4", "Q5", "Q6", "Q7", "Q9", "Q10"]);
  });
});

describe("LEAD-Meldung-v2: Migration aus v1", () => {
  it("Zeitpunkte erhalten den Versatz der Zone, auch über die Umstellung am 25.10.2026", () => {
    expect(mitVersatz("2026-10-24T13:00", "Europe/Berlin")).toBe("2026-10-24T13:00+02:00");
    expect(mitVersatz("2026-10-28T10:30", "Europe/Berlin")).toBe("2026-10-28T10:30+01:00");
    expect(mitVersatz("2026-10-25T03:30", "Europe/Berlin")).toBe("2026-10-25T03:30+01:00");
  });

  it("Quellenzeile v1 wird in Felder zerlegt", () => {
    const h: string[] = [];
    const [q] = quellenV1(
      "[Q2] B – Netzbetreiber Y (09.10.2026): Störungsmeldung. Online abrufbar unter: https://example.org/stoerung (Paywall) [Zugriff: 09.10.2026]. Datenstand: 09.10.2026, 12:00",
      "Europe/Berlin",
      h,
    );
    expect(q).toEqual({
      id: "Q2",
      kategorie: "B",
      herausgeber: "Netzbetreiber Y",
      titel: "Störungsmeldung",
      veroeffentlicht: "2026-10-09",
      url: "https://example.org/stoerung",
      zugriff: "2026-10-09",
      datenstand: "2026-10-09T12:00+02:00",
      zugang: "paywall",
    });
    expect(h).toEqual([]);
  });

  it("Zeitstrahlzeile v1 wird in Felder zerlegt, Berichtigung behält ihren Bezug", () => {
    const [a, b] = zeitstrahlV1(
      "[Z1] 2026-10-13T22:30 · DE-TH-20261014-P5VN · Ereignis – Höchststand mit 18.000 Anschlüssen [Q4] · aufgenommen 2026-10-14T10:30\n[Z2] 2026-10-14 · DE-TH-20261014-P5VN · Berichtigung – zu [Z1]: Höchststand um 22:15 statt 22:30 [Q4]",
      "Europe/Berlin",
      [],
    );
    expect(a).toEqual({
      kennung: "DE-TH-20261014-P5VN",
      zeile: {
        id: "Z1",
        zeit: "2026-10-13T22:30+02:00",
        typ: "Ereignis",
        text: "Höchststand mit 18.000 Anschlüssen",
        quellen: ["Q4"],
        erstmals_gemeldet: "2026-10-14T10:30+02:00",
      },
    });
    expect(b.zeile.berichtigt).toBe("Z1");
  });

  it("Kennsätze, Mindestwert und Bezug der verdichteten Bundesmeldung (Ilka) werden zu Feldern", () => {
    const v1 = json("profile/lead-beispiel/beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json");
    const { meldung } = migriereV1(v1, FEST);
    const sv = meldung.sachverhalte[0];
    expect(sv.bewertung.referenzraum).toBe("Deutschland");
    expect(sv.bewertung.kernaussage).toMatch(/^Die Sturmphase ist vorbei/);
    expect(sv.module["lead-bevoelkerungsschutz"].lagenradar.d2).toMatchObject({ stufe: 4, status: "mindestwert" });
    expect(sv.handlungsbedarf.fristen[0]).toMatchObject({ id: "F1", bis: "2026-10-15T12:00+02:00", grundlage: "Ländermeldungen Thüringen und Niedersachsen" });
    expect(sv.bewertung.abweichende_bewertungen[0]).toMatchObject({ stelle: "Landkreis Sonneberg", stufe: "kritisch", ursache: "Maßstab" });
    expect(sv.bewertung.neubewertung_bei).toHaveLength(3);
    expect(sv.bezug).toHaveLength(7);
    expect(sv.zeitstrahl.length).toBeGreaterThan(0);
    expect(meldung.meldezeitpunkt).toBe("2026-10-14T14:00+02:00");
    expect(meldung.entstehung.migration.hinweise).toEqual(expect.arrayContaining([expect.stringContaining("Versandvermerk aus v1 nicht übernommen")]));
  });

  const v1Dateien = [
    ...readdirSync(repoPfad("profile/lead-beispiel/beispiele/orkantief-ilka"))
      .filter((d) => d.endsWith(".json"))
      .map((d) => [`profile/lead-beispiel/beispiele/orkantief-ilka/${d}`, "bund"]),
    ...readdirSync(repoPfad("profile/lead-thueringen/beispiele/hochwasser-saale"))
      .filter((d) => d.endsWith(".json"))
      .map((d) => [`profile/lead-thueringen/beispiele/hochwasser-saale/${d}`, "land"]),
    ["evaluation/material/ilka-musterfassung.json", "bund"],
    ...readdirSync(repoPfad("evaluation/pruefsteine"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => [join("evaluation/pruefsteine", d.name, "meldung.json"), "bund"]),
  ];

  it.each(v1Dateien)("%s: migriert schemagültig und ohne Fehler der Referenzprüfung", (datei, ebene) => {
    const v1 = json(datei);
    const { meldung, hinweise } = migriereV1(v1, FEST);
    gleichWieAjv(ebene === "land" ? SCHEMA_LAND : SCHEMA_BUND, meldung, true);
    expect(fehlerDerReferenzpruefung(meldung)).toEqual([]);
    expect(meldung.entstehung.migration).toEqual({ von: v1.schema, am: "2026-11-01T10:00+01:00", werkzeug: "scripts/lead-meldung-v2.mjs 2.0", hinweise });
    expect(meldung.sachverhalte).toHaveLength(v1.sachverhalte.length);
  });

  it("Migration ist bei festen Kennungen und fester Uhr reproduzierbar und verändert die Eingabe nicht", () => {
    const v1 = json("profile/lead-beispiel/beispiele/orkantief-ilka/LEAD-Meldung_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json");
    const vorher = JSON.stringify(v1);
    expect(migriereV1(v1, FEST)).toEqual(migriereV1(v1, FEST));
    expect(JSON.stringify(v1)).toBe(vorher);
  });

  it("lehnt fremde Schemakennungen ab", () => {
    expect(() => migriereV1({ schema: "Lagebild-Justiz-Meldung-v1" })).toThrow(/Nicht migrierbar/);
  });
});
