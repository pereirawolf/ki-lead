// Abbruch eines laufenden KI-Aufrufs im echten Browser: Der Lauf endet sofort, gilt als abgebrochen, lässt sich
// protokollieren und wird nicht neu angefragt.
import { expect, test } from "@playwright/test";
import { bereich, downloadText, netzVorbereiten, oeffnen, SCHLUESSEL, schluesselSetzen } from "./hilfen";

test("Abbrechen während S1 beendet den Lauf ohne neue Anfrage", async ({ page }) => {
  const netz = await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Sachverhalt und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();

  await expect.poll(() => netz.ki.length).toBe(1);
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();

  const meldung = page.getByRole("alert").filter({ hasText: "Von der Person abgebrochen." });
  await expect(meldung).toBeVisible();
  const [protokoll] = await Promise.all([
    page.waitForEvent("download"),
    meldung.getByRole("button", { name: "Laufprotokoll des abgebrochenen Laufs exportieren" }).click(),
  ]);
  const inhalt = await downloadText(protokoll);
  expect(JSON.parse(inhalt).status).toBe("abgebrochen");
  expect(inhalt).not.toContain(SCHLUESSEL);

  // Keine Wiederholung nach dem Abbruch
  await page.waitForTimeout(500);
  expect(netz.ki).toHaveLength(1);
  expect(netz.fremd).toEqual([]);
});
