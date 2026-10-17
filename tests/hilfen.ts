import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { ladeProfil } from "../src/profil/laden";

export function leseOrdner(ordner: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lauf = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) lauf(p);
      else if (/\.(json|md)$/.test(name)) out[relative(ordner, p)] = readFileSync(p, "utf-8");
    }
  };
  lauf(ordner);
  return out;
}

/** Lokaler, nicht eingecheckter Ordner mit organisationsspezifischen Profilen und Testdaten. */
export const PRIVAT = join(__dirname, "..", "privat");
export const PRIVAT_VORHANDEN = existsSync(PRIVAT);

export async function profil(name: string) {
  const oeffentlich = join(__dirname, "..", "profile", name);
  const ordner = existsSync(oeffentlich) ? oeffentlich : join(PRIVAT, "profile", name);
  const erg = await ladeProfil(leseOrdner(ordner));
  if (!erg.profil) throw new Error("Profil nicht ladbar: " + JSON.stringify(erg.befunde, null, 2));
  return erg;
}

export function jsonDateien(ordner: string): { name: string; daten: any }[] {
  const dir = join(__dirname, ordner);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .map((name) => ({ name, daten: JSON.parse(readFileSync(join(dir, name), "utf-8")) }));
}
