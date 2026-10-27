// Management Summary im eigenen Schritt der Meldung (seit 0.5.17, vorher im Schritt „Prüfen & Exportieren“): KI-Fassung für die Leitung
// (gespeichert je Profil, mit Hinweis, wenn die Meldung sich seither geändert hat) und
// der bisherige Feldauszug ohne Quellenverweise als Rückfallebene ohne KI.
// Die Fassung wird nur auf Knopfdruck erstellt. Sie wird geleert, wenn die Meldung in der Maske durch eine
// andere ersetzt wird (neue Meldung, Meldung öffnen, Übernahme eines KI-Entwurfs) und bei der Übergabe von
// Meldungen an die KI-Verdichtung, sowie von Hand über „Leeren“.

import { useEffect, useMemo, useRef, useState } from "react";
import { anbieterVon, ANBIETER_NAME, hatSchluessel, Verteiler, type Schluessel } from "../anbieter/verteiler";
import { formatUsd } from "../anbieter/preise";
import { istVerbindungsabbruch, TEXT_VERBINDUNGSABBRUCH } from "../anbieter/typen";
import { useWachhalten } from "./wachhalten";
import { dateiname, managementSummary } from "../kern/ausgabe";
import type { Meldung, Profil } from "../kern/typen";
import { dateiAnbieten, kurzfassungLesen, kurzfassungLoeschen, kurzfassungSchreiben, type GespeicherteKurzfassung as Gespeichert } from "../speicher/speicher";
import { mitModellwahl, modellFuer, type Einstellungen, type ModellWahl as Modellwahl } from "../pipeline/einstellungen";
import { ModellWahl } from "./ModellWahl";
import { useKiZugang } from "./kiZugang";
import { kurzfassungErstellen, kurzfassungsFingerabdruck } from "../pipeline/kurzfassung";
import { kurzfassungAlsDatei } from "../dokumente/kennzeichnung";

export interface KiZugang {
  schluessel: Schluessel;
  einstellungen: Einstellungen;
}

const EREIGNIS_GELEERT = "ki-lead:kurzfassung-geleert";

/** Gespeicherte Management Summary eines Profils leeren und eine geöffnete Anzeige benachrichtigen. */
export async function kurzfassungLeeren(profilId: string): Promise<void> {
  await kurzfassungLoeschen(profilId).catch(() => undefined);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EREIGNIS_GELEERT, { detail: profilId }));
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

/**
 * eigenerSchritt: als Inhalt des Schritts „Management Summary“; die Überschrift kommt dann vom Schritt (h2), der Kasten
 * hat keine eigene.
 */
export function KurzfassungKasten({
  profil,
  meldung,
  ki: kiVorgabe,
  eigenerSchritt = false,
}: {
  profil: Profil;
  meldung: Meldung;
  /** Schlüssel und Einstellungen; ohne Angabe aus dem KI-Zugang der App (seit 0.6.5, TP-2026-W44-17) */
  ki?: KiZugang;
  eigenerSchritt?: boolean;
}) {
  const kiZugang = useKiZugang();
  const ki = useMemo<KiZugang | undefined>(
    () => kiVorgabe ?? (kiZugang ? { schluessel: kiZugang.schluessel, einstellungen: kiZugang.einstellungen } : undefined),
    [kiVorgabe, kiZugang],
  );
  const titel = profil.ui.kurzfassung?.titel || "Management Summary";
  const fp = useMemo(() => kurzfassungsFingerabdruck(meldung, profil), [meldung, profil]);
  const [gespeichert, setGespeichert] = useState<Gespeichert | null>(null);
  /** Modell nur für diese Erstellung, abweichend von „Einstellungen“ */
  const [kfWahl, setKfWahl] = useState<Modellwahl>({});
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const abbruch = useRef<AbortController | null>(null);
  // Laufende Anfrage beim Verlassen (z. B. Profilwechsel) kontrolliert abbrechen
  useEffect(() => () => abbruch.current?.abort(), []);
  useWachhalten(laeuft);
  const auszug = useMemo(() => managementSummary(meldung, profil), [meldung, profil]);

  useEffect(() => {
    let gueltig = true;
    kurzfassungLesen(profil.manifest.id)
      .then((g) => gueltig && setGespeichert(g || null))
      .catch((e) => gueltig && setFehler(`Die gespeicherte Fassung konnte nicht gelesen werden (${(e as Error)?.message || "Speicherfehler"}).`));
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
  }, [profil.manifest.id]);

  const leeren = async () => {
    if (
      !confirm(`${titel} leeren? Die Fassung wird auf diesem Gerät gelöscht. Wenn du sie noch brauchst, vorher kopieren oder als TXT bzw. Protokoll sichern.`)
    )
      return;
    await kurzfassungLeeren(profil.manifest.id);
  };

  const kiEinstellungen = ki ? mitModellwahl(ki.einstellungen, kfWahl) : undefined;
  const kfModell = kiEinstellungen ? modellFuer("kurzfassung", kiEinstellungen, profil) : "";
  const schluesselDa = !!ki && hatSchluessel(anbieterVon(kfModell), ki.schluessel);

  const erstellen = async () => {
    if (!schluesselDa) return;
    setFehler(null);
    setLaeuft(true);
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    try {
      const k = await kurzfassungErstellen(profil, meldung, Verteiler.fuer(ki.schluessel, kiEinstellungen!.anbieterOptionen), kiEinstellungen!, ctrl.signal);
      const g = { fingerabdruck: fp, kurzfassung: k };
      setGespeichert(g);
      await kurzfassungSchreiben(profil.manifest.id, g).catch(() =>
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
    <section
      className={eigenerSchritt ? "kurzfassung kurzfassung-schritt" : "kurzfassung"}
      aria-labelledby={eigenerSchritt ? "schritt-titel" : "kurzfassung-titel"}
    >
      {!eigenerSchritt && <h3 id="kurzfassung-titel">{titel}</h3>}
      <p className={eigenerSchritt ? "einleitung" : "hinweis"}>
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
              onClick={() => dateiAnbieten(kurzfassungAlsDatei(kf.text, kf.eintrag.modell), basisName + "_Management-Summary.txt", "text/plain;charset=utf-8")}
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

      {ki && !laeuft && (
        <ModellWahl
          stufen={[{ rolle: "kurzfassung", kurz: titel, titel }]}
          einstellungen={ki.einstellungen}
          profil={profil}
          schluessel={ki.schluessel}
          wahl={kfWahl}
          onChange={setKfWahl}
        />
      )}
      <div className="aktionen">
        {schluesselDa ? (
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
        {schluesselDa && !laeuft && <span className="material-meta">Modell: {kfModell}</span>}
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
