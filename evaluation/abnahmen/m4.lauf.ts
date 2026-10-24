// Abnahme M4 (Plan: evaluation/plaene/2026-10-23-abnahme-m4.md): Verdichtung der sechs Ilka-Eingänge mit echten
// KI-Aufrufen über dieselben Funktionen wie die App. Läuft nur auf ausdrücklichen Aufruf:
//
//   KI_LEAD_ANTHROPIC_KEY=… KI_LEAD_LAEUFE=3 npx vitest run --config evaluation/abnahmen/vitest.config.ts
//   KI_LEAD_OPENAI_KEY=… KI_LEAD_ANBIETER=openai KI_LEAD_LAEUFE=3 npx vitest run --config evaluation/abnahmen/vitest.config.ts
//   KI_LEAD_MISTRAL_KEY=… KI_LEAD_ANBIETER=mistral KI_LEAD_LAEUFE=3 npx vitest run --config evaluation/abnahmen/vitest.config.ts
//
// Mit KI_LEAD_ANBIETER=openai gelten die OpenAI-Gegenstücke der Vorgaben: S1 gpt-6-luna, S2 gpt-6-astra,
// Reparatur gpt-6.1-sol (Aufwand wie bei Anthropic); einzelne Modelle über KI_LEAD_MODELL_S1, _S2, _REPARATUR.
// Mit KI_LEAD_ANBIETER=mistral (seit 0.5.6) das Standard-Profil Mistral: S1 mistral-small-2603, S2 mistral-medium-3-5,
// Reparatur mistral-small-2603; Endpunkt wie in der App EU, mit KI_LEAD_MISTRAL_ENDPUNKT=global der globale.
//
// Ohne Schlüssel und mit KI_LEAD_ATTRAPPE=1 läuft das Skript mit einem simulierten Anbieter (Trockenlauf, keine Kosten).
// Abweichung von der App: Die S1-Bestätigung wird automatisch erteilt (technische Abnahme, siehe Plan), wie im
// Vergleichslauf der App (Einstellungen → Modelle & Verarbeitung, seit 0.5.8), dessen Funktionen das Skript nutzt.
// Laufprotokolle und Prüfergebnisse gehen nach privat/abnahme-m4/ (nicht eingecheckt).

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { leereNutzung, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "../../src/anbieter/typen";
import { Verteiler } from "../../src/anbieter/verteiler";
import { ladeProfil } from "../../src/profil/laden";
import { STANDARD, modellFuer, type Einstellungen } from "../../src/pipeline/einstellungen";
import { ohneBase64, type Lauf } from "../../src/pipeline/lauf";
import { csv, einLauf, FALL_MATERIAL, REFERENZ, reiheErstellen, type EinzelErgebnis, type FallDaten } from "../../src/pipeline/vergleichslauf";

const REPO = join(__dirname, "..", "..");
const AUSGABE = join(REPO, "privat", "abnahme-m4");

const ANBIETER = process.env.KI_LEAD_ANBIETER === "openai" ? "openai" : process.env.KI_LEAD_ANBIETER === "mistral" ? "mistral" : "anthropic";
const SCHLUESSEL = {
  anthropic: process.env.KI_LEAD_ANTHROPIC_KEY || "",
  openai: process.env.KI_LEAD_OPENAI_KEY || "",
  mistral: process.env.KI_LEAD_MISTRAL_KEY || "",
};
const ATTRAPPE = !SCHLUESSEL[ANBIETER] && process.env.KI_LEAD_ATTRAPPE === "1";
const ECHT = !!SCHLUESSEL[ANBIETER];

/** Einstellungen des Laufs: App-Vorgaben; bei OpenAI und Mistral die Gegenstücke der Modellvorgaben. */
function einstellungen(): Einstellungen {
  if (ANBIETER === "anthropic") return STANDARD;
  const e = structuredClone(STANDARD);
  if (ANBIETER === "mistral") {
    e.modelle.vorverarbeitung = process.env.KI_LEAD_MODELL_S1 || "mistral-small-2603";
    e.modelle.verdichtung = process.env.KI_LEAD_MODELL_S2 || "mistral-medium-3-5";
    e.modelle.reparatur = process.env.KI_LEAD_MODELL_REPARATUR || "mistral-small-2603";
    e.mistralEndpunkt = process.env.KI_LEAD_MISTRAL_ENDPUNKT === "global" ? "global" : "eu";
    return e;
  }
  e.modelle.vorverarbeitung = process.env.KI_LEAD_MODELL_S1 || "gpt-6-luna";
  e.modelle.verdichtung = process.env.KI_LEAD_MODELL_S2 || "gpt-6-astra";
  e.modelle.reparatur = process.env.KI_LEAD_MODELL_REPARATUR || "gpt-6.1-sol";
  return e;
}
const LAEUFE = Math.max(1, Math.min(5, Number(process.env.KI_LEAD_LAEUFE || 1)));
const BUDGET_USD = Number(process.env.KI_LEAD_BUDGET_USD || 15);

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

/** Trockenlauf: S1 ordnet alle Eingänge einem Sachverhalt zu, S2 liefert die Referenzfassung. */
function attrappe(eingaenge: string[], referenz: unknown): LlmAnbieter & { anfragen: LlmAnfrage[] } {
  const anfragen: LlmAnfrage[] = [];
  const antwort = (text: string, modell: string): LlmAntwort => ({
    modell,
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
  });
  return {
    id: "attrappe",
    anfragen,
    async senden(a) {
      anfragen.push(a);
      if (anfragen.length === 1)
        return antwort(
          JSON.stringify({
            gegenstand: "Sturmfolgen Orkantief Ilka",
            stichtag: "2026-10-14",
            meldezeitpunkt: "2026-10-14T14:00",
            referenzbezug: "Bund",
            horizont: "bis 16.10.2026",
            sachverhalte: [
              {
                titel: "Sturmfolgen",
                ereignisarten: ["Unwetter / Sturm"],
                sops: ["b01"],
                begruendung: "Sturm",
                eingangsmeldungen: eingaenge,
              },
            ],
            prueffrage: "",
            hinweise: "",
          }),
          a.modell,
        );
      return antwort("Kurz.\n\n```json\n" + JSON.stringify(referenz) + "\n```", a.modell);
    },
  };
}

describe("Abnahme M4: Verdichtung Ilka", () => {
  it.skipIf(!ECHT && !ATTRAPPE)(`${LAEUFE} Lauf/Läufe ${ATTRAPPE ? "(Attrappe)" : `(echt, ${ANBIETER})`}`, async () => {
    const EINSTELLUNGEN = einstellungen();
    mkdirSync(AUSGABE, { recursive: true });
    const dateien = leseOrdner(join(REPO, "profile/lead-beispiel"));
    const geladen = await ladeProfil(dateien);
    const profil = geladen.profil!;
    expect(profil, JSON.stringify(geladen.befunde)).toBeTruthy();
    const daten: FallDaten = { profil, dateien };
    const refText = dateien[REFERENZ];
    const eingaenge = FALL_MATERIAL.map((p) => p.split("/").pop()!);
    const ergebnisse: EinzelErgebnis[] = [];
    let summe = 0;

    for (let i = 1; i <= LAEUFE; i++) {
      if (summe >= BUDGET_USD) {
        console.log(`Budgetgrenze ${BUDGET_USD} USD erreicht (${summe.toFixed(2)} USD), Reihe beendet.`);
        break;
      }
      const anbieter = ATTRAPPE ? attrappe(eingaenge, JSON.parse(refText)) : Verteiler.fuer(SCHLUESSEL, { mistralEndpunkt: EINSTELLUNGEN.mistralEndpunkt });
      let zeichen = 0;
      let datei = "";
      const speichern = (l: Lauf) => {
        datei ||= join(AUSGABE, `${l.id}.lauf.json`);
        writeFileSync(datei, JSON.stringify(ohneBase64(l), null, 2));
      };
      console.log(`Lauf ${i}/${LAEUFE} (S1 ${modellFuer("vorverarbeitung", EINSTELLUNGEN, profil)}, S2 ${modellFuer("verdichtung", EINSTELLUNGEN, profil)})`);
      // Ablauf, Prüfpunkte und Reihendatei wie der Vergleichslauf der App (src/pipeline/vergleichslauf.ts, seit 0.5.8)
      const erg = await einLauf({
        daten,
        anbieter,
        einstellungen: EINSTELLUNGEN,
        attrappe: ATTRAPPE,
        aktualisiert: speichern,
        fortschritt: (f) => {
          if (f.art === "schreibt" && f.zeichen - zeichen >= 5000) console.log(`  … ${(zeichen = f.zeichen)} Zeichen`);
          if (f.art === "wiederholung") console.log(`  Wiederholung: ${f.grund}`);
        },
      });
      const lauf = erg.lauf;
      if (lauf.fehler) console.log(`  Fehler: ${lauf.fehler}`);
      if (erg.meldung) {
        writeFileSync(join(AUSGABE, `${lauf.id}.vergleich.csv`), csv(erg.vergleichTabelle ?? []));
        writeFileSync(join(AUSGABE, `${lauf.id}.meldung.json`), JSON.stringify(erg.meldung, null, 2));
      }
      speichern(lauf);
      summe += lauf.kostenUsd ?? lauf.kostenBekanntUsd ?? 0;
      writeFileSync(join(AUSGABE, `${lauf.id}.pruefung.json`), JSON.stringify(erg.eintrag, null, 2));
      ergebnisse.push(erg);
      console.log(
        `  ${erg.eintrag.pruefpunkte.map((p) => `${p.nr}:${p.erfuellt ? "ok" : "NEIN"}`).join(" ")} · ${lauf.kostenUsd ?? "?"} USD · ${erg.eintrag.dauer_s} s`,
      );
    }
    // Gesamtergebnis der Reihe (Format ki-lead-abnahme/1): ohne Schlüssel, zur Übergabe an die Auswertung
    const reihe = reiheErstellen({ daten, einstellungen: EINSTELLUNGEN, ergebnisse, geplant: LAEUFE, quelle: "skript", attrappe: ATTRAPPE });
    writeFileSync(join(AUSGABE, `reihe-${ANBIETER}-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`), JSON.stringify(reihe, null, 2));
    expect(ergebnisse.length).toBeGreaterThan(0);
  });
});
