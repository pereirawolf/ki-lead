// Vergleichslauf Ilka mit Wahl des Umfangs (seit 0.5.12): S1, S1 + S2, S1 + S2 + S3 aus den sechs Eingängen,
// S2 + S3 mit dem Zuschnitt der Musterfassung und Management Summary aus der Musterfassung. Mit Anbieterattrappen,
// ohne KI-Aufrufe. Sollwerte aus Plänen, Fall und Dateien im Repository oder von Hand.
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { leseOrdner, profilPflicht, repoPfad } from "../support/dateien";
import { llmAntwort, meldungsAntwort } from "../support/anbieter";
import type { LlmAnbieter, LlmAnfrage, LlmAntwort } from "../../src/anbieter/typen";
import { STANDARD, STANDARD_PROFILE, standardProfilAnwenden, type Einstellungen } from "../../src/pipeline/einstellungen";
import {
  einstellungenFuerVariante,
  plaeneFuer,
  planVarianteZu,
  rollenFuer,
  s1Vergleich,
  UMFAENGE,
  UMFANG_VORGABE,
  umfangPruefen,
  vergleichsreihe,
  type FallDaten,
  type Reihe,
} from "../../src/forschung/vergleichslauf";
import { reiheZip, uebersichtZeilen, zipDateiname } from "../../src/forschung/vergleichslauf-export";
import { musterDatenEingebaut } from "../../src/forschung/vergleichslauf-eingebaut";
import { kurzfassungsreihe, kurzfassungsUebersicht, kurzfassungsZip, kurzfassungsZipName, musterfassungAus } from "../../src/forschung/kurzfassungsreihe";
import { auswerten, konfigSchluessel, zusammenfassen } from "../../src/forschung/vergleichsauswertung";
import { schaetzeKurzfassung } from "../../src/pipeline/schaetzung";

const PLAN_S2 = JSON.parse(readFileSync(repoPfad("evaluation/plaene/s2-isoliert-ilka.json"), "utf-8"));
const PLAN_MS = JSON.parse(readFileSync(repoPfad("evaluation/plaene/management-summary-ilka.json"), "utf-8"));
const ZUSCHNITT = JSON.parse(readFileSync(repoPfad("evaluation/material/ilka-s1-zuschnitt-a.json"), "utf-8"));
const MUSTER_TEXT = readFileSync(repoPfad("evaluation/material/ilka-musterfassung.json"), "utf-8");
const REFERENZ = "beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
const EINGAENGE = [
  "LEAD-Meldung_HE_2026-10-14T10-15_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_NI_2026-10-14T09-45_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_NW_2026-10-14T10-00_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_RP_2026-10-14T09-30_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_ST_2026-10-14T11-00_FIKTIV_Orkantief-Ilka.json",
  "LEAD-Meldung_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json",
];
const MISTRAL: Einstellungen = {
  ...standardProfilAnwenden(STANDARD, "mistral"),
  anbieterOptionen: { ...STANDARD.anbieterOptionen, mistral: { endpunkt: "eu" } },
};

async function daten(): Promise<FallDaten> {
  return { profil: await profilPflicht("lead-beispiel"), dateien: leseOrdner(repoPfad("profile", "lead-beispiel")) };
}

/** Ein Sachverhalt mit allen Eingängen (wie die Attrappe der bisherigen Tests) */
const S1_EINER = {
  gegenstand: "Sturmfolgen Orkantief Ilka",
  stichtag: "2026-10-14",
  meldezeitpunkt: "2026-10-14T14:00",
  referenzbezug: "Bund",
  horizont: "bis 16.10.2026",
  sachverhalte: [{ titel: "Sturmfolgen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01", "c99"], begruendung: "Sturm", eingangsmeldungen: EINGAENGE }],
  prueffrage: "",
  hinweise: "",
};

/**
 * S1 (mit JSON-Schema) liefert den gegebenen Vorschlag; S2 nacheinander die Antworten aus `s2`, danach immer die
 * letzte; jede Anfrage wird mitgeschrieben.
 */
function attrappe(s1: unknown, s2: (() => LlmAntwort)[]): LlmAnbieter & { anfragen: LlmAnfrage[] } {
  const anfragen: LlmAnfrage[] = [];
  let n = 0;
  return {
    id: "attrappe",
    anfragen,
    async senden(a) {
      anfragen.push(a);
      if (a.signal?.aborted) throw Object.assign(new Error("abgebrochen"), { name: "AbortError" });
      if (a.jsonSchema) return llmAntwort(JSON.stringify(s1), { modell: a.modell });
      return s2[Math.min(n++, s2.length - 1)]();
    },
  };
}

