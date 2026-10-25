// PWA: Versionswechsel mit bestehendem Cache (Startfehler nach 0.5.1, behoben in 0.5.2), Wiederherstellung aus dem
// defekten Zustand, keine ungefragte Übernahme oder Neuladen offener Fenster, Installationsschutz, Reparaturseite und
// Startprüfung. Die Fassungen werden aus dem aktuellen Build
// abgeleitet und wie GitHub Pages ausgeliefert (Cache-Control max-age=600). Nur Chromium; Safari/WebKit ist hier
// nicht geprüft.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { bereich } from "./hilfen";
import { fassung, pagesServer, type Fassung, type PagesServer } from "./pwa-server";

test.use({ serviceWorkers: "allow" });

let server: PagesServer;
test.beforeEach(async () => {
  server = await pagesServer();
});
test.afterEach(async () => {
  await server.schliessen();
});

const gestartet = (page: Page, ms = 10_000) =>
  page
    .locator(".kopf-ki")
    .waitFor({ timeout: ms })
    .then(
      () => true,
      () => false,
    );

/** Startdatei, die die angezeigte index.html lädt */
const startdatei = (page: Page) => page.evaluate(() => document.querySelector('script[type="module"]')?.getAttribute("src")?.replace("./assets/", ""));

/** Ersten Besuch abschließen: Service Worker installiert und steuert die Seite */
async function erstbesuch(page: Page): Promise<void> {
  await page.goto(server.url);
  expect(await gestartet(page)).toBe(true);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener("controllerchange", r, { once: true }));
  });
}

/** Neue Fassung veröffentlichen, neu laden (alter Service Worker steuert noch) und auf die Installation warten */
async function aktualisieren(page: Page, f: Fassung): Promise<void> {
  server.veroeffentlichen(f);
  await page.reload();
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update().catch(() => undefined);
    // warten, bis die Installation abgeschlossen oder gescheitert ist
    for (let i = 0; i < 100 && reg?.installing; i++) await new Promise((r) => setTimeout(r, 100));
  });
  await page.waitForTimeout(500);
}

/** HTTP-Cache leeren (wie Ablauf von max-age), alle Fenster schließen und neu öffnen; Cache Storage und IndexedDB bleiben */
async function neustart(context: BrowserContext, page: Page): Promise<Page> {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.clearBrowserCache");
  await page.close();
  const neu = await context.newPage();
  await neu.goto(server.url);
  return neu;
}

const testdatenSchreiben = (page: Page) =>
  page.evaluate(() =>
    new Promise<void>((ok, nein) => {
      const r = indexedDB.open("keyval-store");
      r.onupgradeneeded = () => r.result.createObjectStore("keyval");
      r.onsuccess = () => {
        const tx = r.result.transaction("keyval", "readwrite");
        tx.objectStore("keyval").put({ text: "Testmeldung" }, "testdaten:erhalt");
        tx.oncomplete = () => ok();
        tx.onerror = () => nein(tx.error);
      };
    }).then(() => caches.open("fremde-anwendung").then((c) => c.put("/fremd.txt", new Response("fremd")))),
  );

const testdatenLesen = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<unknown>((ok) => {
        const r = indexedDB.open("keyval-store");
        r.onsuccess = () => {
          const g = r.result.transaction("keyval").objectStore("keyval").get("testdaten:erhalt");
          g.onsuccess = () => ok(g.result ?? null);
        };
      }),
  );

test("Vorher (Service Worker 0.5.1): Update bei gültigem HTTP-Cache führt nach dessen Ablauf zum leeren Start", async ({ context, page }) => {
  const a = fassung(server.wurzel, "a", { sw: "0.5.1" });
  const b = fassung(server.wurzel, "b", { sw: "0.5.1", endung: "B" });
  server.veroeffentlichen(a);
  await erstbesuch(page);
  await aktualisieren(page, b);
  const neu = await neustart(context, page);
  // Die neue Fassung steuert, aber mit der alten index.html; deren Startdatei gibt es nicht mehr
  expect(await gestartet(neu, 4000)).toBe(false);
  expect(await startdatei(neu)).toBe(a.start);
  expect(server.protokoll()).toContain(`404 /ki-lead/assets/${a.start}`);
});

