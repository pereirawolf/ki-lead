// Modul Lagebild: mehrere Meldungen einlesen, prüfen und gemeinsam auswerten.
// Rekursives Prinzip: Die Meldungen nachgeordneter oder lateraler Stellen ergeben das eigene Lagebild.
// Alles Organisationsspezifische kommt aus Schema, Darstellungsdatei (Rollen, Kennsätze) und Kontakten.

import JSZip from "jszip";
import { migriere } from "../kern/migration";
import { pruefeGegenSchema, type SchemaBefund } from "../kern/validierung";
import { holeWert, teilePfad } from "../kern/pfad";
import { sachverhalte } from "../kern/quellen";
import { enumWerte, unterSchema } from "../kern/schema";
import { eingangsInfo, type EingangsInfo } from "../pipeline/material";
import type { Kontakte, Meldung, Profil } from "../kern/typen";

export interface LagebildDatei {
  name: string;
  text: string;
  importiertAm: string;
}

export interface LagebildEintrag {
  /** Kennung über den Dateiinhalt; gleiche Inhalte werden nur einmal geführt */
  id: string;
  name: string;
  importiertAm: string;
  /** Meldung nach Migration (bei fremdem Schema: unverändert) */
  daten: Meldung;
  herkunft: string;
  /** Hinweise aus der Migration */
  hinweise: string[];
  /** Schemaprüfung gegen das Profil (bei fremdem Schema leer) */
  schema: SchemaBefund[];
  /** Gesetzt, wenn die Meldung einem fremden Schema folgt: dann nur für die KI-Verdichtung */
  fremd: EingangsInfo | null;
}

export interface LagebildFehler {
  name: string;
  text: string;
}

export interface SvEintrag {
  eintrag: LagebildEintrag;
  index: number;
  sv: any;
  land: string;
  stelle: string;
  bezeichnung: string;
  arten: string[];
  ort: string;
  eintritt: string;
  beurteilung: string;
  tendenz: string;
  bewertungText: string;
}

export type Farbe = "rot" | "orange" | "gelb" | "gruen" | "grau";

