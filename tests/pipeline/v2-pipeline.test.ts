// KI-Pipeline nach LEAD-Meldung-v2 (seit 0.8.0, UP-2026-W45-04, Paket 4 des Umstellungsplans): Ausgabeschema ohne
// Bedingungen, Nachbearbeitung mit Identität, Absender, Zeit und Entstehung, Kennungsvergabe, Bezug und Zeitstrahl je
// Sachverhalt, Übernahme aus Kennzahlen-Bausteinen (Modul lead-baustein), Steuerung und Reparatur, Management Summary.
// Testprofil: Landes- bzw. Beispielprofil mit der Zusammenstellung unter formate/lead-meldung-v2/beispiel(-land) und
// der Vorlage der Darstellungsdatei (die Profile selbst bleiben bis Paket 6 auf v1). Soll unabhängig vom Code: das
// fiktive v2-Beispiel Thüringen („Ilka“), die unveränderten Bausteine aus Thessa und KSNV und von Hand gesetzte Werte.
// Alle Daten fiktiv; keine KI-Aufrufe (Skriptanbieter).
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import { beforeAll, describe, expect, it } from "vitest";
import { strengesSchema } from "../../src/anbieter/schema";
import { bausteineUebernehmen } from "../../src/kern/bausteinuebernahme";
import { referenzBefunde } from "../../src/kern/referenzen";
import type { Befund, Meldung, Profil } from "../../src/kern/typen";
import { pruefeGegenSchema } from "../../src/kern/validierung";
import { APP_FELDER_V2, ausgabeSchemaKi, istV2Profil } from "../../src/pipeline/ausgabeschema";
import { BAUSTEIN_REGEL_V2, profilGrundlagen, steuerungsBlock, v2Ausgaberegeln } from "../../src/pipeline/kontext";
import { fristen, kurzfassungTreue, meldungFuerKurzfassung } from "../../src/pipeline/kurzfassung";
import { dateiLesen, type Material } from "../../src/pipeline/material";
import {
  bausteineImMaterial,
  kennungenUndZeitstrahlV2,
  nachbearbeitenV2,
  uuidV7,
  v2Vorgaben,
  zeitenErgaenzen,
  type V2Ausgabe,
} from "../../src/pipeline/nachbearbeitung-v2";
import { reparaturSystem, stufe2und3 } from "../../src/pipeline/s2s3";
import type { Kontext } from "../../src/pipeline/stufen";
import { meldungsAntwort, skriptAnbieter } from "../support/anbieter";
import { profilPflicht, repoPfad, V1_PROFIL } from "../support/dateien";
import { pipelineKontext } from "../support/pipeline";
import { v2Profil } from "../support/v2profil";

const json = (pfad: string) => JSON.parse(readFileSync(repoPfad(pfad), "utf-8"));
const kopie = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const BEISPIEL_TH = "formate/lead-meldung-v2/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json";
const SONNEBERG = "profile/lead-thueringen/beispiele/orkantief-ilka-thessa/kennzahlen_Landkreis-Sonneberg_2026-10-14T10-00_FIKTIV.json";
const KSNV_KREIS = "formate/fremd/ksnv-kennzahlen/beispiele/2026-11-06T09-05_KSNV-Kennzahlen_kreis-16063_FIKTIV.json";
const STELLE = "Lagezentrum des Landes (Beispiel)";
const UUID7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let land: Profil;
let bund: Profil;
beforeAll(async () => {
  land = await v2Profil("land", { mitDarstellung: true });
  bund = await v2Profil("bund", { mitDarstellung: true });
});

/** KI-Ausgabe nach dem Ausgabeschema: das v2-Beispiel ohne die Felder der App, neue Sachverhalte mit Platzhalter */
function kiAusgabe(): Meldung {
  const m = kopie(json(BEISPIEL_TH));
  for (const f of APP_FELDER_V2) delete m[f];
  m.entstehung = { regelwerk: { sop: [{ kennung: "B01" }] } };
  m.sachverhalte[0].kennung = "NEU-1";
  m.sachverhalte[1].kennung = "NEU-2";
  return m;
}

/** Eigene Vormeldung: das v2-Beispiel mit der Stelle des Profils, Stand 14.10.2026 06:00, eine Zeitstrahlzeile */
function vormeldung(): Meldung {
  const m = kopie(json(BEISPIEL_TH));
  m.absender.stelle = STELLE;
  m.meldezeitpunkt = "2026-10-14T06:00+02:00";
  m.status = "freigegeben";
  m.sachverhalte[0].zeitstrahl = [
    {
      id: "Z1",
      zeit: "2026-10-13T21:00+02:00",
      typ: "Maßnahme",
      text: "A 71 zwischen Ilmenau-Ost und Suhl gesperrt.",
      quellen: ["Q8"],
      erstmals_gemeldet: "2026-10-14T06:00+02:00",
    },
  ];
  return m;
}

async function kontextV2(p: Profil, material: Material[] = [], t0 = "2026-10-14T10:30", jetzt = "2026-10-14T10:40:00+02:00"): Promise<Kontext> {
  const { k } = await pipelineKontext(skriptAnbieter([]), material, { jetzt, profilName: "lead-thueringen" });
  k.profil = p;
  k.lauf.bestaetigt = {
    gegenstand: "Orkantief Ilka in Thüringen",
    stichtag: t0.slice(0, 10),
    meldezeitpunkt: t0,
    referenzbezug: "Land Thüringen",
    horizont: "",
    sachverhalte: [
      { titel: "Sturmschäden", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "" },
      { titel: "Stromausfall", ereignisarten: ["Stromausfall / Blackout"], sops: ["b08"], begruendung: "" },
    ],
    prueffrage: "",
    hinweise: "",
  };
  k.lauf.stufen.push({ stufe: "S1 Gegenstand und SOP-Auswahl", start: "", modell: "claude-sonnet-5-5" });
  return k;
}

const aus = (): V2Ausgabe => ({ korrekturen: [], sopHinweise: [], umhaengungen: [], befunde: [] });
const codes = (b: Befund[]) => b.map((x) => x.code).filter(Boolean);
const referenzFehler = (d: Meldung, p: Profil) => referenzBefunde(d, p.ui).filter((b) => b.stufe === "fehler");
let zaehler = 0;
/** Feste Zufallsfolge (Kennungen und meldung_id reproduzierbar) */
const zufall = () => {
  zaehler = 0;
  return () => ((zaehler++ * 7) % 32) / 32;
};
async function bausteinMaterial(pfad: string): Promise<Material> {
  const daten = json(pfad);
  return dateiLesen(new File([JSON.stringify(daten, null, 2)], pfad.split("/").pop()!, { type: "application/json" }), await profilPflicht("lead-thueringen"));
}

