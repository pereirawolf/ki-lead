// Nachbearbeitung von Kennung, Bezug und Zeitstrahl nach S2 (seit 0.6.9, ZS-2026-W44-01 bis -04): Kennungen vergibt nur
// die App, der Bezug nennt nur Kennungen aus vorliegenden Meldungen, Zeilen der eigenen Vormeldung bleiben wortgleich,
// Bewertungswechsel trägt die App ein. Dazu die Regeln im Steuerungsblock von S2 und ein ganzer Lauf der Fortschreibung.
// Alle Daten sind fiktiv (Orkantief „Ilka“ aus dem Beispielprofil).
import { beforeAll, describe, expect, it } from "vitest";
import { istKennung } from "../../src/kern/kennung";
import type { Befund, Meldung, Profil } from "../../src/kern/typen";
import { parseZeitstrahl } from "../../src/kern/zeitstrahl";
import { steuerungsBlock, zeitstrahlSteuerung } from "../../src/pipeline/kontext";
import { dateiLesen, rolleSetzen, type Material } from "../../src/pipeline/material";
import { stufe1 } from "../../src/pipeline/s1";
import { stufe2und3 } from "../../src/pipeline/s2s3";
import { zeitstrahlNachbearbeiten, zeitstrahlVorgaben } from "../../src/pipeline/zeitstrahl";
import { llmAntwort, meldungsAntwort, skriptAnbieter } from "../support/anbieter";
import { profilPflicht } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { pipelineKontext, s1Vorschlag } from "../support/pipeline";

let p: Profil;
beforeAll(async () => {
  p = await profilPflicht("lead-beispiel");
});

const BUND = "DE-20261014-7QKD";
const JETZT = new Date("2026-10-22T04:07:00Z"); // 22.10.2026 06:07 Europe/Berlin
/** Feste Zufallsfolge: jede neue Kennung endet auf „ABCD“ bzw. bei Doppelung auf „BCDE“ usw. */
function zufall() {
  let n = 0;
  const reihe = [10, 11, 12, 13, 11, 12, 13, 14, 12, 13, 14, 15];
  return () => reihe[n++ % reihe.length]! / 32;
}

const mat = (art: "meldung" | "eingang", meldung: Meldung, name = "m.json"): Material => ({ id: name, art, name, groesse: 1, hash: name, meldung });

/** Eigene Vormeldung: Bundesmeldung „Ilka“, Meldezeitpunkt 21.10.2026 19:40 */
function vormeldung(): Meldung {
  const m = ilkaMeldung("Bund");
  m.meldezeitpunkt = "2026-10-21T19:40";
  return m;
}

/** Entwurf der KI für die Fortschreibung am 22.10.2026 06:06 */
function entwurf(): Meldung {
  const m = vormeldung();
  m.meldezeitpunkt = "2026-10-22T06:06";
  return m;
}

function nachbearbeiten(d: Meldung, material: Material[]) {
  const befunde: Befund[] = [];
  zeitstrahlNachbearbeiten(d, p, { material, jetzt: JETZT, zufall: zufall() }, befunde);
  return befunde;
}
const zeilen = (d: Meldung) => String(d.zeitstrahl).split("\n");

