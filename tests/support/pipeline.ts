// Kontext für Tests der Pipeline (stufe1, stufe2und3, nachbearbeiten) mit Beispielprofil und fester Uhr.
import type { LlmAnbieter } from "../../src/anbieter/typen";
import { STANDARD } from "../../src/pipeline/einstellungen";
import { neuerLauf, type Auftrag, type Lauf } from "../../src/pipeline/lauf";
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
  /** Abweichende Angaben im Auftrag (gehen den Vorgaben vor, auch Stichtag und t0) */
  auftrag?: Partial<Auftrag>;
  /** Profilordner (Vorgabe lead-beispiel; seit 0.6.18 auch das Landesprofil lead-thueringen) */
  profilName?: string;
}

/**
 * Kontext mit Beispielprofil, Standardeinstellungen, fester Uhr und mitgeschriebenen Laufständen. Die Nachforderung
 * von S2 (seit 0.6.0) ist hier ausgeschaltet, damit Tests anderer Gegenstände nicht von der Suchnutzung der Attrappe
 * abhängen; Tests der verbindlichen Recherche schalten sie ausdrücklich ein.
 */
export async function pipelineKontext(
  anbieter: LlmAnbieter,
  material: Material[] = [],
  { jetzt = "2026-10-14T10:00:00+02:00", auftrag = {}, profilName = "lead-beispiel" }: KontextOptionen = {},
): Promise<{ k: Kontext; protokolle: Lauf[] }> {
  const { profil: p } = await profil(profilName);
  const lauf = neuerLauf(
    p!,
    { sachverhalt: "Orkan in Hessen", stichworte: "Sturm, Bahn", urls: [AUFTRAGS_URL], stichtag: "2026-10-14", prueffrage: "", ...auftrag },
    [],
  );
  const protokolle: Lauf[] = [];
  return {
    k: {
      profil: p!,
      anbieter,
      einstellungen: { ...STANDARD, nachforderung: false },
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
