// Prüffall Reparatur (S3) mit der Musterfassung Ilka (seit 0.5.13, AV-2026-W43-25). Keine echten KI-Aufrufe: Die
// Reparatur antwortet als Attrappe. Sollwerte fest: Defektstellen und Originalwerte aus der Musterfassung im Repository.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { leseOrdner, profilPflicht, repoPfad } from "../support/dateien";
import { llmAntwort, skriptAnbieter } from "../support/anbieter";
import { ilkaMeldung } from "../support/fixtures";
import { pipelineKontext, s1Vorschlag } from "../support/pipeline";
import { stufe2und3 } from "../../src/pipeline/stufen";
import type { LlmAnbieter, LlmAnfrage } from "../../src/anbieter/typen";
import { STANDARD, type Einstellungen } from "../../src/pipeline/einstellungen";
import {
  beschaedigt,
  DEFEKTE,
  durchgaengeBegrenzt,
  einstellungenFuerReparatur,
  ENTWURF_MODELL,
  inhaltVergleichen,
  musterfassung,
  PLAN_REPARATUR,
  reparaturDateiname,
  reparaturReihe,
  reparaturZeilen,
  reparaturZip,
  schaetzePrueffall,
  schaetzeReparatur,
  stellenWieOriginal,
  wertAn,
} from "../../src/pipeline/reparaturtest";
import type { FallDaten } from "../../src/pipeline/vergleichslauf";

const MUSTER_TEXT = readFileSync(repoPfad("evaluation/material/ilka-musterfassung.json"), "utf-8");
const MUSTER = JSON.parse(MUSTER_TEXT);

async function daten(): Promise<FallDaten> {
  return { profil: await profilPflicht("lead-beispiel"), dateien: leseOrdner(repoPfad("profile", "lead-beispiel")) };
}

/** Reparatur als Attrappe: liefert den übergebenen Text (Vorgabe: die unbeschädigte Musterfassung) */
function reparatur(antwort: (a: LlmAnfrage) => string = () => `\`\`\`json\n${MUSTER_TEXT}\n\`\`\``): LlmAnbieter & { anfragen: LlmAnfrage[] } {
  const anfragen: LlmAnfrage[] = [];
  return {
    id: "attrappe",
    anfragen,
    async senden(a) {
      anfragen.push(a);
      return llmAntwort(antwort(a), {
        modell: a.modell,
        kostenUsd: 0.1,
        dauerMs: 2000,
        nutzung: { eingabe: 20000, ausgabe: 9000, cacheLesen: 0, cacheSchreiben: 0, websuchen: 0, abrufe: 0 },
      });
    },
  };
}

const E: Einstellungen = { ...STANDARD, modelle: { ...STANDARD.modelle, reparatur: "claude-sonnet-5-5" }, aufwand: { ...STANDARD.aufwand, reparatur: "low" } };

