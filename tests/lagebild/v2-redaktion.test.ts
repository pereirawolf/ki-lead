// UP-2026-W45-06, Teil App (0.8.3): sachverhaltsübergreifende Lage im Kernschema (LEAD-MELDUNG-V2.md Nachtrag 11),
// Redaktionscheck auf v2-Feldern mit dem Hinweis „Kennzahl als Beleg prüfen“ (KENNZAHL_BELEG), Eingangsschema der
// eigenen Kennung (Profilformat 1.33), Bewertungstext und Handlungsbedarf aus den Feldern für Lagebild und Kopiervorlage.
// Unabhängiges Soll: von Hand abgeleitete Werte aus der festen Beispielmeldung formate/lead-meldung-v2/beispiele (TH 10:30)
// und von Hand gesetzten Abwandlungen; kein Zufall.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as kern from "../../src/kern/meldung-v2.js";
import { referenzBefunde } from "../../src/kern/referenzen";
import { pruefeRoh } from "../../src/kern/validierung";
import { bewertungTextV2, handlungsbedarfTextV2 } from "../../src/kern/v2darstellung";
import { leseFrist } from "../../src/kern/kennsaetze";
import { alleSachverhalte, einlesen, type LagebildDatei } from "../../src/lagebild/lagebild";
import { befundListe, fristV2, kennsaetzeFuer, kennzahlBelegHinweis, redaktionscheck } from "../../src/lagebild/redaktion";
import { kopiervorlageText } from "../../src/lagebild/ausgabe";
import { kennungenUndZeitstrahlV2 } from "../../src/pipeline/nachbearbeitung-v2";
import { ausgabeSchemaKi } from "../../src/pipeline/ausgabeschema";
import type { Befund } from "../../src/kern/typen";
import { referenzAjv } from "../support/ajv";
import { repoPfad } from "../support/dateien";
import { v2Profil } from "../support/v2profil";

const json = (pfad: string) => JSON.parse(readFileSync(repoPfad(pfad), "utf-8"));
const TH = () => json("formate/lead-meldung-v2/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json");
const K1 = "DE-TH-20261014-K7QM";
const K2 = "DE-TH-20261014-P5VN";
const datei = (name: string, d: unknown): LagebildDatei => ({ name, text: JSON.stringify(d), importiertAm: "2026-10-14T12:00:00Z" });
const fehler = (d: unknown) => kern.pruefeReferenzen(d).filter((b) => b.stufe === "fehler");

/** Übergreifende Lage für die Beispielmeldung TH 10:30 (zwei Sachverhalte), von Hand */
const UL = {
  kernaussage: "Sturmschäden und Stromausfall binden dieselben Kräfte im Süden des Landes [Q2].",
  sachverhalte: [K1, K2],
  handlungsbedarf: {
    massnahmen: [],
    empfehlungen: [
      { id: "E1", adressat: "Landkreise im Süden", auftrag: "Kräfte für Räumung und Netzersatz gemeinsam disponieren.", termin: null, quellen: ["Q2"] },
    ],
    fristen: [
      {
        id: "F1",
        bis: "2026-10-16",
        aufgabe: "gemeinsame Kräfteplanung abstimmen",
        adressat: "Land und Landkreise",
        grundlage: "Wiederversorgungsprognose 16.10.",
        quellen: ["Q3"],
        empfehlung: "E1",
      },
    ],
  },
  offene_fragen: ["Reichen die Kräfte für beide Lagen, wenn Frost einsetzt [Q1]?"],
};

