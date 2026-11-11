#!/usr/bin/env node
// Bündelt eingebettete Schemata fremder Formate zu selbsttragenden Schemata für den eigenen Prüfer der App
// (seit 0.6.24, UP-2026-W45-01; seit 0.7.19 auch für KSNV). Der Prüfer löst nur interne Verweise auf ("#/…"); die
// Schemata der Kennzahlen-Bausteine aus Thessa und KSNV verweisen mit absoluten $ref auf das Kernschema von
// LEAD-Meldung-v2. Die Bündelung übernimmt die benötigten Definitionen des Kernschemas als "#/$defs/kern_…" und prüft
// vorher die Prüfsummen aus herkunft.json.
//
// Aufruf: node scripts/fremdschemata.mjs [--check]
//   ohne --check: schreibt formate/fremd/{thessa,ksnv}-kennzahlen/gebuendelt/*.schema.json
//   mit --check:  prüft nur, ob sie aktuell sind (Exit-Code 1, wenn nicht); tests/format/thessa-baustein.test.ts und
//                 tests/format/ksnv-baustein.test.ts tun dasselbe

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const hier = dirname(fileURLToPath(import.meta.url));
const WURZEL = resolve(hier, "..");
export const THESSA_ORDNER = join(WURZEL, "formate", "fremd", "thessa-kennzahlen");
export const KSNV_ORDNER = join(WURZEL, "formate", "fremd", "ksnv-kennzahlen");
/** Ordner aller eingebetteten Baustein-Schemata */
export const BAUSTEIN_ORDNER = [THESSA_ORDNER, KSNV_ORDNER];
const KERN_DATEI = join(WURZEL, "formate", "lead-meldung-v2", "kern.schema.json");
const PRAEFIX = "kern_";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const kopie = (x) => JSON.parse(JSON.stringify(x));

/** Ersetzt Verweise auf das Kernschema (absolut oder intern im Kern) durch "#/$defs/kern_…" und sammelt die Namen. */
function umschreiben(knoten, kernId, benutzt, intern) {
  if (Array.isArray(knoten)) return knoten.map((k) => umschreiben(k, kernId, benutzt, intern));
  if (!knoten || typeof knoten !== "object") return knoten;
  const out = {};
  for (const [k, v] of Object.entries(knoten)) {
    if (k === "$ref" && typeof v === "string") {
      const absolut = v.startsWith(`${kernId}#/$defs/`) ? v.slice(kernId.length + 8) : null;
      const imKern = intern && v.startsWith("#/$defs/") ? v.slice(8) : null;
      const name = absolut ?? imKern;
      if (name) {
        benutzt.add(name);
        out[k] = `#/$defs/${PRAEFIX}${name}`;
        continue;
      }
      if (!v.startsWith("#/")) throw new Error(`Nicht auflösbarer Verweis: ${v}`);
    }
    out[k] = umschreiben(v, kernId, benutzt, intern);
  }
  return out;
}

/**
 * Bündelt ein Schema mit Verweisen auf das Kernschema.
 * @param {object} schema Schema mit absoluten $ref auf kern.$id
 * @param {object} kern Kernschema von LEAD-Meldung-v2
 */
export function buendeln(schema, kern) {
  const benutzt = new Set();
  const { $defs: eigene, ...rest } = schema;
  const s = umschreiben(rest, kern.$id, benutzt, false);
  const defs = {};
  for (const [k, v] of Object.entries(eigene || {})) defs[k] = umschreiben(v, kern.$id, benutzt, false);
  // transitive Hülle der benötigten Kerndefinitionen
  const offen = [...benutzt];
  const fertig = new Set();
  while (offen.length) {
    const name = offen.pop();
    if (fertig.has(name)) continue;
    fertig.add(name);
    if (!kern.$defs?.[name]) throw new Error(`Kerndefinition fehlt: ${name}`);
    const neu = new Set();
    defs[PRAEFIX + name] = umschreiben(kern.$defs[name], kern.$id, neu, true);
    for (const n of neu) if (!fertig.has(n)) offen.push(n);
  }
  const sortiert = Object.fromEntries(Object.entries(defs).sort(([a], [b]) => a.localeCompare(b)));
  return { ...s, $defs: sortiert };
}

