// Landesprofil „LEAD-Beispiel – Land Thüringen (fiktive Inhalte)“ (seit 0.6.18, TP-2026-W44-54 bis -56): Ableitung aus dem
// Beispielprofil aktuell, Profil lädt ohne Befund, SOP-Sammelmappe geteilt, Kreise in Schema, Kennung und Kontakten
// stimmig, Beispiellage lädt im Lagebild und lässt sich (mit Attrappe) verdichten.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ableitenImRepo, EINGANG_IM_BEISPIEL, KREISE, LAND, SCHEMA_ID } from "../../scripts/landesprofil.mjs";
import { GETEILT, mitGeteilten } from "../../src/profil/geteilt";
import { eingebauteProfile } from "../../src/profil/eingebaut";
import { beispielDateien, einlesen, meldestatus } from "../../src/lagebild/lagebild";
import { redaktionscheck } from "../../src/lagebild/redaktion";
import { dateiLesen, type Material } from "../../src/pipeline/material";
import { stufe1 } from "../../src/pipeline/s1";
import { stufe2und3 } from "../../src/pipeline/s2s3";
import { eingangsquellenPruefen } from "../../src/pipeline/vermerke";
import { dateiname } from "../../src/kern/ausgabe";
import { pruefeRoh } from "../../src/kern/validierung";
import { llmAntwort, skriptAnbieter } from "../support/anbieter";
import { profil, repoPfad } from "../support/dateien";
import { pipelineKontext } from "../support/pipeline";

const ORDNER = "beispiele/hochwasser-saale";

describe("TP-2026-W44-54: Landesprofil aus dem Beispielprofil abgeleitet", () => {
  it("die abgeleiteten Dateien sind aktuell (sonst „npm run profil:land“), seit 0.6.19 auch das Eingangsschema im Beispielprofil", () => {
    const alle = ableitenImRepo();
    expect(Object.keys(alle)).toContain(EINGANG_IM_BEISPIEL);
    for (const [pfad, inhalt] of Object.entries(alle)) expect(readFileSync(repoPfad(pfad), "utf-8"), pfad).toBe(inhalt);
  });

  it("lädt ohne Befund: Ebene Land, Referenzraum Thüringen, Schema LEAD-Meldung-Land-v1 als Eingang und Ausgabe", async () => {
    const { profil: p, befunde } = await profil("lead-thueringen");
    expect(befunde).toEqual([]);
    expect(p!.manifest.ebene).toBe("Land");
    expect(p!.manifest.referenzraum).toBe("Bevölkerungsschutz in Thüringen");
    expect(p!.manifest.meldung.schema_id).toBe(SCHEMA_ID);
    expect(p!.manifest.meldung.eingang_schema_ids).toEqual([SCHEMA_ID]);
    expect(p!.manifest.variablen.meldetakt).toBe("wöchentlich");
    expect(p!.manifest.beschreibung).toMatch(/keine Vorgabe des Freistaats Thüringen/);
  });

  it("Kreise: Auswahl, Kennungspräfixe und Kontakte decken dieselben 22 Gebietskörperschaften ab", async () => {
    const p = (await profil("lead-thueringen")).profil!;
    const auswahl = (p.schema as any).properties.kreis.enum as string[];
    expect(auswahl).toEqual(["", LAND.name, ...KREISE.map((k) => k.name)]);
    expect(KREISE).toHaveLength(22);
    expect(Object.keys(p.ui.kennung!.praefixe!)).toEqual(auswahl.slice(1));
    expect(new Set(Object.values(p.ui.kennung!.praefixe!)).size).toBe(23);
    expect(p.kontakte!.stellen.map((s) => s.name)).toEqual(KREISE.map((k) => k.name));
    expect(p.kontakte!.stellen.every((s) => s.feld === "kreis")).toBe(true);
    expect(p.ui.rollen.land).toBe("kreis");
  });
});

