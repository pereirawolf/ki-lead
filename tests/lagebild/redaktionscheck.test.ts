// Redaktionscheck im Lagebild: Sollverhalten zum Review „KI-LEAD_Redaktionscheck_Review_2026-10-20“ (RC02–RC08,
// RV01, RV03, RV04, RV06, RV07). Zeitangaben gelten in der Profilzeitzone Europe/Berlin.
import { beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { profil } from "../support/dateien";
import type { Profil } from "../../src/kern/typen";
import { alleSachverhalte, kennzahlen, type LagebildEintrag } from "../../src/lagebild/lagebild";
import { abweichungsBaustein, befundListe, redaktionsbericht, redaktionscheck } from "../../src/lagebild/redaktion";
import { leseFrist, parseDatumDE } from "../../src/kern/kennsaetze";
import { quellenHinweise } from "../../src/kern/quellen";
import { zeitpunktInZone } from "../../src/kern/zeit";

import { ilkaMeldung } from "../support/fixtures";
import { repoPfad } from "../support/dateien";
let p: Profil;
let basis: any;
beforeAll(async () => {
  p = (await profil("lead-beispiel")).profil!;
  basis = ilkaMeldung("Bund");
});

/** Berliner Wanduhrzeit als Zeitpunkt */
const berlin = (tag: number, stunde: number, minute = 0, monat = 10) => zeitpunktInZone(2026, monat, tag, stunde, minute, "Europe/Berlin");

function eintrag(id = "a", text = "", beurteilung = "geringfügig", tendenz = "Stabilisierung"): LagebildEintrag {
  const d = structuredClone(basis);
  d.sachverhalte = [d.sachverhalte[0]];
  d.meldende_stelle = "Stelle " + id;
  d.land = "Testland";
  d._status = "final";
  const sv = d.sachverhalte[0];
  sv.art = ["Stromausfall / Blackout"];
  sv.sofort.beurteilung = beurteilung;
  sv.sofort.tendenz = tendenz;
  sv.sofort.bewertung_text = text;
  for (const k of Object.keys(sv.analyse)) sv.analyse[k] = "";
  sv.analyse.massnahmen_empfehlungen = "Maßnahmen vorhanden.";
  d.quellen = "[Q1] A – Teststelle (20.10.2026): Lage [Zugriff: 20.10.2026]";
  // Seit Profil 1.33.0 trägt die Beispielmeldung einen Zeitstrahl mit Verweisen; der Testfall setzt alle Texte selbst
  delete d.zeitstrahl;
  return { id, name: id + ".json", daten: d, herkunft: d.schema, hinweise: [], schema: [], fremd: null, importiertAm: "2026-10-20T10:00:00Z" };
}
const check = (e: LagebildEintrag[], ausgabe: string | Date = "2026-10-23T15:00", jetzt = berlin(20, 12), pr = p) => redaktionscheck(e, pr, ausgabe, jetzt);

describe("RC03: Uhrzeiten in Fristen", () => {
  it.each(["21.10.2026 08:00", "21.10.2026, 08:00", "21.10.2026 um 08:00 Uhr", "21.10.2026 um 8 Uhr", "21.10.2026 8.00 Uhr"])("„%s“ ergibt 08:00", (s) => {
    const f = leseFrist(s, "Europe/Berlin");
    expect(f.datum?.toISOString()).toBe("2026-10-21T06:00:00.000Z");
    expect(f.genauigkeit).toBe("minute");
  });

  it("reine Datumsangabe gilt bis Tagesende und ist als solche gekennzeichnet", () => {
    const f = leseFrist("21.10.2026", "Europe/Berlin");
    expect(f.datum?.toISOString()).toBe("2026-10-21T21:59:00.000Z");
    expect(f.genauigkeit).toBe("tag");
  });

  it("eine nicht zuzuordnende Zeitangabe wird nicht geraten, sondern gemeldet", () => {
    const f = leseFrist("21.10.2026 ab 08:00", "Europe/Berlin");
    expect(f.genauigkeit).toBe("tag");
    expect(f.hinweis).toMatch(/nicht eindeutig/);
    expect(leseFrist("21.10.2026 1234", "Europe/Berlin").genauigkeit).toBe("tag");
  });

  it("ungültige Uhrzeiten bleiben ungültig", () => {
    expect(parseDatumDE("21.10.2026 um 25:00 Uhr", "Europe/Berlin")).toBeNull();
  });

  it("ein Folgedatum oder ein Betrag wird nicht als Uhrzeit gelesen", () => {
    expect(leseFrist("20.10.2026, 21.10.2026 Folgetermin", "Europe/Berlin")).toMatchObject({ genauigkeit: "tag" });
    expect(leseFrist("20.10.2026 10.15 Euro", "Europe/Berlin").genauigkeit).toBe("tag");
    expect(leseFrist("20.10.2026 10.15 Uhr", "Europe/Berlin").datum?.toISOString()).toBe("2026-10-20T08:15:00.000Z");
  });

  it("„24 Uhr“ ist das Tagesende", () => {
    for (const s of ["20.10.2026 24 Uhr", "20.10.2026 24:00"])
      expect(leseFrist(s, "Europe/Berlin")).toMatchObject({ genauigkeit: "minute", datum: new Date("2026-10-20T22:00:00.000Z") });
    expect(parseDatumDE("20.10.2026 24:30", "Europe/Berlin")).toBeNull();
  });
});

describe("RC08: Zeitzone des Profils statt Gerätezeit", () => {
  it("dieselbe Berliner Frist ergibt auf Geräten in verschiedenen Zonen denselben Zeitpunkt", () => {
    const modul = repoPfad("src/kern/zeit.ts");
    const code = `import(${JSON.stringify("file://" + modul)}).then((z) => console.log(z.zeitpunktInZone(2026, 10, 21, 12, 0, "Europe/Berlin").toISOString()))`;
    const lauf = (tz: string) =>
      execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "-e", code], { env: { ...process.env, TZ: tz }, encoding: "utf8" }).trim();
    expect(lauf("Europe/Berlin")).toBe("2026-10-21T10:00:00.000Z");
    expect(lauf("America/New_York")).toBe("2026-10-21T10:00:00.000Z");
  });

  it("Tagesüberlauf am Monatsende auch an einem Umstellungssonntag", () => {
    expect(zeitpunktInZone(2027, 10, 32, 0, 0, "Europe/Berlin").toISOString()).toBe("2027-10-31T23:00:00.000Z");
    expect(zeitpunktInZone(2030, 3, 32, 0, 0, "Europe/Berlin").toISOString()).toBe("2030-03-31T22:00:00.000Z");
    // Ausgabe am 31.10.2027 ohne Uhrzeit: Eine Frist um 23:30 liegt am Ausgabetag
    const e = eintrag("a", "Handlungsrelevant bis: 31.10.2027 23:30");
    expect(check([e], "2027-10-31", zeitpunktInZone(2027, 10, 30, 12, 0, "Europe/Berlin")).zeit[0].klasse).toBe("warn");
  });

  it("Sommerzeitwechsel: doppelte Stunde nimmt die frühere, ausgefallene wird vorgeschoben", () => {
    expect(zeitpunktInZone(2026, 10, 25, 2, 30, "Europe/Berlin").toISOString()).toBe("2026-10-25T00:30:00.000Z");
    expect(zeitpunktInZone(2026, 3, 29, 2, 30, "Europe/Berlin").toISOString()).toBe("2026-03-29T01:30:00.000Z");
  });
});

