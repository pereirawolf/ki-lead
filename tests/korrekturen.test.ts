// Regressionstests zu den Befunden des Code-Reviews vom 18.10.2026 (F04, F05, F09, F11, F13).
import { describe, expect, it } from "vitest";
import Ajv from "ajv/dist/2020";
import { pruefeRoh } from "../src/kern/validierung";
import { parseDatumDE } from "../src/kern/kennsaetze";
import { SseLeser } from "../src/anbieter/strom";
import { alsCsv } from "../src/lagebild/ausgabe";

const ajv = () => new Ajv({ strict: false, allErrors: true });
const gleichWieAjv = (schema: object, daten: unknown) => expect(pruefeRoh(schema, daten).length === 0).toBe(ajv().validate(schema, daten));

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

describe("F05: ungültige Fristen", () => {
  it.each(["31.02.2026", "29.02.2027", "01.13.2026", "10.10.2026 25:00", "10.10.2026 12:99", "00.10.2026"])("%s → null", (s) =>
    expect(parseDatumDE(s)).toBeNull(),
  );
  it("gültige Angaben bleiben", () => {
    expect(parseDatumDE("29.02.2028 12:30")?.getDate()).toBe(29);
    const d = parseDatumDE("Handlungsrelevant bis: 15.10.2026 12:00 (Nachbetankung)")!;
    expect([d.getDate(), d.getMonth(), d.getHours(), d.getMinutes()]).toEqual([15, 9, 12, 0]);
    expect(parseDatumDE("15.10.2026")!.getHours()).toBe(23);
  });
});

describe("F09: SSE unabhängig von Chunk-Grenzen", () => {
  const text = 'event: a\r\ndata: {"x":1}\r\n\r\nevent: b\r\ndata: {"y":2}\r\n\r\n: kommentar\r\n\r\nevent: c\rdata: {"z":3}\r\r\n';
  const erwartet = JSON.stringify(new SseLeser().lies(text));
  it("an jeder Position geteilt ergibt dasselbe", () => {
    expect(JSON.parse(erwartet).map((e: any) => e.event)).toEqual(["a", "b", "c"]);
    for (let i = 0; i <= text.length; i++) {
      const l = new SseLeser();
      expect(JSON.stringify([...l.lies(text.slice(0, i)), ...l.lies(text.slice(i))])).toBe(erwartet);
    }
  });
});

describe("F13: CSV ohne Formelinterpretation", () => {
  it("setzt vor Formelzeichen ein Apostroph, Zahlen bleiben", () => {
    const csv = alsCsv([["=1+1", "+A1", "-cmd", "@SUMME(A1)", "\tx", "-3", "+2", "4,5", "normal"]]);
    expect(csv).toBe("﻿'=1+1;'+A1;'-cmd;'@SUMME(A1);'\tx;-3;+2;4,5;normal\r\n");
  });
});
