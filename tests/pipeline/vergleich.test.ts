import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { krippendorffAlphaOrdinal, vergleiche, vergleicheMehrere, vergleichTabelle, zuordnen } from "../../src/pipeline/vergleich";

const p = (await profil("lead-beispiel")).profil!;
const bund = ilkaMeldung("Bund");
const th = ilkaMeldung("TH");

describe("Vergleich mit Referenzfassung", () => {
  it("gleiche Fassung: volle Übereinstimmung je Achse", () => {
    const v = vergleiche(bund, structuredClone(bund), p);
    expect(v.paare).toHaveLength(1);
    expect(v.beurteilung).toEqual({ n: 1, gleich: 1, fehlend: 0 });
    expect(v.achsen).toHaveLength(8);
    expect(v.achsen.every((a) => a.gleich === a.n && a.mittel === 0)).toBe(true);
  });

  it("zählt Abweichungen je Achse, offene Achsen und unterschiedliche Bewertungen", () => {
    const ki = structuredClone(bund);
    const sv = ki.sachverhalte[0];
    sv.sofort.lagenradar.d1 += 2;
    sv.sofort.lagenradar.d2 -= 1;
    sv.sofort.lagenradar.d7 = null;
    sv.sofort.beurteilung = "kritisch";
    const v = vergleiche(ki, bund, p);
    const a = Object.fromEntries(v.achsen.map((x) => [x.key, x]));
    expect(a.d1).toMatchObject({ n: 1, gleich: 0, nah: 0, mittel: 2 });
    expect(a.d2).toMatchObject({ gleich: 0, nah: 1, mittel: 1 });
    expect(a.d7).toMatchObject({ n: 0, offenEinseitig: 1, mittel: null });
    expect(v.beurteilung.gleich).toBe(0);
    expect(v.paare[0].achsen.find((x) => x.key === "d1")!.diff).toBe(2);
    const t = vergleichTabelle(v);
    expect(t[0][7]).toBe("Achse");
    expect(t).toHaveLength(9);
  });

  it("ordnet mehrere Sachverhalte nach Bezeichnung zu, auch in anderer Reihenfolge", () => {
    const umgedreht = { ...structuredClone(th), sachverhalte: [...th.sachverhalte].reverse() };
    const z = zuordnen(th, umgedreht, p);
    expect(z).toHaveLength(2);
    for (const paar of z) expect(paar.ki!.bezeichnung).toBe(paar.ref!.bezeichnung);
    const nurEiner = { ...structuredClone(th), sachverhalte: [th.sachverhalte[1]] };
    const z2 = zuordnen(th, nurEiner, p);
    expect(z2.filter((x) => x.ki && x.ref)).toHaveLength(1);
    expect(z2.filter((x) => !x.ref)).toHaveLength(1);
  });

  it("bildet bei fremden Einzelsachverhalten kein Paar und zählt leere Bewertungen nicht als Übereinstimmung", () => {
    const m = (titel: string, b = "") => ({
      sachverhalte: [{ bezeichnung: titel, art: [], ort: "", sofort: { beurteilung: b, tendenz: "", lagenradar: {} }, analyse: {} }],
    });
    const v = vergleiche(m("Waldbrand im Harz"), m("Cyberangriff auf Kommunalverwaltung"), p);
    expect(v.zugeordnet).toBe(0);
    expect(v.ohneGegenstueck).toBe(2);
    expect(v.beurteilung).toEqual({ n: 0, gleich: 0, fehlend: 0 });
    // manuell zugeordnet: leere Bewertungen bleiben n = 0 und werden als fehlend ausgewiesen
    const hand = vergleiche(m("Waldbrand im Harz"), m("Cyberangriff auf Kommunalverwaltung"), p, [{ ki: 0, ref: 0 }]);
    expect(hand.zugeordnet).toBe(1);
    expect(hand.beurteilung).toEqual({ n: 0, gleich: 0, fehlend: 1 });
    const halb = vergleiche(m("Waldbrand im Harz", "erheblich"), m("Waldbrand im Harz"), p);
    expect(halb.beurteilung).toEqual({ n: 0, gleich: 0, fehlend: 1 });
  });

  it("übernimmt eine manuelle Zuordnung statt der automatischen", () => {
    const z = zuordnen(th, th, p, [{ ki: 0, ref: 1 }]);
    expect(z.filter((x) => x.ki && x.ref).map((x) => [x.ki!.index, x.ref!.index])).toEqual([[0, 1]]);
    expect(z).toHaveLength(3);
  });
});

