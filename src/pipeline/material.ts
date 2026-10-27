// Stufe S0: Eingangsmaterial lokal aufbereiten.
// Text (TXT, MD), JSON (Meldung oder sonstiges), DOCX (Text aus word/document.xml), PDF (als Dokument
// an das Modell, das PDFs selbst liest), Stichworte und URLs (Abruf übernimmt das Modell).

import { istEigeneStelle } from "../kern/ui";
import { holeWert } from "../kern/pfad";
import type { Meldung, Profil } from "../kern/typen";
import type { Inhaltsblock } from "../anbieter/typen";
import { eingangsInfo, type EingangsInfo } from "../kern/eingang";

/** meldung = eigene Vormeldung (Fortschreibung), eingang = Meldung einer anderen Stelle (Verdichtung) */
export type MaterialArt = "notiz" | "url" | "text" | "json" | "meldung" | "eingang" | "docx" | "pdf";

export interface Material {
  id: string;
  art: MaterialArt;
  name: string;
  groesse: number;
  /** SHA-256 des Originals */
  hash: string;
  text?: string;
  /** Nur PDF: Base64-Inhalt */
  base64?: string;
  meldung?: Meldung;
  eingang?: EingangsInfo;
  hinweis?: string;
  /** true, wenn die Rolle (Eingang/Vormeldung) von der Person gewählt wurde statt automatisch erkannt */
  rolleGewaehlt?: boolean;
}

/** Rolle einer Meldung im KI-Auftrag: Eingang (wird verdichtet) oder eigene Vormeldung (wird fortgeschrieben). */
export type MeldungsRolle = "eingang" | "meldung";

/** Eine Meldung, die das Lagebild an die KI-Erfassung übergibt, mit ausdrücklich gewählter Rolle. */
export interface UebergabeMeldung {
  /** Stabile Kennung aus dem Lagebild (Inhaltskennung) */
  id: string;
  name: string;
  text: string;
  rolle: MeldungsRolle;
}

/**
 * Auftrag des Lagebilds an die KI-Erfassung. Er gilt nur für das Profil, unter dem er entstand
 * (Prüfsumme), und wird nach der Verarbeitung quittiert, damit er nicht erneut übernommen wird.
 */
export interface KiUebergabe {
  nr: number;
  profilHash: string;
  dateien: UebergabeMeldung[];
}

/** Welche Rollen für eine Meldung möglich sind, mit Begründung für die nicht möglichen. */
export function moeglicheRollen(obj: unknown, profil: Profil): Record<MeldungsRolle, { moeglich: boolean; grund?: string }> {
  const eingang = !!eingangsInfo(obj, profil);
  const meldung = istMeldung(obj, profil);
  return {
    eingang: eingang ? { moeglich: true } : { moeglich: false, grund: "keine erkennbare Stelle oder Liste von Sachverhalten" },
    meldung: meldung ? { moeglich: true } : { moeglich: false, grund: "Schema passt nicht zum aktiven Profil" },
  };
}

const MAX_PDF_BYTES = 30 * 1024 * 1024;
const MAX_DATEI_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_ZEICHEN = 400_000;

