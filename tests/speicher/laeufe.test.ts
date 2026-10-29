// Laden der Laufprotokolle aus IndexedDB (seit 0.6.2, TP-2026-W44-10): nur die Schlüssel „lauf:…“, nicht der ganze Speicher.
// Seit 0.6.3 (TP-2026-W44-24) in src/speicher/laufSpeicher.ts.
import { afterEach, describe, expect, it, vi } from "vitest";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

import * as idb from "idb-keyval";
import { laeufeLaden, speicherSchuetzen } from "../../src/speicher/laufSpeicher";

afterEach(() => {
  speicherLeeren(speicher);
  vi.clearAllMocks();
});

describe("TP-2026-W44-10: Laufprotokolle laden", () => {
  it("liest nur die Schlüssel „lauf:…“ über keys() und getMany(), nie entries(); jüngste zuerst", async () => {
    speicher.werte.set("lauf:a", { id: "a", erstellt: "2026-10-14T10:00:00Z", stufen: [] });
    speicher.werte.set("lauf:b", { id: "b", erstellt: "2026-10-15T10:00:00Z", stufen: [] });
    speicher.werte.set("profil:x", { dateien: { "sop.md": "x".repeat(10_000) } });
    speicher.werte.set("einstellungen", { modelle: {} });
    const l = await laeufeLaden();
    expect(l.map((x) => x.id)).toEqual(["b", "a"]);
    expect(idb.keys).toHaveBeenCalledTimes(1);
    expect(idb.getMany).toHaveBeenCalledWith(["lauf:a", "lauf:b"]);
    expect(idb.entries).not.toHaveBeenCalled();
    expect(idb.get).not.toHaveBeenCalled();
  });

  it("ein in der Zwischenzeit gelöschter Lauf fällt still weg", async () => {
    speicher.werte.set("lauf:a", { id: "a", erstellt: "2026-10-14T10:00:00Z", stufen: [] });
    speicher.lesen = (k) => (k === "lauf:a" ? Promise.resolve(null) : undefined);
    expect(await laeufeLaden()).toEqual([]);
  });

  it("speicherSchuetzen fragt navigator.storage.persist einmal je Sitzung an und ist ohne Unterstützung folgenlos", async () => {
    const persist = vi.fn(async () => true);
    vi.stubGlobal("navigator", { storage: { persist } });
    try {
      expect(await speicherSchuetzen()).toBe(true);
      expect(await speicherSchuetzen()).toBeNull();
      expect(persist).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
