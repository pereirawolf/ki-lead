// Rechenhilfe für Kennzahlen aus mehreren Kennzahlen-Bausteinen (seit 0.8.2, UP-2026-W45-05; Paket 5 des
// Umstellungsplans). Deterministisch und profilneutral (Thessa, KSNV); die fachlichen Regeln stehen im Kodierleitfaden
// des Profils (Abschnitt 6, „Kennzahlen aus Kennzahlen-Bausteinen“). Die Rechenhilfe urteilt nicht über die Lage:
// - Gruppen: gleicher Gegenstand, gleiche Einheit, Art und gleicher Datenstand in mehreren Bausteinen;
// - Summe nur bei überschneidungsfreien Räumen (Gebietsschlüssel verschieden, keiner Präfix eines anderen), gezählten
//   oder amtlich gemeldeten Werten ohne Bandbreite; eine Summe mit einem Mindestwert ist ein Mindestwert;
// - ist ein Schlüssel Präfix aller anderen (etwa das Land über seinen Kreisen), gilt dessen Wert statt der Summe
//   (Vorrang der übergeordneten Erhebung);
// - Gegenstände mit Meldequote („11 von 12 Feuerwehren gemeldet“) bleiben je Raum, weil die Quote Teil der Aussage ist
//   (Entscheidung des Herausgebers vom 14.11.2026);
// - Verhältniswerte (Art „verhaeltnis“) und berechnete Werte (Erhebung „berechnet“) nie summieren; Werte verschiedener
//   Beobachtungszeiträume stehen in getrennten Gruppen (seit 0.9.3, SR-2026-W46-05);
// - Bausteine mit einem Land als Raum gelten als erfasster Ausschnitt, Vollständigkeit nicht angegeben (Entscheidung
//   vom 06.11.2026), außer das Format deckt den Raum vollständig ab (raum_vollstaendig, SR-2026-W46-06); die App
//   kennzeichnet den Raum;
// - Einsatzmeldungen je Kennung einmal, gezählt im engsten Raum, in dem sie im Gebiet liegt (im_gebiet true).
// Dazu die Prüfungen nach S2: unzulässige Summen (KENNZAHL_SUMME_UNZULAESSIG), Ausschnitt als landesweiter Wert
// (KENNZAHL_LANDESWEIT) und der Hinweis, Kennzahlen als Beleg zu prüfen (KENNZAHL_BELEG).

import { BAUSTEIN_FORMATE, istAusschnitt, istLandSchluessel, zeitDE, type BausteinInfo } from "./baustein";
import { liegtIn, normSchluessel, ueberlappen } from "./gebiete";
import type { Befund } from "./typen";

/** Baustein mit Dateiname, Angaben aus der Prüfung und Inhalt */
export interface VerdichtungsBaustein {
  name: string;
  info: BausteinInfo;
  daten: Record<string, any>;
}

export const AUSSCHNITT_ZUSATZ = "erfasster Ausschnitt, Vollständigkeit nicht angegeben";

export { istAusschnitt, istLandSchluessel };

/** „Thüringen“ → „Thüringen (erfasster Ausschnitt, Vollständigkeit nicht angegeben)“; schon gekennzeichnet bleibt gleich */
export const ausschnittRaum = (name: string): string => (name.includes(AUSSCHNITT_ZUSATZ) ? name : `${name} (${AUSSCHNITT_ZUSATZ})`);

/** Meldequote im Gegenstand, etwa „(11 von 12 Feuerwehren gemeldet)“ */
export const MELDEQUOTE = /\b\d+\s+von\s+\d+\b/;
/** Klammerteil mit Meldequote; Gruppe 1 ist der Inhalt der Klammer */
const QUOTE_TEIL = /\s*\(([^)]*\b\d+\s+von\s+\d+\b[^)]*)\)/;

