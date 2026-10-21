// Die gestufte KI-Pipeline nach LEAD (Modus A, Erfassung):
// S1 Gegenstand und SOP-Auswahl → Bestätigung durch die Person → S2 Recherche und Entwurf
// → S3 Prüfung und höchstens zwei Reparaturen → Übergabe an die Meldungsmaske (S4).

import type { Fortschritt, LlmAnbieter, LlmAnfrage, LlmAntwort } from "../anbieter/typen";
import { jetztLokal } from "../kern/ausgabe";
import { pflichtHinweise } from "../kern/kennsaetze";
import { quellenHinweise } from "../kern/quellen";
import { aufloesen } from "../kern/schema";
import type { Befund, Meldung, Profil } from "../kern/typen";
import { pruefeGegenSchema, type SchemaBefund } from "../kern/validierung";
import { modellFuer, type Einstellungen } from "./einstellungen";
import { zerlegeAntwort } from "./json";
import {
  anweisungErfassung,
  auftragAusBestaetigung,
  fachSops,
  profilGrundlagen,
  s1Schema,
  s1System,
  sopBlock,
  sopIdsAufloesen,
  verdichtungsAnweisung,
} from "./kontext";
import { kostenNachFehler, kostenStand, ohneBase64, type Lauf, type S1Vorschlag, type StufenEintrag } from "./lauf";
import { istVerdichtung, juengsterEingang, materialBloecke, materialUebersicht, type Material } from "./material";
import { holeWert } from "../kern/pfad";
import { sopKennung } from "../profil/sop";
import { istEigeneStelle } from "../kern/ui";
import { eingangsquellenPruefen, redaktionsvermerke } from "./vermerke";

export const MAX_REPARATUREN = 2;

const tausender = (n: number) => n.toLocaleString("de-DE");

/** Technisch unvollständiger S1-Vorschlag: Grund oder null. Prüft nur die Struktur, nicht den Inhalt. */
export function s1Strukturfehler(json: unknown): string | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return "Die Antwort ist kein JSON-Objekt.";
  const sv = (json as { sachverhalte?: unknown }).sachverhalte;
  if (!Array.isArray(sv) || sv.length === 0) return "Der Vorschlag enthält keine Sachverhalte.";
  const ungueltig = sv.findIndex((s) => !s || typeof s !== "object" || Array.isArray(s) || typeof (s as { titel?: unknown }).titel !== "string");
  if (ungueltig >= 0) return `Sachverhalt ${ungueltig + 1} ist unvollständig.`;
  return null;
}

/**
 * Bei Verdichtungen darf der t0-Vorschlag aus S1 höchstens so viele Stunden nach dem jüngsten Eingang liegen.
 * Sonst setzt die App t0 auf den jüngsten Eingang: S1 hatte mehrfach die aktuelle Uhrzeit vorgeschlagen,
 * obwohl die Eingänge Tage älter waren, und S2 ließ daraufhin alle Radarachsen offen.
 */
export const T0_SPIELRAUM_STUNDEN = 24;

function zeitwert(z: string): number {
  return Date.parse(`${z.slice(0, 16)}:00Z`);
}

function zeitText(z: string): string {
  return `${z.slice(8, 10)}.${z.slice(5, 7)}.${z.slice(0, 4)}, ${z.slice(11, 16)} Uhr`;
}

export interface Kontext {
  profil: Profil;
  anbieter: LlmAnbieter;
  einstellungen: Einstellungen;
  lauf: Lauf;
  material: Material[];
  signal?: AbortSignal;
  /** Wird nach jeder Änderung am Lauf aufgerufen (Speichern, Anzeige) */
  aktualisiert: (l: Lauf) => void | Promise<void>;
  fortschritt?: (f: Fortschritt) => void;
  jetzt?: () => Date;
}

