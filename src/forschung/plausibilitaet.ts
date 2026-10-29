// Plausibilitätsprüfung der Zahlen eines Entwurfs (seit 0.5.8, Befund AV-2026-W43-11). Anbieterunabhängig, ohne
// KI-Aufruf, ohne Eingriff in die Meldung. Zwei Prüfungen:
//
// (a) Summe: Eine Angabe der Form „mindestens 12.600 Anschlüsse ohne Versorgung (Niedersachsen: 4.600 [Q2];
//     NRW: 6.900 [Q3]; …)“ wird gegen die Summe der Klammerwerte geprüft. Datum, Uhrzeit, Quellen- und Achsenverweise,
//     Straßen, Spannen und Angaben mit Einheiten (Uhr, km/h, %, Stunden, Tage) zählen nicht als Summanden.
// (b) D2: Der Wert der Achse D2 im Bewertungstext wird gegen die Stufe geprüft, in die die maßgebliche Personenzahl
//     fällt (Stufentexte des Kodierleitfadens: 0 unter 10, 1 10–99, 2 100–999, … 6 ab 1 Mio.). Maßgeblich ist eine
//     ausdrücklich genannte Summe oder Gesamtzahl („Summe 19.600“, „zusammen …“, „insgesamt …“, „= mindestens …“, seit
//     0.5.10, AV-2026-W43-17; „Summe … (Zahl)“ seit 0.5.14, AV-2026-W43-28), sonst die größte Zahl vor einem
//     Personenwort. Grenzangaben („unter 10 Personen“, „über 9.999“, Spannen „10–99“, seit 0.5.14 auch „Grenze zu 4 ist
//     10.000 Personen“) zählen nicht.
//
// Entscheidung zu AV-2026-W43-11 (24.10.2026): Die Prüfung läuft zunächst nur im Vergleichslauf Ilka (Reihendatei,
// Übersicht). Ob sie als Hinweis an die Redaktion in die App kommt, entscheidet die Quote falscher Treffer in den
// Vergleichsläufen.
// Stand 25.10.2026 (AV-2026-W43-16): Vergleichslauf standardprofile-ilka, 18 Läufe, 3 Treffer, davon 1 Fehlalarm (D2-Satz
// mit ausdrücklicher Summe, seither behoben). Weiter nur im Vergleichslauf; Übernahme in die App als Hinweis, sobald
// mindestens 10 Treffer von Hand geprüft sind und höchstens einer davon ein Fehlalarm ist.
// Stand 25.10.2026 (anbietermix-ilka, AV-2026-W43-27, -28): 6 weitere Läufe, 2 Treffer, beide Fehlalarme (Dezimalkomma
// als Trenner; Stufengrenze als Personenzahl), seit 0.5.14 behoben. Nach den Regeln vor der Korrektur 4 geprüfte Treffer,
// davon 2 Fehlalarme; die Schwelle für die App ist nicht erreicht.
//
// Seit 0.6.3 (TP-2026-W44-25) in src/forschung/: Die Prüfung läuft nur im Vergleichslauf, nicht in der KI-Erfassung,
// und ist an das Beispielprofil gebunden (Felder und Stufen des Bewertungstexts „im Format des Beispielprofils“).

import type { Meldung } from "../kern/typen";

export interface PlausibilitaetsBefund {
  art: "summe" | "d2";
  /** Sachverhalt (1 …) */
  sachverhalt: number;
  /** Feld, z. B. analyse.lage_ereignis oder sofort.bewertung_text */
  feld: string;
  /** Auszug der geprüften Stelle (höchstens 200 Zeichen) */
  auszug: string;
  text: string;
}

/** Zahl im deutschen Format: „12.600“, „146“, nicht „14.10.“ (Datum) */
function zahl(s: string): number {
  return Number(s.replace(/\./g, ""));
}

const ZAHL = String.raw`\d{1,3}(?:\.\d{3})+|\d+`;
const EINHEIT = /\b(Uhr|km\/h|%|Prozent|Stunden?|Std\.?|h|Tagen?|Minuten|MW|kV|Grad|°C|Jahre?n?)\b|°/i;

