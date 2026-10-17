import { describe, expect, it } from "vitest";
import { jsonDateien, profil } from "./hilfen";
import { STANDARD } from "../src/pipeline/einstellungen";
import {
  abschnitte,
  bereinigeAbsatz,
  fingerabdruck,
  kurzfassungAnweisung,
  kurzfassungErstellen,
  kurzfassungSchema,
  meldungFuerKurzfassung,
} from "../src/pipeline/kurzfassung";
import { leereNutzung, type LlmAnbieter, type LlmAnfrage } from "../src/anbieter/typen";

const ilka = jsonDateien("daten/orkantief-ilka");
const th = ilka.find((x) => x.name.includes("_TH_"))!.daten; // zwei Sachverhalte

function attrappe(text: string): LlmAnbieter & { anfragen: LlmAnfrage[] } {
  const anfragen: LlmAnfrage[] = [];
  return {
    id: "attrappe",
    anfragen,
    async senden(a) {
      anfragen.push(a);
      return {
        modell: "claude-test",
        text,
        inhalt: [],
        zitate: [],
        fundstellen: [],
        suchen: [],
        abrufe: [],
        abrufFehler: [],
        nutzung: leereNutzung(),
        kostenUsd: 0.02,
        stopGrund: "end_turn",
        dauerMs: 1,
        runden: 1,
      };
    },
  };
}

describe("Management Summary", () => {
  it("leitet die Abschnitte aus den Analysefeldern des Profils ab", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(abschnitte(p!).map((a) => a.label)).toEqual([
      "Lage & Ereignis",
      "Risiken & Auswirkungen",
      "Maßnahmen & Handlungsempfehlungen",
      "Abhängigkeiten & Interdependenzen",
    ]);
    const s: any = kurzfassungSchema(p!);
    expect(s.properties.sachverhalte.items.required).toEqual([
      "titel",
      "lage_ereignis",
      "risiken_auswirkungen",
      "massnahmen_empfehlungen",
      "abhaengigkeiten_interdependenzen",
    ]);
    expect(kurzfassungAnweisung(p!)).not.toMatch(/\{\{|\[nicht angegeben\]/);
  });

  it("entfernt Quellenverweise und URLs", () => {
    expect(bereinigeAbsatz("Die Lage ist stabil [Q1, Q3]. Mehr unter https://x.de/a.").text).toBe("Die Lage ist stabil. Mehr unter");
    expect(bereinigeAbsatz("Ohne Verweis.").entfernt).toBe(false);
  });

  it("erkennt Änderungen am Inhalt, nicht an der Freigabe", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const a = fingerabdruck(meldungFuerKurzfassung(th, p!));
    const b = structuredClone(th);
    b.freigabe.freigabe.name = "Jemand";
    expect(fingerabdruck(meldungFuerKurzfassung(b, p!))).toBe(a);
    b.sachverhalte[0].analyse.lage_ereignis += " Neu.";
    expect(fingerabdruck(meldungFuerKurzfassung(b, p!))).not.toBe(a);
  });

  it("baut den Klartext mit fester Kopfzeile, Beurteilung und Tendenz", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const absatz = (t: string) => ({
      titel: t,
      lage_ereignis: "Kernaussage [Q2].",
      risiken_auswirkungen: "Risiko.",
      massnahmen_empfehlungen: "Maßnahme.",
      abhaengigkeiten_interdependenzen: "Kopplung.",
    });
    const att = attrappe(JSON.stringify({ sachverhalte: [absatz("A"), absatz("B")] }));
    const k = await kurzfassungErstellen(p!, th, att, STANDARD);
    expect(att.anfragen[0].jsonSchema).toBeTruthy();
    expect(att.anfragen[0].werkzeuge).toBeUndefined();
    expect(String(att.anfragen[0].nachrichten[0].content)).not.toContain('"quellen"');
    expect(k.text).toMatch(/^Management Summary – Thüringer Ministerium/);
    expect(k.text).toContain("1. ");
    expect(k.text).toContain(`Beurteilung: ${th.sachverhalte[0].sofort.beurteilung}`);
    expect(k.text).toContain("Risiken & Auswirkungen\nRisiko.");
    expect(k.text).not.toMatch(/\[Q/);
    expect(k.hinweise.join(" ")).toMatch(/Quellenverweise/);
    expect(k.eintrag.kostenUsd).toBe(0.02);

    const zuWenig = await kurzfassungErstellen(p!, th, attrappe(JSON.stringify({ sachverhalte: [absatz("A")] })), STANDARD);
    expect(zuWenig.hinweise.join(" ")).toMatch(/2 Sachverhalt/);
  });
});