describe("UP-2026-W45-04: Ausgabeschema für die KI (LEAD-MELDUNG-V2.md Abschnitt 13 Nr. 2)", () => {
  it("v2: ohne Bedingungen und Muster, ohne die Felder der App, nur bekannte Module, Bewertung Pflicht", () => {
    expect(istV2Profil(land)).toBe(true);
    const s = ausgabeSchemaKi(land);
    const text = JSON.stringify(s);
    for (const wort of ["allOf", "if", "then", "else", "not", "pattern", "propertyNames", "patternProperties"]) expect(text).not.toContain(`"${wort}":`);
    // „format“ nur als Feldname (Modul lead-baustein), nie als Schlüsselwort mit Formatangabe
    expect(text).not.toMatch(/"format":"(date|date-time|uri|email|uuid)/);
    for (const f of ["schema", "fassung", "meldung_id", "beziehungen", "status", "absender", "meldezeitpunkt", "zeitzone", "freigabe"]) {
      expect(s.properties[f], f).toBeUndefined();
      expect(s.required, f).not.toContain(f);
    }
    expect(Object.keys(s.properties.entstehung.properties)).toEqual(["regelwerk"]);
    expect(s.$defs.zeitstrahl_zeile.properties.erstmals_gemeldet).toBeUndefined();
    expect(s.$defs.zeitstrahl_zeile.required).not.toContain("erstmals_gemeldet");
    expect(s.$defs.modul_lead_baustein_baustein.properties.sha256).toBeUndefined();
    expect(s.$defs.module.additionalProperties).toBe(false);
    expect(Object.keys(s.$defs.module.properties)).toEqual(["lead-bevoelkerungsschutz", "lead-baustein"]);
    expect(s.$defs.sachverhalt.required).toContain("bewertung");
    expect(s.$defs.sachverhalt_vollstaendig).toBeUndefined();
  });

  it("v2: das Beispiel ohne die Felder der App ist gültig; strenges Schema für Structured Outputs ohne offene Objekte", () => {
    const s = ausgabeSchemaKi(land);
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const pruefe = ajv.compile(s);
    expect(pruefe(kiAusgabe()), JSON.stringify(pruefe.errors)).toBe(true);
    const streng = strengesSchema(s);
    const offen: string[] = [];
    const besuche = (x: any, pfad: string) => {
      if (!x || typeof x !== "object") return;
      if (x.properties && x.additionalProperties !== false) offen.push(pfad);
      for (const [k, v] of Object.entries(x)) besuche(v, `${pfad}.${k}`);
    };
    besuche(streng, "");
    expect(offen).toEqual([]);
  });

  it("v1: das Profilschema bleibt unverändert (Profile bleiben bis Paket 6 auf v1)", async () => {
    const v1 = await profilPflicht(V1_PROFIL);
    expect(istV2Profil(v1)).toBe(false);
    expect(ausgabeSchemaKi(v1)).toBe(v1.schema);
  });

  it("Systemauftrag: v2 nennt das Ausgabeschema und die Ausgaberegeln, v1 das Profilschema", async () => {
    const g = profilGrundlagen(land);
    expect(g).toContain("## Ausgabeschema der Meldung (Schemakennung LEAD-Meldung-v2, von der App abgeleitet)");
    expect(g).toContain("## Ausgabe nach LEAD-Meldung-v2 (von der App vorgegeben)");
    expect(g).not.toContain('"allOf"');
    // Seit 0.9.0 steht die Arbeitsanweisung des Landesprofils auf Feldern: keine Zuordnung der Kennsätze; die Testfassung aus
    // dem v1-Beispielprofil nennt noch v1-Felder und erhält sie
    expect(v2Ausgaberegeln(land)).not.toContain("„Handlungsrelevant bis:“ → `handlungsbedarf.fristen`");
    expect(v2Ausgaberegeln(await v2Profil("bund"))).toContain("„Handlungsrelevant bis:“ → `handlungsbedarf.fristen`");
    const v1 = await profilPflicht(V1_PROFIL);
    expect(profilGrundlagen(v1)).toContain("## JSON-Schema der Meldung (Schemakennung LEAD-Meldung-v1)");
  });

  it("Reparatur: v2 mit Ausgabeschema der KI und Hinweis auf die Felder der App", async () => {
    const r = reparaturSystem(land);
    expect(r).toContain("Ausgabeschema der KI");
    expect(r).not.toContain('"allOf"');
    expect(r).toContain("Befunde zu ihnen behebt die App");
    expect(reparaturSystem(await profilPflicht(V1_PROFIL))).not.toContain("Ausgabeschema");
  });
});

describe("UP-2026-W45-04: Nachbearbeitung nach v2 (Abschnitte 1, 2 und 6)", () => {
  it("Erfassung: Identität, Status, Absender, t0 mit Versatz, Freigabe leer; Ergebnis schemagültig ohne Referenzfehler", async () => {
    const k = await kontextV2(land);
    const a = aus();
    const roh = kiAusgabe();
    roh.absender = { stelle: "Landratsamt Sonneberg", ebene: "Kreis", gebiet: { name: "Landkreis Sonneberg" } };
    roh.freigabe = { freigegeben: { name: "KI", zeitpunkt: "2026-10-14T10:00+02:00" } };
    const d = nachbearbeitenV2(roh, k, "claude-opus-5-5", a, { zufall: zufall() });
    expect(pruefeGegenSchema(land.schema, d, land.ui)).toEqual([]);
    expect(referenzFehler(d, land)).toEqual([]);
    expect(d.schema).toBe("LEAD-Meldung-v2");
    expect(d.fassung).toBe("2.0");
    expect(d.meldung_id).toMatch(UUID7);
    expect(d.status).toBe("entwurf");
    expect(d.absender).toEqual({ stelle: STELLE, ebene: "Land", gebiet: { name: "Thüringen", schluessel: "DE-TH" } });
    expect(d.meldezeitpunkt).toBe("2026-10-14T10:30+02:00");
    expect(d.zeitzone).toBe("Europe/Berlin");
    expect(d.freigabe).toEqual({});
    expect(d.beziehungen).toBeUndefined();
    expect(a.korrekturen).toEqual(["absender.stelle: „Landratsamt Sonneberg“ → „Lagezentrum des Landes (Beispiel)“"]);
    expect(roh.absender.stelle).toBe("Landratsamt Sonneberg"); // der Entwurf selbst bleibt unverändert
  });

  it("Beispielprofil (Bund und Länder): Absender Bund mit Schlüssel DE, Kennung mit Präfix DE", async () => {
    const k = await kontextV2(bund);
    const d = nachbearbeitenV2(kiAusgabe(), k, "m", aus(), { zufall: zufall() });
    expect(d.absender).toEqual({ stelle: "Koordinierungsstelle (Beispiel)", ebene: "Bund", gebiet: { name: "Bund", schluessel: "DE" } });
    expect(d.sachverhalte[0].kennung).toMatch(/^DE-20261014-[0-9A-HJKMNP-TV-Z]{6}$/);
    expect(pruefeGegenSchema(bund.schema, d, bund.ui)).toEqual([]);
  });

  it("Entstehung: Verfahren, Werkzeug, Profil, beigefügte SOPs, Kodierleitfaden, Arbeitsanweisung, Modelle je Stufe, Lauf", async () => {
    const k = await kontextV2(land);
    k.lauf.stufen.push(
      { stufe: "S2 Recherche und Entwurf", start: "", modell: "claude-opus-5-5" },
      { stufe: "S3 Reparatur 1", start: "", modell: "claude-haiku-5-5" },
    );
    const a = aus();
    const d = nachbearbeitenV2(kiAusgabe(), k, "claude-opus-5-5", a);
    const e = d.entstehung;
    expect(e.verfahren).toBe("KI-Entwurf");
    expect(e.erstellt).toBe("2026-10-14T10:40+02:00");
    expect(e.werkzeug.name).toBe("KI-LEAD");
    expect(e.profil).toEqual({ id: land.manifest.id, version: land.manifest.version });
    expect(e.regelwerk.sop.map((s: any) => s.kennung)).toEqual(["B01", "B08"]);
    expect(e.regelwerk.sop[0]).toMatchObject({ bezeichnung: "Unwetter / Sturm" });
    expect(e.regelwerk.kodierleitfaden).toMatch(/^Kodierleitfaden LEAD \d+\.\d+/);
    expect(e.regelwerk.arbeitsanweisung).toMatch(/^Arbeitsanweisung Erfassung \d+\.\d+/);
    expect(e.modelle).toEqual([
      { stufe: "S1", anbieter: "anthropic", modell: "claude-sonnet-5-5" },
      { stufe: "S2", anbieter: "anthropic", modell: "claude-opus-5-5" },
      { stufe: "S3", anbieter: "anthropic", modell: "claude-haiku-5-5" },
    ]);
    expect(e.lauf_id).toBe(k.lauf.id);
    // Angabe der KI nur verglichen: B08 beigefügt, aber nicht genannt
    expect(a.sopHinweise.join(" ")).toContain("Beigefügt, von der KI aber nicht als angewandt genannt");
  });

  it("Zeitangaben: Wanduhrzeit erhält den Versatz der Zone, leere Zeitangabe wird null, Abruf ein Kalendertag", () => {
    const d = {
      meldezeitraum: { von: "2026-10-13", bis: "2026-10-14 10:00" },
      quellen: [{ zugriff: "2026-10-14T09:00", datenstand: "" }],
      sachverhalte: [{ eintritt: { zeit: "2026-01-13T19:00" } }],
    };
    expect(zeitenErgaenzen(d, "Europe/Berlin")).toBe(4);
    expect(d).toEqual({
      meldezeitraum: { von: "2026-10-13", bis: "2026-10-14T10:00+02:00" },
      quellen: [{ zugriff: "2026-10-14", datenstand: null }],
      sachverhalte: [{ eintritt: { zeit: "2026-01-13T19:00+01:00" } }],
    });
  });

  it("UUID Version 7: Zeitstempel vorn, Version und Variante gesetzt", () => {
    const id = uuidV7(new Date("2026-10-14T08:30:00Z"), () => 0.5);
    expect(id).toMatch(UUID7);
    expect(parseInt(id.replace(/-/g, "").slice(0, 12), 16)).toBe(Date.parse("2026-10-14T08:30:00Z"));
  });
});

describe("UP-2026-W45-04: Kennungen, Bezug und Zeitstrahl nach v2 (Abschnitte 3 und 5.2)", () => {
  it("Erfassung: Platzhalter werden Kennungen mit sechs Zufallszeichen, auch im Bezug; Zeilen erhalten erstmals_gemeldet = t0", async () => {
    const k = await kontextV2(land);
    const roh = kiAusgabe();
    roh.sachverhalte[1].bezug = [{ kennung: "NEU-1", art: "teilung" }];
    roh.sachverhalte[0].zeitstrahl = [{ id: "Z1", zeit: "2026-10-13T19:00", typ: "Ereignis", text: "Sturmfeld erreicht Thüringen.", quellen: ["Q1"] }];
    const a = aus();
    const d = nachbearbeitenV2(roh, k, "m", a, { zufall: zufall() });
    const [s1, s2] = d.sachverhalte;
    expect(s1.kennung).toMatch(/^DE-TH-20261014-[0-9A-HJKMNP-TV-Z]{6}$/);
    expect(s2.kennung).toMatch(/^DE-TH-20261014-[0-9A-HJKMNP-TV-Z]{6}$/);
    expect(s1.kennung).not.toBe(s2.kennung);
    expect(s2.bezug).toEqual([{ kennung: s1.kennung, art: "teilung" }]);
    expect(s1.zeitstrahl).toEqual([
      {
        id: "Z1",
        zeit: "2026-10-13T19:00+02:00",
        typ: "Ereignis",
        text: "Sturmfeld erreicht Thüringen.",
        quellen: ["Q1"],
        erstmals_gemeldet: "2026-10-14T10:30+02:00",
      },
    ]);
    expect(pruefeGegenSchema(land.schema, d, land.ui)).toEqual([]);
    expect(codes(a.befunde)).toContain("ZEIT_ERGAENZT");
  });

  it("Fortschreibung: Kennung und Zeilen der Vormeldung bleiben, Beziehung zur Vormeldung, Bewertungszeile der App", async () => {
    const vor = vormeldung();
    const k = await kontextV2(land, [{ id: "v", art: "meldung", name: "vor.json", groesse: 1, hash: "v", meldung: vor }]);
    const roh = kiAusgabe();
    roh.sachverhalte[0].kennung = vor.sachverhalte[0].kennung;
    roh.sachverhalte[1].kennung = vor.sachverhalte[1].kennung;
    roh.sachverhalte[0].bewertung.beurteilung = { stufe: "erheblich", begruendung: "Kammorte nicht erreichbar." };
    roh.sachverhalte[0].zeitstrahl = [
      // gleiche ID wie die Zeile der Vormeldung, anderer Text: Vormeldung bleibt, neue Zeile neu nummeriert
      { id: "Z1", zeit: "2026-10-14T05:30", typ: "Wiederherstellung", text: "A 71 wieder frei.", quellen: ["Q8"] },
      { id: "Z5", zeit: "2026-10-14T10:30", typ: "Bewertung", text: "Neubewertung.", quellen: [] },
    ];
    const a = aus();
    const d = nachbearbeitenV2(roh, k, "m", a, { zufall: zufall() });
    expect(d.beziehungen).toEqual([{ art: "fortschreibung_von", meldung_id: vor.meldung_id }]);
    expect(d.sachverhalte.map((s: any) => s.kennung)).toEqual(vor.sachverhalte.map((s: any) => s.kennung));
    expect(d.sachverhalte[0].zeitstrahl).toEqual([
      vor.sachverhalte[0].zeitstrahl[0],
      {
        id: "Z2",
        zeit: "2026-10-14T05:30+02:00",
        typ: "Wiederherstellung",
        text: "A 71 wieder frei.",
        quellen: ["Q8"],
        erstmals_gemeldet: "2026-10-14T10:30+02:00",
      },
      {
        id: "Z3",
        zeit: "2026-10-14T10:30+02:00",
        typ: "Bewertung",
        text: "Beurteilung geringfügig → erheblich",
        quellen: [],
        erstmals_gemeldet: "2026-10-14T10:30+02:00",
      },
    ]);
    expect(codes(a.befunde)).toEqual(expect.arrayContaining(["ZEITSTRAHL_VORMELDUNG", "ZEITSTRAHL_ID", "ZEITSTRAHL_BEWERTUNG_KI", "ZEITSTRAHL_BEWERTUNG"]));
    expect(pruefeGegenSchema(land.schema, d, land.ui)).toEqual([]);
    expect(referenzFehler(d, land)).toEqual([]);
  });

  it("Fortschreibung: fehlende Zeile der Vormeldung wird wiederhergestellt; Steuerung nennt Kennungen und nächste Zeile", async () => {
    const vor = vormeldung();
    const material: Material[] = [{ id: "v", art: "meldung", name: "vor.json", groesse: 1, hash: "v", meldung: vor }];
    const k = await kontextV2(land, material);
    const roh = kiAusgabe();
    roh.sachverhalte[0].kennung = vor.sachverhalte[0].kennung;
    const a = aus();
    const d = nachbearbeitenV2(roh, k, "m", a, { zufall: zufall() });
    expect(d.sachverhalte[0].zeitstrahl).toEqual(vor.sachverhalte[0].zeitstrahl);
    expect(a.befunde.find((b) => b.code === "ZEITSTRAHL_VORMELDUNG")?.text).toContain("Wiederhergestellt: Z1.");
    expect(v2Vorgaben(material, land)).toEqual({ kennungen: vor.sachverhalte.map((s: any) => s.kennung), naechsteZ: 2 });
  });

  it("Bezug: unbekannte Kennungen entfallen, bekannte erhalten die meldung_id der Meldung, in der sie stehen", async () => {
    const eingang = kopie(json(BEISPIEL_TH));
    eingang.absender = { stelle: "Landratsamt Sonneberg", ebene: "Kreis", gebiet: { name: "Landkreis Sonneberg" } };
    const d = kiAusgabe();
    d.meldezeitpunkt = "2026-10-14T10:30+02:00";
    d.sachverhalte[1].bezug = [
      { kennung: "DE-TH-20261014-P5VN", meldung_id: "00000000-0000-7000-8000-000000000000", art: "verdichtung" },
      { kennung: "DE-TH-20261014-ZZZZ" },
    ];
    const befunde: Befund[] = [];
    kennungenUndZeitstrahlV2(
      d,
      land,
      { eigene: [], fremde: [eingang], jetzt: new Date("2026-10-14T08:40:00Z"), zone: "Europe/Berlin", zufall: zufall() },
      befunde,
    );
    expect(d.sachverhalte[1].bezug).toEqual([{ kennung: "DE-TH-20261014-P5VN", meldung_id: eingang.meldung_id, art: "verdichtung" }]);
    expect(codes(befunde)).toEqual(expect.arrayContaining(["BEZUG_UNBEKANNT", "BEZUG_FEHLT"]));
  });

  it("Quellen-IDs der Vormeldung bleiben stabil: vertauschte IDs werden genannt, nicht gelöst", async () => {
    const vor = vormeldung();
    const k = await kontextV2(land, [{ id: "v", art: "meldung", name: "vor.json", groesse: 1, hash: "v", meldung: vor }]);
    const roh = kiAusgabe();
    roh.sachverhalte[0].kennung = vor.sachverhalte[0].kennung;
    roh.sachverhalte[1].kennung = vor.sachverhalte[1].kennung;
    [roh.quellen[0].id, roh.quellen[1].id] = ["Q2", "Q1"];
    const a = aus();
    nachbearbeitenV2(roh, k, "m", a, { zufall: zufall() });
    expect(a.befunde.find((b) => b.code === "QUELLE_ID_VORMELDUNG")?.text).toContain("Q1 der Vormeldung steht jetzt unter Q2");
  });
});

describe("UP-2026-W45-04: Übernahme aus Kennzahlen-Bausteinen (Modul lead-baustein, Entscheidungen vom 03.11.2026)", () => {
  it("KSNV: abweichende Werte werden aus dem Baustein wiederhergestellt, fehlende Kennzahl und Quelle angelegt, Teilmenge umgesetzt", async () => {
    const m = await bausteinMaterial(KSNV_KREIS);
    const baustein = json(KSNV_KREIS);
    const k = await kontextV2(land, [m], "2026-11-06T10:00", "2026-11-06T10:10:00+01:00");
    const roh = kiAusgabe();
    roh.sachverhalte[1].kennzahlen = [
      {
        id: "K1",
        gegenstand: "Tagesbedarf Diesel",
        einheit: "Liter",
        art: "bedarf",
        wert: 12000,
        mindestwert: false,
        erhebung: "geschaetzt",
        raum: "Wartburgkreis",
        datenstand: "2026-11-06",
        quellen: ["Q9"],
      },
    ];
    roh.sachverhalte[1].module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [
        {
          format: "KSNV-Kennzahlen",
          fassung: "0.1",
          quelle: "Q9",
          kennzahlen: [
            { kennzahl: "K1", baustein_kennzahl: "K1" },
            { kennzahl: "K2", baustein_kennzahl: "K2" },
          ],
        },
      ],
    };
    const a = aus();
    const d = nachbearbeitenV2(roh, k, "m", a, { zufall: zufall() });
    const [k1, k2] = d.sachverhalte[1].kennzahlen;
    const soll = (bk: any) => ({
      gegenstand: bk.gegenstand,
      einheit: bk.einheit,
      art: bk.art,
      wert: bk.wert,
      mindestwert: bk.mindestwert,
      erhebung: bk.erhebung,
      raum: bk.raum,
      datenstand: bk.datenstand,
    });
    expect(k1).toEqual({ id: "K1", ...soll(baustein.kennzahlen[0]), quellen: ["Q9"] });
    expect(k2).toEqual({ id: "K2", quellen: ["Q9"], ...soll(baustein.kennzahlen[1]), teilmenge_von: "K1" });
    expect(d.quellen.find((q: any) => q.id === "Q9")).toEqual({
      id: "Q9",
      ...(({ id: _i, ...r }) => r)(baustein.quellen[0]),
      anmerkung: `KSNV-Kennzahlen 0.1, Datei ${m.name}, SHA-256 ${m.hash}`,
    });
    expect(d.sachverhalte[1].module["lead-baustein"]).toEqual({
      fassung: "1.0",
      bausteine: [
        {
          format: "KSNV-Kennzahlen",
          fassung: "0.1",
          datei: m.name,
          sha256: m.hash,
          quelle: "Q9",
          kennzahlen: [
            { kennzahl: "K1", baustein_kennzahl: "K1" },
            { kennzahl: "K2", baustein_kennzahl: "K2" },
          ],
        },
      ],
    });
    const wieder = a.befunde.find((b) => b.code === "KENNZAHL_BAUSTEIN_ABWEICHUNG")!;
    expect(wieder.stufe).toBe("warnung");
    expect(wieder.text).toContain(
      "Sachverhalt 2 K1: gegenstand „Tagesbedarf Diesel“ → „Tagesbedarf Diesel (Notbetrieb ab 72 Stunden Stromausfall)“, einheit „Liter“ → „Liter je Tag“, wert 12000 → 12116",
    );
    expect(codes(a.befunde)).toEqual(expect.arrayContaining(["BAUSTEIN_KENNZAHL_ERGAENZT", "BAUSTEIN_QUELLE_ERGAENZT"]));
    expect(pruefeGegenSchema(land.schema, d, land.ui)).toEqual([]);
    expect(referenzFehler(d, land)).toEqual([]);
  });

  it("Thessa: Einsatzmeldungen nur, wenn der Baustein sie enthält; Prüfsumme statt Format entscheidet", async () => {
    const m = await bausteinMaterial(SONNEBERG);
    const b = json(SONNEBERG);
    const d = kiAusgabe();
    d.quellen.push({ id: "Q9", ...(({ id: _i, ...r }) => r)(b.quellen[0]) });
    expect(b.kennzahlen[0].teilmenge_von).toBeUndefined();
    d.sachverhalte[1].kennzahlen = [{ ...b.kennzahlen[0], id: "K1", quellen: ["Q9"] }];
    d.sachverhalte[1].module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [
        {
          format: "falsch",
          fassung: "9.9",
          sha256: m.hash,
          quelle: "Q9",
          kennzahlen: [{ kennzahl: "K1", baustein_kennzahl: "K1" }],
          einsatzmeldungen: [b.einsatzmeldungen[0].id, "EM-20261014-XXXX"],
        },
      ],
    };
    d.meldezeitpunkt = "2026-10-14T10:30+02:00";
    d.zeitzone = "Europe/Berlin";
    const befunde = bausteineUebernehmen(d, bausteineImMaterial([m]));
    expect(d.sachverhalte[1].module["lead-baustein"].bausteine[0]).toMatchObject({
      format: "Thessa-Kennzahlen",
      fassung: "0.3",
      einsatzmeldungen: [b.einsatzmeldungen[0].id],
    });
    expect(befunde.map((x) => x.code)).toEqual(["BAUSTEIN_EINSATZMELDUNG_UNBEKANNT", "EINSATZ_UEBERNOMMEN"]);
  });

  it("Unbekannter Baustein und unbekannte Kennzahl entfallen; Kennzahl mit Bausteinbeleg ohne Verweis und ungenutzter Baustein als Hinweis", async () => {
    const thessa = await bausteinMaterial(SONNEBERG);
    const ksnv = await bausteinMaterial(KSNV_KREIS);
    const b = json(SONNEBERG);
    const d = kiAusgabe();
    d.quellen.push({ id: "Q9", ...(({ id: _i, ...r }) => r)(b.quellen[0]) });
    d.sachverhalte[0].kennzahlen = [{ ...b.kennzahlen[0], id: "K1", quellen: ["Q9"] }];
    d.sachverhalte[1].module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [
        { format: "Unbekannt-Kennzahlen", fassung: "1.0", quelle: "Q9", kennzahlen: [] },
        { format: "Thessa-Kennzahlen", fassung: "0.3", quelle: "Q9", kennzahlen: [{ kennzahl: "K1", baustein_kennzahl: "K99" }] },
      ],
    };
    const befunde = bausteineUebernehmen(d, bausteineImMaterial([thessa, ksnv]));
    expect(d.sachverhalte[1].module["lead-baustein"].bausteine).toEqual([
      { format: "Thessa-Kennzahlen", fassung: "0.3", datei: thessa.name, sha256: thessa.hash, quelle: "Q9", kennzahlen: [] },
    ]);
    expect(befunde.map((x) => x.code)).toEqual(["BAUSTEIN_UNBEKANNT", "BAUSTEIN_KENNZAHL_UNBEKANNT", "KENNZAHL_OHNE_VERWEIS", "BAUSTEIN_NICHT_UEBERNOMMEN"]);
    expect(befunde[2]!.text).toContain("Sachverhalt 1 K1");
    expect(befunde[3]!.text).toContain(ksnv.name);
  });

  it("Abnahme nach der Befunddatei: drei Kennzahlen aus Sonneberg 10:00 Uhr mit neuen Nummern, Teilmenge umgeschrieben, Werte unverändert; Einsatzmeldung als Maßnahme und Zeitstrahlzeile; nichts aus herleitung", async () => {
    const m = await bausteinMaterial(SONNEBERG);
    const b = json(SONNEBERG);
    const k1 = b.kennzahlen.find((x: any) => x.id === "K1");
    const k2 = b.kennzahlen.find((x: any) => x.id === "K2");
    const k7 = b.kennzahlen.find((x: any) => x.id === "K7");
    const roh = kiAusgabe();
    roh.quellen.push({ id: "Q9", ...(({ id: _i, ...r }) => r)(b.quellen[0]) });
    // Attrappe: Nummern K1–K3 in der Meldung, Teilmengen nach den IDs des Bausteins (K7 → K2 ist dort K2), ein Wert geändert
    roh.sachverhalte[1].kennzahlen = [
      { ...k1, id: "K1", quellen: ["Q9"] },
      { ...k2, id: "K2", wert: 36, teilmenge_von: "K1", quellen: ["Q9"] },
      { ...k7, id: "K3", teilmenge_von: "K7", quellen: ["Q9"] },
    ];
    roh.sachverhalte[1].module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [
        {
          format: "Thessa-Kennzahlen",
          fassung: "0.3",
          quelle: "Q9",
          kennzahlen: [
            { kennzahl: "K1", baustein_kennzahl: "K1" },
            { kennzahl: "K2", baustein_kennzahl: "K2" },
            { kennzahl: "K3", baustein_kennzahl: "K7" },
          ],
          einsatzmeldungen: ["EM-20261013-5KFK"],
        },
      ],
    };
    const anbieter = skriptAnbieter([meldungsAntwort(roh)]);
    const k = await kontextV2(land, [m]);
    k.anbieter = anbieter;
    const r = await stufe2und3(k, k.lauf.bestaetigt!);
    const sv = r.meldung!.sachverhalte[1];
    const werte = (x: any) => [x.gegenstand, x.einheit, x.art, x.wert, x.mindestwert, x.erhebung, x.raum, x.datenstand];
    expect(sv.kennzahlen.map((x: any) => [x.id, ...werte(x), x.teilmenge_von])).toEqual([
      ["K1", ...werte(k1), undefined],
      ["K2", ...werte(k2), "K1"],
      ["K3", ...werte(k7), "K2"],
    ]);
    expect(r.befunde.find((x) => x.code === "KENNZAHL_BAUSTEIN_ABWEICHUNG")?.text).toContain(`Sachverhalt 2 K2: wert 36 → ${k2.wert}`);
    expect(sv.handlungsbedarf.massnahmen).toContainEqual({
      id: `M${kiAusgabe().sachverhalte[1].handlungsbedarf.massnahmen.length + 1}`,
      gegenstand: "Notstromeinspeisung Pumpwerk Trinkwasser",
      stelle: "Feuerwehren der Gemeinde Stadt Neuhaus am Rennweg",
      status: "begonnen",
      stand: "2026-10-14T10:00+02:00",
      quellen: ["Q9"],
    });
    expect(sv.zeitstrahl).toContainEqual({
      id: "Z1",
      zeit: "2026-10-13T23:30+02:00",
      typ: "Maßnahme",
      text: "Notstromeinspeisung Pumpwerk Trinkwasser (Stadt Neuhaus am Rennweg)",
      quellen: ["Q9"],
      erstmals_gemeldet: "2026-10-14T10:30+02:00",
    });
    // Nichts aus herleitung (Kennungen einzelner Einsatzmittel) in der Meldung
    const kennungen = b.herleitung.flatMap((h: any) => h.einsatzmittel || []);
    const ausgabe = JSON.stringify(r.meldung);
    expect(kennungen.length).toBeGreaterThan(0);
    expect(kennungen.filter((x: string) => ausgabe.includes(`"${x}"`))).toEqual([]);
    expect(r.schemaBefunde).toEqual([]);
    expect(referenzFehler(r.meldung!, land)).toEqual([]);
  });

  it("Einsatzmeldung mit Beginn nach t0 wird nicht übernommen; Teilmenge ohne übernommene Obermenge wird genannt", async () => {
    const m = await bausteinMaterial(SONNEBERG);
    const b = json(SONNEBERG);
    const d = kiAusgabe();
    d.meldezeitpunkt = "2026-10-14T05:00+02:00";
    d.zeitzone = "Europe/Berlin";
    d.quellen.push({ id: "Q9", ...(({ id: _i, ...r }) => r)(b.quellen[0]) });
    d.sachverhalte[1].kennzahlen = [{ ...b.kennzahlen[1], id: "K1", quellen: ["Q9"] }];
    d.sachverhalte[1].module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [
        {
          format: "Thessa-Kennzahlen",
          fassung: "0.3",
          quelle: "Q9",
          kennzahlen: [{ kennzahl: "K1", baustein_kennzahl: "K2" }],
          einsatzmeldungen: ["EM-20261014-N5X2"],
        },
      ],
    };
    const befunde = bausteineUebernehmen(d, bausteineImMaterial([m]));
    expect(befunde.map((x) => x.code)).toEqual(["KENNZAHL_BAUSTEIN_ABWEICHUNG", "KENNZAHL_OBERMENGE_FEHLT", "EINSATZ_NACH_T0"]);
    expect(d.sachverhalte[1].kennzahlen[0].teilmenge_von).toBeUndefined();
    expect(JSON.stringify(d.sachverhalte[1])).not.toContain("Kraftstofftransport");
  });

  it("Referenzprüfung kennt das Modul: Verweis auf eine fehlende Kennzahl ist ein Fehler, kein „unbekanntes Modul“", () => {
    const d = kopie(json(BEISPIEL_TH));
    d.sachverhalte[0].module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [{ format: "Thessa-Kennzahlen", fassung: "0.3", quelle: "Q2", kennzahlen: [{ kennzahl: "K9", baustein_kennzahl: "K1" }] }],
    };
    const b = referenzBefunde(d, land.ui);
    expect(b.some((x) => x.text.includes("K9 ist keine Kennzahl dieses Sachverhalts"))).toBe(true);
    expect(b.some((x) => x.text.includes("unbekanntes Modul"))).toBe(false);
  });
});

