// @vitest-environment jsdom
// Lagebild: Laden des gespeicherten Stands (Review 20.10.2026, F03 und F13) und Schreibfehler des Gerätespeichers.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { profil } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, speicherVoll, type SpeicherZustand } from "../support/speicher";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
  vi.resetModules();
});

async function lagebildZeigen() {
  const { LagebildAnsicht } = await import("../../src/ui/Lagebild");
  const { profil: p } = await profil("lead-beispiel");
  await einhaengen(React.createElement(LagebildAnsicht, { profil: p!, uebergeben: () => {}, oeffnen: () => {} }));
  return { p: p!, schluessel: "lagebild:" + p!.manifest.id };
}

const beispielLaden = () => klick(knopf(/Beispiel laden:/));

describe("Lagebild: Laden des gespeicherten Stands (F03, F13)", () => {
  it("behält Meldungen, die vor Abschluss des Ladens hinzugefügt wurden, und führt sie mit dem Bestand zusammen", async () => {
    let freigeben: (v: unknown) => void = () => {};
    const spaet = new Promise((r) => (freigeben = r));
    const vorhanden = { name: "alt.json", text: JSON.stringify({ schema: "fremd", inhalt: 1 }), importiertAm: "2026-10-01T00:00:00Z" };
    speicher.lesen = (k) => (k.startsWith("lagebild:") ? (spaet as Promise<any>) : undefined);

    const { schluessel } = await lagebildZeigen();
    await beispielLaden();
    expect(seitentext()).toContain("7 Meldungen · 8 Sachverhalte");

    await act(async () => {
      freigeben({ dateien: [vorhanden] });
      await spaet;
    });
    await bisWahr(() => expect(speicher.werte.get(schluessel)?.dateien).toHaveLength(8));
    expect(seitentext()).toContain("7 Meldungen · 8 Sachverhalte");
    expect(seitentext()).toContain("alt.json");
    expect(speicher.werte.get(schluessel).dateien[0].name).toBe("alt.json");
  });

  it("überschreibt bei einem Lesefehler den gespeicherten Stand nicht und bietet erneutes Laden an", async () => {
    const { p } = await profil("lead-beispiel").then((e) => ({ p: e.profil! }));
    const schluessel = "lagebild:" + p.manifest.id;
    const vorhanden = { dateien: [{ name: "alt.json", text: "{}", importiertAm: "2026-10-01T00:00:00Z" }] };
    speicher.werte.set(schluessel, vorhanden);
    let scheitern = true;
    speicher.lesen = (k) => (k === schluessel && scheitern ? Promise.reject(new Error("Lesefehler")) : undefined);

    await lagebildZeigen();
    await bisWahr(() => expect(seitentext()).toContain("Der gespeicherte Stand des Lagebilds konnte nicht gelesen werden (Lesefehler)"));
    await beispielLaden();
    expect(speicher.werte.get(schluessel)).toEqual(vorhanden);

    scheitern = false;
    await klick("Erneut laden");
    await bisWahr(() => expect(speicher.werte.get(schluessel).dateien).toHaveLength(8));
    expect(seitentext()).not.toContain("konnte nicht gelesen werden");
  });
});

describe("Lagebild: Schreibfehler des Gerätespeichers", () => {
  it("zeigt einen vollen Speicher als Fehler, behält den gespeicherten Stand und arbeitet im Fenster weiter", async () => {
    const { p } = await profil("lead-beispiel").then((e) => ({ p: e.profil! }));
    const schluessel = "lagebild:" + p.manifest.id;
    const vorhanden = { dateien: [{ name: "alt.json", text: "{}", importiertAm: "2026-10-01T00:00:00Z" }] };
    speicher.werte.set(schluessel, vorhanden);
    speicher.schreiben = (k) => (k === schluessel ? Promise.reject(speicherVoll()) : undefined);

    await lagebildZeigen();
    await bisWahr(() => expect(seitentext()).toContain("alt.json"));
    await beispielLaden();
    await bisWahr(() => expect(seitentext()).toContain("Der Stand des Lagebilds konnte nicht im Gerät gespeichert werden (Der Speicherplatz ist erschöpft.)"));
    const meldung = [...document.querySelectorAll('[role="alert"]')].find((e) => e.textContent?.includes("nicht im Gerät gespeichert"));
    expect(meldung, "Fehler als role=alert").toBeTruthy();
    expect(seitentext()).toContain("7 Meldungen · 8 Sachverhalte");
    expect(speicher.werte.get(schluessel)).toEqual(vorhanden);
  });
});
