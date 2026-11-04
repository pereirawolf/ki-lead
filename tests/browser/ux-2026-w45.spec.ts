// Oberfläche nach der UX-Prüfung 2026-W45 (seit 0.7.9) im echten Browser: Ablage und Reiter auf dem Smartphone
// (UX-2026-W45-01, -03), mitlaufende Reiter (-03), Höhe von Kopiervorlage und Rohtabelle beim Beispiel Ilka (-23, -25).
import { expect, test } from "@playwright/test";
import { bereich, oeffnen } from "./hilfen";

async function ilka(page: import("@playwright/test").Page) {
  await oeffnen(page);
  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
}

test.describe("UX-2026-W45-01, -03: Smartphone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("nach dem Laden stehen die Reiter im ersten Bildschirm, einzeilig", async ({ page }) => {
    await ilka(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const leiste = page.locator("nav.lb-reiter");
    const box = (await leiste.boundingBox())!;
    expect(box.y + box.height).toBeLessThan(844);
    expect(box.height).toBeLessThan(60);
    // waagerecht scrollbar statt umzubrechen
    expect(await leiste.locator("ol").evaluate((ol) => ol.scrollWidth > ol.clientWidth)).toBe(true);
  });
});

test("UX-2026-W45-03: die Reiter bleiben beim Scrollen unter dem Kopf stehen", async ({ page }) => {
  await ilka(page);
  await page.locator(".lb-reiter").getByRole("button", { name: "Meldungen", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const kopf = (await page.locator(".kopf").boundingBox())!;
  const leiste = (await page.locator("nav.lb-reiter").boundingBox())!;
  expect(Math.abs(leiste.y - (kopf.y + kopf.height))).toBeLessThan(3);
});

test("UX-2026-W45-23, -25: Kopiervorlage und Rohtabelle beim Beispiel Ilka unter 3.000 px", async ({ page }) => {
  await ilka(page);
  for (const reiter of ["Kopiervorlage", "Rohtabelle"]) {
    await page.locator(".lb-reiter").getByRole("button", { name: reiter, exact: true }).click();
    const hoehe = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(hoehe, reiter).toBeLessThan(3000);
  }
});