describe("Umfang des Vergleichslaufs", () => {
  it("bietet die fünf Umfänge in der gewünschten Reihenfolge; Vorgabe ist die ganze Kette wie bis 0.5.11", () => {
    expect(UMFAENGE.map((u) => [u.id, u.titel, u.grundlage])).toEqual([
      ["s1", "S1 (aus Rohdaten)", "rohdaten"],
      ["s1-s2", "S1 + S2 (aus Rohdaten)", "rohdaten"],
      ["s1-s2-s3", "S1 + S2 + S3 (aus Rohdaten)", "rohdaten"],
      ["s2-s3", "S2 + S3 (aus Musterfassung)", "musterfassung"],
      ["ms", "Management Summary (aus Musterfassung)", "musterfassung"],
    ]);
    expect(UMFANG_VORGABE).toBe("s1-s2-s3");
    expect(UMFAENGE.map((u) => rollenFuer(u.id))).toEqual([
      ["vorverarbeitung"],
      ["vorverarbeitung", "verdichtung"],
      ["vorverarbeitung", "verdichtung", "reparatur"],
      ["verdichtung", "reparatur"],
      ["kurzfassung"],
    ]);
  });

  it("ordnet die Bewertungspläne den Umfängen zu und übernimmt aus einer Variante nur, was sie nennt", () => {
    expect(UMFAENGE.map((u) => plaeneFuer(u.id).map((p) => p.id))).toEqual([
      ["standardprofile-ilka", "anbietermix-ilka"],
      ["standardprofile-ilka", "anbietermix-ilka"],
      ["standardprofile-ilka", "anbietermix-ilka"],
      ["s2-isoliert-ilka"],
      ["management-summary-ilka"],
    ]);
    expect(plaeneFuer("s2-s3")[0].varianten.map((v) => v.kennung)).toEqual(PLAN_S2.varianten.map((v: any) => v.kennung));
    expect(plaeneFuer("ms")[0].varianten.map((v) => v.kennung)).toEqual(PLAN_MS.varianten.map((v: any) => v.kennung));
    // S2-Variante: S1 und Management Summary bleiben, Reparatur nach dem S2-Anbieter
    const f = einstellungenFuerVariante(STANDARD, planVarianteZu("s2-isoliert-ilka/F-mistral-large")!.variante);
    expect(f.modelle).toMatchObject({
      vorverarbeitung: STANDARD.modelle.vorverarbeitung,
      verdichtung: "mistral-large-4",
      reparatur: STANDARD_PROFILE.mistral.modelle.reparatur,
      kurzfassung: STANDARD.modelle.kurzfassung,
    });
    expect(f.aufwand.verdichtung).toBe("high");
    // MS-Variante: nur die Management Summary
    const d = einstellungenFuerVariante(STANDARD, planVarianteZu("management-summary-ilka/D-openai-standard")!.variante);
    expect(d.modelle).toEqual({ ...STANDARD.modelle, kurzfassung: "gpt-6.1-sol" });
    expect(d.aufwand).toEqual({ ...STANDARD.aufwand, kurzfassung: "medium" });
  });

  it("prüft Umfang und festen Gegenstand gegeneinander", async () => {
    const { s1Fest } = await musterDatenEingebaut();
    expect(umfangPruefen(undefined, undefined)).toBe("s1-s2-s3");
    expect(umfangPruefen(undefined, s1Fest)).toBe("s2-s3");
    expect(() => umfangPruefen("s2-s3", undefined)).toThrow("festen S1-Gegenstand");
    expect(() => umfangPruefen("s1", s1Fest)).toThrow("nur zum Umfang „S2 + S3“");
    expect(() => umfangPruefen("ms", undefined)).toThrow("kurzfassungsreihe");
  });
});

