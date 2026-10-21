// Schätzung von Dauer und Kosten je Stufe nach Modell und Aufwand.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AUFWAND_STUFEN, STANDARD } from "../../src/pipeline/einstellungen";
import { ausgabePreis } from "../../src/anbieter/preise";
import { dauerText, kostenText, MESSWERTE, schaetzeStufe, summe } from "../../src/pipeline/schaetzung";
import { LaufSchaetzung } from "../../src/ui/LaufSchaetzung";

describe("Schätzung von Dauer und Kosten", () => {
  it("nutzt Messwerte für gemessene Kombinationen", () => {
    const s = schaetzeStufe("erfassung", "claude-opus-5-5", "medium");
    expect(s).toEqual({ sekunden: [200, 360], usd: [1.4, 2.3], gemessen: true });
    expect(dauerText(s.sekunden)).toBe("3–6 Minuten");
    expect(kostenText(s.usd)).toBe("1,40–2,30 USD");
    // S1 Haiku high: Verdichtungen „Ilka“ 88–95 s und höchstens 0,020 USD (0.4.27)
    expect(schaetzeStufe("s1", "claude-haiku-5-5", "high")).toEqual({ sekunden: [15, 150], usd: [0, 0.03], gemessen: true });
    expect(dauerText(schaetzeStufe("s1", "claude-haiku-5-5", "high").sekunden)).toBe("bis 3 Minuten");
    expect(kostenText(schaetzeStufe("s1", "claude-haiku-5-5", "high").usd)).toBe("bis 0,03 USD");
    // Verdichtung mit Opus medium: bis 1,63 USD gemessen (0.4.27)
    expect(schaetzeStufe("verdichtung", "claude-opus-5-5", "medium")).toEqual({ sekunden: [300, 540], usd: [1.2, 2.0], gemessen: true });
    expect(kostenText(schaetzeStufe("verdichtung", "claude-opus-5-5", "medium").usd)).toBe("1,20–2,00 USD");
    expect(dauerText(schaetzeStufe("s1", "claude-haiku-5-5", "medium").sekunden)).toBe("unter 1 Minute");
    expect(dauerText(schaetzeStufe("erfassung", "claude-sonnet-5-5", "medium").sekunden)).toBe("bis 3 Minuten");
  });

  it("rechnet nicht gemessene Modelle über den Preis hoch, ohne Dauer", () => {
    const f = schaetzeStufe("erfassung", "claude-fable-5-1", "medium");
    expect(f.gemessen).toBe(false);
    expect(f.sekunden).toBeNull();
    // Fable kostet je Ausgabetoken das 2,5-Fache von Opus
    expect(f.usd![0]).toBeCloseTo(1.4 * 2.5);
    expect(f.usd![1]).toBeCloseTo(2.3 * 2.5);
    // nicht gemessener Aufwand: Basis „medium“, Obergrenze verdoppelt
    const hoch = schaetzeStufe("erfassung", "claude-opus-5-5", "high");
    expect(hoch.usd).toEqual([1.4, 4.6]);
    expect(schaetzeStufe("erfassung", "unbekannt-1", "medium")).toEqual({ sekunden: null, usd: null, gemessen: false });
    expect(dauerText(null)).toBe("Dauer ohne Messwert");
    expect(
      summe([
        [0, 0.02],
        [1.4, 2.3],
      ]),
    ).toEqual([1.4, 2.32]);
    expect(summe([[0, 0.02], null])).toBeNull();
  });

  it("enthält nur Modelle mit Preisangabe und plausible Spannen", () => {
    const arten = ["s1", "erfassung", "verdichtung"];
    const aufwand = AUFWAND_STUFEN.map((a) => a.id as string);
    expect(Object.keys(MESSWERTE).length).toBeGreaterThan(0);
    for (const [k, m] of Object.entries(MESSWERTE)) {
      const teile = k.split("|");
      expect(teile, k).toHaveLength(3);
      const [art, modell, stufe] = teile;
      expect(arten, `${k}: Art`).toContain(art);
      expect(aufwand, `${k}: Aufwand`).toContain(stufe);
      // Preis vorhanden: Grundlage der Hochrechnung für nicht gemessene Modelle
      const preis = ausgabePreis(modell);
      expect(preis, `${k}: Ausgabepreis`).not.toBeNull();
      expect(Number.isFinite(preis) && preis! > 0, `${k}: Ausgabepreis ${preis}`).toBe(true);
      for (const [name, [von, bis]] of [
        ["sekunden", m.sekunden],
        ["usd", m.usd],
      ] as const) {
        expect(Number.isFinite(von) && Number.isFinite(bis), `${k}: ${name} endlich`).toBe(true);
        expect(von, `${k}: ${name} nicht negativ`).toBeGreaterThanOrEqual(0);
        expect(von, `${k}: ${name} geordnet`).toBeLessThan(bis);
      }
      expect(m.sekunden[0], `${k}: Dauer über 0`).toBeGreaterThan(0);
    }
  });

  it("zeigt die Schätzung je Stufe nach Modell und Aufwand an", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const html = renderToStaticMarkup(
      createElement(LaufSchaetzung, {
        stufen: [
          { kurz: "S1", rolle: "vorverarbeitung", art: "s1" },
          { kurz: "S2", rolle: "erfassung", art: "erfassung" },
        ],
        einstellungen: STANDARD,
        profil: p!,
      }),
    );
    expect(html).toContain("S1 (claude-haiku-5-5, high): bis 3 Minuten, bis 0,03 USD");
    expect(html).toContain("S2 (claude-opus-5-5, medium): 3–6 Minuten, 1,40–2,30 USD");
    expect(html).toContain("Zusammen etwa 1,40–2,33 USD");
  });
});