async function aufrufen(k: Kontext, stufe: string, anfrage: LlmAnfrage): Promise<LlmAntwort> {
  const eintrag: StufenEintrag = {
    stufe,
    start: new Date().toISOString(),
    modell: anfrage.modell,
    aufwand: anfrage.aufwand,
    anfrage: ohneBase64({
      system: anfrage.system.map((s) => s.text),
      nachrichten: anfrage.nachrichten,
      werkzeuge: anfrage.werkzeuge,
      jsonSchema: anfrage.jsonSchema,
      maxTokens: anfrage.maxTokens,
    }),
  };
  k.lauf.stufen.push(eintrag);
  await k.aktualisiert(k.lauf);
  try {
    const a = await k.anbieter.senden({ ...anfrage, signal: k.signal, fortschritt: k.fortschritt });
    eintrag.antwort = { text: a.text, inhalt: a.inhalt, stopGrund: a.stopGrund, runden: a.runden };
    eintrag.nutzung = a.nutzung;
    eintrag.kostenUsd = a.kostenUsd;
    eintrag.modell = a.modell;
    return a;
  } catch (e: any) {
    eintrag.fehler = e?.name === "AbortError" ? "abgebrochen" : String(e?.message || e);
    // Nach einem Abbruch kann der Anbieter schon gearbeitet haben: Kosten unbekannt, nicht 0
    eintrag.kostenUsd = kostenNachFehler(e);
    if (Array.isArray(e?.teilinhalt) && e.teilinhalt.length) {
      eintrag.antwort = { text: "", inhalt: e.teilinhalt, stopGrund: "abgebrochen", runden: 0 };
    }
    throw e;
  } finally {
    eintrag.ende = new Date().toISOString();
    eintrag.dauerMs = Date.parse(eintrag.ende) - Date.parse(eintrag.start);
    const kosten = kostenStand(k.lauf);
    k.lauf.kostenUsd = kosten.vollstaendig ? kosten.bekannt : null;
    if (kosten.vollstaendig) delete k.lauf.kostenBekanntUsd;
    else k.lauf.kostenBekanntUsd = kosten.bekannt;
    k.lauf.aktualisiert = eintrag.ende;
    await k.aktualisiert(k.lauf);
  }
}

function auftragsText(k: Kontext): string {
  const a = k.lauf.auftrag;
  return [
    `Sachverhalt und Erkenntnisinteresse: ${a.sachverhalt.trim() || "(nicht angegeben, aus dem Material ableiten)"}`,
    `Meldestichtag: ${a.stichtag}`,
    a.meldezeitpunkt ? `Meldezeitpunkt t0 (vorgegeben): ${a.meldezeitpunkt.replace("T", " ")}` : "",
    `Besondere Prüffrage: ${a.prueffrage.trim() || "keine"}`,
    `Aktueller Zeitpunkt (${k.profil.manifest.variablen.zeitzone || "Europe/Berlin"}): ${jetztLokal(k.profil.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date())}`,
  ].join("\n");
}

// ── S1 ─────────────────────────────────────────────────────────────────────────

export async function stufe1(k: Kontext): Promise<S1Vorschlag> {
  k.lauf.status = "s1";
  const verdichtung = istVerdichtung(k.material);
  const vermerke = verdichtung
    ? redaktionsvermerke(
        k.material,
        k.profil,
        k.lauf.auftrag.meldezeitpunkt || juengsterEingang(k.material) || jetztLokal(k.profil.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date()),
      )
    : "";
  const inhalt = [
    { type: "text", text: `# Auftrag\n\n${auftragsText(k)}` },
    ...materialBloecke(k.material, k.lauf.auftrag.urls, k.lauf.auftrag.stichworte),
    ...(vermerke ? [{ type: "text", text: vermerke }] : []),
    { type: "text", text: "Kläre jetzt den Gegenstand und schlage Gliederung, Ereignisarten und SOPs vor." },
  ];
  // Ausgabegrenze aus den Einstellungen wie für alle KI-Aufrufe (Vorgabe 128 000). Denk- und Antworttoken zählen
  // gemeinsam: Die frühere feste Grenze von 16 000 reichte bei Verdichtungen mit Haiku „high“ nicht (Läufe
  // 20261021-133605-75wi und 20261021-133728-cvza endeten nach 69–72 s bei genau 16 000 Token mit max_tokens).
  const modell = modellFuer("vorverarbeitung", k.einstellungen, k.profil);
  const aufwand = k.einstellungen.aufwand.vorverarbeitung;
  const maxTokens = k.einstellungen.maxTokensErfassung;
  const a = await aufrufen(k, "S1 Gegenstand und SOP-Auswahl", {
    modell,
    aufwand,
    maxTokens,
    system: [{ text: s1System(k.profil, verdichtung), cache: true }],
    nachrichten: [{ role: "user", content: inhalt }],
    jsonSchema: s1Schema(
      k.profil,
      k.material.filter((m) => m.art === "eingang").map((m) => m.name),
    ),
  });
  const eintrag = k.lauf.stufen[k.lauf.stufen.length - 1];
  const z = zerlegeAntwort(a.text);
  const struktur = z.json === undefined ? null : s1Strukturfehler(z.json);
  const abgeschnitten = a.stopGrund === "max_tokens";
  if (z.json === undefined || struktur) {
    // Die Ursache (Ausgabegrenze, leere Antwort) geht vor dem Parserbefund; nichts wird repariert oder ergänzt
    const technisch = struktur || z.fehler || "";
    let meldung: string;
    if (abgeschnitten) {
      eintrag.notiz = `S1-Ausgabegrenze von ${tausender(maxTokens)} Token erreicht; kein vollständiger Vorschlag. Sichtbarer Text: ${tausender(a.text.length)} Zeichen.`;
      meldung = `S1 hat die Ausgabegrenze von ${tausender(maxTokens)} Token erreicht, bevor ein vollständiger Vorschlag vorlag (Modell ${modell}, Aufwand ${aufwand ?? "Standard"}). Eingaben und Laufprotokoll bleiben erhalten.${technisch ? ` Technisch: ${technisch}` : ""}`;
    } else if (!a.text.trim()) {
      eintrag.notiz = `Leere Antwort (stopGrund ${a.stopGrund || "unbekannt"}).`;
      meldung = `Stufe S1 lieferte eine leere Antwort (Modell ${modell}, Abbruchgrund ${a.stopGrund || "unbekannt"}). Eingaben und Laufprotokoll bleiben erhalten.`;
    } else {
      meldung =
        `Stufe S1 lieferte kein auswertbares Ergebnis. ${technisch}${a.stopGrund && a.stopGrund !== "end_turn" ? ` (Abbruchgrund ${a.stopGrund})` : ""}`.trim();
    }
    await k.aktualisiert(k.lauf);
    throw new Error(meldung);
  }
  const v = bereinigeVorschlag(z.json as S1Vorschlag, k);
  if (abgeschnitten) {
    // Vollständig und strukturell geprüft, aber an der Grenze beendet: zur Bestätigung, mit sichtbarem Prüfbedarf
    eintrag.notiz = `S1-Ausgabegrenze von ${tausender(maxTokens)} Token erreicht; der Vorschlag ist technisch vollständig.`;
    v.appHinweise = [
      ...(v.appHinweise || []),
      `S1 hat die Ausgabegrenze von ${tausender(maxTokens)} Token erreicht. Der Vorschlag ist technisch vollständig; bitte Gliederung, Zuordnung der Eingänge und SOPs besonders sorgfältig prüfen.`,
    ];
  }
  k.lauf.vorschlag = v;
  k.lauf.status = "bestaetigen";
  await k.aktualisiert(k.lauf);
  return v;
}

