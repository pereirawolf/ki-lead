// Darstellung und Ausgabe für LEAD-Meldung-v2 (seit 0.7.3, UP-2026-W45-03): Quellenverzeichnis, Zeitstrahl,
// Kennzahlen und Entstehung als Text, Radarachsen als Objekte, Ausgabestatus mit Freigabe, Werte oder null im Schema,
// Dateiname mit Pfad-Platzhaltern, PDF. Unabhängiges Soll für die Quellenzeile: Das Werkzeug liest sie mit
// quellenV1() wieder in dieselben Felder zurück.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ausgabeStatus, dateiname } from "../../src/kern/ausgabe";
import { quellenV1 } from "../../src/kern/meldung-v2.js";
import { quellenFuerSachverhalt } from "../../src/kern/quellen";
import { aufloesen, leererWert, typen, unterSchema } from "../../src/kern/schema";
import { radarMitStufe, radarWerte, radarZeilen } from "../../src/kern/ui";
import {
  entstehungTextV2,
  kennzahlenTextV2,
  kennzahlWert,
  quellenverzeichnisV2,
  quellenZeileV2,
  zeitstrahlZeileV2,
  zitierteQuellen,
} from "../../src/kern/v2darstellung";
import { pruefeRoh } from "../../src/kern/validierung";
import { meldungAlsPdf } from "../../src/dokumente/pdf";
import { jsonDateien, profilPflicht, repoPfad } from "../support/dateien";
import { v2Profil } from "../support/v2profil";

const TH = () =>
  JSON.parse(readFileSync(repoPfad("formate/lead-meldung-v2/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json"), "utf-8"));
const sonneberg = () =>
  jsonDateien("profile/lead-thueringen/beispiele/orkantief-ilka-thessa", { pflicht: true }).find((b) => b.name.includes("Sonneberg_2026-10-14T10-00"))!.daten;

