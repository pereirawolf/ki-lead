// Auflösen, Prüfen und Anwenden der Farbschemata. Reine Funktionen bis auf anwenden(); Profilwerte erreichen das
// Dokument nur als geprüfte #RRGGBB-Werte erlaubter Rollen (keine CSS-Texte, keine Selektoren).

import { FARBSCHEMAS } from "./katalog";
import { UI_TOKENS, type AufgeloestesThema, type FarbschemaEintrag, type Modus, type ProfilFarbschema, type UiToken } from "./typen";

export const AUTOMATISCH = "automatisch";
export const PROFIL = "profil";
export const STANDARD_AUSWAHL = AUTOMATISCH;

/** Signalfarben je Modus (unabhängig von Land und Profil) */
export const SEMANTIK: Record<Modus, Record<string, string>> = {
  hell: {
    gering: "#8A6400",
    "gering-zart": "#FBF3D9",
    "auf-gering": "#FFFFFF",
    erheblich: "#A74900",
    "erheblich-zart": "#FDEBDC",
    "auf-erheblich": "#FFFFFF",
    kritisch: "#B3261E",
    "kritisch-zart": "#FBE4E2",
    "auf-kritisch": "#FFFFFF",
    ok: "#2E6B3E",
    "ok-zart": "#E3F1E6",
    "auf-ok": "#FFFFFF",
    "radar-linie": "#1F4F82",
    "radar-ring": "#69737D",
    "radar-flaeche": "rgba(31, 79, 130, 0.12)",
  },
  dunkel: {
    gering: "#E2B53A",
    "gering-zart": "#2C2614",
    "auf-gering": "#121820",
    erheblich: "#F0954A",
    "erheblich-zart": "#33210F",
    "auf-erheblich": "#121820",
    kritisch: "#F07A72",
    "kritisch-zart": "#361615",
    "auf-kritisch": "#121820",
    ok: "#7FC28F",
    "ok-zart": "#15291B",
    "auf-ok": "#121820",
    "radar-linie": "#A4C8F0",
    "radar-ring": "#83909E",
    "radar-flaeche": "rgba(164, 200, 240, 0.12)",
  },
};

/** Alle Variablen, die ein Schema setzen kann; beim Wechsel werden sie vollständig ersetzt oder entfernt */
export const ALLE_VARIABLEN = [...UI_TOKENS, ...Object.keys(SEMANTIK.hell), "band"];

/** Kontrastpaare [Vordergrund, Hintergrund, Mindestwert]; Text 4,5:1, Konturen und Bedienelemente 3:1 */
export const KONTRASTPAARE: [string, string, number][] = [
  ["tinte", "flaeche", 4.5],
  ["tinte", "papier", 4.5],
  ["tinte-leise", "flaeche", 4.5],
  ["tinte-leise", "papier", 4.5],
  ["link", "flaeche", 4.5],
  ["link", "papier", 4.5],
  ["auf-amt", "amt", 4.5],
  ["auf-amt-hover", "amt-tief", 4.5],
  ["auswahl-text", "amt-zart", 4.5],
  ["amt-tief", "amt-zart", 4.5],
  ["amt-tief", "flaeche", 4.5],
  ["eingabe-rand", "flaeche", 3],
  ["auswahl-rand", "flaeche", 3],
  ["fokus", "flaeche", 3],
  ["fokus", "papier", 3],
  ["header-text", "header-hintergrund", 4.5],
  ["lese-farbe", "lese-flaeche", 4.5],
  // Signalfarben als Text und Kontur auf den Arbeitsflächen (Profilfarben dürfen sie nicht unlesbar machen)
  ["kritisch", "flaeche", 4.5],
  ["erheblich", "flaeche", 4.5],
  ["gering", "flaeche", 4.5],
  ["ok", "flaeche", 4.5],
  ["auf-erheblich", "erheblich", 4.5],
];

const HEX = /^#[0-9A-Fa-f]{6}$/;

