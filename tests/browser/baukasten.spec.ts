// Baukasten „Neue Zeile zusammenstellen“ im Zeitstrahl (seit 0.6.11, Rückmeldung des Herausgebers vom 30.10.2026):
// Zwischen „Kurztext mit Beleg“ und „Vorschau“ stand eine Lücke von rund 260 px. Ursache war `flex: 1 1 20rem` an
// `.quellen-lagemeldung`: In einer Zeile (`.quellen-reihe`) ist das eine Breite, direkt im Baukasten (Spalte) die Höhe.
// Geprüft wird jedes Feld direkt im Baukasten: Es endet mit seinem Eingabefeld, die Vorschau folgt mit dem Abstand
// des Baukastens. Breit und 390 px.
import { expect, test } from "@playwright/test";
import { netzVorbereiten, oeffnen } from "./hilfen";

for (const breite of [
  { name: "breit", viewport: { width: 1280, height: 800 } },
  { name: "390 px", viewport: { width: 390, height: 780 } },
]) {
  test(`Zeitstrahl (${breite.name}): Felder im Baukasten ohne Lücke bis zur Vorschau`, async ({ page }) => {
    await page.setViewportSize(breite.viewport);
    await netzVorbereiten(page, () => "haengen");
    await oeffnen(page);
    await page.getByRole("button", { name: /^Weiter: Ereignisse\/Sachverhalte/ }).click();
    await page.getByRole("button", { name: /^Weiter: Quellen & Referenzen/ }).click();
    await expect(page.getByText("Kurztext mit Beleg", { exact: true })).toBeVisible();
    const felder = await page.evaluate(() =>
      [...document.querySelectorAll(".quellen-baukasten > .quellen-lagemeldung")].map((feld) => {
        const rahmen = feld.getBoundingClientRect();
        const eingabe = feld.querySelector("input, select")!.getBoundingClientRect();
        const vorschau = feld.parentElement!.querySelector(".quellen-vorschau")!.getBoundingClientRect();
        return {
          titel: feld.querySelector(".quellen-reihe-titel")?.textContent ?? "",
          ueberstand: Math.round(rahmen.bottom - eingabe.bottom),
          abstandVorschau: Math.round(vorschau.top - eingabe.bottom),
        };
      }),
    );
    expect(felder.map((f) => f.titel)).toContain("Kurztext mit Beleg");
    for (const f of felder) {
      expect(f.ueberstand, `Raum unter dem Eingabefeld „${f.titel}“`).toBeLessThanOrEqual(2);
      expect(f.abstandVorschau, `Abstand „${f.titel}“ bis zur Vorschau`).toBeLessThan(40);
    }
  });
}
