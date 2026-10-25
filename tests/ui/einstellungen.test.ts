// @vitest-environment jsdom
// Einstellungen in Bereichen (seit 0.5.6): Navigation, Übersicht, Voreinstellung unter „Modelle & Verarbeitung“,
// Grenzen, unverändertes Speicherverhalten. Vorher (0.4.26): Höchstzahl Ausgabetoken gilt für jeden KI-Aufruf.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { profilPflicht } from "../support/dateien";
import { aushaengen, einhaengen, eingeben, klick, knopf, reactUmgebung } from "../support/dom";
import { STANDARD, STANDARD_PROFILE, type Einstellungen } from "../../src/pipeline/einstellungen";
import { EinstellungenAnsicht, type EinstellungsBereich } from "../../src/ui/Einstellungen";
import type { AnbieterId, Schluessel } from "../../src/anbieter/verteiler";
import type { Profil } from "../../src/kern/typen";
import { aufloesen } from "../../src/darstellung/thema";

beforeAll(reactUmgebung);
afterEach(async () => {
  vi.restoreAllMocks();
  await aushaengen();
});

const OHNE_SCHLUESSEL: Schluessel = { anthropic: "", openai: "", mistral: "" };

/** Bereichsnamen in der Reihenfolge der Navigation (fest, unabhängig von der Implementierung) */
const BEREICHE = ["Übersicht", "KI-Anbieter & API", "Modelle & Verarbeitung", "Recherche & Grenzen", "Darstellung", "Über KI-LEAD"];

/** Ansicht mit eigenem Zustand, damit Änderungen wie in der App sofort wirken */
function MitZustand({
  start,
  gesetzt,
  profil = null,
  schluessel = OHNE_SCHLUESSEL,
  schluesselGesetzt,
  bereich,
  mitFarben = true,
}: {
  start: Einstellungen;
  gesetzt: Einstellungen[];
  profil?: Profil | null;
  schluessel?: Schluessel;
  schluesselGesetzt?: [AnbieterId, string][];
  bereich?: { wert: EinstellungsBereich; setzen: (b: EinstellungsBereich) => void };
  mitFarben?: boolean;
}) {
  const [e, setE] = React.useState(start);
  return React.createElement(EinstellungenAnsicht, {
    profil,
    einstellungen: e,
    setEinstellungen: (neu: Einstellungen) => {
      gesetzt.push(neu);
      setE(neu);
    },
    schluessel,
    setSchluessel: (id: AnbieterId, w: string) => void schluesselGesetzt?.push([id, w]),
    ...(mitFarben ? { farben: { auswahl: "automatisch", setAuswahl: () => {}, thema: aufloesen("automatisch"), speichern: async () => {} } } : {}),
    ...(bereich ? { bereich: bereich.wert, setBereich: bereich.setzen } : {}),
  });
}

const nav = () => document.querySelector('nav[aria-label="Bereiche der Einstellungen"]') as HTMLElement;
const navKnoepfe = () => [...nav().querySelectorAll("button")];
const ueberschriften = () => [...document.querySelectorAll(".bereich-inhalt h2")].map((h) => h.textContent);
const radio = (wert: string) => document.querySelector(`input[name="voreinstellung"][value="${wert}"]`) as HTMLInputElement;

