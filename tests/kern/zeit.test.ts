// Zeitwerte und Fristen: Zerlegen/Verbinden, Schemaformate des Beispielprofils, ungültige Kalenderdaten (Review 18.10.2026, F05).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { pruefeRoh } from "../../src/kern/validierung";
import { parseDatumDE } from "../../src/kern/kennsaetze";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { verbinde, zerlege } from "../../src/kern/zeit";

import { repoPfad } from "../support/dateien";
import { ILKA_ORDNER } from "../support/fixtures";

describe("Zeitwerte", () => {
  it("zerlegen und verbinden", () => {
    expect(zerlege("2026-10-20T08:15")).toEqual({ tag: "2026-10-20", zeit: "08:15" });
    expect(zerlege("2026-10-20")).toEqual({ tag: "2026-10-20", zeit: "" });
    expect(zerlege("")).toEqual({ tag: "", zeit: "" });
    expect(zerlege("gestern")).toEqual({ tag: "", zeit: "" });
    expect(verbinde("2026-10-20", "08:15", "datum_uhrzeit")).toBe("2026-10-20T08:15");
    expect(verbinde("2026-10-20", "", "datum_uhrzeit")).toBe("2026-10-20");
    expect(verbinde("2026-10-20", "08:15", "datum")).toBe("2026-10-20");
    expect(verbinde("", "08:15", "datumzeit")).toBe("");
  });

  it("Schema des Beispielprofils: Meldezeitraum und Eintritt mit oder ohne Uhrzeit, Meldezeitpunkt nur mit Uhrzeit", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const ordner = repoPfad(ILKA_ORDNER);
    const m = JSON.parse(
      readFileSync(
        join(
          ordner,
          readdirSync(ordner).find((n) => n.endsWith(".json"))!,
        ),
        "utf8",
      ),
    );
    const mit = (f: (d: any) => void) => {
      const d = structuredClone(m);
      f(d);
      return pruefeRoh(p.schema, d);
    };
    expect(mit(() => {})).toEqual([]);
    expect(
      mit((d) => {
        d.meldezeitraum = { von: "2026-10-13T06:00", bis: "2026-10-14" };
        d.sachverhalte[0].eintritt = "2026-10-13T21:40";
      }),
    ).toEqual([]);
    expect(mit((d) => (d.sachverhalte[0].eintritt = "2026-10-13T9:40")).length).toBeGreaterThan(0);
    expect(mit((d) => (d.meldezeitpunkt = "2026-10-14"))).toEqual([expect.objectContaining({ text: expect.stringContaining("Uhrzeit fehlt") })]);
    // Freigabedatum bleibt ein reines Datum
    expect(mit((d) => (d.freigabe.freigabe.datum = "2026-10-14T10:00"))).toEqual([expect.objectContaining({ pfad: expect.stringContaining("freigabe") })]);
  });
});

describe("F05: ungültige Fristen", () => {
  it.each(["31.02.2026", "29.02.2027", "01.13.2026", "10.10.2026 25:00", "10.10.2026 12:99", "00.10.2026"])("%s → null", (s) =>
    expect(parseDatumDE(s)).toBeNull(),
  );
  it("gültige Angaben bleiben", () => {
    expect(parseDatumDE("29.02.2028 12:30")?.getDate()).toBe(29);
    const d = parseDatumDE("Handlungsrelevant bis: 15.10.2026 12:00 (Nachbetankung)")!;
    expect([d.getDate(), d.getMonth(), d.getHours(), d.getMinutes()]).toEqual([15, 9, 12, 0]);
    expect(parseDatumDE("15.10.2026")!.getHours()).toBe(23);
  });
});
