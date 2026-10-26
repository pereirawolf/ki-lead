// JSON-Ergebnis aus einer Modellantwort lösen und die Kurzantwort davon trennen.

/**
 * Ergebnis der Zerlegung (seit 0.6.2 diskriminiert über `ok`, TP-2026-W44-07): mit JSON stehen `json` und `jsonText`,
 * ohne JSON steht `fehler`, dazu `jsonText`, wenn ein Kandidat gefunden, aber nicht lesbar war. `json`, `jsonText` und
 * `fehler` bleiben in beiden Fällen deklariert, damit `z.json === undefined` als Prüfung weiter trägt.
 */
export type Zerlegung =
  | { ok: true; kurzantwort: string; json: unknown; jsonText: string; fehler?: undefined }
  | { ok: false; kurzantwort: string; json?: undefined; jsonText?: string; fehler: string };

/** Findet das am weitesten außen liegende, ausgeglichene {...} ab Position start. */
function ausgeglichen(text: string, start: number): string | undefined {
  let tiefe = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") tiefe++;
    else if (c === "}") {
      tiefe--;
      if (tiefe === 0) return text.slice(start, i + 1);
    }
  }
  return undefined;
}

const ohneZaun = (t: string) => t.replace(/```(?:json|JSON)?\s*$/, "").trim();

export function zerlegeAntwort(text: string): Zerlegung {
  const bloecke = [...text.matchAll(/```(?:json|JSON)?\s*\n([\s\S]*?)\n?```/g)];
  // Den letzten Codeblock nehmen, der mit { beginnt
  for (let i = bloecke.length - 1; i >= 0; i--) {
    const block = bloecke[i]!;
    const inhalt = (block[1] ?? "").trim();
    if (!inhalt.startsWith("{")) continue;
    const kurz = (text.slice(0, block.index) + text.slice(block.index + block[0].length)).trim();
    try {
      return { ok: true, kurzantwort: kurz, json: JSON.parse(inhalt), jsonText: inhalt };
    } catch (e: any) {
      return { ok: false, kurzantwort: kurz, jsonText: inhalt, fehler: `JSON nicht lesbar: ${e.message}` };
    }
  }
  // Ohne geschlossenen Codeblock: Ein offener Zaun (```json ohne Ende, Antwort abgeschnitten) geht vor dem ersten „{“
  // des Textes (seit 0.6.2, TP-2026-W44-10); sonst verschöbe ein „{“ in der Kurzantwort den JSON-Kandidaten.
  const zaun = letzterOffenerZaun(text);
  const start = text.indexOf("{", zaun ?? 0);
  if (start >= 0) {
    const kandidat = ausgeglichen(text, start);
    if (kandidat) {
      const kurz = ohneZaun(text.slice(0, start) + text.slice(start + kandidat.length));
      try {
        return { ok: true, kurzantwort: kurz, json: JSON.parse(kandidat), jsonText: kandidat };
      } catch (e: any) {
        return { ok: false, kurzantwort: kurz, jsonText: kandidat, fehler: `JSON nicht lesbar: ${e.message}` };
      }
    }
    return { ok: false, kurzantwort: ohneZaun(text.slice(0, start)), jsonText: text.slice(start), fehler: "JSON unvollständig (Antwort abgeschnitten?)." };
  }
  return { ok: false, kurzantwort: text.trim(), fehler: "Die Antwort enthält keinen JSON-Block." };
}

/** Position hinter dem letzten öffnenden Zaun „```json“ (oder „```“ mit folgendem „{“), oder undefined */
function letzterOffenerZaun(text: string): number | undefined {
  let pos: number | undefined;
  for (const m of text.matchAll(/```(?:json|JSON)?[ \t]*\r?\n/g)) {
    const ende = m.index + m[0].length;
    if (/^\s*\{/.test(text.slice(ende, ende + 20)) || /json/i.test(m[0])) pos = ende;
  }
  return pos;
}
