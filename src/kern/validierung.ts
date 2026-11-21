// Schemaprüfung ohne Codeerzeugung (kein eval/new Function), damit die App unter einer strengen
// Content-Security-Policy läuft. Unterstützt die in Meldungsschemata üblichen Schlüsselwörter von
// JSON Schema Draft 2020-12. Die Tests vergleichen das Ergebnis mit Ajv als Referenz.

import { generischerPfad, holeWert, teilePfad, type Segment } from "./pfad";
import { feldUi, pfadBezeichnung, radarFuer, wertBezeichnung } from "./ui";
import type { RadarAchse, UiKonfig } from "./typen";

export interface SchemaBefund {
  pfad: string;
  keyword: string;
  text: string;
  /** Typbefund zu einem leeren Wert (null): in LEAD-Meldung-v2 „unbekannt“, kein falscher Datentyp (seit 0.9.7) */
  leer?: boolean;
}

interface RohFehler {
  pfad: string;
  keyword: string;
  text: string;
  /** geprüfter Wert, für die Klartextfassung in pruefeGegenSchema (seit 0.9.7) */
  wert?: unknown;
  /** zulässige Werte (enum, const) */
  erlaubt?: unknown[];
  /** erwartete Datentypen (type) */
  erwartet?: string[];
  /** anyOf/oneOf ohne passende Form: Befunde der nächstliegenden Formen (seit 0.9.7) */
  varianten?: RohFehler[][];
}

/** Datentypen in Worten (seit 0.9.7, statt „integer“, „null“ usw.) */
const TYP_WORT: Record<string, string> = {
  string: "Text",
  number: "Zahl",
  integer: "ganze Zahl",
  boolean: "ja/nein",
  object: "Gruppe von Angaben",
  array: "Liste",
  null: "leer",
};
const typWorte = (ts: string[]) => {
  const w = ts.map((t) => TYP_WORT[t] ?? t);
  return w.length > 1 ? `${w.slice(0, -1).join(", ")} oder ${w[w.length - 1]}` : (w[0] ?? "");
};

/** Text, mit dem eine Pflichtangabe als fehlend gemeldet wird (Maske und Prüfschritt) */
export const PFLICHT_FEHLT = "Pflichtangabe fehlt";

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
  const ka = Object.keys(a);
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

/** Größte Verschachtelung beim Prüfen; darüber gilt das Schema als zyklisch verweisend */
const MAX_PRUEFTIEFE = 400;