/** Summanden eines Klammerinhalts; null, wenn der Inhalt keine Aufzählung von Teilwerten ist */
export function summanden(inhalt: string): { werte: number[]; ungefaehr: boolean } | null {
  const teile = inhalt
    .replace(/\[[^\]]*\]/g, " ") // Quellenverweise [Q1–Q6]
    // Komma nur als Trenner, nicht in Dezimalzahlen wie „1,9“ (AV-2026-W43-27)
    .split(/;|(?<!\d),|,(?!\d)|\s+und\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (teile.length < 2) return null;
  const werte: number[] = [];
  let ungefaehr = false;
  for (const t of teile) {
    if (EINHEIT.test(t)) return null;
    const bereinigt = t
      .replace(/\b\d{1,2}\.\d{1,2}\.(\d{2,4})?/g, " ") // Datum
      .replace(/\b\d{1,2}:\d{2}\b/g, " ") // Uhrzeit
      .replace(/\b[QDLAKB]\s?\d+\b/g, " ") // Quellen, Achsen, Straßen
      .replace(/\b(Stufe|Abgrenzung zu)\s+\d+/gi, " ");
    if (/\d\s*[–-]\s*\d/.test(bereinigt)) return null; // Spanne
    const treffer = [...bereinigt.matchAll(new RegExp(String.raw`(?<![\d.,])(${ZAHL})(?![\d.,]\d)`, "g"))];
    if (treffer.length !== 1) return null;
    if (/(~|≈|rund|etwa|ca\.|circa|mind\.|mindestens|über|knapp)/i.test(t)) ungefaehr = true;
    werte.push(zahl(treffer[0]![1] ?? ""));
  }
  return { werte, ungefaehr };
}

/** Prüfung (a) in einem Text; liefert die gefundenen Widersprüche */
export function summenPruefen(text: string): { auszug: string; angabe: number; summe: number; art: string }[] {
  const out: { auszug: string; angabe: number; summe: number; art: string }[] = [];
  const muster = new RegExp(
    String.raw`(?:(mindestens|mind\.|rund|etwa|ca\.|circa|über|mehr als|knapp|~)\s*)?(?<![\d.,:])(${ZAHL})(?![\d.,:]\d)\s+((?:[A-Za-zÄÖÜäöüß„“-]+\s+){0,4}[A-Za-zÄÖÜäöüß„“-]+)\s*\(([^()]{3,400})\)`,
    "g",
  );
  for (const m of text.matchAll(muster)) {
    const vor = text.slice(Math.max(0, (m.index ?? 0) - 1), m.index ?? 0);
    if (/[\d.:–-]/.test(vor)) continue; // Teil eines Datums, einer Uhrzeit oder Spanne
    // Die Klammer muss die gezählte Angabe selbst aufschlüsseln: „rund 12.000 Einsätze und zahlreiche Verletzte (…)“
    // schlüsselt die Verletzten auf, nicht die Einsätze
    if (/\b(und|sowie|oder)\b/.test(m[3] ?? "")) continue;
    const art = (m[1] || "").toLowerCase();
    const angabe = zahl(m[2] ?? "");
    const s = summanden(m[4] ?? "");
    if (!s) continue;
    const summe = s.werte.reduce((a, b) => a + b, 0);
    const ungefaehr = s.ungefaehr || ["rund", "etwa", "ca.", "circa", "~", "knapp"].includes(art);
    let widerspruch: boolean;
    if (art === "über" || art === "mehr als") widerspruch = summe <= angabe;
    else if (ungefaehr) widerspruch = Math.abs(summe - angabe) > 0.05 * Math.max(summe, angabe);
    else widerspruch = summe !== angabe;
    if (widerspruch) out.push({ auszug: m[0].slice(0, 200), angabe, summe, art: art || "genau" });
  }
  return out;
}

const D2_STUFEN = [10, 100, 1_000, 10_000, 100_000, 1_000_000];

/** Stufe der Achse D2 zu einer Personenzahl nach den Stufentexten des Kodierleitfadens */
export function d2Stufe(personen: number): number {
  const i = D2_STUFEN.findIndex((g) => personen < g);
  return i < 0 ? 6 : i;
}

const PERSONEN = String.raw`(?:Personen|Betroffene|Menschen|Einwohner(?:innen)?|Verletzte|Evakuierte|Gestrandete|Wandernde|Erkrankte|Bewohner(?:innen)?|Reisende)`;

