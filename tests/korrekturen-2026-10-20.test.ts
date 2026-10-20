// Regressionstests zu den Befunden des Code-Reviews vom 20.10.2026 (F01–F13). Die Zustandsfehler der
// Oberfläche (F02, F03, F13) prüft tests/oberflaeche.test.ts.
import { afterEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import Ajv from "ajv/dist/2020";
import { verweise } from "../src/kern/quellen";
import { pruefeRoh, schemaFehler } from "../src/kern/validierung";
import { ladeProfil } from "../src/profil/laden";
import { redaktionscheck } from "../src/lagebild/redaktion";
import { herkunftsliste, kurzfassungsFingerabdruck } from "../src/pipeline/kurzfassung";
import { kostenNachFehler, kostenStand, kostenSumme, laufKostenText } from "../src/pipeline/lauf";
import { meldungAlsPdf } from "../src/dokumente/pdf";
import { strengesSchema, OpenAiAnbieter } from "../src/anbieter/openai";
import { AnthropicAnbieter } from "../src/anbieter/anthropic";
import { AnbieterFehler } from "../src/anbieter/typen";
import { warte } from "../src/anbieter/warten";
import { jsonDateien, leseOrdner, profil } from "./hilfen";

// ownProperties: Pflichtfelder müssen eigene Schlüssel sein (Ajv prüft sonst nur auf !== undefined)
const ajv = () => new Ajv({ strict: false, allErrors: true, ownProperties: true });
const beispiel = () => structuredClone(jsonDateien("../profile/lead-beispiel/beispiele/orkantief-ilka")[0].daten);

describe("F01: Quellenverweise terminieren für jede Eingabe", () => {
  it("liest Einzelverweise und Bereiche in beide Richtungen", () => {
    expect([...verweise("[Q2]")]).toEqual([2]);
    expect([...verweise("[Q1–Q3]")]).toEqual([1, 2, 3]);
    expect([...verweise("[Q3–Q1]")]).toEqual([1, 2, 3]);
    expect([...verweise("[Q1, Q4-Q5; Q7]")]).toEqual([1, 4, 5, 7]);
  });

  it("begrenzt Bereiche vorwärts und rückwärts auf 50 Nummern", () => {
    expect(verweise("[Q1–Q1000]").size).toBe(50);
    expect(verweise("[Q100000000–Q1]").size).toBe(50);
  });

  it("bleibt bei Nummern ab 2^53 nicht hängen und meldet sie als Verweis", () => {
    const start = Date.now();
    const r = verweise("[Q9007199254740992] [Q99999999999999999999–Q1] [Q0]");
    expect(Date.now() - start).toBeLessThan(500);
    expect(r.has(9007199254740992)).toBe(true);
    expect(r.has(0)).toBe(true);
  });
});

describe("F04: Schemaprüfung zählt nur eigene JSON-Schlüssel", () => {
  const gleichWieAjv = (schema: object, daten: unknown) => expect(pruefeRoh(schema, daten).length === 0).toBe(ajv().validate(schema, daten));

  it.each(["constructor", "toString", "__proto__", "hasOwnProperty"])("zusätzliches Feld „%s“ bei additionalProperties: false", (k) => {
    const s = { type: "object", properties: {}, additionalProperties: false };
    const d = JSON.parse(`{"${k}": 1}`);
    expect(pruefeRoh(s, d).map((f) => f.keyword)).toEqual(["additionalProperties"]);
    gleichWieAjv(s, d);
  });

  it("ein fehlendes Pflichtfeld „toString“ wird gemeldet", () => {
    const s = { type: "object", required: ["toString", "constructor"] };
    expect(pruefeRoh(s, {}).map((f) => f.pfad)).toEqual(["/toString", "/constructor"]);
    gleichWieAjv(s, {});
  });

  it("properties und dependentRequired mit geerbten Namen", () => {
    const s = { type: "object", properties: { valueOf: { type: "string" } }, dependentRequired: { a: ["toString"] } };
    gleichWieAjv(s, {});
    gleichWieAjv(s, { a: 1 });
    gleichWieAjv(s, { valueOf: 3 });
  });
});

describe("F05: Profilmanifest mit falschen Datentypen", () => {
  const basis = () => leseOrdner(join(__dirname, "../profile/lead-beispiel"));
  const mit = async (aendern: (m: any) => void) => {
    const d = basis();
    const m = JSON.parse(d["profil.json"]);
    aendern(m);
    d["profil.json"] = JSON.stringify(m);
    return ladeProfil(d);
  };

  it.each<[string, (m: any) => void, RegExp]>([
    ["name als Objekt", (m) => (m.name = { falsch: true }), /„name“ muss ein nicht leerer Text sein/],
    ["id als Zahl", (m) => (m.id = 42), /„id“ muss ein nicht leerer Text sein/],
    ["version als Liste", (m) => (m.version = ["1"]), /„version“ muss ein nicht leerer Text sein/],
    ["leerer Name", (m) => (m.name = "  "), /„name“ muss ein nicht leerer Text sein/],
    ["sop.dateien als Zahl", (m) => (m.sop = { dateien: 5 }), /„sop“ braucht „dateien“/],
    ["sop.dateien als Text", (m) => (m.sop = { dateien: "abc" }), /„sop“ braucht „dateien“/],
    ["anweisungen als Text", (m) => (m.anweisungen = "x"), /„anweisungen“ muss ein Objekt/],
    ["meldung.schema als Zahl", (m) => (m.meldung.schema = 5), /„meldung.schema“ muss ein Dateipfad/],
    ["beispiele mit null", (m) => (m.beispiele = [null]), /„beispiele“ braucht/],
    ["migrationen als Text", (m) => (m.migrationen = "x"), /„migrationen“ braucht/],
    ["kodierleitfaden als Zahl", (m) => (m.kodierleitfaden = 1), /„kodierleitfaden“ muss ein Text sein/],
  ])("%s: abgewiesen mit Befund, ohne Ausnahme", async (_, aendern, meldung) => {
    const e = await mit(aendern);
    expect(e.profil).toBeNull();
    expect(
      e.befunde
        .filter((b) => b.stufe === "fehler")
        .map((b) => b.text)
        .join("\n"),
    ).toMatch(meldung);
  });

  it("null bei optionalen Texten gilt wie eine fehlende Angabe", async () => {
    const e = await mit((m) => (m.beschreibung = null));
    expect(e.profil).not.toBeNull();
  });

  it("profil.json als Liste wird abgewiesen", async () => {
    const d = basis();
    d["profil.json"] = "[]";
    const e = await ladeProfil(d);
    expect(e.profil).toBeNull();
    expect(e.befunde[0].text).toMatch(/muss ein JSON-Objekt enthalten/);
  });
});

describe("F06: Eignungsprüfung des Meldungsschemas", () => {
  it.each<[string, object, RegExp]>([
    ["required als Text", { type: "object", required: "abc" }, /„required“ muss eine Liste von Feldnamen sein/],
    ["properties null", { type: "object", properties: null }, /„properties“ muss ein Objekt mit Teilschemata sein/],
    ["unbekannter Typ", { type: "text" }, /„type“ muss eine Typangabe/],
    ["negative Länge", { type: "string", minLength: -1 }, /„minLength“ muss eine ganze Zahl ab 0 sein/],
    ["enum als Text", { enum: "A" }, /„enum“ muss eine Liste sein/],
    ["items als Zahl", { type: "array", items: 3 }, /„items“ muss ein Teilschema/],
    ["leeres anyOf", { anyOf: [] }, /„anyOf“ muss eine nicht leere Liste/],
    ["multipleOf 0", { type: "number", multipleOf: 0 }, /„multipleOf“ muss eine Zahl größer als 0 sein/],
    ["zyklischer Verweis", { $defs: { a: { $ref: "#/$defs/b" }, b: { $ref: "#/$defs/a" } }, $ref: "#/$defs/a" }, /Verweiskette zu lang oder zyklisch/],
    ["Zyklus über allOf", { allOf: [{ $ref: "#" }] }, /zyklisch/],
    ["Zyklus über $ref mit Nachbarschlüssel", { $defs: { a: { $ref: "#/$defs/a", minLength: 1 } }, $ref: "#/$defs/a" }, /zyklisch/],
  ])("%s: lesbarer Fehler statt Ausnahme oder stiller Freigabe", (_, schema, meldung) => {
    let f: string | null = null;
    expect(() => (f = schemaFehler(schema))).not.toThrow();
    expect(f).toMatch(meldung);
  });

  it("zu tiefe Verschachtelung wird gemeldet", () => {
    let s: any = { type: "string" };
    for (let i = 0; i < 70; i++) s = { type: "object", properties: { x: s } };
    expect(schemaFehler(s)).toMatch(/tiefer als 60 Ebenen/);
  });

  it("gültige Schemata mit dependentRequired und booleschen Teilschemata bleiben verwendbar", () => {
    expect(
      schemaFehler({
        type: "object",
        properties: { a: { type: ["string", "null"] }, b: true, c: { type: "array", items: false } },
        dependentRequired: { a: ["b"] },
        additionalProperties: false,
      }),
    ).toBeNull();
  });

  it("die Schemata der mitgelieferten Profile bleiben verwendbar", async () => {
    for (const name of ["lead-beispiel", "muster"]) {
      const d = leseOrdner(join(__dirname, "../profile", name));
      const m = JSON.parse(d["profil.json"]);
      expect(schemaFehler(JSON.parse(d[m.meldung.schema])), name).toBeNull();
    }
  });
});

describe("F07: Redaktionscheck wertet jede Frist eines Sachverhalts aus", () => {
  it("findet die zweite, frühere Frist unabhängig von der Reihenfolge", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = beispiel();
    d.sachverhalte = [d.sachverhalte[0]];
    d.sachverhalte[0].sofort.bewertung_text = "Handlungsrelevant bis: 30.10.2026 12:00\nHandlungsrelevant bis: 21.10.2026 12:00";
    const e = { id: "test", name: "test.json", daten: d, hinweise: [], schema: [], fremd: null } as any;
    const r = redaktionscheck([e], p, new Date(2026, 9, 23), new Date(2026, 9, 20, 12));
    expect(r.zeit.map((z) => [z.text, z.klasse])).toEqual([
      ["21.10.2026 12:00", "alert"],
      ["30.10.2026 12:00", "ok"],
    ]);
  });
});

