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
/**
 * Stufen eines Radars je Achse. Ein Wert ist eine ganze Zahl (LEAD-Meldung-v1) oder seit 0.7.3 (UP-2026-W45-03) ein
 * Objekt mit „stufe“ (Radarachse nach LEAD-Meldung-v2, Modul lead-bevoelkerungsschutz); sonst offen (null).
 */
export function radarWerte(wert: unknown): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  if (!wert || typeof wert !== "object" || Array.isArray(wert)) return out;
  for (const [k, v] of Object.entries(wert as Record<string, unknown>)) {
    const s = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>).stufe : v;
    out[k] = Number.isInteger(s) ? (s as number) : null;
  }
  return out;
}

/** true, wenn die Achsen Objekte nach LEAD-Meldung-v2 sind (mindestens eine Achse ist ein Objekt) */
export function radarAlsObjekte(wert: unknown): boolean {
  return !!wert && typeof wert === "object" && Object.values(wert as Record<string, unknown>).some((v) => !!v && typeof v === "object" && !Array.isArray(v));
}

/**
 * Neuer Radarwert mit geänderter Stufe einer Achse. Bei v2-Achsen bleiben Begründung und Belege erhalten; „status“
 * folgt der Stufe (null → offen mit bisherigem oder „sonstiges“ Grund, Zahl → belegt, ein Mindestwert bleibt einer).
 */
export function radarMitStufe(def: RadarDef, wert: unknown, key: string, stufe: number | null): Record<string, unknown> {
  if (!radarAlsObjekte(wert)) {
    const basis: Record<string, number | null> = {};
    const w = radarWerte(wert);
    for (const a of def.achsen) basis[a.key] = w[a.key] ?? null;
    basis[key] = stufe;
    return basis;
  }
  const alt = (wert as Record<string, any>)[key] ?? {};
  const achse: Record<string, unknown> = { ...alt, stufe };
  if (stufe === null) {
    achse.status = "offen";
    achse.offen_grund = alt.offen_grund ?? "sonstiges";
  } else {
    achse.status = alt.status === "mindestwert" ? "mindestwert" : "belegt";
    delete achse.offen_grund;
  }
  return { ...(wert as Record<string, unknown>), [key]: achse };
}

export function radarZeilen(def: RadarDef, wert: Record<string, unknown> | undefined): string[] {
  const w = radarWerte(wert);
  return def.achsen.map((a) => {
    const v = w[a.key] ?? null;
    const o = wert?.[a.key] && typeof wert[a.key] === "object" ? (wert[a.key] as Record<string, unknown>) : undefined;
    const zusatz =
      o?.status === "mindestwert" ? " (Mindestwert)" : v === null && typeof o?.offen_grund === "string" ? ` (${o.offen_grund.replace(/_/g, " ")})` : "";
    return `${a.label}: ${v !== null ? `${String(v)}${a.stufen[v] ? ` – ${a.stufen[v]}` : ""}` : "offen"}${zusatz}`;
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
