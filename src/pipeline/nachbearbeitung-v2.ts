// Nachbearbeitung eines KI-Entwurfs nach LEAD-Meldung-v2 (seit 0.8.0, UP-2026-W45-04; docs/LEAD-MELDUNG-V2.md
// Abschnitte 1, 3, 5.2, 6 und 7). Die App setzt, was sie verantwortet, und prüft danach das vollständige Profilschema:
// - Identität und Status: Schemakennung, Formatfassung, neue meldung_id (UUID Version 7), Status „entwurf“, Zeitzone,
//   Beziehung „fortschreibung_von“ zur eigenen Vormeldung, leerer Freigabeblock (eine KI zeichnet nicht);
// - Absender aus der eigenen Vormeldung, sonst aus dem Profil; Meldezeitpunkt t0 mit UTC-Versatz;
// - Zeitangaben ohne Versatz in der Zeitzone des Profils ergänzt, leere Zeitangaben als null (unbekannt);
// - Entstehung: Verfahren, Werkzeug, Profil, Regelwerk (beigefügte SOPs, Kodierleitfaden, Arbeitsanweisung), Modelle je
//   Stufe, Lauf; die Angabe der KI zu angewandten SOPs wird nur verglichen;
// - Kennungen (neue mit sechs Zufallszeichen), Bezug als Objekte mit meldung_id, Zeitstrahl je Sachverhalt mit
//   erstmals_gemeldet und Bewertungszeilen der App, stabile Quellen-IDs der Vormeldung (Prüfung);
// - Übernahme aus Kennzahlen-Bausteinen (src/kern/bausteinuebernahme.ts).

import { bekannterAnbieter } from "../anbieter/verteiler";
import { jetztLokal } from "../kern/ausgabe";
import { bausteineUebernehmen, MODUL_BAUSTEIN, type UebernahmeBaustein } from "../kern/bausteinuebernahme";
import { kennzahlPruefungV2 } from "../kern/bausteinverdichtung";
import { istKennungV2, neueKennung, PLATZHALTER_RE, ZUFALL_V2 } from "../kern/kennung";
import { FASSUNG, LAENDER, mitVersatz, SCHEMA_ID, stehtVor } from "../kern/meldung-v2.js";
import { holeWert } from "../kern/pfad";
import { aufloesen } from "../kern/schema";
import type { Befund, Meldung, Profil } from "../kern/typen";
import { istEigeneStelle } from "../kern/ui";
import { kontext, nachName, normSchluessel, type GebietVerzeichnis } from "../kern/gebiete";
import { GEBIETE_KERN, gebieteVermerk } from "./gebieteDaten";
import { zoneOder } from "../kern/zeit";
import { APP_VERSION } from "../kern/version";
import { fachSops, sopIdsAufloesen } from "./kontext";
import { absenderFuer, type Material } from "./material";
import { kodierleitfadenKennung, radarUmhaengen, sopAngabeVergleichen } from "./nachbearbeitung";
import type { Kontext } from "./stufen";
import { meldungenImMaterial } from "./zeitstrahl";

const istObjekt = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);

