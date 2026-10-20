import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { STANDARD } from "../../src/pipeline/einstellungen";
import {
  abschnitte,
  bereinigeAbsatz,
  fingerabdruck,
  kurzfassungAnweisung,
  kurzfassungErstellen,
  kurzfassungSchema,
  kurzfassungsFingerabdruck,
  meldungFuerKurzfassung,
  fruehesteFrist,
  fristen,
  fristenText,
  GRENZEN,
  herkunftsliste,
  kurzfassungText,
  woerter,
} from "../../src/pipeline/kurzfassung";
import { leereNutzung, type LlmAnbieter, type LlmAnfrage } from "../../src/anbieter/typen";

import { ilkaDateien } from "../support/fixtures";
const ilka = ilkaDateien();
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
    expect(s.required).toEqual(["kernaussage", "abschnitte", "kurztitel"]);
    expect(s.properties.abschnitte.required).toEqual(["lage_ereignis", "risiken_auswirkungen", "massnahmen_empfehlungen", "abhaengigkeiten_interdependenzen"]);
    expect(kurzfassungAnweisung(p!)).not.toMatch(/\{\{|\[nicht angegeben\]/);
    expect(kurzfassungAnweisung(p!)).toContain("einer einzigen, konsolidierten Gesamtfassung");
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

  it("baut eine konsolidierte Leitungsfassung mit Beurteilungen und frühester Frist", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const antwortJson = {
      kernaussage: "Rund 10.000 Menschen sind ohne Strom; die Notstrompuffer reichen nur mit Nachbetankung [Q2].",
      abschnitte: {
        lage_ereignis: "Im Landkreis Sonneberg fehlt Strom. Die Wiederversorgung ist für den 16.10.2026 angekündigt.",
        risiken_auswirkungen: "Pflege und Wasser hängen am Notstrom.",
        massnahmen_empfehlungen: "Der Landkreis sollte die Nachbetankung bis 15.10.2026, 12:00 Uhr bestätigen.",
        abhaengigkeiten_interdependenzen: "Strom koppelt an Notruf, Pflege und Trinkwasser.",
      },
      kurztitel: ["Sturmschäden Thüringer Wald", "Stromausfall Sonneberg"],
    };
    const att = attrappe(JSON.stringify(antwortJson));
    const k = await kurzfassungErstellen(p!, th, att, STANDARD);
    expect(att.anfragen[0].jsonSchema).toBeTruthy();
    expect(att.anfragen[0].werkzeuge).toBeUndefined();
    expect(String(att.anfragen[0].nachrichten[0].content)).not.toContain('"quellen"');
    const zeilen = k.text.split("\n");
    expect(zeilen[0]).toMatch(/^Management Summary – Thüringer Ministerium/);
    expect(zeilen[2]).toBe("Rund 10.000 Menschen sind ohne Strom; die Notstrompuffer reichen nur mit Nachbetankung.");
    expect(k.text).toContain(`• Sturmschäden Thüringer Wald: ${th.sachverhalte[0].sofort.beurteilung}, ${th.sachverhalte[0].sofort.tendenz}`);
    expect(k.text).toContain(`• Stromausfall Sonneberg: ${th.sachverhalte[1].sofort.beurteilung}`);
    expect(k.text).toContain("Risiken & Auswirkungen: Pflege und Wasser hängen am Notstrom.");
    // Eigene Zeile „Bewertung & Tendenz“, Abschnitte durch Leerzeilen getrennt
    expect(k.text).toContain("\n\nBewertung & Tendenz:\n• Sturmschäden");
    expect(k.text).toMatch(/\n\nLage & Ereignis: .*\n\nRisiken & Auswirkungen: /);
    expect(k.text).toMatch(/\nHandlungsrelevant bis: \d{2}\.\d{2}\.\d{4}/);
    expect(k.text).not.toMatch(/\[Q/);
    expect(k.hinweise.join(" ")).toMatch(/Quellenverweise/);
    expect(woerter(k.text)).toBeLessThan(160);

    const lang = { ...antwortJson, kurztitel: ["A"], abschnitte: { ...antwortJson.abschnitte, lage_ereignis: "Eins. Zwei. Drei." } };
    const z = await kurzfassungErstellen(p!, th, attrappe(JSON.stringify(lang)), STANDARD);
    expect(z.hinweise.join(" ")).toMatch(/mehr als 2 Sätzen/);
    expect(z.hinweise.join(" ")).toMatch(/2 Sachverhalt/);
  });

  it("weist Bewertung & Tendenz bei einem Sachverhalt in einer eigenen Zeile aus", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const eins = { ...th, sachverhalte: [th.sachverhalte[1]] };
    const antwort = {
      kernaussage: "K.",
      abschnitte: { lage_ereignis: "L.", risiken_auswirkungen: "R.", massnahmen_empfehlungen: "M.", abhaengigkeiten_interdependenzen: "A." },
      kurztitel: ["Stromausfall Sonneberg"],
    };
    const k = await kurzfassungErstellen(p!, eins, attrappe(JSON.stringify(antwort)), STANDARD);
    const sv = th.sachverhalte[1].sofort;
    expect(k.text).toContain(`K.\n\nBewertung & Tendenz: ${sv.beurteilung}, ${sv.tendenz}\n\nLage & Ereignis: L.\n\nRisiken & Auswirkungen: R.\n\nMaßnahmen`);
    expect(k.text).not.toContain("•");
    expect(k.text).not.toContain("Stromausfall Sonneberg:");
  });

  it("übernimmt alle Fristen vollständig, früheste zuerst, und kennzeichnet überfällige", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const m = structuredClone(th);
    m.meldezeitpunkt = "2026-10-14T10:30";
    m.sachverhalte[0].sofort.bewertung_text =
      "Kernaussage.\nHandlungsrelevant bis: 16.10.2026 09:00 – Freigabe Landesstraßen, Straßenbauamt – nur falls Nachsturm ausbleibt; Grundlage: Lagemeldung [Q2]";
    m.sachverhalte[1].sofort.bewertung_text =
      "Kernaussage.\nHandlungsrelevant bis: 15.10.2026 12:00 – Nachbetankung Pflegeheime, Landkreis (Puffer bis 20:00 Uhr); Grundlage: Landratsamt [Q3]\nHandlungsrelevant bis: 14.10.2026 08:00 – Rückmeldung Notruf, Leitstelle\nHandlungsrelevant bis: 17.10.2026 – Abschlussbericht";
    const f = fristen(m, p!);
    expect(f.map((x) => x.text)).toEqual([
      "14.10.2026 08:00 – Rückmeldung Notruf, Leitstelle",
      "15.10.2026 12:00 – Nachbetankung Pflegeheime, Landkreis (Puffer bis 20:00 Uhr)",
      "16.10.2026 09:00 – Freigabe Landesstraßen, Straßenbauamt – nur falls Nachsturm ausbleibt",
      "17.10.2026 – Abschlussbericht",
    ]);
    expect(f.map((x) => x.ueberfaellig)).toEqual([true, false, false, false]);
    const text = fristenText(m, p!);
    expect(text.split("\n")[0]).toBe("Handlungsrelevant bis:");
    expect(text).toContain("• 14.10.2026 08:00 – Rückmeldung Notruf, Leitstelle – vor dem Meldestand abgelaufen; Erledigung prüfen");
    expect(text).toContain("(Puffer bis 20:00 Uhr)");
    expect(text).toContain("nur falls Nachsturm ausbleibt");
    expect(text).toContain(`• weitere 1 Frist(en) in der Meldung`);
    expect(text.split("\n").filter((z) => z.startsWith("• ")).length).toBe(GRENZEN.fristenMax + 1);
    expect(text).not.toMatch(/Grundlage|\[Q/);
  });

  it("kennzeichnet Entwürfe im Kopf und verschiebt Kurztitel bei falscher Anzahl nicht", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const m = structuredClone(th);
    m._status = "Entwurf";
    const k = { kernaussage: "K.", abschnitte: {}, kurztitel: ["Nur ein Titel"] };
    const text = kurzfassungText(m, p!, k);
    expect(text.split("\n")[0]).toMatch(/· ENTWURF – Meldung nicht freigegeben$/);
    expect(text).not.toContain("Nur ein Titel");
    expect(text).toContain(`• ${m.sachverhalte[1].bezeichnung.slice(0, 20)}`);
    expect(kurzfassungText(th, p!, k).split("\n")[0]).not.toMatch(/ENTWURF/);
  });

  it("gibt der KI eine Herkunftsliste ohne URLs mit und hält die Richtwerte konsistent", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const ni = ilka.find((x) => x.name.includes("_NI_"))!.daten;
    const h = herkunftsliste(ni, p!);
    expect(h).toContain("[Q4] B – Verteilnetzbetreiber Netzgebiet Harz");
    expect(h.join(" ")).not.toMatch(/https?:|Zugriff/);
    const att = attrappe(JSON.stringify({ kernaussage: "K.", abschnitte: {}, kurztitel: [] }));
    await kurzfassungErstellen(p!, ni, att, STANDARD);
    expect(String(att.anfragen[0].nachrichten[0].content)).toContain("Herkunft der Angaben");
    const a = kurzfassungAnweisung(p!);
    expect(a).toContain(`rund ${GRENZEN.woerterZiel} Wörter`);
    expect(a).toContain(`Bis ${GRENZEN.woerterGesamt} Wörter`);
    expect(a).toContain(`mehr als ${GRENZEN.woerterSatzHinweis} Wörtern`);
  });

  it("findet die früheste Frist", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(fruehesteFrist(th, p!)).toMatch(/^Handlungsrelevant bis: /);
    expect(fruehesteFrist({ ...th, sachverhalte: [] }, p!)).toBe("");
  });
});

