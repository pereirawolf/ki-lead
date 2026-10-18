// Vergleich eines KI-Entwurfs mit einer Referenzfassung (z. B. Redaktionsfassung) nach demselben Profil.

import { useRef, useState } from "react";
import type { Meldung, Profil } from "../kern/typen";
import { migriere } from "../kern/migration";
import { vergleiche, vergleichTabelle, type GespeicherterVergleich } from "../pipeline/vergleich";
import { alsCsv } from "../lagebild/ausgabe";
import { dateiAnbieten } from "../speicher/speicher";

const anteil = (x: number, n: number) => (n ? `${x} von ${n}` : "–");

function Abweichung({ d }: { d: number | null }) {
  if (d === null) return <span className="vg-offen">–</span>;
  const k = d === 0 ? "vg-gleich" : Math.abs(d) === 1 ? "vg-nah" : "vg-weit";
  return <span className={`vg-diff ${k}`}>{d > 0 ? `+${d}` : d}</span>;
}

export function VergleichKasten({
  profil,
  meldung,
  gespeichert,
  speichern,
  laufId,
}: {
  profil: Profil;
  meldung: Meldung;
  gespeichert?: GespeicherterVergleich;
  speichern: (v: GespeicherterVergleich) => void;
  laufId: string;
}) {
  const [fehler, setFehler] = useState<string | null>(null);
  const eingabe = useRef<HTMLInputElement>(null);
  const v = gespeichert?.ergebnis;

  const laden = async (f: File | undefined) => {
    if (!f) return;
    setFehler(null);
    try {
      const roh = JSON.parse(await f.text());
      const mig = migriere(roh, profil);
      if (!mig.bekannt) {
        setFehler(`${f.name}: ${mig.hinweise.join(" ")}`);
        return;
      }
      speichern({ referenz: f.name, erstellt: new Date().toISOString(), ergebnis: vergleiche(meldung, mig.daten, profil) });
    } catch (e) {
      setFehler(`${f.name}: ${(e as Error).message}`);
    }
  };

  return (
    <details className="ki-abschnitt" open={!!v}>
      <summary>Vergleich mit einer Referenzfassung{v ? `: ${gespeichert!.referenz}` : ""}</summary>
      <p className="hinweis">
        Vergleicht den Entwurf mit einer vorhandenen Fassung desselben Profils, etwa der Redaktionsfassung: Zuordnung der Sachverhalte, Beurteilung, Tendenz,
        Ereignisarten und jede Radarachse einzeln. Es gibt bewusst keinen Gesamtwert über alle Achsen. Der Vergleich wird im Laufprotokoll gespeichert.
      </p>
      <div className="aktionen">
        <button type="button" className="knopf" onClick={() => eingabe.current?.click()}>
          {v ? "Andere Referenz wählen" : "Referenzfassung wählen (JSON)"}
        </button>
        {v && (
          <>
            <button
              type="button"
              className="knopf leise"
              onClick={() => dateiAnbieten(alsCsv(vergleichTabelle(v)), `KI-LEAD_Vergleich_${laufId}.csv`, "text/csv;charset=utf-8")}
            >
              CSV
            </button>
            <button
              type="button"
              className="knopf leise"
              onClick={() => dateiAnbieten(JSON.stringify(gespeichert, null, 2), `KI-LEAD_Vergleich_${laufId}.json`, "application/json")}
            >
              JSON
            </button>
          </>
        )}
      </div>
      <input ref={eingabe} type="file" accept=".json,application/json" hidden onChange={(e) => (laden(e.target.files?.[0]), (e.target.value = ""))} />
      {fehler && (
        <div className="kasten kasten-fehler" role="alert">
          <p>{fehler}</p>
        </div>
      )}
      {v && (
        <>
          <ul className="vg-kennzahlen">
            <li>
              Zugeordnete Sachverhalte: <strong>{v.paare.filter((p) => p.ki && p.ref).length}</strong>
              {v.paare.some((p) => !p.ki || !p.ref) && <> (ohne Gegenstück: {v.paare.filter((p) => !p.ki || !p.ref).length})</>}
            </li>
            <li>
              Beurteilung gleich: <strong>{anteil(v.beurteilung.gleich, v.beurteilung.n)}</strong>
            </li>
            <li>
              Tendenz gleich: <strong>{anteil(v.tendenz.gleich, v.tendenz.n)}</strong>
            </li>
            <li>
              Ereignisarten gleich: <strong>{anteil(v.arten.gleich, v.arten.n)}</strong>
            </li>
          </ul>

          {v.achsen.length > 0 && (
            <div className="lb-rahmen">
              <table className="tabelle lb-klein">
                <thead>
                  <tr>
                    <th>Radarachse</th>
                    <th>beide kodiert</th>
                    <th>gleich</th>
                    <th>höchstens ±1</th>
                    <th>mittlere Abweichung</th>
                    <th>nur einseitig offen</th>
                  </tr>
                </thead>
                <tbody>
                  {v.achsen.map((a) => (
                    <tr key={a.key}>
                      <td>{a.label}</td>
                      <td>{a.n}</td>
                      <td>{a.gleich}</td>
                      <td>{a.nah}</td>
                      <td>{a.mittel === null ? "–" : a.mittel.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</td>
                      <td>{a.offenEinseitig}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {v.paare.map((p, i) => (
            <div key={i} className="vg-paar">
              <p className="vg-titel">
                <span>
                  <span className="material-meta">Entwurf:</span> {p.ki ? p.ki.bezeichnung || `Sachverhalt ${p.ki.index + 1}` : "kein Gegenstück"}
                </span>
                <span>
                  <span className="material-meta">Referenz:</span> {p.ref ? p.ref.bezeichnung || `Sachverhalt ${p.ref.index + 1}` : "kein Gegenstück"}
                </span>
              </p>
              {p.ki && p.ref && (
                <>
                  <p className="material-meta">
                    Ähnlichkeit der Bezeichnungen {p.aehnlichkeit.toLocaleString("de-DE", { maximumFractionDigits: 2 })} · Beurteilung {p.ki.beurteilung || "–"}{" "}
                    / {p.ref.beurteilung || "–"} · Tendenz {p.ki.tendenz || "–"} / {p.ref.tendenz || "–"}
                  </p>
                  {p.achsen.length > 0 && (
                    <div className="lb-rahmen">
                      <table className="tabelle lb-klein vg-achsen">
                        <thead>
                          <tr>
                            <th></th>
                            {p.achsen.map((a) => (
                              <th key={a.key} title={a.label}>
                                {a.label.match(/^(D\d+)\b/)?.[1] ?? a.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <th>Entwurf</th>
                            {p.achsen.map((a) => (
                              <td key={a.key}>{a.ki ?? "offen"}</td>
                            ))}
                          </tr>
                          <tr>
                            <th>Referenz</th>
                            {p.achsen.map((a) => (
                              <td key={a.key}>{a.ref ?? "offen"}</td>
                            ))}
                          </tr>
                          <tr>
                            <th>Abweichung</th>
                            {p.achsen.map((a) => (
                              <td key={a.key}>
                                <Abweichung d={a.diff} />
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </>
      )}
    </details>
  );
}