describe("UP-2026-W45-06: übergreifende Lage im Kernschema (Nachtrag 11)", () => {
  it("optional; mit Feld schemagültig nach Ajv und eigenem Prüfer, ohne Fehler der Referenzprüfung", async () => {
    const p = await v2Profil("land");
    const ohne = TH();
    const mit = { ...TH(), uebergreifende_lage: UL };
    for (const d of [ohne, mit]) {
      expect(pruefeRoh(p.schema, d)).toEqual([]);
      const ajv = referenzAjv();
      expect(ajv.validate(p.schema, d), JSON.stringify(ajv.errors)).toBe(true);
      expect(fehler(d)).toEqual([]);
    }
  });

  it("Kernaussage ist Pflicht und ab „zur_freigabe“ nicht leer; im Entwurf darf sie leer sein", async () => {
    const p = await v2Profil("land");
    const { kernaussage: _k, ...ohneKern } = UL;
    expect(pruefeRoh(p.schema, { ...TH(), uebergreifende_lage: ohneKern }).length).toBeGreaterThan(0);
    const leer = { ...TH(), uebergreifende_lage: { ...UL, kernaussage: " " } };
    expect(pruefeRoh(p.schema, leer).length).toBeGreaterThan(0);
    expect(pruefeRoh(p.schema, { ...leer, status: "entwurf" })).toEqual([]);
  });

  it("Referenzprüfung: unbekannte Kennung, offener Beleg, Frist auf fehlende Empfehlung, Fehlanzeige sind Fehler; ein Sachverhalt ist ein Hinweis", () => {
    const d = {
      ...TH(),
      uebergreifende_lage: {
        ...UL,
        kernaussage: "Text [Q9]",
        sachverhalte: [K1, "DE-TH-20261014-ZZZZ"],
        handlungsbedarf: { ...UL.handlungsbedarf, fristen: [{ ...UL.handlungsbedarf.fristen[0], empfehlung: "E7" }] },
      },
    };
    expect(fehler(d).map((b) => b.pfad)).toEqual([
      "uebergreifende_lage.kernaussage",
      "uebergreifende_lage.handlungsbedarf.fristen[0].empfehlung",
      "uebergreifende_lage.sachverhalte[1]",
    ]);
    const eins = { ...TH(), sachverhalte: [TH().sachverhalte[0]], uebergreifende_lage: { kernaussage: "x", sachverhalte: [K1] } };
    expect(kern.pruefeReferenzen(eins)).toContainEqual(expect.objectContaining({ stufe: "hinweis", pfad: "uebergreifende_lage" }));
    const fa = {
      ...TH(),
      sachverhalte: [],
      fehlanzeige: { umfang: "Land", zeitraum: { von: "2026-10-14", bis: "2026-10-14" }, erklaerung: "nichts" },
      uebergreifende_lage: { kernaussage: "x" },
    };
    expect(fehler(fa).map((b) => b.text)).toContain("übergreifende Lage neben einer Fehlanzeige");
  });

  it("Ausgabeschema für die KI enthält das Feld (ohne Muster), die App ersetzt Platzhalter und entfernt fremde Verweise", async () => {
    const p = await v2Profil("land");
    const ki = ausgabeSchemaKi(p);
    expect(ki.properties.uebergreifende_lage).toEqual({ $ref: "#/$defs/uebergreifende_lage" });
    expect(ki.$defs.uebergreifende_lage.required).toEqual(["kernaussage"]);
    expect(JSON.stringify(ki.$defs.uebergreifende_lage)).not.toContain("pattern");

    const d: any = { ...TH(), sachverhalte: TH().sachverhalte.map((s: any, i: number) => ({ ...s, kennung: `NEU-${i + 1}` })) };
    d.uebergreifende_lage = { kernaussage: "x", sachverhalte: ["NEU-2", "NEU-1", "DE-XX-20261014-ABCD"] };
    const befunde: Befund[] = [];
    const zufall = (() => {
      let i = 0;
      return () => (((i++ * 0.137) % 1) + 1) % 1;
    })();
    kennungenUndZeitstrahlV2(d, p, { vor: undefined, eigene: [], fremde: [], jetzt: new Date("2026-10-14T08:30:00Z"), zone: "Europe/Berlin", zufall }, befunde);
    const [n1, n2] = d.sachverhalte.map((s: any) => s.kennung);
    expect(n1).not.toBe(n2);
    expect(d.uebergreifende_lage.sachverhalte).toEqual([n2, n1]);
    expect(befunde.find((b) => b.code === "UEBERGREIFEND_VERWEIS")?.text).toContain("„DE-XX-20261014-ABCD“");
  });
});

