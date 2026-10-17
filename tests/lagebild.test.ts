import { describe, expect, test } from "vitest";
import { profil } from "./hilfen";
import {
  alleSachverhalte,
  beispielDateien,
  beurteilungsStufen,
  einlesen,
  erinnerungMailto,
  farbeBeurteilung,
  farbeTendenz,
  inhaltsKennung,
  kennzahlen,
  meldestatus,
  mehrfachMeldungen,
  nachSchwere,
  verschaerfungsWert,
  type LagebildDatei,
} from "../src/lagebild/lagebild";
import { redaktionscheck } from "../src/lagebild/redaktion";
import { alsCsv, kopiervorlageHtml, rohtabelle } from "../src/lagebild/ausgabe";

const p = (await profil("lead-beispiel")).profil!;
const muster = (await profil("muster")).profil!;
const ilka = beispielDateien(p, "beispiele/orkantief-ilka");
const datei = (name: string, obj: unknown): LagebildDatei => ({
  name,
  text: typeof obj === "string" ? obj : JSON.stringify(obj),
  importiertAm: "2026-10-14T12:00:00Z",
});

describe("Lagebild: Einlesen", () => {
  test("Beispiellage aus dem Profilpaket: sieben Meldungen, schemakonform", () => {
    expect(ilka).toHaveLength(7);
    const { eintraege, fehler } = einlesen(ilka, p);
    expect(fehler).toEqual([]);
    expect(eintraege).toHaveLength(7);
    expect(eintraege.every((e) => e.schema.length === 0 && !e.fremd)).toBe(true);
    expect(alleSachverhalte(eintraege, p)).toHaveLength(8);
  });

  test("gleiche Inhalte nur einmal, Fehler je Datei, fremdes Schema erkannt", () => {
    const fremd = { schema: "Andere-Meldung-v3", meldende_stelle: "Lagezentrum X", sachverhalte: [{ titel: "Hochwasser" }] };
    const { eintraege, fehler } = einlesen(
      [
        ilka[0],
        { ...ilka[0], name: "kopie.json" },
        datei("kaputt.json", "{"),
        datei("liste.json", [1, 2]),
        datei("notiz.json", { text: "kein Bericht" }),
        datei("fremd.json", fremd),
      ],
      p,
    );
    expect(eintraege.map((e) => e.name)).toEqual([ilka[0].name, "fremd.json"]);
    expect(eintraege[1].fremd?.stelle).toBe("Lagezentrum X");
    expect(eintraege[1].schema).toEqual([]);
    expect(fehler.map((f) => f.name)).toEqual(["kaputt.json", "liste.json", "notiz.json"]);
    expect(alleSachverhalte(eintraege, p)).toHaveLength(1);
    expect(inhaltsKennung("a")).not.toBe(inhaltsKennung("b"));
  });

  test("Schemaabweichung und Entwurf werden je Meldung geführt", () => {
    const m = JSON.parse(ilka[1].text);
    m._status = "Entwurf";
    m.sachverhalte[0].sofort.beurteilung = "katastrophal";
    const { eintraege } = einlesen([datei("x.json", m)], p);
    expect(eintraege[0].schema.length).toBeGreaterThan(0);
    const k = kennzahlen(eintraege, p);
    expect(k.schemaAbweichungen).toBe(1);
    expect(k.entwuerfe).toBe(1);
    const red = redaktionscheck(eintraege, p, new Date(2026, 9, 21));
    expect(red.quellen[0].klasse).toBe("alert");
    expect(red.quellen[0].zeilen.some((z) => z.includes("Entwurf"))).toBe(true);
  });
});

