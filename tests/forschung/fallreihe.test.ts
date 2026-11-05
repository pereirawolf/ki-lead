// Fallreihe (seit 0.7.2, TP-2026-W44-62 bis -67): Katalog der mitgelieferten Fälle, Fallpaket mit Prüfsumme, Plan mit
// Vorbelegung, Einstellungen je Variante, Kostenbremse, Lauf mit Attrappe und Inhalt der Ergebnis-ZIP. Ohne KI-Aufrufe.
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { leseOrdner, profil, profilPflicht, repoPfad } from "../support/dateien";
import { llmAntwort, meldungsAntwort } from "../support/anbieter";
import { referenzAjv } from "../support/ajv";
import type { LlmAnbieter, LlmAnfrage } from "../../src/anbieter/typen";
import { STANDARD, STANDARD_PROFILE } from "../../src/pipeline/einstellungen";
import {
  BEISPIELPROFIL_ID,
  fallBefunde,
  fallpaketLesen,
  faelleAusTexten,
  katalogEintrag,
  paketEintraege,
  type Fall,
  type KatalogFall,
} from "../../src/forschung/fallkatalog";
import { einstellungenFuerLauf, matrixVarianten, planAbgleichen, planLesen } from "../../src/forschung/fallplan";
import { bremseGreift, fallreihe, laufplan, obergrenze, radarKennzahlen, VORBEHALT_USD } from "../../src/forschung/fallreihe";
import { bewertungsvorlage, fallreiheZip, UEBERSICHT_KOPF } from "../../src/forschung/fallreihe-export";
import type { Profil } from "../../src/kern/typen";

const lies = (p: string) => readFileSync(repoPfad(p), "utf-8");
const FALL_DATEIEN = readdirSync(repoPfad("evaluation/faelle")).filter((n) => n.endsWith(".json") && n !== "fall.schema.json");
const PROFILE: Record<string, string> = {
  "lead.beispiel.koordinierungsstelle": "lead-beispiel",
  "lead.beispiel.thueringen": "lead-thueringen",
};
const profilBekannt = (id: string) => id in PROFILE;

/** Material wie im Build: Pfad im Repository → Text */
const repoLesen = (p: string) => {
  try {
    return lies(p);
  } catch {
    return undefined;
  }
};

function mitgelieferte(): KatalogFall[] {
  const texte = Object.fromEntries(FALL_DATEIEN.map((n) => [n, lies(`evaluation/faelle/${n}`)]));
  return faelleAusTexten(texte).map((f) => katalogEintrag(f, "mitgeliefert", repoLesen, profilBekannt));
}

const kleinerFall = (id: string, extra: Partial<Fall> = {}): Fall => ({
  format: "ki-lead-evaluationsfall/1",
  id,
  titel: `Kontrollfall ${id} (FIKTIV)`,
  stand: "2026-11-03",
  fiktiv: true,
  auftrag: { sachverhalt: "Fiktive Lage", stichtag: "2026-11-03", meldezeitpunkt: "2026-11-03T12:00", websuche: false },
  material: [{ datei: `evaluation/material/${id}.md`, rolle: "material" }],
  erwartungen: { muss: ["Fiktive Lage erfasst."] },
  ...extra,
});

async function paketZip(dateien: Record<string, string>): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const [p, t] of Object.entries(dateien)) zip.file(p, t);
  return zip.generateAsync({ type: "uint8array" });
}

const sha = (b: Uint8Array | string) => createHash("sha256").update(b).digest("hex");

