// Betreiberkonfiguration (seit 0.6.17, TP-2026-W44-48): Prüfung der Datei, Schema gegen Ajv, connect-src aus derselben
// Quelle wie die Adressprüfung der Adapter, öffentlicher Build unverändert, Freigabe der Anbieter, Vorgaben im Betreiberbuild.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  betrieb,
  betriebFuerTests,
  betriebPruefen,
  connectSrc,
  cspEinsetzen,
  OEFFENTLICH,
  verbindungsziele,
  ZIELE,
  type Betrieb,
} from "../../src/anbieter/betrieb";
import { ANTHROPIC_URL } from "../../src/anbieter/anthropic";
import { MISTRAL_EU_URL, MISTRAL_URL } from "../../src/anbieter/mistral";
import { OLLAMA_STANDARD_URL, ollamaAdresseZulaessig } from "../../src/anbieter/ollama";
import { OPENAI_BASIS_URL } from "../../src/anbieter/openai";
import { stelleAdresseZulaessig } from "../../src/anbieter/stelle";
import { freigegebeneAnbieter, LEERE_SCHLUESSEL, Verteiler } from "../../src/anbieter/verteiler";
import { appModell, freigegebeneMixe, modellFuer, modellGruppen, modellHerkunft, STANDARD } from "../../src/pipeline/einstellungen";
import { ajvGueltig } from "../support/ajv";
import { REPO } from "../support/dateien";

const ORDNER = join(REPO, "betrieb");
const SCHEMA = JSON.parse(readFileSync(join(ORDNER, "betrieb.schema.json"), "utf-8"));
const lies = (name: string) => JSON.parse(readFileSync(join(ORDNER, name), "utf-8"));
const PROBE = betriebPruefen(lies("probe-mistral-eu.json"));
const BEISPIEL = betriebPruefen(lies("beispiel-stelle.json"));
const imBuild = (k: Betrieb) => ({ konfiguration: k, sha256: "0".repeat(64) });

afterEach(() => betriebFuerTests(null));

describe("TP-2026-W44-48: Prüfung der Betreiberkonfiguration", () => {
  it("die mitgelieferten Beispiele sind gültig, nach eigener Prüfung und nach dem Schema", () => {
    const dateien = readdirSync(ORDNER).filter((n) => n.endsWith(".json") && n !== "betrieb.schema.json");
    expect(dateien.sort()).toEqual(["beispiel-stelle.json", "probe-mistral-eu.json"]);
    for (const n of dateien) {
      expect(() => betriebPruefen(lies(n)), n).not.toThrow();
      expect(ajvGueltig(SCHEMA, lies(n)), n).toBe(true);
    }
  });

  const gut = {
    format: "ki-lead-betrieb/1",
    bezeichnung: "Test",
    anbieter: ["stelle"],
    stelle: { basisUrl: "https://ki.example.de/v1/", modell: "m-1" },
  };
  const falsch: [string, unknown, RegExp][] = [
    ["kein Objekt", [], /kein JSON-Objekt/],
    ["falsches Format", { ...gut, format: "ki-lead-betrieb/2" }, /format/],
    ["leere Bezeichnung", { ...gut, bezeichnung: " " }, /bezeichnung/],
    ["keine Anbieter", { ...gut, anbieter: [] }, /anbieter: Liste/],
    ["unbekannter Anbieter", { ...gut, anbieter: ["stelle", "gemini"] }, /unbekannt „gemini“/],
    ["doppelt", { ...gut, anbieter: ["stelle", "stelle"] }, /doppelt/],
    ["stelle ohne Abschnitt", { format: gut.format, bezeichnung: "x", anbieter: ["stelle"] }, /Abschnitt „stelle“ fehlt/],
    ["Abschnitt ohne Freigabe", { ...gut, anbieter: ["mistral"] }, /ohne „stelle“ unter anbieter/],
    ["http", { ...gut, stelle: { ...gut.stelle, basisUrl: "http://ki.example.de/v1" } }, /basisUrl/],
    ["Abfrage", { ...gut, stelle: { ...gut.stelle, basisUrl: "https://ki.example.de/v1?x=1" } }, /basisUrl/],
    ["Modell mit Leerzeichen", { ...gut, stelle: { ...gut.stelle, modell: "a b" } }, /stelle\.modell/],
    ["Preise unvollständig", { ...gut, stelle: { ...gut.stelle, preise: { eingabe: 1 } } }, /stelle\.preise/],
    ["negative Preise", { ...gut, stelle: { ...gut.stelle, preise: { eingabe: -1, ausgabe: 1 } } }, /stelle\.preise/],
    ["unbekanntes Feld", { ...gut, extra: 1 }, /unbekanntes Feld „extra“/],
    ["unbekanntes Feld in stelle", { ...gut, stelle: { ...gut.stelle, kopf: {} } }, /stelle: unbekanntes Feld „kopf“/],
    ["Ablage", { ...gut, schluesselablage: "tresor" }, /schluesselablage/],
  ];
  it.each(falsch)("weist ab: %s (eigene Prüfung und Schema)", (_n, daten, meldung) => {
    expect(() => betriebPruefen(daten)).toThrow(meldung);
    expect(ajvGueltig(SCHEMA, daten)).toBe(false);
  });

  it("bereinigt die Basisadresse und übernimmt nur bekannte Felder", () => {
    expect(betriebPruefen({ ...gut, schluesselablage: "sitzung" })).toEqual({
      format: "ki-lead-betrieb/1",
      bezeichnung: "Test",
      anbieter: ["stelle"],
      stelle: { basisUrl: "https://ki.example.de/v1", modell: "m-1" },
      schluesselablage: "sitzung",
    });
    expect(ajvGueltig(SCHEMA, gut)).toBe(true);
  });
});

