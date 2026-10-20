// Listenpreise in USD je Million Token (Stand 18.10.2026, ohne Gewähr).
// Quellen: https://platform.claude.com/docs/en/about-claude/pricing und https://developers.openai.com/api/docs/pricing
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
  /** Höhere Preise ab dieser Promptlänge (Token, inkl. Cache) */
  langAb?: number;
  lang?: Preis;
}

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
];

/** USD je Websuche */
export const PREIS_WEBSUCHE = 0.01;

export const PREISSTAND = "18.10.2026";

/** Listenpreis für Ausgabetoken (USD je Million, kurzer Kontext); null, wenn das Modell nicht in der Tabelle steht. */
export function ausgabePreis(modell: string): number | null {
  return REGELN.find((x) => x.muster.test(modell))?.preis.ausgabe ?? null;
}

/** Kosten einer einzelnen Anfrage. null, wenn das Modell nicht in der Tabelle steht. */
export function kostenAnfrage(modell: string, n: Nutzung): number | null {
  const r = REGELN.find((x) => x.muster.test(modell));
  if (!r) return null;
  const prompt = n.eingabe + n.cacheLesen + n.cacheSchreiben;
  const p = r.langAb && r.lang && prompt > r.langAb ? r.lang : r.preis;
  const token = (n.eingabe * p.eingabe + n.cacheSchreiben * p.cacheSchreiben + n.cacheLesen * p.cacheLesen + n.ausgabe * p.ausgabe) / 1_000_000;
  return token + (n.websuchen + (r.abrufKostet ? n.abrufe : 0)) * PREIS_WEBSUCHE;
}

export function formatUsd(x: number | null | undefined): string {
  if (x === null || x === undefined) return "unbekannt";
  if (x < 0.01) return "< 0,01 USD";
  return x.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD";
}
