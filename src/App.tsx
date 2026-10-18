import { useCallback, useEffect, useRef, useState } from "react";
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
import { ProfileAnsicht } from "./ui/Profile";
import { KiErfassung } from "./ui/KiErfassung";
import { EinstellungenAnsicht } from "./ui/Einstellungen";
import { LagebildAnsicht } from "./ui/Lagebild";
import type { UebergabeMeldung } from "./pipeline/material";
import { Fehlergrenze } from "./ui/Fehlergrenze";
import { alleSchluesselLesen, einstellungenLesen, einstellungenSchreiben, schluesselSchreiben, STANDARD, type Einstellungen } from "./pipeline/einstellungen";
import { LEERE_SCHLUESSEL, type AnbieterId, type Schluessel } from "./anbieter/verteiler";

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

export default function App() {
  const [profile, setProfile] = useState<ProfilEintrag[]>([]);
  const [aktiv, setAktiv] = useState<string>();
  const [ansicht, setAnsicht] = useState<Ansicht>("meldung");
  const [meldung, setMeldungRoh] = useState<Meldung | null>(null);
  const [gesichert, setGesichert] = useState<string>();
  /** Ausstehende Speicherungen je Profil (Entprellung), damit ein Profilwechsel nichts verliert */
  const ausstehend = useRef(new Map<string, { daten: Meldung; timer: number }>());
  const aktivesProfilId = useRef<string>();
  const [speicherFehler, setSpeicherFehler] = useState<string | null>(null);
  const [einstellungen, setEinstellungenRoh] = useState<Einstellungen>(STANDARD);
  const [schluessel, setSchluesselRoh] = useState<Schluessel>(LEERE_SCHLUESSEL);
  const [kiUebergabe, setKiUebergabe] = useState<{ nr: number; dateien: UebergabeMeldung[] } | null>(null);

  const profil = profile.find((p) => p.schluessel === aktiv)?.profil || null;

  useEffect(() => {
    einstellungenLesen().then(setEinstellungenRoh);
    alleSchluesselLesen().then(setSchluesselRoh);
  }, []);

  const setEinstellungen = (e: Einstellungen) => {
    setEinstellungenRoh(e);
    einstellungenSchreiben(e);
  };

  const setSchluessel = (id: AnbieterId, wert: string) => {
    setSchluesselRoh((alt) => ({ ...alt, [id]: wert }));
    schluesselSchreiben(wert, id);
  };

  const kiUebernehmen = (m: Meldung) => {
    if (!confirm("Den KI-Entwurf in die Meldungsmaske übernehmen? Die dort geöffnete Meldung wird ersetzt.")) return;
    setMeldung(m);
    setAnsicht("meldung");
  };

  const lagebildOeffnen = (m: Meldung) => {
    if (!confirm("Diese Meldung in die Meldungsmaske übernehmen? Die dort geöffnete Meldung wird ersetzt.")) return;
    setMeldung(m);
    setAnsicht("meldung");
  };

  const anKiUebergeben = (dateien: UebergabeMeldung[]) => {
    setKiUebergabe((alt) => ({ nr: (alt?.nr || 0) + 1, dateien }));
    setAnsicht("ki");
  };

  useEffect(() => {
    (async () => {
      const eintraege: ProfilEintrag[] = [];
      for (const e of eingebauteProfile()) {
        const erg = await ladeProfil(e.dateien);
        eintraege.push({ schluessel: e.ordner, quelle: "eingebaut", dateien: e.dateien, profil: erg.profil, befunde: erg.befunde });
      }
      for (const g of await profileLaden()) {
        const erg = await ladeProfil(g.dateien);
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
      const gemerkt = await aktivesProfilLesen();
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
    (async () => {
      const z = await zwischenstandLesen(profil.manifest.id);
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

  const aktivieren = async (schluessel: string) => {
    setAktiv(schluessel);
    await aktivesProfilSetzen(schluessel);
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
    return { ok: true, befunde: erg.befunde };
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
          <button type="button" className={ansicht === "meldung" ? "nav aktiv" : "nav"} onClick={() => setAnsicht("meldung")}>
            Meldung
          </button>
          <button type="button" className={ansicht === "ki" ? "nav aktiv" : "nav"} onClick={() => setAnsicht("ki")}>
            KI-Erfassung
          </button>
          <button type="button" className={ansicht === "lagebild" ? "nav aktiv" : "nav"} onClick={() => setAnsicht("lagebild")}>
            {profil?.ui.lagebild?.titel || "Lagebild"}
          </button>
          <button type="button" className={ansicht === "profile" ? "nav aktiv" : "nav"} onClick={() => setAnsicht("profile")}>
            Profile
          </button>
          <button type="button" className={ansicht === "einstellungen" ? "nav aktiv" : "nav"} onClick={() => setAnsicht("einstellungen")}>
            Einstellungen
          </button>
        </nav>
        {profil && (
          <button type="button" className="profil-chip" onClick={() => setAnsicht("profile")} title="Profil wechseln">
            {profil.manifest.name}
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
            sichern={() => dateiAnbieten(JSON.stringify(meldung, null, 2) + "\n", "KI-LEAD_Meldung_Sicherung.json", "application/json")}
            zuruecksetzen={() => setMeldung(neueMeldung(profil))}
            zuruecksetzenText="Neue Meldung beginnen"
          >
            <MeldungAnsicht
              key={profil.hash}
              profil={profil}
              meldung={meldung}
              setMeldung={setMeldung}
              neu={() => setMeldung(neueMeldung(profil))}
              zwischenstand={gesichert}
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
            />
          </div>
        )}
        {ansicht === "lagebild" && profil && (
          <Fehlergrenze schluessel={profil.hash}>
            <LagebildAnsicht key={profil.hash} profil={profil} uebergeben={anKiUebergeben} oeffnen={lagebildOeffnen} />
          </Fehlergrenze>
        )}
        {ansicht === "einstellungen" && (
          <EinstellungenAnsicht
            profil={profil}
            einstellungen={einstellungen}
            setEinstellungen={setEinstellungen}
            schluessel={schluessel}
            setSchluessel={setSchluessel}
          />
        )}
        {(ansicht === "meldung" || ansicht === "ki" || ansicht === "lagebild") && !profil && profile.length > 0 && (
          <p className="leer">Kein verwendbares Profil. Bitte unter „Profile“ ein Profilpaket importieren.</p>
        )}
      </main>
      <footer className="fuss">
        KI-LEAD 0.4.5. Daten bleiben auf diesem Gerät; nur die KI-Funktionen senden Inhalte an den gewählten Anbieter (Anthropic oder OpenAI). Code unter
        EUPL-1.2, Profilinhalte unter CC BY 4.0.
      </footer>
    </div>
  );
}