test("Ursache behoben: Update hält index.html und Programmdateien stimmig, Start nach Ablauf des HTTP-Caches und offline", async ({ context, page }) => {
  const a = fassung(server.wurzel, "a");
  const b = fassung(server.wurzel, "b", { endung: "B" });
  server.veroeffentlichen(a);
  await erstbesuch(page);
  await aktualisieren(page, b);
  const neu = await neustart(context, page);
  expect(await gestartet(neu)).toBe(true);
  expect(await startdatei(neu)).toBe(b.start);
  // erneuter Start und Offline-Start der neuen Fassung
  await neu.reload();
  expect(await gestartet(neu)).toBe(true);
  await context.setOffline(true);
  await neu.reload();
  expect(await gestartet(neu)).toBe(true);
  await context.setOffline(false);
});

test("Installationsschutz: liefert der Server eine fremde index.html, bleibt die bisherige Fassung", async ({ context, page }) => {
  const a = fassung(server.wurzel, "a");
  // Kurz nach einer Veröffentlichung: neuer Service Worker und neue Dateien, aber noch die alte index.html
  const halb = fassung(server.wurzel, "halb", { endung: "B", indexVon: a });
  server.veroeffentlichen(a);
  await erstbesuch(page);
  await aktualisieren(page, halb);
  const namen: string[] = await page.evaluate(() => caches.keys());
  expect(namen.filter((n) => n.startsWith("ki-lead-"))).toHaveLength(1);
  const neu = await neustart(context, page);
  expect(await gestartet(neu)).toBe(true);
  expect(await startdatei(neu)).toBe(a.start);
});

/** Auf eine Aktualisierung prüfen und warten, bis eine Installation abgeschlossen oder gescheitert ist (ohne Neuladen) */
const updatePruefen = (page: Page) =>
  page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update().catch(() => undefined);
    for (let i = 0; i < 100 && reg?.installing; i++) await new Promise((r) => setTimeout(r, 100));
    return { wartet: !!reg?.waiting, aktiv: reg?.active?.scriptURL ?? null };
  });

/** Zählt Navigationen des Hauptrahmens (Neuladen) ab jetzt */
function navigationenZaehlen(page: Page): () => number {
  let n = 0;
  page.on("framenavigated", (f) => f === page.mainFrame() && n++);
  return () => n;
}

test("Wiederherstellung aus dem defekten 0.5.1-Zustand: Korrektur veröffentlichen, Fenster schließen und neu öffnen; Daten bleiben", async ({
  context,
  page,
}) => {
  const a = fassung(server.wurzel, "a", { sw: "0.5.1" });
  const b = fassung(server.wurzel, "b", { sw: "0.5.1", endung: "B" });
  const korrektur = fassung(server.wurzel, "korrektur", { endung: "K" });
  server.veroeffentlichen(a);
  await erstbesuch(page);
  await testdatenSchreiben(page);
  await aktualisieren(page, b);
  let neu = await neustart(context, page);
  expect(await gestartet(neu, 4000)).toBe(false);

  // Grenze: Unter dem alten Service Worker beantwortet dieser jede Navigation mit seiner index.html
  await neu.goto(server.url + "reparatur.html");
  await expect(neu).toHaveTitle("KI-LEAD");

  // Veröffentlichung der Korrektur: Beim Aufruf installiert der Browser sie, sie übernimmt aber nicht von sich aus
  server.veroeffentlichen(korrektur);
  await neu.goto(server.url);
  const zaehler = navigationenZaehlen(neu);
  expect(await updatePruefen(neu)).toMatchObject({ wartet: true });
  await neu.waitForTimeout(1500);
  expect(zaehler()).toBe(0);

  // Alle Fenster schließen und neu öffnen: Die wartende Korrektur wird aktiv, die App startet
  await neu.close();
  neu = await context.newPage();
  await neu.goto(server.url);
  expect(await gestartet(neu)).toBe(true);
  expect(await startdatei(neu)).toBe(korrektur.start);
  expect(await testdatenLesen(neu)).toEqual({ text: "Testmeldung" });
  const namen = await neu.evaluate(() => caches.keys());
  expect(namen).toContain("fremde-anwendung");
  expect(namen.filter((n) => n.startsWith("ki-lead-"))).toHaveLength(1);
  // erneuter Start und offline
  neu = await neustart(context, neu);
  expect(await gestartet(neu)).toBe(true);
  await context.setOffline(true);
  await neu.reload();
  expect(await gestartet(neu)).toBe(true);
  await context.setOffline(false);
});