function bereinigeVorschlag(v: S1Vorschlag, k: Kontext): S1Vorschlag {
  const ids = new Set(fachSops(k.profil).map((s) => s.id));
  const eingaenge = new Set(k.material.filter((m) => m.art === "eingang").map((m) => m.name));
  const appHinweise: string[] = [];
  const jetzt = jetztLokal(k.profil.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date());
  const eingang = juengsterEingang(k.material);
  const kiT0 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v.meldezeitpunkt || "") ? v.meldezeitpunkt!.slice(0, 16) : "";
  let t0: string;
  if (k.lauf.auftrag.meldezeitpunkt) t0 = k.lauf.auftrag.meldezeitpunkt;
  else if (kiT0 && eingang && istVerdichtung(k.material) && (kiT0 < eingang || zeitwert(kiT0) - zeitwert(eingang) > T0_SPIELRAUM_STUNDEN * 3_600_000)) {
    // Verdichtung: t0 gehört kurz hinter den jüngsten Eingang (SOP-LEAD A.7), nicht auf die aktuelle Uhrzeit
    t0 = eingang;
    appHinweise.push(
      `Meldezeitpunkt t0 auf den jüngsten Eingang gesetzt (${zeitText(eingang)}). Der Vorschlag aus S1 (${zeitText(kiT0)}) lag ${
        kiT0 < eingang ? "vor dem jüngsten Eingang" : `mehr als ${T0_SPIELRAUM_STUNDEN} Stunden danach`
      }. Soll die Meldung einen späteren Stand abbilden, gib t0 hier oder im Auftrag vor.`,
    );
  } else t0 = kiT0 || eingang || jetzt;

  // Prüffragen stellt die Person. Ohne Prüffrage im Auftrag bleibt ein Vorschlag aus S1 ein Vorschlag.
  const auftragsfrage = (k.lauf.auftrag.prueffrage || "").trim();
  const kiFrage = String(v.prueffrage || "").trim();
  return {
    gegenstand: String(v.gegenstand || ""),
    stichtag: /^\d{4}-\d{2}-\d{2}$/.test(v.stichtag || "") ? v.stichtag : k.lauf.auftrag.stichtag,
    meldezeitpunkt: t0,
    referenzbezug: String(v.referenzbezug || ""),
    horizont: String(v.horizont || ""),
    sachverhalte: (Array.isArray(v.sachverhalte) && v.sachverhalte.length ? v.sachverhalte : [{ titel: "", ereignisarten: [], sops: [], begruendung: "" }]).map(
      (s) => ({
        titel: String(s.titel || ""),
        ereignisarten: Array.isArray(s.ereignisarten) ? s.ereignisarten.map(String) : [],
        sops: Array.isArray(s.sops) ? sopIdsAufloesen(k.profil, s.sops.map(String)).filter((x) => ids.has(x)) : [],
        begruendung: String(s.begruendung || ""),
        ...(eingaenge.size
          ? { eingangsmeldungen: Array.isArray(s.eingangsmeldungen) ? s.eingangsmeldungen.map(String).filter((x) => eingaenge.has(x)) : [] }
          : {}),
      }),
    ),
    prueffrage: auftragsfrage ? kiFrage || auftragsfrage : "",
    ...(!auftragsfrage && kiFrage ? { prueffrageVorschlag: kiFrage } : {}),
    hinweise: String(v.hinweise || ""),
    ...(appHinweise.length ? { appHinweise } : {}),
  };
}

