// Nachladbare Ansichten (seit 0.6.5, TP-2026-W44-18): Lagebild, Profile, Einstellungen und der Lesetext (markdown-it)
// liegen in eigenen Teilen des Builds statt im Haupt-JavaScript. Die App lädt sie nach dem ersten Zeichnen vor; ist ein
// Teil beim Einhängen schon geladen, erscheint die Ansicht ohne Zwischenstand, sonst kurz „Wird geladen …“ (Suspense).

import { lazy, Suspense, useState, type ComponentType } from "react";

export interface Nachladbar<P extends object> {
  Komponente: ComponentType<P>;
  /** Lädt den Teil im Voraus (mehrfacher Aufruf schadet nicht) */
  vorladen: () => Promise<void>;
}

export function nachladbar<P extends object>(laden: () => Promise<ComponentType<P>>): Nachladbar<P> {
  let geladen: ComponentType<P> | null = null;
  let laufend: Promise<ComponentType<P>> | null = null;
  const holen = () =>
    (laufend ??= laden().then(
      (k) => (geladen = k),
      (e: unknown) => {
        // Ein gescheiterter Abruf (etwa offline ohne Cache) darf beim nächsten Versuch neu laden
        laufend = null;
        throw e;
      },
    ));
  const Faul = lazy(async () => ({ default: await holen() })) as unknown as ComponentType<P>;
  function Komponente(props: P) {
    // Je Einhängen einmal entscheiden: ein Wechsel von Suspense zur direkten Darstellung würde neu einhängen
    const [direkt] = useState(() => geladen);
    if (direkt) {
      const K = direkt;
      return <K {...props} />;
    }
    return (
      <Suspense fallback={<p className="leer">Wird geladen …</p>}>
        <Faul {...props} />
      </Suspense>
    );
  }
  return { Komponente, vorladen: () => holen().then(() => undefined) };
}