const norm = (s: unknown) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
/** Gegenstand ohne Meldequote in Klammern: verbindet „… (7 von 8 …)“ und „… (11 von 12 …)“ für die Prüfung */
const ohneQuote = (s: unknown) => norm(String(s ?? "").replace(new RegExp(QUOTE_TEIL.source, "g"), ""));
const zahlDE = (n: number) => n.toLocaleString("de-DE");
/** Erhebungsarten, die summiert werden dürfen (SOP-LEAD A.3: Hochgerechnetes nie in einer Summe mit Gezähltem) */
const SUMMIERBAR = new Set(["gezaehlt", "amtlich_gemeldet"]);
/** Verhältniswert oder berechneter Wert: nie summierbar (SOP-LEAD A.3; seit 0.9.3, SR-2026-W46-05) */
const nieSummierbar = (art: string, erhebung: string) => art === "verhaeltnis" || erhebung === "berechnet";
/** Beobachtungszeitraum als Text für Gruppenschlüssel und Anzeige; leer ohne Angabe */
const zeitraumSchluessel = (z: unknown): string => {
  const x = z && typeof z === "object" ? (z as Record<string, unknown>) : null;
  return x && typeof x.von === "string" && typeof x.bis === "string" ? `${x.von}/${x.bis}` : "";
};
const zeitraumDE = (s: string) => {
  const [von, bis] = s.split("/");
  return !s ? "" : von === bis ? zeitDE(von) : `${zeitDE(von)}–${zeitDE(bis)}`;
};

export interface RhEintrag {
  /** Kürzel des Bausteins in der Rechenhilfe (B1, B2 …) */
  baustein: string;
  /** Kennzahl-ID im Baustein */
  kennzahl: string;
  raum: string;
  schluessel?: string;
  wert: number | null;
  bandbreite?: { von: number; bis: number };
  mindestwert: boolean;
  erhebung: string;
  /** Wert eines Land-Bausteins für das Land: erfasster Ausschnitt */
  ausschnitt: boolean;
  /** Meldequote aus dem Gegenstand, etwa „11 von 12 Feuerwehren gemeldet“ */
  quote?: string;
}

export type RhErgebnis =
  | { art: "summe"; wert: number; mindestwert: boolean; ausschnitt: boolean }
  | { art: "uebergeordnet"; eintrag: RhEintrag; grund: string }
  | { art: "getrennt"; grund: string };

export interface RhGruppe {
  gegenstand: string;
  einheit: string;
  art: string;
  datenstand: string;
  /** Beobachtungszeitraum „von/bis“ oder leer (seit 0.9.3) */
  zeitraum: string;
  eintraege: RhEintrag[];
  ergebnis: RhErgebnis;
}

export interface RhEinsatz {
  id: string;
  stichwort: string;
  gemeinde: string;
  /** Raum, in dem die Einsatzmeldung gezählt wird (engster Raum mit im_gebiet true); leer, wenn keiner */
  zaehlort: string;
  /** weitere Räume, in deren Bausteinen sie steht, mit „(helfend)“ bei im_gebiet false */
  auch: string[];
}

export interface RhBaustein {
  kuerzel: string;
  name: string;
  app: string;
  raum: string;
  schluessel?: string;
  datenstand: string;
  ausschnitt: boolean;
}

export interface Rechenhilfe {
  bausteine: RhBaustein[];
  /** Räume mit mehr als einem Datenstand */
  mehrereStaende: { raum: string; staende: string[] }[];
  /** Gruppen mit Werten aus mindestens zwei Bausteinen */
  gruppen: RhGruppe[];
  einsatzmeldungen: RhEinsatz[];
}

/** Gebietsschlüssel je Raumname aus allen Bausteinen (für Kennzahlen, deren Raum ein anderer Baustein führt) */
function schluesselJeRaum(bausteine: VerdichtungsBaustein[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const b of bausteine) if (b.info.raum.schluessel) m.set(norm(b.info.raum.name), normSchluessel(b.info.raum.schluessel));
  return m;
}

function eintraegeVon(b: VerdichtungsBaustein, kuerzel: string, schluessel: Map<string, string>): (RhEintrag & { k: any })[] {
  const liste: any[] = Array.isArray(b.daten.kennzahlen) ? b.daten.kennzahlen : [];
  return liste
    .filter((k) => k && typeof k === "object")
    .map((k) => {
      const raum = typeof k.raum === "string" && k.raum.trim() ? k.raum.trim() : b.info.raum.name;
      const eigenerRaum = norm(raum) === norm(b.info.raum.name);
      const s = eigenerRaum ? normSchluessel(b.info.raum.schluessel) || undefined : schluessel.get(norm(raum));
      return {
        k,
        baustein: kuerzel,
        kennzahl: String(k.id ?? ""),
        raum,
        ...(s ? { schluessel: s } : {}),
        wert: typeof k.wert === "number" ? k.wert : null,
        ...(k.bandbreite && typeof k.bandbreite === "object" ? { bandbreite: k.bandbreite } : {}),
        mindestwert: k.mindestwert === true,
        erhebung: String(k.erhebung ?? ""),
        ausschnitt: eigenerRaum && istAusschnitt(b.info),
      };
    });
}

