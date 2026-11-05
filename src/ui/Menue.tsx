// Aufklappmenü (seit UX-2026-W45-02 aus Profile.tsx, auch in der Auswertung verwendet).

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export interface MenueEintrag {
  text: string;
  aktion: () => void;
  deaktiviert?: boolean;
}

/**
 * Aufklappmenü nach dem Disclosure-Muster: ein Knopf mit aria-expanded, darunter eine Liste gewöhnlicher Knöpfe.
 * Schließt nach der Auswahl, mit Escape (Fokus zurück auf den Knopf), beim Klick außerhalb und wenn der Fokus das Menü verlässt.
 */
export function Menue({
  text,
  label,
  klasse,
  eintraege,
  beimOeffnen,
}: {
  text: string;
  label?: string;
  klasse: string;
  eintraege: MenueEintrag[];
  /** z. B. Vorladen einer Bibliothek, sobald das Menü aufgeht */
  beimOeffnen?: () => void;
}) {
  const [offen, setOffen] = useState(false);
  const listId = useId();
  const wurzel = useRef<HTMLDivElement>(null);
  const knopfRef = useRef<HTMLButtonElement>(null);
  /** Liste am linken Rand des Knopfs ausrichten, wenn sie rechtsbündig links aus dem Bild liefe (schmale Bildschirme) */
  const [links, setLinks] = useState(false);
  useLayoutEffect(() => {
    if (!offen) return setLinks(false);
    const k = knopfRef.current?.getBoundingClientRect();
    const liste = wurzel.current?.querySelector(".menue-liste")?.getBoundingClientRect();
    if (k && liste) setLinks(k.right - liste.width < 8);
  }, [offen]);
  useEffect(() => {
    if (!offen) return;
    const aussen = (e: PointerEvent) => {
      if (!wurzel.current?.contains(e.target as Node)) setOffen(false);
    };
    document.addEventListener("pointerdown", aussen);
    return () => document.removeEventListener("pointerdown", aussen);
  }, [offen]);
  return (
    <div
      className="menue"
      ref={wurzel}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !offen) return;
        e.stopPropagation();
        setOffen(false);
        knopfRef.current?.focus();
      }}
      onBlur={(e) => {
        // Nur bei einem Fokuswechsel auf ein anderes Element; Safari fokussiert angeklickte Knöpfe nicht (relatedTarget leer)
        const ziel = e.relatedTarget as Node | null;
        if (ziel && !wurzel.current?.contains(ziel)) setOffen(false);
      }}
    >
      <button
        ref={knopfRef}
        type="button"
        className={klasse}
        aria-expanded={offen}
        aria-controls={offen ? listId : undefined}
        aria-label={label}
        onClick={() => {
          if (!offen) beimOeffnen?.();
          setOffen((o) => !o);
        }}
      >
        {text}
        <span className="menue-pfeil" aria-hidden="true">
          ▾
        </span>
      </button>
      {offen && (
        <ul id={listId} className={links ? "menue-liste menue-links" : "menue-liste"}>
          {eintraege.map((m) => (
            <li key={m.text}>
              <button
                type="button"
                className="menue-eintrag"
                disabled={m.deaktiviert}
                onClick={() => {
                  setOffen(false);
                  m.aktion();
                }}
              >
                {m.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
