import { eingangsquellenPruefen } from "../src/pipeline/vermerke";
import { describe, expect, it } from "vitest";
import { jsonDateien, profil } from "./hilfen";
import { STANDARD } from "../src/pipeline/einstellungen";
import { neuerLauf, type Lauf } from "../src/pipeline/lauf";
import { kodierleitfadenKennung, MAX_TOKENS_S1, sopKennungenAbgleichen, stufe1, stufe2und3, T0_SPIELRAUM_STUNDEN, type Kontext } from "../src/pipeline/stufen";
import { sopIdsAufloesen, verdichtungsAnweisung, VERDICHTUNG_S2 } from "../src/pipeline/kontext";
import { zerlegeAntwort } from "../src/pipeline/json";
import { ereignisarten, s1Schema, sopsFuerArten, anweisungErfassung, anwendungsbereich, fachSops } from "../src/pipeline/kontext";
import { materialBloecke, docxText, urlsAusText, dateiLesen, juengsterEingang, type Material } from "../src/pipeline/material";
import { leereNutzung, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "../src/anbieter/typen";
import { pruefeRoh } from "../src/kern/validierung";
import JSZip from "jszip";

const ilka = jsonDateien("../profile/lead-beispiel/beispiele/orkantief-ilka");
const he = ilka.find((x) => x.name.includes("_HE_"))!.daten;

function antwort(text: string, extra: Partial<LlmAntwort> = {}): LlmAntwort {
  return {
    modell: "claude-test",
    text,
    inhalt: [{ type: "text", text }],
    zitate: [],
    fundstellen: [],
    suchen: [],
    abrufe: [],
    abrufFehler: [],
    nutzung: { ...leereNutzung(), eingabe: 100, ausgabe: 50 },
    kostenUsd: 0.01,
    stopGrund: "end_turn",
    dauerMs: 5,
    runden: 1,
    ...extra,
  };
}

class Attrappe implements LlmAnbieter {
  id = "attrappe";
  anfragen: LlmAnfrage[] = [];
  constructor(private antworten: LlmAntwort[]) {}
  async senden(a: LlmAnfrage) {
    this.anfragen.push(a);
    const r = this.antworten.shift();
    if (!r) throw new Error("keine Antwort mehr");
    return r;
  }
}

const VORSCHLAG = {
  gegenstand: "Sturmfolgen Orkantief Ilka in Hessen",
  stichtag: "2026-10-14",
  referenzbezug: "Land Hessen",
  horizont: "bis 21.10.2026",
  sachverhalte: [{ titel: "Sturmfolgen Hessen", ereignisarten: ["Unwetter / Sturm"], sops: ["sop-01", "sop-99"], begruendung: "Sturm" }],
  prueffrage: "",
  hinweise: "Nur Stichworte vorhanden",
};

async function kontext(anbieter: LlmAnbieter, material: Material[] = []): Promise<{ k: Kontext; protokolle: Lauf[] }> {
  const { profil: p } = await profil("lead-beispiel");
  const lauf = neuerLauf(
    p!,
    { sachverhalt: "Orkan in Hessen", stichworte: "Sturm, Bahn", urls: ["https://beispiel.invalid/lage"], stichtag: "2026-10-14", prueffrage: "" },
    [],
  );
  const protokolle: Lauf[] = [];
  return {
    k: {
      profil: p!,
      anbieter,
      einstellungen: STANDARD,
      lauf,
      material,
      aktualisiert: (l) => {
        protokolle.push(structuredClone(l));
      },
      jetzt: () => new Date("2026-10-14T10:00:00+02:00"),
    },
    protokolle,
  };
}

describe("Kontext aus dem Profil", () => {
  it("liest Ereignisarten und ordnet SOPs zu", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const arten = ereignisarten(p!);
    expect(arten).toHaveLength(17);
    expect(arten).toContain("Stromausfall / Blackout");
    expect(sopsFuerArten(p!, ["Unwetter / Sturm", "Stromausfall / Blackout"])).toEqual(["b01", "b08"]);
    const schema: any = s1Schema(p!);
    expect(schema.properties.sachverhalte.items.properties.sops.items.enum).toHaveLength(34); // 17 Ereignis-SOPs und 17 Bausteine aus Teil C
    expect(anwendungsbereich(fachSops(p!)[0].text)).not.toMatch(/^###/);
  });

  it("ersetzt alle Platzhalter der Arbeitsanweisung und hängt den Ausgabevertrag an", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const t = anweisungErfassung(
      p!,
      { sachverhalt: "X", ausgangsquellen: "Y", stichtag: "2026-10-14", prueffrage: "keine", ereignisarten: "Z" },
      "2026-10-14T10:00",
    );
    expect(t).not.toMatch(/\{\{|\[nicht angegeben\]/);
    expect(t).toContain("Ausgabeformat (von der App vorgegeben)");
    expect(t).toContain("Rollenprofil (SOP-LEAD A.1 Nr. 4): übergreifende Redaktion");
  });

  it("setzt die Fassung des Kodierleitfadens aus dem Profil und gleicht SOP-Kennungen ab", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(kodierleitfadenKennung(p!)).toBe("Kodierleitfaden LEAD 1.2.1");
    // frühere Kennungen (01, N02) und aktuelle (B08) werden auf die gültige Kennung abgebildet
    const liste = [
      "SOP-LEAD 01 Unwetter / Sturm v0.4",
      "SOP-LEAD 99 Erfunden v1.0",
      "SOP-LEAD N02 irgendwas",
      "SOP-LEAD 1 Unwetter / Sturm",
      "SOP-LEAD B08 Strom",
    ];
    expect(sopKennungenAbgleichen(liste, p!)).toEqual([
      "SOP-LEAD B01 Unwetter / Sturm v2.0.1",
      "SOP-LEAD C11 Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit v1.0.1",
      "SOP-LEAD B08 Stromausfall / Blackout v2.0.1",
    ]);
    // Nicht in S1 bestätigte (nicht beigefügte) SOPs entfallen
    expect(sopKennungenAbgleichen(liste, p!, new Set(["b01"]))).toEqual(["SOP-LEAD B01 Unwetter / Sturm v2.0.1"]);
  });

  it("löst frühere SOP-IDs gespeicherter Läufe auf", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(sopIdsAufloesen(p!, ["sop-08", "baustein-n05", "b08", "c99", "baustein-n14"])).toEqual(["b08", "c12"]);
  });

  it("Verdichtung: Profilanweisung ohne offene Platzhalter, Ersatzfassung ohne Altregeln", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const v = verdichtungsAnweisung(p!);
    expect(v).not.toMatch(/\{\{|\[nicht angegeben\]/);
    expect(v).toContain("Fassung 2.0");
    for (const text of [v, VERDICHTUNG_S2]) {
      expect(text).not.toMatch(/gilt die jüngste|Jede Eingangsmeldung ist eine Quelle der Kategorie A|dürfen als Belege dienen|Untergrenze/);
    }
  });
});

describe("Material", () => {
  it("liest DOCX-Text und erkennt URLs", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      "<w:document><w:body><w:p><w:r><w:t>Erste &amp; Zeile</w:t></w:r></w:p><w:p><w:r><w:t>Zweite</w:t><w:tab/><w:t>Spalte</w:t></w:r></w:p></w:body></w:document>",
    );
    const daten = await zip.generateAsync({ type: "arraybuffer" });
    expect(await docxText(daten)).toBe("Erste & Zeile\nZweite\tSpalte");
    expect(urlsAusText("https://a.de/x  kein-link\nhttp://b.de")).toEqual({ gueltig: ["https://a.de/x", "http://b.de/"], ungueltig: ["kein-link"] });
  });

  it("legt PDFs als Dokumentblock bei und URLs in den Nutzertext", () => {
    const bloecke = materialBloecke([{ id: "1", art: "pdf", name: "a.pdf", groesse: 3, hash: "h", base64: "QUJD" }], ["https://x.de/"], "Sturm");
    expect(bloecke[0]).toMatchObject({ type: "text" });
    expect((bloecke[0] as any).text).toContain("https://x.de/");
    expect(bloecke[1]).toMatchObject({ type: "document", source: { media_type: "application/pdf", data: "QUJD" } });
  });
});

