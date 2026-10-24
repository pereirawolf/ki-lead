// Vergleichslauf Ilka unter „Einstellungen → Modelle & Verarbeitung“ (seit 0.5.8): startet mit der gewählten
// Konfiguration von Modell und Aufwand eine Reihe von Verdichtungen des Standardfalls „Ilka“ und stellt das Ergebnis
// als ZIP bereit (Laufprotokolle, Entwürfe, Prüfpunkte, Vergleich mit der Redaktionsfassung, Übersicht als CSV).

import { useRef, useState } from "react";
import { formatUsd } from "../anbieter/preise";
import { ANBIETER_NAME, anbieterVon, Verteiler, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import type { LlmAnbieter } from "../anbieter/typen";
import type { Profil } from "../kern/typen";
import { APP_MODELLE, AUFWAND_STUFEN, modellFuer, type Einstellungen, type Rolle } from "../pipeline/einstellungen";
import { kostenText, dauerText, schaetzeStufe, summe } from "../pipeline/schaetzung";
import {
  ANZAHL_MAX,
  ANZAHL_VORGABE,
  anzahlBegrenzt,
  einstellungenFuerVariante,
  PLAN_STANDARDPROFILE,
  reiheZip,
  vergleichsreihe,
  VERGLEICH_ROLLEN,
  zipDateiname,
  type EinzelErgebnis,
  type FallDaten,
  type Reihe,
  type ReiheStand,
} from "../pipeline/vergleichslauf";
import { fallDatenEingebaut } from "../pipeline/vergleichslauf-eingebaut";
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

export interface VergleichslaufProps {
  /** aktives Profil der App: bestimmt, welche Modellvorgabe in den Einstellungen gilt */
  profil: Profil | null;
  einstellungen: Einstellungen;
  schluessel: Schluessel;
  /** für Tests: Laden des Beispielprofils und Anbieter austauschbar */
  datenLaden?: () => Promise<FallDaten>;
  anbieterFuer?: (schluessel: Schluessel, e: Einstellungen) => LlmAnbieter;
}

type Zustand =
  | { art: "bereit" }
  | { art: "laeuft"; stand?: ReiheStand }
  | { art: "fertig"; reihe: Reihe; ergebnisse: EinzelErgebnis[]; zip: Uint8Array; name: string }
  | { art: "fehler"; text: string };

/** Einstellungen mit ausdrücklichem Modell je Aufgabe: so, wie sie die Tabelle oben für das aktive Profil anzeigt */
export function vergleichsEinstellungen(e: Einstellungen, profil: Profil | null): Einstellungen {
  const modelle = { ...e.modelle };
  for (const r of VERGLEICH_ROLLEN) modelle[r] = profil ? modellFuer(r, e, profil) : e.modelle[r] || APP_MODELLE[r];
  return { ...e, modelle };
}

export function VergleichslaufAbschnitt({
  profil,
  einstellungen,
  schluessel,
  datenLaden = fallDatenEingebaut,
  anbieterFuer = (s, e) => Verteiler.fuer(s, { mistralEndpunkt: e.mistralEndpunkt }),
}: VergleichslaufProps) {
  const [anzahl, setAnzahl] = useState(ANZAHL_VORGABE);
  /** leer: aktuelle Einstellungen; sonst Kennung einer Variante des Plans standardprofile-ilka */
  const [variante, setVariante] = useState("");
  const [zustand, setZustand] = useState<Zustand>({ art: "bereit" });
  const abbruch = useRef<AbortController | null>(null);
  const laeuft = zustand.art === "laeuft";
  useWachhalten(laeuft);

  const planVariante = PLAN_STANDARDPROFILE.varianten.find((v) => v.kennung === variante);
  const e = planVariante ? einstellungenFuerVariante(einstellungen, planVariante) : vergleichsEinstellungen(einstellungen, profil);
  const zeilen = VERGLEICH_ROLLEN.map((r) => {
    const modell = e.modelle[r] || "";
    return { r, modell, aufwand: e.aufwand[r], anbieter: modell ? anbieterVon(modell) : undefined };
  });
  const fehlend = [...new Set(zeilen.filter((z) => z.r !== "reparatur" && z.anbieter && !schluessel[z.anbieter]).map((z) => z.anbieter!))] as AnbieterId[];
  const ohneModell = zeilen.some((z) => z.r !== "reparatur" && !z.modell);
  const mistral = zeilen.some((z) => z.anbieter === "mistral");

  const s1 = schaetzeStufe("s1", e.modelle.vorverarbeitung, e.aufwand.vorverarbeitung);
  const s2 = schaetzeStufe("verdichtung", e.modelle.verdichtung, e.aufwand.verdichtung);
  const jeLauf = summe([s1.usd, s2.usd]);
  const dauerJeLauf = s1.sekunden && s2.sekunden ? ([s1.sekunden[0] + s2.sekunden[0], s1.sekunden[1] + s2.sekunden[1]] as [number, number]) : null;
  const n = anzahlBegrenzt(anzahl);
  const zusammen = jeLauf ? ([jeLauf[0] * n, jeLauf[1] * n] as [number, number]) : null;

  async function starten() {
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    setZustand({ art: "laeuft" });
    try {
      const daten = await datenLaden();
      const { reihe, ergebnisse } = await vergleichsreihe({
        daten,
        anbieter: anbieterFuer(schluessel, e),
        einstellungen: e,
        anzahl: n,
        signal: ctrl.signal,
        stand: (stand) => setZustand({ art: "laeuft", stand }),
        quelle: "app",
        variante: planVariante ? `${PLAN_STANDARDPROFILE.id}/${planVariante.kennung}` : undefined,
      });
      const zip = await reiheZip(reihe, ergebnisse);
      const name = zipDateiname(reihe);
      setZustand({ art: "fertig", reihe, ergebnisse, zip, name });
      // Auch wenn die Einstellungen inzwischen verlassen wurden, kommt die Datei beim Nutzer an
      if (ergebnisse.length) dateiAnbieten(new Blob([zip as BlobPart], { type: "application/zip" }), name, "application/zip");
    } catch (err) {
      setZustand({ art: "fehler", text: String((err as Error)?.message || err) });
    } finally {
      abbruch.current = null;
    }
  }

  return (
    <section className="vergleichslauf" aria-labelledby="vergleichslauf-titel">
      <h3 id="vergleichslauf-titel">Vergleichslauf Ilka</h3>
      <p>
        Verdichtet die sechs fiktiven Ländermeldungen zum Orkantief „Ilka“ zur Meldung der Koordinierungsstelle des Beispielprofils (Referenzraum
        Bevölkerungsschutz in Deutschland, t0 14.10.2026, 14:00 Uhr) mit der oben gewählten Konfiguration: S1 und S2 Verdichtung, S1-Vorschlag unverändert
        übernommen, ohne Websuche. Jeder Lauf wird mit der Redaktionsfassung verglichen. Ergebnis als ZIP mit Laufprotokollen, Entwürfen, Prüfpunkten und einer
        Übersicht (CSV), um Konfigurationen miteinander zu vergleichen.
      </p>
      <label className="feld">
        <span className="feld-label">Konfiguration</span>
        <select value={variante} disabled={laeuft} onChange={(ev) => setVariante(ev.target.value)}>
          <option value="">Aktuelle Einstellungen (Tabelle oben)</option>
          <optgroup label={`Bewertungsplan ${PLAN_STANDARDPROFILE.id}`}>
            {PLAN_STANDARDPROFILE.varianten.map((v) => (
              <option key={v.kennung} value={v.kennung}>
                {v.kennung}: S1 {v.s1.modell} ({aufwandTitel(v.s1.aufwand)}), S2 {v.s2.modell} ({aufwandTitel(v.s2.aufwand)})
              </option>
            ))}
          </optgroup>
        </select>
        <span className="hinweis">
          Die Varianten des Plans vergleichen die Standard-Profile mit dem Bezug Anthropic (A); die Einstellungen bleiben unverändert. Je Variante{" "}
          {PLAN_STANDARDPROFILE.wiederholungen} Läufe mit derselben App-Version.
        </span>
      </label>
      <ul className="vergleichslauf-konfiguration">
        {zeilen.map((z) => (
          <li key={z.r}>
            {TITEL[z.r]}: {z.modell || "kein Modell"} ({aufwandTitel(z.aufwand)}){z.anbieter ? ` · ${ANBIETER_NAME[z.anbieter]}` : ""}
            {z.r === "reparatur" ? " · nur bei Schemafehlern" : ""}
          </li>
        ))}
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
        {s1.gemessen && s2.gemessen ? "" : " (grob, ohne Messwert für diese Konfiguration)"}; bei {n} Läufen zusammen {kostenText(zusammen)}
        {mistral && e.mistralEndpunkt !== "global" ? " zuzüglich 10 % Aufschlag am EU-Endpunkt" : ""}. Maßgeblich ist die Abrechnung des Anbieters.
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
            ? `Lauf ${zustand.stand.nr} von ${zustand.stand.anzahl} · ${zustand.stand.stufe}${zustand.stand.zeichen ? ` · ${zustand.stand.zeichen.toLocaleString("de-DE")} Zeichen` : ""} · bisher ${formatUsd(zustand.stand.kostenUsd)}`
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
          <p>
            {zustand.ergebnisse.length} von {zustand.reihe.laeufe_geplant} Läufen{zustand.reihe.beendet ? ` (${zustand.reihe.beendet})` : ""}, technisch
            bestanden (T1–T8): {zustand.reihe.technisch_bestanden}, zusammen {formatUsd(zustand.reihe.kosten_usd_summe)}.
          </p>
          {zustand.ergebnisse.length > 0 && (
            <table className="tabelle">
              <thead>
                <tr>
                  <th>Lauf</th>
                  <th>Status</th>
                  <th>Dauer</th>
                  <th>Kosten</th>
                  <th>Sachverhalte</th>
                  <th>T1–T8</th>
                  <th>Plausibilität</th>
                </tr>
              </thead>
              <tbody>
                {zustand.ergebnisse.map((x) => (
                  <tr key={x.lauf.id}>
                    <td>{x.lauf.id}</td>
                    <td>{x.lauf.status}</td>
                    <td>{x.eintrag.dauer_s} s</td>
                    <td>{formatUsd(x.lauf.kostenUsd ?? x.lauf.kostenBekanntUsd)}</td>
                    <td>{x.meldung ? (x.lauf.vergleich?.ergebnis.paare.filter((p) => p.ki).length ?? "–") : "–"}</td>
                    <td>
                      {x.eintrag.pruefpunkte.filter((p) => p.erfuellt).length}/{x.eintrag.pruefpunkte.length}
                    </td>
                    <td>{x.eintrag.kennzahlen.plausibilitaet_befunde}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {zustand.ergebnisse.length > 0 && (
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
