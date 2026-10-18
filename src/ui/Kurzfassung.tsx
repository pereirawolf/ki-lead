// Management Summary im Schritt „Prüfen & Exportieren“: KI-Fassung für die Leitung
// (gespeichert je Profil, mit Hinweis, wenn die Meldung sich seither geändert hat) und
// der bisherige Feldauszug ohne Quellenverweise als Rückfallebene ohne KI.
// Die Fassung wird nur auf Knopfdruck erstellt. Sie wird geleert, wenn die Meldung in der Maske durch eine
// andere ersetzt wird (neue Meldung, Meldung öffnen, Übernahme eines KI-Entwurfs) und bei der Übergabe von
// Meldungen an die KI-Verdichtung, sowie von Hand über „Leeren“.

import { useEffect, useMemo, useRef, useState } from "react";
import { del, get, set } from "idb-keyval";
import { anbieterVon, ANBIETER_NAME, Verteiler, type Schluessel } from "../anbieter/verteiler";
import { formatUsd } from "../anbieter/preise";
import { istVerbindungsabbruch, TEXT_VERBINDUNGSABBRUCH } from "../anbieter/typen";
import { useWachhalten } from "./wachhalten";
import { dateiname, managementSummary } from "../kern/ausgabe";
import type { Meldung, Profil } from "../kern/typen";
import { dateiAnbieten } from "../speicher/speicher";
import { modellFuer, type Einstellungen } from "../pipeline/einstellungen";
import { fingerabdruck, kurzfassungErstellen, meldungFuerKurzfassung, type Kurzfassung } from "../pipeline/kurzfassung";

export interface KiZugang {
  schluessel: Schluessel;
  einstellungen: Einstellungen;
}

const EREIGNIS_GELEERT = "ki-lead:kurzfassung-geleert";
const idbSchluessel = (profilId: string) => `kurzfassung:${profilId}`;

/** Gespeicherte Management Summary eines Profils leeren und eine geöffnete Anzeige benachrichtigen. */
export async function kurzfassungLeeren(profilId: string): Promise<void> {
  await del(idbSchluessel(profilId)).catch(() => undefined);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EREIGNIS_GELEERT, { detail: profilId }));
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
  const schluesselIdb = idbSchluessel(profil.manifest.id);
  const fp = useMemo(() => fingerabdruck(meldungFuerKurzfassung(meldung, profil)), [meldung, profil]);
  const [gespeichert, setGespeichert] = useState<Gespeichert | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const abbruch = useRef<AbortController | null>(null);
  // Laufende Anfrage beim Verlassen (z. B. Profilwechsel) kontrolliert abbrechen
  useEffect(() => () => abbruch.current?.abort(), []);
  useWachhalten(laeuft);
  const auszug = useMemo(() => managementSummary(meldung, profil), [meldung, profil]);

  useEffect(() => {
    let gueltig = true;
    get(schluesselIdb).then((g) => gueltig && setGespeichert((g as Gespeichert) || null));
    const geleert = (e: Event) => {
      if ((e as CustomEvent).detail !== profil.manifest.id) return;
      abbruch.current?.abort();
      setGespeichert(null);
      setFehler(null);
    };
    window.addEventListener(EREIGNIS_GELEERT, geleert);
    return () => {
      gueltig = false;
      window.removeEventListener(EREIGNIS_GELEERT, geleert);
    };
  }, [schluesselIdb, profil.manifest.id]);

  const leeren = async () => {
    if (
      !confirm(`${titel} leeren? Die Fassung wird auf diesem Gerät gelöscht. Wenn du sie noch brauchst, vorher kopieren oder als TXT bzw. Protokoll sichern.`)
    )
      return;
    await kurzfassungLeeren(profil.manifest.id);
  };

  const kfModell = ki ? modellFuer("kurzfassung", ki.einstellungen, profil) : "";
  const hatSchluessel = !!ki && !!ki.schluessel[anbieterVon(kfModell)];

  const erstellen = async () => {
    if (!hatSchluessel) return;
    setFehler(null);
    setLaeuft(true);
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    try {
      const k = await kurzfassungErstellen(profil, meldung, new Verteiler(ki!.schluessel), ki.einstellungen, ctrl.signal);
      const g = { fingerabdruck: fp, kurzfassung: k };
      setGespeichert(g);
      await set(schluesselIdb, g).catch(() =>
        setFehler("Die Fassung wurde erstellt, konnte aber nicht im Gerät gespeichert werden. Bitte kopieren oder als TXT sichern."),
      );
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
        Eine konsolidierte Fassung für die Behördenleitung, lesbar in einer Minute: Kernaussage, Beurteilung je Sachverhalt, je Analysefeld höchstens zwei Sätze
        und die früheste Frist. Die KI formuliert nur aus der Meldung; Einzelheiten bleiben in der ausführlichen Meldung.
      </p>

      {kf ? (
        <>
          {veraltet && (
            <div className="kasten kasten-hinweis" role="status">
              <p>Die Meldung wurde seit dieser Fassung geändert. Bitte „{titel} erstellen“ wählen, bevor du sie weitergibst.</p>
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
            {!laeuft && (
              <button type="button" className="knopf leise" onClick={leeren}>
                Leeren
              </button>
            )}
          </div>
        </>
      ) : null}

      {fehler && (
        <div className="kasten kasten-fehler" role="alert">
          <p>{fehler}</p>
        </div>
      )}

      <div className="aktionen">
        {hatSchluessel ? (
          laeuft ? (
            <>
              <span className="laufanzeige">
                <span className="puls" aria-hidden="true" /> {titel} wird erstellt …
              </span>
              <button type="button" className="knopf leise" onClick={() => abbruch.current?.abort()}>
                Abbrechen
              </button>
            </>
          ) : (
            <button type="button" className={kf && !veraltet ? "knopf" : "knopf primaer"} onClick={erstellen}>
              {titel} erstellen
            </button>
          )
        ) : (
          <span className="hinweis">Für die KI-Fassung unter „Einstellungen“ einen API-Schlüssel für {ANBIETER_NAME[anbieterVon(kfModell)]} hinterlegen.</span>
        )}
        {hatSchluessel && !laeuft && <span className="material-meta">Modell: {kfModell}</span>}
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
