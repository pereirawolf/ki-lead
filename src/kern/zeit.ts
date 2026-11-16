// Zeitpunkte in der Zeitzone des Profils. Fristen, Meldezeitpunkte und die nächste Ausgabe sind Wanduhrzeiten
// der meldenden Stelle (in den Beispielprofilen Europe/Berlin). Ohne Umrechnung würde dieselbe Frist auf einem
// anders eingestellten Gerät als anderer Zeitpunkt gelten.

export const STANDARD_ZEITZONE = "Europe/Berlin";

/** Gültige IANA-Zeitzone oder die Standardzone (unbekannte Angaben würden Intl sonst werfen lassen). */
export function zoneOder(zone: string | undefined): string {
  if (!zone) return STANDARD_ZEITZONE;
  try {
    new Intl.DateTimeFormat("de-DE", { timeZone: zone });
    return zone;
  } catch {
    return STANDARD_ZEITZONE;
  }
}

const formatCache = new Map<string, Intl.DateTimeFormat>();
function formatFuer(zone: string): Intl.DateTimeFormat {
  let f = formatCache.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatCache.set(zone, f);
  }
  return f;
}

/** Wanduhrzeit eines absoluten Zeitpunkts in der Zone. */
export function wanduhr(d: Date, zone: string): { jahr: number; monat: number; tag: number; stunde: number; minute: number } {
  const t: Record<string, number> = {};
  for (const p of formatFuer(zone).formatToParts(d)) if (p.type !== "literal") t[p.type] = Number(p.value);
  return { jahr: t.year ?? 0, monat: t.month ?? 0, tag: t.day ?? 0, stunde: (t.hour ?? 0) % 24, minute: t.minute ?? 0 };
}

/** Abstand der Zone zu UTC in Minuten zum Zeitpunkt d. */
function versatz(d: Date, zone: string): number {
  const w = wanduhr(d, zone);
  const alsUtc = Date.UTC(w.jahr, w.monat - 1, w.tag, w.stunde, w.minute);
  return Math.round((alsUtc - Math.floor(d.getTime() / 60000) * 60000) / 60000);
}

/**
 * Absoluter Zeitpunkt einer Wanduhrzeit in der Zone. Bei doppelt vorkommender Stunde (Ende der Sommerzeit) gilt
 * die frühere, eine ausgefallene Stunde (Beginn der Sommerzeit) wird um den Sprung nach vorn verschoben.
 */
export function zeitpunktInZone(jahrRoh: number, monatRoh: number, tagRoh: number, stundeRoh: number, minuteRoh: number, zone: string): Date {
  const z = zoneOder(zone);
  // Überläufe (Tag 32, Stunde 24) erst normalisieren, dann mit der Wanduhr vergleichen
  const naiv = Date.UTC(jahrRoh, monatRoh - 1, tagRoh, stundeRoh, minuteRoh);
  const n = new Date(naiv);
  const [jahr, monat, tag, stunde, minute] = [n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate(), n.getUTCHours(), n.getUTCMinutes()];
  // Zwei Kandidaten mit den Versätzen kurz vor und nach dem Zeitpunkt; der frühere passende gewinnt.
  const kandidaten = [versatz(new Date(naiv - 864e5), z), versatz(new Date(naiv + 864e5), z)]
    .map((v) => new Date(naiv - v * 60000))
    .filter((d) => {
      const w = wanduhr(d, z);
      return w.jahr === jahr && w.monat === monat && w.tag === tag && w.stunde === stunde && w.minute === minute;
    })
    .sort((a, b) => a.getTime() - b.getTime());
  if (kandidaten[0]) return kandidaten[0];
  // Ausgefallene Wanduhrzeit: mit dem Versatz vor dem Sprung umrechnen (ergibt die Zeit nach dem Sprung)
  return new Date(naiv - versatz(new Date(naiv - 864e5), z) * 60000);
}

/** „JJJJ-MM-TT“ oder „JJJJ-MM-TTThh:mm“ als Zeitpunkt in der Zone; ohne Uhrzeit der Tagesbeginn. */
export function isoLokalZuZeitpunkt(s: string, zone: string): { datum: Date; mitUhrzeit: boolean } | null {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;
  // Ungültige Kalendertage („2026-02-31“) und Uhrzeiten nicht still umrechnen
  const [jahr, monat, tag] = [+m[1]!, +m[2]!, +m[3]!];
  const probe = new Date(Date.UTC(jahr, monat - 1, tag));
  if (probe.getUTCMonth() !== monat - 1 || probe.getUTCDate() !== tag) return null;
  const mitUhrzeit = m[4] !== undefined;
  const [stunde, minute] = mitUhrzeit ? [+m[4]!, +m[5]!] : [0, 0];
  if (mitUhrzeit && (stunde > 23 || minute > 59)) return null;
  return { datum: zeitpunktInZone(jahr, monat, tag, stunde, minute, zone), mitUhrzeit };
}

