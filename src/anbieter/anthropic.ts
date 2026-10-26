// Anthropic Messages API, direkt aus dem Browser bzw. der App (kein eigener Server).
// Doku: https://platform.claude.com/docs/en/api/messages
// - Streaming (SSE), damit lange Recherchen nicht an Zeitlimits scheitern und Fortschritt sichtbar ist
// - pause_turn: angehaltene Runden werden unverändert zurückgeschickt und fortgesetzt
// - Prompt-Caching über cache_control an den Systemblöcken
// - Websuche (web_search_20250305) und URL-Abruf (web_fetch_20250910) als Server-Werkzeuge
// - Erzwungene Websuche über tool_choice (Orientierungssuche in S1, seit 0.6.0), nur für Modelle, die es zulassen

import { kostenAnfrage } from "./preise";
import { fehlerText, NachrichtenSammler, SseLeser } from "./strom";
import {
  AnbieterFehler,
  addiereNutzung,
  leereNutzung,
  type AbrufFehler,
  type Fundstelle,
  type LlmAnbieter,
  type LlmAnfrage,
  type LlmAntwort,
  type Nutzung,
  type Zitat,
  TEXT_VERBINDUNGSABBRUCH,
} from "./typen";
import type { ZusammengesetzteNachricht } from "./strom";
import { abbruchPruefen, warte } from "./warten";

/** Verbindung riss mitten im Strom ab; enthält die bis dahin vollständigen Blöcke. */
export class StromAbbruch extends Error {
  constructor(
    public teil: ZusammengesetzteNachricht,
    public ursache: unknown,
  ) {
    super(String((ursache as any)?.message || ursache));
    this.name = "StromAbbruch";
  }
}

export const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_FORTSETZUNGEN = 6;
const MAX_WIEDERHOLUNGEN = 3;

export function anfrageKoerper(a: LlmAnfrage, nachrichten = a.nachrichten): Record<string, any> {
  const body: Record<string, any> = {
    model: a.modell,
    max_tokens: a.maxTokens,
    stream: true,
    system: a.system.map((s) => ({ type: "text", text: s.text, ...(s.cache ? { cache_control: { type: "ephemeral" } } : {}) })),
    messages: nachrichten,
  };
  const tools: any[] = [];
  if (a.werkzeuge?.websuche) {
    const w = a.werkzeuge.websuche;
    tools.push({
      type: "web_search_20250305",
      name: "web_search",
      max_uses: w.maxUses,
      ...(w.land || w.zeitzone
        ? { user_location: { type: "approximate", ...(w.land ? { country: w.land } : {}), ...(w.zeitzone ? { timezone: w.zeitzone } : {}) } }
        : {}),
    });
  }
  if (a.werkzeuge?.abruf)
    tools.push({
      type: "web_fetch_20250910",
      name: "web_fetch",
      max_uses: a.werkzeuge.abruf.maxUses,
      ...(a.werkzeuge.abruf.maxTokens ? { max_content_tokens: a.werkzeuge.abruf.maxTokens } : {}),
    });
  if (tools.length) body.tools = tools;
  // Erzwungene Websuche (Orientierungssuche in S1); nur für Modelle, die erzwungene Werkzeugnutzung zulassen
  if (a.werkzeuge?.erzwingen === "websuche" && a.werkzeuge.websuche) body.tool_choice = { type: "tool", name: "web_search" };
  const oc: Record<string, any> = {};
  if (a.aufwand) oc.effort = a.aufwand;
  if (a.jsonSchema) oc.format = { type: "json_schema", schema: a.jsonSchema };
  if (Object.keys(oc).length) body.output_config = oc;
  return body;
}

function nutzungAus(u: ReturnType<NachrichtenSammler["ergebnis"]>["nutzung"]): Nutzung {
  return {
    eingabe: u.input_tokens,
    ausgabe: u.output_tokens,
    cacheSchreiben: u.cache_creation_input_tokens,
    cacheLesen: u.cache_read_input_tokens,
    websuchen: u.web_search_requests,
    abrufe: u.web_fetch_requests,
  };
}

