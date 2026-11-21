#!/usr/bin/env node
// Gebietsverzeichnis für die Gebietssuche (seit 0.9.8, Entscheidungen des Herausgebers vom 21.11.2026) aus dem
// Gemeindeverzeichnis-Informationssystem GV-ISys der Statistischen Ämter des Bundes und der Länder, Quartals- oder
// Jahresausgabe im Excel-Format („Alle politisch selbständigen Gemeinden …“, Datei AuszugGV…xlsx):
// https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html
//
// Aufruf: node scripts/gebietsverzeichnis.mjs <AuszugGV….xlsx> [zielordner]
//
// Ergebnis in formate/fremd/gv-isys/:
//   gebiete-kern.json      – Bund, Länder, Regierungsbezirke (bzw. Statistische Regionen), Kreise und kreisfreie Städte
//   gebiete-gemeinden.json – Gemeinden und gemeindefreie Gebiete (8-stelliger Amtlicher Gemeindeschlüssel)
// Gemeindeverbände (Satzart 50) und die Regionen in Baden-Württemberg (Satzart 30) bleiben außen vor: Sie liegen nicht im
// Präfix der Gemeindeschlüssel (Entscheidung vom 21.11.2026). Namen bleiben amtlich; nur die Art steht bei Kreisen vorn
// („Landkreis Sonneberg“, „Kreisfreie Stadt Erfurt“), damit Kreis und gleichnamige Stadt unterscheidbar sind.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const hier = dirname(fileURLToPath(import.meta.url));
export const ZIEL = resolve(hier, "..", "formate", "fremd", "gv-isys");
export const FORMAT = "ki-lead-gebiete/1";
export const QUELLE_PRAEFIX = "Statistische Ämter des Bundes und der Länder, Gemeindeverzeichnis-Informationssystem GV-ISys";

const XML_ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const entitaeten = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : (XML_ENT[e] ?? m),
  );
/** Text eines <si>- oder <is>-Elements (auch mit Formatierungsläufen <r><t>…</t></r>) */
const textVon = (xml) => entitaeten([...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""));
const spalte = (ref) => [...ref.replace(/\d+/g, "")].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

