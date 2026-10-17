// Dateinamen, Datumsformate und die Textfassung „Management Summary“.

import { kennsatz } from "./kennsaetze";
import { holeWert } from "./pfad";
import { sachverhalte } from "./quellen";
import type { Meldung, Profil } from "./typen";

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

export function dateiname(d: Meldung, profil: Profil, entwurf: boolean): string {
  const vorlage = profil.ui.dateiname || "{schema}_{meldezeitpunkt}";
  const r = profil.ui.rollen;
  const name = vorlage.replace(/\{([a-z_]+)\}/g, (_, feld: string) => {
    const wert = feld === "schema" ? holeWert(d, r.schema_feld) : holeWert(d, feld);
    if (feld === "meldezeitpunkt" && !wert) return jetztLokal(profil.manifest.variablen.zeitzone).replace(/:/g, "-");
    return bereinige(String(wert || `ohne_${feld}`));
  });
  return name + (entwurf ? "_ENTWURF" : "");
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
