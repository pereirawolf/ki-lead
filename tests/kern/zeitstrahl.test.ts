// Zeitstrahl je Sachverhalt, Sachverhaltskennung und Bezug (seit 0.6.9, ZS-2026-W44-01 bis -03): Zeilenform, Ordnung,
// formale Hinweise mit stabilen Codes, Vergabe der Kennung und Verweise des Zeitstrahls im Quellenverzeichnis.
import { beforeAll, describe, expect, it } from "vitest";
import { istKennung, KENNUNG_RE, neueKennung, praefixFuer } from "../../src/kern/kennung";
import { quellenFuerSachverhalt, quellenHinweise } from "../../src/kern/quellen";
import type { Profil } from "../../src/kern/typen";
import { ausfuellHinweise } from "../../src/kern/kennsaetze";
import {
  chronologisch,
  eintraegeFuer,
  istZeitstrahlZeit,
  naechsteZNr,
  parseZeitstrahl,
  zeitstrahlHinweise,
  zeitstrahlOrdnen,
  zeitstrahlZeile,
} from "../../src/kern/zeitstrahl";
import { profilPflicht } from "../support/dateien";
import { ilkaMeldung, ILKA_KENNUNGEN } from "../support/fixtures";

let p: Profil;
beforeAll(async () => {
  p = await profilPflicht("lead-beispiel");
});

const K1 = "DE-TH-20261014-K7QM";
const K2 = "DE-TH-20261014-P5VN";

/** Meldung mit zwei Sachverhalten und frei wählbarem Zeitstrahl */
function meldung(zeitstrahl: string, kennungen: (string | undefined)[] = [K1, K2]) {
  const d = ilkaMeldung("TH");
  d.sachverhalte.forEach((sv: any, i: number) => {
    if (kennungen[i] === undefined) delete sv.kennung;
    else sv.kennung = kennungen[i];
  });
  d.zeitstrahl = zeitstrahl;
  d.quellen = "[Q1] A – DWD (13.10.2026): Warnlagebericht [Zugriff: 13.10.2026]\n[Q2] A – Landkreis (14.10.2026): Lage [Zugriff: 14.10.2026]";
  for (const sv of d.sachverhalte) {
    for (const k of Object.keys(sv.analyse)) sv.analyse[k] = "";
    sv.sofort.bewertung_text = "Kernaussage [Q1].";
  }
  return d;
}
const codes = (d: any) => zeitstrahlHinweise(d, p.ui).map((b) => b.code);

