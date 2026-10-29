// Redaktionsregeln der SOP-Sammelmappe aus der Konsistenzprüfung KW 43 (Befunde KP-2026-W43-…).
// Das Soll folgt jeweils aus der genannten Regel in Teil A bzw. im Kodierleitfaden; geprüft wird der Dateitext.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";

const SOP = "profile/lead-beispiel/sop";
const PROFIL = "profile/lead-beispiel";

function lies(pfad: string): string {
  return readFileSync(repoPfad(pfad), "utf-8");
}

function dateien(teil: "teil-b" | "teil-c") {
  const namen = readdirSync(repoPfad(`${SOP}/${teil}`))
    .filter((n) => n.endsWith(".md"))
    .sort();
  if (namen.length !== 17) throw new Error(`${teil}: 17 Dateien erwartet, gefunden ${namen.length}`);
  return namen.map((n) => ({ name: n, text: readFileSync(repoPfad(`${SOP}/${teil}/${n}`), "utf-8") }));
}

const teilB = dateien("teil-b");
const teilC = dateien("teil-c");
const alle = [...teilB, ...teilC];

function kopf(text: string): string {
  const m = text.match(/```yaml\n([\s\S]*?)```/);
  if (!m) throw new Error("YAML-Kopf fehlt");
  return m[1];
}

function feld(text: string, name: string): string | undefined {
  return kopf(text).match(new RegExp(`^${name}: "(.*)"$`, "m"))?.[1];
}

function zeilen(text: string) {
  return text.split("\n");
}

