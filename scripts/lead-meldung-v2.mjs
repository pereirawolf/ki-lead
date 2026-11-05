#!/usr/bin/env node
// Werkzeug für das Meldungsformat LEAD-Meldung-v2 (Entwurf, docs/LEAD-MELDUNG-V2.md):
//   schema   – Kernschema und Fachmodule zu einem selbsttragenden Profilschema zusammenstellen
//   migriere – Meldungen nach LEAD-Meldung-v1 oder LEAD-Meldung-Land-v1 nach v2 überführen
//   pruefe   – v2-Meldungen gegen ein Schema (Prüfebene 1) und auf Verweise und Konsistenz (Prüfebene 2) prüfen
//
// Aufruf:
//   node scripts/lead-meldung-v2.mjs schema <zusammenstellung.json> [ziel.schema.json]
//   node scripts/lead-meldung-v2.mjs migriere <v1.json …> --ziel <ordner> [--zeitzone Europe/Berlin] [--ebene Kreis]
//   node scripts/lead-meldung-v2.mjs pruefe <v2.json …> --schema <schema.json>
//
// Die Migration erfindet nichts: Was sie aus Text nicht sicher zuordnen kann, bleibt als Text erhalten und steht als
// Hinweis in entstehung.migration.hinweise. Eine migrierte Meldung ist ein Entwurf zur Durchsicht, keine neue Freigabe.

// Seit 0.7.0 (UP-2026-W45-02) steht die Umsetzung in src/kern/meldung-v2.js; dieses Skript ist die Kommandozeile dazu.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { migriereV1, pruefeReferenzen, stelleSchemaZusammen as zusammenstellen } from "../src/kern/meldung-v2.js";

export * from "../src/kern/meldung-v2.js";

const hier = dirname(fileURLToPath(import.meta.url));
export const FORMATORDNER = resolve(hier, "..", "formate", "lead-meldung-v2");

const leseJson = (pfad) => JSON.parse(readFileSync(pfad, "utf8"));

/** Zusammenstellung mit Dateien aus formate/lead-meldung-v2/ (Vorgabe) oder einer eigenen Ladefunktion */
export function stelleSchemaZusammen(z, lade = (d) => leseJson(join(FORMATORDNER, d))) {
  return zusammenstellen(z, lade);
}

function argumente(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) opt[argv[i].slice(2)] = argv[++i];
    else pos.push(argv[i]);
  }
  return { pos, opt };
}

export function dateinameV2(m) {
  const zeit = (m.meldezeitpunkt || "ohne-Zeit").slice(0, 16).replace(":", "-");
  const stelle = (m.absender?.gebiet?.schluessel || m.absender?.gebiet?.name || "Stelle").replace(/[^A-Za-z0-9-]+/g, "_");
  return `${zeit}_LEAD-Meldung-v2_${stelle}.json`;
}

async function main() {
  const [befehl, ...rest] = process.argv.slice(2);
  const { pos, opt } = argumente(rest);
  if (befehl === "schema") {
    const [quelle, ziel] = pos;
    if (!quelle) throw new Error("Aufruf: schema <zusammenstellung.json> [ziel]");
    const z = leseJson(quelle);
    const s = stelleSchemaZusammen(z);
    const text = JSON.stringify(s, null, 2) + "\n";
    if (ziel) {
      writeFileSync(ziel, text);
      console.log(`geschrieben: ${ziel}`);
    } else process.stdout.write(text);
    return;
  }
  if (befehl === "migriere") {
    if (!pos.length || !opt.ziel) throw new Error("Aufruf: migriere <v1.json …> --ziel <ordner> [--zeitzone Europe/Berlin] [--ebene Kreis]");
    mkdirSync(opt.ziel, { recursive: true });
    for (const datei of pos) {
      const { meldung, hinweise } = migriereV1(leseJson(datei), { zeitzone: opt.zeitzone, ebene: opt.ebene });
      const ziel = join(opt.ziel, basename(datei).replace(/\.json$/, "") + ".v2.json");
      writeFileSync(ziel, JSON.stringify(meldung, null, 2) + "\n");
      console.log(`${datei} → ${ziel} (${hinweise.length} Hinweise)`);
      for (const h of hinweise) console.log(`  · ${h}`);
    }
    return;
  }
  if (befehl === "pruefe") {
    if (!pos.length || !opt.schema) throw new Error("Aufruf: pruefe <v2.json …> --schema <schema.json>");
    const { default: Ajv2020 } = await import("ajv/dist/2020.js");
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const pruefe = ajv.compile(leseJson(opt.schema));
    let fehlerGesamt = 0;
    for (const datei of pos) {
      const m = leseJson(datei);
      const ok = pruefe(m);
      const ref = pruefeReferenzen(m);
      const f = (ok ? 0 : pruefe.errors.length) + ref.filter((r) => r.stufe === "fehler").length;
      fehlerGesamt += f;
      console.log(`${datei}: ${f ? `${f} Fehler` : "ohne Fehler"}`);
      if (!ok) for (const e of pruefe.errors) console.log(`  ✗ Schema ${e.instancePath || "/"}: ${e.message}`);
      for (const r of ref) console.log(`  ${r.stufe === "fehler" ? "✗" : "·"} ${r.pfad}: ${r.text}`);
    }
    process.exitCode = fehlerGesamt ? 1 : 0;
    return;
  }
  console.log("Befehle: schema | migriere | pruefe (siehe Kopf der Datei)");
  process.exitCode = befehl ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
