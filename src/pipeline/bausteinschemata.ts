// Gebündelte Schemata der Thessa-Kennzahlen-Bausteine (seit 0.6.24, UP-2026-W45-01). Erzeugt mit
// `npm run fremdschemata` aus der eingebetteten Kopie in formate/fremd/thessa-kennzahlen/ (Herkunft und Prüfsumme in
// herkunft.json); Prüfung in src/kern/baustein.ts.
import S01 from "../../formate/fremd/thessa-kennzahlen/gebuendelt/0.1.schema.json";
import S02 from "../../formate/fremd/thessa-kennzahlen/gebuendelt/0.2.schema.json";

export const BAUSTEIN_SCHEMATA: Record<string, object> = { "0.1": S01, "0.2": S02 };
