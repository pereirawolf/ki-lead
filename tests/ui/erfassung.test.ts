// @vitest-environment jsdom
// Erfassungsmaske: Zeitfelder mit „Jetzt“, „Nur Tag“ und „Leeren“; Baukasten für Quellenzeilen.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { profil, profilPflicht } from "../support/dateien";
import { ilkaDatei } from "../support/fixtures";
import { aushaengen, bisWahr, einhaengen, eingeben, klick, knopf, reactUmgebung } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";

const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(speicher);
  localStorage.clear();
  vi.resetModules();
});

async function zeigeApp() {
  const { default: App } = await import("../../src/App");
  await einhaengen(React.createElement(App));
  await bisWahr(() => expect(document.querySelectorAll(".datumzeit-feld").length).toBeGreaterThan(1));
}
async function zuSchritt(name: RegExp) {
  await klick([...document.querySelectorAll("nav.schritte button")].find((e) => name.test(e.textContent || "")) as HTMLButtonElement);
}
const feldEingabe = (feld: HTMLElement, typ: "date" | "time") => feld.querySelector(`input[type="${typ}"]`) as HTMLInputElement;

describe("Erfassungsmaske", () => {
  it("Meldezeitpunkt „Jetzt“ und „Leeren“; Meldezeitraum mit Uhrzeit und „Nur Tag“", async () => {
    await zeigeApp();
    const felder = () => [...document.querySelectorAll(".datumzeit-feld")] as HTMLElement[];
    await klick(knopf("Leeren: Meldezeitpunkt zurücksetzen", felder()[0]));
    expect(feldEingabe(felder()[0], "date").value).toBe("");
    expect(feldEingabe(felder()[0], "time").disabled).toBe(true);
    await klick(knopf("Jetzt: Meldezeitpunkt auf aktuelle Zeit setzen", felder()[0]));
    expect(feldEingabe(felder()[0], "date").value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(feldEingabe(felder()[0], "time").value).toMatch(/^\d{2}:\d{2}$/);

    await eingeben(feldEingabe(felder()[1], "date"), "2026-10-13");
    expect(knopf("Nur Tag: Uhrzeit bei Meldezeitraum, von entfernen", felder()[1])).toBeUndefined();
    await eingeben(feldEingabe(felder()[1], "time"), "06:00");
    expect(feldEingabe(felder()[1], "time").value).toBe("06:00");
    await klick(knopf("Nur Tag: Uhrzeit bei Meldezeitraum, von entfernen", felder()[1]));
    expect(feldEingabe(felder()[1], "date").value).toBe("2026-10-13");
    expect(feldEingabe(felder()[1], "time").value).toBe("");

    // Meldezeitpunkt ohne Uhrzeit: Hinweis
    await eingeben(feldEingabe(felder()[0], "time"), "");
    expect(felder()[0].textContent).toContain("Uhrzeit ergänzen");
  });

  it("unfertige Eingabe im Tagesfeld behält Tag und Uhrzeit", async () => {
    await zeigeApp();
    const feld = () => document.querySelector(".datumzeit-feld") as HTMLElement;
    const vorher = feldEingabe(feld(), "time").value;
    expect(vorher).toMatch(/^\d{2}:\d{2}$/);
    const tag = feldEingabe(feld(), "date");
    Object.defineProperty(tag, "validity", { configurable: true, get: () => ({ badInput: true }) });
    await eingeben(tag, "");
    expect(feldEingabe(feld(), "time").value).toBe(vorher);
    expect(feldEingabe(feld(), "date").value).toMatch(/^\d{4}-/);
  });

  it("Quellen: Kategorie und Art kombinieren, Zeile anfügen, Platzhalter markiert", async () => {
    await zeigeApp();
    await zuSchritt(/Quellen/);
    const bk = document.querySelector(".quellen-baukasten") as HTMLElement;
    const radio = (text: string) => [...bk.querySelectorAll("label")].find((l) => l.textContent?.trim() === text)!.querySelector("input") as HTMLInputElement;
    await klick(radio("M"));
    await klick(radio("Online-Quelle (URL)"));
    await klick(radio("Paywall"));
    expect(bk.querySelector(".quellen-vorschau code")!.textContent).toMatch(/^\[Q1\] M – Herausgeber .*URL \(Paywall\) \[Zugriff: \d{2}\.\d{2}\.\d{4}\]$/);
    await klick(knopf("Zeile anfügen", bk));
    const ta = document.querySelector("textarea.quellen-text") as HTMLTextAreaElement;
    expect(ta.value).toMatch(/^\[Q1\] M – Herausgeber/);
    expect(ta.value.slice(ta.selectionStart, ta.selectionEnd)).toBe("Herausgeber");
    // Art mit Kategorievorschlag: soziale Medien → P, Nummer zählt weiter
    await klick(radio("Beitrag in sozialen Medien"));
    await klick(knopf("Zeile anfügen", bk));
    expect(ta.value.split("\n")[1]).toMatch(/^\[Q2\] P – Konto \(@Kennung\)/);
    expect(ta.value.slice(ta.selectionStart, ta.selectionEnd)).toBe("Konto");
  });

  it("Quellen: Meldung aus dem gespeicherten Lagebild übernehmen", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const { name, daten } = ilkaDatei("HE");
    speicher.werte.set(`lagebild:${p.manifest.id}`, { dateien: [{ name, text: JSON.stringify(daten, null, 2), importiertAm: "2026-10-20T10:00:00Z" }] });
    await zeigeApp();
    await zuSchritt(/Quellen/);
    const bk = document.querySelector(".quellen-baukasten") as HTMLElement;
    const radio = [...bk.querySelectorAll("label")]
      .find((l) => l.textContent?.trim() === "Meldung aus dem Lagebild")!
      .querySelector("input") as HTMLInputElement;
    await klick(radio);
    await bisWahr(() => expect((bk.querySelector(".quellen-lagemeldung select") as HTMLSelectElement | null)?.options).toHaveLength(1));
    const select = bk.querySelector(".quellen-lagemeldung select") as HTMLSelectElement;
    expect(select.options[0].textContent).toMatch(/^Hessen/);
    expect(bk.querySelector(".quellen-vorschau code")!.textContent).toMatch(
      new RegExp(
        `^\\[Q1\\] A – Hessen, .*\\(14\\.10\\.2026, 10:15 Uhr\\): Lagemeldung \\(behördenintern\\), Datei „${name.replace(/[.]/g, "\\.")}“ \\[Zugriff: \\d{2}\\.\\d{2}\\.\\d{4}\\]$`,
      ),
    );
  });

  // Befunde am Feld (seit 0.6.5): Pflicht- und Schemabefunde erscheinen am Feld, nicht nur im Prüfschritt
  it("TP-2026-W44-15: leeres Pflichtfeld trägt aria-invalid und einen per aria-describedby verknüpften Fehlertext", async () => {
    await zeigeApp();
    await zuSchritt(/Ereignisse\/Sachverhalte/);
    const bezeichnung = () => document.querySelector('[data-feld="sachverhalte/0/bezeichnung"] input') as HTMLInputElement;
    // seit 0.6.20 (UX-2026-W44-05) erst nach dem Verlassen des Feldes
    await act(async () => {
      bezeichnung().focus();
      bezeichnung().blur();
    });
    expect(bezeichnung().getAttribute("aria-invalid")).toBe("true");
    const ids = (bezeichnung().getAttribute("aria-describedby") || "").split(" ");
    const texte = ids.map((id) => document.getElementById(id)?.textContent || "");
    expect(texte).toContain("Pflichtangabe fehlt.");
    expect(bezeichnung().closest(".feld")?.querySelector(".feld-label")?.classList.contains("pflicht")).toBe(true);

    await eingeben(bezeichnung(), "Sturmfolgen");
    expect(bezeichnung().hasAttribute("aria-invalid")).toBe(false);
    expect(bezeichnung().closest(".feld")?.querySelector(".feld-fehler")).toBeNull();
  });

  it("UX-2026-W44-05: neue Meldung zeigt fehlende Pflichtangaben erst nach Bearbeiten oder nach dem Prüfschritt", async () => {
    await zeigeApp();
    await zuSchritt(/Ereignisse\/Sachverhalte/);
    const bezeichnung = () => document.querySelector('[data-feld="sachverhalte/0/bezeichnung"] input') as HTMLInputElement;
    expect(bezeichnung().hasAttribute("aria-invalid")).toBe(false);
    expect(document.querySelector(".feld-fehler")).toBeNull();
    await zuSchritt(/Prüfen & Exportieren/);
    await zuSchritt(/Ereignisse\/Sachverhalte/);
    expect(bezeichnung().getAttribute("aria-invalid")).toBe("true");
  });

  it("UX-2026-W44-11/-12: fehlende Bezeichnung einmal im Prüfschritt; ohne bestandene Prüfung ist der Entwurf hervorgehoben", async () => {
    await zeigeApp();
    await zuSchritt(/Prüfen & Exportieren/);
    const sprung = [...document.querySelectorAll("button.befund-sprung")].filter((b) => /Bezeichnung/.test(b.textContent || ""));
    expect(sprung).toHaveLength(1);
    expect(knopf("Entwurf als JSON speichern")?.classList.contains("primaer")).toBe(true);
    expect(knopf("Final als JSON exportieren")?.classList.contains("primaer")).toBe(false);
    expect(document.querySelector(".ausgabe-stand")?.textContent).toMatch(/\d+ Abweichung\(en\) offen/);
  });

  it("UX-2026-W44-06: Schrittleiste zeigt Befunde je Schritt statt „erledigt“ nach Position", async () => {
    await zeigeApp();
    await zuSchritt(/Prüfen & Exportieren/);
    const knopf = (re: RegExp) => [...document.querySelectorAll<HTMLButtonElement>(".schritte .schritt")].find((b) => re.test(b.textContent || ""))!;
    expect(knopf(/Ereignisse\/Sachverhalte/).querySelector(".schritt-befund")).toBeTruthy();
    expect(knopf(/Ereignisse\/Sachverhalte/).textContent).toMatch(/1 Feld mit Befund/);
    expect(knopf(/Meldungsmetadaten/).querySelector(".schritt-befund")).toBeNull();
    expect(document.querySelector(".schritte .erledigt")).toBeNull();
  });

  it("TP-2026-W44-15: ein Befund im Prüfschritt wechselt in den Schritt und fokussiert das Feld", async () => {
    await zeigeApp();
    await zuSchritt(/Prüfen & Exportieren/);
    const befund = [...document.querySelectorAll("button.befund-sprung")].find((b) => /Bezeichnung/.test(b.textContent || "")) as HTMLButtonElement;
    expect(befund, "Befund zur Bezeichnung als Schaltfläche").toBeTruthy();
    await klick(befund);
    expect(document.querySelector("#schritt-titel")?.textContent).toBe("Ereignisse/Sachverhalte");
    expect(document.activeElement).toBe(document.querySelector('[data-feld="sachverhalte/0/bezeichnung"] input'));
  });

  // Farben der Bewertung nach Rang (seit 0.6.5): Ein Profil mit anderen Stufenwörtern behält die Farben
  it("TP-2026-W44-16: Vorlage profile/muster: Bewertungsfeld und Sachverhalt tragen data-rang, auch bei anderen Stufenwörtern", async () => {
    const { MeldungAnsicht } = await import("../../src/ui/Meldung");
    const muster = await profilPflicht("muster");
    const zeigen = async (p: typeof muster, bewertung: string) => {
      await einhaengen(React.createElement(MeldungAnsicht, { profil: p, meldung: { sachverhalte: [{ bewertung }] }, setMeldung: () => {}, neu: () => {} }));
      await zuSchritt(/^2?Sachverhalte/);
    };
    const gewaehlt = () => document.querySelector(".segmente .segment.an") as HTMLElement;
    const element = () => document.querySelector("section.element") as HTMLElement;

    await zeigen(muster, "kritisch");
    expect(gewaehlt().textContent).toBe("kritisch");
    expect(gewaehlt().dataset.rang).toBe("3");
    expect(element().dataset.rang).toBe("3");
    await aushaengen();

    await zeigen(muster, "geringfügig");
    expect(gewaehlt().dataset.rang).toBe("1");
    expect(element().dataset.rang).toBe("1");
    await aushaengen();

    // Gleiche Vorlage mit eigenen Stufenwörtern: Rang nach der Reihenfolge der Aufzählung
    const eigene = structuredClone(muster);
    eigene.schema.properties.sachverhalte.items.properties.bewertung.enum = ["", "niedrig", "mittel", "hoch"];
    await zeigen(eigene, "mittel");
    expect(gewaehlt().textContent).toBe("mittel");
    expect(gewaehlt().dataset.rang).toBe("2");
    expect(element().dataset.rang).toBe("2");
    expect(element().className).toBe("element");
  });
});
