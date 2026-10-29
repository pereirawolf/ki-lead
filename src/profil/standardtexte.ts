// Standardtexte der App für Profile ohne eigene Arbeitsanweisung (seit 0.6.3, TP-2026-W44-23, aus src/pipeline/kontext.ts
// und src/pipeline/kurzfassung.ts): Verdichtung (Modus B, Ersatzfassung) und Management Summary. Ein Profil mit eigener
// Anweisung (`anweisungen.verdichtung`, `anweisungen.kurzfassung` in profil.json) ersetzt sie vollständig.
//
// Die Texte liegen als Markdown unter src/profil/standardtexte/ (seit 0.6.3, TP-2026-W44-27). Sie zitieren keine SOP:
// Fundstellen einer SOP-Sammlung gehören zum jeweiligen Profil, nicht zur App. Kennsätze setzt die App aus dem Profil ein
// (`{{kennsatz.<schlüssel>}}`, Ersatztexte in src/kern/kennsaetze.ts).

import VERDICHTUNG_TEXT from "./standardtexte/verdichtung.md?raw";
import KURZFASSUNG_TEXT from "./standardtexte/kurzfassung.md?raw";

/** Standardfassung Verdichtung (S2 mit Eingangsmeldungen), wenn das Profil keine eigene mitbringt */
export const VERDICHTUNG_S2: string = VERDICHTUNG_TEXT.trimEnd();

/** Standardanweisung der Management Summary, wenn das Profil keine eigene mitbringt */
export const STANDARD_ANWEISUNG: string = KURZFASSUNG_TEXT.trimEnd();
