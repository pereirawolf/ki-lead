// Datums- und Zeitfelder mit Schaltflächen „Jetzt“/„Heute“, „Nur Tag“ und „Leeren“.
// Werte im Format „JJJJ-MM-TT“ oder „JJJJ-MM-TTThh:mm“ (Wanduhrzeit der Profilzeitzone). Mit `versatz`
// (LEAD-Meldung-v2, seit 0.9.5) speichert das Feld Zeitpunkte mit UTC-Versatz der Zone, zeigt aber nur die
// Wanduhrzeit und darunter eine Kontrollzeile („Mo, 16.11.2026, 17:36 Uhr (MEZ)“).

import type { ChangeEvent } from "react";
import { jetztLokal } from "../kern/ausgabe";
import { kontrolltext, verbinde, wanduhrAusWert, wanduhrMitVersatz, zerlege, zoneOder, type DatumModus } from "../kern/zeit";

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
  /** Zeitpunkte mit UTC-Versatz der Zone speichern und gespeicherte in Wanduhrzeit umrechnen (LEAD-Meldung-v2) */
  versatz?: boolean;
  onChange: (v: string) => void;
}

/** Unfertige Eingabe (z. B. Tag gelöscht, Monat noch offen): Browser melden dann "" – den gespeicherten Wert behalten */
const unfertig = (e: ChangeEvent<HTMLInputElement>) => !e.target.value && !!e.target.validity?.badInput;

export function DatumZeit({ id, beschreibung, ungueltig, label, name, modus, wert, zeitzone, versatz, onChange }: Props) {
  const roh = String(wert ?? "");
  const zone = zoneOder(zeitzone);
  const { tag, zeit, abweichend } = versatz ? wanduhrAusWert(roh, zone) : { ...zerlege(roh), abweichend: undefined };
  const n = name || label;
  const mitZeit = modus !== "datum";
  const jetzt = () => jetztLokal(zone, new Date());
  /** Wert zum Speichern: mit `versatz` bekommt ein Zeitpunkt den UTC-Versatz der Zone */
  const wertAus = (t: string, z: string) => {
    const v = verbinde(t, z, modus);
    return versatz && v.includes("T") ? wanduhrMitVersatz(v, zone) : v;
  };
  const setze = (v: string) => onChange(versatz && v.includes("T") ? wanduhrMitVersatz(v, zone) : v);
  const kanonisch = versatz ? roh : verbinde(tag, zeit, modus);
  const kontrolle = versatz && tag ? kontrolltext(tag, zeit, zone) : "";
  const kontrollId = kontrolle ? `${id}-kontrolle` : undefined;
  const beschreibt = [beschreibung, kontrollId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="datumzeit-feld">
      <div className="datum-zeit" role="group" aria-label={n}>
        <input
          id={id}
          type="date"
          aria-label={name ? `${name}: Tag` : undefined}
          aria-describedby={beschreibt}
          aria-invalid={ungueltig || undefined}
          value={tag}
          onChange={(e) => !unfertig(e) && onChange(wertAus(e.target.value, zeit))}
        />
        {mitZeit && (
          <input
            type="time"
            aria-label={`${n}: Uhrzeit`}
            value={zeit}
            disabled={!tag}
            title={tag ? undefined : "Zuerst den Tag angeben"}
            onChange={(e) => !unfertig(e) && onChange(wertAus(tag, e.target.value))}
          />
        )}
      </div>
      <div className="datumzeit-knoepfe">
        {mitZeit ? (
          <button type="button" className="knopf leise klein" aria-label={`Jetzt: ${n} auf aktuelle Zeit setzen`} onClick={() => setze(jetzt())}>
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
      {kontrolle && (
        <p className="hinweis datumzeit-kontrolle" id={kontrollId}>
          {kontrolle}
          {abweichend && <> · umgerechnet aus {abweichend}</>}
        </p>
      )}
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
