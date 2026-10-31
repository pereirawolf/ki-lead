// Listen und verschachtelte Objekte eines Profilschemas lesbar ausgeben (seit 0.6.14, Issue #114, A2).
// Bis 0.6.13 standen Listen von Objekten (etwa sachverhalte[].betrieb.ersatzverfahren[]) in PDF, Rohtabelle und CSV als
// JSON. Die Funktionen hier arbeiten allein aus Schema und Darstellungsdatei; sie kennen keine Felder eines Profils.

import { datumDE } from "./ausgabe";
import { generischerPfad, holeWert, type Segment } from "./pfad";
import { aufloesen } from "./schema";
import type { Profil } from "./typen";
import { alsText, bezeichnung, feldUi } from "./ui";

/** Höchstlänge eines Elementtitels, der nicht aus `titel_feld` stammt */
const TITEL_MAX = 80;

const istObjekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Enthält die Liste Objekte (statt nur Texte, Zahlen oder Wahrheitswerte)? */
export function hatObjekte(wert: unknown): boolean {
  return Array.isArray(wert) && wert.some((x) => x !== null && typeof x === "object");
}

/**
 * Titel eines Listenelements: Wert von `titel_feld`, sonst – nur ohne `titel_feld` – der Wert selbst bei einfachen
 * Elementen bzw. der erste nicht leere Text auf oberster Ebene eines Objekts (gekürzt). `segs` ist der Pfad der Liste.
 */
export function elementTitel(profil: Profil, segs: Segment[], element: unknown): string {
  const f = feldUi(profil.ui, generischerPfad(segs));
  if (f.titel_feld) return alsText(holeWert(element, f.titel_feld)).trim();
  let t = "";
  if (typeof element === "string" || typeof element === "number") t = String(element).trim();
  else if (istObjekt(element)) {
    for (const v of Object.values(element))
      if (typeof v === "string" && v.trim()) {
        t = v.trim();
        break;
      }
  }
  return t.length > TITEL_MAX ? `${t.slice(0, TITEL_MAX - 1).trimEnd()}…` : t;
}

/** Name eines Listenelements: `element_label`, sonst die Bezeichnung der Liste */
export function elementName(profil: Profil, segs: Segment[]): string {
  const gen = generischerPfad(segs);
  return feldUi(profil.ui, gen).element_label || bezeichnung(profil.ui, gen);
}

function blattText(profil: Profil, segs: Segment[], wert: unknown): string {
  if (wert === null || wert === undefined || wert === "") return "";
  const text = typeof wert === "object" ? JSON.stringify(wert) : String(wert);
  const w = feldUi(profil.ui, generischerPfad(segs)).widget;
  return w === "datum" || w === "datumzeit" || w === "datum_uhrzeit" ? datumDE(text) || text : text;
}

function zeilenVon(profil: Profil, knoten: unknown, wert: unknown, segs: Segment[], titel: string[], out: string[]) {
  const k = aufloesen(knoten, profil.schema);
  const name = titel.join(" › ");
  if (istObjekt(wert)) {
    const schluessel = k?.properties ? Object.keys(k.properties) : Object.keys(wert);
    for (const key of schluessel) {
      if (wert[key] === undefined) continue;
      const pfad = [...segs, key];
      zeilenVon(profil, k?.properties?.[key], wert[key], pfad, [...titel, bezeichnung(profil.ui, generischerPfad(pfad))], out);
    }
    return;
  }
  if (Array.isArray(wert)) {
    if (hatObjekte(wert)) {
      const text = listeAlsText(profil, knoten, wert, segs);
      if (text) out.push(`${name}:`, ...text.split("\n").map((z) => `  ${z}`));
      return;
    }
    const text = wert
      .map((x) => blattText(profil, segs, x))
      .filter(Boolean)
      .join(", ");
    if (text) out.push(name ? `${name}: ${text}` : text);
    return;
  }
  const text = blattText(profil, segs, wert);
  if (text) out.push(name ? `${name}: ${text}` : text);
}

/**
 * Liste als lesbarer Text: je Element eine Kopfzeile „Name n – Titel“, darunter eingerückt „Feld: Wert“ (verschachtelte
 * Felder mit „›“, leere Angaben ausgelassen). Listen einfacher Werte durch „; “ getrennt. `knoten` ist der Schemaknoten
 * der Liste, `segs` ihr Pfad.
 */
export function listeAlsText(profil: Profil, knoten: unknown, wert: unknown, segs: Segment[]): string {
  if (!Array.isArray(wert)) return "";
  if (!hatObjekte(wert))
    return wert
      .map((x) => blattText(profil, segs, x))
      .filter(Boolean)
      .join("; ");
  const k = aufloesen(knoten, profil.schema);
  const name = elementName(profil, segs);
  return wert
    .map((el, i) => {
      const titel = elementTitel(profil, segs, el);
      const z: string[] = [];
      zeilenVon(profil, k?.items, el, [...segs, i], [], z);
      return [`${name} ${i + 1}${titel ? ` – ${titel}` : ""}`, ...z.map((s) => `  ${s}`)].join("\n");
    })
    .join("\n");
}
