// Fiktiver Datensatz Orkantief „Ilka“: Vollständigkeit und Schemakonformität der sieben Beispielmeldungen.
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import { ilkaDateien } from "../support/fixtures";
import { pruefeGegenSchema } from "../../src/kern/validierung";
import { migriere } from "../../src/kern/migration";
import { quellenHinweise } from "../../src/kern/quellen";
import { pflichtHinweise } from "../../src/kern/kennsaetze";

const ilka = ilkaDateien();

describe("Fiktiver Datensatz Orkantief „Ilka“", () => {
  it("liegt vollständig vor", () => {
    expect(ilka.length).toBe(7);
  });

  for (const { name, daten } of ilka) {
    it(`${name}: schemakonform, Quellen stimmig`, async () => {
      const { profil: p } = await profil("lead-beispiel");
      const mig = migriere(daten, p!);
      expect(mig.bekannt).toBe(true);
      expect(pruefeGegenSchema(p!.schema, mig.daten, p!.ui)).toEqual([]);
      const warnungen = quellenHinweise(mig.daten, p!.ui).filter((b) => b.stufe === "warnung");
      expect(warnungen).toEqual([]);
      expect(pflichtHinweise(mig.daten, p!.ui)).toEqual([]);
    });
  }
});
