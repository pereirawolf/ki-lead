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
  await expect(page.locator(".chip-name")).toBeVisible();
}

/** Hauptbereich über die Navigation wählen */
export async function bereich(page: Page, name: "Meldung" | "KI-Erfassung" | "Lagebild" | "Profile" | "Einstellungen"): Promise<void> {
  await page.getByRole("button", { name, exact: true }).click();
}

/** API-Schlüssel für Anthropic unter „Einstellungen“ speichern */
export async function schluesselSetzen(page: Page): Promise<void> {
  await bereich(page, "Einstellungen");
  const feld = page.getByLabel("API-Schlüssel Anthropic");
  await feld.fill(SCHLUESSEL);
  await feld.locator("xpath=ancestor::section[1]").getByRole("button", { name: "Speichern" }).click();
}

/** Inhalt eines Downloads als Text */
export async function downloadText(d: Download): Promise<string> {
  return readFile((await d.path())!, "utf-8");
}