// a liegt in b oder ist b: Präfix des Gebietsschlüssels nach Umrechnung („DE-TH“ → „16“, 12-stelliger
// Regionalschlüssel → Gemeindeschlüssel), seit 0.9.8 aus src/kern/gebiete.ts; bis dahin verglich die Rechenhilfe die
// Schlüssel unverändert, und „DE-TH“ galt nicht als übergeordnet zu „16072“.

function ergebnis(eintraege: RhEintrag[], art = ""): RhErgebnis {
  if (eintraege.some((e) => e.wert === null || e.bandbreite)) return { art: "getrennt", grund: "Wert fehlt oder als Bandbreite angegeben; keine Summe" };
  if (eintraege.some((e) => e.quote)) return { art: "getrennt", grund: "Meldequote je Raum ist Teil der Aussage; keine Summe" };
  if (eintraege.some((e) => !e.schluessel)) return { art: "getrennt", grund: "Raum ohne Gebietsschlüssel, Überschneidung nicht prüfbar; keine Summe" };
  const schl = eintraege.map((e) => e.schluessel!);
  const oben = schl.find((s) => schl.every((t) => liegtIn(t, s)));
  if (oben !== undefined) {
    const kopf = eintraege.filter((e) => e.schluessel === oben);
    if (kopf.some((e) => e.wert !== kopf[0]!.wert)) return { art: "getrennt", grund: "derselbe Raum mit verschiedenen Werten; prüfen" };
    const nurDerselbe = schl.every((s) => s === oben);
    return {
      art: "uebergeordnet",
      eintrag: kopf[0]!,
      grund: nurDerselbe
        ? "derselbe Raum in mehreren Bausteinen; einmal zählen"
        : "für den Gesamtraum gilt die übergeordnete Erhebung; Teilräume nicht hinzuaddieren",
    };
  }
  for (let i = 0; i < schl.length; i++)
    for (let j = i + 1; j < schl.length; j++) if (ueberlappen(schl[i]!, schl[j]!)) return { art: "getrennt", grund: "Räume überschneiden sich; keine Summe" };
  if (eintraege.some((e) => nieSummierbar(art, e.erhebung))) return { art: "getrennt", grund: "Verhältniswerte und berechnete Werte nicht summieren" };
  if (eintraege.some((e) => !SUMMIERBAR.has(e.erhebung)))
    return { art: "getrennt", grund: "geschätzte, hochgerechnete oder prognostizierte Werte nicht summieren" };
  return {
    art: "summe",
    wert: eintraege.reduce((s, e) => s + (e.wert ?? 0), 0),
    mindestwert: eintraege.some((e) => e.mindestwert),
    ausschnitt: eintraege.some((e) => e.ausschnitt),
  };
}

