// Befunde UX-2026-W45 (Oberfläche der Auswertung und der Profile, freigegeben am 04.11.2026). Je Test die Kennung des
// Befunds im Namen; das Soll steht im Befund, nicht im Code.

import { describe, expect, it } from "vitest";
import { adresseLesen, adresseText } from "../../src/ui/app/adresse";

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
