// Einstellungen: API-Schlüssel, Modelle und Aufwand je Stufe, Recherchegrenzen, Verbindungstest.

import { useState } from "react";
import { AnthropicAnbieter } from "../anbieter/anthropic";
import { formatUsd, PREISSTAND } from "../anbieter/preise";
import type { Aufwand } from "../anbieter/typen";
import type { Profil } from "../kern/typen";
import { APP_MODELLE, MODELL_AUSWAHL, type Einstellungen as E, type Rolle } from "../pipeline/einstellungen";

interface Props {
  profil: Profil | null;
  einstellungen: E;
  setEinstellungen: (e: E) => void;
  schluessel: string;
  setSchluessel: (s: string) => void;
}

const ROLLEN: { id: Rolle; titel: string; text: string }[] = [
  { id: "vorverarbeitung", titel: "S1 Gegenstand und SOP-Auswahl", text: "Kurze Einordnung ohne Recherche" },
  { id: "erfassung", titel: "S2 Recherche und Entwurf", text: "Websuche, Abruf, Entwurf der Meldung" },
  { id: "reparatur", titel: "S3 Reparatur", text: "Korrektur von Schemafehlern ohne neue Recherche" },
];

const AUFWAND: { id: Aufwand; titel: string }[] = [
  { id: "low", titel: "niedrig" },
  { id: "medium", titel: "mittel" },
  { id: "high", titel: "hoch" },
  { id: "xhigh", titel: "sehr hoch" },
  { id: "max", titel: "maximal" },
];

export function EinstellungenAnsicht({ profil, einstellungen: e, setEinstellungen, schluessel, setSchluessel }: Props) {
  const [eingabe, setEingabe] = useState(schluessel);
  const [zeigen, setZeigen] = useState(false);
  const [test, setTest] = useState<{ art: "ok" | "fehler" | "laeuft"; text: string } | null>(null);

  const setze = (teil: Partial<E>) => setEinstellungen({ ...e, ...teil });

  const pruefen = async () => {
    setTest({ art: "laeuft", text: "Verbindung wird geprüft …" });
    try {
      const a = await new AnthropicAnbieter(eingabe.trim()).senden({
        modell: "claude-haiku-5-5",
        maxTokens: 64,
        aufwand: "low",
        system: [{ text: "Antworte knapp." }],
        nachrichten: [{ role: "user", content: "Antworte nur mit: Verbindung steht." }],
      });
      setTest({ art: "ok", text: `${a.text.trim() || "Antwort erhalten."} (${a.modell}, ${formatUsd(a.kostenUsd)})` });
    } catch (err) {
      setTest({ art: "fehler", text: (err as Error).message });
    }
  };

  return (
    <div className="einstellungen">
      <div className="werkzeugleiste">
        <div className="werkzeugleiste-text">
          <h1>Einstellungen</h1>
          <p>Gelten für dieses Gerät und diesen Browser. Leere Modellfelder bedeuten: Vorgabe des aktiven Profils.</p>
        </div>
      </div>

      <section className="schritt-inhalt abschnitt-einzeln">
        <h2>API-Schlüssel (Anthropic)</h2>
        <p className="einleitung">
          Du brauchst einen eigenen Schlüssel aus der{" "}
          <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener noreferrer">
            Claude Console
          </a>
          . Die App schickt ihn nur an api.anthropic.com. Er liegt unverschlüsselt im Speicher dieses Browsers; nutze deshalb einen eigenen Schlüssel mit
          Ausgabenlimit und lösche ihn auf geteilten Geräten.
        </p>
        <div className="schluessel-zeile">
          <input
            type={zeigen ? "text" : "password"}
            value={eingabe}
            onChange={(ev) => setEingabe(ev.target.value)}
            placeholder="sk-ant-…"
            autoComplete="off"
            spellCheck={false}
            aria-label="API-Schlüssel"
          />
          <button type="button" className="knopf leise klein" onClick={() => setZeigen(!zeigen)}>
            {zeigen ? "Verbergen" : "Anzeigen"}
          </button>
        </div>
        <div className="aktionen">
          <button type="button" className="knopf primaer" disabled={eingabe.trim() === schluessel} onClick={() => setSchluessel(eingabe.trim())}>
            Speichern
          </button>
          <button type="button" className="knopf" disabled={!eingabe.trim() || test?.art === "laeuft"} onClick={pruefen}>
            Verbindung prüfen
          </button>
          {schluessel && (
            <button
              type="button"
              className="knopf leise"
              onClick={() => {
                setEingabe("");
                setSchluessel("");
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

      <section className="schritt-inhalt abschnitt-einzeln">
        <h2>Modelle und Aufwand</h2>
        <p className="einleitung">Höherer Aufwand bedeutet gründlichere Arbeit, aber mehr Token und längere Laufzeit.</p>
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
                      {MODELL_AUSWAHL.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
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
            <span className="feld-label">Höchstzahl Ausgabetoken (S2, S3)</span>
            <input
              type="number"
              min={8000}
              max={128000}
              step={1000}
              value={e.maxTokensErfassung}
              onChange={(ev) => setze({ maxTokensErfassung: Math.min(128000, Math.max(8000, Number(ev.target.value) || 64000)) })}
            />
          </label>
        </div>
        <p className="hinweis">Kostenschätzung nach Listenpreisen, Stand {PREISSTAND}.</p>
      </section>
    </div>
  );
}
