// Voraussichtliche Dauer und Kosten der nächsten KI-Stufen, nach Modell und Aufwand des Laufs.

import { modellFuer, type Einstellungen, type Rolle } from "../pipeline/einstellungen";
import { kostenText, schaetzeStufe, stufenText, summe, type SchaetzArt } from "../pipeline/schaetzung";
import type { Profil } from "../kern/typen";

export interface SchaetzStufe {
  kurz: string;
  rolle: Rolle;
  art: SchaetzArt;
}

export function LaufSchaetzung({ stufen, einstellungen, profil }: { stufen: SchaetzStufe[]; einstellungen: Einstellungen; profil: Profil }) {
  const werte = stufen.map((s) => {
    const modell = modellFuer(s.rolle, einstellungen, profil);
    const aufwand = einstellungen.aufwand[s.rolle];
    return { s, modell, aufwand, sch: schaetzeStufe(s.art, modell, aufwand) };
  });
  const gesamt = summe(werte.map((w) => w.sch.usd));
  return (
    <p className="hinweis laufschaetzung">
      Voraussichtlich (Erfahrungswerte aus Testläufen, vorsichtig gerundet): {werte.map((w) => stufenText(w.s.kurz, w.modell, w.aufwand, w.sch)).join("; ")}.
      {werte.length > 1 && gesamt ? ` Zusammen etwa ${kostenText(gesamt)}.` : ""} Viel Material, viele Websuchen und Seitenabrufe oder eine Reparatur in S3
      können den Lauf verlängern; maßgeblich ist die Abrechnung des Anbieters.
    </p>
  );
}