describe("UP-2026-W45-04: Steuerungsblock und Lauf S2/S3 mit v2", () => {
  it("Steuerung v2: Kennung, Bezug, Zeitstrahl mit IDs und die Regel für Bausteine mit Modul; keine Regeln für Text-Zeitstrahl", () => {
    const s = steuerungsBlock({
      jetzt: "2026-10-14T10:40",
      t0: "2026-10-14T10:30",
      stichtag: "2026-10-14",
      zone: "Europe/Berlin",
      vormeldungStand: "2026-10-14T06:00",
      vormeldung: true,
      verdichtung: false,
      recherche: "nur-material",
      websucheMax: 0,
      abrufMax: 0,
      bausteine: 1,
      v2: { kennungenVormeldung: ["DE-TH-20261014-K7QM"], naechsteZ: 2, modulBaustein: true },
    });
    expect(s).toContain(
      "- Sachverhaltskennung (`kennung`): Übernimm bei fortgeschriebenen Sachverhalten die Kennung der Vormeldung unverändert (DE-TH-20261014-K7QM).",
    );
    expect(s).toContain("neue Zeilen beginnen bei Z2");
    expect(s).toContain("`erstmals_gemeldet` setzt die App");
    expect(s).toContain(BAUSTEIN_REGEL_V2);
    expect(s).not.toContain("aufgenommen");
  });

  it("ganzer Lauf: KI-Ausgabe nach dem Ausgabeschema wird schemakonform übergeben; Systemauftrag ohne Bedingungen", async () => {
    const m = await bausteinMaterial(SONNEBERG);
    const anbieter = skriptAnbieter([meldungsAntwort(kiAusgabe())]);
    const k = await kontextV2(land, [m]);
    k.anbieter = anbieter;
    const bestaetigt = k.lauf.bestaetigt!;
    const r = await stufe2und3(k, bestaetigt);
    expect(r.schemaBefunde).toEqual([]);
    expect(k.lauf.ergebnis?.schemakonform).toBe(true);
    expect(r.meldung!.meldung_id).toMatch(UUID7);
    const system = anbieter.anfragen[0]!.system.map((x) => x.text).join("\n");
    expect(system).toContain("Ausgabeschema der Meldung");
    expect(system).not.toContain('"allOf"');
    expect(system).toContain(BAUSTEIN_REGEL_V2);
    expect(r.befunde.map((b) => b.code)).toContain("BAUSTEIN_NICHT_UEBERNOMMEN");
    // Kein Abgleich der Zahlen im Text (Übergangsregel h) bei v2
    expect(r.befunde.map((b) => b.code)).not.toContain("BAUSTEIN_OHNE_BELEG");
  });

  it("Reparatur bei v2: Prüfbericht zum Entwurf, Systemauftrag mit Ausgabeschema; die reparierte Fassung besteht", async () => {
    const falsch = kiAusgabe();
    falsch.sachverhalte[0].bewertung.beurteilung.stufe = "hoch";
    const anbieter = skriptAnbieter([meldungsAntwort(falsch), meldungsAntwort(kiAusgabe())]);
    const k = await kontextV2(land);
    k.anbieter = anbieter;
    const r = await stufe2und3(k, k.lauf.bestaetigt!);
    expect(anbieter.anfragen).toHaveLength(2);
    expect(anbieter.anfragen[1]!.system[0]!.text).toContain("Ausgabeschema der KI");
    expect(String(anbieter.anfragen[1]!.nachrichten[0]!.content)).toContain("sachverhalte/0/bewertung/beurteilung/stufe");
    expect(r.schemaBefunde).toEqual([]);
  });
});