/** Text, Zitate, Fundstellen und Werkzeugaufrufe aus allen Inhaltsblöcken. */
export function auswerten(bloecke: any[]): {
  text: string;
  zitate: Zitat[];
  fundstellen: Fundstelle[];
  suchen: string[];
  abrufe: string[];
  abrufFehler: AbrufFehler[];
} {
  let text = "";
  const zitate: Zitat[] = [];
  const fund = new Map<string, Fundstelle>();
  const suchen: string[] = [];
  const abrufe: string[] = [];
  const abrufFehler: AbrufFehler[] = [];
  const urlZuId = new Map<string, string>();
  for (const b of bloecke) {
    if (b.type === "text") {
      text += b.text || "";
      for (const c of b.citations || []) if (c?.url) zitate.push({ url: c.url, titel: c.title || c.url, text: c.cited_text });
    } else if (b.type === "server_tool_use") {
      if (b.name === "web_search" && b.input?.query) suchen.push(String(b.input.query));
      if (b.name === "web_fetch" && b.input?.url) {
        abrufe.push(String(b.input.url));
        urlZuId.set(b.id, String(b.input.url));
      }
    } else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) if (r?.url && !fund.has(r.url)) fund.set(r.url, { url: r.url, titel: r.title || r.url, stand: r.page_age || undefined });
    } else if (b.type === "web_fetch_tool_result" && b.content?.error_code) {
      abrufFehler.push({ url: urlZuId.get(b.tool_use_id) || "(unbekannt)", code: String(b.content.error_code) });
    } else if (b.type === "web_fetch_tool_result" && b.content?.url) {
      const u = b.content.url;
      if (!fund.has(u)) fund.set(u, { url: u, titel: b.content.content?.title || u, stand: b.content.retrieved_at });
    }
  }
  return { text, zitate, fundstellen: [...fund.values()], suchen, abrufe, abrufFehler };
}

export class AnthropicAnbieter implements LlmAnbieter {
  id = "anthropic";
  constructor(
    private schluessel: string,
    private url = ANTHROPIC_URL,
    private abruf: typeof fetch = (...x) => fetch(...x),
  ) {}

