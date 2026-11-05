// Geometrie des Lagenradars für alle Darstellungen (Oberfläche, Kopiervorlage, PDF), seit UX-2026-W45-17: Eine offene
// Achse (null, „U“) ist keine Stufe 0. Die Fläche entsteht nur, wenn alle Achsen gesetzt sind; sonst verbinden Kanten
// nur benachbarte gesetzte Achsen, und eine offene Achse erscheint als hohler Ring am äußeren Rand. Bis dahin ging
// eine offene Achse mit 0 in die Fläche ein und sah aus wie Stufe 0.

export interface RadarForm {
  /** Alle Achsen gesetzt: geschlossene Fläche zeichnen */
  voll: boolean;
  /** Kanten zwischen benachbarten gesetzten Achsen (Indizes), nur ohne volle Fläche */
  kanten: [number, number][];
  /** Achsen ohne Wert (offen) */
  offen: number[];
}

export function radarForm(werte: readonly (number | null | undefined)[]): RadarForm {
  const n = werte.length;
  const gesetzt = (i: number) => typeof werte[i] === "number";
  const offen = werte.map((_, i) => i).filter((i) => !gesetzt(i));
  const voll = n > 0 && offen.length === 0;
  const kanten: [number, number][] = [];
  if (!voll && n > 1)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (j === i || (n === 2 && j < i)) continue;
      if (gesetzt(i) && gesetzt(j)) kanten.push([i, j]);
    }
  return { voll, kanten, offen };
}
