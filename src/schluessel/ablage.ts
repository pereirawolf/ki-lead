// Ablage der API-Schlüssel: Die Person wählt, wo ihre Schlüssel liegen. Mehrere gleichwertige Wege statt einer
// festen Lösung, damit die App ohne einzelne Abhängigkeit nutzbar bleibt (Resilienz):
//
// - geraet:  Speicher der App auf diesem Gerät (IndexedDB), unverschlüsselt; überall verfügbar, Vorgabe
// - sitzung: nur im Arbeitsspeicher, bis die App geschlossen oder neu geladen wird; nichts wird gespeichert
// - system:  Schlüsselbund des Betriebssystems (iOS-Keychain, Android-Keystore); nur in der nativen App
//
// Die Wahl selbst ist kein Geheimnis und liegt im Gerätespeicher. Ein Wechsel zieht vorhandene Schlüssel mit um
// und entfernt sie aus der bisherigen Ablage.

import { del, get, set } from "idb-keyval";
import { LEERE_SCHLUESSEL, type AnbieterId } from "../anbieter/verteiler";
import { istNativeApp } from "../pwa/registrieren";

export type AblageId = "geraet" | "sitzung" | "system";

export interface Ablage {
  id: AblageId;
  titel: string;
  beschreibung: string;
  /** Kann diese Ablage hier genutzt werden? */
  verfuegbar: () => boolean;
  lesen: (anbieter: AnbieterId) => Promise<string>;
  schreiben: (anbieter: AnbieterId, wert: string) => Promise<void>;
}

const ANBIETER = Object.keys(LEERE_SCHLUESSEL) as AnbieterId[];
const WAHL = "schluessel-ablage";

const geraet: Ablage = {
  id: "geraet",
  titel: "Gerätespeicher der App",
  beschreibung:
    "Bleibt nach dem Schließen erhalten. Liegt unverschlüsselt im Speicher dieses Browsers bzw. dieser App; wer Zugriff auf das entsperrte Gerät hat, kann ihn auslesen.",
  verfuegbar: () => true,
  lesen: async (a) => (await get<string>(`schluessel:${a}`)) || "",
  schreiben: async (a, w) => {
    if (w) await set(`schluessel:${a}`, w);
    else await del(`schluessel:${a}`);
  },
};

const fluechtig = new Map<AnbieterId, string>();
const sitzung: Ablage = {
  id: "sitzung",
  titel: "Nur für diese Sitzung",
  beschreibung: "Wird nicht gespeichert und ist nach dem Schließen oder Neuladen weg. Geeignet für geteilte Geräte.",
  verfuegbar: () => true,
  lesen: async (a) => fluechtig.get(a) || "",
  schreiben: async (a, w) => {
    if (w) fluechtig.set(a, w);
    else fluechtig.delete(a);
  },
};

/** Zugang zum Schlüsselbund des Betriebssystems; austauschbar für Tests */
export interface Schluesselbund {
  get: (key: string) => Promise<unknown>;
  set: (key: string, wert: string) => Promise<void>;
  remove: (key: string) => Promise<unknown>;
}

let bundQuelle: () => Promise<Schluesselbund> = async () => {
  // Erst bei Bedarf laden: im Browser und in der PWA wird das Plugin nie ausgeführt
  const { SecureStorage, KeychainAccess } = await import("@aparajita/capacitor-secure-storage");
  await SecureStorage.setKeyPrefix("ki-lead.");
  // Nie in die iCloud synchronisieren; nur dieses Gerät, nur entsperrt
  await SecureStorage.setSynchronize(false);
  await SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly);
  return {
    get: (k) => SecureStorage.get(k, false, false),
    set: (k, w) => SecureStorage.set(k, w, false, false),
    remove: (k) => SecureStorage.remove(k, false),
  };
};
let bund: Promise<Schluesselbund> | null = null;
const bundHolen = () => (bund ??= bundQuelle());

/** Nur für Tests: Schlüsselbund ersetzen */
export function schluesselbundSetzen(quelle: () => Promise<Schluesselbund>): void {
  bundQuelle = quelle;
  bund = null;
}

let nativTest: boolean | null = null;
/** Nur für Tests: native Umgebung vortäuschen */
export function nativSetzen(wert: boolean | null): void {
  nativTest = wert;
}
const nativ = () => nativTest ?? istNativeApp();

const system: Ablage = {
  id: "system",
  titel: "Schlüsselbund des Systems",
  beschreibung: "iOS-Keychain bzw. Android-Keystore: verschlüsselt, nur auf diesem Gerät, nicht in der Cloud. Nur in der App für iOS und Android verfügbar.",
  verfuegbar: nativ,
  lesen: async (a) => {
    const w = await (await bundHolen()).get(`schluessel.${a}`);
    return typeof w === "string" ? w : "";
  },
  schreiben: async (a, w) => {
    const b = await bundHolen();
    if (w) await b.set(`schluessel.${a}`, w);
    else await b.remove(`schluessel.${a}`);
  },
};

export const ABLAGEN: Ablage[] = [geraet, sitzung, system];

export function ablage(id: AblageId): Ablage {
  return ABLAGEN.find((a) => a.id === id) ?? geraet;
}

/** Gewählte Ablage; eine hier nicht verfügbare Wahl fällt auf den Gerätespeicher zurück. */
export async function ablageLesen(): Promise<AblageId> {
  const w = await get<AblageId>(WAHL);
  return w && ablage(w).id === w && ablage(w).verfuegbar() ? w : "geraet";
}

export async function schluesselAusAblage(anbieter: AnbieterId): Promise<string> {
  return ablage(await ablageLesen()).lesen(anbieter);
}

export async function schluesselInAblage(anbieter: AnbieterId, wert: string): Promise<void> {
  return ablage(await ablageLesen()).schreiben(anbieter, wert);
}

/**
 * Wechselt die Ablage und zieht die Schlüssel mit um: erst in die neue schreiben, dann aus der alten entfernen.
 * Scheitert das Schreiben, bleibt alles wie zuvor.
 */
export async function ablageWechseln(neu: AblageId): Promise<void> {
  const ziel = ablage(neu);
  if (!ziel.verfuegbar()) throw new Error(`„${ziel.titel}“ ist hier nicht verfügbar.`);
  const alt = ablage(await ablageLesen());
  if (alt.id === ziel.id) return;
  const werte = await Promise.all(ANBIETER.map(async (a) => [a, await alt.lesen(a)] as const));
  for (const [a, w] of werte) if (w) await ziel.schreiben(a, w);
  await set(WAHL, ziel.id);
  for (const [a, w] of werte) if (w) await alt.schreiben(a, "");
}
