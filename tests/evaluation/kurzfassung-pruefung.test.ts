// Vorprüfung der Management Summary aus der Musterfassung Ilka (evaluation/abnahmen/kurzfassung.pruefung.ts):
// Beobachtungen für die Prüfung von Hand. Sollwerte aus festen Beispieltexten.
import { describe, expect, it } from "vitest";
import { kurzfassungPruefen } from "../../evaluation/abnahmen/kurzfassung.pruefung";

const gut = {
  kernaussage: "Nach dem Orkantief sind noch mindestens rund 20.700 Menschen ohne Strom; in Sonneberg enden Notstrompuffer vor der Wiederversorgung.",
  abschnitte: { massnahmen: "Ob die Nachbetankung bis 15.10. mittags gesichert ist, ist offen." },
  kurztitel: ["Sturmfolgen", "Stromausfälle"],
};

describe("Vorprüfung der Management Summary (Musterfassung Ilka)", () => {
  it("eine regelgerechte Fassung ohne Auffälligkeit", () => {
    expect(kurzfassungPruefen(gut)).toEqual({
      woerter: 28, // 18 + 10, von Hand gezählt
      zu_lang: false,
      kurztitel_passend: true,
      mindestwert_fehlt: false,
      hochrechnung_ungekennzeichnet: false,
      nachbetankung_als_erledigt: false,
      marker_im_text: false,
    });
  });

  it.each([
    ["Mindestwert fehlt", { kernaussage: "Rund 20.700 Menschen sind ohne Strom." }, "mindestwert_fehlt"],
    ["Hochrechnung ungekennzeichnet", { kernaussage: "Rund 29.000 Menschen sind ohne Strom." }, "hochrechnung_ungekennzeichnet"],
    ["Nachbetankung erledigt", { abschnitte: { massnahmen: "Die Nachbetankung ist gesichert." } }, "nachbetankung_als_erledigt"],
    ["Radarwert im Text", { abschnitte: { lage: "D2 = 4 nach Kreisangaben." } }, "marker_im_text"],
    ["Kurztitel fehlt", { kurztitel: ["Stromausfälle"] }, "kurztitel_passend"],
  ] as const)("%s", (_name, aenderung, merkmal) => {
    const b = kurzfassungPruefen({ ...gut, ...aenderung } as any);
    expect(b[merkmal]).toBe(merkmal !== "kurztitel_passend");
  });

  it("Hochrechnung als solche gekennzeichnet ist keine Auffälligkeit", () => {
    expect(kurzfassungPruefen({ ...gut, kernaussage: "Mit der Hochrechnung für Goslar rund 29.000 Menschen ohne Strom." }).hochrechnung_ungekennzeichnet).toBe(false);
  });

  it("über 180 Wörtern zu lang", () => {
    expect(kurzfassungPruefen({ ...gut, kernaussage: Array(181).fill("Wort").join(" "), abschnitte: {} }).zu_lang).toBe(true);
  });
});
