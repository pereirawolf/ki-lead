// @vitest-environment jsdom
// Prüffall Reparatur unter „Einstellungen → Modelle & Verarbeitung“ (seit 0.5.13, AV-2026-W43-25): Auswahl der
// Varianten des Plans reparatur-ilka, fehlender Schlüssel, Ablauf mit Attrappe und ZIP-Datei.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { leseOrdner, profilPflicht, repoPfad } from "../support/dateien";
import { aushaengen, bisWahr, eingeben, einhaengen, klick, knopf, reactUmgebung } from "../support/dom";
import { llmAntwort } from "../support/anbieter";
import { STANDARD } from "../../src/pipeline/einstellungen";
import type { LlmAnbieter } from "../../src/anbieter/typen";
import type { Schluessel } from "../../src/anbieter/verteiler";

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: Blob }[] }));
vi.mock("../../src/speicher/speicher", async (orig) => {
  const echt = await orig<typeof import("../../src/speicher/speicher")>();
  return { ...echt, dateiAnbieten: (inhalt: Blob, name: string) => void downloads.liste.push({ name, inhalt }) };
});

import { ReparaturPrueffallAbschnitt } from "../../src/ui/ReparaturPrueffall";
import { EinstellungenAnsicht } from "../../src/ui/Einstellungen";

beforeAll(reactUmgebung);
afterEach(async () => {
  downloads.liste = [];
  await aushaengen();
});

const OHNE: Schluessel = { anthropic: "", openai: "", mistral: "" };
const MUSTER_TEXT = readFileSync(repoPfad("evaluation/material/ilka-musterfassung.json"), "utf-8");
const text = () => document.body.textContent || "";
const abschnitt = () => document.querySelector('[aria-labelledby="reparatur-prueffall-titel"]') as HTMLElement;
const auswahl = () => abschnitt().querySelector("select") as HTMLSelectElement;

const waehlen = (wert: string) => eingeben(auswahl(), wert);

/** Reparatur als Attrappe: gibt die unbeschädigte Musterfassung zurück */
function attrappe(): LlmAnbieter & { modelle: string[] } {
  const modelle: string[] = [];
  return {
    id: "attrappe",
    modelle,
    async senden(a) {
      modelle.push(a.modell);
      return llmAntwort("```json\n" + MUSTER_TEXT + "\n```", { modell: a.modell, kostenUsd: 0.01 });
    },
  };
}

describe("AV-2026-W43-25: Prüffall Reparatur in den Einstellungen", () => {
  it("steht unter „Modelle & Verarbeitung“ nach dem Vergleichslauf; Vorgabe: Reparaturmodell der Einstellungen, zwei Durchgänge", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(
      React.createElement(EinstellungenAnsicht, {
        profil,
        einstellungen: STANDARD,
        setEinstellungen: () => {},
        schluessel: OHNE,
        setSchluessel: () => {},
        bereich: "modelle",
      }),
    );
    const titel = [...document.querySelectorAll(".vergleichslauf h3")].map((h) => h.textContent);
    expect(titel).toEqual(["Vergleichslauf Ilka", "Prüffall Reparatur"]);
    expect(abschnitt().textContent).toContain("S3 Reparatur: claude-sonnet-5-5 (niedrig) · Anthropic");
    expect((abschnitt().querySelector('input[type="number"]') as HTMLInputElement).value).toBe("2");
    expect(abschnitt().textContent).toContain("10 Fälle mit einer bis zwei Reparaturen");
    expect(abschnitt().textContent).toContain("fehlt der Schlüssel für Anthropic");
    expect(knopf("Prüffall starten")?.disabled).toBe(true);
  });

  it("bietet die fünf Varianten des Plans an, ohne die Einstellungen zu ändern; Mistral mit Endpunkt und Aufschlag", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(ReparaturPrueffallAbschnitt, { profil, einstellungen: STANDARD, schluessel: { ...OHNE, anthropic: "x" } }));
    expect([...auswahl().options].map((o) => o.value)).toEqual([
      "",
      "R-A-sonnet-niedrig",
      "R-B-haiku-niedrig",
      "R-C-sol-niedrig",
      "R-D-luna-niedrig",
      "R-E-mistral-small",
    ]);
    expect(knopf("Prüffall starten")?.disabled).toBe(false);
    await waehlen("R-E-mistral-small");
    expect(text()).toContain("S3 Reparatur: mistral-small-2603 (niedrig) · Mistral");
    expect(text()).toContain("Mistral-Endpunkt: EU (api.eu.mistral.ai)");
    expect(text()).toContain("inkl. 10 % Aufschlag am EU-Endpunkt");
    expect(text()).toContain("fehlt der Schlüssel für Mistral");
    expect(knopf("Prüffall starten")?.disabled).toBe(true);
  });

  it("läuft mit der Variante Haiku, zeigt die Fälle und bietet die ZIP-Datei an", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const att = attrappe();
    const anbieterFuer = vi.fn(() => att);
    await einhaengen(
      React.createElement(ReparaturPrueffallAbschnitt, {
        profil,
        einstellungen: STANDARD,
        schluessel: { ...OHNE, anthropic: "x" },
        datenLaden: async () => ({ profil: await profilPflicht("lead-beispiel"), dateien }),
        anbieterFuer,
      }),
    );
    await waehlen("R-B-haiku-niedrig");
    await eingeben(abschnitt().querySelector('input[type="number"]') as HTMLInputElement, "1");
    await klick("Prüffall starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    // Soll: je Defekt genau eine Reparatur mit Haiku, kein Aufruf für S1 oder S2
    expect(att.modelle).toEqual(Array(5).fill("claude-haiku-5-5"));
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Prueffall_Reparatur_claude-haiku-5-5-low_\d{8}-\d{4}\.zip$/);
    const reihe = JSON.parse(await (await JSZip.loadAsync(await inhalt.arrayBuffer())).file("reihe.json")!.async("string"));
    expect(reihe).toMatchObject({ format: "ki-lead-reparaturtest/1", quelle: "app", variante: "reparatur-ilka/R-B-haiku-niedrig", wiederholungen: 1 });
    expect(abschnitt().querySelectorAll("tbody tr")).toHaveLength(5);
    expect(text()).toContain("5 Fälle, schemakonform nach der Reparatur: 5, Reparaturen: 5, übrige Inhalte erhalten im Mittel: 100 %");
    await klick("ZIP herunterladen");
    expect(downloads.liste).toHaveLength(2);
  });
});
