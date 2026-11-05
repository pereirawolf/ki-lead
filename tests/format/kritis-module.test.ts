// Eingebettete Module von KRITIS-LEAD (KL-2026-W45-02): Meldungsmodul lead-kritis-meldung und Fachmodul
// lead-kritis-betrieb 0.3 unverändert mit Herkunft und Prüfsumme (formate/fremd/kritis-lead/), in sich geschlossen,
// zusammen mit dem Kern zu einem Schema verbindbar, das der eigene Prüfer verwendet und das eine Betreibermeldung
// im Urteil gleich Ajv prüft. Unabhängiges Soll: die Fassung 0.3 und die Prüfsummen aus herkunft.json.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stelleSchemaZusammen } from "../../scripts/lead-meldung-v2.mjs";
import { schemaFehler } from "../../src/kern/validierung";
import { gleichWieAjv, referenzAjv } from "../support/ajv";
import { repoPfad } from "../support/dateien";

const ORDNER = "formate/fremd/kritis-lead";
const text = (pfad: string) => readFileSync(repoPfad(pfad), "utf-8");
const json = (pfad: string) => JSON.parse(text(pfad));
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const kopie = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const HERKUNFT = json(`${ORDNER}/herkunft.json`);

/** Kern mit beiden Modulen, ohne Pflichtmodul (wie ein Profil, das Betreiber- und Behördenmeldungen empfängt) */
const ZUSAMMENSTELLUNG = {
  format: "lead-meldung-v2-zusammenstellung/1",
  $id: "https://github.com/pereirawolf/ki-lead/tests/kritis-module.schema.json",
  title: "Test: Kern mit den Modulen von KRITIS-LEAD",
  kern: "kern.schema.json",
  module: { "lead-kritis-betrieb": { datei: "../fremd/kritis-lead/0.3/lead-kritis-betrieb.schema.json", pflicht: false } },
  meldungsmodule: { "lead-kritis-meldung": { datei: "../fremd/kritis-lead/0.3/lead-kritis-meldung.schema.json", pflicht: false } },
};

/** Kleinste Betreibermeldung mit beiden Modulen (fiktiv, nach dem Minimalbeispiel von KRITIS-LEAD) */
const BETREIBERMELDUNG = {
  schema: "LEAD-Meldung-v2",
  fassung: "2.0",
  meldung_id: "019a1e2c-1f40-7a00-8000-000000000101",
  status: "freigegeben",
  absender: { stelle: "Verteilnetzbetreiber Netzgebiet Südthüringen (FIKTIV)", ebene: "Betreiber", gebiet: { name: "Thüringen", schluessel: "DE-TH" } },
  meldezeitpunkt: "2026-10-13T22:45+02:00",
  zeitzone: "Europe/Berlin",
  meldezeitraum: { von: "2026-10-13T21:40+02:00", bis: "2026-10-13T22:30+02:00" },
  module: {
    "lead-kritis-meldung": {
      fassung: "0.3",
      meldeart: "Erstmeldung",
      meldeanlass: ["eingetretene Einschränkung"],
      datenart: "synthetisch",
      vertraulichkeit: { tlp: "CLEAR" },
      empfaenger: ["Landratsamt Sonneberg, Krisenstab (Übungsrolle, FIKTIV)"],
      gemeldet_an: [],
    },
  },
  quellen: [
    {
      id: "Q1",
      kategorie: "B",
      herausgeber: "Verteilnetzbetreiber Netzgebiet Südthüringen (FIKTIV)",
      titel: "Netzleitstelle, Störungsübersicht 20 kV (FIKTIV)",
      zugriff: "2026-10-13",
      datenstand: "2026-10-13T22:30+02:00",
      zugang: null,
    },
  ],
  sachverhalte: [
    {
      kennung: "KRITIS-NETZSUED-20261013-N4ST7Q",
      bezeichnung: "FIKTIV – Stromausfall 20 kV oberhalb Neuhaus am Rennweg",
      eintritt: { zeit: "2026-10-13T21:40+02:00", genauigkeit: "belegt" },
      raum: { beschreibung: "Teilnetz oberhalb Neuhaus am Rennweg", gebiete: [{ name: "Landkreis Sonneberg", schluessel: "16072" }] },
      analyse: { lage_ereignis: "FIKTIV – Seit 21:40 Uhr sind mehrere Abgänge der 20-kV-Leitung ausgefallen [Q1].", risiken_auswirkungen: "", abhaengigkeiten_interdependenzen: "" },
      handlungsbedarf: { massnahmen: [], empfehlungen: [], fristen: [] },
      kennzahlen: [
        { id: "K1", gegenstand: "Netzanschlüsse ohne Versorgung", einheit: "Anschlüsse", art: "bestand", wert: 18000, mindestwert: false, erhebung: "gezaehlt", datenstand: "2026-10-13T22:30+02:00", quellen: ["Q1"] },
      ],
      module: {
        "lead-kritis-betrieb": {
          fassung: "0.3",
          betreiber: { name: "Verteilnetzbetreiber Netzgebiet Südthüringen (FIKTIV)" },
          sektor: "Energie",
          kritische_dienstleistung: "Stromverteilung",
          ist: { stand: "2026-10-13T22:30+02:00", leistungsgrad: "eingeschraenkt" },
          kennzahlen: { betroffene_anschluesse: "K1", betroffene_personen: null },
          ersatzverfahren: [],
          prognose: { stand: "2026-10-13T22:30+02:00", status: "keine_prognose_moeglich" },
          unterstuetzungsbedarf: [],
          bestaetigungsgrad: "vorläufige Eigenangabe",
        },
      },
    },
  ],
  freigabe: {
    erfasst: { name: "Netzleitstelle (Funktion, FIKTIV)", zeitpunkt: "2026-10-13" },
    freigegeben: { name: "Netzleitstelle (Funktion, FIKTIV)", zeitpunkt: "2026-10-13" },
  },
  entstehung: { verfahren: "manuell" },
};

