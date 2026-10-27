// Modul Lagebild: Meldungen mehrerer Stellen einlesen, prüfen, gemeinsam auswerten und ausgeben.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Meldung, Profil } from "../kern/typen";
import { holeWert } from "../kern/pfad";
import { bezeichnung, feldUi, istEigeneStelle, radarFuer, radarZeilen } from "../kern/ui";
import { parseQuellen } from "../kern/quellen";
import { datumDE, heuteDE } from "../kern/ausgabe";
import { gliedereAnalyse, gliedereBewertung, kennsaetzeAlle } from "../kern/kennsaetze";
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
  stelleVon,
  zaehle,
  zeitpunktVon,
  type Farbe,
  type LagebildDatei,
  type LagebildEintrag,
  type LagebildFehler,
} from "../lagebild/lagebild";
import { redaktionscheck } from "../lagebild/redaktion";
import { isoLokalZuZeitpunkt, zoneOder } from "../kern/zeit";
import { alsCsv, rohtabelle, sopNachweis } from "../lagebild/ausgabe";
import { dateiAnbieten, lagebildLesen, lagebildSchreiben } from "../speicher/speicher";
import type { UebergabeMeldung } from "../pipeline/material";
import { RadarGrafik } from "./Radar";
import { pdfVorladen } from "../dokumente/vorladen";
import { exportStempel, mitDatum } from "../kern/ausgabe";
import { Marken, SvMarken } from "./lagebild/bausteine";
import { LagebildUebergabe } from "./lagebild/Uebergabe";
import { Redaktionscheck } from "./lagebild/Redaktionscheck";
import { Kopiervorlage } from "./lagebild/Kopiervorlage";
import type { LagebildReiter } from "./app/adresse";
import { scrollVerhalten } from "./bewegung";
import { bestaetigen } from "./bestaetigung";

interface Props {
  profil: Profil;
  uebergeben: (dateien: UebergabeMeldung[]) => void;
  oeffnen: (m: Meldung) => void;
  /** Angezeigter Reiter; mit setReiter hält ihn die App in der Adresse (seit 0.6.5, TP-2026-W44-20), sonst eigener Zustand */
  reiter?: Reiter;
  setReiter?: (r: Reiter) => void;
}

type Reiter = LagebildReiter;

const REITER: { id: Reiter; titel: string }[] = [
  { id: "uebersicht", titel: "Übersicht" },
  { id: "meldungen", titel: "Meldungen" },
  { id: "sachverhalte", titel: "Sachverhalte" },
  { id: "radar", titel: "Lagenradar" },
  { id: "redaktion", titel: "Redaktionscheck" },
  { id: "kopiervorlage", titel: "Kopiervorlage" },
  { id: "tabelle", titel: "Rohtabelle" },
];

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

/** Hängt neue Dateien an, ohne inhaltsgleiche zu verdoppeln; die Reihenfolge des Bestands bleibt. */
export function zusammenfuehren(bestand: LagebildDatei[], neu: LagebildDatei[]): LagebildDatei[] {
  const ids = new Set(bestand.map((d) => inhaltsKennung(d.text)));
  const dazu = neu.filter((d) => {
    const id = inhaltsKennung(d.text);
    if (ids.has(id)) return false;
    ids.add(id);
    return true;
  });
  return dazu.length ? [...bestand, ...dazu] : bestand;
}

