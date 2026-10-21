// Kontext der Meldungsmaske für die LEAD-Eingabehilfen: aktueller Meldungsstand und Schreiben auf diesem Stand.

import { createContext } from "react";
import type { Segment } from "../kern/pfad";
import type { Meldung } from "../kern/typen";

export interface EingabehilfeKontextWert {
  /** Kennung der geöffneten Meldung (Profil und Dokumentnummer der App) */
  dok: string;
  /** Neuester Stand der Meldung, auch zwischen zwei Zeichenvorgängen */
  aktuell: () => Meldung;
  setze: (segs: Segment[], wert: unknown) => void;
}

export const EingabehilfeKontext = createContext<EingabehilfeKontextWert | null>(null);
