// Oberfläche nach der UX-Prüfung 2026-W46 (seit 0.7.21) im echten Browser: mitlaufender Bereich auf dem Smartphone
// (UX-2026-W46-02), Randverlauf der Reiterleiste (-03), Kacheln der gemeldeten Stellen (-07).
import { expect, test } from "@playwright/test";
import { bereich, oeffnen } from "./hilfen";

async function ilka(page: import("@playwright/test").Page) {
  await oeffnen(page);
  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
}

test.describe("UX-2026-W46-02: Smartphone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("UX-2026-W46-02: nach dem Scrollen belegt der mitlaufende Bereich höchstens 230 px, die Reiter scrollen mit", async ({ page }) => {
    await ilka(page);
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(400); // Hinweisband wird nach dem Scrollen schmaler (LD-R04)
    const kopf = (await page.locator(".kopfbereich").boundingBox())!;
    expect(kopf.y).toBeLessThan(1);
    expect(kopf.y + kopf.height).toBeLessThanOrEqual(230);
    const reiter = (await page.locator("nav.lb-reiter").boundingBox())!;
    expect(reiter.y + reiter.height).toBeLessThanOrEqual(0);
    // alle fünf Bereiche der Hauptnavigation bleiben erreichbar (LD-N05)
    for (const name of ["Erfassung", "KI-Erfassung", "Auswertung", "Profile", "Einstellungen"]) {
      await expect(page.locator(".hauptnav").getByRole("button", { name, exact: true })).toBeInViewport({ ratio: 1 });
    }
  });
});
