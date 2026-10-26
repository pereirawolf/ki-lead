/// <reference types="vite/client" />

/** Versionsnummer aus package.json, zur Bauzeit eingesetzt (vite.config.ts, `define`; seit 0.6.2, TP-2026-W44-08) */
declare const __APP_VERSION__: string;

/** Eigene Profile aus privat/profile/ einbinden (Entwicklungsserver oder KI_LEAD_PRIVAT=1) */
declare const __KI_LEAD_PRIVAT__: boolean;
