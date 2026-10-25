// Hauptablauf im echten Browser: Meldung als Datei sichern und wieder öffnen, Schritt Management Summary, Lagebild mit Beispiel und
// Redaktionscheck, KI-Erfassung S1 mit simuliertem Anbieter bis zur Bestätigung.
import { expect, test } from "@playwright/test";
import { bereich, downloadText, netzVorbereiten, oeffnen, S1_VORSCHLAG, SCHLUESSEL, schluesselSetzen } from "./hilfen";

test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
});

test("Meldung: Entwurf als JSON speichern und die heruntergeladene Datei wieder öffnen", async ({ page }) => {
  const netz = await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await page.getByLabel("Name der meldenden Stelle").fill("Teststelle Browser");
  await page.getByRole("button", { name: /Prüfen & Exportieren/ }).click();

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Entwurf als JSON speichern" }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  const text = await downloadText(download);
  const meldung = JSON.parse(text);
  expect(meldung.meldende_stelle).toBe("Teststelle Browser");
  expect(meldung.schema).toMatch(/^LEAD-Meldung/);

  await page.getByRole("button", { name: "Neue Meldung" }).click();
  await page.getByRole("button", { name: /Meldungsmetadaten/ }).click();
  // Neue Meldung: Vorgabe des Profils statt der eigenen Eingabe
  await expect(page.getByLabel("Name der meldenden Stelle")).not.toHaveValue("Teststelle Browser");

  // Dieselbe Datei, die der Browser heruntergeladen hat
  await page.locator('.werkzeugleiste input[type="file"]').setInputFiles((await download.path())!);
  await expect(page.getByLabel("Name der meldenden Stelle")).toHaveValue("Teststelle Browser");
  expect(netz.ki).toHaveLength(0);
  expect(netz.fremd).toEqual([]);
});

test("Meldung: fünfter Schritt „Management Summary“ nach „Prüfen & Exportieren“ (seit 0.5.17), Feldauszug ohne KI", async ({ page }) => {
  const netz = await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  const schritte = page.getByRole("navigation", { name: "Schritte" }).getByRole("button");
  await expect(schritte).toHaveCount(5);
  await expect(schritte.last()).toHaveText(/Management Summary/);
  await page
    .getByRole("button", { name: /Prüfen & Exportieren/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Final als JSON exportieren" })).toBeVisible();
  await expect(page.getByText("Feldauszug ohne KI")).toHaveCount(0);
  await page.getByRole("button", { name: "Weiter: Management Summary" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Management Summary" })).toBeVisible();
  await page.getByText("Feldauszug ohne KI").click();
  const [txt] = await Promise.all([page.waitForEvent("download"), page.locator("details.summary").getByRole("button", { name: "Als TXT speichern" }).click()]);
  expect(txt.suggestedFilename()).toMatch(/_Feldauszug\.txt$/);
  expect(netz.ki).toHaveLength(0);
  expect(netz.fremd).toEqual([]);
});

test("Lagebild: Beispiel laden, Redaktionscheck öffnen und PDF erzeugen", async ({ page }) => {
  const netz = await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await bereich(page, "Lagebild");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();

  await page.getByRole("button", { name: /^Redaktionscheck/ }).click();
  await expect(page.locator(".lb-redaktion")).toBeVisible();

  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Lagebild als PDF" }).click()]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  expect((await downloadText(pdf)).startsWith("%PDF-")).toBe(true);
  expect(netz.fremd).toEqual([]);
});

test("KI-Erfassung: S1 mit simuliertem Anbieter bis zur Bestätigung, Protokoll ohne Schlüssel", async ({ page }) => {
  const netz = await netzVorbereiten(page, () => JSON.stringify(S1_VORSCHLAG));
  await oeffnen(page);
  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();

  await expect(page.getByRole("heading", { name: "Gegenstand bestätigen" })).toBeVisible();
  expect(netz.ki).toHaveLength(1);
  expect(netz.ki[0].schluessel).toBe(SCHLUESSEL);
  expect(netz.ki[0].koerper.model).toBe("claude-haiku-5-5");

  const [protokoll] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Laufprotokoll exportieren (S1)" }).click()]);
  const inhalt = await downloadText(protokoll);
  expect(JSON.parse(inhalt).status).toBe("bestaetigen");
  expect(inhalt).not.toContain(SCHLUESSEL);
  expect(netz.fremd).toEqual([]);
});
