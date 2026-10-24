// Einstellungen in Bereichen (seit 0.5.6) im echten Browser: zugängliche Namen in jedem Bereich, Bedienung mit der
// Tastatur, schmale Ansicht (Smartphone) mit waagerechter Bereichsleiste ohne seitliches Scrollen der Seite,
// Bereich bleibt beim Wechsel der Ansicht erhalten, Schlüssel bleibt nach dem Neuladen am bisherigen Ort.
import { expect, test } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen } from "./hilfen";

const BEREICHE = ["Übersicht", "KI-Anbieter & API", "Modelle & Verarbeitung", "Recherche & Grenzen", "Darstellung", "Über KI-LEAD"];
const ROLLEN = ["button", "textbox", "combobox", "checkbox", "radio", "spinbutton", "slider", "switch", "link", "searchbox", "listbox"];

test.beforeEach(async ({ page }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await bereich(page, "Einstellungen");
});

const leiste = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: "Bereiche der Einstellungen" });

test("jeder Bereich: genau eine Bereichsüberschrift, alle Bedienelemente mit zugänglichem Namen", async ({ page }) => {
  const muster = new RegExp(`^\\s*- (${ROLLEN.join("|")})(?: \\[[^\\]]*\\])*:?\\s*$`);
  for (const b of BEREICHE) {
    await leiste(page).getByRole("button", { name: b, exact: true }).click();
    await expect(page.locator(".bereich-inhalt h2")).toHaveText([b]);
    await expect(leiste(page).getByRole("button", { name: b, exact: true })).toHaveAttribute("aria-current", "true");
    const baum = await page.locator("body").ariaSnapshot();
    expect(
      baum.split("\n").filter((z) => muster.test(z)),
      b,
    ).toEqual([]);
  }
});

test("Tastatur: Bereich per Tab erreichen und mit Eingabetaste bzw. Leertaste wechseln", async ({ page }) => {
  const ziel = leiste(page).getByRole("button", { name: "Modelle & Verarbeitung", exact: true });
  let gefunden = false;
  for (let i = 0; i < 40 && !gefunden; i++) {
    await page.keyboard.press("Tab");
    gefunden = await ziel.evaluate((el) => el === document.activeElement);
  }
  expect(gefunden, "„Modelle & Verarbeitung“ per Tab erreichbar").toBe(true);
  expect(await ziel.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.locator(".bereich-inhalt h2")).toHaveText(["Modelle & Verarbeitung"]);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page.locator(".bereich-inhalt h2")).toHaveText(["Recherche & Grenzen"]);
});

test("Smartphone: Bereichsleiste waagerecht über dem Inhalt, Seite ohne seitliches Scrollen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const b of BEREICHE) {
    await leiste(page).getByRole("button", { name: b, exact: true }).click();
    const masse = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Bereiche der Einstellungen"]')!.getBoundingClientRect();
      const inhalt = document.querySelector(".bereich-inhalt")!.getBoundingClientRect();
      const knoepfe = [...document.querySelectorAll('nav[aria-label="Bereiche der Einstellungen"] button')].map((k) => k.getBoundingClientRect().top);
      return {
        navOben: nav.bottom <= inhalt.top + 1,
        eineZeile: Math.max(...knoepfe) - Math.min(...knoepfe) < 2,
        seiteBreiter: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    expect(masse, b).toEqual({ navOben: true, eineZeile: true, seiteBreiter: false });
  }
});

test("der gewählte Bereich bleibt beim Wechsel der Ansicht erhalten", async ({ page }) => {
  await leiste(page).getByRole("button", { name: "Recherche & Grenzen", exact: true }).click();
  await bereich(page, "Lagebild");
  await bereich(page, "Einstellungen");
  await expect(page.locator(".bereich-inhalt h2")).toHaveText(["Recherche & Grenzen"]);
});

test("Mistral-Schlüssel: Speichern, Übersicht zeigt ihn als hinterlegt, nach dem Neuladen noch da", async ({ page }) => {
  await leiste(page).getByRole("button", { name: "KI-Anbieter & API", exact: true }).click();
  const feld = page.getByLabel("API-Schlüssel Mistral");
  await feld.fill("mistral-TEST-NICHT-EXPORTIEREN");
  await feld.locator("xpath=ancestor::section[1]").getByRole("button", { name: "Speichern" }).click();
  await leiste(page).getByRole("button", { name: "Übersicht", exact: true }).click();
  await expect(page.getByRole("row", { name: /^Mistral hinterlegt/ })).toBeVisible();
  await page.reload();
  await bereich(page, "Einstellungen");
  await expect(page.getByRole("row", { name: /^Mistral hinterlegt/ })).toBeVisible();
});
