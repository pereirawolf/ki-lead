// Gebietsverzeichnis der App (seit 0.9.8): Kern (Bund, Länder, Regierungsbezirke, Kreise; rund 450 Einträge) im
// Haupt-JavaScript, Gemeinden (rund 11.000) als eigener Teil, der erst bei Bedarf geladen wird. Quelle und Stand stehen
// in den Dateien unter formate/fremd/gv-isys/ (scripts/gebietsverzeichnis.mjs).

import kernDatei from "../../formate/fremd/gv-isys/gebiete-kern.json";
import { verzeichnisAus, type GebietDatei, type GebietVerzeichnis } from "../kern/gebiete";

export const GEBIETE_KERN: GebietVerzeichnis = verzeichnisAus(kernDatei as unknown as GebietDatei);

let voll: Promise<GebietVerzeichnis> | null = null;

/** Kern und Gemeinden; der Teil mit den Gemeinden wird einmal geladen */
export function gebieteVoll(): Promise<GebietVerzeichnis> {
  voll ??= import("../../formate/fremd/gv-isys/gebiete-gemeinden.json").then((m) =>
    verzeichnisAus(kernDatei as unknown as GebietDatei, (m.default ?? m) as unknown as GebietDatei),
  );
  return voll;
}

/** Quellenvermerk für die Anzeige („Gemeindeverzeichnis GV-ISys, Gebietsstand 30.09.2026“) */
export function gebieteVermerk(v: GebietVerzeichnis = GEBIETE_KERN): string {
  const [j, m, t] = v.stand.split("-");
  return `Gemeindeverzeichnis GV-ISys der Statistischen Ämter des Bundes und der Länder, Gebietsstand ${t}.${m}.${j}`;
}
