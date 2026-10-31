// Herkunftsrolle der meldenden Stelle im Lagebild (seit 0.6.13, Issue #114, A1; Anforderung aus KRITIS-LEAD vom
// 31.10.2026): optionale Rollen „herkunft“, „herkunft_standard“ und „herkunft_kategorie“, Prüfung beim Laden,
// Kern des Lagebilds, Rohtabelle/CSV, Kopiervorlage. Ohne die Rolle bleibt das Lagebild unverändert (Regression Ilka).
// Das Soll steht unabhängig im Test: Herkunftswerte und Kategorien sind hier gesetzt, nicht aus dem Code abgeleitet.
import { describe, expect, test } from "vitest";
import { ladeProfil } from "../../src/profil/laden";
import { leseOrdner, profil, repoPfad } from "../support/dateien";
import {
  alleSachverhalte,
  beispielDateien,
  einlesen,
  herkunftsrolleAnzeige,
  herkunftsrolleKategorie,
  herkunftsrolleVon,
  herkunftsrolleWerte,
  kennzahlen,
  nachHerkunftsrolle,
  type LagebildDatei,
} from "../../src/lagebild/lagebild";
import { alsCsv, kopiervorlageHtml, kopiervorlageText, rohtabelle, spalten } from "../../src/lagebild/ausgabe";
import type { Profil } from "../../src/kern/typen";

const ROLLEN = { herkunft: "kritis.rolle", herkunft_standard: "Behörde", herkunft_kategorie: { Betreiber: "B", Behörde: "A" } };

/** Beispielprofil mit optionalem Meldekopf „kritis“ im Schema und den Herkunftsrollen (allgemeines Feld, kein KRITIS-Text in der App) */
async function mitHerkunft(rollen: Record<string, unknown> = ROLLEN): Promise<Profil> {
  const p = (await profil("lead-beispiel")).profil!;
  p.schema.properties.kritis = {
    type: "object",
    additionalProperties: false,
    properties: { rolle: { type: "string", enum: ["Betreiber", "Behörde"] } },
  };
  Object.assign(p.ui.rollen, rollen);
  return p;
}

/** Eine Ilka-Meldung als Betreibermeldung: andere Stelle, Meldekopf mit Rolle */
function betreiber(ilka: LagebildDatei[], rolle: string | undefined = "Betreiber"): LagebildDatei {
  const d = JSON.parse(ilka[0].text);
  d.meldende_stelle = "Netzbetreiber Muster GmbH";
  if (rolle !== undefined) d.kritis = { rolle };
  return { name: "betreiber.json", text: JSON.stringify(d), importiertAm: "2026-10-14T12:00:00Z" };
}

describe("I114-A1: Herkunftsrolle im Kern des Lagebilds", () => {
  test("Herkunft je Meldung und je Sachverhalt, Standard für Meldungen ohne Wert, Kategorie nach Zuordnung", async () => {
    const p = await mitHerkunft();
    const ilka = beispielDateien(p, "beispiele/orkantief-ilka");
    const { eintraege, fehler } = einlesen([...ilka, betreiber(ilka)], p);
    expect(fehler).toEqual([]);
    expect(eintraege.every((e) => e.schema.length === 0)).toBe(true);
    expect(eintraege.map((e) => herkunftsrolleVon(e, p))).toEqual([...Array(7).fill("Behörde"), "Betreiber"]);
    expect(herkunftsrolleWerte(eintraege, p)).toEqual(["Behörde", "Betreiber"]);
    expect(herkunftsrolleKategorie(p, "Betreiber")).toBe("B");
    expect(herkunftsrolleAnzeige(p, "Betreiber")).toBe("Betreiber (B)");
    expect(herkunftsrolleAnzeige(p, "Behörde")).toBe("Behörde (A)");
    const svs = alleSachverhalte(eintraege, p);
    expect(svs.filter((s) => s.herkunftsrolle === "Betreiber").map((s) => s.stelle)).toEqual(
      alleSachverhalte([eintraege[0]], p).map(() => "Netzbetreiber Muster GmbH"),
    );
  });

  test("Filter blendet nach Herkunft aus und ein; Kennzahlen folgen der Auswahl", async () => {
    const p = await mitHerkunft();
    const ilka = beispielDateien(p, "beispiele/orkantief-ilka");
    const { eintraege } = einlesen([...ilka, betreiber(ilka)], p);
    expect(nachHerkunftsrolle(eintraege, p, new Set())).toHaveLength(8);
    const ohneBetreiber = nachHerkunftsrolle(eintraege, p, new Set(["Betreiber"]));
    expect(ohneBetreiber).toHaveLength(7);
    expect(kennzahlen(ohneBetreiber, p).sachverhalte).toBe(8);
    const nurBetreiber = nachHerkunftsrolle(eintraege, p, new Set(["Behörde"]));
    expect(nurBetreiber.map((e) => e.name)).toEqual(["betreiber.json"]);
    expect(nachHerkunftsrolle(eintraege, p, new Set(["Behörde", "Betreiber"]))).toEqual([]);
  });

  test("ohne „herkunft_standard“ bleibt die Herkunft leer und heißt „keine Angabe“; ohne Zuordnung keine Kategorie", async () => {
    const p = await mitHerkunft({ herkunft: "kritis.rolle" });
    const ilka = beispielDateien(p, "beispiele/orkantief-ilka");
    const { eintraege } = einlesen([ilka[1], betreiber(ilka)], p);
    expect(eintraege.map((e) => herkunftsrolleVon(e, p))).toEqual(["", "Betreiber"]);
    expect(herkunftsrolleAnzeige(p, "")).toBe("keine Angabe");
    expect(herkunftsrolleAnzeige(p, "Betreiber")).toBe("Betreiber");
    expect(nachHerkunftsrolle(eintraege, p, new Set([""])).map((e) => e.name)).toEqual(["betreiber.json"]);
  });

  test("Regression Ilka: ohne Rolle keine Herkunft, Filter ohne Wirkung", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const ilka = beispielDateien(p, "beispiele/orkantief-ilka");
    const { eintraege } = einlesen(ilka, p);
    expect(herkunftsrolleWerte(eintraege, p)).toEqual([]);
    expect(eintraege.map((e) => herkunftsrolleVon(e, p))).toEqual(Array(7).fill(""));
    expect(nachHerkunftsrolle(eintraege, p, new Set(["", "Behörde"]))).toBe(eintraege);
    expect(alleSachverhalte(eintraege, p).every((s) => s.herkunftsrolle === "")).toBe(true);
    expect(herkunftsrolleAnzeige(p, "")).toBe("");
  });
});