describe("F08: Fingerabdruck der Management Summary", () => {
  it("ändert sich mit der Herkunft der Angaben, nicht mit der Freigabe", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const a = beispiel();
    a.quellen = "[Q1] A – Betreiber A (2026): Lage [Zugriff: 20.10.2026]";
    const b = structuredClone(a);
    b.quellen = "[Q1] A – Betreiber B (2026): Lage [Zugriff: 20.10.2026]";
    expect(herkunftsliste(a, p)).not.toEqual(herkunftsliste(b, p));
    expect(kurzfassungsFingerabdruck(b, p)).not.toBe(kurzfassungsFingerabdruck(a, p));

    const c = structuredClone(a);
    if (c.freigabe?.freigabe) c.freigabe.freigabe.name = "Jemand";
    expect(kurzfassungsFingerabdruck(c, p)).toBe(kurzfassungsFingerabdruck(a, p));
  });

  it("ändert sich mit der Arbeitsanweisung der Kurzfassung", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = beispiel();
    const pfad = p.manifest.anweisungen?.kurzfassung;
    expect(pfad).toBeTruthy();
    const anders = { ...p, dateien: { ...p.dateien, [pfad!]: p.dateien[pfad!] + "\nZusatz." } };
    expect(kurzfassungsFingerabdruck(d, anders)).not.toBe(kurzfassungsFingerabdruck(d, p));
  });
});

