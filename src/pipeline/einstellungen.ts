// Einstellungen der KI-Pipeline. Leere Modellfelder bedeuten: Vorgabe des Profils bzw. der App.

import { aufwandAngeboten, aufwandStufenFuer } from "../anbieter/aufwand";
import type { Aufwand } from "../anbieter/typen";
import type { MistralEndpunkt } from "../anbieter/mistral";
import { OLLAMA_PRAEFIX } from "../anbieter/ollama";
import { optionenVollstaendig, STANDARD_ANBIETER_OPTIONEN, type AnbieterOptionen, type AnbieterOptionenTeil } from "../anbieter/optionen";
import { betrieb } from "../anbieter/betrieb";
import { stelleKennung, STELLE_NAME } from "../anbieter/stelle";
import { bekannterAnbieter, faehigkeitenFuer, freigegeben, freigegebeneAnbieter, modellFreigegeben, type AnbieterId } from "../anbieter/verteiler";
import type { Profil } from "../kern/typen";

export type Rolle = "vorverarbeitung" | "erfassung" | "verdichtung" | "reparatur" | "kurzfassung";

export interface Einstellungen {
  modelle: Record<Rolle, string>;
  aufwand: Record<Rolle, Aufwand>;
  websucheMax: number;
  abrufMax: number;
  /** Höchstlänge je abgerufener Seite (Token); begrenzt Kosten bei sehr langen Seiten */
  abrufMaxTokens: number;
  /** ISO-Ländercode für die Lokalisierung der Websuche */
  suchland: string;
  /**
   * Orientierungssuchen je bestätigtem Sachverhalt in S1 bei „Recherche durchführen“ (seit 0.6.0, KP-2026-W44-04/-09;
   * 0 = keine). Ohne Seitenabruf, mit dem S1-Modell; nicht auf das Websuchen-Kontingent von S2 angerechnet.
   */
  orientierungJeSachverhalt: number;
  /** Einmalige Nachforderung, wenn S2 Pflichtsuchen auslässt oder nicht sucht (seit 0.6.0, KP-2026-W44-08) */
  nachforderung: boolean;
  /**
   * Höchstzahl Ausgabetoken für jeden KI-Aufruf (S1, S2, S3, Management Summary). Der Name stammt aus der Zeit,
   * als der Wert nur für S2 und S3 galt; er bleibt, damit gespeicherte Einstellungen gültig bleiben.
   */
  maxTokensErfassung: number;
  /**
   * Wahl je Anbieter (seit 0.6.3, TP-2026-W44-26; ersetzt `mistralEndpunkt`, Fassung 6): Mistral-Endpunkt („eu“ =
   * api.eu.mistral.ai ohne Websuche, Vorgabe; „global“ = api.mistral.ai mit Websuche), Adresse und lokales Modell für
   * Ollama. Fehlende Werte ergänzt die App mit den Vorgaben.
   */
  anbieterOptionen: AnbieterOptionen;
  /**
   * Forschungsfunktionen anzeigen (seit 0.6.16, TP-2026-W44-46, Fassung 7): Bereich „Testläufe“ und Vergleich eines
   * Laufs mit einer Referenzfassung. Vorgabe aus (Erprobungsansicht als Normalfall, Entscheidung des Herausgebers vom
   * 31.10.2026); Arbeitsschritte, Laufprotokolle und gespeicherte Testläufe bleiben unabhängig davon.
   */
  forschung: boolean;
  /** Fassung der gespeicherten Einstellungen (für Umstellungen der Vorgaben) */
  fassung?: number;
}

/**
 * Vorgaben der App für Profile ohne eigene Modellvorgabe; gleich dem Standard-Profil Anthropic. Verdichtung seit 0.5.10
 * mit Opus statt Sonnet (AV-2026-W43-10, entschieden am 25.10.2026): Sonnet kam im Vergleichslauf Ilka den Radarwerten
 * von Opus nahe, ließ aber die Tendenz im Stromausfall-Sachverhalt in zwei von drei Läufen offen; Bezug, Messwerte und
 * Standard-Profil beruhen auf Opus (evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md). Reparatur seit
 * 0.5.15 mit Haiku statt Sonnet (AV-2026-W43-32, Prüffall Reparatur vom 25.10.2026: beide 10/10 fehlerfrei, Haiku zu
 * rund einem Zwanzigstel der Kosten; evaluation/abnahmen/2026-10-25-reparatur-ilka-ergebnis.md).
 */
export const APP_MODELLE: Record<Rolle, string> = {
  vorverarbeitung: "claude-haiku-5-5",
  erfassung: "claude-opus-5-5",
  verdichtung: "claude-opus-5-5",
  reparatur: "claude-haiku-5-5",
  kurzfassung: "claude-sonnet-5-5",
};

