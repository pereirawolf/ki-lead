// Statusbereich der Kopfleiste im echten Browser (seit 0.5.20): Ein laufender KI-Lauf bleibt in jeder Ansicht
// sichtbar, führt zurück zur KI-Erfassung und meldet nach dem Abbruch außerhalb der Erfassung sein Ende.
import { expect, test } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen, schluesselSetzen } from "./hilfen";

test("Kopfleiste zeigt den KI-Lauf in allen Ansichten und das Laufende", async ({ page }, info) => {
  const netz = await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  const kopf = page.locator(".kopf");
  await expect(kopf.locator(".kopf-marke.entwurf")).toHaveText("Entwurf");

  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
  await expect.poll(() => netz.ki.length).toBe(1);

  const lauf = kopf.locator(".kopf-lauf.laeuft");
  await expect(lauf.locator(".kopf-stufe.aktuell")).toHaveText("S1");
  await bereich(page, "Lagebild");
  await expect(lauf).toBeVisible();
  await expect(lauf.locator(".kopf-lauf-zeit")).toHaveText(/^\d+ s$/);
  await page.screenshot({ path: info.outputPath("kopf-lauf.png"), clip: { x: 0, y: 0, width: 1280, height: 80 } });

  await lauf.click();
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Von der Person abgebrochen." })).toBeVisible();
  // In der KI-Erfassung steht das Ende schon; die Kopfleiste meldet es dort nicht zusätzlich
  await expect(kopf.locator(".kopf-lauf")).toHaveCount(0);
  await bereich(page, "Meldung");
  await expect(kopf.locator(".kopf-lauf")).toHaveCount(0);
});
