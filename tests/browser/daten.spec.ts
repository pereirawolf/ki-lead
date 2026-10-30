// Bereich „Daten“ (seit 0.6.13) im echten Browser mit echter IndexedDB: Gerätestand sichern, alle Daten löschen,
// Sicherung wieder einspielen. Grundlage: Befunddatei ki-lead-befund_technik_2026-W44-A3.json vom 30.10.2026
// (Arbeitspaket A3), TP-2026-W44-44 und TP-2026-W44-45.
import { expect, test } from "@playwright/test";
import { bereich, downloadText, netzVorbereiten, oeffnen, SCHLUESSEL, schluesselSetzen } from "./hilfen";

test.beforeEach(async ({ page }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
});

const daten = async (page: import("@playwright/test").Page) => {
  await bereich(page, "Einstellungen");
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "Daten", exact: true }).click();
};

test("TP-2026-W44-44/-45: sichern ohne Schlüssel, alles löschen, Sicherung einspielen", async ({ page }) => {
  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
  await schluesselSetzen(page);
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "Übersicht", exact: true }).click();
  await expect(page.getByRole("row", { name: /^Anthropic hinterlegt/ })).toBeVisible();

  // Sichern: Lagebild enthalten, Schlüssel nicht
  await daten(page);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Gerätestand sichern" }).click()]);
  expect(download.suggestedFilename()).toMatch(/KI-LEAD_Sicherung\.json$/);
  const text = await downloadText(download);
  const s = JSON.parse(text);
  expect(s.format).toBe("ki-lead-sicherung/1");
  expect(s.geraetespeicher.some(([k]: [string]) => k.startsWith("lagebild:"))).toBe(true);
  expect(text).not.toContain(SCHLUESSEL);
  expect(s.geraetespeicher.some(([k]: [string]) => k.startsWith("schluessel"))).toBe(false);

  // Alles löschen: nach dem Neustart kein Lagebild und kein Schlüssel
  // Die App lädt nach dem Löschen neu; erst nach dem Neuladen weiterprüfen (in WebKit dauert das Leeren länger,
  // ohne Warten liefen die folgenden Schritte noch in der alten Seite)
  await page.getByRole("button", { name: "Alle Daten dieses Geräts löschen" }).click();
  await Promise.all([page.waitForEvent("load"), page.getByRole("dialog").getByRole("button", { name: "Alle Daten löschen" }).click()]);
  await expect(page.locator(".kopf-ki")).toBeVisible();
  await bereich(page, "Auswertung");
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toHaveCount(0);
  await bereich(page, "Einstellungen");
  await expect(page.getByRole("row", { name: /^Anthropic hinterlegt/ })).toHaveCount(0);

  // Einspielen: Lagebild zurück, Schlüssel bleibt weg
  await daten(page);
  await page
    .locator('input[type="file"][aria-label="Sicherungsdatei wählen"]')
    .setInputFiles({ name: "sicherung.json", mimeType: "application/json", buffer: Buffer.from(text) });
  await Promise.all([page.waitForEvent("load"), page.getByRole("dialog").getByRole("button", { name: "Sicherung einspielen" }).click()]);
  await expect(page.locator(".kopf-ki")).toBeVisible();
  await bereich(page, "Auswertung");
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
  await bereich(page, "Einstellungen");
  await expect(page.getByRole("row", { name: /^Anthropic hinterlegt/ })).toHaveCount(0);
});
