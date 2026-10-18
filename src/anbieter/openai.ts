// OpenAI Responses API, direkt aus dem Browser bzw. der App (kein eigener Server).
// Doku: https://developers.openai.com/api/docs (Responses, Websuche, Structured Outputs)
// - Streaming (SSE) für Fortschritt; das Endergebnis kommt mit response.completed/incomplete/failed
// - Websuche als eingebautes Werkzeug „web_search“; Seiten öffnet das Modell selbst (open_page),
//   ein eigenes Abrufwerkzeug wie bei Anthropic gibt es nicht. max_tool_calls begrenzt beides zusammen.
// - Structured Outputs über text.format (json_schema, strict)
// - store: false – Antworten werden beim Anbieter nicht für spätere Abrufe gespeichert

import { kostenAnfrage } from "./preise";
import { SseLeser } from "./strom";
import {
  AnbieterFehler,
  addiereNutzung,
  istVerbindungsabbruch,
  leereNutzung,
  TEXT_VERBINDUNGSABBRUCH,
  type AbrufFehler,
  type Fundstelle,
  type Inhaltsblock,
  type LlmAnbieter,
  type LlmAnfrage,
  type LlmAntwort,
  type Nachricht,
  type Nutzung,
  type Zitat,
} from "./typen";

export const OPENAI_URL = "https://api.openai.com/v1/responses";
const MAX_WIEDERHOLUNGEN = 3;
const MAX_NEUSTARTS = 2;

/** Strenges Schema für Structured Outputs: jedes Objekt geschlossen, alle Felder Pflicht (optionale nullable). */
export function strengesSchema(s: any): any {
  if (Array.isArray(s)) return s.map(strengesSchema);
  if (!s || typeof s !== "object") return s;
  const out: any = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === "properties" && v && typeof v === "object") {
      out.properties = Object.fromEntries(Object.entries(v as object).map(([pk, pv]) => [pk, strengesSchema(pv)]));
    } else if (k === "items" || k === "anyOf" || k === "$defs" || k === "definitions") {
      out[k] =
        k === "$defs" || k === "definitions" ? Object.fromEntries(Object.entries(v as object).map(([dk, dv]) => [dk, strengesSchema(dv)])) : strengesSchema(v);
    } else out[k] = v;
  }
  if (out.type === "object" || out.properties) {
    const alle = Object.keys(out.properties || {});
    const pflicht = new Set<string>(out.required || []);
    for (const key of alle) {
      if (pflicht.has(key)) continue;
      const p = out.properties[key];
      const t = p.type;
      if (typeof t === "string") out.properties[key] = { ...p, type: [t, "null"] };
      else if (Array.isArray(t) && !t.includes("null")) out.properties[key] = { ...p, type: [...t, "null"] };
      else if (!t) out.properties[key] = { anyOf: [p, { type: "null" }] };
    }
    out.required = alle;
    out.additionalProperties = false;
  }
  return out;
}

