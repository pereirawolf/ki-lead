// @vitest-environment jsdom
// Komponententests der Oberfläche (React DOM in jsdom) für Zustandsübergänge, die reine Funktionstests nicht
// abdecken: Übergabe Lagebild → KI-Erfassung beim Profilwechsel, Laden des Lagebilds, Speicherfehler beim Start.

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { profil } from "./hilfen";

const db = vi.hoisted(() => ({
  werte: new Map<string, any>(),
  /** Ersetzt das Lesen einzelner Schlüssel (verzögern, ablehnen) */
  lesen: undefined as undefined | ((k: string) => Promise<any> | undefined),
  /** Lässt das Auflisten der Schlüssel scheitern */
  keysFehler: false,
}));

vi.mock("idb-keyval", () => ({
  get: vi.fn(async (k: string) => {
    const sonder = db.lesen?.(k);
    return sonder !== undefined ? sonder : structuredClone(db.werte.get(k));
  }),
  set: vi.fn(async (k: string, v: any) => {
    db.werte.set(k, structuredClone(v));
  }),
  del: vi.fn(async (k: string) => {
    db.werte.delete(k);
  }),
  keys: vi.fn(async () => {
    if (db.keysFehler) throw new Error("IndexedDB gesperrt");
    return [...db.werte.keys()];
  }),
  entries: vi.fn(async () => [...db.werte.entries()]),
}));

// Zwei eingebaute Profile mit gleichem Inhalt, aber anderer Kennung (andere Prüfsumme)
vi.mock("../src/profil/eingebaut", async () => {
  const { leseOrdner } = await import("./hilfen");
  const { join } = await import("node:path");
  const dateien = leseOrdner(join(__dirname, "../profile/lead-beispiel"));
  const m = JSON.parse(dateien["profil.json"]);
  const b = { ...dateien, "profil.json": JSON.stringify({ ...m, id: "profil-b", name: "Profil B" }) };
  return {
    eingebauteProfile: () => [
      { ordner: "a", dateien },
      { ordner: "b", dateien: b },
    ],
  };
});

const pause = (ms = 40) => new Promise((r) => setTimeout(r, ms));

let root: Root | undefined;
beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.confirm = () => true;
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  document.body.innerHTML = "";
  db.werte.clear();
  db.lesen = undefined;
  db.keysFehler = false;
  vi.doUnmock("../src/ui/Profile");
  vi.doUnmock("../src/ui/Lagebild");
  vi.resetModules();
});

async function zeige(el: React.ReactElement) {
  const ziel = document.createElement("div");
  document.body.appendChild(ziel);
  root = createRoot(ziel);
  await act(async () => {
    root!.render(el);
    await pause();
  });
}

async function klick(text: string) {
  const knopf = [...document.querySelectorAll("button")].find((e) => e.textContent?.trim() === text);
  expect(knopf, `Schaltfläche „${text}“`).toBeTruthy();
  await act(async () => {
    knopf!.click();
    await pause();
  });
}

const materialNamen = () => [...document.querySelectorAll("[hidden] .material-name, .material-name")].map((e) => e.textContent);