/** Stufengrenze im Satz, z. B. „Grenze zu 4 ist 10.000 Personen“: keine Personenzahl (AV-2026-W43-28) */
const GRENZE = String.raw`(?:Grenze|Schwelle)(?:\s+(?:zu|zur\s+Stufe)\s+\d)?\s+(?:ist|liegt\s+bei|bei|von)`;
const UNGEFAEHR = String.raw`(?:mindestens\s+|rund\s+|etwa\s+|ca\.\s+)?`;

/** Prüfung (b): D2-Wert gegen die größte genannte Personenzahl des D2-Satzes; null ohne Widerspruch */
export function d2Pruefen(bewertungText: string, d2: number | null | undefined): { auszug: string; personen: number; erwartet: number } | null {
  if (typeof d2 !== "number") return null;
  const satz = bewertungText.match(/D2\s*=\s*\d[^\n]*?(?=\s*D3\s*=|\n|$)/)?.[0];
  if (!satz) return null;
  const muster = new RegExp(
    String.raw`(unter|über|ab|bis|mehr als|weniger als|${GRENZE}|[–-])?\s*(?<![\d.,:])(${ZAHL})(?![\d.,:]\d)\s+(?:[a-zäöüß-]+\s+){0,2}${PERSONEN}`,
    "g",
  );
  // Ausdrücklich genannte Summe oder Gesamtzahl geht vor (AV-2026-W43-17), seit 0.5.14 auch „Summe der drei amtlichen
  // Werte (20.700)“ (AV-2026-W43-28); die letzte im Satz zählt
  const ohneWert = satz.replace(/^D2\s*=\s*\d+/, "");
  const summen = [
    ...ohneWert.matchAll(
      new RegExp(
        String.raw`(?:\bSumme|\bzusammen|\binsgesamt|=)\s*(?:von\s+|also\s+)?${UNGEFAEHR}(?<![\d.,:])(${ZAHL})(?![\d.,:]\d)|\bSumme(?:\s+[A-Za-zÄÖÜäöüß-]+){1,5}\s*\(\s*${UNGEFAEHR}(${ZAHL})\s*\)`,
        "gi",
      ),
    ),
  ];
  const letzte = summen[summen.length - 1];
  let groesste = letzte ? zahl(letzte[1] ?? letzte[2] ?? "") : -1;
  if (groesste < 0)
    for (const m of satz.matchAll(muster)) {
      if (m[1]) continue; // Grenzangabe oder Spanne
      groesste = Math.max(groesste, zahl(m[2] ?? ""));
    }
  if (groesste < 0) return null;
  const erwartet = d2Stufe(groesste);
  return erwartet === d2 ? null : { auszug: satz.slice(0, 200), personen: groesste, erwartet };
}

const ANALYSEFELDER = ["lage_ereignis", "risiken_auswirkungen", "massnahmen_empfehlungen", "abhaengigkeiten_interdependenzen"];

/** Beide Prüfungen über alle Sachverhalte einer Meldung im Format des Beispielprofils (LEAD-Meldung-v1) */
export function plausibilitaetPruefen(meldung: Meldung): PlausibilitaetsBefund[] {
  const out: PlausibilitaetsBefund[] = [];
  const svs: any[] = Array.isArray((meldung as any)?.sachverhalte) ? (meldung as any).sachverhalte : [];
  svs.forEach((sv, i) => {
    const felder: [string, string][] = [
      ...ANALYSEFELDER.map((f) => [`analyse.${f}`, String(sv?.analyse?.[f] ?? "")] as [string, string]),
      ["sofort.bewertung_text", String(sv?.sofort?.bewertung_text ?? "")],
    ];
    for (const [feld, text] of felder)
      for (const s of summenPruefen(text))
        out.push({
          art: "summe",
          sachverhalt: i + 1,
          feld,
          auszug: s.auszug,
          text: `Angabe ${s.angabe.toLocaleString("de-DE")} (${s.art}), Summe der Klammerwerte ${s.summe.toLocaleString("de-DE")}`,
        });
    const d2 = d2Pruefen(String(sv?.sofort?.bewertung_text ?? ""), sv?.sofort?.lagenradar?.d2);
    if (d2)
      out.push({
        art: "d2",
        sachverhalt: i + 1,
        feld: "sofort.lagenradar.d2",
        auszug: d2.auszug,
        text: `D2 = ${sv.sofort.lagenradar.d2}, genannte Personenzahl ${d2.personen.toLocaleString("de-DE")} entspricht Stufe ${d2.erwartet}`,
      });
  });
  return out;
}