describe("AV-2026-W43-25: Prüffall Reparatur", () => {
  it("fünf Defekte an festen Stellen der Musterfassung; die Musterfassung bleibt unverändert", () => {
    expect(DEFEKTE.map((d) => d.id)).toEqual(["R1-radar-skala", "R2-beurteilung", "R3-ereignisart", "R4-typ", "R5-mehrere"]);
    // Soll aus der Datei: zwei Sachverhalte, Sturmfolgen und Stromausfall
    expect(MUSTER.sachverhalte).toHaveLength(2);
    const r1 = beschaedigt(DEFEKTE[0]) as any;
    expect(r1.sachverhalte[1].sofort.lagenradar.d2).toBe(7);
    expect((beschaedigt(DEFEKTE[3]) as any).sachverhalte[0].sofort.lagenradar.d4).toBe(String(MUSTER.sachverhalte[0].sofort.lagenradar.d4));
    expect(musterfassung()).toEqual(MUSTER);
    expect(wertAn(MUSTER, "sachverhalte[1].sofort.lagenradar.d2")).toBe(MUSTER.sachverhalte[1].sofort.lagenradar.d2);
  });

  it("Inhaltsvergleich ohne die beschädigten Stellen", () => {
    const soll = musterfassung();
    expect(inhaltVergleichen(soll, soll, []).abweichungen).toEqual([]);
    const ist = structuredClone(soll) as any;
    ist.sachverhalte[1].sofort.lagenradar.d2 = 3;
    ist.sachverhalte[0].bezeichnung = "Anders";
    const v = inhaltVergleichen(ist, soll, ["sachverhalte[1].sofort.lagenradar.d2"]);
    expect(v.abweichungen).toEqual(["sachverhalte[0].bezeichnung"]);
    expect(v.gleich).toBe(v.geprueft - 1);
    expect(inhaltVergleichen(undefined, soll, []).gleich).toBe(0);
  });

  it("jeder Defekt löst genau eine Reparatur aus; S2 und S1 rufen keinen Anbieter auf; Inhalte voll erhalten", async () => {
    const att = reparatur();
    const { reihe, laeufe } = await reparaturReihe({ daten: await daten(), anbieter: att, einstellungen: E });
    // Soll: unbeschädigter Durchlauf ohne Reparatur, dann fünf Fälle mit je einer Reparatur
    expect(reihe.basis).toEqual({ schemakonform: true, reparaturen: 0 });
    expect(att.anfragen).toHaveLength(5);
    expect(att.anfragen.every((a) => a.modell === "claude-sonnet-5-5" && a.aufwand === "low")).toBe(true);
    expect(att.anfragen.some((a) => a.modell === ENTWURF_MODELL)).toBe(false);
    for (const f of reihe.faelle) {
      expect(f.befunde_vorher.length, f.defekt).toBeGreaterThan(0);
      expect(f.reparaturen, f.defekt).toBe(1);
      expect(f.schemakonform, f.defekt).toBe(true);
      expect(f.anteil_erhalten, f.defekt).toBe(1);
    }
    // R1: Originalwert aus der Datei wieder hergestellt
    const r1 = reihe.faelle[0].stellen[0];
    expect(r1).toEqual({
      pfad: "sachverhalte[1].sofort.lagenradar.d2",
      original: MUSTER.sachverhalte[1].sofort.lagenradar.d2,
      praepariert: 7,
      repariert: MUSTER.sachverhalte[1].sofort.lagenradar.d2,
    });
    expect(reihe.summe).toMatchObject({ faelle: 5, schemakonform: 5, reparaturen: 5, anteil_erhalten_mittel: 1, stellen_wie_original: 5, kosten_usd: 0.5 });
    expect(reihe.faelle.every((f) => f.stellen_wie_original === true)).toBe(true);
    expect(reihe.reparatur).toEqual({ modell: "claude-sonnet-5-5", aufwand: "low", anbieter: "anthropic" });
    expect(reihe.entwurf.sha256).toBe(createHash("sha256").update(MUSTER_TEXT).digest("hex"));
    expect(laeufe).toHaveLength(6);
    // Laufprotokoll: S2 als präparierter Entwurf ohne Kosten, S3 mit Kosten
    expect(laeufe[1].lauf.stufen.map((s) => [s.stufe, s.modell])).toEqual([
      ["S2 Verdichtung", ENTWURF_MODELL],
      ["S3 Reparatur 1", "claude-sonnet-5-5"],
    ]);
  });

  it("misst eine Reparatur, die Inhalte verändert oder scheitert", async () => {
    // Reparatur ändert eine Bezeichnung (Inhalt nicht erhalten) bzw. liefert weiter den Defekt (nicht schemakonform)
    const att = reparatur((a) => {
      const entwurf = JSON.parse(String(a.nachrichten[0].content).split("```json\n")[1].split("\n```")[0]);
      if (entwurf.sachverhalte[1].sofort.beurteilung === "hoch") return `\`\`\`json\n${JSON.stringify(entwurf)}\n\`\`\``;
      const m = JSON.parse(MUSTER_TEXT);
      m.sachverhalte[0].bezeichnung = "Geändert";
      return `\`\`\`json\n${JSON.stringify(m)}\n\`\`\``;
    });
    const { reihe } = await reparaturReihe({ daten: await daten(), anbieter: att, einstellungen: E, defekte: [DEFEKTE[0], DEFEKTE[1]] });
    const [r1, r2] = reihe.faelle;
    expect(r1).toMatchObject({ schemakonform: true, reparaturen: 1, abweichungen: ["sachverhalte[0].bezeichnung"] });
    expect(r1.anteil_erhalten).toBeLessThan(1);
    // R2 bleibt fehlerhaft: zwei Reparaturen (Höchstzahl), danach nicht schemakonform
    expect(r2).toMatchObject({ schemakonform: false, reparaturen: 2 });
    expect(r2.stellen[0]).toMatchObject({ praepariert: "hoch", repariert: "hoch" });
    // AV-2026-W43-35: R1 hat den Originalwert wieder, R2 nicht
    expect([r1.stellen_wie_original, r2.stellen_wie_original]).toEqual([true, false]);
    expect(reihe.summe.stellen_wie_original).toBe(1);
  });

  it("AV-2026-W43-35: „Stellen wie Original“ verlangt an jeder Stelle den Originalwert; Skalenrand und leerer Wert zählen nicht", () => {
    expect(stellenWieOriginal([{ original: 4, repariert: 4 }])).toBe(true);
    expect(
      stellenWieOriginal([
        { original: ["Unwetter / Sturm"], repariert: ["Unwetter / Sturm"] },
        { original: "erheblich", repariert: "erheblich" },
      ]),
    ).toBe(true);
    expect(stellenWieOriginal([{ original: 4, repariert: 6 }])).toBe(false);
    expect(stellenWieOriginal([{ original: "erheblich", repariert: "" }])).toBe(false);
    expect(stellenWieOriginal([{ original: [], repariert: [] }])).toBe(false);
    expect(
      stellenWieOriginal([
        { original: 4, repariert: 4 },
        { original: "erheblich", repariert: null },
      ]),
    ).toBe(false);
    expect(stellenWieOriginal([])).toBe(false);
  });

  it("Übersicht, Dateiname und ZIP", async () => {
    const { reihe, laeufe } = await reparaturReihe({ daten: await daten(), anbieter: reparatur(), einstellungen: E, defekte: [DEFEKTE[2]], wiederholungen: 2 });
    expect(reihe.faelle.map((f) => [f.defekt, f.wiederholung])).toEqual([
      ["R3-ereignisart", 1],
      ["R3-ereignisart", 2],
    ]);
    expect(reparaturZeilen(reihe)).toHaveLength(3);
    expect(reparaturZeilen(reihe)[0]).toContain("stellen_wie_original");
    expect(reparaturZeilen(reihe)[1][reparaturZeilen(reihe)[0].indexOf("stellen_wie_original")]).toBe("ja");
    expect(reparaturDateiname(reihe)).toMatch(/^KI-LEAD_Testlauf_Ilka_S3-Reparatur_claude-sonnet-5-5-low_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await reparaturZip(reihe, laeufe));
    const namen = Object.keys(zip.files);
    expect(namen).toContain("reihe.json");
    expect(namen).toContain("uebersicht.csv");
    expect(namen).toContain("LIESMICH.txt");
    expect(namen.filter((n) => /^laeufe\/.+\.lauf\.json$/.test(n))).toHaveLength(3);
    expect(JSON.parse(await zip.file("reihe.json")!.async("string")).format).toBe("ki-lead-reparaturtest/1");
    expect(await zip.file("LIESMICH.txt")!.async("string")).toContain("beschädigte Stellen wie im Original: 2");
  });

  it("Plan reparatur-ilka: Varianten setzen nur Modell und Aufwand der Reparatur; Schätzung nach Listenpreisen", () => {
    const plan = JSON.parse(readFileSync(repoPfad("evaluation/plaene/reparatur-ilka.json"), "utf-8"));
    expect(PLAN_REPARATUR.varianten.map((v) => v.kennung)).toEqual(plan.varianten.map((v: any) => v.kennung));
    expect(PLAN_REPARATUR.wiederholungen).toBe(2);
    // Prüfsummen im Plan passen zu den Dateien, die der Prüffall nutzt
    expect(plan.meldung_fest.sha256).toBe(createHash("sha256").update(MUSTER_TEXT).digest("hex"));
    const e = einstellungenFuerReparatur(STANDARD, PLAN_REPARATUR.varianten[1]);
    expect(e.modelle).toEqual({ ...STANDARD.modelle, reparatur: "claude-haiku-5-5" });
    expect(e.aufwand).toEqual({ ...STANDARD.aufwand, reparatur: "low" });
    // Sonnet: 10.000 × 2 + 8.000 × 10 USD je Mio. Token = 0,10 USD; 14.000 × 2 + 16.000 × 10 = 0,188 USD
    const [von, bis] = schaetzeReparatur("claude-sonnet-5-5")!;
    expect(von).toBeCloseTo(0.1, 6);
    expect(bis).toBeCloseTo(0.188, 6);
    // zwei Durchgänge: 10 Fälle mit einer (unten) bis zwei Reparaturen (oben)
    const [pv, pb] = schaetzePrueffall("claude-sonnet-5-5", 2)!;
    expect(pv).toBeCloseTo(1.0, 6);
    expect(pb).toBeCloseTo(3.76, 6);
    // Mistral am EU-Endpunkt mit 10 % Aufschlag
    expect(schaetzeReparatur("mistral-small-2603", { mistralEndpunkt: "eu" })![0]).toBeCloseTo(
      schaetzeReparatur("mistral-small-2603", { mistralEndpunkt: "global" })![0] * 1.1,
      9,
    );
    expect(schaetzeReparatur("unbekannt")).toBeNull();
    expect([0, 1, 7, 2.4].map(durchgaengeBegrenzt)).toEqual([1, 1, 5, 2]);
  });
});