describe("Musterfassung in der App", () => {
  it("Musterfassung und Zuschnitt sind eingebettet und passen zu den Prüfsummen der Pläne", async () => {
    const m = await musterDatenEingebaut();
    const sha = (t: string) => createHash("sha256").update(t).digest("hex");
    expect(m.musterfassung).toEqual({ datei: PLAN_MS.meldung_fest.datei, sha256: sha(MUSTER_TEXT), text: MUSTER_TEXT });
    expect(m.musterfassung.sha256).toBe(PLAN_MS.meldung_fest.sha256);
    expect(m.s1Fest.datei).toBe(PLAN_S2.s1_fest.datei);
    expect(m.s1Fest.sha256).toBe(PLAN_S2.s1_fest.sha256);
    expect(m.s1Fest.vorschlag).toEqual(ZUSCHNITT);
  });

  it("bricht bei abweichender Prüfsumme vor jedem Aufruf ab und nennt den Plan", async () => {
    const zuschnitt = readFileSync(repoPfad(PLAN_S2.s1_fest.datei), "utf-8");
    await expect(musterDatenEingebaut({ muster: MUSTER_TEXT + " ", zuschnitt })).rejects.toThrow("Plans management-summary-ilka");
    await expect(musterDatenEingebaut({ muster: MUSTER_TEXT, zuschnitt: zuschnitt + "\n" })).rejects.toThrow("Plans s2-isoliert-ilka");
    await expect(musterfassungAus("{}")).rejects.toThrow("fortzuschreiben");
  });
});

describe("S1 (aus Rohdaten)", () => {
  it("ruft nur S1 auf, prüft T1, T2, T4–T6 und vergleicht mit dem Zuschnitt der Musterfassung", async () => {
    const d = await daten();
    const anbieter = attrappe(ZUSCHNITT, [() => llmAntwort("nicht erwartet")]);
    const { reihe, ergebnisse } = await vergleichsreihe({ daten: d, anbieter, einstellungen: MISTRAL, anzahl: 2, umfang: "s1" });
    expect(anbieter.anfragen.map((a) => a.modell)).toEqual(["mistral-small-2603", "mistral-small-2603"]);
    expect(reihe).toMatchObject({ umfang: "s1", technisch_bestanden: 2, laeufe_geplant: 2 });
    expect("s1_fest" in reihe).toBe(false);
    for (const e of ergebnisse) {
      expect(e.lauf.status).toBe("bestaetigen");
      expect(e.meldung).toBeUndefined();
      expect(e.eintrag.pruefpunkte.map((p) => [p.nr, p.erfuellt])).toEqual(["T1", "T2", "T4", "T5", "T6"].map((nr) => [nr, true]));
      // Vorschlag gleich dem Zuschnitt: alles wie die Musterfassung
      expect(e.eintrag.s1_vergleich).toEqual({
        sachverhalte: 2,
        gliederung_wie_muster: true,
        zuordnung_wie_muster: true,
        eingaenge_zugeordnet: 6,
        sop_abdeckung: 1,
        sops_zusaetzlich: [],
        sops_fehlend: [],
        befunde: [],
      });
    }
    const zip = await JSZip.loadAsync(await reiheZip(reihe, ergebnisse));
    const dateien = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
    expect(dateien.filter((n) => n.startsWith("s1/"))).toHaveLength(2);
    expect(dateien.some((n) => n.startsWith("meldungen/") || n.startsWith("vergleiche/"))).toBe(false);
    expect(await zip.file("LIESMICH.txt")!.async("string")).toContain("S1 (aus Rohdaten)");
    // je Lauf eine Zeile je Sachverhalt des Vorschlags
    const zeilen = uebersichtZeilen(reihe, ergebnisse);
    expect(zeilen).toHaveLength(1 + 2 * 2);
    expect(zeilen[0].slice(10, 13)).toEqual(["sachverhalte", "gliederung_wie_muster", "zuordnung_wie_muster"]);
    expect(zipDateiname(reihe)).toMatch(/^KI-LEAD_Testlauf_Ilka_S1_mistral-small-2603-high_\d{8}-\d{4}\.zip$/);
  });

  it("nennt Abweichungen vom Zuschnitt der Musterfassung", () => {
    // Soll von Hand: Musterfassung wählt b01, c13 und b08, b12, c11, c12, b10; der Vorschlag b01 und c99
    expect(s1Vergleich(S1_EINER as any)).toEqual({
      sachverhalte: 1,
      gliederung_wie_muster: false,
      zuordnung_wie_muster: false,
      eingaenge_zugeordnet: 6,
      sop_abdeckung: 0.143, // 1 von 7
      sops_zusaetzlich: ["c99"],
      sops_fehlend: ["b08", "b10", "b12", "c11", "c12", "c13"],
      befunde: [],
    });
    // Reihenfolge der Sachverhalte vertauscht: gleiche Zahl, andere Gliederung
    const vertauscht = { ...ZUSCHNITT, sachverhalte: [...ZUSCHNITT.sachverhalte].reverse() };
    expect(s1Vergleich(vertauscht)).toMatchObject({ sachverhalte: 2, gliederung_wie_muster: false, sop_abdeckung: 1 });
    expect(s1Vergleich(undefined)).toBeNull();
  });
});

