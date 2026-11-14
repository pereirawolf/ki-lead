// Rechenhilfe für Kennzahlen aus mehreren Kennzahlen-Bausteinen (seit 0.8.2, UP-2026-W45-05; Paket 5 des
// Umstellungsplans) und die Prüfungen nach S2. Soll unabhängig vom Code: die unveränderten fiktiven Bausteine aus Thessa
// (Orkantief „Ilka“) und KSNV, von Hand gerechnete Summen und von Hand abgewandelte Kopien.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { erkenneBaustein, type BausteinInfo } from "../../src/kern/baustein";
import { bausteinAbgleich, bausteinQuellen } from "../../src/kern/bausteinabgleich";
import {
  AUSSCHNITT_ZUSATZ,
  ausschnittRaum,
  istAusschnitt,
  kennzahlPruefungV2,
  rechenhilfe,
  rechenhilfeNoetig,
  rechenhilfeText,
  summenpruefung,
  unzulaessigeSumme,
  type RhGruppe,
  type VerdichtungsBaustein,
} from "../../src/kern/bausteinverdichtung";
import { BAUSTEIN_SCHEMATA } from "../../src/pipeline/bausteinschemata";
import { jsonDateien, profilPflicht, repoPfad } from "../support/dateien";

const THESSA = "profile/lead-thueringen/beispiele/orkantief-ilka-thessa/";
const ILM = "kennzahlen_Ilm-Kreis_2026-10-14T10-00_FIKTIV.json";
const HBN = "kennzahlen_Landkreis-Hildburghausen_2026-10-14T10-00_FIKTIV.json";
const SON10 = "kennzahlen_Landkreis-Sonneberg_2026-10-14T10-00_FIKTIV.json";
const SON1030 = "kennzahlen_Landkreis-Sonneberg_2026-10-14T10-30_FIKTIV.json";
const TH = "kennzahlen_Thueringen_2026-10-14T10-30_FIKTIV.json";
const kopie = <T>(x: T): T => JSON.parse(JSON.stringify(x));

function baustein(name: string, daten?: Record<string, any>): VerdichtungsBaustein {
  const d = daten ?? JSON.parse(readFileSync(repoPfad(THESSA + name), "utf-8"));
  const e = erkenneBaustein(d, BAUSTEIN_SCHEMATA);
  if (e?.status !== "gueltig") throw new Error(`${name}: kein gültiger Baustein`);
  return { name, info: e.info, daten: d };
}
/** Abnahme der Befunddatei: drei Kreis-Bausteine 10:00 Uhr und der Land-Baustein 10:30 Uhr */
const abnahme = () => [baustein(ILM), baustein(HBN), baustein(SON10), baustein(TH)];
const gruppe = (g: RhGruppe[], gegenstand: string, datenstand: string) => g.find((x) => x.gegenstand === gegenstand && x.datenstand.startsWith(datenstand));