describe("Fallreihe: Katalog (TP-2026-W44-62, -63)", () => {
  it("TP-2026-W44-63: alle mitgelieferten Fälle sind schemakonform und bis auf Management Summary und Reparatur in der Fallreihe zulässig", () => {
    const k = mitgelieferte();
    expect(k).toHaveLength(FALL_DATEIEN.length);
    for (const e of k) expect(fallBefunde(e.fall), e.fall.id).toEqual([]);
    const unzulaessig = k.filter((e) => !e.zulaessig).map((e) => [e.fall.id, e.grund]);
    expect(unzulaessig).toEqual([
      ["ilka-management-summary", "Management Summary aus fester Meldung: eigene Testart"],
      ["ilka-reparatur", "Prüffall Reparatur: eigene Testart"],
    ]);
    const ilka = k.find((e) => e.fall.id === "orkantief-ilka-verdichtung")!;
    expect([ilka.art, ilka.websuche, ilka.profilId, ilka.gruppe]).toEqual(["verdichtung", false, BEISPIELPROFIL_ID, "Referenzfall Ilka"]);
  });

  it("TP-2026-W44-63: drei Prüfstein-Fälle mit Websuche, t0 und Referenzraum aus der Begleitnotiz, ohne Material und URLs", () => {
    const k = mitgelieferte().filter((e) => e.fall.id.startsWith("pruefstein-"));
    expect(k.map((e) => e.fall.id).sort()).toEqual([
      "pruefstein-ebola-kenia-nigeria",
      "pruefstein-eichstaett-cyberangriff",
      "pruefstein-wiesbaden-abkochgebot",
    ]);
    for (const e of k) {
      const notiz = JSON.parse(lies(`evaluation/pruefsteine/2026-W43_${e.fall.id.slice("pruefstein-".length)}/pruefstein.json`));
      expect([e.zulaessig, e.websuche, e.art, e.gruppe]).toEqual([true, true, "erfassung", "Prüfsteine (reale Lagen, mit Websuche)"]);
      expect(e.fall.material).toEqual([]);
      expect(e.fall.auftrag.urls ?? []).toEqual([]);
      expect(e.fall.fiktiv).toBe(false);
      expect(e.fall.auftrag.meldezeitpunkt).toBe(notiz.lage.t0);
      expect(e.fall.erwartungen.t0).toBe(notiz.lage.t0);
      expect(e.fall.erwartungen.referenzraum).toBe(notiz.lage.referenzraum);
      expect(e.fall.erwartungen.ereignisarten).toEqual(notiz.lage.ereignisarten);
    }
  });

  it("TP-2026-W44-63: Feld „profil“ wählt das Profil; ein unbekanntes Profil, fehlendes oder externes Material sperren den Fall mit Grund", () => {
    const mat = (p: string) => (p === "evaluation/material/k1.md" ? "FIKTIV" : undefined);
    const land = katalogEintrag(kleinerFall("k1", { profil: "lead.beispiel.thueringen" }), "paket", mat, profilBekannt);
    expect([land.profilId, land.zulaessig]).toEqual(["lead.beispiel.thueringen", true]);
    expect(katalogEintrag(kleinerFall("k1", { profil: "lead.unbekannt" }), "paket", mat, profilBekannt).grund).toBe(
      "Profil lead.unbekannt ist in dieser Ausgabe der App nicht enthalten",
    );
    expect(katalogEintrag(kleinerFall("k2"), "paket", mat, profilBekannt).grund).toBe("Material fehlt: evaluation/material/k2.md");
    expect(
      katalogEintrag(kleinerFall("k1", { material: [{ extern: "https://beispiel.invalid", sha256: "0".repeat(64) }] }), "paket", mat, profilBekannt).grund,
    ).toBe("Material nur als Verweis (extern), Inhalt nicht in der App");
  });
});

