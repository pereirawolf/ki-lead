// Vergleich eines KI-Entwurfs mit einer Referenzfassung (z. B. Redaktionsfassung) nach demselben Profil.

import { useRef, useState } from "react";
import type { Meldung, Profil } from "../kern/typen";
import { migriere } from "../kern/migration";
import { VERGLEICH_VERFAHREN, vergleiche, vergleichTabelle, zuordnungAus, type GespeicherterVergleich, type Zuordnung } from "../pipeline/vergleich";
import { sachverhalte } from "../kern/quellen";
import { holeWert } from "../kern/pfad";
import { sha256 } from "../profil/laden";
import { dateistempel, exportStempel, mitDatum } from "../kern/ausgabe";
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
  const refDaten = gespeichert?.referenzDaten;
  const r = profil.ui.rollen;
  /** Datum der Vergleichsfassung vorn, Lauf-ID unverändert im Namen */
  const vergleichsName = (endung: string) => {
    const zone = profil.manifest.variablen?.zeitzone;
    return mitDatum(dateistempel(gespeichert?.erstellt, zone) ?? exportStempel(zone), `KI-LEAD_Vergleich_${laufId}`, endung);
  };
  const refTitel = refDaten
    ? sachverhalte(refDaten, profil.ui).map(
        (sv, j) => `${j + 1}: ${String((r.sv_bezeichnung && holeWert(sv, r.sv_bezeichnung)) || "ohne Bezeichnung").slice(0, 70)}`,
      )
    : [];

  /** Zuordnung eines Entwurf-Sachverhalts von Hand ändern (j = null: keine Zuordnung). */
  const umordnen = (ki: number, j: number | null) => {
    if (!gespeichert || !refDaten) return;
    const alt = gespeichert.zuordnung || zuordnungAus(gespeichert.ergebnis);
    const neu: Zuordnung[] = alt.filter((z) => z.ki !== ki && z.ref !== j);
    if (j !== null) neu.push({ ki, ref: j });
    const ergebnis = vergleiche(meldung, refDaten, profil, neu);
    speichern({ ...gespeichert, manuell: true, zuordnung: neu, ergebnis, erstellt: new Date().toISOString() });
  };

  const laden = async (f: File | undefined) => {
    if (!f) return;
    setFehler(null);
    try {
      const text = await f.text();
      const roh = JSON.parse(text);
      if (!roh || typeof roh !== "object" || Array.isArray(roh)) throw new Error("keine Meldung (erwartet ein JSON-Objekt)");
      const mig = migriere(roh, profil);
      if (!mig.bekannt) {
        setFehler(`${f.name}: ${mig.hinweise.join(" ")}`);
        return;
      }
      const ergebnis = vergleiche(meldung, mig.daten, profil);
      speichern({
        referenz: f.name,
        referenzHash: await sha256(text),
        referenzDaten: mig.daten,
        verfahren: VERGLEICH_VERFAHREN,
        manuell: false,
        zuordnung: zuordnungAus(ergebnis),
        erstellt: new Date().toISOString(),
        ergebnis,
      });
    } catch (e) {
      setFehler(`${f.name}: ${(e as Error).message}`);
    }
  };

  return (
    <details className="ki-abschnitt" open={!!v}>
      <summary>Vergleich mit einer Referenzfassung{v ? `: ${gespeichert.referenz}` : ""}</summary>
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
              onClick={() => dateiAnbieten(alsCsv(vergleichTabelle(v)), vergleichsName("csv"), "text/csv;charset=utf-8")}
            >
              CSV
            </button>
            <button
              type="button"
              className="knopf leise"
              onClick={() => dateiAnbieten(JSON.stringify(gespeichert, null, 2), vergleichsName("json"), "application/json")}
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
              {gespeichert?.manuell && <> · Zuordnung von Hand geändert</>}
            </li>
            {(["beurteilung", "tendenz", "arten"] as const).map((k) => (
              <li key={k}>
                {k === "beurteilung" ? "Beurteilung" : k === "tendenz" ? "Tendenz" : "Ereignisarten"} gleich:{" "}
                <strong>{anteil(v[k]?.gleich ?? 0, v[k]?.n ?? 0)}</strong>
                {v[k]?.fehlend ? <span className="material-meta"> ({v[k].fehlend}× auf einer Seite leer)</span> : null}
              </li>
            ))}
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
              {p.ki && refDaten && (
                <label className="vg-wahl">
                  <span className="material-meta">Zuordnung Entwurf {p.ki.index + 1} →</span>
                  <select
                    value={p.ref ? String(p.ref.index) : ""}
                    onChange={(e) => umordnen(p.ki!.index, e.target.value === "" ? null : Number(e.target.value))}
                  >
                    <option value="">keine Zuordnung</option>
                    {refTitel.map((t, j) => (
                      <option key={j} value={j}>
                        Referenz {t}
                      </option>
                    ))}
                  </select>
                </label>
              )}
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