describe("JSON aus Antworten", () => {
  it("trennt Kurzantwort und letzten JSON-Block", () => {
    const z = zerlegeAntwort('Kurz.\n\n```json\n{"a": 1}\n```');
    expect(z).toMatchObject({ kurzantwort: "Kurz.", json: { a: 1 } });
    expect(zerlegeAntwort('Text {"b": "}"} Ende').json).toEqual({ b: "}" });
    expect(zerlegeAntwort('```json\n{"a": \n```').fehler).toMatch(/nicht lesbar/);
    expect(zerlegeAntwort("nur Text").fehler).toMatch(/keinen JSON-Block/);
  });
});

describe("Pipeline S1–S3 mit Attrappe", () => {
  it("S1 liefert einen bereinigten Vorschlag mit strukturierter Ausgabe", async () => {
    const att = new Attrappe([antwort(JSON.stringify(VORSCHLAG))]);
    const { k } = await kontext(att);
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
    const att = new Attrappe([
      antwort("Kernaussage: Folgen weitgehend behoben.\n\n```json\n" + JSON.stringify(entwurf) + "\n```", {
        fundstellen: [{ url: "https://beispiel.invalid/a", titel: "A" }],
        suchen: ["Ilka Hessen"],
      }),
    ]);
    const { k, protokolle } = await kontext(att);
    const e = await stufe2und3(k, VORSCHLAG as any);
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
    const att = new Attrappe([antwort("Kurz.\n```json\n" + JSON.stringify(kaputt) + "\n```"), antwort("```json\n" + JSON.stringify(repariert) + "\n```")]);
    const { k } = await kontext(att);
    const e = await stufe2und3(k, VORSCHLAG as any);
    expect(att.anfragen).toHaveLength(2);
    expect(att.anfragen[1].werkzeuge).toBeUndefined();
    expect(String(att.anfragen[1].nachrichten[0].content)).toMatch(/Prüfbericht der App/);
    expect(e.schemaBefunde).toEqual([]);
    expect(k.lauf.stufen.map((s) => s.stufe)).toEqual(["S2 Recherche und Entwurf", "S3 Reparatur 1"]);

    const immerKaputt = new Attrappe([1, 2, 3].map(() => antwort("```json\n" + JSON.stringify(kaputt) + "\n```")));
    const { k: k2 } = await kontext(immerKaputt);
    const e2 = await stufe2und3(k2, VORSCHLAG as any);
    expect(immerKaputt.anfragen).toHaveLength(3);
    expect(e2.schemaBefunde.length).toBeGreaterThan(0);
    expect(k2.lauf.ergebnis?.schemakonform).toBe(false);
    expect(pruefeRoh(k2.profil.schema, e2.meldung).length).toBeGreaterThan(0);
  });

  it("protokolliert PDFs ohne Base64 und summiert Kosten", async () => {
    const pdf: Material = { id: "p", art: "pdf", name: "lage.pdf", groesse: 5000, hash: "h", base64: "A".repeat(5000) };
    const att = new Attrappe([antwort(JSON.stringify(VORSCHLAG))]);
    const { k } = await kontext(att, [pdf]);
    await stufe1(k);
    expect(JSON.stringify(k.lauf.stufen[0].anfrage)).not.toContain("A".repeat(3000));
    expect(JSON.stringify(k.lauf.stufen[0].anfrage)).toContain("nicht im Protokoll");
    expect(k.lauf.kostenUsd).toBeCloseTo(0.01);
  });
});