describe("S1 + S2 und S1 + S2 + S3 (aus Rohdaten)", () => {
  it("ohne S3 bleibt ein Schemafehler stehen; mit S3 repariert die App", async () => {
    const d = await daten();
    const ref = JSON.parse(d.dateien[REFERENZ]);
    const kaputt = () => meldungsAntwort({ ...ref, unbekannt: 1 });
    const gut = () => meldungsAntwort(ref);
    const ohne = attrappe(S1_EINER, [kaputt, gut]);
    const a = await vergleichsreihe({ daten: d, anbieter: ohne, einstellungen: MISTRAL, anzahl: 1, umfang: "s1-s2" });
    expect(ohne.anfragen).toHaveLength(2);
    expect(a.reihe.umfang).toBe("s1-s2");
    const l = a.ergebnisse[0];
    expect(l.lauf.stufen.map((s) => s.stufe)).toEqual(["S1 Gegenstand und SOP-Auswahl", "S2 Verdichtung"]);
    expect(l.lauf.ergebnis?.schemakonform).toBe(false);
    expect(l.eintrag.pruefpunkte.find((p) => p.nr === "T3")?.erfuellt).toBe(false);
    // der Entwurf wird trotzdem verglichen
    expect(l.lauf.vergleich?.ergebnis).toBeTruthy();
    expect(l.eintrag.s1_vergleich?.sachverhalte).toBe(1);
    expect(zipDateiname(a.reihe)).toMatch(/^KI-LEAD_Testlauf_Ilka_S1-S2_mistral-medium-3-5-high_/);

    const mit = attrappe(S1_EINER, [kaputt, gut]);
    const b = await vergleichsreihe({ daten: d, anbieter: mit, einstellungen: MISTRAL, anzahl: 1, umfang: "s1-s2-s3" });
    expect(mit.anfragen).toHaveLength(3);
    expect(b.ergebnisse[0].lauf.stufen.map((s) => s.stufe)).toContain("S3 Reparatur 1");
    expect(b.ergebnisse[0].lauf.ergebnis?.schemakonform).toBe(true);
    expect(b.reihe.technisch_bestanden).toBe(1);
    // Dateiname der ganzen Kette wie bis 0.5.11
    expect(zipDateiname(b.reihe)).toMatch(/^KI-LEAD_Testlauf_Ilka_mistral-medium-3-5-high_\d{8}-\d{4}\.zip$/);
  });

  it("ohne S3 keine Vervollständigung einer abgeschnittenen Antwort", async () => {
    const d = await daten();
    const anbieter = attrappe(S1_EINER, [() => llmAntwort('Kurz.\n\n```json\n{"schema": ', { stopGrund: "max_tokens" })]);
    const { ergebnisse } = await vergleichsreihe({ daten: d, anbieter, einstellungen: MISTRAL, anzahl: 1, umfang: "s1-s2" });
    expect(anbieter.anfragen).toHaveLength(2);
    expect(ergebnisse[0].lauf.status).toBe("fehler");
    expect(ergebnisse[0].lauf.stufen[1].notiz).toContain("ohne S3");
  });
});

describe("S2 + S3 (aus Musterfassung)", () => {
  it("nimmt den Zuschnitt der Musterfassung als festen Gegenstand, ohne S1-Aufruf", async () => {
    const d = await daten();
    const { s1Fest } = await musterDatenEingebaut();
    const anbieter = attrappe(S1_EINER, [() => meldungsAntwort(JSON.parse(d.dateien[REFERENZ]))]);
    const { reihe, ergebnisse } = await vergleichsreihe({ daten: d, anbieter, einstellungen: STANDARD, anzahl: 1, umfang: "s2-s3", s1Fest });
    expect(anbieter.anfragen.map((a) => a.modell)).toEqual(["claude-opus-5-5"]);
    expect(reihe).toMatchObject({ umfang: "s2-s3", s1_fest: { datei: PLAN_S2.s1_fest.datei, sha256: PLAN_S2.s1_fest.sha256 } });
    expect(ergebnisse[0].lauf.bestaetigt?.sachverhalte.map((s) => s.titel)).toEqual(ZUSCHNITT.sachverhalte.map((s: any) => s.titel));
    expect("s1_vergleich" in ergebnisse[0].eintrag).toBe(false);
    expect(zipDateiname(reihe)).toMatch(/^KI-LEAD_Testlauf_Ilka_S2-S3-Muster_claude-opus-5-5-medium_/);
  });
});

