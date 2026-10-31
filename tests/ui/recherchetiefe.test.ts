// @vitest-environment jsdom
// Einstellungen → „Recherche & Grenzen“: Recherchetiefe mit Stufen und eigenen Werten (seit 0.5.19).
// Befunde KP-2026-W43-69 bis -76 (Prüfung „Recherche & Grenzen“ vom 25.10.2026, Herausgeber-Freigabe vom selben Tag).
// Ohne Profil gelten die Vorgaben der App (S2 mit claude-opus-5-5); Soll als feste Texte.
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import React, { act } from "react";
import { aushaengen, einhaengen, eingeben, klick, reactUmgebung, seitentext } from "../support/dom";
import { STANDARD, type Einstellungen } from "../../src/pipeline/einstellungen";
import { EinstellungenAnsicht } from "../../src/ui/Einstellungen";

beforeAll(reactUmgebung);
afterEach(aushaengen);

function MitZustand({ start, gesetzt }: { start: Einstellungen; gesetzt: Einstellungen[] }) {
  const [e, setE] = React.useState(start);
  return React.createElement(EinstellungenAnsicht, {
    profil: null,
    einstellungen: e,
    setEinstellungen: (neu: Einstellungen) => {
      gesetzt.push(neu);
      setE(neu);
    },
    schluessel: { anthropic: "", openai: "", mistral: "", stelle: "" },
    setSchluessel: () => {},
    bereich: "recherche",
  });
}

async function zeigen(start: Partial<Einstellungen> = {}) {
  const gesetzt: Einstellungen[] = [];
  await einhaengen(React.createElement(MitZustand, { start: { ...STANDARD, ...start }, gesetzt }));
  return gesetzt;
}

const stufe = (wert: string) => document.querySelector(`input[name="recherchetiefe"][value="${wert}"]`) as HTMLInputElement;
const gewaehlt = () => (document.querySelector('input[name="recherchetiefe"]:checked') as HTMLInputElement | null)?.value;
/** Eingabe zur sichtbaren Beschriftung (label for=…), oder null */
function feld(beschriftung: string): HTMLInputElement | null {
  const label = [...document.querySelectorAll("label")].find((l) => l.textContent?.trim() === beschriftung);
  return label ? (document.getElementById(label.htmlFor) as HTMLInputElement) : null;
}
function beschreibung(el: Element): string[] {
  return (el.getAttribute("aria-describedby") || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() || `[fehlt: ${id}]`);
}
const verlassen = (el: HTMLElement) => act(async () => void el.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));

const WEBSUCHEN = "Websuchen je Recherche (höchstens)";
const SEITEN = "Seiten vollständig lesen je Recherche (höchstens)";
const LESEMENGE = "Lesemenge je Seite (höchstens, in Token)";

describe("KP-2026-W43-69: Recherchetiefe", () => {
  it("Vorgaben zeigen „Standard“ ohne Zahlenfelder; eine Stufe setzt alle drei Werte", async () => {
    const gesetzt = await zeigen();
    expect(document.querySelector(".recherchetiefe-wahl legend")!.textContent).toBe("Recherchetiefe");
    expect([...document.querySelectorAll('input[name="recherchetiefe"]')].map((r) => (r as HTMLInputElement).value)).toEqual([
      "sparsam",
      "standard",
      "gruendlich",
      "eigen",
    ]);
    expect(gewaehlt()).toBe("standard");
    expect(stufe("standard").closest("label")!.textContent).toBe(
      "StandardFür die meisten Aufträge. (15 Websuchen, 10 Seiten, 15.000 Token je Seite; Pflichtsuchen 2 je Sachverhalt, höchstens 5)",
    );
    expect(feld(WEBSUCHEN)).toBeNull();

    await klick(stufe("gruendlich"));
    expect(gesetzt.at(-1)).toEqual({ ...STANDARD, websucheMax: 30, abrufMax: 20, abrufMaxTokens: 30000 });
    expect(gewaehlt()).toBe("gruendlich");
    expect(feld(WEBSUCHEN)).toBeNull();
  });

  it("„Eigene Werte“ zeigt die Felder mit den aktuellen Zahlen, ohne etwas zu speichern", async () => {
    const gesetzt = await zeigen();
    await klick(stufe("sparsam"));
    await klick(stufe("eigen"));
    expect(gesetzt).toHaveLength(1);
    expect(gewaehlt()).toBe("eigen");
    expect([feld(WEBSUCHEN)!.value, feld(SEITEN)!.value, feld(LESEMENGE)!.value]).toEqual(["5", "3", "8000"]);
  });

  it("abweichende gespeicherte Werte zeigen „Eigene Werte“ mit Feldern", async () => {
    await zeigen({ websucheMax: 7 });
    expect(gewaehlt()).toBe("eigen");
    expect(feld(WEBSUCHEN)!.value).toBe("7");
  });
});