describe("Einstellungen: Navigation in Bereichen", () => {
  it("zeigt sechs Bereiche, beginnt mit der Übersicht und zeigt immer genau einen Bereich", async () => {
    await einhaengen(React.createElement(MitZustand, { start: STANDARD, gesetzt: [] }));
    expect(navKnoepfe().map((b) => b.textContent)).toEqual(BEREICHE);
    expect(ueberschriften()).toEqual(["Übersicht"]);
    for (const titel of BEREICHE) {
      await klick(titel, nav());
      expect(ueberschriften(), titel).toEqual([titel === "Darstellung" ? "Darstellung" : titel]);
      const aktiv = navKnoepfe().filter((b) => b.getAttribute("aria-current") === "true");
      expect(aktiv.map((b) => b.textContent)).toEqual([titel]);
    }
  });

  it("Tastatur: Bereiche sind gewöhnliche Schaltflächen in Lesereihenfolge; die Leiste bleibt beim Wechsel stehen", async () => {
    await einhaengen(React.createElement(MitZustand, { start: STANDARD, gesetzt: [] }));
    for (const b of navKnoepfe()) {
      expect(b.tagName).toBe("BUTTON");
      expect(b.getAttribute("type")).toBe("button");
      expect(b.tabIndex).toBe(0);
    }
    const ziel = knopf("Recherche & Grenzen", nav())!;
    ziel.focus();
    await klick(ziel);
    // Derselbe Knopf (kein Neuaufbau der Leiste), Fokus bleibt dort
    expect(knopf("Recherche & Grenzen", nav())).toBe(ziel);
    expect(document.activeElement).toBe(ziel);
  });

  it("ohne Farbschema-Zugang entfällt „Darstellung“", async () => {
    await einhaengen(React.createElement(MitZustand, { start: STANDARD, gesetzt: [], mitFarben: false }));
    expect(navKnoepfe().map((b) => b.textContent)).toEqual(BEREICHE.filter((b) => b !== "Darstellung"));
  });

  it("mit setBereich hält die App den Bereich: Wahl geht nach außen, die Ansicht folgt dem übergebenen Wert", async () => {
    const gewaehlt: EinstellungsBereich[] = [];
    function Halter() {
      const [b, setB] = React.useState<EinstellungsBereich>("recherche");
      return React.createElement(MitZustand, {
        start: STANDARD,
        gesetzt: [],
        bereich: {
          wert: b,
          setzen: (x) => {
            gewaehlt.push(x);
            setB(x);
          },
        },
      });
    }
    await einhaengen(React.createElement(Halter));
    expect(ueberschriften()).toEqual(["Recherche & Grenzen"]);
    await klick("Über KI-LEAD", nav());
    expect(gewaehlt).toEqual(["ueber"]);
    expect(ueberschriften()).toEqual(["Über KI-LEAD"]);
  });
});

describe("Einstellungen: Übersicht", () => {
  it("zeigt wirksame Modelle mit Herkunft und meldet fehlende Schlüssel genutzter Anbieter", async () => {
    const p = await profilPflicht();
    const start: Einstellungen = { ...STANDARD, modelle: { ...STANDARD.modelle, erfassung: "mistral-medium-3-5" } };
    await einhaengen(React.createElement(MitZustand, { start, gesetzt: [], profil: p, schluessel: { ...OHNE_SCHLUESSEL, anthropic: "sk-ant-TEST" } }));
    const text = document.querySelector(".bereich-inhalt")!.textContent!;
    expect(text).toContain(`${p.manifest.name} ${p.manifest.version}`);
    expect(text).toContain("Individuelle Modellkonfiguration");
    const zeilen = [...document.querySelectorAll(".bereich-inhalt table")[1].querySelectorAll("tbody tr")].map((tr) =>
      [...tr.querySelectorAll("td")].map((td) => td.textContent),
    );
    // Eingestellt ist „mittel“; Mistral bietet nur „niedrig“ und „hoch“ an, wirksam ist „hoch“ (AV-2026-W43-02)
    expect(zeilen.find((z) => z[0] === "S2 Recherche und Entwurf")).toEqual(["S2 Recherche und Entwurf", "mistral-medium-3-5", "hoch", "eigene Einstellung"]);
    const herkunftS1 = zeilen.find((z) => z[0] === "S1 Gegenstand und SOP-Auswahl")![3];
    expect(["Vorgabe des Profils", "Vorgabe der App"]).toContain(herkunftS1);

    const anbieter = [...document.querySelectorAll(".bereich-inhalt table")[0].querySelectorAll("tbody tr")].map((tr) =>
      [...tr.querySelectorAll("td")].map((td) => td.textContent),
    );
    expect(anbieter.map((z) => z[0])).toEqual(["Anthropic", "OpenAI", "Mistral"]);
    expect(anbieter[0][1]).toBe("hinterlegt");
    expect(anbieter[1]).toEqual(["OpenAI", "nicht hinterlegt", "–"]);
    expect(anbieter[2]).toEqual(["Mistral", "fehlt", "S2 Recherche und Entwurf"]);
    expect(text).toContain("Für Mistral ist kein API-Schlüssel hinterlegt");

    await klick("Schlüssel hinterlegen");
    expect(ueberschriften()).toEqual(["KI-Anbieter & API"]);
  });
});

