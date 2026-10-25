// Vergleichslauf Ilka (seit 0.5.8): Reihe von Verdichtungen des Standardfalls mit fester Konfiguration, Prüfpunkte
// T1–T8 der Abnahme M4, Reihendatei, Übersicht und ZIP. Mit einer Anbieterattrappe, ohne KI-Aufrufe.
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { readFileSync } from "node:fs";
import { leseOrdner, profilPflicht, repoPfad } from "../support/dateien";
import { llmAntwort, meldungsAntwort } from "../support/anbieter";
import type { LlmAnbieter, LlmAnfrage } from "../../src/anbieter/typen";
import { STANDARD, STANDARD_PROFILE, standardProfilAnwenden, type Einstellungen } from "../../src/pipeline/einstellungen";
import {
  ANZAHL_MAX,
  ANZAHL_VORGABE,
  anzahlBegrenzt,
  einstellungenFuerVariante,
  fehlendeFalldateien,
  PLAN_ANBIETERMIX,
  PLAN_STANDARDPROFILE,
  planVarianteZu,
  VERGLEICHS_PLAENE,
  reiheZip,
  s1FestPruefen,
  uebersichtZeilen,
  vergleichsreihe,
  zipDateiname,
  type FallDaten,
} from "../../src/pipeline/vergleichslauf";
import { fallDatenEingebaut } from "../../src/pipeline/vergleichslauf-eingebaut";
import { sopIdsAufloesen } from "../../src/pipeline/kontext";
import { createHash } from "node:crypto";

// Sollwerte unabhängig von der Implementierung: aus dem Bewertungsfall und den Dateinamen im Repository
const FALL = JSON.parse(readFileSync(repoPfad("evaluation/faelle/orkantief-ilka-verdichtung.json"), "utf-8"));
const EINGAENGE = [
  "LEAD-Meldung_HE_2026-10-14T10-15_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_NI_2026-10-14T09-45_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_NW_2026-10-14T10-00_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_RP_2026-10-14T09-30_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_ST_2026-10-14T11-00_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json",
];
const REFERENZ = "beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";

async function daten(): Promise<FallDaten> {
  return { profil: await profilPflicht("lead-beispiel"), dateien: leseOrdner(repoPfad("profile", "lead-beispiel")) };
}

/** S1 (mit JSON-Schema) ordnet alle Eingänge einem Sachverhalt zu; S2 liefert die Redaktionsfassung. */
function attrappe(referenz: unknown, extra?: (a: LlmAnfrage, nr: number) => void): LlmAnbieter & { anfragen: LlmAnfrage[] } {
  const anfragen: LlmAnfrage[] = [];
  return {
    id: "attrappe",
    anfragen,
    async senden(a) {
      anfragen.push(a);
      extra?.(a, anfragen.length);
      if (a.signal?.aborted) throw Object.assign(new Error("abgebrochen"), { name: "AbortError" });
      if (a.jsonSchema)
        return llmAntwort(
          JSON.stringify({
            gegenstand: "Sturmfolgen Orkantief Ilka",
            stichtag: "2026-10-14",
            meldezeitpunkt: "2026-10-14T14:00",
            referenzbezug: "Bund",
            horizont: "bis 16.10.2026",
            sachverhalte: [{ titel: "Sturmfolgen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm", eingangsmeldungen: EINGAENGE }],
            prueffrage: "",
            hinweise: "",
          }),
          { modell: a.modell },
        );
      return meldungsAntwort(referenz, "Kurz.", { modell: a.modell });
    },
  };
}

const MISTRAL: Einstellungen = { ...standardProfilAnwenden(STANDARD, "mistral"), mistralEndpunkt: "eu" };

