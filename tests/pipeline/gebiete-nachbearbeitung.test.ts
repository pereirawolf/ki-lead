// Gebietsschlüssel in der KI-Nachbearbeitung (seit 0.9.8, Entscheidung des Herausgebers vom 21.11.2026): Die App ergänzt
// Schlüssel aus dem Gemeindeverzeichnis, statt sie dem Modell zu glauben. Soll unabhängig vom Code: Einträge der
// Quartalsausgabe GV-ISys zum 30.09.2026, von Hand nachgesehen (Landkreis Sonneberg 16072, Sonneberg 16072018, Lauscha
// 16072011, Thüringen 16).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verzeichnisAus, type GebietDatei } from "../../src/kern/gebiete";
import type { Meldung } from "../../src/kern/typen";
import { gebieteErgaenzen } from "../../src/pipeline/nachbearbeitung-v2";
import { GEBIETE_KERN, gebieteVoll } from "../../src/pipeline/gebieteDaten";
import { repoPfad } from "../support/dateien";

const lies = (n: string): GebietDatei => JSON.parse(readFileSync(repoPfad(`formate/fremd/gv-isys/${n}`), "utf-8"));
const V = verzeichnisAus(lies("gebiete-kern.json"), lies("gebiete-gemeinden.json"));

const meldung = (gebiete: Record<string, unknown>[], absender = { name: "Thüringen", schluessel: "DE-TH" }): Meldung =>
  ({ absender: { stelle: "Lagezentrum", ebene: "Land", gebiet: { ...absender } }, sachverhalte: [{ raum: { beschreibung: "", gebiete } }] }) as Meldung;

describe("Gebietsschlüssel nach dem Gemeindeverzeichnis", () => {
  it("ergänzt fehlende Schlüssel eindeutiger Namen, rechnet „DE-TH“ um und nennt jede Änderung", () => {
    const d = meldung([{ name: "Landkreis Sonneberg" }, { name: "Lauscha, Stadt" }, { name: "Talsperre Leibis" }]);
    const b = gebieteErgaenzen(d, V);
    expect(d.absender.gebiet).toEqual({ name: "Thüringen", schluessel: "16" });
    expect(d.sachverhalte[0].raum.gebiete).toEqual([
      { name: "Landkreis Sonneberg", schluessel: "16072" },
      { name: "Lauscha, Stadt", schluessel: "16072011" },
      { name: "Talsperre Leibis" },
    ]);
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ stufe: "hinweis", code: "GEBIET_SCHLUESSEL" });
    expect(b[0]!.text).toContain("Gebietsstand 30.09.2026");
    expect(b[0]!.text).toContain("„Lauscha, Stadt“ → 16072011 (Landkreis Sonneberg, Thüringen)");
    expect(b[0]!.text).toContain("ohne Schlüssel (Name mehrdeutig oder nicht im Verzeichnis): „Talsperre Leibis“");
  });

  it("ersetzt einen Schlüssel, der zu einem anderen Gebiet gehört, und entfernt unbekannte; Staaten bleiben", () => {
    const d = meldung([
      { name: "Sonneberg, Stadt", schluessel: "16072013" },
      { name: "Irgendwo", schluessel: "16099999" },
      { name: "Tschechien", schluessel: "CZ" },
      { name: "Landkreis Sonneberg", schluessel: "16072" },
    ]);
    const [b] = gebieteErgaenzen(d, V);
    expect(d.sachverhalte[0].raum.gebiete).toEqual([
      { name: "Sonneberg, Stadt", schluessel: "16072018" },
      { name: "Irgendwo" },
      { name: "Tschechien", schluessel: "CZ" },
      { name: "Landkreis Sonneberg", schluessel: "16072" },
    ]);
    expect(b!.text).toContain("ersetzt: „Sonneberg, Stadt“ → 16072018 (Landkreis Sonneberg, Thüringen) statt 16072013");
    expect(b!.text).toContain("entfernt, weil nicht im Verzeichnis: „Irgendwo“: 16099999");
  });

  it("ohne Änderung kein Hinweis; der Kern genügt für Länder und Kreise", async () => {
    const d = meldung([{ name: "Landkreis Sonneberg", schluessel: "16072" }], { name: "Thüringen", schluessel: "16" });
    expect(gebieteErgaenzen(d, GEBIETE_KERN)).toEqual([]);
    expect((await gebieteVoll()).nach.get("16072018")?.name).toBe("Sonneberg, Stadt");
  });
});
