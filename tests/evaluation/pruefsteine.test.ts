// Prüfsteine (evaluation/pruefsteine/): KI-Meldungen aus dem Erfassungstest zu realen Lagen mit Begleitnotiz.
// Geprüft werden Begleitnotiz, Kennzeichnung als KI-Entwurf ohne amtlichen Charakter und Schemastand. Ruft keine KI auf.
// ET-2026-W47-01 (Erfassungstest KW 47, Freigabe des Herausgebers vom 20.11.2026, Variante A): Kennzeichnung und
// Schema nach der Kennung `schema` der Meldung – v1 wie bisher, v2 ab KW 47/2026 gegen das Schema des Beispielprofils.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pruefeRoh } from "../../src/kern/validierung";
import { referenzAjv } from "../support/ajv";
import { ILKA_ORDNER, ilkaMeldungV2 } from "../support/fixtures";
import { repoPfad } from "../support/dateien";

const lies = (pfad: string) => JSON.parse(readFileSync(repoPfad(pfad), "utf-8"));
const ORDNER = "evaluation/pruefsteine";
const STELLE = "KI-LEAD Erfassungstest – keine amtliche Meldung";

const V1 = "LEAD-Meldung-v1";
const V2 = "LEAD-Meldung-v2";

const notizPruefer = () => referenzAjv().compile(lies(`${ORDNER}/pruefstein.schema.json`));
// Prüfsteine bis KW 46/2026 bleiben auf LEAD-Meldung-v1 (UP-2026-W45-06) und werden am eingefrorenen v1-Schema des
// Beispielprofils geprüft; Prüfsteine ab KW 47/2026 stehen im gültigen Schema des Beispielprofils (ET-2026-W47-01).
const meldungsschema = (kennung: string) =>
  lies(kennung === V2 ? "profile/lead-beispiel/meldung.schema.json" : "tests/fixtures/lead-beispiel-v1/meldung.schema.json");

/** Kennzeichnungsfehler einer Prüfstein-Meldung nach ihrem Schema (leer = in Ordnung) */
function kennzeichnung(m: any): string[] {
  const f: string[] = [];
  if (m.schema === V2) {
    if (m.status !== "entwurf") f.push("status ist nicht „entwurf“");
    if (m.entstehung?.verfahren !== "KI-Entwurf") f.push("entstehung.verfahren ist nicht „KI-Entwurf“");
    if (typeof m.absender?.stelle !== "string" || !m.absender.stelle.startsWith(STELLE)) f.push("absender.stelle ohne Kennzeichnung");
    for (const z of ["erfasst", "freigegeben"]) if (m.freigabe?.[z]?.name) f.push(`freigabe.${z}.name gesetzt`);
    return f;
  }
  if (m.schema !== V1) return [`unbekannte Schemakennung „${m.schema}“`];
  if (m._status !== "Entwurf") f.push("_status ist nicht „Entwurf“");
  if (m._entstehung?.verfahren !== "KI-Entwurf") f.push("_entstehung.verfahren ist nicht „KI-Entwurf“");
  if (typeof m.meldende_stelle !== "string" || !m.meldende_stelle.startsWith(STELLE)) f.push("meldende_stelle ohne Kennzeichnung");
  for (const z of ["erfassung", "freigabe", "versand"]) if (m.freigabe?.[z]?.name) f.push(`freigabe.${z}.name gesetzt`);
  return f;
}

const ordner = () =>
  readdirSync(repoPfad(ORDNER))
    .filter((n) => statSync(repoPfad(ORDNER, n)).isDirectory())
    .sort();

