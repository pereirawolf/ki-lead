// Gemeinsame Typen für Profil, Darstellungsdatei und Meldung.
// Die App kennt keine organisationsspezifischen Felder: alles kommt aus Schema und Darstellungsdatei.

export type Meldung = Record<string, any>;

export interface Migration {
  /** Schemakennung der Altdatei */
  von: string;
  /** Felder, die überschrieben werden */
  setze?: Record<string, unknown>;
  /** Felder, die nur ergänzt werden, wenn sie fehlen */
  ergaenze?: Record<string, unknown>;
  hinweis?: string;
}

export interface ProfilManifest {
  format: string;
  id: string;
  name: string;
  beschreibung?: string;
  version: string;
  herausgeber?: string;
  lizenz?: string;
  ebene?: string;
  referenzraum?: string;
  variablen: Record<string, string>;
  /** Weitere Bezeichnungen, unter denen die eigene Stelle meldet (exakter Vergleich nach Normalisierung) */
  eigene_stellen?: string[];
  meldung: {
    schema: string;
    ui: string;
    schema_id: string;
    eingang_schema_ids?: string[];
  };
  migrationen?: Migration[];
  anweisungen?: { erfassung?: string; verdichtung?: string; kurzfassung?: string };
  sop?: { dateien: string[]; teil_gemeinsam?: string };
  kodierleitfaden?: string;
  kontakte?: string;
  modelle?: Record<string, string>;
  /** Beispieldatensätze im Paket, z. B. eine fiktive Lage zum Ausprobieren des Lagebilds */
  beispiele?: { titel: string; ordner: string; hinweis?: string }[];
}

export type Widget = "text" | "text_lang" | "datum" | "datumzeit" | "auswahl" | "radio" | "mehrfachauswahl" | "radar" | "quellen";

export interface FeldUi {
  label?: string;
  hinweis?: string;
  widget?: Widget;
  platzhalter?: string;
  leer_label?: string;
  pflicht?: boolean;
  zeilen?: number;
  layout?: "zeile" | "spalten";
  element_label?: string;
  titel_feld?: string;
  hinzufuegen?: string;
  radar?: string;
}

export interface RadarAchse {
  key: string;
  label: string;
  stufen: string[];
}

export interface RadarDef {
  max: number;
  achsen: RadarAchse[];
}

export interface Schritt {
  id: string;
  titel: string;
  felder: string[];
  einleitung?: string;
  pruefung?: boolean;
}

/**
 * Rollen verbinden die LEAD-Logik (Kennsätze, Quellenprüfung, Redaktionscheck) mit den
 * Feldnamen des jeweiligen Organisationsschemas. Pfade der sv_*-Rollen sind relativ
 * zu einem Element der Sachverhaltsliste.
 */
export interface Rollen {
  schema_feld: string;
  status_feld: string;
  status_entwurf: string;
  status_final: string;
  entstehung_feld?: string;
  land?: string;
  meldende_stelle?: string;
  meldezeitpunkt?: string;
  quellen?: string;
  sachverhalte: string;
  sv_bezeichnung?: string;
  sv_art?: string;
  sv_ort?: string;
  sv_eintritt?: string;
  sv_beurteilung?: string;
  sv_tendenz?: string;
  sv_bewertung_text?: string;
  sv_massnahmen?: string;
  sv_radar?: string;
  sv_textfelder?: string[];
  sv_analysefelder?: string[];
  beurteilung_hoch?: string[];
  tendenz_entspannung?: string;
  /** Tendenzwert für eine Verschärfung; ohne Angabe gilt der letzte Wert der Aufzählung im Schema */
  tendenz_verschaerfung?: string;
}

export type LagebildVerweis = "zeitfenster" | "zusammenhang" | "fortschreibung" | "kernaussage" | "quellen" | "rueckblick";

/** Einstellungen des Moduls Lagebild (Zusammenführung mehrerer Meldungen). */
export interface LagebildKonfig {
  titel?: string;
  /** Bezeichnung des nächsten Lageprodukts, z. B. „Nächste Lagebild-Ausgabe“ */
  ausgabe_label?: string;
  /** Abstand der nächsten Ausgabe in Tagen (Vorbelegung im Redaktionscheck) */
  ausgabe_tage?: number;
  /** Fundstellen in der SOP je Prüfabschnitt, z. B. „SOP-LEAD A.7.3“ */
  verweise?: Partial<Record<LagebildVerweis, string>>;
}

export interface QuellenKonfig {
  kategorien: Record<string, string>;
  rangfolge_hinweis?: string;
  altkategorien?: Record<string, string>;
  vorlage?: string;
}

export interface UiKonfig {
  format: string;
  titel: string;
  untertitel?: string;
  ausblenden?: string[];
  schritte: Schritt[];
  felder: Record<string, FeldUi>;
  radare?: Record<string, RadarDef>;
  rollen: Rollen;
  kennsaetze?: Record<string, string>;
  quellen?: QuellenKonfig;
  dateiname?: string;
  kurzfassung?: { titel: string; kopf: string; kennsaetze?: string[] };
  lagebild?: LagebildKonfig;
}

export interface Sop {
  /** Anker bzw. abgeleitete Kennung, z. B. „sop-01“ oder „teil-a“ */
  id: string;
  titel: string;
  nummer?: string;
  lageart?: string;
  art_vorschlag?: string[];
  version?: string;
  datei: string;
  text: string;
  gemeinsam: boolean;
}

export interface Kontakte {
  stellen: { name: string; feld: string; email?: string }[];
  erinnerung?: { betreff: string; text: string };
}

export interface Befund {
  stufe: "fehler" | "warnung" | "hinweis";
  text: string;
  pfad?: string;
}

export interface Profil {
  manifest: ProfilManifest;
  schema: any;
  ui: UiKonfig;
  /** Alle Dateien des Pakets als Text, Schlüssel = relativer Pfad */
  dateien: Record<string, string>;
  sops: Sop[];
  kontakte?: Kontakte;
  /** SHA-256 über alle Dateien (sortiert nach Pfad) */
  hash: string;
}
