// Playwright 1.56.1/WebKit stürzte nach history.pushState() beim zweiten Neuladen ab.
// Regressionstest zu PR #113 und microsoft/playwright#37766: keine Löschung, Sicherung oder KI-Aufrufe.
import { expect, test } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen } from "./hilfen";

test("Ansichtswechsel und wiederholtes Neuladen erhalten die Navigation", async ({ page }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await bereich(page, "Einstellungen");
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "Daten", exact: true }).click();
  await expect(page).toHaveURL(/#\/einstellungen\/daten$/);

  for (let i = 0; i < 3; i++) {
    await page.reload();
    await expect(page.locator(".kopf-ki")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Daten", exact: true })).toBeVisible();
    await expect(page).toHaveURL(/#\/einstellungen\/daten$/);
  }
});