describe("SOP-Redaktion (Konsistenzprüfung KW 43)", () => {
  it("KP-2026-W43-01: „Offenlassen“ lässt D6 nicht schon ohne belegte Kopplung offen (Kodierleitfaden D6: dann Stufe 0)", () => {
    const treffer = alle.flatMap(({ name, text }) =>
      zeilen(text)
        .filter((z) => z.startsWith("**Offenlassen:**") && /D6 ohne (belegte )?Kopplung/.test(z))
        .map(() => name),
    );
    expect(treffer).toEqual([]);
  });

  it("KP-2026-W43-02: D8 wird über den zurückliegenden Beobachtungszeitraum bestimmt, nicht über den Betrachtungszeitraum (A.2)", () => {
    const treffer = alle.flatMap(({ name, text }) =>
      zeilen(text)
        .filter((z) => z.includes("D8") && z.includes("Betrachtungszeitraum"))
        .map(() => name),
    );
    expect(treffer).toEqual([]);
  });

  it("KP-2026-W43-03: jeder Fachgrundlagen-Block trägt die einheitliche Kopfzeile nach A.6", () => {
    const soll =
      "**Fachgrundlagen** (A.6; sie bestätigen kein aktuelles Ereignis und werden im Quellenverzeichnis der Meldung nur geführt, wenn eine Aussage darauf beruht):";
    const bloecke = alle.flatMap(({ name, text }) =>
      zeilen(text)
        .filter((z) => z.startsWith("**Fachgrundlagen** ("))
        .map((z) => ({ name, z })),
    );
    expect(bloecke.length).toBeGreaterThan(0);
    expect(bloecke.filter((b) => b.z !== soll).map((b) => b.name)).toEqual([]);
  });

  it("KP-2026-W43-06: jeder Baustein in Teil C führt `art_hinweis`; C07 nennt C09 und C10 in `anschluss`", () => {
    expect(teilC.filter(({ text }) => !feld(text, "art_hinweis")).map((d) => d.name)).toEqual([]);
    const c07 = teilC.find((d) => d.name.startsWith("C07_"))!;
    expect(feld(c07.text, "anschluss")).toMatch(/C09/);
    expect(feld(c07.text, "anschluss")).toMatch(/C10/);
  });

  it("KP-2026-W43-07: `anschluss` verweist nicht auf Teil A, außer als geklammerte Bedingung (A.1 Nr. 7)", () => {
    const treffer = alle.filter(({ text }) => {
      const wert = (feld(text, "anschluss") ?? "").replace(/\(A\.[^)]*\)/g, "");
      return /\bA\.\d/.test(wert);
    });
    expect(treffer.map((d) => d.name)).toEqual([]);
  });

  it("KP-2026-W43-08: Typologietabellen mit feststellender Stelle verwenden den Spaltenkopf nach A.10.1", () => {
    const koepfe = alle.flatMap(({ name, text }) =>
      zeilen(text)
        .filter((z) => /^\| [^|]+ \| Feststellende Stelle/.test(z))
        .map((z) => ({ name, spalte: z.split("|")[2].trim() })),
    );
    expect(koepfe.length).toBeGreaterThan(0);
    expect(koepfe.filter((k) => k.spalte !== "Feststellende Stelle und Voraussetzung").map((k) => k.name)).toEqual([]);
  });

  it("KP-2026-W43-09: Prüffragen werden als „B11/R6“ zitiert, nicht als „B11 (R6)“ (A.10.1)", () => {
    const treffer = alle.filter(({ text }) => /\b[BC]\d{2} \(R\d+\)/.test(text));
    expect(treffer.map((d) => d.name)).toEqual([]);
  });

  it("KP-2026-W43-10: „Versorgungskrise“ außerhalb von C14 nur mit Bezug auf ESVG oder C14 (A.10.1)", () => {
    const treffer = alle.flatMap(({ name, text }) =>
      name.startsWith("C14_")
        ? []
        : text
            .split(/(?<=\.)\s+/)
            .filter((satz) => satz.includes("Versorgungskrise") && !/ESVG|C14/.test(satz))
            .map(() => name),
    );
    expect(treffer).toEqual([]);
  });

  it("KP-2026-W43-11: C12, C13 und C14 knüpfen „KRITIS-Ausfall“ an die Schwelle von B12", () => {
    for (const kennung of ["C12_", "C13_", "C14_"]) {
      const { text } = teilC.find((d) => d.name.startsWith(kennung))!;
      const stellen = [feld(text, "art_hinweis") ?? "", zeilen(text).find((z) => z.startsWith("**Zuordnung im Schema:**")) ?? ""];
      for (const s of stellen) {
        expect(s, kennung).toMatch(/„KRITIS-Ausfall“ bei belegtem Ausfall oder wesentlicher Einschränkung/);
      }
    }
  });

  it("KP-2026-W43-12: „Schwereklasse“ ist kein Begriff der Mappe; die Beurteilung regelt A.4", () => {
    expect(alle.filter(({ text }) => text.includes("Schwereklasse")).map((d) => d.name)).toEqual([]);
  });

  it("KP-2026-W43-16: Dateien mit gezielt abgeglichenen Registerquellen führen `quellen_geprueft_am` (A.10.2)", () => {
    const register = JSON.parse(lies(`${SOP}/quellenregister.json`)) as { eintraege: { url?: string; status?: string }[] };
    const abgeglichen = new Set(register.eintraege.filter((e) => e.status === "gezielter_inhaltsabgleich" && e.url).map((e) => e.url!));
    expect(abgeglichen.size).toBeGreaterThan(0);
    const fehlend = alle.filter(({ text }) => {
      const urls = [...text.matchAll(/\]\((https:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
      return urls.some((u) => abgeglichen.has(u)) && !feld(text, "quellen_geprueft_am");
    });
    expect(fehlend.map((d) => d.name)).toEqual([]);
  });

  it("KP-2026-W43-22: Folge-SOPs nach dem Funktionsdach B12, nicht als Bereich „B08–B12“ (A.1 Nr. 2)", () => {
    const quellen = [...teilB, { name: "A_Gemeinsame-Regeln.md", text: lies(`${SOP}/A_Gemeinsame-Regeln.md`) }];
    expect(quellen.filter(({ text }) => text.includes("B08–B12")).map((d) => d.name)).toEqual([]);
  });

  it("KP-2026-W43-25, -27: Typologietabellen nennen die Fachgrundlage im Kopf und haben eine der zwei Spalten nach A.10.1", () => {
    const zulaessig = ["Fallgruppe", "Feststellende Stelle und Voraussetzung"];
    const koepfe = alle.flatMap(({ name, text }) =>
      zeilen(text)
        .filter((z) => /^\| [^|]+ \| [^|]+ \| Abgrenzung für die Befassung \|$/.test(z))
        .map((z) => ({
          name,
          spalten: z
            .split("|")
            .slice(1, 4)
            .map((s) => s.trim()),
        })),
    );
    expect(koepfe.length).toBeGreaterThanOrEqual(7);
    expect(koepfe.filter((k) => !/\(.+\)/.test(k.spalten[0])).map((k) => k.name)).toEqual([]);
    expect(koepfe.filter((k) => !zulaessig.includes(k.spalten[1])).map((k) => `${k.name}: ${k.spalten[1]}`)).toEqual([]);
  });

  it("KP-2026-W43-32: frühe Befassung heißt einheitlich so (A.1 Nr. 1), nicht „Vorwarnlage“ oder „Vorsorgelage nach A.1“", () => {
    const treffer = alle.filter(({ text }) => /Vorwarnlage|Vorsorgelagen|Vorsorgelage nach A\.1/.test(text));
    expect(treffer.map((d) => d.name)).toEqual([]);
  });
});

describe("Arbeitsanweisungen und Darstellungsdatei (Konsistenzprüfung KW 43)", () => {
  const anweisungen = ["anweisung-erfassung.md", "anweisung-verdichtung.md", "anweisung-kurzfassung.md"].map((n) => ({
    name: n,
    text: lies(`${PROFIL}/${n}`),
  }));
  const ui = JSON.parse(lies(`${PROFIL}/meldung.ui.json`));

  it("KP-2026-W43-36: jeder Satzanfang „Einschätzung (…):“ der Anweisungen trifft ein Gliederungsmuster der Darstellungsdatei", () => {
    const muster = [
      ...(ui.bewertung_gliederung?.absatz ?? []),
      ...(ui.bewertung_gliederung?.zeile ?? []),
      ...(ui.analyse_gliederung?.absatz ?? []),
      ...(ui.analyse_gliederung?.zeile ?? []),
    ].map((m: string) => new RegExp(m));
    const anfaenge = anweisungen.flatMap(({ name, text }) => [...text.matchAll(/„(Einschätzung[^„“]*?:)/g)].map((m) => ({ name, anfang: m[1] })));
    expect(anfaenge.length).toBeGreaterThan(0);
    expect(anfaenge.filter((a) => !muster.some((m: RegExp) => m.test(a.anfang))).map((a) => `${a.name}: ${a.anfang}`)).toEqual([]);
  });

  it("KP-2026-W43-37: das Format des Kennsatzes „Handlungsrelevant bis:“ nennt die Bedingung „(falls zutreffend)“ wie A.4", () => {
    const zeilenMitFormat = anweisungen.flatMap(({ name, text }) =>
      zeilen(text)
        .filter((z) => z.includes("`Handlungsrelevant bis: TT.MM.JJJJ"))
        .map((z) => ({ name, z })),
    );
    expect(zeilenMitFormat.length).toBeGreaterThan(0);
    expect(zeilenMitFormat.filter((x) => !x.z.includes("Bedingung (falls zutreffend)")).map((x) => x.name)).toEqual([]);
  });

  it("KP-2026-W43-40: Anweisungen verwenden die Kennungen B01–B17, keine alten SOP-Nummern", () => {
    const treffer = anweisungen.filter(({ text }) =>
      /\b(0[1-9]|1[0-7]) (Unwetter|Hochwasser|Waldbrand|Erdbeben|Extremhitze|Wintersturm|Industrieunfall|Stromausfall|Gasversorgung|Trinkwasser)/.test(text),
    );
    expect(treffer.map((d) => d.name)).toEqual([]);
  });

  // Seit 0.6.4 (TP-2026-W44-32, Pflegeregel A.10.2 „ein Ort, Verweise sonst“): statt Gleichlaut in vier Dateien steht die
  // Regel genau im Kodierleitfaden; Darstellungsdatei und Erfassung verweisen bzw. führen nur den Kategorienamen.
  it("KP-2026-W43-41: Kategorie M mit Betreiber- und Behördenzitat steht genau im Kodierleitfaden, die übrigen verweisen", () => {
    expect(lies(`${PROFIL}/kodierleitfaden.md`)).toContain("auch Berichte mit Betreiber- oder Behördenzitat");
    expect(String(ui.quellen.kategorien.M)).toBe("Medien");
    const erfassung = lies(`${PROFIL}/anweisung-erfassung.md`);
    expect(erfassung).not.toContain("Betreiber- oder Behördenzitat");
    expect(erfassung).toMatch(/Kodierleitfaden, Abschnitt 5/);
    expect(lies(`${SOP}/A_Gemeinsame-Regeln.md`)).not.toContain("Betreiberzitat bleibt M");
  });
});

describe("Dokumentation gegen Profil (Konsistenzprüfung KW 43)", () => {
  const spez = lies("docs/SPEZIFIKATION.md");
  const format = lies("docs/PROFILFORMAT.md");

  function jsonBlock(nachUeberschrift: string) {
    const ab = spez.indexOf(nachUeberschrift);
    if (ab < 0) throw new Error(`Überschrift fehlt: ${nachUeberschrift}`);
    const m = spez.slice(ab).match(/```json\n([\s\S]*?)```/);
    if (!m) throw new Error(`JSON-Block fehlt nach ${nachUeberschrift}`);
    return JSON.parse(m[1]);
  }

  it("KP-2026-W43-44: der Auszug in SPEZIFIKATION 4.3 verwendet nur Schlüssel der Beispiel-Darstellungsdatei, Kennsätze wortgleich", () => {
    const auszug = jsonBlock("### 4.3 ");
    const ui = JSON.parse(lies(`${PROFIL}/meldung.ui.json`));
    expect(Object.keys(auszug).filter((k) => !(k in ui))).toEqual([]);
    expect(auszug.kennsaetze).toEqual(ui.kennsaetze);
    expect(auszug.dateiname).toBe(ui.dateiname);
    expect(auszug.rollen.status_feld).toBe(ui.rollen.status_feld);
  });

  it("KP-2026-W43-46: der Manifest-Auszug in SPEZIFIKATION 4.2 stimmt mit profil.json überein", () => {
    const auszug = jsonBlock("### 4.2 ");
    const profil = JSON.parse(lies(`${PROFIL}/profil.json`));
    for (const k of ["format", "id", "name", "version", "ebene", "referenzraum", "kodierleitfaden", "kontakte"]) expect(auszug[k], k).toBe(profil[k]);
    expect(auszug.meldung).toEqual(profil.meldung);
    expect(auszug.anweisungen).toEqual(profil.anweisungen);
  });

  it("KP-2026-W43-52, -53: PROFILFORMAT nennt alle Schlüssel, die die mitgelieferten Profile verwenden", () => {
    const fehlend: string[] = [];
    for (const p of ["lead-beispiel", "muster"]) {
      const ui = JSON.parse(lies(`profile/${p}/meldung.ui.json`));
      const schluessel = [...Object.keys(ui), ...Object.keys(ui.rollen ?? {}), ...Object.values(ui.felder ?? {}).flatMap((f) => Object.keys(f as object))];
      for (const k of new Set(schluessel)) if (!format.includes(`\`${k}\``)) fehlend.push(`${p}: ${k}`);
    }
    for (const { name, text } of alle)
      for (const z of kopf(text).split("\n")) {
        const k = z.match(/^([a-z_]+):/)?.[1];
        if (k && !format.includes(`\`${k}\``)) fehlend.push(`${name}: ${k}`);
      }
    expect([...new Set(fehlend)]).toEqual([]);
  });
});

describe("Ein Ort für Achsen- und Quellenregeln und die Rangfolge (TP-2026-W44-32)", () => {
  // Alle Markdown-Dateien des Profilpakets außer Verläufen und der erzeugten Lesefassung
  const paket = (): { name: string; text: string }[] => {
    const out: { name: string; text: string }[] = [];
    const lauf = (rel: string) => {
      for (const n of readdirSync(repoPfad(PROFIL, rel), { withFileTypes: true })) {
        const pfad = rel ? `${rel}/${n.name}` : n.name;
        if (n.isDirectory()) lauf(pfad);
        else if (n.name.endsWith(".md") && n.name !== "CHANGELOG.md" && !n.name.includes("Lesefassung"))
          out.push({ name: pfad, text: lies(`${PROFIL}/${pfad}`) });
      }
    };
    lauf("");
    return out;
  };

  it("TP-2026-W44-32: die Quellentabelle A/B/W/M/P kommt genau einmal im Profilpaket vor, im Kodierleitfaden", () => {
    const zeilen = paket().flatMap(({ name, text }) =>
      text
        .split("\n")
        .filter((z) => /^\| \*\*[ABWMP]\*\* \|/.test(z))
        .map(() => name),
    );
    expect(zeilen).toEqual(Array(5).fill("kodierleitfaden.md"));
    // Die Darstellungsdatei führt nur die Kategorienamen, keine Definitionen
    const ui = JSON.parse(lies(`${PROFIL}/meldung.ui.json`));
    for (const [k, v] of Object.entries(ui.quellen.kategorien as Record<string, string>)) expect(v, k).not.toMatch(/ – |;|\(/);
    expect(ui.quellen.rangfolge_hinweis).toMatch(/Kodierleitfaden Abschnitt 5\.$/);
  });

  it("TP-2026-W44-32: Achsenregeln, Begründungsmuster und Rangfolge stehen nur im Kodierleitfaden", () => {
    const merkmale: [string, RegExp][] = [
      ["D2-Nullregel", /aktiv laufenden,? (?:für den Sachverhalt )?einschlägigen Erhebung/],
      ["Begründungsmuster", /D\[n\] = \[Wert\], weil/],
      ["Mindestkodierung", /D2 = 3 \(Mindestwert\): mindestens/],
      ["Rangfolge", /\(1\) (?:JSON-Schema der Meldung \([^)]*\) und )?Stufentexte der Darstellungsdatei|^1\. JSON-Schema und Darstellungsdatei/m],
      ["Zuordnung nach der Rolle", /Die konkrete Rolle entscheidet, nicht Eigentumsform/],
      ["Priorität mit Prüfung", /unmittelbare Sachkenntnis und fachliche Zuständigkeit/],
    ];
    const treffer = merkmale.map(
      ([was, m]) =>
        [
          was,
          paket()
            .filter(({ text }) => m.test(text))
            .map((d) => d.name),
        ] as const,
    );
    expect(Object.fromEntries(treffer)).toEqual(Object.fromEntries(merkmale.map(([was]) => [was, ["kodierleitfaden.md"]])));
  });

  it("TP-2026-W44-32: Entscheidungen des Herausgebers vom 27.10.2026 stehen im Kodierleitfaden", () => {
    const kl = lies(`${PROFIL}/kodierleitfaden.md`);
    expect(kl).toContain("(1) JSON-Schema der Meldung (Struktur, zulässige Werte, Leerwerte) und Stufentexte der Darstellungsdatei");
    expect(kl).toContain("nicht Eigentumsform, Veröffentlichungskanal, Dateiformat oder Bearbeitungsmodus");
    expect(kl).toContain("Bestehende Quelleneinträge werden nicht automatisch umgestuft");
    expect(kl).toMatch(/\*\*Kodierfrage:\*\* Wie verfügbar, verlässlich, aktuell und widerspruchsfrei/);
    // Fassungstabelle aufsteigend (1.3.0 stand vor dem 27.10.2026 hinter 1.4.0)
    const fassungen = [...kl.matchAll(/^\| (\d+\.\d+(?:\.\d+)?) \| \d{2}\.\d{2}\.\d{4} \|/gm)].map((m) => m[1]!.split(".").map(Number));
    const vergleich = (a: number[], b: number[]) => a[0]! - b[0]! || (a[1] ?? 0) - (b[1] ?? 0) || (a[2] ?? 0) - (b[2] ?? 0);
    expect(fassungen.length).toBeGreaterThan(5);
    for (let i = 1; i < fassungen.length; i++) expect(vergleich(fassungen[i - 1]!, fassungen[i]!)).toBeLessThan(0);
  });

  it("TP-2026-W44-32: Regeln, die bisher nur außerhalb des Kodierleitfadens standen, stehen jetzt dort", () => {
    const kl = lies(`${PROFIL}/kodierleitfaden.md`);
    for (const regel of [
      "**Aussagekompetenz:**",
      "Eine Behörde ist primär für ihre Lageeinschätzung maßgeblich",
      "„(Eingangsmaterial)“",
      "Lagebericht des GMLZ",
      "(bis zur Arbeitsfassung v0.3: „J“)",
      "Die Bewertung berücksichtigt Unsicherheit und möglichen Handlungsbedarf eigenständig.",
      "Bildet die Skala eine Achse nur unvollkommen ab",
      "im Feld „Abhängigkeiten & Interdependenzen“ die entscheidende Verbindung",
    ])
      expect(kl, regel).toContain(regel);
  });

  it("TP-2026-W44-32: Pflegeregel A.10.2 „ein Ort, Verweise sonst“; A.2 und A.3 verweisen verbindlich auf den Kodierleitfaden", () => {
    const teilA = lies(`${SOP}/A_Gemeinsame-Regeln.md`);
    const abschnitt = (von: string, bis: string) => teilA.slice(teilA.indexOf(von), teilA.indexOf(bis));
    expect(abschnitt("**A.10.2", "**A.10.3")).toContain("**Ein Ort, Verweise sonst:**");
    expect(abschnitt("**A.10.2", "**A.10.3")).not.toMatch(/gemeinsam in Kodierleitfaden, Darstellungsdatei, Teil A und Arbeitsanweisung fortgeschrieben/);
    const a2 = abschnitt("### A.2", "### A.3");
    expect(a2).toMatch(/stehen nur im \*\*Kodierleitfaden LEAD\*\*/);
    expect(a2).not.toMatch(/^- \*\*D[1-8]/m);
    expect(abschnitt("**Quellen & Referenzen.**", "**Wiederkehrende")).toMatch(/regelt ausschließlich der Kodierleitfaden, Abschnitt 5/);
    expect(lies(`${PROFIL}/kodierleitfaden.md`)).toMatch(/nur in diesem Leitfaden fortgeschrieben \(SOP-LEAD A\.10\.2: ein Ort, Verweise sonst\)/);
  });

  it("TP-2026-W44-32: Gliederung der Erfassung: Rolle → Arbeitsprodukt → Grundlagen/Rangfolge → Regeln → Ausgabe", () => {
    const erfassung = lies(`${PROFIL}/anweisung-erfassung.md`);
    const ueberschriften = erfassung
      .split("\n")
      .filter((z) => z.startsWith("## "))
      .map((z) => z.slice(3));
    expect(ueberschriften).toEqual(["1. Rolle", "2. Arbeitsprodukt", "3. Grundlagen und Rangfolge", "4. Regeln", "5. Ausgabe"]);
    expect(erfassung.indexOf("{{app.ausgabevertrag}}")).toBeGreaterThan(erfassung.indexOf("## 5. Ausgabe"));
  });

  it("Kurzantwort als Prüfauftrag (Erfassung 1.7.0, Rückmeldung vom 29.10.2026): höchstens vier beschriftete Zeilen", () => {
    const erfassung = lies(`${PROFIL}/anweisung-erfassung.md`);
    const ab = erfassung.indexOf("**Kurzantwort** (für die prüfende Person)");
    const bloecke = [...erfassung.slice(ab).matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1]!.trim().split("\n"));
    const beschriftungen = (zeilen: string[]) => zeilen.map((z) => z.slice(0, z.indexOf(":")));
    const soll = ["Kernaussage", "Bitte bestätigen", "Lücken", "Nicht übernommen"];
    // Vorgabe und fiktives Beispiel tragen dieselben Beschriftungen in derselben Reihenfolge
    expect(beschriftungen(bloecke[0]!)).toEqual(soll);
    expect(beschriftungen(bloecke[1]!)).toEqual(soll);
    // das Beispiel hält die eigene Längengrenze ein
    expect(bloecke[1]!.join(" ").split(/\s+/).length).toBeLessThanOrEqual(120);
    // Leerzeilen entfallen, Angaben der App werden nicht wiederholt, interne Kürzel nicht verwendet
    expect(erfassung).toMatch(/Jede andere Zeile lässt du weg, wenn es dazu nichts zu sagen gibt; schreibe dann nicht „keine“/);
    expect(erfassung).toMatch(/Was die App selbst anzeigt, wiederholst du nicht/);
    expect(erfassung).toMatch(/\(S1, S2, t0\) verwendest du nicht/);
    expect(erfassung).not.toMatch(/genau die folgenden acht beschrifteten Zeilen/);
    expect(erfassung).not.toMatch(/höchstens acht Sätze/);
  });
});
