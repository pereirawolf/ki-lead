// Reiter „Sachverhalte“ des Lagebilds (seit 0.6.20, UX-2026-W44-09): je Sachverhalt eine kompakte Zeile mit Bezeichnung,
// meldender Stelle, Art, Ort, Eintritt sowie Beurteilung und Tendenz als Marken; Bewertungstext, Analysefelder, Bezug
// und Zeitstrahl zum Aufklappen. Darüber Filter nach Beurteilung und Tendenz (zusätzlich zum Herkunftsfilter). Bis
// 0.6.18 stand hier eine breite Tabelle mit allen Volltexten; sie bleibt als Rohtabelle, im PDF und in der CSV.

import { useId, useState, type ReactNode } from "react";
import type { Profil } from "../../kern/typen";
import { holeWert } from "../../kern/pfad";
import { bezeichnung } from "../../kern/ui";
import { bezugVon } from "../../kern/kennung";
import { eintraegeFuer, zeitstrahlAnzeige, zeitstrahlText } from "../../kern/zeitstrahl";
import { datumDE } from "../../kern/ausgabe";
import { gliedereAnalyse, gliedereBewertung } from "../../kern/kennsaetze";
import { herkunftsrolleAnzeige, type SvEintrag } from "../../lagebild/lagebild";
import { Absender, Marke, SvMarken } from "./bausteine";

/** Filter der Sachverhalte; leer = alle. Art, Land und Suche seit UX-2026-W45-14 */
export interface SvFilter {
  beurteilung: string;
  tendenz: string;
  /** eine Art aus der Mehrfachnennung */
  art: string;
  /** Wert der Rolle „land“ (Land/Bund) */
  land: string;
  /** Textsuche in Bezeichnung, Ort und Kennung, ohne Groß- und Kleinschreibung */
  suche: string;
}

export const KEIN_FILTER: SvFilter = { beurteilung: "", tendenz: "", art: "", land: "", suche: "" };

/** Wert für „keine Angabe“ im Filter (ein leerer Wert hieße „alle“) */
const OHNE = "\u0000ohne";

/** Sachverhalte nach Filter; „keine Angabe“ trifft leere Werte. `kennung` liefert die Sachverhaltskennung für die Suche. */
export function svFiltern(liste: SvEintrag[], f: SvFilter, kennung: (s: SvEintrag) => string = () => ""): SvEintrag[] {
  const passt = (wert: string, soll: string) => !soll || (soll === OHNE ? !wert : wert === soll);
  const artPasst = (s: SvEintrag) => !f.art || (f.art === OHNE ? !s.arten.length : s.arten.includes(f.art));
  const worte = f.suche.toLocaleLowerCase("de").split(/\s+/).filter(Boolean);
  const findet = (s: SvEintrag) => {
    if (!worte.length) return true;
    const text = [s.bezeichnung, s.ort, kennung(s)].join(" ").toLocaleLowerCase("de");
    return worte.every((w) => text.includes(w));
  };
  return liste.filter((s) => passt(s.beurteilung, f.beurteilung) && passt(s.tendenz, f.tendenz) && artPasst(s) && passt(s.land, f.land) && findet(s));
}

