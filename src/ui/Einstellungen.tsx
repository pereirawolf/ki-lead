// Einstellungen: API-Schlüssel je Anbieter, Modelle und Aufwand je Stufe, Recherchegrenzen, Verbindungstest.

import { useState } from "react";
import { formatUsd, PREISSTAND } from "../anbieter/preise";
import type { Aufwand } from "../anbieter/typen";
import { ANBIETER_NAME, anbieterVon, Verteiler, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import type { Profil } from "../kern/typen";
import { FarbschemaAbschnitt, type FarbZugang } from "./Farbschema";
import { APP_MODELLE, AUFWAND_STUFEN, MODELL_GRUPPEN, STANDARD, type Einstellungen as E, type Rolle } from "../pipeline/einstellungen";

interface Props {
  profil: Profil | null;
  einstellungen: E;
  setEinstellungen: (e: E) => void;
  schluessel: Schluessel;
  setSchluessel: (id: AnbieterId, wert: string) => void;
  /** Farbschema der Oberfläche */
  farben?: FarbZugang;
}

const ROLLEN: { id: Rolle; titel: string; text: string }[] = [
  { id: "vorverarbeitung", titel: "S1 Gegenstand und SOP-Auswahl", text: "Kurze Einordnung ohne Recherche" },
  { id: "erfassung", titel: "S2 Recherche und Entwurf", text: "Websuche, Abruf, Entwurf der Meldung" },
  { id: "verdichtung", titel: "S2 Verdichtung", text: "Eingangsmeldungen zu einer eigenen Meldung verdichten (statt S2 Erfassung)" },
  { id: "reparatur", titel: "S3 Reparatur", text: "Korrektur von Schemafehlern ohne neue Recherche" },
  { id: "kurzfassung", titel: "Management Summary", text: "Konsolidierte Fassung für die Leitung aus der fertigen Meldung" },
];

const AUFWAND = AUFWAND_STUFEN;

const ANBIETER: { id: AnbieterId; konsole: string; konsoleName: string; host: string; platzhalter: string; testModell: string }[] = [
  {
    id: "anthropic",
    konsole: "https://platform.claude.com/settings/keys",
    konsoleName: "Claude Console",
    host: "api.anthropic.com",
    platzhalter: "sk-ant-…",
    testModell: "claude-haiku-5-5",
  },
  {
    id: "openai",
    konsole: "https://platform.openai.com/api-keys",
    konsoleName: "OpenAI Platform",
    host: "api.openai.com",
    platzhalter: "sk-…",
    testModell: "gpt-6-luna",
  },
];

function SchluesselAbschnitt({ a, wert, setzen }: { a: (typeof ANBIETER)[number]; wert: string; setzen: (w: string) => void }) {
  const [eingabe, setEingabe] = useState(wert);
  const [zeigen, setZeigen] = useState(false);
  const [test, setTest] = useState<{ art: "ok" | "fehler" | "laeuft"; text: string } | null>(null);
  const name = ANBIETER_NAME[a.id];

  const pruefen = async () => {
    setTest({ art: "laeuft", text: "Verbindung wird geprüft …" });
    try {
      const antwort = await new Verteiler({ anthropic: "", openai: "", [a.id]: eingabe.trim() }).senden({
        modell: a.testModell,
        maxTokens: a.id === "openai" ? 400 : 64,
        aufwand: "low",
        system: [{ text: "Antworte knapp." }],
        nachrichten: [{ role: "user", content: "Antworte nur mit: Verbindung steht." }],
      });
      setTest({ art: "ok", text: `${antwort.text.trim() || "Antwort erhalten."} (${antwort.modell}, ${formatUsd(antwort.kostenUsd)})` });
    } catch (err) {
      setTest({ art: "fehler", text: (err as Error).message });
    }
  };

  return (
    <section className="schritt-inhalt abschnitt-einzeln">
      <h2>API-Schlüssel ({name})</h2>
      <p className="einleitung">
        Eigener Schlüssel aus der{" "}
        <a href={a.konsole} target="_blank" rel="noopener noreferrer">
          {a.konsoleName}
        </a>
        . Die App schickt ihn nur an {a.host}. Er liegt unverschlüsselt im Speicher dieses Browsers; nutze deshalb einen eigenen Schlüssel mit Ausgabenlimit und
        lösche ihn auf geteilten Geräten.
      </p>
      <div className="schluessel-zeile">
        <input
          type={zeigen ? "text" : "password"}
          value={eingabe}
          onChange={(ev) => setEingabe(ev.target.value)}
          placeholder={a.platzhalter}
          autoComplete="off"
          spellCheck={false}
          aria-label={`API-Schlüssel ${name}`}
        />
        <button type="button" className="knopf leise klein" onClick={() => setZeigen(!zeigen)}>
          {zeigen ? "Verbergen" : "Anzeigen"}
        </button>
      </div>
      <div className="aktionen">
        <button type="button" className="knopf primaer" disabled={eingabe.trim() === wert} onClick={() => setzen(eingabe.trim())}>
          Speichern
        </button>
        <button type="button" className="knopf" disabled={!eingabe.trim() || test?.art === "laeuft"} onClick={pruefen}>
          Verbindung prüfen
        </button>
        {wert && (
          <button
            type="button"
            className="knopf leise"
            onClick={() => {
              setEingabe("");
              setzen("");
              setTest(null);
            }}
          >
            Schlüssel löschen
          </button>
        )}
      </div>
      {test && (
        <div className={`kasten ${test.art === "ok" ? "kasten-ok" : test.art === "fehler" ? "kasten-fehler" : "kasten-info"}`} role="status">
          <p>{test.text}</p>
        </div>
      )}
    </section>
  );
}

export function EinstellungenAnsicht({ profil, einstellungen: e, setEinstellungen, schluessel, setSchluessel, farben }: Props) {
  const setze = (teil: Partial<E>) => setEinstellungen({ ...e, ...teil });
  const openAiGenutzt = ROLLEN.some((r) => anbieterVon(e.modelle[r.id] || profil?.manifest.modelle?.[r.id] || APP_MODELLE[r.id]) === "openai");

  return (
    <div className="einstellungen">
      <div className="werkzeugleiste">
        <div className="werkzeugleiste-text">
          <h1>Einstellungen</h1>
          <p>Gelten für dieses Gerät und diesen Browser. Leere Modellfelder bedeuten: Vorgabe des aktiven Profils.</p>
        </div>
      </div>

      {farben && <FarbschemaAbschnitt profil={profil} zugang={farben} />}

      {ANBIETER.map((a) => (
        <SchluesselAbschnitt key={a.id} a={a} wert={schluessel[a.id]} setzen={(w) => setSchluessel(a.id, w)} />
      ))}

      <section className="schritt-inhalt abschnitt-einzeln">
        <h2>Modelle und Aufwand</h2>
        <p className="einleitung">
          Höherer Aufwand bedeutet gründlichere Arbeit, aber mehr Token und längere Laufzeit. Modelle beider Anbieter lassen sich je Stufe mischen; für jeden
          genutzten Anbieter braucht es einen Schlüssel.
        </p>
        <table className="tabelle tabelle-formular">
          <thead>
            <tr>
              <th>Stufe</th>
              <th>Modell</th>
              <th>Aufwand</th>
            </tr>
          </thead>
          <tbody>
            {ROLLEN.map((r) => {
              const vorgabe = profil?.manifest.modelle?.[r.id] || APP_MODELLE[r.id];
              return (
                <tr key={r.id}>
                  <td>
                    <strong>{r.titel}</strong>
                    <br />
                    <span className="material-meta">{r.text}</span>
                  </td>
                  <td>
                    <select
                      aria-label={`Modell ${r.titel}`}
                      value={e.modelle[r.id]}
                      onChange={(ev) => setze({ modelle: { ...e.modelle, [r.id]: ev.target.value } })}
                    >
                      <option value="">Vorgabe ({vorgabe})</option>
                      {MODELL_GRUPPEN.map((g) => (
                        <optgroup key={g.anbieter} label={g.anbieter}>
                          {g.modelle.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      aria-label={`Aufwand ${r.titel}`}
                      value={e.aufwand[r.id]}
                      onChange={(ev) => setze({ aufwand: { ...e.aufwand, [r.id]: ev.target.value as Aufwand } })}
                    >
                      {AUFWAND.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.titel}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="schritt-inhalt abschnitt-einzeln">
        <h2>Recherche</h2>
        <div className="gruppe-spalten-zwei">
          <label className="feld">
            <span className="feld-label">Höchstzahl Websuchen je Lauf</span>
            <input type="number" min={0} max={50} value={e.websucheMax} onChange={(ev) => setze({ websucheMax: Math.max(0, Number(ev.target.value) || 0) })} />
            <span className="hinweis">0 schaltet die Websuche ab. Eine Suche kostet 0,01 USD zuzüglich Token.</span>
          </label>
          <label className="feld">
            <span className="feld-label">Höchstzahl Seitenabrufe je Lauf</span>
            <input type="number" min={0} max={50} value={e.abrufMax} onChange={(ev) => setze({ abrufMax: Math.max(0, Number(ev.target.value) || 0) })} />
          </label>
          <label className="feld">
            <span className="feld-label">Höchstlänge je abgerufener Seite (Token)</span>
            <input
              type="number"
              min={0}
              max={100000}
              step={1000}
              value={e.abrufMaxTokens}
              onChange={(ev) => setze({ abrufMaxTokens: Math.max(0, Number(ev.target.value) || 0) })}
            />
            <span className="hinweis">Kürzt sehr lange Seiten (Navigation, Tabellen) und senkt so die Kosten. 0: ohne Grenze.</span>
          </label>
          <label className="feld">
            <span className="feld-label">Land für die Websuche</span>
            <input type="text" maxLength={2} value={e.suchland} onChange={(ev) => setze({ suchland: ev.target.value.toUpperCase() })} />
            <span className="hinweis">Zweistelliger Ländercode, z. B. DE, AT, CH. Leer: keine Lokalisierung.</span>
          </label>
          <label className="feld">
            <span className="feld-label">Höchstzahl Ausgabetoken (S1, S2, S3)</span>
            <input
              type="number"
              min={8000}
              max={128000}
              step={1000}
              value={e.maxTokensErfassung}
              onChange={(ev) => setze({ maxTokensErfassung: Math.min(128000, Math.max(8000, Number(ev.target.value) || STANDARD.maxTokensErfassung)) })}
            />
            <span className="hinweis">
              Gilt für jeden KI-Aufruf der App (S1, S2, S3 und Management Summary). Nachdenken und Antwort zählen gemeinsam; berechnet wird nur die tatsächliche
              Ausgabe. Ein kleinerer Wert kann Läufe vor dem Ergebnis abbrechen.
            </span>
          </label>
        </div>
        {openAiGenutzt && (
          <p className="hinweis">
            OpenAI: Die Websuche öffnet Seiten selbst; ein eigenes Abrufwerkzeug gibt es nicht. Websuchen und Seitenabrufe zusammen begrenzen dort die Zahl der
            Werkzeugaufrufe, die Höchstlänge je Seite gilt nur für Anthropic. Jeder Werkzeugaufruf kostet etwa 0,01 USD zuzüglich Token.
          </p>
        )}
        <p className="hinweis">Kostenschätzung nach Listenpreisen, Stand {PREISSTAND}.</p>
      </section>
    </div>
  );
}