describe("ZS-2026-W44-02: Kennungen vergibt nur die App", () => {
  it("Erfassung: Platzhalter NEU-1 und NEU-2 werden ersetzt, in Zeitstrahl und Bezug nachgezogen", () => {
    const d = ilkaMeldung("TH");
    d.sachverhalte[0].kennung = "NEU-1";
    d.sachverhalte[1].kennung = "NEU-2";
    d.sachverhalte[1].bezug = ["NEU-1"];
    d.zeitstrahl =
      "[Z1] 2026-10-13T22:30 · NEU-2 · Ereignis – Höchststand 18.000 Anschlüsse [Q4]\n[Z2] 2026-10-13T21:00 · NEU-1 · Maßnahme – A 71 gesperrt [Q8]";
    const b = nachbearbeiten(d, []);
    // Präfix aus dem Feld „Land“ (Thüringen), Datum aus der Bearbeitungszeit (22.10.2026)
    expect(d.sachverhalte.map((sv: any) => sv.kennung)).toEqual(["DE-TH-20261022-ABCD", "DE-TH-20261022-BCDE"]);
    expect(d.sachverhalte[1].bezug).toEqual(["DE-TH-20261022-ABCD"]);
    // chronologisch geordnet und mit den vergebenen Kennungen
    expect(zeilen(d)).toEqual([
      "[Z2] 2026-10-13T21:00 · DE-TH-20261022-ABCD · Maßnahme – A 71 gesperrt [Q8] · aufgenommen 2026-10-14T10:30",
      "[Z1] 2026-10-13T22:30 · DE-TH-20261022-BCDE · Ereignis – Höchststand 18.000 Anschlüsse [Q4] · aufgenommen 2026-10-14T10:30",
    ]);
    expect(b).toEqual([]);
  });

  it("erfundene Kennung wird ersetzt und gemeldet; leere erhält still eine neue", () => {
    const d = ilkaMeldung("TH");
    d.sachverhalte[0].kennung = "DE-TH-20261001-ZZZZ";
    d.sachverhalte[1].kennung = "";
    const b = nachbearbeiten(d, []);
    expect(d.sachverhalte.every((sv: any) => istKennung(sv.kennung) && sv.kennung.startsWith("DE-TH-20261022-"))).toBe(true);
    expect(b.map((x) => x.code)).toEqual(["KENNUNG_ERSETZT"]);
    expect(b[0]!.text).toContain("„DE-TH-20261001-ZZZZ“");
  });

  it("Fortschreibung: die Kennung der eigenen Vormeldung bleibt", () => {
    const d = entwurf();
    const b = nachbearbeiten(d, [mat("meldung", vormeldung())]);
    expect(d.sachverhalte[0].kennung).toBe(BUND);
    expect(b).toEqual([]);
  });

  it("Verdichtung: Kennung eines Eingangs als eigene → neue Kennung, die fremde wandert in den Bezug", () => {
    const he = ilkaMeldung("HE");
    const d = ilkaMeldung("Bund");
    d.sachverhalte[0].kennung = he.sachverhalte[0].kennung;
    d.sachverhalte[0].bezug = [];
    d.zeitstrahl = `[Z1] 2026-10-14T06:00 · ${he.sachverhalte[0].kennung} · Wiederherstellung – Schnellfahrstrecke frei [Q3]`;
    const b = nachbearbeiten(d, [mat("eingang", he, "he.json")]);
    expect(d.sachverhalte[0].kennung).toBe("DE-20261022-ABCD");
    expect(d.sachverhalte[0].bezug).toEqual(["DE-HE-20261014-6RWA"]);
    expect(zeilen(d)).toEqual(["[Z1] 2026-10-14T06:00 · DE-20261022-ABCD · Wiederherstellung – Schnellfahrstrecke frei [Q3] · aufgenommen 2026-10-14T14:00"]);
    expect(b.map((x) => x.code)).toEqual(["KENNUNG_FREMD"]);
  });
});

