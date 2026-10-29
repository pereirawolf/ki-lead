// OpenAI Responses API, direkt aus dem Browser bzw. der App (kein eigener Server).
// Doku: https://developers.openai.com/api/docs (Responses, Websuche, Structured Outputs)
// - Streaming (SSE) für Fortschritt; das Endergebnis kommt mit response.completed/incomplete/failed
// - Websuche als eingebautes Werkzeug „web_search“; Seiten öffnet das Modell selbst (open_page),
//   ein eigenes Abrufwerkzeug wie bei Anthropic gibt es nicht. max_tool_calls begrenzt beides zusammen.
// - Structured Outputs über text.format (json_schema, strict)
// - store: false – Antworten werden beim Anbieter nicht für spätere Abrufe gespeichert
// - Basisadresse wählbar (seit 0.6.3, TP-2026-W44-26): Ollama nutzt denselben Adapter über seine OpenAI-kompatible
//   Schnittstelle (src/anbieter/ollama.ts), mit eigenen Fehlertexten, ohne Schlüssel und ohne Aufwand

import { fehlerJson, LeseFehler, mitNeustart, mitWiederholung, sseLesen, type Fehlerregeln } from "./http";
import { kostenAnfrage } from "./preise";
import { strengesSchema } from "./schema";
import {
  AnbieterFehler,
  addiereNutzung,
  leereNutzung,
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

/** Basisadresse der OpenAI-API; der Adapter hängt „/responses“ an (seit 0.6.3, TP-2026-W44-26) */
export const OPENAI_BASIS_URL = "https://api.openai.com/v1";
export const OPENAI_URL = `${OPENAI_BASIS_URL}/responses`;
/** Seit 0.6.2 in schema.ts (TP-2026-W44-03); hier weiter exportiert */
export { strengesSchema };

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

/** Abweichungen eines OpenAI-kompatiblen Dienstes (seit 0.6.3, TP-2026-W44-26: Ollama) */
export interface OpenAiVariante {
  id: string;
  fehlerText: (status: number, code?: string, meldung?: string) => string;
  netzFehler: string;
  /** Aufwand (reasoning.effort) senden; Ollama: nein, das lokale Modell bestimmt */
  aufwand: boolean;
}

const OPENAI: OpenAiVariante = { id: "openai", fehlerText: fehlerTextOpenAi, netzFehler: "Keine Verbindung zu OpenAI. Netz prüfen.", aufwand: true };

export class OpenAiAnbieter implements LlmAnbieter {
  id: string;
  private url: string;
  /**
   * @param basisUrl Basisadresse der Schnittstelle ohne „/responses“ (Vorgabe: OpenAI); seit 0.6.3 (TP-2026-W44-26)
   * @param variante Fehlertexte und Eigenheiten eines OpenAI-kompatiblen Dienstes
   */
  constructor(
    private schluessel: string,
    basisUrl = OPENAI_BASIS_URL,
    private abruf: typeof fetch = (...x) => fetch(...x),
    private variante: OpenAiVariante = OPENAI,
  ) {
    this.id = variante.id;
    this.url = `${basisUrl.replace(/\/+$/, "")}/responses`;
  }

  /** Fehlerregeln der Responses API für die gemeinsame Wiederholung (http.ts) */
  private regeln(): Fehlerregeln {
    return {
      fehlerAus: async (antwort) => {
        const j = await fehlerJson(antwort);
        const e = typeof j?.error === "string" ? { message: j.error } : j?.error;
        return { code: e?.code || e?.type, meldung: e?.message, roh: JSON.stringify(j ?? "") };
      },
      wiederholbar: (status, f) => (status === 429 && f.code !== "insufficient_quota") || status >= 500,
      fehlerText: this.variante.fehlerText,
      netzFehler: this.variante.netzFehler,
    };
  }

  /** Eine Anfrage mit Wiederholung bei Überlastung; liefert das vollständige Antwortobjekt. */
  private async eineRunde(a: LlmAnfrage): Promise<any> {
    const body = JSON.stringify(anfrageKoerperOpenAi(this.variante.aufwand ? a : { ...a, aufwand: undefined }));
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.schluessel) headers.authorization = `Bearer ${this.schluessel}`;
    const antwort = await mitWiederholung(
      a,
      () =>
        this.abruf(this.url, {
          method: "POST",
          headers,
          body,
          signal: a.signal,
        }),
      this.regeln(),
    );
    return this.stromLesen(antwort, a);
  }

  private async stromLesen(antwort: Response, a: LlmAnfrage): Promise<any> {
    let zeichen = 0;
    let ende: any;
    await sseLesen(antwort, a.signal, (ev) => {
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
        throw new AnbieterFehler(this.variante.fehlerText(0, d.code, d.message), undefined, d.code || "error");
      }
    });
    if (!ende) throw new LeseFehler(new Error("Strom ohne Abschluss beendet"));
    return ende;
  }

  async senden(a: LlmAnfrage): Promise<LlmAntwort> {
    const start = Date.now();
    let gesamt = leereNutzung();
    const r: any = await mitNeustart(a, () => this.eineRunde(a));
    if (r.status === "failed")
      throw new AnbieterFehler(this.variante.fehlerText(0, r.error?.code, r.error?.message), undefined, r.error?.code || "failed", r.output);
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