describe("Verdichtung von Eingangsmeldungen", () => {
  it("erkennt Meldungen anderer Stellen als Eingang und die eigene als Vormeldung", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const th = ilka.find((x) => x.name.includes("_TH_"))!;
    const datei = new File([JSON.stringify(th.daten)], th.name, { type: "application/json" });
    const m = await dateiLesen(datei, p!);
    expect(m.art).toBe("eingang");
    expect(m.eingang).toMatchObject({ land: "Thüringen", zeitpunkt: "2026-10-14T10:30", sachverhalte: 2 });
    const eigen = { ...th.daten, meldende_stelle: "Koordinierungsstelle (Beispiel)" };
    const v = await dateiLesen(new File([JSON.stringify(eigen)], "eigen.json"), p!);
    expect(v.art).toBe("meldung");
    expect(juengsterEingang([m, { ...m, eingang: { ...m.eingang!, zeitpunkt: "2026-10-14T11:00" } }])).toBe("2026-10-14T11:00");
  });

  it("verdichtet ohne Websuche, mit t0 aus den Eingängen und verbindlicher Gliederung", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const eingaenge: Material[] = [];
    for (const x of ilka.filter((x) => !x.name.includes("_Bund_"))) eingaenge.push(await dateiLesen(new File([JSON.stringify(x.daten)], x.name), p!));
    const ohneT0 = {
      ...VORSCHLAG,
      meldezeitpunkt: "",
      sachverhalte: [{ ...VORSCHLAG.sachverhalte[0], eingangsmeldungen: [eingaenge[0].name, "unbekannt.json"] }],
    };
    const bund = structuredClone(ilka.find((x) => x.name.includes("_Bund_"))!.daten);
    const att = new Attrappe([antwort(JSON.stringify(ohneT0)), antwort("Kurz.\n```json\n" + JSON.stringify(bund) + "\n```")]);
    const { k } = await kontext(att, eingaenge);
    k.lauf.auftrag.websuche = false;
    const v = await stufe1(k);
    expect(att.anfragen[0].system[0].text).toContain("Verdichtung von Eingangsmeldungen");
    expect((att.anfragen[0].jsonSchema as any).properties.sachverhalte.items.properties.eingangsmeldungen.items.enum).toHaveLength(6);
    expect(v.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(v.sachverhalte[0].eingangsmeldungen).toEqual([eingaenge[0].name]);
    const e = await stufe2und3(k, v);
    const s2 = att.anfragen[1];
    expect(s2.werkzeuge).toBeUndefined();
    expect(s2.system).toHaveLength(5);
    expect(s2.system[3].text).toContain("Referenzraum wechselt");
    expect(s2.modell).toBe("claude-opus-5-5"); // Rolle „verdichtung“ aus dem Profil
    expect(k.lauf.stufen.find((x) => x.stufe === "S2 Verdichtung")).toBeTruthy();
    // Redaktionsvermerke der App aus dem Lagebild-Check
    expect(s2.system[4].text).toContain("Vermerke der App aus dem Redaktionscheck");
    expect(s2.system[4].text).toMatch(/Stromausfall \/ Blackout: .*→ Bewertungen weichen ab/);
    expect(JSON.stringify(att.anfragen[0].nachrichten)).toContain("Vermerke der App");
    expect(JSON.stringify(s2.nachrichten)).toContain("genau 1 Sachverhalt");
    expect(e.meldung!.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(k.lauf.ergebnis!.befunde.some((b) => /bestätigt waren 1/.test(b.text))).toBe(false);
    expect(eingangsquellenPruefen(eingaenge, e.meldung!, p!).map((x) => x.status)).toEqual(Array(6).fill("nachgewiesen"));
    expect(k.lauf.ergebnis!.befunde.some((b) => /Quellenverzeichnis/.test(b.text))).toBe(false);
  });
});

