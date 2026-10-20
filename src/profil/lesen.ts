// Lesehilfen für die Profilansicht: Anzeigetitel und Versions-Tags, Steckbrief, Lesedokumente des Pakets,
// Auflösung relativer Links und Katalogsuche. Reine Funktionen ohne Oberfläche; Nachweis und Export nutzen
// weiterhin `sopKennung` (src/profil/sop.ts).

import type { Profil, Sop } from "../kern/typen";
import { fachSops, istBaustein, istInhaltsgeruest, VERDICHTUNG_S2 } from "../pipeline/kontext";
import { STANDARD_ANWEISUNG } from "../pipeline/kurzfassung";
import { yamlKopf } from "./sop";

export interface SopAnzeige {
  /** Kennung, z. B. „B08“; fehlt bei Teil A und bei SOPs ohne Kennung */
  kennung?: string;
  /** Kurzname ohne Präfix und ohne Version, z. B. „Stromausfall / Blackout“ */
  name: string;
  /** Inhalt des Tags: Version („v2.0.1“), „ohne Version“ oder bei Teil A „gilt immer“ */
  tag: string;
}

/** Titel und Tag einer SOP für die Oberfläche (eine Version genau einmal, im Tag). */
export function sopAnzeige(s: Sop): SopAnzeige {
  if (s.gemeinsam) return { name: s.titel, tag: "gilt immer" };
  const name = s.titel.replace(/^[A-Z]?\d+\.\s*(?:SOP|Baustein) LEAD:\s*/i, "").trim() || s.titel;
  const kennung = s.nummer ? s.nummer.padStart(2, "0") : undefined;
  return { ...(kennung ? { kennung } : {}), name, tag: s.version ? `v${s.version}` : "ohne Version" };
}

/** Zusammenfassung der Fachabschnitte, z. B. „17 Dach-SOPs · 17 ergänzende Bausteine, davon 17 Inhaltsgerüste“. */
export function sopAnzahl(profil: Profil): string {
  const fach = fachSops(profil);
  if (!fach.length) return "keine";
  const bausteine = fach.filter(istBaustein);
  const dach = fach.length - bausteine.length;
  const geruest = fach.filter(istInhaltsgeruest).length;
  const teile: string[] = [];
  if (dach) teile.push(bausteine.length ? `${dach} Dach-SOP${dach === 1 ? "" : "s"}` : `${dach} SOP${dach === 1 ? "" : "s"}`);
  if (bausteine.length) teile.push(`${bausteine.length} ergänzende${bausteine.length === 1 ? "r" : ""} Baustein${bausteine.length === 1 ? "" : "e"}`);
  return teile.join(" · ") + (geruest ? `, davon ${geruest} Inhaltsgerüst${geruest === 1 ? "" : "e"}` : "");
}

/** Hinweis für einen Leseblock, wenn alle seine Einträge Inhaltsgerüste sind. */
export function gruppenHinweis(sops: Sop[]): string | undefined {
  return sops.length && sops.every(istInhaltsgeruest) ? "Inhaltsgerüste: vor Verwendung konkretisieren" : undefined;
}

export interface Angabe {
  label: string;
  wert: string;
}

function alsText(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).join(", ");
  return v === undefined || v === null ? "" : String(v);
}

/** Steckbrief aus dem YAML-Kopf einer SOP (nur vorhandene Angaben, feste Reihenfolge). */
export function sopSteckbrief(s: Sop): Angabe[] {
  const k = yamlKopf(s.text);
  const zeilen: [string, unknown][] = [
    ["Typ", k.bausteintyp || k.typ],
    ["Lesegruppe", k.lesegruppe],
    ["Ereignisart", k.art_vorschlag ?? k.art_zuordnung],
    ["Hinweis zur Zuordnung", k.art_hinweis],
    ["Anschluss", k.anschluss],
    ["Version", k.version],
    ["Bearbeitungsstand", k.status],
    ["Stand", k.stand],
    ["Nächste Prüfung", k.naechste_pruefung_faellig],
    ["Pflegeverantwortlich", k.pflegeverantwortlich],
    ["Frühere Kennung", k.bisherige_kennung],
  ];
  return zeilen.map(([label, v]) => ({ label, wert: alsText(v).trim() })).filter((z) => z.wert);
}

