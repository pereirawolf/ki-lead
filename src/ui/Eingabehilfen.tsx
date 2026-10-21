// LEAD-Eingabehilfen unter einem Textfeld (Analysefeld oder Bewertungstext): ein zugeklappter Bereich mit
// Schaltflächen, die vorhandene Satzanfänge und Kennsätze als Vorlage mit offenen Stellen ⟦…⟧ einfügen.
// Rein manuell: keine KI, keine Netzwerkanfrage. Es ändert sich nur der Text dieses Feldes; Beurteilung,
// Tendenz und Lagenradar werden höchstens gelesen.

import { useContext, useEffect, useId, useRef, useState } from "react";
import { holeWert, teilePfad, type Segment } from "../kern/pfad";
import { parseQuellen } from "../kern/quellen";
import {
  bausteinEinfuegen,
  erstePlatzhalterstelle,
  QUELLEN_PLATZHALTER,
  STATUS_PLATZHALTER,
  t0Text,
  vorhandeneStelle,
  vorlageFuellen,
  vorlageGesperrt,
  vorlageVerfuegbar,
  type VorlagenWert,
} from "../kern/feldhilfen";
import { feldUi } from "../kern/ui";
import type { Feldhilfe, FeldhilfeVorlage, Profil } from "../kern/typen";
import { EingabehilfeKontext } from "./eingabehilfeKontext";
import { useEingabehilfeVerlauf } from "./eingabehilfeVerlauf";

interface Props {
  profil: Profil;
  segs: Segment[];
  /** Bezeichnung des Feldes */
  label: string;
  /** id des Textfelds (Fokus und Markierung nach dem Einfügen) */
  textId: string;
  hilfe: Feldhilfe;
  /** Aktueller Text des Feldes */
  wert: string;
}

const DOPPELKLICK_MS = 800;

