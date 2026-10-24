// Lizenzen der Inhalte (seit 0.5.9): Geltungsbereich in LICENSE-CONTENT, zusätzliche CC0-Widmung, einheitlicher
// Kurzsatz in den Dokumenten, Lizenzangaben der mitgelieferten Profile. Soll unabhängig aus der Freigabe des
// Herausgebers vom 24.10.2026 (Befunde KP-2026-W43-54 bis -60), nicht aus den geprüften Dateien abgeleitet.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";

const lies = (...teile: string[]) => readFileSync(repoPfad(...teile), "utf-8");
/** Markdown-Links [Text](Ziel) → Text */
const ohneLinks = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

const KURZSATZ =
  "Code unter EUPL-1.2 (LICENSE); Beispielprofile, Evaluationsmaterial und Dokumentation unter CC BY 4.0, maschinenlesbare Dateien und die Vorlage zusätzlich unter CC0 1.0, mit den Ausnahmen in LICENSE-CONTENT";

/** Alle Dateien unter einem Ordner, relativ zum Repository */
function dateienUnter(ordner: string): string[] {
  const aus: string[] = [];
  const gehe = (rel: string) => {
    for (const name of readdirSync(repoPfad(rel))) {
      const pfad = join(rel, name);
      if (statSync(repoPfad(pfad)).isDirectory()) gehe(pfad);
      else aus.push(pfad);
    }
  };
  gehe(ordner);
  return aus;
}

describe("LICENSE-CONTENT: Geltungsbereich (KP-2026-W43-55)", () => {
  const text = lies("LICENSE-CONTENT");
  // Zeilenumbrüche des Klartexts zu Leerzeichen, damit Wendungen über Zeilen hinweg gefunden werden
  const praeambel = text.slice(0, text.indexOf("Creative Commons Attribution 4.0 International")).replace(/[ \t]*\n[ \t]*/g, " ");

  it("nennt Copyright-Vermerk, Grundsatz und die Ordner profile/, evaluation/ und docs/", () => {
    expect(praeambel).toContain("© 2026 Heiko Pereira Wolf");
    expect(praeambel).toContain("sie schränken keine ein");
    for (const ordner of ["profile/", "evaluation/", "docs/"]) expect(praeambel, ordner).toContain(ordner);
  });

  it("grenzt eigene Profile, Ausgaben, amtliche Werke, Drittinhalte und die Aufsätze ab", () => {
    expect(praeambel).toContain("Profile, die Nutzende selbst erstellen oder importieren");
    expect(praeambel).toContain("ohne Namensnennung verwendet werden");
    expect(praeambel).toContain("§ 5 UrhG");
    expect(praeambel).toContain("Namen, Marken, Zeichen und Logos Dritter");
    expect(praeambel).toContain("CC BY-NC-ND 4.0");
  });

  it("enthält den vollständigen Lizenztext CC BY 4.0", () => {
    expect(text).toContain("Creative Commons Attribution 4.0 International Public License");
    expect(text).toContain("Section 8 – Interpretation.");
  });
});

describe("CC0 1.0 zusätzlich für maschinenlesbare Dateien und die Vorlage (KP-2026-W43-56)", () => {
  it("LICENSE-CC0 enthält den Text der Widmung und verweist auf LICENSE-CONTENT", () => {
    const cc0 = lies("LICENSE-CC0");
    expect(cc0).toContain("LICENSE-CONTENT, Nr. 2");
    expect(cc0).toContain("CC0 1.0 Universal");
    expect(cc0).toContain("Statement of Purpose");
    expect(cc0).toContain("Limitations and Disclaimers.");
  });

  it("LICENSE-CONTENT nennt Schemata, Manifeste, Kontaktlisten, Quellenregister und die Vorlage; Darstellungsdateien bleiben bei CC BY 4.0", () => {
    const t = lies("LICENSE-CONTENT").replace(/[ \t]*\n[ \t]*/g, " ");
    const nr2 = t.slice(t.indexOf("2. Zusätzlich CC0 1.0."), t.indexOf("3. Ausgaben der App."));
    for (const muster of ["meldung.schema.json", "profil.json", "kontakte.json", "quellenregister.json", "*.schema.json", "profile/muster/"])
      expect(nr2, muster).toContain(muster);
    expect(nr2).toMatch(/meldung\.ui\.json\)[\s\S]*allein CC BY 4\.0/);
  });

  it("jede so gewidmete Art von Datei gibt es im Repository", () => {
    const profil = dateienUnter("profile");
    for (const endung of ["/meldung.schema.json", "/profil.json", "/kontakte.json", "/sop/quellenregister.json"])
      expect(
        profil.some((p) => p.endsWith(endung)),
        endung,
      ).toBe(true);
    expect(dateienUnter("evaluation").some((p) => p.endsWith(".schema.json"))).toBe(true);
  });
});