/** Lesetext einer SOP ohne die erste Überschrift (steht im Aufklapptitel) und ohne den YAML-Kopf (steht im Steckbrief). */
export function sopLesetext(s: Sop): string {
  let t = s.text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  t = t.replace(/^\s*#{1,3}\s+.+\r?\n/, "");
  t = t.replace(/^\s*```ya?ml\r?\n[\s\S]*?\r?\n```\r?\n?/, "");
  return t.trim();
}

export interface Lesedokument {
  pfad: string;
  titel: string;
  gruppe: string;
  /** Text des Dokuments (aus dem Paket bzw. bei Standardfassungen aus der App) */
  text: string;
  /** „paket“: Datei des geladenen Profils; „app“: eingebaute Standardfassung, die die App bei fehlender Datei verwendet */
  quelle: "paket" | "app";
  rolle?: "erfassung" | "verdichtung" | "kurzfassung" | "kodierleitfaden";
  /** kurzer Zwecksatz (nur Arbeitsgrundlagen) */
  zweck?: string;
  /** eigene Fassung und Stand aus dem ersten Absatz nach der Überschrift */
  version?: string;
  stand?: string;
}

/**
 * Eigene Fassung eines Dokuments: erstes „Fassung X“ (optional „vom TT.MM.JJJJ“) im ersten Absatz nach der ersten
 * Überschrift. Später zitierte Fassungen anderer Dokumente zählen nicht.
 */
export function dokumentFassung(text: string): { version?: string; stand?: string } {
  const zeilen = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").split(/\r?\n/);
  const h = zeilen.findIndex((z) => /^#\s+\S/.test(z));
  if (h < 0) return {};
  const absatz: string[] = [];
  for (const z of zeilen.slice(h + 1)) {
    if (!z.trim()) {
      if (absatz.length) break;
      continue;
    }
    if (/^#/.test(z)) break;
    absatz.push(z);
  }
  const m = absatz.join(" ").match(/Fassung\s+(\d+(?:\.\d+)*)(?:\s+vom\s+(\d{2}\.\d{2}\.\d{4}))?/);
  return m ? { version: m[1], ...(m[2] ? { stand: m[2] } : {}) } : {};
}

function dokument(pfad: string, titel: string, gruppe: string, text: string, quelle: "paket" | "app", extra: Partial<Lesedokument> = {}): Lesedokument {
  return { pfad, titel, gruppe, text, quelle, ...(quelle === "paket" ? dokumentFassung(text) : {}), ...extra };
}

const GRUPPE_ARBEIT = "Arbeitsanweisungen und Kodierleitfaden";

/**
 * Die vier Arbeitsgrundlagen in fester Reihenfolge: Erfassung, Verdichtung, Kurzfassung, Kodierleitfaden. Pfade aus
 * dem Manifest, Text aus dem geladenen Paket. Fehlt einem Profil die Verdichtung oder die Kurzfassung (nicht im
 * Manifest oder Datei fehlt), verwendet die App ihre eingebaute Standardfassung; diese erscheint gekennzeichnet.
 */
export function arbeitsgrundlagen(profil: Profil): Lesedokument[] {
  const m = profil.manifest;
  const text = (pfad?: string) => (pfad && typeof profil.dateien[pfad] === "string" ? profil.dateien[pfad] : undefined);
  const out: Lesedokument[] = [];
  const erf = text(m.anweisungen?.erfassung);
  if (erf !== undefined)
    out.push(
      dokument(m.anweisungen!.erfassung!, "Erfassung", GRUPPE_ARBEIT, erf, "paket", {
        rolle: "erfassung",
        zweck: "Meldungsentwurf aus Material und gegebenenfalls Recherche",
      }),
    );
  const ver = text(m.anweisungen?.verdichtung);
  const verZweck = "eigene Meldung aus Eingangsmeldungen für den Referenzraum";
  out.push(
    ver !== undefined
      ? dokument(m.anweisungen!.verdichtung!, "Verdichtung", GRUPPE_ARBEIT, ver, "paket", { rolle: "verdichtung", zweck: verZweck })
      : dokument("app:verdichtung", "Verdichtung", GRUPPE_ARBEIT, VERDICHTUNG_S2, "app", { rolle: "verdichtung", zweck: verZweck }),
  );
  const kurz = text(m.anweisungen?.kurzfassung);
  const kurzZweck = "vorhandene Meldung für die Leitung verdichten";
  out.push(
    kurz !== undefined
      ? dokument(m.anweisungen!.kurzfassung!, "Kurzfassung (Management Summary)", GRUPPE_ARBEIT, kurz, "paket", { rolle: "kurzfassung", zweck: kurzZweck })
      : dokument("app:kurzfassung", "Kurzfassung (Management Summary)", GRUPPE_ARBEIT, STANDARD_ANWEISUNG, "app", { rolle: "kurzfassung", zweck: kurzZweck }),
  );
  const kl = text(m.kodierleitfaden);
  if (kl !== undefined)
    out.push(
      dokument(m.kodierleitfaden!, "Kodierleitfaden", GRUPPE_ARBEIT, kl, "paket", {
        rolle: "kodierleitfaden",
        zweck: "Lagenradar D1–D8, Beurteilung und Tendenz, Quellenkategorien",
      }),
    );
  return out;
}

/**
 * Übrige Lesedokumente des geladenen Pakets in fester Reihenfolge, nur soweit vorhanden: Übersicht und
 * Änderungsverlauf der SOP-Sammlung (`sop/`), Beschreibung und Änderungsverlauf des Profils. Sie dienen nur dem Lesen;
 * `CHANGELOG.md` und `README.md` gehen nicht an die KI.
 */
export function lesedokumente(profil: Profil): Lesedokument[] {
  const kandidaten: [string, string, string][] = [
    ["sop/README.md", "Übersicht", "SOP-Sammlung"],
    ["sop/CHANGELOG.md", "Änderungsverlauf", "SOP-Sammlung"],
    ["README.md", "Beschreibung", "Profil"],
    ["CHANGELOG.md", "Änderungsverlauf", "Profil"],
  ];
  return kandidaten
    .filter(([pfad]) => typeof profil.dateien[pfad] === "string")
    .map(([pfad, titel, gruppe]) => dokument(pfad, titel, gruppe, profil.dateien[pfad], "paket"));
}

export interface InhaltsEintrag {
  ebene: 2 | 3;
  titel: string;
  /** laufende Nummer unter den Überschriften der Ebenen 2 und 3 im gerenderten Text */
  index: number;
}

/** Überschriften der Ebenen 2 und 3 außerhalb von Codeblöcken, in Reihenfolge (für ein Inhaltsverzeichnis). */
export function inhaltsverzeichnis(text: string): InhaltsEintrag[] {
  const out: InhaltsEintrag[] = [];
  let code = false;
  for (const z of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(z)) code = !code;
    if (code) continue;
    const m = z.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (m) out.push({ ebene: m[1].length as 2 | 3, titel: m[2].replace(/[*_`]/g, ""), index: out.length });
  }
  return out;
}

export type LinkZiel =
  { art: "extern"; url: string } | { art: "sop"; id: string } | { art: "dokument"; pfad: string } | { art: "fehlt"; pfad: string } | { art: "ungueltig" };

/** Löst einen relativen Pfad gegen den Ordner der Ausgangsdatei auf; `undefined`, wenn er das Paket verlässt. */
export function pfadAufloesen(von: string, ziel: string): string | undefined {
  const teile = ziel.startsWith("/") ? [] : von.split("/").slice(0, -1);
  for (const t of ziel.replace(/^\//, "").split("/")) {
    if (t === "" || t === ".") continue;
    if (t === "..") {
      if (!teile.length) return undefined;
      teile.pop();
    } else teile.push(t);
  }
  return teile.join("/");
}

/**
 * Ziel eines Links in einem Lesedokument oder einer SOP: externe http(s)-Adresse, eine SOP des Pakets (über Datei
 * oder Anker), ein Lesedokument des Pakets, oder ein Ziel, das nicht im Paket lesbar ist. Andere Schemata
 * (`javascript:`, `data:` …) sind ungültig.
 */
export function linkZiel(href: string, von: string, profil: Profil): LinkZiel {
  const h = href.trim();
  if (/^https?:\/\//i.test(h)) return { art: "extern", url: h };
  if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return { art: "ungueltig" };
  const [pfadTeil, anker] = h.split("#");
  let pfad: string | undefined = von;
  if (pfadTeil) {
    try {
      pfad = pfadAufloesen(von, decodeURIComponent(pfadTeil));
    } catch {
      pfad = pfadAufloesen(von, pfadTeil);
    }
  }
  if (pfad === undefined) return { art: "fehlt", pfad: pfadTeil };
  if (anker) {
    const sop = profil.sops.find((s) => s.id === anker && s.datei === pfad) || (!pfadTeil ? profil.sops.find((s) => s.id === anker) : undefined);
    if (sop) return { art: "sop", id: sop.id };
  }
  const sop = profil.sops.find((s) => s.datei === pfad);
  if (sop) return { art: "sop", id: sop.id };
  if ([...lesedokumente(profil), ...arbeitsgrundlagen(profil)].some((d) => d.quelle === "paket" && d.pfad === pfad)) return { art: "dokument", pfad };
  return { art: "fehlt", pfad };
}

/** Kleinbuchstaben ohne Akzentunterschiede, für die Suche. */
function norm(t: string): string {
  return t.toLocaleLowerCase("de-DE").normalize("NFKD").replace(/\p{M}/gu, "");
}

/**
 * IDs der SOPs (einschließlich Teil A), die zum Suchbegriff passen: Kennung, Kurzname, frühere Kennung und
 * frühere IDs, auf Wunsch auch der Text. Leerer Begriff: alle.
 */
export function sopSuche(profil: Profil, begriff: string, imText = false): Set<string> {
  const q = norm(begriff.trim());
  const alle = profil.sops;
  if (!q) return new Set(alle.map((s) => s.id));
  const treffer = new Set<string>();
  for (const s of alle) {
    const a = sopAnzeige(s);
    const felder = [a.kennung, a.name, s.titel, s.id, s.bisherigeKennung, ...(s.alias || []), ...(imText ? [s.text] : [])].filter(Boolean) as string[];
    if (felder.some((f) => norm(f).includes(q))) treffer.add(s.id);
  }
  return treffer;
}

/** Zulässige Zeichen für DOM-IDs aus Pfaden und Schlüsseln. */
export function domId(...teile: string[]): string {
  return teile
    .join("-")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
