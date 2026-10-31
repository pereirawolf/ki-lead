// Leitet die abgeleiteten Dateien des Landesprofils (profile/lead-thueringen) aus dem Beispielprofil der
// Koordinierungsstelle (profile/lead-beispiel) ab (seit 0.6.18, TP-2026-W44-54): Schema, Darstellungsdatei, Kontakte,
// Arbeitsanweisungen und Kodierleitfaden. Die Ableitung ändert nur, was die Landesebene verlangt (Feld „kreis“ statt
// „land“, Kreise und kreisfreie Städte, Kennungspräfixe, einzelne Formulierungen); alles andere bleibt wortgleich.
// Manifest, Änderungsverlauf, README und Beispiele des Landesprofils werden von Hand gepflegt. Die SOP-Sammelmappe teilt
// das Landesprofil mit dem Beispielprofil (src/profil/eingebaut.ts, TP-2026-W44-55).
//
// Aufruf: node scripts/landesprofil.mjs [--check]
//   ohne --check: schreibt die abgeleiteten Dateien
//   mit --check:  prüft nur, ob sie aktuell sind (Exit-Code 1, wenn nicht); tests/profil/landesprofil.test.ts tut dasselbe

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const QUELLE = "profile/lead-beispiel";
export const ZIEL = "profile/lead-thueringen";

/** Land und Kreise mit Kennungspräfix; die Reihenfolge ist die der Auswahl (Land, dann alphabetisch) */
export const LAND = { name: "Thüringen", praefix: "DE-TH" };
export const KREISE = [
  ["Ilm-Kreis", "IK"],
  ["Kyffhäuserkreis", "KYF"],
  ["Landkreis Altenburger Land", "ABG"],
  ["Landkreis Eichsfeld", "EIC"],
  ["Landkreis Gotha", "GTH"],
  ["Landkreis Greiz", "GRZ"],
  ["Landkreis Hildburghausen", "HBN"],
  ["Landkreis Nordhausen", "NDH"],
  ["Landkreis Saalfeld-Rudolstadt", "SLF"],
  ["Landkreis Schmalkalden-Meiningen", "SM"],
  ["Landkreis Sömmerda", "SOEM"],
  ["Landkreis Sonneberg", "SON"],
  ["Landkreis Weimarer Land", "AP"],
  ["Saale-Holzland-Kreis", "SHK"],
  ["Saale-Orla-Kreis", "SOK"],
  ["Stadt Erfurt", "EF"],
  ["Stadt Gera", "G"],
  ["Stadt Jena", "J"],
  ["Stadt Suhl", "SHL"],
  ["Stadt Weimar", "WE"],
  ["Unstrut-Hainich-Kreis", "UH"],
  ["Wartburgkreis", "WAK"],
].map(([name, kuerzel]) => ({ name, praefix: `${LAND.praefix}-${kuerzel}` }));

export const SCHEMA_ID = "LEAD-Meldung-Land-v1";

/** Ersetzt genau einmal; fehlt die Stelle, hat sich das Beispielprofil geändert und die Ableitung muss nachgezogen werden */
function ersetze(text, alt, neu, datei) {
  const n = text.split(alt).length - 1;
  if (n !== 1) throw new Error(`${datei}: erwartet genau eine Stelle „${alt.slice(0, 60)}…“, gefunden ${n}`);
  return text.replace(alt, () => neu);
}

const json = (o) => JSON.stringify(o, null, 2) + "\n";

function schema(q) {
  const s = JSON.parse(q);
  s.$id = `${SCHEMA_ID}.schema.json`;
  s.title = "LEAD-Meldevorlage Landesebene – JSON-Schema v1";
  s.description =
    "Beispielschema einer LEAD-Meldung auf Landesebene (Schemakennung LEAD-Meldung-Land-v1), abgeleitet von LEAD-Meldung-v1 (LEAD-Meldevorlage 1.2): " +
    "Statt des Feldes „land“ nennt „kreis“ die meldende Gebietskörperschaft, bei der eigenen Meldung das Land. Prüft Struktur, Datentypen, zulässige Werte und – bei _status 'final' – die vier Pflichtfelder. Inhaltliche Richtigkeit prüft das Schema nicht.";
  const props = {};
  for (const [k, v] of Object.entries(s.properties)) {
    if (k === "land") props.kreis = { enum: ["", LAND.name, ...KREISE.map((k) => k.name)] };
    else if (k === "schema") props.schema = { const: SCHEMA_ID };
    else props[k] = v;
  }
  s.properties = props;
  s.required = s.required.map((f) => (f === "land" ? "kreis" : f));
  const text = JSON.stringify(s);
  if (text.split('"land"').length - 1 !== 1)
    throw new Error("meldung.schema.json: „land“ außerhalb von required/properties erwartet genau einmal (Bedingung für final)");
  return json(JSON.parse(text.replace('"land"', '"kreis"')));
}

