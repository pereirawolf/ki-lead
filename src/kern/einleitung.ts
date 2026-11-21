// Links in der Einleitung eines Bearbeitungsschritts (seit 0.9.10, Profilformat 1.38): Markdown-Form „[Text](datei.md)“
// mit dem Pfad einer Datei des Profilpakets. Die Maske öffnet sie unter der Einleitung (src/ui/Einleitung.tsx), die Prüfung
// beim Laden warnt vor Zielen außerhalb des Pakets (src/profil/laden.ts).

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export interface EinleitungsTeil {
  text: string;
  /** Pfad einer Datei im Paket, wenn der Teil ein Link ist */
  ziel?: string;
}

/** Zerlegt eine Einleitung in Text und Links; Ziele ohne Datei im Paket bleiben Text */
export function einleitungsTeile(text: string, dateien: Record<string, string>): EinleitungsTeil[] {
  const teile: EinleitungsTeil[] = [];
  let rest = 0;
  for (const m of text.matchAll(LINK)) {
    if (m.index > rest) teile.push({ text: text.slice(rest, m.index) });
    const ziel = m[2]!;
    teile.push(typeof dateien[ziel] === "string" ? { text: m[1]!, ziel } : { text: m[1]! });
    rest = m.index + m[0].length;
  }
  if (rest < text.length) teile.push({ text: text.slice(rest) });
  return teile;
}

/** Linkziele einer Einleitung (für die Prüfung beim Laden) */
export function einleitungsZiele(text: string): string[] {
  return [...text.matchAll(LINK)].map((m) => m[2]!);
}
