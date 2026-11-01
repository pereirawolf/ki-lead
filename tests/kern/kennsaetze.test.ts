// Kennsätze und Ausfüllhinweise, auch mitten im Fließtext.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaDateien, ilkaMeldung } from "../support/fixtures";
import { ausfuellHinweise, kennsatz, kennsaetzeImFliesstext } from "../../src/kern/kennsaetze";

const ilka = ilkaDateien();
const he = ilkaMeldung("HE");

describe("Quellen und Kennsätze", () => {
  it("liest Kennsätze", () => {
    expect(kennsatz("Kernaussage.\nHandlungsrelevant bis: 15.10.2026 12:00", "Handlungsrelevant bis:")).toBe("15.10.2026 12:00");
  });

  it("gibt Ausfüllhinweise ohne Absturz", async () => {
    const { profil: p } = await profil("lead-beispiel");
    for (const { daten } of ilka) expect(Array.isArray(ausfuellHinweise(daten, p!.ui))).toBe(true);
  });
});

// Soll: GK-2026-W44-12 (Option A) – die Leitfrage nennt den Referenzraum des Profils statt eines festen Fachbezugs.
describe("GK-2026-W44-12: Leitfrage des Bewertungstexts aus dem Referenzraum", () => {
  it("Bewertung ohne Text: Hinweis mit Referenzraum, ohne Angabe allgemein, nie „Bevölkerungsschutz“ als fester Text", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const m = structuredClone(he);
    m.sachverhalte[0].sofort.bewertung_text = "";
    const text = (raum?: string) => ausfuellHinweise(m, p!.ui, undefined, raum).find((b) => /ohne Text – erster Satz/.test(b.text))!.text;
    expect(text("Funktionsfähigkeit der Justiz in Thüringen")).toContain(
      "Was bedeutet das für den Referenzraum (Funktionsfähigkeit der Justiz in Thüringen), und warum jetzt?",
    );
    expect(text()).toContain("Was bedeutet das für den Referenzraum, und warum jetzt?");
    expect(text("Funktionsfähigkeit der Justiz in Thüringen")).not.toContain("Bevölkerungsschutz");
  });
});

describe("Kennsätze im Fließtext", () => {
  const ks = ["Neubewertung bei:", "Handlungsrelevant bis:"];
  it("erkennt Kennsätze mitten in einer Zeile", () => {
    expect(kennsaetzeImFliesstext("D8 offen: keine Beobachtungsbasis. Neubewertung bei: Fall in Deutschland", ks)).toEqual(["Neubewertung bei:"]);
    expect(kennsaetzeImFliesstext("Text\nNeubewertung bei: Fall in Deutschland", ks)).toEqual([]);
    expect(kennsaetzeImFliesstext("Siehe Neubewertung bei: unten\nNeubewertung bei: Fall", ks)).toEqual([]);
    expect(kennsaetzeImFliesstext("", ks)).toEqual([]);
  });

  it("meldet sie als Ausfüllhinweis", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const m = structuredClone(he);
    m.sachverhalte[0].sofort.bewertung_text = "Kernaussage: Lage ruhig. Neubewertung bei: erneuter Sturmwarnung";
    const h = ausfuellHinweise(m, p!.ui);
    expect(h.some((b) => /„Neubewertung bei:“ steht im Fließtext/.test(b.text))).toBe(true);
  });
});

// Frist auf oder vor t0 im Prüfschritt (seit 0.6.15). Grundlage: Befunddatei ki-lead-befund_technik_2026-W44-A3.json
// vom 30.10.2026 (Arbeitspaket A3), TP-2026-W44-43; Fehlerbild der Vergleichsreihen vom 25.10.2026.
describe("TP-2026-W44-43: Frist auf oder vor dem Meldezeitpunkt", () => {
  const ZONE = "Europe/Berlin";
  /** Meldung HE mit Meldezeitpunkt 14.10.2026 10:15 und einer Fristzeile im ersten Sachverhalt */
  const mitFrist = (zeile: string, t0 = "2026-10-14T10:15") => {
    const m = structuredClone(he);
    m.meldezeitpunkt = t0;
    m.sachverhalte[0].sofort.bewertung_text = `Kernaussage: Lage angespannt.\n${zeile}`;
    return m;
  };
  const frist = async (m: unknown, zone: string | undefined = ZONE) => {
    const { profil: p } = await profil("lead-beispiel");
    return ausfuellHinweise(m as never, p!.ui, zone).filter((b) => /liegt auf oder vor dem Meldezeitpunkt/.test(b.text));
  };

  it.each([
    ["vor t0", "Handlungsrelevant bis: 13.10.2026 18:00 – Sandsäcke ausgeben, Kreise", 1],
    ["auf t0 mit Uhrzeit", "Handlungsrelevant bis: 14.10.2026 10:15 – Lage melden, Land", 1],
    ["auf t0 ohne Uhrzeit (Tag zählt)", "Handlungsrelevant bis: 14.10.2026 – Lage melden, Land", 1],
    ["nach t0 am selben Tag", "Handlungsrelevant bis: 14.10.2026 16:00 – Lage melden, Land", 0],
    ["am Folgetag", "Handlungsrelevant bis: 15.10.2026 – Lage melden, Land", 0],
    ["als überfällig gekennzeichnet", "Handlungsrelevant bis: 13.10.2026 18:00 – überfällig, Erledigung ungeklärt", 0],
  ])("%s", async (_name, zeile, anzahl) => {
    expect((await frist(mitFrist(zeile))).length).toBe(anzahl);
  });

  it("ohne Meldezeitpunkt kein Hinweis", async () => {
    expect((await frist(mitFrist("Handlungsrelevant bis: 13.10.2026 18:00 – Lage melden, Land", ""))).length).toBe(0);
  });

  it("nennt Sachverhalt und Datum im Hinweis", async () => {
    const [b] = await frist(mitFrist("Handlungsrelevant bis: 13.10.2026 18:00 – Sandsäcke ausgeben, Kreise"));
    expect(b!.stufe).toBe("hinweis");
    expect(b!.text).toContain("„Handlungsrelevant bis: 13.10.2026“");
    expect(b!.text).toContain("überfällig, Erledigung ungeklärt");
  });
});
