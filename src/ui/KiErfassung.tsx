// KI-Erfassung (Modus A): Auftrag → S1 Gegenstand bestätigen (bei „Recherche durchführen“ mit Orientierungssuche und
// Bestätigung der Suchbegriffe) → S2 Recherche und Entwurf → S3 Prüfung → Übergabe.
// Seit 0.6.5 (TP-2026-W44-17) mit einem Reducer (kiErfassung/zustand.ts) und Teilkomponenten unter kiErfassung/;
// diese Datei steuert den Ablauf (Start der Stufen, Fehler, Übergabe aus dem Lagebild, Meldungen an die App).

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { anbieterListe, fehlendeSchluessel, Verteiler, type Schluessel } from "../anbieter/verteiler";
import { istVerbindungsabbruch, TEXT_VERBINDUNGSABBRUCH } from "../anbieter/typen";
import { useWachhalten } from "./wachhalten";
import type { KopfLauf } from "./KiSymbol";
import type { Meldung, Profil } from "../kern/typen";
import { dateiAnbieten } from "../speicher/speicher";
import { laufModelle, mitModellwahl, type Einstellungen, type ModellWahl as Modellwahl } from "../pipeline/einstellungen";
import type { EinstellungsBereich } from "./Einstellungen";
import { neuerLauf, type Lauf } from "../pipeline/lauf";
import { laufSpeichern, speicherSchuetzen } from "../speicher/laufSpeicher";
import { dateiLesen, istVerdichtung, materialErgaenzen, rolleSetzen, urlsAusText, type Material, type KiUebergabe } from "../pipeline/material";
import { orientierungMoeglich, orientierungssuche } from "../pipeline/orientierung";
import { stufe1 } from "../pipeline/s1";
import { stufe2und3 } from "../pipeline/s2s3";
import type { Kontext } from "../pipeline/stufen";
import { dateistempel, exportStempel, mitDatum } from "../kern/ausgabe";
import { KiZugangContext, useKiZugang, type KiZugangWert } from "./kiZugang";
import { heute, kiReducer, PHASEN, speicherText, startZustand, vorschlagVon } from "./kiErfassung/zustand";
import { LaufAnzeigeStand } from "./kiErfassung/anzeigeStand";
import { stufenFuer, type LaufRahmen } from "./kiErfassung/rahmen";
import { Auftragsformular } from "./kiErfassung/Auftragsformular";
import { Laufanzeige } from "./kiErfassung/Laufanzeige";
import { Bestaetigung } from "./kiErfassung/Bestaetigung";
import { Ergebnis } from "./kiErfassung/Ergebnis";
import { FruehereLaeufe } from "./kiErfassung/FruehereLaeufe";
import { LaufModellWahl } from "./kiErfassung/LaufModellWahl";
import { usePwaZustand } from "./PwaHinweis";
import { bestaetigen } from "./bestaetigung";
import { springeZu } from "./sprung";

export { TEXT_FELD } from "./kiErfassung/texte";
export { kurzeAdresse } from "./kiErfassung/recherche";

interface Props {
  /** Profil, Einstellungen, Schlüssel und Weg in die Einstellungen; ohne Angabe aus dem KI-Zugang der App */
  profil?: Profil;
  einstellungen?: Einstellungen;
  schluessel?: Schluessel;
  /** Zu den Einstellungen, ohne Angabe in den Bereich „KI-Anbieter & API“ */
  zuEinstellungen?: (bereich?: EinstellungsBereich) => void;
  uebernehmen: (m: Meldung) => void;
  /** Meldungen, die das Lagebild zur Verdichtung übergibt (nr wechselt je Übergabe) */
  uebergabe?: KiUebergabe | null;
  /** Quittiert eine verarbeitete Übergabe, damit sie nach einem erneuten Einhängen nicht wiederholt wird */
  uebergabeQuittieren?: (nr: number) => void;
  /** Meldet der App, ob gerade ein KI-Lauf aktiv ist (ein Profilwechsel bricht ihn ab). */
  laufMelden?: (laeuft: boolean) => void;
  /** Meldet die laufende KI-Anfrage (Stufe) an den KI-Chip der Kopfleiste; null, sobald keine läuft */
  laufStand?: (stand: KopfLauf | null) => void;
}