describe("TP-2026-W44-55: SOP-Sammelmappe mit dem Beispielprofil geteilt", () => {
  it("dieselben SOP-Texte wie im Beispielprofil, ohne Kopie im Ordner des Landesprofils", async () => {
    const land = (await profil("lead-thueringen")).profil!;
    const bund = (await profil("lead-beispiel")).profil!;
    expect(land.manifest.sop!.dateien).toEqual(bund.manifest.sop!.dateien);
    for (const d of land.manifest.sop!.dateien) expect(land.dateien[d], d).toBe(bund.dateien[d]);
    expect(land.sops.length).toBe(bund.sops.length);
    expect(GETEILT["lead-thueringen"]).toEqual({ von: "lead-beispiel", praefix: "sop/" });
  });

  it("eingebaute Profile: Beispielprofil bleibt das erste (Vorgabe beim Start), das Landesprofil bringt die SOP-Dateien mit", () => {
    const e = eingebauteProfile();
    expect(e[0]!.ordner).toBe("lead-beispiel");
    expect(e.map((x) => x.ordner)).toContain("lead-thueringen");
    const land = e.find((x) => x.ordner === "lead-thueringen")!.dateien;
    const bund = e[0]!.dateien;
    const sop = Object.keys(bund).filter((d) => d.startsWith("sop/"));
    for (const d of sop) expect(land[d], d).toBe(bund[d]);
    expect(Object.keys(land).some((d) => d.includes("archiv/") || d.endsWith("_Lesefassung.md"))).toBe(false);
  });

  it("eigene Dateien gehen vor; ohne Eintrag oder Quelle bleibt alles, wie es ist", () => {
    const quelle = { "sop/a.md": "A", "sop/b.md": "B", "profil.json": "Q" };
    expect(mitGeteilten("lead-thueringen", { "sop/a.md": "eigen", "profil.json": "Z" }, () => quelle)).toEqual({
      "sop/a.md": "eigen",
      "sop/b.md": "B",
      "profil.json": "Z",
    });
    expect(mitGeteilten("lead-beispiel", { x: "1" }, () => quelle)).toEqual({ x: "1" });
    expect(mitGeteilten("lead-thueringen", { x: "1" }, () => undefined)).toEqual({ x: "1" });
  });
});

describe("TP-2026-W44-56: Beispiellage Hochwasser an der Saale (FIKTIV)", () => {
  it("vier schemakonforme Meldungen; Lagebild ohne Lesefehler, Meldestatus je Kreis, Kennungen und Bezug ohne Befund", async () => {
    const p = (await profil("lead-thueringen")).profil!;
    const dateien = beispielDateien(p, ORDNER);
    expect(dateien).toHaveLength(4);
    for (const d of dateien) expect(pruefeRoh(p.schema as object, JSON.parse(d.text)), d.name).toEqual([]);
    const { eintraege, fehler } = einlesen(dateien, p);
    expect(fehler).toEqual([]);
    expect(eintraege.every((e) => e.schema.length === 0 && !e.fremd)).toBe(true);
    const status = meldestatus(eintraege, p)!;
    expect(status.zeilen.filter((z) => z.eintraege.length).map((z) => z.name)).toEqual(["Landkreis Saalfeld-Rudolstadt", "Saale-Holzland-Kreis", "Stadt Jena"]);
    expect(status.weitere.map((e) => e.name)).toEqual([expect.stringContaining("_TH_Lagezentrum_")]);
    const r = redaktionscheck(eintraege, p, "2026-11-04", new Date("2026-10-28T14:00:00+01:00"));
    expect(r.kennungen).toEqual([]);
    for (const d of dateien) expect(d.text).toContain("FIKTIV");
  });

  it("verdichtet die drei Kreismeldungen (Attrappe): als Eingang erkannt, t0 aus dem jüngsten Eingang, Ergebnis schemakonform und belegt", async () => {
    const p = (await profil("lead-thueringen")).profil!;
    const alle = beispielDateien(p, ORDNER);
    const kreise = alle.filter((d) => !d.name.includes("_TH_"));
    const land = JSON.parse(alle.find((d) => d.name.includes("_TH_"))!.text);
    const eingaenge: Material[] = [];
    for (const d of kreise) eingaenge.push(await dateiLesen(new File([d.text], d.name), p));
    expect(eingaenge.every((m) => m.eingang)).toBe(true);
    const vorschlag = {
      gegenstand: "Hochwasser an der Saale",
      stichtag: "2026-10-28",
      meldezeitpunkt: "",
      referenzbezug: "Land Thüringen",
      horizont: "bis 04.11.2026",
      sachverhalte: [
        {
          titel: "Hochwasser an der Saale",
          ereignisarten: ["Hochwasser / Überschwemmung"],
          sops: ["b02"],
          begruendung: "drei Kreise",
          eingangsmeldungen: eingaenge.map((m) => m.name),
        },
      ],
      prueffrage: "",
      hinweise: "",
    };
    const att = skriptAnbieter([llmAntwort(JSON.stringify(vorschlag)), llmAntwort("Kurz.\n```json\n" + JSON.stringify(land) + "\n```")]);
    const { k } = await pipelineKontext(att, eingaenge, {
      profilName: "lead-thueringen",
      jetzt: "2026-10-28T13:00:00+01:00",
      auftrag: { stichtag: "2026-10-28" },
    });
    k.lauf.auftrag.websuche = false;
    const v = await stufe1(k);
    expect(att.anfragen[0].system[0].text).toContain("Verdichtung von Eingangsmeldungen");
    expect((att.anfragen[0].jsonSchema as any).properties.sachverhalte.items.properties.eingangsmeldungen.items.enum).toHaveLength(3);
    expect(v.meldezeitpunkt).toBe("2026-10-28T10:30");
    const e = await stufe2und3(k, v);
    expect(att.anfragen[1].system.map((s) => s.text).join("\n")).toContain("Bevölkerungsschutz in Thüringen");
    expect(k.lauf.ergebnis!.schemakonform).toBe(true);
    expect(e.meldung!.kreis).toBe("Thüringen");
    expect(eingangsquellenPruefen(eingaenge, e.meldung!, p).map((x) => x.status)).toEqual(Array(3).fill("nachgewiesen"));
    expect(dateiname(e.meldung!, p, false)).toMatch(/^.*Thüringen_Lagezentrum/);
  });
});

