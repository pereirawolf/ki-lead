// Bausteine der Lagebild-Ansicht (seit 0.6.5, TP-2026-W44-17 aus Lagebild.tsx): Marken, Kopierknopf, Abschnitt und
// Befundpunkt des Redaktionschecks. Unverändert übernommen; die Marken einer Meldung und eines Sachverhalts sind jetzt
// Komponenten statt Hilfsfunktionen der Ansicht.

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Profil } from "../../kern/typen";
import { holeWert } from "../../kern/pfad";
import {
  absenderTeile,
  farbeBeurteilung,
  farbeTendenz,
  herkunftsrolleAnzeige,
  herkunftsrolleVon,
  statusVon,
  type Farbe,
  type LagebildEintrag,
  type SvEintrag,
} from "../../lagebild/lagebild";
import { bearbeitungText, type Bearbeitung, type Klasse } from "../../lagebild/redaktion";

/** Absender in Überschriften: Land/Bund, darunter bzw. daneben der volle Name klein und einzeilig (seit UX-2026-W45-04) */
export function Absender({ e, profil, zeile = false }: { e: LagebildEintrag; profil: Profil; zeile?: boolean }) {
  const { kurz, zusatz } = absenderTeile(e, profil);
  return (
    <span className={zeile ? "lb-absender lb-absender-zeile" : "lb-absender"}>
      <span className="lb-absender-kurz">{kurz}</span>
      {zusatz && (
        <span className="lb-absender-voll" title={zusatz}>
          {zusatz}
        </span>
      )}
    </span>
  );
}

/** Überschrift eines Sachverhalts: Bezeichnung, darunter der Absender (seit UX-2026-W45-04) */
export function SvTitel({ s, profil }: { s: SvEintrag; profil: Profil }) {
  return (
    <span className="lb-svtitel">
      <span className="lb-svtitel-name">{s.bezeichnung || `Sachverhalt ${s.index + 1}`}</span>
      <Absender e={s.eintrag} profil={profil} zeile />
    </span>
  );
}

export function Marke({ farbe, children }: { farbe: Farbe | "amt"; children: ReactNode }) {
  return <span className={`lb-marke lb-${farbe}`}>{children}</span>;
}

