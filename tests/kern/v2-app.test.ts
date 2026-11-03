// LEAD-Meldung-v2 in Kern und Prüfung der App (seit 0.7.0, UP-2026-W45-02): eine Umsetzung für App und Werkzeug,
// Migration beim Einlesen, Grundform v2 für Eingänge, Referenzprüfung in Lagebild, Maske und Pipeline, Rollen als
// Pfade. Testprofil: tests/support/v2profil.ts (Beispiel- bzw. Landesprofil mit zusammengestelltem v2-Schema).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as werkzeug from "../../scripts/lead-meldung-v2.mjs";
import { eingangsInfo } from "../../src/kern/eingang";
import { ausfuellHinweise } from "../../src/kern/kennsaetze";
import * as kern from "../../src/kern/meldung-v2.js";
import { migriere } from "../../src/kern/migration";
import { holeWert, mitFeld, setzeWert } from "../../src/kern/pfad";
import { quellenHinweise } from "../../src/kern/quellen";
import { istV2, referenzBefunde } from "../../src/kern/referenzen";
import { pruefeRoh } from "../../src/kern/validierung";
import { einlesen, landVon, stelleVon, zeitpunktVon } from "../../src/lagebild/lagebild";
import { dateiLesen } from "../../src/pipeline/material";
import { profilPflicht, repoPfad } from "../support/dateien";
import { v2Profil } from "../support/v2profil";

const json = (pfad: string) => JSON.parse(readFileSync(repoPfad(pfad), "utf-8"));
const FEST = { meldungId: () => "019a2b4c-6d10-7e3a-9f21-000000000000", jetzt: () => new Date("2026-11-03T09:00:00Z") };
const ordner = (o: string, ebene: "bund" | "land") =>
  readdirSync(repoPfad(o))
    .filter((d) => d.endsWith(".json"))
    .map((d) => [`${o}/${d}`, ebene] as const);
