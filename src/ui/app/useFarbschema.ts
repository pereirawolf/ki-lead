// Farbschema der Oberfläche (seit 0.6.5, TP-2026-W44-17 aus App.tsx): Auswahl (global), eigene Farben des aktiven
// Profils (lokal, an Schlüssel und Prüfsumme gebunden), Systemeinstellungen für „Automatisch“, Anwenden aufs Dokument.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Profil } from "../../kern/typen";
import { anwenden, aufloesen, PROFIL, systemVorgabe } from "../../darstellung/thema";
import {
  darstellungLesen,
  darstellungSchreiben,
  lokaleFarbenLesen,
  lokaleFarbenLoeschen,
  lokaleFarbenSchreiben,
  startLesen,
  startSchreiben,
} from "../../darstellung/speicher";
import type { ProfilFarbschema } from "../../darstellung/typen";
import type { FarbZugang } from "../Farbschema";

export function useFarbschema(aktiv: string | undefined, profil: Profil | null, speicherProblem: (was: string, e: unknown) => void): FarbZugang {
  const [farbStart] = useState(() => startLesen());
  const [farbAuswahl, setFarbAuswahlRoh] = useState(farbStart.auswahl);
  /** Eigene Farben und das Profil, für das sie gelesen sind (Schlüssel#Prüfsumme); bis dahin gilt der Startcache */
  const [gelesen, setGelesen] = useState<{ fuer: string; farben?: ProfilFarbschema } | null>(null);
  const farbSchreiben = useRef(Promise.resolve());
  const fuer = aktiv && profil ? `${aktiv}#${profil.hash}` : null;
  const lokaleFarben = gelesen && gelesen.fuer === fuer ? gelesen.farben : undefined;
  useEffect(() => {
    darstellungLesen()
      .then((d) => setFarbAuswahlRoh(d.auswahl))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!aktiv || !profil || !fuer) return;
    let gueltig = true;
    lokaleFarbenLesen(aktiv, profil.hash)
      .then((f) => gueltig && setGelesen({ fuer, farben: f }))
      .catch(() => gueltig && setGelesen({ fuer }));
    return () => {
      gueltig = false;
    };
  }, [aktiv, profil, fuer]);
  // Solange Profil und eigene Farben noch laden, gilt bei „profil“ die Definition aus dem Startcache (kein Aufblitzen)
  const profilFarbenBereit = !!profil && !!gelesen && gelesen.fuer === fuer;
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
  const setAuswahl = (auswahl: string) => {
    setFarbAuswahlRoh(auswahl);
    farbSchreiben.current = farbSchreiben.current
      .then(() => darstellungSchreiben({ version: 1, auswahl }))
      .catch((e) => speicherProblem("Das Farbschema gilt nur bis zum Neuladen; es konnte nicht im Gerät gespeichert werden", e));
  };
  const speichern = async (f: ProfilFarbschema | null) => {
    if (!aktiv || !profil || !fuer) return;
    if (f) await lokaleFarbenSchreiben(aktiv, profil.hash, f);
    else await lokaleFarbenLoeschen(aktiv, profil.hash);
    setGelesen({ fuer, farben: f || undefined });
    if (f) setAuswahl(PROFIL);
  };
  return { auswahl: farbAuswahl, setAuswahl, thema, lokal: lokaleFarben, speichern };
}
