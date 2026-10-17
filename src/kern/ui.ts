// Zugriff auf die Darstellungsdatei: Feldeinstellungen, Bezeichnungen, Radare.

import { generischerPfad, passtMuster, teilePfad, type Segment } from "./pfad";
import type { FeldUi, RadarDef, UiKonfig } from "./typen";

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
        teile.push(kurz ? kurz[1] : achse.label);
        continue;
      }
    }
    teile.push(bezeichnung(ui, generischerPfad(bisher)));
  }
  return teile.join(" › ");
}

export function istAusgeblendet(ui: UiKonfig, feld: string): boolean {
  return (ui.ausblenden || []).includes(feld);
}
