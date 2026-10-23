// Hinweis bei Profilen, deren JSON-Ausgaben KI-Entwürfe nicht maschinenlesbar kennzeichnen können
// (KI-Verordnung Art. 50 Abs. 2; docs/KI-VERORDNUNG.md, 6.1), seit 0.5.4.
import { describe, expect, it } from "vitest";
import { leseOrdner, repoPfad } from "../support/dateien";
import { ladeProfil } from "../../src/profil/laden";

const CODE = "KI_KENNZEICHNUNG_OHNE_ENTSTEHUNGSFELD";
const dateien = () => leseOrdner(repoPfad("profile", "lead-beispiel"));

describe("Hinweis zur KI-Kennzeichnung beim Laden eines Profils", () => {
  it.each(["lead-beispiel", "muster"])("%s: kein Hinweis, das Entstehungsfeld trägt „KI-Entwurf“", async (name) => {
    const erg = await ladeProfil(leseOrdner(repoPfad("profile", name)));
    expect(erg.profil).not.toBeNull();
    expect(erg.befunde.filter((b) => b.code === CODE)).toEqual([]);
  });
  it("Hinweis ohne Rolle entstehung_feld; das Profil bleibt ladbar", async () => {
    const d = dateien();
    const ui = JSON.parse(d["meldung.ui.json"]);
    delete ui.rollen.entstehung_feld;
    const erg = await ladeProfil({ ...d, "meldung.ui.json": JSON.stringify(ui) });
    expect(erg.profil).not.toBeNull();
    const b = erg.befunde.filter((x) => x.code === CODE);
    expect(b).toHaveLength(1);
    expect(b[0].stufe).toBe("hinweis");
  });
  it("Hinweis, wenn „verfahren“ den Wert „KI-Entwurf“ nicht zulässt", async () => {
    const d = dateien();
    const schema = JSON.parse(d["meldung.schema.json"]);
    schema.$defs.entstehung.properties.verfahren = { enum: ["manuell"] };
    const erg = await ladeProfil({ ...d, "meldung.schema.json": JSON.stringify(schema) });
    expect(erg.befunde.filter((x) => x.code === CODE)).toHaveLength(1);
  });
});
