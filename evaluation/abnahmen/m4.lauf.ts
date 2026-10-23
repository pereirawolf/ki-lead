// Abnahme M4 (Plan: evaluation/plaene/2026-10-23-abnahme-m4.md): Verdichtung der sechs Ilka-Eingänge mit echten
// KI-Aufrufen über dieselben Funktionen wie die App. Läuft nur auf ausdrücklichen Aufruf:
//
//   KI_LEAD_ANTHROPIC_KEY=… KI_LEAD_LAEUFE=3 npx vitest run --config evaluation/abnahmen/vitest.config.ts
//   KI_LEAD_OPENAI_KEY=… KI_LEAD_ANBIETER=openai KI_LEAD_LAEUFE=3 npx vitest run --config evaluation/abnahmen/vitest.config.ts
//
// Mit KI_LEAD_ANBIETER=openai gelten die OpenAI-Gegenstücke der Vorgaben: S1 gpt-6-luna, S2 gpt-6-astra,
// Reparatur gpt-6.1-sol (Aufwand wie bei Anthropic); einzelne Modelle über KI_LEAD_MODELL_S1, _S2, _REPARATUR.
//
// Ohne Schlüssel und mit KI_LEAD_ATTRAPPE=1 läuft das Skript mit einem simulierten Anbieter (Trockenlauf, keine Kosten).
// Abweichung von der App: Die S1-Bestätigung wird automatisch erteilt (technische Abnahme, siehe Plan).
// Laufprotokolle und Prüfergebnisse gehen nach privat/abnahme-m4/ (nicht eingecheckt).

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { leereNutzung, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "../../src/anbieter/typen";
import { Verteiler } from "../../src/anbieter/verteiler";
import { migriere } from "../../src/kern/migration";
import { pruefeGegenSchema } from "../../src/kern/validierung";
import type { Meldung } from "../../src/kern/typen";
import { ladeProfil, sha256 } from "../../src/profil/laden";
import { STANDARD, modellFuer, type Einstellungen } from "../../src/pipeline/einstellungen";
import { APP_KENNUNG, neuerLauf, ohneBase64, type Lauf } from "../../src/pipeline/lauf";
import { dateiLesen, istVerdichtung, type Material } from "../../src/pipeline/material";
import { stufe1, stufe2und3, type Kontext } from "../../src/pipeline/stufen";
import { VERGLEICH_VERFAHREN, vergleiche, vergleichTabelle, zuordnungAus } from "../../src/pipeline/vergleich";
import { eingangsquellenPruefen } from "../../src/pipeline/vermerke";

const REPO = join(__dirname, "..", "..");
const FALL = JSON.parse(readFileSync(join(REPO, "evaluation/faelle/orkantief-ilka-verdichtung.json"), "utf-8"));
const ILKA = "profile/lead-beispiel/beispiele/orkantief-ilka";
const REFERENZ = "LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
const AUSGABE = join(REPO, "privat", "abnahme-m4");

const ANBIETER = process.env.KI_LEAD_ANBIETER === "openai" ? "openai" : "anthropic";
const SCHLUESSEL = { anthropic: process.env.KI_LEAD_ANTHROPIC_KEY || "", openai: process.env.KI_LEAD_OPENAI_KEY || "" };
const ATTRAPPE = !SCHLUESSEL[ANBIETER] && process.env.KI_LEAD_ATTRAPPE === "1";
const ECHT = !!SCHLUESSEL[ANBIETER];

/** Einstellungen des Laufs: App-Vorgaben; bei OpenAI die Gegenstücke der Modellvorgaben (klein, groß, mittel). */
function einstellungen(): Einstellungen {
  if (ANBIETER !== "openai") return STANDARD;
  const e = structuredClone(STANDARD);
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
function attrappe(eingaenge: Material[], referenz: unknown): LlmAnbieter & { anfragen: LlmAnfrage[] } {
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
                eingangsmeldungen: eingaenge.map((m) => m.name),
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

type Pruefpunkt = { nr: string; erfuellt: boolean; angabe: string };

function pruefpunkte(l: Lauf, material: Material[], meldung: Meldung | undefined, quellen: ReturnType<typeof eingangsquellenPruefen>): Pruefpunkt[] {
  const s1 = l.stufen.find((s) => s.stufe.startsWith("S1"));
  const s2 = l.stufen.find((s) => s.stufe === "S2 Verdichtung");
  const reparaturen = l.stufen.filter((s) => s.stufe.startsWith("S3 Reparatur")).length;
  const eingaenge = material.filter((m) => m.art === "eingang");
  const vermerk = "Vermerke der App aus dem Redaktionscheck";
  const stufenVollstaendig = l.stufen.every((s) => s.modell && s.aufwand && s.nutzung && typeof s.dauerMs === "number" && s.kostenUsd !== undefined);
  return [
    { nr: "T1", erfuellt: eingaenge.length === 6 && istVerdichtung(material) && !!s2, angabe: `${eingaenge.length} Eingänge, Stufe „${s2?.stufe ?? "–"}“` },
    { nr: "T2", erfuellt: l.status === "fertig", angabe: `Status ${l.status}${l.fehler ? `: ${l.fehler}` : ""}` },
    { nr: "T3", erfuellt: !!l.ergebnis?.schemakonform && reparaturen <= 2, angabe: `schemakonform ${!!l.ergebnis?.schemakonform}, Reparaturen ${reparaturen}` },
    { nr: "T4", erfuellt: meldung?.meldezeitpunkt === FALL.auftrag.meldezeitpunkt, angabe: `t0 ${meldung?.meldezeitpunkt ?? "–"}` },
    {
      nr: "T5",
      erfuellt:
        !!s2 &&
        !s2.anfrage?.werkzeuge &&
        !!s2.anfrage?.system.some((t) => t.includes(vermerk)) &&
        JSON.stringify(s1?.anfrage?.nachrichten ?? "").includes("Vermerke der App"),
      angabe: `Werkzeuge in S2: ${s2?.anfrage?.werkzeuge ? "ja" : "nein"}; Vermerke an S1 und S2`,
    },
    {
      nr: "T6",
      erfuellt: !!l.profil.hash && l.material.length === 6 && l.material.every((m) => !!m.hash) && stufenVollstaendig,
      angabe: `${l.stufen.length} Stufen, Profil ${l.profil.version} (${l.profil.hash.slice(0, 12)}…)`,
    },
    { nr: "T7", erfuellt: !!meldung && quellen.length === 6, angabe: quellen.map((q) => `${q.stelle}: ${q.status}`).join("; ") || "–" },
    { nr: "T8", erfuellt: !!l.vergleich?.ergebnis && !!l.vergleich.referenzHash, angabe: l.vergleich ? `${l.vergleich.ergebnis.paare.length} Paare` : "–" },
  ];
}

describe("Abnahme M4: Verdichtung Ilka", () => {
  it.skipIf(!ECHT && !ATTRAPPE)(`${LAEUFE} Lauf/Läufe ${ATTRAPPE ? "(Attrappe)" : `(echt, ${ANBIETER})`}`, async () => {
    const EINSTELLUNGEN = einstellungen();
    mkdirSync(AUSGABE, { recursive: true });
    const geladen = await ladeProfil(leseOrdner(join(REPO, "profile/lead-beispiel")));
    const profil = geladen.profil!;
    expect(profil, JSON.stringify(geladen.befunde)).toBeTruthy();
    const refText = readFileSync(join(REPO, ILKA, REFERENZ), "utf-8");
    const zusammenfassung: unknown[] = [];
    let summe = 0;

    for (let i = 1; i <= LAEUFE; i++) {
      if (summe >= BUDGET_USD) {
        console.log(`Budgetgrenze ${BUDGET_USD} USD erreicht (${summe.toFixed(2)} USD), Reihe beendet.`);
        break;
      }
      // Material frisch aus den Dateien des Falls, wie beim Hochladen in der App
      const material: Material[] = [];
      for (const m of FALL.material) {
        const pfad = join(REPO, m.datei);
        material.push(await dateiLesen(new File([readFileSync(pfad, "utf-8")], pfad.split("/").pop()!), profil));
      }
      const a = FALL.auftrag;
      const lauf = neuerLauf(
        profil,
        {
          sachverhalt: a.sachverhalt,
          stichworte: a.stichworte,
          urls: [],
          stichtag: a.stichtag,
          prueffrage: "",
          websuche: a.websuche,
          meldezeitpunkt: a.meldezeitpunkt,
        },
        material.map((m) => ({ name: m.name, art: m.art, groesse: m.groesse, hash: m.hash })),
      );
      const datei = join(AUSGABE, `${lauf.id}.lauf.json`);
      const speichern = (l: Lauf) => writeFileSync(datei, JSON.stringify(ohneBase64(l), null, 2));
      const anbieter = ATTRAPPE ? attrappe(material, JSON.parse(refText)) : new Verteiler(SCHLUESSEL);
      let zeichen = 0;
      const k: Kontext = {
        profil,
        anbieter,
        einstellungen: EINSTELLUNGEN,
        lauf,
        material,
        aktualisiert: speichern,
        fortschritt: (f) => {
          if (f.art === "schreibt" && f.zeichen - zeichen >= 5000) console.log(`  … ${(zeichen = f.zeichen)} Zeichen`);
          if (f.art === "wiederholung") console.log(`  Wiederholung: ${f.grund}`);
        },
      };
      console.log(
        `Lauf ${i}/${LAEUFE}: ${lauf.id} (S1 ${modellFuer("vorverarbeitung", EINSTELLUNGEN, profil)}, S2 ${modellFuer("verdichtung", EINSTELLUNGEN, profil)})`,
      );

      let meldung: Meldung | undefined;
      try {
        const vorschlag = await stufe1(k);
        // Automatische Bestätigung: Vorschlag unverändert, keine vorgeschlagene Prüffrage übernommen
        const e = await stufe2und3(k, structuredClone(vorschlag));
        meldung = e.meldung ?? undefined;
      } catch (err) {
        lauf.status = lauf.status === "fertig" ? lauf.status : "fehler";
        lauf.fehler ??= String((err as Error)?.message || err);
        console.log(`  Fehler: ${lauf.fehler}`);
      }

      const quellen = meldung ? eingangsquellenPruefen(material, meldung, profil) : [];
      if (meldung) {
        const mig = migriere(JSON.parse(refText), profil);
        const ergebnis = vergleiche(meldung, mig.daten, profil);
        lauf.vergleich = {
          referenz: REFERENZ,
          referenzHash: await sha256(refText),
          referenzDaten: mig.daten,
          verfahren: VERGLEICH_VERFAHREN,
          manuell: false,
          zuordnung: zuordnungAus(ergebnis),
          erstellt: new Date().toISOString(),
          ergebnis,
        };
        writeFileSync(
          join(AUSGABE, `${lauf.id}.vergleich.csv`),
          vergleichTabelle(ergebnis)
            .map((z) => z.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
            .join("\n"),
        );
        writeFileSync(join(AUSGABE, `${lauf.id}.meldung.json`), JSON.stringify(meldung, null, 2));
      }
      speichern(lauf);

      const punkte = pruefpunkte(lauf, material, meldung, quellen);
      const s1 = lauf.vorschlag;
      const zugeordnet = new Set((s1?.sachverhalte ?? []).flatMap((s) => s.eingangsmeldungen ?? []));
      const eintrag = {
        lauf: lauf.id,
        attrappe: ATTRAPPE,
        anbieter: ANBIETER,
        status: lauf.status,
        technisch_bestanden: punkte.every((p) => p.erfuellt),
        pruefpunkte: punkte,
        beobachtungen: {
          s1_zugeordnete_eingaenge: zugeordnet.size,
          s1_sachverhalte: s1?.sachverhalte.length ?? 0,
          s1_app_hinweise: s1?.appHinweise ?? [],
          quellen,
          schemabefunde_endfassung: meldung ? pruefeGegenSchema(profil.schema, meldung, profil.ui).length : null,
          befunde: lauf.ergebnis?.befunde ?? [],
          vergleich: lauf.vergleich?.ergebnis
            ? {
                paare: lauf.vergleich.ergebnis.paare.map((p) => ({
                  ki: p.ki?.bezeichnung ?? null,
                  ref: p.ref?.bezeichnung ?? null,
                  aehnlichkeit: p.aehnlichkeit,
                })),
                beurteilung: lauf.vergleich.ergebnis.beurteilung,
                tendenz: lauf.vergleich.ergebnis.tendenz,
                arten: lauf.vergleich.ergebnis.arten,
                achsen: lauf.vergleich.ergebnis.achsen,
              }
            : null,
        },
        stufen: lauf.stufen.map((s) => ({
          stufe: s.stufe,
          modell: s.modell,
          aufwand: s.aufwand,
          dauer_s: s.dauerMs ? Math.round(s.dauerMs / 100) / 10 : null,
          ausgabetoken: s.nutzung?.ausgabe ?? null,
          kosten_usd: s.kostenUsd ?? null,
          stop: s.antwort?.stopGrund ?? null,
          fehler: s.fehler ?? null,
        })),
        kosten_usd: lauf.kostenUsd,
        dauer_s: Math.round((Date.parse(lauf.aktualisiert) - Date.parse(lauf.erstellt)) / 1000),
      };
      summe += lauf.kostenUsd ?? lauf.kostenBekanntUsd ?? 0;
      writeFileSync(join(AUSGABE, `${lauf.id}.pruefung.json`), JSON.stringify(eintrag, null, 2));
      zusammenfassung.push(eintrag);
      console.log(`  ${punkte.map((p) => `${p.nr}:${p.erfuellt ? "ok" : "NEIN"}`).join(" ")} · ${lauf.kostenUsd ?? "?"} USD · ${eintrag.dauer_s} s`);
    }
    // Gesamtergebnis der Reihe (Format ki-lead-abnahme/1): ohne Schlüssel, zur Übergabe an die Auswertung
    const reihe = {
      format: "ki-lead-abnahme/1",
      plan: "evaluation/plaene/2026-10-23-abnahme-m4.md",
      fall: FALL.id,
      erstellt: new Date().toISOString(),
      app: APP_KENNUNG,
      profil: { id: profil.manifest.id, version: profil.manifest.version, hash: profil.hash },
      anbieter: ANBIETER,
      attrappe: ATTRAPPE,
      modelle: {
        s1: { modell: modellFuer("vorverarbeitung", EINSTELLUNGEN, profil), aufwand: EINSTELLUNGEN.aufwand.vorverarbeitung },
        s2: { modell: modellFuer("verdichtung", EINSTELLUNGEN, profil), aufwand: EINSTELLUNGEN.aufwand.verdichtung },
        reparatur: { modell: modellFuer("reparatur", EINSTELLUNGEN, profil), aufwand: EINSTELLUNGEN.aufwand.reparatur },
      },
      laeufe_geplant: LAEUFE,
      technisch_bestanden: (zusammenfassung as { technisch_bestanden: boolean }[]).filter((z) => z.technisch_bestanden).length,
      kosten_usd_summe: Math.round(summe * 10000) / 10000,
      laeufe: zusammenfassung,
    };
    writeFileSync(join(AUSGABE, `reihe-${ANBIETER}-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`), JSON.stringify(reihe, null, 2));
    expect(zusammenfassung.length).toBeGreaterThan(0);
  });
});
