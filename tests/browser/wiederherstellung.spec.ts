// Wiederherstellung im echten Browser (IndexedDB): Der automatisch gesicherte Zwischenstand übersteht ein Neuladen.
import { expect, test } from "@playwright/test";
import { netzVorbereiten, oeffnen } from "./hilfen";

test("Zwischenstand übersteht ein Neuladen der Seite", async ({ page }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await page.getByLabel("Name der meldenden Stelle").fill("Stelle vor dem Neuladen");
  await expect(page.getByText(/Zwischenstand automatisch gesichert/)).toBeVisible();

  await page.reload();
  await expect(page.locator(".chip-name")).toBeVisible();
  await expect(page.getByLabel("Name der meldenden Stelle")).toHaveValue("Stelle vor dem Neuladen");
  await expect(page.getByText(/Zwischenstand automatisch gesichert/)).toBeVisible();
});
