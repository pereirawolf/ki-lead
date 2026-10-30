// PDF-Ausgabe einer Meldung, generisch aus Schema und Darstellungsdatei erzeugt.

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { aufloesen } from "../kern/schema";
import { holeWert, type Segment } from "../kern/pfad";
import { bezeichnung, feldUi, istAusgeblendet, pfadBezeichnung, radarFuer, radarZeilen } from "../kern/ui";
import { generischerPfad } from "../kern/pfad";
import { datumDE } from "../kern/ausgabe";
import { gliedereFeld } from "../kern/kennsaetze";
import { zeitstrahlOrdnen } from "../kern/zeitstrahl";
import type { Meldung, Profil, RadarDef } from "../kern/typen";
import { APP_KENNUNG } from "../kern/version";
import { herkunftAusMeldung, herkunftMehrerer, pdfSchluesselwoerter, xmpPaket, type KiHerkunft } from "./kennzeichnung";

const BLAU: [number, number, number] = [31, 79, 130];

/**
 * Die Standardschrift des PDF (Helvetica, WinAnsi) kennt nur Zeichen aus Windows-1252. Andere Zeichen gibt jsPDF
 * als Bytefolge aus, im PDF erscheint dann Zeichensalat („→“ wurde zu „!’“). Gebräuchliche Zeichen der Meldungen
 * werden lesbar ersetzt, übrige durch „?“. Die gespeicherte Meldung bleibt unverändert.
 */
const ERSATZ: Record<string, string> = {
  "→": "->",
  "←": "<-",
  "↔": "<->",
  "⇒": "=>",
  "⇐": "<=",
  "⇔": "<=>",
  "↑": "^",
  "↓": "v",
  "⟦": "[[",
  "⟧": "]]",
  "≥": ">=",
  "≤": "<=",
  "≈": "~",
  "≠": "!=",
  "−": "-",
  "‐": "-",
  "‑": "-",
  "‒": "-",
  "―": "—",
  "′": "'",
  "″": '"',
  "✓": "x",
  "✔": "x",
  "✗": "-",
  "\u2009": " ",
  "\u200A": " ",
  "\u202F": " ",
  "\u2007": " ",
  "\u200B": "",
  "\u2060": "",
  "\uFEFF": "",
};

/** Zeichen außerhalb von Windows-1252 (Latin-1 plus die Sonderzeichen in 0x80–0x9F) */
const WIN1252_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
function inWinAnsi(c: string): boolean {
  const n = c.codePointAt(0)!;
  return n === 0x09 || n === 0x0a || n === 0x0d || (n >= 0x20 && n <= 0x7e) || (n >= 0xa0 && n <= 0xff) || WIN1252_EXTRA.has(c);
}

/** Text für die Standardschrift des PDF aufbereiten (siehe ERSATZ) */
export function pdfText(s: string): string {
  let aus = "";
  for (const c of s.normalize("NFC")) {
    if (inWinAnsi(c)) aus += c;
    else if (c in ERSATZ) aus += ERSATZ[c];
    else {
      // Zusammengesetzte Buchstaben auf die Grundform zurückführen („ș“ → „s“), sonst „?“
      const basis = c.normalize("NFD").replace(/\p{M}/gu, "");
      aus += basis && [...basis].every(inWinAnsi) ? basis : "?";
    }
  }
  return aus;
}

/** autoTable-Haken: Zelltexte vor Breitenberechnung und Ausgabe aufbereiten */
const zellText = (data: any) => {
  if (Array.isArray(data.cell?.text)) data.cell.text = data.cell.text.map((z: string) => pdfText(String(z)));
};

/** Zelle einer PDF-Tabelle; Radarzellen tragen Definition und Werte für die Grafik. */
type Zelle = string | { content: string; styles?: Record<string, unknown>; radar?: { def: RadarDef; wert: Record<string, unknown> | undefined } };

