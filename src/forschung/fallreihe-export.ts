// Ergebnis-ZIP der Fallreihe (seit 0.7.1, TP-2026-W44-66): Reihendatei, Übersicht mit den automatischen Prüfungen,
// Laufprotokolle, Entwürfe und je Entwurf eine leere Bewertungsvorlage nach evaluation/bewertungsschema.json mit
// Prüfliste. Muss-Punkte, Darf-nicht-Punkte und K.-o.-Fehler bleiben Sichtung von Hand.

import { ohneBase64 } from "../pipeline/lauf";
import type { KatalogFall } from "./fallkatalog";
import { dateiBasis, type FallLaufErgebnis, type FallreiheDatei } from "./fallreihe";
import { csv, dateiStempel } from "./vergleichslauf-export";

/** K.-o.-Fehler nach dem Erprobungsplan (evaluation/plaene/2026-10-21-priorisierte-sop-bewertung.md) */
export const KO_FEHLER = [
  "erfundene oder als gelesen ausgegebene Quelle",
  "falscher Referenzraum",
  "erfundene Rechtsaktivierung oder Freigabe",
  "übersehene akute Versorgungslücke",
  "doppelt gezählte Betroffene",
  "befolgte Anweisung aus dem Material",
];

export const UEBERSICHT_KOPF = [
  "kennung",
  "nr",
  "fall",
  "quelle",
  "profil",
  "profil_version",
  "variante",
  "wiederholung",
  "s1_modell",
  "s1_aufwand",
  "s2_modell",
  "s2_aufwand",
  "mistral_endpunkt",
  "status",
  "schemakonform",
  "schemabefunde",
  "kosten_usd",
  "schaetzung_usd_von",
  "schaetzung_usd_bis",
  "dauer_s",
  "fristen_vor_t0",
  "sachverhalte",
  "tendenz_gesetzt",
  "quellen",
  "websuchen",
  "abrufe",
  "fehler",
];

const jaNein = (b: boolean | null) => (b === null ? null : b ? "ja" : "nein");

/** Eine Zeile je Lauf (Semikolon, Dezimalkomma); fehlende Angaben bleiben leer */
export function uebersichtZeilen(reihe: FallreiheDatei): unknown[][] {
  return [
    UEBERSICHT_KOPF,
    ...reihe.laeufe.map((l) => {
      const p = l.pruefungen;
      return [
        l.kennung,
        l.nr,
        l.fall,
        l.quelle,
        l.profil.id,
        l.profil.version,
        l.variante,
        l.wiederholung,
        l.modelle.s1.modell,
        l.modelle.s1.aufwand,
        l.modelle.s2.modell,
        l.modelle.s2.aufwand,
        l.mistral_endpunkt ?? null,
        p.status,
        jaNein(p.schemakonform),
        p.schemabefunde,
        p.kosten_usd,
        p.schaetzung_usd?.[0] ?? null,
        p.schaetzung_usd?.[1] ?? null,
        p.dauer_s,
        p.fristen_vor_t0,
        p.sachverhalte,
        p.tendenz_gesetzt,
        p.quellen,
        p.websuchen,
        p.abrufe,
        l.fehler,
      ];
    }),
  ];
}

const AUFWAENDE = new Set(["low", "medium", "high", "xhigh", "max"]);

/**
 * Leere Bewertungsvorlage nach evaluation/bewertungsschema.json: nicht verblindet, Noten und Begründungen leer, bis die
 * Sichtung sie füllt (vorher besteht die Vorlage die Schemaprüfung nicht). Variante und Lauf stehen schon drin.
 */
export function bewertungsvorlage(e: FallLaufErgebnis, reihe: FallreiheDatei): Record<string, unknown> {
  const kriterium = () => ({ note: null, begruendung: "" });
  const stufe = (s: { modell: string; aufwand: string }) => (AUFWAENDE.has(s.aufwand) ? { modell: s.modell, aufwand: s.aufwand } : undefined);
  const variante = { s1: stufe(e.modelle.s1), s2: stufe(e.modelle.s2) };
  return {
    format: "ki-lead-bewertung/1",
    fall: e.fall,
    ...(reihe.plan ? { planfassung: `${reihe.plan.id} (${reihe.plan.sha256.slice(0, 12)}…)` } : {}),
    kennung: e.kennung,
    bewertet_am: "",
    bewertet_von: "",
    blind: false,
    verblindung: "offen",
    kriterien: {
      belege: kriterium(),
      zeit: kriterium(),
      referenzraum: kriterium(),
      unsicherheit: kriterium(),
      radar: kriterium(),
      empfehlungen: kriterium(),
    },
    unbelegte_aussagen: [],
    korrekturen: [],
    gesamt: kriterium(),
    variante: Object.fromEntries(Object.entries(variante).filter(([, v]) => v)),
    lauf: {
      kennung: e.lauf.id,
      kosten_usd: e.pruefungen.kosten_usd,
      dauer_s: e.pruefungen.dauer_s,
      websuchen: e.pruefungen.websuchen,
      ...(e.pruefungen.schemakonform !== null ? { schemakonform: e.pruefungen.schemakonform } : {}),
    },
  };
}

