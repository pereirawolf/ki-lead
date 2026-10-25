// @vitest-environment jsdom
// Vergleichslauf Ilka unter „Einstellungen → Modelle & Verarbeitung“ (seit 0.5.8): Anzeige der Konfiguration,
// Vorgabe drei Läufe, fehlender Schlüssel, Ablauf mit Attrappe und ZIP-Datei.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import JSZip from "jszip";
import { leseOrdner, profilPflicht, repoPfad } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung } from "../support/dom";
import { llmAntwort, meldungsAntwort } from "../support/anbieter";
import { STANDARD, standardProfilAnwenden } from "../../src/pipeline/einstellungen";
import type { LlmAnbieter } from "../../src/anbieter/typen";
import type { Schluessel } from "../../src/anbieter/verteiler";

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: Blob }[] }));
vi.mock("../../src/speicher/speicher", async (orig) => {
  const echt = await orig<typeof import("../../src/speicher/speicher")>();
  return { ...echt, dateiAnbieten: (inhalt: Blob, name: string) => void downloads.liste.push({ name, inhalt }) };
});

import { VergleichslaufAbschnitt } from "../../src/ui/Vergleichslauf";
import { EinstellungenAnsicht } from "../../src/ui/Einstellungen";

beforeAll(reactUmgebung);
afterEach(async () => {
  downloads.liste = [];
  await aushaengen();
});

const OHNE: Schluessel = { anthropic: "", openai: "", mistral: "" };
const REFERENZ = "beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
const text = () => document.body.textContent || "";
const anzahlFeld = () => document.querySelector('input[type="number"]') as HTMLInputElement;