describe("ZS-2026-W44-03: Bezug nur auf vorliegende Kennungen", () => {
  it("unbekannte Kennung entfällt mit Warnung; Zeilen mit der Kennung eines Eingangs gehen an den Sachverhalt mit diesem Bezug", () => {
    const he = ilkaMeldung("HE");
    const ni = ilkaMeldung("NI");
    const d = ilkaMeldung("Bund");
    d.sachverhalte[0].kennung = "NEU-1";
    d.sachverhalte[0].bezug = ["DE-HE-20261014-6RWA", "DE-NI-20261014-3HXA", "DE-BY-20261014-AAAA"];
    d.zeitstrahl = "[Z1] 2026-10-14T05:00 · DE-NI-20261014-3HXA · Wendepunkt – Oberharz: Ausfall steigt wieder [Q4]";
    const b = nachbearbeiten(d, [mat("eingang", he, "he.json"), mat("eingang", ni, "ni.json")]);
    expect(d.sachverhalte[0].bezug).toEqual(["DE-HE-20261014-6RWA", "DE-NI-20261014-3HXA"]);
    expect(zeilen(d)).toEqual(["[Z1] 2026-10-14T05:00 · DE-20261022-ABCD · Wendepunkt – Oberharz: Ausfall steigt wieder [Q4] · aufgenommen 2026-10-14T14:00"]);
    expect(b.map((x) => x.code)).toEqual(["BEZUG_UNBEKANNT", "ZEITSTRAHL_UMGEHAENGT"]);
    expect(b[0]!.text).toContain("„DE-BY-20261014-AAAA“");
  });

  it("fehlender Bezug bei Eingängen mit Kennung ergibt einen Hinweis", () => {
    const d = ilkaMeldung("Bund");
    d.sachverhalte[0].kennung = "NEU-1";
    delete d.sachverhalte[0].bezug;
    const b = nachbearbeiten(d, [mat("eingang", ilkaMeldung("RP"), "rp.json")]);
    // kein leeres Feld anlegen
    expect(d.sachverhalte[0].bezug).toBeUndefined();
    expect(b.map((x) => x.code)).toEqual(["BEZUG_FEHLT"]);
  });

  it("Fortschreibung: der Bezug der Vormeldung bleibt gültig, auch ohne die damaligen Eingänge", () => {
    const d = entwurf();
    const vorher = [...d.sachverhalte[0].bezug];
    expect(nachbearbeiten(d, [mat("meldung", vormeldung())])).toEqual([]);
    expect(d.sachverhalte[0].bezug).toEqual(vorher);
  });
});

