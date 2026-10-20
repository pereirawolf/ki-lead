// Eignung eines Meldungsschemas für den eval-freien Prüfer (Review 20.10.2026, F06) und unbrauchbare Schemata.
import { describe, expect, it } from "vitest";
import { leseOrdner } from "../support/dateien";
import { schemaFehler } from "../../src/kern/validierung";

import { repoPfad } from "../support/dateien";
describe("eval-freier Schemaprüfer gegen Ajv", () => {
  it("erkennt unbrauchbare Schemata", () => {
    expect(schemaFehler({ type: "object", properties: { a: { $ref: "#/$defs/fehlt" } } })).toMatch(/nicht auflösbar/);
    expect(schemaFehler({ type: "string", pattern: "([" })).toMatch(/regulärer Ausdruck/);
    expect(schemaFehler({ type: "object", unevaluatedProperties: false })).toMatch(/Nicht unterstützte/);
  });
});

describe("F06: Eignungsprüfung des Meldungsschemas", () => {
  it.each<[string, object, RegExp]>([
    ["required als Text", { type: "object", required: "abc" }, /„required“ muss eine Liste von Feldnamen sein/],
    ["properties null", { type: "object", properties: null }, /„properties“ muss ein Objekt mit Teilschemata sein/],
    ["unbekannter Typ", { type: "text" }, /„type“ muss eine Typangabe/],
    ["negative Länge", { type: "string", minLength: -1 }, /„minLength“ muss eine ganze Zahl ab 0 sein/],
    ["enum als Text", { enum: "A" }, /„enum“ muss eine Liste sein/],
    ["items als Zahl", { type: "array", items: 3 }, /„items“ muss ein Teilschema/],
    ["leeres anyOf", { anyOf: [] }, /„anyOf“ muss eine nicht leere Liste/],
    ["multipleOf 0", { type: "number", multipleOf: 0 }, /„multipleOf“ muss eine Zahl größer als 0 sein/],
    ["zyklischer Verweis", { $defs: { a: { $ref: "#/$defs/b" }, b: { $ref: "#/$defs/a" } }, $ref: "#/$defs/a" }, /Verweiskette zu lang oder zyklisch/],
    ["Zyklus über allOf", { allOf: [{ $ref: "#" }] }, /zyklisch/],
    ["Zyklus über $ref mit Nachbarschlüssel", { $defs: { a: { $ref: "#/$defs/a", minLength: 1 } }, $ref: "#/$defs/a" }, /zyklisch/],
  ])("%s: lesbarer Fehler statt Ausnahme oder stiller Freigabe", (_, schema, meldung) => {
    let f: string | null = null;
    expect(() => (f = schemaFehler(schema))).not.toThrow();
    expect(f).toMatch(meldung);
  });

  it("zu tiefe Verschachtelung wird gemeldet", () => {
    let s: any = { type: "string" };
    for (let i = 0; i < 70; i++) s = { type: "object", properties: { x: s } };
    expect(schemaFehler(s)).toMatch(/tiefer als 60 Ebenen/);
  });

  it("gültige Schemata mit dependentRequired und booleschen Teilschemata bleiben verwendbar", () => {
    expect(
      schemaFehler({
        type: "object",
        properties: { a: { type: ["string", "null"] }, b: true, c: { type: "array", items: false } },
        dependentRequired: { a: ["b"] },
        additionalProperties: false,
      }),
    ).toBeNull();
  });

  it("die Schemata der mitgelieferten Profile bleiben verwendbar", async () => {
    for (const name of ["lead-beispiel", "muster"]) {
      const d = leseOrdner(repoPfad("profile", name));
      const m = JSON.parse(d["profil.json"]);
      expect(schemaFehler(JSON.parse(d[m.meldung.schema])), name).toBeNull();
    }
  });
});
