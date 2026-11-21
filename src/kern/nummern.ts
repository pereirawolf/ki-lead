// Nummern von Listeneinträgen und Verweise auf sie (seit 0.9.11, Profilformat 1.39; Entscheidungen des Herausgebers vom
// 21.11.2026 zur Seite „Ereignisse und Sachverhalte“):
// - Die App vergibt die Nummer eines neuen Eintrags, wenn das Schema für sein Feld `id` ein Muster der Form
//   `^X[1-9][0-9]*$` vorgibt (LEAD-Meldung-v2: Q, M, E, F, K, Z). Gezählt wird in der Liste selbst; mit `nummern: "meldung"`
//   an der Liste über alle Listen desselben Pfads in der Meldung (Zeitstrahl: Zeilennummern sind in der Meldung eindeutig).
//   Die nächste Nummer folgt auf die höchste vorhandene; entfernte Einträge hinterlassen eine Lücke, damit Verweise auf
//   andere Nummern stabil bleiben.
// - Ein Feld mit `verweis` (generischer Pfad einer Liste, etwa „sachverhalte[].handlungsbedarf.empfehlungen“) bietet die
//   Nummern dieser Liste mit ihren Titeln zur Auswahl. Listen im selben Sachverhalt werden über die Indizes des Feldes
//   aufgelöst; eine Liste der obersten Ebene (etwa „quellen“) gilt für die ganze Meldung.

import { generischerPfad, holeWert, teilePfad, type Segment } from "./pfad";
import { aufloesen } from "./schema";

const MUSTER = /^\^([A-Z])\[1-9\]\[0-9\]\*\$$/;

/** Buchstabe der Nummern einer Liste aus dem Muster ihres Feldes `id`, sonst undefined */
export function nummerPraefix(items: unknown, schema: unknown): string | undefined {
  const k = aufloesen(items, schema);
  const id = k?.properties?.id ? aufloesen(k.properties.id, schema) : undefined;
  const m = typeof id?.pattern === "string" ? MUSTER.exec(id.pattern) : null;
  return m ? m[1] : undefined;
}

/** Alle Werte an einem generischen Pfad („sachverhalte[].zeitstrahl[].id“) in der Meldung */
export function werteAmPfad(wurzel: unknown, generisch: string): unknown[] {
  const segs = teilePfad(generisch);
  let stufe: unknown[] = [wurzel];
  for (const seg of segs) {
    const naechste: unknown[] = [];
    for (const w of stufe) {
      if (seg === -1) {
        if (Array.isArray(w)) naechste.push(...w);
      } else if (w && typeof w === "object") naechste.push((w as Record<string, unknown>)[String(seg)]);
    }
    stufe = naechste;
  }
  return stufe.filter((w) => w !== undefined);
}

/** Nächste freie Nummer: auf die höchste vorhandene folgend */
export function naechsteNummer(praefix: string, vorhandene: unknown[]): string {
  const re = new RegExp(`^${praefix}([1-9][0-9]*)$`);
  let hoechste = 0;
  for (const v of vorhandene) {
    const m = typeof v === "string" ? re.exec(v) : null;
    if (m) hoechste = Math.max(hoechste, Number(m[1]));
  }
  return `${praefix}${hoechste + 1}`;
}

/** Konkreter Pfad einer Verweisliste für ein Feld: „[]“ übernimmt den Index des Feldes, solange die Pfade übereinstimmen */
export function verweisPfad(verweis: string, segs: Segment[]): Segment[] | undefined {
  const ziel = teilePfad(verweis);
  const out: Segment[] = [];
  for (let i = 0; i < ziel.length; i++) {
    const seg = ziel[i]!;
    if (seg !== -1) {
      out.push(seg);
      continue;
    }
    const idx = segs[i];
    if (typeof idx !== "number" || generischerPfad(segs.slice(0, i)) !== generischerPfad(out)) return undefined;
    out.push(idx);
  }
  return out;
}

export interface VerweisZiel {
  id: string;
  /** konkreter Pfad des Eintrags */
  segs: Segment[];
  eintrag: unknown;
}

/** Einträge der Verweisliste mit Nummer, in ihrer Reihenfolge; ohne Nummer übergangen */
export function verweisZiele(wurzel: unknown, verweis: string, segs: Segment[]): VerweisZiel[] | undefined {
  const pfad = verweisPfad(verweis, segs);
  if (!pfad) return undefined;
  const liste = holeWert(wurzel, pfad);
  if (!Array.isArray(liste)) return [];
  return liste.flatMap((eintrag: unknown, i) => {
    const id = nummerVon(eintrag);
    return id ? [{ id, segs: [...pfad, i], eintrag }] : [];
  });
}

/** Nummer eines Eintrags (Feld `id`), sonst undefined */
export function nummerVon(eintrag: unknown): string | undefined {
  const id = eintrag && typeof eintrag === "object" ? (eintrag as { id?: unknown }).id : undefined;
  return typeof id === "string" && id ? id : undefined;
}
