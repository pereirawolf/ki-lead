// Schemaprüfung ohne Codeerzeugung (kein eval/new Function), damit die App unter einer strengen
// Content-Security-Policy läuft. Unterstützt die in Meldungsschemata üblichen Schlüsselwörter von
// JSON Schema Draft 2020-12. Die Tests vergleichen das Ergebnis mit Ajv als Referenz.

import { teilePfad } from "./pfad";
import { pfadBezeichnung } from "./ui";
import type { UiKonfig } from "./typen";

export interface SchemaBefund {
  pfad: string;
  keyword: string;
  text: string;
}

interface RohFehler {
  pfad: string;
  keyword: string;
  text: string;
}

const UNTERSTUETZT = new Set([
  "$schema",
  "$id",
  "$ref",
  "$defs",
  "definitions",
  "$comment",
  "title",
  "description",
  "default",
  "examples",
  "deprecated",
  "readOnly",
  "writeOnly",
  "format",
  "type",
  "const",
  "enum",
  "pattern",
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "uniqueItems",
  "contains",
  "required",
  "properties",
  "additionalProperties",
  "patternProperties",
  "minProperties",
  "maxProperties",
  "propertyNames",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "dependentRequired",
]);

function typVon(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}

function typPasst(v: unknown, t: string): boolean {
  const vt = typVon(v);
  if (t === "number") return vt === "number" || vt === "integer";
  return vt === t;
}

function kurz(v: unknown): string {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  if (s === undefined) return "";
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}

/** Strukturelle JSON-Gleichheit: Reihenfolge der Objektschlüssel egal, Reihenfolge in Arrays nicht. */
export function gleich(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((x, i) => gleich(x, bb[i]));
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && gleich((a as any)[k], (b as any)[k]));
}

/** Nur eigene JSON-Schlüssel zählen; geerbte Namen wie „constructor“ oder „toString“ nicht. */
function hat(o: unknown, k: string): boolean {
  return !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
}

