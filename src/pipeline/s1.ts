// S1 Gegenstand und SOP-Auswahl: Aufruf, Strukturprüfung und Bereinigung des Vorschlags (Stichtag, t0, SOP-Kennungen,
// Eingänge). Seit 0.6.2 eigene Datei (TP-2026-W44-06), vorher in stufen.ts.

import { jetztLokal } from "../kern/ausgabe";
import { gueltigerZeitpunkt } from "../kern/zeit";
import { aufwandFuer, modellFuer } from "./einstellungen";
import { zerlegeAntwort } from "./json";
import { fachSops, s1Schema, s1System, sopIdsAufloesen, werkzeugText } from "./kontext";
import type { S1Vorschlag } from "./lauf";
import { hatVormeldung, istVerdichtung, juengsterEingang, materialBloecke, vormeldungStand } from "./material";
import { s2Grenzen, rechercheModus, type Kontext, aufrufen } from "./stufen";
import { redaktionsvermerke } from "./vermerke";

const tausender = (n: number) => n.toLocaleString("de-DE");

/** Technisch unvollständiger S1-Vorschlag: Grund oder null. Prüft nur die Struktur, nicht den Inhalt. */
export function s1Strukturfehler(json: unknown): string | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return "Die Antwort ist kein JSON-Objekt.";
  const sv = (json as { sachverhalte?: unknown }).sachverhalte;
  if (!Array.isArray(sv) || sv.length === 0) return "Der Vorschlag enthält keine Sachverhalte.";
  const ungueltig = sv.findIndex((s) => !s || typeof s !== "object" || Array.isArray(s) || typeof (s as { titel?: unknown }).titel !== "string");
  if (ungueltig >= 0) return `Sachverhalt ${ungueltig + 1} ist unvollständig.`;
  return null;
}

/**
 * Bei Verdichtungen darf der t0-Vorschlag aus S1 höchstens so viele Stunden nach dem jüngsten Eingang liegen.
 * Sonst setzt die App t0 auf den jüngsten Eingang: S1 hatte mehrfach die aktuelle Uhrzeit vorgeschlagen,
 * obwohl die Eingänge Tage älter waren, und S2 ließ daraufhin alle Radarachsen offen.
 */
export const T0_SPIELRAUM_STUNDEN = 24;

/**
 * Bei der Fortschreibung einer eigenen Vormeldung mit heutigem Stichtag setzt die App t0 auf die aktuelle Zeit.
 * Ein S1-Vorschlag, der höchstens so viele Minuten abweicht, wird ohne Hinweis ersetzt.
 */
export const T0_TOLERANZ_MINUTEN = 15;

function zeitwert(z: string): number {
  return Date.parse(`${z.slice(0, 16)}:00Z`);
}

function zeitText(z: string): string {
  return `${z.slice(8, 10)}.${z.slice(5, 7)}.${z.slice(0, 4)}, ${z.slice(11, 16)} Uhr`;
}

function tagText(z: string): string {
  return `${z.slice(8, 10)}.${z.slice(5, 7)}.${z.slice(0, 4)}`;
}

function rechercheText(k: Kontext): string {
  const m = rechercheModus(k);
  const g = s2Grenzen(k);
  if (m === "nur-material") return "nur Material (Websuche vom Auftrag abgeschaltet)";
  // Seit 0.6.4 (TP-2026-W44-35) derselbe Begriff wie im Steuerungsblock und in der Arbeitsanweisung: „nicht verfügbar“
  if (m === "keine-werkzeuge") return `„Recherche durchführen“ gewählt, aber nicht verfügbar (${g.grund ?? "Höchstzahlen in den Einstellungen 0"})`;
  return `durchführen (${werkzeugText(g.websucheMax, g.abrufMax)})`;
}

