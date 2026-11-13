// Eingebettetes Schema der KSNV-Kennzahlen-Bausteine (seit 0.7.19): Herkunft und Prüfsummen, Bündelung aktuell,
// gebündeltes Schema für den eigenen Prüfer verwendbar und im Urteil gleich dem Original (Ajv mit dem Kernschema und dem
// Begleitschema bedarfsmeldung.schema.json als Referenz). Fixtures: unveränderte Bausteine aus KSNV unter formate/fremd/ksnv-kennzahlen/beispiele/.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { erzeuge, KSNV_ORDNER } from "../../scripts/fremdschemata.mjs";
import { schemaFehler } from "../../src/kern/validierung";
import { gleichWieAjv, referenzAjv } from "../support/ajv";
import { jsonDateien, repoPfad } from "../support/dateien";

const ORDNER = "formate/fremd/ksnv-kennzahlen";
const text = (pfad: string) => readFileSync(repoPfad(pfad), "utf-8");
const json = (pfad: string) => JSON.parse(text(pfad));
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const HERKUNFT = json(`${ORDNER}/herkunft.json`);
const ORIGINAL = json(`${ORDNER}/0.1/kennzahlen-baustein.schema.json`);
const BEDARFSMELDUNG = json(`${ORDNER}/0.1/bedarfsmeldung.schema.json`);
const KERN = json("formate/lead-meldung-v2/kern.schema.json");
const G01 = json(`${ORDNER}/gebuendelt/0.1.schema.json`);
const bausteine = () => jsonDateien(`${ORDNER}/beispiele`, { pflicht: true });

function originalGueltig(daten: unknown): boolean {
  const ajv = referenzAjv();
  ajv.addSchema(KERN);
  ajv.addSchema(BEDARFSMELDUNG);
  return ajv.validate(ORIGINAL, daten) as boolean;
}

describe("KSNV-Kennzahlen: eingebettetes Schema des Kennzahlen-Bausteins aus KSNV", () => {
  it("Original unverändert (Prüfsumme wie herkunft.json), Kernschema mit der von KSNV gepinnten Prüfsumme", () => {
    for (const f of HERKUNFT.fassungen) {
      expect(sha(text(`${ORDNER}/${f.datei}`)), f.fassung).toBe(f.sha256);
      expect(f.commit, f.fassung).toMatch(/^[0-9a-f]{40}$/);
      for (const b of f.begleitschemata ?? []) expect(sha(text(`${ORDNER}/${b.datei}`)), b.datei).toBe(b.sha256);
    }
    expect(HERKUNFT.format).toBe("KSNV-Kennzahlen");
    expect(sha(text("formate/lead-meldung-v2/kern.schema.json"))).toBe(HERKUNFT.kernschema.sha256);
  });

  it("gebündeltes Schema aktuell (npm run fremdschemata -- --check)", () => {
    expect(G01).toEqual(erzeuge(KSNV_ORDNER)["0.1.schema.json"]);
    expect(G01.$id).toBe("https://github.com/pereirawolf/ki-lead/formate/fremd/ksnv-kennzahlen/gebuendelt/0.1.schema.json");
  });

  it("Original mit absoluten Verweisen ist für den eigenen Prüfer unbrauchbar, das gebündelte Schema ist verwendbar", () => {
    expect(schemaFehler(ORIGINAL)).not.toBeNull();
    expect(schemaFehler(G01)).toBeNull();
    expect(JSON.stringify(G01)).not.toMatch(/"\$ref":"https?:/);
    expect(JSON.stringify(G01)).not.toMatch(/"\$ref":"[^#]/);
    expect(G01.properties.land).toEqual({ $ref: "#/$defs/bedarfsmeldung_land" });
    expect(G01.$defs.bedarfsmeldung_land).toEqual(BEDARFSMELDUNG.$defs.land);
  });

  it("zwei Bausteine (Land, Wartburgkreis): gültig nach Original (Ajv) und gebündeltem Schema (eigener Prüfer gleich Ajv)", () => {
    const liste = bausteine();
    expect(liste).toHaveLength(2);
    for (const b of liste) {
      expect(b.daten.format, b.name).toBe("KSNV-Kennzahlen");
      expect(originalGueltig(b.daten), b.name).toBe(true);
      gleichWieAjv(G01, b.daten, true);
    }
  });

  it("beschädigte Bausteine: ungültig nach Original und gebündeltem Schema, im Gleichlauf", () => {
    const b = bausteine()[0]!.daten;
    const faelle = [
      { ...b, kennzahlen: [{ ...b.kennzahlen[0], art: "verbrauch" }] },
      { ...b, kennzahlen: [{ ...b.kennzahlen[0], wert: "viel" }] },
      { ...b, raum: { name: "Wartburgkreis" } },
      { ...b, quellen: [] },
      { ...b, zusatz: 1 },
      { ...b, land: undefined },
      { ...b, land: { ...b.land, kuerzel: "Thüringen" } },
      { ...b, raum: { ...b.raum, ebene: "Kreis" } },
    ].map((x) => JSON.parse(JSON.stringify(x)));
    for (const f of faelle) {
      expect(originalGueltig(f)).toBe(false);
      gleichWieAjv(G01, f, false);
    }
  });

  it("länderneutral: Ebene und Schlüssel aus einem anderen Landesprofil gültig, im Gleichlauf", () => {
    const b = bausteine()[0]!.daten;
    const bezirk = JSON.parse(
      JSON.stringify({
        ...b,
        land: { schluessel: "02", kuerzel: "HH", name: "Hamburg", profil: "hamburg" },
        raum: { name: "Bezirk Altona", schluessel: "02000000-2", ebene: "bezirk" },
      }),
    );
    expect(originalGueltig(bezirk)).toBe(true);
    gleichWieAjv(G01, bezirk, true);
  });
});
