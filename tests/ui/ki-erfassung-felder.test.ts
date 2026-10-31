// @vitest-environment jsdom
// KI-Erfassung: Beschriftungen, Hilfetexte und Platzhalter der Eingabefelder, Hilfetexte programmatisch verknüpft.
// Befunde KP-2026-W43-61 bis -68 (Prüfung der Eingabemaske vom 25.10.2026, Herausgeber-Freigabe vom selben Tag).
// Das Soll steht als fester Text im Test, nicht aus TEXT_FELD übernommen.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, eingeben, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

// Anbieter-Attrappe: liefert einen festen S1-Vorschlag
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    static fuer() {
      return new Verteiler();
    }
    async senden(a: { modell: string }) {
      const text = JSON.stringify({
        gegenstand: "Störungen der Kraftstoffversorgung",
        stichtag: "2026-10-14",
        referenzbezug: "bundesweit",
        horizont: "kommende Wochen",
        sachverhalte: [{ titel: "Kraftstoff", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Test" }],
        prueffrage: "",
        hinweise: "",
      });
      const { llmAntwort } = await import("../support/anbieter");
      return llmAntwort(text, { modell: a.modell });
    }
  }
  return { ...echt, Verteiler };
});

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(db);
});

async function erfassungZeigen() {
  const p = (await profil("lead-beispiel")).profil!;
  const { KiErfassung } = await import("../../src/ui/KiErfassung");
  await einhaengen(
    React.createElement(KiErfassung, {
      profil: p,
      einstellungen: STANDARD,
      schluessel: { anthropic: "sk-test-NICHT-EXPORTIEREN-4c1e", openai: "", mistral: "", stelle: "" },
      zuEinstellungen: () => {},
      uebernehmen: () => {},
    }),
  );
  await bisWahr(() => document.querySelector(".modellwahl fieldset") !== null);
}

/** Eingabe zur sichtbaren Beschriftung (label for=…) */
function feld<T extends HTMLElement = HTMLInputElement>(beschriftung: string): T {
  const label = [...document.querySelectorAll("label")].find((l) => l.textContent?.trim() === beschriftung);
  expect(label, `Beschriftung „${beschriftung}“`).toBeTruthy();
  const el = document.getElementById(label!.htmlFor);
  expect(el, `Eingabe zu „${beschriftung}“`).toBeTruthy();
  return el as T;
}
/** Zugängliche Beschreibung wie aus aria-describedby berechnet */
function beschreibung(el: Element): string {
  return (el.getAttribute("aria-describedby") || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() || `[fehlt: ${id}]`)
    .join(" ");
}

