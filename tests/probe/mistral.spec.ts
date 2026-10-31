// Mistral-Probe (seit 0.5.6): prüft die Annahmen der Mistral-Anbindung mit echten Aufrufen, die mit Attrappen nicht
// prüfbar sind (Spezifikation, offener Punkt 15): direkter Aufruf aus dem Browser (CORS) über beide Endpunkte,
// Modelle am EU-Endpunkt, strukturierte Ausgabe mit dem strengen Schema, Stufen des Nachdenkens, PDF als
// document_url, Websuche und Nutzungsangaben am globalen Endpunkt. Ergebnis als probe-bericht.md (Zusammenfassung
// des Workflow-Laufs). Kosten: wenige Cent je Durchgang. Der Schlüssel erscheint in keiner Ausgabe.
import { appendFileSync, existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { jsPDF } from "jspdf";
import { MISTRAL_EU_URL, MistralAnbieter, type MistralEndpunkt } from "../../src/anbieter/mistral";
import type { LlmAnfrage, LlmAntwort } from "../../src/anbieter/typen";
import { MODELL_GRUPPEN } from "../../src/pipeline/einstellungen";

const SCHLUESSEL = process.env.MISTRAL_API_KEY?.trim() || "";
const MODELLE = MODELL_GRUPPEN.find((g) => g.anbieter === "Mistral")!.modelle;

test.skip(!SCHLUESSEL, "Kein MISTRAL_API_KEY gesetzt; die Probe ruft Mistral nur mit einem Testschlüssel auf.");

const bericht: string[] = [];
const zeile = (z: string) => bericht.push(z.split(SCHLUESSEL || "\u0000").join("***"));
const kurz = (e: unknown) => String((e as Error)?.message || e).slice(0, 300);

test.afterAll(() => {
  if (!SCHLUESSEL) return;
  const kopf = [`# Mistral-Probe`, ``, `Stand: ${new Date().toISOString()} · Modelle: ${MODELLE.join(", ")}`, ``];
  // Anhängen: Nach einem Fehlschlag startet Playwright einen neuen Worker, der Bericht des alten bleibt so erhalten
  appendFileSync("probe-bericht.md", [...(existsSync("probe-bericht.md") ? [] : kopf), ...bericht, ""].join("\n"));
});

const anbieter = (endpunkt: MistralEndpunkt) => new MistralAnbieter(SCHLUESSEL, undefined, undefined, endpunkt);

async function senden(endpunkt: MistralEndpunkt, a: Partial<LlmAnfrage> & { modell: string }): Promise<LlmAntwort> {
  return anbieter(endpunkt).senden({
    maxTokens: 2000,
    system: [{ text: "Antworte knapp und auf Deutsch." }],
    nachrichten: [{ role: "user", content: "Antworte nur mit: Verbindung steht." }],
    ...a,
  });
}

// ── Browser: direkter Aufruf (CORS) über die Oberfläche ─────────────────────

async function verbindungPruefen(page: Page, endpunkt: MistralEndpunkt): Promise<string> {
  await page.goto("./");
  await expect(page.locator(".kopf-ki")).toBeVisible();
  await page.getByRole("button", { name: "Einstellungen", exact: true }).click();
  await page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("button", { name: "KI-Anbieter & API", exact: true }).click();
  const abschnitt = page.locator("section[aria-labelledby='schluessel-mistral']");
  await abschnitt.locator(`input[name="mistral-endpunkt"][value="${endpunkt}"]`).check();
  await abschnitt.getByLabel("API-Schlüssel Mistral").fill(SCHLUESSEL);
  await abschnitt.getByRole("button", { name: "Verbindung prüfen" }).click();
  const ergebnis = abschnitt.locator(".kasten-ok, .kasten-fehler");
  await expect(ergebnis).toBeVisible({ timeout: 90_000 });
  const ok = (await ergebnis.getAttribute("class"))!.includes("kasten-ok");
  return `${ok ? "ok" : "Fehler"}: ${(await ergebnis.innerText()).trim()}`;
}

test("Browser: Verbindungstest über den EU-Endpunkt (Vorgabe)", async ({ page }) => {
  const r = await verbindungPruefen(page, "eu");
  zeile(`## Browser (CORS)\n\n- EU (api.eu.mistral.ai): ${r}`);
  expect(r).toMatch(/^ok/);
});

test("Browser: Verbindungstest über den globalen Endpunkt", async ({ page }) => {
  const r = await verbindungPruefen(page, "global");
  zeile(`- Global (api.mistral.ai): ${r}`);
  expect(r).toMatch(/^ok/);
});

// ── Node: Schnittstelle ──────────────────────────────────────────────────────

test("Modelle an beiden Endpunkten", async () => {
  zeile(`\n## Modelle\n`);
  const fehlend: string[] = [];
  for (const [name, url] of [
    ["EU", new URL("/v1/models", MISTRAL_EU_URL).href],
    ["Global", "https://api.mistral.ai/v1/models"],
  ]) {
    const r = await fetch(url, { headers: { authorization: `Bearer ${SCHLUESSEL}` } });
    if (!r.ok) {
      zeile(`- ${name}: HTTP ${r.status}`);
      fehlend.push(`${name}: HTTP ${r.status}`);
      continue;
    }
    const ids = new Set(((await r.json())?.data || []).flatMap((m: any) => [m.id, ...(m.aliases || [])]));
    const da = MODELLE.map((m) => `${m} ${ids.has(m) ? "✓" : "✗"}`);
    zeile(`- ${name}: ${da.join(", ")}`);
    fehlend.push(...MODELLE.filter((m) => !ids.has(m)).map((m) => `${name}: ${m}`));
  }
  expect(fehlend, "Modelle der App, die am Endpunkt fehlen").toEqual([]);
});

test("Nachdenken: welche Werte von reasoning_effort nehmen die Modelle an (beide Endpunkte, ohne die App)", async () => {
  // Rohaufrufe, damit jede Ablehnung mit dem Text von Mistral sichtbar wird (Lauf 20261024-195614-kyc1: 422 in S2)
  zeile(`\n## Nachdenken (reasoning_effort, Rohaufruf; ✓ angenommen, ✗ abgelehnt)\n`);
  const pflichtFehler: string[] = [];
  const ziele: [string, string, (m: string, e: string) => object][] = [
    ["EU", MISTRAL_EU_URL, (m, e) => ({ model: m, max_tokens: 400, reasoning_effort: e, messages: [{ role: "user", content: "Sag nur: ok" }] })],
    [
      "Global",
      "https://api.mistral.ai/v1/conversations",
      (m, e) => ({ model: m, store: false, inputs: "Sag nur: ok", completion_args: { max_tokens: 400, reasoning_effort: e } }),
    ],
  ];
  for (const [name, url, koerper] of ziele) {
    for (const modell of MODELLE) {
      const teile: string[] = [];
      for (const wert of ["none", "low", "medium", "high", "xhigh"]) {
        const r = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${SCHLUESSEL}` },
          body: JSON.stringify(koerper(modell, wert)),
        });
        const text = r.ok ? "" : (await r.text()).slice(0, 200).replace(/\s+/g, " ");
        teile.push(r.ok ? `${wert} ✓` : `${wert} ✗ (HTTP ${r.status}: ${text})`);
        if (!r.ok && (wert === "high" || wert === "none")) pflichtFehler.push(`${name}/${modell}/${wert}`);
      }
      zeile(`- ${name} ${modell}: ${teile.join(" · ")}`);
    }
  }
  // Die App sendet nur „none“ und „high“; beide müssen angenommen werden
  expect(pflichtFehler).toEqual([]);
});

test("Anfrage wie S2 im Lauf 20261024-195614-kyc1: Medium 3.5, Aufwand „mittel“, 128 000 Ausgabetoken (beide Endpunkte)", async () => {
  zeile(`\n## Anfrage wie S2 im gescheiterten Lauf (über die App)\n`);
  const fehler: string[] = [];
  for (const endpunkt of ["eu", "global"] as const) {
    try {
      const r = await senden(endpunkt, { modell: "mistral-medium-3-5", aufwand: "medium", maxTokens: 128000 });
      zeile(`- ${endpunkt}: ok, wirksam ${JSON.stringify(r.inhalt[0])}`);
    } catch (e) {
      zeile(`- ${endpunkt}: Fehler (${kurz(e)})`);
      fehler.push(endpunkt);
    }
  }
  expect(fehler).toEqual([]);
});

test("Strukturierte Ausgabe mit dem strengen Schema (EU)", async () => {
  const schema = {
    type: "object",
    properties: {
      gegenstand: { type: "string" },
      stichtag: { type: "string" },
      sachverhalte: {
        type: "array",
        items: {
          type: "object",
          properties: {
            titel: { type: "string" },
            ereignisarten: { type: "array", items: { type: "string" } },
            sops: { type: "array", items: { type: "string" } },
          },
          required: ["titel"],
        },
      },
      bewertung: { enum: ["geringfügig", "erheblich", "kritisch"] },
      hinweise: { type: "string" },
    },
    required: ["gegenstand", "sachverhalte"],
  };
  zeile(`\n## Strukturierte Ausgabe (EU, json_schema strict)\n`);
  const fehler: string[] = [];
  for (const modell of MODELLE) {
    try {
      const r = await senden("eu", {
        modell,
        aufwand: "low",
        jsonSchema: schema,
        nachrichten: [{ role: "user", content: "Fiktive Lage: Sturm über Hessen am 14.10.2026 mit umgestürzten Bäumen und Stromausfällen. Erfasse sie." }],
      });
      const j = JSON.parse(r.text);
      const ok = typeof j.gegenstand === "string" && Array.isArray(j.sachverhalte) && "bewertung" in j && "hinweise" in j;
      zeile(`- ${modell}: ${ok ? "ok" : "unvollständig"} (${r.text.length} Zeichen, ${r.nutzung.ausgabe} Ausgabetoken)`);
      if (!ok) fehler.push(modell);
    } catch (e) {
      zeile(`- ${modell}: Fehler (${kurz(e)})`);
      fehler.push(modell);
    }
  }
  expect(fehler).toEqual([]);
});

test("PDF als document_url (EU)", async () => {
  const pdf = new jsPDF();
  pdf.text("Fiktive Lagemeldung: Pegel Dresden 6,20 m, Tendenz steigend.", 10, 20);
  const daten = Buffer.from(pdf.output("arraybuffer")).toString("base64");
  zeile(`\n## PDF (EU, document_url mit Data-URL)\n`);
  try {
    const r = await senden("eu", {
      modell: "mistral-medium-3-5",
      aufwand: "low",
      nachrichten: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: daten }, title: "Probe.pdf" },
            { type: "text", text: "Welcher Pegelstand steht im Dokument? Antworte nur mit der Zahl und Einheit." },
          ],
        },
      ],
    });
    zeile(`- Antwort: ${r.text.trim().slice(0, 120)}`);
    expect(r.text).toMatch(/6[,.]20?\s*m/);
  } catch (e) {
    zeile(`- Fehler: ${kurz(e)}`);
    throw e;
  }
});