  private async eineRunde(a: LlmAnfrage, nachrichten: any[]) {
    const body = anfrageKoerper(a, nachrichten);
    for (let versuch = 0; ; versuch++) {
      abbruchPruefen(a.signal);
      let antwort: Response;
      try {
        antwort = await this.abruf(this.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": this.schluessel,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify(body),
          signal: a.signal,
        });
      } catch (e: any) {
        if (e?.name === "AbortError") throw e;
        if (versuch < MAX_WIEDERHOLUNGEN) {
          a.fortschritt?.({ art: "wiederholung", grund: "Netzwerkfehler", warteMs: 2000 * (versuch + 1) });
          await warte(2000 * (versuch + 1), a.signal);
          continue;
        }
        throw new AnbieterFehler("Keine Verbindung zum Anbieter. Netz prüfen.", 0, "netz");
      }
      if (!antwort.ok) {
        let art: string | undefined;
        let meldung: string | undefined;
        try {
          const j = await antwort.json();
          art = j?.error?.type;
          meldung = j?.error?.message;
        } catch {
          /* leer */
        }
        const wiederholbar = antwort.status === 429 || antwort.status === 529 || antwort.status >= 500;
        if (wiederholbar && versuch < MAX_WIEDERHOLUNGEN) {
          const ra = Number(antwort.headers.get("retry-after"));
          const ms = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 60_000) : 4000 * 2 ** versuch;
          a.fortschritt?.({ art: "wiederholung", grund: fehlerText(art, undefined, antwort.status), warteMs: ms });
          await warte(ms, a.signal);
          continue;
        }
        throw new AnbieterFehler(fehlerText(art, meldung, antwort.status), antwort.status, art);
      }
      const sammler = new NachrichtenSammler(a.fortschritt);
      const leser = new SseLeser();
      const reader = antwort.body!.pipeThrough(new TextDecoderStream()).getReader();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          for (const ev of leser.lies(value)) sammler.verarbeite(ev);
        }
      } catch (e: any) {
        if (e?.name === "AbortError" || a.signal?.aborted) throw e;
        if (e instanceof AnbieterFehler) throw e;
        throw new StromAbbruch(sammler.teil(), e);
      }
      const erg = sammler.ergebnis();
      // Strom endete ohne message_stop/stop_reason: ebenfalls als Abbruch behandeln
      if (!erg.stopGrund) throw new StromAbbruch(sammler.teil(), new Error("Strom ohne Abschluss beendet"));
      return erg;
    }
  }

  async senden(a: LlmAnfrage): Promise<LlmAntwort> {
    const start = Date.now();
    let nachrichten: any[] = [...a.nachrichten];
    let gesamt = leereNutzung();
    let kosten: number | null = 0;
    const alleBloecke: any[] = [];
    let letzte: ReturnType<NachrichtenSammler["ergebnis"]> | undefined;
    let runden = 0;
    let abbrueche = 0;
    let fortsetzungNachAbbruch = false;
    const anfangsNachrichten = nachrichten;
    for (;;) {
      runden++;
      try {
        letzte = await this.eineRunde(a, nachrichten);
      } catch (e: any) {
        // Abgerissene Verbindung: Teilantwort fortsetzen, sonst Anfrage neu stellen (je höchstens zweimal)
        const ersterFehlerDerFortsetzung = fortsetzungNachAbbruch && e instanceof AnbieterFehler && e.status === 400;
        if (!(e instanceof StromAbbruch) && !ersterFehlerDerFortsetzung) throw e;
        if (++abbrueche > 2) {
          const teil = e instanceof StromAbbruch ? [...alleBloecke, ...e.teil.inhalt] : alleBloecke;
          throw new AnbieterFehler(TEXT_VERBINDUNGSABBRUCH, 0, "verbindung", teil);
        }
        if (e instanceof StromAbbruch) {
          const n = nutzungAus(e.teil.nutzung);
          gesamt = addiereNutzung(gesamt, n);
          const k = kostenAnfrage(a.modell, n);
          kosten = kosten === null || k === null ? null : kosten + k;
          const hatErgebnisse = e.teil.inhalt.some((b) => typeof b.tool_use_id === "string");
          if (hatErgebnisse) {
            a.fortschritt?.({ art: "wiederholung", grund: "Verbindung unterbrochen; die Recherche wird fortgesetzt.", warteMs: 1500 });
            await warte(1500, a.signal);
            alleBloecke.push(...e.teil.inhalt);
            const vorher = nachrichten[nachrichten.length - 1];
            nachrichten =
              vorher?.role === "assistant"
                ? [...nachrichten.slice(0, -1), { role: "assistant", content: [...(vorher.content as any[]), ...e.teil.inhalt] }]
                : [...nachrichten, { role: "assistant", content: e.teil.inhalt }];
            fortsetzungNachAbbruch = true;
            continue;
          }
        }
        // Ohne verwertbare Teilantwort (oder Fortsetzung abgelehnt): von vorn
        a.fortschritt?.({ art: "wiederholung", grund: "Verbindung unterbrochen; die Anfrage wird neu gestellt.", warteMs: 1500 });
        await warte(1500, a.signal);
        alleBloecke.length = 0;
        nachrichten = anfangsNachrichten;
        fortsetzungNachAbbruch = false;
        continue;
      }
      const n = nutzungAus(letzte.nutzung);
      gesamt = addiereNutzung(gesamt, n);
      const k = kostenAnfrage(a.modell, n);
      kosten = kosten === null || k === null ? null : kosten + k;
      alleBloecke.push(...letzte.inhalt);
      if (letzte.stopGrund === "pause_turn" && runden <= MAX_FORTSETZUNGEN) {
        a.fortschritt?.({ art: "fortsetzung", runde: runden });
        // Angehaltene Runde unverändert zurückgeben; die API setzt sie fort.
        const vorher = nachrichten[nachrichten.length - 1];
        if (vorher?.role === "assistant") {
          nachrichten = [...nachrichten.slice(0, -1), { role: "assistant", content: [...(vorher.content as any[]), ...letzte.inhalt] }];
        } else {
          nachrichten = [...nachrichten, { role: "assistant", content: letzte.inhalt }];
        }
        continue;
      }
      break;
    }
    const aus = auswerten(alleBloecke);
    if (letzte.stopGrund === "refusal") throw new AnbieterFehler("Das Modell hat die Bearbeitung abgelehnt.", 200, "refusal");
    return {
      modell: letzte.modell || a.modell,
      ...aus,
      inhalt: alleBloecke,
      nutzung: gesamt,
      kostenUsd: kosten,
      stopGrund: letzte.stopGrund,
      dauerMs: Date.now() - start,
      runden,
    };
  }
}
