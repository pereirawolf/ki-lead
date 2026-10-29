// Testläufe (seit 0.5.17 eigener Bereich „Einstellungen → Testläufe“; bis 0.5.16 „Vergleichslauf Ilka“ seit 0.5.8 und
// „Prüffall Reparatur“ seit 0.5.13 unter „Modelle & Verarbeitung“) im echten Browser mit simuliertem
// Anthropic-Anbieter: Kette mit zwei Läufen und ZIP-Datei; S3 Reparatur mit fünf Defekten; Archiv in der IndexedDB
// mit nachträglichem Herunterladen und Löschen. Reparaturmodell der App-Vorgabe seit 0.5.15: Haiku (AV-2026-W43-32).
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { bereich, netzVorbereiten, schluesselSetzen } from "./hilfen";

const REFERENZ = "profile/lead-beispiel/beispiele/orkantief-ilka/LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json";
const S1 = {
  gegenstand: "Sturmfolgen Orkantief Ilka",
  stichtag: "2026-10-14",
  meldezeitpunkt: "2026-10-14T14:00",
  referenzbezug: "Bund",
  horizont: "bis 16.10.2026",
  sachverhalte: [{ titel: "Sturmfolgen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm", eingangsmeldungen: [] }],
  prueffrage: "",
  hinweise: "",
};

async function zuTestlaeufen(page: import("@playwright/test").Page) {
  await bereich(page, "Einstellungen");
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "Testläufe", exact: true }).click();
  await expect(page.getByRole("region", { name: "Archiv" })).toBeVisible();
}

test("S1 + S2 + S3: zwei Läufe mit der Vorgabe Anthropic, ZIP-Datei und Eintrag im Archiv", async ({ page }) => {
  const referenz = await readFile(REFERENZ, "utf-8");
  // S1 mit Schema (output_config.format), S2 als Kurzantwort mit Meldung
  const netz = await netzVorbereiten(page, (_nr, koerper) => (koerper?.output_config?.format ? JSON.stringify(S1) : "Kurz.\n\n```json\n" + referenz + "\n```"));
  await page.goto("./");
  await schluesselSetzen(page);
  await zuTestlaeufen(page);
  const abschnitt = page.getByRole("region", { name: "Neuer Testlauf" });
  await expect(abschnitt.getByRole("radio", { name: "S1 + S2 + S3 (aus Rohdaten)" })).toBeChecked();
  await expect(abschnitt.getByLabel("Anzahl der Läufe")).toHaveValue("3");
  await abschnitt.getByLabel("Anzahl der Läufe").fill("2");
  const download = page.waitForEvent("download");
  await abschnitt.getByRole("button", { name: "Testlauf starten" }).click();
  const datei = await download;
  expect(datei.suggestedFilename()).toMatch(/^KI-LEAD_Testlauf_Ilka_claude-opus-5-5-medium_\d{8}-\d{4}\.zip$/);
  const zip = await JSZip.loadAsync(await readFile(await datei.path()));
  const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
  expect(reihe).toMatchObject({ format: "ki-lead-abnahme/1", quelle: "app", laeufe_geplant: 2, technisch_bestanden: 2 });
  expect(Object.keys(zip.files).filter((n) => n.startsWith("meldungen/") && !zip.files[n].dir)).toHaveLength(2);
  await expect(abschnitt.getByText("2 von 2 Läufen, technisch bestanden (T1–T8): 2")).toBeVisible();
  // je Lauf S1 und S2 an die simulierte API, sonst keine Anfrage nach außen; S2 ohne Werkzeuge
  expect(netz.ki).toHaveLength(4);
  expect(netz.ki.filter((k) => !k.koerper.output_config?.format).every((k) => !k.koerper.tools)).toBe(true);
  expect(netz.fremd).toEqual([]);

  // Archiv: bleibt nach dem Neuladen und liefert dieselbe Datei noch einmal
  const archiv = page.getByRole("region", { name: "Archiv" });
  await expect(archiv.getByRole("listitem")).toHaveCount(1);
  await page.reload();
  await zuTestlaeufen(page);
  await expect(archiv.getByRole("listitem")).toHaveCount(1);
  await expect(archiv.getByRole("listitem")).toContainText("S1 + S2 + S3 (aus Rohdaten)");
  await expect(archiv.getByRole("listitem")).toContainText("2 von 2 Läufen");
  const nochmal = page.waitForEvent("download");
  await archiv.getByRole("button", { name: `ZIP herunterladen: ${datei.suggestedFilename()}` }).click();
  expect((await nochmal).suggestedFilename()).toBe(datei.suggestedFilename());
  await archiv.getByRole("button", { name: "Alle löschen" }).click();
  // Rückfrage im eigenen Dialog der App (seit 0.6.5, TP-2026-W44-20; bis 0.6.4 window.confirm)
  await page.getByRole("dialog").getByRole("button", { name: "Löschen" }).click();
  await expect(archiv.getByText("Noch keine Testläufe archiviert.")).toBeVisible();
});

test("S3 Reparatur: ein Lauf mit Haiku, fünf Reparaturen, nur S3 ruft die API auf", async ({ page }) => {
  const muster = await readFile("evaluation/material/ilka-musterfassung.json", "utf-8");
  // Die simulierte Reparatur liefert die unbeschädigte Musterfassung
  const netz = await netzVorbereiten(page, () => "Repariert.\n\n```json\n" + muster + "\n```");
  await page.goto("./");
  await schluesselSetzen(page);
  await zuTestlaeufen(page);
  const abschnitt = page.getByRole("region", { name: "Neuer Testlauf" });
  await abschnitt.getByRole("radio", { name: "S3 Reparatur (aus Musterfassung)" }).check();
  await expect(abschnitt.getByText("S3 Reparatur: claude-haiku-5-5 (niedrig) · Anthropic")).toBeVisible();
  await expect(abschnitt.getByRole("combobox")).toHaveValue("");
  await expect(abschnitt.getByLabel("Anzahl der Läufe")).toHaveValue("2");
  await abschnitt.getByLabel("Anzahl der Läufe").fill("1");
  const download = page.waitForEvent("download");
  await abschnitt.getByRole("button", { name: "Testlauf starten" }).click();
  const datei = await download;
  expect(datei.suggestedFilename()).toMatch(/^KI-LEAD_Testlauf_Ilka_S3-Reparatur_claude-haiku-5-5-low_\d{8}-\d{4}\.zip$/);
  const zip = await JSZip.loadAsync(await readFile(await datei.path()));
  const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
  expect(reihe).toMatchObject({ format: "ki-lead-reparaturtest/1", quelle: "app", basis: { schemakonform: true, reparaturen: 0 } });
  expect(reihe.summe).toMatchObject({ faelle: 5, schemakonform: 5, reparaturen: 5, stellen_wie_original: 5, anteil_erhalten_mittel: 1 });
  await expect(abschnitt.getByText(/^S3 Reparatur \(aus Musterfassung\): 5 Fälle, schemakonform nach der Reparatur: 5, Reparaturen: 5/)).toBeVisible();
  // je Fall genau eine Anfrage (Reparatur), sonst keine Anfrage nach außen
  expect(netz.ki).toHaveLength(5);
  expect(netz.ki.every((k) => k.koerper.model === "claude-haiku-5-5")).toBe(true);
  expect(netz.fremd).toEqual([]);
  await expect(page.getByRole("region", { name: "Archiv" }).getByRole("listitem")).toContainText("1 von 1 Läufen");
});
