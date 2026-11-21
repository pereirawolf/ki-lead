// Gebietssuche (seit 0.9.8, Entscheidungen des Herausgebers vom 21.11.2026): Name tippen, Vorschlag aus dem amtlichen
// Gemeindeverzeichnis wählen, der Schlüssel wird gesetzt. Freie Einträge ohne Schlüssel bleiben möglich („Talsperre
// Leibis“, „Saale unterhalb Jena“). Zwei Formen:
// - GebietFeld für Gebiete mit Name und Schlüssel (Widget „gebiet“: Absender, Berichtsraum, Raum eines Sachverhalts);
// - GebietName für Textfelder, die ein Gebiet nur nennen (Widget „gebietsname“: Referenzraum, Raum einer Kennzahl);
//   dort setzt die Auswahl nur den Namen, das Schema bleibt unverändert.
// Bedienung nach dem Muster „Combobox mit Liste“ (WAI-ARIA): Pfeiltasten, Eingabe, Escape; die Liste schließt beim
// Verlassen des Felds. Ruhig und kontrastbasiert (Grunddesign): keine Farbmarken, die gewählte Zeile ist unterlegt.

import { useEffect, useMemo, useState } from "react";
import { kontext, nachName, normSchluessel, suche, type GebietEintrag, type GebietVerzeichnis } from "../kern/gebiete";
import { LAENDER } from "../kern/meldung-v2.js";
import { GEBIETE_KERN, gebieteVermerk, gebieteVoll } from "../pipeline/gebieteDaten";
import type { Profil } from "../kern/typen";

/** Ab so vielen Zeichen sucht die App auch in den Gemeinden (der Teil wird dann einmal geladen) */
const GEMEINDEN_AB = 3;

/** Gebiet, dessen Einträge zuerst kommen: das Land des Profils (Variable „land“), etwa „16“ für Thüringen */
export function vorrangDesProfils(profil: Profil): string | undefined {
  const s = LAENDER[profil.manifest.variablen?.land ?? ""];
  return s && /^\d{2}$/.test(s) ? s : undefined;
}

/** Verzeichnis für die Suche: der Kern sofort, mit Gemeinden ab dem dritten Zeichen */
function useVerzeichnis(text: string): GebietVerzeichnis {
  const [voll, setVoll] = useState<GebietVerzeichnis | null>(null);
  const brauche = text.trim().length >= GEMEINDEN_AB;
  useEffect(() => {
    if (!brauche || voll) return;
    let aktiv = true;
    gebieteVoll()
      .then((v) => aktiv && setVoll(v))
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [brauche, voll]);
  return voll ?? GEBIETE_KERN;
}

interface SucheProps {
  id: string;
  wert: string;
  vorrang?: string;
  onText: (text: string) => void;
  onWahl: (e: GebietEintrag) => void;
  /** aria-describedby der Eingabe */
  beschrieben?: string;
  ungueltig?: boolean;
  platzhalter?: string;
}

/** Eingabe mit Vorschlagsliste */
export function GebietSuche({ id, wert, vorrang, onText, onWahl, beschrieben, ungueltig, platzhalter }: SucheProps) {
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(-1);
  const listeId = `${id}-vorschlaege`;
  const v = useVerzeichnis(offen ? wert : "");
  const treffer = useMemo(() => (offen ? suche(v, wert, { vorrang, max: 10 }) : []), [v, wert, vorrang, offen]);
  const zeigen = offen && treffer.length > 0;
  const waehle = (e: GebietEintrag) => {
    onWahl(e);
    setOffen(false);
    setAktiv(-1);
  };
  return (
    <div className="gebiet-suche">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={zeigen}
        aria-controls={listeId}
        aria-activedescendant={zeigen && aktiv >= 0 ? `${listeId}-${aktiv}` : undefined}
        aria-describedby={beschrieben}
        aria-invalid={ungueltig || undefined}
        placeholder={platzhalter}
        value={wert}
        onChange={(ev) => {
          onText(ev.target.value);
          setOffen(true);
          setAktiv(-1);
        }}
        onFocus={() => wert.trim() && setOffen(true)}
        onBlur={() => setOffen(false)}
        onKeyDown={(ev) => {
          if (ev.key === "ArrowDown") {
            ev.preventDefault();
            setOffen(true);
            setAktiv((i) => Math.min(i + 1, treffer.length - 1));
          } else if (ev.key === "ArrowUp") {
            ev.preventDefault();
            setAktiv((i) => Math.max(i - 1, -1));
          } else if (ev.key === "Enter" && zeigen && aktiv >= 0) {
            ev.preventDefault();
            waehle(treffer[aktiv]!);
          } else if (ev.key === "Escape" && zeigen) {
            ev.preventDefault();
            setOffen(false);
          }
        }}
      />
      <ul id={listeId} role="listbox" className="gebiet-vorschlaege" hidden={!zeigen} aria-label="Gebiete aus dem Gemeindeverzeichnis">
        {treffer.map((e, i) => {
          const k = kontext(v, e);
          return (
            <li
              key={e.schluessel}
              id={`${listeId}-${i}`}
              role="option"
              aria-selected={i === aktiv}
              className={i === aktiv ? "gebiet-vorschlag aktiv" : "gebiet-vorschlag"}
              // vor dem Blur der Eingabe wählen, sonst schließt die Liste zuerst
              onMouseDown={(ev) => {
                ev.preventDefault();
                waehle(e);
              }}
            >
              <span className="gebiet-vorschlag-name">{e.name}</span>
              <span className="gebiet-vorschlag-zusatz">
                {k ? `${k} · ` : ""}
                {e.schluessel}
              </span>
            </li>
          );
        })}
        {/* Quellenangabe der Herausgeber (Vervielfältigung und Verbreitung nur mit Quellenangabe) */}
        <li role="presentation" className="gebiet-quelle">
          Quelle: {gebieteVermerk(v)}
        </li>
      </ul>
    </div>
  );
}

/** Zuordnung eines Schlüssels in Worten, unter dem Feld (leer ohne Schlüssel) */
export function zuordnungText(v: GebietVerzeichnis, name: string, schluessel: string): string {
  const s = normSchluessel(schluessel);
  if (!s) return "";
  if (/^[A-Z]{2}$/.test(s)) return s === "DE" ? "Bundesrepublik Deutschland" : "Staat (ISO 3166-1)";
  const e = v.nach.get(s);
  if (!e) return /^\d+$/.test(s) ? `${s} steht nicht im Gemeindeverzeichnis (Stand ${standDE(v)}).` : "";
  const k = kontext(v, e);
  const anders = name.trim() && nachName(v, name)?.schluessel !== s && e.name !== name.trim();
  return `${e.name}${k ? `, ${k}` : ""}${anders ? ` – der Name „${name.trim()}“ weicht ab` : ""} (Gemeindeverzeichnis, Stand ${standDE(v)})`;
}

const standDE = (v: GebietVerzeichnis) => v.stand.split("-").reverse().join(".");

/** Verzeichnis, das einen Schlüssel kennt: Kern sofort, für Gemeindeschlüssel (8 Stellen) mit Gemeinden */
export function useVerzeichnisFuer(schluessel: string): GebietVerzeichnis {
  return useVerzeichnis(normSchluessel(schluessel).length === 8 ? "xxx" : "");
}
