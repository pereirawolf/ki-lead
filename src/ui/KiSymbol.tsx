// KI-Chip rechts oben in der Kopfleiste (seit 0.5.21): „KI ruht“ in Ruhe, „KI aktiv“, solange eine KI-Anfrage läuft
// (bis 0.6.19 „KI offline“/„KI online“; seit 0.6.20 ohne „offline“, das der Offline-Betrieb der App meint, UX-2026-W44-01)
// und noch nicht beendet ist. Der Chip trägt die Farben des Profils: in Ruhe zart, während der Anfrage gefüllt in der
// Aktionsfarbe mit einem pulsierenden Ring. Laufzeit und Kosten zeigt die jeweilige Ansicht selbst.
// Seit 0.6.12 (KP-2026-W44-01) liest der Chip den zentralen Zähler laufender Anfragen (src/anbieter/laufzaehler.ts): jede
// KI-Nutzung zählt, auch Testläufe und der Verbindungstest. Er ist eine reine Statusanzeige, kein Knopf. Melden
// KI-Erfassung oder Management Summary ihren Lauf, nennt der zugängliche Name die Stufe bzw. den Titel.
import { useSyncExternalStore } from "react";
import { abonniereAnfragen, laufendeAnfragen } from "../anbieter/laufzaehler";

export type KopfLaufStufe = "s1" | "s2" | "s3" | "ms";

/** Laufende KI-Anfrage, wie KI-Erfassung oder Management Summary sie an die Kopfleiste melden; null, solange keine läuft */
export interface KopfLauf {
  stufe: KopfLaufStufe;
  verdichtung?: boolean;
  /** Titel des Schritts bei Stufe „ms“ (kurzfassung.titel des Profils), sonst „Management Summary“ */
  titel?: string;
}

export interface KiSymbolProps {
  /** Gemeldeter Lauf mit Stufe (nur für den zugänglichen Namen und die Ansage) */
  lauf?: KopfLauf | null;
  /** Zahl laufender Anfragen; ohne Angabe aus dem zentralen Zähler */
  anfragen?: number;
}

const STUFE: Record<KopfLaufStufe, string> = {
  s1: "S1 Gegenstand und SOP-Auswahl",
  s2: "S2 Recherche und Entwurf",
  s3: "S3 Prüfung",
  ms: "Management Summary",
};

const stufeText = (lauf: KopfLauf) =>
  lauf.stufe === "s2" && lauf.verdichtung ? "S2 Verdichtung und Entwurf" : lauf.stufe === "ms" && lauf.titel ? lauf.titel : STUFE[lauf.stufe];

/** Online, wenn der Zähler eine laufende Anfrage kennt oder ein Lauf gemeldet ist */
const istOnline = (lauf: KopfLauf | null | undefined, anfragen = 0) => anfragen > 0 || !!lauf;

/** Zugänglicher Name und Tooltip; beginnt mit dem sichtbaren Text */
export function kiSymbolText(lauf: KopfLauf | null | undefined, anfragen = 0): string {
  if (!istOnline(lauf, anfragen)) return "KI ruht: keine KI-Anfrage aktiv";
  if (anfragen > 1) return `KI aktiv: ${anfragen} Anfragen laufen${lauf ? `, darunter ${stufeText(lauf)}` : ""}`;
  return lauf ? `KI aktiv: Anfrage läuft, ${stufeText(lauf)}` : "KI aktiv: Anfrage läuft";
}

/** Ansage für Bildschirmleser bei jedem Wechsel von Stufe oder Zustand */
export function kiAnsage(lauf: KopfLauf | null | undefined, anfragen = 0): string {
  // Der Anfangsinhalt einer Statusregion wird nicht angesagt, erst ihre Änderung
  if (!istOnline(lauf, anfragen)) return "KI ruht.";
  return lauf ? `KI aktiv: ${stufeText(lauf)}.` : "KI aktiv.";
}

/** Zahl laufender KI-Anfragen als React-Zustand */
export function useLaufendeAnfragen(): number {
  return useSyncExternalStore(abonniereAnfragen, laufendeAnfragen, laufendeAnfragen);
}

export function KiSymbol({ lauf, anfragen }: KiSymbolProps) {
  const zentral = useLaufendeAnfragen();
  const n = anfragen ?? zentral;
  const online = istOnline(lauf, n);
  const text = kiSymbolText(lauf, n);
  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {kiAnsage(lauf, n)}
      </span>
      <span role="img" className={online ? "kopf-ki online" : "kopf-ki offline"} data-zustand={online ? "online" : "offline"} aria-label={text} title={text}>
        <span className="kopf-ki-text">{online ? "KI aktiv" : "KI ruht"}</span>
      </span>
    </>
  );
}
