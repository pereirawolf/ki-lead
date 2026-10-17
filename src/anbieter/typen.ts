// Gemeinsame Schnittstelle für KI-Anbieter. Die Pipeline kennt nur diese Typen;
// die Übersetzung in die jeweilige API steckt in anthropic.ts (später openai.ts).

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
  abruf?: { maxUses: number };
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
  ) {
    super(message);
    this.name = "AnbieterFehler";
  }
}

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
