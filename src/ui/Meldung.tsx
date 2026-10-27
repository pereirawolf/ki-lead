// Meldungsmaske: Schritte aus der Darstellungsdatei, Formular aus dem Schema. Seit 0.5.17 hängt die App für jedes Profil
// einen eigenen Schritt „Management Summary“ an (Titel aus kurzfassung.titel); bis 0.5.16 stand sie im Schritt
// „Prüfen & Exportieren“.

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { unterSchema } from "../kern/schema";
import { holeWert, teilePfad, mitWert, type Segment } from "../kern/pfad";
import { migriere } from "../kern/migration";
import { pruefeGegenSchema } from "../kern/validierung";
import { pflichtHinweise } from "../kern/kennsaetze";
import { quellenHinweise } from "../kern/quellen";
import type { Meldung as MeldungTyp, Profil, Schritt } from "../kern/typen";
import { Feld } from "./Feld";
import { Pruefen } from "./Pruefen";
import { KurzfassungKasten, type KiZugang } from "./Kurzfassung";
import { EingabehilfeKontext, type EingabehilfeKontextWert } from "./eingabehilfeKontext";
import { eingabehilfeVerlauf } from "./eingabehilfeVerlauf";
import { befundeJeFeld, feldSchluessel, FeldBefundeKontext, type FeldBefundeWert } from "./feldBefunde";
import { scrollVerhalten } from "./bewegung";

/** Kennung des Schritts, den die App für die Management Summary anfügt */
export const KURZFASSUNG_SCHRITT = "management-summary";

/** Schritte des Profils und dahinter der Schritt der Management Summary (seit 0.5.17) */
export function meldungsSchritte(ui: Profil["ui"]): (Schritt & { kurzfassung?: boolean })[] {
  return [...ui.schritte, { id: KURZFASSUNG_SCHRITT, titel: ui.kurzfassung?.titel || "Management Summary", felder: [], kurzfassung: true }];
}

interface Props {
  profil: Profil;
  meldung: MeldungTyp;
  setMeldung: (m: MeldungTyp) => void;
  neu: () => void;
  /**
   * Ersetzt die Meldung in der Maske durch eine geöffnete Datei (neue Dokumentnummer, Management Summary leeren).
   * Ohne diese Angabe gilt `setMeldung`.
   */
  ersetzen?: (m: MeldungTyp) => void;
  zwischenstand?: string;
  ki?: KiZugang;
  /** Dokumentnummer der App (neue Meldung, geöffnete Datei, Übernahme, Profilwechsel); verwirft den Verlauf der Eingabehilfen */
  dokument?: number;
}

