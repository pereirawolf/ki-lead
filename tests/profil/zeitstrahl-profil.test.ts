// Profilformat 1.23 (seit 0.6.9, ZS-2026-W44-01 bis -03): Prüfung der Abschnitte „kennung“ und „zeitstrahl“ und der Rollen
// „zeitstrahl“, „sv_kennung“, „sv_bezug“ beim Laden. Ältere Pakete ohne diese Angaben laden unverändert.
import { describe, expect, it } from "vitest";
import { ladeProfil } from "../../src/profil/laden";
import { leseOrdner, repoPfad } from "../support/dateien";

/** Beispielprofil mit geänderter Darstellungsdatei */
async function mitUi(aendern: (ui: any) => void) {
  const d = leseOrdner(repoPfad("profile", "lead-beispiel"));
  const ui = JSON.parse(d["meldung.ui.json"]!);
  aendern(ui);
  d["meldung.ui.json"] = JSON.stringify(ui);
  return ladeProfil(d);
}
const texte = (b: { befunde: { text: string; stufe: string; code?: string }[] }, stufe: string) =>
  b.befunde.filter((x) => x.stufe === stufe).map((x) => x.text);

describe("Profilformat 1.23: Kennung und Zeitstrahl beim Laden", () => {
  it("Beispielprofil lädt ohne Fehler und Warnung zu den neuen Angaben", async () => {
    const erg = await mitUi(() => {});
    expect(erg.profil).not.toBeNull();
    expect(erg.befunde.filter((b) => /kennung|zeitstrahl|bezug/i.test(b.text))).toEqual([]);
  });

  it("ungültiges Präfix und ungültiger Standard sind Fehler", async () => {
    const erg = await mitUi((ui) => {
      ui.kennung.praefixe.Thüringen = "de-th";
      ui.kennung.standard = "DE_BUND";
    });
    expect(erg.profil).toBeNull();
    expect(texte(erg, "fehler")).toEqual([
      "Darstellungsdatei: „kennung.praefixe“: Präfix „de-th“ für „Thüringen“ ist ungültig (Großbuchstaben und Ziffern, z. B. „DE-TH“).",
      "Darstellungsdatei: „kennung.standard“ muss ein Präfix aus Großbuchstaben und Ziffern sein (z. B. „DE“).",
    ]);
  });

  it("Typen ohne Trennzeichen, Bewertungs- und Berichtigungstyp aus der Liste, Richtwert ab 1", async () => {
    const erg = await mitUi((ui) => {
      ui.zeitstrahl.typen = ["Ereignis", "Warnung · amtlich"];
      ui.zeitstrahl.typ_bewertung = "Einschätzung";
      ui.zeitstrahl.richtwert_je_sachverhalt = 0;
    });
    expect(erg.profil).toBeNull();
    expect(texte(erg, "fehler")).toEqual([
      "Darstellungsdatei: „zeitstrahl.typen“ muss eine nicht leere Liste von Typen ohne „·“, „|“, „–“ und eckige Klammern sein.",
      "Darstellungsdatei: „zeitstrahl.typ_bewertung“ muss einer der Typen sein.",
      "Darstellungsdatei: „zeitstrahl.typ_berichtigung“ muss einer der Typen sein.",
      "Darstellungsdatei: „zeitstrahl.richtwert_je_sachverhalt“ muss eine ganze Zahl ab 1 sein.",
    ]);
  });

  it("Rollen auf unbekannte Felder und Zeitstrahl ohne Kennung ergeben Warnungen, das Profil bleibt nutzbar", async () => {
    const erg = await mitUi((ui) => {
      ui.rollen.sv_bezug = "herkunft";
      ui.rollen.zeitstrahl = "chronik";
      delete ui.rollen.sv_kennung;
    });
    expect(erg.profil).not.toBeNull();
    expect(texte(erg, "warnung")).toEqual(
      expect.arrayContaining([
        "Darstellungsdatei: Rolle „zeitstrahl“ verweist auf das unbekannte Feld „chronik“.",
        "Darstellungsdatei: Rolle „sv_bezug“ verweist auf das unbekannte Feld „herkunft“ im Sachverhalt.",
        "Darstellungsdatei: Rolle „zeitstrahl“ ohne „sv_kennung“; Zeilen des Zeitstrahls lassen sich dann keinem Sachverhalt zuordnen.",
      ]),
    );
    expect(erg.befunde.find((b) => b.code === "ZEITSTRAHL_OHNE_KENNUNG")?.stufe).toBe("warnung");
  });

  it("Paket ohne die neuen Angaben (Vorlage) lädt wie bisher", async () => {
    const d = leseOrdner(repoPfad("profile", "muster"));
    const erg = await ladeProfil(d);
    expect(erg.profil).not.toBeNull();
    expect(erg.befunde.filter((b) => /kennung|zeitstrahl|bezug/i.test(b.text))).toEqual([]);
  });
});
