// Gemeinsame Schnittstelle für KI-Anbieter. Die Pipeline kennt nur diese Typen;
// die Übersetzung in die jeweilige API steckt in anthropic.ts, openai.ts und mistral.ts.

export type Aufwand = "low" | "medium" | "high" | "xhigh" | "max";

export interface SystemTeil {
  text: string;
  /** Als Cache-Grenze markieren (Prompt-Caching beim Anbieter) */
  cache?: boolean;
}

export type Inhaltsblock =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string }; title?: string }
  | Record<string, any>;

export interface Nachricht {
  role: "user" | "assistant";
  content: string | Inhaltsblock[];
}

export interface Werkzeuge {
  /** Websuche beim Anbieter */
  websuche?: { maxUses: number; land?: string; zeitzone?: string };
  /** Abruf von URLs, die im Auftrag genannt sind oder aus der Suche stammen */
  abruf?: { maxUses: number; /** Höchstlänge je abgerufener Seite in Token */ maxTokens?: number };
  /**
   * Websuche erzwingen (seit 0.6.0, KP-2026-W44-05). Nur Anthropic setzt das um und nur, wenn die App es für das
   * Modell zulässt (sucheErzwingbar); die übrigen Adapter ignorieren es, die App zählt die Suchen nach.
   */
  erzwingen?: "websuche";
}

export type Fortschritt =
  | { art: "suche"; text: string }
  | { art: "abruf"; text: string }
  | { art: "schreibt"; zeichen: number }
  | { art: "denkt" }
  | { art: "fortsetzung"; runde: number }
  | { art: "wiederholung"; grund: string; warteMs: number };

export interface LlmAnfrage {
  modell: string;
  system: SystemTeil[];
  nachrichten: Nachricht[];
  maxTokens: number;
  aufwand?: Aufwand;
  werkzeuge?: Werkzeuge;
  /** Erzwingt eine JSON-Antwort nach diesem (einfachen) Schema */
  jsonSchema?: object;
  signal?: AbortSignal;
  fortschritt?: (f: Fortschritt) => void;
}

export interface Nutzung {
  eingabe: number;
  ausgabe: number;
  cacheSchreiben: number;
  cacheLesen: number;
  websuchen: number;
  abrufe: number;
}

export interface Zitat {
  url: string;
  titel: string;
  text?: string;
}

export interface Fundstelle {
  url: string;
  titel: string;
  stand?: string;
}

export interface AbrufFehler {
  url: string;
  code: string;
}

export interface LlmAntwort {
  modell: string;
  /** Zusammengesetzter Antworttext */
  text: string;
  /** Inhaltsblöcke der letzten Antwort, wie vom Anbieter geliefert */
  inhalt: any[];
  zitate: Zitat[];
  fundstellen: Fundstelle[];
  suchen: string[];
  abrufe: string[];
  /** Seitenabrufe, die der Anbieter verweigert oder nicht geschafft hat */
  abrufFehler: AbrufFehler[];
  nutzung: Nutzung;
  /** Kosten in USD, soweit Preise bekannt */
  kostenUsd: number | null;
  stopGrund: string;
  dauerMs: number;
  /** Zahl der Anfragen (Fortsetzungen eingeschlossen) */
  runden: number;
}

export interface LlmAnbieter {
  id: string;
  senden(a: LlmAnfrage): Promise<LlmAntwort>;
}

export class AnbieterFehler extends Error {
  constructor(
    message: string,
    public status?: number,
    public art?: string,
    /** Bis zum Fehler empfangene Inhaltsblöcke (für das Laufprotokoll) */
    public teilinhalt?: any[],
  ) {
    super(message);
    this.name = "AnbieterFehler";
  }
}

/**
 * Typische Meldungen der Browser, wenn eine Verbindung mitten im Strom abreißt. Seit 0.6.2 nur noch die Meldungsmuster
 * (TP-2026-W44-04): Ein beliebiger TypeError, etwa ein Programmierfehler in der Stromverarbeitung, gilt nicht mehr als
 * Netzabbruch. Die Adapter erkennen den Abriss am Ort des Lesens (http.ts, LeseFehler), nicht an der Fehlerklasse.
 */
export function istVerbindungsabbruch(e: unknown): boolean {
  const m = String((e as any)?.message || e || "");
  return /load failed|failed to fetch|networkerror|network error|network connection was lost|terminated/i.test(m);
}

export const TEXT_VERBINDUNGSABBRUCH =
  "Die Verbindung zum Anbieter ist während der Antwort abgerissen. Häufige Ursachen: gesperrter Bildschirm, Wechsel in eine andere App oder ein Netzwechsel (WLAN/Mobilfunk). Bitte das Gerät während des Laufs entsperrt und die Seite im Vordergrund lassen.";

export function leereNutzung(): Nutzung {
  return { eingabe: 0, ausgabe: 0, cacheSchreiben: 0, cacheLesen: 0, websuchen: 0, abrufe: 0 };
}

export function addiereNutzung(a: Nutzung, b: Nutzung): Nutzung {
  return {
    eingabe: a.eingabe + b.eingabe,
    ausgabe: a.ausgabe + b.ausgabe,
    cacheSchreiben: a.cacheSchreiben + b.cacheSchreiben,
    cacheLesen: a.cacheLesen + b.cacheLesen,
    websuchen: a.websuchen + b.websuchen,
    abrufe: a.abrufe + b.abrufe,
  };
}
