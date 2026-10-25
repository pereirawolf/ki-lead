// Statusbereich rechts oben in der Kopfleiste (seit 0.5.20): Bearbeitungsstand der Meldung in der Maske
// (Entwurf/final, KI-Entwurf) und ein laufender KI-Lauf mit Stufe, Dauer, geschriebenen Zeichen und Kosten.
// Der Lauf bleibt in jeder Ansicht sichtbar; ein Klick führt zur KI-Erfassung. Bewegung nur dekorativ und
// abgeschaltet bei „Bewegung reduzieren“; Stufenwechsel und Laufende werden einmal angesagt.
import { useEffect, useState } from "react";

export type KopfLaufStufe = "s1" | "s2" | "s3";

/** Was die KI-Erfassung über ihren Lauf an die Kopfleiste meldet */
export type KopfLauf =
  | {
      zustand: "laeuft";
      stufe: KopfLaufStufe;
      /** Start der laufenden Stufe (ms seit Epoche) */
      start: number;
      zeichen: number;
      /** Bisherige Kosten als Text; leer, solange noch keine erfasst sind */
      kosten?: string;
      /** Letztes Ereignis des Anbieters („Websuche: …“) */
      ereignis?: string;
      verdichtung?: boolean;
    }
  | { zustand: "bestaetigen"; kosten?: string }
  | { zustand: "fertig" | "fehler" | "abgebrochen"; kosten?: string };

export interface KopfMeldung {
  /** Wert des Statusfelds der Meldung */
  status: string;
  final: boolean;
  /** Meldung stammt aus einem KI-Entwurf (Entstehungsfeld) */
  ki: boolean;
}

export interface KopfStatusProps {
  meldung?: KopfMeldung | null;
  lauf?: KopfLauf | null;
  /** Ansicht, in der die Person gerade ist; der Hinweis auf ein Laufende entfällt in der KI-Erfassung selbst */
  ansicht: string;
  zurMeldung: () => void;
  zurKi: () => void;
  /** Feste Uhrzeit (Tests) */
  jetzt?: () => number;
}

const STUFEN: { id: KopfLaufStufe; kurz: string; lang: string }[] = [
  { id: "s1", kurz: "S1", lang: "Gegenstand und SOP-Auswahl" },
  { id: "s2", kurz: "S2", lang: "Recherche und Entwurf" },
  { id: "s3", kurz: "S3", lang: "Prüfung" },
];

