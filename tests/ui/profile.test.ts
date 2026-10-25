// @vitest-environment jsdom
// Profilansicht (seit 0.5.20): verwendetes Profil zuerst und offen, übrige Profile als kompakte Zeile mit
// aufklappbarem Inhalt; fachliche Angaben getrennt von technischen; Lesetexte unter „Lesen“, Prüfbericht und
// Dateien unter „Prüfen“; ein Satz im Kopf statt Begriffserklärung.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { aushaengen, einhaengen, klick, reactUmgebung } from "../support/dom";
import { profil } from "../support/dateien";
import { ProfileAnsicht } from "../../src/ui/Profile";
import type { ProfilEintrag } from "../../src/App";

beforeAll(reactUmgebung);
afterEach(aushaengen);

async function eintrag(name: string, schluessel = name): Promise<ProfilEintrag> {
  const erg = await profil(name);
  return { schluessel, quelle: "eingebaut", dateien: {}, profil: erg.profil, befunde: erg.befunde };
}

async function ansicht(aktiv: string, extra: Partial<React.ComponentProps<typeof ProfileAnsicht>> = {}) {
  const profile = [await eintrag("lead-beispiel"), await eintrag("muster")];
  const aktivieren = vi.fn();
  await einhaengen(
    React.createElement(ProfileAnsicht, {
      profile,
      aktiv,
      aktivieren,
      importieren: async () => ({ ok: true, befunde: [] }),
      loeschen: () => {},
      ...extra,
    }),
  );
  return { aktivieren };
}

const karten = () => [...document.querySelectorAll<HTMLElement>("article.profil")];
const ueberschriften = (k: HTMLElement) => [...k.querySelectorAll("h3")].map((h) => h.textContent);
const summaries = (k: ParentNode) => [...k.querySelectorAll("summary")].map((s) => s.textContent?.trim());

describe("Profilansicht: Reihenfolge und kompakte Zeilen", () => {
  it("zeigt das verwendete Profil zuerst, auch wenn es nicht das erste der Liste ist", async () => {
    await ansicht("muster");
    expect(karten()[0].classList.contains("aktiv")).toBe(true);
    expect(karten()[0].querySelector("h2")?.textContent).toMatch(/Vorlage/);
  });

  it("zeigt den Inhalt des verwendeten Profils offen, den der übrigen hinter einem Aufklappelement", async () => {
    await ansicht("lead-beispiel");
    const [aktiv, ander] = karten();
    expect(aktiv.querySelector(":scope > details.profil-details")).toBeNull();
    expect(ueberschriften(aktiv)).toEqual(["Lesen", "Prüfen"]);
    const zu = ander.querySelector<HTMLDetailsElement>(":scope > details.profil-details")!;
    expect(zu).toBeTruthy();
    expect(zu.open).toBe(false);
    expect(zu.querySelector(":scope > summary")?.textContent).toBe("Angaben, Lesetexte und Prüfung");
    // Kopf bleibt sichtbar: Name, Version und Herkunft, Knopf zum Verwenden
    expect(ander.querySelector(".profil-meta")?.textContent).toMatch(/^Profilversion .+ · Mitgeliefert$/);
    expect([...ander.querySelectorAll("header button")].map((b) => b.textContent)).toContain("Verwenden und Meldung öffnen");
  });

  it("aktiviert nur über „Verwenden und Meldung öffnen“; Aufklappen aktiviert nichts", async () => {
    const { aktivieren } = await ansicht("lead-beispiel");
    const ander = karten()[1];
    const zu = ander.querySelector<HTMLDetailsElement>("details.profil-details")!;
    await act(async () => {
      zu.open = true;
    });
    expect(aktivieren).not.toHaveBeenCalled();
    await klick("Verwenden und Meldung öffnen", ander);
    expect(aktivieren).toHaveBeenCalledWith("muster");
  });
});

describe("Profilansicht: Gruppen „Lesen“ und „Prüfen“", () => {
  it("trennt fachliche Angaben von technischen", async () => {
    await ansicht("lead-beispiel");
    const k = karten()[0];
    const fachlich = [...k.querySelectorAll(":scope > dl.profil-daten dt")].map((d) => d.textContent);
    expect(fachlich).toEqual(["Ebene", "Referenzraum", "SOPs und Bausteine", "Herausgeber"]);
    const pruefen = k.querySelector(`section[aria-labelledby$="-pruefen"]`)!;
    const technisch = [...pruefen.querySelectorAll("dl.profil-technik dt")].map((d) => d.textContent);
    expect(technisch).toEqual(["Schema", "Lizenz", "Prüfsumme"]);
  });

  it("ordnet die Lesetexte unter „Lesen“, Prüfbericht und Dateien unter „Prüfen“, mit einheitlichen Bezeichnungen", async () => {
    await ansicht("lead-beispiel");
    const k = karten()[0];
    const lesen = k.querySelector(`section[aria-labelledby$="-lesen"]`)!;
    const pruefen = k.querySelector(`section[aria-labelledby$="-pruefen"]`)!;
    expect(summaries(lesen).filter((s) => s?.endsWith("lesen"))).toEqual([
      "Arbeitsanweisungen und Kodierleitfaden lesen",
      "SOP-Katalog lesen",
      "Dokumentation lesen",
    ]);
    expect(summaries(pruefen)[0]).toMatch(/^Prüfbericht/);
    expect(summaries(pruefen)[1]).toMatch(/^Dateien \(\d+\)$/);
  });

  it("öffnet beim Sprung zum Prüfbericht auch den zugeklappten Inhalt eines nicht verwendeten Profils", async () => {
    const lead = await eintrag("lead-beispiel");
    const muster = await eintrag("muster");
    muster.befunde = [{ stufe: "warnung", text: "Testwarnung" }];
    await einhaengen(
      React.createElement(ProfileAnsicht, {
        profile: [lead, muster],
        aktiv: "lead-beispiel",
        aktivieren: () => {},
        importieren: async () => ({ ok: true, befunde: [] }),
        loeschen: () => {},
      }),
    );
    Element.prototype.scrollIntoView = () => {};
    const ander = karten()[1];
    const sprung = ander.querySelector<HTMLAnchorElement>(".befund-sprung")!;
    expect(sprung.textContent).toBe("1 Warnung");
    await act(async () => sprung.click());
    expect(ander.querySelector<HTMLDetailsElement>("details.profil-details")!.open).toBe(true);
    expect(ander.querySelector<HTMLDetailsElement>(`details[id$="-bericht"]`)!.open).toBe(true);
  });
});

describe("Profilansicht: Kopf", () => {
  it("erklärt Profile in einem Satz; die Begriffe stehen dort, wo sie gebraucht werden", async () => {
    await ansicht("lead-beispiel");
    const kopf = document.querySelector(".werkzeugleiste-text")!;
    expect(kopf.querySelectorAll("p").length).toBe(1);
    expect(kopf.textContent).not.toContain("Prüfsumme =");
    const k = karten()[0];
    expect(k.querySelector(`section[aria-labelledby$="-pruefen"]`)!.textContent).toContain(
      "Die Profilversion nennt den Stand des Pakets, die Prüfsumme seinen konkreten Inhalt.",
    );
  });
});
