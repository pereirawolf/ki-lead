// Endpunkt der Stelle in der Mistral-Probe (seit 0.6.17, TP-2026-W44-52): Abnahme von A2 mit echten Aufrufen. Der
// Betreiberbuild mit betrieb/probe-mistral-eu.json (nur „Endpunkt der Stelle“ = Chat Completions am EU-Endpunkt von
// Mistral) läuft auf eigenem Port. Geprüft: Content-Security-Policy mit nur diesem Ziel, nur dieser Anbieter in der
// Oberfläche, Verbindungstest aus dem Browser (CORS), strenges Schema und Nutzungsangaben über den Adapter, Fehlertext
// bei falschem Schlüssel. Bericht: probe-bericht-stelle.md. Kosten: unter 1 Cent je Durchgang.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { betriebPruefen } from "../../src/anbieter/betrieb";
import { StelleAnbieter } from "../../src/anbieter/stelle";
import type { LlmAnfrage } from "../../src/anbieter/typen";

const SCHLUESSEL = process.env.MISTRAL_API_KEY?.trim() || "";
const KONFIG = betriebPruefen(JSON.parse(readFileSync("betrieb/probe-mistral-eu.json", "utf-8")));

test.skip(!SCHLUESSEL, "Kein MISTRAL_API_KEY gesetzt; die Probe ruft Mistral nur mit einem Testschlüssel auf.");

const bericht: string[] = [];
const zeile = (z: string) => bericht.push(z.split(SCHLUESSEL || "\u0000").join("***"));
const kurz = (e: unknown) => String((e as Error)?.message || e).slice(0, 300);

test.afterAll(() => {
  if (!SCHLUESSEL) return;
  const kopf = [
    `# Endpunkt der Stelle (Betreiberbuild „${KONFIG.bezeichnung}“)`,
    ``,
    `Stand: ${new Date().toISOString()} · ${KONFIG.stelle!.basisUrl} · ${KONFIG.stelle!.modell}`,
    ``,
  ];
  // Anhängen: Nach einem Fehlschlag startet Playwright einen neuen Worker, der Bericht des alten bleibt so erhalten
  appendFileSync("probe-bericht-stelle.md", [...(existsSync("probe-bericht-stelle.md") ? [] : kopf), ...bericht, ""].join("\n"));
});

const adapter = (schluessel = SCHLUESSEL) => new StelleAnbieter(schluessel, KONFIG.stelle, undefined, KONFIG);
const anfrage = (a: Partial<LlmAnfrage> = {}): LlmAnfrage => ({
  modell: `stelle:${KONFIG.stelle!.modell}`,
  maxTokens: 1000,
  system: [{ text: "Antworte knapp und auf Deutsch." }],
  nachrichten: [{ role: "user", content: "Antworte nur mit: Verbindung steht." }],
  ...a,
});

test("Betreiberbuild: Policy nur mit dem Endpunkt, nur dieser Anbieter, Verbindungstest aus dem Browser", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator(".kopf-ki")).toBeVisible();
  const csp = (await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content")) ?? "";
  const connect = csp
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("connect-src"));
  zeile(`## Betreiberbuild\n\n- ${connect}`);
  expect(connect).toBe("connect-src 'self' https://api.eu.mistral.ai");

  await page.getByRole("button", { name: "Einstellungen", exact: true }).click();
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "KI-Anbieter & API", exact: true }).click();
  const titel = await page.locator("section[aria-labelledby^='schluessel-'] h3").allInnerTexts();
  zeile(`- Karten: ${titel.join(", ")}`);
  expect(titel).toEqual(["API-Schlüssel (Endpunkt der Stelle)"]);

  const abschnitt = page.locator("section[aria-labelledby='schluessel-stelle']");
  await abschnitt.getByLabel("API-Schlüssel Endpunkt der Stelle").fill(SCHLUESSEL);
  await abschnitt.getByRole("button", { name: "Verbindung prüfen" }).click();
  const ergebnis = abschnitt.locator(".kasten-ok, .kasten-fehler");
  await expect(ergebnis).toBeVisible({ timeout: 90_000 });
  const ok = (await ergebnis.getAttribute("class"))!.includes("kasten-ok");
  zeile(`- Verbindungstest: ${ok ? "ok" : "Fehler"}: ${(await ergebnis.innerText()).trim()}`);
  expect(ok).toBe(true);
});

test("Adapter: strenges Schema, gültiges JSON, Nutzungsangaben und Kosten", async () => {
  const schema = {
    type: "object",
    properties: { lage: { type: "string" }, stufe: { type: "integer", minimum: 0, maximum: 4 }, hinweis: { type: "string" } },
    required: ["lage", "stufe"],
  };
  try {
    const r = await adapter().senden(anfrage({ jsonSchema: schema, nachrichten: [{ role: "user", content: "Lage: Sturm, Stufe 2. Gib lage und stufe an." }] }));
    const json = JSON.parse(r.text);
    zeile(`\n## Strukturierte Ausgabe\n\n- ${r.modell}: ${JSON.stringify(json)} · Nutzung ${JSON.stringify(r.nutzung)} · ${r.kostenUsd} USD`);
    expect(Object.keys(json).sort()).toEqual(["hinweis", "lage", "stufe"]);
    expect(r.nutzung.eingabe).toBeGreaterThan(0);
    expect(r.nutzung.ausgabe).toBeGreaterThan(0);
    expect(r.kostenUsd).not.toBeNull();
    expect(r.inhalt[0]).toMatchObject({ anbieter: "stelle", endpunkt: "api.eu.mistral.ai" });
  } catch (e) {
    zeile(`\n## Strukturierte Ausgabe\n\n- Fehler (${kurz(e)})`);
    throw e;
  }
});

test("Adapter: falscher Schlüssel ergibt den Fehlertext mit dem Namen des Dienstes", async () => {
  const fehler = await adapter("falsch")
    .senden(anfrage())
    .then(
      () => null,
      (e: Error) => e,
    );
  zeile(`\n## Falscher Schlüssel\n\n- ${fehler ? kurz(fehler) : "kein Fehler"}`);
  expect(fehler?.message).toMatch(/^Der Schlüssel für „Endpunkt der Stelle \(Probe: Mistral EU\)“ wurde abgelehnt/);
});
