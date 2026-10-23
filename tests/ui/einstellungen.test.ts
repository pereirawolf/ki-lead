// @vitest-environment jsdom
// Einstellungen, Abschnitt „Recherche“: Höchstzahl Ausgabetoken gilt für jeden KI-Aufruf (0.4.26).
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import React from "react";
import { profilPflicht } from "../support/dateien";
import { aushaengen, einhaengen, eingeben, klick, knopf, reactUmgebung } from "../support/dom";
import { STANDARD, STANDARD_PROFILE, type Einstellungen } from "../../src/pipeline/einstellungen";
import { EinstellungenAnsicht } from "../../src/ui/Einstellungen";

beforeAll(reactUmgebung);
afterEach(aushaengen);

describe("Einstellungen: Höchstzahl Ausgabetoken", () => {
  it("heißt „(S1, S2, S3)“, erklärt die Geltung, zeigt die Vorgabe 128 000 und begrenzt Eingaben auf 8 000–128 000", async () => {
    const p = await profilPflicht();
    const gesetzt: Einstellungen[] = [];
    await einhaengen(
      React.createElement(EinstellungenAnsicht, {
        profil: p,
        einstellungen: STANDARD,
        setEinstellungen: (e: Einstellungen) => void gesetzt.push(e),
        schluessel: { anthropic: "", openai: "" },
        setSchluessel: () => {},
      }),
    );
    const feld = [...document.querySelectorAll("label.feld")].find(
      (l) => l.querySelector(".feld-label")?.textContent === "Höchstzahl Ausgabetoken (S1, S2, S3)",
    );
    expect(feld, "Feld mit neuer Bezeichnung").toBeTruthy();
    expect(feld!.textContent).toContain("Gilt für jeden KI-Aufruf der App (S1, S2, S3 und Management Summary)");
    const eingabe = feld!.querySelector("input") as HTMLInputElement;
    expect(eingabe.value).toBe("128000");
    await eingeben(eingabe, "500000");
    await eingeben(eingabe, "1000");
    await eingeben(eingabe, "");
    expect(gesetzt.map((e) => e.maxTokensErfassung)).toEqual([128000, 8000, 128000]);
    expect(document.body.textContent).not.toContain("Höchstzahl Ausgabetoken (S2, S3)");
  });
});

describe("Einstellungen: Standard-Profil je Anbieter", () => {
  /** Ansicht mit eigenem Zustand, damit eine Wahl wie in der App sofort wirkt */
  function MitZustand({ start, gesetzt }: { start: Einstellungen; gesetzt: Einstellungen[] }) {
    const [e, setE] = React.useState(start);
    return React.createElement(EinstellungenAnsicht, {
      profil: null,
      einstellungen: e,
      setEinstellungen: (neu: Einstellungen) => {
        gesetzt.push(neu);
        setE(neu);
      },
      schluessel: { anthropic: "", openai: "" },
      setSchluessel: () => {},
    });
  }

  const abschnitt = (titel: string) => [...document.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent === titel)!;

  it("setzt in jedem Schlüsselabschnitt Modell und Aufwand aller Aufgaben auf das Standard-Profil des Anbieters", async () => {
    const gesetzt: Einstellungen[] = [];
    const start: Einstellungen = { ...STANDARD, websucheMax: 7, modelle: { ...STANDARD.modelle, erfassung: "claude-fable-5-1" } };
    await einhaengen(React.createElement(MitZustand, { start, gesetzt }));

    const openai = abschnitt("API-Schlüssel (OpenAI)");
    expect(knopf("Standard-Profil wählen", openai)).toBeTruthy();
    expect(openai.textContent).toContain("Setzt unter „Modelle und Aufwand“ alle Aufgaben auf S1 gpt-6-luna (hoch)");
    await klick("Standard-Profil wählen", openai);
    expect(gesetzt.at(-1)!.modelle).toEqual(STANDARD_PROFILE.openai.modelle);
    expect(gesetzt.at(-1)!.aufwand).toEqual(STANDARD_PROFILE.openai.aufwand);
    // Übrige Einstellungen bleiben
    expect(gesetzt.at(-1)!.websucheMax).toBe(7);
    expect(abschnitt("API-Schlüssel (OpenAI)").textContent).toContain("Modelle und Aufwand sind auf das Standard-Profil OpenAI gesetzt");
    expect(abschnitt("API-Schlüssel (OpenAI)").textContent).toContain("Aktiv unter „Modelle und Aufwand“");
    // Die Auswahlfelder unter „Modelle und Aufwand“ zeigen die neuen Werte
    expect((document.querySelector('select[aria-label="Modell S2 Verdichtung"]') as HTMLSelectElement).value).toBe("gpt-6-astra");
    expect((document.querySelector('select[aria-label="Aufwand S1 Gegenstand und SOP-Auswahl"]') as HTMLSelectElement).value).toBe("high");

    await klick("Standard-Profil wählen", abschnitt("API-Schlüssel (Anthropic)"));
    expect(gesetzt.at(-1)!.modelle).toEqual(STANDARD_PROFILE.anthropic.modelle);
    expect(abschnitt("API-Schlüssel (OpenAI)").textContent).not.toContain("Aktiv unter");
    expect(abschnitt("API-Schlüssel (Anthropic)").textContent).toContain("Aktiv unter „Modelle und Aufwand“");
  });
});