/** Rechenhilfe aus den gültigen Kennzahlen-Bausteinen des Materials (Reihenfolge der Bausteine wie übergeben). */
export function rechenhilfe(bausteine: VerdichtungsBaustein[]): Rechenhilfe {
  const schluessel = schluesselJeRaum(bausteine);
  const kopf: RhBaustein[] = bausteine.map((b, i) => ({
    kuerzel: `B${i + 1}`,
    name: b.name,
    app: b.info.app,
    raum: b.info.raum.name,
    ...(b.info.raum.schluessel ? { schluessel: b.info.raum.schluessel } : {}),
    datenstand: b.info.datenstand,
    ausschnitt: istAusschnitt(b.info),
  }));
  // Räume mit mehreren Datenständen
  const staende = new Map<string, Set<string>>();
  for (const b of kopf) staende.set(b.raum, new Set([...(staende.get(b.raum) ?? []), b.datenstand]));
  const mehrereStaende = [...staende.entries()].filter(([, s]) => s.size > 1).map(([raum, s]) => ({ raum, staende: [...s].sort() }));
  // Gruppen
  const gruppen = new Map<string, { g: Omit<RhGruppe, "ergebnis">; bausteine: Set<string> }>();
  bausteine.forEach((b, i) => {
    for (const e of eintraegeVon(b, kopf[i]!.kuerzel, schluessel)) {
      const datenstand = String(e.k.datenstand ?? b.info.datenstand);
      // Gegenstände mit Meldequote ohne die Quote zusammenstellen, damit alle Räume getrennt erscheinen
      const gegenstand = String(e.k.gegenstand ?? "");
      const quote = QUOTE_TEIL.exec(gegenstand)?.[1];
      const anzeige = quote ? gegenstand.replace(QUOTE_TEIL, "").trim() : gegenstand;
      const zeitraum = zeitraumSchluessel(e.k.beobachtungszeitraum);
      const key = JSON.stringify([norm(anzeige), String(e.k.einheit ?? ""), String(e.k.art ?? ""), datenstand, zeitraum, !!quote]);
      const { k: _k, ...rest } = e;
      const eintrag: RhEintrag = { ...rest, ...(quote ? { quote } : {}) };
      const vorhanden = gruppen.get(key);
      if (vorhanden) {
        vorhanden.g.eintraege.push(eintrag);
        vorhanden.bausteine.add(eintrag.baustein);
      } else
        gruppen.set(key, {
          g: { gegenstand: anzeige, einheit: String(e.k.einheit ?? ""), art: String(e.k.art ?? ""), datenstand, zeitraum, eintraege: [eintrag] },
          bausteine: new Set([eintrag.baustein]),
        });
    }
  });
  const liste: RhGruppe[] = [...gruppen.values()].filter((x) => x.bausteine.size > 1).map((x) => ({ ...x.g, ergebnis: ergebnis(x.g.eintraege, x.g.art) }));
  return { bausteine: kopf, mehrereStaende, gruppen: liste, einsatzmeldungen: einsatzmeldungen(bausteine) };
}

/** Einsatzmeldungen je Kennung einmal; Zählort ist der engste Raum (längster Schlüssel) mit im_gebiet true. */
function einsatzmeldungen(bausteine: VerdichtungsBaustein[]): RhEinsatz[] {
  const je = new Map<string, { em: any; raum: string; schluessel: string; imGebiet: boolean; datenstand: string }[]>();
  for (const b of bausteine)
    for (const em of Array.isArray(b.daten.einsatzmeldungen) ? b.daten.einsatzmeldungen : []) {
      if (!em || typeof em.id !== "string") continue;
      const eintrag = {
        em,
        raum: b.info.raum.name,
        schluessel: normSchluessel(b.info.raum.schluessel),
        imGebiet: em.im_gebiet === true,
        datenstand: b.info.datenstand,
      };
      je.set(em.id, [...(je.get(em.id) ?? []), eintrag]);
    }
  const out: RhEinsatz[] = [];
  for (const [id, liste] of je) {
    const im = liste.filter((x) => x.imGebiet).sort((a, b) => b.schluessel.length - a.schluessel.length || b.datenstand.localeCompare(a.datenstand));
    const ort = im[0];
    const vorlage = (ort ?? [...liste].sort((a, b) => b.datenstand.localeCompare(a.datenstand))[0]!).em;
    const auch = [...new Set(liste.filter((x) => x.raum !== ort?.raum).map((x) => `${x.raum}${x.imGebiet ? "" : " (helfend)"}`))];
    out.push({ id, stichwort: String(vorlage.stichwort ?? ""), gemeinde: String(vorlage.gemeinde?.name ?? ""), zaehlort: ort?.raum ?? "", auch });
  }
  return out;
}

const wertText = (e: { wert: number | null; mindestwert: boolean; bandbreite?: { von: number; bis: number } }) =>
  e.bandbreite
    ? `${zahlDE(e.bandbreite.von)}–${zahlDE(e.bandbreite.bis)}`
    : e.wert === null
      ? "unbekannt"
      : `${e.mindestwert ? "mind. " : ""}${zahlDE(e.wert)}`;

