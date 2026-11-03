// Fälle für die Fallreihe (seit 0.7.2, TP-2026-W44-62, -63): mitgelieferte Bewertungsfälle aus evaluation/faelle/ und
// Fälle aus einem importierten Fallpaket (ZIP, etwa der Kontrollsatz). Reine Logik ohne Vite-Importe, damit Tests und
// Werkzeuge sie direkt nutzen können; die eingebetteten Dateien liefert fallkatalog-daten.ts.

import fallSchema from "../../evaluation/faelle/fall.schema.json";
import { pruefeRoh } from "../kern/validierung";

export const FALL_FORMAT = "ki-lead-evaluationsfall/1";

/** Profil der Fälle ohne Feld „profil“ */
export const BEISPIELPROFIL_ID = "lead.beispiel.koordinierungsstelle";

export interface FallMaterial {
  datei?: string;
  extern?: string;
  sha256?: string;
  rolle?: "eingang" | "material" | "vormeldung" | "meldung";
  hinweis?: string;
}

export interface Fall {
  format: typeof FALL_FORMAT;
  id: string;
  titel: string;
  stand: string;
  fiktiv?: boolean;
  profil?: string;
  variante_von?: string;
  abwandlung?: string;
  auftrag: {
    sachverhalt: string;
    stichworte?: string;
    urls?: string[];
    stichtag?: string;
    meldezeitpunkt?: string;
    prueffrage?: string;
    websuche?: boolean;
    verdichtung?: boolean;
    kurzfassung?: boolean;
    reparatur?: boolean;
  };
  material: FallMaterial[];
  erwartungen: {
    muss: string[];
    darf_nicht?: string[];
    t0?: string;
    referenzraum?: string;
    ereignisarten?: string[];
    radar?: Record<string, unknown>;
  };
}

export type FallArt = "erfassung" | "verdichtung" | "kurzfassung" | "reparatur";

export function fallArt(f: Fall): FallArt {
  const a = f.auftrag;
  return a.kurzfassung ? "kurzfassung" : a.reparatur ? "reparatur" : a.verdichtung ? "verdichtung" : "erfassung";
}

/** Recherche im Auftrag: wie in der App „ja“, bei Verdichtung „nein“, wenn der Fall nichts angibt */
export const fallMitWebsuche = (f: Fall): boolean => f.auftrag.websuche ?? fallArt(f) !== "verdichtung";

/** Inhalt einer Materialdatei: Text (mitgeliefert) oder Bytes (Fallpaket) */
export type DateiInhalt = string | Uint8Array;

export interface KatalogFall {
  fall: Fall;
  quelle: "mitgeliefert" | "paket";
  /** SHA-256 des Fallpakets, aus dem der Fall stammt */
  paket?: string;
  gruppe: string;
  profilId: string;
  art: FallArt;
  websuche: boolean;
  zulaessig: boolean;
  /** Grund, wenn der Fall in der Fallreihe nicht laufen kann */
  grund?: string;
  /** Materialdatei nach dem Pfad aus `datei` */
  lesen: (pfad: string) => DateiInhalt | undefined;
}

/** Befunde der Prüfung gegen fall.schema.json (leer = schemakonform) */
export function fallBefunde(obj: unknown): string[] {
  return pruefeRoh(fallSchema as object, obj).map((f) => `${f.pfad || "/"}: ${f.text}`);
}

/** Gruppe in der Auswahl */
export function fallGruppe(f: Fall, quelle: KatalogFall["quelle"]): string {
  if (quelle === "paket") return "Fallpaket";
  if (f.id.startsWith("pruefstein-")) return "Prüfsteine (reale Lagen, mit Websuche)";
  if (f.id.includes("ilka")) return "Referenzfall Ilka";
  if (f.id.startsWith("zaehlregel-")) return "Zählregeln";
  if (f.id.startsWith("sop-")) return "SOP-Fälle";
  return "Weitere Fälle";
}

/** Reihenfolge der Gruppen in der Auswahl */
export const GRUPPEN = ["Fallpaket", "Referenzfall Ilka", "Prüfsteine (reale Lagen, mit Websuche)", "SOP-Fälle", "Zählregeln", "Weitere Fälle"];

export function katalogEintrag(
  fall: Fall,
  quelle: KatalogFall["quelle"],
  lesen: KatalogFall["lesen"],
  profilBekannt: (id: string) => boolean,
  paket?: { sha256: string; befunde?: string[] },
): KatalogFall {
  const art = fallArt(fall);
  const profilId = fall.profil ?? BEISPIELPROFIL_ID;
  const extern = fall.material.filter((m) => !m.datei);
  const fehlend = fall.material.filter((m) => m.datei && lesen(m.datei) === undefined).map((m) => m.datei!);
  const grund = paket?.befunde?.length
    ? `nicht schemakonform: ${paket.befunde.slice(0, 3).join("; ")}`
    : art === "kurzfassung"
      ? "Management Summary aus fester Meldung: eigene Testart"
      : art === "reparatur"
        ? "Prüffall Reparatur: eigene Testart"
        : extern.length
          ? "Material nur als Verweis (extern), Inhalt nicht in der App"
          : fehlend.length
            ? `Material fehlt: ${fehlend.join(", ")}`
            : !profilBekannt(profilId)
              ? `Profil ${profilId} ist in dieser Ausgabe der App nicht enthalten`
              : undefined;
  return {
    fall,
    quelle,
    ...(paket ? { paket: paket.sha256 } : {}),
    gruppe: fallGruppe(fall, quelle),
    profilId,
    art,
    websuche: fallMitWebsuche(fall),
    zulaessig: !grund,
    ...(grund ? { grund } : {}),
    lesen,
  };
}

