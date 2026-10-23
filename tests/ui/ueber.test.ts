// @vitest-environment jsdom
// Impressum und „Über KI-LEAD“ (seit 0.5.5): Fuß und Einstellungen verweisen auf Impressum und Datenschutzhinweise,
// zeigen die Version aus package.json und öffnen alle Verweise extern; die App verbindet sich weiter nur mit den
// KI-Anbietern (Content-Security-Policy unverändert). Grundlage: Befund „Grundlagen Priorität 2“ vom 24.10.2026.
import { readFileSync } from "node:fs";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { aushaengen, bisWahr, einhaengen, klick, reactUmgebung } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { repoPfad } from "../support/dateien";
import { UeberAbschnitt } from "../../src/ui/Ueber";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
});

const lies = (...teile: string[]) => readFileSync(repoPfad(...teile), "utf-8");
const VERSION = JSON.parse(lies("package.json")).version as string;
const IMPRESSUM = "https://www.pereirawolf.de/impressum.html";
const DATENSCHUTZ = "https://github.com/pereirawolf/ki-lead/blob/main/docs/DATENSCHUTZ.md";

/** Links eines Bereichs als Text → Adresse */
const links = (bereich: ParentNode) => new Map([...bereich.querySelectorAll("a")].map((a) => [a.textContent?.trim(), a]));

describe("Über KI-LEAD (Einstellungen)", () => {
  it("zeigt die Version aus package.json und die Abgrenzung", async () => {
    await einhaengen(React.createElement(UeberAbschnitt));
    const abschnitt = document.querySelector("section[aria-labelledby='ueber-titel']")!;
    expect(abschnitt.querySelector("h2")?.textContent).toBe("Über KI-LEAD");
    expect(abschnitt.textContent).toContain(`Version ${VERSION}.`);
    expect(abschnitt.textContent).toContain("privates Forschungsvorhaben von Heiko Pereira Wolf");
    expect(abschnitt.textContent).toContain("keine Spezifikation einer Behörde oder Einrichtung");
  });

  it("verweist auf Impressum, Datenschutzhinweise, Drittkomponenten, Quellcode, Rückmeldung und Erprobung", async () => {
    await einhaengen(React.createElement(UeberAbschnitt));
    const l = links(document);
    expect(l.get("Impressum")?.getAttribute("href")).toBe(IMPRESSUM);
    expect(l.get("Datenschutzhinweise")?.getAttribute("href")).toBe(DATENSCHUTZ);
    expect(l.get("Drittkomponenten und Lizenzen")?.getAttribute("href")).toBe("https://github.com/pereirawolf/ki-lead/blob/main/THIRD-PARTY-NOTICES.md");
    expect(l.get("Quellcode")?.getAttribute("href")).toBe("https://github.com/pereirawolf/ki-lead");
    expect(l.get("Rückmeldung")?.getAttribute("href")).toBe("https://github.com/pereirawolf/ki-lead/issues/new/choose");
    expect(l.get("Erprobung")?.getAttribute("href")).toBe("https://github.com/pereirawolf/ki-lead/blob/main/docs/ERPROBUNG.md");
  });

  it("öffnet jeden Verweis extern und ohne Zugriff auf das öffnende Fenster", async () => {
    await einhaengen(React.createElement(UeberAbschnitt));
    const alle = [...document.querySelectorAll("a")];
    expect(alle.length).toBe(6);
    for (const a of alle) {
      expect(a.getAttribute("target"), a.textContent!).toBe("_blank");
      expect(a.getAttribute("rel"), a.textContent!).toBe("noopener noreferrer");
    }
  });
});

describe("Fuß der App", () => {
  it("nennt die Version aus package.json und verweist auf Impressum und Datenschutz", async () => {
    vi.resetModules();
    const { default: App } = await import("../../src/App");
    await einhaengen(React.createElement(App));
    await bisWahr(() => expect(document.querySelector("footer.fuss")).toBeTruthy());
    const fuss = document.querySelector("footer.fuss")!;
    expect(fuss.textContent).toContain(`KI-LEAD ${VERSION}.`);
    const l = links(fuss);
    expect(l.get("Impressum")?.getAttribute("href")).toBe(IMPRESSUM);
    expect(l.get("Datenschutz")?.getAttribute("href")).toBe(DATENSCHUTZ);
    for (const a of l.values()) expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("enthält im Quelltext keine fest eingetragene Versionsnummer", () => {
    const fuss = lies("src", "App.tsx").match(/<footer className="fuss">[\s\S]*?<\/footer>/)?.[0];
    expect(fuss).toBeTruthy();
    expect(fuss).not.toMatch(/\d+\.\d+\.\d+/);
  });

  it("der Abschnitt „Über KI-LEAD“ steht in den Einstellungen", async () => {
    vi.resetModules();
    const { default: App } = await import("../../src/App");
    await einhaengen(React.createElement(App));
    await bisWahr(() => expect(document.querySelector("footer.fuss")).toBeTruthy());
    await klick("Einstellungen");
    await bisWahr(() => expect(document.querySelector("#ueber-titel")?.textContent).toBe("Über KI-LEAD"));
  });
});

describe("Versionen und Netzzugriffe", () => {
  it("die Kennung der App folgt package.json", async () => {
    const { APP_KENNUNG } = await import("../../src/pipeline/lauf");
    expect(APP_KENNUNG).toBe(`KI-LEAD ${VERSION}`);
    expect(lies("CITATION.cff")).toMatch(new RegExp(`^version: ${VERSION.replace(/\./g, "\\.")}$`, "m"));
  });

  it("die Content-Security-Policy erlaubt Verbindungen nur zur eigenen Herkunft und zu den KI-Anbietern", () => {
    const csp = lies("index.html").match(/Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
    const connect = csp
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("connect-src"));
    expect(connect).toBe("connect-src 'self' https://api.anthropic.com https://api.openai.com");
  });
});
