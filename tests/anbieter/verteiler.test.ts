// Verteiler: Anbieter nach Modell, passender Schlüssel.
import { describe, expect, it } from "vitest";
import {
  anbieterListe,
  anbieterVon,
  ANBIETER_IDS,
  bekannterAnbieter,
  faehigkeitenFuer,
  fehlendeSchluessel,
  hatSchluessel,
  REGISTRY,
  Verteiler,
} from "../../src/anbieter/verteiler";
import { AnbieterFehler } from "../../src/anbieter/typen";
import { MODELL_AUSWAHL, STANDARD_PROFILE } from "../../src/pipeline/einstellungen";
import type { LlmAnbieter, LlmAnfrage, LlmAntwort } from "../../src/anbieter/typen";

const anfrage: LlmAnfrage = { modell: "gpt-6.1-sol", maxTokens: 5000, system: [], nachrichten: [{ role: "user", content: "Hallo" }] };

describe("Verteiler", () => {
  it("wählt den Anbieter nach dem Modell und verlangt den passenden Schlüssel", async () => {
    expect(anbieterVon("gpt-6-luna")).toBe("openai");
    expect(anbieterVon("claude-opus-5-5")).toBe("anthropic");
    expect(fehlendeSchluessel(["claude-haiku-5-5", "gpt-6.1-sol"], { anthropic: "a", openai: "", mistral: "" })).toEqual(["openai"]);
    const genutzt: string[] = [];
    const attrappe = (id: string): LlmAnbieter => ({ id, senden: async () => (genutzt.push(id), { text: id } as LlmAntwort) });
    const v = new Verteiler({ anthropic: "a", openai: "", mistral: "" }, (id) => attrappe(id));
    await v.senden({ ...anfrage, modell: "claude-sonnet-5-5" });
    expect(genutzt).toEqual(["anthropic"]);
    await expect(v.senden(anfrage)).rejects.toThrow(/Für OpenAI \(gpt-6.1-sol\) ist kein API-Schlüssel/);
  });

  it("erkennt Mistral-Modelle (seit 0.5.6) und baut dafür den Mistral-Adapter", async () => {
    for (const m of ["mistral-small-2603", "mistral-medium-3-5", "mistral-large-4", "ministral-3-8b", "magistral-medium-2509"])
      expect(anbieterVon(m), m).toBe("mistral");
    expect(anbieterVon("gpt-6-astra")).toBe("openai");
    expect(anbieterVon("claude-haiku-5-5")).toBe("anthropic");
    // Jedes wählbare Modell und jedes Standard-Profil gehört zum erwarteten Anbieter
    for (const m of MODELL_AUSWAHL.filter((x) => x.startsWith("mistral-"))) expect(anbieterVon(m)).toBe("mistral");
    for (const [anbieter, p] of Object.entries(STANDARD_PROFILE)) for (const m of Object.values(p.modelle)) expect(anbieterVon(m), m).toBe(anbieter);
    expect(fehlendeSchluessel(["mistral-small-2603", "claude-haiku-5-5"], { anthropic: "a", openai: "", mistral: "" })).toEqual(["mistral"]);
    const gebaut: [string, string][] = [];
    const v = new Verteiler({ anthropic: "", openai: "", mistral: "m" }, (id, k) => {
      gebaut.push([id, k]);
      return { id, senden: async () => ({ text: id }) as LlmAntwort };
    });
    expect((await v.senden({ ...anfrage, modell: "mistral-medium-3-5" })).text).toBe("mistral");
    expect(gebaut).toEqual([["mistral", "m"]]);
    await expect(v.senden({ ...anfrage, modell: "claude-sonnet-5-5" })).rejects.toThrow(/Für Anthropic \(claude-sonnet-5-5\) ist kein API-Schlüssel/);
  });

  it("zählt Anbieter als deutsche Aufzählung auf", () => {
    expect(anbieterListe([])).toBe("");
    expect(anbieterListe(["openai"])).toBe("OpenAI");
    expect(anbieterListe(["anthropic", "mistral"])).toBe("Anthropic und Mistral");
    expect(anbieterListe(["anthropic", "openai", "mistral"])).toBe("Anthropic, OpenAI und Mistral");
  });

  it("die Standard-Fabrik baut für Mistral einen MistralAnbieter, ohne Wahl für den EU-Endpunkt", async () => {
    const aufrufe: string[] = [];
    const echt = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      aufrufe.push(String(url));
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }) as typeof fetch;
    try {
      const sch = { anthropic: "", openai: "", mistral: "m" };
      const m = { ...anfrage, modell: "mistral-small-2603" };
      await expect(new Verteiler(sch).senden(m)).rejects.toThrow(/Mistral-Schlüssel/);
      await expect(Verteiler.fuer(sch, { mistral: { endpunkt: "eu" } }).senden(m)).rejects.toThrow(/Mistral-Schlüssel/);
      await expect(Verteiler.fuer(sch, { mistral: { endpunkt: "global" } }).senden(m)).rejects.toThrow(/Mistral-Schlüssel/);
    } finally {
      globalThis.fetch = echt;
    }
    expect(aufrufe).toEqual([
      "https://api.eu.mistral.ai/v1/chat/completions",
      "https://api.eu.mistral.ai/v1/chat/completions",
      "https://api.mistral.ai/v1/conversations",
    ]);
  });
});