describe("UP-2026-W45-04: Management Summary mit v2-Feldern (Fristen und abweichende Bewertungen)", () => {
  it("Fristen aus handlungsbedarf.fristen; Zeitstrahl und Bausteinherkunft gehen nicht an die KI", () => {
    const d = kopie(json(BEISPIEL_TH));
    d.sachverhalte[0].module["lead-baustein"] = { fassung: "1.0", bausteine: [] };
    d.sachverhalte[0].zeitstrahl = [{ id: "Z1" }];
    expect(fristen(d, land)).toEqual([
      {
        datum: new Date("2026-10-15T10:00:00Z"),
        text: "15.10.2026, 12:00 – Nachbetankung der Notstromaggregate in Pflegeheimen und Wasserversorgung (Landkreis Sonneberg; Bedingung: vor Ende der Dieselvorräte der Pflegeheime (15.10. abends))",
        ueberfaellig: false,
      },
    ]);
    const k = meldungFuerKurzfassung(d, land);
    expect(k.sachverhalte[0].zeitstrahl).toBeUndefined();
    expect(k.sachverhalte[0].module["lead-baustein"]).toBeUndefined();
    expect(k.sachverhalte[0].module["lead-bevoelkerungsschutz"]).toBeDefined();
  });

  it("abweichende Bewertung aus dem Feld zählt als vermerkt: „kritisch“ in der Kurzfassung ohne Hinweis", () => {
    const d = kopie(json(BEISPIEL_TH));
    const struktur = { kernaussage: "Die Lage im Landkreis Sonneberg gilt dort als kritisch.", abschnitte: {}, kurztitel: [] };
    expect(kurzfassungTreue(struktur, d, land).filter((h) => h.includes("„kritisch“"))).toEqual([]);
    d.sachverhalte[1].bewertung.abweichende_bewertungen = [];
    expect(kurzfassungTreue(struktur, d, land).filter((h) => h.includes("„kritisch“"))).toHaveLength(1);
  });
});