// ── S2 und S3 ──────────────────────────────────────────────────────────────────

/** Feste Felder setzen, die die App verantwortet (Schemakennung, Status, Herkunft, Variablen). */
/**
 * Felder, die die eigene Meldungsidentität bilden (Land, meldende Stelle). Sie werden aus dem Profil
 * gesetzt, nicht nur ergänzt: Ein KI-Entwurf darf nicht unter dem Absender einer Eingangsmeldung stehen.
 */
function identitaetsFelder(p: Profil): string[] {
  const r = p.ui.rollen;
  return [r.land, r.meldende_stelle].filter((f): f is string => !!f && !!p.manifest.variablen[f]);
}

export function nachbearbeiten(
  roh: unknown,
  k: Kontext,
  modell: string,
  korrekturen: string[] = [],
  sopHinweise: string[] = [],
  umhaengungen: string[] = [],
): Meldung {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) throw new Error("Das Ergebnis ist kein JSON-Objekt.");
  const p = k.profil;
  const r = p.ui.rollen;
  const d: Meldung = structuredClone(roh as Meldung);
  const props = p.schema.properties || {};
  d[r.schema_feld] = aufloesen(props[r.schema_feld], p.schema)?.const ?? p.manifest.meldung.schema_id;
  d[r.status_feld] = r.status_entwurf;
  const identitaet = identitaetsFelder(p);
  for (const [key, wert] of Object.entries(p.manifest.variablen)) {
    if (!(key in props)) continue;
    if (identitaet.includes(key)) {
      // Hinterlegte Aliasnamen der eigenen Stelle bleiben stehen
      if (key === p.ui.rollen.meldende_stelle && istEigeneStelle(d[key], p.manifest)) continue;
      if (d[key] !== undefined && d[key] !== "" && d[key] !== wert) korrekturen.push(`${key}: „${String(d[key])}“ → „${wert}“`);
      d[key] = wert;
    } else if (d[key] === undefined || d[key] === "") d[key] = wert;
  }
  radarUmhaengen(d, p, umhaengungen);
  const t0 = k.lauf.bestaetigt?.meldezeitpunkt;
  if (r.meldezeitpunkt && t0) d[r.meldezeitpunkt] = t0;
  else if (r.meldezeitpunkt && !d[r.meldezeitpunkt]) d[r.meldezeitpunkt] = jetztLokal(p.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date());
  if (r.entstehung_feld && props[r.entstehung_feld]) {
    const def = aufloesen(props[r.entstehung_feld], p.schema);
    const erlaubt = def?.properties || {};
    const e: Record<string, unknown> = d[r.entstehung_feld] && typeof d[r.entstehung_feld] === "object" ? { ...d[r.entstehung_feld] } : {};
    const verfahren = aufloesen(erlaubt.verfahren, p.schema);
    if ("verfahren" in erlaubt && (!verfahren?.enum || verfahren.enum.includes("KI-Entwurf"))) e.verfahren = "KI-Entwurf";
    if ("werkzeug" in erlaubt) e.werkzeug = `${k.lauf.app} · Profil ${p.manifest.id} ${p.manifest.version} · Lauf ${k.lauf.id}`;
    if ("modell" in erlaubt) e.modell = modell;
    if ("erstellt" in erlaubt) e.erstellt = jetztLokal(p.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date());
    const ids = new Set(
      sopIdsAufloesen(
        p,
        (k.lauf.bestaetigt?.sachverhalte || []).flatMap((s) => s.sops),
      ),
    );
    if ("sop" in erlaubt) {
      // Nachweis = tatsächlich beigefügte SOPs und Bausteine (aus der zusammengestellten Anfrage), unabhängig vom
      // Antwortformat des Modells. Die Angabe des Modells zur Anwendung wird nur verglichen.
      const beigefuegt = fachSops(p).filter((s) => ids.has(s.id));
      sopHinweise.push(
        ...sopAngabeVergleichen(
          e.sop,
          p,
          beigefuegt.map((s) => s.id),
        ),
      );
      e.sop = beigefuegt.map(sopKennung);
    }
    const kl = kodierleitfadenKennung(p);
    if ("kodierleitfaden" in erlaubt && kl) e.kodierleitfaden = kl;
    d[r.entstehung_feld] = e;
  }
  return d;
}