export function laufzeitText(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min`;
}

function stufenLang(stufe: KopfLaufStufe, verdichtung?: boolean): string {
  if (stufe === "s2" && verdichtung) return "Verdichtung und Entwurf";
  return STUFEN.find((s) => s.id === stufe)!.lang;
}

/** Ansage für Bildschirmleser: nur bei Stufenwechsel und Laufende, nicht bei jedem Sekundentakt */
export function laufAnsage(lauf: KopfLauf | null | undefined): string {
  if (!lauf) return "";
  switch (lauf.zustand) {
    case "laeuft":
      return `KI-Lauf: Stufe ${lauf.stufe.toUpperCase()}, ${stufenLang(lauf.stufe, lauf.verdichtung)}.`;
    case "bestaetigen":
      return "KI-Lauf: Stufe S1 abgeschlossen, Gegenstand bestätigen.";
    case "fertig":
      return "KI-Lauf abgeschlossen, Entwurf bereit.";
    case "fehler":
      return "KI-Lauf mit Fehler beendet.";
    case "abgebrochen":
      return "KI-Lauf abgebrochen.";
  }
}

function Stufenleiste({ stufe }: { stufe: KopfLaufStufe }) {
  const i = STUFEN.findIndex((s) => s.id === stufe);
  return (
    <span className="kopf-stufen" aria-hidden="true">
      {STUFEN.map((s, j) => (
        <span key={s.id} className={j < i ? "kopf-stufe erledigt" : j === i ? "kopf-stufe aktuell" : "kopf-stufe"}>
          {s.kurz}
        </span>
      ))}
    </span>
  );
}

export function KopfStatus({ meldung, lauf, ansicht, zurMeldung, zurKi, jetzt = Date.now }: KopfStatusProps) {
  const laeuft = lauf?.zustand === "laeuft";
  const [uhr, setUhr] = useState(jetzt);
  useEffect(() => {
    if (!laeuft) return;
    setUhr(jetzt());
    const t = window.setInterval(() => setUhr(jetzt()), 1000);
    return () => window.clearInterval(t);
  }, [laeuft, jetzt]);

  const ansage = laufAnsage(lauf);
  // Ende und Bestätigung nur außerhalb der KI-Erfassung zeigen (dort steht es ohnehin)
  const laufZeigen = !!lauf && (laeuft || ansicht !== "ki");

  return (
    <div className="kopf-status">
      <span className="sr-only" role="status" aria-live="polite">
        {ansage}
      </span>

      {laufZeigen && lauf && lauf.zustand === "laeuft" && (
        <button
          type="button"
          className="kopf-lauf laeuft"
          onClick={zurKi}
          title={`KI-Lauf in Stufe ${lauf.stufe.toUpperCase()}: ${stufenLang(lauf.stufe, lauf.verdichtung)}. Zur KI-Erfassung`}
        >
          <span className="kopf-lauf-punkt" aria-hidden="true" />
          <Stufenleiste stufe={lauf.stufe} />
          <span className="kopf-lauf-text">
            <span className="kopf-lauf-zeit">{laufzeitText(uhr - lauf.start)}</span>
            {lauf.zeichen > 0 && <span className="kopf-lauf-zeichen"> · {lauf.zeichen.toLocaleString("de-DE")} Z.</span>}
            {lauf.kosten && <span className="kopf-lauf-kosten"> · {lauf.kosten}</span>}
          </span>
          {lauf.ereignis && (
            <span className="kopf-lauf-ereignis" key={lauf.ereignis}>
              {lauf.ereignis}
            </span>
          )}
          <span className="kopf-lauf-fortschritt" aria-hidden="true" />
        </button>
      )}

      {laufZeigen && lauf && lauf.zustand !== "laeuft" && (
        <button
          type="button"
          className={`kopf-lauf ${lauf.zustand}`}
          onClick={zurKi}
          title={`${ansage}${lauf.kosten ? ` Kosten: ${lauf.kosten}.` : ""} Zur KI-Erfassung`}
        >
          <span className="kopf-lauf-symbol" aria-hidden="true">
            {lauf.zustand === "fertig" ? "✓" : lauf.zustand === "bestaetigen" ? "?" : "!"}
          </span>
          <span className="kopf-lauf-text">
            {lauf.zustand === "fertig"
              ? "KI-Entwurf bereit"
              : lauf.zustand === "bestaetigen"
                ? "S1 bestätigen"
                : lauf.zustand === "fehler"
                  ? "KI-Lauf: Fehler"
                  : "KI-Lauf abgebrochen"}
            {lauf.kosten && <span className="kopf-lauf-kosten"> · {lauf.kosten}</span>}
          </span>
        </button>
      )}

      {meldung && (
        <button
          type="button"
          className={meldung.final ? "kopf-marke final" : "kopf-marke entwurf"}
          onClick={zurMeldung}
          title={
            meldung.final
              ? `Meldung in der Maske: Status „${meldung.status}“${meldung.ki ? ", aus einem KI-Entwurf entstanden" : ""}. Zur Meldung`
              : `Meldung in der Maske: ${meldung.ki ? "KI-Entwurf" : "Entwurf"}, nicht freigegeben. Zur Meldung`
          }
        >
          {meldung.final ? (meldung.ki ? `KI · ${meldung.status}` : meldung.status) : meldung.ki ? "KI-Entwurf" : "Entwurf"}
        </button>
      )}
    </div>
  );
}
