// Die PDF-Ausgabe wird erst bei Bedarf geladen (eigener Teil, rund 440 KB).

/**
 * Lädt die PDF-Ausgabe schon beim Zeigen auf die Schaltfläche vor. So liegt zwischen Klick und Download kaum Wartezeit,
 * und Browser wie Safari werten den Download noch als Folge des Klicks. Fehler zeigt erst der Export selbst.
 */
export function pdfVorladen(): void {
  import("./pdf").catch(() => undefined);
}
