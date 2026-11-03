// Testläufe (seit 0.5.17 eigener Bereich „Einstellungen → Testläufe“; bis 0.5.16 „Vergleichslauf Ilka“ seit 0.5.8 und
// „Prüffall Reparatur“ seit 0.5.13 unter „Modelle & Verarbeitung“) im echten Browser mit simuliertem
// Anthropic-Anbieter: Kette mit zwei Läufen und ZIP-Datei; S3 Reparatur mit fünf Defekten; Archiv in der IndexedDB
// mit nachträglichem Herunterladen und Löschen. Reparaturmodell der App-Vorgabe seit 0.5.15: Haiku (AV-2026-W43-32).
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import { forschungEinschalten, netzVorbereiten, schluesselSetzen } from "./hilfen";

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
  await forschungEinschalten(page);
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

// Fallreihe (seit 0.7.1, TP-2026-W44-62 bis -67): Fallpaket mit Prüfsumme, Plan mit Vorbelegung, Kostenbremse vor dem
// ersten Lauf, dann Start mit einem Klick und ZIP-Inhalt; nur die simulierte API wird angesprochen.
test("Fallreihe: Fallpaket und Plan laden, Kostenbremse, Start mit einem Klick, ZIP mit Übersicht und Bewertungsvorlagen", async ({ page }) => {
  const referenz = await readFile(REFERENZ, "utf-8");
  const netz = await netzVorbereiten(page, (_nr, koerper) => (koerper?.output_config?.format ? JSON.stringify(S1) : "Kurz.\n\n```json\n" + referenz + "\n```"));
  const paket = new JSZip();
  paket.file(
    "kontrollsatz/faelle/k1-browser.json",
    JSON.stringify({
      format: "ki-lead-evaluationsfall/1",
      id: "k1-browser",
      titel: "Kontrollfall Browser (FIKTIV)",
      stand: "2026-11-03",
      fiktiv: true,
      auftrag: { sachverhalt: "Fiktive Lage im Browsertest", stichtag: "2026-11-03", meldezeitpunkt: "2026-11-03T12:00", websuche: false },
      material: [{ datei: "evaluation/material/k1-browser.md", rolle: "material" }],
      erwartungen: { muss: ["Fiktive Lage erfasst."] },
    }),
  );
  paket.file("kontrollsatz/evaluation/material/k1-browser.md", "FIKTIVES ÜBUNGSMATERIAL – keine reale Lage");
  const zipBytes = Buffer.from(await paket.generateAsync({ type: "uint8array" }));
  const paketSha = createHash("sha256").update(zipBytes).digest("hex");
  const plan = JSON.stringify({
    format: "ki-lead-bewertungsplan/1",
    id: "browser-b4",
    stand: "2026-11-03",
    fragestellung: "Browsertest",
    faelle: ["k1-browser", "sop-gas-stabil"],
    varianten: [{ kennung: "anthropic", ki_profil: "anthropic" }],
    wiederholungen: 1,
    budget_usd: 1,
    fallpaket: { name: "kontrollsatz.zip", sha256: paketSha },
  });
  const planSha = createHash("sha256").update(plan).digest("hex");

  await page.goto("./");
  await schluesselSetzen(page);
  await zuTestlaeufen(page);
  const reihe = page.getByRole("region", { name: "Fallreihe" });
  await expect(reihe.getByText("SOP-Fälle", { exact: false }).first()).toBeVisible();
  await reihe.getByLabel("Fallpaket importieren (ZIP)").setInputFiles({ name: "kontrollsatz.zip", mimeType: "application/zip", buffer: zipBytes });
  await expect(reihe.getByText("kontrollsatz.zip importiert: 1 Fall")).toBeVisible();
  await expect(reihe.getByRole("list", { name: "Fallpakete" })).toContainText(`SHA-256 ${paketSha}`);
  await reihe.getByLabel("Bewertungsplan laden (JSON)").setInputFiles({ name: "browser-b4.json", mimeType: "application/json", buffer: Buffer.from(plan) });
  await expect(reihe.getByText(`SHA-256 ${planSha}`)).toBeVisible();
  await expect(reihe.getByRole("checkbox", { name: /Kontrollfall Browser/ })).toBeChecked();
  await expect(reihe.getByRole("checkbox", { name: /Niedriger Speicherstand bei stabiler Gasversorgung/ })).toBeChecked();
  await expect(reihe.getByRole("checkbox", { name: "anthropic: Standardprofil Anthropic" })).toBeChecked();
  await expect(reihe.getByLabel("Kostendeckel (USD)")).toHaveValue("1");
  await expect(reihe.getByText("2 Läufe (2 × 1 × 1)", { exact: false })).toBeVisible();

  // Deckel 1 USD: Die Schätzung des ersten Laufs liegt darüber, die Bremse hält vor Lauf 1
  await reihe.getByRole("button", { name: "Fallreihe starten" }).click();
  await expect(reihe.getByText(/Fallreihe beendet: 0 von 2 Läufen \(Kostenbremse vor Lauf 1/)).toBeVisible();
  expect(netz.ki).toHaveLength(0);

  // ohne Deckel: beide Läufe, ZIP-Datei mit Plan- und Paketprüfsumme
  await reihe.getByLabel("Kostendeckel (USD)").fill("");
  await expect(reihe.getByText("Auswahl weicht vom Plan ab", { exact: false })).toBeVisible();
  const download = page.waitForEvent("download");
  await reihe.getByRole("button", { name: "Fallreihe starten" }).click();
  const datei = await download;
  expect(datei.suggestedFilename()).toMatch(/^KI-LEAD_Fallreihe_browser-b4_\d{8}-\d{4}\.zip$/);
  const zip = await JSZip.loadAsync(await readFile(await datei.path()));
  const r = JSON.parse(await zip.file("fallreihe.json")!.async("string"));
  expect(r).toMatchObject({
    format: "ki-lead-fallreihe/1",
    plan: { id: "browser-b4", sha256: planSha, abweichend: true },
    fallpakete: [{ name: "kontrollsatz.zip", sha256: paketSha }],
    laeufe_geplant: 2,
    budget_usd: null,
  });
  expect(r.laeufe.map((l: any) => [l.fall, l.variante, l.pruefungen.status])).toEqual([
    ["k1-browser", "anthropic", "fertig"],
    ["sop-gas-stabil", "anthropic", "fertig"],
  ]);
  const namen = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  for (const n of ["uebersicht.csv", "LIESMICH.txt", "bewertungen/E001.bewertung.json", "bewertungen/E002.pruefliste.md"]) expect(namen).toContain(n);
  expect(namen.filter((n) => n.startsWith("laeufe/"))).toHaveLength(2);
  expect(namen.filter((n) => n.startsWith("entwuerfe/"))).toHaveLength(2);
  expect(netz.ki).toHaveLength(4);
  expect(netz.fremd).toEqual([]);
  await expect(page.getByRole("region", { name: "Archiv" }).getByRole("listitem")).toContainText("Fallreihe");
});
