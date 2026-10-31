// @vitest-environment jsdom
// Erfassungsmaske: verschachtelte Objekte und Listen eines Profilschemas (seit 0.6.14, Issue #114, A2; Ladeprobe des
// Profilpakets lead-kritis aus KRITIS-LEAD M2 vom 31.10.2026). Listen außer der Sachverhaltsliste tragen ihre
// Bezeichnung als Gruppenüberschrift, verschachtelte Objekte ohne „label“ ihren Feldnamen, Elemente ohne „titel_feld“
// einen Titel aus ihrem ersten Text.
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import React from "react";
import { aushaengen, einhaengen, reactUmgebung } from "../support/dom";
import { profil } from "../support/dateien";
import { Feld } from "../../src/ui/Feld";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const MESSWERT = { type: "object", properties: { wert: { type: ["number", "null"] }, einheit: { type: "string" } } };
const SCHEMA = {
  type: "object",
  properties: {
    ist: { type: "object", properties: { anschluesse: MESSWERT, personen: MESSWERT } },
    ersatz: { type: "array", items: { type: "object", properties: { art: { type: "string" }, status: { type: "string" } } } },
    codes: { type: "array", items: { type: "string" } },
  },
};

async function zeige(felder: Record<string, unknown>, wert: unknown) {
  const p = {
    schema: { type: "object", properties: { betrieb: SCHEMA } },
    ui: { felder, rollen: { sachverhalte: "sachverhalte" } },
    manifest: { variablen: {} },
  } as any;
  await einhaengen(React.createElement(Feld, { profil: p, knoten: SCHEMA, segs: ["betrieb"], wert, setze: () => {} }));
}
const legenden = () => [...document.querySelectorAll("legend")].map((l) => l.textContent);
const titel = () => [...document.querySelectorAll(".element-kopf h3")].map((h) => h.textContent);

describe("I114-A2: verschachtelte Objekte und Listen in der Erfassungsmaske", () => {
  it("Listen mit Überschrift, verschachtelte Objekte ohne label mit Feldnamen, Elementtitel aus dem ersten Text", async () => {
    await zeige(
      { betrieb: { label: "Betrieb" }, "betrieb.ersatz": { label: "Ersatzverfahren", element_label: "Verfahren" }, "betrieb.codes": { label: "Schlüssel" } },
      {
        ist: { anschluesse: { wert: 1, einheit: "A" }, personen: { wert: null, einheit: "P" } },
        ersatz: [{ art: "Umschaltung", status: "x" }],
        codes: ["16072"],
      },
    );
    expect(legenden()).toEqual(["Betrieb", "ist", "anschluesse", "personen", "Ersatzverfahren", "Schlüssel"]);
    expect(titel()).toEqual(["Verfahren 1Umschaltung", "Eintrag 116072"]);
  });

  it("leere Liste behält ihre Überschrift; titel_feld geht vor", async () => {
    await zeige(
      { betrieb: { label: "Betrieb" }, "betrieb.ersatz": { label: "Ersatzverfahren", titel_feld: "status" } },
      { ersatz: [{ art: "Umschaltung", status: "" }], codes: [] },
    );
    expect(legenden()).toContain("codes");
    expect(document.body.textContent).toContain("Noch kein Eintrag erfasst.");
    expect(titel()).toEqual(["Eintrag 1ohne Bezeichnung"]);
  });
});

describe("I114-A2: Regression Beispielprofil", () => {
  it("Sachverhaltsliste ohne eigene Gruppe, Listenelemente und oberste Ebene ohne Rahmen wie bisher", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const r = p.ui.rollen;
    const knoten = p.schema.properties[r.sachverhalte];
    await einhaengen(React.createElement(Feld, { profil: p, knoten, segs: [r.sachverhalte], wert: [{}], setze: () => {} }));
    expect(document.querySelector(".gruppe-liste")).toBeNull();
    const ls = legenden();
    expect(ls).not.toContain(r.sachverhalte);
    expect(ls.every((l) => l && !/^[a-z_]+$/.test(l))).toBe(true);
  });
});
