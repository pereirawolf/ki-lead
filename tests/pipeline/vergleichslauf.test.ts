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
  fehlendeFalldateien,
  reiheZip,
  uebersichtZeilen,
  vergleichsreihe,
  zipDateiname,
  type FallDaten,
} from "../../src/pipeline/vergleichslauf";
import { fallDatenEingebaut } from "../../src/pipeline/vergleichslauf-eingebaut";

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
    expect(zeilen[0].split(";").slice(0, 3)).toEqual(["lauf", "status", "technisch_bestanden"]);
    // Redaktionsfassung als Entwurf: je Lauf so viele Zeilen wie Sachverhalte der Redaktionsfassung
    const svRef = JSON.parse(d.dateien[REFERENZ]).sachverhalte.length;
    expect(zeilen).toHaveLength(1 + 2 * svRef);
    expect(zeilen[1].startsWith(`${ids[0]};fertig;ja;mistral-small-2603;`)).toBe(true);
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
});