describe("RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit", () => {
  const frist = (s: string) => eintrag("a", `Handlungsrelevant bis: ${s}`);

  it("eine Frist wird mit fortschreitendem Prüfzeitpunkt als abgelaufen eingestuft", () => {
    expect(check([frist("20.10.2026 09:00")], "2026-10-23", berlin(20, 8)).zeit[0].klasse).toBe("alert");
    expect(check([frist("20.10.2026 09:00")], "2026-10-23", berlin(20, 10)).zeit[0].status).toMatch(/^Zeitfenster abgelaufen/);
  });

  it("Frist 12:00 vor Ausgabe 15:00 am selben Tag ist zeitkritisch", () => {
    const z = check([frist("23.10.2026 12:00")], "2026-10-23T15:00").zeit[0];
    expect(z.klasse).toBe("alert");
  });

  it("Frist zeitgleich mit der Ausgabe wird als zeitgleich und prüfbedürftig gemeldet", () => {
    const z = check([frist("23.10.2026 15:00")], "2026-10-23T15:00").zeit[0];
    expect([z.klasse, z.status]).toEqual(["alert", "zeitgleich mit der nächsten Ausgabe – Weitergabe vorher prüfen"]);
  });

  it("ohne Uhrzeit der Ausgabe gibt eine Frist am Ausgabetag keine grüne Entwarnung", () => {
    const z = check([frist("23.10.2026 12:00")], "2026-10-23").zeit[0];
    expect(z.klasse).toBe("warn");
    expect(z.status).toMatch(/Uhrzeit ist nicht angegeben/);
  });

  it("Frist ohne Uhrzeit am Ausgabetag bleibt zu klären", () => {
    expect(check([frist("23.10.2026")], "2026-10-23T15:00").zeit[0].klasse).toBe("warn");
  });

  it("späte Frist: eng formulierte Entwarnung", () => {
    const z = check([frist("30.10.2026 12:00")]).zeit[0];
    expect([z.klasse, z.status]).toEqual(["ok", "nach der nächsten Ausgabe – aus dieser Frist kein Anlass für eine frühere Weitergabe"]);
  });

  it("eine nicht lesbare Ausgabe ergibt keine stille Entwarnung", () => {
    const r = check([frist("30.10.2026 12:00")], "2026-02-31");
    expect(r.stand.ausgabe).toBeNull();
    expect(r.zeit[0]).toMatchObject({ klasse: "warn", status: "nächste Ausgabe nicht lesbar – Einstufung offen" });
    expect(r.abdeckung.nichtKonfiguriert.join(" ")).toMatch(/nächste Ausgabe nicht lesbar/);
  });

  it("der Prüfstand nennt Zeitpunkte und Zeitzone", () => {
    const r = check([frist("30.10.2026 12:00")], "2026-10-23");
    expect(r.stand).toMatchObject({ ausgabeMitUhrzeit: false, zeitzone: "Europe/Berlin" });
    expect(r.stand.ausgabe?.toISOString()).toBe("2026-10-22T22:00:00.000Z");
  });
});

