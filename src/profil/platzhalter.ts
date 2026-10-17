// Ersetzt {{profil.*}}, {{auftrag.*}}, {{app.*}} und {{jetzt}} in Arbeitsanweisungen.

export interface PlatzhalterKontext {
  profil: Record<string, string | undefined>;
  auftrag?: Record<string, string | undefined>;
  app?: Record<string, string | undefined>;
  jetzt?: string;
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
  return [...new Set([...text.matchAll(/\{\{\s*([a-z]+(?:\.[a-z_]+)?)\s*\}\}/gi)].map((m) => m[1]))];
}
