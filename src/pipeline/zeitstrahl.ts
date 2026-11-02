// Nachbearbeitung von Sachverhaltskennung, Bezug und Zeitstrahl nach S2 (seit 0.6.9, ZS-2026-W44-01 bis -04), vor der
// Schemaprüfung. Die App verantwortet, was sich ohne Urteil festlegen lässt:
// - Kennungen vergibt nur die App. Fortgeschriebene Sachverhalte behalten die Kennung der eigenen Vormeldung; neue
//   (Platzhalter „NEU-n“, leer, erfunden oder von einer Eingangsmeldung übernommen) erhalten eine neue Kennung, die
//   die App auch in Zeitstrahl und Bezug einsetzt.
// - Bezug nennt nur Kennungen, die in Eingangs- oder Vormeldung vorkommen; Unbekanntes entfällt mit Warnung.
// - Zeilen des Zeitstrahls der Vormeldung bleiben wortgleich; fehlende werden wiederhergestellt, veränderte bleiben in
//   der Fassung der Vormeldung, die neue Fassung steht als eigene Zeile daneben.
// - Bewertungszeilen schreibt nur die App: bei der Fortschreibung je geänderter Beurteilung oder Tendenz eine Zeile
//   zum Meldezeitpunkt. Bewertungszeilen der KI entfallen.
// - Quellennummern der Vormeldung bleiben stabil (GK-2026-W44-02; Beispielprofil Kodierleitfaden Abschnitt 5, Justiz
//   Teil A, A.6 Nr. 1): Bezeichnet [Qn] in einer übernommenen Zeile nicht mehr dieselbe Quelle wie in der Vormeldung,
//   meldet die App den Konflikt, statt ihn zu lösen. Der Text nennt keine Abschnittsnummer (GK-2026-W44-08).

import { jetztLokal } from "../kern/ausgabe";
import { bezugVon, istKennung, kennungenDerMeldung, neueKennung, PLATZHALTER_RE } from "../kern/kennung";
import { holeWert, teilePfad } from "../kern/pfad";
import { parseQuellen, verweise } from "../kern/quellen";
import type { Befund, Meldung, Profil } from "../kern/typen";
import { istEigeneStelle } from "../kern/ui";
import { chronologisch, parseZeitstrahl, zeitstrahlKonfig, zeitstrahlZeile, type ZeitstrahlEintrag } from "../kern/zeitstrahl";
import type { Material } from "./material";

/** Eigene Vormeldungen (jüngste zuletzt) und Meldungen anderer Stellen im Material */
export function meldungenImMaterial(material: Material[], p: Profil): { eigene: Meldung[]; fremde: Meldung[] } {
  const r = p.ui.rollen;
  const text = (m: Meldung, rolle: string | undefined) => (rolle ? String(holeWert(m, rolle) ?? "").trim() : "");
  const vor = (material || []).filter((m) => m.art === "meldung" && m.meldung).map((m) => m.meldung!);
  const eigene = r.meldende_stelle ? vor.filter((m) => istEigeneStelle(text(m, r.meldende_stelle), p.manifest)) : vor;
  const fremde = [...vor.filter((m) => !eigene.includes(m)), ...(material || []).filter((m) => m.art === "eingang" && m.meldung).map((m) => m.meldung!)];
  eigene.sort((a, b) => text(a, r.meldezeitpunkt).localeCompare(text(b, r.meldezeitpunkt)));
  return { eigene, fremde };
}

/** Angaben für den Steuerungsblock: Kennungen der jüngsten eigenen Vormeldung und nächste Nummer im Zeitstrahl */
export function zeitstrahlVorgaben(material: Material[], p: Profil): { kennungen: string[]; naechsteZ: number } {
  const { eigene } = meldungenImMaterial(material, p);
  const vor = eigene[eigene.length - 1];
  const r = p.ui.rollen;
  const nrs = vor && r.zeitstrahl ? parseZeitstrahl(holeWert(vor, r.zeitstrahl)).eintraege.map((e) => e.nr) : [];
  return { kennungen: kennungenDerMeldung(vor, p.ui), naechsteZ: nrs.length ? Math.max(...nrs) + 1 : 1 };
}

