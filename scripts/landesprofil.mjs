// Leitet die abgeleiteten Dateien des Landesprofils (profile/lead-thueringen) aus dem Beispielprofil der
// Koordinierungsstelle (profile/lead-beispiel) ab (seit 0.6.18, TP-2026-W44-54): Schema, Darstellungsdatei, Kontakte,
// Arbeitsanweisungen und Kodierleitfaden. Die Ableitung ändert nur, was die Landesebene verlangt (Kreise und kreisfreie
// Städte als meldende Gebiete, Kennungspräfixe, einzelne Formulierungen); alles andere bleibt wortgleich. Manifest,
// Änderungsverlauf, README und Beispiele des Landesprofils werden von Hand gepflegt. Die SOP-Sammelmappe teilt das
// Landesprofil mit dem Beispielprofil (src/profil/eingebaut.ts, TP-2026-W44-55).
//
// Seit 0.9.0 (UP-2026-W45-06, LEAD-Meldung-v2): Das Schema entsteht aus der Zusammenstellung
// formate/lead-meldung-v2/zusammenstellungen/lead-thueringen.json (Land und Kreise, sonst wie das Beispielprofil); das
// eigens abgeleitete Schema LEAD-Meldung-Land-v1 und seine Kopie im Beispielprofil entfallen, weil Bund, Land und Kreis
// eine Schemakennung teilen. Die Liste der Gebiete in der Zusammenstellung muss Land und Kreise unten entsprechen.
//
// Aufruf: node scripts/landesprofil.mjs [--check]
//   ohne --check: schreibt die abgeleiteten Dateien
//   mit --check:  prüft nur, ob sie aktuell sind (Exit-Code 1, wenn nicht); tests/profil/landesprofil.test.ts tut dasselbe

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { stelleSchemaZusammen } from "../src/kern/meldung-v2.js";

export const QUELLE = "profile/lead-beispiel";
export const ZIEL = "profile/lead-thueringen";

/**
 * Land und Kreise mit Kennungspräfix und Kreisschlüssel; die Reihenfolge ist die der Auswahl (Land, dann alphabetisch).
 * Namen und Schlüssel: Thüringer Landesamt für Statistik, CSV-Export der Verwaltungsstruktur
 * (https://statistik.thueringen.de/datenbank/verwaltungsstruktur.asp), Gemeindestruktur Stand 01.01.2026, abgerufen
 * am 02.11.2026. Kreisfreie Städte wie im Export („Stadt Erfurt“), Landkreise mit „Landkreis“ vor dem Namen, sofern er
 * nicht auf „kreis“ endet (wie der Gebietskatalog von Thessa). Das Kürzel des Kennungspräfixes ist das Kfz-Kennzeichen.
 */
export const LAND = { name: "Thüringen", praefix: "DE-TH", ags: "16" };
export const KREISE = [
  ["Ilm-Kreis", "IK", "16070"],
  ["Kyffhäuserkreis", "KYF", "16065"],
  ["Landkreis Altenburger Land", "ABG", "16077"],
  ["Landkreis Eichsfeld", "EIC", "16061"],
  ["Landkreis Gotha", "GTH", "16067"],
  ["Landkreis Greiz", "GRZ", "16076"],
  ["Landkreis Hildburghausen", "HBN", "16069"],
  ["Landkreis Nordhausen", "NDH", "16062"],
  ["Landkreis Saalfeld-Rudolstadt", "SLF", "16073"],
  ["Landkreis Schmalkalden-Meiningen", "SM", "16066"],
  ["Landkreis Sömmerda", "SOEM", "16068"],
  ["Landkreis Sonneberg", "SON", "16072"],
  ["Landkreis Weimarer Land", "AP", "16071"],
  ["Saale-Holzland-Kreis", "SHK", "16074"],
  ["Saale-Orla-Kreis", "SOK", "16075"],
  ["Stadt Erfurt", "EF", "16051"],
  ["Stadt Gera", "G", "16052"],
  ["Stadt Jena", "J", "16053"],
  ["Stadt Suhl", "SHL", "16054"],
  ["Stadt Weimar", "WE", "16055"],
  ["Unstrut-Hainich-Kreis", "UH", "16064"],
  ["Wartburgkreis", "WAK", "16063"],
].map(([name, kuerzel, ags]) => ({ name, praefix: `${LAND.praefix}-${kuerzel}`, ags }));

export const SCHEMA_ID = "LEAD-Meldung-v2";
/** Zusammenstellung des Landesprofils (Pfad relativ zum Repository) und Ordner der Formatdateien */
export const ZUSAMMENSTELLUNG = "formate/lead-meldung-v2/zusammenstellungen/lead-thueringen.json";
const FORMATORDNER = "formate/lead-meldung-v2";

/** Ersetzt genau einmal; fehlt die Stelle, hat sich das Beispielprofil geändert und die Ableitung muss nachgezogen werden */
function ersetze(text, alt, neu, datei) {
  const n = text.split(alt).length - 1;
  if (n !== 1) throw new Error(`${datei}: erwartet genau eine Stelle „${alt.slice(0, 60)}…“, gefunden ${n}`);
  return text.replace(alt, () => neu);
}

const json = (o) => JSON.stringify(o, null, 2) + "\n";

/** Schema aus der Zusammenstellung; die Gebiete müssen Land und Kreise dieser Datei entsprechen */
function schema(lesen) {
  const z = JSON.parse(lesen(ZUSAMMENSTELLUNG));
  const soll = [LAND.name, ...KREISE.map((k) => k.name)];
  const ist = z.einschraenkungen?.absender_gebiete ?? [];
  if (JSON.stringify(ist) !== JSON.stringify(soll))
    throw new Error(`${ZUSAMMENSTELLUNG}: absender_gebiete weichen von Land und Kreisen in scripts/landesprofil.mjs ab`);
  return json(stelleSchemaZusammen(z, (d) => JSON.parse(lesen(join(FORMATORDNER, d)))));
}