describe("KP-2026-W43-70/-71/-73: Beschriftungen, Hilfetexte, Umrechnung und Wirkung", () => {
  it("jedes Feld ist beschriftet und mit Hilfetext und Vermerk verknüpft", async () => {
    await zeigen({ websucheMax: 7 });
    expect(beschreibung(feld(WEBSUCHEN)!)).toEqual([
      "Wie oft die KI wie in einer Suchmaschine nach Quellen suchen darf. Ist die Zahl erreicht, arbeitet sie mit dem Gefundenen weiter. 0: keine Websuche. In der KI-Erfassung lassen sich die drei Werte je Auftrag ändern.",
      "Bei den gewählten Modellen: Anthropic begrenzt die Suchen.",
    ]);
    expect(beschreibung(feld(SEITEN)!)).toEqual([
      "Wie viele Webseiten die KI ganz öffnen darf, aus den Suchtreffern oder aus dem Auftrag. Ohne Seitenabruf kennt sie nur die Kurzauszüge der Trefferliste. 0: Es wird keine Seite geöffnet, auch keine im Auftrag genannte.",
      "Bei den gewählten Modellen: Anthropic begrenzt die Seiten.",
    ]);
    expect(beschreibung(feld(LESEMENGE)!)).toEqual([
      "Längere Seiten liest die KI nur bis hierhin; was danach steht, sieht sie nicht. Zu knapp schneidet Tabellen oder Anhänge am Ende ab, zu großzügig erhöht die Kosten.",
      "≈ rund 7.500 Wörter, etwa 19 Druckseiten",
      "Bei den gewählten Modellen: Anthropic kürzt längere Seiten.",
    ]);
    expect(seitentext()).not.toContain("Höchstzahl Websuchen je Lauf");
  });
});

describe("KP-2026-W43-72: Höchstkosten", () => {
  it("nennen den Betrag für das S2-Modell und folgen der Stufe", async () => {
    await zeigen();
    const zeile = () => document.querySelector(".recherche-kosten")!.textContent!;
    expect(zeile()).toContain("Mit claude-opus-5-5 kosten Suchen und Seitenlesen höchstens etwa 0,75 USD");
    await klick(stufe("sparsam"));
    expect(zeile()).toContain("höchstens etwa 0,15 USD");
  });
});

describe("KP-2026-W43-74/-75: Übernahme getippter Werte", () => {
  it("ein geleertes Feld schaltet die Websuche nicht ab; der bisherige Wert bleibt mit Hinweis", async () => {
    const gesetzt = await zeigen({ websucheMax: 7 });
    await eingeben(feld(WEBSUCHEN)!, "");
    await verlassen(feld(WEBSUCHEN)!);
    expect(gesetzt).toEqual([]);
    expect(feld(WEBSUCHEN)!.value).toBe("7");
    expect(beschreibung(feld(WEBSUCHEN)!).at(-1)).toBe("Kein Wert eingegeben; der bisherige Wert 7 bleibt. Für keine Websuche 0 eingeben.");
    // 0 bewusst eingegeben: gilt sofort, Hinweis verschwindet
    await eingeben(feld(WEBSUCHEN)!, "0");
    expect(gesetzt.at(-1)!.websucheMax).toBe(0);
    expect(beschreibung(feld(WEBSUCHEN)!)).toHaveLength(2);
  });

  it("Werte über dem Höchstwert werden beim Verlassen begrenzt", async () => {
    const gesetzt = await zeigen({ websucheMax: 7 });
    await eingeben(feld(WEBSUCHEN)!, "500");
    expect(gesetzt.at(-1)?.websucheMax).not.toBe(500);
    await verlassen(feld(WEBSUCHEN)!);
    expect(gesetzt.at(-1)!.websucheMax).toBe(50);
    expect(feld(WEBSUCHEN)!.value).toBe("50");
    expect(beschreibung(feld(WEBSUCHEN)!).at(-1)).toBe("Höchstens 50; auf 50 gesetzt.");
  });
});

describe("KP-2026-W43-76: Seiten nie kürzen", () => {
  it("Kästchen statt 0; gespeichert wird weiter 0, abgewählt gilt der Standard", async () => {
    const gesetzt = await zeigen({ websucheMax: 7 });
    const kaestchen = () => [...document.querySelectorAll(".schalter")].find((l) => l.textContent?.startsWith("Seiten nie kürzen"))!.querySelector("input")!;
    expect(kaestchen().checked).toBe(false);
    await klick(kaestchen());
    expect(gesetzt.at(-1)!.abrufMaxTokens).toBe(0);
    expect(feld(LESEMENGE)!.disabled).toBe(true);
    expect(feld(LESEMENGE)!.value).toBe("");
    expect(document.querySelector(".recherche-kosten")!.textContent).toContain("dazu Seiten ohne Längengrenze");
    await klick(kaestchen());
    expect(gesetzt.at(-1)!.abrufMaxTokens).toBe(15000);
    expect(feld(LESEMENGE)!.disabled).toBe(false);
  });

  it("gespeicherte 0 zeigt das gesetzte Kästchen", async () => {
    await zeigen({ abrufMaxTokens: 0 });
    expect(gewaehlt()).toBe("eigen");
    expect(feld(LESEMENGE)!.disabled).toBe(true);
  });
});
