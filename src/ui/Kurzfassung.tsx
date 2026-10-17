// Management Summary im Schritt „Prüfen & Exportieren“: KI-Fassung für die Leitung
// (gespeichert je Profil, mit Hinweis, wenn die Meldung sich seither geändert hat) und
// der bisherige Feldauszug ohne Quellenverweise als Rückfallebene ohne KI.

import { useEffect, useMemo, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { AnthropicAnbieter } from "../anbieter/anthropic";
import { formatUsd } from "../anbieter/preise";
import { istVerbindungsabbruch, TEXT_VERBINDUNGSABBRUCH } from "../anbieter/typen";
import { useWachhalten } from "./wachhalten";
import { dateiname, managementSummary } from "../kern/ausgabe";
import type { Meldung, Profil } from "../kern/typen";
import { dateiAnbieten } from "../speicher/speicher";
import { modellFuer, type Einstellungen } from "../pipeline/einstellungen";
import { fingerabdruck, kurzfassungErstellen, meldungFuerKurzfassung, type Kurzfassung } from "../pipeline/kurzfassung";

export interface KiZugang {
  schluessel: string;
  einstellungen: Einstellungen;
}

interface Gespeichert {
  fingerabdruck: string;
  kurzfassung: Kurzfassung;
}

function Kopieren({ text }: { text: string }) {
  const [kopiert, setKopiert] = useState(false);
  return (
    <button
      type="button"
      className="knopf"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setKopiert(true);
          setTimeout(() => setKopiert(false), 2000);
        } catch {
          setKopiert(false);
        }
      }}
    >
      {kopiert ? "Kopiert" : "Text kopieren"}
    </button>
  );
}

export function KurzfassungKasten({ profil, meldung, ki }: { profil: Profil; meldung: Meldung; ki?: KiZugang }) {
  const titel = profil.ui.kurzfassung?.titel || "Management Summary";
  const schluesselIdb = `kurzfassung:${profil.manifest.id}`;
  const fp = useMemo(() => fingerabdruck(meldungFuerKurzfassung(meldung, profil)), [meldung, profil]);
  const [gespeichert, setGespeichert] = useState<Gespeichert | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const abbruch = useRef<AbortController | null>(null);
  useWachhalten(laeuft);
  const auszug = useMemo(() => managementSummary(meldung, profil), [meldung, profil]);

  useEffect(() => {
    get(schluesselIdb).then((g) => setGespeichert((g as Gespeichert) || null));
  }, [schluesselIdb]);

  const erstellen = async () => {
    if (!ki?.schluessel) return;
    setFehler(null);
    setLaeuft(true);
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    try {
      const k = await kurzfassungErstellen(profil, meldung, new AnthropicAnbieter(ki.schluessel), ki.einstellungen, ctrl.signal);
      const g = { fingerabdruck: fp, kurzfassung: k };
      setGespeichert(g);
      await set(schluesselIdb, g);
    } catch (e: any) {
      setFehler(e?.name === "AbortError" ? "Abgebrochen." : istVerbindungsabbruch(e) ? TEXT_VERBINDUNGSABBRUCH : String(e?.message || e));
    } finally {
      setLaeuft(false);
    }
  };

  const kf = gespeichert?.kurzfassung;
  const veraltet = !!gespeichert && gespeichert.fingerabdruck !== fp;
  const basisName = dateiname(meldung, profil, false);

  return (
    <section className="kurzfassung" aria-labelledby="kurzfassung-titel">
      <h3 id="kurzfassung-titel">{titel}</h3>
      <p className="hinweis">
        Absätze je Sachverhalt zu den Analysefeldern, in kurzen Sätzen für die Leitung und ohne Quellenverweise. Die KI formuliert nur aus der Meldung; sie
        recherchiert nicht und bewertet nicht neu.
      </p>

      {kf ? (
        <>
          {veraltet && (
            <div className="kasten kasten-hinweis" role="status">
              <p>Die Meldung wurde seit dieser Fassung geändert. Bitte neu erstellen, bevor du sie weitergibst.</p>
            </div>
          )}
          {kf.hinweise.length > 0 && (
            <ul className="befunde">
              {kf.hinweise.map((h, i) => (
                <li key={i} className="befund befund-hinweis">
                  <span className="befund-stufe">Hinweis</span> {h}
                </li>
              ))}
            </ul>
          )}
          <pre className="kurzfassung-text">{kf.text}</pre>
          <p className="material-meta">
            Erstellt {new Date(kf.erstellt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} mit {kf.eintrag.modell},{" "}
            {formatUsd(kf.eintrag.kostenUsd)}.
          </p>
          <div className="aktionen">
            <Kopieren text={kf.text} />
            <button
              type="button"
              className="knopf leise"
              onClick={() => dateiAnbieten(kf.text, basisName + "_Management-Summary.txt", "text/plain;charset=utf-8")}
            >
              Als TXT speichern
            </button>
            <button
              type="button"
              className="knopf leise"
              onClick={() =>
                dateiAnbieten(
                  JSON.stringify(
                    { format: "ki-lead-kurzfassung/1", profil: { id: profil.manifest.id, version: profil.manifest.version, hash: profil.hash }, ...kf },
                    null,
                    2,
                  ),
                  basisName + "_Management-Summary_Protokoll.json",
                  "application/json",
                )
              }
            >
              Protokoll
            </button>
          </div>
        </>
      ) : null}

      {fehler && (
        <div className="kasten kasten-fehler" role="alert">
          <p>{fehler}</p>
        </div>
      )}

      <div className="aktionen">
        {ki?.schluessel ? (
          laeuft ? (
            <>
              <span className="laufanzeige">
                <span className="puls" aria-hidden="true" /> Wird formuliert …
              </span>
              <button type="button" className="knopf leise" onClick={() => abbruch.current?.abort()}>
                Abbrechen
              </button>
            </>
          ) : (
            <button type="button" className={kf && !veraltet ? "knopf" : "knopf primaer"} onClick={erstellen}>
              {kf ? "Neu formulieren" : "Mit KI formulieren"}
            </button>
          )
        ) : (
          <span className="hinweis">Für die KI-Fassung unter „Einstellungen“ einen API-Schlüssel hinterlegen.</span>
        )}
        {ki?.schluessel && !laeuft && <span className="material-meta">Modell: {modellFuer("kurzfassung", ki.einstellungen, profil)}</span>}
      </div>

      <details className="summary">
        <summary>Feldauszug ohne KI (Klartext ohne Quellenverweise)</summary>
        <pre>{auszug}</pre>
        <div className="aktionen">
          <Kopieren text={auszug} />
          <button type="button" className="knopf leise" onClick={() => dateiAnbieten(auszug, basisName + "_Feldauszug.txt", "text/plain;charset=utf-8")}>
            Als TXT speichern
          </button>
        </div>
      </details>
    </section>
  );
}
