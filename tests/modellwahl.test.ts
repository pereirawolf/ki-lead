// @vitest-environment jsdom
// Modell je Lauf abweichend von den Einstellungen; Laufprotokoll schon nach S1.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { profil } from "./hilfen";
import { STANDARD, laufModelle, mitModellwahl, modellFuer } from "../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }));
vi.mock("idb-keyval", () => ({
  get: vi.fn(async (k: string) => structuredClone(db.werte.get(k))),
  set: vi.fn(async (k: string, v: any) => void db.werte.set(k, structuredClone(v))),
  del: vi.fn(async (k: string) => void db.werte.delete(k)),
  keys: vi.fn(async () => [...db.werte.keys()]),
  entries: vi.fn(async () => [...db.werte.entries()]),
}));

// Anbieter-Attrappe: merkt sich die angefragten Modelle und liefert einen S1-Vorschlag
const anfragen = vi.hoisted(() => ({ modelle: [] as string[] }));
vi.mock("../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    async senden(a: { modell: string }) {
      anfragen.modelle.push(a.modell);
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
vi.mock("../src/speicher/speicher", async (original) => {
  const echt: any = await original();
  return { ...echt, dateiAnbieten: (inhalt: string, name: string) => downloads.liste.push({ name, inhalt: String(inhalt) }) };
});

describe("mitModellwahl", () => {
  it("überschreibt nur gewählte Stufen und lässt die Einstellungen unverändert", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const e = { ...STANDARD, modelle: { ...STANDARD.modelle, erfassung: "claude-opus-5-5" } };
    expect(mitModellwahl(e, {})).toBe(e);
    expect(mitModellwahl(e, { vorverarbeitung: "" })).toBe(e);
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
const auswahl = (titel: string) =>
  [...document.querySelectorAll(".modellwahl label.feld")].find((l) => l.textContent?.startsWith(titel))!.querySelector("select") as HTMLSelectElement;

describe("KI-Erfassung", () => {
  it("Modell für S1 abweichend wählen, nach S1 Protokoll exportieren, S2-Modell vor dem Start änderbar", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const { KiErfassung } = await import("../src/ui/KiErfassung");
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
});
