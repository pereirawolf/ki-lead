// Redaktionscheck im Lagebild: Sollverhalten zum Review „KI-LEAD_Redaktionscheck_Review_2026-10-20“ (RC02–RC08,
// RV01, RV03, RV04, RV06, RV07). Zeitangaben gelten in der Profilzeitzone Europe/Berlin.
import { beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { jsonDateien, profil } from "./hilfen";
import type { Profil } from "../src/kern/typen";
import { alleSachverhalte, kennzahlen, type LagebildEintrag } from "../src/lagebild/lagebild";
import { abweichungsBaustein, befundListe, redaktionsbericht, redaktionscheck } from "../src/lagebild/redaktion";
import { leseFrist, parseDatumDE } from "../src/kern/kennsaetze";
import { quellenHinweise } from "../src/kern/quellen";
import { zeitpunktInZone } from "../src/kern/zeit";

let p: Profil;
let basis: any;
beforeAll(async () => {
  p = (await profil("lead-beispiel")).profil!;
  basis = jsonDateien("../profile/lead-beispiel/beispiele/orkantief-ilka")[0].daten;
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
});

describe("RC08: Zeitzone des Profils statt Gerätezeit", () => {
  it("dieselbe Berliner Frist ergibt auf Geräten in verschiedenen Zonen denselben Zeitpunkt", () => {
    const modul = join(__dirname, "../src/kern/zeit.ts");
    const code = `import(${JSON.stringify("file://" + modul)}).then((z) => console.log(z.zeitpunktInZone(2026, 10, 21, 12, 0, "Europe/Berlin").toISOString()))`;
    const lauf = (tz: string) =>
      execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "-e", code], { env: { ...process.env, TZ: tz }, encoding: "utf8" }).trim();
    expect(lauf("Europe/Berlin")).toBe("2026-10-21T10:00:00.000Z");
    expect(lauf("America/New_York")).toBe("2026-10-21T10:00:00.000Z");
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

  it("der Prüfstand nennt Zeitpunkte und Zeitzone", () => {
    const r = check([frist("30.10.2026 12:00")], "2026-10-23");
    expect(r.stand).toMatchObject({ ausgabeMitUhrzeit: false, zeitzone: "Europe/Berlin" });
    expect(r.stand.ausgabe.toISOString()).toBe("2026-10-22T22:00:00.000Z");
  });
});

describe("RC04: leere oder offene Kennsätze", () => {
  it("leerer Abschluss ist kein Abschluss und verdeckt weder Kern- noch Nachlaufhinweis", () => {
    const e = eintrag("a", "Abschluss im Lagebild:", "kritisch", "Entspannung");
    e.daten.sachverhalte[0].analyse.massnahmen_empfehlungen = "";
    const r = check([e]);
    expect(r.abschluss).toEqual([]);
    expect(r.marker.map((m) => m.art)).toEqual(["leer"]);
    expect(r.nachlauf).toHaveLength(1);
    expect(r.kern[0].fehlt).toContain("keine Angaben in „Maßnahmen & Handlungsempfehlungen“");
  });

  it("„Abschluss im Lagebild: nein“ gilt nicht als Abschluss", () => {
    const r = check([eintrag("a", "Abschluss im Lagebild: nein", "kritisch")]);
    expect(r.abschluss).toEqual([]);
    expect(r.marker[0]).toMatchObject({ art: "offen" });
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