/** Fassung 0.1: wie 0.2, aber ohne Pflicht für einsatzmeldungen (abgeleitet, siehe herkunft.json). */
export function fassung01(gebuendelt02) {
  const s = kopie(gebuendelt02);
  s.title = s.title.replace("0.2", "0.1");
  s.properties.fassung = { const: "0.1" };
  s.required = s.required.filter((f) => f !== "einsatzmeldungen");
  return s;
}

/**
 * Erzeugt die gebündelten Schemata eines Ordners (Vorgabe: Thessa); prüft vorher die Prüfsummen aus herkunft.json.
 * @param {string} [ordner] THESSA_ORDNER oder KSNV_ORDNER
 * @returns {Record<string, any>} Dateiname → Schema
 */
export function erzeuge(ordner = THESSA_ORDNER) {
  const herkunft = JSON.parse(readFileSync(join(ordner, "herkunft.json"), "utf8"));
  // Name der liefernden App aus dem Format: „Thessa-Kennzahlen“ → Thessa, „KSNV-Kennzahlen“ → KSNV
  const app = String(herkunft.format).split("-")[0];
  const kernText = readFileSync(KERN_DATEI, "utf8");
  if (sha256(kernText) !== herkunft.kernschema.sha256)
    throw new Error(
      `Kernschema hat nicht die von ${app} gepinnte Prüfsumme (${herkunft.kernschema.sha256.slice(0, 12)}…); ${app} neu pinnen und herkunft.json nachziehen.`,
    );
  const kern = JSON.parse(kernText);
  // Je überlieferte Fassung ein Original mit eigenem Thessa-Commit (seit SR-2026-W45-02; vorher nur 0.2 mit herkunft.commit)
  const vermerk = (f, zusatz) =>
    `Erzeugt mit scripts/fremdschemata.mjs aus ${f.datei} (${app} ${(f.commit || herkunft.commit).slice(0, 7)}, SHA-256 ${f.sha256.slice(0, 12)}…) und formate/lead-meldung-v2/kern.schema.json (SHA-256 ${herkunft.kernschema.sha256.slice(0, 12)}…)${zusatz}. Nicht von Hand ändern.`;
  const mitKopf = (s, fassung, kommentar) => {
    const { $schema, $id: _original, title, description, ...rest } = s;
    const $id = `https://github.com/pereirawolf/ki-lead/formate/fremd/${basename(ordner)}/gebuendelt/${fassung}.schema.json`;
    return { $schema, $id, title, description, $comment: kommentar, ...rest };
  };
  const gebuendelt = {};
  const aus = {};
  for (const f of herkunft.fassungen.filter((x) => x.datei)) {
    const original = readFileSync(join(ordner, f.datei), "utf8");
    if (sha256(original) !== f.sha256) throw new Error(`${f.datei}: Prüfsumme weicht von herkunft.json ab.`);
    aus[f.fassung] = f;
    gebuendelt[f.fassung] = buendeln(JSON.parse(original), kern);
  }
  const ergebnis = {};
  for (const [fassung, g] of Object.entries(gebuendelt)) ergebnis[`${fassung}.schema.json`] = mitKopf(g, fassung, vermerk(aus[fassung], ""));
  // Fassung 0.1 ist nicht überliefert und wird aus 0.2 abgeleitet
  if (gebuendelt["0.2"] && herkunft.fassungen.some((f) => f.fassung === "0.1" && f.abgeleitet_von === "0.2"))
    ergebnis["0.1.schema.json"] = mitKopf(fassung01(gebuendelt["0.2"]), "0.1", vermerk(aus["0.2"], "; Fassung 0.1 abgeleitet: einsatzmeldungen nicht Pflicht"));
  return ergebnis;
}

const text = (s) => `${JSON.stringify(s, null, 2)}\n`;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pruefen = process.argv.includes("--check");
  let veraltet = 0;
  for (const [ordner, datei, schema] of BAUSTEIN_ORDNER.flatMap((o) => Object.entries(erzeuge(o)).map(([d, s]) => [o, d, s]))) {
    const pfad = join(ordner, "gebuendelt", datei);
    let alt = "";
    try {
      alt = readFileSync(pfad, "utf8");
    } catch {
      /* fehlt noch */
    }
    if (alt === text(schema)) continue;
    if (pruefen) {
      console.error(`veraltet: ${pfad}`);
      veraltet++;
    } else {
      writeFileSync(pfad, text(schema));
      console.log(`geschrieben: ${pfad}`);
    }
  }
  if (veraltet) process.exit(1);
}
