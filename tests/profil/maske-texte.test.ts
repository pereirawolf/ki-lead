// Beschriftungen und Leitfragen der Erfassungsmaske (seit Beispielprofil 2.4.0, Vorlage 1.3.0; Entscheidungen des Herausgebers
// vom 21.11.2026 zur Seite „Ereignisse und Sachverhalte“). Soll unabhängig vom Code: Kein Feld der Maske zeigt seinen technischen
// Feldnamen („luecken“, „bausteine“), kein Auswahlwert einen Unterstrich, Feldhinweise des Schritts nennen keine Abschnitte von
// Kodierleitfaden oder SOP (der verbindliche Verweis steht einmal in der Einleitung des Schritts), Empfehlungen heißen nicht
// „Auftrag“, und die Darstellungsdatei der Vorlage im Format stimmt in den gemeinsamen Feldern mit dem Beispielprofil überein.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { feldUi, wertBezeichnung } from "../../src/kern/ui";
import type { UiKonfig } from "../../src/kern/typen";
import { repoPfad } from "../support/dateien";

const lies = (pfad: string) => JSON.parse(readFileSync(repoPfad(pfad), "utf-8"));
const PROFILE = ["profile/lead-beispiel", "profile/lead-thueringen", "profile/muster", "formate/lead-meldung-v2/beispiel"];

type Knoten = Record<string, any>;

/** Alle Feldpfade (generisch, Listen als „[]“) mit ihrem Teilschema; Verweise und allOf aufgelöst */
function pfade(schema: Knoten): [string, Knoten][] {
  const defs: Record<string, Knoten> = schema.$defs ?? {};
  const aufloesen = (n: Knoten): Knoten => {
    let k = n;
    for (let i = 0; i < 20 && k && typeof k === "object" && k.$ref; i++) {
      const { $ref, ...rest } = k;
      k = { ...defs[String($ref).split("/").pop()!], ...rest };
    }
    if (k?.allOf) for (const t of k.allOf) k = { ...k, properties: { ...k.properties, ...aufloesen(t).properties } };
    return k;
  };
  const out: [string, Knoten][] = [];
  const geh = (n: Knoten, pfad: string, tiefe: number) => {
    const k = aufloesen(n);
    if (!k || tiefe > 15) return;
    if (pfad) out.push([pfad, k]);
    for (const [name, kind] of Object.entries<Knoten>(k.properties ?? {})) geh(kind, pfad ? `${pfad}.${name}` : name, tiefe + 1);
    if (k.items && !Array.isArray(k.items)) geh(k.items, `${pfad}[]`, tiefe + 1);
  };
  geh(schema, "", 0);
  return out;
}

describe("Maske „Ereignisse und Sachverhalte“: Beschriftungen und Leitfragen", () => {
  it.each(PROFILE)("%s: jedes Feld eines Sachverhalts, der Beziehungen und der Fehlanzeige hat eine Beschriftung", (ordner) => {
    const ui: UiKonfig = lies(`${ordner}/meldung.ui.json`);
    const ohne = pfade(lies(`${ordner}/meldung.schema.json`))
      .filter(([p]) => /^(sachverhalte\[\]|beziehungen|fehlanzeige)/.test(p))
      // Achsen eines Radars beschriftet die Radardefinition
      .filter(([p]) => !/\.(lagenradar|lageprofil)\./.test(p))
      // Einträge von Listen: Objekte tragen die Elementbeschriftung der Liste, Auswahllisten zeigen ihre Werte, Kennungen das Listenfeld
      .filter(([p, k]) => !(p.endsWith("[]") && (k.type === "object" || k.enum || feldUi(ui, p.slice(0, -2)).widget === "kennungen")))
      .filter(([p]) => !feldUi(ui, p).label)
      .map(([p]) => p);
    expect(ohne).toEqual([]);
  });

  it.each(PROFILE)("%s: Auswahlwerte ohne Unterstrich; Empfehlung statt Auftrag; Lücken mit eigener Beschriftung", (ordner) => {
    const ui: UiKonfig = lies(`${ordner}/meldung.ui.json`);
    const werte = new Set<string>();
    for (const [, k] of pfade(lies(`${ordner}/meldung.schema.json`))) for (const w of k.enum ?? []) if (typeof w === "string") werte.add(w);
    expect([...werte].map((w) => wertBezeichnung(ui, w)).filter((t) => t.includes("_"))).toEqual([]);
    expect(wertBezeichnung(ui, "fortschreibung_von")).toBe("Fortschreibung (neuer Stand)");
    expect(wertBezeichnung(ui, "verhaeltnis")).toBe("Verhältnis");
    expect(feldUi(ui, "sachverhalte[].handlungsbedarf.empfehlungen[].auftrag").label).toBe("Empfehlung");
    expect(feldUi(ui, "sachverhalte[].handlungsbedarf.fristen").label).toBe("Fristen");
    expect(feldUi(ui, "sachverhalte[].bewertung.erkenntnislage.luecken").element_label).toBe("Lücke");
    expect(feldUi(ui, "sachverhalte[].bewertung.erkenntnislage.luecken[]").label).toBe("Lücke");
  });

  it.each(PROFILE)("%s: Feldhinweise eines Sachverhalts ohne Abschnittsverweise und ohne technische Werte; Verweis in der Einleitung", (ordner) => {
    const ui: UiKonfig = lies(`${ordner}/meldung.ui.json`);
    const hinweise = Object.entries(ui.felder)
      .filter(([p]) => p.startsWith("sachverhalte"))
      .map(([p, f]) => [p, `${f.label ?? ""} ${f.hinweis ?? ""}`] as const);
    expect(hinweise.filter(([, t]) => /Kodierleitfaden|SOP-LEAD|Abschnitt/.test(t)).map(([p]) => p)).toEqual([]);
    expect(hinweise.filter(([, t]) => /„[a-z]+_[a-z_]+“|verhaeltnis|ungefaehr/.test(t)).map(([p]) => p)).toEqual([]);
    const schritt = ui.schritte.find((s) => s.id === "sachverhalte");
    expect(schritt?.einleitung).toMatch(/Kodierleitfaden des Profils/);
  });

  it("Vorlage im Format und Beispielprofil: gemeinsame Felder gleich beschriftet", () => {
    const vorlage: UiKonfig = lies("formate/lead-meldung-v2/beispiel/meldung.ui.json");
    const beispiel: UiKonfig = lies("profile/lead-beispiel/meldung.ui.json");
    expect(vorlage.felder).toEqual(beispiel.felder);
    expect(vorlage.werte).toEqual(beispiel.werte);
  });
});