describe("Fallreihe: Fallpaket (TP-2026-W44-63)", () => {
  it("TP-2026-W44-63: liest Fälle und Material, auch unter einem Oberordner; Prüfsumme der ZIP-Datei; Dubletten und Schemafehler mit Hinweis", async () => {
    const zip = await paketZip({
      "kontrollsatz/faelle/k1.json": JSON.stringify(kleinerFall("k1", { profil: "lead.beispiel.thueringen" })),
      "kontrollsatz/evaluation/material/k1.md": "FIKTIVES ÜBUNGSMATERIAL – keine reale Lage",
      "kontrollsatz/faelle/k2.json": JSON.stringify({ ...kleinerFall("k2"), erwartungen: { muss: [] } }),
      "kontrollsatz/evaluation/material/k2.md": "FIKTIV",
      "kontrollsatz/faelle/doppelt.json": JSON.stringify(kleinerFall("sop-gas-stabil")),
      "kontrollsatz/LIESMICH.md": "Kein Fall",
    });
    const p = await fallpaketLesen(zip, "kontrollsatz.zip", new Set(["sop-gas-stabil"]), new Date("2026-11-03T10:00:00Z"));
    expect(p.sha256).toBe(sha(zip));
    expect(p.faelle.map((f) => f.id)).toEqual(["k1", "k2"]);
    expect(p.befunde).toEqual(["kontrollsatz/faelle/doppelt.json: Fall sop-gas-stabil gibt es schon unter den mitgelieferten Fällen; übergangen."]);
    const k = paketEintraege(p, profilBekannt);
    expect(k.map((e) => [e.fall.id, e.zulaessig, e.paket, e.gruppe])).toEqual([
      ["k1", true, sha(zip), "Fallpaket"],
      ["k2", false, sha(zip), "Fallpaket"],
    ]);
    expect(k[1]!.grund).toMatch(/^nicht schemakonform: /);
    expect(new TextDecoder().decode(k[0]!.lesen("evaluation/material/k1.md") as Uint8Array)).toBe("FIKTIVES ÜBUNGSMATERIAL – keine reale Lage");
  });

  it("TP-2026-W44-63: ein Paket ohne Fall meldet das; eine beschädigte Datei wirft mit Namen", async () => {
    const leer = await fallpaketLesen(await paketZip({ "x.md": "nichts" }), "leer.zip", new Set());
    expect(leer.faelle).toEqual([]);
    expect(leer.befunde).toEqual(["Das Paket enthält keinen Fall im Format ki-lead-evaluationsfall/1."]);
    await expect(fallpaketLesen(new TextEncoder().encode("kein zip"), "kaputt.zip", new Set())).rejects.toThrow("kaputt.zip: keine lesbare ZIP-Datei.");
  });
});

const PLAN = {
  format: "ki-lead-bewertungsplan/1",
  id: "kontrolllauf-b4",
  stand: "2026-11-03",
  fragestellung: "Kontrolllauf B4",
  faelle: ["k1", "orkantief-ilka-verdichtung"],
  varianten: [
    { kennung: "anthropic", ki_profil: "anthropic" },
    { kennung: "mistral-eu", ki_profil: "mistral", mistral_endpunkt: "eu" },
  ],
  wiederholungen: 1,
  budget_usd: 100,
  recherche: "sparsam",
  fallpaket: { name: "kontrollsatz.zip", sha256: "" },
};

