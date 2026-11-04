// Befunde UX-2026-W45 (Oberfläche der Auswertung und der Profile, freigegeben am 04.11.2026). Je Test die Kennung des
// Befunds im Namen; das Soll steht im Befund, nicht im Code.

import { describe, expect, it } from "vitest";
import { adresseLesen, adresseText } from "../../src/ui/app/adresse";
import { alterText, sammelErinnerungMailto, type StatusZeile } from "../../src/lagebild/lagebild";

describe("UX-2026-W45-05: Adresse der Auswertung", () => {
  it("liest #/auswertung/… und weiterhin #/lagebild/…, schreibt #/auswertung/…", () => {
    expect(adresseLesen("#/auswertung/redaktion")).toEqual({ ansicht: "lagebild", reiter: "redaktion" });
    expect(adresseLesen("#/lagebild/redaktion")).toEqual({ ansicht: "lagebild", reiter: "redaktion" });
    expect(adresseLesen("#/lagebild")).toEqual({ ansicht: "lagebild" });
    expect(adresseText({ ansicht: "lagebild", reiter: "redaktion" })).toBe("#/auswertung/redaktion");
    expect(adresseText({ ansicht: "lagebild" })).toBe("#/auswertung");
    expect(adresseText({ ansicht: "einstellungen", bereich: "modelle" })).toBe("#/einstellungen/modelle");
    expect(adresseLesen("#/unbekannt")).toEqual({ ansicht: "meldung" });
  });
});

describe("UX-2026-W45-07: Meldestatus", () => {
  const zeile = (name: string, email: string | undefined, gemeldet: boolean) =>
    ({ name, feld: "land", email, eintraege: gemeldet ? [{}] : [] }) as unknown as StatusZeile;

  it("Sammelerinnerung nur an echte Adressen offener Stellen, in Bcc", () => {
    const m = sammelErinnerungMailto([
      zeile("Bayern", "lage@by.de", false),
      zeile("Berlin", "lage@beispiel.de", false),
      zeile("Hessen", "lage@he.de", true),
      zeile("Sachsen", "lz@sn.de", false),
      zeile("Saarland", undefined, false),
    ])!;
    expect(m.anzahl).toBe(2);
    expect(m.href.startsWith("mailto:?bcc=")).toBe(true);
    const bcc = decodeURIComponent(m.href.slice("mailto:?bcc=".length).split("&")[0]!);
    expect(bcc.split(",")).toEqual(["lage@by.de", "lz@sn.de"]);
    expect(decodeURIComponent(m.href)).toContain("Ihrer Stelle");
  });

  it("ohne echte Adresse keine Sammelerinnerung", () => {
    expect(sammelErinnerungMailto([zeile("Berlin", "lage@beispiel.de", false)])).toBeNull();
  });

  it("Alter in Worten", () => {
    const jetzt = new Date("2026-10-16T12:00:00Z");
    expect(alterText(new Date("2026-10-16T11:30:00Z"), jetzt)).toBe("vor weniger als 1 Stunde");
    expect(alterText(new Date("2026-10-16T09:00:00Z"), jetzt)).toBe("vor 3 Stunden");
    expect(alterText(new Date("2026-10-15T11:00:00Z"), jetzt)).toBe("vor 1 Tag");
    expect(alterText(new Date("2026-10-14T10:00:00Z"), jetzt)).toBe("vor 2 Tagen");
    expect(alterText(new Date("2026-10-17T10:00:00Z"), jetzt)).toBe("");
    expect(alterText(null, jetzt)).toBe("");
  });
});
