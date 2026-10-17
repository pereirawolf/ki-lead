// Laden und Prüfen eines Profilpakets aus einer Dateisammlung (Pfad → Text).

import { schemaFehler } from "../kern/validierung";
import { aufloesen, unterSchema } from "../kern/schema";
import { teilePfad } from "../kern/pfad";
import type { Befund, Kontakte, Profil, ProfilManifest, Sop, UiKonfig } from "../kern/typen";
import { zerlegeSops } from "./sop";
import { platzhalterIn } from "./platzhalter";

export interface LadeErgebnis {
  profil: Profil | null;
  befunde: Befund[];
}

export async function sha256(text: string): Promise<string> {
  const daten = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", daten);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function profilHash(dateien: Record<string, string>): Promise<string> {
  const teile = Object.keys(dateien)
    .sort()
    .map((p) => `${p}\n${dateien[p]}`);
  return sha256(teile.join("\n\u0000\n"));
}

function jsonLesen(dateien: Record<string, string>, pfad: string, befunde: Befund[], pflicht: boolean): any {
  const text = dateien[pfad];
  if (text === undefined) {
    if (pflicht) befunde.push({ stufe: "fehler", text: `Pflichtdatei fehlt: ${pfad}` });
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    befunde.push({ stufe: "fehler", text: `${pfad} ist kein gültiges JSON: ${(e as Error).message}` });
    return undefined;
  }
}

/** Gemeinsames Wurzelverzeichnis entfernen (ZIP mit Oberordner). */
export function normalisiereDateien(dateien: Record<string, string>): Record<string, string> {
  const pfade = Object.keys(dateien).filter((p) => !/(^|\/)(\.|__MACOSX)/.test(p));
  const manifest = pfade.find((p) => p === "profil.json" || p.endsWith("/profil.json"));
  const praefix = manifest ? manifest.slice(0, manifest.length - "profil.json".length) : "";
  const out: Record<string, string> = {};
  for (const p of pfade) {
    if (!p.startsWith(praefix)) continue;
    out[p.slice(praefix.length)] = dateien[p];
  }
  return out;
}

function pruefeUiGegenSchema(ui: UiKonfig, schema: any, befunde: Befund[]) {
  for (const pfad of Object.keys(ui.felder || {})) {
    if (pfad.includes("*")) continue;
    const knoten = unterSchema(
      schema,
      teilePfad(pfad).map((s) => (s === -1 ? 0 : s)),
    );
    if (!knoten) befunde.push({ stufe: "warnung", text: `Darstellungsdatei: Feld „${pfad}“ kommt im Schema nicht vor.` });
  }
  for (const s of ui.schritte || []) {
    for (const f of s.felder) {
      if (!unterSchema(schema, teilePfad(f)))
        befunde.push({ stufe: "warnung", text: `Darstellungsdatei: Schritt „${s.titel}“ nennt das unbekannte Feld „${f}“.` });
    }
  }
  const r = ui.rollen;
  if (!r) {
    befunde.push({ stufe: "fehler", text: "Darstellungsdatei: Abschnitt „rollen“ fehlt." });
    return;
  }
  const wurzel = aufloesen(schema, schema);
  for (const [rolle, pfad] of Object.entries(r)) {
    if (typeof pfad !== "string" || !/^(schema_feld|status_feld|entstehung_feld|land|meldende_stelle|meldezeitpunkt|quellen|sachverhalte)$/.test(rolle))
      continue;
    if (!wurzel?.properties?.[pfad])
      befunde.push({ stufe: "warnung", text: `Darstellungsdatei: Rolle „${rolle}“ verweist auf das unbekannte Feld „${pfad}“.` });
  }
  for (const [name, radar] of Object.entries(ui.radare || {})) {
    for (const a of radar.achsen) {
      if (a.stufen.length !== radar.max + 1)
        befunde.push({ stufe: "warnung", text: `Radar „${name}“, Achse ${a.key}: ${a.stufen.length} Stufentexte, erwartet ${radar.max + 1}.` });
    }
  }
}

/** Vergleicht die Stufentexte der Darstellungsdatei mit Tabellen im Kodierleitfaden (nur Hinweis). */
function pruefeStufentexte(ui: UiKonfig, leitfaden: string | undefined, befunde: Befund[]) {
  if (!leitfaden) return;
  for (const radar of Object.values(ui.radare || {})) {
    for (const achse of radar.achsen) {
      const fehlend = achse.stufen.filter((s) => !leitfaden.includes(s));
      if (fehlend.length && /D\d/.test(achse.label))
        befunde.push({
          stufe: "hinweis",
          text: `Stufentexte ${achse.label.split(" ")[0]}: ${fehlend.length} Text(e) nicht wortgleich im Kodierleitfaden gefunden.`,
        });
    }
  }
}

