// Modellbewertung (evaluation/): Fälle und Ergebnisse entsprechen ihren Schemata, Material im Repository ist vorhanden
// und frei, keine Schlüssel. Ruft keine KI auf.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { referenzAjv } from "../support/ajv";
import { repoPfad } from "../support/dateien";

const lies = (pfad: string) => JSON.parse(readFileSync(repoPfad(pfad), "utf-8"));
const jsonIn = (ordner: string) =>
  readdirSync(repoPfad(ordner))
    .filter((n) => n.endsWith(".json") && !n.endsWith(".schema.json"))
    .sort();

function pruefer() {
  const ajv = referenzAjv();
  // Nur die verwendeten Formate, ohne zusätzliche Abhängigkeit
  ajv.addFormat("date", /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
  ajv.addFormat("uri", /^https?:\/\/\S+$/);
  return { fall: ajv.compile(lies("evaluation/faelle/fall.schema.json")), bewertung: ajv.compile(lies("evaluation/bewertungsschema.json")) };
}

/** Vollständige, gültige Bewertung als Ausgangspunkt für Abwandlungen */
const bewertung = () => ({
  format: "ki-lead-bewertung/1",
  fall: "orkantief-ilka-verdichtung",
  kennung: "x7k2",
  bewertet_am: "2026-10-21",
  blind: true,
  kriterien: Object.fromEntries(
    ["belege", "zeit", "referenzraum", "unsicherheit", "radar", "empfehlungen"].map((k) => [k, { note: 3, begruendung: "Begründung" }]),
  ),
  unbelegte_aussagen: [{ aussage: "29.000 ohne Strom", feld: "sachverhalte[0].analyse", schwere: "erheblich" }],
  gesamt: { note: 3, begruendung: "brauchbar mit Nacharbeit" },
  variante: { s1: { modell: "claude-haiku-5-5", aufwand: "high" }, s2: { modell: "claude-opus-5-5", aufwand: "medium" }, material: "eingaenge" },
  lauf: { kosten_usd: 1.3, dauer_s: 320, websuchen: 0, schemakonform: true },
});

describe("Modellbewertung: Schemata", () => {
  it("alle Fälle entsprechen fall.schema.json und verweisen nur auf vorhandene, fiktive Dateien", () => {
    const { fall } = pruefer();
    const faelle = jsonIn("evaluation/faelle");
    expect(faelle.length).toBeGreaterThan(0);
    for (const name of faelle) {
      const f = lies(`evaluation/faelle/${name}`);
      expect(fall(f), `${name}: ${JSON.stringify(fall.errors)}`).toBe(true);
      expect(name).toBe(`${f.id}.json`);
      for (const m of f.material) if (m.datei) expect(existsSync(repoPfad(m.datei)), `${name}: ${m.datei}`).toBe(true);
      if (f.material.some((m: any) => m.datei)) expect(f.fiktiv, `${name}: Material im Repository nur bei fiktiven Fällen`).toBe(true);
    }
  });

  it("die Bewertung verlangt alle Kriterien, Noten 1–5 und Begründungen", () => {
    const { bewertung: pruefen } = pruefer();
    expect(pruefen(bewertung()), JSON.stringify(pruefen.errors)).toBe(true);
    const falsch: [string, (b: any) => void][] = [
      ["Kriterium fehlt", (b) => delete b.kriterien.radar],
      ["Note 0", (b) => (b.kriterien.zeit.note = 0)],
      ["Note 6", (b) => (b.gesamt.note = 6)],
      ["Note gebrochen", (b) => (b.kriterien.belege.note = 2.5)],
      ["Begründung leer", (b) => (b.kriterien.belege.begruendung = "")],
      ["unbekanntes Kriterium", (b) => (b.kriterien.stil = { note: 3, begruendung: "x" })],
      ["Aufwand unbekannt", (b) => (b.variante.s2.aufwand = "extrem")],
      ["Kosten negativ", (b) => (b.lauf.kosten_usd = -1)],
      ["blind fehlt", (b) => delete b.blind],
    ];
    for (const [name, aendern] of falsch) {
      const b = bewertung();
      aendern(b);
      expect(pruefen(b), name).toBe(false);
    }
  });

  it("vorhandene Ergebnisse entsprechen dem Bewertungsschema", () => {
    const { bewertung: pruefen } = pruefer();
    for (const name of jsonIn("evaluation/ergebnisse")) {
      const inhalt = lies(`evaluation/ergebnisse/${name}`);
      for (const b of Array.isArray(inhalt) ? inhalt : [inhalt]) expect(pruefen(b), `${name}: ${JSON.stringify(pruefen.errors)}`).toBe(true);
    }
  });

  it("enthält keine API-Schlüssel", () => {
    const dateien = [
      ...jsonIn("evaluation/faelle").map((n) => `evaluation/faelle/${n}`),
      ...jsonIn("evaluation/ergebnisse").map((n) => `evaluation/ergebnisse/${n}`),
    ];
    for (const d of dateien) expect(readFileSync(repoPfad(d), "utf-8"), d).not.toMatch(/sk-(ant|proj|live)[-_][A-Za-z0-9_-]{8,}/);
  });
});
