// @vitest-environment jsdom
// Fehlergrenze an der Wurzel (0.5.2): Ein Fehler beim ersten Zeichnen führt zu einem Hinweis statt einer leeren Seite.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { aushaengen, einhaengen, reactUmgebung, seitentext } from "../support/dom";
import { StartFehlergrenze } from "../../src/ui/StartFehlergrenze";

beforeAll(reactUmgebung);
afterEach(aushaengen);

function Kaputt(): React.ReactElement {
  throw new Error("Gespeicherter Zustand unlesbar");
}

describe("StartFehlergrenze", () => {
  it("zeigt den Fehler, den Datenerhalt und den Weg zur Reparatur; ändert nichts am Speicher", async () => {
    const konsole = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const schreiben = vi.spyOn(Storage.prototype, "setItem");
    await einhaengen(React.createElement(StartFehlergrenze, null, React.createElement(Kaputt)));
    expect(seitentext()).toContain("KI-LEAD konnte nicht gestartet werden");
    expect(seitentext()).toContain("Gespeicherter Zustand unlesbar");
    expect(seitentext()).toContain("bleiben auf diesem Gerät gespeichert");
    expect(document.querySelector('a[href="./reparatur.html"]')?.textContent).toBe("Programmdateien reparieren");
    expect([...document.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Erneut laden"]);
    expect(schreiben).not.toHaveBeenCalled();
    konsole.mockRestore();
    schreiben.mockRestore();
  });

  it("zeigt ohne Fehler die App unverändert", async () => {
    await einhaengen(React.createElement(StartFehlergrenze, null, React.createElement("p", null, "App läuft")));
    expect(seitentext()).toBe("App läuft");
  });
});