function zeiger(pfad: string, teil: string | number): string {
  return pfad + "/" + String(teil).replace(/~/g, "~0").replace(/\//g, "~1");
}

const regexCache = new Map<string, RegExp>();
function regex(muster: string): RegExp {
  let r = regexCache.get(muster);
  if (!r) {
    r = new RegExp(muster, "u");
    regexCache.set(muster, r);
  }
  return r;
}

class Pruefer {
  constructor(private wurzel: any) {}

  aufloesen(s: any): any {
    let k = s;
    let schutz = 0;
    while (k && typeof k === "object" && typeof k.$ref === "string" && schutz++ < 30) {
      if (!k.$ref.startsWith("#")) throw new Error(`Externer Verweis nicht unterstützt: ${k.$ref}`);
      let ziel: any = this.wurzel;
      for (const teil of k.$ref.replace(/^#\/?/, "").split("/").filter(Boolean)) {
        ziel = ziel?.[decodeURIComponent(teil).replace(/~1/g, "/").replace(/~0/g, "~")];
      }
      if (ziel === undefined) throw new Error(`Verweis nicht auflösbar: ${k.$ref}`);
      const { $ref: _r, ...rest } = k;
      // Geschwisterbedingungen neben $ref gelten zusätzlich; ein eigenes allOf wird ergänzt, nicht ersetzt
      k = Object.keys(rest).length ? { ...rest, allOf: [ziel, ...(Array.isArray(rest.allOf) ? rest.allOf : [])] } : ziel;
    }
    if (k && typeof k === "object" && typeof k.$ref === "string") throw new Error(`Verweiskette zu lang oder zyklisch: ${s.$ref}`);
    return k;
  }

  pruefe(v: unknown, schema: any, pfad: string, out: RohFehler[]): void {
    if (schema === true || schema === undefined) return;
    if (schema === false) {
      out.push({ pfad, keyword: "false", text: "Wert ist hier nicht zulässig" });
      return;
    }
    const s = this.aufloesen(schema);
    // Verweise können auf boolesche Schemata zeigen
    if (s === true || s === undefined) return;
    if (s === false) {
      out.push({ pfad, keyword: "false", text: "Wert ist hier nicht zulässig" });
      return;
    }
    if (s.type !== undefined) {
      const ts: string[] = [].concat(s.type);
      if (!ts.some((t) => typPasst(v, t))) {
        out.push({ pfad, keyword: "type", text: `Datentyp „${typVon(v)}“, erwartet ${ts.join(" oder ")}` });
        return;
      }
    }
    if (hat(s, "const") && !gleich(v, s.const)) out.push({ pfad, keyword: "const", text: `erwartet „${kurz(s.const)}“, gefunden „${kurz(v)}“` });
    if (Array.isArray(s.enum) && !s.enum.some((e: unknown) => gleich(e, v))) out.push({ pfad, keyword: "enum", text: `unzulässiger Wert „${kurz(v)}“` });

    if (typeof v === "string") {
      const laenge = [...v].length;
      if (s.minLength !== undefined && laenge < s.minLength) out.push({ pfad, keyword: "minLength", text: "Pflichtangabe fehlt" });
      if (s.maxLength !== undefined && laenge > s.maxLength) out.push({ pfad, keyword: "maxLength", text: `höchstens ${s.maxLength} Zeichen` });
      if (s.pattern !== undefined && !regex(s.pattern).test(v))
        out.push({ pfad, keyword: "pattern", text: s.pattern === "\\S" ? "Pflichtangabe fehlt" : `Format ungültig („${kurz(v)}“)` });
    }
    if (typeof v === "number") {
      if (s.minimum !== undefined && v < s.minimum) out.push({ pfad, keyword: "minimum", text: `Wert ${v} kleiner als ${s.minimum}` });
      if (s.maximum !== undefined && v > s.maximum) out.push({ pfad, keyword: "maximum", text: `Wert ${v} größer als ${s.maximum}` });
      if (typeof s.exclusiveMinimum === "number" && v <= s.exclusiveMinimum)
        out.push({ pfad, keyword: "exclusiveMinimum", text: `Wert muss größer als ${s.exclusiveMinimum} sein` });
      if (typeof s.exclusiveMaximum === "number" && v >= s.exclusiveMaximum)
        out.push({ pfad, keyword: "exclusiveMaximum", text: `Wert muss kleiner als ${s.exclusiveMaximum} sein` });
      if (s.multipleOf !== undefined && Math.abs(v / s.multipleOf - Math.round(v / s.multipleOf)) > 1e-9)
        out.push({ pfad, keyword: "multipleOf", text: `Wert muss ein Vielfaches von ${s.multipleOf} sein` });
    }
    if (Array.isArray(v)) {
      if (s.minItems !== undefined && v.length < s.minItems) out.push({ pfad, keyword: "minItems", text: `mindestens ${s.minItems} Eintrag erforderlich` });
      if (s.maxItems !== undefined && v.length > s.maxItems) out.push({ pfad, keyword: "maxItems", text: `höchstens ${s.maxItems} Einträge zulässig` });
      if (s.uniqueItems) {
        v.forEach((x, i) => {
          if (v.slice(0, i).some((y) => gleich(x, y))) out.push({ pfad, keyword: "uniqueItems", text: `doppelter Eintrag „${kurz(x)}“` });
        });
      }
      const prefix: any[] = Array.isArray(s.prefixItems) ? s.prefixItems : [];
      v.forEach((x, i) => {
        if (i < prefix.length) this.pruefe(x, prefix[i], zeiger(pfad, i), out);
        else if (s.items !== undefined) this.pruefe(x, s.items, zeiger(pfad, i), out);
      });
      if (s.contains !== undefined && !v.some((x) => this.gilt(x, s.contains)))
        out.push({ pfad, keyword: "contains", text: "kein Eintrag erfüllt die Bedingung" });
    }
    if (typVon(v) === "object") {
      const o = v as Record<string, unknown>;
      const schluessel = Object.keys(o);
      for (const k of Array.isArray(s.required) ? s.required : []) if (!hat(o, k)) out.push({ pfad: zeiger(pfad, k), keyword: "required", text: "Feld fehlt" });
      const props = s.properties || {};
      for (const k of Object.keys(props)) if (hat(o, k)) this.pruefe(o[k], props[k], zeiger(pfad, k), out);
      const muster = Object.entries(s.patternProperties || {});
      for (const k of schluessel) {
        const treffer = muster.filter(([m]) => regex(m).test(k));
        treffer.forEach(([, ps]) => this.pruefe(o[k], ps, zeiger(pfad, k), out));
        if (hat(props, k) || treffer.length) continue;
        if (s.additionalProperties === false) out.push({ pfad: zeiger(pfad, k), keyword: "additionalProperties", text: "im Schema nicht vorgesehenes Feld" });
        else if (s.additionalProperties && typeof s.additionalProperties === "object") this.pruefe(o[k], s.additionalProperties, zeiger(pfad, k), out);
      }
      if (s.minProperties !== undefined && schluessel.length < s.minProperties)
        out.push({ pfad, keyword: "minProperties", text: `mindestens ${s.minProperties} Felder erforderlich` });
      if (s.maxProperties !== undefined && schluessel.length > s.maxProperties)
        out.push({ pfad, keyword: "maxProperties", text: `höchstens ${s.maxProperties} Felder zulässig` });
      if (s.propertyNames !== undefined)
        for (const k of schluessel)
          if (!this.gilt(k, s.propertyNames)) out.push({ pfad: zeiger(pfad, k), keyword: "propertyNames", text: "unzulässiger Feldname" });
      for (const [k, abh] of Object.entries(s.dependentRequired || {}))
        if (hat(o, k))
          for (const d of Array.isArray(abh) ? (abh as string[]) : [])
            if (!hat(o, d)) out.push({ pfad: zeiger(pfad, d), keyword: "required", text: `Feld fehlt (erforderlich, weil „${k}“ gesetzt ist)` });
    }
    for (const teil of s.allOf || []) this.pruefe(v, teil, pfad, out);
    if (Array.isArray(s.anyOf) && !s.anyOf.some((t: any) => this.gilt(v, t)))
      out.push({ pfad, keyword: "anyOf", text: "keine der zulässigen Varianten erfüllt" });
    if (Array.isArray(s.oneOf)) {
      const n = s.oneOf.filter((t: any) => this.gilt(v, t)).length;
      if (n !== 1) out.push({ pfad, keyword: "oneOf", text: n === 0 ? "keine der zulässigen Varianten erfüllt" : "mehrere Varianten zugleich erfüllt" });
    }
    if (s.not !== undefined && this.gilt(v, s.not)) out.push({ pfad, keyword: "not", text: "Wert ist hier ausgeschlossen" });
    if (s.if !== undefined) {
      if (this.gilt(v, s.if)) {
        if (s.then !== undefined) this.pruefe(v, s.then, pfad, out);
      } else if (s.else !== undefined) this.pruefe(v, s.else, pfad, out);
    }
  }

  gilt(v: unknown, schema: any): boolean {
    const probe: RohFehler[] = [];
    this.pruefe(v, schema, "", probe);
    return probe.length === 0;
  }
}

const JSON_TYPEN = new Set(["string", "number", "integer", "boolean", "object", "array", "null"]);
const istSchemaWert = (x: unknown) => typeof x === "boolean" || (!!x && typeof x === "object" && !Array.isArray(x));
const istObjektWert = (x: unknown) => !!x && typeof x === "object" && !Array.isArray(x);
const istNichtNegativ = (x: unknown) => Number.isInteger(x) && (x as number) >= 0;
const istTextListe = (x: unknown) => Array.isArray(x) && x.every((t) => typeof t === "string");

/**
 * Prüft den Wert eines Schlüsselworts auf die Form, die der Prüfer erwartet. Ohne diese Prüfung würde etwa
 * required als Text zeichenweise gelesen oder properties: null die Prüfung abbrechen.
 */
function wertFehler(key: string, wert: unknown): string | null {
  switch (key) {
    case "type": {
      const liste = Array.isArray(wert) ? wert : [wert];
      return liste.length && liste.every((t) => typeof t === "string" && JSON_TYPEN.has(t)) ? null : "eine Typangabe oder eine Liste davon";
    }
    case "required":
      return istTextListe(wert) ? null : "eine Liste von Feldnamen";
    case "enum":
      return Array.isArray(wert) ? null : "eine Liste";
    case "properties":
    case "$defs":
    case "definitions":
    case "patternProperties":
      return istObjektWert(wert) && Object.values(wert as object).every(istSchemaWert) ? null : "ein Objekt mit Teilschemata";
    case "items":
    case "additionalProperties":
    case "contains":
    case "propertyNames":
    case "not":
    case "if":
    case "then":
    case "else":
      return istSchemaWert(wert) ? null : "ein Teilschema (Objekt oder true/false)";
    case "prefixItems":
    case "allOf":
    case "anyOf":
    case "oneOf":
      return Array.isArray(wert) && wert.length > 0 && wert.every(istSchemaWert) ? null : "eine nicht leere Liste von Teilschemata";
    case "minLength":
    case "maxLength":
    case "minItems":
    case "maxItems":
    case "minProperties":
    case "maxProperties":
      return istNichtNegativ(wert) ? null : "eine ganze Zahl ab 0";
    case "minimum":
    case "maximum":
    case "exclusiveMinimum":
    case "exclusiveMaximum":
      return typeof wert === "number" && Number.isFinite(wert) ? null : "eine Zahl";
    case "multipleOf":
      return typeof wert === "number" && wert > 0 ? null : "eine Zahl größer als 0";
    case "uniqueItems":
      return typeof wert === "boolean" ? null : "true oder false";
    case "pattern":
    case "$ref":
      return typeof wert === "string" ? null : "ein Text";
    case "dependentRequired":
      return istObjektWert(wert) && Object.values(wert as object).every(istTextListe) ? null : "ein Objekt mit Listen von Feldnamen";
    default:
      return null;
  }
}

/** Größte Verschachtelungstiefe, bis zu der ein Schema geprüft wird */
const MAX_SCHEMATIEFE = 60;

/** Prüft, ob ein Schema verwendbar ist; liefert die Fehlermeldung oder null. */
export function schemaFehler(schema: unknown): string | null {
  if (!schema || typeof schema !== "object") return "Das Schema ist kein JSON-Objekt.";
  const unbekannt = new Set<string>();
  const fehler: string[] = [];
  const pruefer = new Pruefer(schema);
  let zuTief = false;
  const lauf = (k: any, tiefe: number) => {
    if (!k || typeof k !== "object") return;
    if (tiefe > MAX_SCHEMATIEFE) {
      zuTief = true;
      return;
    }
    if (Array.isArray(k)) {
      k.forEach((x) => lauf(x, tiefe + 1));
      return;
    }
    for (const [key, wert] of Object.entries(k)) {
      const f = UNTERSTUETZT.has(key) ? wertFehler(key, wert) : null;
      if (f) {
        fehler.push(`„${key}“ muss ${f} sein`);
        continue;
      }
      if (key === "properties" || key === "$defs" || key === "definitions" || key === "patternProperties") {
        for (const [name, sub] of Object.entries(wert as object)) {
          if (key === "patternProperties") {
            try {
              regex(name);
            } catch {
              fehler.push(`Ungültiger regulärer Ausdruck: ${name}`);
            }
          }
          lauf(sub, tiefe + 1);
        }
        continue;
      }
      if (key === "enum" || key === "const" || key === "examples" || key === "default" || key === "required" || key === "dependentRequired") continue;
      if (!UNTERSTUETZT.has(key)) unbekannt.add(key);
      if (key === "pattern" && typeof wert === "string") {
        try {
          regex(wert);
        } catch {
          fehler.push(`Ungültiger regulärer Ausdruck: ${wert}`);
        }
      }
      if (key === "$ref" && typeof wert === "string") {
        try {
          pruefer.aufloesen({ $ref: wert });
        } catch (e) {
          fehler.push((e as Error).message);
        }
      }
      if (typeof wert === "object") lauf(wert, tiefe + 1);
    }
  };
  lauf(schema, 0);
  if (zuTief) fehler.push(`Das Schema ist tiefer als ${MAX_SCHEMATIEFE} Ebenen verschachtelt und wurde nicht vollständig geprüft`);
  if (unbekannt.size) fehler.push(`Nicht unterstützte Schlüsselwörter: ${[...unbekannt].join(", ")}`);
  return fehler.length ? fehler.join("; ") : null;
}

/** Rohprüfung ohne Bezeichnungen (für Tests und interne Zwecke). */
export function pruefeRoh(schema: object, daten: unknown): RohFehler[] {
  const out: RohFehler[] = [];
  new Pruefer(schema).pruefe(daten, schema, "", out);
  return out;
}

export function pruefeGegenSchema(schema: object, daten: unknown, ui: UiKonfig): SchemaBefund[] {
  const out: SchemaBefund[] = [];
  const gesehen = new Set<string>();
  for (const f of pruefeRoh(schema, daten)) {
    const zeile = `${pfadBezeichnung(ui, teilePfad(f.pfad))}: ${f.text}`;
    if (gesehen.has(zeile)) continue;
    gesehen.add(zeile);
    out.push({ pfad: f.pfad, keyword: f.keyword, text: zeile });
  }
  return out;
}
