// Vorsichtige Schätzung von Dauer und Kosten je KI-Stufe aus gemessenen Läufen.
//
// Messgrundlage (Laufprotokolle vom 18.–23.10.2026, App 0.4.5–0.4.30, Beispielprofil):
// - S1: 16 Läufe der Testreihe „Ebola Nigeria“ (Haiku medium/high, Sonnet medium), 7 Läufe „Ilka“ (Haiku medium) und
//   3 Verdichtungen „Ilka“ mit Haiku high (21.10.2026, App 0.4.25, Grenze 128 000 Token)
// - Erfassung mit Websuche: 11 Läufe der Testreihe (Sonnet medium 5, Opus low 3, Opus medium 3), 2 mit PDF, 1 Fortschreibung
// - Verdichtung „Ilka“ (6 Eingangsmeldungen, ohne Websuche): Opus medium 5, Sonnet medium 2
// - Vergleichslauf Ilka nach Plan standardprofile-ilka vom 24./25.10.2026 (App 0.5.8, Profil 1.26.0, je drei Läufe der
//   Verdichtung, Mistral über den EU-Endpunkt; evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md). Er ersetzt
//   die Werte der Abnahme M4 vom 23.10.2026 (App 0.4.30, Profil 1.25.0) für S1 Haiku high, Opus medium, gpt-6-luna high
//   und gpt-6-astra medium; dazu Sonnet medium, gpt-6-astra high und Mistral. Folgereihe vom 25.10.2026 (App 0.5.10):
//   gpt-6-astra xhigh.
// - Mistral: vier Läufe der Verdichtung „Ilka“ vom 24.10.2026 (App 0.5.7, drei global, einer EU)
// Spannen nach außen gerundet (Sekunden auf 30 s, unter 60 s auf 10 s; USD auf 0,05, unter 0,10 USD auf 0,01). Neue oder
// überschrittene Obergrenzen: größter Messwert plus 25 % (Reserve, u. a. für eine Reparatur in S3); bestehende Spannen
// werden nicht verengt. Messwerte erst ab drei Läufen. Kosten nach Listenpreisen (preise.ts) ohne den Aufschlag des
// EU-Endpunkts von Mistral; `schaetzeStufe` schlägt ihn auf (seit 0.5.10, AV-2026-W43-06).
// Für nicht gemessene Kombinationen wird nur der Preis aus einer gemessenen Variante gleicher Art hochgerechnet;
// eine Dauer wird dann nicht angegeben.

