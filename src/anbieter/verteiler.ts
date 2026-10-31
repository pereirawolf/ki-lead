// Wählt den Anbieter nach der Modellkennung. Die Pipeline kennt nur LlmAnbieter.
//
// Seit 0.6.3 (TP-2026-W44-26) beschreibt eine Registry je Anbieter Kennung, Fähigkeiten, Preisbesonderheiten und
// den Bau des Adapters; ein weiterer Anbieter ist ein Eintrag hier plus Adapter, Preise und Oberfläche. Eine Kennung, die
// keinem Anbieter gehört, ist ein Fehler, statt still Anthropic zugeordnet zu werden (bis 0.6.2 fiel etwa „llama3“ auf
// Anthropic).

import { betrieb } from "./betrieb";
import { gezaehlt } from "./laufzaehler";
import { AnthropicAnbieter } from "./anthropic";
import { aufwandStufenFuer } from "./aufwand";
import { mistralWerkzeuge, MistralAnbieter } from "./mistral";
import { OLLAMA_PRAEFIX, OllamaAnbieter } from "./ollama";
import { OpenAiAnbieter } from "./openai";
import { optionenVollstaendig, type AnbieterOptionen, type AnbieterOptionenTeil } from "./optionen";
import { aufschlag } from "./preise";
import { STELLE_NAME, STELLE_PRAEFIX, StelleAnbieter } from "./stelle";
import { AnbieterFehler, type Aufwand, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "./typen";

export type AnbieterId = "anthropic" | "openai" | "mistral" | "ollama" | "stelle";

/** Anbieter mit API-Schlüssel; Ollama läuft lokal ohne Schlüssel */
export type SchluesselId = Exclude<AnbieterId, "ollama">;

export type Schluessel = Record<SchluesselId, string>;

export const LEERE_SCHLUESSEL: Schluessel = { anthropic: "", openai: "", mistral: "", stelle: "" };

/** Was ein Modell mit den gewählten Optionen kann */
export interface Faehigkeiten {
  websuche: boolean;
  abruf: boolean;
  /** Angebotene Stufen des Aufwands */
  aufwand: Aufwand[];
}

/** Beschreibung eines Anbieters in der Registry (seit 0.6.3, TP-2026-W44-26) */
export interface AnbieterBeschreibung {
  id: AnbieterId;
  name: string;
  /** Form der Kennung für Hinweise, z. B. „claude-…“ */
  kennung: string;
  /** Gehört die Modellkennung zu diesem Anbieter? */
  erkennt: (modell: string) => boolean;
  faehigkeiten: (modell: string, optionen: AnbieterOptionen) => Faehigkeiten;
  /** Preisbesonderheiten; die Preise je Modell stehen in preise.ts */
  preise: {
    /** Ohne Kosten beim Anbieter (lokal) */
    kostenlos: boolean;
    /** Gilt der Aufschlag des regionalen Endpunkts? Ohne Angabe des Endpunkts nicht (wie bis 0.6.2) */
    regional: (optionen: AnbieterOptionenTeil) => boolean;
  };
  /** Braucht einen API-Schlüssel */
  schluessel: boolean;
  bauen: (schluessel: string, optionen: AnbieterOptionen) => LlmAnbieter;
}

const OHNE_REGION = () => false;

export const REGISTRY: AnbieterBeschreibung[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    kennung: "claude-…",
    erkennt: (m) => /^claude-/i.test(m),
    faehigkeiten: (m) => ({ websuche: true, abruf: true, aufwand: aufwandStufenFuer(m) }),
    preise: { kostenlos: false, regional: OHNE_REGION },
    schluessel: true,
    bauen: (k) => new AnthropicAnbieter(k),
  },
  {
    id: "openai",
    name: "OpenAI",
    kennung: "gpt-…",
    erkennt: (m) => /^(gpt-|o\d|chatgpt-)/i.test(m),
    faehigkeiten: (m) => ({ websuche: true, abruf: true, aufwand: aufwandStufenFuer(m) }),
    preise: { kostenlos: false, regional: OHNE_REGION },
    schluessel: true,
    bauen: (k) => new OpenAiAnbieter(k),
  },
  {
    id: "mistral",
    name: "Mistral",
    kennung: "mistral-…",
    erkennt: (m) => /^(mistral-|ministral-|magistral-|codestral-|pixtral-|open-mistral-)/i.test(m),
    // Über den EU-Endpunkt keine Werkzeuge, global nur die Websuche
    faehigkeiten: (m, o) => ({ ...mistralWerkzeuge(o.mistral.endpunkt), aufwand: aufwandStufenFuer(m) }),
    preise: { kostenlos: false, regional: (o) => o.mistral?.endpunkt === "eu" },
    schluessel: true,
    bauen: (k, o) => new MistralAnbieter(k, undefined, undefined, o.mistral.endpunkt),
  },
  {
    id: "ollama",
    name: "Ollama (lokal)",
    kennung: `${OLLAMA_PRAEFIX}<modell>`,
    erkennt: (m) => m.toLowerCase().startsWith(OLLAMA_PRAEFIX) && m.length > OLLAMA_PRAEFIX.length,
    faehigkeiten: (m) => ({ websuche: false, abruf: false, aufwand: aufwandStufenFuer(m) }),
    preise: { kostenlos: true, regional: OHNE_REGION },
    schluessel: false,
    bauen: (_k, o) => new OllamaAnbieter(o.ollama.basisUrl),
  },
  {
    // Endpunkt der Stelle (seit 0.6.17, TP-2026-W44-49): nur im Betreiberbuild freigegeben; Chat Completions ohne Werkzeuge
    id: "stelle",
    name: STELLE_NAME,
    kennung: `${STELLE_PRAEFIX}<modell>`,
    erkennt: (m) => m.toLowerCase().startsWith(STELLE_PRAEFIX) && m.length > STELLE_PRAEFIX.length,
    faehigkeiten: (m) => ({ websuche: false, abruf: false, aufwand: aufwandStufenFuer(m) }),
    preise: { kostenlos: false, regional: OHNE_REGION },
    schluessel: true,
    bauen: (k) => new StelleAnbieter(k),
  },
];

