// Kennzahlen-Bausteine aus Thessa als eigene Materialart (seit 0.6.24, UP-2026-W45-01): Erkennung und Ablehnung,
// Anzeige im Auftrag, Projektion ohne herleitung an die KI, Vorschlag der Quellenzeile, Abgleich der Zahlen im Text
// (Übergangsregel h) und Regel im Steuerungsblock. Fixtures: unveränderte Bausteine im Begleitordner des
// Landesprofils (KP-2026-W45-02) und die von Hand verfassten Kreismeldungen derselben Beispiellage (KP-2026-W45-01)
// als unabhängiges Soll für Quellenzeile und Abgleich.
import { describe, expect, it } from "vitest";
import { erkenneBaustein, quellenzeileV1, zeitDE } from "../../src/kern/baustein";
import { bausteinAbgleich, bausteinQuellen, saetze, zahlPaare, type AbgleichBaustein } from "../../src/kern/bausteinabgleich";
import { BAUSTEIN_REGEL, steuerungsBlock } from "../../src/pipeline/kontext";
import { BAUSTEIN_SCHEMATA } from "../../src/pipeline/bausteinschemata";
import { dateiLesen, materialBloecke, materialUebersicht, type Material } from "../../src/pipeline/material";
import { jsonDateien, profilPflicht } from "../support/dateien";

const BEGLEIT = "profile/lead-thueringen/beispiele/orkantief-ilka-thessa";
const ILKA = "profile/lead-thueringen/beispiele/orkantief-ilka";
const bausteine = () => jsonDateien(BEGLEIT, { pflicht: true });
const sonneberg = () => bausteine().find((b) => b.name.startsWith("kennzahlen_Landkreis-Sonneberg_2026-10-14T10-00"))!;
const datei = (name: string, daten: unknown) => new File([JSON.stringify(daten, null, 2)], name, { type: "application/json" });
const kopie = <T>(x: T): T => JSON.parse(JSON.stringify(x));

async function alsMaterial(name: string, daten: unknown): Promise<Material> {
  return dateiLesen(datei(name, daten), await profilPflicht("lead-thueringen"));
}
const abgleichBaustein = (m: Material): AbgleichBaustein => ({ name: m.name, info: m.baustein!.info, daten: m.baustein!.daten as any });

/** Kreismeldung zum Baustein desselben Raums und Datenstands (Beispiellage Ilka, Landesprofil) */
function meldungZu(raum: string) {
  return jsonDateien(ILKA, { pflicht: true }).find((d) => d.daten.kreis === raum)!.daten;
}

