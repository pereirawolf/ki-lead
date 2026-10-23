// Drittkomponenten und Lizenzen (seit 0.5.5): Jede Laufzeitkomponente nach package-lock.json hat eine Lizenz aus der
// Positivliste und steht mit Version und Lizenz in THIRD-PARTY-NOTICES.md; native Versionen und Lizenzdateien stimmen.
// Läuft offline, liest nur Dateien im Repository. Grundlage: Befund „Grundlagen Priorität 2“ vom 24.10.2026.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";

const lies = (...teile: string[]) => readFileSync(repoPfad(...teile), "utf-8");

/** Zulässige Lizenzen ausgelieferter Komponenten (THIRD-PARTY-NOTICES.md, Abschnitt 7). Änderung nur mit Begründung dort. */
const POSITIVLISTE = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "Zlib",
  "Apache-2.0",
  "PSF-2.0",
  "OFL-1.1",
  "Unlicense",
  "CC0-1.0",
]);

interface LockEintrag {
  version: string;
  license?: string;
  dev?: boolean;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}
const lock = JSON.parse(lies("package-lock.json")) as { packages: Record<string, LockEintrag & { devDependencies?: Record<string, string> }> };
const pakete = lock.packages;

/** Auflösung wie Node: vom Ordner des anfragenden Pakets aufwärts nach node_modules/<name> suchen */
function aufloesen(name: string, von: string): string | null {
  let ordner = von;
  for (;;) {
    const schluessel = (ordner ? ordner + "/" : "") + "node_modules/" + name;
    if (pakete[schluessel]) return schluessel;
    if (!ordner) return null;
    const i = ordner.lastIndexOf("/node_modules/");
    ordner = i < 0 ? "" : ordner.slice(0, i);
  }
}

/** Alle Pakete, die `npm ci --omit=dev` installiert: Hülle der Laufzeit- und optionalen Abhängigkeiten */
function laufzeitPakete(): Map<string, LockEintrag> {
  const gesehen = new Map<string, LockEintrag>();
  const offen = Object.keys(pakete[""].dependencies ?? {}).map((n) => aufloesen(n, ""));
  while (offen.length) {
    const k = offen.pop();
    if (!k || gesehen.has(k)) continue;
    const e = pakete[k];
    gesehen.set(k, e);
    for (const n of Object.keys(e.dependencies ?? {})) offen.push(aufloesen(n, k));
    for (const n of Object.keys(e.optionalDependencies ?? {})) offen.push(aufloesen(n, k));
  }
  return gesehen;
}

