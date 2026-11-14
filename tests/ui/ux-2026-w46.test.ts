// @vitest-environment jsdom
// Befunde UX-2026-W46 (Auswertung und Profile, freigegeben am 14.11.2026). Je Test die Kennung des Befunds im Namen;
// das Soll steht im Befund, nicht im Code.

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
  vi.resetModules();
});

async function ilka(name = "lead-beispiel") {
  const { LagebildAnsicht } = await import("../../src/ui/Lagebild");
  const { profil: p } = await profil(name);
  await einhaengen(React.createElement(LagebildAnsicht, { profil: p!, uebergeben: () => {}, oeffnen: () => {} }));
  await klick(knopf(/Beispiel laden:/));
  await bisWahr(() => expect(seitentext()).toContain("7 Meldungen · 8 Sachverhalte"));
  return p!;
}

describe("UX-2026-W46-01: Erinnerung ohne echte Adressen", () => {
  it("kein Link auf eine Platzhalteradresse, je offene Stelle „Text kopieren“", async () => {
    await ilka();
    const links = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].map((a) => a.getAttribute("href") || "");
    expect(links.filter((h) => /beispiel\.invalid/i.test(decodeURIComponent(h)))).toEqual([]);
    const offen = [...document.querySelectorAll(".lb-status-offen")];
    expect(offen).toHaveLength(10);
    for (const li of offen) {
      const b = li.querySelector("button");
      expect(b?.textContent).toBe("Text kopieren");
      expect(b?.getAttribute("aria-label")).toBe(`Text kopieren: Erinnerung an ${li.querySelector(".lb-status-name")?.textContent}`);
    }
  });

  it("kopiert Betreff und Text der Erinnerung für die Stelle", async () => {
    let kopiert = "";
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (t: string) => void (kopiert = t) }, configurable: true });
    await ilka();
    const bayern = [...document.querySelectorAll(".lb-status-offen")].find((li) => li.textContent?.startsWith("○Bayern"))!;
    await klick(bayern.querySelector("button")!);
    await bisWahr(() => expect(kopiert).not.toBe(""));
    expect(kopiert.split("\n")[0]).toMatch(/Bayern/);
    expect(kopiert).toContain("Meldung aus Bayern vor");
    expect(bayern.querySelector("button")?.textContent).toBe("Kopiert");
  });
});

describe("UX-2026-W46-04: Farben der Tendenz", () => {
  it("in der Verteilung mittlere Stufen grau, keine davon in einer Farbe der Beurteilung", async () => {
    await ilka();
    const balken = (titel: string) => {
      const kasten = [...document.querySelectorAll(".lb-balken")].find((b) => b.querySelector("h4")?.textContent === titel)!;
      return [...kasten.querySelectorAll(".lb-balken-zeile")].map((z) => [
        z.querySelector(".lb-balken-label")?.textContent,
        z.innerHTML.match(/lb-(rot|orange|gelb|gruen|grau)\b/)?.[1],
      ]);
    };
    const tendenz = Object.fromEntries(balken("Tendenz"));
    expect(tendenz).toEqual({ Entspannung: "gruen", Stabilisierung: "grau", Verschärfung: "rot" });
    // Variante A: Rot und Grün bleiben für Verschärfung und Entspannung; keine mittlere Stufe in einer Farbe der Beurteilung
    const beurteilung = new Set(balken("Bewertung").map(([, f]) => f));
    expect(beurteilung.has(tendenz.Stabilisierung)).toBe(false);
  });
});
