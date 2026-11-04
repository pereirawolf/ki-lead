// @vitest-environment jsdom
// Profilansicht (seit 0.5.20): verwendetes Profil zuerst und offen, übrige Profile als kompakte Zeile mit
// aufklappbarem Inhalt; fachliche Angaben getrennt von technischen; Lesetexte unter „Lesen“, Prüfbericht und
// Dateien unter „Prüfen“; ein Satz im Kopf statt Begriffserklärung (Teil 1). Menüs „Profil hinzufügen“ und „Mehr“,
// Befundstatus als Chip, Sprungleiste innerhalb der Karte (Teil 2).
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { aushaengen, einhaengen, klick, reactUmgebung } from "../support/dom";
import { profil } from "../support/dateien";
import { ProfileAnsicht } from "../../src/ui/Profile";
import type { ProfilEintrag } from "../../src/kern/typen";

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

  // Seit UX-2026-W45-27 sind alle Karten gleich aufgebaut und zugeklappt; das verwendete Profil ist nur hervorgehoben
  it("UX-2026-W45-27: zeigt den Inhalt aller Profile hinter demselben Aufklappelement", async () => {
    await ansicht("lead-beispiel");
    const [aktiv, ander] = karten();
    const aktivZu = aktiv.querySelector<HTMLDetailsElement>(":scope > details.profil-details")!;
    expect(aktivZu.open).toBe(false);
    expect(ueberschriften(aktiv)).toEqual(["Angaben", "Lesen", "Prüfen"]);
    const zu = ander.querySelector<HTMLDetailsElement>(":scope > details.profil-details")!;
    expect(zu).toBeTruthy();
    expect(zu.open).toBe(false);
    expect(zu.querySelector(":scope > summary")?.textContent).toBe("Angaben, Lesetexte und Prüfung");
    // Kopf bleibt sichtbar: Name, Version und Herkunft, Knopf zum Verwenden
    expect(ander.querySelector(".profil-meta")?.textContent).toMatch(/^Profilversion .+ · Mitgeliefert$/);
    expect([...ander.querySelectorAll("header button")].map((b) => b.textContent)).toContain("Verwenden");
  });

  it("UX-2026-W45-29: aktiviert nur über „Verwenden“; Aufklappen aktiviert nichts", async () => {
    const { aktivieren } = await ansicht("lead-beispiel");
    const ander = karten()[1];
    const zu = ander.querySelector<HTMLDetailsElement>("details.profil-details")!;
    await act(async () => {
      zu.open = true;
    });
    expect(aktivieren).not.toHaveBeenCalled();
    await klick("Profil „Vorlage – eigene Organisation“ verwenden", ander);
    expect(aktivieren).toHaveBeenCalledWith("muster");
  });
});