describe("MS (aus Musterfassung)", () => {
  const KURZ = {
    kernaussage: "Nach dem Orkantief sind noch mindestens rund 20.700 Menschen ohne Strom; in Sonneberg enden Notstrompuffer vor der Wiederversorgung.",
    abschnitte: {},
    kurztitel: ["Sturmfolgen", "Stromausfälle"],
  };

  function msAttrappe(antworten: (() => LlmAntwort)[]): LlmAnbieter & { anfragen: LlmAnfrage[] } {
    const anfragen: LlmAnfrage[] = [];
    return {
      id: "attrappe",
      anfragen,
      async senden(a) {
        anfragen.push(a);
        if (a.signal?.aborted) throw Object.assign(new Error("abgebrochen"), { name: "AbortError" });
        return antworten[Math.min(anfragen.length - 1, antworten.length - 1)]();
      },
    };
  }

  it("fasst die Musterfassung je Lauf mit einem Aufruf zusammen und prüft vor", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const { musterfassung } = await musterDatenEingebaut();
    const anbieter = msAttrappe([
      () => llmAntwort(JSON.stringify(KURZ)),
      () => llmAntwort(JSON.stringify({ ...KURZ, kernaussage: "Rund 20.700 Menschen sind ohne Strom.", kurztitel: ["Lage"] })),
      () => llmAntwort("kein JSON"),
    ]);
    const stufen: string[] = [];
    const { reihe, ergebnisse } = await kurzfassungsreihe({
      profil,
      musterfassung,
      anbieter,
      einstellungen: STANDARD,
      anzahl: 3,
      stand: (s) => stufen.push(`${s.nr}/${s.anzahl} ${s.stufe}`),
      variante: "management-summary-ilka/A-anthropic-standard",
    });
    expect(anbieter.anfragen).toHaveLength(3);
    // die Musterfassung geht als Meldung in die Anfrage, nicht die Redaktionsfassung
    expect(JSON.stringify(anbieter.anfragen[0].nachrichten)).toContain("Notstrompuffer für Pflege und Trinkwasser");
    expect(anbieter.anfragen.every((a) => a.modell === "claude-sonnet-5-5" && !a.werkzeuge)).toBe(true);
    expect(stufen).toEqual(["1/3 Management Summary", "2/3 Management Summary", "3/3 Management Summary"]);
    expect(reihe).toMatchObject({
      format: "ki-lead-kurzfassung-reihe/1",
      plan: "management-summary-ilka",
      quelle: "app",
      umfang: "ms",
      fall: "ilka-management-summary",
      meldung: PLAN_MS.meldung_fest,
      anbieter: "anthropic",
      modell: { modell: "claude-sonnet-5-5", aufwand: "medium" },
      laeufe_geplant: 3,
      ohne_auffaelligkeit: 1,
      variante: "management-summary-ilka/A-anthropic-standard",
    });
    expect("mistral_endpunkt" in reihe).toBe(false);
    // Attrappe: 0,01 USD je erfolgreichem Aufruf; der dritte scheitert ohne bekannte Kosten
    expect(reihe.kosten_usd_summe).toBeCloseTo(0.02, 6);
    const [a, b, c] = reihe.laeufe;
    expect(a).toMatchObject({ status: "fertig", auffaelligkeiten: [], vorpruefung: { kurztitel_passend: true, mindestwert_fehlt: false } });
    expect(b.auffaelligkeiten).toEqual(["Kurztitel nicht je Sachverhalt (2 erwartet)", "20.700 ohne Kennzeichnung als Mindestwert"]);
    expect(c).toMatchObject({ status: "fehler", struktur: null, text: null });
    expect(c.fehler).toContain("nicht auswertbar");
    const zip = await JSZip.loadAsync(await kurzfassungsZip(reihe, ergebnisse));
    const dateien = Object.keys(zip.files)
      .filter((n) => !zip.files[n].dir)
      .sort();
    expect(dateien).toEqual(
      [
        "LIESMICH.txt",
        "reihe.json",
        "uebersicht.csv",
        `kurzfassungen/${a.lauf}.txt`,
        `kurzfassungen/${b.lauf}.txt`,
        `protokolle/${a.lauf}.kurzfassung.json`,
        `protokolle/${b.lauf}.kurzfassung.json`,
      ].sort(),
    );
    expect(await zip.file(`kurzfassungen/${a.lauf}.txt`)!.async("string")).toContain("mindestens rund 20.700");
    expect(kurzfassungsUebersicht(reihe)).toHaveLength(4);
    expect(kurzfassungsZipName(reihe)).toMatch(/^KI-LEAD_Testlauf_Ilka_MS-Muster_A-anthropic-standard_claude-sonnet-5-5-medium_\d{8}-\d{4}\.zip$/);
  });

  it("Mistral nennt den Endpunkt; Abbruch beendet die Reihe", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const { musterfassung } = await musterDatenEingebaut();
    const ctrl = new AbortController();
    const anbieter = msAttrappe([
      () => llmAntwort(JSON.stringify(KURZ)),
      () => {
        ctrl.abort();
        throw Object.assign(new Error("abgebrochen"), { name: "AbortError" });
      },
    ]);
    const { reihe } = await kurzfassungsreihe({ profil, musterfassung, anbieter, einstellungen: MISTRAL, anzahl: 3, signal: ctrl.signal });
    expect(reihe.laeufe.map((l) => l.status)).toEqual(["fertig", "abgebrochen"]);
    expect(reihe).toMatchObject({ beendet: "abgebrochen", mistral_endpunkt: "eu", modell: { modell: "mistral-medium-3-5" } });
  });

  it("schätzt die Kosten eines Aufrufs grob über den Listenpreis", () => {
    // Sonnet: 12 000 × 2 USD + 1 000 bzw. 6 000 × 10 USD je Million Token
    const s = schaetzeKurzfassung("claude-sonnet-5-5", "medium", 12_000);
    expect(s.gemessen).toBe(false);
    expect(s.sekunden).toBeNull();
    expect(s.usd![0]).toBeCloseTo(0.034, 6);
    expect(s.usd![1]).toBeCloseTo(0.084, 6);
    // Mistral Medium „hoch“ am EU-Endpunkt: (12 000 × 1,5 + 16 000 × 7,5) / 1e6 × 1,1
    expect(schaetzeKurzfassung("mistral-medium-3-5", "high", 12_000, { mistral: { endpunkt: "eu" } }).usd![1]).toBeCloseTo(0.1518, 6);
    expect(schaetzeKurzfassung("unbekannt", "medium", 12_000).usd).toBeNull();
  });
});

