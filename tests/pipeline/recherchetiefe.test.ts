// Recherchetiefe (seit 0.5.19): Stufen, Prüfung getippter Werte, Umrechnung der Lesemenge, Höchstkosten, Wirkung je Anbieter.
// Befunde KP-2026-W43-69 bis -76 (Prüfung „Recherche & Grenzen“ vom 25.10.2026, Herausgeber-Freigabe vom selben Tag).
// Soll als feste Werte; Kosten nach den Listenpreisen der Tabelle (claude-opus-5-5: 4 USD je Million Eingabetoken,
// Websuche 0,01 USD; gpt-6.1-sol: 0,01 USD je Werkzeugaufruf; mistral-medium-3-5: 0,03 USD je Suche).
import { describe, expect, it } from "vitest";
import { STANDARD } from "../../src/pipeline/einstellungen";
import {
  hoechstkostenText,
  lesemengeText,
  pruefeEingabe,
  RECHERCHE_GRENZEN,
  RECHERCHE_STUFEN,
  stufeVon,
  wirkungText,
  type RechercheFeld,
} from "../../src/pipeline/recherchetiefe";

const werte = (id: string) => RECHERCHE_STUFEN.find((s) => s.id === id)!.werte;

describe("KP-2026-W43-69: Stufen der Recherchetiefe", () => {
  it("haben die vorläufig festgelegten Werte; Standard entspricht den Vorgaben der App", () => {
    expect(RECHERCHE_STUFEN.map((s) => [s.id, s.werte])).toEqual([
      ["sparsam", { websucheMax: 5, abrufMax: 3, abrufMaxTokens: 8000 }],
      ["standard", { websucheMax: 15, abrufMax: 10, abrufMaxTokens: 15000 }],
      ["gruendlich", { websucheMax: 30, abrufMax: 20, abrufMaxTokens: 30000 }],
    ]);
    expect(werte("standard")).toEqual({ websucheMax: STANDARD.websucheMax, abrufMax: STANDARD.abrufMax, abrufMaxTokens: STANDARD.abrufMaxTokens });
  });

  it("liegen innerhalb der zulässigen Bereiche", () => {
    for (const s of RECHERCHE_STUFEN)
      for (const feld of Object.keys(s.werte) as RechercheFeld[]) {
        expect(s.werte[feld], `${s.id}/${feld}`).toBeGreaterThanOrEqual(RECHERCHE_GRENZEN[feld].min);
        expect(s.werte[feld], `${s.id}/${feld}`).toBeLessThanOrEqual(RECHERCHE_GRENZEN[feld].max);
      }
  });

  it.each([
    ["Vorgaben der App", { websucheMax: 15, abrufMax: 10, abrufMaxTokens: 15000 }, "standard"],
    ["Werte von Gründlich", { websucheMax: 30, abrufMax: 20, abrufMaxTokens: 30000 }, "gruendlich"],
    ["ein Wert abweichend", { websucheMax: 15, abrufMax: 10, abrufMaxTokens: 16000 }, "eigen"],
    ["Seiten nie kürzen", { websucheMax: 15, abrufMax: 10, abrufMaxTokens: 0 }, "eigen"],
  ])("ergeben sich aus den gespeicherten Werten: %s", (_, w, soll) => {
    expect(stufeVon(w)).toBe(soll);
  });
});

describe("KP-2026-W43-74/-75: Prüfung getippter Werte", () => {
  it.each([
    ["gültige Zahl", "websucheMax", "7", 15, { wert: 7, fertig: true }],
    ["0 schaltet ab", "websucheMax", "0", 15, { wert: 0, fertig: true }],
    [
      "leer: bisheriger Wert bleibt",
      "websucheMax",
      "  ",
      15,
      { wert: 15, fertig: false, hinweis: "Kein Wert eingegeben; der bisherige Wert 15 bleibt. Für keine Websuche 0 eingeben." },
    ],
    [
      "leer bei Seiten",
      "abrufMax",
      "",
      10,
      { wert: 10, fertig: false, hinweis: "Kein Wert eingegeben; der bisherige Wert 10 bleibt. Für keinen Seitenabruf 0 eingeben." },
    ],
    ["über dem Höchstwert", "websucheMax", "500", 15, { wert: 50, fertig: false, hinweis: "Höchstens 50; auf 50 gesetzt." }],
    ["unter dem Mindestwert", "abrufMax", "-1", 10, { wert: 0, fertig: false, hinweis: "Mindestens 0; auf 0 gesetzt." }],
    // kaufmännisch gerundet: 2,5 → 3
    ["Komma", "abrufMax", "2,5", 10, { wert: 3, fertig: false, hinweis: "Nur ganze Zahlen; auf 3 gerundet." }],
    ["Lesemenge über 100.000", "abrufMaxTokens", "200000", 15000, { wert: 100000, fertig: false, hinweis: "Höchstens 100.000; auf 100.000 gesetzt." }],
    ["Lesemenge 0 nur über das Kästchen", "abrufMaxTokens", "0", 15000, { wert: 1000, fertig: false, hinweis: "Mindestens 1.000; auf 1.000 gesetzt." }],
    ["keine Zahl", "websucheMax", "abc", 15, { wert: 15, fertig: false, hinweis: "Keine Zahl; der bisherige Wert 15 bleibt." }],
  ] as const)("%s", (_, feld, roh, bisher, soll) => {
    expect(pruefeEingabe(feld, roh, bisher)).toEqual(soll);
  });
});

