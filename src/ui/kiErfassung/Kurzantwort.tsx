// Kurzantwort der KI im Schritt „Prüfung und Übergabe“ (seit 0.6.8).
// Die Arbeitsanweisung Erfassung gibt beschriftete Zeilen vor („Kernaussage: …“, „Bitte bestätigen: …“). Die Anzeige
// gliedert sie als Beschreibungsliste mit hervorgehobener Beschriftung, setzt Punkte mit Semikolon (außer in der
// Kernaussage) als Liste und fasst
// Zeilen ohne Inhalt („keine“) in einer leisen Zeile zusammen. Text ohne Beschriftung (ältere Läufe, fremde Profile)
// bleibt Fließtext.

import { LEERANGABE } from "../../pipeline/recherchebefunde";

export interface KurzantwortZeile {
  /** Beschriftung ohne Doppelpunkt; `null` für Text vor der ersten Beschriftung */
  beschriftung: string | null;
  text: string;
}

export interface GegliederteKurzantwort {
  zeilen: KurzantwortZeile[];
  /** Beschriftungen, deren Wert eine Leerangabe ist („keine“, „entfällt“ …) */
  ohneAngabe: string[];
}

/** Beschriftung am Zeilenanfang: Großbuchstabe, höchstens 40 Zeichen und vier Wörter, ohne Satzzeichen außer „/“ und „-“ */
const BESCHRIFTUNG = /^([A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9 /-]{0,39}):\s*(.*)$/;

/** Zerlegt die Kurzantwort in beschriftete Zeilen; Folgezeilen ohne Beschriftung gehören zur vorigen Zeile. */
export function gliedereKurzantwort(text: string): GegliederteKurzantwort {
  const zeilen: KurzantwortZeile[] = [];
  for (const roh of text.replace(/\r\n?/g, "\n").split("\n")) {
    const z = roh.trim();
    if (!z) continue;
    const m = BESCHRIFTUNG.exec(z);
    if (m && m[1]!.trim().split(/\s+/).length <= 4) zeilen.push({ beschriftung: m[1]!.trim(), text: m[2]!.trim() });
    else if (zeilen.length > 0) zeilen[zeilen.length - 1]!.text = `${zeilen[zeilen.length - 1]!.text} ${z}`.trim();
    else zeilen.push({ beschriftung: null, text: z });
  }
  const ohneAngabe = zeilen.filter((z) => z.beschriftung && (z.text === "" || LEERANGABE.test(z.text))).map((z) => z.beschriftung!);
  return { zeilen: zeilen.filter((z) => !z.beschriftung || !ohneAngabe.includes(z.beschriftung)), ohneAngabe };
}

/** Punkte einer Zeile, mit Semikolon getrennt */
export function punkte(text: string): string[] {
  return text
    .split(/;\s+/)
    .map((p) => p.trim().replace(/[.;]$/, ""))
    .filter(Boolean);
}

const KLASSE: Record<string, string> = {
  Kernaussage: "kurzantwort-kern",
  "Dringend prüfen": "kurzantwort-dringend",
};

export function Kurzantwort({ text }: { text: string }) {
  const { zeilen, ohneAngabe } = gliedereKurzantwort(text);
  const beschriftet = zeilen.some((z) => z.beschriftung);
  if (!beschriftet) return <p className="kurzantwort">{text.trim()}</p>;
  return (
    <>
      <dl className="kurzantwort kurzantwort-gegliedert">
        {zeilen.map((z, i) => {
          // die Kernaussage bleibt ein Satz, auch mit Semikolon
          const p = z.beschriftung === "Kernaussage" ? [z.text] : punkte(z.text);
          return (
            <div key={i} className={`kurzantwort-zeile ${(z.beschriftung && KLASSE[z.beschriftung]) || ""}`.trim()}>
              {z.beschriftung && <dt>{z.beschriftung}</dt>}
              <dd>
                {p.length > 1 ? (
                  <ul>
                    {p.map((x, j) => (
                      <li key={j}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  z.text
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      {ohneAngabe.length > 0 && <p className="hinweis kurzantwort-leer">Ohne Angabe: {ohneAngabe.join(", ")}</p>}
    </>
  );
}