describe("F09: Abbruch während der Wartezeit vor einem neuen Versuch", () => {
  afterEach(() => vi.useRealTimers());

  it("warte endet sofort bei bereits abgebrochenem Signal und räumt den Listener ab", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(warte(60_000, ctrl.signal)).rejects.toMatchObject({ name: "AbortError" });
    const offen = new AbortController();
    const weg = vi.spyOn(offen.signal, "removeEventListener");
    await warte(1, offen.signal);
    expect(weg).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it.each([
    ["OpenAI", OpenAiAnbieter],
    ["Anthropic", AnthropicAnbieter],
  ] as const)("%s: Abbruch beim Lesen einer Fehlerantwort beendet sofort, ohne weiteren Abruf", async (_, Klasse) => {
    vi.useFakeTimers();
    const ctrl = new AbortController();
    let aufrufe = 0;
    const abruf = vi.fn(async () => {
      aufrufe++;
      return {
        ok: false,
        status: 503,
        headers: new Headers({ "retry-after": "60" }),
        json: async () => {
          ctrl.abort();
          throw new DOMException("aborted", "AbortError");
        },
      };
    });
    const a = new Klasse("test", "https://example.invalid", abruf as any);
    let fehler: any;
    const lauf = a.senden({ modell: "test", maxTokens: 10, system: [], nachrichten: [], signal: ctrl.signal } as any).catch((e) => (fehler = e));
    await vi.advanceTimersByTimeAsync(1);
    await lauf;
    expect(fehler?.name).toBe("AbortError");
    expect(aufrufe).toBe(1);
  });
});

describe("F10: PDF bei falschem Listentyp", () => {
  it.each([["defekt"], [{ a: 1 }], [42]])("erzeugt das PDF mit sichtbarem Hinweis statt abzubrechen (%j)", async (wert) => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = beispiel();
    d.sachverhalte = wert;
    let blob: Blob | undefined;
    expect(() => (blob = meldungAlsPdf(d, p, true))).not.toThrow();
    const roh = new TextDecoder("latin1").decode(new Uint8Array(await blob!.arrayBuffer()));
    expect(roh).toContain("ungültiger Datentyp");
  });

  it("null als Sachverhalte bleibt ohne Hinweis", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const d = beispiel();
    d.sachverhalte = null;
    const roh = new TextDecoder("latin1").decode(new Uint8Array(await meldungAlsPdf(d, p, true).arrayBuffer()));
    expect(roh).not.toContain("ungültiger Datentyp");
  });
});