/** Größe der Radargrafik in mm und Breite des Bereichs links vom Text */
const RADAR_MM = 56;
const RADAR_RAND = RADAR_MM + 6;

/**
 * Zeichnet das Lagenradar als Vektorgrafik: Ringe je Stufe, Achsen mit Kurzbezeichnung, Fläche der
 * gesetzten Werte. Offene Achsen (null) erscheinen als hohler Punkt im Zentrum, nicht als Stufe 0.
 */
export function radarZeichnen(doc: jsPDF, def: RadarDef, wert: Record<string, unknown> | undefined, x: number, y: number, groesse: number) {
  const n = def.achsen.length;
  if (!n) return;
  const cx = x + groesse / 2;
  const cy = y + groesse / 2;
  const rMax = groesse * 0.36;
  const punkt = (i: number, r: number): [number, number] => {
    const w = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(w), cy + r * Math.sin(w)];
  };
  const vieleck = (radien: number[], stil: "S" | "F" | "FD") => {
    const pts = radien.map((r, i) => punkt(i, r));
    const erster = pts[0];
    if (!erster) return;
    const wege = pts.slice(1).map((p, i) => [p[0] - pts[i]![0], p[1] - pts[i]![1]]);
    doc.lines(wege, erster[0], erster[1], [1, 1], stil, true);
  };
  doc.setLineWidth(0.2);
  for (let s = 1; s <= def.max; s++) {
    doc.setDrawColor(s === def.max ? 160 : 205, s === def.max ? 176 : 214, s === def.max ? 168 : 209);
    vieleck(
      def.achsen.map(() => (rMax * s) / def.max),
      "S",
    );
  }
  doc.setDrawColor(190, 200, 195);
  doc.setFontSize(7);
  doc.setTextColor(85, 98, 112);
  def.achsen.forEach((a, i) => {
    const [ax, ay] = punkt(i, rMax);
    doc.line(cx, cy, ax, ay);
    const [lx, ly] = punkt(i, rMax + 4.2);
    doc.text(a.label.match(/^(D\d+)\b/)?.[1] ?? a.label.split(/\s+/)[0] ?? "", lx, ly, { align: "center", baseline: "middle" });
  });
  const werte = def.achsen.map((a) => (Number.isInteger(wert?.[a.key]) ? (wert![a.key] as number) : null));
  if (werte.some((v) => v !== null)) {
    doc.setFillColor(214, 226, 238);
    doc.setDrawColor(...BLAU);
    doc.setLineWidth(0.5);
    vieleck(
      werte.map((v) => (rMax * (v ?? 0)) / def.max),
      "FD",
    );
  }
  werte.forEach((v, i) => {
    const [px, py] = punkt(i, (rMax * (v ?? 0)) / def.max);
    if (v === null) {
      doc.setDrawColor(150, 160, 155);
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.circle(px, py, 0.9, "FD");
    } else {
      doc.setFillColor(...BLAU);
      doc.circle(px, py, 0.9, "F");
    }
  });
  doc.setLineWidth(0.2);
  doc.setTextColor(20, 20, 20);
}

/** Neue Seite, wenn ab y weniger als „noetig“ mm Platz bleiben (verhindert verwaiste Überschriften). */
function platz(doc: jsPDF, y: number, noetig: number): number {
  const unten = doc.internal.pageSize.getHeight() - 16;
  if (y + noetig <= unten) return y;
  doc.addPage();
  return 16;
}

/** Zeichenhaken für autoTable: Radargrafik links in der Wertzelle */
function radarHaken(doc: jsPDF) {
  return (data: any) => {
    const roh = data.cell?.raw;
    if (data.section !== "body" || !roh || typeof roh !== "object" || !roh.radar) return;
    radarZeichnen(doc, roh.radar.def, roh.radar.wert, data.cell.x + 2, data.cell.y + 2, RADAR_MM);
  };
}

