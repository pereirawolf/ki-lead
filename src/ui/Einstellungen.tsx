// Einstellungen in sechs Bereichen mit Abschnittsnavigation wie bei Meldung und Lagebild (seit 0.5.6):
// Übersicht, KI-Anbieter & API, Modelle & Verarbeitung, Recherche & Grenzen, Darstellung, Über KI-LEAD.
// Reine Umgliederung der Oberfläche: Einstellungen, Vorgaben, Speicherorte und Schlüssel bleiben, wie sie sind.

import { useState } from "react";
import { formatUsd, PREISSTAND } from "../anbieter/preise";
import type { MistralEndpunkt } from "../anbieter/mistral";
import type { Aufwand } from "../anbieter/typen";
import { ANBIETER_IDS, ANBIETER_NAME, anbieterListe, anbieterVon, LEERE_SCHLUESSEL, Verteiler, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import type { Profil } from "../kern/typen";
import { FarbschemaAbschnitt, type FarbZugang } from "./Farbschema";
import {
  APP_MODELLE,
  AUFWAND_STUFEN,
  MODELL_GRUPPEN,
  modellHerkunft,
  profilvorgabeAktiv,
  profilvorgabeAnwenden,
  STANDARD,
  STANDARD_PROFILE,
  standardProfilAktiv,
  standardProfilAnwenden,
  type Einstellungen as E,
  type Rolle,
} from "../pipeline/einstellungen";
import { ABLAGEN, ablage as ablageVon, type AblageId } from "../schluessel/ablage";
import { UeberAbschnitt } from "./Ueber";

export type EinstellungsBereich = "uebersicht" | "anbieter" | "modelle" | "recherche" | "darstellung" | "ueber";

export const BEREICHE: { id: EinstellungsBereich; titel: string }[] = [
  { id: "uebersicht", titel: "Übersicht" },
  { id: "anbieter", titel: "KI-Anbieter & API" },
  { id: "modelle", titel: "Modelle & Verarbeitung" },
  { id: "recherche", titel: "Recherche & Grenzen" },
  { id: "darstellung", titel: "Darstellung" },
  { id: "ueber", titel: "Über KI-LEAD" },
];

interface Props {
  profil: Profil | null;
  einstellungen: E;
  setEinstellungen: (e: E) => void;
  schluessel: Schluessel;
  setSchluessel: (id: AnbieterId, wert: string) => void;
  /** Gewählte Ablage der API-Schlüssel und Wechsel (zieht vorhandene Schlüssel mit um) */
  ablage?: AblageId;
  setAblage?: (id: AblageId) => Promise<void>;
  /** Farbschema der Oberfläche */
  farben?: FarbZugang;
  /**
   * Angezeigter Bereich. Mit setBereich hält die App ihn über einen Wechsel der Ansicht hinweg; ohne setBereich
   * ist er nur der Startbereich.
   */
  bereich?: EinstellungsBereich;
  setBereich?: (b: EinstellungsBereich) => void;
}

const ROLLEN: { id: Rolle; titel: string; text: string }[] = [
  { id: "vorverarbeitung", titel: "S1 Gegenstand und SOP-Auswahl", text: "Kurze Einordnung ohne Recherche" },
  { id: "erfassung", titel: "S2 Recherche und Entwurf", text: "Websuche, Abruf, Entwurf der Meldung" },
  { id: "verdichtung", titel: "S2 Verdichtung", text: "Eingangsmeldungen zu einer eigenen Meldung verdichten (statt S2 Erfassung)" },
  { id: "reparatur", titel: "S3 Reparatur", text: "Korrektur von Schemafehlern ohne neue Recherche" },
  { id: "kurzfassung", titel: "Management Summary", text: "Konsolidierte Fassung für die Leitung aus der fertigen Meldung" },
];

const AUFWAND = AUFWAND_STUFEN;
const aufwandTitel = (a: Aufwand) => AUFWAND.find((x) => x.id === a)?.titel ?? a;

interface AnbieterInfo {
  id: AnbieterId;
  konsole: string;
  konsoleName: string;
  host: string;
  platzhalter: string;
  testModell: string;
  testTokens: number;
  /** Hinweise zum Anbieter, aufklappbar unter dem Schlüssel */
  hinweise: string[];
}

const ANBIETER: AnbieterInfo[] = [
  {
    id: "anthropic",
    konsole: "https://platform.claude.com/settings/keys",
    konsoleName: "Claude Console",
    host: "api.anthropic.com",
    platzhalter: "sk-ant-…",
    testModell: "claude-haiku-5-5",
    testTokens: 64,
    hinweise: [
      "Verarbeitung in den USA. Websuche und Seitenabruf als eigene Werkzeuge mit Höchstzahl je Lauf.",
      "Empfehlung: eigener Workspace und eigener Schlüssel nur für KI-LEAD, mit Ausgabenlimit.",
    ],
  },
  {
    id: "openai",
    konsole: "https://platform.openai.com/api-keys",
    konsoleName: "OpenAI Platform",
    host: "api.openai.com",
    platzhalter: "sk-…",
    testModell: "gpt-6-luna",
    testTokens: 400,
    hinweise: ["Verarbeitung in den USA. Anfragen gehen mit store: false. Die Websuche öffnet Seiten selbst; ein eigenes Abrufwerkzeug gibt es nicht."],
  },
  {
    id: "mistral",
    konsole: "https://console.mistral.ai/",
    konsoleName: "Mistral Console",
    host: "api.eu.mistral.ai bzw. api.mistral.ai (je nach Endpunkt)",
    platzhalter: "Schlüssel aus der Mistral Console",
    testModell: "mistral-small-2603",
    testTokens: 400,
    hinweise: [
      "Europäischer Anbieter (Paris). EU-Endpunkt: Verarbeitung in Rechenzentren in EU und EFTA, 10 % Aufschlag, keine Websuche; Kontoverwaltung und Abrechnung können außerhalb liegen. Welche Modelle dort bereitstehen, legt Mistral je Region fest.",
      "Globaler Endpunkt: mit Websuche (Conversations-API). Die Websuche kennt keine Höchstzahl je Anfrage; die App zählt die Suchen. Ein eigenes Abrufwerkzeug gibt es nicht.",
      "Aufbewahrung 30 Tage zur Missbrauchsüberwachung. Die Löschung ohne Aufbewahrung (Zero Data Retention, auf Antrag) gilt für den EU-Weg (Chat Completions), nicht für die Conversations-API.",
      "Im kostenlosen Tarif darf Mistral Ein- und Ausgaben zum Training nutzen. Abschalten in der Mistral-Verwaltung unter „Privacy“ („Anonymous improvement data“).",
      "Anbindung neu seit 0.5.6 und noch nicht erprobt.",
    ],
  },
];

const MISTRAL_ENDPUNKTE: { id: MistralEndpunkt; titel: string; text: string }[] = [
  {
    id: "eu",
    titel: "EU (api.eu.mistral.ai)",
    text: "Vorgabe. Verarbeitung in EU und EFTA, 10 % Aufschlag, ohne Websuche: S2 arbeitet dann nur mit dem Material.",
  },
  { id: "global", titel: "Global (api.mistral.ai)", text: "Mit Websuche. Verarbeitung nicht auf eine Region festgelegt." },
];

/** Wirksames Modell einer Aufgabe: eigene Einstellung, sonst Vorgabe des Profils, sonst der App */
const wirksam = (r: Rolle, e: E, profil: Profil | null) => e.modelle[r] || profil?.manifest.modelle?.[r] || APP_MODELLE[r];

const HERKUNFT: Record<ReturnType<typeof modellHerkunft>, string> = {
  einstellung: "eigene Einstellung",
  profil: "Vorgabe des Profils",
  app: "Vorgabe der App",
};

/** Voreinstellung, der Modell und Aufwand aller Aufgaben gerade folgen */
type Voreinstellung = "profil" | AnbieterId | "individuell";

function aktiveVoreinstellung(e: E): Voreinstellung {
  if (profilvorgabeAktiv(e)) return "profil";
  return ANBIETER_IDS.find((a) => standardProfilAktiv(e, a)) ?? "individuell";
}

function voreinstellungTitel(v: Voreinstellung): string {
  if (v === "profil") return "Vorgaben des aktiven Profils";
  if (v === "individuell") return "Individuelle Modellkonfiguration";
  return `Standard-Profil ${ANBIETER_NAME[v]}`;
}

/** Kurzbeschreibung eines Standard-Profils: „S1 claude-haiku-5-5 (hoch) · …“ */
function standardProfilText(id: AnbieterId): string {
  const s = STANDARD_PROFILE[id];
  const kurz: Record<Rolle, string> = {
    vorverarbeitung: "S1",
    erfassung: "S2 Erfassung",
    verdichtung: "S2 Verdichtung",
    reparatur: "S3 Reparatur",
    kurzfassung: "Management Summary",
  };
  return ROLLEN.map((r) => `${kurz[r.id]} ${s.modelle[r.id]} (${aufwandTitel(s.aufwand[r.id])})`).join(" · ");
}

/** Anbieter, die mit den aktuellen Einstellungen genutzt werden, in fester Reihenfolge */
function genutzteAnbieter(e: E, profil: Profil | null): AnbieterId[] {
  const genutzt = new Set(ROLLEN.map((r) => anbieterVon(wirksam(r.id, e, profil))));
  return ANBIETER_IDS.filter((a) => genutzt.has(a));
}

// ── Übersicht ─────────────────────────────────────────────────────────────────

function UebersichtBereich({
  profil,
  e,
  schluessel,
  ablage,
  zeige,
}: {
  profil: Profil | null;
  e: E;
  schluessel: Schluessel;
  ablage?: AblageId;
  zeige: (b: EinstellungsBereich) => void;
}) {
  const genutzt = genutzteAnbieter(e, profil);
  const fehlend = genutzt.filter((a) => !schluessel[a]);
  return (
    <section className="schritt-inhalt" aria-labelledby="einstellungen-bereich-titel">
      <h2 id="einstellungen-bereich-titel">Übersicht</h2>
      <p className="einleitung">Aktueller Stand auf diesem Gerät, gelesen aus den gespeicherten Einstellungen. Ändern lässt er sich in den Bereichen links.</p>

      {fehlend.length > 0 && (
        <div className="kasten kasten-hinweis" role="status">
          <p>Für {anbieterListe(fehlend)} ist kein API-Schlüssel hinterlegt; Aufgaben mit diesen Modellen lassen sich nicht starten.</p>
          <button type="button" className="knopf klein" onClick={() => zeige("anbieter")}>
            Schlüssel hinterlegen
          </button>
        </div>
      )}

      <dl className="uebersicht-liste">
        <dt>Aktives Profil</dt>
        <dd>{profil ? `${profil.manifest.name} ${profil.manifest.version}` : "keines"}</dd>
        <dt>Voreinstellung der Modelle</dt>
        <dd>{voreinstellungTitel(aktiveVoreinstellung(e))}</dd>
        <dt>Mistral-Endpunkt</dt>
        <dd>{MISTRAL_ENDPUNKTE.find((x) => x.id === e.mistralEndpunkt)?.titel}</dd>
        <dt>Ablage der API-Schlüssel</dt>
        <dd>{ablage ? ablageVon(ablage).titel : "–"}</dd>
        <dt>Recherche je Lauf</dt>
        <dd>
          bis zu {e.websucheMax} Websuchen und {e.abrufMax} Seitenabrufe{e.suchland ? `, Suchland ${e.suchland}` : ", ohne Suchland"}
        </dd>
        <dt>Ausgabetoken</dt>
        <dd>höchstens {e.maxTokensErfassung.toLocaleString("de-DE")} je KI-Aufruf</dd>
      </dl>

      <h3>KI-Anbieter</h3>
      <table className="tabelle">
        <thead>
          <tr>
            <th>Anbieter</th>
            <th>API-Schlüssel</th>
            <th>Genutzt für</th>
          </tr>
        </thead>
        <tbody>
          {ANBIETER_IDS.map((a) => {
            const aufgaben = ROLLEN.filter((r) => anbieterVon(wirksam(r.id, e, profil)) === a);
            return (
              <tr key={a}>
                <td>{ANBIETER_NAME[a]}</td>
                <td>{schluessel[a] ? "hinterlegt" : aufgaben.length ? "fehlt" : "nicht hinterlegt"}</td>
                <td>{aufgaben.length ? aufgaben.map((r) => r.titel).join(", ") : "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Modelle je Aufgabe</h3>
      <table className="tabelle">
        <thead>
          <tr>
            <th>Aufgabe</th>
            <th>Modell</th>
            <th>Aufwand</th>
            <th>Herkunft</th>
          </tr>
        </thead>
        <tbody>
          {ROLLEN.map((r) => (
            <tr key={r.id}>
              <td>{r.titel}</td>
              <td>{wirksam(r.id, e, profil)}</td>
              <td>{aufwandTitel(e.aufwand[r.id])}</td>
              <td>{HERKUNFT[modellHerkunft(r.id, e, profil)]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hinweis">
        In der KI-Erfassung lassen sich Modelle, Aufwand und Websuchen je Lauf abweichend wählen. Die tatsächlich verwendeten Werte stehen im Laufprotokoll.
      </p>
    </section>
  );
}

// ── KI-Anbieter & API ─────────────────────────────────────────────────────────

function AblageAbschnitt({ ablage, setAblage }: { ablage: AblageId; setAblage: (id: AblageId) => Promise<void> }) {
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const waehlen = async (id: AblageId) => {
    setFehler(null);
    setLaeuft(true);
    try {
      await setAblage(id);
    } catch (err) {
      setFehler((err as Error).message);
    } finally {
      setLaeuft(false);
    }
  };
  return (
    <section className="einstellung-block" aria-labelledby="ablage-titel">
      <h3 id="ablage-titel">Ablage der API-Schlüssel</h3>
      <p className="einleitung">
        Wo deine Schlüssel liegen, entscheidest du. Beim Wechsel zieht die App vorhandene Schlüssel mit um und entfernt sie aus der bisherigen Ablage. Ein
        Ausgabenlimit beim Anbieter begrenzt das Risiko in jedem Fall.
      </p>
      <fieldset className="ablage-wahl" disabled={laeuft}>
        <legend className="sr-only">Ablage der API-Schlüssel</legend>
        {ABLAGEN.map((x) => (
          <label key={x.id} className={x.verfuegbar() ? "ablage-option" : "ablage-option gesperrt"}>
            <input type="radio" name="ablage" value={x.id} checked={ablage === x.id} disabled={!x.verfuegbar()} onChange={() => waehlen(x.id)} />
            <span>
              <strong>{x.titel}</strong>
              {!x.verfuegbar() && " (hier nicht verfügbar)"}
              <br />
              <span className="ablage-text">{x.beschreibung}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {fehler && (
        <div className="kasten kasten-fehler" role="alert">
          <p>Die Ablage wurde nicht gewechselt: {fehler}</p>
        </div>
      )}
    </section>
  );
}

function SchluesselAbschnitt({
  a,
  wert,
  setzen,
  ablage,
  e,
  setEinstellungen,
}: {
  a: AnbieterInfo;
  wert: string;
  setzen: (w: string) => void;
  ablage: AblageId;
  e: E;
  setEinstellungen: (e: E) => void;
}) {
  const [eingabe, setEingabe] = useState(wert);
  const [zeigen, setZeigen] = useState(false);
  const [test, setTest] = useState<{ art: "ok" | "fehler" | "laeuft"; text: string } | null>(null);
  const name = ANBIETER_NAME[a.id];
  const geaendert = eingabe.trim() !== wert;

  const pruefen = async () => {
    setTest({ art: "laeuft", text: "Verbindung wird geprüft …" });
    try {
      const antwort = await Verteiler.fuer({ ...LEERE_SCHLUESSEL, [a.id]: eingabe.trim() }, { mistralEndpunkt: e.mistralEndpunkt }).senden({
        modell: a.testModell,
        maxTokens: a.testTokens,
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
    <section className="einstellung-block" aria-labelledby={`schluessel-${a.id}`}>
      <h3 id={`schluessel-${a.id}`}>API-Schlüssel ({name})</h3>
      <p className="einleitung">
        Eigener Schlüssel aus der{" "}
        <a href={a.konsole} target="_blank" rel="noopener noreferrer">
          {a.konsoleName}
        </a>
        . Die App schickt ihn nur an {a.host}. Ablage: {ablageVon(ablage).titel}
        {ablage === "geraet" ? " (unverschlüsselt)" : ""}. Nutze einen eigenen Schlüssel mit Ausgabenlimit und lösche ihn auf geteilten Geräten.
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
        <button type="button" className="knopf primaer" disabled={!geaendert} onClick={() => setzen(eingabe.trim())}>
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
      <p className="material-meta">
        {wert
          ? geaendert
            ? "Eingabe geändert, noch nicht gespeichert."
            : "Gespeichert."
          : geaendert
            ? "Noch nicht gespeichert."
            : "Kein Schlüssel hinterlegt."}
      </p>
      {test && (
        <div className={`kasten ${test.art === "ok" ? "kasten-ok" : test.art === "fehler" ? "kasten-fehler" : "kasten-info"}`} role="status">
          <p>{test.text}</p>
        </div>
      )}
      {a.id === "mistral" && (
        <fieldset className="ablage-wahl mistral-endpunkt">
          <legend>Endpunkt</legend>
          {MISTRAL_ENDPUNKTE.map((x) => (
            <label key={x.id} className="ablage-option">
              <input
                type="radio"
                name="mistral-endpunkt"
                value={x.id}
                checked={e.mistralEndpunkt === x.id}
                onChange={() => {
                  setEinstellungen({ ...e, mistralEndpunkt: x.id });
                  setTest(null);
                }}
              />
              <span>
                <strong>{x.titel}</strong>
                <br />
                <span className="ablage-text">{x.text}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <details className="anbieter-hinweise">
        <summary>Hinweise zu {name}</summary>
        <ul>
          {a.hinweise.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function AnbieterBereich({
  schluessel,
  setSchluessel,
  ablage,
  setAblage,
  e,
  setEinstellungen,
}: {
  schluessel: Schluessel;
  setSchluessel: (id: AnbieterId, wert: string) => void;
  ablage: AblageId;
  setAblage?: (id: AblageId) => Promise<void>;
  e: E;
  setEinstellungen: (e: E) => void;
}) {
  return (
    <section className="schritt-inhalt" aria-labelledby="einstellungen-bereich-titel">
      <h2 id="einstellungen-bereich-titel">KI-Anbieter & API</h2>
      <p className="einleitung">
        Zugang zu den KI-Anbietern. Ein Schlüssel wird erst mit „Speichern“ übernommen. Welche Modelle die Aufgaben nutzen, steht unter „Modelle &
        Verarbeitung“.
      </p>
      {setAblage && <AblageAbschnitt ablage={ablage} setAblage={setAblage} />}
      {ANBIETER.map((a) => (
        <SchluesselAbschnitt
          key={`${a.id}:${ablage}`}
          a={a}
          wert={schluessel[a.id]}
          setzen={(w) => setSchluessel(a.id, w)}
          ablage={ablage}
          e={e}
          setEinstellungen={setEinstellungen}
        />
      ))}
    </section>
  );
}

// ── Modelle & Verarbeitung ────────────────────────────────────────────────────

function VoreinstellungWahl({ e, setEinstellungen }: { e: E; setEinstellungen: (e: E) => void }) {
  const aktiv = aktiveVoreinstellung(e);
  const [gesetzt, setGesetzt] = useState<Voreinstellung | null>(null);
  const waehlen = (v: Exclude<Voreinstellung, "individuell">) => {
    if (v === aktiv) return;
    if (
      aktiv === "individuell" &&
      !confirm(
        `Die individuelle Modellkonfiguration wird überschrieben: Modell und Aufwand aller Aufgaben folgen dann „${voreinstellungTitel(v)}“. Fortfahren?`,
      )
    )
      return;
    setEinstellungen(v === "profil" ? profilvorgabeAnwenden(e) : standardProfilAnwenden(e, v));
    setGesetzt(v);
  };
  const optionen: { v: Voreinstellung; text: string }[] = [
    { v: "profil", text: "Modelle wie im aktiven Profil bzw. in der App vorgegeben, Aufwand nach den Vorgaben der App." },
    ...ANBIETER_IDS.map((a) => ({ v: a as Voreinstellung, text: standardProfilText(a) })),
    { v: "individuell", text: "Entsteht, sobald unten einzelne Aufgaben abweichend gewählt sind. Mischen der Anbieter ist möglich." },
  ];
  return (
    <fieldset className="ablage-wahl voreinstellung-wahl">
      <legend>Voreinstellung</legend>
      {optionen.map((o) => (
        <label key={o.v} className={o.v === "individuell" && aktiv !== "individuell" ? "ablage-option gesperrt" : "ablage-option"}>
          <input
            type="radio"
            name="voreinstellung"
            value={o.v}
            checked={aktiv === o.v}
            disabled={o.v === "individuell"}
            onChange={() => o.v !== "individuell" && waehlen(o.v)}
          />
          <span>
            <strong>{voreinstellungTitel(o.v)}</strong>
            <br />
            <span className="ablage-text">{o.text}</span>
          </span>
        </label>
      ))}
      {gesetzt && gesetzt === aktiv && (
        <div className="kasten kasten-ok" role="status">
          <p>Modell und Aufwand aller Aufgaben folgen jetzt „{voreinstellungTitel(gesetzt)}“. Einzelne Aufgaben lassen sich darunter weiter anpassen.</p>
        </div>
      )}
    </fieldset>
  );
}

function ModelleBereich({
  profil,
  e,
  setEinstellungen,
  schluessel,
}: {
  profil: Profil | null;
  e: E;
  setEinstellungen: (e: E) => void;
  schluessel: Schluessel;
}) {
  const setze = (teil: Partial<E>) => setEinstellungen({ ...e, ...teil });
  return (
    <section className="schritt-inhalt" aria-labelledby="einstellungen-bereich-titel">
      <h2 id="einstellungen-bereich-titel">Modelle & Verarbeitung</h2>
      <p className="einleitung">
        Modell und Aufwand je Aufgabe. Höherer Aufwand bedeutet gründlichere Arbeit, aber mehr Token und längere Laufzeit. Modelle verschiedener Anbieter lassen
        sich je Aufgabe mischen; für jeden genutzten Anbieter braucht es einen Schlüssel.
      </p>
      <VoreinstellungWahl e={e} setEinstellungen={setEinstellungen} />
      <table className="tabelle tabelle-formular">
        <thead>
          <tr>
            <th>Aufgabe</th>
            <th>Modell</th>
            <th>Aufwand</th>
          </tr>
        </thead>
        <tbody>
          {ROLLEN.map((r) => {
            const vorgabe = profil?.manifest.modelle?.[r.id] || APP_MODELLE[r.id];
            const modell = wirksam(r.id, e, profil);
            const ohneSchluessel = !schluessel[anbieterVon(modell)];
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
                  <br />
                  <span className="material-meta">
                    {HERKUNFT[modellHerkunft(r.id, e, profil)]} · {ANBIETER_NAME[anbieterVon(modell)]}
                    {ohneSchluessel ? " · kein Schlüssel" : ""}
                  </span>
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
      <p className="hinweis">
        Mistral kennt nur Nachdenken an oder aus: „niedrig“ läuft ohne Nachdenken, alle anderen Stufen mit „high“. Lehnt ein Mistral-Modell die Angabe ab,
        versucht die App es einmal ohne sie und vermerkt das im Laufprotokoll.
      </p>
    </section>
  );
}

// ── Recherche & Grenzen ───────────────────────────────────────────────────────

function RechercheBereich({ profil, e, setEinstellungen }: { profil: Profil | null; e: E; setEinstellungen: (e: E) => void }) {
  const setze = (teil: Partial<E>) => setEinstellungen({ ...e, ...teil });
  const genutzt = genutzteAnbieter(e, profil);
  return (
    <section className="schritt-inhalt" aria-labelledby="einstellungen-bereich-titel">
      <h2 id="einstellungen-bereich-titel">Recherche & Grenzen</h2>
      <p className="einleitung">
        Allgemeine Grenzen für Umfang, Laufzeit und Kosten. Ob ein Lauf recherchieren darf, entscheidet die KI-Erfassung je Auftrag; das Laufprotokoll hält die
        wirksamen Werte fest.
      </p>
      <div className="gruppe-spalten-zwei">
        <label className="feld">
          <span className="feld-label">Höchstzahl Websuchen je Lauf</span>
          <input type="number" min={0} max={50} value={e.websucheMax} onChange={(ev) => setze({ websucheMax: Math.max(0, Number(ev.target.value) || 0) })} />
          <span className="hinweis">0 schaltet die Websuche ab. Eine Suche kostet 0,01 USD (Mistral etwa 0,03 USD) zuzüglich Token.</span>
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
          <span className="feld-label">Maximale Ausgabetoken je KI-Aufruf</span>
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
      <h3>Unterschiede der Anbieter</h3>
      <ul className="hinweis-liste">
        <li>
          <strong>Anthropic:</strong> Websuche und Seitenabruf sind getrennte Werkzeuge; beide Höchstzahlen und die Höchstlänge je Seite gelten.
          {genutzt.includes("anthropic") ? "" : " (derzeit nicht genutzt)"}
        </li>
        <li>
          <strong>OpenAI:</strong> Die Websuche öffnet Seiten selbst; ein eigenes Abrufwerkzeug gibt es nicht. Websuchen und Seitenabrufe zusammen begrenzen die
          Zahl der Werkzeugaufrufe, die Höchstlänge je Seite gilt nicht. Jeder Werkzeugaufruf kostet etwa 0,01 USD zuzüglich Token.
          {genutzt.includes("openai") ? "" : " (derzeit nicht genutzt)"}
        </li>
        <li>
          <strong>Mistral:</strong> Über den EU-Endpunkt (Vorgabe) gibt es keine Werkzeuge; S2 arbeitet dann nur mit dem Material, und die App sagt das dem
          Modell und im Ergebnis. Über den globalen Endpunkt nur die Websuche, ohne technische Höchstzahl; die App zählt die Suchen und schreibt sie ins
          Laufprotokoll. Seitenabrufe und die Höchstlänge je Seite gelten bei Mistral nicht. Derzeit gewählt:{" "}
          {MISTRAL_ENDPUNKTE.find((x) => x.id === e.mistralEndpunkt)?.titel}.{genutzt.includes("mistral") ? "" : " (derzeit nicht genutzt)"}
        </li>
      </ul>
      <p className="hinweis">Kostenschätzung nach Listenpreisen, Stand {PREISSTAND}.</p>
    </section>
  );
}

// ── Gesamtansicht ─────────────────────────────────────────────────────────────

export function EinstellungenAnsicht({
  profil,
  einstellungen: e,
  setEinstellungen,
  schluessel,
  setSchluessel,
  ablage = "geraet",
  setAblage,
  farben,
  bereich,
  setBereich,
}: Props) {
  const [eigenerBereich, setEigenerBereich] = useState<EinstellungsBereich>(bereich ?? "uebersicht");
  const aktiv = setBereich ? (bereich ?? "uebersicht") : eigenerBereich;
  const zeige = setBereich ?? setEigenerBereich;
  const sichtbar = BEREICHE.filter((b) => b.id !== "darstellung" || farben);
  const aktuell = sichtbar.some((b) => b.id === aktiv) ? aktiv : "uebersicht";

  return (
    <div className="einstellungen">
      <div className="werkzeugleiste">
        <div className="werkzeugleiste-text">
          <h1>Einstellungen</h1>
          <p>Gelten für dieses Gerät und diesen Browser. Änderungen werden sofort gespeichert, API-Schlüssel erst mit „Speichern“.</p>
        </div>
      </div>

      <div className="arbeitsbereich">
        <nav className="schritte bereiche" aria-label="Bereiche der Einstellungen">
          <ol>
            {sichtbar.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className={b.id === aktuell ? "schritt aktiv" : "schritt"}
                  aria-current={b.id === aktuell ? "true" : undefined}
                  onClick={() => zeige(b.id)}
                >
                  {b.titel}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="bereich-inhalt">
          {aktuell === "uebersicht" && (
            <UebersichtBereich profil={profil} e={e} schluessel={schluessel} ablage={setAblage ? ablage : undefined} zeige={zeige} />
          )}
          {aktuell === "anbieter" && (
            <AnbieterBereich
              schluessel={schluessel}
              setSchluessel={setSchluessel}
              ablage={ablage}
              setAblage={setAblage}
              e={e}
              setEinstellungen={setEinstellungen}
            />
          )}
          {aktuell === "modelle" && <ModelleBereich profil={profil} e={e} setEinstellungen={setEinstellungen} schluessel={schluessel} />}
          {aktuell === "recherche" && <RechercheBereich profil={profil} e={e} setEinstellungen={setEinstellungen} />}
          {aktuell === "darstellung" && farben && <FarbschemaAbschnitt profil={profil} zugang={farben} />}
          {aktuell === "ueber" && <UeberAbschnitt />}
        </div>
      </div>
    </div>
  );
}
