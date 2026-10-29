// Auftragsfelder der KI-Erfassung: Die Neufassung der Beschriftungen ändert die Anfrage an die KI nicht.
// Befunde KP-2026-W43-61 bis -68 (Prüfung der Eingabemaske vom 25.10.2026): Beschriftung, Hilfetext und Platzhalter
// sind reine Oberfläche; die Bezeichnungen im Prompt und die Übergabe der Werte bleiben wie bisher.
import { describe, expect, it } from "vitest";
import { llmAntwort, skriptAnbieter } from "../support/anbieter";
import { AUFTRAGS_URL, pipelineKontext, s1Vorschlag } from "../support/pipeline";
import { stufe1 } from "../../src/pipeline/s1";
import { materialBloecke, materialUebersicht } from "../../src/pipeline/material";

/** Alle Textblöcke der ersten Nutzernachricht, in Reihenfolge */
function nutzertext(inhalt: unknown): string {
  if (typeof inhalt === "string") return inhalt;
  return (inhalt as { type: string; text?: string }[])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

describe("KP-2026-W43-61: Auftragsfelder gehen unverändert an die KI", () => {
  it("S1 nennt den Untersuchungsgegenstand weiter als „Sachverhalt und Erkenntnisinteresse“", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att, [], { auftrag: { sachverhalt: "Orkan in Hessen", stichworte: "Sturm, Bahn", prueffrage: "" } });
    await stufe1(k);
    const text = nutzertext(att.anfragen[0].nachrichten[0].content);
    expect(text).toContain("Sachverhalt und Erkenntnisinteresse: Orkan in Hessen");
    expect(text).toContain("Besondere Prüffrage: keine");
  });

  it("leerer Untersuchungsgegenstand: Hinweis an die KI wie bisher", async () => {
    const att = skriptAnbieter([llmAntwort(JSON.stringify(s1Vorschlag()))]);
    const { k } = await pipelineKontext(att, [], { auftrag: { sachverhalt: "  " } });
    await stufe1(k);
    expect(nutzertext(att.anfragen[0].nachrichten[0].content)).toContain("Sachverhalt und Erkenntnisinteresse: (nicht angegeben, aus dem Material ableiten)");
  });
});

describe("KP-2026-W43-62: Ausgangsinformationen bleiben Material", () => {
  it("Stichworte stehen als eigener Block vor den Webseiten", () => {
    const bloecke = materialBloecke([], [AUFTRAGS_URL], "  – Dieselengpässe (unbestätigt)\n– Tankstelle ohne Strom  ");
    expect(bloecke).toEqual([
      {
        type: "text",
        text: `<stichworte>\n– Dieselengpässe (unbestätigt)\n– Tankstelle ohne Strom\n</stichworte>\n\n<urls hinweis="Bitte abrufen und auswerten">\n${AUFTRAGS_URL}\n</urls>`,
      },
    ]);
  });

  it("Übersicht für {{auftrag.ausgangsquellen}} unverändert", () => {
    expect(materialUebersicht([], [AUFTRAGS_URL], "Sturm")).toBe(`Stichworte der anfragenden Person; ${AUFTRAGS_URL}`);
    expect(materialUebersicht([], [], "")).toBe("keine; eigene Recherche in offenen Quellen");
  });
});
