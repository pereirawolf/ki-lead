// Maschinenlesbare Lizenzzuordnung nach REUSE (Issue #89, Entscheidung des Herausgebers vom 28.10.2026).
// Maßgeblich bleibt LICENSE-CONTENT. Das Soll ist unabhängig aus LICENSE-CONTENT (Nr. 1, 2 und 4) und aus den Vorlagen
// der Capacitor-CLI abgeleitet, nicht aus REUSE.toml: sollLizenzen() kodiert die Zuordnung ein zweites Mal, und der
// Abgleich mit dem Werkzeug reuse zeigt, dass REUSE.toml für jede Datei dasselbe ergibt.
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { REPO, repoPfad } from "../support/dateien";

const lies = (...teile: string[]) => readFileSync(repoPfad(...teile), "utf-8");
/** Leerraum vereinheitlichen: Lizenztexte liegen mit unterschiedlichem Zeilenumbruch vor */
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const ab = (s: string, marke: string) => {
  const i = s.indexOf(marke);
  expect(i, marke).toBeGreaterThan(-1);
  return s.slice(i);
};

const CC_BY = "CC-BY-4.0";
const CC_BY_ODER_CC0 = "CC-BY-4.0 OR CC0-1.0";
const EUPL = "EUPL-1.2";
const EUPL_ODER_CC_BY = "EUPL-1.2 OR CC-BY-4.0";

/** Aus dem App-Symbol erzeugte Symbol- und Startbilder (LICENSE-CONTENT, Nr. 1 d) */
const APP_SYMBOL = [
  /^public\/icons\//,
  /^public\/favicon\.ico$/,
  /^android\/app\/src\/main\/res\/mipmap-[^/]+\/[^/]+\.png$/,
  /^android\/app\/src\/main\/res\/drawable[^/]*\/splash\.png$/,
  /^ios\/App\/App\/Assets\.xcassets\/(AppIcon\.appiconset|Splash\.imageset)\/[^/]+\.png$/,
];

