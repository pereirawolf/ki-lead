// Stand der Laufanzeige (seit 0.6.5, TP-2026-W44-17): Beginn, Ereignisprotokoll und geschriebene Zeichen eines
// laufenden KI-Aufrufs. Außerhalb von React gehalten und nur von der Laufanzeige abonniert, damit der Fortschritt
// beim Streaming nicht die ganze KI-Erfassung neu zeichnet.

import type { Fortschritt } from "../../anbieter/typen";

export interface AnzeigeEreignis {
  zeit: number;
  text: string;
}

export interface AnzeigeSchnappschuss {
  start: number;
  protokoll: AnzeigeEreignis[];
  zeichen: number;
}

/** Text eines Fortschrittsereignisses im Protokoll der Laufanzeige; „schreibt“ zählt nur Zeichen */
export function fortschrittText(f: Exclude<Fortschritt, { art: "schreibt" }>): string {
  return f.art === "suche"
    ? `Websuche: „${f.text}“`
    : f.art === "abruf"
      ? `Seite abgerufen: ${f.text}`
      : f.art === "denkt"
        ? "Denkt nach …"
        : f.art === "fortsetzung"
          ? `Lange Recherche, Runde ${f.runde + 1} …`
          : `${f.grund} Neuer Versuch in ${Math.round(f.warteMs / 1000)} s.`;
}

/** Höchstens so oft zeichnet die Laufanzeige die Zahl geschriebener Zeichen neu (seit 0.6.5, TP-2026-W44-18) */
export const ZEICHEN_TAKT_MS = 250;

export class LaufAnzeigeStand {
  private stand: AnzeigeSchnappschuss = { start: 0, protokoll: [], zeichen: 0 };
  private readonly beobachter = new Set<() => void>();
  /** Zeichen, die noch nicht angezeigt sind, und der Zeitgeber, der sie gedrosselt nachreicht */
  private offeneZeichen = 0;
  private zeichenTimer: ReturnType<typeof setTimeout> | null = null;
  private zuletztZeichen = 0;

  /** Für useSyncExternalStore */
  readonly abonnieren = (b: () => void): (() => void) => {
    this.beobachter.add(b);
    return () => this.beobachter.delete(b);
  };

  readonly lesen = (): AnzeigeSchnappschuss => this.stand;

  /** Neuer KI-Aufruf: Uhr von vorn, Protokoll und Zeichen leer */
  beginnen(start = Date.now()): void {
    if (this.zeichenTimer !== null) clearTimeout(this.zeichenTimer);
    this.zeichenTimer = null;
    this.offeneZeichen = 0;
    this.zuletztZeichen = 0;
    this.setzen({ start, protokoll: [], zeichen: 0 });
  }

  /** Fortschritt der Pipeline; gleiche Ereignisse hintereinander erscheinen einmal */
  readonly fortschritt = (f: Fortschritt): void => {
    if (f.art === "schreibt") {
      // Je Chunk ein Ereignis: gedrosselt auf ZEICHEN_TAKT_MS, der letzte Stand kommt immer an
      this.offeneZeichen = f.zeichen;
      if (this.zeichenTimer !== null) return;
      const warten = Math.max(0, this.zuletztZeichen + ZEICHEN_TAKT_MS - Date.now());
      this.zeichenTimer = setTimeout(() => {
        this.zeichenTimer = null;
        this.zuletztZeichen = Date.now();
        if (this.offeneZeichen !== this.stand.zeichen) this.setzen({ ...this.stand, zeichen: this.offeneZeichen });
      }, warten);
      return;
    }
    const text = fortschrittText(f);
    const p = this.stand.protokoll;
    if (p[p.length - 1]?.text === text) return;
    this.setzen({ ...this.stand, protokoll: [...p, { zeit: Date.now(), text }] });
  };

  private setzen(neu: AnzeigeSchnappschuss): void {
    this.stand = neu;
    for (const b of this.beobachter) b();
  }
}
