// Automatische Vorprüfung einer Management Summary aus der Musterfassung Ilka (Plan management-summary-ilka).
// Liefert Beobachtungen für die Prüfung von Hand, kein Bestehen und keine Note: Die Muss- und Darf-nicht-Punkte des
// Falls evaluation/faelle/ilka-management-summary.json bewertet eine Person.

import { GRENZEN, woerter, type KurzfassungStruktur } from "../../src/pipeline/kurzfassung";

export interface KurzfassungBeobachtung {
  /** Wörter in Kernaussage und Abschnitten (Richtwert der App bis 180) */
  woerter: number;
  /** über der Toleranz der App */
  zu_lang: boolean;
  /** ein Kurztitel je Sachverhalt der Musterfassung */
  kurztitel_passend: boolean;
  /** 20.700 genannt, aber nicht als Mindestwert gekennzeichnet */
  mindestwert_fehlt: boolean;
  /** Gesamtzahl mit Hochrechnung (rund 28.500 bis 30.400, „29.000“) ohne Kennzeichnung als Hochrechnung oder Schätzung */
  hochrechnung_ungekennzeichnet: boolean;
  /** Nachbetankung als erledigt dargestellt; die Musterfassung belegt keinen Vollzug */
  nachbetankung_als_erledigt: boolean;
  /** Quellenmarker, URL oder Radarwert im Text */
  marker_im_text: boolean;
}

/** Zahl der Sachverhalte der Musterfassung */
export const SACHVERHALTE_MUSTER = 2;

export function kurzfassungPruefen(k: KurzfassungStruktur): KurzfassungBeobachtung {
  const teile = [k.kernaussage, ...Object.values(k.abschnitte)];
  const text = teile.join("\n");
  const n = teile.reduce((s, t) => s + woerter(t), 0);
  const saetze = text.split(/(?<=[.!?])\s+/);
  const mitZahl = saetze.filter((s) => /20\.700/.test(s));
  const gesamt = saetze.filter((s) => /\b(?:28\.500|29\.000|29\.400|30\.400)\b/.test(s));
  return {
    woerter: n,
    zu_lang: n > GRENZEN.woerterGesamt,
    kurztitel_passend: k.kurztitel.length === SACHVERHALTE_MUSTER,
    mindestwert_fehlt: mitZahl.some((s) => !/mindestens|Mindestwert|wenigstens/i.test(s)),
    hochrechnung_ungekennzeichnet: gesamt.some((s) => !/hochgerechnet|Hochrechnung|geschätzt|Schätzung|einschließlich/i.test(s)),
    nachbetankung_als_erledigt: /Nachbetankung\s+(?:ist|wurde|wird)\s+(?:bereits\s+)?(?:gesichert|sichergestellt|erfolgt|abgeschlossen)/i.test(text),
    marker_im_text: /\[Q\d|https?:\/\/|\bD[1-8]\s*=/.test(text),
  };
}