function ui(q) {
  const u = JSON.parse(q);
  for (const s of u.schritte) s.felder = s.felder.map((f) => (f === "land" ? "kreis" : f));
  const felder = {};
  for (const [k, v] of Object.entries(u.felder))
    if (k === "land")
      felder.kreis = { label: "Kreis bzw. kreisfreie Stadt (eigene Meldung: Land)", widget: "auswahl", leer_label: "– bitte wählen –", pflicht: true };
    else felder[k] = v;
  u.felder = felder;
  u.rollen.land = "kreis";
  u.kennung.praefixe = Object.fromEntries([[LAND.name, LAND.praefix], ...KREISE.map((k) => [k.name, k.praefix])]);
  u.kennung.standard = LAND.praefix;
  u.dateiname = u.dateiname.replace("{land}", "{kreis}");
  let text = json(u);
  text = ersetze(
    text,
    "Wer (Land, Bundesressort, Fachaufsicht, Nachbarland, Betreiberaufsicht)",
    "Wer (Kreis oder kreisfreie Stadt, Landesressort, Fachaufsicht, Bund, Nachbarland, Betreiberaufsicht)",
    "meldung.ui.json",
  );
  text = ersetze(text, '"Länderübergreifend"\n', '"Länderübergreifend",\n      "Kreisübergreifend"\n', "meldung.ui.json");
  return text;
}

function kontakte(q) {
  const k = JSON.parse(q);
  k.stellen = KREISE.map((x) => ({ name: x.name, feld: "kreis", email: "lage@beispiel.invalid" }));
  return json(k);
}

const TEXTE = {
  "anweisung-erfassung.md": [["`land` ist `{{profil.land}}`", "`kreis` ist `{{profil.kreis}}`"]],
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
    ["(Schemakennung `LEAD-Meldung-v1`)", "(Schemakennung `LEAD-Meldung-v1`, im Landesprofil `LEAD-Meldung-Land-v1` mit dem Feld `kreis` statt `land`)"],
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

/** Abgeleitete Dateien: Pfad im Profilordner → Inhalt */
export function ableiten(lesen = (pfad) => readFileSync(pfad, "utf-8")) {
  const q = (d) => lesen(join(QUELLE, d));
  const out = {
    "meldung.schema.json": schema(q("meldung.schema.json")),
    "meldung.ui.json": ui(q("meldung.ui.json")),
    "kontakte.json": kontakte(q("kontakte.json")),
  };
  for (const [datei, paare] of Object.entries(TEXTE)) out[datei] = paare.reduce((t, [alt, neu]) => ersetze(t, alt, neu, datei), q(datei));
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const pruefen = process.argv.includes("--check");
  const veraltet = [];
  for (const [datei, inhalt] of Object.entries(ableiten())) {
    const pfad = join(ZIEL, datei);
    let bisher = "";
    try {
      bisher = readFileSync(pfad, "utf-8");
    } catch {
      /* neu */
    }
    if (bisher === inhalt) continue;
    veraltet.push(datei);
    if (!pruefen) writeFileSync(pfad, inhalt);
  }
  if (pruefen && veraltet.length) {
    console.error(`Landesprofil veraltet: ${veraltet.join(", ")}. Mit „npm run profil:land“ neu ableiten.`);
    process.exit(1);
  }
  console.log(veraltet.length ? `${pruefen ? "veraltet" : "geschrieben"}: ${veraltet.join(", ")}` : "Landesprofil aktuell.");
}
