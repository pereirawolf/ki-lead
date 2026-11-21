// Nebenbefunde vom 21.11.2026 (Entscheidungen des Herausgebers vom selben Tag), seit 0.9.7:
// 1. Auswahlwerte in ihrer Anzeigeform („ungefähr“ statt „ungefaehr“), JSON unverändert;
// 2. neue Radarachsen „offen“ statt „belegt“ ohne Stufe (Vorgabe im Modulschema), Grund bleibt leer;
// 3. Prüfmeldungen in Klartext, Radarachsen in den Worten des Kodierleitfadens.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { leererWert, leeresElement } from "../../src/kern/schema";
import { pruefeGegenSchema, RADAR_UNBEWERTET } from "../../src/kern/validierung";
import { WERT_BEZEICHNUNGEN, wertBezeichnung } from "../../src/kern/ui";
import { sichtbareBefunde, befundeJeFeld } from "../../src/ui/feldBefunde";

const RADAR = ["sachverhalte", 0, "module", "lead-bevoelkerungsschutz", "lagenradar"] as const;

async function beispiel() {
  const { profil: p } = await profil("lead-beispiel");
  return p!;
}

/** Meldung mit einem neuen, unbearbeiteten Sachverhalt */
async function neueMeldung() {
  const p = await beispiel();
  const d = leererWert(p.schema, p.schema);
  d.sachverhalte = [leeresElement(p.schema, ["sachverhalte"])];
  return { p, d, radar: d.sachverhalte[0].module["lead-bevoelkerungsschutz"].lagenradar };
}

describe("Neue Radarachsen: offen, Grund leer", () => {
  it("Vorgabe „offen“ aus dem Modulschema; keine Stufe, kein Grund", async () => {
    const { radar } = await neueMeldung();
    expect(Object.keys(radar)).toEqual(["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"]);
    for (const a of Object.values(radar)) expect(a).toEqual({ stufe: null, status: "offen", begruendung: "", quellen: [] });
  });

  it("ein Befund je Radar statt acht Typfehlern, erst nach Bearbeitung in der Maske", async () => {
    const { p, d } = await neueMeldung();
    const befunde = pruefeGegenSchema(p.schema, d, p.ui);
    const radar = befunde.filter((b) => b.pfad === `/${RADAR.join("/")}`);
    expect(radar).toHaveLength(1);
    expect(radar[0]!.text).toMatch(new RegExp(`› Lagenradar: ${RADAR_UNBEWERTET}: D1, D2, D3, D4, D5, D6, D7, D8 – je Achse eine Stufe wählen`));
    expect(befunde.some((b) => /Datentyp|integer|null/.test(b.text))).toBe(false);
    const je = befundeJeFeld(befunde, [], p.ui);
    const schluessel = RADAR.join("/");
    expect(sichtbareBefunde(je, () => false).has(schluessel)).toBe(false);
    expect(sichtbareBefunde(je, () => true).has(schluessel)).toBe(true);
  });

  it("Status „belegt“ ohne Stufe (alter Entwurf) und Grund trotz Stufe in Worten des Kodierleitfadens", async () => {
    const { p, d, radar } = await neueMeldung();
    radar.d2 = { stufe: null, status: "belegt", begruendung: "", quellen: [] };
    radar.d3 = { stufe: 2, status: "belegt", offen_grund: "kein_beleg", begruendung: "weil …", quellen: [] };
    radar.d4 = { stufe: null, status: "offen", begruendung: "kein Zielzustand benannt", quellen: [] };
    const texte = pruefeGegenSchema(p.schema, d, p.ui).map((b) => b.text);
    expect(texte.some((t) => t.endsWith("Lagenradar: D2 hat den Status „belegt“, aber keine Stufe – Stufe wählen oder Status „offen“ mit Grund setzen"))).toBe(
      true,
    );
    expect(texte.some((t) => t.endsWith("Lagenradar: D3 hat eine Stufe und zugleich einen Grund für „offen“ – Grund entfernen"))).toBe(true);
    expect(
      texte.some((t) =>
        /Lagenradar: D4 ist offen, aber ohne Grund – Grund wählen \(kein Bezugsgegenstand, kein Beleg, Bandbreite über Stufengrenze, sonstiges\)/.test(t),
      ),
    ).toBe(true);
    // D2 bis D4 stehen nicht mehr unter „noch nicht bewertet“
    expect(texte.find((t) => t.includes(RADAR_UNBEWERTET))).toMatch(/: D1, D5, D6, D7, D8 –/);
  });

  it("leere Pflichtangabe ist kein falscher Datentyp (Rückfrage beim Laden bleibt aus)", async () => {
    const { p, d } = await neueMeldung();
    d.sachverhalte[0].kennzahlen = [{ gegenstand: "X", wert: null }];
    const typ = pruefeGegenSchema(p.schema, d, p.ui).filter((b) => b.keyword === "type");
    expect(typ.every((b) => b.leer === true || !/Pflichtangabe fehlt$/.test(b.text))).toBe(true);
  });
});

