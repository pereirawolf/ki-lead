// LEAD-Eingabehilfen (Darstellungsdatei „feldhilfen“): Herkunft der Satzanfänge, Prüfregeln, Füllen der Vorlagen,
// Einfügestellen, Dopplungen und Ausfüllhinweise. Grundlage: Umsetzungsbeschreibung vom 21.10.2026
// (2026-10-21_KI-LEAD_Manuelle_LEAD-Eingabehilfen_Umsetzung_auf_main.json, A03–A08, A10, A11, A17).
import { beforeAll, describe, expect, it } from "vitest";
import { profilPflicht } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import type { FeldhilfeVorlage, Profil } from "../../src/kern/typen";
import {
  bausteinEinfuegen,
  erstePlatzhalterstelle,
  feldhilfenFehler,
  hilfeFuer,
  offenePlatzhalter,
  t0Text,
  vorhandeneStelle,
  vorlageFuellen,
  vorlageGesperrt,
} from "../../src/kern/feldhilfen";
import { ausfuellHinweise } from "../../src/kern/kennsaetze";

let p: Profil;
beforeAll(async () => {
  p = await profilPflicht();
});
const v = (feld: string, id: string): FeldhilfeVorlage => hilfeFuer(p.ui, feld)!.vorlagen.find((x) => x.id === id)!;
const BT = "sofort.bewertung_text";
const KS = () => Object.values(p.ui.kennsaetze!);

describe("Beispielprofil: nur vorhandene Satzanfänge (A03, A04)", () => {
  it("Konfiguration ohne Befund", () => {
    expect(feldhilfenFehler(p.ui.feldhilfen, p.ui)).toEqual([]);
  });

  // Festes Soll aus der Umsetzungsbeschreibung („herkunft_der_satzanfaenge“); jede Zeile ist auf main belegt
  it.each([
    ["analyse.lage_ereignis", ["Kernaussage:", "Bestätigt ist", "Einordnung „"]],
    ["analyse.risiken_auswirkungen", ["Eingetretene Wirkungen:", "Mögliche Entwicklungen:", "Szenario:", "Einschätzung ("]],
    ["analyse.massnahmen_empfehlungen", ["Bestehende Maßnahmen:", "Prüf- und Abstimmungsbedarf:", "Abstimmungen "]],
    ["analyse.abhaengigkeiten_interdependenzen", ["Belegte Kopplungen:", "Wirkungskette:", "Szenario:"]],
    ["sofort.bewertung_text", ["Kernaussage:", "Referenzraum:", "Beurteilung „", "Tendenz „"]],
  ])("%s: Satzanfänge der Vorlagen ohne Kennsatz", (feld, soll) => {
    const vorlagen = hilfeFuer(p.ui, feld)!.vorlagen.filter((x) => !x.kennsatz);
    expect(vorlagen).toHaveLength(soll.length);
    vorlagen.forEach((x, i) => expect(x.vorlage.startsWith(soll[i]), `${x.id}: „${x.vorlage}“`).toBe(true));
  });

  it("Kennsatzvorlagen: genau die fünf Kennsätze, Beschriftung wörtlich wie im Profil", () => {
    const ks = hilfeFuer(p.ui, BT)!.vorlagen.filter((x) => x.kennsatz);
    expect(ks.map((x) => [x.kennsatz, x.label])).toEqual([
      ["neubewertung", "Neubewertung bei:"],
      ["handlungsrelevant", "Handlungsrelevant bis:"],
      ["aenderung", "Änderung zur Vormeldung:"],
      ["abweichung", "Abweichende Bewertung:"],
      ["abschluss", "Abschluss im Lagebild:"],
    ]);
    for (const x of ks) expect(p.ui.kennsaetze![x.kennsatz!]).toBe(x.label);
  });

  // Die verworfenen Satzanfänge stehen hier nur als Unicode-Escape, damit die Suche nach ihnen im Repository leer bleibt
  const VERWORFEN = new RegExp("Erkenntnisl\u00fccke:|Begr\u00fcndung der (Beurteilung|Tendenz):");
  it("keine verworfenen Satzanfänge (Erkenntnislücke, Begründung der …), keine Gliederungsmuster dafür", () => {
    const alle = Object.values(p.ui.feldhilfen!.felder).flatMap((h) => h.vorlagen.map((x) => x.vorlage));
    expect(alle.filter((t) => VERWORFEN.test(t))).toEqual([]);
    const muster = [...(p.ui.analyse_gliederung?.absatz || []), ...(p.ui.bewertung_gliederung?.absatz || [])];
    expect(muster.filter((m) => /Erkenntnisl|Begründung/.test(m))).toEqual([]);
  });

  it("Maßnahmenstatus: genau die sieben Werte aus SOP-LEAD A.4, Fristvorlage im Format aus A.4", () => {
    expect(v("analyse.massnahmen_empfehlungen", "massnahmen").status_auswahl).toEqual([
      "geplant",
      "angefordert",
      "angeordnet",
      "begonnen",
      "umgesetzt",
      "wirksam",
      "beendet",
    ]);
    expect(v(BT, "frist").vorlage).toBe("⟦TT.MM.JJJJ HH:MM⟧ – ⟦Aufgabe, Adressat⟧ – ⟦Bedingung, falls zutreffend⟧; Grundlage: ⟦Quellenverweis⟧");
  });
});

