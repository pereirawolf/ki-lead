// Liest einen Server-Sent-Events-Strom der Anthropic Messages API und setzt daraus die
// vollständige Nachricht zusammen (Text, Zitate, Werkzeugaufrufe, Denkblöcke mit Signatur).
// Die Blöcke bleiben unverändert, damit sie bei pause_turn zurückgeschickt werden können.

import { AnbieterFehler, type Fortschritt } from "./typen";

export interface SseEreignis {
  event: string;
  data: any;
}

/** Zerlegt Text-Chunks in SSE-Ereignisse. */
export class SseLeser {
  private puffer = "";

  lies(chunk: string): SseEreignis[] {
    this.puffer += chunk.replace(/\r\n/g, "\n");
    const out: SseEreignis[] = [];
    let i: number;
    while ((i = this.puffer.indexOf("\n\n")) >= 0) {
      const roh = this.puffer.slice(0, i);
      this.puffer = this.puffer.slice(i + 2);
      let event = "message";
      const daten: string[] = [];
      for (const zeile of roh.split("\n")) {
        if (zeile.startsWith("event:")) event = zeile.slice(6).trim();
        else if (zeile.startsWith("data:")) daten.push(zeile.slice(5).replace(/^ /, ""));
      }
      if (!daten.length) continue;
      const text = daten.join("\n");
      let data: any = text;
      try {
        data = JSON.parse(text);
      } catch {
        /* kein JSON, z. B. [DONE] */
      }
      out.push({ event, data });
    }
    return out;
  }
}

export interface ZusammengesetzteNachricht {
  modell: string;
  inhalt: any[];
  stopGrund: string;
  nutzung: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    web_search_requests: number;
    web_fetch_requests: number;
  };
}

