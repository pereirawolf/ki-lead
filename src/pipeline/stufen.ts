// Die gestufte KI-Pipeline nach LEAD (Modus A, Erfassung):
// S1 Gegenstand und SOP-Auswahl → Bestätigung durch die Person → bei „Recherche durchführen“ Orientierungssuche je
// Sachverhalt (Teil von S1) und Bestätigung der Suchbegriffe → S2 Recherche und Entwurf mit Pflichtsuchen, Abgleich und
// höchstens einer Nachforderung → S3 Prüfung und höchstens zwei Reparaturen → Übergabe an die Meldungsmaske (S4).
//
// Seit 0.6.2 (TP-2026-W44-06) auf mehrere Dateien verteilt, ohne Änderung des Verhaltens. Hier steht, was alle Stufen
// teilen: Kontext eines Laufs, KI-Aufruf mit Protokolleintrag, wirksame Werkzeuggrenzen und Recherchemodus.
// - s1.ts: S1 Gegenstand und SOP-Auswahl, Bereinigung des Vorschlags (t0, Stichtag, SOPs)
// - orientierung.ts: Orientierungssuche je Sachverhalt (Teil von S1)
// - s2s3.ts: S2 Recherche und Entwurf mit Pflichtsuchen und Nachforderung, S3 Vervollständigung und Reparatur
// - nachbearbeitung.ts: Nachbearbeitung des Entwurfs durch die App (Identität, Radar, SOP-Nachweis)
// - recherchebefunde.ts: Befunde zu Recherche, Absender und Abruffehlern

import type { Fortschritt, LlmAnbieter, LlmAnfrage, LlmAntwort } from "../anbieter/typen";
import { bekannterAnbieter } from "../anbieter/verteiler";
import type { Profil } from "../kern/typen";
import { modellFuer, werkzeugeFuer, type Einstellungen } from "./einstellungen";
import type { RechercheModus } from "./kontext";
import { kostenNachFehler, kostenStand, ohneBase64, type Lauf, type StufenEintrag } from "./lauf";
import { istVerdichtung, type Material } from "./material";

/**
 * Wirksame Werkzeuggrenzen für S2: die Höchstzahlen der Einstellungen, begrenzt durch das, was Modell und Endpunkt
 * können (seit 0.5.6: Mistral über den EU-Endpunkt ohne Werkzeuge, global nur mit Websuche; seit 0.6.3 Ollama ohne
 * Werkzeuge). `grund` nennt die
 * Grenze des Anbieters, wenn sie die Recherche ganz ausschließt.
 */
export function s2Grenzen(k: Kontext): { websucheMax: number; abrufMax: number; grund?: string } {
  const e = k.einstellungen;
  const modell = modellFuer(istVerdichtung(k.material) ? "verdichtung" : "erfassung", e, k.profil);
  const w = werkzeugeFuer(modell, e);
  const websucheMax = w.websuche ? e.websucheMax : 0;
  const abrufMax = w.abruf ? e.abrufMax : 0;
  const gekappt = (e.websucheMax > 0 && !w.websuche) || (e.abrufMax > 0 && !w.abruf);
  return {
    websucheMax,
    abrufMax,
    ...(gekappt && !websucheMax && !abrufMax
      ? {
          grund: w.websuche
            ? `${modell} bietet keinen Seitenabruf, und die Websuche ist in den Einstellungen 0`
            : bekannterAnbieter(modell) === "ollama"
              ? `${modell} läuft lokal über Ollama und bietet keine Websuche`
              : `${modell} über den EU-Endpunkt von Mistral bietet keine Websuche`,
        }
      : {}),
  };
}

/** Recherchemodus aus dem Auftrag und den wirksamen Werkzeuggrenzen, nie aus Freitext von S1 oder Material */
export function rechercheModus(k: Kontext): RechercheModus {
  if (k.lauf.auftrag.websuche === false) return "nur-material";
  const g = s2Grenzen(k);
  return g.websucheMax > 0 || g.abrufMax > 0 ? "durchfuehren" : "keine-werkzeuge";
}

export interface Kontext {
  profil: Profil;
  anbieter: LlmAnbieter;
  einstellungen: Einstellungen;
  lauf: Lauf;
  material: Material[];
  signal?: AbortSignal;
  /** Wird nach jeder Änderung am Lauf aufgerufen (Speichern, Anzeige) */
  aktualisiert: (l: Lauf) => void | Promise<void>;
  fortschritt?: (f: Fortschritt) => void;
  jetzt?: () => Date;
}

/**
 * Ein KI-Aufruf mit Protokolleintrag. Liefert Antwort und Eintrag als Paar (seit 0.6.2, TP-2026-W44-05): Der Eintrag
 * wird nicht mehr über die Push-Reihenfolge gesucht, die bei parallelen Aufrufen (Orientierungssuche) nicht eindeutig ist.
 */
export async function aufrufen(k: Kontext, stufe: string, anfrage: LlmAnfrage): Promise<{ antwort: LlmAntwort; eintrag: StufenEintrag }> {
  const eintrag: StufenEintrag = {
    stufe,
    start: new Date().toISOString(),
    modell: anfrage.modell,
    aufwand: anfrage.aufwand,
    anfrage: ohneBase64({
      system: anfrage.system.map((s) => s.text),
      nachrichten: anfrage.nachrichten,
      werkzeuge: anfrage.werkzeuge,
      jsonSchema: anfrage.jsonSchema,
      maxTokens: anfrage.maxTokens,
    }),
  };
  k.lauf.stufen.push(eintrag);
  await k.aktualisiert(k.lauf);
  try {
    const a = await k.anbieter.senden({ ...anfrage, signal: k.signal, fortschritt: k.fortschritt });
    eintrag.antwort = { text: a.text, inhalt: a.inhalt, stopGrund: a.stopGrund, runden: a.runden };
    eintrag.nutzung = a.nutzung;
    eintrag.kostenUsd = a.kostenUsd;
    eintrag.modell = a.modell;
    return { antwort: a, eintrag };
  } catch (e: any) {
    eintrag.fehler = e?.name === "AbortError" ? "abgebrochen" : String(e?.message || e);
    // Nach einem Abbruch kann der Anbieter schon gearbeitet haben: Kosten unbekannt, nicht 0
    eintrag.kostenUsd = kostenNachFehler(e);
    if (Array.isArray(e?.teilinhalt) && e.teilinhalt.length) {
      eintrag.antwort = { text: "", inhalt: e.teilinhalt, stopGrund: "abgebrochen", runden: 0 };
    }
    throw e;
  } finally {
    eintrag.ende = new Date().toISOString();
    eintrag.dauerMs = Date.parse(eintrag.ende) - Date.parse(eintrag.start);
    const kosten = kostenStand(k.lauf);
    k.lauf.kostenUsd = kosten.vollstaendig ? kosten.bekannt : null;
    if (kosten.vollstaendig) delete k.lauf.kostenBekanntUsd;
    else k.lauf.kostenBekanntUsd = kosten.bekannt;
    k.lauf.aktualisiert = eintrag.ende;
    // Die Antwort steht schon im Eintrag; ein Fehler beim Speichern (etwa voller Speicher) darf die bezahlte Antwort
    // nicht verwerfen (seit 0.6.2, TP-2026-W44-10). Er wird am Eintrag vermerkt und beim nächsten Speichern mitgenommen.
    try {
      await k.aktualisiert(k.lauf);
    } catch (e: any) {
      eintrag.notiz = `${eintrag.notiz ? `${eintrag.notiz} ` : ""}Speichern nach diesem Aufruf gescheitert: ${String(e?.message || e)}`;
    }
  }
}
