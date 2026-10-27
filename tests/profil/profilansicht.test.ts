// Profilansicht: Anzeigetitel und Versions-Tags, Steckbrief, Lesedokumente, Linkauflösung, Katalogsuche, Markdown
// und Einbettung. Reine Funktionen; die Oberfläche selbst wird per Sichtprüfung kontrolliert.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { fachSops, istInhaltsgeruest, VERDICHTUNG_S2 } from "../../src/pipeline/kontext";
import { STANDARD_ANWEISUNG } from "../../src/pipeline/kurzfassung";
import { sopKennung } from "../../src/profil/sop";
import {
  arbeitsgrundlagen,
  dokumentFassung,
  gruppenHinweis,
  inhaltsverzeichnis,
  lesedokumente,
  linkZiel,
  pfadAufloesen,
  sopAnzahl,
  sopAnzeige,
  sopLesetext,
  sopSteckbrief,
  sopSuche,
} from "../../src/profil/lesen";
import { INHALT_AB, lesetextHtml } from "../../src/ui/Lesetext";
import { eingebauteProfile } from "../../src/profil/eingebaut";
import { sopGruppen } from "../../src/pipeline/kontext";

import { repoPfad } from "../support/dateien";
describe("Anzeigetitel und Versions-Tags", () => {
  it("alle 34 Fachzeilen: Kennung und Name ohne Version, Version genau einmal im Tag", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const fach = fachSops(p!);
    expect(fach).toHaveLength(34);
    for (const s of fach) {
      const a = sopAnzeige(s);
      expect(a.kennung).toMatch(/^[BC]\d{2}$/);
      expect(a.tag).toBe(`v${s.version}`);
      expect(`${a.kennung} ${a.name}`).not.toContain(s.version!);
      expect(a.name).not.toMatch(/SOP LEAD|Baustein LEAD/);
    }
    expect(sopAnzeige(fach.find((s) => s.nummer === "B08")!)).toEqual({ kennung: "B08", name: "Stromausfall / Blackout", tag: "v2.2.0" });
  });

  it("Teil A trägt „gilt immer“, fehlende Version „ohne Version“; der Nachweis bleibt unverändert", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const a = p!.sops.find((s) => s.gemeinsam)!;
    expect(sopAnzeige(a)).toEqual({ name: "Teil A – Gemeinsame Regeln", tag: "gilt immer" });
    const b08 = fachSops(p!).find((s) => s.nummer === "B08")!;
    expect(sopAnzeige({ ...b08, version: undefined }).tag).toBe("ohne Version");
    expect(sopKennung(b08)).toBe("SOP-LEAD B08 Stromausfall / Blackout v2.2.0");
  });

  it("Anzahl und Gruppenhinweis nennen die Inhaltsgerüste", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(sopAnzahl(p!)).toBe("17 Dach-SOPs · 17 ergänzende Bausteine, davon 15 Inhaltsgerüste");
    const gruppen = sopGruppen(p!);
    expect(gruppenHinweis(gruppen[0].sops)).toBeUndefined();
    // Leseblöcke mit einem ausgearbeiteten Baustein (Beispielfassung, z. B. C01, C12) tragen keinen Inhaltsgerüst-Hinweis
    for (const g of gruppen.slice(1))
      if (g.sops.some((s) => !istInhaltsgeruest(s))) expect(gruppenHinweis(g.sops), g.titel).toBeUndefined();
      else expect(gruppenHinweis(g.sops), g.titel).toMatch(/^Inhaltsgerüste/);
    // Vorlage (seit Profil 0.5.0, KP-2026-W43-60): eine Dach-SOP als Inhaltsgerüst; ein Paket ohne SOP zeigt „keine“
    const { profil: m } = await profil("muster");
    expect(sopAnzahl(m!)).toBe("1 SOP, davon 1 Inhaltsgerüst");
    expect(sopAnzahl({ ...m!, sops: [] })).toBe("keine");
  });
});

