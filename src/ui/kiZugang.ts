// Zugang zu den KI-Funktionen (seit 0.6.5, TP-2026-W44-17): Profil, Einstellungen, API-Schlüssel und der Weg in die
// Einstellungen. Bis 0.6.4 reichte die App sie als Props über bis zu drei Ebenen (App → Meldung → Management Summary,
// App → KI-Erfassung → Modellwahl). Die App stellt den Kontext bereit; Props der Komponenten gehen ihm vor (Tests).

import { createContext, useContext } from "react";
import type { Profil } from "../kern/typen";
import type { Einstellungen } from "../pipeline/einstellungen";
import type { Schluessel } from "../anbieter/verteiler";
import type { EinstellungsBereich } from "./Einstellungen";
import type { KopfLauf } from "./KiSymbol";

export interface KiZugangWert {
  profil: Profil | null;
  einstellungen: Einstellungen;
  schluessel: Schluessel;
  /** Zu den Einstellungen, ohne Angabe in den Bereich „KI-Anbieter & API“ */
  zuEinstellungen: (bereich?: EinstellungsBereich) => void;
  /**
   * Laufende Anfrage der Management Summary an die Kopfleiste melden, null bei Ende (seit 0.6.6): Titel im zugänglichen
   * Namen des KI-Chips, Rückfrage beim Profilwechsel und beim Verlassen der Seite. Ob der Chip online ist, bestimmt seit
   * 0.6.12 der zentrale Zähler (src/anbieter/laufzaehler.ts). Die KI-Erfassung meldet weiter über ihr Prop laufStand.
   */
  laufMelden?: (lauf: KopfLauf | null) => void;
}

export const KiZugangContext = createContext<KiZugangWert | null>(null);

/** Zugang aus dem Kontext; null außerhalb der App (etwa in Komponententests ohne Kontext) */
export function useKiZugang(): KiZugangWert | null {
  return useContext(KiZugangContext);
}