describe("RC04: leere oder offene Kennsätze", () => {
  it("leerer Abschluss ist kein Abschluss und verdeckt weder Kern- noch Nachlaufhinweis", () => {
    const e = eintrag("a", "Abschluss im Lagebild:", "kritisch", "Entspannung");
    e.daten.sachverhalte[0].analyse.massnahmen_empfehlungen = "";
    const r = check([e]);
    expect(r.abschluss).toEqual([]);
    expect(r.marker.map((m) => m.art)).toEqual(["leer"]);
    // ein Befund statt zwei: die Nachlauffrage steht im Markerbefund
    expect(r.marker[0].text).toMatch(/Nachlauf prüfen/);
    expect(r.nachlauf).toEqual([]);
    expect(r.kern[0].fehlt).toContain("keine Angaben in „Maßnahmen & Handlungsempfehlungen“");
  });

  it.each(["nein", "offen", "nicht abgeschlossen", "kein Abschluss, Lage dauert an"])("„Abschluss im Lagebild: %s“ gilt nicht als Abschluss", (t) => {
    const e = eintrag("a", `Abschluss im Lagebild: ${t}`, "kritisch");
    e.daten.sachverhalte[0].analyse.massnahmen_empfehlungen = "";
    const r = check([e]);
    expect(r.abschluss).toEqual([]);
    expect(r.marker[0]).toMatchObject({ art: "offen" });
    expect(r.kern).toHaveLength(1);
  });

  it("ein inhaltlicher Abschluss bleibt Abschluss", () => {
    const r = check([eintrag("a", "Abschluss im Lagebild: Lage beendet, Nachsorge beim Kreis.", "kritisch", "Entspannung")]);
    expect(r.abschluss).toHaveLength(1);
    expect(r.nachlauf).toEqual([]);
    expect(r.kern).toEqual([]);
  });

  it("leere Neubewertung wird erkannt", () => {
    const r = check([eintrag("a", "Kernaussage.\nNeubewertung bei:", "kritisch")]);
    expect(r.kern[0].fehlt).toEqual(["Kennsatz „Neubewertung bei:“ ohne Inhalt"]);
  });
});

