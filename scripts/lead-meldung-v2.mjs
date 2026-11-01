#!/usr/bin/env node
// Werkzeug für das Meldungsformat LEAD-Meldung-v2 (Entwurf, docs/LEAD-MELDUNG-V2.md):
//   schema   – Kernschema und Fachmodule zu einem selbsttragenden Profilschema zusammenstellen
//   migriere – Meldungen nach LEAD-Meldung-v1 oder LEAD-Meldung-Land-v1 nach v2 überführen
//   pruefe   – v2-Meldungen gegen ein Schema (Prüfebene 1) und auf Verweise und Konsistenz (Prüfebene 2) prüfen
//
// Aufruf:
//   node scripts/lead-meldung-v2.mjs schema <zusammenstellung.json> [ziel.schema.json]
//   node scripts/lead-meldung-v2.mjs migriere <v1.json …> --ziel <ordner> [--zeitzone Europe/Berlin] [--ebene Kreis]
//   node scripts/lead-meldung-v2.mjs pruefe <v2.json …> --schema <schema.json>
//
// Die Migration erfindet nichts: Was sie aus Text nicht sicher zuordnen kann, bleibt als Text erhalten und steht als
// Hinweis in entstehung.migration.hinweise. Eine migrierte Meldung ist ein Entwurf zur Durchsicht, keine neue Freigabe.

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA_ID = "LEAD-Meldung-v2";
export const FASSUNG = "2.0";
export const WERKZEUG = "scripts/lead-meldung-v2.mjs 2.0";
const MODUL_BEVS = "lead-bevoelkerungsschutz";

const hier = dirname(fileURLToPath(import.meta.url));
export const FORMATORDNER = resolve(hier, "..", "formate", "lead-meldung-v2");

const leseJson = (pfad) => JSON.parse(readFileSync(pfad, "utf8"));
const kopie = (x) => JSON.parse(JSON.stringify(x));

// ---------------------------------------------------------------------------------------------------------------
// 1. Zusammenstellung: Kern + Module + Einschränkungen des Profils → ein selbsttragendes Schema
// ---------------------------------------------------------------------------------------------------------------

/** Ersetzt interne Verweise "#/$defs/x" durch "#/$defs/<praefix>x". */
function verweiseUmbenennen(knoten, praefix) {
  if (Array.isArray(knoten)) return knoten.map((k) => verweiseUmbenennen(k, praefix));
  if (!knoten || typeof knoten !== "object") return knoten;
  const out = {};
  for (const [k, v] of Object.entries(knoten)) {
    if (k === "$ref" && typeof v === "string" && v.startsWith("#/$defs/")) out[k] = `#/$defs/${praefix}${v.slice(8)}`;
    else out[k] = verweiseUmbenennen(v, praefix);
  }
  return out;
}

/**
 * Stellt ein Profilschema zusammen.
 * @param {object} z Zusammenstellung (Format lead-meldung-v2-zusammenstellung/1)
 * @param {(datei: string) => object} lade lädt eine Datei relativ zum Formatordner
 */
export function stelleSchemaZusammen(z, lade = (d) => leseJson(join(FORMATORDNER, d))) {
  if (z.format !== "lead-meldung-v2-zusammenstellung/1") throw new Error(`Unbekanntes Format der Zusammenstellung: ${z.format}`);
  const kern = lade(z.kern || "kern.schema.json");
  const s = kopie(kern);
  s.$id = z.$id;
  s.title = z.title;
  if (z.description) s.description = z.description;
  const teile = [`Kern ${kern.properties.schema.const} ${z.kern || "kern.schema.json"}`];
  const modulSlot = s.$defs.module;
  const pflicht = [];
  for (const [name, angabe] of Object.entries(z.module || {})) {
    const m = lade(angabe.datei);
    const praefix = `modul_${name.replace(/-/g, "_")}_`;
    const { $schema: _s, $id: _i, title, $defs, ...wurzel } = m;
    for (const [k, v] of Object.entries($defs || {})) s.$defs[praefix + k] = verweiseUmbenennen(v, praefix);
    s.$defs[`modul_${name.replace(/-/g, "_")}`] = { title, ...verweiseUmbenennen(wurzel, praefix) };
    modulSlot.properties[name] = { $ref: `#/$defs/modul_${name.replace(/-/g, "_")}` };
    if (angabe.pflicht) pflicht.push(name);
    teile.push(`Modul ${name} ${m.properties?.fassung?.const ?? ""}`.trim());
  }
  if (pflicht.length) modulSlot.required = pflicht;
  if (z.weitere_module === false) modulSlot.additionalProperties = false;

  const e = z.einschraenkungen || {};
  if (e.absender_gebiete) {
    s.properties.absender.properties.gebiet = kopie(s.$defs.gebiet);
    s.properties.absender.properties.gebiet.properties.name = { enum: e.absender_gebiete };
  }
  if (e.ebenen) s.properties.absender.properties.ebene = { enum: e.ebenen };
  if (e.quellenkategorien) {
    const { pattern: _p, ...kat } = s.$defs.quelle.properties.kategorie;
    s.$defs.quelle.properties.kategorie = { ...kat, enum: e.quellenkategorien };
  }

  s.$comment = `Erzeugt mit ${WERKZEUG} aus ${teile.join(" + ")}. Nicht von Hand ändern, sondern die Zusammenstellung anpassen und neu erzeugen.`;
  const { $schema, $id, title, description, $comment, ...rest } = s;
  return { $schema, $id, title, description, $comment, ...rest };
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Zeit
// ---------------------------------------------------------------------------------------------------------------

function versatzMinuten(ms, zone) {
  const teil = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" })
    .formatToParts(new Date(ms))
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(teil || "");
  return m ? (m[1] === "+" ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

const zweistellig = (n) => String(n).padStart(2, "0");
function versatzText(min) {
  const v = min < 0 ? "-" : "+";
  const a = Math.abs(min);
  return `${v}${zweistellig(Math.floor(a / 60))}:${zweistellig(a % 60)}`;
}

/** Wanduhrzeit „JJJJ-MM-TTThh:mm“ in der Zone → „JJJJ-MM-TTThh:mm+hh:mm“. */
export function mitVersatz(lokal, zone) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(lokal);
  if (!m) return null;
  const wand = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  let utc = wand;
  for (let i = 0; i < 4; i++) {
    const neu = wand - versatzMinuten(utc, zone) * 60000;
    if (neu === utc) break;
    utc = neu;
  }
  return `${lokal}${versatzText(versatzMinuten(utc, zone))}`;
}

/** v1-Zeitangabe ("", Tag oder Wanduhrzeit) → v2 (null, Tag oder Zeitpunkt mit Versatz). */
export function zeitV2(wert, zone) {
  if (typeof wert !== "string" || !wert.trim()) return null;
  const w = wert.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(w)) return w;
  return mitVersatz(w, zone);
}

/** „14.10.2026“ (optional mit Uhrzeit) → v2-Zeitangabe */
function deutschesDatum(tag, monat, jahr, stunde, minute, zone) {
  const d = `${jahr}-${zweistellig(monat)}-${zweistellig(tag)}`;
  if (stunde === undefined || stunde === null || stunde === "") return d;
  return mitVersatz(`${d}T${zweistellig(stunde)}:${zweistellig(minute)}`, zone);
}

const IST_TAG = /^\d{4}-\d{2}-\d{2}$/;

/** Kalendertag „JJJJ-MM-TT“ eines Zeitpunkts mit Versatz in der Zone; null bei ungültiger Angabe oder Zone. */
function tagIn(zeitpunkt, zone) {
  const t = Date.parse(zeitpunkt);
  if (Number.isNaN(t)) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: zone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(t));
  } catch {
    return null;
  }
}

