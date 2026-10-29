// Kopplung der Arbeitsanweisungen des Beispielprofils an den Code (seit 0.6.4, TP-2026-W44-35): Zahlen, Beispiele und
// Vokabular, die die App auswertet oder selbst erzeugt, stehen in den Anweisungen so, wie die App sie verwendet.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { GRENZEN, fristen } from "../../src/pipeline/kurzfassung";
import { steuerungsBlock, type RechercheModus, type Steuerung } from "../../src/pipeline/kontext";
import { kodierleitfadenKennung } from "../../src/pipeline/nachbearbeitung";
import { parseQuellen, quellenHinweise } from "../../src/kern/quellen";
import { pruefeRoh } from "../../src/kern/validierung";

const ZAHLWORT: Record<number, string> = { 1: "einen", 2: "zwei", 3: "drei" };

async function beispiel() {
  const p = (await profil("lead-beispiel")).profil!;
  const datei = (art: "erfassung" | "kurzfassung" | "verdichtung") => p.dateien[p.manifest.anweisungen![art]!]!;
  return { p, datei };
}

describe("Kopplung der Arbeitsanweisungen an den Code (TP-2026-W44-35)", () => {
  it("TP-2026-W44-35: die Richtwerte der Kurzfassung stehen so in der Arbeitsanweisung wie in GRENZEN", async () => {
    const text = (await beispiel()).datei("kurzfassung");
    expect(text).toContain(`rund ${GRENZEN.woerterZiel} Wörter`);
    expect(text).toContain(`höchstens ${GRENZEN.woerterGesamt}`);
    expect(text).toContain(`höchstens ${GRENZEN.woerterJeSatz} Wörter`);
    expect(text).toContain(`mehr als ${GRENZEN.woerterSatzHinweis} Wörtern`);
    expect(text).toContain(`höchstens ${ZAHLWORT[GRENZEN.saetzeJeAbschnitt]} Sätze`);
  });

  it("TP-2026-W44-35: die Arbeitsmodi der Erfassung tragen die Begriffe des Steuerungsblocks", async () => {
    const text = (await beispiel()).datei("erfassung");
    const zeilen = text
      .slice(text.indexOf("| Modus | Vorgehen |"))
      .split("\n")
      .filter((z) => z.startsWith("| ") && !z.startsWith("| Modus") && !z.startsWith("|---"))
      .slice(0, 3)
      .map((z) => z.split("|")[1]!.trim());
    expect(zeilen).toHaveLength(3);
    // Kennwort je Modus (Soll): so nennt der Steuerungsblock den Modus
    const KENNWORT: Record<RechercheModus, string> = { durchfuehren: "durchführen", "nur-material": "abgeschaltet", "keine-werkzeuge": "nicht verfügbar" };
    const basis: Steuerung = {
      jetzt: "2026-10-14T10:00",
      t0: "2026-10-14T10:00",
      stichtag: "2026-10-14",
      zone: "Europe/Berlin",
      vormeldungStand: "",
      vormeldung: false,
      verdichtung: false,
      recherche: "durchfuehren",
      websucheMax: 5,
      abrufMax: 5,
    };
    for (const [modus, wort] of Object.entries(KENNWORT) as [RechercheModus, string][]) {
      const zeile = steuerungsBlock({ ...basis, recherche: modus })
        .split("\n")
        .find((z) => z.startsWith("- Recherche:"))!;
      expect(zeile, modus).toContain(wort);
      expect(
        zeilen.filter((z) => z.includes(wort)),
        modus,
      ).toHaveLength(1);
    }
  });

  it("TP-2026-W44-35: die Beispielzeile „Handlungsrelevant bis:“ aus Teil A, A.4, ergibt eine Frist mit Uhrzeit und Bedingung", async () => {
    const { p } = await beispiel();
    const teilA = p.sops.find((s) => s.gemeinsam)!.text;
    const zeile = teilA.match(/„(Handlungsrelevant bis: [^“]+)“/)![1]!;
    const meldung = { sachverhalte: [{ sofort: { bewertung_text: `Kernaussage.\n${zeile}` } }], meldezeitpunkt: "2026-10-09T08:00" };
    const f = fristen(meldung as any, p);
    expect(f).toHaveLength(1);
    expect(f[0]!.datum.toISOString()).toBe("2026-10-09T10:00:00.000Z"); // 12:00 MESZ
    expect(f[0]!.text).toContain("vor Beginn des Sturmflutscheitels");
    expect(f[0]!.text).not.toContain("Grundlage");
  });

  it("TP-2026-W44-35: die Beispieleinträge im Kodierleitfaden, Abschnitt 5, sind gültige Quelleneinträge ohne Befund", async () => {
    const { p } = await beispiel();
    const kl = p.dateien[p.manifest.kodierleitfaden!]!;
    const block = kl.slice(kl.indexOf("**Format im Feld")).match(/```\n([\s\S]*?)```/)![1]!;
    const eintraege = parseQuellen(block);
    expect(eintraege.map((e) => e.nr)).toEqual([1, 2, 3, 4]);
    expect(eintraege.every((e) => e.code in p.ui.quellen!.kategorien)).toBe(true);
    const meldung = { quellen: block.trim(), sachverhalte: [{ analyse: { lage_ereignis: "Stand [Q1–Q4]." }, sofort: { bewertung_text: "" } }] };
    expect(quellenHinweise(meldung as any, p.ui)).toEqual([]);
  });

  it("TP-2026-W44-35: das _entstehung-Beispiel der Erfassung passt zum Schema und zur Kennung, die die App setzt", async () => {
    const { p, datei } = await beispiel();
    const text = datei("erfassung");
    const json = text.match(/```json\n("_entstehung"[\s\S]*?)```/)![1]!;
    const beispielwert = JSON.parse(`{${json}}`)._entstehung;
    expect(beispielwert.kodierleitfaden).toBe(kodierleitfadenKennung(p));
    // Gegen das Teilschema von _entstehung (Pflichtfelder der Meldung spielen hier keine Rolle)
    const schema = { ...(p.schema as any).$defs.entstehung, $defs: (p.schema as any).$defs };
    expect(pruefeRoh(schema, beispielwert)).toEqual([]);
  });
});
