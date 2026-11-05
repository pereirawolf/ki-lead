// @vitest-environment jsdom
// Management Summary während der Erstellung (seit 0.6.6, Fehlermeldung des Herausgebers vom 27.10.2026): Bis 0.6.5 zeigte
// der Schritt nur „… wird erstellt“; Dauer und Kosten fehlten, und der KI-Chip der Kopfleiste blieb auf „KI offline“, weil
// nur die KI-Erfassung ihren Lauf meldete. Soll: dieselbe Laufzeile wie in der KI-Erfassung (Uhr, erwartete Dauer aus
// den Messwerten der Abnahme vom 25.10.2026, geschriebene Zeichen, voraussichtliche Kosten) und eine Meldung an die
// Kopfleiste über den KI-Zugang, die mit dem Ende, dem Abbruch und dem Verlassen des Schritts wieder null wird.
// Seit 0.7.1 (DK-2026-W45-01) sendet die Management Summary erst nach der Bestätigung zur Weitergabe der Inhalte; die
// Laufanzeige-Tests bestätigen deshalb zuerst, ihr Soll ist unverändert.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung, seitentext, takt } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";
import { KiZugangContext, type KiZugangWert } from "../../src/ui/kiZugang";
import type { KopfLauf } from "../../src/ui/KiSymbol";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

/** Anbieter-Attrappe: meldet 1 234 geschriebene Zeichen und antwortet erst, wenn der Test `antworten` aufruft */
const steuerung = vi.hoisted(() => ({ antworten: () => {}, wartet: false, aufrufe: 0 }));
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    static fuer() {
      return new Verteiler();
    }
    async senden(a: { modell: string; signal?: AbortSignal; fortschritt?: (f: unknown) => void }) {
      steuerung.aufrufe++;
      a.fortschritt?.({ art: "schreibt", zeichen: 1234 });
      const { llmAntwort } = await import("../support/anbieter");
      const text = JSON.stringify({
        kernaussage: "Die Lage ist angespannt.",
        abschnitte: {
          lage_ereignis: "Lage.",
          risiken_auswirkungen: "Risiken.",
          massnahmen_empfehlungen: "Maßnahmen.",
          abhaengigkeiten_interdependenzen: "Abhängigkeiten.",
        },
        kurztitel: ["Eins", "Zwei"],
      });
      return new Promise((fertig, fehler) => {
        steuerung.wartet = true;
        steuerung.antworten = () => fertig(llmAntwort(text, { modell: a.modell, kostenUsd: 0.04 }));
        a.signal?.addEventListener("abort", () => fehler(Object.assign(new Error("abgebrochen"), { name: "AbortError" })));
      });
    }
  }
  return { ...echt, Verteiler };
});

beforeAll(reactUmgebung);
afterEach(async () => {
  steuerung.wartet = false;
  steuerung.aufrufe = 0;
  await aushaengen();
  speicherLeeren(db);
});

async function zeigen(laufMelden: (l: KopfLauf | null) => void) {
  const p = (await profil("lead-beispiel")).profil!;
  const { KurzfassungKasten } = await import("../../src/ui/Kurzfassung");
  const zugang: KiZugangWert = {
    profil: p,
    // Sonnet „mittel“: gemessen 6–8 s (MS_DAUER [0, 10]) → „unter 1 Minute“
    einstellungen: { ...STANDARD, modelle: { ...STANDARD.modelle, kurzfassung: "claude-sonnet-5-5" }, aufwand: { ...STANDARD.aufwand, kurzfassung: "medium" } },
    schluessel: { anthropic: "sk-test", openai: "", mistral: "", stelle: "" },
    zuEinstellungen: () => {},
    laufMelden,
  };
  await einhaengen(
    React.createElement(
      KiZugangContext.Provider,
      { value: zugang },
      React.createElement(KurzfassungKasten, { profil: p, meldung: ilkaMeldung("TH"), eigenerSchritt: true }),
    ),
  );
}

/** Haken „Ich gebe nur fiktive oder offen zugängliche Inhalte weiter …“ im Kasten der Management Summary */
const haken = () => document.querySelector<HTMLInputElement>('.kurzfassung .bestaetigung input[type="checkbox"]');
async function weitergabeBestaetigen() {
  expect(haken(), "Bestätigung zur Weitergabe").toBeTruthy();
  if (!haken()!.checked) await act(async () => haken()!.click());
}

const laufzeile = () => document.querySelector(".kurzfassung .laufanzeige")?.textContent ?? "";

