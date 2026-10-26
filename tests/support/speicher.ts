// Attrappe für idb-keyval (IndexedDB) mit gezielt auslösbaren Lese-, Schreib- und Auflistungsfehlern.
//
// Verwendung (Hoisting beachten: der Zustand entsteht mit vi.hoisted, die Fabrik importiert diese Datei dynamisch):
//   const speicher = vi.hoisted(() => ({ werte: new Map<string, any>() }) as import("../support/speicher").SpeicherZustand);
//   vi.mock("idb-keyval", async () => (await import("../support/speicher")).idbAttrappe(speicher));
// Der Zustand überlebt vi.resetModules(), weil die Fabrik ihn über die Closure erhält.
import { vi } from "vitest";

export interface SpeicherZustand {
  werte: Map<string, any>;
  /** Ersetzt das Lesen einzelner Schlüssel (verzögern, ablehnen); undefined = normal lesen */
  lesen?: (k: string) => Promise<any> | undefined;
  /** Ersetzt das Schreiben einzelner Schlüssel; eine Ablehnung ändert den gespeicherten Wert nicht */
  schreiben?: (k: string, v: any) => Promise<void> | undefined;
  /** Lässt das Auflisten der Schlüssel scheitern */
  keysFehler?: boolean;
}

export function idbAttrappe(z: SpeicherZustand) {
  return {
    get: vi.fn(async (k: string) => {
      const sonder = z.lesen?.(k);
      return sonder !== undefined ? sonder : structuredClone(z.werte.get(k));
    }),
    set: vi.fn(async (k: string, v: any) => {
      const sonder = z.schreiben?.(k, v);
      if (sonder !== undefined) return sonder;
      z.werte.set(k, structuredClone(v));
    }),
    getMany: vi.fn(async (ks: string[]) =>
      Promise.all(
        ks.map(async (k) => {
          const sonder = z.lesen?.(k);
          return sonder !== undefined ? sonder : structuredClone(z.werte.get(k));
        }),
      ),
    ),
    del: vi.fn(async (k: string) => {
      z.werte.delete(k);
    }),
    keys: vi.fn(async () => {
      if (z.keysFehler) throw new Error("IndexedDB gesperrt");
      return [...z.werte.keys()];
    }),
    entries: vi.fn(async () => [...z.werte.entries()]),
    // Eigene Datenbanken (createStore, z. B. Archiv der Testläufe) teilen sich in der Attrappe dieselbe Ablage
    createStore: vi.fn(() => (() => undefined) as unknown),
  };
}

/** Setzt Werte und Sonderverhalten zurück (für afterEach) */
export function speicherLeeren(z: SpeicherZustand): void {
  z.werte.clear();
  z.lesen = undefined;
  z.schreiben = undefined;
  z.keysFehler = false;
}

/** Fehler wie bei vollem Speicher (DOMException „QuotaExceededError“) */
export function speicherVoll(): DOMException {
  return new DOMException("Der Speicherplatz ist erschöpft.", "QuotaExceededError");
}