import { aufwandAngeboten } from "../anbieter/aufwand";
import type { Aufwand } from "../anbieter/typen";
import { ausgabePreis, kostenAnfrage } from "../anbieter/preise";
import type { AnbieterOptionenTeil } from "../anbieter/optionen";
import { aufschlagFuer, bekannterAnbieter, beschreibung } from "../anbieter/verteiler";
import { leereNutzung } from "../anbieter/typen";

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
  // gemessen: Erfassung 18–37 s, höchstens 0,008 USD; Verdichtung „Ilka“ mit sechs Eingängen 88–95 s,
  // 0,019–0,020 USD, 20 821–22 134 Ausgabetoken (Läufe 20261021-163738-9s7d, -164604-u1kb, -165220-1hmp);
  // Vergleichslauf Ilka 19–132 s, 0,013–0,027 USD, 3 015–31 261 Ausgabetoken (Läufe 20261024-234833-ikph,
  // -235739-ifu7, 20261025-000620-07bh, -001616-n4c8, -002256-e85u, -002923-kg0c)
  "s1|claude-haiku-5-5|high": { sekunden: [15, 150], usd: [0, 0.03] },
  // gemessen 9–12 s, 0,02–0,12 USD (0,12 ohne Cache)
  "s1|claude-sonnet-5-5|medium": { sekunden: [10, 30], usd: [0.02, 0.15] },
  // gemessen 46–168 s, 0,18–0,43 USD (mit PDF 168 s)
  "erfassung|claude-sonnet-5-5|medium": { sekunden: [45, 180], usd: [0.15, 0.6] },
  // gemessen 61–95 s, 0,42–0,74 USD
  "erfassung|claude-opus-5-5|low": { sekunden: [60, 150], usd: [0.4, 0.95] },
  // gemessen 209–285 s, 1,45–1,82 USD
  "erfassung|claude-opus-5-5|medium": { sekunden: [200, 360], usd: [1.4, 2.3] },
  // gemessen 161–298 s, 0,57–0,74 USD (298 s mit Neustart nach Verbindungsabbruch); Vergleichslauf Ilka 287–381 s,
  // 0,82–0,96 USD, 45 361–61 598 Ausgabetoken (Läufe 20261025-001616-n4c8, -002256-e85u, -002923-kg0c); Plan
  // anbietermix-ilka (M2, App 0.5.10, S1 gpt-6-luna) 218–273 s, 0,68–0,76 USD, 32 916–45 985 Ausgabetoken (Läufe
  // 20261025-023714-ayac, -024218-d5hs, -024724-67tj)
  "verdichtung|claude-sonnet-5-5|medium": { sekunden: [150, 480], usd: [0.55, 1.25] },
  // gemessen 298–410 s, 1,23–1,63 USD (1,63 USD: 50 071 Ausgabetoken, 80 118 Token neu in den Cache, Lauf
  // 20261021-165220-1hmp, 408 s); Vergleichslauf Ilka 405–440 s, 1,74–1,88 USD, 50 060–54 484 Ausgabetoken (Läufe
  // 20261024-234833-ikph, -235739-ifu7, 20261025-000620-07bh). Obergrenze 2,20 USD (seit 0.4.31) bleibt als Reserve.
  // Plan anbietermix-ilka (M1, App 0.5.10, S1 gpt-6-luna) 302–316 s, 1,48–1,53 USD, 37 345–38 117 Ausgabetoken (Läufe
  // 20261025-021825-5rbg, -022443-2kjh, -023038-8o79); Untergrenze 300 s bleibt (keine Verengung)
  "verdichtung|claude-opus-5-5|medium": { sekunden: [300, 540], usd: [1.2, 2.2] },
  // Vergleichslauf Ilka 42–69 s, 0,005–0,008 USD, 4 659–6 856 Ausgabetoken (Läufe 20261024-232917-m97k,
  // -233231-qjlg, -233518-4god, -231048-0gjp, -231723-etee, -232232-l69n; Folgereihe 25.10.2026, App 0.5.10:
  // 20261025-013359-jytv, -014153-g3m8, -014823-0eu1 mit 52–58 s, 0,005–0,008 USD; Plan anbietermix-ilka, App 0.5.10:
  // 20261025-021825-5rbg, -022443-2kjh, -023038-8o79, -023714-ayac, -024218-d5hs, -024724-67tj mit 32–65 s,
  // 0,004–0,005 USD)
  "s1|gpt-6-luna|high": { sekunden: [30, 120], usd: [0, 0.02] },
  // Vergleichslauf Ilka 89,9–125 s, 1,22–1,24 USD, 6 495–7 118 Ausgabetoken (Läufe 20261024-232917-m97k,
  // -233231-qjlg, -233518-4god); Untergrenze seit 0.5.10 60 statt 90 s
  "verdichtung|gpt-6-astra|medium": { sekunden: [60, 240], usd: [1.0, 1.5] },
  // Vergleichslauf Ilka 267–329 s, 1,52–1,69 USD, 13 574–15 867 Ausgabetoken (Läufe 20261024-231048-0gjp,
  // -231723-etee, -232232-l69n)
  "verdichtung|gpt-6-astra|high": { sekunden: [240, 420], usd: [1.5, 2.15] },
  // Folgereihe Vergleichslauf Ilka 25.10.2026 (App 0.5.10): 333–418 s, 0,93–1,84 USD (0,93 USD mit 87 876 gelesenen
  // Cache-Token), 16 832–18 794 Ausgabetoken (Läufe 20261025-013359-jytv, -014153-g3m8, -014823-0eu1)
  "verdichtung|gpt-6-astra|xhigh": { sekunden: [330, 540], usd: [0.9, 2.3] },
  // Mistral, Kosten ohne EU-Aufschlag. Vergleichslauf Ilka, EU-Endpunkt: 23–37 s, 0,010–0,012 USD, 3 665–5 923
  // Ausgabetoken (Läufe 20261024-224439-b628, -224751-2hu5, -225017-vou1, -225845-7ngp, -230206-jlcg, -230531-dh4z);
  // dazu (App 0.5.7) 17–25 s, 0,009–0,011 USD (Läufe 20261024-203955-kj03, -205221-uyeb, -210208-bfob, -211602-5dfe)
  "s1|mistral-small-2603|high": { sekunden: [10, 50], usd: [0, 0.02] },
  // Vergleichslauf Ilka, EU-Endpunkt: 109–189 s, 0,23–0,34 USD, 15 086–29 748 Ausgabetoken (Läufe 20261024-224439-b628,
  // -224751-2hu5, -225017-vou1); dazu (App 0.5.7) global 103–132 s, 0,22–0,26 USD, EU 162 s, 0,30 USD (Läufe
  // 20261024-203955-kj03, -205221-uyeb, -210208-bfob, -211602-5dfe)
  "verdichtung|mistral-medium-3-5|high": { sekunden: [90, 240], usd: [0.2, 0.45] },
  // Vergleichslauf Ilka, EU-Endpunkt: 165–213 s, 0,12–0,18 USD, 18 047–24 852 Ausgabetoken, zum Teil mit gelesenen
  // Cache-Token (Läufe 20261024-225845-7ngp, -230206-jlcg, -230531-dh4z)
  "verdichtung|mistral-large-4|high": { sekunden: [150, 270], usd: [0.1, 0.25] },
};

