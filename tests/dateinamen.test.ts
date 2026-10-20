// Dateinamen mit dem Datum vorn (Umsetzungsplan DN-01 bis DN-12, Testfälle T-01 bis T-15).
import { describe, expect, it } from "vitest";
import { profil } from "./hilfen";
import { dateiname, dateistempel, exportStempel, mitDatum } from "../src/kern/ausgabe";
import type { Profil } from "../src/kern/typen";

async function beispiel(): Promise<Profil> {
  return (await profil("lead-beispiel")).profil!;
}
const meldung = (zeit: unknown = "2026-10-20T20:31") => ({
  schema: "LEAD-Meldung-v1",
  land: "Bund",
  meldende_stelle: "THW OV Wesel",
  meldezeitpunkt: zeit,
});
const mitVorlage = (p: Profil, dateinameVorlage: string | undefined, rollen: Record<string, unknown> = {}): Profil => ({
  ...p,
  ui: { ...p.ui, dateiname: dateinameVorlage, rollen: { ...p.ui.rollen, ...rollen } },
});

describe("T-01/T-02: Beispiel aus der Anforderung", () => {
  it("Entwurf als PDF und JSON", async () => {
    const p = await beispiel();
    expect(dateiname(meldung(), p, true) + ".pdf").toBe("2026-10-20T20-31_LEAD-Meldung_Bund_THW_OV_Wesel_ENTWURF.pdf");
    expect(dateiname(meldung(), p, true) + ".json").toBe("2026-10-20T20-31_LEAD-Meldung_Bund_THW_OV_Wesel_ENTWURF.json");
  });

  it("finale Meldung ohne Zusatz", async () => {
    expect(dateiname(meldung(), await beispiel(), false) + ".pdf").toBe("2026-10-20T20-31_LEAD-Meldung_Bund_THW_OV_Wesel.pdf");
  });

  it("abgeleitete Ausgaben übernehmen den Basisnamen", async () => {
    const b = dateiname(meldung(), await beispiel(), false);
    expect(b + "_Management-Summary.txt").toBe("2026-10-20T20-31_LEAD-Meldung_Bund_THW_OV_Wesel_Management-Summary.txt");
    expect(b + "_Feldauszug.txt").toMatch(/^2026-10-20T20-31_LEAD-Meldung_.*_Feldauszug\.txt$/);
  });
});

describe("T-03/T-04/T-05: Vorlagen, Rückfall und Rollen", () => {
  it.each([
    ["{meldezeitpunkt}_X_{meldende_stelle}", "2026-10-20T20-31_X_THW_OV_Wesel"],
    ["X_{meldende_stelle}_{meldezeitpunkt}", "2026-10-20T20-31_X_THW_OV_Wesel"],
    ["X_{meldezeitpunkt}_{meldende_stelle}", "2026-10-20T20-31_X_THW_OV_Wesel"],
    ["{meldezeitpunkt}_X_{meldezeitpunkt}_{land}", "2026-10-20T20-31_X_Bund"],
    ["Lagemeldung_{meldende_stelle}", "2026-10-20T20-31_Lagemeldung_THW_OV_Wesel"],
  ])("Vorlage „%s“ → genau ein Datum vorn", async (vorlage, erwartet) => {
    expect(dateiname(meldung(), mitVorlage(await beispiel(), vorlage), false)).toBe(erwartet);
  });

  it("ohne Vorlage: Datum und Schema", async () => {
    expect(dateiname(meldung(), mitVorlage(await beispiel(), undefined), false)).toBe("2026-10-20T20-31_LEAD-Meldung-v1");
  });

  it("ohne gültigen Meldezeitpunkt: Exportzeitpunkt in der Profilzeitzone", async () => {
    const jetzt = new Date("2026-12-31T23:30:00Z"); // in Berlin bereits 01.01.2027, 00:30
    expect(dateiname(meldung(""), await beispiel(), false, jetzt)).toBe("2027-01-01T00-30_LEAD-Meldung_Bund_THW_OV_Wesel");
    expect(dateiname(meldung("31.02.2026"), await beispiel(), false, jetzt)).toMatch(/^2027-01-01T00-30_/);
  });

  it("Rolle meldezeitpunkt auf einem anderen Feld", async () => {
    const p = mitVorlage(await beispiel(), "LEAD_{stand}_{land}", { meldezeitpunkt: "stand" });
    expect(dateiname({ schema: "S", land: "Bund", stand: "2026-10-20T09:05" }, p, false)).toBe("2026-10-20T09-05_LEAD_Bund");
  });
});

