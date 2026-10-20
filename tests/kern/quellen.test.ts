// Quellenangaben: Einträge, Verweise, Kategorien, Quellenzeilen und terminierende Bereiche (Review 20.10.2026, F01).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import {
  kategorienGeordnet,
  parseQuellen,
  quellenHinweise,
  rangfolgeText,
  verweise,
  erstePlatzhalterstelle,
  lagemeldungRumpf,
  naechsteQuellenNr,
  quellenZeile,
  vorgeschlageneKategorie,
} from "../../src/kern/quellen";

const HEUTE = "20.10.2026";

describe("Quellen und Kennsätze", () => {
  it("liest Einträge und Verweise", () => {
    const e = parseQuellen("[Q1] A – DWD (01.10.2026): X [Zugriff: 01.10.2026]\nFolgezeile\n[Q2] M – Y");
    expect(e.map((x) => [x.nr, x.code])).toEqual([
      [1, "A"],
      [2, "M"],
    ]);
    expect(e[0].text).toContain("Folgezeile");
    expect([...verweise("siehe [Q1–Q3] und [Q5, Q7]")]).toEqual([1, 2, 3, 5, 7]);
  });

  it("findet fehlende und alte Kategorien", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = ilkaMeldung("Bund");
    d.quellen = "[Q1] J – Alt (01.10.2026): X";
    const texte = quellenHinweise(d, p!.ui)
      .map((b) => b.text)
      .join("\n");
    expect(texte).toMatch(/\[Q1\]: Kategorie fehlt oder ungültig/);
    expect(texte).toMatch(/Zugriffsdatum fehlt/);
  });

  it("akzeptiert Betreiberquellen (B) und ordnet Kategorien nach der Rangfolge", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = ilkaMeldung("Bund");
    d.quellen = "[Q1] B – Stadtwerke X (14.10.2026): Störungsmeldung [Zugriff: 14.10.2026]";
    const texte = quellenHinweise(d, p!.ui)
      .map((b) => b.text)
      .join("\n");
    expect(texte).not.toMatch(/Kategorie fehlt oder ungültig/);
    expect(kategorienGeordnet(p!.ui).map(([c]) => c)).toEqual(["A", "B", "W", "M", "P"]);
    expect(rangfolgeText(p!.ui)).toBe("A > B > W > M > P");
    d.quellen = "[Q1] X – Unbekannt (14.10.2026): Titel [Zugriff: 14.10.2026]";
    const fehler = quellenHinweise(d, p!.ui)
      .map((b) => b.text)
      .join("\n");
    expect(fehler).toContain("Kategorie fehlt oder ungültig (A, B, W, M, P)");
  });
});

