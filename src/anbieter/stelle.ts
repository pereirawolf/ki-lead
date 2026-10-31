// Endpunkt der Stelle (seit 0.6.17, TP-2026-W44-49): ein KI-Dienst, den eine Stelle selbst betreibt oder beauftragt, über
// Chat Completions (POST <basisUrl>/chat/completions, Server-Sent Events). Nach Entscheidung E3 nur dieser Weg; die
// Responses API erst, wenn eine Stelle sie braucht.
//
// - Nur im Betreiberbuild: Adresse, Modell, Anzeigename und Preise stehen in der Betreiberkonfiguration (src/anbieter/
//   betrieb.ts); die Person kann sie nicht ändern. Die Content-Security-Policy lässt genau diese Herkunft zu, der Adapter
//   prüft vor dem Senden dasselbe.
// - Modellkennung in der App: „stelle:<modell>“; an den Endpunkt geht das Modell ohne Präfix.
// - Schlüssel als „Authorization: Bearer …“; ein Dienst ohne Anmeldung nimmt einen beliebigen Wert hin.
// - Ohne Websuche, Seitenabruf und Aufwand (keine Angabe reasoning_effort); strukturierte Ausgabe über response_format
//   (json_schema, strict) mit dem strengen Schema wie bei OpenAI und Mistral.
// - Inhalte als reiner Text; PDF-Material weist der Adapter mit einem Hinweis ab, weil Chat Completions dafür keine
//   gemeinsame Form hat.
// - Strom und Nutzungsangaben wie beim EU-Endpunkt von Mistral (MistralSammler.verarbeiteChat, nutzungMistralChat);
//   erprobt mit Mistral EU über die Mistral-Probe (TP-2026-W44-52).

import { betrieb, herkunft, type Betrieb, type StelleKonfiguration } from "./betrieb";
import { LeseFehler, mitNeustart, mitWiederholung, sseLesen, type Fehlerregeln } from "./http";
import { fehlerAus, MistralSammler, nutzungMistralChat } from "./mistral";
import { strengesSchema } from "./schema";
import { AnbieterFehler, type Inhaltsblock, type LlmAnbieter, type LlmAnfrage, type LlmAntwort } from "./typen";

export const STELLE_PRAEFIX = "stelle:";
export const STELLE_NAME = "Endpunkt der Stelle";

/** Kennung in der App für ein Modell des Endpunkts */
export function stelleKennung(modell: string): string {
  return `${STELLE_PRAEFIX}${modell}`;
}

/** Modell ohne das Präfix „stelle:“, wie der Endpunkt es erwartet */
export function stelleModell(kennung: string): string {
  return kennung.startsWith(STELLE_PRAEFIX) ? kennung.slice(STELLE_PRAEFIX.length) : kennung;
}

/** Anzeigename des Endpunkts aus der Konfiguration */
export function stelleName(b: Betrieb = betrieb()): string {
  return b.stelle?.name || STELLE_NAME;
}

/** Ist die Adresse die des konfigurierten Endpunkts (gleiche Herkunft, nur https)? */
export function stelleAdresseZulaessig(url: string, b: Betrieb = betrieb()): boolean {
  if (!b.anbieter.includes("stelle") || !b.stelle) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.origin === herkunft(b.stelle.basisUrl);
  } catch {
    return false;
  }
}

export const STELLE_PDF_HINWEIS =
  "Der Endpunkt der Stelle verarbeitet kein PDF-Material. Text aus dem PDF in die Stichworte übernehmen oder einen anderen Anbieter wählen.";

