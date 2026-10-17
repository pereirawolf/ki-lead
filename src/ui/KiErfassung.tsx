// KI-Erfassung (Modus A): Auftrag → S1 Gegenstand bestätigen → S2 Recherche und Entwurf → S3 Prüfung → Übergabe.

import { useEffect, useMemo, useRef, useState } from "react";
import { AnthropicAnbieter } from "../anbieter/anthropic";
import { formatUsd } from "../anbieter/preise";
import type { Fortschritt } from "../anbieter/typen";
import type { Meldung, Profil } from "../kern/typen";
import { sopKennung } from "../profil/sop";
import { dateiAnbieten } from "../speicher/speicher";
import { modellFuer, type Einstellungen } from "../pipeline/einstellungen";
import { ereignisarten, fachSops, sopsFuerArten } from "../pipeline/kontext";
import { laeufeLaden, laufLoeschen, laufSpeichern, neuerLauf, type Lauf, type S1Vorschlag } from "../pipeline/lauf";
import { dateiLesen, urlsAusText, type Material } from "../pipeline/material";
import { stufe1, stufe2und3, type Kontext } from "../pipeline/stufen";

interface Props {
  profil: Profil;
  einstellungen: Einstellungen;
  schluessel: string;
  zuEinstellungen: () => void;
  uebernehmen: (m: Meldung) => void;
}

type Phase = "auftrag" | "s1" | "bestaetigen" | "s2" | "ergebnis";

const PHASEN: { id: Phase; titel: string }[] = [
  { id: "auftrag", titel: "Auftrag und Material" },
  { id: "bestaetigen", titel: "Gegenstand bestätigen" },
  { id: "s2", titel: "Recherche und Entwurf" },
  { id: "ergebnis", titel: "Prüfung und Übergabe" },
];

