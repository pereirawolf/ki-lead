// Eingebettetes Schema der Thessa-Kennzahlen-Bausteine (seit 0.6.24, UP-2026-W45-01): Herkunft und Prüfsummen,
// Bündelung aktuell, gebündeltes Schema für den eigenen Prüfer verwendbar und im Urteil gleich dem Original (Ajv mit
// dem Kernschema als Referenz). Fixtures: unveränderte Bausteine aus Thessa im Begleitordner des Landesprofils
// (KP-2026-W45-02; Herkunft im LIESMICH). Seit SR-2026-W45-02 Fassung 0.3 (ohne bezug_lead); 0.2 und 0.1 bleiben lesbar.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { erzeuge } from "../../scripts/fremdschemata.mjs";
import { schemaFehler } from "../../src/kern/validierung";
import { gleichWieAjv, referenzAjv } from "../support/ajv";
import { jsonDateien, repoPfad } from "../support/dateien";

const ORDNER = "formate/fremd/thessa-kennzahlen";
const text = (pfad: string) => readFileSync(repoPfad(pfad), "utf-8");
const json = (pfad: string) => JSON.parse(text(pfad));
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const HERKUNFT = json(`${ORDNER}/herkunft.json`);
const ORIGINAL = json(`${ORDNER}/0.3/kennzahlen-baustein.schema.json`);
const ORIGINAL_02 = json(`${ORDNER}/0.2/kennzahlen-baustein.schema.json`);
const KERN = json("formate/lead-meldung-v2/kern.schema.json");
const G03 = json(`${ORDNER}/gebuendelt/0.3.schema.json`);
const G02 = json(`${ORDNER}/gebuendelt/0.2.schema.json`);
const G01 = json(`${ORDNER}/gebuendelt/0.1.schema.json`);
const BEGLEIT = "profile/lead-thueringen/beispiele/orkantief-ilka-thessa";
const bausteine = () => jsonDateien(BEGLEIT, { pflicht: true });
/** Derselbe Baustein als Fassung 0.2 (0.3 hat nur bezug_lead gestrichen, daher ist der Inhalt auch nach 0.2 gültig) */
const als02 = (b: any) => ({ ...JSON.parse(JSON.stringify(b)), fassung: "0.2" });

/** Referenz: Ajv mit Original und Kernschema, ohne Bündelung */
function originalGueltig(daten: unknown): boolean {
  const ajv = referenzAjv();
  ajv.addSchema(KERN);
  return ajv.validate(ORIGINAL, daten) as boolean;
}

describe("UP-2026-W45-01: eingebettetes Schema der Thessa-Kennzahlen-Bausteine", () => {
  it("Original unverändert (Prüfsumme wie herkunft.json), Kernschema mit der von Thessa gepinnten Prüfsumme", () => {
    for (const f of HERKUNFT.fassungen.filter((x: any) => x.datei)) {
      expect(sha(text(`${ORDNER}/${f.datei}`)), f.fassung).toBe(f.sha256);
      expect(f.commit, f.fassung).toMatch(/^[0-9a-f]{40}$/);
    }
    expect(sha(text("formate/lead-meldung-v2/kern.schema.json"))).toBe(HERKUNFT.kernschema.sha256);
    expect(HERKUNFT.commit).toMatch(/^[0-9a-f]{40}$/);
  });

  it("gebündelte Schemata aktuell (npm run fremdschemata -- --check)", () => {
    const soll = erzeuge();
    expect(G03).toEqual(soll["0.3.schema.json"]);
    expect(G02).toEqual(soll["0.2.schema.json"]);
    expect(G01).toEqual(soll["0.1.schema.json"]);
  });

  it("Original mit absoluten Verweisen ist für den eigenen Prüfer unbrauchbar, die gebündelten Schemata sind verwendbar", () => {
    expect(schemaFehler(ORIGINAL)).not.toBeNull();
    for (const g of [G03, G02, G01]) expect(schemaFehler(g)).toBeNull();
    expect(JSON.stringify(G03)).not.toMatch(/"\$ref":"https?:/);
  });

  it("fünf Bausteine des Begleitordners: gültig nach Original (Ajv) und gebündeltem Schema (eigener Prüfer gleich Ajv)", () => {
    const liste = bausteine();
    expect(liste).toHaveLength(5);
    for (const b of liste) {
      expect(b.daten.fassung, b.name).toBe("0.3");
      expect(originalGueltig(b.daten), b.name).toBe(true);
      gleichWieAjv(G03, b.daten, true);
      gleichWieAjv(G02, als02(b.daten), true);
    }
  });

  it("beschädigte Bausteine: ungültig nach Original und gebündeltem Schema, im Gleichlauf", () => {
    const b = bausteine()[2]!.daten;
    const faelle = [
      { ...b, kennzahlen: [{ ...b.kennzahlen[0], wert: "viel" }, ...b.kennzahlen.slice(1)] },
      { ...b, kennzahlen: [{ ...b.kennzahlen[0], einheit: undefined }] },
      { ...b, quellen: [] },
      { ...b, datenstand: "14.10.2026" },
      { ...b, zusatz: 1 },
    ].map((x) => JSON.parse(JSON.stringify(x)));
    for (const f of faelle) {
      expect(originalGueltig(f)).toBe(false);
      gleichWieAjv(G03, f, false);
    }
  });

  it("Fassung 0.1 (abgeleitet): ohne einsatzmeldungen gültig, nach 0.2 nicht; mit fassung 0.2 nach 0.1 nicht", () => {
    const b = als02(bausteine()[2]!.daten);
    const { einsatzmeldungen: _e, ...rest } = b;
    const alt = { ...rest, fassung: "0.1" };
    gleichWieAjv(G01, alt, true);
    gleichWieAjv(G02, alt, false);
    gleichWieAjv(G01, b, false);
    expect(HERKUNFT.fassungen.find((f: any) => f.fassung === "0.1").abgeleitet_von).toBe("0.2");
  });

  it("SR-2026-W45-02: Fassung 0.3 kennt kein bezug_lead mehr; 0.2 nimmt es weiter an", () => {
    const b = bausteine().find((x) => x.daten.einsatzmeldungen.length)!.daten;
    const mitBezug = JSON.parse(JSON.stringify(b));
    mitBezug.einsatzmeldungen[0].bezug_lead = "DE-TH-20261014-P5VN";
    gleichWieAjv(G03, mitBezug, false);
    gleichWieAjv(G02, als02(mitBezug), true);
    expect(ORIGINAL_02.title).toMatch(/0\.2/);
  });
});
