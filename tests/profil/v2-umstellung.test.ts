// Umstellung der Profile auf LEAD-Meldung-v2 (seit 0.9.0, UP-2026-W45-06, Paket 6 des Umstellungsplans) mit KL-2026-W45-03
// und KL-2026-W45-04. Soll nach der Befunddatei: Schema aus der Zusammenstellung, alle Beispielmeldungen bestehen beide
// Prüfebenen (Schema und Referenzprüfung), „Beispiel laden“ zeigt dieselbe Zahl an Meldungen und Sachverhalten wie vor der
// Umstellung (Vergleich mit den eingefrorenen v1-Fassungen unter tests/fixtures), Prüfsteine bleiben v1.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stelleSchemaZusammen } from "../../scripts/lead-meldung-v2.mjs";
import { bausteineUebernehmen } from "../../src/kern/bausteinuebernahme";
import { pruefeReferenzen } from "../../src/kern/meldung-v2.js";
import { moduleImSchema } from "../../src/kern/referenzen";
import { pruefeRoh } from "../../src/kern/validierung";
import { alleSachverhalte, beispielDateien, einlesen } from "../../src/lagebild/lagebild";
import { kennzahlBelegHinweis } from "../../src/lagebild/redaktion";
import { dateiLesen } from "../../src/pipeline/material";
import { bausteineImMaterial } from "../../src/pipeline/nachbearbeitung-v2";
import { jsonDateien, profil, profilPflicht, repoPfad } from "../support/dateien";

const lies = (pfad: string) => JSON.parse(readFileSync(repoPfad(pfad), "utf-8"));
const F = "formate/lead-meldung-v2";
/** Wie `npm run meldung:v2 -- schema`: Dateien neben der Zusammenstellung zuerst, sonst aus formate/lead-meldung-v2 */
const zusammen = (z: string, ordner: string) =>
  stelleSchemaZusammen(lies(z), (d: string) => lies(existsSync(repoPfad(`${ordner}/${d}`)) ? `${ordner}/${d}` : `${F}/${d}`));

/** Beispiele je Profil: Ordner, Zahl der Meldungen und Sachverhalte (wie vor der Umstellung) und eingefrorene v1-Fassung */
const BEISPIELE: [string, string, number, number, string][] = [
  ["lead-beispiel", "beispiele/orkantief-ilka", 7, 8, "tests/fixtures/lead-beispiel-v1/beispiele/orkantief-ilka"],
  ["lead-thueringen", "beispiele/hochwasser-saale", 4, 4, "tests/fixtures/lead-thueringen-v1/beispiele/hochwasser-saale"],
  ["lead-thueringen", "beispiele/orkantief-ilka", 4, 6, "tests/fixtures/lead-thueringen-v1/beispiele/orkantief-ilka"],
];

