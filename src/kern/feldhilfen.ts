// LEAD-Eingabehilfen für Textfelder eines Sachverhalts (Analysefelder und Bewertungstext): Vorlagen vorhandener
// Satzanfänge und Kennsätze aus der Darstellungsdatei („feldhilfen“), mit offenen Stellen ⟦…⟧ zum Ausfüllen.
// Rein manuell: keine KI, keine neuen Felder, keine Pflicht. Auswahlwerte (Beurteilung, Tendenz) werden nur
// gelesen, nie gesetzt; vorhandener Text wird nie umformuliert, umsortiert oder ersetzt.

import type { Feldhilfe, FeldhilfeVorlage, UiKonfig } from "./typen";

export const FELDHILFEN_FORMAT = "lead-feldhilfen/1";

/** Offene Stelle einer Vorlage: ⟦…⟧ in einer Zeile, 1 bis 160 Zeichen */
export const PLATZHALTER_RE = /⟦[^⟦⟧\n]{1,160}⟧/g;
export const STATUS_PLATZHALTER = "⟦Status auswählen⟧";
export const QUELLEN_PLATZHALTER = "⟦Quellenverweis⟧";

/** Werte, die eine Vorlage lesend übernehmen darf */
export const VORLAGEN_WERTE = ["beurteilung", "tendenz", "t0", "kurzname"] as const;
export type VorlagenWert = (typeof VORLAGEN_WERTE)[number];
const WERT_RE = /\{\{([a-z0-9_.]+)\}\}/g;

/** Offene Stelle, wenn ein gelesener Wert fehlt (nie ein erratener Wert, nie das aktuelle Datum) */
export const FEHLT: Record<VorlagenWert, string> = {
  beurteilung: "⟦Beurteilung⟧",
  tendenz: "⟦Tendenz⟧",
  t0: "⟦t0: Meldezeitpunkt fehlt⟧",
  kurzname: "⟦Kurzname der meldenden Stelle⟧",
};

/** Art des Feldes: Analysefeld oder Bewertungstext */
export type FeldArt = "analyse" | "bewertungstext";

const istText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const istObjekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Felder, für die Eingabehilfen zulässig sind: Rollen sv_analysefelder und sv_bewertung_text */
export function feldhilfeFelder(ui: Pick<UiKonfig, "rollen">): Map<string, FeldArt> {
  const m = new Map<string, FeldArt>();
  for (const f of ui.rollen.sv_analysefelder || []) m.set(f, "analyse");
  if (ui.rollen.sv_bewertung_text) m.set(ui.rollen.sv_bewertung_text, "bewertungstext");
  return m;
}

const VORLAGE_SCHLUESSEL = ["id", "label", "vorlage", "hinweis", "position", "kennsatz", "status_auswahl", "nur_mit_wert"];

