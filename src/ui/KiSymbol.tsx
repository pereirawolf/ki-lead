// KI-Chip rechts oben in der Kopfleiste (seit 0.5.20): „KI offline“ in Ruhe, „KI online“, solange eine KI-Anfrage läuft
// und noch nicht beendet ist. Der Chip trägt die Farben des Profils: in Ruhe zart, während der Anfrage gefüllt in der
// Aktionsfarbe mit einem pulsierenden Ring. Laufzeit und Kosten zeigt die KI-Erfassung selbst. Ein Klick führt dorthin.
export type KopfLaufStufe = "s1" | "s2" | "s3";

/** Laufende KI-Anfrage, wie die KI-Erfassung sie an die Kopfleiste meldet; null, solange keine läuft */
export interface KopfLauf {
  stufe: KopfLaufStufe;
  verdichtung?: boolean;
}

export interface KiSymbolProps {
  lauf?: KopfLauf | null;
  zurKi: () => void;
}

const STUFE: Record<KopfLaufStufe, string> = {
  s1: "S1 Gegenstand und SOP-Auswahl",
  s2: "S2 Recherche und Entwurf",
  s3: "S3 Prüfung",
};

const stufeText = (lauf: KopfLauf) => (lauf.stufe === "s2" && lauf.verdichtung ? "S2 Verdichtung und Entwurf" : STUFE[lauf.stufe]);

/** Zugänglicher Name und Tooltip; beginnt mit dem sichtbaren Text */
export function kiSymbolText(lauf: KopfLauf | null | undefined): string {
  return lauf ? `KI online: Anfrage läuft, ${stufeText(lauf)}. Zur KI-Erfassung` : "KI offline: keine KI-Anfrage aktiv. Zur KI-Erfassung";
}

/** Ansage für Bildschirmleser bei jedem Wechsel von Stufe oder Zustand */
export function kiAnsage(lauf: KopfLauf | null | undefined): string {
  // Der Anfangsinhalt einer Statusregion wird nicht angesagt, erst ihre Änderung
  return lauf ? `KI online: ${stufeText(lauf)}.` : "KI offline.";
}

export function KiSymbol({ lauf, zurKi }: KiSymbolProps) {
  const online = !!lauf;
  const text = kiSymbolText(lauf);
  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {kiAnsage(lauf)}
      </span>
      <button
        type="button"
        className={online ? "kopf-ki online" : "kopf-ki offline"}
        data-zustand={online ? "online" : "offline"}
        onClick={zurKi}
        aria-label={text}
        title={text}
      >
        <span className="kopf-ki-text">{online ? "KI online" : "KI offline"}</span>
      </button>
    </>
  );
}