describe("F11: Kostenabdeckung eines Laufs", () => {
  it("eine Stufe ohne Kostenangabe gilt als nicht erfasst, nicht als kostenlos", () => {
    const lauf = {
      stufen: [
        { stufe: "S1", kostenUsd: 0.02 },
        { stufe: "S2", fehler: "Verbindung abgebrochen" },
      ],
    } as any;
    expect(kostenStand(lauf)).toEqual({ bekannt: 0.02, vollstaendig: false });
    expect(kostenSumme(lauf)).toBeNull();
    expect(laufKostenText({ kostenUsd: null, kostenBekanntUsd: 0.02 })).toBe("mindestens 0,02 USD (nicht alle Stufen erfasst)");
    expect(laufKostenText({ kostenUsd: null })).toBe("unbekannt");
    expect(kostenSumme({ stufen: [{ stufe: "S1", kostenUsd: 0 }] } as any)).toBe(0);
  });

  it("nur ein fehlender Schlüssel kostet sicher nichts", () => {
    // Ein HTTP-Fehler kann nach bereits berechneten Runden kommen (Fortsetzung, Neustart)
    expect(kostenNachFehler(new AnbieterFehler("Überlastet", 529))).toBeNull();
    expect(kostenNachFehler(new AnbieterFehler("kein Schlüssel", 0, "schluessel"))).toBe(0);
    expect(kostenNachFehler(new AnbieterFehler("Verbindung abgebrochen", 0, "verbindung"))).toBeNull();
    expect(kostenNachFehler(new DOMException("Abgebrochen", "AbortError"))).toBeNull();
    expect(kostenNachFehler(new Error("x"))).toBeNull();
  });
});

describe("F12: OpenAI-Schemakonvertierung macht optionale Felder wirklich nullable", () => {
  const validiert = (s: object, d: unknown) => ajv().validate(s, d);

  it.each<[string, object, unknown]>([
    ["enum", { type: "string", enum: ["A", "B"] }, "A"],
    ["const", { const: "fest" }, "fest"],
    ["$ref", { $ref: "#/$defs/t" }, "x"],
    ["anyOf", { anyOf: [{ type: "string" }, { type: "integer" }] }, 3],
  ])("optionales Feld mit %s erlaubt null und weiter die ursprünglichen Werte", (_, feld, gut) => {
    const original = {
      type: "object",
      $defs: { t: { type: "string" } },
      properties: { wahl: feld, pflicht: { type: "string", enum: ["X"] } },
      required: ["pflicht"],
    };
    const kopie = structuredClone(original);
    const s = strengesSchema(original);
    expect(original).toEqual(kopie);
    expect(s.required).toEqual(["wahl", "pflicht"]);
    expect(validiert(s, { wahl: null, pflicht: "X" })).toBe(true);
    expect(validiert(s, { wahl: gut, pflicht: "X" })).toBe(true);
    expect(validiert(s, { wahl: "unzulässig-" + Math.random(), pflicht: "X" })).toBe(_ === "$ref" || _ === "anyOf");
    expect(validiert(s, { wahl: null, pflicht: null })).toBe(false);
  });
});
