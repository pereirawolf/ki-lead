// @vitest-environment jsdom
// Modell je Lauf abweichend von den Einstellungen; Laufprotokoll schon nach S1.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, eingeben, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD, modellFuer } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

/** Schlüssel mit Erkennungsmarke: darf in keinem Export auftauchen */
const SCHLUESSEL = "sk-test-NICHT-EXPORTIEREN-7f3a";

// Anbieter-Attrappe: merkt sich die angefragten Modelle und liefert einen S1-Vorschlag
const anfragen = vi.hoisted(() => ({ modelle: [] as string[], aufwand: [] as (string | undefined)[] }));
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    static fuer() {
      return new Verteiler();
    }
    async senden(a: { modell: string; aufwand?: string }) {
      anfragen.modelle.push(a.modell);
      anfragen.aufwand.push(a.aufwand);
      const text = JSON.stringify({
        gegenstand: "Sturmfolgen in Hessen",
        stichtag: "2026-10-14",
        referenzbezug: "Land Hessen",
        horizont: "bis 21.10.2026",
        sachverhalte: [{ titel: "Sturmfolgen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm" }],
        prueffrage: "",
        hinweise: "",
      });
      const { llmAntwort } = await import("../support/anbieter");
      return llmAntwort(text, { modell: a.modell });
    }
  }
  return { ...echt, Verteiler };
});

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: string }[] }));
vi.mock("../../src/speicher/speicher", async (original) => {
  const echt: any = await original();
  return { ...echt, dateiAnbieten: (inhalt: string, name: string) => downloads.liste.push({ name, inhalt: String(inhalt) }) };
});

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(db);
  anfragen.modelle = [];
  anfragen.aufwand = [];
  downloads.liste = [];
});

/** KI-Erfassung zeigen; fertig, sobald die Modellwahl steht */
async function erfassungZeigen() {
  const p = (await profil("lead-beispiel")).profil!;
  const { KiErfassung } = await import("../../src/ui/KiErfassung");
  await einhaengen(
    React.createElement(KiErfassung, {
      profil: p,
      einstellungen: STANDARD,
      schluessel: { anthropic: SCHLUESSEL, openai: "", mistral: "" },
      zuEinstellungen: () => {},
      uebernehmen: () => {},
    }),
  );
  await bisWahr(() => document.querySelector(".modellwahl fieldset") !== null);
  return p;
}
/** Auftrag eingeben, bestätigen und S1 starten; fertig, sobald der Vorschlag zur Bestätigung steht */
async function s1Starten() {
  await eingeben(document.querySelector("textarea") as HTMLTextAreaElement, "Orkan in Hessen");
  await klick(document.querySelector(".bestaetigung input") as HTMLInputElement);
  await klick(knopf("Gegenstand bestimmen (S1)"));
  await bisWahr(() => expect(seitentext()).toContain("Gegenstand bestätigen"));
  // Die Modellwahl für S2 erscheint wieder, sobald der Lauf auf die Bestätigung wartet
  await bisWahr(() => expect(() => auswahl("S2", "Aufwand")).not.toThrow());
}
const auswahl = (titel: string, feld = "Modell") =>
  [
    ...[...document.querySelectorAll(".modellwahl fieldset")]
      .find((f) => f.querySelector("legend")?.textContent?.startsWith(titel))!
      .querySelectorAll("label.feld"),
  ]
    .find((l) => l.textContent?.startsWith(feld))!
    .querySelector("select, input") as HTMLSelectElement & HTMLInputElement;