describe("RC05: nicht prüfbare Quellenverweise", () => {
  it("[Q1] mit unlesbarem Quellenverzeichnis erscheint als nicht prüfbar", () => {
    const e = eintrag("a", "Bestätigt [Q1].");
    e.daten.quellen = "Teststelle, Lagebericht, https://example.invalid";
    expect(quellenHinweise(e.daten, p.ui).find((h) => h.text.includes("nicht prüfbar"))?.stufe).toBe("warnung");
    const r = check([e]);
    expect(r.quellen[0].zeilen.join(" ")).toMatch(/\[Q1\] nicht prüfbar/);
    expect(r.anzahl).toBeGreaterThan(0);
  });

  it("ohne Verweise bleibt das unlesbare Verzeichnis ein nachrangiger Hinweis", () => {
    const e = eintrag("a", "Ohne Verweis.");
    e.daten.quellen = "Teststelle, Lagebericht";
    expect(quellenHinweise(e.daten, p.ui).find((h) => h.text.includes("nicht prüfbar"))?.stufe).toBe("hinweis");
  });
});

describe("RC06: unterschiedliche und gegenläufige Tendenzen", () => {
  it("Stabilisierung und Verschärfung: unterschiedlich, nicht gegenläufig", () => {
    const g = check([eintrag("a", "", "geringfügig", "Stabilisierung"), eintrag("b", "", "geringfügig", "Verschärfung")]).gruppen[0];
    expect(g).toMatchObject({ tendenzAbweichend: true, tendenzGegenlaeufig: false });
  });

  it("Entspannung und Verschärfung: gegenläufig und gezählt", () => {
    const r = check([eintrag("a", "", "geringfügig", "Entspannung"), eintrag("b", "", "geringfügig", "Verschärfung")]);
    expect(r.gruppen[0].tendenzGegenlaeufig).toBe(true);
    expect(r.abschnitte[1]).toBe(1);
  });
});

describe("RC07: eine Schwellenregel für Kennzahlen und Redaktionscheck", () => {
  it("ohne beurteilung_hoch prüft der Check dieselben Stufen wie die Kennzahlen und sagt das", () => {
    const pp = structuredClone(p);
    delete pp.ui.rollen.beurteilung_hoch;
    const e = eintrag("a", "", "kritisch");
    e.daten.sachverhalte[0].analyse.massnahmen_empfehlungen = "";
    expect(kennzahlen([e], pp).hoch.find((h) => h.stufe === "kritisch")?.anzahl).toBe(1);
    const r = check([e], "2026-10-23T15:00", berlin(20, 12), pp);
    expect(r.kern).toHaveLength(1);
    expect(r.hoch.abgeleitet).toBe(true);
    expect(r.abdeckung.hinweise.join(" ")).toMatch(/aus dem Schema abgeleitet/);
  });

  it("das Beispielprofil behält seine ausdrücklichen Stufen", () => {
    expect(check([eintrag()]).hoch).toEqual({ stufen: ["kritisch", "erheblich"], abgeleitet: false });
  });
});

