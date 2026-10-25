// @vitest-environment jsdom
// Schritte der Meldungsmaske (seit 0.5.17): Die App hängt für jedes Profil einen fünften Schritt „Management Summary“
// an; „Prüfen & Exportieren“ behält Prüfung und Ausgabe, die Management Summary steht nur noch im eigenen Schritt.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profilPflicht } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

import { MeldungAnsicht, KURZFASSUNG_SCHRITT, meldungsSchritte } from "../../src/ui/Meldung";

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(db);
});

const schritte = () => [...document.querySelectorAll("nav.schritte button .schritt-titel")].map((s) => s.textContent);
const schrittTitel = () => document.querySelector("#schritt-titel")?.textContent;
const inhalt = () => document.querySelector("section.schritt-inhalt") as HTMLElement;

async function zeige(profilName: string, meldung: any) {
  const profil = await profilPflicht(profilName);
  await einhaengen(
    React.createElement(MeldungAnsicht, {
      profil,
      meldung,
      setMeldung: () => {},
      neu: () => {},
      ki: { schluessel: { anthropic: "", openai: "", mistral: "" }, einstellungen: STANDARD },
    }),
  );
  return profil;
}

describe("Meldung: Management Summary als eigener Schritt", () => {
  it("Beispielprofil: fünf Schritte, der letzte heißt wie kurzfassung.titel", async () => {
    const profil = await zeige("lead-beispiel", ilkaMeldung("Bund"));
    expect(schritte()).toEqual([...profil.ui.schritte.map((s) => s.titel), "Management Summary"]);
    expect(schritte()).toHaveLength(5);
    expect(meldungsSchritte(profil.ui).at(-1)).toMatchObject({ id: KURZFASSUNG_SCHRITT, felder: [], kurzfassung: true });
  });

  it("Profil ohne Angaben zur Kurzfassung (Vorlage): Schritt mit dem Standardtitel", async () => {
    const profil = await zeige("muster", {});
    expect(profil.ui.kurzfassung).toBeUndefined();
    expect(schritte().at(-1)).toBe("Management Summary");
    expect(schritte()).toHaveLength(profil.ui.schritte.length + 1);
  });

  it("„Prüfen & Exportieren“ ohne Management Summary, mit „Weiter: Management Summary“; dort KI-Fassung und Feldauszug", async () => {
    await zeige("lead-beispiel", ilkaMeldung("Bund"));
    await klick([...document.querySelectorAll("nav.schritte button")].find((b) => /Prüfen & Exportieren/.test(b.textContent || "")) as HTMLButtonElement);
    expect(schrittTitel()).toBe("Prüfen & Exportieren");
    expect(knopf("Final als JSON exportieren")).toBeTruthy();
    expect(inhalt().querySelector(".kurzfassung")).toBeNull();
    expect(inhalt().textContent).not.toContain("Feldauszug ohne KI");

    await klick("Weiter: Management Summary");
    expect(schrittTitel()).toBe("Management Summary");
    const kasten = inhalt().querySelector("section.kurzfassung") as HTMLElement;
    // Überschrift kommt vom Schritt, der Kasten hat keine eigene
    expect(kasten.getAttribute("aria-labelledby")).toBe("schritt-titel");
    expect(kasten.querySelector("h3")).toBeNull();
    expect(inhalt().querySelectorAll("h2")).toHaveLength(1);
    expect(kasten.textContent).toContain("Eine konsolidierte Fassung für die Behördenleitung");
    expect(kasten.textContent).toContain("Feldauszug ohne KI");
    expect(kasten.textContent).toContain("API-Schlüssel für Anthropic hinterlegen");
    expect(knopf("Final als JSON exportieren")).toBeUndefined();
    expect(knopf(/^Weiter:/)).toBeUndefined();
    expect(knopf("Zurück: Prüfen & Exportieren")).toBeTruthy();
    await bisWahr(() => db.werte.size === 0);
  });
});
