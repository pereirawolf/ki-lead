// @vitest-environment jsdom
// KI-Erfassung → „Frühere Läufe mit diesem Profil“: alle Läufe als eine ZIP-Datei speichern, alle Läufe löschen.
// Maßgeblich ist die Liste dieses Profils; Läufe anderer Profile bleiben unberührt.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import JSZip from "jszip";
import { profil } from "../support/dateien";
import { aushaengen, bisWahr, dialogAntwort, einhaengen, klick, knopf, reactUmgebung, seitentext } from "../support/dom";
import { speicherLeeren, type SpeicherZustand } from "../support/speicher";
import { STANDARD } from "../../src/pipeline/einstellungen";
import { neuerLauf, type Lauf } from "../../src/pipeline/lauf";

const downloads = vi.hoisted(() => ({ liste: [] as { name: string; inhalt: Blob }[] }));
const db = vi.hoisted(() => ({ werte: new Map<string, any>() }) as SpeicherZustand);
vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(db));
vi.mock("../../src/speicher/speicher", async (orig) => {
  const echt = await orig<typeof import("../../src/speicher/speicher")>();
  return { ...echt, dateiAnbieten: (inhalt: Blob, name: string) => void downloads.liste.push({ name, inhalt }) };
});

beforeAll(reactUmgebung);
afterEach(async () => {
  downloads.liste = [];
  vi.restoreAllMocks();
  await aushaengen();
  speicherLeeren(db);
});

type Profil = Awaited<ReturnType<typeof profil>>["profil"] & {};

/** Legt einen gespeicherten Lauf an; `id` und Beginn werden gesetzt, damit Reihenfolge und Namen feststehen */
function lauf(p: Profil, id: string, erstellt: string, sachverhalt: string, profilId?: string): Lauf {
  const bezug = profilId ? { ...p, manifest: { ...p.manifest, id: profilId } } : p;
  const l = neuerLauf(bezug, { sachverhalt, stichworte: "", urls: [], stichtag: "2026-10-14", prueffrage: "" }, []);
  l.id = id;
  l.erstellt = erstellt;
  l.aktualisiert = erstellt;
  l.status = "fehler";
  db.werte.set(`lauf:${id}`, l);
  return l;
}

async function erfassungZeigen(p: Profil) {
  const { KiErfassung } = await import("../../src/ui/KiErfassung");
  await einhaengen(
    React.createElement(KiErfassung, {
      profil: p,
      einstellungen: STANDARD,
      schluessel: { anthropic: "", openai: "", mistral: "" },
      zuEinstellungen: () => {},
      uebernehmen: () => {},
    }),
  );
}

const laufKeys = () => [...db.werte.keys()].filter((k) => k.startsWith("lauf:")).sort();

describe("KI-Erfassung: frühere Läufe gesammelt sichern und löschen", () => {
  it("ohne frühere Läufe gibt es weder die Liste noch die Sammelknöpfe", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    await erfassungZeigen(p);
    expect(seitentext()).not.toContain("Frühere Läufe mit diesem Profil");
    expect(knopf("Alle als ZIP speichern")).toBeUndefined();
    expect(knopf("Alle löschen")).toBeUndefined();
  });

  it("„Alle als ZIP speichern“ packt je Lauf dieses Profils ein Protokoll, andere Profile bleiben draußen", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    const a = lauf(p, "20261020-101500-aaaa", "2026-10-20T10:15:00.000Z", "Kraftstoff");
    const b = lauf(p, "20261021-111500-bbbb", "2026-10-21T11:15:00.000Z", "Stromausfall");
    lauf(p, "20261022-121500-cccc", "2026-10-22T12:15:00.000Z", "fremd", "anderes-profil");
    await erfassungZeigen(p);
    await bisWahr(() => seitentext().includes("Frühere Läufe mit diesem Profil (2)"));

    await klick("Alle als ZIP speichern");
    await bisWahr(() => downloads.liste.length === 1);

    const { name, inhalt } = downloads.liste[0];
    expect(name).toMatch(new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}_KI-LEAD_Laeufe_${p.manifest.id}\\.zip$`));
    const zip = await JSZip.loadAsync(await inhalt.arrayBuffer());
    const dateien = Object.keys(zip.files).sort();
    expect(dateien).toHaveLength(2);
    expect(dateien[0]).toMatch(/_KI-LEAD_Lauf_20261020-101500-aaaa\.json$/);
    expect(dateien[1]).toMatch(/_KI-LEAD_Lauf_20261021-111500-bbbb\.json$/);
    // Inhalt wie beim Einzelexport: das vollständige Laufprotokoll
    const inA = JSON.parse(await zip.files[dateien[0]].async("string"));
    expect(inA).toEqual(JSON.parse(JSON.stringify(a)));
    expect(JSON.parse(await zip.files[dateien[1]].async("string")).auftrag.sachverhalt).toBe(b.auftrag.sachverhalt);
    // Speichern verändert nichts
    expect(laufKeys()).toHaveLength(3);
  });

  it("„Alle löschen“ fragt nach; Abbrechen löscht nichts", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    lauf(p, "20261020-101500-aaaa", "2026-10-20T10:15:00.000Z", "Kraftstoff");
    lauf(p, "20261021-111500-bbbb", "2026-10-21T11:15:00.000Z", "Stromausfall");
    await erfassungZeigen(p);
    await bisWahr(() => seitentext().includes("Frühere Läufe mit diesem Profil (2)"));

    const frage = dialogAntwort(false);
    await klick("Alle löschen");
    expect(frage).toHaveBeenCalledTimes(1);
    expect(frage.mock.calls[0][0]).toContain("Alle 2 früheren Läufe");
    expect(frage.mock.calls[0][0]).toContain("nicht rückgängig");
    expect(laufKeys()).toHaveLength(2);
    expect(seitentext()).toContain("Frühere Läufe mit diesem Profil (2)");
  });

  it("„Alle löschen“ entfernt nach Bestätigung alle Läufe dieses Profils, nicht die anderer Profile", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    lauf(p, "20261020-101500-aaaa", "2026-10-20T10:15:00.000Z", "Kraftstoff");
    lauf(p, "20261021-111500-bbbb", "2026-10-21T11:15:00.000Z", "Stromausfall");
    lauf(p, "20261022-121500-cccc", "2026-10-22T12:15:00.000Z", "fremd", "anderes-profil");
    await erfassungZeigen(p);
    await bisWahr(() => seitentext().includes("Frühere Läufe mit diesem Profil (2)"));

    dialogAntwort(true);
    await klick("Alle löschen");
    await bisWahr(() => !seitentext().includes("Frühere Läufe mit diesem Profil"));

    expect(laufKeys()).toEqual(["lauf:20261022-121500-cccc"]);
    expect(knopf("Alle löschen")).toBeUndefined();
    expect(knopf("Alle als ZIP speichern")).toBeUndefined();
  });

  it("bei genau einem früheren Lauf steht die Rückfrage im Singular", async () => {
    const p = (await profil("lead-beispiel")).profil!;
    lauf(p, "20261020-101500-aaaa", "2026-10-20T10:15:00.000Z", "Kraftstoff");
    await erfassungZeigen(p);
    await bisWahr(() => seitentext().includes("Frühere Läufe mit diesem Profil (1)"));
    const frage = dialogAntwort(false);
    await klick("Alle löschen");
    expect(frage.mock.calls[0][0]).toContain("Den einen früheren Lauf");
  });
});