async function kopieren(htmlText: string, klartext: string): Promise<boolean> {
  try {
    if (navigator.clipboard && "ClipboardItem" in window) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([`<html><body>${htmlText}</body></html>`], { type: "text/html" }),
          "text/plain": new Blob([klartext], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(klartext);
    return true;
  } catch {
    return false;
  }
}

/** `was`: Gegenstand des Kopierens für den zugänglichen Namen, wenn mehrere Knöpfe nebeneinanderstehen (seit 0.6.5, TP-2026-W44-14) */
export function KopierKnopf({ html, text, titel = "Kopieren", was }: { html: string; text: string; titel?: string; was?: string }) {
  const [stand, setStand] = useState<"" | "ok" | "fehler">("");
  const anzeige = stand === "ok" ? "Kopiert" : stand === "fehler" ? "Kopieren nicht möglich – bitte markieren" : titel;
  return (
    <button
      type="button"
      className={stand === "ok" ? "knopf klein lb-kopiert" : "knopf klein"}
      aria-label={was ? `${anzeige}: ${was}` : undefined}
      onClick={async () => {
        setStand((await kopieren(html, text)) ? "ok" : "fehler");
        setTimeout(() => setStand(""), 2000);
      }}
    >
      {anzeige}
    </button>
  );
}

/** Abschnitt des Redaktionschecks; aufklappbar, ohne Befund eingeklappt zu einer Zeile (seit UX-2026-W45-20) */
export function Abschnitt({
  nr,
  id,
  titel,
  verweis,
  anzahl,
  children,
}: {
  nr: number;
  id?: string;
  titel: string;
  verweis?: string;
  /** Befunde des Abschnitts (alle Einstufungen); ohne Angabe immer offen */
  anzahl?: number;
  children: ReactNode;
}) {
  return (
    <section className="lb-abschnitt" id={id} tabIndex={-1}>
      <details open={anzahl === undefined || anzahl > 0}>
        <summary>
          <h3 className="abschnitt">
            {nr} · {titel}
            {verweis && <span className="lb-verweis"> ({verweis})</span>}
            {anzahl !== undefined && <span className="lb-abschnitt-zahl">{anzahl ? ` · ${anzahl} Befund${anzahl === 1 ? "" : "e"}` : " · ohne Befund"}</span>}
          </h3>
        </summary>
        {children}
      </details>
    </section>
  );
}

export const EINSTUFUNG: Record<Klasse, string> = { alert: "zeitkritisch", warn: "zu klären", info: "Information", ok: "ohne Befund" };

/**
 * Bearbeitungsstand der Befunde im Redaktionscheck (seit UX-2026-W45-19): Ein Punkt mit Schlüssel und Einstufung
 * zeitkritisch oder zu klären bietet „Erledigt“ und „Bewusst belassen“ (Begründung freiwillig) an.
 */
export interface BearbeitungKontextWert {
  bearbeitung: Record<string, Bearbeitung>;
  setzen: (schluessel: string, b: Bearbeitung | null) => void;
  zone: string;
  /** Sichtbare Einstufungen (UX-2026-W45-21); leer = alle */
  einstufungen?: ReadonlySet<"alert" | "warn" | "info">;
  bearbeiteteAusblenden?: boolean;
}

export const BearbeitungKontext = createContext<BearbeitungKontextWert | null>(null);

function Bearbeiten({ schluessel, titel }: { schluessel: string; titel: string }) {
  const k = useContext(BearbeitungKontext)!;
  const [grundOffen, setGrundOffen] = useState(false);
  const [grund, setGrund] = useState("");
  const stand = k.bearbeitung[schluessel];
  if (stand)
    return (
      <div className="lb-bearbeitung">
        <span className={`lb-marke lb-${stand.status === "erledigt" ? "gruen" : "grau"}`}>{bearbeitungText(stand, k.zone)}</span>
        <button type="button" className="knopf leise klein" aria-label={`Bearbeitungsstand zurücksetzen: ${titel}`} onClick={() => k.setzen(schluessel, null)}>
          Zurücksetzen
        </button>
      </div>
    );
  if (grundOffen)
    return (
      <form
        className="lb-bearbeitung"
        onSubmit={(e) => {
          e.preventDefault();
          k.setzen(schluessel, { status: "belassen", ...(grund.trim() ? { begruendung: grund.trim() } : {}), am: new Date().toISOString() });
          setGrundOffen(false);
        }}
      >
        <label className="lb-bearbeitung-grund">
          <span>Begründung (freiwillig)</span>
          <input type="text" value={grund} maxLength={300} onChange={(e) => setGrund(e.target.value)} autoFocus />
        </label>
        <button type="submit" className="knopf klein">
          Bewusst belassen
        </button>
        <button type="button" className="knopf leise klein" onClick={() => setGrundOffen(false)}>
          Abbrechen
        </button>
      </form>
    );
  return (
    <div className="lb-bearbeitung">
      <button
        type="button"
        className="knopf klein"
        aria-label={`Erledigt: ${titel}`}
        onClick={() => k.setzen(schluessel, { status: "erledigt", am: new Date().toISOString() })}
      >
        Erledigt
      </button>
      <button type="button" className="knopf leise klein" aria-label={`Bewusst belassen: ${titel}`} onClick={() => setGrundOffen(true)}>
        Bewusst belassen …
      </button>
    </div>
  );
}

export function Punkt({
  klasse,
  einstufung,
  marke,
  titel,
  aktion,
  schluessel,
  name,
  stufe: stufeVorgabe,
  kuerzen = true,
  children,
}: {
  klasse: Klasse | "";
  /** Text der Einstufung für Screenreader, wenn er von der Farbklasse abweicht */
  einstufung?: string;
  marke?: string;
  titel: ReactNode;
  aktion?: ReactNode;
  /** Schlüssel für den Bearbeitungsstand (UX-2026-W45-19) */
  schluessel?: string;
  /** Gegenstand in Worten für zugängliche Namen der Knöpfe */
  name?: string;
  /** Einstufung für Filter und Zählung, wenn sie von der Farbklasse abweicht (Schemaabweichung: rot, aber zu klären) */
  stufe?: "alert" | "warn" | "info";
  /** Text auf zwei Zeilen kürzen, mit „mehr“, wenn er länger ist (UX-2026-W45-20); aus bei Tabellen */
  kuerzen?: boolean;
  children?: ReactNode;
}) {
  const k = useContext(BearbeitungKontext);
  const [auf, setAuf] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const [ueberlauf, setUeberlauf] = useState(false);
  useLayoutEffect(() => {
    const el = textRef.current;
    if (el && kuerzen && !auf) setUeberlauf(el.scrollHeight > el.clientHeight + 1);
  });
  const stand = schluessel && k ? k.bearbeitung[schluessel] : undefined;
  const bearbeitbar = !!(schluessel && k && (klasse === "alert" || klasse === "warn"));
  // Filter nach Einstufung und Bearbeitung (UX-2026-W45-21)
  const stufe = stufeVorgabe ?? (klasse === "alert" || klasse === "warn" ? klasse : "info");
  if (k?.einstufungen?.size && !k.einstufungen.has(stufe)) return null;
  if (k?.bearbeiteteAusblenden && stand) return null;
  const titelText = name ?? (typeof titel === "string" ? titel : "Befund");
  // Bearbeitete Befunde zeigen nur Kopf und Stand (UX-2026-W45-20)
  const zeigeText = !!children && (!stand || auf);
  return (
    <div className={`lb-punkt lb-punkt-${klasse || "leer"}${stand ? " lb-punkt-bearbeitet" : ""}`}>
      {marke && (
        <span className={`lb-flag lb-flag-${klasse || "info"}`}>
          {klasse && <span className="sr-only">{einstufung || EINSTUFUNG[klasse]}: </span>}
          {marke}
        </span>
      )}
      <p className="lb-punkt-titel">{titel}</p>
      {zeigeText && (
        <div ref={textRef} className={kuerzen && !auf ? "lb-punkt-text lb-punkt-gekuerzt" : "lb-punkt-text"}>
          {children}
        </div>
      )}
      {!!children && ((kuerzen && (ueberlauf || auf)) || stand) && (
        <button type="button" className="lb-mehr-knopf" aria-expanded={zeigeText && (auf || !kuerzen)} onClick={() => setAuf((a) => !a)}>
          {auf ? "weniger" : stand ? "Text zeigen" : "mehr"}
        </button>
      )}
      {(aktion || bearbeitbar) && (
        <div className="lb-punkt-aktionen">
          {aktion}
          {bearbeitbar && <Bearbeiten schluessel={schluessel!} titel={titelText} />}
        </div>
      )}
    </div>
  );
}

/** Marken einer Meldung: Schema (nur bei Abweichung oder fremdem Schema), Migration, eigene Meldung, Entwurf, KI-Entwurf; seit 0.6.13 Herkunft (Rolle „herkunft“) */
export function Marken({ e, profil, eigen }: { e: LagebildEintrag; profil: Profil; eigen: boolean }) {
  const r = profil.ui.rollen;
  return (
    <>
      {
        e.fremd && e.fremdGeprueft ? (
          // Seit 0.6.19 (TP-2026-W44-59): geprüft gegen das Schema aus „meldung.eingang_schemata“
          e.schema.length ? (
            <Marke farbe="rot">fremdes Schema: {e.schema.length}</Marke>
          ) : (
            <Marke farbe="gruen">fremdes Schema ✓</Marke>
          )
        ) : e.fremd ? (
          <Marke farbe="grau">fremdes Schema</Marke>
        ) : e.schema.length ? (
          <Marke farbe="rot">Schema: {e.schema.length}</Marke>
        ) : null /* ohne Abweichung keine Marke (seit UX-2026-W45-11) */
      }
      {e.referenzen?.some((b) => b.stufe === "fehler") && (
        // seit 0.7.0 (UP-2026-W45-02): Prüfebene 2 bei LEAD-Meldung-v2
        <Marke farbe="rot">Referenzen: {e.referenzen.filter((b) => b.stufe === "fehler").length}</Marke>
      )}
      {e.hinweise.length > 0 && <Marke farbe="orange">migriert</Marke>}
      {eigen && <Marke farbe="amt">eigene Meldung</Marke>}
      {!e.fremd && statusVon(e, profil) === r.status_entwurf && <Marke farbe="gelb">{r.status_entwurf}</Marke>}
      {r.entstehung_feld && holeWert(e.daten, [r.entstehung_feld, "verfahren"]) === "KI-Entwurf" && <Marke farbe="grau">KI-Entwurf</Marke>}
      {r.herkunft && <Marke farbe="amt">Herkunft: {herkunftsrolleAnzeige(profil, herkunftsrolleVon(e, profil))}</Marke>}
    </>
  );
}

/** Beurteilung und Tendenz eines Sachverhalts als Marken */
export function SvMarken({ s, profil }: { s: SvEintrag; profil: Profil }) {
  const r = profil.ui.rollen;
  return (
    <span className="lb-svmarken">
      {r.sv_beurteilung && <Marke farbe={farbeBeurteilung(profil, s.beurteilung)}>{s.beurteilung || "keine Angabe"}</Marke>}
      {r.sv_tendenz && <Marke farbe={farbeTendenz(profil, s.tendenz)}>{s.tendenz || "keine Angabe"}</Marke>}
    </span>
  );
}
