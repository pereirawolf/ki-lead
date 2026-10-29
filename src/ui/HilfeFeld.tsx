// Eingabefeld mit Beschriftung und Hilfetext (seit 0.6.5, TP-2026-W44-17; bis 0.6.4 nur in der KI-Erfassung).
// Gemeinsam für die KI-Erfassung, die Grenzfelder der Recherchetiefe und die Eingabefelder der Meldungsmaske (Feld.tsx).

import { useId, type ReactNode } from "react";

export interface HilfeFeldEingabe {
  id: string;
  "aria-describedby"?: string;
  /** gesetzt, wenn das Feld Befunde hat (seit 0.6.5, TP-2026-W44-15) */
  "aria-invalid"?: true;
}

/**
 * Der Hilfetext ist per aria-describedby verknüpft, nicht Teil des zugänglichen Namens; ein bedingter Zusatz wird mit
 * verknüpft. In der KI-Erfassung und den Einstellungen steht er zwischen Beschriftung und Eingabe, in der
 * Meldungsmaske wie bisher unter der Eingabe (`hilfeNach`). Mit `fehler` trägt die Eingabe aria-invalid, und der
 * Fehlertext steht unter ihr, verknüpft über `${id}-fehler` (seit 0.6.5, TP-2026-W44-15).
 */
export function HilfeFeld({
  label,
  hilfe,
  hilfeNach,
  zusatz,
  fehler,
  nach,
  weitere,
  lang,
  pflicht,
  id: vorgabeId,
  feld,
  children,
}: {
  label: string;
  /** Hilfetext; ohne Angabe entfällt er */
  hilfe?: string;
  /** Hilfetext unter der Eingabe statt darüber (Meldungsmaske) */
  hilfeNach?: boolean;
  zusatz?: string;
  /** Befunde am Feld (Schema- und Pflichtprüfung) */
  fehler?: string[];
  /** Unter der Eingabe (und einem Hilfetext darunter), z. B. ein Fehlertext */
  nach?: ReactNode;
  /** Weitere Kennungen für aria-describedby (Elemente, die das Feld selbst mitbringt) */
  weitere?: (string | false | undefined)[];
  lang?: boolean;
  /** Pflichtfeld: Kennzeichen an der Beschriftung */
  pflicht?: boolean;
  /** Feste Kennung der Eingabe (sonst useId) */
  id?: string;
  /** Schlüssel des Feldes in der Meldung (data-feld), Ziel der Sprünge aus dem Prüfschritt (seit 0.6.5) */
  feld?: string;
  children: (a: HilfeFeldEingabe) => ReactNode;
}) {
  const eigeneId = useId();
  const id = vorgabeId ?? eigeneId;
  const mitFehler = !!fehler?.length;
  const beschreibung = [hilfe ? `${id}-hilfe` : "", ...(weitere ?? []), zusatz ? `${id}-zusatz` : "", mitFehler ? `${id}-fehler` : ""]
    .filter(Boolean)
    .join(" ");
  const hilfetext = hilfe ? (
    <p className={hilfeNach ? "hinweis" : "hinweis feld-hilfe"} id={`${id}-hilfe`}>
      {hilfe}
    </p>
  ) : null;
  return (
    <div className={lang ? "feld feld-lang" : "feld"} data-feld={feld}>
      <label className={pflicht ? "feld-label pflicht" : "feld-label"} htmlFor={id}>
        {label}
      </label>
      {!hilfeNach && hilfetext}
      {children({ id, ...(beschreibung ? { "aria-describedby": beschreibung } : {}), ...(mitFehler ? { "aria-invalid": true as const } : {}) })}
      {mitFehler && <FeldFehler id={`${id}-fehler`} texte={fehler} />}
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

/** Befunde eines Feldes, per Kennung mit der Eingabe verknüpft (seit 0.6.5, TP-2026-W44-15) */
export function FeldFehler({ id, texte }: { id: string; texte: string[] }) {
  return (
    <p className="fehlertext feld-fehler" id={id}>
      {texte.join(" ")}
    </p>
  );
}