function kanal(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Relative Leuchtdichte nach WCAG 2.x */
export function leuchtdichte(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * kanal((n >> 16) & 255) + 0.7152 * kanal((n >> 8) & 255) + 0.0722 * kanal(n & 255);
}

/** Kontrastverhältnis nach WCAG 2.x (1 bis 21) */
export function kontrast(a: string, b: string): number {
  const [x, y] = [leuchtdichte(a), leuchtdichte(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export function katalogEintrag(id: string): FarbschemaEintrag | undefined {
  return FARBSCHEMAS.find((s) => s.id === id);
}

/** Bandverlauf aus geprüften Hexwerten (gleich breite Streifen) */
export function bandVerlauf(band: string[]): string {
  const farben = band.filter((f) => HEX.test(f));
  if (!farben.length) return "none";
  const n = farben.length;
  const p = (i: number) => `${((i * 100) / n).toFixed(2)}%`;
  return `linear-gradient(90deg, ${farben.map((f, i) => `${f} ${p(i)} ${p(i + 1)}`).join(", ")})`;
}

/** Kontrastfehler einer vollständigen Farbtabelle */
export function kontrastFehler(tokens: Record<string, string>): string[] {
  const out: string[] = [];
  for (const [v, h, min] of KONTRASTPAARE) {
    const a = tokens[v];
    const b = tokens[h];
    if (!HEX.test(a || "") || !HEX.test(b || "")) continue;
    const k = kontrast(a, b);
    if (k < min) out.push(`„${v}“ auf „${h}“: Kontrast ${k.toFixed(2)}:1, mindestens ${min}:1`);
  }
  return out;
}

/**
 * Prüft ein Profilfarbschema (Struktur, Basis, erlaubte Rollen, #RRGGBB, Kontraste nach Vererbung). Liefert die
 * Fehler; leer heißt verwendbar. Unbekannte Rollen, Signalfarben und CSS-Texte sind nicht erlaubt.
 */
export function profilFarbschemaFehler(f: unknown): string[] {
  if (!f || typeof f !== "object" || Array.isArray(f)) return ["„farbschema“ muss ein Objekt sein."];
  const o = f as Record<string, unknown>;
  const fehler: string[] = [];
  for (const k of Object.keys(o)) if (!["basis", "name", "farben"].includes(k)) fehler.push(`Unbekannte Angabe „${k}“.`);
  if (typeof o.basis !== "string" || !katalogEintrag(o.basis)) fehler.push(`„basis“ muss eine Kennung des Katalogs sein (z. B. „neutral-hell“, „de-th“).`);
  if (o.name !== undefined && (typeof o.name !== "string" || !o.name.trim() || o.name.length > 80))
    fehler.push("„name“ muss ein Text mit 1 bis 80 Zeichen sein.");
  if (o.farben !== undefined) {
    if (!o.farben || typeof o.farben !== "object" || Array.isArray(o.farben)) fehler.push("„farben“ muss ein Objekt sein.");
    else
      for (const [k, v] of Object.entries(o.farben as object)) {
        if (!(UI_TOKENS as readonly string[]).includes(k)) fehler.push(`Farbrolle „${k}“ ist nicht änderbar.`);
        else if (typeof v !== "string" || !HEX.test(v)) fehler.push(`„${k}“ muss eine Farbe im Format #RRGGBB sein.`);
      }
  }
  if (fehler.length) return fehler;
  return kontrastFehler(tokensFuer(o as unknown as ProfilFarbschema));
}

/** Vollständige Farbtabelle eines Profilfarbschemas: Basis, darauf die erlaubten Änderungen, dazu die Signalfarben */
function tokensFuer(p: ProfilFarbschema): Record<string, string> {
  const basis = katalogEintrag(p.basis)!;
  const ui: Record<string, string> = { ...basis.tokens };
  for (const [k, v] of Object.entries(p.farben || {})) if ((UI_TOKENS as readonly string[]).includes(k) && typeof v === "string" && HEX.test(v)) ui[k] = v;
  return { ...ui, ...SEMANTIK[basis.modus] };
}

function ausKatalog(e: FarbschemaEintrag, auswahl: string, quelle: AufgeloestesThema["quelle"], hinweise: string[] = []): AufgeloestesThema {
  return {
    auswahl,
    basis: e.id,
    name: e.name,
    modus: e.modus,
    quelle,
    tokens: { ...e.tokens, ...SEMANTIK[e.modus], band: bandVerlauf(e.band) },
    band: e.band,
    hinweise,
  };
}

function ausProfil(p: ProfilFarbschema, auswahl: string, quelle: "profil" | "lokal"): AufgeloestesThema {
  const basis = katalogEintrag(p.basis)!;
  const tokens = tokensFuer(p);
  const eigeneAkzente = ["marke-akzent-1", "marke-akzent-2", "marke-akzent-3"].some((k) => p.farben?.[k as UiToken]);
  const band = eigeneAkzente ? [tokens["marke-akzent-1"], tokens["marke-akzent-2"], tokens["marke-akzent-3"]] : basis.band;
  return {
    auswahl,
    basis: basis.id,
    name: p.name?.trim() || `Profilfarben (Basis: ${basis.name})`,
    modus: basis.modus,
    quelle,
    tokens: { ...tokens, band: bandVerlauf(band) },
    band,
    hinweise: [],
  };
}

/**
 * Löst die Auswahl auf. Vorrang: festes Schema → bei „profil“ die gültige lokale Anpassung des aktiven Profils →
 * gültiges Farbschema aus profil.json → Ersatz „Neutral · Hell“ mit Hinweis. „automatisch“ setzt keine Farben.
 */
export function aufloesen(auswahl: string, profilSchema?: unknown, lokal?: unknown): AufgeloestesThema {
  if (auswahl !== PROFIL) {
    const e = katalogEintrag(auswahl);
    if (e) return ausKatalog(e, auswahl, "katalog");
    return {
      auswahl: AUTOMATISCH,
      basis: null,
      name: "Automatisch (hell oder dunkel nach System)",
      modus: null,
      quelle: "automatisch",
      tokens: {},
      band: [],
      hinweise: [],
    };
  }
  const hinweise: string[] = [];
  if (lokal !== undefined && lokal !== null) {
    const f = profilFarbschemaFehler(lokal);
    if (!f.length) return ausProfil(lokal as ProfilFarbschema, auswahl, "lokal");
    hinweise.push(`Eigene Farben dieses Profils nicht verwendbar: ${f[0]}`);
  }
  if (profilSchema !== undefined && profilSchema !== null) {
    const f = profilFarbschemaFehler(profilSchema);
    if (!f.length) return { ...ausProfil(profilSchema as ProfilFarbschema, auswahl, "profil"), hinweise };
    hinweise.push(`Farbschema des Profils nicht verwendbar: ${f[0]}`);
  }
  if (!hinweise.length) hinweise.push("Das aktive Profil definiert kein Farbschema; verwendet wird „Neutral · Hell“.");
  return ausKatalog(katalogEintrag("neutral-hell")!, auswahl, "ersatz", hinweise);
}

/** Wendet ein aufgelöstes Thema auf das Dokument an; entfernt dabei alle Werte des vorherigen Schemas. */
export function anwenden(t: AufgeloestesThema, wurzel: HTMLElement = document.documentElement): void {
  for (const v of ALLE_VARIABLEN) wurzel.style.removeProperty(`--${v}`);
  if (t.basis === null || !t.modus) {
    delete wurzel.dataset.farbschema;
    delete wurzel.dataset.farbmodus;
    wurzel.style.removeProperty("color-scheme");
  } else {
    for (const [k, v] of Object.entries(t.tokens)) if (ALLE_VARIABLEN.includes(k)) wurzel.style.setProperty(`--${k}`, v);
    wurzel.dataset.farbschema = t.basis;
    wurzel.dataset.farbmodus = t.modus;
    wurzel.style.setProperty("color-scheme", t.modus === "dunkel" ? "dark" : "light");
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t.tokens.browserleiste || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "#0f1620" : "#1c3d5a"));
}
