// Migration gespeicherter Meldungen aus Altformaten.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaMeldung } from "../support/fixtures";
import { migriere } from "../../src/kern/migration";

describe("Migration", () => {
  it("überführt das Altformat v2", async () => {
    const { profil: p } = await profil("lead-beispiel");
    p!.manifest.migrationen = [
      { von: "LEAD-Meldung-v0", setze: { schema: "LEAD-Meldung-v1" }, ergaenze: { quellen: "" }, hinweis: "Altformat v0 in v1 überführt." },
    ];
    const alt = ilkaMeldung("Bund");
    alt.schema = "LEAD-Meldung-v0";
    delete alt.quellen;
    alt.sachverhalte[0].analyse.lage_ereignis += "\n[Q1] J – Redaktion (01.10.2026): Titel [Zugriff: 01.10.2026]";
    const mig = migriere(alt, p!);
    expect(mig.daten.schema).toBe("LEAD-Meldung-v1");
    expect(mig.daten.quellen).toBe("");
    expect(mig.hinweise.join(" ")).toMatch(/Altformat v0/);
    expect(mig.hinweise.join(" ")).toMatch(/Quellenzeilen/);
  });

  it("erkennt fremde Schemata", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const mig = migriere({ schema: "Muster-LEAD-Meldung-v1" }, p!);
    expect(mig.bekannt).toBe(false);
  });
});
