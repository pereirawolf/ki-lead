// Plausibilitätsprüfung der Zahlen eines Entwurfs (AV-2026-W43-11, seit 0.5.8): Summen in Klammern und D2-Stufe.
// Sollwerte von Hand gerechnet; Beispielsätze nach den Mistral-Entwürfen vom 24.10.2026 (fiktiver Fall Ilka).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { repoPfad } from "../support/dateien";
import { d2Pruefen, d2Stufe, plausibilitaetPruefen, summenPruefen } from "../../src/pipeline/plausibilitaet";

describe("Plausibilität: Summen in Klammern", () => {
  it("meldet eine Angabe, die nicht der Summe der Klammerwerte entspricht", () => {
    expect(summenPruefen("mit mindestens 38 Verletzten (NRW 44 [Q3], Hessen 11 [Q1], Rheinland-Pfalz 15 [Q4], Thüringen 5 [Q6]).")).toEqual([
      expect.objectContaining({ angabe: 38, summe: 75, art: "mindestens" }),
    ]);
    expect(summenPruefen("Zu t0 sind noch rund 25.000 Anschlüsse betroffen (NI: ~4.600, NW: ~6.900, RP: ~1.800, TH: ~5.300, HE: ~900).")).toEqual([
      expect.objectContaining({ angabe: 25000, summe: 19500, art: "rund" }),
    ]);
    expect(summenPruefen("mindestens 1.233 Personen direkt betroffen (1 Todesopfer, 38 Verletzte, 1.200 Gestrandete)")).toEqual([
      expect.objectContaining({ angabe: 1233, summe: 1239 }),
    ]);
  });

  it("lässt stimmige Summen, Rundungen und Untergrenzen stehen", () => {
    expect(
      summenPruefen("mindestens 15.000 Einsätze (Hessen 2.900, Niedersachsen 1.700, NRW 6.400, Rheinland-Pfalz 2.120, Sachsen-Anhalt 480, Thüringen 1.400)"),
    ).toEqual([]);
    expect(summenPruefen("rund 20.000 Anschlüsse (NI: ~4.600, NW: ~6.900, RP: ~1.800, TH: ~5.300, HE: ~900)")).toEqual([]);
    expect(summenPruefen("über 150.000 Anschlüsse ohne Versorgung (NRW: 64.000, NI: 33.000, HE: 29.000, RP: 21.000, TH: 18.000)")).toEqual([]);
    expect(summenPruefen("über 200.000 Anschlüsse ohne Versorgung (NRW: 64.000, NI: 33.000, HE: 29.000, RP: 21.000, TH: 18.000)")).toHaveLength(1);
  });

  it("wertet keine Klammern mit Datum, Uhrzeit, Spannen oder anderem Bezug als Summen", () => {
    expect(summenPruefen("Wiederversorgung bis 16 Gemeinden (Thüringen 16.10., 18:00 Uhr; Niedersachsen 15.10., 20:00 Uhr)")).toEqual([]);
    expect(summenPruefen("rund 12.000 Einsätze und zahlreiche Verletzte (NRW: 1 Todesopfer, NI: 7)")).toEqual([]);
    expect(summenPruefen("D2 = 4, weil 29.400 Personen (Stufe 4: 10.000–99.999)")).toEqual([]);
    expect(summenPruefen("6 Mobilfunkstandorte (Puffer 48 Stunden, Reichweite 72 Stunden)")).toEqual([]);
    expect(summenPruefen("146 Bewohner (Niedersachsen [Q2])")).toEqual([]);
  });
});

describe("Plausibilität: D2", () => {
  it("Stufen nach den Stufentexten des Kodierleitfadens", () => {
    expect([0, 9, 10, 99, 100, 999, 1000, 9999, 10000, 99999, 100000, 999999, 1000000].map(d2Stufe)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6]);
  });

  it("meldet einen D2-Wert, der nicht zur größten genannten Personenzahl passt; Grenzangaben zählen nicht", () => {
    expect(d2Pruefen("D2 = 2, weil mindestens 1.233 Personen direkt betroffen sind; Abgrenzung zu 1: über 99 Personen. D3 = 4, weil …", 2)).toEqual(
      expect.objectContaining({ personen: 1233, erwartet: 3 }),
    );
    expect(d2Pruefen("D2 = 0, weil 14 gerettete Wandernde (davon 3 verletzt) die Bedingung a der Nullregel erfüllen (unter 10 Personen).", 0)).toEqual(
      expect.objectContaining({ personen: 14, erwartet: 1 }),
    );
    expect(d2Pruefen("D2 = 1, weil 14 gerettete Wandernde, davon drei verletzt, belegt sind (10–99 Personen).", 1)).toBeNull();
    expect(d2Pruefen("D2 = 4 (Mindestwert), weil mindestens 22.500 Personen betroffen sind; Abgrenzung zu 3: über 9.999 Personen.", 4)).toBeNull();
    expect(d2Pruefen("D2 offen: keine Personenzahl belegt.", null)).toBeNull();
    expect(d2Pruefen("D1 = 5, weil 300 Personen …", 1)).toBeNull();
  });

  it("die Redaktionsfassung Ilka ist ohne Befund", () => {
    const ref = JSON.parse(
      readFileSync(
        repoPfad("profile/lead-beispiel/beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json"),
        "utf-8",
      ),
    );
    expect(plausibilitaetPruefen(ref)).toEqual([]);
  });

  it("ordnet Befunde Sachverhalt und Feld zu", () => {
    const m = {
      sachverhalte: [
        { analyse: { lage_ereignis: "ohne Zahlen" }, sofort: { bewertung_text: "D2 = 1, weil 300 Personen betroffen sind.", lagenradar: { d2: 1 } } },
        { analyse: { risiken_auswirkungen: "mindestens 10 Verletzte (Nord 4, Süd 4)" }, sofort: { bewertung_text: "", lagenradar: { d2: null } } },
      ],
    };
    expect(plausibilitaetPruefen(m as any).map((b) => [b.art, b.sachverhalt, b.feld])).toEqual([
      ["d2", 1, "sofort.lagenradar.d2"],
      ["summe", 2, "analyse.risiken_auswirkungen"],
    ]);
  });
});
