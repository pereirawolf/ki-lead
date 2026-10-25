// Prüffall Reparatur (seit 0.5.13, AV-2026-W43-25) im echten Browser mit simuliertem Anthropic-Anbieter: Start unter
// „Einstellungen → Modelle & Verarbeitung“, ein Durchgang mit fünf Defekten, ZIP-Datei mit Reihendatei und Übersicht.
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { bereich, netzVorbereiten, schluesselSetzen } from "./hilfen";

test("ein Durchgang mit Sonnet: fünf Reparaturen, nur S3 ruft die API auf", async ({ page }) => {
  const muster = await readFile("evaluation/material/ilka-musterfassung.json", "utf-8");
  // Die simulierte Reparatur liefert die unbeschädigte Musterfassung
  const netz = await netzVorbereiten(page, () => "Repariert.\n\n```json\n" + muster + "\n```");
  await page.goto("./");
  await schluesselSetzen(page);
  await bereich(page, "Einstellungen");
  await page.getByRole("button", { name: "Modelle & Verarbeitung", exact: true }).click();
  const abschnitt = page.getByRole("region", { name: "Prüffall Reparatur" });
  await expect(abschnitt.getByText("S3 Reparatur: claude-sonnet-5-5 (niedrig) · Anthropic")).toBeVisible();
  await expect(abschnitt.getByRole("combobox")).toHaveValue("");
  await expect(abschnitt.getByLabel("Durchgänge", { exact: true })).toHaveValue("2");
  await abschnitt.getByLabel("Durchgänge", { exact: true }).fill("1");
  const download = page.waitForEvent("download");
  await abschnitt.getByRole("button", { name: "Prüffall starten" }).click();
  const datei = await download;
  expect(datei.suggestedFilename()).toMatch(/^KI-LEAD_Prueffall_Reparatur_claude-sonnet-5-5-low_\d{8}-\d{4}\.zip$/);
  const zip = await JSZip.loadAsync(await readFile(await datei.path()));
  const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
  expect(reihe).toMatchObject({ format: "ki-lead-reparaturtest/1", quelle: "app", basis: { schemakonform: true, reparaturen: 0 } });
  expect(reihe.summe).toMatchObject({ faelle: 5, schemakonform: 5, reparaturen: 5, anteil_erhalten_mittel: 1 });
  await expect(abschnitt.getByText(/^5 Fälle, schemakonform nach der Reparatur: 5, Reparaturen: 5/)).toBeVisible();
  // je Fall genau eine Anfrage (Reparatur), sonst keine Anfrage nach außen
  expect(netz.ki).toHaveLength(5);
  expect(netz.ki.every((k) => k.koerper.model === "claude-sonnet-5-5")).toBe(true);
  expect(netz.fremd).toEqual([]);
});