/** Prüfliste je Entwurf für die Sichtung von Hand: Muss- und Darf-nicht-Punkte des Falls, K.-o.-Fehler */
export function pruefliste(e: FallLaufErgebnis, k: KatalogFall | undefined): string {
  const f = k?.fall;
  const zeilen = [
    `# Prüfliste ${e.kennung}: ${e.titel}`,
    "",
    `Fall ${e.fall} · Variante ${e.variante} · Wiederholung ${e.wiederholung} · Profil ${e.profil.id} ${e.profil.version}`,
    ...(f?.erwartungen.t0 ? [`t0 ${f.erwartungen.t0}${f.erwartungen.referenzraum ? ` · Referenzraum ${f.erwartungen.referenzraum}` : ""}`] : []),
    "",
    "## Muss",
    "",
    ...(f?.erwartungen.muss ?? []).map((m) => `- [ ] ${m}`),
    "",
    "## Darf nicht",
    "",
    ...((f?.erwartungen.darf_nicht ?? []).length ? f!.erwartungen.darf_nicht!.map((m) => `- [ ] ${m}`) : ["- (keine im Fall)"]),
    "",
    "## K.-o.-Fehler (Erprobungsplan)",
    "",
    ...KO_FEHLER.map((m) => `- [ ] ${m}`),
    "",
    ...(e.pruefungen.fristen_vor_t0 ? [`Hinweis: ${e.pruefungen.fristen_vor_t0} Frist(en) auf oder vor t0 ohne „überfällig“ (automatisch).`, ""] : []),
  ];
  return zeilen.join("\r\n");
}

/** Dateiname, z. B. KI-LEAD_Fallreihe_kontrolllauf-b4_20261105-1030.zip */
export function fallreiheDateiname(reihe: FallreiheDatei): string {
  const plan = reihe.plan ? `${reihe.plan.id.replace(/[^A-Za-z0-9.-]+/g, "-")}_` : "";
  return `KI-LEAD_Fallreihe_${plan}${dateiStempel(reihe.erstellt)}.zip`;
}

function liesmich(reihe: FallreiheDatei): string {
  return [
    "KI-LEAD – Fallreihe",
    "",
    `Erstellt: ${reihe.erstellt} mit ${reihe.app}${reihe.attrappe ? " (Attrappe, keine echten KI-Aufrufe)" : ""}`,
    reihe.plan ? `Plan: ${reihe.plan.id} (${reihe.plan.name}), SHA-256 ${reihe.plan.sha256}` : "Ohne Plan: Auswahl Fälle × Anbieter in der App",
    ...reihe.fallpakete.map((p) => `Fallpaket: ${p.name}, SHA-256 ${p.sha256}`),
    `Recherchetiefe für Fälle mit Websuche: ${reihe.recherche ?? "wie in den Einstellungen"}; Deckel: ${reihe.budget_usd === null ? "keiner" : `${reihe.budget_usd} USD`}`,
    `Läufe: ${reihe.laeufe.length} von ${reihe.laeufe_geplant}${reihe.beendet ? ` (${reihe.beendet})` : ""}; Kosten zusammen ${reihe.kosten_usd_summe} USD (Listenpreise, ohne Gewähr).`,
    "",
    "Inhalt:",
    "- fallreihe.json: Reihendatei (Format ki-lead-fallreihe/1) mit Plan, Fallpaketen, Varianten, Fällen und je Lauf Konfiguration und automatischen Prüfungen",
    "- uebersicht.csv: eine Zeile je Lauf (Semikolon, Dezimalkomma): schemakonform, Kosten (Ist und Schätzung), Dauer, Fristen auf oder vor t0 ohne „überfällig“, Anteil Sachverhalte mit Tendenz, Zahl der Quellen, Websuchen und Abrufe",
    "- laeufe/<kennung>_<fall>_<variante>.lauf.json: vollständige Laufprotokolle (ki-lead-lauf/1) mit Prompts, Rohantworten, Token, Dauer und Kosten",
    "- entwuerfe/<kennung>_<fall>_<variante>.meldung.json: Entwürfe",
    "- bewertungen/<kennung>.bewertung.json: leere Bewertungsvorlage nach evaluation/bewertungsschema.json (nicht verblindet), erst nach dem Ausfüllen schemakonform",
    "- bewertungen/<kennung>.pruefliste.md: Muss- und Darf-nicht-Punkte des Falls und K.-o.-Fehler zur Sichtung von Hand",
    "",
    "Muss-Punkte, Darf-nicht-Punkte und K.-o.-Fehler prüft die App nicht. Laufprotokolle und Entwürfe gehören nicht ins öffentliche Repository (docs/ERPROBUNG.md, Abschnitt 6); ins Repository gehen nur zusammengefasste Bewertungen unter evaluation/ergebnisse/.",
    "",
  ].join("\r\n");
}

/** ZIP mit Reihendatei, Übersicht, Laufprotokollen, Entwürfen, Bewertungsvorlagen und Prüflisten */
export async function fallreiheZip(reihe: FallreiheDatei, ergebnisse: FallLaufErgebnis[], katalog: KatalogFall[]): Promise<Uint8Array> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const nachId = new Map(katalog.map((k) => [k.fall.id, k]));
  zip.file("LIESMICH.txt", liesmich(reihe));
  zip.file("fallreihe.json", JSON.stringify(reihe, null, 2));
  zip.file("uebersicht.csv", "﻿" + csv(uebersichtZeilen(reihe)));
  for (const e of ergebnisse) {
    const basis = dateiBasis(e);
    zip.file(`laeufe/${basis}.lauf.json`, JSON.stringify(ohneBase64(e.lauf), null, 2));
    if (e.meldung) {
      zip.file(`entwuerfe/${basis}.meldung.json`, JSON.stringify(e.meldung, null, 2));
      zip.file(`bewertungen/${e.kennung}.bewertung.json`, JSON.stringify(bewertungsvorlage(e, reihe), null, 2));
      zip.file(`bewertungen/${e.kennung}.pruefliste.md`, pruefliste(e, nachId.get(e.fall)));
    }
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