describe("I114-A1: Herkunft in Rohtabelle, CSV und Kopiervorlage", () => {
  test("Spalten „Herkunft“ und „Herkunft: Quellenkategorie“ nach „Datei“; Standard eingesetzt", async () => {
    const p = await mitHerkunft();
    const ilka = beispielDateien(p, "beispiele/orkantief-ilka");
    const { eintraege } = einlesen([ilka[1], betreiber(ilka)], p);
    const t = rohtabelle(eintraege, p);
    expect(t[0].slice(0, 3)).toEqual(["Datei", "Herkunft", "Herkunft: Quellenkategorie"]);
    const zeilen = t.slice(1).map((z) => z.slice(1, 3));
    expect(zeilen[0]).toEqual(["Behörde", "A"]);
    expect(zeilen.at(-1)).toEqual(["Betreiber", "B"]);
    expect(alsCsv(t).split("\r\n")[0]).toMatch(/^﻿Datei;Herkunft;Herkunft: Quellenkategorie;/);
  });

  test("ohne Zuordnung nur die Spalte „Herkunft“; ohne Rolle keine Spalte (Regression Ilka)", async () => {
    const mitRolle = await mitHerkunft({ herkunft: "kritis.rolle" });
    expect(
      spalten(mitRolle)
        .map((s) => s.titel)
        .filter((t) => t.startsWith("Herkunft")),
    ).toEqual(["Herkunft"]);
    const ohne = (await profil("lead-beispiel")).profil!;
    expect(spalten(ohne).some((s) => s.titel.startsWith("Herkunft"))).toBe(false);
  });

  test("Kopiervorlage (Word) nennt die Herkunft in der Kopfzeile der Stelle; ohne Rolle nicht", async () => {
    const p = await mitHerkunft();
    const ilka = beispielDateien(p, "beispiele/orkantief-ilka");
    const { eintraege } = einlesen([betreiber(ilka)], p);
    const s = alleSachverhalte(eintraege, p)[0];
    expect(kopiervorlageHtml(s, p)).toContain("Netzbetreiber Muster GmbH · Herkunft: Betreiber (B)");
    expect(kopiervorlageText(s, p).split("\n")[0]).toContain("Herkunft: Betreiber (B)");
    const ohne = (await profil("lead-beispiel")).profil!;
    const s0 = alleSachverhalte(einlesen(beispielDateien(ohne, "beispiele/orkantief-ilka"), ohne).eintraege, ohne)[0];
    expect(kopiervorlageHtml(s0, ohne)).not.toContain("Herkunft:");
    expect(kopiervorlageText(s0, ohne)).not.toContain("Herkunft:");
  });
});

