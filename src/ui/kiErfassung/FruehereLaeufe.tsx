// „Frühere Läufe mit diesem Profil“ (seit 0.6.5, TP-2026-W44-17 in eigener Datei): Liste der gespeicherten Läufe des
// Profils, Übernahme eines Ergebnisses, Protokoll, Löschen; „Alle als ZIP speichern“ und „Alle löschen“ (PR #79).

import { useEffect, useState } from "react";
import type { Meldung, Profil } from "../../kern/typen";
import { exportStempel, mitDatum } from "../../kern/ausgabe";
import { laufKostenText, type Lauf } from "../../pipeline/lauf";
import { laeufeAlsZip, laeufeLaden, laeufeLoeschen, laufLoeschen } from "../../speicher/laufSpeicher";
import { dateiAnbieten } from "../../speicher/speicher";
import { STATUS_TEXT } from "./texte";
import { speicherText } from "./zustand";

export function FruehereLaeufe({
  profil,
  aktualisierung,
  laeuft,
  uebernehmen,
  protokollExport,
  protokollName,
  fehlerMelden,
}: {
  profil: Profil;
  /** Zählt hoch, wenn die Erfassung einen Lauf gespeichert hat; die Liste lädt dann neu */
  aktualisierung: number;
  /** Ein KI-Lauf ist aktiv („Alle löschen“ gesperrt) */
  laeuft: boolean;
  uebernehmen: (m: Meldung) => void;
  protokollExport: (l: Lauf) => void;
  protokollName: (l: Lauf) => string;
  fehlerMelden: (text: string) => void;
}) {
  const [laeufe, setLaeufe] = useState<Lauf[]>([]);
  const [sammelAktion, setSammelAktion] = useState(false);
  const [neuGeladen, setNeuGeladen] = useState(0);

  useEffect(() => {
    let gueltig = true;
    laeufeLaden()
      .then((alle) => gueltig && setLaeufe(alle.filter((l) => l.profil.id === profil.manifest.id)))
      .catch(
        (e) => gueltig && fehlerMelden(`Frühere Läufe konnten nicht aus dem Gerätespeicher gelesen werden (${(e as Error)?.message || "Speicherfehler"}).`),
      );
    return () => {
      gueltig = false;
    };
  }, [profil, aktualisierung, neuGeladen, fehlerMelden]);
  const neuLaden = () => setNeuGeladen((n) => n + 1);

  /** Alle gelisteten Läufe dieses Profils als eine ZIP-Datei (je Lauf ein Protokoll wie beim Einzelexport) */
  const alleAlsZip = async () => {
    if (!laeufe.length) return;
    setSammelAktion(true);
    try {
      const zip = await laeufeAlsZip(laeufe, protokollName);
      const zone = profil.manifest.variablen?.zeitzone;
      dateiAnbieten(zip, mitDatum(exportStempel(zone), `KI-LEAD_Laeufe_${profil.manifest.id}`, "zip"), "application/zip");
    } catch (e) {
      fehlerMelden(speicherText("Die Läufe konnten nicht als ZIP-Datei zusammengestellt werden", e));
    } finally {
      setSammelAktion(false);
    }
  };

  /** Alle gelisteten Läufe dieses Profils samt Protokoll aus dem Gerätespeicher löschen (nach Rückfrage) */
  const alleLoeschen = async () => {
    const n = laeufe.length;
    if (!n) return;
    const frage = `${n === 1 ? "Den einen früheren Lauf" : `Alle ${n} früheren Läufe`} mit diesem Profil samt Protokoll löschen? Das lässt sich nicht rückgängig machen. Zum Aufbewahren vorher „Alle als ZIP speichern“ wählen.`;
    if (!confirm(frage)) return;
    setSammelAktion(true);
    try {
      await laeufeLoeschen(laeufe.map((l) => l.id));
    } catch (e) {
      fehlerMelden(speicherText("Die Läufe konnten nicht vollständig gelöscht werden", e));
    } finally {
      setSammelAktion(false);
      neuLaden();
    }
  };

  if (!laeufe.length) return null;
  return (
    <details className="frueher">
      <summary>Frühere Läufe mit diesem Profil ({laeufe.length})</summary>
      <div className="aktionen frueher-sammel">
        <button type="button" className="knopf leise klein" disabled={sammelAktion} onClick={alleAlsZip}>
          Alle als ZIP speichern
        </button>
        <button
          type="button"
          className="knopf leise klein"
          disabled={sammelAktion || laeuft}
          aria-describedby={laeuft ? "frueher-sammel-laeuft" : undefined}
          onClick={alleLoeschen}
        >
          Alle löschen
        </button>
      </div>
      {laeuft && (
        <p id="frueher-sammel-laeuft" className="hinweis">
          „Alle löschen“ ist erst möglich, wenn der laufende KI-Lauf beendet ist.
        </p>
      )}
      <table className="tabelle">
        <thead>
          <tr>
            <th>Beginn</th>
            <th>Gegenstand</th>
            <th>Status</th>
            <th>Kosten</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {laeufe.map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.erstellt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</td>
              <td>{l.bestaetigt?.gegenstand || l.vorschlag?.gegenstand || l.auftrag.sachverhalt || "–"}</td>
              <td>{STATUS_TEXT[l.status]}</td>
              <td>{laufKostenText(l)}</td>
              <td className="tabelle-aktionen">
                {l.ergebnis && (
                  <button type="button" className="knopf klein" onClick={() => uebernehmen(l.ergebnis!.meldung)}>
                    Übernehmen
                  </button>
                )}
                <button type="button" className="knopf leise klein" onClick={() => protokollExport(l)}>
                  Protokoll
                </button>
                <button
                  type="button"
                  className="knopf leise klein"
                  onClick={async () => {
                    if (confirm("Diesen Lauf mit Protokoll löschen?")) {
                      await laufLoeschen(l.id).catch((e) => fehlerMelden(speicherText("Der Lauf konnte nicht gelöscht werden", e)));
                      neuLaden();
                    }
                  }}
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