/** Gültige Begleitnotiz und gekennzeichnete Meldung als Ausgangspunkt für Abwandlungen */
const notiz = () => ({
  format: "ki-lead-pruefstein/1",
  id: "2026-W44_beispiel",
  hinweis: "KI-Entwurf im Erfassungstest zu einer realen Lage – keine amtliche Meldung, keine Musterlösung.",
  lauf: { agent: "erfassungstest", erstellt_utc: "2026-10-28T06:30Z", modell: "claude-opus-5-5" },
  regelwerk: { commit: "a".repeat(40), sop_mappe: "3.16.0", kodierleitfaden: "1.3.0", anweisung_erfassung: "1.2", schema: "LEAD-Meldung-v1" },
  lage: { titel: "Beispiel", t0: "2026-10-28T07:00", referenzraum: "Bund", ereignisarten: ["Stromausfall / Blackout"], sop: ["B08", "C12"] },
  quellen: [{ url: "https://www.bbk.bund.de/", herausgeber: "BBK", abgerufen_utc: "2026-10-28T06:10Z" }],
  einstufung: ["mangelhaft"],
  maengel: [{ beschreibung: "D3 ohne Abgrenzung zur Nachbarstufe", stelle: "sachverhalte[0].radar", befund: "ET-2026-W44-01" }],
  befunde: ["ET-2026-W44-01"],
});
const meldung = () => {
  const name = readdirSync(repoPfad(ILKA_ORDNER)).find((n) => n.includes("_TH_"))!;
  const m = lies(`${ILKA_ORDNER}/${name}`);
  m._status = "Entwurf";
  m.meldende_stelle = `${STELLE} (Beispiel)`;
  for (const z of ["erfassung", "freigabe", "versand"]) m.freigabe[z].name = "";
  return m;
};
/** Gekennzeichnete v2-Meldung (Meldung der Koordinierungsstelle aus „Ilka“) als Ausgangspunkt für Abwandlungen */
const meldungV2 = () => {
  const m = ilkaMeldungV2("Bund");
  m.status = "entwurf";
  m.entstehung.verfahren = "KI-Entwurf";
  m.absender.stelle = `${STELLE} (Beispielprofil Koordinierungsstelle)`;
  m.freigabe = {};
  return m;
};