describe("Kurzsatz zu den Lizenzen in den Dokumenten (KP-2026-W43-59)", () => {
  it.each(["README.md", "THIRD-PARTY-NOTICES.md", "docs/SPEZIFIKATION.md", "docs/ERPROBUNG.md", "public/lizenzen-ergaenzend.md"])("%s", (datei) => {
    expect(ohneLinks(lies(datei))).toContain(KURZSATZ);
  });

  it("CITATION.cff nennt beide Lizenzen", () => {
    const cff = lies("CITATION.cff");
    expect(cff).toMatch(/^license:\n {2}- EUPL-1\.2\n {2}- CC-BY-4\.0$/m);
  });

  it("die Übersichten in evaluation/ und den Profilen nennen ihre Lizenz", () => {
    expect(lies("evaluation/README.md")).toContain("LICENSE-CONTENT");
    expect(lies("evaluation/pruefsteine/README.md")).toContain("LICENSE-CONTENT");
    expect(lies("profile/lead-beispiel/sop/README.md")).toContain("CC BY 4.0");
    expect(lies("profile/muster/README.md")).toContain("CC0 1.0");
  });

  it("der unbestimmte Begriff „Profilinhalte“ kommt in der App nicht mehr vor (KP-2026-W43-54)", () => {
    const treffer = dateienUnter("src").filter((p) => /\.(ts|tsx)$/.test(p) && /Profilinhalte/.test(lies(p)));
    expect(treffer).toEqual([]);
  });
});

describe("Lizenzangaben der mitgelieferten Profile (KP-2026-W43-58)", () => {
  /** Lizenzen, die die Profile im Repository verwenden dürfen; andere nur nach Änderung von LICENSE-CONTENT */
  const ERLAUBT = new Set(["CC-BY-4.0", "CC0-1.0"]);

  it.each(readdirSync(repoPfad("profile")))("%s: lizenz ist eine zulässige SPDX-Kennung oder ein Ausdruck daraus", (ordner) => {
    const m = JSON.parse(lies("profile", ordner, "profil.json"));
    expect(typeof m.lizenz).toBe("string");
    const teile = (m.lizenz as string).replace(/[()]/g, "").split(/ (?:OR|AND) /);
    for (const t of teile) expect(ERLAUBT.has(t) || /^LicenseRef-[A-Za-z0-9.-]+$/.test(t), t).toBe(true);
  });

  it("Beispielprofil: CC BY 4.0 mit Herausgeber; Vorlage: CC0 1.0 mit Platzhalter als Herausgeber", () => {
    const beispiel = JSON.parse(lies("profile", "lead-beispiel", "profil.json"));
    expect([beispiel.lizenz, beispiel.herausgeber]).toEqual(["CC-BY-4.0", "Heiko Pereira Wolf (https://www.pereirawolf.de)"]);
    const vorlage = JSON.parse(lies("profile", "muster", "profil.json"));
    expect([vorlage.lizenz, vorlage.herausgeber]).toEqual(["CC0-1.0", "[Herausgeber]"]);
  });

  it("PROFILFORMAT beschreibt das Feld lizenz; das Beispiel „Kreis X“ nutzt keine CC-Lizenz", () => {
    const format = lies("docs", "PROFILFORMAT.md");
    expect(format).toMatch(/^- `herausgeber`, `lizenz` \(optional\): .*SPDX-Kennung/m);
    expect(format).toContain('"lizenz": "LicenseRef-intern"');
  });
});
