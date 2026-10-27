// Reiter „Kopiervorlage“ des Lagebilds (seit 0.6.5, TP-2026-W44-17 aus Lagebild.tsx): je Sachverhalt ein Block mit
// Tabellenlayout für Word, nach Schwere der Beurteilung sortiert.

import { useMemo } from "react";
import type { Profil } from "../../kern/typen";
import { kennsatz, kennsaetzeAlle } from "../../kern/kennsaetze";
import { svKennung, type SvEintrag } from "../../lagebild/lagebild";
import { kopiervorlageHtml, kopiervorlageText } from "../../lagebild/ausgabe";
import { radarPng } from "../radarBild";
import { KopierKnopf } from "./bausteine";

export function Kopiervorlage({ profil, sortiert }: { profil: Profil; sortiert: SvEintrag[] }) {
  const ks = profil.ui.kennsaetze || {};
  // Radarbilder (Canvas) und HTML nur bei geänderten Sachverhalten neu erzeugen, nicht bei jedem Zeichnen (seit 0.6.5, TP-2026-W44-18)
  const bloecke = useMemo(
    () => sortiert.map((s) => ({ s, html: kopiervorlageHtml(s, profil, radarPng), text: kopiervorlageText(s, profil) })),
    [sortiert, profil],
  );
  return (
    <>
      <div className="lb-leiste">
        <p className="hinweis">
          Jeden Block mit „Kopieren“ übernehmen und in Word einfügen; Tabellenlayout und Schrift (Arial 10 pt) bleiben erhalten. Reihenfolge nach Schwere der
          Beurteilung.
        </p>
        <KopierKnopf
          titel="Alle kopieren"
          html={bloecke.map((b) => b.html).join("<p>&nbsp;</p>")}
          text={bloecke.map((b) => b.text).join("\n\n――――――――――\n\n")}
        />
      </div>
      {bloecke.map(({ s, html, text }) => {
        const fristen = kennsaetzeAlle(s.bewertungText, ks.handlungsrelevant);
        const hb = fristen.length ? fristen.join("; ") : null;
        const abs = ks.abschluss ? kennsatz(s.bewertungText, ks.abschluss) : null;
        return (
          <div key={`${s.eintrag.id}-${s.index}`} className="lb-vorlage">
            <div className="lb-vorlage-kopf">
              <span>
                {svKennung(s, profil)} · {s.beurteilung || "keine Angabe"}
                {hb !== null ? ` · handlungsrelevant bis ${hb}` : ""}
                {abs !== null ? " · Abschluss vermerkt" : ""}
              </span>
              <KopierKnopf html={html} text={text} was={svKennung(s, profil)} />
            </div>
            <div
              className="lb-vorlage-inhalt"
              tabIndex={0}
              role="group"
              aria-label={`Vorlage: ${svKennung(s, profil)}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        );
      })}
    </>
  );
}
