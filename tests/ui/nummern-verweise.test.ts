// @vitest-environment jsdom
// Nummern und Verweise in der Maske (seit 0.9.11, Profilformat 1.39; Entscheidungen des Herausgebers vom 21.11.2026).
// Soll unabhängig vom Code (Kodierleitfaden, Abschnitt 6 und 8.3; Referenzprüfung von LEAD-Meldung-v2):
// - Q (Quellen) und Z (Zeitstrahl) sind in der Meldung eindeutig, M, E, F, K je Sachverhalt. Die App vergibt die Nummer
//   eines neuen Eintrags; die nächste folgt auf die höchste vorhandene, Lücken entfernter Einträge bleiben.
// - Die Nummer steht im Kopf jedes Eintrags.
// - Verweisfelder (Zugehörige Empfehlung, Teilmenge von, Berichtigt Zeile) sind Auswahllisten mit Nummer und Titel,
//   ohne den eigenen Eintrag; eine Nummer, die es nicht gibt, bleibt sichtbar.
// - Belege lassen sich aus dem Quellenverzeichnis wählen; gewählte Nummern stehen mit Titel unter der Eingabe.
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { naechsteNummer, nummerPraefix, verweisPfad, verweisZiele, werteAmPfad } from "../../src/kern/nummern";
import { unterSchema } from "../../src/kern/schema";
import { teilePfad, type Segment } from "../../src/kern/pfad";
import { pruefeUiGegenSchema, pruefeUiStruktur } from "../../src/profil/laden";
import { Feld } from "../../src/ui/Feld";
import type { Befund } from "../../src/kern/typen";
import { aushaengen, einhaengen, klick, knopf, reactUmgebung, setzen } from "../support/dom";
import { profil, profilPflicht } from "../support/dateien";

beforeAll(reactUmgebung);
afterEach(aushaengen);

const QUELLEN = [
  { id: "Q1", kategorie: "A", herausgeber: "Landesamt", titel: "Lagebericht Hochwasser" },
  { id: "Q2", kategorie: "M", herausgeber: "Zeitung", titel: "Bericht vom Pegel" },
];

function meldung() {
  return {
    quellen: QUELLEN,
    sachverhalte: [
      {
        bezeichnung: "Erster",
        handlungsbedarf: {
          massnahmen: [{ id: "M2", gegenstand: "Sandsäcke" }],
          empfehlungen: [
            { id: "E1", auftrag: "Notstromreichweite prüfen" },
            { id: "E2", auftrag: "Pegelprognose abstimmen" },
          ],
          fristen: [{ id: "F1", aufgabe: "Rückmeldung", empfehlung: "E2", quellen: ["Q1", "Q9"] }],
        },
        kennzahlen: [
          { id: "K1", gegenstand: "ohne Strom" },
          { id: "K2", gegenstand: "davon Haushalte", teilmenge_von: "" },
        ],
        zeitstrahl: [
          { id: "Z1", text: "Pegel steigt" },
          { id: "Z2", text: "Deich überströmt" },
        ],
      },
      { bezeichnung: "Zweiter", zeitstrahl: [{ id: "Z4", text: "Strom aus" }] },
    ],
  };
}

async function maske(name = "lead-beispiel") {
  const p = await profilPflicht(name);
  const aufrufe: [string, unknown][] = [];
  const setze = (segs: Segment[], v: unknown) => aufrufe.push([segs.join("/"), v]);
  await einhaengen(React.createElement(Feld, { profil: p, knoten: p.schema, segs: [], wert: meldung(), setze }));
  // Bei mehreren Sachverhalten sind sie eingeklappt (UX-2026-W44-08): den ersten aufklappen
  await klick(document.querySelector<HTMLButtonElement>('button[aria-label="Ereignis/Sachverhalt 1 aufklappen"]')!);
  return { p, aufrufe };
}
const feld = (schluessel: string) => document.querySelector(`[data-feld="${schluessel}"]`)!;

