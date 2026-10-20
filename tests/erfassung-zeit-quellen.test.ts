// @vitest-environment jsdom
// Erfassung: Zeitfelder mit „Jetzt“, „Nur Tag“ und „Leeren“; Baukasten für Quellenzeilen.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { profil } from "./hilfen";
import { pruefeRoh } from "../src/kern/validierung";
import { quellenHinweise } from "../src/kern/quellen";
import { erstePlatzhalterstelle, lagemeldungRumpf, naechsteQuellenNr, parseQuellen, quellenZeile, vorgeschlageneKategorie } from "../src/kern/quellen";
import { verbinde, zerlege } from "../src/kern/zeit";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }));
vi.mock("idb-keyval", () => ({
  get: vi.fn(async (k: string) => structuredClone(db.werte.get(k))),
  set: vi.fn(async (k: string, v: any) => void db.werte.set(k, structuredClone(v))),
  del: vi.fn(async (k: string) => void db.werte.delete(k)),
  keys: vi.fn(async () => [...db.werte.keys()]),
  entries: vi.fn(async () => [...db.werte.entries()]),
}));

const HEUTE = "20.10.2026";

describe("Zeitwerte", () => {
  it("zerlegen und verbinden", () => {
    expect(zerlege("2026-10-20T08:15")).toEqual({ tag: "2026-10-20", zeit: "08:15" });
    expect(zerlege("2026-10-20")).toEqual({ tag: "2026-10-20", zeit: "" });
    expect(zerlege("")).toEqual({ tag: "", zeit: "" });
    expect(zerlege("gestern")).toEqual({ tag: "", zeit: "" });
    expect(verbinde("2026-10-20", "08:15", "datum_uhrzeit")).toBe("2026-10-20T08:15");
    expect(verbinde("2026-10-20", "", "datum_uhrzeit")).toBe("2026-10-20");
    expect(verbinde("2026-10-20", "08:15", "datum")).toBe("2026-10-20");
    expect(verbinde("", "08:15", "datumzeit")).toBe("");
  });

  it("Schema des Beispielprofils: Meldezeitraum und Eintritt mit oder ohne Uhrzeit, Meldezeitpunkt nur mit Uhrzeit", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const ordner = join(__dirname, "../profile/lead-beispiel/beispiele/orkantief-ilka");
    const m = JSON.parse(
      readFileSync(
        join(
          ordner,
          readdirSync(ordner).find((n) => n.endsWith(".json"))!,
        ),
        "utf8",
      ),
    );
    const mit = (f: (d: any) => void) => {
      const d = structuredClone(m);
      f(d);
      return pruefeRoh(p.schema, d);
    };
    expect(mit(() => {})).toEqual([]);
    expect(
      mit((d) => {
        d.meldezeitraum = { von: "2026-10-13T06:00", bis: "2026-10-14" };
        d.sachverhalte[0].eintritt = "2026-10-13T21:40";
      }),
    ).toEqual([]);
    expect(mit((d) => (d.sachverhalte[0].eintritt = "2026-10-13T9:40")).length).toBeGreaterThan(0);
    expect(mit((d) => (d.meldezeitpunkt = "2026-10-14"))).toEqual([expect.objectContaining({ text: expect.stringContaining("Uhrzeit fehlt") })]);
    // Freigabedatum bleibt ein reines Datum
    expect(mit((d) => (d.freigabe.freigabe.datum = "2026-10-14T10:00"))).toEqual([expect.objectContaining({ pfad: expect.stringContaining("freigabe") })]);
  });
});