describe("RV04, RV06: Zählung und Abdeckung", () => {
  it("jede gezählte Zahl ergibt sich aus der Befundliste", () => {
    const e = eintrag("a", "Handlungsrelevant bis: 21.10.2026 12:00\nAbschluss im Lagebild:", "kritisch", "Entspannung");
    e.schema = [1, 2, 3].map((i) => ({ pfad: "/x" + i, keyword: "type", text: "Fehler " + i }));
    const r = check([e, eintrag("b", "", "erheblich", "Verschärfung")]);
    const liste = befundListe(r, p);
    expect(liste.filter((b) => b.klasse === "alert").length).toBe(r.uebersicht.zeitkritisch);
    expect(liste.filter((b) => b.klasse === "warn").length).toBe(r.uebersicht.zuKlaeren);
    expect(liste.filter((b) => b.klasse === "info").length).toBe(r.uebersicht.info);
    expect(r.anzahl).toBe(r.uebersicht.zeitkritisch + r.uebersicht.zuKlaeren);
    expect(r.abschnitte.reduce((a, b) => a + b, 0)).toBe(r.anzahl);
    // alle drei Schemafehler bleiben einzeln lesbar
    expect(r.quellen.find((q) => q.eintrag.id === "a")!.zeilen.filter((z) => z.startsWith("Schema:"))).toHaveLength(3);
  });

  it("nicht konfigurierte Regeln und fremde Schemata werden ausgewiesen", () => {
    const pp = structuredClone(p);
    delete pp.ui.kennsaetze!.handlungsrelevant;
    const fremd = { ...eintrag("f"), fremd: { schema: "x", stelle: "Y", land: "", zeitpunkt: "", sachverhalte: 1 } as any };
    const r = check([eintrag("a"), fremd], "2026-10-23", berlin(20, 12), pp);
    expect(r.abdeckung).toMatchObject({ meldungen: 1, fremd: 1 });
    expect(r.abdeckung.nichtKonfiguriert.join(" ")).toMatch(/Zeitfenster/);
  });
});

describe("RV03, RV07: Textbaustein und Redaktionsbericht", () => {
  it("der Baustein nennt Sachverhalt und Stand je Aussage", () => {
    const a = eintrag("a", "", "geringfügig");
    const b = eintrag("b", "", "erheblich");
    a.daten.meldezeitpunkt = "2026-10-20T09:00";
    const t = abweichungsBaustein(alleSachverhalte([a, b], p), p);
    expect(t).toContain(`Stelle a (${a.daten.sachverhalte[0].bezeichnung}, Stand 20.10.2026, 09:00 Uhr) „geringfügig“`);
  });

  it("der Bericht enthält Prüfstand, Profil, Meldungen mit Kennung und alle Befunde", () => {
    const e = eintrag("a", "Handlungsrelevant bis: 21.10.2026 12:00");
    const r = check([e]);
    const b = redaktionsbericht(r, [e], p, "KI-LEAD test");
    const j = JSON.parse(b.json);
    expect(j.format).toBe("ki-lead-redaktionsbericht/1");
    expect(j.profil).toMatchObject({ id: p.manifest.id, version: p.manifest.version, pruefsumme: p.hash });
    expect(j.pruefstand).toEqual({ geprueft_fuer: "20.10.2026, 12:00 Uhr", naechste_ausgabe: "23.10.2026, 15:00 Uhr", zeitzone: "Europe/Berlin" });
    expect(j.meldungen[0]).toMatchObject({ datei: "a.json", kennung: "a", ausgewertet: true });
    expect(j.befunde[0]).toMatchObject({ abschnitt: "1 Zeitfenster", einstufung: "zeitkritisch" });
    expect(b.text).toContain("Keine fachliche Prüfung oder Freigabe");
    expect(b.text).toMatch(/\[zeitkritisch\] Testland · Stelle a · .*Handlungsrelevant bis: 21\.10\.2026 12:00/);
  });
});

describe("F07: Redaktionscheck wertet jede Frist eines Sachverhalts aus", () => {
  it("findet die zweite, frühere Frist unabhängig von der Reihenfolge", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = ilkaMeldung("Bund");
    d.sachverhalte = [d.sachverhalte[0]];
    d.sachverhalte[0].sofort.bewertung_text = "Handlungsrelevant bis: 30.10.2026 12:00\nHandlungsrelevant bis: 21.10.2026 12:00";
    const e = { id: "test", name: "test.json", daten: d, hinweise: [], schema: [], fremd: null } as any;
    const r = redaktionscheck([e], p, new Date(2026, 9, 23), new Date(2026, 9, 20, 12));
    expect(r.zeit.map((z) => [z.text, z.klasse])).toEqual([
      ["21.10.2026 12:00", "alert"],
      ["30.10.2026 12:00", "ok"],
    ]);
  });
});