describe("Steckbrief und Lesetext", () => {
  it("Steckbrief aus dem Kopf, Lesetext ohne Überschrift und YAML", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const c11 = fachSops(p!).find((s) => s.nummer === "C11")!;
    const sb = Object.fromEntries(sopSteckbrief(c11).map((a) => [a.label, a.wert]));
    expect(sb.Version).toBe("1.2.2");
    expect(sb.Bearbeitungsstand).toMatch(/^Inhaltsgerüst/);
    expect(sb.Ereignisart).toBe("KRITIS-Ausfall, Cyberangriff / IT-Sicherheitsvorfall");
    expect(sb["Frühere Kennung"]).toBe("N02");
    const t = sopLesetext(c11);
    expect(t.startsWith("### 1. Anwendungsbereich")).toBe(true);
    expect(t).not.toContain("```yaml");
    const a = p!.sops.find((s) => s.gemeinsam)!;
    expect(sopSteckbrief(a)).toEqual([]);
    expect(sopLesetext(a).startsWith("**Gültigkeitsstand.**")).toBe(true);
  });
});

describe("Lesedokumente", () => {
  it("Beispielprofil: SOP-Übersicht und -Verlauf, Profilverlauf; SOP-Übersicht mit Fassung der Sammelmappe", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const doks = lesedokumente(p!);
    expect(doks.map((d) => `${d.gruppe}: ${d.titel}`)).toEqual(["SOP-Sammlung: Übersicht", "SOP-Sammlung: Änderungsverlauf", "Profil: Änderungsverlauf"]);
    expect(doks[0].version).toMatch(/^\d+\.\d+/);
    expect(doks[2].version).toBeUndefined();
  });

  it("Musterprofil: nur vorhandene Dateien; ein Paket ohne Zusatzdokumentation bleibt gültig", async () => {
    const { profil: m } = await profil("muster");
    // Vorlage (seit Profil 0.5.0, KP-2026-W43-60): Beschreibung und Änderungsverlauf, keine SOP-Übersicht
    expect(lesedokumente(m!).map((d) => d.pfad)).toEqual(["README.md", "CHANGELOG.md"]);
    const ohne = { ...m!, dateien: Object.fromEntries(Object.entries(m!.dateien).filter(([k]) => k !== "CHANGELOG.md" && k !== "README.md")) };
    expect(lesedokumente(ohne)).toEqual([]);
    const mitReadme = { ...ohne, dateien: { ...ohne.dateien, "README.md": "# Muster" } };
    expect(lesedokumente(mitReadme).map((d) => d.titel)).toContain("Beschreibung");
  });
});

