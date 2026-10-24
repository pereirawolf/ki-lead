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

  it("das Befundregister entspricht seinem Schema, IDs sind eindeutig und passen zu Befunddatei und Stand", () => {
    const ajv = referenzAjv();
    ajv.addFormat("date", /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
    const pruefen = ajv.compile(lies("evaluation/befunde/befundregister.schema.json"));
    const register = lies("evaluation/befunde/befundregister.json");
    expect(pruefen(register), JSON.stringify(pruefen.errors)).toBe(true);
    const ids = register.eintraege.map((e: any) => e.id);
    expect(new Set(ids).size, "doppelte Befund-IDs").toBe(ids.length);
    for (const e of register.eintraege) {
      expect(e.befunddatei, `${e.id}: Kalenderwoche der Befunddatei`).toContain(e.id.slice(3, 11));
      expect(e.entschieden_am <= register.stand, `${e.id}: entschieden nach Registerstand`).toBe(true);
    }
  });

  it("das Befundschema verlangt Grund, Pull Request und Wiedervorlage je nach Status", () => {
    const ajv = referenzAjv();
    ajv.addFormat("date", /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
    const pruefen = ajv.compile(lies("evaluation/befunde/befundregister.schema.json"));
    const eintrag = () => ({
      id: "KP-2026-W44-01",
      agent: "konsistenzpruefer",
      befunddatei: "ki-lead-befund_konsistenz_2026-W44.json",
      commit: "4fbd397",
      dringlichkeit: "mittel",
      fundstellen: [{ datei: "profile/lead-beispiel/kodierleitfaden.md", stelle: "Abschnitt 3, D5" }],
      kurz: "Beispiel",
      status: "umgesetzt",
      entschieden_am: "2026-10-30",
      pr: 51,
    });
    const register = (e: any) => ({ format: "ki-lead-befundregister/1", stand: "2026-10-30", eintraege: [e] });
    expect(pruefen(register(eintrag())), JSON.stringify(pruefen.errors)).toBe(true);
    const falsch: [string, (e: any) => void][] = [
      ["umgesetzt ohne PR", (e) => delete e.pr],
      ["abgelehnt ohne Grund", (e) => (e.status = "abgelehnt")],
      ["zurückgestellt ohne Wiedervorlage", (e) => Object.assign(e, { status: "zurueckgestellt", grund: "später" })],
      ["ID ohne Kalenderwoche", (e) => (e.id = "KP-2026-01")],
      ["Status unbekannt", (e) => (e.status = "offen")],
      ["ohne Fundstelle", (e) => (e.fundstellen = [])],
    ];
    for (const [name, aendern] of falsch) {
      const e = eintrag();
      aendern(e);
      expect(pruefen(register(e)), name).toBe(false);
    }
  });

  it("enthält keine API-Schlüssel", () => {
    const dateien = [
      ...jsonIn("evaluation/faelle").map((n) => `evaluation/faelle/${n}`),
      ...jsonIn("evaluation/ergebnisse").map((n) => `evaluation/ergebnisse/${n}`),
      ...jsonIn("evaluation/befunde").map((n) => `evaluation/befunde/${n}`),
    ];
    for (const d of dateien) expect(readFileSync(repoPfad(d), "utf-8"), d).not.toMatch(/sk-(ant|proj|live)[-_][A-Za-z0-9_-]{8,}/);
  });
});
