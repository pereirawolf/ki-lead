// PDF-Ausgabe einer Meldung, generisch aus Schema und Darstellungsdatei erzeugt.

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { aufloesen } from "../kern/schema";
import { holeWert, type Segment } from "../kern/pfad";
import { bezeichnung, feldUi, istAusgeblendet, pfadBezeichnung, radarFuer } from "../kern/ui";
import { generischerPfad } from "../kern/pfad";
import { datumDE } from "../kern/ausgabe";
import type { Meldung, Profil } from "../kern/typen";

const BLAU: [number, number, number] = [31, 79, 130];

function zeilen(profil: Profil, knoten: any, wert: any, segs: Segment[], out: string[][]) {
  const k = aufloesen(knoten, profil.schema);
  const gen = generischerPfad(segs);
  const f = feldUi(profil.ui, gen);
  // Volle Pfadbezeichnung („Freigabe › Erfassung › Name“), bei Listenelementen ohne „Eintrag n“
  const teile = pfadBezeichnung(profil.ui, segs).split(" › ");
  const label = (typeof segs[1] === "number" ? teile.slice(1) : teile).join(" › ") || bezeichnung(profil.ui, gen);
  if (f.widget === "radar") {
    const radar = radarFuer(profil.ui, f);
    const text = (radar?.achsen || [])
      .map((a) => {
        const v = wert?.[a.key];
        return `${a.label}: ${Number.isInteger(v) ? `${v} – ${a.stufen[v] ?? ""}` : "offen"}`;
      })
      .join("\n");
    out.push([label, text]);
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
  if (f.widget === "datum" || f.widget === "datumzeit") text = datumDE(text) || "–";
  out.push([label, text]);
}

/** Zeichnet eine Meldung (Kopf, Sachverhalte, Quellen, Entstehung) ab startY und liefert die Endposition. */
function meldungZeichnen(doc: jsPDF, d: Meldung, profil: Profil, startY: number, kopfTitel = "Meldung", zusatz: string[][] = []): number {
  const ui = profil.ui;
  const r = ui.rollen;
  const wurzel = aufloesen(profil.schema, profil.schema);
  const kopf: string[][] = [];
  for (const key of Object.keys(wurzel.properties || {})) {
    if (key === r.sachverhalte || key === r.quellen || istAusgeblendet(ui, key)) continue;
    if (d[key] === undefined) continue;
    zeilen(profil, wurzel.properties[key], d[key], [key], kopf);
  }
  kopf.push(...zusatz);
  autoTable(doc, {
    startY,
    head: [[kopfTitel, ""]],
    body: kopf,
    theme: "grid",
    headStyles: { fillColor: BLAU },
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    columnStyles: { 0: { cellWidth: 52, fontStyle: "bold" } },
  });

  const liste = holeWert(d, r.sachverhalte) || [];
  const elementSchema = aufloesen(wurzel.properties?.[r.sachverhalte]?.items, profil.schema);
  const elementName = feldUi(ui, r.sachverhalte).element_label || "Eintrag";
  liste.forEach((sv: any, i: number) => {
    const body: string[][] = [];
    zeilen(profil, elementSchema, sv, [r.sachverhalte, i], body);
    const titel = r.sv_bezeichnung ? holeWert(sv, r.sv_bezeichnung) : "";
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [[`${elementName} ${i + 1}${titel ? ": " + titel : ""}`, ""]],
      body,
      theme: "grid",
      headStyles: { fillColor: BLAU },
      styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak", valign: "top" },
      columnStyles: { 0: { cellWidth: 52, fontStyle: "bold" } },
    });
  });

  if (r.quellen && String(holeWert(d, r.quellen) || "").trim()) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [[bezeichnung(ui, r.quellen)]],
      body: [[String(holeWert(d, r.quellen))]],
      theme: "grid",
      headStyles: { fillColor: BLAU },
      styles: { fontSize: 7.5, cellPadding: 1.8 },
    });
  }
  const ent = r.entstehung_feld ? d[r.entstehung_feld] : undefined;
  if (ent) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      body: [
        ["Entstehung", [ent.verfahren, ent.werkzeug, ent.modell, (ent.sop || []).join("; "), ent.kodierleitfaden, ent.erstellt].filter(Boolean).join(" · ")],
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
    doc.text(`${text} · Seite ${s} von ${seiten}`, 14, 290);
  }
}

export function meldungAlsPdf(d: Meldung, profil: Profil, entwurf: boolean): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ui = profil.ui;
  doc.setFontSize(14);
  doc.setTextColor(...BLAU);
  doc.text(`${ui.titel}`, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 110);
  doc.text(`${profil.manifest.name} · Profilversion ${profil.manifest.version} · Schema ${profil.manifest.meldung.schema_id}`, 14, 22);
  if (entwurf) {
    doc.setFontSize(42);
    doc.setTextColor(225, 228, 232);
    doc.text("ENTWURF", 105, 150, { angle: 45, align: "center" });
  }
  doc.setTextColor(20, 20, 20);
  meldungZeichnen(doc, d, profil, 27);
  seitenfuss(doc, "Erstellt mit KI-LEAD");
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
  doc.text(titel, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 110);
  doc.text(`${profil.manifest.name} · Schema ${profil.manifest.meldung.schema_id} · ${meldungen.length} Meldung(en) · Stand ${stand}`, 14, 22);
  doc.setTextColor(20, 20, 20);
  autoTable(doc, {
    startY: 27,
    head: [uebersicht[0]],
    body: uebersicht.slice(1),
    theme: "grid",
    headStyles: { fillColor: BLAU },
    styles: { fontSize: 8, cellPadding: 1.6, overflow: "linebreak", valign: "top" },
  });
  meldungen.forEach((m) => {
    doc.addPage();
    meldungZeichnen(doc, m.daten, profil, 16, m.titel, m.zusatz);
  });
  seitenfuss(doc, `${titel} · erstellt mit KI-LEAD`);
  return doc.output("blob");
}
