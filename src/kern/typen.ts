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
  /** Optionales Farbschema der Oberfläche (Basis aus dem Katalog, einzelne Farbrollen änderbar) */
  farbschema?: { basis: string; name?: string; farben?: Record<string, string> };
  /** Beispieldatensätze im Paket, z. B. eine fiktive Lage zum Ausprobieren des Lagebilds */
  beispiele?: { titel: string; ordner: string; hinweis?: string }[];
}

export type Widget = "text" | "text_lang" | "datum" | "datumzeit" | "datum_uhrzeit" | "auswahl" | "radio" | "mehrfachauswahl" | "radar" | "quellen";

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
  /** Freigabeblock (Zeichnungen); in Ausgaben als eigener Block am Ende */
  freigabe?: string;
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
  /** Quellenkategorien (Kennbuchstabe A–Z → Erläuterung), z. B. A/B/W/M/P */
  kategorien: Record<string, string>;
  /** Quellenpriorität bei Widersprüchen, höchste zuerst, z. B. ["A", "B", "W", "M", "P"]; nennt jede Kategorie genau einmal */
  rangfolge?: string[];
  rangfolge_hinweis?: string;
  altkategorien?: Record<string, string>;
  vorlage?: string;
}

/** Satzanfänge (reguläre Ausdrücke), vor denen Ausgaben einen Absatz bzw. eine neue Zeile beginnen. */
export interface TextGliederung {
  absatz?: string[];
  zeile?: string[];
  /** Kurze Aspektbegriffe mit Doppelpunkt (bis zu so vielen Wörtern) beginnen einen Absatz; 0 oder fehlend: aus. */
  kurzlabel?: number;
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
  /**
   * Gliederung des Bewertungstexts in Ausgaben (PDF, Kopiervorlage): Satzanfänge als reguläre Ausdrücke.
   * „absatz“ beginnt einen neuen Absatz (Leerzeile), „zeile“ eine neue Zeile. Kennsätze gliedert die App selbst.
   */
  /** Gliederung des Bewertungstexts in Ausgaben. */
  bewertung_gliederung?: TextGliederung;
  /** Gliederung der Analysefelder (Rolle sv_analysefelder) in Ausgaben. */
  analyse_gliederung?: TextGliederung;
  /** Optionale LEAD-Eingabehilfen: Vorlagen vorhandener Satzanfänge und Kennsätze je Textfeld */
  feldhilfen?: FeldhilfenKonfig;
}

/** Vorlage für einen vorhandenen Satzanfang oder Kennsatz; offene Stellen als ⟦…⟧, gelesene Werte als {{t0}} usw. */
export interface FeldhilfeVorlage {
  id: string;
  /** Beschriftung der Schaltfläche (der Satzanfang) */
  label: string;
  vorlage: string;
  hinweis?: string;
  /** Einfügestelle; Vorgabe „ende“ (neuer Absatz). Nicht zusammen mit „kennsatz“. */
  position?: "anfang" | "vor_kennsaetzen" | "ende";
  /** Schlüssel aus „kennsaetze“ (nur Bewertungstext): eigene Zeile im Kennsatzblock am Textende */
  kennsatz?: string;
  /** Auswahl für ⟦Status auswählen⟧ (keine Vorauswahl) */
  status_auswahl?: string[];
  /** Nur verfügbar, wenn dieser Auswahlwert des Sachverhalts gesetzt ist */
  nur_mit_wert?: "beurteilung" | "tendenz";
}

export interface Feldhilfe {
  vorlagen: FeldhilfeVorlage[];
}

export interface FeldhilfenKonfig {
  format: "lead-feldhilfen/1";
  /** Schlüssel relativ zu einem Sachverhalt (Einträge aus sv_analysefelder und sv_bewertung_text) */
  felder: Record<string, Feldhilfe>;
}

export interface Sop {
  /** Anker bzw. abgeleitete Kennung, z. B. „b01“ oder „teil-a“ */
  id: string;
  titel: string;
  /** Kennung ohne Präfix „SOP-LEAD“, z. B. „B08“ oder „C07“ (aus `kennung` im Kopf, sonst aus dem Titel) */
  nummer?: string;
  /** frühere technische IDs (`bisherige_ids`), z. B. „sop-08“; gespeicherte Läufe werden darüber aufgelöst */
  alias?: string[];
  /** frühere Kennung (`bisherige_kennung`), z. B. „08“ oder „N05“ */
  bisherigeKennung?: string;
  lageart?: string;
  art_vorschlag?: string[];
  version?: string;
  /** Art des Abschnitts aus dem Kopf, z. B. „Dach-SOP“, „Themenbaustein“, „Querschnittsbaustein“ */
  typ?: string;
  /** Leseblock zur Gliederung der Auswahl (nur Navigation) */
  lesegruppe?: string;
  /** Bearbeitungsstand aus dem Kopf, z. B. „Inhaltsgerüst – …“ */
  status?: string;
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
  /** Stabiler Bezeichner für Export und Auswertung (z. B. „FORTSCHREIBUNG_OHNE_AKTUALISIERUNG“) */
  code?: string;
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

/**
 * Profil in der Liste der App: gespeicherte Dateien, geladenes Profil (oder null) und Befunde des Ladens. Seit 0.6.3
 * (TP-2026-W44-23) hier statt in App.tsx, damit die Profilansicht nicht aus der Wurzel importiert.
 */
export interface ProfilEintrag {
  schluessel: string;
  quelle: "eingebaut" | "importiert";
  dateien: Record<string, string>;
  importiertAm?: string;
  profil: Profil | null;
  befunde: Befund[];
}