/** Inhalt als Text; PDF ist ein Fehler */
function inhaltZuText(c: string | Inhaltsblock[]): string {
  if (typeof c === "string") return c;
  const teile: string[] = [];
  for (const b of c as any[]) {
    if (b?.type === "text") teile.push(String(b.text ?? ""));
    else if (b?.type === "document" && b.source?.type === "text") teile.push(`${b.title ? `# ${b.title}\n\n` : ""}${b.source.data}`);
    else if (b?.type === "document") throw new AnbieterFehler(STELLE_PDF_HINWEIS, 0, "pdf");
  }
  return teile.join("\n\n");
}

/** Anfrage an Chat Completions: System als erste Nachricht, keine Werkzeuge, kein Aufwand */
export function anfrageKoerperStelle(a: LlmAnfrage): Record<string, any> {
  const system = a.system.map((s) => s.text).join("\n\n");
  const body: Record<string, any> = {
    model: stelleModell(a.modell),
    messages: [...(system ? [{ role: "system", content: system }] : []), ...a.nachrichten.map((n) => ({ role: n.role, content: inhaltZuText(n.content) }))],
    max_tokens: a.maxTokens,
    stream: true,
  };
  if (a.jsonSchema) body.response_format = { type: "json_schema", json_schema: { name: "antwort", schema: strengesSchema(a.jsonSchema), strict: true } };
  return body;
}

/** Fehlertexte mit dem Namen des Endpunkts */
export function fehlerTextStelle(name: string) {
  return (status: number, code?: string, meldung?: string): string => {
    const m = meldung ? ` (${meldung})` : "";
    if (status === 401) return `Der Schlüssel für „${name}“ wurde abgelehnt. Bitte unter „Einstellungen“ prüfen.${m}`;
    if (status === 403) return `„${name}“ hat den Zugriff abgelehnt${m}.`;
    if (status === 404) return `„${name}“ kennt das Modell oder die Adresse nicht${m}. Betreiberkonfiguration prüfen.`;
    if (status === 429) return `Das Anfragelimit von „${name}“ ist erreicht. Bitte kurz warten.${m}`;
    if (status === 400 || status === 422) return `Die Anfrage wurde von „${name}“ abgelehnt${m}.`;
    if (status >= 500) return `„${name}“ meldet einen Fehler. Bitte später erneut versuchen.${m}`;
    return `Fehler bei „${name}“${status ? ` (HTTP ${status})` : ""}${code ? ` [${code}]` : ""}${m}.`;
  };
}

export class StelleAnbieter implements LlmAnbieter {
  id = "stelle";
  private url: string;
  private name: string;
  constructor(
    private schluessel: string,
    private konfig: StelleKonfiguration | undefined = betrieb().stelle,
    private abruf: typeof fetch = (...x) => fetch(...x),
    private b: Betrieb = betrieb(),
  ) {
    this.url = `${(konfig?.basisUrl ?? "").replace(/\/+$/, "")}/chat/completions`;
    this.name = konfig?.name || STELLE_NAME;
  }

  private async eineRunde(a: LlmAnfrage): Promise<MistralSammler> {
    const fehlerText = fehlerTextStelle(this.name);
    const body = JSON.stringify(anfrageKoerperStelle(a));
    const regeln: Fehlerregeln = {
      fehlerAus: async (antwort) => {
        try {
          const roh = await antwort.text();
          try {
            return fehlerAus(JSON.parse(roh));
          } catch {
            return { meldung: roh.slice(0, 600) || undefined, roh };
          }
        } catch {
          return { roh: "" };
        }
      },
      wiederholbar: (status) => status === 429 || status >= 500,
      fehlerText,
      netzFehler: `Keine Verbindung zu „${this.name}“ (${new URL(this.url).host}). Netz prüfen; erlaubt der Dienst Aufrufe aus dem Browser (CORS)?`,
    };
    const antwort = await mitWiederholung(
      a,
      () =>
        this.abruf(this.url, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "text/event-stream", authorization: `Bearer ${this.schluessel}` },
          body,
          signal: a.signal,
        }),
      regeln,
    );
    const sammler = new MistralSammler(a.fortschritt, fehlerText);
    await sseLesen(antwort, a.signal, (ev) => {
      if (ev.data === "[DONE]") sammler.fertig = true;
      else if (ev.data && typeof ev.data === "object") sammler.verarbeiteChat(ev.data);
    });
    if (sammler.endgrund) sammler.fertig = true;
    if (!sammler.fertig) throw new LeseFehler(new Error("Strom ohne Abschluss beendet"));
    return sammler;
  }

  async senden(a: LlmAnfrage): Promise<LlmAntwort> {
    if (!this.konfig || !stelleAdresseZulaessig(this.url, this.b))
      throw new AnbieterFehler(
        `${STELLE_NAME}: Adresse „${this.konfig?.basisUrl ?? "–"}“ ist in diesem Build nicht freigegeben (Betreiberkonfiguration, docs/BETRIEB.md).`,
        0,
        "adresse",
      );
    const start = Date.now();
    const s = await mitNeustart(a, () => this.eineRunde(a));
    const n = nutzungMistralChat(s.nutzung);
    const abgeschnitten = s.endgrund === "length" || n.ausgabe >= a.maxTokens;
    const parameter = { type: "ki-lead.parameter", anbieter: "stelle", endpunkt: new URL(this.url).host, websuche: false };
    return {
      modell: s.modell ? stelleKennung(s.modell) : a.modell,
      text: s.text,
      inhalt: [parameter, ...s.inhalt, { type: "ki-lead.chat", finish_reason: s.endgrund ?? null, usage: s.nutzung ?? null }],
      zitate: [],
      fundstellen: [],
      suchen: [],
      abrufe: [],
      abrufFehler: [],
      nutzung: n,
      // Preise aus der Konfiguration dieses Adapters (Cache wie Eingabe), nicht aus dem Build: so auch in der Probe unter Node
      kostenUsd:
        s.nutzung && this.konfig.preise
          ? ((n.eingabe + n.cacheLesen + n.cacheSchreiben) * this.konfig.preise.eingabe + n.ausgabe * this.konfig.preise.ausgabe) / 1_000_000
          : null,
      stopGrund: abgeschnitten ? "max_tokens" : "end_turn",
      dauerMs: Date.now() - start,
      runden: 1,
    };
  }
}
