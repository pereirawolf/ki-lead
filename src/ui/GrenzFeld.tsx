// Eingabefeld für einen Wert der Recherchetiefe (Websuchen, ganz gelesene Seiten, Lesemenge je Seite) mit
// verknüpftem Hilfetext, Umrechnung, Vermerk zur Wirkung je Anbieter und Prüfung getippter Werte. Seit 0.5.19 unter
// „Einstellungen → Recherche & Grenzen“ (KP-2026-W43-70 bis -76), seit 0.5.22 auch in der Wahl je Lauf der KI-Erfassung.

import { useEffect, useId, useState } from "react";
import { lesemengeText, pruefeEingabe, RECHERCHE_GRENZEN, type RechercheFeld } from "../pipeline/recherchetiefe";

export const RECHERCHE_FELDER: { feld: RechercheFeld; label: string; hilfe: string }[] = [
  {
    feld: "websucheMax",
    label: "Websuchen je Recherche (höchstens)",
    hilfe:
      "Wie oft die KI wie in einer Suchmaschine nach Quellen suchen darf. Ist die Zahl erreicht, arbeitet sie mit dem Gefundenen weiter. 0: keine Websuche.",
  },
  {
    feld: "abrufMax",
    label: "Seiten vollständig lesen je Recherche (höchstens)",
    hilfe:
      "Wie viele Webseiten die KI ganz öffnen darf, aus den Suchtreffern oder aus dem Auftrag. Ohne Seitenabruf kennt sie nur die Kurzauszüge der Trefferliste. 0: Es wird keine Seite geöffnet, auch keine im Auftrag genannte.",
  },
  {
    feld: "abrufMaxTokens",
    label: "Lesemenge je Seite (höchstens, in Token)",
    hilfe:
      "Längere Seiten liest die KI nur bis hierhin; was danach steht, sieht sie nicht. Zu knapp schneidet Tabellen oder Anhänge am Ende ab, zu großzügig erhöht die Kosten.",
  },
];

export function GrenzFeld({
  feld,
  label,
  hilfe,
  vermerk,
  wert,
  setze,
  kuerzenZurueck,
  deaktiviert,
}: {
  feld: RechercheFeld;
  label: string;
  hilfe: string;
  vermerk: string;
  wert: number;
  setze: (wert: number) => void;
  /** Lesemenge, die gilt, wenn „Seiten nie kürzen“ abgewählt wird */
  kuerzenZurueck: number;
  /** Feld ohne Wirkung bei den gewählten Modellen */
  deaktiviert?: boolean;
}) {
  const id = useId();
  const ohneGrenze = feld === "abrufMaxTokens" && wert === 0;
  const [text, setText] = useState(ohneGrenze ? "" : String(wert));
  const [hinweis, setHinweis] = useState<string>();
  useEffect(() => setText(ohneGrenze ? "" : String(wert)), [wert, ohneGrenze]);
  const { min, max } = RECHERCHE_GRENZEN[feld];
  const ids = [`${id}-hilfe`, feld === "abrufMaxTokens" && !ohneGrenze && `${id}-umrechnung`, vermerk && `${id}-vermerk`, hinweis && `${id}-hinweis`]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="feld">
      <label className="feld-label" htmlFor={id}>
        {label}
      </label>
      <p className="hinweis feld-hilfe" id={`${id}-hilfe`}>
        {hilfe}
      </p>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={feld === "abrufMaxTokens" ? 1000 : 1}
        value={text}
        disabled={ohneGrenze || deaktiviert}
        placeholder={ohneGrenze ? "ohne Grenze" : undefined}
        aria-describedby={ids}
        onChange={(ev) => {
          setText(ev.target.value);
          setHinweis(undefined);
          const r = pruefeEingabe(feld, ev.target.value, wert);
          if (r.fertig && r.wert !== wert) setze(r.wert);
        }}
        onBlur={() => {
          if (ohneGrenze) return;
          const r = pruefeEingabe(feld, text, wert);
          if (r.fertig) return;
          setHinweis(r.hinweis);
          setText(String(r.wert));
          if (r.wert !== wert) setze(r.wert);
        }}
      />
      {feld === "abrufMaxTokens" && !ohneGrenze && (
        <p className="hinweis" id={`${id}-umrechnung`}>
          {lesemengeText(wert)}
        </p>
      )}
      {vermerk && (
        <p className="hinweis" id={`${id}-vermerk`}>
          {vermerk}
        </p>
      )}
      {hinweis && (
        <p className="kasten kasten-hinweis feld-zusatz" id={`${id}-hinweis`} role="status">
          {hinweis}
        </p>
      )}
      {feld === "abrufMaxTokens" && (
        <label className="schalter">
          <input
            type="checkbox"
            checked={ohneGrenze}
            disabled={deaktiviert}
            onChange={(ev) => {
              setHinweis(undefined);
              setze(ev.target.checked ? 0 : kuerzenZurueck);
            }}
          />
          <span>
            Seiten nie kürzen
            <span className="hinweis"> Sehr lange Seiten werden vollständig gelesen; das kann einen Lauf deutlich verteuern.</span>
          </span>
        </label>
      )}
    </div>
  );
}
