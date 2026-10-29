// Befunde zu Recherche, Primärquellen, Absender und Abruffehlern für das Ergebnis von S2/S3. Seit 0.6.2 eigene Datei
// (TP-2026-W44-06), vorher in stufen.ts.

import type { LlmAntwort } from "../anbieter/typen";
import { holeWert } from "../kern/pfad";
import { parseQuellen } from "../kern/quellen";
import type { Befund, Meldung, Profil } from "../kern/typen";
import { amtlicherHost, type AmtlicherEinstieg, type RechercheModus } from "./kontext";
import type { Pflichtsuche } from "./lauf";
import type { Absender } from "./material";

/** Ob eine Antwort eine amtliche Quelle erreicht hat: Fundstelle oder erfolgreicher Abruf vom Host eines amtlichen Einstiegs */
export function amtlichErreicht(a: Pick<LlmAntwort, "fundstellen" | "abrufe" | "abrufFehler">, einstiege: AmtlicherEinstieg[]): boolean {
  const fehler = new Set((a.abrufFehler || []).map((f) => f.url));
  return [...(a.fundstellen || []).map((f) => f.url), ...(a.abrufe || []).filter((u) => !fehler.has(u))].some((u) => amtlicherHost(u, einstiege));
}

/** Befunde zum Absender: fremde Meldung als Vormeldung, eigene Vormeldungen mit unterschiedlichem Absender */
export function absenderBefunde(a: Absender): Befund[] {
  const b: Befund[] = [];
  if (a.fremd.length)
    b.push({
      stufe: "warnung",
      code: "VORMELDUNG_FREMDE_STELLE",
      text: `Als Vormeldung gewählt, aber von einer anderen Stelle: ${a.fremd.join(", ")}. Land und meldende Stelle stammen ${
        a.herkunft === "vormeldung" ? `aus der eigenen Vormeldung ${a.quelle}` : "aus dem Profil"
      }; der Entwurf erscheint nicht unter fremdem Absender.`,
    });
  if (a.abweichend.length)
    b.push({
      stufe: "hinweis",
      code: "VORMELDUNG_ABSENDER_ABWEICHEND",
      text: `Eigene Vormeldungen mit anderem Land oder anderer meldender Stelle: ${a.abweichend.join(", ")}. Übernommen ist der Absender der jüngsten (${a.quelle}: ${a.land} · ${a.stelle}).`,
    });
  return b;
}

/**
 * Websuchen und Seitenabrufe von S2: Zähler des Anbieters und dokumentierte Werkzeugblöcke, der höhere Wert gilt.
 * zaehlerVollstaendig ist false, wenn der Anbieter keine Zähler geliefert hat (z. B. ältere Laufprotokolle).
 */
export function rechercheNachweis(nachweis: { nutzung?: { websuchen?: unknown; abrufe?: unknown }; suchen?: unknown[]; abrufe?: unknown[] }): {
  websuchen: number;
  abrufe: number;
  zaehlerVollstaendig: boolean;
} {
  const zahl = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) ? x : null);
  const ws = zahl(nachweis.nutzung?.websuchen);
  const ab = zahl(nachweis.nutzung?.abrufe);
  return {
    websuchen: Math.max(ws ?? 0, nachweis.suchen?.length || 0),
    abrufe: Math.max(ab ?? 0, nachweis.abrufe?.length || 0),
    zaehlerVollstaendig: ws !== null && ab !== null,
  };
}

/** Zusatzangaben für die Recherchebefunde (seit 0.6.0) */
export interface RechercheZusatz {
  /** Abgleich der Pflichtsuchen */
  pflicht?: Pflichtsuche[];
  /** Ob die App nachgefordert hat */
  nachgefordert?: boolean;
  /** Kurzantwort von S2 (Abgleich mit der tatsächlichen Recherche) */
  kurzantwort?: string;
  /** Sachverhalte (ab 1), deren Orientierungssuche ohne Websuche blieb */
  orientierungOhneSuche?: number[];
  /** Ob eine Primärquelle belegt ist (Kategorie A oder B im Quellenverzeichnis oder amtliche Fundstelle; seit 0.6.1) */
  primaerquelle?: boolean;
}

