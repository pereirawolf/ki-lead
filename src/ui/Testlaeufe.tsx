// Bereich „Einstellungen → Testläufe“ (seit 0.5.17): standardisierte Testläufe am fiktiven Fall „Ilka“ in einem
// Formular und das Archiv der Testläufe. Bis 0.5.16 standen unter „Modelle & Verarbeitung“ zwei Abschnitte,
// „Vergleichslauf Ilka“ (seit 0.5.8; Umfänge seit 0.5.12) und „Prüffall Reparatur“ (seit 0.5.13); der Prüffall ist
// jetzt die Testart „S3 Reparatur (aus Musterfassung)“. Ein Testlauf besteht aus einem oder mehreren Läufen; das
// Ergebnis kommt als ZIP-Datei und bleibt im Archiv auf dem Gerät, bis es gelöscht wird.

import { useEffect, useRef, useState } from "react";
import { formatUsd } from "../anbieter/preise";
import { ANBIETER_NAME, anbieterVon, Verteiler, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import type { LlmAnbieter } from "../anbieter/typen";
import type { Profil } from "../kern/typen";
import { APP_MODELLE, AUFWAND_STUFEN, aufwandAngeboten, modellFuer, type Einstellungen, type Rolle } from "../pipeline/einstellungen";
import { kurzfassungsreihe, kurzfassungsZip, kurzfassungsZipName, MS_EINGABE_TOKEN, type KurzfassungsReihe } from "../forschung/kurzfassungsreihe";
import {
  DEFEKTE,
  DURCHGAENGE_MAX,
  durchgaengeBegrenzt,
  einstellungenFuerReparatur,
  PLAN_REPARATUR,
  reparaturDateiname,
  reparaturReihe,
  reparaturZip,
  schaetzePrueffall,
  type ReparaturReihe,
} from "../forschung/reparaturtest";
import { kostenText, dauerText, schaetzeKurzfassung, schaetzeStufe, summe, type Schaetzung } from "../pipeline/schaetzung";
import {
  ANZAHL_MAX,
  ANZAHL_VORGABE,
  anzahlBegrenzt,
  einstellungenFuerVariante,
  plaeneFuer,
  planVarianteZu,
  rollenFuer,
  UMFAENGE,
  UMFANG_VORGABE,
  umfangInfo,
  vergleichsreihe,
  VERGLEICH_ROLLEN,
  type EinzelErgebnis,
  type FallDaten,
  type PlanVariante,
  type Reihe,
  type Umfang,
} from "../forschung/vergleichslauf";
import { reiheZip, zipDateiname } from "../forschung/vergleichslauf-export";
import { fallDatenEingebaut, musterDatenEingebaut, type MusterDaten } from "../forschung/vergleichslauf-eingebaut";
import { dateiAnbieten } from "../speicher/speicher";
import {
  groesseText,
  testlaeufeLaden,
  testlaeufeLoeschen,
  testlaufArchivieren,
  testlaufId,
  testlaufZip,
  type TestlaufEintrag,
} from "../speicher/testlaufarchiv";
import { useWachhalten } from "./wachhalten";

/** Art eines Testlaufs: ein Umfang der Kette oder die Reparatur aus der beschädigten Musterfassung */
export type Testart = Umfang | "reparatur";

export interface TestartInfo {
  id: Testart;
  titel: string;
  text: string;
}

const REPARATUR: TestartInfo = {
  id: "reparatur",
  titel: "S3 Reparatur (aus Musterfassung)",
  text: `Nur die Reparatur ruft einen Anbieter auf: Die App beschädigt die Musterfassung an festen Stellen (${DEFEKTE.map((d) => d.id.split("-")[0]).join(", ")}: Radarwert außerhalb der Skala, unzulässige Beurteilung, unbekannte Ereignisart, Radarwert als Text, drei Fehler zugleich) und lässt sie mit dem Modell der Reparatur reparieren. Gemessen wird je Fall, ob der Entwurf danach schemakonform ist, wie viele Reparaturen es brauchte, ob die beschädigten Stellen wieder ihren Originalwert haben und ob die übrigen Inhalte unverändert bleiben. Ein Lauf umfasst alle ${DEFEKTE.length} Fälle.`,
};

/** Testarten in der Reihenfolge der Auswahl: Rohdaten, dann Musterfassung (S2 + S3, S3, Management Summary) */
export const TESTARTEN: TestartInfo[] = [...UMFAENGE.filter((u) => u.id !== "ms"), REPARATUR, ...UMFAENGE.filter((u) => u.id === "ms")];

const testartInfo = (a: Testart): TestartInfo => TESTARTEN.find((x) => x.id === a)!;

const TITEL: Record<Rolle, string> = {
  vorverarbeitung: "S1",
  erfassung: "S2 Erfassung",
  verdichtung: "S2 Verdichtung",
  reparatur: "S3 Reparatur",
  kurzfassung: "Management Summary",
};
const aufwandTitel = (a: string) => AUFWAND_STUFEN.find((x) => x.id === a)?.titel ?? a;

/** Text einer Plan-Variante in der Auswahl: nur die Stufen, die der Umfang nutzt */
function varianteText(v: PlanVariante, u: Umfang): string {
  const rollen = rollenFuer(u);
  const teile = [
    rollen.includes("vorverarbeitung") && v.s1 ? `S1 ${v.s1.modell} (${aufwandTitel(v.s1.aufwand)})` : "",
    rollen.includes("verdichtung") && v.s2 ? `S2 ${v.s2.modell} (${aufwandTitel(v.s2.aufwand)})` : "",
    rollen.includes("kurzfassung") && v.kurzfassung ? `MS ${v.kurzfassung.modell} (${aufwandTitel(v.kurzfassung.aufwand)})` : "",
  ].filter(Boolean);
  return `${v.kennung}: ${teile.join(", ")}`;
}

const vorgabeAnzahl = (a: Testart) => (a === "reparatur" ? PLAN_REPARATUR.wiederholungen : ANZAHL_VORGABE);
const hoechstAnzahl = (a: Testart) => (a === "reparatur" ? DURCHGAENGE_MAX : ANZAHL_MAX);
const begrenzt = (a: Testart, n: number) => (a === "reparatur" ? durchgaengeBegrenzt(n) : anzahlBegrenzt(n));

/** Gilt die Variante „<Plan>/<Kennung>“ für die Testart? */
function varianteGilt(wert: string, a: Testart): boolean {
  if (!wert) return false;
  if (a === "reparatur") {
    const [plan, kennung] = wert.split("/");
    return plan === PLAN_REPARATUR.id && PLAN_REPARATUR.varianten.some((v) => v.kennung === kennung);
  }
  return !!planVarianteZu(wert)?.plan.umfaenge.includes(a);
}

export interface TestlaeufeProps {
  /** aktives Profil der App: bestimmt, welche Modellvorgabe in den Einstellungen gilt */
  profil: Profil | null;
  einstellungen: Einstellungen;
  schluessel: Schluessel;
  /** Wechsel in einen anderen Bereich der Einstellungen (Hinweis auf fehlende Schlüssel) */
  zeige?: (bereich: "anbieter" | "modelle") => void;
  /** für Tests: Laden des Beispielprofils, der Musterfassung und Anbieter austauschbar */
  datenLaden?: () => Promise<FallDaten>;
  musterLaden?: () => Promise<MusterDaten>;
  anbieterFuer?: (schluessel: Schluessel, e: Einstellungen) => LlmAnbieter;
}

type Ergebnis =
  { art: "reihe"; reihe: Reihe; ergebnisse: EinzelErgebnis[] } | { art: "ms"; reihe: KurzfassungsReihe } | { art: "reparatur"; reihe: ReparaturReihe };

type Zustand =
  | { art: "bereit" }
  | { art: "laeuft"; stand?: string }
  | { art: "fertig"; ergebnis: Ergebnis; zip: Uint8Array; name: string; archivFehler?: string }
  | { art: "fehler"; text: string };

/** Einstellungen mit ausdrücklichem Modell je Aufgabe: so, wie sie „Modelle & Aufwand“ für das aktive Profil anzeigt */
export function vergleichsEinstellungen(e: Einstellungen, profil: Profil | null): Einstellungen {
  const modelle = { ...e.modelle };
  for (const r of [...VERGLEICH_ROLLEN, "kurzfassung"] as Rolle[]) modelle[r] = profil ? modellFuer(r, e, profil) : e.modelle[r] || APP_MODELLE[r];
  return { ...e, modelle };
}

const zipBlob = (zip: Uint8Array) => new Blob([zip as BlobPart], { type: "application/zip" });

// ── Bereich ───────────────────────────────────────────────────────────────────

export function TestlaeufeBereich(props: TestlaeufeProps) {
  /** zählt hoch, sobald ein Testlauf archiviert ist; das Archiv lädt dann neu */
  const [archiviert, setArchiviert] = useState(0);
  return (
    <section className="schritt-inhalt" aria-labelledby="einstellungen-bereich-titel">
      <h2 id="einstellungen-bereich-titel">Testläufe</h2>
      <p className="einleitung">
        Standardisierte Testläufe am fiktiven Fall „Ilka“, um Modelle und Aufwand nach einer Änderung zu vergleichen und auszuwerten. Ein Testlauf besteht aus
        einem oder mehreren Läufen. Das Ergebnis kommt als ZIP-Datei und bleibt im Archiv auf diesem Gerät, bis du es löschst.
      </p>
      <TestlaufAbschnitt {...props} archiviert={() => setArchiviert((n) => n + 1)} />
      <TestlaufArchiv aktualisierung={archiviert} />
    </section>
  );
}

// ── Neuer Testlauf ────────────────────────────────────────────────────────────

export function TestlaufAbschnitt({
  profil,
  einstellungen,
  schluessel,
  zeige,
  datenLaden = fallDatenEingebaut,
  musterLaden = () => musterDatenEingebaut(),
  anbieterFuer = (s, e) => Verteiler.fuer(s, { mistralEndpunkt: e.mistralEndpunkt }),
  archiviert,
}: TestlaeufeProps & { archiviert?: () => void }) {
  const [art, setArt] = useState<Testart>(UMFANG_VORGABE);
  const [anzahl, setAnzahl] = useState(ANZAHL_VORGABE);
  /** leer: aktuelle Einstellungen; sonst „<Plan>/<Kennung>“ einer Variante der Pläne, die zur Testart passen */
  const [variante, setVariante] = useState("");
  const [zustand, setZustand] = useState<Zustand>({ art: "bereit" });
  const abbruch = useRef<AbortController | null>(null);
  const laeuft = zustand.art === "laeuft";
  useWachhalten(laeuft);

  const reparatur = art === "reparatur";
  const gilt = varianteGilt(variante, art);
  const kennung = gilt ? variante : undefined;
  const basis = vergleichsEinstellungen(einstellungen, profil);
  // Konfiguration: Variante eines Bewertungsplans oder die aktuellen Einstellungen
  const reparaturVariante = reparatur && kennung ? PLAN_REPARATUR.varianten.find((v) => v.kennung === kennung.split("/")[1]) : undefined;
  const planWahl = !reparatur && kennung ? planVarianteZu(kennung) : undefined;
  const e = reparaturVariante
    ? einstellungenFuerReparatur(basis, reparaturVariante)
    : planWahl
      ? einstellungenFuerVariante(einstellungen, planWahl.variante)
      : basis;
  const plaene = reparatur ? [] : plaeneFuer(art);
  const rollen: Rolle[] = reparatur ? ["reparatur"] : rollenFuer(art);
  const zeilen = rollen.map((r) => {
    const modell = e.modelle[r] || "";
    // Stufe so, wie das Modell sie anbietet (AV-2026-W43-02)
    return { r, modell, aufwand: modell ? aufwandAngeboten(modell, e.aufwand[r]) : e.aufwand[r], anbieter: modell ? anbieterVon(modell) : undefined };
  });
  // Die Reparatur einer Kette läuft nur bei Schemafehlern; ihr Schlüssel ist dann keine Voraussetzung
  const noetig = zeilen.filter((z) => reparatur || z.r !== "reparatur");
  const fehlend = [...new Set(noetig.filter((z) => z.anbieter && !schluessel[z.anbieter]).map((z) => z.anbieter!))] as AnbieterId[];
  const ohneModell = noetig.some((z) => !z.modell);
  const mistral = zeilen.some((z) => z.anbieter === "mistral");
  const euAufschlag = mistral && e.mistralEndpunkt !== "global";

  const n = begrenzt(art, anzahl);
  // Kosten mit dem Aufschlag des Mistral-EU-Endpunkts (AV-2026-W43-06)
  const endpunkt = { mistralEndpunkt: e.mistralEndpunkt ?? "eu" } as const;
  const schaetzungen: Schaetzung[] =
    art === "ms"
      ? [schaetzeKurzfassung(e.modelle.kurzfassung, e.aufwand.kurzfassung, MS_EINGABE_TOKEN, endpunkt)]
      : reparatur
        ? []
        : [
            ...(rollen.includes("vorverarbeitung") ? [schaetzeStufe("s1", e.modelle.vorverarbeitung, e.aufwand.vorverarbeitung, endpunkt)] : []),
            ...(rollen.includes("verdichtung") ? [schaetzeStufe("verdichtung", e.modelle.verdichtung, e.aufwand.verdichtung, endpunkt)] : []),
          ];
  const jeLauf = summe(schaetzungen.map((s) => s.usd));
  const dauerJeLauf = schaetzungen.every((s) => s.sekunden)
    ? schaetzungen.reduce<[number, number]>((x, s) => [x[0] + s.sekunden![0], x[1] + s.sekunden![1]], [0, 0])
    : null;
  const gemessen = schaetzungen.every((s) => s.gemessen);
  const zusammen = jeLauf ? ([jeLauf[0] * n, jeLauf[1] * n] as [number, number]) : null;
  const reparaturModell = e.modelle.reparatur || "";
  const reparaturKosten = reparatur && reparaturModell ? schaetzePrueffall(reparaturModell, n, endpunkt) : null;

  function artWaehlen(a: Testart) {
    // Die Reparatur zählt ihre Läufe anders (Vorgabe 2, höchstens 5): beim Wechsel die Vorgabe der neuen Art setzen
    if ((a === "reparatur") !== reparatur) setAnzahl(vorgabeAnzahl(a));
    setArt(a);
    // Eine Variante bleibt nur, wenn ihr Plan auch für die neue Testart gilt
    if (variante && !varianteGilt(variante, a)) setVariante("");
  }

  /** Konfiguration in Kurzform für das Archiv */
  const konfigurationText = () => {
    const modelle = noetig.map((z) => `${TITEL[z.r]} ${z.modell} (${aufwandTitel(z.aufwand)})`).join(", ");
    return kennung ? `${kennung.split("/")[1]} · ${modelle}` : modelle;
  };

  async function starten() {
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    setZustand({ art: "laeuft" });
    const titel = testartInfo(art).titel;
    const konfiguration = konfigurationText();
    try {
      let ergebnis: Ergebnis;
      let zip: Uint8Array;
      let name: string;
      let eintrag: Omit<TestlaufEintrag, "id" | "titel" | "konfiguration" | "name" | "groesse" | "art">;
      if (art === "ms") {
        const [daten, muster] = await Promise.all([datenLaden(), musterLaden()]);
        const { reihe, ergebnisse } = await kurzfassungsreihe({
          profil: daten.profil,
          musterfassung: muster.musterfassung,
          anbieter: anbieterFuer(schluessel, e),
          einstellungen: e,
          anzahl: n,
          signal: ctrl.signal,
          stand: (s) => setZustand({ art: "laeuft", stand: `Lauf ${s.nr} von ${s.anzahl} · ${s.stufe} · bisher ${formatUsd(s.kostenUsd)}` }),
          quelle: "app",
          variante: kennung,
        });
        ergebnis = { art: "ms", reihe };
        zip = await kurzfassungsZip(reihe, ergebnisse);
        name = kurzfassungsZipName(reihe);
        eintrag = {
          erstellt: reihe.erstellt,
          laeufe: reihe.laeufe.length,
          geplant: reihe.laeufe_geplant,
          kostenUsd: reihe.kosten_usd_summe,
          app: reihe.app,
          ...(reihe.beendet ? { beendet: reihe.beendet } : {}),
        };
      } else if (art === "reparatur") {
        const daten = await datenLaden();
        const { reihe, laeufe } = await reparaturReihe({
          daten,
          anbieter: anbieterFuer(schluessel, e),
          einstellungen: e,
          wiederholungen: n,
          signal: ctrl.signal,
          stand: (s) => setZustand({ art: "laeuft", stand: `Fall ${s.nr} von ${s.anzahl} · ${s.defekt} · bisher ${formatUsd(s.kostenUsd)}` }),
          quelle: "app",
          variante: kennung,
        });
        ergebnis = { art: "reparatur", reihe };
        zip = await reparaturZip(reihe, laeufe);
        name = reparaturDateiname(reihe);
        const geplant = reihe.wiederholungen * DEFEKTE.length;
        eintrag = {
          erstellt: reihe.erstellt,
          laeufe: Math.ceil(reihe.faelle.length / DEFEKTE.length),
          geplant: reihe.wiederholungen,
          kostenUsd: reihe.summe.kosten_usd,
          app: reihe.app,
          ...(reihe.faelle.length < geplant ? { beendet: "abgebrochen" } : {}),
        };
      } else {
        const daten = await datenLaden();
        const s1Fest = art === "s2-s3" ? (await musterLaden()).s1Fest : undefined;
        const { reihe, ergebnisse } = await vergleichsreihe({
          daten,
          anbieter: anbieterFuer(schluessel, e),
          einstellungen: e,
          anzahl: n,
          signal: ctrl.signal,
          stand: (s) =>
            setZustand({
              art: "laeuft",
              stand: `Lauf ${s.nr} von ${s.anzahl} · ${s.stufe}${s.zeichen ? ` · ${s.zeichen.toLocaleString("de-DE")} Zeichen` : ""} · bisher ${formatUsd(s.kostenUsd)}`,
            }),
          quelle: "app",
          variante: kennung,
          umfang: art,
          s1Fest,
        });
        ergebnis = { art: "reihe", reihe, ergebnisse };
        zip = await reiheZip(reihe, ergebnisse);
        name = zipDateiname(reihe);
        eintrag = {
          erstellt: reihe.erstellt,
          laeufe: ergebnisse.length,
          geplant: reihe.laeufe_geplant,
          kostenUsd: reihe.kosten_usd_summe,
          app: reihe.app,
          ...(reihe.beendet ? { beendet: reihe.beendet } : {}),
        };
      }
      setZustand({ art: "fertig", ergebnis, zip, name });
      if (!eintrag.laeufe) return;
      // Auch wenn die Einstellungen inzwischen verlassen wurden, kommt die Datei beim Nutzer an
      dateiAnbieten(zipBlob(zip), name, "application/zip");
      try {
        await testlaufArchivieren({ ...eintrag, id: testlaufId(), art, titel, konfiguration, name, groesse: zip.byteLength }, zip);
        archiviert?.();
      } catch (err) {
        const archivFehler = String((err as Error)?.message || err);
        setZustand({ art: "fertig", ergebnis, zip, name, archivFehler });
      }
    } catch (err) {
      setZustand({ art: "fehler", text: String((err as Error)?.message || err) });
    } finally {
      abbruch.current = null;
    }
  }

  const planHinweis = reparatur
    ? `${gilt ? "" : "Varianten des Bewertungsplans lassen die Einstellungen unverändert. "}Je Variante ${PLAN_REPARATUR.wiederholungen} Läufe mit derselben App-Version.`
    : `${planWahl ? `${planWahl.plan.kurz} ` : "Varianten der Bewertungspläne lassen die Einstellungen unverändert. "}Je Variante ${
        (planWahl?.plan ?? plaene[0])?.wiederholungen
      } Läufe mit derselben App-Version${rollen.includes("reparatur") ? "; die Reparatur folgt dem KI-Profil des S2-Anbieters." : "."}`;

  return (
    <section className="testlauf einstellung-block" aria-labelledby="testlauf-titel">
      <h3 id="testlauf-titel">Neuer Testlauf</h3>
      <details className="anbieter-hinweise testlauf-fall">
        <summary>Zum Testfall Ilka</summary>
        <p>
          Grundlage sind sechs fiktive Ländermeldungen zum Orkantief „Ilka“ und die Meldung der Koordinierungsstelle des Beispielprofils (Referenzraum
          Bevölkerungsschutz in Deutschland, t0 14.10.2026, 14:00 Uhr, ohne Websuche, S1-Vorschlag unverändert übernommen). Testläufe aus der Musterfassung
          gehen von einer aus 21 Läufen konsolidierten Verdichtung aus. Die ZIP-Datei enthält Laufprotokolle, Ergebnisse, Prüfpunkte und eine Übersicht (CSV),
          um Konfigurationen miteinander zu vergleichen.
        </p>
      </details>
      <fieldset className="ablage-wahl testlauf-art">
        <legend>Was wird getestet?</legend>
        {TESTARTEN.map((u) => (
          <label key={u.id} className="ablage-option">
            <input type="radio" name="testlauf-art" value={u.id} checked={art === u.id} disabled={laeuft} onChange={() => artWaehlen(u.id)} />
            <span>
              <strong>{u.titel}</strong>
              {u.id === art && (
                <>
                  <br />
                  <span className="ablage-text">{u.text}</span>
                </>
              )}
            </span>
          </label>
        ))}
      </fieldset>
      <label className="feld">
        <span className="feld-label">Konfiguration</span>
        <select value={kennung ?? ""} disabled={laeuft} aria-describedby="testlauf-plan-hinweis" onChange={(ev) => setVariante(ev.target.value)}>
          <option value="">Aktuelle Einstellungen (Modelle & Aufwand)</option>
          {reparatur ? (
            <optgroup label={`Bewertungsplan ${PLAN_REPARATUR.id}`}>
              {PLAN_REPARATUR.varianten.map((v) => (
                <option key={v.kennung} value={`${PLAN_REPARATUR.id}/${v.kennung}`}>
                  {v.kennung}: S3 {v.reparatur.modell} ({aufwandTitel(aufwandAngeboten(v.reparatur.modell, v.reparatur.aufwand))})
                </option>
              ))}
            </optgroup>
          ) : (
            plaene.map((plan) => (
              <optgroup key={plan.id} label={`Bewertungsplan ${plan.id}`}>
                {plan.varianten.map((v) => (
                  <option key={v.kennung} value={`${plan.id}/${v.kennung}`}>
                    {varianteText(v, art)}
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </select>
        <span className="hinweis" id="testlauf-plan-hinweis">
          {planHinweis}
        </span>
      </label>
      <ul className="testlauf-konfiguration">
        {zeilen.map((z) => (
          <li key={z.r}>
            {TITEL[z.r]}: {z.modell || "kein Modell"} ({aufwandTitel(z.aufwand)}){z.anbieter ? ` · ${ANBIETER_NAME[z.anbieter]}` : ""}
            {z.r === "reparatur" && !reparatur ? " · nur bei Schemafehlern" : ""}
          </li>
        ))}
        {art === "s2-s3" && <li>S1: entfällt, Zuschnitt der Musterfassung (zwei Sachverhalte)</li>}
        {art === "s1-s2" && <li>S3: entfällt, Entwurf ohne Vervollständigung und Reparatur</li>}
        {reparatur && <li>S1 und S2: ohne KI-Aufruf, beschädigte Musterfassung</li>}
        {mistral && <li>Mistral-Endpunkt: {e.mistralEndpunkt === "global" ? "global (api.mistral.ai)" : "EU (api.eu.mistral.ai)"}</li>}
      </ul>
      <label className="feld">
        <span className="feld-label">Anzahl der Läufe</span>
        <input
          type="number"
          min={1}
          max={hoechstAnzahl(art)}
          value={anzahl}
          disabled={laeuft}
          onChange={(ev) => setAnzahl(Number(ev.target.value) || 1)}
          onBlur={() => setAnzahl(begrenzt(art, anzahl))}
        />
      </label>
      {reparatur ? (
        <p className="hinweis laufschaetzung">
          {n} Läufe mit je {DEFEKTE.length} Fällen, also {n * DEFEKTE.length} Fälle mit einer bis zwei Reparaturen: voraussichtlich{" "}
          {kostenText(reparaturKosten)} (grob, ohne Messwert{euAufschlag ? ", inkl. 10 % Aufschlag am EU-Endpunkt" : ""}). Maßgeblich ist die Abrechnung des
          Anbieters.
        </p>
      ) : (
        <p className="hinweis laufschaetzung">
          Voraussichtlich je Lauf {dauerJeLauf ? `${dauerText(dauerJeLauf)}, ` : ""}
          {kostenText(jeLauf)}
          {gemessen ? "" : " (grob, ohne Messwert für diese Konfiguration)"}; bei {n} Läufen zusammen {kostenText(zusammen)}
          {euAufschlag ? ", inkl. 10 % Aufschlag am EU-Endpunkt" : ""}. Maßgeblich ist die Abrechnung des Anbieters.
        </p>
      )}
      {fehlend.length > 0 && (
        <p className="hinweis" role="status">
          Für den Testlauf fehlt der Schlüssel für {fehlend.map((a) => ANBIETER_NAME[a]).join(" und ")} (Bereich „KI-Anbieter & API“).{" "}
          {zeige && (
            <button type="button" className="knopf leise klein" onClick={() => zeige("anbieter")}>
              Schlüssel hinterlegen
            </button>
          )}
        </p>
      )}
      <p>
        {!laeuft ? (
          <button type="button" className="knopf primaer" disabled={fehlend.length > 0 || ohneModell} onClick={starten}>
            Testlauf starten
          </button>
        ) : (
          <button type="button" className="knopf" onClick={() => abbruch.current?.abort()}>
            Abbrechen
          </button>
        )}
      </p>
      {laeuft && (
        <p className="hinweis" role="status" aria-live="polite">
          {testartInfo(art).titel} · {zustand.stand ?? "Beispielprofil wird geladen …"}. Bitte die Seite im Vordergrund und das Gerät entsperrt lassen. Die
          ZIP-Datei kommt am Ende auch dann, wenn die Einstellungen verlassen werden.
        </p>
      )}
      {zustand.art === "fehler" && (
        <p className="hinweis fehler" role="alert">
          Testlauf nicht möglich: {zustand.text}
        </p>
      )}
      {zustand.art === "fertig" && (
        <div role="status" className="testlauf-ergebnis">
          {zustand.ergebnis.art === "reihe" ? (
            <ReiheErgebnis reihe={zustand.ergebnis.reihe} ergebnisse={zustand.ergebnis.ergebnisse} />
          ) : zustand.ergebnis.art === "ms" ? (
            <MsErgebnis reihe={zustand.ergebnis.reihe} />
          ) : (
            <ReparaturErgebnis reihe={zustand.ergebnis.reihe} />
          )}
          {ergebnisAnzahl(zustand.ergebnis) > 0 && (
            <button type="button" className="knopf" onClick={() => dateiAnbieten(zipBlob(zustand.zip), zustand.name, "application/zip")}>
              ZIP herunterladen
            </button>
          )}
          {zustand.archivFehler && (
            <p className="hinweis fehler" role="alert">
              Der Testlauf ließ sich nicht im Archiv ablegen ({zustand.archivFehler}); die ZIP-Datei wurde trotzdem angeboten.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

const ergebnisAnzahl = (x: Ergebnis) => (x.art === "reihe" ? x.ergebnisse.length : x.art === "ms" ? x.reihe.laeufe.length : x.reihe.faelle.length);

const ja = (b: boolean | undefined) => (b === undefined ? "–" : b ? "ja" : "nein");

function ReiheErgebnis({ reihe, ergebnisse }: { reihe: Reihe; ergebnisse: EinzelErgebnis[] }) {
  const nurS1 = reihe.umfang === "s1";
  return (
    <>
      <p>
        {umfangInfo(reihe.umfang ?? UMFANG_VORGABE).titel}: {ergebnisse.length} von {reihe.laeufe_geplant} Läufen{reihe.beendet ? ` (${reihe.beendet})` : ""},
        technisch bestanden ({nurS1 ? "T1, T2, T4–T6" : "T1–T8"}): {reihe.technisch_bestanden}, zusammen {formatUsd(reihe.kosten_usd_summe)}.
      </p>
      {ergebnisse.length > 0 && (
        <table className="tabelle">
          <thead>
            <tr>
              <th>Lauf</th>
              <th>Status</th>
              <th>Dauer</th>
              <th>Kosten</th>
              <th>Sachverhalte</th>
              {nurS1 ? <th>Gliederung wie Musterfassung</th> : null}
              <th>{nurS1 ? "Prüfpunkte" : "T1–T8"}</th>
              {nurS1 ? <th>SOPs der Musterfassung</th> : <th>Plausibilität</th>}
            </tr>
          </thead>
          <tbody>
            {ergebnisse.map((x) => {
              const v = x.eintrag.s1_vergleich;
              return (
                <tr key={x.lauf.id}>
                  <td>{x.lauf.id}</td>
                  <td>{x.lauf.status}</td>
                  <td>{x.eintrag.dauer_s} s</td>
                  <td>{formatUsd(x.lauf.kostenUsd ?? x.lauf.kostenBekanntUsd)}</td>
                  <td>{nurS1 ? (v?.sachverhalte ?? "–") : x.meldung ? (x.lauf.vergleich?.ergebnis.paare.filter((p) => p.ki).length ?? "–") : "–"}</td>
                  {nurS1 ? <td>{ja(v?.gliederung_wie_muster)}</td> : null}
                  <td>
                    {x.eintrag.pruefpunkte.filter((p) => p.erfuellt).length}/{x.eintrag.pruefpunkte.length}
                  </td>
                  <td>
                    {nurS1
                      ? v && v.sop_abdeckung !== null
                        ? `${Math.round(v.sop_abdeckung * 100)} %${v.sops_zusaetzlich.length ? ` (+${v.sops_zusaetzlich.length})` : ""}`
                        : "–"
                      : x.eintrag.kennzahlen.plausibilitaet_befunde}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

function MsErgebnis({ reihe }: { reihe: KurzfassungsReihe }) {
  return (
    <>
      <p>
        {umfangInfo("ms").titel}: {reihe.laeufe.length} von {reihe.laeufe_geplant} Läufen{reihe.beendet ? ` (${reihe.beendet})` : ""}, ohne Auffälligkeit der
        Vorprüfung: {reihe.ohne_auffaelligkeit}, zusammen {formatUsd(reihe.kosten_usd_summe)}. Die Vorprüfung ersetzt die Prüfung von Hand nicht.
      </p>
      {reihe.laeufe.length > 0 && (
        <table className="tabelle">
          <thead>
            <tr>
              <th>Lauf</th>
              <th>Status</th>
              <th>Dauer</th>
              <th>Kosten</th>
              <th>Wörter</th>
              <th>Kurztitel</th>
              <th>Auffälligkeiten</th>
            </tr>
          </thead>
          <tbody>
            {reihe.laeufe.map((l) => (
              <tr key={l.lauf}>
                <td>{l.lauf}</td>
                <td>{l.status}</td>
                <td>{l.dauer_s ?? "–"} s</td>
                <td>{formatUsd(l.kosten_usd)}</td>
                <td>{l.vorpruefung?.woerter ?? "–"}</td>
                <td>{l.struktur ? l.struktur.kurztitel.length : "–"}</td>
                <td>{l.fehler ? l.fehler : l.auffaelligkeiten.length ? l.auffaelligkeiten.join("; ") : "keine"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function ReparaturErgebnis({ reihe }: { reihe: ReparaturReihe }) {
  const s = reihe.summe;
  return (
    <>
      <p>
        {REPARATUR.titel}: {s.faelle} Fälle, schemakonform nach der Reparatur: {s.schemakonform}, Reparaturen: {s.reparaturen}, beschädigte Stellen wie im
        Original: {s.stellen_wie_original ?? "–"}, übrige Inhalte erhalten im Mittel:{" "}
        {s.anteil_erhalten_mittel === null ? "–" : `${Math.round(s.anteil_erhalten_mittel * 1000) / 10} %`}, zusammen {formatUsd(s.kosten_usd)}.
      </p>
      {reihe.faelle.length > 0 && (
        <table className="tabelle">
          <thead>
            <tr>
              <th>Defekt</th>
              <th>Lauf</th>
              <th>Schemakonform</th>
              <th>Reparaturen</th>
              <th>Stellen wie Original</th>
              <th>Inhalte erhalten</th>
              <th>Kosten</th>
            </tr>
          </thead>
          <tbody>
            {reihe.faelle.map((f) => (
              <tr key={f.lauf}>
                <td>{f.defekt}</td>
                <td>{f.wiederholung}</td>
                <td>{f.schemakonform ? "ja" : "nein"}</td>
                <td>{f.reparaturen}</td>
                <td>{f.stellen_wie_original === undefined ? "–" : f.stellen_wie_original ? "ja" : "nein"}</td>
                <td>{f.anteil_erhalten === null ? "–" : `${f.felder_gleich}/${f.felder_geprueft}`}</td>
                <td>{formatUsd(f.kosten_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// ── Archiv ────────────────────────────────────────────────────────────────────

const zeitText = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function TestlaufArchiv({ aktualisierung = 0 }: { aktualisierung?: number }) {
  const [liste, setListe] = useState<TestlaufEintrag[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [beschaeftigt, setBeschaeftigt] = useState(false);

  const laden = async () => {
    try {
      const l = await testlaeufeLaden();
      setListe(l);
      setFehler(null);
      // Auswahl auf vorhandene Einträge beschränken
      setAuswahl((a) => new Set([...a].filter((id) => l.some((x) => x.id === id))));
    } catch (err) {
      setListe([]);
      setFehler(`Das Archiv ist auf diesem Gerät nicht verfügbar (${String((err as Error)?.message || err)}).`);
    }
  };
  useEffect(() => {
    void laden();
  }, [aktualisierung]);

  const herunterladen = async (x: TestlaufEintrag) => {
    try {
      const zip = await testlaufZip(x.id);
      if (!zip) throw new Error("die ZIP-Datei fehlt im Archiv");
      dateiAnbieten(zipBlob(zip), x.name, "application/zip");
    } catch (err) {
      setFehler(`${x.name} ließ sich nicht herunterladen: ${String((err as Error)?.message || err)}.`);
    }
  };

  const loeschen = async (ids: string[], frage: string) => {
    if (!ids.length || !confirm(frage)) return;
    setBeschaeftigt(true);
    try {
      await testlaeufeLoeschen(ids);
    } catch (err) {
      setFehler(`Löschen nicht vollständig möglich: ${String((err as Error)?.message || err)}.`);
    } finally {
      setBeschaeftigt(false);
      await laden();
    }
  };

  const eintraege = liste ?? [];
  const gesamt = eintraege.reduce((a, x) => a + x.groesse, 0);
  const alleGewaehlt = eintraege.length > 0 && eintraege.every((x) => auswahl.has(x.id));
  const umschalten = (id: string) =>
    setAuswahl((a) => {
      const neu = new Set(a);
      if (neu.has(id)) neu.delete(id);
      else neu.add(id);
      return neu;
    });
  const zahl = (k: number) => (k === 1 ? "einen archivierten Testlauf" : `${k} archivierte Testläufe`);

  return (
    <section className="testlauf-archiv einstellung-block" aria-labelledby="testlauf-archiv-titel">
      <h3 id="testlauf-archiv-titel">Archiv</h3>
      {liste === null ? (
        <p className="hinweis">Archiv wird geladen …</p>
      ) : eintraege.length === 0 ? (
        !fehler && <p className="hinweis">Noch keine Testläufe archiviert. Jeder Testlauf mit mindestens einem Ergebnis kommt hierher.</p>
      ) : (
        <>
          <p className="hinweis">
            {eintraege.length === 1 ? "Ein Testlauf" : `${eintraege.length} Testläufe`}, zusammen {groesseText(gesamt)}, nur auf diesem Gerät. Sie bleiben, bis
            du sie löschst.
          </p>
          <div className="aktionen testlauf-archiv-aktionen">
            <label className="testlauf-archiv-alle">
              <input
                type="checkbox"
                checked={alleGewaehlt}
                disabled={beschaeftigt}
                onChange={() => setAuswahl(alleGewaehlt ? new Set() : new Set(eintraege.map((x) => x.id)))}
              />{" "}
              Alle auswählen
            </label>
            <button
              type="button"
              className="knopf"
              disabled={beschaeftigt || auswahl.size === 0}
              onClick={() => loeschen([...auswahl], `${zahl(auswahl.size)} löschen? Die ZIP-Dateien lassen sich danach nicht wiederherstellen.`)}
            >
              Ausgewählte löschen{auswahl.size ? ` (${auswahl.size})` : ""}
            </button>
            <button
              type="button"
              className="knopf leise"
              disabled={beschaeftigt}
              onClick={() =>
                loeschen(
                  eintraege.map((x) => x.id),
                  `Alle ${eintraege.length === 1 ? "" : `${eintraege.length} `}archivierten Testläufe löschen? Die ZIP-Dateien lassen sich danach nicht wiederherstellen.`,
                )
              }
            >
              Alle löschen
            </button>
          </div>
          <ul className="testlauf-archiv-liste">
            {eintraege.map((x) => (
              <li key={x.id}>
                <label className="testlauf-archiv-wahl">
                  <input
                    type="checkbox"
                    checked={auswahl.has(x.id)}
                    disabled={beschaeftigt}
                    onChange={() => umschalten(x.id)}
                    aria-label={`Auswählen: ${x.titel}, ${zeitText(x.erstellt)}`}
                  />
                  <span>
                    <strong>
                      {zeitText(x.erstellt)} · {x.titel}
                    </strong>
                    <br />
                    <span className="ablage-text">{x.konfiguration}</span>
                    <br />
                    <span className="ablage-text">
                      {x.laeufe} von {x.geplant} Läufen{x.beendet ? ` (${x.beendet})` : ""} · {formatUsd(x.kostenUsd)} · {groesseText(x.groesse)} · {x.app}
                    </span>
                  </span>
                </label>
                <button type="button" className="knopf klein" aria-label={`ZIP herunterladen: ${x.name}`} onClick={() => herunterladen(x)}>
                  Herunterladen
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {fehler && (
        <p className="hinweis fehler" role="alert">
          {fehler}
        </p>
      )}
    </section>
  );
}
