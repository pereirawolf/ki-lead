// KI-Symbol der Kopfleiste im echten Browser (seit 0.5.20): Eine laufende KI-Anfrage ist in jeder Ansicht sichtbar,
// das Symbol führt zur KI-Erfassung, nach S1 wartet es mit Punkt und nach dem Abbruch ruht es wieder.
import { expect, test } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen, S1_VORSCHLAG, schluesselSetzen } from "./hilfen";

test("KI-Symbol zeigt laufende Anfrage, Warten auf Bestätigung und Ruhe", async ({ page }) => {
  const netz = await netzVorbereiten(page, (nr) => (nr === 1 ? JSON.stringify(S1_VORSCHLAG) : "haengen"));
  await oeffnen(page);
  const symbol = page.locator(".kopf-ki");
  await expect(symbol).toHaveAttribute("data-zustand", "ruhe");

  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();

  // Nach S1 wartet die KI auf die Bestätigung: in einer anderen Ansicht mit Punkt
  await expect.poll(() => netz.ki.length).toBe(1);
  await bereich(page, "Lagebild");
  await expect(symbol).toHaveAttribute("data-zustand", "wartet");
  await expect(symbol.locator(".kopf-ki-punkt")).toBeVisible();

  await symbol.click();
  await page
    .getByRole("button", { name: /Entwurf erstellen|S2/ })
    .first()
    .click();
  await expect.poll(() => netz.ki.length).toBe(2);
  await bereich(page, "Meldung");
  await expect(symbol).toHaveAttribute("data-zustand", "laeuft");
  await expect(page.getByRole("button", { name: /^KI-Anfrage läuft: S2/ })).toBeVisible();

  await symbol.click();
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  // Endet die Anfrage in der KI-Erfassung, gilt das Ende als gesehen
  await expect(symbol).toHaveAttribute("data-zustand", "ruhe");
  await bereich(page, "Meldung");
  await expect(symbol).toHaveAttribute("data-zustand", "ruhe");
});