/**
 * Primärquelle belegt (seit 0.6.1, KP-2026-W44-16): Das Quellenverzeichnis der Meldung enthält einen Eintrag der
 * Kategorie A oder B, oder eine Fundstelle bzw. ein erfolgreicher Abruf stammt aus einem amtlichen Einstieg der SOPs.
 */
export function primaerquelleBelegt(
  meldung: Meldung,
  p: Profil,
  a: Pick<LlmAntwort, "fundstellen" | "abrufe" | "abrufFehler">,
  einstiege: AmtlicherEinstieg[],
): boolean {
  const rolle = p.ui.rollen.quellen;
  const eintraege = rolle ? parseQuellen(holeWert(meldung, rolle)) : [];
  return eintraege.some((x) => x.code === "A" || x.code === "B") || amtlichErreicht(a, einstiege);
}

/** Aussagen der Kurzantwort, die eine Recherche oder geprüfte Unzugänglichkeit behaupten */
const KURZANTWORT_RECHERCHE = /nicht zugänglich|nicht erreichbar|(?<!nicht )recherchiert|Recherche ergab|Websuche ergab/i;

/**
 * Befunde zur Recherche aus Auftrag, Materialrolle und tatsächlicher Werkzeugnutzung von S2 einschließlich einer
 * Nachforderung (nicht S3: Vervollständigung und Reparatur recherchieren nicht). Seit 0.6.0 (KP-2026-W44-02) für jeden
 * Lauf mit „Recherche durchführen“, nicht nur bei Fortschreibung einer eigenen Vormeldung.
 */
