// @vitest-environment jsdom
// Sicherung, Wiederherstellung und Löschen des Gerätestands (seit 0.6.13). Grundlage: Befunddatei
// ki-lead-befund_technik_2026-W44-A3.json vom 30.10.2026 (Arbeitspaket A3), TP-2026-W44-44 und TP-2026-W44-45.
import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { aushaengen, dialogAntwort, einhaengen, klick, reactUmgebung } from "../support/dom";

/** IndexedDB-Attrappe mit getrennten Datenbanken: Standardspeicher und eigene Speicher aus createStore() */
const dbs = vi.hoisted(() => new Map<string, Map<string, unknown>>());
vi.mock("idb-keyval", () => {
  const db = (s?: unknown) => {
    const name = typeof s === "string" ? s : "keyval-store";
    if (!dbs.has(name)) dbs.set(name, new Map());
    return dbs.get(name)!;
  };
  return {
    createStore: (name: string) => name,
    get: async (k: string, s?: unknown) => structuredClone(db(s).get(k)),
    set: async (k: string, v: unknown, s?: unknown) => void db(s).set(k, structuredClone(v)),
    del: async (k: string, s?: unknown) => void db(s).delete(k),
    keys: async (s?: unknown) => [...db(s).keys()],
    entries: async (s?: unknown) => [...db(s).entries()].map(([k, v]) => [k, structuredClone(v)]),
    clear: async (s?: unknown) => void db(s).clear(),
    setMany: async (e: [string, unknown][], s?: unknown) => e.forEach(([k, v]) => db(s).set(k, structuredClone(v))),
  };
});

const { sicherungErstellen, sicherungLesen, sicherungEinspielen, geraetestandLoeschen, SICHERUNG_FORMAT } = await import("../../src/speicher/sicherung");
const { DatenBereich } = await import("../../src/ui/Daten");

const MARKE = "sk-test-ERKENNUNGSMARKE-A3";
const ZIP = new Uint8Array([80, 75, 3, 4, 0, 255, 128, 7]);
const ZEIT = new Date("2026-10-14T12:00:00Z");

/** Gerätestand mit Inhalten, Schlüsseln aller Ablagen und Testlaufarchiv */
function fuellen() {
  dbs.clear();
  const g = new Map<string, unknown>([
    ["profil:lead.beispiel", { schluessel: "lead.beispiel", dateien: { "profil.json": "{}" } }],
    ["aktives-profil", "lead.beispiel"],
    ["entwurf:lead.beispiel", { daten: { land: "TH" } }],
    ["lauf:L1", { id: "L1", erstellt: ZEIT, kosten: 1.2 }],
    ["einstellungen", { fassung: 6 }],
    ["schluessel:anthropic", MARKE],
    ["schluessel-ablage", "geraet"],
    ["schluessel-verschluesselt:openai", { iv: "x", daten: "y" }],
    ["schluessel-passphrase", { salz: "z" }],
  ]);
  dbs.set("keyval-store", g);
  dbs.set(
    "ki-lead-testlaeufe",
    new Map<string, unknown>([
      ["eintrag:T1", { id: "T1", titel: "S1 + S2 + S3" }],
      ["zip:T1", ZIP],
    ]),
  );
}

beforeEach(fuellen);

