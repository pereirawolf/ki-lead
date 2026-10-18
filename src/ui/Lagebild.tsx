// Modul Lagebild: Meldungen mehrerer Stellen einlesen, prüfen, gemeinsam auswerten und ausgeben.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Meldung, Profil } from "../kern/typen";
import { holeWert } from "../kern/pfad";
import { bezeichnung, feldUi, istEigeneStelle, radarFuer, radarZeilen } from "../kern/ui";
import { parseQuellen } from "../kern/quellen";
import { datumDE, heuteDE, jetztLokal } from "../kern/ausgabe";
import { kennsatz } from "../kern/kennsaetze";
import {
  absender,
  alleSachverhalte,
  beispielDateien,
  dateienAusAuswahl,
  einlesen,
  erinnerungMailto,
  farbeBeurteilung,
  farbeTendenz,
  inhaltsKennung,
  inTagen,
  istPlatzhalterAdresse,
  kennzahlen,
  meldestatus,
  nachSchwere,
  statusVon,
  stelleVon,
  svKennung,
  zaehle,
  zeitpunktVon,
  type Farbe,
  type LagebildDatei,
  type LagebildEintrag,
  type LagebildFehler,
  type SvEintrag,
} from "../lagebild/lagebild";
import { redaktionscheck, type Klasse } from "../lagebild/redaktion";
import { alsCsv, html as esc, kopiervorlageHtml, kopiervorlageText, rohtabelle } from "../lagebild/ausgabe";
import { dateiAnbieten, lagebildLesen, lagebildSchreiben } from "../speicher/speicher";
import { lagebildAlsPdf } from "../dokumente/pdf";
import { RadarGrafik } from "./Radar";
import { radarPng } from "./radarBild";

interface Props {
  profil: Profil;
  uebergeben: (dateien: LagebildDatei[]) => void;
  oeffnen: (m: Meldung) => void;
}

type Reiter = "uebersicht" | "meldungen" | "sachverhalte" | "radar" | "tabelle" | "redaktion" | "kopiervorlage";

const REITER: { id: Reiter; titel: string }[] = [
  { id: "uebersicht", titel: "Übersicht" },
  { id: "meldungen", titel: "Meldungen" },
  { id: "sachverhalte", titel: "Sachverhalte" },
  { id: "radar", titel: "Lagenradar" },
  { id: "redaktion", titel: "Redaktionscheck" },
  { id: "kopiervorlage", titel: "Kopiervorlage" },
  { id: "tabelle", titel: "Rohtabelle" },
];

function Marke({ farbe, children }: { farbe: Farbe | "amt"; children: ReactNode }) {
  return <span className={`lb-marke lb-${farbe}`}>{children}</span>;
}

function Balken({ titel, werte, farbe }: { titel: string; werte: [string, number][]; farbe?: (w: string) => Farbe }) {
  if (!werte.length) return null;
  const max = Math.max(...werte.map((w) => w[1]));
  return (
    <div className="lb-balken">
      <h4>{titel}</h4>
      {werte.map(([label, n]) => (
        <div key={label} className="lb-balken-zeile">
          <span className="lb-balken-label" title={label}>
            {label}
          </span>
          <span className="lb-balken-spur">
            <span className={`lb-balken-wert lb-${farbe ? farbe(label) : "amt"}`} style={{ width: `${Math.round((n / max) * 100)}%` }} />
          </span>
          <span className="lb-balken-zahl">{n}</span>
        </div>
      ))}
    </div>
  );
}

