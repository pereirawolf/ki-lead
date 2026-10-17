// Bausteine der Prompts aus dem Profil: Ereignisarten, SOP-Katalog, Profilgrundlagen,
// Arbeitsanweisung mit Platzhaltern und Ausgabevertrag der App.

import { aufloesen, unterSchema } from "../kern/schema";
import { teilePfad } from "../kern/pfad";
import type { Profil, Sop } from "../kern/typen";
import { ersetzePlatzhalter } from "../profil/platzhalter";
import { sopKennung } from "../profil/sop";
import type { S1Vorschlag } from "./lauf";

export function ereignisarten(profil: Profil): string[] {
  const r = profil.ui.rollen;
  if (!r.sv_art) return [];
  let art = unterSchema(profil.schema, [r.sachverhalte, 0]);
  for (const seg of teilePfad(r.sv_art))
    art = typeof seg === "number" ? aufloesen(art?.items, profil.schema) : aufloesen(art?.properties?.[seg], profil.schema);
  const items = aufloesen(art?.items, profil.schema);
  const werte: unknown[] = items?.enum || art?.enum || [];
  return werte.filter((w): w is string => typeof w === "string" && w !== "");
}

export function fachSops(profil: Profil): Sop[] {
  return profil.sops.filter((s) => !s.gemeinsam);
}

export function gemeinsameSops(profil: Profil): Sop[] {
  return profil.sops.filter((s) => s.gemeinsam);
}

/** SOPs, deren art_vorschlag eine der Ereignisarten nennt. */
export function sopsFuerArten(profil: Profil, arten: string[]): string[] {
  return fachSops(profil)
    .filter((s) => (s.art_vorschlag || []).some((a) => arten.includes(a)))
    .map((s) => s.id);
}

function kodierleitfaden(profil: Profil): string {
  const pfad = profil.manifest.kodierleitfaden;
  return pfad ? profil.dateien[pfad] || "" : "";
}

/** Statischer, cachebarer Block mit Schema, Darstellungsdatei, Kodierleitfaden und gemeinsamen SOP-Regeln. */
export function profilGrundlagen(profil: Profil): string {
  const teile = [
    `# Profilgrundlagen: ${profil.manifest.name} (Version ${profil.manifest.version})`,
    `## JSON-Schema der Meldung (Schemakennung ${profil.manifest.meldung.schema_id})\n\n\`\`\`json\n${JSON.stringify(profil.schema, null, 1)}\n\`\`\``,
    `## Darstellungsdatei (Feldbezeichnungen, Hinweise, Stufentexte, Kennsätze, Quellenkategorien)\n\n\`\`\`json\n${JSON.stringify(profil.ui, null, 1)}\n\`\`\``,
  ];
  const kl = kodierleitfaden(profil);
  if (kl) teile.push(`## Kodierleitfaden\n\n${kl}`);
  for (const s of gemeinsameSops(profil)) teile.push(`## SOP-Sammelmappe: ${s.titel}\n\n${s.text}`);
  return teile.join("\n\n");
}

export function sopBlock(profil: Profil, ids: string[]): string {
  const gewaehlt = fachSops(profil).filter((s) => ids.includes(s.id));
  if (!gewaehlt.length) return "# Ausgewählte SOPs\n\nKeine SOP ausgewählt.";
  return ["# Ausgewählte SOPs (in Stufe S1 bestätigt)", ...gewaehlt.map((s) => `## ${sopKennung(s)}\n\n${s.text}`)].join("\n\n");
}

export const AUSGABEVERTRAG = `## Ausgabeformat (von der App vorgegeben)

Gib zuerst die Kurzantwort als Fließtext aus (höchstens acht Sätze, ohne Überschrift; Einzelheiten gehören in die Meldung, nicht in die Kurzantwort). Gib danach genau einen Codeblock mit der vollständigen Meldung aus: Er beginnt mit \`\`\`json und endet mit \`\`\`. Der Codeblock enthält ausschließlich das JSON-Objekt, ohne Kommentare. Nach dem Codeblock folgt kein weiterer Text.

Für das Quellenverzeichnis verwendest du nur Fundstellen aus deiner Websuche, aus abgerufenen Seiten und aus dem Eingangsmaterial. Erfinde keine URLs. Die App prüft das Ergebnis gegen das Schema und legt es der Person zur Prüfung und Freigabe vor.`;

