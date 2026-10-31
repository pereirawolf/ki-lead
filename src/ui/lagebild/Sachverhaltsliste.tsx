// Reiter „Sachverhalte“ des Lagebilds (seit 0.6.20, UX-2026-W44-09): je Sachverhalt eine kompakte Zeile mit Bezeichnung,
// meldender Stelle, Art, Ort, Eintritt sowie Beurteilung und Tendenz als Marken; Bewertungstext, Analysefelder, Bezug
// und Zeitstrahl zum Aufklappen. Darüber Filter nach Beurteilung und Tendenz (zusätzlich zum Herkunftsfilter). Bis
// 0.6.18 stand hier eine breite Tabelle mit allen Volltexten; sie bleibt als Rohtabelle, im PDF und in der CSV.

import { useId } from "react";
import type { Profil } from "../../kern/typen";
import { holeWert } from "../../kern/pfad";
import { bezeichnung } from "../../kern/ui";
import { bezugVon } from "../../kern/kennung";
import { eintraegeFuer, zeitstrahlAnzeige, zeitstrahlText } from "../../kern/zeitstrahl";
import { datumDE } from "../../kern/ausgabe";
import { gliedereAnalyse, gliedereBewertung } from "../../kern/kennsaetze";
import { absender, herkunftsrolleAnzeige, type SvEintrag } from "../../lagebild/lagebild";
import { Marke, SvMarken } from "./bausteine";

/** Filter der Sachverhalte; leer = alle */
export interface SvFilter {
  beurteilung: string;
  tendenz: string;
}

export const KEIN_FILTER: SvFilter = { beurteilung: "", tendenz: "" };

/** Wert für „keine Angabe“ im Filter (ein leerer Wert hieße „alle“) */
const OHNE = "\u0000ohne";

/** Sachverhalte nach Filter; „keine Angabe“ trifft leere Werte */
export function svFiltern(liste: SvEintrag[], f: SvFilter): SvEintrag[] {
  const passt = (wert: string, soll: string) => !soll || (soll === OHNE ? !wert : wert === soll);
  return liste.filter((s) => passt(s.beurteilung, f.beurteilung) && passt(s.tendenz, f.tendenz));
}

/** Auswahlwerte mit Anzahl in der Reihenfolge des ersten Auftretens (die Liste ist nach Schwere sortiert) */
function werte(liste: SvEintrag[], von: (s: SvEintrag) => string): { wert: string; anzahl: number }[] {
  const m = new Map<string, number>();
  for (const s of liste) m.set(von(s) || OHNE, (m.get(von(s) || OHNE) ?? 0) + 1);
  return [...m].map(([wert, anzahl]) => ({ wert, anzahl }));
}

