// KI-Erfassung (Modus A): Auftrag → S1 Gegenstand bestätigen (bei „Recherche durchführen“ mit Orientierungssuche und
// Bestätigung der Suchbegriffe) → S2 Recherche und Entwurf → S3 Prüfung → Übergabe.

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { anbieterListe, anbieterVon, fehlendeSchluessel, Verteiler, type Schluessel } from "../anbieter/verteiler";
import { formatUsd, kostenAnfrage } from "../anbieter/preise";
import { istVerbindungsabbruch, leereNutzung, TEXT_VERBINDUNGSABBRUCH } from "../anbieter/typen";
import { useWachhalten } from "./wachhalten";
import type { KopfLauf } from "./KiSymbol";
import type { Fortschritt } from "../anbieter/typen";
import type { Meldung, Profil } from "../kern/typen";
import { sopKennung } from "../profil/sop";
import { dateiAnbieten } from "../speicher/speicher";
import { VergleichKasten } from "./Vergleich";
import {
  laufModelle,
  mitModellwahl,
  aufwandFuer,
  modellFuer,
  orientierungJeSachverhalt,
  werkzeugeFuer,
  type Einstellungen,
  type ModellWahl as Modellwahl,
  type Rolle,
} from "../pipeline/einstellungen";
import { dauerText, s2UmfangWarnung, schaetzeStufe, type SchaetzArt } from "../pipeline/schaetzung";
import { LaufSchaetzung, type SchaetzStufe } from "./LaufSchaetzung";
import { ModellWahl, type StufeModell } from "./ModellWahl";
import type { EinstellungsBereich } from "./Einstellungen";
import { anwendungsbereich, ereignisarten, fachSops, istInhaltsgeruest, sopGruppen, sopsNachArtwechsel } from "../pipeline/kontext";
import { laufKostenText, neuerLauf, type Lauf, type S1Vorschlag, type Suchbegriff } from "../pipeline/lauf";
import { laeufeAlsZip, laeufeLaden, laeufeLoeschen, laufLoeschen, laufSpeichern, speicherSchuetzen } from "../speicher/laufSpeicher";
import { pflichtRegel } from "../pipeline/recherchetiefe";
import {
  dateiLesen,
  istMeldung,
  istVerdichtung,
  materialErgaenzen,
  vormeldungStand,
  absenderFuer,
  rolleSetzen,
  umklassifizieren,
  urlsAusText,
  type Material,
  type KiUebergabe,
} from "../pipeline/material";
import { orientierungMoeglich, orientierungssuche } from "../pipeline/orientierung";
import { rechercheNachweis } from "../pipeline/recherchebefunde";
import { stufe1 } from "../pipeline/s1";
import { s2Umfang, stufe2und3 } from "../pipeline/s2s3";
import type { Kontext } from "../pipeline/stufen";
import { werkzeugText } from "../pipeline/kontext";
import { dateistempel, exportStempel, jetztLokal, mitDatum } from "../kern/ausgabe";
import { gueltigerZeitpunkt, zoneOder } from "../kern/zeit";