async function sha256Bytes(daten: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", daten);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64(daten: ArrayBuffer): string {
  const bytes = new Uint8Array(daten);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function neueId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Text aus einer DOCX-Datei: Absätze, Tabellenzellen, Tabulatoren und Umbrüche. */
export async function docxText(daten: ArrayBuffer): Promise<string> {
  // jszip erst bei Bedarf laden (seit 0.6.5, TP-2026-W44-18): nicht im Haupt-JavaScript
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(daten);
  const datei = zip.file("word/document.xml");
  if (!datei) throw new Error("Keine gültige DOCX-Datei (word/document.xml fehlt).");
  const xml = await datei.async("string");
  const text = xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tc>/g, "\t")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Erkennt eine Meldung nach dem Profil (Schemakennung im Feld der Rolle schema_feld). */
export function istMeldung(obj: unknown, profil: Profil): boolean {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const kennung = (obj as any)[profil.ui.rollen.schema_feld];
  if (typeof kennung !== "string") return false;
  const bekannt = [
    profil.manifest.meldung.schema_id,
    ...(profil.manifest.meldung.eingang_schema_ids || []),
    ...(profil.manifest.migrationen || []).map((m) => m.von),
  ];
  return bekannt.includes(kennung);
}

/**
 * Neues Material mit eindeutigen Namen: Die Namen dienen der KI als Kennung (Zuordnung der Eingangsmeldungen),
 * deshalb erhalten gleichnamige Dateien mit anderem Inhalt einen Zusatz „(2)“, „(3)“ …; gleiche Inhalte entfallen.
 */
export function materialErgaenzen(alt: Material[], neu: Material[]): Material[] {
  const out = [...alt];
  for (const n of neu) {
    if (out.some((a) => a.hash === n.hash)) continue;
    let name = n.name;
    for (let i = 2; out.some((a) => a.name === name); i++) name = n.name.replace(/(\.[^.\/]+)?$/, ` (${i})$1`);
    out.push(name === n.name ? n : { ...n, name });
  }
  return out;
}

/**
 * Setzt die ausdrücklich gewählte Rolle; sie geht der automatischen Erkennung vor. Ist die Rolle für die
 * Meldung nicht möglich, bleibt die erkannte Rolle und ein Hinweis erklärt den Grund.
 */
export function rolleSetzen(m: Material, rolle: MeldungsRolle, profil: Profil): Material {
  if (!m.meldung || (m.art !== "eingang" && m.art !== "meldung")) return m;
  const umgestellt = m.art === rolle ? m : umklassifizieren(m, profil);
  if (umgestellt.art !== rolle) {
    const grund = moeglicheRollen(m.meldung, profil)[rolle].grund;
    return { ...m, hinweis: `${m.hinweis || ""} Gewählte Rolle nicht möglich (${grund}).`.trim() };
  }
  const wer = umgestellt.eingang ? [umgestellt.eingang.land, umgestellt.eingang.stelle].filter(Boolean).join(", ") : "";
  return {
    ...umgestellt,
    rolleGewaehlt: true,
    hinweis: rolle === "eingang" ? `Eingangsmeldung${wer ? `: ${wer}` : ""} (Rolle gewählt).` : "Eigene Vormeldung zur Fortschreibung (Rolle gewählt).",
  };
}

/** Korrektur der automatischen Einordnung: Vormeldung ↔ Eingangsmeldung (nur Meldungen mit erkennbarer Struktur). */
export function umklassifizieren(m: Material, profil: Profil): Material {
  if (!m.meldung) return m;
  if (m.art === "meldung") {
    const info = eingangsInfo(m.meldung, profil);
    if (!info) return m;
    return {
      ...m,
      art: "eingang",
      eingang: info,
      hinweis: `Als Eingangsmeldung behandelt (von Hand): ${[info.land, info.stelle].filter(Boolean).join(", ")}.`,
    };
  }
  if (m.art === "eingang" && istMeldung(m.meldung, profil)) {
    const { eingang: _e, ...rest } = m;
    return { ...rest, art: "meldung", rolleGewaehlt: true, hinweis: "Als eigene Vormeldung behandelt (von Hand, Fortschreibung)." };
  }
  return m;
}

function kuerzen(text: string): { text: string; hinweis?: string } {
  if (text.length <= MAX_TEXT_ZEICHEN) return { text };
  return { text: text.slice(0, MAX_TEXT_ZEICHEN), hinweis: `Auf ${MAX_TEXT_ZEICHEN.toLocaleString("de-DE")} Zeichen gekürzt.` };
}

export async function dateiLesen(datei: File, profil: Profil): Promise<Material> {
  const name = datei.name;
  const endung = name.toLowerCase().split(".").pop() || "";
  // Größen vor dem Einlesen prüfen
  if ((endung === "pdf" || datei.type === "application/pdf") && datei.size > MAX_PDF_BYTES) throw new Error(`${name}: PDF ist größer als 30 MB.`);
  if (endung !== "pdf" && datei.size > MAX_DATEI_BYTES) throw new Error(`${name}: Datei ist größer als 20 MB.`);
  const daten = await datei.arrayBuffer();
  const hash = await sha256Bytes(daten);
  const basis = { id: neueId(), name, groesse: datei.size, hash };
  if (endung === "pdf" || datei.type === "application/pdf") {
    if (datei.size > MAX_PDF_BYTES) throw new Error(`${name}: PDF ist größer als 30 MB.`);
    return { ...basis, art: "pdf", base64: base64(daten), hinweis: "Wird dem Modell als PDF übergeben." };
  }
  if (endung === "docx") {
    const k = kuerzen(await docxText(daten));
    return { ...basis, art: "docx", ...k };
  }
  const roh = new TextDecoder("utf-8").decode(daten);
  if (endung === "json") {
    let obj: unknown;
    try {
      obj = JSON.parse(roh);
    } catch {
      throw new Error(`${name}: kein gültiges JSON.`);
    }
    const info = eingangsInfo(obj, profil);
    if (istMeldung(obj, profil) && (!info || !info.stelle || istEigeneStelle(info.stelle, profil.manifest))) {
      return {
        ...basis,
        art: "meldung",
        meldung: obj as Meldung,
        text: JSON.stringify(obj, null, 2),
        hinweis: "Als eigene Vormeldung erkannt (Fortschreibung).",
      };
    }
    if (info) {
      const wer = [info.land, info.stelle].filter(Boolean).join(", ");
      const wann = info.zeitpunkt ? `, Stand ${info.zeitpunkt.replace("T", " ")}` : "";
      return {
        ...basis,
        art: "eingang",
        meldung: obj as Meldung,
        eingang: info,
        text: JSON.stringify(obj, null, 2),
        hinweis: `Eingangsmeldung: ${wer}${wann}, ${info.sachverhalte} Sachverhalt${info.sachverhalte === 1 ? "" : "e"}.`,
      };
    }
    return { ...basis, art: "json", ...kuerzen(JSON.stringify(obj, null, 2)) };
  }
  if (["txt", "md", "markdown", "csv", "text"].includes(endung) || datei.type.startsWith("text/")) {
    return { ...basis, art: "text", ...kuerzen(roh) };
  }
  throw new Error(`${name}: Dateityp wird nicht unterstützt (TXT, MD, JSON, DOCX, PDF).`);
}

export function urlsAusText(text: string): { gueltig: string[]; ungueltig: string[] } {
  const gueltig: string[] = [];
  const ungueltig: string[] = [];
  for (const zeile of text
    .split(/\s+/)
    .map((z) => z.trim())
    .filter(Boolean)) {
    try {
      const u = new URL(zeile);
      if (u.protocol === "http:" || u.protocol === "https:") gueltig.push(u.toString());
      else ungueltig.push(zeile);
    } catch {
      ungueltig.push(zeile);
    }
  }
  return { gueltig: [...new Set(gueltig)], ungueltig };
}

/** Attributwert ohne Anführungszeichen und spitze Klammern: ein Dateiname kann die Hülle nicht öffnen oder schließen */
function escapeAttr(s: string) {
  return s.replace(/"/g, "'").replace(/[<>]/g, "");
}

/** Elemente, mit denen die App Material in der Nutzernachricht umhüllt */
export const HUELLEN = ["material", "stichworte", "urls"] as const;

/**
 * Inhalt für eine Hülle: Schließtags der Hüllen im Text werden zu „<\/material“ usw. neutralisiert (seit 0.6.4,
 * TP-2026-W44-29). Ein Eingang mit „</material>“ im Text verließ bis 0.6.3 die Datenhülle; was danach stand, las das
 * Modell wie Text der App. Die Anweisungen der Stufen nennen die Neutralisierung.
 */
export function huellenInhalt(text: string): string {
  return text.replace(new RegExp(`<\\s*/\\s*(${HUELLEN.join("|")})`, "gi"), (_, name: string) => `<\\/${name}`);
}

/**
 * Baut die Inhaltsblöcke der Nutzernachricht. URLs stehen im Nutzertext, damit das
 * Abrufwerkzeug sie verwenden darf (es ruft nur URLs ab, die im Gespräch vorkommen).
 */
export function materialBloecke(material: Material[], urls: string[], stichworte: string): Inhaltsblock[] {
  const bloecke: Inhaltsblock[] = [];
  const teile: string[] = [];
  if (stichworte.trim()) teile.push(`<stichworte>\n${huellenInhalt(stichworte.trim())}\n</stichworte>`);
  if (urls.length) teile.push(`<urls hinweis="Bitte abrufen und auswerten">\n${huellenInhalt(urls.join("\n"))}\n</urls>`);
  for (const m of material) {
    if (m.art === "pdf") continue;
    const art = m.art === "meldung" ? "vormeldung" : m.art === "eingang" ? "eingangsmeldung" : m.art;
    const zusatz = m.eingang
      ? ` stelle="${escapeAttr([m.eingang.land, m.eingang.stelle].filter(Boolean).join(", "))}" meldezeitpunkt="${escapeAttr(m.eingang.zeitpunkt)}"`
      : "";
    teile.push(`<material name="${escapeAttr(m.name)}" art="${art}"${zusatz}>\n${huellenInhalt(m.text || "")}\n</material>`);
  }
  if (teile.length) bloecke.push({ type: "text", text: teile.join("\n\n") });
  for (const m of material) {
    if (m.art === "pdf" && m.base64)
      bloecke.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: m.base64 }, title: m.name });
  }
  return bloecke;
}