describe("ZS-2026-W44-01: Zeilenform und Ordnung", () => {
  it("liest Nummer, Zeitpunkt, Kennung, Typ und Text; „|“ und „-“ als Ersatzzeichen", () => {
    const l = parseZeitstrahl(
      `[Z2] 2026-10-14T02:00 · ${K2} · Maßnahme – Krisenstab einberufen [Q2]\n\n[Z1] 2026-10-13 | ${K1} | Warnung - DWD warnt [Q1]\nfreie Zeile`,
    );
    expect(l.eintraege).toEqual([
      {
        nr: 2,
        zeit: "2026-10-14T02:00",
        kennung: K2,
        typ: "Maßnahme",
        text: "Krisenstab einberufen [Q2]",
        zeile: `[Z2] 2026-10-14T02:00 · ${K2} · Maßnahme – Krisenstab einberufen [Q2]`,
        zeilenNr: 1,
      },
      {
        nr: 1,
        zeit: "2026-10-13",
        kennung: K1,
        typ: "Warnung",
        text: "DWD warnt [Q1]",
        zeile: `[Z1] 2026-10-13 | ${K1} | Warnung - DWD warnt [Q1]`,
        zeilenNr: 3,
      },
    ]);
    expect(l.ungueltig).toEqual([{ zeilenNr: 4, zeile: "freie Zeile" }]);
  });

  it("feste Form beim Schreiben; ein Gedankenstrich im Text bleibt Teil des Texts", () => {
    expect(zeitstrahlZeile({ nr: 3, zeit: "2026-10-14", kennung: K1, typ: "Ereignis", text: "A 71 gesperrt – Baumwürfe [Q2]" })).toBe(
      `[Z3] 2026-10-14 · ${K1} · Ereignis – A 71 gesperrt – Baumwürfe [Q2]`,
    );
    expect(parseZeitstrahl(`[Z3] 2026-10-14 · ${K1} · Ereignis – A 71 gesperrt – Baumwürfe [Q2]`).eintraege[0]).toMatchObject({
      typ: "Ereignis",
      text: "A 71 gesperrt – Baumwürfe [Q2]",
    });
  });

  it("chronologisch; ein Tag ohne Uhrzeit vor den Uhrzeiten desselben Tags; bei Gleichstand nach Nummer", () => {
    const e = [
      { nr: 4, zeit: "2026-10-14T06:00" },
      { nr: 3, zeit: "2026-10-14" },
      { nr: 2, zeit: "2026-10-13T22:30" },
      { nr: 1, zeit: "2026-10-14T06:00" },
    ];
    expect(chronologisch(e).map((x) => x.nr)).toEqual([2, 3, 1, 4]);
  });

  it("„Chronologisch ordnen“ behält Zeilen außerhalb der Form am Ende", () => {
    const text = `[Z2] 2026-10-14 · ${K1} · Ereignis – B [Q1]\nNotiz\n[Z1] 2026-10-13 · ${K1} · Ereignis – A [Q1]`;
    expect(zeitstrahlOrdnen(text)).toBe(`[Z1] 2026-10-13 · ${K1} · Ereignis – A [Q1]\n[Z2] 2026-10-14 · ${K1} · Ereignis – B [Q1]\nNotiz`);
  });

  it("Einträge je Sachverhalt und nächste freie Nummer", () => {
    const text = `[Z5] 2026-10-14 · ${K2} · Ereignis – B [Q1]\n[Z2] 2026-10-13 · ${K1} · Ereignis – A [Q1]`;
    expect(eintraegeFuer(text, K1).map((e) => e.nr)).toEqual([2]);
    expect(eintraegeFuer(text, "")).toEqual([]);
    expect(naechsteZNr(text)).toBe(6);
    expect(naechsteZNr("")).toBe(1);
  });

  it("Zeitpunkt kalendarisch geprüft", () => {
    expect(["2026-10-14", "2026-10-14T23:59", "2028-02-29"].map(istZeitstrahlZeit)).toEqual([true, true, true]);
    expect(["2026-02-30", "2026-10-14T24:00", "14.10.2026", "2026-10-14T6:00"].map(istZeitstrahlZeit)).toEqual([false, false, false, false]);
  });
});

describe("ZS-2026-W44-01: formale Hinweise zum Zeitstrahl", () => {
  it("gültiger Zeitstrahl ohne Befund", () => {
    const d = meldung(`[Z1] 2026-10-13T13:00 · ${K1} · Warnung – DWD warnt [Q1]\n[Z2] 2026-10-14T02:00 · ${K2} · Maßnahme – Krisenstab [Q2]`);
    expect(zeitstrahlHinweise(d, p.ui)).toEqual([]);
  });

  it("je Fehler ein Code mit fester Stufe", () => {
    const d = meldung(
      [
        "Freitext ohne Form",
        `[Z1] 2026-02-30 · ${K1} · Ereignis – Datum gibt es nicht [Q1]`,
        `[Z2] 2026-10-15 · ${K1} · Ereignis – nach dem Meldezeitpunkt [Q1]`,
        `[Z3] 2026-10-13 · DE-HE-20261014-6RWA · Ereignis – fremde Kennung [Q1]`,
        `[Z4] 2026-10-13 · ${K1} · Gerücht – unbekannter Typ [Q1]`,
        `[Z5] 2026-10-13 · ${K1} · Ereignis – ohne Beleg`,
        `[Z5] 2026-10-13 · ${K1} · Berichtigung – ohne Bezug [Q1]`,
        `[Z6] 2026-10-12 · ${K1} · Bewertung – Beurteilung erheblich → kritisch`,
      ].join("\n"),
    );
    const h = zeitstrahlHinweise(d, p.ui);
    const stufe = (code: string) => [...new Set(h.filter((b) => b.code === code).map((b) => b.stufe))];
    expect(stufe("ZEITSTRAHL_FORMAT")).toEqual(["warnung"]);
    expect(stufe("ZEITSTRAHL_ZEIT")).toEqual(["warnung"]);
    expect(stufe("ZEITSTRAHL_NACH_T0")).toEqual(["warnung"]);
    expect(stufe("ZEITSTRAHL_KENNUNG_UNBEKANNT")).toEqual(["warnung"]);
    expect(stufe("ZEITSTRAHL_TYP")).toEqual(["warnung"]);
    expect(stufe("ZEITSTRAHL_OHNE_BELEG")).toEqual(["warnung"]);
    expect(stufe("ZEITSTRAHL_NUMMER_DOPPELT")).toEqual(["warnung"]);
    expect(stufe("ZEITSTRAHL_BERICHTIGUNG")).toEqual(["hinweis"]);
    expect(stufe("ZEITSTRAHL_REIHENFOLGE")).toEqual(["hinweis"]);
    // Bewertungszeilen brauchen keinen Quellenverweis: genau eine Zeile ohne Beleg wird gemeldet ([Z5] Ereignis)
    expect(h.filter((b) => b.code === "ZEITSTRAHL_OHNE_BELEG").map((b) => b.text)).toEqual(["[Z5] hat keinen Quellenverweis [Qn]."]);
  });

  it("Zeitpunkt am Meldetag ohne Uhrzeit ist nicht „nach t0“, eine spätere Uhrzeit desselben Tags schon", () => {
    // Meldezeitpunkt der Thüringer Meldung: 2026-10-14T10:30
    expect(codes(meldung(`[Z1] 2026-10-14 · ${K1} · Ereignis – am Meldetag [Q1]`))).toEqual([]);
    expect(codes(meldung(`[Z1] 2026-10-14T10:31 · ${K1} · Ereignis – eine Minute später [Q1]`))).toEqual(["ZEITSTRAHL_NACH_T0"]);
  });

  it("Berichtigung mit Bezug auf eine vorhandene Zeile ist in Ordnung", () => {
    const d = meldung(
      `[Z1] 2026-10-13T13:00 · ${K1} · Ereignis – Eintritt 13:00 [Q1]\n[Z2] 2026-10-13T13:00 · ${K1} · Berichtigung – zu [Z1]: Eintritt 12:30 [Q2]`,
    );
    expect(codes(d)).toEqual([]);
  });

  it("Richtwert je Sachverhalt aus der Darstellungsdatei (12): die 13. Zeile ergibt einen Hinweis", () => {
    const zeilen = Array.from({ length: 13 }, (_, i) => `[Z${i + 1}] 2026-10-13T${String(i + 6).padStart(2, "0")}:00 · ${K1} · Ereignis – Zeile ${i + 1} [Q1]`);
    expect(codes(meldung(zeilen.slice(0, 12).join("\n")))).toEqual([]);
    expect(codes(meldung(zeilen.join("\n")))).toEqual(["ZEITSTRAHL_RICHTWERT"]);
  });
});