describe("Fallreihe: Plan (TP-2026-W44-64)", () => {
  it("TP-2026-W44-64: Plan belegt Fälle, Varianten, Wiederholungen, Recherche und Deckel vor; Prüfsumme der Plandatei", async () => {
    const zip = await paketZip({ "faelle/k1.json": JSON.stringify(kleinerFall("k1")), "evaluation/material/k1.md": "FIKTIV" });
    const paket = await fallpaketLesen(zip, "kontrollsatz.zip", new Set());
    const text = JSON.stringify({ ...PLAN, fallpaket: { name: "kontrollsatz.zip", sha256: paket.sha256 } });
    const g = await planLesen(text, "b4.json");
    expect(g.sha256).toBe(sha(text));
    const a = planAbgleichen(g, [...paketEintraege(paket, profilBekannt), ...mitgelieferte()]);
    expect(a.sperren).toEqual([]);
    expect(a.auswahl).toEqual({
      faelle: ["k1", "orkantief-ilka-verdichtung"],
      varianten: [
        { kennung: "anthropic", ki_profil: "anthropic" },
        { kennung: "mistral-eu", ki_profil: "mistral", mistral_endpunkt: "eu" },
      ],
      wiederholungen: 1,
      budgetUsd: 100,
      recherche: "sparsam",
    });
  });

  it("TP-2026-W44-64: ohne Paket fehlen dessen Fälle; ein Paket mit anderer Prüfsumme sperrt den Start", async () => {
    const g = await planLesen(JSON.stringify({ ...PLAN, fallpaket: { sha256: "a".repeat(64) } }), "b4.json");
    expect(planAbgleichen(g, mitgelieferte()).sperren).toEqual([`Fälle fehlen: k1 (Fallpaket  mit SHA-256 ${"a".repeat(12)}… importieren)`]);
    const paket = await fallpaketLesen(
      await paketZip({ "k1.json": JSON.stringify(kleinerFall("k1")), "evaluation/material/k1.md": "x" }),
      "anders.zip",
      new Set(),
    );
    expect(planAbgleichen(g, [...paketEintraege(paket, profilBekannt), ...mitgelieferte()]).sperren).toEqual([
      "Fallpaket weicht von der Prüfsumme des Plans ab: k1",
    ]);
  });

  it("TP-2026-W44-64: lehnt Nicht-Pläne, Schemafehler, feste Meldungen und Varianten ohne Modell ab", async () => {
    await expect(planLesen("{", "x.json")).rejects.toThrow("x.json: kein gültiges JSON.");
    await expect(planLesen(JSON.stringify({ format: "ki-lead-sop-abdeckung/1" }), "x.json")).rejects.toThrow("kein Bewertungsplan");
    await expect(planLesen(JSON.stringify({ ...PLAN, recherche: "maximal", fallpaket: undefined }), "x.json")).rejects.toThrow(
      "entspricht nicht plan.schema.json",
    );
    const plan = (x: object) => JSON.stringify({ ...PLAN, fallpaket: { sha256: "0".repeat(64) }, ...x });
    await expect(planLesen(plan({ s1_fest: { datei: "evaluation/material/ilka-s1-zuschnitt-a.json", sha256: "0".repeat(64) } }), "x.json")).rejects.toThrow(
      "festem S1-Gegenstand",
    );
    await expect(planLesen(plan({ varianten: [{ kennung: "leer" }] }), "x.json")).rejects.toThrow("Variante leer nennt weder ein KI-Profil noch Modelle");
    await expect(planLesen(plan({ varianten: [PLAN.varianten[0], PLAN.varianten[0]] }), "x.json")).rejects.toThrow("Variante anthropic steht mehrfach");
  });

  it("TP-2026-W44-64: alle eingecheckten Bewertungspläne lassen sich laden", async () => {
    const plaene = readdirSync(repoPfad("evaluation/plaene")).filter((n) => n.endsWith(".json") && n !== "plan.schema.json");
    for (const n of plaene) {
      const text = lies(`evaluation/plaene/${n}`);
      if (JSON.parse(text).format !== "ki-lead-bewertungsplan/1") continue;
      if (JSON.parse(text).meldung_fest || JSON.parse(text).s1_fest || n === "reparatur-ilka.json") continue;
      const g = await planLesen(text, n).catch((e: Error) => e);
      // Pläne am Fall Ilka nennen S2 oder S1; Material-Varianten sind der Fallreihe fremd
      if (g instanceof Error) expect(g.message, n).toMatch(/Material, Management Summary oder Reparatur|weder ein KI-Profil/);
    }
    const beispiel = await planLesen(lies("evaluation/plaene/beispiel-fallreihe.json"), "beispiel-fallreihe.json");
    expect(planAbgleichen(beispiel, mitgelieferte()).sperren).toEqual([]);
  });

  it("TP-2026-W44-64: Einstellungen je Variante: Standardprofil, Endpunkt, Recherche; S1/S2 der Variante gehen vor", () => {
    const e = einstellungenFuerLauf(STANDARD, { kennung: "m", ki_profil: "mistral", mistral_endpunkt: "global" }, "sparsam");
    expect(e.modelle).toEqual(STANDARD_PROFILE.mistral.modelle);
    expect(e.aufwand).toEqual(STANDARD_PROFILE.mistral.aufwand);
    expect(e.anbieterOptionen.mistral.endpunkt).toBe("global");
    expect([e.websucheMax, e.abrufMax, e.abrufMaxTokens]).toEqual([5, 3, 8000]);
    const x = einstellungenFuerLauf(STANDARD, { kennung: "x", ki_profil: "openai", s2: { modell: "claude-opus-5-5", aufwand: "high" } });
    expect([x.modelle.vorverarbeitung, x.modelle.erfassung, x.modelle.verdichtung, x.aufwand.erfassung]).toEqual([
      "gpt-6-luna",
      "claude-opus-5-5",
      "claude-opus-5-5",
      "high",
    ]);
    expect([x.websucheMax, x.anbieterOptionen.mistral.endpunkt]).toEqual([STANDARD.websucheMax, STANDARD.anbieterOptionen.mistral.endpunkt]);
    expect(matrixVarianten(["mistral", "anthropic"], "eu").map((v) => v.kennung)).toEqual(["anthropic", "mistral-eu"]);
  });
});