describe("UP-2026-W45-06: Profile auf LEAD-Meldung-v2", () => {
  it("Schemata aus den Zusammenstellungen; Profile laden ohne Befund mit Schemakennung, Migration und Variablen des Absenders", async () => {
    expect(lies("profile/lead-beispiel/meldung.schema.json")).toEqual(zusammen(`${F}/zusammenstellungen/lead-beispiel.json`, F));
    expect(lies("profile/lead-beispiel/eingang/meldung.schema.json")).toEqual(zusammen(`${F}/zusammenstellungen/lead-eingang.json`, F));
    expect(lies("profile/lead-thueringen/meldung.schema.json")).toEqual(zusammen(`${F}/zusammenstellungen/lead-thueringen.json`, F));
    expect(lies("profile/muster/meldung.schema.json")).toEqual(zusammen("profile/muster/zusammenstellung.json", "profile/muster"));
    for (const [name, version] of [
      ["lead-beispiel", "2.5.0"],
      ["lead-thueringen", "2.5.0"],
      ["muster", "1.4.0"],
    ]) {
      const { profil: p, befunde } = await profil(name!);
      expect(
        befunde.filter((b) => b.stufe !== "hinweis"),
        name,
      ).toEqual([]);
      expect(p!.manifest.version, name).toBe(version);
      expect(p!.manifest.meldung.schema_id, name).toBe("LEAD-Meldung-v2");
      expect(Object.keys(p!.manifest.variablen), name).toEqual(expect.arrayContaining(["absender.stelle", "absender.gebiet.name", "absender.ebene"]));
    }
    // Die Vorlage bringt ihr eigenes Modul mit; die Referenzprüfung kennt es über das Schema
    const muster = await profilPflicht("muster");
    expect(moduleImSchema(muster.schema)).toContain("muster-lageprofil");
  });

  it.each(BEISPIELE)("%s, %s: alle Meldungen bestehen beide Prüfebenen", async (name, ordner) => {
    const p = await profilPflicht(name);
    const module = moduleImSchema(p.schema);
    for (const d of beispielDateien(p, ordner)) {
      const m = JSON.parse(d.text);
      expect(pruefeRoh(p.schema as object, m), d.name).toEqual([]);
      expect(
        pruefeReferenzen(m, { module }).filter((b: { stufe: string }) => b.stufe === "fehler"),
        d.name,
      ).toEqual([]);
      expect(m.entstehung.migration, d.name).toBeDefined();
      expect(d.text, d.name).toContain("FIKTIV");
    }
  });

  it.each(BEISPIELE)(
    "%s, %s: „Beispiel laden“ zeigt dieselbe Zahl an Meldungen und Sachverhalten wie vor der Umstellung",
    async (name, ordner, meldungen, sachverhalte, v1) => {
      const p = await profilPflicht(name);
      const { eintraege, fehler } = einlesen(beispielDateien(p, ordner), p);
      expect(fehler).toEqual([]);
      expect(eintraege).toHaveLength(meldungen);
      expect(eintraege.every((e) => !e.fremd && e.schema.length === 0)).toBe(true);
      expect(alleSachverhalte(eintraege, p)).toHaveLength(sachverhalte);
      // Soll aus der v1-Fassung: dieselben Dateinamen, dieselben Sachverhaltskennungen in derselben Reihenfolge
      const vorher = jsonDateien(v1, { pflicht: true });
      expect(eintraege.map((e) => e.name)).toEqual(vorher.map((x) => x.name));
      expect(eintraege.flatMap((e) => e.daten.sachverhalte.map((s: any) => s.kennung))).toEqual(
        vorher.flatMap((x) => x.daten.sachverhalte.map((s: any) => s.kennung)),
      );
    },
  );

  it("Meldungen eines Kreises lesen im Beispielprofil gegen das Eingangsschema ohne Absendergrenzen, ohne Befund", async () => {
    const bund = await profilPflicht("lead-beispiel");
    const land = await profilPflicht("lead-thueringen");
    const { eintraege, fehler } = einlesen(beispielDateien(land, "beispiele/orkantief-ilka"), bund);
    expect(fehler).toEqual([]);
    expect(eintraege.map((e) => e.schema.length)).toEqual([0, 0, 0, 0]);
    // gegen das Profilschema des Beispielprofils wären Ebene „Kreis“ und die Kreise unzulässig
    const son = eintraege.find((e) => e.name.includes("_SON_"))!;
    expect(pruefeRoh(bund.schema as object, son.daten).length).toBeGreaterThan(0);
  });

  it("Bezug und Eingangsmeldungen tragen die meldung_id der verwendeten Meldung des Beispiels", async () => {
    for (const [name, ordner] of [
      ["lead-beispiel", "beispiele/orkantief-ilka"],
      ["lead-thueringen", "beispiele/hochwasser-saale"],
      ["lead-thueringen", "beispiele/orkantief-ilka"],
    ]) {
      const p = await profilPflicht(name!);
      const alle = beispielDateien(p, ordner!).map((d) => JSON.parse(d.text));
      const ids = new Set(alle.map((m) => m.meldung_id));
      expect(ids.size, ordner).toBe(alle.length);
      for (const m of alle) {
        for (const b of m.sachverhalte.flatMap((s: any) => s.bezug ?? [])) {
          expect(b.art, b.kennung).toBe("verdichtung");
          // Bezüge auf die Betreibermeldungen aus KRITIS-LEAD (KL-2026-W45-03) liegen außerhalb des Beispiels
          if (!b.meldung_id.startsWith("1c4a2026-")) {
            const quelle = alle.find((x) => x.meldung_id === b.meldung_id);
            expect(
              quelle?.sachverhalte.map((s: any) => s.kennung),
              b.kennung,
            ).toContain(b.kennung);
          }
        }
        for (const q of m.quellen.filter((x: any) => x.zugang === "eingangsmeldung" && !String(x.meldung_id).startsWith("1c4a2026-")))
          expect(ids.has(q.meldung_id), `${m.absender.stelle} ${q.id}`).toBe(true);
        expect(m.quellen.every((q: any) => q.zugang !== null)).toBe(true);
      }
    }
  });
});

