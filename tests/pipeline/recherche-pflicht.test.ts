// Verbindliche Recherche bei „Recherche durchführen“ (0.6.0, Befunde KP-2026-W44-01 bis -14 vom 26.10.2026): Orientierungssuche
// als Bestandteil von S1, Pflichtsuchen, Abgleich und einmalige Nachforderung als Bestandteil von S2, Befunde für jeden Lauf.
// Anlass: Lauf 20261026-201050-q25q (Recherche gewählt, null Websuchen in S2). Alle Lagen und Quellen sind fiktiv (FIKTIV).
import { describe, expect, it } from "vitest";
import { AnbieterFehler, leereNutzung, type LlmAnfrage } from "../../src/anbieter/typen";
import { anfrageKoerper } from "../../src/anbieter/anthropic";
import { STANDARD, sucheErzwingbar } from "../../src/pipeline/einstellungen";
import type { S1Vorschlag } from "../../src/pipeline/lauf";
import { pflichtRegel } from "../../src/pipeline/recherchetiefe";
import { orientierungsEintraege, orientierungssuche } from "../../src/pipeline/orientierung";
import { amtlichErreicht, primaerquelleBelegt, rechercheBefunde } from "../../src/pipeline/recherchebefunde";
import { pflichtAbgleich, pflichtVorgaben, stufe2und3, sucheEntspricht } from "../../src/pipeline/s2s3";
import { amtlicheEinstiege, amtlicherHost } from "../../src/pipeline/kontext";
import { profil } from "../support/dateien";
import { llmAntwort, meldungsAntwort, skriptAnbieter } from "../support/anbieter";
import { ilkaMeldung } from "../support/fixtures";
import { bestaetigterVorschlag, pipelineKontext } from "../support/pipeline";