/** Ergebnis einer Gruppe in Worten */
export function ergebnisText(g: RhGruppe): string {
  const r = g.ergebnis;
  if (r.art === "summe")
    return `Summe zulässig: ${r.mindestwert ? "mind. " : ""}${zahlDE(r.wert)} (Summe aus ${g.eintraege.length} Räumen${r.mindestwert ? ", Mindestwert" : ""}${r.ausschnitt ? `, ${AUSSCHNITT_ZUSATZ}` : ""}; als Summe kennzeichnen)`;
  if (r.art === "uebergeordnet")
    return `${r.eintrag.ausschnitt ? ausschnittRaum(r.eintrag.raum) : r.eintrag.raum} ${wertText(r.eintrag)} [${r.eintrag.baustein} ${r.eintrag.kennzahl}] (${r.grund})`;
  return `getrennt je Raum (${r.grund})`;
}

export function gruppeText(g: RhGruppe): string {
  const werte = g.eintraege.map((e) => `${e.raum} ${wertText(e)}${e.quote ? ` (${e.quote})` : ""} [${e.baustein} ${e.kennzahl}]`).join("; ");
  const quote = g.eintraege.some((e) => e.quote) ? " mit Meldequote je Raum" : "";
  const zeitraum = g.zeitraum ? `, Zeitraum ${zeitraumDE(g.zeitraum)}` : "";
  return `„${g.gegenstand}“${quote} (${g.einheit}, ${g.art}${zeitraum}, ${zeitDE(g.datenstand)}): ${werte} → ${ergebnisText(g)}`;
}

/** Textfassung für die KI (Block `<rechenhilfe art="kennzahlen">`) und die Anzeige im Lagebild. */
export function rechenhilfeText(rh: Rechenhilfe): string {
  const z: string[] = [];
  z.push(
    "Rechenhilfe der App, deterministisch aus den Kennzahlen-Bausteinen (Regeln: Kodierleitfaden, Abschnitt 6). Werte unverändert übernehmen; Summen nur, wo hier „Summe zulässig“ steht, und dann als Summe kennzeichnen. Keine Summen über Einheit, Art, Datenstand, Beobachtungszeitraum oder überlappende Räume, nie über Verhältniswerte oder berechnete Werte.",
  );
  z.push("Bausteine:");
  for (const b of rh.bausteine)
    z.push(
      `- ${b.kuerzel}: ${b.raum}${b.schluessel ? ` (${b.schluessel})` : ""}, Datenstand ${zeitDE(b.datenstand)}, ${b.app}${b.ausschnitt ? ` – ${AUSSCHNITT_ZUSATZ}; Werte für ${b.raum} nicht als landesweite Werte ausgeben, Raum als „${ausschnittRaum(b.raum)}“` : ""} (${b.name})`,
    );
  if (rh.mehrereStaende.length)
    z.push(
      `Mehrere Datenstände je Raum (nicht addieren): ${rh.mehrereStaende.map((m) => `${m.raum} (${m.staende.map((s) => zeitDE(s)).join("; ")})`).join("; ")}.`,
    );
  z.push(
    rh.gruppen.length
      ? "Gleicher Gegenstand, gleiche Einheit, Art, gleicher Datenstand und Beobachtungszeitraum in mehreren Bausteinen:"
      : "Kein Gegenstand steht mit gleicher Einheit, Art, gleichem Datenstand und Beobachtungszeitraum in mehreren Bausteinen; jede Kennzahl gilt für sich.",
  );
  for (const g of rh.gruppen) z.push(`- ${gruppeText(g)}`);
  if (rh.einsatzmeldungen.length) {
    z.push(`Einsatzmeldungen (${rh.einsatzmeldungen.length}, je Kennung einmal zählen; Zählort ist der Raum, in dem sie im Gebiet liegt):`);
    for (const e of rh.einsatzmeldungen)
      z.push(
        `- ${e.id}: ${e.stichwort}${e.gemeinde ? ` (${e.gemeinde})` : ""} – ${e.zaehlort ? `gezählt in ${e.zaehlort}` : "in keinem Baustein im Gebiet"}${e.auch.length ? `; auch in ${e.auch.join(", ")}` : ""}`,
      );
  }
  return z.join("\n");
}

