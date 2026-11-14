// Übernahme von Kennzahlen aus Kennzahlen-Bausteinen bei LEAD-Meldung-v2 (seit 0.8.0, UP-2026-W45-04).
// Entscheidungen des Herausgebers vom 03.11.2026: Der Verweis Kennzahl → Baustein steht im Fachmodul „lead-baustein“
// des Sachverhalts, nicht in einem Kernfeld; weichen die Werte eines KI-Entwurfs ab, stellt die App die Werte des
// Bausteins wieder her. Profilneutral (Thessa, KSNV); die fachlichen Kennzahlregeln stehen im Kodierleitfaden des
// Profils (Abschnitt 6). Deterministisch und ohne Urteil:
// - je Eintrag des Moduls den Baustein im Material finden (Prüfsumme, sonst Format mit Quelle oder eindeutig), Format,
//   Fassung und Prüfsumme setzen; Unbekanntes entfällt mit Warnung;
// - die Quelle des Bausteins im Quellenverzeichnis sicherstellen (fehlt sie, ergänzt die App das Quellenobjekt des
//   Bausteins; eine abweichende Quelle unter derselben ID nennt sie nur);
// - je übernommener Kennzahl die Werte des Bausteins wiederherstellen (fehlt die Kennzahl, legt die App sie an),
//   Teilmengen auf die IDs der Meldung umsetzen, den Baustein als Beleg ergänzen;
// - Kennungen der Einsatzmeldungen nur, wenn der Baustein sie enthält; je zugeordneter Einsatzmeldung legt die App eine
//   Maßnahme (Stichwort, Feuerwehren der Gemeinde bzw. überörtlich helfende, Status laufend → begonnen, abgeschlossen →
//   beendet, Stand = Datenstand des Bausteins) und eine Zeitstrahlzeile vom Typ „Maßnahme“ zum Beginn an, ohne Doppelung;
//   ein Beginn nach t0 entfällt mit Hinweis;
// - seit 0.8.2 (UP-2026-W45-05): Kennzahlen eines Bausteins, dessen Raum ein Land ist, erhalten im Raum den Zusatz
//   „erfasster Ausschnitt, Vollständigkeit nicht angegeben“ (Entscheidung des Herausgebers vom 06.11.2026).
// Hinweise auf Kennzahlen, die den Baustein belegen, ohne im Modul zu stehen, und auf Bausteine ohne Übernahme. Codes
// nach der Befunddatei (KENNZAHL_BAUSTEIN_ABWEICHUNG, KENNZAHL_OHNE_VERWEIS, KENNZAHL_OBERMENGE_FEHLT, EINSATZ_NACH_T0).

import type { AbgleichBaustein } from "./bausteinabgleich";
import { ausschnittRaum, istAusschnitt, AUSSCHNITT_ZUSATZ } from "./bausteinverdichtung";
import { MODUL_BAUSTEIN, stehtVor, vergleicheZeit } from "./meldung-v2.js";
import type { Befund, Meldung } from "./typen";

export { MODUL_BAUSTEIN };
export const MODUL_BAUSTEIN_FASSUNG = "1.0";

/** Felder einer Kennzahl, die aus dem Baustein stammen (ID, Belege und Teilmenge setzt die Meldung) */
export const BAUSTEIN_FELDER = ["gegenstand", "einheit", "art", "wert", "bandbreite", "mindestwert", "erhebung", "raum", "datenstand"] as const;

export interface UebernahmeBaustein extends AbgleichBaustein {
  /** SHA-256 der Datei (Material) */
  sha256: string;
}

