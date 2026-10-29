// Nachbearbeitung des Entwurfs durch die App vor der Schemaprüfung: Identität und Absender, Lagenradar an der
// vorgesehenen Stelle, SOP-Nachweis und Kodierleitfaden, seit 0.6.9 Kennungen, Bezug und Zeitstrahl (zeitstrahl.ts). Seit 0.6.2 eigene Datei (TP-2026-W44-06), vorher in stufen.ts.

import { jetztLokal } from "../kern/ausgabe";
import { holeWert } from "../kern/pfad";
import { aufloesen } from "../kern/schema";
import type { Befund, Meldung, Profil } from "../kern/typen";
import { istEigeneStelle } from "../kern/ui";
import { sopKennung } from "../profil/sop";
import { fachSops, sopIdsAufloesen } from "./kontext";
import { absenderFuer } from "./material";
import type { Kontext } from "./stufen";
import { zeitstrahlNachbearbeiten } from "./zeitstrahl";

/** Feste Felder setzen, die die App verantwortet (Schemakennung, Status, Herkunft, Variablen). */
/**
 * Felder, die die eigene Meldungsidentität bilden (Land, meldende Stelle). Sie werden gesetzt, nicht nur ergänzt:
 * Ein KI-Entwurf darf nicht unter dem Absender einer Eingangsmeldung stehen. Quelle ist die eigene Vormeldung,
 * sonst das Profil (absenderFuer).
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
  zeitstrahlBefunde: Befund[] = [],
): Meldung {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) throw new Error("Das Ergebnis ist kein JSON-Objekt.");
  const p = k.profil;
  const r = p.ui.rollen;
  const d: Meldung = structuredClone(roh as Meldung);
  const props = p.schema.properties || {};
  d[r.schema_feld] = aufloesen(props[r.schema_feld], p.schema)?.const ?? p.manifest.meldung.schema_id;
  d[r.status_feld] = r.status_entwurf;
  const identitaet = identitaetsFelder(p);
  const absender = absenderFuer(k.material, p);
  const soll = (key: string, profilWert: string) =>
    absender.herkunft === "vormeldung" && key === r.land
      ? absender.land
      : absender.herkunft === "vormeldung" && key === r.meldende_stelle
        ? absender.stelle
        : profilWert;
  for (const [key, profilWert] of Object.entries(p.manifest.variablen)) {
    if (!(key in props)) continue;
    if (identitaet.includes(key)) {
      const wert = soll(key, profilWert);
      // Ohne Vormeldung bleiben hinterlegte Aliasnamen der eigenen Stelle stehen; mit Vormeldung gilt deren Name
      if (absender.herkunft === "profil" && key === r.meldende_stelle && istEigeneStelle(d[key], p.manifest)) continue;
      if (d[key] !== undefined && d[key] !== "" && d[key] !== wert) korrekturen.push(`${key}: „${String(d[key])}“ → „${wert}“`);
      d[key] = wert;
    } else if (d[key] === undefined || d[key] === "") d[key] = profilWert;
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
  // Kennungen, Bezug und Zeitstrahl (seit 0.6.9): nach Absender und t0, weil Präfix und Bewertungszeilen davon abhängen
  zeitstrahlNachbearbeiten(d, p, { material: k.material, jetzt: k.jetzt?.() ?? new Date() }, zeitstrahlBefunde);
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
  const feld = pfad[pfad.length - 1]!;
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
  const titel = ((text.match(/^#\s+(.+)$/m)?.[1] || "").split(/\s+[–-]\s+/)[0] ?? "").trim();
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
