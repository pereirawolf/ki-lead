// @vitest-environment jsdom
// Modell je Lauf abweichend von den Einstellungen; Laufprotokoll schon nach S1.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { profil } from "../support/dateien";
import { STANDARD, laufModelle, mitModellwahl, modellFuer } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }));
vi.mock("idb-keyval", () => ({
  get: vi.fn(async (k: string) => structuredClone(db.werte.get(k))),
  set: vi.fn(async (k: string, v: any) => void db.werte.set(k, structuredClone(v))),
  del: vi.fn(async (k: string) => void db.werte.delete(k)),
  keys: vi.fn(async () => [...db.werte.keys()]),
  entries: vi.fn(async () => [...db.werte.entries()]),
}));

// Anbieter-Attrappe: merkt sich die angefragten Modelle und liefert einen S1-Vorschlag
const anfragen = vi.hoisted(() => ({ modelle: [] as string[], aufwand: [] as (string | undefined)[] }));
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    async senden(a: { modell: string; aufwand?: string }) {
      anfragen.modelle.push(a.modell);
      anfragen.aufwand.push(a.aufwand);
      const text = JSON.stringify({
        gegenstand: "Sturmfolgen in Hessen",
        stichtag: "2026-10-14",
        referenzbezug: "Land Hessen",
        horizont: "bis 21.10.2026",
        sachverhalte: [{ titel: "Sturmfolgen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm" }],
        prueffrage: "",
        hinweise: "",
      });
      return {
        modell: a.modell,
        text,
        inhalt: [{ type: "text", text }],
        zitate: [],
        fundstellen: [],
        suchen: [],
        abrufe: [],
        abrufFehler: [],
        nutzung: { eingabe: 100, ausgabe: 50, cacheLesen: 0, cacheSchreiben: 0 },
        kostenUsd: 0.01,
        stopGrund: "end_turn",
        dauerMs: 5,
        runden: 1,
      };
    }
  }
  return { ...echt, Verteiler };
});

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: string }[] }));
vi.mock("../../src/speicher/speicher", async (original) => {
  const echt: any = await original();
  return { ...echt, dateiAnbieten: (inhalt: string, name: string) => downloads.liste.push({ name, inhalt: String(inhalt) }) };
});

describe("mitModellwahl", () => {
  it("überschreibt nur gewählte Stufen und lässt die Einstellungen unverändert", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const e = { ...STANDARD, modelle: { ...STANDARD.modelle, erfassung: "claude-opus-5-5" } };
    expect(mitModellwahl(e, {})).toBe(e);
    expect(mitModellwahl(e, { vorverarbeitung: "" })).toBe(e);
    expect(mitModellwahl(e, { aufwand: {} })).toBe(e);
    const a = mitModellwahl(e, { aufwand: { erfassung: "high" }, websucheMax: 99 });
    expect(a.aufwand.erfassung).toBe("high");
    expect(a.aufwand.vorverarbeitung).toBe(e.aufwand.vorverarbeitung);
    expect(a.websucheMax).toBe(50);
    expect(mitModellwahl(e, { websucheMax: 0 }).websucheMax).toBe(0);
    expect(e.aufwand.erfassung).toBe("medium");
    const m = mitModellwahl(e, { vorverarbeitung: "gpt-6-luna" });
    expect(modellFuer("vorverarbeitung", m, p)).toBe("gpt-6-luna");
    expect(modellFuer("erfassung", m, p)).toBe("claude-opus-5-5");
    expect(e.modelle.vorverarbeitung).toBe("");
    expect(laufModelle(m, p, false)).toContain("gpt-6-luna");
  });
});

let root: Root | undefined;
beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.confirm = () => true;
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  document.body.innerHTML = "";
  db.werte.clear();
  anfragen.modelle = [];
  anfragen.aufwand = [];
  downloads.liste = [];
});
const warte = (ms = 40) => act(async () => void (await new Promise((r) => setTimeout(r, ms))));
const knopf = (text: string | RegExp) =>
  [...document.querySelectorAll("button")].find((b) =>
    typeof text === "string" ? b.textContent?.trim() === text : text.test(b.textContent || ""),
  ) as HTMLButtonElement;
function setzen(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, wert: string) {
  const proto =
    el instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, wert);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}
const auswahl = (titel: string, feld = "Modell") =>
  [
    ...[...document.querySelectorAll(".modellwahl fieldset")]
      .find((f) => f.querySelector("legend")?.textContent?.startsWith(titel))!
      .querySelectorAll("label.feld"),
  ]
    .find((l) => l.textContent?.startsWith(feld))!
    .querySelector("select, input") as HTMLSelectElement & HTMLInputElement;