describe("UP-2026-W45-05: Rechenhilfe aus Kennzahlen-Bausteinen (Abnahme nach der Befunddatei)", () => {
  it("drei Kreise 10:00 Uhr: zulässige Summe nur über die Kreise, von Hand gerechnet; keine Gruppe über verschiedene Datenstände", () => {
    const rh = rechenhilfe(abnahme());
    const einsatzbereit = gruppe(rh.gruppen, "einsatzbereit", "2026-10-14T10:00")!;
    expect(einsatzbereit.eintraege.map((e) => [e.raum, e.wert])).toEqual([
      ["Ilm-Kreis", 22],
      ["Landkreis Hildburghausen", 20],
      ["Landkreis Sonneberg", 37],
    ]);
    expect(einsatzbereit.ergebnis).toEqual({ art: "summe", wert: 79, mindestwert: false, ausschnitt: false });
    // Einsätze nach Einsatzort: 3 + 0 + 8
    expect(gruppe(rh.gruppen, "laufende Einsätze im Gebiet (nach Einsatzort)", "2026-10-14T10:00")!.ergebnis).toMatchObject({ art: "summe", wert: 11 });
    // Der Land-Baustein (10:30) steht mit keinem Kreis (10:00) in einer Gruppe; jede Gruppe hat eine Einheit, Art und einen Datenstand
    for (const g of rh.gruppen) {
      expect(new Set(g.eintraege.map((e) => e.baustein)).size, g.gegenstand).toBeGreaterThan(1);
      expect(
        g.eintraege.some((e) => e.raum === "Thüringen"),
        g.gegenstand,
      ).toBe(false);
    }
    // Gegenstände, die nur Sonneberg mit „Einrichtungen ohne Feuerwehr“ führt, bilden keine Summe mit den anderen Kreisen
    expect(gruppe(rh.gruppen, "Einsatzmittel der Feuerwehren gesamt", "2026-10-14T10:00")!.eintraege.map((e) => e.raum)).toEqual([
      "Ilm-Kreis",
      "Landkreis Hildburghausen",
    ]);
  });

  it("Einsatzkräfte mit Meldequote (K13/K14 Sonneberg) getrennt je Raum, mit der Quote je Raum", () => {
    const rh = rechenhilfe(abnahme());
    const tags = gruppe(rh.gruppen, "regelmäßig verfügbare Einsatzkräfte werktags tagsüber", "2026-10-14T10:00")!;
    expect(tags.ergebnis.art).toBe("getrennt");
    expect(tags.eintraege.map((e) => [e.raum, e.kennzahl, e.wert, e.quote])).toEqual([
      ["Ilm-Kreis", "K12", 38, "7 von 8 Feuerwehren gemeldet"],
      ["Landkreis Hildburghausen", "K12", 31, "7 von 8 Feuerwehren gemeldet"],
      ["Landkreis Sonneberg", "K13", 53, "11 von 12 Feuerwehren gemeldet"],
    ]);
    const nachts = gruppe(rh.gruppen, "regelmäßig verfügbare Einsatzkräfte abends, nachts und am Wochenende", "2026-10-14T10:00")!;
    expect(nachts.ergebnis.art).toBe("getrennt");
    expect(nachts.eintraege.find((e) => e.raum === "Landkreis Sonneberg")).toMatchObject({ kennzahl: "K14", wert: 149, mindestwert: true });
    expect(rechenhilfeText(rh)).not.toMatch(/Summe zulässig: mind\. (69|184|122|283)/);
  });

  it("Land-Baustein: erfasster Ausschnitt, Vollständigkeit nicht angegeben; mit Sonneberg 10:30 gilt für Thüringen der Land-Baustein statt einer Summe", () => {
    const th = baustein(TH);
    expect(istAusschnitt(th.info)).toBe(true);
    expect(istAusschnitt(baustein(SON10).info)).toBe(false);
    expect(ausschnittRaum("Thüringen")).toBe("Thüringen (erfasster Ausschnitt, Vollständigkeit nicht angegeben)");
    expect(ausschnittRaum(ausschnittRaum("Thüringen"))).toBe(ausschnittRaum("Thüringen"));
    const text = rechenhilfeText(rechenhilfe(abnahme()));
    expect(text).toContain(`B4: Thüringen (16), Datenstand 14.10.2026, 10:30, Thessa – ${AUSSCHNITT_ZUSATZ}`);
    const rh = rechenhilfe([...abnahme(), baustein(SON1030)]);
    expect(rh.mehrereStaende).toEqual([{ raum: "Landkreis Sonneberg", staende: ["2026-10-14T10:00+02:00", "2026-10-14T10:30+02:00"] }]);
    const gesamt = gruppe(rh.gruppen, "Einsatzmittel der Feuerwehren und der Einrichtungen ohne Feuerwehr gesamt", "2026-10-14T10:30")!;
    expect(gesamt.eintraege.map((e) => [e.raum, e.wert])).toEqual([
      ["Thüringen", 151],
      ["Landkreis Sonneberg", 55],
    ]);
    expect(gesamt.ergebnis).toMatchObject({ art: "uebergeordnet", eintrag: { raum: "Thüringen", wert: 151, ausschnitt: true } });
    expect(rechenhilfeText(rh)).toContain(`Thüringen (${AUSSCHNITT_ZUSATZ}) 151 [B4 K1]`);
    // keine Summe 151 + 55
    expect(rechenhilfeText(rh)).not.toContain("206");
  });

  it("Einsatzmeldungen je Kennung einmal: EM-20261014-UNBF in Sonneberg gezählt (im Gebiet), in Hildburghausen helfend, im Land enthalten", () => {
    const rh = rechenhilfe([...abnahme(), baustein(SON1030)]);
    expect(rh.einsatzmeldungen.filter((e) => e.id === "EM-20261014-UNBF")).toEqual([
      {
        id: "EM-20261014-UNBF",
        stichwort: "Überörtliche Hilfe: Dieseltransport für Netzersatzanlagen",
        gemeinde: "Stadt Neuhaus am Rennweg",
        zaehlort: "Landkreis Sonneberg",
        auch: ["Landkreis Hildburghausen (helfend)", "Thüringen"],
      },
    ]);
    // sieben verschiedene Kennungen (sechs aus Sonneberg, eine nur im Land-Baustein)
    expect(rh.einsatzmeldungen.map((e) => e.id).sort()).toEqual(
      ["EM-20261013-5KFK", "EM-20261013-ZFB2", "EM-20261014-KBH7", "EM-20261014-KUGL", "EM-20261014-N5X2", "EM-20261014-UNBF", "EM-20261014-VTP2"].sort(),
    );
    expect(rh.einsatzmeldungen.find((e) => e.id === "EM-20261013-ZFB2")!.zaehlort).toBe("Thüringen");
  });

  it("Rechenhilfe nur bei mindestens zwei Bausteinen oder einem Ausschnitt", () => {
    expect(rechenhilfeNoetig([baustein(SON10)])).toBe(false);
    expect(rechenhilfeNoetig([baustein(TH)])).toBe(true);
    expect(rechenhilfeNoetig([baustein(ILM), baustein(HBN)])).toBe(true);
  });
});

