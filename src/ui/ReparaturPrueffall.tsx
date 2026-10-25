// Prüffall Reparatur unter „Einstellungen → Modelle & Verarbeitung“ (seit 0.5.12, AV-2026-W43-25): beschädigt die
// Musterfassung Ilka gezielt (Defekte R1–R5), lässt sie mit dem gewählten Modell reparieren und misst, ob der Entwurf
// danach schemakonform ist und die übrigen Inhalte erhalten bleiben. Nur die Reparatur ruft einen Anbieter auf.

import { useRef, useState } from "react";
import { formatUsd } from "../anbieter/preise";
import { ANBIETER_NAME, anbieterVon, Verteiler, type Schluessel } from "../anbieter/verteiler";
import type { LlmAnbieter } from "../anbieter/typen";
import type { Profil } from "../kern/typen";
import { AUFWAND_STUFEN, aufwandAngeboten, type Einstellungen } from "../pipeline/einstellungen";
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
  type ReparaturStand,
} from "../pipeline/reparaturtest";
import { kostenText } from "../pipeline/schaetzung";
import type { FallDaten } from "../pipeline/vergleichslauf";
import { fallDatenEingebaut } from "../pipeline/vergleichslauf-eingebaut";
import { dateiAnbieten } from "../speicher/speicher";
import { vergleichsEinstellungen } from "./Vergleichslauf";
import { useWachhalten } from "./wachhalten";

const aufwandTitel = (a: string) => AUFWAND_STUFEN.find((x) => x.id === a)?.titel ?? a;

export interface ReparaturPrueffallProps {
  profil: Profil | null;
  einstellungen: Einstellungen;
  schluessel: Schluessel;
  /** für Tests: Laden des Beispielprofils und Anbieter austauschbar */
  datenLaden?: () => Promise<FallDaten>;
  anbieterFuer?: (schluessel: Schluessel, e: Einstellungen) => LlmAnbieter;
}

type Zustand =
  | { art: "bereit" }
  | { art: "laeuft"; stand?: ReparaturStand }
  | { art: "fertig"; reihe: ReparaturReihe; zip: Uint8Array; name: string }
  | { art: "fehler"; text: string };