function heute(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dauer(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}

function groesse(b: number): string {
  return b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

const STATUS_TEXT: Record<Lauf["status"], string> = {
  s1: "S1 läuft",
  bestaetigen: "wartet auf Bestätigung",
  s2: "S2 läuft",
  s3: "S3 läuft",
  fertig: "fertig",
  fehler: "Fehler",
  abgebrochen: "abgebrochen",
};

export function KiErfassung({ profil, einstellungen, schluessel, zuEinstellungen, uebernehmen }: Props) {
  const [phase, setPhase] = useState<Phase>("auftrag");
  const [sachverhalt, setSachverhalt] = useState("");
  const [stichworte, setStichworte] = useState("");
  const [urlText, setUrlText] = useState("");
  const [stichtag, setStichtag] = useState(heute());
  const [prueffrage, setPrueffrage] = useState("");
  const [material, setMaterial] = useState<Material[]>([]);
  const [dateiFehler, setDateiFehler] = useState<string[]>([]);
  const [datenOk, setDatenOk] = useState(false);
  const [lauf, setLauf] = useState<Lauf | null>(null);
  const [vorschlag, setVorschlag] = useState<S1Vorschlag | null>(null);
  const [protokoll, setProtokoll] = useState<{ zeit: number; text: string }[]>([]);
  const [zeichen, setZeichen] = useState(0);
  const [fehler, setFehler] = useState<string | null>(null);
  const [start, setStart] = useState(0);
  const [jetzt, setJetzt] = useState(Date.now());
  const [laeufe, setLaeufe] = useState<Lauf[]>([]);
  const abbruch = useRef<AbortController | null>(null);
  const dateiRef = useRef<HTMLInputElement>(null);

  const arten = useMemo(() => ereignisarten(profil), [profil]);
  const sops = useMemo(() => fachSops(profil), [profil]);
  const urls = urlsAusText(urlText);
  const laeuft = phase === "s1" || phase === "s2";

  const neuLaden = async () => setLaeufe((await laeufeLaden()).filter((l) => l.profil.id === profil.manifest.id));
  useEffect(() => {
    neuLaden();
  }, [profil]);

  useEffect(() => {
    if (!laeuft) return;
    const t = window.setInterval(() => setJetzt(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [laeuft]);

  const dateienHinzufuegen = async (liste: FileList | null) => {
    if (!liste) return;
    const neu: Material[] = [];
    const fehlerListe: string[] = [];
    for (const f of Array.from(liste)) {
      try {
        neu.push(await dateiLesen(f, profil));
      } catch (e) {
        fehlerListe.push((e as Error).message);
      }
    }
    setMaterial((alt) => [...alt, ...neu.filter((n) => !alt.some((a) => a.hash === n.hash))]);
    setDateiFehler(fehlerListe);
  };

  const fortschritt = (f: Fortschritt) => {
    if (f.art === "schreibt") {
      setZeichen(f.zeichen);
      return;
    }
    const text =
      f.art === "suche"
        ? `Websuche: „${f.text}“`
        : f.art === "abruf"
          ? `Seite abgerufen: ${f.text}`
          : f.art === "denkt"
            ? "Denkt nach …"
            : f.art === "fortsetzung"
              ? `Lange Recherche, Runde ${f.runde + 1} …`
              : `${f.grund} Neuer Versuch in ${Math.round(f.warteMs / 1000)} s.`;
    setProtokoll((p) => (p.length && p[p.length - 1].text === text ? p : [...p, { zeit: Date.now(), text }]));
  };

  const kontext = (l: Lauf): Kontext => {
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    return {
      profil,
      anbieter: new AnthropicAnbieter(schluessel),
      einstellungen,
      lauf: l,
      material,
      signal: ctrl.signal,
      aktualisiert: async (x) => {
        setLauf({ ...x });
        await laufSpeichern(x);
      },
      fortschritt,
    };
  };

  const fehlerBehandeln = async (l: Lauf, e: any) => {
    const abgebrochen = e?.name === "AbortError";
    l.status = abgebrochen ? "abgebrochen" : "fehler";
    l.fehler = abgebrochen ? "Von der Person abgebrochen." : String(e?.message || e);
    setLauf({ ...l });
    await laufSpeichern(l);
    setFehler(l.fehler);
    neuLaden();
  };

  const s1Starten = async () => {
    setFehler(null);
    const l = neuerLauf(
      profil,
      { sachverhalt, stichworte, urls: urls.gueltig, stichtag, prueffrage },
      material.map((m) => ({ name: m.name, art: m.art, groesse: m.groesse, hash: m.hash })),
    );
    setLauf(l);
    setProtokoll([]);
    setStart(Date.now());
    setPhase("s1");
    try {
      const v = await stufe1(kontext(l));
      setVorschlag(structuredClone(v));
      setPhase("bestaetigen");
    } catch (e) {
      await fehlerBehandeln(l, e);
      setPhase("auftrag");
    }
  };

  const s2Starten = async () => {
    if (!lauf || !vorschlag) return;
    setFehler(null);
    setProtokoll([]);
    setZeichen(0);
    setStart(Date.now());
    setPhase("s2");
    const l = lauf;
    try {
      await stufe2und3(kontext(l), vorschlag);
      setPhase("ergebnis");
    } catch (e) {
      await fehlerBehandeln(l, e);
      setPhase("ergebnis");
    }
    neuLaden();
  };

  const neuerAuftrag = () => {
    setPhase("auftrag");
    setLauf(null);
    setVorschlag(null);
    setFehler(null);
    setProtokoll([]);
  };

  const protokollExport = (l: Lauf) => dateiAnbieten(JSON.stringify(l, null, 2), `KI-LEAD_Lauf_${l.id}.json`, "application/json");

  const setzeSv = (i: number, teil: Partial<S1Vorschlag["sachverhalte"][number]>) => {
    if (!vorschlag) return;
    const sv = vorschlag.sachverhalte.map((s, j) => (j === i ? { ...s, ...teil } : s));
    setVorschlag({ ...vorschlag, sachverhalte: sv });
  };

  const artUmschalten = (i: number, art: string) => {
    if (!vorschlag) return;
    const s = vorschlag.sachverhalte[i];
    const an = !s.ereignisarten.includes(art);
    const neueArten = an ? [...s.ereignisarten, art] : s.ereignisarten.filter((a) => a !== art);
    const passend = sopsFuerArten(profil, [art]);
    const neueSops = an ? [...new Set([...s.sops, ...passend])] : s.sops.filter((x) => !passend.includes(x) || sopsFuerArten(profil, neueArten).includes(x));
    setzeSv(i, { ereignisarten: neueArten, sops: neueSops });
  };

  const aktivIndex = phase === "s1" ? 0 : PHASEN.findIndex((p) => p.id === phase);
  const kannStarten = !!schluessel && datenOk && (sachverhalt.trim() || stichworte.trim() || urls.gueltig.length || material.length);

  return (
    <div className="ki">
      <div className="werkzeugleiste">
        <div className="werkzeugleiste-text">
          <h1>KI-Erfassung</h1>
          <p>
            Gestufter Entwurf einer Meldung nach LEAD: Gegenstand klären, recherchieren, prüfen. Das Ergebnis ist ein Entwurf, den du in der Meldungsmaske
            prüfst und freigibst.
          </p>
        </div>
        {lauf && phase !== "auftrag" && !laeuft && (
          <div className="werkzeugleiste-knoepfe">
            <button type="button" className="knopf leise" onClick={neuerAuftrag}>
              Neuer Auftrag
            </button>
          </div>
        )}
      </div>

      {!schluessel && (
        <div className="kasten kasten-hinweis" role="status">
          <p>Für die KI-Erfassung brauchst du einen eigenen API-Schlüssel von Anthropic.</p>
          <button type="button" className="knopf klein" onClick={zuEinstellungen}>
            Zu den Einstellungen
          </button>
        </div>
      )}

      <div className="arbeitsbereich">
        <nav className="schritte" aria-label="Stufen">
          <ol>
            {PHASEN.map((p, i) => (
              <li key={p.id}>
                <div
                  className={i === aktivIndex ? "schritt aktiv" : i < aktivIndex ? "schritt erledigt" : "schritt"}
                  aria-current={i === aktivIndex ? "step" : undefined}
                >
                  <span className="schritt-nr">{i + 1}</span>
                  <span className="schritt-titel">{p.titel}</span>
                </div>
              </li>
            ))}
          </ol>
        </nav>

        <section className="schritt-inhalt">
          {phase === "auftrag" && (
            <>
              <h2>Auftrag und Material</h2>
              <p className="einleitung">
                Beschreibe, was geklärt werden soll, und gib vorhandenes Material mit. Ohne Material recherchiert die KI selbst in offenen Quellen.
              </p>
              {fehler && (
                <div className="kasten kasten-fehler" role="alert">
                  <p>{fehler}</p>
                </div>
              )}
              <label className="feld feld-lang">
                <span className="feld-label">Sachverhalt und Erkenntnisinteresse</span>
                <textarea
                  rows={3}
                  value={sachverhalt}
                  onChange={(e) => setSachverhalt(e.target.value)}
                  placeholder="z. B. Folgen des Orkantiefs „Ilka“ für Strom- und Bahnversorgung im Referenzraum"
                />
              </label>
              <label className="feld feld-lang">
                <span className="feld-label">Stichworte</span>
                <textarea rows={4} value={stichworte} onChange={(e) => setStichworte(e.target.value)} placeholder="Eigene Notizen, Zahlen, Beobachtungen" />
              </label>
              <label className="feld feld-lang">
                <span className="feld-label">URLs (eine je Zeile)</span>
                <textarea rows={3} value={urlText} onChange={(e) => setUrlText(e.target.value)} placeholder="https://…" />
                {urls.ungueltig.length > 0 && <span className="fehlertext">Keine gültige Adresse: {urls.ungueltig.join(", ")}</span>}
              </label>
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
                    dateienHinzufuegen(e.target.files);
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
                          {m.art === "meldung" ? "Vormeldung" : m.art.toUpperCase()} · {groesse(m.groesse)}
                          {m.hinweis ? ` · ${m.hinweis}` : ""}
                        </span>
                        <button type="button" className="knopf leise klein" onClick={() => setMaterial((a) => a.filter((x) => x.id !== m.id))}>
                          Entfernen
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="gruppe-spalten-zwei">
                <label className="feld">
                  <span className="feld-label">Meldestichtag</span>
                  <input type="date" value={stichtag} onChange={(e) => setStichtag(e.target.value)} />
                </label>
                <label className="feld">
                  <span className="feld-label">Besondere Prüffrage (optional)</span>
                  <input type="text" value={prueffrage} onChange={(e) => setPrueffrage(e.target.value)} />
                </label>
              </div>
              <label className="bestaetigung">
                <input type="checkbox" checked={datenOk} onChange={(e) => setDatenOk(e.target.checked)} />
                <span>
                  Ich gebe nur fiktive oder offen zugängliche Inhalte weiter, keine personenbezogenen und keine eingestuften Daten. Die Inhalte gehen an
                  Anthropic.
                </span>
              </label>
              <p className="hinweis">
                S1 mit {modellFuer("vorverarbeitung", einstellungen, profil)}, S2 mit {modellFuer("erfassung", einstellungen, profil)} und bis zu{" "}
                {einstellungen.websucheMax} Websuchen. Ein Lauf kostet je nach Umfang meist einige Cent bis etwa einen US-Dollar.
              </p>
              <div className="schritt-nav">
                <span />
                <button type="button" className="knopf primaer" disabled={!kannStarten} onClick={s1Starten}>
                  Gegenstand bestimmen (S1)
                </button>
              </div>
            </>
          )}

          {laeuft && (
            <div className="laeuft" aria-live="polite">
              <h2>
                {phase === "s1"
                  ? "Stufe S1: Gegenstand und SOP-Auswahl"
                  : lauf?.status === "s3"
                    ? "Stufe S3: Prüfung und Reparatur"
                    : "Stufe S2: Recherche und Entwurf"}
              </h2>
              <p className="einleitung">
                {phase === "s1"
                  ? "Die KI ordnet den Auftrag ein. Das dauert meist unter einer Minute."
                  : "Die KI recherchiert und schreibt den Entwurf. Das dauert meist zwei bis sechs Minuten. Bitte die App geöffnet lassen."}
              </p>
              <div className="laufanzeige">
                <span className="puls" aria-hidden="true" />
                <span>
                  {dauer(jetzt - start)}
                  {zeichen > 0 ? ` · ${zeichen.toLocaleString("de-DE")} Zeichen geschrieben` : ""}
                  {lauf?.kostenUsd ? ` · bisher ${formatUsd(lauf.kostenUsd)}` : ""}
                </span>
              </div>
              {protokoll.length > 0 && (
                <ol className="ereignisse">
                  {protokoll.slice(-14).map((p, i) => (
                    <li key={i}>
                      <time>{new Date(p.zeit).toLocaleTimeString("de-DE")}</time> {p.text}
                    </li>
                  ))}
                </ol>
              )}
              <div className="schritt-nav">
                <span />
                <button type="button" className="knopf" onClick={() => abbruch.current?.abort()}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {phase === "bestaetigen" && vorschlag && (
            <>
              <h2>Gegenstand bestätigen</h2>
              <p className="einleitung">
                Vorschlag aus Stufe S1. Prüfe Gliederung, Ereignisarten und SOPs und korrigiere sie bei Bedarf. Erst danach beginnt die Recherche.
              </p>
              {vorschlag.hinweise && (
                <div className="kasten kasten-info">
                  <h3>Hinweise aus S1</h3>
                  <p>{vorschlag.hinweise}</p>
                </div>
              )}
              <label className="feld feld-lang">
                <span className="feld-label">Gegenstand</span>
                <textarea rows={3} value={vorschlag.gegenstand} onChange={(e) => setVorschlag({ ...vorschlag, gegenstand: e.target.value })} />
              </label>
              <div className="gruppe-spalten-zwei">
                <label className="feld">
                  <span className="feld-label">Stichtag</span>
                  <input type="date" value={vorschlag.stichtag} onChange={(e) => setVorschlag({ ...vorschlag, stichtag: e.target.value })} />
                </label>
                <label className="feld">
                  <span className="feld-label">Betrachtungshorizont</span>
                  <input type="text" value={vorschlag.horizont} onChange={(e) => setVorschlag({ ...vorschlag, horizont: e.target.value })} />
                </label>
              </div>
              <label className="feld">
                <span className="feld-label">Bezug zum Referenzraum</span>
                <input type="text" value={vorschlag.referenzbezug} onChange={(e) => setVorschlag({ ...vorschlag, referenzbezug: e.target.value })} />
              </label>
              <label className="feld">
                <span className="feld-label">Besondere Prüffrage</span>
                <input type="text" value={vorschlag.prueffrage} onChange={(e) => setVorschlag({ ...vorschlag, prueffrage: e.target.value })} />
              </label>

              <div className="liste">
                {vorschlag.sachverhalte.map((s, i) => (
                  <div key={i} className="element">
                    <div className="element-kopf">
                      <h3>
                        <span className="element-nr">Sachverhalt {i + 1}</span>
                      </h3>
                      {vorschlag.sachverhalte.length > 1 && (
                        <button
                          type="button"
                          className="knopf leise klein"
                          onClick={() => setVorschlag({ ...vorschlag, sachverhalte: vorschlag.sachverhalte.filter((_, j) => j !== i) })}
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                    <label className="feld">
                      <span className="feld-label">Titel</span>
                      <input type="text" value={s.titel} onChange={(e) => setzeSv(i, { titel: e.target.value })} />
                    </label>
                    {s.begruendung && <p className="hinweis">Begründung S1: {s.begruendung}</p>}
                    <fieldset className="feld">
                      <legend className="feld-label">Ereignisarten</legend>
                      <div className="mehrfach">
                        {arten.map((a) => (
                          <label key={a} className={s.ereignisarten.includes(a) ? "chip an" : "chip"}>
                            <input type="checkbox" checked={s.ereignisarten.includes(a)} onChange={() => artUmschalten(i, a)} />
                            {a}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className="feld">
                      <legend className="feld-label">SOPs für die Recherche</legend>
                      <div className="mehrfach">
                        {sops.map((x) => (
                          <label key={x.id} className={s.sops.includes(x.id) ? "chip an" : "chip"}>
                            <input
                              type="checkbox"
                              checked={s.sops.includes(x.id)}
                              onChange={() => setzeSv(i, { sops: s.sops.includes(x.id) ? s.sops.filter((y) => y !== x.id) : [...s.sops, x.id] })}
                            />
                            {sopKennung(x).replace(/^SOP-LEAD /, "")}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                ))}
              </div>
              <div className="aktionen">
                <button
                  type="button"
                  className="knopf leise"
                  onClick={() =>
                    setVorschlag({ ...vorschlag, sachverhalte: [...vorschlag.sachverhalte, { titel: "", ereignisarten: [], sops: [], begruendung: "" }] })
                  }
                >
                  Sachverhalt hinzufügen
                </button>
              </div>
              <p className="hinweis">
                Kosten S1: {formatUsd(lauf?.kostenUsd)}. S2 recherchiert mit bis zu {einstellungen.websucheMax} Websuchen.
              </p>
              <div className="schritt-nav">
                <button type="button" className="knopf leise" onClick={() => setPhase("auftrag")}>
                  Zurück zum Auftrag
                </button>
                <button type="button" className="knopf primaer" onClick={s2Starten} disabled={!vorschlag.sachverhalte.length}>
                  Bestätigen und recherchieren (S2)
                </button>
              </div>
            </>
          )}

          {phase === "ergebnis" && lauf && (
            <Ergebnis
              lauf={lauf}
              fehler={fehler}
              uebernehmen={uebernehmen}
              exportieren={() => protokollExport(lauf)}
              erneut={vorschlag ? s2Starten : undefined}
            />
          )}
        </section>
      </div>

      {laeufe.length > 0 && (
        <details className="frueher">
          <summary>Frühere Läufe mit diesem Profil ({laeufe.length})</summary>
          <table className="tabelle">
            <thead>
              <tr>
                <th>Beginn</th>
                <th>Gegenstand</th>
                <th>Status</th>
                <th>Kosten</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {laeufe.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.erstellt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>{l.bestaetigt?.gegenstand || l.vorschlag?.gegenstand || l.auftrag.sachverhalt || "–"}</td>
                  <td>{STATUS_TEXT[l.status]}</td>
                  <td>{formatUsd(l.kostenUsd)}</td>
                  <td className="tabelle-aktionen">
                    {l.ergebnis && (
                      <button type="button" className="knopf klein" onClick={() => uebernehmen(l.ergebnis!.meldung)}>
                        Übernehmen
                      </button>
                    )}
                    <button type="button" className="knopf leise klein" onClick={() => protokollExport(l)}>
                      Protokoll
                    </button>
                    <button
                      type="button"
                      className="knopf leise klein"
                      onClick={async () => {
                        if (confirm("Diesen Lauf mit Protokoll löschen?")) {
                          await laufLoeschen(l.id);
                          neuLaden();
                        }
                      }}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

function Ergebnis({
  lauf,
  fehler,
  uebernehmen,
  exportieren,
  erneut,
}: {
  lauf: Lauf;
  fehler: string | null;
  uebernehmen: (m: Meldung) => void;
  exportieren: () => void;
  erneut?: () => void;
}) {
  const e = lauf.ergebnis;
  const s2 = lauf.stufen.find((s) => s.stufe.startsWith("S2"));
  return (
    <>
      <h2>Prüfung und Übergabe</h2>
      {e ? (
        <div className={e.schemakonform ? "kasten kasten-ok" : "kasten kasten-hinweis"} role="status">
          <p>
            {e.schemakonform
              ? "Der Entwurf entspricht dem Schema. Übernimm ihn in die Meldungsmaske, prüfe Inhalte, Radar und Quellen und gib ihn dort frei."
              : "Der Entwurf weicht auch nach zwei Reparaturen noch vom Schema ab. Du kannst ihn übernehmen und die markierten Stellen in der Maske korrigieren."}
          </p>
        </div>
      ) : (
        <div className="kasten kasten-fehler" role="alert">
          <p>{fehler || lauf.fehler || "Kein verwertbares Ergebnis."}</p>
        </div>
      )}
      {s2?.notiz && <p className="fehlertext">{s2.notiz}</p>}

      {e?.kurzantwort && (
        <div className="ki-abschnitt">
          <h3>Kurzantwort der KI</h3>
          <p className="kurzantwort">{e.kurzantwort}</p>
        </div>
      )}

      {e && e.befunde.length > 0 && (
        <div className="ki-abschnitt">
          <h3>Hinweise zur Prüfung</h3>
          <ul className="befunde">
            {e.befunde.map((b, i) => (
              <li key={i} className={`befund befund-${b.stufe}`}>
                <span className="befund-stufe">{b.stufe === "fehler" ? "Fehler" : b.stufe === "warnung" ? "Warnung" : "Hinweis"}</span> {b.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {e && (e.suchen.length > 0 || e.fundstellen.length > 0) && (
        <details className="ki-abschnitt">
          <summary>
            Recherche: {e.suchen.length} {e.suchen.length === 1 ? "Suche" : "Suchen"}, {e.fundstellen.length}{" "}
            {e.fundstellen.length === 1 ? "Fundstelle" : "Fundstellen"}
          </summary>
          {e.suchen.length > 0 && <p className="hinweis">Suchbegriffe: {e.suchen.map((s) => `„${s}“`).join(", ")}</p>}
          <ul className="fundstellen">
            {e.fundstellen.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {f.titel}
                </a>
                {f.stand ? <span className="material-meta"> · {f.stand}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      <details className="ki-abschnitt">
        <summary>Laufprotokoll: {formatUsd(lauf.kostenUsd)} gesamt</summary>
        <table className="tabelle">
          <thead>
            <tr>
              <th>Stufe</th>
              <th>Modell</th>
              <th>Token ein / aus</th>
              <th>Dauer</th>
              <th>Kosten</th>
            </tr>
          </thead>
          <tbody>
            {lauf.stufen.map((s, i) => (
              <tr key={i}>
                <td>
                  {s.stufe}
                  {s.fehler ? ` (${s.fehler})` : ""}
                </td>
                <td>{s.modell}</td>
                <td>
                  {s.nutzung
                    ? `${(s.nutzung.eingabe + s.nutzung.cacheLesen + s.nutzung.cacheSchreiben).toLocaleString("de-DE")} / ${s.nutzung.ausgabe.toLocaleString("de-DE")}`
                    : "–"}
                </td>
                <td>{s.dauerMs ? dauer(s.dauerMs) : "–"}</td>
                <td>{formatUsd(s.kostenUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hinweis">Lauf {lauf.id}. Kosten sind eine Schätzung nach Listenpreisen; maßgeblich ist die Abrechnung des Anbieters.</p>
      </details>

      <div className="schritt-nav">
        <div className="aktionen">
          <button type="button" className="knopf leise" onClick={exportieren}>
            Laufprotokoll exportieren
          </button>
          {!e && erneut && (
            <button type="button" className="knopf" onClick={erneut}>
              S2 erneut starten
            </button>
          )}
        </div>
        {e && (
          <button type="button" className="knopf primaer" onClick={() => uebernehmen(e.meldung)}>
            In die Meldungsmaske übernehmen
          </button>
        )}
      </div>
    </>
  );
}