const STUFEN: Aufwand[] = ["low", "medium", "high", "xhigh", "max"];

/**
 * Schätzung für eine Stufe. Reihenfolge: Messwert für Modell und Aufwand; sonst Preis einer gemessenen Variante
 * gleicher Art und gleichen Aufwands, hochgerechnet über den Ausgabepreis; sonst die mittlere Variante dieser Art,
 * bei höherem Aufwand mit doppelter Obergrenze, bei niedrigerem mit halber Untergrenze. Der Aufwand gilt so, wie das
 * Modell ihn anbietet (AV-2026-W43-02); der EU-Aufschlag von Mistral kommt auf die Kosten (AV-2026-W43-06).
 */
export function schaetzeStufe(art: SchaetzArt, modell: string, aufwand: Aufwand, optionen: AnbieterOptionenTeil = {}): Schaetzung {
  // Lokale Modelle (Ollama, seit 0.6.3, TP-2026-W44-26): keine Kosten beim Anbieter, keine Messwerte zur Dauer
  const id = bekannterAnbieter(modell);
  if (id && beschreibung(id).preise.kostenlos) return { sekunden: null, usd: [0, 0], gemessen: false };
  const s = schaetzeOhneAufschlag(art, modell, aufwandAngeboten(modell, aufwand));
  const f = aufschlagFuer(modell, optionen);
  return f === 1 || !s.usd ? s : { ...s, usd: [s.usd[0] * f, s.usd[1] * f] };
}

function schaetzeOhneAufschlag(art: SchaetzArt, modell: string, aufwand: Aufwand): Schaetzung {
  const genau = MESSWERTE[`${art}|${modell}|${aufwand}`];
  if (genau) return { sekunden: genau.sekunden, usd: genau.usd, gemessen: true };
  const ziel = ausgabePreis(modell);
  if (ziel === null) return { sekunden: null, usd: null, gemessen: false };
  const kandidaten = Object.entries(MESSWERTE)
    .map(([k, m]) => ({ teile: k.split("|") as [string, string, string], m }))
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

/**
 * Grobe Schätzung der Management Summary (seit 0.5.12, Vergleichslauf „MS (aus Musterfassung)“), ohne Messwert: ein
 * Aufruf ohne Werkzeuge; Eingabe in Token (Arbeitsanweisung und Meldung), Ausgabe einschließlich Nachdenken 500 bis
 * 3 000 Token bei „niedrig“, 1 000 bis 6 000 bei „mittel“ und 1 000 bis 16 000 darüber, zum Listenpreis ohne Cache.
 * Keine Dauer; der Aufschlag des Mistral-EU-Endpunkts kommt auf die Kosten.
 *
 * Messwerte vom 25.10.2026 (Plan management-summary-ilka, App 0.5.14, je drei Läufe, AV-2026-W43-38): Ausgabetoken
 * Sonnet „mittel“ 798–908, Opus „mittel“ 2 124–3 478, Haiku „mittel“ 2 354–3 542, gpt-6.1-sol „mittel“ 734–1 395,
 * Mistral Medium 3.5 „hoch“ 2 097–3 783, Mistral Large 4 „hoch“ 6 704–10 832; alle in den Spannen. Dauer 6–28 s je Lauf,
 * Mistral Large 92–152 s (evaluation/abnahmen/2026-10-25-management-summary-ilka-ergebnis.md).
 */
export function schaetzeKurzfassung(modell: string, aufwand: Aufwand, eingabeToken: number, optionen: AnbieterOptionenTeil = {}): Schaetzung {
  const a = aufwandAngeboten(modell, aufwand);
  const [von, bis] = a === "low" ? [500, 3000] : a === "medium" ? [1000, 6000] : [1000, 16000];
  const k = (ausgabe: number) => kostenAnfrage(modell, { ...leereNutzung(), eingabe: eingabeToken, ausgabe });
  const [u, o] = [k(von), k(bis)];
  if (u === null || o === null) return { sekunden: null, usd: null, gemessen: false };
  const f = aufschlagFuer(modell, optionen);
  return { sekunden: null, usd: [u * f, o * f], gemessen: false };
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
  if (k[1] === 0) return "ohne Kosten (lokales Modell)";
  // Toleranz gegen Gleitkommafehler: 2,2 × 100 ergibt 220,00000000000003 und würde sonst auf 2,21 aufgerundet
  const [a, b] = [Math.floor(k[0] * 100 + 1e-9) / 100, Math.ceil(k[1] * 100 - 1e-9) / 100];
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