/** Wert am Pfad setzen, fehlende Zwischenobjekte anlegen (Rollenpfade können verschachtelt sein) */
function setze(obj: any, pfad: string, wert: unknown): void {
  const segs = teilePfad(pfad);
  let ziel = obj;
  for (const seg of segs.slice(0, -1)) {
    if (!ziel[seg] || typeof ziel[seg] !== "object") ziel[seg] = {};
    ziel = ziel[seg];
  }
  ziel[segs[segs.length - 1]!] = wert;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
/** Inhalt einer Zeile ohne Nummer, zum Wiedererkennen umnummerierter Zeilen */
/** Inhalt ohne Nummer und ohne Kenntniszeit (die setzt die App) */
const inhalt = (e: Pick<ZeitstrahlEintrag, "zeit" | "kennung" | "typ" | "text">) => norm(zeitstrahlZeile({ ...e, nr: 0, aufgenommen: undefined }));
/**
 * Quellenidentität eines Eintrags im Quellenverzeichnis (GK-2026-W44-02, -09): Herausgeber, Datum, Titel und Fundstelle.
 * Ohne Nummer, Kategorie (Rolle der Quelle für die Aussage), Zugriffsdatum, Datenstand und Zugangsvermerke „(Paywall)“
 * und „nicht ausgewertet“; diese darf eine Fortschreibung nachführen (Kodierleitfaden Abschnitt 8.3, Regel 8).
 */
const quellKern = (text: string) =>
  norm(
    text
      .replace(/^\s*\[Q\d+\]\s*/, "")
      .replace(/^[A-ZÄÖÜ]{1,2}\s+[–-]\s+/, "")
      .replace(/\[Zugriff:[^\]]*\]/gi, "")
      .replace(/[.;,]?\s*Datenstand:[^\n[]*/gi, "")
      .replace(/\s*\(Paywall\)/gi, "")
      .replace(/[.;,]?\s*\(?nicht ausgewertet\)?/gi, ""),
  )
    .replace(/[\s.;,]+$/, "")
    .toLowerCase();

export interface ZeitstrahlUmgebung {
  material: Material[];
  /** Bearbeitungszeitpunkt (Anlagedatum neuer Kennungen) */
  jetzt: Date;
  /** Zufall für Tests */
  zufall?: () => number;
}

export function zeitstrahlNachbearbeiten(d: Meldung, p: Profil, u: ZeitstrahlUmgebung, befunde: Befund[] = []): void {
  const r = p.ui.rollen;
  const ui = p.ui;
  const liste = holeWert(d, r.sachverhalte);
  const svs: any[] = Array.isArray(liste) ? liste.filter((sv) => sv && typeof sv === "object" && !Array.isArray(sv)) : [];
  const { eigene, fremde } = meldungenImMaterial(u.material, p);
  const vor = eigene[eigene.length - 1];
  const vorSv = new Map<string, any>();
  if (vor && r.sv_kennung) {
    const vl = holeWert(vor, r.sachverhalte);
    for (const sv of Array.isArray(vl) ? vl : []) {
      const k = holeWert(sv, r.sv_kennung);
      if (istKennung(k)) vorSv.set(k, sv);
    }
  }
  const eigeneKennungen = new Set(eigene.flatMap((m) => kennungenDerMeldung(m, ui)));
  const fremdeKennungen = new Set(fremde.flatMap((m) => kennungenDerMeldung(m, ui)));
  const svName = (i: number) => `Sachverhalt ${i + 1}`;

  // 1. Kennungen
  // Platzhalter und erfundene Kennungen gelten in Zeitstrahl und Bezug als die neue; die Kennung einer anderen Stelle nur
  // im Zeitstrahl (im Bezug bleibt sie als Herkunft stehen)
  const zuordnung = new Map<string, string>();
  const fremdZuordnung = new Map<string, string>();
  if (r.sv_kennung) {
    const datum = jetztLokal(p.manifest.variablen.zeitzone || "Europe/Berlin", u.jetzt);
    const herkunft = r.land ? holeWert(d, r.land) : "";
    const vergeben = new Set<string>();
    const ersetzt: string[] = [];
    const fremdUebernommen: string[] = [];
    svs.forEach((sv, i) => {
      const roh = String(holeWert(sv, r.sv_kennung!) ?? "").trim();
      if (istKennung(roh) && vorSv.has(roh) && !vergeben.has(roh)) {
        vergeben.add(roh);
        return;
      }
      const neu = neueKennung(ui, herkunft, datum, [...vergeben, ...eigeneKennungen, ...fremdeKennungen], u.zufall);
      setze(sv, r.sv_kennung!, neu);
      vergeben.add(neu);
      if (!roh) return;
      if (PLATZHALTER_RE.test(roh)) {
        if (zuordnung.has(roh)) ersetzt.push(`${svName(i)}: Platzhalter „${roh}“ doppelt`);
        else zuordnung.set(roh, neu);
      } else if (fremdeKennungen.has(roh)) {
        fremdZuordnung.set(roh, neu);
        fremdUebernommen.push(`${svName(i)}: ${roh}`);
        if (r.sv_bezug) {
          const b = bezugVon(sv, ui);
          if (!b.includes(roh)) setze(sv, r.sv_bezug, [...b, roh]);
        }
      } else if (vergeben.has(roh) || zuordnung.has(roh) || fremdZuordnung.has(roh)) ersetzt.push(`${svName(i)}: „${roh}“ doppelt`);
      else {
        zuordnung.set(roh, neu);
        ersetzt.push(`${svName(i)}: „${roh}“`);
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
  }
  const umsetzen = (k: string) => zuordnung.get(k) ?? k;

  // 2. Bezug: bekannt sind Kennungen aus Eingangs- und Vormeldungen und die Bezüge der Vormeldungen (ein fortgeschriebener
  // Sachverhalt behält seinen Bezug, auch wenn die damaligen Eingänge nicht mehr beiliegen)
  if (r.sv_bezug) {
    const geerbt = [...eigene, ...fremde].flatMap((m) => {
      const l = holeWert(m, r.sachverhalte);
      return (Array.isArray(l) ? l : []).flatMap((sv) => bezugVon(sv, ui));
    });
    const bekannt = new Set([...eigeneKennungen, ...fremdeKennungen, ...geerbt]);
    const entfernt: string[] = [];
    const ohneBezug: number[] = [];
    svs.forEach((sv, i) => {
      const roh = holeWert(sv, r.sv_bezug!);
      const eigen = r.sv_kennung ? String(holeWert(sv, r.sv_kennung) ?? "") : "";
      if (roh === undefined && !fremdeKennungen.size) return;
      const liste = (Array.isArray(roh) ? roh : roh ? [roh] : []).map((x) => umsetzen(String(x ?? "").trim())).filter(Boolean);
      const gueltig = [...new Set(liste)].filter((k) => {
        if (k === eigen) return false;
        const ok = bekannt.has(k) || svs.some((x) => x !== sv && r.sv_kennung && holeWert(x, r.sv_kennung) === k);
        if (!ok) entfernt.push(`${svName(i)}: „${k}“`);
        return ok;
      });
      if (roh !== undefined || gueltig.length) setze(sv, r.sv_bezug!, gueltig);
      if (fremdeKennungen.size && !gueltig.length) ohneBezug.push(i + 1);
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
  }

  // 3. Zeitstrahl
  if (!r.zeitstrahl) return;
  const kz = zeitstrahlKonfig(ui);
  const roh = holeWert(d, r.zeitstrahl);
  const { eintraege, ungueltig } = parseZeitstrahl(roh);
  const ergebnisKennungen = new Set(svs.map((sv) => (r.sv_kennung ? String(holeWert(sv, r.sv_kennung) ?? "") : "")).filter(Boolean));
  // Zeilen mit Platzhaltern oder fremden Kennungen dem eigenen Sachverhalt zuordnen
  const umgehaengt: string[] = [];
  for (const e of eintraege) {
    if (zuordnung.has(e.kennung)) e.kennung = umsetzen(e.kennung);
    else if (fremdZuordnung.has(e.kennung)) e.kennung = fremdZuordnung.get(e.kennung)!;
    else if (!ergebnisKennungen.has(e.kennung) && fremdeKennungen.has(e.kennung) && r.sv_bezug) {
      const ziel = svs.filter((sv) => bezugVon(sv, ui).includes(e.kennung));
      if (ziel.length === 1 && r.sv_kennung) {
        umgehaengt.push(`[Z${e.nr}]`);
        e.kennung = String(holeWert(ziel[0], r.sv_kennung));
      }
    }
  }
  if (umgehaengt.length)
    befunde.push({
      stufe: "hinweis",
      code: "ZEITSTRAHL_UMGEHAENGT",
      text: `Zeilen mit der Kennung einer Eingangsmeldung dem eigenen Sachverhalt mit diesem Bezug zugeordnet: ${umgehaengt.join(", ")}.`,
    });

  const vorEintraege = vor ? parseZeitstrahl(holeWert(vor, r.zeitstrahl)).eintraege : [];
  const vorNr = new Map(vorEintraege.map((e) => [e.nr, e]));
  const vorInhalt = new Map(vorEintraege.map((e) => [inhalt(e), e]));
  const behalten: ZeitstrahlEintrag[] = [];
  const neue: ZeitstrahlEintrag[] = [];
  const getragen = new Set<number>();
  const veraendert: number[] = [];
  for (const e of eintraege) {
    const gleich = vorInhalt.get(inhalt(e));
    if (gleich && !getragen.has(gleich.nr)) {
      getragen.add(gleich.nr);
      behalten.push({ ...gleich });
      continue;
    }
    if (vorNr.has(e.nr)) veraendert.push(e.nr);
    neue.push(e);
  }
  const wiederhergestellt: number[] = [];
  for (const v of vorEintraege)
    if (!getragen.has(v.nr) && ergebnisKennungen.has(v.kennung)) {
      behalten.push({ ...v });
      getragen.add(v.nr);
      if (!veraendert.includes(v.nr)) wiederhergestellt.push(v.nr);
    }
  // Quellenidentität der übernommenen Zeilen: [Qn] muss dieselbe Quelle bezeichnen wie in der Vormeldung
  if (vor && r.quellen && behalten.length) {
    const vorQ = new Map(parseQuellen(holeWert(vor, r.quellen)).map((q) => [q.nr, quellKern(q.text)]));
    const neuListe = parseQuellen(holeWert(d, r.quellen));
    const neuQ = new Map(neuListe.map((q) => [q.nr, quellKern(q.text)]));
    const nrVon = new Map(neuListe.map((q) => [quellKern(q.text), q.nr]));
    const konflikte: string[] = [];
    for (const e of [...behalten].sort((a, b) => a.nr - b.nr))
      for (const n of [...verweise(e.text)].sort((a, b) => a - b)) {
        const alt = vorQ.get(n);
        if (alt === undefined || neuQ.get(n) === alt) continue;
        const jetzt = nrVon.get(alt);
        konflikte.push(
          `[Z${e.nr}] [Q${n}] (${jetzt !== undefined ? `Quelle der Vormeldung jetzt unter [Q${jetzt}]` : "Quelle der Vormeldung fehlt im Quellenverzeichnis"})`,
        );
      }
    if (konflikte.length)
      befunde.push({
        stufe: "warnung",
        code: "ZEITSTRAHL_QUELLE",
        text: `Quellennummern der Vormeldung bleiben bei der Fortschreibung stabil (Quellenregeln des Profils). In übernommenen Zeilen bezeichnet die Nummer nicht mehr dieselbe Quelle; Zuordnung ungeklärt, bitte Quellenverzeichnis berichtigen: ${konflikte.join("; ")}.`,
      });
  }

  // Bewertungszeilen der KI entfallen
  const kiBewertung = kz.typ_bewertung ? neue.filter((e) => e.typ === kz.typ_bewertung) : [];
  const zusatz = neue.filter((e) => !kiBewertung.includes(e));
  // Nummern: frei gebliebene der KI behalten, sonst die nächste freie
  const belegt = new Set(behalten.map((e) => e.nr));
  let naechste = Math.max(0, ...vorEintraege.map((e) => e.nr), ...eintraege.map((e) => e.nr)) + 1;
  const umnummeriert: string[] = [];
  for (const e of zusatz) {
    if (belegt.has(e.nr)) {
      umnummeriert.push(`[Z${e.nr}] → [Z${naechste}]`);
      e.nr = naechste++;
    }
    belegt.add(e.nr);
  }
  if (veraendert.length || wiederhergestellt.length)
    befunde.push({
      stufe: "warnung",
      code: "ZEITSTRAHL_VORMELDUNG",
      text: [
        "Zeilen der Vormeldung bleiben wortgleich (Änderungen nur als neue Zeile vom Typ „Berichtigung“).",
        wiederhergestellt.length ? `Wiederhergestellt: ${wiederhergestellt.map((n) => `[Z${n}]`).join(", ")}.` : "",
        veraendert.length
          ? `Verändert übernommen: ${veraendert.map((n) => `[Z${n}]`).join(", ")}; die Fassung der Vormeldung bleibt, die neue Fassung steht als eigene Zeile${umnummeriert.length ? ` (${umnummeriert.join(", ")})` : ""} – prüfen, ob sie als Berichtigung zu kennzeichnen ist.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  if (kiBewertung.length)
    befunde.push({
      stufe: "hinweis",
      code: "ZEITSTRAHL_BEWERTUNG_KI",
      text: `${kiBewertung.length} Zeile(n) vom Typ „${kz.typ_bewertung}“ aus dem Entwurf verworfen; Bewertungswechsel trägt die App bei der Fortschreibung selbst ein.`,
    });

  // Bewertungswechsel gegenüber der Vormeldung
  const t0 = r.meldezeitpunkt ? String(holeWert(d, r.meldezeitpunkt) ?? "") : "";
  const bewertung: ZeitstrahlEintrag[] = [];
  if (kz.typ_bewertung && vorSv.size && r.sv_kennung && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t0)) {
    const wert = (sv: any, rolle?: string) => (rolle ? String(holeWert(sv, rolle) ?? "") : "");
    const nennen = (w: string) => w || "keine Angabe";
    svs.forEach((sv) => {
      const k = String(holeWert(sv, r.sv_kennung!) ?? "");
      const alt = vorSv.get(k);
      if (!alt) return;
      const teile: string[] = [];
      for (const [label, rolle] of [
        ["Beurteilung", r.sv_beurteilung],
        ["Tendenz", r.sv_tendenz],
      ] as const) {
        if (!rolle) continue;
        const a = wert(alt, rolle);
        const b = wert(sv, rolle);
        if (a !== b) teile.push(`${label} ${nennen(a)} → ${nennen(b)}`);
      }
      if (!teile.length) return;
      const e: ZeitstrahlEintrag = { nr: naechste++, zeit: t0, kennung: k, typ: kz.typ_bewertung, text: teile.join("; "), zeile: "", zeilenNr: 0 };
      bewertung.push(e);
    });
    if (bewertung.length)
      befunde.push({
        stufe: "hinweis",
        code: "ZEITSTRAHL_BEWERTUNG",
        text: `Bewertungswechsel gegenüber der Vormeldung von der App eingetragen: ${bewertung.map((e) => `[Z${e.nr}] ${e.text}`).join("; ")}.`,
      });
  }

  // Zeilen der Vormeldung wortgleich, alle übrigen in der festen Form
  // Kenntniszeit (ZS-2026-W44-05): Zeilen der Vormeldung behalten ihre, ältere ohne Angabe erhalten den Meldezeitpunkt der
  // Vormeldung; alle übrigen den Meldezeitpunkt dieser Meldung (eine Angabe der KI zählt nicht)
  const vorT0 = vor && r.meldezeitpunkt ? String(holeWert(vor, r.meldezeitpunkt) ?? "").slice(0, 16) : "";
  const gueltig = (z: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(z);
  const ausVormeldung = new Set(behalten);
  for (const e of behalten) if (!e.aufgenommen && gueltig(vorT0)) e.aufgenommen = vorT0;
  for (const e of [...zusatz, ...bewertung]) {
    if (gueltig(t0)) e.aufgenommen = t0;
    else delete e.aufgenommen;
  }
  const alle = chronologisch([...behalten, ...zusatz, ...bewertung]);
  const zeilen = [
    ...alle.map((e) => (ausVormeldung.has(e) && parseZeitstrahl(e.zeile).eintraege[0]?.aufgenommen ? e.zeile : zeitstrahlZeile(e))),
    ...ungueltig.map((x) => x.zeile),
  ];
  if (roh !== undefined || zeilen.length) setze(d, r.zeitstrahl, zeilen.join("\n"));
}
