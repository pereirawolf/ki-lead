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

describe("Freigabe am Ende und gegliederter Bewertungstext", () => {
  it("setzt Freigabe & Versand zwischen Quellen und Entstehung, nicht in den Kopf", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const bund = jsonDateien("../profile/lead-beispiel/beispiele/orkantief-ilka").find((x) => x.name.includes("_Bund_"))!.daten;
    const roh = new TextDecoder("latin1").decode(new Uint8Array(await meldungAlsPdf(bund, p, false).arrayBuffer()));
    const pos = (s: string) => roh.indexOf(`(${s}`);
    expect(roh).not.toContain("Freigabe › Erfassung");
    expect(pos("Quellen & Referenzen")).toBeGreaterThan(0);
    expect(pos("Freigabe & Versand")).toBeGreaterThan(pos("Quellen & Referenzen"));
    expect(pos("Entstehung")).toBeGreaterThan(pos("Freigabe & Versand"));
    expect(pos("Handzeichen")).toBeGreaterThan(pos("Freigabe & Versand"));
  });
  it("gliedert Abschnitte des Bewertungstexts mit Zeilen und Absätzen", async () => {
    const { gliedereBewertung } = await import("../src/kern/kennsaetze");
    const p = (await profil("lead-beispiel")).profil!;
    const t =
      "Kernaussage: A ist los.\nReferenzraum: Bund; t0 = 18.10.2026. Beurteilung „erheblich“: weil. Tendenz „Entspannung“: weil [Q1]. D1 = 2, weil. D2 = offen: fehlt.\nKeine Achsendivergenzen. Neubewertung bei: X Handlungsrelevant bis: 19.10.2026";
    expect(gliedereBewertung(t, p.ui)).toBe(
      "Kernaussage: A ist los.\n\nReferenzraum: Bund; t0 = 18.10.2026.\n\nBeurteilung „erheblich“: weil.\n\nTendenz „Entspannung“: weil [Q1].\n\nD1 = 2, weil.\nD2 = offen: fehlt.\n\nKeine Achsendivergenzen.\n\nNeubewertung bei: X Handlungsrelevant bis: 19.10.2026",
    );
    // Ohne Konfiguration bleibt der Text bis auf Kennsätze unverändert
    expect(gliedereBewertung("Satz eins. Beurteilung „x“: y.", { ...p.ui, bewertung_gliederung: undefined, kennsaetze: {} })).toBe(
      "Satz eins. Beurteilung „x“: y.",
    );
  });
});