describe("F08: Fingerabdruck der Management Summary", () => {
  it("ändert sich mit der Herkunft der Angaben, nicht mit der Freigabe", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const a = ilkaMeldung("Bund");
    a.quellen = "[Q1] A – Betreiber A (2026): Lage [Zugriff: 20.10.2026]";
    const b = structuredClone(a);
    b.quellen = "[Q1] A – Betreiber B (2026): Lage [Zugriff: 20.10.2026]";
    expect(herkunftsliste(a, p)).not.toEqual(herkunftsliste(b, p));
    expect(kurzfassungsFingerabdruck(b, p)).not.toBe(kurzfassungsFingerabdruck(a, p));

    const c = structuredClone(a);
    if (c.freigabe?.freigabe) c.freigabe.freigabe.name = "Jemand";
    expect(kurzfassungsFingerabdruck(c, p)).toBe(kurzfassungsFingerabdruck(a, p));
  });

  it("ändert sich mit der Arbeitsanweisung der Kurzfassung", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = ilkaMeldung("Bund");
    const pfad = p.manifest.anweisungen?.kurzfassung;
    expect(pfad).toBeTruthy();
    const anders = { ...p, dateien: { ...p.dateien, [pfad!]: p.dateien[pfad!] + "\nZusatz." } };
    expect(kurzfassungsFingerabdruck(d, anders)).not.toBe(kurzfassungsFingerabdruck(d, p));
  });
});