describe("Prüfregeln", () => {
  const mit = (felder: any) => ({ format: "lead-feldhilfen/1", felder });
  const eine = (feld: string, vorlage: any) => mit({ [feld]: { vorlagen: [{ id: "a", label: "A", vorlage: "x", ...vorlage }] } });
  it.each([
    ["kein Objekt", "x", /muss ein Objekt sein/],
    ["falsches Format", { format: "x", felder: {} }, /format/],
    ["unbekannte Angabe oben", { ...mit({}), extra: 1 }, /unbekannte Angabe „extra“/],
    ["fremdes Feld", mit({ bezeichnung: { vorlagen: [{ id: "a", label: "A", vorlage: "x" }] } }), /weder in „sv_analysefelder“/],
    [
      "KI-Angabe am Feld",
      mit({ "analyse.lage_ereignis": { vorlagen: [{ id: "a", label: "A", vorlage: "x" }], ["ki_" + "unterstuetzung"]: true } }),
      /unbekannte Angabe „ki_/,
    ],
    ["leere Vorlagenliste", mit({ "analyse.lage_ereignis": { vorlagen: [] } }), /nicht leere Liste/],
    ["unbekannte Angabe an der Vorlage", eine("analyse.lage_ereignis", { vorlage_ohne_wert: "y" }), /unbekannte Angabe „vorlage_ohne_wert“/],
    ["HTML", eine("analyse.lage_ereignis", { vorlage: "<b>x</b>" }), /Klartext/],
    ["offene Stelle ohne Ende", eine("analyse.lage_ereignis", { vorlage: "⟦x" }), /⟦…⟧/],
    ["unbekannter Wert", eine("analyse.lage_ereignis", { vorlage: "{{radar}}" }), /unbekannter Wert „\{\{radar\}\}“/],
    ["Schreibweise der Arbeitsanweisungen", eine("analyse.lage_ereignis", { vorlage: "{{profil.kurzname}}" }), /unbekannter Wert/],
    ["Wert mit Leerzeichen", eine("analyse.lage_ereignis", { vorlage: "{{ t0 }}" }), /ohne Leerzeichen und klein geschrieben/],
    ["Wert groß geschrieben", eine("analyse.lage_ereignis", { vorlage: "{{T0}}" }), /ohne Leerzeichen und klein geschrieben/],
    ["Kennsatz im Analysefeld", eine("analyse.lage_ereignis", { kennsatz: "neubewertung" }), /nur im Bewertungstext/],
    ["unbekannter Kennsatz", eine(BT, { kennsatz: "frist" }), /Schlüssel aus „kennsaetze“/],
    ["Kennsatz mit Position", eine(BT, { kennsatz: "neubewertung", position: "anfang" }), /schließen sich aus/],
    ["Position", eine("analyse.lage_ereignis", { position: "mitte" }), /position muss/],
    ["Status ohne Stelle", eine("analyse.lage_ereignis", { status_auswahl: ["geplant"] }), /Status auswählen/],
    ["Beurteilung ohne nur_mit_wert", eine(BT, { vorlage: "Beurteilung „{{beurteilung}}“" }), /braucht „nur_mit_wert“/],
    ["nur_mit_wert ohne Wert", eine(BT, { nur_mit_wert: "tendenz" }), /ohne \{\{tendenz\}\}/],
    [
      "doppelte Kennung",
      mit({
        "analyse.lage_ereignis": {
          vorlagen: [
            { id: "a", label: "A", vorlage: "x" },
            { id: "a", label: "B", vorlage: "y" },
          ],
        },
      }),
      /doppelt/,
    ],
  ])("%s → Befund", (_, konfig, muster) => {
    expect(feldhilfenFehler(konfig, p.ui).join(" ")).toMatch(muster);
  });
});

