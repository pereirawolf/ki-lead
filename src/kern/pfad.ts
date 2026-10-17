// Pfade in Meldungen: „sachverhalte[0].sofort.beurteilung“, JSON-Pointer „/sachverhalte/0/sofort“
// und generische Pfade „sachverhalte[].sofort.beurteilung“ (für die Darstellungsdatei).

export type Segment = string | number;

export function teilePfad(pfad: string): Segment[] {
  if (!pfad) return [];
  if (pfad.startsWith("/")) {
    return pfad
      .slice(1)
      .split("/")
      .filter((s) => s !== "")
      .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"))
      .map((s) => (/^\d+$/.test(s) ? Number(s) : s));
  }
  const out: Segment[] = [];
  for (const teil of pfad.split(".")) {
    const m = teil.match(/^([^[\]]*)((?:\[\d*\])*)$/);
    if (!m) {
      out.push(teil);
      continue;
    }
    if (m[1]) out.push(m[1]);
    const idx = m[2].match(/\[(\d*)\]/g) || [];
    for (const i of idx) {
      const n = i.slice(1, -1);
      out.push(n === "" ? -1 : Number(n));
    }
  }
  return out;
}

export function generischerPfad(segs: Segment[]): string {
  let s = "";
  for (const seg of segs) {
    if (typeof seg === "number") s += "[]";
    else s += (s ? "." : "") + seg;
  }
  return s;
}

export function holeWert(obj: unknown, pfad: string | Segment[]): any {
  const segs = typeof pfad === "string" ? teilePfad(pfad) : pfad;
  let cur: any = obj;
  for (const seg of segs) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[seg as any];
  }
  return cur;
}

/** Liefert eine Kopie von obj, in der der Wert am Pfad ersetzt ist (strukturelle Teilkopie). */
export function mitWert<T>(obj: T, segs: Segment[], wert: unknown): T {
  if (segs.length === 0) return wert as T;
  const [kopf, ...rest] = segs;
  const basis: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  basis[kopf as any] = mitWert(basis[kopf as any], rest, wert);
  return basis;
}

/** Prüft, ob ein generischer Pfad zu einem Muster mit „*“-Platzhaltern passt. */
export function passtMuster(generisch: string, muster: string): boolean {
  if (generisch === muster) return true;
  if (!muster.includes("*")) return false;
  const a = generisch.split(".");
  const b = muster.split(".");
  if (a.length !== b.length) return false;
  return b.every((teil, i) => (teil === "*" || teil === "*[]" ? true : teil === a[i]));
}