describe("Quellenzeilen", () => {
  it("Kategorie und Art kombinieren", async () => {
    const ui = (await profil("lead-beispiel")).profil!.ui;
    expect(quellenZeile({ nr: 1, kategorie: "A", heute: HEUTE }, ui)).toBe(
      "[Q1] A – Herausgeber (Datum): Titel. Online abrufbar unter: URL [Zugriff: 20.10.2026]",
    );
    expect(quellenZeile({ nr: 3, kategorie: "M", heute: HEUTE }, ui)).toMatch(/^\[Q3\] M – Herausgeber/);
    expect(quellenZeile({ nr: 2, kategorie: "M", art: "url", heute: HEUTE, zusaetze: { paywall: true } }, ui)).toBe(
      "[Q2] M – Herausgeber (Datum): Titel. Online abrufbar unter: URL (Paywall) [Zugriff: 20.10.2026]",
    );
    expect(quellenZeile({ nr: 4, kategorie: "A", art: "lagebild", heute: HEUTE }, ui)).toBe(
      "[Q4] A – Herausgeber (Datum, Uhrzeit): Lagebild „Bezeichnung“, Ausgabe Nr. (behördenintern) [Zugriff: 20.10.2026]",
    );
    expect(quellenZeile({ nr: 5, kategorie: "W", art: "datensatz", heute: HEUTE, zusaetze: { datenstand: true, nichtAusgewertet: true } }, ui)).toBe(
      "[Q5] W – Herausgeber (Datum): Titel (Datensatz). Online abrufbar unter: URL [Zugriff: 20.10.2026] · Datenstand: TT.MM.JJJJ · nicht ausgewertet",
    );
    expect(quellenZeile({ nr: 6, kategorie: "X", art: "auskunft", heute: HEUTE }, ui)).toMatch(/^\[Q6\] Stelle, Funktion/);
    // Paywall ohne URL steht vor dem Zugriffsdatum
    expect(quellenZeile({ nr: 8, kategorie: "W", art: "dokument", heute: HEUTE, zusaetze: { paywall: true } }, ui)).toBe(
      "[Q8] W – Herausgeber (Jahr): Titel. Verlag bzw. Reihe (Paywall) [Zugriff: 20.10.2026]",
    );
    // Jede erzeugte Zeile wird als Quelle mit Kategorie erkannt und hat ein Zugriffsdatum (keine Hinweise der Quellenprüfung)
    for (const art of ["url", "pressemitteilung", "lagebild", "lagemeldung", "datensatz", "social", "auskunft", "dokument"]) {
      const z = quellenZeile({ nr: 7, kategorie: vorgeschlageneKategorie(art, ui) ?? "M", art, heute: HEUTE }, ui);
      expect(parseQuellen(z)[0], art).toMatchObject({ nr: 7, code: expect.stringMatching(/^[ABWMP]$/) });
      expect(
        quellenHinweise({ quellen: z, sachverhalte: [{ analyse: { kern: "[Q7]" } }] } as never, ui)
          .map((b) => b.text)
          .filter((t) => /Zugriff|Kategorie/.test(t)),
        art,
      ).toEqual([]);
    }
  });

  it("vorgeschlagene Kategorie, nächste Nummer, erster Platzhalter", async () => {
    const ui = (await profil("lead-beispiel")).profil!.ui;
    expect(vorgeschlageneKategorie("social", ui)).toBe("P");
    expect(vorgeschlageneKategorie("url", ui)).toBeUndefined();
    expect(vorgeschlageneKategorie("social", { ...ui, quellen: { ...ui.quellen!, kategorien: { A: "amtlich" } } })).toBeUndefined();
    expect(naechsteQuellenNr("")).toBe(1);
    expect(naechsteQuellenNr("[Q1] A – x\n[Q7] M – y\nFolgezeile")).toBe(8);
    const z = "[Q2] M – Herausgeber (Datum): Titel";
    expect(z.slice(...erstePlatzhalterstelle(z)!)).toBe("Herausgeber");
    const a = "[Q1] B – Stelle, Funktion (Datum, Uhrzeit): Auskunft";
    expect(a.slice(...erstePlatzhalterstelle(a)!)).toBe("Stelle, Funktion");
    expect(erstePlatzhalterstelle("[Q1] A – THW (14.10.2026): Lagemeldung")).toBeNull();
  });

  it("ohne Kategorien im Profil: Zeile ohne Kategorie", async () => {
    const ui = (await profil("lead-beispiel")).profil!.ui;
    const ohne = { ...ui, quellen: { vorlage: "[Q{n}] Quelle [Zugriff: {heute}]" } };
    expect(quellenZeile({ nr: 1, kategorie: "A", art: "url", heute: HEUTE }, ohne as never)).toBe(
      "[Q1] Herausgeber (Datum): Titel. Online abrufbar unter: URL [Zugriff: 20.10.2026]",
    );
  });

  it("Meldung aus dem Lagebild", () => {
    expect(lagemeldungRumpf("Hessen · Lagezentrum", "14.10.2026, 10:15 Uhr", false, "x.json")).toBe(
      "Hessen, Lagezentrum (14.10.2026, 10:15 Uhr): Lagemeldung (behördenintern), Datei „x.json“ [Zugriff: {heute}]",
    );
    expect(lagemeldungRumpf("THW", "", true, "y.json")).toBe("THW (Datum): Lagemeldung (Entwurf) (behördenintern), Datei „y.json“ [Zugriff: {heute}]");
  });
});

describe("F01: Quellenverweise terminieren für jede Eingabe", () => {
  it("liest Einzelverweise und Bereiche in beide Richtungen", () => {
    expect([...verweise("[Q2]")]).toEqual([2]);
    expect([...verweise("[Q1–Q3]")]).toEqual([1, 2, 3]);
    expect([...verweise("[Q3–Q1]")]).toEqual([1, 2, 3]);
    expect([...verweise("[Q1, Q4-Q5; Q7]")]).toEqual([1, 4, 5, 7]);
  });

  it("begrenzt Bereiche vorwärts und rückwärts auf 50 Nummern", () => {
    expect(verweise("[Q1–Q1000]").size).toBe(50);
    expect(verweise("[Q100000000–Q1]").size).toBe(50);
  });

  it("bleibt bei Nummern ab 2^53 nicht hängen und meldet sie als Verweis", () => {
    const start = Date.now();
    const r = verweise("[Q9007199254740992] [Q99999999999999999999–Q1] [Q0]");
    expect(Date.now() - start).toBeLessThan(500);
    expect(r.has(9007199254740992)).toBe(true);
    expect(r.has(0)).toBe(true);
  });
});