describe("UP-2026-W45-04: Kennzahlregeln an einer Stelle (Kodierleitfaden Abschnitt 6, Entscheidung vom 03.11.2026)", () => {
  it("Kodierleitfaden von Beispiel- und Landesprofil führt die Regeln in Abschnitt 6; die App verweist nur darauf", async () => {
    for (const name of ["lead-beispiel", "lead-thueringen"]) {
      const text = readFileSync(repoPfad(`profile/${name}/kodierleitfaden.md`), "utf-8");
      const abschnitt6 = text.slice(text.indexOf("## 6. Wertzustände und Leerwerte"), text.indexOf("## 7. "));
      expect(abschnitt6, name).toContain("### Kennzahlen aus Kennzahlen-Bausteinen");
      for (const regel of [
        "**Unverändert übernehmen.**",
        "**Keine unzulässigen Summen.**",
        "**Mindestwert und Teilmenge.**",
        "Einsatzmittel zählen am Standort, Einsätze am Einsatzort.",
        // seit Kodierleitfaden 1.14.0 (UP-2026-W45-05) mit überlappenden Räumen, übergeordneter Erhebung, Ausschnitt und
        // Beleg statt Kodierung; geändertes Soll für „Beleg“
        "**Beleg, keine Kodierung.**",
        "**Übergeordnete Erhebung.**",
        "**Ausschnitt kennzeichnen.**",
        "(erfasster Ausschnitt, Vollständigkeit nicht angegeben)",
        "zählt einmal, im Raum, in dem sie im Gebiet liegt",
      ])
        expect(abschnitt6, `${name}: ${regel}`).toContain(regel);
    }
    const { BAUSTEIN_REGEL } = await import("../../src/pipeline/kontext");
    for (const regel of [BAUSTEIN_REGEL, BAUSTEIN_REGEL_V2]) {
      expect(regel).toContain("Kennzahlregeln des Kodierleitfadens");
      expect(regel).not.toMatch(/Einsatzmittel zählen|Addiere keine|Mindestwert bleibt/);
    }
  });
});

