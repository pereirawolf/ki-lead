// Musterfassung Orkantief „Ilka“ (25.10.2026): feste, konsolidierte Verdichtung als Ausgangsfall für die Management
// Summary und als Bewertungsbeispiel. Geprüft werden Schema, Quellen, Pflichtangaben, Plausibilität der Zahlen,
// Zuschnitt und die Herkunft jeder mehrstelligen Zahl aus den sechs Eingängen. Ruft keine KI auf.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { profil, repoPfad } from "../support/dateien";
import { migriere } from "../../src/kern/migration";
import { pflichtHinweise } from "../../src/kern/kennsaetze";
import { quellenHinweise } from "../../src/kern/quellen";
import { pruefeGegenSchema } from "../../src/kern/validierung";
import { plausibilitaetPruefen } from "../../src/pipeline/plausibilitaet";

const MUSTER = JSON.parse(readFileSync(repoPfad("evaluation/material/ilka-musterfassung.json"), "utf-8"));
const ORDNER = "profile/lead-beispiel/beispiele/orkantief-ilka";
const EINGAENGE = readdirSync(repoPfad(ORDNER))
  .filter((n) => /^LEAD-Meldung_(HE|NI|NW|RP|ST|TH)_.*\.json$/.test(n))
  .map((n) => readFileSync(repoPfad(ORDNER, n), "utf-8"))
  .join("\n");

/**
 * Zahlen der Musterfassung, die nicht wörtlich in den Eingängen stehen, mit ihrer Herleitung aus Eingangswerten.
 * Jede neue abgeleitete Zahl muss hier mit Rechenweg stehen.
 */
const ABGELEITET: Record<string, number> = {
  "20.700": 3500 + 7400 + 9800, // Personen ohne Strom: Vulkaneifel, Hochsauerlandkreis, Sonneberg
  "17.200": 7400 + 9800, // Hochsauerlandkreis und Sonneberg
  "19.800": 1800 + 4600 + 6900 + 900 + 300 + 5300, // Anschlüsse ohne Strom: RP, NI, NW, HE, ST, TH
  "28.500": 20700 + 7800, // mit unterer Grenze der Hochrechnung Goslar
  "30.400": 20700 + 9700, // mit oberer Grenze der Hochrechnung Goslar
  "228": 82 + 146, // Pflegeheimbewohner auf Notstrom: Schmallenberg, Sonneberg
  "79": 41 + 9 + 14 + 7 + 5 + 3, // Leichtverletzte: NW, HE, RP, NI, TH, ST
  "86": 1 + 6 + 79, // Personenschäden insgesamt
  "100.000": 100000, // Untergrenze D2 Stufe 5 (Kodierleitfaden)
};
const wert = (z: string) => Number(z.replace(/\./g, ""));

describe("Musterfassung Orkantief „Ilka“", () => {
  it("ist schemakonform, ohne Quellenwarnung und mit allen Pflichtangaben", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const mig = migriere(structuredClone(MUSTER), p!);
    expect(mig.bekannt).toBe(true);
    expect(pruefeGegenSchema(p!.schema, mig.daten, p!.ui)).toEqual([]);
    expect(quellenHinweise(mig.daten, p!.ui).filter((b) => b.stufe === "warnung")).toEqual([]);
    expect(pflichtHinweise(mig.daten, p!.ui)).toEqual([]);
  });

  it("t0 und Zuschnitt wie der feste S1-Gegenstand: zwei Sachverhalte, Stromausfall als Sachverhalt 2", () => {
    const s1 = JSON.parse(readFileSync(repoPfad("evaluation/material/ilka-s1-zuschnitt-a.json"), "utf-8"));
    expect(MUSTER.meldezeitpunkt).toBe(s1.meldezeitpunkt);
    expect(MUSTER.sachverhalte).toHaveLength(s1.sachverhalte.length);
    expect(MUSTER.sachverhalte.map((s: any) => s.art)).toEqual(s1.sachverhalte.map((s: any) => s.ereignisarten));
  });

  it("nennt alle sechs Eingänge als A-Quellen und zitiert jede davon", () => {
    for (const land of ["Hessisches", "Niedersächsisches", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Sachsen-Anhalt", "Thüringer"])
      expect(MUSTER.quellen, land).toContain(land);
    const text = JSON.stringify(MUSTER.sachverhalte);
    for (const q of ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]) expect(text, q).toMatch(new RegExp(`\\[${q}[\\],]`));
  });

  it("ohne Befund der Plausibilitätsprüfung (Summen, D2)", () => {
    expect(plausibilitaetPruefen(MUSTER)).toEqual([]);
  });

  it("Stromlose nach der Bewertungshilfe: Mindestwert gekennzeichnet, Hochrechnung getrennt, D2 = 4", () => {
    const sv = MUSTER.sachverhalte[1];
    expect(sv.sofort.lagenradar.d2).toBe(4);
    expect(sv.sofort.bewertung_text).toContain("D2 = 4 (Mindestwert): mindestens rund 20.700 Personen");
    expect(sv.analyse.lage_ereignis).toContain("die Hochrechnung Goslar steht getrennt");
  });

  it("jede mehrstellige Zahl steht in den Eingängen oder ist mit Rechenweg hergeleitet", () => {
    for (const [z, soll] of Object.entries(ABGELEITET)) expect(wert(z), z).toBe(soll);
    const text = JSON.stringify(MUSTER.sachverhalte);
    const zahlen = new Set(text.match(/(?<![\d.])\d{1,3}(?:\.\d{3})+(?!\d)|(?<![\d.,])\d{2,}(?![\d.,:])/g) ?? []);
    const fremd = [...zahlen].filter((z) => !EINGAENGE.includes(z) && !(z in ABGELEITET));
    expect(fremd).toEqual([]);
  });
});
