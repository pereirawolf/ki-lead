import { describe, expect, it } from "vitest";
import { jsonDateien, profil } from "./hilfen";
import { pruefeGegenSchema } from "../src/kern/validierung";
import { migriere } from "../src/kern/migration";
import { kategorienGeordnet, parseQuellen, quellenHinweise, rangfolgeText, verweise } from "../src/kern/quellen";
import { ausfuellHinweise, kennsatz, pflichtHinweise } from "../src/kern/kennsaetze";
import { dateiname, managementSummary } from "../src/kern/ausgabe";
import { pfadBezeichnung } from "../src/kern/ui";

const ilka = jsonDateien("../profile/lead-beispiel/beispiele/orkantief-ilka");

describe("Fiktiver Datensatz Orkantief „Ilka“", () => {
  it("liegt vollständig vor", () => {
    expect(ilka.length).toBe(7);
  });

  for (const { name, daten } of ilka) {
    it(`${name}: schemakonform, Quellen stimmig`, async () => {
      const { profil: p } = await profil("lead-beispiel");
      const mig = migriere(daten, p!);
      expect(mig.bekannt).toBe(true);
      expect(pruefeGegenSchema(p!.schema, mig.daten, p!.ui)).toEqual([]);
      const warnungen = quellenHinweise(mig.daten, p!.ui).filter((b) => b.stufe === "warnung");
      expect(warnungen).toEqual([]);
      expect(pflichtHinweise(mig.daten, p!.ui)).toEqual([]);
    });
  }
});

describe("Schemaprüfung", () => {
  it("meldet Fehler mit verständlichen Bezeichnungen", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = JSON.parse(JSON.stringify(ilka[0].daten));
    d.sachverhalte[0].sofort.lagenradar.d1 = "U";
    d.sachverhalte[0].sofort.beurteilung = "hoch";
    d.extra = 1;
    d.land = "";
    d._status = "final";
    const befunde = pruefeGegenSchema(p!.schema, d, p!.ui).map((b) => b.text);
    expect(befunde).toContain("Ereignis/Sachverhalt 1 › Sofortbereich › Lagenradar › D1: Datentyp „string“, erwartet integer oder null");
    expect(befunde).toContain("Ereignis/Sachverhalt 1 › Sofortbereich › Bewertung: unzulässiger Wert „hoch“");
    expect(befunde).toContain("extra: im Schema nicht vorgesehenes Feld");
    expect(befunde).toContain("Auswahl Land/Bund: Pflichtangabe fehlt");
  });

  it("bezeichnet Freigabefelder über Platzhalter-Muster", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(pfadBezeichnung(p!.ui, "/freigabe/versand/hz")).toBe("Freigabe & Versand › Versand › Handzeichen");
  });
});

describe("Migration", () => {
  it("überführt das Altformat v2", async () => {
    const { profil: p } = await profil("lead-beispiel");
    p!.manifest.migrationen = [
      { von: "LEAD-Meldung-v0", setze: { schema: "LEAD-Meldung-v1" }, ergaenze: { quellen: "" }, hinweis: "Altformat v0 in v1 überführt." },
    ];
    const alt = JSON.parse(JSON.stringify(ilka[0].daten));
    alt.schema = "LEAD-Meldung-v0";
    delete alt.quellen;
    alt.sachverhalte[0].analyse.lage_ereignis += "\n[Q1] J – Redaktion (01.10.2026): Titel [Zugriff: 01.10.2026]";
    const mig = migriere(alt, p!);
    expect(mig.daten.schema).toBe("LEAD-Meldung-v1");
    expect(mig.daten.quellen).toBe("");
    expect(mig.hinweise.join(" ")).toMatch(/Altformat v0/);
    expect(mig.hinweise.join(" ")).toMatch(/Quellenzeilen/);
  });

  it("erkennt fremde Schemata", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const mig = migriere({ schema: "Muster-LEAD-Meldung-v1" }, p!);
    expect(mig.bekannt).toBe(false);
  });
});

describe("Quellen und Kennsätze", () => {
  it("liest Einträge und Verweise", () => {
    const e = parseQuellen("[Q1] A – DWD (01.10.2026): X [Zugriff: 01.10.2026]\nFolgezeile\n[Q2] M – Y");
    expect(e.map((x) => [x.nr, x.code])).toEqual([
      [1, "A"],
      [2, "M"],
    ]);
    expect(e[0].text).toContain("Folgezeile");
    expect([...verweise("siehe [Q1–Q3] und [Q5, Q7]")]).toEqual([1, 2, 3, 5, 7]);
  });

  it("findet fehlende und alte Kategorien", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = JSON.parse(JSON.stringify(ilka[0].daten));
    d.quellen = "[Q1] J – Alt (01.10.2026): X";
    const texte = quellenHinweise(d, p!.ui)
      .map((b) => b.text)
      .join("\n");
    expect(texte).toMatch(/\[Q1\]: Kategorie fehlt oder ungültig/);
    expect(texte).toMatch(/Zugriffsdatum fehlt/);
  });

  it("akzeptiert Betreiberquellen (B) und ordnet Kategorien nach der Rangfolge", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = JSON.parse(JSON.stringify(ilka[0].daten));
    d.quellen = "[Q1] B – Stadtwerke X (14.10.2026): Störungsmeldung [Zugriff: 14.10.2026]";
    const texte = quellenHinweise(d, p!.ui)
      .map((b) => b.text)
      .join("\n");
    expect(texte).not.toMatch(/Kategorie fehlt oder ungültig/);
    expect(kategorienGeordnet(p!.ui).map(([c]) => c)).toEqual(["A", "B", "W", "M", "P"]);
    expect(rangfolgeText(p!.ui)).toBe("A > B > W > M > P");
    d.quellen = "[Q1] X – Unbekannt (14.10.2026): Titel [Zugriff: 14.10.2026]";
    const fehler = quellenHinweise(d, p!.ui)
      .map((b) => b.text)
      .join("\n");
    expect(fehler).toContain("Kategorie fehlt oder ungültig (A, B, W, M, P)");
  });

  it("liest Kennsätze", () => {
    expect(kennsatz("Kernaussage.\nHandlungsrelevant bis: 15.10.2026 12:00", "Handlungsrelevant bis:")).toBe("15.10.2026 12:00");
  });

  it("gibt Ausfüllhinweise ohne Absturz", async () => {
    const { profil: p } = await profil("lead-beispiel");
    for (const { daten } of ilka) expect(Array.isArray(ausfuellHinweise(daten, p!.ui))).toBe(true);
  });
});

describe("Ausgabe", () => {
  it("bildet Dateinamen nach der Vorlage des Profils", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = ilka.find((x) => x.name.includes("_HE_"))!.daten;
    expect(dateiname(d, p!, true)).toBe(
      d.meldezeitpunkt.replace(/:/g, "-") + "_LEAD-Meldung_Hessen_" + d.meldende_stelle.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_") + "_ENTWURF",
    );
  });

  it("erzeugt eine Management Summary ohne Quellenverweise", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const bund = ilka.find((x) => x.name.includes("_Bund_"))!.daten;
    const text = managementSummary(bund, p!);
    expect(text).toMatch(/Management Summary/);
    expect(text).toMatch(/Lage & Ereignis/);
    expect(text).not.toMatch(/\[Q\d/);
  });
});