describe("UP-2026-W45-05: Regeln der Rechenhilfe an abgewandelten Bausteinen", () => {
  /** Kopie eines Bausteins mit anderem Raum und abgewandelten Kennzahlen (Prüfung gegen das Schema bleibt gültig) */
  function abwandeln(name: string, raum: { name: string; schluessel: string }, k: (liste: any[]) => void): VerdichtungsBaustein {
    const d = kopie(JSON.parse(readFileSync(repoPfad(THESSA + name), "utf-8")));
    d.raum = raum;
    for (const x of d.kennzahlen) x.raum = raum.name;
    k(d.kennzahlen);
    return baustein(`${raum.name}.json`, d);
  }

  it("Mindestwert pflanzt sich fort; geschätzte Werte und Räume ohne Gebietsschlüssel nicht summieren", () => {
    const a = abwandeln(ILM, { name: "Kreis A", schluessel: "16071" }, (l) => (l[0].mindestwert = true));
    const b = abwandeln(HBN, { name: "Kreis B", schluessel: "16066" }, () => {});
    const g = gruppe(rechenhilfe([a, b]).gruppen, "Einsatzmittel der Feuerwehren gesamt", "2026-10-14T10:00")!;
    expect(g.ergebnis).toEqual({ art: "summe", wert: 51, mindestwert: true, ausschnitt: false });
    expect(rechenhilfeText(rechenhilfe([a, b]))).toContain("Summe zulässig: mind. 51 (Summe aus 2 Räumen, Mindestwert");
    const geschaetzt = abwandeln(HBN, { name: "Kreis B", schluessel: "16066" }, (l) => (l[0].erhebung = "geschaetzt"));
    expect(gruppe(rechenhilfe([a, geschaetzt]).gruppen, "Einsatzmittel der Feuerwehren gesamt", "2026-10-14T10:00")!.ergebnis.art).toBe("getrennt");
    const ohneSchluessel = abwandeln(HBN, { name: "Kreis C", schluessel: "16066" }, (l) => (l[0].raum = "Gemeinde ohne Schlüssel"));
    expect(gruppe(rechenhilfe([a, ohneSchluessel]).gruppen, "Einsatzmittel der Feuerwehren gesamt", "2026-10-14T10:00")!.ergebnis).toEqual({
      art: "getrennt",
      grund: "Raum ohne Gebietsschlüssel, Überschneidung nicht prüfbar; keine Summe",
    });
  });

  it("überlappende Räume ohne gemeinsame Obermenge getrennt; derselbe Raum mit gleichem Wert einmal", () => {
    const kreis = abwandeln(ILM, { name: "Kreis A", schluessel: "16070" }, () => {});
    const gemeinde = abwandeln(HBN, { name: "Gemeinde in A", schluessel: "16070001" }, () => {});
    const anderer = abwandeln(HBN, { name: "Kreis B", schluessel: "16069" }, () => {});
    const g = gruppe(rechenhilfe([kreis, gemeinde, anderer]).gruppen, "einsatzbereit", "2026-10-14T10:00")!;
    expect(g.ergebnis).toEqual({ art: "getrennt", grund: "Räume überschneiden sich; keine Summe" });
    const doppelt = gruppe(
      rechenhilfe([kreis, abwandeln(ILM, { name: "Kreis A", schluessel: "16070" }, () => {})]).gruppen,
      "einsatzbereit",
      "2026-10-14T10:00",
    )!;
    expect(doppelt.ergebnis).toMatchObject({ art: "uebergeordnet", eintrag: { wert: 22 }, grund: "derselbe Raum in mehreren Bausteinen; einmal zählen" });
  });
});

