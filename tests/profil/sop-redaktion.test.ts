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

  it("KP-2026-W43-41: Kategorie M nennt Betreiber- und Behördenzitat wie Kodierleitfaden und Erfassung", () => {
    expect(String(ui.quellen.kategorien.M)).toContain("Betreiber- oder Behördenzitat");
    expect(lies(`${PROFIL}/kodierleitfaden.md`)).toContain("Betreiber- oder Behördenzitat");
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
