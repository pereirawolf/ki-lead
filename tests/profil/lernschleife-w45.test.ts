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

describe("Lernschleife KW 45, Kodierleitfaden", () => {
  it.each(["profile/lead-beispiel/kodierleitfaden.md", "profile/lead-thueringen/kodierleitfaden.md"])(
    "LS-2026-W45-04: gerundete amtliche Zählangaben an einer Stufengrenze tragen die niedrigere Stufe als Mindestwert (%s)",
    (pfad) => {
      const text = lies(pfad);
      const regel = text.split("\n").find((z) => z.startsWith("6. **Keine unbelegte Präzision.**"));
      expect(regel).toBeDefined();
      expect(regel).toContain("**Gerundete Angaben:**");
      expect(regel).toContain("wird die niedrigere, sicher getragene Stufe als Mindestwert gesetzt");
      expect(regel).toContain("für modellierte Schätzungen und Hochrechnungen gilt die Bandbreitenregel");
      expect(text).toContain("oder einer gerundeten amtlichen Zählangabe an der Stufengrenze (Mindestkodierung, Grundregel 6)");
    },
  );
});

// Nachtrag: Befunddatei ki-lead-befund_lernschleife_2026-W45-b.json, LS-2026-W45-08 (Option A), freigegeben am 05.11.2026.
describe("Lernschleife KW 45 (Nachtrag), Kodierleitfaden", () => {
  it.each(["profile/lead-beispiel/kodierleitfaden.md", "profile/lead-thueringen/kodierleitfaden.md"])(
    "LS-2026-W45-08: Abschnitt 4 nennt die Grundlage der Tendenz (%s)",
    (pfad) => {
      const text = lies(pfad);
      const regel = text.split("\n").find((z) => z.startsWith("- **Tendenz** ("));
      expect(regel).toBeDefined();
      expect(regel).toContain("Die Tendenz beschreibt die erwartete Entwicklung des Sachverhalts im benannten Zeitfenster ab t0.");
      expect(regel).toContain("auf einen belegten Verlauf bis t0 oder auf eine Prognose einer zuständigen Stelle oder Fachbehörde");
      expect(regel).toContain("bei Folgesachverhalten die Prognose der auslösenden Gefahr, wenn die Kopplung belegt ist");
      expect(regel).toContain("ein Szenario der meldenden Stelle allein trägt keine Tendenz");
      expect(regel).toContain("Der Bewertungstext nennt, worauf sich die Tendenz stützt.");
      const beispiel = text.split("\n").find((z) => z.startsWith("| Mobilfunk im Ausfallgebiet über Notstrom;"));
      expect(beispiel).toContain("Tendenz Verschärfung");
    },
  );
});