function zeilen(profil: Profil, knoten: any, wert: any, segs: Segment[], out: Zelle[][]) {
  const k = aufloesen(knoten, profil.schema);
  const gen = generischerPfad(segs);
  const f = feldUi(profil.ui, gen);
  // Volle Pfadbezeichnung („Freigabe › Erfassung › Name“), bei Listenelementen ohne „Eintrag n“
  const teile = pfadBezeichnung(profil.ui, segs).split(" › ");
  const label = (typeof segs[1] === "number" ? teile.slice(1) : teile).join(" › ") || bezeichnung(profil.ui, gen);
  if (f.widget === "radar") {
    const radar = radarFuer(profil.ui, f);
    const text = radar ? radarZeilen(radar, wert).join("\n") : "";
    out.push([
      label,
      radar
        ? {
            content: text,
            radar: { def: radar, wert },
            styles: { minCellHeight: RADAR_MM + 4, cellPadding: { top: 2, right: 1.8, bottom: 2, left: RADAR_RAND }, valign: "middle" },
          }
        : text,
    ]);
    return;
  }
  if (k?.type === "object" || k?.properties) {
    for (const key of Object.keys(k.properties || {})) {
      if (segs.length === 0 && istAusgeblendet(profil.ui, key)) continue;
      if (wert?.[key] === undefined) continue;
      zeilen(profil, k.properties[key], wert[key], [...segs, key], out);
    }
    return;
  }
  if (Array.isArray(wert)) {
    out.push([label, wert.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ") || "–"]);
    return;
  }
  let text = wert === null || wert === undefined || wert === "" ? "–" : String(wert);
  if (f.widget === "datum" || f.widget === "datumzeit" || f.widget === "datum_uhrzeit") text = datumDE(text) || "–";
  if (text !== "–") text = gliedereFeld(gen, text, profil.ui);
  out.push([label, text]);
}

/**
 * Freigabeblock als Matrix (Zeilen: Erfassung, Freigabe, Versand; Spalten: Name, Datum, Handzeichen), wenn alle
 * Unterfelder Objekte mit denselben Feldern sind; sonst als Liste. Leere Felder bleiben zum Ausfüllen frei.
 */
function freigabeZeichnen(doc: jsPDF, profil: Profil, d: Meldung, startY: number) {
  const ui = profil.ui;
  const feld = ui.rollen.freigabe!;
  const k = aufloesen(aufloesen(profil.schema, profil.schema).properties?.[feld], profil.schema);
  const wert = d[feld];
  const kinder = Object.keys(k?.properties || {});
  const teile = kinder.map((c) => aufloesen(k.properties[c], profil.schema));
  const spalten = teile[0]?.properties ? Object.keys(teile[0].properties) : [];
  const matrix = kinder.length > 0 && spalten.length > 0 && teile.every((t) => t?.properties && Object.keys(t.properties).join("|") === spalten.join("|"));
  const titel = bezeichnung(ui, feld);
  if (matrix) {
    const wertText = (c: string, s: string) => {
      const v = wert?.[c]?.[s];
      if (v === null || v === undefined || v === "") return "";
      const f = feldUi(ui, `${feld}.${c}.${s}`);
      return f.widget === "datum" || f.widget === "datumzeit" || f.widget === "datum_uhrzeit" ? datumDE(v) : String(v);
    };
    autoTable(doc, {
      didParseCell: zellText,
      startY,
      head: [[titel, ...spalten.map((s) => bezeichnung(ui, `${feld}.${kinder[0]}.${s}`))]],
      body: kinder.map((c) => [bezeichnung(ui, `${feld}.${c}`), ...spalten.map((s) => wertText(c, s))]),
      theme: "grid",
      headStyles: { fillColor: BLAU },
      styles: { fontSize: 8.5, cellPadding: 1.8, minCellHeight: 9, valign: "middle" },
      columnStyles: { 0: { cellWidth: 52, fontStyle: "bold" } },
      rowPageBreak: "avoid",
    });
    return;
  }
  const body: Zelle[][] = [];
  zeilen(profil, k, wert, [feld], body);
  autoTable(doc, {
    didParseCell: zellText,
    startY,
    head: [[{ content: titel, colSpan: 2 }]],
    body,
    theme: "grid",
    headStyles: { fillColor: BLAU },
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    columnStyles: { 0: { cellWidth: 52, fontStyle: "bold" } },
  });
}

/** Zeichnet eine Meldung (Kopf, Sachverhalte, Quellen, Entstehung) ab startY und liefert die Endposition. */
function meldungZeichnen(doc: jsPDF, d: Meldung, profil: Profil, startY: number, kopfTitel = "Meldung", zusatz: string[][] = []): number {
  const ui = profil.ui;
  const r = ui.rollen;
  const wurzel = aufloesen(profil.schema, profil.schema);
  const kopf: Zelle[][] = [];
  for (const key of Object.keys(wurzel.properties || {})) {
    if (key === r.sachverhalte || key === r.quellen || key === r.zeitstrahl || key === r.freigabe || istAusgeblendet(ui, key)) continue;
    if (d[key] === undefined) continue;
    zeilen(profil, wurzel.properties[key], d[key], [key], kopf);
  }
  kopf.push(...zusatz);
  autoTable(doc, {
    didParseCell: zellText,
    startY,
    head: [[{ content: kopfTitel, colSpan: 2 }]],
    body: kopf,
    theme: "grid",
    headStyles: { fillColor: BLAU },
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    columnStyles: { 0: { cellWidth: 52, fontStyle: "bold" } },
    didDrawCell: radarHaken(doc),
  });

  // Eine importierte Meldung kann trotz Typfehler übernommen worden sein: Statt abzubrechen oder die Angabe still
  // zu übergehen, steht im PDF ein deutlich markierter Hinweis mit dem gefundenen Inhalt.
  const roh = holeWert(d, r.sachverhalte);
  const liste: any[] = Array.isArray(roh) ? roh : [];
  if (!Array.isArray(roh) && roh !== undefined && roh !== null) {
    const typ = typeof roh === "object" ? "Objekt" : typeof roh === "string" ? "Text" : typeof roh;
    const inhalt = typeof roh === "string" ? roh : JSON.stringify(roh);
    autoTable(doc, {
      didParseCell: zellText,
      startY: platz(doc, (doc as any).lastAutoTable.finalY + 6, 22),
      head: [[{ content: `${bezeichnung(ui, r.sachverhalte)}: ungültiger Datentyp`, colSpan: 2 }]],
      body: [
        ["Befund", `Erwartet eine Liste, gefunden: ${typ}. Die Angabe ist nicht als Sachverhalt ausgegeben; Meldung bitte korrigieren.`],
        ["Inhalt", inhalt.length > 2000 ? inhalt.slice(0, 2000) + " …" : inhalt],
      ],
      theme: "grid",
      headStyles: { fillColor: [176, 42, 42] },
      styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak", valign: "top" },
      columnStyles: { 0: { cellWidth: 52, fontStyle: "bold" } },
    });
  }
  const elementSchema = aufloesen(wurzel.properties?.[r.sachverhalte]?.items, profil.schema);
  const elementName = feldUi(ui, r.sachverhalte).element_label || "Eintrag";
  liste.forEach((sv: any, i: number) => {
    const body: Zelle[][] = [];
    zeilen(profil, elementSchema, sv, [r.sachverhalte, i], body);
    const titel = r.sv_bezeichnung ? holeWert(sv, r.sv_bezeichnung) : "";
    autoTable(doc, {
      didParseCell: zellText,
      startY: platz(doc, (doc as any).lastAutoTable.finalY + 6, 30),
      head: [[{ content: `${elementName} ${i + 1}${titel ? ": " + titel : ""}`, colSpan: 2 }]],
      body,
      theme: "grid",
      headStyles: { fillColor: BLAU },
      styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak", valign: "top" },
      columnStyles: { 0: { cellWidth: 52, fontStyle: "bold" } },
      rowPageBreak: "avoid",
      didDrawCell: radarHaken(doc),
    });
  });

  if (r.quellen && String(holeWert(d, r.quellen) || "").trim()) {
    autoTable(doc, {
      didParseCell: zellText,
      startY: platz(doc, (doc as any).lastAutoTable.finalY + 6, 22),
      head: [[bezeichnung(ui, r.quellen)]],
      body: [[String(holeWert(d, r.quellen))]],
      theme: "grid",
      headStyles: { fillColor: BLAU },
      styles: { fontSize: 7.5, cellPadding: 1.8 },
    });
  }
  // Zeitstrahl als eigener Block nach dem Quellenverzeichnis, chronologisch (seit 0.6.9)
  if (r.zeitstrahl && String(holeWert(d, r.zeitstrahl) || "").trim()) {
    autoTable(doc, {
      didParseCell: zellText,
      startY: platz(doc, (doc as any).lastAutoTable.finalY + 6, 22),
      head: [[bezeichnung(ui, r.zeitstrahl)]],
      body: [[zeitstrahlOrdnen(holeWert(d, r.zeitstrahl))]],
      theme: "grid",
      headStyles: { fillColor: BLAU },
      styles: { fontSize: 7.5, cellPadding: 1.8 },
    });
  }
  // Freigabe & Versand als eigener Block am Ende, vor der Entstehungszeile
  if (r.freigabe && d[r.freigabe] !== undefined) freigabeZeichnen(doc, profil, d, platz(doc, (doc as any).lastAutoTable.finalY + 6, 42));
  const ent = r.entstehung_feld ? d[r.entstehung_feld] : undefined;
  if (ent) {
    autoTable(doc, {
      didParseCell: zellText,
      startY: platz(doc, (doc as any).lastAutoTable.finalY + 4, 14),
      body: [
        [
          "Entstehung",
          [
            ent.verfahren,
            ent.werkzeug,
            ent.modell,
            Array.isArray(ent.sop) && ent.sop.length ? `Beigefügte SOP: ${ent.sop.join("; ")}` : "",
            ent.kodierleitfaden,
            ent.erstellt,
          ]
            .filter(Boolean)
            .join(" · "),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" } },
    });
  }
  return (doc as any).lastAutoTable.finalY;
}

function seitenfuss(doc: jsPDF, text: string) {
  const seiten = doc.getNumberOfPages();
  for (let s = 1; s <= seiten; s++) {
    doc.setPage(s);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 128, 136);
    doc.text(pdfText(`${text} · Seite ${s} von ${seiten}`), 14, 290);
  }
}

/**
 * Dokumenteigenschaften, Sprache und XMP-Metadaten mit der KI-Herkunft (KI-Verordnung Art. 50 Abs. 2, seit 0.5.4).
 * Die Herkunft stammt aus dem Entstehungsfeld der Meldung; ohne Angabe steht sie als „unbekannt“ in den Metadaten.
 */
function kennzeichnen(doc: jsPDF, titel: string, herkunft: KiHerkunft, modell?: string, zusatz?: string) {
  const keywords = [pdfSchluesselwoerter(herkunft), zusatz].filter(Boolean).join("; ");
  doc.setProperties({ title: titel, subject: titel, creator: APP_KENNUNG, keywords });
  doc.setLanguage("de-DE");
  doc.addMetadata(xmpPaket({ titel, herkunft, modell }), true);
}

/** Sichtbarer Zusatz in der Fußzeile bei KI-Herkunft */
const fussKi = (herkunft: KiHerkunft) => (herkunft === "ki" ? " · KI-generiert" : "");

/**
 * Vermerk einer finalen Ausgabe trotz Schemabefund (seit 0.6.13, TP-2026-W44-42): Der Abschlusscheck (SOP-LEAD A.5)
 * verlangt eine Schemaprüfung ohne Befund; gibt die Person nach Rückfrage dennoch final aus, steht das sichtbar auf
 * jeder Seite und in den Schlüsselwörtern. Entwürfe tragen den Vermerk nicht, sie sind ohnehin als Entwurf gekennzeichnet.
 */
export function schemaVermerk(befunde: number): string {
  return `Schemaprüfung mit Befund (${befunde} ${befunde === 1 ? "Abweichung" : "Abweichungen"}) – als final ausgegeben`;
}

/** Zusätzliche Angaben für die Ausgabe einer Meldung */
export interface MeldungPdfOptionen {
  /** Zahl der Abweichungen der Schemaprüfung als finale Meldung; > 0 bei finaler Ausgabe ergibt den Vermerk */
  schemaBefunde?: number;
}

export function meldungAlsPdf(d: Meldung, profil: Profil, entwurf: boolean, optionen: MeldungPdfOptionen = {}): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ui = profil.ui;
  doc.setFontSize(14);
  doc.setTextColor(...BLAU);
  doc.text(pdfText(`${ui.titel}`), 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 110);
  doc.text(pdfText(`${profil.manifest.name} · Profilversion ${profil.manifest.version} · Schema ${profil.manifest.meldung.schema_id}`), 14, 22);
  if (entwurf) {
    doc.setFontSize(42);
    doc.setTextColor(225, 228, 232);
    doc.text("ENTWURF", 105, 150, { angle: 45, align: "center" });
  }
  doc.setTextColor(20, 20, 20);
  meldungZeichnen(doc, d, profil, 27);
  const h = herkunftAusMeldung(d, profil);
  seitenfuss(doc, `Erstellt mit KI-LEAD${fussKi(h.herkunft)}`);
  const vermerk = !entwurf && (optionen.schemaBefunde ?? 0) > 0 ? schemaVermerk(optionen.schemaBefunde!) : undefined;
  if (vermerk) {
    const seiten = doc.getNumberOfPages();
    for (let s = 1; s <= seiten; s++) {
      doc.setPage(s);
      doc.setFontSize(8.5);
      doc.setTextColor(170, 30, 30);
      doc.text(pdfText(vermerk), 196, 8, { align: "right" });
    }
  }
  kennzeichnen(doc, ui.titel, h.herkunft, h.modell, vermerk);
  return doc.output("blob");
}

export interface LagebildPdfMeldung {
  daten: Meldung;
  titel: string;
  zusatz: string[][];
}

/** Zusammenstellung mehrerer Meldungen: Übersicht der Sachverhalte, danach jede Meldung vollständig. */
export function lagebildAlsPdf(profil: Profil, titel: string, uebersicht: string[][], meldungen: LagebildPdfMeldung[], stand: string): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.setTextColor(...BLAU);
  doc.text(pdfText(titel), 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 110);
  doc.text(pdfText(`${profil.manifest.name} · Schema ${profil.manifest.meldung.schema_id} · ${meldungen.length} Meldung(en) · Stand ${stand}`), 14, 22);
  doc.setTextColor(20, 20, 20);
  autoTable(doc, {
    didParseCell: zellText,
    startY: 27,
    head: [uebersicht[0] ?? []],
    body: uebersicht.slice(1),
    theme: "grid",
    headStyles: { fillColor: BLAU },
    styles: { fontSize: 8, cellPadding: 1.6, overflow: "linebreak", valign: "top" },
  });
  meldungen.forEach((m) => {
    doc.addPage();
    meldungZeichnen(doc, m.daten, profil, 16, m.titel, m.zusatz);
  });
  const herkunft = herkunftMehrerer(meldungen.map((m) => herkunftAusMeldung(m.daten, profil)));
  seitenfuss(doc, `${titel} · erstellt mit KI-LEAD${fussKi(herkunft)}`);
  kennzeichnen(doc, titel, herkunft);
  return doc.output("blob");
}
