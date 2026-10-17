// Management Summary (Darstellung): eine konsolidierte Gesamtfassung für die Behördenleitung.
// Die KI schreibt Kernaussage, je Analysefeld höchstens zwei Sätze für die gesamte Lage und je
// Sachverhalt einen Kurztitel. Kopfzeile, Beurteilung und Tendenz je Sachverhalt sowie die früheste
// Frist setzt die App aus der Meldung; sie entfernt Quellenverweise und prüft die Richtwerte.

import type { LlmAnbieter } from "../anbieter/typen";
import { datumDE } from "../kern/ausgabe";
import { holeWert } from "../kern/pfad";
import { sachverhalte } from "../kern/quellen";
import { kennsatz, parseDatumDE } from "../kern/kennsaetze";
import type { Meldung, Profil } from "../kern/typen";
import { ersetzePlatzhalter } from "../profil/platzhalter";
import { modellFuer, type Einstellungen } from "./einstellungen";
import { zerlegeAntwort } from "./json";
import type { StufenEintrag } from "./lauf";

export const STANDARD_ANWEISUNG = `# Arbeitsanweisung Kurzfassung: Management Summary

Fasse die beigefügte Meldung für die Behördenleitung zu einer einzigen, konsolidierten Gesamtfassung zusammen, lesbar in einer Minute (insgesamt höchstens etwa 150 Wörter). Einzige Grundlage ist die Meldung; ergänze nichts und bewerte nicht neu. Die Kernaussage ist ein Satz. Je Abschnitt höchstens zwei Sätze mit höchstens 25 Wörtern, nur das Entscheidungsrelevante, keine Wiederholung je Sachverhalt. Keine Quellenverweise, URLs, Feldnamen, Radarwerte, Ortsaufzählungen oder Aufzählungszeichen.

Antworte im vorgegebenen JSON-Format.`;

/** Richtwerte für die Leitungsfassung; die App weist auf Überschreitungen hin. */
export const GRENZEN = { woerterGesamt: 180, woerterJeSatz: 25, saetzeJeAbschnitt: 2 };

export interface Abschnitt {
  schluessel: string;
  pfad: string;
  label: string;
}

/** Analysefelder des Profils als Abschnitte der Kurzfassung. */
export function abschnitte(profil: Profil): Abschnitt[] {
  const r = profil.ui.rollen;
  const felder = r.sv_analysefelder || [];
  const genutzt = new Set<string>();
  return felder.map((pfad, i) => {
    let s = (pfad.split(".").pop() || `feld${i + 1}`).replace(/[^a-z0-9_]/gi, "_");
    if (genutzt.has(s)) s = `${s}_${i + 1}`;
    genutzt.add(s);
    return { schluessel: s, pfad, label: profil.ui.felder[`${r.sachverhalte}[].${pfad}`]?.label || pfad };
  });
}

export function kurzfassungSchema(profil: Profil): object {
  const ab = abschnitte(profil);
  const props: Record<string, object> = {};
  for (const a of ab) props[a.schluessel] = { type: "string", description: `„${a.label}“ für die gesamte Lage: höchstens zwei kurze Sätze` };
  return {
    type: "object",
    additionalProperties: false,
    required: ["kernaussage", "abschnitte", "kurztitel"],
    properties: {
      kernaussage: { type: "string", description: "Ein Satz: Was ist los, und was folgt daraus für die Leitung?" },
      abschnitte: { type: "object", additionalProperties: false, required: ab.map((a) => a.schluessel), properties: props },
      kurztitel: {
        type: "array",
        description: "Je Sachverhalt der Meldung, in derselben Reihenfolge, ein Kurztitel mit höchstens fünf Wörtern",
        items: { type: "string" },
      },
    },
  };
}

export function kurzfassungAnweisung(profil: Profil): string {
  const pfad = profil.manifest.anweisungen?.kurzfassung;
  const roh = (pfad && profil.dateien[pfad]) || STANDARD_ANWEISUNG;
  return ersetzePlatzhalter(roh, {
    profil: {
      kurzname: profil.manifest.variablen.meldende_stelle,
      lageprodukt: "Lagebild",
      ...profil.manifest.variablen,
      referenzraum: profil.manifest.referenzraum,
      ebene: profil.manifest.ebene,
      name: profil.manifest.name,
    },
  }).text;
}

