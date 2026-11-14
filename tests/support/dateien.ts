// Dateizugriff der Tests: Repositorywurzel an einer Stelle, Profile laden, JSON-Ordner lesen.
import { mitGeteilten } from "../../src/profil/geteilt";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ladeProfil } from "../../src/profil/laden";

/** Wurzel des Repositorys (tests/support → ../..) */
export const REPO = join(__dirname, "..", "..");

/** Pfad relativ zur Repositorywurzel, z. B. repoPfad("profile", "lead-beispiel") */
export const repoPfad = (...teile: string[]) => join(REPO, ...teile);

/** Lokaler, nicht eingecheckter Ordner mit organisationsspezifischen Profilen und Testdaten (bleibt optional). */
export const PRIVAT = repoPfad("privat");
export const PRIVAT_VORHANDEN = existsSync(PRIVAT);

/** Liest alle JSON- und Markdown-Dateien eines Ordners (rekursiv) als Pfad → Text. */
export function leseOrdner(ordner: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lauf = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) lauf(p);
      else if (/\.(json|md)$/.test(name)) out[relative(ordner, p)] = readFileSync(p, "utf-8");
    }
  };
  lauf(ordner);
  return out;
}

/**
 * Eingefrorenes Beispielprofil auf LEAD-Meldung-v1 (seit 0.9.0, UP-2026-W45-06): Die Profile im Repository stehen auf v2;
 * die v1-Wege der App (Kennsätze im Text, Migration, Prüfsteine) prüfen die Tests am Stand von lead-beispiel 1.44.0.
 * Der Ordner tests/fixtures/lead-beispiel-v1 enthält nur, was sich mit v2 geändert hat; SOP-Teile B bis D kommen aus dem
 * lebenden Beispielprofil.
 */
export const V1_PROFIL = "lead-beispiel-v1";

/** Dateien des eingefrorenen v1-Profils, ergänzt um die übrigen SOP-Dateien des Beispielprofils */
export function v1ProfilDateien(): Record<string, string> {
  const eigen = leseOrdner(repoPfad("tests", "fixtures", V1_PROFIL));
  const out = { ...eigen };
  for (const [datei, text] of Object.entries(leseOrdner(repoPfad("profile", "lead-beispiel"))))
    if (datei.startsWith("sop/") && !(datei in out)) out[datei] = text;
  return out;
}

/** Profil aus profile/<name> oder privat/profile/<name>; jeder Aufruf lädt frisch (keine geteilten Objekte). */
export async function profil(name: string) {
  if (name === V1_PROFIL) {
    const erg = await ladeProfil(v1ProfilDateien());
    if (!erg.profil) throw new Error(`Profil „${name}“ nicht ladbar: ` + JSON.stringify(erg.befunde, null, 2));
    return erg;
  }
  const oeffentlich = repoPfad("profile", name);
  const ordner = existsSync(oeffentlich) ? oeffentlich : join(PRIVAT, "profile", name);
  // Geteilte Dateien wie bei den eingebauten Profilen (seit 0.6.18, TP-2026-W44-55)
  const erg = await ladeProfil(mitGeteilten(name, leseOrdner(ordner), (von) => leseOrdner(repoPfad("profile", von))));
  if (!erg.profil) throw new Error(`Profil „${name}“ nicht ladbar: ` + JSON.stringify(erg.befunde, null, 2));
  return erg;
}

/** Wie profil(), liefert aber nur das geladene Profil. */
export async function profilPflicht(name = V1_PROFIL) {
  return (await profil(name)).profil!;
}

/**
 * JSON-Dateien eines Ordners (relativ zur Repositorywurzel), nach Namen sortiert, jeweils frisch geparst.
 * Mit pflicht = true scheitert der Aufruf, wenn der Ordner fehlt oder keine JSON-Datei enthält; so können
 * verpflichtende Beispieltests nicht still entfallen. Ohne pflicht ergibt ein fehlender Ordner eine leere Liste.
 */
export function jsonDateien(ordnerImRepo: string, { pflicht = false } = {}): { name: string; daten: any }[] {
  const dir = repoPfad(ordnerImRepo);
  if (!existsSync(dir)) {
    if (pflicht) throw new Error(`Testdaten fehlen: Ordner ${ordnerImRepo} nicht gefunden`);
    return [];
  }
  const namen = readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort();
  if (pflicht && !namen.length) throw new Error(`Testdaten fehlen: keine JSON-Datei in ${ordnerImRepo}`);
  return namen.map((name) => ({ name, daten: JSON.parse(readFileSync(join(dir, name), "utf-8")) }));
}

/**
 * Das ganze Stylesheet der App als Text, wie der Build es zusammensetzt: src/styles.css mit dem Inhalt der per @import
 * eingebundenen Bereichsdateien an ihrer Stelle (seit 0.6.5, TP-2026-W44-19; bis 0.6.4 eine Datei).
 */
export function stylesheetText(): string {
  const haupt = readFileSync(repoPfad("src", "styles.css"), "utf-8");
  return haupt.replace(/@import "\.\/([^"]+)";/g, (_, pfad: string) => readFileSync(repoPfad("src", pfad), "utf-8"));
}