describe("Auswertung mehrerer Reihen mit Umfang", () => {
  async function reiheMit(umfang: "s1" | "s1-s2" | "s1-s2-s3"): Promise<Reihe> {
    const d = await daten();
    const ref = JSON.parse(d.dateien[REFERENZ]);
    const { reihe } = await vergleichsreihe({
      daten: d,
      anbieter: attrappe(S1_EINER, [() => meldungsAntwort(ref)]),
      einstellungen: MISTRAL,
      anzahl: 1,
      umfang,
    });
    return reihe;
  }

  it("hält S1 + S2 und die ganze Kette getrennt und weist reine S1-Reihen ab", async () => {
    const ohneS3 = await reiheMit("s1-s2");
    const kette = await reiheMit("s1-s2-s3");
    expect(konfigSchluessel(ohneS3)).not.toBe(konfigSchluessel(kette));
    // Schlüssel der ganzen Kette wie bis 0.5.11, auch ohne Feld „umfang“ (ältere Reihendateien)
    const alt = { ...kette } as Partial<Reihe>;
    delete alt.umfang;
    expect(konfigSchluessel(alt as Reihe)).toBe(konfigSchluessel(kette));
    expect(zusammenfassen([ohneS3, kette]).map((z) => z.kennung)).toEqual(["mistral-medium-3-5-high-eu@s1-s2", "mistral-medium-3-5-high-eu"]);
    const nurS1 = await reiheMit("s1");
    expect(() => auswerten([nurS1, kette])).toThrow("S1 (aus Rohdaten)");
  });
});
