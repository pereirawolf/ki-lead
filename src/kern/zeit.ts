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
  return { jahr: t.year, monat: t.month, tag: t.day, stunde: t.hour % 24, minute: t.minute };
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
  if (kandidaten.length) return kandidaten[0];
  // Ausgefallene Wanduhrzeit: mit dem Versatz vor dem Sprung umrechnen (ergibt die Zeit nach dem Sprung)
  return new Date(naiv - versatz(new Date(naiv - 864e5), z) * 60000);
}

/** „JJJJ-MM-TT“ oder „JJJJ-MM-TTThh:mm“ als Zeitpunkt in der Zone; ohne Uhrzeit der Tagesbeginn. */
export function isoLokalZuZeitpunkt(s: string, zone: string): { datum: Date; mitUhrzeit: boolean } | null {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;
  // Ungültige Kalendertage („2026-02-31“) und Uhrzeiten nicht still umrechnen
  const probe = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (probe.getUTCMonth() !== +m[2] - 1 || probe.getUTCDate() !== +m[3]) return null;
  if (m[4] !== undefined && (+m[4] > 23 || +m[5] > 59)) return null;
  const mitUhrzeit = m[4] !== undefined;
  return { datum: zeitpunktInZone(+m[1], +m[2], +m[3], mitUhrzeit ? +m[4] : 0, mitUhrzeit ? +m[5] : 0, zone), mitUhrzeit };
}

/**
 * Gültiger Zeitpunkt „JJJJ-MM-TTThh:mm“ (Kalendertag und Uhrzeit echt prüfen, nicht nur das Muster). Ein Regex
 * allein ließe „2026-02-30T25:00“ durch, und Date würde den Wert still in einen anderen Tag umrechnen.
 */
export function gueltigerZeitpunkt(s: string | undefined): boolean {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return false;
  const probe = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return probe.getUTCFullYear() === +m[1] && probe.getUTCMonth() === +m[2] - 1 && probe.getUTCDate() === +m[3] && +m[4] <= 23 && +m[5] <= 59;
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
  return m ? { tag: m[1], zeit: m[2] || "" } : { tag: "", zeit: "" };
}

/** Setzt Tag und Uhrzeit wieder zusammen; ohne Tag ist der Wert leer */
export function verbinde(tag: string, zeit: string, modus: DatumModus): string {
  if (!tag) return "";
  return modus !== "datum" && zeit ? `${tag}T${zeit}` : tag;
}