function inhaltZuOpenAi(c: string | Inhaltsblock[], rolle: Nachricht["role"]): any[] {
  const textTyp = rolle === "assistant" ? "output_text" : "input_text";
  if (typeof c === "string") return [{ type: textTyp, text: c }];
  const out: any[] = [];
  for (const b of c as any[]) {
    if (b?.type === "text") out.push({ type: textTyp, text: String(b.text ?? "") });
    else if (b?.type === "document" && b.source?.type === "base64") {
      const name = String(b.title || "dokument").replace(/[^\w.\-äöüÄÖÜß ]+/g, "_");
      out.push({
        type: "input_file",
        filename: /\.pdf$/i.test(name) ? name : `${name}.pdf`,
        file_data: `data:${b.source.media_type || "application/pdf"};base64,${b.source.data}`,
      });
    } else if (b?.type === "document" && b.source?.type === "text") {
      out.push({ type: textTyp, text: `${b.title ? `# ${b.title}\n\n` : ""}${b.source.data}` });
    }
  }
  return out;
}

export function anfrageKoerperOpenAi(a: LlmAnfrage): Record<string, any> {
  const body: Record<string, any> = {
    model: a.modell,
    instructions: a.system.map((s) => s.text).join("\n\n"),
    input: a.nachrichten.map((n) => ({ role: n.role, content: inhaltZuOpenAi(n.content, n.role) })),
    max_output_tokens: a.maxTokens,
    stream: true,
    store: false,
  };
  if (a.aufwand) body.reasoning = { effort: a.aufwand };
  const w = a.werkzeuge;
  if (w?.websuche || w?.abruf) {
    const land = w.websuche?.land;
    const zeitzone = w.websuche?.zeitzone;
    body.tools = [
      {
        type: "web_search",
        ...(land || zeitzone
          ? { user_location: { type: "approximate", ...(land ? { country: land } : {}), ...(zeitzone ? { timezone: zeitzone } : {}) } }
          : {}),
      },
    ];
    body.max_tool_calls = (w.websuche?.maxUses || 0) + (w.abruf?.maxUses || 0) || undefined;
    body.include = ["web_search_call.action.sources"];
  }
  if (a.jsonSchema) body.text = { format: { type: "json_schema", name: "antwort", schema: strengesSchema(a.jsonSchema), strict: true } };
  return body;
}

export function fehlerTextOpenAi(status: number, code?: string, meldung?: string): string {
  const m = meldung ? ` (${meldung})` : "";
  if (status === 401 || code === "invalid_api_key") return "Der OpenAI-Schlüssel wurde abgelehnt. Bitte unter „Einstellungen“ prüfen." + m;
  if (code === "insufficient_quota") return "Beim OpenAI-Konto ist kein Guthaben oder Kontingent mehr verfügbar." + m;
  if (status === 403) return "Der OpenAI-Schlüssel hat keine Berechtigung für dieses Modell oder Werkzeug." + m;
  if (status === 404 || code === "model_not_found") return "Das Modell ist für diesen OpenAI-Schlüssel nicht verfügbar." + m;
  if (status === 429) return "Das Anfragelimit bei OpenAI ist erreicht. Bitte kurz warten." + m;
  if (status === 400) return "Die Anfrage wurde von OpenAI abgelehnt" + m + ".";
  if (status >= 500) return "OpenAI ist gerade gestört oder überlastet. Bitte später erneut versuchen." + m;
  return `Fehler bei OpenAI${status ? ` (HTTP ${status})` : ""}${m}.`;
}

/** Text, Zitate, Fundstellen und Werkzeugaufrufe aus den Ausgabeelementen einer Antwort. */
export function auswertenOpenAi(ausgabe: any[]): {
  text: string;
  zitate: Zitat[];
  fundstellen: Fundstelle[];
  suchen: string[];
  abrufe: string[];
  abrufFehler: AbrufFehler[];
  abgelehnt: boolean;
} {
  let text = "";
  let abgelehnt = false;
  const zitate: Zitat[] = [];
  const fund = new Map<string, Fundstelle>();
  const suchen: string[] = [];
  const abrufe: string[] = [];
  for (const item of ausgabe || []) {
    if (item?.type === "message") {
      for (const c of item.content || []) {
        if (c?.type === "output_text") {
          text += c.text || "";
          for (const an of c.annotations || []) {
            if (an?.type === "url_citation" && an.url) {
              zitate.push({ url: an.url, titel: an.title || an.url });
              if (!fund.has(an.url)) fund.set(an.url, { url: an.url, titel: an.title || an.url });
            }
          }
        } else if (c?.type === "refusal") abgelehnt = true;
      }
    } else if (item?.type === "web_search_call") {
      const act = item.action || {};
      if (act.type === "search") {
        const qs = Array.isArray(act.queries) && act.queries.length ? act.queries : act.query ? [act.query] : [];
        suchen.push(...qs.map(String));
        for (const s of act.sources || []) if (s?.url && !fund.has(s.url)) fund.set(s.url, { url: s.url, titel: s.title || s.url });
      } else if ((act.type === "open_page" || act.type === "find_in_page") && act.url) abrufe.push(String(act.url));
    }
  }
  return { text, zitate, fundstellen: [...fund.values()], suchen, abrufe, abrufFehler: [], abgelehnt };
}

export function nutzungOpenAi(u: any, ausgabe: any[]): Nutzung {
  const gecacht = u?.input_tokens_details?.cached_tokens || 0;
  const aufrufe = (ausgabe || []).filter((i) => i?.type === "web_search_call");
  return {
    eingabe: Math.max(0, (u?.input_tokens || 0) - gecacht),
    ausgabe: u?.output_tokens || 0,
    cacheSchreiben: 0,
    cacheLesen: gecacht,
    websuchen: aufrufe.filter((i) => (i.action?.type || "search") === "search").length,
    abrufe: aufrufe.filter((i) => i.action && i.action.type !== "search").length,
  };
}

const warte = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((ok, nein) => {
    const t = setTimeout(ok, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      nein(new DOMException("Abgebrochen", "AbortError"));
    });
  });

class StromEnde extends Error {}

export class OpenAiAnbieter implements LlmAnbieter {
  id = "openai";
  constructor(
    private schluessel: string,
    private url = OPENAI_URL,
    private abruf: typeof fetch = (...x) => fetch(...x),
  ) {}

  /** Eine Anfrage mit Wiederholung bei Überlastung; liefert das vollständige Antwortobjekt. */
  private async eineRunde(a: LlmAnfrage): Promise<any> {
    const body = anfrageKoerperOpenAi(a);
    for (let versuch = 0; ; versuch++) {
      let antwort: Response;
      try {
        antwort = await this.abruf(this.url, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${this.schluessel}` },
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
        throw new AnbieterFehler("Keine Verbindung zu OpenAI. Netz prüfen.", 0, "netz");
      }
      if (!antwort.ok) {
        let code: string | undefined;
        let meldung: string | undefined;
        try {
          const j = await antwort.json();
          code = j?.error?.code || j?.error?.type;
          meldung = j?.error?.message;
        } catch {
          /* leer */
        }
        const wiederholbar = (antwort.status === 429 && code !== "insufficient_quota") || antwort.status >= 500;
        if (wiederholbar && versuch < MAX_WIEDERHOLUNGEN) {
          const ra = Number(antwort.headers.get("retry-after"));
          const ms = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 60_000) : 4000 * 2 ** versuch;
          a.fortschritt?.({ art: "wiederholung", grund: fehlerTextOpenAi(antwort.status, code), warteMs: ms });
          await warte(ms, a.signal);
          continue;
        }
        throw new AnbieterFehler(fehlerTextOpenAi(antwort.status, code, meldung), antwort.status, code);
      }
      return this.stromLesen(antwort, a);
    }
  }

  private async stromLesen(antwort: Response, a: LlmAnfrage): Promise<any> {
    const leser = new SseLeser();
    const reader = antwort.body!.pipeThrough(new TextDecoderStream()).getReader();
    let zeichen = 0;
    let ende: any;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const ev of leser.lies(value)) {
          const d = ev.data;
          const typ = d?.type || ev.event;
          if (typ === "response.output_text.delta") {
            zeichen += String(d.delta || "").length;
            a.fortschritt?.({ art: "schreibt", zeichen });
          } else if (typ === "response.output_item.added" && d.item?.type === "reasoning") {
            a.fortschritt?.({ art: "denkt" });
          } else if (typ === "response.output_item.done" && d.item?.type === "web_search_call") {
            const act = d.item.action || {};
            if (act.type === "search") a.fortschritt?.({ art: "suche", text: String((act.queries && act.queries[0]) || act.query || "Websuche") });
            else if (act.url) a.fortschritt?.({ art: "abruf", text: String(act.url) });
          } else if (typ === "response.completed" || typ === "response.incomplete" || typ === "response.failed") {
            ende = d.response;
          } else if (typ === "error") {
            throw new AnbieterFehler(fehlerTextOpenAi(0, d.code, d.message), undefined, d.code || "error");
          }
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError" || a.signal?.aborted) throw e;
      if (e instanceof AnbieterFehler) throw e;
      throw new StromEnde(String(e?.message || e));
    }
    if (!ende) throw new StromEnde("Strom ohne Abschluss beendet");
    return ende;
  }

  async senden(a: LlmAnfrage): Promise<LlmAntwort> {
    const start = Date.now();
    let gesamt = leereNutzung();
    let r: any;
    for (let neustart = 0; ; neustart++) {
      try {
        r = await this.eineRunde(a);
        break;
      } catch (e: any) {
        const abbruch = e instanceof StromEnde || (!(e instanceof AnbieterFehler) && istVerbindungsabbruch(e) && e?.name !== "AbortError");
        if (!abbruch) throw e;
        if (neustart >= MAX_NEUSTARTS) throw new AnbieterFehler(TEXT_VERBINDUNGSABBRUCH, 0, "verbindung");
        a.fortschritt?.({ art: "wiederholung", grund: "Verbindung unterbrochen; die Anfrage wird neu gestellt.", warteMs: 1500 });
        await warte(1500, a.signal);
      }
    }
    if (r.status === "failed") throw new AnbieterFehler(fehlerTextOpenAi(0, r.error?.code, r.error?.message), undefined, r.error?.code || "failed", r.output);
    const ausgabe: any[] = r.output || [];
    const n = nutzungOpenAi(r.usage, ausgabe);
    gesamt = addiereNutzung(gesamt, n);
    const aus = auswertenOpenAi(ausgabe);
    const grund = r.incomplete_details?.reason;
    if (aus.abgelehnt || grund === "content_filter") throw new AnbieterFehler("Das Modell hat die Bearbeitung abgelehnt.", 200, "refusal", ausgabe);
    const { abgelehnt: _a, ...rest } = aus;
    return {
      modell: r.model || a.modell,
      ...rest,
      inhalt: ausgabe,
      nutzung: gesamt,
      kostenUsd: kostenAnfrage(a.modell, gesamt),
      stopGrund: r.status === "incomplete" ? (grund === "max_output_tokens" ? "max_tokens" : String(grund || "incomplete")) : "end_turn",
      dauerMs: Date.now() - start,
      runden: 1,
    };
  }
}
