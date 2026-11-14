// Evaluationsmaterial der Forschungsreihen per dynamischem Import (seit 0.6.3, TP-2026-W44-25): Musterfassung Ilka und
// ihr Zuschnitt als Text (zusammen rund 33 KB) liegen in einem eigenen Teil des Builds und werden erst geladen, wenn ein
// Testlauf sie braucht. Kopfdaten von Fall und Plänen (Kennungen, Varianten, Prüfsummen) und der Zuschnitt als Objekt für
// `s1Vergleich` bleiben statisch eingebunden, weil die Auswahl unter „Testläufe“ und die Prüfpunkte sie ohne Warten brauchen.

export interface MusterTexte {
  /** evaluation/material/ilka-musterfassung.v2.json als Text (seit 0.9.0 die v2-Fassung; die Prüfsumme gilt für die Datei im Repository) */
  muster: string;
  /** evaluation/material/ilka-s1-zuschnitt-a.json als Text */
  zuschnitt: string;
}

let geladen: Promise<MusterTexte> | undefined;

/** Musterfassung und Zuschnitt als Text, einmal je Sitzung geladen */
export function musterTexte(): Promise<MusterTexte> {
  geladen ??= Promise.all([
    import("../../evaluation/material/ilka-musterfassung.v2.json?raw"),
    import("../../evaluation/material/ilka-s1-zuschnitt-a.json?raw"),
  ]).then(([m, z]) => ({ muster: m.default, zuschnitt: z.default }));
  return geladen;
}
