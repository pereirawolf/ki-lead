// Grunddesign der App-Familie (design/README.md): erzeugt die Design Tokens im Format der W3C Design Tokens Community
// Group (DTCG, https://www.designtokens.org/tr/drafts/format/) aus dem Code von KI-LEAD, der Referenzumsetzung.
//
//   npm run design:tokens            schreibt design/lead-design.tokens.json und design/lead-farbschemata.tokens.json
//   npm run design:tokens -- pruefe  meldet, ob die Dateien aktuell sind (Exit-Code 1, wenn nicht)
//
// Quellen: Farbrollen, Signalfarben und Farbschemata aus src/darstellung/ (TypeScript, von Node direkt gelesen); Maße,
// Schrift und Umbrüche aus den Stylesheets. Jeder Wert wird dort gesucht; fehlt er, bricht das Skript ab, statt einen
// veralteten Wert zu schreiben. tests/format/lead-design.test.ts prüft, dass die Dateien dem Code entsprechen.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FARBSCHEMAS } from "../src/darstellung/katalog.ts";
import { KONTRASTPAARE, SEMANTIK } from "../src/darstellung/thema.ts";
import { UI_TOKENS } from "../src/darstellung/typen.ts";

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ZIEL_TOKENS = "design/lead-design.tokens.json";
export const ZIEL_SCHEMATA = "design/lead-farbschemata.tokens.json";
export const ZIEL_BESCHREIBUNG = "design/README.md";
const RAHMEN = "design/rahmen.json";
const ANFANG = "<!-- regeln:anfang (erzeugt aus rahmen.json mit „npm run design:tokens“; nicht von Hand ändern) -->";
const ENDE = "<!-- regeln:ende -->";
const ERWEITERUNG = "de.pereirawolf.lead-design";

/** Bedeutung der Farbrollen (CSS-Variable --<rolle>); Grundlage: Verwendung in src/styles/ und docs/farbschemas.md */
export const ROLLEN = {
  papier: "Seitenhintergrund",
  flaeche: "Karten, Arbeitsfläche eines Schritts, Eingabefelder, Dialoge",
  tinte: "Text",
  "tinte-leise": "Nebentext: Kennsatz, Hilfetexte, Profilzeile, inaktive Navigation",
  linie: "Rahmen von Karten, Kästen, Tabellen und der Schrittleiste",
  "linie-zart": "zarte Trennlinien, Zählmarken",
  "eingabe-rand": "Rand von Eingabefeldern (Kontur, mindestens 3:1)",
  fokus: "Fokusring (3 px)",
  "fokus-abstand": "zweiter, heller Ring um den Fokus, damit er auf farbigen Flächen sichtbar bleibt",
  "auswahl-text": "Text auf der zarten Aktionsfläche (gewählte Optionen)",
  "lese-farbe": "Lesebereiche der Profilansicht: Text, Rand und Fokus",
  "lese-flaeche": "Lesebereiche der Profilansicht: Fläche",
  "header-hintergrund": "Kopfleiste",
  "header-text": "Text der Kopfleiste",
  amt: "Aktionsfarbe: Hauptknopf, aktiver Schritt, Rand der Knöpfe, KI-Statusanzeige",
  "amt-tief": "dunkle Aktionsfarbe: Produktname, aktiver Navigationspunkt, Text der Knöpfe",
  "amt-zart": "zarte Aktionsfläche: Hover, aktiver Navigationspunkt, Hinweis zur Information",
  "auf-amt": "Text auf der Aktionsfarbe",
  "auf-amt-hover": "Text auf der dunklen Aktionsfarbe (Hover des Hauptknopfs)",
  link: "Verweise",
  "auswahl-rand": "Rand und Akzentfarbe gewählter Elemente (Ankreuzfelder, Optionen)",
  browserleiste: "Farbe der Browserleiste (theme-color)",
  "marke-akzent-1": "Identitätsband, erste Farbe",
  "marke-akzent-2": "Identitätsband, zweite Farbe",
  "marke-akzent-3": "Identitätsband, dritte Farbe",
};

/** Bedeutung der Signalfarben; sie tragen nur die Bewertung und kommen nie aus Profil oder Farbschema */
export const SIGNALE = {
  gering: "Bewertung „geringfügig“, Hinweis",
  "gering-zart": "Fläche zu „geringfügig“",
  erheblich: "Bewertung „erheblich“, Warnung",
  "erheblich-zart": "Fläche zu „erheblich“",
  "auf-erheblich": "Text auf „erheblich“",
  kritisch: "Bewertung „kritisch“, Fehler, Befundmarke",
  "kritisch-zart": "Fläche zu „kritisch“ und zum Fehlerkasten",
  ok: "Entspannung, gelungene Prüfung, verwendetes Profil (keine fachliche Freigabe)",
  "ok-zart": "Fläche zu „ok“",
  einsatz: "Status „im Einsatz“ der Ampel der Einsatzbereitschaft (Schwester-Apps wie Thessa; in KI-LEAD ungenutzt)",
  "einsatz-zart": "Fläche zu „im Einsatz“",
  "radar-linie": "Linie des Lagenradars",
  "radar-ring": "Ringe und Achsen des Lagenradars",
  "radar-flaeche": "Fläche des Lagenradars",
};