describe("Vorlagen füllen (A05, A10, A17)", () => {
  it("t0 im Format der Beispielmeldungen, nie das aktuelle Datum", () => {
    expect(t0Text("2026-10-14T10:15")).toBe("14.10.2026, 10:15 Uhr");
    expect(t0Text("2026-10-14")).toBe("14.10.2026");
    expect(t0Text("")).toBe("");
    expect(vorlageFuellen(v(BT, "referenzraum"), {}, { t0: "14.10.2026, 10:15 Uhr" })).toBe(
      "Referenzraum: ⟦Referenzraum der Bewertung⟧. t0: 14.10.2026, 10:15 Uhr.",
    );
    expect(vorlageFuellen(v(BT, "referenzraum"), {}, { t0: "" })).toBe("Referenzraum: ⟦Referenzraum der Bewertung⟧. t0: ⟦t0: Meldezeitpunkt fehlt⟧.");
  });

  it("Beurteilung und Tendenz nur mit gewähltem Wert", () => {
    expect(vorlageGesperrt(v(BT, "beurteilung"), { beurteilung: "" })).toMatch(/Erst eine Beurteilung wählen/);
    expect(vorlageGesperrt(v(BT, "tendenz"), { tendenz: "" })).toMatch(/Erst eine Tendenz wählen/);
    expect(vorlageGesperrt(v(BT, "beurteilung"), { beurteilung: "erheblich" })).toBeNull();
    expect(vorlageFuellen(v(BT, "beurteilung"), {}, { beurteilung: "erheblich" })).toBe(
      "Beurteilung „erheblich“: ⟦bereits vorliegende Begründung im Referenzraum⟧.",
    );
  });

  it("Kurzname aus dem Profil, sonst offene Stelle", () => {
    expect(vorlageFuellen(v("analyse.risiken_auswirkungen", "einschaetzung"), {}, { kurzname: "Koordinierungsstelle" })).toBe(
      "Einschätzung (Koordinierungsstelle): ⟦eigene, als solche gekennzeichnete Schlussfolgerung⟧.",
    );
    expect(vorlageFuellen(v("analyse.risiken_auswirkungen", "einschaetzung"))).toBe(
      "Einschätzung (⟦Kurzname der meldenden Stelle⟧): ⟦eigene, als solche gekennzeichnete Schlussfolgerung⟧.",
    );
  });

  it("Status und Quelle nur bei bewusster Wahl; Kennsatz mit Satzanfang aus dem Profil", () => {
    const m = v("analyse.massnahmen_empfehlungen", "massnahmen");
    expect(vorlageFuellen(m)).toBe(
      "Bestehende Maßnahmen: ⟦verantwortliche Stelle⟧ – ⟦dokumentierte Maßnahme⟧; Status: ⟦Status auswählen⟧; Stand: ⟦Datenstand⟧; ⟦Quellenverweis⟧.",
    );
    expect(vorlageFuellen(m, { status: "begonnen", quelle: "[Q2]" })).toBe(
      "Bestehende Maßnahmen: ⟦verantwortliche Stelle⟧ – ⟦dokumentierte Maßnahme⟧; Status: begonnen; Stand: ⟦Datenstand⟧; [Q2].",
    );
    expect(vorlageFuellen(m, { status: "erfunden", quelle: "Q2" })).toContain("Status: ⟦Status auswählen⟧; Stand: ⟦Datenstand⟧; ⟦Quellenverweis⟧");
    expect(vorlageFuellen(v(BT, "neubewertung"), {}, {}, p.ui)).toBe("Neubewertung bei: ⟦Indikator oder Bedingung, die eine Neubewertung erfordern würde⟧");
  });
});

