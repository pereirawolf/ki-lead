// Kontext für Tests der Pipeline (stufe1, stufe2und3, nachbearbeiten) mit Beispielprofil und fester Uhr.
import type { LlmAnbieter } from "../../src/anbieter/typen";
import { STANDARD } from "../../src/pipeline/einstellungen";
import { neuerLauf, type Lauf } from "../../src/pipeline/lauf";
import type { Material } from "../../src/pipeline/material";
import type { Kontext } from "../../src/pipeline/stufen";
import { profil } from "./dateien";

/** URL im Auftrag der Testläufe */
export const AUFTRAGS_URL = "https://beispiel.invalid/lage";

/**
 * Roher S1-Vorschlag wie von der KI: frühere SOP-ID „sop-01“ und eine unbekannte Kennung „sop-99“, damit die
 * Bereinigung prüfbar ist. Bei jedem Zugriff frisch.
 */
export const s1Vorschlag = () => ({
  gegenstand: "Sturmfolgen Orkantief Ilka in Hessen",
  stichtag: "2026-10-14",
  referenzbezug: "Land Hessen",
  horizont: "bis 21.10.2026",
  sachverhalte: [{ titel: "Sturmfolgen Hessen", ereignisarten: ["Unwetter / Sturm"], sops: ["sop-01", "sop-99"], begruendung: "Sturm" }],
  prueffrage: "",
  hinweise: "Nur Stichworte vorhanden",
});

/** Bestätigter Vorschlag mit gültiger SOP und t0 (Eingang für stufe2und3) */
export const bestaetigterVorschlag = () => ({
  gegenstand: "Sturmfolgen Hessen",
  stichtag: "2026-10-14",
  meldezeitpunkt: "2026-10-14T14:00",
  referenzbezug: "Land Hessen",
  horizont: "bis 21.10.2026",
  sachverhalte: [{ titel: "Sturmfolgen Hessen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm" }],
  prueffrage: "",
  hinweise: "",
});

export interface KontextOptionen {
  /** Uhr des Laufs (Vorgabe 14.10.2026 10:00 MESZ) */
  jetzt?: string;
  /** Abweichende Angaben im Auftrag */
  auftrag?: { sachverhalt?: string; stichworte?: string };
}

/** Kontext mit Beispielprofil, Standardeinstellungen, fester Uhr und mitgeschriebenen Laufständen */
export async function pipelineKontext(
  anbieter: LlmAnbieter,
  material: Material[] = [],
  { jetzt = "2026-10-14T10:00:00+02:00", auftrag = {} }: KontextOptionen = {},
): Promise<{ k: Kontext; protokolle: Lauf[] }> {
  const { profil: p } = await profil("lead-beispiel");
  const lauf = neuerLauf(
    p!,
    { sachverhalt: "Orkan in Hessen", stichworte: "Sturm, Bahn", ...auftrag, urls: [AUFTRAGS_URL], stichtag: "2026-10-14", prueffrage: "" },
    [],
  );
  const protokolle: Lauf[] = [];
  return {
    k: {
      profil: p!,
      anbieter,
      einstellungen: STANDARD,
      lauf,
      material,
      aktualisiert: (l) => {
        protokolle.push(structuredClone(l));
      },
      jetzt: () => new Date(jetzt),
    },
    protokolle,
  };
}