const V1 = [
  ...ordner("profile/lead-beispiel/beispiele/orkantief-ilka", "bund"),
  ...ordner("profile/lead-thueringen/beispiele/hochwasser-saale", "land"),
  ...ordner("profile/lead-thueringen/beispiele/orkantief-ilka", "land"),
  ["evaluation/material/ilka-musterfassung.json", "bund"] as const,
  ...readdirSync(repoPfad("evaluation/pruefsteine"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => [join("evaluation/pruefsteine", d.name, "meldung.json"), "bund"] as const),
];
const BEISPIEL_TH = "formate/lead-meldung-v2/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json";

describe("UP-2026-W45-02: eine Umsetzung für App und Werkzeug", () => {
  it("das Skript reicht die Funktionen aus src/kern/meldung-v2.js durch", () => {
    for (const name of ["migriereV1", "pruefeReferenzen", "vergleicheZeit", "zeitV2", "mitVersatz", "stehtVor", "quellenV1", "zeitstrahlV1", "bewertungV1"])
      expect((werkzeug as any)[name], name).toBe((kern as any)[name]);
    // stelleSchemaZusammen: im Skript mit Vorgabe für den Formatordner, im Kern mit Ladefunktion
    const z = json("formate/lead-meldung-v2/zusammenstellungen/lead-beispiel.json");
    expect(werkzeug.stelleSchemaZusammen(z)).toEqual(kern.stelleSchemaZusammen(z, (d: string) => json(`formate/lead-meldung-v2/${d}`)));
  });
});

describe("UP-2026-W45-02: Migration v1 → v2 beim Einlesen", () => {
  it.each(V1)("%s: in der App gleich dem Werkzeug, schemagültig, ohne Fehler der Referenzprüfung", async (datei, ebene) => {
    const p = await v2Profil(ebene);
    const v1 = json(datei);
    const app = migriere(v1, p, FEST);
    const soll = werkzeug.migriereV1(v1, { ...FEST, zeitzone: "Europe/Berlin" });
    expect(app.bekannt).toBe(true);
    expect(app.daten).toEqual(soll.meldung);
    expect(app.hinweise).toEqual(expect.arrayContaining(soll.hinweise));
    expect(app.hinweise[0]).toMatch(/nach LEAD-Meldung-v2 überführt; zur Durchsicht bestimmt/);
    expect(pruefeRoh(p.schema, app.daten)).toEqual([]);
    expect(referenzBefunde(app.daten, p.ui).filter((b) => b.stufe === "fehler")).toEqual([]);
  });

  it("Lagebild liest v1-Meldungen unter dem v2-Profil: überführt, Schema ✓, Stelle, Gebiet und Zeitpunkt über Pfad-Rollen", async () => {
    const p = await v2Profil("land");
    const o = "profile/lead-thueringen/beispiele/orkantief-ilka";
    const dateien = readdirSync(repoPfad(o))
      .filter((d) => d.endsWith(".json"))
      .map((name) => ({ name, text: readFileSync(repoPfad(o, name), "utf-8"), importiertAm: "" }));
    const { eintraege, fehler } = einlesen(dateien, p);
    expect(fehler).toEqual([]);
    expect(eintraege).toHaveLength(4);
    for (const e of eintraege) {
      expect(e.fremd).toBeNull();
      expect(e.schema).toEqual([]);
      expect(e.referenzen ?? []).toEqual([]);
      expect(e.daten.schema).toBe("LEAD-Meldung-v2");
    }
    expect(eintraege.map((e) => landVon(e, p)).sort()).toEqual(["Ilm-Kreis", "Landkreis Hildburghausen", "Landkreis Sonneberg", "Thüringen"]);
    expect(eintraege.every((e) => stelleVon(e, p) && /^2026-10-14T10:[03]0\+02:00$/.test(zeitpunktVon(e, p)))).toBe(true);
  });

  it("nicht überführbare Schemakennung: Hinweis, keine Übernahme", async () => {
    const p = await v2Profil();
    p.manifest.migrationen!.push({ von: "Lagebild-Justiz-Meldung-v1", verfahren: "lead-meldung-v2" });
    const r = migriere({ schema: "Lagebild-Justiz-Meldung-v1", sachverhalte: [] }, p);
    expect(r.bekannt).toBe(false);
    expect(r.hinweise.join(" ")).toMatch(/Überführung nach LEAD-Meldung-v2 nicht möglich: Nicht migrierbar/);
  });

  it("Profilprüfung kennt das Verfahren und lehnt unbekannte Verfahren ab", async () => {
    const { ladeProfil } = await import("../../src/profil/laden");
    const { leseOrdner } = await import("../support/dateien");
    const dateien = leseOrdner(repoPfad("profile/muster"));
    const manifest = JSON.parse(dateien["profil.json"]!);
    const mit = (verfahren: string) =>
      ladeProfil({ ...dateien, "profil.json": JSON.stringify({ ...manifest, migrationen: [{ von: "LEAD-Meldung-v0", verfahren }] }) });
    expect((await mit("lead-meldung-v2")).profil).toBeTruthy();
    const falsch = await mit("zaubern");
    expect(falsch.profil).toBeFalsy();
    expect(JSON.stringify(falsch.befunde)).toMatch(/„verfahren“ „lead-meldung-v2“/);
  });
});

describe("UP-2026-W45-02: Grundform v2 für Eingänge", () => {
  it("eine v2-Meldung ist unter dem v1-Beispielprofil Eingang mit Stelle, Gebiet, Zeitpunkt und meldung_id", async () => {
    const p = await profilPflicht("lead-beispiel");
    const m = json(BEISPIEL_TH);
    const info = eingangsInfo(m, p)!;
    expect(info).toEqual({
      stelle: m.absender.stelle,
      land: "Thüringen",
      zeitpunkt: m.meldezeitpunkt,
      sachverhalte: m.sachverhalte.length,
      schema: "LEAD-Meldung-v2",
      meldung_id: m.meldung_id,
    });
    const mat = await dateiLesen(new File([JSON.stringify(m)], "th.json"), p);
    expect(mat.art).toBe("eingang");
    expect(mat.hinweis).toContain(`Eingangsmeldung: Thüringen, ${m.absender.stelle}`);
  });

  it("unter dem v2-Profil ist eine v2-Meldung eigene Meldung; Stelle und Gebiet über die Pfad-Rollen", async () => {
    const p = await v2Profil("land");
    const m = json(BEISPIEL_TH);
    const { eintraege } = einlesen([{ name: "th.json", text: JSON.stringify(m), importiertAm: "" }], p);
    expect(eintraege[0]!.fremd).toBeNull();
    expect(landVon(eintraege[0]!, p)).toBe("Thüringen");
    expect(stelleVon(eintraege[0]!, p)).toBe(m.absender.stelle);
  });
});

describe("UP-2026-W45-02: Referenzprüfung in Lagebild, Maske und Pipeline", () => {
  const kaputt = () => {
    const m = json(BEISPIEL_TH);
    m.sachverhalte[0].analyse.lage_ereignis += " Zusätzlicher Satz [Q99].";
    return m;
  };

  it("Befunde mit Pfad und Code; nur für v2", async () => {
    const p = await v2Profil("land");
    expect(referenzBefunde(json(BEISPIEL_TH), p.ui).filter((b) => b.stufe === "fehler")).toEqual([]);
    const b = referenzBefunde(kaputt(), p.ui).filter((x) => x.stufe === "fehler");
    expect(b).toEqual([
      expect.objectContaining({ code: "REFERENZ_FEHLER", pfad: "sachverhalte[0].analyse.lage_ereignis", text: expect.stringContaining("Q99") }),
    ]);
    expect(istV2(json("profile/lead-beispiel/beispiele/orkantief-ilka/LEAD-Meldung_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json"))).toBe(false);
    expect(referenzBefunde({ schema: "LEAD-Meldung-v1" })).toEqual([]);
  });

  it("Lagebild führt die Befunde am Eintrag; Maske im Prüfschritt (ausfuellHinweise); Quellenhinweise nach Text entfallen", async () => {
    const p = await v2Profil("land");
    const { eintraege } = einlesen([{ name: "th.json", text: JSON.stringify(kaputt()), importiertAm: "" }], p);
    expect(eintraege[0]!.referenzen?.some((b) => b.code === "REFERENZ_FEHLER")).toBe(true);
    expect(ausfuellHinweise(kaputt(), p.ui, "Europe/Berlin").some((b) => b.code === "REFERENZ_FEHLER")).toBe(true);
    expect(quellenHinweise(kaputt(), p.ui)).toEqual([]);
  });

  it("Pipeline: S2 hängt die Befunde der Referenzprüfung an (Quelltext)", () => {
    const s2 = readFileSync(repoPfad("src/pipeline/s2s3.ts"), "utf-8");
    expect(s2).toMatch(/befunde\.push\(\.\.\.referenzBefunde\(meldung, p\.ui\)\)/);
  });
});

describe("UP-2026-W45-02: Rollen als Pfade", () => {
  it("setzeWert legt Zwischenobjekte an, mitFeld kopiert", () => {
    const d: Record<string, any> = {};
    setzeWert(d, "absender.gebiet.name", "Thüringen");
    expect(d).toEqual({ absender: { gebiet: { name: "Thüringen" } } });
    const k = mitFeld(d, "absender.stelle", "Lagezentrum");
    expect(holeWert(k, "absender.stelle")).toBe("Lagezentrum");
    expect(d.absender.stelle).toBeUndefined();
    setzeWert(d, "status", "entwurf");
    expect(d.status).toBe("entwurf");
  });

  it("Profilprüfung: Rollen mit Pfad werden gegen das Schema aufgelöst (keine Warnung für absender.stelle)", async () => {
    const { pruefeUiGegenSchema } = await import("../../src/profil/laden");
    const p = await v2Profil();
    const befunde: any[] = [];
    pruefeUiGegenSchema(p.ui, p.schema, befunde);
    expect(befunde.filter((b) => /Rolle „/.test(b.text))).toEqual([]);
    const falsch: any[] = [];
    pruefeUiGegenSchema({ ...p.ui, rollen: { ...p.ui.rollen, meldende_stelle: "absender.gibtsnicht" } }, p.schema, falsch);
    expect(falsch.map((b) => b.text)).toEqual(
      expect.arrayContaining([expect.stringContaining("Rolle „meldende_stelle“ verweist auf das unbekannte Feld „absender.gibtsnicht“")]),
    );
  });
});