describe("KL-2026-W45-03, -04: Stromausfall im Landkreis Sonneberg", () => {
  const son = () => jsonDateien("profile/lead-thueringen/beispiele/orkantief-ilka", { pflicht: true }).find((x) => x.name.includes("_SON_"))!.daten;
  // Soll aus dem KRITIS-LEAD-Szenario orkantief-ilka-sonneberg (Lagemeldung Nr. 4 des Krisenstabs, meldung_id …0701)
  const KRITIS = "1c4a2026-1013-4000-8000-000000000";

  it("KL-2026-W45-03: Bezug auf die Sachverhalte der Betreiber und der Leitstelle wie in Lagemeldung Nr. 4; Eingänge mit meldung_id", () => {
    const m = son();
    const r4wp = m.sachverhalte.find((s: any) => s.kennung === "DE-TH-SON-20261014-R4WP");
    expect(r4wp.bezug).toEqual([
      { kennung: "KRITIS-NETZSUED-20261013-N4ST7Q", art: "verdichtung", meldung_id: `${KRITIS}102` },
      { kennung: "KRITIS-MOBILB-20261014-M7FB9X", art: "verdichtung", meldung_id: `${KRITIS}201` },
      { kennung: "KRITIS-ZVTN-20261014-W2ZV3M", art: "verdichtung", meldung_id: `${KRITIS}301` },
      { kennung: "KRITIS-PFLEGEOL-20261014-P8HM4D", art: "verdichtung", meldung_id: `${KRITIS}401` },
      { kennung: "DE-TH-SON-20261014-G5RS6T", art: "verdichtung", meldung_id: `${KRITIS}501` },
    ]);
    const eingang = m.quellen.filter((q: any) => q.zugang === "eingangsmeldung").map((q: any) => [q.id, q.meldung_id]);
    expect(eingang).toEqual([
      ["Q3", `${KRITIS}102`],
      ["Q4", `${KRITIS}201`],
      ["Q5", `${KRITIS}501`],
    ]);
    expect(m.beziehungen).toEqual([{ art: "fortschreibung_von", meldung_id: `${KRITIS}701` }]);
    // Die Kennungen der Sachverhalte bleiben
    expect(m.sachverhalte.map((s: any) => s.kennung)).toEqual(["DE-TH-SON-20261014-R4WP", "DE-TH-SON-20261014-8HTB"]);
  });

  it("KL-2026-W45-04: eine Frist 15.10., 12:00 Uhr für Pflegeheime und Trinkwasser; Grundlage ist die Anforderung, das Ende der Reichweite der späteste Zeitpunkt", () => {
    const sv = son().sachverhalte[0];
    const f = sv.handlungsbedarf.fristen;
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ id: "F1", bis: "2026-10-15T12:00+02:00", adressat: "Landkreis und Zweckverband", empfehlung: "E1", quellen: ["Q2"] });
    expect(f[0].aufgabe).toMatch(/Pflegeheime.*Trinkwasserversorgung/);
    expect(f[0].grundlage).toMatch(/Lagemeldung Nr\. 4.*Anforderung.*15\.10\., 12:00 Uhr/);
    expect(f[0].bedingung).toContain("16.10., 10:00 Uhr");
    expect(sv.handlungsbedarf.empfehlungen[0]).toMatchObject({ id: "E1", termin: "2026-10-15T12:00+02:00" });
  });
});

describe("Kräftelage im Lagezentrum aus dem Kennzahlen-Baustein (Modul lead-baustein)", () => {
  it("Kennzahlen gleich dem Baustein (die Übernahme ändert nichts), Raum als Ausschnitt, Hinweis „Kennzahl als Beleg prüfen“", async () => {
    const p = await profilPflicht("lead-thueringen");
    const dateien = beispielDateien(p, "beispiele/orkantief-ilka");
    const land = dateien.find((d) => d.name.includes("_TH_Lagezentrum_"))!;
    const m = JSON.parse(land.text);
    const material = [];
    for (const d of beispielDateien(p, "beispiele/orkantief-ilka-thessa")) material.push(await dateiLesen(new File([d.text], d.name), p));
    const vorher = structuredClone(m);
    const befunde = bausteineUebernehmen(m, bausteineImMaterial(material));
    expect(m).toEqual(vorher);
    expect(befunde.filter((b) => b.stufe !== "hinweis")).toEqual([]);
    const strom = m.sachverhalte[1];
    expect(strom.kennzahlen.map((k: any) => [k.id, k.wert, k.teilmenge_von ?? null])).toEqual([
      ["K1", 151, null],
      ["K2", 123, "K1"],
      ["K3", 18, "K1"],
      ["K4", 98, "K2"],
    ]);
    expect(strom.kennzahlen.every((k: any) => k.raum === "Thüringen (erfasster Ausschnitt, Vollständigkeit nicht angegeben)")).toBe(true);
    const { eintraege } = einlesen([land], p);
    expect(kennzahlBelegHinweis(eintraege[0]!, p)).toContain("Stromausfall");
  });
});
