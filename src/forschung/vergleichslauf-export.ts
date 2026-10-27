// Export einer Vergleichsreihe: Übersicht als CSV (S1 und Kette), Dateinamen, LIESMICH und ZIP-Datei mit Rohdaten.
// Seit 0.6.2 eigene Datei (TP-2026-W44-06), vorher in vergleichslauf.ts.

import FALL from "../../evaluation/faelle/orkantief-ilka-verdichtung.json";
import { ohneBase64 } from "../pipeline/lauf";
import { FALL_TITEL, S1_ZUSCHNITT, type EinzelErgebnis, type Reihe } from "./vergleichslauf";
import { reiheUmfang, umfangInfo, type Umfang } from "./vergleichsumfang";

const csvZelle = (c: unknown) => {
  const s = c === null || c === undefined ? "" : typeof c === "number" ? String(c).replace(".", ",") : String(c);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function csv(zeilen: unknown[][]): string {
  return zeilen.map((z) => z.map(csvZelle).join(";")).join("\r\n") + "\r\n";
}

/** Radarachsen, wie der Vergleich sie liefert (Beispielprofil: d1 … d8) */
function radarAchsen(ergebnisse: EinzelErgebnis[]): string[] {
  for (const e of ergebnisse) for (const p of e.lauf.vergleich?.ergebnis.paare ?? []) if (p.ki) return Object.keys(p.ki.radar);
  return ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"];
}

/** Übersicht im Umfang „S1“: eine Zeile je Sachverhalt des Vorschlags, mit dem Vergleich zum Zuschnitt der Musterfassung */
function s1UebersichtZeilen(reihe: Reihe, ergebnisse: EinzelErgebnis[]): unknown[][] {
  const kopf = [
    "lauf",
    "variante",
    "status",
    "technisch_bestanden",
    "s1_modell",
    "s1_aufwand",
    "mistral_endpunkt",
    "s1_dauer_s",
    "s1_ausgabetoken",
    "kosten_usd",
    "sachverhalte",
    "gliederung_wie_muster",
    "zuordnung_wie_muster",
    "eingaenge_zugeordnet",
    "sop_abdeckung",
    "sops_zusaetzlich",
    "sops_fehlend",
    "befunde",
    "sv",
    "sv_titel",
    "ereignisarten",
    "sops",
    "eingaenge",
  ];
  const ja = (b: boolean | undefined) => (b === undefined ? null : b ? "ja" : "nein");
  const zeilen: unknown[][] = [kopf];
  for (const e of ergebnisse) {
    const st = e.eintrag.stufen.find((s) => s.stufe.startsWith("S1"));
    const v = e.eintrag.s1_vergleich ?? undefined;
    const basis = [
      e.lauf.id,
      reihe.variante ?? "",
      e.lauf.status,
      e.eintrag.technisch_bestanden ? "ja" : "nein",
      reihe.modelle.s1.modell,
      reihe.modelle.s1.aufwand,
      reihe.modelle.s1.anbieter === "mistral" ? (reihe.mistral_endpunkt ?? "") : "",
      st?.dauer_s ?? null,
      st?.ausgabetoken ?? null,
      e.lauf.kostenUsd ?? e.lauf.kostenBekanntUsd ?? null,
      v?.sachverhalte ?? null,
      ja(v?.gliederung_wie_muster),
      ja(v?.zuordnung_wie_muster),
      v?.eingaenge_zugeordnet ?? null,
      v?.sop_abdeckung ?? null,
      v?.sops_zusaetzlich.join(", ") ?? null,
      v?.sops_fehlend.join(", ") ?? null,
      v?.befunde.join("; ") ?? null,
    ];
    const svs = e.lauf.vorschlag?.sachverhalte ?? [];
    if (!svs.length) zeilen.push([...basis, null, null, null, null, null]);
    svs.forEach((s, i) =>
      zeilen.push([...basis, i + 1, s.titel, (s.ereignisarten ?? []).join(", "), (s.sops ?? []).join(", "), (s.eingangsmeldungen ?? []).length]),
    );
  }
  return zeilen;
}

/**
 * Übersicht der Reihe: eine Zeile je Sachverhalt eines Laufs, mit Konfiguration und Kennzahlen (Semikolon,
 * Dezimalkomma). Im Umfang „S1“ eine Zeile je Sachverhalt des S1-Vorschlags.
 */
export function uebersichtZeilen(reihe: Reihe, ergebnisse: EinzelErgebnis[]): unknown[][] {
  if (reiheUmfang(reihe) === "s1") return s1UebersichtZeilen(reihe, ergebnisse);
  const RADAR = radarAchsen(ergebnisse);
  const kopf = [
    "lauf",
    "variante",
    "status",
    "technisch_bestanden",
    "s1_modell",
    "s1_aufwand",
    "s2_modell",
    "s2_aufwand",
    "reparatur_modell",
    "mistral_endpunkt",
    "s1_dauer_s",
    "s2_dauer_s",
    "dauer_s",
    "s1_ausgabetoken",
    "s2_ausgabetoken",
    "kosten_usd",
    "plausibilitaet_befunde",
    "sachverhalte",
    "sv",
    "sv_bezeichnung",
    "beurteilung",
    "tendenz",
    ...RADAR,
    "ref_gegenstueck",
    "aehnlichkeit",
    "umfang",
  ];
  const zeilen: unknown[][] = [kopf];
  for (const e of ergebnisse) {
    const st = (p: string) => e.eintrag.stufen.find((s) => s.stufe.startsWith(p));
    const basis = [
      e.lauf.id,
      reihe.variante ?? "",
      e.lauf.status,
      e.eintrag.technisch_bestanden ? "ja" : "nein",
      reihe.modelle.s1.modell,
      reihe.modelle.s1.aufwand,
      reihe.modelle.s2.modell,
      reihe.modelle.s2.aufwand,
      reihe.modelle.reparatur.modell,
      reihe.mistral_endpunkt ?? "",
      st("S1")?.dauer_s ?? null,
      st("S2")?.dauer_s ?? null,
      e.eintrag.dauer_s,
      st("S1")?.ausgabetoken ?? null,
      st("S2")?.ausgabetoken ?? null,
      e.lauf.kostenUsd ?? e.lauf.kostenBekanntUsd ?? null,
      e.eintrag.kennzahlen.plausibilitaet_befunde,
    ];
    const paare = (e.lauf.vergleich?.ergebnis.paare ?? []).filter((p) => p.ki);
    const svs = paare.length ? paare : [undefined];
    const anzahlSv = paare.length;
    svs.forEach((p, i) => {
      zeilen.push([
        ...basis,
        anzahlSv,
        p ? i + 1 : null,
        p?.ki?.bezeichnung ?? null,
        p?.ki?.beurteilung ?? null,
        p?.ki?.tendenz ?? null,
        ...RADAR.map((d) => (p?.ki ? (p.ki.radar[d] ?? "offen") : null)),
        p?.ref?.bezeichnung ?? null,
        p ? Math.round(p.aehnlichkeit * 100) / 100 : null,
        reiheUmfang(reihe),
      ]);
    });
  }
  return zeilen;
}

/** Teil eines Dateinamens: nur Buchstaben, Ziffern, Punkt und Bindestrich */
export const dateiKurz = (s: string) =>
  s
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** Zeitstempel für Dateinamen in Ortszeit, z. B. 20261024-2130 */
export function dateiStempel(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Kennzeichen des Umfangs im Dateinamen; die ganze Kette (Vorgabe) bleibt ohne, wie bis 0.5.11 */
const UMFANG_DATEI: Record<Exclude<Umfang, "ms">, string> = { s1: "S1_", "s1-s2": "S1-S2_", "s1-s2-s3": "", "s2-s3": "S2-S3-Muster_" };

/**
 * Dateiname der ZIP-Datei, z. B. KI-LEAD_Testlauf_Ilka_mistral-medium-3-5-high_20261024-2130.zip; mit Umfang
 * z. B. KI-LEAD_Testlauf_Ilka_S1_gpt-6-luna-high_… (bis 0.5.16 KI-LEAD_Vergleichslauf_Ilka_…) (benannt nach dem Modell der ersten genutzten Stufe)
 */
export function zipDateiname(reihe: Reihe): string {
  const u = reiheUmfang(reihe);
  const variante = reihe.variante ? `${dateiKurz(reihe.variante.split("/").pop()!)}_` : "";
  const m = u === "s1" ? reihe.modelle.s1 : reihe.modelle.s2;
  return `KI-LEAD_Testlauf_Ilka_${UMFANG_DATEI[u]}${variante}${dateiKurz(`${m.modell}-${m.aufwand}`)}_${dateiStempel(reihe.erstellt)}.zip`;
}

function liesmich(reihe: Reihe, ergebnisse: EinzelErgebnis[]): string {
  const m = reihe.modelle;
  const u = reiheUmfang(reihe);
  const stufen = [
    u !== "s2-s3" ? `S1: ${m.s1.modell} (${m.s1.aufwand})` : "",
    u !== "s1" ? `S2 Verdichtung: ${m.s2.modell} (${m.s2.aufwand})` : "",
    u === "s1-s2-s3" || u === "s2-s3" ? `Reparatur: ${m.reparatur.modell} (${m.reparatur.aufwand})` : "",
  ].filter(Boolean);
  const punkte = u === "s1" ? "T1, T2, T4–T6" : "T1–T8";
  return [
    `KI-LEAD – Testlauf Ilka: ${umfangInfo(u).titel} (${FALL_TITEL})`,
    "",
    `Erstellt: ${reihe.erstellt} mit ${reihe.app}, Profil ${reihe.profil.id} ${reihe.profil.version} (${reihe.profil.hash.slice(0, 12)}…)`,
    ...(reihe.variante ? [`Variante: ${reihe.variante}`] : []),
    `Fall: ${reihe.fall} (evaluation/faelle/${reihe.fall}.json); t0 ${FALL.auftrag.meldezeitpunkt}, ohne Websuche, ${
      reihe.s1_fest
        ? `S1-Gegenstand fest vorgegeben (${reihe.s1_fest.datei}, ${reihe.s1_fest.sha256.slice(0, 12)}…)`
        : u === "s1"
          ? `nur S1; Vergleich mit dem Zuschnitt der Musterfassung (${S1_ZUSCHNITT.datei})`
          : "S1-Vorschlag unverändert übernommen"
    }${u === "s1-s2" ? "; ohne S3 (keine Vervollständigung, keine Reparatur)" : ""}.`,
    stufen.join(" · ") + (reihe.mistral_endpunkt ? ` · Mistral-Endpunkt: ${reihe.mistral_endpunkt}` : ""),
    `Läufe: ${ergebnisse.length} von ${reihe.laeufe_geplant}${reihe.beendet ? ` (${reihe.beendet})` : ""}; technisch bestanden (${punkte}): ${reihe.technisch_bestanden}; Kosten zusammen ${reihe.kosten_usd_summe} USD (Listenpreise, ohne Gewähr).`,
    "",
    "Inhalt:",
    ...(u === "s1"
      ? [
          "- reihe.json: Reihendatei (Format ki-lead-abnahme/1, umfang „s1“) mit Prüfpunkten, Kennzahlen je Stufe und dem Vergleich mit dem Zuschnitt der Musterfassung (s1_vergleich)",
          "- uebersicht.csv: eine Zeile je Sachverhalt des S1-Vorschlags und Lauf (Semikolon, Dezimalkomma)",
          "- laeufe/<lauf>.lauf.json: vollständige Laufprotokolle (ki-lead-lauf/1) mit Prompt, Rohantwort, Token, Dauer und Kosten",
          "- s1/<lauf>.s1.json: S1-Vorschläge",
        ]
      : [
          "- reihe.json: Reihendatei (Format ki-lead-abnahme/1) mit Prüfpunkten, Kennzahlen je Stufe und je Lauf, Plausibilitätsbefunden, Kurzantwort und Entwurf",
          "- uebersicht.csv: eine Zeile je Sachverhalt und Lauf (Semikolon, Dezimalkomma), zum Vergleich mehrerer Konfigurationen",
          "- laeufe/<lauf>.lauf.json: vollständige Laufprotokolle (ki-lead-lauf/1) mit Prompts, Rohantworten, Token, Dauer und Kosten",
          "- meldungen/<lauf>.meldung.json: Entwürfe (LEAD-Meldung-v1)",
          "- vergleiche/<lauf>.vergleich.csv: Vergleich mit der Redaktionsfassung je Sachverhalt und Achse",
          "",
          "Vergleich mehrerer Konfigurationen im Repository: npm run vergleichslauf:auswerten -- <ZIP-Dateien> (Bezug: KI-Profil Anthropic)",
          "Mehrfachvergleich der Entwürfe im Repository: npm run vergleich:mehrfach -- <entpackter Ordner>/meldungen --fall orkantief-ilka-verdichtung",
        ]),
    "Alle Inhalte sind fiktiv. Laufprotokolle gehören nicht ins öffentliche Repository (docs/ERPROBUNG.md, Abschnitt 6).",
    "",
  ].join("\r\n");
}

/** ZIP mit Reihendatei, Übersicht, Laufprotokollen, Entwürfen und Vergleichen */
export async function reiheZip(reihe: Reihe, ergebnisse: EinzelErgebnis[]): Promise<Uint8Array> {
  // jszip erst bei Bedarf laden (seit 0.6.5, TP-2026-W44-18): nicht im Haupt-JavaScript
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("LIESMICH.txt", liesmich(reihe, ergebnisse));
  zip.file("reihe.json", JSON.stringify(reihe, null, 2));
  zip.file("uebersicht.csv", "﻿" + csv(uebersichtZeilen(reihe, ergebnisse)));
  for (const e of ergebnisse) {
    zip.file(`laeufe/${e.lauf.id}.lauf.json`, JSON.stringify(ohneBase64(e.lauf), null, 2));
    if (e.meldung) zip.file(`meldungen/${e.lauf.id}.meldung.json`, JSON.stringify(e.meldung, null, 2));
    if (reiheUmfang(reihe) === "s1" && e.lauf.vorschlag) zip.file(`s1/${e.lauf.id}.s1.json`, JSON.stringify(e.lauf.vorschlag, null, 2));
    if (e.vergleichTabelle) zip.file(`vergleiche/${e.lauf.id}.vergleich.csv`, "﻿" + csv(e.vergleichTabelle));
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
