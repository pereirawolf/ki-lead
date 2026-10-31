// @vitest-environment jsdom
// Betreiberbuild in der Oberfläche (seit 0.6.17, TP-2026-W44-48 bis -50): nur freigegebene Anbieter in Übersicht,
// „KI-Anbieter & API“ und KI-Profilen, Karte des Endpunkts der Stelle ohne änderbare Adresse, Angaben unter „Über“,
// Vorgabe der Schlüsselablage und Laufprotokoll. Der öffentliche Build bleibt unverändert (übrige Tests).
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as import("../support/speicher").SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));
import { betriebFuerTests, betriebPruefen } from "../../src/anbieter/betrieb";
import { LEERE_SCHLUESSEL } from "../../src/anbieter/verteiler";
import { neuerLauf } from "../../src/pipeline/lauf";
import { STANDARD } from "../../src/pipeline/einstellungen";
import { ablageLesen, ablageVorgabe } from "../../src/schluessel/ablage";
import { EinstellungenAnsicht, type EinstellungsBereich } from "../../src/ui/Einstellungen";
import { profilPflicht } from "../support/dateien";
import { aushaengen, einhaengen, reactUmgebung } from "../support/dom";

const PROBE = betriebPruefen({
  format: "ki-lead-betrieb/1",
  bezeichnung: "Probe: Endpunkt der Stelle über Mistral EU",
  anbieter: ["stelle"],
  stelle: { name: "KI-Dienst Probe", basisUrl: "https://api.eu.mistral.ai/v1", modell: "mistral-small-2603" },
  schluesselablage: "sitzung",
});
const SHA = "ab".repeat(32);

beforeAll(reactUmgebung);
afterEach(async () => {
  betriebFuerTests(null);
  await aushaengen();
  speicher.werte.clear();
});

async function zeige(bereich: EinstellungsBereich) {
  await einhaengen(
    React.createElement(EinstellungenAnsicht, {
      profil: null,
      einstellungen: STANDARD,
      setEinstellungen: () => {},
      schluessel: LEERE_SCHLUESSEL,
      setSchluessel: () => {},
      bereich,
      setBereich: () => {},
    }),
  );
}
const text = () => document.body.textContent ?? "";
const schluesselTitel = () => [...document.querySelectorAll(".einstellung-block h3")].map((h) => h.textContent);

describe("TP-2026-W44-48, -49: Betreiberbuild nur mit dem Endpunkt der Stelle", () => {
  it("„KI-Anbieter & API“: nur die Karte des Endpunkts, Adresse aus der Konfiguration, kein Ollama", async () => {
    betriebFuerTests({ konfiguration: PROBE, sha256: SHA });
    await zeige("anbieter");
    expect(schluesselTitel()).toEqual(["API-Schlüssel (Endpunkt der Stelle)"]);
    expect(text()).toContain("Schlüssel für „KI-Dienst Probe“, vergeben von der Stelle. Die App schickt ihn nur an api.eu.mistral.ai.");
    expect(text()).toContain("https://api.eu.mistral.ai/v1, Modell mistral-small-2603. Adresse und Modell sind in der App nicht änderbar.");
    expect(text()).not.toMatch(/Ollama|Claude Console|Mistral Console/);
  });

  it("KI-Profile: Vorgaben, Endpunkt der Stelle, eigene Kombination; keine Mix-Profile", async () => {
    betriebFuerTests({ konfiguration: PROBE, sha256: SHA });
    await zeige("modelle");
    const werte = [...document.querySelectorAll('input[name="voreinstellung"]')].map((i) => (i as HTMLInputElement).value);
    expect(werte).toEqual(["profil", "stelle", "individuell"]);
    // Ohne eigene Wahl folgen alle Aufgaben dem Modell der Stelle
    expect(text()).toContain("stelle:mistral-small-2603");
    expect(text()).not.toContain("claude-");
  });

  it("Übersicht: Betreiberkonfiguration statt Mistral-Endpunkt und Ollama; nur der freigegebene Anbieter in der Tabelle", async () => {
    betriebFuerTests({ konfiguration: PROBE, sha256: SHA });
    await zeige("uebersicht");
    const dt = [...document.querySelectorAll(".uebersicht-liste dt")].map((d) => d.textContent);
    expect(dt).toContain("Betreiberkonfiguration");
    expect(dt).not.toContain("Mistral-Endpunkt");
    expect(dt).not.toContain("Ollama (lokal)");
    const zeilen = [...document.querySelectorAll("table.tabelle")][0]!.querySelectorAll("tbody tr");
    expect([...zeilen].map((z) => z.querySelector("td")?.textContent)).toEqual(["Endpunkt der Stelle"]);
  });

  it("Über KI-LEAD: Bezeichnung, Verbindungsziele und Prüfsumme der Konfiguration; öffentlich ohne diesen Hinweis", async () => {
    await zeige("ueber");
    expect(text()).not.toContain("Betreiberbuild");
    await aushaengen();
    betriebFuerTests({ konfiguration: PROBE, sha256: SHA });
    await zeige("ueber");
    expect(text()).toContain(`Betreiberbuild „Probe: Endpunkt der Stelle über Mistral EU“. Verbindungen nur zu: https://api.eu.mistral.ai.`);
    expect(text()).toContain(SHA);
  });
});

describe("TP-2026-W44-50: Vorgabe der Schlüsselablage", () => {
  it("öffentlich der Gerätespeicher; im Betreiberbuild die Vorgabe der Konfiguration, eine gespeicherte Wahl geht vor", async () => {
    expect(ablageVorgabe()).toBe("geraet");
    expect(await ablageLesen()).toBe("geraet");
    betriebFuerTests({ konfiguration: PROBE, sha256: SHA });
    expect(ablageVorgabe()).toBe("sitzung");
    expect(await ablageLesen()).toBe("sitzung");
    speicher.werte.set("schluessel-ablage", "geraet");
    expect(await ablageLesen()).toBe("geraet");
  });

  it("„system“ gilt im Browser nicht; dann der Gerätespeicher", () => {
    betriebFuerTests({ konfiguration: { ...PROBE, schluesselablage: "system" }, sha256: SHA });
    expect(ablageVorgabe()).toBe("geraet");
  });
});

describe("TP-2026-W44-48: Laufprotokoll", () => {
  it("nennt Bezeichnung und Prüfsumme der Betreiberkonfiguration, im öffentlichen Build nichts", async () => {
    const profil = await profilPflicht("lead-beispiel");
    const auftrag = {} as Parameters<typeof neuerLauf>[1];
    expect(neuerLauf(profil, auftrag, [])).not.toHaveProperty("betrieb");
    betriebFuerTests({ konfiguration: PROBE, sha256: SHA });
    expect(neuerLauf(profil, auftrag, []).betrieb).toEqual({ bezeichnung: PROBE.bezeichnung, sha256: SHA });
  });
});