export function KiErfassung(props: Props) {
  const kontextZugang = useKiZugang();
  const profil = props.profil ?? kontextZugang?.profil;
  if (!profil) throw new Error("KI-Erfassung ohne Profil");
  const einstellungen = props.einstellungen ?? kontextZugang?.einstellungen;
  const schluessel = props.schluessel ?? kontextZugang?.schluessel;
  const zuEinstellungen = props.zuEinstellungen ?? kontextZugang?.zuEinstellungen;
  if (!einstellungen || !schluessel || !zuEinstellungen) throw new Error("KI-Erfassung ohne KI-Zugang");
  const zugang = useMemo<KiZugangWert>(() => ({ profil, einstellungen, schluessel, zuEinstellungen }), [profil, einstellungen, schluessel, zuEinstellungen]);
  return (
    <KiZugangContext.Provider value={zugang}>
      <Erfassung {...props} profil={profil} einstellungen={einstellungen} schluessel={schluessel} zuEinstellungen={zuEinstellungen} />
    </KiZugangContext.Provider>
  );
}

function Erfassung({
  profil,
  einstellungen,
  schluessel,
  zuEinstellungen,
  uebernehmen,
  uebergabe,
  uebergabeQuittieren,
  laufMelden,
  laufStand,
}: Props & { profil: Profil; einstellungen: Einstellungen; schluessel: Schluessel; zuEinstellungen: (bereich?: EinstellungsBereich) => void }) {
  const zone = profil.manifest.variablen?.zeitzone;
  const [zustand, dispatch] = useReducer(kiReducer, zone, (z: string | undefined) => startZustand(heute(z)));
  const { ablauf, eingabe, fehler } = zustand;
  const { phase } = ablauf;
  const lauf = ablauf.lauf;
  const vorschlag = vorschlagVon(ablauf);
  /** Vorbelegter Stichtag: bleibt er unverändert, liest S1 den heutigen Tag beim Start neu (Seite über Mitternacht offen) */
  const vorbelegterStichtag = useRef(eingabe.stichtag);
  const [anzeige] = useState(() => new LaufAnzeigeStand());
  /** Zählt gespeicherte Läufe; „Frühere Läufe“ lädt dann neu */
  const [laeufeStand, setLaeufeStand] = useState(0);
  const neuLaden = () => setLaeufeStand((n) => n + 1);
  const fehlerMelden = useCallback((text: string | null) => dispatch({ typ: "fehler", text }), []);
  const abbruch = useRef<AbortController | null>(null);
  // Laufende Anfrage beim Verlassen (Profilwechsel) kontrolliert abbrechen; der Lauf bleibt als abgebrochen protokolliert
  useEffect(() => () => abbruch.current?.abort(), []);

  const { material } = eingabe;
  const laufEinstellungen = useMemo(() => mitModellwahl(einstellungen, eingabe.modellWahl), [einstellungen, eingabe.modellWahl]);
  const urls = urlsAusText(eingabe.urlText);
  const laeuft = phase === "s1" || phase === "orientierung" || phase === "s2";
  const laufMeldenRef = useRef(laufMelden);
  useEffect(() => {
    laufMeldenRef.current = laufMelden;
  });
  useEffect(() => {
    laufMeldenRef.current?.(laeuft);
  }, [laeuft]);
  useEffect(
    () => () => {
      laufMeldenRef.current?.(false);
    },
    [],
  );

  const hintergrund = useWachhalten(laeuft);

  const dateienHinzufuegen = async (liste: FileList | File[] | null) => {
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
    dispatch({ typ: "material", aendern: (alt) => materialErgaenzen(alt, neu) });
    dispatch({ typ: "eingabe", teil: { dateiFehler: fehlerListe } });
  };

  const kontext = (l: Lauf): Kontext => {
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    return {
      profil,
      anbieter: Verteiler.fuer(schluessel, laufEinstellungen.anbieterOptionen),
      einstellungen: laufEinstellungen,
      lauf: l,
      material,
      signal: ctrl.signal,
      aktualisiert: async (x) => {
        dispatch({ typ: "lauf", lauf: { ...x } });
        await laufSpeichern(x).catch((e) => fehlerMelden(speicherText("Das Laufprotokoll konnte nicht im Gerät gespeichert werden", e)));
      },
      fortschritt: anzeige.fortschritt,
    };
  };

  const fehlerBehandeln = async (l: Lauf, e: any) => {
    const abgebrochen = e?.name === "AbortError";
    const s = Math.round(hintergrund.current / 1000);
    const zusatz = s > 0 ? ` Die Seite war während des Laufs ${s} s im Hintergrund oder gesperrt.` : "";
    const text = abgebrochen ? "Von der Person abgebrochen." : (istVerbindungsabbruch(e) ? TEXT_VERBINDUNGSABBRUCH : String(e?.message || e)) + zusatz;
    const neu: Lauf = { ...l, status: abgebrochen ? "abgebrochen" : "fehler", fehler: text };
    dispatch({ typ: "lauf", lauf: neu });
    fehlerMelden(text);
    await laufSpeichern(neu).catch((e) => fehlerMelden(`${text} ${speicherText("Das Laufprotokoll konnte nicht im Gerät gespeichert werden", e)}`));
    neuLaden();
    return neu;
  };

  const verdichtung = material.some((m) => m.art === "eingang");
  const websuche = eingabe.websucheWahl ?? !verdichtung;

  const s1Starten = async () => {
    fehlerMelden(null);
    // Beim ersten Lauf den Speicher der App vor automatischer Räumung schützen lassen (TP-2026-W44-10)
    void speicherSchuetzen();
    const { stichtag, uhrzeit } = eingabe;
    const tag = !uhrzeit && stichtag === vorbelegterStichtag.current ? heute(zone) : stichtag;
    if (tag !== stichtag) {
      vorbelegterStichtag.current = tag;
      dispatch({ typ: "eingabe", teil: { stichtag: tag } });
    }
    const l = neuerLauf(
      profil,
      {
        sachverhalt: eingabe.sachverhalt,
        stichworte: eingabe.stichworte,
        urls: urls.gueltig,
        stichtag: tag,
        prueffrage: eingabe.prueffrage,
        websuche,
        ...(uhrzeit && tag ? { meldezeitpunkt: `${tag}T${uhrzeit}` } : {}),
      },
      material.map((m) => ({ name: m.name, art: m.art, groesse: m.groesse, hash: m.hash, ...(m.rolleGewaehlt ? { rolleGewaehlt: true } : {}) })),
    );
    anzeige.beginnen();
    dispatch({ typ: "s1", lauf: l });
    try {
      const v = await stufe1(kontext(l));
      dispatch({ typ: "bestaetigen", vorschlag: structuredClone(v) });
      // Lauf nach S1 auch unter „Frühere Läufe“ zeigen (Protokoll schon jetzt exportierbar)
      neuLaden();
    } catch (e) {
      const neu = await fehlerBehandeln(l, e);
      dispatch({ typ: "zumAuftrag", lauf: neu });
    }
  };

  const s2Starten = async () => {
    if (!lauf || !vorschlag) return;
    fehlerMelden(null);
    anzeige.beginnen();
    dispatch({ typ: "s2" });
    const l = lauf;
    try {
      await stufe2und3(kontext(l), vorschlag);
      dispatch({ typ: "ergebnis" });
    } catch (e) {
      await fehlerBehandeln(l, e);
      dispatch({ typ: "ergebnis" });
    }
    neuLaden();
  };

  /** Orientierungssuche je Sachverhalt (Bestandteil von S1, seit 0.6.0); `nur`: nur diese Sachverhalte (Index ab 0) */
  const orientierungStarten = async (nur?: number[]) => {
    if (!lauf || !vorschlag) return;
    fehlerMelden(null);
    anzeige.beginnen();
    orientierungFuer.current = nur?.length === 1 ? nur[0]! : null;
    dispatch({ typ: "orientierung" });
    const l = lauf;
    try {
      const v = await orientierungssuche(kontext(l), vorschlag, nur);
      dispatch({ typ: "bestaetigen", vorschlag: structuredClone(v) });
    } catch (e: any) {
      fehlerMelden(
        e?.name === "AbortError"
          ? "Orientierungssuche abgebrochen. Suchbegriffe lassen sich selbst eintragen, oder die Orientierung neu starten."
          : `Die Orientierungssuche ist gescheitert: ${istVerbindungsabbruch(e) ? TEXT_VERBINDUNGSABBRUCH : String(e?.message || e)}`,
      );
      const neu: Lauf = { ...l, status: "bestaetigen" };
      dispatch({ typ: "lauf", lauf: neu });
      await laufSpeichern(neu).catch(() => {});
      dispatch({ typ: "bestaetigen" });
    }
  };

  const leeren = () => {
    const tag = heute(zone);
    vorbelegterStichtag.current = tag;
    dispatch({ typ: "leeren", stichtag: tag });
  };

  const neueErfassung = async () => {
    const { sachverhalt, stichworte, urlText, prueffrage } = eingabe;
    const etwasDa = sachverhalt || stichworte || urlText || prueffrage || material.length || lauf;
    if (
      etwasDa &&
      !(await bestaetigen(
        "Neue KI-Erfassung beginnen? Auftrag, Material und der angezeigte Lauf werden geleert. Gespeicherte Läufe bleiben unter „Frühere Läufe“ erhalten.",
        { ja: "Neu beginnen" },
      ))
    )
      return;
    leeren();
  };

  // Übergabe aus dem Lagebild: Meldungen als Material, bei abgeschlossenem Lauf mit neuer Erfassung
  // Nur Übergaben des eigenen Profils und jede nur einmal (auch bei doppeltem Effektlauf im StrictMode).
  const verarbeiteteUebergabe = useRef<number | null>(null);
  useEffect(() => {
    if (!uebergabe?.dateien.length || uebergabe.profilHash !== profil.hash) return;
    if (verarbeiteteUebergabe.current === uebergabe.nr) return;
    verarbeiteteUebergabe.current = uebergabe.nr;
    uebergabeQuittieren?.(uebergabe.nr);
    if (laeuft) {
      dispatch({
        typ: "eingabe",
        teil: { dateiFehler: ["Die Meldungen aus dem Lagebild wurden nicht übernommen, weil gerade ein Lauf läuft. Nach dem Lauf erneut übergeben."] },
      });
      return;
    }
    if (phase !== "auftrag") leeren();
    // Rolle aus dem Übergabedialog verbindlich setzen; sie geht der automatischen Erkennung vor.
    // Pfade aus ZIP-Archiven bleiben als Namensteil erhalten („Nord › meldung.json“).
    void (async () => {
      const neu: Material[] = [];
      const fehlerListe: string[] = [];
      for (const d of uebergabe.dateien) {
        try {
          const m = await dateiLesen(new File([d.text], d.name.replace(/\//g, " › "), { type: "application/json" }), profil);
          neu.push(rolleSetzen(m, d.rolle, profil));
        } catch (e) {
          fehlerListe.push((e as Error).message);
        }
      }
      dispatch({ typ: "material", aendern: (alt) => materialErgaenzen(alt, neu) });
      dispatch({ typ: "eingabe", teil: { dateiFehler: fehlerListe } });
    })();
    const eingaengeN = uebergabe.dateien.filter((d) => d.rolle === "eingang").length;
    dispatch({
      typ: "sachverhaltVorschlagen",
      text: eingaengeN ? `Lagebild aus ${eingaengeN} Eingangsmeldung${eingaengeN === 1 ? "" : "en"} verdichten` : "Eigene Meldung fortschreiben",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uebergabe?.nr]);

  const protokollName = useCallback((l: Lauf) => mitDatum(dateistempel(l.erstellt, zone) ?? exportStempel(zone), `KI-LEAD_Lauf_${l.id}`, "json"), [zone]);
  const protokollExport = useCallback((l: Lauf) => dateiAnbieten(JSON.stringify(l, null, 2), protokollName(l), "application/json"), [protokollName]);

  const { offline } = usePwaZustand();
  const setWahl = useCallback((w: Modellwahl) => dispatch({ typ: "eingabe", teil: { modellWahl: w } }), []);
  const eingaenge = useMemo(() => material.filter((m) => m.art === "eingang"), [material]);
  // Gleiche Objekte über Renderläufe, damit LaufSchaetzung und ModellWahl (memo) nicht unnötig neu zeichnen
  const stufen = useMemo(() => stufenFuer(verdichtung), [verdichtung]);
  const rahmen: LaufRahmen = {
    profil,
    laufEinstellungen,
    verdichtung,
    websuche,
    material,
    eingaenge,
    ...stufen,
    wahl: eingabe.modellWahl,
    setWahl,
    protokollExport,
    offline,
  };

  // Fokus beim Wechsel der Phase auf die Überschrift des neuen Schritts (seit 0.6.5, TP-2026-W44-13): Bis 0.6.4 fiel er
  // auf das Dokument, sobald der fokussierte Knopf („Abbrechen“, „Gegenstand bestimmen“) verschwand. Nicht beim Einhängen.
  // Seit 0.6.7 richtet die App dazu den Anfang des Arbeitsbereichs unter dem Kopf aus; bis 0.6.6 blieb nach „S1 starten“
  // am Ende des Auftrags die Scrollhöhe stehen. Nach der Orientierungssuche für einen einzelnen Sachverhalt steht dessen
  // Karte oben. Wechselt die Phase, während die KI-Erfassung verborgen ist, holt die App den Sprung beim Zeigen nach.
  const arbeitsbereichRef = useRef<HTMLDivElement>(null);
  const inhaltRef = useRef<HTMLElement>(null);
  const vorherPhase = useRef(phase);
  /** Sachverhalt (Index ab 0), für den allein die Orientierungssuche läuft */
  const orientierungFuer = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (vorherPhase.current === phase) return;
    const vorher = vorherPhase.current;
    vorherPhase.current = phase;
    const ueberschrift = inhaltRef.current?.querySelector<HTMLElement>("h2") ?? null;
    const sv = orientierungFuer.current;
    if (phase === "bestaetigen" && vorher === "orientierung" && sv !== null) {
      orientierungFuer.current = null;
      const karte = inhaltRef.current?.querySelector<HTMLElement>(`[data-sachverhalt="${sv}"]`);
      if (karte && springeZu(karte, karte.querySelector<HTMLElement>("h3"), { fokus: true })) return;
    }
    springeZu(arbeitsbereichRef.current, ueberschrift, { fokus: true });
  }, [phase]);

  const aktivIndex = phase === "s1" ? 0 : PHASEN.findIndex((p) => p.id === (phase === "orientierung" ? "bestaetigen" : phase));
  const orientierungAn = !!lauf && orientierungMoeglich({ einstellungen: laufEinstellungen, profil, lauf, material }).an;

  // Stand für den KI-Chip der Kopfleiste: nur die Stufe, damit die App beim Streaming nicht mitzeichnet
  const laufStandRef = useRef(laufStand);
  useEffect(() => {
    laufStandRef.current = laufStand;
  });
  const kopfStufe = phase === "s1" || phase === "orientierung" ? "s1" : phase === "s2" ? (lauf?.status === "s3" ? "s3" : "s2") : null;
  useEffect(() => {
    laufStandRef.current?.(kopfStufe ? { stufe: kopfStufe, verdichtung } : null);
  }, [kopfStufe, verdichtung]);
  useEffect(() => () => laufStandRef.current?.(null), []);

  const fehlend = fehlendeSchluessel(laufModelle(laufEinstellungen, profil, istVerdichtung(material)), schluessel);
  const kannStarten =
    !offline && !fehlend.length && eingabe.datenOk && !!(eingabe.sachverhalt.trim() || eingabe.stichworte.trim() || urls.gueltig.length || material.length);

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
        {!laeuft && (
          <div className="werkzeugleiste-knoepfe">
            <button type="button" className="knopf leise" onClick={neueErfassung}>
              Neue KI-Erfassung
            </button>
          </div>
        )}
      </div>

      {fehlend.length > 0 && (
        <div className="kasten kasten-hinweis" role="status">
          <p>Für die gewählten Modelle brauchst du einen eigenen API-Schlüssel von {anbieterListe(fehlend)}.</p>
          <button type="button" className="knopf klein" onClick={() => zuEinstellungen()}>
            Zu den Einstellungen
          </button>
        </div>
      )}

      <div className="arbeitsbereich" ref={arbeitsbereichRef}>
        <nav className="schritte" aria-label="Stufen">
          {/* Auf schmalen Bildschirmen waagerecht scrollbar; ohne Bedienelemente daher selbst fokussierbar (seit 0.6.5, TP-2026-W44-22) */}
          <ol tabIndex={0}>
            {PHASEN.map((p, i) => (
              <li key={p.id}>
                <div
                  className={i === aktivIndex ? "schritt aktiv" : i < aktivIndex ? "schritt erledigt" : "schritt"}
                  aria-current={i === aktivIndex ? "step" : undefined}
                >
                  <span className="schritt-nr">{i + 1}</span>
                  <span className="schritt-titel">{p.id === "bestaetigen" && orientierungAn ? "Gegenstand und Suchbegriffe bestätigen" : p.titel}</span>
                </div>
              </li>
            ))}
          </ol>
        </nav>

        <section className="schritt-inhalt" ref={inhaltRef}>
          {ablauf.phase === "auftrag" && (
            <Auftragsformular
              rahmen={rahmen}
              eingabe={eingabe}
              dispatch={dispatch}
              fehler={fehler}
              lauf={ablauf.lauf}
              urls={urls}
              kannStarten={kannStarten}
              starten={s1Starten}
              dateienHinzufuegen={dateienHinzufuegen}
            />
          )}

          {(ablauf.phase === "s1" || ablauf.phase === "orientierung" || ablauf.phase === "s2") && (
            <Laufanzeige phase={ablauf.phase} lauf={ablauf.lauf} rahmen={rahmen} stand={anzeige} abbrechen={() => abbruch.current?.abort()} />
          )}

          {ablauf.phase === "bestaetigen" && (
            <Bestaetigung
              rahmen={rahmen}
              lauf={ablauf.lauf}
              vorschlag={ablauf.vorschlag}
              dispatch={dispatch}
              orientierungAn={orientierungAn}
              orientierungStarten={orientierungStarten}
              s2Starten={s2Starten}
              zurueck={() => dispatch({ typ: "zumAuftrag" })}
            />
          )}

          {ablauf.phase === "ergebnis" && (
            <Ergebnis
              profil={profil}
              aendern={async (l) => {
                dispatch({ typ: "lauf", lauf: l });
                await laufSpeichern(l).catch((e) => fehlerMelden(speicherText("Die Änderung am Lauf konnte nicht im Gerät gespeichert werden", e)));
              }}
              lauf={ablauf.lauf}
              fehler={fehler}
              uebernehmen={uebernehmen}
              exportieren={() => protokollExport(ablauf.lauf)}
              erneut={s2Starten}
              offline={offline}
              modellwahl={
                <LaufModellWahl
                  stufen={[rahmen.stufeS2, rahmen.stufeS3]}
                  websuche={ablauf.lauf.auftrag.websuche !== false}
                  wahl={eingabe.modellWahl}
                  setWahl={setWahl}
                />
              }
            />
          )}
        </section>
      </div>

      <FruehereLaeufe
        profil={profil}
        aktualisierung={laeufeStand}
        laeuft={laeuft}
        uebernehmen={uebernehmen}
        protokollExport={protokollExport}
        protokollName={protokollName}
        fehlerMelden={fehlerMelden}
      />
    </div>
  );
}
