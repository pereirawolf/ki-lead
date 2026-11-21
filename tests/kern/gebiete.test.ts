// Amtliche Gebietsschlüssel und Gebietsverzeichnis (seit 0.9.8, Entscheidungen des Herausgebers vom 21.11.2026).
// Soll unabhängig vom Code: Aufbau des Amtlichen Gemeinde- und Regionalschlüssels nach Destatis (Land 2, Regierungsbezirk 1,
// Kreis 2, Gemeindeverband 4, Gemeinde 3 Stellen; AGS ohne Gemeindeverband), ISO 3166-2:DE und von Hand nachgesehene
// Einträge der Quartalsausgabe GV-ISys zum 30.09.2026 (Thüringen, Sonneberg, kreisfreie Städte).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { gebietDateiFehler, kontext, liegtIn, nachName, normSchluessel, suche, ueberlappen, verzeichnisAus, type GebietDatei } from "../../src/kern/gebiete";
import { istLandSchluessel } from "../../src/kern/baustein";
import { LAENDER } from "../../src/kern/meldung-v2.js";
import { repoPfad } from "../support/dateien";

const lies = (n: string): GebietDatei => JSON.parse(readFileSync(repoPfad(`formate/fremd/gv-isys/${n}`), "utf-8"));
const KERN = lies("gebiete-kern.json");
const GEMEINDEN = lies("gebiete-gemeinden.json");
const V = verzeichnisAus(KERN, GEMEINDEN);
const NUR_KERN = verzeichnisAus(KERN);

describe("Schlüsselregel: Ziffern am Präfix, ISO für Staaten", () => {
  it("Umrechnung: ISO-Länder in Ziffern, 12-stelliger Regionalschlüssel in den Gemeindeschlüssel", () => {
    expect(normSchluessel("DE-TH")).toBe("16");
    expect(normSchluessel(" de-sh ")).toBe("01");
    expect(normSchluessel("160725003018")).toBe("16072018");
    expect(normSchluessel("16072")).toBe("16072");
    expect(normSchluessel("CZ")).toBe("CZ");
    expect(normSchluessel(undefined)).toBe("");
  });

  it("Lage: Gemeinde im Kreis im Land, „DE“ umfasst alle Ziffernschlüssel, Staaten nicht ineinander", () => {
    expect(liegtIn("16072018", "16072")).toBe(true);
    expect(liegtIn("16072", "DE-TH")).toBe(true);
    expect(liegtIn("16072", "16")).toBe(true);
    expect(liegtIn("16", "16072")).toBe(false);
    expect(liegtIn("16072", "DE")).toBe(true);
    expect(liegtIn("CZ", "DE")).toBe(false);
    expect(ueberlappen("DE-TH", "16069")).toBe(true);
    expect(ueberlappen("16069", "16072")).toBe(false);
    expect(istLandSchluessel("DE-TH")).toBe(true);
    expect(istLandSchluessel("16072")).toBe(false);
  });

  it("Länder der Migration und der Nachbearbeitung in Ziffern, Bund „DE“; jedes Land steht so im Verzeichnis", () => {
    expect(LAENDER.Thüringen).toBe("16");
    expect(LAENDER.Bund).toBe("DE");
    for (const [name, s] of Object.entries(LAENDER)) expect(V.nach.get(s)?.name, name).toBe(name);
  });
});

