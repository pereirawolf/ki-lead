// VORÜBERGEHEND (Diagnose WebKit-Absturz, wird vor dem Zusammenführen entfernt)
import { expect, test } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen } from "./hilfen";

test.beforeEach(async ({ page }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await bereich(page, "Einstellungen");
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "Daten", exact: true }).click();
});

test("D1: Dateiauswahl ohne Schreiben, danach Neuladen durch den Test", async ({ page }) => {
  await page
    .locator('input[type="file"][aria-label="Sicherungsdatei wählen"]')
    .setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from("{kaputt") });
  await expect(page.getByText("kein gültiges JSON")).toBeVisible();
  await page.reload();
  await expect(page.locator(".kopf-ki")).toBeVisible();
});

test("D2: Neuladen aus der App ohne Dateiauswahl (Löschen)", async ({ page }) => {
  await page.getByRole("button", { name: "Alle Daten dieses Geräts löschen" }).click();
  await Promise.all([page.waitForEvent("load"), page.getByRole("dialog").getByRole("button", { name: "Alle Daten löschen" }).click()]);
  await expect(page.locator(".kopf-ki")).toBeVisible();
});

test("D3: leere gültige Sicherung einspielen, Neuladen aus der App", async ({ page }) => {
  const leer = JSON.stringify({ format: "ki-lead-sicherung/1", app: "x", erstellt: new Date().toISOString(), geraetespeicher: [], testlaeufe: [] });
  await page
    .locator('input[type="file"][aria-label="Sicherungsdatei wählen"]')
    .setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from(leer) });
  await Promise.all([page.waitForEvent("load"), page.getByRole("dialog").getByRole("button", { name: "Sicherung einspielen" }).click()]);
  await expect(page.locator(".kopf-ki")).toBeVisible();
});

test("D4: Beispiel im Lagebild laden, dann Neuladen durch den Test", async ({ page }) => {
  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.locator(".kopf-ki")).toBeVisible();
  await bereich(page, "Auswertung");
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
});

test("D5: Beispiel laden, sichern, ohne Löschen einspielen", async ({ page }) => {
  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
  await bereich(page, "Einstellungen");
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "Daten", exact: true }).click();
  const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Gerätestand sichern" }).click()]);
  const text = await (await import("node:fs/promises")).readFile((await d.path())!, "utf-8");
  await page
    .locator('input[type="file"][aria-label="Sicherungsdatei wählen"]')
    .setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from(text) });
  await Promise.all([page.waitForEvent("load"), page.getByRole("dialog").getByRole("button", { name: "Sicherung einspielen" }).click()]);
  await expect(page.locator(".kopf-ki")).toBeVisible();
});
