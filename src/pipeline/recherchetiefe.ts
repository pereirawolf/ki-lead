// Recherchetiefe unter „Einstellungen → Recherche & Grenzen“ (seit 0.5.19, Befunde KP-2026-W43-69 bis -76 vom 25.10.2026):
// Stufen für Websuchen, Seitenabrufe und Lesemenge je Seite, Übernahme getippter Werte, Umrechnung der Lesemenge,
// Höchstkosten für Suchen und Seitenlesen und Wirkung je Anbieter. Reine Funktionen; die Oberfläche steht in
// src/ui/Einstellungen.tsx. Gespeichert werden wie bisher nur websucheMax, abrufMax und abrufMaxTokens.
import { aufschlag, formatUsd, kostenAnfrage, PREISSTAND } from "../anbieter/preise";
import type { Nutzung } from "../anbieter/typen";
import { anbieterVon, type AnbieterId } from "../anbieter/verteiler";
import { STANDARD, WEBSUCHE_GRENZE, werkzeugeFuer, type Einstellungen } from "./einstellungen";

export type RechercheWerte = Pick<Einstellungen, "websucheMax" | "abrufMax" | "abrufMaxTokens">;
export type StufeId = "sparsam" | "standard" | "gruendlich";
export type RechercheFeld = "websucheMax" | "abrufMax" | "abrufMaxTokens";

/**
 * Stufen der Recherchetiefe. „Standard“ entspricht den Vorgaben der App. Die Werte für „Sparsam“ und „Gründlich“ sind
 * VORLÄUFIG (Entscheidung des Herausgebers vom 25.10.2026, KP-2026-W43-69) und über einen Testlauf zu prüfen.
 */
export const RECHERCHE_STUFEN: { id: StufeId; titel: string; text: string; werte: RechercheWerte }[] = [
  {
    id: "sparsam",
    titel: "Sparsam",
    text: "Wenige gezielte Suchen, nur die wichtigsten Seiten. Für eng umrissene Aufträge oder viel eigenes Material.",
    werte: { websucheMax: 5, abrufMax: 3, abrufMaxTokens: 8000 },
  },
  {
    id: "standard",
    titel: "Standard",
    text: "Für die meisten Aufträge.",
    werte: { websucheMax: STANDARD.websucheMax, abrufMax: STANDARD.abrufMax, abrufMaxTokens: STANDARD.abrufMaxTokens },
  },
  {
    id: "gruendlich",
    titel: "Gründlich",
    text: "Breite Suche und mehr Seiten, für unübersichtliche oder neue Lagen. Dauert länger und kostet mehr.",
    werte: { websucheMax: 30, abrufMax: 20, abrufMaxTokens: 30000 },
  },
];

/** Stufe, deren Werte genau den gespeicherten entsprechen, sonst „eigen“ */
export function stufeVon(e: RechercheWerte): StufeId | "eigen" {
  const s = RECHERCHE_STUFEN.find(
    (x) => x.werte.websucheMax === e.websucheMax && x.werte.abrufMax === e.abrufMax && x.werte.abrufMaxTokens === e.abrufMaxTokens,
  );
  return s ? s.id : "eigen";
}

/** Kurzangabe der Werte einer Stufe, z. B. „15 Websuchen, 10 Seiten, 15.000 Token je Seite“ */
export function stufenWerteText(w: RechercheWerte): string {
  return `${w.websucheMax} Websuchen, ${w.abrufMax} Seiten, ${w.abrufMaxTokens ? `${zahl(w.abrufMaxTokens)} Token je Seite` : "Seiten ungekürzt"}`;
}

/** Zulässige Bereiche der drei Felder; 0 bei der Lesemenge bedeutet „Seiten nie kürzen“ und wird über ein Kästchen gesetzt */
export const RECHERCHE_GRENZEN: Record<RechercheFeld, { min: number; max: number }> = {
  websucheMax: { min: 0, max: WEBSUCHE_GRENZE },
  abrufMax: { min: 0, max: 50 },
  abrufMaxTokens: { min: 1000, max: 100000 },
};

