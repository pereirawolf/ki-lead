// Betreiberkonfiguration (seit 0.6.17, TP-2026-W44-48): Eine Stelle, die KI-LEAD selbst betreibt, legt zur Build-Zeit
// fest, welche KI-Anbieter die App nutzen darf, ob es einen eigenen Endpunkt gibt (TP-2026-W44-49) und welche Ablage der
// API-Schlüssel vorgegeben ist (TP-2026-W44-50). Format „ki-lead-betrieb/1“, Schema betrieb/betrieb.schema.json, Anleitung
// docs/BETRIEB.md.
//
// - Gebaut wird mit `KI_LEAD_BETRIEB=<pfad> npm run build`; vite.config.ts liest die Datei, prüft sie mit
//   `betriebPruefen` (ein Fehler bricht den Build ab), schreibt `connect-src` der Content-Security-Policy in index.html
//   und gibt die Konfiguration als Konstante __KI_LEAD_BETRIEB__ an die App.
// - Ohne Konfiguration entsteht der öffentliche Build (OEFFENTLICH) mit genau der bisherigen Policy.
// - Policy und Zulassung der Anbieter haben dieselbe Quelle: `verbindungsziele`. Die Adapter prüfen ihre Adresse gegen
//   dieselben Ziele (Ollama: ollamaAdresseZulaessig, Endpunkt der Stelle: stelleAdresseZulaessig).
//
// Ohne Abhängigkeiten, damit vite.config.ts das Modul in Node laden kann.

export const BETRIEB_FORMAT = "ki-lead-betrieb/1";

/** Anbieter, die eine Konfiguration freigeben kann */
export type FreigabeId = "anthropic" | "openai" | "mistral" | "ollama" | "stelle";
export const FREIGABE_IDS: FreigabeId[] = ["anthropic", "openai", "mistral", "ollama", "stelle"];

export type AblageVorgabe = "geraet" | "sitzung" | "passphrase" | "system";
export const ABLAGE_VORGABEN: AblageVorgabe[] = ["geraet", "sitzung", "passphrase", "system"];

/** Endpunkt der Stelle (TP-2026-W44-49): Chat Completions unter <basisUrl>/chat/completions */
export interface StelleKonfiguration {
  /** Basisadresse ohne „/chat/completions“, nur https, ohne Abfrage und Anker */
  basisUrl: string;
  /** Modell, wie der Endpunkt es erwartet; in der App als „stelle:<modell>“ */
  modell: string;
  /** Anzeige in der Oberfläche, etwa der Name des Dienstes; Vorgabe „Endpunkt der Stelle“ */
  name?: string;
  /** Preise in USD je 1 Mio. Token; ohne Angabe bleiben die Kosten „nicht erfasst“ */
  preise?: { eingabe: number; ausgabe: number };
}

export interface Betrieb {
  format: typeof BETRIEB_FORMAT;
  /** Bezeichnung des Builds, angezeigt unter „Über KI-LEAD“ und im Laufprotokoll */
  bezeichnung: string;
  /** Freigegebene Anbieter in der gewünschten Reihenfolge; „stelle“ verlangt den Abschnitt `stelle` */
  anbieter: FreigabeId[];
  stelle?: StelleKonfiguration;
  /** Vorgabe der Schlüsselablage (E4: ohne Angabe der Gerätespeicher) */
  schluesselablage?: AblageVorgabe;
}

/** Öffentlicher Build: alle bisherigen Anbieter, kein Endpunkt der Stelle, Vorgabe Gerätespeicher */
export const OEFFENTLICH: Betrieb = {
  format: BETRIEB_FORMAT,
  bezeichnung: "Öffentlicher Build",
  anbieter: ["anthropic", "openai", "mistral", "ollama"],
};