describe("Quellenzeilen", () => {
  it("Kategorie und Art kombinieren", async () => {
    const ui = (await profil("lead-beispiel")).profil!.ui;
    expect(quellenZeile({ nr: 1, kategorie: "A", heute: HEUTE }, ui)).toBe(
      "[Q1] A – Herausgeber (Datum): Titel. Online abrufbar unter: URL [Zugriff: 20.10.2026]",
    );
    expect(quellenZeile({ nr: 3, kategorie: "M", heute: HEUTE }, ui)).toMatch(/^\[Q3\] M – Herausgeber/);
    expect(quellenZeile({ nr: 2, kategorie: "M", art: "url", heute: HEUTE, zusaetze: { paywall: true } }, ui)).toBe(
      "[Q2] M – Herausgeber (Datum): Titel. Online abrufbar unter: URL (Paywall) [Zugriff: 20.10.2026]",
    );
    expect(quellenZeile({ nr: 4, kategorie: "A", art: "lagebild", heute: HEUTE }, ui)).toBe(
      "[Q4] A – Herausgeber (Datum, Uhrzeit): Lagebild „Bezeichnung“, Ausgabe Nr. (behördenintern) [Zugriff: 20.10.2026]",
    );
    expect(quellenZeile({ nr: 5, kategorie: "W", art: "datensatz", heute: HEUTE, zusaetze: { datenstand: true, nichtAusgewertet: true } }, ui)).toBe(
      "[Q5] W – Herausgeber (Datum): Titel (Datensatz). Online abrufbar unter: URL [Zugriff: 20.10.2026] · Datenstand: TT.MM.JJJJ · nicht ausgewertet",
    );
    expect(quellenZeile({ nr: 6, kategorie: "X", art: "auskunft", heute: HEUTE }, ui)).toMatch(/^\[Q6\] Stelle, Funktion/);
    // Paywall ohne URL steht vor dem Zugriffsdatum
    expect(quellenZeile({ nr: 8, kategorie: "W", art: "dokument", heute: HEUTE, zusaetze: { paywall: true } }, ui)).toBe(
      "[Q8] W – Herausgeber (Jahr): Titel. Verlag bzw. Reihe (Paywall) [Zugriff: 20.10.2026]",
    );
    // Jede erzeugte Zeile wird als Quelle mit Kategorie erkannt und hat ein Zugriffsdatum (keine Hinweise der Quellenprüfung)
    for (const art of ["url", "pressemitteilung", "lagebild", "lagemeldung", "datensatz", "social", "auskunft", "dokument"]) {
      const z = quellenZeile({ nr: 7, kategorie: vorgeschlageneKategorie(art, ui) ?? "M", art, heute: HEUTE }, ui);
      expect(parseQuellen(z)[0], art).toMatchObject({ nr: 7, code: expect.stringMatching(/^[ABWMP]$/) });
      expect(
        quellenHinweise({ quellen: z, sachverhalte: [{ analyse: { kern: "[Q7]" } }] } as never, ui)
          .map((b) => b.text)
          .filter((t) => /Zugriff|Kategorie/.test(t)),
        art,
      ).toEqual([]);
    }
  });

  it("vorgeschlagene Kategorie, nächste Nummer, erster Platzhalter", async () => {
    const ui = (await profil("lead-beispiel")).profil!.ui;
    expect(vorgeschlageneKategorie("social", ui)).toBe("P");
    expect(vorgeschlageneKategorie("url", ui)).toBeUndefined();
    expect(vorgeschlageneKategorie("social", { ...ui, quellen: { ...ui.quellen!, kategorien: { A: "amtlich" } } })).toBeUndefined();
    expect(naechsteQuellenNr("")).toBe(1);
    expect(naechsteQuellenNr("[Q1] A – x\n[Q7] M – y\nFolgezeile")).toBe(8);
    const z = "[Q2] M – Herausgeber (Datum): Titel";
    expect(z.slice(...erstePlatzhalterstelle(z)!)).toBe("Herausgeber");
    const a = "[Q1] B – Stelle, Funktion (Datum, Uhrzeit): Auskunft";
    expect(a.slice(...erstePlatzhalterstelle(a)!)).toBe("Stelle, Funktion");
    expect(erstePlatzhalterstelle("[Q1] A – THW (14.10.2026): Lagemeldung")).toBeNull();
  });

  it("ohne Kategorien im Profil: Zeile ohne Kategorie", async () => {
    const ui = (await profil("lead-beispiel")).profil!.ui;
    const ohne = { ...ui, quellen: { vorlage: "[Q{n}] Quelle [Zugriff: {heute}]" } };
    expect(quellenZeile({ nr: 1, kategorie: "A", art: "url", heute: HEUTE }, ohne as never)).toBe(
      "[Q1] Herausgeber (Datum): Titel. Online abrufbar unter: URL [Zugriff: 20.10.2026]",
    );
  });

  it("Meldung aus dem Lagebild", () => {
    expect(lagemeldungRumpf("Hessen · Lagezentrum", "14.10.2026, 10:15 Uhr", false, "x.json")).toBe(
      "Hessen, Lagezentrum (14.10.2026, 10:15 Uhr): Lagemeldung (behördenintern), Datei „x.json“ [Zugriff: {heute}]",
    );
    expect(lagemeldungRumpf("THW", "", true, "y.json")).toBe("THW (Datum): Lagemeldung (Entwurf) (behördenintern), Datei „y.json“ [Zugriff: {heute}]");
  });
});