const lies = (pfad) => readFileSync(join(WURZEL, pfad), "utf-8");

/** Wert einer Eigenschaft im ersten Regelblock, dessen Selektor genau `selektor` ist (außerhalb von @media) */
function cssWert(datei, selektor, eigenschaft) {
  const text = lies(datei).replace(/\/\*[\s\S]*?\*\//g, "");
  const esc = selektor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`).exec(text);
  if (!block) throw new Error(`${datei}: Regel „${selektor}“ nicht gefunden`);
  const m = new RegExp(`(?:^|[;\\s])${eigenschaft.replace(/-/g, "\\-")}\\s*:\\s*([^;]+);`).exec(block[1]);
  if (!m) throw new Error(`${datei}: „${eigenschaft}“ in „${selektor}“ nicht gefunden`);
  return m[1].trim();
}

/** Breiten der Media Queries (max-width) in den Stylesheets, absteigend */
function umbrueche() {
  const dateien = [
    "src/styles/basis.css",
    "src/styles/formular.css",
    "src/styles/lagebild.css",
    "src/styles/einstellungen.css",
    "src/styles/ki.css",
    "src/styles/profile.css",
  ];
  const breiten = new Set();
  for (const d of dateien) for (const m of lies(d).matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)) breiten.add(Number(m[1]));
  return [...breiten].sort((a, b) => b - a);
}

const groesse = (wert) => {
  const m = /^(-?[\d.]+)(px|rem)$/.exec(wert);
  if (!m) throw new Error(`keine Größe in px oder rem: ${wert}`);
  return { value: Number(m[1]), unit: m[2] };
};
const dimension = (wert, beschreibung) => ({ $type: "dimension", $value: groesse(wert), $description: beschreibung });
/** Farbwert als Hexwert, wie ihn DTCG-Werkzeuge lesen: rgba() wird #RRGGBBAA, transparent wird #00000000 */
export function hexFarbe(wert) {
  if (/^#[0-9A-Fa-f]{6}$/.test(wert)) return wert.toUpperCase();
  if (wert === "transparent") return "#00000000";
  const m = /^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)$/.exec(wert);
  if (!m) throw new Error(`Farbwert nicht lesbar: ${wert}`);
  const hex = (n) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
  return `#${hex(+m[1])}${hex(+m[2])}${hex(+m[3])}${hex(+m[4] * 255)}`;
}

const farbe = (wert, beschreibung, erweiterung) => ({
  $type: "color",
  $value: hexFarbe(wert),
  ...(beschreibung ? { $description: beschreibung } : {}),
  ...(erweiterung ? { $extensions: { [ERWEITERUNG]: erweiterung } } : {}),
});

const eintrag = (id) => {
  const e = FARBSCHEMAS.find((s) => s.id === id);
  if (!e) throw new Error(`Farbschema ${id} fehlt im Katalog`);
  return e;
};

/** Design Tokens der Familie: Farbrollen mit den Werten der Neutralschemata, Signalfarben, Schrift, Maße, Umbrüche */
export function designTokens() {
  const hell = eintrag("neutral-hell");
  const modi = ["neutral-dunkel", "kontrast-hell", "kontrast-dunkel"].map(eintrag);
  const farbrolle = {
    $description:
      "Farbrollen der Oberfläche. Werte: Schema „Neutral · Hell“; weitere Schemata unter $extensions und in lead-farbschemata.tokens.json. Welche Werte gelten, bestimmt allein das aktive Profil (farbschema.basis und farbschema.farben), sonst die Wahl unter „Einstellungen → Darstellung“ (Regel LD-F01).",
  };
  for (const rolle of UI_TOKENS) {
    if (!ROLLEN[rolle]) throw new Error(`Bedeutung der Farbrolle ${rolle} fehlt in ROLLEN`);
    farbrolle[rolle] = farbe(hell.tokens[rolle], ROLLEN[rolle], {
      modi: Object.fromEntries(modi.map((e) => [e.id, hexFarbe(e.tokens[rolle])])),
      css: `--${rolle}`,
      profil: true,
    });
  }
  const signal = {
    $description:
      "Signalfarben der Bewertung. Gleich in allen Apps und Farbschemata, nur nach hell, dunkel und Kontrast verschieden; nie aus einem Profil (Regel LD-F04).",
  };
  for (const name of Object.keys(SEMANTIK.hell)) {
    if (!SIGNALE[name]) throw new Error(`Bedeutung der Signalfarbe ${name} fehlt in SIGNALE`);
    signal[name] = farbe(SEMANTIK.hell[name], SIGNALE[name], {
      modi: {
        dunkel: hexFarbe(SEMANTIK.dunkel[name]),
        "kontrast-hell": hexFarbe(SEMANTIK["kontrast-hell"][name]),
        "kontrast-dunkel": hexFarbe(SEMANTIK["kontrast-dunkel"][name]),
      },
      css: `--${name}`,
      profil: false,
    });
  }
  const [breit, mittel, schmal, ...rest] = umbrueche();
  if (rest.length || schmal === undefined) throw new Error(`erwartet genau drei Umbrüche, gefunden: ${umbrueche().join(", ")}`);
  const kontrast = [...new Set(KONTRASTPAARE.map((p) => p[2]))].sort((a, b) => b - a);
  return {
    $description:
      "Design Tokens der App-Familie KI-LEAD, KRITIS-LEAD und Thessa (design/README.md). Erzeugt mit „npm run design:tokens“ aus der Referenzumsetzung KI-LEAD; nicht von Hand ändern. © 2026 Heiko Pereira Wolf, CC BY 4.0 (LICENSE-CONTENT, Nr. 1 f).",
    $extensions: { [ERWEITERUNG]: { format: "lead-design-tokens/1", rahmen: "rahmen.json", farbschemata: "lead-farbschemata.tokens.json" } },
    farbrolle,
    signal,
    schrift: {
      familie: {
        $type: "fontFamily",
        $value: cssWert("src/styles/basis.css", ":root", "--schrift")
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, "")),
        $description: "Atkinson Hyperlegible, mit der App gebündelt (keine nachgeladenen Schriften)",
      },
      normal: { $type: "fontWeight", $value: 400, $description: "Fließtext" },
      fett: { $type: "fontWeight", $value: 700, $description: "Überschriften, Beschriftungen, Knöpfe, Navigation" },
      zeilenhoehe: { $type: "number", $value: Number(cssWert("src/styles/basis.css", "body", "line-height")), $description: "Fließtext" },
      grund: dimension(
        cssWert("src/styles/basis.css", "body", "font-size"),
        "Grundschrift (17 px bei 16 px Browservorgabe); folgt der Schriftgröße des Systems",
      ),
      h1: dimension(cssWert("src/styles/basis.css", ".werkzeugleiste h1", "font-size"), "Seitentitel (Bereichsname)"),
      h2: dimension(cssWert("src/styles/basis.css", ".schritt-inhalt > h2", "font-size"), "Titel des Schritts, Abschnitts oder Bereichs"),
      marke: dimension(cssWert("src/styles/basis.css", ".marke-name", "font-size"), "Produktname in der Kopfleiste"),
      klein: dimension(cssWert("src/styles/basis.css", ".profilzeile", "font-size"), "Profilzeile, Hinweisband, Zusatzangaben"),
      fuss: dimension(cssWert("src/styles/basis.css", ".fuss", "font-size"), "Fußzeile"),
    },
    radius: {
      klein: dimension(cssWert("src/styles/basis.css", ":root", "--r-klein"), "Knöpfe, Navigation, Eingaben"),
      mittel: dimension(cssWert("src/styles/basis.css", ":root", "--r-mittel"), "Karten, Kästen, Dialoge"),
    },
    mass: {
      zielgroesse: dimension(
        cssWert("src/styles/basis.css", ".knopf", "min-height"),
        "Mindesthöhe von Knöpfen; bei grober Zeigereingabe für alle Bedienelemente",
      ),
      band: dimension(cssWert("src/styles.css", ":where(.kopf)", "border-bottom").split(/\s+/)[0], "Höhe des Identitätsbands unter der Kopfleiste"),
      fokusring: dimension(cssWert("src/styles/basis.css", ":focus-visible", "outline").split(/\s+/)[0], "Breite des Fokusrings"),
      fokusabstand: dimension(cssWert("src/styles/basis.css", ":focus-visible", "outline-offset"), "Abstand des Fokusrings"),
      inhaltsbreite: dimension(cssWert("src/styles/basis.css", ".inhalt", "max-width"), "größte Breite des Inhalts"),
      leistenbreite: dimension(
        cssWert("src/styles/basis.css", ".arbeitsbereich", "grid-template-columns").split(/\s+/)[0],
        "Breite der Schritt- und Bereichsleiste in der breiten Ansicht",
      ),
      spaltenabstand: dimension(cssWert("src/styles/basis.css", ".arbeitsbereich", "gap"), "Abstand zwischen Leiste und Arbeitsfläche"),
    },
    umbruch: {
      $description: "Breiten des Fensters (max-width), ab denen die Ansicht umbricht",
      breit: dimension(`${breit}px`, "bis hier: Leiste waagerecht über dem Inhalt, eine Spalte (schmale Bildschirme, Tablets hochkant)"),
      mittel: dimension(`${mittel}px`, "bis hier: Hauptnavigation in eigener Zeile und umbrechend, Tabellen und Raster einspaltig (Smartphones quer)"),
      schmal: dimension(`${schmal}px`, "bis hier: Kopf und Segmente kompakt (Smartphones hochkant)"),
    },
    kontrast: {
      $description: "Mindestkontraste nach WCAG 2.2, geprüft für jedes Farbschema und jedes Profilschema",
      text: { $type: "number", $value: Math.max(...kontrast), $description: "Text auf seiner Fläche" },
      kontur: { $type: "number", $value: Math.min(...kontrast), $description: "Konturen und Bedienelemente" },
      kontrastschema: { $type: "number", $value: Math.max(...FARBSCHEMAS.map((e) => e.kontrastziel ?? 4.5)), $description: "Text in den Kontrastschemata" },
    },
  };
}