/** Rechenhilfe beifügen: bei mindestens zwei Bausteinen oder einem Ausschnitt */
export const rechenhilfeNoetig = (bausteine: VerdichtungsBaustein[]): boolean => bausteine.length > 1 || bausteine.some((b) => istAusschnitt(b.info));

// ---------------------------------------------------------------------------------------------------------------------
// Prüfungen nach S2

interface Teilwert {
  wert: number;
  einheit: string;
  art: string;
  datenstand: string;
  zeitraum: string;
  schluessel?: string;
  quote: boolean;
  erhebung: string;
  teil: string;
}

export interface Summenpruefung {
  /** Summen, die die Regeln zulassen, je Einheit */
  zulaessig: Map<string, Set<number>>;
  /** Einzelwerte der Bausteine je Einheit */
  einzeln: Map<string, Set<number>>;
  /** Unzulässige Summen mit Einheiten, Teilen und Gründen (ohne Werte, die zugleich zulässig oder Einzelwerte sind) */
  unzulaessig: { wert: number; einheiten: string[]; teile: string[]; gruende: string[] }[];
}

const MAX_FAMILIE = 10;

/** Teilmengen (mindestens zwei Elemente) einer Liste; über MAX_FAMILIE nur Paare und die ganze Liste */
function teilmengen<T>(liste: T[]): T[][] {
  const out: T[][] = [];
  if (liste.length <= MAX_FAMILIE) {
    for (let maske = 1; maske < 1 << liste.length; maske++) {
      const t = liste.filter((_, i) => maske & (1 << i));
      if (t.length > 1) out.push(t);
    }
    return out;
  }
  for (let i = 0; i < liste.length; i++) for (let j = i + 1; j < liste.length; j++) out.push([liste[i]!, liste[j]!]);
  out.push(liste);
  return out;
}

/**
 * Summen über Kennzahlen gleichen Gegenstands (Meldequote ausgenommen) aus allen Bausteinen: zulässig nach den Regeln
 * der Rechenhilfe oder unzulässig mit Grund. Summen über verschiedene Gegenstände (etwa „einsatzbereit“ und
 * „eingeschränkt einsatzbereit“ desselben Raums) bleiben außer Betracht.
 */
