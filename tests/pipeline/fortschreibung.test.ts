// Fortschreibung einer eigenen Vormeldung: Bearbeitungszeit, Meldezeitpunkt t0 und Rechercheauftrag steuert die App
// (0.4.28). Anlass war ein Lauf, in dem t0 vom Vortag als „Aktueller Zeitpunkt“ im S2-Auftrag stand und ein Satz
// aus dem S1-Gegenstand („nicht eine neue Recherche“) die erlaubte Recherche verdrängte. Alle Daten sind fiktiv
// (Orkantief „Ilka“ aus dem Beispielprofil mit verschobenem Meldezeitpunkt und einer erfundenen Frist).
import { describe, expect, it } from "vitest";
import { leereNutzung } from "../../src/anbieter/typen";
import { STANDARD } from "../../src/pipeline/einstellungen";
import { dateiLesen, rolleSetzen, type Material } from "../../src/pipeline/material";
import { rechercheBefunde, stufe1, stufe2und3, type Kontext } from "../../src/pipeline/stufen";
import { llmAntwort, meldungsAntwort, skriptAnbieter } from "../support/anbieter";
import { profil } from "../support/dateien";
import { ilkaEingaenge, ilkaMeldung } from "../support/fixtures";
import { bestaetigterVorschlag, pipelineKontext, s1Vorschlag } from "../support/pipeline";

/** Fiktive Vormeldung vom 21.10.2026 19:40 mit einer belegten Frist am 21.10.2026 18:00 */
async function vormeldung(): Promise<Material> {
  const { profil: p } = await profil("lead-beispiel");
  const m = ilkaMeldung("Bund");
  m.meldezeitpunkt = "2026-10-21T19:40";
  m.meldezeitraum = { von: "2026-10-20", bis: "2026-10-21" };
  m.sachverhalte[0].sofort.bewertung_text +=
    "\nHandlungsrelevant bis: 21.10.2026 18:00 – Ersatzkanal für das Bürgerportal prüfen, Betreiber; Grundlage: Betreibermitteilung [Q1]";
  const gelesen = await dateiLesen(new File([JSON.stringify(m)], "Vormeldung_FIKTIV.json"), p!);
  return rolleSetzen(gelesen, "meldung", p!);
}

/** S1-Vorschlag wie im Anlasslauf: t0 kurz nach der Vormeldung, Nur-Material-Satz im Gegenstand */
const s1Fortschreibung = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    ...s1Vorschlag(),
    stichtag: "2026-10-22",
    meldezeitpunkt: "2026-10-21T19:45",
    gegenstand: "Fortschreibung der Sturmfolgen. Grundlage ist allein das vorliegende Material, nicht eine neue Recherche.",
    ...extra,
  });

/** Entwurf aus S2 (fiktive Bundesmeldung mit einem Sachverhalt) */
const entwurf = () => ilkaMeldung("Bund");

const UHR_S1 = "2026-10-22T04:06:00Z"; // 06:06 Europe/Berlin
const UHR_S2 = "2026-10-22T04:07:00Z"; // 06:07 Europe/Berlin

async function fortschreibung(antworten: Parameters<typeof skriptAnbieter>[0], auftrag: Record<string, unknown> = {}, material?: Material[]) {
  const att = skriptAnbieter(antworten);
  const { k } = await pipelineKontext(att, material ?? [await vormeldung()], {
    jetzt: UHR_S1,
    auftrag: { sachverhalt: "Eigene Meldung fortschreiben", stichworte: "", urls: [], stichtag: "2026-10-22", websuche: true, ...auftrag },
  });
  k.einstellungen = { ...STANDARD, websucheMax: 30, abrufMax: 10 };
  return { att, k };
}

const zuS2 = (k: Kontext, uhr = UHR_S2) => {
  k.jetzt = () => new Date(uhr);
};

const codes = (k: Kontext) => k.lauf.ergebnis!.befunde.map((b) => b.code).filter(Boolean);