test("Websuche und Nutzungsangaben (global, Conversations-API)", async () => {
  zeile(`\n## Websuche (global)\n`);
  try {
    const r = await senden("global", {
      modell: "mistral-medium-3-5",
      aufwand: "low",
      maxTokens: 4000,
      werkzeuge: { websuche: { maxUses: 3 } },
      nachrichten: [
        { role: "user", content: "Suche im Web nach der Startseite des Bundesamts für Bevölkerungsschutz und Katastrophenhilfe und nenne die Adresse." },
      ],
    });
    const done = r.inhalt.find((x: any) => x?.type === "conversation.response.done") as any;
    zeile(`- Suchen: ${r.suchen.length} (${r.suchen.slice(0, 3).join(" | ")})`);
    zeile(
      `- Fundstellen: ${r.fundstellen.length} (${r.fundstellen
        .slice(0, 3)
        .map((f) => f.url)
        .join(" | ")})`,
    );
    zeile(`- Nutzung (App): ${JSON.stringify(r.nutzung)}; Kosten ${r.kostenUsd?.toFixed(4)} USD`);
    zeile(`- usage (roh, für offenen Punkt 15 d): ${JSON.stringify(done?.usage ?? "nicht im Protokoll")}`);
    expect(r.suchen.length + r.fundstellen.length).toBeGreaterThan(0);
  } catch (e) {
    zeile(`- Fehler: ${kurz(e)}`);
    throw e;
  }
});
