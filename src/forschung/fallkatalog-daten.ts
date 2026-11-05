// Mitgelieferte Bewertungsfälle und ihr Material für die Fallreihe (seit 0.7.2, TP-2026-W44-63). Eigenes Modul, das
// die Oberfläche erst beim Öffnen der Fallreihe dynamisch lädt: So bleiben Fälle (rund 60 Dateien) und Material
// unter evaluation/material/ (rund 250 KB) in einem eigenen Teil des Builds und nicht im Haupt-JavaScript. Material
// aus den Profilordnern (Ilka-Eingänge) liefern die eingebauten Profile.

import type { Profil } from "../kern/typen";
import { eingebauteProfile } from "../profil/eingebaut";
import { ladeProfil } from "../profil/laden";

const faelle = import.meta.glob<string>(["/evaluation/faelle/*.json", "!/evaluation/faelle/fall.schema.json"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const material = import.meta.glob<string>("/evaluation/material/*.{md,json,txt}", { query: "?raw", import: "default", eager: true });

/** Falldateien als Text, Schlüssel ohne führenden Schrägstrich (evaluation/faelle/<id>.json) */
export function mitgelieferteFalltexte(): Record<string, string> {
  return Object.fromEntries(Object.entries(faelle).map(([k, v]) => [k.slice(1), v]));
}

/** Material der mitgelieferten Fälle: Pfad im Repository → Text (evaluation/material/… und profile/<ordner>/…) */
export function mitgeliefertesMaterial(): Record<string, string> {
  const out: Record<string, string> = Object.fromEntries(Object.entries(material).map(([k, v]) => [k.slice(1), v]));
  for (const p of eingebauteProfile()) for (const [datei, text] of Object.entries(p.dateien)) out[`profile/${p.ordner}/${datei}`] ??= text;
  return out;
}

/** Mitgelieferte Profile nach Manifest-ID: Name und Ordner */
export function profilVerzeichnis(): Record<string, { name: string; ordner: string }> {
  const out: Record<string, { name: string; ordner: string }> = {};
  for (const p of eingebauteProfile()) {
    try {
      const m = JSON.parse(p.dateien["profil.json"] ?? "") as { id?: string; name?: string };
      if (m.id) out[m.id] = { name: m.name ?? m.id, ordner: p.ordner };
    } catch {
      // kein ladbares Manifest: Profil nicht in der Fallreihe
    }
  }
  return out;
}

const geladen = new Map<string, Promise<Profil>>();

/** Lädt ein mitgeliefertes Profil nach seiner Manifest-ID, einmal je Sitzung */
export function eingebautesProfil(id: string): Promise<Profil> {
  let p = geladen.get(id);
  if (!p) {
    p = (async () => {
      const eintrag = eingebauteProfile().find((x) => x.ordner === profilVerzeichnis()[id]?.ordner);
      if (!eintrag) throw new Error(`Das Profil ${id} ist in dieser Ausgabe der App nicht enthalten.`);
      const g = await ladeProfil(eintrag.dateien);
      if (!g.profil) throw new Error(`Das Profil ${id} ist nicht ladbar.`);
      return g.profil;
    })();
    p.catch(() => geladen.delete(id));
    geladen.set(id, p);
  }
  return p;
}