/** Verbindungsziele je Anbieter (ohne den Endpunkt der Stelle, der aus der Konfiguration kommt) */
export const ZIELE: Record<Exclude<FreigabeId, "stelle">, string[]> = {
  anthropic: ["https://api.anthropic.com"],
  openai: ["https://api.openai.com"],
  mistral: ["https://api.eu.mistral.ai", "https://api.mistral.ai"],
  ollama: ["http://localhost:11434", "http://127.0.0.1:11434"],
};

/** Herkunft (Schema, Host, Port) einer Basisadresse, wie sie in connect-src steht */
export function herkunft(url: string): string {
  return new URL(url).origin;
}

/**
 * Ziele für connect-src in fester Reihenfolge (Anthropic, OpenAI, Mistral, Endpunkt der Stelle, Ollama), damit der
 * öffentliche Build genau die bisherige Policy erhält; Doppeltes nur einmal.
 */
export function verbindungsziele(b: Betrieb): string[] {
  const frei = new Set(b.anbieter);
  const ziele: string[] = [];
  for (const id of ["anthropic", "openai", "mistral"] as const) if (frei.has(id)) ziele.push(...ZIELE[id]);
  if (frei.has("stelle") && b.stelle) ziele.push(herkunft(b.stelle.basisUrl));
  if (frei.has("ollama")) ziele.push(...ZIELE.ollama);
  return [...new Set(ziele)];
}

/** Direktive connect-src der Content-Security-Policy */
export function connectSrc(b: Betrieb): string {
  return ["connect-src 'self'", ...verbindungsziele(b)].join(" ");
}

/** Setzt connect-src in der Policy einer index.html; fehlt die Direktive, ist das ein Fehler */
export function cspEinsetzen(html: string, b: Betrieb): string {
  const muster = /(<meta http-equiv="Content-Security-Policy" content="[^"]*?)connect-src [^;"]*/;
  if (!muster.test(html)) throw new Error("index.html: connect-src in der Content-Security-Policy nicht gefunden");
  return html.replace(muster, `$1${connectSrc(b)}`);
}

