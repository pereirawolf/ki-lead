// Management Summary aus der Musterfassung Ilka (Plan evaluation/plaene/management-summary-ilka.json): dieselbe feste
// Meldung für jedes KI-Profil, ein Aufruf je Lauf über dieselbe Funktion wie die App (kurzfassungErstellen). Läuft
// nur auf ausdrücklichen Aufruf:
//
//   KI_LEAD_ANTHROPIC_KEY=… KI_LEAD_VARIANTE=management-summary-ilka/A-anthropic-standard KI_LEAD_LAEUFE=3 \
//     npx vitest run --config evaluation/abnahmen/vitest.config.ts evaluation/abnahmen/kurzfassung.lauf.ts
//
// Anbieter mit KI_LEAD_ANBIETER (anthropic, openai, mistral), Modell und Aufwand mit KI_LEAD_MODELL_KURZFASSUNG und
// KI_LEAD_AUFWAND_KURZFASSUNG; ohne Angabe gilt das Standard-Profil des Anbieters. Mistral über den EU-Endpunkt, mit
// KI_LEAD_MISTRAL_ENDPUNKT=global über den globalen. Ohne Schlüssel und mit KI_LEAD_ATTRAPPE=1 Trockenlauf ohne Kosten.
// Ergebnisse (Text, Struktur, Hinweise der App, Vorprüfung, Kosten) gehen nach privat/kurzfassung-ilka/ (nicht
// eingecheckt). Die Musterfassung wird vor dem ersten Aufruf gegen die Prüfsumme des Plans geprüft. Seit 0.5.12
// dieselbe Reihe wie „Einstellungen → Modelle & Verarbeitung → Vergleichslauf Ilka“, Umfang „MS (aus Musterfassung)“
// (src/forschung/kurzfassungsreihe.ts), hier mit quelle „skript“; dazu die ZIP-Datei wie in der App.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { leereNutzung, type LlmAnbieter, type LlmAntwort } from "../../src/anbieter/typen";
import { Verteiler, type AnbieterId } from "../../src/anbieter/verteiler";
import { ladeProfil } from "../../src/profil/laden";
import { STANDARD, standardProfilAnwenden, type Einstellungen } from "../../src/pipeline/einstellungen";
import { kurzfassungsreihe, kurzfassungsZip, kurzfassungsZipName, MUSTERFASSUNG, musterfassungAus } from "../../src/forschung/kurzfassungsreihe";

const REPO = join(__dirname, "..", "..");
const AUSGABE = join(REPO, "privat", "kurzfassung-ilka");
const PLAN = JSON.parse(readFileSync(join(REPO, "evaluation/plaene/management-summary-ilka.json"), "utf-8"));

const ANBIETER: AnbieterId = process.env.KI_LEAD_ANBIETER === "openai" ? "openai" : process.env.KI_LEAD_ANBIETER === "mistral" ? "mistral" : "anthropic";
const SCHLUESSEL = {
  anthropic: process.env.KI_LEAD_ANTHROPIC_KEY || "",
  openai: process.env.KI_LEAD_OPENAI_KEY || "",
  mistral: process.env.KI_LEAD_MISTRAL_KEY || "",
};
const ATTRAPPE = !SCHLUESSEL[ANBIETER] && process.env.KI_LEAD_ATTRAPPE === "1";
const ECHT = !!SCHLUESSEL[ANBIETER];
const LAEUFE = Math.max(1, Math.min(5, Number(process.env.KI_LEAD_LAEUFE || 1)));
const VARIANTE = process.env.KI_LEAD_VARIANTE || "";
const AUFWAENDE = ["low", "medium", "high", "xhigh", "max"];

function einstellungen(): Einstellungen {
  const e = standardProfilAnwenden(STANDARD, ANBIETER);
  if (process.env.KI_LEAD_MODELL_KURZFASSUNG) e.modelle.kurzfassung = process.env.KI_LEAD_MODELL_KURZFASSUNG;
  const aufwand = process.env.KI_LEAD_AUFWAND_KURZFASSUNG;
  if (aufwand) {
    if (!AUFWAENDE.includes(aufwand)) throw new Error(`Aufwand „${aufwand}“ unbekannt (${AUFWAENDE.join(", ")})`);
    (e.aufwand as Record<string, string>).kurzfassung = aufwand;
  }
  if (ANBIETER === "mistral") e.mistralEndpunkt = process.env.KI_LEAD_MISTRAL_ENDPUNKT === "global" ? "global" : "eu";
  return e;
}

