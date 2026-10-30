// @vitest-environment jsdom
// KI-Chip rechts oben in der Kopfleiste (seit 0.5.21; seit 0.6.12 zentraler Zähler und reine Statusanzeige, KP-2026-W44-01): „KI offline“ in Ruhe, „KI online“, solange eine KI-Anfrage
// läuft; Stufe im zugänglichen Namen, der mit dem sichtbaren Text beginnt; Ansage bei jedem Wechsel.
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import React from "react";
import { aushaengen, einhaengen, reactUmgebung, takt } from "../support/dom";
import { anfrageBeginnt } from "../../src/anbieter/laufzaehler";
import { kiAnsage, KiSymbol, kiSymbolText, type KiSymbolProps } from "../../src/ui/KiSymbol";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const zeige = (p: Partial<KiSymbolProps>) => einhaengen(React.createElement(KiSymbol, p));
const chip = () => document.querySelector<HTMLElement>(".kopf-ki")!;

describe("KI-Chip der Kopfleiste", () => {
  it("zeigt in Ruhe „KI offline“", async () => {
    await zeige({ lauf: null, anfragen: 0 });
    expect(chip().dataset.zustand).toBe("offline");
    expect(chip().querySelector(".kopf-ki-text")?.textContent).toBe("KI offline");
    expect(chip().getAttribute("aria-label")).toBe("KI offline: keine KI-Anfrage aktiv");
  });

  it("zeigt „KI online“ mit Stufe im Namen, solange eine Anfrage läuft", async () => {
    await zeige({ lauf: { stufe: "s2", verdichtung: true }, anfragen: 1 });
    expect(chip().dataset.zustand).toBe("online");
    expect(chip().querySelector(".kopf-ki-text")?.textContent).toBe("KI online");
    expect(chip().getAttribute("aria-label")).toBe("KI online: Anfrage läuft, S2 Verdichtung und Entwurf");
  });

  it("sagt Stufenwechsel und das Ende an", () => {
    expect(kiAnsage({ stufe: "s1" })).toBe("KI online: S1 Gegenstand und SOP-Auswahl.");
    expect(kiAnsage({ stufe: "s3" })).toBe("KI online: S3 Prüfung.");
    expect(kiAnsage(null)).toBe("KI offline.");
    expect(kiSymbolText({ stufe: "s2" })).toBe("KI online: Anfrage läuft, S2 Recherche und Entwurf");
  });

  it("zeigt die laufende Management Summary mit ihrem Titel (seit 0.6.6)", async () => {
    await zeige({ lauf: { stufe: "ms", titel: "Lagebild für die Leitung" }, anfragen: 1 });
    expect(chip().dataset.zustand).toBe("online");
    expect(chip().getAttribute("aria-label")).toBe("KI online: Anfrage läuft, Lagebild für die Leitung");
    expect(kiSymbolText({ stufe: "ms" })).toBe("KI online: Anfrage läuft, Management Summary");
    expect(kiAnsage({ stufe: "ms" })).toBe("KI online: Management Summary.");
  });
});

describe("KP-2026-W44-01: KI-Chip aus dem zentralen Zähler, reine Statusanzeige", () => {
  it("ist online bei jeder laufenden Anfrage, auch ohne gemeldete Stufe (Testlauf, Verbindungstest), und nennt mehrere", async () => {
    await zeige({ anfragen: 1 });
    expect(chip().dataset.zustand).toBe("online");
    expect(chip().getAttribute("aria-label")).toBe("KI online: Anfrage läuft");
    expect(kiAnsage(null, 1)).toBe("KI online.");
    expect(kiSymbolText(null, 2)).toBe("KI online: 2 Anfragen laufen");
    expect(kiSymbolText({ stufe: "s1" }, 2)).toBe("KI online: 2 Anfragen laufen, darunter S1 Gegenstand und SOP-Auswahl");
  });

  it("folgt ohne Angabe dem zentralen Zähler: online bis zum Ende der Anfrage", async () => {
    await zeige({});
    expect(chip().dataset.zustand).toBe("offline");
    const ende = anfrageBeginnt();
    await takt();
    expect(chip().dataset.zustand).toBe("online");
    ende();
    await takt();
    expect(chip().dataset.zustand).toBe("offline");
  });

  it("ist kein Knopf: keine Rolle button, kein Tabstopp, kein Klickziel", async () => {
    await zeige({ anfragen: 1 });
    expect(chip().tagName).not.toBe("BUTTON");
    expect(chip().getAttribute("role")).toBe("img");
    expect(chip().hasAttribute("tabindex")).toBe(false);
    expect(document.querySelector("button")).toBeNull();
  });
});