describe("Einstellungen: KI-Anbieter & API", () => {
  it("bietet für Anthropic, OpenAI und Mistral je einen Schlüssel; Speichern übergibt Anbieter und Wert unverändert", async () => {
    const schluesselGesetzt: [AnbieterId, string][] = [];
    await einhaengen(React.createElement(MitZustand, { start: STANDARD, gesetzt: [], schluesselGesetzt }));
    await klick("KI-Anbieter & API", nav());
    const felder = [...document.querySelectorAll("input[aria-label^='API-Schlüssel ']")].map((i) => i.getAttribute("aria-label"));
    expect(felder).toEqual(["API-Schlüssel Anthropic", "API-Schlüssel OpenAI", "API-Schlüssel Mistral"]);
    const mistral = document.querySelector("section[aria-labelledby='schluessel-mistral']") as HTMLElement;
    expect(mistral.textContent).toContain("Die App schickt ihn nur an api.eu.mistral.ai bzw. api.mistral.ai (je nach Endpunkt)");
    expect(mistral.textContent).toContain("Kein Schlüssel hinterlegt.");
    await eingeben(mistral.querySelector("input")!, "  mistral-TEST-NICHT-EXPORTIEREN  ");
    expect(mistral.textContent).toContain("Noch nicht gespeichert.");
    await klick("Speichern", mistral);
    expect(schluesselGesetzt).toEqual([["mistral", "mistral-TEST-NICHT-EXPORTIEREN"]]);
    // Keine Voreinstellung mehr im Schlüsselbereich
    expect(knopf("Standard-Profil wählen")).toBeUndefined();
  });
});