/** Prüft die optionale Konfiguration; leere Liste = verwendbar. Fehler deaktivieren nur die Hilfen, nie das Profil. */
export function feldhilfenFehler(a: unknown, ui: Pick<UiKonfig, "rollen" | "kennsaetze">): string[] {
  const f: string[] = [];
  if (!istObjekt(a)) return ["„feldhilfen“ muss ein Objekt sein."];
  if (a.format !== FELDHILFEN_FORMAT) f.push(`„feldhilfen.format“ muss „${FELDHILFEN_FORMAT}“ sein.`);
  for (const k of Object.keys(a)) if (!["format", "felder"].includes(k)) f.push(`„feldhilfen“: unbekannte Angabe „${k}“.`);
  if (!istObjekt(a.felder)) return [...f, "„feldhilfen.felder“ muss ein Objekt sein."];
  const erlaubt = feldhilfeFelder(ui);
  const kennsaetze = ui.kennsaetze || {};
  for (const [pfad, h] of Object.entries(a.felder)) {
    const wo = `„feldhilfen.felder.${pfad}“`;
    if (!erlaubt.has(pfad)) f.push(`${wo}: Feld steht weder in „sv_analysefelder“ noch in „sv_bewertung_text“.`);
    if (!istObjekt(h)) {
      f.push(`${wo} muss ein Objekt sein.`);
      continue;
    }
    for (const k of Object.keys(h)) if (k !== "vorlagen") f.push(`${wo}: unbekannte Angabe „${k}“.`);
    if (!Array.isArray(h.vorlagen) || h.vorlagen.length === 0) {
      f.push(`${wo}.vorlagen muss eine nicht leere Liste sein.`);
      continue;
    }
    const ids = new Set<string>();
    h.vorlagen.forEach((v: unknown, i: number) => {
      const w = `${wo}.vorlagen[${i}]`;
      if (!istObjekt(v) || !istText(v.id) || !istText(v.label) || !istText(v.vorlage)) {
        f.push(`${w} braucht „id“, „label“ und „vorlage“ (Text).`);
        return;
      }
      for (const k of Object.keys(v)) if (!VORLAGE_SCHLUESSEL.includes(k)) f.push(`${w}: unbekannte Angabe „${k}“.`);
      if (ids.has(v.id)) f.push(`${w}: Kennung „${v.id}“ doppelt.`);
      ids.add(v.id);
      const t = v.vorlage;
      if (/[<>]/.test(t)) f.push(`${w}: Vorlagen sind Klartext (keine spitzen Klammern).`);
      const auf = (t.match(/⟦/g) || []).length;
      if (auf !== (t.match(/⟧/g) || []).length || auf !== (t.match(PLATZHALTER_RE) || []).length)
        f.push(`${w}: offene Stellen müssen als ⟦…⟧ mit 1 bis 160 Zeichen in einer Zeile stehen.`);
      const werte = [...t.matchAll(WERT_RE)].map((m) => m[1]);
      if ((t.match(/\{\{|\}\}/g) || []).length !== werte.length * 2)
        f.push(`${w}: Werte stehen als {{name}} ohne Leerzeichen und klein geschrieben (zulässig: ${VORLAGEN_WERTE.join(", ")}).`);
      for (const name of werte)
        if (!(VORLAGEN_WERTE as readonly string[]).includes(name)) f.push(`${w}: unbekannter Wert „{{${name}}}“ (zulässig: ${VORLAGEN_WERTE.join(", ")}).`);
      if (v.hinweis !== undefined && !istText(v.hinweis)) f.push(`${w}.hinweis muss Text sein.`);
      if (v.position !== undefined && !["anfang", "vor_kennsaetzen", "ende"].includes(v.position as string))
        f.push(`${w}.position muss „anfang“, „vor_kennsaetzen“ oder „ende“ sein.`);
      if (v.kennsatz !== undefined) {
        if (!istText(v.kennsatz) || !kennsaetze[v.kennsatz])
          f.push(`${w}.kennsatz muss ein Schlüssel aus „kennsaetze“ sein (${Object.keys(kennsaetze).join(", ") || "keine definiert"}).`);
        // Lagebild, Redaktionscheck und Management Summary werten Kennsätze nur im Bewertungstext aus (SOP-LEAD A.4)
        if (erlaubt.get(pfad) !== "bewertungstext") f.push(`${w}: „kennsatz“ ist nur im Bewertungstext (Rolle „sv_bewertung_text“) zulässig.`);
        if (v.position !== undefined) f.push(`${w}: „kennsatz“ und „position“ schließen sich aus (Kennsätze stehen im Block am Textende).`);
      }
      if (v.status_auswahl !== undefined && !(Array.isArray(v.status_auswahl) && v.status_auswahl.length && v.status_auswahl.every(istText)))
        f.push(`${w}.status_auswahl muss eine nicht leere Liste von Texten sein.`);
      if (v.status_auswahl !== undefined && !t.includes(STATUS_PLATZHALTER)) f.push(`${w}: „status_auswahl“ braucht ${STATUS_PLATZHALTER} in der Vorlage.`);
      if (v.nur_mit_wert !== undefined && v.nur_mit_wert !== "beurteilung" && v.nur_mit_wert !== "tendenz")
        f.push(`${w}.nur_mit_wert muss „beurteilung“ oder „tendenz“ sein.`);
      for (const auswahl of ["beurteilung", "tendenz"] as const) {
        const nutzt = werte.includes(auswahl);
        if (nutzt && v.nur_mit_wert !== auswahl) f.push(`${w}: Vorlage mit {{${auswahl}}} braucht „nur_mit_wert“: „${auswahl}“.`);
        if (!nutzt && v.nur_mit_wert === auswahl) f.push(`${w}: „nur_mit_wert“: „${auswahl}“ ohne {{${auswahl}}} in der Vorlage.`);
      }
    });
  }
  return f;
}

/** Pfad und Art eines Feldes mit Eingabehilfen relativ zum Sachverhalt, oder null */
export function textfeldRelativ(generischerPfad: string, ui: UiKonfig): { rel: string; art: FeldArt } | null {
  const praefix = `${ui.rollen.sachverhalte}[].`;
  if (!generischerPfad.startsWith(praefix)) return null;
  const rel = generischerPfad.slice(praefix.length);
  const art = feldhilfeFelder(ui).get(rel);
  return art ? { rel, art } : null;
}