describe("KP-2026-W43-71: Umrechnung der Lesemenge", () => {
  it.each([
    [8000, "≈ rund 4.000 Wörter, etwa 10 Druckseiten"],
    [15000, "≈ rund 7.500 Wörter, etwa 19 Druckseiten"],
    [30000, "≈ rund 15.000 Wörter, etwa 38 Druckseiten"],
    [1000, "≈ rund 500 Wörter, etwa 1 Druckseite"],
  ])("%i Token", (token, soll) => {
    expect(lesemengeText(token)).toBe(soll);
  });
});

describe("KP-2026-W43-72: Höchstkosten für Suchen und Seitenlesen", () => {
  const STAND = /Listenpreise, Stand .+\.$/;
  it.each([
    ["sparsam", "0,15 USD"],
    ["standard", "0,75 USD"],
    ["gruendlich", "2,70 USD"],
  ])("Anthropic Opus 5.5, Stufe %s: %s", (id, betrag) => {
    const text = hoechstkostenText("claude-opus-5-5", { ...werte(id), mistralEndpunkt: "eu" })!;
    expect(text).toContain(`Mit claude-opus-5-5 kosten Suchen und Seitenlesen höchstens etwa ${betrag}, dazu Trefferlisten, Material und Schreiben.`);
    expect(text).toMatch(STAND);
  });

  it("Anthropic ohne Längengrenze: nur die Suchen sind beziffert", () => {
    expect(hoechstkostenText("claude-opus-5-5", { websucheMax: 15, abrufMax: 10, abrufMaxTokens: 0, mistralEndpunkt: "eu" })).toContain(
      "kosten die Suchen höchstens etwa 0,15 USD, dazu Seiten ohne Längengrenze",
    );
  });

  it("OpenAI: Gebühren je Werkzeugaufruf, Seitenlänge unbegrenzt", () => {
    expect(hoechstkostenText("gpt-6.1-sol", { ...werte("standard"), mistralEndpunkt: "eu" })).toContain(
      "Mit gpt-6.1-sol kosten Suchen und geöffnete Seiten höchstens etwa 0,25 USD, dazu die gelesenen Seiten",
    );
  });

  it("Mistral: global nur Suchen ohne Begrenzung, EU ohne Recherche", () => {
    expect(hoechstkostenText("mistral-medium-3-5", { ...werte("standard"), mistralEndpunkt: "global" })).toContain(
      "Mit mistral-medium-3-5 kosten 15 Suchen etwa 0,45 USD; Mistral begrenzt die Zahl der Suchen nicht.",
    );
    expect(hoechstkostenText("mistral-medium-3-5", { ...werte("standard"), mistralEndpunkt: "eu" })).toBe(
      "Mit mistral-medium-3-5 recherchiert S2 nicht im Web; Suchen und Seitenlesen kosten nichts.",
    );
  });

  it("Modell ohne Preis: keine Zeile", () => {
    expect(hoechstkostenText("unbekanntes-modell", { ...werte("standard"), mistralEndpunkt: "eu" })).toBeNull();
  });
});

describe("KP-2026-W43-73: Wirkung je Anbieter", () => {
  it.each([
    ["websucheMax", ["anthropic"], "eu", "Bei den gewählten Modellen: Anthropic begrenzt die Suchen."],
    [
      "websucheMax",
      ["openai", "mistral"],
      "global",
      "Bei den gewählten Modellen: OpenAI begrenzt Suchen und geöffnete Seiten zusammen; Mistral zählt die Suchen nur, begrenzt sie nicht.",
    ],
    ["websucheMax", ["mistral"], "eu", "Bei den gewählten Modellen ohne Wirkung."],
    ["abrufMax", ["openai"], "eu", "Bei den gewählten Modellen: OpenAI zählt die Seiten zur gemeinsamen Höchstzahl mit den Suchen."],
    ["abrufMax", ["mistral"], "global", "Bei den gewählten Modellen ohne Wirkung."],
    ["abrufMaxTokens", ["anthropic", "openai"], "eu", "Bei den gewählten Modellen: Anthropic kürzt längere Seiten; bei OpenAI ohne Wirkung."],
    ["abrufMaxTokens", ["openai"], "eu", "Bei den gewählten Modellen ohne Wirkung."],
  ] as const)("%s bei %j (%s)", (feld, anbieter, endpunkt, soll) => {
    expect(wirkungText(feld, [...anbieter], endpunkt)).toBe(soll);
  });
});
