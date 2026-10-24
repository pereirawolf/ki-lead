// Ablage der API-Schlüssel (M5): Gerätespeicher, nur Sitzung, Schlüsselbund des Systems; Wahl und Umzug beim Wechsel.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const speicher = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: async (k: string) => structuredClone(speicher.get(k)),
  set: async (k: string, v: unknown) => void speicher.set(k, structuredClone(v)),
  del: async (k: string) => void speicher.delete(k),
}));

const { ABLAGEN, ablageLesen, ablageWechseln, nativSetzen, schluesselbundSetzen } = await import("../../src/schluessel/ablage");
const { alleSchluesselLesen, schluesselSchreiben, STANDARD } = await import("../../src/pipeline/einstellungen");
const { EinstellungenAnsicht } = await import("../../src/ui/Einstellungen");

/** Schlüsselbund-Attrappe wie das Plugin: Werte je Schlüssel, Aufrufe mitgeschrieben */
function bundAttrappe(fehlerBeimSchreiben = false) {
  const werte = new Map<string, string>();
  const aufrufe: string[] = [];
  schluesselbundSetzen(async () => ({
    get: async (k) => (aufrufe.push(`get ${k}`), werte.get(k) ?? null),
    set: async (k, w) => {
      aufrufe.push(`set ${k}`);
      if (fehlerBeimSchreiben) throw new Error("Keychain gesperrt");
      werte.set(k, w);
    },
    remove: async (k) => (aufrufe.push(`remove ${k}`), werte.delete(k)),
  }));
  return { werte, aufrufe };
}

beforeEach(async () => {
  speicher.clear();
  nativSetzen(null);
  bundAttrappe();
  // Sitzungsablage leeren
  for (const a of ["anthropic", "openai"] as const) await ABLAGEN.find((x) => x.id === "sitzung")!.schreiben(a, "");
});

describe("Ablage der API-Schlüssel", () => {
  it("nutzt ohne Wahl den Gerätespeicher unter den bisherigen Schlüsseln (bestehende Schlüssel bleiben gültig)", async () => {
    speicher.set("schluessel:anthropic", "sk-ant-alt");
    expect(await ablageLesen()).toBe("geraet");
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-alt", openai: "", mistral: "" });
  });

  it("bietet drei Ablagen an; der Systemschlüsselbund nur in der nativen App", () => {
    expect(ABLAGEN.map((a) => a.id)).toEqual(["geraet", "sitzung", "system"]);
    nativSetzen(false);
    expect(ABLAGEN.map((a) => a.verfuegbar())).toEqual([true, true, false]);
    nativSetzen(true);
    expect(ABLAGEN.map((a) => a.verfuegbar())).toEqual([true, true, true]);
  });

  it("Sitzung: zieht die Schlüssel aus dem Gerätespeicher um und speichert nichts", async () => {
    await schluesselSchreiben("sk-ant-A");
    await schluesselSchreiben("sk-oai-B", "openai");
    await ablageWechseln("sitzung");
    expect(await ablageLesen()).toBe("sitzung");
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "sk-oai-B", mistral: "" });
    expect([...speicher.keys()].filter((k) => k.startsWith("schluessel:"))).toEqual([]);
    expect(JSON.stringify([...speicher.values()])).not.toContain("sk-");
    // Neue Schlüssel bleiben ebenfalls nur im Arbeitsspeicher
    await schluesselSchreiben("sk-ant-C");
    expect(JSON.stringify([...speicher.values()])).not.toContain("sk-ant-C");
  });

  it("System: schreibt in den Schlüsselbund mit eigenem Präfix und entfernt die Schlüssel aus dem Gerätespeicher", async () => {
    nativSetzen(true);
    const bund = bundAttrappe();
    await schluesselSchreiben("sk-ant-A");
    await ablageWechseln("system");
    expect(await ablageLesen()).toBe("system");
    expect(bund.werte.get("schluessel.anthropic")).toBe("sk-ant-A");
    expect(speicher.has("schluessel:anthropic")).toBe(false);
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "", mistral: "" });
    // Löschen entfernt den Eintrag im Schlüsselbund
    await schluesselSchreiben("");
    expect(bund.werte.has("schluessel.anthropic")).toBe(false);
    expect(bund.aufrufe).toContain("remove schluessel.anthropic");
  });

  it("verweigert den Systemschlüsselbund außerhalb der nativen App und lässt alles unverändert", async () => {
    nativSetzen(false);
    await schluesselSchreiben("sk-ant-A");
    await expect(ablageWechseln("system")).rejects.toThrow(/nicht verfügbar/);
    expect(await ablageLesen()).toBe("geraet");
    expect(speicher.get("schluessel:anthropic")).toBe("sk-ant-A");
  });

  it("lässt bei einem Fehler im Schlüsselbund die bisherige Ablage und die Schlüssel unverändert", async () => {
    nativSetzen(true);
    bundAttrappe(true);
    await schluesselSchreiben("sk-ant-A");
    await expect(ablageWechseln("system")).rejects.toThrow(/Keychain gesperrt/);
    expect(await ablageLesen()).toBe("geraet");
    expect(speicher.get("schluessel:anthropic")).toBe("sk-ant-A");
  });

  it("fällt auf den Gerätespeicher zurück, wenn die gespeicherte Wahl hier nicht verfügbar ist", async () => {
    speicher.set("schluessel-ablage", "system");
    nativSetzen(false);
    expect(await ablageLesen()).toBe("geraet");
    speicher.set("schluessel-ablage", "unbekannt");
    expect(await ablageLesen()).toBe("geraet");
  });
});

describe("Einstellungen: Wahl der Ablage", () => {
  it("zeigt alle Ablagen, sperrt nicht verfügbare und nennt die Ablage beim Schlüssel", () => {
    nativSetzen(false);
    const html = renderToStaticMarkup(
      createElement(EinstellungenAnsicht, {
        profil: null,
        einstellungen: STANDARD,
        setEinstellungen: () => undefined,
        schluessel: { anthropic: "", openai: "", mistral: "" },
        setSchluessel: () => undefined,
        ablage: "geraet",
        setAblage: async () => undefined,
        bereich: "anbieter",
      }),
    );
    expect(html).toContain("Ablage der API-Schlüssel");
    expect(html).toContain("Gerätespeicher der App");
    expect(html).toContain("Nur für diese Sitzung");
    expect(html).toContain("Schlüsselbund des Systems");
    expect(html).toContain("(hier nicht verfügbar)");
    expect(html).toMatch(/value="system"[^>]*disabled|disabled[^>]*value="system"/);
    expect(html).toContain("Ablage: Gerätespeicher der App (unverschlüsselt)");
  });
});
