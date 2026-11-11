// Grunddesign der App-Familie (design/README.md, Fassung 1.7 vom 11.11.2026): erzeugte Dateien aktuell, Format der
// Design Tokens (DTCG), rahmen.json gegen sein Schema, Regeln eindeutig und mit vorhandenen Fundstellen, Namen von
// Navigation, Leisten und Reitern wie in der Referenzumsetzung, Komponenten und Wireframes vorhanden. Das Soll für die
// Namen steht unabhängig im Quelltext der Oberfläche; der Test liest es dort, nicht aus rahmen.json.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { beschreibung, designTokens, farbschemaTokens, hexFarbe, ROLLEN, SIGNALE } from "../../scripts/lead-design.mjs";
import { FARBSCHEMAS } from "../../src/darstellung/katalog";
import { SEMANTIK } from "../../src/darstellung/thema";
import { UI_TOKENS } from "../../src/darstellung/typen";
import { BEREICHE } from "../../src/ui/Einstellungen";
import { HINWEIS_KENNUNG, HINWEIS_TEXT, HINWEIS_TRENNER } from "../../src/ui/hinweisband";
import { ajvGueltig, referenzAjv } from "../support/ajv";
import { repoPfad } from "../support/dateien";

const text = (pfad: string) => readFileSync(repoPfad(pfad), "utf-8");
const json = (pfad: string) => JSON.parse(text(pfad));
const rahmen = json("design/rahmen.json");
const tokens = json("design/lead-design.tokens.json");

/** Alle Tokens (Blätter mit $value) mit ihrem Pfad */
function blaetter(o: Record<string, any>, pfad: string[] = []): [string, any][] {
  return Object.entries(o)
    .filter(([k]) => !k.startsWith("$"))
    .flatMap(([k, v]) => (v && typeof v === "object" && "$value" in v ? [[[...pfad, k].join("."), v] as [string, any]] : blaetter(v, [...pfad, k])));
}

describe("Grunddesign: erzeugte Dateien aktuell (sonst „npm run design:tokens“)", () => {
  it("lead-design.tokens.json entspricht dem Code", () => {
    expect(tokens).toEqual(designTokens());
  });

  it("lead-farbschemata.tokens.json entspricht dem Katalog", () => {
    expect(json("design/lead-farbschemata.tokens.json")).toEqual(farbschemaTokens());
  });

  it("die Regeltabellen in design/README.md entsprechen rahmen.json", () => {
    const ist = text("design/README.md");
    expect(ist).toBe(beschreibung(ist));
  });
});