describe("UP-2026-W45-06: Bewertungstext und Handlungsbedarf aus v2-Feldern", () => {
  it("Bewertungstext in der Form der Kennsätze; Fristen lesbar wie v1 (leseFrist)", () => {
    const sv = TH().sachverhalte[1];
    const t = bewertungTextV2(sv);
    const zeilen = t.split("\n");
    expect(zeilen[0]).toBe(`Kernaussage: ${sv.bewertung.kernaussage}`);
    expect(zeilen[1]).toBe("Referenzraum: Landkreis Sonneberg im Land Thüringen");
    expect(zeilen[2]).toMatch(/^Beurteilung „erheblich“: fast 10\.000 Personen/);
    expect(zeilen[3]).toMatch(/^Tendenz „Verschärfung“ \(Landkreis Sonneberg, 14\.10\. bis 16\.10\.\): Die Wiederversorgung/);
    expect(zeilen).toContain(
      "Neubewertung bei: Ausfall eines Notstromaggregats; Verschiebung der Prognose über 16.10. hinaus; Bestätigung einer provisorischen Einspeisung",
    );
    const frist = zeilen.find((z) => z.startsWith("Handlungsrelevant bis:"))!;
    expect(frist).toBe(
      "Handlungsrelevant bis: 15.10.2026, 12:00 – Nachbetankung der Notstromaggregate in Pflegeheimen und Wasserversorgung, Landkreis Sonneberg – vor Ende der Dieselvorräte der Pflegeheime (15.10. abends); Grundlage: Angaben der Heime und des Zweckverbands in der Lagemeldung des Landratsamts [Q3]",
    );
    expect(leseFrist(frist.slice("Handlungsrelevant bis:".length), "Europe/Berlin").datum?.toISOString()).toBe("2026-10-15T10:00:00.000Z");
    expect(zeilen).toContain(
      "Abweichende Bewertung: Landkreis Sonneberg „kritisch“ – eingeschränkter Notruf und Pflegeheime auf Notstrom [Q3]. Ursache: Maßstab. Klärend wäre: Bestätigung der Nachbetankung bis 15.10. mittags.",
    );
  });

  it("Handlungsbedarf: Maßnahmen mit Stelle, Status und Stand, Empfehlungen mit Adressat", () => {
    const h = handlungsbedarfTextV2(TH().sachverhalte[0].handlungsbedarf).split("\n");
    expect(h[0]).toBe(
      "[M1] Räumung von Straßen und Wegen (Straßenmeistereien, Feuerwehren und ThüringenForst in den betroffenen Landkreisen, begonnen, Stand 14.10.2026, 08:30) [Q2]",
    );
    expect(h[1]).toMatch(/^\[E1\] Landkreise: Erreichbarkeit der Kammorte/);
  });

  it("Lagebild und Kopiervorlage: Bewertungstext aus den Feldern, Handlungsbedarf als eigener Block", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    const { eintraege } = einlesen([datei("th.json", TH())], p);
    const svs = alleSachverhalte(eintraege, p);
    expect(svs.map((s) => s.bewertungText.split("\n")[0])).toEqual(TH().sachverhalte.map((s: any) => `Kernaussage: ${s.bewertung.kernaussage}`));
    const text = kopiervorlageText(svs[1]!, p);
    expect(text).toContain("Maßnahmen & Handlungsempfehlungen\n[M1] Acht Notfalltreffpunkte");
    expect(text).toContain("Handlungsrelevant bis: 15.10.2026, 12:00");
  });
});

