// SOP-Integration: alle Abschnitte der SOP-Übersicht sind geladen, auswählbar, gehen an S1/S2 und werden im
// Nachweis (_entstehung.sop) deterministisch als „beigefügt“ geführt, unabhängig vom Antwortformat des Modells.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { profil } from "../support/dateien";
import {
  fachSops,
  gemeinsameSops,
  istBaustein,
  istInhaltsgeruest,
  s1Schema,
  s1System,
  sopBlock,
  sopGruppen,
  sopsNachArtwechsel,
} from "../../src/pipeline/kontext";
import { nachbearbeiten, sopAngabeVergleichen, sopKennungenAbgleichen, type Kontext } from "../../src/pipeline/stufen";
import { sopNachweis, spalten } from "../../src/lagebild/ausgabe";
import { sopKennung } from "../../src/profil/sop";

import { repoPfad } from "../support/dateien";
const readme = readFileSync(repoPfad("profile/lead-beispiel/sop/README.md"), "utf-8");
const register = [...readme.matchAll(/^\| ([BC]\d{2}) \| .*?\| \[`([^`]+)`\]/gm)].map((m) => ({ kennung: m[1], datei: `sop/${m[2]}` }));

function kontext(p: any, sops: string[]): Kontext {
  return {
    profil: p,
    lauf: { app: "KI-LEAD Test", id: "lauf-1", bestaetigt: { sachverhalte: [{ titel: "", ereignisarten: [], sops, begruendung: "" }] } },
  } as any;
}

describe("SOP-Integration laut SOP-Übersicht", () => {
  it("die Übersicht nennt 17 Dach-SOPs und 17 Bausteine", () => {
    expect(register.filter((r) => r.kennung.startsWith("B"))).toHaveLength(17);
    expect(register.filter((r) => r.kennung.startsWith("C"))).toHaveLength(17);
  });

  it.each(register)("$kennung ist geladen, im S1-Schema und -Katalog und geht an S2", async ({ kennung, datei }) => {
    const { profil: p } = await profil("lead-beispiel");
    const s = fachSops(p!).find((x) => x.nummer === kennung)!;
    expect(s, kennung).toBeTruthy();
    expect(s.datei).toBe(datei);
    expect((s1Schema(p!) as any).properties.sachverhalte.items.properties.sops.items.enum).toContain(s.id);
    expect(s1System(p!)).toContain(`- ${s.id}: ${sopKennung(s)}`);
    expect(sopBlock(p!, [s.id])).toContain(`## ${sopKennung(s)}`);
    expect(istBaustein(s)).toBe(kennung.startsWith("C"));
    // Inhaltsgerüste gibt es nur in Teil C; ausgearbeitete Bausteine (z. B. C01) tragen den Status „Beispielfassung“
    if (kennung.startsWith("B")) expect(istInhaltsgeruest(s)).toBe(false);
    else expect(istInhaltsgeruest(s)).toBe(!/^Beispielfassung/.test(s.status || ""));
    expect(sopGruppen(p!).some((g) => g.sops.includes(s))).toBe(true);
  });

  it("gliedert die Auswahl in Dach-SOPs und vier Leseblöcke; Teil A ist gemeinsam", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(gemeinsameSops(p!).map((s) => s.id)).toEqual(["teil-a"]);
    expect(sopGruppen(p!).map((g) => [g.titel, g.sops.length])).toEqual([
      ["Dach-SOPs je Ereignisart", 17],
      ["Ergänzende Bausteine: Besondere Ereignis- und Gefahrenlagen", 6],
      ["Ergänzende Bausteine: Gesundheit und medizinische Versorgung", 4],
      ["Ergänzende Bausteine: Versorgung, Kommunikation und Logistik", 5],
      ["Ergänzende Bausteine: Lageübergreifende Querschnitte", 2],
    ]);
  });

  it("Ereigniswechsel ergänzt Dach-SOPs und lässt Bausteine stehen", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const an = sopsNachArtwechsel(p!, ["c11"], [], "Stromausfall / Blackout");
    expect(an).toEqual({ arten: ["Stromausfall / Blackout"], sops: ["c11", "b08"] });
    const aus = sopsNachArtwechsel(p!, an.sops, an.arten, "Stromausfall / Blackout");
    expect(aus).toEqual({ arten: [], sops: ["c11"] });
  });

  it("frühere Kennungen bleiben auflösbar (N02 → C11, N13 → C17, 08 → B08)", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(sopKennungenAbgleichen(["SOP-LEAD N02 alt", "SOP-LEAD N13 alt", "SOP-LEAD 08 alt"], p!).map((k) => k.split(" ")[1])).toEqual(["C11", "C17", "B08"]);
  });

  it("leere Menge beigefügter SOPs lässt nichts durch (SOP-CODE-01)", async () => {
    const { profil: p } = await profil("lead-beispiel");
    expect(sopKennungenAbgleichen(["SOP-LEAD C11 x"], p!, new Set())).toEqual([]);
    expect(sopKennungenAbgleichen(["SOP-LEAD B08 x", "SOP-LEAD C11 x"], p!, new Set(["b08"]))).toEqual(["SOP-LEAD B08 Stromausfall / Blackout v2.0.1"]);
  });

  it("Nachweis = beigefügte SOPs, unabhängig vom Antwortformat; Abweichungen als Hinweis (SOP-CODE-02)", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const k = kontext(p, ["b08", "c11", "c16"]);
    const erwartet = ["b08", "c11", "c16"].map((id) => sopKennung(fachSops(p!).find((s) => s.id === id)!));
    const faelle: [unknown, RegExp | null][] = [
      [undefined, /nicht angegeben/],
      [[], /nicht als angewandt genannt: SOP-LEAD B08/],
      [["SOP-LEAD B08 Strom"], /nicht als angewandt genannt: SOP-LEAD C11 .*; SOP-LEAD C16/],
      [
        ["SOP-LEAD B08 x", "SOP-LEAD C11 x", "SOP-LEAD C16 x", "SOP-LEAD C17 erfunden", "SOP-LEAD 99 unbekannt"],
        /nicht beigefügt waren \(verworfen\): SOP-LEAD C17/,
      ],
      [["SOP-LEAD 08 alt", "SOP-LEAD N02 alt", "SOP-LEAD N03 alt"], null],
    ];
    for (const [angabe, hinweis] of faelle) {
      const h: string[] = [];
      const d: any = nachbearbeiten({ _entstehung: angabe === undefined ? {} : { sop: angabe }, sachverhalte: [] }, k, "claude-test", [], h);
      expect(d._entstehung.sop, JSON.stringify(angabe)).toEqual(erwartet);
      if (hinweis) expect(h.join(" "), JSON.stringify(angabe)).toMatch(hinweis);
      else expect(h, JSON.stringify(angabe)).toEqual([]);
    }
    expect(sopAngabeVergleichen(["SOP-LEAD 99 x"], p!, ["b08"]).join(" ")).toMatch(/unbekannte SOP-Kennungen \(verworfen\): SOP-LEAD 99 x/);
    // Keine beigefügte SOP: Nachweis leer, Modellangabe verworfen
    const h: string[] = [];
    const d: any = nachbearbeiten({ _entstehung: { sop: ["SOP-LEAD C11 x"] }, sachverhalte: [] }, kontext(p, []), "claude-test", [], h);
    expect(d._entstehung.sop).toEqual([]);
    expect(h.join(" ")).toMatch(/nicht beigefügt waren/);
  });

  it("Lagebild-Tabelle und CSV führen die SOP-Angabe der Entstehung", async () => {
    const { profil: p } = await profil("lead-beispiel");
    const spalte = spalten(p!).find((s) => s.titel === "SOP (Entstehung)")!;
    expect(spalte).toBeTruthy();
    const e = (entstehung: unknown) => ({ name: "x", daten: { _entstehung: entstehung } }) as any;
    expect(spalte.wert(e({ verfahren: "KI-Entwurf", sop: ["SOP-LEAD 08 Stromausfall / Blackout v2.0"] }))).toBe("SOP-LEAD 08 Stromausfall / Blackout v2.0");
    expect(spalte.wert(e({ verfahren: "KI-Entwurf", sop: [] }))).toBe("keine");
    expect(spalte.wert(e({ verfahren: "KI-Entwurf" }))).toBe("nicht dokumentiert");
    expect(sopNachweis({ verfahren: "manuell" })).toBe("");
  });
});
