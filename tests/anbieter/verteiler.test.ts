// Verteiler: Anbieter nach Modell, passender Schlüssel.
import { describe, expect, it } from "vitest";
import { anbieterListe, anbieterVon, fehlendeSchluessel, Verteiler } from "../../src/anbieter/verteiler";
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
      await expect(Verteiler.fuer(sch, { mistralEndpunkt: "eu" }).senden(m)).rejects.toThrow(/Mistral-Schlüssel/);
      await expect(Verteiler.fuer(sch, { mistralEndpunkt: "global" }).senden(m)).rejects.toThrow(/Mistral-Schlüssel/);
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
