// Verdichtung von Eingangsmeldungen: ohne Websuche, t0 aus den Eingängen und t0-Absicherung (0.4.19).
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaEingaenge, ilkaMeldung } from "../support/fixtures";
import { llmAntwort, skriptAnbieter } from "../support/anbieter";
import { pipelineKontext, s1Vorschlag } from "../support/pipeline";
import { eingangsquellenPruefen } from "../../src/pipeline/vermerke";
import { stufe1, T0_SPIELRAUM_STUNDEN } from "../../src/pipeline/s1";
import { stufe2und3 } from "../../src/pipeline/s2s3";
import { dateiLesen, type Material } from "../../src/pipeline/material";

describe("Verdichtung von Eingangsmeldungen", () => {
  it("verdichtet ohne Websuche, mit t0 aus den Eingängen und verbindlicher Gliederung", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const eingaenge: Material[] = [];
    for (const x of ilkaEingaenge()) eingaenge.push(await dateiLesen(new File([JSON.stringify(x.daten)], x.name), p!));
    const ohneT0 = {
      ...s1Vorschlag(),
      meldezeitpunkt: "",
      sachverhalte: [{ ...s1Vorschlag().sachverhalte[0], eingangsmeldungen: [eingaenge[0].name, "unbekannt.json"] }],
    };
    const bund = ilkaMeldung("Bund");
    const att = skriptAnbieter([llmAntwort(JSON.stringify(ohneT0)), llmAntwort("Kurz.\n```json\n" + JSON.stringify(bund) + "\n```")]);
    const { k } = await pipelineKontext(att, eingaenge);
    k.lauf.auftrag.websuche = false;
    const v = await stufe1(k);
    expect(att.anfragen[0].system[0].text).toContain("Verdichtung von Eingangsmeldungen");
    expect((att.anfragen[0].jsonSchema as any).properties.sachverhalte.items.properties.eingangsmeldungen.items.enum).toHaveLength(6);
    expect(v.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(v.sachverhalte[0].eingangsmeldungen).toEqual([eingaenge[0].name]);
    const e = await stufe2und3(k, v);
    const s2 = att.anfragen[1];
    expect(s2.werkzeuge).toBeUndefined();
    // Seit 0.6.4 (TP-2026-W44-31) Verdichtung im Block der Arbeitsanweisung, Vermerke im laufabhängigen Schlussblock
    expect(s2.system).toHaveLength(5);
    expect(s2.system[3].text).toContain("Referenzraum wechselt");
    expect(s2.modell).toBe("claude-opus-5-5"); // Rolle „verdichtung“ aus dem Profil
    expect(k.lauf.stufen.find((x) => x.stufe === "S2 Verdichtung")).toBeTruthy();
    // Redaktionsvermerke der App aus dem Lagebild-Check
    expect(s2.system[4].text).toContain("Vermerke der App aus dem Redaktionscheck");
    expect(s2.system[4].text.indexOf("Vermerke der App")).toBeLessThan(s2.system[4].text.indexOf("Steuerung durch die App"));
    expect(s2.system[4].text).toMatch(/Stromausfall \/ Blackout: .*→ Bewertungen weichen ab/);
    // Steuerungsblock zuletzt: Bearbeitungszeit (Testuhr) getrennt von t0, Recherche vom Auftrag abgeschaltet
    expect(s2.system[4].text).toContain("Steuerung durch die App (verbindlich)");
    expect(s2.system[4].text).toContain("Bearbeitungszeitpunkt (Europe/Berlin): 2026-10-14 10:00");
    expect(s2.system[4].text).toContain("Meldezeitpunkt t0 der neuen Meldung: 2026-10-14 11:00");
    expect(s2.system[4].text).toContain("abgeschaltet");
    expect(s2.system[3].text).not.toContain("Aktueller Zeitpunkt");
    expect(JSON.stringify(att.anfragen[0].nachrichten)).toContain("Vermerke der App");
    expect(JSON.stringify(s2.nachrichten)).toContain("genau 1 Sachverhalt");
    expect(e.meldung!.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(k.lauf.ergebnis!.befunde.some((b) => /bestätigt waren 1/.test(b.text))).toBe(false);
    expect(eingangsquellenPruefen(eingaenge, e.meldung!, p!).map((x) => x.status)).toEqual(Array(6).fill("nachgewiesen"));
    expect(k.lauf.ergebnis!.befunde.some((b) => /Quellenverzeichnis/.test(b.text))).toBe(false);
  });
});

describe("S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19)", () => {
  async function eingaengeLesen(): Promise<Material[]> {
    const { profil: p } = await profil("lead-beispiel");
    const out: Material[] = [];
    for (const x of ilkaEingaenge()) out.push(await dateiLesen(new File([JSON.stringify(x.daten)], x.name), p!));
    return out;
  }

  it("Verdichtung: setzt einen t0 weit nach dem jüngsten Eingang auf den Eingang zurück und sagt es", async () => {
    const eingaenge = await eingaengeLesen();
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-20T22:30" }))]);
    const { k } = await pipelineKontext(att, eingaenge);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(v.appHinweise).toHaveLength(1);
    expect(v.appHinweise![0]).toContain("14.10.2026, 11:00 Uhr");
    expect(v.appHinweise![0]).toContain("20.10.2026, 22:30 Uhr");
    expect(v.appHinweise![0]).toContain(`mehr als ${T0_SPIELRAUM_STUNDEN} Stunden danach`);
  });

  it("Verdichtung: setzt einen t0 vor dem jüngsten Eingang ebenfalls zurück", async () => {
    const eingaenge = await eingaengeLesen();
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-14T08:00" }))]);
    const { k } = await pipelineKontext(att, eingaenge);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T11:00");
    expect(v.appHinweise![0]).toContain("vor dem jüngsten Eingang");
  });

  it("Verdichtung: lässt einen t0 kurz nach dem jüngsten Eingang stehen", async () => {
    const eingaenge = await eingaengeLesen();
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-14T12:00" }))]);
    const { k } = await pipelineKontext(att, eingaenge);
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T12:00");
    expect(v.appHinweise).toBeUndefined();
  });

  it("Verdichtung: ein t0 in der Zukunft wird auf die aktuelle Zeit gesetzt, wenn der Eingang davor liegt (0.4.28)", async () => {
    const eingaenge = await eingaengeLesen();
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-14T23:00" }))]);
    const { k } = await pipelineKontext(att, eingaenge, { jetzt: "2026-10-14T12:00:00+02:00" });
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-14T12:00");
    expect(v.appHinweise![0]).toContain("lag in der Zukunft");
  });

  it("Verdichtung: ein im Auftrag vorgegebener t0 geht der Absicherung vor", async () => {
    const eingaenge = await eingaengeLesen();
    const att = skriptAnbieter([llmAntwort(JSON.stringify({ ...s1Vorschlag(), meldezeitpunkt: "2026-10-14T12:00" }))]);
    const { k } = await pipelineKontext(att, eingaenge);
    k.lauf.auftrag.meldezeitpunkt = "2026-10-20T22:30";
    const v = await stufe1(k);
    expect(v.meldezeitpunkt).toBe("2026-10-20T22:30");
    expect(v.appHinweise).toBeUndefined();
  });
});
