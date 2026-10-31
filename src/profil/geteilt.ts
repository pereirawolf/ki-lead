// Geteilte Dateien eingebauter Profile (seit 0.6.18, TP-2026-W44-55): Das Landesprofil nutzt die SOP-Sammelmappe des
// Beispielprofils, ohne sie im Repository und im Programm doppelt zu führen. Fehlt eine Datei unter dem Präfix im Ordner
// des Profils, kommt sie aus dem Ordner der Quelle; eigene Dateien gehen vor. Nur für eingebaute Profile (und die Tests,
// die Profile aus dem Repository laden): Ein Export enthält alle Dateien, das Profilformat kennt keine Verweise auf andere
// Profile.

export const GETEILT: Record<string, { von: string; praefix: string }> = {
  "lead-thueringen": { von: "lead-beispiel", praefix: "sop/" },
};

/** Dateien eines Profilordners, ergänzt um die geteilten Dateien seiner Quelle */
export function mitGeteilten(
  ordner: string,
  dateien: Record<string, string>,
  quelleLesen: (ordner: string) => Record<string, string> | undefined,
): Record<string, string> {
  const g = GETEILT[ordner];
  const quelle = g && quelleLesen(g.von);
  if (!g || !quelle) return dateien;
  const out = { ...dateien };
  for (const [datei, text] of Object.entries(quelle)) if (datei.startsWith(g.praefix) && !(datei in out)) out[datei] = text;
  return out;
}
