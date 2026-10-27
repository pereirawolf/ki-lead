// Zeile eines laufenden KI-Aufrufs mit eigener Uhr (seit 0.6.6): Puls, verstrichene Zeit, erwartete Dauer, geschriebene
// Zeichen und Kosten. Aus der Laufanzeige der KI-Erfassung herausgelöst, damit die Management Summary dieselbe Zeile
// zeigt. Die Uhr ist für Bildschirmleser verborgen (TP-2026-W44-12); Stufenwechsel sagt die jeweilige Anzeige selbst an.

import { useEffect, useState } from "react";
import { dauer } from "./kiErfassung/zustand";

export function LaufUhr({
  start,
  zeichen = 0,
  erwartet,
  kosten,
}: {
  /** Beginn des Aufrufs in ms seit 1970 */
  start: number;
  zeichen?: number;
  /** Erwartete Dauer als Text („bis 2 Minuten“); ohne Angabe oder ohne Messwert nicht angezeigt */
  erwartet?: string | null;
  /** Kostenangabe, etwa „bisher 0,12 USD“ oder „voraussichtlich bis 0,08 USD“ */
  kosten?: string | null;
}) {
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setJetzt(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const vonErwartet = erwartet && !erwartet.startsWith("einige Minuten") && erwartet !== "Dauer ohne Messwert" ? ` von voraussichtlich ${erwartet}` : "";
  return (
    <div className="laufanzeige">
      <span className="puls" aria-hidden="true" />
      <span>
        <span role="timer" aria-hidden="true">
          {dauer(Math.max(0, jetzt - start))}
        </span>
        {vonErwartet}
        {zeichen > 0 ? ` · ${zeichen.toLocaleString("de-DE")} Zeichen geschrieben` : ""}
        {kosten ? ` · ${kosten}` : ""}
      </span>
    </div>
  );
}
