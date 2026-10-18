import { describe, expect, it } from "vitest";
import { profil, jsonDateien } from "./hilfen";
import { vergleiche, vergleichTabelle, zuordnen } from "../src/pipeline/vergleich";

const p = (await profil("lead-beispiel")).profil!;
const ilka = jsonDateien("../profile/lead-beispiel/beispiele/orkantief-ilka");
const bund = ilka.find((x) => x.name.includes("_Bund_"))!.daten;
const th = ilka.find((x) => x.name.includes("_TH_"))!.daten;

describe("Vergleich mit Referenzfassung", () => {
  it("gleiche Fassung: volle Übereinstimmung je Achse", () => {
    const v = vergleiche(bund, structuredClone(bund), p);
    expect(v.paare).toHaveLength(1);
    expect(v.beurteilung).toEqual({ n: 1, gleich: 1 });
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
});
