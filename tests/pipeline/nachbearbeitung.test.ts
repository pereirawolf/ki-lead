// Nachbearbeitung eines KI-Entwurfs: Meldungsidentität (F03) und Lagenradar an der vorgesehenen Stelle.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { llmAntwort, skriptAnbieter } from "../support/anbieter";
import { bestaetigterVorschlag, pipelineKontext } from "../support/pipeline";
import { nachbearbeiten, radarUmhaengen } from "../../src/pipeline/nachbearbeitung";
import { stufe2und3 } from "../../src/pipeline/s2s3";
import { pruefeGegenSchema } from "../../src/kern/validierung";

const he = ilkaMeldung("HE");
/** Beispielmeldung mit dem Radar eine Ebene zu hoch, wie in 4 von 13 Entwürfen der Testreihe */
function mitRadarZuHoch(): any {
  const m = structuredClone(he);
  m.sachverhalte[0].lagenradar = m.sachverhalte[0].sofort.lagenradar;
  delete m.sachverhalte[0].sofort.lagenradar;
  return m;
}

/** Kontext wie in der Testreihe: Uhr 14:00, Auftrag nur mit Sachverhalt */
const WIE_TESTREIHE = { jetzt: "2026-10-14T14:00:00+02:00", auftrag: { sachverhalt: "Orkan", stichworte: "" } };

describe("Meldungsidentität (F03) und eigene Stelle (F07)", () => {
  it("setzt Land und meldende Stelle eines KI-Entwurfs auf die eigene Stelle und meldet die Korrektur", async () => {
    const { nachbearbeiten } = await import("../../src/pipeline/nachbearbeitung");
    const { k } = await pipelineKontext(skriptAnbieter([]));
    const korrekturen: string[] = [];
    const m = nachbearbeiten(structuredClone(he), k, "x", korrekturen);
    expect(m.land).toBe("Bund");
    expect(m.meldende_stelle).toBe("Koordinierungsstelle (Beispiel)");
    expect(korrekturen).toHaveLength(2);
    expect(korrekturen[0]).toMatch(/^land: „Hessen“ → „Bund“/);
    const alias = nachbearbeiten(
      { ...structuredClone(he), land: "Bund", meldende_stelle: "Koordinierungsstelle (Beispiel) – Redaktionskonferenz" },
      k,
      "x",
      ((korrekturen.length = 0), korrekturen),
    );
    expect(alias.meldende_stelle).toBe("Koordinierungsstelle (Beispiel) – Redaktionskonferenz");
    expect(korrekturen).toEqual([]);
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
    const att = skriptAnbieter([llmAntwort("Kurz.\n```json\n" + JSON.stringify(mitRadarZuHoch()) + "\n```")]);
    const { k } = await pipelineKontext(att, [], WIE_TESTREIHE);
    k.lauf.auftrag.websuche = false;
    const e = await stufe2und3(k, bestaetigterVorschlag() as any);
    expect(att.anfragen).toHaveLength(1);
    expect(e.schemaBefunde).toEqual([]);
    expect(e.befunde.some((b) => b.stufe === "hinweis" && /Von der App korrigiert: Sachverhalt 1: Lagenradar/.test(b.text))).toBe(true);
    const m = nachbearbeiten(mitRadarZuHoch(), k, "x");
    expect(pruefeGegenSchema(k.profil.schema, m, k.profil.ui)).toEqual([]);
  });
});
