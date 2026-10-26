// Strenges JSON-Schema für Structured Outputs (OpenAI, Mistral): jedes Objekt geschlossen, alle Felder Pflicht,
// optionale Felder nullable. Seit 0.6.2 eigene Datei (TP-2026-W44-03), vorher in openai.ts.

/** Strenges Schema für Structured Outputs: jedes Objekt geschlossen, alle Felder Pflicht (optionale nullable). */
export function strengesSchema(s: any): any {
  if (Array.isArray(s)) return s.map(strengesSchema);
  if (!s || typeof s !== "object") return s;
  const out: any = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === "properties" && v && typeof v === "object") {
      out.properties = Object.fromEntries(Object.entries(v as object).map(([pk, pv]) => [pk, strengesSchema(pv)]));
    } else if (k === "items" || k === "anyOf" || k === "$defs" || k === "definitions") {
      out[k] =
        k === "$defs" || k === "definitions" ? Object.fromEntries(Object.entries(v as object).map(([dk, dv]) => [dk, strengesSchema(dv)])) : strengesSchema(v);
    } else out[k] = v;
  }
  if (out.type === "object" || out.properties) {
    const alle = Object.keys(out.properties || {});
    const pflicht = new Set<string>(out.required || []);
    for (const key of alle) {
      if (pflicht.has(key)) continue;
      const p = out.properties[key];
      const t = p?.type;
      // enum, const und Verweise schränken die Werte weiter ein; null muss dann als eigene Alternative stehen,
      // sonst wäre das bisher optionale Feld nur noch mit einem der erlaubten Werte zu füllen.
      const eingeschraenkt = !p || typeof p !== "object" || "enum" in p || "const" in p || "$ref" in p || "anyOf" in p || "oneOf" in p || "allOf" in p;
      if (eingeschraenkt) {
        if (!(Array.isArray(p?.anyOf) && p.anyOf.some((x: any) => x?.type === "null"))) out.properties[key] = { anyOf: [p, { type: "null" }] };
      } else if (typeof t === "string") out.properties[key] = t === "null" ? p : { ...p, type: [t, "null"] };
      else if (Array.isArray(t)) out.properties[key] = t.includes("null") ? p : { ...p, type: [...t, "null"] };
      else out.properties[key] = { anyOf: [p, { type: "null" }] };
    }
    out.required = alle;
    out.additionalProperties = false;
  }
  return out;
}