function auftragsText(k: Kontext): string {
  const a = k.lauf.auftrag;
  return [
    `Sachverhalt und Erkenntnisinteresse: ${a.sachverhalt.trim() || "(nicht angegeben, aus dem Material ableiten)"}`,
    `Meldestichtag: ${a.stichtag}`,
    a.meldezeitpunkt ? `Meldezeitpunkt t0 (vorgegeben): ${a.meldezeitpunkt.replace("T", " ")}` : "",
    `Besondere Prüffrage: ${a.prueffrage.trim() || "keine"}`,
    `Aktueller Zeitpunkt (${k.profil.manifest.variablen.zeitzone || "Europe/Berlin"}): ${jetztLokal(k.profil.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date())}`,
    `Recherche in S2: ${rechercheText(k)}; vom Auftrag festgelegt, nicht Teil des Gegenstands.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function stufe1(k: Kontext): Promise<S1Vorschlag> {
  k.lauf.status = "s1";
  const verdichtung = istVerdichtung(k.material);
  // Redaktionsvermerke auch für eine eigene Vormeldung: Fristen und Indikatoren sollen vor S2 sichtbar sein
  const vermerke =
    verdichtung || hatVormeldung(k.material)
      ? redaktionsvermerke(
          k.material,
          k.profil,
          k.lauf.auftrag.meldezeitpunkt || juengsterEingang(k.material) || jetztLokal(k.profil.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date()),
        )
      : "";
  const inhalt = [
    { type: "text", text: `# Auftrag\n\n${auftragsText(k)}` },
    ...materialBloecke(k.material, k.lauf.auftrag.urls, k.lauf.auftrag.stichworte),
    ...(vermerke ? [{ type: "text", text: vermerke }] : []),
    { type: "text", text: "Kläre jetzt den Gegenstand und schlage Gliederung, Ereignisarten und SOPs vor." },
  ];
  // Ausgabegrenze aus den Einstellungen wie für alle KI-Aufrufe (Vorgabe 128 000). Denk- und Antworttoken zählen
  // gemeinsam: Die frühere feste Grenze von 16 000 reichte bei Verdichtungen mit Haiku „high“ nicht (Läufe
  // 20261021-133605-75wi und 20261021-133728-cvza endeten nach 69–72 s bei genau 16 000 Token mit max_tokens).
  const modell = modellFuer("vorverarbeitung", k.einstellungen, k.profil);
  const aufwand = aufwandFuer("vorverarbeitung", k.einstellungen, k.profil);
  const maxTokens = k.einstellungen.maxTokensErfassung;
  const { antwort: a, eintrag } = await aufrufen(k, "S1 Gegenstand und SOP-Auswahl", {
    modell,
    aufwand,
    maxTokens,
    system: [{ text: s1System(k.profil, verdichtung), cache: true }],
    nachrichten: [{ role: "user", content: inhalt }],
    jsonSchema: s1Schema(
      k.profil,
      k.material.filter((m) => m.art === "eingang").map((m) => m.name),
    ),
  });
  const z = zerlegeAntwort(a.text);
  const struktur = z.json === undefined ? null : s1Strukturfehler(z.json);
  const abgeschnitten = a.stopGrund === "max_tokens";
  if (z.json === undefined || struktur) {
    // Die Ursache (Ausgabegrenze, leere Antwort) geht vor dem Parserbefund; nichts wird repariert oder ergänzt
    const technisch = struktur || z.fehler || "";
    let meldung: string;
    if (abgeschnitten) {
      eintrag.notiz = `S1-Ausgabegrenze von ${tausender(maxTokens)} Token erreicht; kein vollständiger Vorschlag. Sichtbarer Text: ${tausender(a.text.length)} Zeichen.`;
      meldung = `S1 hat die Ausgabegrenze von ${tausender(maxTokens)} Token erreicht, bevor ein vollständiger Vorschlag vorlag (Modell ${modell}, Aufwand ${aufwand ?? "Standard"}). Eingaben und Laufprotokoll bleiben erhalten.${technisch ? ` Technisch: ${technisch}` : ""}`;
    } else if (!a.text.trim()) {
      eintrag.notiz = `Leere Antwort (stopGrund ${a.stopGrund || "unbekannt"}).`;
      meldung = `Stufe S1 lieferte eine leere Antwort (Modell ${modell}, Abbruchgrund ${a.stopGrund || "unbekannt"}). Eingaben und Laufprotokoll bleiben erhalten.`;
    } else {
      meldung =
        `Stufe S1 lieferte kein auswertbares Ergebnis. ${technisch}${a.stopGrund && a.stopGrund !== "end_turn" ? ` (Abbruchgrund ${a.stopGrund})` : ""}`.trim();
    }
    await k.aktualisiert(k.lauf);
    throw new Error(meldung);
  }
  const v = bereinigeVorschlag(z.json as S1Vorschlag, k);
  if (abgeschnitten) {
    // Vollständig und strukturell geprüft, aber an der Grenze beendet: zur Bestätigung, mit sichtbarem Prüfbedarf
    eintrag.notiz = `S1-Ausgabegrenze von ${tausender(maxTokens)} Token erreicht; der Vorschlag ist technisch vollständig.`;
    v.appHinweise = [
      ...(v.appHinweise || []),
      `S1 hat die Ausgabegrenze von ${tausender(maxTokens)} Token erreicht. Der Vorschlag ist technisch vollständig; bitte Gliederung, Zuordnung der Eingänge und SOPs besonders sorgfältig prüfen.`,
    ];
  }
  k.lauf.vorschlag = v;
  k.lauf.status = "bestaetigen";
  await k.aktualisiert(k.lauf);
  return v;
}