export function hilfeFuer(ui: UiKonfig, rel: string): Feldhilfe | undefined {
  return ui.feldhilfen?.felder?.[rel];
}

export function offenePlatzhalter(text: unknown): string[] {
  return [...new Set(String(text ?? "").match(PLATZHALTER_RE) || [])];
}

/** Erste offene Stelle ⟦…⟧ in [ab, bis) als [Anfang, Ende] oder null */
export function erstePlatzhalterstelle(text: string, ab = 0, bis = text.length): [number, number] | null {
  const re = new RegExp(PLATZHALTER_RE.source, "g");
  re.lastIndex = ab;
  const m = re.exec(text);
  return m && m.index + m[0].length <= bis ? [m.index, m.index + m[0].length] : null;
}

/** Werte, die die Vorlage liest */
export function vorlagenWerte(v: FeldhilfeVorlage): VorlagenWert[] {
  return [...new Set([...v.vorlage.matchAll(WERT_RE)].map((m) => m[1] as VorlagenWert))];
}

/** Ist die Vorlage im Profil verwendbar? (Kennsatz und gelesene Rollen müssen existieren) */
export function vorlageVerfuegbar(v: FeldhilfeVorlage, ui: UiKonfig): boolean {
  if (v.kennsatz && !ui.kennsaetze?.[v.kennsatz]) return false;
  if (v.nur_mit_wert === "beurteilung" && !ui.rollen.sv_beurteilung) return false;
  if (v.nur_mit_wert === "tendenz" && !ui.rollen.sv_tendenz) return false;
  return true;
}

/** Grund, warum die Vorlage gerade nicht eingefügt werden kann, oder null */
export function vorlageGesperrt(v: FeldhilfeVorlage, werte: Partial<Record<VorlagenWert, string>>): string | null {
  if (v.nur_mit_wert === "beurteilung" && !werte.beurteilung?.trim()) return "Erst eine Beurteilung wählen; die Vorlage übernimmt den gewählten Wert.";
  if (v.nur_mit_wert === "tendenz" && !werte.tendenz?.trim()) return "Erst eine Tendenz wählen; die Vorlage übernimmt den gewählten Wert.";
  return null;
}

/** t0 im Format der Beispielmeldungen: „14.10.2026, 14:00 Uhr“ bzw. „14.10.2026“; sonst leer */
export function t0Text(meldezeitpunkt: unknown): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(meldezeitpunkt ?? "").trim());
  if (!m) return "";
  const tag = `${m[3]}.${m[2]}.${m[1]}`;
  return m[4] ? `${tag}, ${m[4]}:${m[5]} Uhr` : tag;
}

/**
 * Text der Vorlage mit bewusst gewähltem Status bzw. Quellenmarker und lesend übernommenen Werten. Fehlt ein
 * Wert, bleibt eine offene Stelle; bei Kennsätzen steht der Satzanfang aus „kennsaetze“ davor.
 */
export function vorlageFuellen(
  v: FeldhilfeVorlage,
  wahl: { status?: string; quelle?: string } = {},
  werte: Partial<Record<VorlagenWert, string>> = {},
  ui?: Pick<UiKonfig, "kennsaetze">,
): string {
  let t = v.vorlage.replace(WERT_RE, (_, name: VorlagenWert) => werte[name]?.trim() || FEHLT[name] || `⟦${name}⟧`);
  if (wahl.status && v.status_auswahl?.includes(wahl.status)) t = t.split(STATUS_PLATZHALTER).join(wahl.status);
  if (wahl.quelle && /^\[Q\d+\]$/.test(wahl.quelle)) t = t.split(QUELLEN_PLATZHALTER).join(wahl.quelle);
  const prefix = v.kennsatz ? ui?.kennsaetze?.[v.kennsatz] : undefined;
  return prefix ? `${prefix} ${t}` : t;
}