export interface AuftragsText {
  sachverhalt: string;
  ausgangsquellen: string;
  stichtag: string;
  prueffrage: string;
  ereignisarten: string;
}

export function auftragAusBestaetigung(b: S1Vorschlag, profil: Profil, ausgangsquellen: string): AuftragsText {
  const gliederung = b.sachverhalte
    .map((s, i) => {
      const sops = fachSops(profil)
        .filter((x) => s.sops.includes(x.id))
        .map(sopKennung);
      const eingang = s.eingangsmeldungen?.length ? `; Eingangsmeldungen: ${s.eingangsmeldungen.join(", ")}` : "";
      return `Sachverhalt ${i + 1} „${s.titel}“: ${s.ereignisarten.join(", ") || "offen"}${sops.length ? ` (${sops.join(", ")})` : ""}${eingang}`;
    })
    .join("; ");
  return {
    sachverhalt: [b.gegenstand, b.referenzbezug && `Bezug: ${b.referenzbezug}`, b.horizont && `Horizont: ${b.horizont}`].filter(Boolean).join(". "),
    ausgangsquellen,
    stichtag: b.stichtag,
    prueffrage: b.prueffrage || "keine",
    ereignisarten: gliederung || "frei nach Katalog",
  };
}

export function anweisungErfassung(profil: Profil, auftrag: AuftragsText, jetzt: string): string {
  const pfad = profil.manifest.anweisungen?.erfassung;
  const roh = pfad ? profil.dateien[pfad] : "";
  const text = roh || "# Arbeitsanweisung\n\nErstelle eine Meldung nach dem beigefügten Schema.\n\n{{app.ausgabevertrag}}";
  const mitVertrag = text.includes("{{app.ausgabevertrag}}") ? text : `${text}\n\n{{app.ausgabevertrag}}`;
  return ersetzePlatzhalter(mitVertrag, {
    profil: {
      kurzname: profil.manifest.variablen.meldende_stelle,
      ...profil.manifest.variablen,
      referenzraum: profil.manifest.referenzraum,
      ebene: profil.manifest.ebene,
      name: profil.manifest.name,
    },
    auftrag: auftrag as unknown as Record<string, string>,
    app: { ausgabevertrag: AUSGABEVERTRAG },
    jetzt,
  }).text;
}

/** JSON-Schema für die strukturierte Antwort der Stufe S1 (nur von der API unterstützte Schlüsselwörter). */
export function s1Schema(profil: Profil, eingaenge: string[] = []): object {
  const arten = ereignisarten(profil);
  const sops = fachSops(profil).map((s) => s.id);
  const liste = (werte: string[]) => (werte.length ? { type: "array", items: { type: "string", enum: werte } } : { type: "array", items: { type: "string" } });
  return {
    type: "object",
    additionalProperties: false,
    required: ["gegenstand", "stichtag", "meldezeitpunkt", "referenzbezug", "horizont", "sachverhalte", "prueffrage", "hinweise"],
    properties: {
      gegenstand: { type: "string", description: "Konkreter Sachverhalt und Erkenntnisinteresse in ein bis drei Sätzen" },
      stichtag: { type: "string", description: "Stichtag im Format JJJJ-MM-TT" },
      meldezeitpunkt: {
        type: "string",
        description:
          "Meldezeitpunkt t0 der eigenen Meldung im Format JJJJ-MM-TTThh:mm. Liegt das Material zeitlich geschlossen deutlich vor dem Stichtag (Übung, Rückblick, Eingangsmeldungen eines Tages), wähle einen Zeitpunkt kurz nach dem jüngsten Datenstand des Materials, nicht den aktuellen Zeitpunkt.",
      },
      referenzbezug: { type: "string", description: "Wirkungs- bzw. Relevanzbezug zum Referenzraum" },
      horizont: { type: "string", description: "Betrachtungshorizont" },
      sachverhalte: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["titel", "ereignisarten", "sops", "begruendung", ...(eingaenge.length ? ["eingangsmeldungen"] : [])],
          properties: {
            titel: { type: "string" },
            ereignisarten: liste(arten),
            sops: liste(sops),
            ...(eingaenge.length
              ? { eingangsmeldungen: { ...liste(eingaenge), description: "Dateinamen der Eingangsmeldungen, die in diesen Sachverhalt eingehen" } }
              : {}),
            begruendung: { type: "string", description: "Kurze Begründung der Zuordnung, Mischlage und Abgrenzung" },
          },
        },
      },
      prueffrage: { type: "string", description: "Besondere Prüffrage oder leer" },
      hinweise: { type: "string", description: "Grenzen des Materials, offene Fragen, nicht zugängliche Quellen" },
    },
  };
}