interface Props {
  profil: Profil;
  einstellungen: Einstellungen;
  schluessel: Schluessel;
  /** Zu den Einstellungen, ohne Angabe in den Bereich „KI-Anbieter & API“ */
  zuEinstellungen: (bereich?: EinstellungsBereich) => void;
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

type Phase = "auftrag" | "s1" | "bestaetigen" | "orientierung" | "s2" | "ergebnis";

const PHASEN: { id: Phase; titel: string }[] = [
  { id: "auftrag", titel: "Auftrag und Material" },
  { id: "bestaetigen", titel: "Gegenstand bestätigen" },
  { id: "s2", titel: "Recherche und Entwurf" },
  { id: "ergebnis", titel: "Prüfung und Übergabe" },
];

/** Heutiger Tag in der Zeitzone des Profils (wie in der Pipeline, nicht in der des Geräts) */
function heute(zone: string | undefined): string {
  return jetztLokal(zoneOder(zone), new Date()).slice(0, 10);
}

function dauer(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}

function groesse(b: number): string {
  return b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

const ABRUF_FEHLER: Record<string, string> = {
  url_not_allowed: "Abruf von der Seite oder vom Anbieter gesperrt",
  url_not_accessible: "Seite nicht erreichbar",
  url_not_in_prior_context: "URL nicht aus Auftrag oder Suche",
  unsupported_content_type: "Inhaltstyp nicht unterstützt",
  max_uses_exceeded: "Höchstzahl der Abrufe erreicht",
  too_many_requests: "zu viele Anfragen",
  url_too_long: "URL zu lang",
  invalid_tool_input: "ungültige Adresse",
  unavailable: "Dienst vorübergehend nicht verfügbar",
};

const STATUS_TEXT: Record<Lauf["status"], string> = {
  s1: "S1 läuft",
  bestaetigen: "wartet auf Bestätigung",
  s2: "S2 läuft",
  s3: "S3 läuft",
  fertig: "fertig",
  fehler: "Fehler",
  abgebrochen: "abgebrochen",
};

/**
 * Beschriftungen, Hilfetexte und Platzhalter der Eingabefelder (Befunde KP-2026-W43-61 bis -68 vom 25.10.2026).
 * Nur Oberfläche: Speicherung, Prüfung und Übergabe an S1/S2 und die Bezeichnungen im Prompt bleiben unverändert.
 * Die Beispiele sind Platzhalter, nie Feldwerte.
 */
export const TEXT_FELD = {
  gegenstand: {
    label: "Untersuchungsgegenstand und Erkenntnisinteresse",
    hilfe:
      "Welche Lage oder welches Ereignis soll die KI-Recherche erfassen, für welchen Raum und Zeitraum? Bei Bedarf zusätzlich: aus welcher Perspektive. Ohne Angabe recherchiert die KI aus der allgemeinen Sicht des Bevölkerungsschutzes.",
    platzhalter: "Beispiel: Regionale Störungen der Kraftstoffversorgung seit Wochenbeginn, mit Blick auf Rettungsdienst und Notstromversorgung.",
  },
  ausgangsinformationen: {
    label: "Ausgangsinformationen und Stichworte",
    hilfe: "Welche Informationen liegen bereits vor? Eigene Notizen, Zahlen, Beobachtungen. Stichpunkte genügen; Unbestätigtes bitte kennzeichnen.",
    platzhalter:
      "Beispiel:\n– Dieselengpässe in mehreren Landkreisen gemeldet (unbestätigt)\n– Einzelne Tankstellen wegen Stromausfall außer Betrieb\n– Rettungsdienst meldet Tankprobleme bei Notstromaggregaten",
  },
  webseiten: {
    label: "Webseiten (eine Adresse je Zeile)",
    hilfe:
      "Die KI ruft die Seiten nur ab, wenn „Recherche durchführen“ eingeschaltet ist. Gesperrte Seiten im Browser als PDF speichern und unter „Dateien“ hinzufügen.",
    ohneWebsuche: "„Recherche durchführen“ ist ausgeschaltet: Die eingetragenen Seiten werden nicht abgerufen, die KI sieht nur die Adressen.",
  },
  stichtag: {
    label: "Stichtag der Meldung",
    hilfe:
      "Für welchen Tag soll die Meldung gelten? Die Uhrzeit ist optional; ohne Angabe schlägt die KI den Meldezeitpunkt vor. Für Übungen oder zurückliegende Lagen den damaligen Tag wählen.",
  },
  prueffrage: {
    label: "Besondere Prüffrage (optional)",
    hilfe: "Ein einzelner Punkt, den die Recherche gezielt prüfen soll, oder ein gewünschter Beobachtungszeitraum.",
    platzhalter: "Beispiel: Ist die Notstromversorgung von Krankenhäusern betroffen?",
  },
  gegenstandS1: {
    hilfe: "Von der KI aus dem Auftrag abgeleitet. Bei Bedarf anpassen; die Recherche richtet sich nach diesem Text.",
  },
  horizont: {
    label: "Betrachtungshorizont",
    hilfe: "Zeitraum, über den die Meldung mögliche Entwicklungen betrachtet, z. B. die kommenden Wochen.",
  },
  referenzbezug: {
    label: "Bezug zum Referenzraum",
    hilfe: (raum?: string) =>
      `Warum die Lage für den Betrachtungsraum des Profils${raum?.trim() ? ` (${raum.trim()})` : ""} bedeutsam ist, auch bei Ereignissen außerhalb, etwa über Lieferketten.`,
  },
} as const;

/**
 * Eingabefeld mit Beschriftung und Hilfetext. Der Hilfetext steht zwischen Beschriftung und Eingabe und ist per
 * aria-describedby verknüpft, nicht Teil des zugänglichen Namens; ein bedingter Zusatz wird mit verknüpft.
 */
function HilfeFeld({
  label,
  hilfe,
  zusatz,
  nach,
  lang,
  children,
}: {
  label: string;
  hilfe: string;
  zusatz?: string;
  /** Unter der Eingabe, z. B. ein Fehlertext */
  nach?: ReactNode;
  lang?: boolean;
  children: (a: { id: string; "aria-describedby": string }) => ReactNode;
}) {
  const id = useId();
  const beschreibung = [`${id}-hilfe`, zusatz ? `${id}-zusatz` : ""].filter(Boolean).join(" ");
  return (
    <div className={lang ? "feld feld-lang" : "feld"}>
      <label className="feld-label" htmlFor={id}>
        {label}
      </label>
      <p className="hinweis feld-hilfe" id={`${id}-hilfe`}>
        {hilfe}
      </p>
      {children({ id, "aria-describedby": beschreibung })}
      {nach}
      {zusatz && (
        <p className="kasten kasten-hinweis feld-zusatz" id={`${id}-zusatz`} role="status">
          {zusatz}
        </p>
      )}
    </div>
  );
}

const speicherText = (was: string, e: unknown) => `${was} (${(e as Error)?.message || "Speicherfehler"}).`;

export function KiErfassung({ profil, einstellungen, schluessel, zuEinstellungen, uebernehmen, uebergabe, uebergabeQuittieren, laufMelden, laufStand }: Props) {
  const [phase, setPhase] = useState<Phase>("auftrag");
  const [sachverhalt, setSachverhalt] = useState("");
  const [stichworte, setStichworte] = useState("");
  const [urlText, setUrlText] = useState("");
  const [stichtag, setStichtag] = useState(() => heute(profil.manifest.variablen?.zeitzone));
  /** Vorbelegter Stichtag: bleibt er unverändert, liest S1 den heutigen Tag beim Start neu (Seite über Mitternacht offen) */
  const vorbelegterStichtag = useRef(stichtag);
  const [prueffrage, setPrueffrage] = useState("");
  const [material, setMaterial] = useState<Material[]>([]);
  const [dateiFehler, setDateiFehler] = useState<string[]>([]);
  const [datenOk, setDatenOk] = useState(false);
  const [uhrzeit, setUhrzeit] = useState("");
  /** null = automatisch (aus bei Verdichtung, sonst an) */
  const [websucheWahl, setWebsucheWahl] = useState<boolean | null>(null);
  /** Modelle nur für diesen Lauf, abweichend von „Einstellungen“ */
  const [modellWahl, setModellWahl] = useState<Modellwahl>({});
  const laufEinstellungen = useMemo(() => mitModellwahl(einstellungen, modellWahl), [einstellungen, modellWahl]);
  const [lauf, setLauf] = useState<Lauf | null>(null);
  const [vorschlag, setVorschlag] = useState<S1Vorschlag | null>(null);
  const [protokoll, setProtokoll] = useState<{ zeit: number; text: string }[]>([]);
  const [zeichen, setZeichen] = useState(0);
  const [fehler, setFehler] = useState<string | null>(null);
  const [start, setStart] = useState(0);
  const [jetzt, setJetzt] = useState(Date.now());
  const [laeufe, setLaeufe] = useState<Lauf[]>([]);
  const [sammelAktion, setSammelAktion] = useState(false);
  const abbruch = useRef<AbortController | null>(null);
  // Laufende Anfrage beim Verlassen (Profilwechsel) kontrolliert abbrechen; der Lauf bleibt als abgebrochen protokolliert
  useEffect(() => () => abbruch.current?.abort(), []);
  const dateiRef = useRef<HTMLInputElement>(null);

  const arten = useMemo(() => ereignisarten(profil), [profil]);
  const sops = useMemo(() => fachSops(profil), [profil]);
  const sopGliederung = useMemo(() => sopGruppen(profil), [profil]);
  const urls = urlsAusText(urlText);
  const laeuft = phase === "s1" || phase === "orientierung" || phase === "s2";
  const laufMeldenRef = useRef(laufMelden);
  laufMeldenRef.current = laufMelden;
  useEffect(() => {
    laufMeldenRef.current?.(laeuft);
  }, [laeuft]);
  useEffect(
    () => () => {
      laufMeldenRef.current?.(false);
    },
    [],
  );

  const neuLaden = async () => {
    try {
      setLaeufe((await laeufeLaden()).filter((l) => l.profil.id === profil.manifest.id));
    } catch (e) {
      setFehler(`Frühere Läufe konnten nicht aus dem Gerätespeicher gelesen werden (${(e as Error)?.message || "Speicherfehler"}).`);
    }
  };
  useEffect(() => {
    void neuLaden();
  }, [profil]);

  const hintergrund = useWachhalten(laeuft);

  useEffect(() => {
    if (!laeuft) return;
    const t = window.setInterval(() => setJetzt(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [laeuft]);

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
    setMaterial((alt) => materialErgaenzen(alt, neu));
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
    setProtokoll((p) => (p[p.length - 1]?.text === text ? p : [...p, { zeit: Date.now(), text }]));
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
        setLauf({ ...x });
        await laufSpeichern(x).catch((e) => setFehler(speicherText("Das Laufprotokoll konnte nicht im Gerät gespeichert werden", e)));
      },
      fortschritt,
    };
  };

  const fehlerBehandeln = async (l: Lauf, e: any) => {
    const abgebrochen = e?.name === "AbortError";
    l.status = abgebrochen ? "abgebrochen" : "fehler";
    const s = Math.round(hintergrund.current / 1000);
    const zusatz = s > 0 ? ` Die Seite war während des Laufs ${s} s im Hintergrund oder gesperrt.` : "";
    l.fehler = abgebrochen ? "Von der Person abgebrochen." : (istVerbindungsabbruch(e) ? TEXT_VERBINDUNGSABBRUCH : String(e?.message || e)) + zusatz;
    setLauf({ ...l });
    setFehler(l.fehler);
    await laufSpeichern(l).catch((e) => setFehler(`${l.fehler} ${speicherText("Das Laufprotokoll konnte nicht im Gerät gespeichert werden", e)}`));
    void neuLaden();
  };

  const s1Starten = async () => {
    setFehler(null);
    // Beim ersten Lauf den Speicher der App vor automatischer Räumung schützen lassen (TP-2026-W44-10)
    void speicherSchuetzen();
    const tag = !uhrzeit && stichtag === vorbelegterStichtag.current ? heute(profil.manifest.variablen?.zeitzone) : stichtag;
    if (tag !== stichtag) {
      vorbelegterStichtag.current = tag;
      setStichtag(tag);
    }
    const l = neuerLauf(
      profil,
      {
        sachverhalt,
        stichworte,
        urls: urls.gueltig,
        stichtag: tag,
        prueffrage,
        websuche,
        ...(uhrzeit && tag ? { meldezeitpunkt: `${tag}T${uhrzeit}` } : {}),
      },
      material.map((m) => ({ name: m.name, art: m.art, groesse: m.groesse, hash: m.hash, ...(m.rolleGewaehlt ? { rolleGewaehlt: true } : {}) })),
    );
    setLauf(l);
    setProtokoll([]);
    setStart(Date.now());
    setPhase("s1");
    try {
      const v = await stufe1(kontext(l));
      setVorschlag(structuredClone(v));
      setPhase("bestaetigen");
      // Lauf nach S1 auch unter „Frühere Läufe“ zeigen (Protokoll schon jetzt exportierbar)
      void neuLaden();
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
    void neuLaden();
  };

  /** Orientierungssuche je Sachverhalt (Bestandteil von S1, seit 0.6.0); `nur`: nur diese Sachverhalte (Index ab 0) */
  const orientierungStarten = async (nur?: number[]) => {
    if (!lauf || !vorschlag) return;
    setFehler(null);
    setProtokoll([]);
    setZeichen(0);
    setStart(Date.now());
    setPhase("orientierung");
    const l = lauf;
    try {
      const v = await orientierungssuche(kontext(l), vorschlag, nur);
      setVorschlag(structuredClone(v));
    } catch (e: any) {
      setFehler(
        e?.name === "AbortError"
          ? "Orientierungssuche abgebrochen. Suchbegriffe lassen sich selbst eintragen, oder die Orientierung neu starten."
          : `Die Orientierungssuche ist gescheitert: ${istVerbindungsabbruch(e) ? TEXT_VERBINDUNGSABBRUCH : String(e?.message || e)}`,
      );
      l.status = "bestaetigen";
      setLauf({ ...l });
      await laufSpeichern(l).catch(() => {});
    }
    setPhase("bestaetigen");
  };

  const neueErfassung = () => {
    const etwasDa = sachverhalt || stichworte || urlText || prueffrage || material.length || lauf;
    if (
      etwasDa &&
      !confirm(
        "Neue KI-Erfassung beginnen? Auftrag, Material und der angezeigte Lauf werden geleert. Gespeicherte Läufe bleiben unter „Frühere Läufe“ erhalten.",
      )
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
      setDateiFehler(["Die Meldungen aus dem Lagebild wurden nicht übernommen, weil gerade ein Lauf läuft. Nach dem Lauf erneut übergeben."]);
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
      setMaterial((alt) => materialErgaenzen(alt, neu));
      setDateiFehler(fehlerListe);
    })();
    const eingaengeN = uebergabe.dateien.filter((d) => d.rolle === "eingang").length;
    setSachverhalt(
      (alt) => alt || (eingaengeN ? `Lagebild aus ${eingaengeN} Eingangsmeldung${eingaengeN === 1 ? "" : "en"} verdichten` : "Eigene Meldung fortschreiben"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uebergabe?.nr]);

  function leeren() {
    setPhase("auftrag");
    setLauf(null);
    setVorschlag(null);
    setFehler(null);
    setProtokoll([]);
    setZeichen(0);
    setSachverhalt("");
    setStichworte("");
    setUrlText("");
    const tag = heute(profil.manifest.variablen?.zeitzone);
    vorbelegterStichtag.current = tag;
    setStichtag(tag);
    setPrueffrage("");
    setMaterial([]);
    setDateiFehler([]);
    setDatenOk(false);
    setUhrzeit("");
    setWebsucheWahl(null);
    setModellWahl({});
  }

  const protokollName = (l: Lauf) => {
    const zone = profil.manifest.variablen?.zeitzone;
    return mitDatum(dateistempel(l.erstellt, zone) ?? exportStempel(zone), `KI-LEAD_Lauf_${l.id}`, "json");
  };

  const protokollExport = (l: Lauf) => {
    dateiAnbieten(JSON.stringify(l, null, 2), protokollName(l), "application/json");
  };

  /** Alle gelisteten Läufe dieses Profils als eine ZIP-Datei (je Lauf ein Protokoll wie beim Einzelexport) */
  const alleAlsZip = async () => {
    if (!laeufe.length) return;
    setSammelAktion(true);
    try {
      const zip = await laeufeAlsZip(laeufe, protokollName);
      const zone = profil.manifest.variablen?.zeitzone;
      dateiAnbieten(zip, mitDatum(exportStempel(zone), `KI-LEAD_Laeufe_${profil.manifest.id}`, "zip"), "application/zip");
    } catch (e) {
      setFehler(speicherText("Die Läufe konnten nicht als ZIP-Datei zusammengestellt werden", e));
    } finally {
      setSammelAktion(false);
    }
  };

  /** Alle gelisteten Läufe dieses Profils samt Protokoll aus dem Gerätespeicher löschen (nach Rückfrage) */
  const alleLoeschen = async () => {
    const n = laeufe.length;
    if (!n) return;
    const frage = `${n === 1 ? "Den einen früheren Lauf" : `Alle ${n} früheren Läufe`} mit diesem Profil samt Protokoll löschen? Das lässt sich nicht rückgängig machen. Zum Aufbewahren vorher „Alle als ZIP speichern“ wählen.`;
    if (!confirm(frage)) return;
    setSammelAktion(true);
    try {
      await laeufeLoeschen(laeufe.map((l) => l.id));
    } catch (e) {
      setFehler(speicherText("Die Läufe konnten nicht vollständig gelöscht werden", e));
    } finally {
      setSammelAktion(false);
      void neuLaden();
    }
  };

  const setzeSv = (i: number, teil: Partial<S1Vorschlag["sachverhalte"][number]>) => {
    if (!vorschlag) return;
    const sv = vorschlag.sachverhalte.map((s, j) => (j === i ? { ...s, ...teil } : s));
    setVorschlag({ ...vorschlag, sachverhalte: sv });
  };

  const artUmschalten = (i: number, art: string) => {
    const s = vorschlag?.sachverhalte[i];
    if (!s) return;
    const neu = sopsNachArtwechsel(profil, s.sops, s.ereignisarten, art);
    setzeSv(i, { ereignisarten: neu.arten, sops: neu.sops });
  };

  const aktivIndex = phase === "s1" ? 0 : PHASEN.findIndex((p) => p.id === (phase === "orientierung" ? "bestaetigen" : phase));
  const eingaenge = material.filter((m) => m.art === "eingang");
  const vormeldungsStand = vormeldungStand(material, profil);
  const absender = useMemo(() => absenderFuer(material, profil), [material, profil]);
  // Umfang der Anfrage an S2 vor dem Start (seit 0.6.4, TP-2026-W44-31); Material ist nur je Datei begrenzt
  const umfangS2 = useMemo(
    () => (lauf && vorschlag ? s2UmfangWarnung(s2Umfang(profil, material, lauf.auftrag.urls, lauf.auftrag.stichworte, vorschlag)) : ""),
    [profil, material, lauf, vorschlag],
  );
  const t0Ungueltig = !!vorschlag?.meldezeitpunkt && !gueltigerZeitpunkt(vorschlag.meldezeitpunkt);
  const verdichtung = eingaenge.length > 0;
  const websuche = websucheWahl ?? !verdichtung;
  // Orientierungssuche und Pflichtsuchen (seit 0.6.0, KP-2026-W44-06)
  const rechercheLauf = !!lauf && lauf.auftrag.websuche !== false;
  const orientierungAn = !!lauf && orientierungMoeglich({ einstellungen: laufEinstellungen, profil, lauf, material }).an;
  const orientiert = !!vorschlag?.sachverhalte.some((sv) => sv.orientierung !== undefined);
  const regel = pflichtRegel(laufEinstellungen);
  const suchbegriffeZeigen =
    rechercheLauf &&
    regel.max > 0 &&
    werkzeugeFuer(modellFuer(verdichtung ? "verdichtung" : "erfassung", laufEinstellungen, profil), laufEinstellungen).websuche;
  const setzeBegriffe = (i: number, liste: Suchbegriff[]) => setzeSv(i, { suchbegriffe: liste });
  const nichtZugeordnet = vorschlag && verdichtung ? eingaenge.filter((m) => !vorschlag.sachverhalte.some((s) => s.eingangsmeldungen?.includes(m.name))) : [];

  // Stand für den KI-Chip der Kopfleiste: nur die Stufe, damit die App beim Streaming nicht mitzeichnet
  const laufStandRef = useRef(laufStand);
  laufStandRef.current = laufStand;
  const kopfStufe = phase === "s1" || phase === "orientierung" ? "s1" : phase === "s2" ? (lauf?.status === "s3" ? "s3" : "s2") : null;
  useEffect(() => {
    laufStandRef.current?.(kopfStufe ? { stufe: kopfStufe, verdichtung } : null);
  }, [kopfStufe, verdichtung]);
  useEffect(() => () => laufStandRef.current?.(null), []);

  const zusammenfuehren = (i: number) => {
    if (!vorschlag || i < 1) return;
    const a = vorschlag.sachverhalte[i - 1];
    const b = vorschlag.sachverhalte[i];
    if (!a || !b) return;
    const vereint = {
      titel: [a.titel, b.titel].filter(Boolean).join(" / "),
      ereignisarten: [...new Set([...a.ereignisarten, ...b.ereignisarten])],
      sops: [...new Set([...a.sops, ...b.sops])],
      begruendung: [a.begruendung, b.begruendung].filter(Boolean).join(" "),
      ...(a.eingangsmeldungen || b.eingangsmeldungen
        ? { eingangsmeldungen: [...new Set([...(a.eingangsmeldungen || []), ...(b.eingangsmeldungen || [])])] }
        : {}),
    };
    setVorschlag({ ...vorschlag, sachverhalte: [...vorschlag.sachverhalte.slice(0, i - 1), vereint, ...vorschlag.sachverhalte.slice(i + 1)] });
  };

  const fehlend = fehlendeSchluessel(laufModelle(laufEinstellungen, profil, istVerdichtung(material)), schluessel);
  const stufeS2: StufeModell = verdichtung
    ? { rolle: "verdichtung", kurz: "S2", titel: "S2 Verdichtung", art: "verdichtung" }
    : { rolle: "erfassung", kurz: "S2", titel: "S2 Recherche und Entwurf", art: "erfassung" };
  const stufeS3: StufeModell = { rolle: "reparatur", kurz: "S3", titel: "S3 Reparatur (nur bei Schemafehlern)", nebenbei: true };
  const schaetzS2: SchaetzStufe = { kurz: "S2", rolle: stufeS2.rolle, art: verdichtung ? "verdichtung" : "erfassung" };
  const dauerFuer = (rolle: Rolle, art: SchaetzArt) => {
    const t = dauerText(schaetzeStufe(art, modellFuer(rolle, laufEinstellungen, profil), aufwandFuer(rolle, laufEinstellungen, profil)).sekunden);
    return t === "Dauer ohne Messwert" ? "einige Minuten (für dieses Modell liegen noch keine Messwerte vor)" : t;
  };
  const modellwahl = (stufen: StufeModell[], mitWebsuche: boolean, kopf?: ReactNode, nachher?: ReactNode) => (
    <ModellWahl
      stufen={stufen}
      einstellungen={einstellungen}
      profil={profil}
      schluessel={schluessel}
      wahl={modellWahl}
      onChange={setModellWahl}
      websuche={mitWebsuche}
      kopf={kopf}
      zuEinstellungen={() => zuEinstellungen("modelle")}
    >
      {nachher}
    </ModellWahl>
  );
  const protokollKnopf = (l: Lauf, text = "Laufprotokoll exportieren") => (
    <button type="button" className="knopf leise" onClick={() => protokollExport(l)}>
      {text}
    </button>
  );
  const kannStarten = !fehlend.length && datenOk && (sachverhalt.trim() || stichworte.trim() || urls.gueltig.length || material.length);

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
                  <span className="schritt-titel">{p.id === "bestaetigen" && orientierungAn ? "Gegenstand und Suchbegriffe bestätigen" : p.titel}</span>
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
                  {lauf && <div className="aktionen">{protokollKnopf(lauf, "Laufprotokoll des abgebrochenen Laufs exportieren")}</div>}
                </div>
              )}
              <HilfeFeld lang label={TEXT_FELD.gegenstand.label} hilfe={TEXT_FELD.gegenstand.hilfe}>
                {(a) => (
                  <textarea
                    {...a}
                    rows={3}
                    value={sachverhalt}
                    onChange={(e) => setSachverhalt(e.target.value)}
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
                    onChange={(e) => setStichworte(e.target.value)}
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
                {(a) => <textarea {...a} rows={3} value={urlText} onChange={(e) => setUrlText(e.target.value)} placeholder="https://…" />}
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
                            onClick={() => setMaterial((a) => a.map((x) => (x.id === m.id ? umklassifizieren(x, profil) : x)))}
                          >
                            {m.art === "meldung" ? "Als Eingang behandeln" : "Als Vormeldung behandeln"}
                          </button>
                        )}
                        <button type="button" className="knopf leise klein" onClick={() => setMaterial((a) => a.filter((x) => x.id !== m.id))}>
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
                    <input type="date" aria-label="Stichtag" value={stichtag} onChange={(e) => setStichtag(e.target.value)} />
                    <input type="time" aria-label="Uhrzeit (optional)" value={uhrzeit} disabled={!stichtag} onChange={(e) => setUhrzeit(e.target.value)} />
                  </div>
                  <div className="datumzeit-knoepfe">
                    <button
                      type="button"
                      className="knopf leise klein"
                      aria-label="Jetzt: Stichtag und Uhrzeit auf aktuelle Zeit setzen"
                      onClick={() => {
                        const j = jetztLokal(zoneOder(profil.manifest.variablen?.zeitzone), new Date());
                        setStichtag(j.slice(0, 10));
                        setUhrzeit(j.slice(11, 16));
                      }}
                    >
                      Jetzt
                    </button>
                    {uhrzeit && (
                      <button type="button" className="knopf leise klein" aria-label="Nur Tag: Uhrzeit entfernen" onClick={() => setUhrzeit("")}>
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
                      onChange={(e) => setPrueffrage(e.target.value)}
                      placeholder={TEXT_FELD.prueffrage.platzhalter}
                    />
                  )}
                </HilfeFeld>
              </div>
              {verdichtung && (
                <div className="kasten kasten-info" role="status">
                  <h3>Verdichtung</h3>
                  <p>
                    {eingaenge.length} Eingangsmeldung{eingaenge.length === 1 ? "" : "en"} anderer Stellen erkannt. Die KI verdichtet sie zu einer eigenen
                    Meldung mit möglichst wenigen Sachverhalten (SOP-LEAD A.7).
                  </p>
                </div>
              )}
              {/* Recherche, Modelle und Schätzung in einem Rahmen, danach die Bestätigung (seit 0.5.22, Punkt 9) */}
              {modellwahl(
                [{ rolle: "vorverarbeitung", kurz: "S1", titel: "S1 Gegenstand und SOP-Auswahl", art: "s1" }, stufeS2, stufeS3],
                websuche,
                <label className="schalter">
                  <input type="checkbox" checked={websuche} onChange={(e) => setWebsucheWahl(e.target.checked)} />
                  <span>
                    Recherche durchführen
                    <span className="hinweis">
                      {" "}
                      {verdichtung ? "Bei Verdichtung standardmäßig aus, z. B. für fiktive Übungslagen." : "Ohne Haken arbeitet die KI nur mit dem Material."}
                    </span>
                  </span>
                </label>,
                <>
                  <p className="hinweis">
                    {rechercheZeile(
                      websuche,
                      laufEinstellungen,
                      modellFuer(stufeS2.rolle, laufEinstellungen, profil),
                      modellFuer("vorverarbeitung", laufEinstellungen, profil),
                    )}
                  </p>
                  <LaufSchaetzung stufen={[{ kurz: "S1", rolle: "vorverarbeitung", art: "s1" }, schaetzS2]} einstellungen={laufEinstellungen} profil={profil} />
                </>,
              )}
              <label className="bestaetigung">
                <input type="checkbox" checked={datenOk} onChange={(e) => setDatenOk(e.target.checked)} />
                <span>
                  Ich gebe nur fiktive oder offen zugängliche Inhalte weiter, keine personenbezogenen und keine eingestuften Daten. Die Inhalte gehen an{" "}
                  {anbieterListe([...new Set(laufModelle(laufEinstellungen, profil, verdichtung).map(anbieterVon))])}.
                </span>
              </label>
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
                  : phase === "orientierung"
                    ? "Stufe S1: Orientierungssuche"
                    : lauf?.status === "s3"
                      ? "Stufe S3: Prüfung und Reparatur"
                      : "Stufe S2: Recherche und Entwurf"}
              </h2>
              <p className="einleitung">
                {phase === "s1"
                  ? `Die KI ordnet den Auftrag ein. Das dauert voraussichtlich ${dauerFuer("vorverarbeitung", "s1")}.`
                  : phase === "orientierung"
                    ? "Die KI sucht je Sachverhalt kurz im Web, ohne Seiten zu öffnen, und schlägt daraus Suchbegriffe für die Recherche in S2 vor. Das dauert meist unter einer Minute."
                    : `Die KI ${verdichtung ? "verdichtet die Eingänge" : "recherchiert"} und schreibt den Entwurf. Das dauert voraussichtlich ${dauerFuer(stufeS2.rolle, schaetzS2.art)}. Bitte die Seite im Vordergrund lassen; die App hält den Bildschirm so lange wach.`}
              </p>
              <div className="laufanzeige">
                <span className="puls" aria-hidden="true" />
                <span>
                  {dauer(jetzt - start)}
                  {zeichen > 0 ? ` · ${zeichen.toLocaleString("de-DE")} Zeichen geschrieben` : ""}
                  {lauf?.kostenUsd || lauf?.kostenBekanntUsd ? ` · bisher ${laufKostenText(lauf)}` : ""}
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
              {!!vorschlag.appHinweise?.length && (
                <div className="kasten kasten-hinweis" role="status">
                  <h3>Hinweise der App</h3>
                  {vorschlag.appHinweise.map((h, i) => (
                    <p key={i}>{h}</p>
                  ))}
                </div>
              )}
              {vorschlag.hinweise && (
                <div className="kasten kasten-info">
                  <h3>Hinweise aus S1</h3>
                  <p>{vorschlag.hinweise}</p>
                </div>
              )}
              <HilfeFeld lang label={TEXT_FELD.gegenstand.label} hilfe={TEXT_FELD.gegenstandS1.hilfe}>
                {(a) => <textarea {...a} rows={3} value={vorschlag.gegenstand} onChange={(e) => setVorschlag({ ...vorschlag, gegenstand: e.target.value })} />}
              </HilfeFeld>
              <div className="gruppe-spalten-zwei">
                <label className="feld">
                  <span className="feld-label">Stichtag</span>
                  <input type="date" value={vorschlag.stichtag} onChange={(e) => setVorschlag({ ...vorschlag, stichtag: e.target.value })} />
                </label>
                <label className="feld">
                  <span className="feld-label">Meldezeitpunkt (t0)</span>
                  <div className="datum-zeit">
                    <input
                      type="date"
                      aria-label="Datum t0"
                      value={(vorschlag.meldezeitpunkt || "").slice(0, 10)}
                      onChange={(e) =>
                        setVorschlag({ ...vorschlag, meldezeitpunkt: `${e.target.value}T${(vorschlag.meldezeitpunkt || "").slice(11, 16) || "12:00"}` })
                      }
                    />
                    <input
                      type="time"
                      aria-label="Uhrzeit t0"
                      value={(vorschlag.meldezeitpunkt || "").slice(11, 16)}
                      onChange={(e) =>
                        setVorschlag({
                          ...vorschlag,
                          meldezeitpunkt: `${(vorschlag.meldezeitpunkt || "").slice(0, 10) || vorschlag.stichtag}T${e.target.value}`,
                        })
                      }
                    />
                  </div>
                  {t0Ungueltig && (
                    <span className="fehlertext" id="t0-ungueltig" role="alert">
                      Bitte Datum und Uhrzeit des Meldezeitpunkts vollständig angeben; S2 startet erst mit einem gültigen t0.
                    </span>
                  )}
                  <span className="hinweis">
                    Bezugszeitpunkt der Bewertung. Bei Übungs- oder Altlagen kurz nach dem jüngsten Datenstand des Materials.
                    {vormeldungsStand && ` Stand der Vormeldung: ${zeitAnzeige(vormeldungsStand)} (Ausgangspunkt, nicht t0).`}
                  </span>
                </label>
                <HilfeFeld label={TEXT_FELD.horizont.label} hilfe={TEXT_FELD.horizont.hilfe}>
                  {(a) => <input {...a} type="text" value={vorschlag.horizont} onChange={(e) => setVorschlag({ ...vorschlag, horizont: e.target.value })} />}
                </HilfeFeld>
              </div>
              <HilfeFeld label={TEXT_FELD.referenzbezug.label} hilfe={TEXT_FELD.referenzbezug.hilfe(profil.manifest.referenzraum)}>
                {(a) => (
                  <input {...a} type="text" value={vorschlag.referenzbezug} onChange={(e) => setVorschlag({ ...vorschlag, referenzbezug: e.target.value })} />
                )}
              </HilfeFeld>
              <label className="feld">
                <span className="feld-label">Besondere Prüffrage</span>
                <input type="text" value={vorschlag.prueffrage} onChange={(e) => setVorschlag({ ...vorschlag, prueffrage: e.target.value })} />
              </label>
              {vorschlag.prueffrageVorschlag && !vorschlag.prueffrage && (
                <p className="hinweis prueffrage-vorschlag">
                  Vorschlag aus S1, nicht übernommen (der Auftrag nennt keine Prüffrage): „{vorschlag.prueffrageVorschlag}“{" "}
                  <button type="button" className="knopf klein" onClick={() => setVorschlag({ ...vorschlag, prueffrage: vorschlag.prueffrageVorschlag || "" })}>
                    Übernehmen
                  </button>
                </p>
              )}

