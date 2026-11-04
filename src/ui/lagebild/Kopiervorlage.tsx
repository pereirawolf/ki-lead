// Reiter „Kopiervorlage“ des Lagebilds (seit 0.6.5, TP-2026-W44-17 aus Lagebild.tsx): je Sachverhalt ein Block mit
// Tabellenlayout für Word, nach Schwere der Beurteilung sortiert. Seit UX-2026-W45-23 sind die Blöcke eingeklappt
// (Kopfzeile, „Kopieren“, Vorschau bei Bedarf) und lassen sich zum gemeinsamen Kopieren auswählen.

import { useMemo, useState } from "react";
import type { Profil } from "../../kern/typen";
import { kennsatz, kennsaetzeAlle } from "../../kern/kennsaetze";
import { svKennung, type SvEintrag } from "../../lagebild/lagebild";
import { kopiervorlageHtml, kopiervorlageText } from "../../lagebild/ausgabe";
import { radarPng } from "../radarBild";
import { KopierKnopf } from "./bausteine";

const TRENNER_HTML = "<p>&nbsp;</p>";
const TRENNER_TEXT = "\n\n――――――――――\n\n";

export function Kopiervorlage({ profil, sortiert }: { profil: Profil; sortiert: SvEintrag[] }) {
  const ks = profil.ui.kennsaetze || {};
  // Radarbilder (Canvas) und HTML nur bei geänderten Sachverhalten neu erzeugen, nicht bei jedem Zeichnen (seit 0.6.5, TP-2026-W44-18)
  const bloecke = useMemo(
    () =>
      sortiert.map((s) => ({ s, schluessel: `${s.eintrag.id}-${s.index}`, html: kopiervorlageHtml(s, profil, radarPng), text: kopiervorlageText(s, profil) })),
    [sortiert, profil],
  );
  const [auswahl, setAuswahl] = useState<ReadonlySet<string>>(() => new Set());
  const gewaehlt = bloecke.filter((b) => auswahl.has(b.schluessel));
  const umschalten = (k: string, an: boolean) =>
    setAuswahl((alt) => {
      const neu = new Set(alt);
      if (an) neu.add(k);
      else neu.delete(k);
      return neu;
    });

  return (
    <>
      <div className="lb-leiste">
        <p className="hinweis">
          Blöcke mit „Kopieren“ einzeln übernehmen oder ankreuzen und gemeinsam kopieren, dann in Word einfügen; Tabellenlayout und Schrift (Arial 10 pt)
          bleiben erhalten. Reihenfolge nach Schwere der Beurteilung.
        </p>
        <div className="werkzeugleiste-knoepfe">
          {gewaehlt.length ? (
            <KopierKnopf
              titel={`Auswahl kopieren (${gewaehlt.length})`}
              html={gewaehlt.map((b) => b.html).join(TRENNER_HTML)}
              text={gewaehlt.map((b) => b.text).join(TRENNER_TEXT)}
            />
          ) : (
            <button type="button" className="knopf klein" disabled>
              Auswahl kopieren (0)
            </button>
          )}
          <KopierKnopf titel="Alle kopieren" html={bloecke.map((b) => b.html).join(TRENNER_HTML)} text={bloecke.map((b) => b.text).join(TRENNER_TEXT)} />
        </div>
      </div>
      {bloecke.map(({ s, schluessel, html, text }) => {
        const fristen = kennsaetzeAlle(s.bewertungText, ks.handlungsrelevant);
        const abs = ks.abschluss ? kennsatz(s.bewertungText, ks.abschluss) : null;
        const name = svKennung(s, profil);
        return (
          <div key={schluessel} className={auswahl.has(schluessel) ? "lb-vorlage lb-vorlage-gewaehlt" : "lb-vorlage"}>
            <div className="lb-vorlage-kopf">
              <input
                type="checkbox"
                checked={auswahl.has(schluessel)}
                aria-label={`Auswählen: ${name}`}
                onChange={(e) => umschalten(schluessel, e.target.checked)}
              />
              <span>
                {name} · {s.beurteilung || "keine Angabe"}
                {fristen.length ? ` · handlungsrelevant bis ${fristen.join("; ")}` : ""}
                {abs !== null ? " · Abschluss vermerkt" : ""}
              </span>
              <KopierKnopf html={html} text={text} was={name} />
            </div>
            <details className="lb-vorlage-vorschau">
              <summary>Vorschau</summary>
              <div className="lb-vorlage-inhalt" tabIndex={0} role="group" aria-label={`Vorlage: ${name}`} dangerouslySetInnerHTML={{ __html: html }} />
            </details>
          </div>
        );
      })}
    </>
  );
}