describe("Profilansicht: Gruppen „Lesen“ und „Prüfen“", () => {
  it("trennt fachliche Angaben von technischen", async () => {
    await ansicht("lead-beispiel");
    const k = karten()[0];
    const fachlich = [...k.querySelectorAll(`section[aria-labelledby$="-angaben"] dl.profil-daten dt`)].map((d) => d.textContent);
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
    // seit UX-2026-W45-31 gebündelt unter „Technische Angaben“
    expect(summaries(pruefen)[0]).toMatch(/^Technische Angaben/);
    expect(summaries(pruefen)[1]).toMatch(/^Prüfbericht/);
    expect(summaries(pruefen)[2]).toMatch(/^Dateien \(\d+\)$/);
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
    const sprung = ander.querySelector<HTMLAnchorElement>(".befund-chip")!;
    expect(sprung.classList.contains("befund-chip-warnung")).toBe(true);
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

describe("Profilansicht: Menüs, Befundstatus und Sprungleiste (Teil 2)", () => {
  const menueKnopf = (name: string, im: ParentNode = document) =>
    [...im.querySelectorAll<HTMLButtonElement>("button[aria-expanded]")].find((b) => (b.getAttribute("aria-label") || b.textContent)!.startsWith(name))!;
  const eintraege = (k: HTMLButtonElement) => [...k.parentElement!.querySelectorAll(".menue-eintrag")].map((b) => b.textContent);

  it("bündelt den Import im Menü „Profil hinzufügen“ und öffnet die Dateiauswahl über die Einträge", async () => {
    await ansicht("lead-beispiel");
    const k = menueKnopf("Profil hinzufügen");
    expect(k.getAttribute("aria-expanded")).toBe("false");
    expect(knopfMitText("Ordner wählen")).toBeUndefined();
    await klick(k);
    expect(k.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(k.getAttribute("aria-controls")!)).toBeTruthy();
    expect(eintraege(k)).toEqual(["Profilpaket importieren (ZIP)", "Ordner wählen"]);
    const ordner = document.querySelector<HTMLInputElement>("input[webkitdirectory]")!;
    const gewaehlt = vi.spyOn(ordner, "click").mockImplementation(() => {});
    await klick("Ordner wählen");
    expect(gewaehlt).toHaveBeenCalledOnce();
    expect(k.getAttribute("aria-expanded")).toBe("false");
  });

  it("schließt ein Menü mit Escape und gibt den Fokus an den Knopf zurück", async () => {
    await ansicht("lead-beispiel");
    const k = menueKnopf("Profil hinzufügen");
    await klick(k);
    const eintrag = k.parentElement!.querySelector<HTMLButtonElement>(".menue-eintrag")!;
    eintrag.focus();
    await act(async () => {
      eintrag.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(k.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(k);
  });

  it("legt Export und Entfernen ins Menü „Mehr“ der Karte; Entfernen nur bei importierten Profilen", async () => {
    const lead = await eintrag("lead-beispiel");
    const imp = { ...(await eintrag("muster", "importiert-x")), quelle: "importiert" as const };
    const loeschen = vi.fn();
    await einhaengen(
      React.createElement(ProfileAnsicht, {
        profile: [lead, imp],
        aktiv: "lead-beispiel",
        aktivieren: () => {},
        importieren: async () => ({ ok: true, befunde: [] }),
        loeschen,
      }),
    );
    expect(document.querySelector(".aktionen-nachrangig")).toBeNull();
    const [a, b] = karten();
    const mehrA = menueKnopf("Mehr zu Profil", a);
    expect(mehrA.getAttribute("aria-label")).toBe("Mehr zu Profil „LEAD-Beispiel – Koordinierungsstelle“");
    await klick(mehrA);
    expect(eintraege(mehrA)).toEqual(["Als Paket exportieren"]);
    const mehrB = menueKnopf("Mehr zu Profil", b);
    await klick(mehrB);
    expect(eintraege(mehrB)).toEqual(["Als Paket exportieren", "Entfernen"]);
    await klick("Entfernen", b);
    expect(loeschen).toHaveBeenCalledWith("importiert-x");
  });

  it("UX-2026-W45-30: zeigt den Befundstatus als Chip nur bei Fehlern oder Warnungen", async () => {
    const lead = await eintrag("lead-beispiel");
    lead.befunde = [{ stufe: "hinweis", text: "nur ein Hinweis" }];
    const muster = await eintrag("muster");
    muster.befunde = [
      { stufe: "fehler", text: "F" },
      { stufe: "warnung", text: "W" },
    ];
    await einhaengen(
      React.createElement(ProfileAnsicht, {
        profile: [lead, muster],
        aktiv: "lead-beispiel",
        aktivieren: () => {},
        importieren: async () => ({ ok: true, befunde: [] }),
        loeschen: () => {},
      }),
    );
    const [a, b] = karten().map((k) => k.querySelector<HTMLAnchorElement>("header .befund-chip"));
    expect(a).toBeNull();
    expect(b!.textContent).toBe("1 Fehler, 1 Warnung");
    expect(b!.classList.contains("befund-chip-fehler")).toBe(true);
    expect(b!.getAttribute("href")).toMatch(/-bericht$/);
  });

  it("führt die Sprungleiste zu Angaben, Lesen und Prüfen und setzt den Fokus auf die Überschrift", async () => {
    await ansicht("lead-beispiel");
    Element.prototype.scrollIntoView = () => {};
    const k = karten()[0];
    const nav = k.querySelector("nav.profil-sprungleiste")!;
    expect(nav.getAttribute("aria-label")).toBe("Abschnitte von Profil „LEAD-Beispiel – Koordinierungsstelle“");
    const links = [...nav.querySelectorAll<HTMLAnchorElement>("a")];
    expect(links.map((l) => l.textContent)).toEqual(["Angaben", "Lesen", "Prüfen"]);
    for (const l of links) {
      const ziel = document.getElementById(l.getAttribute("href")!.slice(1))!;
      expect(ziel.tagName).toBe("H3");
      await act(async () => l.click());
      expect(document.activeElement).toBe(ziel);
    }
  });
});

function knopfMitText(text: string) {
  return [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === text);
}

describe("UX-2026-W45-28: Eckdaten jeder Karte", () => {
  it("nennt Ebene, Referenzraum, Schema, Lagenradar und SOPs auch bei zugeklappter Karte", async () => {
    await ansicht("lead-beispiel");
    for (const k of karten()) {
      const dl = k.querySelector(":scope > .profil-eckdaten")!;
      expect([...dl.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["Ebene", "Referenzraum", "Schema", "Lagenradar", "SOPs"]);
    }
    const lead = karten()[0].querySelector(".profil-eckdaten")!;
    expect([...lead.querySelectorAll("dd")].map((d) => d.textContent)).toEqual(["Bund", "Bevölkerungsschutz in Deutschland", "LEAD-Meldung-v1", "ja", "17 Dach-SOPs · 18 ergänzende Bausteine"]);
  });
});

describe("UX-2026-W45-29: Verwenden ohne Sprung", () => {
  it("bleibt nach dem Wechsel in der Profilansicht und bietet „Zur Erfassung“ an", async () => {
    const lead = await eintrag("lead-beispiel");
    const muster = await eintrag("muster");
    const zurErfassung = vi.fn();
    function Rahmen() {
      const [aktiv, setAktiv] = React.useState("lead-beispiel");
      return React.createElement(ProfileAnsicht, {
        profile: [lead, muster],
        aktiv,
        aktivieren: async (s: string) => {
          setAktiv(s);
          return true;
        },
        importieren: async () => ({ ok: true, befunde: [] }),
        loeschen: () => {},
        zurErfassung,
      });
    }
    await einhaengen(React.createElement(Rahmen));
    const knopf = [...document.querySelectorAll<HTMLButtonElement>("header button")].find((b) => b.textContent === "Verwenden")!;
    expect(knopf.classList.contains("primaer")).toBe(false);
    await klick(knopf);
    expect(document.querySelector(".profil-gewechselt")?.textContent).toContain("ist in Verwendung");
    await klick("Zur Erfassung");
    expect(zurErfassung).toHaveBeenCalledOnce();
  });
});

describe("UX-2026-W45-30: Name, Kennzeichen und Farben der Karte", () => {
  it("trennt den Klammerzusatz als Kennzeichen ab", async () => {
    const { nameUndZusatz } = await import("../../src/ui/Profile");
    expect(nameUndZusatz("Lagebild Justiz – Landesprofil (Erprobungsentwurf)")).toEqual({ name: "Lagebild Justiz – Landesprofil", zusatz: "Erprobungsentwurf" });
    expect(nameUndZusatz("LEAD-Beispiel – Koordinierungsstelle")).toEqual({ name: "LEAD-Beispiel – Koordinierungsstelle" });
    const justiz = await eintrag("lead-justiz");
    const lead = await eintrag("lead-beispiel");
    lead.profil = { ...lead.profil!, manifest: { ...lead.profil!.manifest, farbschema: { basis: "de-th" } } };
    await einhaengen(
      React.createElement(ProfileAnsicht, {
        profile: [lead, justiz],
        aktiv: "lead-beispiel",
        aktivieren: () => {},
        importieren: async () => ({ ok: true, befunde: [] }),
        loeschen: () => {},
      }),
    );
    const [a, b] = karten();
    expect(b!.querySelector("h2")?.textContent).toBe("Lagebild Justiz – Landesprofil");
    expect(b!.querySelector(".profil-zusatz")?.textContent).toBe("Erprobungsentwurf");
    expect(a!.querySelector(".profil-band")).not.toBeNull();
    expect(b!.querySelector(".profil-band")).toBeNull();
  });
});

describe("UX-2026-W45-31: Technische Angaben und Herausgeber", () => {
  it("bündelt Technisches zugeklappt und verweist auf die Adresse des Herausgebers", async () => {
    await ansicht("lead-beispiel");
    const k = karten()[0];
    const technik = k.querySelector<HTMLDetailsElement>(".profil-technik-details")!;
    expect(technik.open).toBe(false);
    expect(technik.querySelector("dl.profil-technik")).not.toBeNull();
    expect(technik.querySelector('details[id$="-bericht"]')).not.toBeNull();
    const a = k.querySelector<HTMLAnchorElement>('section[aria-labelledby$="-angaben"] a[href^="https://"]')!;
    expect(a.getAttribute("href")).toBe("https://www.pereirawolf.de");
    expect(a.textContent).toBe("pereirawolf.de");
  });
});
