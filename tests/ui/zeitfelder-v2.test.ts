// @vitest-environment jsdom
// Zeitfelder nach LEAD-Meldung-v2 als Wanduhrzeit (seit 0.9.5): Eingabe in getrennten nativen Feldern, Speichern mit
// UTC-Versatz der Meldungszone, Kontrollzeile, Umrechnung fremder Versätze ohne Änderung beim Öffnen, Zeitzonen-Auswahl.
import { readFileSync } from "node:fs";
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { pruefeRoh } from "../../src/kern/validierung";
import { mitWert, type Segment } from "../../src/kern/pfad";
import { Feld } from "../../src/ui/Feld";
import { MeldungZoneKontext } from "../../src/ui/meldungZone";
import { aushaengen, einhaengen, reactUmgebung } from "../support/dom";
import { repoPfad } from "../support/dateien";
import { v2Profil } from "../support/v2profil";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const BEISPIEL = () => {
  const m = JSON.parse(readFileSync(repoPfad("formate/lead-meldung-v2/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json"), "utf-8"));
  return { ...m, sachverhalte: [m.sachverhalte[1]] };
};

async function maske(wert: any, zone?: string) {
  const p = await v2Profil("land", { mitDarstellung: true });
  const aufrufe: [Segment[], unknown][] = [];
  let stand = wert;
  const setze = (segs: Segment[], v: unknown) => {
    aufrufe.push([segs, v]);
    stand = mitWert(stand, segs, v);
  };
  const feld = React.createElement(Feld, { profil: p, knoten: p.schema, segs: [], wert, setze });
  await einhaengen(React.createElement(MeldungZoneKontext.Provider, { value: zone }, feld));
  return { p, aufrufe, stand: () => stand };
}
const im = (feld: string, sel: string) => document.querySelector<HTMLInputElement & HTMLSelectElement>(`[data-feld="${feld}"] ${sel}`)!;
function setzeWert(el: HTMLInputElement | HTMLSelectElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!;
  setter.call(el, text);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

describe("Zeitfelder nach LEAD-Meldung-v2 als Wanduhrzeit", () => {
  it("Meldezeitpunkt: Tag und Uhrzeit getrennt, Kontrollzeile, Speichern mit Versatz der Jahreszeit", async () => {
    const { aufrufe, stand, p } = await maske(BEISPIEL());
    expect(aufrufe).toEqual([]);
    expect(document.querySelector('[data-feld="meldezeitpunkt"] .datumzeit-kontrolle')!.textContent).toBe("Mi, 14.10.2026, 10:30 Uhr (MESZ)");
    setzeWert(im("meldezeitpunkt", 'input[type="time"]'), "11:45");
    expect(aufrufe.at(-1)).toEqual([["meldezeitpunkt"], "2026-10-14T11:45+02:00"]);
    setzeWert(im("meldezeitpunkt", 'input[type="date"]'), "2026-11-16");
    expect(aufrufe.at(-1)).toEqual([["meldezeitpunkt"], "2026-11-16T10:30+01:00"]);
    expect(pruefeRoh(p.schema, stand())).toEqual([]);
  });

  it("Zeitangabe: bloßer Kalendertag bleibt Kalendertag, „Leeren“ ergibt null", async () => {
    const m = BEISPIEL();
    const { aufrufe } = await maske({ ...m, meldezeitraum: { von: "2026-10-13", bis: m.meldezeitraum.bis } });
    expect(im("meldezeitraum/von", 'input[type="date"]').value).toBe("2026-10-13");
    expect(im("meldezeitraum/von", 'input[type="time"]').value).toBe("");
    expect(document.querySelector('[data-feld="meldezeitraum/von"] .datumzeit-kontrolle')!.textContent).toBe("Di, 13.10.2026");
    setzeWert(im("meldezeitraum/von", 'input[type="date"]'), "2026-10-12");
    expect(aufrufe.at(-1)).toEqual([["meldezeitraum", "von"], "2026-10-12"]);
    const leeren = [...document.querySelectorAll<HTMLButtonElement>('[data-feld="meldezeitraum/von"] button')].find((b) => b.textContent === "Leeren")!;
    leeren.click();
    expect(aufrufe.at(-1)).toEqual([["meldezeitraum", "von"], null]);
  });

  it("fremder Versatz: Anzeige in Ortszeit mit Hinweis, beim Öffnen keine Änderung", async () => {
    const { aufrufe } = await maske({ ...BEISPIEL(), meldezeitpunkt: "2026-10-14T08:30Z" });
    expect(aufrufe).toEqual([]);
    expect(im("meldezeitpunkt", 'input[type="time"]').value).toBe("10:30");
    expect(document.querySelector('[data-feld="meldezeitpunkt"] .datumzeit-kontrolle')!.textContent).toBe(
      "Mi, 14.10.2026, 10:30 Uhr (MESZ) · umgerechnet aus 14.10.2026, 08:30 Uhr UTC",
    );
  });

  it("Zone der Meldung gilt vor der Zone des Profils", async () => {
    await maske(BEISPIEL(), "UTC");
    expect(im("meldezeitpunkt", 'input[type="time"]').value).toBe("08:30");
  });

  it("Zeitzone als Auswahl mit lesbaren Namen", async () => {
    const { aufrufe } = await maske(BEISPIEL());
    const auswahl = im("zeitzone", "select");
    expect(auswahl.value).toBe("Europe/Berlin");
    expect(auswahl.selectedOptions[0]!.textContent).toBe("Deutschland – MEZ/MESZ (Europe/Berlin)");
    setzeWert(auswahl, "Europe/Vienna");
    expect(aufrufe.at(-1)).toEqual([["zeitzone"], "Europe/Vienna"]);
  });
});