describe("GK-2026-W44-01: je Frist eine Zeile (A.4), mehrere Fristen in einer Zeile werden gekennzeichnet", () => {
  // Prüfzeitpunkt 14.10.2026 14:00, nächste Ausgabe 15.10.2026 10:00 (Europe/Berlin)
  const zwei = "Handlungsrelevant bis: 14.10.2026 12:00 – Abstimmung Notstromversorgung, Landkreis; Grundlage: Lagemeldung [Q1]";
  const zweite = "16.10.2026 12:00 – Rückmeldung Kraftstoffbedarf, Gemeinden; Grundlage: Landratsamt [Q1]";

  it("zwei Zeilen: zwei Zeitstatus, nur die erste Frist abgelaufen", () => {
    const red = check([eintrag("a", `Kernaussage: Z.\n${zwei}\nHandlungsrelevant bis: ${zweite}`)], "2026-10-15T10:00", berlin(14, 14));
    expect(red.zeit.map((z) => [z.datum?.toISOString(), z.klasse])).toEqual([
      ["2026-10-14T10:00:00.000Z", "warn"],
      ["2026-10-16T10:00:00.000Z", "ok"],
    ]);
    expect(red.zeit[0].status).toMatch(/abgelaufen/);
    expect(red.zeit.some((z) => z.hinweis?.includes("mehrere Fristen"))).toBe(false);
  });

  it("eine Zeile mit zwei Fristen: ein Eintrag mit Hinweis zur Berichtigung, nie als unkritisch eingestuft", () => {
    const red = check(
      [eintrag("a", `Kernaussage: Z.\nHandlungsrelevant bis: ${zweite}; 17.10.2026 12:00 – Bericht, Land; Grundlage: [Q1]`)],
      "2026-10-15T10:00",
      berlin(14, 14),
    );
    expect(red.zeit).toHaveLength(1);
    expect(red.zeit[0].hinweis).toContain("mehrere Fristen in einer Zeile – je Frist eine eigene Zeile „Handlungsrelevant bis:“ (A.4)");
    expect(red.zeit[0].klasse).toBe("warn");
  });
});

// LEAD-Eingabehilfen (Umsetzungsbeschreibung vom 21.10.2026, A11): Vorlagen mit offenen Stellen ⟦…⟧
describe("Redaktionscheck: Kennsätze aus Vorlagen mit offenen Stellen", () => {
  it("Abschluss, Änderung, Abweichung und Neubewertung mit ⟦…⟧ zählen nicht als Vermerk", () => {
    const red = redaktionscheck(
      [
        eintrag(
          "a",
          "Kernaussage: Z.\nNeubewertung bei: ⟦Indikator⟧\nÄnderung zur Vormeldung: ⟦Änderung⟧\nAbweichende Bewertung: ⟦Stelle A⟧\nAbschluss im Lagebild: ⟦Ende⟧; offen bleiben: ⟦Punkte⟧; Nachsorge bei: ⟦Stelle⟧",
          "kritisch",
          "Entspannung",
        ),
      ],
      p,
      "2026-10-23T15:00",
      berlin(20, 12),
    );
    expect(red.abschluss).toEqual([]);
    expect(red.aenderung).toEqual([]);
    expect(red.vermerkt).toEqual([]);
    expect(red.marker.map((m) => [m.kennsatz, m.art])).toEqual(
      expect.arrayContaining([
        ["Abschluss im Lagebild:", "offen"],
        ["Änderung zur Vormeldung:", "offen"],
        ["Abweichende Bewertung:", "offen"],
      ]),
    );
    expect(red.kern[0]?.fehlt.join(" ")).toMatch(/„Neubewertung bei:“ mit offenen Vorlagenstellen/);
  });

  it("Frist mit Datum und offenen Angaben: „Angaben unvollständig“", () => {
    const red = redaktionscheck(
      [eintrag("a", "Kernaussage: Z.\nHandlungsrelevant bis: 22.10.2026 12:00 – ⟦Aufgabe, Adressat⟧ – ⟦Bedingung, falls zutreffend⟧; Grundlage: [Q1]")],
      p,
      "2026-10-23T15:00",
      berlin(20, 12),
    );
    expect(red.zeit).toHaveLength(1);
    expect(red.zeit[0].hinweis).toMatch(/offene Vorlagenstellen ⟦…⟧ – Angaben unvollständig/);
  });
});