describe("Abgeschnittene Antworten und t0", () => {
  it("vervollständigt eine an der Token-Grenze abgeschnittene Meldung ohne neue Recherche", async () => {
    const ganz = JSON.stringify(he);
    const att = new Attrappe([antwort("Kurzantwort.\n\n```json\n" + ganz.slice(0, 2000), { stopGrund: "max_tokens" }), antwort("```json\n" + ganz + "\n```")]);
    const { k } = await kontext(att);
    k.lauf.auftrag.meldezeitpunkt = "2026-10-14T14:00";
    const e = await stufe2und3(k, { ...VORSCHLAG, meldezeitpunkt: "2026-10-14T14:00" } as any);
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
    const att = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, meldezeitpunkt: "2026-10-18T09:00" }))]);
    const { k } = await kontext(att);
    k.lauf.auftrag.meldezeitpunkt = "2026-10-14T14:00";
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T14:00");
    expect(JSON.stringify(att.anfragen[0].nachrichten)).toContain("Meldezeitpunkt t0 (vorgegeben): 2026-10-14 14:00");
  });
});

describe("S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19)", () => {
  async function eingaengeLesen(): Promise<Material[]> {
    const { profil: p } = await profil("lead-beispiel");
    const out: Material[] = [];
    for (const x of ilka.filter((x) => !x.name.includes("_Bund_"))) out.push(await dateiLesen(new File([JSON.stringify(x.daten)], x.name), p!));
    return out;
  }

  it("ruft S1 mit hohem Aufwand und 16 000 Ausgabetoken auf", async () => {
    const att = new Attrappe([antwort(JSON.stringify(VORSCHLAG))]);
    const { k } = await kontext(att);
    await stufe1(k);
    expect(att.anfragen[0].aufwand).toBe("high");
    expect(att.anfragen[0].maxTokens).toBe(MAX_TOKENS_S1);
    expect(MAX_TOKENS_S1).toBe(16000);
  });

  it("Verdichtung: setzt einen t0 weit nach dem jüngsten Eingang auf den Eingang zurück und sagt es", async () => {
    const eingaenge = await eingaengeLesen();
    const att = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, meldezeitpunkt: "2026-10-20T22:30" }))]);
    const { k } = await kontext(att, eingaenge);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(v.appHinweise).toHaveLength(1);
    expect(v.appHinweise![0]).toContain("14.10.2026, 11:00 Uhr");
    expect(v.appHinweise![0]).toContain("20.10.2026, 22:30 Uhr");
    expect(v.appHinweise![0]).toContain(`mehr als ${T0_SPIELRAUM_STUNDEN} Stunden danach`);
  });

  it("Verdichtung: setzt einen t0 vor dem jüngsten Eingang ebenfalls zurück", async () => {
    const eingaenge = await eingaengeLesen();
    const att = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, meldezeitpunkt: "2026-10-14T08:00" }))]);
    const { k } = await kontext(att, eingaenge);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(v.appHinweise![0]).toContain("vor dem jüngsten Eingang");
  });

  it("Verdichtung: lässt einen t0 kurz nach dem jüngsten Eingang stehen", async () => {
    const eingaenge = await eingaengeLesen();
    const att = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, meldezeitpunkt: "2026-10-14T12:00" }))]);
    const { k } = await kontext(att, eingaenge);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T12:00");
    expect(v.appHinweise).toBeUndefined();
  });

  it("Verdichtung: ein im Auftrag vorgegebener t0 geht der Absicherung vor", async () => {
    const eingaenge = await eingaengeLesen();
    const att = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, meldezeitpunkt: "2026-10-14T12:00" }))]);
    const { k } = await kontext(att, eingaenge);
    k.lauf.auftrag.meldezeitpunkt = "2026-10-20T22:30";
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-20T22:30");
    expect(v.appHinweise).toBeUndefined();
  });

  it("Erfassung ohne Eingänge: t0 aus S1 bleibt unverändert", async () => {
    const att = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, meldezeitpunkt: "2026-10-20T22:30" }))]);
    const { k } = await kontext(att);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-20T22:30");
    expect(v.appHinweise).toBeUndefined();
  });

  it("übernimmt eine Prüffrage aus S1 ohne Vorgabe im Auftrag nur als Vorschlag", async () => {
    const att = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, prueffrage: "Reicht die Dieselreserve?" }))]);
    const { k } = await kontext(att);
    const v = await stufe1(k);
    expect(v.prueffrage).toBe("");
    expect(v.prueffrageVorschlag).toBe("Reicht die Dieselreserve?");
    expect((att.anfragen[0].jsonSchema as any).properties.prueffrage.description).toContain("nur, wenn die Person ihn bestätigt");
  });

  it("behält die geschärfte Prüffrage, wenn der Auftrag eine nennt", async () => {
    const att = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, prueffrage: "Reicht die Dieselreserve bis 15.10.?" }))]);
    const { k } = await kontext(att);
    k.lauf.auftrag.prueffrage = "Reicht der Diesel?";
    const v = await stufe1(k);
    expect(v.prueffrage).toBe("Reicht die Dieselreserve bis 15.10.?");
    expect(v.prueffrageVorschlag).toBeUndefined();
    const att2 = new Attrappe([antwort(JSON.stringify({ ...VORSCHLAG, prueffrage: "" }))]);
    const { k: k2 } = await kontext(att2);
    k2.lauf.auftrag.prueffrage = "Reicht der Diesel?";
    expect((await stufe1(k2)).prueffrage).toBe("Reicht der Diesel?");
  });
});

