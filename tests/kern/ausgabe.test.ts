// Ausgaben: Dateinamen, Management Summary, CSV ohne Formelinterpretation (Review 18.10.2026, F13).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { dateiname, managementSummary } from "../../src/kern/ausgabe";
import { alsCsv } from "../../src/lagebild/ausgabe";

describe("Ausgabe", () => {
  it("bildet Dateinamen nach der Vorlage des Profils", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = ilkaMeldung("HE");
    expect(dateiname(d, p!, true)).toBe(
      d.meldezeitpunkt.replace(/:/g, "-") + "_LEAD-Meldung_Hessen_" + d.meldende_stelle.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_") + "_ENTWURF",
    );
  });

  it("erzeugt eine Management Summary ohne Quellenverweise", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const bund = ilkaMeldung("Bund");
    const text = managementSummary(bund, p!);
    expect(text).toMatch(/Management Summary/);
    expect(text).toMatch(/Lage & Ereignis/);
    expect(text).not.toMatch(/\[Q\d/);
  });
});

describe("F13: CSV ohne Formelinterpretation", () => {
  it("setzt vor Formelzeichen ein Apostroph, Zahlen bleiben", () => {
    const csv = alsCsv([["=1+1", "+A1", "-cmd", "@SUMME(A1)", "\tx", "-3", "+2", "4,5", "normal"]]);
    expect(csv).toBe("﻿'=1+1;'+A1;'-cmd;'@SUMME(A1);'\tx;-3;+2;4,5;normal\r\n");
  });
});