const istObjekt = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);
const gleich = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const norm = (s: unknown) =>
  String(s ?? "")
    .replace(/\s*\(FIKTIV\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
const anzeige = (x: unknown) => (x === undefined ? "–" : typeof x === "string" ? `„${x}“` : JSON.stringify(x));

/** Quellenobjekt des Bausteins (erstes Element von `quellen`) ohne dessen eigene ID */
function bausteinQuelle(b: UebernahmeBaustein): Record<string, any> | undefined {
  const q = Array.isArray(b.daten.quellen) ? b.daten.quellen[0] : undefined;
  if (!istObjekt(q)) return undefined;
  const { id: _id, ...rest } = q;
  return rest;
}

const selbeQuelle = (q: Record<string, any> | undefined, b: UebernahmeBaustein) => {
  const bq = bausteinQuelle(b);
  return !!q && !!bq && norm(q.herausgeber) === norm(bq.herausgeber) && norm(q.titel) === norm(bq.titel);
};

/** Nächste freie ID mit Präfix (Q, M, Z) in einer Liste von Objekten mit `id` */
function naechsteId(praefix: string, liste: unknown[]): string {
  const re = new RegExp(`^${praefix}(\\d+)$`);
  const n = Math.max(0, ...liste.map((x) => Number(re.exec(String((x as any)?.id ?? ""))?.[1] ?? 0)));
  return `${praefix}${n + 1}`;
}
const naechsteQuellenId = (quellen: Record<string, any>[]) => naechsteId("Q", quellen);

/** Status einer Einsatzmeldung als Status einer Maßnahme nach SOP-LEAD A.4 */
const MASSNAHME_STATUS: Record<string, string> = { laufend: "begonnen", abgeschlossen: "beendet" };

/** Baustein zu einem Moduleintrag finden */
function findeBaustein(eintrag: Record<string, any>, bausteine: UebernahmeBaustein[], quellen: Record<string, any>[]): UebernahmeBaustein | undefined {
  if (typeof eintrag.sha256 === "string") {
    const b = bausteine.find((x) => x.sha256 === eintrag.sha256);
    if (b) return b;
  }
  const kandidaten = bausteine.filter(
    (x) => (!eintrag.format || x.info.format === eintrag.format) && (!eintrag.fassung || x.info.fassung === String(eintrag.fassung)),
  );
  const q = quellen.find((x) => x?.id === eintrag.quelle);
  const perQuelle = kandidaten.filter((x) => selbeQuelle(q, x));
  if (perQuelle.length === 1) return perQuelle[0];
  return kandidaten.length === 1 ? kandidaten[0] : undefined;
}

/**
 * Setzt die Übernahmen aus Kennzahlen-Bausteinen in einer Meldung nach LEAD-Meldung-v2 durch (verändert `d`).
 * @returns Befunde der App (Codes BAUSTEIN_…)
 */
export function bausteineUebernehmen(d: Meldung, bausteine: UebernahmeBaustein[]): Befund[] {
  const befunde: Befund[] = [];
  if (!istObjekt(d)) return befunde;
  if (!Array.isArray(d.quellen)) d.quellen = [];
  const quellen: Record<string, any>[] = d.quellen;
  const svs: any[] = Array.isArray(d.sachverhalte) ? d.sachverhalte.filter(istObjekt) : [];
  const unbekannt: string[] = [];
  const quelleErgaenzt: string[] = [];
  const quelleAbweichend: string[] = [];
  const zurueckgesetzt: string[] = [];
  const angelegt: string[] = [];
  const ohneKennzahl: string[] = [];
  const emUnbekannt: string[] = [];
  const ohneVerweis: string[] = [];
  const obermengeFehlt: string[] = [];
  const einsatzNachT0: string[] = [];
  const einsatzAngelegt: string[] = [];
  const ausschnitt: string[] = [];
  const verwendet = new Set<UebernahmeBaustein>();
  const t0 = typeof d.meldezeitpunkt === "string" ? d.meldezeitpunkt : null;
  const zone = typeof d.zeitzone === "string" ? d.zeitzone : "Europe/Berlin";
  const alleZeilen = () => svs.flatMap((s) => (Array.isArray(s.zeitstrahl) ? s.zeitstrahl : []));

  svs.forEach((sv, i) => {
    const sn = `Sachverhalt ${i + 1}`;
    const modul = sv.module?.[MODUL_BAUSTEIN];
    const eintraege: any[] = istObjekt(modul) && Array.isArray(modul.bausteine) ? modul.bausteine.filter(istObjekt) : [];
    if (sv.kennzahlen !== undefined && !Array.isArray(sv.kennzahlen)) sv.kennzahlen = [];
    const behalten: any[] = [];
    for (const e of eintraege) {
      const b = findeBaustein(e, bausteine, quellen);
      if (!b) {
        unbekannt.push(`${sn}: ${[e.format, e.fassung].filter(Boolean).join(" ") || "ohne Format"}${e.quelle ? ` (${e.quelle})` : ""}`);
        continue;
      }
      verwendet.add(b);
      e.format = b.info.format;
      e.fassung = b.info.fassung;
      e.datei = b.name;
      e.sha256 = b.sha256;
      // Quelle des Bausteins im Quellenverzeichnis
      const vorhanden = quellen.find((q) => q?.id === e.quelle);
      const bq = bausteinQuelle(b);
      if (!vorhanden && bq) {
        const gleicheQuelle = quellen.find((q) => selbeQuelle(q, b));
        if (gleicheQuelle) e.quelle = gleicheQuelle.id;
        else {
          const id = typeof e.quelle === "string" && /^Q[1-9]\d*$/.test(e.quelle) ? e.quelle : naechsteQuellenId(quellen);
          quellen.push({
            id,
            ...bq,
            anmerkung: [bq.anmerkung, `${b.info.format} ${b.info.fassung}, Datei ${b.name}, SHA-256 ${b.sha256}`].filter(Boolean).join("; "),
          });
          e.quelle = id;
          quelleErgaenzt.push(`${id} (${b.name})`);
        }
      } else if (vorhanden && !selbeQuelle(vorhanden, b)) quelleAbweichend.push(`${sn}: ${e.quelle} (${b.name})`);
      // Kennzahlen
      const bkListe: any[] = Array.isArray(b.daten.kennzahlen) ? b.daten.kennzahlen : [];
      const zuordnung = new Map<string, string>(); // Baustein-ID → ID in der Meldung
      const uebernahmen: any[] = [];
      for (const u of Array.isArray(e.kennzahlen) ? e.kennzahlen.filter(istObjekt) : []) {
        if (!bkListe.some((k) => k.id === u.baustein_kennzahl)) {
          ohneKennzahl.push(`${sn}: ${u.baustein_kennzahl ?? "ohne ID"} (${b.name})`);
          continue;
        }
        if (typeof u.kennzahl !== "string" || uebernahmen.some((x) => x.kennzahl === u.kennzahl)) continue;
        zuordnung.set(u.baustein_kennzahl, u.kennzahl);
        uebernahmen.push({ kennzahl: u.kennzahl, baustein_kennzahl: u.baustein_kennzahl });
      }
      for (const u of uebernahmen) {
        const bk = bkListe.find((k) => k.id === u.baustein_kennzahl);
        if (!sv.kennzahlen) sv.kennzahlen = [];
        let mk = sv.kennzahlen.find((k: any) => istObjekt(k) && k.id === u.kennzahl);
        if (!mk) {
          mk = { id: u.kennzahl, quellen: [] };
          sv.kennzahlen.push(mk);
          angelegt.push(`${sn} ${u.kennzahl}`);
        }
        const abw: string[] = [];
        // Land als Raum: erfasster Ausschnitt (seit 0.8.2, UP-2026-W45-05); der Zusatz ist keine Abweichung
        const landRaum = istAusschnitt(b.info) && (bk.raum === undefined || bk.raum === b.info.raum.name);
        for (const f of BAUSTEIN_FELDER) {
          const soll = f === "raum" && landRaum ? ausschnittRaum(b.info.raum.name) : bk[f];
          if (gleich(mk[f], soll)) continue;
          if (f === "raum" && landRaum && (mk[f] === undefined || mk[f] === bk[f])) ausschnitt.push(`${sn} ${u.kennzahl}`);
          else if (!angelegt.includes(`${sn} ${u.kennzahl}`)) abw.push(`${f} ${anzeige(mk[f])} → ${anzeige(soll)}`);
          if (soll === undefined) delete mk[f];
          else mk[f] = structuredClone(soll);
        }
        const teil = bk.teilmenge_von ? zuordnung.get(bk.teilmenge_von) : undefined;
        if (bk.teilmenge_von && !teil) obermengeFehlt.push(`${sn} ${u.kennzahl} (Obermenge ${bk.teilmenge_von} im Baustein nicht übernommen)`);
        if (teil !== mk.teilmenge_von) {
          if (mk.teilmenge_von !== undefined || teil !== undefined) abw.push(`teilmenge_von ${anzeige(mk.teilmenge_von)} → ${anzeige(teil)}`);
          if (teil) mk.teilmenge_von = teil;
          else delete mk.teilmenge_von;
        }
        const belege: string[] = Array.isArray(mk.quellen) ? mk.quellen.filter((x: unknown) => typeof x === "string") : [];
        if (e.quelle && !belege.includes(e.quelle)) belege.push(e.quelle);
        mk.quellen = belege;
        if (abw.length) zurueckgesetzt.push(`${sn} ${u.kennzahl}: ${abw.join(", ")}`);
      }
      e.kennzahlen = uebernahmen;
      // Einsatzmeldungen nur, wenn der Baustein sie enthält
      if (e.einsatzmeldungen !== undefined) {
        const ids = new Set((Array.isArray(b.daten.einsatzmeldungen) ? b.daten.einsatzmeldungen : []).map((x: any) => x?.id));
        const liste: string[] = Array.isArray(e.einsatzmeldungen)
          ? [...new Set<string>(e.einsatzmeldungen.map((x: unknown) => String(x ?? "").trim()).filter(Boolean))]
          : [];
        for (const x of liste) if (!ids.has(x)) emUnbekannt.push(`${sn}: ${x}`);
        const gueltig = liste.filter((x) => ids.has(x));
        if (gueltig.length) e.einsatzmeldungen = gueltig;
        else delete e.einsatzmeldungen;
        // Maßnahme und Zeitstrahlzeile je Einsatzmeldung (aus dem Baustein, nicht aus der KI)
        for (const id of gueltig) {
          const em = (b.daten.einsatzmeldungen as any[]).find((x) => x?.id === id);
          if (!em) continue;
          if (t0 && vergleicheZeit(em.beginn, t0, zone) === 1) {
            einsatzNachT0.push(`${sn}: ${id}`);
            continue;
          }
          if (!istObjekt(sv.handlungsbedarf)) sv.handlungsbedarf = { massnahmen: [], empfehlungen: [], fristen: [] };
          if (!Array.isArray(sv.handlungsbedarf.massnahmen)) sv.handlungsbedarf.massnahmen = [];
          const massnahmen: any[] = sv.handlungsbedarf.massnahmen;
          const belege = e.quelle ? [e.quelle] : [];
          if (!massnahmen.some((m) => norm(m?.gegenstand) === norm(em.stichwort))) {
            massnahmen.push({
              id: naechsteId("M", massnahmen),
              gegenstand: em.stichwort,
              stelle: em.ueberoertlich?.von?.name
                ? `Feuerwehren aus ${em.ueberoertlich.von.name} (überörtliche Hilfe)`
                : `Feuerwehren der Gemeinde ${em.gemeinde?.name ?? ""}`.trim(),
              status: MASSNAHME_STATUS[em.status] ?? "begonnen",
              stand: b.info.datenstand,
              quellen: belege,
            });
            einsatzAngelegt.push(`${sn}: ${id} als Maßnahme`);
          }
          if (!Array.isArray(sv.zeitstrahl)) sv.zeitstrahl = [];
          const text = `${em.stichwort}${em.gemeinde?.name ? ` (${em.gemeinde.name})` : ""}`;
          if (!sv.zeitstrahl.some((z: any) => norm(z?.text) === norm(text) && z?.zeit === em.beginn)) {
            sv.zeitstrahl.push({ id: naechsteId("Z", alleZeilen()), zeit: em.beginn, typ: "Maßnahme", text, quellen: belege, erstmals_gemeldet: t0 });
            einsatzAngelegt.push(`${sn}: ${id} im Zeitstrahl`);
          }
        }
        if (Array.isArray(sv.zeitstrahl))
          sv.zeitstrahl = sv.zeitstrahl
            .map((z: any, i2: number) => ({ z, i2 }))
            .sort((a: any, c: any) => (stehtVor(a.z?.zeit, c.z?.zeit, zone) ? -1 : stehtVor(c.z?.zeit, a.z?.zeit, zone) ? 1 : a.i2 - c.i2))
            .map((x: any) => x.z);
      }
      // Reihenfolge der Schlüssel wie im Modulschema
      const { format, fassung, datei, sha256, quelle, kennzahlen, einsatzmeldungen } = e;
      behalten.push({ format, fassung, datei, sha256, quelle, kennzahlen, ...(einsatzmeldungen ? { einsatzmeldungen } : {}) });
    }
    if (eintraege.length || istObjekt(modul)) {
      if (behalten.length) sv.module[MODUL_BAUSTEIN] = { fassung: MODUL_BAUSTEIN_FASSUNG, bausteine: behalten };
      else delete sv.module[MODUL_BAUSTEIN];
    }
    if (sv.kennzahlen === undefined) delete sv.kennzahlen;
    // Kennzahlen, die eine Bausteinquelle belegen, ohne im Modul zu stehen
    const bausteinQuellen = new Set(quellen.filter((q) => bausteine.some((b) => selbeQuelle(q, b))).map((q) => q.id as string));
    const uebernommen = new Set(behalten.flatMap((x) => x.kennzahlen.map((u: any) => u.kennzahl)));
    for (const k of Array.isArray(sv.kennzahlen) ? sv.kennzahlen : [])
      if (istObjekt(k) && !uebernommen.has(k.id) && (k.quellen || []).some((q: string) => bausteinQuellen.has(q))) ohneVerweis.push(`${sn} ${k.id}`);
  });

  if (zurueckgesetzt.length)
    befunde.push({
      stufe: "warnung",
      code: "KENNZAHL_BAUSTEIN_ABWEICHUNG",
      text: `Werte aus dem Kennzahlen-Baustein wiederhergestellt (der Entwurf wich ab): ${zurueckgesetzt.join("; ")}.`,
    });
  if (ausschnitt.length)
    befunde.push({
      stufe: "hinweis",
      code: "BAUSTEIN_AUSSCHNITT",
      text: `Raum eines Bausteins, dessen Raum ein Land ist, als „${AUSSCHNITT_ZUSATZ}“ gekennzeichnet: ${ausschnitt.join("; ")}.`,
    });
  if (angelegt.length)
    befunde.push({
      stufe: "hinweis",
      code: "BAUSTEIN_KENNZAHL_ERGAENZT",
      text: `Im Modul ${MODUL_BAUSTEIN} genannte Kennzahl fehlte und wurde aus dem Baustein angelegt: ${angelegt.join("; ")}.`,
    });
  if (quelleErgaenzt.length)
    befunde.push({
      stufe: "hinweis",
      code: "BAUSTEIN_QUELLE_ERGAENZT",
      text: `Quelle des Bausteins im Quellenverzeichnis ergänzt: ${quelleErgaenzt.join("; ")}.`,
    });
  if (quelleAbweichend.length)
    befunde.push({
      stufe: "warnung",
      code: "BAUSTEIN_QUELLE_ABWEICHEND",
      text: `Im Modul ${MODUL_BAUSTEIN} genannte Quelle ist nicht die des Bausteins (Herausgeber oder Titel weichen ab); bitte prüfen: ${quelleAbweichend.join("; ")}.`,
    });
  if (unbekannt.length)
    befunde.push({
      stufe: "warnung",
      code: "BAUSTEIN_UNBEKANNT",
      text: `Verweis auf einen Kennzahlen-Baustein, der nicht im Material liegt oder nicht eindeutig ist; entfernt: ${unbekannt.join("; ")}.`,
    });
  if (ohneKennzahl.length)
    befunde.push({
      stufe: "warnung",
      code: "BAUSTEIN_KENNZAHL_UNBEKANNT",
      text: `Verweis auf eine Kennzahl, die der Baustein nicht enthält; entfernt: ${ohneKennzahl.join("; ")}.`,
    });
  if (emUnbekannt.length)
    befunde.push({
      stufe: "warnung",
      code: "BAUSTEIN_EINSATZMELDUNG_UNBEKANNT",
      text: `Kennung einer Einsatzmeldung, die der Baustein nicht enthält; entfernt: ${emUnbekannt.join("; ")}.`,
    });
  if (ohneVerweis.length)
    befunde.push({
      stufe: "hinweis",
      code: "KENNZAHL_OHNE_VERWEIS",
      text: `Kennzahl mit dem Baustein als Beleg, aber ohne Verweis im Modul ${MODUL_BAUSTEIN}; Werte nicht gegen den Baustein geprüft: ${ohneVerweis.join("; ")}.`,
    });
  if (obermengeFehlt.length)
    befunde.push({
      stufe: "hinweis",
      code: "KENNZAHL_OBERMENGE_FEHLT",
      text: `Teilmenge ohne übernommene Obermenge; teilmenge_von entfernt, bitte prüfen, ob die Obermenge zu übernehmen ist: ${obermengeFehlt.join("; ")}.`,
    });
  if (einsatzAngelegt.length)
    befunde.push({
      stufe: "hinweis",
      code: "EINSATZ_UEBERNOMMEN",
      text: `Einsatzmeldungen aus dem Baustein von der App übernommen: ${einsatzAngelegt.join("; ")}.`,
    });
  if (einsatzNachT0.length)
    befunde.push({
      stufe: "hinweis",
      code: "EINSATZ_NACH_T0",
      text: `Einsatzmeldung mit Beginn nach dem Meldezeitpunkt nicht als Maßnahme und Zeitstrahlzeile übernommen (nur Eingetretenes bis t0): ${einsatzNachT0.join("; ")}.`,
    });
  const ungenutzt = bausteine.filter((b) => !verwendet.has(b));
  if (ungenutzt.length)
    befunde.push({
      stufe: "hinweis",
      code: "BAUSTEIN_NICHT_UEBERNOMMEN",
      text: `Kennzahlen-Baustein im Material, aber keine Kennzahl daraus im Modul ${MODUL_BAUSTEIN}: ${ungenutzt.map((b) => b.name).join("; ")}.`,
    });
  return befunde;
}