// Befund LS-2026-W43-04 (Lernschleife, 24.10.2026): Mehrfachvergleich mehrerer Kodierungen derselben Lage.
// Sollwerte von Hand gerechnet; das Alpha-Beispiel ist zusätzlich mit einer unabhängigen Implementierung abgeglichen.
describe("LS-2026-W43-04: Krippendorffs Alpha (ordinal)", () => {
  it.each([
    [
      "Beispiel von Hand: Einheiten [1,1] und [2,3]",
      [
        [1, 1],
        [2, 3],
      ],
      5 / 6,
    ],
    [
      "volle Übereinstimmung bei Streuung zwischen Einheiten",
      [
        [0, 0],
        [4, 4],
        [2, 2],
      ],
      1,
    ],
    [
      "offene Werte zählen nicht",
      [
        [1, 1, null],
        [2, 3],
      ],
      5 / 6,
    ],
  ] as [string, (number | null)[][], number][])("%s", (_name, einheiten, soll) => {
    expect(krippendorffAlphaOrdinal(einheiten)).toBeCloseTo(soll, 10);
  });

  it.each([
    ["nur eine Einheit", [[1, 3, 5]]],
    ["Einheiten mit nur einem Wert", [[1], [2, null]]],
    [
      "keine Streuung",
      [
        [3, 3],
        [3, 3],
      ],
    ],
    ["leer", []],
  ] as [string, (number | null)[][]][])("ohne Aussage (null): %s", (_name, einheiten) => {
    expect(krippendorffAlphaOrdinal(einheiten)).toBeNull();
  });
});

describe("LS-2026-W43-04: Mehrfachvergleich", () => {
  const mitRadar = (werte: Record<string, number | null>) => {
    const m = structuredClone(bund);
    Object.assign(m.sachverhalte[0].sofort.lagenradar, werte);
    return m;
  };

  it("Kennzahlen je Achse über drei Kodierungen eines Sachverhalts", () => {
    const v = vergleicheMehrere([mitRadar({ d1: 2, d2: 3, d3: null }), mitRadar({ d1: 4, d2: 3, d3: null }), mitRadar({ d1: null, d2: 3, d3: null })], p);
    expect(v.meldungen).toBe(3);
    expect(v.gruppen).toHaveLength(1);
    expect(v.gruppen[0].kodierungen).toBe(3);
    const a = Object.fromEntries(v.gruppen[0].achsen.map((x) => [x.key, x]));
    expect(a.d1).toMatchObject({ werte: [2, 4, null], n: 2, offen: 1, median: 3, min: 2, max: 4, paare: 1, nah: 0 });
    expect(a.d2).toMatchObject({ n: 3, offen: 0, median: 3, min: 3, max: 3, paare: 3, nah: 3 });
    expect(a.d3).toMatchObject({ n: 0, offen: 3, median: null, min: null, max: null, paare: 0 });
    expect(a.d1.imSoll).toBeUndefined();
    // eine Einheit: kein aussagekräftiges Alpha
    expect(v.alpha.every((x) => x.wert === null)).toBe(true);
  });

  it("zählt Treffer der Erwartung: Spanne und erwartet offen", () => {
    const v = vergleicheMehrere([mitRadar({ d1: 2, d3: null }), mitRadar({ d1: 4, d3: null }), mitRadar({ d1: null, d3: 1 })], p, {
      d1: { min: 2, max: 3 },
      d3: { offen: true },
    });
    const a = Object.fromEntries(v.gruppen[0].achsen.map((x) => [x.key, x]));
    expect(a.d1.imSoll).toBe(1);
    expect(a.d3.imSoll).toBe(2);
    expect(a.d2.imSoll).toBeUndefined();
  });

  it("ordnet Sachverhalte mehrerer Meldungen zu und berechnet Alpha je Achse über die Sachverhalte", () => {
    const setze = (m: any) => {
      m.sachverhalte.forEach((sv: any, i: number) => Object.assign(sv.sofort.lagenradar, { d1: i + 1, d2: 2 }));
      return m;
    };
    const a = setze(structuredClone(th));
    // gleiche Kodierung je Sachverhalt, aber in umgekehrter Reihenfolge
    const b = { ...structuredClone(a), sachverhalte: [...structuredClone(a).sachverhalte].reverse() };
    const v = vergleicheMehrere([a, b], p, { d1: { min: 0, max: 6 } });
    expect(v.gruppen).toHaveLength(2);
    expect(v.gruppen.map((g) => g.kodierungen)).toEqual([2, 2]);
    expect(v.ohneGegenstueck).toBe(0);
    // Erwartung gilt nur bei genau einem Sachverhalt
    expect(v.gruppen[0].achsen[0].imSoll).toBeUndefined();
    const alpha = Object.fromEntries(v.alpha.map((x) => [x.key, x]));
    expect(alpha.d1).toMatchObject({ wert: 1, einheiten: 2 });
    expect(alpha.d2.wert).toBeNull();
  });

  it("ohne Meldungen leer", () => {
    expect(vergleicheMehrere([], p)).toMatchObject({ meldungen: 0, gruppen: [], alpha: [] });
  });
});