const LEER_ZUSATZ: Record<RechercheFeld, string> = {
  websucheMax: " Für keine Websuche 0 eingeben.",
  abrufMax: " Für keinen Seitenabruf 0 eingeben.",
  abrufMaxTokens: "",
};

/**
 * Prüft einen eingegebenen Wert. `fertig: false` heißt: noch nicht übernehmen (leer, keine Zahl, außerhalb des Bereichs
 * oder keine ganze Zahl); erst beim Verlassen des Feldes (`abschliessen`) gilt der korrigierte Wert mit Hinweis.
 */
export function pruefeEingabe(feld: RechercheFeld, roh: string, bisher: number): { wert: number; fertig: boolean; hinweis?: string } {
  const { min, max } = RECHERCHE_GRENZEN[feld];
  const text = roh.trim().replace(",", ".");
  if (!text) return { wert: bisher, fertig: false, hinweis: `Kein Wert eingegeben; der bisherige Wert ${zahl(bisher)} bleibt.${LEER_ZUSATZ[feld]}` };
  const n = Number(text);
  if (!Number.isFinite(n)) return { wert: bisher, fertig: false, hinweis: `Keine Zahl; der bisherige Wert ${zahl(bisher)} bleibt.` };
  const ganz = Math.round(n);
  if (ganz > max) return { wert: max, fertig: false, hinweis: `Höchstens ${zahl(max)}; auf ${zahl(max)} gesetzt.` };
  if (ganz < min) return { wert: min, fertig: false, hinweis: `Mindestens ${zahl(min)}; auf ${zahl(min)} gesetzt.` };
  if (ganz !== n) return { wert: ganz, fertig: false, hinweis: `Nur ganze Zahlen; auf ${zahl(ganz)} gerundet.` };
  return { wert: n, fertig: true };
}

/** Grobe Umrechnung für deutsche Texte (ungemessene Annahme): 0,5 Wörter je Token, 400 Wörter je Druckseite */
export const WOERTER_JE_TOKEN = 0.5;
export const WOERTER_JE_SEITE = 400;

/** „≈ rund 7.500 Wörter, etwa 19 Druckseiten“ für 15.000 Token */
export function lesemengeText(token: number): string {
  const woerter = token * WOERTER_JE_TOKEN;
  const gerundet = Math.max(500, Math.round(woerter / 500) * 500);
  const seiten = Math.max(1, Math.round(woerter / WOERTER_JE_SEITE));
  return `≈ rund ${zahl(gerundet)} Wörter, etwa ${seiten} Druckseite${seiten === 1 ? "" : "n"}`;
}

const nutzung = (n: Partial<Nutzung>): Nutzung => ({ eingabe: 0, ausgabe: 0, cacheSchreiben: 0, cacheLesen: 0, websuchen: 0, abrufe: 0, ...n });

/**
 * Höchstkosten für Suchen und Seitenlesen in S2 mit dem gegebenen Modell nach Listenpreis, oder null ohne Preis.
 * Anthropic: Suchen × Suchpreis + Seiten × Lesemenge × Eingabepreis (je Seite gerechnet, also ohne Langkontext-Preis).
 * OpenAI: Gebühren je Werkzeugaufruf; die Länge der Seiten begrenzt OpenAI nicht. Mistral: nur Suchen, nicht begrenzt.
 */