export function summenpruefung(bausteine: VerdichtungsBaustein[]): Summenpruefung {
  const schluessel = schluesselJeRaum(bausteine);
  const familien = new Map<string, Teilwert[]>();
  const einzeln = new Map<string, Set<number>>();
  bausteine.forEach((b, i) => {
    for (const e of eintraegeVon(b, `B${i + 1}`, schluessel)) {
      if (e.wert === null || e.bandbreite) continue;
      const einheit = String(e.k.einheit ?? "");
      einzeln.set(einheit, new Set([...(einzeln.get(einheit) ?? []), e.wert]));
      const key = ohneQuote(e.k.gegenstand);
      const t: Teilwert = {
        wert: e.wert,
        einheit,
        art: String(e.k.art ?? ""),
        datenstand: String(e.k.datenstand ?? b.info.datenstand),
        zeitraum: zeitraumSchluessel(e.k.beobachtungszeitraum),
        ...(e.schluessel ? { schluessel: e.schluessel } : {}),
        quote: MELDEQUOTE.test(String(e.k.gegenstand ?? "")),
        erhebung: e.erhebung,
        teil: `${b.info.raum.name === e.raum ? e.raum : `${e.raum} (${b.info.raum.name})`} ${e.kennzahl}, ${zeitDE(String(e.k.datenstand ?? b.info.datenstand))}`,
      };
      familien.set(key, [...(familien.get(key) ?? []), t]);
    }
  });
  const zulaessig = new Map<string, Set<number>>();
  const kandidaten: Summenpruefung["unzulaessig"] = [];
  for (const liste of familien.values()) {
    if (liste.length < 2) continue;
    for (const t of teilmengen(liste)) {
      const gruende: string[] = [];
      if (new Set(t.map((x) => x.einheit)).size > 1) gruende.push("verschiedene Einheiten");
      if (new Set(t.map((x) => x.art)).size > 1) gruende.push("verschiedene Arten");
      if (new Set(t.map((x) => x.datenstand)).size > 1) gruende.push("verschiedene Datenstände");
      if (new Set(t.map((x) => x.zeitraum)).size > 1) gruende.push("verschiedene Beobachtungszeiträume");
      if (t.some((x) => nieSummierbar(x.art, x.erhebung))) gruende.push("Verhältniswerte oder berechnete Werte");
      if (t.some((x) => x.quote)) gruende.push("Meldequote je Raum");
      const schl = t.map((x) => x.schluessel);
      if (schl.every((s): s is string => !!s)) {
        let ueber = false;
        for (let i = 0; i < schl.length && !ueber; i++) for (let j = i + 1; j < schl.length; j++) if (ueberlappen(schl[i]!, schl[j]!)) ueber = true;
        if (ueber) gruende.push("überlappende Räume");
      } else if (!gruende.length) continue; // Raum nicht prüfbar: weder zulässig noch sicher unzulässig
      if (t.some((x) => !SUMMIERBAR.has(x.erhebung) && x.erhebung !== "berechnet")) gruende.push("geschätzte oder hochgerechnete Werte");
      const wert = t.reduce((s, x) => s + x.wert, 0);
      if (!gruende.length) {
        const e = t[0]!.einheit;
        zulaessig.set(e, new Set([...(zulaessig.get(e) ?? []), wert]));
      } else kandidaten.push({ wert, einheiten: [...new Set(t.map((x) => x.einheit))], teile: t.map((x) => x.teil), gruende });
    }
  }
  const frei = (wert: number, einheiten: string[]) => einheiten.some((e) => zulaessig.get(e)?.has(wert) || einzeln.get(e)?.has(wert));
  const gesehen = new Set<string>();
  const unzulaessig = kandidaten.filter((k) => {
    const key = `${k.wert}|${k.einheiten.join("|")}`;
    if (frei(k.wert, k.einheiten) || gesehen.has(key)) return false;
    gesehen.add(key);
    return true;
  });
  return { zulaessig, einzeln, unzulaessig };
}

/** Unzulässige Summe zu einem Wert mit Einheit, falls der Wert keine zulässige Summe und kein Einzelwert ist */
export function unzulaessigeSumme(p: Summenpruefung, wert: number, einheit: string): Summenpruefung["unzulaessig"][number] | undefined {
  if (p.zulaessig.get(einheit)?.has(wert) || p.einzeln.get(einheit)?.has(wert)) return undefined;
  return p.unzulaessig.find((k) => k.wert === wert && k.einheiten.includes(einheit));
}

/** Text eines Treffers für Befunde */
export const summeText = (k: Summenpruefung["unzulaessig"][number]) => `${zahlDE(k.wert)} = ${k.teile.join(" + ")} (${k.gruende.join(", ")})`;

const istObjekt = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);
const ohneFiktiv = (s: unknown) => norm(String(s ?? "").replace(/\s*\(FIKTIV\)\s*/g, " "));

/** Belegachsen je Format nach dem Datenmodell der liefernden App; ohne Angabe nur der allgemeine Hinweis */
export function belegachsen(format: string): readonly string[] {
  return BAUSTEIN_FORMATE[format]?.belegachsen ?? [];
}

/**
 * Prüfungen nach S2 bei LEAD-Meldung-v2 (nach der Übernahme aus den Bausteinen):
 * - KENNZAHL_SUMME_UNZULAESSIG: eine Kennzahl ohne Verweis im Modul lead-baustein, die einen Baustein belegt und deren
 *   Wert einer unzulässigen Summe aus Bausteinen entspricht;
 * - KENNZAHL_LANDESWEIT: eine Kennzahl, deren Raum das Land eines Ausschnitt-Bausteins ohne Kennzeichnung nennt;
 * - KENNZAHL_BELEG: Hinweis je Sachverhalt mit übernommenen Kennzahlen, sie als Beleg für die Bewertung zu prüfen
 *   (Belegachsen nach der liefernden App, nur wenn das Profil ein Lagenradar führt); die App setzt keine Stufe.
 * @param modul Name des Fachmoduls (lead-baustein)
 */