/**
 * Lagenradar, das die KI eine Ebene zu hoch abgelegt hat (z. B. `sachverhalte[i].lagenradar` statt
 * `sachverhalte[i].sofort.lagenradar`), an die vorgesehene Stelle setzen. Nur wenn die Zuordnung eindeutig ist:
 * Das Schema kennt das Feld auf der oberen Ebene nicht, der abgelegte Wert ist ein Objekt, die übergeordnete
 * Stelle ist ein Objekt oder fehlt, und an der vorgesehenen Stelle steht noch nichts. Sonst bleibt alles, wie es
 * ist, und Schemaprüfung bzw. Reparatur greifen wie bisher.
 */
export function radarUmhaengen(d: Meldung, p: Profil, meldungen: string[] = []): void {
  const r = p.ui.rollen;
  const pfad = (r.sv_radar || "").split(".").filter(Boolean);
  if (!r.sachverhalte || pfad.length < 2 || pfad.some((x) => /[\[\]*]/.test(x))) return;
  const liste = holeWert(d, r.sachverhalte);
  if (!Array.isArray(liste)) return;
  const feld = pfad[pfad.length - 1];
  const eltern = pfad.slice(0, -1);
  const svSchema = aufloesen(aufloesen(p.schema.properties?.[r.sachverhalte], p.schema)?.items, p.schema);
  if (svSchema?.properties && feld in svSchema.properties) return;
  liste.forEach((sv: any, i: number) => {
    if (!sv || typeof sv !== "object" || Array.isArray(sv)) return;
    const wert = sv[feld];
    if (!wert || typeof wert !== "object" || Array.isArray(wert)) return;
    let ziel: any = sv;
    for (const seg of eltern) {
      if (ziel[seg] === undefined) ziel[seg] = {};
      if (!ziel[seg] || typeof ziel[seg] !== "object" || Array.isArray(ziel[seg])) return;
      ziel = ziel[seg];
    }
    if (ziel[feld] !== undefined) return;
    ziel[feld] = wert;
    delete sv[feld];
    meldungen.push(`Sachverhalt ${i + 1}: Lagenradar von „${feld}“ nach „${pfad.join(".")}“ verschoben`);
  });
}

/**
 * Kennung des Kodierleitfadens aus seinem Kopf: Titel bis zum Gedankenstrich und „Fassung x.y“,
 * z. B. „Kodierleitfaden LEAD 1.2“. Ohne erkennbare Fassung: undefined (der Eintrag des Modells bleibt).
 */
