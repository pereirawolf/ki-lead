import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ladeProfil } from "./profil/laden";
import { eingebauteProfile } from "./profil/eingebaut";
import { leererWert } from "./kern/schema";
import { jetztLokal } from "./kern/ausgabe";
import type { Befund, Meldung, Profil } from "./kern/typen";
import {
  aktivesProfilLesen,
  dateiAnbieten,
  aktivesProfilSetzen,
  profileLaden,
  profilLoeschen,
  profilSpeichern,
  profilArchivieren,
  zwischenstandLesen,
  zwischenstandSchreiben,
} from "./speicher/speicher";
import { MeldungAnsicht } from "./ui/Meldung";
import { kurzfassungLeeren } from "./ui/Kurzfassung";
import { ProfileAnsicht } from "./ui/Profile";
import { KiErfassung } from "./ui/KiErfassung";
import { EinstellungenAnsicht } from "./ui/Einstellungen";
import { LagebildAnsicht } from "./ui/Lagebild";
import type { KiUebergabe, UebergabeMeldung } from "./pipeline/material";
import { Fehlergrenze } from "./ui/Fehlergrenze";
import { alleSchluesselLesen, einstellungenLesen, einstellungenSchreiben, schluesselSchreiben, STANDARD, type Einstellungen } from "./pipeline/einstellungen";
import { LEERE_SCHLUESSEL, type AnbieterId, type Schluessel } from "./anbieter/verteiler";
import { anwenden, aufloesen, PROFIL, systemVorgabe } from "./darstellung/thema";
import {
  darstellungLesen,
  darstellungSchreiben,
  lokaleFarbenLesen,
  lokaleFarbenLoeschen,
  lokaleFarbenSchreiben,
  startLesen,
  startSchreiben,
} from "./darstellung/speicher";
import type { ProfilFarbschema } from "./darstellung/typen";
import { exportStempel, mitDatum } from "./kern/ausgabe";

export interface ProfilEintrag {
  schluessel: string;
  quelle: "eingebaut" | "importiert";
  dateien: Record<string, string>;
  importiertAm?: string;
  profil: Profil | null;
  befunde: Befund[];
}

type Ansicht = "meldung" | "ki" | "lagebild" | "profile" | "einstellungen";

function neueMeldung(p: Profil): Meldung {
  const d = leererWert(p.schema, p.schema) as Meldung;
  const r = p.ui.rollen;
  d[r.status_feld] = r.status_entwurf;
  const props = p.schema.properties || {};
  for (const [k, v] of Object.entries(p.manifest.variablen)) if (k in props && k in d) d[k] = v;
  if (r.meldezeitpunkt && r.meldezeitpunkt in d) d[r.meldezeitpunkt] = jetztLokal(p.manifest.variablen.zeitzone);
  const liste = d[r.sachverhalte];
  if (Array.isArray(liste) && liste.length === 0) {
    const el = leererWert(p.schema.properties?.[r.sachverhalte]?.items, p.schema);
    d[r.sachverhalte] = [el];
  }
  return d;
}

/** Name der Notfallsicherung: bewusst ohne Profilvorlage, damit eine defekte Meldung die Sicherung nicht verhindert */
function sicherungsName(zone?: string): string {
  try {
    return mitDatum(exportStempel(zone), "KI-LEAD_Meldung_Sicherung", "json");
  } catch {
    return "KI-LEAD_Meldung_Sicherung.json";
  }
}