/** Alle Anbieter der App in der Reihenfolge der Registry */
export const ANBIETER_IDS: AnbieterId[] = REGISTRY.map((a) => a.id);

/**
 * Freigegebene Anbieter dieses Builds in der Reihenfolge der Betreiberkonfiguration (seit 0.6.17, TP-2026-W44-48);
 * im öffentlichen Build Anthropic, OpenAI, Mistral und Ollama. Listen, Karten und KI-Profile zeigen nur sie.
 */
export function freigegebeneAnbieter(): AnbieterId[] {
  return betrieb().anbieter.filter((a): a is AnbieterId => (ANBIETER_IDS as string[]).includes(a));
}

/** Ist der Anbieter in diesem Build freigegeben? */
export function freigegeben(id: AnbieterId): boolean {
  return betrieb().anbieter.includes(id);
}

/** Ist das Modell bekannt und sein Anbieter freigegeben? */
export function modellFreigegeben(modell: string): boolean {
  const id = bekannterAnbieter(modell);
  return !!id && freigegeben(id);
}

/** Fehlertext für ein Modell, dessen Anbieter dieser Build nicht freigibt */
export function nichtFreigegebenText(modell: string): string {
  const id = bekannterAnbieter(modell);
  return `${id ? ANBIETER_NAME[id] : "Der Anbieter"} (${modell}) ist in diesem Build nicht freigegeben (Betreiberkonfiguration „${betrieb().bezeichnung}“).`;
}

export const ANBIETER_NAME = Object.fromEntries(REGISTRY.map((a) => [a.id, a.name])) as Record<AnbieterId, string>;

/** Beschreibung eines Anbieters */
export function beschreibung(id: AnbieterId): AnbieterBeschreibung {
  return REGISTRY.find((a) => a.id === id)!;
}

/** Anbieter einer Modellkennung oder undefined, wenn keiner sie erkennt */
export function bekannterAnbieter(modell: string): AnbieterId | undefined {
  return REGISTRY.find((a) => a.erkennt(modell))?.id;
}

/** Fehlertext für eine Kennung ohne Anbieter */
export function unbekanntesModellText(modell: string): string {
  return `Die Modellkennung „${modell}“ gehört zu keinem bekannten Anbieter (erwartet: ${REGISTRY.map((a) => a.kennung).join(", ")}).`;
}

