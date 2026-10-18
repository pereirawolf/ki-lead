// Redaktionsvermerke für die Verdichtung: Die App wertet die Eingangsmeldungen mit dem Redaktionscheck
// des Lagebilds aus (deterministisch) und gibt das Ergebnis der KI als Arbeitshilfe mit. Die Vermerke
// ersetzen keine fachliche Prüfung; sie sorgen dafür, dass nichts Prüfbares übersehen wird.

import { datumDE } from "../kern/ausgabe";
import { parseQuellen } from "../kern/quellen";
import { holeWert } from "../kern/pfad";
import type { Meldung, Profil } from "../kern/typen";
import { absender, einlesen, svKennung, zeitpunktVon, type LagebildDatei } from "../lagebild/lagebild";
import { redaktionscheck } from "../lagebild/redaktion";
import type { Material } from "./material";

function datumAus(t0: string): Date {
  const m = t0.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 12, m[5] ? +m[5] : 0) : new Date();
}

function alsDateien(material: Material[]): LagebildDatei[] {
  return material
    .filter((m) => (m.art === "eingang" || m.art === "meldung") && m.meldung)
    .map((m) => ({ name: m.name, text: m.text || JSON.stringify(m.meldung), importiertAm: "" }));
}

/** Vermerke als Markdown-Abschnitt; leer, wenn es keine auswertbaren Eingangsmeldungen gibt. */
export function redaktionsvermerke(material: Material[], profil: Profil, t0: string): string {
  const { eintraege } = einlesen(alsDateien(material), profil);
  const eigene = eintraege.filter((e) => !e.fremd);
  if (!eigene.length) return "";
  const jetzt = datumAus(t0);
  const tage = profil.ui.lagebild?.ausgabe_tage ?? 7;
  const ausgabe = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + tage);
  const r = redaktionscheck(eintraege, profil, ausgabe, jetzt);
  const ks = profil.ui.kennsaetze || {};
  const z: string[] = [];
  const liste = (titel: string, zeilen: string[]) => {
    if (zeilen.length) z.push(`**${titel}**`, ...zeilen.map((x) => `- ${x}`), "");
  };

  liste(
    "Meldungen nach Schema des Profils",
    eigene.map(
      (e) =>
        `${e.name}: ${absender(e, profil)}, Stand ${datumDE(zeitpunktVon(e, profil)) || "unbekannt"}${e.schema.length ? `, ${e.schema.length} Schemaabweichung(en)` : ""}`,
    ),
  );
  liste(
    `Zeitfenster „${ks.handlungsrelevant || "Handlungsrelevant bis:"}“ (bezogen auf t0 und die nächste Ausgabe am ${datumDE(ausgabe.toISOString().slice(0, 10))})`,
    r.zeit.map((x) => `${svKennung(x.sv, profil)}: ${x.text} → ${x.status}`),
  );
  liste(
    "Gleiche Ereignisart in mehreren Meldungen (Zusammenhang prüfen; gleiche Art heißt nicht gleicher Sachverhalt)",
    r.gruppen.map(
      (g) =>
        `${g.art}: ${g.liste.map((s) => `${absender(s.eintrag, profil)} „${s.beurteilung || "keine Angabe"}“${s.tendenz ? `/${s.tendenz}` : ""}`).join("; ")}${g.abweichend ? " → Bewertungen weichen ab" : ""}`,
    ),
  );
  liste(
    `Bereits vermerkte abweichende Bewertungen („${ks.abweichung || "Abweichende Bewertung:"}“)`,
    r.vermerkt.map((x) => `${svKennung(x.sv, profil)}: ${x.text}`),
  );
  liste(
    "Mehrere Meldungen derselben Stelle (die jüngste gilt; nicht doppelt zählen)",
    r.mehrfach.map((m) => `${m.stelle}: ${m.eintraege.map((e) => `${e.name} (${datumDE(zeitpunktVon(e, profil)) || "ohne Zeitpunkt"})`).join(", ")}`),
  );
  liste(
    "Tendenz Entspannung ohne Abschlussvermerk (Nachlauf: Zielzustand erreicht? Folgewirkungen?)",
    r.nachlauf.map((s) => svKennung(s, profil)),
  );
  liste(
    `Abschluss vermerkt („${ks.abschluss || "Abschluss"}“)`,
    r.abschluss.map((x) => `${svKennung(x.sv, profil)}: ${x.text}`),
  );
  liste(
    "Hohe Beurteilung mit Lücken in der Eingangsmeldung",
    r.kern.map((x) => `${svKennung(x.sv, profil)}: ${x.fehlt.join(", ")}`),
  );
  liste(
    "Formale Hinweise zu den Eingangsmeldungen",
    r.quellen.filter((q) => !q.eintrag.fremd).flatMap((q) => q.zeilen.slice(0, 4).map((t) => `${q.eintrag.name}: ${t}`)),
  );

  return [
    "## Vermerke der App aus dem Redaktionscheck der Eingangsmeldungen",
    "",
    "Die App hat die Eingangsmeldungen vor dem Lauf mechanisch ausgewertet (Kennsätze, Ereignisarten, Bewertungen, Meldezeitpunkte). Die Vermerke sind Arbeitshilfe, keine Bewertung: Prüfe jeden Punkt fachlich und berücksichtige ihn in der Meldung, soweit er trägt.",
    "",
    ...z,
  ]
    .join("\n")
    .trim();
}