export function hoechstkostenText(modell: string, e: Pick<Einstellungen, RechercheFeld | "mistralEndpunkt">): string | null {
  const w = werkzeugeFuer(modell, e);
  const anbieter = anbieterVon(modell);
  if (!w.websuche && !w.abruf) return `Mit ${modell} recherchiert S2 nicht im Web; Suchen und Seitenlesen kosten nichts.`;
  const suchen = w.websuche ? e.websucheMax : 0;
  const seiten = w.abruf ? e.abrufMax : 0;
  const faktor = aufschlag(modell, { mistralEndpunkt: e.mistralEndpunkt });
  const gebuehren = kostenAnfrage(modell, nutzung({ websuchen: suchen, abrufe: seiten }));
  if (gebuehren === null) return null;
  const stand = `Listenpreise, Stand ${PREISSTAND}.`;
  if (anbieter === "mistral")
    return `Mit ${modell} kosten ${suchen} Suchen etwa ${formatUsd(gebuehren * faktor)}; Mistral begrenzt die Zahl der Suchen nicht. Dazu Trefferlisten, Material und Schreiben. ${stand}`;
  if (anbieter === "openai")
    return `Mit ${modell} kosten Suchen und geöffnete Seiten höchstens etwa ${formatUsd(gebuehren * faktor)}, dazu die gelesenen Seiten, Trefferlisten, Material und Schreiben. ${stand}`;
  if (!e.abrufMaxTokens && seiten > 0)
    return `Mit ${modell} kosten die Suchen höchstens etwa ${formatUsd(gebuehren * faktor)}, dazu Seiten ohne Längengrenze, Trefferlisten, Material und Schreiben. ${stand}`;
  const seite = kostenAnfrage(modell, nutzung({ eingabe: e.abrufMaxTokens }))!;
  return `Mit ${modell} kosten Suchen und Seitenlesen höchstens etwa ${formatUsd((gebuehren + seiten * seite) * faktor)}, dazu Trefferlisten, Material und Schreiben. ${stand}`;
}

const WIRKUNG: Record<RechercheFeld, Record<AnbieterId | "mistral-eu", string>> = {
  websucheMax: {
    anthropic: "Anthropic begrenzt die Suchen",
    openai: "OpenAI begrenzt Suchen und geöffnete Seiten zusammen",
    mistral: "Mistral zählt die Suchen nur, begrenzt sie nicht",
    "mistral-eu": "Mistral über den EU-Endpunkt sucht nicht",
  },
  abrufMax: {
    anthropic: "Anthropic begrenzt die Seiten",
    openai: "OpenAI zählt die Seiten zur gemeinsamen Höchstzahl mit den Suchen",
    mistral: "bei Mistral ohne Wirkung",
    "mistral-eu": "bei Mistral ohne Wirkung",
  },
  abrufMaxTokens: {
    anthropic: "Anthropic kürzt längere Seiten",
    openai: "bei OpenAI ohne Wirkung",
    mistral: "bei Mistral ohne Wirkung",
    "mistral-eu": "bei Mistral ohne Wirkung",
  },
};

/** Ob ein Feld bei mindestens einem der Anbieter etwas bewirkt (seit 0.5.22: Felder ohne Wirkung sind in der Wahl je Lauf gesperrt) */
export function feldWirkt(feld: RechercheFeld, anbieter: AnbieterId[], mistralEndpunkt: Einstellungen["mistralEndpunkt"]): boolean {
  return anbieter.some((a) => !/ohne Wirkung|sucht nicht/.test(WIRKUNG[feld][a === "mistral" && (mistralEndpunkt ?? "eu") === "eu" ? "mistral-eu" : a]));
}

/** Vermerk je Feld für die Anbieter der S2-Modelle, z. B. „Bei den gewählten Modellen: Anthropic begrenzt die Suchen.“ */
export function wirkungText(feld: RechercheFeld, anbieter: AnbieterId[], mistralEndpunkt: Einstellungen["mistralEndpunkt"]): string {
  const teile = anbieter.map((a) => WIRKUNG[feld][a === "mistral" && (mistralEndpunkt ?? "eu") === "eu" ? "mistral-eu" : a]);
  const wirkt = teile.some((t) => !/ohne Wirkung|sucht nicht/.test(t));
  if (!teile.length) return "";
  return wirkt ? `Bei den gewählten Modellen: ${teile.join("; ")}.` : "Bei den gewählten Modellen ohne Wirkung.";
}

function zahl(n: number): string {
  return n.toLocaleString("de-DE");
}