describe("Fortschreibung auf den heutigen Stand", () => {
  it("setzt t0 auf die aktuelle Zeit, trennt Bearbeitungszeit und t0 und meldet die ausgebliebene Aktualisierung", async () => {
    const e = entwurf();
    const { att, k } = await fortschreibung([llmAntwort(s1Fortschreibung()), meldungsAntwort(e)]);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-22T06:06");
    expect(v.appHinweise).toHaveLength(1);
    expect(v.appHinweise![0]).toContain("22.10.2026, 06:06 Uhr");
    expect(v.appHinweise![0]).toContain("Stand 21.10.2026, 19:40 Uhr");
    expect(v.appHinweise![0]).toContain("Der Vorschlag aus S1 (21.10.2026, 19:45 Uhr) wurde nicht übernommen");
    const s1Text = JSON.stringify(att.anfragen[0].nachrichten);
    expect(s1Text).toContain("Recherche in S2: erlaubt (Websuche bis zu 30-mal, Seitenabruf bis zu 10-mal)");

    zuS2(k);
    const r = await stufe2und3(k, v);
    const s2 = att.anfragen[1];
    expect(s2.system[2].text).toContain("Aktueller Zeitpunkt (Europe/Berlin): **2026-10-22T06:07**");
    expect(s2.system[2].text).not.toContain("2026-10-21T19:45");
    const steuerung = s2.system[s2.system.length - 1].text;
    expect(steuerung).toContain("## Steuerung durch die App (verbindlich)");
    expect(steuerung).toContain("Bearbeitungszeitpunkt (Europe/Berlin): 2026-10-22 06:07");
    expect(steuerung).toContain("Meldezeitpunkt t0 der neuen Meldung: 2026-10-22 06:06");
    expect(steuerung).toContain("Eigene Vormeldung (Stand 2026-10-21 19:40)");
    expect(steuerung).toContain("Recherche: erlaubt (Websuche bis zu 30-mal, Seitenabruf bis zu 10-mal).");
    expect(steuerung).toContain("gehen Angaben in Gegenstand, Vormeldung und Material zu Arbeitsmodus und Zeit vor");
    // Der Gegenstand aus S1 bleibt fachlicher Zuschnitt; die Steuerung überstimmt ihn, ohne ihn umzuschreiben
    expect(s2.system[2].text).toContain("nicht eine neue Recherche");
    expect(s2.werkzeuge?.websuche?.maxUses).toBe(30);
    expect(s2.werkzeuge?.abruf?.maxUses).toBe(10);
    // Ergebnis: strukturelles t0 aus der Bestätigung, übrige Angaben des Entwurfs unverändert
    expect(r.meldung!.meldezeitpunkt).toBe("2026-10-22T06:06");
    expect(r.meldung!.quellen).toBe(e.quellen);
    expect(r.meldung!.sachverhalte[0].sofort.lagenradar).toEqual(e.sachverhalte[0].sofort.lagenradar);
    expect(k.lauf.ergebnis!.schemakonform).toBe(true);
    const befund = k.lauf.ergebnis!.befunde.find((b) => b.code === "FORTSCHREIBUNG_OHNE_AKTUALISIERUNG");
    expect(befund?.stufe).toBe("warnung");
    expect(befund?.text).toContain("aktuelle Quellenprüfung ist in diesem Lauf nicht dokumentiert");
    // Kein automatischer Folgeaufruf
    expect(att.anfragen).toHaveLength(2);
  });

  it("ein ausdrücklich vorgegebenes historisches t0 bleibt, die Bearbeitungszeit ist trotzdem die echte Uhr", async () => {
    const { att, k } = await fortschreibung([llmAntwort(s1Fortschreibung({ stichtag: "2026-10-21" })), meldungsAntwort(entwurf())], {
      stichtag: "2026-10-21",
      meldezeitpunkt: "2026-10-21T19:45",
    });
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-21T19:45");
    expect(v.appHinweise).toBeUndefined();
    await stufe2und3(k, v);
    expect(att.anfragen[1].system[2].text).toContain("Aktueller Zeitpunkt (Europe/Berlin): **2026-10-22T06:06**");
    expect(att.anfragen[1].system.at(-1)!.text).toContain("Meldezeitpunkt t0 der neuen Meldung: 2026-10-21 19:45");
  });

  it("eine im Bestätigungsschritt manuell gewählte Zeit wird nicht mehr korrigiert", async () => {
    const { att, k } = await fortschreibung([llmAntwort(s1Fortschreibung()), meldungsAntwort(entwurf())]);
    const v = await stufe1(k);
    const r = await stufe2und3(k, { ...v, meldezeitpunkt: "2026-10-21T19:45" });
    expect(att.anfragen[1].system.at(-1)!.text).toContain("Meldezeitpunkt t0 der neuen Meldung: 2026-10-21 19:45");
    expect(r.meldung!.meldezeitpunkt).toBe("2026-10-21T19:45");
    expect(k.lauf.vorschlag!.meldezeitpunkt).toBe("2026-10-22T06:06");
    expect(k.lauf.bestaetigt!.meldezeitpunkt).toBe("2026-10-21T19:45");
  });

  it("ein S1-Vorschlag kurz vor der aktuellen Zeit wird ohne Hinweis ersetzt", async () => {
    const { k } = await fortschreibung([llmAntwort(s1Fortschreibung({ meldezeitpunkt: "2026-10-22T06:00" }))]);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-22T06:06");
    expect(v.appHinweise).toBeUndefined();
  });

  it("Vormeldung und Eingang vom Vortag: t0 folgt der Verdichtung (A.7), mit Hinweis auf die Vorgabe eines heutigen t0", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const eingaenge: Material[] = [];
    for (const x of ilkaEingaenge()) eingaenge.push(await dateiLesen(new File([JSON.stringify(x.daten)], x.name), p!));
    const material = [await vormeldung(), ...eingaenge];
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), stichtag: "2026-10-15", meldezeitpunkt: "" }))]);
    const { k } = await pipelineKontext(att, material, { jetzt: "2026-10-15T08:00:00+02:00", auftrag: { stichtag: "2026-10-15" } });
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(v.appHinweise).toHaveLength(1);
    expect(v.appHinweise![0]).toContain("SOP-LEAD A.7");
    expect(k.material.filter((m) => m.art === "meldung")).toHaveLength(1);
    expect(k.material.filter((m) => m.art === "eingang")).toHaveLength(6);
  });

  it("der Stichtag des Auftrags geht dem Vorschlag aus S1 vor; die Abweichung wird genannt", async () => {
    const { att, k } = await fortschreibung([llmAntwort(s1Fortschreibung({ stichtag: "2026-10-21" })), meldungsAntwort(entwurf())]);
    const v = await stufe1(k);
    expect(v.stichtag).toBe("2026-10-22");
    expect(v.meldezeitpunkt).toBe("2026-10-22T06:06");
    expect(v.appHinweise!.some((h) => h.includes("S1 schlug den Stichtag 21.10.2026 vor; maßgeblich ist der Stichtag aus dem Auftrag (22.10.2026)"))).toBe(
      true,
    );
    await stufe2und3(k, v);
    expect(att.anfragen[1].system.at(-1)!.text).toContain("- Stichtag: 2026-10-22");
  });

  it("Stichtag in der Zukunft: t0 nicht nach der aktuellen Zeit, mit Hinweis zum Stichtag", async () => {
    const { k } = await fortschreibung([llmAntwort(s1Fortschreibung({ stichtag: "2026-10-23", meldezeitpunkt: "2026-10-23T08:00" }))], {
      stichtag: "2026-10-23",
    });
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-22T06:06");
    expect(v.appHinweise![0]).toContain("Der Stichtag 23.10.2026 liegt nach dem heutigen Tag");
  });
});