describe("KL-2026-W45-02: eingebettete Module von KRITIS-LEAD", () => {
  it("Kopien unverändert (Prüfsumme wie herkunft.json), Fassung 0.3, Herkunft mit vollem Commit und Quellpfad", () => {
    expect(HERKUNFT.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(HERKUNFT.module.map((m: any) => m.modul).sort()).toEqual(["lead-kritis-betrieb", "lead-kritis-meldung"]);
    for (const m of HERKUNFT.module) {
      const roh = text(`${ORDNER}/${m.datei}`);
      expect(sha(roh), m.modul).toBe(m.sha256);
      expect(m.commit, m.modul).toMatch(/^[0-9a-f]{40}$/);
      expect(m.quelle, m.modul).toBe(`formate/lead-kritis-v2/module/${m.modul}.schema.json`);
      expect(JSON.parse(roh).properties.fassung.const, m.modul).toBe("0.3");
      expect(m.fassung, m.modul).toBe("0.3");
    }
  });

  it("Module sind gültige Schemata nach Draft 2020-12 und in sich geschlossen (keine Verweise nach außen)", () => {
    for (const m of HERKUNFT.module) {
      const s = json(`${ORDNER}/${m.datei}`);
      expect(() => referenzAjv().compile(s), m.modul).not.toThrow();
      const verweise = JSON.stringify(s).match(/"\$ref":"[^"]*"/g) || [];
      for (const v of verweise) expect(v, m.modul).toMatch(/"\$ref":"#\/\$defs\//);
    }
  });

  it("Zusammenstellung mit dem Kern: Schema für den eigenen Prüfer verwendbar", () => {
    const schema = stelleSchemaZusammen(ZUSAMMENSTELLUNG);
    expect(schemaFehler(schema)).toBeNull();
    expect(Object.keys(schema.$defs.module.properties)).toContain("lead-kritis-betrieb");
    expect(Object.keys(schema.$defs.meldungsmodule.properties)).toContain("lead-kritis-meldung");
  });

  it("Betreibermeldung gültig; Modulregeln greifen (eigener Prüfer gleich Ajv)", () => {
    const schema = stelleSchemaZusammen(ZUSAMMENSTELLUNG);
    gleichWieAjv(schema, BETREIBERMELDUNG, true);
    const falscheFassung = kopie(BETREIBERMELDUNG);
    falscheFassung.sachverhalte[0].module["lead-kritis-betrieb"].fassung = "0.2";
    gleichWieAjv(schema, falscheFassung, false);
    const ohneSektor = kopie(BETREIBERMELDUNG) as any;
    delete ohneSektor.sachverhalte[0].module["lead-kritis-betrieb"].sektor;
    gleichWieAjv(schema, ohneSektor, false);
    const echtdaten = kopie(BETREIBERMELDUNG);
    echtdaten.module["lead-kritis-meldung"].datenart = "real";
    gleichWieAjv(schema, echtdaten, false);
  });
});
