// Pipeline S1–S3 mit skriptiertem Anbieter: Bereinigung, Nachbearbeitung, Reparatur, abgeschnittene Antworten,
// S1-Vorgaben (0.4.19), Prüffrage und Warnung bei gescheitertem Abruf der Auftrags-URL.
import { describe, expect, it } from "vitest";
import { ilkaMeldung } from "../support/fixtures";
import { llmAntwort, skriptAnbieter } from "../support/anbieter";
import { AUFTRAGS_URL, bestaetigterVorschlag, pipelineKontext, s1Vorschlag } from "../support/pipeline";
import { MAX_TOKENS_S1, stufe1, stufe2und3, auftragsAbrufFehler } from "../../src/pipeline/stufen";
import { pruefeRoh } from "../../src/kern/validierung";
import type { Material } from "../../src/pipeline/material";

const he = ilkaMeldung("HE");
/** Kontext wie in der Testreihe: Uhr 14:00, Auftrag nur mit Sachverhalt */
const WIE_TESTREIHE = { jetzt: "2026-10-14T14:00:00+02:00", auftrag: { sachverhalt: "Orkan", stichworte: "" } };

describe("Pipeline S1–S3 mit Attrappe", () => {
  it("S1 liefert einen bereinigten Vorschlag mit strukturierter Ausgabe", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att);
    const v = await stufe1(k);
    expect(att.anfragen[0].jsonSchema).toBeTruthy();
    expect(att.anfragen[0].modell).toBe("claude-haiku-5-5");
    expect(v.sachverhalte[0].sops).toEqual(["b01"]); // frühere ID „sop-01“ aufgelöst, unbekannte Kennung entfernt
    expect(k.lauf.status).toBe("bestaetigen");
    expect(k.lauf.stufen[0].anfrage?.system[0]).toContain("Katalog der Ereignisarten");
  });

  it("S2 und S3: Entwurf wird nachbearbeitet und ist schemakonform", async () => {
    const entwurf = structuredClone(he);
    delete entwurf._entstehung;
    entwurf._status = "final";
    entwurf.schema = "falsch";
    const att = skriptAnbieter([
      llmAntwort("Kernaussage: Folgen weitgehend behoben.\n\n```json\n" + JSON.stringify(entwurf) + "\n```", {
        fundstellen: [{ url: "https://beispiel.invalid/a", titel: "A" }],
        suchen: ["Ilka Hessen"],
      }),
    ]);
    const { k, protokolle } = await pipelineKontext(att);
    const e = await stufe2und3(k, s1Vorschlag() as any);
    expect(e.schemaBefunde).toEqual([]);
    expect(e.meldung!.schema).toBe("LEAD-Meldung-v1");
    expect(e.meldung!._status).toBe("Entwurf");
    expect(e.meldung!._entstehung.verfahren).toBe("KI-Entwurf");
    expect(e.meldung!._entstehung.werkzeug).toContain(k.lauf.id);
    expect(e.meldung!._entstehung.sop).toEqual(["SOP-LEAD B01 Unwetter / Sturm v2.0.1"]);
    expect(e.kurzantwort).toBe("Kernaussage: Folgen weitgehend behoben.");
    expect(k.lauf.status).toBe("fertig");
    expect(k.lauf.ergebnis?.schemakonform).toBe(true);
    expect(k.lauf.ergebnis?.fundstellen).toHaveLength(1);
    const anf = att.anfragen[0];
    expect(anf.werkzeuge?.websuche?.maxUses).toBe(15);
    expect(anf.system[0].cache).toBe(true);
    expect(anf.system[1].text).toContain("SOP-LEAD B01 Unwetter / Sturm");
    expect(anf.system[2].text).toContain("Ausgabeformat (von der App vorgegeben)");
    expect(protokolle.length).toBeGreaterThan(2);
  });

  it("S3 repariert Schemafehler höchstens zweimal", async () => {
    const kaputt = structuredClone(he);
    kaputt.sachverhalte[0].sofort.beurteilung = "katastrophal";
    const repariert = structuredClone(he);
    const att = skriptAnbieter([
      llmAntwort("Kurz.\n```json\n" + JSON.stringify(kaputt) + "\n```"),
      llmAntwort("```json\n" + JSON.stringify(repariert) + "\n```"),
    ]);
    const { k } = await pipelineKontext(att);
    const e = await stufe2und3(k, s1Vorschlag() as any);
    expect(att.anfragen).toHaveLength(2);
    expect(att.anfragen[1].werkzeuge).toBeUndefined();
    expect(String(att.anfragen[1].nachrichten[0].content)).toMatch(/Prüfbericht der App/);
    expect(e.schemaBefunde).toEqual([]);
    expect(k.lauf.stufen.map((s) => s.stufe)).toEqual(["S2 Recherche und Entwurf", "S3 Reparatur 1"]);

    const immerKaputt = skriptAnbieter([1, 2, 3].map(() => llmAntwort("```json\n" + JSON.stringify(kaputt) + "\n```")));
    const { k: k2 } = await pipelineKontext(immerKaputt);
    const e2 = await stufe2und3(k2, s1Vorschlag() as any);
    expect(immerKaputt.anfragen).toHaveLength(3);
    expect(e2.schemaBefunde.length).toBeGreaterThan(0);
    expect(k2.lauf.ergebnis?.schemakonform).toBe(false);
    expect(pruefeRoh(k2.profil.schema, e2.meldung).length).toBeGreaterThan(0);
  });

  it("protokolliert PDFs ohne Base64 und summiert Kosten", async () => {
    const pdf: Material = { id: "p", art: "pdf", name: "lage.pdf", groesse: 5000, hash: "h", base64: "A".repeat(5000) };
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att, [pdf]);
    await stufe1(k);
    expect(JSON.stringify(k.lauf.stufen[0].anfrage)).not.toContain("A".repeat(3000));
    expect(JSON.stringify(k.lauf.stufen[0].anfrage)).toContain("nicht im Protokoll");
    expect(k.lauf.kostenUsd).toBeCloseTo(0.01);
  });
});

