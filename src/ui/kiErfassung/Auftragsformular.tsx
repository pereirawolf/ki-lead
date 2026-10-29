// Schritt „Auftrag und Material“ der KI-Erfassung (seit 0.6.5, TP-2026-W44-17 in eigener Datei): Gegenstand,
// Ausgangsinformationen, Webseiten, Dateien, Stichtag, Prüffrage, Recherche und Modelle, Bestätigung, Start von S1.

import { useMemo, useRef, type Dispatch } from "react";
import { anbieterListe, anbieterVon } from "../../anbieter/verteiler";
import { jetztLokal } from "../../kern/ausgabe";
import { zoneOder } from "../../kern/zeit";
import { laufModelle, modellFuer } from "../../pipeline/einstellungen";
import type { Lauf } from "../../pipeline/lauf";
import { istMeldung, umklassifizieren } from "../../pipeline/material";
import { HilfeFeld } from "../HilfeFeld";
import { LaufSchaetzung, type SchaetzStufe } from "../LaufSchaetzung";
import type { StufeModell } from "../ModellWahl";
import { LaufModellWahl } from "./LaufModellWahl";
import { OFFLINE_HINWEIS, OfflineHinweis, ProtokollKnopf, type LaufRahmen } from "./rahmen";
import { rechercheZeile } from "./recherche";
import { TEXT_FELD } from "./texte";
import { groesse, type Eingabe, type KiAktion } from "./zustand";