describe("Fallreihe: Ablauf und Kostenbremse (TP-2026-W44-65)", () => {
  it("TP-2026-W44-65: Reihenfolge je Fall alle Varianten; Obergrenze aus Schätzung oder teuerstem Lauf, sonst Vorbehalt", () => {
    const k = mitgelieferte().filter((e) => ["sop-gas-stabil", "sop-sturm-nachlauf"].includes(e.fall.id));
    const plan = laufplan(k, matrixVarianten(["anthropic", "openai"], "eu"), 2);
    expect(plan.map((g) => `${g.nr} ${g.fall.fall.id} ${g.wiederholung} ${g.variante.kennung}`)).toEqual([
      "1 sop-gas-stabil 1 anthropic",
      "2 sop-gas-stabil 1 openai",
      "3 sop-gas-stabil 2 anthropic",
      "4 sop-gas-stabil 2 openai",
      "5 sop-sturm-nachlauf 1 anthropic",
      "6 sop-sturm-nachlauf 1 openai",
      "7 sop-sturm-nachlauf 2 anthropic",
      "8 sop-sturm-nachlauf 2 openai",
    ]);
    expect(obergrenze([1, 2], undefined)).toBe(2);
    expect(obergrenze([1, 2], 3.5)).toBe(3.5);
    expect(obergrenze(null, undefined)).toBe(VORBEHALT_USD);
    expect(bremseGreift(98, 2, 100)).toBe(false);
    expect(bremseGreift(98, 2.01, 100)).toBe(true);
    expect(bremseGreift(1e6, 1, undefined)).toBe(false);
  });
});

