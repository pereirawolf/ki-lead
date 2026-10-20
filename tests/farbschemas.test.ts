// @vitest-environment jsdom
// Farbschemata: Katalog, Kontraste, Auflösung, Prüfung von Profilfarben, Anwenden und Profilimport.
import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import { FARBSCHEMAS } from "../src/darstellung/katalog";
import { ALLE_VARIABLEN, AUTOMATISCH, PROFIL, SEMANTIK, anwenden, aufloesen, kontrast, kontrastFehler, profilFarbschemaFehler } from "../src/darstellung/thema";
import { UI_TOKENS } from "../src/darstellung/typen";
import { gueltigeAuswahl, startLesen, startSchreiben } from "../src/darstellung/speicher";
import { ladeProfil } from "../src/profil/laden";
import { leseOrdner } from "./hilfen";

const LAENDER = ["bw", "by", "be", "bb", "hb", "hh", "he", "mv", "ni", "nw", "rp", "sl", "sn", "st", "sh", "th"].map((k) => `de-${k}`);

afterEach(() => {
  anwenden(aufloesen(AUTOMATISCH));
  try {
    localStorage.clear();
  } catch {
    /* ohne Speicher */
  }
});

describe("Katalog", () => {
  it("20 eindeutige Schemata: 2 neutral, Bund, Bevölkerungsschutz, alle 16 Länder", () => {
    const ids = FARBSCHEMAS.map((s) => s.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids).toEqual(expect.arrayContaining(["neutral-hell", "neutral-dunkel", "bund", "bevoelkerungsschutz", ...LAENDER]));
    expect(
      FARBSCHEMAS.filter((s) => s.gruppe === "Bundesländer")
        .map((s) => s.id)
        .sort(),
    ).toEqual([...LAENDER].sort());
    expect(FARBSCHEMAS.find((s) => s.id === "neutral-dunkel")!.modus).toBe("dunkel");
  });

  it.each(FARBSCHEMAS.map((s) => [s.id, s] as const))("%s: alle Rollen als #RRGGBB, Band vorhanden, Kontraste eingehalten", (_, s) => {
    for (const t of UI_TOKENS) expect(s.tokens[t], t).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(s.band.length).toBeGreaterThan(0);
    expect(kontrastFehler({ ...s.tokens, ...SEMANTIK[s.modus] })).toEqual([]);
  });

  it("Signalfarben hängen nur vom Modus ab", () => {
    const berlin = aufloesen("de-be");
    const sachsen = aufloesen("de-sn");
    for (const k of ["kritisch", "ok", "erheblich", "gering", "radar-linie"]) expect(berlin.tokens[k]).toBe(sachsen.tokens[k]);
  });

  it("Kontrastberechnung nach WCAG", () => {
    expect(kontrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(kontrast("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });
});

describe("Auflösen", () => {
  const profilFarben = { basis: "de-bb", name: "Profil Brandenburg", farben: { "marke-akzent-1": "#C13B33" } };
  const lokal = { basis: "neutral-hell", farben: { amt: "#234D68", "amt-tief": "#17374D", link: "#17374D" } };

  it("festes Schema, automatisch und unbekannte Auswahl", () => {
    expect(aufloesen("de-th")).toMatchObject({ basis: "de-th", quelle: "katalog", modus: "hell" });
    expect(aufloesen(AUTOMATISCH)).toMatchObject({ basis: null, quelle: "automatisch", tokens: {} });
    expect(aufloesen("gibt-es-nicht").quelle).toBe("automatisch");
  });

  it("Vorrang bei „profil“: lokale Anpassung → Profil → Ersatz mit Hinweis", () => {
    expect(aufloesen(PROFIL, profilFarben, lokal)).toMatchObject({ quelle: "lokal", basis: "neutral-hell" });
    expect(aufloesen(PROFIL, profilFarben)).toMatchObject({ quelle: "profil", basis: "de-bb", name: "Profil Brandenburg" });
    const ersatz = aufloesen(PROFIL);
    expect(ersatz).toMatchObject({ quelle: "ersatz", basis: "neutral-hell" });
    expect(ersatz.hinweise[0]).toMatch(/kein Farbschema/);
  });

  it("ungültige lokale Farben fallen auf das Profil zurück, mit Hinweis", () => {
    const t = aufloesen(PROFIL, profilFarben, { basis: "neutral-hell", farben: { amt: "#FFFFFF" } });
    expect(t.quelle).toBe("profil");
    expect(t.hinweise[0]).toMatch(/Eigene Farben dieses Profils nicht verwendbar/);
  });

  it("ein festes Schema bleibt beim Profilwechsel erhalten", () => {
    expect(aufloesen("de-hh", profilFarben, lokal).basis).toBe("de-hh");
  });
});

describe("Prüfung von Profilfarben", () => {
  it.each<[string, unknown, RegExp]>([
    ["kein Objekt", "rot", /muss ein Objekt sein/],
    ["unbekannte Basis", { basis: "de-xx" }, /Kennung des Katalogs/],
    ["CSS-Text statt Farbe", { basis: "neutral-hell", farben: { amt: "red; background: url(x)" } }, /#RRGGBB/],
    ["Signalfarbe nicht änderbar", { basis: "neutral-hell", farben: { kritisch: "#00FF00" } }, /nicht änderbar/],
    ["unbekannte Angabe", { basis: "neutral-hell", schrift: "Comic Sans" }, /Unbekannte Angabe/],
    ["zu wenig Kontrast", { basis: "neutral-hell", farben: { amt: "#DDDDDD" } }, /„auf-amt“ auf „amt“/],
    ["Hintergrund schluckt Signalfarbe", { basis: "neutral-hell", farben: { flaeche: "#B3261E" } }, /„kritisch“ auf „flaeche“/],
    ["zu langer Name", { basis: "neutral-hell", name: "x".repeat(81) }, /1 bis 80 Zeichen/],
  ])("%s → abgewiesen", (_, f, meldung) => {
    expect(profilFarbschemaFehler(f).join(" ")).toMatch(meldung);
  });

  it("gültiges Schema mit eigenen Bandfarben", () => {
    const f = { basis: "neutral-hell", name: "Kreis X", farben: { "marke-akzent-1": "#AA0000", "marke-akzent-2": "#FFFFFF", "marke-akzent-3": "#00AA00" } };
    expect(profilFarbschemaFehler(f)).toEqual([]);
    expect(aufloesen(PROFIL, f).band).toEqual(["#AA0000", "#FFFFFF", "#00AA00"]);
  });
});

describe("Anwenden", () => {
  it("setzt Variablen, Attribute und Browserleiste; ein Wechsel hinterlässt keine Werte des vorherigen Schemas", () => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
    const w = document.documentElement;
    anwenden(aufloesen(PROFIL, { basis: "de-by", farben: { "marke-akzent-1": "#123456" } }));
    expect(w.dataset.farbschema).toBe("de-by");
    expect(w.style.getPropertyValue("--marke-akzent-1")).toBe("#123456");
    anwenden(aufloesen("neutral-dunkel"));
    expect(w.dataset.farbmodus).toBe("dunkel");
    expect(w.style.getPropertyValue("--marke-akzent-1")).toBe(aufloesen("neutral-dunkel").tokens["marke-akzent-1"]);
    expect(w.style.getPropertyValue("color-scheme")).toBe("dark");
    expect(meta.getAttribute("content")).toBe("#101419");
    anwenden(aufloesen(AUTOMATISCH));
    expect(w.dataset.farbschema).toBeUndefined();
    for (const v of ALLE_VARIABLEN) expect(w.style.getPropertyValue(`--${v}`), v).toBe("");
  });

  it("Startcache: nur gültige Auswahl und geprüfte Profildefinition", () => {
    startSchreiben("de-sn");
    expect(startLesen()).toEqual({ auswahl: "de-sn" });
    localStorage.setItem("ki-lead-darstellung", JSON.stringify({ auswahl: PROFIL, profil: { basis: "neutral-hell", farben: { amt: "url(x)" } } }));
    expect(startLesen()).toEqual({ auswahl: PROFIL });
    localStorage.setItem("ki-lead-darstellung", "kein json");
    expect(startLesen()).toEqual({ auswahl: AUTOMATISCH });
    expect(gueltigeAuswahl("de-zz")).toBe(AUTOMATISCH);
  });
});

describe("Profilimport", () => {
  const basis = () => leseOrdner(join(__dirname, "../profile/lead-beispiel"));
  const mitFarben = async (farbschema: unknown) => {
    const d = basis();
    const m = JSON.parse(d["profil.json"]);
    m.farbschema = farbschema;
    d["profil.json"] = JSON.stringify(m);
    return ladeProfil(d);
  };

  it("ein gültiges Farbschema wird übernommen", async () => {
    const e = await mitFarben({ basis: "bevoelkerungsschutz", name: "Stab" });
    expect(e.profil?.manifest.farbschema).toEqual({ basis: "bevoelkerungsschutz", name: "Stab" });
    expect(e.befunde.filter((b) => b.text.includes("Farbschema"))).toEqual([]);
  });

  it("ein fehlerhaftes Farbschema sperrt das fachliche Profil nicht, sondern ergibt eine Warnung", async () => {
    const e = await mitFarben({ basis: "neutral-hell", farben: { amt: "javascript:alert(1)" } });
    expect(e.profil).not.toBeNull();
    expect(e.befunde.find((b) => b.text.includes("Farbschema"))).toMatchObject({ stufe: "warnung" });
    // ungeprüfte Werte werden nicht weitergereicht
    expect(e.profil!.manifest.farbschema).toBeUndefined();
    expect(aufloesen(PROFIL, e.profil!.manifest.farbschema).quelle).toBe("ersatz");
  });

  it("Profile ohne Farbschema laden unverändert", async () => {
    const e = await ladeProfil(basis());
    expect(e.profil?.manifest.farbschema).toBeUndefined();
  });
});
