// @vitest-environment jsdom
// Statusbereich rechts oben in der Kopfleiste (seit 0.5.20): Meldungsstatus (Entwurf, KI-Entwurf, final) und
// KI-Lauf mit Stufe, Laufzeit, Zeichen und Kosten; Ende des Laufs außerhalb der KI-Erfassung, Ansagen nur bei Wechseln.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { aushaengen, einhaengen, klick, reactUmgebung } from "../support/dom";
import { KopfStatus, laufAnsage, laufzeitText, type KopfStatusProps } from "../../src/ui/KopfStatus";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const basis = (p: Partial<KopfStatusProps> = {}): KopfStatusProps => ({ ansicht: "meldung", zurMeldung: () => {}, zurKi: () => {}, ...p });
const status = () => document.querySelector(".kopf-status")!;

describe("Kopfleiste: Meldungsstatus", () => {
  it("kennzeichnet Entwurf, KI-Entwurf und finale Meldung unterscheidbar nicht nur über die Farbe", async () => {
    await einhaengen(React.createElement(KopfStatus, basis({ meldung: { status: "Entwurf", final: false, ki: false } })));
    expect(status().querySelector(".kopf-marke.entwurf")?.textContent).toBe("Entwurf");
    await aushaengen();
    await einhaengen(React.createElement(KopfStatus, basis({ meldung: { status: "Entwurf", final: false, ki: true } })));
    expect(status().querySelector(".kopf-marke")?.textContent).toBe("KI-Entwurf");
    expect(status().querySelector(".kopf-marke")?.getAttribute("title")).toContain("nicht freigegeben");
    await aushaengen();
    await einhaengen(React.createElement(KopfStatus, basis({ meldung: { status: "final", final: true, ki: true } })));
    expect(status().querySelector(".kopf-marke.final")?.textContent).toBe("KI · final");
  });

  it("führt per Klick zur Meldung", async () => {
    const zurMeldung = vi.fn();
    await einhaengen(React.createElement(KopfStatus, basis({ meldung: { status: "Entwurf", final: false, ki: false }, zurMeldung })));
    await klick(status().querySelector<HTMLElement>(".kopf-marke")!);
    expect(zurMeldung).toHaveBeenCalledOnce();
  });

  it("zeigt ohne Meldung keine Marke", async () => {
    await einhaengen(React.createElement(KopfStatus, basis()));
    expect(status().querySelector(".kopf-marke")).toBeNull();
  });
});

describe("Kopfleiste: KI-Lauf", () => {
  it("zeigt Stufe, Laufzeit, Zeichen, Kosten und letztes Ereignis und zählt die Zeit weiter", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    let t = 1_000_000 + 65_000;
    try {
      await einhaengen(
        React.createElement(
          KopfStatus,
          basis({
            ansicht: "lagebild",
            jetzt: () => t,
            lauf: { zustand: "laeuft", stufe: "s2", start: 1_000_000, zeichen: 1200, kosten: "0,04 $", ereignis: "Websuche: „Orkan Hessen“" },
          }),
        ),
      );
      const lauf = status().querySelector(".kopf-lauf.laeuft")!;
      expect(lauf.querySelector(".kopf-stufe.erledigt")?.textContent).toBe("S1");
      expect(lauf.querySelector(".kopf-stufe.aktuell")?.textContent).toBe("S2");
      expect(lauf.querySelector(".kopf-lauf-zeit")?.textContent).toBe("1:05 min");
      expect(lauf.textContent).toContain("1.200 Z.");
      expect(lauf.textContent).toContain("0,04 $");
      expect(lauf.querySelector(".kopf-lauf-ereignis")?.textContent).toBe("Websuche: „Orkan Hessen“");
      t += 2000;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(lauf.querySelector(".kopf-lauf-zeit")?.textContent).toBe("1:07 min");
    } finally {
      vi.useRealTimers();
    }
  });

  it("bleibt in der KI-Erfassung sichtbar, solange der Lauf läuft, und führt zur KI-Erfassung", async () => {
    const zurKi = vi.fn();
    await einhaengen(React.createElement(KopfStatus, basis({ ansicht: "ki", zurKi, lauf: { zustand: "laeuft", stufe: "s1", start: Date.now(), zeichen: 0 } })));
    await klick(status().querySelector<HTMLElement>(".kopf-lauf")!);
    expect(zurKi).toHaveBeenCalledOnce();
  });

  it("meldet das Laufende nur außerhalb der KI-Erfassung", async () => {
    await einhaengen(React.createElement(KopfStatus, basis({ ansicht: "meldung", lauf: { zustand: "fertig", kosten: "0,12 $" } })));
    expect(status().querySelector(".kopf-lauf.fertig")?.textContent).toBe("✓KI-Entwurf bereit · 0,12 $");
    await aushaengen();
    await einhaengen(React.createElement(KopfStatus, basis({ ansicht: "ki", lauf: { zustand: "fertig", kosten: "0,12 $" } })));
    expect(status().querySelector(".kopf-lauf")).toBeNull();
  });

  it("sagt Stufenwechsel und Ende an, aber nicht den Sekundentakt", () => {
    expect(laufAnsage({ zustand: "laeuft", stufe: "s2", start: 0, zeichen: 500, verdichtung: true })).toBe("KI-Lauf: Stufe S2, Verdichtung und Entwurf.");
    expect(laufAnsage({ zustand: "laeuft", stufe: "s3", start: 0, zeichen: 9000 })).toBe("KI-Lauf: Stufe S3, Prüfung.");
    expect(laufAnsage({ zustand: "abgebrochen" })).toBe("KI-Lauf abgebrochen.");
    expect(laufAnsage(null)).toBe("");
    expect(laufzeitText(59_900)).toBe("59 s");
    expect(laufzeitText(600_000)).toBe("10:00 min");
  });
});
