// Dateizugriff der Tests: Repositorywurzel an einer Stelle, Profile laden, JSON-Ordner lesen.
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

/** Profil aus profile/<name> oder privat/profile/<name>; jeder Aufruf lädt frisch (keine geteilten Objekte). */
export async function profil(name: string) {
  const oeffentlich = repoPfad("profile", name);
  const ordner = existsSync(oeffentlich) ? oeffentlich : join(PRIVAT, "profile", name);
  const erg = await ladeProfil(leseOrdner(ordner));
  if (!erg.profil) throw new Error(`Profil „${name}“ nicht ladbar: ` + JSON.stringify(erg.befunde, null, 2));
  return erg;
}

/** Wie profil(), liefert aber nur das geladene Profil. */
export async function profilPflicht(name = "lead-beispiel") {
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