test("Regression: Ein noch funktionierendes Fenster mit beschädigtem Cache wird nicht neu geladen; ungespeicherte Eingaben bleiben", async ({ page }) => {
  const a = fassung(server.wurzel, "a", { sw: "0.5.1" });
  const b = fassung(server.wurzel, "b", { sw: "0.5.1", endung: "B" });
  const korrektur = fassung(server.wurzel, "korrektur", { endung: "K" });
  server.veroeffentlichen(a);
  await erstbesuch(page);
  await aktualisieren(page, b);
  // Fenster läuft noch mit 0.5.0-Code (alte Startdatei im HTTP-Cache), steuernder Cache von 0.5.1 ist beschädigt
  await page.close();
  const fenster = await page.context().newPage();
  await fenster.goto(server.url);
  expect(await gestartet(fenster)).toBe(true);
  expect(await fenster.evaluate(() => caches.keys())).toEqual([expect.stringMatching(/B-0\.5\.1$/)]);
  // Ungespeicherte Eingabe der KI-Erfassung (nur im Zustand der Oberfläche)
  await bereich(fenster, "KI-Erfassung");
  const feld = fenster.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse");
  await feld.fill("Ungespeicherte Eingabe");
  const zaehler = navigationenZaehlen(fenster);

  server.veroeffentlichen(korrektur);
  expect(await updatePruefen(fenster)).toMatchObject({ wartet: true });
  await fenster.waitForTimeout(2000);
  expect(zaehler()).toBe(0);
  await expect(feld).toHaveValue("Ungespeicherte Eingabe");
  // Der kontrollierte Weg bleibt: der Hinweis „Neu laden“ der laufenden Fassung
  await expect(fenster.getByText("Eine neue Fassung von KI-LEAD ist bereit.")).toBeVisible();
});

test("Regression: Rest einer gescheiterten Installation löst keine Übernahme und kein Neuladen aus", async ({ page }) => {
  const a = fassung(server.wurzel, "a");
  // Installation bricht beim Laden ab (eine Datei fehlt auf dem Server, wie bei einem Netzfehler)
  const kaputt = fassung(server.wurzel, "kaputt", { endung: "X", ohneDatei: /^assets\/pdf-/ });
  const b = fassung(server.wurzel, "b", { endung: "B" });
  server.veroeffentlichen(a);
  await erstbesuch(page);
  const zaehler = navigationenZaehlen(page);
  server.veroeffentlichen(kaputt);
  expect(await updatePruefen(page)).toMatchObject({ wartet: false });
  // Kein zurückgebliebener Cache der gescheiterten Fassung
  expect((await page.evaluate(() => caches.keys())).filter((n) => n.startsWith("ki-lead-"))).toHaveLength(1);
  // Auch ein künstlich hinterlassener, leerer „ki-lead-“-Cache führt bei der nächsten Fassung nicht zur Übernahme
  await page.evaluate(() => caches.open("ki-lead-rest-einer-gescheiterten-installation"));
  server.veroeffentlichen(b);
  expect(await updatePruefen(page)).toMatchObject({ wartet: true });
  await page.waitForTimeout(1500);
  expect(zaehler()).toBe(0);
  expect(await startdatei(page)).toBe(a.start);
  await expect(page.getByText("Eine neue Fassung von KI-LEAD ist bereit.")).toBeVisible();
});

