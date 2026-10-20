// Eval-freier Schemaprüfer: Referenzvergleich mit Ajv, verständliche Fehlermeldungen, Regressionen aus
// Review 18.10.2026 (F04 Verweise, F11 strukturelle Gleichheit) und Review 20.10.2026 (F04 eigene JSON-Schlüssel).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaDateien, ilkaMeldung } from "../support/fixtures";
import { gleichWieAjv, referenzAjv } from "../support/ajv";
import { pruefeRoh, pruefeGegenSchema } from "../../src/kern/validierung";
import { pfadBezeichnung } from "../../src/kern/ui";

const ilka = ilkaDateien();
function varianten(d: any): any[] {
  const k = () => JSON.parse(JSON.stringify(d));
  const v: any[] = [];
  const add = (f: (x: any) => void) => {
    const x = k();
    f(x);
    v.push(x);
  };
  add(() => {});
  add((x) => {
    x._status = "final";
    x.land = "";
  });
  add((x) => {
    x._status = "final";
    x.sachverhalte = [];
  });
  add((x) => {
    x._status = "Entwurf";
    x.sachverhalte = [];
    x.land = "";
  });
  add((x) => {
    x.sachverhalte[0].sofort.lagenradar.d3 = 7;
  });
  add((x) => {
    x.sachverhalte[0].sofort.lagenradar.d3 = 2.5;
  });
  add((x) => {
    x.sachverhalte[0].sofort.lagenradar.d4 = "U";
  });
  add((x) => {
    delete x.sachverhalte[0].sofort.lagenradar.d8;
  });
  add((x) => {
    x.sachverhalte[0].art = ["Sonstiges", "Sonstiges"];
  });
  add((x) => {
    x.sachverhalte[0].art = ["Unbekannt"];
  });
  add((x) => {
    x.meldezeitpunkt = "2026-10-14 10:00";
  });
  add((x) => {
    x.meldezeitraum.von = "14.10.2026";
  });
  add((x) => {
    x.schema = "LEAD-Meldung-v0";
  });
  add((x) => {
    x._entstehung = { verfahren: "KI" };
  });
  add((x) => {
    x._entstehung = { werkzeug: "x" };
  });
  add((x) => {
    x.freigabe.versand.extra = 1;
  });
  add((x) => {
    x._status = "final";
    x.sachverhalte[0].bezeichnung = "   ";
  });
  add((x) => {
    x.quellen = null;
  });
  return v;
}

describe("eval-freier Schemaprüfer gegen Ajv", () => {
  it("fällt bei allen Varianten dasselbe Urteil", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const ajv = referenzAjv();
    const fn = ajv.compile(p!.schema);
    let n = 0;
    for (const { daten } of ilka) {
      for (const v of varianten(daten)) {
        const ajvOk = fn(v) as boolean;
        const unserOk = pruefeRoh(p!.schema, v).length === 0;
        expect(unserOk, JSON.stringify(fn.errors)).toBe(ajvOk);
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
          const unsere = new Set(pruefeRoh(p!.schema, v).map((f) => f.pfad));
          expect([...unsere].sort()).toEqual([...ajvPfade].sort());
        }
        n++;
      }
    }
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
  it.each([1, 7, 12, 5.5])("$ref plus allOf wie Ajv (%s)", (v) => gleichWieAjv(s, v));
  it("$ref auf false und true", () => {
    const f = { type: "object", $defs: { nein: false, ja: true }, properties: { a: { $ref: "#/$defs/nein" }, b: { $ref: "#/$defs/ja" } } };
    expect(() => pruefeRoh(f, { a: 1 })).not.toThrow();
    gleichWieAjv(f, { a: 1 });
    gleichWieAjv(f, { b: 1 });
    gleichWieAjv({ ...f, properties: { a: { $ref: "#/$defs/nein", description: "x" } } }, { a: 1 });
  });
});

describe("F11: strukturelle Gleichheit", () => {
  it.each([
    [{ enum: [{ a: 1, b: { c: [1, 2] } }] }, { b: { c: [1, 2] }, a: 1 }],
    [{ enum: [{ a: [1, 2] }] }, { a: [2, 1] }],
    [{ const: { x: 1, y: 2 } }, { y: 2, x: 1 }],
    [
      { type: "array", uniqueItems: true },
      [
        { a: 1, b: 2 },
        { b: 2, a: 1 },
      ],
    ],
    [
      { type: "array", uniqueItems: true },
      [
        [1, 2],
        [2, 1],
      ],
    ],
  ])("wie Ajv: %j / %j", (schema, daten) => gleichWieAjv(schema, daten));
});

describe("F04: Schemaprüfung zählt nur eigene JSON-Schlüssel", () => {
  const gleichWieAjv = (schema: object, daten: unknown) => expect(pruefeRoh(schema, daten).length === 0).toBe(referenzAjv().validate(schema, daten));

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