/** Name in der Hinweistabelle: Pfad ohne führendes node_modules/, verschachtelte Pakete mit Elternpfad */
const anzeigename = (schluessel: string) => schluessel.replace(/^node_modules\//, "");

/** Zeilen einer Markdown-Tabelle unter einer Überschrift „## <n>.“ */
function tabelle(text: string, abschnitt: string): string[][] {
  const start = text.indexOf(`\n## ${abschnitt}`);
  if (start < 0) throw new Error(`Abschnitt „${abschnitt}“ fehlt in THIRD-PARTY-NOTICES.md`);
  const ende = text.indexOf("\n## ", start + 4);
  return text
    .slice(start, ende < 0 ? undefined : ende)
    .split("\n")
    .filter((z) => z.startsWith("| ") && !z.startsWith("|---"))
    .slice(1)
    .map((z) =>
      z
        .slice(2, -2)
        .split(" | ")
        .map((s) => s.trim().replace(/^`|`$/g, "")),
    );
}

/**
 * Prüft die Lizenzangabe eines Pakets gegen die gewählte Lizenz: „A OR B“ verlangt einen zulässigen, gewählten Zweig,
 * „A AND B“ verlangt alle Teile zulässig und die Angabe vollständig. Liefert einen Fehlertext oder null.
 */
function lizenzFehler(angabe: string | undefined, gewaehlt: string): string | null {
  if (!angabe) return "keine Lizenzangabe im Lockfile";
  const ohneKlammern = angabe.replace(/^\((.*)\)$/, "$1");
  if (/ OR /.test(ohneKlammern)) {
    const zweige = ohneKlammern.split(" OR ").map((s) => s.trim());
    if (!zweige.includes(gewaehlt)) return `gewählte Lizenz „${gewaehlt}“ ist kein Zweig von „${angabe}“`;
    if (!POSITIVLISTE.has(gewaehlt)) return `gewählte Lizenz „${gewaehlt}“ nicht in der Positivliste`;
    return null;
  }
  const teile = ohneKlammern.split(" AND ").map((s) => s.trim());
  const unzulaessig = teile.filter((t) => !POSITIVLISTE.has(t));
  if (unzulaessig.length) return `Lizenz „${unzulaessig.join(", ")}“ nicht in der Positivliste`;
  if (teile.join(" AND ") !== gewaehlt) return `gewählt „${gewaehlt}“ statt „${teile.join(" AND ")}“`;
  return null;
}

const HINWEISE = lies("THIRD-PARTY-NOTICES.md");
const laufzeit = laufzeitPakete();
const tabelleLaufzeit = tabelle(HINWEISE, "2.");

describe("Lizenzen: Prüfregel", () => {
  it.each([
    ["einfache zulässige Lizenz", "MIT", "MIT", null],
    ["Wahl des permissiven Zweigs", "(MIT OR GPL-3.0-or-later)", "MIT", null],
    ["alle Teile einer Und-Verbindung zulässig", "(MIT AND Zlib)", "MIT AND Zlib", null],
  ])("lässt zu: %s", (_fall, angabe, gewaehlt, soll) => {
    expect(lizenzFehler(angabe, gewaehlt)).toBe(soll);
  });

  it.each([
    ["Copyleft ohne Wahl", "GPL-3.0-only", "GPL-3.0-only"],
    ["Copyleft als gewählter Zweig", "(MIT OR GPL-3.0-or-later)", "GPL-3.0-or-later"],
    ["gewählter Zweig nicht in der Angabe", "(MPL-2.0 OR Apache-2.0)", "MIT"],
    ["Und-Verbindung mit unzulässigem Teil", "(MIT AND CC-BY-NC-4.0)", "MIT AND CC-BY-NC-4.0"],
    ["Verweis auf eigene Lizenzdatei", "SEE LICENSE IN LICENSE.md", "SEE LICENSE IN LICENSE.md"],
    ["fehlende Angabe", undefined, "MIT"],
  ])("weist zurück: %s", (_fall, angabe, gewaehlt) => {
    expect(lizenzFehler(angabe, gewaehlt)).not.toBeNull();
  });
});

describe("Lizenzen: Laufzeitkomponenten nach package-lock.json", () => {
  it("findet die Laufzeitkomponenten (Mindestbestand)", () => {
    for (const n of ["node_modules/react", "node_modules/jspdf", "node_modules/@fontsource/atkinson-hyperlegible", "node_modules/jszip/node_modules/pako"]) {
      expect(laufzeit.has(n), n).toBe(true);
    }
    expect([...laufzeit.values()].some((e) => e.dev)).toBe(false);
  });

  it("haben nur Lizenzen aus der Positivliste (bei Wahllizenzen den in THIRD-PARTY-NOTICES.md gewählten Zweig)", () => {
    const gewaehlt = new Map(tabelleLaufzeit.map((z) => [z[0], z[3]]));
    const fehler: string[] = [];
    for (const [k, e] of laufzeit) {
      const name = anzeigename(k);
      const f = lizenzFehler(e.license, gewaehlt.get(name) ?? e.license ?? "");
      if (f) fehler.push(`${name}@${e.version}: ${f}`);
    }
    expect(fehler, "Unverträgliche oder ungeklärte Lizenz; siehe THIRD-PARTY-NOTICES.md, Abschnitt 7").toEqual([]);
  });

  it("stehen vollständig und ohne Überzählige in THIRD-PARTY-NOTICES.md, Abschnitt 2", () => {
    const soll = [...laufzeit.keys()].map(anzeigename).sort();
    const ist = tabelleLaufzeit.map((z) => z[0]).sort();
    expect(ist).toEqual(soll);
  });

  it("stehen dort mit Version, Lizenzangabe, Urheber und Einbindung", () => {
    const einbindungen = new Set(["Web-Build", "Web-Build, nativ", "nachgeladen", "im JSZip-Bundle", "im html2canvas-Bundle", "nativ", "nicht ausgeliefert"]);
    const abweichend: string[] = [];
    for (const [name, version, angabe, , urheber, einbindung] of tabelleLaufzeit) {
      const e = laufzeit.get("node_modules/" + name);
      if (!e) continue;
      if (version !== e.version) abweichend.push(`${name}: Version ${version} statt ${e.version}`);
      if (angabe !== e.license) abweichend.push(`${name}: Lizenz „${angabe}“ statt „${e.license}“`);
      if (!urheber) abweichend.push(`${name}: Urheber fehlt`);
      if (!einbindungen.has(einbindung)) abweichend.push(`${name}: Einbindung „${einbindung}“ unbekannt`);
    }
    expect(abweichend).toEqual([]);
  });
});

describe("Lizenzen: Entwicklungsabhängigkeiten", () => {
  it("stehen mit Version und Lizenz in THIRD-PARTY-NOTICES.md, Abschnitt 5", () => {
    const direkt = Object.keys(pakete[""].devDependencies ?? {}).sort();
    const zeilen = tabelle(HINWEISE, "5.");
    expect(zeilen.map((z) => z[0]).sort()).toEqual(direkt);
    for (const [name, version, lizenz] of zeilen) {
      const e = pakete["node_modules/" + name];
      expect(`${name}@${version} ${lizenz}`).toBe(`${name}@${e.version} ${e.license}`);
    }
  });
});

describe("Lizenzen: native Apps", () => {
  const gradle = lies("android", "variables.gradle");
  const gradleVersion = (variable: string) => gradle.match(new RegExp(`${variable} = '([^']+)'`))?.[1];
  const zeilen = tabelle(HINWEISE, "4.");
  const zeile = (anfang: string) => zeilen.find((z) => z[0].startsWith(anfang));
  const ergaenzend = lies("public", "lizenzen-ergaenzend.md");

  it.each([
    ["Apache Cordova Android framework", "cordovaAndroidVersion"],
    ["AndroidX AppCompat", "androidxAppCompatVersion"],
    ["AndroidX Core (", "androidxCoreVersion"],
    ["AndroidX Activity", "androidxActivityVersion"],
    ["AndroidX Fragment", "androidxFragmentVersion"],
    ["AndroidX CoordinatorLayout", "androidxCoordinatorLayoutVersion"],
    ["AndroidX WebKit", "androidxWebkitVersion"],
    ["AndroidX Core SplashScreen", "coreSplashScreenVersion"],
  ])("%s: Version wie in android/variables.gradle, auch in public/lizenzen-ergaenzend.md", (anfang, variable) => {
    const soll = gradleVersion(variable);
    expect(soll, variable).toBeTruthy();
    expect(zeile(anfang)?.[1]).toBe(soll);
    const titel = anfang.replace(/ \($/, "");
    expect(ergaenzend).toContain(`### ${titel} - ${soll} (`);
  });

  it("Capacitor und Schlüsselbund-Plugin: Versionen wie in package.json", () => {
    const abh = JSON.parse(lies("package.json")).dependencies as Record<string, string>;
    expect(zeile("Capacitor (Android)")?.[1]).toBe(abh["@capacitor/android"]);
    expect(zeile("Capacitor (iOS")?.[1]).toBe(abh["@capacitor/ios"]);
    expect(zeile("Schlüsselbund-Plugin")?.[1]).toBe(abh["@aparajita/capacitor-secure-storage"]);
    expect(lies("ios", "App", "CapApp-SPM", "Package.swift")).toContain(`capacitor-swift-pm.git", exact: "${abh["@capacitor/ios"]}"`);
    expect(ergaenzend).toContain(`### Capacitor (Android) - ${abh["@capacitor/android"]} (`);
    expect(ergaenzend).toContain(`### @aparajita/capacitor-secure-storage - ${abh["@aparajita/capacitor-secure-storage"]} (`);
  });

  it("die NOTICE von Apache Cordova und der Apache-Lizenztext gehen mit der App aus", () => {
    expect(HINWEISE).toContain("Copyright 2015-2020 The Apache Software Foundation");
    expect(ergaenzend).toContain("Copyright 2015-2020 The Apache Software Foundation");
    expect(ergaenzend).toContain("TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION");
    expect(ergaenzend).toContain("END OF TERMS AND CONDITIONS");
  });

  it("die Pakete aus den vorgebauten Bundles stehen in public/lizenzen-ergaenzend.md mit der Version aus dem Lockfile", () => {
    const gebuendelt = tabelleLaufzeit.filter((z) => z[5] === "im JSZip-Bundle" || z[5] === "im html2canvas-Bundle");
    expect(gebuendelt.length).toBeGreaterThan(0);
    for (const [name, version] of gebuendelt) {
      const kurz = name.split("/").pop();
      expect(ergaenzend, name).toMatch(new RegExp(`### ${kurz!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(in [^)]+\\) - ${version.replace(/\./g, "\\.")} \\(`));
    }
  });
});

describe("Lizenzen: Build und CI", () => {
  it("der Build schreibt die Lizenzdatei der gebündelten Pakete (dist/lizenzen.md)", () => {
    expect(lies("vite.config.ts")).toMatch(/license:\s*\{\s*fileName:\s*"lizenzen\.md"\s*\}/);
  });

  it("die CI erzeugt eine SBOM im Format CycloneDX ohne Entwicklungsabhängigkeiten und hängt sie an Releases", () => {
    const sbom = /npm sbom --omit dev --sbom-format cyclonedx --sbom-type application --package-lock-only/;
    expect(lies(".github", "workflows", "pages.yml")).toMatch(sbom);
    const release = lies(".github", "workflows", "release.yml");
    expect(release).toMatch(sbom);
    expect(release).toContain("gh release upload");
  });
});
