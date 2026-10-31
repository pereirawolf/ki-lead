// @vitest-environment jsdom
// Orientierungssuche und Suchbegriffe im Bestätigungsschritt (0.6.0, Befunde KP-2026-W44-06 und -09): Nach der Bestätigung des
// Gegenstands sucht S1 je Sachverhalt kurz im Web; Treffer und Suchbegriffe erscheinen zur Bearbeitung; die bestätigten Begriffe
// gehen als Pflichtsuchen an S2; das Ergebnis weist Orientierung und Pflichtsuchen getrennt aus. Alle Inhalte sind fiktiv.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil } from "../support/dateien";
import { aushaengen, bisWahr, eingeben, einhaengen, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

const anfragen = vi.hoisted(() => ({ liste: [] as { system: { text: string }[]; werkzeuge?: any; nachrichten: unknown[] }[] }));
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    static fuer() {
      return new Verteiler();
    }
    async senden(a: any) {
      anfragen.liste.push({ system: a.system, werkzeuge: a.werkzeuge, nachrichten: a.nachrichten });
      const { llmAntwort, meldungsAntwort } = await import("../support/anbieter");
      const { s1Vorschlag } = await import("../support/pipeline");
      const { ilkaMeldung } = await import("../support/fixtures");
      const { leereNutzung } = await import("../../src/anbieter/typen");
      // S1 mit festem Schema, Orientierungssuche an ihrer Anweisung, sonst S2
      if (a.jsonSchema) return llmAntwort(JSON.stringify(s1Vorschlag()), { modell: a.modell });
      if (String(a.system[0]?.text).includes("Orientierung für die Recherche"))
        return llmAntwort('```json\n{"suchbegriffe":[{"begriff":"Orkan Ilka Hessen Warnung","zweck":"B01/R1","zielquelle":"Wetterdienst (FIKTIV)"}]}\n```', {
          modell: a.modell,
          suchen: ["Orkan Ilka Hessen"],
          fundstellen: [{ url: "https://beispiel.invalid/ilka", titel: "Orkanlage Ilka (FIKTIV)", stand: "14.10.2026" }],
          nutzung: { ...leereNutzung(), eingabe: 100, ausgabe: 50, websuchen: 1 },
        });
      return meldungsAntwort(ilkaMeldung("HE"), "Kurz.", {
        modell: a.modell,
        suchen: ["Orkanwarnung Hessen Ilka amtlich"],
        nutzung: { ...leereNutzung(), eingabe: 100, ausgabe: 50, websuchen: 1 },
      });
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

describe("KP-2026-W44-06: Orientierung und Suchbegriffe im Bestätigungsschritt", () => {
  it("sucht nach der Bestätigung je Sachverhalt, zeigt Treffer und Begriffe, gibt geänderte Begriffe als Pflichtsuchen an S2", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const { KiErfassung } = await import("../../src/ui/KiErfassung");
    await einhaengen(
      React.createElement(KiErfassung, {
        profil: p,
        einstellungen: { ...STANDARD, nachforderung: false },
        schluessel: { anthropic: "sk-test", openai: "", mistral: "", stelle: "" },
        zuEinstellungen: () => {},
        uebernehmen: () => {},
      }),
    );
    expect(seitentext()).toContain("Vorher in S1 1 Orientierungssuche je Sachverhalt ohne Seitenabruf, nicht auf das Kontingent angerechnet");
    await eingeben(document.querySelector("textarea") as HTMLTextAreaElement, "Orkan in Hessen (FIKTIV)");
    await klick(document.querySelector(".bestaetigung input") as HTMLInputElement);
    await klick(knopf("Gegenstand bestimmen (S1)"));

    await bisWahr(() => knopf("Gegenstand bestätigen und Orientierung suchen (S1)") !== undefined);
    expect(knopf("Bestätigen und recherchieren (S2)")).toBeUndefined();
    expect(seitentext()).toContain("Gegenstand und Suchbegriffe bestätigen");
    await klick(knopf("Gegenstand bestätigen und Orientierung suchen (S1)"));

    const begriff = () => document.querySelector('input[aria-label="Suchbegriff 1 für Sachverhalt 1"]') as HTMLInputElement | null;
    await bisWahr(() => begriff() !== null);
    expect(anfragen.liste[1].werkzeuge).toEqual({ websuche: { maxUses: 1, land: "DE", zeitzone: "Europe/Berlin" }, erzwingen: "websuche" });
    expect(seitentext()).toContain("Orkanlage Ilka (FIKTIV)");
    expect(seitentext()).toContain("Orientierungssuche: „Orkan Ilka Hessen“");
    expect(begriff()!.value).toBe("Orkan Ilka Hessen Warnung");
    expect(knopf("Orientierung erneut suchen")).toBeDefined();
    await eingeben(begriff()!, "Orkanwarnung Hessen Ilka");

    await klick(knopf("Bestätigen und recherchieren (S2)"));
    await bisWahr(() => expect(seitentext()).toContain("Pflichtsuchen: 1 von 1 ausgeführt."));
    expect(seitentext()).toContain("Recherche in S2: 1 Websuche, 0 Seitenabrufe.");
    expect(seitentext()).toContain("Dazu in S1 1 Orientierungssuche (nicht auf das Kontingent von S2 angerechnet).");
    const steuerung = anfragen.liste[2].system.at(-1)!.text;
    expect(steuerung).toContain("  - Sachverhalt 1: „Orkanwarnung Hessen Ilka“ (Zweck: B01/R1; Zielquelle: Wetterdienst (FIKTIV))");
    expect(JSON.stringify(anfragen.liste[2].nachrichten)).toContain("Orkanlage Ilka (FIKTIV) (14.10.2026) – https://beispiel.invalid/ilka");
    expect(anfragen.liste).toHaveLength(3);
  });

  it("ohne Orientierung (0 je Sachverhalt) bleibt der Schritt einstufig; Suchbegriffe lassen sich selbst eintragen", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const { KiErfassung } = await import("../../src/ui/KiErfassung");
    await einhaengen(
      React.createElement(KiErfassung, {
        profil: p,
        einstellungen: { ...STANDARD, orientierungJeSachverhalt: 0, nachforderung: false },
        schluessel: { anthropic: "sk-test", openai: "", mistral: "", stelle: "" },
        zuEinstellungen: () => {},
        uebernehmen: () => {},
      }),
    );
    expect(seitentext()).not.toContain("Orientierungssuche je Sachverhalt");
    await eingeben(document.querySelector("textarea") as HTMLTextAreaElement, "Orkan in Hessen (FIKTIV)");
    await klick(document.querySelector(".bestaetigung input") as HTMLInputElement);
    await klick(knopf("Gegenstand bestimmen (S1)"));
    await bisWahr(() => knopf("Bestätigen und recherchieren (S2)") !== undefined);
    expect(knopf("Gegenstand bestätigen und Orientierung suchen (S1)")).toBeUndefined();
    await klick(knopf("Suchbegriff hinzufügen"));
    const feld = document.querySelector('input[aria-label="Suchbegriff 1 für Sachverhalt 1"]') as HTMLInputElement;
    await eingeben(feld, "Orkanwarnung Hessen Ilka");
    await klick(knopf("Bestätigen und recherchieren (S2)"));
    await bisWahr(() => expect(seitentext()).toContain("Pflichtsuchen: 1 von 1 ausgeführt."));
    expect(seitentext()).not.toContain("Orientierungssuche (nicht auf das Kontingent");
    expect(anfragen.liste).toHaveLength(2);
    expect(anfragen.liste[1].system.at(-1)!.text).toContain("„Orkanwarnung Hessen Ilka“");
  });
});