describe("UP-2026-W45-01: Erkennung als Materialart „kennzahlen-baustein“", () => {
  it("gültiger Baustein 0.3: Materialart, Anzeige im Auftrag mit Raum, Datenstand, Zahlen und Satz zur Übernahme", async () => {
    const b = sonneberg();
    const m = await alsMaterial(b.name, b.daten);
    expect(m.art).toBe("kennzahlen-baustein");
    expect(m.eingang).toBeUndefined();
    expect(m.meldung).toBeUndefined();
    expect(m.hinweis).toBe(
      "Kennzahlen-Baustein (Thessa 0.3, FIKTIV): Landkreis Sonneberg (16072), Datenstand 14.10.2026, 10:00, 29 Kennzahlen, 6 Einsatzmeldungen. Kennzahlen werden unverändert übernommen.",
    );
    expect(m.baustein!.info).toMatchObject({ fassung: "0.3", kennzahlen: 29, einsatzmeldungen: 6, raum: { name: "Landkreis Sonneberg", schluessel: "16072" } });
  });

  it("alle fünf Bausteine des Begleitordners werden erkannt; Zahl der Kennzahlen und Einsatzmeldungen wie in der Datei", async () => {
    for (const b of bausteine()) {
      const m = await alsMaterial(b.name, b.daten);
      expect(m.art, b.name).toBe("kennzahlen-baustein");
      expect(m.hinweis, b.name).toContain(`${b.daten.kennzahlen.length} Kennzahlen`);
      expect(m.hinweis, b.name).toContain(zeitDE(b.daten.datenstand));
    }
  });

  it("Fassung 0.1 (ohne einsatzmeldungen) wird toleriert und als solche angezeigt", async () => {
    const { einsatzmeldungen: _e, ...rest } = kopie(sonneberg().daten);
    const m = await alsMaterial("alt.json", { ...rest, fassung: "0.1" });
    expect(m.art).toBe("kennzahlen-baustein");
    expect(m.hinweis).toContain("Fassung 0.1 – keine Einsatzmeldungen");
  });

  it("unbekannte Fassung: JSON-Material wie bisher, mit Hinweis", async () => {
    const m = await alsMaterial("neu.json", { ...kopie(sonneberg().daten), fassung: "0.9" });
    expect(m.art).toBe("json");
    expect(m.baustein).toBeUndefined();
    expect(m.hinweis).toMatch(/Fassung „0\.9“ ist unbekannt \(bekannt: 0\.3, 0\.2, 0\.1\); als JSON-Material übernommen/);
  });

  it("beschädigter Baustein: JSON-Material mit Hinweis auf die Schemabefunde, kein Absturz", async () => {
    const d = kopie(sonneberg().daten);
    d.kennzahlen[1].wert = "viel";
    const m = await alsMaterial("kaputt.json", d);
    expect(m.art).toBe("json");
    expect(m.hinweis).toMatch(/entspricht nicht dem Schema \(\d+ Befund/);
    expect(erkenneBaustein({ format: "anderes" }, BAUSTEIN_SCHEMATA)).toBeNull();
    expect(erkenneBaustein({ format: "Thessa-Kennzahlen" }, BAUSTEIN_SCHEMATA)).toEqual({ status: "unbekannte_fassung", fassung: "" });
  });
});

describe("UP-2026-W45-01: was an die KI geht", () => {
  it("Projektion ohne herleitung: keine Einsatzmittel-Kennung im Text an die KI, Werte vollständig", async () => {
    const b = sonneberg();
    const m = await alsMaterial(b.name, b.daten);
    const text = (materialBloecke([m], [], "")[0] as { text: string }).text;
    expect(text).toContain('art="kennzahlen-baustein"');
    expect(text).toContain('raum="Landkreis Sonneberg"');
    expect(text).toContain(`sha256="${m.hash}"`);
    expect(text).not.toContain('"herleitung"');
    for (const h of b.daten.herleitung) for (const id of h.einsatzmittel) expect(text).not.toContain(`"${id}"`);
    const gesendet = JSON.parse(m.text!);
    expect(gesendet.kennzahlen).toEqual(b.daten.kennzahlen);
    expect(gesendet.einsatzmeldungen).toEqual(b.daten.einsatzmeldungen);
    expect(m.baustein!.daten).toEqual(b.daten);
    expect(materialUebersicht([m], [], "")).toBe(`Kennzahlen-Baustein Landkreis Sonneberg (Datenstand 14.10.2026, 10:00; ${b.name})`);
  });

  it("Vorschlag der Quellenzeile gleich der von Hand verfassten Zeile der Kreismeldungen (Ilka, 10:00 Uhr)", async () => {
    for (const raum of ["Ilm-Kreis", "Landkreis Hildburghausen", "Landkreis Sonneberg"]) {
      const b = bausteine().find((x) => x.daten.raum.name === raum && x.daten.datenstand.startsWith("2026-10-14T10:00"))!;
      const m = await alsMaterial(b.name, b.daten);
      const zeile = String(meldungZu(raum).quellen)
        .split("\n")
        .find((z) => z.includes("Thessa"))!
        .replace(/^\[Q\d+\]\s*/, "");
      expect(quellenzeileV1(m.baustein!.info), raum).toBe(zeile);
    }
  });

  it("Steuerungsblock nennt die Regel nur, wenn Bausteine im Material sind", () => {
    const basis = {
      jetzt: "2026-10-14T10:05",
      t0: "2026-10-14T10:00",
      stichtag: "2026-10-14",
      zone: "Europe/Berlin",
      vormeldungStand: "",
      vormeldung: false,
      verdichtung: false,
      recherche: "nur-material" as const,
      websucheMax: 0,
      abrufMax: 0,
    };
    expect(steuerungsBlock({ ...basis, bausteine: 1 })).toContain(BAUSTEIN_REGEL);
    expect(steuerungsBlock(basis)).not.toContain("kennzahlen-baustein");
  });
});

describe("UP-2026-W45-01: Abgleich der Zahlen im Text (Übergangsregel h)", () => {
  it("Zahl-Einheit-Paare: „von“, Tausenderpunkt, Beiwörter; Uhrzeiten und Wörter zählen nicht", () => {
    expect(zahlPaare("Von 55 Einsatzmitteln sind 12 im Einsatz gebunden").map((p) => p.zahl)).toEqual([55]);
    expect(zahlPaare("12 von 55 Einsatzmitteln").map((p) => [p.zahl, p.einheit])).toEqual([
      [12, "Einsatzmittel"],
      [55, "Einsatzmittel"],
    ]);
    expect(zahlPaare("rund 1.400 Einsätze").map((p) => p.zahl)).toEqual([1400]);
    expect(zahlPaare("21 frei verfügbare Einsatzmittel").map((p) => p.zahl)).toEqual([21]);
    expect(zahlPaare("Um 10:00 Uhr laufen drei Einsätze")).toEqual([]);
    expect(saetze("Erster Satz [Q1]. Zweiter Satz mit 3 Einsätzen [Q2, Q3]. Dritter.")).toEqual([
      "Erster Satz [Q1].",
      "Zweiter Satz mit 3 Einsätzen [Q2, Q3].",
      "Dritter.",
    ]);
  });

  it("von Hand verfasste Kreismeldungen und Landesmeldung: Baustein im Quellenverzeichnis gefunden, keine Hinweise", async () => {
    const p = await profilPflicht("lead-thueringen");
    const faelle: [string, string][] = [
      ["Ilm-Kreis", "kennzahlen_Ilm-Kreis_2026-10-14T10-00_FIKTIV.json"],
      ["Landkreis Hildburghausen", "kennzahlen_Landkreis-Hildburghausen_2026-10-14T10-00_FIKTIV.json"],
      ["Landkreis Sonneberg", "kennzahlen_Landkreis-Sonneberg_2026-10-14T10-00_FIKTIV.json"],
      ["Thüringen", "kennzahlen_Thueringen_2026-10-14T10-30_FIKTIV.json"],
    ];
    for (const [raum, name] of faelle) {
      const b = bausteine().find((x) => x.name === name)!;
      const m = await alsMaterial(name, b.daten);
      const meldung = meldungZu(raum);
      expect(bausteinQuellen(meldung.quellen, m.baustein!.info).length, raum).toBe(1);
      expect(bausteinAbgleich(meldung, p.ui, [abgleichBaustein(m)]), raum).toEqual([]);
    }
  });

  it("geänderte Zahl im Satz mit Baustein-Verweis: BAUSTEIN_ZAHL_ABWEICHEND", async () => {
    const p = await profilPflicht("lead-thueringen");
    const b = sonneberg();
    const m = await alsMaterial(b.name, b.daten);
    const meldung = kopie(meldungZu("Landkreis Sonneberg"));
    const nr = bausteinQuellen(meldung.quellen, m.baustein!.info)[0];
    meldung.sachverhalte[0].analyse.massnahmen_empfehlungen += ` Einsatzbereit sind 36 Einsatzmittel [Q${nr}].`;
    const befunde = bausteinAbgleich(meldung, p.ui, [abgleichBaustein(m)]);
    expect(befunde.map((x) => x.code)).toEqual(["BAUSTEIN_ZAHL_ABWEICHEND"]);
    expect(befunde[0]!.stufe).toBe("hinweis");
    expect(befunde[0]!.text).toContain("36 Einsatzmittel");
  });

  it("Wert des Bausteins ohne Verweis und Baustein nicht im Quellenverzeichnis: BAUSTEIN_OHNE_BELEG", async () => {
    const p = await profilPflicht("lead-thueringen");
    const b = sonneberg();
    const m = await alsMaterial(b.name, b.daten);
    const ohneVerweis = kopie(meldungZu("Landkreis Sonneberg"));
    ohneVerweis.sachverhalte[0].analyse.massnahmen_empfehlungen += " Einsatzbereit sind 37 Einsatzmittel.";
    expect(bausteinAbgleich(ohneVerweis, p.ui, [abgleichBaustein(m)]).map((x) => x.code)).toEqual(["BAUSTEIN_OHNE_BELEG"]);
    const ohneQuelle = kopie(meldungZu("Landkreis Sonneberg"));
    ohneQuelle.quellen = String(ohneQuelle.quellen)
      .split("\n")
      .filter((z: string) => !z.includes("Thessa"))
      .join("\n");
    const befunde = bausteinAbgleich(ohneQuelle, p.ui, [abgleichBaustein(m)]);
    expect(befunde.map((x) => x.code)).toEqual(["BAUSTEIN_OHNE_BELEG"]);
    expect(befunde[0]!.text).toContain("steht nicht im Quellenverzeichnis");
  });
});