describe("ZS-2026-W44-02, -03: Hinweise zu Kennung und Bezug", () => {
  it("fehlende Kennung als Hinweis, doppelte als Warnung, eigener Bezug als Warnung", () => {
    expect(codes(meldung("", [undefined, K2]))).toEqual(["KENNUNG_FEHLT"]);
    expect(codes(meldung("", [K1, K1]))).toEqual(["KENNUNG_DOPPELT"]);
    const d = meldung("");
    d.sachverhalte[0].bezug = [K1];
    expect(codes(d)).toEqual(["BEZUG_SELBST"]);
  });

  it("Prüfschritt: Befunde mit Vorsatz „Zeitstrahl:“ bzw. „Kennung:“", () => {
    const d = meldung(`[Z1] 2026-10-13 · ${K1} · Ereignis – ohne Beleg`, [K1, undefined]);
    const texte = ausfuellHinweise(d, p.ui).map((b) => b.text);
    expect(texte).toContain("Zeitstrahl: [Z1] hat keinen Quellenverweis [Qn].");
    expect(texte.some((t) => t.startsWith("Kennung: Ereignis/Sachverhalt 2") && t.includes("keine Kennung"))).toBe(true);
  });
});

describe("ZS-2026-W44-01: Verweise des Zeitstrahls im Quellenverzeichnis", () => {
  it("ein nur im Zeitstrahl zitierter Eintrag gilt als zitiert; ein dort zitierter fehlender Eintrag wird gemeldet", () => {
    const d = meldung(`[Z1] 2026-10-14T02:00 · ${K2} · Maßnahme – Krisenstab [Q2]`);
    expect(quellenHinweise(d, p.ui).map((b) => b.text)).not.toContain("[Q2] wird im Text nicht zitiert.");
    d.zeitstrahl = `[Z1] 2026-10-14T02:00 · ${K2} · Maßnahme – Krisenstab [Q3]`;
    expect(quellenHinweise(d, p.ui).map((b) => b.text)).toContain("[Q3] wird im Text zitiert, fehlt aber im Quellenverzeichnis.");
  });

  it("Quellen eines Sachverhalts schließen die Verweise seiner Zeilen ein, nicht die anderer Sachverhalte", () => {
    const d = meldung(`[Z1] 2026-10-14T02:00 · ${K2} · Maßnahme – Krisenstab [Q2]`);
    expect(quellenFuerSachverhalt(d.quellen, d.sachverhalte[1], p.ui, d.zeitstrahl)!.map((q) => q.nr)).toEqual([1, 2]);
    expect(quellenFuerSachverhalt(d.quellen, d.sachverhalte[0], p.ui, d.zeitstrahl)!.map((q) => q.nr)).toEqual([1]);
    // ohne Zeitstrahl wie bisher nur die Texte
    expect(quellenFuerSachverhalt(d.quellen, d.sachverhalte[1], p.ui)!.map((q) => q.nr)).toEqual([1]);
  });
});

