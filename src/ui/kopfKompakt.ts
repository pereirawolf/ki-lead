// Kompakter Kopfbereich beim Scrollen (seit 0.7.16, Grunddesign 1.6, LD-R04): Am Seitenanfang steht das Hinweisband
// mit vollem Innenabstand, nach dem Scrollen schmaler (weniger Innenabstand, kleinere Schrift). Der ganze Wortlaut bleibt
// immer sichtbar und bricht bei Bedarf um; nichts wird abgeschnitten (Klarstellung des Herausgebers vom 10.11.2026).
//
// Hysterese: kompakt ab EIN_MIN px (mindestens eine volle Bandhöhe über AUS), wieder voll erst unter AUS px. Schrumpft der
// Kopfbereich, rückt der Inhalt um den Höhenunterschied nach oben. Damit der Browser dabei die Scrollposition nicht
// nachführt (Scroll-Anchoring) und so wieder unter die Schwelle fällt, ist das Nachführen für den Wechsel abgeschaltet;
// die Schwelle liegt zusätzlich so hoch, dass auch eine an das Seitenende geklemmte Position über AUS bleibt.

import { useEffect } from "react";
import { KOPFBEREICH } from "./kopfHoehe";

/** Kompakt ab dieser Scrollhöhe (px), mindestens aber eine volle Bandhöhe über AUS */
export const EIN_MIN = 96;
/** Wieder vollständig unter dieser Scrollhöhe (px) */
export const AUS = 8;
/** So lange (ms) bleibt Scroll-Anchoring nach einem Wechsel aus; länger als der Übergang in basis.css (0,18 s) */
const ANCHORING_PAUSE = 400;
/** Klasse am Kopfbereich im kompakten Zustand */
export const KOMPAKT = "kompakt";

/** Neuer Zustand aus Scrollhöhe, bisherigem Zustand und Höhe des vollen Hinweisbands (rein, für Tests) */
export function kompaktNach(scrollY: number, kompakt: boolean, bandVoll: number): boolean {
  if (kompakt) return scrollY > AUS;
  return scrollY > Math.max(EIN_MIN, bandVoll + AUS + 16);
}

export function useKopfKompakt(): void {
  useEffect(() => {
    const bereich = document.querySelector<HTMLElement>(KOPFBEREICH);
    if (!bereich) return;
    const band = bereich.querySelector<HTMLElement>(".hinweisband");
    const wurzel = document.documentElement;
    let kompakt = bereich.classList.contains(KOMPAKT);
    let bandVoll = 0;
    let geplant = 0;
    const scroller = [wurzel, document.body];
    let anchoringAus: string[] | undefined;
    let zurueck: ReturnType<typeof setTimeout> | undefined;

    const pruefen = () => {
      geplant = 0;
      if (!kompakt && band) bandVoll = band.getBoundingClientRect().height;
      const neu = kompaktNach(window.scrollY, kompakt, bandVoll);
      if (neu === kompakt) return;
      kompakt = neu;
      // Scroll-Anchoring für diesen Wechsel aus, bis der Übergang (0,18 s) sicher vorbei ist: Der Inhalt rückt mit dem
      // Kopf, die Scrollposition bleibt
      if (!anchoringAus) {
        anchoringAus = scroller.map((e) => e.style.overflowAnchor);
        for (const e of scroller) e.style.overflowAnchor = "none";
      }
      bereich.classList.toggle(KOMPAKT, kompakt);
      clearTimeout(zurueck);
      zurueck = setTimeout(anchoringZurueck, ANCHORING_PAUSE);
    };
    const anchoringZurueck = () => {
      if (anchoringAus) scroller.forEach((e, i) => (e.style.overflowAnchor = anchoringAus![i]!));
      anchoringAus = undefined;
    };
    const beimScrollen = () => {
      if (!geplant) geplant = requestAnimationFrame(pruefen);
    };

    window.addEventListener("scroll", beimScrollen, { passive: true });
    pruefen();
    return () => {
      window.removeEventListener("scroll", beimScrollen);
      if (geplant) cancelAnimationFrame(geplant);
      clearTimeout(zurueck);
      anchoringZurueck();
    };
  }, []);
}