describe("UP-2026-W45-03: Quellenverzeichnis, Zeitstrahl, Kennzahlen, Entstehung", () => {
  it("Quellenzeile in der Form des Kodierleitfadens; das Werkzeug liest dieselben Felder zurück", () => {
    const m = TH();
    expect(quellenZeileV2(m.quellen[1])).toBe(
      "[Q2] A – Lagezentrum des TMIKL (14.10.2026): Lageübersicht Sturm 13./14.10., Fortschreibung 3 (FIKTIV) (behördenintern) [Zugriff: 14.10.2026]. Datenstand: 14.10.2026, 08:30",
    );
    const hinweise: string[] = [];
    const zurueck = quellenV1(quellenverzeichnisV2(m.quellen), "Europe/Berlin", hinweise);
    expect(zurueck).toHaveLength(m.quellen.length);
    m.quellen.forEach((q: any, i: number) => {
      // „öffentlich“ ohne Adresse ist aus einer Textzeile nicht ableitbar (Migration setzt null)
      const soll = q.zugang === "oeffentlich" && !q.url ? { ...q, zugang: null } : q;
      expect(zurueck[i], q.id).toEqual(soll);
    });
    const mitUrl = {
      id: "Q9",
      kategorie: "M",
      herausgeber: "Zeitung",
      titel: "Bericht",
      url: "https://example.org/a",
      zugriff: "2026-10-14",
      zugang: "paywall",
    };
    expect(quellenZeileV2(mitUrl)).toBe("[Q9] M – Zeitung: Bericht. Online abrufbar unter: https://example.org/a (Paywall) [Zugriff: 14.10.2026]");
    expect(quellenV1(quellenZeileV2(mitUrl), "Europe/Berlin", [])[0]).toEqual(mitUrl);
  });

  it("Zeitstrahlzeile mit Typ, Belegen, Berichtigung und Kenntniszeit", () => {
    expect(
      zeitstrahlZeileV2({
        id: "Z3",
        zeit: "2026-10-14T02:00+02:00",
        typ: "Maßnahme",
        text: "Krisenstab einberufen",
        quellen: ["Q3"],
        erstmals_gemeldet: "2026-10-14T10:30+02:00",
      }),
    ).toBe("[Z3] 14.10.2026, 02:00 · Maßnahme – Krisenstab einberufen [Q3] · aufgenommen 14.10.2026, 10:30");
    expect(zeitstrahlZeileV2({ id: "Z4", zeit: "2026-10-13", typ: "Berichtigung", text: "Beginn am Vortag", quellen: ["Q1"], berichtigt: "Z1" })).toBe(
      "[Z4] 13.10.2026 · Berichtigung – Beginn am Vortag (zu [Z1]) [Q1]",
    );
  });

  it("Kennzahlen: Teilmengen eingerückt unter der Obermenge, Mindestwert als „mindestens“, Bandbreite und unbekannt", () => {
    const k = TH().sachverhalte[1].kennzahlen;
    const zeilen = kennzahlenTextV2(k).split("\n");
    expect(zeilen.map((z) => z.match(/\[(K\d+)\]/)![1])).toEqual(["K1", "K2", "K3", "K4"]);
    expect(zeilen[2]).toMatch(/^ {3}└ \[K3\] Bewohnerinnen und Bewohner von Pflegeheimen auf Notstrom: 146 Personen \(bestand; gezaehlt;/);
    expect(zeilen[1]).toContain("9.800 Personen");
    const thessa = sonneberg().kennzahlen.find((x: any) => x.einheit === "Einsatzkräfte" && x.mindestwert);
    expect(`${kennzahlWert(thessa)} ${thessa.einheit}`).toBe("mindestens 53 Einsatzkräfte");
    expect(kennzahlWert({ wert: null, bandbreite: { von: 100, bis: 200 } })).toBe("100–200");
    expect(kennzahlWert({ wert: null })).toBe("unbekannt");
    // Bausteine mit tiefer Teilmengenkette (K6 Teilmenge von K4, K4 von K1)
    const baustein = kennzahlenTextV2(sonneberg().kennzahlen);
    expect(baustein).toMatch(/\n {6}└ \[K6\] im Einsatz gebunden: am Einsatzort: 12 Einsatzmittel/);
  });

  it("Entstehung in einer Zeile; Quellen eines Sachverhalts aus Texten und Belegen", async () => {
    const m = TH();
    const e = entstehungTextV2(m.entstehung);
    expect(e).toContain("KI-Entwurf");
    expect(e).toContain("Profil lead.beispiel.koordinierungsstelle 1.35.0");
    expect(e).toContain("Beigefügte SOP: B01 Unwetter / Sturm 2.0");
    expect(e).not.toContain("[object Object]");
    const sv = m.sachverhalte[1];
    expect([...zitierteQuellen(sv)].sort()).toEqual(["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]);
    const p = await v2Profil("land", { mitDarstellung: true });
    const q = quellenFuerSachverhalt(m.quellen, sv, p.ui)!;
    expect(q.map((x) => x.nr)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(q[0]!.text).toMatch(/^\[Q1\] A – Deutscher Wetterdienst/);
  });
});

describe("UP-2026-W45-03: Radarachsen als Objekte", () => {
  const def = { max: 6, achsen: [0, 1].map((i) => ({ key: `d${i + 1}`, label: `D${i + 1} Achse`, stufen: ["null", "eins", "zwei", "drei"] })) } as any;

  it("Stufen aus Objekten oder Zahlen; Mindestwert und Grund offener Achsen in der Legende", () => {
    expect(radarWerte({ d1: { stufe: 2, status: "belegt" }, d2: { stufe: null, status: "offen", offen_grund: "kein_beleg" } })).toEqual({ d1: 2, d2: null });
    expect(radarWerte({ d1: 3, d2: null })).toEqual({ d1: 3, d2: null });
    expect(radarZeilen(def, { d1: { stufe: 2, status: "mindestwert" }, d2: { stufe: null, status: "offen", offen_grund: "kein_beleg" } })).toEqual([
      "D1 Achse: 2 – zwei (Mindestwert)",
      "D2 Achse: offen (kein beleg)",
    ]);
    expect(radarZeilen(def, { d1: 1 })).toEqual(["D1 Achse: 1 – eins", "D2 Achse: offen"]);
  });

  it("Stufe setzen: Begründung und Belege bleiben, Status folgt der Stufe; v1 bleibt eine Zahlenliste", () => {
    const alt = {
      d1: { stufe: 2, status: "belegt", begruendung: "B", quellen: ["Q1"] },
      d2: { stufe: null, status: "offen", offen_grund: "kein_beleg", begruendung: "C", quellen: [] },
    };
    expect(radarMitStufe(def, alt, "d1", null).d1).toEqual({ stufe: null, status: "offen", offen_grund: "sonstiges", begruendung: "B", quellen: ["Q1"] });
    expect(radarMitStufe(def, alt, "d2", 3).d2).toEqual({ stufe: 3, status: "belegt", begruendung: "C", quellen: [] });
    expect(radarMitStufe(def, { d1: { stufe: 4, status: "mindestwert", begruendung: "", quellen: [] } }, "d1", 5).d1).toMatchObject({
      status: "mindestwert",
      stufe: 5,
    });
    expect(radarMitStufe(def, { d1: 1 }, "d2", 2)).toEqual({ d1: 1, d2: 2 });
  });
});

describe("UP-2026-W45-03: Schema, Status und Dateiname", () => {
  it("Wert oder null (anyOf mit null): Typ mit null, leerer Wert null", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    const zp = unterSchema(p.schema, ["meldezeitpunkt"]);
    expect(typen(zp)).toEqual(["string", "null"]);
    expect(zp.pattern).toBeTruthy();
    expect(leererWert(aufloesen(p.schema.properties.meldezeitpunkt, p.schema), p.schema)).toBeNull();
    expect(typen(unterSchema(p.schema, ["sachverhalte", 0, "eintritt", "zeit"]))).toEqual(["string", "null"]);
  });

  it("Ausgabestatus: Entwurf, zur Freigabe, freigegeben erst mit gezeichneter Freigabe; v1 unverändert", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    const m = TH();
    expect(ausgabeStatus(m, p.ui, false)).toBe("entwurf");
    expect(ausgabeStatus(m, p.ui, true)).toBe("freigegeben");
    const ohne = { ...m, freigabe: { erfasst: m.freigabe.erfasst } };
    expect(ausgabeStatus(ohne, p.ui, true)).toBe("zur_freigabe");
    for (const [d, st] of [
      [m, "freigegeben"],
      [ohne, "zur_freigabe"],
    ] as const)
      expect(pruefeRoh(p.schema, { ...d, status: st }), st).toEqual([]);
    const v1 = await profilPflicht("lead-beispiel");
    expect(ausgabeStatus({}, v1.ui, true)).toBe("final");
  });

  it("Dateiname mit Pfad-Platzhaltern der Darstellungsdatei", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    expect(dateiname(TH(), p, false)).toMatch(/^2026-10-14T10-30_LEAD-Meldung-v2_Thüringen_Thüringer_Ministerium/);
  });
});

describe("UP-2026-W45-03: Kopiervorlage des Lagebilds", () => {
  it("Sachverhalt nach v2: zitierte Quellen, Kennzahlen mit Teilmengen, keine rohen Objekte", async () => {
    const { alleSachverhalte, einlesen } = await import("../../src/lagebild/lagebild");
    const { kopiervorlageHtml } = await import("../../src/lagebild/ausgabe");
    const p = await v2Profil("land", { mitDarstellung: true });
    const { eintraege } = einlesen([{ name: "th.json", text: JSON.stringify(TH()), importiertAm: "" }], p);
    const svs = alleSachverhalte(eintraege, p);
    const h = kopiervorlageHtml(
      svs.find((x) => x.index === 1)!,
      p,
    );
    expect(h).not.toContain("object Object");
    expect(h).toContain("[Q1] A – Deutscher Wetterdienst");
    expect(h).toContain("└ [K3] Bewohnerinnen und Bewohner von Pflegeheimen auf Notstrom: 146 Personen");
    expect(h).not.toContain("[Q7]");
    const { rohtabelle } = await import("../../src/lagebild/ausgabe");
    const tabelle = rohtabelle(eintraege, p);
    const spalte = tabelle[0]!.indexOf("Quellen & Referenzen (Meldung)");
    expect(spalte).toBeGreaterThan(-1);
    expect(tabelle[1]![spalte]).toMatch(/^\[Q1\] A – Deutscher Wetterdienst/);
    expect(tabelle.flat().join(" ")).not.toContain("object Object");
  });
});

describe("UP-2026-W45-03: PDF einer Meldung nach LEAD-Meldung-v2", () => {
  it("Quellenverzeichnis, Kennzahlen mit Mindestwert, Entstehung und Bewertung lesbar; keine rohen Objekte", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    const m = TH();
    const k13 = sonneberg().kennzahlen.find((x: any) => x.einheit === "Einsatzkräfte" && x.mindestwert);
    m.sachverhalte[1].kennzahlen.push({ ...k13, id: "K5", quellen: ["Q3"] });
    expect(pruefeRoh(p.schema, m)).toEqual([]);
    const blob = meldungAlsPdf(m, p, false);
    const text = new TextDecoder("latin1").decode(new Uint8Array(await blob.arrayBuffer()));
    expect(text).not.toContain("object Object");
    expect(text).toContain("[Q1] A ");
    expect(text).toContain("mindestens 53 Einsatzkr");
    expect(text).toContain("KI-Entwurf");
    expect(text).toContain("Kernaussage");
    expect(text).toContain("Bewertung › Abweichende");
    expect(text).toContain("Indikator");
    expect(text).toMatch(/D1 R.umliche Auswirkung \/ Impact-Raum: \d/);
  });
});

