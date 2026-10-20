// @vitest-environment jsdom
// Redaktionscheck in der Oberfläche: Echtzeit und Stichtag, Uhrzeit der Ausgabe, Abdeckung, Sprungmarken,
// Folgeaktion zur Meldung, Redaktionsbericht (Review „KI-LEAD_Redaktionscheck_Review_2026-10-20“, RC02, RV01, RV04–RV07).

import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import React, { act } from "react";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { aushaengen, bisWahr, einhaengen, eingeben, klick, knopf, reactUmgebung } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { zeitpunktInZone } from "../../src/kern/zeit";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));
const downloads = vi.hoisted(() => [] as { inhalt: string; name: string }[]);
vi.mock("../../src/speicher/speicher", async (original) => ({
  ...(await original<typeof import("../../src/speicher/speicher")>()),
  dateiAnbieten: (inhalt: string, name: string) => void downloads.push({ inhalt, name }),
}));

let p: any;
let basis: any;
beforeAll(async () => {
  reactUmgebung();
  p = (await profil("lead-beispiel")).profil!;
  basis = ilkaMeldung("Bund");
});
beforeEach(() => {
  // Nur Uhr und Intervalle gefälscht: bisWahr wartet über setTimeout und läuft weiter
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(zeitpunktInZone(2026, 10, 20, 8, 0, "Europe/Berlin"));
  speicherLeeren(db);
  downloads.length = 0;
});
afterEach(async () => {
  await aushaengen();
  vi.useRealTimers();
});

function ablegen(meldungen: { id: string; text: string; tendenz?: string }[], naechsteAusgabe = "2026-10-23") {
  const dateien = meldungen.map(({ id, text, tendenz }) => {
    const d = structuredClone(basis);
    d._status = "final";
    d.sachverhalte = [d.sachverhalte[0]];
    d.meldende_stelle = "Stelle " + id;
    const sv = d.sachverhalte[0];
    sv.sofort.bewertung_text = text;
    sv.sofort.beurteilung = "geringfügig";
    sv.sofort.tendenz = tendenz || "Stabilisierung";
    sv.art = ["Stromausfall / Blackout"];
    d.quellen = "[Q1] A – Teststelle (20.10.2026): Lage [Zugriff: 20.10.2026]";
    return { name: id + ".json", text: JSON.stringify(d), importiertAm: "2026-10-20T06:00:00Z" };
  });
  db.werte.set("lagebild:" + p.manifest.id, { dateien, naechsteAusgabe });
}

const gespeichert = () => db.werte.get("lagebild:" + p.manifest.id);

