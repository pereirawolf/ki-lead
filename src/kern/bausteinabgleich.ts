// Abgleich der Zahlen im Meldungstext mit Kennzahlen-Bausteinen (seit 0.6.24, UP-2026-W45-01, Übergangsregel h).
// Solange ein Profil LEAD-Meldung-v1 nutzt, stehen Kennzahlen im Fließtext. Der Abgleich sucht Paare aus Zahl und
// Einheit der Bausteine (Einsatzmittel, Einsätze, Einsatzkräfte, Ausrückebereiche, Einheiten) und meldet Hinweise:
// - BAUSTEIN_OHNE_BELEG: Baustein fehlt im Quellenverzeichnis, oder ein Satz nennt einen Wert des Bausteins ohne
//   Verweis auf dessen Quelle;
// - BAUSTEIN_ZAHL_ABWEICHEND: ein Satz mit Verweis auf den Baustein nennt eine Zahl, die der Baustein mit dieser
//   Einheit nicht enthält (Kennzahl, Einsatzmittel oder Einsatzkräfte einer Einsatzmeldung).
// Nur Hinweise: Zahlen im Text sind nicht eindeutig einer Kennzahl zuzuordnen; Summen sind fachlich zu prüfen.

import { BAUSTEIN_EINHEITEN, zeitDE, type BausteinInfo } from "./baustein";
import { holeWert } from "./pfad";
import { parseQuellen, sachverhalte, verweise } from "./quellen";
import type { Befund, Meldung, UiKonfig } from "./typen";

export interface AbgleichBaustein {
  name: string;
  info: BausteinInfo;
  daten: Record<string, any>;
}

type Einheit = (typeof BAUSTEIN_EINHEITEN)[number];

/** Wortformen im Text → Einheit des Bausteins */
const FORMEN: [RegExp, Einheit][] = [
  [/^Einsatzmitteln?$/, "Einsatzmittel"],
  [/^Einsätzen?$/, "Einsätze"],
  [/^Einsatzkräften?$/, "Einsatzkräfte"],
  [/^Ausrückebereichen?$/, "Ausrückebereiche"],
  [/^Einheiten$/, "Einheiten"],
];

const ZAHL = String.raw`\d{1,3}(?:\.\d{3})+|\d+`;
/** Zahl, optional „von Zahl“, bis zu zwei kleingeschriebene Wörter, dann die Einheit */
const PAAR = new RegExp(
  String.raw`(?<![\d.,:/–-])(${ZAHL})(?:\s+von\s+(${ZAHL}))?\s+(?:[a-zäöüß-]+\s+){0,2}?(Einsatzmitteln?|Einsätzen?|Einsatzkräften?|Ausrückebereichen?|Einheiten)\b`,
  "g",
);

const zahl = (s: string) => Number(s.replace(/\./g, ""));

export function zahlPaare(satz: string): { zahl: number; einheit: Einheit; text: string }[] {
  const out: { zahl: number; einheit: Einheit; text: string }[] = [];
  for (const m of satz.matchAll(PAAR)) {
    const einheit = FORMEN.find(([re]) => re.test(m[3]!))?.[1];
    if (!einheit) continue;
    out.push({ zahl: zahl(m[1]!), einheit, text: m[0] });
    if (m[2]) out.push({ zahl: zahl(m[2]), einheit, text: m[0] });
  }
  return out;
}

/** Werte je Einheit, die ein Baustein belegt */
export function bausteinWerte(daten: Record<string, any>): Map<Einheit, Set<number>> {
  const w = new Map<Einheit, Set<number>>(BAUSTEIN_EINHEITEN.map((e) => [e, new Set<number>()]));
  for (const k of daten.kennzahlen || []) if (typeof k.wert === "number" && w.has(k.einheit)) w.get(k.einheit)!.add(k.wert);
  for (const em of daten.einsatzmeldungen || []) {
    if (typeof em.einsatzmittel === "number") w.get("Einsatzmittel")!.add(em.einsatzmittel);
    if (typeof em.einsatzkraefte === "number") w.get("Einsatzkräfte")!.add(em.einsatzkraefte);
  }
  return w;
}