describe("Verzeichnis aus GV-ISys, Gebietsstand 30.09.2026", () => {
  it("Dateien gültig, Stand und Quelle genannt; Zahl der Einträge wie in der Ausgabe", () => {
    expect(gebietDateiFehler(KERN)).toEqual([]);
    expect(gebietDateiFehler(GEMEINDEN)).toEqual([]);
    expect(KERN.stand).toBe("2026-09-30");
    expect(KERN.quelle).toMatch(/^Statistische Ämter des Bundes und der Länder, Gemeindeverzeichnis-Informationssystem GV-ISys, Gebietsstand 30\.09\.2026/);
    expect(KERN.rechte).toMatch(/mit Quellenangabe gestattet/);
    const je = (e: string) => KERN.eintraege.filter((x) => x[2] === e).length;
    expect([je("Staat"), je("Land"), je("Kreis")]).toEqual([1, 16, 401]);
    expect(GEMEINDEN.eintraege.length).toBe(10943);
  });

  it("jeder Eintrag liegt in einem Land und jede Gemeinde in einem Kreis; außer drei Gebieten ohne Kreis (Kreisstellen 000)", () => {
    const ohneKreis: string[] = [];
    for (const [s] of [...KERN.eintraege, ...GEMEINDEN.eintraege]) {
      if (s === "DE") continue;
      expect(V.nach.has(s.slice(0, 2)), s).toBe(true);
      if (s.length === 8 && !V.nach.has(s.slice(0, 5))) ohneKreis.push(s);
    }
    // gemeinsames deutsch-luxemburgisches Hoheitsgebiet, gemeindefreies Gebiet und Küstengewässer Mecklenburg-Vorpommerns
    expect(ohneKreis).toEqual(["07000999", "13000998", "13000999"]);
  });

  it("Thüringen: 17 Landkreise und 5 kreisfreie Städte mit Art im Namen", () => {
    const th = KERN.eintraege.filter(([s, , e]) => e === "Kreis" && s.startsWith("16"));
    expect(th).toHaveLength(22);
    expect(th.filter(([, n]) => n.startsWith("Kreisfreie Stadt ")).map(([s]) => s)).toEqual(["16051", "16052", "16053", "16054", "16055"]);
    expect(V.nach.get("16072")?.name).toBe("Landkreis Sonneberg");
    expect(V.nach.get("16070")?.name).toBe("Ilm-Kreis");
    expect(V.nach.get("16072018")?.name).toBe("Sonneberg, Stadt");
    expect(kontext(V, V.nach.get("16072018")!)).toBe("Landkreis Sonneberg, Thüringen");
    expect(kontext(V, V.nach.get("16051000")!)).toBe("Thüringen");
  });
});

describe("Name → Schlüssel nur bei Eindeutigkeit", () => {
  it("alle meldenden Gebiete des Landesprofils finden ihren Kreis", () => {
    const schema = JSON.parse(readFileSync(repoPfad("profile/lead-thueringen/meldung.schema.json"), "utf-8"));
    const namen: string[] = schema.properties.absender.properties.gebiet.properties.name.enum;
    const gefunden = namen.map((n) => [n, nachName(NUR_KERN, n, "16")?.schluessel]);
    expect(gefunden.filter(([, s]) => !s)).toEqual([]);
    expect(Object.fromEntries(gefunden)).toMatchObject({
      Thüringen: "16",
      "Stadt Erfurt": "16051",
      "Landkreis Sonneberg": "16072",
      "Landkreis Weimarer Land": "16071",
    });
  });

  it("Art im Namen entscheidet zwischen Kreis und gleichnamiger Stadt; mehrdeutige Namen ergeben nichts", () => {
    expect(nachName(V, "Landkreis Sonneberg")?.schluessel).toBe("16072");
    expect(nachName(V, "Sonneberg, Stadt")?.schluessel).toBe("16072018");
    expect(nachName(V, "Stadt Sonneberg")?.schluessel).toBe("16072018");
    expect(nachName(V, "Erfurt")?.schluessel).toBe("16051");
    expect(nachName(V, "Landkreis Rostock")?.schluessel).toBe("13072");
    expect(nachName(V, "Hansestadt Rostock")?.schluessel).toBe("13003");
    expect(nachName(V, "Rostock")).toBeUndefined();
    expect(nachName(V, "Neustadt")).toBeUndefined();
    expect(nachName(V, "Talsperre Leibis")).toBeUndefined();
  });
});

describe("Suche", () => {
  it("Namensanfang vor Wortanfang, Land des Profils zuerst, höhere Ebene vor der Gemeinde", () => {
    const t = suche(V, "Sonneb", { vorrang: "16" }).map((e) => e.schluessel);
    expect(t.slice(0, 2)).toEqual(["16072", "16072018"]);
    expect(suche(V, "Saale-Holz").map((e) => e.name)).toEqual(["Saale-Holzland-Kreis"]);
    expect(suche(V, "Weimar", { vorrang: "16" })[0]?.schluessel).toBe("16055");
  });

  it("Suche nach Schlüssel: Präfix, kürzester zuerst; ISO-Land wird umgerechnet", () => {
    expect(suche(V, "16072").map((e) => e.schluessel)[0]).toBe("16072");
    expect(suche(V, "DE-TH")[0]?.name).toBe("Thüringen");
    expect(suche(V, "")).toEqual([]);
  });
});
