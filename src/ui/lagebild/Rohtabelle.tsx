// Reiter „Rohtabelle“ der Auswertung (seit UX-2026-W45-25 aus Lagebild.tsx): eine Zeile je Sachverhalt mit allen
// Feldern. Die Kernspalten (Land/Bund, Stelle, Zeitpunkt, Kennung, Bezeichnung, Art, Ort, Beurteilung, Tendenz) stehen
// vorn, Kopfzeile und erste Spalte bleiben beim Scrollen stehen, Zellen sind auf drei Zeilen gekürzt und je Zeile
// aufklappbar. Bis dahin stand der Dateiname vorn, und lange Analysefelder machten jede Zeile rund 1.500 px hoch.
// CSV und PDF bleiben vollständig. Seit UX-2026-W45-26 sind die übrigen Spaltengruppen zuschaltbar; Standard ist
// „kompakt“ (nur Kernspalten), die Auswahl bleibt mit dem Stand des Lagebilds im Gerät.

import { useMemo, useState } from "react";
import type { Profil } from "../../kern/typen";
import type { LagebildEintrag } from "../../lagebild/lagebild";
import { rohtabelle, spalten, SPALTENGRUPPEN } from "../../lagebild/ausgabe";

export function Rohtabelle({
  profil,
  eintraege,
  gruppen,
  setGruppen,
}: {
  profil: Profil;
  eintraege: LagebildEintrag[];
  /** Zugeschaltete Spaltengruppen (seit UX-2026-W45-26); leer = kompakt */
  gruppen: readonly string[];
  setGruppen: (g: string[]) => void;
}) {
  const sp = useMemo(() => spalten(profil), [profil]);
  const vorhanden = SPALTENGRUPPEN.filter((g) => sp.some((x) => x.gruppe === g.id));
  const { kopf, zeilen } = useMemo(() => {
    const t = rohtabelle(eintraege, profil);
    // Kernspalten zuerst, sonst die Reihenfolge des Schemas; übrige nur aus zugeschalteten Gruppen
    const folge = [...sp.keys()]
      .filter((i) => sp[i]!.gruppe === "kern" || !sp[i]!.gruppe || gruppen.includes(sp[i]!.gruppe!))
      .sort((a, b) => Number(sp[b]!.gruppe === "kern") - Number(sp[a]!.gruppe === "kern") || a - b);
    return { kopf: folge.map((i) => t[0]![i]!), zeilen: t.slice(1).map((z) => folge.map((i) => z[i] ?? "")) };
  }, [eintraege, profil, sp, gruppen]);
  const [offen, setOffen] = useState<ReadonlySet<number>>(() => new Set());
  const umschalten = (i: number) =>
    setOffen((alt) => {
      const neu = new Set(alt);
      if (neu.has(i)) neu.delete(i);
      else neu.add(i);
      return neu;
    });

  return (
    <>
      <div className="lb-chips lb-spaltengruppen" role="group" aria-label="Spaltengruppen der Rohtabelle">
        <span className="lb-chips-titel">Spalten</span>
        {vorhanden.map((g) => {
          const an = gruppen.includes(g.id);
          const n = sp.filter((x) => x.gruppe === g.id).length;
          return (
            <button
              key={g.id}
              type="button"
              className={an ? "lb-chip aktiv" : "lb-chip"}
              aria-pressed={an}
              onClick={() => setGruppen(an ? gruppen.filter((x) => x !== g.id) : [...gruppen, g.id])}
            >
              {g.titel} ({n})
            </button>
          );
        })}
        {gruppen.length < vorhanden.length && (
          <button type="button" className="knopf leise klein" onClick={() => setGruppen(vorhanden.map((g) => g.id))}>
            Alle Spalten
          </button>
        )}
        {gruppen.length > 0 && (
          <button type="button" className="knopf leise klein" onClick={() => setGruppen([])}>
            Kompakt
          </button>
        )}
        <span className="hinweis">
          {kopf.length} von {sp.length} Spalten; CSV und PDF enthalten immer alle.
        </span>
      </div>
      <div className="lb-rahmen lb-rohtabelle" tabIndex={0} role="group" aria-label="Rohtabelle (waagerecht scrollbar)">
        <table className="tabelle lb-tabelle">
          <thead>
            <tr>
              {kopf.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z, i) => (
              <tr key={i} className={offen.has(i) ? "lb-zeile-offen" : undefined}>
                {z.map((c, j) => (
                  <td key={j} className="lb-lang">
                    {j === 0 ? (
                      <div className="lb-erste">
                        <button
                          type="button"
                          className="lb-zeile-knopf"
                          aria-expanded={offen.has(i)}
                          aria-label={`Zeile ${i + 1} ${offen.has(i) ? "kürzen" : "ganz zeigen"}`}
                          onClick={() => umschalten(i)}
                        >
                          <span aria-hidden="true">{offen.has(i) ? "▾" : "▸"}</span>
                        </button>
                        <div className="lb-zelle">{c}</div>
                      </div>
                    ) : (
                      <div className="lb-zelle">{c}</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
