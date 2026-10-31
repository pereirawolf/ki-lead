// Oberfläche nach der UX-Prüfung 2026-W44 (seit 0.6.20) im echten Browser: Startvoraussetzungen der KI-Erfassung
// (UX-2026-W44-02), Navigation auf dem Smartphone (-04), Bezeichnung zuerst (-07), kompakte Sachverhalte (-09).
import { expect, test } from "@playwright/test";
import { bereich, oeffnen, schluesselSetzen } from "./hilfen";

test("UX-2026-W44-02: gesperrter Start nennt die offenen Voraussetzungen und springt zu ihnen", async ({ page }) => {
  await oeffnen(page);
  await bereich(page, "KI-Erfassung");
  const start = page.getByRole("button", { name: "Gegenstand bestimmen (S1)" });
  await expect(start).toBeDisabled();
  const offen = page.locator(".start-offen");
  await expect(offen).toContainText("Untersuchungsgegenstand, Stichworte, Webseite oder Datei");
  await expect(offen).toContainText("Bestätigung zur Weitergabe der Inhalte");
  await expect(offen).toContainText("API-Schlüssel von Anthropic");
  await expect(start).toHaveAttribute("aria-describedby", /ki-start-offen/);

  await offen.getByRole("button", { name: "Zum Auftrag" }).click();
  await expect(page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse")).toBeFocused();
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await expect(offen).not.toContainText("Untersuchungsgegenstand");

  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await expect(start).toBeEnabled();
  await expect(page.locator(".start-offen")).toHaveCount(0);
});

test.describe("UX-2026-W44-04: Smartphone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("alle Bereiche der Hauptnavigation liegen vollständig im Bild", async ({ page }) => {
    await oeffnen(page);
    const knoepfe = page.locator(".hauptnav button");
    await expect(knoepfe).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const box = (await knoepfe.nth(i).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }
  });

  test("der aktive Schritt der Erfassung rückt in der Schrittleiste ins Bild", async ({ page }) => {
    await oeffnen(page);
    await page.getByRole("button", { name: /^Weiter:/ }).click();
    await page.getByRole("button", { name: /^Weiter:/ }).click();
    await page.getByRole("button", { name: /^Weiter:/ }).click();
    const aktiv = page.locator('.meldung .schritte [aria-current="step"]');
    await expect(aktiv).toContainText("Prüfen & Exportieren");
    const box = (await aktiv.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});

test("UX-2026-W44-07: erstes Feld eines neuen Sachverhalts ist die Bezeichnung", async ({ page }) => {
  await oeffnen(page);
  await page
    .getByRole("button", { name: /Sachverhalte/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Sachverhalt hinzufügen/ }).click();
  await expect(page.locator('[data-feld="sachverhalte/1/bezeichnung"] input')).toBeFocused();
  const felder = await page
    .locator('.liste > .element:nth-of-type(2) [data-feld^="sachverhalte/1/"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-feld")));
  expect(felder[0]).toBe("sachverhalte/1/bezeichnung");
});

test("UX-2026-W44-09: Beispiel Ilka – Reiter „Sachverhalte“ kompakt statt Volltexttabelle", async ({ page }) => {
  await oeffnen(page);
  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
  await page.locator(".lb-reiter").getByRole("button", { name: "Sachverhalte", exact: true }).click();
  await expect(page.locator(".lb-sv-zeile")).toHaveCount(8);
  const hoehe = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(hoehe).toBeLessThan(3000);
  await page.locator(".lb-svfilter select").first().selectOption({ label: "erheblich (5)" });
  await expect(page.locator(".lb-sv-zeile")).toHaveCount(5);
});