describe("UP-2026-W45-06: Redaktionscheck auf v2-Feldern", () => {
  /** Abwandlung der Beispielmeldung: Abschluss, Änderung, hohe Beurteilung ohne Neubewertung, Kennzahl aus Baustein */
  function abgewandelt() {
    const d = TH();
    const [s1, s2] = d.sachverhalte;
    s1.bewertung.abschluss = { ende: "2026-10-14", offene_punkte: "nichts", nachsorge: "Landkreise" };
    s1.bewertung.aenderung_zur_vormeldung = "Zahl gesperrter Landesstraßen von 15 auf 12 gesunken";
    s2.bewertung.neubewertung_bei = [];
    s2.kennzahlen = [
      {
        id: "K1",
        gegenstand: "Einsatzmittel frei für überörtliche Hilfe",
        einheit: "Einsatzmittel",
        art: "bestand",
        wert: 21,
        mindestwert: false,
        erhebung: "gezaehlt",
        raum: "Landkreis Sonneberg",
        datenstand: "2026-10-14T10:00+02:00",
        quellen: ["Q6"],
      },
    ];
    s2.module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [
        {
          format: "Thessa-Kennzahlen",
          fassung: "0.3",
          datei: "x.json",
          sha256: "0".repeat(64),
          quelle: "Q6",
          kennzahlen: [{ kennzahl: "K1", baustein_kennzahl: "K3" }],
        },
      ],
    };
    d.uebergreifende_lage = UL;
    return d;
  }

  it("Zeitfenster aus handlungsbedarf.fristen und der übergreifenden Lage, gegen die nächste Ausgabe eingestuft", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    const { eintraege } = einlesen([datei("th.json", abgewandelt())], p);
    const red = redaktionscheck(eintraege, p, "2026-10-15T18:00", new Date("2026-10-14T12:00:00Z"));
    expect(red.zeit.map((z) => [z.sv.bezeichnung, z.datum?.toISOString(), z.genauigkeit, z.klasse])).toEqual([
      [TH().sachverhalte[1].bezeichnung, "2026-10-15T10:00:00.000Z", "minute", "alert"],
      ["Übergreifende Lage", "2026-10-16T21:59:00.000Z", "tag", "ok"],
    ]);
    expect(red.zeit[1]!.text).toBe("F1: 16.10.2026 – gemeinsame Kräfteplanung abstimmen, Land und Landkreise; Grundlage: Wiederversorgungsprognose 16.10.");
    expect(red.abdeckung.nichtKonfiguriert).toEqual([]);
  });

  it("Abweichung, Abschluss, Änderung und formale Vollständigkeit aus den Feldern; Beschriftungen ohne Kennsätze im Profil", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    p.manifest.meldung.schema_id = "LEAD-Meldung-v2";
    expect(p.ui.kennsaetze).toBeUndefined();
    const { eintraege } = einlesen([datei("th.json", abgewandelt())], p);
    const red = redaktionscheck(eintraege, p, "2026-10-15T18:00", new Date("2026-10-14T12:00:00Z"));
    expect(red.vermerkt.map((x) => x.text)).toEqual([
      "Landkreis Sonneberg „kritisch“ – eingeschränkter Notruf und Pflegeheime auf Notstrom. Ursache: Maßstab. klärend: Bestätigung der Nachbetankung bis 15.10. mittags",
    ]);
    expect(red.abschluss.map((x) => x.text)).toEqual(["Ende 14.10.2026; offen: nichts; Nachsorge: Landkreise"]);
    expect(red.aenderung.map((x) => x.text)).toEqual(["Zahl gesperrter Landesstraßen von 15 auf 12 gesunken"]);
    // hohe Beurteilung „erheblich“ ohne Neubewertungsanlass; Sachverhalt 1 ist geringfügig und abgeschlossen
    expect(red.kern.map((x) => [x.sv.index, x.fehlt])).toEqual([[1, ["keine Angaben in „Neubewertung bei“"]]]);
    const liste = befundListe(red, p);
    expect(liste.find((b) => b.abschnitt === 2 && b.klasse === "info" && b.text.startsWith("Abweichende Bewertung:"))).toBeTruthy();
    expect(liste.some((b) => b.text.includes("undefined"))).toBe(false);
    expect(kennsaetzeFuer(p).abschluss).toBe("Abschluss im Lagebild:");
  });

  it("Hinweis „Kennzahl als Beleg prüfen“ in Abschnitt 5 mit Belegachsen nach Thessa (D1, D4, D5, D8)", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    const { eintraege } = einlesen([datei("th.json", abgewandelt())], p);
    const soll =
      "Kennzahl als Beleg prüfen: Kennzahlen aus Kennzahlen-Bausteinen übernommen in " +
      `${TH().sachverhalte[1].bezeichnung} (mögliche Belegachsen nach Thessa: D1, D4, D5, D8). Beurteilung und Lagenradar bleiben eine Entscheidung nach Kodierleitfaden und SOP; die App setzt keine Stufe.`;
    expect(kennzahlBelegHinweis(eintraege[0]!, p)).toBe(soll);
    const red = redaktionscheck(eintraege, p, "2026-10-15T18:00", new Date("2026-10-14T12:00:00Z"));
    expect(red.quellen).toHaveLength(1);
    expect(red.quellen[0]!.zeilen).toEqual([soll]);
    expect(red.quellen[0]!.klasse).toBe("info");
    // ohne Radar im Profil keine Belegachsen
    const ohne = { ...p, ui: { ...p.ui, rollen: { ...p.ui.rollen, sv_radar: undefined } } };
    expect(kennzahlBelegHinweis(eintraege[0]!, ohne)).toContain("übernommen in " + TH().sachverhalte[1].bezeichnung + ". Beurteilung bleiben");
  });

  it("Fehler der Referenzprüfung erscheinen in Abschnitt 5; Kennungen mit sechs Zufallszeichen und Bezug als Objekt", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    p.ui.rollen.sv_bezug = "bezug";
    const d = TH();
    d.sachverhalte[0].analyse.lage_ereignis += " [Q12]";
    d.sachverhalte[1].kennung = "DE-TH-20261014-P5VN7Q";
    d.sachverhalte[1].bezug = [{ kennung: "KRITIS-NETZSUED-20261013-N4ST7Q", art: "verdichtung" }];
    const { eintraege } = einlesen([datei("th.json", d)], p);
    const red = redaktionscheck(eintraege, p, "2026-10-15T18:00", new Date("2026-10-14T12:00:00Z"));
    expect(red.quellen[0]!.zeilen).toContain("Referenzprüfung: Q12 steht nicht im Quellenverzeichnis (sachverhalte[0].analyse.lage_ereignis).");
    expect(red.kennungen.map((k) => [k.art, k.kennung])).toEqual([["bezug", "KRITIS-NETZSUED-20261013-N4ST7Q"]]);
  });

  it("fristV2: Kalendertag bis 23:59 in der Zone, Zeitpunkt mit Versatz, unbekannt ohne Datum", () => {
    expect(fristV2({ bis: "2026-10-16", aufgabe: "a" }, "Europe/Berlin").datum?.toISOString()).toBe("2026-10-16T21:59:00.000Z");
    expect(fristV2({ bis: "2026-10-15T12:00+02:00", aufgabe: "a" }, "Europe/Berlin")).toMatchObject({ genauigkeit: "minute" });
    expect(fristV2({ bis: null, aufgabe: "a" }, "Europe/Berlin")).toEqual({ text: "Termin unbekannt – a", datum: null, genauigkeit: "minute" });
  });
});