test("Hinweis „Neu laden“: übernimmt nur im anfordernden Fenster; ein zweites Fenster lädt nicht neu", async ({ context, page }) => {
  const a = fassung(server.wurzel, "a");
  const b = fassung(server.wurzel, "b", { endung: "B" });
  server.veroeffentlichen(a);
  await erstbesuch(page);
  const zweites = await context.newPage();
  await zweites.goto(server.url);
  expect(await gestartet(zweites)).toBe(true);
  await bereich(zweites, "KI-Erfassung");
  await zweites.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Eingabe im zweiten Fenster");
  const zaehlerZweites = navigationenZaehlen(zweites);
  server.veroeffentlichen(b);
  expect(await updatePruefen(page)).toMatchObject({ wartet: true });
  await expect(page.getByText("Eine neue Fassung von KI-LEAD ist bereit.")).toBeVisible();
  await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Neu laden" }).click()]);
  expect(await gestartet(page)).toBe(true);
  expect(await startdatei(page)).toBe(b.start);
  await zweites.waitForTimeout(1500);
  expect(zaehlerZweites()).toBe(0);
  await expect(zweites.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse")).toHaveValue("Eingabe im zweiten Fenster");
});

test("Nachweislich gescheiterter Start: Startprüfung übernimmt die wartende Fassung erst auf Klick", async ({ context, page }) => {
  const a = fassung(server.wurzel, "a");
  const b = fassung(server.wurzel, "b", { endung: "B" });
  server.veroeffentlichen(a);
  await erstbesuch(page);
  // Beschädigung simulieren: Startdatei fehlt im Cache der aktiven Fassung und (nach Veröffentlichung von b) auf dem Server
  await page.evaluate(async (start) => {
    for (const n of await caches.keys()) if (n.startsWith("ki-lead-")) await (await caches.open(n)).delete(new URL(`assets/${start}`, location.href).href);
  }, a.start);
  server.veroeffentlichen(b);
  expect(await updatePruefen(page)).toMatchObject({ wartet: true });
  await (await context.newCDPSession(page)).send("Network.clearBrowserCache");
  await page.reload();
  const hinweis = page.locator("#ki-lead-startfehler");
  await expect(hinweis).toBeVisible({ timeout: 5000 });
  // ohne Klick geschieht nichts
  const zaehler = navigationenZaehlen(page);
  await page.waitForTimeout(1500);
  expect(zaehler()).toBe(0);
  await Promise.all([page.waitForEvent("load"), hinweis.getByRole("button", { name: "Erneut laden" }).click()]);
  expect(await gestartet(page)).toBe(true);
  expect(await startdatei(page)).toBe(b.start);
});

test("Reparaturseite: entfernt nur eigene Registrierung und Programm-Caches; Daten und fremde Caches bleiben", async ({ page }) => {
  const a = fassung(server.wurzel, "a");
  server.veroeffentlichen(a);
  await erstbesuch(page);
  await testdatenSchreiben(page);
  await page.goto(server.url + "reparatur.html");
  await expect(page).toHaveTitle("KI-LEAD reparieren");
  await expect(page.locator("#zustand")).toContainText("Service Worker angemeldet");
  // Nichts geschieht ohne ausdrückliche Betätigung
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(1);
  await page.getByRole("button", { name: "Programmdateien zurücksetzen" }).click();
  await expect(page.locator("#ergebnis")).toContainText("Erledigt");
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual(["fremde-anwendung"]);
  expect(await testdatenLesen(page)).toEqual({ text: "Testmeldung" });
  await page.getByRole("link", { name: "KI-LEAD öffnen" }).click();
  expect(await gestartet(page)).toBe(true);
  expect(await testdatenLesen(page)).toEqual({ text: "Testmeldung" });
});

test("Startprüfung: fehlt die Startdatei, erscheint ein Hinweis mit Weg zur Reparatur, ohne Neuladen", async ({ page }) => {
  const a = fassung(server.wurzel, "a");
  const ohne = fassung(server.wurzel, "ohne", { indexVon: a, endung: "X" });
  // index.html verweist auf eine Startdatei, die es auf dem Server nicht gibt; ohne Service Worker
  await page.context().route("**/sw.js", (r) => r.fulfill({ status: 404, body: "" }));
  server.veroeffentlichen(ohne);
  let navigationen = 0;
  page.on("framenavigated", (f) => f === page.mainFrame() && navigationen++);
  await page.goto(server.url);
  const hinweis = page.locator("#ki-lead-startfehler");
  await expect(hinweis).toBeVisible({ timeout: 5000 });
  await expect(hinweis).toContainText("KI-LEAD startet nicht");
  await expect(hinweis.getByRole("link", { name: "Programmdateien reparieren" })).toHaveAttribute("href", "./reparatur.html");
  await page.waitForTimeout(1500);
  expect(navigationen).toBe(1);
});
