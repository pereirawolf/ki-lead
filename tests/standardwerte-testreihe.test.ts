// Änderungen aus der Testreihe der KI-Modelle vom 20.10.2026 (0.4.21): Vorgaben, Radar-Umhängung,
// Warnung bei gescheitertem Abruf der Auftrags-URL, Kennsätze im Fließtext, Schätzung von Dauer und Kosten.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { jsonDateien, profil } from "./hilfen";
import { APP_MODELLE, modellFuer, STANDARD } from "../src/pipeline/einstellungen";
import { neuerLauf, type Lauf } from "../src/pipeline/lauf";
import { auftragsAbrufFehler, nachbearbeiten, radarUmhaengen, stufe2und3, type Kontext } from "../src/pipeline/stufen";
import { leereNutzung, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "../src/anbieter/typen";
import { pruefeGegenSchema } from "../src/kern/validierung";
import { ausfuellHinweise, kennsaetzeImFliesstext } from "../src/kern/kennsaetze";
import { dauerText, kostenText, MESSWERTE, schaetzeStufe, summe } from "../src/pipeline/schaetzung";
import { LaufSchaetzung } from "../src/ui/LaufSchaetzung";

const ilka = jsonDateien("../profile/lead-beispiel/beispiele/orkantief-ilka");
const he = ilka.find((x) => x.name.includes("_HE_"))!.daten;
const URL_AUFTRAG = "https://beispiel.invalid/lage";

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
  gegenstand: "Sturmfolgen Hessen",
  stichtag: "2026-10-14",
  meldezeitpunkt: "2026-10-14T14:00",
  referenzbezug: "Land Hessen",
  horizont: "bis 21.10.2026",
  sachverhalte: [{ titel: "Sturmfolgen Hessen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm" }],
  prueffrage: "",
  hinweise: "",
};

async function kontext(anbieter: LlmAnbieter): Promise<{ k: Kontext; protokolle: Lauf[] }> {
  const { profil: p } = await profil("lead-beispiel");
  const lauf = neuerLauf(p!, { sachverhalt: "Orkan", stichworte: "", urls: [URL_AUFTRAG], stichtag: "2026-10-14", prueffrage: "" }, []);
  const protokolle: Lauf[] = [];
  return {
    k: {
      profil: p!,
      anbieter,
      einstellungen: STANDARD,
      lauf,
      material: [],
      aktualisiert: (l) => void protokolle.push(structuredClone(l)),
      jetzt: () => new Date("2026-10-14T14:00:00+02:00"),
    },
    protokolle,
  };
}

/** Beispielmeldung mit dem Radar eine Ebene zu hoch, wie in 4 von 13 Entwürfen der Testreihe */
function mitRadarZuHoch(): any {
  const m = structuredClone(he);
  m.sachverhalte[0].lagenradar = m.sachverhalte[0].sofort.lagenradar;
  delete m.sachverhalte[0].sofort.lagenradar;
  return m;
}

describe("Vorgaben nach der Testreihe", () => {
  it("Erfassung mit Opus in App und Beispielprofil, S1 bleibt Haiku mit hohem Aufwand", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(APP_MODELLE.erfassung).toBe("claude-opus-5-5");
    expect(p!.manifest.modelle?.erfassung).toBe("claude-opus-5-5");
    expect(modellFuer("erfassung", STANDARD, p!)).toBe("claude-opus-5-5");
    expect(STANDARD.aufwand.erfassung).toBe("medium");
    expect(modellFuer("vorverarbeitung", STANDARD, p!)).toBe("claude-haiku-5-5");
    expect(STANDARD.aufwand.vorverarbeitung).toBe("high");
    // eine Wahl in den Einstellungen geht weiter vor
    expect(modellFuer("erfassung", { ...STANDARD, modelle: { ...STANDARD.modelle, erfassung: "claude-sonnet-5-5" } }, p!)).toBe("claude-sonnet-5-5");
  });
});