/**
 * Vergleich zweier v2-Zeitangaben nach Abschnitt 1 Nr. 4 des Entwurfs (GK-2026-W44-04): Zeitpunkte nach ihrem absoluten
 * Wert (UTC-Versatz), Kalendertage gegen den Tag eines Zeitpunkts in der Zeitzone der Meldung. Ergebnis -1 (a früher),
 * 0 (gleich), 1 (a später) oder null (nicht entscheidbar: fehlende oder ungültige Angabe, oder Tag und Zeitpunkt
 * desselben Tags – eine Uhrzeit wird nicht erfunden).
 */
export function vergleicheZeit(a, b, zone) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return null;
  const ta = IST_TAG.test(a);
  const tb = IST_TAG.test(b);
  if (!ta && !tb) {
    const x = Date.parse(a);
    const y = Date.parse(b);
    return Number.isNaN(x) || Number.isNaN(y) ? null : Math.sign(x - y);
  }
  const da = ta ? a : tagIn(a, zone);
  const db = tb ? b : tagIn(b, zone);
  if (!da || !db) return null;
  if (da === db) return ta && tb ? 0 : null;
  return da < db ? -1 : 1;
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Migration v1 → v2
// ---------------------------------------------------------------------------------------------------------------

const LAENDER = {
  Bund: "DE",
  "Baden-Württemberg": "DE-BW",
  Bayern: "DE-BY",
  Berlin: "DE-BE",
  Brandenburg: "DE-BB",
  Bremen: "DE-HB",
  Hamburg: "DE-HH",
  Hessen: "DE-HE",
  "Mecklenburg-Vorpommern": "DE-MV",
  Niedersachsen: "DE-NI",
  "Nordrhein-Westfalen": "DE-NW",
  "Rheinland-Pfalz": "DE-RP",
  Saarland: "DE-SL",
  Sachsen: "DE-SN",
  "Sachsen-Anhalt": "DE-ST",
  "Schleswig-Holstein": "DE-SH",
  Thüringen: "DE-TH",
};

const KENNUNG_RE = /^[A-Z0-9]{1,8}(-[A-Z0-9]{1,8}){0,3}-[0-9]{8}-[0-9A-HJKMNP-TV-Z]{4,8}$/;

/** Quellenverweise in einem Text: [Q1], [Q2, Q4], [Q1–Q3] → ["Q1", …] */
export function verweise(text) {
  const out = [];
  for (const m of String(text || "").matchAll(/\[(Q\d+(?:\s*(?:,|–|-|bis)\s*Q?\d+)*)\]/g)) {
    for (const teil of m[1].split(/\s*,\s*/)) {
      const b = /^Q(\d+)\s*(?:–|-|bis)\s*Q?(\d+)$/.exec(teil);
      if (b) for (let i = +b[1]; i <= +b[2]; i++) out.push(`Q${i}`);
      else {
        const e = /^Q?(\d+)$/.exec(teil.trim());
        if (e) out.push(`Q${e[1]}`);
      }
    }
  }
  return [...new Set(out)];
}

const ohneVerweise = (t) =>
  String(t || "")
    .replace(/\s*\[(Q\d+(?:\s*(?:,|–|-|bis)\s*Q?\d+)*)\]/g, "")
    .trim();