export function rechercheBefunde(
  modus: RechercheModus,
  vormeldung: boolean,
  nachweis: { nutzung?: { websuchen?: unknown; abrufe?: unknown }; suchen?: unknown[]; abrufe?: unknown[]; abrufFehler?: unknown[] },
  /** Grenze des Anbieters statt der Einstellungen (seit 0.5.6) */
  grund?: string,
  zusatz: RechercheZusatz = {},
): Befund[] {
  const { abrufFehler } = nachweis;
  if (modus === "keine-werkzeuge")
    return [
      {
        stufe: "hinweis",
        code: "RECHERCHE_NICHT_VERFUEGBAR",
        text: grund
          ? `„Recherche durchführen“ war im Auftrag gewählt, aber nicht verfügbar (${grund}); der Lauf arbeitete nur mit dem Material.`
          : "„Recherche durchführen“ war im Auftrag gewählt, in den Einstellungen aber nicht verfügbar (Höchstzahl Websuchen und Seitenabrufe 0); der Lauf arbeitete nur mit dem Material.",
      },
    ];
  if (modus !== "durchfuehren") return [];
  const b: Befund[] = [];
  const n = rechercheNachweis(nachweis);
  const fehler = abrufFehler?.length || 0;
  const ohne = n.websuchen === 0 && n.abrufe - fehler <= 0;
  const nach = zusatz.nachgefordert ? " – auch nicht nach der Nachforderung der App" : "";
  if (ohne && !n.zaehlerVollstaendig)
    b.push(
      vormeldung
        ? {
            stufe: "hinweis",
            code: "FORTSCHREIBUNG_RECHERCHE_NICHT_NACHWEISBAR",
            text: "Ob in diesem Lauf recherchiert wurde, ist nicht nachweisbar (keine Nutzungsdaten des Anbieters). Bitte prüfen, ob die Fortschreibung auf aktuellen Quellen beruht.",
          }
        : {
            stufe: "hinweis",
            code: "RECHERCHE_NICHT_NACHWEISBAR",
            text: "Ob in diesem Lauf recherchiert wurde, ist nicht nachweisbar (keine Nutzungsdaten des Anbieters). Bitte prüfen, ob der Entwurf auf aktuellen Quellen beruht.",
          },
    );
  else if (ohne) {
    b.push({
      stufe: "warnung",
      code: "RECHERCHE_NICHT_DURCHGEFUEHRT",
      text: `„Recherche durchführen“ war gewählt, in S2 ist aber weder eine Websuche noch ein erfolgreicher Seitenabruf dokumentiert${nach}.${
        fehler ? " Versuchte Seitenabrufe sind gescheitert." : ""
      } Der Entwurf beruht nur auf dem Material.`,
    });
    if (vormeldung)
      b.push({
        stufe: "warnung",
        code: "FORTSCHREIBUNG_OHNE_AKTUALISIERUNG",
        text: `Die Meldung wurde aus der Vormeldung neu aufbereitet; eine aktuelle Quellenprüfung ist in diesem Lauf nicht dokumentiert, obwohl „Recherche durchführen“ gewählt war.${
          fehler ? " Versuchte Seitenabrufe sind gescheitert." : ""
        } Aussagen zum Sachstand beruhen auf dem Stand der Vormeldung.`,
      });
  }
  const ausgelassen = (zusatz.pflicht || []).filter((p) => !p.ausgefuehrt);
  if (ausgelassen.length)
    b.push({
      stufe: "warnung",
      code: "PFLICHTSUCHE_AUSGELASSEN",
      text: `Bestätigte Pflichtsuchen ohne entsprechende Websuche${nach}: ${ausgelassen.map((p) => `„${p.begriff}“ (Sachverhalt ${p.sachverhalt})`).join("; ")}.`,
    });
  if (zusatz.primaerquelle === false)
    b.push({
      stufe: "warnung",
      code: "KEINE_PRIMAERQUELLE",
      text: "Das Quellenverzeichnis enthält nur Medien- oder Plattformquellen (keine Kategorie A oder B), und keine Fundstelle stammt aus einem amtlichen Rechercheeinstieg der SOPs. Kernaussagen sind indirekt berichtet; vor der Freigabe die zuständigen Primärquellen prüfen.",
    });
  if (zusatz.nachgefordert && !ohne && !ausgelassen.length)
    b.push({
      stufe: "hinweis",
      code: "RECHERCHE_NACHGEFORDERT",
      text: "S2 hat die verbindliche Recherche erst nach einer Nachforderung der App ergänzt (fehlende Pflichtsuchen, keine Suche oder keine amtliche Quelle); die Meldung stammt aus der Antwort auf die Nachforderung.",
    });
  if (ohne && n.zaehlerVollstaendig && zusatz.kurzantwort && KURZANTWORT_RECHERCHE.test(zusatz.kurzantwort))
    b.push({
      stufe: "hinweis",
      code: "KURZANTWORT_RECHERCHE_WIDERSPRUCH",
      text: "Die Kurzantwort spricht von Recherche oder nicht zugänglichen Quellen, in S2 wurde aber nicht gesucht. Quellen, die nicht abgefragt wurden, sind nicht geprüft.",
    });
  if (zusatz.orientierungOhneSuche?.length)
    b.push({
      stufe: "hinweis",
      code: "ORIENTIERUNG_OHNE_SUCHE",
      text: `Die Orientierungssuche in S1 blieb für Sachverhalt ${zusatz.orientierungOhneSuche.join(", ")} ohne Websuche; die Suchbegriffe stammen nicht aus einer Orientierung.`,
    });
  return b;
}

/** Abruffehler, die eine im Auftrag genannte URL betreffen (je URL einmal). */
export function auftragsAbrufFehler(urls: string[] | undefined, fehler: { url: string; code: string }[] | undefined): { url: string; code: string }[] {
  const norm = (u: string) => u.trim().replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();
  const auftrag = new Set((urls || []).map(norm));
  const gesehen = new Set<string>();
  return (fehler || []).filter((f) => {
    const n = norm(f.url || "");
    if (!auftrag.has(n) || gesehen.has(n)) return false;
    gesehen.add(n);
    return true;
  });
}