/** Einträge des Quellenverzeichnisses, die einen Baustein bezeichnen: Titel (ohne „(FIKTIV)“) und Datenstand. */
export function bausteinQuellen(quellenText: unknown, info: BausteinInfo): number[] {
  const titel = info.quelle.titel.replace(/\s*\(FIKTIV\)\s*$/, "").trim();
  const stand = `Datenstand: ${zeitDE(info.quelle.datenstand ?? info.datenstand)}`;
  return parseQuellen(quellenText)
    .filter((q) => q.text.includes(titel) && q.text.includes(stand))
    .map((q) => q.nr);
}

/** Sätze eines Textes; ein Verweis „[Qn]“ nach dem Satzzeichen gehört zum vorangehenden Satz. */
export function saetze(text: string): string[] {
  return text
    .split(/(?<=[.!?](?:\s*\[[^\]\n]{1,60}\])*)\s+(?=[A-ZÄÖÜ0-9„(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const kurz = (s: string) => (s.length > 90 ? `${s.slice(0, 87)}…` : s);

export function bausteinAbgleich(d: Meldung, ui: UiKonfig, bausteine: AbgleichBaustein[]): Befund[] {
  if (!bausteine.length) return [];
  const quellenText = ui.rollen.quellen ? holeWert(d, ui.rollen.quellen) : "";
  const befunde: Befund[] = [];
  const zugeordnet = bausteine.map((b) => ({ ...b, nr: bausteinQuellen(quellenText, b.info), werte: bausteinWerte(b.daten) }));
  for (const b of zugeordnet)
    if (!b.nr.length)
      befunde.push({
        stufe: "hinweis",
        code: "BAUSTEIN_OHNE_BELEG",
        text: `Kennzahlen-Baustein „${b.name}“ (${b.info.raum.name}, Datenstand ${zeitDE(b.info.datenstand)}) steht nicht im Quellenverzeichnis. Übernommene Kennzahlen mit dieser Quelle belegen (Titel und Datenstand des Bausteins).`,
      });
  const abweichend: string[] = [];
  const ohneBeleg: string[] = [];
  sachverhalte(d, ui).forEach((sv, i) => {
    for (const feld of ui.rollen.sv_textfelder || []) {
      const text = String(holeWert(sv, feld) || "");
      for (const satz of saetze(text)) {
        const paare = zahlPaare(satz);
        if (!paare.length) continue;
        const refs = verweise(satz);
        const belegt = zugeordnet.filter((b) => b.nr.some((n) => refs.has(n)));
        if (belegt.length) {
          const fremd = paare.filter((p) => !belegt.some((b) => b.werte.get(p.einheit)!.has(p.zahl)));
          for (const p of fremd) abweichend.push(`Sachverhalt ${i + 1}, ${feld}: „${p.text}“ (${p.zahl} ${p.einheit}) in „${kurz(satz)}“`);
        } else {
          const treffer = paare.filter((p) => zugeordnet.some((b) => b.nr.length && b.werte.get(p.einheit)!.has(p.zahl)));
          if (treffer.length && zugeordnet.some((b) => b.nr.length)) ohneBeleg.push(`Sachverhalt ${i + 1}, ${feld}: „${treffer[0]!.text}“ in „${kurz(satz)}“`);
        }
      }
    }
  });
  if (abweichend.length)
    befunde.push({
      stufe: "hinweis",
      code: "BAUSTEIN_ZAHL_ABWEICHEND",
      text: `Zahl im Text, die der zitierte Kennzahlen-Baustein mit dieser Einheit nicht enthält. Kennzahlen unverändert übernehmen; eine Summe oder eine andere Quelle kennzeichnen: ${[...new Set(abweichend)].join("; ")}.`,
    });
  if (ohneBeleg.length)
    befunde.push({
      stufe: "hinweis",
      code: "BAUSTEIN_OHNE_BELEG",
      text: `Wert eines Kennzahlen-Bausteins im Text ohne Verweis auf dessen Quelle (prüfen, ob die Zahl aus dem Baustein stammt): ${[...new Set(ohneBeleg)].join("; ")}.`,
    });
  return befunde;
}
