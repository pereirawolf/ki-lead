// Vorlage – eigene Organisation (profile/muster, seit Profil 0.5.0, KP-2026-W43-60): führt die Bestandteile des
// Beispielprofils als Gerüst, damit sie nicht wieder unbemerkt veraltet. Soll: Manifestfelder, SOP-Kopfschlüssel
// zur Pflege und Abschnittsgliederung der Dach-SOPs, wie sie das Beispielprofil verwendet; Platzhalter nur in
// eckigen Klammern; Lizenz CC0 1.0.
import { describe, expect, it } from "vitest";
import { leseOrdner, profil, repoPfad } from "../support/dateien";

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

  it("steht unter CC0 1.0 und nennt das im README und im Änderungsverlauf", () => {
    expect(manifest(vorlage).lizenz).toBe("CC0-1.0");
    expect(vorlage["README.md"]).toContain("CC0 1.0");
    expect(vorlage["CHANGELOG.md"]).toContain("CC0 1.0");
  });
});
