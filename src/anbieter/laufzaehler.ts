// Zähler laufender KI-Anfragen (seit 0.6.12, KP-2026-W44-01): Jede Anfrage über den Verteiler erhöht ihn beim Start
// und senkt ihn bei Antwort, Fehler oder Abbruch. Der KI-Chip der Kopfleiste liest ihn; so ist jede KI-Nutzung
// erfasst (KI-Erfassung, Verdichtung, Management Summary, Testläufe, Verbindungstest) ohne Meldung je Aufrufstelle.

type Hoerer = (anzahl: number) => void;

let anzahl = 0;
const hoerer = new Set<Hoerer>();

function melden() {
  for (const h of hoerer) h(anzahl);
}

/** Zahl der laufenden KI-Anfragen */
export function laufendeAnfragen(): number {
  return anzahl;
}

/** Anfrage beginnt; die zurückgegebene Funktion beendet sie (mehrfacher Aufruf zählt nur einmal). */
export function anfrageBeginnt(): () => void {
  anzahl++;
  melden();
  let offen = true;
  return () => {
    if (!offen) return;
    offen = false;
    anzahl = Math.max(0, anzahl - 1);
    melden();
  };
}

/** Promise einer Anfrage zählen, bis sie erfüllt oder abgelehnt ist */
export function gezaehlt<T>(p: Promise<T>): Promise<T> {
  const ende = anfrageBeginnt();
  return p.finally(ende);
}

/** Änderungen abonnieren; gibt die Abmeldung zurück */
export function abonniereAnfragen(h: Hoerer): () => void {
  hoerer.add(h);
  return () => {
    hoerer.delete(h);
  };
}
