// JSON-Ergebnis aus einer Modellantwort lösen und die Kurzantwort davon trennen.

export interface Zerlegung {
  kurzantwort: string;
  json?: unknown;
  jsonText?: string;
  fehler?: string;
}

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
    const inhalt = bloecke[i][1].trim();
    if (!inhalt.startsWith("{")) continue;
    const kurz = (text.slice(0, bloecke[i].index) + text.slice(bloecke[i].index! + bloecke[i][0].length)).trim();
    try {
      return { kurzantwort: kurz, json: JSON.parse(inhalt), jsonText: inhalt };
    } catch (e: any) {
      return { kurzantwort: kurz, jsonText: inhalt, fehler: `JSON nicht lesbar: ${e.message}` };
    }
  }
  // Ohne Codeblock: größtes ausgeglichenes Objekt
  const start = text.indexOf("{");
  if (start >= 0) {
    const kandidat = ausgeglichen(text, start);
    if (kandidat) {
      const kurz = ohneZaun(text.slice(0, start) + text.slice(start + kandidat.length));
      try {
        return { kurzantwort: kurz, json: JSON.parse(kandidat), jsonText: kandidat };
      } catch (e: any) {
        return { kurzantwort: kurz, jsonText: kandidat, fehler: `JSON nicht lesbar: ${e.message}` };
      }
    }
    return { kurzantwort: ohneZaun(text.slice(0, start)), jsonText: text.slice(start), fehler: "JSON unvollständig (Antwort abgeschnitten?)." };
  }
  return { kurzantwort: text.trim(), fehler: "Die Antwort enthält keinen JSON-Block." };
}
