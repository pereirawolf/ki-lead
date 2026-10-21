// Referenzprüfer Ajv (JSON Schema 2020-12) mit festgelegten Optionen und diagnostischem Vergleich.
import Ajv2020 from "ajv/dist/2020";
import { expect } from "vitest";
import { pruefeRoh } from "../../src/kern/validierung";

/**
 * allErrors: alle Fehler wie der eigene Prüfer; strict: false für Annotationen wie „title“ in Profilschemata;
 * ownProperties: Pflichtfelder und zusätzliche Felder nur als eigene Schlüssel (sonst prüft Ajv nur !== undefined).
 */
export function referenzAjv(): Ajv2020 {
  return new Ajv2020({ allErrors: true, strict: false, ownProperties: true });
}

/** Urteil des Referenzprüfers */
export function ajvGueltig(schema: object, daten: unknown): boolean {
  return referenzAjv().validate(schema, daten) as boolean;
}

/**
 * Der eigene, eval-freie Prüfer muss dasselbe Urteil fällen wie Ajv. Die Diagnose nennt Schema, Daten und die
 * Fehler beider Prüfer. Mit erwartet wird zusätzlich ein unabhängiges Soll festgelegt, damit zwei gleichzeitig
 * permissiv gewordene Prüfer den Test nicht bestehen.
 */
export function gleichWieAjv(schema: object, daten: unknown, erwartet?: boolean): void {
  const ajv = referenzAjv();
  const ajvOk = ajv.validate(schema, daten) as boolean;
  const eigene = pruefeRoh(schema, daten);
  const diagnose = JSON.stringify({ schema, daten, ajv: ajv.errors, eigene }).slice(0, 2000);
  expect(eigene.length === 0, diagnose).toBe(ajvOk);
  if (erwartet !== undefined) expect(ajvOk, `Soll ${erwartet ? "gültig" : "ungültig"}: ${diagnose}`).toBe(erwartet);
}
