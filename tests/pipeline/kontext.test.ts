// Kontext aus dem Profil: Ereignisarten, SOP-Zuordnung, Arbeitsanweisungen und Platzhalter.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { kodierleitfadenKennung, sopKennungenAbgleichen } from "../../src/pipeline/nachbearbeitung";
import {
  sopIdsAufloesen,
  verdichtungsAnweisung,
  VERDICHTUNG_S2,
  ereignisarten,
  s1Schema,
  sopsFuerArten,
  anweisungErfassung,
  anwendungsbereich,
  fachSops,
  steuerungsBlock,
  type Steuerung,
} from "../../src/pipeline/kontext";
import { STANDARD_ANWEISUNG } from "../../src/profil/standardtexte";

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
    expect(kodierleitfadenKennung(p!)).toBe("Kodierleitfaden LEAD 1.7.0");
    // frühere Kennungen (01, N02) und aktuelle (B08) werden auf die gültige Kennung abgebildet
    const liste = [
      "SOP-LEAD 01 Unwetter / Sturm v0.4",
      "SOP-LEAD 99 Erfunden v1.0",
      "SOP-LEAD N02 irgendwas",
      "SOP-LEAD 1 Unwetter / Sturm",
      "SOP-LEAD B08 Strom",
    ];
    expect(sopKennungenAbgleichen(liste, p!)).toEqual([
      "SOP-LEAD B01 Unwetter / Sturm v2.2.0",
      "SOP-LEAD C11 Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit v1.2.2",
      "SOP-LEAD B08 Stromausfall / Blackout v2.2.0",
    ]);
    // Nicht in S1 bestätigte (nicht beigefügte) SOPs entfallen
    expect(sopKennungenAbgleichen(liste, p!, new Set(["b01"]))).toEqual(["SOP-LEAD B01 Unwetter / Sturm v2.2.0"]);
  });

  it("löst frühere SOP-IDs gespeicherter Läufe auf", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(sopIdsAufloesen(p!, ["sop-08", "baustein-n05", "b08", "c99", "baustein-n14"])).toEqual(["b08", "c12"]);
  });

  it("Verdichtung: Profilanweisung ohne offene Platzhalter, Ersatzfassung ohne Altregeln", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const v = verdichtungsAnweisung(p!);
    expect(v).not.toMatch(/\{\{|\[nicht angegeben\]/);
    expect(v).toContain("Fassung 2.2");
    for (const text of [v, VERDICHTUNG_S2]) {
      expect(text).not.toMatch(/gilt die jüngste|Jede Eingangsmeldung ist eine Quelle der Kategorie A|dürfen als Belege dienen|Untergrenze/);
    }
  });
});

describe("Standardtexte der App (TP-2026-W44-27)", () => {
  it("TP-2026-W44-27: Standardfassungen Verdichtung und Management Summary zitieren keine SOP und keine festen Quellenkategorien", () => {
    for (const text of [VERDICHTUNG_S2, STANDARD_ANWEISUNG]) {
      expect(text).not.toMatch(/SOP-LEAD|\bA\.\d|Teil A\b/);
      expect(text).not.toMatch(/Behörden sind A|\bB oder P\b/);
    }
  });

  it("TP-2026-W44-27: die Standardfassung Verdichtung setzt den Kennsatz des Profils ein; das Beispielprofil behält seine eigene Anweisung", async () => {
    const { profil: m } = await profil("muster");
    expect(m!.manifest.anweisungen?.verdichtung).toBeUndefined();
    const v = verdichtungsAnweisung(m!);
    expect(v).toContain("im Kennsatz „Abweichende Bewertung:“");
    expect(v).not.toMatch(/\{\{|\[nicht angegeben\]/);
    const eigen = { ...m!, ui: { ...m!.ui, kennsaetze: { ...m!.ui.kennsaetze, abweichung: "Andere Einschätzung:" } } };
    expect(verdichtungsAnweisung(eigen)).toContain("im Kennsatz „Andere Einschätzung:“");
    const ohne = { ...m!, ui: { ...m!.ui, kennsaetze: {} } };
    expect(verdichtungsAnweisung(ohne)).toContain("im Kennsatz „Abweichende Bewertung:“");
    const { profil: b } = await profil("lead-beispiel");
    const datei = b!.dateien[b!.manifest.anweisungen!.verdichtung!]!;
    expect(verdichtungsAnweisung(b!).slice(0, 200)).toBe(datei.slice(0, 200));
  });
});

describe("Steuerung durch die App und Zeitfelder von S1 (0.4.28)", () => {
  const basis = (x: Partial<Steuerung> = {}): Steuerung => ({
    jetzt: "2026-10-22T06:07",
    t0: "2026-10-22T06:06",
    stichtag: "2026-10-22",
    zone: "Europe/Berlin",
    vormeldung: true,
    vormeldungStand: "2026-10-21T19:40",
    verdichtung: false,
    recherche: "durchfuehren",
    websucheMax: 30,
    abrufMax: 0,
    ...x,
  });

  it("nennt Bearbeitungszeit, t0 und Stand der Vormeldung getrennt", () => {
    const t = steuerungsBlock(basis());
    expect(t).toContain("- Bearbeitungszeitpunkt (Europe/Berlin): 2026-10-22 06:07");
    expect(t).toContain("- Meldezeitpunkt t0 der neuen Meldung: 2026-10-22 06:06");
    expect(t).toContain("Eigene Vormeldung (Stand 2026-10-21 19:40)");
    expect(t).toContain("keine zeitliche Obergrenze");
  });

  it("setzt den Recherchemodus positiv und nur mit den wirksamen Werkzeugen", () => {
    const t = steuerungsBlock(basis());
    expect(t).toContain("- Recherche: durchführen (verbindlich; Websuche bis zu 30-mal).");
    expect(t).not.toContain("Seitenabruf bis zu");
    expect(t).toContain("Neubewertungsindikatoren und offenen Prüfpunkte der Vormeldung");
    const ohne = steuerungsBlock(basis({ vormeldung: false, vormeldungStand: "" }));
    expect(ohne).not.toContain("Eigene Vormeldung");
    expect(ohne).not.toContain("Neubewertungsindikatoren");
    expect(steuerungsBlock(basis({ recherche: "nur-material" }))).toContain("Websuche und Seitenabruf sind für diesen Auftrag abgeschaltet");
    expect(steuerungsBlock(basis({ recherche: "nur-material" }))).toContain("„nicht überprüfbar“");
    expect(steuerungsBlock(basis({ recherche: "keine-werkzeuge" }))).toContain(
      "- Recherche: im Auftrag „Recherche durchführen“ gewählt, in den Einstellungen aber nicht verfügbar (Höchstzahlen 0).",
    );
  });

  it("S1-Schema: t0 bei Fortschreibung auf heute ist die aktuelle Zeit; Arbeitsmodus gehört nicht in den Gegenstand", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const props = (s1Schema(p!) as any).properties;
    expect(props.meldezeitpunkt.description).toContain("Fortschreibung einer eigenen Vormeldung mit heutigem Stichtag: der aktuelle Zeitpunkt");
    expect(props.meldezeitpunkt.description).toContain("Nie ein Zeitpunkt in der Zukunft");
    expect(props.gegenstand.description).toContain("Arbeitsmodus (Recherche oder nur Material) und Zeitpunkte legt der Auftrag fest");
  });
});