/** Auswahlwerte mit Anzahl in der Reihenfolge des ersten Auftretens (die Liste ist nach Schwere sortiert); mehrere Werte je Sachverhalt bei Art */
function werte(liste: SvEintrag[], von: (s: SvEintrag) => string | string[]): { wert: string; anzahl: number }[] {
  const m = new Map<string, number>();
  for (const s of liste) {
    const w = von(s);
    const alle = Array.isArray(w) ? (w.length ? w : [""]) : [w];
    for (const x of alle) m.set(x || OHNE, (m.get(x || OHNE) ?? 0) + 1);
  }
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
  const [nachBezug, setNachBezug] = useState(false);
  const lBeurteilung = r.sv_beurteilung ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_beurteilung}`) : "Beurteilung";
  const lTendenz = r.sv_tendenz ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_tendenz}`) : "Tendenz";
  const kennungVon = (s: SvEintrag) => (r.sv_kennung ? String(holeWert(s.sv, r.sv_kennung) ?? "") : "");
  const gezeigt = svFiltern(sortiert, filter, kennungVon);
  const gefiltert = Object.values(filter).some(Boolean);
  // Filter als Chips mit Anzahl (seit UX-2026-W45-14, bis dahin Auswahllisten für Beurteilung und Tendenz)
  const chips = (art: Exclude<keyof SvFilter, "suche">, titel: string, von: (s: SvEintrag) => string | string[]) => {
    const liste = werte(sortiert, von);
    if (filter[art] && !liste.some((w) => w.wert === filter[art])) liste.push({ wert: filter[art], anzahl: 0 });
    if (liste.length < 2 && !filter[art]) return null;
    return (
      <div className="lb-chips" role="group" aria-label={titel}>
        <span className="lb-chips-titel">{titel}</span>
        {liste.map((w) => {
          const an = filter[art] === w.wert;
          return (
            <button
              key={w.wert}
              type="button"
              className={an ? "lb-chip aktiv" : "lb-chip"}
              aria-pressed={an}
              onClick={() => setFilter({ ...filter, [art]: an ? "" : w.wert })}
            >
              {w.wert === OHNE ? "keine Angabe" : w.wert} ({w.anzahl})
            </button>
          );
        })}
      </div>
    );
  };
  // Bezug zwischen geladenen Sachverhalten (seit UX-2026-W45-15): in jeder Zeile als Hinweis, auf Wunsch als Baum
  const nachKennung = new Map<string, SvEintrag>();
  for (const x of sortiert) if (kennungVon(x) && !nachKennung.has(kennungVon(x))) nachKennung.set(kennungVon(x), x);
  const bezugGeladen = (x: SvEintrag) => bezugVon(x.sv, ui).filter((k) => nachKennung.has(k) && k !== kennungVon(x));
  const genanntIn = new Map<string, SvEintrag[]>();
  for (const x of sortiert) for (const k of bezugGeladen(x)) genanntIn.set(k, [...(genanntIn.get(k) ?? []), x]);
  const baumMoeglich = sortiert.some((x) => bezugGeladen(x).length > 0);
  const baum = nachBezug && baumMoeglich;

  const zeile = (s: SvEintrag, unter?: ReactNode) => {
    const kennung = kennungVon(s);
    const bezug = bezugVon(s.sv, ui);
    const zeilen = r.zeitstrahl && r.sv_kennung ? eintraegeFuer(zeitstrahlText(s.eintrag.daten, ui), kennung).map(zeitstrahlAnzeige) : [];
    const lOrt = r.sv_ort ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_ort}`) : "Ort";
    return (
      <li key={`${s.eintrag.id}-${s.index}`} className="lb-sv-zeile">
        <details>
          {/* Kopf gegliedert: Bezeichnung mit Marken, Angaben einzeln, Ort eigene Zeile gekürzt (seit UX-2026-W45-13) */}
          <summary>
            <span className="lb-sv-kopf">
              <span className="lb-sv-name">{s.bezeichnung || `Sachverhalt ${s.index + 1}`}</span>
              <SvMarken s={s} profil={profil} />
            </span>
            <span className="lb-sv-angaben">
              <Absender e={s.eintrag} profil={profil} zeile />
              {s.arten.length > 0 && <span className="lb-sv-angabe">{s.arten.join(", ")}</span>}
              {s.eintritt && <span className="lb-sv-angabe">Eintritt {datumDE(s.eintritt)}</span>}
              {kennung && <span className="lb-kennung-inline">{kennung}</span>}
              {r.herkunft && <Marke farbe="amt">Herkunft: {herkunftsrolleAnzeige(profil, s.herkunftsrolle)}</Marke>}
              {bezugGeladen(s).length > 0 && <span className="lb-sv-bezug">Bezug auf {bezugGeladen(s).length} geladene</span>}
              {kennung && (genanntIn.get(kennung)?.length ?? 0) > 0 && (
                <span className="lb-sv-bezug">genannt in {genanntIn.get(kennung)!.map(kennungVon).join(", ")}</span>
              )}
            </span>
            {s.ort && (
              <span className="lb-sv-ort" title={s.ort}>
                <span className="sr-only">{lOrt}: </span>
                {s.ort}
              </span>
            )}
          </summary>
          <dl className="lb-sv-details">
            {s.ort && (
              <>
                <dt>{lOrt}</dt>
                <dd className="lb-lang-text">{s.ort}</dd>
              </>
            )}
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
        {unter}
      </li>
    );
  };

  /** Im Baum: Sachverhalte mit Bezug oben, die genannten darunter (je nur einmal); übrige danach */
  const baumZeilen = () => {
    const vergeben = new Set<SvEintrag>();
    const eltern = gezeigt.filter((x) => bezugGeladen(x).length > 0);
    eltern.forEach((x) => vergeben.add(x));
    const knoten = eltern.map((x) => {
      const kinder = gezeigt.filter((k) => !vergeben.has(k) && bezugGeladen(x).includes(kennungVon(k)));
      kinder.forEach((k) => vergeben.add(k));
      return zeile(
        x,
        kinder.length > 0 && (
          <ul className="lb-svliste lb-svliste-unter" aria-label={`Bezug von ${kennungVon(x) || x.bezeichnung}`}>
            {kinder.map((k) => zeile(k))}
          </ul>
        ),
      );
    });
    return [...knoten, ...gezeigt.filter((x) => !vergeben.has(x)).map((x) => zeile(x))];
  };

  return (
    <div className="lb-svliste-rahmen">
      <div className="lb-svfilter" role="group" aria-label="Sachverhalte filtern">
        <label className="lb-svfilter-feld lb-svsuche" htmlFor={`${id}-suche`}>
          <span>Suche</span>
          <input
            id={`${id}-suche`}
            type="search"
            value={filter.suche}
            placeholder="Bezeichnung, Ort oder Kennung"
            onChange={(e) => setFilter({ ...filter, suche: e.target.value })}
          />
        </label>
        <p className="lb-svfilter-stand" role="status">
          {gefiltert ? `${gezeigt.length} von ${sortiert.length} Sachverhalten` : `${sortiert.length} Sachverhalt${sortiert.length === 1 ? "" : "e"}`}
        </p>
        {gefiltert && (
          <button type="button" className="knopf leise klein" onClick={() => setFilter(KEIN_FILTER)}>
            Filter aufheben
          </button>
        )}
      </div>
      <div className="lb-chipgruppen">
        {r.sv_beurteilung && chips("beurteilung", lBeurteilung, (s) => s.beurteilung)}
        {r.sv_tendenz && chips("tendenz", lTendenz, (s) => s.tendenz)}
        {r.sv_art && chips("art", bezeichnung(ui, `${r.sachverhalte}[].${r.sv_art}`), (s) => s.arten)}
        {r.land && chips("land", bezeichnung(ui, r.land), (s) => s.land)}
      </div>
      {baumMoeglich && (
        <label className="lb-wahl lb-svbaum-schalter">
          <input type="checkbox" checked={nachBezug} onChange={(e) => setNachBezug(e.target.checked)} /> Nach Bezug ordnen
        </label>
      )}
      {gezeigt.length === 0 ? (
        <p className="leer">Kein Sachverhalt entspricht dem Filter.</p>
      ) : (
        <ul className="lb-svliste">{baum ? baumZeilen() : gezeigt.map((x) => zeile(x))}</ul>
      )}
    </div>
  );
}