/** Satzanfang einer Vorlage ohne Kennsatz: Text vor der ersten offenen Stelle bzw. dem ersten Wert */
export function satzanfang(v: FeldhilfeVorlage): string {
  return v.vorlage.split(/⟦|\{\{/)[0].trim();
}

const beginntMit = (zeile: string, prefix: string) => zeile.trim().toLowerCase().startsWith(prefix.toLowerCase());
const istKennsatzZeile = (zeile: string, prefixe: string[]) => prefixe.some((p) => beginntMit(zeile, p));

/** Zeilenindex, ab dem nur noch Kennsatzzeilen (und Leerzeilen) folgen, oder -1 */
function kennsatzblockBeginn(zeilen: string[], prefixe: string[]): number {
  let beginn = -1;
  for (let i = zeilen.length - 1; i >= 0; i--) {
    if (!zeilen[i].trim()) continue;
    if (istKennsatzZeile(zeilen[i], prefixe)) beginn = i;
    else break;
  }
  return beginn;
}

/** Hängt einen Absatz an; vorhandener Text bleibt unverändert, nur die trennende Leerzeile wird ergänzt */
function absatzAnfuegen(text: string, neu: string): { text: string; start: number } {
  const trenner = text ? "\n\n" : "";
  return { text: text + trenner + neu, start: text.length + trenner.length };
}

/**
 * Fügt einen Baustein an der vorgesehenen Stelle ein: „anfang“ vor allem anderen, „vor_kennsaetzen“ vor dem
 * Kennsatzblock am Ende, „ende“ als neuen Absatz; Kennsätze als eigene Zeile im Schlussblock in der Reihenfolge
 * der Kennsätze des Profils. Vorhandener Text wird nicht umformuliert oder umsortiert; nur die Leerzeilen um den
 * eingefügten Absatz und nachgestellte Leerzeichen werden vereinheitlicht.
 */
export function bausteinEinfuegen(
  text: string,
  satz: string,
  position: FeldhilfeVorlage["position"] | "kennsatz",
  kennsatzPrefixe: string[] = [],
): { text: string; start: number } {
  const t = String(text || "").replace(/\s+$/, "");
  if (!t.trim()) return { text: satz, start: 0 };
  if (position === "anfang") return { text: `${satz}\n\n${t.replace(/^\s+/, "")}`, start: 0 };
  const zeilen = t.split("\n");
  const block = kennsatzblockBeginn(zeilen, kennsatzPrefixe);
  if (position === "kennsatz") {
    const rang = (zeile: string) => kennsatzPrefixe.findIndex((p) => beginntMit(zeile, p));
    const eigener = rang(satz);
    if (block >= 0 && eigener >= 0) {
      const vor = zeilen.findIndex((z, i) => i >= block && z.trim() && rang(z) > eigener);
      if (vor >= 0) {
        const start = zeilen.slice(0, vor).join("\n").length + (vor > 0 ? 1 : 0);
        return { text: [...zeilen.slice(0, vor), satz, ...zeilen.slice(vor)].join("\n"), start };
      }
    }
    const trenner = block >= 0 ? "\n" : "\n\n";
    return { text: t + trenner + satz, start: t.length + trenner.length };
  }
  if (position === "vor_kennsaetzen" && block > 0) {
    const vorne = zeilen.slice(0, block).join("\n").replace(/\s+$/, "");
    const hinten = zeilen.slice(block).join("\n");
    const neuVorne = vorne ? `${vorne}\n\n${satz}` : satz;
    return { text: `${neuVorne}\n\n${hinten}`, start: neuVorne.length - satz.length };
  }
  if (position === "vor_kennsaetzen" && block === 0) return { text: `${satz}\n\n${t}`, start: 0 };
  return absatzAnfuegen(t, satz);
}

/** Ende der ersten Zeile, die mit dem Satzanfang beginnt, oder null */
export function zeilenendeMit(text: string, prefix: string): number | null {
  if (!prefix) return null;
  let pos = 0;
  for (const z of String(text || "").split("\n")) {
    if (beginntMit(z, prefix)) return pos + z.length;
    pos += z.length + 1;
  }
  return null;
}

/**
 * Steht die Angabe schon im Text? Kennsatz am Zeilenanfang oder Vorlage „anfang“, deren Satzanfang die erste nicht
 * leere Zeile beginnt: Stelle zum Hinspringen. Kennsatz nur im Fließtext: „fliesstext“ (nichts einfügen).
 */
export function vorhandeneStelle(
  text: string,
  v: FeldhilfeVorlage,
  ui: Pick<UiKonfig, "kennsaetze">,
): { art: "zeile"; pos: number } | { art: "fliesstext" } | null {
  const t = String(text || "");
  const prefix = v.kennsatz ? ui.kennsaetze?.[v.kennsatz] : undefined;
  if (prefix) {
    const pos = zeilenendeMit(t, prefix);
    if (pos !== null) return { art: "zeile", pos };
    return t.toLowerCase().includes(prefix.toLowerCase()) ? { art: "fliesstext" } : null;
  }
  if (v.position === "anfang") {
    const anfang = satzanfang(v);
    const erste = t.split("\n").find((z) => z.trim());
    if (anfang && erste && beginntMit(erste, anfang)) return { art: "zeile", pos: zeilenendeMit(t, anfang) ?? 0 };
  }
  return null;
}
