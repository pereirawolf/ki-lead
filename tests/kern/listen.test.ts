// Listen und verschachtelte Objekte eines Profilschemas lesbar ausgeben (seit 0.6.14, Issue #114, A2; Ladeprobe des
// Profilpakets lead-kritis aus KRITIS-LEAD M2 vom 31.10.2026: Listen von Objekten standen in PDF, Rohtabelle und CSV
// als JSON). Soll unabhängig im Test: kleines eigenes Schema mit Liste, verschachteltem Objekt und Zeitfeld.
import { describe, expect, test } from "vitest";
import { elementName, elementTitel, hatObjekte, listeAlsText } from "../../src/kern/listen";
import { profil } from "../support/dateien";
import { einlesen } from "../../src/lagebild/lagebild";
import { alsCsv, rohtabelle } from "../../src/lagebild/ausgabe";
import { meldungAlsPdf } from "../../src/dokumente/pdf";
import { ilkaMeldung } from "../support/fixtures";
import type { Profil } from "../../src/kern/typen";

const LISTE = {
  type: "array",
  items: {
    type: "object",
    properties: {
      art: { type: "string" },
      status: { type: "string" },
      stand: { type: "string" },
      messwert: { type: "object", properties: { wert: { type: ["number", "null"] }, einheit: { type: "string" } } },
    },
  },
};

/** Kleines Profil: nur Schema und Felder der Darstellungsdatei, mehr brauchen die Funktionen nicht */
function klein(felder: Record<string, unknown>): Profil {
  return {
    schema: { type: "object", properties: { verfahren: LISTE, codes: { type: "array", items: { type: "string" } } } },
    ui: { felder, rollen: {} },
  } as any;
}

const WERT = [
  { art: "Umschaltung", status: "eingesetzt", stand: "2026-10-13T22:30", messwert: { wert: 18000, einheit: "Anschlüsse" } },
  { art: "", status: "geplant", stand: "", messwert: { wert: null, einheit: "" } },
];

describe("I114-A2: Elementtitel und Name", () => {
  test("titel_feld geht vor; ohne titel_feld der erste nicht leere Text bzw. der Wert selbst, gekürzt", () => {
    const mitTitel = klein({ verfahren: { titel_feld: "art" } });
    expect(elementTitel(mitTitel, ["verfahren"], WERT[0])).toBe("Umschaltung");
    // leeres titel_feld: kein Rückgriff (Verhalten der Sachverhalte bleibt „ohne Bezeichnung“)
    expect(elementTitel(mitTitel, ["verfahren"], WERT[1])).toBe("");
    const ohne = klein({});
    expect(elementTitel(ohne, ["verfahren"], WERT[1])).toBe("geplant");
    expect(elementTitel(ohne, ["codes"], "16072")).toBe("16072");
    expect(elementTitel(ohne, ["verfahren"], { art: "x".repeat(100) })).toBe("x".repeat(79) + "…");
    expect(elementTitel(ohne, ["verfahren"], { messwert: { wert: 1 } })).toBe("");
  });

  test("Name aus element_label, sonst Bezeichnung der Liste", () => {
    expect(elementName(klein({ verfahren: { label: "Ersatzverfahren", element_label: "Verfahren" } }), ["verfahren"])).toBe("Verfahren");
    expect(elementName(klein({ verfahren: { label: "Ersatzverfahren" } }), ["verfahren"])).toBe("Ersatzverfahren");
    expect(elementName(klein({}), ["verfahren"])).toBe("verfahren");
  });
});

describe("I114-A2: Liste als lesbarer Text", () => {
  test("je Element Kopfzeile und eingerückte Zeilen, verschachtelt mit „›“, leere Angaben ausgelassen, Zeitfelder deutsch", () => {
    const p = klein({
      verfahren: { label: "Ersatzverfahren", element_label: "Verfahren", titel_feld: "art" },
      "verfahren[].stand": { label: "Datenstand", widget: "datumzeit" },
      "verfahren[].messwert": { label: "Messwert" },
    });
    expect(listeAlsText(p, LISTE, WERT, ["verfahren"])).toBe(
      [
        "Verfahren 1 – Umschaltung",
        "  art: Umschaltung",
        "  status: eingesetzt",
        "  Datenstand: 13.10.2026, 22:30 Uhr",
        "  Messwert › wert: 18000",
        "  Messwert › einheit: Anschlüsse",
        "Verfahren 2",
        "  status: geplant",
      ].join("\n"),
    );
    expect(hatObjekte(WERT)).toBe(true);
  });

  test("Listen einfacher Werte durch „; “ getrennt, kein JSON; keine Liste ergibt leeren Text", () => {
    const p = klein({});
    expect(listeAlsText(p, { type: "array", items: { type: "string" } }, ["16072", "", "16073"], ["codes"])).toBe("16072; 16073");
    expect(hatObjekte(["a", null])).toBe(false);
    expect(listeAlsText(p, LISTE, undefined, ["verfahren"])).toBe("");
  });
});

/** Beispielprofil, dessen Sachverhalt eine Liste von Objekten führt (allgemeines Feld, nicht KRITIS-spezifisch) */
async function mitListe(): Promise<Profil> {
  const p = (await profil("lead-beispiel")).profil!;
  p.schema.$defs.sachverhalt.properties.betrieb = { type: "object", properties: { ev: LISTE } };
  Object.assign(p.ui.felder, {
    "sachverhalte[].betrieb": { label: "Betrieb" },
    "sachverhalte[].betrieb.ev": { label: "EV", element_label: "EV", titel_feld: "art" },
    "sachverhalte[].betrieb.ev[].art": { label: "Art" },
  });
  return p;
}
function meldungMitListe() {
  const m = ilkaMeldung("TH");
  m.sachverhalte[0].betrieb = { ev: structuredClone(WERT) };
  return m;
}

describe("I114-A2: Ausgaben einer Meldung mit Liste von Objekten", () => {
  test("Rohtabelle und CSV: eine Spalte je Liste mit lesbarem Text statt JSON", async () => {
    const p = await mitListe();
    const { eintraege } = einlesen([{ name: "th.json", text: JSON.stringify(meldungMitListe()), importiertAm: "2026-10-31T00:00:00Z" }], p);
    const t = rohtabelle(eintraege, p);
    const spalte = t[0].indexOf("Betrieb › EV");
    expect(spalte).toBeGreaterThan(0);
    expect(t[1][spalte]).toBe(
      [
        "EV 1 – Umschaltung",
        "  Art: Umschaltung",
        "  status: eingesetzt",
        "  stand: 2026-10-13T22:30",
        "  messwert › wert: 18000",
        "  messwert › einheit: Anschlüsse",
        "EV 2",
        "  status: geplant",
      ].join("\n"),
    );
    expect(alsCsv(t)).not.toContain('{""art""');
  });

  test("PDF der Meldung: Zeilen je Element statt JSON", async () => {
    const p = await mitListe();
    const text = new TextDecoder("latin1").decode(new Uint8Array(await meldungAlsPdf(meldungMitListe(), p, true).arrayBuffer()));
    expect(text).toContain("Betrieb › EV 1 › Art");
    expect(text).toContain("Betrieb › EV 2 › status");
    expect(text).not.toMatch(/\{\\?"art/);
  });
});