/** Anbieter einer Modellkennung; eine unbekannte Kennung ist ein Fehler (seit 0.6.3, TP-2026-W44-26) */
export function anbieterVon(modell: string): AnbieterId {
  const id = bekannterAnbieter(modell);
  if (!id) throw new AnbieterFehler(unbekanntesModellText(modell), 0, "modell");
  return id;
}

/** Braucht der Anbieter einen API-Schlüssel? */
export function schluesselNoetig(id: AnbieterId): id is SchluesselId {
  return beschreibung(id).schluessel;
}

/** Ist für den Anbieter ein Schlüssel hinterlegt bzw. keiner nötig? */
export function hatSchluessel(id: AnbieterId, s: Schluessel): boolean {
  return !schluesselNoetig(id) || !!s[id];
}

/** Namen mehrerer Anbieter als Aufzählung: „Anthropic“, „Anthropic und OpenAI“, „Anthropic, OpenAI und Mistral“ */
export function anbieterListe(ids: AnbieterId[]): string {
  const n = ids.map((a) => ANBIETER_NAME[a]);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} und ${n[n.length - 1]}` : n.join("");
}

/** Anbieter ohne Schlüssel unter den genannten Modellen (für Hinweise vor dem Start); unbekannte Kennungen zählen nicht. */
export function fehlendeSchluessel(modelle: string[], s: Schluessel): AnbieterId[] {
  const ids = modelle.map(bekannterAnbieter).filter((x): x is AnbieterId => !!x);
  return [...new Set(ids)].filter((a) => !hatSchluessel(a, s));
}

/** Fähigkeiten eines Modells mit diesen Optionen; eine unbekannte Kennung kann nichts */
export function faehigkeitenFuer(modell: string, optionen: AnbieterOptionenTeil = {}): Faehigkeiten {
  const id = bekannterAnbieter(modell);
  if (!id) return { websuche: false, abruf: false, aufwand: aufwandStufenFuer(modell) };
  return beschreibung(id).faehigkeiten(modell, optionenVollstaendig(optionen));
}

/** Faktor auf den Listenpreis: Aufschlag des regionalen Endpunkts, sofern der Anbieter ihn kennt und er gewählt ist */
export function aufschlagFuer(modell: string, optionen: AnbieterOptionenTeil = {}): number {
  const id = bekannterAnbieter(modell);
  return aufschlag(modell, !!id && beschreibung(id).preise.regional(optionen));
}

/** Wahl, die über den Schlüssel hinaus bestimmt, wie ein Anbieter angesprochen wird (seit 0.6.3 je Anbieter) */
export type VerteilerOptionen = AnbieterOptionenTeil;

export class Verteiler implements LlmAnbieter {
  id = "verteiler";
  private cache: Partial<Record<AnbieterId, LlmAnbieter>> = {};
  constructor(
    private schluessel: Schluessel,
    private fabrik?: (id: AnbieterId, schluessel: string) => LlmAnbieter,
    private optionen: VerteilerOptionen = {},
  ) {}

  /** Verteiler mit den Optionen aus den Einstellungen */
  static fuer(schluessel: Schluessel, optionen: VerteilerOptionen): Verteiler {
    return new Verteiler(schluessel, undefined, optionen);
  }

  private bauen(id: AnbieterId, k: string): LlmAnbieter {
    if (this.fabrik) return this.fabrik(id, k);
    return beschreibung(id).bauen(k, optionenVollstaendig(this.optionen));
  }

  senden(a: LlmAnfrage): Promise<LlmAntwort> {
    const id = bekannterAnbieter(a.modell);
    if (!id) return Promise.reject(new AnbieterFehler(unbekanntesModellText(a.modell), 0, "modell"));
    if (!freigegeben(id)) return Promise.reject(new AnbieterFehler(nichtFreigegebenText(a.modell), 0, "freigabe"));
    const k = schluesselNoetig(id) ? this.schluessel[id] : "";
    if (schluesselNoetig(id) && !k)
      return Promise.reject(
        new AnbieterFehler(`Für ${ANBIETER_NAME[id]} (${a.modell}) ist kein API-Schlüssel hinterlegt. Bitte unter „Einstellungen“ eintragen.`, 0, "schluessel"),
      );
    // Jede Anfrage zählt für den KI-Chip der Kopfleiste, bis sie beendet ist (seit 0.6.12, KP-2026-W44-01)
    return gezaehlt((this.cache[id] ??= this.bauen(id, k)).senden(a));
  }
}