const ILKA = "beispiele/orkantief-ilka";
const THESSA = "beispiele/orkantief-ilka-thessa/";
const thessaBausteine = (p: { dateien: Record<string, string | undefined> }) =>
  Object.keys(p.dateien)
    .filter((d) => d.startsWith(THESSA) && d.endsWith(".json"))
    .sort()
    .map((d) => ({ name: d.slice(THESSA.length), text: p.dateien[d] ?? "", daten: JSON.parse(p.dateien[d] ?? "{}") }));
/** Kennzahl eines Thessa-Bausteins nach Gegenstand (die Kennungen nach K5 hängen vom Gebiet ab) */
const kennzahl = (b: any, anfang: string) => b.kennzahlen.find((k: any) => k.gegenstand.startsWith(anfang))!.wert as number;

describe("KP-2026-W45-01: Beispiellage Orkantief „Ilka“ mit Kräftelage der Feuerwehren (FIKTIV)", () => {
  it("vier schemakonforme Meldungen; Lagebild ohne Lesefehler, Meldestatus je Kreis, Kennungen ohne Befund, FIKTIV", async () => {
    const p = (await profil("lead-thueringen")).profil!;
    expect(p.manifest.beispiele!.map((b) => b.ordner)).toEqual([ORDNER, ILKA]);
    const dateien = beispielDateien(p, ILKA);
    expect(dateien).toHaveLength(4);
    for (const d of dateien) expect(pruefeRoh(p.schema as object, JSON.parse(d.text)), d.name).toEqual([]);
    const { eintraege, fehler } = einlesen(dateien, p);
    expect(fehler).toEqual([]);
    expect(eintraege.every((e) => e.schema.length === 0 && !e.fremd)).toBe(true);
    const status = meldestatus(eintraege, p)!;
    expect(status.zeilen.filter((z) => z.eintraege.length).map((z) => z.name)).toEqual(["Ilm-Kreis", "Landkreis Hildburghausen", "Landkreis Sonneberg"]);
    expect(status.weitere.map((e) => e.name)).toEqual([expect.stringContaining("_TH_Lagezentrum_")]);
    const r = redaktionscheck(eintraege, p, "2026-10-21", new Date("2026-10-14T10:30:00+02:00"));
    expect(r.kennungen).toEqual([]);
    for (const d of dateien) expect(d.text).toContain("FIKTIV");
  });

  it("Landesmeldung: Kennungen und Kernzahlen der Thüringer Meldung im Beispielprofil, Bezug auf alle Kreis-Sachverhalte", async () => {
    const p = (await profil("lead-thueringen")).profil!;
    const alle = beispielDateien(p, ILKA).map((d) => ({ name: d.name, m: JSON.parse(d.text) }));
    const land = alle.find((d) => d.name.includes("_TH_"))!.m;
    const kreise = alle.filter((d) => !d.name.includes("_TH_")).map((d) => d.m);
    const bund = JSON.parse(
      readFileSync(repoPfad("profile/lead-beispiel/beispiele/orkantief-ilka/LEAD-Meldung_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json"), "utf-8"),
    );
    expect(land.sachverhalte.map((s: any) => s.kennung)).toEqual(bund.sachverhalte.map((s: any) => s.kennung));
    expect(land.meldezeitpunkt).toBe(bund.meldezeitpunkt);
    const strom = JSON.stringify(land.sachverhalte[1]);
    for (const zahl of ["9.800", "146 Bewohnerinnen und Bewohner", "vier Gemeinden", "16.10."]) expect(strom).toContain(zahl);
    const kreisKennungen = kreise.flatMap((m: any) => m.sachverhalte.map((s: any) => s.kennung));
    expect(land.sachverhalte.flatMap((s: any) => s.bezug).sort()).toEqual([...kreisKennungen].sort());
    expect(kreise.every((m: any) => m.meldezeitpunkt === "2026-10-14T10:00")).toBe(true);
    // Abweichende Bewertung von Kreis und Land wie in der Thüringer Meldung
    const son = kreise.find((m: any) => m.kreis === "Landkreis Sonneberg")!;
    expect(son.sachverhalte[0].sofort.beurteilung).toBe("kritisch");
    expect(land.sachverhalte[1].sofort.beurteilung).toBe("erheblich");
    expect(land.sachverhalte[1].sofort.bewertung_text).toMatch(/Abweichende Bewertung: Landkreis Sonneberg „kritisch“/);
  });

  it("Kräftelage: Zahlen und Datenstand wie in den Thessa-Bausteinen, Landeszahl als Ausschnitt gekennzeichnet", async () => {
    const p = (await profil("lead-thueringen")).profil!;
    const meldungen = beispielDateien(p, ILKA).map((d) => ({ name: d.name, text: d.text, m: JSON.parse(d.text) }));
    const bausteine = thessaBausteine(p);
    const paare: [string, string][] = [
      ["Ilm-Kreis", "kennzahlen_Ilm-Kreis_2026-10-14T10-00_FIKTIV.json"],
      ["Landkreis Hildburghausen", "kennzahlen_Landkreis-Hildburghausen_2026-10-14T10-00_FIKTIV.json"],
      ["Landkreis Sonneberg", "kennzahlen_Landkreis-Sonneberg_2026-10-14T10-00_FIKTIV.json"],
      ["Thüringen", "kennzahlen_Thueringen_2026-10-14T10-30_FIKTIV.json"],
    ];
    for (const [kreis, datei] of paare) {
      const b = bausteine.find((x) => x.name === datei)!.daten;
      const m = meldungen.find((x) => x.m.kreis === kreis)!;
      const gesamt = kennzahl(b, "Einsatzmittel der Feuerwehren");
      const frei = kennzahl(b, "frei verfügbar für überörtliche Hilfe");
      expect(m.text, `${kreis}: gesamt`).toContain(`${gesamt} Einsatzmitteln`);
      expect(m.text, `${kreis}: frei`).toMatch(new RegExp(`\\b${frei} frei`));
      // Quelle mit dem Titel und Datenstand des Bausteins
      const titel = b.quellen[0].titel.replace(" (FIKTIV)", "");
      const [tag, zeit] = [b.datenstand.slice(0, 10).split("-").reverse().join("."), b.datenstand.slice(11, 16)];
      expect(m.m.quellen, kreis).toMatch(new RegExp(`${titel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*Datenstand: ${tag}, ${zeit}`));
    }
    const land = meldungen.find((x) => x.m.kreis === "Thüringen")!;
    const tb = bausteine.find((x) => x.name.startsWith("kennzahlen_Thueringen"))!.daten;
    expect(land.text).toContain(`${kennzahl(tb, "im Einsatz gebunden")} von ${kennzahl(tb, "Einsatzmittel der Feuerwehren")} Einsatzmitteln`);
    expect(land.text).toMatch(/Ausschnitt von fünf Kreisen – kein landesweiter Wert/);
  });

  it("verdichtet die drei Kreismeldungen (Attrappe): als Eingang erkannt, t0 aus dem jüngsten Eingang, Ergebnis schemakonform und belegt", async () => {
    const p = (await profil("lead-thueringen")).profil!;
    const alle = beispielDateien(p, ILKA);
    const kreise = alle.filter((d) => !d.name.includes("_TH_"));
    const land = JSON.parse(alle.find((d) => d.name.includes("_TH_"))!.text);
    const eingaenge: Material[] = [];
    for (const d of kreise) eingaenge.push(await dateiLesen(new File([d.text], d.name), p));
    expect(eingaenge.every((m) => m.eingang)).toBe(true);
    const vorschlag = {
      gegenstand: "Orkantief Ilka",
      stichtag: "2026-10-14",
      meldezeitpunkt: "",
      referenzbezug: "Land Thüringen",
      horizont: "bis 16.10.2026",
      sachverhalte: [
        {
          titel: "Sturmschäden im Thüringer Wald",
          ereignisarten: ["Unwetter / Sturm"],
          sops: ["b01"],
          begruendung: "drei Kreise",
          eingangsmeldungen: eingaenge.map((m) => m.name),
        },
        {
          titel: "Stromausfall im Landkreis Sonneberg",
          ereignisarten: ["Stromausfall / Blackout"],
          sops: ["b08"],
          begruendung: "Sonneberg",
          eingangsmeldungen: [eingaenge.find((m) => m.name.includes("_SON_"))!.name],
        },
      ],
      prueffrage: "",
      hinweise: "",
    };
    const att = skriptAnbieter([llmAntwort(JSON.stringify(vorschlag)), llmAntwort("Kurz.\n```json\n" + JSON.stringify(land) + "\n```")]);
    const { k } = await pipelineKontext(att, eingaenge, {
      profilName: "lead-thueringen",
      jetzt: "2026-10-14T10:20:00+02:00",
      auftrag: { stichtag: "2026-10-14" },
    });
    k.lauf.auftrag.websuche = false;
    const v = await stufe1(k);
    expect(att.anfragen[0].system[0].text).toContain("Verdichtung von Eingangsmeldungen");
    expect((att.anfragen[0].jsonSchema as any).properties.sachverhalte.items.properties.eingangsmeldungen.items.enum).toHaveLength(3);
    expect(v.meldezeitpunkt).toBe("2026-10-14T10:00");
    const e = await stufe2und3(k, v);
    expect(k.lauf.ergebnis!.schemakonform).toBe(true);
    expect(e.meldung!.kreis).toBe("Thüringen");
    expect(eingangsquellenPruefen(eingaenge, e.meldung!, p).map((x) => x.status)).toEqual(Array(3).fill("nachgewiesen"));
  });
});

