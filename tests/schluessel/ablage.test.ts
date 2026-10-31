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

const {
  ABLAGEN,
  ablageLesen,
  ablageWechseln,
  nativSetzen,
  passphraseEntsperren,
  passphraseGesperrt,
  passphraseSperren,
  passphraseVerwerfen,
  PBKDF2_ITERATIONEN,
  schluesselbundSetzen,
  alleSchluesselLesen,
  schluesselSchreiben,
} = await import("../../src/schluessel/ablage");
const { STANDARD } = await import("../../src/pipeline/einstellungen");
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
  passphraseSperren();
  nativSetzen(null);
  bundAttrappe();
  // Sitzungsablage leeren
  for (const a of ["anthropic", "openai"] as const) await ABLAGEN.find((x) => x.id === "sitzung")!.schreiben(a, "");
});

describe("Ablage der API-Schlüssel", () => {
  it("nutzt ohne Wahl den Gerätespeicher unter den bisherigen Schlüsseln (bestehende Schlüssel bleiben gültig)", async () => {
    speicher.set("schluessel:anthropic", "sk-ant-alt");
    expect(await ablageLesen()).toBe("geraet");
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-alt", openai: "", mistral: "", stelle: "" });
  });

  it("bietet vier Ablagen an (seit 0.6.2 mit Passphrase); der Systemschlüsselbund nur in der nativen App", () => {
    expect(ABLAGEN.map((a) => a.id)).toEqual(["geraet", "sitzung", "passphrase", "system"]);
    nativSetzen(false);
    expect(ABLAGEN.map((a) => a.verfuegbar())).toEqual([true, true, true, false]);
    nativSetzen(true);
    expect(ABLAGEN.map((a) => a.verfuegbar())).toEqual([true, true, true, true]);
  });

  it("Sitzung: zieht die Schlüssel aus dem Gerätespeicher um und speichert nichts", async () => {
    await schluesselSchreiben("sk-ant-A");
    await schluesselSchreiben("sk-oai-B", "openai");
    await ablageWechseln("sitzung");
    expect(await ablageLesen()).toBe("sitzung");
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "sk-oai-B", mistral: "", stelle: "" });
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
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "", mistral: "", stelle: "" });
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