describe("Abgeschnittene Antworten und t0", () => {
  it("vervollständigt eine an der Token-Grenze abgeschnittene Meldung ohne neue Recherche", async () => {
    const ganz = JSON.stringify(he);
    const att = skriptAnbieter([
      llmAntwort("Kurzantwort.\n\n```json\n" + ganz.slice(0, 2000), { stopGrund: "max_tokens" }),
      llmAntwort("```json\n" + ganz + "\n```"),
    ]);
    const { k } = await pipelineKontext(att);
    k.lauf.auftrag.meldezeitpunkt = "2026-10-14T14:00";
    const e = await stufe2und3(k, { ...s1Vorschlag(), meldezeitpunkt: "2026-10-14T14:00" } as any);
    expect(att.anfragen).toHaveLength(2);
    const v = att.anfragen[1];
    expect(v.werkzeuge).toBeUndefined();
    expect(v.aufwand).toBe("low");
    expect(v.system[v.system.length - 1].text).toContain("Vervollständigung");
    expect(JSON.stringify(v.nachrichten)).toContain("Abgeschnittener Entwurf");
    expect(e.schemaBefunde).toEqual([]);
    expect(e.kurzantwort).toBe("Kurzantwort.");
    expect(e.meldung!.meldezeitpunkt).toBe("2026-10-14T14:00");
    expect(k.lauf.stufen.map((s) => s.stufe)).toEqual(["S2 Recherche und Entwurf", "S3 Vervollständigung"]);
  });

  it("übernimmt einen im Auftrag vorgegebenen t0 in S1", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-18T09:00" }))]);
    const { k } = await pipelineKontext(att);
    k.lauf.auftrag.meldezeitpunkt = "2026-10-14T14:00";
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T14:00");
    expect(JSON.stringify(att.anfragen[0].nachrichten)).toContain("Meldezeitpunkt t0 (vorgegeben): 2026-10-14 14:00");
  });
});

