// Die gestufte KI-Pipeline nach LEAD (Modus A, Erfassung):
// S1 Gegenstand und SOP-Auswahl → Bestätigung durch die Person → S2 Recherche und Entwurf
// → S3 Prüfung und höchstens zwei Reparaturen → Übergabe an die Meldungsmaske (S4).

import type { Fortschritt, LlmAnbieter, LlmAnfrage, LlmAntwort } from "../anbieter/typen";
import { jetztLokal } from "../kern/ausgabe";
import { pflichtHinweise } from "../kern/kennsaetze";
import { quellenHinweise } from "../kern/quellen";
import { aufloesen } from "../kern/schema";
import type { Befund, Meldung, Profil } from "../kern/typen";
import { pruefeGegenSchema, type SchemaBefund } from "../kern/validierung";
import { modellFuer, type Einstellungen } from "./einstellungen";
import { zerlegeAntwort } from "./json";
import { anweisungErfassung, auftragAusBestaetigung, fachSops, profilGrundlagen, s1Schema, s1System, sopBlock } from "./kontext";
import { kostenSumme, ohneBase64, type Lauf, type S1Vorschlag, type StufenEintrag } from "./lauf";
import { materialBloecke, materialUebersicht, type Material } from "./material";
import { sopKennung } from "../profil/sop";

export const MAX_REPARATUREN = 2;

export interface Kontext {
  profil: Profil;
  anbieter: LlmAnbieter;
  einstellungen: Einstellungen;
  lauf: Lauf;
  material: Material[];
  signal?: AbortSignal;
  /** Wird nach jeder Änderung am Lauf aufgerufen (Speichern, Anzeige) */
  aktualisiert: (l: Lauf) => void | Promise<void>;
  fortschritt?: (f: Fortschritt) => void;
  jetzt?: () => Date;
}

async function aufrufen(k: Kontext, stufe: string, anfrage: LlmAnfrage): Promise<LlmAntwort> {
  const eintrag: StufenEintrag = {
    stufe,
    start: new Date().toISOString(),
    modell: anfrage.modell,
    aufwand: anfrage.aufwand,
    anfrage: ohneBase64({
      system: anfrage.system.map((s) => s.text),
      nachrichten: anfrage.nachrichten,
      werkzeuge: anfrage.werkzeuge,
      jsonSchema: anfrage.jsonSchema,
      maxTokens: anfrage.maxTokens,
    }),
  };
  k.lauf.stufen.push(eintrag);
  await k.aktualisiert(k.lauf);
  try {
    const a = await k.anbieter.senden({ ...anfrage, signal: k.signal, fortschritt: k.fortschritt });
    eintrag.antwort = { text: a.text, inhalt: a.inhalt, stopGrund: a.stopGrund, runden: a.runden };
    eintrag.nutzung = a.nutzung;
    eintrag.kostenUsd = a.kostenUsd;
    eintrag.modell = a.modell;
    return a;
  } catch (e: any) {
    eintrag.fehler = e?.name === "AbortError" ? "abgebrochen" : String(e?.message || e);
    throw e;
  } finally {
    eintrag.ende = new Date().toISOString();
    eintrag.dauerMs = Date.parse(eintrag.ende) - Date.parse(eintrag.start);
    k.lauf.kostenUsd = kostenSumme(k.lauf);
    k.lauf.aktualisiert = eintrag.ende;
    await k.aktualisiert(k.lauf);
  }
}

function auftragsText(k: Kontext): string {
  const a = k.lauf.auftrag;
  return [
    `Sachverhalt und Erkenntnisinteresse: ${a.sachverhalt.trim() || "(nicht angegeben, aus dem Material ableiten)"}`,
    `Meldestichtag: ${a.stichtag}`,
    `Besondere Prüffrage: ${a.prueffrage.trim() || "keine"}`,
    `Aktueller Zeitpunkt (${k.profil.manifest.variablen.zeitzone || "Europe/Berlin"}): ${jetztLokal(k.profil.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date())}`,
  ].join("\n");
}

// ── S1 ─────────────────────────────────────────────────────────────────────────

export async function stufe1(k: Kontext): Promise<S1Vorschlag> {
  k.lauf.status = "s1";
  const inhalt = [
    { type: "text", text: `# Auftrag\n\n${auftragsText(k)}` },
    ...materialBloecke(k.material, k.lauf.auftrag.urls, k.lauf.auftrag.stichworte),
    { type: "text", text: "Kläre jetzt den Gegenstand und schlage Gliederung, Ereignisarten und SOPs vor." },
  ];
  const a = await aufrufen(k, "S1 Gegenstand und SOP-Auswahl", {
    modell: modellFuer("vorverarbeitung", k.einstellungen, k.profil),
    aufwand: k.einstellungen.aufwand.vorverarbeitung,
    maxTokens: 8000,
    system: [{ text: s1System(k.profil), cache: true }],
    nachrichten: [{ role: "user", content: inhalt }],
    jsonSchema: s1Schema(k.profil),
  });
  const z = zerlegeAntwort(a.text);
  if (!z.json || typeof z.json !== "object") throw new Error(`Stufe S1 lieferte kein auswertbares Ergebnis. ${z.fehler || ""}`.trim());
  const v = bereinigeVorschlag(z.json as S1Vorschlag, k);
  k.lauf.vorschlag = v;
  k.lauf.status = "bestaetigen";
  await k.aktualisiert(k.lauf);
  return v;
}