export function MeldungAnsicht({ profil, meldung, setMeldung, neu, ersetzen, zwischenstand, ki, dokument = 0 }: Props) {
  const ui = profil.ui;
  const schritte = useMemo(() => meldungsSchritte(ui), [ui]);
  const [schritt, setSchritt] = useState(0);
  const [meldungen, setMeldungen] = useState<{ art: "ok" | "hinweis" | "fehler"; zeilen: string[] } | null>(null);
  const dateiRef = useRef<HTMLInputElement>(null);
  // meldungsSchritte liefert immer mindestens einen Schritt
  const aktuell = schritte[Math.min(schritt, schritte.length - 1)]!;

  // Änderungen immer auf dem neuesten Stand, auch wenn zwei Änderungen vor dem nächsten Zeichnen folgen
  const stand = useRef(meldung);
  useLayoutEffect(() => {
    stand.current = meldung;
  });
  const setze = (segs: Segment[], wert: unknown) => {
    const m = mitWert(stand.current, segs, wert);
    stand.current = m;
    setMeldung(m);
  };
  const dok = `${profil.hash}:${dokument}`;
  useLayoutEffect(() => eingabehilfeVerlauf.dokument(dok), [dok]);
  const eingabehilfe = useMemo<EingabehilfeKontextWert>(
    () => ({ dok, aktuell: () => stand.current, setze }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dok],
  );

  const oeffnen = async (datei: File) => {
    let roh: unknown;
    try {
      roh = JSON.parse(await datei.text());
    } catch {
      setMeldungen({ art: "fehler", zeilen: [`${datei.name} ist keine gültige JSON-Datei.`] });
      return;
    }
    if (!roh || typeof roh !== "object" || Array.isArray(roh)) {
      setMeldungen({ art: "fehler", zeilen: [`${datei.name} enthält keine Meldung (erwartet ein JSON-Objekt).`] });
      return;
    }
    const mig = migriere(roh, profil);
    const d = mig.daten;
    if (!d[ui.rollen.status_feld]) d[ui.rollen.status_feld] = ui.rollen.status_entwurf;
    const schema = pruefeGegenSchema(profil.schema, d, ui);
    // Falsche Datentypen (Objekt statt Text, Text statt Liste …) erst nach Rückfrage in die Maske übernehmen
    const typfehler = schema.filter((b) => b.keyword === "type");
    if (typfehler.length) {
      const beispiele = typfehler
        .slice(0, 5)
        .map((b) => `• ${b.text}`)
        .join("\n");
      if (
        !confirm(
          `${datei.name} enthält ${typfehler.length} Feld(er) mit falschem Datentyp:\n${beispiele}${typfehler.length > 5 ? "\n…" : ""}\n\nTrotzdem in die Maske übernehmen? Betroffene Felder werden leer angezeigt; die Meldung muss korrigiert werden.`,
        )
      )
        return;
    }
    const quellen = quellenHinweise(d, ui).filter((b) => b.stufe === "warnung");
    stand.current = d;
    if (ersetzen) ersetzen(d);
    else setMeldung(d);
    setSchritt(0);
    const zeilen = [`${datei.name} geladen (Schema: ${mig.herkunft}, Status: ${d[ui.rollen.status_feld]}).`, ...mig.hinweise];
    const pruefschritt = ui.schritte.find((s) => s.pruefung) ?? ui.schritte[ui.schritte.length - 1];
    if (schema.length) zeilen.push(`Schemaprüfung: ${schema.length} Abweichung(en) – Einzelheiten im Schritt „${pruefschritt?.titel ?? ""}“.`);
    else zeilen.push("Schemaprüfung ohne Befund.");
    if (quellen.length) zeilen.push(`Quellen: ${quellen.length} Hinweis(e).`);
    setMeldungen({ art: !mig.bekannt || schema.length ? "hinweis" : "ok", zeilen });
  };

  // Schema- und Pflichtbefunde einmal je Stand der Meldung, für die Felder und den Prüfschritt (seit 0.6.5, TP-2026-W44-15);
  // geprüft wird wie im Prüfschritt als finale Meldung
  const r = ui.rollen;
  const schemaBefunde = useMemo(
    () => pruefeGegenSchema(profil.schema, { ...meldung, [r.status_feld]: r.status_final }, ui),
    [profil.schema, meldung, r.status_feld, r.status_final, ui],
  );
  const pflicht = useMemo(() => pflichtHinweise(meldung, ui), [meldung, ui]);
  const feldBefunde = useMemo<FeldBefundeWert>(() => ({ befunde: befundeJeFeld(schemaBefunde, pflicht, ui) }), [schemaBefunde, pflicht, ui]);

  /** Vom Befund im Prüfschritt zum Feld: Schritt wechseln, dann das Feld (oder das nächste umfassende) fokussieren */
  const sprungZiel = useRef<string | null>(null);
  const [sprungNr, setSprungNr] = useState(0);
  const zumFeld = (pfad: string) => {
    const segs = teilePfad(pfad);
    const i = schritte.findIndex((st) => st.felder.some((f) => teilePfad(f)[0] === segs[0]));
    if (i < 0) return;
    sprungZiel.current = feldSchluessel(segs);
    setSchritt(i);
    setSprungNr((n) => n + 1);
  };
  useLayoutEffect(() => {
    const ziel = sprungZiel.current;
    if (ziel === null) return;
    sprungZiel.current = null;
    let teile = ziel.split("/");
    while (teile.length) {
      const k = teile.join("/");
      const rahmen = [...document.querySelectorAll<HTMLElement>("[data-feld]")].find((el) => el.dataset.feld === k);
      const eingabe = rahmen?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea, button");
      if (eingabe) {
        eingabe.focus();
        eingabe.scrollIntoView?.({ block: "center", behavior: scrollVerhalten() });
        return;
      }
      teile = teile.slice(0, -1);
    }
    document.getElementById("schritt-titel")?.focus();
  }, [sprungNr]);

  const anzahlSv = (holeWert(meldung, ui.rollen.sachverhalte) || []).length;
  // Hinzufügen oder Entfernen von Sachverhalten verschiebt die Pfade: Verlauf der Eingabehilfen dieser Liste verwerfen
  const vorherSv = useRef(anzahlSv);
  useLayoutEffect(() => {
    if (vorherSv.current !== anzahlSv) eingabehilfeVerlauf.verwerfen(`${teilePfad(ui.rollen.sachverhalte).join(".")}.`);
    vorherSv.current = anzahlSv;
  }, [anzahlSv, ui.rollen.sachverhalte]);

  return (
    <FeldBefundeKontext.Provider value={feldBefunde}>
      <EingabehilfeKontext.Provider value={eingabehilfe}>
        <div className="meldung">
          <div className="werkzeugleiste">
            <div className="werkzeugleiste-text">
              <h1>{ui.titel}</h1>
              {ui.untertitel && <p>{ui.untertitel}</p>}
            </div>
            <div className="werkzeugleiste-knoepfe">
              <button type="button" className="knopf" onClick={() => dateiRef.current?.click()}>
                Meldung öffnen
              </button>
              <button
                type="button"
                className="knopf leise"
                onClick={() => {
                  if (confirm("Neue, leere Meldung beginnen? Der aktuelle Stand wird verworfen, sofern er nicht gespeichert ist.")) {
                    neu();
                    setSchritt(0);
                    setMeldungen(null);
                  }
                }}
              >
                Neue Meldung
              </button>
              <input
                ref={dateiRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void oeffnen(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
          {zwischenstand && <p className="zwischenstand">Zwischenstand automatisch gesichert: {zwischenstand}</p>}
          {meldungen && (
            <div className={`kasten kasten-${meldungen.art}`} role="status">
              <ul>
                {meldungen.zeilen.map((z, i) => (
                  <li key={i}>{z}</li>
                ))}
              </ul>
              <button type="button" className="knopf leise klein" onClick={() => setMeldungen(null)}>
                Ausblenden
              </button>
            </div>
          )}

          <div className="arbeitsbereich">
            <nav className="schritte" aria-label="Schritte">
              <ol>
                {schritte.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={i === schritt ? "schritt aktiv" : i < schritt ? "schritt erledigt" : "schritt"}
                      aria-current={i === schritt ? "step" : undefined}
                      onClick={() => setSchritt(i)}
                    >
                      <span className="schritt-nr">{i + 1}</span>
                      <span className="schritt-titel">{s.titel}</span>
                      {s.felder.includes(ui.rollen.sachverhalte) && <span className="schritt-zahl">{anzahlSv}</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            <section className="schritt-inhalt" aria-labelledby="schritt-titel">
              <h2 id="schritt-titel" tabIndex={-1}>
                {aktuell.titel}
              </h2>
              {aktuell.einleitung && <p className="einleitung">{aktuell.einleitung}</p>}
              {aktuell.pruefung && <Pruefen profil={profil} meldung={meldung} teil="pruefung" befunde={{ schema: schemaBefunde, pflicht }} zumFeld={zumFeld} />}
              {aktuell.felder.map((feld) => {
                const segs = teilePfad(feld);
                return <Feld key={feld} profil={profil} knoten={unterSchema(profil.schema, segs)} segs={segs} wert={holeWert(meldung, segs)} setze={setze} />;
              })}
              {aktuell.pruefung && <Pruefen profil={profil} meldung={meldung} teil="ausgabe" />}
              {aktuell.kurzfassung && <KurzfassungKasten profil={profil} meldung={meldung} ki={ki} eigenerSchritt />}
              <div className="schritt-nav">
                {schritt > 0 ? (
                  <button type="button" className="knopf leise" onClick={() => setSchritt(schritt - 1)}>
                    Zurück: {schritte[schritt - 1]?.titel}
                  </button>
                ) : (
                  <span />
                )}
                {schritt < schritte.length - 1 && (
                  <button type="button" className="knopf primaer" onClick={() => setSchritt(schritt + 1)}>
                    Weiter: {schritte[schritt + 1]?.titel}
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </EingabehilfeKontext.Provider>
    </FeldBefundeKontext.Provider>
  );
}
