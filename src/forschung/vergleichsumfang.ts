// Umfang eines Testlaufs Ilka (bis 0.5.16 „Vergleichslauf“, seit 0.5.12): was getestet wird und mit welcher Grundlage. Eigene Datei ohne
// weitere Abhängigkeiten, damit die Auswertung (vergleichsauswertung.ts, Skript außerhalb von Vite) sie leicht laden kann.

import type { Rolle } from "../pipeline/einstellungen";

/**
 * Was ein Vergleichslauf testet (seit 0.5.12). Aus Rohdaten: die sechs Eingänge des Falls orkantief-ilka-verdichtung.
 * Aus der Musterfassung (evaluation/material/ilka-musterfassung.json): „S2 + S3“ mit ihrem Zuschnitt als festem
 * S1-Gegenstand (evaluation/material/ilka-s1-zuschnitt-a.json, Plan s2-isoliert-ilka), „MS“ mit ihr als einziger
 * Eingabe (Plan management-summary-ilka, kurzfassungsreihe.ts).
 */
export type Umfang = "s1" | "s1-s2" | "s1-s2-s3" | "s2-s3" | "ms";

export interface UmfangInfo {
  id: Umfang;
  titel: string;
  grundlage: "rohdaten" | "musterfassung";
  /** Erklärung unter der Auswahl */
  text: string;
}

export const UMFAENGE: UmfangInfo[] = [
  {
    id: "s1",
    titel: "S1 (aus Rohdaten)",
    grundlage: "rohdaten",
    text: "Nur S1 aus den sechs Eingängen: Gegenstand, Gliederung und SOP-Auswahl, verglichen mit dem Zuschnitt der Musterfassung (Zahl und Ereignisarten der Sachverhalte, Zuordnung der Eingänge, SOPs). Kein Entwurf.",
  },
  {
    id: "s1-s2",
    titel: "S1 + S2 (aus Rohdaten)",
    grundlage: "rohdaten",
    text: "S1 und S2 Verdichtung aus den sechs Eingängen, ohne S3: Die App prüft den Entwurf, lässt ihn aber weder vervollständigen noch reparieren. Vergleich mit der Redaktionsfassung.",
  },
  {
    id: "s1-s2-s3",
    titel: "S1 + S2 + S3 (aus Rohdaten)",
    grundlage: "rohdaten",
    text: "Die ganze Kette aus den sechs Eingängen: S1, S2 Verdichtung und S3 Prüfung mit Reparatur bei Schemafehlern. Vergleich mit der Redaktionsfassung.",
  },
  {
    id: "s2-s3",
    titel: "S2 + S3 (aus Musterfassung)",
    grundlage: "musterfassung",
    text: "S1 entfällt: Der Zuschnitt der Musterfassung gilt in jedem Lauf als bestätigter Gegenstand (zwei Sachverhalte). S2 Verdichtung aus den sechs Eingängen mit S3 bei Bedarf; Vergleich mit der Redaktionsfassung.",
  },
  {
    id: "ms",
    titel: "Management Summary (aus Musterfassung)",
    grundlage: "musterfassung",
    text: "Management Summary mit der Musterfassung als einziger Eingabe; S1 und S2 entfallen. Je Lauf Text, Hinweise der App und eine Vorprüfung (Wortzahl, Kurztitel, Mindestwert, Hochrechnung, Nachbetankung, Marker) als Beobachtung für die Prüfung von Hand.",
  },
];

/** Vorgabe: die ganze Kette wie bis 0.5.11 */
export const UMFANG_VORGABE: Exclude<Umfang, "ms"> = "s1-s2-s3";

export const umfangInfo = (u: Umfang): UmfangInfo => UMFAENGE.find((x) => x.id === u)!;

/** Aufgaben (Modellrollen), die ein Umfang nutzt, in der Reihenfolge der Stufen */
export function rollenFuer(u: Umfang): Rolle[] {
  switch (u) {
    case "s1":
      return ["vorverarbeitung"];
    case "s1-s2":
      return ["vorverarbeitung", "verdichtung"];
    case "s1-s2-s3":
      return ["vorverarbeitung", "verdichtung", "reparatur"];
    case "s2-s3":
      return ["verdichtung", "reparatur"];
    case "ms":
      return ["kurzfassung"];
  }
}

/** Wirksamer Umfang einer Reihendatei (ki-lead-abnahme/1), auch für Dateien vor 0.5.12 */
export function reiheUmfang(r: { umfang?: Umfang; s1_fest?: unknown }): Exclude<Umfang, "ms"> {
  const u = r.umfang ?? (r.s1_fest ? "s2-s3" : UMFANG_VORGABE);
  return u === "ms" ? UMFANG_VORGABE : u;
}