export function Eingabehilfen({ profil, segs, label, textId, hilfe, wert }: Props) {
  const kx = useContext(EingabehilfeKontext);
  const verlauf = useEingabehilfeVerlauf();
  const basisId = useId();
  const [status, setStatus] = useState("");
  const [quelle, setQuelle] = useState("");
  const [meldung, setMeldung] = useState("");
  const markieren = useRef<[number, number] | null>(null);
  const zuletzt = useRef<{ id: string; zeit: number } | null>(null);
  const ansage = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(ansage.current), []);

  // Nach dem Einfügen: Textfeld fokussieren und die erste offene Stelle des Bausteins markieren
  useEffect(() => {
    const a = markieren.current;
    if (!a) return;
    markieren.current = null;
    const t = document.getElementById(textId) as HTMLTextAreaElement | null;
    if (!t) return;
    t.focus();
    t.setSelectionRange(a[0], a[1]);
  }, [wert, textId]);

  if (!kx) return null;
  const ui = profil.ui;
  const r = ui.rollen;
  const vorlagen = hilfe.vorlagen.filter((v) => vorlageVerfuegbar(v, ui));
  if (!vorlagen.length) return null;

  const schluessel = segs.join(".");
  const svTiefe = teilePfad(r.sachverhalte).length + 1;
  const svNr = Number(segs[svTiefe - 1]);
  const name = Number.isInteger(svNr) ? `${label}, ${feldUi(ui, r.sachverhalte).element_label || "Sachverhalt"} ${svNr + 1}` : label;
  const kennsatzPrefixe = Object.values(ui.kennsaetze || {});

  // Zeilenenden wie im Textfeld (LF), damit Positionen für Markierung und Sprung stimmen
  const aktuellerText = () => String(holeWert(kx.aktuell(), segs) ?? "").replace(/\r\n?/g, "\n");
  /** Gelesene Werte; nie geschrieben */
  const leseWerte = (): Partial<Record<VorlagenWert, string>> => {
    const m = kx.aktuell();
    const sv = holeWert(m, segs.slice(0, svTiefe)) || {};
    return {
      beurteilung: r.sv_beurteilung ? String(holeWert(sv, r.sv_beurteilung) ?? "") : "",
      tendenz: r.sv_tendenz ? String(holeWert(sv, r.sv_tendenz) ?? "") : "",
      t0: r.meldezeitpunkt ? t0Text(holeWert(m, r.meldezeitpunkt)) : "",
      kurzname: profil.manifest.variablen?.kurzname || "",
    };
  };
  const werte = leseWerte();
  const doppelt = (id: string) => {
    const jetzt = Date.now();
    if (zuletzt.current?.id === id && jetzt - zuletzt.current.zeit < DOPPELKLICK_MS) return true;
    zuletzt.current = { id, zeit: jetzt };
    return false;
  };
  /** Meldung in der Live-Region; eine gleichlautende wird kurz geleert, damit sie erneut angesagt wird */
  const melden = (text: string) => {
    window.clearTimeout(ansage.current);
    if (text !== meldung) return setMeldung(text);
    setMeldung("");
    ansage.current = window.setTimeout(() => setMeldung(text), 50);
  };
  const springen = (pos: number) => {
    const t = document.getElementById(textId) as HTMLTextAreaElement | null;
    t?.focus();
    t?.setSelectionRange(pos, pos);
  };

  const einfuegen = (v: FeldhilfeVorlage) => {
    if (doppelt(`vorlage:${v.id}`)) return;
    const text = aktuellerText();
    const grund = vorlageGesperrt(v, leseWerte());
    if (grund) return melden(grund);
    const prefix = v.kennsatz ? ui.kennsaetze?.[v.kennsatz] : undefined;
    const vorhanden = vorhandeneStelle(text, v, ui);
    if (vorhanden?.art === "fliesstext")
      return melden(`„${prefix}“ steht schon im Fließtext. Kennsätze beginnen eine eigene Zeile; bitte die vorhandene Angabe dorthin verschieben.`);
    if (vorhanden) {
      springen(vorhanden.pos);
      return melden(
        v.kennsatz === "handlungsrelevant"
          ? `„${prefix}“ steht schon im Text. Weitere Fristen in dieser Zeile ergänzen, die früheste zuerst.`
          : prefix
            ? `„${prefix}“ steht schon im Text. Weitere Angaben in dieser Zeile ergänzen.`
            : `„${v.label}“ steht schon am Anfang. Bitte dort ergänzen.`,
      );
    }
    // Nur einen Marker einsetzen, der im Quellenverzeichnis (noch) vorkommt
    const marker = quellenListe.some((q) => `[Q${q.nr}]` === quelle) ? quelle : "";
    const satz = vorlageFuellen(v, { status, quelle: marker }, leseWerte(), ui);
    const neu = bausteinEinfuegen(text, satz, prefix ? "kennsatz" : v.position, kennsatzPrefixe);
    const ende = neu.start + satz.length;
    markieren.current = erstePlatzhalterstelle(neu.text, neu.start, ende) ?? [ende, ende];
    // Fehlt ein Teil des Pfades oder ist er null (z. B. „analyse“ in einer abweichenden Datei), stellt die Rücknahme
    // genau diesen Zustand wieder her
    const m = kx.aktuell();
    const leer = segs.findIndex((_, i) => holeWert(m, segs.slice(0, i + 1)) == null);
    const leerAb = leer >= 0 ? { index: leer, wert: holeWert(m, segs.slice(0, leer + 1)) as undefined | null } : undefined;
    verlauf.merken(schluessel, { vorherRoh: holeWert(m, segs), nachher: neu.text, ...(leerAb ? { leerAb } : {}) });
    kx.setze(segs, neu.text);
    melden(`„${v.label}“ eingefügt. Offene Stellen ⟦…⟧ bitte ausfüllen oder streichen.`);
  };

  const liste = verlauf.liste(schluessel);
  const letzte = liste[liste.length - 1];
  const ruecknahmeMoeglich = !!letzte && wert === letzte.nachher;
  const RUECKNAHME_GESPERRT = "Text wurde seit der Einfügung geändert; die Rücknahme ist deshalb gesperrt.";
  const zuruecknehmen = () => {
    if (doppelt("ruecknahme")) return;
    if (!ruecknahmeMoeglich) return melden(RUECKNAHME_GESPERRT);
    const e = verlauf.entnehmen(schluessel);
    if (!e) return;
    if (e.leerAb?.wert === null) kx.setze(segs.slice(0, e.leerAb.index + 1), null);
    else if (e.leerAb) {
      // Den zuvor fehlenden Teil des Pfades wieder entfernen, damit die Meldung exakt wie vorher ist
      const elternPfad = segs.slice(0, e.leerAb.index);
      const eltern = holeWert(kx.aktuell(), elternPfad);
      const kopie: any = Array.isArray(eltern) ? [...eltern] : { ...eltern };
      delete kopie[segs[e.leerAb.index] as any];
      kx.setze(elternPfad, kopie);
    } else kx.setze(segs, e.vorherRoh);
    const zurueck = String(e.vorherRoh ?? "");
    markieren.current = [zurueck.length, zurueck.length];
    melden("Einfügung zurückgenommen.");
  };

  const brauchtStatus = vorlagen.some((v) => v.status_auswahl?.length);
  const statusListe = [...new Set(vorlagen.flatMap((v) => v.status_auswahl || []))];
  const quellenListe = r.quellen ? parseQuellen(holeWert(kx.aktuell(), r.quellen)) : [];
  const brauchtQuelle = quellenListe.length > 0 && vorlagen.some((v) => v.vorlage.includes(QUELLEN_PLATZHALTER));
  const hinweisId = (v: FeldhilfeVorlage) => `${basisId}-${v.id}`;

  return (
    <details className="eingabehilfen">
      <summary>
        LEAD-Eingabehilfen<span className="sr-only">: {name}</span>
      </summary>
      <p className="hinweis">
        Fügt einen Satzanfang nach den LEAD-Regeln mit offenen Stellen ⟦…⟧ ein. Freie Formulierung bleibt möglich; offene Stellen bitte ausfüllen oder
        streichen.
      </p>
      {(brauchtStatus || brauchtQuelle) && (
        <div className="eingabehilfen-wahl">
          {brauchtStatus && (
            <label className="feld">
              <span className="feld-label">Status für {STATUS_PLATZHALTER}</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={`Status für ${STATUS_PLATZHALTER}: ${name}`}>
                <option value="">offen lassen</option>
                {statusListe.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
          {brauchtQuelle && (
            <label className="feld">
              <span className="feld-label">Quelle für {QUELLEN_PLATZHALTER}</span>
              <select value={quelle} onChange={(e) => setQuelle(e.target.value)} aria-label={`Quelle für ${QUELLEN_PLATZHALTER}: ${name}`}>
                <option value="">offen lassen</option>
                {quellenListe.map((q) => (
                  <option key={q.nr} value={`[Q${q.nr}]`}>
                    {q.text.length > 80 ? q.text.slice(0, 79) + "…" : q.text}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      <ul className="eingabehilfen-liste">
        {vorlagen.map((v) => {
          const grund = vorlageGesperrt(v, werte);
          const hinweis = grund || v.hinweis;
          return (
            <li key={v.id}>
              <button
                type="button"
                className="knopf leise klein"
                aria-label={`${v.label} einfügen in ${name}`}
                aria-describedby={hinweis ? hinweisId(v) : undefined}
                aria-disabled={grund ? true : undefined}
                onClick={() => einfuegen(v)}
              >
                {v.label}
              </button>
              {hinweis && (
                <span id={hinweisId(v)} className="hinweis">
                  {hinweis}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {letzte && (
        <div className="eingabehilfen-ruecknahme">
          <button
            type="button"
            className="knopf leise klein"
            aria-label={`Einfügung rückgängig: ${name}`}
            aria-describedby={ruecknahmeMoeglich ? undefined : `${basisId}-ruecknahme`}
            aria-disabled={ruecknahmeMoeglich ? undefined : true}
            onClick={zuruecknehmen}
          >
            Einfügung rückgängig
          </button>
          {!ruecknahmeMoeglich && (
            <span id={`${basisId}-ruecknahme`} className="hinweis">
              {RUECKNAHME_GESPERRT}
            </span>
          )}
        </div>
      )}
      <p className="eingabehilfen-meldung" role="status" aria-live="polite">
        {meldung}
      </p>
    </details>
  );
}
