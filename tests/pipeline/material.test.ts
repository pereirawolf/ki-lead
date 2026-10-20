// Material des Auftrags: DOCX, PDF, URLs, gleichnamige Dateien, Eingangserkennung, eigene Stelle und Rollenwahl.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaDatei, ilkaMeldung } from "../support/fixtures";
import { neuerLauf } from "../../src/pipeline/lauf";
import { materialBloecke, docxText, urlsAusText, dateiLesen, juengsterEingang, type Material } from "../../src/pipeline/material";
import JSZip from "jszip";

const he = ilkaMeldung("HE");

describe("Material", () => {
  it("liest DOCX-Text und erkennt URLs", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      "<w:document><w:body><w:p><w:r><w:t>Erste &amp; Zeile</w:t></w:r></w:p><w:p><w:r><w:t>Zweite</w:t><w:tab/><w:t>Spalte</w:t></w:r></w:p></w:body></w:document>",
    );
    const daten = await zip.generateAsync({ type: "arraybuffer" });
    expect(await docxText(daten)).toBe("Erste & Zeile\nZweite\tSpalte");
    expect(urlsAusText("https://a.de/x  kein-link\nhttp://b.de")).toEqual({ gueltig: ["https://a.de/x", "http://b.de/"], ungueltig: ["kein-link"] });
  });

  it("legt PDFs als Dokumentblock bei und URLs in den Nutzertext", () => {
    const bloecke = materialBloecke([{ id: "1", art: "pdf", name: "a.pdf", groesse: 3, hash: "h", base64: "QUJD" }], ["https://x.de/"], "Sturm");
    expect(bloecke[0]).toMatchObject({ type: "text" });
    expect((bloecke[0] as any).text).toContain("https://x.de/");
    expect(bloecke[1]).toMatchObject({ type: "document", source: { media_type: "application/pdf", data: "QUJD" } });
  });
});

describe("Gleichnamige Dateien", () => {
  it("erhalten im Material eindeutige Namen, gleiche Inhalte entfallen", async () => {
    const { materialErgaenzen } = await import("../../src/pipeline/material");
    const m = (name: string, hash: string): Material => ({ id: hash, art: "eingang", name, groesse: 1, hash });
    const erg = materialErgaenzen([m("meldung.json", "a")], [m("meldung.json", "b"), m("meldung.json", "a"), m("meldung.json", "c")]);
    expect(erg.map((x) => x.name)).toEqual(["meldung.json", "meldung (2).json", "meldung (3).json"]);
  });
  it("behält beim ZIP-Import den Pfad im Archiv", async () => {
    const JSZip = (await import("jszip")).default;
    const { dateienAusAuswahl } = await import("../../src/lagebild/lagebild");
    const zip = new JSZip();
    zip.file("Nord/meldung.json", "{}");
    zip.file("Sued/meldung.json", '{"a":1}');
    const blob = await zip.generateAsync({ type: "blob" });
    const { dateien } = await dateienAusAuswahl([new File([blob], "eingang.zip")]);
    expect(dateien.map((d) => d.name).sort()).toEqual(["eingang/Nord/meldung.json", "eingang/Sued/meldung.json"]);
  });
});

describe("Verdichtung von Eingangsmeldungen", () => {
  it("erkennt Meldungen anderer Stellen als Eingang und die eigene als Vormeldung", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const th = ilkaDatei("TH");
    const datei = new File([JSON.stringify(th.daten)], th.name, { type: "application/json" });
    const m = await dateiLesen(datei, p!);
    expect(m.art).toBe("eingang");
    expect(m.eingang).toMatchObject({ land: "Thüringen", zeitpunkt: "2026-10-14T10:30", sachverhalte: 2 });
    const eigen = { ...th.daten, meldende_stelle: "Koordinierungsstelle (Beispiel)" };
    const v = await dateiLesen(new File([JSON.stringify(eigen)], "eigen.json"), p!);
    expect(v.art).toBe("meldung");
    expect(juengsterEingang([m, { ...m, eingang: { ...m.eingang!, zeitpunkt: "2026-10-14T11:00" } }])).toBe("2026-10-14T11:00");
  });
});

