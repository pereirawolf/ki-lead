// Schätzung von Dauer und Kosten je Stufe nach Modell und Aufwand.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { STANDARD } from "../../src/pipeline/einstellungen";
import { dauerText, kostenText, MESSWERTE, schaetzeStufe, summe } from "../../src/pipeline/schaetzung";
import { LaufSchaetzung } from "../../src/ui/LaufSchaetzung";

describe("Schätzung von Dauer und Kosten", () => {
  it("nutzt Messwerte für gemessene Kombinationen", () => {
    const s = schaetzeStufe("erfassung", "claude-opus-5-5", "medium");
    expect(s).toEqual({ sekunden: [200, 360], usd: [1.4, 2.3], gemessen: true });
    expect(dauerText(s.sekunden)).toBe("3–6 Minuten");
    expect(kostenText(s.usd)).toBe("1,40–2,30 USD");
    expect(dauerText(schaetzeStufe("s1", "claude-haiku-5-5", "high").sekunden)).toBe("unter 1 Minute");
    expect(kostenText(schaetzeStufe("s1", "claude-haiku-5-5", "high").usd)).toBe("bis 0,02 USD");
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
    for (const [k, m] of Object.entries(MESSWERTE)) {
      expect(k.split("|")).toHaveLength(3);
      expect(m.sekunden[0]).toBeLessThan(m.sekunden[1]);
      expect(m.usd[0]).toBeLessThan(m.usd[1]);
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
    expect(html).toContain("S1 (claude-haiku-5-5, high): unter 1 Minute, bis 0,02 USD");
    expect(html).toContain("S2 (claude-opus-5-5, medium): 3–6 Minuten, 1,40–2,30 USD");
    expect(html).toContain("Zusammen etwa 1,40–2,32 USD");
  });
});
