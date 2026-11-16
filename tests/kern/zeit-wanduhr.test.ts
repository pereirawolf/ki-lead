// Zeitfelder als Wanduhrzeit (seit 0.9.5): Art des Felds aus dem Schema, Versatz beim Speichern, Umrechnung beim Lesen,
// Kontrollzeile und lesbare Zeitzonen.
import { describe, expect, it } from "vitest";
import { v2Profil } from "../support/v2profil";
import { aufloesen, unterSchema } from "../../src/kern/schema";
import { teilePfad } from "../../src/kern/pfad";
import { kontrolltext, wanduhrAusWert, wanduhrMitVersatz, zeitartImSchema, zeitzonenBezeichnung } from "../../src/kern/zeit";

const B = "Europe/Berlin";

describe("Zeitfelder als Wanduhrzeit", () => {
  it("Art des Felds aus dem Schema: zeitpunkt, zeitangabe, datum; sonst keine", async () => {
    const p = await v2Profil("land", { mitDarstellung: true });
    const art = (pfad: string) => zeitartImSchema(aufloesen(unterSchema(p.schema, teilePfad(pfad)), p.schema), p.schema);
    expect(art("meldezeitpunkt")).toBe("datumzeit");
    expect(art("meldezeitraum.von")).toBe("datum_uhrzeit");
    expect(art("absender.stelle")).toBeUndefined();
    expect(art("zeitzone")).toBeUndefined();
  });

  it("Versatz beim Speichern: Winter- und Sommerzeit, doppelte Stunde die frühere, ausgefallene Stunde nach vorn", () => {
    expect(wanduhrMitVersatz("2026-11-16T17:36", B)).toBe("2026-11-16T17:36+01:00");
    expect(wanduhrMitVersatz("2026-10-14T10:30", B)).toBe("2026-10-14T10:30+02:00");
    expect(wanduhrMitVersatz("2026-10-25T02:30", B)).toBe("2026-10-25T02:30+02:00");
    expect(wanduhrMitVersatz("2026-03-29T02:30", B)).toBe("2026-03-29T03:30+02:00");
    expect(wanduhrMitVersatz("2026-11-16T17:36", "UTC")).toBe("2026-11-16T17:36+00:00");
  });

  it("Umrechnung beim Lesen: eigener Versatz ohne Hinweis, fremder mit Hinweis, Kalendertag unverändert", () => {
    expect(wanduhrAusWert("2026-11-16T17:36+01:00", B)).toEqual({ tag: "2026-11-16", zeit: "17:36" });
    expect(wanduhrAusWert("2026-11-16T16:36Z", B)).toEqual({ tag: "2026-11-16", zeit: "17:36", abweichend: "16.11.2026, 16:36 Uhr UTC" });
    expect(wanduhrAusWert("2026-11-16T23:30-05:00", B)).toEqual({ tag: "2026-11-17", zeit: "05:30", abweichend: "16.11.2026, 23:30 Uhr UTC-05:00" });
    expect(wanduhrAusWert("2026-10-14", B)).toEqual({ tag: "2026-10-14", zeit: "" });
    expect(wanduhrAusWert(null, B)).toEqual({ tag: "", zeit: "" });
    // Hin und zurück ergibt denselben Wert
    for (const w of ["2026-10-25T02:30+02:00", "2026-10-25T02:30+01:00", "2026-01-01T00:00+01:00"]) {
      const { tag, zeit } = wanduhrAusWert(w, B);
      expect(wanduhrAusWert(w, B).abweichend).toBeUndefined();
      expect(Date.parse(wanduhrMitVersatz(`${tag}T${zeit}`, B))).toBe(w === "2026-10-25T02:30+01:00" ? Date.parse("2026-10-25T02:30+02:00") : Date.parse(w));
    }
  });

  it("Kontrollzeile mit Wochentag und Zonenkürzel", () => {
    expect(kontrolltext("2026-11-16", "17:36", B)).toBe("Mo, 16.11.2026, 17:36 Uhr (MEZ)");
    expect(kontrolltext("2026-10-14", "10:30", B)).toBe("Mi, 14.10.2026, 10:30 Uhr (MESZ)");
    expect(kontrolltext("2026-10-14", "", B)).toBe("Mi, 14.10.2026");
    expect(kontrolltext("2026-02-31", "", B)).toBe("");
  });

  it("lesbare Zeitzonen", () => {
    expect(zeitzonenBezeichnung("Europe/Berlin")).toBe("Deutschland – MEZ/MESZ (Europe/Berlin)");
    expect(zeitzonenBezeichnung("UTC")).toBe("Koordinierte Weltzeit (UTC)");
  });
});