/** Soll je Datei nach LICENSE-CONTENT, vom Besonderen zum Allgemeinen */
function sollLizenzen(pfad: string): string[] {
  // Nr. 2 d: CC0 1.0 nur für Teile der Datei (Snippets), die Datei selbst nach Nr. 1 c
  if (pfad === "docs/VORLAGEN.md" || pfad === "docs/DATENSCHUTZ.md") return [CC_BY, CC_BY_ODER_CC0];
  // Nr. 2 a bis c
  if (
    /^profile\/muster\//.test(pfad) ||
    /^profile\/[^/]+\/(meldung\.schema|profil|kontakte)\.json$/.test(pfad) ||
    /^profile\/[^/]+\/sop\/quellenregister\.json$/.test(pfad) ||
    /^evaluation\/.*\.schema\.json$/.test(pfad)
  )
    return [CC_BY_ODER_CC0];
  // Nr. 1 d
  if (APP_SYMBOL.some((r) => r.test(pfad))) return [EUPL_ODER_CC_BY];
  // Nr. 4, Dateien Dritter: Gradle-Wrapper, übrige native Projektdateien aus Vorlagen der Capacitor-CLI
  if (/^android\/(gradlew(\.bat)?|gradle\/wrapper\/gradle-wrapper\.jar)$/.test(pfad)) return ["Apache-2.0"];
  if (/^(android|ios)\//.test(pfad)) return ["MIT"];
  // Nr. 1 b: Quelltext in evaluation/ fällt unter Nr. 4
  if (/^evaluation\/.*\.ts$/.test(pfad)) return [EUPL];
  // Nr. 1 a bis c
  if (/^(profile|evaluation|docs)\//.test(pfad) || /^(README|CHANGELOG|SECURITY|THIRD-PARTY-NOTICES)\.md$/.test(pfad)) return [CC_BY];
  // Nr. 4
  return [EUPL];
}

describe("Lizenztexte unter LICENSES/ (Issue #89)", () => {
  it("genau die fünf verwendeten Lizenzen", () => {
    expect(readdirSync(repoPfad("LICENSES")).sort()).toEqual(["Apache-2.0.txt", "CC-BY-4.0.txt", "CC0-1.0.txt", "EUPL-1.2.txt", "MIT.txt"]);
  });

  it("EUPL-1.2 wortgleich mit LICENSE", () => {
    expect(norm(lies("LICENSES", "EUPL-1.2.txt"))).toBe(norm(lies("LICENSE")));
  });

  it("CC BY 4.0 wortgleich mit dem Lizenztext in LICENSE-CONTENT", () => {
    const text = norm(lies("LICENSES", "CC-BY-4.0.txt"));
    expect(text).toMatch(/^Creative Commons Attribution 4\.0 International/);
    expect(norm(lies("LICENSE-CONTENT"))).toContain(text);
  });

  it("CC0 1.0: Widmungstext ab „Statement of Purpose“ wortgleich mit LICENSE-CC0", () => {
    const text = ab(norm(lies("LICENSES", "CC0-1.0.txt")), "Statement of Purpose");
    expect(text).toMatch(/or use of the Work\.$/);
    expect(norm(lies("LICENSE-CC0"))).toContain(text);
  });

  it("MIT wortgleich mit der Lizenz der Capacitor-CLI, Apache-2.0 ist die Fassung 2.0 des Gradle-Wrappers", () => {
    const capacitor = ab(norm(lies("node_modules", "@capacitor", "cli", "LICENSE")), "Permission is hereby granted");
    expect(ab(norm(lies("LICENSES", "MIT.txt")), "Permission is hereby granted")).toBe(capacitor);
    expect(norm(lies("LICENSES", "Apache-2.0.txt"))).toMatch(/^Apache License Version 2\.0, January 2004/);
    expect(lies("android", "gradlew")).toContain("SPDX-License-Identifier: Apache-2.0");
  });
});

describe("REUSE.toml und Snippets (Issue #89)", () => {
  it("nennt LICENSE-CONTENT als maßgeblich", () => {
    expect(lies("REUSE.toml")).toContain("Maßgeblich ist LICENSE-CONTENT");
  });

  /** Text zwischen SPDX-SnippetBegin und SPDX-SnippetEnd; genau ein Snippet je Datei */
  const snippet = (datei: string) => {
    const t = lies(datei);
    expect(t.split("SPDX-SnippetBegin").length - 1, datei).toBe(1);
    const teil = t.slice(t.indexOf("SPDX-SnippetBegin"), t.indexOf("SPDX-SnippetEnd"));
    expect(teil).toContain(`SPDX-License-Identifier: ${CC_BY_ODER_CC0}`);
    return teil;
  };

  it("VORLAGEN.md: das Snippet umfasst V1 bis V6, nicht Übersicht und Quellen", () => {
    const teil = snippet("docs/VORLAGEN.md");
    for (const v of ["## V1:", "## V2:", "## V3:", "## V4:", "## V5:", "## V6:"]) expect(teil, v).toContain(v);
    for (const nicht of ["## Übersicht", "## Rechtliche Anknüpfungspunkte", "## Quellen"]) expect(teil, nicht).not.toContain(nicht);
  });

  it("DATENSCHUTZ.md: das Snippet umfasst Anhang C und D, nicht Anhang B und Quellen", () => {
    const teil = snippet("docs/DATENSCHUTZ.md");
    for (const anhang of ["## Anhang C:", "## Anhang D:"]) expect(teil, anhang).toContain(anhang);
    for (const nicht of ["## Anhang B:", "## Quellen", "## 12."]) expect(teil, nicht).not.toContain(nicht);
  });
});

/** Dateinamen und Inhalte eines tar.gz-Archivs (ustar, mit PAX-Pfaden) */
function tarInhalt(datei: string): Map<string, Buffer> {
  const daten = gunzipSync(readFileSync(datei));
  const aus = new Map<string, Buffer>();
  let pos = 0;
  let paxPfad: string | undefined;
  while (pos + 512 <= daten.length) {
    const kopf = daten.subarray(pos, pos + 512);
    if (kopf.every((b) => b === 0)) break;
    const feld = (von: number, laenge: number) =>
      kopf
        .subarray(von, von + laenge)
        .toString("utf-8")
        .replace(/\0.*$/s, "");
    const groesse = parseInt(feld(124, 12).trim() || "0", 8);
    const typ = feld(156, 1);
    const inhalt = daten.subarray(pos + 512, pos + 512 + groesse);
    if (typ === "x") paxPfad = /\d+ path=([^\n]+)\n/.exec(inhalt.toString("utf-8"))?.[1];
    else if (typ === "0" || typ === "") {
      const prefix = feld(345, 155);
      const name = paxPfad ?? (prefix ? `${prefix}/${feld(0, 100)}` : feld(0, 100));
      aus.set(name.replace(/^\.\//, ""), inhalt);
      paxPfad = undefined;
    } else paxPfad = undefined;
    pos += 512 + Math.ceil(groesse / 512) * 512;
  }
  return aus;
}

const imRepository = (...ordner: string[]) =>
  execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", ...ordner], { cwd: REPO, encoding: "utf-8" })
    .split("\0")
    .filter(Boolean);

describe("native Projekte: Vorlagen der Capacitor-CLI und das App-Symbol (LICENSE-CONTENT, Nr. 1 d und 4)", () => {
  const assets = (name: string) => repoPfad("node_modules", "@capacitor", "cli", "assets", name);
  const vorlagen = {
    android: tarInhalt(assets("android-template.tar.gz")),
    ios: tarInhalt(assets("ios-spm-template.tar.gz")),
  };
  /** Pfad der Datei in der Vorlage; das Java-Paket heißt dort com.getcapacitor.myapp */
  const inVorlage = (pfad: string) => {
    const [plattform, ...rest] = pfad.split("/");
    const name = rest.join("/").replace("java/de/pereirawolf/kilead/", "java/com/getcapacitor/myapp/");
    return vorlagen[plattform as "android" | "ios"].get(name);
  };

  it("jede Datei stammt aus der Vorlage, ist von der CLI erzeugt oder ist ein Bild des App-Symbols", () => {
    const dateien = imRepository("android", "ios");
    expect(dateien.length).toBeGreaterThan(50);
    const fremd = dateien.filter(
      (p) =>
        !APP_SYMBOL.some((r) => r.test(p)) &&
        !inVorlage(p) &&
        !lies(p).startsWith('// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN'),
    );
    expect(fremd).toEqual([]);
  });

  it("die Symbol- und Startbilder sind aus dem App-Symbol erzeugt, nicht die der Vorlage", () => {
    const bilder = imRepository("android", "ios").filter((p) => APP_SYMBOL.some((r) => r.test(p)));
    expect(bilder.length).toBeGreaterThan(20);
    const wieVorlage = bilder.filter((p) => inVorlage(p)?.equals(readFileSync(repoPfad(p))));
    expect(wieVorlage).toEqual([]);
  });
});

// Abgleich mit dem Werkzeug reuse (https://reuse.software). In der CI Pflicht (pages.yml installiert es);
// lokal entfällt der Abgleich, wenn reuse fehlt (Installation: pipx install reuse==6.3.0).
const REUSE_DA = spawnSync("reuse", ["--version"], { stdio: "ignore" }).status === 0;

describe("Abgleich mit reuse lint (Issue #89)", () => {
  it("reuse ist in der CI vorhanden", () => {
    if (process.env.CI) expect(REUSE_DA).toBe(true);
  });

  it.skipIf(!REUSE_DA)(
    "REUSE-konform, und für jede Datei ergibt REUSE.toml dieselben Lizenzen wie LICENSE-CONTENT",
    () => {
      const lauf = spawnSync("reuse", ["lint", "--json"], { cwd: REPO, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
      const bericht = JSON.parse(lauf.stdout) as { files: { path: string; spdx_expressions: { value: string }[] }[] };
      expect(lauf.status, lauf.stdout.slice(-2000)).toBe(0);
      // Lizenzdateien und REUSE.toml selbst erfasst reuse nicht
      const dateien = imRepository().filter((p) => !/^(LICENSE(-CONTENT|-CC0)?|LICENSES\/.*|REUSE\.toml)$/.test(p));
      const ist = new Map(bericht.files.map((f) => [f.path, [...new Set(f.spdx_expressions.map((e) => e.value))].sort()]));
      expect([...ist.keys()].sort()).toEqual([...dateien].sort());
      const abweichend = dateien
        .map((p) => ({ p, soll: [...sollLizenzen(p)].sort(), ist: ist.get(p) }))
        .filter(({ soll, ist }) => JSON.stringify(soll) !== JSON.stringify(ist));
      expect(abweichend).toEqual([]);
    },
    60_000,
  );
});