describe("Einstellungen: Voreinstellung unter „Modelle & Verarbeitung“", () => {
  it("setzt Modell und Aufwand aller Aufgaben auf ein Standard-Profil; alles andere bleibt", async () => {
    const gesetzt: Einstellungen[] = [];
    const start: Einstellungen = { ...STANDARD, websucheMax: 7 };
    await einhaengen(React.createElement(MitZustand, { start, gesetzt }));
    await klick("Modelle & Verarbeitung", nav());
    expect(radio("profil").checked).toBe(true);
    expect(radio("individuell").disabled).toBe(true);
    expect(document.querySelector(".voreinstellung-wahl")!.textContent).toContain("S1 gpt-6-luna (hoch)");

    await klick(radio("openai"));
    expect(gesetzt.at(-1)!.modelle).toEqual(STANDARD_PROFILE.openai.modelle);
    expect(gesetzt.at(-1)!.aufwand).toEqual(STANDARD_PROFILE.openai.aufwand);
    expect(gesetzt.at(-1)!.websucheMax).toBe(7);
    expect(radio("openai").checked).toBe(true);
    expect((document.querySelector('select[aria-label="Modell S2 Verdichtung"]') as HTMLSelectElement).value).toBe("gpt-6-astra");
    expect(document.querySelector(".voreinstellung-wahl [role=status]")!.textContent).toContain("Standard-Profil OpenAI");

    await klick(radio("mistral"));
    expect(gesetzt.at(-1)!.modelle).toEqual({
      vorverarbeitung: "mistral-small-2603",
      erfassung: "mistral-medium-3-5",
      verdichtung: "mistral-medium-3-5",
      reparatur: "mistral-medium-3-5",
      kurzfassung: "mistral-medium-3-5",
    });
    expect((document.querySelector('select[aria-label="Aufwand S1 Gegenstand und SOP-Auswahl"]') as HTMLSelectElement).value).toBe("high");

    await klick(radio("profil"));
    expect(gesetzt.at(-1)!.modelle).toEqual({ vorverarbeitung: "", erfassung: "", verdichtung: "", reparatur: "", kurzfassung: "" });
    expect(gesetzt.at(-1)!.aufwand).toEqual(STANDARD.aufwand);
  });

  it("AV-2026-W43-31: Mix-Profile stehen nach den Standard-Profilen, nennen beide Schlüssel und setzen alle Aufgaben", async () => {
    const gesetzt: Einstellungen[] = [];
    await einhaengen(React.createElement(MitZustand, { start: { ...STANDARD, websucheMax: 5 }, gesetzt }));
    await klick("Modelle & Verarbeitung", nav());
    const werte = [...document.querySelectorAll('input[name="voreinstellung"]')].map((r) => (r as HTMLInputElement).value);
    expect(werte).toEqual(["profil", "anthropic", "openai", "mistral", "mix-opus", "mix-sonnet", "individuell"]);
    const wahl = document.querySelector(".voreinstellung-wahl")!.textContent!;
    expect(wahl).toContain("Mix: OpenAI S1 + Anthropic Opus");
    expect(wahl).toContain("Mix: OpenAI S1 + Anthropic Sonnet");
    expect(wahl).toContain("Braucht Schlüssel für OpenAI und Anthropic; die Inhalte eines Laufs gehen an beide Anbieter.");

    await klick(radio("mix-sonnet"));
    expect(gesetzt.at(-1)!.modelle).toEqual({
      vorverarbeitung: "gpt-6-luna",
      erfassung: "claude-sonnet-5-5",
      verdichtung: "claude-sonnet-5-5",
      reparatur: "claude-haiku-5-5",
      kurzfassung: "claude-sonnet-5-5",
    });
    expect(gesetzt.at(-1)!.aufwand).toEqual({ vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" });
    expect(gesetzt.at(-1)!.websucheMax).toBe(5);
    expect(radio("mix-sonnet").checked).toBe(true);
    expect(document.querySelector(".voreinstellung-wahl [role=status]")!.textContent).toContain("Mix: OpenAI S1 + Anthropic Sonnet");

    await klick(radio("mix-opus"));
    expect(gesetzt.at(-1)!.modelle.verdichtung).toBe("claude-opus-5-5");
    expect(radio("mix-opus").checked).toBe(true);
  });

  it("AV-2026-W43-01, -02: Aufwand je Modell; beim Wechsel auf Mistral passt sich die Stufe sichtbar an", async () => {
    const gesetzt: Einstellungen[] = [];
    await einhaengen(React.createElement(MitZustand, { start: STANDARD, gesetzt }));
    await klick("Modelle & Verarbeitung", nav());
    const aufwand = () => document.querySelector('select[aria-label="Aufwand S2 Verdichtung"]') as HTMLSelectElement;
    expect([...aufwand().options].map((o) => o.value)).toEqual(["low", "medium", "high", "xhigh", "max"]);
    expect(aufwand().value).toBe("medium");
    await eingeben(document.querySelector('select[aria-label="Modell S2 Verdichtung"]') as HTMLSelectElement, "mistral-medium-3-5");
    expect([...aufwand().options].map((o) => [o.value, o.textContent])).toEqual([
      ["low", "niedrig – ohne Nachdenken"],
      ["high", "hoch – mit Nachdenken"],
    ]);
    expect(aufwand().value).toBe("high");
    expect(gesetzt.at(-1)!.aufwand.verdichtung).toBe("high");
    // „niedrig“ bleibt beim Wechsel zurück zu Anthropic erhalten
    await eingeben(aufwand(), "low");
    await eingeben(document.querySelector('select[aria-label="Modell S2 Verdichtung"]') as HTMLSelectElement, "claude-opus-5-5");
    expect(aufwand().value).toBe("low");
    expect(document.querySelector(".bereich-inhalt")!.textContent).toContain("Zur Wahl stehen je Modell nur die Stufen, die der Anbieter anbietet");
  });

  it("fragt vor dem Überschreiben einer individuellen Konfiguration nach und lässt sie bei Ablehnung stehen", async () => {
    const gesetzt: Einstellungen[] = [];
    const start: Einstellungen = { ...STANDARD, modelle: { ...STANDARD.modelle, erfassung: "claude-fable-5-1", kurzfassung: "mistral-small-2603" } };
    const frage = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    await einhaengen(React.createElement(MitZustand, { start, gesetzt }));
    await klick("Modelle & Verarbeitung", nav());
    expect(radio("individuell").checked).toBe(true);

    await klick(radio("anthropic"));
    expect(frage).toHaveBeenCalledTimes(1);
    expect(gesetzt).toEqual([]);
    expect(radio("individuell").checked).toBe(true);

    await klick(radio("anthropic"));
    expect(frage).toHaveBeenCalledTimes(2);
    expect(gesetzt.at(-1)!.modelle).toEqual(STANDARD_PROFILE.anthropic.modelle);

    // Von einem Standard-Profil zum anderen: nichts Individuelles geht verloren, keine Rückfrage
    await klick(radio("openai"));
    expect(frage).toHaveBeenCalledTimes(2);
  });

  it("gemischte Konfiguration bleibt möglich; die Zeile nennt Herkunft, Anbieter und fehlenden Schlüssel", async () => {
    const gesetzt: Einstellungen[] = [];
    await einhaengen(React.createElement(MitZustand, { start: STANDARD, gesetzt, schluessel: { ...OHNE_SCHLUESSEL, anthropic: "sk-ant-TEST" } }));
    await klick("Modelle & Verarbeitung", nav());
    const s2 = document.querySelector('select[aria-label="Modell S2 Recherche und Entwurf"]') as HTMLSelectElement;
    expect([...s2.querySelectorAll("optgroup")].map((g) => g.label)).toEqual(["Anthropic", "OpenAI", "Mistral"]);
    s2.value = "mistral-large-4";
    await React.act(async () => s2.dispatchEvent(new Event("change", { bubbles: true })));
    expect(gesetzt.at(-1)!.modelle.erfassung).toBe("mistral-large-4");
    expect(gesetzt.at(-1)!.modelle.vorverarbeitung).toBe("");
    expect(radio("individuell").checked).toBe(true);
    expect(s2.closest("td")!.textContent).toContain("eigene Einstellung · Mistral · kein Schlüssel");
  });
});

describe("Einstellungen: Recherche & Grenzen", () => {
  it("heißt „Maximale Ausgabetoken je KI-Aufruf“, erklärt die Geltung, zeigt 128 000 und begrenzt auf 8 000–128 000", async () => {
    const p = await profilPflicht();
    const gesetzt: Einstellungen[] = [];
    await einhaengen(
      React.createElement(EinstellungenAnsicht, {
        profil: p,
        einstellungen: STANDARD,
        setEinstellungen: (e: Einstellungen) => void gesetzt.push(e),
        schluessel: OHNE_SCHLUESSEL,
        setSchluessel: () => {},
        bereich: "recherche",
      }),
    );
    const feld = [...document.querySelectorAll("label.feld")].find((l) => l.querySelector(".feld-label")?.textContent === "Maximale Ausgabetoken je KI-Aufruf");
    expect(feld, "Feld mit neuer Bezeichnung").toBeTruthy();
    expect(feld!.textContent).toContain("Gilt für jeden KI-Aufruf der App (S1, S2, S3 und Management Summary)");
    const eingabe = feld!.querySelector("input") as HTMLInputElement;
    expect(eingabe.value).toBe("128000");
    await eingeben(eingabe, "500000");
    await eingeben(eingabe, "1000");
    await eingeben(eingabe, "");
    // Gespeichert wird weiter unter dem bisherigen Feldnamen; keine neue Datenstruktur
    expect(gesetzt.map((e) => e.maxTokensErfassung)).toEqual([128000, 8000, 128000]);
    expect(Object.keys(gesetzt[0]).sort()).toEqual(Object.keys(STANDARD).sort());
    expect(document.body.textContent).not.toContain("Höchstzahl Ausgabetoken (S1, S2, S3)");
    expect(document.body.textContent).toContain("Mistral: Über den EU-Endpunkt (Vorgabe) gibt es keine Werkzeuge");
    expect(document.body.textContent).toContain("Derzeit gewählt: EU (api.eu.mistral.ai).");
  });
});

describe("Einstellungen: Mistral-Endpunkt (seit 0.5.6, Vorgabe EU)", () => {
  it("ist als Vorgabe EU; die Wahl ändert nur den Endpunkt; die Übersicht nennt ihn", async () => {
    const gesetzt: Einstellungen[] = [];
    expect(STANDARD.mistralEndpunkt).toBe("eu");
    await einhaengen(React.createElement(MitZustand, { start: STANDARD, gesetzt }));
    expect(document.querySelector(".uebersicht-liste")!.textContent).toContain("Mistral-EndpunktEU (api.eu.mistral.ai)");
    await klick("KI-Anbieter & API", nav());
    const eu = document.querySelector('input[name="mistral-endpunkt"][value="eu"]') as HTMLInputElement;
    const global = document.querySelector('input[name="mistral-endpunkt"][value="global"]') as HTMLInputElement;
    expect(eu.checked).toBe(true);
    await klick(global);
    expect(gesetzt).toHaveLength(1);
    expect(gesetzt[0]).toEqual({ ...STANDARD, mistralEndpunkt: "global" });
    expect(global.checked).toBe(true);
    await klick("Übersicht", nav());
    expect(document.querySelector(".uebersicht-liste")!.textContent).toContain("Mistral-EndpunktGlobal (api.mistral.ai)");
  });
});