class Pruefer {
  private tiefe = 0;
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
    // Zyklen über allOf, anyOf, not usw. hängen nicht von den Daten ab und würden den Stapel sprengen
    if (this.tiefe >= MAX_PRUEFTIEFE) throw new Error("Schema verweist zyklisch auf sich selbst oder ist zu tief verschachtelt");
    this.tiefe++;
    try {
      this.pruefeKnoten(v, schema, pfad, out);
    } finally {
      this.tiefe--;
    }
  }

  private pruefeKnoten(v: unknown, schema: any, pfad: string, out: RohFehler[]): void {
    if (schema === true || schema === undefined) return;
    if (schema === false) {
      out.push({ pfad, keyword: "false", wert: v, text: "Angabe ist hier nicht zulässig" });
      return;
    }
    const s = this.aufloesen(schema);
    // Verweise können auf boolesche Schemata zeigen
    if (s === true || s === undefined) return;
    if (s === false) {
      out.push({ pfad, keyword: "false", wert: v, text: "Angabe ist hier nicht zulässig" });
      return;
    }
    if (s.type !== undefined) {
      const ts: string[] = [].concat(s.type);
      if (!ts.some((t) => typPasst(v, t))) {
        out.push({
          pfad,
          keyword: "type",
          wert: v,
          erwartet: ts,
          text:
            v === null
              ? PFLICHT_FEHLT
              : `erwartet ist ${typWorte(ts)}, eingetragen ist ${TYP_WORT[typVon(v)] ?? typVon(v)}${typeof v === "string" ? ` („${kurz(v)}“)` : ""}`,
        });
        return;
      }
    }
    if (hat(s, "const") && !gleich(v, s.const))
      out.push({ pfad, keyword: "const", wert: v, erlaubt: [s.const], text: `erwartet „${kurz(s.const)}“, eingetragen „${kurz(v)}“` });
    if (Array.isArray(s.enum) && !s.enum.some((e: unknown) => gleich(e, v)))
      out.push({ pfad, keyword: "enum", wert: v, erlaubt: s.enum, text: v === null || v === "" ? PFLICHT_FEHLT : `„${kurz(v)}“ ist hier nicht vorgesehen` });

    if (typeof v === "string") {
      const laenge = [...v].length;
      if (s.minLength !== undefined && laenge < s.minLength) out.push({ pfad, keyword: "minLength", text: PFLICHT_FEHLT });
      if (s.maxLength !== undefined && laenge > s.maxLength) out.push({ pfad, keyword: "maxLength", text: `höchstens ${s.maxLength} Zeichen` });
      if (s.pattern !== undefined && !regex(s.pattern).test(v))
        out.push({
          pfad,
          keyword: "pattern",
          text:
            s.pattern === "\\S" || v === ""
              ? PFLICHT_FEHLT
              : /^\d{4}-\d{2}-\d{2}$/.test(v) && regex(s.pattern).test(`${v}T00:00`)
                ? `Uhrzeit fehlt („${kurz(v)}“, erwartet JJJJ-MM-TTThh:mm)`
                : `Format ungültig („${kurz(v)}“)`,
        });
    }
    if (typeof v === "number") {
      if (s.minimum !== undefined && v < s.minimum) out.push({ pfad, keyword: "minimum", text: `${v} ist zu klein (mindestens ${s.minimum})` });
      if (s.maximum !== undefined && v > s.maximum) out.push({ pfad, keyword: "maximum", text: `${v} ist zu groß (höchstens ${s.maximum})` });
      if (typeof s.exclusiveMinimum === "number" && v <= s.exclusiveMinimum)
        out.push({ pfad, keyword: "exclusiveMinimum", text: `Wert muss größer als ${s.exclusiveMinimum} sein` });
      if (typeof s.exclusiveMaximum === "number" && v >= s.exclusiveMaximum)
        out.push({ pfad, keyword: "exclusiveMaximum", text: `Wert muss kleiner als ${s.exclusiveMaximum} sein` });
      if (s.multipleOf !== undefined && Math.abs(v / s.multipleOf - Math.round(v / s.multipleOf)) > 1e-9)
        out.push({ pfad, keyword: "multipleOf", text: `Wert muss ein Vielfaches von ${s.multipleOf} sein` });
    }
    if (Array.isArray(v)) {
      if (s.minItems !== undefined && v.length < s.minItems)
        out.push({ pfad, keyword: "minItems", text: `mindestens ${s.minItems} ${s.minItems === 1 ? "Eintrag" : "Einträge"} erforderlich` });
      if (s.maxItems !== undefined && v.length > s.maxItems) out.push({ pfad, keyword: "maxItems", text: `höchstens ${s.maxItems} Einträge zulässig` });
      if (s.uniqueItems) {
        v.forEach((x, i) => {
          if (v.slice(0, i).some((y) => gleich(x, y))) out.push({ pfad, keyword: "uniqueItems", text: `„${kurz(x)}“ steht doppelt in der Liste` });
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
      for (const k of Array.isArray(s.required) ? s.required : [])
        if (!hat(o, k)) out.push({ pfad: zeiger(pfad, k), keyword: "required", text: PFLICHT_FEHLT });
      const props = s.properties || {};
      for (const k of Object.keys(props)) if (hat(o, k)) this.pruefe(o[k], props[k], zeiger(pfad, k), out);
      const muster = Object.entries(s.patternProperties || {});
      for (const k of schluessel) {
        const treffer = muster.filter(([m]) => regex(m).test(k));
        treffer.forEach(([, ps]) => this.pruefe(o[k], ps, zeiger(pfad, k), out));
        if (hat(props, k) || treffer.length) continue;
        if (s.additionalProperties === false)
          out.push({ pfad: zeiger(pfad, k), keyword: "additionalProperties", text: "Angabe ist in diesem Meldungsformat nicht vorgesehen" });
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
            if (!hat(o, d)) out.push({ pfad: zeiger(pfad, d), keyword: "required", text: `${PFLICHT_FEHLT} (erforderlich, weil „${k}“ gesetzt ist)` });
    }
    for (const teil of s.allOf || []) this.pruefe(v, teil, pfad, out);
    if (Array.isArray(s.anyOf) && !s.anyOf.some((t: any) => this.gilt(v, t)))
      out.push({ pfad, keyword: "anyOf", wert: v, text: "Eintrag hat keine zulässige Form", varianten: this.varianten(v, s.anyOf, pfad) });
    if (Array.isArray(s.oneOf)) {
      const n = s.oneOf.filter((t: any) => this.gilt(v, t)).length;
      if (n !== 1)
        out.push({
          pfad,
          keyword: "oneOf",
          wert: v,
          text: n === 0 ? "Eintrag hat keine zulässige Form" : "Eintrag passt auf mehrere Formen zugleich",
          ...(n === 0 ? { varianten: this.varianten(v, s.oneOf, pfad) } : {}),
        });
    }
    if (s.not !== undefined && this.gilt(v, s.not)) out.push({ pfad, keyword: "not", text: "Eintrag ist hier ausgeschlossen" });
    if (s.if !== undefined) {
      if (this.gilt(v, s.if)) {
        if (s.then !== undefined) this.pruefe(v, s.then, pfad, out);
      } else if (s.else !== undefined) this.pruefe(v, s.else, pfad, out);
    }
  }

  /**
   * Befunde je Form, die am wenigsten fehlt (höchstens zwei Befunde), ohne die Form „leer“ (type null): Sie sagt nur,
   * dass das Feld auch leer bleiben darf. Grundlage der Klartextfassung in pruefeGegenSchema (seit 0.9.7).
   */
  varianten(v: unknown, formen: any[], pfad: string): RohFehler[][] {
    const je = formen
      .map((t) => {
        const f: RohFehler[] = [];
        this.pruefe(v, t, pfad, f);
        return f;
      })
      .filter((f) => f.length && !f.every((x) => x.keyword === "type" && x.erwartet?.length === 1 && x.erwartet[0] === "null"));
    const min = Math.min(...je.map((f) => f.length));
    return min <= 2 ? je.filter((f) => f.length === min) : [];
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
  // Probeläufe mit einfachen Werten decken Zyklen auf, die nicht von den Daten abhängen (z. B. allOf mit $ref auf sich selbst)
  if (!fehler.length)
    for (const probe of [{}, [], "", 0, null, true]) {
      try {
        pruefer.pruefe(probe, schema, "", []);
      } catch (e) {
        fehler.push((e as Error).message);
        break;
      }
    }
  if (zuTief) fehler.push(`Das Schema ist tiefer als ${MAX_SCHEMATIEFE} Ebenen verschachtelt und wurde nicht vollständig geprüft`);
  if (unbekannt.size) fehler.push(`Nicht unterstützte Schlüsselwörter: ${[...unbekannt].join(", ")}`);
  return fehler.length ? fehler.join("; ") : null;
}

/**
 * Hinweise zu einem verwendbaren Schema (seit 0.6.2, TP-2026-W44-10): „format“ steht in der Liste der bekannten
 * Schlüsselwörter, wird aber weder von der App noch von Ajv ohne ajv-formats geprüft. Profilautoren sollen das wissen,
 * statt sich auf eine Prüfung zu verlassen, die nicht stattfindet.
 */
export function schemaHinweise(schema: unknown): string[] {
  const formate = new Map<string, Set<string>>();
  const lauf = (k: unknown, pfad: string, tiefe: number) => {
    if (!k || typeof k !== "object" || tiefe > MAX_SCHEMATIEFE) return;
    if (Array.isArray(k)) {
      k.forEach((x, i) => lauf(x, `${pfad}[${i}]`, tiefe + 1));
      return;
    }
    for (const [key, wert] of Object.entries(k)) {
      if (key === "format" && typeof wert === "string") {
        if (!formate.has(wert)) formate.set(wert, new Set());
        formate.get(wert)!.add(pfad || "(Wurzel)");
      }
      if (key === "enum" || key === "const" || key === "examples" || key === "default") continue;
      if (wert && typeof wert === "object") lauf(wert, pfad ? `${pfad}.${key}` : key, tiefe + 1);
    }
  };
  lauf(schema, "", 0);
  return [...formate.entries()].map(
    ([f, pfade]) =>
      `„format“: „${f}“ an ${pfade.size} Stelle${pfade.size === 1 ? "" : "n"} (${[...pfade].slice(0, 5).join(", ")}${pfade.size > 5 ? ", …" : ""}) wird von der App nicht geprüft; Muster bitte als „pattern“ festlegen.`,
  );
}

/** Rohprüfung ohne Bezeichnungen (für Tests und interne Zwecke). */
export function pruefeRoh(schema: object, daten: unknown): RohFehler[] {
  const out: RohFehler[] = [];
  new Pruefer(schema).pruefe(daten, schema, "", out);
  return out;
}

/** Anfang des Befunds zu Radarachsen, die noch niemand bewertet hat; die Maske zeigt ihn wie „Pflichtangabe fehlt“ erst
 * nach Bearbeitung des Sachverhalts (seit 0.9.7) */
export const RADAR_UNBEWERTET = "noch nicht bewertet";

interface RadarOrt {
  radar: Segment[];
  achse: RadarAchse;
  kurz: string;
  feld: Segment | undefined;
}

/** Liegt der Pfad in einer Radarachse (Widget „radar“)? Dann Radar, Achse und Feld der Achse */
function radarOrt(ui: UiKonfig, segs: Segment[]): RadarOrt | null {
  for (let i = 1; i < segs.length; i++) {
    const f = feldUi(ui, generischerPfad(segs.slice(0, i)));
    if (f.widget !== "radar") continue;
    const achse = radarFuer(ui, f)?.achsen.find((a) => a.key === segs[i]);
    if (!achse) return null;
    return { radar: segs.slice(0, i), achse, kurz: /^(D\d+)\b/.exec(achse.label)?.[1] ?? achse.label, feld: segs[i + 1] };
  }
  return null;
}

/**
 * Befunde einer Radarachse nach LEAD-Meldung-v2 in Worten des Kodierleitfadens (seit 0.9.7, Entscheidung des
 * Herausgebers vom 21.11.2026). „unbewertet“: Status offen, weder Grund noch Begründung – die Achse ist neu.
 */
function radarText(ort: RadarOrt, f: RohFehler, daten: unknown, ui: UiKonfig): string | "unbewertet" | null {
  const achse = holeWert(daten, [...ort.radar, ort.achse.key]) as Record<string, unknown> | undefined;
  const status = typeof achse?.status === "string" ? achse.status : "";
  const leer = (x: unknown) => x === undefined || x === null || (typeof x === "string" && !x.trim());
  if (ort.feld === "offen_grund" && f.keyword === "required")
    return leer(achse?.begruendung) && leer(achse?.stufe)
      ? "unbewertet"
      : `${ort.kurz} ist offen, aber ohne Grund – Grund wählen (${["kein_bezugsgegenstand", "kein_beleg", "bandbreite_ueber_stufengrenze", "sonstiges"].map((w) => wertBezeichnung(ui, w)).join(", ")}) oder eine Stufe setzen`;
  if (ort.feld === "stufe" && f.keyword === "type")
    return f.wert === null
      ? `${ort.kurz} hat den Status „${wertBezeichnung(ui, status)}“, aber keine Stufe – Stufe wählen oder Status „offen“ mit Grund setzen`
      : `${ort.kurz} hat den Status „offen“, aber die Stufe ${String(f.wert)} – Status oder Stufe anpassen`;
  if (ort.feld === "offen_grund" && f.keyword === "false") return `${ort.kurz} hat eine Stufe und zugleich einen Grund für „offen“ – Grund entfernen`;
  return null;
}

/** Klartext eines Befunds mit Auswahlwerten: Anzeigeform der Werte, zulässige Werte genannt */
function auswahlText(f: RohFehler, ui: UiKonfig): string {
  const zeigen = (x: unknown) => (typeof x === "string" ? wertBezeichnung(ui, x) : kurz(x));
  if (f.keyword === "const" && f.erlaubt) return `erwartet „${zeigen(f.erlaubt[0])}“, eingetragen „${zeigen(f.wert)}“`;
  if (f.keyword === "enum" && f.erlaubt && f.text !== PFLICHT_FEHLT) {
    const moeglich = f.erlaubt.filter((x) => x !== null && x !== "");
    const liste = moeglich.slice(0, 8).map(zeigen).join(", ");
    return `„${zeigen(f.wert)}“ ist hier nicht vorgesehen${liste ? `; möglich: ${liste}${moeglich.length > 8 ? ", …" : ""}` : ""}`;
  }
  return f.text;
}

export function pruefeGegenSchema(schema: object, daten: unknown, ui: UiKonfig): SchemaBefund[] {
  const out: SchemaBefund[] = [];
  const gesehen = new Set<string>();
  const unbewertet = new Map<string, { radar: Segment[]; achsen: string[] }>();
  const dazu = (b: SchemaBefund) => {
    if (gesehen.has(b.text)) return;
    gesehen.add(b.text);
    out.push(b);
  };
  for (const f of pruefeRoh(schema, daten)) {
    const segs = teilePfad(f.pfad);
    const ort = radarOrt(ui, segs);
    const r = ort ? radarText(ort, f, daten, ui) : null;
    if (ort && r === "unbewertet") {
      const k = ort.radar.join("/");
      const u = unbewertet.get(k) ?? { radar: ort.radar, achsen: [] };
      if (!u.achsen.includes(ort.kurz)) u.achsen.push(ort.kurz);
      unbewertet.set(k, u);
      continue;
    }
    if (ort && r) {
      // am Radar selbst, damit die Maske den Befund dort zeigt (Status und Grund stehen eingeklappt darunter)
      dazu({ pfad: zeigerAus(ort.radar), keyword: f.keyword, text: `${pfadBezeichnung(ui, ort.radar)}: ${r}` });
      continue;
    }
    // keine zulässige Form: was der nächstliegenden Form fehlt („Quellen: mindestens 1 Eintrag erforderlich oder
    // Fehlanzeige: Pflichtangabe fehlt“) statt der bloßen Feststellung
    if (f.varianten?.length) {
      const teil = (x: RohFehler) => `${pfadBezeichnung(ui, teilePfad(x.pfad))}: ${auswahlText(x, ui)}`;
      const formen = [...new Set(f.varianten.slice(0, 3).map((v) => v.map(teil).join("; ")))];
      dazu({ pfad: f.varianten[0]![0]!.pfad, keyword: f.keyword, text: formen.join(" – oder – ") });
      continue;
    }
    dazu({
      pfad: f.pfad,
      keyword: f.keyword,
      text: `${pfadBezeichnung(ui, segs)}: ${auswahlText(f, ui)}`,
      ...(f.keyword === "type" && f.wert === null ? { leer: true } : {}),
    });
  }
  for (const { radar, achsen } of unbewertet.values())
    dazu({
      pfad: zeigerAus(radar),
      keyword: "required",
      text: `${pfadBezeichnung(ui, radar)}: ${RADAR_UNBEWERTET}: ${achsen.join(", ")} – je Achse eine Stufe wählen oder „offen“ mit Grund angeben`,
    });
  return out;
}

/** JSON-Zeiger aus Segmenten („/sachverhalte/0/module/…“) */
function zeigerAus(segs: Segment[]): string {
  return segs.reduce<string>((p, s) => zeiger(p, s), "");
}
