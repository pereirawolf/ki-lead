// @vitest-environment jsdom
// Befunde UX-2026-W45 (Oberfläche der Auswertung und der Profile, freigegeben am 04.11.2026). Je Test die Kennung des
// Befunds im Namen; das Soll steht im Befund, nicht im Code.

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { profil } from "../support/dateien";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung, seitentext, setzen } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { adresseLesen, adresseText } from "../../src/ui/app/adresse";
import { alterText, sammelErinnerungMailto, type StatusZeile, type SvEintrag } from "../../src/lagebild/lagebild";
import { KEIN_FILTER, svFiltern, type SvFilter } from "../../src/ui/lagebild/Sachverhaltsliste";

describe("UX-2026-W45-05: Adresse der Auswertung", () => {
  it("liest #/auswertung/… und weiterhin #/lagebild/…, schreibt #/auswertung/…", () => {
    expect(adresseLesen("#/auswertung/redaktion")).toEqual({ ansicht: "lagebild", reiter: "redaktion" });
    expect(adresseLesen("#/lagebild/redaktion")).toEqual({ ansicht: "lagebild", reiter: "redaktion" });
    expect(adresseLesen("#/lagebild")).toEqual({ ansicht: "lagebild" });
    expect(adresseText({ ansicht: "lagebild", reiter: "redaktion" })).toBe("#/auswertung/redaktion");
    expect(adresseText({ ansicht: "lagebild" })).toBe("#/auswertung");
    expect(adresseText({ ansicht: "einstellungen", bereich: "modelle" })).toBe("#/einstellungen/modelle");
    expect(adresseLesen("#/unbekannt")).toEqual({ ansicht: "meldung" });
  });
});

describe("UX-2026-W45-07: Meldestatus", () => {
  const zeile = (name: string, email: string | undefined, gemeldet: boolean) =>
    ({ name, feld: "land", email, eintraege: gemeldet ? [{}] : [] }) as unknown as StatusZeile;

  it("Sammelerinnerung nur an echte Adressen offener Stellen, in Bcc", () => {
    const m = sammelErinnerungMailto([
      zeile("Bayern", "lage@by.de", false),
      zeile("Berlin", "lage@beispiel.de", false),
      zeile("Hessen", "lage@he.de", true),
      zeile("Sachsen", "lz@sn.de", false),
      zeile("Saarland", undefined, false),
    ])!;
    expect(m.anzahl).toBe(2);
    expect(m.href.startsWith("mailto:?bcc=")).toBe(true);
    const bcc = decodeURIComponent(m.href.slice("mailto:?bcc=".length).split("&")[0]!);
    expect(bcc.split(",")).toEqual(["lage@by.de", "lz@sn.de"]);
    expect(decodeURIComponent(m.href)).toContain("Ihrer Stelle");
  });

  it("ohne echte Adresse keine Sammelerinnerung", () => {
    expect(sammelErinnerungMailto([zeile("Berlin", "lage@beispiel.de", false)])).toBeNull();
  });

  it("Alter in Worten", () => {
    const jetzt = new Date("2026-10-16T12:00:00Z");
    expect(alterText(new Date("2026-10-16T11:30:00Z"), jetzt)).toBe("vor weniger als 1 Stunde");
    expect(alterText(new Date("2026-10-16T09:00:00Z"), jetzt)).toBe("vor 3 Stunden");
    expect(alterText(new Date("2026-10-15T11:00:00Z"), jetzt)).toBe("vor 1 Tag");
    expect(alterText(new Date("2026-10-14T10:00:00Z"), jetzt)).toBe("vor 2 Tagen");
    expect(alterText(new Date("2026-10-17T10:00:00Z"), jetzt)).toBe("");
    expect(alterText(null, jetzt)).toBe("");
  });
});

// ── Oberfläche der Auswertung mit dem Beispiel „Ilka“ ─────────────────────────────

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
  vi.resetModules();
});