describe("Lagebild: Auswertung", () => {
  const { eintraege } = einlesen(ilka, p);

  test("Stufen und Farben aus dem Schema, Sortierung nach Schwere", () => {
    expect(beurteilungsStufen(p)).toEqual(["geringfügig", "erheblich", "kritisch"]);
    expect(farbeBeurteilung(p, "kritisch")).toBe("rot");
    expect(farbeBeurteilung(p, "erheblich")).toBe("orange");
    expect(farbeBeurteilung(p, "geringfügig")).toBe("gelb");
    expect(farbeBeurteilung(p, "")).toBe("grau");
    expect(farbeTendenz(p, "Entspannung")).toBe("gruen");
    expect(farbeTendenz(p, "Verschärfung")).toBe("rot");
    expect(farbeTendenz(p, "Stabilisierung")).toBe("gelb");
    const s = nachSchwere(alleSachverhalte(eintraege, p), p);
    expect(s[0].beurteilung).toBe("erheblich");
    expect(s[s.length - 1].beurteilung).toBe("geringfügig");
  });

  test("Kennzahlen", () => {
    const k = kennzahlen(eintraege, p);
    expect(k.meldungen).toBe(7);
    expect(k.sachverhalte).toBe(8);
    expect(k.hoch).toEqual([
      { stufe: "kritisch", anzahl: 0, farbe: "rot" },
      { stufe: "erheblich", anzahl: 5, farbe: "orange" },
    ]);
    expect(k.verschaerfung).toEqual({ wert: "Verschärfung", anzahl: 1 });
  });

  test("Meldestatus nach Kontaktliste, Erinnerung als mailto", () => {
    const ms = meldestatus(eintraege, p)!;
    expect(ms.zeilen).toHaveLength(17);
    expect(ms.zeilen.filter((z) => z.eintraege.length).map((z) => z.name)).toEqual([
      "Hessen",
      "Niedersachsen",
      "Nordrhein-Westfalen",
      "Rheinland-Pfalz",
      "Sachsen-Anhalt",
      "Thüringen",
      "Bund",
    ]);
    const bayern = ms.zeilen.find((z) => z.name === "Bayern")!;
    const link = erinnerungMailto(bayern, p.kontakte);
    expect(link.startsWith("mailto:lage%40beispiel.invalid?subject=")).toBe(true);
    expect(decodeURIComponent(link)).toContain("Meldung aus Bayern vor");
  });

  test("Redaktionscheck: Zeitfenster, abweichende Bewertungen, Nachlauf, Abschluss", () => {
    const red = redaktionscheck(eintraege, p, new Date(2026, 9, 21), new Date(2026, 9, 14, 15));
    expect(red.zeit.length).toBe(5);
    expect(red.zeit.every((z) => z.klasse === "alert")).toBe(true);
    const strom = red.gruppen.find((g) => g.art === "Stromausfall / Blackout")!;
    expect(strom.abweichend).toBe(true);
    expect(strom.baustein).toMatch(/^Abweichende Bewertung: .*„geringfügig“ – \[tragender Grund\].*Klärend wäre: \[Information\]\.$/);
    expect(red.gruppen.find((g) => g.art === "KRITIS-Ausfall")?.abweichend).toBe(false);
    expect(red.vermerkt.length).toBe(2);
    expect(red.abschluss.length).toBe(2);
    expect(red.nachlauf.length).toBe(3);
    expect(red.kern).toEqual([]);
    expect(red.quellen).toEqual([]);
    // Nach Ablauf aller Zeitfenster: Aktualität prüfen
    const spaeter = redaktionscheck(eintraege, p, new Date(2026, 9, 28), new Date(2026, 9, 20));
    expect(spaeter.zeit.every((z) => z.status.startsWith("Zeitfenster abgelaufen"))).toBe(true);
    // Weit entfernte Ausgabe → frühere Weitergabe prüfen; nahe Ausgabe → keine Sonderweitergabe
    const morgen = redaktionscheck(eintraege, p, new Date(2026, 9, 14, 18), new Date(2026, 9, 14, 15));
    expect(morgen.zeit.filter((z) => z.klasse === "ok").length).toBe(5);
  });

  test("Mehrere Meldungen derselben Stelle werden als mögliche Fortschreibung gemeldet", () => {
    const m = JSON.parse(ilka[2].text);
    m.meldezeitpunkt = "2026-10-15T09:00";
    const { eintraege: zwei } = einlesen([ilka[2], datei("neuer.json", m)], p);
    const mf = mehrfachMeldungen(zwei, p);
    expect(mf).toHaveLength(1);
    expect(mf[0].eintraege.map((e) => e.name)).toEqual([ilka[2].name, "neuer.json"]);
    expect(redaktionscheck(zwei, p, new Date(2026, 9, 21)).mehrfach).toHaveLength(1);
  });

  test("fehlende Kernaussage bei hoher Beurteilung", () => {
    const m = JSON.parse(ilka[2].text);
    m.sachverhalte[0].sofort.bewertung_text = "Lage angespannt.";
    m.sachverhalte[0].analyse.massnahmen_empfehlungen = "";
    const red = redaktionscheck(einlesen([datei("x.json", m)], p).eintraege, p, new Date(2026, 9, 21));
    expect(red.kern[0].fehlt).toEqual(["kein Kennsatz „Neubewertung bei:“", "keine Angaben in „Maßnahmen & Handlungsempfehlungen“"]);
  });
});