const URL_MUSTER = /^https:\/\/[^\s/?#]+(\/[^\s?#]*)?$/;
const MODELL_MUSTER = /^[\w.:/@-]{1,120}$/;

/**
 * Prüft eine Betreiberkonfiguration und gibt sie bereinigt zurück (Basisadresse ohne abschließenden Schrägstrich).
 * Fehler: Error mit allen Befunden, je einer pro Zeile.
 */
export function betriebPruefen(x: unknown): Betrieb {
  const f: string[] = [];
  const o = x as Record<string, any>;
  if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("Betreiberkonfiguration: kein JSON-Objekt");
  const erlaubt = new Set(["$schema", "format", "bezeichnung", "anbieter", "stelle", "schluesselablage"]);
  for (const k of Object.keys(o)) if (!erlaubt.has(k)) f.push(`unbekanntes Feld „${k}“`);
  if (o.format !== BETRIEB_FORMAT) f.push(`format muss „${BETRIEB_FORMAT}“ sein`);
  if (typeof o.bezeichnung !== "string" || !o.bezeichnung.trim() || o.bezeichnung.length > 120) f.push("bezeichnung: Text mit 1 bis 120 Zeichen");
  const anbieter: unknown = o.anbieter;
  if (!Array.isArray(anbieter) || anbieter.length === 0) f.push("anbieter: Liste mit mindestens einem Anbieter");
  else {
    for (const a of anbieter) if (!FREIGABE_IDS.includes(a as FreigabeId)) f.push(`anbieter: unbekannt „${String(a)}“ (erlaubt: ${FREIGABE_IDS.join(", ")})`);
    if (new Set(anbieter).size !== anbieter.length) f.push("anbieter: ein Anbieter steht doppelt");
  }
  const mitStelle = Array.isArray(anbieter) && anbieter.includes("stelle");
  let stelle: StelleKonfiguration | undefined;
  if (o.stelle !== undefined) {
    const s = o.stelle as Record<string, any>;
    if (!s || typeof s !== "object" || Array.isArray(s)) f.push("stelle: Objekt erwartet");
    else {
      for (const k of Object.keys(s)) if (!["basisUrl", "modell", "name", "preise"].includes(k)) f.push(`stelle: unbekanntes Feld „${k}“`);
      if (typeof s.basisUrl !== "string" || !URL_MUSTER.test(s.basisUrl.trim()))
        f.push("stelle.basisUrl: https-Adresse ohne Abfrage und Anker, etwa https://ki.example.de/v1");
      if (typeof s.modell !== "string" || !MODELL_MUSTER.test(s.modell)) f.push("stelle.modell: Kennung des Modells (Buchstaben, Ziffern, . : / @ _ -)");
      if (s.name !== undefined && (typeof s.name !== "string" || !s.name.trim() || s.name.length > 60)) f.push("stelle.name: Text mit 1 bis 60 Zeichen");
      if (s.preise !== undefined) {
        const p = s.preise as Record<string, any>;
        const zahl = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
        if (!p || typeof p !== "object" || !zahl(p.eingabe) || !zahl(p.ausgabe) || Object.keys(p).some((k) => !["eingabe", "ausgabe"].includes(k)))
          f.push("stelle.preise: { eingabe, ausgabe } in USD je 1 Mio. Token, jeweils ≥ 0");
      }
      if (typeof s.basisUrl === "string" && typeof s.modell === "string")
        stelle = {
          basisUrl: s.basisUrl.trim().replace(/\/+$/, ""),
          modell: s.modell,
          ...(s.name !== undefined ? { name: String(s.name).trim() } : {}),
          ...(s.preise !== undefined ? { preise: { eingabe: s.preise.eingabe, ausgabe: s.preise.ausgabe } } : {}),
        };
    }
  }
  if (mitStelle && o.stelle === undefined) f.push("anbieter enthält „stelle“, aber der Abschnitt „stelle“ fehlt");
  if (!mitStelle && o.stelle !== undefined) f.push("Abschnitt „stelle“ ohne „stelle“ unter anbieter");
  if (o.schluesselablage !== undefined && !ABLAGE_VORGABEN.includes(o.schluesselablage)) f.push(`schluesselablage: eine von ${ABLAGE_VORGABEN.join(", ")}`);
  if (f.length) throw new Error(`Betreiberkonfiguration ungültig:\n- ${f.join("\n- ")}`);
  return {
    format: BETRIEB_FORMAT,
    bezeichnung: o.bezeichnung.trim(),
    anbieter: [...(anbieter as FreigabeId[])],
    ...(stelle ? { stelle } : {}),
    ...(o.schluesselablage ? { schluesselablage: o.schluesselablage } : {}),
  };
}

/** Konfiguration des Builds mit Prüfsumme (SHA-256 der Datei, hexadezimal); null im öffentlichen Build */
export interface BetriebImBuild {
  konfiguration: Betrieb;
  sha256: string;
}

// Aus vite.config.ts (define); in Node beim Laden der Konfiguration nicht gesetzt
declare const __KI_LEAD_BETRIEB__: BetriebImBuild | null | undefined;
const EINGEBAUT: BetriebImBuild | null = typeof __KI_LEAD_BETRIEB__ === "undefined" ? null : __KI_LEAD_BETRIEB__;

let aktuell: BetriebImBuild | null = EINGEBAUT;

/** Gültige Konfiguration: die des Builds oder die öffentliche */
export function betrieb(): Betrieb {
  return aktuell?.konfiguration ?? OEFFENTLICH;
}

/** Konfiguration mit Prüfsumme, null im öffentlichen Build */
export function betriebImBuild(): BetriebImBuild | null {
  return aktuell;
}

/** Nur für Tests: andere Konfiguration annehmen (null: öffentlicher Build) */
export function betriebFuerTests(b: BetriebImBuild | null): void {
  aktuell = b;
}
