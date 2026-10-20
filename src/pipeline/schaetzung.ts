// Vorsichtige Schätzung von Dauer und Kosten je KI-Stufe aus gemessenen Läufen.
//
// Messgrundlage (Laufprotokolle vom 18.–20.10.2026, App 0.4.5–0.4.19, Beispielprofil):
// - S1: 16 Läufe der Testreihe „Ebola Nigeria“ (Haiku medium/high, Sonnet medium) und 7 Läufe „Ilka“ (Haiku medium)
// - Erfassung mit Websuche: 11 Läufe der Testreihe (Sonnet medium 5, Opus low 3, Opus medium 3), 2 mit PDF, 1 Fortschreibung
// - Verdichtung „Ilka“ (6 Eingangsmeldungen, ohne Websuche): Opus medium 4, Sonnet medium 2
// Die Spannen sind nach außen gerundet und enthalten eine Reparatur in S3. Kosten nach Listenpreisen (preise.ts).
// Für nicht gemessene Kombinationen wird nur der Preis aus einer gemessenen Variante gleicher Art hochgerechnet;
// eine Dauer wird dann nicht angegeben.

import type { Aufwand } from "../anbieter/typen";
import { ausgabePreis } from "../anbieter/preise";

export type SchaetzArt = "s1" | "erfassung" | "verdichtung";

export interface Schaetzung {
  /** Dauer in Sekunden (von, bis); null ohne Messwert */
  sekunden: [number, number] | null;
  /** Kosten in USD (von, bis); null, wenn kein Preis bekannt ist */
  usd: [number, number] | null;
  /** true: Messwerte für genau dieses Modell und diesen Aufwand */
  gemessen: boolean;
}

interface Messwert {
  sekunden: [number, number];
  usd: [number, number];
}

/** Schlüssel: Art|Modell|Aufwand */
export const MESSWERTE: Record<string, Messwert> = {
  // gemessen 7–41 s, höchstens 0,011 USD
  "s1|claude-haiku-5-5|medium": { sekunden: [10, 60], usd: [0, 0.02] },
  // gemessen 18–37 s, höchstens 0,008 USD
  "s1|claude-haiku-5-5|high": { sekunden: [15, 60], usd: [0, 0.02] },
  // gemessen 9–12 s, 0,02–0,12 USD (0,12 ohne Cache)
  "s1|claude-sonnet-5-5|medium": { sekunden: [10, 30], usd: [0.02, 0.15] },
  // gemessen 46–168 s, 0,18–0,43 USD (mit PDF 168 s)
  "erfassung|claude-sonnet-5-5|medium": { sekunden: [45, 180], usd: [0.15, 0.6] },
  // gemessen 61–95 s, 0,42–0,74 USD
  "erfassung|claude-opus-5-5|low": { sekunden: [60, 150], usd: [0.4, 0.95] },
  // gemessen 209–285 s, 1,45–1,82 USD
  "erfassung|claude-opus-5-5|medium": { sekunden: [200, 360], usd: [1.4, 2.3] },
  // gemessen 161–298 s, 0,57–0,74 USD (298 s mit Neustart nach Verbindungsabbruch)
  "verdichtung|claude-sonnet-5-5|medium": { sekunden: [150, 360], usd: [0.55, 0.95] },
  // gemessen 298–410 s, 1,23–1,38 USD
  "verdichtung|claude-opus-5-5|medium": { sekunden: [300, 540], usd: [1.2, 1.75] },
};

const STUFEN: Aufwand[] = ["low", "medium", "high", "xhigh", "max"];

/**
 * Schätzung für eine Stufe. Reihenfolge: Messwert für Modell und Aufwand; sonst Preis einer gemessenen Variante
 * gleicher Art und gleichen Aufwands, hochgerechnet über den Ausgabepreis; sonst die mittlere Variante dieser Art,
 * bei höherem Aufwand mit doppelter Obergrenze, bei niedrigerem mit halber Untergrenze.
 */
export function schaetzeStufe(art: SchaetzArt, modell: string, aufwand: Aufwand): Schaetzung {
  const genau = MESSWERTE[`${art}|${modell}|${aufwand}`];
  if (genau) return { sekunden: genau.sekunden, usd: genau.usd, gemessen: true };
  const ziel = ausgabePreis(modell);
  if (ziel === null) return { sekunden: null, usd: null, gemessen: false };
  const kandidaten = Object.entries(MESSWERTE)
    .map(([k, m]) => ({ teile: k.split("|"), m }))
    .filter(({ teile }) => teile[0] === art);
  // Bezug ist die gemessene Variante mit dem ähnlichsten Preis (z. B. Fable → Opus, nicht Sonnet)
  const naechste = (liste: typeof kandidaten) =>
    liste
      .filter(({ teile }) => ausgabePreis(teile[1]) !== null)
      .sort((x, y) => Math.abs(Math.log(ausgabePreis(x.teile[1])! / ziel)) - Math.abs(Math.log(ausgabePreis(y.teile[1])! / ziel)))[0];
  const gleich = naechste(kandidaten.filter(({ teile }) => teile[2] === aufwand));
  const basis = gleich || naechste(kandidaten.filter(({ teile }) => teile[2] === "medium"));
  const preisBasis = basis ? ausgabePreis(basis.teile[1]) : null;
  if (!basis || !preisBasis) return { sekunden: null, usd: null, gemessen: false };
  const f = ziel / preisBasis;
  let [von, bis] = [basis.m.usd[0] * f, basis.m.usd[1] * f];
  if (!gleich) {
    const d = STUFEN.indexOf(aufwand) - STUFEN.indexOf("medium");
    if (d > 0) bis *= 2;
    if (d < 0) von *= 0.5;
  }
  return { sekunden: null, usd: [von, bis], gemessen: false };
}

export function dauerText(s: [number, number] | null): string {
  if (!s) return "Dauer ohne Messwert";
  const [a, b] = [Math.floor(s[0] / 60), Math.ceil(s[1] / 60)];
  if (b <= 1) return "unter 1 Minute";
  if (a < 1) return `bis ${b} Minuten`;
  return `${a}–${b} Minuten`;
}

function usd(x: number): string {
  return x.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function kostenText(k: [number, number] | null): string {
  if (!k) return "Kosten unbekannt (Modell ohne Preisangabe)";
  const [a, b] = [Math.floor(k[0] * 100) / 100, Math.ceil(k[1] * 100) / 100];
  if (b <= 0.01) return "unter 1 Cent";
  if (a < 0.01) return `bis ${usd(b)} USD`;
  return `${usd(a)}–${usd(b)} USD`;
}

/** Kurztext einer Stufe, z. B. „S2 (claude-opus-5-5, medium): 3–6 Minuten, 1,40–2,30 USD“. */
export function stufenText(kurz: string, modell: string, aufwand: Aufwand, s: Schaetzung): string {
  return `${kurz} (${modell}, ${aufwand}): ${s.sekunden ? dauerText(s.sekunden) + ", " : ""}${kostenText(s.usd)}${s.gemessen ? "" : " (grob, ohne Messwert)"}`;
}

/** Summe mehrerer Stufen; null, sobald eine Stufe keinen Wert hat. */
export function summe(werte: ([number, number] | null)[]): [number, number] | null {
  if (werte.some((w) => !w)) return null;
  return (werte as [number, number][]).reduce<[number, number]>((s, w) => [s[0] + w[0], s[1] + w[1]], [0, 0]);
}
