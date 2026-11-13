#!/usr/bin/env node
// Bündelt eingebettete Schemata fremder Formate zu selbsttragenden Schemata für den eigenen Prüfer der App
// (seit 0.6.24, UP-2026-W45-01; seit 0.7.19 auch für KSNV). Der Prüfer löst nur interne Verweise auf ("#/…"); die
// Schemata der Kennzahlen-Bausteine aus Thessa und KSNV verweisen mit absoluten $ref auf das Kernschema von
// LEAD-Meldung-v2, das Schema aus KSNV zusätzlich relativ auf ein Begleitschema derselben App
// („bedarfsmeldung.schema.json#/$defs/land“). Die Bündelung übernimmt die benötigten Definitionen als
// "#/$defs/kern_…" bzw. "#/$defs/<Stamm des Begleitschemas>_…" und prüft vorher die Prüfsummen aus herkunft.json.
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
const KERN = "kern";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const kopie = (x) => JSON.parse(JSON.stringify(x));
/** Stamm eines Begleitschemas: „bedarfsmeldung.schema.json“ → „bedarfsmeldung“ */
const stamm = (datei) => basename(datei).replace(/\.schema\.json$/, "");

/**
 * Ziel eines Verweises, der übernommen werden muss: absolut auf das Kernschema, relativ auf ein Begleitschema
 * („datei.schema.json#/$defs/x“) oder intern ("#/$defs/x") innerhalb einer übernommenen Definition. null: Verweis
 * innerhalb des gebündelten Schemas selbst.
 */
function ziel(ref, ctx, intern) {
  if (ref.startsWith(`${ctx.kernId}#/$defs/`)) return { quelle: KERN, name: ref.slice(ctx.kernId.length + 8) };
  if (intern && ref.startsWith("#/$defs/")) return { quelle: intern, name: ref.slice(8) };
  const m = /^([^#]+\.schema\.json)#\/\$defs\/(.+)$/.exec(ref);
  if (m && ctx.begleit[basename(m[1])]) return { quelle: stamm(m[1]), name: m[2] };
  return null;
}

/** Ersetzt Verweise auf Kern- und Begleitschemata durch "#/$defs/<quelle>_…" und sammelt die Ziele. */
function umschreiben(knoten, ctx, intern) {
  if (Array.isArray(knoten)) return knoten.map((k) => umschreiben(k, ctx, intern));
  if (!knoten || typeof knoten !== "object") return knoten;
  const out = {};
  for (const [k, v] of Object.entries(knoten)) {
    if (k === "$ref" && typeof v === "string") {
      const z = ziel(v, ctx, intern);
      if (z) {
        ctx.benutzt.add(`${z.quelle}|${z.name}`);
        out[k] = `#/$defs/${z.quelle}_${z.name}`;
        continue;
      }
      if (!v.startsWith("#/")) throw new Error(`Nicht auflösbarer Verweis: ${v}`);
    }
    out[k] = umschreiben(v, ctx, intern);
  }
  return out;
}

/**
 * Bündelt ein Schema mit Verweisen auf das Kernschema und gegebenenfalls auf Begleitschemata derselben App.
 * @param {object} schema Schema mit absoluten $ref auf kern.$id
 * @param {object} kern Kernschema von LEAD-Meldung-v2
 * @param {Record<string, object>} [begleit] Dateiname → Begleitschema
 */
export function buendeln(schema, kern, begleit = {}) {
  const ctx = { kernId: kern.$id, begleit, benutzt: new Set() };
  const quellen = { [KERN]: kern, ...Object.fromEntries(Object.entries(begleit).map(([d, s]) => [stamm(d), s])) };
  const { $defs: eigene, ...rest } = schema;
  const s = umschreiben(rest, ctx, null);
  const defs = {};
  for (const [k, v] of Object.entries(eigene || {})) defs[k] = umschreiben(v, ctx, null);
  // transitive Hülle der benötigten Definitionen
  const fertig = new Set();
  let offen = [...ctx.benutzt];
  while (offen.length) {
    const schluessel = offen.pop();
    if (fertig.has(schluessel)) continue;
    fertig.add(schluessel);
    const [quelle, name] = schluessel.split("|");
    const def = quellen[quelle]?.$defs?.[name];
    if (!def) throw new Error(quelle === KERN ? `Kerndefinition fehlt: ${name}` : `Definition fehlt in ${quelle}.schema.json: ${name}`);
    defs[`${quelle}_${name}`] = umschreiben(def, ctx, quelle);
    offen = [...ctx.benutzt].filter((x) => !fertig.has(x));
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
  // Je überlieferte Fassung ein Original mit eigenem Commit der liefernden App (Thessa seit SR-2026-W45-02; vorher nur 0.2 mit herkunft.commit)
  const begleitVermerk = (f) => (f.begleitschemata ?? []).map((b) => `, ${b.datei} (SHA-256 ${b.sha256.slice(0, 12)}…)`).join("");
  const vermerk = (f, zusatz) =>
    `Erzeugt mit scripts/fremdschemata.mjs aus ${f.datei} (${app} ${(f.commit || herkunft.commit).slice(0, 7)}, SHA-256 ${f.sha256.slice(0, 12)}…)${begleitVermerk(f)} und formate/lead-meldung-v2/kern.schema.json (SHA-256 ${herkunft.kernschema.sha256.slice(0, 12)}…)${zusatz}. Nicht von Hand ändern.`;
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
    // Begleitschemata derselben App (KSNV: bedarfsmeldung.schema.json für die Definition land)
    const begleit = {};
    for (const b of f.begleitschemata ?? []) {
      const t = readFileSync(join(ordner, b.datei), "utf8");
      if (sha256(t) !== b.sha256) throw new Error(`${b.datei}: Prüfsumme weicht von herkunft.json ab.`);
      begleit[basename(b.datei)] = JSON.parse(t);
    }
    aus[f.fassung] = f;
    gebuendelt[f.fassung] = buendeln(JSON.parse(original), kern, begleit);
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