export function kennzahlPruefungV2(d: Record<string, any>, bausteine: VerdichtungsBaustein[], modul: string, mitRadar: boolean): Befund[] {
  if (!bausteine.length || !istObjekt(d)) return [];
  const pruefung = summenpruefung(bausteine);
  const quellen: any[] = Array.isArray(d.quellen) ? d.quellen : [];
  const kennung = (herausgeber: unknown, titel: unknown) => `${ohneFiktiv(herausgeber)}|${ohneFiktiv(titel)}`;
  const bausteinKennungen = new Set(bausteine.map((b) => kennung(b.info.quelle.herausgeber, b.info.quelle.titel)));
  const bausteinQuellen = new Set(quellen.filter((q) => istObjekt(q) && bausteinKennungen.has(kennung(q.herausgeber, q.titel))).map((q) => q.id));
  const laender = bausteine.filter((b) => istAusschnitt(b.info));
  const summen: string[] = [];
  const landesweit: string[] = [];
  const beleg: string[] = [];
  const svs: any[] = Array.isArray(d.sachverhalte) ? d.sachverhalte : [];
  svs.forEach((sv, i) => {
    if (!istObjekt(sv)) return;
    const sn = `Sachverhalt ${i + 1}`;
    const eintraege: any[] = Array.isArray(sv.module?.[modul]?.bausteine) ? sv.module[modul].bausteine : [];
    const uebernommen = new Set(eintraege.flatMap((e) => (Array.isArray(e?.kennzahlen) ? e.kennzahlen.map((u: any) => u?.kennzahl) : [])));
    for (const k of Array.isArray(sv.kennzahlen) ? sv.kennzahlen : []) {
      if (!istObjekt(k)) continue;
      const belegt = (Array.isArray(k.quellen) ? k.quellen : []).some((q: unknown) => bausteinQuellen.has(q));
      if (!uebernommen.has(k.id) && belegt && typeof k.wert === "number") {
        const t = unzulaessigeSumme(pruefung, k.wert, String(k.einheit ?? ""));
        if (t) summen.push(`${sn} ${k.id}: ${summeText(t)}`);
      }
      const raum = norm(k.raum);
      const land = laender.find((b) => raum === norm(b.info.raum.name));
      if (land && (belegt || uebernommen.has(k.id))) landesweit.push(`${sn} ${k.id} (${land.info.raum.name}, ${land.name})`);
    }
    const formate = [...new Set(eintraege.filter((e) => Array.isArray(e?.kennzahlen) && e.kennzahlen.length).map((e) => String(e.format ?? "")))];
    if (formate.length) {
      const achsen = mitRadar ? [...new Set(formate.flatMap((f) => belegachsen(f)))] : [];
      beleg.push(
        `${sn}${achsen.length ? ` (mögliche Belegachsen nach ${formate.map((f) => BAUSTEIN_FORMATE[f]?.app ?? f).join(", ")}: ${achsen.join(", ")})` : ""}`,
      );
    }
  });
  const befunde: Befund[] = [];
  if (summen.length)
    befunde.push({
      stufe: "warnung",
      code: "KENNZAHL_SUMME_UNZULAESSIG",
      text: `Kennzahl mit dem Wert einer unzulässigen Summe aus Kennzahlen-Bausteinen (Kodierleitfaden Abschnitt 6, Rechenhilfe); bitte prüfen und Werte getrennt angeben: ${summen.join("; ")}.`,
    });
  if (landesweit.length)
    befunde.push({
      stufe: "warnung",
      code: "KENNZAHL_LANDESWEIT",
      text: `Kennzahl aus einem Ausschnitt-Baustein steht als landesweiter Wert; Raum als „… (${AUSSCHNITT_ZUSATZ})“ kennzeichnen: ${landesweit.join("; ")}.`,
    });
  if (beleg.length)
    befunde.push({
      stufe: "hinweis",
      code: "KENNZAHL_BELEG",
      text: `Kennzahl als Beleg prüfen: Kennzahlen aus Kennzahlen-Bausteinen übernommen in ${beleg.join("; ")}. Beurteilung${mitRadar ? " und Lagenradar" : ""} bleiben eine Entscheidung nach Kodierleitfaden und SOP; die App setzt keine Stufe.`,
    });
  return befunde;
}
