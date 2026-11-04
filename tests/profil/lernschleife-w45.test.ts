// Regeln aus der Lernschleife KW 45 (Befunddatei ki-lead-befund_lernschleife_2026-W45.json, freigegeben am 04.11.2026).
// Das Soll steht als fester Text im Test und folgt aus dem jeweiligen Befund; geprüft wird der Dateitext.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";

function lies(pfad: string): string {
  return readFileSync(repoPfad(pfad), "utf-8");
}

const ERFASSUNG = ["profile/lead-beispiel/anweisung-erfassung.md", "profile/lead-thueringen/anweisung-erfassung.md"];

describe("Lernschleife KW 45", () => {
  it.each(ERFASSUNG)("LS-2026-W45-01: der Redaktionsmaßstab ist keine Obergrenze bei vorstrukturiertem Material (%s)", (pfad) => {
    const text = lies(pfad);
    expect(text).toContain("Der Richtwert ist keine Obergrenze.");
    expect(text).toContain("Gekürzt wird zuerst die Lagebeschreibung, nicht der Maßnahmen- und Empfehlungsteil.");
  });

  it.each(ERFASSUNG)("LS-2026-W45-02: „Nicht übernommen“ nennt gekürzte oder nicht zugeordnete Materialteile (%s)", (pfad) => {
    const zeile = lies(pfad)
      .split("\n")
      .find((z) => z.startsWith("Nicht übernommen: verworfene"));
    expect(zeile).toBeDefined();
    expect(zeile).toContain("gekürzt, zusammengefasst oder keinem Sachverhalt zugeordnet");
    expect(zeile).toContain("nur die Kennungen");
  });
});
