// Befunde der Meldungsmaske je Feld (seit 0.6.5, TP-2026-W44-15): Schema- und Pflichtbefunde nach Pfad gruppiert, damit
// die Felder sie anzeigen (aria-invalid, Fehlertext) und der Prüfschritt zum Feld springen kann. Bis 0.6.4 standen sie
// nur als Textliste im Prüfschritt; die Zuordnung der Pfadangaben blieb der Person überlassen.

import { createContext } from "react";
import { teilePfad, type Segment } from "../kern/pfad";
import { pfadBezeichnung } from "../kern/ui";
import type { UiKonfig } from "../kern/typen";

/** Befund mit Pfad: Schemabefund (JSON-Pointer) oder Pflichtbefund („a[0].b“) */
interface PfadBefund {
  pfad?: string;
  text: string;
}

/** Schlüssel eines Feldes: Segmente mit „/“ verbunden (gleich für JSON-Pointer und „a[0].b“) */
export function feldSchluessel(pfad: string | Segment[]): string {
  return (typeof pfad === "string" ? teilePfad(pfad) : pfad).map(String).join("/");
}

/** Text eines Befunds am Feld selbst: ohne die vorangestellte Feldbezeichnung; Pflichtbefunde einheitlich */
function feldText(b: PfadBefund, ui: UiKonfig, art: "schema" | "pflicht"): string {
  if (art === "pflicht") return "Pflichtangabe fehlt.";
  const vorsatz = `${pfadBezeichnung(ui, teilePfad(b.pfad ?? ""))}: `;
  const text = b.text.startsWith(vorsatz) ? b.text.slice(vorsatz.length) : b.text;
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** Befunde je Feld; gleichlautende Texte eines Feldes erscheinen einmal */
export function befundeJeFeld(schema: PfadBefund[], pflicht: PfadBefund[], ui: UiKonfig): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const dazu = (b: PfadBefund, art: "schema" | "pflicht") => {
    if (!b.pfad) return;
    const k = feldSchluessel(b.pfad);
    const liste = out.get(k) ?? [];
    const t = feldText(b, ui, art);
    if (!liste.includes(t)) liste.push(t);
    out.set(k, liste);
  };
  for (const b of schema) dazu(b, "schema");
  for (const b of pflicht) dazu(b, "pflicht");
  return out;
}

export interface FeldBefundeWert {
  befunde: Map<string, string[]>;
}

export const FeldBefundeKontext = createContext<FeldBefundeWert | null>(null);