describe("Arbeitsanweisungen und Kodierleitfaden", () => {
  it("Beispielprofil: vier Dokumente aus dem Paket, Reihenfolge, Zweck und eigene Fassung aus dem Kopf", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const doks = arbeitsgrundlagen(p!);
    expect(doks.map((d) => [d.rolle, d.pfad, d.quelle])).toEqual([
      ["erfassung", "anweisung-erfassung.md", "paket"],
      ["verdichtung", "anweisung-verdichtung.md", "paket"],
      ["kurzfassung", "anweisung-kurzfassung.md", "paket"],
      ["kodierleitfaden", "kodierleitfaden.md", "paket"],
    ]);
    for (const d of doks) {
      expect(d.zweck, d.pfad).toBeTruthy();
      expect(d.text).toBe(p!.dateien[d.pfad]);
      // Fassung = erstes „Fassung X vom …“ im Kopfabsatz, nicht eine dort zitierte Fassung anderer Dokumente
      const kopf = d.text.split("\n").find((z) => z.startsWith("Beispielfassung für KI-LEAD"))!;
      expect(kopf.match(/Fassung (\d+(?:\.\d+)*) vom (\d{2}\.\d{2}\.\d{4})/)!.slice(1)).toEqual([d.version, d.stand]);
    }
  });

  it("dokumentFassung liest nur den ersten Absatz nach der Überschrift", () => {
    expect(dokumentFassung("# Titel\n\nFassung 2.1 vom 01.02.2026 · abgestimmt auf Fassung 3.0\n")).toEqual({ version: "2.1", stand: "01.02.2026" });
    expect(dokumentFassung("# Titel\n\nOhne Angabe.\n\nFassung 9.9 vom 01.01.2026\n")).toEqual({});
    expect(dokumentFassung("Kein Titel, Fassung 1.0")).toEqual({});
  });

  it("Musterprofil: Erfassung und Kodierleitfaden mit Fassung (KP-2026-W43-51), Verdichtung und Kurzfassung als Standardfassung der App", async () => {
    const { profil: m } = await profil("muster");
    const doks = arbeitsgrundlagen(m!);
    expect(doks.map((d) => [d.rolle, d.quelle, d.version])).toEqual([
      ["erfassung", "paket", "0.5.1"],
      ["verdichtung", "app", undefined],
      ["kurzfassung", "app", undefined],
      ["kodierleitfaden", "paket", "0.5"],
    ]);
    expect(doks[1].text).toBe(VERDICHTUNG_S2);
    expect(doks[2].text).toBe(STANDARD_ANWEISUNG);
    // im Manifest genannt, Datei fehlt: ebenfalls Standardfassung
    const { profil: p } = await profil("lead-beispiel");
    const ohne = { ...p!, dateien: Object.fromEntries(Object.entries(p!.dateien).filter(([k]) => k !== "anweisung-kurzfassung.md")) };
    expect(arbeitsgrundlagen(ohne).find((d) => d.rolle === "kurzfassung")!.quelle).toBe("app");
  });

  it("Inhaltsverzeichnis: Überschriften der Ebenen 2 und 3, ohne Codeblöcke; Kodierleitfaden mit D1–D8", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const kl = inhaltsverzeichnis(p!.dateien["kodierleitfaden.md"]);
    expect(kl.length).toBeGreaterThanOrEqual(INHALT_AB);
    for (const d of ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"])
      expect(
        kl.some((e) => e.ebene === 3 && e.titel.startsWith(d + " ")),
        d,
      ).toBe(true);
    expect(inhaltsverzeichnis("## A\n```\n## kein Titel\n```\n### B").map((e) => [e.ebene, e.titel, e.index])).toEqual([
      [2, "A", 0],
      [3, "B", 1],
    ]);
    // Teil A und jede SOP erhalten ein Inhaltsverzeichnis
    expect(inhaltsverzeichnis(sopLesetext(p!.sops.find((s) => s.gemeinsam)!)).length).toBeGreaterThanOrEqual(INHALT_AB);
  });

  it("Inhaltsverzeichnis entspricht der Reihenfolge der Überschriften im gerenderten Text", async () => {
    const { profil: p } = await profil("lead-beispiel");
    for (const d of arbeitsgrundlagen(p!)) {
      const html = await lesetextHtml(d.text, d.pfad, p!);
      const gerendert = [...html.matchAll(/<h([23])>(.*?)<\/h\1>/g)].map((m) => m[2].replace(/<[^>]+>/g, ""));
      expect(gerendert.length, d.pfad).toBe(inhaltsverzeichnis(d.text).length);
    }
  });

  it("Platzhalter mit Bereich und Punkt werden hervorgehoben, aber nicht ersetzt", async () => {
    const { profil: p } = await profil("lead-beispiel");
    // Seit 0.6.4 (TP-2026-W44-31) nutzt das Beispielprofil {{auftrag.*}} und {{jetzt}} nicht mehr; fremde Profile dürfen es
    const text = `${p!.dateien["anweisung-erfassung.md"]}\n\nSachverhalt: {{auftrag.sachverhalt}}, Zeitpunkt: {{jetzt}}`;
    const html = await lesetextHtml(text, "anweisung-erfassung.md", p!);
    for (const x of ["{{profil.referenzraum}}", "{{auftrag.sachverhalt}}", "{{jetzt}}"]) expect(html).toContain(`<span class="platzhalter">${x}</span>`);
    expect(html).not.toMatch(/\{\{[^}]+\}\}(?!<\/span>)/);
  });
});