describe("Grunddesign: Design Tokens im Format der DTCG", () => {
  const TYPEN = new Set(["color", "dimension", "fontFamily", "fontWeight", "number"]);

  it("jedes Token hat einen zulässigen $type und einen passenden $value", () => {
    const alle = [...blaetter(tokens), ...blaetter(json("design/lead-farbschemata.tokens.json"))];
    expect(alle.length).toBeGreaterThan(500);
    for (const [pfad, t] of alle) {
      expect(TYPEN.has(t.$type), pfad).toBe(true);
      if (t.$type === "color") expect(t.$value, pfad).toMatch(/^#[0-9A-F]{6}([0-9A-F]{2})?$/);
      if (t.$type === "dimension") expect(["px", "rem"], pfad).toContain(t.$value.unit);
      if (t.$type === "number" || t.$type === "fontWeight") expect(typeof t.$value, pfad).toBe("number");
    }
  });

  it("jede Farbrolle und jede Signalfarbe ist beschrieben; Rollen kommen aus dem Profil, Signalfarben nie", () => {
    expect(Object.keys(ROLLEN)).toEqual([...UI_TOKENS]);
    expect(Object.keys(SIGNALE).sort()).toEqual(Object.keys(SEMANTIK.hell).sort());
    for (const r of UI_TOKENS) expect(tokens.farbrolle[r].$extensions["de.pereirawolf.lead-design"].profil, r).toBe(true);
    for (const s of Object.keys(SEMANTIK.hell)) expect(tokens.signal[s].$extensions["de.pereirawolf.lead-design"].profil, s).toBe(false);
  });

  it("Füllfarben für Diagramme wie in Thessa übernommen, nie aus einem Profil (LD-F04, seit Grunddesign 1.5)", () => {
    // Soll unabhängig vom Code: Werte aus Thessa (werkzeuge/lib/farben.mjs, FUELL, Stand 05.11.2026); Kontrast wie hell bzw. dunkel
    const hell = { "fuell-ok": "#1F8A4C", "fuell-gering": "#D99A00", "fuell-einsatz": "#7048C0", "fuell-kritisch": "#CF3A32" };
    const dunkel = { "fuell-ok": "#23936A", "fuell-gering": "#C27C00", "fuell-einsatz": "#8763DC", "fuell-kritisch": "#DB4F46" };
    const fuell = tokens.fuell;
    expect(
      Object.keys(fuell)
        .filter((k) => !k.startsWith("$"))
        .sort(),
    ).toEqual(Object.keys(hell).sort());
    for (const [name, wert] of Object.entries(hell)) {
      const t = fuell[name];
      const erw = t.$extensions["de.pereirawolf.lead-design"];
      expect(t.$value).toBe(wert);
      expect(erw.modi).toEqual({ dunkel: dunkel[name as keyof typeof dunkel], "kontrast-hell": wert, "kontrast-dunkel": dunkel[name as keyof typeof dunkel] });
      expect(erw.css).toBe(`--${name}`);
      expect(erw.profil).toBe(false);
      expect(t.$description).toBeTruthy();
    }
    expect(rahmen.regeln.find((r: any) => r.id === "LD-F04").text).toContain("fuell-ok, fuell-gering, fuell-einsatz und fuell-kritisch");
  });

  it("Farbschemata mit denselben Kennungen wie der Katalog (LD-F02)", () => {
    const schemata = json("design/lead-farbschemata.tokens.json");
    expect(Object.keys(schemata).filter((k) => !k.startsWith("$"))).toEqual(FARBSCHEMAS.map((e) => e.id));
  });

  it("Umrechnung der Farbwerte", () => {
    expect(hexFarbe("#abcdef")).toBe("#ABCDEF");
    expect(hexFarbe("rgba(31, 79, 130, 0.2)")).toBe("#1F4F8233");
    expect(hexFarbe("transparent")).toBe("#00000000");
    expect(() => hexFarbe("blau")).toThrow();
  });

  it("Maße und Umbrüche wie in den Stylesheets (unabhängig gelesen)", () => {
    const css = text("src/styles.css");
    expect(css).toMatch(/860px: schmale Bildschirme/);
    expect(css).toMatch(/640px: Smartphones quer/);
    expect(css).toMatch(/480px: Smartphones hochkant/);
    expect(tokens.umbruch.breit.$value).toEqual({ value: 860, unit: "px" });
    expect(tokens.umbruch.mittel.$value).toEqual({ value: 640, unit: "px" });
    expect(tokens.umbruch.schmal.$value).toEqual({ value: 480, unit: "px" });
    expect(tokens.mass.zielgroesse.$value).toEqual({ value: 44, unit: "px" });
    expect(tokens.mass.band.$value).toEqual({ value: 8, unit: "px" });
    expect(tokens.schrift.familie.$value[0]).toBe("Atkinson Hyperlegible");
  });
});

describe("Grunddesign: rahmen.json", () => {
  it("gültig nach rahmen.schema.json; das Schema lehnt ungültige Regeln ab", () => {
    const schema = json("design/rahmen.schema.json");
    const ajv = referenzAjv();
    expect(ajv.validate(schema, rahmen), JSON.stringify(ajv.errors)).toBe(true);
    const kaputt = structuredClone(rahmen);
    kaputt.regeln[0].stufe = "VIELLEICHT";
    expect(ajvGueltig(schema, kaputt)).toBe(false);
    const ohneId = structuredClone(rahmen);
    ohneId.regeln[0].id = "R01";
    expect(ajvGueltig(schema, ohneId)).toBe(false);
  });

  it("Regelkennungen eindeutig; jede Fundstelle existiert", () => {
    const ids = rahmen.regeln.map((r: any) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of rahmen.regeln) for (const f of r.referenz) expect(existsSync(repoPfad(f)), `${r.id}: ${f}`).toBe(true);
  });

  it("jede Regel, auf die rahmen.json oder README.md verweist, gibt es", () => {
    const ids = new Set(rahmen.regeln.map((r: any) => r.id));
    const verweise = [...JSON.stringify({ ...rahmen, regeln: [] }).matchAll(/LD-[A-Z]\d{2}/g), ...text("design/README.md").matchAll(/LD-[A-Z]\d{2}/g)].map(
      (m) => m[0],
    );
    for (const v of verweise) expect(ids.has(v), v).toBe(true);
    for (const r of rahmen.regeln) for (const v of r.text.match(/LD-[A-Z]\d{2}/g) ?? []) expect(ids.has(v), `${r.id} → ${v}`).toBe(true);
  });

  it("Token-Verweise ({gruppe.name}) zeigen auf vorhandene Tokens", () => {
    const vorhanden = new Set(blaetter(tokens).map(([p]) => p));
    const verweise = [...JSON.stringify(rahmen).matchAll(/\{([a-z]+\.[a-z0-9-]+)\}/g)].map((m) => m[1]);
    expect(verweise.length).toBeGreaterThan(5);
    for (const v of verweise) expect(vorhanden.has(v), v).toBe(true);
  });

  it("Hauptnavigation wie in src/App.tsx, mit „Profile“ und „Einstellungen“ am Ende (LD-N01)", () => {
    const app = text("src/App.tsx");
    const nav = app.slice(app.indexOf('<nav className="hauptnav"'), app.indexOf("</nav>", app.indexOf('<nav className="hauptnav"')));
    const namen = [...nav.matchAll(/>\s*\n\s*([^<>\n{}]+?)\s*\n\s*<\/button>/g)].map((m) => m[1]);
    expect(namen).toEqual(rahmen.hauptnavigation["ki-lead"]);
    expect(namen.slice(-2)).toEqual(["Profile", "Einstellungen"]);
    expect(nav).toContain(`aria-label="${rahmen.hauptnavigation.aria_label}"`);
  });

  it("Bereiche der Einstellungen wie in src/ui/Einstellungen.tsx (LD-N06)", () => {
    const leiste = rahmen.leisten.find((l: any) => l.id === "bereiche");
    expect(BEREICHE.map((b) => b.titel)).toEqual(leiste["ki-lead"]);
    expect(leiste["ki-lead"][0]).toBe("Übersicht");
    expect(leiste["ki-lead"].slice(-3)).toEqual(["Darstellung", "Daten", "Über KI-LEAD"]);
  });

  it("LD-T05: Bereiche der Einstellungen verbinden mit „und“, nicht mit „&“ (seit Grunddesign 1.4, KI-LEAD 0.7.14)", () => {
    // Soll unabhängig von rahmen.json: Entscheidung des Herausgebers vom 05.11.2026
    const titel = BEREICHE.map((b) => b.titel);
    expect(titel.filter((t) => t.includes("&"))).toEqual([]);
    expect(titel).toEqual(expect.arrayContaining(["KI-Anbieter und API", "Modelle und Aufwand", "Recherche und Grenzen"]));
    expect(rahmen.regeln.find((r: any) => r.id === "LD-T05")?.stufe).toBe("SOLL");
  });

  it("LD-T05: Schrittnamen der Profile verbinden mit „und“, nicht mit „&“ oder „/“ (seit Grunddesign 1.7, KI-LEAD 0.7.17)", () => {
    // Soll unabhängig von rahmen.json: Entscheidung des Herausgebers vom 11.11.2026 (Umbruch hinter „/“ in der Schrittleiste)
    const dateien = [
      "profile/lead-beispiel/meldung.ui.json",
      "profile/lead-thueringen/meldung.ui.json",
      "profile/lead-justiz/meldung.ui.json",
      "profile/muster/meldung.ui.json",
      "formate/lead-meldung-v2/beispiel/meldung.ui.json",
    ];
    const titel = dateien.flatMap((d) => (json(d).schritte as { titel: string }[]).map((s) => s.titel));
    expect(titel.filter((t) => /[&/]/.test(t))).toEqual([]);
    expect(titel).toEqual(expect.arrayContaining(["Ereignisse und Sachverhalte", "Quellen und Referenzen", "Prüfen und Exportieren"]));
    // Feldnamen der Meldevorlage bleiben unverändert
    expect(json("profile/lead-beispiel/meldung.ui.json").felder.quellen.label).toBe("Quellen & Referenzen");
    expect(json("profile/lead-beispiel/meldung.ui.json").felder.sachverhalte.label).toBe("Ereignisse/Sachverhalte");
  });

  it("LD-R04: einheitliches Hinweisband, MUSS, Wortlaut wie in der Oberfläche (seit Grunddesign 1.6, KI-LEAD 0.7.16)", () => {
    // Soll unabhängig von rahmen.json und Quelltext: Entscheidung des Herausgebers vom 10.11.2026
    const WORTLAUT = "Forschungsdemonstrator · Nur fiktive oder offen zugängliche Inhalte verwenden – keine personenbezogenen und keine eingestuften Daten.";
    expect(`${HINWEIS_KENNUNG}${HINWEIS_TRENNER}${HINWEIS_TEXT}`.replace(/\u00a0/g, " ")).toBe(WORTLAUT);
    // gleicher, geschützter Abstand vor und nach dem Mittelpunkt: kein Umbruch am Mittelpunkt
    expect(HINWEIS_TRENNER).toBe("\u00a0·\u00a0");
    const band = rahmen.rahmen.find((r: any) => r.id === "hinweisband");
    expect(band.wortlaut).toBe(WORTLAUT);
    expect(band.trenner).toBe(HINWEIS_TRENNER);
    expect(band.ausblendbar).toBe(false);
    const r04 = rahmen.regeln.find((r: any) => r.id === "LD-R04");
    expect(r04.stufe).toBe("MUSS");
    expect(r04.text).toContain(`„${WORTLAUT}“`);
    // Fläche in der tiefen Aktionsfarbe, keine Signalfarbe (LD-F04)
    const css = text("src/styles/basis.css");
    const regel = css.match(/\n\.kopfbereich > \.hinweisband \{([^}]*)\}/)?.[1] ?? "";
    expect(regel).toMatch(/background: var\(--amt-tief\);/);
    expect(regel).toMatch(/color: var\(--auf-amt-hover\);/);
    for (const s of Object.keys(SEMANTIK.hell)) expect(regel, s).not.toContain(`--${s})`);
    expect(css).toMatch(/\n\.kopfbereich \{\s*position: sticky;\s*top: 0;/);
    // kompakt nur schmaler, nie abgeschnitten: der ganze Wortlaut bleibt sichtbar (Klarstellung vom 10.11.2026)
    const kompakt = css.match(/\n\.kopfbereich\.kompakt > \.hinweisband \{([^}]*)\}/)?.[1] ?? "";
    expect(kompakt).toMatch(/padding-top: /);
    expect(kompakt).not.toMatch(/white-space|overflow|text-overflow|ellipsis|line-clamp|max-height/);
    expect(regel).not.toMatch(/white-space: nowrap|overflow: hidden|text-overflow/);
  });

  it("Reiter der Auswertung und Phasen der KI-Erfassung wie im Quelltext", () => {
    const lagebild = text("src/ui/Lagebild.tsx");
    const reiter = [
      ...lagebild.slice(lagebild.indexOf("const REITER"), lagebild.indexOf("];", lagebild.indexOf("const REITER"))).matchAll(/titel: "([^"]+)"/g),
    ].map((m) => m[1]);
    expect(reiter).toEqual(rahmen.leisten.find((l: any) => l.id === "reiter")["ki-lead"]);
    const zustand = text("src/ui/kiErfassung/zustand.ts");
    const phasen = [...zustand.matchAll(/\{ id: "(auftrag|bestaetigen|s2|ergebnis)", titel: "([^"]+)" \}/g)].map((m) => m[2]);
    expect(phasen).toEqual(rahmen.leisten.find((l: any) => l.id === "schritte")["ki-lead"]["KI-Erfassung"]);
  });

  it("Kennsätze der Bereiche wie in der Oberfläche (LD-A02)", () => {
    const quellen = ["src/ui/Meldung.tsx", "src/ui/KiErfassung.tsx", "src/ui/Lagebild.tsx"].map(text).join("\n");
    for (const satz of Object.values(rahmen.seitenkopf["ki-lead"]) as string[]) expect(quellen, satz).toContain(satz);
  });

  it("Komponenten haben ihre Varianten im Stylesheet (LD-B01, LD-M01)", () => {
    const css = ["src/styles/basis.css", "src/styles/formular.css"].map(text).join("\n");
    for (const v of ["primaer", "leise", "klein"]) expect(css).toContain(`.knopf.${v}`);
    for (const v of Object.keys(rahmen.komponenten.kasten.varianten)) expect(css).toContain(`.kasten-${v}`);
    expect(text("src/ui/KiSymbol.tsx")).toContain("KI ruht");
    expect(text("src/ui/KiSymbol.tsx")).toContain("KI aktiv");
  });

  it("Chips und Segmente: Fokus in „fokus“ mit zweitem Ring (LD-Z02), bei grober Zeigereingabe 44 px (LD-B01), seit 0.7.6", () => {
    const css = text("src/styles/formular.css");
    const regel = (sel: string) => css.match(new RegExp(`(^|\\n)${sel.replace(/[.()]/g, "\\$&")} \\{([^}]*)\\}`))?.[2] ?? "";
    for (const sel of [".chip:has(input:focus-visible)", ".segment:has(input:focus-visible)"]) {
      expect(regel(sel), sel).toMatch(/outline: 3px solid var\(--fokus\);/);
      expect(regel(sel), sel).toMatch(/box-shadow: (inset )?0 0 0 2px var\(--fokus-abstand\);/);
    }
    expect(css).toMatch(/@media \(pointer: coarse\) \{\s*\.chip \{\s*min-height: 44px;/);
  });

  it("Fassung in Beschreibung und rahmen.json gleich, mit Eintrag im Änderungsverlauf", () => {
    const readme = text("design/README.md");
    expect(readme).toContain(`Fassung ${rahmen.fassung} vom `);
    expect(readme).toMatch(new RegExp(`^\\| ${rahmen.fassung.replace(".", "\\.")} \\| `, "m"));
  });

  it("Wireframes vorhanden, mit Titel und Lizenzvermerk", () => {
    for (const w of rahmen.wireframes) {
      const svg = text(`design/${w.datei}`);
      expect(svg.startsWith("<svg "), w.datei).toBe(true);
      expect(svg).toMatch(/<title id="t">Wireframe: /);
      expect(svg).toContain("CC BY 4.0");
      expect(text("design/README.md")).toContain(w.datei);
      expect(text("design/README.md")).toMatch(new RegExp(`^#+ ${w.abschnitt}$`, "m"));
    }
  });
});
