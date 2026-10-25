// PWA im echten Browser: Service Worker übernimmt die Seite, die App startet danach ohne Netz, Lagebild und
// Beispieldaten funktionieren offline, der Hinweis zum fehlenden Netz erscheint. Hier ist der Service Worker
// ausdrücklich zugelassen (sonst in allen Browsertests gesperrt, siehe playwright.config.ts).
import { expect, test } from "@playwright/test";
import { bereich } from "./hilfen";

test.use({ serviceWorkers: "allow" });

test("Offline-Start: nach dem ersten Besuch läuft die App ohne Netz", async ({ page, context }) => {
  // Nur der lokale Server; jede Anfrage nach außen würde den Test verfälschen
  const fremd: string[] = [];
  await context.route(
    (url) => url.hostname !== "localhost",
    (route) => {
      fremd.push(route.request().url());
      return route.abort();
    },
  );

  await page.goto("./");
  await expect(page.locator(".kopf-ki")).toBeVisible();
  // Warten, bis der Service Worker installiert ist und die Seite steuert
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener("controllerchange", r, { once: true }));
  });
  const version = await page.evaluate(
    () =>
      new Promise<string>((r) => {
        const kanal = new MessageChannel();
        kanal.port1.onmessage = (e) => r(e.data);
        navigator.serviceWorker.controller!.postMessage("version", [kanal.port2]);
      }),
  );
  expect(version).toMatch(/^\d+\.\d+\.\d+-[0-9a-f]{8}$/);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".kopf-ki")).toBeVisible();
  await expect(page.getByText(/Ohne Netzverbindung/)).toBeVisible();

  await bereich(page, "Lagebild");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();

  // Nachgeladener Teil (PDF) kommt ebenfalls aus dem Cache
  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Lagebild als PDF" }).click()]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);

  await context.setOffline(false);
  await expect(page.getByText(/Ohne Netzverbindung/)).toBeHidden();
  expect(fremd).toEqual([]);
});

test("Manifest und Symbole werden ausgeliefert", async ({ request }) => {
  const antwort = await request.get("./manifest.webmanifest");
  expect(antwort.ok()).toBe(true);
  const manifest = await antwort.json();
  for (const symbol of manifest.icons) expect((await request.get(`./${symbol.src}`)).ok(), symbol.src).toBe(true);
  const sw = await request.get("./sw.js");
  expect(sw.ok()).toBe(true);
  expect(await sw.text()).toContain('"index.html"');
});