/** Kurzkennung über einen Text (FNV-1a, 32 Bit) plus Länge – genügt zum Erkennen doppelter Dateien. */
export function inhaltsKennung(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(16).padStart(8, "0")}-${text.length.toString(16)}`;
}

/** Liest Meldungsdateien ein: Migration und Schemaprüfung nach dem Profil, fremde Schemata erkennen. */
export function einlesen(dateien: LagebildDatei[], profil: Profil): { eintraege: LagebildEintrag[]; fehler: LagebildFehler[] } {
  const eintraege: LagebildEintrag[] = [];
  const fehler: LagebildFehler[] = [];
  const gesehen = new Set<string>();
  for (const datei of dateien) {
    const id = inhaltsKennung(datei.text);
    if (gesehen.has(id)) continue;
    gesehen.add(id);
    let obj: unknown;
    try {
      obj = JSON.parse(datei.text);
    } catch (e) {
      fehler.push({ name: datei.name, text: `kein gültiges JSON (${(e as Error).message})` });
      continue;
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      fehler.push({ name: datei.name, text: "keine Meldung (erwartet ein JSON-Objekt)" });
      continue;
    }
    const mig = migriere(obj, profil);
    const basis = { id, name: datei.name, importiertAm: datei.importiertAm, herkunft: mig.herkunft };
    if (mig.bekannt) {
      eintraege.push({ ...basis, daten: mig.daten, hinweise: mig.hinweise, schema: pruefeGegenSchema(profil.schema, mig.daten, profil.ui), fremd: null });
      continue;
    }
    const info = eingangsInfo(obj, profil);
    if (!info) {
      fehler.push({ name: datei.name, text: "keine Meldung nach diesem Profil und keine erkennbare Liste von Sachverhalten" });
      continue;
    }
    eintraege.push({ ...basis, daten: obj, hinweise: [], schema: [], fremd: info });
  }
  return { eintraege, fehler };
}

const IGNORIEREN = /(^|\/)(__MACOSX|\.)/;

/** Dateiauswahl oder Ablage: JSON-Dateien direkt, ZIP-Archive mit ihren JSON-Dateien. */
export const GRENZEN = { dateien: 500, bytesJeDatei: 20 * 1024 * 1024, bytesGesamt: 100 * 1024 * 1024 };

export async function dateienAusAuswahl(liste: File[]): Promise<{ dateien: LagebildDatei[]; fehler: LagebildFehler[] }> {
  const dateien: LagebildDatei[] = [];
  const fehler: LagebildFehler[] = [];
  const jetzt = new Date().toISOString();
  let gesamt = 0;
  // Grenzen vor der Verarbeitung: Anzahl, Größe je Datei und entpackte Gesamtgröße
  const passt = (name: string, bytes: number): boolean => {
    if (dateien.length >= GRENZEN.dateien) {
      fehler.push({ name, text: `mehr als ${GRENZEN.dateien} Dateien; der Rest wird nicht eingelesen` });
      return false;
    }
    if (bytes > GRENZEN.bytesJeDatei) {
      fehler.push({ name, text: "größer als 20 MB" });
      return false;
    }
    if (gesamt + bytes > GRENZEN.bytesGesamt) {
      fehler.push({ name, text: "Gesamtgröße über 100 MB; nicht eingelesen" });
      return false;
    }
    gesamt += bytes;
    return true;
  };
  for (const f of liste) {
    const endung = f.name.toLowerCase().split(".").pop();
    if (endung === "json") {
      if (passt(f.name, f.size)) dateien.push({ name: f.name, text: await f.text(), importiertAm: jetzt });
    } else if (endung === "zip") {
      try {
        const zip = await JSZip.loadAsync(await f.arrayBuffer());
        const json = Object.values(zip.files).filter((z) => !z.dir && /\.json$/i.test(z.name) && !IGNORIEREN.test(z.name));
        if (!json.length) fehler.push({ name: f.name, text: "das Archiv enthält keine JSON-Dateien" });
        // Vollständigen Pfad im Archiv behalten: Nord/meldung.json und Sued/meldung.json bleiben unterscheidbar
        for (const z of json) {
          const name = `${f.name.replace(/\.zip$/i, "")}/${z.name}`;
          const entpackt = Number((z as any)._data?.uncompressedSize) || 0;
          if (!passt(name, entpackt)) continue;
          const text = await z.async("string");
          if (!entpackt && !passt(name, text.length)) continue;
          dateien.push({ name, text, importiertAm: jetzt });
        }
      } catch (e) {
        fehler.push({ name: f.name, text: `ZIP nicht lesbar (${(e as Error).message})` });
      }
    } else {
      fehler.push({ name: f.name, text: "nur JSON-Dateien oder ZIP-Archive mit JSON-Dateien" });
    }
  }
  return { dateien, fehler };
}

/** Beispieldatensätze aus dem Profilpaket (Manifest „beispiele“). */
export function beispielDateien(profil: Profil, ordner: string): LagebildDatei[] {
  const praefix = ordner.replace(/^\.?\/*/, "").replace(/\/?$/, "/");
  const jetzt = new Date().toISOString();
  return Object.keys(profil.dateien)
    .filter((p) => p.startsWith(praefix) && p.toLowerCase().endsWith(".json"))
    .sort()
    .map((p) => ({ name: p.slice(praefix.length), text: profil.dateien[p] ?? "", importiertAm: jetzt }));
}

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function landVon(e: LagebildEintrag, profil: Profil): string {
  const r = profil.ui.rollen;
  if (e.fremd) return e.fremd.land;
  return r.land ? text(holeWert(e.daten, r.land)).trim() : "";
}

export function stelleVon(e: LagebildEintrag, profil: Profil): string {
  const r = profil.ui.rollen;
  if (e.fremd) return e.fremd.stelle;
  return r.meldende_stelle ? text(holeWert(e.daten, r.meldende_stelle)).trim() : "";
}

export function zeitpunktVon(e: LagebildEintrag, profil: Profil): string {
  const r = profil.ui.rollen;
  if (e.fremd) return e.fremd.zeitpunkt;
  return r.meldezeitpunkt ? text(holeWert(e.daten, r.meldezeitpunkt)) : "";
}

export function statusVon(e: LagebildEintrag, profil: Profil): string {
  return e.fremd ? "" : text(holeWert(e.daten, profil.ui.rollen.status_feld));
}

/** Kurzbezeichnung der meldenden Stelle für Listen: Land (falls vorhanden) und Stelle. */
export function absender(e: LagebildEintrag, profil: Profil): string {
  const land = landVon(e, profil);
  const stelle = stelleVon(e, profil);
  if (land && stelle && !stelle.startsWith(land)) return `${land} · ${stelle}`;
  return stelle || land || e.name;
}

function arten(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(text).filter(Boolean);
  return text(v) ? [text(v)] : [];
}

/** Alle Sachverhalte der Meldungen im Profilschema, flach mit Herkunft. */
export function alleSachverhalte(eintraege: LagebildEintrag[], profil: Profil): SvEintrag[] {
  const r = profil.ui.rollen;
  const wert = (sv: any, rolle?: string) => (rolle ? text(holeWert(sv, rolle)) : "");
  const out: SvEintrag[] = [];
  for (const e of eintraege) {
    if (e.fremd) continue;
    sachverhalte(e.daten, profil.ui).forEach((sv, index) => {
      out.push({
        eintrag: e,
        index,
        sv,
        land: landVon(e, profil),
        stelle: stelleVon(e, profil),
        bezeichnung: wert(sv, r.sv_bezeichnung).trim(),
        arten: r.sv_art ? arten(holeWert(sv, r.sv_art)) : [],
        ort: wert(sv, r.sv_ort),
        eintritt: wert(sv, r.sv_eintritt),
        beurteilung: wert(sv, r.sv_beurteilung),
        tendenz: wert(sv, r.sv_tendenz),
        bewertungText: wert(sv, r.sv_bewertung_text),
      });
    });
  }
  return out;
}

export function svKennung(s: SvEintrag, profil: Profil): string {
  return `${absender(s.eintrag, profil)} · ${s.bezeichnung || "(ohne Bezeichnung)"}`;
}

function aufzaehlung(profil: Profil, rolle?: string): string[] {
  if (!rolle) return [];
  const k = unterSchema(profil.schema, [profil.ui.rollen.sachverhalte, 0, ...teilePfad(rolle)]);
  return (enumWerte(k) || []).filter((w) => typeof w === "string" && w !== "") as string[];
}

/** Beurteilungsstufen aufsteigend nach Schwere (Reihenfolge der Aufzählung im Schema). */
export function beurteilungsStufen(profil: Profil): string[] {
  return aufzaehlung(profil, profil.ui.rollen.sv_beurteilung);
}

export function tendenzStufen(profil: Profil): string[] {
  return aufzaehlung(profil, profil.ui.rollen.sv_tendenz);
}

export function schwere(profil: Profil, beurteilung: string): number {
  return beurteilungsStufen(profil).indexOf(beurteilung);
}

export function farbeBeurteilung(profil: Profil, beurteilung: string): Farbe {
  const stufen = beurteilungsStufen(profil);
  const i = stufen.indexOf(beurteilung);
  if (i < 0) return "grau";
  const abstand = stufen.length - 1 - i;
  return abstand === 0 ? "rot" : abstand === 1 ? "orange" : abstand === 2 ? "gelb" : "grau";
}

export function verschaerfungsWert(profil: Profil): string | undefined {
  const r = profil.ui.rollen;
  if (r.tendenz_verschaerfung) return r.tendenz_verschaerfung;
  const t = tendenzStufen(profil);
  const letzter = t[t.length - 1];
  return t.length > 1 && letzter !== r.tendenz_entspannung ? letzter : undefined;
}

export function farbeTendenz(profil: Profil, tendenz: string): Farbe {
  if (!tendenz) return "grau";
  if (tendenz === profil.ui.rollen.tendenz_entspannung) return "gruen";
  if (tendenz === verschaerfungsWert(profil)) return "rot";
  return tendenzStufen(profil).includes(tendenz) ? "gelb" : "grau";
}

/** Sortiert nach Schwere der Beurteilung (höchste zuerst), sonst stabil. */
export function nachSchwere(svs: SvEintrag[], profil: Profil): SvEintrag[] {
  const stufen = beurteilungsStufen(profil);
  return [...svs].sort((a, b) => stufen.indexOf(b.beurteilung) - stufen.indexOf(a.beurteilung));
}

export function zaehle(werte: string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const w of werte) {
    const k = w || "(keine Angabe)";
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de"));
}

export interface Kennzahlen {
  meldungen: number;
  fremd: number;
  sachverhalte: number;
  hoch: { stufe: string; anzahl: number; farbe: Farbe }[];
  verschaerfung?: { wert: string; anzahl: number };
  schemaAbweichungen: number;
  entwuerfe: number;
}

/**
 * Hohe Beurteilungsstufen, schwerste zuerst: aus „beurteilung_hoch“ des Profils, sonst die beiden höchsten Stufen
 * des Schemas (abgeleitet = true). Kennzahlen und Redaktionscheck verwenden dieselbe Regel.
 */
export function hochStufen(profil: Profil): { stufen: string[]; abgeleitet: boolean } {
  const r = profil.ui.rollen;
  const alle = beurteilungsStufen(profil);
  const abgeleitet = !r.beurteilung_hoch?.length;
  const stufen = (abgeleitet ? alle.slice(-2) : r.beurteilung_hoch!).slice().sort((a, b) => alle.indexOf(b) - alle.indexOf(a));
  return { stufen, abgeleitet };
}

export function kennzahlen(eintraege: LagebildEintrag[], profil: Profil): Kennzahlen {
  const svs = alleSachverhalte(eintraege, profil);
  const r = profil.ui.rollen;
  const hoch = hochStufen(profil).stufen;
  const vs = verschaerfungsWert(profil);
  return {
    meldungen: eintraege.filter((e) => !e.fremd).length,
    fremd: eintraege.filter((e) => e.fremd).length,
    sachverhalte: svs.length,
    hoch: hoch.map((stufe) => ({ stufe, anzahl: svs.filter((s) => s.beurteilung === stufe).length, farbe: farbeBeurteilung(profil, stufe) })),
    verschaerfung: vs ? { wert: vs, anzahl: svs.filter((s) => s.tendenz === vs).length } : undefined,
    schemaAbweichungen: eintraege.filter((e) => e.schema.length).length,
    entwuerfe: eintraege.filter((e) => !e.fremd && statusVon(e, profil) === r.status_entwurf).length,
  };
}

export interface StatusZeile {
  name: string;
  feld: string;
  email?: string;
  eintraege: LagebildEintrag[];
}

/** Meldestatus nach der Kontaktliste des Profils: Wer hat gemeldet, wer noch nicht? */
export function meldestatus(eintraege: LagebildEintrag[], profil: Profil): { zeilen: StatusZeile[]; weitere: LagebildEintrag[] } | null {
  const k = profil.kontakte;
  if (!k?.stellen?.length) return null;
  const zugeordnet = new Set<string>();
  const zeilen = k.stellen.map((s) => {
    const treffer = eintraege.filter((e) => {
      const wert = e.fremd ? (s.feld === profil.ui.rollen.land || s.feld === "land" ? e.fremd.land : e.fremd.stelle) : text(holeWert(e.daten, s.feld));
      return wert.trim() === s.name;
    });
    treffer.forEach((e) => zugeordnet.add(e.id));
    return { name: s.name, feld: s.feld, email: s.email, eintraege: treffer };
  });
  return { zeilen, weitere: eintraege.filter((e) => !zugeordnet.has(e.id)) };
}

export function istPlatzhalterAdresse(email?: string): boolean {
  return !email || /\.invalid$|@beispiel\.|example\./i.test(email);
}

export function erinnerungMailto(zeile: StatusZeile, kontakte?: Kontakte): string {
  const vorlage = kontakte?.erinnerung || {
    betreff: "Erinnerung: Meldung {name}",
    text: "Guten Tag,\n\nfür den aktuellen Berichtszeitraum liegt noch keine Meldung aus {name} vor.\n\nMit freundlichen Grüßen",
  };
  const ersetze = (s: string) => s.replace(/\{name\}|\{land\}/g, zeile.name);
  return `mailto:${encodeURIComponent(zeile.email || "")}?subject=${encodeURIComponent(ersetze(vorlage.betreff))}&body=${encodeURIComponent(ersetze(vorlage.text))}`;
}

/** Mehrere Meldungen derselben Stelle: mögliche Fortschreibung, Gefahr der Doppelzählung (A.7.1). */
export function mehrfachMeldungen(eintraege: LagebildEintrag[], profil: Profil): { stelle: string; eintraege: LagebildEintrag[] }[] {
  const gruppen = new Map<string, LagebildEintrag[]>();
  for (const e of eintraege) {
    const schluessel = absender(e, profil);
    if (!schluessel || schluessel === e.name) continue;
    gruppen.set(schluessel, [...(gruppen.get(schluessel) || []), e]);
  }
  return [...gruppen.entries()]
    .filter(([, liste]) => liste.length > 1)
    .map(([stelle, liste]) => ({ stelle, eintraege: [...liste].sort((a, b) => zeitpunktVon(a, profil).localeCompare(zeitpunktVon(b, profil))) }));
}

/** Datum „JJJJ-MM-TT“ in N Tagen (lokale Zeit). */
export function inTagen(tage: number, ab = new Date()): string {
  const d = new Date(ab.getFullYear(), ab.getMonth(), ab.getDate() + tage);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
