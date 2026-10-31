// Landesprofil „LEAD-Beispiel – Land Thüringen (fiktive Inhalte)“ (seit 0.6.18, TP-2026-W44-54 bis -56): Ableitung aus dem
// Beispielprofil aktuell, Profil lädt ohne Befund, SOP-Sammelmappe geteilt, Kreise in Schema, Kennung und Kontakten
// stimmig, Beispiellage lädt im Lagebild und lässt sich (mit Attrappe) verdichten.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ableiten, KREISE, LAND, SCHEMA_ID, ZIEL } from "../../scripts/landesprofil.mjs";
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
  it("die abgeleiteten Dateien sind aktuell (sonst „npm run profil:land“)", () => {
    for (const [datei, inhalt] of Object.entries(ableiten())) expect(readFileSync(repoPfad(ZIEL, datei), "utf-8"), datei).toBe(inhalt);
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
    expect(e.map((x) => x.ordner)).toEqual(["lead-beispiel", "lead-thueringen", "muster"]);
    const land = e[1]!.dateien;
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
