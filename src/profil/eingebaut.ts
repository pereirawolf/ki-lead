// Mit der App ausgelieferte Profile, beim Build eingebettet:
// - profile/            öffentliche Beispielprofile aus dem Repository
// - privat/profile/     eigene, nicht eingecheckte Profile (Ordner ist per .gitignore ausgeschlossen).
//   Im Entwicklungsserver immer dabei; im Produktionsbuild nur mit KI_LEAD_PRIVAT=1,
//   damit ein veröffentlichter Build keine privaten Inhalte enthält (Konstante __KI_LEAD_PRIVAT__ aus vite.config.ts).
//
// Nicht eingebettet: archivierte SOP-Fassungen und die erzeugte Lesefassung. Die App liest sie nie (maßgeblich für SOPs
// ist sop.dateien im Manifest); sie würden nur Ladezeit und Profilprüfsumme vergrößern. Die SOP-Übersicht
// (`sop/README.md`) ist dagegen eingebettet: Die Profilansicht zeigt sie als Lesedokument, nicht als SOP.
const oeffentlich = import.meta.glob<string>(["/profile/**/*.{json,md}", "!/profile/**/sop/archiv/**", "!/profile/**/sop/*_Lesefassung.md"], {
  query: "?raw",
  import: "default",
  eager: true,
});
const privat: Record<string, string> = __KI_LEAD_PRIVAT__
  ? import.meta.glob<string>(["/privat/profile/**/*.{json,md}", "!/privat/profile/**/sop/archiv/**", "!/privat/profile/**/sop/*_Lesefassung.md"], {
      query: "?raw",
      import: "default",
      eager: true,
    })
  : {};

export interface EingebautesProfil {
  ordner: string;
  dateien: Record<string, string>;
}

export function eingebauteProfile(): EingebautesProfil[] {
  const nachOrdner = new Map<string, Record<string, string>>();
  for (const [pfad, text] of Object.entries({ ...oeffentlich, ...privat })) {
    const m = pfad.match(/^\/(?:privat\/)?profile\/([^/]+)\/(.+)$/);
    if (!m) continue;
    const [, ordner = "", datei = ""] = m;
    if (!nachOrdner.has(ordner)) nachOrdner.set(ordner, {});
    nachOrdner.get(ordner)![datei] = text;
  }
  return [...nachOrdner.entries()].map(([ordner, dateien]) => ({ ordner, dateien }));
}
