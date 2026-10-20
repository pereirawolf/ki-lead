import { beforeEach, describe, expect, it, vi } from "vitest";

const speicher = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: async (k: string) => structuredClone(speicher.get(k)),
  set: async (k: string, v: unknown) => void speicher.set(k, structuredClone(v)),
  del: async (k: string) => void speicher.delete(k),
}));

const { STANDARD, einstellungenLesen } = await import("../src/pipeline/einstellungen");

describe("Vorgaben und Umstellung der Einstellungen", () => {
  beforeEach(() => speicher.clear());

  it("S1 arbeitet ab Fassung 3 mit hohem Aufwand", async () => {
    expect(STANDARD.aufwand.vorverarbeitung).toBe("high");
    expect(STANDARD.fassung).toBe(3);
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("high");
  });

  it("hebt die alte Vorgabe „medium“ aus Fassung 2 an", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 2, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium", verdichtung: "low" } });
    const e = await einstellungenLesen();
    expect(e.aufwand.vorverarbeitung).toBe("high");
    expect(e.aufwand.verdichtung).toBe("low");
    expect(e.fassung).toBe(3);
  });

  it("lässt eine bewusst andere Wahl stehen", async () => {
    speicher.set("einstellungen", { ...STANDARD, fassung: 2, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "low" } });
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("low");
  });

  it("stellt Fassung 1 in einem Schritt auf Fassung 3 um", async () => {
    speicher.set("einstellungen", { maxTokensErfassung: 64000, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium", erfassung: "high" } });
    const e = await einstellungenLesen();
    expect(e.maxTokensErfassung).toBe(128000);
    expect(e.aufwand.erfassung).toBe("medium");
    expect(e.aufwand.vorverarbeitung).toBe("high");
    expect(e.fassung).toBe(3);
  });

  it("nach Fassung 3 bleibt „medium“ eine bewusste Wahl", async () => {
    speicher.set("einstellungen", { ...STANDARD, aufwand: { ...STANDARD.aufwand, vorverarbeitung: "medium" } });
    expect((await einstellungenLesen()).aufwand.vorverarbeitung).toBe("medium");
  });
});
