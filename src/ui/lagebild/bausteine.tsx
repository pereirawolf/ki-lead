// Bausteine der Lagebild-Ansicht (seit 0.6.5, TP-2026-W44-17 aus Lagebild.tsx): Marken, Kopierknopf, Abschnitt und
// Befundpunkt des Redaktionschecks. Unverändert übernommen; die Marken einer Meldung und eines Sachverhalts sind jetzt
// Komponenten statt Hilfsfunktionen der Ansicht.

import { useState, type ReactNode } from "react";
import type { Profil } from "../../kern/typen";
import { holeWert } from "../../kern/pfad";
import {
  farbeBeurteilung,
  farbeTendenz,
  herkunftsrolleAnzeige,
  herkunftsrolleVon,
  statusVon,
  type Farbe,
  type LagebildEintrag,
  type SvEintrag,
} from "../../lagebild/lagebild";
import type { Klasse } from "../../lagebild/redaktion";

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

export function Abschnitt({ nr, id, titel, verweis, children }: { nr: number; id?: string; titel: string; verweis?: string; children: ReactNode }) {
  return (
    <section className="lb-abschnitt" id={id} tabIndex={-1}>
      <h3 className="abschnitt">
        {nr} · {titel}
        {verweis && <span className="lb-verweis"> ({verweis})</span>}
      </h3>
      {children}
    </section>
  );
}

export const EINSTUFUNG: Record<Klasse, string> = { alert: "zeitkritisch", warn: "zu klären", info: "Information", ok: "ohne Befund" };

export function Punkt({
  klasse,
  einstufung,
  marke,
  titel,
  aktion,
  children,
}: {
  klasse: Klasse | "";
  /** Text der Einstufung für Screenreader, wenn er von der Farbklasse abweicht */
  einstufung?: string;
  marke?: string;
  titel: string;
  aktion?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`lb-punkt lb-punkt-${klasse || "leer"}`}>
      {marke && (
        <span className={`lb-flag lb-flag-${klasse || "info"}`}>
          {klasse && <span className="sr-only">{einstufung || EINSTUFUNG[klasse]}: </span>}
          {marke}
        </span>
      )}
      <p className="lb-punkt-titel">{titel}</p>
      {children && <div className="lb-punkt-text">{children}</div>}
      {aktion}
    </div>
  );
}

/** Marken einer Meldung: Schema, Migration, eigene Meldung, Entwurf, KI-Entwurf; seit 0.6.13 Herkunft (Rolle „herkunft“) */
export function Marken({ e, profil, eigen }: { e: LagebildEintrag; profil: Profil; eigen: boolean }) {
  const r = profil.ui.rollen;
  return (
    <>
      {e.fremd && e.fremdGeprueft ? (
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
      ) : (
        <Marke farbe="gruen">Schema ✓</Marke>
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