export const MODELL_GRUPPEN: { anbieter: string; modelle: string[] }[] = [
  { anbieter: "Anthropic", modelle: ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1"] },
  { anbieter: "OpenAI", modelle: ["gpt-6-luna", "gpt-6.1-sol", "gpt-6-astra"] },
  { anbieter: "Mistral", modelle: ["mistral-small-2603", "mistral-medium-3-5", "mistral-large-4"] },
];

export const MODELL_AUSWAHL = MODELL_GRUPPEN.flatMap((g) => g.modelle);

/** Kennung eines lokalen Modells über Ollama, z. B. „ollama:llama3.1“ */
export function ollamaKennung(modell: string): string {
  return `${OLLAMA_PRAEFIX}${modell.trim()}`;
}

/**
 * Auswahlgruppen der Modelle mit dem lokalen Modell aus den Einstellungen (seit 0.6.3, TP-2026-W44-26). Ist ein anderes
 * lokales Modell gewählt (etwa vor einem Wechsel unter „Einstellungen“), steht es ebenfalls zur Wahl.
 */
export function modellGruppen(e: Pick<Einstellungen, "anbieterOptionen" | "modelle">): { anbieter: string; modelle: string[] }[] {
  const lokal = ollamaKennung(optionenVollstaendig(e.anbieterOptionen).ollama.modell);
  const gewaehlt = Object.values(e.modelle).filter((m) => bekannterAnbieter(m) === "ollama" && m !== lokal);
  // Seit 0.6.17 (TP-2026-W44-48) nur Modelle freigegebener Anbieter, dazu das Modell des Endpunkts der Stelle
  const gruppen = [
    ...MODELL_GRUPPEN,
    { anbieter: "Ollama (lokal)", modelle: [lokal, ...new Set(gewaehlt)] },
    ...(betrieb().stelle ? [{ anbieter: STELLE_NAME, modelle: [stelleKennung(betrieb().stelle!.modell)] }] : []),
  ];
  return gruppen.map((g) => ({ ...g, modelle: g.modelle.filter(modellFreigegeben) })).filter((g) => g.modelle.length > 0);
}

export const STANDARD: Einstellungen = {
  modelle: { vorverarbeitung: "", erfassung: "", verdichtung: "", reparatur: "", kurzfassung: "" },
  aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  websucheMax: 15,
  abrufMax: 10,
  abrufMaxTokens: 15000,
  suchland: "DE",
  orientierungJeSachverhalt: 1,
  nachforderung: true,
  maxTokensErfassung: 128000,
  anbieterOptionen: STANDARD_ANBIETER_OPTIONEN,
  forschung: false,
  fassung: 7,
};

/**
 * Standard-Profil je Anbieter: Modell und Aufwand je Aufgabe, mit einem Klick unter „Einstellungen“ zu setzen.
 * Anthropic entspricht den Vorgaben der App und des Beispielprofils (Verdichtung mit Opus wie in der Abnahme M4);
 * OpenAI nimmt die Gegenstücke gleicher Größe (klein, mittel, groß).
 * Mistral (seit 0.5.6): Mistral Small 4 für S1 und S3, Mistral Medium 3.5 für S2 und die Management Summary, jeweils mit
 * Nachdenken („hoch“, seit 0.5.10; Mistral kennt nur „niedrig“ = ohne und „hoch“ = mit, AV-2026-W43-03). Erprobt mit
 * der Verdichtung Ilka am 24.10.2026: EU-Endpunkt 7 Läufe, globaler Endpunkt 3 Läufe, ohne Websuche.
 *
 * Bezug (AV-2026-W43-04, entschieden am 24.10.2026): Das Standard-Profil Anthropic ist der Maßstab. Die Standard-Profile
 * OpenAI und Mistral werden so gewählt, dass sie bei der Verdichtung Ilka in den Kennzahlen des Vergleichslaufs der
 * Anthropic-Reihe am nächsten kommen (evaluation/plaene/standardprofile-ilka.json, Auswertung mit
 * npm run vergleichslauf:auswerten); ein teureres Modell oder eine höhere Stufe ist dafür zulässig. Kosten und Dauer
 * werden berichtet, entscheiden aber nicht.
 *
 * Ergebnis (25.10.2026, je drei Läufe, evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md):
 * - OpenAI (AV-2026-W43-13): Verdichtung mit gpt-6-astra „high“ (Variante D), weil sie in Radarabstand (0,80 statt 1,20),
 *   Tendenz und Ähnlichkeit näher an der Anthropic-Reihe liegt als „medium“ (Variante C, zweitbeste Option); beide lassen
 *   D2 und D4 offen und führen die Zahl der Stromlosen nicht zusammen. Erfassung bleibt „medium“ (nicht verglichen).
 *   Folgereihe 25.10.2026 mit „xhigh“ (AV-2026-W43-21): nicht näher, ohne Tendenz und mit weniger gesetzten Achsen;
 *   „high“ bleibt.
 * - Mistral (AV-2026-W43-14): Verdichtung mit mistral-medium-3-5 „high“ (Variante E), weil sie in Beurteilung,
 *   Achsenabweichung, Muss-Punkten und Zahlentreue näher an der Anthropic-Reihe liegt als mistral-large-4 „high“
 *   (Variante F, zweitbeste Option; nur im Radarabstand knapp näher, Public Preview, mehr Zahlenfehler).
 *
 * Seit 0.5.15 (Prüffall Reparatur und Management Summary vom 25.10.2026, evaluation/abnahmen/2026-10-25-reparatur-ilka-ergebnis.md
 * und 2026-10-25-management-summary-ilka-ergebnis.md):
 * - Reparatur Anthropic mit claude-haiku-5-5 „low“ statt Sonnet (AV-2026-W43-32): 10/10 fehlerfrei wie Sonnet, 0,010 statt
 *   rund 0,20 USD je Fall. OpenAI bleibt bei gpt-6.1-sol „low“ (10/10); gpt-6-luna setzte D2 am Skalenrand.
 * - Reparatur Mistral in 0.5.15 mit mistral-medium-3-5 „low“ statt Small (AV-2026-W43-33): Small leerte eine Beurteilung
 *   und strich Textzeilen; Medium löscht nichts, setzte aber D2 am Skalenrand. Seit 0.5.16 wieder mit mistral-small-2603
 *   „low“ (AV-2026-W43-39): Mit der geschärften Anweisung (AV-2026-W43-34) reparierten Small und Medium im Nachtest je 10/10
 *   fehlerfrei; Small kostet 0,008 statt 0,10 USD je Fall.
 * - Erfassung OpenAI mit gpt-6-astra „high“ wie die Verdichtung (AV-2026-W43-37). Die Erfassung ist in keinem Profil gemessen;
 *   sie folgt dem Modell und der Stufe der Verdichtung.
 * - Management Summary bestätigt: Sonnet „medium“, gpt-6.1-sol „medium“, Mistral Medium 3.5 „high“ (Large 4 nicht besser).
 */
export interface ModellProfil {
  modelle: Record<Rolle, string>;
  aufwand: Record<Rolle, Aufwand>;
}

export const STANDARD_PROFILE: Record<AnbieterId, ModellProfil> = {
  anthropic: {
    modelle: {
      vorverarbeitung: "claude-haiku-5-5",
      erfassung: "claude-opus-5-5",
      verdichtung: "claude-opus-5-5",
      reparatur: "claude-haiku-5-5",
      kurzfassung: "claude-sonnet-5-5",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  },
  openai: {
    modelle: {
      vorverarbeitung: "gpt-6-luna",
      erfassung: "gpt-6-astra",
      verdichtung: "gpt-6-astra",
      reparatur: "gpt-6.1-sol",
      kurzfassung: "gpt-6.1-sol",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "high", verdichtung: "high", reparatur: "low", kurzfassung: "medium" },
  },
  mistral: {
    modelle: {
      vorverarbeitung: "mistral-small-2603",
      erfassung: "mistral-medium-3-5",
      verdichtung: "mistral-medium-3-5",
      reparatur: "mistral-small-2603",
      kurzfassung: "mistral-medium-3-5",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "high", verdichtung: "high", reparatur: "low", kurzfassung: "high" },
  },
  ollama: ollamaProfil(STANDARD_ANBIETER_OPTIONEN.ollama.modell),
  // Endpunkt der Stelle (seit 0.6.17, TP-2026-W44-49): aus der Betreiberkonfiguration, deshalb erst beim Zugriff
  get stelle(): ModellProfil {
    return stelleProfil();
  },
};

/**
 * Standard-Profil des Endpunkts der Stelle (seit 0.6.17, TP-2026-W44-49): das Modell aus der Betreiberkonfiguration für alle
 * Aufgaben, feste Stufe „mittel“ (gesendet wird kein Aufwand). Ohne Endpunkt leer.
 */
export function stelleProfil(): ModellProfil {
  const s = betrieb().stelle;
  const m = s ? stelleKennung(s.modell) : "";
  return {
    modelle: { vorverarbeitung: m, erfassung: m, verdichtung: m, reparatur: m, kurzfassung: m },
    aufwand: { vorverarbeitung: "medium", erfassung: "medium", verdichtung: "medium", reparatur: "medium", kurzfassung: "medium" },
  };
}

/**
 * Schlichtes Standard-Profil Ollama (seit 0.6.3, TP-2026-W44-26): ein lokales Modell für alle Aufgaben, feste Stufe
 * „mittel“ (die App sendet keinen Aufwand). Das Modell ist frei wählbar (Einstellungen → KI-Anbieter & API); nicht erprobt,
 * keine Websuche.
 */
export function ollamaProfil(modell: string): ModellProfil {
  const m = ollamaKennung(modell);
  return {
    modelle: { vorverarbeitung: m, erfassung: m, verdichtung: m, reparatur: m, kurzfassung: m },
    aufwand: { vorverarbeitung: "medium", erfassung: "medium", verdichtung: "medium", reparatur: "medium", kurzfassung: "medium" },
  };
}

/** Hinweis der Oberfläche zu lokalen Modellen (seit 0.6.3, TP-2026-W44-26) */
export const OLLAMA_HINWEIS = "Lokale Modelle über Ollama arbeiten ohne Websuche und Seitenabruf; die Ergebnisqualität in KI-LEAD ist nicht erprobt.";

/** Standard-Profil eines Anbieters; für Ollama mit dem lokalen Modell aus den Einstellungen */
export function standardProfilFuer(anbieter: AnbieterId, e: Pick<Einstellungen, "anbieterOptionen">): ModellProfil {
  return anbieter === "ollama" ? ollamaProfil(optionenVollstaendig(e.anbieterOptionen).ollama.modell) : STANDARD_PROFILE[anbieter];
}

/** Kennungen der Mix-Profile (seit 0.5.15) */
export type MixId = "mix-opus" | "mix-sonnet";
export const MIX_IDS: MixId[] = ["mix-opus", "mix-sonnet"];

/**
 * Mix-Profile (seit 0.5.15, AV-2026-W43-31; löst AV-2026-W43-30 ab): S1 von OpenAI, S2, Reparatur und Management Summary von
 * Anthropic. Grundlage: Plan anbietermix-ilka (M1, M2; evaluation/abnahmen/2026-10-25-anbietermix-ilka-ergebnis.md), Prüffall
 * Reparatur und Management Summary vom 25.10.2026. Die Erfassung folgt der Verdichtung (abgeleitet, nicht gemessen). Für
 * Läufe braucht es Schlüssel für OpenAI und Anthropic; die Inhalte gehen an beide Anbieter. Keine Vorgabe der App.
 */
export const MIX_PROFILE: Record<MixId, ModellProfil & { titel: string; anbieter: AnbieterId[] }> = {
  "mix-opus": {
    titel: "Mix: OpenAI S1 + Anthropic Opus",
    anbieter: ["openai", "anthropic"],
    modelle: {
      vorverarbeitung: "gpt-6-luna",
      erfassung: "claude-opus-5-5",
      verdichtung: "claude-opus-5-5",
      reparatur: "claude-haiku-5-5",
      kurzfassung: "claude-sonnet-5-5",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  },
  "mix-sonnet": {
    titel: "Mix: OpenAI S1 + Anthropic Sonnet",
    anbieter: ["openai", "anthropic"],
    modelle: {
      vorverarbeitung: "gpt-6-luna",
      erfassung: "claude-sonnet-5-5",
      verdichtung: "claude-sonnet-5-5",
      reparatur: "claude-haiku-5-5",
      kurzfassung: "claude-sonnet-5-5",
    },
    aufwand: { vorverarbeitung: "high", erfassung: "medium", verdichtung: "medium", reparatur: "low", kurzfassung: "medium" },
  },
};

/** Mix-Profile, deren Anbieter alle freigegeben sind (seit 0.6.17, TP-2026-W44-48) */
export function freigegebeneMixe(): MixId[] {
  return MIX_IDS.filter((m) => MIX_PROFILE[m].anbieter.every(freigegeben));
}

/** Setzt Modell und Aufwand aller Aufgaben auf ein Modellprofil; alles andere bleibt. */
export function modellProfilAnwenden(e: Einstellungen, p: ModellProfil): Einstellungen {
  return { ...e, modelle: { ...p.modelle }, aufwand: { ...p.aufwand } };
}

/** Sind Modell und Aufwand aller Aufgaben gerade genau dieses Modellprofil? */
export function modellProfilAktiv(e: Einstellungen, p: ModellProfil): boolean {
  return ROLLEN.every((r) => e.modelle[r] === p.modelle[r] && e.aufwand[r] === p.aufwand[r]);
}

/** Setzt Modell und Aufwand aller Aufgaben auf das Standard-Profil des Anbieters; alles andere bleibt. */
export function standardProfilAnwenden(e: Einstellungen, anbieter: AnbieterId): Einstellungen {
  return modellProfilAnwenden(e, standardProfilFuer(anbieter, e));
}

/**
 * Modelle leeren (Vorgabe des aktiven Profils bzw. der App) und den Aufwand auf die Vorgaben der App setzen;
 * alles andere bleibt.
 */
export function profilvorgabeAnwenden(e: Einstellungen): Einstellungen {
  return { ...e, modelle: { ...STANDARD.modelle }, aufwand: { ...STANDARD.aufwand } };
}

/** Folgen Modell und Aufwand aller Aufgaben gerade den Vorgaben des Profils (keine eigene Wahl)? */
export function profilvorgabeAktiv(e: Einstellungen): boolean {
  return ROLLEN.every((r) => !e.modelle[r] && e.aufwand[r] === STANDARD.aufwand[r]);
}

/** Sind Modell und Aufwand aller Aufgaben gerade genau das Standard-Profil des Anbieters? */
export function standardProfilAktiv(e: Einstellungen, anbieter: AnbieterId): boolean {
  return modellProfilAktiv(e, standardProfilFuer(anbieter, e));
}

/** Setzt Modell und Aufwand aller Aufgaben auf ein Mix-Profil; alles andere bleibt. */
export function mixProfilAnwenden(e: Einstellungen, id: MixId): Einstellungen {
  return modellProfilAnwenden(e, MIX_PROFILE[id]);
}

/** Sind Modell und Aufwand aller Aufgaben gerade genau dieses Mix-Profil? */
export function mixProfilAktiv(e: Einstellungen, id: MixId): boolean {
  return modellProfilAktiv(e, MIX_PROFILE[id]);
}

/**
 * Standard-Profile bis Fassung 3 der Einstellungen (bis 0.5.14): Anthropic reparierte mit Sonnet, OpenAI erfasste mit
 * „medium“, Mistral reparierte mit Small (seit 0.5.16 wieder so, AV-2026-W43-39). Gespeicherte Einstellungen, die genau einem davon entsprechen, stellt
 * einstellungenLesen auf das heutige Standard-Profil um (AV-2026-W43-32, -33, -37).
 */
export const STANDARD_PROFILE_FASSUNG_3: Record<Exclude<AnbieterId, "ollama" | "stelle">, ModellProfil> = {
  anthropic: {
    modelle: { ...STANDARD_PROFILE.anthropic.modelle, reparatur: "claude-sonnet-5-5" },
    aufwand: { ...STANDARD_PROFILE.anthropic.aufwand },
  },
  openai: {
    modelle: { ...STANDARD_PROFILE.openai.modelle },
    aufwand: { ...STANDARD_PROFILE.openai.aufwand, erfassung: "medium" },
  },
  mistral: {
    modelle: { ...STANDARD_PROFILE.mistral.modelle, reparatur: "mistral-small-2603" },
    aufwand: { ...STANDARD_PROFILE.mistral.aufwand },
  },
};

/**
 * Standard-Profil Mistral der Fassung 4 der Einstellungen (0.5.15): Reparatur mit Medium 3.5. Gespeicherte Einstellungen,
 * die genau ihm entsprechen, stellt einstellungenLesen auf das heutige Standard-Profil um (AV-2026-W43-39).
 */
export const STANDARD_PROFIL_MISTRAL_FASSUNG_4: ModellProfil = {
  modelle: { ...STANDARD_PROFILE.mistral.modelle, reparatur: "mistral-medium-3-5" },
  aufwand: { ...STANDARD_PROFILE.mistral.aufwand },
};

/**
 * Modellvorgabe des Profils für eine Aufgabe, sofern ein Anbieter die Kennung erkennt (seit 0.6.3, TP-2026-W44-26). Eine
 * unbekannte Kennung meldet schon das Laden des Profils als Warnung; es gilt dann die Vorgabe der App.
 */
export function profilModell(rolle: Rolle, profil: Profil | null): string | undefined {
  const m = profil?.manifest.modelle?.[rolle];
  return m && bekannterAnbieter(m) && modellFreigegeben(m) ? m : undefined;
}

/**
 * Vorgabe der App für eine Aufgabe: APP_MODELLE (Anthropic); gibt der Build Anthropic nicht frei (seit 0.6.17,
 * TP-2026-W44-48), das Standard-Profil des ersten freigegebenen Anbieters.
 */
export function appModell(rolle: Rolle): string {
  if (freigegeben("anthropic")) return APP_MODELLE[rolle];
  const erster = freigegebeneAnbieter()[0];
  return erster ? standardProfilFuer(erster, STANDARD).modelle[rolle] : APP_MODELLE[rolle];
}

/** Eigene Wahl einer Aufgabe, sofern ihr Anbieter in diesem Build freigegeben ist (seit 0.6.17) */
function eigeneWahl(rolle: Rolle, e: Einstellungen): string {
  const m = e.modelle[rolle];
  return m && (modellFreigegeben(m) || !bekannterAnbieter(m)) ? m : "";
}

export function modellFuer(rolle: Rolle, e: Einstellungen, profil: Profil | null): string {
  return eigeneWahl(rolle, e) || profilModell(rolle, profil) || appModell(rolle);
}

/**
 * Wirksamer Aufwand einer Aufgabe (seit 0.5.10, AV-2026-W43-02): die eingestellte Stufe, wenn das wirksame Modell sie
 * anbietet, sonst die nächsthöhere angebotene, ohne höhere die nächstniedrigere (Mistral: „mittel“ → „hoch“). Pipeline,
 * Schätzung, Vergleichslauf und Laufprotokoll verwenden diese Stufe.
 */
export function aufwandFuer(rolle: Rolle, e: Einstellungen, profil: Profil): Aufwand {
  return aufwandAngeboten(modellFuer(rolle, e, profil), e.aufwand[rolle]);
}

/** Stufen des Aufwands, die das Modell anbietet, mit deutscher Bezeichnung (Auswahl in Einstellungen und je Lauf) */
export function aufwandAuswahl(modell: string): { id: Aufwand; titel: string }[] {
  const stufen = aufwandStufenFuer(modell);
  // Lokale Modelle (Ollama): eine feste Stufe, die App sendet keinen Aufwand (seit 0.6.3, TP-2026-W44-26)
  // Ebenso der Endpunkt der Stelle (seit 0.6.17, TP-2026-W44-49)
  if (stufen.length === 1 && stufen[0])
    return [{ id: stufen[0], titel: modell.startsWith("stelle:") ? "fest – bestimmt der Endpunkt der Stelle" : "fest – bestimmt das lokale Modell" }];
  const nurAnAus = stufen.length === 2 && stufen.includes("low") && stufen.includes("high");
  return AUFWAND_STUFEN.filter((a) => stufen.includes(a.id)).map((a) =>
    nurAnAus ? { id: a.id, titel: a.id === "low" ? "niedrig – ohne Nachdenken" : "hoch – mit Nachdenken" } : a,
  );
}

export { aufwandAngeboten, aufwandStufenFuer };

/** Woher das wirksame Modell einer Aufgabe stammt: eigene Einstellung, Vorgabe des Profils oder der App */
export function modellHerkunft(rolle: Rolle, e: Einstellungen, profil: Profil | null): "einstellung" | "profil" | "app" {
  if (eigeneWahl(rolle, e)) return "einstellung";
  return profilModell(rolle, profil) ? "profil" : "app";
}

/**
 * Gespeicherte Einstellungen auf die heutige Fassung bringen und mit den Vorgaben ergänzen. Reine Funktion; das Lesen aus
 * dem Gerätespeicher liegt seit 0.6.3 (TP-2026-W44-24) in src/speicher/einstellungsSpeicher.ts.
 */
/** Gespeicherte Einstellungen in beliebiger Fassung; bis Fassung 5 mit `mistralEndpunkt` statt `anbieterOptionen` */
export type GespeicherteEinstellungen = Omit<Partial<Einstellungen>, "anbieterOptionen"> & {
  anbieterOptionen?: AnbieterOptionenTeil;
  mistralEndpunkt?: MistralEndpunkt;
};

export function einstellungenMigrieren(gespeichert: GespeicherteEinstellungen | undefined): Einstellungen {
  const g: GespeicherteEinstellungen | undefined = gespeichert ? structuredClone(gespeichert) : undefined;
  // Fassung 1 → 2: S2 brauchte bei hohem Aufwand bis zu 60 000 Token zum Nachdenken und brach an
  // der alten Grenze von 64 000 Ausgabetoken ab. Alte Vorgaben werden daher angehoben.
  if (g && !g.fassung) {
    if (g.maxTokensErfassung === 64000) g.maxTokensErfassung = 128000;
    if (g.aufwand?.erfassung === "high") g.aufwand = { ...g.aufwand, erfassung: "medium" };
    g.fassung = 2;
  }
  // Fassung 2 → 3: S1 hielt bei mittlerem Aufwand Regeln zu t0 und Prüffrage oft nicht ein. Die alte
  // Vorgabe „medium“ wird auf „high“ angehoben; eine bewusst andere Wahl bleibt stehen.
  if (g && g.fassung === 2) {
    if (g.aufwand?.vorverarbeitung === "medium") g.aufwand = { ...g.aufwand, vorverarbeitung: "high" };
    g.fassung = 3;
  }
  // Fassung 3 → 4 (0.5.15): Wer genau einem bisherigen Standard-Profil folgt, folgt danach dem heutigen (Reparatur
  // Anthropic mit Haiku, Erfassung OpenAI „high“; Mistral seit 0.5.16 wieder wie in Fassung 3). Eine abweichende Wahl bleibt.
  if (g && g.fassung === 3) {
    const voll = {
      ...STANDARD,
      ...g,
      modelle: { ...STANDARD.modelle, ...(g.modelle || {}) },
      aufwand: { ...STANDARD.aufwand, ...(g.aufwand || {}) },
      anbieterOptionen: STANDARD.anbieterOptionen,
    };
    const alt = (Object.keys(STANDARD_PROFILE_FASSUNG_3) as (keyof typeof STANDARD_PROFILE_FASSUNG_3)[]).find((a) =>
      modellProfilAktiv(voll, STANDARD_PROFILE_FASSUNG_3[a]),
    );
    if (alt) Object.assign(g, modellProfilAnwenden(voll, STANDARD_PROFILE[alt]));
    g.fassung = 4;
  }
  // Fassung 4 → 5 (0.5.16): Wer dem Mistral-Standard aus 0.5.15 folgt (Reparatur Medium 3.5), folgt danach dem heutigen
  // (Reparatur Small). Eine abweichende Wahl bleibt.
  if (g && g.fassung === 4) {
    const voll = {
      ...STANDARD,
      ...g,
      modelle: { ...STANDARD.modelle, ...(g.modelle || {}) },
      aufwand: { ...STANDARD.aufwand, ...(g.aufwand || {}) },
      anbieterOptionen: STANDARD.anbieterOptionen,
    };
    if (modellProfilAktiv(voll, STANDARD_PROFIL_MISTRAL_FASSUNG_4)) Object.assign(g, modellProfilAnwenden(voll, STANDARD_PROFILE.mistral));
    g.fassung = 5;
  }
  // Fassung 5 → 6 (0.6.3, TP-2026-W44-26): `mistralEndpunkt` wird zu `anbieterOptionen.mistral.endpunkt`; die übrigen
  // Optionen (Ollama) erhalten ihre Vorgaben. Die Wahl des Endpunkts bleibt.
  if (g && g.fassung === 5) {
    g.anbieterOptionen = { ...g.anbieterOptionen, mistral: { endpunkt: g.mistralEndpunkt ?? "eu", ...g.anbieterOptionen?.mistral } };
    g.fassung = 6;
  }
  // Fassung 6 → 7 (0.6.16, TP-2026-W44-46): Schalter „Forschungsfunktionen anzeigen“ mit der Vorgabe aus, auch für
  // bestehende Einstellungen (Erprobungsansicht als Normalfall); einschalten unter „Einstellungen → Übersicht“.
  if (g && g.fassung === 6) {
    g.forschung = false;
    g.fassung = 7;
  }
  const { mistralEndpunkt: _alt, anbieterOptionen, ...rest } = g ?? {};
  return {
    ...STANDARD,
    ...rest,
    modelle: { ...STANDARD.modelle, ...(g?.modelle || {}) },
    aufwand: { ...STANDARD.aufwand, ...(g?.aufwand || {}) },
    anbieterOptionen: optionenVollstaendig(anbieterOptionen),
  };
}

/**
 * Werkzeuge, die das Modell mit diesen Einstellungen tatsächlich nutzen kann. Anthropic und OpenAI: beide;
 * Mistral: über den EU-Endpunkt keine, global nur die Websuche; Ollama (lokal): keine. Seit 0.6.3 (TP-2026-W44-26) aus
 * der Beschreibung des Anbieters (`faehigkeitenFuer`); eine unbekannte Kennung hat keine Werkzeuge.
 */
export function werkzeugeFuer(modell: string, e: { anbieterOptionen?: AnbieterOptionenTeil }): { websuche: boolean; abruf: boolean } {
  const f = faehigkeitenFuer(modell, e.anbieterOptionen);
  return { websuche: f.websuche, abruf: f.abruf };
}

/** Höchstzahl der Orientierungssuchen je Sachverhalt */
export const ORIENTIERUNG_GRENZE = 3;

/** Gültige Zahl der Orientierungssuchen je Sachverhalt (0 bis ORIENTIERUNG_GRENZE) */
export function orientierungJeSachverhalt(e: Partial<Pick<Einstellungen, "orientierungJeSachverhalt">>): number {
  const n = Math.round(Number(e.orientierungJeSachverhalt ?? STANDARD.orientierungJeSachverhalt));
  return Number.isFinite(n) ? Math.min(ORIENTIERUNG_GRENZE, Math.max(0, n)) : STANDARD.orientierungJeSachverhalt;
}

/**
 * Modelle, die eine Websuche nicht erzwingen lassen (seit 0.6.0, KP-2026-W44-05). Anthropic: Opus 5.5, Sonnet 5.5,
 * Fable 5.1 und Mythos 5.1 lehnen erzwungene Werkzeugnutzung mit Fehler 400 ab (Anthropic, „Building with extended
 * thinking“, abgerufen 26.10.2026). OpenAI und Mistral: nicht belegt erprobt, daher nicht erzwungen.
 */
const OHNE_ERZWUNGENE_SUCHE = /^claude-(opus-5-5|sonnet-5-5|fable-5-1|mythos-5-1)/;

/** Ob die App die Websuche bei diesem Modell erzwingen kann; sonst entscheidet das Modell, und die App zählt nach */
export function sucheErzwingbar(modell: string): boolean {
  return bekannterAnbieter(modell) === "anthropic" && !OHNE_ERZWUNGENE_SUCHE.test(modell);
}

/** Modelle, die ein Lauf der KI-Erfassung voraussichtlich nutzt. */
export function laufModelle(e: Einstellungen, profil: Profil, verdichtung: boolean): string[] {
  return [modellFuer("vorverarbeitung", e, profil), modellFuer(verdichtung ? "verdichtung" : "erfassung", e, profil), modellFuer("reparatur", e, profil)];
}

/** Stufen des Aufwands mit deutscher Bezeichnung (Einstellungen und Wahl je Lauf) */
export const AUFWAND_STUFEN: { id: Aufwand; titel: string }[] = [
  { id: "low", titel: "niedrig" },
  { id: "medium", titel: "mittel" },
  { id: "high", titel: "hoch" },
  { id: "xhigh", titel: "sehr hoch" },
  { id: "max", titel: "maximal" },
];

export const ROLLEN: Rolle[] = ["vorverarbeitung", "erfassung", "verdichtung", "reparatur", "kurzfassung"];

/** Höchstzahl der Websuchen je Lauf (wie unter „Einstellungen“) */
export const WEBSUCHE_GRENZE = 50;

/**
 * Wahl nur für einen Lauf, abweichend von den Einstellungen (leer = Standard): Modell je Stufe als Schlüssel der
 * Rolle, dazu optional Aufwand je Stufe und die Recherchetiefe (seit 0.5.22 alle drei Werte wie unter „Recherche &
 * Grenzen“: Websuchen, ganz gelesene Seiten, Lesemenge je Seite).
 */
export type ModellWahl = Partial<Record<Rolle, string>> & {
  aufwand?: Partial<Record<Rolle, Aufwand>>;
  websucheMax?: number;
  abrufMax?: number;
  /** 0 = Seiten nie kürzen */
  abrufMaxTokens?: number;
};

/** Felder der Recherchetiefe in der Wahl je Lauf */
export const WAHL_RECHERCHE = ["websucheMax", "abrufMax", "abrufMaxTokens"] as const;

/** Ob die Wahl etwas von den Einstellungen abweichen lässt */
export function wahlAbweichend(wahl: ModellWahl, rollen: Rolle[] = ROLLEN, mitWebsuche = true): boolean {
  return rollen.some((r) => !!wahl[r] || !!wahl.aufwand?.[r]) || (mitWebsuche && WAHL_RECHERCHE.some((f) => wahl[f] !== undefined));
}

/** Gültiger Wert eines Recherchefelds der Wahl je Lauf (Bereiche wie unter „Recherche & Grenzen“), sonst undefined */
function rechercheWert(feld: (typeof WAHL_RECHERCHE)[number], w: number | undefined): number | undefined {
  if (w === undefined || !Number.isFinite(w)) return undefined;
  const n = Math.round(w);
  if (feld === "websucheMax") return Math.min(WEBSUCHE_GRENZE, Math.max(0, n));
  if (feld === "abrufMax") return Math.min(50, Math.max(0, n));
  return n <= 0 ? 0 : Math.min(100000, Math.max(1000, n));
}

/** Einstellungen mit der für diesen Lauf getroffenen Wahl; nicht gewählte Stufen behalten ihre Vorgabe */
export function mitModellwahl(e: Einstellungen, wahl: ModellWahl): Einstellungen {
  const modelle = Object.fromEntries(ROLLEN.filter((r) => !!wahl[r]).map((r) => [r, wahl[r]!]));
  const aufwand = Object.fromEntries(ROLLEN.filter((r) => !!wahl.aufwand?.[r]).map((r) => [r, wahl.aufwand![r]!]));
  const recherche = Object.fromEntries(
    WAHL_RECHERCHE.map((f) => [f, rechercheWert(f, wahl[f])] as const).filter((x): x is [(typeof WAHL_RECHERCHE)[number], number] => x[1] !== undefined),
  );
  if (!Object.keys(modelle).length && !Object.keys(aufwand).length && !Object.keys(recherche).length) return e;
  return {
    ...e,
    modelle: { ...e.modelle, ...modelle },
    aufwand: { ...e.aufwand, ...aufwand },
    ...recherche,
  };
}