describe("TP-2026-W44-48: Content-Security-Policy aus derselben Quelle wie die Adapter", () => {
  const indexHtml = readFileSync(join(REPO, "index.html"), "utf-8");

  it("öffentlicher Build: das Plugin lässt index.html unverändert, die Policy nennt genau die bisherigen Ziele", () => {
    expect(cspEinsetzen(indexHtml, OEFFENTLICH)).toBe(indexHtml);
    expect(connectSrc(OEFFENTLICH)).toBe(
      "connect-src 'self' https://api.anthropic.com https://api.openai.com https://api.eu.mistral.ai https://api.mistral.ai http://localhost:11434 http://127.0.0.1:11434",
    );
  });

  it("Probe Mistral EU: nur der Endpunkt der Stelle; die übrige Policy bleibt", () => {
    const html = cspEinsetzen(indexHtml, PROBE);
    expect(html).toContain("connect-src 'self' https://api.eu.mistral.ai;");
    expect(html.replace(/connect-src [^;]*/, "")).toBe(indexHtml.replace(/connect-src [^;]*/, ""));
  });

  it("Beispiel: Endpunkt der Stelle und Mistral, ohne Doppeltes", () => {
    expect(verbindungsziele(BEISPIEL)).toEqual(["https://api.eu.mistral.ai", "https://api.mistral.ai", "https://ki.example.de"]);
    expect(verbindungsziele({ ...PROBE, anbieter: ["mistral", "stelle"] })).toEqual(["https://api.eu.mistral.ai", "https://api.mistral.ai"]);
  });

  it("jede Adresse der Adapter liegt in den Zielen ihres Anbieters; die Adressprüfungen folgen der Konfiguration", () => {
    const herkunft = (u: string) => new URL(u).origin;
    expect(ZIELE.anthropic).toContain(herkunft(ANTHROPIC_URL));
    expect(ZIELE.openai).toContain(herkunft(OPENAI_BASIS_URL));
    expect(ZIELE.mistral).toEqual([herkunft(MISTRAL_EU_URL), herkunft(MISTRAL_URL)]);
    for (const z of ZIELE.ollama) expect(ollamaAdresseZulaessig(`${z}/v1`), z).toBe(true);
    expect(ZIELE.ollama).toContain(herkunft(OLLAMA_STANDARD_URL));
    // Endpunkt der Stelle: zulässig genau die konfigurierte Herkunft, im öffentlichen Build keine
    expect(stelleAdresseZulaessig("https://api.eu.mistral.ai/v1/chat/completions", PROBE)).toBe(true);
    expect(stelleAdresseZulaessig("https://api.mistral.ai/v1/chat/completions", PROBE)).toBe(false);
    expect(stelleAdresseZulaessig("http://api.eu.mistral.ai/v1/chat/completions", PROBE)).toBe(false);
    expect(stelleAdresseZulaessig("https://api.eu.mistral.ai/v1/chat/completions", OEFFENTLICH)).toBe(false);
    for (const b of [PROBE, BEISPIEL]) {
      const stelle = herkunft(b.stelle!.basisUrl);
      expect(verbindungsziele(b), b.bezeichnung).toContain(stelle);
    }
  });
});

describe("TP-2026-W44-48: Freigabe der Anbieter im Betreiberbuild", () => {
  it("öffentlich: vier Anbieter und beide Mix-Profile wie bisher", () => {
    expect(betrieb()).toBe(OEFFENTLICH);
    expect(freigegebeneAnbieter()).toEqual(["anthropic", "openai", "mistral", "ollama"]);
    expect(freigegebeneMixe()).toEqual(["mix-opus", "mix-sonnet"]);
    expect(appModell("verdichtung")).toBe("claude-opus-5-5");
  });

  it("nur der Endpunkt der Stelle: Vorgabe, Modellwahl und Herkunft folgen ihm; gewählte fremde Modelle gelten nicht", () => {
    betriebFuerTests(imBuild(PROBE));
    expect(freigegebeneAnbieter()).toEqual(["stelle"]);
    expect(freigegebeneMixe()).toEqual([]);
    expect(appModell("verdichtung")).toBe("stelle:mistral-small-2603");
    expect(modellGruppen(STANDARD)).toEqual([{ anbieter: "Endpunkt der Stelle", modelle: ["stelle:mistral-small-2603"] }]);
    const mitFremdem = { ...STANDARD, modelle: { ...STANDARD.modelle, verdichtung: "claude-opus-5-5" } };
    expect(modellFuer("verdichtung", mitFremdem, null)).toBe("stelle:mistral-small-2603");
    expect(modellHerkunft("verdichtung", mitFremdem, null)).toBe("app");
  });

  it("der Verteiler weist nicht freigegebene Anbieter ab, auch mit Schlüssel", async () => {
    const anfrage = { modell: "claude-haiku-5-5", maxTokens: 10, system: [], nachrichten: [{ role: "user" as const, content: "x" }] };
    betriebFuerTests(imBuild(PROBE));
    await expect(new Verteiler({ ...LEERE_SCHLUESSEL, anthropic: "a" }).senden(anfrage)).rejects.toThrow(
      /Anthropic \(claude-haiku-5-5\) ist in diesem Build nicht freigegeben \(Betreiberkonfiguration „Probe: Endpunkt der Stelle über Mistral EU“\)/,
    );
    betriebFuerTests(null);
    await expect(new Verteiler({ ...LEERE_SCHLUESSEL, stelle: "s" }).senden({ ...anfrage, modell: "stelle:m" })).rejects.toThrow(
      /Endpunkt der Stelle \(stelle:m\) ist in diesem Build nicht freigegeben/,
    );
  });
});