/** S1 mit Schema liefert einen Sachverhalt, S2 die Redaktionsfassung Ilka; feste Kosten je Aufruf */
function attrappe(meldung: unknown, kostenJeAufruf = 0.01): LlmAnbieter & { anfragen: LlmAnfrage[] } {
  const anfragen: LlmAnfrage[] = [];
  return {
    id: "attrappe",
    anfragen,
    async senden(a) {
      anfragen.push(a);
      if (a.signal?.aborted) throw Object.assign(new Error("abgebrochen"), { name: "AbortError" });
      if (a.jsonSchema)
        return llmAntwort(
          JSON.stringify({
            gegenstand: "Fiktive Lage",
            stichtag: "2026-10-21",
            meldezeitpunkt: "2026-10-21T12:00",
            referenzbezug: "Bund",
            horizont: "bis 28.10.2026",
            sachverhalte: [{ titel: "Lage", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Material" }],
            prueffrage: "",
            hinweise: "",
          }),
          { modell: a.modell, kostenUsd: kostenJeAufruf },
        );
      return meldungsAntwort(meldung, "Kurz.", { modell: a.modell, kostenUsd: kostenJeAufruf });
    },
  };
}

describe("Fallreihe: Lauf und Ergebnis-ZIP (TP-2026-W44-62, -65, -66)", () => {
  const ILKA = "beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
  const profilFuer = async (id: string): Promise<Profil> => profilPflicht(PROFILE[id]);

  it("TP-2026-W44-62: Auftrag und Material wie im Fall, Rollen gesetzt, Modelle der Variante; automatische Prüfungen je Lauf", async () => {
    const referenz = JSON.parse(leseOrdner(repoPfad("profile", "lead-beispiel"))[ILKA]!);
    const k = mitgelieferte().filter((e) => ["sop-gas-stabil", "orkantief-ilka-verdichtung"].includes(e.fall.id));
    const anbieter = attrappe(referenz);
    const { reihe, ergebnisse } = await fallreihe({
      geplant: laufplan(k, matrixVarianten(["mistral"], "eu"), 1),
      einstellungen: { ...STANDARD, nachforderung: false },
      profilFuer,
      anbieterFuer: () => anbieter,
      jetzt: () => new Date("2026-11-03T10:00:00Z"),
    });
    expect(ergebnisse.map((e) => [e.fall, e.variante, e.lauf.status])).toEqual([
      ["orkantief-ilka-verdichtung", "mistral-eu", "fertig"],
      ["sop-gas-stabil", "mistral-eu", "fertig"],
    ]);
    const [ilka, gas] = ergebnisse;
    const fallGas = JSON.parse(lies("evaluation/faelle/sop-gas-stabil.json"));
    expect(gas!.lauf.auftrag).toEqual({
      sachverhalt: fallGas.auftrag.sachverhalt,
      stichworte: fallGas.auftrag.stichworte,
      urls: [],
      stichtag: fallGas.auftrag.stichtag,
      prueffrage: fallGas.auftrag.prueffrage,
      websuche: false,
      meldezeitpunkt: fallGas.auftrag.meldezeitpunkt,
    });
    expect(gas!.lauf.material.map((m) => m.name)).toEqual(fallGas.material.map((m: { datei: string }) => m.datei.split("/").pop()));
    expect(ilka!.lauf.material.map((m) => m.art)).toEqual(Array(6).fill("eingang"));
    expect(ilka!.lauf.stufen.map((s) => s.stufe)).toContain("S2 Verdichtung");
    expect(gas!.lauf.stufen.map((s) => s.stufe)).toContain("S2 Recherche und Entwurf");
    expect(gas!.modelle).toEqual({
      s1: { modell: "mistral-small-2603", aufwand: STANDARD_PROFILE.mistral.aufwand.vorverarbeitung, anbieter: "mistral" },
      s2: { modell: "mistral-medium-3-5", aufwand: STANDARD_PROFILE.mistral.aufwand.erfassung, anbieter: "mistral" },
    });
    expect(gas!.mistral_endpunkt).toBe("eu");
    // Sollwerte aus dem Entwurf selbst (nach Nachbearbeitung): Sachverhalte, Tendenz als Text, Quellenzeilen „[Qn]“
    const m = gas!.meldung as any;
    const sv = m.sachverhalte as any[];
    const quellenSoll = String(m.quellen)
      .split("\n")
      .filter((z) => /^\s*\[Q\d+\]/.test(z)).length;
    expect(quellenSoll).toBeGreaterThan(0);
    expect(gas!.pruefungen).toMatchObject({
      status: "fertig",
      schemakonform: true,
      sachverhalte: sv.length,
      tendenz_gesetzt: sv.filter((s) => String(s.sofort?.tendenz ?? "").trim()).length / sv.length,
      quellen: quellenSoll,
      websuchen: 0,
    });
    // AV-2026-W45-08: Anteil offener Radarachsen, von Hand aus dem Entwurf gezählt; Prüfmuster mit Wortlaut je Treffer
    const achsen = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"];
    const offenSoll = sv.reduce((n, s) => n + achsen.filter((a) => !Number.isInteger(s.sofort?.lagenradar?.[a])).length, 0) / (sv.length * 8);
    expect(gas!.pruefungen.radar_offen).toBeCloseTo(offenSoll, 3);
    expect(gas!.pruefungen.radar_pruefmuster).toBe(gas!.pruefungen.radar_hinweise!.length);
    for (const h of gas!.pruefungen.radar_hinweise!) expect(h).toMatch(/^Sachverhalt \d+: D[35] = \d/);
    expect(gas!.pruefungen.fristen_vor_t0).toEqual(expect.any(Number));
    expect(reihe).toMatchObject({ format: "ki-lead-fallreihe/1", laeufe_geplant: 2, plan: null, recherche: null, budget_usd: null });
    expect(reihe.faelle.map((f) => [f.id, f.profil, f.art])).toEqual([
      ["orkantief-ilka-verdichtung", BEISPIELPROFIL_ID, "verdichtung"],
      ["sop-gas-stabil", BEISPIELPROFIL_ID, "erfassung"],
    ]);
    expect(reihe.kosten_usd_summe).toBeCloseTo(
      ergebnisse.reduce((s, e) => s + (e.pruefungen.kosten_usd ?? 0), 0),
      6,
    );

    const zip = await JSZip.loadAsync(await fallreiheZip(reihe, ergebnisse, k));
    const namen = Object.keys(zip.files)
      .filter((n) => !zip.files[n]!.dir)
      .sort();
    expect(namen).toEqual(
      [
        "LIESMICH.txt",
        "fallreihe.json",
        "uebersicht.csv",
        "laeufe/E001_orkantief-ilka-verdichtung_mistral-eu.lauf.json",
        "laeufe/E002_sop-gas-stabil_mistral-eu.lauf.json",
        "entwuerfe/E001_orkantief-ilka-verdichtung_mistral-eu.meldung.json",
        "entwuerfe/E002_sop-gas-stabil_mistral-eu.meldung.json",
        "bewertungen/E001.bewertung.json",
        "bewertungen/E001.pruefliste.md",
        "bewertungen/E002.bewertung.json",
        "bewertungen/E002.pruefliste.md",
      ].sort(),
    );
    const csv = (await zip.file("uebersicht.csv")!.async("string")).replace(/^﻿/, "").split("\r\n");
    expect(csv[0]).toBe(UEBERSICHT_KOPF.join(";"));
    expect(csv).toHaveLength(4);
    const pruefliste = await zip.file("bewertungen/E002.pruefliste.md")!.async("string");
    for (const m of fallGas.erwartungen.muss) expect(pruefliste).toContain(`- [ ] ${m}`);
    for (const m of fallGas.erwartungen.darf_nicht) expect(pruefliste).toContain(`- [ ] ${m}`);
  });

  it("TP-2026-W44-66: Bewertungsvorlage ist nach dem Ausfüllen schemakonform (bewertungsschema.json), vorher nicht", async () => {
    const ajv = referenzAjv();
    ajv.addFormat("date", /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
    const pruefe = ajv.compile(JSON.parse(lies("evaluation/bewertungsschema.json")));
    const referenz = JSON.parse(leseOrdner(repoPfad("profile", "lead-beispiel"))[ILKA]!);
    const k = mitgelieferte().filter((e) => e.fall.id === "sop-gas-stabil");
    const { reihe, ergebnisse } = await fallreihe({
      geplant: laufplan(k, matrixVarianten(["anthropic"], "eu"), 1),
      einstellungen: { ...STANDARD, nachforderung: false },
      profilFuer,
      anbieterFuer: () => attrappe(referenz),
    });
    const v = bewertungsvorlage(ergebnisse[0]!, reihe) as any;
    expect(pruefe(v)).toBe(false);
    const k1 = { note: 3, begruendung: "nachvollziehbar" };
    v.bewertet_am = "2026-11-04";
    v.bewertet_von = "Hrsg.";
    v.kriterien = Object.fromEntries(Object.keys(v.kriterien).map((x) => [x, k1]));
    v.gesamt = k1;
    expect(pruefe(v), JSON.stringify(pruefe.errors)).toBe(true);
    expect([v.blind, v.verblindung, v.fall, v.kennung]).toEqual([false, "offen", "sop-gas-stabil", "E001"]);
  });

  it("TP-2026-W44-65: Kostenbremse hält vor dem Lauf, der den Deckel überschreiten würde; Abbruch endet mit den bisherigen Läufen", async () => {
    const referenz = JSON.parse(leseOrdner(repoPfad("profile", "lead-beispiel"))[ILKA]!);
    const k = mitgelieferte().filter((e) => ["sop-gas-stabil", "sop-sturm-nachlauf"].includes(e.fall.id));
    // 10 USD je Aufruf, zwei Aufrufe je Lauf: 20 USD; Deckel 30 → der zweite Lauf (bis 20 USD) würde ihn überschreiten
    const { reihe, ergebnisse } = await fallreihe({
      geplant: laufplan(k, matrixVarianten(["anthropic"], "eu"), 1),
      einstellungen: { ...STANDARD, nachforderung: false },
      profilFuer,
      anbieterFuer: () => attrappe(referenz, 10),
      budgetUsd: 30,
    });
    expect(ergebnisse).toHaveLength(1);
    expect(reihe.kosten_usd_summe).toBe(20);
    expect(reihe.beendet).toBe("Kostenbremse vor Lauf 2: bisher 20 USD, nächster Lauf bis 20 USD, Deckel 30 USD");

    const ctrl = new AbortController();
    ctrl.abort();
    const abgebrochen = await fallreihe({
      geplant: laufplan(k, matrixVarianten(["anthropic"], "eu"), 1),
      einstellungen: STANDARD,
      profilFuer,
      anbieterFuer: () => attrappe(referenz),
      signal: ctrl.signal,
    });
    expect([abgebrochen.ergebnisse.length, abgebrochen.reihe.beendet]).toEqual([0, "abgebrochen"]);
  });
});

describe("AV-2026-W45-08: Radarkennzahlen je Lauf", () => {
  it("zählt offene Achsen über alle Sachverhalte und Treffer des Prüfmusters; ohne Meldung null", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const sv = (radar: Record<string, number | null>, text: string) => ({ sofort: { lagenradar: radar, bewertung_text: text }, analyse: {} });
    const voll = { d1: 2, d2: null, d3: 2, d4: null, d5: 3, d6: 1, d7: 0, d8: null };
    const meldung = {
      sachverhalte: [
        sv(voll, "D3 = 2, D3 Funktion: Gefahrenabwehr, Kreis. D5 = 3: Zielzustand Versorgung wiederhergestellt."),
        sv({ d1: null, d2: null, d3: 5, d4: null, d5: 6, d6: null, d7: null, d8: null }, "D3 = 5 (Bund). D5 = 6, weil es lange dauert."),
      ],
    } as any;
    // offen: 3 von 8 im ersten, 6 von 8 im zweiten Sachverhalt → 9 / 16
    expect(radarKennzahlen(meldung, p!)).toEqual({
      offen: 0.563,
      pruefmuster: 2,
      hinweise: [
        "Sachverhalt 2: D3 = 5 ohne Kennzeichnung der bewerteten Funktion („D3 Funktion:“, „D3 strukturell:“ oder „D3 Vorsorge:“)",
        "Sachverhalt 2: D5 = 6, ohne dass ein Zielzustand genannt ist",
      ],
    });
    expect(radarKennzahlen(undefined, p!)).toEqual({ offen: null, pruefmuster: null, hinweise: [] });
    expect(UEBERSICHT_KOPF).toEqual(expect.arrayContaining(["radar_offen", "radar_pruefmuster"]));
  });
});
