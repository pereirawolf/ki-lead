// Gemeinsame Hilfen der Browsertests: Netz nur lokal, simulierter KI-Anbieter, Schlüssel, Downloads.
import { expect, type Download, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

/** Schlüssel mit Erkennungsmarke; darf in keinem Export auftauchen */
export const SCHLUESSEL = "sk-ant-test-NICHT-EXPORTIEREN-91c2";

export const S1_VORSCHLAG = {
  gegenstand: "Sturmfolgen Orkantief Ilka in Hessen",
  stichtag: "2026-10-14",
  referenzbezug: "Land Hessen",
  horizont: "bis 21.10.2026",
  sachverhalte: [{ titel: "Sturmfolgen Hessen", ereignisarten: ["Unwetter / Sturm"], sops: ["b01"], begruendung: "Sturm" }],
  prueffrage: "",
  hinweise: "",
};

/** Antwort der Anthropic Messages API als Ereignisstrom mit einem Textblock */
export function anthropicStrom(text: string): string {
  const ereignisse = [
    { type: "message_start", message: { model: "claude-haiku-5-5", usage: { input_tokens: 100, output_tokens: 1 } } },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 50 } },
    { type: "message_stop" },
  ];
  return ereignisse.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
}

export interface Netz {
  /** Anfragen an die (simulierte) Anthropic-API */
  ki: { url: string; koerper: any; schluessel: string | null }[];
  /** Abgebrochene Anfragen an andere fremde Hosts */
  fremd: string[];
}

/**
 * Lässt nur den lokalen Server zu, simuliert die Anthropic-API und bricht alles andere nach außen ab.
 * antwort entscheidet je KI-Anfrage: Text (wird zum Ereignisstrom) oder „haengen“ (keine Antwort, bis abgebrochen).
 */
export async function netzVorbereiten(page: Page, antwort: (nr: number, koerper: any) => string | "haengen"): Promise<Netz> {
  const netz: Netz = { ki: [], fremd: [] };
  await page.route(
    (url) => url.hostname !== "localhost",
    async (route) => {
      const req = route.request();
      if (req.url().startsWith("https://api.anthropic.com/")) {
        if (req.method() === "OPTIONS")
          return route.fulfill({
            status: 204,
            headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST", "access-control-allow-headers": "*" },
          });
        const koerper = req.postDataJSON();
        netz.ki.push({ url: req.url(), koerper, schluessel: req.headers()["x-api-key"] ?? null });
        const a = antwort(netz.ki.length, koerper);
        if (a === "haengen") return; // Anfrage bleibt offen, bis der Browser sie abbricht
        return route.fulfill({ status: 200, headers: { "content-type": "text/event-stream", "access-control-allow-origin": "*" }, body: anthropicStrom(a) });
      }
      netz.fremd.push(req.url());
      return route.abort();
    },
  );
  return netz;
}

/** App öffnen und warten, bis das Profil geladen ist */
export async function oeffnen(page: Page): Promise<void> {
  await page.goto("./");
  await expect(page.locator(".kopf-ki")).toBeVisible();
}

/** Hauptbereich über die Navigation wählen */
export async function bereich(page: Page, name: "Erfassung" | "KI-Erfassung" | "Auswertung" | "Profile" | "Einstellungen"): Promise<void> {
  await page.getByRole("button", { name, exact: true }).click();
}

/**
 * Forschungsfunktionen unter „Einstellungen → Übersicht“ einschalten (seit 0.6.16, TP-2026-W44-46; Vorgabe aus):
 * erst dann gibt es den Bereich „Testläufe“ und den Vergleich mit einer Referenzfassung.
 */
export async function forschungEinschalten(page: Page): Promise<void> {
  await bereich(page, "Einstellungen");
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "Übersicht", exact: true }).click();
  await page.getByRole("checkbox", { name: "Forschungsfunktionen anzeigen" }).check();
}

/** API-Schlüssel für Anthropic unter „Einstellungen“ speichern */
export async function schluesselSetzen(page: Page): Promise<void> {
  await bereich(page, "Einstellungen");
  await page.getByRole("button", { name: "KI-Anbieter und API", exact: true }).click();
  const feld = page.getByLabel("API-Schlüssel Anthropic");
  await feld.fill(SCHLUESSEL);
  await feld.locator("xpath=ancestor::section[1]").getByRole("button", { name: "Speichern" }).click();
}

/** Inhalt eines Downloads als Text */
export async function downloadText(d: Download): Promise<string> {
  return readFile((await d.path())!, "utf-8");
}

/**
 * Eingefrorenes Beispielprofil nach LEAD-Meldung-v1 (tests/fixtures/lead-beispiel-v1, ergänzt um die SOP-Dateien des
 * Beispielprofils) als Profilpaket importieren und verwenden (seit 0.9.0, UP-2026-W45-06): für Browsertests der
 * v1-Felder (Quellen- und Zeitstrahl-Baukasten), die das Beispielprofil seit 2.0.0 nicht mehr zeigt. Eigene Kennung und
 * eigener Name, damit das Paket das eingebaute Beispielprofil nicht ersetzt.
 */
export async function v1BeispielVerwenden(page: Page): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const { readdir } = await import("node:fs/promises");
  const { join, relative } = await import("node:path");
  const lesen = async (ordner: string): Promise<Record<string, string>> => {
    const out: Record<string, string> = {};
    const lauf = async (dir: string) => {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) await lauf(p);
        else if (/\.(json|md)$/.test(e.name)) out[relative(ordner, p)] = await readFile(p, "utf-8");
      }
    };
    await lauf(ordner);
    return out;
  };
  const dateien = await lesen("tests/fixtures/lead-beispiel-v1");
  for (const [d, text] of Object.entries(await lesen("profile/lead-beispiel")))
    if (d.startsWith("sop/") && !d.includes("archiv/") && !d.endsWith("_Lesefassung.md") && !(d in dateien)) dateien[d] = text;
  const manifest = JSON.parse(dateien["profil.json"]!);
  const name = "LEAD-Beispiel v1 (Test)";
  dateien["profil.json"] = JSON.stringify({ ...manifest, id: `${manifest.id}.v1-test`, name });
  const zip = new JSZip();
  for (const [d, text] of Object.entries(dateien)) zip.file(d, text);
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  await bereich(page, "Profile");
  await page.locator('.profile input[type="file"][accept*=".zip"]').setInputFiles({ name: "lead-beispiel-v1.leadprofil", mimeType: "application/zip", buffer });
  await page.getByRole("button", { name: `Profil „${name}“ verwenden` }).click();
  await bereich(page, "Erfassung");
}