              {verdichtung && vorschlag.sachverhalte.length > 3 && (
                <div className="kasten kasten-hinweis" role="status">
                  <p>
                    {vorschlag.sachverhalte.length} Sachverhalte bei einer Verdichtung: Prüfe, ob mehrere Meldungen dasselbe Ereignis beschreiben und sich
                    zusammenführen lassen (SOP-LEAD A.7.1).
                  </p>
                </div>
              )}
              {nichtZugeordnet.length > 0 && (
                <div className="kasten kasten-hinweis" role="status">
                  <p>Keinem Sachverhalt zugeordnet: {nichtZugeordnet.map((m) => m.eingang?.land || m.name).join(", ")}.</p>
                </div>
              )}
              <div className="liste">
                {vorschlag.sachverhalte.map((s, i) => (
                  <div key={i} className="element">
                    <div className="element-kopf">
                      <h3>
                        <span className="element-nr">Sachverhalt {i + 1}</span>
                      </h3>
                      <div className="aktionen">
                        {i > 0 && (
                          <button type="button" className="knopf leise klein" onClick={() => zusammenfuehren(i)}>
                            Mit Sachverhalt {i} zusammenführen
                          </button>
                        )}
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
                    </div>
                    <label className="feld">
                      <span className="feld-label">Titel</span>
                      <input type="text" value={s.titel} onChange={(e) => setzeSv(i, { titel: e.target.value })} />
                    </label>
                    {s.begruendung && <p className="hinweis">Begründung S1: {s.begruendung}</p>}
                    {verdichtung && (
                      <fieldset className="feld">
                        <legend className="feld-label">Eingangsmeldungen</legend>
                        <div className="mehrfach">
                          {eingaenge.map((m) => {
                            const an = !!s.eingangsmeldungen?.includes(m.name);
                            return (
                              <label key={m.id} className={an ? "chip an" : "chip"} title={m.name}>
                                <input
                                  type="checkbox"
                                  checked={an}
                                  onChange={() =>
                                    setzeSv(i, {
                                      eingangsmeldungen: an
                                        ? (s.eingangsmeldungen || []).filter((x) => x !== m.name)
                                        : [...(s.eingangsmeldungen || []), m.name],
                                    })
                                  }
                                />
                                {[m.eingang?.land, m.eingang?.zeitpunkt?.slice(11, 16)].filter(Boolean).join(" ") || m.name}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}
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
                      <legend className="feld-label">SOPs und Bausteine für diesen Sachverhalt</legend>
                      <p className="hinweis">
                        Die gewählten Abschnitte gehen mit vollem Text an die KI; Teil A (gemeinsame Regeln) geht immer mit. Bausteine im Status „Inhaltsgerüst“
                        ergänzen die Dach-SOP nur als Prüfhinweise.
                      </p>
                      {sopGliederung.map((g) => (
                        <div key={g.titel} className="sop-gruppe">
                          <p className="sop-gruppe-titel">{g.titel}</p>
                          <div className="mehrfach">
                            {g.sops.map((x) => (
                              <label key={x.id} className={s.sops.includes(x.id) ? "chip an" : "chip"} title={x.lageart || undefined}>
                                <input
                                  type="checkbox"
                                  checked={s.sops.includes(x.id)}
                                  onChange={() => setzeSv(i, { sops: s.sops.includes(x.id) ? s.sops.filter((y) => y !== x.id) : [...s.sops, x.id] })}
                                />
                                {sopKennung(x).replace(/^SOP-LEAD /, "")}
                                {istInhaltsgeruest(x) && <span className="sop-status">Inhaltsgerüst</span>}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      {s.sops.length > 0 && (
                        <details className="sop-details">
                          <summary>Anwendungsbereich der gewählten SOPs und Bausteine ({s.sops.length})</summary>
                          {sops
                            .filter((x) => s.sops.includes(x.id))
                            .map((x) => (
                              <div key={x.id} className="sop-auszug">
                                <strong>{sopKennung(x).replace(/^SOP-LEAD /, "")}</strong>
                                {x.status && <p className="hinweis">Status: {x.status}</p>}
                                <pre>{anwendungsbereich(x.text)}</pre>
                              </div>
                            ))}
                        </details>
                      )}
                    </fieldset>
                    {suchbegriffeZeigen && (
                      <fieldset className="feld suchbegriffe">
                        <legend className="feld-label">Orientierung und Suchbegriffe für S2</legend>
                        {s.orientierung === undefined ? (
                          orientiert && orientierungAn ? (
                            <p className="hinweis">
                              Für diesen Sachverhalt lief noch keine Orientierungssuche.{" "}
                              <button type="button" className="knopf klein" onClick={() => orientierungStarten([i])}>
                                Orientierung suchen
                              </button>
                            </p>
                          ) : null
                        ) : s.orientierung.length === 0 ? (
                          <p className="hinweis">Die Orientierungssuche blieb ohne Websuche. Suchbegriffe bitte selbst eintragen.</p>
                        ) : (
                          <>
                            <p className="hinweis">
                              Orientierungssuche:{" "}
                              {s.orientierung.map((o) => (o.suchbegriff ? `„${o.suchbegriff}“` : "ohne Angabe des Suchbegriffs")).join(", ")}
                              {s.orientierung.some((o) => o.treffer.length)
                                ? "; Treffer (Rechercheeinstiege für S2, nicht geprüft):"
                                : "; keine Treffer übermittelt."}
                            </p>
                            {s.orientierung.some((o) => o.treffer.length) && (
                              <ul className="orientierung-treffer">
                                {s.orientierung
                                  .flatMap((o) => o.treffer)
                                  .map((t, j) => (
                                    <li key={j}>
                                      <a href={t.url} target="_blank" rel="noopener noreferrer">
                                        {t.titel && t.titel !== t.url ? t.titel : kurzeAdresse(t.url)}
                                      </a>
                                      {t.datum ? ` (${t.datum})` : ""}
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </>
                        )}
                        {(s.suchbegriffe || []).map((b, j) => (
                          <div key={j} className="suchbegriff">
                            <input
                              type="text"
                              aria-label={`Suchbegriff ${j + 1} für Sachverhalt ${i + 1}`}
                              value={b.begriff}
                              onChange={(e) =>
                                setzeBegriffe(
                                  i,
                                  (s.suchbegriffe || []).map((x, k) => (k === j ? { ...x, begriff: e.target.value, herkunft: "person" as const } : x)),
                                )
                              }
                            />
                            <input
                              type="text"
                              aria-label={`Zweck von Suchbegriff ${j + 1} für Sachverhalt ${i + 1}`}
                              placeholder="Zweck, z. B. B02/R2"
                              value={b.zweck}
                              onChange={(e) =>
                                setzeBegriffe(
                                  i,
                                  (s.suchbegriffe || []).map((x, k) => (k === j ? { ...x, zweck: e.target.value, herkunft: "person" as const } : x)),
                                )
                              }
                            />
                            <input
                              type="text"
                              aria-label={`Zielquelle von Suchbegriff ${j + 1} für Sachverhalt ${i + 1}`}
                              placeholder="Zielquelle"
                              value={b.zielquelle || ""}
                              onChange={(e) =>
                                setzeBegriffe(
                                  i,
                                  (s.suchbegriffe || []).map((x, k) => (k === j ? { ...x, zielquelle: e.target.value, herkunft: "person" as const } : x)),
                                )
                              }
                            />
                            <button
                              type="button"
                              className="knopf leise klein"
                              onClick={() =>
                                setzeBegriffe(
                                  i,
                                  (s.suchbegriffe || []).filter((_, k) => k !== j),
                                )
                              }
                            >
                              Entfernen
                            </button>
                          </div>
                        ))}
                        {(s.suchbegriffe || []).length < regel.jeSachverhalt && (
                          <button
                            type="button"
                            className="knopf leise klein"
                            onClick={() => setzeBegriffe(i, [...(s.suchbegriffe || []), { begriff: "", zweck: "", herkunft: "person" }])}
                          >
                            Suchbegriff hinzufügen
                          </button>
                        )}
                        <p className="hinweis">
                          Bis zu {regel.jeSachverhalt} Begriff{regel.jeSachverhalt === 1 ? "" : "e"} je Sachverhalt, insgesamt höchstens {regel.max}, sind
                          Pflichtsuchen in S2 (Recherchetiefe „{regel.titel}“). S2 führt sie zuerst aus und recherchiert danach im übrigen Kontingent.
                        </p>
                      </fieldset>
                    )}
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
                Kosten S1: {laufKostenText(lauf)}.{" "}
                {rechercheZeile(
                  lauf?.auftrag.websuche !== false,
                  laufEinstellungen,
                  modellFuer(stufeS2.rolle, laufEinstellungen, profil),
                  modellFuer("vorverarbeitung", laufEinstellungen, profil),
                )}{" "}
                {absenderZeile(absender)}
              </p>
              {modellwahl(
                [stufeS2, stufeS3],
                lauf?.auftrag.websuche !== false,
                undefined,
                <>
                  <LaufSchaetzung stufen={[schaetzS2]} einstellungen={laufEinstellungen} profil={profil} />
                  {umfangS2 && (
                    <p className="kasten kasten-hinweis" role="status">
                      {umfangS2}
                    </p>
                  )}
                </>,
              )}
              <div className="schritt-nav">
                <div className="aktionen">
                  <button type="button" className="knopf leise" onClick={() => setPhase("auftrag")}>
                    Zurück zum Auftrag
                  </button>
                  {lauf && protokollKnopf(lauf, "Laufprotokoll exportieren (S1)")}
                </div>
                {orientierungAn && !orientiert ? (
                  <button
                    type="button"
                    className="knopf primaer"
                    onClick={() => orientierungStarten()}
                    disabled={!vorschlag.sachverhalte.length || t0Ungueltig}
                    aria-describedby={t0Ungueltig ? "t0-ungueltig" : undefined}
                  >
                    Gegenstand bestätigen und Orientierung suchen (S1)
                  </button>
                ) : (
                  <div className="aktionen">
                    {orientierungAn && (
                      <button type="button" className="knopf leise" onClick={() => orientierungStarten()} disabled={!vorschlag.sachverhalte.length}>
                        Orientierung erneut suchen
                      </button>
                    )}
                    <button
                      type="button"
                      className="knopf primaer"
                      onClick={s2Starten}
                      disabled={!vorschlag.sachverhalte.length || t0Ungueltig}
                      aria-describedby={t0Ungueltig ? "t0-ungueltig" : undefined}
                    >
                      {istVerdichtung(material) ? "Bestätigen und verdichten (S2)" : "Bestätigen und recherchieren (S2)"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {phase === "ergebnis" && lauf && (
            <Ergebnis
              profil={profil}
              aendern={async (l) => {
                setLauf(l);
                await laufSpeichern(l).catch((e) => setFehler(speicherText("Die Änderung am Lauf konnte nicht im Gerät gespeichert werden", e)));
              }}
              lauf={lauf}
              fehler={fehler}
              uebernehmen={uebernehmen}
              exportieren={() => protokollExport(lauf)}
              erneut={vorschlag ? s2Starten : undefined}
              modellwahl={vorschlag ? modellwahl([stufeS2, stufeS3], lauf?.auftrag.websuche !== false) : undefined}
            />
          )}
        </section>
      </div>

      {laeufe.length > 0 && (
        <details className="frueher">
          <summary>Frühere Läufe mit diesem Profil ({laeufe.length})</summary>
          <div className="aktionen frueher-sammel">
            <button type="button" className="knopf leise klein" disabled={sammelAktion} onClick={alleAlsZip}>
              Alle als ZIP speichern
            </button>
            <button
              type="button"
              className="knopf leise klein"
              disabled={sammelAktion || laeuft}
              aria-describedby={laeuft ? "frueher-sammel-laeuft" : undefined}
              onClick={alleLoeschen}
            >
              Alle löschen
            </button>
          </div>
          {laeuft && (
            <p id="frueher-sammel-laeuft" className="hinweis">
              „Alle löschen“ ist erst möglich, wenn der laufende KI-Lauf beendet ist.
            </p>
          )}
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
                  <td>{laufKostenText(l)}</td>
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
                          await laufLoeschen(l.id).catch((e) => setFehler(speicherText("Der Lauf konnte nicht gelöscht werden", e)));
                          void neuLaden();
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

/** Adresse als Linktext, wenn der Anbieter keinen Titel liefert: Host und gekürzter Pfad (seit 0.6.1, KP-2026-W44-19) */
export function kurzeAdresse(url: string, laenge = 60): string {
  try {
    const u = new URL(url);
    const text = `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : decodeURIComponent(u.pathname)}`;
    return text.length > laenge ? `${text.slice(0, laenge - 1)}…` : text;
  } catch {
    return url;
  }
}

/** „TT.MM.JJJJ, hh:mm Uhr“ aus „JJJJ-MM-TTThh:mm“ */
function zeitAnzeige(z: string): string {
  return `${z.slice(8, 10)}.${z.slice(5, 7)}.${z.slice(0, 4)}, ${z.slice(11, 16)} Uhr`;
}

/**
 * Tatsächliche Recherche nach dem Lauf (gleiche Zählung wie die Befunde). Seit 0.6.0 getrennt ausgewiesen:
 * Orientierungssuchen in S1 (nicht angerechnet), Recherche in S2 einschließlich Nachforderung, Pflichtsuchen.
 */
function RechercheZeile({
  n,
  pflicht,
}: {
  n: { websuchen: number; abrufe: number; zaehlerVollstaendig: boolean; orientierung?: number; nachgefordert?: boolean };
  pflicht?: { ausgefuehrt: string | null }[];
}) {
  const nichts = n.websuchen === 0 && n.abrufe === 0;
  const erledigt = pflicht?.filter((p) => p.ausgefuehrt).length ?? 0;
  return (
    <p className={nichts && n.zaehlerVollstaendig ? "hinweis recherche-null" : "hinweis"}>
      Recherche in S2:{" "}
      {nichts && !n.zaehlerVollstaendig
        ? "nicht nachweisbar."
        : `${n.websuchen} Websuche${n.websuchen === 1 ? "" : "n"}, ${n.abrufe} Seitenabruf${n.abrufe === 1 ? "" : "e"}.`}
      {pflicht?.length ? ` Pflichtsuchen: ${erledigt} von ${pflicht.length} ausgeführt.` : ""}
      {n.nachgefordert ? " Die App hat einmal nachgefordert." : ""}
      {n.orientierung
        ? ` Dazu in S1 ${n.orientierung} Orientierungssuche${n.orientierung === 1 ? "" : "n"} (nicht auf das Kontingent von S2 angerechnet).`
        : ""}
      {nichts && n.zaehlerVollstaendig ? " Keine Recherche, obwohl „Recherche durchführen“ gewählt war." : ""}
    </p>
  );
}

/** Absender der neuen Meldung vor S2 (Land, meldende Stelle, Herkunft) */
function absenderZeile(a: { land: string; stelle: string; herkunft: "vormeldung" | "profil"; fremd: string[] }): string {
  const wer = [a.land, a.stelle].filter(Boolean).join(" · ");
  if (!wer) return "";
  const woher = a.herkunft === "vormeldung" ? "aus der eigenen Vormeldung" : "aus dem Profil";
  return `Absender: ${wer} (${woher}${a.fremd.length ? "; die gewählte Vormeldung einer anderen Stelle ändert ihn nicht" : ""}).`;
}

/**
 * Recherchemodus vor dem Lauf, aus Auftrag und Einstellungen (wie die Pipeline). Seit 0.6.0 mit Pflichtsuchen nach der
 * Recherchetiefe und der Orientierungssuche in S1, die getrennt ausgewiesen und nicht angerechnet wird (KP-2026-W44-09).
 */
function rechercheZeile(websuche: boolean, e: Einstellungen, modellS2?: string, modellS1?: string): string {
  if (!websuche) return "S2 arbeitet ohne Websuche nur mit dem Material.";
  if (e.websucheMax <= 0 && e.abrufMax <= 0) return "S2: „Recherche durchführen“ gewählt, aber in den Einstellungen nicht verfügbar (Höchstzahlen 0).";
  const w = modellS2 ? werkzeugeFuer(modellS2, e) : { websuche: true, abruf: true };
  const websucheMax = w.websuche ? e.websucheMax : 0;
  const abrufMax = w.abruf ? e.abrufMax : 0;
  if (websucheMax <= 0 && abrufMax <= 0)
    return w.websuche
      ? `S2: „Recherche durchführen“ gewählt, aber ${modellS2} bietet keinen Seitenabruf und die Websuche steht in den Einstellungen auf 0.`
      : `S2: „Recherche durchführen“ gewählt, aber ${modellS2} über den EU-Endpunkt von Mistral bietet keine Websuche; S2 arbeitet nur mit dem Material. Für Websuche unter „Einstellungen“ den globalen Endpunkt wählen.`;
  const teile = [`S2: Recherche durchführen (${werkzeugText(websucheMax, abrufMax)}).`];
  const regel = pflichtRegel(e);
  if (websucheMax > 0 && regel.max > 0)
    teile.push(
      `Zuerst bis zu ${regel.max} Pflichtsuche${regel.max === 1 ? "" : "n"} aus den bestätigten Suchbegriffen (Recherchetiefe „${regel.titel}“: ${regel.jeSachverhalt} je Sachverhalt), danach eigene Recherche im übrigen Kontingent.`,
    );
  const o = orientierungJeSachverhalt(e);
  if (o && websucheMax > 0 && modellS1) {
    if (!werkzeugeFuer(modellS1, e).websuche) teile.push(`Orientierungssuche in S1 nicht möglich: ${modellS1} bietet keine Websuche.`);
    else {
      const gebuehr = kostenAnfrage(modellS1, { ...leereNutzung(), websuchen: 1 });
      teile.push(
        `Vorher in S1 ${o} Orientierungssuche${o === 1 ? "" : "n"} je Sachverhalt ohne Seitenabruf, nicht auf das Kontingent angerechnet${
          gebuehr ? ` (Suchgebühr etwa ${formatUsd(gebuehr)} je Suche zuzüglich Token)` : ""
        }.`,
      );
    }
  }
  return teile.join(" ");
}

function Ergebnis({
  profil,
  aendern,
  lauf,
  fehler,
  uebernehmen,
  exportieren,
  erneut,
  modellwahl,
}: {
  profil: Profil;
  aendern: (l: Lauf) => void;
  lauf: Lauf;
  fehler: string | null;
  uebernehmen: (m: Meldung) => void;
  exportieren: () => void;
  erneut?: () => void;
  /** Modellwahl für „S2 erneut starten“ */
  modellwahl?: ReactNode;
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
      {e && lauf.auftrag.websuche !== false && (e.recherche || s2) && (
        <RechercheZeile n={e.recherche ?? rechercheNachweis({ nutzung: s2!.nutzung, suchen: e.suchen })} pflicht={e.pflichtsuchen} />
      )}

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

      {e?.abrufFehler && e.abrufFehler.length > 0 && (
        <div className="ki-abschnitt">
          <h3>Nicht abrufbare Seiten</h3>
          <ul className="befunde">
            {e.abrufFehler.map((f, i) => (
              <li key={i} className={`befund ${lauf.auftrag.urls.includes(f.url) ? "befund-warnung" : "befund-hinweis"}`}>
                <span className="befund-stufe">{lauf.auftrag.urls.includes(f.url) ? "Deine URL" : "Hinweis"}</span> {f.url} ({ABRUF_FEHLER[f.code] || f.code})
              </li>
            ))}
          </ul>
          <p className="hinweis">
            Manche Seiten sperren den Abruf durch KI-Dienste. Speichere die Seite im Browser als PDF oder kopiere den Text in die Stichworte und starte einen
            neuen Auftrag.
          </p>
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

      {e && (
        <VergleichKasten
          profil={profil}
          meldung={e.meldung}
          laufId={lauf.id}
          gespeichert={lauf.vergleich}
          speichern={(v) => aendern({ ...lauf, vergleich: v })}
        />
      )}

      <details className="ki-abschnitt">
        <summary>Laufprotokoll: {laufKostenText(lauf)} gesamt</summary>
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

      {!e && erneut && modellwahl}
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
