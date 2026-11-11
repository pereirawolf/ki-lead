// Gebündelte Schemata der Kennzahlen-Bausteine aus Thessa (seit 0.6.24, UP-2026-W45-01) und KSNV (seit 0.7.19), je
// Format und Fassung. Erzeugt mit `npm run fremdschemata` aus den eingebetteten Kopien in formate/fremd/thessa-kennzahlen/
// und formate/fremd/ksnv-kennzahlen/ (Herkunft und Prüfsumme je in herkunft.json); Prüfung in src/kern/baustein.ts.
import S01 from "../../formate/fremd/thessa-kennzahlen/gebuendelt/0.1.schema.json";
import S02 from "../../formate/fremd/thessa-kennzahlen/gebuendelt/0.2.schema.json";
import S03 from "../../formate/fremd/thessa-kennzahlen/gebuendelt/0.3.schema.json";
import K01 from "../../formate/fremd/ksnv-kennzahlen/gebuendelt/0.1.schema.json";

export const BAUSTEIN_SCHEMATA: Record<string, Record<string, object>> = {
  "Thessa-Kennzahlen": { "0.1": S01, "0.2": S02, "0.3": S03 },
  "KSNV-Kennzahlen": { "0.1": K01 },
};