describe("Lagebild: Ausgabe", () => {
  const { eintraege } = einlesen(ilka, p);

  test("Rohtabelle generisch aus dem Schema, CSV mit Semikolon und BOM", () => {
    const t = rohtabelle(eintraege, p);
    expect(t).toHaveLength(9);
    expect(t[0][0]).toBe("Datei");
    expect(t[0]).toContain("D8 Dynamik");
    expect(t[0]).toContain("Sofortbereich › Bewertung");
    expect(t[0][t[0].length - 1]).toBe("Schemaprüfung");
    const iD1 = t[0].indexOf("D1 Räumliche Auswirkung / Impact-Raum");
    expect(t.slice(1).every((z) => /^\d$|^$/.test(z[iD1]))).toBe(true);
    const csv = alsCsv([
      ["a;b", 'c"d', "e\nf"],
      ["1", "2", "3"],
    ]);
    expect(csv).toBe('﻿"a;b";"c""d";"e\nf"\r\n1;2;3\r\n');
  });

  test("Kopiervorlage: Word-Tabelle, Inhalte maskiert, nur zitierte Quellen", () => {
    const svs = alleSachverhalte(eintraege, p);
    const sv = svs.find((s) => s.stelle.startsWith("Thüringer") && s.beurteilung === "erheblich")!;
    const html = kopiervorlageHtml(sv, p, () => "data:image/png;base64,AAAA");
    expect(html).toContain("<table");
    expect(html).toContain("Lage &amp; Ereignis:");
    expect(html).toContain('src="data:image/png;base64,AAAA"');
    expect(html).toContain("&#9632;");
    expect(html).toContain("Meldung von: Thüringer Ministerium");
    const boese = { ...sv, bezeichnung: '<img src=x onerror="alert(1)">' };
    expect(kopiervorlageHtml(boese, p)).not.toContain("<img src=x");
    // Ohne Radarbild bleibt die Legende
    const ohneBild = kopiervorlageHtml(sv, p);
    expect(ohneBild).toMatch(/D1 Räumliche Auswirkung \/ Impact-Raum: \d – [^<]+<br>D2 Personelle Direktbetroffenheit: /);
    expect(ohneBild).not.toMatch(/D1: \d/);
  });

  test("schlankes Musterprofil ohne Tendenz und Land", () => {
    const m = {
      schema: "Muster-LEAD-Meldung-v1",
      _status: "final",
      meldende_stelle: "Einsatzleitung A",
      meldezeitpunkt: "2026-10-14T10:00",
      quellen: "",
      sachverhalte: [{ bezeichnung: "Brand Lagerhalle", art: [], bewertung: "erheblich", bewertung_text: "Kernaussage.", lage: "Text", radar: {} }],
    };
    const { eintraege: e } = einlesen([datei("m.json", m)], muster);
    expect(verschaerfungsWert(muster)).toBeUndefined();
    expect(kennzahlen(e, muster).verschaerfung).toBeUndefined();
    expect(meldestatus(e, muster)).toBeNull();
    expect(() => redaktionscheck(e, muster, new Date())).not.toThrow();
    expect(rohtabelle(e, muster)).toHaveLength(2);
    expect(kopiervorlageHtml(alleSachverhalte(e, muster)[0], muster)).toContain("Brand Lagerhalle");
  });
});

test("Radarwerte als Klartext mit Achsen- und Stufenbezeichnung", async () => {
  const { radarZeilen } = await import("../src/kern/ui");
  const def = {
    max: 2,
    achsen: [
      { key: "d1", label: "D1 Raum", stufen: ["lokal", "regional", "landesweit"] },
      { key: "d2", label: "D2 Personen", stufen: ["wenige", "viele", "sehr viele"] },
    ],
  };
  expect(radarZeilen(def, { d1: 2, d2: null })).toEqual(["D1 Raum: 2 – landesweit", "D2 Personen: offen"]);
});
