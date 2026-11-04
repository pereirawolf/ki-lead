// Modul Lagebild: Meldungen mehrerer Stellen einlesen, prüfen, gemeinsam auswerten und ausgeben.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Meldung, Profil } from "../kern/typen";
import { holeWert } from "../kern/pfad";
import { bezeichnung, feldUi, istEigeneStelle, radarFuer } from "../kern/ui";
import { parseQuellen } from "../kern/quellen";
import { datumDE, heuteDE } from "../kern/ausgabe";
import { kennsaetzeAlle } from "../kern/kennsaetze";
import {
  absender,
  alleSachverhalte,
  beispielDateien,
  dateienAusAuswahl,
  einlesen,
  alterText,
  beurteilungsStufen,
  erinnerungMailto,
  farbeBeurteilung,
  farbeTendenz,
  herkunftsrolleAnzeige,
  herkunftsrolleVon,
  herkunftsrolleWerte,
  inhaltsKennung,
  inTagen,
  istPlatzhalterAdresse,
  kennzahlen,
  meldestatus,
  nachHerkunftsrolle,
  nachSchwere,
  sammelErinnerungMailto,
  schwere,
  stelleVon,
  svKennung,
  tendenzStufen,
  zaehle,
  zeitpunktVon,
  type Farbe,
  type LagebildDatei,
  type LagebildEintrag,
  type LagebildFehler,
  type StatusZeile,
  type SvEintrag,
} from "../lagebild/lagebild";
import { befundListe, offeneBefunde, redaktionscheck, type Bearbeitung } from "../lagebild/redaktion";
import { isoLokalZuZeitpunkt, zoneOder } from "../kern/zeit";
import { alsCsv, rohtabelle, sopNachweis } from "../lagebild/ausgabe";
import { dateiAnbieten, lagebildLesen, lagebildSchreiben } from "../speicher/speicher";
import type { UebergabeMeldung } from "../pipeline/material";
import { pdfVorladen } from "../dokumente/vorladen";
import { exportStempel, mitDatum } from "../kern/ausgabe";
import { Absender, Marke, Marken, SvMarken } from "./lagebild/bausteine";
import { LagebildUebergabe } from "./lagebild/Uebergabe";
import { Redaktionscheck } from "./lagebild/Redaktionscheck";
import { Kopiervorlage } from "./lagebild/Kopiervorlage";
import { Radarvergleich } from "./lagebild/Radarvergleich";
import { KEIN_FILTER, Sachverhaltsliste, type SvFilter } from "./lagebild/Sachverhaltsliste";
import type { LagebildReiter } from "./app/adresse";
import { scrollVerhalten } from "./bewegung";
import { bestaetigen } from "./bestaetigung";
import { springeZu, useSprung } from "./sprung";
import { useAktivImBild } from "./leiste";
import { useKopfHoehe } from "./kopfHoehe";
import { ProfilZeile } from "./ProfilZeile";
import { Menue } from "./Menue";

interface Props {
  profil: Profil;
  uebergeben: (dateien: UebergabeMeldung[]) => void;
  oeffnen: (m: Meldung) => void;
  /** Angezeigter Reiter; mit setReiter hält ihn die App in der Adresse (seit 0.6.5, TP-2026-W44-20), sonst eigener Zustand */
  reiter?: Reiter;
  setReiter?: (r: Reiter) => void;
}

type Reiter = LagebildReiter;
type MeldungsFolge = "stelle" | "zeit" | "beurteilung";

/**
 * Reiter in drei Gruppen (seit UX-2026-W45-03): Lage (1), Redaktion (2), Ausgabe (3); zwischen den Gruppen ein feiner
 * Trenner ohne Überschrift. Bis dahin Übersicht, Meldungen, Sachverhalte, Lagenradar, Redaktionscheck, Kopiervorlage,
 * Rohtabelle.
 */
const REITER: { id: Reiter; titel: string; gruppe: 1 | 2 | 3 }[] = [
  { id: "uebersicht", titel: "Übersicht", gruppe: 1 },
  { id: "sachverhalte", titel: "Sachverhalte", gruppe: 1 },
  { id: "radar", titel: "Lagenradar", gruppe: 1 },
  { id: "meldungen", titel: "Meldungen", gruppe: 1 },
  { id: "redaktion", titel: "Redaktionscheck", gruppe: 2 },
  { id: "kopiervorlage", titel: "Kopiervorlage", gruppe: 3 },
  { id: "tabelle", titel: "Rohtabelle", gruppe: 3 },
];