describe("Prüfsteine", () => {
  it("jeder Prüfstein hat Meldung und gültige Begleitnotiz, ist gekennzeichnet und entspricht dem Meldungsschema oder dokumentiert die Abweichung", () => {
    const pruefen = notizPruefer();
    for (const name of ordner()) {
      const n = lies(`${ORDNER}/${name}/pruefstein.json`);
      expect(pruefen(n), `${name}: ${JSON.stringify(pruefen.errors)}`).toBe(true);
      expect(n.id, `${name}: id gleich Ordnername`).toBe(name);
      expect(existsSync(repoPfad(ORDNER, name, "meldung.json")), `${name}: meldung.json fehlt`).toBe(true);
      const m = lies(`${ORDNER}/${name}/meldung.json`);
      expect([V1, V2], `${name}: Schemakennung`).toContain(m.schema);
      expect(n.regelwerk.schema, `${name}: Schema in der Begleitnotiz`).toBe(m.schema);
      expect(kennzeichnung(m), name).toEqual([]);
      const fehler = pruefeRoh(meldungsschema(m.schema), m);
      if (n.schemaabweichung) expect(fehler.length, `${name}: schemaabweichung dokumentiert, Meldung ist aber gültig`).toBeGreaterThan(0);
      else expect(fehler, `${name}: Meldung entspricht nicht dem aktuellen Schema; schemaabweichung dokumentieren`).toEqual([]);
      for (const mg of n.maengel) if (mg.befund) expect(n.befunde, `${name}: ${mg.befund} fehlt in befunde`).toContain(mg.befund);
      expect(readFileSync(repoPfad(ORDNER, name, "meldung.json"), "utf-8"), name).not.toMatch(/sk-(ant|proj|live)[-_][A-Za-z0-9_-]{8,}/);
    }
  });

  it("die Begleitnotiz verlangt Hinweis, Regelwerksstand, Quellen und bei Mängeln deren Beschreibung", () => {
    const pruefen = notizPruefer();
    expect(pruefen(notiz()), JSON.stringify(pruefen.errors)).toBe(true);
    const falsch: [string, (n: any) => void][] = [
      ["Hinweis geändert", (n) => (n.hinweis = "Musterlösung")],
      ["Commit gekürzt", (n) => (n.regelwerk.commit = "abc1234")],
      ["ohne Quellen", (n) => (n.quellen = [])],
      ["mangelhaft ohne Mängel", (n) => (n.maengel = [])],
      ["Einstufung unbekannt", (n) => (n.einstufung = ["gut"])],
      ["SOP-Kennung frei", (n) => (n.lage.sop = ["Stromausfall"])],
      ["ID ohne Kalenderwoche", (n) => (n.id = "beispiel")],
      ["anderer Agent", (n) => (n.lauf.agent = "lernschleife")],
    ];
    for (const [name, aendern] of falsch) {
      const n = notiz();
      aendern(n);
      expect(pruefen(n), name).toBe(false);
    }
    const brauchbar = { ...notiz(), einstufung: ["brauchbar"], maengel: [], befunde: [] };
    expect(pruefen(brauchbar), JSON.stringify(pruefen.errors)).toBe(true);
  });

  it("die Kennzeichnung erkennt Meldungen, die als amtlich oder freigegeben missverstanden werden könnten", () => {
    expect(kennzeichnung(meldung())).toEqual([]);
    expect(pruefeRoh(meldungsschema(V1), meldung())).toEqual([]);
    const falsch: [string, (m: any) => void][] = [
      ["final", (m) => (m._status = "final")],
      ["manuell", (m) => (m._entstehung.verfahren = "manuell")],
      ["echte Stelle", (m) => (m.meldende_stelle = "Lagezentrum")],
      ["gezeichnet", (m) => (m.freigabe.freigabe.name = "Max Muster")],
    ];
    for (const [name, aendern] of falsch) {
      const m = meldung();
      aendern(m);
      expect(kennzeichnung(m).length, name).toBeGreaterThan(0);
    }
  });

  it("ET-2026-W47-01: v2-Meldungen werden über status, entstehung, absender und freigabe gekennzeichnet und gegen das Schema des Beispielprofils geprüft", () => {
    expect(kennzeichnung(meldungV2())).toEqual([]);
    expect(pruefeRoh(meldungsschema(V2), meldungV2())).toEqual([]);
    // v2-Meldung am v1-Schema ist ungültig: die Unterscheidung nach `schema` ist nötig
    expect(pruefeRoh(meldungsschema(V1), meldungV2()).length).toBeGreaterThan(0);
    const falsch: [string, (m: any) => void][] = [
      ["freigegeben", (m) => (m.status = "freigegeben")],
      ["zur Freigabe", (m) => (m.status = "zur_freigabe")],
      ["manuell", (m) => (m.entstehung.verfahren = "manuell")],
      ["Stelle ohne Präfix", (m) => (m.absender.stelle = "Koordinierungsstelle (Beispiel)")],
      ["Präfix nicht am Anfang", (m) => (m.absender.stelle = `Lagezentrum – ${STELLE}`)],
      ["erfasst mit Namen", (m) => (m.freigabe.erfasst = { name: "Max Muster" })],
      ["freigegeben mit Namen", (m) => (m.freigabe.freigegeben = { name: "Max Muster", zeitpunkt: "2026-11-20" })],
      [
        "v1-Kennzeichnung in v2",
        (m) => {
          m.status = "freigegeben";
          m._status = "Entwurf";
        },
      ],
    ];
    for (const [name, aendern] of falsch) {
      const m = meldungV2();
      aendern(m);
      expect(kennzeichnung(m).length, name).toBeGreaterThan(0);
    }
    expect(kennzeichnung({ ...meldungV2(), schema: "LEAD-Meldung-v3" }).length, "unbekannte Kennung").toBeGreaterThan(0);
  });
});
