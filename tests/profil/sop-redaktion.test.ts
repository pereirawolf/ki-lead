// Redaktionsregeln der SOP-Sammelmappe aus der Konsistenzprüfung KW 43 (Befunde KP-2026-W43-…).
// Das Soll folgt jeweils aus der genannten Regel in Teil A bzw. im Kodierleitfaden; geprüft wird der Dateitext.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";

const SOP = "profile/lead-beispiel/sop";

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
});
