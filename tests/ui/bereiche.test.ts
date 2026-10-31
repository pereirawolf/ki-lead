// @vitest-environment jsdom
// Bereiche und Ansprache der Oberfläche (seit 0.6.10, Entscheidung des Herausgebers vom 30.10.2026): Die Bereiche heißen
// nach den Arbeitsschritten der LEAD-Systematik „Erfassung“, „KI-Erfassung“ und „Auswertung“, jeweils mit einem parallel
// gebauten Kennsatz (OF-2026-W44-01, -02). Reiter, Überschrift und Kennsatz legt die App fest; das Profil benennt nur die
// Produkte, die in Ausgaben erscheinen („Meldung“, „Lagebild“) (OF-2026-W44-03). Die Oberfläche spricht Nutzende nicht
// persönlich an, weder mit „du“ noch mit „Sie“; die Arbeitsanweisungen an die KI-Modelle bleiben beim „du“ (OF-2026-W44-04).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil, repoPfad } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { lagebildAlsPdf, meldungAlsPdf } from "../../src/dokumente/pdf";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
  localStorage.clear();
  vi.restoreAllMocks();
  vi.resetModules();
});

/** Überschrift und Absätze im Kopf eines Bereichs */
function kopf(bereich: string): string[] {
  const t = document.querySelector(`.${bereich} .werkzeugleiste-text`);
  expect(t, `Kopf des Bereichs .${bereich}`).toBeTruthy();
  return [t!.querySelector("h1")?.textContent?.trim() ?? "", ...[...t!.querySelectorAll("p")].map((p) => p.textContent?.trim() ?? "")];
}

describe("OF-2026-W44-01, -02: Bereiche nach den Arbeitsschritten der LEAD-Systematik", () => {
  it("Navigation, Überschrift und Kennsatz je Bereich", async () => {
    const { default: App } = await import("../../src/App");
    await einhaengen(React.createElement(App));
    await bisWahr(() => expect(document.querySelector(".meldung .arbeitsbereich")).toBeTruthy());
    const nav = document.querySelector(".hauptnav")!;
    expect([...nav.querySelectorAll("button")].map((b) => b.textContent?.trim())).toEqual([
      "Erfassung",
      "KI-Erfassung",
      "Auswertung",
      "Profile",
      "Einstellungen",
    ]);

    expect(kopf("meldung")).toEqual(["Erfassung", "Erfassung einer Meldung nach LEAD-Systematik"]);

    await klick(knopf("KI-Erfassung", nav));
    await bisWahr(() => expect(document.querySelector(".ki .werkzeugleiste-text")).toBeTruthy());
    expect(kopf("ki")).toEqual(["KI-Erfassung", "Erfassung einer Meldung nach LEAD-Systematik mit KI-Unterstützung"]);

    await klick(knopf("Auswertung", nav));
    await bisWahr(() => expect(document.querySelector(".lagebild .werkzeugleiste-text")).toBeTruthy());
    expect(kopf("lagebild")).toEqual(["Auswertung", "Auswertung von Meldungen mehrerer Stellen nach LEAD-Systematik"]);
  });
});

describe("UX-2026-W44-14: aktives Profil im Seitenkopf der Arbeitsansichten", () => {
  it("Erfassung, KI-Erfassung und Auswertung nennen das aktive Profil mit Weg zu „Profile“, außerhalb des Kennsatzes", async () => {
    const { default: App } = await import("../../src/App");
    await einhaengen(React.createElement(App));
    await bisWahr(() => expect(document.querySelector(".meldung .arbeitsbereich")).toBeTruthy());
    const nav = document.querySelector(".hauptnav")!;
    const zeile = (bereich: string) => document.querySelector(`.${bereich} .profilzeile`);
    expect(zeile("meldung")?.textContent).toMatch(/^Profil: .+ \d+\.\d+\.\d+ · Profile$/);
    expect(zeile("meldung")?.querySelector("a")?.getAttribute("href")).toBe("#/profile");
    await klick(knopf("KI-Erfassung", nav));
    await bisWahr(() => expect(zeile("ki")).toBeTruthy());
    await klick(knopf("Auswertung", nav));
    await bisWahr(() => expect(zeile("lagebild")).toBeTruthy());
    expect(document.querySelector(".hauptnav ~ .kopf-rechts .profilzeile, .kopf .profilzeile")).toBeNull();
  });
});