describe("UP-2026-W45-04: KI-Kennzeichnung aus der Entstehung nach v2", () => {
  it("Herkunft, Modelle und Werkzeug aus der Entstehung der Nachbearbeitung (PDF-Metadaten, Lagebild)", async () => {
    const { herkunftAusMeldung } = await import("../../src/dokumente/kennzeichnung");
    const k = await kontextV2(land);
    k.lauf.stufen.push({ stufe: "S2 Recherche und Entwurf", start: "", modell: "claude-opus-5-5" });
    const d = nachbearbeitenV2(kiAusgabe(), k, "claude-opus-5-5", aus());
    expect(herkunftAusMeldung(d, land)).toEqual({
      herkunft: "ki",
      modell: "claude-sonnet-5-5, claude-opus-5-5",
      werkzeug: `KI-LEAD ${d.entstehung.werkzeug.version}`,
      erstellt: "2026-10-14T10:40+02:00",
    });
  });
});

describe("UP-2026-W45-05: Verdichtung mit mehreren Kennzahlen-Bausteinen (Rechenhilfe, Ausschnitt, Prüfungen nach S2)", () => {
  const THESSA = "profile/lead-thueringen/beispiele/orkantief-ilka-thessa/";
  const LAND = `${THESSA}kennzahlen_Thueringen_2026-10-14T10-30_FIKTIV.json`;
  const SON1030 = `${THESSA}kennzahlen_Landkreis-Sonneberg_2026-10-14T10-30_FIKTIV.json`;

  it("Rechenhilfe im Material; Land-Kennzahl mit Zusatz „erfasster Ausschnitt“, Summe Land + Kreis als unzulässig, Beleg-Hinweis mit Belegachsen", async () => {
    const mLand = await bausteinMaterial(LAND);
    const mSon = await bausteinMaterial(SON1030);
    const b = json(LAND);
    const roh = kiAusgabe();
    roh.quellen.push({ id: "Q9", ...(({ id: _i, ...r }) => r)(b.quellen[0]) });
    const k1 = b.kennzahlen.find((x: any) => x.id === "K1");
    roh.sachverhalte[0].kennzahlen = [
      ...roh.sachverhalte[0].kennzahlen,
      // wie im Baustein, Raum ohne Kennzeichnung des Ausschnitts
      { ...k1, id: "K3", quellen: ["Q9"] },
      // Summe Land (151) + Sonneberg (55): überlappende Räume
      { ...k1, id: "K4", gegenstand: "Einsatzmittel zusammen", wert: 206, quellen: ["Q9"] },
    ];
    roh.sachverhalte[0].module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [{ format: "Thessa-Kennzahlen", fassung: "0.3", quelle: "Q9", kennzahlen: [{ kennzahl: "K3", baustein_kennzahl: "K1" }] }],
    };
    const anbieter = skriptAnbieter([meldungsAntwort(roh)]);
    const k = await kontextV2(land, [mSon, mLand]);
    k.anbieter = anbieter;
    const r = await stufe2und3(k, k.lauf.bestaetigt!);
    // an die KI: Rechenhilfe mit Land statt Summe und Ausschnitt
    const nutzer = JSON.stringify(anbieter.anfragen[0]!.nachrichten);
    expect(nutzer).toContain('<rechenhilfe art=\\"kennzahlen\\" quelle=\\"App\\">');
    expect(nutzer).toContain("Thüringen (erfasster Ausschnitt, Vollständigkeit nicht angegeben) 151 [B2 K1]");
    expect(JSON.stringify(anbieter.anfragen[0]!.system)).toContain("Liegt eine Rechenhilfe der App bei");
    // Übernahme: Wert unverändert, Raum mit Zusatz; der Zusatz ist keine Abweichung
    const sv = r.meldung!.sachverhalte[0];
    expect(sv.kennzahlen.find((x: any) => x.id === "K3")).toMatchObject({
      wert: 151,
      raum: "Thüringen (erfasster Ausschnitt, Vollständigkeit nicht angegeben)",
    });
    expect(codes(r.befunde)).not.toContain("KENNZAHL_BAUSTEIN_ABWEICHUNG");
    expect(r.befunde.find((x) => x.code === "BAUSTEIN_AUSSCHNITT")?.text).toContain("Sachverhalt 1 K3");
    const summe = r.befunde.find((x) => x.code === "KENNZAHL_SUMME_UNZULAESSIG")!;
    expect(summe.stufe).toBe("warnung");
    expect(summe.text).toContain("Sachverhalt 1 K4: 206 = ");
    expect(summe.text).toContain("überlappende Räume");
    // K4 steht ohne Kennzeichnung für Thüringen und belegt den Land-Baustein
    expect(r.befunde.find((x) => x.code === "KENNZAHL_LANDESWEIT")?.text).toContain("Sachverhalt 1 K4 (Thüringen");
    expect(r.befunde.find((x) => x.code === "KENNZAHL_BELEG")?.text).toContain("Sachverhalt 1 (mögliche Belegachsen nach Thessa: D1, D4, D5, D8)");
  });

  it("KI übernimmt den Zusatz selbst: kein Hinweis BAUSTEIN_AUSSCHNITT, keine Abweichung", async () => {
    const mLand = await bausteinMaterial(LAND);
    const b = json(LAND);
    const d = kiAusgabe();
    d.quellen.push({ id: "Q9", ...(({ id: _i, ...r }) => r)(b.quellen[0]) });
    const k2 = b.kennzahlen.find((x: any) => x.id === "K2");
    const { teilmenge_von: _t, ...ohneTeilmenge } = k2;
    d.sachverhalte[0].kennzahlen = [{ ...ohneTeilmenge, id: "K9", raum: "Thüringen (erfasster Ausschnitt, Vollständigkeit nicht angegeben)", quellen: ["Q9"] }];
    d.sachverhalte[0].module["lead-baustein"] = {
      fassung: "1.0",
      bausteine: [{ format: "Thessa-Kennzahlen", fassung: "0.3", quelle: "Q9", kennzahlen: [{ kennzahl: "K9", baustein_kennzahl: "K2" }] }],
    };
    const befunde = bausteineUebernehmen(d, bausteineImMaterial([mLand]));
    expect(codes(befunde)).not.toContain("BAUSTEIN_AUSSCHNITT");
    expect(codes(befunde)).not.toContain("KENNZAHL_BAUSTEIN_ABWEICHUNG");
    expect(d.sachverhalte[0].kennzahlen[0].raum).toBe("Thüringen (erfasster Ausschnitt, Vollständigkeit nicht angegeben)");
  });
});