describe("Links", () => {
  it("Pfade werden relativ aufgelöst und dürfen das Paket nicht verlassen", () => {
    expect(pfadAufloesen("sop/README.md", "teil-b/B08_x.md")).toBe("sop/teil-b/B08_x.md");
    expect(pfadAufloesen("sop/CHANGELOG.md", "../CHANGELOG.md")).toBe("CHANGELOG.md");
    expect(pfadAufloesen("sop/CHANGELOG.md", "../../../CHANGELOG.md")).toBeUndefined();
  });

  it("Ziele: SOP, Lesedokument, nicht im Paket, extern, ungültig", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const b08 = fachSops(p!).find((s) => s.nummer === "B08")!;
    expect(linkZiel(b08.datei.replace("sop/", ""), "sop/README.md", p!)).toEqual({ art: "sop", id: "b08" });
    expect(linkZiel("A_Gemeinsame-Regeln.md", "sop/README.md", p!)).toEqual({ art: "sop", id: "teil-a" });
    expect(linkZiel("CHANGELOG.md", "sop/README.md", p!)).toEqual({ art: "dokument", pfad: "sop/CHANGELOG.md" });
    expect(linkZiel("sop/CHANGELOG.md", "CHANGELOG.md", p!)).toEqual({ art: "dokument", pfad: "sop/CHANGELOG.md" });
    expect(linkZiel("SOP-LEAD_Sammelmappe_Lesefassung.md", "sop/README.md", { ...p!, dateien: { ...p!.dateien } })).toMatchObject({ art: "fehlt" });
    expect(linkZiel("../../../CHANGELOG.md", "sop/CHANGELOG.md", p!)).toMatchObject({ art: "fehlt" });
    expect(linkZiel("https://www.smard.de/", "sop/teil-b/B08.md", p!)).toEqual({ art: "extern", url: "https://www.smard.de/" });
    expect(linkZiel("javascript:alert(1)", "sop/README.md", p!)).toEqual({ art: "ungueltig" });
    expect(linkZiel("#c11", "sop/README.md", p!)).toEqual({ art: "sop", id: "c11" });
  });
});

describe("Katalogsuche", () => {
  it("findet über Kennung, Name, frühere Kennung und frühere ID", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect([...sopSuche(p!, "C11")]).toEqual(["c11"]);
    expect([...sopSuche(p!, "telekommunikation")]).toContain("c11");
    expect([...sopSuche(p!, "N02")]).toEqual(["c11"]);
    expect([...sopSuche(p!, "sop-08")]).toEqual(["b08"]);
    expect(sopSuche(p!, "").size).toBe(35);
    expect(sopSuche(p!, "gibtesnicht").size).toBe(0);
    expect(sopSuche(p!, "Lastabschaltung").size).toBe(0);
    expect([...sopSuche(p!, "Lastabschaltung", true)]).toContain("b08");
  });
});

