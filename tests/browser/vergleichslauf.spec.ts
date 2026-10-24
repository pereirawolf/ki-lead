// Vergleichslauf Ilka (seit 0.5.8) im echten Browser mit simuliertem Anthropic-Anbieter: Start unter
// „Einstellungen → Modelle & Verarbeitung“, zwei Läufe, ZIP-Datei mit Reihendatei, Übersicht und Entwürfen.
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

test("zwei Läufe mit der Vorgabe Anthropic und ZIP-Datei zum Herunterladen", async ({ page }) => {
  const referenz = await readFile(REFERENZ, "utf-8");
  // S1 mit Schema (output_config.format), S2 als Kurzantwort mit Meldung
  const netz = await netzVorbereiten(page, (_nr, koerper) => (koerper?.output_config?.format ? JSON.stringify(S1) : "Kurz.\n\n```json\n" + referenz + "\n```"));
  await page.goto("./");
  await schluesselSetzen(page);
  await bereich(page, "Einstellungen");
  await page.getByRole("button", { name: "Modelle & Verarbeitung", exact: true }).click();
  const abschnitt = page.getByRole("region", { name: "Vergleichslauf Ilka" });
  await expect(abschnitt.getByLabel("Anzahl der Läufe")).toHaveValue("3");
  await abschnitt.getByLabel("Anzahl der Läufe").fill("2");
  const download = page.waitForEvent("download");
  await abschnitt.getByRole("button", { name: "Vergleichslauf starten" }).click();
  const datei = await download;
  expect(datei.suggestedFilename()).toMatch(/^KI-LEAD_Vergleichslauf_Ilka_claude-opus-5-5-medium_\d{8}-\d{4}\.zip$/);
  const zip = await JSZip.loadAsync(await readFile(await datei.path()));
  const reihe = JSON.parse(await zip.file("reihe.json")!.async("string"));
  expect(reihe).toMatchObject({ format: "ki-lead-abnahme/1", quelle: "app", laeufe_geplant: 2, technisch_bestanden: 2 });
  expect(Object.keys(zip.files).filter((n) => n.startsWith("meldungen/") && !zip.files[n].dir)).toHaveLength(2);
  await expect(abschnitt.getByText("2 von 2 Läufen, technisch bestanden (T1–T8): 2")).toBeVisible();
  // je Lauf S1 und S2 an die simulierte API, sonst keine Anfrage nach außen; S2 ohne Werkzeuge
  expect(netz.ki).toHaveLength(4);
  expect(netz.ki.filter((k) => !k.koerper.output_config?.format).every((k) => !k.koerper.tools)).toBe(true);
  expect(netz.fremd).toEqual([]);
});