describe("ZS-2026-W44-06: Fortschreibung, Doppelvergabe und Bezug über die Sachverhaltskennung", () => {
  // Soll: Kodierleitfaden Abschnitt 8 und SOP-LEAD A.7.1 – dieselbe Kennung derselben Stelle ist eine Fortschreibung,
  // dieselbe Kennung bei verschiedenen Stellen ein Vergabefehler; ein Bezug auf eine nicht geladene Kennung ein Hinweis.
  const K1 = "DE-TH-20261014-K7QM";
  const K2 = "DE-NI-20261014-3HXA";
  const mit = (id: string, stelle: string, zeitpunkt: string, kennung: string, bezug?: string[]) => {
    const e = eintrag(id);
    e.daten.meldende_stelle = stelle;
    e.daten.meldezeitpunkt = zeitpunkt;
    e.daten.sachverhalte[0].kennung = kennung;
    if (bezug) e.daten.sachverhalte[0].bezug = bezug;
    else delete e.daten.sachverhalte[0].bezug;
    return e;
  };

  it("zwei Fassungen derselben Stelle mit gleicher Kennung: eine Fortschreibung, kein Rückfall nach Stelle", () => {
    const red = check([mit("n", "Stelle X", "2026-10-15T09:00", K1), mit("a", "Stelle X", "2026-10-14T09:00", K1)]);
    expect(red.kennungen).toHaveLength(1);
    expect(red.kennungen[0]).toMatchObject({ art: "fortschreibung", kennung: K1 });
    expect(red.kennungen[0]!.sachverhalte.map((s) => s.eintrag.id)).toEqual(["a", "n"]);
    expect(red.mehrfach).toEqual([]);
    expect(befundListe(red, p).filter((b) => b.bezug === K1)).toEqual([expect.objectContaining({ abschnitt: 3, klasse: "warn" })]);
  });

  it("dieselbe Kennung bei zwei Stellen ist ein Vergabebefund (zu klären)", () => {
    const red = check([mit("a", "Stelle X", "2026-10-14T09:00", K1), mit("b", "Stelle Y", "2026-10-14T10:00", K1)]);
    expect(red.kennungen.map((k) => [k.art, k.kennung])).toEqual([["doppelt", K1]]);
    expect(red.abschnitte[2]).toBe(1);
  });

  it("zwei Meldungen derselben Stelle mit verschiedenen Kennungen sind eigenständig: kein Befund", () => {
    const red = check([mit("a", "Stelle X", "2026-10-14T09:00", K1), mit("b", "Stelle X", "2026-10-15T09:00", K2)]);
    expect(red.kennungen).toEqual([]);
    expect(red.mehrfach).toEqual([]);
  });

  it("Bezug auf eine nicht geladene Kennung ist ein Hinweis, auf eine geladene kein Befund", () => {
    const red = check([mit("a", "Stelle X", "2026-10-14T09:00", K1), mit("v", "Stelle V", "2026-10-14T14:00", "DE-20261014-ABCD", [K1, K2])]);
    expect(red.kennungen.map((k) => [k.art, k.kennung])).toEqual([["bezug", K2]]);
    expect(red.abschnitte[2]).toBe(0);
    expect(befundListe(red, p).find((b) => b.bezug === K2)).toMatchObject({ abschnitt: 3, klasse: "info" });
  });

  it("Rückfall: Meldungen derselben Stelle ohne Kennung bleiben nach Stelle gruppiert", () => {
    const red = check([mit("a", "Stelle X", "2026-10-14T09:00", ""), mit("b", "Stelle X", "2026-10-15T09:00", "")]);
    expect(red.kennungen).toEqual([]);
    expect(red.mehrfach).toHaveLength(1);
  });
});
