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

const istText = (v: unknown) => typeof v === "string";
const istObjekt = (v: unknown) => !!v && typeof v === "object" && !Array.isArray(v);
const textListe = (v: unknown) => Array.isArray(v) && v.every(istText);

/**
 * Strukturprüfung der Darstellungsdatei: Was die App zum Arbeiten braucht, muss vorhanden und richtig
 * typisiert sein. Fehler verhindern die Aktivierung des Profils, statt die Oberfläche später abstürzen zu lassen.
 */
export function pruefeUiStruktur(ui: any, befunde: Befund[]): boolean {
  const vorher = befunde.length;
  const fehler = (text: string) => befunde.push({ stufe: "fehler", text: `Darstellungsdatei: ${text}` });
  if (!istObjekt(ui)) {
    fehler("kein JSON-Objekt.");
    return false;
  }
  if (!Array.isArray(ui.schritte) || ui.schritte.length === 0) fehler("„schritte“ braucht mindestens einen Bearbeitungsschritt.");
  else
    ui.schritte.forEach((s: any, i: number) => {
      if (!istObjekt(s) || !istText(s.id) || !istText(s.titel) || !textListe(s.felder))
        fehler(`Schritt ${i + 1} braucht „id“, „titel“ (Text) und „felder“ (Liste von Feldnamen).`);
    });
  if (!istObjekt(ui.felder)) fehler("„felder“ fehlt oder ist kein Objekt.");
  else
    for (const [pfad, f] of Object.entries(ui.felder)) {
      if (!istObjekt(f)) fehler(`Feld „${pfad}“: Einstellungen müssen ein Objekt sein.`);
      else if ((f as any).label !== undefined && !istText((f as any).label)) fehler(`Feld „${pfad}“: „label“ muss Text sein.`);
    }
  const r = ui.rollen;
  if (!istObjekt(r)) fehler("Abschnitt „rollen“ fehlt.");
  else {
    for (const k of ["schema_feld", "status_feld", "status_entwurf", "status_final", "sachverhalte"])
      if (!istText(r[k]) || !r[k]) fehler(`Rolle „${k}“ fehlt oder ist kein Text.`);
    for (const [k, v] of Object.entries(r)) {
      if (["sv_textfelder", "sv_analysefelder", "beurteilung_hoch"].includes(k)) {
        if (!textListe(v)) fehler(`Rolle „${k}“ muss eine Liste von Texten sein.`);
      } else if (!istText(v)) fehler(`Rolle „${k}“ muss Text sein.`);
    }
  }
  if (ui.radare !== undefined) {
    if (!istObjekt(ui.radare)) fehler("„radare“ muss ein Objekt sein.");
    else
      for (const [name, rd] of Object.entries<any>(ui.radare)) {
        if (!istObjekt(rd) || !Number.isInteger(rd.max) || rd.max < 1) fehler(`Radar „${name}“: „max“ muss eine ganze Zahl ab 1 sein.`);
        else if (!Array.isArray(rd.achsen) || !rd.achsen.length) fehler(`Radar „${name}“: „achsen“ fehlen.`);
        else
          rd.achsen.forEach((a: any, i: number) => {
            if (!istObjekt(a) || !istText(a.key) || !istText(a.label) || !textListe(a.stufen))
              fehler(`Radar „${name}“, Achse ${i + 1}: „key“, „label“ und „stufen“ erforderlich.`);
          });
      }
  }
  if (ui.kennsaetze !== undefined && (!istObjekt(ui.kennsaetze) || !Object.values(ui.kennsaetze).every(istText)))
    fehler("„kennsaetze“ muss ein Objekt mit Texten sein.");
  if (ui.lagebild !== undefined) {
    if (!istObjekt(ui.lagebild)) fehler("„lagebild“ muss ein Objekt sein.");
    else if (ui.lagebild.ausgabe_tage !== undefined && !(Number.isInteger(ui.lagebild.ausgabe_tage) && ui.lagebild.ausgabe_tage >= 0))
      fehler("„lagebild.ausgabe_tage“ muss eine ganze Zahl ab 0 sein.");
  }
  for (const name of ["bewertung_gliederung", "analyse_gliederung"]) {
    const g = ui[name];
    if (g === undefined) continue;
    if (!istObjekt(g)) {
      fehler(`„${name}“ muss ein Objekt sein.`);
      continue;
    }
    for (const art of ["absatz", "zeile"]) {
      if (g[art] === undefined) continue;
      if (!textListe(g[art])) fehler(`„${name}.${art}“ muss eine Liste von Texten sein.`);
      else
        for (const q of g[art])
          try {
            new RegExp(q, "u");
          } catch {
            fehler(`„${name}.${art}“: „${q}“ ist kein gültiger regulärer Ausdruck.`);
          }
    }
    if (g.kurzlabel !== undefined && !(Number.isInteger(g.kurzlabel) && g.kurzlabel >= 0 && g.kurzlabel <= 8))
      fehler(`„${name}.kurzlabel“ muss eine ganze Zahl von 0 bis 8 sein.`);
  }
  return befunde.length === vorher;
}

