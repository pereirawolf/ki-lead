// Native Apps (M5, Capacitor): App-Kennung und Versionen stimmen in allen Projektdateien überein, die
// Schlüsselbund-Anbindung ist eingebunden, keine Sicherung von App-Daten, Exportangabe für iOS gesetzt.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPfad } from "../support/dateien";

const lies = (...teile: string[]) => readFileSync(repoPfad(...teile), "utf-8");
const KENNUNG = "de.pereirawolf.kilead";
const version = JSON.parse(lies("package.json")).version as string;
/** Versionsnummer für die Stores: 0.5.1 → 501 (Hauptversion × 10 000 + Nebenversion × 100 + Korrektur) */
const buildNummer = (() => {
  const [a, b, c] = version.split(".").map(Number);
  return a * 10000 + b * 100 + c;
})();

describe("Native Apps: Projektdateien", () => {
  it("verwenden überall dieselbe App-Kennung", () => {
    const cap = JSON.parse(lies("capacitor.config.json"));
    expect(cap).toMatchObject({ appId: KENNUNG, appName: "KI-LEAD", webDir: "dist" });
    expect(lies("android", "app", "build.gradle")).toContain(`applicationId "${KENNUNG}"`);
    const pbx = lies("ios", "App", "App.xcodeproj", "project.pbxproj");
    expect(pbx.match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)?.every((z) => z.includes(KENNUNG))).toBe(true);
  });

  it("tragen die Version der App (package.json) und eine daraus abgeleitete Buildnummer", () => {
    const gradle = lies("android", "app", "build.gradle");
    expect(gradle).toContain(`versionName "${version}"`);
    expect(gradle).toContain(`versionCode ${buildNummer}`);
    const pbx = lies("ios", "App", "App.xcodeproj", "project.pbxproj");
    for (const z of pbx.match(/MARKETING_VERSION = [^;]+;/g) ?? ["fehlt"]) expect(z).toBe(`MARKETING_VERSION = ${version};`);
    for (const z of pbx.match(/CURRENT_PROJECT_VERSION = [^;]+;/g) ?? ["fehlt"]) expect(z).toBe(`CURRENT_PROJECT_VERSION = ${buildNummer};`);
  });

  it("binden die Schlüsselbund-Anbindung auf beiden Plattformen ein", () => {
    expect(lies("android", "capacitor.settings.gradle")).toContain("aparajita-capacitor-secure-storage");
    expect(lies("ios", "App", "CapApp-SPM", "Package.swift")).toContain("AparajitaCapacitorSecureStorage");
  });

  it("schließen App-Daten von der Android-Sicherung aus und erklären die Verschlüsselung für iOS", () => {
    expect(lies("android", "app", "src", "main", "AndroidManifest.xml")).toContain('android:allowBackup="false"');
    expect(lies("ios", "App", "App", "Info.plist")).toMatch(/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  });

  it("enthalten die festgeschriebenen App-Symbole und Startbildschirme (docs/app-symbol.md)", () => {
    const res = ["android", "app", "src", "main", "res"];
    const dateien = [
      ["public", "icons", "icon.svg"],
      ["public", "icons", "icon-192.png"],
      ["public", "icons", "icon-512.png"],
      ["public", "icons", "icon-maskable-512.png"],
      ["public", "icons", "apple-touch-icon.png"],
      ["public", "icons", "favicon-48.png"],
      ["ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png"],
      ...["", "-1", "-2"].map((n) => ["ios", "App", "App", "Assets.xcassets", "Splash.imageset", `splash-2732x2732${n}.png`]),
      ...["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"].flatMap((d) =>
        ["ic_launcher", "ic_launcher_round", "ic_launcher_foreground"].map((n) => [...res, `mipmap-${d}`, `${n}.png`]),
      ),
      [...res, "drawable", "splash.png"],
    ];
    expect(dateien.filter((d) => !existsSync(repoPfad(...d))).map((d) => d.join("/"))).toEqual([]);
    expect(lies(...res, "values", "ic_launcher_background.xml")).toContain("#E75B12");
  });
});
