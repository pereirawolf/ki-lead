import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { profil, jsonDateien } from "./hilfen";
import { meldungAlsPdf, radarZeichnen } from "../src/dokumente/pdf";

describe("PDF mit Lagenradar", () => {
  it("zeichnet das Radar als Grafik neben die Achsenwerte", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const th = jsonDateien("../profile/lead-beispiel/beispiele/orkantief-ilka").find((x) => x.name.includes("_TH_"))!.daten;
    const blob = meldungAlsPdf(th, p, false);
    const text = new TextDecoder("latin1").decode(new Uint8Array(await blob.arrayBuffer()));
    // Achsenkürzel als Beschriftung der Grafik und Achsenwerte als Text
    expect(text).toContain("(D1) Tj");
    expect(text).toContain("(D8) Tj");
    expect(text).toMatch(/D1 R.umliche Auswirkung \/ Impact-Raum: \d/);
  });
  it("zeichnet offene Achsen ohne Absturz und ohne Werte", () => {
    const doc = new jsPDF();
    const def = { max: 6, achsen: ["d1", "d2", "d3"].map((key, i) => ({ key, label: `D${i + 1} Test`, stufen: Array(7).fill("x") })) };
    expect(() => radarZeichnen(doc, def, { d1: 3, d2: null, d3: undefined } as any, 10, 10, 50)).not.toThrow();
    expect(() => radarZeichnen(doc, def, undefined, 10, 10, 50)).not.toThrow();
  });
});
