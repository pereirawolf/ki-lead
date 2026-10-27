// Gemeinsame Angaben der Teilkomponenten der KI-Erfassung (seit 0.6.5, TP-2026-W44-17): Einstellungen dieses Laufs,
// Verdichtung oder Erfassung, Stufen für Modellwahl und Schätzung, Export des Laufprotokolls.

import type { Profil } from "../../kern/typen";
import { aufwandFuer, modellFuer, type Einstellungen, type ModellWahl as Modellwahl, type Rolle } from "../../pipeline/einstellungen";
import type { Lauf } from "../../pipeline/lauf";
import type { Material } from "../../pipeline/material";
import { dauerText, schaetzeStufe, type SchaetzArt } from "../../pipeline/schaetzung";
import type { SchaetzStufe } from "../LaufSchaetzung";
import type { StufeModell } from "../ModellWahl";

export interface LaufRahmen {
  profil: Profil;
  /** Einstellungen mit der Modellwahl dieses Laufs */
  laufEinstellungen: Einstellungen;
  verdichtung: boolean;
  websuche: boolean;
  material: Material[];
  eingaenge: Material[];
  stufeS2: StufeModell;
  stufeS3: StufeModell;
  schaetzS2: SchaetzStufe;
  wahl: Modellwahl;
  setWahl: (w: Modellwahl) => void;
  protokollExport: (l: Lauf) => void;
  /** Das Gerät meldet keine Netzverbindung: kein KI-Lauf startbar (seit 0.6.5, TP-2026-W44-20) */
  offline: boolean;
}

/** Kennung des Hinweises, auf den gesperrte Startknöpfe ohne Netz verweisen */
export const OFFLINE_HINWEIS = "ki-offline-hinweis";

/** Hinweis neben den Startknöpfen, solange das Gerät keine Netzverbindung meldet */
export function OfflineHinweis({ offline }: { offline: boolean }) {
  if (!offline) return null;
  return (
    <p className="kasten kasten-hinweis" id={OFFLINE_HINWEIS} role="status">
      Keine Netzverbindung: Ein KI-Lauf lässt sich erst starten, wenn das Gerät wieder online ist. Auftrag und Material bleiben stehen.
    </p>
  );
}

export function stufenFuer(verdichtung: boolean): Pick<LaufRahmen, "stufeS2" | "stufeS3" | "schaetzS2"> {
  const stufeS2: StufeModell = verdichtung
    ? { rolle: "verdichtung", kurz: "S2", titel: "S2 Verdichtung", art: "verdichtung" }
    : { rolle: "erfassung", kurz: "S2", titel: "S2 Recherche und Entwurf", art: "erfassung" };
  const stufeS3: StufeModell = { rolle: "reparatur", kurz: "S3", titel: "S3 Reparatur (nur bei Schemafehlern)", nebenbei: true };
  const schaetzS2: SchaetzStufe = { kurz: "S2", rolle: stufeS2.rolle, art: verdichtung ? "verdichtung" : "erfassung" };
  return { stufeS2, stufeS3, schaetzS2 };
}

/** Voraussichtliche Dauer einer Stufe als Text für die Laufanzeige */
export function dauerFuer(r: LaufRahmen, rolle: Rolle, art: SchaetzArt): string {
  const t = dauerText(schaetzeStufe(art, modellFuer(rolle, r.laufEinstellungen, r.profil), aufwandFuer(rolle, r.laufEinstellungen, r.profil)).sekunden);
  return t === "Dauer ohne Messwert" ? "einige Minuten (für dieses Modell liegen noch keine Messwerte vor)" : t;
}

export function ProtokollKnopf({ lauf, text = "Laufprotokoll exportieren", exportieren }: { lauf: Lauf; text?: string; exportieren: (l: Lauf) => void }) {
  return (
    <button type="button" className="knopf leise" onClick={() => exportieren(lauf)}>
      {text}
    </button>
  );
}