function quelleV1(zeile, folgezeilen, zone, hinweise) {
  const kopf = /^\[Q(\d+)\]\s*(?:([A-Z])\s*[–-]\s*)?(.*)$/.exec(zeile);
  const q = { id: `Q${kopf[1]}`, kategorie: kopf[2] || "X", herausgeber: "", titel: "", zugriff: null, zugang: null };
  if (!kopf[2]) hinweise.push(`quellen ${q.id}: keine Quellenkategorie erkennbar, vorläufig „X“ – Kategorie nach Kodierleitfaden setzen`);
  let rest = kopf[3];
  const voll = [rest, ...folgezeilen].join(" ");

  const zugriff = /\[Zugriff:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\]/.exec(voll);
  if (zugriff) q.zugriff = deutschesDatum(zugriff[1], zugriff[2], zugriff[3]);
  const stand = /Datenstand:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/.exec(voll);
  if (stand) q.datenstand = deutschesDatum(stand[1], stand[2], stand[3], stand[4], stand[5], zone);
  const url = /(https?:\/\/[^\s\]]+)/.exec(voll);
  if (url) q.url = url[1].replace(/[.,;)]+$/, "");

  if (/\(Paywall\)/i.test(voll)) q.zugang = "paywall";
  else if (/nicht ausgewertet/i.test(voll)) q.zugang = "nicht_ausgewertet";
  else if (/Eingangsmeldung/i.test(voll)) q.zugang = "eingangsmeldung";
  else if (/\(Eingangsmaterial\)/i.test(voll)) q.zugang = "eingangsmaterial";
  else if (/behördenintern/i.test(voll)) q.zugang = "behoerdenintern";
  else if (q.url) q.zugang = "oeffentlich";

  const hd = /^(.*?)\s*\((\d{1,2})\.(\d{1,2})\.(\d{4})\):\s*(.*)$/.exec(rest);
  if (hd) {
    q.herausgeber = hd[1].trim();
    q.veroeffentlicht = deutschesDatum(hd[2], hd[3], hd[4]);
    rest = hd[5];
  } else {
    const h = /^([^:]{2,120}):\s*(.*)$/.exec(rest);
    if (h) {
      q.herausgeber = h[1].trim();
      rest = h[2];
    } else {
      q.herausgeber = rest.trim();
      rest = "";
    }
  }
  let titel = rest.split(/\s*(?:\.\s*)?Online abrufbar unter:|\s*\[Zugriff:|\s*(?:\.\s*)?Datenstand:/)[0];
  titel = titel
    .replace(/\s*\(Paywall\)/gi, "")
    .replace(/\s*\(Eingangsmaterial\)/gi, "")
    .replace(/\(behördenintern(?:,\s*)?/gi, "(")
    .replace(/\s*\(\)/g, "")
    .replace(/\s*https?:\/\/\S+/g, "")
    .trim()
    .replace(/\.$/, "");
  q.titel = titel;
  if (folgezeilen.length) q.anmerkung = folgezeilen.join("\n");
  if (!q.herausgeber || !q.titel) {
    q.anmerkung = [q.anmerkung, `Ausgangszeile v1: ${zeile}`].filter(Boolean).join("\n");
    hinweise.push(`quellen ${q.id}: Herausgeber oder Titel nicht sicher erkannt – Eintrag prüfen (Ausgangszeile in anmerkung)`);
  }
  return q;
}

export function quellenV1(text, zone, hinweise) {
  const zeilen = String(text || "").split(/\r?\n/);
  const eintraege = [];
  let aktuell = null;
  const ohneKopf = [];
  for (const z of zeilen) {
    if (/^\s*\[Q\d+\]/.test(z)) {
      aktuell = { zeile: z.trim(), folge: [] };
      eintraege.push(aktuell);
    } else if (z.trim()) {
      if (aktuell) aktuell.folge.push(z.trim());
      else ohneKopf.push(z.trim());
    }
  }
  if (ohneKopf.length) hinweise.push(`quellen: ${ohneKopf.length} Zeile(n) ohne [Qn] vor dem ersten Eintrag nicht übernommen: ${ohneKopf.join(" | ")}`);
  const qs = eintraege.map((e) => quelleV1(e.zeile, e.folge, zone, hinweise));
  const ohneZugang = qs.filter((q) => q.zugang === null).map((q) => q.id);
  if (ohneZugang.length) hinweise.push(`quellen ${ohneZugang.join(", ")}: Zugang (öffentlich, behördenintern …) aus v1 nicht ableitbar, steht auf null`);
  const ohneZugriff = qs.filter((q) => q.zugriff === null).map((q) => q.id);
  if (ohneZugriff.length) hinweise.push(`quellen ${ohneZugriff.join(", ")}: kein Zugriffsdatum`);
  return qs;
}

export function zeitstrahlV1(text, zone, hinweise) {
  const zeilen = [];
  for (const roh of String(text || "").split(/\r?\n/)) {
    const z = roh.trim();
    if (!z) continue;
    const m = /^\[Z(\d+)\]\s+(\S+)\s+·\s+(\S+)\s+·\s+(\S+)\s+[–-]\s+(.*?)(?:\s+·\s+aufgenommen\s+(\S+))?$/.exec(z);
    if (!m) {
      hinweise.push(`zeitstrahl: Zeile nicht erkannt und nicht übernommen: ${z}`);
      continue;
    }
    const text5 = m[5];
    /** @type {{id: string, zeit: string | null, typ: string, text: string, quellen: string[], erstmals_gemeldet: string | null, berichtigt?: string}} */
    const zeile = {
      id: `Z${m[1]}`,
      zeit: zeitV2(m[2], zone),
      typ: m[4],
      text: ohneVerweise(text5),
      quellen: verweise(text5),
      erstmals_gemeldet: m[6] ? zeitV2(m[6], zone) : null,
    };
    const ber = /^zu \[(Z\d+)\]/.exec(text5);
    if (ber) zeile.berichtigt = ber[1];
    zeilen.push({ kennung: m[3], zeile });
  }
  return zeilen;
}

function offenGrund(text) {
  if (/Bezugsgegenstand|kein(?:en)? Wirkungsraum|Grundgesamtheit|Beobachtungsbasis|kein Zielzustand benannt/i.test(text)) return "kein_bezugsgegenstand";
  if (/Bandbreite/i.test(text)) return "bandbreite_ueber_stufengrenze";
  if (/kein(?:e|en)? (?:tragfähige[nr]? |belastbare[nr]? |neue )?(?:Beleg|Angabe|Prognose)|nicht belegt|fehlt/i.test(text)) return "kein_beleg";
  return "sonstiges";
}

/** Zerlegt die Radarzeilen in Abschnitte je Achse. */
function radarAbschnitte(zeilen) {
  const out = {};
  const text = zeilen.join(" ");
  const starts = [...text.matchAll(/(?:^|(?<=[.;]\s))D([1-8])\s*(?:=\s*\d|offen|ist\b)/g)];
  starts.forEach((m, i) => {
    const ende = i + 1 < starts.length ? starts[i + 1].index : text.length;
    const key = `d${m[1]}`;
    if (!out[key]) out[key] = text.slice(m.index, ende).trim();
  });
  return out;
}

function radarBegruendung(abschnitt) {
  return ohneVerweise(abschnitt.replace(/^D[1-8]\s*(?:=\s*\d+\s*(?:\(Mindestwert\))?|ist offen|offen|ist)\s*[:,–-]?\s*/, "")).replace(/\s+\./g, ".");
}

const KENNSATZ = {
  neubewertung: "Neubewertung bei:",
  handlungsrelevant: "Handlungsrelevant bis:",
  aenderung: "Änderung zur Vormeldung:",
  abweichung: "Abweichende Bewertung:",
  abschluss: "Abschluss im Lagebild:",
};

function fristenV1(text, zone, hinweise, pfad) {
  const out = [];
  for (const teil of text.split(/;\s*(?=\d{1,2}\.\d{1,2}\.\d{4})/)) {
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,?\s*(\d{1,2}):(\d{2})(?:\s*Uhr)?)?\s*(.*)$/.exec(teil.trim());
    if (!m) {
      hinweise.push(`${pfad}: Kennsatz „Handlungsrelevant bis:“ ohne erkennbares Datum – Text in handlungsbedarf.erlaeuterung übernommen`);
      return null;
    }
    let rest = m[6].replace(/^[–-]\s*/, "");
    let grundlage = "";
    const g = /;?\s*Grundlage:\s*(.*)$/.exec(rest);
    if (g) {
      grundlage = g[1].trim();
      rest = rest.slice(0, g.index);
    }
    let aufgabe = "";
    let adressat = "";
    let bedingung = "";
    const klammer = /^\(([^)]*)\)\s*(.*)$/.exec(rest);
    if (klammer) {
      aufgabe = klammer[1];
      bedingung = klammer[2].replace(/^[–-]\s*/, "");
    } else {
      const stuecke = rest.split(/\s+–\s+/);
      const erstes = stuecke[0] || "";
      const k = erstes.lastIndexOf(", ");
      if (k > 0) {
        aufgabe = erstes.slice(0, k);
        adressat = erstes.slice(k + 2);
      } else aufgabe = erstes;
      bedingung = stuecke.slice(1).join(" – ");
    }
    out.push({
      bis: deutschesDatum(m[1], m[2], m[3], m[4], m[5], zone),
      aufgabe: ohneVerweise(aufgabe).trim(),
      adressat: adressat.trim(),
      bedingung: ohneVerweise(bedingung).trim(),
      grundlage: ohneVerweise(grundlage),
      quellen: verweise(teil),
    });
  }
  if (out.some((f) => !f.adressat)) hinweise.push(`${pfad}: Frist ohne erkennbaren Adressaten – ergänzen`);
  return out;
}