// Reparaturschleife von S3 in der Pipeline (seit 0.6.2, TP-2026-W44-01): Entwurf und Schemabefunde bleiben ein Paar.
describe("TP-2026-W44-01: Reparatur ohne JSON verliert den Entwurf nicht", () => {
  it("fällt auf den Entwurf der vorigen Runde mit dessen Schemabefunden zurück und vermerkt die gescheiterte Reparatur", async () => {
    const kaputt = ilkaMeldung("HE");
    kaputt.sachverhalte[0].sofort.beurteilung = "katastrophal";
    const att = skriptAnbieter([
      llmAntwort("Kurz.\n```json\n" + JSON.stringify(kaputt) + "\n```"),
      llmAntwort("Ich kann die Meldung leider nicht korrigieren, weil mir Angaben fehlen."),
      llmAntwort("Entschuldigung, auch dieser Versuch gelingt nicht."),
    ]);
    const { k } = await pipelineKontext(att);
    const e = await stufe2und3(k, s1Vorschlag() as any);
    // Zwei Reparaturversuche, beide ohne JSON
    expect(att.anfragen).toHaveLength(3);
    expect(k.lauf.stufen.map((s) => s.stufe)).toEqual(["S2 Recherche und Entwurf", "S3 Reparatur 1", "S3 Reparatur 2"]);
    // Entwurf aus Runde 1 mit seinen tatsächlichen Schemabefunden, nicht „Kein JSON“
    expect(e.meldung).toBeTruthy();
    expect(e.meldung!.sachverhalte[0].sofort.beurteilung).toBe("katastrophal");
    expect(e.schemaBefunde.length).toBeGreaterThan(0);
    expect(e.schemaBefunde.some((b) => b.pfad.includes("beurteilung"))).toBe(true);
    expect(e.schemaBefunde.some((b) => b.keyword === "json")).toBe(false);
    expect(k.lauf.status).toBe("fertig");
    expect(k.lauf.ergebnis?.schemakonform).toBe(false);
    // Die gescheiterten Reparaturen stehen als Hinweis in den Befunden, nicht als Ersatz der Schemabefunde
    const hinweise = e.befunde.filter((b) => b.code === "REPARATUR_OHNE_ENTWURF");
    expect(hinweise).toHaveLength(2);
    expect(hinweise[0].stufe).toBe("hinweis");
    expect(hinweise[0].text).toMatch(/Reparatur 1 lieferte keinen verwertbaren Entwurf .*keinen JSON-Block.*vorherige Entwurf bleibt/);
    // Das Laufprotokoll der Reparaturrunden nennt den Parserbefund
    expect(k.lauf.stufen[1].befunde).toEqual(["Die Antwort enthält keinen JSON-Block."]);
  });
});
