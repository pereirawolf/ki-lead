// Zustand der KI-Erfassung als Reducer (seit 0.6.5, TP-2026-W44-17; Vorbild Testlaeufe.tsx). Bis 0.6.4 hielt
// KiErfassung.tsx 22 einzelne useState; Phase und Lauf standen doppelt, „Neue KI-Erfassung“ rief 15 Setter.
// Jetzt: der Ablauf als Union (Phase mit genau den Daten, die sie braucht), die Eingaben des Auftrags als ein Objekt.

import type { Lauf, S1Vorschlag } from "../../pipeline/lauf";
import type { Material } from "../../pipeline/material";
import type { ModellWahl as Modellwahl } from "../../pipeline/einstellungen";
import { jetztLokal } from "../../kern/ausgabe";
import { zoneOder } from "../../kern/zeit";

export type Phase = "auftrag" | "s1" | "bestaetigen" | "orientierung" | "s2" | "ergebnis";

/**
 * Ablauf eines KI-Laufs. Im Auftrag kann der zuletzt gescheiterte oder abgebrochene Lauf stehen (Protokoll
 * exportieren); ab S1 gibt es immer einen Lauf, ab der Bestätigung immer einen Vorschlag.
 */
export type Ablauf =
  | { phase: "auftrag"; lauf: Lauf | null }
  | { phase: "s1"; lauf: Lauf }
  | { phase: "bestaetigen"; lauf: Lauf; vorschlag: S1Vorschlag }
  | { phase: "orientierung"; lauf: Lauf; vorschlag: S1Vorschlag }
  | { phase: "s2"; lauf: Lauf; vorschlag: S1Vorschlag }
  | { phase: "ergebnis"; lauf: Lauf; vorschlag: S1Vorschlag };

/** Eingaben des Auftrags (Schritt 1) */
export interface Eingabe {
  sachverhalt: string;
  stichworte: string;
  urlText: string;
  stichtag: string;
  uhrzeit: string;
  prueffrage: string;
  material: Material[];
  dateiFehler: string[];
  datenOk: boolean;
  /** null = automatisch (aus bei Verdichtung, sonst an) */
  websucheWahl: boolean | null;
  /** Modelle nur für diesen Lauf, abweichend von „Einstellungen“ */
  modellWahl: Modellwahl;
}

export interface KiZustand {
  ablauf: Ablauf;
  eingabe: Eingabe;
  fehler: string | null;
}

export type KiAktion =
  | { typ: "eingabe"; teil: Partial<Eingabe> }
  | { typ: "material"; aendern: (alt: Material[]) => Material[] }
  | { typ: "sachverhaltVorschlagen"; text: string }
  | { typ: "fehler"; text: string | null }
  /** Neuer Lauf in S1 */
  | { typ: "s1"; lauf: Lauf }
  /** Lauf aktualisiert (Fortschritt der Pipeline); gilt in jeder Phase */
  | { typ: "lauf"; lauf: Lauf }
  | { typ: "vorschlag"; vorschlag: S1Vorschlag }
  /** S1 oder Orientierung fertig: Bestätigung mit dem (neuen) Vorschlag */
  | { typ: "bestaetigen"; vorschlag?: S1Vorschlag }
  | { typ: "orientierung" }
  | { typ: "s2" }
  | { typ: "ergebnis" }
  /** Zurück zum Auftrag; mit `lauf` bleibt dieser Lauf (Fehler, Protokoll) sichtbar */
  | { typ: "zumAuftrag"; lauf?: Lauf | null }
  /** Neue KI-Erfassung: alles leeren, Stichtag neu */
  | { typ: "leeren"; stichtag: string };

/** Heutiger Tag in der Zeitzone des Profils (wie in der Pipeline, nicht in der des Geräts) */
export function heute(zone: string | undefined): string {
  return jetztLokal(zoneOder(zone), new Date()).slice(0, 10);
}

export function leereEingabe(stichtag: string): Eingabe {
  return {
    sachverhalt: "",
    stichworte: "",
    urlText: "",
    stichtag,
    uhrzeit: "",
    prueffrage: "",
    material: [],
    dateiFehler: [],
    datenOk: false,
    websucheWahl: null,
    modellWahl: {},
  };
}

export function startZustand(stichtag: string): KiZustand {
  return { ablauf: { phase: "auftrag", lauf: null }, eingabe: leereEingabe(stichtag), fehler: null };
}

/** Vorschlag des Ablaufs, falls die Phase einen hat */
export function vorschlagVon(a: Ablauf): S1Vorschlag | null {
  return "vorschlag" in a ? a.vorschlag : null;
}

export function kiReducer(z: KiZustand, a: KiAktion): KiZustand {
  const { ablauf } = z;
  switch (a.typ) {
    case "eingabe":
      return { ...z, eingabe: { ...z.eingabe, ...a.teil } };
    case "material":
      return { ...z, eingabe: { ...z.eingabe, material: a.aendern(z.eingabe.material) } };
    case "sachverhaltVorschlagen":
      return z.eingabe.sachverhalt ? z : { ...z, eingabe: { ...z.eingabe, sachverhalt: a.text } };
    case "fehler":
      return { ...z, fehler: a.text };
    case "s1":
      return { ...z, ablauf: { phase: "s1", lauf: a.lauf } };
    case "lauf":
      return { ...z, ablauf: { ...ablauf, lauf: a.lauf } };
    case "vorschlag":
      return "vorschlag" in ablauf ? { ...z, ablauf: { ...ablauf, vorschlag: a.vorschlag } } : z;
    case "bestaetigen": {
      const vorschlag = a.vorschlag ?? vorschlagVon(ablauf);
      return ablauf.lauf && vorschlag ? { ...z, ablauf: { phase: "bestaetigen", lauf: ablauf.lauf, vorschlag } } : z;
    }
    case "orientierung":
    case "s2":
    case "ergebnis": {
      const vorschlag = vorschlagVon(ablauf);
      return ablauf.lauf && vorschlag ? { ...z, ablauf: { phase: a.typ, lauf: ablauf.lauf, vorschlag } } : z;
    }
    case "zumAuftrag":
      return { ...z, ablauf: { phase: "auftrag", lauf: a.lauf === undefined ? ablauf.lauf : a.lauf } };
    case "leeren":
      return startZustand(a.stichtag);
  }
}

export const PHASEN: { id: Phase; titel: string }[] = [
  { id: "auftrag", titel: "Auftrag und Material" },
  { id: "bestaetigen", titel: "Gegenstand bestätigen" },
  { id: "s2", titel: "Recherche und Entwurf" },
  { id: "ergebnis", titel: "Prüfung und Übergabe" },
];

export function dauer(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}

export function groesse(b: number): string {
  return b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export const speicherText = (was: string, e: unknown) => `${was} (${(e as Error)?.message || "Speicherfehler"}).`;