/** Kurzbeschreibung des Materials für den Platzhalter {{auftrag.ausgangsquellen}}. */
export function materialUebersicht(material: Material[], urls: string[], stichworte: string): string {
  const t: string[] = [];
  if (stichworte.trim()) t.push("Stichworte der anfragenden Person");
  for (const u of urls) t.push(u);
  for (const m of material)
    t.push(
      m.eingang
        ? `Eingangsmeldung ${[m.eingang.land, m.eingang.stelle].filter(Boolean).join(", ")}${m.eingang.zeitpunkt ? ` (${m.eingang.zeitpunkt.replace("T", " ")})` : ""}`
        : `${m.name} (${m.art === "meldung" ? "Vormeldung" : m.art.toUpperCase()})`,
    );
  return t.length ? t.join("; ") : "keine; eigene Recherche in offenen Quellen";
}

/** Jüngster Meldezeitpunkt der Eingangsmeldungen (JJJJ-MM-TTThh:mm) oder leer. */
export function juengsterEingang(material: Material[]): string {
  return (
    material
      .map((m) => m.eingang?.zeitpunkt || "")
      .filter((z) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(z))
      .map((z) => z.slice(0, 16))
      .sort()
      .pop() || ""
  );
}

export function istVerdichtung(material: Material[]): boolean {
  return material.some((m) => m.art === "eingang");
}

