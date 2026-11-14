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

test.describe("UX-2026-W46-02, -03: Smartphone", () => {
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

  test("UX-2026-W46-03: Randverlauf über den Reitern, solange dort weitere liegen", async ({ page }) => {
    await ilka(page);
    const ol = page.locator("nav.lb-reiter ol");
    await expect(ol).toHaveAttribute("data-rest-rechts", "");
    await expect(ol).not.toHaveAttribute("data-rest-links", "");
    expect(await ol.evaluate((e) => getComputedStyle(e).maskImage || getComputedStyle(e).webkitMaskImage)).toContain("linear-gradient");
    await ol.evaluate((e) => e.scrollTo({ left: e.scrollWidth }));
    await expect(ol).not.toHaveAttribute("data-rest-rechts", "");
    await expect(ol).toHaveAttribute("data-rest-links", "");
  });
});

test("UX-2026-W46-05: in der aufgeklappten Profilkarte ist keine innere Aufklappzeile größer als die äußere", async ({ page }) => {
  await oeffnen(page);
  await bereich(page, "Profile");
  const karte = page.locator("article.profil").first();
  await karte.locator("summary").first().click();
  const groessen = await karte.locator("summary").evaluateAll((s) => s.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  expect(groessen.length).toBeGreaterThan(3);
  expect(Math.max(...groessen.slice(1))).toBeLessThanOrEqual(groessen[0]!);
});
