// PWA im echten Browser: Service Worker übernimmt die Seite, die App startet danach ohne Netz, Lagebild und
// Beispieldaten funktionieren offline, der Hinweis zum fehlenden Netz erscheint. Hier ist der Service Worker
// ausdrücklich zugelassen (sonst in allen Browsertests gesperrt, siehe playwright.config.ts).
import { expect, test } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen, schluesselSetzen } from "./hilfen";

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

  await bereich(page, "Auswertung");
  await page.getByRole("button", { name: /Beispiel laden:/ }).click();
  await expect(page.getByText("7 Meldungen · 8 Sachverhalte")).toBeVisible();

  // Nachgeladener Teil (PDF) kommt ebenfalls aus dem Cache
  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Lagebild als PDF" }).click()]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);

  await context.setOffline(false);
  await expect(page.getByText(/Ohne Netzverbindung/)).toBeHidden();
  expect(fremd).toEqual([]);
});

// Ohne Netz (seit 0.6.5): Ein KI-Lauf startet nicht erst, um dann mit einem Verbindungsabbruch zu scheitern
test("TP-2026-W44-20: ohne Netz ist der Start der KI-Erfassung gesperrt, mit Hinweis", async ({ page, context }) => {
  await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  const start = page.getByRole("button", { name: "Gegenstand bestimmen (S1)" });
  await expect(start).toBeEnabled();

  await context.setOffline(true);
  await expect(start).toBeDisabled();
  const hinweis = page.locator(".ki").getByRole("status").filter({ hasText: "Keine Netzverbindung" });
  await expect(hinweis).toBeVisible();
  await expect(start).toHaveAccessibleDescription(/Keine Netzverbindung/);

  await context.setOffline(false);
  await expect(start).toBeEnabled();
  await expect(hinweis).toHaveCount(0);
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