describe("Quellenprüfung der Eingangsmeldungen", () => {
  const ein = (name: string, stelle: string, zeitpunkt = "2026-10-14T10:00", land = ""): Material => ({
    id: name,
    art: "eingang",
    name,
    groesse: 1,
    hash: name,
    eingang: { stelle, land, zeitpunkt, sachverhalte: 1, schema: "x" },
  });
  it("verlangt je Eingang einen eigenen A-Eintrag und unterscheidet ähnliche Stellen", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const nord = ein("n.json", "Lagezentrum (Nord)");
    const sued = ein("s.json", "Lagezentrum (Süd)");
    const z = eingangsquellenPruefen([nord, sued], { quellen: "[Q1] M – Lagezentrum (Nord) (14.10.2026): Lagemeldung" }, p!);
    expect(z.map((x) => x.status)).toEqual(["kategorie", "fehlt"]);
    const ok = eingangsquellenPruefen([nord, sued], { quellen: "[Q1] A – Lagezentrum (Nord): Lagemeldung\n[Q2] A – Lagezentrum (Süd): Lagemeldung" }, p!);
    expect(ok.map((x) => [x.status, x.eintrag])).toEqual([
      ["nachgewiesen", 1],
      ["nachgewiesen", 2],
    ]);
  });
  it("trennt zwei Zeitstände derselben Stelle über die Uhrzeit", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const frueh = ein("a.json", "Lagezentrum X", "2026-10-14T08:00");
    const spaet = ein("b.json", "Lagezentrum X", "2026-10-14T12:00");
    const nurEiner = eingangsquellenPruefen([frueh, spaet], { quellen: "[Q1] A – Lagezentrum X (14.10.2026): Lagemeldung" }, p!);
    expect(nurEiner.map((x) => x.status)).toEqual(["unsicher", "fehlt"]);
    const beide = eingangsquellenPruefen(
      [frueh, spaet],
      { quellen: "[Q1] A – Lagezentrum X: Lagemeldung 08:00 Uhr\n[Q2] A – Lagezentrum X: Lagemeldung 12:00 Uhr" },
      p!,
    );
    expect(beide.map((x) => x.status)).toEqual(["nachgewiesen", "nachgewiesen"]);
  });
});