async function ilka(name = "lead-beispiel") {
  const { LagebildAnsicht } = await import("../../src/ui/Lagebild");
  const { profil: p } = await profil(name);
  await einhaengen(React.createElement(LagebildAnsicht, { profil: p!, uebergeben: () => {}, oeffnen: () => {} }));
  await klick(knopf(/Beispiel laden:/));
  await bisWahr(() => expect(seitentext()).toContain("7 Meldungen · 8 Sachverhalte"));
  return p!;
}

const kacheln = () => [...document.querySelectorAll<HTMLElement>(".lb-kennzahl")].map((k) => [...k.children].map((c) => c.textContent).join(" "));

describe("UX-2026-W45-01 bis -03: Ablage, Ausgaben und Reiter", () => {
  it("Ablage nach dem Laden einzeilig, Ausgaben im Menü, „Alle entfernen“ in der Dateiliste, Reiter geordnet", async () => {
    await ilka();
    expect(document.querySelector(".lb-ablage-kompakt")).not.toBeNull();
    expect(seitentext()).not.toContain("Meldungen hier ablegen");
    expect(document.querySelector(".lb-leiste")?.textContent).not.toMatch(/Alle entfernen|Lagebild als PDF/);
    expect(document.querySelector(".lb-dateiliste")?.textContent).toContain("Alle entfernen");
    const reiter = [...document.querySelectorAll(".lb-reiter li")].map((li) => [li.textContent?.replace(/\d+$/, "").trim(), li.className]);
    expect(reiter.map((r) => r[0])).toEqual(["Übersicht", "Sachverhalte", "Lagenradar", "Meldungen", "Redaktionscheck", "Kopiervorlage", "Rohtabelle"]);
    expect(reiter.filter((r) => r[1] === "lb-reiter-gruppe").map((r) => r[0])).toEqual(["Redaktionscheck", "Kopiervorlage"]);
  });
});

describe("UX-2026-W45-06, -08, -09: Übersicht", () => {
  it("Kennzahlen in zwei Gruppen, alle als Knopf, eigene Meldung gekennzeichnet und abwählbar", async () => {
    await ilka();
    const gruppen = [...document.querySelectorAll(".lb-kennzahl-gruppe")].map((g) => g.getAttribute("aria-label"));
    expect(gruppen).toEqual(["Lage", "Redaktion"]);
    expect([...document.querySelectorAll(".lb-kennzahl")].every((k) => k.tagName === "BUTTON")).toBe(true);
    expect(kacheln()).toContain("8 Sachverhalte → davon 1 aus eigener Meldung");
    expect(kacheln()).toContain("5 Bewertung: erheblich → davon 1 aus eigener Meldung");
    expect(document.querySelector(".lb-kennzahl-null")?.textContent).toMatch(/^0/);

    // Beurteilung mit allen Stufen, „Meldende Stellen“ entfällt
    const beurteilung = [...document.querySelectorAll(".lb-balken")].find((b) => b.querySelector("h4")?.textContent === "Bewertung")!;
    expect([...beurteilung.querySelectorAll(".lb-balken-label")].map((l) => l.textContent)).toEqual(["kritisch", "erheblich", "geringfügig"]);
    expect(seitentext()).not.toContain("Meldende Stellen");

    await klick(document.querySelector<HTMLInputElement>(".lb-eigene input")!);
    await bisWahr(() => expect(kacheln()).toContain("7 Sachverhalte →"));
    expect(kacheln()).toContain("4 Bewertung: erheblich →");
    expect(seitentext()).toContain("Auswahl ohne eigene Meldung: 6 von 7 Meldungen");
  });

  it("Kachel „Meldungen“ öffnet den Reiter Meldungen", async () => {
    await ilka();
    await klick(knopf(/^7Meldungen/));
    expect(document.querySelector(".lb-reiter [aria-current]")?.textContent).toBe("Meldungen");
  });
});