describe("KP-2026-W45-02: Kennzahlen-Bausteine aus Thessa im Begleitordner", () => {
  it("fünf Bausteine der Fassung 0.2, als JSON-Material ohne Eingangsrolle gelesen, nicht im Lagebild-Beispiel", async () => {
    const p = (await profil("lead-thueringen")).profil!;
    const bausteine = thessaBausteine(p);
    expect(bausteine.map((b) => b.name)).toEqual([
      "kennzahlen_Ilm-Kreis_2026-10-14T10-00_FIKTIV.json",
      "kennzahlen_Landkreis-Hildburghausen_2026-10-14T10-00_FIKTIV.json",
      "kennzahlen_Landkreis-Sonneberg_2026-10-14T10-00_FIKTIV.json",
      "kennzahlen_Landkreis-Sonneberg_2026-10-14T10-30_FIKTIV.json",
      "kennzahlen_Thueringen_2026-10-14T10-30_FIKTIV.json",
    ]);
    for (const b of bausteine) {
      expect(b.daten).toMatchObject({ format: "Thessa-Kennzahlen", fassung: "0.2", fiktiv: true });
      const m = await dateiLesen(new File([b.text], b.name), p);
      expect(m.eingang, b.name).toBeUndefined();
      expect(m.meldung, b.name).toBeUndefined();
      expect(m.hinweis ?? "", b.name).not.toMatch(/gekürzt/);
      expect(JSON.parse(m.text!), b.name).toEqual(b.daten);
      // Einsatzmeldungen ohne Ortslage und Hinweise
      for (const em of b.daten.einsatzmeldungen) expect(Object.keys(em)).not.toEqual(expect.arrayContaining(["ortslage"]));
      expect(b.text).not.toMatch(/"(ortslage|hinweis)"/);
    }
    expect(beispielDateien(p, ILKA).some((d) => d.name.includes("kennzahlen_"))).toBe(false);
    expect(p.manifest.beispiele!.some((b) => b.ordner.includes("thessa"))).toBe(false);
  });
});
