// Schritt „Prüfung und Übergabe“ der KI-Erfassung: Ergebnis von S2/S3, Recherche, Hinweise, Vergleich, Laufprotokoll.
// Seit 0.6.5 (TP-2026-W44-17) in eigener Datei; unverändert aus KiErfassung.tsx übernommen.

import type { ReactNode } from "react";
import { formatUsd } from "../../anbieter/preise";
import type { Meldung, Profil } from "../../kern/typen";
import { laufKostenText, type Lauf } from "../../pipeline/lauf";
import { rechercheNachweis } from "../../pipeline/recherchebefunde";
import { VergleichKasten } from "../Vergleich";
import { Kurzantwort } from "./Kurzantwort";
import { RechercheZeile } from "./recherche";
import { ABRUF_FEHLER } from "./texte";
import { dauer } from "./zustand";
import { OFFLINE_HINWEIS, OfflineHinweis } from "./rahmen";

export function Ergebnis({
  profil,
  aendern,
  lauf,
  fehler,
  uebernehmen,
  exportieren,
  erneut,
  modellwahl,
  offline = false,
}: {
  profil: Profil;
  aendern: (l: Lauf) => void;
  lauf: Lauf;
  fehler: string | null;
  uebernehmen: (m: Meldung) => void;
  exportieren: () => void;
  erneut?: () => void;
  /** Modellwahl für „S2 erneut starten“ */
  modellwahl?: ReactNode;
  /** ohne Netz: „S2 erneut starten“ gesperrt (seit 0.6.5, TP-2026-W44-20) */
  offline?: boolean;
}) {
  const e = lauf.ergebnis;
  const s2 = lauf.stufen.find((s) => s.stufe.startsWith("S2"));
  return (
    <>
      <h2 tabIndex={-1}>Prüfung und Übergabe</h2>
      {e ? (
        <div className={e.schemakonform ? "kasten kasten-ok" : "kasten kasten-hinweis"} role="status">
          <p>
            {e.schemakonform
              ? "Der Entwurf entspricht dem Schema. Nach der Übernahme in die Erfassung dort Inhalte, Radar und Quellen prüfen und freigeben."
              : "Der Entwurf weicht auch nach zwei Reparaturen noch vom Schema ab. Er lässt sich übernehmen; die markierten Stellen sind dann in der Erfassung zu korrigieren."}
          </p>
        </div>
      ) : (
        <div className="kasten kasten-fehler" role="alert">
          <p>{fehler || lauf.fehler || "Kein verwertbares Ergebnis."}</p>
        </div>
      )}
      {s2?.notiz && <p className="fehlertext">{s2.notiz}</p>}
      {e && lauf.auftrag.websuche !== false && (e.recherche || s2) && (
        <RechercheZeile n={e.recherche ?? rechercheNachweis({ nutzung: s2!.nutzung, suchen: e.suchen })} pflicht={e.pflichtsuchen} />
      )}

      {e?.kurzantwort && (
        <div className="ki-abschnitt">
          <h3>Kurzantwort der KI</h3>
          <Kurzantwort text={e.kurzantwort} />
        </div>
      )}

      {e && e.befunde.length > 0 && (
        <div className="ki-abschnitt">
          <h3>Hinweise zur Prüfung</h3>
          <ul className="befunde">
            {e.befunde.map((b, i) => (
              <li key={i} className={`befund befund-${b.stufe}`}>
                <span className="befund-stufe">{b.stufe === "fehler" ? "Fehler" : b.stufe === "warnung" ? "Warnung" : "Hinweis"}</span> {b.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {e?.abrufFehler && e.abrufFehler.length > 0 && (
        <div className="ki-abschnitt">
          <h3>Nicht abrufbare Seiten</h3>
          <ul className="befunde">
            {e.abrufFehler.map((f, i) => (
              <li key={i} className={`befund ${lauf.auftrag.urls.includes(f.url) ? "befund-warnung" : "befund-hinweis"}`}>
                <span className="befund-stufe">{lauf.auftrag.urls.includes(f.url) ? "Angegebene URL" : "Hinweis"}</span> {f.url} (
                {ABRUF_FEHLER[f.code] || f.code})
              </li>
            ))}
          </ul>
          <p className="hinweis">
            Manche Seiten sperren den Abruf durch KI-Dienste. Abhilfe: die Seite im Browser als PDF speichern oder den Text in die Stichworte kopieren und einen
            neuen Auftrag starten.
          </p>
        </div>
      )}

      {e && (e.suchen.length > 0 || e.fundstellen.length > 0) && (
        <details className="ki-abschnitt">
          <summary>
            Recherche: {e.suchen.length} {e.suchen.length === 1 ? "Suche" : "Suchen"}, {e.fundstellen.length}{" "}
            {e.fundstellen.length === 1 ? "Fundstelle" : "Fundstellen"}
          </summary>
          {e.suchen.length > 0 && <p className="hinweis">Suchbegriffe: {e.suchen.map((s) => `„${s}“`).join(", ")}</p>}
          <ul className="fundstellen">
            {e.fundstellen.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {f.titel}
                </a>
                {f.stand ? <span className="material-meta"> · {f.stand}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      {e && (
        <VergleichKasten
          profil={profil}
          meldung={e.meldung}
          laufId={lauf.id}
          gespeichert={lauf.vergleich}
          speichern={(v) => aendern({ ...lauf, vergleich: v })}
        />
      )}

      <details className="ki-abschnitt">
        <summary>Laufprotokoll: {laufKostenText(lauf)} gesamt</summary>
        <table className="tabelle">
          <thead>
            <tr>
              <th>Stufe</th>
              <th>Modell</th>
              <th>Token ein / aus</th>
              <th>Dauer</th>
              <th>Kosten</th>
            </tr>
          </thead>
          <tbody>
            {lauf.stufen.map((s, i) => (
              <tr key={i}>
                <td>
                  {s.stufe}
                  {s.fehler ? ` (${s.fehler})` : ""}
                </td>
                <td>{s.modell}</td>
                <td>
                  {s.nutzung
                    ? `${(s.nutzung.eingabe + s.nutzung.cacheLesen + s.nutzung.cacheSchreiben).toLocaleString("de-DE")} / ${s.nutzung.ausgabe.toLocaleString("de-DE")}`
                    : "–"}
                </td>
                <td>{s.dauerMs ? dauer(s.dauerMs) : "–"}</td>
                <td>{formatUsd(s.kostenUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hinweis">Lauf {lauf.id}. Kosten sind eine Schätzung nach Listenpreisen; maßgeblich ist die Abrechnung des Anbieters.</p>
      </details>

      {!e && erneut && modellwahl}
      {!e && erneut && <OfflineHinweis offline={offline} />}
      <div className="schritt-nav">
        <div className="aktionen">
          <button type="button" className="knopf leise" onClick={exportieren}>
            Laufprotokoll exportieren
          </button>
          {!e && erneut && (
            <button type="button" className="knopf" onClick={erneut} disabled={offline} aria-describedby={offline ? OFFLINE_HINWEIS : undefined}>
              S2 erneut starten
            </button>
          )}
        </div>
        {e && (
          <button type="button" className="knopf primaer" onClick={() => uebernehmen(e.meldung)}>
            In die Erfassung übernehmen
          </button>
        )}
      </div>
    </>
  );
}
