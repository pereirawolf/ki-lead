// Listenpreise in USD je Million Token (Stand 18.10.2026, Mistral 24.10.2026; ohne Gewähr). Ollama (lokal) 0.
// Quellen: https://platform.claude.com/docs/en/about-claude/pricing, https://developers.openai.com/api/docs/pricing und
// https://docs.mistral.ai/inference/pricing (Token). Den Preis der Mistral-Websuche (30 USD je 1 000 Aufrufe) nennt
// diese Seite nicht; er stammt aus einer Übersicht Dritter (developer.puter.com, Oktober 2026) und ist unbestätigt.
// Die App zeigt damit nur eine Schätzung; maßgeblich ist die Abrechnung des Anbieters.

import type { Nutzung } from "./typen";

interface Preis {
  eingabe: number;
  cacheSchreiben: number;
  cacheLesen: number;
  ausgabe: number;
}

interface PreisRegel {
  muster: RegExp;
  preis: Preis;
  /** Jeder Werkzeugaufruf (auch Seitenöffnung) kostet wie eine Websuche (OpenAI) */
  abrufKostet?: boolean;
  /** USD je Websuche, abweichend von PREIS_WEBSUCHE */
  websuche?: number;
  /** Höhere Preise ab dieser Promptlänge (Token, inkl. Cache) */
  langAb?: number;
  lang?: Preis;
  /** Faktor auf alle Preise am regionalen Endpunkt (Mistral EU: 1,1), seit 0.5.10 */
  regional?: number;
}

/** Aufschlag des regionalen Mistral-Endpunkts auf alle Tokenpreise (Mistral: 1,1 × Listenpreis) */
export const MISTRAL_EU_FAKTOR = 1.1;

const REGELN: PreisRegel[] = [
  { muster: /^claude-fable-5-1/, preis: { eingabe: 10, cacheSchreiben: 12.5, cacheLesen: 0.25, ausgabe: 50 } },
  { muster: /^claude-opus-5-5/, preis: { eingabe: 4, cacheSchreiben: 5, cacheLesen: 0.2, ausgabe: 20 } },
  { muster: /^claude-sonnet-5-5/, preis: { eingabe: 2, cacheSchreiben: 2.5, cacheLesen: 0.1, ausgabe: 10 } },
  {
    muster: /^claude-haiku-5-5/,
    preis: { eingabe: 0.1, cacheSchreiben: 0.125, cacheLesen: 0.01, ausgabe: 0.5 },
    langAb: 100_000,
    lang: { eingabe: 0.5, cacheSchreiben: 0.625, cacheLesen: 0.05, ausgabe: 2.5 },
  },
  // OpenAI (Standard, kurzer Kontext; Langkontext-Preise sind höher und hier nicht abgebildet)
  { muster: /^gpt-6-astra/, preis: { eingabe: 10, cacheSchreiben: 12.5, cacheLesen: 1, ausgabe: 50 }, abrufKostet: true },
  { muster: /^gpt-6\.1-sol/, preis: { eingabe: 2, cacheSchreiben: 2.5, cacheLesen: 0.1, ausgabe: 10 }, abrufKostet: true },
  { muster: /^gpt-6-luna/, preis: { eingabe: 0.1, cacheSchreiben: 0.125, cacheLesen: 0.01, ausgabe: 0.5 }, abrufKostet: true },
  // Mistral (kein Aufpreis für das Schreiben in den Cache; die Conversations-API meldet gecachte Token nicht gesondert)
  { muster: /^mistral-large-4/, preis: { eingabe: 1.36, cacheSchreiben: 1.36, cacheLesen: 0.14, ausgabe: 4.18 }, websuche: 0.03, regional: MISTRAL_EU_FAKTOR },
  { muster: /^mistral-medium-3-5/, preis: { eingabe: 1.5, cacheSchreiben: 1.5, cacheLesen: 0.15, ausgabe: 7.5 }, websuche: 0.03, regional: MISTRAL_EU_FAKTOR },
  {
    muster: /^mistral-small-2603/,
    preis: { eingabe: 0.15, cacheSchreiben: 0.15, cacheLesen: 0.015, ausgabe: 0.6 },
    websuche: 0.03,
    regional: MISTRAL_EU_FAKTOR,
  },
  // Ollama (seit 0.6.3, TP-2026-W44-26): lokale Modelle ohne Kosten beim Anbieter; Rechenzeit und Strom zählen nicht
  { muster: /^ollama:/, preis: { eingabe: 0, cacheSchreiben: 0, cacheLesen: 0, ausgabe: 0 }, websuche: 0 },
];

/** USD je Websuche (Anthropic, OpenAI) */
export const PREIS_WEBSUCHE = 0.01;

export const PREISSTAND = "18.10.2026 (Mistral 24.10.2026)";

/** Listenpreis für Ausgabetoken (USD je Million, kurzer Kontext); null, wenn das Modell nicht in der Tabelle steht. */
export function ausgabePreis(modell: string): number | null {
  return REGELN.find((x) => x.muster.test(modell))?.preis.ausgabe ?? null;
}

/**
 * Faktor auf den Listenpreis je Modell und Endpunkt (seit 0.5.10, AV-2026-W43-06): Mistral über den EU-Endpunkt 1,1,
 * sonst 1. Ist-Kosten (Mistral-Anbieter) und Schätzung vor dem Lauf (`schaetzeStufe`) verwenden ihn gemeinsam. Seit
 * 0.6.3 (TP-2026-W44-26) sagt `regional`, ob der regionale Endpunkt gewählt ist; das weiß die Beschreibung des Anbieters
 * (`aufschlagFuer` in verteiler.ts).
 */
export function aufschlag(modell: string, regional: boolean): number {
  const r = REGELN.find((x) => x.muster.test(modell));
  return regional && r?.regional ? r.regional : 1;
}

/** Kosten einer einzelnen Anfrage. null, wenn das Modell nicht in der Tabelle steht. */
export function kostenAnfrage(modell: string, n: Nutzung): number | null {
  const r = REGELN.find((x) => x.muster.test(modell));
  if (!r) return null;
  const prompt = n.eingabe + n.cacheLesen + n.cacheSchreiben;
  const p = r.langAb && r.lang && prompt > r.langAb ? r.lang : r.preis;
  const token = (n.eingabe * p.eingabe + n.cacheSchreiben * p.cacheSchreiben + n.cacheLesen * p.cacheLesen + n.ausgabe * p.ausgabe) / 1_000_000;
  return token + (n.websuchen + (r.abrufKostet ? n.abrufe : 0)) * (r.websuche ?? PREIS_WEBSUCHE);
}

export function formatUsd(x: number | null | undefined): string {
  if (x === null || x === undefined) return "unbekannt";
  if (x < 0.01) return "< 0,01 USD";
  return x.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD";
}