export function Auftragsformular({
  rahmen,
  eingabe,
  dispatch,
  fehler,
  lauf,
  urls,
  kannStarten,
  starten,
  dateienHinzufuegen,
}: {
  rahmen: LaufRahmen;
  eingabe: Eingabe;
  dispatch: Dispatch<KiAktion>;
  fehler: string | null;
  /** zuletzt gescheiterter oder abgebrochener Lauf */
  lauf: Lauf | null;
  urls: { gueltig: string[]; ungueltig: string[] };
  kannStarten: boolean;
  starten: () => void;
  dateienHinzufuegen: (liste: FileList | File[] | null) => Promise<void>;
}) {
  const { profil, laufEinstellungen, verdichtung, websuche, eingaenge, stufeS2, stufeS3, schaetzS2 } = rahmen;
  const { sachverhalt, stichworte, urlText, stichtag, uhrzeit, prueffrage, material, dateiFehler, datenOk } = eingabe;
  const setze = (teil: Partial<Eingabe>) => dispatch({ typ: "eingabe", teil });
  const dateiRef = useRef<HTMLInputElement>(null);
  // Gleiche Arrays über Renderläufe (ModellWahl und LaufSchaetzung sind memo, seit 0.6.5, TP-2026-W44-18)
  const modellStufen = useMemo<StufeModell[]>(
    () => [{ rolle: "vorverarbeitung", kurz: "S1", titel: "S1 Gegenstand und SOP-Auswahl", art: "s1" }, stufeS2, stufeS3],
    [stufeS2, stufeS3],
  );
  const schaetzStufen = useMemo<SchaetzStufe[]>(() => [{ kurz: "S1", rolle: "vorverarbeitung", art: "s1" }, schaetzS2], [schaetzS2]);
  return (
    <>
      <h2 tabIndex={-1}>Auftrag und Material</h2>
      <p className="einleitung">
        Beschreibe, was geklärt werden soll, und gib vorhandenes Material mit. Ohne Material recherchiert die KI selbst in offenen Quellen.
      </p>
      {fehler && (
        <div className="kasten kasten-fehler" role="alert">
          <p>{fehler}</p>
          {lauf && (
            <div className="aktionen">
              <ProtokollKnopf lauf={lauf} text="Laufprotokoll des abgebrochenen Laufs exportieren" exportieren={rahmen.protokollExport} />
            </div>
          )}
        </div>
      )}
      <HilfeFeld lang label={TEXT_FELD.gegenstand.label} hilfe={TEXT_FELD.gegenstand.hilfe}>
        {(a) => (
          <textarea
            {...a}
            rows={3}
            value={sachverhalt}
            onChange={(e) => setze({ sachverhalt: e.target.value })}
            placeholder={TEXT_FELD.gegenstand.platzhalter}
          />
        )}
      </HilfeFeld>
      <HilfeFeld lang label={TEXT_FELD.ausgangsinformationen.label} hilfe={TEXT_FELD.ausgangsinformationen.hilfe}>
        {(a) => (
          <textarea
            {...a}
            rows={4}
            value={stichworte}
            onChange={(e) => setze({ stichworte: e.target.value })}
            placeholder={TEXT_FELD.ausgangsinformationen.platzhalter}
          />
        )}
      </HilfeFeld>
      <HilfeFeld
        lang
        label={TEXT_FELD.webseiten.label}
        hilfe={TEXT_FELD.webseiten.hilfe}
        zusatz={urls.gueltig.length > 0 && !websuche ? TEXT_FELD.webseiten.ohneWebsuche : undefined}
        nach={urls.ungueltig.length > 0 && <span className="fehlertext">Keine gültige Adresse: {urls.ungueltig.join(", ")}</span>}
      >
        {(a) => <textarea {...a} rows={3} value={urlText} onChange={(e) => setze({ urlText: e.target.value })} placeholder="https://…" />}
      </HilfeFeld>
      <div className="feld">
        <span className="feld-label">Dateien</span>
        <p className="hinweis">
          TXT, MD, JSON (auch eine Vormeldung zur Fortschreibung), DOCX und PDF. Dateien bleiben auf dem Gerät, bis du die Erfassung startest.
        </p>
        <div className="aktionen">
          <button type="button" className="knopf" onClick={() => dateiRef.current?.click()}>
            Dateien hinzufügen
          </button>
        </div>
        <input
          ref={dateiRef}
          type="file"
          multiple
          hidden
          accept=".txt,.md,.markdown,.json,.docx,.pdf,.csv,text/plain,application/json,application/pdf"
          onChange={(e) => {
            void dateienHinzufuegen(e.target.files);
            e.target.value = "";
          }}
        />
        {dateiFehler.map((f, i) => (
          <p key={i} className="fehlertext">
            {f}
          </p>
        ))}
        {material.length > 0 && (
          <ul className="materialliste">
            {material.map((m) => (
              <li key={m.id}>
                <span className="material-name">{m.name}</span>
                <span className="material-meta">
                  {m.art === "meldung" ? "Vormeldung" : m.art === "eingang" ? "Eingang" : m.art.toUpperCase()}
                  {m.art === "meldung" || m.art === "eingang" ? (m.rolleGewaehlt ? " (Rolle festgelegt)" : " (automatisch erkannt)") : ""} ·{" "}
                  {groesse(m.groesse)}
                  {m.hinweis ? ` · ${m.hinweis}` : ""}
                </span>
                {(m.art === "meldung" || (m.art === "eingang" && m.meldung && istMeldung(m.meldung, profil))) && (
                  <button
                    type="button"
                    className="knopf leise klein"
                    aria-label={`${m.name} ${m.art === "meldung" ? "als Eingang behandeln" : "als Vormeldung behandeln"}`}
                    onClick={() => dispatch({ typ: "material", aendern: (a) => a.map((x) => (x.id === m.id ? umklassifizieren(x, profil) : x)) })}
                  >
                    {m.art === "meldung" ? "Als Eingang behandeln" : "Als Vormeldung behandeln"}
                  </button>
                )}
                <button
                  type="button"
                  className="knopf leise klein"
                  aria-label={`${m.name} entfernen`}
                  onClick={() => dispatch({ typ: "material", aendern: (a) => a.filter((x) => x.id !== m.id) })}
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="gruppe-spalten-zwei">
        <div className="feld">
          <span className="feld-label" id="t0-auftrag">
            {TEXT_FELD.stichtag.label}
          </span>
          <p className="hinweis feld-hilfe" id="t0-auftrag-hilfe">
            {TEXT_FELD.stichtag.hilfe}
          </p>
          <div className="datum-zeit" role="group" aria-labelledby="t0-auftrag" aria-describedby="t0-auftrag-hilfe">
            <input type="date" aria-label="Stichtag" value={stichtag} onChange={(e) => setze({ stichtag: e.target.value })} />
            <input type="time" aria-label="Uhrzeit (optional)" value={uhrzeit} disabled={!stichtag} onChange={(e) => setze({ uhrzeit: e.target.value })} />
          </div>
          <div className="datumzeit-knoepfe">
            <button
              type="button"
              className="knopf leise klein"
              aria-label="Jetzt: Stichtag und Uhrzeit auf aktuelle Zeit setzen"
              onClick={() => {
                const j = jetztLokal(zoneOder(profil.manifest.variablen?.zeitzone), new Date());
                setze({ stichtag: j.slice(0, 10), uhrzeit: j.slice(11, 16) });
              }}
            >
              Jetzt
            </button>
            {uhrzeit && (
              <button type="button" className="knopf leise klein" aria-label="Nur Tag: Uhrzeit entfernen" onClick={() => setze({ uhrzeit: "" })}>
                Nur Tag
              </button>
            )}
          </div>
        </div>
        <HilfeFeld label={TEXT_FELD.prueffrage.label} hilfe={TEXT_FELD.prueffrage.hilfe}>
          {(a) => (
            <input
              {...a}
              type="text"
              value={prueffrage}
              onChange={(e) => setze({ prueffrage: e.target.value })}
              placeholder={TEXT_FELD.prueffrage.platzhalter}
            />
          )}
        </HilfeFeld>
      </div>
      {verdichtung && (
        <div className="kasten kasten-info" role="status">
          <h3>Verdichtung</h3>
          <p>
            {eingaenge.length} Eingangsmeldung{eingaenge.length === 1 ? "" : "en"} anderer Stellen erkannt. Die KI verdichtet sie zu einer eigenen Meldung mit
            möglichst wenigen Sachverhalten (SOP-LEAD A.7).
          </p>
        </div>
      )}
      {/* Recherche, Modelle und Schätzung in einem Rahmen, danach die Bestätigung (seit 0.5.22, Punkt 9) */}
      <LaufModellWahl
        stufen={modellStufen}
        websuche={websuche}
        wahl={rahmen.wahl}
        setWahl={rahmen.setWahl}
        kopf={
          <label className="schalter">
            <input type="checkbox" checked={websuche} onChange={(e) => setze({ websucheWahl: e.target.checked })} />
            <span>
              Recherche durchführen
              <span className="hinweis">
                {" "}
                {verdichtung ? "Bei Verdichtung standardmäßig aus, z. B. für fiktive Übungslagen." : "Ohne Haken arbeitet die KI nur mit dem Material."}
              </span>
            </span>
          </label>
        }
      >
        <p className="hinweis">
          {rechercheZeile(
            websuche,
            laufEinstellungen,
            modellFuer(stufeS2.rolle, laufEinstellungen, profil),
            modellFuer("vorverarbeitung", laufEinstellungen, profil),
          )}
        </p>
        <LaufSchaetzung stufen={schaetzStufen} einstellungen={laufEinstellungen} profil={profil} />
      </LaufModellWahl>
      <label className="bestaetigung">
        <input type="checkbox" checked={datenOk} onChange={(e) => setze({ datenOk: e.target.checked })} />
        <span>
          Ich gebe nur fiktive oder offen zugängliche Inhalte weiter, keine personenbezogenen und keine eingestuften Daten. Die Inhalte gehen an{" "}
          {anbieterListe([...new Set(laufModelle(laufEinstellungen, profil, verdichtung).map(anbieterVon))])}.
        </span>
      </label>
      <OfflineHinweis offline={rahmen.offline} />
      <div className="schritt-nav">
        <span />
        <button
          type="button"
          className="knopf primaer"
          disabled={!kannStarten}
          aria-describedby={rahmen.offline ? OFFLINE_HINWEIS : undefined}
          onClick={starten}
        >
          Gegenstand bestimmen (S1)
        </button>
      </div>
    </>
  );
}
