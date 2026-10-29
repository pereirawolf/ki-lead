// Auswertung mehrerer Vergleichsläufe (AV-2026-W43-04, seit 0.5.8): Zusammenfassung je Konfiguration, Bezug
// Standard-Profil Anthropic, Radarabstand und Abstand je Kennzahl. Synthetische Reihen, Sollwerte von Hand gerechnet.
import { describe, expect, it } from "vitest";
import { abstand, auswerten, berichtMarkdown, zusammenfassen } from "../../src/forschung/vergleichsauswertung";
import type { Reihe } from "../../src/forschung/vergleichslauf";

const KZ = {
  achsen_gesetzt: 1,
  tendenz_gesetzt: 1,
  beurteilung_gleich: 1,
  tendenz_gleich: 1,
  aehnlichkeit_mittel: 0.5,
  achsen_abweichung_mittel: 0.5,
  achsen_nah: 1,
};

function lauf(id: string, kosten: number, sachverhalte: number, plausibilitaet: number, radar: Record<string, number | null>) {
  return {
    lauf: id,
    attrappe: false,
    anbieter: "anthropic",
    status: "fertig",
    technisch_bestanden: true,
    pruefpunkte: [],
    beobachtungen: { vergleich: { paare: [{ ki: "SV", ref: "Ref", ref_index: 0, aehnlichkeit: 0.5, ki_radar: radar }] } },
    stufen: [],
    kosten_usd: kosten,
    dauer_s: 100,
    kennzahlen: { ...KZ, sachverhalte, plausibilitaet_befunde: plausibilitaet },
    plausibilitaet: [],
    kurzantwort: null,
    meldung: null,
  };
}

function reihe(s1: [string, string], s2: [string, string], laeufe: any[], extra: Partial<Reihe> = {}): Reihe {
  const anbieter = (m: string) => (m.startsWith("mistral") ? "mistral" : "anthropic") as any;
  return {
    format: "ki-lead-abnahme/1",
    plan: "",
    quelle: "app",
    fall: "orkantief-ilka-verdichtung",
    erstellt: "2026-10-24T20:00:00.000Z",
    app: "KI-LEAD 0.5.8",
    profil: { id: "p", version: "1", hash: "h" },
    anbieter: anbieter(s2[0]),
    attrappe: false,
    modelle: {
      s1: { modell: s1[0], aufwand: s1[1], anbieter: anbieter(s1[0]) },
      s2: { modell: s2[0], aufwand: s2[1], anbieter: anbieter(s2[0]) },
      reparatur: { modell: "x", aufwand: "low", anbieter: "anthropic" },
    },
    laeufe_geplant: laeufe.length,
    technisch_bestanden: laeufe.length,
    kosten_usd_summe: 0,
    laeufe,
    ...extra,
  } as Reihe;
}

const A = reihe(
  ["claude-haiku-5-5", "high"],
  ["claude-opus-5-5", "medium"],
  [lauf("a1", 1.9, 2, 0, { d1: 4, d2: 3, d3: 2 }), lauf("a2", 1.8, 2, 0, { d1: 4, d2: null, d3: 2 })],
);
// Mistral in zwei Dateien derselben Konfiguration
const X1 = reihe(["mistral-small-2603", "high"], ["mistral-medium-3-5", "high"], [lauf("x1", 0.2, 3, 2, { d1: 5, d2: null, d3: 4 })], {
  mistral_endpunkt: "eu",
  variante: "standardprofile-ilka/E-mistral-standard",
});
const X2 = reihe(["mistral-small-2603", "high"], ["mistral-medium-3-5", "high"], [lauf("x2", 0.3, 1, 0, { d1: 3, d2: null, d3: 4 })], {
  mistral_endpunkt: "eu",
});

