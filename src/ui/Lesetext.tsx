// Lesekomponente für SOPs und Lesedokumente eines Profils: Markdown als Text mit Überschriften, Listen und Tabellen.
// Rohes HTML im Markdown wird nicht ausgeführt (markdown-it mit `html: false`), Bilder werden nicht geladen, nur
// http(s)-Links führen nach außen. Relative Links öffnen den passenden Eintrag im selben Paket. Der Renderer ist fest
// im Haupt-JavaScript enthalten (kein Nachladen): Ein nachgeladener Teil kann nach einer Neuveröffentlichung in einer
// noch offenen älteren Seite fehlen, und dann erschiene nur Markdown-Quelltext.

import { useMemo, useRef, useState } from "react";
import MarkdownItKlasse, { type MarkdownIt } from "markdown-it";
import type { Profil } from "../kern/typen";
import { inhaltsverzeichnis, linkZiel, type LinkZiel } from "../profil/lesen";
import { dateiAnbieten } from "../speicher/speicher";
import { exportStempel, mitDatum } from "../kern/ausgabe";

interface LeseUmgebung {
  von: string;
  profil: Profil;
  stapel: LinkZiel[];
}

let renderer: MarkdownIt | null = null;

function ladeRenderer(): MarkdownIt {
  if (!renderer) {
    const md = new MarkdownItKlasse({ html: false, linkify: false, typographer: false });
    md.disable(["image"]);
    const standard = (tokens: any[], idx: number, opt: any, _env: any, self: any) => self.renderToken(tokens, idx, opt);
    md.renderer.rules.link_open = (tokens, idx, opt, roh, self) => {
      const env = roh as unknown as LeseUmgebung;
      const t = tokens[idx];
      const ziel: LinkZiel = linkZiel(String(t.attrGet("href") ?? ""), env.von, env.profil);
      env.stapel.push(ziel);
      if (ziel.art === "extern") {
        t.attrSet("target", "_blank");
        t.attrSet("rel", "noopener noreferrer");
        return standard(tokens, idx, opt, env, self);
      }
      if (ziel.art === "sop" || ziel.art === "dokument") {
        t.attrSet("href", "#");
        t.attrSet("data-ziel", ziel.art === "sop" ? `sop:${ziel.id}` : `dokument:${ziel.pfad}`);
        return standard(tokens, idx, opt, env, self);
      }
      return '<span class="link-fehlt">';
    };
    md.renderer.rules.link_close = (tokens, idx, opt, roh, self) => {
      const env = roh as unknown as LeseUmgebung;
      const ziel: LinkZiel | undefined = env.stapel.pop();
      if (ziel && (ziel.art === "fehlt" || ziel.art === "ungueltig"))
        return ziel.art === "fehlt" ? ' <span class="link-hinweis">(nicht im Paket)</span></span>' : "</span>";
      return standard(tokens, idx, opt, env, self);
    };
    renderer = md;
  }
  return renderer;
}

/**
 * Markdown als HTML; Tabellen in einem waagerecht scrollbaren Rahmen. Platzhalter der Arbeitsanweisungen
 * (`{{profil.referenzraum}}`, `{{auftrag.sachverhalt}}`, `{{app.ausgabevertrag}}`, `{{jetzt}}`; Syntax wie
 * `platzhalterIn`) werden hervorgehoben, aber nicht ersetzt.
 */
export function lesetextHtml(text: string, von: string, profil: Profil): string {
  const md = ladeRenderer();
  const umgebung: LeseUmgebung = { von, profil, stapel: [] };
  const html = md.render(text, umgebung as unknown as Parameters<MarkdownIt["render"]>[1]);
  return html
    .replace(/<table>/g, '<div class="tabelle-rahmen"><table>')
    .replace(/<\/table>/g, "</table></div>")
    .replace(/>([^<]+)</g, (_m: string, t: string) => ">" + t.replace(/\{\{\s*[a-z]+(?:\.[a-z_]+)?\s*\}\}/gi, '<span class="platzhalter">$&</span>') + "<");
}

interface Props {
  text: string;
  /** Pfad der Datei im Paket, gegen den relative Links aufgelöst werden */
  von: string;
  profil: Profil;
  /** Aufruf bei einem Link auf einen Eintrag im selben Paket („sop:b08“ bzw. „dokument:sop/CHANGELOG.md“) */
  oeffnen: (ziel: string) => void;
  /** Originaltext und Dateiname für Quelltext und Download (Standard: der dargestellte Text) */
  original?: { text: string; dateiname: string };
}

/** Mindestzahl an Überschriften (Ebenen 2 und 3), ab der ein Inhaltsverzeichnis erscheint. */
export const INHALT_AB = 4;

export function Lesetext({ text, von, profil, oeffnen, original }: Props) {
  const [quelltext, setQuelltext] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const inhalt = useMemo(() => inhaltsverzeichnis(text), [text]);
  // Aufbereitung erst beim Öffnen (die Komponente entsteht erst dann), synchron und ohne Nachladen
  const { html, fehler } = useMemo(() => {
    try {
      return { html: lesetextHtml(text, von, profil), fehler: "" };
    } catch (e) {
      return { html: "", fehler: (e as Error).message || "unbekannter Fehler" };
    }
  }, [text, von, profil]);

  const springen = (index: number) => {
    const ziel = textRef.current?.querySelectorAll("h2, h3")[index] as HTMLElement | undefined;
    if (!ziel) return;
    ziel.setAttribute("tabindex", "-1");
    ziel.scrollIntoView({ block: "start", behavior: "smooth" });
    ziel.focus({ preventScroll: true });
  };
  const roh = original?.text ?? text;
  const lesbar = !quelltext && !fehler;

  return (
    <div className="lesetext-rahmen">
      <div className="lesetext-werkzeuge">
        <button type="button" className="knopf leise klein" aria-pressed={quelltext} onClick={() => setQuelltext((q) => !q)}>
          {quelltext ? "Lesefassung anzeigen" : "Quelltext anzeigen"}
        </button>
        {original && (
          <button
            type="button"
            className="knopf leise klein"
            onClick={() => dateiAnbieten(original.text, mitDatum(exportStempel(profil.manifest.variablen?.zeitzone), original.dateiname), "text/markdown")}
          >
            Originaldatei herunterladen
          </button>
        )}
      </div>
      {lesbar && inhalt.length >= INHALT_AB && (
        <details className="lese-inhalt">
          <summary>Inhalt ({inhalt.length} Abschnitte)</summary>
          <ol>
            {inhalt.map((e) => (
              <li key={e.index} className={e.ebene === 3 ? "lese-inhalt-unter" : undefined}>
                <button type="button" className="lese-inhalt-sprung" onClick={() => springen(e.index)}>
                  {e.titel}
                </button>
              </li>
            ))}
          </ol>
        </details>
      )}
      {fehler && !quelltext && (
        <p className="kasten kasten-fehler" role="alert">
          Die Lesefassung konnte nicht aufbereitet werden ({fehler}). Angezeigt wird der Quelltext.
        </p>
      )}
      {quelltext || fehler ? (
        <pre className="quelltext">{roh}</pre>
      ) : (
        <div
          ref={textRef}
          className="lesetext"
          onClick={(e) => {
            const a = (e.target as HTMLElement).closest("a[data-ziel]");
            if (!a) return;
            e.preventDefault();
            oeffnen(a.getAttribute("data-ziel") || "");
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
