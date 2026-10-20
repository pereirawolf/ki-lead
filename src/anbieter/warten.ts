// Abbrechbares Warten zwischen zwei Versuchen, gemeinsam für alle Anbieter.

/** Fehler, den die Oberfläche als „von der Person abgebrochen“ erkennt */
export function abbruchFehler(): DOMException {
  return new DOMException("Abgebrochen", "AbortError");
}

/** Wirft sofort, wenn das Signal bereits abgebrochen ist (vor jedem Versuch aufrufen). */
export function abbruchPruefen(signal?: AbortSignal): void {
  if (signal?.aborted) throw abbruchFehler();
}

/**
 * Wartet ms Millisekunden. Ein schon abgebrochenes Signal beendet sofort; ein Abbruch während des Wartens
 * ebenfalls. Zeitgeber und Abbruch-Listener werden in jedem Fall entfernt.
 */
export function warte(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((ok, nein) => {
    if (signal?.aborted) {
      nein(abbruchFehler());
      return;
    }
    const beiAbbruch = () => {
      clearTimeout(t);
      nein(abbruchFehler());
    };
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", beiAbbruch);
      ok();
    }, ms);
    signal?.addEventListener("abort", beiAbbruch, { once: true });
  });
}
