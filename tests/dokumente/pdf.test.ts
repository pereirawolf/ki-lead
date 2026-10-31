// PDF und Kopiervorlage: Lagenradar, Freigabe am Ende, gegliederte Texte, falscher Listentyp (Review 20.10.2026, F10).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { jsPDF } from "jspdf";
import { meldungAlsPdf, pdfText, radarZeichnen, schemaVermerk } from "../../src/dokumente/pdf";

describe("PDF mit Lagenradar", () => {
  it("zeichnet das Radar als Grafik neben die Achsenwerte", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const th = ilkaMeldung("TH");
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
    const bund = ilkaMeldung("Bund");
    const roh = new TextDecoder("latin1").decode(new Uint8Array(await meldungAlsPdf(bund, p, false).arrayBuffer()));
    const pos = (s: string) => roh.indexOf(`(${s}`);
    expect(roh).not.toContain("Freigabe › Erfassung");
    expect(pos("Quellen & Referenzen")).toBeGreaterThan(0);
    expect(pos("Freigabe & Versand")).toBeGreaterThan(pos("Quellen & Referenzen"));
    expect(pos("Entstehung")).toBeGreaterThan(pos("Freigabe & Versand"));
    expect(pos("Handzeichen")).toBeGreaterThan(pos("Freigabe & Versand"));
  });
  it("gliedert Abschnitte des Bewertungstexts mit Zeilen und Absätzen", async () => {
    const { gliedereBewertung } = await import("../../src/kern/kennsaetze");
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

describe("Gegliederte Analysefelder", () => {
  it("setzt Absätze vor Schlüsselsätzen und Zeilen vor Aufzählungen und kurzen Aspektbegriffen", async () => {
    const { gliedereAnalyse, gliedereFeld } = await import("../../src/kern/kennsaetze");
    const p = (await profil("lead-beispiel")).profil!;
    const t =
      "Kernaussage: A brennt. Bestätigt ist nach [Q1] (Stand 18.10.2026, 08:22 Uhr): Feuer um 02:28 Uhr. Strom: rund 300 Anschlüsse. Verkehr → Versorgung: frei [Q2]. " +
      "Einordnung „Sonstiges“: kein Katalogwert. Mögliche Entwicklungen (Annahmen): Rauch. Prüf- und Abstimmungsbedarf: (1) Landkreis: prüfen. (2) Land: klären. " +
      "Abstimmungen haben nicht stattgefunden.";
    expect(gliedereAnalyse(t, p.ui)).toBe(
      "Kernaussage: A brennt.\n\nBestätigt ist nach [Q1] (Stand 18.10.2026, 08:22 Uhr): Feuer um 02:28 Uhr.\nStrom: rund 300 Anschlüsse.\nVerkehr → Versorgung: frei [Q2].\n\n" +
        "Einordnung „Sonstiges“: kein Katalogwert.\n\nMögliche Entwicklungen (Annahmen): Rauch.\n\nPrüf- und Abstimmungsbedarf:\n(1) Landkreis: prüfen.\n(2) Land: klären.\n\n" +
        "Abstimmungen haben nicht stattgefunden.",
    );
    // Ordnungszahlen bleiben bei ihrem Aspektbegriff; lange Satzteile vor einem Doppelpunkt sind kein Aspektbegriff
    expect(gliedereAnalyse("1. Land (Behörde): prüfen. Weg: bestehende Kanäle.\n2. Bund: klären. Sechs Länder haben gemeldet: A, B.", p.ui)).toBe(
      "1. Land (Behörde): prüfen.\nWeg: bestehende Kanäle.\n2. Bund: klären. Sechs Länder haben gemeldet: A, B.",
    );
    // Zuordnung über den Feldpfad: Analysefelder ja, andere Felder nein; ohne Konfiguration unverändert
    expect(gliedereFeld("sachverhalte[].analyse.lage_ereignis", "X. Szenario: Y.", p.ui)).toBe("X.\n\nSzenario: Y.");
    expect(gliedereFeld("sachverhalte[].bezeichnung", "X. Szenario: Y.", p.ui)).toBe("X. Szenario: Y.");
    expect(gliedereAnalyse("X. Szenario: Y.", { ...p.ui, analyse_gliederung: undefined })).toBe("X. Szenario: Y.");
  });
  it("übernimmt die Gliederung in Kopiervorlage und PDF", async () => {
    const { kopiervorlageHtml, kopiervorlageText } = await import("../../src/lagebild/ausgabe");
    const p = (await profil("lead-beispiel")).profil!;
    const he = ilkaMeldung("HE");
    const sv = he.sachverhalte[0];
    const eintrag = { id: "x", name: "he.json", daten: he, hinweise: [], schema: [] } as any;
    const s = { eintrag, index: 0, sv, bezeichnung: "B", arten: [], ort: "", eintritt: "", beurteilung: "", tendenz: "", bewertungText: "" } as any;
    expect(kopiervorlageText(s, p)).toContain("Prüf- und Abstimmungsbedarf:\n(1) Landkreis Fulda:");
    expect(kopiervorlageHtml(s, p)).toContain("Prüf- und Abstimmungsbedarf:<br>(1) Landkreis Fulda:");
    const roh = new TextDecoder("latin1").decode(new Uint8Array(await meldungAlsPdf(he, p, false).arrayBuffer()));
    expect(roh).toMatch(/\(Pr.f- und Abstimmungsbedarf:\) Tj/);
  });
});

describe("F10: PDF bei falschem Listentyp", () => {
  it.each([["defekt"], [{ a: 1 }], [42]])("erzeugt das PDF mit sichtbarem Hinweis statt abzubrechen (%j)", async (wert) => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = ilkaMeldung("Bund");
    d.sachverhalte = wert;
    let blob: Blob | undefined;
    expect(() => (blob = meldungAlsPdf(d, p, true))).not.toThrow();
    const roh = new TextDecoder("latin1").decode(new Uint8Array(await blob!.arrayBuffer()));
    expect(roh).toContain("ungültiger Datentyp");
  });

  it("null als Sachverhalte bleibt ohne Hinweis", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = ilkaMeldung("Bund");
    d.sachverhalte = null;
    const roh = new TextDecoder("latin1").decode(new Uint8Array(await meldungAlsPdf(d, p, true).arrayBuffer()));
    expect(roh).not.toContain("ungültiger Datentyp");
  });
});

describe("Kennsatzzeilen und Sonderzeichen im PDF (Lauf 20261022-073727-q2ex)", () => {
  // Ende eines Bewertungstexts wie im Lauf: Signal-Satzanfänge innerhalb einer Kennsatzzeile, Pfeile
  const ende =
    "D8 = 2: weil.\n\nAchsendivergenz: keine.\nNeubewertung bei: Ausnutzung in Thüringen\nÄnderung zur Vormeldung: Landesangebote wieder online; Betroffenheit: nicht überprüfbar; Beurteilung „erheblich“ → „geringfügig“, Tendenz „Verschärfung“ → „Entspannung“, D1 4 → 1";

  it("bricht eine Kennsatzzeile nicht an Signal-Satzanfängen um", async () => {
    const { gliedereBewertung } = await import("../../src/kern/kennsaetze");
    const p = (await profil("lead-beispiel")).profil!;
    const g = gliedereBewertung(ende, p.ui);
    const zeilen = g.split("\n");
    expect(zeilen).toContain(
      "Änderung zur Vormeldung: Landesangebote wieder online; Betroffenheit: nicht überprüfbar; Beurteilung „erheblich“ → „geringfügig“, Tendenz „Verschärfung“ → „Entspannung“, D1 4 → 1",
    );
    expect(zeilen.at(-2)).toBe("Neubewertung bei: Ausnutzung in Thüringen");
    // Außerhalb von Kennsätzen gliedert die Darstellung weiter
    expect(gliedereBewertung("Kernaussage: A. Beurteilung „erheblich“: weil.", p.ui)).toBe("Kernaussage: A.\n\nBeurteilung „erheblich“: weil.");
    // Ein Kennsatz mitten in der Zeile beginnt weiterhin eine eigene Zeile
    expect(gliedereBewertung("D8 = 2: weil. Neubewertung bei: X; Beurteilung „y“ offen", p.ui).split("\n").at(-1)).toBe(
      "Neubewertung bei: X; Beurteilung „y“ offen",
    );
  });

  it("ersetzt Zeichen außerhalb der Standardschrift lesbar", () => {
    expect(pdfText("D1 4 → 1; ⟦Ort⟧ ≥ 2 − 1")).toBe("D1 4 -> 1; [[Ort]] >= 2 - 1");
    expect(pdfText("„Gera“ – Straße · 5 € … ™")).toBe("„Gera“ – Straße · 5 € … ™");
    expect(pdfText("Bucureș\u0074i 😀")).toBe("Bucurest" + "i ?");
  });

  it("gibt Pfeile im PDF als „->“ aus statt als Zeichensalat", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const m = ilkaMeldung("Bund");
    m.sachverhalte[0].sofort.bewertung_text += "\n" + ende.split("\n").at(-1);
    const roh = new TextDecoder("latin1").decode(new Uint8Array(await meldungAlsPdf(m, p, true).arrayBuffer()));
    expect(roh).toContain("D1 4 -> 1");
    expect(roh).not.toMatch(/!\u0092|!’/);
  });
});