function attrappe(referenz: unknown): LlmAnbieter {
  return {
    id: "attrappe",
    async senden(a) {
      if (a.jsonSchema)
        return llmAntwort(
          JSON.stringify({
            gegenstand: "Sturmfolgen",
            stichtag: "2026-10-14",
            meldezeitpunkt: "2026-10-14T14:00",
            referenzbezug: "Bund",
            horizont: "",
            sachverhalte: [{ titel: "Sturmfolgen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "", eingangsmeldungen: [] }],
            prueffrage: "",
            hinweise: "",
          }),
        );
      return meldungsAntwort(referenz);
    },
  };
}

describe("Vergleichslauf Ilka in den Einstellungen", () => {
  it("steht unter „Modelle & Verarbeitung“ und zeigt die wirksame Konfiguration mit drei Läufen als Vorgabe", async () => {
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
    expect(document.querySelector("#vergleichslauf-titel")?.textContent).toBe("Vergleichslauf Ilka");
    expect(text()).toContain("S1: claude-haiku-5-5 (hoch) · Anthropic");
    expect(text()).toContain("S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic");
    expect(anzahlFeld().value).toBe("3");
    // ohne Schlüssel nicht startbar, mit Hinweis auf den fehlenden Anbieter
    expect(knopf("Vergleichslauf starten")?.disabled).toBe(true);
    expect(text()).toContain("fehlt der Schlüssel für Anthropic");
  });

  it("startet mit der Mistral-Konfiguration, zeigt die Läufe und bietet die ZIP-Datei an", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const dateien = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const e = { ...standardProfilAnwenden(STANDARD, "mistral"), mistralEndpunkt: "global" as const };
    const anbieterFuer = vi.fn(() => attrappe(JSON.parse(dateien[REFERENZ])));
    await einhaengen(
      React.createElement(VergleichslaufAbschnitt, {
        profil,
        einstellungen: e,
        schluessel: { ...OHNE, mistral: "test" },
        datenLaden: async () => ({ profil: await profilPflicht("lead-beispiel"), dateien }),
        anbieterFuer,
      }),
    );
    expect(text()).toContain("Mistral-Endpunkt: global (api.mistral.ai)");
    await klick("Vergleichslauf starten");
    await bisWahr(() => downloads.liste.length === 1, { runden: 600 });
    expect(anbieterFuer).toHaveBeenCalledTimes(1);
    const [s, eLauf] = anbieterFuer.mock.calls[0] as unknown as [Schluessel, typeof e];
    expect(s.mistral).toBe("test");
    expect(eLauf.modelle).toMatchObject({ vorverarbeitung: "mistral-small-2603", verdichtung: "mistral-medium-3-5", reparatur: "mistral-small-2603" });
    expect(eLauf.mistralEndpunkt).toBe("global");
    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(/^KI-LEAD_Vergleichslauf_Ilka_mistral-medium-3-5-[a-z]+_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    expect(JSON.parse(await zip.file("reihe.json")!.async("string")).laeufe).toHaveLength(3);
    expect(document.querySelectorAll(".vergleichslauf tbody tr")).toHaveLength(3);
    expect(text()).toContain("3 von 3 Läufen, technisch bestanden (T1–T8): 3");
    await klick("ZIP herunterladen");
    expect(downloads.liste).toHaveLength(2);
  });

  it("AV-2026-W43-04: Variante des Plans standardprofile-ilka wählen, ohne die Einstellungen zu ändern", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(VergleichslaufAbschnitt, { profil, einstellungen: STANDARD, schluessel: { ...OHNE, anthropic: "x" } }));
    const auswahl = document.querySelector(".vergleichslauf select") as HTMLSelectElement;
    expect([...auswahl.options].map((o) => o.value)).toEqual([
      "",
      "standardprofile-ilka/A-anthropic-standard",
      "standardprofile-ilka/B-anthropic-sonnet",
      "standardprofile-ilka/C-openai-standard",
      "standardprofile-ilka/D-openai-astra-hoch",
      "standardprofile-ilka/E-mistral-standard",
      "standardprofile-ilka/F-mistral-large",
      "anbietermix-ilka/M1-luna-opus",
      "anbietermix-ilka/M2-luna-sonnet",
    ]);
    await act(async () => {
      auswahl.value = "standardprofile-ilka/F-mistral-large";
      auswahl.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(text()).toContain("S2 Verdichtung: mistral-large-4 (hoch) · Mistral");
    expect(text()).toContain("S3 Reparatur: mistral-small-2603 (niedrig) · Mistral");
    expect(text()).toContain("fehlt der Schlüssel für Mistral");
    expect(knopf("Vergleichslauf starten")?.disabled).toBe(true);
  });

  it("AV-2026-W43-23, -24: Mix-Variante M1 mit S1 OpenAI, S2 Anthropic und Reparatur Sonnet; fehlender OpenAI-Schlüssel gemeldet", async () => {
    const profil = await profilPflicht("lead-beispiel");
    await einhaengen(React.createElement(VergleichslaufAbschnitt, { profil, einstellungen: STANDARD, schluessel: { ...OHNE, anthropic: "x" } }));
    const auswahl = document.querySelector(".vergleichslauf select") as HTMLSelectElement;
    expect([...auswahl.querySelectorAll("optgroup")].map((g) => g.label)).toEqual(["Bewertungsplan standardprofile-ilka", "Bewertungsplan anbietermix-ilka"]);
    await act(async () => {
      auswahl.value = "anbietermix-ilka/M1-luna-opus";
      auswahl.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(text()).toContain("S1: gpt-6-luna (hoch) · OpenAI");
    expect(text()).toContain("S2 Verdichtung: claude-opus-5-5 (mittel) · Anthropic");
    expect(text()).toContain("S3 Reparatur: claude-sonnet-5-5 (niedrig) · Anthropic");
    expect(text()).toContain("Die Varianten kombinieren Anbieter je Stufe");
    expect(text()).toContain("fehlt der Schlüssel für OpenAI");
    expect(knopf("Vergleichslauf starten")?.disabled).toBe(true);
  });
});