/**
 * Gültiger Zeitpunkt „JJJJ-MM-TTThh:mm“ (Kalendertag und Uhrzeit echt prüfen, nicht nur das Muster). Ein Regex
 * allein ließe „2026-02-30T25:00“ durch, und Date würde den Wert still in einen anderen Tag umrechnen.
 */
export function gueltigerZeitpunkt(s: string | undefined): boolean {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return false;
  const [jahr, monat, tag, stunde, minute] = [+m[1]!, +m[2]!, +m[3]!, +m[4]!, +m[5]!];
  const probe = new Date(Date.UTC(jahr, monat - 1, tag));
  return probe.getUTCFullYear() === jahr && probe.getUTCMonth() === monat - 1 && probe.getUTCDate() === tag && stunde <= 23 && minute <= 59;
}

/** „TT.MM.JJJJ, hh:mm Uhr (Zone)“ für die Anzeige; Zone nur, wenn gewünscht. */
export function zeitpunktDE(d: Date, zone: string, mitZone = false): string {
  const w = wanduhr(d, zoneOder(zone));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(w.tag)}.${p(w.monat)}.${w.jahr}, ${p(w.stunde)}:${p(w.minute)} Uhr${mitZone ? ` (${zoneOder(zone)})` : ""}`;
}

/** Kalendertag „JJJJ-MM-TT“ eines Zeitpunkts in der Zone. */
export function tagInZone(d: Date, zone: string): string {
  const w = wanduhr(d, zoneOder(zone));
  return `${w.jahr}-${String(w.monat).padStart(2, "0")}-${String(w.tag).padStart(2, "0")}`;
}

/** Art eines Datumsfelds: nur Tag · Tag und Uhrzeit (Uhrzeit nötig) · Tag mit optionaler Uhrzeit */
export type DatumModus = "datum" | "datumzeit" | "datum_uhrzeit";

/** Zerlegt einen gespeicherten Wert in Tag und Uhrzeit; Unbekanntes bleibt leer */
export function zerlege(wert: unknown): { tag: string; zeit: string } {
  const m = String(wert ?? "").match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
  return m ? { tag: m[1] ?? "", zeit: m[2] || "" } : { tag: "", zeit: "" };
}

/** Setzt Tag und Uhrzeit wieder zusammen; ohne Tag ist der Wert leer */
export function verbinde(tag: string, zeit: string, modus: DatumModus): string {
  if (!tag) return "";
  return modus !== "datum" && zeit ? `${tag}T${zeit}` : tag;
}

// ---------------------------------------------------------------------------------------------------------------
// Zeitfelder nach LEAD-Meldung-v2 (seit 0.9.5): Eingabe und Anzeige als Wanduhrzeit in der Zeitzone der Meldung,
// der UTC-Versatz bleibt der App überlassen (LD-T04).

/**
 * Art eines Zeitfelds aus dem aufgelösten Schemaknoten: Stimmt sein Muster mit `$defs/zeitpunkt`, `$defs/zeitangabe`
 * oder `$defs/datum` des Profilschemas überein, bekommt es Datums- und Uhrzeitfelder, ohne Eintrag in der
 * Darstellungsdatei. Sonst undefined.
 */
export function zeitartImSchema(
  k: { pattern?: unknown } | null | undefined,
  wurzel: { $defs?: Record<string, { pattern?: unknown }> } | null | undefined,
): DatumModus | undefined {
  const muster = k && typeof k === "object" ? k.pattern : undefined;
  const defs = wurzel?.$defs;
  if (typeof muster !== "string" || !defs) return undefined;
  if (defs.zeitpunkt?.pattern === muster) return "datumzeit";
  if (defs.zeitangabe?.pattern === muster) return "datum_uhrzeit";
  if (defs.datum?.pattern === muster) return "datum";
  return undefined;
}

const MIT_VERSATZ = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/** UTC-Versatz der Zone zum Zeitpunkt d als „+01:00“ */
function versatzVon(d: Date, zone: string): string {
  const min = versatz(d, zone);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${min < 0 ? "-" : "+"}${p(Math.floor(Math.abs(min) / 60))}:${p(Math.abs(min) % 60)}`;
}

/**
 * Wanduhrzeit „JJJJ-MM-TTThh:mm“ in der Zone als Zeitpunkt mit UTC-Versatz („…+01:00“). In der doppelt
 * vorkommenden Stunde am Ende der Sommerzeit gilt die frühere (wie zeitpunktInZone).
 */