describe("Übergabe aus dem Lagebild (F02)", () => {
  async function appMitUebergabe() {
    // Profilansicht und Lagebild durch schlanke Attrappen ersetzen: Profilwechsel und Übergabe per Knopf
    vi.doMock("../src/ui/Profile", () => ({
      ProfileAnsicht: ({ aktivieren }: any) =>
        React.createElement(
          "div",
          null,
          React.createElement("button", { onClick: () => aktivieren("a") }, "Profil A aktivieren"),
          React.createElement("button", { onClick: () => aktivieren("b") }, "Profil B aktivieren"),
        ),
    }));
    vi.doMock("../src/ui/Lagebild", () => ({
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
    const { default: App } = await import("../src/App");
    await zeige(React.createElement(StrictMode, null, React.createElement(App)));
  }

  it("übernimmt eine Übergabe unter dem eigenen Profil genau einmal, auch im StrictMode", async () => {
    await appMitUebergabe();
    await klick("Lagebild");
    await klick("Testübergabe");
    await act(async () => pause(80));
    expect(materialNamen()).toEqual(["eingang-a.json"]);
  });

  it("trägt Material aus Profil A nicht in Profil B und beim Zurückwechseln nicht erneut ein", async () => {
    await appMitUebergabe();
    await klick("Lagebild");
    await klick("Testübergabe");
    await act(async () => pause(80));
    expect(materialNamen()).toEqual(["eingang-a.json"]);

    await klick("Profile");
    await klick("Profil B aktivieren");
    await act(async () => pause(80));
    expect(document.querySelector(".chip-name")?.textContent).toBe("Profil B");
    expect(materialNamen()).toEqual([]);

    await klick("Profile");
    await klick("Profil A aktivieren");
    await act(async () => pause(80));
    expect(materialNamen()).toEqual([]);
  });
});

describe("Lagebild: Laden des gespeicherten Stands (F03, F13)", () => {
  it("behält Meldungen, die vor Abschluss des Ladens hinzugefügt wurden, und führt sie mit dem Bestand zusammen", async () => {
    const { LagebildAnsicht } = await import("../src/ui/Lagebild");
    const { profil: p } = await profil("lead-beispiel");
    let freigeben: (v: unknown) => void = () => {};
    const spaet = new Promise((r) => (freigeben = r));
    const vorhanden = { name: "alt.json", text: JSON.stringify({ schema: "fremd", inhalt: 1 }), importiertAm: "2026-10-01T00:00:00Z" };
    db.lesen = (k) => (k.startsWith("lagebild:") ? (spaet as Promise<any>) : undefined);

    await zeige(React.createElement(LagebildAnsicht, { profil: p!, uebergeben: () => {}, oeffnen: () => {} }));
    const beispiel = [...document.querySelectorAll("button")].find((e) => e.textContent?.includes("Beispiel laden:"))!;
    await act(async () => beispiel.click());
    expect(document.body.textContent).toContain("7 Meldungen · 8 Sachverhalte");

    await act(async () => {
      freigeben({ dateien: [vorhanden] });
      await spaet;
      await pause();
    });
    expect(document.body.textContent).toContain("7 Meldungen · 8 Sachverhalte");
    expect(document.body.textContent).toContain("alt.json");
    const gespeichert = db.werte.get("lagebild:" + p!.manifest.id)?.dateien;
    expect(gespeichert).toHaveLength(8);
    expect(gespeichert[0].name).toBe("alt.json");
  });

  it("überschreibt bei einem Lesefehler den gespeicherten Stand nicht und bietet erneutes Laden an", async () => {
    const { LagebildAnsicht } = await import("../src/ui/Lagebild");
    const { profil: p } = await profil("lead-beispiel");
    const schluessel = "lagebild:" + p!.manifest.id;
    const vorhanden = { dateien: [{ name: "alt.json", text: "{}", importiertAm: "2026-10-01T00:00:00Z" }] };
    db.werte.set(schluessel, vorhanden);
    let scheitern = true;
    db.lesen = (k) => (k === schluessel && scheitern ? Promise.reject(new Error("Lesefehler")) : undefined);

    await zeige(React.createElement(LagebildAnsicht, { profil: p!, uebergeben: () => {}, oeffnen: () => {} }));
    expect(document.body.textContent).toContain("Der gespeicherte Stand des Lagebilds konnte nicht gelesen werden (Lesefehler)");
    const beispiel = [...document.querySelectorAll("button")].find((e) => e.textContent?.includes("Beispiel laden:"))!;
    await act(async () => beispiel.click());
    expect(db.werte.get(schluessel)).toEqual(vorhanden);

    scheitern = false;
    await klick("Erneut laden");
    expect(document.body.textContent).not.toContain("konnte nicht gelesen werden");
    expect(db.werte.get(schluessel).dateien).toHaveLength(8);
  });
});

describe("Start bei gestörtem Gerätespeicher (F13)", () => {
  it("zeigt die mitgelieferten Profile und einen Hinweis, wenn importierte Profile nicht lesbar sind", async () => {
    db.keysFehler = true;
    const { default: App } = await import("../src/App");
    await zeige(React.createElement(App));
    await act(async () => pause(80));
    expect(document.body.textContent).toContain("Importierte Profile konnten nicht aus dem Gerätespeicher gelesen werden");
    expect(document.querySelector(".chip-name")?.textContent).toBeTruthy();
  });

  it("meldet einen Lesefehler der Einstellungen sichtbar und arbeitet mit den Vorgaben weiter", async () => {
    db.lesen = (k) => (k === "einstellungen" ? Promise.reject(new Error("gesperrt")) : undefined);
    const { default: App } = await import("../src/App");
    await zeige(React.createElement(App));
    await act(async () => pause(80));
    expect(document.body.textContent).toContain("Die gespeicherten Einstellungen konnten nicht gelesen werden; es gelten die Vorgaben (gesperrt)");
  });
});
