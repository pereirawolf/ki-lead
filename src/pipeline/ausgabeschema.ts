// Ausgabeschema für die KI bei Profilen mit LEAD-Meldung-v2 (seit 0.8.0, UP-2026-W45-04; docs/LEAD-MELDUNG-V2.md
// Abschnitt 9 „KI-Ausgabe“ und Abschnitt 13 Nr. 2). Abgeleitet aus dem zusammengestellten Profilschema:
// - ohne Bedingungen (allOf, if/then/else, not, dependentRequired, dependentSchemas) und ohne Muster (pattern,
//   patternProperties, propertyNames, format), weil die Anbieter beides nur eingeschränkt unterstützen; die App prüft
//   das vollständige Profilschema und die Referenzen nach der Antwort;
// - ohne die Felder, die die App setzt (Identität, Status, Absender, Zeitpunkte und Zone, Freigabe, Entstehung bis auf
//   die Angabe der angewandten SOPs, erstmals_gemeldet im Zeitstrahl, Prüfsumme eines Bausteins);
// - Fachmodule nur mit den bekannten Modulen der Zusammenstellung, jedes Objekt geschlossen.
// Das Schema steht im Systemauftrag von S2, der Vervollständigung und der Reparatur; Structured Outputs nutzt S2
// weiterhin nicht (Kurzantwort und Werkzeuge). Kosten und Fehlerquote der tieferen Struktur hat der Vergleichslauf Ilka
// vom 14.11.2026 gemessen: keine Reparatur, Anteil des Schemas geschätzt 0,05 USD je Lauf (offener Punkt 2, erledigt;
// evaluation/abnahmen/2026-11-14-lead-meldung-v2-ilka-ergebnis.md).

import type { Profil } from "../kern/typen";

export const SCHEMA_V2 = "LEAD-Meldung-v2";

/** true, wenn das Profil Meldungen nach LEAD-Meldung-v2 erzeugt (Schemakennung des Profils oder const im Schema) */
export function istV2Profil(p: Pick<Profil, "manifest" | "schema">): boolean {
  return p.manifest?.meldung?.schema_id === SCHEMA_V2 || p.schema?.properties?.schema?.const === SCHEMA_V2;
}

/** Felder der Meldung, die die App setzt und die KI nicht ausgibt */
export const APP_FELDER_V2 = ["schema", "fassung", "meldung_id", "beziehungen", "status", "absender", "meldezeitpunkt", "zeitzone", "freigabe"] as const;

/** Schlüsselwörter, die das Ausgabeschema nicht trägt (Bedingungen und Muster) */
const OHNE = new Set([
  "allOf",
  "if",
  "then",
  "else",
  "not",
  "dependentRequired",
  "dependentSchemas",
  "pattern",
  "patternProperties",
  "propertyNames",
  "format",
  "$comment",
]);

const istObjekt = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);

/** Entfernt Bedingungen und Muster rekursiv; offene Zusatzfelder (additionalProperties als Schema) werden geschlossen */
function bereinigen(s: unknown): any {
  if (Array.isArray(s)) return s.map(bereinigen);
  if (!istObjekt(s)) return s;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(s)) {
    if (OHNE.has(k)) continue;
    if (k === "properties" && istObjekt(v)) out.properties = Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, bereinigen(pv)]));
    else if (k === "$defs" && istObjekt(v)) out.$defs = Object.fromEntries(Object.entries(v).map(([dk, dv]) => [dk, bereinigen(dv)]));
    else if (k === "additionalProperties" && istObjekt(v)) out.additionalProperties = false;
    else out[k] = bereinigen(v);
  }
  return out;
}

/** Interne Verweise, die ein Teilschema nutzt (transitiv über $defs) */
function genutzteDefs(wurzel: unknown, defs: Record<string, any>): Set<string> {
  const genutzt = new Set<string>();
  const besuche = (x: unknown) => {
    if (Array.isArray(x)) return x.forEach(besuche);
    if (!istObjekt(x)) return;
    for (const [k, v] of Object.entries(x)) {
      if (k === "$ref" && typeof v === "string" && v.startsWith("#/$defs/")) {
        const name = v.slice(8);
        if (!genutzt.has(name) && defs[name]) {
          genutzt.add(name);
          besuche(defs[name]);
        }
      } else if (k !== "$defs") besuche(v);
    }
  };
  besuche(wurzel);
  return genutzt;
}

