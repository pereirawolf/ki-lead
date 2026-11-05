// Schätzung von Dauer und Kosten je Stufe nach Modell und Aufwand.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AUFWAND_STUFEN, STANDARD, STANDARD_PROFILE } from "../../src/pipeline/einstellungen";
import { ausgabePreis } from "../../src/anbieter/preise";
import { dauerText, gueteText, kostenText, MESSWERTE, MS_DAUER, schaetzeKurzfassung, schaetzeStufe, stufenText, summe } from "../../src/pipeline/schaetzung";
import { LaufSchaetzung } from "../../src/ui/LaufSchaetzung";

describe("Schätzung von Dauer und Kosten", () => {
  it("nutzt Messwerte für gemessene Kombinationen", () => {
    // Obergrenze seit 0.7.9 nach dem Anbietervergleich vom 04.11.2026 (AV-2026-W45-01)
    const s = schaetzeStufe("erfassung", "claude-opus-5-5", "medium");
    expect(s).toEqual({ sekunden: [200, 810], usd: [1.4, 3.35], gemessen: true });
    expect(dauerText(s.sekunden)).toBe("3–14 Minuten");
    expect(kostenText(s.usd)).toBe("1,40–3,35 USD");
    // S1 Haiku high: Verdichtungen „Ilka“ 88–95 s und höchstens 0,020 USD (0.4.27)
    expect(schaetzeStufe("s1", "claude-haiku-5-5", "high")).toEqual({ sekunden: [15, 150], usd: [0, 0.03], gemessen: true });
    expect(dauerText(schaetzeStufe("s1", "claude-haiku-5-5", "high").sekunden)).toBe("bis 3 Minuten");
    expect(kostenText(schaetzeStufe("s1", "claude-haiku-5-5", "high").usd)).toBe("bis 0,03 USD");
    // Verdichtung mit Opus medium: bis 1,91 USD in der Abnahme M4 gemessen (0.4.31)
    expect(schaetzeStufe("verdichtung", "claude-opus-5-5", "medium")).toEqual({ sekunden: [300, 540], usd: [1.2, 2.2], gemessen: true });
    expect(kostenText(schaetzeStufe("verdichtung", "claude-opus-5-5", "medium").usd)).toBe("1,20–2,20 USD");
    // OpenAI aus der Abnahme M4 (0.4.31): Messwerte statt Hochrechnung
    expect(schaetzeStufe("s1", "gpt-6-luna", "high")).toEqual({ sekunden: [30, 120], usd: [0, 0.02], gemessen: true });
    expect(dauerText(schaetzeStufe("s1", "gpt-6-luna", "high").sekunden)).toBe("bis 2 Minuten");
    expect(kostenText(schaetzeStufe("s1", "gpt-6-luna", "high").usd)).toBe("bis 0,02 USD");
    // Untergrenze seit 0.5.10 60 s: Vergleichslauf Ilka bis 89,9 s (AV-2026-W43-15)
    expect(schaetzeStufe("verdichtung", "gpt-6-astra", "medium")).toEqual({ sekunden: [60, 240], usd: [1.0, 1.5], gemessen: true });
    expect(dauerText(schaetzeStufe("verdichtung", "gpt-6-astra", "medium").sekunden)).toBe("1–4 Minuten");
    expect(kostenText(schaetzeStufe("verdichtung", "gpt-6-astra", "medium").usd)).toBe("1,00–1,50 USD");
    expect(dauerText(schaetzeStufe("s1", "claude-haiku-5-5", "medium").sekunden)).toBe("unter 1 Minute");
    expect(dauerText(schaetzeStufe("erfassung", "claude-sonnet-5-5", "medium").sekunden)).toBe("bis 3 Minuten");
  });

  it("rechnet nicht gemessene Modelle über den Preis hoch, ohne Dauer", () => {
    const f = schaetzeStufe("erfassung", "claude-fable-5-1", "medium");
    expect(f.gemessen).toBe(false);
    expect(f.sekunden).toBeNull();
    // Fable kostet je Ausgabetoken das 2,5-Fache von Opus
    expect(f.usd![0]).toBeCloseTo(1.4 * 2.5);
    expect(f.usd![1]).toBeCloseTo(3.35 * 2.5);
    // nicht gemessener Aufwand: Basis „medium“, Obergrenze verdoppelt (seit 0.7.13 an Sonnet, weil Opus „high“ gemessen ist)
    const hoch = schaetzeStufe("erfassung", "claude-sonnet-5-5", "high");
    expect(hoch).toEqual({ sekunden: null, usd: [0.15, 1.2], gemessen: false });
    // AV-2026-W45-02: dasselbe Modell mit anderer Stufe vor fremden Modellen gleicher Stufe (sonst Opus „high“ aus Astra)
    expect(schaetzeStufe("erfassung", "gpt-6-astra", "medium")).toEqual({ sekunden: null, usd: [0.75, 2.8], gemessen: false });
    expect(schaetzeStufe("erfassung", "claude-opus-5-5", "xhigh").usd![0]).toBeGreaterThanOrEqual(MESSWERTE["erfassung|claude-opus-5-5|medium"].usd[0]);
    expect(schaetzeStufe("erfassung", "unbekannt-1", "medium")).toEqual({ sekunden: null, usd: null, gemessen: false });
    expect(dauerText(null)).toBe("Dauer ohne Messwert");
    // Gleitkommawerte am Cent werden nicht über die Grenze hinaus gerundet (0.4.31)
    expect(kostenText([1.2, 2.2])).toBe("1,20–2,20 USD");
    expect(kostenText([0.29, 0.57])).toBe("0,29–0,57 USD");
    expect(kostenText([1.4, 2.301])).toBe("1,40–2,31 USD");
    expect(
      summe([
        [0, 0.02],
        [1.4, 2.3],
      ]),
    ).toEqual([1.4, 2.32]);
    expect(summe([[0, 0.02], null])).toBeNull();
  });

  it("enthält nur Modelle mit Preisangabe und plausible Spannen", () => {
    const arten = ["s1", "erfassung", "verdichtung"];
    const aufwand = AUFWAND_STUFEN.map((a) => a.id as string);
    expect(Object.keys(MESSWERTE).length).toBeGreaterThan(0);
    for (const [k, m] of Object.entries(MESSWERTE)) {
      const teile = k.split("|");
      expect(teile, k).toHaveLength(3);
      const [art, modell, stufe] = teile;
      expect(arten, `${k}: Art`).toContain(art);
      expect(aufwand, `${k}: Aufwand`).toContain(stufe);
      // Preis vorhanden: Grundlage der Hochrechnung für nicht gemessene Modelle
      const preis = ausgabePreis(modell);
      expect(preis, `${k}: Ausgabepreis`).not.toBeNull();
      expect(Number.isFinite(preis) && preis! > 0, `${k}: Ausgabepreis ${preis}`).toBe(true);
      for (const [name, [von, bis]] of [
        ["sekunden", m.sekunden],
        ["usd", m.usd],
      ] as const) {
        expect(Number.isFinite(von) && Number.isFinite(bis), `${k}: ${name} endlich`).toBe(true);
        expect(von, `${k}: ${name} nicht negativ`).toBeGreaterThanOrEqual(0);
        expect(von, `${k}: ${name} geordnet`).toBeLessThan(bis);
      }
      expect(m.sekunden[0], `${k}: Dauer über 0`).toBeGreaterThan(0);
    }
  });

  it("zeigt die Schätzung je Stufe nach Modell und Aufwand an", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const html = renderToStaticMarkup(
      createElement(LaufSchaetzung, {
        stufen: [
          { kurz: "S1", rolle: "vorverarbeitung", art: "s1" },
          { kurz: "S2", rolle: "erfassung", art: "erfassung" },
        ],
        einstellungen: STANDARD,
        profil: p!,
      }),
    );
    // seit 0.7.13 S1 mit Sonnet „medium“ (Vorgabe von App und Beispielprofil)
    expect(html).toContain("S1 (claude-sonnet-5-5, medium): unter 1 Minute, 0,02–0,35 USD");
    expect(html).toContain("S2 (claude-opus-5-5, medium): 3–14 Minuten, 1,40–3,35 USD");
    expect(html).toContain("Zusammen etwa 1,42–3,70 USD");
    expect(html).toContain("viele Sachverhalte");
  });

  // Gemessene Spannen je Kombination aus dem Vergleichslauf Ilka vom 24./25.10.2026 (Ergebnisbericht
  // evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md, je mindestens drei Läufe). Mistral ohne EU-Aufschlag
  // (Protokollwert ÷ 1,1). Unabhängiges Soll: Werte aus den Laufprotokollen, nicht aus MESSWERTE.
  const GEMESSEN: [string, [number, number], [number, number]][] = [
    ["s1|claude-haiku-5-5|high", [18.6, 132.2], [0.0126, 0.0268]],
    ["verdichtung|claude-opus-5-5|medium", [404.6, 439.7], [1.7353, 1.8811]],
    ["verdichtung|claude-sonnet-5-5|medium", [287.4, 381.0], [0.8202, 0.9638]],
    ["s1|gpt-6-luna|high", [42.4, 68.8], [0.0046, 0.0084]],
    ["verdichtung|gpt-6-astra|medium", [89.9, 125.3], [1.2165, 1.2417]],
    ["verdichtung|gpt-6-astra|high", [266.7, 329.2], [1.5185, 1.6855]],
    // Folgereihe 25.10.2026 (AV-2026-W43-20)
    ["verdichtung|gpt-6-astra|xhigh", [332.6, 418.3], [0.9295, 1.8398]],
    ["s1|gpt-6-luna|high", [51.9, 57.8], [0.005, 0.0078]],
    // Plan anbietermix-ilka 25.10.2026, M1 und M2 (AV-2026-W43-29)
    ["s1|gpt-6-luna|high", [32.3, 64.8], [0.0038, 0.0054]],
    ["verdichtung|claude-opus-5-5|medium", [302.4, 315.8], [1.477, 1.5301]],
    ["verdichtung|claude-sonnet-5-5|medium", [217.9, 273.5], [0.6828, 0.7617]],
    ["s1|mistral-small-2603|high", [23.3, 37.4], [0.0102, 0.0116]],
    ["verdichtung|mistral-medium-3-5|high", [109.0, 189.0], [0.2275, 0.3355]],
    ["verdichtung|mistral-large-4|high", [165.4, 212.9], [0.1216, 0.178]],
  ];

  it("AV-2026-W43-05, -15: Messwerte des Vergleichslaufs liegen in den Spannen", () => {
    for (const [schluessel, [s0, s1], [u0, u1]] of GEMESSEN) {
      const m = MESSWERTE[schluessel];
      expect(m, schluessel).toBeDefined();
      expect(m.sekunden[0], `${schluessel}: Dauer von`).toBeLessThanOrEqual(s0);
      expect(m.sekunden[1], `${schluessel}: Dauer bis`).toBeGreaterThanOrEqual(s1);
      expect(m.usd[0], `${schluessel}: USD von`).toBeLessThanOrEqual(u0);
      expect(m.usd[1], `${schluessel}: USD bis`).toBeGreaterThanOrEqual(u1);
    }
    // neu bzw. erweitert, Werte von Hand nach der Regel im Kommentar (Maximum + 25 %, nach außen gerundet)
    expect(MESSWERTE["verdichtung|claude-sonnet-5-5|medium"]).toEqual({ sekunden: [150, 480], usd: [0.55, 1.25] });
    expect(MESSWERTE["verdichtung|gpt-6-astra|high"]).toEqual({ sekunden: [240, 420], usd: [1.5, 2.15] });
    expect(MESSWERTE["verdichtung|mistral-medium-3-5|high"]).toEqual({ sekunden: [90, 240], usd: [0.2, 0.45] });
    expect(MESSWERTE["verdichtung|mistral-large-4|high"]).toEqual({ sekunden: [150, 270], usd: [0.1, 0.25] });
    expect(MESSWERTE["verdichtung|gpt-6-astra|xhigh"]).toEqual({ sekunden: [330, 540], usd: [0.9, 2.3] });
  });

  // Anbietervergleich vom 04.11.2026 (App 0.7.7, Profil 1.38.0): je ein interner Erfassungslauf der Standard-Profile, gleiches
  // Material, ohne Recherche. Unabhängiges Soll: Kenndaten der Laufprotokolle (Mistral ohne EU-Aufschlag, Protokollwert ÷ 1,1).
  const ANBIETERVERGLEICH: [string, number, number][] = [
    ["s1|claude-haiku-5-5|high", 19.2, 0.0134], // 20261104-204127-m8r4
    ["erfassung|claude-opus-5-5|medium", 636.3, 2.659], // 20261104-204127-m8r4
    ["s1|gpt-6-luna|high", 90.9, 0.0099], // 20261104-202739-9snj
    ["erfassung|gpt-6-astra|high", 619.9, 2.2155], // 20261104-202739-9snj
    ["s1|mistral-small-2603|high", 31.2, 0.0112], // 20261104-202022-mfpv
    ["erfassung|mistral-medium-3-5|high", 278.5, 0.4816], // 20261104-202022-mfpv
  ];

  it("AV-2026-W45-01 bis -03: Messwerte des Anbietervergleichs liegen in den Spannen, Einzelmessungen vorläufig", () => {
    for (const [schluessel, sek, usd] of ANBIETERVERGLEICH) {
      const m = MESSWERTE[schluessel];
      expect(m, schluessel).toBeDefined();
      expect(m.sekunden[0], `${schluessel}: Dauer von`).toBeLessThanOrEqual(sek);
      expect(m.sekunden[1], `${schluessel}: Dauer bis`).toBeGreaterThanOrEqual(sek * 1.25);
      expect(m.usd[0], `${schluessel}: USD von`).toBeLessThanOrEqual(usd);
      expect(m.usd[1], `${schluessel}: USD bis`).toBeGreaterThanOrEqual(schluessel.startsWith("s1") ? usd : usd * 1.25);
    }
    // Werte von Hand nach der Regel (Maximum + 25 %, nach außen gerundet; Untergrenze aus der Verdichtung)
    expect(MESSWERTE["erfassung|claude-opus-5-5|medium"]).toEqual({ sekunden: [200, 810], usd: [1.4, 3.35] });
    expect(MESSWERTE["erfassung|gpt-6-astra|high"]).toEqual({ sekunden: [240, 780], usd: [1.5, 2.8], vorlaeufig: true });
    expect(MESSWERTE["erfassung|mistral-medium-3-5|high"]).toEqual({ sekunden: [90, 360], usd: [0.2, 0.65], vorlaeufig: true });
    // Anzeige: Einzelmessung als vorläufig gekennzeichnet, Hochrechnung als grob
    const astra = schaetzeStufe("erfassung", "gpt-6-astra", "high");
    expect(astra).toEqual({ sekunden: [240, 780], usd: [1.5, 2.8], gemessen: true, vorlaeufig: true });
    expect(stufenText("S2", "gpt-6-astra", "high", astra)).toBe("S2 (gpt-6-astra, high): 4–13 Minuten, 1,50–2,80 USD (vorläufig, ein Messlauf)");
    const mistral = schaetzeStufe("erfassung", "mistral-medium-3-5", "high", { mistral: { endpunkt: "eu" } });
    expect(mistral.usd![0]).toBeCloseTo(0.22);
    expect(mistral.usd![1]).toBeCloseTo(0.715);
    expect(stufenText("S2", "mistral-medium-3-5", "high", mistral)).toBe("S2 (mistral-medium-3-5, high): 1–6 Minuten, 0,22–0,72 USD (vorläufig, ein Messlauf)");
    expect(gueteText({ gemessen: true })).toBe("");
    expect(gueteText({ gemessen: false })).toBe(" (grob, ohne Messwert)");
    // Die Erfassung jedes Cloud-Standard-Profils hat seither eine Spanne mit Dauer
    for (const [anbieter, p] of Object.entries(STANDARD_PROFILE).filter(([a]) => a !== "ollama" && a !== "stelle")) {
      const e = schaetzeStufe("erfassung", p.modelle.erfassung, p.aufwand.erfassung);
      expect(e.gemessen, `${anbieter} Erfassung`).toBe(true);
      expect(e.sekunden, `${anbieter} Erfassung Dauer`).not.toBeNull();
    }
  });

  // Folgereihe zum Anbietervergleich vom 05.11.2026 (App 0.7.9, Profil 1.38.0): drei interne Erfassungsläufe mit demselben
  // Material und Opus in S2. Unabhängiges Soll: Kenndaten der Laufprotokolle (Dauer in s, Kosten in USD).
  const FOLGEREIHE: [string, number, number][] = [
    ["s1|gpt-6-luna|high", 99.4, 0.0098], // 20261105-141838-pyor
    ["erfassung|claude-opus-5-5|medium", 666.0, 2.5812], // 20261105-141838-pyor
    ["s1|gpt-6-luna|high", 111.9, 0.0077], // 20261105-143746-5iuf
    ["erfassung|claude-opus-5-5|high", 766.7, 2.8063], // 20261105-143746-5iuf
    ["s1|claude-sonnet-5-5|medium", 23.6, 0.2609], // 20261105-150440-l8af
    ["erfassung|claude-opus-5-5|medium", 664.7, 2.5309], // 20261105-150440-l8af
    // Fortschreibung desselben Materials mit Vormeldung
    ["s1|claude-sonnet-5-5|high", 59.5, 0.4306], // 20261105-173747-v8w6
    ["erfassung|claude-opus-5-5|high", 815.8, 3.3613], // 20261105-173747-v8w6
  ];

  it("Folgereihe 05.11.2026: Messwerte liegen in den Spannen; Sonnet S1 erweitert, Sonnet S1 „hoch“ und Opus „hoch“ in der Erfassung vorläufig", () => {
    for (const [schluessel, sek, usd] of FOLGEREIHE) {
      const m = MESSWERTE[schluessel];
      expect(m, schluessel).toBeDefined();
      expect(m.sekunden[0], `${schluessel}: Dauer von`).toBeLessThanOrEqual(sek);
      expect(m.sekunden[1], `${schluessel}: Dauer bis`).toBeGreaterThanOrEqual(sek);
      expect(m.usd[0], `${schluessel}: USD von`).toBeLessThanOrEqual(usd);
      expect(m.usd[1], `${schluessel}: USD bis`).toBeGreaterThanOrEqual(usd);
    }
    // Werte von Hand nach der Regel: überschrittene Obergrenze = Messwert plus 25 %, auf 0,05 USD bzw. 30 s nach außen
    // gerundet (0,2609 × 1,25 = 0,326 → 0,35; 766,7 s × 1,25 = 958 → 960 s; 2,8063 × 1,25 = 3,51 → 3,55); bestehende
    // Spannen nicht verengt; Untergrenze der vorläufigen Spanne aus der Erfassung mit Opus „mittel“
    expect(MESSWERTE["s1|claude-sonnet-5-5|medium"]).toEqual({ sekunden: [10, 30], usd: [0.02, 0.35] });
    expect(MESSWERTE["erfassung|claude-opus-5-5|medium"]).toEqual({ sekunden: [200, 810], usd: [1.4, 3.35] });
    expect(MESSWERTE["s1|gpt-6-luna|high"]).toEqual({ sekunden: [30, 120], usd: [0, 0.02] });
    expect(MESSWERTE["erfassung|claude-opus-5-5|high"]).toEqual({ sekunden: [200, 960], usd: [1.4, 3.55], vorlaeufig: true });
    // 59,5 s × 1,25 = 74 → 90 s; 0,4306 × 1,25 = 0,538 → 0,55 USD; Untergrenze aus Sonnet „mittel“
    expect(MESSWERTE["s1|claude-sonnet-5-5|high"]).toEqual({ sekunden: [10, 90], usd: [0.02, 0.55], vorlaeufig: true });
    expect(stufenText("S1", "claude-sonnet-5-5", "high", schaetzeStufe("s1", "claude-sonnet-5-5", "high"))).toBe(
      "S1 (claude-sonnet-5-5, high): bis 2 Minuten, 0,02–0,55 USD (vorläufig, ein Messlauf)",
    );
    const hoch = schaetzeStufe("erfassung", "claude-opus-5-5", "high");
    expect(stufenText("S2", "claude-opus-5-5", "high", hoch)).toBe("S2 (claude-opus-5-5, high): 3–16 Minuten, 1,40–3,55 USD (vorläufig, ein Messlauf)");
    expect(stufenText("S1", "claude-sonnet-5-5", "medium", schaetzeStufe("s1", "claude-sonnet-5-5", "medium"))).toBe(
      "S1 (claude-sonnet-5-5, medium): unter 1 Minute, 0,02–0,35 USD",
    );
  });

  it("TP-2026-W44-26: lokale Modelle über Ollama ohne Kosten und ohne Dauer", () => {
    for (const art of ["s1", "erfassung", "verdichtung"] as const)
      expect(schaetzeStufe(art, "ollama:llama3.1", "medium"), art).toEqual({ sekunden: null, usd: [0, 0], gemessen: false });
    expect(kostenText([0, 0])).toBe("ohne Kosten (lokales Modell)");
    expect(schaetzeKurzfassung("ollama:llama3.1", "medium", 12_000).usd).toEqual([0, 0]);
  });

  it("AV-2026-W43-05, -15: S1 und Verdichtung jedes Standard-Profils sind gemessen", () => {
    // Ollama (seit 0.6.3, nicht erprobt) hat keine Messwerte; eigener Test
    for (const [anbieter, p] of Object.entries(STANDARD_PROFILE).filter(([a]) => a !== "ollama" && a !== "stelle")) {
      expect(schaetzeStufe("s1", p.modelle.vorverarbeitung, p.aufwand.vorverarbeitung).gemessen, `${anbieter} S1`).toBe(true);
      expect(schaetzeStufe("verdichtung", p.modelle.verdichtung, p.aufwand.verdichtung).gemessen, `${anbieter} Verdichtung`).toBe(true);
    }
    // nicht angebotene Stufe gilt als die angebotene (AV-2026-W43-02): Mistral „mittel“ → „hoch“
    expect(schaetzeStufe("verdichtung", "mistral-medium-3-5", "medium")).toEqual(schaetzeStufe("verdichtung", "mistral-medium-3-5", "high"));
  });

  it("AV-2026-W43-06: EU-Aufschlag von Mistral in der Schätzung, sonst unverändert", () => {
    // Soll von Hand: Messwert 0,20–0,45 USD × 1,1 = 0,22–0,495 USD; Dauer unverändert
    const eu = schaetzeStufe("verdichtung", "mistral-medium-3-5", "high", { mistral: { endpunkt: "eu" } });
    expect(eu.sekunden).toEqual([90, 240]);
    expect(eu.usd![0]).toBeCloseTo(0.22, 10);
    expect(eu.usd![1]).toBeCloseTo(0.495, 10);
    expect(schaetzeStufe("verdichtung", "mistral-medium-3-5", "high", { mistral: { endpunkt: "global" } }).usd).toEqual([0.2, 0.45]);
    // Anthropic und OpenAI: Endpunkt ohne Wirkung
    expect(schaetzeStufe("verdichtung", "claude-opus-5-5", "medium", { mistral: { endpunkt: "eu" } }).usd).toEqual([1.2, 2.2]);
    expect(schaetzeStufe("verdichtung", "gpt-6-astra", "high", { mistral: { endpunkt: "eu" } }).usd).toEqual([1.5, 2.15]);
  });

  it("AV-2026-W43-06: Anzeige mit Mistral über den EU-Endpunkt nennt den Aufschlag", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const html = renderToStaticMarkup(
      createElement(LaufSchaetzung, {
        stufen: [{ kurz: "S2", rolle: "verdichtung", art: "verdichtung" }],
        einstellungen: {
          ...STANDARD,
          modelle: { ...STANDARD.modelle, verdichtung: "mistral-medium-3-5" },
          anbieterOptionen: { ...STANDARD.anbieterOptionen, mistral: { endpunkt: "eu" } },
        },
        profil: p!,
      }),
    );
    // eingestellt „mittel“, wirksam „hoch“; 0,20 × 1,1 = 0,22 und 0,45 × 1,1 = 0,495 → aufgerundet 0,50
    expect(html).toContain("S2 (mistral-medium-3-5, high): 1–4 Minuten, 0,22–0,50 USD inkl. 10 % EU-Aufschlag");
  });

  it("Management Summary: Dauer aus den Messwerten der Abnahme vom 25.10.2026 (seit 0.6.6)", () => {
    // Soll je Modell: größter Messwert plus 25 %, unter 60 s auf 10 s, darüber auf 30 s nach außen gerundet
    expect(MS_DAUER).toEqual({
      "claude-sonnet-5-5|medium": [0, 10], // 6–8 s
      "claude-opus-5-5|medium": [10, 40], // 18–28 s
      "claude-haiku-5-5|medium": [10, 20], // 10–15 s
      "gpt-6.1-sol|medium": [10, 40], // 15–32 s
      "mistral-medium-3-5|high": [10, 90], // 14–63 s
      "mistral-large-4|high": [90, 210], // 92–152 s
    });
    expect(dauerText(schaetzeKurzfassung("claude-sonnet-5-5", "medium", 12_000).sekunden)).toBe("unter 1 Minute");
    expect(dauerText(schaetzeKurzfassung("mistral-large-4", "high", 12_000).sekunden)).toBe("1–4 Minuten");
    // Nicht gemessen: keine Dauer, Kosten weiter über den Listenpreis
    expect(schaetzeKurzfassung("claude-opus-5-5", "high", 12_000).sekunden).toBeNull();
    expect(schaetzeKurzfassung("ollama:llama3.1", "medium", 12_000).sekunden).toBeNull();
  });
});