describe("Gleichnamige Dateien", () => {
  it("erhalten im Material eindeutige Namen, gleiche Inhalte entfallen", async () => {
    const { materialErgaenzen } = await import("../src/pipeline/material");
    const m = (name: string, hash: string): Material => ({ id: hash, art: "eingang", name, groesse: 1, hash });
    const erg = materialErgaenzen([m("meldung.json", "a")], [m("meldung.json", "b"), m("meldung.json", "a"), m("meldung.json", "c")]);
    expect(erg.map((x) => x.name)).toEqual(["meldung.json", "meldung (2).json", "meldung (3).json"]);
  });
  it("behält beim ZIP-Import den Pfad im Archiv", async () => {
    const JSZip = (await import("jszip")).default;
    const { dateienAusAuswahl } = await import("../src/lagebild/lagebild");
    const zip = new JSZip();
    zip.file("Nord/meldung.json", "{}");
    zip.file("Sued/meldung.json", '{"a":1}');
    const blob = await zip.generateAsync({ type: "blob" });
    const { dateien } = await dateienAusAuswahl([new File([blob], "eingang.zip")]);
    expect(dateien.map((d) => d.name).sort()).toEqual(["eingang/Nord/meldung.json", "eingang/Sued/meldung.json"]);
  });
});

describe("Meldungsidentität (F03) und eigene Stelle (F07)", () => {
  it("setzt Land und meldende Stelle eines KI-Entwurfs auf die eigene Stelle und meldet die Korrektur", async () => {
    const { nachbearbeiten } = await import("../src/pipeline/stufen");
    const { k } = await kontext(new Attrappe([]));
    const korrekturen: string[] = [];
    const m = nachbearbeiten(structuredClone(he), k, "x", korrekturen);
    expect(m.land).toBe("Bund");
    expect(m.meldende_stelle).toBe("Koordinierungsstelle (Beispiel)");
    expect(korrekturen).toHaveLength(2);
    expect(korrekturen[0]).toMatch(/^land: „Hessen“ → „Bund“/);
    const alias = nachbearbeiten(
      { ...structuredClone(he), land: "Bund", meldende_stelle: "Koordinierungsstelle (Beispiel) – Redaktionskonferenz" },
      k,
      "x",
      ((korrekturen.length = 0), korrekturen),
    );
    expect(alias.meldende_stelle).toBe("Koordinierungsstelle (Beispiel) – Redaktionskonferenz");
    expect(korrekturen).toEqual([]);
  });
  it("erkennt die eigene Stelle nur exakt oder über hinterlegte Aliasnamen", async () => {
    const { istEigeneStelle } = await import("../src/kern/ui");
    const { profil: p } = await profil("lead-beispiel");
    const m = p!.manifest;
    expect(istEigeneStelle("Koordinierungsstelle (Beispiel)", m)).toBe(true);
    expect(istEigeneStelle("  koordinierungsstelle   (beispiel) ", m)).toBe(true);
    expect(istEigeneStelle("Koordinierungsstelle (Beispiel) – Redaktionskonferenz", m)).toBe(true); // Alias
    expect(istEigeneStelle("Koordinierungsstelle (Beispiel) Außenstelle", m)).toBe(false);
    const fremd = { ...structuredClone(he), meldende_stelle: "Koordinierungsstelle (Beispiel) Außenstelle", land: "Bund" };
    const mat = await dateiLesen(new File([JSON.stringify(fremd)], "a.json"), p!);
    expect(mat.art).toBe("eingang");
    const { umklassifizieren } = await import("../src/pipeline/material");
    expect(umklassifizieren(mat, p!).art).toBe("meldung");
    expect(umklassifizieren(umklassifizieren(mat, p!), p!).art).toBe("eingang");
  });
});

