// Schritt „Prüfen & Exportieren“: Schemaprüfung, Hinweise, Übersicht und Ausgabe. Die Management Summary hat seit 0.5.17
// einen eigenen Schritt danach (Meldung.tsx).

import { useMemo, useState } from "react";
import { pruefeGegenSchema } from "../kern/validierung";
import { ausfuellHinweise, pflichtHinweise } from "../kern/kennsaetze";
import { dateiname } from "../kern/ausgabe";
import { holeWert } from "../kern/pfad";
import { alsText, feldUi, radarFuer } from "../kern/ui";
import { sachverhalte } from "../kern/quellen";
import type { Befund, Meldung, Profil } from "../kern/typen";
import { dateiAnbieten } from "../speicher/speicher";
import { RadarGrafik } from "./Radar";
import { pdfVorladen } from "../dokumente/vorladen";
import { rangBeurteilung } from "../lagebild/lagebild";

/** Liste der Befunde; mit Pfad und `zumFeld` führt ein Befund per Klick zum Feld (seit 0.6.5, TP-2026-W44-15) */
function Liste({
  titel,
  eintraege,
  art,
  zumFeld,
}: {
  titel: string;
  eintraege: { text: string; pfad?: string }[];
  art: "fehler" | "hinweis" | "ok";
  zumFeld?: (pfad: string) => void;
}) {
  if (!eintraege.length) return null;
  return (
    <div className={`kasten kasten-${art}`}>
      <h3>{titel}</h3>
      <ul>
        {eintraege.map((b, i) => (
          <li key={i}>
            {b.pfad && zumFeld ? (
              <button type="button" className="befund-sprung" onClick={() => zumFeld(b.pfad!)}>
                {b.text}
              </button>
            ) : (
              b.text
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pruefen({
  profil,
  meldung,
  teil,
  befunde,
  zumFeld,
}: {
  profil: Profil;
  meldung: Meldung;
  teil: "pruefung" | "ausgabe";
  /** Schema- und Pflichtbefunde, wenn die Meldungsmaske sie schon berechnet hat (seit 0.6.5) */
  befunde?: { schema: { pfad?: string; text: string }[]; pflicht: Befund[] };
  /** Vom Befund zum Feld (Schritt wechseln, Feld fokussieren) */
  zumFeld?: (pfad: string) => void;
}) {
  const r = profil.ui.rollen;
  const alsFinal = useMemo(() => ({ ...meldung, [r.status_feld]: r.status_final }), [meldung, r]);
  const eigeneSchema = useMemo(() => (befunde ? null : pruefeGegenSchema(profil.schema, alsFinal, profil.ui)), [befunde, profil, alsFinal]);
  const eigenePflicht = useMemo(() => (befunde ? null : pflichtHinweise(meldung, profil.ui)), [befunde, profil, meldung]);
  const schemaBefunde = befunde?.schema ?? eigeneSchema ?? [];
  const pflicht = befunde?.pflicht ?? eigenePflicht ?? [];
  const hinweise = useMemo(() => ausfuellHinweise(meldung, profil.ui), [profil, meldung]);
  const ent = r.entstehung_feld ? meldung[r.entstehung_feld] : undefined;
  const svs = sachverhalte(meldung, profil.ui);
  const radarFeld = r.sv_radar ? feldUi(profil.ui, `${r.sachverhalte}[].${r.sv_radar}`) : undefined;
  const radarDef = radarFeld ? radarFuer(profil.ui, radarFeld) : undefined;
  const elementName = feldUi(profil.ui, r.sachverhalte).element_label || "Eintrag";

  /** Gemeinsame Freigabeprüfung für finale JSON- und PDF-Ausgaben */
  const finalFreigeben = (final: boolean): boolean =>
    !final ||
    !schemaBefunde.length ||
    confirm(
      `Die Meldung besteht die Schemaprüfung als finale Meldung nicht (${schemaBefunde.length} Abweichung(en)). Eine so ausgegebene Fassung gilt als fehlerhaft.\n\nTrotzdem final ausgeben?`,
    );
  const exportiere = (final: boolean) => {
    const jetzt = new Date();
    const daten = { ...meldung, [r.status_feld]: final ? r.status_final : r.status_entwurf };
    if (!finalFreigeben(final)) return;
    dateiAnbieten(JSON.stringify(daten, null, 2) + "\n", dateiname(daten, profil, !final, jetzt) + ".json", "application/json");
  };
  const [pdfFehler, setPdfFehler] = useState<string | null>(null);
  const pdf = async (final: boolean) => {
    setPdfFehler(null);
    // Exportzeitpunkt vor dem Nachladen der PDF-Ausgabe festhalten (Rückfall, wenn kein Meldezeitpunkt angegeben ist)
    const jetzt = new Date();
    if (!finalFreigeben(final)) return;
    const daten = { ...meldung, [r.status_feld]: final ? r.status_final : r.status_entwurf };
    try {
      // Die PDF-Bibliothek wird erst bei Bedarf geladen (kleineres Haupt-JavaScript)
      const { meldungAlsPdf } = await import("../dokumente/pdf");
      dateiAnbieten(meldungAlsPdf(daten, profil, !final), dateiname(daten, profil, !final, jetzt) + ".pdf", "application/pdf");
    } catch (e) {
      setPdfFehler(`Das PDF konnte nicht erzeugt werden (${(e as Error)?.message || String(e)}). Die Meldung lässt sich weiterhin als JSON speichern.`);
    }
  };

  if (teil === "ausgabe")
    return (
      <div className="pruefen">
        <h3 className="abschnitt">Ausgeben</h3>
        <div className="aktionen">
          <button type="button" className="knopf" onClick={() => exportiere(false)}>
            Entwurf als JSON speichern
          </button>
          <button type="button" className="knopf primaer" onClick={() => exportiere(true)}>
            Final als JSON exportieren
          </button>
          <button type="button" className="knopf" onClick={() => pdf(false)} onPointerEnter={pdfVorladen} onFocus={pdfVorladen}>
            Entwurf als PDF
          </button>
          <button type="button" className="knopf" onClick={() => pdf(true)} onPointerEnter={pdfVorladen} onFocus={pdfVorladen}>
            Final als PDF
          </button>
        </div>
        {pdfFehler && (
          <div className="kasten kasten-fehler" role="alert">
            <p>{pdfFehler}</p>
          </div>
        )}
      </div>
    );
  return (
    <div className="pruefen">
      {ent && (
        <div className="kasten kasten-info">
          <h3>Entstehung</h3>
          <p>Verfahren: {ent.verfahren}</p>
          {ent.werkzeug && <p>Werkzeug: {ent.werkzeug}</p>}
          {ent.modell && <p>Modell: {ent.modell}</p>}
          {ent.erstellt && <p>Erstellt: {ent.erstellt}</p>}
          {Array.isArray(ent.sop) ? (
            <p>Beigefügte SOP und Bausteine (KI-Kontext, Teil A gilt immer): {ent.sop.length ? ent.sop.join("; ") : "keine"}</p>
          ) : (
            ent.verfahren === "KI-Entwurf" && <p>Beigefügte SOP und Bausteine: nicht dokumentiert</p>
          )}
          {ent.kodierleitfaden && <p>Kodierleitfaden: {ent.kodierleitfaden}</p>}
          <p className="hinweis">
            Ein KI-Entwurf bleibt als solcher gekennzeichnet, auch nach Bearbeitung. Fachliche Prüfung und Freigabe erfolgen über den Freigabeblock.
          </p>
        </div>
      )}

      {schemaBefunde.length ? (
        <Liste titel={`Schemaprüfung als finale Meldung: ${schemaBefunde.length} Abweichung(en)`} eintraege={schemaBefunde} art="fehler" zumFeld={zumFeld} />
      ) : (
        <div className="kasten kasten-ok">
          <h3>Schemaprüfung bestanden</h3>
          <p>Die Meldung entspricht dem Schema {profil.manifest.meldung.schema_id}, auch als finale Meldung. Inhaltliche Richtigkeit prüft das Schema nicht.</p>
        </div>
      )}
      <Liste titel="Pflichtangaben" eintraege={pflicht} art="fehler" zumFeld={zumFeld} />
      <Liste titel="Ausfüllhinweise (keine Pflichtangaben)" eintraege={hinweise} art="hinweis" zumFeld={zumFeld} />

      <h3 className="abschnitt">Übersicht</h3>
      <div className="uebersicht">
        {svs.map((sv, i) => {
          const b = r.sv_beurteilung ? String(holeWert(sv, r.sv_beurteilung) || "") : "";
          const t = r.sv_tendenz ? String(holeWert(sv, r.sv_tendenz) || "") : "";
          return (
            <article key={i} className="zeile-sv" data-rang={rangBeurteilung(profil, b)}>
              {radarDef && r.sv_radar && <RadarGrafik def={radarDef} wert={holeWert(sv, r.sv_radar)} groesse={150} />}
              <div>
                <p className="element-nr">
                  {elementName} {i + 1}
                </p>
                <p className="zeile-titel">{(r.sv_bezeichnung && alsText(holeWert(sv, r.sv_bezeichnung))) || "ohne Bezeichnung"}</p>
                <p className="zeile-status">
                  <span className="status">{b || "keine Bewertung"}</span>
                  {r.sv_tendenz && <span className="status">{t || "keine Tendenz"}</span>}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