export const VERDICHTUNG_S1 = `# Verdichtung von Eingangsmeldungen (SOP-LEAD A.7)

Das Material enthält Meldungen anderer Stellen (Eingangsmeldungen). Daraus entsteht eine eigene Meldung für den eigenen Referenzraum. Gliedere nach Sachverhalten, nicht nach meldenden Stellen:

- Beschreiben mehrere Meldungen dasselbe Ereignis oder dieselbe Ursache-Folge-Lage (z. B. ein Sturmtief mit Stromausfällen in mehreren Ländern), ist das **ein** Sachverhalt. Die Länder oder Stellen erscheinen darin als Teilräume (A.7.1).
- Einen weiteren Sachverhalt bildest du nur für eine eigenständige Lage mit eigener Wirkungskette und eigener Relevanz für den Referenzraum, nicht für jede meldende Stelle.
- Ziel ist die kleinste fachlich vertretbare Zahl von Sachverhalten, in der Regel einer bis drei. Begründe jede Trennung.
- Ordne jedem Sachverhalt die Eingangsmeldungen zu, die in ihn eingehen. Jede Eingangsmeldung muss mindestens einem Sachverhalt zugeordnet sein.
- Der Meldezeitpunkt t0 liegt kurz nach dem jüngsten Meldezeitpunkt der Eingangsmeldungen, sofern der Auftrag nichts anderes vorgibt.`;

export function s1System(profil: Profil, verdichtung = false): string {
  const m = profil.manifest;
  const katalog = fachSops(profil)
    .map((s) => `- ${s.id}: ${sopKennung(s)}${s.art_vorschlag?.length ? ` – Ereignisart(en): ${s.art_vorschlag.join(", ")}` : ""}`)
    .join("\n");
  return `Du bist Stufe S1 einer gestuften Lageerfassung nach der LEAD-Systematik (Lageerfassung, -auswertung, -darstellung).

Deine Aufgabe ist allein die Klärung des Gegenstands vor der Recherche (SOP-LEAD A.1): konkreter Sachverhalt, Stichtag, Bezug zum Referenzraum, Betrachtungshorizont, Gliederung in Sachverhalte, Ereignisarten aus dem Katalog und passende SOPs (Mischlage: Ursache- und Folge-SOP; Abgrenzung beachten; „Sonstiges“ nur, wenn nichts passt). Du recherchierst nicht und bewertest nicht. Die Person bestätigt oder korrigiert deinen Vorschlag. Genannte URLs ruft erst Stufe S2 ab; bezeichne sie deshalb nicht als „nicht abrufbar“, sondern leite den Gegenstand aus Auftrag, URL-Pfad und Material ab.

Profil: ${m.name}. Ebene: ${m.ebene || "–"}. Referenzraum: ${m.referenzraum || "–"}. Meldende Stelle: ${m.variablen.meldende_stelle || "–"}.

Katalog der Ereignisarten: ${ereignisarten(profil).join(" · ") || "frei"}

SOP-Katalog (Kennung: Bezeichnung):
${katalog || "keine SOPs im Profil"}

Antworte ausschließlich im vorgegebenen JSON-Format. Schreibe auf Deutsch.${verdichtung ? `\n\n${VERDICHTUNG_S1}` : ""}

${gemeinsameSops(profil)
  .map((s) => `# ${s.titel}\n\n${s.text}`)
  .join("\n\n")}

