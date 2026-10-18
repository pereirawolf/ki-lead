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

  it("zerlegt die Sammelmappe in Teil A und 17 SOPs", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const ids = p!.sops.map((s) => s.id);
    expect(ids).toContain("teil-a");
    expect(ids.filter((i) => /^sop-\d\d$/.test(i))).toHaveLength(17);
    const teilA = p!.sops.find((s) => s.id === "teil-a")!;
    expect(teilA.gemeinsam).toBe(true);
    const sop08 = p!.sops.find((s) => s.id === "sop-08")!;
    expect(sop08.art_vorschlag).toEqual(["Stromausfall / Blackout"]);
    expect(sopKennung(sop08)).toBe("SOP-LEAD 08 Stromausfall / Blackout v0.4");
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
  ])("%s verhindert die Aktivierung mit verständlichem Fehler", async (_, aendern) => {
    const erg = await mit(aendern);
    expect(erg.profil).toBeNull();
    expect(erg.befunde.some((b) => b.stufe === "fehler" && b.text.startsWith("Darstellungsdatei:"))).toBe(true);
  });
});