function Balken({ titel, werte, farbe }: { titel: string; werte: [string, number][]; farbe?: (w: string) => Farbe }) {
  if (!werte.length) return null;
  const max = Math.max(1, ...werte.map((w) => w[1]));
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

/** „davon n aus eigener Meldung“; leer bei 0 */
function davonEigen(n: number, wort = "aus eigener Meldung"): string | undefined {
  return n ? `davon ${n} ${wort}` : undefined;
}

/** Anzahl je Stufe in der Reihenfolge der Stufen, auch 0; Werte außerhalb der Stufen (und keine Angabe) danach */
function stufenZaehlen(werte: string[], stufen: string[]): [string, number][] {
  const gezaehlt = new Map(zaehle(werte));
  const rest = [...gezaehlt].filter(([w]) => !stufen.includes(w));
  return [...stufen.map((st): [string, number] => [st, gezaehlt.get(st) ?? 0]), ...rest];
}

/** Kennzahl als Knopf; mit 0 zurückgenommen, die Randfarbe nur bei Anzahl (seit UX-2026-W45-06) */
function Kachel({
  zahl,
  text,
  rand,
  gutBeiNull,
  zusatz,
  onClick,
}: {
  zahl: number;
  text: string;
  rand?: Farbe;
  gutBeiNull?: boolean;
  /** z. B. „davon 1 aus eigener Meldung“ (UX-2026-W45-09) */
  zusatz?: string;
  onClick: () => void;
}) {
  const rahmen = zahl ? (rand ? `lb-rand-${rand}` : "") : gutBeiNull ? "lb-rand-gruen" : "lb-kennzahl-null";
  const klasse = ["lb-kennzahl", rahmen].filter(Boolean).join(" ");
  return (
    <button type="button" className={klasse} onClick={onClick}>
      <b>{zahl}</b>
      <span>{text} →</span>
      {zusatz && <span className="lb-kennzahl-zusatz">{zusatz}</span>}
    </button>
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
  /** Bearbeitungsstand der Befunde des Redaktionschecks (seit UX-2026-W45-19), gespeichert mit dem Lagebild */
  const [bearbeitung, setBearbeitung] = useState<Record<string, Bearbeitung>>({});
  /** Ausgeblendete Werte der Herkunftsrolle (seit 0.6.13, Issue #114, A1); „“ steht für keine Angabe */
  const [ausgeblendet, setAusgeblendet] = useState<ReadonlySet<string>>(() => new Set());

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
        if (s?.bearbeitung) setBearbeitung((neu) => ({ ...s.bearbeitung, ...neu }));
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
      lagebildSchreiben(profil.manifest.id, {
        dateien,
        naechsteAusgabe: ausgabeWert,
        ...(stichtag ? { pruefstand: stichtag } : {}),
        ...(Object.keys(bearbeitung).length ? { bearbeitung } : {}),
      })
        .then(() => setSpeicherFehler(null))
        .catch((e) => setSpeicherFehler(`Der Stand des Lagebilds konnte nicht im Gerät gespeichert werden (${(e as Error).message || "Speicherfehler"}).`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateien, ausgabe, ausgabeZeit, stichtag, bearbeitung, geladen, profil.manifest.id]);

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

  const { eintraege: alleEintraege, fehler: lesefehler } = useMemo(() => einlesen(dateien, profil), [dateien, profil]);
  // Herkunftsfilter (seit 0.6.13, Issue #114, A1): gilt für Übersicht, Meldungen, Sachverhalte, Lagenradar, Kopiervorlage,
  // Rohtabelle, PDF und CSV. Dateiliste, Meldestatus, Redaktionscheck und Übergabe sehen alle Meldungen, damit der Filter
  // weder Erinnerungen auslöst noch Prüfbefunde oder Eingangsmeldungen verschluckt.
  const herkunftWerte = useMemo(() => herkunftsrolleWerte(alleEintraege, profil), [alleEintraege, profil]);
  // Filter „Eigene Meldung“ (seit UX-2026-W45-09): Die eigene Meldung einer Koordinierungsstelle verdichtet oft die
  // Eingangsmeldungen; sie bleibt standardmäßig einbezogen und lässt sich mit derselben Reichweite wie der
  // Herkunftsfilter ausblenden, damit Kennzahlen und Verteilungen nicht doppelt zählen.
  const eigen = (e: LagebildEintrag) => !e.fremd && istEigeneStelle(stelleVon(e, profil), profil.manifest);
  const [eigeneAusblenden, setEigeneAusblenden] = useState(false);
  const nEigene = alleEintraege.filter(eigen).length;
  const eintraege = useMemo(
    () => nachHerkunftsrolle(alleEintraege, profil, ausgeblendet).filter((e) => !(eigeneAusblenden && eigen(e))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alleEintraege, profil, ausgeblendet, eigeneAusblenden],
  );
  const herkunftGefiltert = herkunftWerte.some((w) => ausgeblendet.has(w));
  const eigeneGefiltert = eigeneAusblenden && nEigene > 0;
  const nAbweichungen = alleEintraege.filter((e) => e.schema.length).length;
  const svs = useMemo(() => alleSachverhalte(eintraege, profil), [eintraege, profil]);
  const kz = useMemo(() => kennzahlen(eintraege, profil), [eintraege, profil]);
  const status = useMemo(() => meldestatus(alleEintraege, profil), [alleEintraege, profil]);
  const zone = zoneOder(profil.manifest.variablen?.zeitzone);
  const pruefJetzt = useMemo(() => (stichtag ? isoLokalZuZeitpunkt(stichtag, zone)?.datum : undefined) ?? new Date(uhr), [stichtag, zone, uhr]);
  const red = useMemo(() => redaktionscheck(alleEintraege, profil, ausgabeWert, pruefJetzt), [alleEintraege, profil, ausgabeWert, pruefJetzt]);
  // Stand nur für vorhandene Befunde behalten: Ändert oder entfernt sich eine Meldung, ist ihr Befund wieder offen
  const befundSchluesselListe = useMemo(() => befundListe(red, profil).map((b) => b.schluessel), [red, profil]);
  useEffect(() => {
    if (!geladen) return;
    const gueltig = new Set(befundSchluesselListe);
    if (Object.keys(bearbeitung).some((k) => !gueltig.has(k))) setBearbeitung((alt) => Object.fromEntries(Object.entries(alt).filter(([k]) => gueltig.has(k))));
  }, [befundSchluesselListe, bearbeitung, geladen]);
  const offen = useMemo(() => offeneBefunde(red, profil, bearbeitung), [red, profil, bearbeitung]);
  /** Ganze Tage, die ein gesetzter Stichtag hinter der Geräteuhr liegt */
  const stichtagAlter = stichtag ? Math.floor((uhr - red.stand.jetzt.getTime()) / 864e5) : 0;
  const sortiert = useMemo(() => nachSchwere(svs, profil), [svs, profil]);
  const [meldungsFolge, setMeldungsFolge] = useState<MeldungsFolge>("stelle");
  const meldungenGeordnet = useMemo(() => {
    const hoechste = (e: LagebildEintrag) => Math.max(-1, ...svs.filter((x) => x.eintrag.id === e.id).map((x) => schwere(profil, x.beurteilung)));
    const nachStelle = (a: LagebildEintrag, b: LagebildEintrag) => absender(a, profil).localeCompare(absender(b, profil), "de");
    const vergleich =
      meldungsFolge === "zeit"
        ? (a: LagebildEintrag, b: LagebildEintrag) => zeitpunktVon(b, profil).localeCompare(zeitpunktVon(a, profil)) || nachStelle(a, b)
        : meldungsFolge === "beurteilung"
          ? (a: LagebildEintrag, b: LagebildEintrag) => hoechste(b) - hoechste(a) || nachStelle(a, b)
          : nachStelle;
    return [...eintraege].sort((a, b) => Number(eigen(b)) - Number(eigen(a)) || vergleich(a, b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eintraege, svs, profil, meldungsFolge]);
  /** Kennung → meldende Stelle aller geladenen Sachverhalte, zum Auflösen des Bezugs (seit 0.6.9) */
  const kennungsStelle = useMemo(() => {
    const m = new Map<string, string>();
    if (r.sv_kennung) for (const s of svs) m.set(String(holeWert(s.sv, r.sv_kennung) ?? ""), absender(s.eintrag, profil));
    return m;
  }, [svs, profil, r.sv_kennung]);

  const radarFeld = r.sv_radar ? feldUi(ui, `${r.sachverhalte}[].${r.sv_radar}`) : undefined;
  const radarDef = radarFeld ? radarFuer(ui, radarFeld) : undefined;
  // GK-2026-W44-15: Reiter „Lagenradar“ nur bei einem Radar im Profil, beschriftet wie das Radarfeld des Profils
  const reiterListe = REITER.flatMap((t) => (t.id !== "radar" ? [t] : radarDef ? [{ ...t, titel: radarFeld?.label || t.titel }] : []));
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
  const dateiZu = (e: LagebildEintrag) => dateien.find((d) => inhaltsKennung(d.text) === e.id);

  // Sprungziele beim Reiterwechsel (seit 0.6.7): Die Reiterleiste steht über dem Inhalt. Aus der Leiste nur bei Bedarf
  // und ohne Fokuswechsel; aus einer Kennzahl der Übersicht heraus mit Fokus auf den gewählten Reiter, weil die Kennzahl
  // mit der Übersicht verschwindet.
  // Die Leiste bleibt seit UX-2026-W45-03 unter dem Kopf stehen; Sprungziel ist darum ein Anker an ihrer Ruhelage
  const reiterRef = useRef<HTMLElement>(null);
  const reiterAnker = useRef<HTMLDivElement>(null);
  useAktivImBild(reiterRef, reiter);
  useKopfHoehe();
  const sprung = useSprung();
  const reiterWaehlen = (r: Reiter) => {
    setReiter(r);
    sprung(() => springeZu(reiterAnker.current, null, { nurWennNoetig: true }));
  };
  // Filter des Reiters „Sachverhalte“ (seit 0.6.20, UX-2026-W44-09); die fachlichen Kennzahlen setzen ihn (UX-2026-W44-10)
  const [svFilter, setSvFilter] = useState<SvFilter>(KEIN_FILTER);
  const sachverhalteZeigen = (f: SvFilter) => {
    setSvFilter(f);
    reiterZeigen("sachverhalte");
  };
  const reiterZeigen = (r: Reiter) => {
    setReiter(r);
    sprung(() => springeZu(reiterAnker.current, reiterRef.current?.querySelector<HTMLElement>("[aria-current]"), { fokus: true }));
  };

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

  // Vom Befund zum Sachverhalt (gefiltert und aufgeklappt) oder in die Erfassung (seit UX-2026-W45-22)
  const [svOffen, setSvOffen] = useState<string | null>(null);
  const zumSachverhalt = (s: SvEintrag) => {
    const kennung = r.sv_kennung ? String(holeWert(s.sv, r.sv_kennung) ?? "") : "";
    const name = svKennung(s, profil);
    return (
      <>
        <button
          type="button"
          className="knopf leise klein"
          aria-label={`Zum Sachverhalt: ${name}`}
          onClick={() => {
            setSvOffen(`${s.eintrag.id}-${s.index}`);
            sachverhalteZeigen({ ...KEIN_FILTER, suche: kennung || s.bezeichnung });
          }}
        >
          Zum Sachverhalt
        </button>
        {!s.eintrag.fremd && (
          <button type="button" className="knopf leise klein" aria-label={`In der Erfassung öffnen: ${name}`} onClick={() => oeffnen(s.eintrag.daten)}>
            In der Erfassung öffnen
          </button>
        )}
      </>
    );
  };

  const csv = () =>
    dateiAnbieten(alsCsv(rohtabelle(eintraege, profil)), mitDatum(exportStempel(zone, new Date(), "tag"), titel, "csv"), "text/csv;charset=utf-8");

  const [pdfFehler, setPdfFehler] = useState<string | null>(null);
  /** Vermerk zur Herkunft im Lagebild-PDF: Verteilung der Meldungen, gegebenenfalls die Auswahl des Filters */
  const herkunftVermerk = () => {
    const eigeneVermerk = eigeneGefiltert ? " Eigene Meldung ausgeblendet." : "";
    if (!r.herkunft) return eigeneVermerk.trim() || undefined;
    const verteilung = zaehle(eintraege.filter((e) => !e.fremd).map((e) => herkunftsrolleAnzeige(profil, herkunftsrolleVon(e, profil))))
      .map(([w, n]) => `${w}: ${n}`)
      .join(" · ");
    const auswahl = herkunftGefiltert
      ? ` Auswahl nach Herkunft; ausgeblendet: ${herkunftWerte
          .filter((w) => ausgeblendet.has(w))
          .map((w) => herkunftsrolleAnzeige(profil, w))
          .join(", ")}.`
      : "";
    return `Herkunft der Meldungen: ${verteilung || "keine"}.${auswahl}${eigeneVermerk}`;
  };
  const pdf = async () => {
    setPdfFehler(null);
    const tag = exportStempel(zone, new Date(), "tag");
    const kopf = [
      "Meldung",
      ...(r.herkunft ? ["Herkunft"] : []),
      "Sachverhalt",
      lBeurteilung,
      ...(r.sv_tendenz ? [lTendenz] : []),
      ...(ks.handlungsrelevant ? ["Handlungsrelevant bis"] : []),
    ];
    const zeilen = sortiert.map((s) => [
      absender(s.eintrag, profil),
      ...(r.herkunft ? [herkunftsrolleAnzeige(profil, s.herkunftsrolle)] : []),
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
          ...(r.herkunft ? [["Herkunft", herkunftsrolleAnzeige(profil, herkunftsrolleVon(e, profil))]] : []),
          ["Schemaprüfung", e.schema.length ? `${e.schema.length} Abweichung(en)` : "ohne Befund"],
        ],
      }));
    try {
      // Die PDF-Bibliothek wird erst bei Bedarf geladen (kleineres Haupt-JavaScript)
      const { lagebildAlsPdf } = await import("../dokumente/pdf");
      dateiAnbieten(lagebildAlsPdf(profil, titel, [kopf, ...zeilen], meldungen, heuteDE(), herkunftVermerk()), mitDatum(tag, titel, "pdf"), "application/pdf");
    } catch (e) {
      setPdfFehler(`Das PDF konnte nicht erzeugt werden (${(e as Error)?.message || String(e)}).`);
    }
  };

  // Entstehung der Meldung, so wie gespeichert; die SOP-Angaben gelten für die ganze Meldung
  // Seit UX-2026-W45-10 steht der Dateiname hier statt im Kartenkopf; ohne Entstehung als kleine Zeile
  const entstehungBlock = (e: LagebildEintrag) => {
    const ent = r.entstehung_feld ? holeWert(e.daten, r.entstehung_feld) : undefined;
    if (!ent || typeof ent !== "object") return <p className="lb-karte-meta lb-dateiname">Datei: {e.name}</p>;
    const sop = sopNachweis(ent);
    return (
      <details className="lb-entstehung">
        <summary>Entstehung{sop ? ` · SOP: ${Array.isArray(ent.sop) ? ent.sop.length : "–"}` : ""}</summary>
        <dl>
          <dt>Datei</dt>
          <dd className="lb-dateiname">{e.name}</dd>
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

  // Seit UX-2026-W45-01: Sind Meldungen geladen, ist die Ablage eine Zeile; Ziehen und Ablegen gilt für die ganze Ansicht
  const kompakt = alleEintraege.length > 0;

  return (
    <div
      className="lagebild"
      onDragOver={(e) => {
        if (!e.dataTransfer?.types?.includes("Files")) return;
        e.preventDefault();
        setZiehen(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setZiehen(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer?.files?.length) return;
        e.preventDefault();
        setZiehen(false);
        void auswahl(e.dataTransfer.files);
      }}
    >
      <div className="werkzeugleiste">
        <div className="werkzeugleiste-text">
          <h1>Auswertung</h1>
          <p>Auswertung von Meldungen mehrerer Stellen nach LEAD-Systematik</p>
        </div>
      </div>
      <ProfilZeile profil={profil} />

      <section className={["lb-ablage", kompakt ? "lb-ablage-kompakt" : "", ziehen ? "lb-ablage-aktiv" : ""].filter(Boolean).join(" ")}>
        {!kompakt && (
          <p>
            <strong>Meldungen hier ablegen</strong> (JSON-Dateien oder ZIP-Archive)
          </p>
        )}
        <div className="aktionen">
          <button type="button" className={kompakt ? "knopf" : "knopf primaer"} onClick={() => eingabe.current?.click()}>
            {kompakt ? "+ Meldungen hinzufügen" : "Dateien wählen"}
          </button>
          {beispiele.map((b) => (
            <button
              key={b.ordner}
              type="button"
              className={kompakt ? "knopf leise" : "knopf"}
              title={b.hinweis}
              onClick={() => hinzufuegen(beispielDateien(profil, b.ordner))}
            >
              Beispiel laden: {b.titel}
            </button>
          ))}
          {kompakt && <span className="hinweis lb-ablage-zusatz">oder JSON-/ZIP-Dateien in die Ansicht ziehen</span>}
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
        {!kompakt && (
          <p className="hinweis">
            Jede Datei wird nach dem Profil {profil.manifest.name} migriert und gegen das Schema {profil.manifest.meldung.schema_id} geprüft. Meldungen in
            fremdem Schema werden erkannt, aber nur für die KI-Verdichtung vorgehalten. Gleiche Dateiinhalte werden nur einmal geführt.
          </p>
        )}
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

      {alleEintraege.length === 0 ? (
        <p className="leer">Noch keine Meldungen geladen.</p>
      ) : (
        <>
          <div className="lb-leiste">
            <p className="lb-zahl">
              {kz.meldungen} Meldung{kz.meldungen === 1 ? "" : "en"}
              {kz.fremd ? ` und ${kz.fremd} in fremdem Schema` : ""} · {kz.sachverhalte} Sachverhalt{kz.sachverhalte === 1 ? "" : "e"}
            </p>
            {/* Ausgaben gebündelt, Übergabe als Hauptknopf; „Alle entfernen“ steht seit UX-2026-W45-02 in der Dateiliste */}
            <div className="werkzeugleiste-knoepfe">
              <Menue
                text="Ausgeben"
                klasse="knopf"
                beimOeffnen={pdfVorladen}
                eintraege={[
                  { text: "Lagebild als PDF", aktion: () => void pdf(), deaktiviert: !kz.meldungen },
                  { text: "Rohtabelle als CSV", aktion: csv, deaktiviert: !kz.meldungen },
                ]}
              />
              <button type="button" className="knopf primaer" ref={uebergabeKnopf} onClick={() => setUebergabeOffen((n) => n + 1)}>
                An KI-Verdichtung übergeben
              </button>
            </div>
          </div>
          {uebergabeOffen > 0 && (
            <LagebildUebergabe
              key={uebergabeOffen}
              profil={profil}
              eintraege={alleEintraege}
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
          <details className="lb-dateiliste" open={alleEintraege.length <= 4}>
            <summary>
              Dateien ({alleEintraege.length}){nAbweichungen ? ` · ${nAbweichungen} mit Schemaabweichung` : ""}
            </summary>
            <ul className="lb-dateien">
              {alleEintraege.map((e) => (
                <li key={e.id} title={e.schema.map((b) => b.text).join("\n") || undefined}>
                  <span className="lb-datei-name">{e.name}</span>
                  <Marken e={e} profil={profil} eigen={eigen(e)} />
                  <button type="button" className="lb-x" aria-label={`${e.name} entfernen`} onClick={() => entfernen(e.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="knopf leise klein lb-alle-entfernen" onClick={alleEntfernen}>
              Alle entfernen
            </button>
          </details>

          {(herkunftWerte.length > 0 || nEigene > 0) && (
            <div className="lb-auswahlfilter">
              {herkunftWerte.length > 0 && (
                <fieldset className="lb-herkunft">
                  <legend>Herkunft</legend>
                  <div className="lb-herkunft-werte">
                    {herkunftWerte.map((w) => {
                      const n = alleEintraege.filter((e) => herkunftsrolleVon(e, profil) === w).length;
                      return (
                        <label key={w}>
                          <input
                            type="checkbox"
                            checked={!ausgeblendet.has(w)}
                            onChange={(ev) => {
                              const an = ev.target.checked;
                              setAusgeblendet((alt) => {
                                const neu = new Set(alt);
                                if (an) neu.delete(w);
                                else neu.add(w);
                                return neu;
                              });
                            }}
                          />{" "}
                          {herkunftsrolleAnzeige(profil, w)} ({n})
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {nEigene > 0 && (
                <fieldset className="lb-eigene">
                  <legend>Eigene Meldung</legend>
                  <div className="lb-herkunft-werte">
                    <label>
                      <input type="checkbox" checked={!eigeneAusblenden} onChange={(ev) => setEigeneAusblenden(!ev.target.checked)} /> einbeziehen ({nEigene})
                    </label>
                  </div>
                </fieldset>
              )}
              {(herkunftGefiltert || eigeneGefiltert) && (
                <p className="hinweis">
                  Auswahl{herkunftGefiltert ? " nach Herkunft" : ""}
                  {herkunftGefiltert && eigeneGefiltert ? " und" : ""}
                  {eigeneGefiltert ? " ohne eigene Meldung" : ""}: {kz.meldungen + kz.fremd} von {alleEintraege.length} Meldungen in Übersicht, Meldungen,
                  Sachverhalten, Lagenradar, Kopiervorlage, Rohtabelle, PDF und CSV. Dateiliste, Meldestatus, Redaktionscheck und Übergabe berücksichtigen alle
                  Meldungen.
                </p>
              )}
            </div>
          )}

          <div ref={reiterAnker} className="lb-reiter-anker" aria-hidden="true" />
          <nav className="lb-reiter" aria-label="Ansichten" ref={reiterRef}>
            <ol>
              {reiterListe.map((t, i) => (
                <li key={t.id} className={i > 0 && reiterListe[i - 1]!.gruppe !== t.gruppe ? "lb-reiter-gruppe" : undefined}>
                  <button
                    type="button"
                    className={reiter === t.id ? "segment aktiv" : "segment"}
                    aria-current={reiter === t.id ? "page" : undefined}
                    onClick={() => reiterWaehlen(t.id)}
                  >
                    {t.titel}
                    {t.id === "redaktion" && offen > 0 && <span className="lb-zaehler">{offen}</span>}
                    {t.id === "redaktion" && stichtag && <span className="lb-stichtag-marke"> · Stichtag</span>}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {reiter === "uebersicht" && (
            <div>
              {/* Zwei Gruppen, jede Kachel führt zur passenden Ansicht; Kacheln mit 0 zurückgenommen (seit UX-2026-W45-06) */}
              <div className="lb-kennzahl-gruppen">
                <section className="lb-kennzahl-gruppe" aria-label="Lage">
                  <h3 className="lb-kennzahl-titel" aria-hidden="true">
                    Lage
                  </h3>
                  <div className="lb-kennzahlen">
                    <Kachel
                      zahl={kz.meldungen}
                      text="Meldungen"
                      zusatz={davonEigen(eintraege.filter((e) => eigen(e)).length, "eigene")}
                      onClick={() => reiterZeigen("meldungen")}
                    />
                    <Kachel
                      zahl={kz.sachverhalte}
                      text="Sachverhalte"
                      zusatz={davonEigen(svs.filter((x) => eigen(x.eintrag)).length)}
                      onClick={() => sachverhalteZeigen(KEIN_FILTER)}
                    />
                    {kz.hoch.map((h) => (
                      <Kachel
                        key={h.stufe}
                        zahl={h.anzahl}
                        text={`${lBeurteilung}: ${h.stufe}`}
                        rand={h.farbe}
                        zusatz={davonEigen(svs.filter((x) => x.beurteilung === h.stufe && eigen(x.eintrag)).length)}
                        onClick={() => sachverhalteZeigen({ ...KEIN_FILTER, beurteilung: h.stufe })}
                      />
                    ))}
                    {kz.verschaerfung && (
                      <Kachel
                        zahl={kz.verschaerfung.anzahl}
                        text={`${lTendenz}: ${kz.verschaerfung.wert}`}
                        rand="rot"
                        zusatz={davonEigen(svs.filter((x) => x.tendenz === kz.verschaerfung!.wert && eigen(x.eintrag)).length)}
                        onClick={() => sachverhalteZeigen({ ...KEIN_FILTER, tendenz: kz.verschaerfung!.wert })}
                      />
                    )}
                  </div>
                </section>
                <section className="lb-kennzahl-gruppe" aria-label="Redaktion">
                  <h3 className="lb-kennzahl-titel" aria-hidden="true">
                    Redaktion
                  </h3>
                  <div className="lb-kennzahlen">
                    <Kachel
                      zahl={offen}
                      text="offene Redaktionshinweise"
                      rand="orange"
                      gutBeiNull
                      zusatz={red.anzahl > offen ? `${red.anzahl - offen} bearbeitet` : undefined}
                      onClick={() => reiterZeigen("redaktion")}
                    />
                    <Kachel
                      zahl={kz.schemaAbweichungen}
                      text="Meldungen mit Schemaabweichung"
                      rand="rot"
                      gutBeiNull
                      onClick={() => reiterZeigen("redaktion")}
                    />
                  </div>
                </section>
              </div>

              {/* Offene Stellen zuerst mit Sammelerinnerung, gemeldete mit Zeitpunkt und Alter (seit UX-2026-W45-07) */}
              {status &&
                (() => {
                  const offen = status.zeilen.filter((z) => !z.eintraege.length);
                  const gemeldet = status.zeilen.filter((z) => z.eintraege.length);
                  const sammel = sammelErinnerungMailto(status.zeilen, profil.kontakte);
                  const letzte = (z: StatusZeile) =>
                    z.eintraege
                      .map((e) => zeitpunktVon(e, profil))
                      .filter(Boolean)
                      .sort()
                      .at(-1) ?? "";
                  return (
                    <>
                      <h3 className="abschnitt">
                        Meldestatus ({gemeldet.length} von {status.zeilen.length} gemeldet)
                      </h3>
                      {offen.length > 0 && (
                        <>
                          <div className="lb-status-kopf">
                            <h4>Offen ({offen.length})</h4>
                            {sammel ? (
                              <a className="knopf klein" href={sammel.href} title={`Ein E-Mail-Entwurf an ${sammel.anzahl} Stelle(n), Adressen in Bcc`}>
                                Alle offenen erinnern
                              </a>
                            ) : (
                              <span className="hinweis">Für eine Sammelerinnerung fehlen echte Adressen (kontakte.lokal.json des Profils).</span>
                            )}
                          </div>
                          <ul className="lb-status">
                            {offen.map((z) => (
                              <li key={z.name} className="lb-status-offen">
                                <span className="lb-status-zeichen" aria-hidden="true">
                                  ○
                                </span>
                                <span className="lb-status-name">{z.name}</span>
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
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {gemeldet.length > 0 && (
                        <>
                          <h4 className="lb-status-titel">Gemeldet ({gemeldet.length})</h4>
                          <ul className="lb-status">
                            {gemeldet.map((z) => {
                              const zp = letzte(z);
                              const alter = alterText(zp ? isoLokalZuZeitpunkt(zp, zone)?.datum : null, new Date(uhr));
                              return (
                                <li key={z.name} className="lb-status-da">
                                  <span className="lb-status-zeichen" aria-hidden="true">
                                    ✓
                                  </span>
                                  <span className="lb-status-name">{z.name}</span>
                                  {r.herkunft && (
                                    <Marke farbe="amt">
                                      Herkunft: {[...new Set(z.eintraege.map((e) => herkunftsrolleAnzeige(profil, herkunftsrolleVon(e, profil))))].join(", ")}
                                    </Marke>
                                  )}
                                  <span
                                    className="lb-status-zahl"
                                    title={z.eintraege.map((e) => `${absender(e, profil)} (${datumDE(zeitpunktVon(e, profil))})`).join("\n")}
                                  >
                                    {zp ? datumDE(zp) : "ohne Zeitpunkt"}
                                    {alter ? ` · ${alter}` : ""}
                                    {z.eintraege.length > 1 ? ` · ${z.eintraege.length} Meldungen` : ""}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                      {status.weitere.length > 0 && (
                        <p className="hinweis">
                          Weitere Meldungen ohne Eintrag in der Kontaktliste:{" "}
                          {status.weitere
                            .map((e) => absender(e, profil) + (r.herkunft ? ` (Herkunft: ${herkunftsrolleAnzeige(profil, herkunftsrolleVon(e, profil))})` : ""))
                            .join(" · ")}
                        </p>
                      )}
                    </>
                  );
                })()}

              {svs.length > 0 && (
                <>
                  <h3 className="abschnitt">Verteilungen</h3>
                  <div className="lb-verteilungen">
                    {/* Beurteilung und Tendenz mit allen Stufen des Schemas, auch 0 (seit UX-2026-W45-08) */}
                    {r.sv_beurteilung && (
                      <Balken
                        titel={lBeurteilung}
                        werte={stufenZaehlen(
                          svs.map((s) => s.beurteilung),
                          [...beurteilungsStufen(profil)].reverse(),
                        )}
                        farbe={(w) => farbeBeurteilung(profil, w)}
                      />
                    )}
                    {r.sv_tendenz && (
                      <Balken
                        titel={lTendenz}
                        werte={stufenZaehlen(
                          svs.map((s) => s.tendenz),
                          tendenzStufen(profil),
                        )}
                        farbe={(w) => farbeTendenz(profil, w)}
                      />
                    )}
                    {r.sv_art && (
                      <Balken
                        titel={`${bezeichnung(ui, `${r.sachverhalte}[].${r.sv_art}`)} (Mehrfachnennung)`}
                        werte={zaehle(svs.flatMap((s) => (s.arten.length ? s.arten : [""])))}
                      />
                    )}
                    {r.herkunft && (
                      <Balken
                        titel="Herkunft (Meldungen)"
                        werte={zaehle(eintraege.filter((e) => !e.fremd).map((e) => herkunftsrolleAnzeige(profil, herkunftsrolleVon(e, profil))))}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {reiter === "meldungen" && (
            <>
              {/* Sortierung, eigene Meldung zuerst und abgesetzt (seit UX-2026-W45-12) */}
              <div className="lb-svfilter" role="group" aria-label="Meldungen ordnen">
                <label className="lb-svfilter-feld">
                  <span>Sortieren nach</span>
                  <select value={meldungsFolge} onChange={(ev) => setMeldungsFolge(ev.target.value as MeldungsFolge)}>
                    <option value="stelle">Land/Stelle</option>
                    <option value="zeit">Meldezeitpunkt (neueste zuerst)</option>
                    <option value="beurteilung">höchster {lBeurteilung}</option>
                  </select>
                </label>
              </div>
              <div className="lb-karten">
                {meldungenGeordnet.map((e) => {
                  const eigene = svs.filter((s) => s.eintrag.id === e.id);
                  const nQuellen = r.quellen ? parseQuellen(holeWert(e.daten, r.quellen)).length : 0;
                  return (
                    <article
                      key={e.id}
                      id={`lb-meldung-${e.id}`}
                      tabIndex={-1}
                      className={["lb-karte", eigen(e) ? "lb-karte-eigen" : "", markiert === e.id ? "lb-karte-markiert" : ""].filter(Boolean).join(" ")}
                    >
                      <header>
                        <p className="lb-karte-titel">
                          <Absender e={e} profil={profil} />
                        </p>
                        <p className="lb-karte-meta">{zeitpunktVon(e, profil) ? datumDE(zeitpunktVon(e, profil)) : "ohne Meldezeitpunkt"}</p>
                      </header>
                      <div className="lb-karte-inhalt">
                        <p className="lb-marken">
                          <Marken e={e} profil={profil} eigen={eigen(e)} />
                        </p>
                        {e.fremd ? (
                          <>
                            <p className="hinweis">
                              Schema „{e.herkunft}“ mit {e.fremd.sachverhalte} Sachverhalt(en). Nicht auswertbar nach diesem Profil, aber an die KI-Verdichtung
                              übergebbar.
                            </p>
                            <p className="lb-karte-meta lb-dateiname">Datei: {e.name}</p>
                          </>
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
                            aria-label={`${absender(e, profil)} · ${e.name} in der Erfassung öffnen`}
                            onClick={() => oeffnen(e.daten)}
                          >
                            In der Erfassung öffnen
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
            </>
          )}

          {reiter === "sachverhalte" &&
            (sortiert.length === 0 ? (
              <p className="leer">Keine Sachverhalte in den geladenen Meldungen.</p>
            ) : (
              <Sachverhaltsliste
                profil={profil}
                sortiert={sortiert}
                filter={svFilter}
                setFilter={setSvFilter}
                kennungsStelle={kennungsStelle}
                offen={svOffen}
              />
            ))}

          {reiter === "radar" &&
            (!radarDef ? (
              <p className="leer">Dieses Profil sieht kein Lagenradar vor.</p>
            ) : (
              <Radarvergleich profil={profil} sortiert={sortiert} def={radarDef} feld={r.sv_radar!} />
            ))}

          {reiter === "tabelle" && (
            <div className="lb-rahmen" tabIndex={0} role="group" aria-label="Rohtabelle (waagerecht scrollbar)">
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
              zumSachverhalt={zumSachverhalt}
              bearbeitung={bearbeitung}
              setBearbeitung={setBearbeitung}
            />
          )}

          {reiter === "kopiervorlage" &&
            (sortiert.length === 0 ? <p className="leer">Keine Sachverhalte zum Aufbereiten.</p> : <Kopiervorlage profil={profil} sortiert={sortiert} />)}
        </>
      )}
    </div>
  );
}
