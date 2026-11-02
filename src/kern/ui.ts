// Zugriff auf die Darstellungsdatei: Feldeinstellungen, Bezeichnungen, Radare.

import { generischerPfad, passtMuster, teilePfad, type Segment } from "./pfad";
import type { FeldUi, LagebildVerweis, RadarDef, UiKonfig } from "./typen";

export function feldUi(ui: UiKonfig, generisch: string): FeldUi {
  const direkt = ui.felder[generisch];
  if (direkt) return direkt;
  for (const [muster, wert] of Object.entries(ui.felder)) {
    if (passtMuster(generisch, muster)) return wert;
  }
  return {};
}

export function radarFuer(ui: UiKonfig, f: FeldUi): RadarDef | undefined {
  if (!f.radar) return undefined;
  return ui.radare?.[f.radar];
}

/** Menschenlesbare Bezeichnung eines Feldes, ersatzweise der Feldname. */
export function bezeichnung(ui: UiKonfig, generisch: string): string {
  const f = feldUi(ui, generisch);
  if (f.label) return f.label;
  const letzter = generisch.split(".").pop() || generisch;
  return letzter.replace(/\[\]$/, "");
}

/** Pfadbezeichnung für Prüfmeldungen, z. B. „Ereignis/Sachverhalt 1 › Sofortbereich › D1“. */
export function pfadBezeichnung(ui: UiKonfig, pfad: string | Segment[]): string {
  const segs = typeof pfad === "string" ? teilePfad(pfad) : pfad;
  if (segs.length === 0) return "Meldung";
  const teile: string[] = [];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const bisher = segs.slice(0, i + 1);
    if (typeof seg === "number") {
      const listenFeld = feldUi(ui, generischerPfad(segs.slice(0, i)));
      const vorher = teile.pop();
      const name = listenFeld.element_label || vorher || "Eintrag";
      teile.push(`${name} ${seg + 1}`);
      continue;
    }
    // Radarachsen: Kurzbezeichnung „D1“ statt langem Label
    const eltern = feldUi(ui, generischerPfad(segs.slice(0, i)));
    const radar = eltern.widget === "radar" ? radarFuer(ui, eltern) : undefined;
    if (radar) {
      const achse = radar.achsen.find((a) => a.key === seg);
      if (achse) {
        const kurz = achse.label.match(/^(D\d+)\b/);
        teile.push(kurz?.[1] ?? achse.label);
        continue;
      }
    }
    teile.push(bezeichnung(ui, generischerPfad(bisher)));
  }
  return teile.join(" › ");
}

/** Radarwerte als Klartext je Achse: „D1 Räumliche Auswirkung: 4 – landesweit“, offene Achsen als „offen“. */
export function radarZeilen(def: RadarDef, wert: Record<string, unknown> | undefined): string[] {
  return def.achsen.map((a) => {
    const v = wert?.[a.key];
    return `${a.label}: ${Number.isInteger(v) ? `${String(v)}${a.stufen[v as number] ? ` – ${a.stufen[v as number]}` : ""}` : "offen"}`;
  });
}

export function istAusgeblendet(ui: UiKonfig, feld: string): boolean {
  return (ui.ausblenden || []).includes(feld);
}

function normalStelle(s: unknown): string {
  return String(s ?? "")
    .normalize("NFC")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Gehört eine meldende Stelle zur eigenen Stelle des Profils? Exakter Vergleich nach Normalisierung
 * (Groß-/Kleinschreibung, Leerraum, Gedankenstriche) mit der Profilvariable und den Aliasnamen
 * in „eigene_stellen“; ein bloßer gleicher Namensanfang genügt nicht.
 */
export function istEigeneStelle(stelle: unknown, manifest: { variablen: Record<string, string>; eigene_stellen?: string[] }): boolean {
  const n = normalStelle(stelle);
  if (!n) return false;
  return [manifest.variablen.meldende_stelle, ...(manifest.eigene_stellen || [])].some((x) => !!x && normalStelle(x) === n);
}

/** Sichere Anzeige eines Werts als Text: Objekte und Listen aus fehlerhaften Dateien bringen die Oberfläche nicht zum Absturz. */
export function alsText(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/**
 * Fundstelle des Profils für einen Prüfabschnitt als Klammerzusatz „ (…)“, z. B. „ (SOP-LEAD A.7.1, A.7.2)“ oder
 * „ (Teil A, A.7, A.7.1)“; ohne Angabe im Profil leer. Angezeigte Texte nennen Abschnitte nur so (GK-2026-W44-13).
 */
export function verweisKlammer(ui: UiKonfig, art: LagebildVerweis): string {
  const v = ui.lagebild?.verweise?.[art]?.trim();
  return v ? ` (${v})` : "";
}