describe("T-06: Zeitsemantik", () => {
  it("lokale Wanduhrzeit bleibt, absolute Zeitpunkte werden in die Profilzeitzone umgerechnet", () => {
    expect(dateistempel("2026-10-20T20:31", "Europe/Berlin")).toBe("2026-10-20T20-31");
    expect(dateistempel("2026-10-20T18:31:00Z", "Europe/Berlin")).toBe("2026-10-20T20-31");
    expect(dateistempel("2026-10-20T18:31:00.123Z", "America/New_York")).toBe("2026-10-20T14-31");
    expect(dateistempel("2026-12-31T23:30:00Z", "Europe/Berlin", "tag")).toBe("2027-01-01");
    expect(dateistempel("2026-10-20", "Europe/Berlin")).toBe("2026-10-20");
    expect(dateistempel("2026-10-20 20:31", "Europe/Berlin")).toBe("2026-10-20T20-31");
  });

  it("unbrauchbare Werte und ungültige Zonen", () => {
    for (const w of [undefined, "", "gestern", "2026-02-31", "2026-10-20T25:00", "20.10.2026"]) expect(dateistempel(w, "Europe/Berlin")).toBeNull();
    expect(exportStempel("Keine/Zone", new Date("2026-10-20T18:31:00Z"))).toBe("2026-10-20T20-31");
  });
});

describe("T-07/T-11: Bereinigung, keine Verdopplung", () => {
  it("Pfad- und Sonderzeichen werden ersetzt, Datumsangaben im Eigennamen bleiben", async () => {
    const d = { ...meldung(), meldende_stelle: "Stab 1/2: Lage 14.10.2026" };
    expect(dateiname(d, await beispiel(), false)).toBe("2026-10-20T20-31_LEAD-Meldung_Bund_Stab_1-2-_Lage_14.10.2026");
  });

  it("Steuerzeichen, Pfadteile am Rand und überlange Namen", async () => {
    expect(dateiname(meldung(), mitVorlage(await beispiel(), "../{schema}"), false)).toBe("2026-10-20T20-31_LEAD-Meldung-v1");
    expect(mitDatum("2026-10-20", "Lage\u0007bild\n", "pdf")).toBe("2026-10-20_Lagebild.pdf");
    expect(mitDatum("2026-10-20", "x".repeat(400), "csv")).toBe(`2026-10-20_${"x".repeat(150)}.csv`);
  });

  it("Lauf-ID und Originalnamen behalten eigene Datumsanteile", () => {
    expect(mitDatum("2026-10-20T20-31", "KI-LEAD_Lauf_20261020-203100-abcd", "json")).toBe("2026-10-20T20-31_KI-LEAD_Lauf_20261020-203100-abcd.json");
    expect(mitDatum("2026-10-20T20-31", "sop/teil-b/B01_unwetter.md")).toBe("2026-10-20T20-31_sop-teil-b-B01_unwetter.md");
  });
});

describe("T-15: chronologische Sortierung", () => {
  it("gleiches Format sortiert zeitlich", async () => {
    const p = await beispiel();
    const namen = ["2026-10-21T08:00", "2026-10-20T20:31", "2026-10-20T09:15"].map((z) => dateiname(meldung(z), p, false));
    expect([...namen].sort()).toEqual([namen[2], namen[1], namen[0]]);
  });
});