function bereinigeVorschlag(v: S1Vorschlag, k: Kontext): S1Vorschlag {
  const ids = new Set(fachSops(k.profil).map((s) => s.id));
  const eingaenge = new Set(k.material.filter((m) => m.art === "eingang").map((m) => m.name));
  const appHinweise: string[] = [];
  const jetzt = jetztLokal(k.profil.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date());
  const heute = jetzt.slice(0, 10);
  // Stichtag einmal festlegen und für Regeln und Ergebnis gleich verwenden: Auftrag vor S1, sonst S1, sonst heute
  const tagGueltig = (x: string | undefined) => !!x && gueltigerZeitpunkt(`${x}T00:00`);
  const kiStichtag = tagGueltig(v.stichtag) ? v.stichtag : "";
  const stichtag = tagGueltig(k.lauf.auftrag.stichtag) ? k.lauf.auftrag.stichtag : kiStichtag || heute;
  if (kiStichtag && kiStichtag !== stichtag)
    appHinweise.push(
      `S1 schlug den Stichtag ${tagText(kiStichtag)} vor; maßgeblich ist der Stichtag aus dem Auftrag (${tagText(stichtag)}). Bei Übung oder Rückblick Stichtag und t0 hier anpassen.`,
    );
  const eingang = juengsterEingang(k.material);
  const roh = String(v.meldezeitpunkt || "").slice(0, 16);
  const kiT0 = gueltigerZeitpunkt(roh) ? roh : "";
  const auftragT0 = gueltigerZeitpunkt(k.lauf.auftrag.meldezeitpunkt) ? k.lauf.auftrag.meldezeitpunkt! : "";
  const vorgeben = "Soll die Meldung einen anderen Stand abbilden, ist t0 hier oder im Auftrag vorzugeben.";
  let t0: string;
  if (auftragT0)
    t0 = auftragT0; // R1: ausdrückliche Vorgabe, auch für historische Auswertungen
  else if (eingang && istVerdichtung(k.material)) {
    // R2 Verdichtung: t0 gehört kurz hinter den jüngsten Eingang (SOP-LEAD A.7), nicht auf die aktuelle Uhrzeit
    if (kiT0 && (kiT0 < eingang || zeitwert(kiT0) - zeitwert(eingang) > T0_SPIELRAUM_STUNDEN * 3_600_000)) {
      t0 = eingang;
      appHinweise.push(
        `Meldezeitpunkt t0 auf den jüngsten Eingang gesetzt (${zeitText(eingang)}). Der Vorschlag aus S1 (${zeitText(kiT0)}) lag ${
          kiT0 < eingang ? "vor dem jüngsten Eingang" : `mehr als ${T0_SPIELRAUM_STUNDEN} Stunden danach`
        }. Soll die Meldung einen späteren Stand abbilden, ist t0 hier oder im Auftrag vorzugeben.`,
      );
    } else if (kiT0 && kiT0 > jetzt && eingang <= jetzt) {
      // Nicht in der Zukunft; liegt schon der jüngste Eingang nach der aktuellen Zeit, bleibt es bei A.7
      t0 = jetzt;
      appHinweise.push(
        `Meldezeitpunkt t0 auf den aktuellen Zeitpunkt gesetzt (${zeitText(jetzt)}). Der Vorschlag aus S1 (${zeitText(kiT0)}) lag in der Zukunft.`,
      );
    } else t0 = kiT0 || eingang;
    if (hatVormeldung(k.material) && stichtag === heute && t0.slice(0, 10) < heute)
      appHinweise.push(
        `t0 folgt bei Verdichtung dem jüngsten Eingang (SOP-LEAD A.7) und liegt vor dem heutigen Stichtag. Soll die Meldung den heutigen Stand der Vormeldung abbilden, ist t0 hier oder im Auftrag vorzugeben.`,
      );
  } else if (hatVormeldung(k.material) && stichtag === heute) {
    // R3 Fortschreibung auf heute: neuer Meldezeitpunkt ist die aktuelle Zeit; der Stand der Vormeldung ist Ausgangspunkt
    t0 = jetzt;
    if (kiT0 && (kiT0.slice(0, 10) !== heute || Math.abs(zeitwert(kiT0) - zeitwert(jetzt)) > T0_TOLERANZ_MINUTEN * 60_000)) {
      const stand = vormeldungStand(k.material, k.profil);
      appHinweise.push(
        `Meldezeitpunkt t0 auf den aktuellen Zeitpunkt gesetzt (${zeitText(jetzt)}): Die eigene Vormeldung${
          stand ? ` (Stand ${zeitText(stand)})` : ""
        } wird auf den heutigen Stand fortgeschrieben; ihr Stand ist Ausgangspunkt, nicht Meldezeitpunkt. Der Vorschlag aus S1 (${zeitText(kiT0)}) wurde nicht übernommen. ${vorgeben}`,
      );
    }
  } else if (stichtag === heute) {
    // R4 Erfassung mit heutigem Stichtag: S1-Vorschlag, wenn er heute und nicht in der Zukunft liegt
    if (kiT0 && kiT0.slice(0, 10) === heute && kiT0 <= jetzt) t0 = kiT0;
    else {
      t0 = jetzt;
      if (kiT0)
        appHinweise.push(
          `Meldezeitpunkt t0 auf den aktuellen Zeitpunkt gesetzt (${zeitText(jetzt)}). Der Vorschlag aus S1 (${zeitText(kiT0)}) lag ${
            kiT0 > jetzt ? "in der Zukunft" : "nicht am heutigen Stichtag"
          }. ${vorgeben}`,
        );
    }
  } else if (stichtag > heute) {
    // R5 Stichtag in der Zukunft: t0 nie nach der aktuellen Zeit
    t0 = kiT0 && kiT0 <= jetzt ? kiT0 : jetzt;
    appHinweise.push(
      `Der Stichtag ${tagText(stichtag)} liegt nach dem heutigen Tag; ein Meldezeitpunkt in der Zukunft ist nicht zulässig. t0 steht auf ${zeitText(t0)}. Bitte Stichtag prüfen.`,
    );
  } else {
    // R5 zurückliegender Stichtag (Übung, Rückblick): S1-Vorschlag gilt, aber nicht in der Zukunft
    t0 = kiT0 && kiT0 <= jetzt ? kiT0 : jetzt;
    if (kiT0 && kiT0 > jetzt)
      appHinweise.push(
        `Meldezeitpunkt t0 auf den aktuellen Zeitpunkt gesetzt (${zeitText(jetzt)}). Der Vorschlag aus S1 (${zeitText(kiT0)}) lag in der Zukunft. ${vorgeben}`,
      );
    else if (t0.slice(0, 10) !== stichtag)
      appHinweise.push(`Der Meldezeitpunkt t0 (${zeitText(t0)}) liegt nicht am Stichtag ${tagText(stichtag)}. Bitte t0 oder Stichtag prüfen.`);
  }

  // Prüffragen stellt die Person. Ohne Prüffrage im Auftrag bleibt ein Vorschlag aus S1 ein Vorschlag.
  const auftragsfrage = (k.lauf.auftrag.prueffrage || "").trim();
  const kiFrage = String(v.prueffrage || "").trim();
  return {
    gegenstand: String(v.gegenstand || ""),
    stichtag,
    meldezeitpunkt: t0,
    referenzbezug: String(v.referenzbezug || ""),
    horizont: String(v.horizont || ""),
    sachverhalte: (Array.isArray(v.sachverhalte) && v.sachverhalte.length ? v.sachverhalte : [{ titel: "", ereignisarten: [], sops: [], begruendung: "" }]).map(
      (s) => ({
        titel: String(s.titel || ""),
        ereignisarten: Array.isArray(s.ereignisarten) ? s.ereignisarten.map(String) : [],
        sops: Array.isArray(s.sops) ? sopIdsAufloesen(k.profil, s.sops.map(String)).filter((x) => ids.has(x)) : [],
        begruendung: String(s.begruendung || ""),
        ...(eingaenge.size
          ? { eingangsmeldungen: Array.isArray(s.eingangsmeldungen) ? s.eingangsmeldungen.map(String).filter((x) => eingaenge.has(x)) : [] }
          : {}),
      }),
    ),
    prueffrage: auftragsfrage ? kiFrage || auftragsfrage : "",
    ...(!auftragsfrage && kiFrage ? { prueffrageVorschlag: kiFrage } : {}),
    hinweise: String(v.hinweise || ""),
    ...(appHinweise.length ? { appHinweise } : {}),
  };
}