function bereinigeVorschlag(v: S1Vorschlag, k: Kontext): S1Vorschlag {
  const ids = new Set(fachSops(k.profil).map((s) => s.id));
  return {
    gegenstand: String(v.gegenstand || ""),
    stichtag: /^\d{4}-\d{2}-\d{2}$/.test(v.stichtag || "") ? v.stichtag : k.lauf.auftrag.stichtag,
    referenzbezug: String(v.referenzbezug || ""),
    horizont: String(v.horizont || ""),
    sachverhalte: (Array.isArray(v.sachverhalte) && v.sachverhalte.length ? v.sachverhalte : [{ titel: "", ereignisarten: [], sops: [], begruendung: "" }]).map(
      (s) => ({
        titel: String(s.titel || ""),
        ereignisarten: Array.isArray(s.ereignisarten) ? s.ereignisarten.map(String) : [],
        sops: Array.isArray(s.sops) ? s.sops.map(String).filter((x) => ids.has(x)) : [],
        begruendung: String(s.begruendung || ""),
      }),
    ),
    prueffrage: String(v.prueffrage || ""),
    hinweise: String(v.hinweise || ""),
  };
}

// ── S2 und S3 ──────────────────────────────────────────────────────────────────

/** Feste Felder setzen, die die App verantwortet (Schemakennung, Status, Herkunft, Variablen). */
export function nachbearbeiten(roh: unknown, k: Kontext, modell: string): Meldung {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) throw new Error("Das Ergebnis ist kein JSON-Objekt.");
  const p = k.profil;
  const r = p.ui.rollen;
  const d: Meldung = structuredClone(roh as Meldung);
  const props = p.schema.properties || {};
  d[r.schema_feld] = aufloesen(props[r.schema_feld], p.schema)?.const ?? p.manifest.meldung.schema_id;
  d[r.status_feld] = r.status_entwurf;
  for (const [key, wert] of Object.entries(p.manifest.variablen)) {
    if (key in props && (d[key] === undefined || d[key] === "")) d[key] = wert;
  }
  if (r.meldezeitpunkt && !d[r.meldezeitpunkt]) d[r.meldezeitpunkt] = jetztLokal(p.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date());
  if (r.entstehung_feld && props[r.entstehung_feld]) {
    const def = aufloesen(props[r.entstehung_feld], p.schema);
    const erlaubt = def?.properties || {};
    const e: Record<string, unknown> = d[r.entstehung_feld] && typeof d[r.entstehung_feld] === "object" ? { ...d[r.entstehung_feld] } : {};
    const verfahren = aufloesen(erlaubt.verfahren, p.schema);
    if ("verfahren" in erlaubt && (!verfahren?.enum || verfahren.enum.includes("KI-Entwurf"))) e.verfahren = "KI-Entwurf";
    if ("werkzeug" in erlaubt) e.werkzeug = `${k.lauf.app} · Profil ${p.manifest.id} ${p.manifest.version} · Lauf ${k.lauf.id}`;
    if ("modell" in erlaubt) e.modell = modell;
    if ("erstellt" in erlaubt) e.erstellt = jetztLokal(p.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date());
    if ("sop" in erlaubt && !Array.isArray(e.sop)) {
      const ids = new Set((k.lauf.bestaetigt?.sachverhalte || []).flatMap((s) => s.sops));
      e.sop = fachSops(p)
        .filter((s) => ids.has(s.id))
        .map(sopKennung);
    }
    d[r.entstehung_feld] = e;
  }
  return d;
}

function reparaturSystem(p: Profil): string {
  return `Du korrigierst eine Meldung so, dass sie dem beigefügten JSON-Schema entspricht. Inhalte, Bewertungen, Radarwerte und Quellen bleiben unverändert, soweit die Korrektur es zulässt. Recherchiere nicht neu und ergänze keine Fakten. Wo ein Pflichtwert inhaltlich nicht belegt ist, verwende den im Schema vorgesehenen Leerwert. Gib ausschließlich das vollständige, korrigierte JSON-Objekt in einem Codeblock aus, der mit \`\`\`json beginnt.

# JSON-Schema (Schemakennung ${p.manifest.meldung.schema_id})

\`\`\`json
${JSON.stringify(p.schema, null, 1)}
\`\`\``;
}

export interface S2Ergebnis {
  meldung?: Meldung;
  kurzantwort: string;
  schemaBefunde: SchemaBefund[];
  befunde: Befund[];
}