describe("keine zulässige Form: was der nächstliegenden fehlt", () => {
  it("finale Meldung ohne Quellen: Quellen oder Fehlanzeige statt „Eintrag hat keine zulässige Form“", async () => {
    const { p, d } = await neueMeldung();
    d.status = "zur_freigabe";
    const texte = pruefeGegenSchema(p.schema, d, p.ui).map((b) => b.text);
    expect(texte).toContain("Quellen & Referenzen: mindestens 1 Eintrag erforderlich – oder – Fehlanzeige: Pflichtangabe fehlt");
    expect(texte.some((t) => t.includes("keine zulässige Form"))).toBe(false);
  });

  it("Zeitangabe mit falschem Format: die Form „leer“ wird nicht genannt", async () => {
    const { p, d } = await neueMeldung();
    d.sachverhalte[0].eintritt = { zeit: "gestern", genauigkeit: "belegt" };
    const t = pruefeGegenSchema(p.schema, d, p.ui).find((b) => b.pfad.includes("/eintritt/zeit"));
    expect(t?.text).toMatch(/Eintritt › Zeit: Format ungültig \(„gestern“\)$/);
  });
});

describe("Auswahlwerte in ihrer Anzeigeform", () => {
  it("Umlaute und Leerzeichen, Profil kann überschreiben, Werte ohne Eintrag bleiben", () => {
    expect(wertBezeichnung(undefined, "ungefaehr")).toBe("ungefähr");
    expect(wertBezeichnung(undefined, "nicht_ueberpruefbar")).toBe("nicht überprüfbar");
    expect(wertBezeichnung(undefined, "belegt")).toBe("belegt");
    expect(wertBezeichnung({ werte: { ungefaehr: "eingrenzbar" } }, "ungefaehr")).toBe("eingrenzbar");
    expect(wertBezeichnung(undefined, null)).toBe("");
  });

  it("jeder technische Auswahlwert der Profile mit Umschreibung oder Unterstrich hat eine Anzeigeform", async () => {
    for (const name of ["lead-beispiel", "lead-thueringen", "muster"]) {
      const { profil: p } = await profil(name);
      const werte = new Set<string>();
      const lauf = (k: unknown) => {
        if (!k || typeof k !== "object") return;
        if (Array.isArray(k)) return k.forEach(lauf);
        const o = k as Record<string, unknown>;
        if (Array.isArray(o.enum)) for (const w of o.enum) if (typeof w === "string" && /(ae|oe|ue|_)/.test(w)) werte.add(w);
        Object.values(o).forEach(lauf);
      };
      lauf(p!.schema);
      // „manuell“ enthält „ue“, ist aber keine Umschreibung
      expect(
        [...werte].filter((w) => !WERT_BEZEICHNUNGEN[w] && w !== "manuell"),
        name,
      ).toEqual([]);
    }
  });

  it("Prüfmeldung nennt Werte in Anzeigeform", async () => {
    const { p, d } = await neueMeldung();
    d.sachverhalte[0].eintritt = { zeit: null, genauigkeit: "ungefaehr_" };
    const t = pruefeGegenSchema(p.schema, d, p.ui).find((b) => b.pfad.endsWith("/eintritt/genauigkeit"));
    expect(t?.text).toMatch(/„ungefaehr_“ ist hier nicht vorgesehen; möglich: belegt, ungefähr, unbekannt$/);
  });
});