/** Zeilen eines Tabellenblatts als Listen von Texten; leere Zellen als "" */
export async function leseXlsx(daten, blattName) {
  const zip = await JSZip.loadAsync(daten);
  const mappe = await zip.file("xl/workbook.xml").async("string");
  const rels = await zip.file("xl/_rels/workbook.xml.rels").async("string");
  const blaetter = [...mappe.matchAll(/<sheet\b[^>]*\bname="([^"]*)"[^>]*\br:id="([^"]*)"/g)].map((m) => ({ name: entitaeten(m[1]), id: m[2] }));
  const blatt = blattName ? blaetter.find((b) => blattName.test(b.name)) : blaetter[blaetter.length - 1];
  if (!blatt) throw new Error(`Tabellenblatt nicht gefunden (vorhanden: ${blaetter.map((b) => b.name).join(", ")})`);
  const ziel =
    new RegExp(`<Relationship\\b[^>]*\\bId="${blatt.id}"[^>]*\\bTarget="([^"]*)"`).exec(rels)?.[1] ??
    new RegExp(`<Relationship\\b[^>]*\\bTarget="([^"]*)"[^>]*\\bId="${blatt.id}"`).exec(rels)?.[1];
  const pfad = ziel.startsWith("/") ? ziel.slice(1) : `xl/${ziel}`;
  const geteilt = zip.file("xl/sharedStrings.xml")
    ? [...(await zip.file("xl/sharedStrings.xml").async("string")).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textVon(m[1]))
    : [];
  const xml = await zip.file(pfad).async("string");
  const zeilen = [];
  for (const z of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const zeile = [];
    for (const c of z[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attr = c[1];
      const ref = /\br="([A-Z]+\d+)"/.exec(attr)?.[1];
      const typ = /\bt="(\w+)"/.exec(attr)?.[1];
      const inhalt = c[2] ?? "";
      const v = /<v>([\s\S]*?)<\/v>/.exec(inhalt)?.[1];
      const wert = typ === "s" ? (geteilt[+v] ?? "") : typ === "inlineStr" ? textVon(inhalt) : v !== undefined ? entitaeten(v) : "";
      zeile[ref ? spalte(ref) : zeile.length] = wert;
    }
    zeilen.push(Array.from(zeile, (x) => x ?? ""));
  }
  return { blatt: blatt.name, zeilen };
}

/** Kern des Namens ohne Zusatz nach dem Komma („Erfurt, Stadt“ → „Erfurt“) */
const kernname = (n) => n.split(",")[0].trim();

/** Anzeigename eines Kreises nach Textkennzeichen (41 kreisfreie Stadt, 42 Stadtkreis, 43 Kreis, 44 Landkreis, 45 Regionalverband) */
export function kreisName(name, tk) {
  if (tk === "41") return `Kreisfreie Stadt ${kernname(name)}`;
  if (tk === "42") return `Stadtkreis ${kernname(name)}`;
  if (/kreis|region/i.test(name)) return name;
  if (tk === "43") return `Kreis ${name}`;
  if (tk === "44") return `Landkreis ${name}`;
  return name;
}

/** Anzeigename eines Regierungsbezirks („Reg.-Bez. Köln“, „Oberbayern“ → „Regierungsbezirk …“; Statistische Regionen bleiben) */
export function bezirkName(name) {
  const n = name.replace(/^Reg\.-Bez\.\s*/, "");
  return /^(Statistische Region|Regierungsbezirk)\b/.test(n) ? n : `Regierungsbezirk ${n}`;
}

/** Gemeindename ausgeschrieben („Tüßling, M“ → „Tüßling, Markt“, „gemfr. Gebiet“ → „gemeindefreies Gebiet“) */
export function gemeindeName(name) {
  return name
    .replace(/,\s*M$/, ", Markt")
    .replace(/gemfr\.\s*Gebiet/, "gemeindefreies Gebiet")
    .replace(/gemfr\.\s*Bezirk/, "gemeindefreier Bezirk");
}

/** Verzeichnisdateien aus den Zeilen des Blatts „Onlineprodukt_Gemeinden…“ */
export function verzeichnisAusZeilen(zeilen) {
  const titel = zeilen.find((z) => /am \d{2}\.\d{2}\.\d{4}/.test(z[0] ?? ""))?.[0] ?? "";
  const m = /am (\d{2})\.(\d{2})\.(\d{4})(?:\s*\(([^)]*)\))?/.exec(titel);
  if (!m) throw new Error("Gebietsstand nicht gefunden (Titelzeile „… am TT.MM.JJJJ …“)");
  const stand = `${m[3]}-${m[2]}-${m[1]}`;
  const ausgabe = m[4] ? `, ${m[4]}` : "";
  const quelle = `${QUELLE_PRAEFIX}, Gebietsstand ${m[1]}.${m[2]}.${m[3]}${ausgabe}`;
  const kern = [["DE", "Bund", "Staat"]];
  const gemeinden = [];
  for (const z of zeilen) {
    const [satzart, tk, land, rb, kreis, , gem, name] = z.map((x) => String(x ?? "").trim());
    if (!/^\d{2}$/.test(satzart) || !/^\d{2}$/.test(land) || !name) continue;
    if (satzart === "10") kern.push([land, name, "Land"]);
    else if (satzart === "20") kern.push([`${land}${rb}`, bezirkName(name), "Regierungsbezirk"]);
    else if (satzart === "40") kern.push([`${land}${rb}${kreis}`, kreisName(name, tk), "Kreis"]);
    else if (satzart === "60") gemeinden.push([`${land}${rb}${kreis}${gem}`, gemeindeName(name), "Gemeinde"]);
  }
  const datei = (eintraege, was) => ({
    format: FORMAT,
    stand,
    quelle,
    rechte:
      "© Daten (im Auftrag der Herausgebergemeinschaft Statistische Ämter des Bundes und der Länder) Statistisches Bundesamt (Destatis). Vervielfältigung und Verbreitung, auch auszugsweise, mit Quellenangabe gestattet.",
    inhalt: was,
    eintraege,
  });
  return {
    kern: datei(kern, "Bund, Länder, Regierungsbezirke bzw. Statistische Regionen, Kreise und kreisfreie Städte"),
    gemeinden: datei(gemeinden, "Gemeinden und gemeindefreie Gebiete (Amtlicher Gemeindeschlüssel, 8 Stellen)"),
  };
}

/** Eine Zeile je Eintrag: lesbare Unterschiede im Git-Verlauf, wenn eine neue Ausgabe Gebiete ändert */
export function alsJson(d) {
  const { eintraege, ...kopf } = d;
  const k = JSON.stringify(kopf, null, 2).replace(/\n}$/, "");
  return `${k},\n  "eintraege": [\n${eintraege.map((e) => `    ${JSON.stringify(e)}`).join(",\n")}\n  ]\n}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [quelle, ziel = ZIEL] = process.argv.slice(2);
  if (!quelle) {
    console.error("Aufruf: node scripts/gebietsverzeichnis.mjs <AuszugGV….xlsx> [zielordner]");
    process.exit(2);
  }
  const { zeilen } = await leseXlsx(readFileSync(quelle), /^Onlineprodukt_Gemeinden/);
  const { kern, gemeinden } = verzeichnisAusZeilen(zeilen);
  mkdirSync(ziel, { recursive: true });
  writeFileSync(join(ziel, "gebiete-kern.json"), alsJson(kern));
  writeFileSync(join(ziel, "gebiete-gemeinden.json"), alsJson(gemeinden));
  console.log(`${kern.quelle}: ${kern.eintraege.length} Einträge im Kern, ${gemeinden.eintraege.length} Gemeinden → ${ziel}`);
}