function leseOrdner(ordner: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lauf = (dir: string, rel: string) => {
    for (const name of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(dir, name.name);
      if (name.isDirectory()) lauf(p, rel + name.name + "/");
      else if (/\.(json|md)$/.test(name.name)) out[rel + name.name] = readFileSync(p, "utf-8");
    }
  };
  lauf(ordner, "");
  return out;
}

/** Trockenlauf: eine kurze, regelgerechte Kurzfassung */
function attrappe(): LlmAnbieter {
  const text = JSON.stringify({
    kernaussage: "Nach dem Orkantief sind noch mindestens rund 20.700 Menschen ohne Strom; in Sonneberg enden Notstrompuffer vor der Wiederversorgung.",
    abschnitte: {},
    kurztitel: ["Sturmfolgen", "Stromausfälle"],
  });
  const antwort: LlmAntwort = {
    modell: "attrappe",
    text,
    inhalt: [{ type: "text", text }],
    zitate: [],
    fundstellen: [],
    suchen: [],
    abrufe: [],
    abrufFehler: [],
    nutzung: { ...leereNutzung(), eingabe: 100, ausgabe: 50 },
    kostenUsd: 0,
    stopGrund: "end_turn",
    dauerMs: 1,
    runden: 1,
  };
  return { id: "attrappe", async senden() { return antwort; } };
}

describe("Management Summary aus der Musterfassung Ilka", () => {
  it.skipIf(!ECHT && !ATTRAPPE)(`${LAEUFE} Lauf/Läufe ${ATTRAPPE ? "(Attrappe)" : `(echt, ${ANBIETER})`}`, async () => {
    expect(MUSTERFASSUNG).toEqual(PLAN.meldung_fest);
    // Prüfsumme der Musterfassung wie im Plan, sonst Abbruch vor dem ersten Aufruf
    const musterfassung = await musterfassungAus(readFileSync(join(REPO, PLAN.meldung_fest.datei), "utf-8"));
    const geladen = await ladeProfil(leseOrdner(join(REPO, "profile/lead-beispiel")));
    const profil = geladen.profil!;
    expect(profil, JSON.stringify(geladen.befunde)).toBeTruthy();
    const e = einstellungen();
    mkdirSync(AUSGABE, { recursive: true });
    const stempel = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const { reihe, ergebnisse } = await kurzfassungsreihe({
      profil,
      musterfassung,
      anbieter: ATTRAPPE ? attrappe() : Verteiler.fuer(SCHLUESSEL, { mistralEndpunkt: e.mistralEndpunkt }),
      einstellungen: e,
      anzahl: LAEUFE,
      budgetUsd: PLAN.budget_usd,
      attrappe: ATTRAPPE,
      quelle: "skript",
      variante: VARIANTE || undefined,
    });
    for (const l of reihe.laeufe)
      console.log(
        `Lauf ${l.nr}/${LAEUFE}: ${l.fehler ? `Fehler: ${l.fehler}` : `${l.vorpruefung?.woerter} Wörter · ${l.kosten_usd ?? "?"} USD · ${l.dauer_s} s`}${l.auffaelligkeiten.length ? ` · ${l.auffaelligkeiten.join("; ")}` : ""}`,
      );
    const name = (VARIANTE.split("/").pop() || ANBIETER).replace(/[^A-Za-z0-9.-]+/g, "-");
    writeFileSync(join(AUSGABE, `reihe-${name}-${stempel}.json`), JSON.stringify(reihe, null, 2));
    writeFileSync(join(AUSGABE, kurzfassungsZipName(reihe)), await kurzfassungsZip(reihe, ergebnisse));
    expect(reihe.laeufe.length).toBe(LAEUFE);
  });
});
