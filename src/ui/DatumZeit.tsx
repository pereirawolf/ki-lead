// Datums- und Zeitfelder mit Schaltflächen „Jetzt“/„Heute“, „Nur Tag“ und „Leeren“.
// Werte im Format „JJJJ-MM-TT“ oder „JJJJ-MM-TTThh:mm“ (Wanduhrzeit der Profilzeitzone).

import { jetztLokal } from "../kern/ausgabe";
import { zoneOder } from "../kern/zeit";

/** datum: nur Tag · datumzeit: Tag und Uhrzeit (Uhrzeit nötig) · datum_uhrzeit: Tag, Uhrzeit optional */
export type DatumModus = "datum" | "datumzeit" | "datum_uhrzeit";

/** Zerlegt einen gespeicherten Wert in Tag und Uhrzeit; Unbekanntes bleibt leer */
export function zerlege(wert: unknown): { tag: string; zeit: string } {
  const m = String(wert ?? "").match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
  return m ? { tag: m[1], zeit: m[2] || "" } : { tag: "", zeit: "" };
}

/** Setzt Tag und Uhrzeit wieder zusammen; ohne Tag ist der Wert leer */
export function verbinde(tag: string, zeit: string, modus: DatumModus): string {
  if (!tag) return "";
  return modus !== "datum" && zeit ? `${tag}T${zeit}` : tag;
}

interface Props {
  id: string;
  label: string;
  modus: DatumModus;
  wert: unknown;
  zeitzone?: string;
  onChange: (v: string) => void;
}

export function DatumZeit({ id, label, modus, wert, zeitzone, onChange }: Props) {
  const roh = String(wert ?? "");
  const { tag, zeit } = zerlege(roh);
  const mitZeit = modus !== "datum";
  const jetzt = () => jetztLokal(zoneOder(zeitzone), new Date());
  // Unlesbare Altwerte nicht stillschweigend überschreiben: sichtbar machen, Leeren bleibt möglich
  const unlesbar = !!roh && !tag;
  return (
    <div className="datumzeit-feld">
      <div className="datum-zeit" role="group" aria-label={label}>
        <input id={id} type="date" value={tag} onChange={(e) => onChange(verbinde(e.target.value, zeit, modus))} />
        {mitZeit && (
          <input
            type="time"
            aria-label={`${label}: Uhrzeit`}
            value={zeit}
            disabled={!tag}
            title={tag ? undefined : "Zuerst den Tag angeben"}
            onChange={(e) => onChange(verbinde(tag, e.target.value, modus))}
          />
        )}
      </div>
      <div className="datumzeit-knoepfe">
        {mitZeit ? (
          <button type="button" className="knopf leise klein" aria-label={`${label}: auf jetzt setzen`} onClick={() => onChange(jetzt())}>
            Jetzt
          </button>
        ) : (
          <button type="button" className="knopf leise klein" aria-label={`${label}: auf heute setzen`} onClick={() => onChange(jetzt().slice(0, 10))}>
            Heute
          </button>
        )}
        {modus === "datum_uhrzeit" && zeit && (
          <button type="button" className="knopf leise klein" aria-label={`${label}: Uhrzeit entfernen, nur den Tag angeben`} onClick={() => onChange(tag)}>
            Nur Tag
          </button>
        )}
        {roh && (
          <button type="button" className="knopf leise klein" aria-label={`${label}: leeren`} onClick={() => onChange("")}>
            Leeren
          </button>
        )}
      </div>
      {modus === "datumzeit" && tag && !zeit && (
        <p className="hinweis datumzeit-fehlt" role="status">
          Uhrzeit ergänzen: Dieses Feld verlangt Tag und Uhrzeit.
        </p>
      )}
      {unlesbar && (
        <p className="hinweis datumzeit-fehlt" role="status">
          Gespeicherter Wert „{roh}“ ist kein Datum im Format JJJJ-MM-TT; bitte neu angeben.
        </p>
      )}
    </div>
  );
}
