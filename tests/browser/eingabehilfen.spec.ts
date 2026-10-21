// LEAD-Eingabehilfen im echten Browser: Bedienung mit der Tastatur, Fokus und Markierung im Textfeld, zugängliche
// Namen bei geöffneten Bereichen und keine Anfrage nach außen (Umsetzungsbeschreibung vom 21.10.2026, A02, A12).
import { expect, test } from "@playwright/test";
import { netzVorbereiten, oeffnen } from "./hilfen";

const ROLLEN = ["button", "textbox", "combobox", "checkbox", "radio", "link"];

test("Tastatur: Bereich öffnen, Vorlage einfügen, erste offene Stelle markiert; keine Anfrage nach außen", async ({ page }) => {
  const netz = await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await page.locator("nav.schritte button", { hasText: "Ereignisse/Sachverhalte" }).click();

  const summary = page.locator("summary", { hasText: "LEAD-Eingabehilfen: Lage & Ereignis, Ereignis/Sachverhalt 1" });
  await summary.focus();
  await page.keyboard.press("Enter");
  const knopf = page.getByRole("button", { name: "Kernaussage: einfügen in Lage & Ereignis, Ereignis/Sachverhalt 1" });
  await expect(knopf).toBeVisible();
  // Mit Tab zur ersten Vorlage, mit der Eingabetaste einfügen
  let gefunden = false;
  for (let i = 0; i < 6 && !gefunden; i++) {
    await page.keyboard.press("Tab");
    gefunden = await knopf.evaluate((el) => el === document.activeElement);
  }
  expect(gefunden, "Vorlage per Tab erreichbar").toBe(true);
  await page.keyboard.press("Enter");

  const feld = page.getByRole("textbox", { name: "Lage & Ereignis", exact: true }).first();
  await expect(feld).toBeFocused();
  const zustand = await feld.evaluate((el: HTMLTextAreaElement) => ({ wert: el.value, markiert: el.value.slice(el.selectionStart, el.selectionEnd) }));
  expect(zustand.wert.startsWith("Kernaussage: ⟦zentrale Aussage zur Lage⟧.")).toBe(true);
  expect(zustand.markiert).toBe("⟦zentrale Aussage zur Lage⟧");
  await expect(page.locator(".eingabehilfen-meldung").first()).toContainText("„Kernaussage:“ eingefügt");

  expect(netz.ki).toEqual([]);
  expect(netz.fremd).toEqual([]);
});

test("geöffnete Bereiche: alle Bedienelemente haben einen zugänglichen Namen", async ({ page }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await page.locator("nav.schritte button", { hasText: "Ereignisse/Sachverhalte" }).click();
  const bereiche = page.locator("details.eingabehilfen");
  await expect(bereiche).toHaveCount(5);
  for (const b of await bereiche.all()) await b.evaluate((el: HTMLDetailsElement) => (el.open = true));
  const baum = await page.locator("body").ariaSnapshot();
  const muster = new RegExp(`^\\s*- (${ROLLEN.join("|")})(?: \\[[^\\]]*\\])*:?\\s*$`);
  expect(baum.split("\n").filter((z) => muster.test(z))).toEqual([]);
  // Alle Vorlagen tragen Feld und Sachverhalt im Namen
  const namen = await page.locator("details.eingabehilfen button").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") || ""));
  expect(namen.length).toBe(22);
  for (const n of namen) expect(n).toMatch(/ einfügen in .+, Ereignis\/Sachverhalt 1$/);
});
