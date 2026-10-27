import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ladeProfil } from "./profil/laden";
import { eingebauteProfile } from "./profil/eingebaut";
import { leererWert } from "./kern/schema";
import { jetztLokal } from "./kern/ausgabe";
import type { Meldung, Profil, ProfilEintrag } from "./kern/typen";
import { aktivesProfilLesen, dateiAnbieten, aktivesProfilSetzen, profileLaden, profilLoeschen, profilSpeichern, profilArchivieren } from "./speicher/speicher";
import { MeldungAnsicht } from "./ui/Meldung";
import { kurzfassungLeeren } from "./ui/Kurzfassung";
import { KiErfassung } from "./ui/KiErfassung";
import { KiSymbol, type KopfLauf } from "./ui/KiSymbol";
import type { EinstellungsBereich } from "./ui/Einstellungen";
import { nachladbar } from "./ui/nachladen";

// Lagebild, Profile und Einstellungen als eigene Teile des Builds (seit 0.6.5, TP-2026-W44-18), nach dem Start vorgeladen
const Lagebild = nachladbar(() => import("./ui/Lagebild").then((m) => m.LagebildAnsicht));
const Profile = nachladbar(() => import("./ui/Profile").then((m) => m.ProfileAnsicht));
const Einstellungen = nachladbar(() => import("./ui/Einstellungen").then((m) => m.EinstellungenAnsicht));
const LagebildAnsicht = Lagebild.Komponente;
const ProfileAnsicht = Profile.Komponente;
const EinstellungenAnsicht = Einstellungen.Komponente;
import { Fehlergrenze } from "./ui/Fehlergrenze";
import { STANDARD, type Einstellungen } from "./pipeline/einstellungen";
import { einstellungenLesen, einstellungenSchreiben } from "./speicher/einstellungsSpeicher";
import { LEERE_SCHLUESSEL, type AnbieterId, type Schluessel } from "./anbieter/verteiler";
import { profilFarbschemaFehler } from "./darstellung/thema";
import { exportStempel, mitDatum } from "./kern/ausgabe";
import { PwaHinweis } from "./ui/PwaHinweis";
import { ablageLesen, ablageWechseln, alleSchluesselLesen, schluesselSchreiben, type AblageId } from "./schluessel/ablage";
import { ExternerLink } from "./ui/Ueber";
import { HERAUSGEBER, VERWEISE } from "./kern/herausgeber";
import { APP_KENNUNG } from "./kern/version";
import { KiZugangContext, type KiZugangWert } from "./ui/kiZugang";
import { useFarbschema } from "./ui/app/useFarbschema";
import { useZwischenstand } from "./ui/app/useZwischenstand";
import { useKiUebergabe } from "./ui/app/useKiUebergabe";
import { adresseLesen, adresseText, type Ansicht, type LagebildReiter } from "./ui/app/adresse";
import { bestaetigen } from "./ui/bestaetigung";