export function ReparaturPrueffallAbschnitt({
  profil,
  einstellungen,
  schluessel,
  datenLaden = fallDatenEingebaut,
  anbieterFuer = (s, e) => Verteiler.fuer(s, { mistralEndpunkt: e.mistralEndpunkt }),
}: ReparaturPrueffallProps) {
  const [durchgaenge, setDurchgaenge] = useState(PLAN_REPARATUR.wiederholungen);
  /** leer: Reparaturmodell der aktuellen Einstellungen; sonst Kennung einer Variante des Plans reparatur-ilka */
  const [kennung, setKennung] = useState("");
  const [zustand, setZustand] = useState<Zustand>({ art: "bereit" });
  const abbruch = useRef<AbortController | null>(null);
  const laeuft = zustand.art === "laeuft";
  useWachhalten(laeuft);

  const variante = PLAN_REPARATUR.varianten.find((v) => v.kennung === kennung);
  const basis = vergleichsEinstellungen(einstellungen, profil);
  const e = variante ? einstellungenFuerReparatur(basis, variante) : basis;
  const modell = e.modelle.reparatur || "";
  const aufwand = modell ? aufwandAngeboten(modell, e.aufwand.reparatur) : e.aufwand.reparatur;
  const anbieter = modell ? anbieterVon(modell) : undefined;
  const fehlt = anbieter && !schluessel[anbieter] ? anbieter : undefined;
  const n = durchgaengeBegrenzt(durchgaenge);
  const kosten = modell ? schaetzePrueffall(modell, n, { mistralEndpunkt: e.mistralEndpunkt ?? "eu" }) : null;

  async function starten() {
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    setZustand({ art: "laeuft" });
    try {
      const daten = await datenLaden();
      const { reihe, laeufe } = await reparaturReihe({
        daten,
        anbieter: anbieterFuer(schluessel, e),
        einstellungen: e,
        wiederholungen: n,
        signal: ctrl.signal,
        stand: (stand) => setZustand({ art: "laeuft", stand }),
        quelle: "app",
        variante: variante ? `${PLAN_REPARATUR.id}/${variante.kennung}` : undefined,
      });
      const zip = await reparaturZip(reihe, laeufe);
      const name = reparaturDateiname(reihe);
      setZustand({ art: "fertig", reihe, zip, name });
      // Auch wenn die Einstellungen inzwischen verlassen wurden, kommt die Datei beim Nutzer an
      if (reihe.faelle.length) dateiAnbieten(new Blob([zip as BlobPart], { type: "application/zip" }), name, "application/zip");
    } catch (err) {
      setZustand({ art: "fehler", text: String((err as Error)?.message || err) });
    } finally {
      abbruch.current = null;
    }
  }

  return (
    <section className="vergleichslauf" aria-labelledby="reparatur-prueffall-titel">
      <h3 id="reparatur-prueffall-titel">Prüffall Reparatur</h3>
      <p>
        Prüft das Modell der Reparatur (S3), die nur bei Schemafehlern läuft: Die App beschädigt die fiktive Musterfassung Ilka gezielt an festen Stellen (
        {DEFEKTE.map((d) => d.id.split("-")[0]).join(", ")}: Radarwert außerhalb der Skala, unzulässige Beurteilung, unbekannte Ereignisart, Radarwert als Text,
        drei Fehler zugleich) und lässt sie mit dem gewählten Modell reparieren. S1 und S2 rufen keinen Anbieter auf. Gemessen wird je Fall, ob der Entwurf
        danach schemakonform ist, wie viele Reparaturen es brauchte und ob die übrigen Inhalte unverändert bleiben. Ergebnis als ZIP.
      </p>
      <label className="feld">
        <span className="feld-label">Reparaturmodell</span>
        <select value={kennung} disabled={laeuft} aria-describedby="reparatur-prueffall-hinweis" onChange={(ev) => setKennung(ev.target.value)}>
          <option value="">Aktuelle Einstellungen (Tabelle oben)</option>
          <optgroup label={`Bewertungsplan ${PLAN_REPARATUR.id}`}>
            {PLAN_REPARATUR.varianten.map((v) => (
              <option key={v.kennung} value={v.kennung}>
                {v.kennung}: {v.reparatur.modell} ({aufwandTitel(aufwandAngeboten(v.reparatur.modell, v.reparatur.aufwand))})
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <p className="hinweis" id="reparatur-prueffall-hinweis">
        Varianten des Bewertungsplans lassen die Einstellungen unverändert. Je Variante {PLAN_REPARATUR.wiederholungen} Durchgänge mit derselben App-Version.
      </p>
      <ul className="vergleichslauf-konfiguration">
        <li>
          S3 Reparatur: {modell || "kein Modell"} ({aufwandTitel(aufwand)}){anbieter ? ` · ${ANBIETER_NAME[anbieter]}` : ""}
        </li>
        {anbieter === "mistral" && <li>Mistral-Endpunkt: {e.mistralEndpunkt === "global" ? "global (api.mistral.ai)" : "EU (api.eu.mistral.ai)"}</li>}
      </ul>
      <label className="feld">
        <span className="feld-label">Durchgänge</span>
        <input
          type="number"
          min={1}
          max={DURCHGAENGE_MAX}
          value={durchgaenge}
          disabled={laeuft}
          onChange={(ev) => setDurchgaenge(Number(ev.target.value) || 1)}
          onBlur={() => setDurchgaenge(durchgaengeBegrenzt(durchgaenge))}
        />
      </label>
      <p className="hinweis laufschaetzung">
        {n} Durchgänge mit je {DEFEKTE.length} Fällen, also {n * DEFEKTE.length} Fälle mit einer bis zwei Reparaturen: voraussichtlich {kostenText(kosten)}{" "}
        (grob, ohne Messwert{anbieter === "mistral" && e.mistralEndpunkt !== "global" ? ", inkl. 10 % Aufschlag am EU-Endpunkt" : ""}). Maßgeblich ist die
        Abrechnung des Anbieters.
      </p>
      {fehlt && (
        <p className="hinweis" role="status">
          Für den Prüffall fehlt der Schlüssel für {ANBIETER_NAME[fehlt]} (Bereich „KI-Anbieter & API“).
        </p>
      )}
      <p>
        {!laeuft ? (
          <button type="button" className="knopf primaer" disabled={!!fehlt || !modell} onClick={starten}>
            Prüffall starten
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
            ? `Fall ${zustand.stand.nr} von ${zustand.stand.anzahl} · ${zustand.stand.defekt} · bisher ${formatUsd(zustand.stand.kostenUsd)}`
            : "Beispielprofil wird geladen …"}
          . Bitte die Seite im Vordergrund und das Gerät entsperrt lassen.
        </p>
      )}
      {zustand.art === "fehler" && (
        <p className="hinweis fehler" role="alert">
          Prüffall nicht möglich: {zustand.text}
        </p>
      )}
      {zustand.art === "fertig" && (
        <div role="status">
          <p>
            {zustand.reihe.summe.faelle} Fälle, schemakonform nach der Reparatur: {zustand.reihe.summe.schemakonform}, Reparaturen:{" "}
            {zustand.reihe.summe.reparaturen}, übrige Inhalte erhalten im Mittel:{" "}
            {zustand.reihe.summe.anteil_erhalten_mittel === null ? "–" : `${Math.round(zustand.reihe.summe.anteil_erhalten_mittel * 1000) / 10} %`}, zusammen{" "}
            {formatUsd(zustand.reihe.summe.kosten_usd)}.
          </p>
          {zustand.reihe.faelle.length > 0 && (
            <table className="tabelle">
              <thead>
                <tr>
                  <th>Defekt</th>
                  <th>Durchgang</th>
                  <th>Schemakonform</th>
                  <th>Reparaturen</th>
                  <th>Inhalte erhalten</th>
                  <th>Kosten</th>
                </tr>
              </thead>
              <tbody>
                {zustand.reihe.faelle.map((f) => (
                  <tr key={f.lauf}>
                    <td>{f.defekt}</td>
                    <td>{f.wiederholung}</td>
                    <td>{f.schemakonform ? "ja" : "nein"}</td>
                    <td>{f.reparaturen}</td>
                    <td>{f.anteil_erhalten === null ? "–" : `${f.felder_gleich}/${f.felder_geprueft}`}</td>
                    <td>{formatUsd(f.kosten_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {zustand.reihe.faelle.length > 0 && (
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