/** Meldung ohne Quellenverzeichnis, Freigabe und Herkunft: nur der Stoff der Kurzfassung. */
export function meldungFuerKurzfassung(d: Meldung, profil: Profil): Meldung {
  const r = profil.ui.rollen;
  const kopie: Meldung = structuredClone(d);
  for (const k of [r.quellen, r.entstehung_feld, "freigabe", r.status_feld]) if (k) delete kopie[k];
  return kopie;
}

export function bereinigeAbsatz(t: string): { text: string; entfernt: boolean } {
  const vorher = t;
  const text = t
    .replace(/\s*\[Q[^\]]*\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return { text, entfernt: text !== vorher.trim() };
}

export interface KurzfassungStruktur {
  kernaussage: string;
  abschnitte: Record<string, string>;
  kurztitel: string[];
}

export interface Kurzfassung {
  text: string;
  struktur: KurzfassungStruktur;
  hinweise: string[];
  eintrag: StufenEintrag;
  erstellt: string;
}

/** Früheste Frist aus den Kennsätzen „Handlungsrelevant bis:“ aller Sachverhalte. */
export function fruehesteFrist(d: Meldung, profil: Profil): string {
  const ui = profil.ui;
  const prefix = ui.kennsaetze?.handlungsrelevant;
  const feld = ui.rollen.sv_bewertung_text;
  if (!prefix || !feld) return "";
  let beste: { datum: Date; text: string } | null = null;
  for (const sv of sachverhalte(d, ui)) {
    const wert = kennsatz(holeWert(sv, feld), prefix);
    const datum = wert ? parseDatumDE(wert) : null;
    if (!wert || !datum) continue;
    const text = wert
      .split(/[(;]/)[0]
      .trim()
      .replace(/\s*\[Q[^\]]*\]/g, "");
    if (!beste || datum < beste.datum) beste = { datum, text };
  }
  return beste ? `${prefix} ${beste.text}` : "";
}

export function woerter(t: string): number {
  return t.split(/\s+/).filter(Boolean).length;
}

export function saetze(t: string): string[] {
  return t
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„"])/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Klartext der Leitungsfassung: Kopf, Kernaussage, Sachverhalte mit Beurteilung, Abschnitte, Frist. */
export function kurzfassungText(d: Meldung, profil: Profil, k: KurzfassungStruktur): string {
  const ui = profil.ui;
  const r = ui.rollen;
  const titel = ui.kurzfassung?.titel || "Management Summary";
  const stelle = r.meldende_stelle ? String(holeWert(d, r.meldende_stelle) || "") : "";
  const stand = r.meldezeitpunkt ? datumDE(holeWert(d, r.meldezeitpunkt)) : "";
  const zeilen = [`${titel}${stelle ? ` – ${stelle}` : ""}${stand ? `, Stand ${stand}` : ""}`, "", k.kernaussage];
  const svs = sachverhalte(d, ui);
  if (svs.length) {
    zeilen.push("");
    svs.forEach((sv, i) => {
      const name = k.kurztitel[i] || (r.sv_bezeichnung && holeWert(sv, r.sv_bezeichnung)) || `Sachverhalt ${i + 1}`;
      const b = (r.sv_beurteilung && holeWert(sv, r.sv_beurteilung)) || "keine Angabe";
      const t = (r.sv_tendenz && holeWert(sv, r.sv_tendenz)) || "keine Angabe";
      zeilen.push(`• ${name}: ${b}, ${t}`);
    });
  }
  zeilen.push("");
  for (const a of abschnitte(profil)) zeilen.push(`${a.label}: ${k.abschnitte[a.schluessel] || "Keine Angaben."}`);
  const frist = fruehesteFrist(d, profil);
  if (frist) zeilen.push("", frist);
  return zeilen.join("\n") + "\n";
}

/** Prüft die Richtwerte und liefert Hinweise. */
export function kurzfassungHinweise(k: KurzfassungStruktur, zahlSv: number): string[] {
  const h: string[] = [];
  const texte = [k.kernaussage, ...Object.values(k.abschnitte)];
  const gesamt = texte.reduce((n, t) => n + woerter(t), 0);
  if (gesamt > GRENZEN.woerterGesamt) h.push(`${gesamt} Wörter; für die Leitung sind höchstens etwa ${GRENZEN.woerterGesamt} vorgesehen.`);
  const lang = texte.flatMap(saetze).filter((x) => woerter(x) > GRENZEN.woerterJeSatz + 5);
  if (lang.length) h.push(`${lang.length} Satz/Sätze mit mehr als ${GRENZEN.woerterJeSatz + 5} Wörtern.`);
  const voll = Object.values(k.abschnitte).filter((t) => saetze(t).length > GRENZEN.saetzeJeAbschnitt);
  if (voll.length) h.push(`${voll.length} Abschnitt(e) mit mehr als ${GRENZEN.saetzeJeAbschnitt} Sätzen.`);
  if (k.kurztitel.length !== zahlSv) h.push(`Die Meldung hat ${zahlSv} Sachverhalt(e), die Kurzfassung nennt ${k.kurztitel.length} Kurztitel.`);
  return h;
}

export async function kurzfassungErstellen(profil: Profil, d: Meldung, anbieter: LlmAnbieter, e: Einstellungen, signal?: AbortSignal): Promise<Kurzfassung> {
  const modell = modellFuer("kurzfassung", e, profil);
  const system = kurzfassungAnweisung(profil);
  const stoff = meldungFuerKurzfassung(d, profil);
  const schema = kurzfassungSchema(profil);
  const zahl = sachverhalte(d, profil.ui).length;
  const nachricht = `Meldung (${zahl} Sachverhalt${zahl === 1 ? "" : "e"}):\n\n\`\`\`json\n${JSON.stringify(stoff, null, 1)}\n\`\`\``;
  const eintrag: StufenEintrag = {
    stufe: "Management Summary",
    start: new Date().toISOString(),
    modell,
    aufwand: e.aufwand.kurzfassung,
    anfrage: { system: [system], nachrichten: [{ role: "user", content: nachricht }], jsonSchema: schema, maxTokens: 16000 },
  };
  try {
    const a = await anbieter.senden({
      modell,
      aufwand: e.aufwand.kurzfassung,
      maxTokens: 16000,
      system: [{ text: system, cache: true }],
      nachrichten: [{ role: "user", content: nachricht }],
      jsonSchema: schema,
      signal,
    });
    eintrag.antwort = { text: a.text, inhalt: a.inhalt, stopGrund: a.stopGrund, runden: a.runden };
    eintrag.nutzung = a.nutzung;
    eintrag.kostenUsd = a.kostenUsd;
    eintrag.modell = a.modell;
    const z = zerlegeAntwort(a.text);
    const roh = z.json as any;
    if (!roh || typeof roh.kernaussage !== "string" || !roh.abschnitte) throw new Error(`Die Kurzfassung ist nicht auswertbar. ${z.fehler || ""}`.trim());
    let entfernt = false;
    const rein = (t: unknown) => {
      const r = bereinigeAbsatz(String(t ?? ""));
      entfernt ||= r.entfernt;
      return r.text;
    };
    const struktur: KurzfassungStruktur = {
      kernaussage: rein(roh.kernaussage),
      abschnitte: Object.fromEntries(abschnitte(profil).map((x) => [x.schluessel, rein(roh.abschnitte[x.schluessel])])),
      kurztitel: Array.isArray(roh.kurztitel) ? roh.kurztitel.map(rein) : [],
    };
    const hinweise = kurzfassungHinweise(struktur, zahl);
    if (entfernt) hinweise.push("Verbliebene Quellenverweise oder URLs wurden entfernt.");
    eintrag.befunde = hinweise;
    return { text: kurzfassungText(d, profil, struktur), struktur, hinweise, eintrag, erstellt: new Date().toISOString() };
  } catch (err: any) {
    eintrag.fehler = err?.name === "AbortError" ? "abgebrochen" : String(err?.message || err);
    throw err;
  } finally {
    eintrag.ende = new Date().toISOString();
    eintrag.dauerMs = Date.parse(eintrag.ende) - Date.parse(eintrag.start);
  }
}

/** Kurzer, stabiler Fingerabdruck einer Meldung (erkennt, ob die Kurzfassung veraltet ist). */
export function fingerabdruck(d: Meldung): string {
  const s = JSON.stringify(d);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}
