// Darstellung von Feldern nach LEAD-Meldung-v2 als lesbarer Text (seit 0.7.3, UP-2026-W45-03): Quellenverzeichnis,
// Zeitstrahl, Kennzahlen und Entstehung für PDF, Kopiervorlage und Anzeige. Grundsatz 1 des Formats: Was strukturiert
// erfasst ist, steht nur dort; die lesbaren Zeilen erzeugt die Darstellung (docs/LEAD-MELDUNG-V2.md, Abschnitt 1).
// Die Quellenzeile folgt der Form des Kodierleitfadens (Abschnitt 5) und lässt sich mit quellenV1() zurücklesen.

import { zeitDE } from "./baustein";
import { verweise } from "./meldung-v2.js";

type Obj = Record<string, any>;

const ZUGANG: Record<string, string> = {
  paywall: " (Paywall)",
  behoerdenintern: " (behördenintern)",
  betriebsintern: " (betriebsintern)",
  eingangsmeldung: " (Eingangsmeldung)",
  eingangsmaterial: " (Eingangsmaterial)",
};

/** „[Q1] A – Herausgeber (TT.MM.JJJJ): Titel. Online abrufbar unter: URL (Vermerk) [Zugriff: TT.MM.JJJJ]. Datenstand: …“ */
export function quellenZeileV2(q: Obj): string {
  const teile = [`[${q.id}] ${q.kategorie} – ${q.herausgeber}${q.veroeffentlicht ? ` (${zeitDE(q.veroeffentlicht)})` : ""}: ${q.titel}`];
  if (q.url) teile.push(`. Online abrufbar unter: ${q.url}`);
  teile.push(ZUGANG[q.zugang] ?? "");
  if (q.zugriff) teile.push(` [Zugriff: ${zeitDE(q.zugriff)}]`);
  if (q.datenstand) teile.push(`. Datenstand: ${zeitDE(q.datenstand)}`);
  if (q.zugang === "nicht_ausgewertet") teile.push(" · nicht ausgewertet");
  if (Array.isArray(q.ursprung) && q.ursprung.length) teile.push(` · Ursprung: ${q.ursprung.join(", ")}`);
  if (q.anmerkung) teile.push(`\n${q.anmerkung}`);
  return teile.join("");
}

export function quellenverzeichnisV2(quellen: unknown): string {
  return Array.isArray(quellen)
    ? quellen
        .filter((q) => q && typeof q === "object")
        .map(quellenZeileV2)
        .join("\n")
    : "";
}

/** „[Z1] 14.10.2026, 10:00 · Ereignis – Text [Q1, Q2] · aufgenommen 14.10.2026, 10:30“ */
export function zeitstrahlZeileV2(z: Obj): string {
  const belege = Array.isArray(z.quellen) && z.quellen.length ? ` [${z.quellen.join(", ")}]` : "";
  const berichtigt = z.berichtigt ? ` (zu [${z.berichtigt}])` : "";
  const aufgenommen = z.erstmals_gemeldet ? ` · aufgenommen ${zeitDE(z.erstmals_gemeldet)}` : "";
  return `[${z.id}] ${zeitDE(z.zeit) || "Zeit unbekannt"} · ${z.typ} – ${z.text}${berichtigt}${belege}${aufgenommen}`;
}

export function zeitstrahlTextV2(zeilen: unknown): string {
  return Array.isArray(zeilen)
    ? zeilen
        .filter((z) => z && typeof z === "object")
        .map(zeitstrahlZeileV2)
        .join("\n")
    : "";
}

const zahlDE = (n: number) => n.toLocaleString("de-DE");

/** Wert einer Kennzahl: „mindestens 53“, „5.300“, „100–200“, „unbekannt“ */
export function kennzahlWert(k: Obj): string {
  const b = k.bandbreite && typeof k.bandbreite === "object" ? k.bandbreite : null;
  const wert = typeof k.wert === "number" ? zahlDE(k.wert) : b ? `${zahlDE(b.von)}–${zahlDE(b.bis)}` : "unbekannt";
  return `${k.mindestwert && wert !== "unbekannt" ? "mindestens " : ""}${wert}`;
}

