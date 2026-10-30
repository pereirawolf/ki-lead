// Vorlage – eigene Organisation (profile/muster, seit Profil 0.5.0, KP-2026-W43-60): führt die Bestandteile des
// Beispielprofils als Gerüst, damit sie nicht wieder unbemerkt veraltet. Soll: Manifestfelder, SOP-Kopfschlüssel
// zur Pflege und Abschnittsgliederung der Dach-SOPs, wie sie das Beispielprofil verwendet; Platzhalter nur in
// eckigen Klammern; Lizenz CC0 1.0.
import { describe, expect, it } from "vitest";
import { leseOrdner, profil, repoPfad } from "../support/dateien";
import { ladeProfil } from "../../src/profil/laden";

const beispiel = leseOrdner(repoPfad("profile", "lead-beispiel"));
const vorlage = leseOrdner(repoPfad("profile", "muster"));
const manifest = (d: Record<string, string>) => JSON.parse(d["profil.json"]);

/** YAML-Schlüssel des ersten Codeblocks einer SOP-Datei */
const kopfSchluessel = (text: string) =>
  (text.match(/```yaml\n([\s\S]*?)```/)?.[1] ?? "")
    .split("\n")
    .map((z) => z.match(/^([a-z_]+):/)?.[1])
    .filter((k): k is string => !!k);
/** Abschnittsüberschriften „### n. …“ einer SOP-Datei */
const abschnitte = (text: string) => text.split("\n").filter((z) => /^### \d\. /.test(z));

/** Pflegeschlüssel, die jede Dach-SOP führt (Beispielprofil, Teil A, A.10.2) */
const PFLEGE = [
  "kennung",
  "typ",
  "lageart",
  "art_vorschlag",
  "zweck",
  "version",
  "status",
  "stand",
  "pflegeverantwortlich",
  "quellen_geprueft_am",
  "naechste_pruefung_faellig",
  "pruefausloeser",
];

describe("Vorlage – eigene Organisation (KP-2026-W43-60)", () => {
  it("lädt ohne Fehler und Warnungen, mit einer Dach-SOP als Inhaltsgerüst", async () => {
    const { profil: p, befunde } = await profil("muster");
    expect(befunde.filter((b) => b.stufe === "fehler" || b.stufe === "warnung")).toEqual([]);
    expect(p!.manifest.name).toBe("Vorlage – eigene Organisation");
    expect(p!.sops.map((s) => s.id)).toEqual(["teil-a", "b01"]);
    expect(p!.sops.find((s) => s.id === "b01")!.status).toMatch(/^Inhaltsgerüst/);
  });

  it("führt die Manifestfelder, die auch das Beispielprofil zur Beschreibung, Lizenz und SOP-Sammlung nutzt", () => {
    const b = manifest(beispiel);
    const v = manifest(vorlage);
    for (const k of [
      "format",
      "id",
      "name",
      "beschreibung",
      "version",
      "herausgeber",
      "lizenz",
      "ebene",
      "referenzraum",
      "variablen",
      "meldung",
      "anweisungen",
      "sop",
      "kodierleitfaden",
      "modelle",
    ]) {
      expect(b, `Beispielprofil: ${k}`).toHaveProperty(k);
      expect(v, `Vorlage: ${k}`).toHaveProperty(k);
    }
    expect(v.sop.teil_gemeinsam).toBe(b.sop.teil_gemeinsam);
    expect(Object.keys(v.variablen)).toEqual(expect.arrayContaining(["meldende_stelle", "kurzname", "zeitzone", "meldetakt", "lageprodukt"]));
  });

  it("die Dach-SOP der Vorlage hat die Pflegeschlüssel und die fünf Abschnitte jeder Dach-SOP des Beispielprofils", () => {
    const beispielSops = Object.entries(beispiel).filter(([pfad]) => pfad.startsWith("sop/teil-b/"));
    expect(beispielSops.length).toBeGreaterThan(0);
    const b01 = vorlage["sop/teil-b/B01_lageart.md"];
    expect(kopfSchluessel(b01)).toEqual(PFLEGE);
    for (const [pfad, text] of beispielSops) {
      expect(kopfSchluessel(text), pfad).toEqual(expect.arrayContaining(PFLEGE));
      expect(abschnitte(b01), pfad).toEqual(abschnitte(text));
    }
  });

  it("Platzhalter stehen nur in eckigen Klammern; Profilvariablen sind alle belegt", async () => {
    const { befunde } = await profil("muster");
    expect(befunde.filter((b) => /Platzhalter/.test(b.text))).toEqual([]);
    for (const [pfad, text] of Object.entries(vorlage)) {
      expect(text, pfad).not.toMatch(/<[A-ZÄÖÜ][^>]*>|\bTODO\b|\bXXX\b/);
      if (pfad.endsWith(".md")) expect(text, pfad).toMatch(/\[[A-ZÄÖÜ][^\]]*\]/);
    }
  });

  it("ZS-2026-W44-07: führt Zeitstrahl, Kennung und Bezug des Beispielprofils als Gerüst und nennt sie im README", async () => {
    // Soll: Profilformat 1.23 (docs/PROFILFORMAT.md) – optionale Rollen und Abschnitte, die das Beispielprofil verwendet
    const ub = JSON.parse(beispiel["meldung.ui.json"]);
    const uv = JSON.parse(vorlage["meldung.ui.json"]);
    const sv = JSON.parse(vorlage["meldung.schema.json"]);
    for (const rolle of ["zeitstrahl", "sv_kennung", "sv_bezug"]) {
      expect(ub.rollen, `Beispielprofil: ${rolle}`).toHaveProperty(rolle);
      expect(uv.rollen, `Vorlage: ${rolle}`).toHaveProperty(rolle);
    }
    expect(sv.properties).toHaveProperty(uv.rollen.zeitstrahl);
    expect(sv.properties.sachverhalte.items.properties).toHaveProperty(uv.rollen.sv_kennung);
    expect(sv.properties.sachverhalte.items.properties).toHaveProperty(uv.rollen.sv_bezug);
    expect(uv.zeitstrahl.typen).toEqual(ub.zeitstrahl.typen);
    expect(uv.kennung).toHaveProperty("standard");
    const { befunde } = await profil("muster");
    expect(befunde.filter((b) => b.code === "ZEITSTRAHL_OHNE_KENNUNG")).toEqual([]);
    for (const r of ["`zeitstrahl`", "`sv_kennung`", "`sv_bezug`"]) expect(vorlage["README.md"], r).toContain(r);
  });

  it("steht unter CC0 1.0 und nennt das im README und im Änderungsverlauf", () => {
    expect(manifest(vorlage).lizenz).toBe("CC0-1.0");
    expect(vorlage["README.md"]).toContain("CC0 1.0");
    expect(vorlage["CHANGELOG.md"]).toContain("CC0 1.0");
  });
});

