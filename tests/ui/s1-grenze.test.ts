// @vitest-environment jsdom
// S1 an der Ausgabegrenze (0.4.25): verständliche Meldung, Auftrag und Material bleiben, Laufprotokoll exportierbar,
// kein zweiter Aufruf. Grundlage: Läufe 20261021-133605-75wi und 20261021-133728-cvza.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, eingeben, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

const anfragen = vi.hoisted(() => ({ liste: [] as { modell: string; aufwand?: string; maxTokens: number }[] }));
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    async senden(a: { modell: string; aufwand?: string; maxTokens: number }) {
      anfragen.liste.push({ modell: a.modell, aufwand: a.aufwand, maxTokens: a.maxTokens });
      const { llmAntwort } = await import("../support/anbieter");
      // Nur ein Denkblock, kein sichtbarer Text: wie Lauf 20261021-133605-75wi, aber an der neuen Grenze
      return llmAntwort("", { modell: a.modell, stopGrund: "max_tokens", inhalt: [{ type: "thinking" }] });
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
  anfragen.liste = [];
  downloads.liste = [];
});

describe("S1 an der Ausgabegrenze", () => {
  it("meldet die Grenze mit Modell und Aufwand, behält den Auftrag und stellt keinen zweiten Aufruf", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const { KiErfassung } = await import("../../src/ui/KiErfassung");
    await einhaengen(
      React.createElement(KiErfassung, {
        profil: p,
        einstellungen: STANDARD,
        schluessel: { anthropic: "sk-test-NICHT-EXPORTIEREN-5d1e", openai: "", mistral: "" },
        zuEinstellungen: () => {},
        uebernehmen: () => {},
      }),
    );
    await bisWahr(() => document.querySelector("textarea") !== null);
    const auftrag = document.querySelector("textarea") as HTMLTextAreaElement;
    await eingeben(auftrag, "Orkan in Hessen");
    await klick(document.querySelector(".bestaetigung input") as HTMLInputElement);
    await klick(knopf("Gegenstand bestimmen (S1)"));
    await bisWahr(() => expect(seitentext()).toContain("S1 hat die Ausgabegrenze von 128.000 Token erreicht"));
    expect(seitentext()).toContain("(Modell claude-haiku-5-5, Aufwand high)");
    // Zurück im Auftrag, kein Vorschlag zur Bestätigung
    expect(document.querySelector("section.schritt-inhalt h2")!.textContent).toBe("Auftrag und Material");
    expect(anfragen.liste).toEqual([{ modell: "claude-haiku-5-5", aufwand: "high", maxTokens: 128000 }]);
    expect((document.querySelector("textarea") as HTMLTextAreaElement).value).toBe("Orkan in Hessen");

    // Laufprotokoll mit Grenze, Abbruchgrund und Notiz
    await bisWahr(() => knopf("Laufprotokoll des abgebrochenen Laufs exportieren") !== undefined);
    await klick(knopf("Laufprotokoll des abgebrochenen Laufs exportieren"));
    const lauf = JSON.parse(downloads.liste[0].inhalt);
    const s1 = lauf.stufen[0];
    expect([s1.anfrage.maxTokens, s1.antwort.stopGrund]).toEqual([128000, "max_tokens"]);
    expect(s1.notiz).toMatch(/^S1-Ausgabegrenze von 128\.000 Token erreicht; kein vollständiger Vorschlag\./);
    expect(lauf.fehler).toMatch(/^S1 hat die Ausgabegrenze von 128\.000 Token erreicht/);
    expect(downloads.liste[0].inhalt).not.toContain("sk-test-NICHT-EXPORTIEREN-5d1e");
  });
});
