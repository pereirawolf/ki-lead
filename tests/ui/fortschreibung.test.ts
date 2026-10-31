// @vitest-environment jsdom
// Fortschreibung einer eigenen Vormeldung in der Oberfläche (0.4.28): Recherchemodus und Stand der Vormeldung vor
// S2 sichtbar, nach dem Lauf die tatsächliche Recherche und der Befund zur ausgebliebenen Aktualisierung.
// Vormeldung: fiktive Beispielmeldung „Ilka“ mit verschobenem Meldezeitpunkt.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { aushaengen, bisWahr, eingeben, einhaengen, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

const anfragen = vi.hoisted(() => ({ liste: [] as { werkzeuge?: unknown }[] }));
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    static fuer() {
      return new Verteiler();
    }
    async senden(a: { modell: string; werkzeuge?: unknown }) {
      anfragen.liste.push({ werkzeuge: a.werkzeuge });
      const { llmAntwort, meldungsAntwort } = await import("../support/anbieter");
      const { s1Vorschlag } = await import("../support/pipeline");
      const { ilkaMeldung } = await import("../support/fixtures");
      if (anfragen.liste.length === 1)
        return llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-21T19:45", gegenstand: "Grundlage ist allein das Material." }), {
          modell: a.modell,
        });
      // S2 ohne Websuche und ohne Seitenabruf (Nutzung 0/0), wie im Anlasslauf
      return meldungsAntwort(ilkaMeldung("Bund"), "Kurz.", { modell: a.modell });
    }
  }
  return { ...echt, Verteiler };
});

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(db);
  anfragen.liste = [];
});

describe("Fortschreibung in der KI-Erfassung", () => {
  it("zeigt Recherchemodus und Stand der Vormeldung vor S2 und die ausgebliebene Aktualisierung danach", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const vormeldung = ilkaMeldung("Bund");
    vormeldung.meldezeitpunkt = "2026-10-21T19:40";
    const { KiErfassung } = await import("../../src/ui/KiErfassung");
    await einhaengen(
      React.createElement(KiErfassung, {
        profil: p,
        // Orientierungssuche und Nachforderung (seit 0.6.0) aus: Der Test gilt der Fortschreibung; den Ablauf mit
        // Orientierung prüft tests/ui/orientierung.test.ts
        einstellungen: { ...STANDARD, websucheMax: 30, abrufMax: 10, orientierungJeSachverhalt: 0, nachforderung: false },
        schluessel: { anthropic: "sk-test", openai: "", mistral: "", stelle: "" },
        zuEinstellungen: () => {},
        uebernehmen: () => {},
        uebergabe: { nr: 1, profilHash: p.hash, dateien: [{ id: "v1", name: "Vormeldung_FIKTIV.json", text: JSON.stringify(vormeldung), rolle: "meldung" }] },
      }),
    );
    await bisWahr(() => expect(seitentext()).toContain("Vormeldung_FIKTIV.json"));
    expect(seitentext()).toContain("S2: Recherche durchführen (Websuche bis zu 30-mal, Seitenabruf bis zu 10-mal).");
    await klick(document.querySelector(".bestaetigung input") as HTMLInputElement);
    await klick(knopf("Gegenstand bestimmen (S1)"));

    await bisWahr(() => knopf("Bestätigen und recherchieren (S2)") !== undefined);
    expect(seitentext()).toContain("Stand der Vormeldung: 21.10.2026, 19:40 Uhr (Ausgangspunkt, nicht t0).");
    expect(seitentext()).toContain("Absender: Bund · Koordinierungsstelle (Beispiel) – Redaktionskonferenz (aus der eigenen Vormeldung).");
    expect(seitentext()).toContain("S2: Recherche durchführen (Websuche bis zu 30-mal, Seitenabruf bis zu 10-mal).");
    // Unvollständiges t0 sperrt S2 mit sichtbarer Begründung, statt in einen Fehlerlauf zu führen
    const uhr = [...document.querySelectorAll<HTMLInputElement>('input[aria-label="Uhrzeit t0"]')].at(-1)!;
    const vorher = uhr.value;
    await eingeben(uhr, "");
    expect(knopf("Bestätigen und recherchieren (S2)")!.disabled).toBe(true);
    expect(seitentext()).toContain("S2 startet erst mit einem gültigen t0");
    await eingeben(uhr, vorher);
    expect(knopf("Bestätigen und recherchieren (S2)")!.disabled).toBe(false);
    await klick(knopf("Bestätigen und recherchieren (S2)"));

    await bisWahr(() => expect(seitentext()).toContain("Recherche in S2: 0 Websuchen, 0 Seitenabrufe."));
    const warnungen = [...document.querySelectorAll(".befund-warnung")].map((li) => li.textContent || "");
    expect(warnungen.some((t) => t.includes("Die Meldung wurde aus der Vormeldung neu aufbereitet"))).toBe(true);
    expect(anfragen.liste).toHaveLength(2);
    expect(anfragen.liste[1].werkzeuge).toBeTruthy();
  });
});