/** true, wenn eine eigene Vormeldung fortgeschrieben wird */
export function hatVormeldung(material: Material[]): boolean {
  return material.some((m) => m.art === "meldung");
}

/** Absender (Land, meldende Stelle) der neuen Meldung und woher er stammt */
export interface Absender {
  land: string;
  stelle: string;
  herkunft: "vormeldung" | "profil";
  /** Name der Vormeldung, aus der der Absender stammt */
  quelle?: string;
  /** Eigene Vormeldungen mit anderem Absender als dem übernommenen */
  abweichend: string[];
  /** Als Vormeldung gewählte Meldungen einer anderen Stelle (Absender bleibt aus dem Profil) */
  fremd: string[];
}

/**
 * Absender der neuen Meldung. Wird eine eigene Vormeldung fortgeschrieben, bleiben deren Land und meldende Stelle
 * erhalten (die jüngste zählt), damit eine Fortschreibung nicht still den Absender wechselt. „Eigen“ heißt: Die
 * meldende Stelle der Vormeldung ist die Stelle des Profils oder einer ihrer hinterlegten Namen. Eine fremde
 * Meldung, die als Vormeldung gewählt wurde, ändert den Absender nicht: Ein KI-Entwurf darf nicht unter dem
 * Absender einer anderen Stelle stehen. Ohne eigene Vormeldung gelten die Angaben des Profils.
 */
export function absenderFuer(material: Material[], profil: Profil): Absender {
  const r = profil.ui.rollen;
  const v = profil.manifest.variablen;
  const profilAbsender: Absender = {
    land: (r.land && v[r.land]) || "",
    stelle: (r.meldende_stelle && v[r.meldende_stelle]) || "",
    herkunft: "profil",
    abweichend: [],
    fremd: [],
  };
  if (!r.meldende_stelle) return profilAbsender;
  const text = (m: Material, rolle: string | undefined) => (rolle ? String(holeWert(m.meldung, rolle) ?? "").trim() : "");
  const vormeldungen = (material || []).filter((m) => m.art === "meldung" && m.meldung);
  const eigene = vormeldungen.filter((m) => istEigeneStelle(text(m, r.meldende_stelle), profil.manifest));
  const fremd = vormeldungen.filter((m) => !eigene.includes(m)).map((m) => m.name);
  if (!eigene.length) return { ...profilAbsender, fremd };
  const zeit = (m: Material) => text(m, r.meldezeitpunkt);
  const juengste = [...eigene].sort((a, b) => zeit(a).localeCompare(zeit(b))).pop()!;
  const land = text(juengste, r.land) || profilAbsender.land;
  const stelle = text(juengste, r.meldende_stelle);
  const abweichend = eigene
    .filter((m) => m !== juengste && ((text(m, r.land) || profilAbsender.land) !== land || text(m, r.meldende_stelle) !== stelle))
    .map((m) => m.name);
  return { land, stelle, herkunft: "vormeldung", quelle: juengste.name, abweichend, fremd };
}

/**
 * Meldezeitpunkt der jüngsten eigenen Vormeldung (JJJJ-MM-TTThh:mm) oder leer. Er ist der Stand, von dem die
 * Fortschreibung ausgeht, nicht der Meldezeitpunkt der neuen Meldung.
 */
export function vormeldungStand(material: Material[], profil: Profil): string {
  const rolle = profil.ui.rollen.meldezeitpunkt;
  if (!rolle) return "";
  return (
    material
      .filter((m) => m.art === "meldung" && m.meldung)
      .map((m) => String(holeWert(m.meldung, rolle) || ""))
      .filter((z) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(z))
      .map((z) => z.slice(0, 16))
      .sort()
      .pop() || ""
  );
}
