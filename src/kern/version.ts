// Versionsangaben der App (seit 0.6.3, TP-2026-W44-23): hier statt in src/pipeline/lauf.ts, damit kern, dokumente und
// die Oberfläche die Kennung ohne Umweg über die Pipeline (und deren Speicher- und Anbieterabhängigkeiten) lesen.
// Die Nummer kommt aus package.json (`define` in vite.config.ts, seit 0.6.2, TP-2026-W44-08).

/** Versionsnummer der App, z. B. „0.6.3“ */
export const APP_VERSION: string = __APP_VERSION__;

/** Kennung der App in Laufprotokollen und Ausgaben, z. B. „KI-LEAD 0.6.3“ */
export const APP_KENNUNG = `KI-LEAD ${APP_VERSION}`;
