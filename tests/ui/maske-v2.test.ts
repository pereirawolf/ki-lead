// @vitest-environment jsdom
// Erfassungsmaske für LEAD-Meldung-v2 (seit 0.7.1, UP-2026-W45-03): Darstellungsdatei formate/lead-meldung-v2/beispiel/
// meldung.ui.json mit dem zusammengestellten Schema; Werte oder null (anyOf mit null), Listen von Objekten, Radarachsen
// als Objekte. Abnahme: Die vervollständigte Beispielmeldung TH 10:30 Uhr lässt sich öffnen, ändern und unverändert
// speichern.
import { readFileSync } from "node:fs";
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { pruefeRoh } from "../../src/kern/validierung";
import { mitWert, type Segment } from "../../src/kern/pfad";
import { Feld } from "../../src/ui/Feld";
import { aushaengen, einhaengen, reactUmgebung } from "../support/dom";
import { repoPfad } from "../support/dateien";
import { v2Profil } from "../support/v2profil";

beforeAll(reactUmgebung);
afterEach(aushaengen);

// Mit einem Sachverhalt: eine geladene Meldung mit mehreren zeigt sie eingeklappt (UX-2026-W44-08)
const BEISPIEL = () => {
  const m = JSON.parse(readFileSync(repoPfad("formate/lead-meldung-v2/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json"), "utf-8"));
  return { ...m, sachverhalte: [m.sachverhalte[1]] };
};

async function maske(wert: any) {
  const p = await v2Profil("land", { mitDarstellung: true });
  const aufrufe: [Segment[], unknown][] = [];
  let stand = wert;
  const setze = (segs: Segment[], v: unknown) => {
    aufrufe.push([segs, v]);
    stand = mitWert(stand, segs, v);
  };
  await einhaengen(React.createElement(Feld, { profil: p, knoten: p.schema, segs: [], wert, setze }));
  return { p, aufrufe, stand: () => stand };
}
const eingabe = (feld: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-feld="${feld}"] input, [data-feld="${feld}"] textarea`);
function tippe(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!;
  setter.call(el, text);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("UP-2026-W45-03: Erfassungsmaske für LEAD-Meldung-v2", () => {
  it("Beispielmeldung TH: öffnen ohne Änderung, keine rohen Objekte, Labels der Darstellungsdatei", async () => {
    const m = BEISPIEL();
    const { aufrufe } = await maske(m);
    expect(aufrufe).toEqual([]);
    const text = document.body.textContent || "";
    expect(text).not.toContain("[object Object]");
    for (const l of [
      "Meldende Stelle",
      "Meldezeitpunkt (t0)",
      "Quellen & Referenzen",
      "Kernaussage",
      "Lagenradar",
      "Bestehende Maßnahmen",
      "Kennzahlen",
      "Zeitstrahl",
    ])
      expect(text, l).toContain(l);
    // Kein Feld zeigt JSON statt einer Eingabe
    for (const el of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")) expect(el.value.startsWith("{")).toBe(false);
    expect(eingabe("meldezeitpunkt")!.value).toBe(m.meldezeitpunkt);
  });

  it("Wert oder null: leere Zeitangabe wird null, nicht leerer Text; danach schemagültig", async () => {
    const m = BEISPIEL();
    const { aufrufe, stand, p } = await maske(m);
    const feld = eingabe("quellen/0/veroeffentlicht")!;
    expect(feld.value).toBe("2026-10-13");
    tippe(feld, "");
    expect(aufrufe.at(-1)).toEqual([["quellen", 0, "veroeffentlicht"], null]);
    expect(pruefeRoh(p.schema, stand())).toEqual([]);
  });

  it("eine Änderung betrifft nur ihr Feld; Reihenfolge und übrige Werte bleiben, die Meldung bleibt schemagültig", async () => {
    const m = BEISPIEL();
    const { stand, p } = await maske(m);
    tippe(eingabe("absender/stelle")!, "Andere Stelle");
    expect(JSON.stringify(stand())).toBe(JSON.stringify({ ...m, absender: { ...m.absender, stelle: "Andere Stelle" } }));
    expect(pruefeRoh(p.schema, stand())).toEqual([]);
  });

  it("Radarachse als Objekt: Stufe aus dem Objekt, Begründung je Achse unter der Grafik", async () => {
    const m = BEISPIEL();
    await maske(m);
    const radar = m.sachverhalte[0].module["lead-bevoelkerungsschutz"].lagenradar;
    const gewaehlt = [...document.querySelectorAll('[role="radio"][aria-checked="true"]')].map((b) => b.id);
    expect(gewaehlt.some((id) => id.endsWith(`-d1-${radar.d1.stufe === null ? "offen" : radar.d1.stufe}`))).toBe(true);
    const details = [...document.querySelectorAll("details.radar-achse-details summary")].map((s) => s.textContent);
    expect(details.length).toBeGreaterThanOrEqual(8);
    expect(details[0]).toMatch(/^D1 .*: Status, Begründung und Belege$/);
  });
});
