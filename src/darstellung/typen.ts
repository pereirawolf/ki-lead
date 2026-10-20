// Datentypen der Farbschemata.

/** Farbrollen der Oberfläche, die ein Schema setzt (CSS-Variable --<name>) */
export const UI_TOKENS = [
  "papier",
  "flaeche",
  "tinte",
  "tinte-leise",
  "linie",
  "linie-zart",
  "eingabe-rand",
  "fokus",
  "fokus-abstand",
  "auswahl-text",
  "lese-farbe",
  "lese-flaeche",
  "header-hintergrund",
  "header-text",
  "amt",
  "amt-tief",
  "amt-zart",
  "auf-amt",
  "auf-amt-hover",
  "link",
  "auswahl-rand",
  "browserleiste",
  "marke-akzent-1",
  "marke-akzent-2",
  "marke-akzent-3",
] as const;
export type UiToken = (typeof UI_TOKENS)[number];

/** Fachliche Signalfarben: hängen nur vom Modus ab, nie vom Land oder Profil */
export const SEMANTIK_TOKENS = [
  "gering",
  "gering-zart",
  "erheblich",
  "erheblich-zart",
  "auf-erheblich",
  "kritisch",
  "kritisch-zart",
  "ok",
  "ok-zart",
  "radar-linie",
  "radar-ring",
] as const;
export type SemantikToken = (typeof SEMANTIK_TOKENS)[number];

export type Modus = "hell" | "dunkel";

export interface FarbschemaEintrag {
  id: string;
  name: string;
  gruppe: "Neutral" | "Bund" | "Bundesländer";
  modus: Modus;
  /** Kurzangabe zur Ausgangslage der Farben */
  herkunft: string;
  quellen: string[];
  /** Ausgangsfarben (Landes-/CI-Farben), nur zur Dokumentation */
  ci: Record<string, string>;
  /** Dekoratives Identitätsband unter dem Kopf */
  band: string[];
  tokens: Record<UiToken, string>;
}

/** Optionales Farbschema eines Profils (profil.json → farbschema) bzw. lokale Anpassung */
export interface ProfilFarbschema {
  basis: string;
  name?: string;
  farben?: Partial<Record<UiToken, string>>;
}

/** Gespeicherte Auswahl: ein festes Schema, „automatisch“ (wie das Betriebssystem) oder die Farben des aktiven Profils */
export interface Darstellung {
  version: 1;
  auswahl: string;
}

export interface AufgeloestesThema {
  /** gewünschte Auswahl */
  auswahl: string;
  /** tatsächlich verwendetes Schema; null = Standarddarstellung der App (automatisch hell/dunkel) */
  basis: string | null;
  name: string;
  modus: Modus | null;
  quelle: "automatisch" | "katalog" | "profil" | "lokal" | "ersatz";
  /** vollständige Farbwerte (UI und Semantik); leer bei automatisch */
  tokens: Record<string, string>;
  band: string[];
  hinweise: string[];
}
