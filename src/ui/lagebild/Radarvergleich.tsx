// Reiter „Lagenradar“ der Auswertung (seit UX-2026-W45-16 aus Lagebild.tsx): Vergleichsmatrix (Zeilen Sachverhalte,
// Spalten Achsen, Zelle mit Stufe und Farbstufe) als Standard, Umschalter auf die bisherigen Karten je Sachverhalt.
// Bewusst ohne Mittelwert: Stufen verschiedener, nicht vergleichbarer Ereignisse lassen sich nicht sinnvoll mitteln.
// Eine Zeile öffnet die Karte des Sachverhalts unter der Matrix.

import { useState } from "react";
import type { Profil, RadarDef } from "../../kern/typen";
import { holeWert } from "../../kern/pfad";
import { radarWerte } from "../../kern/ui";
import { herkunftsrolleAnzeige, type SvEintrag } from "../../lagebild/lagebild";
import { RadarGrafik } from "../Radar";
import { Absender } from "./bausteine";

type Ansicht = "matrix" | "karten";

const schluessel = (s: SvEintrag) => `${s.eintrag.id}-${s.index}`;
const kurz = (label: string) => label.match(/^(D\d+)\b/)?.[1] ?? label.split(/\s+/)[0] ?? label;

/** Stufen je Achse eines Sachverhalts; null = offen */
function stufenVon(s: SvEintrag, def: RadarDef, feld: string): (number | null)[] {
  const st = radarWerte(holeWert(s.sv, feld));
  return def.achsen.map((a) => (Number.isInteger(st[a.key]) ? (st[a.key] as number) : null));
}

/** Karte eines Sachverhalts: Radar über die Kartenbreite, darunter die Achsen (seit 0.6.20, UX-2026-W44-13) */
export function RadarKarte({ s, def, feld, profil }: { s: SvEintrag; def: RadarDef; feld: string; profil: Profil }) {
  const r = profil.ui.rollen;
  const wert = holeWert(s.sv, feld);
  const stufen = radarWerte(wert);
  const gesetzt = def.achsen.some((a) => Number.isInteger(stufen[a.key]));
  return (
    <article className="lb-karte" id={`lb-radar-${schluessel(s)}`} tabIndex={-1}>
      <header>
        <p className="lb-karte-titel">{s.bezeichnung || `Sachverhalt ${s.index + 1}`}</p>
        <p className="lb-karte-meta">
          <Absender e={s.eintrag} profil={profil} zeile />
          {r.herkunft ? ` · Herkunft: ${herkunftsrolleAnzeige(profil, s.herkunftsrolle)}` : ""}
        </p>
      </header>
      <div className="lb-karte-inhalt lb-radar">
        {gesetzt ? <RadarGrafik def={def} wert={wert} groesse={260} /> : <p className="hinweis">Kein Lagenradar ausgefüllt.</p>}
        <dl className="lb-achsen">
          {def.achsen.map((a) => {
            const v = stufen[a.key];
            return (
              <div key={a.key} className="lb-achse">
                <dt>{a.label}</dt>
                <dd>{Number.isInteger(v) ? `${String(v)}${a.stufen[v as number] ? ` – ${a.stufen[v as number]}` : ""}` : "offen"}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </article>
  );
}

export function Radarvergleich({ profil, sortiert, def, feld }: { profil: Profil; sortiert: SvEintrag[]; def: RadarDef; feld: string }) {
  const [ansicht, setAnsicht] = useState<Ansicht>("matrix");
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const auswahl = sortiert.find((s) => schluessel(s) === gewaehlt);

  return (
    <>
      <div className="lb-radar-kopf">
        <p className="hinweis">
          Bewusst ohne Mittelwert über mehrere Sachverhalte: Ein Durchschnitt über Stufen verschiedener, nicht vergleichbarer Ereignisse wäre nicht
          aussagekräftig. Die Werte stehen daher je Sachverhalt einzeln.
        </p>
        <div className="segmente" role="group" aria-label="Darstellung des Lagenradars">
          {(
            [
              ["matrix", "Matrix"],
              ["karten", "Karten"],
            ] as const
          ).map(([id, text]) => (
            <button key={id} type="button" className={ansicht === id ? "segment aktiv" : "segment"} aria-pressed={ansicht === id} onClick={() => setAnsicht(id)}>
              {text}
            </button>
          ))}
        </div>
      </div>

      {ansicht === "karten" ? (
        <div className="lb-karten">
          {sortiert.map((s) => (
            <RadarKarte key={schluessel(s)} s={s} def={def} feld={feld} profil={profil} />
          ))}
        </div>
      ) : (
        <>
          <div className="lb-rahmen" tabIndex={0} role="group" aria-label="Vergleichsmatrix des Lagenradars (waagerecht scrollbar)">
            <table className="tabelle lb-tabelle lb-radarmatrix">
              <caption className="sr-only">
                Stufen je Sachverhalt und Achse, 0 bis {def.max}; U = offen. Eine Zeile öffnet die Karte des Sachverhalts.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Sachverhalt</th>
                  {def.achsen.map((a) => (
                    <th key={a.key} scope="col" title={a.label}>
                      <abbr title={a.label}>{kurz(a.label)}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortiert.map((s) => {
                  const st = stufenVon(s, def, feld);
                  const offen = schluessel(s) === gewaehlt;
                  return (
                    <tr key={schluessel(s)} className={offen ? "lb-matrix-gewaehlt" : undefined}>
                      <th scope="row">
                        <button
                          type="button"
                          className="lb-matrix-zeile"
                          aria-expanded={offen}
                          onClick={() => setGewaehlt(offen ? null : schluessel(s))}
                          title="Karte dieses Sachverhalts zeigen"
                        >
                          {s.bezeichnung || `Sachverhalt ${s.index + 1}`}
                        </button>
                        <Absender e={s.eintrag} profil={profil} zeile />
                      </th>
                      {def.achsen.map((a, i) => {
                        const v = st[i] ?? null;
                        const text = v === null ? "offen" : `${v}${a.stufen[v] ? ` – ${a.stufen[v]}` : ""}`;
                        return v === null ? (
                          <td key={a.key} className="lb-stufe lb-stufe-offen" title={`${a.label}: offen`}>
                            <span aria-hidden="true">U</span>
                            <span className="sr-only">{a.label}: offen</span>
                          </td>
                        ) : (
                          <td
                            key={a.key}
                            className={v / Math.max(1, def.max) > 0.55 ? "lb-stufe lb-stufe-dunkel" : "lb-stufe"}
                            style={{ ["--anteil" as string]: `${Math.round(8 + (82 * v) / Math.max(1, def.max))}%` }}
                            title={`${a.label}: ${text}`}
                          >
                            <span aria-hidden="true">{v}</span>
                            <span className="sr-only">
                              {a.label}: {text}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="hinweis lb-matrix-legende">
            Zelle: Stufe 0 bis {def.max}, je höher, desto kräftiger; U = offen (schraffiert). Achsen:{" "}
            {def.achsen.map((a) => `${kurz(a.label)} ${a.label.replace(/^D\d+\s*/, "")}`).join(" · ")}
          </p>
          {auswahl && (
            <div className="lb-matrix-karte">
              <RadarKarte s={auswahl} def={def} feld={feld} profil={profil} />
            </div>
          )}
        </>
      )}
    </>
  );
}