// Passphrase-Ablage (seit 0.6.2, TP-2026-W44-09): PBKDF2 + AES-GCM über WebCrypto, Schlüssel nur im Arbeitsspeicher
describe("TP-2026-W44-09: Ablage mit Passphrase", () => {
  const PASS = "Orkan Ilka 2026!";

  it("Round-trip: Schlüssel ziehen verschlüsselt um und sind nach dem Entsperren wieder lesbar; im Speicher steht kein Klartext", async () => {
    await schluesselSchreiben("sk-ant-A");
    await schluesselSchreiben("sk-oai-B", "openai");
    expect(await passphraseEntsperren(PASS)).toBe(true);
    await ablageWechseln("passphrase");
    expect(await ablageLesen()).toBe("passphrase");
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "sk-oai-B", mistral: "", stelle: "" });
    // Kein Klartext und keine Passphrase im Gerätespeicher; Iterationen und Salz im Kopfdatensatz
    const gespeichert = JSON.stringify([...speicher.entries()]);
    expect(gespeichert).not.toContain("sk-");
    expect(gespeichert).not.toContain(PASS);
    expect(speicher.has("schluessel:anthropic")).toBe(false);
    expect(speicher.get("schluessel-passphrase")).toMatchObject({ iterationen: 600_000 });
    expect(PBKDF2_ITERATIONEN).toBe(600_000);
    // Neue Sitzung: gesperrt, nichts lesbar; mit derselben Passphrase wieder da
    passphraseSperren();
    expect(passphraseGesperrt()).toBe(true);
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "", openai: "", mistral: "", stelle: "" });
    expect(await passphraseEntsperren(PASS)).toBe(true);
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "sk-ant-A", openai: "sk-oai-B", mistral: "", stelle: "" });
  });

  it("eine falsche Passphrase liefert keinen Schlüssel und lässt die Ablage gesperrt", async () => {
    expect(await passphraseEntsperren(PASS)).toBe(true);
    await ablageWechseln("passphrase");
    await schluesselSchreiben("sk-ant-A");
    passphraseSperren();
    expect(await passphraseEntsperren("falsch")).toBe(false);
    expect(await passphraseEntsperren("")).toBe(false);
    expect(passphraseGesperrt()).toBe(true);
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "", openai: "", mistral: "", stelle: "" });
  });

  it("gesperrt: Schreiben scheitert verständlich, und ein Wechsel weg von der Passphrase ist verweigert, damit nichts verloren geht", async () => {
    expect(await passphraseEntsperren(PASS)).toBe(true);
    await ablageWechseln("passphrase");
    await schluesselSchreiben("sk-ant-A");
    passphraseSperren();
    await expect(schluesselSchreiben("sk-ant-B")).rejects.toThrow(/gesperrt/);
    await expect(ablageWechseln("geraet")).rejects.toThrow(/gesperrt/);
    expect(await ablageLesen()).toBe("passphrase");
    // Entsperrt zieht der Wechsel die Schlüssel zurück in den Gerätespeicher und entfernt die verschlüsselten
    expect(await passphraseEntsperren(PASS)).toBe(true);
    await ablageWechseln("geraet");
    expect(speicher.get("schluessel:anthropic")).toBe("sk-ant-A");
    expect(speicher.has("schluessel-verschluesselt:anthropic")).toBe(false);
  });

  it("ohne entsperrte Passphrase lässt sich nicht in die Passphrase-Ablage wechseln; alles bleibt unverändert", async () => {
    await schluesselSchreiben("sk-ant-A");
    await expect(ablageWechseln("passphrase")).rejects.toThrow(/gesperrt/);
    expect(await ablageLesen()).toBe("geraet");
    expect(speicher.get("schluessel:anthropic")).toBe("sk-ant-A");
  });

  it("Passphrase vergessen: verschlüsselte Schlüssel und Kopf werden verworfen, danach gilt eine neue Passphrase", async () => {
    expect(await passphraseEntsperren(PASS)).toBe(true);
    await ablageWechseln("passphrase");
    await schluesselSchreiben("sk-ant-A");
    passphraseSperren();
    await passphraseVerwerfen();
    expect([...speicher.keys()].filter((k) => k.startsWith("schluessel-verschluesselt:") || k === "schluessel-passphrase")).toEqual([]);
    expect(await passphraseEntsperren("neu")).toBe(true);
    expect(await alleSchluesselLesen()).toEqual({ anthropic: "", openai: "", mistral: "", stelle: "" });
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
        schluessel: { anthropic: "", openai: "", mistral: "", stelle: "" },
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
    expect(html).toContain("Gerätespeicher, mit Passphrase verschlüsselt");
    expect(html).toContain("(hier nicht verfügbar)");
    expect(html).toMatch(/value="system"[^>]*disabled|disabled[^>]*value="system"/);
    expect(html).toContain("Ablage: Gerätespeicher der App (unverschlüsselt)");
  });
});

describe("TP-2026-W44-09: Einstellungen mit Passphrase-Ablage", () => {
  it("fragt bei gesperrter Passphrase-Ablage die Passphrase ab und nennt die Sperre beim Schlüssel", () => {
    passphraseSperren();
    const html = renderToStaticMarkup(
      createElement(EinstellungenAnsicht, {
        profil: null,
        einstellungen: STANDARD,
        setEinstellungen: () => undefined,
        schluessel: { anthropic: "", openai: "", mistral: "", stelle: "" },
        setSchluessel: () => undefined,
        ablage: "passphrase",
        setAblage: async () => undefined,
        bereich: "anbieter",
      }),
    );
    expect(html).toMatch(/<input type="password"[^>]*autoComplete="new-password"/);
    expect(html).toContain("Neue Passphrase festlegen");
    expect(html).toContain("Festlegen und verschlüsseln");
    expect(html).toContain("(gesperrt; Passphrase oben eingeben)");
  });
});