describe("KI-Erfassung: Auftrag und Material", () => {
  it("KP-2026-W43-61: Untersuchungsgegenstand mit Hilfetext und Beispiel nur als Platzhalter", async () => {
    await erfassungZeigen();
    const f = feld<HTMLTextAreaElement>("Untersuchungsgegenstand und Erkenntnisinteresse");
    expect(f.tagName).toBe("TEXTAREA");
    expect(beschreibung(f)).toBe(
      "Welche Lage oder welches Ereignis soll die KI-Recherche erfassen, für welchen Raum und Zeitraum? Bei Bedarf zusätzlich: aus welcher Perspektive. Ohne Angabe recherchiert die KI aus der allgemeinen Sicht des Bevölkerungsschutzes.",
    );
    expect(f.placeholder).toBe(
      "Beispiel: Regionale Störungen der Kraftstoffversorgung seit Wochenbeginn, mit Blick auf Rettungsdienst und Notstromversorgung.",
    );
    expect(f.value).toBe("");
    // Hilfetext gehört nicht zum zugänglichen Namen
    expect(document.querySelector(`label[for="${f.id}"]`)!.textContent).toBe("Untersuchungsgegenstand und Erkenntnisinteresse");
  });

  it("KP-2026-W43-62: Ausgangsinformationen mit Hilfetext und mehrzeiligem Beispiel", async () => {
    await erfassungZeigen();
    const f = feld<HTMLTextAreaElement>("Ausgangsinformationen und Stichworte");
    expect(beschreibung(f)).toBe(
      "Welche Informationen liegen bereits vor? Eigene Notizen, Zahlen, Beobachtungen. Stichpunkte genügen; Unbestätigtes bitte kennzeichnen.",
    );
    expect(f.placeholder).toBe(
      "Beispiel:\n– Dieselengpässe in mehreren Landkreisen gemeldet (unbestätigt)\n– Einzelne Tankstellen wegen Stromausfall außer Betrieb\n– Rettungsdienst meldet Tankprobleme bei Notstromaggregaten",
    );
    expect(f.value).toBe("");
  });

  it("KP-2026-W43-63: Webseiten mit Hilfetext; ohne Websuche zusätzlicher, verknüpfter Hinweis", async () => {
    await erfassungZeigen();
    const HILFE =
      "Die KI ruft die Seiten nur ab, wenn „Recherche durchführen“ eingeschaltet ist. Gesperrte Seiten im Browser als PDF speichern und unter „Dateien“ hinzufügen.";
    const ZUSATZ = "„Recherche durchführen“ ist ausgeschaltet: Die eingetragenen Seiten werden nicht abgerufen, die KI sieht nur die Adressen.";
    const f = () => feld<HTMLTextAreaElement>("Webseiten (eine Adresse je Zeile)");
    expect(beschreibung(f())).toBe(HILFE);
    const schalter = () => document.querySelector(".schalter input") as HTMLInputElement;
    expect(schalter().checked).toBe(true);

    // Schalter aus, aber keine Adresse: kein Zusatz
    await klick(schalter());
    expect(seitentext()).not.toContain(ZUSATZ);
    // Adresse eingetragen: Zusatz erscheint und ist verknüpft
    await eingeben(f(), "https://beispiel.invalid/lage");
    await bisWahr(() => expect(beschreibung(f())).toBe(`${HILFE} ${ZUSATZ}`));
    // Schalter wieder an: Zusatz verschwindet
    await klick(schalter());
    await bisWahr(() => expect(beschreibung(f())).toBe(HILFE));
    expect(seitentext()).not.toContain(ZUSATZ);
  });

  it("KP-2026-W43-64: Stichtag der Meldung, sichtbarer und zugänglicher Name stimmen überein", async () => {
    await erfassungZeigen();
    const gruppe = document.querySelector('[role="group"][aria-labelledby="t0-auftrag"]') as HTMLElement;
    expect(document.getElementById("t0-auftrag")!.textContent?.trim()).toBe("Stichtag der Meldung");
    expect(beschreibung(gruppe)).toBe(
      "Für welchen Tag soll die Meldung gelten? Die Uhrzeit ist optional; ohne Angabe schlägt die KI den Meldezeitpunkt vor. Für Übungen oder zurückliegende Lagen den damaligen Tag wählen.",
    );
    expect(gruppe.querySelector('input[type="date"]')!.getAttribute("aria-label")).toBe("Stichtag");
    expect(gruppe.querySelector('input[type="time"]')!.getAttribute("aria-label")).toBe("Uhrzeit (optional)");
    expect(knopf("Jetzt: Stichtag und Uhrzeit auf aktuelle Zeit setzen")).toBeDefined();
    expect(document.querySelector('[aria-label="Meldestichtag"]')).toBeNull();
  });

  it("KP-2026-W43-65: Prüffrage mit Hilfetext und Beispiel", async () => {
    await erfassungZeigen();
    const f = feld("Besondere Prüffrage (optional)");
    expect(beschreibung(f)).toBe("Ein einzelner Punkt, den die Recherche gezielt prüfen soll, oder ein gewünschter Beobachtungszeitraum.");
    expect(f.placeholder).toBe("Beispiel: Ist die Notstromversorgung von Krankenhäusern betroffen?");
    expect(f.value).toBe("");
  });
});

describe("KI-Erfassung: Gegenstand bestätigen", () => {
  async function bisBestaetigung() {
    await erfassungZeigen();
    await eingeben(feld<HTMLTextAreaElement>("Untersuchungsgegenstand und Erkenntnisinteresse"), "Kraftstoffversorgung");
    await klick(document.querySelector(".bestaetigung input") as HTMLInputElement);
    await klick(knopf("Gegenstand bestimmen (S1)"));
    // auf die Überschrift des Schritts warten; „Gegenstand bestätigen“ steht auch in der Schrittleiste
    await bisWahr(() => expect([...document.querySelectorAll("h2")].map((h) => h.textContent)).toContain("Gegenstand bestätigen"));
  }

  it("KP-2026-W43-66: Untersuchungsgegenstand aus S1 mit Hinweis auf die Wirkung für die Recherche", async () => {
    await bisBestaetigung();
    const f = feld<HTMLTextAreaElement>("Untersuchungsgegenstand und Erkenntnisinteresse");
    expect(f.value).toBe("Störungen der Kraftstoffversorgung");
    expect(beschreibung(f)).toBe("Von der KI aus dem Auftrag abgeleitet. Bei Bedarf anpassen; die Recherche richtet sich nach diesem Text.");
  });

  it("KP-2026-W43-67: Betrachtungshorizont mit Hilfetext", async () => {
    await bisBestaetigung();
    const f = feld("Betrachtungshorizont");
    expect(f.value).toBe("kommende Wochen");
    expect(beschreibung(f)).toBe("Zeitraum, über den die Meldung mögliche Entwicklungen betrachtet, z. B. die kommenden Wochen.");
  });

  it("KP-2026-W43-68: Bezug zum Referenzraum nennt den Raum des Profils", async () => {
    await bisBestaetigung();
    const f = feld("Bezug zum Referenzraum");
    expect(f.value).toBe("bundesweit");
    // Referenzraum des Beispielprofils laut profil.json
    expect(beschreibung(f)).toBe(
      "Warum die Lage für den Betrachtungsraum des Profils (Bevölkerungsschutz in Deutschland) bedeutsam ist, auch bei Ereignissen außerhalb, etwa über Lieferketten.",
    );
  });
});
