// Datums- und Zeitfelder mit Schaltflächen „Jetzt“/„Heute“, „Nur Tag“ und „Leeren“.
// Werte im Format „JJJJ-MM-TT“ oder „JJJJ-MM-TTThh:mm“ (Wanduhrzeit der Profilzeitzone).

import type { ChangeEvent } from "react";
import { jetztLokal } from "../kern/ausgabe";
import { verbinde, zerlege, zoneOder, type DatumModus } from "../kern/zeit";

interface Props {
  id: string;
  /** aria-describedby des Tagesfelds (Hinweis und Befunde, seit 0.6.5) */
  beschreibung?: string;
  /** Befunde am Feld: aria-invalid am Tagesfeld (seit 0.6.5, TP-2026-W44-15) */
  ungueltig?: boolean;
  /** Sichtbare Bezeichnung (z. B. „von“) */
  label: string;
  /** Zugänglicher Name, wenn die Bezeichnung allein nicht eindeutig ist (z. B. „Meldezeitraum, von“) */
  name?: string;
  modus: DatumModus;
  wert: unknown;
  zeitzone?: string;
  onChange: (v: string) => void;
}

/** Unfertige Eingabe (z. B. Tag gelöscht, Monat noch offen): Browser melden dann "" – den gespeicherten Wert behalten */
const unfertig = (e: ChangeEvent<HTMLInputElement>) => !e.target.value && !!e.target.validity?.badInput;

export function DatumZeit({ id, beschreibung, ungueltig, label, name, modus, wert, zeitzone, onChange }: Props) {
  const roh = String(wert ?? "");
  const { tag, zeit } = zerlege(roh);
  const n = name || label;
  const mitZeit = modus !== "datum";
  const jetzt = () => jetztLokal(zoneOder(zeitzone), new Date());
  const kanonisch = verbinde(tag, zeit, modus);
  return (
    <div className="datumzeit-feld">
      <div className="datum-zeit" role="group" aria-label={n}>
        <input
          id={id}
          type="date"
          aria-label={name ? `${name}: Tag` : undefined}
          aria-describedby={beschreibung}
          aria-invalid={ungueltig || undefined}
          value={tag}
          onChange={(e) => !unfertig(e) && onChange(verbinde(e.target.value, zeit, modus))}
        />
        {mitZeit && (
          <input
            type="time"
            aria-label={`${n}: Uhrzeit`}
            value={zeit}
            disabled={!tag}
            title={tag ? undefined : "Zuerst den Tag angeben"}
            onChange={(e) => !unfertig(e) && onChange(verbinde(tag, e.target.value, modus))}
          />
        )}
      </div>
      <div className="datumzeit-knoepfe">
        {mitZeit ? (
          <button type="button" className="knopf leise klein" aria-label={`Jetzt: ${n} auf aktuelle Zeit setzen`} onClick={() => onChange(jetzt())}>
            Jetzt
          </button>
        ) : (
          <button type="button" className="knopf leise klein" aria-label={`Heute: ${n} auf heute setzen`} onClick={() => onChange(jetzt().slice(0, 10))}>
            Heute
          </button>
        )}
        {modus === "datum_uhrzeit" && zeit && (
          <button type="button" className="knopf leise klein" aria-label={`Nur Tag: Uhrzeit bei ${n} entfernen`} onClick={() => onChange(tag)}>
            Nur Tag
          </button>
        )}
        {roh && (
          <button type="button" className="knopf leise klein" aria-label={`Leeren: ${n} zurücksetzen`} onClick={() => onChange("")}>
            Leeren
          </button>
        )}
      </div>
      {modus === "datumzeit" && tag && !zeit && (
        <p className="hinweis datumzeit-fehlt" role="status">
          Uhrzeit ergänzen: Dieses Feld verlangt Tag und Uhrzeit.
        </p>
      )}
      {roh && !tag && (
        <p className="hinweis datumzeit-fehlt" role="status">
          Gespeicherter Wert „{roh}“ ist kein Datum im Format JJJJ-MM-TT; bitte neu angeben.
        </p>
      )}
      {tag && roh !== kanonisch && (
        <p className="hinweis datumzeit-fehlt" role="status">
          Gespeicherter Wert „{roh}“ hat ein anderes Format; nach einer Änderung steht hier „{kanonisch}“.
        </p>
      )}
    </div>
  );
}
