// Mistral AI, direkt aus dem Browser bzw. der App (kein eigener Server). Zwei Wege (seit 0.5.6, Vorgabe „eu“):
//
// - „eu“: regionaler Endpunkt api.eu.mistral.ai, Chat Completions (POST /v1/chat/completions). Verarbeitung in
//   Rechenzentren in EU und EFTA, 10 % Aufschlag auf die Listenpreise. Eingebaute Werkzeuge (Websuche) und
//   zustandsbehaftete Funktionen gibt es dort nicht; Doku: https://docs.mistral.ai/inference/regional-inference.
//   Chat Completions fällt unter Mistrals Zero Data Retention (auf Antrag).
// - „global“: api.mistral.ai, Conversations API (POST /v1/conversations), mit eingebauter Websuche.
//
// Zum globalen Weg (Conversations API):
// Doku: https://docs.mistral.ai/api (Conversations), https://docs.mistral.ai/agents/tools (eingebaute Werkzeuge)
//
// Warum nicht /v1/chat/completions: Die eingebaute Websuche („web_search“) gibt es laut Mistral nur in der
// Conversations- und der Agents-API, weil nur deren Antworten die Fundstellen (tool_reference) enthalten.
// Für S1, S3 und die Management Summary ohne Recherche wäre Chat Completions ebenso möglich; ein einziger Weg
// hält den Adapter klein.
//
// - Streaming (SSE) für Fortschritt; Ereignisse: message.output.delta, tool.execution.started/done,
//   conversation.response.done (mit usage) und conversation.response.error
// - Websuche als eingebautes Werkzeug „web_search“; eine Höchstzahl je Anfrage kennt die API nicht und ein eigenes
//   Abrufwerkzeug gibt es nicht. Die App zählt die Suchen und schreibt sie ins Laufprotokoll.
// - Structured Outputs über completion_args.response_format (json_schema, strict) mit dem strengen Schema wie bei
//   OpenAI (geschlossene Objekte, alle Felder Pflicht, optionale nullable)
// - Nachdenken über completion_args.reasoning_effort; lehnt das Modell eine Stufe ab, wiederholt die App einmal mit
//   der groben Stufe „high“ bzw. „none“
// - store: false – die Unterhaltung wird beim Anbieter nicht für spätere Abrufe angelegt
//
// Stand der Schnittstelle: 24.10.2026, nach Doku und Typdefinitionen des offiziellen SDK @mistralai/mistralai 3.2.0.
// Nicht mit einem echten Schlüssel geprüft; siehe „Offene Punkte“ in docs/SPEZIFIKATION.md.

import { strengesSchema } from "./openai";
import { kostenAnfrage } from "./preise";
import { SseLeser } from "./strom";
import {
  AnbieterFehler,
  istVerbindungsabbruch,
  leereNutzung,
  TEXT_VERBINDUNGSABBRUCH,
  type Aufwand,
  type Fundstelle,
  type Inhaltsblock,
  type LlmAnbieter,
  type LlmAnfrage,
  type LlmAntwort,
  type Nutzung,
  type Zitat,
} from "./typen";
import { abbruchPruefen, warte } from "./warten";

export type MistralEndpunkt = "eu" | "global";

export const MISTRAL_URL = "https://api.mistral.ai/v1/conversations";
export const MISTRAL_EU_URL = "https://api.eu.mistral.ai/v1/chat/completions";
/** Aufschlag des regionalen Endpunkts auf alle Tokenpreise (Mistral: 1,1 × Listenpreis) */
export const MISTRAL_EU_FAKTOR = 1.1;

/** Kann der Weg Werkzeuge? Über den EU-Endpunkt gibt es keine Websuche und keinen Seitenabruf. */
export function mistralWerkzeuge(endpunkt: MistralEndpunkt): { websuche: boolean; abruf: boolean } {
  return { websuche: endpunkt === "global", abruf: false };
}
const MAX_WIEDERHOLUNGEN = 3;
const MAX_NEUSTARTS = 2;

/** Werte von reasoning_effort laut API: none, minimal, low, medium, high, xhigh. „max“ der App wird zu „xhigh“. */
export const MISTRAL_AUFWAND: Record<Aufwand, string> = { low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "xhigh" };