describe("ZS-2026-W44-02: Vergabe der Sachverhaltskennung", () => {
  it("Präfix nach dem Feld „Land“ aus der Darstellungsdatei, sonst Standard", () => {
    expect(praefixFuer(p.ui, "Thüringen")).toBe("DE-TH");
    expect(praefixFuer(p.ui, "Bund")).toBe("DE");
    expect(praefixFuer(p.ui, "")).toBe("DE");
    expect(praefixFuer(p.ui, "Testland")).toBe("DE");
    expect(praefixFuer({ ...p.ui, kennung: undefined }, "Thüringen")).toBe("SV");
  });

  it("Form „Präfix-JJJJMMTT-XXXX“ mit Zeichen nach Crockford; feste Zufallsfolge ergibt feste Kennung", () => {
    // Zufallswerte k/32 wählen die Zeichen an Stelle k des Alphabets 0123456789ABCDEFGHJKMNPQRSTVWXYZ
    const folge = [20 / 32, 7 / 32, 23 / 32, 21 / 32];
    let i = 0;
    expect(neueKennung(p.ui, "Thüringen", "2026-10-14T09:00", [], () => folge[i++ % 4]!)).toBe("DE-TH-20261014-M7QN");
    expect(KENNUNG_RE.test("DE-TH-20261014-M7QN")).toBe(true);
  });

  it("keine Doppelung mit bereits vergebenen Kennungen derselben Meldung", () => {
    const werte = [0, 0, 0, 0, 1 / 32, 0, 0, 0];
    let i = 0;
    expect(neueKennung(p.ui, "Bund", "2026-10-14", ["DE-20261014-0000"], () => werte[i++]!)).toBe("DE-20261014-1000");
  });

  it("ohne Zufallsfolge: kryptografischer Zufall, immer gültige Form", () => {
    for (let n = 0; n < 50; n++) expect(istKennung(neueKennung(p.ui, "Hessen", "2026-10-14"))).toBe(true);
  });

  it("Muster: I, L, O, U nicht im Zufallsteil, Kleinbuchstaben und fehlendes Datum ungültig", () => {
    expect(["DE-20261014-ILOU", "de-20261014-ABCD", "DE-ABCD", "DE-2026101-ABCD", "DE-A-B-C-D-20261014-ABCD"].map(istKennung)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(() => neueKennung(p.ui, "Bund", "14.10.2026")).toThrow(/kein Datum/);
  });
});

describe("Beispieldatensatz Orkantief „Ilka“ (Profil 1.33.0)", () => {
  it("jeder Sachverhalt hat eine gültige, eindeutige Kennung; Präfix passt zum Land", () => {
    const alle: string[] = [];
    for (const k of ILKA_KENNUNGEN) {
      const d = ilkaMeldung(k);
      for (const sv of d.sachverhalte) {
        expect(istKennung(sv.kennung)).toBe(true);
        expect(sv.kennung.startsWith(`${praefixFuer(p.ui, d.land)}-2026`)).toBe(true);
        alle.push(sv.kennung);
      }
    }
    expect(new Set(alle).size).toBe(alle.length);
    expect(alle).toHaveLength(8);
  });

  it("verdichtete Meldung: Bezug auf die sieben Sachverhalte der Länder, Zeitstrahl ohne Befund", () => {
    const bund = ilkaMeldung("Bund");
    const laender = ILKA_KENNUNGEN.filter((k) => k !== "Bund").flatMap((k) => ilkaMeldung(k).sachverhalte.map((sv: any) => sv.kennung));
    expect([...bund.sachverhalte[0].bezug].sort()).toEqual([...laender].sort());
    expect(parseZeitstrahl(bund.zeitstrahl).eintraege).toHaveLength(8);
    expect(zeitstrahlHinweise(bund, p.ui)).toEqual([]);
    expect(quellenHinweise(bund, p.ui).filter((b) => b.stufe === "warnung")).toEqual([]);
  });
});
