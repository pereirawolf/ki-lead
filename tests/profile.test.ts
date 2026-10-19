import { describe, expect, it } from "vitest";
import { profil } from "./hilfen";
import { sopKennung } from "../src/profil/sop";
import { ersetzePlatzhalter } from "../src/profil/platzhalter";
import { leererWert } from "../src/kern/schema";
import { pruefeGegenSchema } from "../src/kern/validierung";

describe("Beispielprofil LEAD", () => {
  it("lädt ohne Fehler und ohne Warnungen", async () => {
    const { profil: p, befunde } = await profil("lead-beispiel");
    expect(p).not.toBeNull();
    expect(befunde.filter((b) => b.stufe !== "hinweis")).toEqual([]);
  });

  it("zerlegt die Sammelmappe in Teil A, 17 SOPs und Bausteine", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const ids = p!.sops.map((s) => s.id);
    expect(ids).toContain("teil-a");
    expect(ids.filter((i) => /^sop-\d\d$/.test(i))).toHaveLength(17);
    const teilA = p!.sops.find((s) => s.id === "teil-a")!;
    expect(teilA.gemeinsam).toBe(true);
    const sop08 = p!.sops.find((s) => s.id === "sop-08")!;
    expect(sop08.art_vorschlag).toEqual(["Stromausfall / Blackout"]);
    expect(sopKennung(sop08)).toBe("SOP-LEAD 08 Stromausfall / Blackout v2.0");
  });

  it("führt Bausteine aus Teil C ohne eigene Ereignisart", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const bausteine = p!.sops.filter((s) => s.id.startsWith("baustein-"));
    expect(bausteine.length).toBeGreaterThanOrEqual(17);
    // Bausteine werden nicht automatisch über eine Ereignisart vorgeschlagen
    expect(bausteine.every((s) => !s.art_vorschlag)).toBe(true);
    const n02 = bausteine.find((s) => s.id === "baustein-n02")!;
    expect(n02.nummer).toBe("N02");
    expect(sopKennung(n02)).toBe("SOP-LEAD N02 Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit v1.0");
  });

  it("kennt die Quellenkategorien A/B/W/M/P in dieser Rangfolge", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(p!.ui.quellen!.rangfolge).toEqual(["A", "B", "W", "M", "P"]);
    expect(Object.keys(p!.ui.quellen!.kategorien).sort()).toEqual(["A", "B", "M", "P", "W"]);
    expect(p!.dateien["kodierleitfaden.md"]).toContain("## 5. Quellenkategorien A/B/W/M/P");
  });

  it("jede Ereignisart des Schemas hat eine SOP", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const katalog: string[] = p!.schema.$defs.sachverhalt.properties.art.items.enum;
    const abgedeckt = new Set(p!.sops.flatMap((s) => s.art_vorschlag || []));
    expect(katalog.filter((a) => !abgedeckt.has(a))).toEqual([]);
  });

  it("ersetzt alle Platzhalter der Arbeitsanweisung", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const text = p!.dateien[p!.manifest.anweisungen!.erfassung!];
    const { text: fertig, offen } = ersetzePlatzhalter(text, {
      profil: { ...p!.manifest.variablen, referenzraum: p!.manifest.referenzraum },
      auftrag: { sachverhalt: "x", ausgangsquellen: "y", stichtag: "z", prueffrage: "keine", ereignisarten: "frei" },
      app: { ausgabevertrag: "" },
      jetzt: "2026-10-17T20:00",
    });
    expect(offen).toEqual([]);
    expect(fertig).toContain("`land` ist `Bund`");
    expect(fertig).not.toMatch(/\{\{/);
  });

  it("eine leere Meldung ist als Entwurf schemakonform", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const leer = leererWert(p!.schema, p!.schema);
    leer._status = "Entwurf";
    expect(pruefeGegenSchema(p!.schema, leer, p!.ui)).toEqual([]);
  });
});

describe("Musterprofil", () => {
  it("lädt mit eigenem Schema ohne Länderliste", async () => {
    const { profil: p, befunde } = await profil("muster");
    expect(p!.manifest.meldung.schema_id).toBe("Muster-LEAD-Meldung-v1");
    expect(befunde.filter((b) => b.stufe === "fehler" || b.stufe === "warnung")).toEqual([]);
    const leer = leererWert(p!.schema, p!.schema);
    expect(pruefeGegenSchema(p!.schema, leer, p!.ui)).toEqual([]);
  });
});

describe("Strukturprüfung der Darstellungsdatei", async () => {
  const { leseOrdner } = await import("./hilfen");
  const { join } = await import("node:path");
  const { ladeProfil } = await import("../src/profil/laden");
  const mit = async (aendern: (ui: any) => void) => {
    const d = leseOrdner(join(__dirname, "..", "profile", "muster"));
    const ui = JSON.parse(d["meldung.ui.json"]);
    aendern(ui);
    d["meldung.ui.json"] = JSON.stringify(ui);
    return ladeProfil(d);
  };
  it.each([
    ["leere Schritte", (ui: any) => (ui.schritte = [])],
    ["fehlende Rolle", (ui: any) => delete ui.rollen.sachverhalte],
    ["falsch typisierte Rolle", (ui: any) => (ui.rollen.sv_analysefelder = "lage")],
    ["Radar ohne max", (ui: any) => ((Object.values(ui.radare)[0] as any).max = "6")],
    ["Felder kein Objekt", (ui: any) => (ui.felder = [])],
    ["ungültiger Ausdruck in der Gliederung", (ui: any) => (ui.analyse_gliederung = { absatz: ["Szenario („"] })],
    ["Gliederung mit falschem kurzlabel", (ui: any) => (ui.bewertung_gliederung = { kurzlabel: 12 })],
    ["Quellenkategorie mit mehreren Buchstaben", (ui: any) => (ui.quellen.kategorien.AB = "x")],
    ["Rangfolge mit unbekannter Kategorie", (ui: any) => (ui.quellen.rangfolge = ["A", "B", "W", "M", "P", "X"])],
    ["Rangfolge ohne alle Kategorien", (ui: any) => (ui.quellen.rangfolge = ["A", "W"])],
    ["Rangfolge mit doppelter Kategorie", (ui: any) => (ui.quellen.rangfolge = ["A", "A", "B", "W", "M", "P"])],
  ])("%s verhindert die Aktivierung mit verständlichem Fehler", async (_, aendern) => {
    const erg = await mit(aendern);
    expect(erg.profil).toBeNull();
    expect(erg.befunde.some((b) => b.stufe === "fehler" && b.text.startsWith("Darstellungsdatei:"))).toBe(true);
  });
});