describe("Sicherung des Gerätestands", () => {
  it("TP-2026-W44-44: enthält Inhalte und Testlaufarchiv, aber keinen Eintrag zu API-Schlüsseln", async () => {
    const { text, eintraege } = await sicherungErstellen(new Date("2026-10-30T20:00:00Z"));
    expect(text).not.toContain(MARKE);
    const s = JSON.parse(text);
    expect(s.format).toBe(SICHERUNG_FORMAT);
    expect(s.geraetespeicher.map((e: [string]) => e[0]).sort()).toEqual([
      "aktives-profil",
      "einstellungen",
      "entwurf:lead.beispiel",
      "lauf:L1",
      "profil:lead.beispiel",
    ]);
    expect(s.testlaeufe.map((e: [string]) => e[0]).sort()).toEqual(["eintrag:T1", "zip:T1"]);
    expect(eintraege).toBe(7);
  });

  it("TP-2026-W44-44: Rundreise ergibt denselben Stand; Binärdaten und Zeitpunkte bleiben erhalten, Schlüssel des Zielgeräts bleiben", async () => {
    const { text } = await sicherungErstellen();
    // Zielgerät: anderer Stand, eigener Schlüssel
    dbs.set(
      "keyval-store",
      new Map<string, unknown>([
        ["entwurf:anderes", { x: 1 }],
        ["schluessel:openai", "sk-ziel"],
      ]),
    );
    dbs.set("ki-lead-testlaeufe", new Map<string, unknown>([["eintrag:T9", {}]]));
    await sicherungEinspielen(sicherungLesen(text));
    const g = dbs.get("keyval-store")!;
    expect([...g.keys()].sort()).toEqual(["aktives-profil", "einstellungen", "entwurf:lead.beispiel", "lauf:L1", "profil:lead.beispiel", "schluessel:openai"]);
    expect(g.get("schluessel:openai")).toBe("sk-ziel");
    expect((g.get("lauf:L1") as { erstellt: Date }).erstellt).toEqual(ZEIT);
    const t = dbs.get("ki-lead-testlaeufe")!;
    expect([...t.keys()].sort()).toEqual(["eintrag:T1", "zip:T1"]);
    // Vergleich über Art und Bytes: der Wert stammt aus einem anderen Realm (jsdom), toEqual vergleicht auch den Konstruktor
    expect(Object.prototype.toString.call(t.get("zip:T1"))).toBe("[object Uint8Array]");
    expect(Array.from(t.get("zip:T1") as Uint8Array)).toEqual(Array.from(ZIP));
  });

  it.each([
    ["kein JSON", "{kaputt", "kein gültiges JSON"],
    ["fremdes Format", JSON.stringify({ format: "anderes/1" }), "keine Sicherung von KI-LEAD"],
    ["unvollständig", JSON.stringify({ format: "ki-lead-sicherung/1", geraetespeicher: [] }), "unvollständig"],
    ["mit Schlüssel", JSON.stringify({ format: "ki-lead-sicherung/1", geraetespeicher: [["schluessel:anthropic", "x"]], testlaeufe: [] }), "API-Schlüsseln"],
  ])("TP-2026-W44-44: lehnt ab: %s", (_name, text, meldung) => {
    expect(() => sicherungLesen(text)).toThrow(meldung);
  });
});

describe("Alle Daten dieses Geräts löschen", () => {
  it("TP-2026-W44-45: leert Gerätespeicher einschließlich Schlüssel und Testlaufarchiv", async () => {
    await geraetestandLoeschen();
    expect(dbs.get("keyval-store")!.size).toBe(0);
    expect(dbs.get("ki-lead-testlaeufe")!.size).toBe(0);
  });
});

describe("Bereich „Daten“", () => {
  beforeAll(reactUmgebung);
  afterEach(aushaengen);

  it("TP-2026-W44-45: Abbrechen der Rückfrage löscht nichts", async () => {
    const neu = vi.fn();
    localStorage.setItem("ki-lead-darstellung", JSON.stringify({ version: 1, auswahl: "bund" }));
    await einhaengen(React.createElement(DatenBereich, { neuStarten: neu }));
    const frage = dialogAntwort(false);
    await klick("Alle Daten dieses Geräts löschen");
    expect(frage).toHaveBeenCalledOnce();
    expect(dbs.get("keyval-store")!.size).toBe(9);
    expect(localStorage.getItem("ki-lead-darstellung")).not.toBeNull();
    expect(neu).not.toHaveBeenCalled();
  });

  it("TP-2026-W44-45: Bestätigen löscht Speicher, Testläufe und Farbschema und startet neu", async () => {
    const neu = vi.fn();
    localStorage.setItem("ki-lead-darstellung", JSON.stringify({ version: 1, auswahl: "bund" }));
    await einhaengen(React.createElement(DatenBereich, { neuStarten: neu }));
    dialogAntwort(true);
    await klick("Alle Daten dieses Geräts löschen");
    await vi.waitFor(() => expect(neu).toHaveBeenCalledOnce());
    expect(dbs.get("keyval-store")!.size).toBe(0);
    expect(dbs.get("ki-lead-testlaeufe")!.size).toBe(0);
    expect(localStorage.getItem("ki-lead-darstellung")).toBeNull();
  });
});
