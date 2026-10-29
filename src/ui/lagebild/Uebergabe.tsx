// Übergabe an die KI-Verdichtung (seit 0.6.5, TP-2026-W44-17 aus Lagebild.tsx): Auswahl je Meldung und ihre Rolle im
// KI-Auftrag (Eingang oder eigene Vormeldung). Die Rolle bleibt beim Ab- und Wiederanwählen erhalten und ändert die
// Originalmeldung nicht.

import { useEffect, useRef, useState } from "react";
import type { Profil } from "../../kern/typen";
import { datumDE } from "../../kern/ausgabe";
import { absender, zeitpunktVon, type LagebildEintrag } from "../../lagebild/lagebild";
import { moeglicheRollen, type MeldungsRolle, type UebergabeMeldung } from "../../pipeline/material";
import { Marken } from "./bausteine";

export function LagebildUebergabe({
  profil,
  eintraege,
  eigen,
  dateiZu,
  uebergeben,
  abbrechen,
}: {
  profil: Profil;
  eintraege: LagebildEintrag[];
  /** Eigene Meldung (Stelle des Profils, nicht fremdes Schema) */
  eigen: (e: LagebildEintrag) => boolean;
  dateiZu: (e: LagebildEintrag) => { name: string; text: string } | undefined;
  uebergeben: (dateien: UebergabeMeldung[]) => void;
  /** Schließen ohne Übergabe („Abbrechen“, Escape); der Fokus geht an den auslösenden Knopf zurück */
  abbrechen: () => void;
}) {
  const optionen = (e: LagebildEintrag) => moeglicheRollen(e.daten, profil);
  const vorschlag = (e: LagebildEintrag): MeldungsRolle => {
    const o = optionen(e);
    if (eigen(e) && o.meldung.moeglich) return "meldung";
    return o.eingang.moeglich ? "eingang" : "meldung";
  };
  // Beim Öffnen: alle fremden Meldungen gewählt, Rolle nach Vorschlag
  const [uebergabeWahl, setUebergabeWahl] = useState<Set<string>>(() => new Set(eintraege.filter((e) => !eigen(e)).map((e) => e.id)));
  const [rollen, setRollen] = useState<Map<string, MeldungsRolle>>(() => new Map(eintraege.map((e) => [e.id, vorschlag(e)])));
  const rolleVon = (e: LagebildEintrag): MeldungsRolle => rollen.get(e.id) ?? vorschlag(e);
  const gewaehlt = eintraege.filter((e) => uebergabeWahl.has(e.id));
  const anzahlEingang = gewaehlt.filter((e) => rolleVon(e) === "eingang").length;
  const anzahlVormeldung = gewaehlt.length - anzahlEingang;
  const uebergabeStarten = () => {
    const liste: UebergabeMeldung[] = [];
    for (const e of gewaehlt) {
      const d = dateiZu(e);
      if (d) liste.push({ id: e.id, name: d.name, text: d.text, rolle: rolleVon(e) });
    }
    if (!liste.length) return;
    uebergeben(liste);
  };

  // Fokus beim Öffnen auf den Titel, Escape schließt (seit 0.6.5, TP-2026-W44-13); bis 0.6.4 blieb der Fokus am Knopf
  // „An KI-Verdichtung übergeben“, und der Dialog ließ sich nur mit „Abbrechen“ schließen
  const titelRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titelRef.current?.focus(), []);
  return (
    <div
      className="kasten kasten-info lb-uebergabe"
      role="dialog"
      aria-labelledby="uebergabe-titel"
      onKeyDown={(ev) => {
        if (ev.key !== "Escape") return;
        ev.preventDefault();
        abbrechen();
      }}
    >
      <h3 id="uebergabe-titel" ref={titelRef} tabIndex={-1}>
        An die KI-Verdichtung übergeben
      </h3>
      <p>
        Wähle die Meldungen und ihre Rolle für den KI-Auftrag. <strong>Eingänge</strong> liefern Informationen für die Verdichtung. Eine{" "}
        <strong>Vormeldung</strong> bildet den Ausgangspunkt für die Fortschreibung. Die Rolle gilt nur für diesen Auftrag; die Meldungen selbst bleiben
        unverändert.
      </p>
      <p className="hinweis">
        Eine eigene Fassung, die nur zum späteren Vergleich dienen soll, hier abwählen. Du kannst sie nach dem KI-Lauf als Referenzfassung laden.
      </p>
      <ul className="lb-auswahl">
        {eintraege.map((e) => {
          const an = uebergabeWahl.has(e.id);
          const o = optionen(e);
          const r = rolleVon(e);
          const name = `${absender(e, profil)} (${datumDE(zeitpunktVon(e, profil)) || e.name})`;
          return (
            <li key={e.id} className={an ? "lb-auswahl-an" : undefined}>
              <label className="lb-auswahl-kopf">
                <input
                  type="checkbox"
                  checked={an}
                  onChange={(ev) => {
                    const neu = new Set(uebergabeWahl);
                    if (ev.target.checked) neu.add(e.id);
                    else neu.delete(e.id);
                    setUebergabeWahl(neu);
                  }}
                />
                <span className="lb-auswahl-text">
                  <span>
                    {absender(e, profil)} <span className="material-meta">({datumDE(zeitpunktVon(e, profil)) || e.name})</span>
                  </span>
                  <span className="lb-marken">
                    <Marken e={e} profil={profil} eigen={eigen(e)} />
                  </span>
                </span>
              </label>
              <fieldset className="lb-rolle" disabled={!an}>
                <legend className="unsichtbar">Rolle für {name}</legend>
                {(["eingang", "meldung"] as MeldungsRolle[]).map((wert) => (
                  <label key={wert} className={`lb-rolle-option${r === wert ? " aktiv" : ""}${o[wert].moeglich ? "" : " gesperrt"}`}>
                    <input
                      type="radio"
                      name={`rolle-${e.id}`}
                      value={wert}
                      checked={r === wert}
                      disabled={!an || !o[wert].moeglich}
                      onChange={() => setRollen(new Map(rollen).set(e.id, wert))}
                    />
                    <span>
                      <strong>{wert === "eingang" ? "Als Eingang behandeln" : "Als Vormeldung behandeln"}</strong>
                      <span className="material-meta">
                        {o[wert].moeglich
                          ? wert === "eingang"
                            ? "als Informationsgrundlage für die eigene Meldung auswerten und verdichten"
                            : "diese bisherige eigene Meldung anhand neuer Informationen fortschreiben"
                          : `nicht möglich: ${o[wert].grund}`}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </li>
          );
        })}
      </ul>
      <p className="lb-uebergabe-summe" aria-live="polite">
        {gewaehlt.length
          ? `${anzahlEingang} ${anzahlEingang === 1 ? "Eingang" : "Eingänge"}, ${anzahlVormeldung} Vormeldung${anzahlVormeldung === 1 ? "" : "en"}.`
          : "Keine Meldung ausgewählt."}
        {anzahlVormeldung > 1 ? " Mehr als eine Vormeldung: Fortgeschrieben wird in der Regel nur die jüngste; bitte prüfen." : ""}
        {anzahlVormeldung > 0 && anzahlEingang === 0
          ? " Ohne Eingang wird nicht verdichtet, sondern die Vormeldung fortgeschrieben (Erfassung mit Recherche)."
          : ""}
      </p>
      <div className="aktionen">
        <button type="button" className="knopf primaer" disabled={!gewaehlt.length} onClick={uebergabeStarten}>
          {gewaehlt.length} Meldung{gewaehlt.length === 1 ? "" : "en"} übergeben
        </button>
        <button type="button" className="knopf leise" onClick={abbrechen}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
