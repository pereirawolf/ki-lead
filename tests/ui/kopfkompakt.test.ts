// @vitest-environment jsdom
// Kompakter Kopfbereich beim Scrollen (seit 0.7.16, Grunddesign 1.6, LD-R04): Hysterese zwischen 96 px (mindestens eine
// volle Bandhöhe über 8 px) und 8 px, Klasse am Kopfbereich, Wortlaut bleibt vollständig. Die echte Darstellung im
// Browser (schmaler, Wortlaut vollständig sichtbar, Leisten unter dem Kopfbereich) prüft tests/browser/hinweisband.spec.ts.
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import React from "react";
import { aushaengen, einhaengen, reactUmgebung, takt } from "../support/dom";
import { AUS, EIN_MIN, kompaktNach, useKopfKompakt } from "../../src/ui/kopfKompakt";

describe("kompaktNach", () => {
  it("kompakt erst über 96 px, wieder voll erst unter 8 px", () => {
    expect(EIN_MIN).toBe(96);
    expect(AUS).toBe(8);
    expect(kompaktNach(96, false, 40)).toBe(false);
    expect(kompaktNach(97, false, 40)).toBe(true);
    // im Zwischenbereich bleibt der bisherige Zustand
    expect(kompaktNach(50, true, 40)).toBe(true);
    expect(kompaktNach(50, false, 40)).toBe(false);
    expect(kompaktNach(8, true, 40)).toBe(false);
    expect(kompaktNach(9, true, 40)).toBe(true);
  });

  it("ein hohes Band (schmal, große Schrift) hebt die Schwelle: Abstand zu AUS immer größer als die Bandhöhe", () => {
    expect(kompaktNach(100, false, 90)).toBe(false);
    expect(kompaktNach(114, false, 90)).toBe(false);
    expect(kompaktNach(115, false, 90)).toBe(true);
    for (const band of [20, 60, 120, 200]) {
      let schwelle = 0;
      while (!kompaktNach(schwelle, false, band)) schwelle++;
      // nach dem Schrumpfen um höchstens die Bandhöhe bleibt die Position über AUS
      expect(schwelle - band, String(band)).toBeGreaterThan(AUS);
    }
  });
});

describe("useKopfKompakt", () => {
  beforeAll(reactUmgebung);
  afterEach(async () => {
    await aushaengen();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  function Kopf() {
    useKopfKompakt();
    return null;
  }

  async function scrollen(y: number) {
    Object.defineProperty(window, "scrollY", { configurable: true, value: y });
    window.dispatchEvent(new Event("scroll"));
    await takt(40);
  }

  it("setzt und entfernt die Klasse „kompakt“ am Kopfbereich; der Wortlaut bleibt", async () => {
    document.body.innerHTML = `<div class="kopfbereich"><header class="kopf"></header><p class="hinweisband" role="note">Forschungsdemonstrator · Text</p></div>`;
    const bereich = document.querySelector(".kopfbereich")!;
    await einhaengen(React.createElement(Kopf));
    expect(bereich.classList.contains("kompakt")).toBe(false);
    await scrollen(400);
    expect(bereich.classList.contains("kompakt")).toBe(true);
    expect(bereich.querySelector(".hinweisband")!.textContent).toBe("Forschungsdemonstrator · Text");
    await scrollen(50);
    expect(bereich.classList.contains("kompakt")).toBe(true);
    await scrollen(0);
    expect(bereich.classList.contains("kompakt")).toBe(false);
  });
});
