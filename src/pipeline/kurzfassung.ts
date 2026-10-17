// Management Summary (Darstellung): Die KI formuliert je Sachverhalt die Analysefelder des Profils
// als kurze Absätze für die Leitung. Grundlage ist allein die Meldung; die App setzt Kopfzeile,
// Beurteilung und Tendenz selbst und entfernt verbliebene Quellenverweise.

import type { LlmAnbieter } from "../anbieter/typen";
import { datumDE } from "../kern/ausgabe";
import { holeWert } from "../kern/pfad";
import { sachverhalte } from "../kern/quellen";
import type { Meldung, Profil } from "../kern/typen";
import { ersetzePlatzhalter } from "../profil/platzhalter";
import { modellFuer, type Einstellungen } from "./einstellungen";
import { zerlegeAntwort } from "./json";
import type { StufenEintrag } from "./lauf";

export const STANDARD_ANWEISUNG = `# Arbeitsanweisung Kurzfassung: Management Summary

Formuliere aus der beigefügten Meldung eine Management Summary für die Behördenleitung, so wie eine Redaktionskonferenz sie ausfertigen würde. Einzige Grundlage ist die Meldung; ergänze keine Fakten und bewerte nicht neu. Prognosen und Szenarien bleiben als solche erkennbar.

Für jeden Sachverhalt, in derselben Reihenfolge, je Analysefeld ein Absatz mit zwei bis fünf kurzen, klaren Hauptsätzen (möglichst höchstens 20 Wörter je Satz). Der erste Satz des ersten Absatzes ist die Kernaussage. Keine Quellenverweise, keine URLs, keine Feldnamen, keine Radarwerte, keine Aufzählungszeichen. Enthält ein Feld nichts Verwertbares: „Die Meldung enthält dazu keine Angaben.“

Antworte im vorgegebenen JSON-Format.`;

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
  const props: Record<string, object> = { titel: { type: "string", description: "Bezeichnung des Sachverhalts, wie in der Meldung" } };
  for (const a of ab) props[a.schluessel] = { type: "string", description: `Absatz „${a.label}“` };
  return {
    type: "object",
    additionalProperties: false,
    required: ["sachverhalte"],
    properties: {
      sachverhalte: {
        type: "array",
        items: { type: "object", additionalProperties: false, required: ["titel", ...ab.map((a) => a.schluessel)], properties: props },
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

export interface Kurzfassung {
  text: string;
  sachverhalte: Record<string, string>[];
  hinweise: string[];
  eintrag: StufenEintrag;
  erstellt: string;
}

/** Klartext aus der KI-Antwort und den festen Angaben der Meldung. */
export function kurzfassungText(d: Meldung, profil: Profil, svs: Record<string, string>[]): string {
  const ui = profil.ui;
  const r = ui.rollen;
  const ab = abschnitte(profil);
  const titel = ui.kurzfassung?.titel || "Management Summary";
  const stelle = r.meldende_stelle ? String(holeWert(d, r.meldende_stelle) || "") : "";
  const stand = r.meldezeitpunkt ? datumDE(holeWert(d, r.meldezeitpunkt)) : "";
  const zeilen = [`${titel}${stelle ? ` – ${stelle}` : ""}${stand ? `, Stand ${stand}` : ""}`];
  const meldungSvs = sachverhalte(d, ui);
  svs.forEach((sv, i) => {
    const m = meldungSvs[i] || {};
    const bezeichnung = (r.sv_bezeichnung && holeWert(m, r.sv_bezeichnung)) || sv.titel || `Sachverhalt ${i + 1}`;
    const b = (r.sv_beurteilung && holeWert(m, r.sv_beurteilung)) || "keine Angabe";
    const t = (r.sv_tendenz && holeWert(m, r.sv_tendenz)) || "keine Angabe";
    zeilen.push("", `${svs.length > 1 ? `${i + 1}. ` : ""}${bezeichnung}`, `Beurteilung: ${b} · Tendenz: ${t}`);
    for (const a of ab) zeilen.push("", a.label, sv[a.schluessel] || "Die Meldung enthält dazu keine Angaben.");
  });
  return zeilen.join("\n") + "\n";
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
    const roh = (z.json as any)?.sachverhalte;
    if (!Array.isArray(roh)) throw new Error(`Die Kurzfassung ist nicht auswertbar. ${z.fehler || ""}`.trim());
    const hinweise: string[] = [];
    if (roh.length !== zahl) hinweise.push(`Die Meldung hat ${zahl} Sachverhalt(e), die Kurzfassung ${roh.length}. Bitte prüfen.`);
    let entfernt = false;
    const svs = roh.map((sv: Record<string, unknown>) => {
      const o: Record<string, string> = {};
      for (const [k, v] of Object.entries(sv)) {
        const b = bereinigeAbsatz(String(v ?? ""));
        entfernt ||= b.entfernt;
        o[k] = b.text;
      }
      return o;
    });
    if (entfernt) hinweise.push("Verbliebene Quellenverweise oder URLs wurden entfernt.");
    const lang = svs
      .flatMap((sv: Record<string, string>) => Object.values(sv).flatMap((t) => t.split(/(?<=[.!?])\s+/)))
      .filter((s: string) => s.split(/\s+/).length > 30);
    if (lang.length) hinweise.push(`${lang.length} Satz/Sätze mit mehr als 30 Wörtern. Für die Leitung ggf. kürzen.`);
    eintrag.befunde = hinweise;
    return { text: kurzfassungText(d, profil, svs), sachverhalte: svs, hinweise, eintrag, erstellt: new Date().toISOString() };
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
