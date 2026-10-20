// Auswahl des Modells je KI-Stufe für einen einzelnen Lauf, abweichend von „Einstellungen“.

import { useId } from "react";
import { ANBIETER_NAME, anbieterVon, type Schluessel } from "../anbieter/verteiler";
import { MODELL_GRUPPEN, modellFuer, type Einstellungen, type ModellWahl as Wahl, type Rolle } from "../pipeline/einstellungen";
import type { Profil } from "../kern/typen";

export interface StufeModell {
  rolle: Rolle;
  /** Kurzname in der Zusammenfassung, z. B. „S1“ */
  kurz: string;
  titel: string;
}

interface Props {
  stufen: StufeModell[];
  /** Einstellungen ohne die Wahl dieses Laufs (für die Anzeige des Standards) */
  einstellungen: Einstellungen;
  profil: Profil;
  schluessel: Schluessel;
  wahl: Wahl;
  onChange: (w: Wahl) => void;
  deaktiviert?: boolean;
}

export function ModellWahl({ stufen, einstellungen, profil, schluessel, wahl, onChange, deaktiviert }: Props) {
  const id = useId();
  const abweichend = stufen.some((s) => !!wahl[s.rolle]);
  const ohneSchluessel = (m: string) => (schluessel[anbieterVon(m)] ? "" : ` (kein Schlüssel für ${ANBIETER_NAME[anbieterVon(m)]})`);
  return (
    <details className="modellwahl" open={abweichend || undefined}>
      <summary>
        Modelle für diesen Lauf
        <span className="material-meta">
          {" "}
          {stufen.map((s) => `${s.kurz}: ${wahl[s.rolle] || modellFuer(s.rolle, einstellungen, profil)}`).join(" · ")}
          {abweichend ? " (abweichend von den Einstellungen)" : ""}
        </span>
      </summary>
      <div className="modellwahl-felder">
        {stufen.map((s) => {
          const standard = modellFuer(s.rolle, einstellungen, profil);
          return (
            <label key={s.rolle} className="feld" htmlFor={`${id}-${s.rolle}`}>
              <span className="feld-label">{s.titel}</span>
              <select
                id={`${id}-${s.rolle}`}
                value={wahl[s.rolle] || ""}
                disabled={deaktiviert}
                onChange={(e) => onChange({ ...wahl, [s.rolle]: e.target.value })}
              >
                <option value="">
                  Standard: {standard}
                  {ohneSchluessel(standard)}
                </option>
                {MODELL_GRUPPEN.map((g) => (
                  <optgroup key={g.anbieter} label={g.anbieter}>
                    {g.modelle.map((m) => (
                      <option key={m} value={m}>
                        {m}
                        {ohneSchluessel(m)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          );
        })}
      </div>
      <p className="hinweis">
        Gilt nur für diesen Lauf; die Vorgaben unter „Einstellungen“ bleiben unverändert. Das Protokoll hält das verwendete Modell je Stufe fest.
      </p>
    </details>
  );
}