export function kodierleitfadenKennung(p: Profil): string | undefined {
  const pfad = p.manifest.kodierleitfaden;
  const text = pfad ? p.dateien[pfad] : "";
  if (!text) return undefined;
  const titel = (text.match(/^#\s+(.+)$/m)?.[1] || "").split(/\s+[–-]\s+/)[0].trim();
  const fassung = text.slice(0, 800).match(/Fassung\s+(\d+(?:\.\d+)*)/)?.[1];
  return titel && fassung ? `${titel} ${fassung}` : undefined;
}

/**
 * Vergleicht die Angabe des Modells in `_entstehung.sop` mit den beigefügten SOPs und liefert Prüfhinweise:
 * fehlende Angabe, nicht beigefügte oder unbekannte Einträge, beigefügte, aber nicht als angewandt genannte.
 */
export function sopAngabeVergleichen(angabe: unknown, p: Profil, beigefuegtIds: string[]): string[] {
  const beigefuegt = fachSops(p).filter((s) => beigefuegtIds.includes(s.id));
  const kennung = (id: string) => sopKennung(fachSops(p).find((s) => s.id === id)!);
  if (!Array.isArray(angabe)) return beigefuegt.length ? ["Die KI hat nicht angegeben, welche der beigefügten SOPs und Bausteine sie angewandt hat."] : [];
  const genannt = sopKennungenAbgleichen(angabe, p);
  const unbekannt = angabe.filter((x) => !sopKennungenAbgleichen([x], p).length).map(String);
  const genanntIds = fachSops(p)
    .filter((s) => genannt.includes(sopKennung(s)))
    .map((s) => s.id);
  const h: string[] = [];
  const fremd = genanntIds.filter((id) => !beigefuegtIds.includes(id));
  if (fremd.length) h.push(`Die KI nennt SOPs als angewandt, die nicht beigefügt waren (verworfen): ${fremd.map(kennung).join("; ")}.`);
  if (unbekannt.length) h.push(`Die KI nennt unbekannte SOP-Kennungen (verworfen): ${unbekannt.join("; ")}.`);
  const nicht = beigefuegt.filter((s) => !genanntIds.includes(s.id));
  if (nicht.length) h.push(`Beigefügt, von der KI aber nicht als angewandt genannt: ${nicht.map(sopKennung).join("; ")}.`);
  return h;
}

/**
 * Gleicht die vom Modell genannten SOP-Kennungen mit dem Profil ab: bekannte Nummern (auch frühere) erhalten die
 * Kennung mit gültiger Fassung; unbekannte Einträge entfallen. Mit `beigefuegt` entfallen außerdem alle nicht
 * beigefügten SOPs – auch bei leerer Menge (dann bleibt nichts). Ohne `beigefuegt` wird nur normalisiert.
 */
export function sopKennungenAbgleichen(liste: unknown[], p: Profil, beigefuegt?: Set<string>): string[] {
  const norm = (n: string) => n.toUpperCase().padStart(2, "0");
  const out: string[] = [];
  for (const eintrag of liste) {
    const nr = String(eintrag ?? "").match(/SOP-LEAD\s+([A-Z]?\d{1,2})\b/i)?.[1];
    // aktuelle Kennung (B08, C07) vor früherer (08, N05)
    const sop = nr
      ? fachSops(p).find((s) => s.nummer && norm(s.nummer) === norm(nr)) || fachSops(p).find((s) => s.bisherigeKennung && norm(s.bisherigeKennung) === norm(nr))
      : undefined;
    if (!sop || (beigefuegt && !beigefuegt.has(sop.id))) continue;
    const kennung = sopKennung(sop);
    if (!out.includes(kennung)) out.push(kennung);
  }
  return out;
}

function reparaturSystem(p: Profil): string {
  return `Du korrigierst eine Meldung so, dass sie dem beigefügten JSON-Schema entspricht. Inhalte, Bewertungen, Radarwerte und Quellen bleiben unverändert, soweit die Korrektur es zulässt. Recherchiere nicht neu und ergänze keine Fakten. Wo ein Pflichtwert inhaltlich nicht belegt ist, verwende den im Schema vorgesehenen Leerwert. Gib ausschließlich das vollständige, korrigierte JSON-Objekt in einem Codeblock aus, der mit \`\`\`json beginnt.

# JSON-Schema (Schemakennung ${p.manifest.meldung.schema_id})

\`\`\`json
${JSON.stringify(p.schema, null, 1)}
\`\`\``;
}

export interface S2Ergebnis {
  meldung?: Meldung;
  kurzantwort: string;
  schemaBefunde: SchemaBefund[];
  befunde: Befund[];
}

export async function stufe2und3(k: Kontext, bestaetigt: S1Vorschlag): Promise<S2Ergebnis> {
  const p = k.profil;
  const e = k.einstellungen;
  // Frühere SOP-IDs aus gespeicherten Läufen (z. B. „sop-08“) auf die aktuellen abbilden
  bestaetigt = { ...bestaetigt, sachverhalte: bestaetigt.sachverhalte.map((s) => ({ ...s, sops: sopIdsAufloesen(p, s.sops) })) };
  k.lauf.bestaetigt = bestaetigt;
  k.lauf.status = "s2";
  await k.aktualisiert(k.lauf);

  const sopIds = [...new Set(bestaetigt.sachverhalte.flatMap((s) => s.sops))];
  const ausgang = materialUebersicht(k.material, k.lauf.auftrag.urls, k.lauf.auftrag.stichworte);
  const auftrag = auftragAusBestaetigung(bestaetigt, p, ausgang);
  const t0 = bestaetigt.meldezeitpunkt || jetztLokal(p.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date());
  const verdichtung = istVerdichtung(k.material);
  const rolleS2 = verdichtung ? "verdichtung" : "erfassung";
  const erfassungsModell = modellFuer(rolleS2, e, p);
  const recherche = k.lauf.auftrag.websuche !== false;
  const n = bestaetigt.sachverhalte.length;

  const inhalt = [
    ...materialBloecke(k.material, k.lauf.auftrag.urls, k.lauf.auftrag.stichworte),
    {
      type: "text",
      text: [
        `Erstelle jetzt die Meldung nach der Arbeitsanweisung${verdichtung ? " und dem Zusatz zur Verdichtung" : ""}.`,
        `Bestätigte Gliederung (verbindlich, genau ${n} Sachverhalt${n === 1 ? "" : "e"} in dieser Reihenfolge): ${auftrag.ereignisarten}. Hältst du den Zuschnitt fachlich für korrekturbedürftig, behältst du ihn bei und benennst den Bedarf mit den betroffenen Sachverhalten in der Kurzantwort.`,
        `Meldezeitpunkt t0: ${t0.replace("T", " ")} (${p.manifest.variablen.zeitzone || "Europe/Berlin"}). Stichtag: ${auftrag.stichtag}.`,
        k.material.some((m) => m.art === "meldung") ? "Eine eigene Vormeldung liegt bei; schreibe sie nach SOP-LEAD A.8 fort." : "",
        recherche ? "" : "Websuche und Seitenabruf sind für diesen Auftrag abgeschaltet; arbeite nur mit dem Material.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
  const systemS2 = [
    { text: profilGrundlagen(p), cache: true },
    { text: sopBlock(p, sopIds), cache: true },
    { text: anweisungErfassung(p, auftrag, t0) },
    ...(verdichtung ? [{ text: verdichtungsAnweisung(p) }] : []),
  ];
  const vermerke = verdichtung ? redaktionsvermerke(k.material, p, t0) : "";
  if (vermerke) systemS2.push({ text: vermerke });
  const a = await aufrufen(k, verdichtung ? "S2 Verdichtung" : "S2 Recherche und Entwurf", {
    modell: erfassungsModell,
    aufwand: e.aufwand[rolleS2],
    maxTokens: e.maxTokensErfassung,
    system: systemS2,
    nachrichten: [{ role: "user", content: inhalt }],
    werkzeuge: !recherche
      ? undefined
      : {
          websuche: e.websucheMax > 0 ? { maxUses: e.websucheMax, land: e.suchland || undefined, zeitzone: p.manifest.variablen.zeitzone } : undefined,
          abruf: e.abrufMax > 0 ? { maxUses: e.abrufMax, maxTokens: e.abrufMaxTokens || undefined } : undefined,
        },
  });

  let z = zerlegeAntwort(a.text);
  const kurzantwort = z.kurzantwort;
  let modell = a.modell;
  const s2 = k.lauf.stufen[k.lauf.stufen.length - 1];
  if (a.stopGrund === "max_tokens" && z.json === undefined) {
    // Abgeschnitten (meist durch langes Nachdenken): Meldung ohne Recherche vervollständigen lassen.
    s2.notiz = "Antwort an der Token-Grenze abgeschnitten; die App hat die Meldung in einem zweiten Schritt vervollständigen lassen.";
    const v = await aufrufen(k, "S3 Vervollständigung", {
      modell: erfassungsModell,
      aufwand: "low",
      maxTokens: e.maxTokensErfassung,
      system: [
        ...systemS2,
        {
          text: "## Vervollständigung (von der App)\n\nDein vorheriger Entwurf wurde an der Längengrenze abgeschnitten. Gib jetzt ausschließlich die vollständige Meldung als einen JSON-Codeblock aus, ohne Kurzantwort. Übernimm die bereits geschriebenen Inhalte, ergänze die fehlenden Teile nach denselben Regeln und nur aus dem Material. Recherchiere nicht neu und denke knapp.",
        },
      ],
      nachrichten: [
        {
          role: "user",
          content: [
            ...materialBloecke(k.material, k.lauf.auftrag.urls, k.lauf.auftrag.stichworte),
            {
              type: "text",
              text: `Bestätigte Gliederung: ${auftrag.ereignisarten}. Meldezeitpunkt t0: ${t0.replace("T", " ")}.\n\nAbgeschnittener Entwurf:\n\n${a.text}`,
            },
          ],
        },
      ],
    });
    z = { ...zerlegeAntwort(v.text), kurzantwort: z.kurzantwort };
    modell = v.modell;
    if (v.stopGrund === "max_tokens") k.lauf.stufen[k.lauf.stufen.length - 1].notiz = "Auch die Vervollständigung wurde abgeschnitten.";
  } else if (a.stopGrund === "max_tokens") s2.notiz = "Antwort an der Token-Grenze abgeschnitten.";

  k.lauf.status = "s3";
  let meldung: Meldung | undefined;
  let schemaBefunde: SchemaBefund[] = [];
  let korrekturen: string[] = [];
  let sopHinweise: string[] = [];
  let umhaengungen: string[] = [];
  for (let runde = 0; ; runde++) {
    if (z.json !== undefined) {
      try {
        korrekturen = [];
        sopHinweise = [];
        umhaengungen = [];
        meldung = nachbearbeiten(z.json, k, modell, korrekturen, sopHinweise, umhaengungen);
        schemaBefunde = pruefeGegenSchema(p.schema, meldung, p.ui);
      } catch (err: any) {
        meldung = undefined;
        schemaBefunde = [{ pfad: "", keyword: "typ", text: String(err.message) }];
      }
    } else {
      schemaBefunde = [{ pfad: "", keyword: "json", text: z.fehler || "Kein JSON." }];
    }
    const eintrag = k.lauf.stufen[k.lauf.stufen.length - 1];
    eintrag.befunde = schemaBefunde.map((b) => b.text);
    await k.aktualisiert(k.lauf);
    if (!schemaBefunde.length || runde >= MAX_REPARATUREN) break;
    if (z.json === undefined && /unvollständig/.test(z.fehler || "")) break; // weiterhin abgeschnitten: Reparatur hilft nicht

    const entwurf = z.json !== undefined ? JSON.stringify(z.json, null, 1) : z.jsonText || "";
    const r = await aufrufen(k, `S3 Reparatur ${runde + 1}`, {
      modell: modellFuer("reparatur", e, p),
      aufwand: e.aufwand.reparatur,
      maxTokens: e.maxTokensErfassung,
      system: [{ text: reparaturSystem(p), cache: true }],
      nachrichten: [
        {
          role: "user",
          content: `Prüfbericht der App (${schemaBefunde.length} Befund${schemaBefunde.length === 1 ? "" : "e"}):\n${schemaBefunde
            .slice(0, 80)
            .map((b) => `- ${b.pfad || "(gesamt)"}: ${b.text}`)
            .join("\n")}\n\nEntwurf:\n\`\`\`json\n${entwurf}\n\`\`\``,
        },
      ],
    });
    z = zerlegeAntwort(r.text);
    modell = r.modell;
  }

  const befunde: Befund[] = meldung ? [...quellenHinweise(meldung, p.ui), ...pflichtHinweise(meldung, p.ui)] : [];
  const svAnzahl = meldung ? (holeWert(meldung, p.ui.rollen.sachverhalte) || []).length : n;
  if (meldung && korrekturen.length)
    befunde.unshift({ stufe: "warnung", text: `Absender auf die eigene Stelle korrigiert (der Entwurf nannte eine andere): ${korrekturen.join("; ")}.` });
  // Nachweis „beigefügte SOPs“ setzt die App; Abweichungen der KI-Angabe zur Anwendung als Prüfhinweis
  if (meldung) for (const t of sopHinweise) befunde.push({ stufe: "hinweis", text: `SOP-Nachweis: ${t}` });
  if (meldung && umhaengungen.length) befunde.push({ stufe: "hinweis", text: `Von der App korrigiert: ${umhaengungen.join("; ")}.` });
  if (meldung)
    for (const f of auftragsAbrufFehler(k.lauf.auftrag.urls, a.abrufFehler))
      befunde.unshift({
        stufe: "warnung",
        text: `Die Seite aus dem Auftrag konnte nicht abgerufen werden (${f.url}, Grund: ${f.code}). Der Entwurf stützt sich auf andere Quellen und gibt den Inhalt dieser Seite nicht wieder. Soll die Seite selbst ausgewertet werden: Inhalt als PDF oder Text beifügen und S2 erneut starten.`,
      });
  if (meldung && verdichtung) {
    const z = eingangsquellenPruefen(k.material, meldung, p);
    const liste = (st: string) => z.filter((x) => x.status === st).map((x) => `${x.stelle}${x.eintrag ? ` [Q${x.eintrag}]` : ""}`);
    if (liste("fehlt").length)
      befunde.unshift({
        stufe: "warnung",
        text: `Eingangsmeldung ohne eigenen Eintrag im Quellenverzeichnis (SOP-LEAD A.7; Kategorie nach der Rolle der meldenden Stelle, bei Behörden A): ${liste("fehlt").join("; ")}.`,
      });
    if (liste("kategorie").length)
      befunde.unshift({
        stufe: "warnung",
        text: `Eingangsmeldung im Quellenverzeichnis nicht als Kategorie A geführt: ${liste("kategorie").join("; ")}. Zulässig nur, wenn die meldende Stelle keine Behörde ist (dann B oder P nach ihrer Rolle, Kodierleitfaden Abschnitt 5).`,
      });
    if (liste("unsicher").length)
      befunde.unshift({
        stufe: "hinweis",
        text: `Zuordnung zum Quellenverzeichnis unsicher (Stelle oder Zeitstand nicht eindeutig genannt): ${liste("unsicher").join("; ")}.`,
      });
  }
  if (meldung && svAnzahl !== n)
    befunde.unshift({ stufe: "warnung", text: `Der Entwurf hat ${svAnzahl} Sachverhalt(e), bestätigt waren ${n}. Bitte Gliederung prüfen.` });
  k.lauf.ergebnis = meldung
    ? { meldung, kurzantwort, befunde, fundstellen: a.fundstellen, suchen: a.suchen, abrufFehler: a.abrufFehler, schemakonform: schemaBefunde.length === 0 }
    : undefined;
  k.lauf.status = meldung ? "fertig" : "fehler";
  if (!meldung) k.lauf.fehler = schemaBefunde.map((b) => b.text).join(" ");
  k.lauf.aktualisiert = new Date().toISOString();
  await k.aktualisiert(k.lauf);
  return { meldung, kurzantwort, schemaBefunde, befunde };
}

/** Abruffehler, die eine im Auftrag genannte URL betreffen (je URL einmal). */
export function auftragsAbrufFehler(urls: string[] | undefined, fehler: { url: string; code: string }[] | undefined): { url: string; code: string }[] {
  const norm = (u: string) => u.trim().replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();
  const auftrag = new Set((urls || []).map(norm));
  const gesehen = new Set<string>();
  return (fehler || []).filter((f) => {
    const n = norm(f.url || "");
    if (!auftrag.has(n) || gesehen.has(n)) return false;
    gesehen.add(n);
    return true;
  });
}
