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

// Herkunftsrolle der meldenden Stelle (seit 0.6.13, Issue #114, A1): Kennzeichen je Meldung und Sachverhalt, Filter
describe("I114-A1: Herkunft im Lagebild", () => {
  async function mitHerkunft(rollen: boolean) {
    const { LagebildAnsicht } = await import("../../src/ui/Lagebild");
    const p = (await profil("lead-beispiel")).profil!;
    if (rollen) {
      p.schema.properties.kritis = { type: "object", properties: { rolle: { type: "string" } } };
      Object.assign(p.ui.rollen, { herkunft: "kritis.rolle", herkunft_standard: "Behörde", herkunft_kategorie: { Betreiber: "B", Behörde: "A" } });
      const ordner = "beispiele/orkantief-ilka/";
      const erste = Object.keys(p.dateien)
        .filter((k) => k.startsWith(ordner) && k.endsWith(".json"))
        .sort()[0]!;
      const d = JSON.parse(p.dateien[erste]!);
      d.meldende_stelle = "Netzbetreiber Muster GmbH";
      d.kritis = { rolle: "Betreiber" };
      p.dateien[`${ordner}zz-betreiber.json`] = JSON.stringify(d);
    }
    await einhaengen(React.createElement(LagebildAnsicht, { profil: p, uebergeben: () => {}, oeffnen: () => {} }));
    await beispielLaden();
  }
  const filter = (name: RegExp) =>
    [...document.querySelectorAll<HTMLLabelElement>(".lb-herkunft label")].find((l) => name.test(l.textContent || ""))!.querySelector("input")!;

  it("zeigt die Herkunft je Meldung und Sachverhalt und filtert nach Herkunft", async () => {
    await mitHerkunft(true);
    expect(seitentext()).toContain("8 Meldungen · 9 Sachverhalte");
    expect(document.querySelector(".lb-herkunft legend")?.textContent).toBe("Herkunft");
    expect(seitentext()).toContain("Behörde (A) (7)");
    expect(seitentext()).toContain("Betreiber (B) (1)");
    expect(seitentext()).toContain("Herkunft (Meldungen)");

    await klick(knopf("Meldungen"));
    expect(document.querySelectorAll(".lb-karte .lb-marke.lb-amt")).not.toHaveLength(0);
    expect(seitentext()).toContain("Herkunft: Betreiber (B)");

    await klick(knopf("Sachverhalte"));
    const zellen = [...document.querySelectorAll(".lb-tabelle tbody tr td:first-child")].map((td) => td.textContent);
    expect(zellen.filter((t) => t?.includes("Herkunft: Betreiber (B)"))).toHaveLength(1);
    expect(zellen.filter((t) => t?.includes("Herkunft: Behörde (A)"))).toHaveLength(8);

    await act(async () => filter(/^\s*Behörde/).click());
    expect(seitentext()).toContain("1 Meldung · 1 Sachverhalt");
    expect(seitentext()).toContain("Auswahl nach Herkunft: 1 von 8 Meldungen");
    expect([...document.querySelectorAll(".lb-tabelle tbody tr")]).toHaveLength(1);
    // Dateiliste zeigt weiterhin alle Dateien
    expect(document.querySelector(".lb-dateiliste summary")?.textContent).toContain("Dateien (8)");

    await act(async () => filter(/^\s*Behörde/).click());
    expect(seitentext()).toContain("8 Meldungen · 9 Sachverhalte");
    expect(seitentext()).not.toContain("Auswahl nach Herkunft");
  });

  it("ohne Rolle kein Filter und keine Herkunftskennzeichen (Regression Ilka)", async () => {
    await mitHerkunft(false);
    expect(seitentext()).toContain("7 Meldungen · 8 Sachverhalte");
    expect(document.querySelector(".lb-herkunft")).toBeNull();
    expect(seitentext()).not.toContain("Herkunft");
    await klick(knopf("Sachverhalte"));
    expect(seitentext()).not.toContain("Herkunft");
  });
});
