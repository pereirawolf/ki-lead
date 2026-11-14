// Material im Lagebild (seit 0.8.2, UP-2026-W45-05): Kennzahlen-Bausteine (Thessa, KSNV) mit Raum, Datenstand, Zahl der
// Kennzahlen und Einsatzmeldungen und Prüfstand. Sie zählen nicht als Meldung. Darunter aufklappbar die Rechenhilfe der
// App, wie sie mit der Übergabe an die KI geht (Entscheidung des Herausgebers vom 14.11.2026: zum Gegenlesen).

import { useMemo } from "react";
import { zeitDE } from "../../kern/baustein";
import { AUSSCHNITT_ZUSATZ, istAusschnitt, rechenhilfe, rechenhilfeNoetig, rechenhilfeText } from "../../kern/bausteinverdichtung";
import { bausteineFuerLagebild, materialPruefstand, type LagebildMaterial } from "../../lagebild/lagebild";

export function LagebildMaterialListe({ material, entfernen }: { material: LagebildMaterial[]; entfernen: (id: string) => void }) {
  const bausteine = useMemo(() => bausteineFuerLagebild(material), [material]);
  const text = useMemo(() => (rechenhilfeNoetig(bausteine) ? rechenhilfeText(rechenhilfe(bausteine)) : ""), [bausteine]);
  if (!material.length) return null;
  return (
    <details className="lb-dateiliste lb-material" open={material.length <= 6}>
      <summary>Material: Kennzahlen-Bausteine ({material.length})</summary>
      <p className="hinweis">
        Strukturiertes Material, keine Meldungen: nicht im Meldestatus, in den Zählern und Ausgaben. Geht mit der Übergabe als Material an die KI.
      </p>
      <ul className="lb-material-liste">
        {material.map((m) => {
          const e = m.erkennung;
          const info = e.status === "gueltig" ? e.info : undefined;
          return (
            <li key={m.id}>
              <span className="lb-material-text">
                <strong>{info ? `${info.raum.name}${info.raum.schluessel ? ` (${info.raum.schluessel})` : ""}` : m.name}</strong>
                <span className="material-meta">
                  {info
                    ? [
                        `Datenstand ${zeitDE(info.datenstand)}`,
                        `${info.kennzahlen} Kennzahl${info.kennzahlen === 1 ? "" : "en"}`,
                        `${info.einsatzmeldungen} Einsatzmeldung${info.einsatzmeldungen === 1 ? "" : "en"}`,
                        `${info.app} ${info.fassung}${info.fiktiv ? ", FIKTIV" : ""}`,
                        materialPruefstand(m),
                      ].join(" · ")
                    : `${e.status === "gueltig" ? "" : `${e.format} ${e.fassung || ""} · `}${materialPruefstand(m)}`}
                </span>
                {info && istAusschnitt(info) && <span className="material-meta">Raum gilt als {AUSSCHNITT_ZUSATZ}.</span>}
                {info && <span className="material-meta lb-material-datei">{m.name}</span>}
              </span>
              <button type="button" className="lb-x" aria-label={`${m.name} entfernen`} onClick={() => entfernen(m.id)}>
                ×
              </button>
            </li>
          );
        })}
      </ul>
      {text && (
        <details className="lb-rechenhilfe">
          <summary>Rechenhilfe der App (wie an die KI)</summary>
          <pre>{text}</pre>
        </details>
      )}
    </details>
  );
}
