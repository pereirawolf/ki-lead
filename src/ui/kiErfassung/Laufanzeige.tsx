// Anzeige eines laufenden KI-Aufrufs (S1, Orientierungssuche, S2/S3) mit eigener Uhr (seit 0.6.5, TP-2026-W44-17).
// Bis 0.6.4 stellte KiErfassung.tsx die Uhr jede Sekunde und zeichnete dabei die ganze Erfassung neu.

import { useEffect, useState, useSyncExternalStore } from "react";
import { laufKostenText, type Lauf } from "../../pipeline/lauf";
import type { LaufAnzeigeStand } from "./anzeigeStand";
import { dauerFuer, type LaufRahmen } from "./rahmen";
import { dauer } from "./zustand";

export function Laufanzeige({
  phase,
  lauf,
  rahmen,
  stand,
  abbrechen,
}: {
  phase: "s1" | "orientierung" | "s2";
  lauf: Lauf;
  rahmen: LaufRahmen;
  stand: LaufAnzeigeStand;
  abbrechen: () => void;
}) {
  const { start, protokoll, zeichen } = useSyncExternalStore(stand.abonnieren, stand.lesen);
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setJetzt(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="laeuft" aria-live="polite">
      <h2>
        {phase === "s1"
          ? "Stufe S1: Gegenstand und SOP-Auswahl"
          : phase === "orientierung"
            ? "Stufe S1: Orientierungssuche"
            : lauf.status === "s3"
              ? "Stufe S3: Prüfung und Reparatur"
              : "Stufe S2: Recherche und Entwurf"}
      </h2>
      <p className="einleitung">
        {phase === "s1"
          ? `Die KI ordnet den Auftrag ein. Das dauert voraussichtlich ${dauerFuer(rahmen, "vorverarbeitung", "s1")}.`
          : phase === "orientierung"
            ? "Die KI sucht je Sachverhalt kurz im Web, ohne Seiten zu öffnen, und schlägt daraus Suchbegriffe für die Recherche in S2 vor. Das dauert meist unter einer Minute."
            : `Die KI ${rahmen.verdichtung ? "verdichtet die Eingänge" : "recherchiert"} und schreibt den Entwurf. Das dauert voraussichtlich ${dauerFuer(rahmen, rahmen.stufeS2.rolle, rahmen.schaetzS2.art)}. Bitte die Seite im Vordergrund lassen; die App hält den Bildschirm so lange wach.`}
      </p>
      <div className="laufanzeige">
        <span className="puls" aria-hidden="true" />
        <span>
          {dauer(Math.max(0, jetzt - start))}
          {zeichen > 0 ? ` · ${zeichen.toLocaleString("de-DE")} Zeichen geschrieben` : ""}
          {lauf.kostenUsd || lauf.kostenBekanntUsd ? ` · bisher ${laufKostenText(lauf)}` : ""}
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
        <button type="button" className="knopf" onClick={abbrechen}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
