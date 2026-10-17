// Hilfsfunktionen für JSON-Schema (Draft 2020-12): Verweise auflösen, Unterschemata finden,
// Leerinstanzen erzeugen. Validierung selbst übernimmt Ajv (validierung.ts).

import type { Segment } from "./pfad";

export function aufloesen(knoten: any, wurzel: any): any {
  let k = knoten;
  let schutz = 0;
  while (k && typeof k === "object" && typeof k.$ref === "string" && schutz++ < 20) {
    if (!k.$ref.startsWith("#/")) return k;
    let ziel: any = wurzel;
    for (const teil of k.$ref.slice(2).split("/")) {
      ziel = ziel?.[teil.replace(/~1/g, "/").replace(/~0/g, "~")];
    }
    const { $ref: _ignoriert, ...rest } = k;
    k = Object.keys(rest).length ? { ...ziel, ...rest } : ziel;
  }
  return k;
}

/** Unterschema an einem Instanzpfad (Zahlen = Array-Index). */
export function unterSchema(wurzel: any, segs: Segment[]): any {
  let k = aufloesen(wurzel, wurzel);
  for (const seg of segs) {
    if (!k) return undefined;
    if (typeof seg === "number") k = aufloesen(k.items, wurzel);
    else k = aufloesen(k.properties?.[seg], wurzel);
  }
  return k;
}

export function typen(knoten: any): string[] {
  if (!knoten) return [];
  if (knoten.type) return ([] as string[]).concat(knoten.type);
  if ("const" in knoten) return [typeof knoten.const];
  if (Array.isArray(knoten.enum)) return [...new Set(knoten.enum.map((e: unknown) => (e === null ? "null" : typeof e)))] as string[];
  if (knoten.properties) return ["object"];
  if (knoten.items) return ["array"];
  return [];
}

export function enumWerte(knoten: any): unknown[] | undefined {
  if (!knoten) return undefined;
  if (Array.isArray(knoten.enum)) return knoten.enum;
  return undefined;
}

/** Erzeugt eine leere, schemakonforme Instanz (Pflichtfelder mit Leerwerten). */
export function leererWert(knoten: any, wurzel: any): any {
  const k = aufloesen(knoten, wurzel);
  if (!k) return null;
  if ("const" in k) return k.const;
  const e = enumWerte(k);
  if (e) {
    if (e.includes("")) return "";
    if (e.includes(null)) return null;
    return e[0];
  }
  const t = typen(k);
  if (t.includes("null") && t.length <= 2 && !t.includes("object") && !t.includes("array") && !t.includes("string")) return null;
  if (t.includes("object")) {
    const o: Record<string, unknown> = {};
    for (const key of k.required || []) {
      o[key] = leererWert(k.properties?.[key], wurzel);
    }
    return o;
  }
  if (t.includes("array")) return [];
  if (t.includes("string")) return "";
  if (t.includes("integer") || t.includes("number")) return null;
  if (t.includes("boolean")) return false;
  return null;
}

/** Leerer Datensatz für ein neues Listenelement (z. B. einen neuen Sachverhalt). */
export function leeresElement(wurzel: any, listenSegs: Segment[]): any {
  const liste = unterSchema(wurzel, listenSegs);
  return leererWert(liste?.items, wurzel);
}
