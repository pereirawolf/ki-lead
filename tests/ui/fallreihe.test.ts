// @vitest-environment jsdom
// Fallreihe unter „Einstellungen → Testläufe“ (seit 0.7.1, TP-2026-W44-62 bis -67): Auswahl der Fälle, Fallpaket mit
// Prüfsumme und Ablage auf dem Gerät, Vorbelegung aus dem Plan, Start mit einem Klick, Kostenbremse, ZIP und Archiv.
// Mit Anbieterattrappe, ohne KI-Aufrufe.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import JSZip from "jszip";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { leseOrdner, profilPflicht, repoPfad } from "../support/dateien";
import { aushaengen, bisWahr, dialogAntwort, einhaengen, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { llmAntwort, meldungsAntwort } from "../support/anbieter";
import { STANDARD } from "../../src/pipeline/einstellungen";
import type { LlmAnbieter } from "../../src/anbieter/typen";
import type { Schluessel } from "../../src/anbieter/verteiler";

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: Blob }[] }));
const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as import("../support/speicher").SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));
vi.mock("../../src/speicher/speicher", async (orig) => {
  const echt = await orig<typeof import("../../src/speicher/speicher")>();
  return { ...echt, dateiAnbieten: (inhalt: Blob, name: string) => void downloads.liste.push({ name, inhalt }) };
});

import { FallreiheAbschnitt, type KatalogDaten } from "../../src/ui/Fallreihe";
import { faelleAusTexten } from "../../src/forschung/fallkatalog";
import { speicherLeeren } from "../support/speicher";

beforeAll(reactUmgebung);
afterEach(async () => {
  downloads.liste = [];
  speicherLeeren(speicher);
  vi.restoreAllMocks();
  await aushaengen();
});

const MIT: Schluessel = { anthropic: "sk-ant-test", openai: "", mistral: "", stelle: "" };
const OHNE: Schluessel = { anthropic: "", openai: "", mistral: "", stelle: "" };
const REFERENZ = "beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
const lies = (p: string) => readFileSync(repoPfad(p), "utf-8");
const sha = (b: Uint8Array | string) => createHash("sha256").update(b).digest("hex");
const FAELLE = ["sop-gas-stabil", "sop-sturm-nachlauf", "pruefstein-wiesbaden-abkochgebot", "ilka-reparatur"];

function katalog(): () => Promise<KatalogDaten> {
  const faelle = faelleAusTexten(Object.fromEntries(FAELLE.map((id) => [id, lies(`evaluation/faelle/${id}.json`)])));
  const material: Record<string, string> = {};
  for (const f of faelle) for (const m of f.material) if (m.datei) material[m.datei] = lies(m.datei);
  return async () => ({
    faelle,
    material,
    profile: { "lead.beispiel.koordinierungsstelle": { name: "LEAD-Beispiel" } },
    profilLaden: async () => profilPflicht("lead-beispiel"),
  });
}

function attrappe(kostenJeAufruf = 0.01): LlmAnbieter {
  const referenz = JSON.parse(leseOrdner(repoPfad("profile", "lead-beispiel"))[REFERENZ]!);
  return {
    id: "attrappe",
    async senden(a) {
      if (a.jsonSchema)
        return llmAntwort(
          JSON.stringify({
            gegenstand: "Lage",
            stichtag: "2026-10-21",
            meldezeitpunkt: "2026-10-21T12:00",
            referenzbezug: "Bund",
            horizont: "",
            sachverhalte: [{ titel: "Lage", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "" }],
            prueffrage: "",
            hinweise: "",
          }),
          { kostenUsd: kostenJeAufruf },
        );
      return meldungsAntwort(referenz, "Kurz.", { kostenUsd: kostenJeAufruf });
    },
  };
}

async function anzeigen(schluessel = MIT, anbieter: LlmAnbieter = attrappe()) {
  await einhaengen(
    React.createElement(FallreiheAbschnitt, {
      einstellungen: { ...STANDARD, forschung: true, nachforderung: false },
      schluessel,
      katalogLaden: katalog(),
      anbieterFuer: () => anbieter,
    }),
  );
  await bisWahr(() => seitentext().includes("SOP-Fälle"));
}