async function kopieren(htmlText: string, klartext: string): Promise<boolean> {
  try {
    if (navigator.clipboard && "ClipboardItem" in window) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([`<html><body>${htmlText}</body></html>`], { type: "text/html" }),
          "text/plain": new Blob([klartext], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(klartext);
    return true;
  } catch {
    return false;
  }
}

function KopierKnopf({ html, text, titel = "Kopieren" }: { html: string; text: string; titel?: string }) {
  const [stand, setStand] = useState<"" | "ok" | "fehler">("");
  return (
    <button
      type="button"
      className={stand === "ok" ? "knopf klein lb-kopiert" : "knopf klein"}
      onClick={async () => {
        setStand((await kopieren(html, text)) ? "ok" : "fehler");
        setTimeout(() => setStand(""), 2000);
      }}
    >
      {stand === "ok" ? "Kopiert" : stand === "fehler" ? "Kopieren nicht möglich – bitte markieren" : titel}
    </button>
  );
}

function Abschnitt({ nr, titel, verweis, children }: { nr: number; titel: string; verweis?: string; children: ReactNode }) {
  return (
    <section className="lb-abschnitt">
      <h3 className="abschnitt">
        {nr} · {titel}
        {verweis && <span className="lb-verweis"> ({verweis})</span>}
      </h3>
      {children}
    </section>
  );
}

function Punkt({ klasse, marke, titel, children }: { klasse: Klasse | ""; marke?: string; titel: string; children?: ReactNode }) {
  return (
    <div className={`lb-punkt lb-punkt-${klasse || "leer"}`}>
      {marke && <span className={`lb-flag lb-flag-${klasse || "info"}`}>{marke}</span>}
      <p className="lb-punkt-titel">{titel}</p>
      {children && <div className="lb-punkt-text">{children}</div>}
    </div>
  );
}

export function LagebildAnsicht({ profil, uebergeben, oeffnen }: Props) {
  const ui = profil.ui;
  const r = ui.rollen;
  const lb = ui.lagebild || {};
  const titel = lb.titel || "Lagebild";
  const [dateien, setDateien] = useState<LagebildDatei[]>([]);
  const [ausgabe, setAusgabe] = useState(inTagen(lb.ausgabe_tage ?? 7));
  const [reiter, setReiter] = useState<Reiter>("uebersicht");
  const [importFehler, setImportFehler] = useState<LagebildFehler[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [ziehen, setZiehen] = useState(false);
  const [speicherFehler, setSpeicherFehler] = useState<string | null>(null);
  const eingabe = useRef<HTMLInputElement>(null);

  useEffect(() => {
    lagebildLesen(profil.manifest.id).then((s) => {
      if (s?.dateien) setDateien(s.dateien);
      if (s?.naechsteAusgabe) setAusgabe(s.naechsteAusgabe);
      setGeladen(true);
    });
  }, [profil.manifest.id]);

  useEffect(() => {
    if (geladen)
      lagebildSchreiben(profil.manifest.id, { dateien, naechsteAusgabe: ausgabe })
        .then(() => setSpeicherFehler(null))
        .catch((e) => setSpeicherFehler(`Der Stand des Lagebilds konnte nicht im Gerät gespeichert werden (${(e as Error).message || "Speicherfehler"}).`));
  }, [dateien, ausgabe, geladen, profil.manifest.id]);

  const { eintraege, fehler: lesefehler } = useMemo(() => einlesen(dateien, profil), [dateien, profil]);
  const svs = useMemo(() => alleSachverhalte(eintraege, profil), [eintraege, profil]);
  const kz = useMemo(() => kennzahlen(eintraege, profil), [eintraege, profil]);
  const status = useMemo(() => meldestatus(eintraege, profil), [eintraege, profil]);
  const ausgabeDatum = useMemo(() => new Date(`${ausgabe}T00:00`), [ausgabe]);
  const red = useMemo(() => redaktionscheck(eintraege, profil, ausgabeDatum), [eintraege, profil, ausgabeDatum]);
  const sortiert = useMemo(() => nachSchwere(svs, profil), [svs, profil]);

  const radarFeld = r.sv_radar ? feldUi(ui, `${r.sachverhalte}[].${r.sv_radar}`) : undefined;
  const radarDef = radarFeld ? radarFuer(ui, radarFeld) : undefined;
  const lBeurteilung = r.sv_beurteilung ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_beurteilung}`) : "Beurteilung";
  const lTendenz = r.sv_tendenz ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_tendenz}`) : "Tendenz";
  const ks = ui.kennsaetze || {};
  const v = lb.verweise || {};

  const hinzufuegen = (neu: LagebildDatei[]) => {
    setDateien((alt) => {
      const ids = new Set(alt.map((d) => inhaltsKennung(d.text)));
      return [...alt, ...neu.filter((d) => !ids.has(inhaltsKennung(d.text)))];
    });
  };

  const auswahl = async (liste: FileList | File[] | null) => {
    if (!liste || !liste.length) return;
    const erg = await dateienAusAuswahl(Array.from(liste));
    hinzufuegen(erg.dateien);
    setImportFehler(erg.fehler);
  };

  const entfernen = (id: string) => setDateien((alt) => alt.filter((d) => inhaltsKennung(d.text) !== id));
  const alleEntfernen = () => {
    if (confirm(`Alle ${dateien.length} Dateien aus dem ${titel} entfernen? Die Dateien selbst bleiben unberührt.`)) setDateien([]);
  };

  const eigen = (e: LagebildEintrag) => !e.fremd && istEigeneStelle(stelleVon(e, profil), profil.manifest);
  const dateiZu = (e: LagebildEintrag) => dateien.find((d) => inhaltsKennung(d.text) === e.id);

  const [uebergabeWahl, setUebergabeWahl] = useState<Set<string> | null>(null);
  const anKi = () => setUebergabeWahl(new Set(eintraege.filter((e) => !eigen(e)).map((e) => e.id)));
  const uebergabeStarten = () => {
    const liste = eintraege
      .filter((e) => uebergabeWahl?.has(e.id))
      .map(dateiZu)
      .filter(Boolean) as LagebildDatei[];
    if (!liste.length) return;
    setUebergabeWahl(null);
    uebergeben(liste);
  };

  const csv = () =>
    dateiAnbieten(
      alsCsv(rohtabelle(eintraege, profil)),
      `${titel}_${jetztLokal(profil.manifest.variablen.zeitzone).slice(0, 10)}.csv`,
      "text/csv;charset=utf-8",
    );

  const pdf = () => {
    const kopf = ["Meldung", "Sachverhalt", lBeurteilung, ...(r.sv_tendenz ? [lTendenz] : []), ...(ks.handlungsrelevant ? ["Handlungsrelevant bis"] : [])];
    const zeilen = sortiert.map((s) => [
      absender(s.eintrag, profil),
      s.bezeichnung || "(ohne Bezeichnung)",
      s.beurteilung || "keine Angabe",
      ...(r.sv_tendenz ? [s.tendenz || "keine Angabe"] : []),
      ...(ks.handlungsrelevant ? [kennsatz(s.bewertungText, ks.handlungsrelevant) || ""] : []),
    ]);
    const meldungen = eintraege
      .filter((e) => !e.fremd)
      .map((e) => ({
        daten: e.daten,
        titel: absender(e, profil),
        zusatz: [
          ["Quelldatei", e.name],
          ["Schemaprüfung", e.schema.length ? `${e.schema.length} Abweichung(en)` : "ohne Befund"],
        ],
      }));
    dateiAnbieten(
      lagebildAlsPdf(profil, titel, [kopf, ...zeilen], meldungen, heuteDE()),
      `${titel}_${jetztLokal(profil.manifest.variablen.zeitzone).slice(0, 10)}.pdf`,
      "application/pdf",
    );
  };

  const marken = (e: LagebildEintrag) => (
    <>
      {e.fremd ? (
        <Marke farbe="grau">fremdes Schema</Marke>
      ) : e.schema.length ? (
        <Marke farbe="rot">Schema: {e.schema.length}</Marke>
      ) : (
        <Marke farbe="gruen">Schema ✓</Marke>
      )}
      {e.hinweise.length > 0 && <Marke farbe="orange">migriert</Marke>}
      {eigen(e) && <Marke farbe="amt">eigene Meldung</Marke>}
      {!e.fremd && statusVon(e, profil) === r.status_entwurf && <Marke farbe="gelb">{r.status_entwurf}</Marke>}
      {r.entstehung_feld && holeWert(e.daten, [r.entstehung_feld, "verfahren"]) === "KI-Entwurf" && <Marke farbe="grau">KI-Entwurf</Marke>}
    </>
  );

  const svMarken = (s: SvEintrag) => (
    <span className="lb-svmarken">
      {r.sv_beurteilung && <Marke farbe={farbeBeurteilung(profil, s.beurteilung)}>{s.beurteilung || "keine Angabe"}</Marke>}
      {r.sv_tendenz && <Marke farbe={farbeTendenz(profil, s.tendenz)}>{s.tendenz || "keine Angabe"}</Marke>}
    </span>
  );

  const beispiele = profil.manifest.beispiele || [];
  const fehlerListe = [...importFehler, ...lesefehler];

  return (
    <div className="lagebild">
      <div className="werkzeugleiste">
        <div className="werkzeugleiste-text">
          <h1>{titel}</h1>
          <p>
            Meldungen mehrerer Stellen zusammenführen und prüfen: Übersicht, Meldestatus, Lagenradar je Sachverhalt, Redaktionscheck und Ausgabe. Die Daten
            bleiben auf diesem Gerät.
          </p>
        </div>
      </div>

      <section
        className={ziehen ? "lb-ablage lb-ablage-aktiv" : "lb-ablage"}
        onDragOver={(e) => {
          e.preventDefault();
          setZiehen(true);
        }}
        onDragLeave={() => setZiehen(false)}
        onDrop={(e) => {
          e.preventDefault();
          setZiehen(false);
          auswahl(e.dataTransfer.files);
        }}
      >
        <p>
          <strong>Meldungen hier ablegen</strong> (JSON-Dateien oder ZIP-Archive)
        </p>
        <div className="aktionen">
          <button type="button" className="knopf primaer" onClick={() => eingabe.current?.click()}>
            Dateien wählen
          </button>
          {beispiele.map((b) => (
            <button key={b.ordner} type="button" className="knopf" title={b.hinweis} onClick={() => hinzufuegen(beispielDateien(profil, b.ordner))}>
              Beispiel laden: {b.titel}
            </button>
          ))}
        </div>
        <input
          ref={eingabe}
          type="file"
          multiple
          hidden
          accept=".json,.zip,application/json,application/zip"
          onChange={(e) => {
            auswahl(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="hinweis">
          Jede Datei wird nach dem Profil {profil.manifest.name} migriert und gegen das Schema {profil.manifest.meldung.schema_id} geprüft. Meldungen in fremdem
          Schema werden erkannt, aber nur für die KI-Verdichtung vorgehalten. Gleiche Dateiinhalte werden nur einmal geführt.
        </p>
      </section>

      {speicherFehler && (
        <div className="kasten kasten-fehler" role="alert">
          <p>{speicherFehler}</p>
        </div>
      )}

      {fehlerListe.length > 0 && (
        <div className="kasten kasten-fehler">
          <h3>Nicht eingelesen</h3>
          <ul>
            {fehlerListe.map((f, i) => (
              <li key={i}>
                {f.name}: {f.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {eintraege.length === 0 ? (
        <p className="leer">Noch keine Meldungen geladen.</p>
      ) : (
        <>
          <div className="lb-leiste">
            <p className="lb-zahl">
              {kz.meldungen} Meldung{kz.meldungen === 1 ? "" : "en"}
              {kz.fremd ? ` und ${kz.fremd} in fremdem Schema` : ""} · {kz.sachverhalte} Sachverhalt{kz.sachverhalte === 1 ? "" : "e"}
            </p>
            <div className="werkzeugleiste-knoepfe">
              <button type="button" className="knopf" onClick={pdf} disabled={!kz.meldungen}>
                PDF
              </button>
              <button type="button" className="knopf" onClick={csv} disabled={!kz.meldungen}>
                CSV
              </button>
              <button type="button" className="knopf primaer" onClick={anKi}>
                An KI-Verdichtung übergeben
              </button>
              <button type="button" className="knopf leise" onClick={alleEntfernen}>
                Alle entfernen
              </button>
            </div>
          </div>
          {uebergabeWahl && (
            <div className="kasten kasten-info lb-uebergabe">
              <h3>An die KI-Verdichtung übergeben</h3>
              <p>
                Ausgewählte Meldungen gehen als Material in die KI-Erfassung. Meldungen anderer Stellen werden verdichtet; eine eigene Meldung gilt dort als
                Vormeldung und wird fortgeschrieben. Für einen Vergleich mit einer vorhandenen eigenen Fassung diese hier abwählen.
              </p>
              <ul className="lb-auswahl">
                {eintraege.map((e) => (
                  <li key={e.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={uebergabeWahl.has(e.id)}
                        onChange={(ev) => {
                          const neu = new Set(uebergabeWahl);
                          if (ev.target.checked) neu.add(e.id);
                          else neu.delete(e.id);
                          setUebergabeWahl(neu);
                        }}
                      />
                      <span>
                        {absender(e, profil)} <span className="material-meta">({datumDE(zeitpunktVon(e, profil)) || e.name})</span>
                      </span>
                      {marken(e)}
                    </label>
                  </li>
                ))}
              </ul>
              <div className="aktionen">
                <button type="button" className="knopf primaer" disabled={!uebergabeWahl.size} onClick={uebergabeStarten}>
                  {uebergabeWahl.size} Meldung{uebergabeWahl.size === 1 ? "" : "en"} übergeben
                </button>
                <button type="button" className="knopf leise" onClick={() => setUebergabeWahl(null)}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}
          <details className="lb-dateiliste" open={eintraege.length <= 4}>
            <summary>
              Dateien ({eintraege.length}){kz.schemaAbweichungen ? ` · ${kz.schemaAbweichungen} mit Schemaabweichung` : ""}
            </summary>
            <ul className="lb-dateien">
              {eintraege.map((e) => (
                <li key={e.id} title={e.schema.map((b) => b.text).join("\n") || undefined}>
                  <span className="lb-datei-name">{e.name}</span>
                  {marken(e)}
                  <button type="button" className="lb-x" aria-label={`${e.name} entfernen`} onClick={() => entfernen(e.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <nav className="lb-reiter" aria-label="Ansichten">
            {REITER.map((t) => (
              <button
                key={t.id}
                type="button"
                className={reiter === t.id ? "segment aktiv" : "segment"}
                aria-pressed={reiter === t.id}
                onClick={() => setReiter(t.id)}
              >
                {t.titel}
                {t.id === "redaktion" && red.anzahl > 0 && <span className="lb-zaehler">{red.anzahl}</span>}
              </button>
            ))}
          </nav>

          {reiter === "uebersicht" && (
            <div>
              <div className="lb-kennzahlen">
                <div className="lb-kennzahl">
                  <b>{kz.meldungen}</b>
                  <span>Meldungen</span>
                </div>
                <div className="lb-kennzahl">
                  <b>{kz.sachverhalte}</b>
                  <span>Sachverhalte</span>
                </div>
                {kz.hoch.map((h) => (
                  <div key={h.stufe} className={h.anzahl ? `lb-kennzahl lb-rand-${h.farbe}` : "lb-kennzahl"}>
                    <b>{h.anzahl}</b>
                    <span>
                      {lBeurteilung}: {h.stufe}
                    </span>
                  </div>
                ))}
                {kz.verschaerfung && (
                  <div className={kz.verschaerfung.anzahl ? "lb-kennzahl lb-rand-rot" : "lb-kennzahl"}>
                    <b>{kz.verschaerfung.anzahl}</b>
                    <span>
                      {lTendenz}: {kz.verschaerfung.wert}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className={red.anzahl ? "lb-kennzahl lb-rand-orange" : "lb-kennzahl lb-rand-gruen"}
                  onClick={() => setReiter("redaktion")}
                >
                  <b>{red.anzahl}</b>
                  <span>Redaktionshinweise →</span>
                </button>
                <button
                  type="button"
                  className={kz.schemaAbweichungen ? "lb-kennzahl lb-rand-rot" : "lb-kennzahl lb-rand-gruen"}
                  onClick={() => setReiter("redaktion")}
                >
                  <b>{kz.schemaAbweichungen}</b>
                  <span>Meldungen mit Schemaabweichung →</span>
                </button>
              </div>

              {status && (
                <>
                  <h3 className="abschnitt">
                    Meldestatus ({status.zeilen.filter((z) => z.eintraege.length).length} von {status.zeilen.length} gemeldet)
                  </h3>
                  <ul className="lb-status">
                    {status.zeilen.map((z) => (
                      <li key={z.name} className={z.eintraege.length ? "lb-status-da" : "lb-status-offen"}>
                        <span className="lb-status-zeichen" aria-hidden="true">
                          {z.eintraege.length ? "✓" : "○"}
                        </span>
                        <span className="lb-status-name">{z.name}</span>
                        {z.eintraege.length > 0 && (
                          <span
                            className="lb-status-zahl"
                            title={z.eintraege.map((e) => `${absender(e, profil)} (${datumDE(zeitpunktVon(e, profil))})`).join("\n")}
                          >
                            {z.eintraege.length} Meldung{z.eintraege.length === 1 ? "" : "en"}
                          </span>
                        )}
                        {!z.eintraege.length && (
                          <a
                            className="knopf klein"
                            href={erinnerungMailto(z, profil.kontakte)}
                            title={
                              istPlatzhalterAdresse(z.email)
                                ? "Platzhalteradresse – echte Adressen in kontakte.lokal.json des Profils hinterlegen"
                                : `Erinnerung an ${z.email}`
                            }
                          >
                            Erinnern
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                  {status.weitere.length > 0 && (
                    <p className="hinweis">Weitere Meldungen ohne Eintrag in der Kontaktliste: {status.weitere.map((e) => absender(e, profil)).join(" · ")}</p>
                  )}
                </>
              )}

              {svs.length > 0 && (
                <>
                  <h3 className="abschnitt">Verteilungen</h3>
                  <div className="lb-verteilungen">
                    {r.sv_beurteilung && (
                      <Balken titel={lBeurteilung} werte={zaehle(svs.map((s) => s.beurteilung))} farbe={(w) => farbeBeurteilung(profil, w)} />
                    )}
                    {r.sv_tendenz && <Balken titel={lTendenz} werte={zaehle(svs.map((s) => s.tendenz))} farbe={(w) => farbeTendenz(profil, w)} />}
                    {r.sv_art && (
                      <Balken
                        titel={`${bezeichnung(ui, `${r.sachverhalte}[].${r.sv_art}`)} (Mehrfachnennung)`}
                        werte={zaehle(svs.flatMap((s) => (s.arten.length ? s.arten : [""])))}
                      />
                    )}
                    <Balken titel="Meldende Stellen" werte={zaehle(eintraege.filter((e) => !e.fremd).map((e) => absender(e, profil)))} />
                  </div>
                </>
              )}
            </div>
          )}

          {reiter === "meldungen" && (
            <div className="lb-karten">
              {eintraege.map((e) => {
                const eigene = svs.filter((s) => s.eintrag.id === e.id);
                const nQuellen = r.quellen ? parseQuellen(holeWert(e.daten, r.quellen)).length : 0;
                return (
                  <article key={e.id} className="lb-karte">
                    <header>
                      <p className="lb-karte-titel">{absender(e, profil)}</p>
                      <p className="lb-karte-meta">
                        {zeitpunktVon(e, profil) ? datumDE(zeitpunktVon(e, profil)) : "ohne Meldezeitpunkt"} · {e.name}
                      </p>
                    </header>
                    <div className="lb-karte-inhalt">
                      <p className="lb-marken">{marken(e)}</p>
                      {e.fremd ? (
                        <p className="hinweis">
                          Schema „{e.herkunft}“ mit {e.fremd.sachverhalte} Sachverhalt(en). Nicht auswertbar nach diesem Profil, aber an die KI-Verdichtung
                          übergebbar.
                        </p>
                      ) : (
                        <>
                          <p className="lb-karte-meta">
                            {eigene.length} Sachverhalt{eigene.length === 1 ? "" : "e"}
                            {r.quellen ? ` · ${nQuellen} Quelle${nQuellen === 1 ? "" : "n"}` : ""}
                          </p>
                          {eigene.map((s) => (
                            <div key={s.index} className={`lb-sv lb-rand-${farbeBeurteilung(profil, s.beurteilung)}`}>
                              <p className="lb-sv-titel">{s.bezeichnung || `Sachverhalt ${s.index + 1}`}</p>
                              {(s.ort || s.arten.length > 0) && <p className="lb-karte-meta">{[s.arten.join(", "), s.ort].filter(Boolean).join(" · ")}</p>}
                              {svMarken(s)}
                            </div>
                          ))}
                          {e.hinweise.map((h, i) => (
                            <p key={i} className="hinweis">
                              {h}
                            </p>
                          ))}
                        </>
                      )}
                    </div>
                    <footer className="aktionen">
                      {!e.fremd && (
                        <button type="button" className="knopf klein" onClick={() => oeffnen(e.daten)}>
                          In der Maske öffnen
                        </button>
                      )}
                      <button type="button" className="knopf klein leise" onClick={() => entfernen(e.id)}>
                        Entfernen
                      </button>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}

          {reiter === "sachverhalte" &&
            (sortiert.length === 0 ? (
              <p className="leer">Keine Sachverhalte in den geladenen Meldungen.</p>
            ) : (
              <div className="lb-rahmen">
                <table className="tabelle lb-tabelle">
                  <thead>
                    <tr>
                      <th>Meldung</th>
                      <th>Sachverhalt</th>
                      {r.sv_art && <th>{bezeichnung(ui, `${r.sachverhalte}[].${r.sv_art}`)}</th>}
                      {r.sv_ort && <th>{bezeichnung(ui, `${r.sachverhalte}[].${r.sv_ort}`)}</th>}
                      {r.sv_eintritt && <th>{bezeichnung(ui, `${r.sachverhalte}[].${r.sv_eintritt}`)}</th>}
                      <th>
                        {lBeurteilung}
                        {r.sv_tendenz ? ` / ${lTendenz}` : ""}
                      </th>
                      {r.sv_bewertung_text && <th>{bezeichnung(ui, `${r.sachverhalte}[].${r.sv_bewertung_text}`)}</th>}
                      {(r.sv_analysefelder || []).map((f) => (
                        <th key={f}>{bezeichnung(ui, `${r.sachverhalte}[].${f}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortiert.map((s) => (
                      <tr key={`${s.eintrag.id}-${s.index}`}>
                        <td>
                          <strong>{absender(s.eintrag, profil)}</strong>
                        </td>
                        <td>{s.bezeichnung || "–"}</td>
                        {r.sv_art && <td>{s.arten.join(", ") || "–"}</td>}
                        {r.sv_ort && <td>{s.ort || "–"}</td>}
                        {r.sv_eintritt && <td>{datumDE(s.eintritt) || "–"}</td>}
                        <td>{svMarken(s)}</td>
                        {r.sv_bewertung_text && <td className="lb-lang">{s.bewertungText || "–"}</td>}
                        {(r.sv_analysefelder || []).map((f) => (
                          <td key={f} className="lb-lang">
                            {String(holeWert(s.sv, f) || "–")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {reiter === "radar" &&
            (!radarDef ? (
              <p className="leer">Dieses Profil sieht kein Lagenradar vor.</p>
            ) : (
              <>
                <p className="hinweis">
                  Bewusst ohne Mittelwert über mehrere Sachverhalte: Ein Durchschnitt über Stufen verschiedener, nicht vergleichbarer Ereignisse wäre nicht
                  aussagekräftig. Die Werte stehen daher je Sachverhalt einzeln.
                </p>
                <div className="lb-karten">
                  {sortiert.map((s) => {
                    const wert = holeWert(s.sv, r.sv_radar!);
                    const gesetzt = radarDef.achsen.some((a) => Number.isInteger(wert?.[a.key]));
                    return (
                      <article key={`${s.eintrag.id}-${s.index}`} className="lb-karte">
                        <header>
                          <p className="lb-karte-titel">{s.bezeichnung || `Sachverhalt ${s.index + 1}`}</p>
                          <p className="lb-karte-meta">{absender(s.eintrag, profil)}</p>
                        </header>
                        <div className="lb-karte-inhalt lb-radar">
                          {gesetzt ? <RadarGrafik def={radarDef} wert={wert} groesse={170} /> : <p className="hinweis">Kein Lagenradar ausgefüllt.</p>}
                          <ul className="lb-achsen">
                            {radarZeilen(radarDef, wert).map((z) => (
                              <li key={z}>{z}</li>
                            ))}
                          </ul>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ))}

          {reiter === "tabelle" && (
            <div className="lb-rahmen">
              {(() => {
                const t = rohtabelle(eintraege, profil);
                return (
                  <table className="tabelle lb-tabelle">
                    <thead>
                      <tr>
                        {t[0].map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {t.slice(1).map((z, i) => (
                        <tr key={i}>
                          {z.map((c, j) => (
                            <td key={j} className="lb-lang">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          {reiter === "redaktion" && (
            <div className="lb-redaktion">
              <p className="hinweis">
                Der Redaktionscheck wertet nur vorhandene Felder und die Kennsätze aus und ersetzt nicht die fachliche Prüfung: Gleiche Ereignisart heißt nicht
                gleicher Sachverhalt, und die Zahl der Meldungen belegt keine Verschärfung.
              </p>
              <label className="lb-ausgabe">
                <span>{lb.ausgabe_label || "Nächste Ausgabe"}</span>
                <input type="date" value={ausgabe} onChange={(e) => e.target.value && setAusgabe(e.target.value)} />
                <span className="hinweis">Maßstab für die zeitkritische Weitergabe</span>
              </label>

              <Abschnitt nr={1} titel={`Zeitfenster „${ks.handlungsrelevant || "Handlungsrelevant bis:"}“`} verweis={v.zeitfenster}>
                {!ks.handlungsrelevant ? (
                  <p className="leer">Das Profil definiert keinen Kennsatz für Zeitfenster.</p>
                ) : red.zeit.length === 0 ? (
                  <p className="leer">Kein Sachverhalt mit diesem Kennsatz.</p>
                ) : (
                  red.zeit.map((z, i) => (
                    <Punkt key={i} klasse={z.klasse} marke={z.status} titel={svKennung(z.sv, profil)}>
                      {ks.handlungsrelevant} {z.text}
                    </Punkt>
                  ))
                )}
              </Abschnitt>

              <Abschnitt nr={2} titel="Zusammenhang und abweichende Bewertungen" verweis={v.zusammenhang}>
                {red.gruppen.length === 0 ? (
                  <p className="leer">Keine Ereignisart wird in mehr als einer Meldung genannt.</p>
                ) : (
                  red.gruppen.map((g) => (
                    <Punkt
                      key={g.art}
                      klasse={g.abweichend ? "warn" : "info"}
                      marke={g.abweichend ? "Bewertungen weichen ab – falls derselbe Sachverhalt: nebeneinander darstellen" : "Zusammenhang prüfen"}
                      titel={`${g.art}: ${g.liste.length} Sachverhalte aus ${g.meldungen} Meldungen${g.tendenzAbweichend ? " · Tendenzen gegenläufig" : ""}`}
                    >
                      <div className="lb-rahmen">
                        <table className="tabelle lb-tabelle lb-klein">
                          <thead>
                            <tr>
                              <th>Meldung</th>
                              <th>Sachverhalt</th>
                              {r.sv_ort && <th>{bezeichnung(ui, `${r.sachverhalte}[].${r.sv_ort}`)}</th>}
                              <th>{lBeurteilung}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.liste.map((s) => (
                              <tr key={`${s.eintrag.id}-${s.index}`}>
                                <td>{absender(s.eintrag, profil)}</td>
                                <td>{s.bezeichnung || "–"}</td>
                                {r.sv_ort && <td>{s.ort || "–"}</td>}
                                <td>{svMarken(s)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {g.baustein && (
                        <div className="lb-baustein">
                          <div className="lb-baustein-kopf">
                            <strong>Textbaustein</strong>
                            <KopierKnopf html={`<p style="font-family:Arial,sans-serif;font-size:10pt;">${esc(g.baustein)}</p>`} text={g.baustein} />
                          </div>
                          <p>{g.baustein}</p>
                        </div>
                      )}
                    </Punkt>
                  ))
                )}
                {red.vermerkt.length > 0 && (
                  <>
                    <h4>Bereits in Meldungen vermerkt („{ks.abweichung}“)</h4>
                    {red.vermerkt.map((x, i) => (
                      <Punkt key={i} klasse="" titel={svKennung(x.sv, profil)}>
                        {ks.abweichung} {x.text}
                      </Punkt>
                    ))}
                  </>
                )}
              </Abschnitt>

              <Abschnitt nr={3} titel="Fortschreibung, Nachlauf und Abschluss" verweis={v.fortschreibung}>
                {!red.nachlauf.length && !red.abschluss.length && !red.aenderung.length && !red.mehrfach.length && <p className="leer">Keine Hinweise.</p>}
                {red.mehrfach.map((m) => (
                  <Punkt key={m.stelle} klasse="warn" marke="Mehrere Meldungen derselben Stelle" titel={m.stelle}>
                    {m.eintraege.map((e) => `${datumDE(zeitpunktVon(e, profil)) || "ohne Zeitpunkt"} – ${e.name}`).join("\n")}
                    {"\n"}Fortschreibung? Dann gilt die jüngste Meldung; denselben Sachverhalt nicht doppelt zählen.
                  </Punkt>
                ))}
                {red.nachlauf.map((s) => (
                  <Punkt key={`n-${s.eintrag.id}-${s.index}`} klasse="warn" marke="Nachlauf prüfen" titel={svKennung(s, profil)}>
                    {lTendenz} „{s.tendenz}“ ohne Abschlussvermerk. Ist der Zielzustand erreicht, bestehen Folgewirkungen fort?
                    {ks.abschluss
                      ? ` Falls abgeschlossen: „${ks.abschluss}“ mit offenen Punkten und Stelle für die Nachsorge; sonst Stand des Wiederanlaufs nennen.`
                      : ""}
                  </Punkt>
                ))}
                {red.abschluss.map((x) => (
                  <Punkt key={`a-${x.sv.eintrag.id}-${x.sv.index}`} klasse="ok" marke="Abschluss vermerkt" titel={svKennung(x.sv, profil)}>
                    {ks.abschluss} {x.text}
                    {x.rueckblick ? `\nRückblick einplanen${v.rueckblick ? ` (${v.rueckblick})` : ""}.` : ""}
                  </Punkt>
                ))}
                {red.aenderung.map((x) => (
                  <Punkt key={`f-${x.sv.eintrag.id}-${x.sv.index}`} klasse="info" marke="Fortschreibung" titel={svKennung(x.sv, profil)}>
                    {ks.aenderung} {x.text}
                  </Punkt>
                ))}
              </Abschnitt>

              <Abschnitt
                nr={4}
                titel={`Kernaussage und Anschlussfähigkeit bei ${(r.beurteilung_hoch || []).map((b) => `„${b}“`).join(" / ") || "hoher Beurteilung"}`}
                verweis={v.kernaussage}
              >
                {red.kern.length === 0 ? (
                  <p className="leer">Keine Hinweise.</p>
                ) : (
                  red.kern.map((x, i) => (
                    <Punkt key={i} klasse="warn" titel={svKennung(x.sv, profil)}>
                      {x.fehlt.join(" · ")} – ggf. bei der meldenden Stelle nachfragen oder in der eigenen Fassung ergänzen.
                    </Punkt>
                  ))
                )}
              </Abschnitt>

              <Abschnitt nr={5} titel="Quellen, Schema und Status" verweis={v.quellen}>
                {red.quellen.length === 0 ? (
                  <p className="leer">Alle Meldungen bestehen die Schemaprüfung; Quellenverzeichnisse und Verweise ohne Warnhinweis.</p>
                ) : (
                  red.quellen.map((q) => (
                    <Punkt
                      key={q.eintrag.id}
                      klasse={q.klasse}
                      marke={
                        q.eintrag.fremd
                          ? "fremdes Schema"
                          : q.schema
                            ? `Schema: ${q.schema} Abweichung(en)`
                            : q.quellen
                              ? `Quellen: ${q.quellen} Hinweis(e)`
                              : "Hinweis"
                      }
                      titel={`${absender(q.eintrag, profil)} · ${q.eintrag.name}`}
                    >
                      {q.zeilen.join("\n")}
                    </Punkt>
                  ))
                )}
              </Abschnitt>
            </div>
          )}

          {reiter === "kopiervorlage" &&
            (sortiert.length === 0 ? (
              <p className="leer">Keine Sachverhalte zum Aufbereiten.</p>
            ) : (
              (() => {
                const bloecke = sortiert.map((s) => ({ s, html: kopiervorlageHtml(s, profil, radarPng), text: kopiervorlageText(s, profil) }));
                return (
                  <>
                    <div className="lb-leiste">
                      <p className="hinweis">
                        Jeden Block mit „Kopieren“ übernehmen und in Word einfügen; Tabellenlayout und Schrift (Arial 10 pt) bleiben erhalten. Reihenfolge nach
                        Schwere der Beurteilung.
                      </p>
                      <KopierKnopf
                        titel="Alle kopieren"
                        html={bloecke.map((b) => b.html).join("<p>&nbsp;</p>")}
                        text={bloecke.map((b) => b.text).join("\n\n――――――――――\n\n")}
                      />
                    </div>
                    {bloecke.map(({ s, html, text }) => {
                      const hb = ks.handlungsrelevant ? kennsatz(s.bewertungText, ks.handlungsrelevant) : null;
                      const abs = ks.abschluss ? kennsatz(s.bewertungText, ks.abschluss) : null;
                      return (
                        <div key={`${s.eintrag.id}-${s.index}`} className="lb-vorlage">
                          <div className="lb-vorlage-kopf">
                            <span>
                              {svKennung(s, profil)} · {s.beurteilung || "keine Angabe"}
                              {hb !== null ? ` · handlungsrelevant bis ${hb}` : ""}
                              {abs !== null ? " · Abschluss vermerkt" : ""}
                            </span>
                            <KopierKnopf html={html} text={text} />
                          </div>
                          <div className="lb-vorlage-inhalt" dangerouslySetInnerHTML={{ __html: html }} />
                        </div>
                      );
                    })}
                  </>
                );
              })()
            ))}
        </>
      )}
    </div>
  );
}
