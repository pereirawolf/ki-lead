// @vitest-environment jsdom
// Einstellungen, Abschnitt „Recherche“: Höchstzahl Ausgabetoken gilt für jeden KI-Aufruf (0.4.26).
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import React from "react";
import { profilPflicht } from "../support/dateien";
import { aushaengen, einhaengen, eingeben, reactUmgebung } from "../support/dom";
import { STANDARD, type Einstellungen } from "../../src/pipeline/einstellungen";
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