export default function App() {
  const [profile, setProfile] = useState<ProfilEintrag[]>([]);
  const [aktiv, setAktiv] = useState<string>();
  const [ansicht, setAnsicht] = useState<Ansicht>("meldung");
  const [meldung, setMeldungRoh] = useState<Meldung | null>(null);
  /** Zählt Dokumentinstanzen der Meldungsmaske (neue Meldung, geöffnete Datei, Übernahme, Profilwechsel) */
  const [dokumentNr, setDokumentNr] = useState(0);
  const [gesichert, setGesichert] = useState<string>();
  /** Ausstehende Speicherungen je Profil (Entprellung), damit ein Profilwechsel nichts verliert */
  const ausstehend = useRef(new Map<string, { daten: Meldung; timer: number }>());
  const aktivesProfilId = useRef<string>();
  const [speicherFehler, setSpeicherFehler] = useState<string | null>(null);
  const [einstellungen, setEinstellungenRoh] = useState<Einstellungen>(STANDARD);
  const [schluessel, setSchluesselRoh] = useState<Schluessel>(LEERE_SCHLUESSEL);
  const [kiUebergabe, setKiUebergabe] = useState<KiUebergabe | null>(null);
  /** Laufende Nummer der Übergaben; bleibt nach dem Quittieren erhalten, damit jede Übergabe neu ist */
  const uebergabeNr = useRef(0);

  const profil = profile.find((p) => p.schluessel === aktiv)?.profil || null;

  // Farbschema der Oberfläche: Auswahl (global) und eigene Farben des aktiven Profils (lokal, an Schlüssel und Prüfsumme gebunden)
  const [farbStart] = useState(() => startLesen());
  const [farbAuswahl, setFarbAuswahlRoh] = useState(farbStart.auswahl);
  const [lokaleFarben, setLokaleFarben] = useState<ProfilFarbschema | undefined>();
  /** Profil, für das die eigenen Farben gelesen sind (Schlüssel#Prüfsumme); bis dahin gilt der Startcache */
  const [farbenGelesenFuer, setFarbenGelesenFuer] = useState<string | null>(null);
  const farbSchreiben = useRef(Promise.resolve());
  useEffect(() => {
    darstellungLesen()
      .then((d) => setFarbAuswahlRoh(d.auswahl))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    setLokaleFarben(undefined);
    if (!aktiv || !profil) return;
    let gueltig = true;
    const fuer = `${aktiv}#${profil.hash}`;
    lokaleFarbenLesen(aktiv, profil.hash)
      .then((f) => gueltig && setLokaleFarben(f))
      .catch(() => undefined)
      .finally(() => gueltig && setFarbenGelesenFuer(fuer));
    return () => {
      gueltig = false;
    };
  }, [aktiv, profil]);
  // Solange Profil und eigene Farben noch laden, gilt bei „profil“ die Definition aus dem Startcache (kein Aufblitzen)
  const profilFarbenBereit = !!profil && farbenGelesenFuer === `${aktiv}#${profil.hash}`;
  // Systemeinstellungen hell/dunkel und „mehr Kontrast“ für „Automatisch“ (bei Änderung sofort übernommen)
  const [system, setSystem] = useState(systemVorgabe);
  useEffect(() => {
    if (!window.matchMedia) return;
    const abfragen = ["(prefers-color-scheme: dark)", "(prefers-contrast: more)"].map((q) => window.matchMedia(q));
    const neu = () => setSystem(systemVorgabe());
    abfragen.forEach((mq) => mq.addEventListener?.("change", neu));
    return () => abfragen.forEach((mq) => mq.removeEventListener?.("change", neu));
  }, []);
  const thema = useMemo(
    () =>
      farbAuswahl === PROFIL && !profilFarbenBereit
        ? aufloesen(PROFIL, farbStart.profil)
        : aufloesen(farbAuswahl, profil?.manifest.farbschema, lokaleFarben, system),
    [farbAuswahl, profilFarbenBereit, farbStart, profil, lokaleFarben, system],
  );
  useEffect(() => {
    anwenden(thema);
    if (farbAuswahl !== PROFIL || profilFarbenBereit)
      startSchreiben(thema.auswahl, thema.quelle === "lokal" ? lokaleFarben : thema.quelle === "profil" ? profil?.manifest.farbschema : undefined);
  }, [thema, lokaleFarben, profil, farbAuswahl, profilFarbenBereit]);
  /** Auswahl sofort anwenden; Speichern nacheinander, damit nach dem Neuladen die letzte Auswahl gilt */
  const setFarbAuswahl = (auswahl: string) => {
    setFarbAuswahlRoh(auswahl);
    farbSchreiben.current = farbSchreiben.current
      .then(() => darstellungSchreiben({ version: 1, auswahl }))
      .catch((e) => speicherProblem("Das Farbschema gilt nur bis zum Neuladen; es konnte nicht im Gerät gespeichert werden", e));
  };
  const eigeneFarbenSpeichern = async (f: ProfilFarbschema | null) => {
    if (!aktiv || !profil) return;
    if (f) await lokaleFarbenSchreiben(aktiv, profil.hash, f);
    else await lokaleFarbenLoeschen(aktiv, profil.hash);
    setLokaleFarben(f || undefined);
    if (f) setFarbAuswahl(PROFIL);
  };

  /** Meldet einen Fehler des Gerätespeichers sichtbar (IndexedDB gesperrt, voll oder defekt). */
  const speicherProblem = useCallback((was: string, e: unknown) => {
    setSpeicherFehler(`${was} (${(e as Error)?.message || "Speicherfehler"}).`);
  }, []);

  useEffect(() => {
    einstellungenLesen()
      .then(setEinstellungenRoh)
      .catch((e) => speicherProblem("Die gespeicherten Einstellungen konnten nicht gelesen werden; es gelten die Vorgaben", e));
    alleSchluesselLesen()
      .then(setSchluesselRoh)
      .catch((e) => speicherProblem("Die gespeicherten API-Schlüssel konnten nicht gelesen werden", e));
  }, [speicherProblem]);

  const setEinstellungen = (e: Einstellungen) => {
    setEinstellungenRoh(e);
    einstellungenSchreiben(e).catch((x) => speicherProblem("Die Einstellungen gelten nur bis zum Neuladen; sie konnten nicht im Gerät gespeichert werden", x));
  };

  const setSchluessel = (id: AnbieterId, wert: string) => {
    setSchluesselRoh((alt) => ({ ...alt, [id]: wert }));
    schluesselSchreiben(wert, id).catch((x) => speicherProblem("Der API-Schlüssel gilt nur bis zum Neuladen; er konnte nicht im Gerät gespeichert werden", x));
  };

  /** Meldung in der Maske durch eine andere ersetzen; die Management Summary der alten Meldung wird geleert. */
  const meldungErsetzen = (m: Meldung) => {
    setMeldung(m);
    setDokumentNr((n) => n + 1);
    if (profil) kurzfassungLeeren(profil.manifest.id);
  };

  const kiUebernehmen = (m: Meldung) => {
    if (!confirm("Den KI-Entwurf in die Meldungsmaske übernehmen? Die dort geöffnete Meldung wird ersetzt.")) return;
    meldungErsetzen(m);
    setAnsicht("meldung");
  };

  const lagebildOeffnen = (m: Meldung) => {
    if (!confirm("Diese Meldung in die Meldungsmaske übernehmen? Die dort geöffnete Meldung wird ersetzt.")) return;
    meldungErsetzen(m);
    setAnsicht("meldung");
  };

  const anKiUebergeben = (dateien: UebergabeMeldung[]) => {
    // Aus der Verdichtung entsteht eine neue Meldung: die bisherige Management Summary gilt nicht mehr
    if (!profil) return;
    kurzfassungLeeren(profil.manifest.id);
    uebergabeNr.current += 1;
    setKiUebergabe({ nr: uebergabeNr.current, profilHash: profil.hash, dateien });
    setAnsicht("ki");
  };

  const uebergabeQuittieren = useCallback((nr: number) => setKiUebergabe((alt) => (alt?.nr === nr ? null : alt)), []);

  useEffect(() => {
    (async () => {
      // Ein einzelnes defektes Profil oder ein nicht lesbarer Gerätespeicher darf die übrigen Profile nicht verdecken.
      const sicherLaden = async (dateien: Record<string, string>) => {
        try {
          return await ladeProfil(dateien);
        } catch (e) {
          return { profil: null, befunde: [{ stufe: "fehler" as const, text: `Das Profil konnte nicht geladen werden: ${(e as Error)?.message || e}` }] };
        }
      };
      const eintraege: ProfilEintrag[] = [];
      for (const e of eingebauteProfile()) {
        const erg = await sicherLaden(e.dateien);
        eintraege.push({ schluessel: e.ordner, quelle: "eingebaut", dateien: e.dateien, profil: erg.profil, befunde: erg.befunde });
      }
      let gespeichert: Awaited<ReturnType<typeof profileLaden>> = [];
      try {
        gespeichert = await profileLaden();
      } catch (e) {
        speicherProblem("Importierte Profile konnten nicht aus dem Gerätespeicher gelesen werden; verfügbar sind nur die mitgelieferten Profile", e);
      }
      for (const g of gespeichert) {
        const erg = await sicherLaden(g.dateien);
        eintraege.push({
          schluessel: g.schluessel,
          quelle: "importiert",
          dateien: g.dateien,
          importiertAm: g.importiertAm,
          profil: erg.profil,
          befunde: erg.befunde,
        });
      }
      setProfile(eintraege);
      const gemerkt = await aktivesProfilLesen().catch((e) => {
        speicherProblem("Das zuletzt gewählte Profil konnte nicht gelesen werden; aktiv ist das erste verfügbare", e);
        return undefined;
      });
      const start = eintraege.find((e) => e.schluessel === gemerkt && e.profil) || eintraege.find((e) => e.profil);
      if (start) setAktiv(start.schluessel);
    })();
  }, []);

  const schreiben = useCallback(async (id: string, p: Profil, daten: Meldung) => {
    const jetzt = new Date();
    try {
      await zwischenstandSchreiben(id, { gespeichertAm: jetzt.toISOString(), daten, profilVersion: p.manifest.version, profilHash: p.hash });
      if (aktivesProfilId.current === id) setGesichert(jetzt.toLocaleString("de-DE"));
      setSpeicherFehler(null);
    } catch (e) {
      setSpeicherFehler(
        `Der Zwischenstand konnte nicht im Gerät gespeichert werden (${(e as Error).message || "Speicherfehler"}). Bitte die Meldung als JSON sichern.`,
      );
    }
  }, []);

  /** Alle ausstehenden Speicherungen sofort schreiben (Profilwechsel, Seite wird verlassen). */
  const ausstehendSchreiben = useCallback(() => {
    for (const [id, a] of ausstehend.current) {
      window.clearTimeout(a.timer);
      const p = profile.find((x) => x.profil?.manifest.id === id)?.profil;
      if (p) schreiben(id, p, a.daten);
    }
    ausstehend.current.clear();
  }, [profile, schreiben]);

  useEffect(() => {
    const weg = () => ausstehendSchreiben();
    const sichtbar = () => document.visibilityState === "hidden" && ausstehendSchreiben();
    window.addEventListener("pagehide", weg);
    document.addEventListener("visibilitychange", sichtbar);
    return () => {
      window.removeEventListener("pagehide", weg);
      document.removeEventListener("visibilitychange", sichtbar);
    };
  }, [ausstehendSchreiben]);

  // Beim Profilwechsel: ausstehende Speicherungen schreiben, dann Zwischenstand laden oder neue Meldung anlegen.
  // Verspätete Ergebnisse eines vorher aktiven Profils werden verworfen.
  useEffect(() => {
    if (!profil) return;
    ausstehendSchreiben();
    aktivesProfilId.current = profil.manifest.id;
    let gueltig = true;
    setMeldungRoh(null);
    setDokumentNr((n) => n + 1);
    (async () => {
      let z: Awaited<ReturnType<typeof zwischenstandLesen>>;
      try {
        z = await zwischenstandLesen(profil.manifest.id);
      } catch (e) {
        if (!gueltig) return;
        speicherProblem(
          "Der Zwischenstand konnte nicht aus dem Gerätespeicher gelesen werden. Angezeigt wird eine neue Meldung; Änderungen daran überschreiben einen vorhandenen Zwischenstand",
          e,
        );
        setMeldungRoh(neueMeldung(profil));
        setGesichert(undefined);
        return;
      }
      if (!gueltig) return;
      setMeldungRoh(z?.daten ?? neueMeldung(profil));
      const anderer = z?.profilVersion && z.profilVersion !== profil.manifest.version ? ` (angelegt mit Profilversion ${z.profilVersion}, bitte prüfen)` : "";
      setGesichert(z ? new Date(z.gespeichertAm).toLocaleString("de-DE") + anderer : undefined);
    })();
    return () => {
      gueltig = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profil]);

  const setMeldung = useCallback(
    (m: Meldung) => {
      setMeldungRoh(m);
      if (!profil) return;
      const id = profil.manifest.id;
      const alt = ausstehend.current.get(id);
      if (alt) window.clearTimeout(alt.timer);
      const timer = window.setTimeout(() => {
        ausstehend.current.delete(id);
        schreiben(id, profil, m);
      }, 1200);
      ausstehend.current.set(id, { daten: m, timer });
    },
    [profil, schreiben],
  );

  // Läuft in der KI-Erfassung ein Auftrag, bricht ein Profilwechsel ihn ab (die Erfassung entsteht je Profil neu).
  const kiLaeuft = useRef(false);

  const aktivieren = async (schluessel: string) => {
    if (
      schluessel !== aktiv &&
      kiLaeuft.current &&
      !confirm("Ein KI-Lauf ist aktiv und wird beim Profilwechsel abgebrochen (im Laufprotokoll als abgebrochen vermerkt). Trotzdem wechseln?")
    )
      return;
    setAktiv(schluessel);
    // Eine noch nicht verarbeitete Übergabe gehört zum bisherigen Profil
    if (schluessel !== aktiv) setKiUebergabe(null);
    await aktivesProfilSetzen(schluessel).catch((e) => speicherProblem("Das gewählte Profil konnte nicht als Startprofil gespeichert werden", e));
    setAnsicht("meldung");
  };

  const importieren = async (dateien: Record<string, string>, ersetzen = false) => {
    const erg = await ladeProfil(dateien);
    if (!erg.profil) return { ok: false, befunde: erg.befunde };
    const schluessel = `${erg.profil.manifest.id}@${erg.profil.manifest.version}`;
    // Gleiche ID und Version mit anderem Inhalt: Konflikt melden, beim Ersetzen den alten Stand archivieren
    const vorhanden = profile.find((p) => p.schluessel === schluessel || (p.profil && `${p.profil.manifest.id}@${p.profil.manifest.version}` === schluessel));
    if (vorhanden?.profil && vorhanden.profil.hash !== erg.profil.hash) {
      if (!ersetzen || vorhanden.quelle === "eingebaut")
        return {
          ok: false,
          konflikt: vorhanden.quelle !== "eingebaut",
          befunde: [
            {
              stufe: "fehler" as const,
              text: `Profil ${erg.profil.manifest.id} in Version ${erg.profil.manifest.version} ist bereits mit anderem Inhalt vorhanden. Für geänderte Inhalte bitte die Versionsnummer im Manifest erhöhen.`,
            },
          ],
        };
      await profilArchivieren(vorhanden.schluessel, vorhanden.profil.hash, vorhanden.dateien);
    }
    const importiertAm = new Date().toISOString();
    await profilSpeichern({ schluessel, quelle: "importiert", dateien: erg.profil.dateien, importiertAm });
    setProfile((alt) => [
      ...alt.filter((p) => p.schluessel !== schluessel),
      { schluessel, quelle: "importiert", dateien: erg.profil!.dateien, importiertAm, profil: erg.profil, befunde: erg.befunde },
    ]);
    return { ok: true, befunde: erg.befunde, schluessel, name: erg.profil.manifest.name, version: erg.profil.manifest.version };
  };

  const loeschen = async (schluessel: string) => {
    await profilLoeschen(schluessel);
    setProfile((alt) => alt.filter((p) => p.schluessel !== schluessel));
    if (aktiv === schluessel) setAktiv(profile.find((p) => p.profil && p.schluessel !== schluessel)?.schluessel);
  };

  return (
    <div className="app">
      <header className="kopf">
        <div className="marke">
          <span className="marke-name">KI-LEAD</span>
          <span className="marke-zusatz">Demonstrator</span>
        </div>
        <nav className="hauptnav" aria-label="Bereiche">
          <button
            type="button"
            className={ansicht === "meldung" ? "nav aktiv" : "nav"}
            aria-current={ansicht === "meldung" ? "page" : undefined}
            onClick={() => setAnsicht("meldung")}
          >
            Meldung
          </button>
          <button
            type="button"
            className={ansicht === "ki" ? "nav aktiv" : "nav"}
            aria-current={ansicht === "ki" ? "page" : undefined}
            onClick={() => setAnsicht("ki")}
          >
            KI-Erfassung
          </button>
          <button
            type="button"
            className={ansicht === "lagebild" ? "nav aktiv" : "nav"}
            aria-current={ansicht === "lagebild" ? "page" : undefined}
            onClick={() => setAnsicht("lagebild")}
          >
            {profil?.ui.lagebild?.titel || "Lagebild"}
          </button>
          <button
            type="button"
            className={ansicht === "profile" ? "nav aktiv" : "nav"}
            aria-current={ansicht === "profile" ? "page" : undefined}
            onClick={() => setAnsicht("profile")}
          >
            Profile
          </button>
          <button
            type="button"
            className={ansicht === "einstellungen" ? "nav aktiv" : "nav"}
            aria-current={ansicht === "einstellungen" ? "page" : undefined}
            onClick={() => setAnsicht("einstellungen")}
          >
            Einstellungen
          </button>
        </nav>
        {profil && (
          <button
            type="button"
            className="profil-chip"
            onClick={() => setAnsicht("profile")}
            title={`Profil wechseln (in Verwendung: ${profil.manifest.name}, Profilversion ${profil.manifest.version})`}
          >
            <span className="chip-name">{profil.manifest.name}</span>
            <span className="chip-version">&nbsp;· {profil.manifest.version}</span>
          </button>
        )}
      </header>

      <div className="hinweisband" role="note">
        Forschungsdemonstrator. Nur fiktive oder offen zugängliche Inhalte verwenden – keine personenbezogenen und keine eingestuften Daten.
      </div>

      {speicherFehler && (
        <div className="kasten kasten-fehler speicherfehler" role="alert">
          <p>{speicherFehler}</p>
        </div>
      )}

      <main className="inhalt">
        {ansicht === "profile" && <ProfileAnsicht profile={profile} aktiv={aktiv} aktivieren={aktivieren} importieren={importieren} loeschen={loeschen} />}
        {ansicht === "meldung" && profil && meldung && (
          <Fehlergrenze
            schluessel={profil.hash}
            sichern={() => dateiAnbieten(JSON.stringify(meldung, null, 2) + "\n", sicherungsName(profil.manifest.variablen?.zeitzone), "application/json")}
            zuruecksetzen={() => meldungErsetzen(neueMeldung(profil))}
            zuruecksetzenText="Neue Meldung beginnen"
          >
            <MeldungAnsicht
              key={profil.hash}
              profil={profil}
              meldung={meldung}
              setMeldung={setMeldung}
              neu={() => meldungErsetzen(neueMeldung(profil))}
              ersetzen={meldungErsetzen}
              zwischenstand={gesichert}
              dokument={dokumentNr}
              ki={{ schluessel, einstellungen }}
            />
          </Fehlergrenze>
        )}
        {profil && (
          <div hidden={ansicht !== "ki"}>
            <KiErfassung
              key={profil.hash}
              profil={profil}
              einstellungen={einstellungen}
              schluessel={schluessel}
              zuEinstellungen={() => setAnsicht("einstellungen")}
              uebernehmen={kiUebernehmen}
              uebergabe={kiUebergabe}
              uebergabeQuittieren={uebergabeQuittieren}
              laufMelden={(l) => {
                kiLaeuft.current = l;
              }}
            />
          </div>
        )}
        {ansicht === "lagebild" && profil && (
          <Fehlergrenze schluessel={profil.hash}>
            <LagebildAnsicht key={profil.hash} profil={profil} uebergeben={anKiUebergeben} oeffnen={lagebildOeffnen} />
          </Fehlergrenze>
        )}
        {ansicht === "einstellungen" && (
          <Fehlergrenze schluessel={profil?.hash || "einstellungen"}>
            <EinstellungenAnsicht
              profil={profil}
              einstellungen={einstellungen}
              setEinstellungen={setEinstellungen}
              schluessel={schluessel}
              setSchluessel={setSchluessel}
              farben={{ auswahl: farbAuswahl, setAuswahl: setFarbAuswahl, thema, lokal: lokaleFarben, speichern: eigeneFarbenSpeichern }}
            />
          </Fehlergrenze>
        )}
        {(ansicht === "meldung" || ansicht === "ki" || ansicht === "lagebild") && !profil && profile.length > 0 && (
          <p className="leer">Kein verwendbares Profil. Bitte unter „Profile“ ein Profilpaket importieren.</p>
        )}
      </main>
      <footer className="fuss">
        KI-LEAD 0.4.24. Daten bleiben auf diesem Gerät; nur die KI-Funktionen senden Inhalte an den gewählten Anbieter (Anthropic oder OpenAI). Code unter
        EUPL-1.2, Profilinhalte unter CC BY 4.0.
      </footer>
    </div>
  );
}