describe("Rollenwahl bei der Übergabe", () => {
  it("setzt die gewählte Rolle verbindlich und begründet unmögliche Rollen", async () => {
    const { rolleSetzen, moeglicheRollen } = await import("../src/pipeline/material");
    const { profil: p } = await profil("lead-beispiel");
    const bund = ilka.find((x) => x.name.includes("_Bund_"))!.daten;
    const eigen = await dateiLesen(new File([JSON.stringify(bund)], "bund.json"), p!);
    expect(eigen.art).toBe("meldung"); // Alias der eigenen Stelle
    const alsEingang = rolleSetzen(eigen, "eingang", p!);
    expect(alsEingang).toMatchObject({ art: "eingang", rolleGewaehlt: true });
    expect(alsEingang.meldung).toBe(eigen.meldung); // Original unverändert
    const land = await dateiLesen(new File([JSON.stringify(he)], "he.json"), p!);
    expect(rolleSetzen(land, "meldung", p!)).toMatchObject({ art: "meldung", rolleGewaehlt: true });
    expect(rolleSetzen(land, "eingang", p!)).toMatchObject({ art: "eingang", rolleGewaehlt: true });
    // Fremdes Schema: nur als Eingang
    const fremd = { schema: "Andere-v3", meldende_stelle: "Lagezentrum X", sachverhalte: [{ titel: "A" }] };
    expect(moeglicheRollen(fremd, p!)).toEqual({ eingang: { moeglich: true }, meldung: { moeglich: false, grund: "Schema passt nicht zum aktiven Profil" } });
    const fm = await dateiLesen(new File([JSON.stringify(fremd)], "f.json"), p!);
    const versucht = rolleSetzen(fm, "meldung", p!);
    expect(versucht.art).toBe("eingang");
    expect(versucht.hinweis).toMatch(/Gewählte Rolle nicht möglich \(Schema passt nicht/);
  });
  it("protokolliert gewählte Rollen im Lauf", async () => {
    const { rolleSetzen } = await import("../src/pipeline/material");
    const { profil: p } = await profil("lead-beispiel");
    const land = rolleSetzen(await dateiLesen(new File([JSON.stringify(he)], "he.json"), p!), "eingang", p!);
    const l = neuerLauf(p!, { sachverhalt: "x", stichworte: "", urls: [], stichtag: "2026-10-14", prueffrage: "" }, [
      { name: land.name, art: land.art, groesse: land.groesse, hash: land.hash, rolleGewaehlt: land.rolleGewaehlt },
    ]);
    expect(l.material[0]).toMatchObject({ art: "eingang", rolleGewaehlt: true });
  });
});