describe("Nummern", () => {
  it("Buchstabe aus dem Muster des Feldes `id`; Listen ohne Nummer ohne Buchstaben", async () => {
    const p = await profilPflicht("lead-beispiel");
    const items = (pfad: string) =>
      unterSchema(
        p.schema,
        teilePfad(pfad).map((s) => (s === -1 ? 0 : s)),
      )?.items;
    expect(nummerPraefix(items("quellen"), p.schema)).toBe("Q");
    expect(nummerPraefix(items("sachverhalte[].handlungsbedarf.massnahmen"), p.schema)).toBe("M");
    expect(nummerPraefix(items("sachverhalte[].handlungsbedarf.empfehlungen"), p.schema)).toBe("E");
    expect(nummerPraefix(items("sachverhalte[].handlungsbedarf.fristen"), p.schema)).toBe("F");
    expect(nummerPraefix(items("sachverhalte[].kennzahlen"), p.schema)).toBe("K");
    expect(nummerPraefix(items("sachverhalte[].zeitstrahl"), p.schema)).toBe("Z");
    expect(nummerPraefix(items("sachverhalte"), p.schema)).toBeUndefined();
    expect(nummerPraefix(items("sachverhalte[].bewertung.neubewertung_bei"), p.schema)).toBeUndefined();
  });

  it("nächste Nummer folgt auf die höchste, Lücken bleiben; fremde Werte zählen nicht", () => {
    expect(naechsteNummer("M", [])).toBe("M1");
    expect(naechsteNummer("M", ["M1", "M4", "", null, "E9", "M02x"])).toBe("M5");
    expect(werteAmPfad(meldung(), "sachverhalte[].zeitstrahl[].id")).toEqual(["Z1", "Z2", "Z4"]);
  });

  it("neue Maßnahme M3 nach M2 (je Liste), neue Zeitstrahlzeile Z5 nach Z4 (in der Meldung)", async () => {
    const { aufrufe } = await maske();
    await klick(knopf("Maßnahme hinzufügen"));
    const [pfad, liste] = aufrufe.at(-1)!;
    expect(pfad).toBe("sachverhalte/0/handlungsbedarf/massnahmen");
    expect((liste as any[]).map((x) => x.id)).toEqual(["M2", "M3"]);
    await klick(knopf("Zeile hinzufügen"));
    expect((aufrufe.at(-1)![1] as any[]).map((x) => x.id)).toEqual(["Z1", "Z2", "Z5"]);
    await klick(knopf("Quelle hinzufügen"));
    expect((aufrufe.at(-1)![1] as any[]).at(-1).id).toBe("Q3");
  });

  it("Nummer im Kopf des Eintrags", async () => {
    await maske();
    const kopf = (name: string) => document.querySelector(`section[aria-label="${name}"] .element-kopf .element-kennung`)?.textContent;
    expect(kopf("Empfehlung 1")).toBe("E1");
    expect(kopf("Empfehlung 2")).toBe("E2");
    expect(kopf("Maßnahme 1")).toBe("M2");
  });
});

