// @vitest-environment jsdom
// App-Zustand: Übergabe Lagebild → KI-Erfassung beim Profilwechsel, auch im StrictMode (Review 20.10.2026, F02),
// und Start bei gestörtem Gerätespeicher (Review 20.10.2026, F13).
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { StrictMode } from "react";
import { aushaengen, bisWahr, einhaengen, klick, reactUmgebung, seitentext, takt } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));
vi.mock("../../src/profil/eingebaut", async () => (await import("../support/eingebaut")).zweiProfile());

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
  vi.doUnmock("../../src/ui/Profile");
  vi.doUnmock("../../src/ui/Lagebild");
  vi.resetModules();
});

const materialNamen = () => [...document.querySelectorAll(".material-name")].map((e) => e.textContent);
const aktivesProfil = () => document.querySelector(".chip-name")?.textContent;

/** Lässt ausstehende Effekte und Speicherzugriffe auslaufen, bevor etwas als „nicht passiert“ gilt */
async function ruhe() {
  for (let i = 0; i < 5; i++) await takt();
}

describe("Übergabe aus dem Lagebild (F02)", () => {
  async function appMitUebergabe() {
    // Profilansicht und Lagebild durch schlanke Attrappen ersetzen: Profilwechsel und Übergabe per Knopf
    vi.doMock("../../src/ui/Profile", () => ({
      ProfileAnsicht: ({ aktivieren }: any) =>
        React.createElement(
          "div",
          null,
          React.createElement("button", { onClick: () => aktivieren("a") }, "Profil A aktivieren"),
          React.createElement("button", { onClick: () => aktivieren("b") }, "Profil B aktivieren"),
        ),
    }));
    vi.doMock("../../src/ui/Lagebild", () => ({
      LagebildAnsicht: ({ uebergeben }: any) =>
        React.createElement(
          "button",
          {
            onClick: () =>
              uebergeben([
                {
                  id: "x",
                  name: "eingang-a.json",
                  text: JSON.stringify({ schema: "LEAD-Meldung-v1", land: "TH", meldende_stelle: "Stelle A", sachverhalte: [{}] }),
                  rolle: "eingang",
                },
              ]),
          },
          "Testübergabe",
        ),
    }));
    const { default: App } = await import("../../src/App");
    await einhaengen(React.createElement(StrictMode, null, React.createElement(App)));
    await bisWahr(() => expect(aktivesProfil()).toBeTruthy());
  }

  it("übernimmt eine Übergabe unter dem eigenen Profil genau einmal, auch im StrictMode", async () => {
    await appMitUebergabe();
    await klick("Lagebild");
    await klick("Testübergabe");
    await bisWahr(() => expect(materialNamen()).toEqual(["eingang-a.json"]));
    await ruhe();
    expect(materialNamen()).toEqual(["eingang-a.json"]);
  });

  it("trägt Material aus Profil A nicht in Profil B und beim Zurückwechseln nicht erneut ein", async () => {
    await appMitUebergabe();
    const profilA = aktivesProfil();
    await klick("Lagebild");
    await klick("Testübergabe");
    await bisWahr(() => expect(materialNamen()).toEqual(["eingang-a.json"]));

    await klick("Profile");
    await klick("Profil B aktivieren");
    await bisWahr(() => expect(aktivesProfil()).toBe("Profil B"));
    await ruhe();
    expect(materialNamen()).toEqual([]);

    await klick("Profile");
    await klick("Profil A aktivieren");
    await bisWahr(() => expect(aktivesProfil()).toBe(profilA));
    await ruhe();
    expect(materialNamen()).toEqual([]);
  });
});

describe("Start bei gestörtem Gerätespeicher (F13)", () => {
  it("zeigt die mitgelieferten Profile und einen Hinweis, wenn importierte Profile nicht lesbar sind", async () => {
    speicher.keysFehler = true;
    const { default: App } = await import("../../src/App");
    await einhaengen(React.createElement(App));
    await bisWahr(() => expect(seitentext()).toContain("Importierte Profile konnten nicht aus dem Gerätespeicher gelesen werden"));
    expect(aktivesProfil()).toBeTruthy();
  });

  it("meldet einen Lesefehler der Einstellungen sichtbar und arbeitet mit den Vorgaben weiter", async () => {
    speicher.lesen = (k) => (k === "einstellungen" ? Promise.reject(new Error("gesperrt")) : undefined);
    const { default: App } = await import("../../src/App");
    await einhaengen(React.createElement(App));
    await bisWahr(() => expect(seitentext()).toContain("Die gespeicherten Einstellungen konnten nicht gelesen werden; es gelten die Vorgaben (gesperrt)"));
    await bisWahr(() => expect(aktivesProfil()).toBeTruthy());
  });
});
