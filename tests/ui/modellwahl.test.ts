// @vitest-environment jsdom
// Modell je Lauf abweichend von den Einstellungen; Laufprotokoll schon nach S1. Seit 0.5.22 nach den Vorschlägen zu
// „Modelle für diesen Lauf“ vom 25.10.2026 (Punkte 1–10, Freigabe des Herausgebers vom selben Tag). Soll als feste Texte.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profil } from "../support/dateien";
import { act } from "react";
import { aushaengen, bisWahr, einhaengen, eingeben, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";

const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));

/** Schlüssel mit Erkennungsmarke: darf in keinem Export auftauchen */
const SCHLUESSEL = "sk-test-NICHT-EXPORTIEREN-7f3a";

// Anbieter-Attrappe: merkt sich die angefragten Modelle und liefert einen S1-Vorschlag
const anfragen = vi.hoisted(() => ({ modelle: [] as string[], aufwand: [] as (string | undefined)[] }));
vi.mock("../../src/anbieter/verteiler", async (original) => {
  const echt: any = await original();
  class Verteiler {
    id = "attrappe";
    static fuer() {
      return new Verteiler();
    }
    async senden(a: { modell: string; aufwand?: string }) {
      anfragen.modelle.push(a.modell);
      anfragen.aufwand.push(a.aufwand);
      const text = JSON.stringify({
        gegenstand: "Sturmfolgen in Hessen",
        stichtag: "2026-10-14",
        referenzbezug: "Land Hessen",
        horizont: "bis 21.10.2026",
        sachverhalte: [{ titel: "Sturmfolgen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm" }],
        prueffrage: "",
        hinweise: "",
      });
      const { llmAntwort } = await import("../support/anbieter");
      return llmAntwort(text, { modell: a.modell });
    }
  }
  return { ...echt, Verteiler };
});

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: string }[] }));
vi.mock("../../src/speicher/speicher", async (original) => {
  const echt: any = await original();
  return { ...echt, dateiAnbieten: (inhalt: string, name: string) => downloads.liste.push({ name, inhalt: String(inhalt) }) };
});

beforeAll(reactUmgebung);
afterEach(async () => {
  await aushaengen();
  speicherLeeren(db);
  anfragen.modelle = [];
  anfragen.aufwand = [];
  downloads.liste = [];
});

type Schluessel = import("../../src/anbieter/verteiler").Schluessel;
const NUR_ANTHROPIC: Schluessel = { anthropic: SCHLUESSEL, openai: "", mistral: "", stelle: "" };
const ALLE: Schluessel = { anthropic: SCHLUESSEL, openai: "sk-oai", mistral: "sk-mis", stelle: "" };

/** KI-Erfassung zeigen; fertig, sobald die Modellwahl steht */
async function erfassungZeigen(schluessel: Schluessel = NUR_ANTHROPIC, zuEinstellungen: (b?: string) => void = () => {}) {
  const p = (await profil("lead-beispiel")).profil!;
  const { KiErfassung } = await import("../../src/ui/KiErfassung");
  await einhaengen(
    React.createElement(KiErfassung, {
      profil: p,
      einstellungen: STANDARD,
      schluessel,
      zuEinstellungen,
      uebernehmen: () => {},
    }),
  );
  await bisWahr(() => document.querySelector(".modellwahl fieldset") !== null);
  return p;
}
const radio = (wert: string) => document.querySelector(`.modellwahl input[type="radio"][value="${wert}"]`) as HTMLInputElement;
/** Wahl der Recherchetiefe (der Wert „einstellungen“ kommt auch beim KI-Profil vor) */
const tiefe = (wert: string) => document.querySelector(`.modellwahl-recherche input[type="radio"][value="${wert}"]`) as HTMLInputElement;
const profilWahl = (wert: string) => document.querySelector(`.modellwahl-profil input[type="radio"][value="${wert}"]`) as HTMLInputElement;
const radios = (klasse: string) => [...document.querySelectorAll(`.${klasse} input[type="radio"]`)].map((r) => (r as HTMLInputElement).value);
const gewaehlt = (klasse: string) => (document.querySelector(`.${klasse} input[type="radio"]:checked`) as HTMLInputElement | null)?.value;
const kopfzeile = () => document.querySelector(".modellwahl summary")!.textContent!;
/** „Einzeln anpassen“ wählen, damit die Felder je Stufe erscheinen */
const einzeln = () => klick(radio("einzeln"));
/** Auftrag eingeben, bestätigen und S1 starten; fertig, sobald der Vorschlag zur Bestätigung steht */
async function s1Starten() {
  await eingeben(document.querySelector("textarea") as HTMLTextAreaElement, "Orkan in Hessen");
  await klick(document.querySelector(".bestaetigung input") as HTMLInputElement);
  await klick(knopf("Gegenstand bestimmen (S1)"));
  await bisWahr(() => expect(seitentext()).toContain("Gegenstand bestätigen"));
  // Die Modellwahl für S2 erscheint wieder, sobald der Lauf auf die Bestätigung wartet
  await bisWahr(() => expect(radio("einzeln")).toBeTruthy());
}
const auswahl = (titel: string, feld = "Modell") =>
  [
    ...[...document.querySelectorAll(".modellwahl fieldset")]
      .find((f) => f.querySelector("legend")?.textContent?.startsWith(titel))!
      .querySelectorAll("label.feld"),
  ]
    .find((l) => l.textContent?.startsWith(feld))!
    .querySelector("select, input") as HTMLSelectElement & HTMLInputElement;