# Anwendungsbereiche der SOPs

${fachSops(profil)
  .map((s) => `## ${s.id}: ${sopKennung(s)}\n\n${anwendungsbereich(s.text)}`)
  .join("\n\n")}`;
}

/** Abschnitt „Anwendungsbereich“ einer SOP (bis zur nächsten Überschrift gleicher Ebene), sonst Anfang. */
export function anwendungsbereich(text: string): string {
  const m = text.match(/^###\s+1\.[^\n]*\n([\s\S]*?)(?=^###\s)/m);
  if (m) return m[1].trim();
  return text.slice(0, 1500);
}

export const VERDICHTUNG_S2 = `## Zusatz der App: Verdichtung von Eingangsmeldungen (Modus B, vorläufig)

Das Eingangsmaterial enthält Meldungen anderer Stellen. Du verdichtest sie zu einer eigenen Meldung der meldenden Stelle für ihren Referenzraum. Es gilt SOP-LEAD Teil A.7, zusätzlich:

1. **Gliederung:** Die bestätigte Gliederung ist verbindlich: genau so viele Sachverhalte, in dieser Reihenfolge, mit den zugeordneten Eingangsmeldungen. Länder oder Stellen erscheinen innerhalb eines Sachverhalts als Teilräume, nicht als eigene Sachverhalte.
2. **Referenzraum wechselt:** Kodiere das Lagenradar für den eigenen Referenzraum neu. Werte der Eingangsmeldungen übernimmst du nicht und mittelst sie nicht; es gibt keinen Gesamtscore. Die Werte der Eingänge dürfen als Belege für die eigene Kodierung dienen.
3. **Bezugszeitpunkt:** t0 ist der vorgegebene Meldezeitpunkt. Die Eingangsmeldungen sind der Ist-Stand zu ihrem jeweiligen Meldezeitpunkt; liegt dieser vor t0, nennst du den Datenstand, statt die Lage für offen zu erklären.
4. **Zusammenhang (A.7.1):** Denselben Befund aus mehreren Meldungen stellst du einmal dar. Die Zahl der Meldungen belegt keine Verschärfung.
5. **Abweichende Bewertungen (A.7.2)** bleiben nebeneinander stehen, mit Urheber und tragendem Grund, im Kennsatz „Abweichende Bewertung:“.
6. **Quellen:** Jede Eingangsmeldung ist eine Quelle der Kategorie A im Quellenverzeichnis (meldende Stelle, Meldezeitpunkt, Hinweis „Eingangsmeldung“). Primärquellen der Eingänge führst du nur, wenn du sie selbst geprüft hast.
7. **Zeitkritische Weitergabe (A.7.3):** Kennsätze „Handlungsrelevant bis:“ der Eingänge, die vor der nächsten eigenen Ausgabe liegen, hebst du im Bewertungstext hervor.`;

export function verdichtungsAnweisung(profil: Profil): string {
  const pfad = profil.manifest.anweisungen?.verdichtung;
  const roh = (pfad && profil.dateien[pfad]) || VERDICHTUNG_S2;
  return ersetzePlatzhalter(roh, {
    profil: { kurzname: profil.manifest.variablen.meldende_stelle, ...profil.manifest.variablen, referenzraum: profil.manifest.referenzraum },
  }).text;
}
