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
