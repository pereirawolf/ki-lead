// Anzeigehilfen der KI-Erfassung zur Recherche: Linktext ohne Titel, Recherchezeile vor und nach dem Lauf, Absender.
// Seit 0.6.5 (TP-2026-W44-17) in eigener Datei; unverändert aus KiErfassung.tsx übernommen.

import { formatUsd, kostenAnfrage } from "../../anbieter/preise";
import { leereNutzung } from "../../anbieter/typen";
import { orientierungJeSachverhalt, werkzeugeFuer, type Einstellungen } from "../../pipeline/einstellungen";
import { pflichtRegel } from "../../pipeline/recherchetiefe";
import { werkzeugText } from "../../pipeline/kontext";

/** Adresse als Linktext, wenn der Anbieter keinen Titel liefert: Host und gekürzter Pfad (seit 0.6.1, KP-2026-W44-19) */
export function kurzeAdresse(url: string, laenge = 60): string {
  try {
    const u = new URL(url);
    const text = `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : decodeURIComponent(u.pathname)}`;
    return text.length > laenge ? `${text.slice(0, laenge - 1)}…` : text;
  } catch {
    return url;
  }
}

/** „TT.MM.JJJJ, hh:mm Uhr“ aus „JJJJ-MM-TTThh:mm“ */
export function zeitAnzeige(z: string): string {
  return `${z.slice(8, 10)}.${z.slice(5, 7)}.${z.slice(0, 4)}, ${z.slice(11, 16)} Uhr`;
}

/**
 * Tatsächliche Recherche nach dem Lauf (gleiche Zählung wie die Befunde). Seit 0.6.0 getrennt ausgewiesen:
 * Orientierungssuchen in S1 (nicht angerechnet), Recherche in S2 einschließlich Nachforderung, Pflichtsuchen.
 */
export function RechercheZeile({
  n,
  pflicht,
}: {
  n: { websuchen: number; abrufe: number; zaehlerVollstaendig: boolean; orientierung?: number; nachgefordert?: boolean };
  pflicht?: { ausgefuehrt: string | null }[];
}) {
  const nichts = n.websuchen === 0 && n.abrufe === 0;
  const erledigt = pflicht?.filter((p) => p.ausgefuehrt).length ?? 0;
  return (
    <p className={nichts && n.zaehlerVollstaendig ? "hinweis recherche-null" : "hinweis"}>
      Recherche in S2:{" "}
      {nichts && !n.zaehlerVollstaendig
        ? "nicht nachweisbar."
        : `${n.websuchen} Websuche${n.websuchen === 1 ? "" : "n"}, ${n.abrufe} Seitenabruf${n.abrufe === 1 ? "" : "e"}.`}
      {pflicht?.length ? ` Pflichtsuchen: ${erledigt} von ${pflicht.length} ausgeführt.` : ""}
      {n.nachgefordert ? " Die App hat einmal nachgefordert." : ""}
      {n.orientierung
        ? ` Dazu in S1 ${n.orientierung} Orientierungssuche${n.orientierung === 1 ? "" : "n"} (nicht auf das Kontingent von S2 angerechnet).`
        : ""}
      {nichts && n.zaehlerVollstaendig ? " Keine Recherche, obwohl „Recherche durchführen“ gewählt war." : ""}
    </p>
  );
}

/** Absender der neuen Meldung vor S2 (Land, meldende Stelle, Herkunft) */
export function absenderZeile(a: { land: string; stelle: string; herkunft: "vormeldung" | "profil"; fremd: string[] }): string {
  const wer = [a.land, a.stelle].filter(Boolean).join(" · ");
  if (!wer) return "";
  const woher = a.herkunft === "vormeldung" ? "aus der eigenen Vormeldung" : "aus dem Profil";
  return `Absender: ${wer} (${woher}${a.fremd.length ? "; die gewählte Vormeldung einer anderen Stelle ändert ihn nicht" : ""}).`;
}

/**
 * Recherchemodus vor dem Lauf, aus Auftrag und Einstellungen (wie die Pipeline). Seit 0.6.0 mit Pflichtsuchen nach der
 * Recherchetiefe und der Orientierungssuche in S1, die getrennt ausgewiesen und nicht angerechnet wird (KP-2026-W44-09).
 */
export function rechercheZeile(websuche: boolean, e: Einstellungen, modellS2?: string, modellS1?: string): string {
  if (!websuche) return "S2 arbeitet ohne Websuche nur mit dem Material.";
  if (e.websucheMax <= 0 && e.abrufMax <= 0) return "S2: „Recherche durchführen“ gewählt, aber in den Einstellungen nicht verfügbar (Höchstzahlen 0).";
  const w = modellS2 ? werkzeugeFuer(modellS2, e) : { websuche: true, abruf: true };
  const websucheMax = w.websuche ? e.websucheMax : 0;
  const abrufMax = w.abruf ? e.abrufMax : 0;
  if (websucheMax <= 0 && abrufMax <= 0)
    return w.websuche
      ? `S2: „Recherche durchführen“ gewählt, aber ${modellS2} bietet keinen Seitenabruf und die Websuche steht in den Einstellungen auf 0.`
      : `S2: „Recherche durchführen“ gewählt, aber ${modellS2} über den EU-Endpunkt von Mistral bietet keine Websuche; S2 arbeitet nur mit dem Material. Für Websuche unter „Einstellungen“ den globalen Endpunkt wählen.`;
  const teile = [`S2: Recherche durchführen (${werkzeugText(websucheMax, abrufMax)}).`];
  const regel = pflichtRegel(e);
  if (websucheMax > 0 && regel.max > 0)
    teile.push(
      `Zuerst bis zu ${regel.max} Pflichtsuche${regel.max === 1 ? "" : "n"} aus den bestätigten Suchbegriffen (Recherchetiefe „${regel.titel}“: ${regel.jeSachverhalt} je Sachverhalt), danach eigene Recherche im übrigen Kontingent.`,
    );
  const o = orientierungJeSachverhalt(e);
  if (o && websucheMax > 0 && modellS1) {
    if (!werkzeugeFuer(modellS1, e).websuche) teile.push(`Orientierungssuche in S1 nicht möglich: ${modellS1} bietet keine Websuche.`);
    else {
      const gebuehr = kostenAnfrage(modellS1, { ...leereNutzung(), websuchen: 1 });
      teile.push(
        `Vorher in S1 ${o} Orientierungssuche${o === 1 ? "" : "n"} je Sachverhalt ohne Seitenabruf, nicht auf das Kontingent angerechnet${
          gebuehr ? ` (Suchgebühr etwa ${formatUsd(gebuehr)} je Suche zuzüglich Token)` : ""
        }.`,
      );
    }
  }
  return teile.join(" ");
}
