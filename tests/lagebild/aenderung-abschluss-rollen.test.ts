// KL-2026-W46-01 (0.9.4, Profilformat 1.34): Rollen sv_aenderung und sv_abschluss – aus welchem Feld der Redaktionscheck
// Änderung zur Vormeldung und Abschluss liest, etwa auch aus einem Modul der Betreiber (Befund aus KRITIS-LEAD, Beispiel
// sonneberg-verlauf: Betreibermeldungen ohne Bewertung führen beides im Modul lead-kritis-betrieb).
// Unabhängiges Soll: Befunddatei ki-lead-befund_kritis_2026-W46.json mit den Entscheidungen des Herausgebers vom 15.11.2026
// (erster belegter Pfad gilt; ein Abschluss mit Ende oder Ergebnis ist ausgesagt); von Hand gesetzte Abwandlungen der festen
// Beispielmeldung TH 10:30; kein Zufall.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { einlesen, type LagebildDatei } from "../../src/lagebild/lagebild";
import { redaktionscheck } from "../../src/lagebild/redaktion";
import { ladeProfil } from "../../src/profil/laden";
import { leseOrdner, repoPfad } from "../support/dateien";
import { v2Profil } from "../support/v2profil";

const TH = () =>
  JSON.parse(readFileSync(repoPfad("formate/lead-meldung-v2/beispiele/LEAD-Meldung-v2_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json"), "utf-8"));
const datei = (name: string, d: unknown): LagebildDatei => ({ name, text: JSON.stringify(d), importiertAm: "2026-10-14T12:00:00Z" });
const MODUL = "x-betrieb";
const ROLLEN = {
  sv_aenderung: ["bewertung.aenderung_zur_vormeldung", `module.${MODUL}.aenderung_zur_vormeldung`],
  sv_abschluss: ["bewertung.abschluss", `module.${MODUL}.abschluss`],
};

/** Sachverhalt 1 wie eine Betreibermeldung: ohne Bewertung, Änderung und Abschluss im Modul; Sachverhalt 2 mit Bewertung und Modul */
function abgewandelt() {
  const d = TH();
  const [s1, s2] = d.sachverhalte;
  delete s1.bewertung;
  s1.module[MODUL] = {
    aenderung_zur_vormeldung: "Anschlüsse ohne Versorgung von 5.300 auf 4.100",
    abschluss: { ergebnis: "Versorgung aller Anschlüsse wiederhergestellt", offene_punkte: "Nacharbeiten ohne Versorgungsrelevanz." },
  };
  s2.bewertung.aenderung_zur_vormeldung = "Zahl gesperrter Landesstraßen von 15 auf 12 gesunken";
  s2.module[MODUL] = { aenderung_zur_vormeldung: "nicht lesen: Bewertung geht vor" };
  return d;
}

async function check(d: unknown, rollen: Record<string, unknown> = {}) {
  const p = await v2Profil("land", { mitDarstellung: true });
  Object.assign(p.ui.rollen, rollen);
  const { eintraege } = einlesen([datei("th.json", d)], p);
  return redaktionscheck(eintraege, p, "2026-10-15T18:00", new Date("2026-10-14T12:00:00Z"));
}