function ui(q) {
  const u = JSON.parse(q);
  u.felder["absender.gebiet.name"] = {
    ...u.felder["absender.gebiet.name"],
    hinweis: "Kreis bzw. kreisfreie Stadt der meldenden Stelle; bei der eigenen Meldung das Land.",
  };
  u.kennung.praefixe = Object.fromEntries([[LAND.name, LAND.praefix], ...KREISE.map((k) => [k.name, k.praefix])]);
  u.kennung.standard = LAND.praefix;
  let text = json(u);
  text = ersetze(text, '"Länderübergreifend"\n', '"Länderübergreifend",\n      "Kreisübergreifend"\n', "meldung.ui.json");
  return text;
}

function kontakte(q) {
  const k = JSON.parse(q);
  k.stellen = KREISE.map((x) => ({ name: x.name, feld: "absender.gebiet.name", email: "lage@beispiel.invalid" }));
  return json(k);
}

const TEXTE = {
  "anweisung-erfassung.md": [["{{profil.meldende_stelle}} ({{profil.land}})", "{{profil.meldende_stelle}} ({{profil.kreis}})"]],
  "anweisung-verdichtung.md": [
    [
      "Länder oder Stellen erscheinen innerhalb eines Sachverhalts als Teilräume",
      "Kreise, kreisfreie Städte oder Stellen erscheinen innerhalb eines Sachverhalts als Teilräume",
    ],
    [
      "Nicht: „{{profil.kurzname}} weist die Länder an, ihre Notstromreserven zu melden.“ Richtig: „Einschätzung ({{profil.kurzname}}): Ein länderübergreifender Abgleich der Notstromreserven wird angeregt; die Entscheidung liegt bei den Ländern.“",
      "Nicht: „{{profil.kurzname}} weist die Kreise an, ihre Notstromreserven zu melden.“ Richtig: „Einschätzung ({{profil.kurzname}}): Ein kreisübergreifender Abgleich der Notstromreserven wird angeregt; die Entscheidung liegt bei den Kreisen und kreisfreien Städten.“",
    ],
  ],
  "anweisung-kurzfassung.md": [
    ["keine Einzelwerte je Land oder Kreis", "keine Einzelwerte je Kreis oder Gemeinde"],
    [
      "Nicht: „Die Leitung weist die Länder an, ihre Notstromreserven zu melden.“ Richtig, wenn die Meldung eine Anregung enthält: „Die Meldung regt an, dass die Länder ihre Notstromreserven melden.“",
      "Nicht: „Die Leitung weist die Kreise an, ihre Notstromreserven zu melden.“ Richtig, wenn die Meldung eine Anregung enthält: „Die Meldung regt an, dass die Kreise ihre Notstromreserven melden.“",
    ],
  ],
  "kodierleitfaden.md": [
    [
      "in diesem Profil nach ISO 3166: `DE` für den Bund, `DE-TH` für Thüringen usw.",
      "in diesem Profil `DE-TH` für das Land und `DE-TH-` mit dem Kfz-Kennzeichen für Kreise und kreisfreie Städte, z. B. `DE-TH-J` für die Stadt Jena (im Beispielprofil der Koordinierungsstelle nach ISO 3166: `DE` für den Bund, `DE-TH` für Thüringen usw.)",
    ],
    [
      "(fiktiv, Auszug aus der verdichteten Meldung im Datensatz Orkantief „Ilka“; [Q1] bis [Q6] sind dort die Eingangsmeldungen der Länder)",
      "(fiktiv, Auszug aus der verdichteten Meldung im Datensatz Orkantief „Ilka“ des Beispielprofils der Koordinierungsstelle; [Q1] bis [Q6] sind dort die Eingangsmeldungen der Länder)",
    ],
  ],
};

/** Abgeleitete Dateien: Pfad im Repository → Inhalt */
export function ableitenImRepo(lesen = (pfad) => readFileSync(pfad, "utf-8")) {
  return Object.fromEntries(Object.entries(ableiten(lesen)).map(([d, t]) => [join(ZIEL, d), t]));
}

/** Abgeleitete Dateien des Landesprofils: Pfad im Profilordner → Inhalt */
export function ableiten(lesen = (pfad) => readFileSync(pfad, "utf-8")) {
  const q = (d) => lesen(join(QUELLE, d));
  const out = {
    "meldung.schema.json": schema(lesen),
    "meldung.ui.json": ui(q("meldung.ui.json")),
    "kontakte.json": kontakte(q("kontakte.json")),
  };
  for (const [datei, paare] of Object.entries(TEXTE)) out[datei] = paare.reduce((t, [alt, neu]) => ersetze(t, alt, neu, datei), q(datei));
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const pruefen = process.argv.includes("--check");
  const veraltet = [];
  for (const [pfad, inhalt] of Object.entries(ableitenImRepo())) {
    const datei = pfad;
    let bisher = "";
    try {
      bisher = readFileSync(pfad, "utf-8");
    } catch {
      /* neu */
    }
    if (bisher === inhalt) continue;
    veraltet.push(datei);
    if (!pruefen) {
      mkdirSync(dirname(pfad), { recursive: true });
      writeFileSync(pfad, inhalt);
    }
  }
  if (pruefen && veraltet.length) {
    console.error(`Landesprofil veraltet: ${veraltet.join(", ")}. Mit „npm run profil:land“ neu ableiten.`);
    process.exit(1);
  }
  console.log(veraltet.length ? `${pruefen ? "veraltet" : "geschrieben"}: ${veraltet.join(", ")}` : "Landesprofil aktuell.");
}