describe("ZS-2026-W44-01, -04: Zeitstrahl der Fortschreibung", () => {
  it("Zeilen der Vormeldung bleiben wortgleich; neue Zeilen werden angefügt", () => {
    const d = entwurf();
    d.zeitstrahl += `\n[Z9] 2026-10-21T18:00 · ${BUND} · Wiederherstellung – Stromversorgung im Landkreis Sonneberg wiederhergestellt [Q5]`;
    expect(nachbearbeiten(d, [mat("meldung", vormeldung())])).toEqual([]);
    expect(zeilen(d)).toEqual([
      ...vormeldung().zeitstrahl.split("\n"),
      `[Z9] 2026-10-21T18:00 · ${BUND} · Wiederherstellung – Stromversorgung im Landkreis Sonneberg wiederhergestellt [Q5] · aufgenommen 2026-10-22T06:06`,
    ]);
  });

  it("fehlende Zeilen werden wiederhergestellt, veränderte bleiben in der Fassung der Vormeldung, die neue steht daneben", () => {
    const d = entwurf();
    const alt = vormeldung().zeitstrahl.split("\n");
    // [Z2] entfernt, [Z3] verändert
    d.zeitstrahl = alt
      .filter((z: string) => !z.startsWith("[Z2]"))
      .map((z: string) => (z.startsWith("[Z3]") ? z.replace("rund 64.000", "rund 65.000") : z))
      .join("\n");
    const b = nachbearbeiten(d, [mat("meldung", vormeldung())]);
    const neu = zeilen(d);
    expect(neu.filter((z) => alt.includes(z))).toEqual(alt);
    expect(neu.filter((z) => !alt.includes(z))).toEqual([
      alt[2]!.replace("[Z3]", "[Z9]").replace("rund 64.000", "rund 65.000").replace("aufgenommen 2026-10-14T14:00", "aufgenommen 2026-10-22T06:06"),
    ]);
    expect(b.map((x) => x.code)).toEqual(["ZEITSTRAHL_VORMELDUNG"]);
    expect(b[0]!.text).toContain("Wiederhergestellt: [Z2].");
    expect(b[0]!.text).toContain("Verändert übernommen: [Z3]");
    expect(b[0]!.text).toContain("[Z3] → [Z9]");
  });

  it("umnummerierte, sonst gleiche Zeile der Vormeldung gilt als übernommen", () => {
    const d = entwurf();
    d.zeitstrahl = vormeldung()
      .zeitstrahl.split("\n")
      .map((z: string) => z.replace(/^\[Z1\]/, "[Z11]"))
      .join("\n");
    expect(nachbearbeiten(d, [mat("meldung", vormeldung())])).toEqual([]);
    expect(zeilen(d)).toEqual(vormeldung().zeitstrahl.split("\n"));
  });

  it("Bewertungswechsel trägt die App ein; Bewertungszeilen der KI entfallen", () => {
    const d = entwurf();
    d.sachverhalte[0].sofort.beurteilung = "geringfügig";
    d.sachverhalte[0].sofort.tendenz = "Stabilisierung";
    d.zeitstrahl += `\n[Z9] 2026-10-22T06:00 · ${BUND} · Bewertung – von der KI geschrieben`;
    const b = nachbearbeiten(d, [mat("meldung", vormeldung())]);
    // Vormeldung: erheblich / Entspannung; Zeile zum Meldezeitpunkt 22.10.2026 06:06 mit der nächsten freien Nummer
    expect(zeilen(d).at(-1)).toBe(
      `[Z10] 2026-10-22T06:06 · ${BUND} · Bewertung – Beurteilung erheblich → geringfügig; Tendenz Entspannung → Stabilisierung · aufgenommen 2026-10-22T06:06`,
    );
    expect(zeilen(d).some((z) => z.includes("von der KI geschrieben"))).toBe(false);
    expect(b.map((x) => x.code)).toEqual(["ZEITSTRAHL_BEWERTUNG_KI", "ZEITSTRAHL_BEWERTUNG"]);
  });

  it("ohne Änderung von Beurteilung und Tendenz keine Bewertungszeile; leere Angabe heißt „keine Angabe“", () => {
    const d = entwurf();
    expect(nachbearbeiten(d, [mat("meldung", vormeldung())])).toEqual([]);
    expect(parseZeitstrahl(d.zeitstrahl).eintraege.some((e) => e.typ === "Bewertung")).toBe(false);
    const e = entwurf();
    e.sachverhalte[0].sofort.tendenz = "";
    nachbearbeiten(e, [mat("meldung", vormeldung())]);
    expect(zeilen(e).at(-1)).toContain("Bewertung – Tendenz Entspannung → keine Angabe");
  });

  it("ZS-2026-W44-05: neue Zeilen erhalten den Meldezeitpunkt als Kenntniszeit, auch gegen eine Angabe der KI", () => {
    const d = entwurf();
    d.zeitstrahl += `\n[Z9] 2026-10-21T18:00 · ${BUND} · Wiederherstellung – Strom wieder da [Q5] · aufgenommen 2026-10-21T18:00`;
    nachbearbeiten(d, [mat("meldung", vormeldung())]);
    expect(zeilen(d).at(-1)).toBe(`[Z9] 2026-10-21T18:00 · ${BUND} · Wiederherstellung – Strom wieder da [Q5] · aufgenommen 2026-10-22T06:06`);
  });

  it("ZS-2026-W44-05: Zeilen einer älteren Vormeldung ohne Kenntniszeit erhalten deren Meldezeitpunkt; die KI muss sie nicht nennen", () => {
    const vor = vormeldung();
    vor.zeitstrahl = vor.zeitstrahl.replace(/ · aufgenommen \S+/g, "");
    const d = entwurf();
    d.zeitstrahl = vor.zeitstrahl;
    expect(nachbearbeiten(d, [mat("meldung", vor)])).toEqual([]);
    expect(zeilen(d)).toHaveLength(8);
    expect(zeilen(d).every((z) => z.endsWith(" · aufgenommen 2026-10-21T19:40"))).toBe(true);
  });

  it("Zeilen außerhalb der Form bleiben am Ende stehen (der Prüfschritt meldet sie)", () => {
    const d = ilkaMeldung("TH");
    d.zeitstrahl = "freier Satz";
    nachbearbeiten(d, []);
    expect(d.zeitstrahl).toBe("freier Satz");
  });
});

