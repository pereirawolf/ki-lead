// @vitest-environment jsdom
// KI-Chip rechts oben in der Kopfleiste (seit 0.5.21): „KI offline“ in Ruhe, „KI online“, solange eine KI-Anfrage
// läuft; Stufe im zugänglichen Namen, der mit dem sichtbaren Text beginnt; Ansage bei jedem Wechsel.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { aushaengen, einhaengen, klick, reactUmgebung } from "../support/dom";
import { kiAnsage, KiSymbol, kiSymbolText, type KiSymbolProps } from "../../src/ui/KiSymbol";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const zeige = (p: Partial<KiSymbolProps>) => einhaengen(React.createElement(KiSymbol, { zurKi: () => {}, ...p }));
const chip = () => document.querySelector<HTMLButtonElement>(".kopf-ki")!;

describe("KI-Chip der Kopfleiste", () => {
  it("zeigt in Ruhe „KI offline“", async () => {
    await zeige({ lauf: null });
    expect(chip().dataset.zustand).toBe("offline");
    expect(chip().querySelector(".kopf-ki-text")?.textContent).toBe("KI offline");
    expect(chip().getAttribute("aria-label")).toBe("KI offline: keine KI-Anfrage aktiv. Zur KI-Erfassung");
  });

  it("zeigt „KI online“ mit Stufe im Namen, solange eine Anfrage läuft, und führt zur KI-Erfassung", async () => {
    const zurKi = vi.fn();
    await zeige({ zurKi, lauf: { stufe: "s2", verdichtung: true } });
    expect(chip().dataset.zustand).toBe("online");
    expect(chip().querySelector(".kopf-ki-text")?.textContent).toBe("KI online");
    expect(chip().getAttribute("aria-label")).toBe("KI online: Anfrage läuft, S2 Verdichtung und Entwurf. Zur KI-Erfassung");
    await klick(chip());
    expect(zurKi).toHaveBeenCalledOnce();
  });

  it("sagt Stufenwechsel und das Ende an", () => {
    expect(kiAnsage({ stufe: "s1" })).toBe("KI online: S1 Gegenstand und SOP-Auswahl.");
    expect(kiAnsage({ stufe: "s3" })).toBe("KI online: S3 Prüfung.");
    expect(kiAnsage(null)).toBe("KI offline.");
    expect(kiSymbolText({ stufe: "s2" })).toBe("KI online: Anfrage läuft, S2 Recherche und Entwurf. Zur KI-Erfassung");
  });
});
