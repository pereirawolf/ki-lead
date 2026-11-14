// Kennzahlen-Bausteine im Lagebild (seit 0.8.2, UP-2026-W45-05; Paket 5 des Umstellungsplans): Material, keine
// Meldung – nicht im Meldestatus, nicht in den Zählern, nicht in Sachverhalten und Redaktionscheck; Beispiel mit
// Material im Landesprofil. Soll unabhängig vom Code: die unveränderten fiktiven Bausteine und Meldungen „Ilka“.
import { describe, expect, it } from "vitest";
import {
  alleSachverhalte,
  beispielDateien,
  beispielMitMaterial,
  bausteineFuerLagebild,
  einlesen,
  kennzahlen,
  materialPruefstand,
  meldestatus,
} from "../../src/lagebild/lagebild";
import { redaktionscheck } from "../../src/lagebild/redaktion";
import { rechenhilfe, rechenhilfeText } from "../../src/kern/bausteinverdichtung";
import { BAUSTEIN_SCHEMATA } from "../../src/pipeline/bausteinschemata";
import { profil, profilPflicht } from "../support/dateien";

const ILKA = "beispiele/orkantief-ilka";
const THESSA = "beispiele/orkantief-ilka-thessa";

describe("UP-2026-W45-05: Kennzahlen-Bausteine als Material im Lagebild", () => {
  it("Abnahme: drei Kreis-Bausteine 10:00 Uhr und Land 10:30 Uhr ergeben vier Bausteine als Material und null zusätzliche Meldungen", async () => {
    const p = await profilPflicht("lead-thueringen");
    const meldungen = beispielDateien(p, ILKA);
    const bausteine = beispielDateien(p, THESSA).filter((d) => !d.name.includes("Sonneberg_2026-10-14T10-30"));
    expect(bausteine).toHaveLength(4);
    const ohne = einlesen(meldungen, p, BAUSTEIN_SCHEMATA);
    const mit = einlesen([...meldungen, ...bausteine], p, BAUSTEIN_SCHEMATA);
    expect(mit.fehler).toEqual([]);
    expect(mit.material.map((m) => m.name)).toEqual(bausteine.map((d) => d.name));
    expect(mit.material.every((m) => m.erkennung.status === "gueltig")).toBe(true);
    expect(mit.eintraege.map((e) => e.name)).toEqual(ohne.eintraege.map((e) => e.name));
    expect(kennzahlen(mit.eintraege, p)).toEqual(kennzahlen(ohne.eintraege, p));
    expect(alleSachverhalte(mit.eintraege, p)).toHaveLength(alleSachverhalte(ohne.eintraege, p).length);
    const status = meldestatus(mit.eintraege, p)!;
    expect(status.weitere.map((e) => e.name)).toEqual([expect.stringContaining("_TH_Lagezentrum_")]);
    expect(redaktionscheck(mit.eintraege, p, "2026-10-21", new Date("2026-10-14T10:30:00+02:00"))).toEqual(
      redaktionscheck(ohne.eintraege, p, "2026-10-21", new Date("2026-10-14T10:30:00+02:00")),
    );
    // nur Bausteine: keine Meldung, kein Lesefehler
    const nur = einlesen(bausteine, p, BAUSTEIN_SCHEMATA);
    expect([nur.eintraege.length, nur.fehler.length, nur.material.length]).toEqual([0, 0, 4]);
  });

  it("Prüfstand: gültig, unbekannte Fassung, Schemabefund; ohne Schemata trotzdem Material, nicht Lesefehler", async () => {
    const p = await profilPflicht("lead-thueringen");
    const [d] = beispielDateien(p, THESSA);
    const daten = JSON.parse(d!.text);
    const unbekannt = { ...d!, name: "unbekannt.json", text: JSON.stringify({ ...daten, fassung: "9.9" }) };
    const kaputt = { ...d!, name: "kaputt.json", text: JSON.stringify({ ...daten, kennzahlen: "keine Liste" }) };
    const { material, fehler } = einlesen([d!, unbekannt, kaputt], p, BAUSTEIN_SCHEMATA);
    expect(fehler).toEqual([]);
    expect(material.map(materialPruefstand)).toEqual([
      "Schema erfüllt",
      "Fassung „9.9“ unbekannt, nicht geprüft",
      expect.stringMatching(/^\d+ Schemabefunde?$/),
    ]);
    expect(bausteineFuerLagebild(material).map((b) => b.name)).toEqual([d!.name]);
    expect(einlesen([d!], p).material[0]!.erkennung.status).toBe("unbekannte_fassung");
  });

  it("Beispiel „Orkantief Ilka“ lädt die Bausteine aus „material“ mit (Profilformat 1.32); Rechenhilfe wie an die KI", async () => {
    const geladen = await profil("lead-thueringen");
    const p = geladen.profil!;
    const ilka = p.manifest.beispiele!.find((b) => b.ordner === ILKA)!;
    expect(ilka.material).toEqual([THESSA]);
    expect(geladen.befunde.filter((b) => /Beispiel/.test(b.text))).toEqual([]);
    const dateien = beispielMitMaterial(p, ilka);
    expect(dateien).toHaveLength(9);
    const { eintraege, material } = einlesen(dateien, p, BAUSTEIN_SCHEMATA);
    expect([eintraege.length, material.length]).toEqual([4, 5]);
    const text = rechenhilfeText(rechenhilfe(bausteineFuerLagebild(material)));
    expect(text).toContain("Thüringen (16), Datenstand 14.10.2026, 10:30, Thessa – erfasster Ausschnitt, Vollständigkeit nicht angegeben");
    expect(text).toContain("EM-20261014-UNBF");
    expect(text.match(/EM-20261014-UNBF/g)).toHaveLength(1);
    // Beispiel ohne „material“ bleibt wie bisher
    const saale = p.manifest.beispiele!.find((b) => b.ordner !== ILKA)!;
    // ohne Zeitstempel verglichen: beide Aufrufe setzen „importiertAm“ selbst, an einer Millisekundengrenze verschieden
    const ohneZeit = (l: { name: string; text: string }[]) => l.map(({ name, text }) => ({ name, text }));
    expect(ohneZeit(beispielMitMaterial(p, saale))).toEqual(ohneZeit(beispielDateien(p, saale.ordner)));
  });
});