function abweichungV1(text) {
  const ursache = /Ursache:\s*([^.]*)\./.exec(text);
  const klaerend = /Klärend wäre:\s*(.*)$/.exec(text);
  let kern = text;
  if (ursache) kern = text.slice(0, ursache.index);
  else if (klaerend) kern = text.slice(0, klaerend.index);
  const m = /^(.+?)\s+[„"‚'](geringfügig|erheblich|kritisch)[“"‘']\s*[–-]?\s*([^;]*)/.exec(kern.trim());
  const e = {
    stelle: m ? m[1].trim() : "",
    stufe: m ? m[2] : null,
    grund: ohneVerweise(m ? m[3] : kern)
      .trim()
      .replace(/[;.]$/, ""),
    quellen: verweise(text),
  };
  if (ursache) e.ursache = ursache[1].trim();
  if (klaerend) e.klaerend = klaerend[1].trim().replace(/\.$/, "");
  if (m && kern.slice(m.index + m[0].length).trim())
    e.grund = `${e.grund}; ${kern
      .slice(m.index + m[0].length)
      .replace(/^;\s*/, "")
      .trim()}`.replace(/[;.]\s*$/, "");
  return e;
}

function abschlussV1(text) {
  const a = {};
  const ende = /(?:beendet|Ende)\D{0,20}(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(text);
  a.ende = ende ? deutschesDatum(ende[1], ende[2], ende[3]) : null;
  const offen = /offen bleib(?:en|t):?\s*([^;]*)/i.exec(text);
  const nachsorge = /Nachsorge bei:?\s*([^;]*)/i.exec(text);
  a.offene_punkte = offen ? offen[1].trim() : text;
  a.nachsorge = nachsorge ? nachsorge[1].trim().replace(/\.$/, "") : "";
  return a;
}

/** Zerlegt den Bewertungstext v1 in Kernaussage, Beurteilung, Tendenz, Radarbegründungen und Kennsätze. */
export function bewertungV1(sofort, zone, hinweise, pfad) {
  const zeilen = String(sofort?.bewertung_text || "")
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter(Boolean);
  const b = {
    kernaussage: "",
    referenzraum: "",
    beurteilung: { stufe: sofort?.beurteilung || null, begruendung: "" },
    tendenz: { richtung: sofort?.tendenz || null, bezug: "", begruendung: "" },
    neubewertung_bei: [],
  };
  const radar = [];
  const erlaeuterung = [];
  const kenn = {};
  const beginnt = (z, p) => z.toLowerCase().startsWith(p.toLowerCase());
  for (const z of zeilen) {
    const ks = Object.entries(KENNSATZ).find(([, p]) => beginnt(z, p));
    if (ks) {
      (kenn[ks[0]] ||= []).push(z.slice(ks[1].length).trim());
      continue;
    }
    if (beginnt(z, "Kernaussage:")) {
      b.kernaussage = z.slice(12).trim();
      continue;
    }
    if (beginnt(z, "Referenzraum:")) {
      const m = /^Referenzraum:\s*(.*?)(?:\.\s*t0:\s*(.*))?$/i.exec(z);
      b.referenzraum = m[1].trim().replace(/\.$/, "");
      if (m[2]) {
        const nach = m[2].replace(/^[^.]*?Uhr\.?\s*|^\d{1,2}\.\d{1,2}\.\d{4}[^.]*\.\s*/, "").trim();
        if (nach) erlaeuterung.push(nach);
      }
      continue;
    }
    if (/^D[1-8]\s*(?:=|offen|ist\b)/.test(z)) {
      radar.push(z);
      continue;
    }
    if (/^(?:Beurteilung|Bewertung)\s*[„"]/.test(z) || /^Tendenz\s*[„"]/.test(z)) {
      const ti = z.search(/(?:^|\s)Tendenz\s*[„"]/);
      const bTeil = ti > 0 ? z.slice(0, ti).trim() : /^Tendenz/.test(z) ? "" : z;
      const tTeil = ti >= 0 ? z.slice(ti).trim() : "";
      if (bTeil) {
        const m = /^(?:Beurteilung|Bewertung)\s*[„"][^“"]*[“"]\s*:?\s*(.*)$/.exec(bTeil);
        b.beurteilung.begruendung = (m ? m[1] : bTeil).trim();
      }
      if (tTeil) {
        const m = /^Tendenz\s*[„"][^“"]*[“"]\s*(?:\(([^)]*)\))?\s*:?\s*(.*)$/.exec(tTeil);
        b.tendenz.bezug = m?.[1]?.trim() || "";
        b.tendenz.begruendung = (m ? m[2] : tTeil).trim();
      }
      continue;
    }
    erlaeuterung.push(z);
  }
  if (!b.kernaussage) hinweise.push(`${pfad}.bewertung.kernaussage: in v1 keine Zeile „Kernaussage:“ – ergänzen`);
  if (!b.referenzraum) hinweise.push(`${pfad}.bewertung.referenzraum: in v1 keine Zeile „Referenzraum:“ – ergänzen`);
  if (b.beurteilung.stufe && !b.beurteilung.begruendung)
    hinweise.push(`${pfad}.bewertung.beurteilung: Begründung nicht als eigene Zeile erkennbar – aus erlaeuterung übernehmen`);
  if (b.tendenz.richtung && !b.tendenz.bezug) hinweise.push(`${pfad}.bewertung.tendenz: Bezugsraum und Zeitfenster nicht erkannt – ergänzen`);
  if (erlaeuterung.length) b.erlaeuterung = erlaeuterung.join("\n");
  for (const t of kenn.aenderung || []) b.aenderung_zur_vormeldung = [b.aenderung_zur_vormeldung, t].filter(Boolean).join("\n");
  for (const t of kenn.neubewertung || []) for (const i of t.split(/;\s*/)) if (i.trim()) b.neubewertung_bei.push({ indikator: i.trim().replace(/\.$/, "") });
  if (kenn.abweichung) {
    b.abweichende_bewertungen = kenn.abweichung.map(abweichungV1);
    if (b.abweichende_bewertungen.some((a) => !a.stelle)) hinweise.push(`${pfad}.bewertung.abweichende_bewertungen: Stelle und Stufe nicht erkannt – ergänzen`);
  }
  if (kenn.abschluss) b.abschluss = abschlussV1(kenn.abschluss.join("; "));
  return { bewertung: b, radarZeilen: radar, fristText: kenn.handlungsrelevant || [] };
}

function radarV1(werte, radarZeilen, hinweise, pfad) {
  const abschnitte = radarAbschnitte(radarZeilen);
  const out = {};
  const ohneBegruendung = [];
  const sonstige = [];
  for (let i = 1; i <= 8; i++) {
    const k = `d${i}`;
    const wert = werte?.[k];
    const abschnitt = abschnitte[k] || "";
    const achse = {
      stufe: Number.isInteger(wert) ? wert : null,
      status: Number.isInteger(wert) ? (/Mindestwert|Mindestprognose/i.test(abschnitt) ? "mindestwert" : "belegt") : "offen",
      begruendung: abschnitt ? radarBegruendung(abschnitt) : "",
      quellen: verweise(abschnitt),
    };
    if (achse.status === "offen") {
      achse.offen_grund = offenGrund(abschnitt);
      if (achse.offen_grund === "sonstiges") sonstige.push(k.toUpperCase());
    }
    if (!abschnitt) ohneBegruendung.push(k.toUpperCase());
    const zahl = /^D[1-8]\s*=\s*(\d+)/.exec(abschnitt);
    if (zahl && Number(zahl[1]) !== achse.stufe)
      hinweise.push(`${pfad}: ${k.toUpperCase()} im Text = ${zahl[1]}, im Radar = ${achse.stufe ?? "offen"}; Wert aus dem Radar übernommen`);
    out[k] = achse;
  }
  if (ohneBegruendung.length) hinweise.push(`${pfad}: keine Begründung im Bewertungstext für ${ohneBegruendung.join(", ")}`);
  if (sonstige.length) hinweise.push(`${pfad}: Grund der offenen Achse(n) ${sonstige.join(", ")} nicht zuzuordnen („sonstiges“) – nach Prüfreihenfolge setzen`);
  return out;
}

function handlungsbedarfV1(text, fristTexte, zone, hinweise, pfad) {
  const h = { massnahmen: [], empfehlungen: [], fristen: [] };
  const t = String(text || "").trim();
  const MARKE = /\(\d+\)\s|Empfehlung \d+:\s*/;
  const erste = /\(1\)\s|Empfehlung 1:\s*/.exec(t);
  let vorText = t;
  if (erste) {
    vorText = t
      .slice(0, erste.index)
      .replace(/\s*(?:Prüf- und Abstimmungsbedarf|Handlungsempfehlungen|Empfehlungen):\s*$/, "")
      .trim();
    const stuecke = t
      .slice(erste.index)
      .split(new RegExp(`\\s*(?:${MARKE.source})\\s*`))
      .map((x) => x.trim())
      .filter(Boolean);
    stuecke.forEach((st, i) => {
      const a = /^([^:.]{2,80}):\s*(.*)$/s.exec(st);
      h.empfehlungen.push({
        id: `E${i + 1}`,
        adressat: a ? a[1].trim() : "",
        auftrag: ohneVerweise(a ? a[2] : st).trim(),
        termin: null,
        quellen: verweise(st),
      });
    });
    hinweise.push(
      `${pfad}.handlungsbedarf.empfehlungen: ${h.empfehlungen.length} Empfehlung(en) aus dem Fließtext übernommen – Adressat, Termin oder Bedingung prüfen${h.empfehlungen.some((e) => !e.adressat) ? " (Adressat teils nicht erkannt)" : ""}`,
    );
  }
  if (vorText) {
    h.erlaeuterung = vorText;
    hinweise.push(
      `${pfad}.handlungsbedarf.massnahmen: bestehende Maßnahmen stehen noch als Text in erlaeuterung – mit Status nach SOP-LEAD A.4 strukturiert erfassen`,
    );
  }
  let fNr = 0;
  for (const ft of fristTexte) {
    const fristen = fristenV1(ft, zone, hinweise, `${pfad}.handlungsbedarf.fristen`);
    if (!fristen) {
      h.erlaeuterung = [h.erlaeuterung, `${KENNSATZ.handlungsrelevant} ${ft}`].filter(Boolean).join("\n");
      continue;
    }
    for (const f of fristen) h.fristen.push({ id: `F${++fNr}`, ...f });
  }
  return h;
}

function regelwerkV1(e) {
  const sop = (e.sop || []).map((s) => {
    const neu = /^(?:SOP-LEAD\s+)?([BC]\d{2})\s*(.*?)\s*(?:v(\d+(?:\.\d+)*))?$/.exec(s);
    if (neu) return { kennung: neu[1], ...(neu[3] ? { fassung: neu[3] } : {}), ...(neu[2] ? { bezeichnung: neu[2] } : {}) };
    const alt = /^SOP-LEAD\s+(\d{2})\s+(.*?)\s*(?:v(\d+(?:\.\d+)*))?$/.exec(s);
    if (alt) return { kennung: `B${alt[1]}`, ...(alt[3] ? { fassung: alt[3] } : {}), bezeichnung: alt[2] };
    return { kennung: s };
  });
  const r = {};
  if (sop.length) r.sop = sop;
  if (e.kodierleitfaden) r.kodierleitfaden = e.kodierleitfaden;
  return r;
}

function entstehungV1(e, zone, hinweise) {
  if (!e) {
    hinweise.push("entstehung: in v1 nicht angegeben, als „manuell“ übernommen – prüfen");
    return { verfahren: "manuell", erstellt: null };
  }
  const out = { verfahren: e.verfahren === "KI-Entwurf" ? "KI-Entwurf" : "manuell", erstellt: zeitV2(e.erstellt, zone) };
  const w = /^(KI-LEAD)\s+(\S+)\s+·\s+Profil\s+(\S+)\s+(\S+)\s+·\s+Lauf\s+(\S+)$/.exec(e.werkzeug || "");
  if (w) {
    out.werkzeug = { name: w[1], version: w[2] };
    out.profil = { id: w[3], version: w[4] };
    out.lauf_id = w[5];
  } else if (e.werkzeug) out.anmerkung = e.werkzeug;
  if (e.modell) out.modelle = [{ modell: e.modell }];
  const r = regelwerkV1(e);
  if (Object.keys(r).length) out.regelwerk = r;
  if (e.erstellt && !out.erstellt) hinweise.push(`entstehung.erstellt: „${e.erstellt}“ nicht als Zeitpunkt lesbar`);
  return out;
}

function zeichnungV1(z) {
  if (!z || !String(z.name || "").trim()) return undefined;
  const out = { name: z.name.trim(), zeitpunkt: z.datum || null };
  if (z.hz) out.hz = z.hz;
  return out;
}

/**
 * Überführt eine Meldung nach LEAD-Meldung-v1 oder LEAD-Meldung-Land-v1 in LEAD-Meldung-v2.
 * @param {object} v1
 * @param {{zeitzone?: string, ebene?: string, meldungId?: () => string, jetzt?: () => Date}} [opt]
 * @returns {{ meldung: any, hinweise: string[] }}
 */
export function migriereV1(v1, opt = {}) {
  const zone = opt.zeitzone || "Europe/Berlin";
  const hinweise = [];
  const herkunft = v1?.schema;
  if (herkunft !== "LEAD-Meldung-v1" && herkunft !== "LEAD-Meldung-Land-v1") throw new Error(`Nicht migrierbar: Schemakennung „${herkunft}“`);
  const gebietName = (herkunft === "LEAD-Meldung-Land-v1" ? v1.kreis : v1.land) || "";
  let ebene = opt.ebene;
  if (!ebene) {
    if (gebietName === "Bund") ebene = "Bund";
    else if (herkunft === "LEAD-Meldung-Land-v1") ebene = LAENDER[gebietName] ? "Land" : "Kreis";
    else ebene = "Land";
  }
  const gebiet = { name: gebietName };
  if (LAENDER[gebietName]) gebiet.schluessel = LAENDER[gebietName];
  else if (gebietName) hinweise.push(`absender.gebiet: kein Schlüssel für „${gebietName}“ hinterlegt – amtlichen Schlüssel ergänzen`);

  const quellen = quellenV1(v1.quellen, zone, hinweise);
  const zs = zeitstrahlV1(v1.zeitstrahl, zone, hinweise);
  const svs = (v1.sachverhalte || []).map((s, i) => {
    const pfad = `sachverhalte[${i}]`;
    let kennung = s.kennung || "";
    if (kennung && !KENNUNG_RE.test(kennung) && !/^NEU-\d+$/.test(kennung)) {
      hinweise.push(`${pfad}.kennung: „${kennung}“ ungültig, geleert`);
      kennung = "";
    }
    const { bewertung, radarZeilen, fristText } = bewertungV1(s.sofort, zone, hinweise, pfad);
    const sv = {
      kennung,
      bezeichnung: s.bezeichnung || "",
      eintritt: s.eintritt ? { zeit: zeitV2(s.eintritt, zone), genauigkeit: "belegt" } : { zeit: null, genauigkeit: "unbekannt" },
      raum: { beschreibung: s.ort || "", gebiete: [] },
      analyse: {
        lage_ereignis: s.analyse?.lage_ereignis || "",
        risiken_auswirkungen: s.analyse?.risiken_auswirkungen || "",
        abhaengigkeiten_interdependenzen: s.analyse?.abhaengigkeiten_interdependenzen || "",
      },
      bewertung,
      handlungsbedarf: handlungsbedarfV1(s.analyse?.massnahmen_empfehlungen, fristText, zone, hinweise, pfad),
      kennzahlen: [],
      zeitstrahl: [],
      module: {
        [MODUL_BEVS]: {
          fassung: "1.0",
          ereignisarten: s.art || [],
          lagenradar: radarV1(s.sofort?.lagenradar, radarZeilen, hinweise, pfad),
        },
      },
    };
    if (Array.isArray(s.bezug) && s.bezug.length) sv.bezug = s.bezug.filter((k) => KENNUNG_RE.test(k)).map((k) => ({ kennung: k }));
    if (sv.bezug?.length) hinweise.push(`${pfad}.bezug: Art des Bezugs (verdichtung, teilung, zusammenfuehrung) und meldung_id der Ausgangsmeldung ergänzen`);
    return sv;
  });
  for (const { kennung, zeile } of zs) {
    const ziel = svs.find((s) => s.kennung === kennung);
    if (ziel) ziel.zeitstrahl.push(zeile);
    else hinweise.push(`zeitstrahl ${zeile.id}: Kennung „${kennung}“ gehört zu keinem Sachverhalt der Meldung; Zeile nicht übernommen`);
  }
  if (svs.length) hinweise.push("sachverhalte[*].raum.gebiete: betroffene Gebiete stehen nur als Text in raum.beschreibung – Gebiete mit Schlüssel ergänzen");
  if (svs.length) hinweise.push("sachverhalte[*].kennzahlen: entscheidungsrelevante Zahlen stehen nur im Text – bei Bedarf als Kennzahlen erfassen");
  if (svs.some((s) => s.eintritt.genauigkeit === "belegt"))
    hinweise.push("sachverhalte[*].eintritt.genauigkeit: aus v1 als „belegt“ übernommen (Regel v1: nur belegter Beginn) – prüfen");

  const freigegeben = zeichnungV1(v1.freigabe?.freigabe);
  let status = v1._status === "final" ? "freigegeben" : "entwurf";
  if (status === "freigegeben" && !freigegeben?.zeitpunkt) {
    status = "zur_freigabe";
    hinweise.push(`status: v1 „final“ ohne ${freigegeben ? "Datum der" : ""} Zeichnung der Freigabe – als „zur_freigabe“ übernommen`.replace("  ", " "));
  }
  const versand = v1.freigabe?.versand;
  if (versand && String(versand.name || "").trim())
    hinweise.push(
      `freigabe: Versandvermerk aus v1 nicht übernommen (Versand ist in v2 ein eigenes Protokoll): ${versand.name}, ${versand.datum || "ohne Datum"}${versand.hz ? `, ${versand.hz}` : ""}`,
    );
  const freigabe = {};
  const erfasst = zeichnungV1(v1.freigabe?.erfassung);
  if (erfasst) freigabe.erfasst = erfasst;
  if (freigegeben) freigabe.freigegeben = freigegeben;

  const jetzt = (opt.jetzt || (() => new Date()))();
  const lokal = new Intl.DateTimeFormat("sv-SE", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(jetzt)
    .replace(" ", "T");
  const entstehung = entstehungV1(v1._entstehung, zone, hinweise);

  const meldung = {
    schema: SCHEMA_ID,
    fassung: FASSUNG,
    meldung_id: (opt.meldungId || randomUUID)(),
    status,
    absender: { stelle: v1.meldende_stelle || "", ebene, gebiet },
    meldezeitpunkt: zeitV2(v1.meldezeitpunkt, zone),
    zeitzone: zone,
    meldezeitraum: { von: zeitV2(v1.meldezeitraum?.von, zone), bis: zeitV2(v1.meldezeitraum?.bis, zone) },
    quellen,
    sachverhalte: svs,
    freigabe,
    entstehung: { ...entstehung, migration: { von: herkunft, am: mitVersatz(lokal, zone), werkzeug: WERKZEUG, hinweise } },
  };
  return { meldung, hinweise };
}

// ---------------------------------------------------------------------------------------------------------------
// 4. Prüfebene 2: Verweise und Konsistenz
// ---------------------------------------------------------------------------------------------------------------

function texteMitPfad(wert, pfad, out) {
  if (typeof wert === "string") out.push([pfad, wert]);
  else if (Array.isArray(wert)) wert.forEach((v, i) => texteMitPfad(v, `${pfad}[${i}]`, out));
  else if (wert && typeof wert === "object") for (const [k, v] of Object.entries(wert)) texteMitPfad(v, pfad ? `${pfad}.${k}` : k, out);
  return out;
}

/**
 * Prüft, was ein JSON-Schema nicht ausdrücken kann.
 * @returns {{stufe: "fehler"|"hinweis", pfad: string, text: string}[]}
 */
export function pruefeReferenzen(m) {
  const b = [];
  const fehler = (pfad, text) => b.push({ stufe: "fehler", pfad, text });
  const hinweis = (pfad, text) => b.push({ stufe: "hinweis", pfad, text });
  const quellIds = new Set();
  (m.quellen || []).forEach((q, i) => {
    if (quellIds.has(q.id)) fehler(`quellen[${i}].id`, `doppelte Quellen-ID ${q.id}`);
    quellIds.add(q.id);
  });
  const zitiert = new Set();
  const pruefeIds = (ids, pfad) => {
    for (const id of ids || []) {
      zitiert.add(id);
      if (!quellIds.has(id)) fehler(pfad, `${id} steht nicht im Quellenverzeichnis`);
    }
  };
  (m.quellen || []).forEach((q, i) => {
    for (const u of q.ursprung || []) {
      if (u === q.id) fehler(`quellen[${i}].ursprung`, "Quelle verweist auf sich selbst");
      else if (!quellIds.has(u)) fehler(`quellen[${i}].ursprung`, `${u} steht nicht im Quellenverzeichnis`);
    }
  });

  const t0 = m.meldezeitpunkt;
  const zone = m.zeitzone;
  // Zeitvergleiche nach der Zeitsemantik (GK-2026-W44-04): absolute Zeitpunkte, Tage in der Zone der Meldung
  const nachT0 = (z) => vergleicheZeit(z, t0, zone) === 1;

  if (vergleicheZeit(m.meldezeitraum?.von, m.meldezeitraum?.bis, zone) === 1) fehler("meldezeitraum", "von liegt nach bis");
  // Datenstand einer Quelle wie der einer Kennzahl nicht nach t0 (GK-2026-W44-03); unbekannt (null) bleibt zulässig
  (m.quellen || []).forEach((q, i) => {
    if (q.datenstand && nachT0(q.datenstand)) fehler(`quellen[${i}].datenstand`, "Datenstand nach dem Meldezeitpunkt");
  });

  const kennungen = new Set();
  const zeilenIds = new Set();
  const vollst = m.status === "zur_freigabe" || m.status === "freigegeben";
  (m.sachverhalte || []).forEach((s, i) => {
    const p = `sachverhalte[${i}]`;
    if (s.kennung) {
      if (kennungen.has(s.kennung)) fehler(`${p}.kennung`, `Kennung ${s.kennung} doppelt`);
      kennungen.add(s.kennung);
    }
    for (const [pfad, text] of texteMitPfad(s, p, [])) pruefeIds(verweise(text), pfad);
    const lokal = (liste, name) => {
      const ids = new Set();
      (liste || []).forEach((x, j) => {
        if (ids.has(x.id)) fehler(`${p}.${name}[${j}].id`, `doppelte ID ${x.id}`);
        ids.add(x.id);
        pruefeIds(x.quellen, `${p}.${name}[${j}].quellen`);
      });
      return ids;
    };
    lokal(s.handlungsbedarf?.massnahmen, "handlungsbedarf.massnahmen");
    const empf = lokal(s.handlungsbedarf?.empfehlungen, "handlungsbedarf.empfehlungen");
    lokal(s.handlungsbedarf?.fristen, "handlungsbedarf.fristen");
    (s.handlungsbedarf?.fristen || []).forEach((f, j) => {
      if (f.empfehlung && !empf.has(f.empfehlung)) fehler(`${p}.handlungsbedarf.fristen[${j}].empfehlung`, `${f.empfehlung} gibt es nicht`);
    });
    const kz = lokal(s.kennzahlen, "kennzahlen");
    (s.kennzahlen || []).forEach((k, j) => {
      const pk = `${p}.kennzahlen[${j}]`;
      if (k.teilmenge_von && (k.teilmenge_von === k.id || !kz.has(k.teilmenge_von)))
        fehler(`${pk}.teilmenge_von`, `${k.teilmenge_von} ist keine andere Kennzahl dieses Sachverhalts`);
      if (k.bandbreite && k.bandbreite.von > k.bandbreite.bis) fehler(`${pk}.bandbreite`, "von größer als bis");
      if (k.mindestwert && k.wert === null) fehler(`${pk}.mindestwert`, "Mindestwert ohne Wert");
      if (k.datenstand && nachT0(k.datenstand)) fehler(`${pk}.datenstand`, "Datenstand nach dem Meldezeitpunkt");
    });
    (s.bewertung?.abweichende_bewertungen || []).forEach((a, j) => pruefeIds(a.quellen, `${p}.bewertung.abweichende_bewertungen[${j}].quellen`));
    (s.bewertung?.erkenntnislage?.widersprueche || []).forEach((w, j) => pruefeIds(w.quellen, `${p}.bewertung.erkenntnislage.widersprueche[${j}].quellen`));

    let vorher = null;
    (s.zeitstrahl || []).forEach((z, j) => {
      const pz = `${p}.zeitstrahl[${j}]`;
      if (zeilenIds.has(z.id)) fehler(`${pz}.id`, `Zeilennummer ${z.id} doppelt in der Meldung`);
      if (z.berichtigt && !zeilenIds.has(z.berichtigt)) fehler(`${pz}.berichtigt`, `${z.berichtigt} steht nicht vor dieser Zeile`);
      zeilenIds.add(z.id);
      pruefeIds(z.quellen, `${pz}.quellen`);
      if (nachT0(z.zeit)) fehler(`${pz}.zeit`, "Ereigniszeit nach dem Meldezeitpunkt (nur Eingetretenes bis t0)");
      if (z.erstmals_gemeldet && nachT0(z.erstmals_gemeldet)) fehler(`${pz}.erstmals_gemeldet`, "nach dem Meldezeitpunkt");
      if (z.erstmals_gemeldet && vergleicheZeit(z.erstmals_gemeldet, z.zeit, zone) === -1) fehler(`${pz}.erstmals_gemeldet`, "vor der Ereigniszeit");
      if (vorher && vergleicheZeit(z.zeit, vorher, zone) === -1) hinweis(`${pz}.zeit`, "nicht chronologisch");
      vorher = z.zeit;
    });
    if ((s.zeitstrahl || []).length > 12) hinweis(`${p}.zeitstrahl`, `${s.zeitstrahl.length} Zeilen; Richtwert 12`);

    const bevs = s.module?.[MODUL_BEVS];
    if (bevs && vollst) {
      if (!bevs.ereignisarten?.length) fehler(`${p}.module.${MODUL_BEVS}.ereignisarten`, "keine Ereignisart");
      for (const [k, a] of Object.entries(bevs.lagenradar || {})) {
        if (!String(a.begruendung || "").trim())
          fehler(`${p}.module.${MODUL_BEVS}.lagenradar.${k}.begruendung`, `${k.toUpperCase()} ohne Begründung (Kodierleitfaden Grundregeln 9 und 10)`);
        pruefeIds(a.quellen, `${p}.module.${MODUL_BEVS}.lagenradar.${k}.quellen`);
      }
    } else if (bevs) for (const [k, a] of Object.entries(bevs.lagenradar || {})) pruefeIds(a.quellen, `${p}.module.${MODUL_BEVS}.lagenradar.${k}.quellen`);
    for (const name of Object.keys(s.module || {})) if (name !== MODUL_BEVS) hinweis(`${p}.module.${name}`, "unbekanntes Modul, ungeprüft übernommen");
  });
  for (const id of quellIds) if (!zitiert.has(id)) hinweis("quellen", `${id} verzeichnet, aber nicht zitiert`);
  return b;
}

// ---------------------------------------------------------------------------------------------------------------
// 5. Kommandozeile
// ---------------------------------------------------------------------------------------------------------------

function argumente(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) opt[argv[i].slice(2)] = argv[++i];
    else pos.push(argv[i]);
  }
  return { pos, opt };
}

export function dateinameV2(m) {
  const zeit = (m.meldezeitpunkt || "ohne-Zeit").slice(0, 16).replace(":", "-");
  const stelle = (m.absender?.gebiet?.schluessel || m.absender?.gebiet?.name || "Stelle").replace(/[^A-Za-z0-9-]+/g, "_");
  return `${zeit}_LEAD-Meldung-v2_${stelle}.json`;
}

async function main() {
  const [befehl, ...rest] = process.argv.slice(2);
  const { pos, opt } = argumente(rest);
  if (befehl === "schema") {
    const [quelle, ziel] = pos;
    if (!quelle) throw new Error("Aufruf: schema <zusammenstellung.json> [ziel]");
    const z = leseJson(quelle);
    const s = stelleSchemaZusammen(z);
    const text = JSON.stringify(s, null, 2) + "\n";
    if (ziel) {
      writeFileSync(ziel, text);
      console.log(`geschrieben: ${ziel}`);
    } else process.stdout.write(text);
    return;
  }
  if (befehl === "migriere") {
    if (!pos.length || !opt.ziel) throw new Error("Aufruf: migriere <v1.json …> --ziel <ordner> [--zeitzone Europe/Berlin] [--ebene Kreis]");
    mkdirSync(opt.ziel, { recursive: true });
    for (const datei of pos) {
      const { meldung, hinweise } = migriereV1(leseJson(datei), { zeitzone: opt.zeitzone, ebene: opt.ebene });
      const ziel = join(opt.ziel, basename(datei).replace(/\.json$/, "") + ".v2.json");
      writeFileSync(ziel, JSON.stringify(meldung, null, 2) + "\n");
      console.log(`${datei} → ${ziel} (${hinweise.length} Hinweise)`);
      for (const h of hinweise) console.log(`  · ${h}`);
    }
    return;
  }
  if (befehl === "pruefe") {
    if (!pos.length || !opt.schema) throw new Error("Aufruf: pruefe <v2.json …> --schema <schema.json>");
    const { default: Ajv2020 } = await import("ajv/dist/2020.js");
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const pruefe = ajv.compile(leseJson(opt.schema));
    let fehlerGesamt = 0;
    for (const datei of pos) {
      const m = leseJson(datei);
      const ok = pruefe(m);
      const ref = pruefeReferenzen(m);
      const f = (ok ? 0 : pruefe.errors.length) + ref.filter((r) => r.stufe === "fehler").length;
      fehlerGesamt += f;
      console.log(`${datei}: ${f ? `${f} Fehler` : "ohne Fehler"}`);
      if (!ok) for (const e of pruefe.errors) console.log(`  ✗ Schema ${e.instancePath || "/"}: ${e.message}`);
      for (const r of ref) console.log(`  ${r.stufe === "fehler" ? "✗" : "·"} ${r.pfad}: ${r.text}`);
    }
    process.exitCode = fehlerGesamt ? 1 : 0;
    return;
  }
  console.log("Befehle: schema | migriere | pruefe (siehe Kopf der Datei)");
  process.exitCode = befehl ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