describe("UP-2026-W45-05: Prüfungen nach S2", () => {
  it("unzulässige Summen über Datenstand, überlappende Räume und Meldequote; zulässige Summen und Einzelwerte bleiben frei", () => {
    const p = summenpruefung([...abnahme(), baustein(SON1030)]);
    // Ilm-Kreis K2 (22, 10:00) + Thüringen K2 (123, 10:30): Datenstand und Raum
    expect(unzulaessigeSumme(p, 145, "Einsatzmittel")?.gruende).toEqual(["verschiedene Datenstände", "überlappende Räume"]);
    // Sonneberg 10:00 + 10:30 (37 + 36): derselbe Raum zu zwei Zeitpunkten
    expect(unzulaessigeSumme(p, 73, "Einsatzmittel")?.gruende).toEqual(["verschiedene Datenstände", "überlappende Räume"]);
    // Einsatzkräfte mit Meldequote: 38 + 31 und 38 + 31 + 53
    expect(unzulaessigeSumme(p, 69, "Einsatzkräfte")?.gruende).toEqual(["Meldequote je Raum"]);
    expect(unzulaessigeSumme(p, 122, "Einsatzkräfte")?.gruende).toEqual(["Meldequote je Raum"]);
    // zulässig (drei Kreise 10:00) und Einzelwert des Bausteins
    expect(unzulaessigeSumme(p, 79, "Einsatzmittel")).toBeUndefined();
    expect(unzulaessigeSumme(p, 151, "Einsatzmittel")).toBeUndefined();
    // andere Einheit: kein Treffer
    expect(unzulaessigeSumme(p, 145, "Einsätze")).toBeUndefined();
  });

  it("LEAD-Meldung-v2: Summe über Datenstände, Ausschnitt als landesweiter Wert, Beleg-Hinweis mit Belegachsen nach Thessa", () => {
    const bausteine = [...abnahme(), baustein(SON1030)];
    const th = bausteine.find((b) => b.name === TH)!;
    const son = bausteine.find((b) => b.name === SON1030)!;
    const q = (b: VerdichtungsBaustein, id: string) => ({ id, ...(({ id: _i, ...r }) => r)(b.daten.quellen[0]) });
    const d = {
      quellen: [q(son, "Q1"), q(th, "Q2"), { id: "Q3", kategorie: "A", herausgeber: "Lagezentrum", titel: "Lageübersicht" }],
      sachverhalte: [
        {
          kennzahlen: [
            { id: "K1", gegenstand: "einsatzbereit", einheit: "Einsatzmittel", art: "bestand", wert: 73, raum: "Landkreis Sonneberg", quellen: ["Q1"] },
            { id: "K2", gegenstand: "einsatzbereit", einheit: "Einsatzmittel", art: "bestand", wert: 123, raum: "Thüringen", quellen: ["Q2"] },
            { id: "K3", gegenstand: "Einsätze landesweit", einheit: "Einsätze", art: "bestand", wert: 1400, raum: "Thüringen", quellen: ["Q3"] },
            { id: "K4", gegenstand: "einsatzbereit", einheit: "Einsatzmittel", art: "bestand", wert: 36, raum: "Landkreis Sonneberg", quellen: ["Q1"] },
          ],
          module: {
            "lead-baustein": {
              fassung: "1.0",
              bausteine: [{ format: "Thessa-Kennzahlen", fassung: "0.3", quelle: "Q1", kennzahlen: [{ kennzahl: "K4", baustein_kennzahl: "K2" }] }],
            },
          },
        },
      ],
    };
    const befunde = kennzahlPruefungV2(d, bausteine, "lead-baustein", true);
    expect(befunde.map((b) => [b.code, b.stufe])).toEqual([
      ["KENNZAHL_SUMME_UNZULAESSIG", "warnung"],
      ["KENNZAHL_LANDESWEIT", "warnung"],
      ["KENNZAHL_BELEG", "hinweis"],
    ]);
    expect(befunde[0]!.text).toContain("Sachverhalt 1 K1: 73 = ");
    expect(befunde[0]!.text).not.toContain("K4");
    expect(befunde[1]!.text).toContain("Sachverhalt 1 K2 (Thüringen");
    expect(befunde[1]!.text).not.toContain("K3");
    expect(befunde[2]!.text).toContain("mögliche Belegachsen nach Thessa: D1, D4, D5, D8");
    expect(befunde[2]!.text).toContain("die App setzt keine Stufe");
    // Profil ohne Lagenradar: keine Achsen
    expect(kennzahlPruefungV2(d, bausteine, "lead-baustein", false)[2]!.text).not.toContain("D1");
    // mit Kennzeichnung des Ausschnitts kein KENNZAHL_LANDESWEIT
    d.sachverhalte[0]!.kennzahlen[1]!.raum = ausschnittRaum("Thüringen");
    expect(kennzahlPruefungV2(d, bausteine, "lead-baustein", true).map((b) => b.code)).not.toContain("KENNZAHL_LANDESWEIT");
  });

  it("KSNV: Belegachsen nicht bekannt, nur der allgemeine Hinweis; Land-Baustein als Ausschnitt", () => {
    const ksnv = jsonDateien("formate/fremd/ksnv-kennzahlen/beispiele", { pflicht: true }).map((x) => {
      const e = erkenneBaustein(x.daten, BAUSTEIN_SCHEMATA) as { status: "gueltig"; info: BausteinInfo };
      return { name: x.name, info: e.info, daten: x.daten };
    });
    const land = ksnv.find((b) => b.info.raum.schluessel === "16")!;
    expect(istAusschnitt(land.info)).toBe(true);
    const d = {
      quellen: [{ id: "Q1", ...(({ id: _i, ...r }) => r)(land.daten.quellen[0]) }],
      sachverhalte: [
        {
          kennzahlen: [],
          module: {
            "lead-baustein": { fassung: "1.0", bausteine: [{ format: "KSNV-Kennzahlen", kennzahlen: [{ kennzahl: "K1", baustein_kennzahl: "K1" }] }] },
          },
        },
      ],
    };
    const b = kennzahlPruefungV2(d, ksnv, "lead-baustein", true);
    expect(b.map((x) => x.code)).toEqual(["KENNZAHL_BELEG"]);
    expect(b[0]!.text).not.toMatch(/Belegachsen/);
  });

  it("LEAD-Meldung-v1: Zahl im Text als unzulässige Summe statt Abweichung; zulässige Summe ohne Hinweis; Landeszahl ohne Kennzeichnung als Ausschnitt", async () => {
    const p = await profilPflicht("lead-thueringen");
    const ordner = "profile/lead-thueringen/beispiele/orkantief-ilka";
    const meldungen = jsonDateien(ordner, { pflicht: true }).map((x) => x.daten);
    const son = kopie(meldungen.find((m: any) => m.kreis === "Landkreis Sonneberg"));
    const bausteine = abnahme();
    const nr = bausteinQuellen(son.quellen, bausteine[2]!.info)[0];
    son.sachverhalte[0].analyse.massnahmen_empfehlungen += ` Mit Ilm-Kreis und Hildburghausen sind 79 Einsatzmittel einsatzbereit [Q${nr}]. Zusammen mit dem Land sind 160 Einsatzmittel einsatzbereit [Q${nr}].`;
    const alle = bausteinAbgleich(son, p.ui, bausteine);
    // die drei übrigen Bausteine stehen nicht im Quellenverzeichnis der Kreismeldung (bisheriger Hinweis)
    expect(alle.filter((b) => b.code === "BAUSTEIN_OHNE_BELEG")).toHaveLength(3);
    const befunde = alle.filter((b) => b.code !== "BAUSTEIN_OHNE_BELEG");
    expect(befunde.map((b) => b.code)).toEqual(["KENNZAHL_SUMME_UNZULAESSIG", "KENNZAHL_BELEG"]);
    expect(befunde[0]!.text).toContain("160 Einsatzmittel");
    expect(befunde[0]!.text).toContain("verschiedene Datenstände, überlappende Räume");
    expect(befunde[0]!.text).not.toContain("79");

    const land = kopie(meldungen.find((m: any) => m.kreis === "Thüringen"));
    expect(bausteinAbgleich(land, p.ui, [bausteine[3]!]).map((b) => b.code)).toEqual(["KENNZAHL_BELEG"]);
    const ohneKennzeichnung = JSON.parse(
      JSON.stringify(land).replace("Im erfassten Ausschnitt von fünf Kreisen – kein landesweiter Wert – sind", "In Thüringen sind"),
    );
    const b = bausteinAbgleich(ohneKennzeichnung, p.ui, [bausteine[3]!]);
    expect(b.map((x) => x.code)).toEqual(["KENNZAHL_LANDESWEIT", "KENNZAHL_BELEG"]);
    expect(b[0]!.text).toContain("In Thüringen sind um 10:30 Uhr 18 von 151 Einsatzmitteln");
  });
});
