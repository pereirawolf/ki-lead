// Automatische Vorprüfung einer Management Summary aus der Musterfassung Ilka (Plan management-summary-ilka).
// Seit 0.5.12 in src/pipeline/kurzfassungsreihe.ts, damit der Vergleichslauf der App sie ebenso nutzt; diese Datei
// bleibt als Verweis für Skript und Tests. Liefert Beobachtungen für die Prüfung von Hand, kein Bestehen und keine
// Note: Die Muss- und Darf-nicht-Punkte des Falls evaluation/faelle/ilka-management-summary.json bewertet eine Person.

export { auffaelligkeiten, kurzfassungPruefen, SACHVERHALTE_MUSTER, type KurzfassungBeobachtung } from "../../src/pipeline/kurzfassungsreihe";
