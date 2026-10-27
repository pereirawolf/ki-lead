// Eingabefeld mit Beschriftung und Hilfetext (seit 0.6.5, TP-2026-W44-17; bis 0.6.4 nur in der KI-Erfassung).
// Gemeinsam für die KI-Erfassung, die Grenzfelder der Recherchetiefe und die Eingabefelder der Meldungsmaske (Feld.tsx).

import { useId, type ReactNode } from "react";

export interface HilfeFeldEingabe {
  id: string;
  "aria-describedby"?: string;
}

/**
 * Der Hilfetext ist per aria-describedby verknüpft, nicht Teil des zugänglichen Namens; ein bedingter Zusatz wird mit
 * verknüpft. In der KI-Erfassung und den Einstellungen steht er zwischen Beschriftung und Eingabe, in der
 * Meldungsmaske wie bisher unter der Eingabe (`hilfeNach`).
 */
export function HilfeFeld({
  label,
  hilfe,
  hilfeNach,
  zusatz,
  nach,
  weitere,
  lang,
  pflicht,
  id: vorgabeId,
  children,
}: {
  label: string;
  /** Hilfetext; ohne Angabe entfällt er */
  hilfe?: string;
  /** Hilfetext unter der Eingabe statt darüber (Meldungsmaske) */
  hilfeNach?: boolean;
  zusatz?: string;
  /** Unter der Eingabe (und einem Hilfetext darunter), z. B. ein Fehlertext */
  nach?: ReactNode;
  /** Weitere Kennungen für aria-describedby (Elemente, die das Feld selbst mitbringt) */
  weitere?: (string | false | undefined)[];
  lang?: boolean;
  /** Pflichtfeld: Kennzeichen an der Beschriftung */
  pflicht?: boolean;
  /** Feste Kennung der Eingabe (sonst useId) */
  id?: string;
  children: (a: HilfeFeldEingabe) => ReactNode;
}) {
  const eigeneId = useId();
  const id = vorgabeId ?? eigeneId;
  const beschreibung = [hilfe ? `${id}-hilfe` : "", ...(weitere ?? []), zusatz ? `${id}-zusatz` : ""].filter(Boolean).join(" ");
  const hilfetext = hilfe ? (
    <p className={hilfeNach ? "hinweis" : "hinweis feld-hilfe"} id={`${id}-hilfe`}>
      {hilfe}
    </p>
  ) : null;
  return (
    <div className={lang ? "feld feld-lang" : "feld"}>
      <label className={pflicht ? "feld-label pflicht" : "feld-label"} htmlFor={id}>
        {label}
      </label>
      {!hilfeNach && hilfetext}
      {children({ id, ...(beschreibung ? { "aria-describedby": beschreibung } : {}) })}
      {hilfeNach && hilfetext}
      {nach}
      {zusatz && (
        <p className="kasten kasten-hinweis feld-zusatz" id={`${id}-zusatz`} role="status">
          {zusatz}
        </p>
      )}
    </div>
  );
}