describe("Auswertung der Vergleichsläufe", () => {
  it("fasst je Konfiguration zusammen, auch über mehrere Dateien", () => {
    const z = zusammenfassen([A, X1, X2]);
    expect(z.map((s) => [s.kennung, s.laeufe])).toEqual([
      ["claude-opus-5-5-medium", 2],
      ["E-mistral-standard", 2],
    ]);
    expect(z[0].kosten_usd).toEqual({ mittel: 1.85, min: 1.8, max: 1.9 });
    expect(z[0].radar["0"]).toEqual({ d1: { median: 4, offen: 0, n: 2 }, d2: { median: 3, offen: 0.5, n: 2 }, d3: { median: 2, offen: 0, n: 2 } });
    expect(z[1].radar["0"].d1).toEqual({ median: 4, offen: 0, n: 2 });
    expect(z[1].kennzahlen.sachverhalte).toEqual({ mittel: 2, min: 1, max: 3 });
    expect(z[1].zuordnung).toBe(1);
  });

  it("Abstand zum Bezug: Radar nur über Achsen mit Wert auf beiden Seiten, Anteil „offen“ getrennt", () => {
    const [a, x] = zusammenfassen([A, X1, X2]);
    // d1 |4−4| = 0, d3 |4−2| = 2 → 1; offen: d1 0, d2 |1−0,5| = 0,5, d3 0 → 0,167
    expect(abstand(x, a)).toMatchObject({ kennung: "E-mistral-standard", radar: 1, offen: 0.167 });
    // AV-2026-W43-19: in den Radarabstand gehen d1 und d3 ein (d2 bei X offen), der Bezug hat drei Achsen
    expect(abstand(x, a)).toMatchObject({ achsen_verglichen: 2, achsen_bezug: 3 });
    expect(abstand(x, a).kennzahlen).toMatchObject({ sachverhalte: 0, plausibilitaet_befunde: 1, achsen_gesetzt: 0 });
  });

  it("wählt das Standard-Profil Anthropic als Bezug oder den angegebenen", () => {
    expect(auswerten([X1, A]).bezug).toBe("claude-opus-5-5-medium");
    expect(auswerten([X1, A], "E-mistral-standard").bezug).toBe("E-mistral-standard");
    expect(auswerten([X1]).bezug).toBeNull();
    expect(() => auswerten([X1, A], "gibt-es-nicht")).toThrow(/gibt-es-nicht/);
  });

  it("Bericht nennt Bezug, Konfigurationen und Abstände", () => {
    const md = berichtMarkdown(auswerten([A, X1, X2]));
    expect(md).toContain("| claude-opus-5-5-medium (Bezug) | S1 claude-haiku-5-5 (high) · S2 claude-opus-5-5 (medium) | 2 (2) |");
    expect(md).toContain("## Abstand zum Bezug (claude-opus-5-5-medium)");
    expect(md).toContain("| E-mistral-standard | 1,00 | 2 von 3 | 0,17 |");
    // AV-2026-W43-19: Erklärung und alle Abstände je Kennzahl
    expect(md).toContain("Der Radarabstand zählt nur Achsen, die Bezug und Konfiguration beide gesetzt haben");
    for (const spalte of ["Δ Tendenz gleich", "Δ Achsenabweichung", "Δ Achsen ≤ 1", "Achsen verglichen"]) expect(md, spalte).toContain(spalte);
  });

  // LS-2026-W43-15 und -16 (Lernschleife, 25.10.2026): Hinweis auf S1 und Sachverhalte ohne Gegenstück
  it("LS-2026-W43-16: nennt Sachverhalte ohne Gegenstück in der Redaktionsfassung je Lauf", () => {
    const geteilt = lauf("g1", 1, 2, 0, { d1: 4 });
    geteilt.beobachtungen.vergleich.paare.push({ ki: "Verkehrsfolgen", ref: null as any, ref_index: null as any, aehnlichkeit: 0, ki_radar: { d1: 2 } });
    const G = reihe(["claude-haiku-5-5", "high"], ["claude-sonnet-5-5", "medium"], [geteilt], { variante: "standardprofile-ilka/B-anthropic-sonnet" });
    const z = zusammenfassen([A, G]);
    expect(z[0].ohne_gegenstueck).toEqual([]);
    expect(z[1].ohne_gegenstueck).toEqual([{ lauf: "g1", sachverhalte: ["Verkehrsfolgen"] }]);
    // Der Sachverhalt ohne Gegenstück geht nicht in die Zuordnungsquote und nicht in das Radar ein
    expect(z[1].zuordnung).toBe(1);
    expect(z[1].radar["0"].d1).toEqual({ median: 4, offen: 0, n: 1 });
    const md = berichtMarkdown(auswerten([A, G]));
    expect(md).toContain("## Sachverhalte ohne Gegenstück in der Redaktionsfassung");
    expect(md).toContain("- B-anthropic-sonnet, g1: Verkehrsfolgen");
    expect(berichtMarkdown(auswerten([A]))).not.toContain("ohne Gegenstück");
  });

  it("LS-2026-W43-15: Bericht sagt, ob die Zahl der Sachverhalte S1 misst oder S1 fest vorgegeben war", () => {
    expect(berichtMarkdown(auswerten([A]))).toContain("Die Zahl der Sachverhalte übernimmt S2 aus der bestätigten S1-Gliederung");
    const fest = { datei: "evaluation/material/x.json", sha256: "ab".repeat(32) };
    const F = reihe(["claude-haiku-5-5", "high"], ["claude-opus-5-5", "medium"], [lauf("f1", 1, 2, 0, { d1: 4 })], { s1_fest: fest });
    expect(zusammenfassen([F])[0].s1_fest).toEqual([fest.sha256]);
    const md = berichtMarkdown(auswerten([F]));
    expect(md).toContain("S1-Gegenstand fest vorgegeben (Prüfsumme abababababab…)");
    expect(md).not.toContain("misst S1");
  });
});