describe("KI-Erfassung", () => {
  it("Modell für S1 abweichend wählen, nach S1 Protokoll exportieren, S2-Modell vor dem Start änderbar", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const { KiErfassung } = await import("../../src/ui/KiErfassung");
    const ziel = document.createElement("div");
    document.body.appendChild(ziel);
    root = createRoot(ziel);
    await act(async () =>
      root!.render(
        React.createElement(KiErfassung, {
          profil: p,
          einstellungen: STANDARD,
          schluessel: { anthropic: "sk-test", openai: "" },
          zuEinstellungen: () => {},
          uebernehmen: () => {},
        }),
      ),
    );
    await warte();
    // Standard wird angezeigt, OpenAI ohne Schlüssel ist gekennzeichnet
    const s1 = auswahl("S1");
    expect(s1.options[0].textContent).toBe(`Standard: ${modellFuer("vorverarbeitung", STANDARD, p)}`);
    expect([...s1.options].find((o) => o.value === "gpt-6-luna")!.textContent).toContain("(kein Schlüssel für OpenAI)");

    await act(async () => setzen(s1, "claude-opus-5-5"));
    await act(async () => setzen(document.querySelector("textarea") as HTMLTextAreaElement, "Orkan in Hessen"));
    await act(async () => (document.querySelector(".bestaetigung input") as HTMLInputElement).click());
    await warte();
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain("S1: claude-opus-5-5");
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain("abweichend");

    await act(async () => knopf("Gegenstand bestimmen (S1)").click());
    await warte(150);
    expect(anfragen.modelle).toEqual(["claude-opus-5-5"]);
    expect(document.body.textContent).toContain("Gegenstand bestätigen");

    // Protokoll schon nach S1
    await act(async () => knopf("Laufprotokoll exportieren (S1)").click());
    expect(downloads.liste).toHaveLength(1);
    expect(downloads.liste[0].name).toMatch(/_KI-LEAD_Lauf_.+\.json$/);
    const protokoll = JSON.parse(downloads.liste[0].inhalt);
    expect(protokoll.stufen[0].modell).toBe("claude-opus-5-5");
    expect(protokoll.status).toBe("bestaetigen");

    // Vor S2 lässt sich das Modell für S2 noch ändern
    const s2 = auswahl("S2");
    expect(s2.value).toBe("");
    await act(async () => setzen(s2, "claude-fable-5-1"));
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain("S2: claude-fable-5-1");
  });

  it("Aufwand je Stufe und Höchstzahl der Websuchen für einen Lauf wählen", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const { KiErfassung } = await import("../../src/ui/KiErfassung");
    const ziel = document.createElement("div");
    document.body.appendChild(ziel);
    root = createRoot(ziel);
    await act(async () =>
      root!.render(
        React.createElement(KiErfassung, {
          profil: p,
          einstellungen: STANDARD,
          schluessel: { anthropic: "sk-test", openai: "" },
          zuEinstellungen: () => {},
          uebernehmen: () => {},
        }),
      ),
    );
    await warte();
    const a1 = auswahl("S1", "Aufwand");
    expect(a1.options[0].textContent).toBe("Standard: hoch");
    expect([...a1.options].map((o) => o.value)).toEqual(["", "low", "medium", "high", "xhigh", "max"]);
    const ws = auswahl("Recherche", "Höchstzahl");
    expect(ws.placeholder).toBe(`Standard: ${STANDARD.websucheMax}`);
    await act(async () => setzen(a1, "low"));
    await act(async () => setzen(auswahl("S2", "Aufwand"), "high"));
    await act(async () => setzen(ws, "5"));
    const zusammenfassung = document.querySelector(".modellwahl summary")!.textContent!;
    expect(zusammenfassung).toContain("S1: claude-haiku-5-5 (niedrig)");
    expect(zusammenfassung).toContain("S2: claude-opus-5-5 (hoch)");
    expect(zusammenfassung).toContain("bis 5 Websuchen");
    expect(document.body.textContent).toContain("S2 mit bis zu 5 Websuchen.");
    // Schätzung folgt dem gewählten Aufwand (S2 Opus „high“ ohne Messwert)
    expect(document.querySelector(".laufschaetzung")!.textContent).toContain("S2 (claude-opus-5-5, high)");

    await act(async () => setzen(document.querySelector("textarea") as HTMLTextAreaElement, "Orkan in Hessen"));
    await act(async () => (document.querySelector(".bestaetigung input") as HTMLInputElement).click());
    await act(async () => knopf("Gegenstand bestimmen (S1)").click());
    await warte(150);
    expect(anfragen.aufwand).toEqual(["low"]);
    // nach S1 bleibt die Wahl erhalten und gilt für S2
    expect(auswahl("S2", "Aufwand").value).toBe("high");
    expect(auswahl("Recherche", "Höchstzahl").value).toBe("5");
    expect(document.body.textContent).toContain("S2 recherchiert mit bis zu 5 Websuchen.");
    // leeres Feld = wieder Standard
    await act(async () => setzen(auswahl("Recherche", "Höchstzahl"), ""));
    expect(document.querySelector(".modellwahl summary")!.textContent).toContain(`bis ${STANDARD.websucheMax} Websuchen`);
  });
});