export async function ladeProfil(rohDateien: Record<string, string>): Promise<LadeErgebnis> {
  const dateien = normalisiereDateien(rohDateien);
  const befunde: Befund[] = [];
  const manifest = jsonLesen(dateien, "profil.json", befunde, true) as ProfilManifest | undefined;
  if (!manifest) return { profil: null, befunde };
  if (manifest.format !== "lead-profil/1") befunde.push({ stufe: "warnung", text: `Unbekanntes Profilformat „${manifest.format}“ (erwartet lead-profil/1).` });
  for (const feld of ["id", "name", "version"] as const) {
    if (!manifest[feld]) befunde.push({ stufe: "fehler", text: `profil.json: Angabe „${feld}“ fehlt.` });
  }
  if (!manifest.meldung?.schema || !manifest.meldung?.ui) {
    befunde.push({ stufe: "fehler", text: "profil.json: Abschnitt „meldung“ mit „schema“ und „ui“ fehlt." });
    return { profil: null, befunde };
  }
  manifest.variablen = manifest.variablen || {};

  const schema = jsonLesen(dateien, manifest.meldung.schema, befunde, true);
  const ui = jsonLesen(dateien, manifest.meldung.ui, befunde, true) as UiKonfig | undefined;
  if (schema) {
    const f = schemaFehler(schema);
    if (f) befunde.push({ stufe: "fehler", text: `Das Meldungsschema ist nicht verwendbar: ${f}` });
    const kennung = schema?.properties?.[ui?.rollen?.schema_feld || "schema"]?.const;
    if (kennung && manifest.meldung.schema_id && kennung !== manifest.meldung.schema_id)
      befunde.push({ stufe: "warnung", text: `Schemakennung im Schema („${kennung}“) weicht von profil.json („${manifest.meldung.schema_id}“) ab.` });
    if (!manifest.meldung.schema_id && kennung) manifest.meldung.schema_id = kennung;
  }
  if (schema && ui) pruefeUiGegenSchema(ui, schema, befunde);

  for (const [art, pfad] of Object.entries(manifest.anweisungen || {})) {
    if (pfad && dateien[pfad] === undefined) befunde.push({ stufe: art === "erfassung" ? "fehler" : "warnung", text: `Arbeitsanweisung fehlt: ${pfad}` });
    else if (pfad) {
      const unbekannt = platzhalterIn(dateien[pfad]).filter(
        (p) => /^profil\./.test(p) && !(p.slice(7) in manifest.variablen) && !["profil.referenzraum", "profil.ebene", "profil.name"].includes(p),
      );
      if (unbekannt.length) befunde.push({ stufe: "warnung", text: `${pfad}: Platzhalter ohne Profilvariable: ${unbekannt.join(", ")}` });
    }
  }
  if (!manifest.anweisungen?.erfassung)
    befunde.push({ stufe: "fehler", text: "profil.json: Arbeitsanweisung für die Erfassung („anweisungen.erfassung“) fehlt." });
  if (manifest.kodierleitfaden && dateien[manifest.kodierleitfaden] === undefined)
    befunde.push({ stufe: "fehler", text: `Kodierleitfaden fehlt: ${manifest.kodierleitfaden}` });
  if (!manifest.kodierleitfaden) befunde.push({ stufe: "fehler", text: "profil.json: Kodierleitfaden fehlt." });

  const sops: Sop[] = [];
  for (const pfad of manifest.sop?.dateien || []) {
    const text = dateien[pfad];
    if (text === undefined) {
      befunde.push({ stufe: "warnung", text: `SOP-Datei fehlt: ${pfad}` });
      continue;
    }
    sops.push(...zerlegeSops(text, pfad, manifest.sop?.teil_gemeinsam));
  }
  if (manifest.sop?.teil_gemeinsam && !sops.some((s) => s.gemeinsam))
    befunde.push({ stufe: "warnung", text: `Gemeinsamer Teil „${manifest.sop.teil_gemeinsam}“ wurde in den SOP-Dateien nicht gefunden.` });
  if (!manifest.sop)
    befunde.push({ stufe: "hinweis", text: "Das Profil enthält keine SOP. Die KI arbeitet dann nur nach Arbeitsanweisung und Kodierleitfaden." });

  let kontakte: Kontakte | undefined;
  if (manifest.kontakte) {
    const lokal = manifest.kontakte.replace(/\.json$/, ".lokal.json");
    kontakte = jsonLesen(dateien, dateien[lokal] !== undefined ? lokal : manifest.kontakte, befunde, false);
  }
  if (ui && manifest.kodierleitfaden) pruefeStufentexte(ui, dateien[manifest.kodierleitfaden], befunde);

  if (befunde.some((b) => b.stufe === "fehler") || !schema || !ui) return { profil: null, befunde };
  const hash = await profilHash(dateien);
  return { profil: { manifest, schema, ui, dateien, sops, kontakte, hash }, befunde };
}
