// Texte der KI-Erfassung: Eingabefelder (Befunde KP-2026-W43-61 bis -68), Fehlercodes des Seitenabrufs, Laufstatus.
// Seit 0.6.5 (TP-2026-W44-17) in eigener Datei; KiErfassung.tsx exportiert TEXT_FELD weiter.

import type { Lauf } from "../../pipeline/lauf";

export const ABRUF_FEHLER: Record<string, string> = {
  url_not_allowed: "Abruf von der Seite oder vom Anbieter gesperrt",
  url_not_accessible: "Seite nicht erreichbar",
  url_not_in_prior_context: "URL nicht aus Auftrag oder Suche",
  unsupported_content_type: "Inhaltstyp nicht unterstützt",
  max_uses_exceeded: "Höchstzahl der Abrufe erreicht",
  too_many_requests: "zu viele Anfragen",
  url_too_long: "URL zu lang",
  invalid_tool_input: "ungültige Adresse",
  unavailable: "Dienst vorübergehend nicht verfügbar",
};

export const STATUS_TEXT: Record<Lauf["status"], string> = {
  s1: "S1 läuft",
  bestaetigen: "wartet auf Bestätigung",
  s2: "S2 läuft",
  s3: "S3 läuft",
  fertig: "fertig",
  fehler: "Fehler",
  abgebrochen: "abgebrochen",
};

/**
 * Beschriftungen, Hilfetexte und Platzhalter der Eingabefelder (Befunde KP-2026-W43-61 bis -68 vom 25.10.2026).
 * Nur Oberfläche: Speicherung, Prüfung und Übergabe an S1/S2 und die Bezeichnungen im Prompt bleiben unverändert.
 * Die Beispiele sind Platzhalter, nie Feldwerte.
 */
export const TEXT_FELD = {
  gegenstand: {
    label: "Untersuchungsgegenstand und Erkenntnisinteresse",
    // GK-2026-W44-12: Sicht aus dem Referenzraum des Profils, wie in S1 und S2; Beispiele ohne Fachbezug eines Profils
    hilfe: (raum?: string) =>
      `Welche Lage oder welches Ereignis soll die KI-Recherche erfassen, für welchen Raum und Zeitraum? Bei Bedarf zusätzlich: aus welcher Perspektive. Ohne Angabe recherchiert die KI aus der Sicht des Referenzraums des Profils${raum?.trim() ? ` (${raum.trim()})` : ""}.`,
    platzhalter: "Beispiel: Störung seit Wochenbeginn im eigenen Zuständigkeitsbereich, mit Blick auf die betroffenen Leistungen und ihre Folgen.",
  },
  ausgangsinformationen: {
    label: "Ausgangsinformationen und Stichworte",
    hilfe: "Welche Informationen liegen bereits vor? Eigene Notizen, Zahlen, Beobachtungen. Stichpunkte genügen; Unbestätigtes bitte kennzeichnen.",
    platzhalter:
      "Beispiel:\n– Störung an mehreren Standorten gemeldet (unbestätigt)\n– Erste Stelle arbeitet im Notbetrieb\n– Rückmeldung der zuständigen Stelle steht aus",
  },
  webseiten: {
    label: "Webseiten (eine Adresse je Zeile)",
    hilfe:
      "Die KI ruft die Seiten nur ab, wenn „Recherche durchführen“ eingeschaltet ist. Gesperrte Seiten im Browser als PDF speichern und unter „Dateien“ hinzufügen.",
    ohneWebsuche: "„Recherche durchführen“ ist ausgeschaltet: Die eingetragenen Seiten werden nicht abgerufen, die KI sieht nur die Adressen.",
  },
  stichtag: {
    label: "Stichtag der Meldung",
    hilfe:
      "Für welchen Tag soll die Meldung gelten? Die Uhrzeit ist optional; ohne Angabe schlägt die KI den Meldezeitpunkt vor. Für Übungen oder zurückliegende Lagen den damaligen Tag wählen.",
  },
  prueffrage: {
    label: "Besondere Prüffrage (optional)",
    hilfe: "Ein einzelner Punkt, den die Recherche gezielt prüfen soll, oder ein gewünschter Beobachtungszeitraum.",
    platzhalter: "Beispiel: Sind zeitkritische Leistungen betroffen, und gibt es einen Ersatzweg?",
  },
  gegenstandS1: {
    hilfe: "Von der KI aus dem Auftrag abgeleitet. Bei Bedarf anpassen; die Recherche richtet sich nach diesem Text.",
  },
  horizont: {
    label: "Betrachtungshorizont",
    hilfe: "Zeitraum, über den die Meldung mögliche Entwicklungen betrachtet, z. B. die kommenden Wochen.",
  },
  referenzbezug: {
    label: "Bezug zum Referenzraum",
    hilfe: (raum?: string) =>
      `Warum die Lage für den Betrachtungsraum des Profils${raum?.trim() ? ` (${raum.trim()})` : ""} bedeutsam ist, auch bei Ereignissen außerhalb, etwa über Lieferketten.`,
  },
} as const;
