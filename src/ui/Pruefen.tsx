// Schritt „Prüfen & Exportieren“: Schemaprüfung, Hinweise, Übersicht und Ausgabe.

import { useMemo, useState } from "react";
import { pruefeGegenSchema } from "../kern/validierung";
import { ausfuellHinweise, pflichtHinweise } from "../kern/kennsaetze";
import { dateiname, managementSummary } from "../kern/ausgabe";
import { holeWert } from "../kern/pfad";
import { feldUi, radarFuer } from "../kern/ui";
import { sachverhalte } from "../kern/quellen";
import type { Befund, Meldung, Profil } from "../kern/typen";
import { dateiAnbieten } from "../speicher/speicher";
import { meldungAlsPdf } from "../dokumente/pdf";
import { RadarGrafik } from "./Radar";

function Liste({ titel, eintraege, art }: { titel: string; eintraege: string[]; art: "fehler" | "hinweis" | "ok" }) {
  if (!eintraege.length) return null;
  return (
    <div className={`kasten kasten-${art}`}>
      <h3>{titel}</h3>
      <ul>
        {eintraege.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function Pruefen({ profil, meldung, teil }: { profil: Profil; meldung: Meldung; teil: "pruefung" | "ausgabe" }) {
  const r = profil.ui.rollen;
  const [kopiert, setKopiert] = useState(false);
  const alsFinal = useMemo(() => ({ ...meldung, [r.status_feld]: r.status_final }), [meldung, r]);
  const schemaBefunde = useMemo(() => pruefeGegenSchema(profil.schema, alsFinal, profil.ui), [profil, alsFinal]);
  const pflicht = useMemo(() => pflichtHinweise(meldung, profil.ui), [profil, meldung]);
  const hinweise = useMemo(() => ausfuellHinweise(meldung, profil.ui), [profil, meldung]);
  const ent = r.entstehung_feld ? meldung[r.entstehung_feld] : undefined;
  const svs = sachverhalte(meldung, profil.ui);
  const radarFeld = r.sv_radar ? feldUi(profil.ui, `${r.sachverhalte}[].${r.sv_radar}`) : undefined;
  const radarDef = radarFeld ? radarFuer(profil.ui, radarFeld) : undefined;
  const elementName = feldUi(profil.ui, r.sachverhalte).element_label || "Eintrag";

  const exportiere = (final: boolean) => {
    const daten = { ...meldung, [r.status_feld]: final ? r.status_final : r.status_entwurf };
    if (final && schemaBefunde.length) {
      const ok = confirm(
        `Die Meldung besteht die Schemaprüfung als finale Meldung nicht (${schemaBefunde.length} Abweichung(en)). Eine so exportierte Datei wird beim Einlesen als fehlerhaft markiert.\n\nTrotzdem final exportieren?`,
      );
      if (!ok) return;
    }
    dateiAnbieten(JSON.stringify(daten, null, 2) + "\n", dateiname(daten, profil, !final) + ".json", "application/json");
  };
  const pdf = (final: boolean) => {
    const daten = { ...meldung, [r.status_feld]: final ? r.status_final : r.status_entwurf };
    dateiAnbieten(meldungAlsPdf(daten, profil, !final), dateiname(daten, profil, !final) + ".pdf", "application/pdf");
  };
  const summary = managementSummary(meldung, profil);
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    } catch {
      alert("Die Zwischenablage ist hier nicht verfügbar. Bitte die Textdatei speichern.");
    }
  };
  const text = (b: Befund[]) => b.map((x) => x.text);

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
          <button type="button" className="knopf" onClick={() => pdf(false)}>
            Entwurf als PDF
          </button>
          <button type="button" className="knopf" onClick={() => pdf(true)}>
            Final als PDF
          </button>
        </div>

        <details className="summary">
          <summary>{profil.ui.kurzfassung?.titel || "Management Summary"} (Klartext ohne Quellenverweise)</summary>
          <pre>{summary}</pre>
          <div className="aktionen">
            <button type="button" className="knopf" onClick={kopieren}>
              {kopiert ? "Kopiert" : "Text kopieren"}
            </button>
            <button
              type="button"
              className="knopf leise"
              onClick={() => dateiAnbieten(summary, dateiname(meldung, profil, false) + "_Summary.txt", "text/plain;charset=utf-8")}
            >
              Als TXT speichern
            </button>
          </div>
        </details>
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
          {Array.isArray(ent.sop) && ent.sop.length > 0 && <p>Angewandte SOP: {ent.sop.join("; ")}</p>}
          {ent.kodierleitfaden && <p>Kodierleitfaden: {ent.kodierleitfaden}</p>}
          <p className="hinweis">
            Ein KI-Entwurf bleibt als solcher gekennzeichnet, auch nach Bearbeitung. Fachliche Prüfung und Freigabe erfolgen über den Freigabeblock.
          </p>
        </div>
      )}

      {schemaBefunde.length ? (
        <Liste titel={`Schemaprüfung als finale Meldung: ${schemaBefunde.length} Abweichung(en)`} eintraege={schemaBefunde.map((b) => b.text)} art="fehler" />
      ) : (
        <div className="kasten kasten-ok">
          <h3>Schemaprüfung bestanden</h3>
          <p>Die Meldung entspricht dem Schema {profil.manifest.meldung.schema_id}, auch als finale Meldung. Inhaltliche Richtigkeit prüft das Schema nicht.</p>
        </div>
      )}
      <Liste titel="Pflichtangaben" eintraege={text(pflicht)} art="fehler" />
      <Liste titel="Ausfüllhinweise (keine Pflichtangaben)" eintraege={text(hinweise)} art="hinweis" />

      <h3 className="abschnitt">Übersicht</h3>
      <div className="uebersicht">
        {svs.map((sv, i) => {
          const b = r.sv_beurteilung ? String(holeWert(sv, r.sv_beurteilung) || "") : "";
          const t = r.sv_tendenz ? String(holeWert(sv, r.sv_tendenz) || "") : "";
          return (
            <article key={i} className={`zeile-sv stufe-${b.toLowerCase().replace(/[^a-zäöüß]/g, "") || "leer"}`}>
              {radarDef && r.sv_radar && <RadarGrafik def={radarDef} wert={holeWert(sv, r.sv_radar)} groesse={150} />}
              <div>
                <p className="element-nr">
                  {elementName} {i + 1}
                </p>
                <p className="zeile-titel">{(r.sv_bezeichnung && holeWert(sv, r.sv_bezeichnung)) || "ohne Bezeichnung"}</p>
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
