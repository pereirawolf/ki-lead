// Ablage der API-Schlüssel: Die Person wählt, wo ihre Schlüssel liegen. Mehrere gleichwertige Wege statt einer
// festen Lösung, damit die App ohne einzelne Abhängigkeit nutzbar bleibt (Resilienz):
//
// - geraet:  Speicher der App auf diesem Gerät (IndexedDB), unverschlüsselt; überall verfügbar, Vorgabe
// - sitzung: nur im Arbeitsspeicher, bis die App geschlossen oder neu geladen wird; nichts wird gespeichert
// - passphrase: im Gerätespeicher, aber mit AES-GCM verschlüsselt; der Schlüssel dazu entsteht per PBKDF2 aus einer
//   Passphrase, liegt nur im Arbeitsspeicher und wird je Sitzung neu abgefragt (seit 0.6.2, TP-2026-W44-09)
// - system:  Schlüsselbund des Betriebssystems (iOS-Keychain, Android-Keystore); nur in der nativen App
//
// Die Wahl selbst ist kein Geheimnis und liegt im Gerätespeicher. Ein Wechsel zieht vorhandene Schlüssel mit um
// und entfernt sie aus der bisherigen Ablage.

import { del, get, set } from "idb-keyval";
import { LEERE_SCHLUESSEL, type AnbieterId } from "../anbieter/verteiler";
import { istNativeApp } from "../pwa/registrieren";

export type AblageId = "geraet" | "sitzung" | "passphrase" | "system";

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

// ── Passphrase (WebCrypto) ──────────────────────────────────────────────────────

/** Iterationen für PBKDF2-SHA-256 (Empfehlung OWASP 2023); im Datensatz gespeichert, damit sie sich später ändern lassen */
export const PBKDF2_ITERATIONEN = 600_000;
const PASSPHRASE_KOPF = "schluessel-passphrase";
const verschluesselt = (a: AnbieterId) => `schluessel-verschluesselt:${a}`;
/** Bekannter Klartext, verschlüsselt im Kopfdatensatz: erkennt eine falsche Passphrase, ohne einen API-Schlüssel zu brauchen */
const PRUEFTEXT = "ki-lead-passphrase-pruefung";

interface PassphraseKopf {
  salz: string;
  iterationen: number;
  pruefung: Chiffrat;
}
interface Chiffrat {
  iv: string;
  daten: string;
}

/** Abgeleiteter AES-Schlüssel dieser Sitzung; nicht exportierbar, nie gespeichert */
let sitzungsSchluessel: CryptoKey | null = null;

const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))));
const ausB64 = (t: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));

async function ableiten(passphrase: string, salz: Uint8Array<ArrayBuffer>, iterationen: number): Promise<CryptoKey> {
  const roh = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salz, iterations: iterationen }, roh, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function verschluesseln(k: CryptoKey, text: string): Promise<Chiffrat> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const daten = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(text));
  return { iv: b64(iv), daten: b64(daten) };
}

async function entschluesseln(k: CryptoKey, c: Chiffrat): Promise<string> {
  const klar = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ausB64(c.iv) }, k, ausB64(c.daten));
  return new TextDecoder().decode(klar);
}

/** Ist die Passphrase-Ablage in dieser Sitzung noch gesperrt? */
export function passphraseGesperrt(): boolean {
  return sitzungsSchluessel === null;
}

/** Wurde schon eine Passphrase festgelegt (Kopfdatensatz vorhanden)? */
export async function passphraseFestgelegt(): Promise<boolean> {
  return (await get<PassphraseKopf>(PASSPHRASE_KOPF)) !== undefined;
}

/**
 * Entsperrt die Ablage für diese Sitzung. Ohne festgelegte Passphrase wird sie hiermit festgelegt (neues Salz,
 * Prüfwert). Mit festgelegter Passphrase liefert eine falsche Eingabe false; der Zustand bleibt dann gesperrt.
 */
export async function passphraseEntsperren(passphrase: string): Promise<boolean> {
  if (!passphrase) return false;
  const kopf = await get<PassphraseKopf>(PASSPHRASE_KOPF);
  if (!kopf) {
    const salz = crypto.getRandomValues(new Uint8Array(16));
    const k = await ableiten(passphrase, salz, PBKDF2_ITERATIONEN);
    await set(PASSPHRASE_KOPF, { salz: b64(salz), iterationen: PBKDF2_ITERATIONEN, pruefung: await verschluesseln(k, PRUEFTEXT) } satisfies PassphraseKopf);
    sitzungsSchluessel = k;
    return true;
  }
  const k = await ableiten(passphrase, ausB64(kopf.salz), kopf.iterationen);
  try {
    if ((await entschluesseln(k, kopf.pruefung)) !== PRUEFTEXT) return false;
  } catch {
    return false;
  }
  sitzungsSchluessel = k;
  return true;
}

/** Sperrt die Ablage (vergisst den abgeleiteten Schlüssel); beim Neuladen geschieht das ohnehin. */
export function passphraseSperren(): void {
  sitzungsSchluessel = null;
}

/** Passphrase vergessen: verschlüsselte Schlüssel und Kopfdatensatz verwerfen; danach lässt sich eine neue festlegen. */
export async function passphraseVerwerfen(): Promise<void> {
  for (const a of ANBIETER) await del(verschluesselt(a));
  await del(PASSPHRASE_KOPF);
  sitzungsSchluessel = null;
}

const passphrase: Ablage = {
  id: "passphrase",
  titel: "Gerätespeicher, mit Passphrase verschlüsselt",
  beschreibung:
    "Bleibt nach dem Schließen erhalten, liegt aber nur verschlüsselt im Speicher dieses Browsers bzw. dieser App (AES-GCM, Schlüssel aus der Passphrase per PBKDF2). Die Passphrase wird je Sitzung abgefragt und nicht gespeichert; ohne sie sind die Schlüssel nicht lesbar.",
  verfuegbar: () => typeof globalThis.crypto?.subtle?.deriveKey === "function",
  lesen: async (a) => {
    if (!sitzungsSchluessel) return "";
    const c = await get<Chiffrat>(verschluesselt(a));
    if (!c) return "";
    try {
      return await entschluesseln(sitzungsSchluessel, c);
    } catch {
      return "";
    }
  },
  schreiben: async (a, w) => {
    if (!w) return del(verschluesselt(a));
    if (!sitzungsSchluessel) throw new Error("Die Ablage mit Passphrase ist gesperrt. Bitte zuerst die Passphrase eingeben.");
    await set(verschluesselt(a), await verschluesseln(sitzungsSchluessel, w));
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

export const ABLAGEN: Ablage[] = [geraet, sitzung, passphrase, system];

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
  // Gesperrt wären die Schlüssel nicht lesbar und gingen beim Wechsel verloren
  if (alt.id === "passphrase" && passphraseGesperrt() && (await passphraseFestgelegt()))
    throw new Error("Die Ablage mit Passphrase ist gesperrt. Bitte zuerst die Passphrase eingeben, damit die Schlüssel mitziehen können.");
  const werte = await Promise.all(ANBIETER.map(async (a) => [a, await alt.lesen(a)] as const));
  for (const [a, w] of werte) if (w) await ziel.schreiben(a, w);
  await set(WAHL, ziel.id);
  for (const [a, w] of werte) if (w) await alt.schreiben(a, "");
}
