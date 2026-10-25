// KI-Chip der Kopfleiste im echten Browser (seit 0.5.21): „KI offline“ in Ruhe, „KI online“ in jeder Ansicht,
// solange eine KI-Anfrage läuft; nach S1 (Anfrage beendet, Bestätigung offen) und nach dem Abbruch wieder offline.
import { expect, test } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen, S1_VORSCHLAG, schluesselSetzen } from "./hilfen";

test("KI-Chip wechselt zwischen „KI offline“ und „KI online“", async ({ page }) => {
  const netz = await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  const chip = page.locator(".kopf-ki");
  await expect(chip).toHaveText("KI offline");

  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
  await expect.poll(() => netz.ki.length).toBe(1);

  // Anfrage offen: in jeder Ansicht online
  await expect(chip).toHaveText("KI online");
  await bereich(page, "Lagebild");
  await expect(chip).toHaveText("KI online");
  await expect(page.getByRole("button", { name: /^KI online: Anfrage läuft, S1/ })).toBeVisible();

  await chip.click();
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(chip).toHaveText("KI offline");
});

test("Nach S1 ist die Anfrage beendet: KI offline, bis S2 startet", async ({ page }) => {
  const netz = await netzVorbereiten(page, (nr) => (nr === 1 ? JSON.stringify(S1_VORSCHLAG) : "haengen"));
  await oeffnen(page);
  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
  const chip = page.locator(".kopf-ki");
  await expect(page.getByRole("button", { name: /Entwurf erstellen|S2/ }).first()).toBeVisible();
  await expect(chip).toHaveText("KI offline");

  await page
    .getByRole("button", { name: /Entwurf erstellen|S2/ })
    .first()
    .click();
  await expect.poll(() => netz.ki.length).toBe(2);
  await expect(chip).toHaveText("KI online");
  await expect(chip).toHaveAttribute("aria-label", /S2 Recherche und Entwurf/);
});
