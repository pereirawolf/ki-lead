// Vergleichslauf Ilka unter „Einstellungen → Modelle & Verarbeitung“ (seit 0.5.8): startet mit der gewählten
// Konfiguration von Modell und Aufwand eine Reihe von Läufen am Standardfall „Ilka“ und stellt das Ergebnis als ZIP
// bereit (Laufprotokolle, Ergebnisse, Prüfpunkte, Vergleich, Übersicht als CSV). Seit 0.5.12 mit Wahl des Umfangs:
// S1, S1 + S2 oder S1 + S2 + S3 aus den sechs Eingängen, S2 + S3 oder Management Summary aus der Musterfassung.

import { useRef, useState } from "react";
import { formatUsd } from "../anbieter/preise";
import { ANBIETER_NAME, anbieterVon, Verteiler, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import type { LlmAnbieter } from "../anbieter/typen";
import type { Profil } from "../kern/typen";
import { APP_MODELLE, AUFWAND_STUFEN, aufwandAngeboten, modellFuer, type Einstellungen, type Rolle } from "../pipeline/einstellungen";
import { kurzfassungsreihe, kurzfassungsZip, kurzfassungsZipName, MS_EINGABE_TOKEN, type KurzfassungsReihe } from "../pipeline/kurzfassungsreihe";
import { kostenText, dauerText, schaetzeKurzfassung, schaetzeStufe, summe, type Schaetzung } from "../pipeline/schaetzung";
import {
  ANZAHL_MAX,
  ANZAHL_VORGABE,
  anzahlBegrenzt,
  einstellungenFuerVariante,
  plaeneFuer,
  planVarianteZu,
  reiheZip,
  rollenFuer,
  UMFAENGE,
  UMFANG_VORGABE,
  umfangInfo,
  vergleichsreihe,
  VERGLEICH_ROLLEN,
  zipDateiname,
  type EinzelErgebnis,
  type FallDaten,
  type PlanVariante,
  type Reihe,
  type ReiheStand,
  type Umfang,
} from "../pipeline/vergleichslauf";
import { fallDatenEingebaut, musterDatenEingebaut, type MusterDaten } from "../pipeline/vergleichslauf-eingebaut";
import { dateiAnbieten } from "../speicher/speicher";
import { useWachhalten } from "./wachhalten";

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

export interface VergleichslaufProps {
  /** aktives Profil der App: bestimmt, welche Modellvorgabe in den Einstellungen gilt */
  profil: Profil | null;
  einstellungen: Einstellungen;
  schluessel: Schluessel;
  /** für Tests: Laden des Beispielprofils, der Musterfassung und Anbieter austauschbar */
  datenLaden?: () => Promise<FallDaten>;
  musterLaden?: () => Promise<MusterDaten>;
  anbieterFuer?: (schluessel: Schluessel, e: Einstellungen) => LlmAnbieter;
}

type Ergebnis = { art: "reihe"; reihe: Reihe; ergebnisse: EinzelErgebnis[] } | { art: "ms"; reihe: KurzfassungsReihe };

type Zustand =
  | { art: "bereit" }
  | { art: "laeuft"; stand?: ReiheStand }
  | { art: "fertig"; ergebnis: Ergebnis; zip: Uint8Array; name: string }
  | { art: "fehler"; text: string };

/** Einstellungen mit ausdrücklichem Modell je Aufgabe: so, wie sie die Tabelle oben für das aktive Profil anzeigt */
export function vergleichsEinstellungen(e: Einstellungen, profil: Profil | null): Einstellungen {
  const modelle = { ...e.modelle };
  for (const r of [...VERGLEICH_ROLLEN, "kurzfassung"] as Rolle[]) modelle[r] = profil ? modellFuer(r, e, profil) : e.modelle[r] || APP_MODELLE[r];
  return { ...e, modelle };
}

export function VergleichslaufAbschnitt({
  profil,
  einstellungen,
  schluessel,
  datenLaden = fallDatenEingebaut,
  musterLaden = () => musterDatenEingebaut(),
  anbieterFuer = (s, e) => Verteiler.fuer(s, { mistralEndpunkt: e.mistralEndpunkt }),
}: VergleichslaufProps) {
  const [umfang, setUmfang] = useState<Umfang>(UMFANG_VORGABE);
  const [anzahl, setAnzahl] = useState(ANZAHL_VORGABE);
  /** leer: aktuelle Einstellungen; sonst „<Plan>/<Kennung>“ einer Variante der Pläne, die zum Umfang passen */
  const [variante, setVariante] = useState("");
  const [zustand, setZustand] = useState<Zustand>({ art: "bereit" });
  const abbruch = useRef<AbortController | null>(null);
  const laeuft = zustand.art === "laeuft";
  useWachhalten(laeuft);

  const plaene = plaeneFuer(umfang);
  const info = umfangInfo(umfang);
  const rollen = rollenFuer(umfang);
  const kandidat = variante ? planVarianteZu(variante) : undefined;
  const gewaehlt = kandidat && kandidat.plan.umfaenge.includes(umfang) ? kandidat : undefined;
  const planVariante = gewaehlt?.variante;
  const e = planVariante ? einstellungenFuerVariante(einstellungen, planVariante) : vergleichsEinstellungen(einstellungen, profil);
  const zeilen = rollen.map((r) => {
    const modell = e.modelle[r] || "";
    // Stufe so, wie das Modell sie anbietet (AV-2026-W43-02)
    return { r, modell, aufwand: modell ? aufwandAngeboten(modell, e.aufwand[r]) : e.aufwand[r], anbieter: modell ? anbieterVon(modell) : undefined };
  });
  const fehlend = [...new Set(zeilen.filter((z) => z.r !== "reparatur" && z.anbieter && !schluessel[z.anbieter]).map((z) => z.anbieter!))] as AnbieterId[];
  const ohneModell = zeilen.some((z) => z.r !== "reparatur" && !z.modell);
  const mistral = zeilen.some((z) => z.anbieter === "mistral");

  // Kosten mit dem Aufschlag des Mistral-EU-Endpunkts (AV-2026-W43-06)
  const endpunkt = { mistralEndpunkt: e.mistralEndpunkt ?? "eu" } as const;
  const schaetzungen: Schaetzung[] =
    umfang === "ms"
      ? [schaetzeKurzfassung(e.modelle.kurzfassung, e.aufwand.kurzfassung, MS_EINGABE_TOKEN, endpunkt)]
      : [
          ...(rollen.includes("vorverarbeitung") ? [schaetzeStufe("s1", e.modelle.vorverarbeitung, e.aufwand.vorverarbeitung, endpunkt)] : []),
          ...(rollen.includes("verdichtung") ? [schaetzeStufe("verdichtung", e.modelle.verdichtung, e.aufwand.verdichtung, endpunkt)] : []),
        ];
  const jeLauf = summe(schaetzungen.map((s) => s.usd));
  const dauerJeLauf = schaetzungen.every((s) => s.sekunden)
    ? schaetzungen.reduce<[number, number]>((x, s) => [x[0] + s.sekunden![0], x[1] + s.sekunden![1]], [0, 0])
    : null;
  const gemessen = schaetzungen.every((s) => s.gemessen);
  const n = anzahlBegrenzt(anzahl);
  const zusammen = jeLauf ? ([jeLauf[0] * n, jeLauf[1] * n] as [number, number]) : null;

  function umfangWaehlen(u: Umfang) {
    setUmfang(u);
    // Eine Variante bleibt nur, wenn ihr Plan auch für den neuen Umfang gilt
    if (variante && !planVarianteZu(variante)?.plan.umfaenge.includes(u)) setVariante("");
  }

  async function starten() {
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    setZustand({ art: "laeuft" });
    const kennung = gewaehlt ? `${gewaehlt.plan.id}/${gewaehlt.variante.kennung}` : undefined;
    const stand = (s: ReiheStand) => setZustand({ art: "laeuft", stand: s });
    try {
      let fertig: Extract<Zustand, { art: "fertig" }>;
      let anzahlErgebnisse: number;
      if (umfang === "ms") {
        const [daten, muster] = await Promise.all([datenLaden(), musterLaden()]);
        const { reihe, ergebnisse } = await kurzfassungsreihe({
          profil: daten.profil,
          musterfassung: muster.musterfassung,
          anbieter: anbieterFuer(schluessel, e),
          einstellungen: e,
          anzahl: n,
          signal: ctrl.signal,
          stand,
          quelle: "app",
          variante: kennung,
        });
        fertig = { art: "fertig", ergebnis: { art: "ms", reihe }, zip: await kurzfassungsZip(reihe, ergebnisse), name: kurzfassungsZipName(reihe) };
        anzahlErgebnisse = reihe.laeufe.length;
      } else {
        const daten = await datenLaden();
        const s1Fest = umfang === "s2-s3" ? (await musterLaden()).s1Fest : undefined;
        const { reihe, ergebnisse } = await vergleichsreihe({
          daten,
          anbieter: anbieterFuer(schluessel, e),
          einstellungen: e,
          anzahl: n,
          signal: ctrl.signal,
          stand,
          quelle: "app",
          variante: kennung,
          umfang,
          s1Fest,
        });
        fertig = { art: "fertig", ergebnis: { art: "reihe", reihe, ergebnisse }, zip: await reiheZip(reihe, ergebnisse), name: zipDateiname(reihe) };
        anzahlErgebnisse = ergebnisse.length;
      }
      setZustand(fertig);
      // Auch wenn die Einstellungen inzwischen verlassen wurden, kommt die Datei beim Nutzer an
      if (anzahlErgebnisse) dateiAnbieten(new Blob([fertig.zip as BlobPart], { type: "application/zip" }), fertig.name, "application/zip");
    } catch (err) {
      setZustand({ art: "fehler", text: String((err as Error)?.message || err) });
    } finally {
      abbruch.current = null;
    }
  }

  const reparatur = rollen.includes("reparatur");
  return (
    <section className="vergleichslauf" aria-labelledby="vergleichslauf-titel">
      <h3 id="vergleichslauf-titel">Vergleichslauf Ilka</h3>
      <p>
        Testet die KI-Erfassung am Standardfall „Ilka“: sechs fiktive Ländermeldungen zum Orkantief und die Meldung der Koordinierungsstelle des Beispielprofils
        (Referenzraum Bevölkerungsschutz in Deutschland, t0 14.10.2026, 14:00 Uhr, ohne Websuche, S1-Vorschlag unverändert übernommen). Grundlage sind die
        Eingänge (Rohdaten) oder die Musterfassung, eine aus 21 Läufen konsolidierte Verdichtung. Ergebnis als ZIP mit Laufprotokollen, Ergebnissen, Prüfpunkten
        und einer Übersicht (CSV), um Konfigurationen miteinander zu vergleichen.
      </p>
      <fieldset className="ablage-wahl vergleichslauf-umfang">
        <legend>Was wird getestet?</legend>
        {UMFAENGE.map((u) => (
          <label key={u.id} className="ablage-option">
            <input type="radio" name="vergleichslauf-umfang" value={u.id} checked={umfang === u.id} disabled={laeuft} onChange={() => umfangWaehlen(u.id)} />
            <span>
              <strong>{u.titel}</strong>
              {u.id === umfang && (
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
        <select value={gewaehlt ? variante : ""} disabled={laeuft} onChange={(ev) => setVariante(ev.target.value)}>
          <option value="">Aktuelle Einstellungen (Tabelle oben)</option>
          {plaene.map((plan) => (
            <optgroup key={plan.id} label={`Bewertungsplan ${plan.id}`}>
              {plan.varianten.map((v) => (
                <option key={v.kennung} value={`${plan.id}/${v.kennung}`}>
                  {varianteText(v, umfang)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="hinweis">
          {gewaehlt ? `${gewaehlt.plan.kurz} ` : "Varianten der Bewertungspläne lassen die Einstellungen unverändert. "}Je Variante{" "}
          {(gewaehlt?.plan ?? plaene[0]).wiederholungen} Läufe mit derselben App-Version
          {reparatur ? "; die Reparatur folgt dem Standard-Profil des S2-Anbieters." : "."}
        </span>
      </label>
      <ul className="vergleichslauf-konfiguration">
        {zeilen.map((z) => (
          <li key={z.r}>
            {TITEL[z.r]}: {z.modell || "kein Modell"} ({aufwandTitel(z.aufwand)}){z.anbieter ? ` · ${ANBIETER_NAME[z.anbieter]}` : ""}
            {z.r === "reparatur" ? " · nur bei Schemafehlern" : ""}
          </li>
        ))}
        {umfang === "s2-s3" && <li>S1: entfällt, Zuschnitt der Musterfassung (zwei Sachverhalte)</li>}
        {umfang === "s1-s2" && <li>S3: entfällt, Entwurf ohne Vervollständigung und Reparatur</li>}
        {mistral && <li>Mistral-Endpunkt: {e.mistralEndpunkt === "global" ? "global (api.mistral.ai)" : "EU (api.eu.mistral.ai)"}</li>}
      </ul>
      <label className="feld">
        <span className="feld-label">Anzahl der Läufe</span>
        <input
          type="number"
          min={1}
          max={ANZAHL_MAX}
          value={anzahl}
          disabled={laeuft}
          onChange={(ev) => setAnzahl(Number(ev.target.value) || 1)}
          onBlur={() => setAnzahl(anzahlBegrenzt(anzahl))}
        />
      </label>
      <p className="hinweis laufschaetzung">
        Voraussichtlich je Lauf {dauerJeLauf ? `${dauerText(dauerJeLauf)}, ` : ""}
        {kostenText(jeLauf)}
        {gemessen ? "" : " (grob, ohne Messwert für diese Konfiguration)"}; bei {n} Läufen zusammen {kostenText(zusammen)}
        {mistral && e.mistralEndpunkt !== "global" ? ", inkl. 10 % Aufschlag am EU-Endpunkt" : ""}. Maßgeblich ist die Abrechnung des Anbieters.
      </p>
      {fehlend.length > 0 && (
        <p className="hinweis" role="status">
          Für den Vergleichslauf fehlt der Schlüssel für {fehlend.map((a) => ANBIETER_NAME[a]).join(" und ")} (Bereich „KI-Anbieter & API“).
        </p>
      )}
      <p>
        {!laeuft ? (
          <button type="button" className="knopf primaer" disabled={fehlend.length > 0 || ohneModell} onClick={starten}>
            Vergleichslauf starten
          </button>
        ) : (
          <button type="button" className="knopf" onClick={() => abbruch.current?.abort()}>
            Abbrechen
          </button>
        )}
      </p>
      {laeuft && (
        <p className="hinweis" role="status" aria-live="polite">
          {zustand.stand
            ? `${info.titel} · Lauf ${zustand.stand.nr} von ${zustand.stand.anzahl} · ${zustand.stand.stufe}${zustand.stand.zeichen ? ` · ${zustand.stand.zeichen.toLocaleString("de-DE")} Zeichen` : ""} · bisher ${formatUsd(zustand.stand.kostenUsd)}`
            : "Beispielprofil wird geladen …"}
          . Bitte die Seite im Vordergrund und das Gerät entsperrt lassen. Die ZIP-Datei kommt am Ende auch dann, wenn die Einstellungen verlassen werden.
        </p>
      )}
      {zustand.art === "fehler" && (
        <p className="hinweis fehler" role="alert">
          Vergleichslauf nicht möglich: {zustand.text}
        </p>
      )}
      {zustand.art === "fertig" && (
        <div role="status">
          {zustand.ergebnis.art === "reihe" ? (
            <ReiheErgebnis reihe={zustand.ergebnis.reihe} ergebnisse={zustand.ergebnis.ergebnisse} />
          ) : (
            <MsErgebnis reihe={zustand.ergebnis.reihe} />
          )}
          {(zustand.ergebnis.art === "reihe" ? zustand.ergebnis.ergebnisse.length : zustand.ergebnis.reihe.laeufe.length) > 0 && (
            <button
              type="button"
              className="knopf"
              onClick={() => dateiAnbieten(new Blob([zustand.zip as BlobPart], { type: "application/zip" }), zustand.name, "application/zip")}
            >
              ZIP herunterladen
            </button>
          )}
        </div>
      )}
    </section>
  );
}

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