describe("Lagenradar an der vorgesehenen Stelle", () => {
  it("verschiebt ein eine Ebene zu hoch abgelegtes Radar und meldet es", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = mitRadarZuHoch();
    const radar = structuredClone(d.sachverhalte[0].lagenradar);
    const meldungen: string[] = [];
    radarUmhaengen(d, p!, meldungen);
    expect(d.sachverhalte[0].sofort.lagenradar).toEqual(radar);
    expect("lagenradar" in d.sachverhalte[0]).toBe(false);
    expect(meldungen).toEqual(["Sachverhalt 1: Lagenradar von „lagenradar“ nach „sofort.lagenradar“ verschoben"]);
  });

  it("überschreibt keinen vorhandenen Radarwert und lässt Nicht-Objekte stehen", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const d = structuredClone(he);
    d.sachverhalte[0].lagenradar = { d1: 6 };
    const vorher = structuredClone(d.sachverhalte[0].sofort.lagenradar);
    const meldungen: string[] = [];
    radarUmhaengen(d, p!, meldungen);
    expect(d.sachverhalte[0].sofort.lagenradar).toEqual(vorher);
    expect(d.sachverhalte[0].lagenradar).toEqual({ d1: 6 });
    const e = mitRadarZuHoch();
    e.sachverhalte[0].lagenradar = "4,4,2";
    radarUmhaengen(e, p!, meldungen);
    expect(e.sachverhalte[0].sofort.lagenradar).toBeUndefined();
    expect(meldungen).toEqual([]);
  });

  it("die Nachbearbeitung macht den Entwurf ohne Reparaturaufruf schemakonform", async () => {
    const att = new Attrappe([antwort("Kurz.\n```json\n" + JSON.stringify(mitRadarZuHoch()) + "\n```")]);
    const { k } = await kontext(att);
    k.lauf.auftrag.websuche = false;
    const e = await stufe2und3(k, VORSCHLAG as any);
    expect(att.anfragen).toHaveLength(1);
    expect(e.schemaBefunde).toEqual([]);
    expect(e.befunde.some((b) => b.stufe === "hinweis" && /Von der App korrigiert: Sachverhalt 1: Lagenradar/.test(b.text))).toBe(true);
    const m = nachbearbeiten(mitRadarZuHoch(), k, "x");
    expect(pruefeGegenSchema(k.profil.schema, m, k.profil.ui)).toEqual([]);
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
    const ok = antwort("Kurz.\n```json\n" + JSON.stringify(he) + "\n```", { abrufFehler: [{ url: URL_AUFTRAG + "/", code: "url_not_allowed" }] });
    const att = new Attrappe([ok]);
    const { k } = await kontext(att);
    const e = await stufe2und3(k, VORSCHLAG as any);
    const w = e.befunde.find((b) => b.stufe === "warnung" && /Seite aus dem Auftrag konnte nicht abgerufen werden/.test(b.text));
    expect(w?.text).toContain("url_not_allowed");
    expect(w?.text).toContain("als PDF oder Text beifügen");
  });

  it("warnt nicht bei Abruffehlern anderer Seiten", async () => {
    const att = new Attrappe([
      antwort("Kurz.\n```json\n" + JSON.stringify(he) + "\n```", { abrufFehler: [{ url: "https://andere.invalid", code: "unavailable" }] }),
    ]);
    const { k } = await kontext(att);
    const e = await stufe2und3(k, VORSCHLAG as any);
    expect(e.befunde.some((b) => /Seite aus dem Auftrag/.test(b.text))).toBe(false);
  });
});

