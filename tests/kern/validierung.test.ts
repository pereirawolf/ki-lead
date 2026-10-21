// Eval-freier Schemaprüfer: Referenzvergleich mit Ajv, verständliche Fehlermeldungen, Regressionen aus
// Review 18.10.2026 (F04 Verweise, F11 strukturelle Gleichheit) und Review 20.10.2026 (F04 eigene JSON-Schlüssel).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaDateien, ilkaMeldung } from "../support/fixtures";
import { gleichWieAjv, referenzAjv } from "../support/ajv";
import { pruefeRoh, pruefeGegenSchema } from "../../src/kern/validierung";
import { pfadBezeichnung } from "../../src/kern/ui";

const ilka = ilkaDateien();

/**
 * Benannte Abwandlungen einer gültigen Beispielmeldung (alle sieben sind „final“) mit unabhängig festgelegtem Soll
 * aus den Regeln des Meldungsschemas: Nur der Entwurf darf Land und Sachverhalte offen lassen; Radarwerte sind ganze
 * Zahlen 0–6 oder null und alle Achsen Pflicht; Ereignisarten stammen aus dem Katalog und kommen nur einmal vor;
 * Zeitangaben im ISO-Format; feste Schemakennung; Entstehung mit Verfahren und Werkzeug; keine Zusatzfelder.
 */
const VARIANTEN: { name: string; gueltig: boolean; aendern: (x: any) => void }[] = [
  { name: "unverändert", gueltig: true, aendern: () => {} },
  { name: "final ohne Land", gueltig: false, aendern: (x) => Object.assign(x, { _status: "final", land: "" }) },
  { name: "final ohne Sachverhalte", gueltig: false, aendern: (x) => Object.assign(x, { _status: "final", sachverhalte: [] }) },
  { name: "Entwurf ohne Sachverhalte und Land", gueltig: true, aendern: (x) => Object.assign(x, { _status: "Entwurf", sachverhalte: [], land: "" }) },
  { name: "Radarwert über der Skala", gueltig: false, aendern: (x) => (x.sachverhalte[0].sofort.lagenradar.d3 = 7) },
  { name: "Radarwert gebrochen", gueltig: false, aendern: (x) => (x.sachverhalte[0].sofort.lagenradar.d3 = 2.5) },
  { name: "Radarwert als Text", gueltig: false, aendern: (x) => (x.sachverhalte[0].sofort.lagenradar.d4 = "U") },
  { name: "Radarachse fehlt", gueltig: false, aendern: (x) => delete x.sachverhalte[0].sofort.lagenradar.d8 },
  { name: "Ereignisart doppelt", gueltig: false, aendern: (x) => (x.sachverhalte[0].art = ["Sonstiges", "Sonstiges"]) },
  { name: "Ereignisart unbekannt", gueltig: false, aendern: (x) => (x.sachverhalte[0].art = ["Unbekannt"]) },
  { name: "Meldezeitpunkt ohne ISO-Trenner", gueltig: false, aendern: (x) => (x.meldezeitpunkt = "2026-10-14 10:00") },
  { name: "Meldezeitraum im deutschen Format", gueltig: false, aendern: (x) => (x.meldezeitraum.von = "14.10.2026") },
  { name: "fremde Schemakennung", gueltig: false, aendern: (x) => (x.schema = "LEAD-Meldung-v0") },
  { name: "Entstehung ohne Werkzeug", gueltig: false, aendern: (x) => (x._entstehung = { verfahren: "KI" }) },
  { name: "Entstehung ohne Verfahren", gueltig: false, aendern: (x) => (x._entstehung = { werkzeug: "x" }) },
  { name: "Zusatzfeld im Versand", gueltig: false, aendern: (x) => (x.freigabe.versand.extra = 1) },
  {
    name: "final mit leerer Bezeichnung",
    gueltig: false,
    aendern: (x) => {
      x._status = "final";
      x.sachverhalte[0].bezeichnung = "   ";
    },
  },
  { name: "Quellen null", gueltig: false, aendern: (x) => (x.quellen = null) },
];

describe("eval-freier Schemaprüfer gegen Ajv", () => {
  it("fällt bei allen Varianten dasselbe Urteil", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const fn = referenzAjv().compile(p!.schema);
    let n = 0;
    for (const { name: datei, daten } of ilka) {
      expect(daten._status, `${datei}: Ausgangsmeldung`).toBe("final");
      for (const { name, gueltig, aendern } of VARIANTEN) {
        const v = structuredClone(daten);
        aendern(v);
        const fall = `${datei} / ${name}`;
        const ajvOk = fn(v) as boolean;
        const eigene = pruefeRoh(p!.schema, v);
        // Unabhängiges Soll: Würden beide Prüfer zugleich nachgiebig, fiele der Vergleich allein nicht auf
        expect(ajvOk, `${fall}: Soll ${gueltig ? "gültig" : "ungültig"}; Ajv: ${JSON.stringify(fn.errors)}`).toBe(gueltig);
        expect(eigene.length === 0, `${fall}: eigener Prüfer ${JSON.stringify(eigene)}; Ajv: ${JSON.stringify(fn.errors)}`).toBe(ajvOk);
        if (!ajvOk) {
          const ajvPfade = new Set(
            (fn.errors || [])
              .filter((e) => !["if", "allOf"].includes(e.keyword))
              .map(
                (e) =>
                  e.instancePath +
                  (e.keyword === "required"
                    ? "/" + (e.params as any).missingProperty
                    : e.keyword === "additionalProperties"
                      ? "/" + (e.params as any).additionalProperty
                      : ""),
              ),
          );
          const unsere = new Set(eigene.map((f) => f.pfad));
          expect([...unsere].sort(), `${fall}: Fehlerpfade`).toEqual([...ajvPfade].sort());
        }
        n++;
      }
    }
    expect(n).toBe(ilka.length * VARIANTEN.length);
    expect(n).toBeGreaterThan(100);
  });
});

