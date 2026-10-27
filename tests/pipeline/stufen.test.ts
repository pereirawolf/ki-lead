// Pipeline S1–S3 mit skriptiertem Anbieter: Bereinigung, Nachbearbeitung, Reparatur, abgeschnittene Antworten,
// S1-Vorgaben (0.4.19), Prüffrage und Warnung bei gescheitertem Abruf der Auftrags-URL.
import { describe, expect, it } from "vitest";
import { ilkaMeldung } from "../support/fixtures";
import { llmAntwort, skriptAnbieter } from "../support/anbieter";
import { AUFTRAGS_URL, bestaetigterVorschlag, pipelineKontext, s1Vorschlag } from "../support/pipeline";
import { begrenztParallel, ORIENTIERUNG_PARALLEL } from "../../src/pipeline/orientierung";
import { auftragsAbrufFehler } from "../../src/pipeline/recherchebefunde";
import { s1Strukturfehler, stufe1 } from "../../src/pipeline/s1";
import { reparaturSystem, stufe2und3 } from "../../src/pipeline/s2s3";
import { profil as profilLaden } from "../support/dateien";
import { STANDARD } from "../../src/pipeline/einstellungen";
import { istBestaetigen, istFertig, istGescheitert } from "../../src/pipeline/lauf";
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
    expect(e.meldung!._entstehung.sop).toEqual(["SOP-LEAD B01 Unwetter / Sturm v2.2.0"]);
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
  it("ruft S1 mit hohem Aufwand auf (Ausgabegrenze siehe „S1-Ausgabegrenze“, 0.4.25)", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att);
    await stufe1(k);
    expect(att.anfragen[0].aufwand).toBe("high");
  });

  it("Erfassung ohne Eingänge: ein t0 aus S1 am heutigen Stichtag vor der aktuellen Zeit bleibt unverändert", async () => {
    // Testuhr 14.10.2026 10:00, Stichtag 14.10.2026
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-14T09:30" }))]);
    const { k } = await pipelineKontext(att);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T09:30");
    expect(v.appHinweise).toBeUndefined();
  });

  it("Erfassung ohne Eingänge: ein t0 aus S1 in der Zukunft wird mit Hinweis auf die aktuelle Zeit gesetzt", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-20T22:30" }))]);
    const { k } = await pipelineKontext(att);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T10:00");
    expect(v.appHinweise).toHaveLength(1);
    expect(v.appHinweise![0]).toContain("20.10.2026, 22:30 Uhr");
    expect(v.appHinweise![0]).toContain("in der Zukunft");
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

// S1-Ausgabegrenze (0.4.25): Läufe 20261021-133605-75wi und 20261021-133728-cvza brachen bei 16 000 Token ab.
// Kennungen T01–T14 nach dem konsolidierten Vorschlag vom 21.10.2026.
describe("S1-Ausgabegrenze und Abbruch an der Grenze (0.4.25)", () => {
  /** Kontext mit abweichendem S1-Modell bzw. abweichender Höchstzahl Ausgabetoken */
  async function kontext(antworten: Parameters<typeof skriptAnbieter>[0], s1Modell = "", maxTokensErfassung = STANDARD.maxTokensErfassung) {
    const att = skriptAnbieter(antworten);
    const { k, protokolle } = await pipelineKontext(att);
    k.einstellungen = { ...STANDARD, maxTokensErfassung, modelle: { ...STANDARD.modelle, vorverarbeitung: s1Modell } };
    return { att, k, protokolle };
  }
  const abgeschnitten = (text: string, inhalt: any[] = [{ type: "thinking" }, { type: "text", text }]) =>
    llmAntwort(text, {
      stopGrund: "max_tokens",
      inhalt,
      nutzung: { eingabe: 34246, ausgabe: 128000, cacheSchreiben: 0, cacheLesen: 44327, websuchen: 0, abrufe: 0 },
      kostenUsd: 0.07,
    });

  it("T01: Standard: Haiku mit Aufwand high erhält beim ersten und einzigen S1-Aufruf die Vorgabe 128 000", async () => {
    const { att, k } = await kontext([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    await stufe1(k);
    expect(att.anfragen).toHaveLength(1);
    expect([att.anfragen[0].modell, att.anfragen[0].aufwand, att.anfragen[0].maxTokens]).toEqual(["claude-haiku-5-5", "high", 128000]);
    expect(k.lauf.stufen[0].anfrage?.maxTokens).toBe(128000);
  });

  it("T02: S1 folgt der Einstellung „Höchstzahl Ausgabetoken (S1, S2, S3)“; die Meldung nennt den gesetzten Wert", async () => {
    const { att, k } = await kontext([abgeschnitten("", [{ type: "thinking" }])], "", 32000);
    await expect(stufe1(k)).rejects.toThrow(/^S1 hat die Ausgabegrenze von 32\.000 Token erreicht/);
    expect(att.anfragen[0].maxTokens).toBe(32000);
  });

  it.each(["claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1", "gpt-6-luna"])(
    "T03: auch mit %s gilt die eingestellte Grenze, Aufwand unverändert",
    async (modell) => {
      const { att, k } = await kontext([llmAntwort(JSON.stringify(s1Vorschlag()))], modell, 64000);
      await stufe1(k);
      expect([att.anfragen[0].modell, att.anfragen[0].aufwand, att.anfragen[0].maxTokens]).toEqual([modell, "high", 64000]);
    },
  );

  it("T04/T14: max_tokens nur mit Denkblock: Budgetfehler mit Grenze, Modell und Aufwand; kein Vorschlag, kein zweiter Aufruf; Protokoll vollständig", async () => {
    const { att, k, protokolle } = await kontext([abgeschnitten("", [{ type: "thinking" }])]);
    await expect(stufe1(k)).rejects.toThrow(
      "S1 hat die Ausgabegrenze von 128.000 Token erreicht, bevor ein vollständiger Vorschlag vorlag (Modell claude-haiku-5-5, Aufwand high). Eingaben und Laufprotokoll bleiben erhalten. Technisch: Die Antwort enthält keinen JSON-Block.",
    );
    expect(att.anfragen).toHaveLength(1);
    expect(k.lauf.vorschlag).toBeUndefined();
    expect(k.lauf.status).toBe("s1");
    const e = protokolle[protokolle.length - 1].stufen[0];
    expect(e.notiz).toBe("S1-Ausgabegrenze von 128.000 Token erreicht; kein vollständiger Vorschlag. Sichtbarer Text: 0 Zeichen.");
    expect([e.anfrage?.maxTokens, e.antwort?.stopGrund, e.nutzung?.ausgabe, e.kostenUsd]).toEqual([128000, "max_tokens", 128000, 0.07]);
  });

  it("T05: JSON bricht mitten im zweiten Sachverhalt ab: Budgetfehler, keine Klammerreparatur, kein Teilvorschlag", async () => {
    const voll = JSON.stringify({
      ...s1Vorschlag(),
      sachverhalte: [s1Vorschlag().sachverhalte[0], { titel: "Stromausfall", ereignisarten: ["Stromausfall / Blackout"], sops: ["b08"], begruendung: "x" }],
    });
    const text = voll.slice(0, voll.indexOf("Stromausfall") + 8);
    const { att, k } = await kontext([abgeschnitten(text)]);
    await expect(stufe1(k)).rejects.toThrow(/Ausgabegrenze von 128\.000 Token erreicht.*Technisch: JSON unvollständig/);
    expect(att.anfragen).toHaveLength(1);
    expect(k.lauf.vorschlag).toBeUndefined();
  });

  it.each([
    ["ohne Sachverhalte", { ...s1Vorschlag(), sachverhalte: [] }, "Der Vorschlag enthält keine Sachverhalte."],
    ["Sachverhalt ohne Titel", { ...s1Vorschlag(), sachverhalte: [{ ereignisarten: [] }] }, "Sachverhalt 1 ist unvollständig."],
  ])("T06: max_tokens mit vollständigem, aber strukturell unvollständigem JSON (%s): keine Bestätigung", async (_, json, grund) => {
    const { k } = await kontext([abgeschnitten(JSON.stringify(json))]);
    await expect(stufe1(k)).rejects.toThrow(`Technisch: ${grund}`);
    expect(k.lauf.status).toBe("s1");
  });

  it("T06: Strukturprüfung lehnt Listen, null und Skalare ab", () => {
    for (const x of [[s1Vorschlag()], null, 42, "Text"]) expect(s1Strukturfehler(x)).toBe("Die Antwort ist kein JSON-Objekt.");
    expect(s1Strukturfehler(s1Vorschlag())).toBeNull();
  });

  it("T07: max_tokens mit vollständigem, gültigem Vorschlag: Bestätigung mit sichtbarem Prüfbedarf, kein S2", async () => {
    const { att, k } = await kontext([abgeschnitten(JSON.stringify(s1Vorschlag()))]);
    const v = await stufe1(k);
    expect(k.lauf.status).toBe("bestaetigen");
    expect(v.appHinweise).toEqual([expect.stringMatching(/^S1 hat die Ausgabegrenze von 128\.000 Token erreicht\. Der Vorschlag ist technisch vollständig/)]);
    expect(k.lauf.stufen[0].notiz).toMatch(/technisch vollständig/);
    expect(att.anfragen).toHaveLength(1);
  });

  it("T08: end_turn mit vollständigem Vorschlag: übliche Bestätigung ohne Grenzhinweis", async () => {
    const { k } = await kontext([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const v = await stufe1(k);
    expect(v.appHinweise).toBeUndefined();
    expect(k.lauf.stufen[0].notiz).toBeUndefined();
  });

  it("T09: end_turn mit leerer Antwort: leere Antwort, keine Budgetdiagnose", async () => {
    const { k } = await kontext([llmAntwort("", { inhalt: [] })]);
    await expect(stufe1(k)).rejects.toThrow(
      "Stufe S1 lieferte eine leere Antwort (Modell claude-haiku-5-5, Abbruchgrund end_turn). Eingaben und Laufprotokoll bleiben erhalten.",
    );
    expect(k.lauf.stufen[0].notiz).toBe("Leere Antwort (stopGrund end_turn).");
  });

  it("anderer Abbruchgrund ohne JSON: Grund wird genannt, keine Budgetdiagnose", async () => {
    const { k } = await kontext([llmAntwort("Dazu kann ich nichts sagen.", { stopGrund: "refusal" })]);
    await expect(stufe1(k)).rejects.toThrow("Stufe S1 lieferte kein auswertbares Ergebnis. Die Antwort enthält keinen JSON-Block. (Abbruchgrund refusal)");
  });
});

describe("AV-2026-W43-34: Anweisung der Reparatur", () => {
  it("nennt die Begründung als Herkunft korrigierter Werte, den Leerwert als Ausweg und verbietet Skalenrand und Kürzung", async () => {
    const p = (await profilLaden("lead-beispiel")).profil!;
    const a = reparaturSystem(p);
    expect(a).toContain("übernimm den Wert, den die Begründung desselben Sachverhalts nennt");
    expect(a).toContain("verwende den Leerwert, nie den Rand der Skala");
    expect(a).toContain("Ändere, kürze oder streiche keine Textfelder, die das Schema nicht beanstandet.");
    expect(a).toContain("Recherchiere nicht neu und ergänze keine Fakten.");
  });
});

// Begrenzte Nebenläufigkeit der Orientierungssuchen (seit 0.6.2, TP-2026-W44-05)
describe("TP-2026-W44-05: begrenzt parallele Aufrufe", () => {
  it("führt höchstens zwei Aufgaben zugleich aus und liefert die Ergebnisse in Eingabereihenfolge", async () => {
    expect(ORIENTIERUNG_PARALLEL).toBe(2);
    let laufend = 0;
    let hoechst = 0;
    const freigaben: (() => void)[] = [];
    const lauf = begrenztParallel([10, 20, 30, 40, 50], 2, async (x) => {
      laufend++;
      hoechst = Math.max(hoechst, laufend);
      await new Promise<void>((r) => freigaben.push(r));
      laufend--;
      return x * 2;
    });
    // Nach dem Start laufen genau zwei; jede Freigabe lässt die nächste nachrücken
    await new Promise((r) => setImmediate(r));
    expect(freigaben).toHaveLength(2);
    for (let i = 0; i < 5; i++) {
      freigaben[i]();
      await new Promise((r) => setImmediate(r));
    }
    expect(await lauf).toEqual([20, 40, 60, 80, 100]);
    expect(hoechst).toBe(2);
  });

  it("reicht den ersten Fehler weiter, nachdem die laufenden Aufgaben beendet sind, und startet keine weiteren", async () => {
    const gestartet: number[] = [];
    await expect(
      begrenztParallel([1, 2, 3, 4], 2, async (x) => {
        gestartet.push(x);
        await new Promise((r) => setImmediate(r));
        if (x === 1) throw new Error("Aufgabe 1 gescheitert");
        return x;
      }),
    ).rejects.toThrow("Aufgabe 1 gescheitert");
    expect(gestartet).toEqual([1, 2]);
  });
});

// Type-Guards für den Zustand eines Laufs (seit 0.6.2, TP-2026-W44-07); gespeicherte Läufe behalten ihre Form
describe("TP-2026-W44-07: Zustand eines Laufs", () => {
  it("istFertig verlangt Status „fertig“ und ein Ergebnis, istBestaetigen einen Vorschlag", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att);
    expect(istBestaetigen(k.lauf)).toBe(false);
    expect(istFertig(k.lauf)).toBe(false);
    expect(istGescheitert(k.lauf)).toBe(false);
    await stufe1(k);
    expect(istBestaetigen(k.lauf)).toBe(true);
    // Status allein genügt nicht: ein als „fertig“ markierter Lauf ohne Ergebnis ist nicht fertig
    const ohneErgebnis = { ...k.lauf, status: "fertig" as const };
    expect(istFertig(ohneErgebnis)).toBe(false);
    expect(istGescheitert({ ...k.lauf, status: "abgebrochen" as const })).toBe(true);
    expect(istGescheitert({ ...k.lauf, status: "fehler" as const })).toBe(true);
  });
});

// Persistenz während eines Laufs (seit 0.6.2, TP-2026-W44-10)
describe("TP-2026-W44-10: Speicherfehler nach einem Aufruf verliert die Antwort nicht", () => {
  it("scheitert das Speichern im Anschluss an den Aufruf, bleibt die bezahlte Antwort im Eintrag und der Lauf läuft weiter", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att);
    // Das Speichern scheitert genau beim Aufruf nach der Antwort (der dritte: Start des Eintrags, nach der Antwort, Statuswechsel)
    let aufrufe = 0;
    k.aktualisiert = async () => {
      aufrufe++;
      if (aufrufe === 2) throw new DOMException("Der Speicherplatz ist erschöpft.", "QuotaExceededError");
    };
    const v = await stufe1(k);
    expect(v.sachverhalte).toHaveLength(1);
    expect(k.lauf.status).toBe("bestaetigen");
    const eintrag = k.lauf.stufen[0]!;
    expect(eintrag.antwort?.text).toContain("Sturmfolgen");
    expect(eintrag.kostenUsd).toBe(0.01);
    expect(eintrag.notiz).toMatch(/Speichern nach diesem Aufruf gescheitert: Der Speicherplatz ist erschöpft\./);
    expect(aufrufe).toBeGreaterThanOrEqual(3);
  });
});
