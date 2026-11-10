// Hinweisband der App-Familie (seit 0.7.15, Grunddesign 1.6, LD-R01, LD-R04) im echten Browser: Wortlaut ohne Umbruch
// nach der Kennung, Kopfbereich mitlaufend, einzeilig nach dem Scrollen ohne Flackern, stehende Leisten unter dem
// Kopfbereich, vollständig wieder am Seitenanfang.
import { expect, test, type Page } from "@playwright/test";
import { bereich, oeffnen } from "./hilfen";

const WORTLAUT = "Forschungsdemonstrator · Nur fiktive oder offen zugängliche Inhalte verwenden – keine personenbezogenen und keine eingestuften Daten.";

async function ilka(page: Page) {
  await oeffnen(page);
  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();
}

/** Oberkante der Zeile, in der die Kennung endet, und der Zeile, in der der Text beginnt */
const zeilen = (page: Page) =>
  page.locator(".kopfbereich > .hinweisband").evaluate((band) => {
    const kennung = band.querySelector("strong")!;
    const text = [...band.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim())!;
    const r = document.createRange();
    r.setStart(text, 0);
    r.setEnd(text, 3);
    const k = kennung.getClientRects();
    return { kennung: Math.round(k[k.length - 1]!.top), text: Math.round(r.getClientRects()[0]!.top) };
  });

const kompakt = (page: Page) => page.locator(".kopfbereich").evaluate((b) => b.classList.contains("kompakt"));

for (const breite of [390, 1280]) {
  test.describe(`${breite} px`, () => {
    test.use({ viewport: { width: breite, height: 844 } });

    test("Wortlaut als Hinweis, kein Umbruch nach der Kennung, Fläche in der tiefen Aktionsfarbe", async ({ page }) => {
      await oeffnen(page);
      const band = page.getByRole("note").filter({ hasText: "Forschungsdemonstrator" });
      await expect(band).toHaveCount(1);
      expect((await band.textContent())!.replace(/ /g, " ").replace(" · . ", " · ")).toBe(WORTLAUT);
      const z = await zeilen(page);
      expect(z.text).toBe(z.kennung);
      const farben = await band.evaluate((b) => {
        const s = getComputedStyle(b);
        const probe = document.createElement("div");
        probe.style.color = "var(--amt-tief)";
        document.body.append(probe);
        const tief = getComputedStyle(probe).color;
        probe.remove();
        return { flaeche: s.backgroundColor, tief };
      });
      expect(farben.flaeche).toBe(farben.tief);
    });

    test("nach dem Scrollen einzeilig, Reiter darunter, am Seitenanfang wieder vollständig", async ({ page }) => {
      await ilka(page);
      const band = page.locator(".kopfbereich > .hinweisband");
      const voll = (await band.boundingBox())!.height;
      await page.evaluate(() => window.scrollTo(0, 600));
      await expect.poll(() => kompakt(page)).toBe(true);
      await page.waitForTimeout(300);
      const eng = (await band.boundingBox())!.height;
      expect(eng).toBeLessThan(28);
      expect(eng).toBeLessThanOrEqual(voll);
      expect(await band.evaluate((b) => b.scrollWidth >= b.clientWidth && getComputedStyle(b).whiteSpace === "nowrap")).toBe(true);
      // Kopfbereich oben, Reiter der Auswertung direkt darunter
      const kopf = (await page.locator(".kopfbereich").boundingBox())!;
      expect(kopf.y).toBe(0);
      const leiste = (await page.locator("nav.lb-reiter").boundingBox())!;
      expect(Math.abs(leiste.y - (kopf.y + kopf.height))).toBeLessThan(3);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => kompakt(page)).toBe(false);
    });

    test("kein Flackern knapp über der Schwelle", async ({ page }) => {
      await ilka(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      const voll = (await page.locator(".kopfbereich > .hinweisband").boundingBox())!.height;
      const schwelle = Math.max(96, voll + 24) + 2;
      await page.evaluate((y) => window.scrollTo(0, y), schwelle);
      await expect.poll(() => kompakt(page)).toBe(true);
      // über mehrere Bilder stabil, Scrollposition über der Rückkehrschwelle
      const verlauf = await page.evaluate(
        () =>
          new Promise<{ kompakt: boolean; y: number }[]>((fertig) => {
            const v: { kompakt: boolean; y: number }[] = [];
            const bild = () => {
              v.push({ kompakt: document.querySelector(".kopfbereich")!.classList.contains("kompakt"), y: window.scrollY });
              if (v.length < 20) requestAnimationFrame(bild);
              else fertig(v);
            };
            requestAnimationFrame(bild);
          }),
      );
      expect(verlauf.every((b) => b.kompakt)).toBe(true);
      expect(Math.min(...verlauf.map((b) => b.y))).toBeGreaterThan(8);
    });
  });
}

test("Schrittleiste der Erfassung und Lagenradar stehen unter dem Kopfbereich (gemessene Höhe statt fester Werte)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await oeffnen(page);
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(() => kompakt(page)).toBe(true);
  await page.waitForTimeout(300);
  const kopf = (await page.locator(".kopfbereich").boundingBox())!.height;
  const oben = await page.locator(".meldung .schritte ol").evaluate((ol) => parseFloat(getComputedStyle(ol).top));
  expect(oben).toBeGreaterThanOrEqual(kopf);
  expect(oben).toBeLessThan(kopf + 20);
});