describe("Schemaprüfung", () => {
  it("meldet Fehler mit verständlichen Bezeichnungen", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = ilkaMeldung("Bund");
    d.sachverhalte[0].sofort.lagenradar.d1 = "U";
    d.sachverhalte[0].sofort.beurteilung = "hoch";
    d.extra = 1;
    d.land = "";
    d._status = "final";
    const befunde = pruefeGegenSchema(p!.schema, d, p!.ui).map((b) => b.text);
    expect(befunde).toContain("Ereignis/Sachverhalt 1 › Sofortbereich › Lagenradar › D1: Datentyp „string“, erwartet integer oder null");
    expect(befunde).toContain("Ereignis/Sachverhalt 1 › Sofortbereich › Bewertung: unzulässiger Wert „hoch“");
    expect(befunde).toContain("extra: im Schema nicht vorgesehenes Feld");
    expect(befunde).toContain("Auswahl Land/Bund: Pflichtangabe fehlt");
  });

  it("bezeichnet Freigabefelder über Platzhalter-Muster", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(pfadBezeichnung(p!.ui, "/freigabe/versand/hz")).toBe("Freigabe & Versand › Versand › Handzeichen");
  });
});

describe("F04: Verweise mit Geschwisterbedingungen und boolesche Ziele", () => {
  const s = { $defs: { x: { type: "integer", minimum: 5 } }, $ref: "#/$defs/x", allOf: [{ maximum: 10 }] };
  // Soll: ganze Zahl von 5 bis 10
  it.each([
    [1, false],
    [7, true],
    [12, false],
    [5.5, false],
  ])("$ref plus allOf wie Ajv (%s)", (v, soll) => gleichWieAjv(s, v, soll));
  it("$ref auf false und true", () => {
    const f = { type: "object", $defs: { nein: false, ja: true }, properties: { a: { $ref: "#/$defs/nein" }, b: { $ref: "#/$defs/ja" } } };
    expect(() => pruefeRoh(f, { a: 1 })).not.toThrow();
    gleichWieAjv(f, { a: 1 });
    gleichWieAjv(f, { b: 1 });
    gleichWieAjv({ ...f, properties: { a: { $ref: "#/$defs/nein", description: "x" } } }, { a: 1 });
  });
});

describe("F11: strukturelle Gleichheit", () => {
  // Soll: Objekte gleich unabhängig von der Schlüsselreihenfolge, Listen nur in gleicher Reihenfolge
  it.each<[object, unknown, boolean]>([
    [{ enum: [{ a: 1, b: { c: [1, 2] } }] }, { b: { c: [1, 2] }, a: 1 }, true],
    [{ enum: [{ a: [1, 2] }] }, { a: [2, 1] }, false],
    [{ const: { x: 1, y: 2 } }, { y: 2, x: 1 }, true],
    [
      { type: "array", uniqueItems: true },
      [
        { a: 1, b: 2 },
        { b: 2, a: 1 },
      ],
      false,
    ],
    [
      { type: "array", uniqueItems: true },
      [
        [1, 2],
        [2, 1],
      ],
      true,
    ],
  ])("wie Ajv: %j / %j", (schema, daten, soll) => gleichWieAjv(schema, daten, soll));
});

describe("F04: Schemaprüfung zählt nur eigene JSON-Schlüssel", () => {
  it.each(["constructor", "toString", "__proto__", "hasOwnProperty"])("zusätzliches Feld „%s“ bei additionalProperties: false", (k) => {
    const s = { type: "object", properties: {}, additionalProperties: false };
    const d = JSON.parse(`{"${k}": 1}`);
    expect(pruefeRoh(s, d).map((f) => f.keyword)).toEqual(["additionalProperties"]);
    gleichWieAjv(s, d);
  });

  it("ein fehlendes Pflichtfeld „toString“ wird gemeldet", () => {
    const s = { type: "object", required: ["toString", "constructor"] };
    expect(pruefeRoh(s, {}).map((f) => f.pfad)).toEqual(["/toString", "/constructor"]);
    gleichWieAjv(s, {});
  });

  it("properties und dependentRequired mit geerbten Namen", () => {
    const s = { type: "object", properties: { valueOf: { type: "string" } }, dependentRequired: { a: ["toString"] } };
    gleichWieAjv(s, {});
    gleichWieAjv(s, { a: 1 });
    gleichWieAjv(s, { valueOf: 3 });
  });
});
