// Fremde Meldungen gegen ein im Profil mitgeliefertes Schema prüfen (seit 0.6.19, TP-2026-W44-59, -60): Laden von
// „meldung.eingang_schemata“, Prüfung im Lagebild, Gebiet aus dem fremden Schema, Weg Land → Bund im Beispielprofil.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { beispielDateien, einlesen, type LagebildDatei } from "../../src/lagebild/lagebild";
import { dateiLesen } from "../../src/pipeline/material";
import { ladeProfil } from "../../src/profil/laden";
import { Marken } from "../../src/ui/lagebild/bausteine";
import { redaktionscheck } from "../../src/lagebild/redaktion";
import { leseOrdner, profil, repoPfad } from "../support/dateien";

const bund = async () => (await profil("lead-beispiel")).profil!;
const saale = async () => beispielDateien((await profil("lead-thueringen")).profil!, "beispiele/hochwasser-saale");
const landesmeldung = async () => (await saale()).find((d) => d.name.includes("_TH_"))!;

async function mitManifest(aendern: (m: any) => void, dateien: Record<string, string> = {}) {
  const d = { ...leseOrdner(repoPfad("profile", "lead-beispiel")), ...dateien };
  const m = JSON.parse(d["profil.json"]!);
  aendern(m);
  d["profil.json"] = JSON.stringify(m);
  return ladeProfil(d);
}

describe("TP-2026-W44-59: Eingangsschemata laden", () => {
  it("das Beispielprofil kennt LEAD-Meldung-Land-v1 mit Gebiet „kreis“ und lädt ohne Befund", async () => {
    const { profil: p, befunde } = await profil("lead-beispiel");
    expect(befunde).toEqual([]);
    expect(Object.keys(p!.eingangSchemata!)).toEqual(["LEAD-Meldung-Land-v1"]);
    expect(p!.eingangSchemata!["LEAD-Meldung-Land-v1"]!.gebiet).toBe("kreis");
  });

  it("falsche Form ist ein Fehler; fehlende oder unbrauchbare Datei, eigenes Schema und abweichende Kennung sind Warnungen", async () => {
    const form = await mitManifest((m) => (m.meldung.eingang_schemata = { X: { gebiet: "kreis" } }));
    expect(form.profil).toBeNull();
    expect(form.befunde.map((b) => b.text).join(" ")).toContain("„meldung.eingang_schemata“ braucht");

    const fehlt = await mitManifest((m) => (m.meldung.eingang_schemata = { "X-v1": { datei: "eingang/fehlt.json" } }));
    expect(fehlt.profil?.eingangSchemata).toBeUndefined();
    expect(fehlt.befunde).toEqual([{ stufe: "warnung", text: expect.stringContaining("Eingangsschema „X-v1“ (eingang/fehlt.json): Datei fehlt") }]);

    const kaputt = await mitManifest((m) => (m.meldung.eingang_schemata = { "X-v1": { datei: "eingang/x.json" } }), { "eingang/x.json": '{"type": 5}' });
    expect(kaputt.befunde.map((b) => b.stufe)).toEqual(["warnung"]);
    expect(kaputt.befunde[0]!.text).toContain("nicht verwendbar");

    const eigen = await mitManifest((m) => (m.meldung.eingang_schemata = { "LEAD-Meldung-v1": { datei: "meldung.schema.json" } }));
    expect(eigen.befunde[0]!.text).toContain("ist das eigene Schema");

    const abweichend = await mitManifest((m) => (m.meldung.eingang_schemata = { "Anders-v1": { datei: "eingang/LEAD-Meldung-Land-v1.schema.json" } }));
    expect(abweichend.befunde[0]!.text).toContain("Schemakennung „LEAD-Meldung-Land-v1“ weicht vom Eintrag „Anders-v1“ ab");
    expect(Object.keys(abweichend.profil!.eingangSchemata!)).toEqual(["Anders-v1"]);
  });
});

describe("TP-2026-W44-59, -60: Prüfung im Lagebild, Weg Land → Bund", () => {
  it("Landes- und Kreismeldungen bleiben fremd, sind aber geprüft und tragen ihr Gebiet", async () => {
    const p = await bund();
    const { eintraege, fehler } = einlesen(await saale(), p);
    expect(fehler).toEqual([]);
    expect(eintraege).toHaveLength(4);
    for (const e of eintraege) {
      expect(e.fremd, e.name).not.toBeNull();
      expect(e.fremdGeprueft, e.name).toBe(true);
      expect(e.schema, e.name).toEqual([]);
    }
    expect(eintraege.find((e) => e.name.includes("_TH_"))!.fremd!.land).toBe("Thüringen");
    expect(eintraege.find((e) => e.name.includes("_J_"))!.fremd!.land).toBe("Stadt Jena");
  });

  it("eine fehlerhafte Landesmeldung zeigt ihre Befunde; ein unbekanntes Schema bleibt ungeprüft", async () => {
    const p = await bund();
    const d = JSON.parse((await landesmeldung()).text);
    d.kreis = "Bayern";
    delete d.freigabe;
    const unbekannt = { schema: "Andere-Meldung-v3", meldende_stelle: "Lagezentrum X", sachverhalte: [{ titel: "Hochwasser" }] };
    const datei = (name: string, o: unknown): LagebildDatei => ({ name, text: JSON.stringify(o), importiertAm: "2026-10-28T14:00:00Z" });
    const { eintraege } = einlesen([datei("land.json", d), datei("fremd.json", unbekannt)], p);
    expect(eintraege[0]!.fremdGeprueft).toBe(true);
    expect(eintraege[0]!.schema.length).toBeGreaterThanOrEqual(2);
    expect(eintraege[1]!.fremdGeprueft).toBeUndefined();
    expect(eintraege[1]!.schema).toEqual([]);
    // Marken: geprüft mit Befunden rot, ohne Befund grün, ungeprüft grau wie bisher
    const marke = (i: number) => renderToStaticMarkup(createElement(Marken, { e: eintraege[i]!, profil: p, eigen: false }));
    expect(marke(0)).toContain(`fremdes Schema: ${eintraege[0]!.schema.length}`);
    expect(marke(1)).toContain(">fremdes Schema<");
    // Redaktionscheck: Befunde der geprüften fremden Meldung sind zu klären, die ungeprüfte bleibt ein Hinweis
    const r = redaktionscheck(eintraege, p, "2026-11-04", new Date("2026-10-28T15:00:00+01:00"));
    const q = (name: string) => r.quellen.find((x) => x.eintrag.name === name)!;
    expect(q("land.json").klasse).toBe("alert");
    expect(q("land.json").zeilen.filter((z) => z.startsWith("Schema: "))).toHaveLength(eintraege[0]!.schema.length);
    expect(q("fremd.json").klasse).toBe("info");
    expect(q("fremd.json").zeilen).toHaveLength(1);
    const ok = einlesen([await landesmeldung()], p).eintraege[0]!;
    expect(renderToStaticMarkup(createElement(Marken, { e: ok, profil: p, eigen: false }))).toContain("fremdes Schema ✓");
  });

  it("als Material der Verdichtung im Beispielprofil: Eingangsmeldung des Landes Thüringen", async () => {
    const p = await bund();
    const d = await landesmeldung();
    const m = await dateiLesen(new File([d.text], d.name), p);
    expect(m.eingang).toMatchObject({ land: "Thüringen", stelle: "Lagezentrum des Landes (Beispiel) – Redaktionskonferenz", schema: "LEAD-Meldung-Land-v1" });
  });
});