describe("Markdown-Darstellung", () => {
  it("Tabellen als Tabelle, kein rohes HTML, keine Bilder, Links nach Ziel", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const html = await lesetextHtml(
      [
        "| ID | Frage |",
        "|---|---|",
        "| R1 | Wer? |",
        "",
        '<script>alert(1)</script> <img src="x" onerror="y">',
        "",
        "![Bild](https://example.org/a.png)",
        "",
        "[B08](teil-b/B08_stromausfall-blackout.md) · [Verlauf](CHANGELOG.md) · [Lesefassung](SOP-LEAD_Sammelmappe_Lesefassung.md) · [SMARD](https://www.smard.de/) · [x](javascript:alert(1))",
        "",
        "Meldende Stelle: {{profil.meldende_stelle}}, Stand {{jetzt}}",
      ].join("\n"),
      "sop/README.md",
      p!,
    );
    expect(html).toContain('<div class="tabelle-rahmen"><table>');
    expect(html).toContain("<td>R1</td>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain('data-ziel="sop:b08"');
    expect(html).toContain('data-ziel="dokument:sop/CHANGELOG.md"');
    expect(html).toContain('<span class="link-fehlt">Lesefassung <span class="link-hinweis">(nicht im Paket)</span></span>');
    expect(html).toContain('href="https://www.smard.de/" target="_blank" rel="noopener noreferrer"');
    expect(html).not.toContain('href="javascript');
    expect(html).toContain('<span class="platzhalter">{{profil.meldende_stelle}}</span>');
    expect(html).toContain('<span class="platzhalter">{{jetzt}}</span>');
  });

  it("alle SOPs und Lesedokumente lassen sich aufbereiten, ohne Pipe-Tabellen zu hinterlassen", async () => {
    const { profil: p } = await profil("lead-beispiel");
    for (const s of p!.sops) {
      const html = await lesetextHtml(sopLesetext(s), s.datei, p!);
      expect(html, s.id).not.toMatch(/^<p>\|/m);
    }
    for (const d of [...lesedokumente(p!), ...arbeitsgrundlagen(p!)]) {
      const html = await lesetextHtml(p!.dateien[d.pfad], d.pfad, p!);
      expect(html.length, d.pfad).toBeGreaterThan(100);
    }
  });
});

describe("Einbettung", () => {
  it("SOP-README und Verläufe sind eingebettet, Lesefassung und Archiv nicht", () => {
    const beispiel = eingebauteProfile().find((e) => e.ordner === "lead-beispiel")!;
    const pfade = Object.keys(beispiel.dateien);
    expect(pfade).toContain("sop/README.md");
    expect(pfade).toContain("sop/CHANGELOG.md");
    expect(pfade).toContain("CHANGELOG.md");
    expect(pfade.some((x) => x.endsWith("_Lesefassung.md"))).toBe(false);
    expect(pfade.some((x) => x.startsWith("sop/archiv/"))).toBe(false);
  });
});

describe("Alle unter „Profile“ lesbaren Markdown-Texte", () => {
  it.each(["lead-beispiel", "muster"])("%s: SOPs, Arbeitsgrundlagen und Dokumentation erscheinen formatiert, ohne Markdown-Reste", async (name) => {
    const { profil: p } = await profil(name);
    const texte = [
      ...p!.sops.map((s) => ({ name: s.id, text: sopLesetext(s), von: s.datei })),
      ...arbeitsgrundlagen(p!).map((d) => ({ name: d.pfad, text: d.text, von: d.pfad })),
      ...lesedokumente(p!).map((d) => ({ name: d.pfad, text: d.text, von: d.pfad })),
    ];
    expect(texte.length).toBeGreaterThan(0);
    for (const t of texte) {
      const html = lesetextHtml(t.text, t.von, p!);
      expect(html, t.name).toMatch(/<(p|h[1-6]|ul|ol|table)>/);
      // keine unformatierten Überschriften, Tabellen, Listen oder Hervorhebungen als Fließtext
      expect(html, t.name).not.toMatch(/<p>(#{1,6} |\|.*\||[-*] |\d+\. )/);
      expect(html, t.name).not.toMatch(/\*\*[^*\n]+\*\*/);
      expect([...html.matchAll(/<h[23]>/g)].length, t.name).toBe(inhaltsverzeichnis(t.text).length);
    }
  });

  it("der Renderer ist fest eingebunden und wird nicht nachgeladen", () => {
    const quelle = readFileSync(repoPfad("src/ui/Lesetext.tsx"), "utf-8");
    expect(quelle).not.toMatch(/import\(\s*["']markdown-it["']\s*\)/);
    expect(quelle).toMatch(/^import MarkdownItKlasse/m);
  });
});