describe("Einfügestellen und Dopplungen (A06–A08)", () => {
  it("anfang, vor_kennsaetzen, ende und Kennsätze in Profilreihenfolge", () => {
    const text = "Lage.\nHandlungsrelevant bis: 23.10.2026 – A, B";
    expect(bausteinEinfuegen(text, "Kernaussage: K.", "anfang", KS())).toEqual({ text: `Kernaussage: K.\n\n${text}`, start: 0 });
    expect(bausteinEinfuegen(text, "Beurteilung „erheblich“: X.", "vor_kennsaetzen", KS()).text).toBe(
      "Lage.\n\nBeurteilung „erheblich“: X.\n\nHandlungsrelevant bis: 23.10.2026 – A, B",
    );
    expect(bausteinEinfuegen("Lage.", "Szenario: S.", undefined, KS())).toEqual({ text: "Lage.\n\nSzenario: S.", start: 7 });
    // Neubewertung steht in der Reihenfolge vor Handlungsrelevant, Abschluss danach
    expect(bausteinEinfuegen(text, "Neubewertung bei: N", "kennsatz", KS()).text).toBe("Lage.\nNeubewertung bei: N\nHandlungsrelevant bis: 23.10.2026 – A, B");
    expect(bausteinEinfuegen(text, "Abschluss im Lagebild: E", "kennsatz", KS()).text).toBe(`${text}\nAbschluss im Lagebild: E`);
    expect(bausteinEinfuegen("Lage.", "Neubewertung bei: N", "kennsatz", KS()).text).toBe("Lage.\n\nNeubewertung bei: N");
  });

  it("erste offene Stelle nur innerhalb des eingefügten Bausteins", () => {
    const alt = "Kernaussage: ⟦alt⟧.";
    const neu = bausteinEinfuegen(alt, "Referenzraum: Land A. t0: 14.10.2026.", "vor_kennsaetzen", KS());
    const satz = "Referenzraum: Land A. t0: 14.10.2026.";
    expect(erstePlatzhalterstelle(neu.text, neu.start, neu.start + satz.length)).toBeNull();
    const zwei = bausteinEinfuegen("Lage.", "Szenario: ⟦a⟧ und ⟦b⟧.", "ende", KS());
    expect(erstePlatzhalterstelle(zwei.text, zwei.start, zwei.text.length)).toEqual([17, 20]);
  });

  it("vorhandene Kernaussage und vorhandener Kennsatz werden angesprungen, Kennsatz im Fließtext erkannt", () => {
    expect(vorhandeneStelle("  Kernaussage: K.\n\nRest", v("analyse.lage_ereignis", "kernaussage"), p.ui)).toEqual({ art: "zeile", pos: 17 });
    expect(vorhandeneStelle("Rest\nKernaussage: K.", v("analyse.lage_ereignis", "kernaussage"), p.ui)).toBeNull();
    const t = "Text.\nHandlungsrelevant bis: 23.10.2026 – A, B";
    expect(vorhandeneStelle(t, v(BT, "frist"), p.ui)).toEqual({ art: "zeile", pos: t.length });
    expect(vorhandeneStelle("Text. Handlungsrelevant bis: morgen.", v(BT, "frist"), p.ui)).toEqual({ art: "fliesstext" });
    expect(vorhandeneStelle("Text.", v(BT, "frist"), p.ui)).toBeNull();
  });
});

describe("Ausfüllhinweise für offene Stellen (A11)", () => {
  it("je Feld ein Hinweis, keine neue Pflichtangabe", () => {
    const d = ilkaMeldung("HE");
    d.sachverhalte[0].analyse.lage_ereignis = "Kernaussage: ⟦zentrale Aussage zur Lage⟧.";
    d.sachverhalte[0].sofort.bewertung_text += "\nNeubewertung bei: ⟦Indikator⟧";
    const h = ausfuellHinweise(d, p.ui).map((b) => b.text);
    expect(h.filter((t) => t.includes("offene Vorlagenstelle"))).toEqual([
      expect.stringMatching(/Lage & Ereignis: offene Vorlagenstelle ⟦zentrale Aussage zur Lage⟧ – ausfüllen oder streichen\./),
      expect.stringMatching(/Bewertung & Tendenz: offene Vorlagenstelle ⟦Indikator⟧ – ausfüllen oder streichen\./),
    ]);
    expect(offenePlatzhalter("ohne")).toEqual([]);
  });
});