describe("UP-2026-W45-06: Eingangsschema der eigenen Kennung (Profilformat 1.33)", () => {
  it("Kreismeldung im Beispielprofil: ohne Eingangsschema Schemabefund zur Ebene, mit Eingangsschema ohne Befund", async () => {
    const p = await v2Profil("bund");
    const kreis = { ...TH(), absender: { stelle: "Landratsamt Sonneberg", ebene: "Kreis", gebiet: { name: "Landkreis Sonneberg", schluessel: "16072" } } };
    const ohne = einlesen([datei("kreis.json", kreis)], p).eintraege[0]!;
    expect(ohne.schema.length).toBeGreaterThan(0);
    p.eingangSchemata = { "LEAD-Meldung-v2": { schema: json("formate/lead-meldung-v2/eingang/meldung.schema.json") } };
    const mit = einlesen([datei("kreis.json", kreis)], p).eintraege[0]!;
    expect(mit.fremd).toBeNull();
    expect(mit.schema).toEqual([]);
    expect(referenzBefunde(mit.daten).filter((b) => b.stufe === "fehler")).toEqual([]);
  });

  it("das Eingangsschema ist aus der Zusammenstellung erzeugt und lässt jede Ebene außer der Pflicht des Moduls zu", () => {
    const z = json("formate/lead-meldung-v2/zusammenstellungen/lead-eingang.json");
    const soll = kern.stelleSchemaZusammen(z, (d: string) => json(`formate/lead-meldung-v2/${d}`));
    expect(json("formate/lead-meldung-v2/eingang/meldung.schema.json")).toEqual(soll);
    expect(soll.properties.absender.properties.ebene).toEqual({ enum: ["Bund", "Land", "Kreis", "Gemeinde", "Einsatzstelle", "Betreiber", "Sonstige"] });
    expect(soll.$defs.quelle.properties.kategorie.enum).toEqual(["A", "B", "W", "M", "P"]);
  });
});