export function LagebildAnsicht({ profil, uebergeben, oeffnen, reiter: vorgabeReiter, setReiter: vorgabeSetReiter }: Props) {
  const ui = profil.ui;
  const r = ui.rollen;
  const lb = ui.lagebild || {};
  const titel = lb.titel || "Lagebild";
  const [dateien, setDateien] = useState<LagebildDatei[]>([]);
  const [ausgabe, setAusgabe] = useState(inTagen(lb.ausgabe_tage ?? 7));
  /** Uhrzeit der nächsten Ausgabe „hh:mm“; leer = nicht angegeben */
  const [ausgabeZeit, setAusgabeZeit] = useState("");
  /** Stichtag des Redaktionschecks „JJJJ-MM-TTThh:mm“; leer = Echtzeit */
  const [stichtag, setStichtag] = useState("");
  /** Geräteuhr für den Echtzeitmodus; wird laufend und bei Rückkehr in den Vordergrund erneuert */
  const [uhr, setUhr] = useState(() => Date.now());
  const [eigenerReiter, setEigenerReiter] = useState<Reiter>(vorgabeReiter ?? "uebersicht");
  const reiter = vorgabeSetReiter ? (vorgabeReiter ?? "uebersicht") : eigenerReiter;
  const setReiter = vorgabeSetReiter ?? setEigenerReiter;
  const [importFehler, setImportFehler] = useState<LagebildFehler[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [ladeVersuch, setLadeVersuch] = useState(0);
  const [ziehen, setZiehen] = useState(false);
  const [speicherFehler, setSpeicherFehler] = useState<string | null>(null);
  const eingabe = useRef<HTMLInputElement>(null);

  // Gespeicherten Stand laden. Was vor dem Abschluss schon hinzugefügt wurde, bleibt erhalten (zusammengeführt);
  // ein verspätetes Ergebnis nach Wechsel oder Aushängen wird verworfen. Solange nicht geladen ist, wird nicht
  // gespeichert, damit ein Lesefehler keinen leeren Stand über vorhandene Daten schreibt.
  useEffect(() => {
    let gueltig = true;
    lagebildLesen(profil.manifest.id)
      .then((s) => {
        if (!gueltig) return;
        if (s?.dateien) {
          const gespeichert = s.dateien;
          setDateien((neu) => zusammenfuehren(gespeichert, neu));
        }
        if (s?.naechsteAusgabe) {
          const [tag = "", zeit] = s.naechsteAusgabe.split("T");
          setAusgabe(tag);
          setAusgabeZeit(zeit || "");
        }
        if (s?.pruefstand) setStichtag(s.pruefstand);
        setGeladen(true);
      })
      .catch((e) => {
        if (gueltig)
          setLadeFehler(
            `Der gespeicherte Stand des Lagebilds konnte nicht gelesen werden (${(e as Error)?.message || "Speicherfehler"}). Änderungen werden erst nach erfolgreichem Laden gespeichert.`,
          );
      });
    return () => {
      gueltig = false;
    };
  }, [profil.manifest.id, ladeVersuch]);

  const ausgabeWert = ausgabeZeit ? `${ausgabe}T${ausgabeZeit}` : ausgabe;
  useEffect(() => {
    if (geladen)
      lagebildSchreiben(profil.manifest.id, { dateien, naechsteAusgabe: ausgabeWert, ...(stichtag ? { pruefstand: stichtag } : {}) })
        .then(() => setSpeicherFehler(null))
        .catch((e) => setSpeicherFehler(`Der Stand des Lagebilds konnte nicht im Gerät gespeichert werden (${(e as Error).message || "Speicherfehler"}).`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateien, ausgabe, ausgabeZeit, stichtag, geladen, profil.manifest.id]);

  // Echtzeitmodus: Fristen werden mit fortschreitender Zeit neu eingestuft (alle 30 s und bei Rückkehr zur Seite)
  useEffect(() => {
    if (stichtag) return;
    const tick = () => setUhr(Date.now());
    tick(); // beim Zurückschalten auf „jetzt“ sofort den aktuellen Zeitpunkt verwenden
    const t = window.setInterval(tick, 30_000);
    const sichtbar = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", sichtbar);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", sichtbar);
      window.removeEventListener("focus", tick);
    };
  }, [stichtag]);

  const { eintraege, fehler: lesefehler } = useMemo(() => einlesen(dateien, profil), [dateien, profil]);
  const svs = useMemo(() => alleSachverhalte(eintraege, profil), [eintraege, profil]);
  const kz = useMemo(() => kennzahlen(eintraege, profil), [eintraege, profil]);
  const status = useMemo(() => meldestatus(eintraege, profil), [eintraege, profil]);
  const zone = zoneOder(profil.manifest.variablen?.zeitzone);
  const pruefJetzt = useMemo(() => (stichtag ? isoLokalZuZeitpunkt(stichtag, zone)?.datum : undefined) ?? new Date(uhr), [stichtag, zone, uhr]);
  const red = useMemo(() => redaktionscheck(eintraege, profil, ausgabeWert, pruefJetzt), [eintraege, profil, ausgabeWert, pruefJetzt]);
  /** Ganze Tage, die ein gesetzter Stichtag hinter der Geräteuhr liegt */
  const stichtagAlter = stichtag ? Math.floor((uhr - red.stand.jetzt.getTime()) / 864e5) : 0;
  const sortiert = useMemo(() => nachSchwere(svs, profil), [svs, profil]);

  const radarFeld = r.sv_radar ? feldUi(ui, `${r.sachverhalte}[].${r.sv_radar}`) : undefined;
  const radarDef = radarFeld ? radarFuer(ui, radarFeld) : undefined;
  const lBeurteilung = r.sv_beurteilung ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_beurteilung}`) : "Beurteilung";
  const lTendenz = r.sv_tendenz ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_tendenz}`) : "Tendenz";
  const ks = ui.kennsaetze || {};

  const hinzufuegen = (neu: LagebildDatei[]) => setDateien((alt) => zusammenfuehren(alt, neu));

  const auswahl = async (liste: FileList | File[] | null) => {
    if (!liste || !liste.length) return;
    const erg = await dateienAusAuswahl(Array.from(liste));
    hinzufuegen(erg.dateien);
    setImportFehler(erg.fehler);
  };

  // Vor Abschluss des Ladens würde Entferntes beim Zusammenführen mit dem gespeicherten Stand zurückkehren
  const entfernen = (id: string) => geladen && setDateien((alt) => alt.filter((d) => inhaltsKennung(d.text) !== id));
  const alleEntfernen = async () => {
    if (!geladen) return;
    if (await bestaetigen(`Alle ${dateien.length} Dateien aus dem ${titel} entfernen? Die Dateien selbst bleiben unberührt.`, { ja: "Alle entfernen" }))
      setDateien([]);
  };

  /** Übergabedialog an die KI-Verdichtung: 0 = geschlossen; jedes Öffnen zählt hoch und beginnt mit dem Vorschlag */
  const [uebergabeOffen, setUebergabeOffen] = useState(0);
  const uebergabeKnopf = useRef<HTMLButtonElement>(null);
  const eigen = (e: LagebildEintrag) => !e.fremd && istEigeneStelle(stelleVon(e, profil), profil.manifest);
  const dateiZu = (e: LagebildEintrag) => dateien.find((d) => inhaltsKennung(d.text) === e.id);

  // Vom Befund zur Meldung in der Liste „Meldungen“ (nur lesen; die Meldungsmaske bleibt unberührt)
  const [markiert, setMarkiert] = useState<string | null>(null);
  useEffect(() => {
    if (reiter !== "meldungen" || !markiert) return;
    const ziel = document.getElementById(`lb-meldung-${markiert}`);
    ziel?.scrollIntoView?.({ behavior: scrollVerhalten(), block: "center" });
    ziel?.focus?.({ preventScroll: true });
  }, [reiter, markiert]);
  const zurMeldung = (id: string, bezug?: string) => (
    <button
      type="button"
      className="knopf leise klein lb-zur-meldung"
      aria-label={`Meldung in der Liste zeigen: ${bezug || dateien.find((d) => inhaltsKennung(d.text) === id)?.name || id}`}
      onClick={() => {
        setMarkiert(id);
        setReiter("meldungen");
      }}
    >
      Meldung in der Liste zeigen
    </button>
  );

  const csv = () =>
    dateiAnbieten(alsCsv(rohtabelle(eintraege, profil)), mitDatum(exportStempel(zone, new Date(), "tag"), titel, "csv"), "text/csv;charset=utf-8");

  const [pdfFehler, setPdfFehler] = useState<string | null>(null);
  const pdf = async () => {
    setPdfFehler(null);
    const tag = exportStempel(zone, new Date(), "tag");
    const kopf = ["Meldung", "Sachverhalt", lBeurteilung, ...(r.sv_tendenz ? [lTendenz] : []), ...(ks.handlungsrelevant ? ["Handlungsrelevant bis"] : [])];
    const zeilen = sortiert.map((s) => [
      absender(s.eintrag, profil),
      s.bezeichnung || "(ohne Bezeichnung)",
      s.beurteilung || "keine Angabe",
      ...(r.sv_tendenz ? [s.tendenz || "keine Angabe"] : []),
      ...(ks.handlungsrelevant ? [kennsaetzeAlle(s.bewertungText, ks.handlungsrelevant).join("; ")] : []),
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
    try {
      // Die PDF-Bibliothek wird erst bei Bedarf geladen (kleineres Haupt-JavaScript)
      const { lagebildAlsPdf } = await import("../dokumente/pdf");
      dateiAnbieten(lagebildAlsPdf(profil, titel, [kopf, ...zeilen], meldungen, heuteDE()), mitDatum(tag, titel, "pdf"), "application/pdf");
    } catch (e) {
      setPdfFehler(`Das PDF konnte nicht erzeugt werden (${(e as Error)?.message || String(e)}).`);
    }
  };

  // Entstehung der Meldung, so wie gespeichert; die SOP-Angaben gelten für die ganze Meldung
  const entstehungBlock = (e: LagebildEintrag) => {
    const ent = r.entstehung_feld ? holeWert(e.daten, r.entstehung_feld) : undefined;
    if (!ent || typeof ent !== "object") return null;
    const sop = sopNachweis(ent);
    return (
      <details className="lb-entstehung">
        <summary>Entstehung{sop ? ` · SOP: ${Array.isArray(ent.sop) ? ent.sop.length : "–"}` : ""}</summary>
        <dl>
          {ent.verfahren && (
            <>
              <dt>Verfahren</dt>
              <dd>{String(ent.verfahren)}</dd>
            </>
          )}
          {ent.modell && (
            <>
              <dt>Modell</dt>
              <dd>{String(ent.modell)}</dd>
            </>
          )}
          {sop && (
            <>
              <dt>SOP und Bausteine (für die ganze Meldung)</dt>
              <dd>{sop}</dd>
            </>
          )}
          {ent.kodierleitfaden && (
            <>
              <dt>Kodierleitfaden</dt>
              <dd>{String(ent.kodierleitfaden)}</dd>
            </>
          )}
          {ent.erstellt && (
            <>
              <dt>Erstellt</dt>
              <dd>{String(ent.erstellt)}</dd>
            </>
          )}
        </dl>
      </details>
    );
  };

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
          void auswahl(e.dataTransfer.files);
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
            void auswahl(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="hinweis">
          Jede Datei wird nach dem Profil {profil.manifest.name} migriert und gegen das Schema {profil.manifest.meldung.schema_id} geprüft. Meldungen in fremdem
          Schema werden erkannt, aber nur für die KI-Verdichtung vorgehalten. Gleiche Dateiinhalte werden nur einmal geführt.
        </p>
      </section>

      {ladeFehler && (
        <div className="kasten kasten-fehler" role="alert">
          <p>{ladeFehler}</p>
          <button
            type="button"
            className="knopf"
            onClick={() => {
              setLadeFehler(null);
              setLadeVersuch((n) => n + 1);
            }}
          >
            Erneut laden
          </button>
        </div>
      )}
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

      {pdfFehler && (
        <div className="kasten kasten-fehler" role="alert">
          <p>{pdfFehler}</p>
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
              <button type="button" className="knopf" onClick={pdf} onPointerEnter={pdfVorladen} onFocus={pdfVorladen} disabled={!kz.meldungen}>
                Lagebild als PDF
              </button>
              <button type="button" className="knopf" onClick={csv} disabled={!kz.meldungen}>
                Rohtabelle als CSV
              </button>
              <button type="button" className="knopf primaer" ref={uebergabeKnopf} onClick={() => setUebergabeOffen((n) => n + 1)}>
                An KI-Verdichtung übergeben
              </button>
              <button type="button" className="knopf leise" onClick={alleEntfernen}>
                Alle entfernen
              </button>
            </div>
          </div>
          {uebergabeOffen > 0 && (
            <LagebildUebergabe
              key={uebergabeOffen}
              profil={profil}
              eintraege={eintraege}
              eigen={eigen}
              dateiZu={dateiZu}
              uebergeben={(liste) => {
                setUebergabeOffen(0);
                uebergeben(liste);
              }}
              abbrechen={() => {
                setUebergabeOffen(0);
                uebergabeKnopf.current?.focus();
              }}
            />
          )}
          <details className="lb-dateiliste" open={eintraege.length <= 4}>
            <summary>
              Dateien ({eintraege.length}){kz.schemaAbweichungen ? ` · ${kz.schemaAbweichungen} mit Schemaabweichung` : ""}
            </summary>
            <ul className="lb-dateien">
              {eintraege.map((e) => (
                <li key={e.id} title={e.schema.map((b) => b.text).join("\n") || undefined}>
                  <span className="lb-datei-name">{e.name}</span>
                  <Marken e={e} profil={profil} eigen={eigen(e)} />
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
                aria-current={reiter === t.id ? "page" : undefined}
                onClick={() => setReiter(t.id)}
              >
                {t.titel}
                {t.id === "redaktion" && red.anzahl > 0 && <span className="lb-zaehler">{red.anzahl}</span>}
                {t.id === "redaktion" && stichtag && <span className="lb-stichtag-marke"> · Stichtag</span>}
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
                            aria-label={`${z.name} erinnern`}
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
                  <article key={e.id} id={`lb-meldung-${e.id}`} tabIndex={-1} className={markiert === e.id ? "lb-karte lb-karte-markiert" : "lb-karte"}>
                    <header>
                      <p className="lb-karte-titel">{absender(e, profil)}</p>
                      <p className="lb-karte-meta">
                        {zeitpunktVon(e, profil) ? datumDE(zeitpunktVon(e, profil)) : "ohne Meldezeitpunkt"} · {e.name}
                      </p>
                    </header>
                    <div className="lb-karte-inhalt">
                      <p className="lb-marken">
                        <Marken e={e} profil={profil} eigen={eigen(e)} />
                      </p>
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
                              <SvMarken s={s} profil={profil} />
                            </div>
                          ))}
                          {e.hinweise.map((h, i) => (
                            <p key={i} className="hinweis">
                              {h}
                            </p>
                          ))}
                          {entstehungBlock(e)}
                        </>
                      )}
                    </div>
                    <footer className="aktionen">
                      {!e.fremd && (
                        <button
                          type="button"
                          className="knopf klein"
                          aria-label={`${absender(e, profil)} · ${e.name} in der Maske öffnen`}
                          onClick={() => oeffnen(e.daten)}
                        >
                          In der Maske öffnen
                        </button>
                      )}
                      <button
                        type="button"
                        className="knopf klein leise"
                        aria-label={`${absender(e, profil)} · ${e.name} aus dem Lagebild entfernen`}
                        onClick={() => entfernen(e.id)}
                      >
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
                        <td>
                          <SvMarken s={s} profil={profil} />
                        </td>
                        {r.sv_bewertung_text && <td className="lb-lang">{gliedereBewertung(s.bewertungText, ui) || "–"}</td>}
                        {(r.sv_analysefelder || []).map((f) => (
                          <td key={f} className="lb-lang">
                            {gliedereAnalyse(holeWert(s.sv, f), ui) || "–"}
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
                        {(t[0] ?? []).map((h, i) => (
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
            <Redaktionscheck
              profil={profil}
              titel={titel}
              eintraege={eintraege}
              red={red}
              zone={zone}
              ausgabe={ausgabe}
              setAusgabe={setAusgabe}
              ausgabeZeit={ausgabeZeit}
              setAusgabeZeit={setAusgabeZeit}
              stichtag={stichtag}
              setStichtag={setStichtag}
              stichtagAlter={stichtagAlter}
              zurMeldung={zurMeldung}
            />
          )}

          {reiter === "kopiervorlage" &&
            (sortiert.length === 0 ? <p className="leer">Keine Sachverhalte zum Aufbereiten.</p> : <Kopiervorlage profil={profil} sortiert={sortiert} />)}
        </>
      )}
    </div>
  );
}