describe("OF-2026-W44-03: Produkttitel aus dem Profil, Bereichsnamen aus der App", () => {
  it("Beispielprofil: Titel „Meldung“ ohne Untertitel, Lagebild „Lagebild“", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    expect(p.ui.titel).toBe("Meldung");
    expect(p.ui.untertitel).toBeUndefined();
    expect(p.ui.lagebild?.titel).toBe("Lagebild");
  });

  it("die PDF-Ausgaben tragen den Produkttitel, nicht den Bereichsnamen", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const roh = async (b: Blob) => new TextDecoder("latin1").decode(new Uint8Array(await b.arrayBuffer()));
    const meldung = await roh(meldungAlsPdf(ilkaMeldung("TH"), p, false));
    expect(meldung).toContain('<rdf:li xml:lang="de-DE">Meldung</rdf:li>');
    const lagebild = await roh(lagebildAlsPdf(p, "Lagebild", [["Sachverhalt"], ["x"]], [{ daten: ilkaMeldung("TH"), titel: "TH", zusatz: [] }], "30.10.2026"));
    expect(lagebild).toContain('<rdf:li xml:lang="de-DE">Lagebild</rdf:li>');
    expect(meldung + lagebild).not.toMatch(/xml:lang="de-DE">(Erfassung|Auswertung)</);
  });

  it("ein Profil mit eigenem Titel und Untertitel ändert die Überschrift der Erfassung nicht; der Untertitel ergänzt den Kennsatz", async () => {
    const p = (await profil("muster")).profil!;
    expect(p.ui.titel).not.toBe("Erfassung");
    const { MeldungAnsicht } = await import("../../src/ui/Meldung");
    await einhaengen(React.createElement(MeldungAnsicht, { profil: p, meldung: {}, setMeldung: () => undefined, neu: () => undefined }));
    expect(kopf("meldung")).toEqual(["Erfassung", "Erfassung einer Meldung nach LEAD-Systematik", p.ui.untertitel!]);
  });
});

describe("OF-2026-W44-04: neutrale Ansprache in der Oberfläche", () => {
  // Quelltexte der Oberfläche und der Start- und Reparaturseite; die Arbeitsanweisungen an die KI-Modelle
  // (src/pipeline/kontext.ts, src/pipeline/s2s3.ts, src/profil/standardtexte/) gehören nicht dazu.
  const dateien = (ordner: string): string[] =>
    readdirSync(repoPfad(ordner)).flatMap((n) => {
      const pfad = join(ordner, n);
      return statSync(repoPfad(pfad)).isDirectory() ? dateien(pfad) : /\.(tsx?|js|html)$/.test(n) ? [pfad] : [];
    });
  const OBERFLAECHE = [...dateien("src/ui"), "src/App.tsx", ...dateien("public")];

  /** Kommentare entfernen, damit nur Text bleibt, den Nutzende sehen können */
  const ohneKommentare = (s: string) =>
    s
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");

  // Pronomen und Verbformen der zweiten Person; „Sie“ allein ist mehrdeutig (Plural „sie“ am Satzanfang) und fehlt daher.
  const ANSPRACHE =
    /\b(du|dein|deine|deinen|deinem|deiner|deines|dir|dich|kannst|musst|brauchst|willst|möchtest|solltest|darfst|findest|siehst|wählst|prüfst|gibst|freigibst|startest|löschst|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)\b|\b(Wähle|Prüfe|Übernimm|Beschreibe|Speichere|Kopiere|Starte|Nutze|Lösche|Gib|Trage|Lade|Öffne|Klicke)\s/;

  it("kein „du“ und kein „Sie“ in sichtbaren Texten", () => {
    expect(OBERFLAECHE.length).toBeGreaterThan(20);
    const treffer = OBERFLAECHE.flatMap((d) =>
      ohneKommentare(readFileSync(repoPfad(d), "utf8"))
        .split("\n")
        .map((z, i) => ({ d, i: i + 1, z }))
        .filter(({ z }) => ANSPRACHE.test(z))
        .map(({ d, i, z }) => `${d}:${i}: ${z.trim()}`),
    );
    expect(treffer).toEqual([]);
  });

  it("die Prüfung erkennt beide Formen der Anrede (Gegenprobe)", () => {
    expect(ANSPRACHE.test("Wenn du sie noch brauchst")).toBe(true);
    expect(ANSPRACHE.test("Ihre Eingaben erfassen diese Lizenzen nicht")).toBe(true);
    expect(ANSPRACHE.test("Wähle ein KI-Profil")).toBe(true);
    expect(ANSPRACHE.test("KI-Profil wählen oder Modell und Aufwand je Aufgabe selbst zusammenstellen.")).toBe(false);
    expect(ANSPRACHE.test("Sie bleiben bis zur Löschung erhalten.")).toBe(false);
  });

  it("die Arbeitsanweisungen an die KI-Modelle bleiben beim „du“", () => {
    expect(readFileSync(repoPfad("src/pipeline/kontext.ts"), "utf8")).toMatch(/Du bist Stufe S1/);
    expect(readFileSync(repoPfad("src/profil/standardtexte/verdichtung.md"), "utf8")).toMatch(/\bDu verdichtest\b/);
  });
});