/** Profile laden mit der Prüfung des Farbschemas aus der Darstellung (seit 0.6.3, TP-2026-W44-24) */
const LADEN = { farbschemaFehler: profilFarbschemaFehler };

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
  // Ansicht, Bereich der Einstellungen und Reiter des Lagebilds stehen seit 0.6.5 in der Adresse (TP-2026-W44-20)
  const [start] = useState(() => adresseLesen(window.location.hash));
  const [ansicht, setAnsicht] = useState<Ansicht>(start.ansicht);
  /** Bereich der Einstellungen; bleibt beim Wechsel der Ansicht erhalten */
  const [einstellungsBereich, setEinstellungsBereich] = useState<EinstellungsBereich>(start.bereich ?? "uebersicht");
  const [lagebildReiter, setLagebildReiter] = useState<LagebildReiter>(start.reiter ?? "uebersicht");
  // Nachladbare Ansichten gleich nach dem ersten Zeichnen holen; ein Fehler zeigt sich erst beim Öffnen der Ansicht
  useEffect(() => {
    for (const n of [Lagebild, Profile, Einstellungen]) n.vorladen().catch(() => undefined);
  }, []);
  // Zurück und Vor im Browser, eingegebene Adresse
  useEffect(() => {
    const folgen = () => {
      const a = adresseLesen(window.location.hash);
      setAnsicht(a.ansicht);
      if (a.bereich) setEinstellungsBereich(a.bereich);
      if (a.reiter) setLagebildReiter(a.reiter);
    };
    window.addEventListener("hashchange", folgen);
    window.addEventListener("popstate", folgen);
    return () => {
      window.removeEventListener("hashchange", folgen);
      window.removeEventListener("popstate", folgen);
    };
  }, []);
  // Wechsel der Ansicht als neuer Eintrag im Verlauf; der Start ohne Adresse bleibt ohne Hash
  useEffect(() => {
    const text = adresseText({ ansicht, bereich: einstellungsBereich, reiter: lagebildReiter });
    if (window.location.hash === text || (!window.location.hash && text === "#/meldung")) return;
    window.history.pushState(null, "", text);
  }, [ansicht, einstellungsBereich, lagebildReiter]);
  const [speicherFehler, setSpeicherFehler] = useState<string | null>(null);
  const [einstellungen, setEinstellungenRoh] = useState<Einstellungen>(STANDARD);
  const [schluessel, setSchluesselRoh] = useState<Schluessel>(LEERE_SCHLUESSEL);
  const [ablageId, setAblageId] = useState<AblageId>("geraet");

  const profil = profile.find((p) => p.schluessel === aktiv)?.profil || null;

  /** Meldet einen Fehler des Gerätespeichers sichtbar (IndexedDB gesperrt, voll oder defekt). */
  const speicherProblem = useCallback((was: string, e: unknown) => {
    setSpeicherFehler(`${was} (${(e as Error)?.message || "Speicherfehler"}).`);
  }, []);

  // Farbschema, Zwischenstand und Übergabe an die KI (seit 0.6.5, TP-2026-W44-17 als eigene Hooks)
  const farben = useFarbschema(aktiv, profil, speicherProblem);
  const { meldung, setMeldung, dokumentNr, neuesDokument, gesichert } = useZwischenstand(profil, profile, neueMeldung, setSpeicherFehler, speicherProblem);
  const ki = useKiUebergabe(profil, () => setAnsicht("ki"));

  useEffect(() => {
    einstellungenLesen()
      .then(setEinstellungenRoh)
      .catch((e) => speicherProblem("Die gespeicherten Einstellungen konnten nicht gelesen werden; es gelten die Vorgaben", e));
    alleSchluesselLesen()
      .then(setSchluesselRoh)
      .catch((e) => speicherProblem("Die gespeicherten API-Schlüssel konnten nicht gelesen werden", e));
    ablageLesen()
      .then(setAblageId)
      .catch(() => undefined);
  }, [speicherProblem]);

  /** Ablage der API-Schlüssel wechseln; die Schlüssel ziehen mit um und werden neu gelesen. */
  const setAblage = async (id: AblageId) => {
    await ablageWechseln(id);
    setAblageId(id);
    setSchluesselRoh(await alleSchluesselLesen());
  };

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
    neuesDokument();
    if (profil) void kurzfassungLeeren(profil.manifest.id);
  };

  const kiUebernehmen = async (m: Meldung) => {
    if (!(await bestaetigen("Den KI-Entwurf in die Meldungsmaske übernehmen? Die dort geöffnete Meldung wird ersetzt.", { ja: "Übernehmen" }))) return;
    meldungErsetzen(m);
    setAnsicht("meldung");
  };

  const lagebildOeffnen = async (m: Meldung) => {
    if (!(await bestaetigen("Diese Meldung in die Meldungsmaske übernehmen? Die dort geöffnete Meldung wird ersetzt.", { ja: "Übernehmen" }))) return;
    meldungErsetzen(m);
    setAnsicht("meldung");
  };

  useEffect(() => {
    void (async () => {
      // Ein einzelnes defektes Profil oder ein nicht lesbarer Gerätespeicher darf die übrigen Profile nicht verdecken.
      const sicherLaden = async (dateien: Record<string, string>) => {
        try {
          return await ladeProfil(dateien, LADEN);
        } catch (e) {
          return {
            profil: null,
            befunde: [{ stufe: "fehler" as const, text: `Das Profil konnte nicht geladen werden: ${(e as Error)?.message || String(e)}` }],
          };
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

  // Läuft in der KI-Erfassung ein Auftrag, bricht ein Profilwechsel ihn ab (die Erfassung entsteht je Profil neu).
  const kiLaeuft = useRef(false);
  /** Laufende KI-Anfrage für den KI-Chip der Kopfleiste */
  const [kopfLauf, setKopfLauf] = useState<KopfLauf | null>(null);
  // Schließen oder Neuladen der Seite während eines KI-Laufs: Rückfrage des Browsers (seit 0.6.5, TP-2026-W44-20)
  useEffect(() => {
    const warnen = (e: BeforeUnloadEvent) => {
      if (!kiLaeuft.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warnen);
    return () => window.removeEventListener("beforeunload", warnen);
  }, []);

  const aktivieren = async (schluessel: string) => {
    if (
      schluessel !== aktiv &&
      kiLaeuft.current &&
      !(await bestaetigen("Ein KI-Lauf ist aktiv und wird beim Profilwechsel abgebrochen (im Laufprotokoll als abgebrochen vermerkt). Trotzdem wechseln?", {
        ja: "Trotzdem wechseln",
      }))
    )
      return;
    setAktiv(schluessel);
    // Eine noch nicht verarbeitete Übergabe gehört zum bisherigen Profil; das Lagebild beginnt wieder mit der Übersicht
    if (schluessel !== aktiv) {
      ki.verwerfen();
      setLagebildReiter("uebersicht");
    }
    await aktivesProfilSetzen(schluessel).catch((e) => speicherProblem("Das gewählte Profil konnte nicht als Startprofil gespeichert werden", e));
    setAnsicht("meldung");
  };

  const importieren = async (dateien: Record<string, string>, ersetzen = false) => {
    const erg = await ladeProfil(dateien, LADEN);
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

  const zuEinstellungen = useCallback((bereich?: EinstellungsBereich) => {
    setEinstellungsBereich(bereich ?? "anbieter");
    setAnsicht("einstellungen");
  }, []);
  const kiZugang = useMemo<KiZugangWert>(() => ({ profil, einstellungen, schluessel, zuEinstellungen }), [profil, einstellungen, schluessel, zuEinstellungen]);

  return (
    <KiZugangContext.Provider value={kiZugang}>
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
            <div className="kopf-rechts" data-profil={profil.manifest.name}>
              <KiSymbol lauf={kopfLauf} zurKi={() => setAnsicht("ki")} />
            </div>
          )}
        </header>

        <div className="hinweisband" role="note">
          Forschungsdemonstrator. Nur fiktive oder offen zugängliche Inhalte verwenden – keine personenbezogenen und keine eingestuften Daten.
        </div>
        <PwaHinweis />

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
              />
            </Fehlergrenze>
          )}
          {profil && (
            <div hidden={ansicht !== "ki"}>
              <KiErfassung
                key={profil.hash}
                uebernehmen={kiUebernehmen}
                uebergabe={ki.uebergabe}
                uebergabeQuittieren={ki.quittieren}
                laufMelden={(l) => {
                  kiLaeuft.current = l;
                }}
                laufStand={setKopfLauf}
              />
            </div>
          )}
          {ansicht === "lagebild" && profil && (
            <Fehlergrenze schluessel={profil.hash}>
              <LagebildAnsicht
                key={profil.hash}
                profil={profil}
                uebergeben={ki.uebergeben}
                oeffnen={lagebildOeffnen}
                reiter={lagebildReiter}
                setReiter={setLagebildReiter}
              />
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
                ablage={ablageId}
                setAblage={setAblage}
                farben={farben}
                bereich={einstellungsBereich}
                setBereich={setEinstellungsBereich}
              />
            </Fehlergrenze>
          )}
          {(ansicht === "meldung" || ansicht === "ki" || ansicht === "lagebild") && !profil && profile.length > 0 && (
            <p className="leer">Kein verwendbares Profil. Bitte unter „Profile“ ein Profilpaket importieren.</p>
          )}
        </main>
        <footer className="fuss">
          {APP_KENNUNG}. Daten bleiben auf diesem Gerät; nur die KI-Funktionen senden Inhalte an den gewählten Anbieter (Anthropic, OpenAI oder Mistral; über
          Ollama bleiben sie auf dem Gerät). Code unter EUPL-1.2, mitgelieferte Beispielprofile unter CC BY 4.0 ({HERAUSGEBER}), andere Profile unter der Lizenz
          ihres Herausgebers. <ExternerLink href={VERWEISE.inhaltslizenz}>Lizenzen</ExternerLink> ·{" "}
          <ExternerLink href={VERWEISE.impressum}>Impressum</ExternerLink> · <ExternerLink href={VERWEISE.datenschutz}>Datenschutz</ExternerLink>
        </footer>
      </div>
    </KiZugangContext.Provider>
  );
}
