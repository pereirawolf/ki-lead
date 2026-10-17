// Zerlegung von SOP-Dateien: Sammelmappen an Ankern (<a id="sop-01">, <a id="teil-a">),
// sonst an Überschriften der zweiten Ebene; Kopfdaten aus dem YAML-Block bzw. -Frontmatter.

import { load as yamlLaden } from "js-yaml";
import type { Sop } from "../kern/typen";

function yamlKopf(text: string): Record<string, any> {
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = text.match(/```ya?ml\r?\n([\s\S]*?)\r?\n```/);
  const quelle = front?.[1] ?? block?.[1];
  if (!quelle) return {};
  try {
    const v = yamlLaden(quelle);
    return v && typeof v === "object" ? (v as Record<string, any>) : {};
  } catch {
    return {};
  }
}

function titelVon(text: string): string {
  const m = text.match(/^#{1,3}\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

function baueSop(id: string, text: string, datei: string, gemeinsamId?: string): Sop {
  const kopf = yamlKopf(text);
  const titel = titelVon(text) || id;
  const nr = titel.match(/^(\d{1,2})\./)?.[1];
  return {
    id,
    titel,
    nummer: nr,
    lageart: kopf.lageart,
    art_vorschlag: Array.isArray(kopf.art_vorschlag) ? kopf.art_vorschlag : undefined,
    version: kopf.version !== undefined ? String(kopf.version) : undefined,
    datei,
    text: text.trim(),
    gemeinsam: gemeinsamId ? id === gemeinsamId : false,
  };
}

export function zerlegeSops(text: string, datei: string, gemeinsamId?: string): Sop[] {
  const anker = [...text.matchAll(/<a id="([^"]+)"><\/a>/g)];
  if (anker.length) {
    const out: Sop[] = [];
    anker.forEach((m, i) => {
      const start = (m.index ?? 0) + m[0].length;
      const ende = i + 1 < anker.length ? (anker[i + 1].index ?? text.length) : text.length;
      const abschnitt = text
        .slice(start, ende)
        .replace(/\n---\s*$/, "")
        .trim();
      out.push(baueSop(m[1], abschnitt, datei, gemeinsamId));
    });
    return out;
  }
  // Einzel-SOP oder Mappe ohne Anker: an „## “ zerlegen, wenn mehrere YAML-Blöcke vorhanden sind
  const yamlBloecke = (text.match(/```ya?ml/g) || []).length;
  if (yamlBloecke > 1) {
    const teile = text.split(/^(?=## )/m).filter((t) => t.trim().startsWith("## "));
    return teile.map((t, i) => baueSop(`abschnitt-${i + 1}`, t, datei, gemeinsamId));
  }
  const id = datei.replace(/^.*\//, "").replace(/\.md$/i, "");
  return [baueSop(id, text, datei, gemeinsamId)];
}

/** Kurzbezeichnung zum Eintrag in _entstehung.sop, z. B. „SOP-LEAD 01 Unwetter / Sturm v0.4“. */
export function sopKennung(sop: Sop): string {
  const name = sop.titel.replace(/^\d+\.\s*SOP LEAD:\s*/i, "").trim();
  return `SOP-LEAD ${sop.nummer ? sop.nummer.padStart(2, "0") + " " : ""}${name}${sop.version ? " v" + sop.version : ""}`;
}