describe("KL-2026-W46-01: Rollen sv_aenderung und sv_abschluss im Redaktionscheck", () => {
  it("KL-2026-W46-01: mit Pfadliste liest der Check Modulfelder bei Sachverhalten ohne Bewertung; die Bewertung geht vor", async () => {
    const red = await check(abgewandelt(), ROLLEN);
    expect(red.aenderung.map((x) => [x.sv.index, x.text])).toEqual([
      [0, "Anschlüsse ohne Versorgung von 5.300 auf 4.100"],
      [1, "Zahl gesperrter Landesstraßen von 15 auf 12 gesunken"],
    ]);
    // Ergebnis ohne Ende: Abschluss ausgesagt, kein Marker
    expect(red.abschluss.map((x) => [x.sv.index, x.text])).toEqual([
      [0, "Ergebnis: Versorgung aller Anschlüsse wiederhergestellt; offen: Nacharbeiten ohne Versorgungsrelevanz."],
    ]);
    expect(red.marker.filter((m) => m.kennsatz === "Abschluss im Lagebild:" || m.kennsatz === "Änderung zur Vormeldung:")).toEqual([]);
  });

  it("KL-2026-W46-01: ohne Rollen unverändert – nur die Felder der Bewertung, Module bleiben unbeachtet", async () => {
    const red = await check(abgewandelt());
    expect(red.aenderung.map((x) => [x.sv.index, x.text])).toEqual([[1, "Zahl gesperrter Landesstraßen von 15 auf 12 gesunken"]]);
    expect(red.abschluss).toEqual([]);
  });

  it("KL-2026-W46-01: ein Pfad als Text genügt; leerer Text im ersten Pfad weicht dem zweiten, ohne zweiten bleibt der Befund „ohne Inhalt“", async () => {
    const d = abgewandelt();
    d.sachverhalte[1].bewertung.aenderung_zur_vormeldung = " ";
    const red = await check(d, ROLLEN);
    expect(red.aenderung.map((x) => [x.sv.index, x.text])).toEqual([
      [0, "Anschlüsse ohne Versorgung von 5.300 auf 4.100"],
      [1, "nicht lesen: Bewertung geht vor"],
    ]);
    const nurBewertung = await check(d, { sv_aenderung: "bewertung.aenderung_zur_vormeldung" });
    expect(nurBewertung.aenderung).toEqual([]);
    expect(nurBewertung.marker.filter((m) => m.kennsatz === "Änderung zur Vormeldung:").map((m) => [m.sv.index, m.art, m.text])).toEqual([
      [1, "leer", "Feld ohne Inhalt"],
    ]);
  });

  it("KL-2026-W46-01: Abschluss ohne Ende und ohne Ergebnis bleibt „kein Abschluss ausgesagt“; mit Ende wie bisher", async () => {
    const d = abgewandelt();
    d.sachverhalte[0].module[MODUL].abschluss = { ergebnis: " ", offene_punkte: "unklar" };
    d.sachverhalte[1].bewertung.abschluss = { ende: "2026-10-14", offene_punkte: "nichts", nachsorge: "Landkreise" };
    const red = await check(d, ROLLEN);
    expect(red.abschluss.map((x) => [x.sv.index, x.text])).toEqual([[1, "Ende 14.10.2026; offen: nichts; Nachsorge: Landkreise"]]);
    expect(red.marker.filter((m) => m.kennsatz === "Abschluss im Lagebild:").map((m) => [m.sv.index, m.art])).toEqual([[0, "offen"]]);
    expect(red.marker.find((m) => m.sv.index === 0 && m.kennsatz === "Abschluss im Lagebild:")!.text).toContain("kein Abschluss ausgesagt");
  });
});

describe("KL-2026-W46-01: Prüfung der Rollen beim Laden (Profilformat 1.34)", () => {
  async function laden(rollen: Record<string, unknown>) {
    const d = leseOrdner(repoPfad("profile", "lead-beispiel"));
    const ui = JSON.parse(d["meldung.ui.json"]!);
    Object.assign(ui.rollen, rollen);
    d["meldung.ui.json"] = JSON.stringify(ui);
    return ladeProfil(d);
  }
  const texte = (b: { befunde: { text: string; stufe: string }[] }, stufe: string) => b.befunde.filter((x) => x.stufe === stufe).map((x) => x.text);

  it("KL-2026-W46-01: Text oder Liste laden; ein unbekannter Pfad im Sachverhalt ist eine Warnung, das Profil bleibt nutzbar", async () => {
    const gut = await laden({ sv_aenderung: "bewertung.aenderung_zur_vormeldung", sv_abschluss: ["bewertung.abschluss"] });
    expect(gut.profil).not.toBeNull();
    expect(gut.befunde.filter((b) => /sv_aenderung|sv_abschluss/.test(b.text))).toEqual([]);
    const unbekannt = await laden({ sv_abschluss: ["bewertung.abschluss", "module.lead-kritis-betrieb.abschluss"] });
    expect(unbekannt.profil).not.toBeNull();
    expect(texte(unbekannt, "warnung")).toContain(
      "Darstellungsdatei: Rolle „sv_abschluss“ verweist auf das unbekannte Feld „module.lead-kritis-betrieb.abschluss“ im Sachverhalt.",
    );
  });

  it("KL-2026-W46-01: andere Typen sind Fehler wie bei den übrigen Rollen", async () => {
    const erg = await laden({ sv_aenderung: 3, sv_abschluss: { pfad: "bewertung.abschluss" } });
    expect(erg.profil).toBeNull();
    expect(texte(erg, "fehler")).toEqual(
      expect.arrayContaining([
        "Darstellungsdatei: Rolle „sv_aenderung“ muss Text oder eine Liste von Texten sein.",
        "Darstellungsdatei: Rolle „sv_abschluss“ muss Text oder eine Liste von Texten sein.",
      ]),
    );
  });
});
