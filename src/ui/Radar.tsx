// Lagenradar: Netzgrafik plus Stufenwahl je Achse. „Offen“ (null) ist sichtbar etwas anderes als Stufe 0.

import type { KeyboardEvent } from "react";
import type { RadarDef } from "../kern/typen";
import { radarMitStufe, radarWerte } from "../kern/ui";

interface Props {
  def: RadarDef;
  /** Stufen je Achse (v1) oder Achsen als Objekte mit „stufe“ (LEAD-Meldung-v2, seit 0.7.3) */
  wert: Record<string, unknown> | undefined;
  onChange?: (neu: Record<string, unknown>) => void;
  idPraefix: string;
}

export function RadarGrafik({ def, wert, groesse = 220 }: { def: RadarDef; wert: Record<string, unknown> | undefined; groesse?: number }) {
  const n = def.achsen.length;
  const c = groesse / 2;
  const rMax = groesse * 0.36;
  const punkt = (i: number, r: number) => {
    const w = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + r * Math.cos(w), c + r * Math.sin(w)] as const;
  };
  const ringe = [];
  for (let s = 1; s <= def.max; s++) {
    const pts = def.achsen
      .map((_, i) =>
        punkt(i, (rMax * s) / def.max)
          .map((x) => x.toFixed(1))
          .join(","),
      )
      .join(" ");
    ringe.push(<polygon key={s} points={pts} className={s === def.max ? "radar-ring radar-ring-aussen" : "radar-ring"} />);
  }
  const stufen = radarWerte(wert);
  const werte = def.achsen.map((a) => stufen[a.key] ?? null);
  const gesetzt = werte.some((v) => v !== null);
  const flaeche = def.achsen
    .map((_, i) =>
      punkt(i, (rMax * (werte[i] ?? 0)) / def.max)
        .map((x) => x.toFixed(1))
        .join(","),
    )
    .join(" ");
  const kurz = (label: string) => label.match(/^(D\d+)\b/)?.[1] ?? label.split(/\s+/)[0];
  // Werte auch ohne Grafik zugänglich (Screenreader, Systemfarben): „D1 Gefahrenlage: 2 von 4; D2 …: offen“
  const beschreibung = `Lagenradar: ${def.achsen.map((a, i) => `${a.label}: ${werte[i] === null ? "offen" : `${werte[i]} von ${def.max}`}`).join("; ")}`;
  return (
    <svg viewBox={`0 0 ${groesse} ${groesse}`} width={groesse} height={groesse} role="img" aria-label={beschreibung}>
      {ringe}
      {def.achsen.map((a, i) => {
        const [x, y] = punkt(i, rMax);
        const [lx, ly] = punkt(i, rMax + 16);
        return (
          <g key={a.key}>
            <line x1={c} y1={c} x2={x} y2={y} className="radar-achse" />
            <text x={lx} y={ly} className="radar-beschriftung" textAnchor="middle" dominantBaseline="middle">
              {kurz(a.label)}
            </text>
          </g>
        );
      })}
      {gesetzt && <polygon points={flaeche} className="radar-flaeche" />}
      {def.achsen.map((a, i) => {
        const v = werte[i];
        const [x, y] = punkt(i, (rMax * (v ?? 0)) / def.max);
        return v === null ? (
          <circle key={a.key} cx={x} cy={y} r={3.5} className="radar-punkt-offen" />
        ) : (
          <circle key={a.key} cx={x} cy={y} r={4.5} className="radar-punkt" />
        );
      })}
    </svg>
  );
}

/** Werte einer Achse in der Reihenfolge der Bedienung: zuerst „offen“ (null), dann die Stufen 0 bis max */
export function achsenWerte(stufen: number): (number | null)[] {
  return [null, ...Array.from({ length: stufen }, (_, s) => s)];
}

/**
 * Ziel einer Taste in einer Radiogruppe (Muster der WAI-ARIA Authoring Practices): Pfeil rechts/unten = nächste,
 * links/oben = vorige Option, jeweils mit Umlauf; Pos1/Ende = erste/letzte. Andere Tasten: null.
 */
export function zielIndex(taste: string, aktuell: number, anzahl: number): number | null {
  if (anzahl <= 0) return null;
  if (taste === "ArrowRight" || taste === "ArrowDown") return (aktuell + 1) % anzahl;
  if (taste === "ArrowLeft" || taste === "ArrowUp") return (aktuell - 1 + anzahl) % anzahl;
  if (taste === "Home") return 0;
  if (taste === "End") return anzahl - 1;
  return null;
}

export function RadarFeld({ def, wert, onChange, idPraefix }: Props) {
  // Seit 0.7.3 (UP-2026-W45-03) auch Achsen als Objekte (LEAD-Meldung-v2): Begründung und Belege bleiben erhalten
  const setze = (key: string, v: number | null) => onChange?.(radarMitStufe(def, wert, key, v));
  const stufen = radarWerte(wert);
  return (
    <div className="radar">
      <div className="radar-grafik">
        <RadarGrafik def={def} wert={wert} />
      </div>
      <div className="radar-achsen">
        {def.achsen.map((a) => {
          const v = stufen[a.key] ?? null;
          const gruppe = `${idPraefix}-${a.key}`;
          const werte = achsenWerte(a.stufen.length);
          const optionId = (w: number | null) => `${gruppe}-${w === null ? "offen" : w}`;
          // Liegt ein gespeicherter Wert außerhalb der Stufen, bleibt die Gruppe über „offen“ erreichbar.
          const tabZiel = werte.includes(v) ? v : null;
          // Radiogruppe mit einem Tabstopp: nur die gewählte Option ist per Tab erreichbar, Pfeiltasten wählen um.
          const taste = (e: KeyboardEvent<HTMLButtonElement>) => {
            const ziel = zielIndex(e.key, werte.indexOf(v), werte.length);
            if (ziel === null) return;
            e.preventDefault();
            const wert = werte[ziel];
            if (wert === undefined) return;
            setze(a.key, wert);
            document.getElementById(optionId(wert))?.focus();
          };
          return (
            <fieldset key={a.key} className="radar-achse-wahl">
              <legend id={`${gruppe}-legende`}>{a.label}</legend>
              <div className="stufen" role="radiogroup" aria-labelledby={`${gruppe}-legende`}>
                {werte.map((w) => {
                  const gewaehlt = v === w;
                  const offen = w === null;
                  return (
                    <button
                      type="button"
                      role="radio"
                      key={offen ? "offen" : w}
                      id={optionId(w)}
                      className={`${offen ? "stufe stufe-offen" : "stufe"}${gewaehlt ? " aktiv" : ""}`}
                      aria-checked={gewaehlt}
                      aria-label={offen ? "offen – keine Angabe" : `Stufe ${w}: ${a.stufen[w]}`}
                      tabIndex={w === tabZiel ? 0 : -1}
                      onClick={() => setze(a.key, w)}
                      onKeyDown={taste}
                      title={offen ? "keine Angabe – offen statt geschätzt" : a.stufen[w]}
                    >
                      {offen ? "offen" : w}
                    </button>
                  );
                })}
              </div>
              <div className="stufentext">{v === null ? "keine Angabe" : a.stufen[v]}</div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