export interface QuellenZuordnung {
  /** Dateiname der Eingangsmeldung */
  material: string;
  stelle: string;
  /** nachgewiesen: eindeutiger A-Eintrag; kategorie: Eintrag vorhanden, aber nicht Kategorie A; unsicher: nur schwacher Treffer; fehlt: kein Eintrag */
  status: "nachgewiesen" | "kategorie" | "unsicher" | "fehlt";
  eintrag?: number;
}

const normal = (s: unknown) =>
  String(s ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Ordnet jeder Eingangsmeldung höchstens einen eigenen Eintrag im Quellenverzeichnis zu (eins zu eins).
 * Nachweis ist der vollständige Stellenname oder Land plus Kern des Stellennamens; melden mehrere
 * Eingänge unter derselben Stelle, muss der Eintrag zusätzlich die Uhrzeit des Meldezeitpunkts nennen.
 * Bloße Teiltreffer gelten nur als „unsicher“; ein Eintrag außerhalb der Kategorie A als „kategorie“.
 */
export function eingangsquellenPruefen(material: Material[], meldung: Meldung, profil: Profil): QuellenZuordnung[] {
  const rolle = profil.ui.rollen.quellen;
  const eingaenge = material.filter((m) => m.art === "eingang" && m.eingang);
  if (!rolle || !eingaenge.length) return [];
  const eintraege = parseQuellen(holeWert(meldung, rolle)).map((e) => ({ ...e, norm: normal(e.text) }));
  const id = (m: Material) => {
    const stelle = normal(m.eingang!.stelle);
    return {
      stelle,
      kern: stelle.split(/[,(]| - /)[0].trim(),
      land: normal(m.eingang!.land),
      zeit: (m.eingang!.zeitpunkt.match(/T(\d{2}:\d{2})/) || [])[1] || "",
    };
  };
  const ids = eingaenge.map(id);
  const zaehle = (f: (x: ReturnType<typeof id>) => string, wert: string) => ids.filter((x) => f(x) === wert).length;
  const paare: { i: number; j: number; punkte: number }[] = [];
  ids.forEach((x, i) => {
    eintraege.forEach((e, j) => {
      let punkte = 0;
      if (x.stelle && e.norm.includes(x.stelle)) punkte = 3;
      else if (x.land && x.kern.length >= 6 && e.norm.includes(x.land) && e.norm.includes(x.kern)) punkte = 2;
      else if (x.kern.length >= 10 && zaehle((y) => y.kern, x.kern) === 1 && e.norm.includes(x.kern)) punkte = 1;
      else if (x.land.length >= 3 && zaehle((y) => y.land, x.land) === 1 && e.norm.includes(x.land)) punkte = 1;
      // Mehrere Meldungen derselben Stelle: Zeitstand muss den Eintrag unterscheiden
      if (punkte >= 2 && zaehle((y) => y.stelle, x.stelle) > 1 && !(x.zeit && e.norm.includes(x.zeit))) punkte = 1;
      if (punkte) paare.push({ i, j, punkte: punkte + (e.code === "A" ? 0.5 : 0) });
    });
  });
  paare.sort((a, b) => b.punkte - a.punkte);
  const belegtI = new Map<number, { j: number; punkte: number }>();
  const belegtJ = new Set<number>();
  for (const p of paare) {
    if (belegtI.has(p.i) || belegtJ.has(p.j)) continue;
    belegtI.set(p.i, p);
    belegtJ.add(p.j);
  }
  return eingaenge.map((m, i) => {
    const treffer = belegtI.get(i);
    const stelle = [m.eingang!.land, m.eingang!.stelle].filter(Boolean).join(", ") || m.name;
    if (!treffer) return { material: m.name, stelle, status: "fehlt" };
    const e = eintraege[treffer.j];
    const status = Math.floor(treffer.punkte) < 2 ? "unsicher" : e.code === "A" ? "nachgewiesen" : "kategorie";
    return { material: m.name, stelle, status, eintrag: e.nr };
  });
}