// Vermerk bei finaler Ausgabe trotz Schemabefund (seit 0.6.15). Grundlage: Befunddatei
// ki-lead-befund_technik_2026-W44-A3.json vom 30.10.2026 (Arbeitspaket A3), TP-2026-W44-42; SOP-LEAD A.5.
describe("TP-2026-W44-42: Vermerk „Schemaprüfung mit Befund“", () => {
  const roh = async (b: Blob) => new TextDecoder("latin1").decode(new Uint8Array(await b.arrayBuffer()));
  // Im PDF-Strom stehen Klammern maskiert: „\\(“ und „\\)“
  const VERMERK = pdfText(schemaVermerk(3)).replace(/[()]/g, "\\$&");

  it("benennt die Zahl der Abweichungen", () => {
    expect(schemaVermerk(1)).toBe("Schemaprüfung mit Befund (1 Abweichung) – als final ausgegeben");
    expect(schemaVermerk(3)).toBe("Schemaprüfung mit Befund (3 Abweichungen) – als final ausgegeben");
  });

  it("finale PDF mit Befund: Vermerk auf jeder Seite und in den Schlüsselwörtern", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const text = await roh(meldungAlsPdf(ilkaMeldung("Bund"), p, false, { schemaBefunde: 3 }));
    const seiten = (text.match(/\/Type \/Page\b/g) || []).length;
    expect(seiten).toBeGreaterThan(1);
    expect(text.split(`(${VERMERK}) Tj`).length - 1).toBe(seiten);
    // Schlüsselwörter mit Umlaut stehen als UTF-16 im Dokumentinfo-Eintrag
    const kw = text.slice(text.indexOf("/Keywords"), text.indexOf("/Creator")).replace(/\u0000/g, "");
    expect(kw).toContain("KI-LEAD, KI-generiert; Schemaprüfung mit Befund");
  });

  it.each([
    ["finale PDF ohne Befund", false, 0],
    ["Entwurf mit Befund", true, 3],
  ])("%s: kein Vermerk", async (_name, entwurf, befunde) => {
    const p = (await profil("lead-beispiel")).profil!;
    const text = await roh(meldungAlsPdf(ilkaMeldung("Bund"), p, entwurf, { schemaBefunde: befunde }));
    expect(text).not.toContain("Schemapr");
  });
});
