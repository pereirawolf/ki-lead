// Typen zu meldung-v2.js (seit 0.7.0, UP-2026-W45-02). Meldungen im Format LEAD-Meldung-v2 bleiben als JSON-Objekte
// untypisiert (Record), weil ihr Aufbau aus dem Profilschema folgt (Kern plus Module).

export type MeldungV2 = Record<string, any>;

export interface ReferenzBefund {
  stufe: "fehler" | "hinweis";
  pfad: string;
  text: string;
}

export interface MigrationsOptionen {
  /** IANA-Zeitzone für Wanduhrzeiten der v1-Meldung, Vorgabe „Europe/Berlin“ */
  zeitzone?: string;
  /** Ebene des Absenders (Bund, Land, Kreis …); ohne Angabe aus Gebiet und Schema */
  ebene?: string;
  /** Erzeugt die meldung_id (Vorgabe: UUID aus crypto.randomUUID) */
  meldungId?: () => string;
  /** Zeitpunkt der Migration (Vorgabe: jetzt) */
  jetzt?: () => Date;
}

export const SCHEMA_ID: "LEAD-Meldung-v2";
export const FASSUNG: string;
export const WERKZEUG: string;

export function stelleSchemaZusammen(z: Record<string, any>, lade: (datei: string) => Record<string, any>): Record<string, any>;
export function mitVersatz(lokal: string, zone: string): string;
export function zeitV2(wert: unknown, zone: string): string | null;
export function vergleicheZeit(a: unknown, b: unknown, zone: string): number | null;
export function stehtVor(a: unknown, b: unknown, zone: string): boolean;
export function verweise(text: unknown): string[];
export function quellenV1(text: unknown, zone: string, hinweise: string[]): Record<string, any>[];
export function zeitstrahlV1(text: unknown, zone: string, hinweise: string[]): Record<string, any>[];
export function bewertungV1(sofort: unknown, zone: string, hinweise: string[], pfad: string): Record<string, any>;
export function migriereV1(v1: unknown, opt?: MigrationsOptionen): { meldung: MeldungV2; hinweise: string[] };
export function pruefeReferenzen(m: unknown): ReferenzBefund[];