describe("Recherchemodus aus dem Auftrag und Befunde zur Aktualisierung", () => {
  it("ein erfolgreicher Seitenabruf ohne Websuche gilt als Recherche", async () => {
    const { k } = await fortschreibung([
      llmAntwort(s1Fortschreibung()),
      meldungsAntwort(entwurf(), "Kurz.", { nutzung: { ...leereNutzung(), abrufe: 1 }, abrufe: ["https://beispiel.invalid/portal"] }),
    ]);
    await stufe2und3(k, await stufe1(k));
    expect(codes(k)).not.toContain("FORTSCHREIBUNG_OHNE_AKTUALISIERUNG");
  });

  it("gescheiterte Abrufe sind keine Aktualisierung; der Fehler bleibt sichtbar", async () => {
    const { k } = await fortschreibung([
      llmAntwort(s1Fortschreibung()),
      meldungsAntwort(entwurf(), "Kurz.", {
        nutzung: { ...leereNutzung(), abrufe: 1 },
        abrufe: ["https://beispiel.invalid/portal"],
        abrufFehler: [{ url: "https://beispiel.invalid/portal", code: "url_not_accessible" }],
      }),
    ]);
    await stufe2und3(k, await stufe1(k));
    const befund = k.lauf.ergebnis!.befunde.find((b) => b.code === "FORTSCHREIBUNG_OHNE_AKTUALISIERUNG");
    expect(befund?.text).toContain("Versuchte Seitenabrufe sind gescheitert.");
    expect(k.lauf.ergebnis!.abrufFehler).toHaveLength(1);
  });

  it("Websuche im Auftrag abgeschaltet: keine Werkzeuge, Steuerung „nur Material“, kein Aktualisierungsbefund", async () => {
    const { att, k } = await fortschreibung([llmAntwort(s1Fortschreibung()), meldungsAntwort(entwurf())], { websuche: false });
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-22T06:06");
    expect(JSON.stringify(att.anfragen[0].nachrichten)).toContain("Recherche in S2: nur Material (Websuche vom Auftrag abgeschaltet)");
    await stufe2und3(k, v);
    expect(att.anfragen[1].werkzeuge).toBeUndefined();
    expect(att.anfragen[1].system.at(-1)!.text).toContain("Websuche und Seitenabruf sind für diesen Auftrag abgeschaltet");
    expect(codes(k)).toEqual([]);
  });

  it("Höchstzahlen 0: keine Werkzeuge und ein Konfigurationshinweis statt eines erfundenen Verbots", async () => {
    const { att, k } = await fortschreibung([llmAntwort(s1Fortschreibung()), meldungsAntwort(entwurf())]);
    k.einstellungen = { ...STANDARD, websucheMax: 0, abrufMax: 0 };
    await stufe2und3(k, await stufe1(k));
    expect(att.anfragen[1].werkzeuge).toBeUndefined();
    expect(att.anfragen[1].system.at(-1)!.text).toContain("in den Einstellungen aber nicht verfügbar (Höchstzahlen 0)");
    expect(codes(k)).toEqual(["RECHERCHE_NICHT_VERFUEGBAR"]);
  });

  it("fehlende Nutzungszähler: Recherche „nicht nachweisbar“ statt bewiesener Nullnutzung", async () => {
    const { k } = await fortschreibung([
      llmAntwort(s1Fortschreibung()),
      meldungsAntwort(entwurf(), "Kurz.", { nutzung: { ...leereNutzung(), websuchen: undefined as unknown as number } }),
    ]);
    await stufe2und3(k, await stufe1(k));
    expect(codes(k)).toEqual(["FORTSCHREIBUNG_RECHERCHE_NICHT_NACHWEISBAR"]);
  });

  it("dokumentierte Suchen zählen auch, wenn der Zähler des Anbieters fehlt oder 0 ist", () => {
    expect(rechercheBefunde("erlaubt", true, { nutzung: { websuchen: 0, abrufe: 0 }, suchen: ["Bürgerportal Störung"] })).toEqual([]);
    expect(rechercheBefunde("erlaubt", true, { nutzung: { websuchen: undefined, abrufe: undefined }, suchen: ["Bürgerportal Störung"] })).toEqual([]);
    expect(rechercheBefunde("erlaubt", true, { suchen: [], abrufe: ["https://beispiel.invalid/a"] })).toEqual([]);
    expect(rechercheBefunde("erlaubt", false, { nutzung: { websuchen: 0, abrufe: 0 } })).toEqual([]);
    expect(rechercheBefunde("nur-material", true, { nutzung: { websuchen: 0, abrufe: 0 } })).toEqual([]);
  });
});