export class NachrichtenSammler {
  modell = "";
  stopGrund = "";
  private bloecke: any[] = [];
  private fertig = new Set<number>();
  private json = new Map<number, string>();
  private textZeichen = 0;
  nutzung = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    web_search_requests: 0,
    web_fetch_requests: 0,
  };

  constructor(private fortschritt?: (f: Fortschritt) => void) {}

  private nutzungUebernehmen(u: any) {
    if (!u) return;
    const n = this.nutzung;
    if (typeof u.input_tokens === "number") n.input_tokens = Math.max(n.input_tokens, u.input_tokens);
    if (typeof u.output_tokens === "number") n.output_tokens = Math.max(n.output_tokens, u.output_tokens);
    if (typeof u.cache_creation_input_tokens === "number")
      n.cache_creation_input_tokens = Math.max(n.cache_creation_input_tokens, u.cache_creation_input_tokens);
    if (typeof u.cache_read_input_tokens === "number") n.cache_read_input_tokens = Math.max(n.cache_read_input_tokens, u.cache_read_input_tokens);
    const s = u.server_tool_use;
    if (s) {
      if (typeof s.web_search_requests === "number") n.web_search_requests = Math.max(n.web_search_requests, s.web_search_requests);
      if (typeof s.web_fetch_requests === "number") n.web_fetch_requests = Math.max(n.web_fetch_requests, s.web_fetch_requests);
    }
  }

  verarbeite(e: SseEreignis) {
    const d = e.data;
    if (!d || typeof d !== "object") return;
    switch (d.type) {
      case "message_start":
        this.modell = d.message?.model || "";
        this.nutzungUebernehmen(d.message?.usage);
        break;
      case "content_block_start": {
        const b = structuredClone(d.content_block);
        if (b.type === "text" && typeof b.text !== "string") b.text = "";
        if (b.type === "thinking" && typeof b.thinking !== "string") b.thinking = "";
        if (b.type === "tool_use" || b.type === "server_tool_use") this.json.set(d.index, "");
        this.bloecke[d.index] = b;
        if (b.type === "thinking" || b.type === "redacted_thinking") this.fortschritt?.({ art: "denkt" });
        break;
      }
      case "content_block_delta": {
        const b = this.bloecke[d.index];
        const delta = d.delta || {};
        if (!b) break;
        if (delta.type === "text_delta") {
          b.text = (b.text || "") + delta.text;
          this.textZeichen += delta.text.length;
          this.fortschritt?.({ art: "schreibt", zeichen: this.textZeichen });
        } else if (delta.type === "input_json_delta") {
          this.json.set(d.index, (this.json.get(d.index) || "") + (delta.partial_json || ""));
        } else if (delta.type === "citations_delta") {
          (b.citations ||= []).push(delta.citation);
        } else if (delta.type === "thinking_delta") {
          b.thinking = (b.thinking || "") + delta.thinking;
        } else if (delta.type === "signature_delta") {
          b.signature = delta.signature;
        }
        break;
      }
      case "content_block_stop": {
        this.fertig.add(d.index);
        const b = this.bloecke[d.index];
        if (!b) break;
        if (this.json.has(d.index)) {
          const roh = this.json.get(d.index)!;
          this.json.delete(d.index);
          if (roh.trim()) {
            try {
              b.input = JSON.parse(roh);
            } catch {
              b.input = { _unvollstaendig: roh };
            }
          } else if (b.input === undefined) b.input = {};
        }
        if (b.type === "server_tool_use") {
          if (b.name === "web_search" && b.input?.query) this.fortschritt?.({ art: "suche", text: String(b.input.query) });
          if (b.name === "web_fetch" && b.input?.url) this.fortschritt?.({ art: "abruf", text: String(b.input.url) });
        }
        break;
      }
      case "message_delta":
        if (d.delta?.stop_reason) this.stopGrund = d.delta.stop_reason;
        this.nutzungUebernehmen(d.usage);
        break;
      case "error":
        throw new AnbieterFehler(fehlerText(d.error?.type, d.error?.message), undefined, d.error?.type);
    }
  }

  /**
   * Vollständig empfangene Blöcke nach einem Verbindungsabbruch. Werkzeugaufrufe ohne zugehöriges
   * Ergebnis werden verworfen, damit die Teilantwort als Fortsetzung zurückgeschickt werden kann.
   */
  teil(): ZusammengesetzteNachricht {
    const fertige = this.bloecke.filter((b, i) => b && this.fertig.has(i));
    const ergebnisIds = new Set(fertige.filter((b) => typeof b.tool_use_id === "string").map((b) => b.tool_use_id));
    const inhalt = fertige.filter((b) => b.type !== "server_tool_use" || ergebnisIds.has(b.id));
    return { modell: this.modell, inhalt, stopGrund: "abgebrochen", nutzung: { ...this.nutzung } };
  }

  ergebnis(): ZusammengesetzteNachricht {
    return { modell: this.modell, inhalt: this.bloecke.filter(Boolean), stopGrund: this.stopGrund, nutzung: { ...this.nutzung } };
  }
}

export function fehlerText(art: string | undefined, meldung: string | undefined, status?: number): string {
  const m = meldung ? ` (${meldung})` : "";
  switch (art) {
    case "authentication_error":
      return "Der API-Schlüssel wurde abgelehnt. Bitte unter „Einstellungen“ prüfen." + m;
    case "permission_error":
      return "Der API-Schlüssel hat keine Berechtigung für diese Anfrage." + m;
    case "rate_limit_error":
      return "Das Anfragelimit beim Anbieter ist erreicht. Bitte kurz warten." + m;
    case "overloaded_error":
      return "Der Anbieter ist gerade überlastet. Bitte später erneut versuchen." + m;
    case "invalid_request_error":
      return "Die Anfrage wurde vom Anbieter abgelehnt" + m + ".";
    case "request_too_large":
      return "Die Anfrage ist zu groß. Bitte weniger oder kleinere Dateien beifügen." + m;
    case "billing_error":
      return "Beim Anbieter-Konto gibt es ein Abrechnungsproblem (Guthaben?)." + m;
    default:
      return `Fehler beim Anbieter${status ? ` (HTTP ${status})` : ""}${m}.`;
  }
}