export function Sachverhaltsliste({
  profil,
  sortiert,
  filter,
  setFilter,
  kennungsStelle,
}: {
  profil: Profil;
  /** nach Schwere sortiert, bereits nach Herkunft gefiltert */
  sortiert: SvEintrag[];
  filter: SvFilter;
  setFilter: (f: SvFilter) => void;
  /** Kennung → meldende Stelle, zum Auflösen des Bezugs */
  kennungsStelle: Map<string, string>;
}) {
  const ui = profil.ui;
  const r = ui.rollen;
  const id = useId();
  const lBeurteilung = r.sv_beurteilung ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_beurteilung}`) : "Beurteilung";
  const lTendenz = r.sv_tendenz ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_tendenz}`) : "Tendenz";
  const gezeigt = svFiltern(sortiert, filter);
  const gefiltert = !!(filter.beurteilung || filter.tendenz);
  const auswahl = (art: keyof SvFilter, titel: string, von: (s: SvEintrag) => string) => (
    <label className="lb-svfilter-feld" htmlFor={`${id}-${art}`}>
      <span>{titel}</span>
      <select id={`${id}-${art}`} value={filter[art]} onChange={(e) => setFilter({ ...filter, [art]: e.target.value })}>
        <option value="">alle</option>
        {werte(sortiert, von).map((w) => (
          <option key={w.wert} value={w.wert}>
            {w.wert === OHNE ? "keine Angabe" : w.wert} ({w.anzahl})
          </option>
        ))}
        {filter[art] && !sortiert.some((s) => (von(s) || OHNE) === filter[art]) && (
          <option value={filter[art]}>{filter[art] === OHNE ? "keine Angabe" : filter[art]} (0)</option>
        )}
      </select>
    </label>
  );
  return (
    <div className="lb-svliste-rahmen">
      <div className="lb-svfilter" role="group" aria-label="Sachverhalte filtern">
        {r.sv_beurteilung && auswahl("beurteilung", lBeurteilung, (s) => s.beurteilung)}
        {r.sv_tendenz && auswahl("tendenz", lTendenz, (s) => s.tendenz)}
        <p className="lb-svfilter-stand" role="status">
          {gefiltert ? `${gezeigt.length} von ${sortiert.length} Sachverhalten` : `${sortiert.length} Sachverhalt${sortiert.length === 1 ? "" : "e"}`}
        </p>
        {gefiltert && (
          <button type="button" className="knopf leise klein" onClick={() => setFilter(KEIN_FILTER)}>
            Filter aufheben
          </button>
        )}
      </div>
      {gezeigt.length === 0 ? (
        <p className="leer">Kein Sachverhalt entspricht dem Filter.</p>
      ) : (
        <ul className="lb-svliste">
          {gezeigt.map((s) => {
            const kennung = r.sv_kennung ? String(holeWert(s.sv, r.sv_kennung) ?? "") : "";
            const bezug = bezugVon(s.sv, ui);
            const zeilen = r.zeitstrahl && r.sv_kennung ? eintraegeFuer(zeitstrahlText(s.eintrag.daten, ui), kennung).map(zeitstrahlAnzeige) : [];
            const meta = [s.arten.join(", "), s.ort, s.eintritt && `Eintritt ${datumDE(s.eintritt)}`].filter(Boolean);
            return (
              <li key={`${s.eintrag.id}-${s.index}`} className="lb-sv-zeile">
                <details>
                  <summary>
                    <span className="lb-sv-kopf">
                      <span className="lb-sv-name">{s.bezeichnung || `Sachverhalt ${s.index + 1}`}</span>
                      <SvMarken s={s} profil={profil} />
                    </span>
                    <span className="lb-sv-meta">
                      {absender(s.eintrag, profil)}
                      {meta.length ? ` · ${meta.join(" · ")}` : ""}
                    </span>
                    {(kennung || r.herkunft) && (
                      <span className="lb-sv-meta">
                        {kennung && <span className="lb-kennung-inline">{kennung}</span>}
                        {r.herkunft && <Marke farbe="amt">Herkunft: {herkunftsrolleAnzeige(profil, s.herkunftsrolle)}</Marke>}
                      </span>
                    )}
                  </summary>
                  <dl className="lb-sv-details">
                    {bezug.length > 0 && (
                      <>
                        <dt>Bezug</dt>
                        <dd>{bezug.map((k) => (kennungsStelle.has(k) ? `${k} (${kennungsStelle.get(k)})` : k)).join("; ")}</dd>
                      </>
                    )}
                    {r.sv_bewertung_text && (
                      <>
                        <dt>{bezeichnung(ui, `${r.sachverhalte}[].${r.sv_bewertung_text}`)}</dt>
                        <dd className="lb-lang-text">{gliedereBewertung(s.bewertungText, ui) || "–"}</dd>
                      </>
                    )}
                    {(r.sv_analysefelder || []).map((f) => (
                      <div key={f} className="lb-sv-paar">
                        <dt>{bezeichnung(ui, `${r.sachverhalte}[].${f}`)}</dt>
                        <dd className="lb-lang-text">{gliedereAnalyse(holeWert(s.sv, f), ui) || "–"}</dd>
                      </div>
                    ))}
                    {zeilen.length > 0 && r.zeitstrahl && (
                      <>
                        <dt>{bezeichnung(ui, r.zeitstrahl)}</dt>
                        <dd className="lb-lang-text">{zeilen.join("\n")}</dd>
                      </>
                    )}
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
