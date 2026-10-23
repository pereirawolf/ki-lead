// @vitest-environment jsdom
// Farbschemata: Katalog, Kontraste, Auflösung, Prüfung von Profilfarben, Anwenden und Profilimport.
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { FARBSCHEMAS } from "../../src/darstellung/katalog";
import {
  ALLE_VARIABLEN,
  AUTOMATISCH,
  BAND_GLEICHE_FARBE,
  PROFIL,
  SEMANTIK,
  anwenden,
  aufloesen,
  farbAbstand,
  kontrast,
  kontrastFehler,
  profilFarbschemaFehler,
  semantikVon,
} from "../../src/darstellung/thema";
import { UI_TOKENS } from "../../src/darstellung/typen";
import { gueltigeAuswahl, startLesen, startSchreiben } from "../../src/darstellung/speicher";
import { ladeProfil } from "../../src/profil/laden";
import { leseOrdner } from "../support/dateien";

import { repoPfad } from "../support/dateien";
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
  it("22 eindeutige Schemata: 2 neutral, 2 Kontrast, Bund, Bevölkerungsschutz, alle 16 Länder", () => {
    const ids = FARBSCHEMAS.map((s) => s.id);
    expect(new Set(ids).size).toBe(22);
    expect(ids).toEqual(
      expect.arrayContaining(["neutral-hell", "neutral-dunkel", "kontrast-hell", "kontrast-dunkel", "bund", "bevoelkerungsschutz", ...LAENDER]),
    );
    expect(FARBSCHEMAS.filter((s) => s.gruppe === "Kontrast").map((s) => [s.id, s.modus])).toEqual([
      ["kontrast-hell", "hell"],
      ["kontrast-dunkel", "dunkel"],
    ]);
    expect(
      FARBSCHEMAS.filter((s) => s.gruppe === "Bundesländer")
        .map((s) => s.id)
        .sort(),
    ).toEqual([...LAENDER].sort());
    expect(FARBSCHEMAS.find((s) => s.id === "neutral-dunkel")!.modus).toBe("dunkel");
  });

  it.each(FARBSCHEMAS.map((s) => [s.id, s] as const))("%s: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten", (_, s) => {
    for (const t of UI_TOKENS) expect(s.tokens[t], t).toMatch(/^#[0-9A-Fa-f]{6}$/);
    if (s.gruppe === "Kontrast") expect(s.band).toEqual([]);
    else expect(s.band.length).toBeGreaterThan(0);
    expect(kontrastFehler({ ...s.tokens, ...semantikVon(s) }, s.kontrastziel)).toEqual([]);
  });

  it("Kontrastschemata: Text und Signalfarben mindestens 7:1, eigene Signalpalette, kein dekoratives Band", () => {
    for (const id of ["kontrast-hell", "kontrast-dunkel"]) {
      const s = FARBSCHEMAS.find((e) => e.id === id)!;
      expect(s.kontrastziel).toBe(7);
      const t: Record<string, string> = { ...s.tokens, ...semantikVon(s) };
      for (const [v, h] of [
        ["tinte", "flaeche"],
        ["tinte-leise", "flaeche"],
        ["link", "flaeche"],
        ["auf-amt", "amt"],
        ["kritisch", "flaeche"],
        ["erheblich", "flaeche"],
        ["gering", "flaeche"],
        ["ok", "flaeche"],
        ["lese-farbe", "lese-flaeche"],
      ])
        expect(kontrast(t[v], t[h]), `${id}: ${v}/${h}`).toBeGreaterThanOrEqual(7);
      expect(kontrast(t.fokus, t.flaeche)).toBeGreaterThanOrEqual(3);
      expect(semantikVon(s)).toBe(SEMANTIK[id as "kontrast-hell"]);
      expect(aufloesen(id)).toMatchObject({ kontrast: true, tokens: { band: "none" } });
    }
    // ein Neutral-Schema würde die 7:1-Schwelle nicht schaffen – die Prüfung ist also wirksam
    const n = FARBSCHEMAS.find((e) => e.id === "neutral-hell")!;
    expect(kontrastFehler({ ...n.tokens, ...semantikVon(n) }, 7).length).toBeGreaterThan(0);
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
    expect(aufloesen(AUTOMATISCH)).toMatchObject({ basis: "neutral-hell", quelle: "automatisch", auswahl: AUTOMATISCH });
    expect(aufloesen("gibt-es-nicht").quelle).toBe("automatisch");
  });

  it("„Automatisch“ folgt der Systemeinstellung „mehr Kontrast“, ein festes Schema bleibt", () => {
    // ohne „mehr Kontrast“: genau die neutralen Schemata, keine eigenen Farben
    const nh = aufloesen(AUTOMATISCH, undefined, undefined, { dunkel: false, kontrast: false });
    expect(nh).toMatchObject({ auswahl: AUTOMATISCH, basis: "neutral-hell", modus: "hell", quelle: "automatisch" });
    expect(nh.tokens).toEqual(aufloesen("neutral-hell").tokens);
    expect(nh.name).toBe("Automatisch: Neutral · Hell (Systemeinstellung hell)");
    const nd = aufloesen(AUTOMATISCH, undefined, undefined, { dunkel: true, kontrast: false });
    expect(nd).toMatchObject({ basis: "neutral-dunkel", modus: "dunkel" });
    expect(nd.tokens).toEqual(aufloesen("neutral-dunkel").tokens);
    expect(nd.name).toBe("Automatisch: Neutral · Night Mode (Systemeinstellung dunkel)");
    const hell = aufloesen(AUTOMATISCH, undefined, undefined, { dunkel: false, kontrast: true });
    expect(hell).toMatchObject({ auswahl: AUTOMATISCH, basis: "kontrast-hell", quelle: "automatisch", kontrast: true });
    expect(hell.name).toContain("mehr Kontrast");
    expect(aufloesen(AUTOMATISCH, undefined, undefined, { dunkel: true, kontrast: true }).basis).toBe("kontrast-dunkel");
    expect(aufloesen("de-th", undefined, undefined, { dunkel: true, kontrast: true }).basis).toBe("de-th");
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
    ["Kontrastbasis verlangt 7:1", { basis: "kontrast-hell", farben: { link: "#0F62FE" } }, /„link“ auf „flaeche“.*7/],
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
    expect(w.dataset.kontrast).toBeUndefined();
    anwenden(aufloesen("kontrast-dunkel"));
    expect(w.dataset.kontrast).toBe("erhoeht");
    expect(w.style.getPropertyValue("--kritisch")).toBe("#FF9999");
    anwenden(aufloesen(AUTOMATISCH, undefined, undefined, { dunkel: false, kontrast: false }));
    expect(w.dataset.farbschema).toBe("neutral-hell");
    expect(w.dataset.kontrast).toBeUndefined();
    expect(w.style.getPropertyValue("--kritisch")).toBe(aufloesen("neutral-hell").tokens.kritisch);
    // ohne Schema (Standarddarstellung beim Start) bleiben keine Werte des vorherigen Schemas stehen
    anwenden({ auswahl: AUTOMATISCH, basis: null, name: "", modus: null, quelle: "automatisch", tokens: {}, band: [], hinweise: [] });
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
  const basis = () => leseOrdner(repoPfad("profile/lead-beispiel"));
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

describe("Akzentband: Abhebung vom Hintergrund (0.5.1)", () => {
  // Diese Schemata führen Weiß im Band; Kopf (Weiß) und Seitengrund (#F5F6F7) würden es verschlucken
  const MIT_WEISS = ["de-by", "de-be", "de-bb", "de-hb", "de-hh", "de-he", "de-nw", "de-sn", "de-sh", "de-th"];

  it("färbt Kopf und Seitengrund genau dort leicht ein, wo eine Bandfarbe sonst darin aufginge", () => {
    for (const s of FARBSCHEMAS) {
      const t = aufloesen(s.id).tokens;
      const getoent = t["header-hintergrund"] !== s.tokens["header-hintergrund"];
      expect(getoent, s.id).toBe(MIT_WEISS.includes(s.id));
      if (!getoent) {
        expect(t.papier, s.id).toBe(s.tokens.papier);
        continue;
      }
      // Weiß im Band hebt sich jetzt vom Kopf und vom Seitengrund ab …
      expect(kontrast("#FFFFFF", t["header-hintergrund"]), `${s.id} Kopf`).toBeGreaterThanOrEqual(1.1);
      expect(kontrast("#FFFFFF", t.papier), `${s.id} Seitengrund`).toBeGreaterThan(kontrast("#FFFFFF", s.tokens.papier));
      // … bleibt aber eine ganz leichte, helle Einfärbung
      expect(kontrast("#FFFFFF", t["header-hintergrund"]), `${s.id} Kopf hell`).toBeLessThan(1.25);
      expect(kontrast("#FFFFFF", t.papier), `${s.id} Seitengrund hell`).toBeLessThan(1.3);
    }
  });

  it("hält alle Kontrastregeln auch mit der Einfärbung ein", () => {
    for (const s of FARBSCHEMAS) expect(kontrastFehler(aufloesen(s.id).tokens, s.kontrastziel ?? 4.5), s.id).toEqual([]);
  });

  it("lässt die Neutral- und Kontrastschemata und Bänder ohne Hintergrundfarbe unverändert (etwa Gelb auf Weiß)", () => {
    for (const id of ["neutral-hell", "neutral-dunkel", "kontrast-hell", "kontrast-dunkel", "de-bw", "bund", "de-ni"]) {
      const s = FARBSCHEMAS.find((x) => x.id === id)!;
      const t = aufloesen(id).tokens;
      expect(t["header-hintergrund"], id).toBe(s.tokens["header-hintergrund"]);
      expect(t.papier, id).toBe(s.tokens.papier);
    }
    expect(farbAbstand("#FFFFFF", "#F5F6F7")).toBeLessThanOrEqual(BAND_GLEICHE_FARBE);
    expect(farbAbstand("#FFFC00", "#FFFFFF")).toBeGreaterThan(BAND_GLEICHE_FARBE);
  });

  it("gilt auch für Profilfarben mit weißer Akzentfarbe", () => {
    const t = aufloesen(PROFIL, { basis: "neutral-hell", farben: { "marke-akzent-1": "#FFFFFF", "marke-akzent-2": "#123456" } }).tokens;
    expect(t["header-hintergrund"]).not.toBe("#FFFFFF");
    expect(kontrast("#FFFFFF", t["header-hintergrund"])).toBeGreaterThanOrEqual(1.05);
  });

  it("ist doppelt so dick wie bisher (8 px)", () => {
    const css = readFileSync(repoPfad("src", "styles.css"), "utf-8");
    const baender = [...css.matchAll(/border-bottom: (\d+)px solid var\(--amt\);\s*border-image: var\(--band\) 1;/g)].map((m) => m[1]);
    expect(baender).toEqual(["8", "8"]);
  });
});
