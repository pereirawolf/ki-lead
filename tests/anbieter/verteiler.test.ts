// Verteiler: Anbieter nach Modell, passender Schlüssel.
import { describe, expect, it } from "vitest";
import { anbieterVon, fehlendeSchluessel, Verteiler } from "../../src/anbieter/verteiler";
import type { LlmAnbieter, LlmAnfrage, LlmAntwort } from "../../src/anbieter/typen";

const anfrage: LlmAnfrage = { modell: "gpt-6.1-sol", maxTokens: 5000, system: [], nachrichten: [{ role: "user", content: "Hallo" }] };

describe("Verteiler", () => {
  it("wählt den Anbieter nach dem Modell und verlangt den passenden Schlüssel", async () => {
    expect(anbieterVon("gpt-6-luna")).toBe("openai");
    expect(anbieterVon("claude-opus-5-5")).toBe("anthropic");
    expect(fehlendeSchluessel(["claude-haiku-5-5", "gpt-6.1-sol"], { anthropic: "a", openai: "" })).toEqual(["openai"]);
    const genutzt: string[] = [];
    const attrappe = (id: string): LlmAnbieter => ({ id, senden: async () => (genutzt.push(id), { text: id } as LlmAntwort) });
    const v = new Verteiler({ anthropic: "a", openai: "" }, (id) => attrappe(id));
    await v.senden({ ...anfrage, modell: "claude-sonnet-5-5" });
    expect(genutzt).toEqual(["anthropic"]);
    await expect(v.senden(anfrage)).rejects.toThrow(/Für OpenAI \(gpt-6.1-sol\) ist kein API-Schlüssel/);
  });
});
