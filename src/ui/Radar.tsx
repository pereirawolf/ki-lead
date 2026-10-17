// Lagenradar: Netzgrafik plus Stufenwahl je Achse. „Offen“ (null) ist sichtbar etwas anderes als Stufe 0.

import type { RadarDef } from "../kern/typen";

interface Props {
  def: RadarDef;
  wert: Record<string, number | null> | undefined;
  onChange?: (neu: Record<string, number | null>) => void;
  idPraefix: string;
}

export function RadarGrafik({ def, wert, groesse = 220 }: { def: RadarDef; wert: Record<string, number | null> | undefined; groesse?: number }) {
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
  const werte = def.achsen.map((a) => {
    const v = wert?.[a.key];
    return Number.isInteger(v) ? (v as number) : null;
  });
  const gesetzt = werte.some((v) => v !== null);
  const flaeche = def.achsen
    .map((_, i) =>
      punkt(i, (rMax * (werte[i] ?? 0)) / def.max)
        .map((x) => x.toFixed(1))
        .join(","),
    )
    .join(" ");
  const kurz = (label: string) => label.match(/^(D\d+)\b/)?.[1] ?? label.split(/\s+/)[0];
  return (
    <svg viewBox={`0 0 ${groesse} ${groesse}`} width={groesse} height={groesse} role="img" aria-label="Lagenradar">
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

export function RadarFeld({ def, wert, onChange, idPraefix }: Props) {
  const setze = (key: string, v: number | null) => {
    const basis: Record<string, number | null> = {};
    for (const a of def.achsen) basis[a.key] = Number.isInteger(wert?.[a.key]) ? (wert![a.key] as number) : null;
    basis[key] = v;
    onChange?.(basis);
  };
  return (
    <div className="radar">
      <div className="radar-grafik">
        <RadarGrafik def={def} wert={wert} />
      </div>
      <div className="radar-achsen">
        {def.achsen.map((a) => {
          const v = Number.isInteger(wert?.[a.key]) ? (wert![a.key] as number) : null;
          const gruppe = `${idPraefix}-${a.key}`;
          return (
            <fieldset key={a.key} className="radar-achse-wahl">
              <legend>{a.label}</legend>
              <div className="stufen" role="radiogroup" aria-label={a.label}>
                <button
                  type="button"
                  className={v === null ? "stufe stufe-offen aktiv" : "stufe stufe-offen"}
                  aria-pressed={v === null}
                  onClick={() => setze(a.key, null)}
                  title="keine Angabe – offen statt geschätzt"
                >
                  offen
                </button>
                {a.stufen.map((_, s) => (
                  <button
                    type="button"
                    key={s}
                    id={`${gruppe}-${s}`}
                    className={v === s ? "stufe aktiv" : "stufe"}
                    aria-pressed={v === s}
                    onClick={() => setze(a.key, s)}
                    title={a.stufen[s]}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="stufentext">{v === null ? "keine Angabe" : a.stufen[v]}</div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
