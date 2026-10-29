// @vitest-environment jsdom
// Impressum und „Über KI-LEAD“ (seit 0.5.5): Fuß und Einstellungen verweisen auf Impressum und Datenschutzerklärung,
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
const INHALTSLIZENZ = "https://github.com/pereirawolf/ki-lead/blob/main/LICENSE-CONTENT";

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
    // KP-2026-W43-54: Lizenzen je Bereich
    expect(abschnitt.textContent).toContain("Namensnennung: Heiko Pereira Wolf");
    expect(abschnitt.textContent).toContain("Für eigene und importierte Profile gilt die Lizenz, die ihr Herausgeber angibt");
    expect(abschnitt.textContent).toContain("Eingaben, Meldungen und Lagebilder der Nutzenden erfassen diese Lizenzen nicht.");
  });

  it("verweist auf Impressum, Datenschutzerklärung, Drittkomponenten, Quellcode, Rückmeldung und Erprobung", async () => {
    await einhaengen(React.createElement(UeberAbschnitt));
    const l = links(document);
    expect(l.get("Impressum")?.getAttribute("href")).toBe(IMPRESSUM);
    expect(l.get("Datenschutzerklärung")?.getAttribute("href")).toBe(DATENSCHUTZ);
    expect(l.get("Drittkomponenten und Lizenzen")?.getAttribute("href")).toBe("https://github.com/pereirawolf/ki-lead/blob/main/THIRD-PARTY-NOTICES.md");
    expect(l.get("Lizenzhinweise für Inhalte")?.getAttribute("href")).toBe(INHALTSLIZENZ);
    expect(l.get("Quellcode")?.getAttribute("href")).toBe("https://github.com/pereirawolf/ki-lead");
    expect(l.get("Rückmeldung")?.getAttribute("href")).toBe("https://github.com/pereirawolf/ki-lead/issues/new/choose");
    expect(l.get("Erprobung")?.getAttribute("href")).toBe("https://github.com/pereirawolf/ki-lead/blob/main/docs/ERPROBUNG.md");
  });

  it("öffnet jeden Verweis extern und ohne Zugriff auf das öffnende Fenster", async () => {
    await einhaengen(React.createElement(UeberAbschnitt));
    const alle = [...document.querySelectorAll("a")];
    // seit 0.6.5 (TP-2026-W44-21) dazu die Reparaturseite, ebenfalls in einem neuen Fenster
    expect(alle.length).toBe(8);
    expect(alle.find((a) => a.textContent === "Programmdateien reparieren")?.getAttribute("href")).toBe("./reparatur.html");
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
    // KP-2026-W43-54: Geltungsbereich und Namensnennung im Fuß
    expect(fuss.textContent).toContain(
      "mitgelieferte Beispielprofile unter CC BY 4.0 (Heiko Pereira Wolf), andere Profile unter der Lizenz ihres Herausgebers",
    );
    expect(l.get("Lizenzen")?.getAttribute("href")).toBe(INHALTSLIZENZ);
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
    await klick("Über KI-LEAD");
    await bisWahr(() => expect(document.querySelector("#ueber-titel")?.textContent).toBe("Über KI-LEAD"));
  });
});

describe("Versionen und Netzzugriffe", () => {
  it("die Kennung der App folgt package.json", async () => {
    const { APP_KENNUNG } = await import("../../src/kern/version");
    expect(APP_KENNUNG).toBe(`KI-LEAD ${VERSION}`);
    expect(lies("CITATION.cff")).toMatch(new RegExp(`^version: ${VERSION.replace(/\./g, "\\.")}$`, "m"));
  });

  // README und CHANGELOG nennen die Versionen von App und Beispielprofil (seit 0.6.2, TP-2026-W44-11)
  it("TP-2026-W44-11: README nennt an allen drei Stellen die App-Version aus package.json", () => {
    const readme = lies("README.md");
    const v = VERSION.replace(/\./g, "\\.");
    expect(readme).toMatch(new RegExp(`^\\*\\*Stand:\\*\\* Version ${v},`, "m"));
    expect(readme).toMatch(new RegExp(`die App eine Versionsnummer \\(derzeit ${v}\\)`));
    expect(readme).toMatch(new RegExp(`\\(Version ${v}\\) \\[Software\\]`));
    // keine andere Versionsangabe der App im README
    const andere = [...readme.matchAll(/(?:Version|derzeit) (\d+\.\d+\.\d+)/g)].map((m) => m[1]).filter((x) => x !== VERSION);
    expect(andere).toEqual([]);
  });

  it("TP-2026-W44-11: README nennt die Version des Beispielprofils aus profil.json", () => {
    const profil = JSON.parse(lies("profile", "lead-beispiel", "profil.json")).version as string;
    expect(lies("README.md")).toContain(`(Beispielprofil ${profil})`);
  });

  it("TP-2026-W44-11: der jüngste Abschnitt des CHANGELOG trägt die Version aus package.json", () => {
    const kopf = lies("CHANGELOG.md").match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1];
    expect(kopf).toBe(VERSION);
    expect(lies("CHANGELOG.md")).toMatch(new RegExp(`^\\| ${VERSION.replace(/\./g, "\\.")} \\| `, "m"));
  });

  it("die Content-Security-Policy erlaubt Verbindungen nur zur eigenen Herkunft und zu den KI-Anbietern", () => {
    const csp = lies("index.html").match(/Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
    const connect = csp
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("connect-src"));
    expect(connect).toBe(
      "connect-src 'self' https://api.anthropic.com https://api.openai.com https://api.eu.mistral.ai https://api.mistral.ai http://localhost:11434 http://127.0.0.1:11434",
    );
  });

  it("TP-2026-W44-26: für Ollama lässt die Content-Security-Policy nur localhost und 127.0.0.1 mit Port 11434 zu, und der Adapter prüft dasselbe", async () => {
    const csp = lies("index.html").match(/Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
    const quellen = (csp.split(";").find((s) => s.trim().startsWith("connect-src")) ?? "").trim().split(/\s+/).slice(1);
    // Unverschlüsselt nur diese beiden Quellen, kein Platzhalter, kein anderer Port
    expect(quellen.filter((q) => q.startsWith("http:"))).toEqual(["http://localhost:11434", "http://127.0.0.1:11434"]);
    expect(quellen.some((q) => q.includes("*"))).toBe(false);
    const { ollamaAdresseZulaessig } = await import("../../src/anbieter/ollama");
    for (const ok of ["http://localhost:11434/v1", "http://127.0.0.1:11434/v1", "http://localhost:11434"]) expect(ollamaAdresseZulaessig(ok), ok).toBe(true);
    for (const nein of [
      "http://localhost:8080/v1",
      "http://192.168.1.5:11434/v1",
      "https://localhost:11434/v1",
      "http://localhost.example.org:11434/v1",
      "http://localhost:114340/v1",
    ])
      expect(ollamaAdresseZulaessig(nein), nein).toBe(false);
  });
});