const abschnitt = () => document.querySelector('[aria-labelledby="fallreihe-titel"]') as HTMLElement;
const kaestchen = (teil: string) =>
  [...abschnitt().querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find((i) => i.closest("label")?.textContent?.includes(teil))!;
const feld = (label: string) =>
  [...abschnitt().querySelectorAll("label")].find((l) => l.querySelector(".feld-label")?.textContent === label)!.querySelector("input, select") as
    HTMLInputElement | HTMLSelectElement;

async function dateiWaehlen(id: string, datei: File) {
  const input = document.getElementById(id) as HTMLInputElement;
  Object.defineProperty(input, "files", { value: [datei], configurable: true });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function paketZip(): Promise<Uint8Array> {
  const zip = new JSZip();
  const fall = {
    format: "ki-lead-evaluationsfall/1",
    id: "k1-test",
    titel: "Kontrollfall K1 (FIKTIV)",
    stand: "2026-11-03",
    fiktiv: true,
    auftrag: { sachverhalt: "Fiktive Lage", stichtag: "2026-11-03", meldezeitpunkt: "2026-11-03T12:00", websuche: false },
    material: [{ datei: "evaluation/material/k1-test.md", rolle: "material" }],
    erwartungen: { muss: ["Fiktive Lage erfasst."] },
  };
  zip.file("kontrollsatz/faelle/k1-test.json", JSON.stringify(fall));
  zip.file("kontrollsatz/evaluation/material/k1-test.md", "FIKTIVES ÜBUNGSMATERIAL – keine reale Lage");
  return zip.generateAsync({ type: "uint8array" });
}

describe("Fallreihe: Auswahl (TP-2026-W44-62)", () => {
  it("TP-2026-W44-62: Fälle nach Gruppen, Prüfsteine mit Websuche, Reparaturfall gesperrt; Start erst mit Fall und Anbieter", async () => {
    await anzeigen();
    expect(abschnitt().querySelector("h3")?.textContent).toBe("Fallreihe");
    expect(seitentext()).toContain("Prüfsteine (reale Lagen, mit Websuche) (1)");
    expect(seitentext()).toContain("pruefstein-wiesbaden-abkochgebot · LEAD-Beispiel · Erfassung · mit Websuche");
    expect(kaestchen("ilka-reparatur").disabled).toBe(true);
    expect(seitentext()).toContain("ilka-reparatur · LEAD-Beispiel · Reparatur · Prüffall Reparatur: eigene Testart");
    expect(knopf("Fallreihe starten")!.disabled).toBe(true);
    expect(seitentext()).toContain("Kein Fall gewählt.");
    await act(async () => kaestchen("sop-gas-stabil").click());
    await act(async () => kaestchen("Anthropic").click());
    expect(seitentext()).toContain("1 Lauf (1 × 1 × 1)");
    expect(knopf("Fallreihe starten")!.disabled).toBe(false);
  });

  it("TP-2026-W44-62: ohne Schlüssel nicht startbar, mit Hinweis auf den Anbieter", async () => {
    await anzeigen(OHNE);
    await act(async () => kaestchen("sop-gas-stabil").click());
    await act(async () => kaestchen("Anthropic").click());
    expect(seitentext()).toContain("Für die Fallreihe fehlt der Schlüssel für Anthropic");
    expect(knopf("Fallreihe starten")!.disabled).toBe(true);
  });
});

describe("Fallreihe: Fallpaket (TP-2026-W44-63)", () => {
  it("TP-2026-W44-63: Import zeigt die SHA-256 der ZIP-Datei, legt das Paket auf dem Gerät ab und löscht es nach Rückfrage", async () => {
    await anzeigen();
    const zip = await paketZip();
    await dateiWaehlen("fallreihe-paket", new File([zip as BlobPart], "kontrollsatz.zip", { type: "application/zip" }));
    await bisWahr(() => seitentext().includes("kontrollsatz.zip importiert: 1 Fall, auf diesem Gerät gespeichert bis zur Löschung."));
    expect(abschnitt().querySelector('[aria-label="Fallpakete"]')?.textContent).toContain(`SHA-256 ${sha(zip)}`);
    expect(seitentext()).toContain("Fallpaket (1)");
    expect(kaestchen("k1-test").disabled).toBe(false);
    expect(speicher.werte.has(`fallpaket:${sha(zip)}`)).toBe(true);
    dialogAntwort(true);
    await klick("Löschen", abschnitt().querySelector('[aria-label="Fallpakete"]')!);
    await bisWahr(() => seitentext().includes("kontrollsatz.zip gelöscht."));
    expect(speicher.werte.has(`fallpaket:${sha(zip)}`)).toBe(false);
    expect(seitentext()).not.toContain("Fallpaket (1)");
  });

  it("TP-2026-W44-63: ein gespeichertes Paket steht nach dem Neuladen wieder zur Wahl", async () => {
    const zip = await paketZip();
    speicher.werte.set(`fallpaket:${sha(zip)}`, { name: "kontrollsatz.zip", sha256: sha(zip), importiert: "2026-11-03T10:00:00.000Z", zip });
    await anzeigen();
    await bisWahr(() => seitentext().includes("Fallpaket (1)"));
    expect(seitentext()).toContain(`kontrollsatz.zip: 1 Fall, SHA-256 ${sha(zip)}`);
  });
});

describe("Fallreihe: Plan, Start, Kostenbremse (TP-2026-W44-64, -65, -66)", () => {
  const plan = (x: object = {}) =>
    JSON.stringify({
      format: "ki-lead-bewertungsplan/1",
      id: "test-b5",
      stand: "2026-11-03",
      fragestellung: "Test",
      faelle: ["sop-gas-stabil", "sop-sturm-nachlauf"],
      varianten: [{ kennung: "anthropic", ki_profil: "anthropic" }],
      wiederholungen: 2,
      budget_usd: 12.5,
      recherche: "sparsam",
      ...x,
    });

  it("TP-2026-W44-64: Plan belegt Fälle, Varianten, Wiederholungen, Recherche und Deckel vor und zeigt seine Prüfsumme", async () => {
    await anzeigen();
    const text = plan();
    await dateiWaehlen("fallreihe-plan", new File([text], "test-b5.json", { type: "application/json" }));
    await bisWahr(() => seitentext().includes(`Plan test-b5 (test-b5.json), SHA-256 ${sha(text)}`));
    expect(kaestchen("sop-gas-stabil").checked).toBe(true);
    expect(kaestchen("sop-sturm-nachlauf").checked).toBe(true);
    expect(kaestchen("anthropic: Standardprofil Anthropic").checked).toBe(true);
    expect(feld("Wiederholungen je Fall und Variante").value).toBe("2");
    expect(feld("Recherchetiefe (Fälle mit Websuche)").value).toBe("sparsam");
    expect(feld("Kostendeckel (USD)").value).toBe("12.5");
    expect(seitentext()).toContain("4 Läufe (2 × 1 × 2)");
    expect(seitentext()).not.toContain("Auswahl weicht vom Plan ab");
    await act(async () => kaestchen("sop-sturm-nachlauf").click());
    expect(seitentext()).toContain("Auswahl weicht vom Plan ab");
  });

  it("TP-2026-W44-64: Plan mit Fallpaket ohne passendes Paket sperrt den Start; fehlerhafter Plan zeigt den Grund", async () => {
    await anzeigen();
    await dateiWaehlen("fallreihe-plan", new File([plan({ faelle: ["k1-test"], fallpaket: { sha256: "a".repeat(64) } })], "b4.json"));
    await bisWahr(() => seitentext().includes("Fälle fehlen: k1-test"));
    expect(knopf("Fallreihe starten")!.disabled).toBe(true);
    await dateiWaehlen("fallreihe-plan", new File(['{"format":"x"}'], "x.json"));
    await bisWahr(() => seitentext().includes("x.json: kein Bewertungsplan"));
  });

  it("TP-2026-W44-65, -66: ein Klick startet alle Läufe; Kostenbremse; ZIP mit Übersicht und Vorlagen; Eintrag im Archiv", async () => {
    // 1 USD je Aufruf, zwei Aufrufe je Lauf: 2 USD; Deckel 3 → der zweite Lauf würde ihn überschreiten
    await anzeigen(MIT, attrappe(1));
    await dateiWaehlen("fallreihe-plan", new File([plan({ wiederholungen: 1, budget_usd: 3 })], "test-b5.json"));
    await bisWahr(() => seitentext().includes("2 Läufe (2 × 1 × 1)"));
    await klick("Fallreihe starten");
    await bisWahr(() => seitentext().includes("Fallreihe beendet"));
    // nächster Lauf: obere Schätzung der App für Anthropic, mindestens die 2 USD des ersten Laufs
    expect(seitentext()).toMatch(/Fallreihe beendet: 1 von 2 Läufen \(Kostenbremse vor Lauf 2: bisher 2 USD, nächster Lauf bis \d+(,\d+)? USD, Deckel 3 USD\)/);
    expect(downloads.liste).toHaveLength(1);
    expect(downloads.liste[0]!.name).toMatch(/^KI-LEAD_Fallreihe_test-b5_\d{8}-\d{4}\.zip$/);
    const zip = await JSZip.loadAsync(await downloads.liste[0]!.inhalt.arrayBuffer());
    const reihe = JSON.parse(await zip.file("fallreihe.json")!.async("string"));
    expect(reihe.plan).toEqual({ id: "test-b5", name: "test-b5.json", sha256: sha(plan({ wiederholungen: 1, budget_usd: 3 })) });
    expect([reihe.recherche, reihe.budget_usd, reihe.laeufe.length]).toEqual(["sparsam", 3, 1]);
    expect(zip.file("bewertungen/E001.bewertung.json")).toBeTruthy();
    expect(zip.file("bewertungen/E001.pruefliste.md")).toBeTruthy();
    expect(zip.file("uebersicht.csv")).toBeTruthy();
    const eintraege = [...speicher.werte.entries()].filter(([k]) => String(k).startsWith("eintrag:")).map(([, v]) => v);
    expect(eintraege).toHaveLength(1);
    expect(eintraege[0]).toMatchObject({
      art: "fallreihe",
      titel: "Fallreihe",
      laeufe: 1,
      geplant: 2,
      kostenUsd: 2,
      konfiguration: "Plan test-b5 · 2 Fälle · anthropic",
    });
  });
});
