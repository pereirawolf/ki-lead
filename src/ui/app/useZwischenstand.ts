// Meldung in der Maske und automatischer Zwischenstand je Profil (seit 0.6.5, TP-2026-W44-17 aus App.tsx): Laden beim
// Profilwechsel, verzögertes Speichern (1,2 s), sofortiges Schreiben beim Verlassen der Seite und beim Profilwechsel.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Meldung, Profil, ProfilEintrag } from "../../kern/typen";
import { zwischenstandLesen, zwischenstandSchreiben } from "../../speicher/speicher";

export interface Zwischenstand {
  /** Meldung des aktiven Profils; null, solange sie lädt */
  meldung: Meldung | null;
  /** Ändert die Meldung und speichert sie verzögert */
  setMeldung: (m: Meldung) => void;
  /** Zählt Dokumentinstanzen der Meldungsmaske (neue Meldung, geöffnete Datei, Übernahme, Profilwechsel) */
  dokumentNr: number;
  /** Neue Dokumentinstanz (neue Meldung, geöffnete Datei, Übernahme) */
  neuesDokument: () => void;
  /** Zeitpunkt des letzten gesicherten Zwischenstands, mit Hinweis auf eine andere Profilversion */
  gesichert?: string;
}

export function useZwischenstand(
  profil: Profil | null,
  profile: ProfilEintrag[],
  neueMeldung: (p: Profil) => Meldung,
  setSpeicherFehler: (text: string | null) => void,
  speicherProblem: (was: string, e: unknown) => void,
): Zwischenstand {
  /** Meldung und das Profil, zu dem sie gehört; gehört sie zu einem anderen, gilt sie als noch nicht geladen */
  const [stand, setStand] = useState<{ fuer: Profil; meldung: Meldung } | null>(null);
  const [dokumentNr, setDokumentNr] = useState(0);
  const [gesichert, setGesichert] = useState<string>();
  /** Ausstehende Speicherungen je Profil (Entprellung), damit ein Profilwechsel nichts verliert */
  const ausstehend = useRef(new Map<string, { daten: Meldung; timer: number }>());
  const aktivesProfilId = useRef<string>(undefined);
  const meldung = profil && stand?.fuer === profil ? stand.meldung : null;

  const schreiben = useCallback(
    async (id: string, p: Profil, daten: Meldung) => {
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
    },
    [setSpeicherFehler],
  );

  /** Alle ausstehenden Speicherungen sofort schreiben (Profilwechsel, Seite wird verlassen). */
  const ausstehendSchreiben = useCallback(() => {
    for (const [id, a] of ausstehend.current) {
      window.clearTimeout(a.timer);
      const p = profile.find((x) => x.profil?.manifest.id === id)?.profil;
      if (p) void schreiben(id, p, a.daten);
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
    const laden = (m: Meldung) => {
      setStand({ fuer: profil, meldung: m });
      setDokumentNr((n) => n + 1);
    };
    void (async () => {
      let z: Awaited<ReturnType<typeof zwischenstandLesen>>;
      try {
        z = await zwischenstandLesen(profil.manifest.id);
      } catch (e) {
        if (!gueltig) return;
        speicherProblem(
          "Der Zwischenstand konnte nicht aus dem Gerätespeicher gelesen werden. Angezeigt wird eine neue Meldung; Änderungen daran überschreiben einen vorhandenen Zwischenstand",
          e,
        );
        laden(neueMeldung(profil));
        setGesichert(undefined);
        return;
      }
      if (!gueltig) return;
      laden(z?.daten ?? neueMeldung(profil));
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
      if (!profil) return;
      setStand({ fuer: profil, meldung: m });
      const id = profil.manifest.id;
      const alt = ausstehend.current.get(id);
      if (alt) window.clearTimeout(alt.timer);
      const timer = window.setTimeout(() => {
        ausstehend.current.delete(id);
        void schreiben(id, profil, m);
      }, 1200);
      ausstehend.current.set(id, { daten: m, timer });
    },
    [profil, schreiben],
  );

  const neuesDokument = useCallback(() => setDokumentNr((n) => n + 1), []);

  return { meldung, setMeldung, dokumentNr, neuesDokument, gesichert };
}