describe("Kennsätze im Fließtext", () => {
  const ks = ["Neubewertung bei:", "Handlungsrelevant bis:"];
  it("erkennt Kennsätze mitten in einer Zeile", () => {
    expect(kennsaetzeImFliesstext("D8 offen: keine Beobachtungsbasis. Neubewertung bei: Fall in Deutschland", ks)).toEqual(["Neubewertung bei:"]);
    expect(kennsaetzeImFliesstext("Text\nNeubewertung bei: Fall in Deutschland", ks)).toEqual([]);
    expect(kennsaetzeImFliesstext("Siehe Neubewertung bei: unten\nNeubewertung bei: Fall", ks)).toEqual([]);
    expect(kennsaetzeImFliesstext("", ks)).toEqual([]);
  });

  it("meldet sie als Ausfüllhinweis", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const m = structuredClone(he);
    m.sachverhalte[0].sofort.bewertung_text = "Kernaussage: Lage ruhig. Neubewertung bei: erneuter Sturmwarnung";
    const h = ausfuellHinweise(m, p!.ui);
    expect(h.some((b) => /„Neubewertung bei:“ steht im Fließtext/.test(b.text))).toBe(true);
  });
});

describe("Schätzung von Dauer und Kosten", () => {
  it("nutzt Messwerte für gemessene Kombinationen", () => {
    const s = schaetzeStufe("erfassung", "claude-opus-5-5", "medium");
    expect(s).toEqual({ sekunden: [200, 360], usd: [1.4, 2.3], gemessen: true });
    expect(dauerText(s.sekunden)).toBe("3–6 Minuten");
    expect(kostenText(s.usd)).toBe("1,40–2,30 USD");
    expect(dauerText(schaetzeStufe("s1", "claude-haiku-5-5", "high").sekunden)).toBe("unter 1 Minute");
    expect(kostenText(schaetzeStufe("s1", "claude-haiku-5-5", "high").usd)).toBe("bis 0,02 USD");
    expect(dauerText(schaetzeStufe("erfassung", "claude-sonnet-5-5", "medium").sekunden)).toBe("bis 3 Minuten");
  });

  it("rechnet nicht gemessene Modelle über den Preis hoch, ohne Dauer", () => {
    const f = schaetzeStufe("erfassung", "claude-fable-5-1", "medium");
    expect(f.gemessen).toBe(false);
    expect(f.sekunden).toBeNull();
    // Fable kostet je Ausgabetoken das 2,5-Fache von Opus
    expect(f.usd![0]).toBeCloseTo(1.4 * 2.5);
    expect(f.usd![1]).toBeCloseTo(2.3 * 2.5);
    // nicht gemessener Aufwand: Basis „medium“, Obergrenze verdoppelt
    const hoch = schaetzeStufe("erfassung", "claude-opus-5-5", "high");
    expect(hoch.usd).toEqual([1.4, 4.6]);
    expect(schaetzeStufe("erfassung", "unbekannt-1", "medium")).toEqual({ sekunden: null, usd: null, gemessen: false });
    expect(dauerText(null)).toBe("Dauer ohne Messwert");
    expect(
      summe([
        [0, 0.02],
        [1.4, 2.3],
      ]),
    ).toEqual([1.4, 2.32]);
    expect(summe([[0, 0.02], null])).toBeNull();
  });

  it("enthält nur Modelle mit Preisangabe und plausible Spannen", () => {
    for (const [k, m] of Object.entries(MESSWERTE)) {
      expect(k.split("|")).toHaveLength(3);
      expect(m.sekunden[0]).toBeLessThan(m.sekunden[1]);
      expect(m.usd[0]).toBeLessThan(m.usd[1]);
    }
  });

  it("zeigt die Schätzung je Stufe nach Modell und Aufwand an", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const html = renderToStaticMarkup(
      createElement(LaufSchaetzung, {
        stufen: [
          { kurz: "S1", rolle: "vorverarbeitung", art: "s1" },
          { kurz: "S2", rolle: "erfassung", art: "erfassung" },
        ],
        einstellungen: STANDARD,
        profil: p!,
      }),
    );
    expect(html).toContain("S1 (claude-haiku-5-5, high): unter 1 Minute, bis 0,02 USD");
    expect(html).toContain("S2 (claude-opus-5-5, medium): 3–6 Minuten, 1,40–2,30 USD");
    expect(html).toContain("Zusammen etwa 1,40–2,32 USD");
  });
});
