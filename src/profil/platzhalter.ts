// Ersetzt {{profil.*}}, {{auftrag.*}}, {{app.*}}, {{kennsatz.*}} (seit 0.6.3) und {{jetzt}} in Arbeitsanweisungen.

import { KENNSATZ_ERSATZ } from "../kern/kennsaetze";
import type { ProfilManifest, UiKonfig } from "../kern/typen";

export interface PlatzhalterKontext {
  profil: Record<string, string | undefined>;
  auftrag?: Record<string, string | undefined>;
  app?: Record<string, string | undefined>;
  /** Kennsätze der Darstellungsdatei, mit den Ersatztexten der App für fehlende Pflichtkennsätze (seit 0.6.3, TP-2026-W44-27) */
  kennsatz?: Record<string, string | undefined>;
  jetzt?: string;
}

/**
 * Schlüssel der Auftragsangaben ({{auftrag.*}}), nur in der Arbeitsanweisung Erfassung. Seit 0.6.4 (TP-2026-W44-31)
 * stehen sie im Steuerungsblock der App; die Platzhalter gelten für fremde Profile weiter, werden aber nicht mehr
 * empfohlen, weil sie die Anweisung je Lauf verändern und damit vom Caching ausschließen.
 */
export const AUFTRAG_SCHLUESSEL = ["sachverhalt", "ausgangsquellen", "stichtag", "prueffrage", "ereignisarten"] as const;
export type AuftragsSchluessel = (typeof AUFTRAG_SCHLUESSEL)[number];

/** Schlüssel der App ({{app.*}}), nur in der Arbeitsanweisung Erfassung */
export const APP_SCHLUESSEL = ["ausgabevertrag"] as const;

/** Arten der Arbeitsanweisungen (Schlüssel in `anweisungen` von profil.json) */
export type AnweisungsArt = "erfassung" | "verdichtung" | "kurzfassung";

/**
 * Profilangaben für {{profil.*}}, gleich für alle drei Arbeitsanweisungen (seit 0.6.4, TP-2026-W44-33; bis 0.6.3 kannte
 * nur die Erfassung `ebene` und `name`, nur die Kurzfassung einen Vorgabewert für `lageprodukt`). `kurzname` fällt auf
 * die meldende Stelle, `lageprodukt` auf „Lagebild“ zurück; Variablen des Profils gehen vor.
 */
export function profilPlatzhalter(m: Pick<ProfilManifest, "variablen" | "referenzraum" | "ebene" | "name">): Record<string, string | undefined> {
  return {
    kurzname: m.variablen?.meldende_stelle,
    lageprodukt: "Lagebild",
    ...m.variablen,
    referenzraum: m.referenzraum,
    ebene: m.ebene,
    name: m.name,
  };
}

/** Kennsätze für {{kennsatz.*}}: die der Darstellungsdatei, für fehlende Pflichtkennsätze die Ersatztexte der App */
export function kennsatzPlatzhalter(ui: Pick<UiKonfig, "kennsaetze"> | undefined): Record<string, string | undefined> {
  return { ...KENNSATZ_ERSATZ, ...(ui?.kennsaetze || {}) };
}

/**
 * Bekannte Platzhalter je Arbeitsanweisung (seit 0.6.4, TP-2026-W44-33): Gegen diese Liste prüft der Profilloader,
 * damit ein Tippfehler wie {{auftrag.stichtaq}} nicht still als „[nicht angegeben]“ im Prompt landet.
 */
export function bekanntePlatzhalter(
  art: AnweisungsArt,
  m: Pick<ProfilManifest, "variablen" | "referenzraum" | "ebene" | "name">,
  ui?: Pick<UiKonfig, "kennsaetze">,
): Set<string> {
  const s = new Set<string>([
    ...Object.keys(profilPlatzhalter(m)).map((k) => `profil.${k}`),
    ...Object.keys(kennsatzPlatzhalter(ui)).map((k) => `kennsatz.${k}`),
  ]);
  if (art === "erfassung") {
    for (const k of AUFTRAG_SCHLUESSEL) s.add(`auftrag.${k}`);
    for (const k of APP_SCHLUESSEL) s.add(`app.${k}`);
    s.add("jetzt");
  }
  return s;
}

export function ersetzePlatzhalter(text: string, k: PlatzhalterKontext): { text: string; offen: string[] } {
  const offen: string[] = [];
  const ergebnis = text.replace(/\{\{\s*([a-z]+)(?:\.([a-z_]+))?\s*\}\}/gi, (ganz, bereich: string, schluessel?: string) => {
    if (bereich === "jetzt" && !schluessel) return k.jetzt ?? ganz;
    const quelle = (k as any)[bereich] as Record<string, string | undefined> | undefined;
    const wert = schluessel ? quelle?.[schluessel] : undefined;
    if (wert === undefined || wert === null) {
      offen.push(ganz);
      return bereich === "app" ? "" : "[nicht angegeben]";
    }
    return wert;
  });
  return { text: ergebnis, offen: [...new Set(offen)] };
}

/** Alle in einem Text verwendeten Platzhalter. */
export function platzhalterIn(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{\s*([a-z]+(?:\.[a-z_]+)?)\s*\}\}/gi)].map((m) => m[1] ?? ""))];
}

/** Platzhalter, die ein Text je Lauf verändert ({{auftrag.*}}, {{jetzt}}); ein solcher Text ist nicht cachebar (TP-2026-W44-31) */
export function laufabhaengigePlatzhalter(text: string): string[] {
  return platzhalterIn(text).filter((p) => p === "jetzt" || p.startsWith("auftrag."));
}
