// Verlauf der LEAD-Eingabehilfen: je Textfeld die zuletzt eingefügten Vorlagen, damit „Einfügung rückgängig“
// den vorherigen Wert exakt wiederherstellt. Gilt nur für die geöffnete Meldung (Dokumentkennung) und diese
// Sitzung; ein Wechsel der Ansicht behält ihn, nichts wird dauerhaft gespeichert.

import { useSyncExternalStore } from "react";

export const VERLAUF_MAX = 20;

export interface Einfuegung {
  /** Gespeicherter Wert vor der Einfügung (auch null oder fehlend) */
  vorherRoh: unknown;
  /** Text des Feldes nach der Einfügung */
  nachher: string;
  /**
   * Erster Teil des Pfades, der vor der Einfügung fehlte oder null war (Index in den Segmenten, früherer Wert);
   * die Rücknahme entfernt ihn bzw. setzt null wieder ein
   */
  leerAb?: { index: number; wert: undefined | null };
}

class EingabehilfeVerlauf {
  private dok = "";
  private felder = new Map<string, Einfuegung[]>();
  private hoerer = new Set<() => void>();
  private stand = 0;

  private melden() {
    this.stand++;
    this.hoerer.forEach((h) => h());
  }

  abonnieren = (h: () => void) => {
    this.hoerer.add(h);
    return () => this.hoerer.delete(h);
  };

  momentaufnahme = () => this.stand;

  /** Aktuelle Dokumentinstanz; ein Wechsel verwirft den gesamten Verlauf */
  dokument(dok: string) {
    if (dok === this.dok) return;
    this.dok = dok;
    this.felder.clear();
    this.melden();
  }

  liste(schluessel: string): Einfuegung[] {
    return this.felder.get(schluessel) || [];
  }

  merken(schluessel: string, e: Einfuegung) {
    this.felder.set(schluessel, [...this.liste(schluessel), e].slice(-VERLAUF_MAX));
    this.melden();
  }

  /** Letzte Einfügung entnehmen */
  entnehmen(schluessel: string): Einfuegung | undefined {
    const l = this.liste(schluessel);
    const letzte = l[l.length - 1];
    if (letzte) {
      this.felder.set(schluessel, l.slice(0, -1));
      this.melden();
    }
    return letzte;
  }

  /** Verlauf unterhalb eines Präfixes verwerfen (Pfade der Sachverhalte haben sich verschoben) */
  verwerfen(praefix: string) {
    let geaendert = false;
    for (const k of [...this.felder.keys()])
      if (k.startsWith(praefix)) {
        this.felder.delete(k);
        geaendert = true;
      }
    if (geaendert) this.melden();
  }
}

export const eingabehilfeVerlauf = new EingabehilfeVerlauf();

export function useEingabehilfeVerlauf(): EingabehilfeVerlauf {
  useSyncExternalStore(eingabehilfeVerlauf.abonnieren, eingabehilfeVerlauf.momentaufnahme);
  return eingabehilfeVerlauf;
}
