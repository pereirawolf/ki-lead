// Stufe S0: Eingangsmaterial lokal aufbereiten.
// Text (TXT, MD), JSON (Meldung oder sonstiges), DOCX (Text aus word/document.xml), PDF (als Dokument
// an das Modell, das PDFs selbst liest), Stichworte und URLs (Abruf übernimmt das Modell).

import JSZip from "jszip";
import type { Meldung, Profil } from "../kern/typen";
import type { Inhaltsblock } from "../anbieter/typen";

export type MaterialArt = "notiz" | "url" | "text" | "json" | "meldung" | "docx" | "pdf";

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
  hinweis?: string;
}

const MAX_PDF_BYTES = 30 * 1024 * 1024;
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

function kuerzen(text: string): { text: string; hinweis?: string } {
  if (text.length <= MAX_TEXT_ZEICHEN) return { text };
  return { text: text.slice(0, MAX_TEXT_ZEICHEN), hinweis: `Auf ${MAX_TEXT_ZEICHEN.toLocaleString("de-DE")} Zeichen gekürzt.` };
}

export async function dateiLesen(datei: File, profil: Profil): Promise<Material> {
  const daten = await datei.arrayBuffer();
  const hash = await sha256Bytes(daten);
  const name = datei.name;
  const endung = name.toLowerCase().split(".").pop() || "";
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
    if (istMeldung(obj, profil)) {
      return { ...basis, art: "meldung", meldung: obj as Meldung, text: JSON.stringify(obj, null, 2), hinweis: "Als Vormeldung erkannt (Fortschreibung)." };
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

function escapeAttr(s: string) {
  return s.replace(/"/g, "'");
}

/**
 * Baut die Inhaltsblöcke der Nutzernachricht. URLs stehen im Nutzertext, damit das
 * Abrufwerkzeug sie verwenden darf (es ruft nur URLs ab, die im Gespräch vorkommen).
 */
export function materialBloecke(material: Material[], urls: string[], stichworte: string): Inhaltsblock[] {
  const bloecke: Inhaltsblock[] = [];
  const teile: string[] = [];
  if (stichworte.trim()) teile.push(`<stichworte>\n${stichworte.trim()}\n</stichworte>`);
  if (urls.length) teile.push(`<urls hinweis="Bitte abrufen und auswerten">\n${urls.join("\n")}\n</urls>`);
  for (const m of material) {
    if (m.art === "pdf") continue;
    const art = m.art === "meldung" ? "vormeldung" : m.art;
    teile.push(`<material name="${escapeAttr(m.name)}" art="${art}">\n${m.text || ""}\n</material>`);
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
  for (const m of material) t.push(`${m.name} (${m.art === "meldung" ? "Vormeldung" : m.art.toUpperCase()})`);
  return t.length ? t.join("; ") : "keine; eigene Recherche in offenen Quellen";
}
