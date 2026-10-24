// Auswahl von Modell und Aufwand je KI-Stufe (und auf Wunsch der Websuchen) für einen einzelnen Lauf,
// abweichend von „Einstellungen“.

import { useId } from "react";
import type { Aufwand } from "../anbieter/typen";
import { ANBIETER_NAME, anbieterVon, type Schluessel } from "../anbieter/verteiler";
import {
  AUFWAND_STUFEN,
  MODELL_GRUPPEN,
  aufwandAngeboten,
  aufwandAuswahl,
  WEBSUCHE_GRENZE,
  modellFuer,
  wahlAbweichend,
  type Einstellungen,
  type ModellWahl as Wahl,
  type Rolle,
} from "../pipeline/einstellungen";
import type { Profil } from "../kern/typen";

export interface StufeModell {
  rolle: Rolle;
  /** Kurzname in der Zusammenfassung, z. B. „S1“ */
  kurz: string;
  titel: string;
}

interface Props {
  stufen: StufeModell[];
  /** Einstellungen ohne die Wahl dieses Laufs (für die Anzeige des Standards) */
  einstellungen: Einstellungen;
  profil: Profil;
  schluessel: Schluessel;
  wahl: Wahl;
  onChange: (w: Wahl) => void;
  deaktiviert?: boolean;
  /** Feld für die Höchstzahl der Websuchen anzeigen (nur wenn der Lauf recherchiert) */
  websuche?: boolean;
}

const aufwandTitel = (a: Aufwand) => AUFWAND_STUFEN.find((x) => x.id === a)?.titel || a;

export function ModellWahl({ stufen, einstellungen, profil, schluessel, wahl, onChange, deaktiviert, websuche }: Props) {
  const id = useId();
  const rollen = stufen.map((s) => s.rolle);
  const abweichend = wahlAbweichend(wahl, rollen, !!websuche);
  const ohneSchluessel = (m: string) => (schluessel[anbieterVon(m)] ? "" : ` (kein Schlüssel für ${ANBIETER_NAME[anbieterVon(m)]})`);
  const modellVon = (r: Rolle) => wahl[r] || modellFuer(r, einstellungen, profil);
  // Wirksame Stufe: nur Stufen, die das Modell anbietet (AV-2026-W43-01, -02)
  const aufwandVon = (r: Rolle) => aufwandAngeboten(modellVon(r), wahl.aufwand?.[r] || einstellungen.aufwand[r]);
  const setzeModell = (r: Rolle, m: string) => {
    const gewaehlt = wahl.aufwand?.[r];
    const modell = m || modellFuer(r, einstellungen, profil);
    // Beim Modellwechsel eine gewählte Stufe, die das neue Modell nicht anbietet, sichtbar anpassen
    const aufwand = gewaehlt && aufwandAngeboten(modell, gewaehlt) !== gewaehlt ? { ...wahl.aufwand, [r]: aufwandAngeboten(modell, gewaehlt) } : wahl.aufwand;
    onChange({ ...wahl, [r]: m, ...(aufwand ? { aufwand } : {}) });
  };
  const setzeAufwand = (r: Rolle, a: string) => {
    const neu = { ...(wahl.aufwand || {}) };
    if (a) neu[r] = a as Aufwand;
    else delete neu[r];
    onChange({ ...wahl, aufwand: neu });
  };
  const websuchen = wahl.websucheMax ?? einstellungen.websucheMax;
  return (
    <details className="modellwahl" open={abweichend || undefined}>
      <summary>
        Modelle für diesen Lauf
        <span className="material-meta">
          {" "}
          {stufen.map((s) => `${s.kurz}: ${modellVon(s.rolle)} (${aufwandTitel(aufwandVon(s.rolle))})`).join(" · ")}
          {websuche ? ` · bis ${websuchen} Websuchen` : ""}
          {abweichend ? " (abweichend von den Einstellungen)" : ""}
        </span>
      </summary>
      <div className="modellwahl-felder">
        {stufen.map((s) => {
          const standard = modellFuer(s.rolle, einstellungen, profil);
          return (
            <fieldset key={s.rolle} className="modellwahl-stufe">
              <legend>{s.titel}</legend>
              <label className="feld" htmlFor={`${id}-${s.rolle}`}>
                <span className="feld-label">Modell</span>
                <select id={`${id}-${s.rolle}`} value={wahl[s.rolle] || ""} disabled={deaktiviert} onChange={(e) => setzeModell(s.rolle, e.target.value)}>
                  <option value="">
                    Standard: {standard}
                    {ohneSchluessel(standard)}
                  </option>
                  {MODELL_GRUPPEN.map((g) => (
                    <optgroup key={g.anbieter} label={g.anbieter}>
                      {g.modelle.map((m) => (
                        <option key={m} value={m}>
                          {m}
                          {ohneSchluessel(m)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="feld" htmlFor={`${id}-${s.rolle}-aufwand`}>
                <span className="feld-label">Aufwand</span>
                <select
                  id={`${id}-${s.rolle}-aufwand`}
                  value={wahl.aufwand?.[s.rolle] || ""}
                  disabled={deaktiviert}
                  onChange={(e) => setzeAufwand(s.rolle, e.target.value)}
                >
                  <option value="">Standard: {aufwandTitel(aufwandAngeboten(modellVon(s.rolle), einstellungen.aufwand[s.rolle]))}</option>
                  {aufwandAuswahl(modellVon(s.rolle)).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.titel}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
          );
        })}
        {websuche && (
          <fieldset className="modellwahl-stufe">
            <legend>Recherche</legend>
            <label className="feld" htmlFor={`${id}-websuche`}>
              <span className="feld-label">Höchstzahl Websuchen in S2</span>
              <input
                id={`${id}-websuche`}
                type="number"
                min={0}
                max={WEBSUCHE_GRENZE}
                step={1}
                value={wahl.websucheMax ?? ""}
                placeholder={`Standard: ${einstellungen.websucheMax}`}
                disabled={deaktiviert}
                onChange={(e) => {
                  const v = e.target.value;
                  const { websucheMax: _, ...rest } = wahl;
                  onChange(v === "" ? rest : { ...rest, websucheMax: Math.min(WEBSUCHE_GRENZE, Math.max(0, Math.round(Number(v) || 0))) });
                }}
              />
              <span className="hinweis">
                Leer = Standard. Mehr Suchen verbessern die Recherche, verlängern aber den Lauf und erhöhen die Kosten; 0 = keine Websuche.
              </span>
            </label>
          </fieldset>
        )}
      </div>
      <p className="hinweis">
        Gilt nur für diesen Lauf; die Vorgaben unter „Einstellungen“ bleiben unverändert. Das Protokoll hält Modell und Aufwand je Stufe fest.
      </p>
    </details>
  );
}
