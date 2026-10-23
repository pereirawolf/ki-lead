// @vitest-environment jsdom
// Lagenradar in der Meldungsmaske als Radiogruppe: Rolle „radio“, ein Tabstopp je Achse, Pfeiltasten, Pos1/Ende
// (WAI-ARIA Authoring Practices, Radio Group), seit 0.5.4. Vorher: Schaltflächen mit aria-pressed in einer
// Gruppe „radiogroup“, jede Stufe ein eigener Tabstopp (docs/BARRIEREFREIHEIT.md, 4).
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import React, { act, useState } from "react";
import { aushaengen, einhaengen, reactUmgebung } from "../support/dom";
import { achsenWerte, RadarFeld, zielIndex } from "../../src/ui/Radar";
import type { RadarDef } from "../../src/kern/typen";

const DEF: RadarDef = {
  max: 3,
  achsen: [
    { key: "d1", label: "D1 Raum", stufen: ["punktuell", "kommunal", "regional", "landesweit"] },
    { key: "d2", label: "D2 Dauer", stufen: ["Stunden", "Tage", "Wochen", "Monate"] },
  ],
} as RadarDef;

let zuletzt: Record<string, number | null> | undefined;
function Feld({ start }: { start?: Record<string, number | null> }) {
  const [wert, setWert] = useState(start);
  return React.createElement(RadarFeld, {
    def: DEF,
    wert,
    idPraefix: "t",
    onChange: (n: Record<string, number | null>) => {
      zuletzt = n;
      setWert(n);
    },
  });
}

const gruppe = (label: string) => document.querySelector(`[role="radiogroup"][aria-labelledby="t-${label}-legende"]`)!;
const optionen = (label: string) => [...gruppe(label).querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const gewaehlt = (label: string) => optionen(label).filter((o) => o.getAttribute("aria-checked") === "true");
const tabstopps = () => [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')].filter((o) => o.tabIndex === 0);
async function taste(el: HTMLElement, key: string) {
  await act(async () => void el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })));
}

beforeAll(reactUmgebung);
afterEach(async () => {
  zuletzt = undefined;
  await aushaengen();
});

describe("Hilfsfunktionen", () => {
  it("Reihenfolge der Werte: offen, dann 0 bis max", () => {
    expect(achsenWerte(4)).toEqual([null, 0, 1, 2, 3]);
  });
  it.each([
    ["ArrowRight", 0, 1],
    ["ArrowDown", 4, 0],
    ["ArrowLeft", 0, 4],
    ["ArrowUp", 2, 1],
    ["Home", 3, 0],
    ["End", 1, 4],
  ])("%s von %i führt zu %i (fünf Optionen, mit Umlauf)", (key, von, nach) => {
    expect(zielIndex(key, von, 5)).toBe(nach);
  });
  it("andere Tasten ändern nichts", () => {
    expect(zielIndex("Tab", 1, 5)).toBeNull();
    expect(zielIndex("a", 1, 5)).toBeNull();
  });
});

describe("Radiogruppe je Achse", () => {
  it("hat Optionen mit Rolle radio, sprechenden Namen und genau einer gewählten Option", async () => {
    await einhaengen(React.createElement(Feld, { start: { d1: 2, d2: null } }));
    expect(optionen("d1")).toHaveLength(5);
    expect(optionen("d1").map((o) => o.getAttribute("aria-label"))).toEqual([
      "offen – keine Angabe",
      "Stufe 0: punktuell",
      "Stufe 1: kommunal",
      "Stufe 2: regional",
      "Stufe 3: landesweit",
    ]);
    expect(gewaehlt("d1").map((o) => o.textContent)).toEqual(["2"]);
    expect(gewaehlt("d2").map((o) => o.textContent)).toEqual(["offen"]);
    expect(document.querySelector("[aria-pressed]")).toBeNull();
  });
  it("hat je Achse genau einen Tabstopp, die gewählte Option", async () => {
    await einhaengen(React.createElement(Feld, { start: { d1: 2, d2: null } }));
    expect(tabstopps().map((o) => o.id)).toEqual(["t-d1-2", "t-d2-offen"]);
  });
  it("bleibt bei einem Wert außerhalb der Stufen über „offen“ erreichbar", async () => {
    await einhaengen(React.createElement(Feld, { start: { d1: 9, d2: 1 } }));
    expect(gewaehlt("d1")).toEqual([]);
    expect(tabstopps().map((o) => o.id)).toEqual(["t-d1-offen", "t-d2-1"]);
  });
  it("wählt mit Pfeiltasten um, verschiebt Fokus und Tabstopp und meldet den Wert", async () => {
    await einhaengen(React.createElement(Feld, { start: { d1: 2, d2: null } }));
    const start = document.getElementById("t-d1-2")!;
    start.focus();
    await taste(start, "ArrowRight");
    expect(zuletzt).toEqual({ d1: 3, d2: null });
    expect(document.activeElement?.id).toBe("t-d1-3");
    expect(tabstopps().map((o) => o.id)).toEqual(["t-d1-3", "t-d2-offen"]);
    await taste(document.activeElement as HTMLElement, "ArrowRight");
    expect(zuletzt).toEqual({ d1: null, d2: null });
    expect(document.activeElement?.id).toBe("t-d1-offen");
  });
  it("Pos1 und Ende springen an den Anfang und das Ende; die andere Achse bleibt unberührt", async () => {
    await einhaengen(React.createElement(Feld, { start: { d1: 1, d2: 2 } }));
    const el = document.getElementById("t-d1-1")!;
    await taste(el, "End");
    expect(zuletzt).toEqual({ d1: 3, d2: 2 });
    await taste(document.getElementById("t-d1-3")!, "Home");
    expect(zuletzt).toEqual({ d1: null, d2: 2 });
  });
  it("Klick wählt weiterhin eine Stufe", async () => {
    await einhaengen(React.createElement(Feld, { start: { d1: null, d2: null } }));
    await act(async () => document.getElementById("t-d2-0")!.click());
    expect(zuletzt).toEqual({ d1: null, d2: 0 });
    expect(gewaehlt("d2").map((o) => o.textContent)).toEqual(["0"]);
  });
});
