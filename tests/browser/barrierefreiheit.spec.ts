// Barrierefreiheit im echten Browser: zugängliche Namen aller Bedienelemente (berechnet von Chromium),
// Bedienung der Navigation mit der Tastatur und sichtbarer Fokus, erzwungene Farben (Windows-Kontrastmodus).
import { expect, test, type Page } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen } from "./hilfen";

const BEREICHE = ["Meldung", "KI-Erfassung", "Lagebild", "Profile", "Einstellungen"] as const;
const ROLLEN = ["button", "textbox", "combobox", "checkbox", "radio", "spinbutton", "slider", "switch", "link", "searchbox", "listbox"];

/** Bedienelemente ohne zugänglichen Namen aus dem Barrierebaum, den Chromium berechnet */
async function ohneNamen(page: Page): Promise<string[]> {
  const baum = await page.locator("body").ariaSnapshot();
  const muster = new RegExp(`^\\s*- (${ROLLEN.join("|")})(?: \\[[^\\]]*\\])*:?\\s*$`);
  return baum.split("\n").filter((z) => muster.test(z));
}

test.beforeEach(async ({ page }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
});

for (const b of BEREICHE) {
  test(`${b}: alle Bedienelemente haben einen zugänglichen Namen`, async ({ page }) => {
    await bereich(page, b);
    if (b === "Lagebild") {
      await page.getByRole("button", { name: /Beispiel laden:/ }).click();
      await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
    }
    expect(await ohneNamen(page)).toEqual([]);
  });
}

test("Navigation mit der Tastatur: Fokus ist sichtbar, Eingabetaste wechselt den Bereich", async ({ page }) => {
  const ziel = page.getByRole("button", { name: "Lagebild", exact: true });
  let gefunden = false;
  for (let i = 0; i < 30 && !gefunden; i++) {
    await page.keyboard.press("Tab");
    gefunden = await ziel.evaluate((el) => el === document.activeElement);
  }
  expect(gefunden, "„Lagebild“ per Tab erreichbar").toBe(true);
  const fokus = await ziel.evaluate((el) => {
    const s = getComputedStyle(el);
    return { matches: el.matches(":focus-visible"), outline: s.outlineStyle, breite: parseFloat(s.outlineWidth), schatten: s.boxShadow };
  });
  expect(fokus.matches).toBe(true);
  expect((fokus.outline !== "none" && fokus.breite >= 2) || fokus.schatten !== "none", JSON.stringify(fokus)).toBe(true);

  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /Beispiel laden:/ })).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Gegenstand bestimmen (S1)" })).toBeVisible();
});

test("Erzwungene Farben: aktive Auswahl in Systemfarben, Marken mit Kontur", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await bereich(page, "Lagebild");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();

  const werte = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "forced-color-adjust:none;background:Highlight;color:HighlightText";
    document.body.appendChild(probe);
    const sys = getComputedStyle(probe);
    const nav = document.querySelector(".nav.aktiv")!;
    const n = getComputedStyle(nav);
    const marke = document.querySelector(".lb-marke, .lb-flag");
    const m = marke ? getComputedStyle(marke) : null;
    return {
      highlight: sys.backgroundColor,
      highlightText: sys.color,
      navHintergrund: n.backgroundColor,
      navText: n.color,
      markeKontur: m ? `${m.borderTopStyle} ${m.borderTopWidth}` : null,
    };
  });
  expect(werte.navHintergrund).toBe(werte.highlight);
  expect(werte.navText).toBe(werte.highlightText);
  expect(werte.markeKontur).toMatch(/^solid [1-9]/);
});
