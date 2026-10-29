// Sprungziele im echten Browser (seit 0.6.7, Rückmeldung des Herausgebers vom 29.10.2026): Nach „Weiter: …“ und
// „Zurück: …“ am Ende eines langen Schritts steht der Anfang des neuen Schritts unter dem Kopf der App, nicht das
// Seitenende; der Fokus liegt auf der neuen Überschrift. Breit (Schrittleiste links, mitlaufend) und 390 px
// (Schrittleiste waagerecht über dem Inhalt). Dazu der Wechsel der Ansicht über die Hauptnavigation.
import { expect, test, type Page } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen } from "./hilfen";

/** Abstand des Elements vom unteren Rand des Kopfs der App (Pixel; negativ: unter dem Kopf verdeckt) */
async function abstandZumKopf(page: Page, selektor: string): Promise<number> {
  return page.evaluate((sel) => {
    const kopf = document.querySelector(".kopf")!.getBoundingClientRect().bottom;
    return document.querySelector(sel)!.getBoundingClientRect().top - kopf;
  }, selektor);
}

/** Ans Seitenende scrollen; liefert die erreichte Scrollhöhe (0, wenn die Seite nicht länger als das Fenster ist) */
async function ansEnde(page: Page): Promise<number> {
  return page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    return window.scrollY;
  });
}

async function weiterOben(page: Page, knopf: RegExp, titel: string, ziel: string, { langerSchritt = true } = {}) {
  // Ausgangslage wie in der Rückmeldung: am Ende eines langen Schritts
  const y = await ansEnde(page);
  if (langerSchritt) expect(y, `Seitenende vor „${knopf.source}“`).toBeGreaterThan(200);
  await page.getByRole("button", { name: knopf }).click();
  const h2 = page.getByRole("heading", { level: 2, name: titel, exact: true });
  await expect(h2).toBeFocused();
  await expect(h2).toBeInViewport();
  const abstand = await abstandZumKopf(page, ziel);
  expect(abstand, `Anfang von ${ziel} nach „${titel}“`).toBeGreaterThanOrEqual(0);
  // Unter dem Kopf ausgerichtet; ein kurzer Schritt (etwa die Management Summary) lässt sich nicht so weit scrollen
  const amEnde = await page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1);
  if (!amEnde) expect(abstand, `Anfang von ${ziel} nach „${titel}“`).toBeLessThan(40);
}

for (const breite of [
  { name: "breit", viewport: { width: 1280, height: 800 } },
  { name: "390 px", viewport: { width: 390, height: 780 } },
]) {
  test(`Meldung (${breite.name}): „Weiter“ und „Zurück“ zeigen den Anfang des neuen Schritts`, async ({ page }) => {
    await page.setViewportSize(breite.viewport);
    await netzVorbereiten(page, () => "haengen");
    await oeffnen(page);
    const ziel = ".meldung .arbeitsbereich";
    await weiterOben(page, /^Weiter: Ereignisse\/Sachverhalte/, "Ereignisse/Sachverhalte", ziel);
    await weiterOben(page, /^Weiter: Quellen & Referenzen/, "Quellen & Referenzen", ziel);
    await weiterOben(page, /^Zurück: Ereignisse\/Sachverhalte/, "Ereignisse/Sachverhalte", ziel);
    await weiterOben(page, /^Weiter: Quellen & Referenzen/, "Quellen & Referenzen", ziel);
    await weiterOben(page, /^Weiter: Prüfen & Exportieren/, "Prüfen & Exportieren", ziel);
    await weiterOben(page, /^Weiter: Management Summary/, "Management Summary", ziel);
    await weiterOben(page, /^Zurück: Prüfen & Exportieren/, "Prüfen & Exportieren", ziel, { langerSchritt: breite.name === "390 px" });
    if (breite.name === "390 px") {
      // Schmal steht die Schrittleiste über dem Inhalt und bleibt nach dem Sprung im Bild
      await expect(page.getByRole("navigation", { name: "Schritte" })).toBeInViewport();
    }
  });
}

test("Hauptnavigation: neue Ansicht beginnt oben; die KI-Erfassung kehrt an die zuletzt gesehene Stelle zurück", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await bereich(page, "KI-Erfassung");
  const kiStelle = await ansEnde(page);
  expect(kiStelle).toBeGreaterThan(200);
  await bereich(page, "Einstellungen");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await ansEnde(page);
  await bereich(page, "KI-Erfassung");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(kiStelle);
  await bereich(page, "Erfassung");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