describe("KL-2026-W45-01: Betreibermeldung ohne bewertung in Lagebild und Ausgabe", () => {
  it("einlesen, Kopiervorlage, Rohtabelle und PDF ohne Fehler und ohne rohe Werte", async () => {
    const { alleSachverhalte, einlesen } = await import("../../src/lagebild/lagebild");
    const { kopiervorlageHtml, rohtabelle } = await import("../../src/lagebild/ausgabe");
    const { stelleSchemaZusammen } = await import("../../src/kern/meldung-v2.js");
    const p = await v2Profil("land", { mitDarstellung: true });
    p.schema = stelleSchemaZusammen(
      {
        format: "lead-meldung-v2-zusammenstellung/1",
        $id: "https://example.org/test/meldung.schema.json",
        title: "Test: Kern ohne Einschränkungen",
        kern: "kern.schema.json",
        module: { "lead-bevoelkerungsschutz": { datei: "module/lead-bevoelkerungsschutz.schema.json", pflicht: false } },
      },
      (d: string) => JSON.parse(readFileSync(repoPfad(`formate/lead-meldung-v2/${d}`), "utf-8")),
    );
    const m = TH();
    m.status = "freigegeben";
    m.absender = { stelle: "Netzbetreiber Süd (FIKTIV)", ebene: "Betreiber", gebiet: { name: "Thüringen" } };
    for (const s of m.sachverhalte) {
      delete s.bewertung;
      delete s.module["lead-bevoelkerungsschutz"];
    }
    expect(pruefeRoh(p.schema, m)).toEqual([]);
    const { eintraege, fehler } = einlesen([{ name: "betreiber.json", text: JSON.stringify(m), importiertAm: "" }], p);
    expect(fehler).toEqual([]);
    const svs = alleSachverhalte(eintraege, p);
    expect(svs).toHaveLength(2);
    for (const sv of svs) {
      expect(sv.beurteilung).toBe("");
      const h = kopiervorlageHtml(sv, p);
      expect(h).not.toContain("undefined");
      expect(h).not.toContain("object Object");
    }
    expect(rohtabelle(eintraege, p).flat().join(" ")).not.toMatch(/undefined|object Object/);
    const text = new TextDecoder("latin1").decode(new Uint8Array(await meldungAlsPdf(m, p, false).arrayBuffer()));
    expect(text).not.toMatch(/undefined|object Object/);
  });
});