/** Eingabe zur sichtbaren Beschriftung (label for=…), oder null */
function feld(beschriftung: string): HTMLInputElement | null {
  const label = [...document.querySelectorAll(".modellwahl label")].find((l) => l.textContent?.trim() === beschriftung) as HTMLLabelElement | undefined;
  return label ? (document.getElementById(label.htmlFor) as HTMLInputElement) : null;
}
const beschreibung = (el: Element) =>
  (el.getAttribute("aria-describedby") || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() || `[fehlt: ${id}]`);
const verlassen = (el: HTMLElement) => act(async () => void el.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));

const WEBSUCHEN = "Websuchen je Recherche (höchstens)";
const SEITEN = "Seiten vollständig lesen je Recherche (höchstens)";
const LESEMENGE = "Lesemenge je Seite (höchstens, in Token)";

describe("KI-Erfassung", () => {
  it("Modell für S1 abweichend wählen, nach S1 Protokoll exportieren, S2-Modell vor dem Start änderbar", async () => {
    await erfassungZeigen();
    await einzeln();
    const s1 = auswahl("S1");
    // Punkt 1 und 4: Anzeigenamen, Kostenklasse, Vermerk; Modelle ohne Schlüssel sind gesperrt
    expect(s1.options[0].textContent).toBe("Wie in den Einstellungen: Haiku 5.5");
    const luna = [...s1.options].find((o) => o.value === "gpt-6-luna")!;
    expect(luna.textContent).toBe("GPT-6 Luna · Kosten niedrig · im Test vorn mit hoch – kein Schlüssel für OpenAI");
    expect(luna.disabled).toBe(true);
    expect([...s1.options].find((o) => o.value === "claude-opus-5-5")!.textContent).toBe("Opus 5.5 · Kosten hoch");

    await eingeben(s1, "claude-opus-5-5");
    expect(kopfzeile()).toContain("S1 Opus 5.5 (hoch)");
    expect(kopfzeile()).toContain("abweichend");

    await s1Starten();
    expect(anfragen.modelle).toEqual(["claude-opus-5-5"]);

    // Protokoll schon nach S1
    await bisWahr(() => knopf("Laufprotokoll exportieren (S1)") !== undefined);
    await klick(knopf("Laufprotokoll exportieren (S1)"));
    expect(downloads.liste).toHaveLength(1);
    // Der API-Schlüssel steht nie im Laufprotokoll
    expect(downloads.liste[0].inhalt).not.toContain(SCHLUESSEL);
    expect(downloads.liste[0].name).toMatch(/_KI-LEAD_Lauf_.+\.json$/);
    const protokoll = JSON.parse(downloads.liste[0].inhalt);
    expect(protokoll.stufen[0].modell).toBe("claude-opus-5-5");
    expect(protokoll.status).toBe("bestaetigen");

    // Vor S2 lässt sich das Modell für S2 noch ändern
    await einzeln();
    const s2 = auswahl("S2");
    expect(s2.value).toBe("");
    await eingeben(s2, "claude-fable-5-1");
    expect(kopfzeile()).toContain("S2 Fable 5.1");
  });

  it("AV-2026-W43-01, -02, Punkt 6: bei Mistral nur Stufen mit und ohne Nachdenken; die Anpassung beim Modellwechsel wird genannt", async () => {
    await erfassungZeigen(ALLE);
    await einzeln();
    await eingeben(auswahl("S1", "Aufwand"), "medium");
    await eingeben(auswahl("S1"), "mistral-small-2603");
    const a1 = auswahl("S1", "Aufwand");
    expect([...a1.options].map((o) => [o.value, o.textContent])).toEqual([
      ["", "Wie in den Einstellungen: hoch"],
      ["low", "niedrig – ohne Nachdenken"],
      ["high", "hoch – mit Nachdenken"],
    ]);
    expect(a1.value).toBe("high");
    expect(beschreibung(a1)).toEqual([
      "Wie lange das Modell vor der Antwort nachdenkt. Höher ist meist sorgfältiger, dauert aber länger und kostet mehr.",
      "Aufwand auf „hoch“ gesetzt: Mistral Small 4 bietet „mittel“ nicht an.",
      // Messwert S1 Mistral Small „hoch“: 10–50 s, bis 0,02 USD, dazu 10 % EU-Aufschlag
      "Voraussichtlich unter 1 Minute, bis 0,03 USD.",
    ]);
    expect(kopfzeile()).toContain("S1 Mistral Small 4 (hoch)");
    // Die nächste Wahl im Feld löst den Hinweis
    await eingeben(a1, "low");
    expect(beschreibung(auswahl("S1", "Aufwand"))).toHaveLength(2);
  });

  it("Aufwand je Stufe und Recherchetiefe für einen Lauf wählen", async () => {
    await erfassungZeigen();
    await einzeln();
    const a1 = auswahl("S1", "Aufwand");
    expect(a1.options[0].textContent).toBe("Wie in den Einstellungen: hoch");
    expect([...a1.options].map((o) => o.value)).toEqual(["", "low", "medium", "high", "xhigh", "max"]);
    await eingeben(a1, "low");
    await eingeben(auswahl("S2", "Aufwand"), "high");
    // Punkt 8: Recherchetiefe wie unter „Recherche & Grenzen“; die Stufe der Einstellungen steht nur einmal da
    expect(radios("modellwahl-recherche")).toEqual(["einstellungen", "sparsam", "gruendlich", "eigen"]);
    expect(gewaehlt("modellwahl-recherche")).toBe("einstellungen");
    expect(tiefe("einstellungen").closest("label")!.textContent).toBe("Wie in den EinstellungenStandard (15 Websuchen, 10 Seiten, 15.000 Token je Seite)");
    await klick(radio("eigen"));
    expect([feld(WEBSUCHEN)!.value, feld(SEITEN)!.value, feld(LESEMENGE)!.value]).toEqual(["15", "10", "15000"]);
    await eingeben(feld(WEBSUCHEN)!, "5");
    const zusammenfassung = kopfzeile();
    expect(zusammenfassung).toContain("S1 Haiku 5.5 (niedrig)");
    expect(zusammenfassung).toContain("S2 Opus 5.5 (hoch)");
    expect(zusammenfassung).toContain("Recherche eigene Werte (bis 5 Websuchen)");
    expect(seitentext()).toContain("S2: Recherche durchführen (Websuche bis zu 5-mal, Seitenabruf bis zu 10-mal).");
    // Schätzung folgt dem gewählten Aufwand (S2 Opus „high“ ohne Messwert)
    expect(document.querySelector(".laufschaetzung")!.textContent).toContain("S2 (claude-opus-5-5, high)");

    await s1Starten();
    expect(anfragen.aufwand).toEqual(["low"]);
    // nach S1 bleibt die Wahl erhalten und gilt für S2
    await einzeln();
    expect(auswahl("S2", "Aufwand").value).toBe("high");
    expect(gewaehlt("modellwahl-recherche")).toBe("eigen");
    expect(feld(WEBSUCHEN)!.value).toBe("5");
    expect(seitentext()).toContain("S2: Recherche durchführen (Websuche bis zu 5-mal, Seitenabruf bis zu 10-mal).");
    // KP-2026-W43-74 auch je Lauf: ein geleertes Feld behält den bisherigen Wert
    await eingeben(feld(WEBSUCHEN)!, "");
    await verlassen(feld(WEBSUCHEN)!);
    expect(feld(WEBSUCHEN)!.value).toBe("5");
    // „Wie in den Einstellungen“ setzt die Recherche zurück
    await klick(tiefe("einstellungen"));
    expect(kopfzeile()).toContain(`Recherche Standard (bis ${STANDARD.websucheMax} Websuchen)`);
  });
});

