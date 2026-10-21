// Kontext aus dem Profil: Ereignisarten, SOP-Zuordnung, Arbeitsanweisungen und Platzhalter.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { kodierleitfadenKennung, sopKennungenAbgleichen } from "../../src/pipeline/stufen";
import {
  sopIdsAufloesen,
  verdichtungsAnweisung,
  VERDICHTUNG_S2,
  ereignisarten,
  s1Schema,
  sopsFuerArten,
  anweisungErfassung,
  anwendungsbereich,
  fachSops,
} from "../../src/pipeline/kontext";

describe("Kontext aus dem Profil", () => {
  it("liest Ereignisarten und ordnet SOPs zu", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const arten = ereignisarten(p!);
    expect(arten).toHaveLength(17);
    expect(arten).toContain("Stromausfall / Blackout");
    expect(sopsFuerArten(p!, ["Unwetter / Sturm", "Stromausfall / Blackout"])).toEqual(["b01", "b08"]);
    const schema: any = s1Schema(p!);
    expect(schema.properties.sachverhalte.items.properties.sops.items.enum).toHaveLength(34); // 17 Ereignis-SOPs und 17 Bausteine aus Teil C
    expect(anwendungsbereich(fachSops(p!)[0].text)).not.toMatch(/^###/);
  });

  it("ersetzt alle Platzhalter der Arbeitsanweisung und hängt den Ausgabevertrag an", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const t = anweisungErfassung(
      p!,
      { sachverhalt: "X", ausgangsquellen: "Y", stichtag: "2026-10-14", prueffrage: "keine", ereignisarten: "Z" },
      "2026-10-14T10:00",
    );
    expect(t).not.toMatch(/\{\{|\[nicht angegeben\]/);
    expect(t).toContain("Ausgabeformat (von der App vorgegeben)");
    expect(t).toContain("Rollenprofil (SOP-LEAD A.1 Nr. 4): übergreifende Redaktion");
  });

  it("setzt die Fassung des Kodierleitfadens aus dem Profil und gleicht SOP-Kennungen ab", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(kodierleitfadenKennung(p!)).toBe("Kodierleitfaden LEAD 1.2.2");
    // frühere Kennungen (01, N02) und aktuelle (B08) werden auf die gültige Kennung abgebildet
    const liste = [
      "SOP-LEAD 01 Unwetter / Sturm v0.4",
      "SOP-LEAD 99 Erfunden v1.0",
      "SOP-LEAD N02 irgendwas",
      "SOP-LEAD 1 Unwetter / Sturm",
      "SOP-LEAD B08 Strom",
    ];
    expect(sopKennungenAbgleichen(liste, p!)).toEqual([
      "SOP-LEAD B01 Unwetter / Sturm v2.0.1",
      "SOP-LEAD C11 Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit v1.1.0",
      "SOP-LEAD B08 Stromausfall / Blackout v2.0.1",
    ]);
    // Nicht in S1 bestätigte (nicht beigefügte) SOPs entfallen
    expect(sopKennungenAbgleichen(liste, p!, new Set(["b01"]))).toEqual(["SOP-LEAD B01 Unwetter / Sturm v2.0.1"]);
  });

  it("löst frühere SOP-IDs gespeicherter Läufe auf", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(sopIdsAufloesen(p!, ["sop-08", "baustein-n05", "b08", "c99", "baustein-n14"])).toEqual(["b08", "c12"]);
  });

  it("Verdichtung: Profilanweisung ohne offene Platzhalter, Ersatzfassung ohne Altregeln", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const v = verdichtungsAnweisung(p!);
    expect(v).not.toMatch(/\{\{|\[nicht angegeben\]/);
    expect(v).toContain("Fassung 2.0");
    for (const text of [v, VERDICHTUNG_S2]) {
      expect(text).not.toMatch(/gilt die jüngste|Jede Eingangsmeldung ist eine Quelle der Kategorie A|dürfen als Belege dienen|Untergrenze/);
    }
  });
});