describe("Meldungsidentität (F03) und eigene Stelle (F07)", () => {
  it("erkennt die eigene Stelle nur exakt oder über hinterlegte Aliasnamen", async () => {
    const { istEigeneStelle } = await import("../../src/kern/ui");
    const { profil: p } = await profil("lead-beispiel");
    const m = p!.manifest;
    expect(istEigeneStelle("Koordinierungsstelle (Beispiel)", m)).toBe(true);
    expect(istEigeneStelle("  koordinierungsstelle   (beispiel) ", m)).toBe(true);
    expect(istEigeneStelle("Koordinierungsstelle (Beispiel) – Redaktionskonferenz", m)).toBe(true); // Alias
    expect(istEigeneStelle("Koordinierungsstelle (Beispiel) Außenstelle", m)).toBe(false);
    const fremd = { ...structuredClone(he), meldende_stelle: "Koordinierungsstelle (Beispiel) Außenstelle", land: "Bund" };
    const mat = await dateiLesen(new File([JSON.stringify(fremd)], "a.json"), p!);
    expect(mat.art).toBe("eingang");
    const { umklassifizieren } = await import("../../src/pipeline/material");
    expect(umklassifizieren(mat, p!).art).toBe("meldung");
    expect(umklassifizieren(umklassifizieren(mat, p!), p!).art).toBe("eingang");
  });
});

describe("Rollenwahl bei der Übergabe", () => {
  it("setzt die gewählte Rolle verbindlich und begründet unmögliche Rollen", async () => {
    const { rolleSetzen, moeglicheRollen } = await import("../../src/pipeline/material");
    const { profil: p } = await profil("lead-beispiel");
    const bund = ilkaMeldung("Bund");
    const eigen = await dateiLesen(new File([JSON.stringify(bund)], "bund.json"), p!);
    expect(eigen.art).toBe("meldung"); // Alias der eigenen Stelle
    const alsEingang = rolleSetzen(eigen, "eingang", p!);
    expect(alsEingang).toMatchObject({ art: "eingang", rolleGewaehlt: true });
    expect(alsEingang.meldung).toBe(eigen.meldung); // Original unverändert
    const land = await dateiLesen(new File([JSON.stringify(he)], "he.json"), p!);
    expect(rolleSetzen(land, "meldung", p!)).toMatchObject({ art: "meldung", rolleGewaehlt: true });
    expect(rolleSetzen(land, "eingang", p!)).toMatchObject({ art: "eingang", rolleGewaehlt: true });
    // Fremdes Schema: nur als Eingang
    const fremd = { schema: "Andere-v3", meldende_stelle: "Lagezentrum X", sachverhalte: [{ titel: "A" }] };
    expect(moeglicheRollen(fremd, p!)).toEqual({ eingang: { moeglich: true }, meldung: { moeglich: false, grund: "Schema passt nicht zum aktiven Profil" } });
    const fm = await dateiLesen(new File([JSON.stringify(fremd)], "f.json"), p!);
    const versucht = rolleSetzen(fm, "meldung", p!);
    expect(versucht.art).toBe("eingang");
    expect(versucht.hinweis).toMatch(/Gewählte Rolle nicht möglich \(Schema passt nicht/);
  });
  it("protokolliert gewählte Rollen im Lauf", async () => {
    const { rolleSetzen } = await import("../../src/pipeline/material");
    const { profil: p } = await profil("lead-beispiel");
    const land = rolleSetzen(await dateiLesen(new File([JSON.stringify(he)], "he.json"), p!), "eingang", p!);
    const l = neuerLauf(p!, { sachverhalt: "x", stichworte: "", urls: [], stichtag: "2026-10-14", prueffrage: "" }, [
      { name: land.name, art: land.art, groesse: land.groesse, hash: land.hash, rolleGewaehlt: land.rolleGewaehlt },
    ]);
    expect(l.material[0]).toMatchObject({ art: "eingang", rolleGewaehlt: true });
  });
});