/** Bestätigter Vorschlag mit zwei Sachverhalten (FIKTIV) */
const zweiSachverhalte = (): S1Vorschlag => ({
  ...bestaetigterVorschlag(),
  sachverhalte: [
    { titel: "Sturmflut an der fiktiven Küste Nordmark", ereignisarten: ["Hochwasser / Überschwemmung"], sops: ["b02"], begruendung: "Sturmflut" },
    { titel: "Sturmschäden im fiktiven Landkreis Hügelland", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm" },
  ],
});

/** Antwort der Orientierungssuche je Sachverhalt, gewählt nach dem Sachverhalt im Anfragetext */
const orientierungsAntwort = (a: LlmAnfrage) => {
  const text = JSON.stringify(a.nachrichten);
  const nr = text.includes("Sachverhalt 2") ? 2 : 1;
  const begriffe =
    nr === 1
      ? [
          { begriff: "Sturmflutwarnung Nordmark Wasserstand", zweck: "B02/R1", zielquelle: "Wasserstandsdienst Nordmark (FIKTIV)" },
          { begriff: "Deichlage Nordmark Pegel", zweck: "B02/R2", zielquelle: "Küstenschutzamt (FIKTIV)" },
          { begriff: "dritter Begriff über der Grenze", zweck: "B02/R3", zielquelle: "–" },
        ]
      : [{ begriff: "Unwetterwarnung Hügelland Orkanböen", zweck: "B01/R1", zielquelle: "Wetterdienst (FIKTIV)" }];
  return Promise.resolve(
    llmAntwort(`\`\`\`json\n${JSON.stringify({ suchbegriffe: begriffe })}\n\`\`\``, {
      suchen: [nr === 1 ? "Sturmflut Nordmark" : "Sturm Hügelland"],
      fundstellen: [{ url: `https://beispiel.invalid/treffer-${nr}`, titel: `Treffer ${nr} (FIKTIV)`, stand: "26.10.2026" }],
      nutzung: { ...leereNutzung(), eingabe: 100, ausgabe: 50, websuchen: 1 },
    }),
  );
};

describe("KP-2026-W44-04/-05: Orientierungssuche als Bestandteil von S1", () => {
  it("sucht je bestätigtem Sachverhalt einmal, ohne Seitenabruf, mit erzwungener Suche beim S1-Modell Haiku 5.5", async () => {
    const att = skriptAnbieter([orientierungsAntwort, orientierungsAntwort]);
    const { k } = await pipelineKontext(att);
    k.lauf.status = "bestaetigen";
    const v = await orientierungssuche(k, zweiSachverhalte());
    expect(att.anfragen).toHaveLength(2);
    for (const a of att.anfragen) {
      expect(a.modell).toBe("claude-haiku-5-5");
      expect(a.werkzeuge?.websuche?.maxUses).toBe(1);
      expect(a.werkzeuge?.abruf).toBeUndefined();
      expect(a.werkzeuge?.erzwingen).toBe("websuche");
      expect(a.jsonSchema).toBeUndefined();
      expect(a.system[0].text).toContain("Rufe keine Seite ab.");
    }
    // Prüffragen der gewählten SOP gehen knapp mit (B02 bei Sachverhalt 1)
    const sv1 = att.anfragen.find((a) => JSON.stringify(a.nachrichten).includes("Sachverhalt 1"))!;
    expect(JSON.stringify(sv1.nachrichten)).toContain("B02/R1:");
    expect(v.sachverhalte[0].orientierung).toEqual([
      {
        suchbegriff: "Sturmflut Nordmark",
        zeit: expect.any(String),
        treffer: [{ titel: "Treffer 1 (FIKTIV)", url: "https://beispiel.invalid/treffer-1", datum: "26.10.2026" }],
      },
    ]);
    // Standard: höchstens 2 Suchbegriffe je Sachverhalt
    expect(v.sachverhalte[0].suchbegriffe!.map((b) => [b.begriff, b.zweck, b.herkunft])).toEqual([
      ["Sturmflutwarnung Nordmark Wasserstand", "B02/R1", "vorschlag"],
      ["Deichlage Nordmark Pegel", "B02/R2", "vorschlag"],
    ]);
    expect(v.sachverhalte[1].suchbegriffe!.map((b) => b.begriff)).toEqual(["Unwetterwarnung Hügelland Orkanböen"]);
    expect(k.lauf.stufen.map((s) => s.stufe).sort()).toEqual(["S1 Orientierungssuche – Sachverhalt 1", "S1 Orientierungssuche – Sachverhalt 2"]);
    expect(k.lauf.status).toBe("bestaetigen");
    expect(k.lauf.vorschlag).toEqual(v);
    expect(v.appHinweise).toBeUndefined();
  });

  it("ohne Suche wird einmal wiederholt; bleibt es dabei, nennt ein Hinweis den Sachverhalt", async () => {
    const att = skriptAnbieter([llmAntwort("Keine Suche."), llmAntwort("Wieder keine.")]);
    const { k } = await pipelineKontext(att);
    const v = await orientierungssuche(k, bestaetigterVorschlag());
    expect(att.anfragen).toHaveLength(2);
    expect(k.lauf.stufen.map((s) => s.stufe)).toEqual(["S1 Orientierungssuche – Sachverhalt 1", "S1 Orientierungssuche – Sachverhalt 1 (Wiederholung)"]);
    expect(v.sachverhalte[0].orientierung).toEqual([]);
    expect(v.sachverhalte[0].suchbegriffe).toEqual([]);
    expect(v.appHinweise).toEqual([
      "Orientierungssuche ohne Websuche für Sachverhalt 1. Suchbegriffe bitte selbst eintragen oder die Orientierung wiederholen.",
    ]);
  });

  it("lehnt der Anbieter die erzwungene Suche ab (400), folgt ein Versuch ohne Zwang", async () => {
    const att = skriptAnbieter([new AnbieterFehler("tool_choice nicht erlaubt", 400), orientierungsAntwort]);
    const { k } = await pipelineKontext(att);
    const v = await orientierungssuche(k, bestaetigterVorschlag());
    expect(att.anfragen.map((a) => a.werkzeuge?.erzwingen)).toEqual(["websuche", undefined]);
    expect(v.sachverhalte[0].orientierung).toHaveLength(1);
  });

  it("kein erzwungener Modellwechsel: S1 mit Sonnet 5.5 sucht ohne Zwang mit Sonnet (Entscheidung vom 26.10.2026)", async () => {
    const att = skriptAnbieter([orientierungsAntwort]);
    const { k } = await pipelineKontext(att);
    k.einstellungen = { ...k.einstellungen, modelle: { ...k.einstellungen.modelle, vorverarbeitung: "claude-sonnet-5-5" } };
    await orientierungssuche(k, bestaetigterVorschlag());
    expect(att.anfragen[0].modell).toBe("claude-sonnet-5-5");
    expect(att.anfragen[0].werkzeuge?.erzwingen).toBeUndefined();
  });

  it("von der Person eingetragene Suchbegriffe bleiben bei erneuter Orientierung erhalten", async () => {
    const att = skriptAnbieter([orientierungsAntwort]);
    const { k } = await pipelineKontext(att);
    const vorher = bestaetigterVorschlag();
    vorher.sachverhalte[0] = { ...vorher.sachverhalte[0], suchbegriffe: [{ begriff: "eigener Begriff", zweck: "B01/R2", herkunft: "person" }] } as never;
    const v = await orientierungssuche(k, vorher);
    expect(v.sachverhalte[0].suchbegriffe![0]).toEqual({ begriff: "eigener Begriff", zweck: "B01/R2", herkunft: "person" });
  });

  it("keine Orientierung bei „nur Material“, bei 0 je Sachverhalt und mit einem S1-Modell ohne Websuche (Hinweis)", async () => {
    const att = skriptAnbieter([]);
    const ohne = await pipelineKontext(att, [], { auftrag: { websuche: false } });
    expect(await orientierungssuche(ohne.k, bestaetigterVorschlag())).toEqual(bestaetigterVorschlag());
    const null_ = await pipelineKontext(att);
    null_.k.einstellungen = { ...null_.k.einstellungen, orientierungJeSachverhalt: 0 };
    expect((await orientierungssuche(null_.k, bestaetigterVorschlag())).sachverhalte[0].orientierung).toBeUndefined();
    const eu = await pipelineKontext(att);
    eu.k.einstellungen = { ...eu.k.einstellungen, modelle: { ...eu.k.einstellungen.modelle, vorverarbeitung: "mistral-small-2603" } };
    expect((await orientierungssuche(eu.k, bestaetigterVorschlag())).appHinweise).toEqual([
      "Orientierungssuche nicht möglich: mistral-small-2603 bietet keine Websuche. Suchbegriffe bitte selbst eintragen.",
    ]);
    expect(att.anfragen).toHaveLength(0);
  });

  it("erzwingbar nur bei Anthropic-Modellen, die es zulassen; Anthropic setzt tool_choice", () => {
    expect(["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1", "gpt-6-luna", "mistral-small-2603"].map(sucheErzwingbar)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    const basis = { modell: "claude-haiku-5-5", maxTokens: 1000, system: [{ text: "x" }], nachrichten: [{ role: "user" as const, content: "Los" }] };
    expect(anfrageKoerper({ ...basis, werkzeuge: { websuche: { maxUses: 1 }, erzwingen: "websuche" } }).tool_choice).toEqual({
      type: "tool",
      name: "web_search",
    });
    expect(anfrageKoerper({ ...basis, werkzeuge: { websuche: { maxUses: 1 } } }).tool_choice).toBeUndefined();
    expect(anfrageKoerper({ ...basis, werkzeuge: { abruf: { maxUses: 1 }, erzwingen: "websuche" } }).tool_choice).toBeUndefined();
  });
});

describe("KP-2026-W44-09: Pflichtsuchen nach der Recherchetiefe", () => {
  it("Stufen: Sparsam 1/3, Standard 2/5, Gründlich 3/8; eigene Werte wie Standard, höchstens die Hälfte der Websuchen", () => {
    expect(pflichtRegel({ websucheMax: 5, abrufMax: 3, abrufMaxTokens: 8000 })).toMatchObject({ titel: "Sparsam", jeSachverhalt: 1, max: 3 });
    expect(pflichtRegel({ websucheMax: 15, abrufMax: 10, abrufMaxTokens: 15000 })).toMatchObject({ titel: "Standard", jeSachverhalt: 2, max: 5 });
    expect(pflichtRegel({ websucheMax: 30, abrufMax: 20, abrufMaxTokens: 30000 })).toMatchObject({ titel: "Gründlich", jeSachverhalt: 3, max: 8 });
    expect(pflichtRegel({ websucheMax: 6, abrufMax: 0, abrufMaxTokens: 8000 })).toMatchObject({ titel: "Eigene Werte", jeSachverhalt: 2, max: 3 });
    expect(pflichtRegel({ websucheMax: 1, abrufMax: 0, abrufMaxTokens: 8000 })).toMatchObject({ jeSachverhalt: 0, max: 0 });
  });

  it("je Sachverhalt höchstens die Zahl der Stufe, insgesamt höchstens ihr Maximum, leere Begriffe zählen nicht; ohne Websuche keine", () => {
    const v = zweiSachverhalte();
    v.sachverhalte[0].suchbegriffe = ["a eins", "a zwei", "a drei"].map((begriff) => ({ begriff, zweck: "", herkunft: "vorschlag" as const }));
    v.sachverhalte[1].suchbegriffe = [" ", "b eins", "b zwei"].map((begriff) => ({ begriff, zweck: "", herkunft: "person" as const }));
    const sparsam = { ...STANDARD, websucheMax: 5, abrufMax: 3, abrufMaxTokens: 8000 };
    expect(pflichtVorgaben(v, sparsam, 5).map((p) => [p.sachverhalt, p.begriff])).toEqual([
      [1, "a eins"],
      [2, "b eins"],
    ]);
    expect(pflichtVorgaben(v, STANDARD, 15).map((p) => p.begriff)).toEqual(["a eins", "a zwei", "b eins", "b zwei"]);
    expect(pflichtVorgaben(v, STANDARD, 0)).toEqual([]);
  });

  it("Abgleich: Hälfte der Wörter genügt, Groß-/Kleinschreibung, Satzzeichen und Füllwörter zählen nicht", () => {
    expect(sucheEntspricht("Sturmflutwarnung Nordmark Wasserstand", "nordmark wasserstand aktuell")).toBe(true);
    expect(sucheEntspricht("Deichlage in der Nordmark (Pegel)", "Deichlage Nordmark")).toBe(true);
    expect(sucheEntspricht("Unwetterwarnung Hügelland Orkanböen", "Hügelland Verkehr")).toBe(false);
    expect(sucheEntspricht("Pegel", "Pegelstände Nordmark")).toBe(true);
    expect(
      pflichtAbgleich(
        [
          { sachverhalt: 1, begriff: "Deichlage Nordmark", zweck: "" },
          { sachverhalt: 2, begriff: "Orkanböen Hügelland", zweck: "" },
        ],
        ["Deichlage Nordmark heute"],
        ["Orkanböen Hügelland Warnung"],
      ),
    ).toEqual([
      { sachverhalt: 1, begriff: "Deichlage Nordmark", ausgefuehrt: "Deichlage Nordmark heute", nachgefordert: false },
      { sachverhalt: 2, begriff: "Orkanböen Hügelland", ausgefuehrt: "Orkanböen Hügelland Warnung", nachgefordert: true },
    ]);
  });
});

/** Bestätigter Vorschlag mit einem Pflichtbegriff und einem Orientierungstreffer */
const mitPflicht = (): S1Vorschlag => {
  const v = bestaetigterVorschlag() as S1Vorschlag;
  v.sachverhalte[0] = {
    ...v.sachverhalte[0],
    orientierung: [
      { suchbegriff: "Orkan Hessen", zeit: "2026-10-14T08:00:00.000Z", treffer: [{ titel: "Lagemeldung (FIKTIV)", url: "https://beispiel.invalid/lage-1" }] },
    ],
    suchbegriffe: [{ begriff: "Unwetterwarnung Hessen Orkan", zweck: "B01/R1", zielquelle: "Wetterdienst (FIKTIV)", herkunft: "vorschlag" }],
  };
  return v;
};

const mitSuche = (suchen: string[], kurz = "Kurz.") =>
  meldungsAntwort(ilkaMeldung("HE"), kurz, { suchen, nutzung: { ...leereNutzung(), eingabe: 100, ausgabe: 50, websuchen: suchen.length } });
const ohneSuche = (kurz = "Kurz.") => meldungsAntwort(ilkaMeldung("HE"), kurz);
const codes = (befunde: { code?: string }[] | undefined) => (befunde || []).map((b) => b.code).filter(Boolean);

describe("KP-2026-W44-07/-08: Pflichtsuchen, Abgleich und Nachforderung als Bestandteil von S2", () => {
  it("Steuerung nennt Pflichtsuchen, Restkontingent und Recherchetiefe; Einstiege aus der Orientierung liegen bei", async () => {
    const att = skriptAnbieter([mitSuche(["Unwetterwarnung Hessen Orkan"])]);
    const { k } = await pipelineKontext(att);
    await stufe2und3(k, mitPflicht());
    const s2 = att.anfragen[0];
    const steuerung = s2.system.at(-1)!.text;
    expect(steuerung).toContain("- Recherche: durchführen (verbindlich; Websuche bis zu 15-mal, Seitenabruf bis zu 10-mal).");
    expect(steuerung).toContain(
      "- Pflichtsuchen (von der Person bestätigt). Führe jede aus, bevor du eigene Suchen startest. Du darfst einen Begriff präzisieren, aber nicht ersetzen oder auslassen:\n  - Sachverhalt 1: „Unwetterwarnung Hessen Orkan“ (Zweck: B01/R1; Zielquelle: Wetterdienst (FIKTIV))",
    );
    expect(steuerung).toContain(
      "- Eigene Recherche danach: bis zu 14 weitere Websuchen. Recherchetiefe „Standard“: Offene Prüffragen verfolgen und dynamische Kernangaben aktualisieren.",
    );
    expect(steuerung).toContain("- Rechercheeinstiege aus der Orientierungssuche liegen bei; ihre Adressen darfst du abrufen.");
    expect(steuerung).toContain("nie als „nicht zugänglich“");
    expect(JSON.stringify(s2.nachrichten)).toContain("Sachverhalt 1: Lagemeldung (FIKTIV) – https://beispiel.invalid/lage-1");
    expect(s2.werkzeuge?.websuche?.maxUses).toBe(15);
    // Ausgeführt, also keine Nachforderung und kein Recherchebefund
    expect(att.anfragen).toHaveLength(1);
    expect(k.lauf.ergebnis!.pflichtsuchen).toEqual([
      { sachverhalt: 1, begriff: "Unwetterwarnung Hessen Orkan", ausgefuehrt: "Unwetterwarnung Hessen Orkan", nachgefordert: false },
    ]);
    expect(k.lauf.ergebnis!.recherche).toEqual({ orientierung: 1, websuchen: 1, abrufe: 0, zaehlerVollstaendig: true, nachgefordert: false });
    expect(codes(k.lauf.ergebnis!.befunde).filter((c) => /RECHERCHE|PFLICHT|ORIENTIERUNG/.test(c!))).toEqual([]);
  });

  it("lässt S2 die Pflichtsuche aus, fordert die App genau einmal nach; danach ausgeführt: Hinweis, Text und Kosten zusammengeführt", async () => {
    const att = skriptAnbieter([ohneSuche("Erster Entwurf."), mitSuche(["Unwetterwarnung Orkan Hessen heute"], "Nach Nachforderung.")]);
    const { k } = await pipelineKontext(att);
    k.einstellungen = { ...k.einstellungen, nachforderung: true };
    const r = await stufe2und3(k, mitPflicht());
    expect(att.anfragen).toHaveLength(2);
    const zweite = att.anfragen[1];
    expect(zweite.nachrichten.map((n) => n.role)).toEqual(["user", "assistant", "user"]);
    expect(zweite.nachrichten[2].content).toContain("„Unwetterwarnung Hessen Orkan“ (Sachverhalt 1)");
    expect(zweite.werkzeuge?.websuche?.maxUses).toBe(15);
    expect(zweite.system).toEqual(att.anfragen[0].system);
    expect(k.lauf.stufen.map((s) => s.stufe)).toEqual(["S2 Recherche und Entwurf", "S2 Recherche und Entwurf – Nachforderung"]);
    expect(r.kurzantwort).toBe("Nach Nachforderung.");
    expect(k.lauf.ergebnis!.pflichtsuchen![0]).toMatchObject({ ausgefuehrt: "Unwetterwarnung Orkan Hessen heute", nachgefordert: true });
    expect(k.lauf.ergebnis!.recherche).toMatchObject({ websuchen: 1, nachgefordert: true });
    expect(codes(r.befunde)).toContain("RECHERCHE_NACHGEFORDERT");
    expect(codes(r.befunde)).not.toContain("RECHERCHE_NICHT_DURCHGEFUEHRT");
    expect(k.lauf.kostenUsd).toBeCloseTo(0.02, 6);
  });

  it("sucht S2 auch nach der Nachforderung nicht: Warnungen zur Recherche und zur ausgelassenen Pflichtsuche", async () => {
    const att = skriptAnbieter([ohneSuche(), ohneSuche()]);
    const { k } = await pipelineKontext(att);
    k.einstellungen = { ...k.einstellungen, nachforderung: true };
    const r = await stufe2und3(k, mitPflicht());
    expect(att.anfragen).toHaveLength(2);
    const b = r.befunde.filter((x) => /RECHERCHE|PFLICHT/.test(x.code || ""));
    expect(b.map((x) => [x.code, x.stufe])).toEqual([
      ["RECHERCHE_NICHT_DURCHGEFUEHRT", "warnung"],
      ["PFLICHTSUCHE_AUSGELASSEN", "warnung"],
    ]);
    expect(b[0].text).toContain("auch nicht nach der Nachforderung der App");
    expect(b[1].text).toContain("„Unwetterwarnung Hessen Orkan“ (Sachverhalt 1)");
  });

  it("ohne Pflichtbegriffe fordert die App nach, wenn S2 gar nicht sucht; Nachforderung abschaltbar", async () => {
    const att = skriptAnbieter([ohneSuche(), mitSuche(["Orkan Hessen"])]);
    const { k } = await pipelineKontext(att);
    k.einstellungen = { ...k.einstellungen, nachforderung: true };
    await stufe2und3(k, bestaetigterVorschlag());
    expect(att.anfragen[1].nachrichten[2].content).toContain("In deiner Antwort ist keine Websuche ausgeführt.");
    expect(att.anfragen[0].system.at(-1)!.text).toContain("- Eigene Recherche insgesamt: bis zu 15 Websuchen.");

    const aus = skriptAnbieter([ohneSuche()]);
    const { k: k2 } = await pipelineKontext(aus);
    await stufe2und3(k2, bestaetigterVorschlag());
    expect(aus.anfragen).toHaveLength(1);
    expect(codes(k2.lauf.ergebnis!.befunde)).toContain("RECHERCHE_NICHT_DURCHGEFUEHRT");
  });

  it("„nur Material“: weder Pflichtsuchen noch Nachforderung noch Recherchebefunde", async () => {
    const att = skriptAnbieter([ohneSuche()]);
    const { k } = await pipelineKontext(att, [], { auftrag: { websuche: false } });
    k.einstellungen = { ...k.einstellungen, nachforderung: true };
    const r = await stufe2und3(k, mitPflicht());
    expect(att.anfragen).toHaveLength(1);
    expect(att.anfragen[0].werkzeuge).toBeUndefined();
    expect(att.anfragen[0].system.at(-1)!.text).not.toContain("Pflichtsuchen");
    expect(JSON.stringify(att.anfragen[0].nachrichten)).not.toContain("Rechercheeinstiege");
    expect(k.lauf.ergebnis!.pflichtsuchen).toBeUndefined();
    expect(k.lauf.ergebnis!.recherche).toBeUndefined();
    expect(codes(r.befunde).filter((c) => /RECHERCHE|PFLICHT/.test(c!))).toEqual([]);
  });

  it("Befunde: Kurzantwort behauptet ohne Suche Unzugänglichkeit; Orientierung ohne Suche wird genannt", () => {
    const b = rechercheBefunde("durchfuehren", false, { nutzung: { websuchen: 0, abrufe: 0 } }, undefined, {
      kurzantwort: "Primärquellen blieben nicht zugänglich.",
      orientierungOhneSuche: [2],
    });
    expect(b.map((x) => x.code)).toEqual(["RECHERCHE_NICHT_DURCHGEFUEHRT", "KURZANTWORT_RECHERCHE_WIDERSPRUCH", "ORIENTIERUNG_OHNE_SUCHE"]);
    expect(b[2].text).toContain("Sachverhalt 2");
    // „nicht recherchiert“ ist eine zutreffende Aussage und kein Widerspruch
    expect(
      rechercheBefunde("durchfuehren", false, { nutzung: { websuchen: 0, abrufe: 0 } }, undefined, { kurzantwort: "Es wurde nicht recherchiert." }).map(
        (x) => x.code,
      ),
    ).toEqual(["RECHERCHE_NICHT_DURCHGEFUEHRT"]);
    expect(rechercheBefunde("durchfuehren", false, { nutzung: { websuchen: undefined, abrufe: undefined } }).map((x) => x.code)).toEqual([
      "RECHERCHE_NICHT_NACHWEISBAR",
    ]);
  });
});

describe("KP-2026-W44-15 bis -19: amtliche Einstiege, Primärquelle, Orientierungszählung (0.6.1, Lauf 20261026-215737-9t2q)", () => {
  it("W44-15: amtliche Einstiege stammen aus den Recherchetabellen der gewählten SOPs; Unterdomains zählen zum Host", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const b02 = amtlicheEinstiege(p!, ["b02"]);
    expect(b02.map((x) => [x.kennung, x.url])).toEqual([
      ["B02/R1", "https://hochwasserzentralen.de/"],
      ["B02/R2", "https://wasserstand.bsh.de/"],
      ["B02/R2", "https://www.bsh.de/DE/THEMEN/Wasserstand_und_Gezeiten/Nordsee/nordsee.html"],
    ]);
    const b01 = amtlicheEinstiege(p!, ["b01"]);
    expect(b01.map((x) => x.url)).toContain("https://www.wettergefahren.de/warnungen/warnsituation/warnlagebericht.html");
    expect(amtlicherHost("https://opendata.dwd.de/weather/text_forecasts/x", b01)).toBe(true);
    expect(amtlicherHost("https://www.ndr.de/nachrichten", b01)).toBe(false);
    expect(amtlicherHost("keine adresse", b01)).toBe(false);
    expect(
      amtlichErreicht(
        {
          fundstellen: [],
          abrufe: ["https://wasserstand.bsh.de/hamburg"],
          abrufFehler: [{ url: "https://wasserstand.bsh.de/hamburg", code: "url_not_accessible" }],
        },
        b02,
      ),
    ).toBe(false);
  });

  it("W44-15: ohne Fundstelle aus einem amtlichen Einstieg fordert die App einmal nach und nennt die Einstiege", async () => {
    const medien = { url: "https://zeitung.invalid/sturm", titel: "Sturm (FIKTIV)" };
    const erste = meldungsAntwort(ilkaMeldung("HE"), "Kurz.", {
      suchen: ["Orkan Hessen"],
      fundstellen: [medien],
      nutzung: { ...leereNutzung(), websuchen: 1 },
    });
    const zweite = meldungsAntwort(ilkaMeldung("HE"), "Nach Nachforderung.", {
      suchen: ["site:wettergefahren.de Warnlagebericht"],
      fundstellen: [{ url: "https://www.wettergefahren.de/warnungen/warnsituation/warnlagebericht.html", titel: "Warnlagebericht" }],
      nutzung: { ...leereNutzung(), websuchen: 1 },
    });
    const att = skriptAnbieter([erste, zweite]);
    const { k } = await pipelineKontext(att);
    k.einstellungen = { ...k.einstellungen, nachforderung: true };
    const r = await stufe2und3(k, bestaetigterVorschlag());
    expect(att.anfragen).toHaveLength(2);
    const text = String(att.anfragen[1].nachrichten[2].content);
    expect(text).toContain("Keine der ausgewerteten Fundstellen stammt aus den amtlichen Rechercheeinstiegen der gewählten SOPs.");
    expect(text).toContain("B01/R1 – DWD-Warnlagebericht – https://www.wettergefahren.de/warnungen/warnsituation/warnlagebericht.html");
    expect(codes(r.befunde)).toContain("RECHERCHE_NACHGEFORDERT");
    expect(codes(r.befunde)).not.toContain("KEINE_PRIMAERQUELLE");
  });

  it("W44-15: eine amtliche Fundstelle genügt, dann keine Nachforderung", async () => {
    const att = skriptAnbieter([
      meldungsAntwort(ilkaMeldung("HE"), "Kurz.", {
        suchen: ["Orkan Hessen"],
        fundstellen: [{ url: "https://www.dwd.de/DE/wetter/x.html", titel: "DWD" }],
        nutzung: { ...leereNutzung(), websuchen: 1 },
      }),
    ]);
    const { k } = await pipelineKontext(att);
    k.einstellungen = { ...k.einstellungen, nachforderung: true };
    await stufe2und3(k, bestaetigterVorschlag());
    expect(att.anfragen).toHaveLength(1);
  });

  it("W44-17: amtliche Einstiege in der Nutzernachricht, Zielquelle in der Steuerung, amtlicher Orientierungstreffer zuerst und gekennzeichnet; W44-19: Titel gleich Adresse entfällt", async () => {
    const v = bestaetigterVorschlag() as S1Vorschlag;
    v.sachverhalte[0] = {
      ...v.sachverhalte[0],
      orientierung: [
        {
          suchbegriff: "Orkan Hessen",
          zeit: "2026-10-14T08:00:00.000Z",
          treffer: [
            { titel: "https://zeitung.invalid/orkan", url: "https://zeitung.invalid/orkan" },
            { titel: "https://opendata.dwd.de/weather/text_forecasts/html/VHDL54", url: "https://opendata.dwd.de/weather/text_forecasts/html/VHDL54" },
          ],
        },
      ],
      suchbegriffe: [{ begriff: "Unwetterwarnung Hessen Orkan", zweck: "B01/R1", zielquelle: "DWD", herkunft: "vorschlag" }],
    };
    const att = skriptAnbieter([mitSuche(["Unwetterwarnung Hessen Orkan"])]);
    const { k } = await pipelineKontext(att);
    await stufe2und3(k, v);
    const bloecke = (att.anfragen[0].nachrichten[0].content as { type: string; text?: string }[]).map((b) => b.text || "");
    const amtlich = bloecke.find((t) => t.startsWith("# Amtliche Rechercheeinstiege der gewählten SOPs"))!;
    expect(amtlich).toContain("- B01/R1: DWD-Warnlagebericht – https://www.wettergefahren.de/warnungen/warnsituation/warnlagebericht.html");
    const orientierung = bloecke.find((t) => t.startsWith("# Rechercheeinstiege aus der Orientierungssuche"))!;
    const zeilen = orientierung.split("\n").filter((z) => z.startsWith("- Sachverhalt 1: "));
    expect(zeilen).toEqual([
      "- Sachverhalt 1: https://opendata.dwd.de/weather/text_forecasts/html/VHDL54 (amtlicher Einstieg – abrufen)",
      "- Sachverhalt 1: https://zeitung.invalid/orkan",
    ]);
    const steuerung = att.anfragen[0].system.at(-1)!.text;
    expect(steuerung).toContain("- Nennt eine Pflichtsuche eine Zielquelle, rufe deren Seite ab oder präzisiere die Suche mit Einschränkung auf ihre Website");
    expect(steuerung).toContain("- Amtliche Rechercheeinstiege der gewählten SOPs liegen bei.");
  });

  it("W44-16: Warnung KEINE_PRIMAERQUELLE nur bei reinen Medienquellen ohne amtliche Fundstelle", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const m = ilkaMeldung("HE");
    m.quellen = "[Q1] M – Zeitung (FIKTIV) (14.10.2026): Orkan. Online abrufbar unter: https://zeitung.invalid/a [Zugriff: 14.10.2026]";
    const leer = { fundstellen: [], abrufe: [], abrufFehler: [] };
    const einstiege = amtlicheEinstiege(p!, ["b01"]);
    expect(primaerquelleBelegt(m, p!, leer, einstiege)).toBe(false);
    expect(primaerquelleBelegt(m, p!, { ...leer, fundstellen: [{ url: "https://opendata.dwd.de/x", titel: "DWD" }] }, einstiege)).toBe(true);
    const mitA = { ...m, quellen: `${m.quellen}\n[Q2] A – Lagezentrum (FIKTIV) (14.10.2026): Lagemeldung [Zugriff: 14.10.2026]` };
    expect(primaerquelleBelegt(mitA, p!, leer, einstiege)).toBe(true);
    const b = rechercheBefunde("durchfuehren", false, { nutzung: { websuchen: 2, abrufe: 0 }, suchen: ["a", "b"] }, undefined, { primaerquelle: false });
    expect(b.map((x) => [x.code, x.stufe])).toEqual([["KEINE_PRIMAERQUELLE", "warnung"]]);
    expect(rechercheBefunde("nur-material", false, { nutzung: { websuchen: 0, abrufe: 0 } }, undefined, { primaerquelle: false })).toEqual([]);
  });

  it("W44-18: je abgerechnetem Suchaufruf ein Eintrag; gebündelte Teilabfragen stehen zusammen", () => {
    const t = [{ titel: "T", url: "https://beispiel.invalid/t" }];
    const z = "2026-10-26T21:00:00.000Z";
    const vier = orientierungsEintraege(
      { suchen: ["site:dwd.de a", "site:bsh.de b", "site:db c", "site:ndr d"], nutzung: { ...leereNutzung(), websuchen: 1 } },
      z,
      t,
    );
    expect(vier).toEqual([
      {
        suchbegriff: "site:dwd.de a · site:bsh.de b · site:db c · site:ndr d",
        teilabfragen: ["site:dwd.de a", "site:bsh.de b", "site:db c", "site:ndr d"],
        zeit: z,
        treffer: t,
      },
    ]);
    expect(orientierungsEintraege({ suchen: ["a", "b"], nutzung: { ...leereNutzung(), websuchen: 2 } }, z, t).map((o) => o.suchbegriff)).toEqual(["a", "b"]);
    expect(orientierungsEintraege({ suchen: ["a"], nutzung: { ...leereNutzung(), websuchen: 0 } }, z, t)).toHaveLength(1);
    expect(orientierungsEintraege({ suchen: [], nutzung: leereNutzung() }, z, t)).toEqual([]);
  });
});
