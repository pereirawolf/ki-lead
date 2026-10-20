// Kostenabdeckung eines Laufs (Review 20.10.2026, F11).
import { describe, expect, it } from "vitest";
import { kostenNachFehler, kostenStand, kostenSumme, laufKostenText } from "../../src/pipeline/lauf";
import { AnbieterFehler } from "../../src/anbieter/typen";

describe("F11: Kostenabdeckung eines Laufs", () => {
  it("eine Stufe ohne Kostenangabe gilt als nicht erfasst, nicht als kostenlos", () => {
    const lauf = {
      stufen: [
        { stufe: "S1", kostenUsd: 0.02 },
        { stufe: "S2", fehler: "Verbindung abgebrochen" },
      ],
    } as any;
    expect(kostenStand(lauf)).toEqual({ bekannt: 0.02, vollstaendig: false });
    expect(kostenSumme(lauf)).toBeNull();
    expect(laufKostenText({ kostenUsd: null, kostenBekanntUsd: 0.02 })).toBe("mindestens 0,02 USD (nicht alle Stufen erfasst)");
    expect(laufKostenText({ kostenUsd: null })).toBe("unbekannt");
    expect(kostenSumme({ stufen: [{ stufe: "S1", kostenUsd: 0 }] } as any)).toBe(0);
  });

  it("nur ein fehlender Schlüssel kostet sicher nichts", () => {
    // Ein HTTP-Fehler kann nach bereits berechneten Runden kommen (Fortsetzung, Neustart)
    expect(kostenNachFehler(new AnbieterFehler("Überlastet", 529))).toBeNull();
    expect(kostenNachFehler(new AnbieterFehler("kein Schlüssel", 0, "schluessel"))).toBe(0);
    expect(kostenNachFehler(new AnbieterFehler("Verbindung abgebrochen", 0, "verbindung"))).toBeNull();
    expect(kostenNachFehler(new DOMException("Abgebrochen", "AbortError"))).toBeNull();
    expect(kostenNachFehler(new Error("x"))).toBeNull();
  });
});