export function wanduhrMitVersatz(lokal: string, zone: string): string {
  if (!gueltigerZeitpunkt(lokal)) return lokal;
  const z = zoneOder(zone);
  const [tag, zeit] = lokal.split("T") as [string, string];
  const [j, mo, t] = tag.split("-").map(Number) as [number, number, number];
  const [h, mi] = zeit.split(":").map(Number) as [number, number];
  const d = zeitpunktInZone(j, mo, t, h, mi, z);
  const w = wanduhr(d, z);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.jahr}-${p(w.monat)}-${p(w.tag)}T${p(w.stunde)}:${p(w.minute)}${versatzVon(d, z)}`;
}

/**
 * Gespeicherte Zeitangabe nach LEAD-Meldung-v2 als Wanduhrzeit der Zone. Ein Zeitpunkt mit anderem Versatz als dem
 * der Zone (z. B. „Z“ aus einer Quelle) wird umgerechnet; `abweichend` nennt dann die gespeicherte Angabe lesbar
 * („16.11.2026, 16:36 Uhr UTC“). Kalendertage bleiben, wie sie sind. Unlesbares ergibt leere Teile.
 */
export function wanduhrAusWert(wert: unknown, zone: string): { tag: string; zeit: string; abweichend?: string } {
  const roh = String(wert ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(roh)) return { tag: roh, zeit: "" };
  const m = MIT_VERSATZ.exec(roh);
  if (!m) return zerlege(roh);
  const ms = Date.parse(roh);
  if (Number.isNaN(ms)) return { tag: "", zeit: "" };
  const z = zoneOder(zone);
  const d = new Date(ms);
  const w = wanduhr(d, z);
  const p = (n: number) => String(n).padStart(2, "0");
  const tag = `${w.jahr}-${p(w.monat)}-${p(w.tag)}`;
  const zeit = `${p(w.stunde)}:${p(w.minute)}`;
  const gespeichert = m[3] === "Z" ? "+00:00" : m[3]!;
  if (gespeichert === versatzVon(d, z)) return { tag, zeit };
  const [gj, gm, gt] = m[1]!.split("-");
  const zusatz = gespeichert === "+00:00" ? "UTC" : `UTC${gespeichert}`;
  return { tag, zeit, abweichend: `${gt}.${gm}.${gj}, ${m[2]} Uhr ${zusatz}` };
}

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/** Kurzname der Zone zum Zeitpunkt d auf Deutsch („MEZ“, „MESZ“, „UTC“, „GMT+9“) */
function zonenKuerzel(d: Date, zone: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", { timeZone: zone, timeZoneName: "short" }).formatToParts(d).find((t) => t.type === "timeZoneName")?.value || zone;
  } catch {
    return zone;
  }
}

/**
 * Kontrollzeile unter einem Zeitfeld: „Mo, 16.11.2026, 17:36 Uhr (MEZ)“ oder „Mo, 16.11.2026“. Unabhängig von der
 * Spracheinstellung des Geräts, die die Darstellung der nativen Felder bestimmt (z. B. MM/TT auf Englisch).
 */
export function kontrolltext(tag: string, zeit: string, zone: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tag);
  if (!m) return "";
  const [j, mo, t] = [+m[1]!, +m[2]!, +m[3]!];
  const probe = new Date(Date.UTC(j, mo - 1, t, 12));
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== t) return "";
  const datum = `${WOCHENTAGE[probe.getUTCDay()]}, ${m[3]}.${m[2]}.${m[1]}`;
  if (!/^\d{2}:\d{2}$/.test(zeit)) return datum;
  const z = zoneOder(zone);
  const [h, mi] = zeit.split(":").map(Number) as [number, number];
  return `${datum}, ${zeit} Uhr (${zonenKuerzel(zeitpunktInZone(j, mo, t, h, mi, z), z)})`;
}

/** Zeitzonen, die in der Auswahl oben stehen: Deutschland, Nachbarstaaten, UTC */
export const NAHE_ZEITZONEN: readonly (readonly [string, string])[] = [
  ["Europe/Berlin", "Deutschland"],
  ["Europe/Amsterdam", "Niederlande"],
  ["Europe/Brussels", "Belgien"],
  ["Europe/Copenhagen", "Dänemark"],
  ["Europe/Luxembourg", "Luxemburg"],
  ["Europe/Paris", "Frankreich"],
  ["Europe/Prague", "Tschechien"],
  ["Europe/Vienna", "Österreich"],
  ["Europe/Warsaw", "Polen"],
  ["Europe/Zurich", "Schweiz"],
  ["UTC", "Koordinierte Weltzeit"],
];

/** Lesbare Bezeichnung einer Zone: „Deutschland – MEZ/MESZ (Europe/Berlin)“; ohne Landesnamen nur Kürzel und Name */
export function zeitzonenBezeichnung(zone: string): string {
  const land = NAHE_ZEITZONEN.find(([z]) => z === zone)?.[1];
  const winter = zonenKuerzel(new Date(Date.UTC(2026, 0, 15)), zone);
  const sommer = zonenKuerzel(new Date(Date.UTC(2026, 6, 15)), zone);
  const kuerzel = winter === sommer ? winter : `${winter}/${sommer}`;
  const mitKuerzel = kuerzel !== zone;
  if (land) return mitKuerzel ? `${land} – ${kuerzel} (${zone})` : `${land} (${zone})`;
  return mitKuerzel ? `${zone} – ${kuerzel}` : zone;
}

/** Alle IANA-Zeitzonen des Browsers (leer, wo Intl.supportedValuesOf fehlt) */
export function alleZeitzonen(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (art: string) => string[] };
  try {
    return intl.supportedValuesOf ? intl.supportedValuesOf("timeZone") : [];
  } catch {
    return [];
  }
}
