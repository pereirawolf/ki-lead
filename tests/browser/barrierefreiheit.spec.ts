// Barrierefreiheit im echten Browser: zugängliche Namen aller Bedienelemente (berechnet von Chromium),
// Bedienung der Navigation mit der Tastatur und sichtbarer Fokus, erzwungene Farben (Windows-Kontrastmodus).
import { expect, test, type Page } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen, schluesselSetzen } from "./hilfen";

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

// Befunde KP-2026-W43-61, -62 und -64 (Prüfung der Eingabemaske vom 25.10.2026): Hilfetexte als zugängliche
// Beschreibung, nicht als Teil des Namens; sichtbarer Name der Stichtagsgruppe gleich dem zugänglichen
test("KI-Erfassung: Hilfetexte der Auftragsfelder sind zugängliche Beschreibungen (KP-2026-W43-61, -62, -64)", async ({ page }) => {
  await bereich(page, "KI-Erfassung");
  const gegenstand = page.getByRole("textbox", { name: "Untersuchungsgegenstand und Erkenntnisinteresse", exact: true });
  await expect(gegenstand).toHaveAccessibleDescription(/^Welche Lage oder welches Ereignis soll die KI-Recherche erfassen/);
  await expect(gegenstand).toHaveValue("");
  const ausgang = page.getByRole("textbox", { name: "Ausgangsinformationen und Stichworte", exact: true });
  await expect(ausgang).toHaveAccessibleDescription(/^Welche Informationen liegen bereits vor\?/);
  await expect(ausgang).toHaveValue("");
  await expect(page.getByRole("group", { name: "Stichtag der Meldung", exact: true })).toHaveAccessibleDescription(
    /^Für welchen Tag soll die Meldung gelten\?/,
  );
});

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

// Laufanzeige (seit 0.6.5): Die Uhr zählt sichtbar weiter, liegt aber in keiner Live-Region; angesagt werden nur der
// Wechsel der Stufe und neue Protokolleinträge über eine eigene Statusregion.
test("TP-2026-W44-12: während eines Laufs enthält keine Live-Region den Sekundenzähler", async ({ page }) => {
  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
  const zaehler = page.locator('[role="timer"]');
  await expect(zaehler).toHaveText(/^\d+ s$/);
  // Mindestens ein Takt der Uhr, damit ein angesagter Zähler auffiele
  await expect(zaehler).not.toHaveText("0 s");
  const live = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]')].map((el) => ({
      text: el.textContent || "",
      mitZaehler: !!el.querySelector('[role="timer"]'),
    })),
  );
  expect(live.filter((l) => l.mitZaehler)).toEqual([]);
  expect(live.filter((l) => /\b\d+ s\b/.test(l.text))).toEqual([]);
  expect(await zaehler.evaluate((el) => !!el.closest('[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]'))).toBe(false);
  // Die Statusregion nennt die Stufe
  await expect(page.locator('.laeuft [role="status"]')).toHaveText("Stufe S1: Gegenstand und SOP-Auswahl");
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
});
