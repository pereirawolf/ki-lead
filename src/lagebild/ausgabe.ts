// Ausgaben des Lagebilds: Rohtabelle und CSV (generisch aus dem Schema), Kopiervorlage für Word.

import { aufloesen } from "../kern/schema";
import { holeWert, generischerPfad, type Segment } from "../kern/pfad";
import { bezeichnung, feldUi, istAusgeblendet, radarFuer, radarZeilen } from "../kern/ui";
import { quellenFuerSachverhalt, sachverhalte } from "../kern/quellen";
import { datumDE } from "../kern/ausgabe";
import type { Profil, RadarDef } from "../kern/typen";
import { absender, farbeBeurteilung, farbeTendenz, stelleVon, zeitpunktVon, type Farbe, type LagebildEintrag, type SvEintrag } from "./lagebild";

export interface Spalte {
  titel: string;
  /** Wert für Meldung und (optional) Sachverhalt */
  wert: (e: LagebildEintrag, sv?: any) => string;
}

function alsText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map((x) => (x !== null && typeof x === "object" ? JSON.stringify(x) : String(x))).join("; ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Blattfelder eines Schemaknotens als Spalten; Radare je Achse. */
function blaetter(profil: Profil, knoten: any, segs: Segment[], titel: string[], relativ: number, out: Spalte[]) {
  const k = aufloesen(knoten, profil.schema);
  const gen = generischerPfad(segs);
  const f = feldUi(profil.ui, gen);
  const pfad = segs.slice(relativ);
  if (f.widget === "radar") {
    const def = radarFuer(profil.ui, f);
    for (const a of def?.achsen || []) {
      out.push({
        titel: a.label,
        wert: (e, sv) => {
          const v = holeWert(relativ ? sv : e.daten, [...pfad, a.key]);
          return Number.isInteger(v) ? String(v) : "";
        },
      });
    }
    return;
  }
  if ((k?.type === "object" || k?.properties) && k?.properties) {
    for (const key of Object.keys(k.properties))
      blaetter(profil, k.properties[key], [...segs, key], [...titel, bezeichnung(profil.ui, generischerPfad([...segs, key]))], relativ, out);
    return;
  }
  out.push({ titel: titel.join(" › "), wert: (e, sv) => alsText(holeWert(relativ ? sv : e.daten, pfad)) });
}

/** Spalten der Rohtabelle: Datei, Meldungsfelder, Status, Sachverhaltsfelder, Quellen, Schemaprüfung. */
export function spalten(profil: Profil): Spalte[] {
  const r = profil.ui.rollen;
  const wurzel = aufloesen(profil.schema, profil.schema);
  const kopf: Spalte[] = [];
  for (const key of Object.keys(wurzel?.properties || {})) {
    if (key === r.sachverhalte || key === r.quellen || key === r.entstehung_feld || istAusgeblendet(profil.ui, key)) continue;
    blaetter(profil, wurzel.properties[key], [key], [bezeichnung(profil.ui, key)], 0, kopf);
  }
  const sv: Spalte[] = [];
  const element = aufloesen(wurzel?.properties?.[r.sachverhalte]?.items, profil.schema);
  for (const key of Object.keys(element?.properties || {})) {
    blaetter(profil, element.properties[key], [r.sachverhalte, 0, key], [bezeichnung(profil.ui, `${r.sachverhalte}[].${key}`)], 2, sv);
  }
  return [
    { titel: "Datei", wert: (e) => e.name },
    ...kopf,
    { titel: "Status", wert: (e) => alsText(holeWert(e.daten, r.status_feld)) },
    ...(r.entstehung_feld ? [{ titel: "Entstehung", wert: (e: LagebildEintrag) => alsText(holeWert(e.daten, [r.entstehung_feld!, "verfahren"])) }] : []),
    ...sv,
    ...(r.quellen ? [{ titel: bezeichnung(profil.ui, r.quellen) + " (Meldung)", wert: (e: LagebildEintrag) => alsText(holeWert(e.daten, r.quellen!)) }] : []),
    {
      titel: "Schemaprüfung",
      wert: (e) => (e.schema.length ? `${e.schema.length} Abweichung(en): ${e.schema.map((b) => b.text).join(" | ")}` : "ohne Befund"),
    },
  ];
}

/** Kopfzeile plus eine Zeile je Sachverhalt (Meldungen ohne Sachverhalt: eine Zeile). Fremde Schemata bleiben außen vor. */
export function rohtabelle(eintraege: LagebildEintrag[], profil: Profil): string[][] {
  const sp = spalten(profil);
  const zeilen: string[][] = [sp.map((s) => s.titel)];
  for (const e of eintraege) {
    if (e.fremd) continue;
    const svs = sachverhalte(e.daten, profil.ui);
    if (!svs.length) zeilen.push(sp.map((s) => s.wert(e, undefined)));
    for (const sv of svs) zeilen.push(sp.map((s) => s.wert(e, sv)));
  }
  return zeilen;
}

/** CSV mit Semikolon (Tabellenkalkulation in deutscher Einstellung), BOM und CRLF. */
export function alsCsv(zeilen: string[][]): string {
  // Schutz vor Formelinterpretation in Tabellenprogrammen: Textzellen, die mit =, +, -, @, Tab oder CR
  // beginnen, erhalten ein vorangestelltes Apostroph; reine Zahlen (auch negative) bleiben unverändert.
  const sicher = (s: string) => (/^[=+\-@\t\r]/.test(s) && !/^[+-]?\d+([.,]\d+)?$/.test(s) ? `'${s}` : s);
  const q = (roh: string) => {
    const s = sicher(roh);
    return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + zeilen.map((z) => z.map(q).join(";")).join("\r\n") + "\r\n";
}

// ---------- Kopiervorlage (Word-kompatibles HTML) ----------

export function html(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r?\n/g, "<br>");
}

const FARBEN: Record<Farbe, string> = { rot: "#d00000", orange: "#e07000", gelb: "#c9b000", gruen: "#008a00", grau: "#9a9a9a" };

/** Farbiges Quadrat als Zeichen: Word übernimmt Hintergrundfarben an Inline-Elementen nicht zuverlässig. */
function quadrat(f: Farbe): string {
  return `<span style="color:${FARBEN[f]};font-size:12pt;vertical-align:middle;margin-right:3px;">&#9632;</span>`;
}

export type RadarBild = (def: RadarDef, wert: Record<string, number | null> | undefined) => string | null;

const PT = "font-family:Arial,sans-serif;font-size:10pt;mso-font-size:10pt;";
const S = {
  tabelle: `${PT}color:#000;width:100%;border-collapse:collapse;`,
  stelle: `${PT}background:#dbe6f3;color:#163b63;font-weight:bold;padding:4px 7px;border:1px solid #9db7d6;`,
  titel: `${PT}background:#1f4f82;color:#fff;font-weight:bold;padding:5px 7px;border:1px solid #163b63;`,
  label: `${PT}background:#f0f3f1;font-weight:bold;padding:4px 7px;border:1px solid #bbb;width:180px;vertical-align:top;`,
  wert: `${PT}padding:4px 7px;border:1px solid #bbb;vertical-align:top;line-height:1.45;`,
  fuss: "font-family:Arial,sans-serif;font-size:8pt;mso-font-size:8pt;color:#555;margin-top:3px;",
};

/** Ein Sachverhalt als Tabelle zum Einfügen in Word (Arial 10 pt). */
export function kopiervorlageHtml(s: SvEintrag, profil: Profil, radarBild?: RadarBild): string {
  const ui = profil.ui;
  const r = ui.rollen;
  const sv = `${r.sachverhalte}[]`;
  const zeilen: string[] = [];
  const zeile = (label: string, inhalt: string, extra = "") =>
    zeilen.push(`<tr><td style="${S.label}">${html(label)}:</td><td style="${S.wert}${extra}">${inhalt}</td></tr>`);

  zeilen.push(`<tr><td colspan="2" style="${S.stelle}">${html(absender(s.eintrag, profil))}</td></tr>`);
  const zusatz = [
    s.arten.length ? ` (${html(s.arten.join(", "))})` : "",
    s.ort ? ` in ${html(s.ort)}` : "",
    s.eintritt ? ` seit <span style="font-weight:normal;">${html(datumDE(s.eintritt))}</span>` : "",
  ].join("");
  zeilen.push(`<tr><td colspan="2" style="${S.titel}"><b>${html(s.bezeichnung || "(ohne Bezeichnung)")}</b>${zusatz}</td></tr>`);

  for (const feld of r.sv_analysefelder || []) zeile(bezeichnung(ui, `${sv}.${feld}`), html(holeWert(s.sv, feld) || "–"));

  if (r.sv_beurteilung || r.sv_tendenz || r.sv_bewertung_text) {
    const teile: string[] = [];
    if (r.sv_beurteilung) teile.push(`${quadrat(farbeBeurteilung(profil, s.beurteilung))}<b>${html(s.beurteilung || "keine Angabe")}</b>`);
    if (r.sv_tendenz) teile.push(`${quadrat(farbeTendenz(profil, s.tendenz))}<b>${html(s.tendenz || "keine Angabe")}</b>`);
    const label = [r.sv_beurteilung, r.sv_tendenz]
      .filter(Boolean)
      .map((p) => bezeichnung(ui, `${sv}.${p}`))
      .join(" & ");
    const text = s.bewertungText.trim() ? `${teile.length ? "<br>" : ""}${html(s.bewertungText)}` : "";
    zeile(label || bezeichnung(ui, `${sv}.${r.sv_bewertung_text}`), teile.join(" &nbsp;/&nbsp; ") + text);
  }

  if (r.sv_radar) {
    const f = feldUi(ui, `${sv}.${r.sv_radar}`);
    const def = radarFuer(ui, f);
    if (def) {
      const wert = holeWert(s.sv, r.sv_radar);
      const gesetzt = def.achsen.some((a) => Number.isInteger(wert?.[a.key]));
      const legende = radarZeilen(def, wert).map(html).join("<br>");
      const bild = gesetzt && radarBild ? radarBild(def, wert) : null;
      const inhalt = gesetzt
        ? `${bild ? `<img src="${bild}" width="170" height="170" style="display:block;margin-bottom:4px;" alt="${html(f.label || "Radar")}">` : ""}<span style="font-size:8.5pt;">${legende}</span>`
        : "keine Angaben";
      zeile(f.label || "Radar", inhalt);
    }
  }

  if (r.quellen) {
    const qText = String(holeWert(s.eintrag.daten, r.quellen) || "");
    if (qText.trim()) {
      const zitiert = quellenFuerSachverhalt(qText, s.sv, ui);
      zeile(bezeichnung(ui, r.quellen), html(zitiert ? zitiert.map((q) => q.text).join("\n") : qText), "font-size:8.5pt;");
    }
  }

  const zp = zeitpunktVon(s.eintrag, profil);
  const meta = [`Meldung von: ${html(stelleVon(s.eintrag, profil) || s.eintrag.name)}`, zp ? `Meldezeitpunkt: ${html(datumDE(zp))}` : ""]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");
  return `<table style="${S.tabelle}">${zeilen.join("")}</table><div style="${S.fuss}">${meta}</div>`;
}

/** Klartextfassung derselben Inhalte (für die Zwischenablage neben HTML). */
export function kopiervorlageText(s: SvEintrag, profil: Profil): string {
  const ui = profil.ui;
  const r = ui.rollen;
  const z: string[] = [absender(s.eintrag, profil), s.bezeichnung || "(ohne Bezeichnung)"];
  for (const feld of r.sv_analysefelder || []) z.push("", bezeichnung(ui, `${r.sachverhalte}[].${feld}`), String(holeWert(s.sv, feld) || "–"));
  const bt = [s.beurteilung, s.tendenz].filter(Boolean).join(" / ");
  if (bt || s.bewertungText) z.push("", bt, s.bewertungText);
  return z.join("\n").trim();
}