describe("Zeitvertrag vor S2", () => {
  it("weist ein kalenderwidriges t0 vor dem Modellaufruf ab", async () => {
    const att = skriptAnbieter([]);
    const { k } = await pipelineKontext(att);
    await expect(stufe2und3(k, { ...bestaetigterVorschlag(), meldezeitpunkt: "2026-02-30T25:00" })).rejects.toThrow("kein gültiger Zeitpunkt");
    expect(att.anfragen).toHaveLength(0);
  });

  it("Tageswechsel zwischen S1 und S2: Bearbeitungszeit folgt der Uhr, t0 bleibt", async () => {
    const { att, k } = await fortschreibung([llmAntwort(s1Fortschreibung()), meldungsAntwort(entwurf())]);
    k.jetzt = () => new Date("2026-10-22T23:59:00+02:00");
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-22T23:59");
    zuS2(k, "2026-10-23T00:02:00+02:00");
    const r = await stufe2und3(k, v);
    expect(att.anfragen[1].system[2].text).toContain("Aktueller Zeitpunkt (Europe/Berlin): **2026-10-23T00:02**");
    expect(att.anfragen[1].system.at(-1)!.text).toContain("Meldezeitpunkt t0 der neuen Meldung: 2026-10-22 23:59");
    expect(r.meldung!.meldezeitpunkt).toBe("2026-10-22T23:59");
  });

  it("die Vervollständigung (S3) erhält den Steuerungsblock nicht, wohl aber t0 und Bearbeitungszeit", async () => {
    const { att, k } = await fortschreibung([
      llmAntwort(s1Fortschreibung()),
      llmAntwort('Kurz.\n```json\n{"schema": ', { stopGrund: "max_tokens" }),
      meldungsAntwort(entwurf()),
    ]);
    const v = await stufe1(k);
    zuS2(k);
    await stufe2und3(k, v);
    const s3 = att.anfragen[2];
    expect(s3.werkzeuge).toBeUndefined();
    expect(s3.system.some((b) => b.text.includes("Steuerung durch die App"))).toBe(false);
    expect(s3.system.at(-1)!.text).toContain("Recherchiere nicht neu");
    expect(s3.system.at(-1)!.text).toContain("Meldezeitpunkt t0: 2026-10-22 06:06; Bearbeitungszeitpunkt: 2026-10-22 06:07.");
  });
});

describe("Redaktionsvermerke bei eigener Vormeldung", () => {
  it("gibt Fristen der Vormeldung an S1 und S2 und verweist auf die Fristregeln aus Teil A", async () => {
    const { att, k } = await fortschreibung([llmAntwort(s1Fortschreibung()), meldungsAntwort(entwurf())]);
    await stufe2und3(k, await stufe1(k));
    expect(JSON.stringify(att.anfragen[0].nachrichten)).toContain("Vermerke der App aus dem Redaktionscheck des Materials");
    const vermerke = att.anfragen[1].system.find((b) => b.text.includes("Vermerke der App aus dem Redaktionscheck des Materials"));
    expect(vermerke?.text).toMatch(/Zeitfenster „Handlungsrelevant bis:“/);
    expect(vermerke?.text).toMatch(/21\.10\.2026 18:00 – Ersatzkanal für das Bürgerportal prüfen.* → /);
    const steuerung = att.anfragen[1].system.at(-1)!.text;
    expect(steuerung).toContain("Teil A (Fristgrundlage)");
    expect(steuerung).toContain("„Änderung zur Vormeldung:“");
  });
});