/** Entfernt Felder aus einem Objektschema (properties und required) */
function ohneFelder(s: Record<string, any> | undefined, felder: readonly string[]): void {
  if (!s) return;
  for (const f of felder) delete s.properties?.[f];
  if (Array.isArray(s.required)) s.required = s.required.filter((r: string) => !felder.includes(r));
}

/**
 * Ausgabeschema für die KI. Für Profile mit LEAD-Meldung-v1 bleibt es das Profilschema (unverändert), weil v1 keine
 * Bedingungen braucht, die die Anbieter nicht kennen, und die App dort nichts ausblendet.
 */
export function ausgabeSchemaKi(p: Pick<Profil, "manifest" | "schema">): Record<string, any> {
  if (!istV2Profil(p)) return p.schema as Record<string, any>;
  const s = bereinigen(structuredClone(p.schema)) as Record<string, any>;
  const defs: Record<string, any> = s.$defs || {};
  ohneFelder(s, APP_FELDER_V2);
  // Entstehung: nur die Angabe der angewandten SOPs (Abgleich mit den beigefügten, wie in v1)
  if (s.properties?.entstehung) {
    s.properties.entstehung = {
      type: "object",
      additionalProperties: false,
      description:
        "Nur die Angabe, welche der beigefügten SOPs und Bausteine angewandt wurden; Verfahren, Werkzeug, Profil, Modelle und Zeitpunkte setzt die App.",
      required: ["regelwerk"],
      properties: {
        regelwerk: {
          type: "object",
          additionalProperties: false,
          required: ["sop"],
          properties: {
            sop: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["kennung"],
                properties: { kennung: { type: "string", description: "z. B. B01, C12" }, fassung: { type: "string" }, bezeichnung: { type: "string" } },
              },
            },
          },
        },
      },
    };
  }
  ohneFelder(defs.zeitstrahl_zeile, ["erstmals_gemeldet"]);
  // Bewertung je Sachverhalt: Pflicht, wenn das Profil keine Betreiber als Absender kennt (Bedingung an der Wurzel)
  const ebenen: unknown = p.schema?.properties?.absender?.properties?.ebene?.enum;
  if (defs.sachverhalt && Array.isArray(ebenen) && !ebenen.includes("Betreiber") && !defs.sachverhalt.required?.includes("bewertung"))
    defs.sachverhalt.required = [...(defs.sachverhalt.required || []), "bewertung"];
  ohneFelder(defs.modul_lead_baustein_baustein, ["datei", "sha256"]);
  // Fachmodule: nur die bekannten (Pflicht bleibt Pflicht), unbekannte gibt die KI nicht aus
  for (const name of ["module", "meldungsmodule"]) if (defs[name]) defs[name].additionalProperties = false;
  // Kennung: im Entwurf leer, Platzhalter NEU-n oder Kennung der Vormeldung (das Muster entfällt, die App prüft)
  if (defs.kennung_oder_platzhalter)
    defs.kennung_oder_platzhalter.description =
      "Kennung eines fortgeschriebenen Sachverhalts aus der eigenen Vormeldung, sonst Platzhalter NEU-1, NEU-2 …; endgültige Kennungen vergibt die App.";
  s.title = `Ausgabeschema für die KI – ${s.title || SCHEMA_V2}`;
  s.description =
    "Von der App aus dem Profilschema abgeleitet (ohne Bedingungen und Muster, ohne die Felder, die die App setzt). Die App ergänzt Identität, Status, Absender, Meldezeitpunkt, Zeitzone, Freigabe, Entstehung und erstmals_gemeldet und prüft danach das vollständige Profilschema und die Referenzen.";
  delete s.$id;
  // Nur genutzte Definitionen (etwa entfällt sachverhalt_vollstaendig, das nur in Bedingungen stand)
  const genutzt = genutzteDefs({ ...s, $defs: undefined }, defs);
  s.$defs = Object.fromEntries(Object.entries(defs).filter(([k]) => genutzt.has(k)));
  return s;
}