/** UUID Version 7 (zeitlich sortierbar, RFC 9562); `zufall` liefert Zahlen in [0, 1) (Tests) */
export function uuidV7(jetzt: Date, zufall?: () => number): string {
  const b = new Uint8Array(16);
  if (zufall) for (let i = 0; i < 16; i++) b[i] = Math.floor(zufall() * 256) & 255;
  else globalThis.crypto.getRandomValues(b);
  let ms = Math.max(0, Math.floor(jetzt.getTime()));
  for (let i = 5; i >= 0; i--) {
    b[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  b[6] = (b[6]! & 0x0f) | 0x70;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Schlüssel, deren Werte Zeitangaben sind (Kern von LEAD-Meldung-v2) */
const ZEITFELDER = new Set(["zeit", "bekannt_seit", "veroeffentlicht", "datenstand", "stand", "termin", "bis", "von", "ende", "zeitpunkt"]);
const WANDUHR = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)$/;

/**
 * Zeitangaben ohne UTC-Versatz in der Zone ergänzen (Wanduhrzeit), leere Zeitangaben auf null setzen und den Tag des
 * Abrufs (`zugriff`) auf den Kalendertag kürzen. Liefert die Zahl der Änderungen.
 */
export function zeitenErgaenzen(knoten: unknown, zone: string): number {
  let n = 0;
  const besuche = (x: unknown) => {
    if (Array.isArray(x)) return x.forEach(besuche);
    if (!istObjekt(x)) return;
    for (const [k, v] of Object.entries(x)) {
      if (typeof v === "string" && ZEITFELDER.has(k)) {
        const m = WANDUHR.exec(v.trim());
        if (m) {
          const mit = mitVersatz(`${m[1]}T${m[2]}`, zone);
          if (mit) {
            x[k] = mit;
            n++;
          }
        } else if (!v.trim()) {
          x[k] = null;
          n++;
        }
      } else if (typeof v === "string" && k === "zugriff" && /^\d{4}-\d{2}-\d{2}[T ]/.test(v)) {
        x[k] = v.slice(0, 10);
        n++;
      } else if (v && typeof v === "object") besuche(v);
    }
  };
  besuche(knoten);
  return n;
}

/** Wert einer Profilvariablen: zuerst der Pfad der v2-Rolle, dann die Namen aus v1 */
function variable(p: Profil, ...namen: (string | undefined)[]): string {
  for (const n of namen) if (n && p.manifest.variablen?.[n]) return p.manifest.variablen[n];
  return "";
}

/** Absender der neuen Meldung: aus der jüngsten eigenen Vormeldung (vollständig), sonst aus dem Profil */
export function absenderV2(material: Material[], p: Profil): Record<string, any> {
  const r = p.ui.rollen;
  const a = absenderFuer(material, p);
  const { eigene } = meldungenImMaterial(material, p);
  const vor = eigene[eigene.length - 1];
  if (a.herkunft === "vormeldung" && istObjekt(vor?.absender)) return structuredClone(vor.absender);
  const name = a.land || variable(p, r.land, "land", "kreis");
  const ebenen: unknown = aufloesen(p.schema?.properties?.absender, p.schema)?.properties?.ebene?.enum;
  const passt = (e: string) => !!e && (!Array.isArray(ebenen) || ebenen.includes(e));
  const ebene = [variable(p, "absender.ebene"), p.manifest.ebene || "", name === "Bund" ? "Bund" : "Land"].find(passt) || "";
  const schluessel = variable(p, "absender.gebiet.schluessel") || LAENDER[name] || "";
  const stelle_id = variable(p, "absender.stelle_id");
  return {
    stelle: a.stelle || variable(p, r.meldende_stelle, "meldende_stelle"),
    ...(stelle_id ? { stelle_id } : {}),
    ebene,
    gebiet: { name, ...(schluessel ? { schluessel } : {}) },
  };
}

/** „Arbeitsanweisung Erfassung 1.11.4“ aus dem Kopf der Anweisung; ohne erkennbare Fassung leer */
function anweisungKennung(p: Profil): string {
  const pfad = p.manifest.anweisungen?.erfassung;
  const text = pfad ? p.dateien[pfad] || "" : "";
  const fassung = text.slice(0, 800).match(/Fassung\s+(\d+(?:\.\d+)*)/)?.[1];
  return fassung ? `Arbeitsanweisung Erfassung ${fassung}` : "";
}

/** Modelle je Stufe aus dem Laufprotokoll (S1 samt Orientierung, S2 samt Nachforderung, S3), ohne Doppelungen */
function modelleDesLaufs(k: Kontext, modellS2: string): { stufe: string; anbieter?: string; modell: string }[] {
  const out: { stufe: string; anbieter?: string; modell: string }[] = [];
  const hinzu = (stufe: string, modell: string | undefined) => {
    if (!modell || out.some((x) => x.stufe === stufe && x.modell === modell)) return;
    const anbieter = bekannterAnbieter(modell);
    out.push({ stufe, ...(anbieter ? { anbieter } : {}), modell });
  };
  for (const e of k.lauf.stufen || []) {
    if (e.fehler) continue;
    const stufe = /^(S\d)/.exec(e.stufe)?.[1] || (/^Orientierung/i.test(e.stufe) ? "S1" : "");
    if (stufe) hinzu(stufe, e.modell);
  }
  if (!out.some((x) => x.stufe === "S2" || x.stufe === "S3")) hinzu("S2", modellS2);
  return out;
}

export interface V2Ausgabe {
  korrekturen: string[];
  sopHinweise: string[];
  umhaengungen: string[];
  befunde: Befund[];
}

export interface V2Optionen {
  /** Zufall für Kennungen und meldung_id (Tests) */
  zufall?: () => number;
  /** Gebietsverzeichnis mit Gemeinden (seit 0.9.8); ohne Angabe nur der Kern (Länder, Regierungsbezirke, Kreise) */
  gebiete?: GebietVerzeichnis;
}

/**
 * Amtliche Gebietsschlüssel aus dem Verzeichnis statt aus dem Modell (seit 0.9.8, Entscheidung des Herausgebers vom
 * 21.11.2026): Fehlt ein Schlüssel, ergänzt ihn die App, wenn der Name eindeutig ist (zuerst im Land der meldenden
 * Stelle, dann bundesweit). Einen Schlüssel, den das Verzeichnis nicht kennt oder der zu einem anderen Gebiet desselben
 * Namens gehört, ersetzt sie durch den des Namens oder entfernt ihn. „DE-TH“ und 12-stellige Regionalschlüssel werden
 * umgerechnet. Staaten (ISO 3166-1, „CZ“) bleiben. Ein Hinweis nennt jede Änderung zur Durchsicht.
 */
export function gebieteErgaenzen(d: Meldung, v: GebietVerzeichnis): Befund[] {
  const land = normSchluessel(d.absender?.gebiet?.schluessel).slice(0, 2);
  const imLand = /^\d{2}$/.test(land) ? land : undefined;
  const ergaenzt: string[] = [];
  const korrigiert: string[] = [];
  const entfernt: string[] = [];
  const ohne: string[] = [];
  const zeige = (name: string, s: string) => {
    const e = v.nach.get(s);
    const k = e ? kontext(v, e) : "";
    return `„${name}“ → ${s}${e && e.name !== name ? ` (${e.name}${k ? `, ${k}` : ""})` : k ? ` (${k})` : ""}`;
  };
  const pruefe = (g: unknown) => {
    if (!g || typeof g !== "object" || Array.isArray(g)) return;
    const o = g as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!name) return;
    const roh = typeof o.schluessel === "string" ? o.schluessel : "";
    const s = normSchluessel(roh);
    const treffer = (imLand && nachName(v, name, imLand)) || nachName(v, name);
    if (/^[A-Z]{2}$/.test(s)) return; // Staat
    if (!s) {
      if (treffer) {
        o.schluessel = treffer.schluessel;
        ergaenzt.push(zeige(name, treffer.schluessel));
      } else ohne.push(`„${name}“`);
      return;
    }
    const bekannt = /^\d+$/.test(s) && v.nach.has(s);
    if (bekannt && (!treffer || treffer.schluessel === s)) {
      if (s !== roh) o.schluessel = s;
      return;
    }
    if (treffer) {
      o.schluessel = treffer.schluessel;
      korrigiert.push(`${zeige(name, treffer.schluessel)} statt ${roh}`);
    } else if (!bekannt) {
      delete o.schluessel;
      entfernt.push(`„${name}“: ${roh}`);
    } else if (s !== roh) o.schluessel = s;
  };
  pruefe(d.absender?.gebiet);
  for (const g of Array.isArray(d.berichtsraum?.gebiete) ? d.berichtsraum.gebiete : []) pruefe(g);
  for (const sv of Array.isArray(d.sachverhalte) ? d.sachverhalte : []) for (const g of Array.isArray(sv?.raum?.gebiete) ? sv.raum.gebiete : []) pruefe(g);
  const teile = [
    ergaenzt.length ? `ergänzt: ${ergaenzt.join("; ")}` : "",
    korrigiert.length ? `ersetzt: ${korrigiert.join("; ")}` : "",
    entfernt.length ? `entfernt, weil nicht im Verzeichnis: ${entfernt.join("; ")}` : "",
    ohne.length ? `ohne Schlüssel (Name mehrdeutig oder nicht im Verzeichnis): ${ohne.join(", ")}` : "",
  ].filter(Boolean);
  return teile.length
    ? [{ stufe: "hinweis", code: "GEBIET_SCHLUESSEL", text: `Gebietsschlüssel nach dem ${gebieteVermerk(v)} – ${teile.join(" · ")}. Bitte prüfen.` }]
    : [];
}

/** Nachbearbeitung eines Entwurfs nach LEAD-Meldung-v2; Rückgabe ist eine neue Meldung (der Entwurf bleibt unverändert) */
export function nachbearbeitenV2(roh: unknown, k: Kontext, modell: string, aus: V2Ausgabe, opt: V2Optionen = {}): Meldung {
  if (!istObjekt(roh)) throw new Error("Das Ergebnis ist kein JSON-Objekt.");
  const p = k.profil;
  const r = p.ui.rollen;
  const zone = zoneOder(p.manifest.variablen?.zeitzone);
  const jetzt = k.jetzt?.() ?? new Date();
  const ki = structuredClone(roh) as Meldung;
  const { eigene, fremde } = meldungenImMaterial(k.material, p);
  const vor = eigene[eigene.length - 1];

  // 1. Identität, Status, Zeitzone, Absender, Meldezeitpunkt, Beziehungen, Freigabe (in der Reihenfolge des Kernschemas)
  const absender = absenderV2(k.material, p);
  const kiStelle = ki.absender?.stelle;
  if (typeof kiStelle === "string" && kiStelle.trim() && kiStelle !== absender.stelle && !istEigeneStelle(kiStelle, p.manifest))
    aus.korrekturen.push(`absender.stelle: „${kiStelle}“ → „${absender.stelle}“`);
  const t0 = k.lauf.bestaetigt?.meldezeitpunkt || jetztLokal(zone, jetzt);
  const fassung = String(p.schema?.properties?.fassung?.const ?? FASSUNG);
  const vorId = vor && typeof vor.meldung_id === "string" ? vor.meldung_id : undefined;
  const {
    schema: _s,
    fassung: _f,
    meldung_id: _m,
    beziehungen: _b,
    status: _st,
    absender: _a,
    meldezeitpunkt: _t,
    zeitzone: _z,
    freigabe: _fr,
    entstehung: kiEntstehung,
    ...rest
  } = ki;
  const d: Meldung = {
    schema: SCHEMA_ID,
    fassung,
    meldung_id: uuidV7(jetzt, opt.zufall),
    ...(vorId ? { beziehungen: [{ art: "fortschreibung_von", meldung_id: vorId }] } : {}),
    status: r.status_entwurf || "entwurf",
    absender,
    ...("berichtsraum" in rest ? { berichtsraum: rest.berichtsraum } : {}),
    meldezeitpunkt: mitVersatz(t0.slice(0, 16), zone) ?? null,
    zeitzone: zone,
    ...rest,
    freigabe: {},
  };
  if (!istObjekt(d.meldezeitraum)) d.meldezeitraum = { von: null, bis: null };
  if (!Array.isArray(d.quellen)) d.quellen = [];
  if (!Array.isArray(d.sachverhalte)) d.sachverhalte = [];
  radarUmhaengen(d, p, aus.umhaengungen);
  const zeiten = zeitenErgaenzen(
    {
      meldezeitraum: d.meldezeitraum,
      quellen: d.quellen,
      sachverhalte: d.sachverhalte,
      fehlanzeige: d.fehlanzeige,
      uebergreifende_lage: d.uebergreifende_lage,
    },
    zone,
  );
  if (zeiten)
    aus.befunde.push({
      stufe: "hinweis",
      code: "ZEIT_ERGAENZT",
      text: `${zeiten} Zeitangabe(n) von der App vereinheitlicht: Uhrzeit ohne UTC-Versatz in der Zeitzone ${zone} ergänzt, leere Angabe als unbekannt (null), Abruf als Kalendertag.`,
    });

  // Amtliche Gebietsschlüssel aus dem Verzeichnis (seit 0.9.8)
  aus.befunde.push(...gebieteErgaenzen(d, opt.gebiete ?? GEBIETE_KERN));

  // 2. Entstehung
  const ids = new Set(
    sopIdsAufloesen(
      p,
      (k.lauf.bestaetigt?.sachverhalte || []).flatMap((s) => s.sops),
    ),
  );
  const beigefuegt = fachSops(p).filter((s) => ids.has(s.id));
  const kiSop = kiEntstehung?.regelwerk?.sop;
  aus.sopHinweise.push(
    ...sopAngabeVergleichen(
      Array.isArray(kiSop) ? kiSop.map((x: any) => (istObjekt(x) ? `SOP-LEAD ${x.kennung ?? ""}` : String(x ?? ""))) : undefined,
      p,
      beigefuegt.map((s) => s.id),
    ),
  );
  const kl = kodierleitfadenKennung(p);
  const aa = anweisungKennung(p);
  d.entstehung = {
    verfahren: "KI-Entwurf",
    erstellt: mitVersatz(jetztLokal(zone, jetzt).slice(0, 16), zone),
    werkzeug: { name: "KI-LEAD", version: /^KI-LEAD\s+(\S+)/.exec(k.lauf.app || "")?.[1] || APP_VERSION },
    profil: { id: p.manifest.id, version: p.manifest.version },
    regelwerk: {
      sop: beigefuegt.map((s) => ({
        kennung: s.nummer || s.id,
        ...(s.version ? { fassung: s.version } : {}),
        bezeichnung: s.titel.replace(/^[A-Z]?\d+\.\s*(?:SOP|Baustein) LEAD:\s*/i, "").trim(),
      })),
      ...(kl ? { kodierleitfaden: kl } : {}),
      ...(aa ? { arbeitsanweisung: aa } : {}),
    },
    modelle: modelleDesLaufs(k, modell),
    lauf_id: k.lauf.id,
  };

  // 3. Kennungen, Bezug, Zeitstrahl
  kennungenUndZeitstrahlV2(d, p, { vor, eigene, fremde, jetzt, zone, zufall: opt.zufall }, aus.befunde);

  // 4. Kennzahlen-Bausteine
  const bausteine = bausteineImMaterial(k.material);
  aus.befunde.push(...bausteineUebernehmen(d, bausteine));
  // Summen, Ausschnitte und Beleg nach der Rechenhilfe (seit 0.8.2, UP-2026-W45-05)
  aus.befunde.push(...kennzahlPruefungV2(d, bausteine, MODUL_BAUSTEIN, !!p.ui.rollen.sv_radar));
  return d;
}

/** Kennzahlen-Bausteine des Materials für die Übernahme */
export function bausteineImMaterial(material: Material[]): UebernahmeBaustein[] {
  return (material || []).flatMap((m) =>
    m.art === "kennzahlen-baustein" && m.baustein
      ? [{ name: m.name, sha256: m.hash, info: m.baustein.info, daten: m.baustein.daten as Record<string, any> }]
      : [],
  );
}

interface KennungsUmgebung {
  vor?: Meldung;
  eigene: Meldung[];
  fremde: Meldung[];
  jetzt: Date;
  zone: string;
  zufall?: () => number;
}

const svListe = (m: Meldung | undefined): any[] => (m && Array.isArray(m.sachverhalte) ? m.sachverhalte.filter(istObjekt) : []);
const kennungenVon = (m: Meldung | undefined) =>
  svListe(m)
    .map((sv) => sv.kennung)
    .filter(istKennungV2);
const bezugKennungen = (sv: any): string[] =>
  (Array.isArray(sv?.bezug) ? sv.bezug : [])
    .map((b: unknown) => (istObjekt(b) ? b.kennung : b))
    .filter((x: unknown): x is string => typeof x === "string" && !!x.trim());

/** Inhalt einer Zeitstrahlzeile zum Wiedererkennen (ohne ID und erstmals_gemeldet) */
const zeilenInhalt = (z: any) =>
  JSON.stringify([
    z?.zeit ?? null,
    z?.typ ?? "",
    String(z?.text ?? "")
      .replace(/\s+/g, " ")
      .trim(),
    [...(z?.quellen || [])].sort(),
  ]);
const zeilenNr = (id: unknown) => Number(/^Z(\d+)$/.exec(String(id ?? ""))?.[1] ?? 0);

/** Quellenidentität: Herausgeber, Titel und Fundstelle (ohne ID, Kategorie, Zugriff, Datenstand, Zugang) */
const quellIdentitaet = (q: any) =>
  [q?.herausgeber, q?.titel, q?.url]
    .map((x) =>
      String(x ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase(),
    )
    .join("|");

/**
 * Kennungen, Bezug und Zeitstrahl nach LEAD-Meldung-v2 (Abschnitte 3 und 5.2; Kodierleitfaden Abschnitt 8). Wie bei v1
 * (src/pipeline/zeitstrahl.ts), aber mit Objekten: Bezug `{kennung, meldung_id?, art?}`, Zeitstrahl je Sachverhalt mit
 * IDs Zn, eindeutig in der Meldung, und `erstmals_gemeldet`.
 */
export function kennungenUndZeitstrahlV2(d: Meldung, p: Profil, u: KennungsUmgebung, befunde: Befund[] = []): void {
  const ui = p.ui;
  const svs = svListe(d);
  const vorSv = new Map<string, any>(
    svListe(u.vor)
      .filter((sv) => istKennungV2(sv.kennung))
      .map((sv) => [sv.kennung, sv]),
  );
  const eigeneKennungen = new Set(u.eigene.flatMap(kennungenVon));
  const fremdeKennungen = new Set(u.fremde.flatMap(kennungenVon));
  const sn = (i: number) => `Sachverhalt ${i + 1}`;

  // 1. Kennungen (neue mit sechs Zufallszeichen)
  const zuordnung = new Map<string, string>();
  const fremdZuordnung = new Map<string, string>();
  const datum = jetztLokal(u.zone, u.jetzt);
  const herkunft = holeWert(d, ui.rollen.land || "absender.gebiet.name");
  const vergeben = new Set<string>();
  const ersetzt: string[] = [];
  const fremdUebernommen: string[] = [];
  svs.forEach((sv, i) => {
    const roh = String(sv.kennung ?? "").trim();
    if (istKennungV2(roh) && vorSv.has(roh) && !vergeben.has(roh)) {
      vergeben.add(roh);
      return;
    }
    const neu = neueKennung(ui, herkunft, datum, [...vergeben, ...eigeneKennungen, ...fremdeKennungen], u.zufall, ZUFALL_V2);
    sv.kennung = neu;
    vergeben.add(neu);
    if (!roh) return;
    if (PLATZHALTER_RE.test(roh)) {
      if (zuordnung.has(roh)) ersetzt.push(`${sn(i)}: Platzhalter „${roh}“ doppelt`);
      else zuordnung.set(roh, neu);
    } else if (fremdeKennungen.has(roh)) {
      fremdZuordnung.set(roh, neu);
      fremdUebernommen.push(`${sn(i)}: ${roh}`);
      if (!bezugKennungen(sv).includes(roh)) sv.bezug = [...(Array.isArray(sv.bezug) ? sv.bezug : []), { kennung: roh }];
    } else if (vergeben.has(roh) || zuordnung.has(roh) || fremdZuordnung.has(roh)) ersetzt.push(`${sn(i)}: „${roh}“ doppelt`);
    else {
      zuordnung.set(roh, neu);
      ersetzt.push(`${sn(i)}: „${roh}“`);
    }
  });
  if (fremdUebernommen.length)
    befunde.push({
      stufe: "hinweis",
      code: "KENNUNG_FREMD",
      text: `Kennung einer anderen Stelle als eigene übernommen; die App hat eine eigene vergeben und die fremde als Bezug eingetragen: ${fremdUebernommen.join("; ")}.`,
    });
  if (ersetzt.length)
    befunde.push({
      stufe: "hinweis",
      code: "KENNUNG_ERSETZT",
      text: `Kennungen vergibt die App; ersetzt, weil nicht aus der eigenen Vormeldung: ${ersetzt.join("; ")}.`,
    });

  // 2. Bezug: Objekte, bekannte Kennungen, meldung_id der Meldung im Material, in der die Kennung steht
  const quelleDer = new Map<string, string>();
  for (const m of [...u.eigene, ...u.fremde])
    if (typeof m.meldung_id === "string") for (const kn of kennungenVon(m)) if (!quelleDer.has(kn)) quelleDer.set(kn, m.meldung_id);
  const geerbt = [...u.eigene, ...u.fremde].flatMap((m) => svListe(m).flatMap(bezugKennungen));
  const bekannt = new Set([...eigeneKennungen, ...fremdeKennungen, ...geerbt]);
  const arten = new Set(["verdichtung", "teilung", "zusammenfuehrung"]);
  const entfernt: string[] = [];
  const ohneBezug: number[] = [];
  svs.forEach((sv, i) => {
    const roh: unknown[] = Array.isArray(sv.bezug) ? sv.bezug : sv.bezug ? [sv.bezug] : [];
    const out: Record<string, any>[] = [];
    for (const b of roh) {
      const o = istObjekt(b) ? b : { kennung: b };
      const kennung = zuordnung.get(String(o.kennung ?? "").trim()) ?? String(o.kennung ?? "").trim();
      if (!kennung || kennung === sv.kennung || out.some((x) => x.kennung === kennung)) continue;
      const ok = bekannt.has(kennung) || svs.some((x) => x !== sv && x.kennung === kennung);
      if (!ok) {
        entfernt.push(`${sn(i)}: „${kennung}“`);
        continue;
      }
      const mid = quelleDer.get(kennung);
      out.push({ kennung, ...(mid ? { meldung_id: mid } : {}), ...(typeof o.art === "string" && arten.has(o.art) ? { art: o.art } : {}) });
    }
    if (out.length) sv.bezug = out;
    else delete sv.bezug;
    if (fremdeKennungen.size && !out.length) ohneBezug.push(i + 1);
  });
  if (entfernt.length)
    befunde.push({
      stufe: "warnung",
      code: "BEZUG_UNBEKANNT",
      text: `Bezug auf Kennungen, die in keiner Eingangs- oder Vormeldung vorkommen, entfernt: ${entfernt.join("; ")}.`,
    });
  if (ohneBezug.length)
    befunde.push({
      stufe: "hinweis",
      code: "BEZUG_FEHLT",
      text: `Sachverhalt ${ohneBezug.join(", ")} ohne Bezug, obwohl Eingänge mit Kennung vorliegen; bitte die eingehenden Sachverhalte nennen.`,
    });

  // 2a. Übergreifende Lage (seit 0.8.3, UP-2026-W45-06): Verweise auf Sachverhalte dieser Meldung, Platzhalter wie oben
  const ul = d.uebergreifende_lage;
  if (istObjekt(ul) && Array.isArray(ul.sachverhalte)) {
    const eigeneSv = new Set(svs.map((sv) => sv.kennung));
    const roh = ul.sachverhalte.map((x: unknown) => String(x ?? "").trim());
    const neu = [...new Set(roh.map((x: string) => zuordnung.get(x) ?? x))].filter((x) => eigeneSv.has(x));
    const weg = roh.filter((x: string) => !eigeneSv.has(zuordnung.get(x) ?? x));
    if (weg.length)
      befunde.push({
        stufe: "hinweis",
        code: "UEBERGREIFEND_VERWEIS",
        text: `Übergreifende Lage: Verweis auf Sachverhalte, die es in dieser Meldung nicht gibt, entfernt: ${weg.map((x: string) => `„${x}“`).join(", ")}.`,
      });
    if (neu.length) ul.sachverhalte = neu;
    else delete ul.sachverhalte;
  }

  // 3. Zeitstrahl je Sachverhalt
  const t0 = typeof d.meldezeitpunkt === "string" ? d.meldezeitpunkt : null;
  const vorT0 = u.vor && typeof u.vor.meldezeitpunkt === "string" ? u.vor.meldezeitpunkt : null;
  const vorZeilen = new Map<string, { zeile: any; kennung: string }>();
  for (const sv of svListe(u.vor))
    for (const z of Array.isArray(sv.zeitstrahl) ? sv.zeitstrahl : []) if (istObjekt(z) && z.id) vorZeilen.set(z.id, { zeile: z, kennung: sv.kennung });
  const vorInhalt = new Map([...vorZeilen.values()].map((x) => [zeilenInhalt(x.zeile), x.zeile.id as string]));
  const getragen = new Set<string>();
  const veraendert: string[] = [];
  const wiederhergestellt: string[] = [];
  const umnummeriert: string[] = [];
  let kiBewertung = 0;
  const ausVormeldung = new Set<any>();
  const neueZeilen = new Map<any, any[]>(); // Sachverhalt → Zeilen
  const svDerKennung = (kn: string) => svs.find((sv) => sv.kennung === kn);
  // Durchgang a: Zeilen der Vormeldung erkennen (ID mit gleichem Inhalt oder gleicher Inhalt unter anderer ID)
  // Ein Zeitstrahl als Text (Form von v1) bleibt unverändert stehen; die Schemaprüfung nennt ihn, die Reparatur setzt um
  const alsListe = svs.filter((sv) => sv.zeitstrahl === undefined || Array.isArray(sv.zeitstrahl));
  for (const sv of alsListe) {
    const zeilen: any[] = (Array.isArray(sv.zeitstrahl) ? sv.zeitstrahl : []).filter(istObjekt);
    const liste: any[] = [];
    for (const z of zeilen) {
      const v = vorZeilen.get(z.id);
      const gleicheId = v && zeilenInhalt(v.zeile) === zeilenInhalt(z) ? z.id : undefined;
      const gleicherInhalt = vorInhalt.get(zeilenInhalt(z));
      const id = gleicheId ?? (gleicherInhalt && !getragen.has(gleicherInhalt) ? gleicherInhalt : undefined);
      if (z.typ === "Bewertung" && !id) {
        kiBewertung++;
        continue;
      }
      if (id && !getragen.has(id)) {
        getragen.add(id);
        const kopie = structuredClone(vorZeilen.get(id)!.zeile);
        if (!kopie.erstmals_gemeldet) kopie.erstmals_gemeldet = vorT0;
        ausVormeldung.add(kopie);
        liste.push(kopie);
        continue;
      }
      if (v) veraendert.push(String(z.id));
      liste.push(z);
    }
    neueZeilen.set(sv, liste);
  }
  // Durchgang b: fehlende Zeilen der Vormeldung bei fortgeschriebenen Sachverhalten wiederherstellen
  for (const [id, v] of vorZeilen) {
    if (getragen.has(id)) continue;
    const sv = svDerKennung(v.kennung);
    if (!sv || !neueZeilen.has(sv)) continue;
    const kopie = structuredClone(v.zeile);
    if (!kopie.erstmals_gemeldet) kopie.erstmals_gemeldet = vorT0;
    ausVormeldung.add(kopie);
    neueZeilen.get(sv)!.push(kopie);
    getragen.add(id);
    if (!veraendert.includes(id)) wiederhergestellt.push(id);
  }
  // Durchgang c: IDs neuer Zeilen eindeutig (nächste freie nach Vormeldung und verbleibenden Zeilen), erstmals_gemeldet = t0
  let naechste = Math.max(0, ...[...vorZeilen.keys()].map(zeilenNr), ...[...neueZeilen.values()].flat().map((z) => zeilenNr(z?.id))) + 1;
  const belegt = new Set<string>([...vorZeilen.keys()].filter((id) => getragen.has(id)));
  for (const liste of neueZeilen.values())
    for (const z of liste) {
      if (ausVormeldung.has(z)) continue;
      if (!/^Z[1-9]\d*$/.test(String(z.id ?? "")) || belegt.has(z.id) || vorZeilen.has(z.id)) {
        const neu = `Z${naechste++}`;
        umnummeriert.push(`${z.id ?? "ohne ID"} → ${neu}`);
        z.id = neu;
      }
      belegt.add(z.id);
      z.erstmals_gemeldet = t0;
    }
  // Bewertungszeilen der App bei geändertem Stand gegenüber der Vormeldung
  const bewertung: string[] = [];
  if (t0)
    for (const sv of svs) {
      const alt = vorSv.get(sv.kennung);
      if (!alt || !neueZeilen.has(sv)) continue;
      const teile: string[] = [];
      for (const [label, wert] of [
        ["Beurteilung", (x: any) => x?.bewertung?.beurteilung?.stufe ?? null],
        ["Tendenz", (x: any) => x?.bewertung?.tendenz?.richtung ?? null],
      ] as const) {
        const a = wert(alt);
        const b = wert(sv);
        if (a !== b) teile.push(`${label} ${a ?? "keine Angabe"} → ${b ?? "keine Angabe"}`);
      }
      if (!teile.length) continue;
      const z = { id: `Z${naechste++}`, zeit: t0, typ: "Bewertung", text: teile.join("; "), quellen: [], erstmals_gemeldet: t0 };
      neueZeilen.get(sv)!.push(z);
      bewertung.push(`${z.id} ${z.text}`);
    }
  // Reihenfolge: chronologisch, sonst wie gegeben
  for (const [sv, liste] of neueZeilen) {
    const sortiert = liste
      .map((z, i) => ({ z, i }))
      .sort((a, b) => (stehtVor(a.z.zeit, b.z.zeit, u.zone) ? -1 : stehtVor(b.z.zeit, a.z.zeit, u.zone) ? 1 : a.i - b.i));
    if (sortiert.length || sv.zeitstrahl !== undefined) sv.zeitstrahl = sortiert.map((x) => x.z);
  }
  if (veraendert.length || wiederhergestellt.length)
    befunde.push({
      stufe: "warnung",
      code: "ZEITSTRAHL_VORMELDUNG",
      text: [
        "Zeilen der Vormeldung bleiben unverändert (Änderungen nur als neue Zeile vom Typ „Berichtigung“).",
        wiederhergestellt.length ? `Wiederhergestellt: ${wiederhergestellt.join(", ")}.` : "",
        veraendert.length
          ? `Verändert übernommen: ${veraendert.join(", ")}; die Fassung der Vormeldung bleibt, die neue Fassung steht als eigene Zeile – prüfen, ob sie als Berichtigung zu kennzeichnen ist.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  if (umnummeriert.length)
    befunde.push({ stufe: "hinweis", code: "ZEITSTRAHL_ID", text: `Zeilen-IDs von der App eindeutig vergeben: ${umnummeriert.join(", ")}.` });
  if (kiBewertung)
    befunde.push({
      stufe: "hinweis",
      code: "ZEITSTRAHL_BEWERTUNG_KI",
      text: `${kiBewertung} Zeile(n) vom Typ „Bewertung“ aus dem Entwurf verworfen; Bewertungswechsel trägt die App bei der Fortschreibung selbst ein.`,
    });
  if (bewertung.length)
    befunde.push({
      stufe: "hinweis",
      code: "ZEITSTRAHL_BEWERTUNG",
      text: `Bewertungswechsel gegenüber der Vormeldung von der App eingetragen: ${bewertung.join("; ")}.`,
    });

  // 4. Quellen-IDs der Vormeldung bleiben stabil (Kodierleitfaden Abschnitt 5): Konflikte nennen, nicht lösen
  if (u.vor && Array.isArray(u.vor.quellen) && Array.isArray(d.quellen)) {
    const neuNachId = new Map(d.quellen.filter(istObjekt).map((q: any) => [q.id, quellIdentitaet(q)]));
    const neuNachIdentitaet = new Map(d.quellen.filter(istObjekt).map((q: any) => [quellIdentitaet(q), q.id]));
    const konflikte: string[] = [];
    for (const q of u.vor.quellen.filter(istObjekt)) {
      const ident = quellIdentitaet(q);
      const jetzt = neuNachIdentitaet.get(ident);
      if (jetzt !== undefined && jetzt !== q.id) konflikte.push(`${q.id} der Vormeldung steht jetzt unter ${jetzt}`);
      else if (jetzt === undefined && neuNachId.has(q.id)) konflikte.push(`${q.id} bezeichnet jetzt eine andere Quelle`);
    }
    if (konflikte.length)
      befunde.push({
        stufe: "warnung",
        code: "QUELLE_ID_VORMELDUNG",
        text: `Quellen-IDs der Vormeldung bleiben bei der Fortschreibung stabil (Quellenregeln des Profils); bitte Quellenverzeichnis berichtigen: ${konflikte.join("; ")}.`,
      });
  }
}

/** Angaben für den Steuerungsblock bei v2: Kennungen der jüngsten eigenen Vormeldung und nächste freie Zeilennummer */
export function v2Vorgaben(material: Material[], p: Profil): { kennungen: string[]; naechsteZ: number } {
  const { eigene } = meldungenImMaterial(material, p);
  const vor = eigene[eigene.length - 1];
  const nrs = svListe(vor).flatMap((sv) => (Array.isArray(sv.zeitstrahl) ? sv.zeitstrahl : []).map((z: any) => zeilenNr(z?.id)));
  return { kennungen: kennungenVon(vor), naechsteZ: Math.max(0, ...nrs) + 1 };
}