// ── Oberfläche ───────────────────────────────────────────────
let root: Root | undefined;
beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.confirm = () => true;
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  document.body.innerHTML = "";
  db.werte.clear();
  localStorage.clear();
  vi.resetModules();
});
const warte = (ms = 40) => act(async () => void (await new Promise((r) => setTimeout(r, ms))));
async function zeigeApp() {
  const { default: App } = await import("../src/App");
  const ziel = document.createElement("div");
  document.body.appendChild(ziel);
  root = createRoot(ziel);
  await act(async () => root!.render(React.createElement(App)));
  await warte(80);
}
const knopf = (text: string, im: ParentNode = document) =>
  [...im.querySelectorAll("button")].find((b) => b.textContent?.trim() === text || b.getAttribute("aria-label") === text) as HTMLButtonElement;
async function klick(b: HTMLElement) {
  expect(b).toBeTruthy();
  await act(async () => b.click());
  await warte();
}
function setzen(el: HTMLInputElement | HTMLSelectElement, wert: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, wert);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}
async function zuSchritt(name: RegExp) {
  const b = [...document.querySelectorAll("nav.schritte button")].find((e) => name.test(e.textContent || "")) as HTMLButtonElement;
  await klick(b);
}

describe("Erfassungsmaske", () => {
  it("Meldezeitpunkt „Jetzt“ und „Leeren“; Meldezeitraum mit Uhrzeit und „Nur Tag“", async () => {
    await zeigeApp();
    const felder = () => [...document.querySelectorAll(".datumzeit-feld")] as HTMLElement[];
    const [zeitpunkt, von] = felder();
    await klick(knopf("Leeren: Meldezeitpunkt zurücksetzen", zeitpunkt));
    expect((zeitpunkt.querySelector('input[type="date"]') as HTMLInputElement).value).toBe("");
    expect((zeitpunkt.querySelector('input[type="time"]') as HTMLInputElement).disabled).toBe(true);
    await klick(knopf("Jetzt: Meldezeitpunkt auf aktuelle Zeit setzen", felder()[0]));
    expect((felder()[0].querySelector('input[type="date"]') as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((felder()[0].querySelector('input[type="time"]') as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/);

    await act(async () => setzen(von.querySelector('input[type="date"]') as HTMLInputElement, "2026-10-13"));
    await warte();
    expect(knopf("Nur Tag: Uhrzeit bei Meldezeitraum, von entfernen", felder()[1])).toBeUndefined();
    await act(async () => setzen(felder()[1].querySelector('input[type="time"]') as HTMLInputElement, "06:00"));
    await warte();
    expect((felder()[1].querySelector('input[type="time"]') as HTMLInputElement).value).toBe("06:00");
    await klick(knopf("Nur Tag: Uhrzeit bei Meldezeitraum, von entfernen", felder()[1]));
    expect((felder()[1].querySelector('input[type="date"]') as HTMLInputElement).value).toBe("2026-10-13");
    expect((felder()[1].querySelector('input[type="time"]') as HTMLInputElement).value).toBe("");

    // Meldezeitpunkt ohne Uhrzeit: Hinweis
    await act(async () => setzen(felder()[0].querySelector('input[type="time"]') as HTMLInputElement, ""));
    await warte();
    expect(felder()[0].textContent).toContain("Uhrzeit ergänzen");
  });

  it("unfertige Eingabe im Tagesfeld behält Tag und Uhrzeit", async () => {
    await zeigeApp();
    const feld = () => document.querySelector(".datumzeit-feld") as HTMLElement;
    const vorher = (feld().querySelector('input[type="time"]') as HTMLInputElement).value;
    expect(vorher).toMatch(/^\d{2}:\d{2}$/);
    const tag = feld().querySelector('input[type="date"]') as HTMLInputElement;
    Object.defineProperty(tag, "validity", { configurable: true, get: () => ({ badInput: true }) });
    await act(async () => setzen(tag, ""));
    await warte();
    expect((feld().querySelector('input[type="time"]') as HTMLInputElement).value).toBe(vorher);
    expect((feld().querySelector('input[type="date"]') as HTMLInputElement).value).toMatch(/^\d{4}-/);
  });

  it("Quellen: Kategorie und Art kombinieren, Zeile anfügen, Platzhalter markiert", async () => {
    await zeigeApp();
    await zuSchritt(/Quellen/);
    const bk = document.querySelector(".quellen-baukasten") as HTMLElement;
    const radio = (text: string) => [...bk.querySelectorAll("label")].find((l) => l.textContent?.trim() === text)!.querySelector("input") as HTMLInputElement;
    await act(async () => radio("M").click());
    await act(async () => radio("Online-Quelle (URL)").click());
    await act(async () => radio("Paywall").click());
    await warte();
    expect(bk.querySelector(".quellen-vorschau code")!.textContent).toMatch(/^\[Q1\] M – Herausgeber .*URL \(Paywall\) \[Zugriff: \d{2}\.\d{2}\.\d{4}\]$/);
    await klick(knopf("Zeile anfügen", bk));
    const ta = document.querySelector("textarea.quellen-text") as HTMLTextAreaElement;
    expect(ta.value).toMatch(/^\[Q1\] M – Herausgeber/);
    expect(ta.value.slice(ta.selectionStart, ta.selectionEnd)).toBe("Herausgeber");
    // Art mit Kategorievorschlag: soziale Medien → P, Nummer zählt weiter
    await act(async () => radio("Beitrag in sozialen Medien").click());
    await warte();
    await klick(knopf("Zeile anfügen", bk));
    expect(ta.value.split("\n")[1]).toMatch(/^\[Q2\] P – Konto \(@Kennung\)/);
    expect(ta.value.slice(ta.selectionStart, ta.selectionEnd)).toBe("Konto");
  });

  it("Quellen: Meldung aus dem gespeicherten Lagebild übernehmen", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const ordner = join(__dirname, "../profile/lead-beispiel/beispiele/orkantief-ilka");
    const name = readdirSync(ordner).find((n) => n.includes("_HE_"))!;
    db.werte.set(`lagebild:${p.manifest.id}`, { dateien: [{ name, text: readFileSync(join(ordner, name), "utf8"), importiertAm: "2026-10-20T10:00:00Z" }] });
    await zeigeApp();
    await zuSchritt(/Quellen/);
    const bk = document.querySelector(".quellen-baukasten") as HTMLElement;
    const radio = [...bk.querySelectorAll("label")]
      .find((l) => l.textContent?.trim() === "Meldung aus dem Lagebild")!
      .querySelector("input") as HTMLInputElement;
    await act(async () => radio.click());
    await warte(120);
    const select = bk.querySelector(".quellen-lagemeldung select") as HTMLSelectElement;
    expect(select.options).toHaveLength(1);
    expect(select.options[0].textContent).toMatch(/^Hessen/);
    expect(bk.querySelector(".quellen-vorschau code")!.textContent).toMatch(
      new RegExp(
        `^\\[Q1\\] A – Hessen, .*\\(14\\.10\\.2026, 10:15 Uhr\\): Lagemeldung \\(behördenintern\\), Datei „${name.replace(/[.]/g, "\\.")}“ \\[Zugriff: \\d{2}\\.\\d{2}\\.\\d{4}\\]$`,
      ),
    );
  });
});

describe("Gültigkeitsstand in Teil A", () => {
  it("nennt die Fassungen, die in den Köpfen der Dokumente stehen", () => {
    const ordner = join(__dirname, "../profile/lead-beispiel");
    const teilA = readFileSync(join(ordner, "sop/A_Gemeinsame-Regeln.md"), "utf8");
    const zeile = (beginn: string) =>
      teilA
        .split("\n")
        .find((z) => z.startsWith(`| ${beginn}`))!
        .split("|")[2]
        .trim();
    const kopf = (datei: string) =>
      readFileSync(join(ordner, datei), "utf8")
        .slice(0, 600)
        .match(/Fassung\s+(\d+(?:\.\d+)*)/)![1];
    expect(zeile("Kodierleitfaden")).toBe(kopf("kodierleitfaden.md"));
    expect(zeile("Arbeitsanweisung Erfassung")).toBe(kopf("anweisung-erfassung.md"));
    expect(zeile("Arbeitsanweisung Verdichtung")).toBe(kopf("anweisung-verdichtung.md"));
    expect(zeile("Arbeitsanweisung Kurzfassung")).toBe(kopf("anweisung-kurzfassung.md"));
    expect(zeile("SOP-LEAD-Sammelmappe")).toBe(kopf("sop/README.md"));
    const profilVersion = JSON.parse(readFileSync(join(ordner, "profil.json"), "utf8")).version;
    expect(zeile("Darstellungsdatei").replace("Profilversion ", "") <= profilVersion).toBe(true);
  });
});