describe("ZS-2026-W44-01 bis -04: Regeln im Steuerungsblock von S2", () => {
  const felder = { kennung: "kennung", bezug: "bezug", zeitstrahl: "zeitstrahl" };
  const z = { felder, kennungenVormeldung: [BUND], naechsteZ: 9, typBewertung: "Bewertung", typBerichtigung: "Berichtigung" };

  it("Fortschreibung: Kennungen der Vormeldung, Platzhalter, nächste Nummer, Berichtigung, keine Bewertungszeilen", () => {
    const t = zeitstrahlSteuerung({ vormeldung: true, verdichtung: false }, z).join("\n");
    expect(t).toContain(`Übernimm bei fortgeschriebenen Sachverhalten die Kennung der Vormeldung unverändert (${BUND})`);
    expect(t).toContain("NEU-1, NEU-2");
    expect(t).toContain("neue Zeilen beginnen bei [Z9]");
    expect(t).toContain("Zeile vom Typ „Berichtigung“");
    expect(t).toContain("Zeilen vom Typ „Bewertung“ schreibst du nicht");
    expect(t).toContain("bei Zeilen der Vormeldung übernimmst du sie unverändert, neuen Zeilen gibst du keine");
    expect(t).toContain("Teilung");
    expect(t).not.toContain("Eingangsmeldungen");
  });

  it("Verdichtung ohne Vormeldung: Bezug auf die Eingänge, Wendepunkte der Eingänge, keine Zeilen der Vormeldung", () => {
    const t = zeitstrahlSteuerung({ vormeldung: false, verdichtung: true }, { ...z, kennungenVormeldung: [], naechsteZ: 1 }).join("\n");
    expect(t).toContain("Kennungen der Sachverhalte aus den Eingangsmeldungen");
    expect(t).toContain("nur Wendepunkte für den eigenen Referenzraum");
    expect(t).not.toContain("Übernimm die Zeilen der Vormeldung");
    expect(t).toContain("Kenntniszeit „· aufgenommen …“ am Zeilenende setzt die App; du schreibst sie nicht.");
    expect(t).not.toContain("Kennung der Vormeldung unverändert");
  });

  it("Erfassung ohne Vormeldung und ohne Eingänge: kein Absatz zum Bezug; ohne Rollen gar nichts", () => {
    const t = zeitstrahlSteuerung({ vormeldung: false, verdichtung: false }, { ...z, kennungenVormeldung: [], naechsteZ: 1 });
    expect(t.some((x) => x.startsWith("- Bezug"))).toBe(false);
    expect(t).toHaveLength(2);
    expect(zeitstrahlSteuerung({ vormeldung: true, verdichtung: true }, undefined)).toEqual([]);
  });

  it("Vorgaben aus dem Material: Kennungen und nächste Nummer der jüngsten eigenen Vormeldung", () => {
    const aelter = vormeldung();
    aelter.meldezeitpunkt = "2026-10-20T10:00";
    aelter.zeitstrahl = aelter.zeitstrahl.split("\n").slice(0, 2).join("\n");
    expect(zeitstrahlVorgaben([mat("meldung", aelter, "a.json"), mat("meldung", vormeldung(), "b.json")], p)).toEqual({ kennungen: [BUND], naechsteZ: 9 });
    expect(zeitstrahlVorgaben([], p)).toEqual({ kennungen: [], naechsteZ: 1 });
  });

  it("der Steuerungsblock endet mit den Regeln, wenn sie übergeben werden", () => {
    const basis = {
      jetzt: "2026-10-22T06:07",
      t0: "2026-10-22T06:06",
      stichtag: "2026-10-22",
      zone: "Europe/Berlin",
      vormeldungStand: "",
      vormeldung: false,
      verdichtung: false,
      recherche: "nur-material" as const,
      websucheMax: 0,
      abrufMax: 0,
    };
    expect(steuerungsBlock(basis)).not.toContain("Sachverhaltskennung");
    expect(
      steuerungsBlock({ ...basis, zeitstrahl: { ...z, kennungenVormeldung: [] } })
        .split("\n")
        .at(-1),
    ).toMatch(/^- Zeitstrahl \(`zeitstrahl`\)/);
  });
});