/** Alle Farbschemata des Katalogs; Kennungen sind die zulässigen Werte von farbschema.basis im Profil */
export function farbschemaTokens() {
  const out = {
    $description:
      "Farbschemata der App-Familie. Die Kennung ist der Wert von farbschema.basis im Profilmanifest. Erzeugt mit „npm run design:tokens“ aus src/darstellung/katalog.ts; nicht von Hand ändern. © 2026 Heiko Pereira Wolf, CC BY 4.0 (LICENSE-CONTENT, Nr. 1 f).",
    $extensions: { [ERWEITERUNG]: { format: "lead-farbschemata/1" } },
  };
  for (const e of FARBSCHEMAS) {
    const gruppe = {
      $description: e.name,
      $extensions: {
        [ERWEITERUNG]: { gruppe: e.gruppe, modus: e.modus, signal: e.semantik ?? e.modus, kontrastziel: e.kontrastziel ?? 4.5, band: e.band.map(hexFarbe) },
      },
    };
    for (const rolle of UI_TOKENS) gruppe[rolle] = farbe(e.tokens[rolle]);
    out[e.id] = gruppe;
  }
  return out;
}

const alsText = (o) => JSON.stringify(o, null, 2) + "\n";

/** Regeltabellen je Thema aus rahmen.json, in der Reihenfolge der Regeln */
export function regelTabellen(rahmen = JSON.parse(lies(RAHMEN))) {
  const themen = [...new Set(rahmen.regeln.map((r) => r.thema))];
  const zelle = (t) => t.replace(/\|/g, "\\|");
  const fund = (r) => r.referenz.map((f) => "`" + f + "`").join(", ");
  return themen
    .map((t) =>
      [
        `### ${t}`,
        "",
        "| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |",
        "|---|---|---|---|",
        ...rahmen.regeln
          .filter((r) => r.thema === t)
          .map((r) => `| <a id="${r.id.toLowerCase()}"></a>**${r.id}** | ${r.stufe} | ${zelle(r.text)} | ${fund(r)} |`),
      ].join("\n"),
    )
    .join("\n\n");
}