/** Eine Zeile je Kennzahl; Teilmengen eingerückt unter ihrer Obermenge, in der Reihenfolge der Liste. */
export function kennzahlenTextV2(liste: unknown): string {
  if (!Array.isArray(liste)) return "";
  const ks = liste.filter((k) => k && typeof k === "object") as Obj[];
  const ids = new Set(ks.map((k) => k.id));
  const kinder = new Map<string, Obj[]>();
  const wurzeln: Obj[] = [];
  for (const k of ks) {
    if (k.teilmenge_von && ids.has(k.teilmenge_von) && k.teilmenge_von !== k.id) {
      if (!kinder.has(k.teilmenge_von)) kinder.set(k.teilmenge_von, []);
      kinder.get(k.teilmenge_von)!.push(k);
    } else wurzeln.push(k);
  }
  const out: string[] = [];
  const gesehen = new Set<string>();
  const zeile = (k: Obj, tiefe: number) => {
    if (gesehen.has(k.id)) return;
    gesehen.add(k.id);
    const angaben = [k.art, k.erhebung, k.raum, k.datenstand ? `Stand ${zeitDE(k.datenstand)}` : ""].filter(Boolean).join("; ");
    const belege = Array.isArray(k.quellen) && k.quellen.length ? ` [${k.quellen.join(", ")}]` : "";
    out.push(`${"   ".repeat(tiefe)}${tiefe ? "└ " : ""}[${k.id}] ${k.gegenstand}: ${kennzahlWert(k)} ${k.einheit} (${angaben})${belege}`);
    for (const c of kinder.get(k.id) || []) zeile(c, tiefe + 1);
  };
  for (const k of wurzeln) zeile(k, 0);
  for (const k of ks) zeile(k, 0); // Zyklen oder unerreichbare Teilmengen trotzdem ausgeben
  return out.join("\n");
}

/** Entstehung in einer Zeile: Verfahren · Werkzeug · Profil · Modelle · SOP · Kodierleitfaden · erstellt · Migration */
export function entstehungTextV2(e: Obj): string {
  const r = e.regelwerk || {};
  return [
    e.verfahren,
    e.werkzeug ? [e.werkzeug.name, e.werkzeug.version].filter(Boolean).join(" ") : "",
    e.profil ? `Profil ${[e.profil.id, e.profil.version].filter(Boolean).join(" ")}` : "",
    Array.isArray(e.modelle) && e.modelle.length
      ? `Modell: ${e.modelle.map((m: Obj) => [m.stufe, m.anbieter, m.modell].filter(Boolean).join(" ")).join("; ")}`
      : "",
    e.lauf_id ? `Lauf ${e.lauf_id}` : "",
    Array.isArray(r.sop) && r.sop.length
      ? `Beigefügte SOP: ${r.sop.map((s: Obj) => [s.kennung, s.bezeichnung, s.fassung].filter(Boolean).join(" ")).join("; ")}`
      : "",
    r.kodierleitfaden ? `Kodierleitfaden ${r.kodierleitfaden}` : "",
    e.erstellt ? `erstellt ${zeitDE(e.erstellt)}` : "",
    e.migration ? `überführt aus ${e.migration.von}${e.migration.am ? ` am ${zeitDE(e.migration.am)}` : ""}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Quellen-IDs, die ein Teilbaum zitiert: „[Qn]“ in Texten und Listen „quellen“ (Belege). */
export function zitierteQuellen(wert: unknown): Set<string> {
  const ids = new Set<string>();
  const lauf = (x: unknown, schluessel: string) => {
    if (typeof x === "string") {
      if (schluessel === "quellen" && /^Q\d+$/.test(x)) ids.add(x);
      for (const q of verweise(x)) ids.add(q);
    } else if (Array.isArray(x)) x.forEach((y) => lauf(y, schluessel));
    else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) lauf(v, k);
  };
  lauf(wert, "");
  return ids;
}
