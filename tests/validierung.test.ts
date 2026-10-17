import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import { jsonDateien, profil } from "./hilfen";
import { pruefeRoh, schemaFehler } from "../src/kern/validierung";

// Referenzvergleich: Der eval-freie Prüfer der App muss bei allen Varianten dasselbe Urteil fällen wie Ajv.
const ilka = jsonDateien("daten/orkantief-ilka");

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
    const ajv = new Ajv2020({ allErrors: true, strict: false });
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

  it("erkennt unbrauchbare Schemata", () => {
    expect(schemaFehler({ type: "object", properties: { a: { $ref: "#/$defs/fehlt" } } })).toMatch(/nicht auflösbar/);
    expect(schemaFehler({ type: "string", pattern: "([" })).toMatch(/regulärer Ausdruck/);
    expect(schemaFehler({ type: "object", unevaluatedProperties: false })).toMatch(/Nicht unterstützte/);
  });
});