describe("KI-Erfassung", () => {
  it("Modell für S1 abweichend wählen, nach S1 Protokoll exportieren, S2-Modell vor dem Start änderbar", async () => {
    const p = await erfassungZeigen();
    // Standard wird angezeigt, OpenAI ohne Schlüssel ist gekennzeichnet
    const s1 = auswahl("S1");
    expect(s1.options[0].textContent).toBe(`Standard: ${modellFuer("vorverarbeitung", STANDARD, p)}`);
    expect([...s1.options].find((o) => o.value === "gpt-6-luna")!.textContent).toContain("(kein Schlüssel für OpenAI)");

    await eingeben(s1, "claude-opus-5-5");
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain("S1: claude-opus-5-5");
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain("abweichend");

    await s1Starten();
    expect(anfragen.modelle).toEqual(["claude-opus-5-5"]);

    // Protokoll schon nach S1
    await bisWahr(() => knopf("Laufprotokoll exportieren (S1)") !== undefined);
    await klick(knopf("Laufprotokoll exportieren (S1)"));
    expect(downloads.liste).toHaveLength(1);
    // Der API-Schlüssel steht nie im Laufprotokoll
    expect(downloads.liste[0].inhalt).not.toContain(SCHLUESSEL);
    expect(downloads.liste[0].name).toMatch(/_KI-LEAD_Lauf_.+\.json$/);
    const protokoll = JSON.parse(downloads.liste[0].inhalt);
    expect(protokoll.stufen[0].modell).toBe("claude-opus-5-5");
    expect(protokoll.status).toBe("bestaetigen");

    // Vor S2 lässt sich das Modell für S2 noch ändern
    const s2 = auswahl("S2");
    expect(s2.value).toBe("");
    await eingeben(s2, "claude-fable-5-1");
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain("S2: claude-fable-5-1");
  });

  it("AV-2026-W43-01, -02: bei Mistral nur Stufen mit und ohne Nachdenken; die gewählte Stufe passt sich beim Modellwechsel an", async () => {
    await erfassungZeigen();
    await eingeben(auswahl("S1", "Aufwand"), "medium");
    await eingeben(auswahl("S1"), "mistral-small-2603");
    const a1 = auswahl("S1", "Aufwand");
    expect([...a1.options].map((o) => [o.value, o.textContent])).toEqual([
      ["", "Standard: hoch"],
      ["low", "niedrig – ohne Nachdenken"],
      ["high", "hoch – mit Nachdenken"],
    ]);
    expect(a1.value).toBe("high");
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain("S1: mistral-small-2603 (hoch)");
  });

  it("Aufwand je Stufe und Höchstzahl der Websuchen für einen Lauf wählen", async () => {
    await erfassungZeigen();
    const a1 = auswahl("S1", "Aufwand");
    expect(a1.options[0].textContent).toBe("Standard: hoch");
    expect([...a1.options].map((o) => o.value)).toEqual(["", "low", "medium", "high", "xhigh", "max"]);
    const ws = auswahl("Recherche", "Höchstzahl");
    expect(ws.placeholder).toBe(`Standard: ${STANDARD.websucheMax}`);
    await eingeben(a1, "low");
    await eingeben(auswahl("S2", "Aufwand"), "high");
    await eingeben(ws, "5");
    const zusammenfassung = document.querySelector(".modellwahl summary")!.textContent!;
    expect(zusammenfassung).toContain("S1: claude-haiku-5-5 (niedrig)");
    expect(zusammenfassung).toContain("S2: claude-opus-5-5 (hoch)");
    expect(zusammenfassung).toContain("bis 5 Websuchen");
    expect(seitentext()).toContain("S2: Recherche erlaubt (Websuche bis zu 5-mal, Seitenabruf bis zu 10-mal).");
    // Schätzung folgt dem gewählten Aufwand (S2 Opus „high“ ohne Messwert)
    expect(document.querySelector(".laufschaetzung")!.textContent).toContain("S2 (claude-opus-5-5, high)");

    await s1Starten();
    expect(anfragen.aufwand).toEqual(["low"]);
    // nach S1 bleibt die Wahl erhalten und gilt für S2
    expect(auswahl("S2", "Aufwand").value).toBe("high");
    expect(auswahl("Recherche", "Höchstzahl").value).toBe("5");
    expect(seitentext()).toContain("S2: Recherche erlaubt (Websuche bis zu 5-mal, Seitenabruf bis zu 10-mal).");
    // leeres Feld = wieder Standard
    await eingeben(auswahl("Recherche", "Höchstzahl"), "");
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain(`bis ${STANDARD.websucheMax} Websuchen`);
  });
});