/** Beschreibung mit den erzeugten Regeltabellen zwischen den Marken */
export function beschreibung(text = lies(ZIEL_BESCHREIBUNG)) {
  const a = text.indexOf(ANFANG);
  const e = text.indexOf(ENDE);
  if (a < 0 || e < a) throw new Error(`${ZIEL_BESCHREIBUNG}: Marken der Regeltabellen fehlen`);
  return text.slice(0, a + ANFANG.length) + "\n\n" + regelTabellen() + "\n\n" + text.slice(e);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const dateien = [
    [ZIEL_TOKENS, alsText(designTokens())],
    [ZIEL_SCHEMATA, alsText(farbschemaTokens())],
    [ZIEL_BESCHREIBUNG, beschreibung()],
  ];
  if (process.argv[2] === "pruefe") {
    const alt = dateien.filter(([pfad, text]) => {
      try {
        return lies(pfad) !== text;
      } catch {
        return true;
      }
    });
    for (const [pfad] of alt) console.error(`${pfad} ist nicht aktuell: npm run design:tokens`);
    process.exit(alt.length ? 1 : 0);
  }
  for (const [pfad, text] of dateien) {
    writeFileSync(join(WURZEL, pfad), text);
    console.log(`geschrieben: ${pfad}`);
  }
}