export async function stufe2und3(k: Kontext, bestaetigt: S1Vorschlag): Promise<S2Ergebnis> {
  const p = k.profil;
  const e = k.einstellungen;
  k.lauf.bestaetigt = bestaetigt;
  k.lauf.status = "s2";
  await k.aktualisiert(k.lauf);

  const sopIds = [...new Set(bestaetigt.sachverhalte.flatMap((s) => s.sops))];
  const ausgang = materialUebersicht(k.material, k.lauf.auftrag.urls, k.lauf.auftrag.stichworte);
  const auftrag = auftragAusBestaetigung(bestaetigt, p, ausgang);
  const jetzt = jetztLokal(p.manifest.variablen.zeitzone, k.jetzt?.() ?? new Date());
  const erfassungsModell = modellFuer("erfassung", e, p);

  const inhalt = [
    ...materialBloecke(k.material, k.lauf.auftrag.urls, k.lauf.auftrag.stichworte),
    {
      type: "text",
      text: `Erstelle jetzt die Meldung nach der Arbeitsanweisung. Bestätigte Gliederung: ${auftrag.ereignisarten}. Stichtag: ${auftrag.stichtag}.${
        k.material.some((m) => m.art === "meldung") ? " Eine Vormeldung liegt bei; schreibe sie nach SOP-LEAD A.8 fort." : ""
      }`,
    },
  ];
  const a = await aufrufen(k, "S2 Recherche und Entwurf", {
    modell: erfassungsModell,
    aufwand: e.aufwand.erfassung,
    maxTokens: e.maxTokensErfassung,
    system: [{ text: profilGrundlagen(p), cache: true }, { text: sopBlock(p, sopIds), cache: true }, { text: anweisungErfassung(p, auftrag, jetzt) }],
    nachrichten: [{ role: "user", content: inhalt }],
    werkzeuge: {
      websuche: e.websucheMax > 0 ? { maxUses: e.websucheMax, land: e.suchland || undefined, zeitzone: p.manifest.variablen.zeitzone } : undefined,
      abruf: e.abrufMax > 0 ? { maxUses: e.abrufMax } : undefined,
    },
  });

  let z = zerlegeAntwort(a.text);
  const kurzantwort = z.kurzantwort;
  let modell = a.modell;
  const s2 = k.lauf.stufen[k.lauf.stufen.length - 1];
  if (a.stopGrund === "max_tokens") s2.notiz = "Antwort an der Token-Grenze abgeschnitten. In den Einstellungen die Höchstzahl der Ausgabetoken erhöhen.";

  k.lauf.status = "s3";
  let meldung: Meldung | undefined;
  let schemaBefunde: SchemaBefund[] = [];
  for (let runde = 0; ; runde++) {
    if (z.json !== undefined) {
      try {
        meldung = nachbearbeiten(z.json, k, modell);
        schemaBefunde = pruefeGegenSchema(p.schema, meldung, p.ui);
      } catch (err: any) {
        meldung = undefined;
        schemaBefunde = [{ pfad: "", keyword: "typ", text: String(err.message) }];
      }
    } else {
      schemaBefunde = [{ pfad: "", keyword: "json", text: z.fehler || "Kein JSON." }];
    }
    const eintrag = k.lauf.stufen[k.lauf.stufen.length - 1];
    eintrag.befunde = schemaBefunde.map((b) => b.text);
    await k.aktualisiert(k.lauf);
    if (!schemaBefunde.length || runde >= MAX_REPARATUREN) break;
    if (z.json === undefined && a.stopGrund === "max_tokens") break; // abgeschnitten: Reparatur kann Inhalte nicht herstellen

    const entwurf = z.json !== undefined ? JSON.stringify(z.json, null, 1) : z.jsonText || "";
    const r = await aufrufen(k, `S3 Reparatur ${runde + 1}`, {
      modell: modellFuer("reparatur", e, p),
      aufwand: e.aufwand.reparatur,
      maxTokens: e.maxTokensErfassung,
      system: [{ text: reparaturSystem(p), cache: true }],
      nachrichten: [
        {
          role: "user",
          content: `Prüfbericht der App (${schemaBefunde.length} Befund${schemaBefunde.length === 1 ? "" : "e"}):\n${schemaBefunde
            .slice(0, 80)
            .map((b) => `- ${b.pfad || "(gesamt)"}: ${b.text}`)
            .join("\n")}\n\nEntwurf:\n\`\`\`json\n${entwurf}\n\`\`\``,
        },
      ],
    });
    z = zerlegeAntwort(r.text);
    modell = r.modell;
  }

  const befunde: Befund[] = meldung ? [...quellenHinweise(meldung, p.ui), ...pflichtHinweise(meldung, p.ui)] : [];
  k.lauf.ergebnis = meldung
    ? { meldung, kurzantwort, befunde, fundstellen: a.fundstellen, suchen: a.suchen, schemakonform: schemaBefunde.length === 0 }
    : undefined;
  k.lauf.status = meldung ? "fertig" : "fehler";
  if (!meldung) k.lauf.fehler = schemaBefunde.map((b) => b.text).join(" ");
  k.lauf.aktualisiert = new Date().toISOString();
  await k.aktualisiert(k.lauf);
  return { meldung, kurzantwort, schemaBefunde, befunde };
}