describe("Vergleichslauf Ilka", () => {
  it("Vorgabe drei Läufe, Grenzen 1 bis 10", () => {
    expect(ANZAHL_VORGABE).toBe(3);
    expect(ANZAHL_MAX).toBe(10);
    expect([0, 1, 2.7, 10, 99, "x", "4"].map(anzahlBegrenzt)).toEqual([1, 1, 2, 10, 10, 3, 4]);
  });

  it("findet Material und Redaktionsfassung im Beispielprofil, auch in der eingebetteten Ausgabe der App", async () => {
    const d = await daten();
    expect(fehlendeFalldateien(d.dateien)).toEqual([]);
    expect(fehlendeFalldateien({})).toHaveLength(7);
    const eingebaut = await fallDatenEingebaut();
    expect(eingebaut.profil.manifest.id).toBe("lead.beispiel.koordinierungsstelle");
    expect(fehlendeFalldateien(eingebaut.dateien)).toEqual([]);
  });

  it("führt drei Läufe mit festem Auftrag aus: t0 14:00, ohne Websuche, S1-Vorschlag unverändert, alle Prüfpunkte erfüllt", async () => {
    const d = await daten();
    const anbieter = attrappe(JSON.parse(d.dateien[REFERENZ]));
    const staende: string[] = [];
    const { reihe, ergebnisse } = await vergleichsreihe({
      daten: d,
      anbieter,
      einstellungen: MISTRAL,
      anzahl: 3,
      stand: (s) => staende.push(`${s.nr}/${s.anzahl} ${s.stufe}`),
    });
    expect(ergebnisse).toHaveLength(3);
    for (const e of ergebnisse) {
      expect(e.lauf.status).toBe("fertig");
      expect(e.lauf.auftrag).toMatchObject({
        meldezeitpunkt: FALL.auftrag.meldezeitpunkt,
        stichtag: FALL.auftrag.stichtag,
        websuche: false,
        urls: [],
        prueffrage: "",
      });
      expect(e.lauf.material.map((m) => m.name)).toEqual(EINGAENGE);
      expect(e.lauf.bestaetigt).toEqual(e.lauf.vorschlag);
      expect(e.eintrag.pruefpunkte.map((p) => [p.nr, p.erfuellt])).toEqual(["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"].map((nr) => [nr, true]));
      expect(e.meldung?.meldezeitpunkt).toBe("2026-10-14T14:00");
    }
    // je Lauf S1 und S2, S2 ohne Werkzeuge, Modelle wie eingestellt
    expect(anbieter.anfragen.map((a) => a.modell)).toEqual(Array(3).fill(["mistral-small-2603", "mistral-medium-3-5"]).flat());
    expect(anbieter.anfragen.filter((a) => !a.jsonSchema).every((a) => !a.werkzeuge)).toBe(true);
    expect(reihe).toMatchObject({
      format: "ki-lead-abnahme/1",
      quelle: "app",
      fall: "orkantief-ilka-verdichtung",
      anbieter: "mistral",
      mistral_endpunkt: "eu",
      laeufe_geplant: 3,
      technisch_bestanden: 3,
      modelle: {
        s1: { modell: "mistral-small-2603", aufwand: STANDARD_PROFILE.mistral.aufwand.vorverarbeitung, anbieter: "mistral" },
        s2: { modell: "mistral-medium-3-5", aufwand: STANDARD_PROFILE.mistral.aufwand.verdichtung, anbieter: "mistral" },
      },
    });
    // Attrappe: 0,01 USD je Aufruf, zwei Aufrufe je Lauf
    expect(reihe.kosten_usd_summe).toBeCloseTo(0.06, 6);
    expect(reihe.beendet).toBeUndefined();
    expect(staende[0]).toBe("1/3 S1");
    expect(staende).toContain("3/3 S2 Verdichtung");
  });

  it("Anthropic ohne Mistral: kein Endpunkt in der Reihe", async () => {
    const d = await daten();
    const { reihe } = await vergleichsreihe({ daten: d, anbieter: attrappe(JSON.parse(d.dateien[REFERENZ])), einstellungen: STANDARD, anzahl: 1 });
    expect(reihe.anbieter).toBe("anthropic");
    expect(reihe.modelle.s2.modell).toBe("claude-opus-5-5");
    expect("mistral_endpunkt" in reihe).toBe(false);
  });

  it("ZIP enthält Reihendatei, Übersicht, Laufprotokolle, Entwürfe und Vergleiche", async () => {
    const d = await daten();
    const { reihe, ergebnisse } = await vergleichsreihe({ daten: d, anbieter: attrappe(JSON.parse(d.dateien[REFERENZ])), einstellungen: MISTRAL, anzahl: 2 });
    const zip = await JSZip.loadAsync(await reiheZip(reihe, ergebnisse));
    const ids = ergebnisse.map((e) => e.lauf.id);
    expect(
      Object.keys(zip.files)
        .filter((n) => !zip.files[n].dir)
        .sort(),
    ).toEqual(
      [
        "LIESMICH.txt",
        "reihe.json",
        "uebersicht.csv",
        ...ids.flatMap((id) => [`laeufe/${id}.lauf.json`, `meldungen/${id}.meldung.json`, `vergleiche/${id}.vergleich.csv`]),
      ].sort(),
    );
    const r = JSON.parse(await zip.file("reihe.json")!.async("string"));
    expect(r.laeufe.map((l: any) => l.lauf)).toEqual(ids);
    const lauf = JSON.parse(await zip.file(`laeufe/${ids[0]}.lauf.json`)!.async("string"));
    expect(lauf.format).toBe("ki-lead-lauf/1");
    const csvText = (await zip.file("uebersicht.csv")!.async("string")).replace(/^﻿/, "");
    const zeilen = csvText.trim().split("\r\n");
    expect(zeilen[0].split(";").slice(0, 4)).toEqual(["lauf", "variante", "status", "technisch_bestanden"]);
    // Redaktionsfassung als Entwurf: je Lauf so viele Zeilen wie Sachverhalte der Redaktionsfassung
    const svRef = JSON.parse(d.dateien[REFERENZ]).sachverhalte.length;
    expect(zeilen).toHaveLength(1 + 2 * svRef);
    expect(zeilen[1].startsWith(`${ids[0]};;fertig;ja;mistral-small-2603;`)).toBe(true);
    expect(uebersichtZeilen(reihe, ergebnisse)[0]).toContain("d8");
    expect(zipDateiname(reihe)).toMatch(/^KI-LEAD_Vergleichslauf_Ilka_mistral-medium-3-5-[a-z]+_\d{8}-\d{4}\.zip$/);
  });

  it("Abbruch während des zweiten Laufs beendet die Reihe mit den bisherigen Läufen", async () => {
    const d = await daten();
    const ctrl = new AbortController();
    const anbieter = attrappe(JSON.parse(d.dateien[REFERENZ]), (_a, nr) => {
      if (nr === 3) ctrl.abort();
    });
    const { reihe, ergebnisse } = await vergleichsreihe({ daten: d, anbieter, einstellungen: MISTRAL, anzahl: 3, signal: ctrl.signal });
    expect(ergebnisse.map((e) => e.lauf.status)).toEqual(["fertig", "abgebrochen"]);
    expect(reihe.beendet).toBe("abgebrochen");
    expect(reihe.technisch_bestanden).toBe(1);
    expect(anbieter.anfragen).toHaveLength(3);
  });

  it("Budgetgrenze beendet die Reihe vor dem nächsten Lauf", async () => {
    const d = await daten();
    const { reihe, ergebnisse } = await vergleichsreihe({
      daten: d,
      anbieter: attrappe(JSON.parse(d.dateien[REFERENZ])),
      einstellungen: MISTRAL,
      anzahl: 5,
      budgetUsd: 0.03,
    });
    expect(ergebnisse).toHaveLength(2);
    expect(reihe.beendet).toBe("Budgetgrenze 0.03 USD erreicht");
  });

  it("AV-2026-W43-11: Kennzahlen und Plausibilität je Lauf; mit der Redaktionsfassung als Entwurf ohne Abweichung", async () => {
    const d = await daten();
    const ref = JSON.parse(d.dateien[REFERENZ]);
    const { ergebnisse } = await vergleichsreihe({ daten: d, anbieter: attrappe(ref), einstellungen: MISTRAL, anzahl: 1 });
    // Soll aus der Redaktionsfassung selbst
    const svs = ref.sachverhalte as any[];
    const werte = svs.flatMap((sv) => Object.values(sv.sofort.lagenradar));
    expect(ergebnisse[0].eintrag.kennzahlen).toEqual({
      sachverhalte: svs.length,
      achsen_gesetzt: Math.round((werte.filter((w) => w !== null).length / werte.length) * 1000) / 1000,
      tendenz_gesetzt: Math.round((svs.filter((sv) => sv.sofort.tendenz).length / svs.length) * 1000) / 1000,
      beurteilung_gleich: 1,
      tendenz_gleich: 1,
      aehnlichkeit_mittel: 1,
      achsen_abweichung_mittel: 0,
      achsen_nah: 1,
      plausibilitaet_befunde: 0,
    });
    expect(ergebnisse[0].eintrag.plausibilitaet).toEqual([]);
    const paar = (ergebnisse[0].eintrag.beobachtungen.vergleich as any).paare[0];
    expect(paar.ref_index).toBe(0);
    expect(paar.ki_radar).toEqual(svs[0].sofort.lagenradar);
  });

  it("AV-2026-W43-23, -24: Plan anbietermix-ilka mischt Anbieter je Stufe; Varianten über „Plan/Kennung“", () => {
    expect(VERGLEICHS_PLAENE.map((p) => p.id)).toEqual(["standardprofile-ilka", "anbietermix-ilka"]);
    expect(PLAN_ANBIETERMIX.wiederholungen).toBe(3);
    expect(PLAN_ANBIETERMIX.varianten).toEqual([
      { kennung: "M1-luna-opus", s1: { modell: "gpt-6-luna", aufwand: "high" }, s2: { modell: "claude-opus-5-5", aufwand: "medium" }, material: "eingaenge" },
      {
        kennung: "M2-luna-sonnet",
        s1: { modell: "gpt-6-luna", aufwand: "high" },
        s2: { modell: "claude-sonnet-5-5", aufwand: "medium" },
        material: "eingaenge",
      },
    ]);
    const m1 = planVarianteZu("anbietermix-ilka/M1-luna-opus")!;
    expect(m1.plan.id).toBe("anbietermix-ilka");
    const e = einstellungenFuerVariante(STANDARD, m1.variante);
    expect(e.modelle).toMatchObject({ vorverarbeitung: "gpt-6-luna", verdichtung: "claude-opus-5-5", reparatur: "claude-sonnet-5-5" });
    expect(e.aufwand).toMatchObject({ vorverarbeitung: "high", verdichtung: "medium", reparatur: "low" });
    expect(planVarianteZu("standardprofile-ilka/D-openai-astra-hoch")!.variante.s2).toEqual({ modell: "gpt-6-astra", aufwand: "high" });
    expect(planVarianteZu("anbietermix-ilka/gibt-es-nicht")).toBeUndefined();
    expect(planVarianteZu("M1-luna-opus")).toBeUndefined();
  });

  it("AV-2026-W43-04: Varianten des Plans standardprofile-ilka setzen S1, S2 und die Reparatur des S2-Anbieters", async () => {
    expect(PLAN_STANDARDPROFILE.id).toBe("standardprofile-ilka");
    expect(PLAN_STANDARDPROFILE.wiederholungen).toBe(3);
    expect(PLAN_STANDARDPROFILE.varianten.map((v) => v.kennung)).toEqual([
      "A-anthropic-standard",
      "B-anthropic-sonnet",
      "C-openai-standard",
      "D-openai-astra-hoch",
      "E-mistral-standard",
      "F-mistral-large",
    ]);
    const f = PLAN_STANDARDPROFILE.varianten[5];
    const e = einstellungenFuerVariante({ ...STANDARD, mistralEndpunkt: "global" }, f);
    expect(e.modelle).toMatchObject({ vorverarbeitung: "mistral-small-2603", verdichtung: "mistral-large-4", reparatur: "mistral-small-2603" });
    expect(e.aufwand).toMatchObject({ vorverarbeitung: "high", verdichtung: "high", reparatur: "low" });
    expect(e.mistralEndpunkt).toBe("global");
    // Anthropic-Bezug: Reparatur Sonnet
    expect(einstellungenFuerVariante(STANDARD, PLAN_STANDARDPROFILE.varianten[0]).modelle.reparatur).toBe("claude-sonnet-5-5");
    const d = await daten();
    const { reihe } = await vergleichsreihe({
      daten: d,
      anbieter: attrappe(JSON.parse(d.dateien[REFERENZ])),
      einstellungen: e,
      anzahl: 1,
      variante: "standardprofile-ilka/F-mistral-large",
    });
    expect(reihe.variante).toBe("standardprofile-ilka/F-mistral-large");
    expect(reihe.modelle.s2).toEqual({ modell: "mistral-large-4", aufwand: "high", anbieter: "mistral" });
    expect(zipDateiname(reihe)).toMatch(/^KI-LEAD_Vergleichslauf_Ilka_F-mistral-large_mistral-large-4-high_\d{8}-\d{4}\.zip$/);
  });

  // LS-2026-W43-15 (Lernschleife, 25.10.2026): isolierter Vergleich der Verdichtung mit festem S1-Gegenstand
  describe("LS-2026-W43-15: fester S1-Gegenstand", () => {
    const DATEI = "evaluation/material/ilka-s1-zuschnitt-a.json";
    const TEXT = readFileSync(repoPfad(DATEI), "utf-8");
    const FEST = { datei: DATEI, sha256: createHash("sha256").update(TEXT).digest("hex"), vorschlag: JSON.parse(TEXT) };

    it("der Gegenstand im Repository passt zum Fall: t0, alle sechs Eingänge, zwei Sachverhalte, nur bekannte SOPs", async () => {
      expect(s1FestPruefen(FEST.vorschlag)).toEqual([]);
      expect(FEST.vorschlag.sachverhalte).toHaveLength(2);
      const profil = (await daten()).profil;
      for (const s of FEST.vorschlag.sachverhalte) expect(sopIdsAufloesen(profil, s.sops), s.titel).toHaveLength(s.sops.length);
    });

    it.each([
      ["anderes t0", (v: any) => (v.meldezeitpunkt = "2026-10-14T12:00"), /t0 2026-10-14T12:00/],
      ["unbekannter Eingang", (v: any) => v.sachverhalte[0].eingangsmeldungen.push("fremd.json"), /unbekannter Eingang fremd\.json/],
      ["Eingang fehlt", (v: any) => v.sachverhalte.forEach((s: any) => (s.eingangsmeldungen = s.eingangsmeldungen.filter((e: string) => !e.includes("_ST_")))), /_ST_.*keinem Sachverhalt/],
      ["ohne SOP", (v: any) => (v.sachverhalte[1].sops = []), /Sachverhalt 2: keine SOP/],
      ["keine Sachverhalte", (v: any) => (v.sachverhalte = []), /keine Sachverhalte/],
    ])("verwirft einen unbrauchbaren Gegenstand: %s", (_name, aendern, muster) => {
      const v = structuredClone(FEST.vorschlag);
      aendern(v);
      expect(s1FestPruefen(v).join(" | ")).toMatch(muster);
    });

    it("ohne S1-Aufruf: Gegenstand unverändert bestätigt, alle Prüfpunkte erfüllt, Datei und Prüfsumme in Lauf und Reihe", async () => {
      const d = await daten();
      const anbieter = attrappe(JSON.parse(d.dateien[REFERENZ]));
      const { reihe, ergebnisse } = await vergleichsreihe({ daten: d, anbieter, einstellungen: MISTRAL, anzahl: 2, s1Fest: FEST, variante: "s2-isoliert-ilka/E-mistral-medium" });
      // je Lauf genau ein Aufruf, und zwar S2 (ohne JSON-Schema des S1-Vorschlags)
      expect(anbieter.anfragen.map((a) => [a.modell, !!a.jsonSchema])).toEqual([
        ["mistral-medium-3-5", false],
        ["mistral-medium-3-5", false],
      ]);
      for (const e of ergebnisse) {
        expect(e.lauf.stufen.some((s) => s.stufe.startsWith("S1"))).toBe(false);
        expect(e.lauf.bestaetigt?.sachverhalte.map((s) => s.titel)).toEqual(FEST.vorschlag.sachverhalte.map((s: any) => s.titel));
        expect(e.eintrag.pruefpunkte.map((p) => [p.nr, p.erfuellt])).toEqual(["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"].map((nr) => [nr, true]));
        expect(e.eintrag.pruefpunkte.find((p) => p.nr === "T5")?.angabe).toContain("S1 fest vorgegeben");
        expect(e.eintrag.beobachtungen.s1_fest).toEqual({ datei: DATEI, sha256: FEST.sha256 });
        expect(e.eintrag.beobachtungen.s1_sachverhalte).toBe(2);
      }
      expect(reihe.s1_fest).toEqual({ datei: DATEI, sha256: FEST.sha256 });
      expect(reihe.variante).toBe("s2-isoliert-ilka/E-mistral-medium");
    });

    it("ein unbrauchbarer Gegenstand beendet den Lauf mit Fehler, bevor ein Modell aufgerufen wird", async () => {
      const d = await daten();
      const anbieter = attrappe(JSON.parse(d.dateien[REFERENZ]));
      const kaputt = { ...FEST, vorschlag: { ...FEST.vorschlag, meldezeitpunkt: "2026-10-15T08:00" } };
      const { ergebnisse } = await vergleichsreihe({ daten: d, anbieter, einstellungen: MISTRAL, anzahl: 1, s1Fest: kaputt });
      expect(ergebnisse[0].lauf.status).toBe("fehler");
      expect(ergebnisse[0].lauf.fehler).toMatch(/Fester S1-Gegenstand .* unbrauchbar/);
      expect(anbieter.anfragen).toHaveLength(0);
    });
  });
});
