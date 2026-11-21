// Erzeugung des Gebietsverzeichnisses aus GV-ISys (scripts/gebietsverzeichnis.mjs, seit 0.9.8). Soll unabhängig vom Code:
// Satzarten und Textkennzeichen nach der Datensatzbeschreibung von GV-ISys (10 Land, 20 Regierungsbezirk, 40 Kreis mit 41
// kreisfreie Stadt, 42 Stadtkreis, 43 Kreis, 44 Landkreis, 45 Regionalverband, 50 Gemeindeverband, 60 Gemeinde) und von
// Hand gebaute Zeilen in der Spaltenfolge der Quartalsausgabe; dazu eine kleine Excel-Datei mit jszip.
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { alsJson, bezirkName, gemeindeName, kreisName, leseXlsx, verzeichnisAusZeilen } from "../../scripts/gebietsverzeichnis.mjs";
import { gebietDateiFehler } from "../../src/kern/gebiete";

const KOPF = [
  ["Gemeinden in Deutschland nach Fläche, Bevölkerung und Postleitzahl am 30.09.2026 (3. Quartal)"],
  [],
  ["Satzart", "Textkennzeichen", "Amtlicher Regionalschlüssel (ARS)"],
];
const ZEILEN = [
  ["10", "", "16", "", "", "", "", "Thüringen"],
  ["40", "41", "16", "0", "51", "", "", "Erfurt, Stadt"],
  ["60", "61", "16", "0", "51", "0000", "000", "Erfurt, Stadt"],
  ["40", "44", "16", "0", "72", "", "", "Sonneberg"],
  ["50", "50", "16", "0", "72", "0018", "", "Sonneberg, Stadt"],
  ["60", "63", "16", "0", "72", "0018", "018", "Sonneberg, Stadt"],
  ["40", "44", "16", "0", "70", "", "", "Ilm-Kreis"],
  ["20", "", "09", "1", "", "", "", "Oberbayern"],
  ["20", "", "05", "3", "", "", "", "Reg.-Bez. Köln"],
  ["30", "", "08", "1", "1", "", "", "Region Stuttgart"],
  ["60", "60", "09", "1", "71", "0133", "133", "Tüßling, M"],
  ["60", "66", "03", "1", "51", "9501", "501", "Giebel, gemfr. Gebiet"],
  ["© Daten (im Auftrag der Herausgebergemeinschaft Statistische Ämter des Bundes und der Länder)"],
];

describe("Gebietsverzeichnis aus GV-ISys", () => {
  it("Anzeigenamen: Art der Kreise vorn, Regierungsbezirke ausgeschrieben, Abkürzungen der Gemeinden aufgelöst", () => {
    expect(kreisName("Erfurt, Stadt", "41")).toBe("Kreisfreie Stadt Erfurt");
    expect(kreisName("Stuttgart, Stadtkreis", "42")).toBe("Stadtkreis Stuttgart");
    expect(kreisName("Dithmarschen", "43")).toBe("Kreis Dithmarschen");
    expect(kreisName("Sonneberg", "44")).toBe("Landkreis Sonneberg");
    expect(kreisName("Ilm-Kreis", "44")).toBe("Ilm-Kreis");
    expect(kreisName("Region Hannover", "44")).toBe("Region Hannover");
    expect(kreisName("Landkreis Rostock", "44")).toBe("Landkreis Rostock");
    expect(bezirkName("Reg.-Bez. Köln")).toBe("Regierungsbezirk Köln");
    expect(bezirkName("Statistische Region Braunschweig")).toBe("Statistische Region Braunschweig");
    expect(gemeindeName("Tüßling, M")).toBe("Tüßling, Markt");
    expect(gemeindeName("Giebel, gemfr. Gebiet")).toBe("Giebel, gemeindefreies Gebiet");
  });

  it("Ebenen und Schlüssel: Gemeindeverbände und Regionen entfallen, Gemeinden mit 8-stelligem AGS; Stand aus dem Titel", () => {
    const { kern, gemeinden } = verzeichnisAusZeilen([...KOPF, ...ZEILEN]);
    expect(kern.stand).toBe("2026-09-30");
    expect(kern.quelle).toBe(
      "Statistische Ämter des Bundes und der Länder, Gemeindeverzeichnis-Informationssystem GV-ISys, Gebietsstand 30.09.2026, 3. Quartal",
    );
    expect(kern.eintraege).toEqual([
      ["DE", "Bund", "Staat"],
      ["16", "Thüringen", "Land"],
      ["16051", "Kreisfreie Stadt Erfurt", "Kreis"],
      ["16072", "Landkreis Sonneberg", "Kreis"],
      ["16070", "Ilm-Kreis", "Kreis"],
      ["091", "Regierungsbezirk Oberbayern", "Regierungsbezirk"],
      ["053", "Regierungsbezirk Köln", "Regierungsbezirk"],
    ]);
    expect(gemeinden.eintraege).toEqual([
      ["16051000", "Erfurt, Stadt", "Gemeinde"],
      ["16072018", "Sonneberg, Stadt", "Gemeinde"],
      ["09171133", "Tüßling, Markt", "Gemeinde"],
      ["03151501", "Giebel, gemeindefreies Gebiet", "Gemeinde"],
    ]);
    expect(gebietDateiFehler(JSON.parse(alsJson(kern)))).toEqual([]);
    expect(() => verzeichnisAusZeilen(ZEILEN)).toThrow(/Gebietsstand nicht gefunden/);
  });

  it("liest das Tabellenblatt einer Excel-Datei mit geteilten und eingebetteten Texten", async () => {
    const zip = new JSZip();
    zip.file(
      "xl/workbook.xml",
      '<workbook xmlns:r="r"><sheets><sheet name="Inhalt" sheetId="1" r:id="rId1"/><sheet name="Onlineprodukt_Gemeinden30092026" sheetId="2" r:id="rId2"/></sheets></workbook>',
    );
    zip.file(
      "xl/_rels/workbook.xml.rels",
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>',
    );
    zip.file("xl/sharedStrings.xml", "<sst><si><t>10</t></si><si><r><t>Th</t></r><r><t>üringen</t></r></si></sst>");
    zip.file("xl/worksheets/sheet1.xml", "<worksheet><sheetData/></worksheet>");
    zip.file(
      "xl/worksheets/sheet2.xml",
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>16</t></is></c><c r="H1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>A &amp; B</t></is></c></row></sheetData></worksheet>',
    );
    const { blatt, zeilen } = await leseXlsx(await zip.generateAsync({ type: "uint8array" }), /^Onlineprodukt_Gemeinden/);
    expect(blatt).toBe("Onlineprodukt_Gemeinden30092026");
    expect(zeilen).toEqual([["10", "", "16", "", "", "", "", "Thüringen"], ["A & B"]]);
  });
});
