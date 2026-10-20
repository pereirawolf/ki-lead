// Dateinamen, Datumsformate und die Textfassung „Management Summary“.

import { kennsatz } from "./kennsaetze";
import { holeWert } from "./pfad";
import { sachverhalte } from "./quellen";
import type { Meldung, Profil } from "./typen";
import { zoneOder } from "./zeit";

export function datumDE(s: unknown): string {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return String(s || "");
  return `${m[3]}.${m[2]}.${m[1]}${m[4] ? `, ${m[4]}:${m[5]} Uhr` : ""}`;
}

export function heuteDE(d = new Date()): string {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Lokaler Zeitstempel „JJJJ-MM-TTThh:mm“ in der angegebenen Zeitzone. */
export function jetztLokal(zeitzone = "Europe/Berlin", d = new Date()): string {
  const teile = new Intl.DateTimeFormat("sv-SE", {
    timeZone: zeitzone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return teile.replace(" ", "T").slice(0, 16);
}

function bereinige(s: string): string {
  return s
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_");
}

// ── Dateinamen: Datum immer vorn ─────────────────────────────────────────────
// Alle Downloads beginnen mit „JJJJ-MM-TTThh-mm“ (bzw. „JJJJ-MM-TT“ bei Tagesausgaben), damit sie im Ordner
// chronologisch sortiert erscheinen. Lokale Wanduhrzeiten der Meldung bleiben unverändert; absolute Zeitpunkte
// (ISO mit Z oder Versatz) werden in die Zeitzone des Profils umgerechnet.

const LOKAL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/;
const ABSOLUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Zeitstempel für Dateinamen aus einem gespeicherten Zeitwert; null, wenn der Wert unbrauchbar ist. */
export function dateistempel(wert: unknown, zeitzone?: string, praezision: "minute" | "tag" = "minute"): string | null {
  const s = String(wert ?? "").trim();
  if (ABSOLUT.test(s)) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    const lokal = jetztLokal(zoneOder(zeitzone), d);
    return praezision === "tag" ? lokal.slice(0, 10) : lokal.replace(":", "-");
  }
  const m = s.match(LOKAL);
  if (!m) return null;
  const [j, mo, t] = [+m[1], +m[2], +m[3]];
  const probe = new Date(Date.UTC(j, mo - 1, t));
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== t) return null;
  if (m[4] === undefined || praezision === "tag") return `${m[1]}-${m[2]}-${m[3]}`;
  if (+m[4] > 23 || +m[5] > 59) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}-${m[5]}`;
}

/** Zeitstempel des Exports (einmal je Aktion erfassen und weiterreichen) */
export function exportStempel(zeitzone?: string, jetzt = new Date(), praezision: "minute" | "tag" = "minute"): string {
  const lokal = jetztLokal(zoneOder(zeitzone), jetzt);
  return praezision === "tag" ? lokal.slice(0, 10) : lokal.replace(":", "-");
}

/** Dateiname „<Zeitstempel>_<Rumpf>.<Endung>“; der Rumpf wird nur von Pfad- und Sonderzeichen bereinigt. */
export function mitDatum(stempel: string, rumpf: string, endung?: string): string {
  const r = bereinige(rumpf);
  return `${stempel}${r ? `_${r}` : ""}${endung ? `.${endung.replace(/^\./, "")}` : ""}`;
}

/** Entfernt Datumsplatzhalter samt einem angrenzenden Trenner aus einer Dateinamenvorlage. */
function ohneDatumsplatzhalter(vorlage: string, felder: string[]): string {
  let t = vorlage;
  const trenner = /[_\-. ]/;
  for (const f of felder) {
    const ph = `{${f}}`;
    for (let i = t.indexOf(ph); i >= 0; i = t.indexOf(ph)) {
      if (i > 0 && trenner.test(t[i - 1])) t = t.slice(0, i - 1) + t.slice(i + ph.length);
      else if (trenner.test(t[i + ph.length] || "")) t = t.slice(0, i) + t.slice(i + ph.length + 1);
      else t = t.slice(0, i) + t.slice(i + ph.length);
    }
  }
  return t;
}

/**
 * Basisname einer Meldung ohne Endung: Meldezeitpunkt zuerst, dann die Vorlage des Profils ohne Datumsplatzhalter,
 * gegebenenfalls „_ENTWURF“. Auch ältere Vorlagen mit dem Datum am Ende oder in der Mitte ergeben so das Datum vorn.
 * Fehlt ein brauchbarer Meldezeitpunkt, gilt der (einmal erfasste) Exportzeitpunkt in der Profilzeitzone.
 */
export function dateiname(d: Meldung, profil: Profil, entwurf: boolean, jetzt = new Date()): string {
  const r = profil.ui.rollen;
  const zone = profil.manifest.variablen?.zeitzone;
  const datumsfelder = [...new Set(["meldezeitpunkt", r.meldezeitpunkt].filter((x): x is string => !!x))];
  const zeitwert = holeWert(d, r.meldezeitpunkt || "meldezeitpunkt");
  const stempel = dateistempel(zeitwert, zone) ?? exportStempel(zone, jetzt);
  const vorlage = ohneDatumsplatzhalter(profil.ui.dateiname || "{schema}", datumsfelder);
  const rumpf = vorlage
    .replace(/\{([a-z_]+)\}/g, (_, feld: string) => {
      const wert = feld === "schema" ? holeWert(d, r.schema_feld) : holeWert(d, feld);
      return bereinige(String(wert || `ohne_${feld}`));
    })
    .replace(/^[_\-. ]+|[_\-. ]+$/g, "");
  return mitDatum(stempel, rumpf || bereinige(String(holeWert(d, r.schema_feld) || "Meldung"))) + (entwurf ? "_ENTWURF" : "");
}

/** Klartext-Kurzfassung ohne Quellenverweise, zum Kopieren in Mail oder Vermerk. */
export function managementSummary(d: Meldung, profil: Profil): string {
  const ui = profil.ui;
  const r = ui.rollen;
  const kf = ui.kurzfassung;
  const ks = ui.kennsaetze || {};
  const ohneVerweise = (t: unknown) =>
    String(t || "")
      .replace(/\s*\[Q[^\]]*\]/g, "")
      .replace(/\s+([.,;:])/g, "$1")
      .trim();
  const ks_prefixe = Object.values(ks);
  const ohneKennsaetze = (t: string) =>
    t
      .split(/\r?\n/)
      .filter((l) => !ks_prefixe.some((p) => l.trim().toLowerCase().startsWith(p.toLowerCase())))
      .join("\n")
      .trim();

  const bloecke: string[] = [];
  sachverhalte(d, ui).forEach((sv) => {
    const zeilen: string[] = [];
    const titel = r.sv_bezeichnung ? holeWert(sv, r.sv_bezeichnung) : "";
    zeilen.push(`${titel || "(ohne Bezeichnung)"} – ${kf?.titel || "Management Summary"}`);
    const kopf = (kf?.kopf || "{meldende_stelle}, Stand {meldezeitpunkt_de}. Beurteilung: {beurteilung}.")
      .replace("{meldende_stelle}", String((r.meldende_stelle && holeWert(d, r.meldende_stelle)) || ""))
      .replace("{meldezeitpunkt_de}", datumDE(r.meldezeitpunkt ? holeWert(d, r.meldezeitpunkt) : ""))
      .replace("{beurteilung}", String((r.sv_beurteilung && holeWert(sv, r.sv_beurteilung)) || "keine Angabe"))
      .replace("{tendenz}", String((r.sv_tendenz && holeWert(sv, r.sv_tendenz)) || "keine Angabe"));
    zeilen.push(kopf);
    for (const feld of r.sv_analysefelder || []) {
      const label = ui.felder[`${r.sachverhalte}[].${feld}`]?.label || feld;
      const inhalt = ohneVerweise(holeWert(sv, feld));
      if (inhalt) zeilen.push("", label, inhalt);
    }
    if (r.sv_bewertung_text) {
      const bt = String(holeWert(sv, r.sv_bewertung_text) || "");
      const kern = ohneVerweise(ohneKennsaetze(bt));
      if (kern) zeilen.push("", ui.felder[`${r.sachverhalte}[].${r.sv_bewertung_text}`]?.label || "Bewertung", kern);
      const gewuenscht = kf?.kennsaetze || Object.keys(ks);
      const kz = gewuenscht
        .map((schluessel) => {
          const prefix = ks[schluessel];
          const wert = kennsatz(bt, prefix);
          return wert !== null ? `${prefix} ${ohneVerweise(wert)}` : null;
        })
        .filter(Boolean) as string[];
      if (kz.length) zeilen.push("", ...kz);
    }
    bloecke.push(zeilen.join("\n"));
  });
  const quellen = r.quellen ? String(holeWert(d, r.quellen) || "").trim() : "";
  const n = quellen ? quellen.split(/\r?\n/).filter((l) => /^\s*\[Q\d+\]/.test(l)).length : 0;
  const fuss = n ? `\n\nQuellen: ${n} Einträge; Einzelnachweise in der JSON-Meldung.` : "";
  return bloecke.join("\n\n――――――――――\n\n") + fuss + "\n";
}