describe("Verweise", () => {
  it("Pfad der Verweisliste über die Indizes des Feldes; außerhalb desselben Sachverhalts nicht auflösbar", () => {
    expect(verweisPfad("sachverhalte[].handlungsbedarf.empfehlungen", ["sachverhalte", 1, "handlungsbedarf", "fristen", 0, "empfehlung"])).toEqual([
      "sachverhalte",
      1,
      "handlungsbedarf",
      "empfehlungen",
    ]);
    expect(verweisPfad("quellen", ["sachverhalte", 0, "kennzahlen", 0, "quellen"])).toEqual(["quellen"]);
    expect(verweisPfad("sachverhalte[].kennzahlen", ["uebergreifende_lage", "handlungsbedarf"])).toBeUndefined();
    expect(verweisZiele(meldung(), "sachverhalte[].handlungsbedarf.empfehlungen", ["sachverhalte", 0, "x"])!.map((z) => z.id)).toEqual(["E1", "E2"]);
  });

  it("Zugehörige Empfehlung: Auswahl mit Nummer und Titel; Wahl setzt die Nummer", async () => {
    const { aufrufe } = await maske();
    const auswahl = feld("sachverhalte/0/handlungsbedarf/fristen/0/empfehlung").querySelector("select")!;
    expect([...auswahl.options].map((o) => o.textContent)).toEqual(["keine Angabe", "E1 – Notstromreichweite prüfen", "E2 – Pegelprognose abstimmen"]);
    expect(auswahl.value).toBe("E2");
    setzen(auswahl, "E1");
    expect(aufrufe.at(-1)).toEqual(["sachverhalte/0/handlungsbedarf/fristen/0/empfehlung", "E1"]);
  });

  it("Teilmenge von: andere Kennzahlen ohne die eigene; Berichtigt Zeile: Zeilen des Sachverhalts ohne die eigene", async () => {
    await maske();
    const teil = feld("sachverhalte/0/kennzahlen/1/teilmenge_von").querySelector("select")!;
    expect([...teil.options].map((o) => o.value)).toEqual(["", "K1"]);
    const zeile = feld("sachverhalte/0/zeitstrahl/1/berichtigt").querySelector("select")!;
    expect([...zeile.options].map((o) => o.value)).toEqual(["", "Z1"]);
  });

  it("Belege: gewählte Nummern mit Titel, unbekannte als „nicht vorhanden“; „Hinzufügen …“ ergänzt eine Quelle", async () => {
    const { aufrufe } = await maske();
    const belege = feld("sachverhalte/0/handlungsbedarf/fristen/0/quellen");
    expect([...belege.querySelectorAll(".verweis-gewaehlt li")].map((l) => l.textContent)).toEqual(["Q1 Lagebericht Hochwasser", "Q9 nicht vorhanden"]);
    const wahl = belege.querySelector<HTMLSelectElement>("select.verweis-wahl")!;
    expect([...wahl.options].map((o) => o.textContent)).toEqual(["Hinzufügen …", "Q2 – Bericht vom Pegel"]);
    setzen(wahl, "Q2");
    expect(aufrufe.at(-1)).toEqual(["sachverhalte/0/handlungsbedarf/fristen/0/quellen", ["Q1", "Q9", "Q2"]]);
  });

  it("Prüfung beim Laden: Verweis auf eine Liste ohne Nummern ergibt eine Warnung, falsche Angaben einen Fehler; Profile ohne Befund", async () => {
    const p = await profilPflicht("lead-beispiel");
    const ui = structuredClone(p.ui);
    (ui.felder as any)["sachverhalte[].handlungsbedarf.fristen[].empfehlung"] = { verweis: "sachverhalte[].bewertung.neubewertung_bei" };
    const b: Befund[] = [];
    pruefeUiGegenSchema(ui, p.schema, b);
    expect(b.map((x) => x.text)).toContain(
      "Darstellungsdatei: Feld „sachverhalte[].handlungsbedarf.fristen[].empfehlung“ verweist auf „sachverhalte[].bewertung.neubewertung_bei“, keine Liste mit Nummern.",
    );
    const fehler: Befund[] = [];
    pruefeUiStruktur({ ...structuredClone(p.ui), felder: { a: { verweis: 1 }, b: { nummern: "global" } } }, fehler);
    expect(fehler.map((x) => x.text)).toEqual(
      expect.arrayContaining([
        "Darstellungsdatei: Feld „a“: „verweis“ muss Text sein.",
        "Darstellungsdatei: Feld „b“: „nummern“ muss „liste“ oder „meldung“ sein.",
      ]),
    );
    for (const name of ["lead-beispiel", "lead-thueringen", "muster"]) {
      const { befunde } = await profil(name);
      expect(
        befunde.filter((x) => /verweist/.test(x.text)),
        name,
      ).toEqual([]);
    }
  });
});
