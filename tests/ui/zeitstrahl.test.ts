// @vitest-environment jsdom
// Zeitstrahl und Sachverhaltskennung in der Meldungsmaske (seit 0.6.9, ZS-2026-W44-01, -02): Kennung beim Anlegen,
// „Kennung vergeben“ für ältere Sachverhalte, Zeitstrahl als eigener Bereich auf der Seite „Quellen & Referenzen“.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { useState } from "react";
import { KENNUNG_RE } from "../../src/kern/kennung";
import type { Profil } from "../../src/kern/typen";
import { profilPflicht } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { aushaengen, bisWahr, einhaengen, klick, knopf, reactUmgebung } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

import { MeldungAnsicht } from "../../src/ui/Meldung";

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(db);
});

let stand: any;
/** Maske mit eigenem Zustand, damit Änderungen ankommen; `stand` hält den letzten Stand der Meldung */
async function zeige(meldung: any): Promise<Profil> {
  const profil = await profilPflicht("lead-beispiel");
  stand = meldung;
  function Rahmen() {
    const [m, setM] = useState<any>(meldung);
    return React.createElement(MeldungAnsicht, {
      profil,
      meldung: m,
      setMeldung: (neu: any) => {
        stand = typeof neu === "function" ? neu(stand) : neu;
        setM(stand);
      },
      neu: () => {},
      ki: { schluessel: { anthropic: "", openai: "", mistral: "", stelle: "" }, einstellungen: STANDARD },
    });
  }
  await einhaengen(React.createElement(Rahmen));
  return profil;
}
const schritt = (titel: RegExp) =>
  klick([...document.querySelectorAll("nav.schritte button")].find((b) => titel.test(b.textContent || "")) as HTMLButtonElement);

describe("ZS-2026-W44-02: Sachverhaltskennung in der Maske", () => {
  it("ein neuer Sachverhalt erhält sofort eine Kennung mit dem Präfix des Felds „Land“; der Kopf zeigt sie", async () => {
    await zeige(ilkaMeldung("Bund"));
    await schritt(/Ereignisse\/Sachverhalte/);
    await klick("Ereignis/Sachverhalt hinzufügen");
    await bisWahr(() => stand.sachverhalte.length === 2);
    const k = stand.sachverhalte[1].kennung;
    expect(k).toMatch(KENNUNG_RE);
    expect(k).toMatch(/^DE-\d{8}-/);
    expect(k).not.toBe(stand.sachverhalte[0].kennung);
    const koepfe = [...document.querySelectorAll(".element-kennung")].map((e) => e.textContent);
    expect(koepfe).toEqual(["DE-20261014-7QKD", k]);
  });

  it("ein Sachverhalt ohne Kennung (ältere Datei) zeigt „Kennung vergeben“; danach verschwindet der Knopf", async () => {
    const m = ilkaMeldung("TH");
    delete m.sachverhalte[0].kennung;
    await zeige(m);
    await schritt(/Ereignisse\/Sachverhalte/);
    await klick("Kennung vergeben");
    await bisWahr(() => !!stand.sachverhalte[0].kennung);
    expect(stand.sachverhalte[0].kennung).toMatch(/^DE-TH-\d{8}-[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(knopf("Kennung vergeben")).toBeUndefined();
  });
});

describe("ZS-2026-W44-01: Zeitstrahl auf der Seite „Quellen & Referenzen“", () => {
  it("eigener Bereich unter dem Quellenverzeichnis mit Zähler; „Chronologisch ordnen“ nur bei Bedarf", async () => {
    await zeige(ilkaMeldung("Bund"));
    await schritt(/Quellen & Referenzen/);
    const felder = [...document.querySelectorAll("section.schritt-inhalt .feld-label")].map((l) => l.textContent);
    expect(felder.indexOf("Quellen & Referenzen")).toBeLessThan(felder.indexOf("Zeitstrahl"));
    const bereich = document.querySelector(".feld-zeitstrahl") as HTMLElement;
    expect((bereich.querySelector("textarea") as HTMLTextAreaElement).value.split("\n")).toHaveLength(8);
    expect(bereich.textContent).toContain("8 Zeilen");
    expect((knopf("Chronologisch ordnen", bereich) as HTMLButtonElement).disabled).toBe(true);
  });

  it("„Zeile anfügen“ hängt eine Zeile in fester Form mit der nächsten Nummer und der Kennung des gewählten Sachverhalts an", async () => {
    await zeige(ilkaMeldung("Bund"));
    await schritt(/Quellen & Referenzen/);
    const bereich = document.querySelector(".feld-zeitstrahl") as HTMLElement;
    const sachverhalt = bereich.querySelector("select") as HTMLSelectElement;
    expect([...sachverhalt.options].map((o) => o.value)).toEqual(["DE-20261014-7QKD"]);
    await klick("Zeile anfügen", bereich);
    await bisWahr(() => String(stand.zeitstrahl).split("\n").length === 9);
    expect(String(stand.zeitstrahl).split("\n").at(-1)).toMatch(
      /^\[Z9\] \d{4}-\d{2}-\d{2} · DE-20261014-7QKD · Ereignis – Was ist geschehen\? \[Qn\] · aufgenommen 2026-10-14T14:00$/,
    );
  });

  it("ungeordnete Zeilen: Hinweis und „Chronologisch ordnen“ ordnet", async () => {
    const m = ilkaMeldung("Bund");
    m.zeitstrahl = m.zeitstrahl.split("\n").reverse().join("\n");
    await zeige(m);
    await schritt(/Quellen & Referenzen/);
    const bereich = document.querySelector(".feld-zeitstrahl") as HTMLElement;
    expect(bereich.textContent).toContain("nicht zeitlich geordnet");
    await klick("Chronologisch ordnen", bereich);
    await bisWahr(() => String(stand.zeitstrahl).startsWith("[Z1]"));
    expect(stand.zeitstrahl).toBe(ilkaMeldung("Bund").zeitstrahl);
  });

  it("ZS-2026-W44-05: Zeilen ohne Kenntniszeit werden gezählt, „Aufnahmezeit ergänzen“ setzt den Meldezeitpunkt", async () => {
    const m = ilkaMeldung("Bund");
    m.zeitstrahl = m.zeitstrahl.replace(/ · aufgenommen \S+/g, "");
    await zeige(m);
    await schritt(/Quellen & Referenzen/);
    const bereich = document.querySelector(".feld-zeitstrahl") as HTMLElement;
    expect(bereich.textContent).toContain("8 ohne Kenntniszeit");
    await klick("Aufnahmezeit ergänzen", bereich);
    await bisWahr(() => String(stand.zeitstrahl).includes("aufgenommen"));
    expect(stand.zeitstrahl).toBe(ilkaMeldung("Bund").zeitstrahl);
    expect(knopf("Aufnahmezeit ergänzen", bereich)).toBeUndefined();
  });

  it("ohne Sachverhalt mit Kennung: Hinweis statt Auswahl, „Zeile anfügen“ gesperrt", async () => {
    const m = ilkaMeldung("Bund");
    delete m.sachverhalte[0].kennung;
    await zeige(m);
    await schritt(/Quellen & Referenzen/);
    const bereich = document.querySelector(".feld-zeitstrahl") as HTMLElement;
    expect(bereich.querySelector("select")).toBeNull();
    expect(bereich.textContent).toContain("Noch kein Sachverhalt mit Kennung");
    expect((knopf("Zeile anfügen", bereich) as HTMLButtonElement).disabled).toBe(true);
  });
});