function pruefeManifestStruktur(m: any, befunde: Befund[]) {
  const fehler = (text: string) => befunde.push({ stufe: "fehler", text: `profil.json: ${text}` });
  if (m.variablen !== undefined && (!istObjekt(m.variablen) || !Object.values(m.variablen).every(istText)))
    fehler("„variablen“ muss ein Objekt mit Texten sein.");
  if (m.eigene_stellen !== undefined && !textListe(m.eigene_stellen)) fehler("„eigene_stellen“ muss eine Liste von Texten sein.");
  if (m.beispiele !== undefined && !(Array.isArray(m.beispiele) && m.beispiele.every((b: any) => istObjekt(b) && istText(b.titel) && istText(b.ordner))))
    fehler("„beispiele“ braucht je Eintrag „titel“ und „ordner“.");
  if (m.modelle !== undefined && (!istObjekt(m.modelle) || !Object.values(m.modelle).every(istText)))
    fehler("„modelle“ muss ein Objekt mit Modellkennungen sein.");
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
  pruefeManifestStruktur(manifest, befunde);
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
  const uiOk = ui ? pruefeUiStruktur(ui, befunde) : false;
  if (schema && ui && uiOk) pruefeUiGegenSchema(ui, schema, befunde);

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

  for (const b of manifest.beispiele || []) {
    const praefix = b.ordner.replace(/^\.?\/*/, "").replace(/\/?$/, "/");
    if (!Object.keys(dateien).some((p) => p.startsWith(praefix) && p.toLowerCase().endsWith(".json")))
      befunde.push({ stufe: "warnung", text: `Beispiel „${b.titel}“: Im Ordner ${b.ordner} liegen keine JSON-Dateien.` });
  }
  let kontakte: Kontakte | undefined;
  if (manifest.kontakte) {
    const lokal = manifest.kontakte.replace(/\.json$/, ".lokal.json");
    kontakte = jsonLesen(dateien, dateien[lokal] !== undefined ? lokal : manifest.kontakte, befunde, false);
    const ok =
      istObjekt(kontakte) &&
      Array.isArray(kontakte!.stellen) &&
      kontakte!.stellen.every((s: any) => istObjekt(s) && istText(s.name) && istText(s.feld) && (s.email === undefined || istText(s.email)));
    if (kontakte !== undefined && !ok) {
      befunde.push({ stufe: "warnung", text: "Kontakte: „stellen“ braucht je Eintrag „name“ und „feld“ (Text); der Meldestatus entfällt." });
      kontakte = undefined;
    }
  }
  if (ui && uiOk && manifest.kodierleitfaden) pruefeStufentexte(ui, dateien[manifest.kodierleitfaden], befunde);

  if (befunde.some((b) => b.stufe === "fehler") || !schema || !ui) return { profil: null, befunde };
  const hash = await profilHash(dateien);
  return { profil: { manifest, schema, ui, dateien, sops, kontakte, hash }, befunde };
}