describe("Registry der Anbieter (TP-2026-W44-26)", () => {
  it("TP-2026-W44-26: unbekanntes Modellpräfix liefert einen Fehler statt stiller Zuordnung", async () => {
    for (const m of ["llama3", "qwen3:32b", "ollama:", "", "gemini-3-pro"]) {
      expect(bekannterAnbieter(m), m).toBeUndefined();
      expect(() => anbieterVon(m), m).toThrow(AnbieterFehler);
      expect(() => anbieterVon(m), m).toThrow(/gehört zu keinem bekannten Anbieter/);
    }
    const gebaut: string[] = [];
    const v = new Verteiler({ anthropic: "a", openai: "o", mistral: "m" }, (id) => {
      gebaut.push(id);
      return { id, senden: async () => ({ text: id }) as LlmAntwort };
    });
    const fehler = await v.senden({ ...anfrage, modell: "llama3" }).catch((e: unknown) => e);
    expect(fehler).toBeInstanceOf(AnbieterFehler);
    expect((fehler as AnbieterFehler).art).toBe("modell");
    expect(gebaut).toEqual([]);
    // fehlende Schlüssel: unbekannte Kennungen zählen nicht, Ollama braucht keinen
    expect(fehlendeSchluessel(["llama3", "ollama:llama3.1", "gpt-6-luna"], { anthropic: "", openai: "", mistral: "" })).toEqual(["openai"]);
  });

  it("TP-2026-W44-26: vier Anbieter in fester Reihenfolge; jede Kennung gehört genau einem", () => {
    expect(ANBIETER_IDS).toEqual(["anthropic", "openai", "mistral", "ollama"]);
    const faelle: [string, string][] = [
      ["claude-opus-5-5", "anthropic"],
      ["gpt-6-astra", "openai"],
      ["o4-mini", "openai"],
      ["mistral-small-2603", "mistral"],
      ["magistral-medium-2509", "mistral"],
      ["ollama:llama3.1", "ollama"],
      ["ollama:qwen3:32b", "ollama"],
    ];
    for (const [m, id] of faelle) {
      expect(bekannterAnbieter(m), m).toBe(id);
      expect(
        REGISTRY.filter((a) => a.erkennt(m)).map((a) => a.id),
        m,
      ).toEqual([id]);
    }
    expect(hatSchluessel("ollama", { anthropic: "", openai: "", mistral: "" })).toBe(true);
    expect(hatSchluessel("mistral", { anthropic: "", openai: "", mistral: "" })).toBe(false);
  });

  it("TP-2026-W44-26: Fähigkeiten je Anbieter und Optionen", () => {
    expect(faehigkeitenFuer("claude-opus-5-5")).toMatchObject({ websuche: true, abruf: true });
    expect(faehigkeitenFuer("mistral-medium-3-5", { mistral: { endpunkt: "eu" } })).toMatchObject({ websuche: false, abruf: false, aufwand: ["low", "high"] });
    expect(faehigkeitenFuer("mistral-medium-3-5", { mistral: { endpunkt: "global" } })).toMatchObject({ websuche: true, abruf: false });
    expect(faehigkeitenFuer("ollama:llama3.1")).toEqual({ websuche: false, abruf: false, aufwand: ["medium"] });
    expect(faehigkeitenFuer("llama3")).toMatchObject({ websuche: false, abruf: false });
  });

  it("TP-2026-W44-26: Ollama ohne Schlüssel über die OpenAI-kompatible Schnittstelle, Modell ohne Präfix, ohne Werkzeuge und Aufwand, Kosten 0", async () => {
    const aufrufe: { url: string; init: RequestInit }[] = [];
    const echt = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      aufrufe.push({ url: String(url), init });
      const ende = {
        type: "response.completed",
        response: {
          status: "completed",
          model: "llama3.1",
          output: [{ type: "message", content: [{ type: "output_text", text: "Verbindung steht.", annotations: [] }] }],
          usage: { input_tokens: 12, output_tokens: 4 },
        },
      };
      return new Response(`data: ${JSON.stringify(ende)}\n\n`, { status: 200, headers: { "content-type": "text/event-stream" } });
    }) as typeof fetch;
    try {
      const leer = { anthropic: "", openai: "", mistral: "" };
      const r = await Verteiler.fuer(leer, {}).senden({
        ...anfrage,
        modell: "ollama:llama3.1",
        aufwand: "high",
        werkzeuge: { websuche: { maxUses: 5 }, abruf: { maxUses: 3 } },
      });
      expect(r.text).toBe("Verbindung steht.");
      expect(r.modell).toBe("ollama:llama3.1");
      expect(r.kostenUsd).toBe(0);
      // eigene Adresse
      await Verteiler.fuer(leer, { ollama: { basisUrl: "http://127.0.0.1:11434/v1" } }).senden({ ...anfrage, modell: "ollama:qwen3:32b" });
    } finally {
      globalThis.fetch = echt;
    }
    expect(aufrufe.map((a) => a.url)).toEqual(["http://localhost:11434/v1/responses", "http://127.0.0.1:11434/v1/responses"]);
    const koerper = JSON.parse(String(aufrufe[0]!.init.body));
    expect(koerper.model).toBe("llama3.1");
    expect(koerper.tools).toBeUndefined();
    expect(koerper.reasoning).toBeUndefined();
    expect(JSON.parse(String(aufrufe[1]!.init.body)).model).toBe("qwen3:32b");
    expect(Object.keys(aufrufe[0]!.init.headers as Record<string, string>)).toEqual(["content-type"]);
  });

  it("TP-2026-W44-26: eine Ollama-Adresse außerhalb von localhost bzw. 127.0.0.1:11434 wird vor dem Senden abgewiesen", async () => {
    const aufrufe: string[] = [];
    const echt = globalThis.fetch;
    globalThis.fetch = (async (url: string) => (aufrufe.push(String(url)), new Response("", { status: 500 }))) as typeof fetch;
    try {
      const v = Verteiler.fuer({ anthropic: "", openai: "", mistral: "" }, { ollama: { basisUrl: "http://192.168.1.20:11434/v1" } });
      const fehler = await v.senden({ ...anfrage, modell: "ollama:llama3.1" }).catch((e: unknown) => e);
      expect(fehler).toBeInstanceOf(AnbieterFehler);
      expect((fehler as AnbieterFehler).art).toBe("adresse");
      expect((fehler as Error).message).toMatch(/nicht zulässig/);
    } finally {
      globalThis.fetch = echt;
    }
    expect(aufrufe).toEqual([]);
  });
});