/** Mitgelieferte Fälle aus den Falldateien (Pfad → Text), nach ID sortiert; Dateien ohne Fallformat entfallen */
export function faelleAusTexten(texte: Record<string, string>): Fall[] {
  const out: Fall[] = [];
  for (const text of Object.values(texte)) {
    let obj: unknown;
    try {
      obj = JSON.parse(text);
    } catch {
      continue;
    }
    if ((obj as Fall | null)?.format === FALL_FORMAT) out.push(obj as Fall);
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export async function sha256Bytes(daten: Uint8Array | ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", daten as BufferSource);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Importiertes Fallpaket */
export interface Fallpaket {
  name: string;
  sha256: string;
  groesse: number;
  importiert: string;
  faelle: Fall[];
  /** Schemabefunde je Fall-ID */
  schemabefunde: Record<string, string[]>;
  /** Hinweise zum Paket (Dubletten, unlesbare Dateien) */
  befunde: string[];
  dateien: Record<string, Uint8Array>;
}

/**
 * Datei im Paket nach dem Pfad aus `datei`: genau so oder unter einem einzigen Oberordner (ein ZIP, das einen Ordner
 * enthält, z. B. kontrollsatz/evaluation/material/k1.md).
 */
export function dateiImPaket(dateien: Record<string, Uint8Array>, pfad: string): Uint8Array | undefined {
  if (dateien[pfad]) return dateien[pfad];
  const treffer = Object.keys(dateien).find((k) => k.split("/").slice(1).join("/") === pfad);
  return treffer ? dateien[treffer] : undefined;
}

/**
 * Liest ein Fallpaket (ZIP): Fälle sind alle JSON-Dateien mit format „ki-lead-evaluationsfall/1“, Material steht unter
 * dem Pfad aus `datei`. Fälle, die es schon unter den mitgelieferten gibt, oder doppelte IDs im Paket entfallen mit
 * Hinweis. Die Prüfsumme gilt für die ZIP-Datei, wie sie vorliegt.
 */
export async function fallpaketLesen(daten: Uint8Array, name: string, mitgelieferte: Set<string>, jetzt = new Date()): Promise<Fallpaket> {
  const sha256 = await sha256Bytes(daten);
  const { default: JSZip } = await import("jszip");
  let zip: InstanceType<typeof JSZip>;
  try {
    zip = await JSZip.loadAsync(daten);
  } catch {
    throw new Error(`${name}: keine lesbare ZIP-Datei.`);
  }
  const dateien: Record<string, Uint8Array> = {};
  for (const f of Object.values(zip.files)) if (!f.dir && !f.name.startsWith("__MACOSX/")) dateien[f.name] = await f.async("uint8array");
  const faelle: Fall[] = [];
  const schemabefunde: Record<string, string[]> = {};
  const befunde: string[] = [];
  const dekoder = new TextDecoder("utf-8");
  for (const [pfad, inhalt] of Object.entries(dateien).sort(([a], [b]) => a.localeCompare(b))) {
    if (!pfad.toLowerCase().endsWith(".json")) continue;
    let obj: unknown;
    try {
      obj = JSON.parse(dekoder.decode(inhalt));
    } catch {
      continue;
    }
    const f = obj as Fall | null;
    if (f?.format !== FALL_FORMAT) continue;
    if (typeof f.id !== "string" || !f.id) {
      befunde.push(`${pfad}: Fall ohne ID übergangen.`);
      continue;
    }
    if (mitgelieferte.has(f.id)) {
      befunde.push(`${pfad}: Fall ${f.id} gibt es schon unter den mitgelieferten Fällen; übergangen.`);
      continue;
    }
    if (faelle.some((x) => x.id === f.id)) {
      befunde.push(`${pfad}: Fall ${f.id} steht mehrfach im Paket; übergangen.`);
      continue;
    }
    const b = fallBefunde(f);
    if (b.length) schemabefunde[f.id] = b;
    faelle.push({ ...f, material: Array.isArray(f.material) ? f.material : [] });
  }
  if (!faelle.length) befunde.push("Das Paket enthält keinen Fall im Format ki-lead-evaluationsfall/1.");
  return { name, sha256, groesse: daten.byteLength, importiert: jetzt.toISOString(), faelle, schemabefunde, befunde, dateien };
}

/** Katalogeinträge eines Fallpakets */
export function paketEintraege(p: Fallpaket, profilBekannt: (id: string) => boolean): KatalogFall[] {
  return p.faelle.map((f) =>
    katalogEintrag(f, "paket", (pfad) => dateiImPaket(p.dateien, pfad), profilBekannt, { sha256: p.sha256, befunde: p.schemabefunde[f.id] }),
  );
}
