// KI-Chip der Kopfleiste im echten Browser (seit 0.5.21): „KI ruht“ in Ruhe, „KI aktiv“ in jeder Ansicht,
// solange eine KI-Anfrage läuft; nach S1 (Anfrage beendet, Bestätigung offen) und nach dem Abbruch wieder in Ruhe.
import { expect, test } from "@playwright/test";
import { bereich, netzVorbereiten, oeffnen, S1_VORSCHLAG, schluesselSetzen } from "./hilfen";

test("KI-Chip wechselt zwischen „KI ruht“ und „KI aktiv“", async ({ page }) => {
  const netz = await netzVorbereiten(page, () => "haengen");
  await oeffnen(page);
  const chip = page.locator(".kopf-ki");
  await expect(chip).toHaveText("KI ruht");

  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
  await expect.poll(() => netz.ki.length).toBe(1);

  // Anfrage offen: in jeder Ansicht online
  await expect(chip).toHaveText("KI aktiv");
  await bereich(page, "Auswertung");
  await expect(chip).toHaveText("KI aktiv");
  await expect(page.getByRole("img", { name: /^KI aktiv: Anfrage läuft, S1/ })).toBeVisible();
  // Seit 0.6.12 reine Statusanzeige (KP-2026-W44-01): kein Knopf, kein Sprung
  await expect(page.getByRole("button", { name: /^KI (on|off)line/ })).toHaveCount(0);

  await bereich(page, "KI-Erfassung");
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(chip).toHaveText("KI ruht");
});

test("Nach S1 ist die Anfrage beendet: KI ruht, bis S2 startet", async ({ page }) => {
  // Seit 0.6.0 folgt bei „Recherche durchführen“ die Orientierungssuche (Teil von S1, je Sachverhalt ein Versuch und eine
  // Wiederholung ohne Suche), danach die Bestätigung der Suchbegriffe; erst der Start von S2 macht die KI wieder online.
  const netz = await netzVorbereiten(page, (nr) => (nr === 1 ? JSON.stringify(S1_VORSCHLAG) : nr <= 3 ? "Keine Suche." : "haengen"));
  await oeffnen(page);
  await schluesselSetzen(page);
  await bereich(page, "KI-Erfassung");
  await page.getByLabel("Untersuchungsgegenstand und Erkenntnisinteresse").fill("Orkan in Hessen");
  await page.getByLabel(/Ich gebe nur fiktive oder offen zugängliche/).check();
  await page.getByRole("button", { name: "Gegenstand bestimmen (S1)" }).click();
  const chip = page.locator(".kopf-ki");
  await expect(page.getByRole("button", { name: "Gegenstand bestätigen und Orientierung suchen (S1)" })).toBeVisible();
  await expect(chip).toHaveText("KI ruht");

  await page.getByRole("button", { name: "Gegenstand bestätigen und Orientierung suchen (S1)" }).click();
  await expect(page.getByRole("button", { name: "Bestätigen und recherchieren (S2)" })).toBeVisible();
  expect(netz.ki).toHaveLength(3);
  expect(netz.ki[1].koerper.tool_choice).toEqual({ type: "tool", name: "web_search" });
  expect(netz.ki[1].koerper.tools.map((t: { name: string }) => t.name)).toEqual(["web_search"]);
  await expect(chip).toHaveText("KI ruht");

  await page.getByRole("button", { name: "Bestätigen und recherchieren (S2)" }).click();
  await expect.poll(() => netz.ki.length).toBe(4);
  await expect(chip).toHaveText("KI aktiv");
  await expect(chip).toHaveAttribute("aria-label", /S2 Recherche und Entwurf/);
});

test("KP-2026-W44-01: Verbindungstest der API-Schlüssel setzt den Chip auf „KI aktiv“, bis die Antwort da ist", async ({ page }) => {
  let freigeben = () => {};
  const warten = new Promise<void>((ja) => (freigeben = ja));
  await page.route("https://api.anthropic.com/**", async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST", "access-control-allow-headers": "*" },
      });
    await warten;
    return route.fulfill({
      status: 401,
      headers: { "access-control-allow-origin": "*", "content-type": "application/json" },
      body: JSON.stringify({ type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }),
    });
  });
  await oeffnen(page);
  const chip = page.locator(".kopf-ki");
  await bereich(page, "Einstellungen");
  await page.getByRole("button", { name: "KI-Anbieter & API", exact: true }).click();
  const feld = page.getByLabel("API-Schlüssel Anthropic");
  await feld.fill("sk-ant-test");
  await expect(chip).toHaveText("KI ruht");
  await feld.locator("xpath=ancestor::section[1]").getByRole("button", { name: "Verbindung prüfen" }).click();
  await expect(chip).toHaveText("KI aktiv");
  freigeben();
  await expect(chip).toHaveText("KI ruht");
});