describe("Punkte 1, 2, 7, 9, 10: Kopfzeile, Rahmen, S3, Zurücksetzen", () => {
  it("Kopfzeile mit Anzeigenamen und Schätzung, ohne S3; Schalter und Schätzung im Rahmen vor der Bestätigung", async () => {
    await erfassungZeigen();
    expect(document.querySelector(".modellwahl-titel")!.textContent).toBe("Modelle und Recherche für diesen Lauf");
    // S1 Haiku „hoch“ 15–150 s, 0–0,03 USD; S2 Erfassung Opus „mittel“ 200–360 s, 1,40–2,30 USD
    expect(document.querySelector(".modellwahl-kurz")!.textContent!.trim()).toBe(
      "S1 Haiku 5.5 (hoch) · S2 Opus 5.5 (mittel) · Recherche Standard (bis 15 Websuchen) · Orientierung 1 Suche je Sachverhalt · ≈ 3–9 Minuten, 1,40–2,33 USD",
    );
    expect(kopfzeile()).not.toContain("abweichend");
    // Punkt 9: Schalter zuerst im Rahmen, Schätzung im Rahmen, Bestätigung danach
    const rahmen = document.querySelector(".modellwahl")!;
    expect(rahmen.firstElementChild!.textContent).toContain("Recherche durchführen");
    expect(rahmen.querySelector(".laufschaetzung")).not.toBeNull();
    expect(rahmen.compareDocumentPosition(document.querySelector(".bestaetigung")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Punkt 7: S3 unter „Weitere Stufe“
    await einzeln();
    expect(document.querySelector(".modellwahl-weitere > summary")!.textContent).toBe(
      "Weitere Stufe: S3 Reparatur (nur bei Schemafehlern) · Haiku 5.5 (niedrig)",
    );
    expect((document.querySelector(".modellwahl-weitere") as HTMLDetailsElement).open).toBe(false);
  });

  it("ohne Websuche: Kopfzeile nennt es, keine Recherchetiefe", async () => {
    await erfassungZeigen();
    await klick(document.querySelector(".modellwahl .schalter input") as HTMLInputElement);
    expect(kopfzeile()).toContain("ohne Recherche");
    expect(document.querySelector(".modellwahl-recherche")).toBeNull();
  });

  it("Punkt 10: abweichende Stufe gekennzeichnet; „Alles wie in den Einstellungen“ und „Vorgaben dauerhaft ändern“", async () => {
    const bereiche: (string | undefined)[] = [];
    await erfassungZeigen(NUR_ANTHROPIC, (b) => bereiche.push(b));
    await einzeln();
    await eingeben(auswahl("S2"), "claude-sonnet-5-5");
    const s2 = auswahl("S2").closest("fieldset")!;
    expect(s2.classList.contains("abweichend")).toBe(true);
    expect(s2.querySelector("legend")!.textContent).toBe("S2 Recherche und Entwurfabweichend");
    expect(auswahl("S1").closest("fieldset")!.classList.contains("abweichend")).toBe(false);
    await klick("Alles wie in den Einstellungen");
    expect(kopfzeile()).not.toContain("abweichend");
    expect(knopf("Alles wie in den Einstellungen")).toBeUndefined();
    await klick("Vorgaben dauerhaft ändern");
    expect(bereiche).toEqual(["modelle"]);
  });
});

describe("Punkte 3 und 5: KI-Profil je Lauf und zusätzliche Anbieter", () => {
  it("Profile ohne Schlüssel sind gesperrt", async () => {
    await erfassungZeigen();
    expect(radios("modellwahl-profil")).toEqual(["einstellungen", "anthropic", "openai", "mistral", "ollama", "mix-opus", "mix-sonnet", "einzeln"]);
    expect(gewaehlt("modellwahl-profil")).toBe("einstellungen");
    expect(radio("openai").disabled).toBe(true);
    expect(radio("openai").closest("label")!.textContent).toContain("Braucht einen Schlüssel für OpenAI.");
    expect(radio("mix-opus").disabled).toBe(true);
    // Ohne „Einzeln anpassen“ keine Felder je Stufe
    expect(document.querySelector(".modellwahl-stufe")).toBeNull();
  });

  it("ein Mix-Profil setzt alle Stufen, nennt den zusätzlichen Anbieter und gilt im Lauf", async () => {
    await erfassungZeigen(ALLE);
    await klick(radio("mix-opus"));
    expect(gewaehlt("modellwahl-profil")).toBe("mix-opus");
    expect(radio("mix-opus").closest("label")!.textContent).toContain("S1 GPT-6 Luna (hoch) · S2 Opus 5.5 (mittel) · S3 Haiku 5.5 (niedrig)");
    expect(kopfzeile()).toContain("S1 GPT-6 Luna (hoch) · S2 Opus 5.5 (mittel)");
    expect(kopfzeile()).toContain("abweichend");
    expect(document.querySelector(".modellwahl [role=status]")!.textContent).toContain("In diesem Lauf gehen Inhalte zusätzlich an OpenAI.");
    expect(document.querySelector(".bestaetigung")!.textContent).toContain("OpenAI");
    await s1Starten();
    expect(anfragen.modelle).toEqual(["gpt-6-luna"]);
    expect(anfragen.aufwand).toEqual(["high"]);
  });

  it("„Wie in den Einstellungen“ hebt das Profil wieder auf", async () => {
    await erfassungZeigen(ALLE);
    await klick(radio("openai"));
    expect(kopfzeile()).toContain("S1 GPT-6 Luna (hoch) · S2 GPT-6 Astra (hoch)");
    await klick(profilWahl("einstellungen"));
    expect(gewaehlt("modellwahl-profil")).toBe("einstellungen");
    expect(kopfzeile()).toContain("S1 Haiku 5.5 (hoch) · S2 Opus 5.5 (mittel)");
    expect(kopfzeile()).not.toContain("abweichend");
    expect(document.querySelector(".modellwahl [role=status]")).toBeNull();
  });
});

describe("Punkt 8: Recherchetiefe je Lauf", () => {
  it("eine Stufe setzt alle drei Werte; Höchstkosten folgen ihr", async () => {
    await erfassungZeigen();
    expect(document.querySelector(".modellwahl .recherche-kosten")!.textContent).toContain(
      "Mit claude-opus-5-5 kosten Suchen und Seitenlesen höchstens etwa 0,75 USD",
    );
    await klick(radio("gruendlich"));
    expect(seitentext()).toContain("S2: Recherche durchführen (Websuche bis zu 30-mal, Seitenabruf bis zu 20-mal).");
    // 30 × 0,01 USD + 20 Seiten × 30 000 Token × 4 USD je Million
    expect(document.querySelector(".modellwahl .recherche-kosten")!.textContent).toContain("höchstens etwa 2,70 USD");
    expect(kopfzeile()).toContain("Recherche Gründlich (bis 30 Websuchen)");
  });

  it("Felder ohne Wirkung beim S2-Modell sind gesperrt; Mistral über den EU-Endpunkt recherchiert nicht", async () => {
    await erfassungZeigen(ALLE);
    await einzeln();
    await eingeben(auswahl("S2"), "gpt-6.1-sol");
    await klick(radio("eigen"));
    expect(feld(LESEMENGE)!.disabled).toBe(true);
    expect(beschreibung(feld(LESEMENGE)!).at(-1)).toBe("Bei den gewählten Modellen ohne Wirkung.");
    expect(feld(WEBSUCHEN)!.disabled).toBe(false);

    await eingeben(auswahl("S2"), "mistral-medium-3-5");
    expect(document.querySelector(".modellwahl-recherche")).toBeNull();
    expect(seitentext()).toContain("Mit Mistral Medium 3.5 über den EU-Endpunkt von Mistral recherchiert S2 nicht im Web");
    expect(kopfzeile()).toContain("ohne Websuche");
  });
});
