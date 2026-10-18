import { fehlendeEingangsquellen } from "../src/pipeline/vermerke";
import { describe, expect, it } from "vitest";
import { jsonDateien, profil } from "./hilfen";
import { STANDARD } from "../src/pipeline/einstellungen";
import { neuerLauf, type Lauf } from "../src/pipeline/lauf";
import { stufe1, stufe2und3, type Kontext } from "../src/pipeline/stufen";
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
    expect(sopsFuerArten(p!, ["Unwetter / Sturm", "Stromausfall / Blackout"])).toEqual(["sop-01", "sop-08"]);
    const schema: any = s1Schema(p!);
    expect(schema.properties.sachverhalte.items.properties.sops.items.enum).toHaveLength(17);
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
    expect(v.sachverhalte[0].sops).toEqual(["sop-01"]); // unbekannte Kennung entfernt
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
    expect(e.meldung!._entstehung.sop).toEqual(["SOP-LEAD 01 Unwetter / Sturm v0.4"]);
    expect(e.kurzantwort).toBe("Kernaussage: Folgen weitgehend behoben.");
    expect(k.lauf.status).toBe("fertig");
    expect(k.lauf.ergebnis?.schemakonform).toBe(true);
    expect(k.lauf.ergebnis?.fundstellen).toHaveLength(1);
    const anf = att.anfragen[0];
    expect(anf.werkzeuge?.websuche?.maxUses).toBe(15);
    expect(anf.system[0].cache).toBe(true);
    expect(anf.system[1].text).toContain("SOP-LEAD 01 Unwetter / Sturm");
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
    expect(k.lauf.ergebnis!.befunde.some((b) => /Im Quellenverzeichnis nicht erkennbar/.test(b.text))).toBe(false);
    expect(fehlendeEingangsquellen(eingaenge, { ...bund, quellen: "[Q1] A – Hessisches Ministerium des Innern (FIKTIV)" }, p!)).toHaveLength(5);
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