describe("S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19)", () => {
  it("ruft S1 mit hohem Aufwand und 16 000 Ausgabetoken auf", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att);
    await stufe1(k);
    expect(att.anfragen[0].aufwand).toBe("high");
    expect(att.anfragen[0].maxTokens).toBe(MAX_TOKENS_S1);
    expect(MAX_TOKENS_S1).toBe(16000);
  });

  it("Erfassung ohne Eingänge: t0 aus S1 bleibt unverändert", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-20T22:30" }))]);
    const { k } = await pipelineKontext(att);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-20T22:30");
    expect(v.appHinweise).toBeUndefined();
  });

  it("übernimmt eine Prüffrage aus S1 ohne Vorgabe im Auftrag nur als Vorschlag", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), prueffrage: "Reicht die Dieselreserve?" }))]);
    const { k } = await pipelineKontext(att);
    const v = await stufe1(k);
    expect(v.prueffrage).toBe("");
    expect(v.prueffrageVorschlag).toBe("Reicht die Dieselreserve?");
    expect((att.anfragen[0].jsonSchema as any).properties.prueffrage.description).toContain("nur, wenn die Person ihn bestätigt");
  });

  it("behält die geschärfte Prüffrage, wenn der Auftrag eine nennt", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), prueffrage: "Reicht die Dieselreserve bis 15.10.?" }))]);
    const { k } = await pipelineKontext(att);
    k.lauf.auftrag.prueffrage = "Reicht der Diesel?";
    const v = await stufe1(k);
    expect(v.prueffrage).toBe("Reicht die Dieselreserve bis 15.10.?");
    expect(v.prueffrageVorschlag).toBeUndefined();
    const att2 = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), prueffrage: "" }))]);
    const { k: k2 } = await pipelineKontext(att2);
    k2.lauf.auftrag.prueffrage = "Reicht der Diesel?";
    expect((await stufe1(k2)).prueffrage).toBe("Reicht der Diesel?");
  });
});

describe("Gescheiterter Abruf der Auftrags-URL", () => {
  it("ordnet Abruffehler den Auftrags-URLs zu (Schrägstrich, Anker, je URL einmal)", () => {
    const f = auftragsAbrufFehler(
      ["https://www.zeit.de/artikel"],
      [
        { url: "https://www.zeit.de/artikel/", code: "url_not_allowed" },
        { url: "https://www.zeit.de/artikel#absatz", code: "url_not_allowed" },
        { url: "https://www.who.int/x", code: "unavailable" },
      ],
    );
    expect(f).toEqual([{ url: "https://www.zeit.de/artikel/", code: "url_not_allowed" }]);
    expect(auftragsAbrufFehler(undefined, [{ url: "https://a.b", code: "x" }])).toEqual([]);
  });

  it("warnt im Ergebnis, wenn die Seite aus dem Auftrag nicht abrufbar war", async () => {
    const ok = llmAntwort("Kurz.\n```json\n" + JSON.stringify(he) + "\n```", { abrufFehler: [{ url: AUFTRAGS_URL + "/", code: "url_not_allowed" }] });
    const att = skriptAnbieter([ok]);
    const { k } = await pipelineKontext(att, [], WIE_TESTREIHE);
    const e = await stufe2und3(k, bestaetigterVorschlag() as any);
    const w = e.befunde.find((b) => b.stufe === "warnung" && /Seite aus dem Auftrag konnte nicht abgerufen werden/.test(b.text));
    expect(w?.text).toContain("url_not_allowed");
    expect(w?.text).toContain("als PDF oder Text beifügen");
  });

  it("warnt nicht bei Abruffehlern anderer Seiten", async () => {
    const att = skriptAnbieter([
      llmAntwort("Kurz.\n```json\n" + JSON.stringify(he) + "\n```", { abrufFehler: [{ url: "https://andere.invalid", code: "unavailable" }] }),
    ]);
    const { k } = await pipelineKontext(att, [], WIE_TESTREIHE);
    const e = await stufe2und3(k, bestaetigterVorschlag() as any);
    expect(e.befunde.some((b) => /Seite aus dem Auftrag/.test(b.text))).toBe(false);
  });
});