/** Zeigt das Lagebild und wartet, bis der gespeicherte Stand geladen ist */
async function zeige() {
  const { LagebildAnsicht } = await import("../../src/ui/Lagebild");
  await einhaengen(React.createElement(LagebildAnsicht, { profil: p, uebergeben: () => {}, oeffnen: () => {} }));
  const namen = gespeichert().dateien.map((d: any) => d.name);
  await bisWahr(() => namen.every((n: string) => document.body.textContent!.includes(n)));
}
const beginntMit = (text: string) => new RegExp("^" + text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
async function redaktionscheck() {
  await klick(knopf(beginntMit("Redaktionscheck")));
  await bisWahr(() => document.querySelector(".lb-redaktion") !== null);
}
const redaktion = () => document.querySelector(".lb-redaktion")!.textContent || "";

it("RC02: eine Frist wird nach Ablauf ohne Dateiänderung neu eingestuft", async () => {
  ablegen([{ id: "a", text: "Handlungsrelevant bis: 20.10.2026 09:00" }]);
  await zeige();
  await redaktionscheck();
  expect(redaktion()).toContain("vor der nächsten Ausgabe – frühere Weitergabe prüfen");
  await act(async () => {
    vi.setSystemTime(zeitpunktInZone(2026, 10, 20, 10, 0, "Europe/Berlin"));
    vi.advanceTimersByTime(30_000);
  });
  expect(redaktion()).toContain("Zeitfenster abgelaufen – Aktualität prüfen");
});

it("RC02: ein Stichtag hält die Einstufung fest und wird gespeichert", async () => {
  ablegen([{ id: "a", text: "Handlungsrelevant bis: 20.10.2026 09:00" }]);
  await zeige();
  await redaktionscheck();
  const stichtag = [...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')][1];
  await klick(stichtag);
  await bisWahr(() => gespeichert().pruefstand === "2026-10-20T08:00");
  await act(async () => {
    vi.setSystemTime(zeitpunktInZone(2026, 10, 20, 10, 0, "Europe/Berlin"));
    vi.advanceTimersByTime(60_000);
  });
  expect(redaktion()).toContain("vor der nächsten Ausgabe");
  expect(redaktion()).toContain("fester Stichtag");
  expect(redaktion()).toContain("Stichtag aktiv");
  expect(document.querySelector(".lb-stichtag-marke")).toBeTruthy();
  expect(gespeichert().pruefstand).toBe("2026-10-20T08:00");
});

it("RV01: Uhrzeit der Ausgabe macht aus „Tag der Ausgabe“ eine eindeutige Einstufung und wird gespeichert", async () => {
  ablegen([{ id: "a", text: "Handlungsrelevant bis: 23.10.2026 12:00" }]);
  await zeige();
  await redaktionscheck();
  expect(redaktion()).toContain("am Tag der nächsten Ausgabe; deren Uhrzeit ist nicht angegeben");
  const zeit = document.querySelector<HTMLInputElement>('input[type="time"]')!;
  await eingeben(zeit, "15:00");
  await bisWahr(() => gespeichert().naechsteAusgabe === "2026-10-23T15:00");
  expect(redaktion()).toContain("vor der nächsten Ausgabe – frühere Weitergabe prüfen");
  expect(gespeichert().naechsteAusgabe).toBe("2026-10-23T15:00");
});

it("RV04, RV06: Übersicht nach Einstufung, Abdeckung und Sprungmarken mit Trefferzahl", async () => {
  ablegen([
    { id: "a", text: "Handlungsrelevant bis: 21.10.2026 12:00", tendenz: "Entspannung" },
    { id: "b", text: "", tendenz: "Verschärfung" },
  ]);
  await zeige();
  await redaktionscheck();
  const uebersicht = document.querySelector(".lb-red-uebersicht")!.textContent!;
  expect(uebersicht).toMatch(/1 zeitkritisch · \d+ zu klären/);
  expect(uebersicht).toContain("Ausgewertet: 2 Meldungen nach dem Schema des Profils");
  const sprung = [...document.querySelectorAll(".lb-red-sprung a")].map((a) => a.textContent);
  expect(sprung[0]).toBe("1 Zeitfenster (1)");
  expect(sprung[1]).toBe("2 Zusammenhang und abweichende Bewertungen (1)");
  expect(redaktion()).toContain("Tendenzen gegenläufig");
  expect(redaktion()).toContain("Formale Vollständigkeit bei „kritisch“ / „erheblich“");
});

it("RV05: vom Befund zur Meldung in der Liste, ohne die Meldungsmaske zu berühren", async () => {
  ablegen([{ id: "a", text: "Handlungsrelevant bis: 20.10.2026 09:00" }]);
  await zeige();
  await redaktionscheck();
  await klick(knopf(beginntMit("Meldung in der Liste zeigen")));
  await bisWahr(() => document.querySelector(".lb-karte-markiert") !== null);
  const karte = document.querySelector(".lb-karte-markiert");
  expect(karte?.id).toMatch(/^lb-meldung-/);
  expect(karte?.textContent).toContain("a.json");
});

it("RV07: Redaktionsbericht und präzise Exportbeschriftungen", async () => {
  ablegen([{ id: "a", text: "Handlungsrelevant bis: 20.10.2026 09:00" }]);
  await zeige();
  expect([...document.querySelectorAll("button")].map((b) => b.textContent?.trim())).toEqual(
    expect.arrayContaining(["Lagebild als PDF", "Rohtabelle als CSV"]),
  );
  await redaktionscheck();
  await klick(knopf(beginntMit("Redaktionsbericht (JSON)")));
  await bisWahr(() => downloads.length === 1);
  const j = JSON.parse(downloads[0].inhalt);
  expect(downloads[0].name).toBe("2026-10-20T08-00_Redaktionsbericht_Lagebild.json");
  expect(j.pruefstand.geprueft_fuer).toBe("20.10.2026, 08:00 Uhr");
  expect(j.befunde[0].einstufung).toBe("zeitkritisch");
});