describe("Management Summary: Laufanzeige und KI-Chip", () => {
  it("zeigt während der Erstellung Uhr, erwartete Dauer, geschriebene Zeichen und voraussichtliche Kosten", async () => {
    await zeigen(() => {});
    expect(document.querySelector(".kurzfassung .laufanzeige")).toBeNull();
    await weitergabeBestaetigen();
    await klick(knopf("Management Summary erstellen"));
    await bisWahr(() => expect(laufzeile()).toContain("1.234 Zeichen geschrieben"));
    expect(document.querySelector('.kurzfassung .laufanzeige [role="timer"]')?.textContent).toMatch(/^\d+ s$/);
    expect(laufzeile()).toContain("von voraussichtlich unter 1 Minute");
    // Die tatsächlichen Kosten stehen erst mit der Antwort fest; bis dahin die Schätzung zum Listenpreis
    expect(laufzeile()).toMatch(/voraussichtlich (bis )?\d+,\d{2} USD|voraussichtlich [\d,]+–[\d,]+ USD/);
    expect(seitentext()).toContain("Management Summary wird erstellt …");

    await bisWahr(() => steuerung.wartet);
    steuerung.antworten();
    await bisWahr(() => expect(document.querySelector(".kurzfassung-text")).not.toBeNull());
    expect(document.querySelector(".kurzfassung .laufanzeige")).toBeNull();
    expect(seitentext()).toMatch(/mit claude-sonnet-5-5, 0,04 USD/);
  });

  it("meldet den Lauf an die Kopfleiste und am Ende null", async () => {
    const meldungen: (KopfLauf | null)[] = [];
    await zeigen((l) => meldungen.push(l));
    expect(meldungen).toEqual([]);
    await weitergabeBestaetigen();
    await klick(knopf("Management Summary erstellen"));
    await bisWahr(() => expect(meldungen).toEqual([{ stufe: "ms", titel: "Management Summary" }]));
    await bisWahr(() => steuerung.wartet);
    steuerung.antworten();
    await bisWahr(() => expect(meldungen.at(-1)).toBeNull());
    expect(meldungen).toHaveLength(2);
  });

  it("meldet nach Abbruch und beim Verlassen des Schritts null", async () => {
    const meldungen: (KopfLauf | null)[] = [];
    await zeigen((l) => meldungen.push(l));
    await weitergabeBestaetigen();
    await klick(knopf("Management Summary erstellen"));
    await bisWahr(() => expect(meldungen.at(-1)).toEqual({ stufe: "ms", titel: "Management Summary" }));
    await klick(knopf("Abbrechen"));
    await bisWahr(() => expect(meldungen.at(-1)).toBeNull());
    expect(seitentext()).toContain("Abgebrochen.");

    await klick(knopf("Management Summary erstellen"));
    await bisWahr(() => expect(meldungen.at(-1)).toEqual({ stufe: "ms", titel: "Management Summary" }));
    await aushaengen();
    await takt();
    expect(meldungen.at(-1)).toBeNull();
  });
});

describe("DK-2026-W45-01: Management Summary nur nach Bestätigung zur Weitergabe", () => {
  it("sendet ohne Haken nichts; der Knopf ist gesperrt und verweist auf die Bestätigung", async () => {
    await zeigen(() => {});
    const k = knopf("Management Summary erstellen")!;
    expect(k.disabled).toBe(true);
    expect(k.getAttribute("aria-describedby")).toBe("kurzfassung-bestaetigung");
    const text = document.getElementById("kurzfassung-bestaetigung")?.textContent ?? "";
    expect(text).toContain("keine personenbezogenen und keine eingestuften Daten");
    expect(text).toContain("Anthropic");
    await act(async () => k.click());
    await takt();
    expect(steuerung.aufrufe).toBe(0);
    expect(document.querySelector(".kurzfassung .laufanzeige")).toBeNull();
  });

  it("sendet nach dem Haken genau eine Anfrage", async () => {
    await zeigen(() => {});
    await weitergabeBestaetigen();
    const k = knopf("Management Summary erstellen")!;
    expect(k.disabled).toBe(false);
    expect(k.hasAttribute("aria-describedby")).toBe(false);
    await klick(k);
    await bisWahr(() => steuerung.wartet);
    expect(steuerung.aufrufe).toBe(1);
    steuerung.antworten();
    await bisWahr(() => expect(document.querySelector(".kurzfassung-text")).not.toBeNull());
  });
});
