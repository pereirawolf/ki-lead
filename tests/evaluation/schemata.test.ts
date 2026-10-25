// Modellbewertung (evaluation/): Fälle und Ergebnisse entsprechen ihren Schemata, Material im Repository ist vorhanden
// und frei, keine Schlüssel. Ruft keine KI auf.
import { createHash } from "node:crypto";
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
  return {
    fall: ajv.compile(lies("evaluation/faelle/fall.schema.json")),
    bewertung: ajv.compile(lies("evaluation/bewertungsschema.json")),
    plan: ajv.compile(lies("evaluation/plaene/plan.schema.json")),
  };
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

  // Befunde LS-2026-W43-01 bis -03 (Lernschleife, 24.10.2026): Radarerwartungen, Abwandlungen, Bewertungspläne
  /** Kleinster gültiger Fall als Ausgangspunkt für Abwandlungen */
  const fallMinimal = () => ({
    format: "ki-lead-evaluationsfall/1",
    id: "beispiel-fall",
    titel: "Beispiel (FIKTIV)",
    stand: "2026-10-24",
    fiktiv: true,
    auftrag: { sachverhalt: "Beispiel" },
    material: [],
    erwartungen: { muss: ["Beispiel"] },
  });

  it("LS-2026-W43-01: erwartete Radarwerte sind je Achse offen oder eine Spanne mit Grund", () => {
    const { fall } = pruefer();
    const mit = (radar: any) => ({ ...fallMinimal(), erwartungen: { muss: ["Beispiel"], radar } });
    expect(fall(mit({ d2: { offen: true, grund: "x" }, d5: { min: 2, max: 3, grund: "y" } })), JSON.stringify(fall.errors)).toBe(true);
    const falsch: [string, any][] = [
      ["Achse d9", { d9: { min: 1, max: 1, grund: "x" } }],
      ["ohne Grund", { d1: { min: 1, max: 2 } }],
      ["offen und Spanne zugleich", { d1: { offen: true, min: 1, max: 2, grund: "x" } }],
      ["nur min", { d1: { min: 1, grund: "x" } }],
      ["Wert 7", { d1: { min: 5, max: 7, grund: "x" } }],
      ["gebrochener Wert", { d1: { min: 1.5, max: 2, grund: "x" } }],
      ["offen false", { d1: { offen: false, grund: "x" } }],
      ["leeres Objekt", {}],
    ];
    for (const [name, radar] of falsch) expect(fall(mit(radar)), name).toBe(false);
  });

  it("LS-2026-W43-01: in allen Fällen gilt min ≤ max", () => {
    for (const name of jsonIn("evaluation/faelle")) {
      const radar = lies(`evaluation/faelle/${name}`).erwartungen.radar || {};
      for (const [achse, w] of Object.entries<any>(radar)) if (!w.offen) expect(w.min <= w.max, `${name}: ${achse}`).toBe(true);
    }
  });

  it("LS-2026-W43-01: der Pilotfall erwartet D2 offen", () => {
    expect(lies("evaluation/faelle/sop-gas-stabil.json").erwartungen.radar).toEqual({
      d2: { offen: true, grund: "Keine einschlägige Grundgesamtheit direkt betroffener Personen im Material." },
    });
  });

  it("LS-2026-W43-02: Abwandlung und Ausgangsfall stehen nur gemeinsam", () => {
    const { fall } = pruefer();
    expect(fall({ ...fallMinimal(), variante_von: "sop-gas-stabil", abwandlung: "Speicherstand 40 statt 60 Prozent" }), JSON.stringify(fall.errors)).toBe(true);
    expect(fall({ ...fallMinimal(), variante_von: "sop-gas-stabil" }), "ohne abwandlung").toBe(false);
    expect(fall({ ...fallMinimal(), abwandlung: "x" }), "ohne variante_von").toBe(false);
    expect(fall({ ...fallMinimal(), variante_von: "Sop Gas", abwandlung: "x" }), "ID-Muster").toBe(false);
  });

  it("LS-2026-W43-02: Abwandlungen verweisen auf einen anderen vorhandenen Fall", () => {
    const ids = new Set(jsonIn("evaluation/faelle").map((n) => n.replace(/\.json$/, "")));
    for (const name of jsonIn("evaluation/faelle")) {
      const f = lies(`evaluation/faelle/${name}`);
      if (!f.variante_von) continue;
      expect(f.variante_von, `${name}: verweist auf sich selbst`).not.toBe(f.id);
      expect(ids.has(f.variante_von), `${name}: Ausgangsfall ${f.variante_von} fehlt`).toBe(true);
    }
  });

  it("LS-2026-W43-03: der Bewertungsplan verlangt Fragestellung und Fälle; Varianten wie in der Bewertung", () => {
    const { plan } = pruefer();
    const beispiel = () => ({
      format: "ki-lead-bewertungsplan/1",
      id: "gas-abwandlungen",
      stand: "2026-10-24",
      fragestellung: "Erkennen die Varianten offene Achsen?",
      faelle: ["sop-gas-stabil", "sop-gas-geschuetzt"],
      varianten: [
        { kennung: "A", s1: { modell: "claude-haiku-5-5", aufwand: "high" }, s2: { modell: "claude-opus-5-5", aufwand: "medium" }, material: "ohne" },
      ],
      wiederholungen: 2,
      budget_usd: 5,
    });
    expect(plan(beispiel()), JSON.stringify(plan.errors)).toBe(true);
    const falsch: [string, (p: any) => void][] = [
      ["ohne Fragestellung", (p) => delete p.fragestellung],
      ["keine Fälle", (p) => (p.faelle = [])],
      ["Fall doppelt", (p) => (p.faelle = ["sop-gas-stabil", "sop-gas-stabil"])],
      ["Aufwand unbekannt", (p) => (p.varianten[0].s1.aufwand = "extrem")],
      ["Wiederholungen 0", (p) => (p.wiederholungen = 0)],
      ["Budget negativ", (p) => (p.budget_usd = -1)],
      ["unbekanntes Feld", (p) => (p.ergebnis = "gut")],
    ];
    for (const [name, aendern] of falsch) {
      const p = beispiel();
      aendern(p);
      expect(plan(p), name).toBe(false);
    }
  });

  it("LS-2026-W43-03: Pläne haben ein bekanntes Format, Bewertungspläne verweisen nur auf vorhandene Fälle", () => {
    const { plan } = pruefer();
    const ids = new Set(jsonIn("evaluation/faelle").map((n) => n.replace(/\.json$/, "")));
    for (const name of jsonIn("evaluation/plaene")) {
      const p = lies(`evaluation/plaene/${name}`);
      expect(["ki-lead-bewertungsplan/1", "ki-lead-sop-abdeckung/1"], `${name}: Format`).toContain(p.format);
      const verweise = p.format === "ki-lead-bewertungsplan/1" ? p.faelle : Object.keys(p.faelle);
      if (p.format === "ki-lead-bewertungsplan/1") {
        expect(plan(p), `${name}: ${JSON.stringify(plan.errors)}`).toBe(true);
        expect(name).toBe(`${p.id}.json`);
      }
      for (const id of verweise) expect(ids.has(id), `${name}: Fall ${id} fehlt`).toBe(true);
    }
  });

  // Befunde LS-2026-W43-14, -15 und -18 (Lernschleife, 25.10.2026): Ilka-Maßstab, fester S1-Gegenstand, Nacharbeit
  it("LS-2026-W43-14: beide Ilka-Fälle binden die Zusammenführung der Stromlosen an die Zählregeln", () => {
    for (const id of ["orkantief-ilka-verdichtung", "sop-verdichtung-ilka-vergleich"]) {
      const muss: string[] = lies(`evaluation/faelle/${id}.json`).erwartungen.muss;
      const punkt = muss.filter((m) => m.includes("Stromlosen"));
      expect(punkt, id).toHaveLength(1);
      expect(punkt[0], id).toContain("Regeln 3 und 4");
      expect(punkt[0], id).toContain("sonst wird die Nichtaggregation begründet");
    }
  });

  it("LS-2026-W43-15: fester S1-Gegenstand im Plan nur mit Datei unter evaluation/material/ und Prüfsumme", () => {
    const { plan } = pruefer();
    const mit = (s1_fest: unknown) => ({ format: "ki-lead-bewertungsplan/1", id: "x", stand: "2026-10-25", fragestellung: "F", faelle: ["sop-gas-stabil"], s1_fest });
    expect(plan(mit({ datei: "evaluation/material/ilka-s1-zuschnitt-a.json", sha256: "0".repeat(64) })), JSON.stringify(plan.errors)).toBe(true);
    for (const [name, s] of [
      ["Prüfsumme fehlt", { datei: "evaluation/material/a.json" }],
      ["Prüfsumme zu kurz", { datei: "evaluation/material/a.json", sha256: "abc" }],
      ["Datei außerhalb", { datei: "privat/a.json", sha256: "0".repeat(64) }],
      ["kein JSON", { datei: "evaluation/material/a.md", sha256: "0".repeat(64) }],
    ] as const)
      expect(plan(mit(s)), name).toBe(false);
  });

  it("LS-2026-W43-15: Pläne mit festem S1-Gegenstand verweisen auf eine vorhandene Datei mit passender Prüfsumme", () => {
    const mitFest = jsonIn("evaluation/plaene")
      .map((n) => lies(`evaluation/plaene/${n}`))
      .filter((p) => p.s1_fest);
    expect(mitFest.map((p) => p.id)).toContain("s2-isoliert-ilka");
    for (const p of mitFest) {
      expect(existsSync(repoPfad(p.s1_fest.datei)), p.s1_fest.datei).toBe(true);
      expect(createHash("sha256").update(readFileSync(repoPfad(p.s1_fest.datei))).digest("hex"), `${p.id}: Prüfsumme`).toBe(p.s1_fest.sha256);
    }
  });

  it("LS-2026-W43-18: Korrekturen nach Art, Bearbeitungsdauer und Grad der Verblindung sind optional", () => {
    const { bewertung: pruefen } = pruefer();
    const voll = {
      ...bewertung(),
      verblindung: "teilweise",
      korrekturen: [{ art: "zahlen", beschreibung: "75 statt 79 Leichtverletzte", feld: "sachverhalte[0].analyse", schwere: "erheblich" }],
      bearbeitungsdauer_min: 25,
      verbleibende_unsicherheiten: ["Fortgeltung der Personenzahlen zu t0"],
    };
    expect(pruefen(voll), JSON.stringify(pruefen.errors)).toBe(true);
    expect(pruefen(bewertung()), "ohne die neuen Felder").toBe(true);
    const falsch: [string, (b: any) => void][] = [
      ["Art unbekannt", (b) => (b.korrekturen[0].art = "stil")],
      ["Beschreibung leer", (b) => (b.korrekturen[0].beschreibung = "")],
      ["Dauer negativ", (b) => (b.bearbeitungsdauer_min = -1)],
      ["Verblindung unbekannt", (b) => (b.verblindung = "halb")],
      ["nicht blind, aber als blind ausgewiesen", (b) => ((b.blind = false), (b.verblindung = "blind"))],
    ];
    for (const [name, aendern] of falsch) {
      const b = structuredClone(voll);
      aendern(b);
      expect(pruefen(b), name).toBe(false);
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