/** Beispielprofil mit geänderter Darstellungsdatei, frisch geladen */
async function ladenMitRollen(rollen: Record<string, unknown>, schemaMitKritis = true) {
  const d = leseOrdner(repoPfad("profile", "lead-beispiel"));
  const ui = JSON.parse(d["meldung.ui.json"]!);
  Object.assign(ui.rollen, rollen);
  d["meldung.ui.json"] = JSON.stringify(ui);
  if (schemaMitKritis) {
    const schema = JSON.parse(d["meldung.schema.json"]!);
    schema.properties.kritis = { type: "object", properties: { rolle: { type: "string" } } };
    d["meldung.schema.json"] = JSON.stringify(schema);
  }
  return ladeProfil(d);
}
const texte = (b: { befunde: { text: string; stufe: string }[] }, stufe: string) => b.befunde.filter((x) => x.stufe === stufe).map((x) => x.text);

describe("I114-A1: Prüfung der Herkunftsrollen beim Laden", () => {
  test("gültige Rollen laden ohne Fehler und ohne Warnung zur Herkunft", async () => {
    const erg = await ladenMitRollen(ROLLEN);
    expect(erg.profil).not.toBeNull();
    expect(erg.befunde.filter((b) => /herkunft/i.test(b.text))).toEqual([]);
  });

  test("falsche Typen sind Fehler wie bei den übrigen Rollen", async () => {
    const erg = await ladenMitRollen({ herkunft: 3, herkunft_standard: ["Behörde"], herkunft_kategorie: { Betreiber: 2 } });
    expect(erg.profil).toBeNull();
    expect(texte(erg, "fehler")).toEqual(
      expect.arrayContaining([
        "Darstellungsdatei: Rolle „herkunft“ muss Text sein.",
        "Darstellungsdatei: Rolle „herkunft_standard“ muss Text sein.",
        "Darstellungsdatei: Rolle „herkunft_kategorie“ muss ein Objekt mit Texten sein.",
      ]),
    );
    const liste = await ladenMitRollen({ herkunft: "kritis.rolle", herkunft_kategorie: ["B"] });
    expect(texte(liste, "fehler")).toContain("Darstellungsdatei: Rolle „herkunft_kategorie“ muss ein Objekt mit Texten sein.");
  });

  test("unbekanntes Feld, unbekannte Kategorie und Angaben ohne Rolle sind Warnungen; das Profil bleibt nutzbar", async () => {
    const feld = await ladenMitRollen({ herkunft: "meldekopf.rolle" }, false);
    expect(feld.profil).not.toBeNull();
    expect(texte(feld, "warnung")).toContain("Darstellungsdatei: Rolle „herkunft“ verweist auf das unbekannte Feld „meldekopf.rolle“.");

    const kat = await ladenMitRollen({ herkunft: "kritis.rolle", herkunft_kategorie: { Betreiber: "X", Behörde: "A" } });
    expect(kat.profil).not.toBeNull();
    expect(kat.befunde.find((b) => b.code === "HERKUNFT_KATEGORIE_UNBEKANNT")?.text).toBe(
      "Darstellungsdatei: „herkunft_kategorie“ nennt Kategorien, die „quellen.kategorien“ nicht führt: Betreiber → X.",
    );

    const ohne = await ladenMitRollen({ herkunft_standard: "Behörde" }, false);
    expect(ohne.profil).not.toBeNull();
    expect(ohne.befunde.find((b) => b.code === "HERKUNFT_OHNE_ROLLE")?.stufe).toBe("warnung");
  });
});

describe("I114-A1: Vermerk zur Herkunft im Lagebild-PDF", () => {
  test("eigene Zeile unter der Kopfzeile; ohne Vermerk wie bisher", async () => {
    const { lagebildAlsPdf } = await import("../../src/dokumente/pdf");
    const p = await mitHerkunft();
    const tabelle = [
      ["Meldung", "Herkunft", "Sachverhalt"],
      ["Netzbetreiber Muster GmbH", "Betreiber (B)", "Stromausfall"],
    ];
    const lesen = async (b: Blob) => new TextDecoder("latin1").decode(new Uint8Array(await b.arrayBuffer()));
    const mit = await lesen(lagebildAlsPdf(p, "Lagebild", tabelle, [], "31.10.2026", "Herkunft der Meldungen: Betreiber (B): 1."));
    expect(mit).toMatch(/\(Herkunft der Meldungen: Betreiber \(B\): 1\.\) Tj|Herkunft der Meldungen: Betreiber \\\(B\\\): 1\./);
    const ohne = await lesen(lagebildAlsPdf(p, "Lagebild", tabelle, [], "31.10.2026"));
    expect(ohne).not.toContain("Herkunft der Meldungen");
  });
});
