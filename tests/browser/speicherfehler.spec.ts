// Voller Gerätespeicher im echten Browser: IndexedDB lehnt das Schreiben des Zwischenstands ab. Die App meldet das
// sichtbar, arbeitet weiter und verliert die Eingabe im Fenster nicht.
import { expect, test } from "@playwright/test";
import { netzVorbereiten, oeffnen } from "./hilfen";

test("Schreibfehler beim Zwischenstand wird gemeldet, die Eingabe bleibt", async ({ page }) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, wert: any, schluessel?: IDBValidKey) {
      if (typeof schluessel === "string" && schluessel.startsWith("entwurf:")) throw new DOMException("Der Speicherplatz ist erschöpft.", "QuotaExceededError");
      return put.call(this, wert, schluessel);
    };
  });
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await page.getByLabel("Name der meldenden Stelle").fill("Stelle trotz vollem Speicher");

  const fehler = page.getByRole("alert").filter({ hasText: "Der Zwischenstand konnte nicht im Gerät gespeichert werden" });
  await expect(fehler).toBeVisible();
  await expect(fehler).toContainText("Bitte die Meldung als JSON sichern");
  await expect(page.getByLabel("Name der meldenden Stelle")).toHaveValue("Stelle trotz vollem Speicher");
  await expect(page.getByText(/Zwischenstand automatisch gesichert/)).toHaveCount(0);
});
