// @vitest-environment jsdom
// KI-Symbol rechts oben in der Kopfleiste (seit 0.5.20): Ruhe, laufende KI-Anfrage mit Stufe, Warten auf die Person
// außerhalb der KI-Erfassung; zugänglicher Name statt sichtbarem Text, Ansagen nur bei Wechseln.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { aushaengen, einhaengen, klick, reactUmgebung } from "../support/dom";
import { kiAnsage, KiSymbol, kiSymbolText, type KiSymbolProps } from "../../src/ui/KiSymbol";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const zeige = (p: Partial<KiSymbolProps>) => einhaengen(React.createElement(KiSymbol, { ansicht: "meldung", zurKi: () => {}, ...p }));
const symbol = () => document.querySelector<HTMLButtonElement>(".kopf-ki")!;

describe("KI-Symbol der Kopfleiste", () => {
  it("ruht ohne KI-Anfrage und nennt das im Namen", async () => {
    await zeige({ lauf: null });
    expect(symbol().dataset.zustand).toBe("ruhe");
    expect(symbol().getAttribute("aria-label")).toBe("KI-Erfassung: keine KI-Anfrage aktiv");
    expect(symbol().querySelector(".kopf-ki-punkt")).toBeNull();
  });

  it("zeigt eine laufende Anfrage in jeder Ansicht mit Stufe im Namen und führt zur KI-Erfassung", async () => {
    const zurKi = vi.fn();
    await zeige({ ansicht: "lagebild", zurKi, lauf: { zustand: "laeuft", stufe: "s2", verdichtung: true } });
    expect(symbol().dataset.zustand).toBe("laeuft");
    expect(symbol().getAttribute("aria-label")).toBe("KI-Anfrage läuft: S2 Verdichtung und Entwurf. Zur KI-Erfassung");
    await klick(symbol());
    expect(zurKi).toHaveBeenCalledOnce();
    await aushaengen();
    await zeige({ ansicht: "ki", lauf: { zustand: "laeuft", stufe: "s1" } });
    expect(symbol().dataset.zustand).toBe("laeuft");
  });

  it("trägt außerhalb der KI-Erfassung einen Punkt, wenn die KI auf die Person wartet", async () => {
    await zeige({ lauf: { zustand: "bestaetigen" } });
    expect(symbol().dataset.zustand).toBe("wartet");
    expect(symbol().querySelector(".kopf-ki-punkt")).not.toBeNull();
    expect(symbol().getAttribute("aria-label")).toBe("KI wartet: Gegenstand aus S1 bestätigen. Zur KI-Erfassung");
    await aushaengen();
    await zeige({ lauf: { zustand: "abgebrochen" } });
    expect(symbol().classList.contains("problem")).toBe(true);
    await aushaengen();
    await zeige({ ansicht: "ki", lauf: { zustand: "fertig" } });
    expect(symbol().dataset.zustand).toBe("ruhe");
    expect(symbol().querySelector(".kopf-ki-punkt")).toBeNull();
  });

  it("sagt Stufenwechsel und Ende an", () => {
    expect(kiAnsage({ zustand: "laeuft", stufe: "s3" })).toBe("KI-Anfrage: S3 Prüfung.");
    expect(kiAnsage({ zustand: "fertig" })).toBe("KI-Anfrage abgeschlossen, Entwurf bereit.");
    expect(kiAnsage(null)).toBe("");
    expect(kiSymbolText({ zustand: "fehler" }, "profile")).toBe("KI-Anfrage mit Fehler beendet. Zur KI-Erfassung");
  });
});
