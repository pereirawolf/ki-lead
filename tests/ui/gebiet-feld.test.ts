// @vitest-environment jsdom
// Gebietssuche in der Maske (seit 0.9.8, Entscheidungen des Herausgebers vom 21.11.2026): Name tippen, Vorschlag wählen,
// Schlüssel wird gesetzt; vorgegebene Namen (meldende Gebiete) als Auswahl mit Schlüssel; Textfelder, die ein Gebiet nur
// nennen, erhalten den Namen; „DE-TH“ wird beim Verlassen zu „16“. Soll: GV-ISys 30.09.2026 (Landkreis Sonneberg 16072).
import { readFileSync } from "node:fs";
import React from "react";
import { act } from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { mitWert, type Segment } from "../../src/kern/pfad";
import { Feld } from "../../src/ui/Feld";
import { aushaengen, bisWahr, einhaengen, eingeben, reactUmgebung, setzen } from "../support/dom";
import { repoPfad } from "../support/dateien";
import { v2Profil } from "../support/v2profil";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const BEISPIEL = () => {
  const m = JSON.parse(readFileSync(repoPfad("formate/lead-meldung-v2/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json"), "utf-8"));
  return { ...m, sachverhalte: [{ ...m.sachverhalte[1], raum: { beschreibung: "", gebiete: [{ name: "" }] } }] };
};

async function maske(wert: any) {
  const p = await v2Profil("land", { mitDarstellung: true });
  const aufrufe: [Segment[], unknown][] = [];
  let stand = wert;
  // Mit Zustand, damit die Maske nach jeder Eingabe neu zeichnet wie in der App
  function Huelle() {
    const [w, setW] = React.useState(wert);
    const setze = (segs: Segment[], v: unknown) => {
      aufrufe.push([segs, v]);
      stand = mitWert(stand, segs, v);
      setW(stand);
    };
    return React.createElement(Feld, { profil: p, knoten: p.schema, segs: [], wert: w, setze });
  }
  await einhaengen(React.createElement(Huelle));
  return { aufrufe, stand: () => stand };
}

const tasten = async (el: HTMLElement, key: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });

describe("Gebietssuche", () => {
  it("Vorschlag wählen setzt Name und Schlüssel; Liste mit Kontext und Quellenangabe", async () => {
    const { aufrufe } = await maske(BEISPIEL());
    const feld = document.querySelector<HTMLInputElement>('[data-feld="sachverhalte/0/raum/gebiete/0/name"] input[role="combobox"]')!;
    expect(feld).toBeTruthy();
    await eingeben(feld, "Sonneb");
    await bisWahr(() => document.querySelectorAll('[data-feld="sachverhalte/0/raum/gebiete/0/name"] [role="option"]').length >= 2);
    const optionen = [...document.querySelectorAll('[data-feld="sachverhalte/0/raum/gebiete/0/name"] [role="option"]')].map((o) => o.textContent);
    expect(optionen[0]).toBe("Landkreis SonnebergThüringen · 16072");
    expect(document.querySelector(".gebiet-quelle")?.textContent).toMatch(/Gemeindeverzeichnis GV-ISys .*Gebietsstand 30\.09\.2026/);
    expect(feld.getAttribute("aria-expanded")).toBe("true");
    await tasten(feld, "ArrowDown");
    expect(feld.getAttribute("aria-activedescendant")).toMatch(/-0$/);
    await tasten(feld, "Enter");
    expect(aufrufe.at(-1)).toEqual([["sachverhalte", 0, "raum", "gebiete", 0], { name: "Landkreis Sonneberg", schluessel: "16072" }]);
  });

  it("vorgegebene Namen der meldenden Gebiete: Auswahl setzt den Schlüssel mit", async () => {
    const { aufrufe } = await maske(BEISPIEL());
    const auswahl = document.querySelector<HTMLSelectElement>('[data-feld="absender/gebiet/name"] select')!;
    await act(async () => setzen(auswahl, "Landkreis Sonneberg"));
    expect(aufrufe.at(-1)).toEqual([["absender", "gebiet"], { name: "Landkreis Sonneberg", schluessel: "16072" }]);
  });

  it("Schlüssel von Hand: „DE-TH“ wird beim Verlassen zu „16“, leer entfällt; Zuordnung in Worten", async () => {
    const m = BEISPIEL();
    m.absender.gebiet = { name: "Thüringen", schluessel: "DE-TH" };
    const { aufrufe } = await maske(m);
    const s = document.querySelector<HTMLInputElement>('[data-feld="absender/gebiet/schluessel"] input')!;
    expect(document.querySelector('[data-feld="absender/gebiet/schluessel"] .gebiet-zuordnung')?.textContent).toBe(
      "Thüringen (Gemeindeverzeichnis, Stand 30.09.2026)",
    );
    await act(async () => {
      s.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(aufrufe.at(-1)).toEqual([["absender", "gebiet"], { name: "Thüringen", schluessel: "16" }]);
    await eingeben(s, "");
    expect(aufrufe.at(-1)).toEqual([["absender", "gebiet"], { name: "Thüringen" }]);
  });

  it("Referenzraum: Vorschlag setzt nur den Namen", async () => {
    const { aufrufe } = await maske(BEISPIEL());
    const feld = document.querySelector<HTMLInputElement>('[data-feld="sachverhalte/0/bewertung/referenzraum"] input[role="combobox"]')!;
    expect(feld).toBeTruthy();
    await eingeben(feld, "Saale-Holz");
    await bisWahr(() => document.querySelectorAll('[data-feld="sachverhalte/0/bewertung/referenzraum"] [role="option"]').length === 1);
    await tasten(feld, "ArrowDown");
    await tasten(feld, "Enter");
    expect(aufrufe.at(-1)).toEqual([["sachverhalte", 0, "bewertung", "referenzraum"], "Saale-Holzland-Kreis"]);
  });
});