describe("ZS-2026-W44-01, -04: ganzer Lauf der Fortschreibung", () => {
  it("S2 erhält die Regeln, das Ergebnis behält Kennung und Zeilen und trägt den Bewertungswechsel ein", async () => {
    const vor = vormeldung();
    const datei = await dateiLesen(new File([JSON.stringify(vor)], "Vormeldung_FIKTIV.json"), p);
    const material = [rolleSetzen(datei, "meldung", p)];
    const antwort = entwurf();
    antwort.sachverhalte[0].sofort.tendenz = "Stabilisierung";
    antwort.zeitstrahl += `\n[Z9] 2026-10-21T18:00 · ${BUND} · Wiederherstellung – Stromversorgung im Landkreis Sonneberg wiederhergestellt [Q5]`;
    const s1 = JSON.stringify({ ...s1Vorschlag(), stichtag: "2026-10-22", meldezeitpunkt: "2026-10-22T06:06", gegenstand: "Fortschreibung der Sturmfolgen" });
    const att = skriptAnbieter([llmAntwort(s1), meldungsAntwort(antwort)]);
    const { k } = await pipelineKontext(att, material, {
      jetzt: "2026-10-22T04:06:00Z",
      auftrag: { sachverhalt: "Eigene Meldung fortschreiben", stichworte: "", urls: [], stichtag: "2026-10-22", websuche: false },
    });
    const v = await stufe1(k);
    k.jetzt = () => JETZT;
    await stufe2und3(k, v);
    const steuerung = att.anfragen[1]!.system.at(-1)!.text;
    expect(steuerung).toContain(`Kennung der Vormeldung unverändert (${BUND})`);
    expect(steuerung).toContain("neue Zeilen beginnen bei [Z9]");
    const m = k.lauf.ergebnis!.meldung;
    expect(m.sachverhalte[0].kennung).toBe(BUND);
    const z = String(m.zeitstrahl).split("\n");
    expect(z.slice(0, 8)).toEqual(vor.zeitstrahl.split("\n"));
    expect(z.slice(8)).toEqual([
      `[Z9] 2026-10-21T18:00 · ${BUND} · Wiederherstellung – Stromversorgung im Landkreis Sonneberg wiederhergestellt [Q5] · aufgenommen ${m.meldezeitpunkt}`,
      `[Z10] ${m.meldezeitpunkt} · ${BUND} · Bewertung – Tendenz Entspannung → Stabilisierung · aufgenommen ${m.meldezeitpunkt}`,
    ]);
    const codes = k.lauf.ergebnis!.befunde.map((b) => b.code);
    expect(codes).toContain("ZEITSTRAHL_BEWERTUNG");
    expect(codes.filter((c) => c?.startsWith("ZEITSTRAHL_") && c !== "ZEITSTRAHL_BEWERTUNG")).toEqual([]);
    expect(k.lauf.ergebnis!.schemakonform).toBe(true);
  });
});