describe("Pflichtkennsätze (TP-2026-W44-27)", () => {
  /** Soll nach Profilformat 1.20: Kennsätze, die die App selbst auswertet */
  const PFLICHT = ["handlungsrelevant", "aenderung", "abweichung"];

  it.each(["muster", "lead-beispiel"])(
    "TP-2026-W44-27: %s liefert alle von der App erwarteten Kennsatz-Schlüssel und lädt ohne Kennsatzwarnung",
    async (name) => {
      const d = leseOrdner(repoPfad("profile", name));
      const ui = JSON.parse(d["meldung.ui.json"]);
      for (const k of PFLICHT) expect(String(ui.kennsaetze?.[k] ?? "").trim(), `${name}: ${k}`).not.toBe("");
      const { befunde } = await profil(name);
      expect(befunde.filter((b) => b.code === "KENNSATZ_FEHLT")).toEqual([]);
    },
  );

  it("TP-2026-W44-27: fehlt ein Pflichtkennsatz, meldet die App ihn beim Laden als Warnung; das Profil bleibt nutzbar", async () => {
    for (const fehlt of PFLICHT) {
      const d = { ...vorlage };
      const ui = JSON.parse(d["meldung.ui.json"]);
      delete ui.kennsaetze[fehlt];
      d["meldung.ui.json"] = JSON.stringify(ui);
      const { profil: p, befunde } = await ladeProfil(d);
      expect(p, fehlt).not.toBeNull();
      const w = befunde.filter((b) => b.code === "KENNSATZ_FEHLT");
      expect(w, fehlt).toHaveLength(1);
      expect(w[0]).toMatchObject({ stufe: "warnung" });
      expect(w[0]!.text).toContain(`„${fehlt}“`);
    }
    // ohne Abschnitt „kennsaetze“: je Pflichtkennsatz eine Warnung
    const d = { ...vorlage };
    const ui = JSON.parse(d["meldung.ui.json"]);
    delete ui.kennsaetze;
    d["meldung.ui.json"] = JSON.stringify(ui);
    expect((await ladeProfil(d)).befunde.filter((b) => b.code === "KENNSATZ_FEHLT")).toHaveLength(3);
  });
});
