// Schichten des Quellcodes (seit 0.6.3, TP-2026-W44-23): Importkanten zwischen den Verzeichnissen unter src/ gegen eine
// Positivliste, keine Zyklen zwischen Verzeichnissen. Gelesen werden statische Importe, Re-Exporte, reine
// Seiteneffekt-Importe und dynamische import()-Aufrufe; das Soll steht als feste Liste in diesem Test.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO } from "../support/dateien";

const SRC = join(REPO, "src");

/** Verzeichnis eines Pfads unter src/ („(wurzel)“ für Dateien direkt in src/), außerhalb von src/ der erste Ordner mit „../“ */
function bereich(pfad: string): string {
  const rel = relative(SRC, pfad).split("\\").join("/");
  if (rel.startsWith("../")) return `../${rel.slice(3).split("/")[0]}`;
  const teile = rel.split("/");
  return teile.length > 1 ? (teile[0] ?? "") : "(wurzel)";
}

/** Importangaben eines Quelltexts: statisch, Re-Export, Seiteneffekt und dynamisch */
function importe(quelle: string): string[] {
  const muster = [/^\s*(?:import|export)\s[^'"`;]*?\sfrom\s+["']([^"']+)["']/gm, /^\s*import\s+["']([^"']+)["']/gm, /\bimport\(\s*["']([^"']+)["']\s*\)/g];
  const out: string[] = [];
  for (const m of muster) for (const t of quelle.matchAll(m)) if (t[1]) out.push(t[1]);
  return out;
}

/** Paketname einer Importangabe („idb-keyval“, „@capacitor/core“) */
function paket(spez: string): string {
  const teile = spez.split("/");
  return spez.startsWith("@") ? teile.slice(0, 2).join("/") : (teile[0] ?? spez);
}

interface Kante {
  von: string;
  nach: string;
  datei: string;
}

function quelldateien(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...quelldateien(p));
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

function graph(): { intern: Kante[]; extern: Kante[] } {
  const intern: Kante[] = [];
  const extern: Kante[] = [];
  for (const datei of quelldateien(SRC)) {
    const von = bereich(datei);
    const rel = relative(REPO, datei).split("\\").join("/");
    for (const spez of importe(readFileSync(datei, "utf-8"))) {
      if (spez.startsWith(".")) {
        const nach = bereich(resolve(dirname(datei), spez.replace(/\?.*$/, "")));
        if (nach !== von) intern.push({ von, nach, datei: rel });
      } else extern.push({ von, nach: paket(spez), datei: rel });
    }
  }
  return { intern, extern };
}

const { intern, extern } = graph();

/**
 * Positivliste: Verzeichnis → Verzeichnisse, aus denen es importieren darf. „../evaluation“ und „../profile“ sind
 * Ordner außerhalb von src/ (Evaluationsmaterial, eingebaute Profile per ?raw).
 */
const ERLAUBT: Record<string, string[]> = {
  kern: [],
  anbieter: [],
  darstellung: [],
  pwa: [],
  lagebild: ["kern"],
  dokumente: ["kern"],
  profil: ["kern", "../profile"],
  pipeline: ["kern", "anbieter", "profil", "lagebild"],
  forschung: ["kern", "anbieter", "profil", "pipeline", "../evaluation"],
  schluessel: ["anbieter", "pwa"],
  speicher: ["kern", "pipeline"],
  ui: ["kern", "anbieter", "profil", "pipeline", "forschung", "lagebild", "dokumente", "darstellung", "speicher", "schluessel", "pwa"],
  "(wurzel)": ["kern", "anbieter", "profil", "pipeline", "darstellung", "speicher", "schluessel", "pwa", "ui"],
};

/** Externe Pakete je Verzeichnis (nur die Schichten ohne Oberfläche) */
const PAKETE: Record<string, string[]> = {
  kern: [],
  anbieter: [],
  lagebild: ["jszip"],
  dokumente: ["jspdf", "jspdf-autotable"],
  profil: ["js-yaml", "jszip"],
  pipeline: ["jszip"],
  forschung: ["jszip"],
};

function kantenText(k: Kante[]): string[] {
  return [...new Set(k.map((x) => `${x.von} → ${x.nach} (${x.datei})`))].sort();
}

describe("Schichten des Quellcodes", () => {
  it("TP-2026-W44-23: der Importleser erkennt statische, Re-Export-, Seiteneffekt- und dynamische Importe", () => {
    const text = [
      'import { a } from "../kern/a";',
      'import type { B } from "../anbieter/typen";',
      'export { c } from "../profil/sop";',
      'import "./stil.css";',
      'const m = await import("../../evaluation/x.json");',
      'import {\n  d,\n  e,\n} from "idb-keyval";',
      '// "../ui/kommentar" ist kein Import',
    ].join("\n");
    expect(importe(text).sort()).toEqual(["../../evaluation/x.json", "../anbieter/typen", "../kern/a", "../profil/sop", "./stil.css", "idb-keyval"].sort());
  });

  it("TP-2026-W44-23: jede Datei unter src/ liegt in einem Verzeichnis der Positivliste", () => {
    const unbekannt = [...new Set(quelldateien(SRC).map(bereich))].filter((b) => !(b in ERLAUBT));
    expect(unbekannt).toEqual([]);
  });

  it("TP-2026-W44-23: Importkanten je Verzeichnis nur nach der Positivliste", () => {
    const fremd = intern.filter((k) => !(ERLAUBT[k.von] ?? []).includes(k.nach));
    expect(kantenText(fremd)).toEqual([]);
  });

  it("TP-2026-W44-23: kern importiert aus keinem anderen Verzeichnis und aus keinem Paket", () => {
    expect(kantenText(intern.filter((k) => k.von === "kern"))).toEqual([]);
    expect(kantenText(extern.filter((k) => k.von === "kern"))).toEqual([]);
  });

  it("TP-2026-W44-23: pipeline importiert weder ui, speicher, schluessel noch idb-keyval", () => {
    const verboten = ["ui", "speicher", "schluessel", "(wurzel)"];
    expect(kantenText(intern.filter((k) => k.von === "pipeline" && verboten.includes(k.nach)))).toEqual([]);
    expect(kantenText(extern.filter((k) => k.von === "pipeline" && k.nach === "idb-keyval"))).toEqual([]);
  });

  it("TP-2026-W44-24: der Profilloader kennt die Darstellung nicht", () => {
    expect(kantenText(intern.filter((k) => k.von === "profil" && k.nach === "darstellung"))).toEqual([]);
  });

  it("TP-2026-W44-24: IndexedDB (idb-keyval) nur in speicher, schluessel und darstellung", () => {
    const orte = [...new Set(extern.filter((k) => k.nach === "idb-keyval").map((k) => k.von))].sort();
    expect(orte).toEqual(["darstellung", "schluessel", "speicher"]);
  });

  it("TP-2026-W44-25: Evaluationsmaterial (evaluation/) importiert nur src/forschung/", () => {
    const orte = [...new Set(intern.filter((k) => k.nach === "../evaluation").map((k) => k.von))];
    expect(orte).toEqual(["forschung"]);
  });

  it("TP-2026-W44-25: der Produktpfad (kern, profil, pipeline, lagebild, dokumente, speicher) importiert nicht aus forschung", () => {
    const produkt = ["kern", "profil", "pipeline", "lagebild", "dokumente", "speicher"];
    expect(kantenText(intern.filter((k) => produkt.includes(k.von) && k.nach === "forschung"))).toEqual([]);
  });

  it("TP-2026-W44-23: externe Pakete der Schichten ohne Oberfläche nur nach der Positivliste", () => {
    const fremd = extern.filter((k) => k.von in PAKETE && !(PAKETE[k.von] ?? []).includes(k.nach));
    expect(kantenText(fremd)).toEqual([]);
  });

  it("TP-2026-W44-23: keine Zyklen zwischen den Verzeichnissen", () => {
    const nach = new Map<string, Set<string>>();
    for (const k of intern) {
      if (!nach.has(k.von)) nach.set(k.von, new Set());
      nach.get(k.von)!.add(k.nach);
    }
    const zyklen: string[] = [];
    const besuche = (start: string, knoten: string, pfad: string[]) => {
      for (const n of nach.get(knoten) ?? []) {
        if (n === start) zyklen.push([...pfad, n].join(" → "));
        else if (!pfad.includes(n)) besuche(start, n, [...pfad, n]);
      }
    };
    for (const b of nach.keys()) besuche(b, b, [b]);
    expect(zyklen).toEqual([]);
  });
});
