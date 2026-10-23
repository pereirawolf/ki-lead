// Anmeldung des Service Workers (PWA, Meilenstein 5) und Zustand für die Oberfläche: Netz verfügbar? Neue Fassung
// bereit? Nur im Produktionsbuild, in einem sicheren Kontext und nicht in der nativen App (Capacitor liefert die
// Dateien selbst aus).

export interface PwaZustand {
  /** Eine neue Fassung ist installiert und wartet auf „Neu laden“ */
  aktualisierung: boolean;
  /** Das Gerät meldet keine Netzverbindung */
  offline: boolean;
}

type Beobachter = (z: PwaZustand) => void;

let zustand: PwaZustand = { aktualisierung: false, offline: typeof navigator !== "undefined" && navigator.onLine === false };
let wartend: ServiceWorker | null = null;
const beobachter = new Set<Beobachter>();

function setzen(neu: Partial<PwaZustand>): void {
  zustand = { ...zustand, ...neu };
  for (const b of beobachter) b(zustand);
}

/** Läuft die App als native App (Capacitor)? Dort gibt es keinen Service Worker. */
export function istNativeApp(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

/** Darf hier ein Service Worker laufen? Ausgelagert, damit die Bedingungen prüfbar sind. */
export function serviceWorkerMoeglich(umgebung: { prod: boolean; sicher: boolean; unterstuetzt: boolean; nativ: boolean }): boolean {
  return umgebung.prod && umgebung.sicher && umgebung.unterstuetzt && !umgebung.nativ;
}

function beobachteWartenden(reg: ServiceWorkerRegistration): void {
  const melden = (sw: ServiceWorker | null) => {
    // Nur eine Aktualisierung zählt: Beim ersten Besuch gibt es noch keinen steuernden Service Worker
    if (sw && navigator.serviceWorker.controller) {
      wartend = sw;
      setzen({ aktualisierung: true });
    }
  };
  melden(reg.waiting);
  reg.addEventListener("updatefound", () => {
    const neu = reg.installing;
    neu?.addEventListener("statechange", () => {
      if (neu.state === "installed") melden(neu);
    });
  });
}

/** Meldet den Service Worker an und verfolgt den Netzstatus. Mehrfacher Aufruf schadet nicht. */
export function pwaStarten(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => setzen({ offline: false }));
  window.addEventListener("offline", () => setzen({ offline: true }));
  const moeglich = serviceWorkerMoeglich({
    prod: import.meta.env.PROD,
    sicher: window.isSecureContext,
    unterstuetzt: "serviceWorker" in navigator,
    nativ: istNativeApp(),
  });
  if (!moeglich) return;
  let neuGeladen = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Nur nach „Neu laden“ der Person, nicht bei der ersten Übernahme der Seite
    if (wartend && !neuGeladen) {
      neuGeladen = true;
      window.location.reload();
    }
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./", updateViaCache: "none" })
      .then((reg) => {
        beobachteWartenden(reg);
        // Bei langer Nutzung ohne Neustart stündlich nach einer neuen Fassung sehen
        setInterval(() => reg.update().catch(() => undefined), 60 * 60 * 1000);
      })
      .catch(() => {
        /* ohne Service Worker läuft die App wie bisher, nur nicht offline */
      });
  });
}

/** Aktiviert die wartende Fassung; die Seite lädt danach neu. */
export function jetztAktualisieren(): void {
  wartend?.postMessage("jetzt-aktualisieren");
}

export function pwaZustand(): PwaZustand {
  return zustand;
}

export function pwaBeobachten(b: Beobachter): () => void {
  beobachter.add(b);
  return () => beobachter.delete(b);
}
