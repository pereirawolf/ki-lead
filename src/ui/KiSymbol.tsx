// KI-Symbol rechts oben in der Kopfleiste (seit 0.5.20): ein kleines Lagenradar wie im App-Symbol. In Ruhe grau;
// während einer KI-Anfrage kreist ein Radarstrahl in der Aktionsfarbe und die Innenfläche bewegt sich in den Farben
// des Identitätsbands. Wartet die KI auf die Person (S1 bestätigen, Ergebnis bereit, Fehler), trägt das Symbol außerhalb
// der KI-Erfassung einen Punkt. Laufzeit und Kosten zeigt die KI-Erfassung selbst. Ein Klick führt dorthin.
export type KopfLaufStufe = "s1" | "s2" | "s3";

/** Was die KI-Erfassung über ihren Lauf an die Kopfleiste meldet */
export type KopfLauf = { zustand: "laeuft"; stufe: KopfLaufStufe; verdichtung?: boolean } | { zustand: "bestaetigen" | "fertig" | "fehler" | "abgebrochen" };

export interface KiSymbolProps {
  lauf?: KopfLauf | null;
  /** Ansicht, in der die Person gerade ist; dort steht der Stand ohnehin, der Punkt entfällt */
  ansicht: string;
  zurKi: () => void;
}

const STUFE: Record<KopfLaufStufe, string> = {
  s1: "S1 Gegenstand und SOP-Auswahl",
  s2: "S2 Recherche und Entwurf",
  s3: "S3 Prüfung",
};

/** Beschriftung des Symbols (Name des Knopfs und Tooltip) */
export function kiSymbolText(lauf: KopfLauf | null | undefined, ansicht: string): string {
  if (!lauf) return "KI-Erfassung: keine KI-Anfrage aktiv";
  if (lauf.zustand === "laeuft") {
    const stufe = lauf.stufe === "s2" && lauf.verdichtung ? "S2 Verdichtung und Entwurf" : STUFE[lauf.stufe];
    return `KI-Anfrage läuft: ${stufe}. Zur KI-Erfassung`;
  }
  if (ansicht === "ki") return "KI-Erfassung: keine KI-Anfrage aktiv";
  switch (lauf.zustand) {
    case "bestaetigen":
      return "KI wartet: Gegenstand aus S1 bestätigen. Zur KI-Erfassung";
    case "fertig":
      return "KI-Entwurf bereit. Zur KI-Erfassung";
    case "fehler":
      return "KI-Anfrage mit Fehler beendet. Zur KI-Erfassung";
    case "abgebrochen":
      return "KI-Anfrage abgebrochen. Zur KI-Erfassung";
  }
}

/** Ansage für Bildschirmleser: nur bei Stufenwechsel und Ende */
export function kiAnsage(lauf: KopfLauf | null | undefined): string {
  if (!lauf) return "";
  switch (lauf.zustand) {
    case "laeuft":
      return `KI-Anfrage: ${lauf.stufe === "s2" && lauf.verdichtung ? "S2 Verdichtung und Entwurf" : STUFE[lauf.stufe]}.`;
    case "bestaetigen":
      return "KI-Anfrage: S1 abgeschlossen, Gegenstand bestätigen.";
    case "fertig":
      return "KI-Anfrage abgeschlossen, Entwurf bereit.";
    case "fehler":
      return "KI-Anfrage mit Fehler beendet.";
    case "abgebrochen":
      return "KI-Anfrage abgebrochen.";
  }
}

const ACHTECK = (r: number) =>
  Array.from({ length: 8 }, (_, k) => {
    const a = ((-90 + 45 * k) * Math.PI) / 180;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  });
const AUSSEN = ACHTECK(44);
const MITTE = ACHTECK(29).join(" ");

export function KiSymbol({ lauf, ansicht, zurKi }: KiSymbolProps) {
  const zustand = !lauf ? "ruhe" : lauf.zustand === "laeuft" ? "laeuft" : ansicht === "ki" ? "ruhe" : "wartet";
  const text = kiSymbolText(lauf, ansicht);
  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {kiAnsage(lauf)}
      </span>
      <button
        type="button"
        className={`kopf-ki ${zustand}${lauf?.zustand === "fehler" || lauf?.zustand === "abgebrochen" ? " problem" : ""}`}
        data-zustand={zustand}
        onClick={zurKi}
        aria-label={text}
        title={text}
      >
        <span className="kopf-ki-strahl" aria-hidden="true" />
        <span className="kopf-ki-lage" aria-hidden="true">
          <span className="kopf-ki-flaeche" />
        </span>
        <svg className="kopf-ki-geruest" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <polygon points={AUSSEN.join(" ")} />
          <polygon points={MITTE} />
          {AUSSEN.map((p) => (
            <line key={p} x1="50" y1="50" x2={p.split(",")[0]} y2={p.split(",")[1]} />
          ))}
        </svg>
        {zustand === "wartet" && <span className="kopf-ki-punkt" aria-hidden="true" />}
      </button>
    </>
  );
}
