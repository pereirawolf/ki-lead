// Prüft eigene, nicht eingecheckte Profile und Testdaten im Ordner privat/ (per .gitignore ausgeschlossen).
// Erwartete Struktur: privat/profile/<ordner>/ und privat/testdaten/<satz>/*.json mit einer Datei
// privat/testdaten/<satz>/profil.txt, die den Profilordner nennt. Fehlt der Ordner, wird übersprungen.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PRIVAT, PRIVAT_VORHANDEN, profil } from "../support/dateien";
import { pruefeGegenSchema } from "../../src/kern/validierung";
import { migriere } from "../../src/kern/migration";
import { quellenHinweise } from "../../src/kern/quellen";
import { pflichtHinweise } from "../../src/kern/kennsaetze";

const profilOrdner = PRIVAT_VORHANDEN && existsSync(join(PRIVAT, "profile")) ? readdirSync(join(PRIVAT, "profile")) : [];
const saetze =
  PRIVAT_VORHANDEN && existsSync(join(PRIVAT, "testdaten"))
    ? readdirSync(join(PRIVAT, "testdaten")).filter((s) => existsSync(join(PRIVAT, "testdaten", s, "profil.txt")))
    : [];

describe.skipIf(!profilOrdner.length)("Private Profile", () => {
  for (const ordner of profilOrdner) {
    it(`${ordner}: lädt ohne Fehler und Warnungen`, async () => {
      const { befunde } = await profil(ordner);
      expect(befunde.filter((b) => b.stufe !== "hinweis")).toEqual([]);
    });
  }
});

describe.skipIf(!saetze.length)("Private Testdaten", () => {
  for (const satz of saetze) {
    const dir = join(PRIVAT, "testdaten", satz);
    const ordner = readFileSync(join(dir, "profil.txt"), "utf-8").trim();
    for (const name of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
      it(`${satz}/${name}: schemakonform, Quellen stimmig`, async () => {
        const { profil: p } = await profil(ordner);
        const mig = migriere(JSON.parse(readFileSync(join(dir, name), "utf-8")), p!);
        expect(mig.bekannt).toBe(true);
        expect(pruefeGegenSchema(p!.schema, mig.daten, p!.ui)).toEqual([]);
        expect(quellenHinweise(mig.daten, p!.ui).filter((b) => b.stufe === "warnung")).toEqual([]);
        expect(pflichtHinweise(mig.daten, p!.ui)).toEqual([]);
      });
    }
  }
});
