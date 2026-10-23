// Maschinenlesbare KI-Kennzeichnung der Ausgaben (KI-Verordnung Art. 50 Abs. 2; docs/KI-VERORDNUNG.md, 6.1), seit 0.5.4.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { lagebildAlsPdf, meldungAlsPdf } from "../../src/dokumente/pdf";
import {
  herkunftAusMeldung,
  herkunftMehrerer,
  IPTC_KI_TEILWEISE,
  kurzfassungAlsDatei,
  pdfSchluesselwoerter,
  xmpPaket,
} from "../../src/dokumente/kennzeichnung";

const roh = async (b: Blob) => new TextDecoder("latin1").decode(new Uint8Array(await b.arrayBuffer()));
const IPTC = "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia";

describe("Herkunft aus dem Entstehungsfeld", () => {
  it("liest KI-Entwurf, manuelle Angabe und fehlende Angabe", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const th = ilkaMeldung("TH");
    expect(th._entstehung.verfahren).toBe("KI-Entwurf");
    expect(herkunftAusMeldung(th, p)).toMatchObject({ herkunft: "ki", modell: "Claude Opus 5.5" });
    expect(herkunftAusMeldung({ ...th, _entstehung: { verfahren: "manuell" } }, p).herkunft).toBe("manuell");
    const { _entstehung, ...ohne } = th;
    expect(herkunftAusMeldung(ohne, p).herkunft).toBe("unbekannt");
    expect(herkunftAusMeldung({ ...th, _entstehung: { verfahren: "" } }, p).herkunft).toBe("unbekannt");
  });
  it("fasst mehrere Meldungen zusammen: KI, sobald eine KI-erzeugt ist", () => {
    expect(herkunftMehrerer([{ herkunft: "manuell" }, { herkunft: "ki" }])).toBe("ki");
    expect(herkunftMehrerer([{ herkunft: "manuell" }, { herkunft: "manuell" }])).toBe("manuell");
    expect(herkunftMehrerer([{ herkunft: "manuell" }, { herkunft: "unbekannt" }])).toBe("unbekannt");
    expect(herkunftMehrerer([])).toBe("unbekannt");
  });
});

describe("XMP-Paket", () => {
  it("nennt den IPTC Digital Source Type nur bei KI-Herkunft", () => {
    expect(IPTC_KI_TEILWEISE).toBe(IPTC);
    expect(xmpPaket({ titel: "T", herkunft: "ki", modell: "m" })).toContain(`<Iptc4xmpExt:DigitalSourceType>${IPTC}</Iptc4xmpExt:DigitalSourceType>`);
    expect(xmpPaket({ titel: "T", herkunft: "manuell" })).not.toContain("DigitalSourceType");
    expect(xmpPaket({ titel: "T", herkunft: "unbekannt" })).toContain("<kilead:herkunft>unbekannt</kilead:herkunft>");
  });
  it("maskiert Titel und Modell als XML", () => {
    const x = xmpPaket({ titel: 'A & B <C> "D"', herkunft: "ki", modell: "<m>" });
    expect(x).toContain("A &amp; B &lt;C&gt; &quot;D&quot;");
    expect(x).toContain("<kilead:modell>&lt;m&gt;</kilead:modell>");
    expect(x).not.toContain("<C>");
  });
  it("Schlüsselwörter je Herkunft", () => {
    expect(pdfSchluesselwoerter("ki")).toBe("KI-LEAD, KI-generiert");
    expect(pdfSchluesselwoerter("manuell")).toBe("KI-LEAD, manuell");
    expect(pdfSchluesselwoerter("unbekannt")).toBe("KI-LEAD, Herkunft unbekannt");
  });
});

describe("PDF einer Meldung", () => {
  it("trägt bei einem KI-Entwurf Metadaten, Schlüsselwörter, Sprache und Fußzeile", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const pdf = await roh(meldungAlsPdf(ilkaMeldung("TH"), p, true));
    expect(pdf).toMatch(/\/Type \/Metadata \/Subtype \/XML/);
    expect(pdf).toContain(IPTC);
    expect(pdf).toContain("/Keywords (KI-LEAD, KI-generiert)");
    expect(pdf).toMatch(/\/Creator \(KI-LEAD \d+\.\d+\.\d+\)/);
    expect(pdf).toContain("/Lang (de-DE)");
    expect(pdf).toContain("Erstellt mit KI-LEAD · KI-generiert".replace("·", "\xb7"));
  });
  it("kennzeichnet eine manuelle Meldung nicht als KI-generiert", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = { ...ilkaMeldung("TH"), _entstehung: { verfahren: "manuell" } };
    const pdf = await roh(meldungAlsPdf(d, p, false));
    expect(pdf).not.toContain(IPTC);
    expect(pdf).toContain("/Keywords (KI-LEAD, manuell)");
    expect(pdf).not.toContain("KI-generiert");
  });
});

describe("PDF des Lagebilds", () => {
  it("ist KI-generiert, sobald eine enthaltene Meldung ein KI-Entwurf ist", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const manuell = { ...ilkaMeldung("HE"), _entstehung: { verfahren: "manuell" } };
    const kopf = [["Sachverhalt"], ["x"]];
    const gemischt = await roh(lagebildAlsPdf(p, "Lagebild", kopf, [{ daten: manuell, titel: "HE", zusatz: [] }, { daten: ilkaMeldung("TH"), titel: "TH", zusatz: [] }], "24.10.2026"));
    expect(gemischt).toContain(IPTC);
    expect(gemischt).toContain("/Keywords (KI-LEAD, KI-generiert)");
    const nurManuell = await roh(lagebildAlsPdf(p, "Lagebild", kopf, [{ daten: manuell, titel: "HE", zusatz: [] }], "24.10.2026"));
    expect(nurManuell).not.toContain(IPTC);
    expect(nurManuell).toContain("/Keywords (KI-LEAD, manuell)");
  });
});

describe("Management Summary als Datei", () => {
  it("beginnt mit einer Kopfzeile mit Werkzeug und Modell, der Text folgt unverändert", () => {
    const datei = kurzfassungAlsDatei("Kernaussage.\n\nBewertung & Tendenz: erheblich", "claude-sonnet-5-5");
    const [kopf, leer, ...rest] = datei.split("\n");
    expect(kopf).toMatch(/^\[KI-generiert mit KI-LEAD \d+\.\d+\.\d+, Modell claude-sonnet-5-5; vor Verwendung fachlich prüfen\]$/);
    expect(leer).toBe("");
    expect(rest.join("\n")).toBe("Kernaussage.\n\nBewertung & Tendenz: erheblich");
  });
  it("nennt ohne Modell nur das Werkzeug", () => {
    expect(kurzfassungAlsDatei("x", undefined).split("\n")[0]).toMatch(/^\[KI-generiert mit KI-LEAD \d+\.\d+\.\d+; vor Verwendung/);
  });
});