describe("UX-2026-W45-10 bis -12: Meldungen", () => {
  const titel = () => [...document.querySelectorAll(".lb-karte .lb-absender-kurz")].map((k) => k.textContent);

  it("eigene Meldung zuerst und abgesetzt, Sortierung nach Stelle und Zeitpunkt, Schemamarke nur bei Abweichung", async () => {
    await ilka();
    await klick(knopf("Meldungen"));
    expect(titel()).toEqual(["Bund", "Hessen", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Sachsen-Anhalt", "Thüringen"]);
    expect(document.querySelectorAll(".lb-karte-eigen")).toHaveLength(1);
    expect(seitentext()).not.toContain("Schema ✓");
    const kopf = document.querySelector(".lb-karte header")!.textContent!;
    expect(kopf).not.toContain(".json");

    const wahl = document.querySelector<HTMLSelectElement>(".lb-svfilter select")!;
    await act(async () => {
      setzen(wahl, "zeit");
    });
    expect(titel()).toEqual(["Bund", "Sachsen-Anhalt", "Thüringen", "Hessen", "Nordrhein-Westfalen", "Niedersachsen", "Rheinland-Pfalz"]);
  });
});

describe("UX-2026-W45-14: Filter der Sachverhalte", () => {
  const sv = (x: Partial<SvEintrag>) => ({ bezeichnung: "", ort: "", arten: [], land: "", beurteilung: "", tendenz: "", ...x }) as SvEintrag;
  const liste = [
    sv({ bezeichnung: "Sturm im Harz", ort: "Landkreis Harz", arten: ["Unwetter / Sturm"], land: "Sachsen-Anhalt", beurteilung: "geringfügig" }),
    sv({ bezeichnung: "Stromausfall Sonneberg", ort: "Landkreis Sonneberg", arten: ["Stromausfall / Blackout", "KRITIS-Ausfall"], land: "Thüringen" }),
    sv({ bezeichnung: "Ohne Art", land: "Thüringen" }),
  ];
  const f = (x: Partial<SvFilter>) => ({ ...KEIN_FILTER, ...x });

  it("Art aus der Mehrfachnennung, Land und Textsuche (alle Wörter, ohne Groß- und Kleinschreibung)", () => {
    expect(svFiltern(liste, f({ art: "KRITIS-Ausfall" })).map((s) => s.bezeichnung)).toEqual(["Stromausfall Sonneberg"]);
    expect(svFiltern(liste, f({ land: "Thüringen" }))).toHaveLength(2);
    expect(svFiltern(liste, f({ suche: "landkreis SONNEBERG" })).map((s) => s.bezeichnung)).toEqual(["Stromausfall Sonneberg"]);
    expect(svFiltern(liste, f({ suche: "DE-TH-1" }), (s) => (s.bezeichnung === "Ohne Art" ? "DE-TH-1" : ""))).toHaveLength(1);
    expect(svFiltern(liste, f({ land: "Thüringen", suche: "harz" }))).toHaveLength(0);
  });

  it("Chips mit Anzahl im Beispiel Ilka", async () => {
    await ilka();
    await klick(knopf("Sachverhalte"));
    const gruppe = (name: string) => document.querySelector<HTMLElement>(`.lb-chips[aria-label="${name}"]`)!;
    expect([...gruppe("Art").querySelectorAll("button")].map((b) => b.textContent)).toEqual(
      expect.arrayContaining(["Unwetter / Sturm (7)", "Stromausfall / Blackout (6)", "KRITIS-Ausfall (2)"]),
    );
    await klick(knopf("KRITIS-Ausfall (2)"));
    expect(document.querySelectorAll(".lb-svliste .lb-sv-zeile")).toHaveLength(2);
    expect(knopf("KRITIS-Ausfall (2)")?.getAttribute("aria-pressed")).toBe("true");
    await klick(knopf("Filter aufheben"));
    expect(document.querySelectorAll(".lb-svliste .lb-sv-zeile")).toHaveLength(8);
  });
});