/** Grobe Stufe, falls ein Modell die feine ablehnt (die Doku zum Nachdenken nennt nur „high“ und „none“). */
export function groberAufwand(a: Aufwand): string {
  return a === "low" ? "none" : "high";
}

function inhaltZuMistral(c: string | Inhaltsblock[]): string | any[] {
  if (typeof c === "string") return c;
  const out: any[] = [];
  for (const b of c as any[]) {
    if (b?.type === "text") out.push({ type: "text", text: String(b.text ?? "") });
    else if (b?.type === "document" && b.source?.type === "base64") {
      const name = String(b.title || "dokument").replace(/[^\w.\-äöüÄÖÜß ]+/g, "_");
      out.push({
        type: "document_url",
        document_url: `data:${b.source.media_type || "application/pdf"};base64,${b.source.data}`,
        document_name: /\.pdf$/i.test(name) ? name : `${name}.pdf`,
      });
    } else if (b?.type === "document" && b.source?.type === "text") {
      out.push({ type: "text", text: `${b.title ? `# ${b.title}\n\n` : ""}${b.source.data}` });
    }
  }
  return out;
}

export function anfrageKoerperMistral(a: LlmAnfrage, aufwand: string | undefined = a.aufwand && MISTRAL_AUFWAND[a.aufwand]): Record<string, any> {
  const args: Record<string, any> = { max_tokens: a.maxTokens };
  if (aufwand) args.reasoning_effort = aufwand;
  if (a.jsonSchema) args.response_format = { type: "json_schema", json_schema: { name: "antwort", schema: strengesSchema(a.jsonSchema), strict: true } };
  const body: Record<string, any> = {
    model: a.modell,
    instructions: a.system.map((s) => s.text).join("\n\n"),
    inputs: a.nachrichten.map((n) => ({ type: "message.input", role: n.role, content: inhaltZuMistral(n.content) })),
    completion_args: args,
    stream: true,
    store: false,
  };
  // Nur die Websuche; ein Seitenabruf allein (Websuche 0) ist bei Mistral nicht möglich.
  if (a.werkzeuge?.websuche) body.tools = [{ type: "web_search" }];
  return body;
}

/** Anfrage an Chat Completions (EU-Endpunkt): System als erste Nachricht, keine Werkzeuge. */
export function anfrageKoerperMistralChat(a: LlmAnfrage, aufwand: string | undefined = a.aufwand && MISTRAL_AUFWAND[a.aufwand]): Record<string, any> {
  const system = a.system.map((s) => s.text).join("\n\n");
  const body: Record<string, any> = {
    model: a.modell,
    messages: [...(system ? [{ role: "system", content: system }] : []), ...a.nachrichten.map((n) => ({ role: n.role, content: inhaltZuMistral(n.content) }))],
    max_tokens: a.maxTokens,
    stream: true,
  };
  if (aufwand) body.reasoning_effort = aufwand;
  if (a.jsonSchema) body.response_format = { type: "json_schema", json_schema: { name: "antwort", schema: strengesSchema(a.jsonSchema), strict: true } };
  return body;
}

export function fehlerTextMistral(status: number, code?: string, meldung?: string): string {
  const m = meldung ? ` (${meldung})` : "";
  if (status === 401) return "Der Mistral-Schlüssel wurde abgelehnt. Bitte unter „Einstellungen“ prüfen." + m;
  if (status === 402) return "Beim Mistral-Konto ist kein Guthaben oder kein Zahlungsweg hinterlegt." + m;
  if (status === 403) return "Der Mistral-Schlüssel hat keine Berechtigung für dieses Modell oder Werkzeug." + m;
  if (status === 404) return "Das Modell ist für diesen Mistral-Schlüssel nicht verfügbar." + m;
  if (status === 429) return "Das Anfragelimit bei Mistral ist erreicht. Bitte kurz warten." + m;
  if (status === 400 || status === 422) return "Die Anfrage wurde von Mistral abgelehnt" + m + ".";
  if (status >= 500) return "Mistral ist gerade gestört oder überlastet. Bitte später erneut versuchen." + m;
  return `Fehler bei Mistral${status ? ` (HTTP ${status})` : ""}${code ? ` [${code}]` : ""}${m}.`;
}

/** Meldung und Kennung aus einer Fehlerantwort (Mistral liefert sie flach, als „detail“ oder unter „error“). */
function fehlerAus(j: any): { code?: string; meldung?: string } {
  const e = j?.error && typeof j.error === "object" ? j.error : j;
  const detail = Array.isArray(e?.detail) ? e.detail.map((d: any) => d?.msg || JSON.stringify(d)).join("; ") : e?.detail;
  const code = e?.code ?? e?.type;
  return { code: code === undefined || code === null ? undefined : String(code), meldung: e?.message || (typeof detail === "string" ? detail : undefined) };
}

/** Lehnt die Antwort die gewählte Stufe des Nachdenkens ab? */
function aufwandAbgelehnt(status: number, meldung?: string): boolean {
  return (status === 400 || status === 422) && /reasoning/i.test(meldung || "");
}

/** Sammelt die Ereignisse eines Antwortstroms. */
export class MistralSammler {
  modell = "";
  text = "";
  zitate: Zitat[] = [];
  private fund = new Map<string, Fundstelle>();
  suchen: string[] = [];
  /** Inhalte wie empfangen (für das Laufprotokoll) */
  inhalt: any[] = [];
  nutzung: any = null;
  fertig = false;
  /** Abbruchgrund (nur Chat Completions: stop, length, error, tool_calls) */
  endgrund?: string;

  constructor(private fortschritt?: LlmAnfrage["fortschritt"]) {}

  get fundstellen(): Fundstelle[] {
    return [...this.fund.values()];
  }

  private referenz(r: any) {
    if (!r?.url) return;
    const titel = r.title || r.url;
    this.zitate.push({ url: r.url, titel, ...(r.description ? { text: String(r.description) } : {}) });
    if (!this.fund.has(r.url)) this.fund.set(r.url, { url: r.url, titel });
  }

  private teil(c: any) {
    if (typeof c === "string") {
      this.text += c;
      this.fortschritt?.({ art: "schreibt", zeichen: this.text.length });
    } else if (Array.isArray(c)) c.forEach((x) => this.teil(x));
    else if (c?.type === "text") {
      this.text += String(c.text ?? "");
      this.fortschritt?.({ art: "schreibt", zeichen: this.text.length });
    } else if (c?.type === "thinking") this.fortschritt?.({ art: "denkt" });
    else if (c?.type === "tool_reference") this.referenz(c);
  }

  /** Ein Stück aus dem Strom von Chat Completions (EU-Endpunkt) */
  verarbeiteChat(d: any) {
    if (d?.object === "error" || (d?.error && !d?.choices)) {
      const f = fehlerAus(d);
      throw new AnbieterFehler(fehlerTextMistral(0, f.code, f.meldung), undefined, "error", this.inhalt);
    }
    if (d.model) this.modell = d.model;
    if (d.usage) this.nutzung = d.usage;
    const c = d.choices?.[0];
    if (!c) return;
    if (c.delta?.content !== undefined && c.delta?.content !== null) this.teil(c.delta.content);
    if (c.finish_reason) {
      this.endgrund = String(c.finish_reason);
      if (this.endgrund === "error") throw new AnbieterFehler(fehlerTextMistral(0, "error", "Abbruch im Antwortstrom"), undefined, "error", this.inhalt);
    }
  }

  verarbeite(d: any, event: string) {
    const typ = d?.type || event;
    if (typ === "message.output.delta") {
      if (d.model) this.modell = d.model;
      this.inhalt.push(d);
      this.teil(d.content);
    } else if (typ === "tool.execution.started") {
      this.inhalt.push(d);
      if (/^web_search/.test(String(d.name || ""))) {
        let frage = "";
        try {
          const args = typeof d.arguments === "string" ? JSON.parse(d.arguments) : d.arguments;
          frage = String(args?.query ?? args?.q ?? "");
        } catch {
          frage = String(d.arguments || "");
        }
        this.suchen.push(frage || "Websuche");
        this.fortschritt?.({ art: "suche", text: frage || "Websuche" });
      }
    } else if (typ === "tool.execution.done") {
      this.inhalt.push(d);
    } else if (typ === "conversation.response.done") {
      this.inhalt.push(d);
      this.nutzung = d.usage || {};
      this.fertig = true;
    } else if (typ === "conversation.response.error") {
      const status = Number(d.code) || 0;
      throw new AnbieterFehler(fehlerTextMistral(status, String(d.code ?? ""), d.message), status || undefined, "error", this.inhalt);
    }
  }
}

/**
 * Nutzung nach den Angaben von Mistral. Ob connector_tokens (Text der Suchergebnisse) schon in prompt_tokens stecken,
 * sagt die Doku nicht; die App zählt sie vorsichtig zur Eingabe. Zwischengespeicherte Token nennt die
 * Conversations-API nicht.
 */
/** Nutzung bei Chat Completions; zwischengespeicherte Token, soweit Mistral sie meldet */
export function nutzungMistralChat(u: any): Nutzung {
  const gecacht = u?.prompt_tokens_details?.cached_tokens || 0;
  return { ...leereNutzung(), eingabe: Math.max(0, (u?.prompt_tokens || 0) - gecacht), cacheLesen: gecacht, ausgabe: u?.completion_tokens || 0 };
}

export function nutzungMistral(u: any, suchenGezaehlt: number): Nutzung {
  const ausConnectors = Object.entries(u?.connectors || {})
    .filter(([k]) => /^web_search/.test(k))
    .reduce((s, [, v]) => s + (Number(v) || 0), 0);
  return {
    ...leereNutzung(),
    eingabe: (u?.prompt_tokens || 0) + (u?.connector_tokens || 0),
    ausgabe: u?.completion_tokens || 0,
    websuchen: Math.max(suchenGezaehlt, ausConnectors),
  };
}

class StromEnde extends Error {}

export class MistralAnbieter implements LlmAnbieter {
  id = "mistral";
  private url: string;
  constructor(
    private schluessel: string,
    url?: string,
    private abruf: typeof fetch = (...x) => fetch(...x),
    private endpunkt: MistralEndpunkt = "eu",
  ) {
    this.url = url ?? (endpunkt === "eu" ? MISTRAL_EU_URL : MISTRAL_URL);
  }

  private koerper(a: LlmAnfrage, aufwand: string | undefined) {
    return this.endpunkt === "eu" ? anfrageKoerperMistralChat(a, aufwand) : anfrageKoerperMistral(a, aufwand);
  }

  /** Eine Anfrage mit Wiederholung bei Überlastung; liefert den Sammler und die wirksame Stufe des Nachdenkens. */
  private async eineRunde(a: LlmAnfrage): Promise<{ sammler: MistralSammler; aufwand?: string }> {
    let aufwand = a.aufwand && MISTRAL_AUFWAND[a.aufwand];
    let body = this.koerper(a, aufwand);
    let grobVersucht = false;
    for (let versuch = 0; ; versuch++) {
      abbruchPruefen(a.signal);
      let antwort: Response;
      try {
        antwort = await this.abruf(this.url, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "text/event-stream", authorization: `Bearer ${this.schluessel}` },
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
        throw new AnbieterFehler(
          `Keine Verbindung zu Mistral. Netz prüfen. Steht das Netz, kann auch der Browser den direkten Aufruf von ${new URL(this.url).host} blockiert haben.`,
          0,
          "netz",
        );
      }
      if (!antwort.ok) {
        let f: { code?: string; meldung?: string } = {};
        try {
          f = fehlerAus(await antwort.json());
        } catch {
          /* leer */
        }
        if (a.aufwand && !grobVersucht && aufwandAbgelehnt(antwort.status, f.meldung)) {
          grobVersucht = true;
          aufwand = groberAufwand(a.aufwand);
          a.fortschritt?.({ art: "wiederholung", grund: `Mistral lehnt die Stufe des Nachdenkens ab; neuer Versuch mit „${aufwand}“.`, warteMs: 0 });
          body = this.koerper(a, aufwand);
          versuch--;
          continue;
        }
        const wiederholbar = antwort.status === 429 || antwort.status >= 500;
        if (wiederholbar && versuch < MAX_WIEDERHOLUNGEN) {
          const ra = Number(antwort.headers.get("retry-after"));
          const ms = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 60_000) : 4000 * 2 ** versuch;
          a.fortschritt?.({ art: "wiederholung", grund: fehlerTextMistral(antwort.status, f.code), warteMs: ms });
          await warte(ms, a.signal);
          continue;
        }
        throw new AnbieterFehler(fehlerTextMistral(antwort.status, f.code, f.meldung), antwort.status, f.code);
      }
      return { sammler: await this.stromLesen(antwort, a), aufwand };
    }
  }

  private async stromLesen(antwort: Response, a: LlmAnfrage): Promise<MistralSammler> {
    const leser = new SseLeser();
    const sammler = new MistralSammler(a.fortschritt);
    const reader = antwort.body!.pipeThrough(new TextDecoderStream()).getReader();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const ev of leser.lies(value)) {
          if (ev.data === "[DONE]") sammler.fertig = true;
          else if (ev.data && typeof ev.data === "object") {
            if (this.endpunkt === "eu") sammler.verarbeiteChat(ev.data);
            else sammler.verarbeite(ev.data, ev.event);
          }
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError" || a.signal?.aborted) throw e;
      if (e instanceof AnbieterFehler) throw e;
      throw new StromEnde(String(e?.message || e));
    }
    if (this.endpunkt === "eu" && sammler.endgrund) sammler.fertig = true;
    if (!sammler.fertig) throw new StromEnde("Strom ohne Abschluss beendet");
    return sammler;
  }

  async senden(a: LlmAnfrage): Promise<LlmAntwort> {
    const start = Date.now();
    let s: MistralSammler;
    let aufwand: string | undefined;
    for (let neustart = 0; ; neustart++) {
      try {
        ({ sammler: s, aufwand } = await this.eineRunde(a));
        break;
      } catch (e: any) {
        const abbruch = e instanceof StromEnde || (!(e instanceof AnbieterFehler) && istVerbindungsabbruch(e) && e?.name !== "AbortError");
        if (!abbruch) throw e;
        if (neustart >= MAX_NEUSTARTS) throw new AnbieterFehler(TEXT_VERBINDUNGSABBRUCH, 0, "verbindung");
        a.fortschritt?.({ art: "wiederholung", grund: "Verbindung unterbrochen; die Anfrage wird neu gestellt.", warteMs: 1500 });
        await warte(1500, a.signal);
      }
    }
    const eu = this.endpunkt === "eu";
    const n = eu ? nutzungMistralChat(s.nutzung) : nutzungMistral(s.nutzung, s.suchen.length);
    // Die Conversations-API nennt keinen Abbruchgrund. Ist die Höchstzahl der Ausgabetoken erreicht, gilt die
    // Antwort als abgeschnitten, damit die Pipeline wie bei den anderen Anbietern vervollständigen kann.
    const abgeschnitten = s.endgrund === "length" || n.ausgabe >= a.maxTokens;
    // Wirksame Parameter für das Laufprotokoll, wo sie von der Anfrage der App abweichen können
    const parameter = {
      type: "ki-lead.parameter",
      anbieter: "mistral",
      endpunkt: new URL(this.url).host,
      reasoning_effort: aufwand ?? null,
      websuche: !eu && !!a.werkzeuge?.websuche,
      websuche_hoechstzahl_durchgesetzt: false,
    };
    const kosten = kostenAnfrage(a.modell, n);
    return {
      modell: s.modell || a.modell,
      text: s.text,
      inhalt: eu ? [parameter, { type: "ki-lead.chat", finish_reason: s.endgrund ?? null, usage: s.nutzung ?? null }] : [parameter, ...s.inhalt],
      zitate: s.zitate,
      fundstellen: s.fundstellen,
      suchen: s.suchen,
      abrufe: [],
      abrufFehler: [],
      nutzung: n,
      kostenUsd: kosten === null ? null : eu ? kosten * MISTRAL_EU_FAKTOR : kosten,
      stopGrund: abgeschnitten ? "max_tokens" : "end_turn",
      dauerMs: Date.now() - start,
      runden: 1,
    };
  }
}
