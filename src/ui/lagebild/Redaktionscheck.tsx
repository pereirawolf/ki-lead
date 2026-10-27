// Reiter „Redaktionscheck“ des Lagebilds (seit 0.6.5, TP-2026-W44-17 aus Lagebild.tsx): Prüfstand (nächste Ausgabe,
// jetzt oder Stichtag), Übersicht, Sprungleiste, Redaktionsbericht und die fünf Abschnitte der Prüfung.

import type { ReactNode } from "react";
import type { Profil } from "../../kern/typen";
import { bezeichnung } from "../../kern/ui";
import { datumDE, exportStempel, jetztLokal, mitDatum } from "../../kern/ausgabe";
import { zeitpunktDE } from "../../kern/zeit";
import { APP_KENNUNG } from "../../kern/version";
import { absender, svKennung, zeitpunktVon, type LagebildEintrag } from "../../lagebild/lagebild";
import { ABSCHNITTE, redaktionsbericht, type redaktionscheck } from "../../lagebild/redaktion";
import { html as esc } from "../../lagebild/ausgabe";
import { dateiAnbieten } from "../../speicher/speicher";
import { Abschnitt, KopierKnopf, Punkt, SvMarken } from "./bausteine";
import { scrollVerhalten } from "../bewegung";

export function Redaktionscheck({
  profil,
  titel,
  eintraege,
  red,
  zone,
  ausgabe,
  setAusgabe,
  ausgabeZeit,
  setAusgabeZeit,
  stichtag,
  setStichtag,
  stichtagAlter,
  zurMeldung,
}: {
  profil: Profil;
  /** Titel des Lagebilds (Dateiname des Berichts) */
  titel: string;
  eintraege: LagebildEintrag[];
  red: ReturnType<typeof redaktionscheck>;
  zone: string;
  ausgabe: string;
  setAusgabe: (t: string) => void;
  ausgabeZeit: string;
  setAusgabeZeit: (z: string) => void;
  /** „JJJJ-MM-TTThh:mm“; leer = Echtzeit */
  stichtag: string;
  setStichtag: (s: string) => void;
  /** Ganze Tage, die ein gesetzter Stichtag hinter der Geräteuhr liegt */
  stichtagAlter: number;
  /** Schaltfläche „Meldung in der Liste zeigen“ */
  zurMeldung: (id: string, bezug?: string) => ReactNode;
}) {
  const ui = profil.ui;
  const r = ui.rollen;
  const lb = ui.lagebild || {};
  const ks = ui.kennsaetze || {};
  const v = lb.verweise || {};
  const lBeurteilung = r.sv_beurteilung ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_beurteilung}`) : "Beurteilung";
  const lTendenz = r.sv_tendenz ? bezeichnung(ui, `${r.sachverhalte}[].${r.sv_tendenz}`) : "Tendenz";

  // Sprung zu einem Abschnitt des Redaktionschecks: Fokus auf den Abschnitt, damit Tastatur und Screenreader folgen
  const springeZu = (e: { preventDefault: () => void }, id: string) => {
    e.preventDefault();
    const ziel = document.getElementById(id);
    ziel?.scrollIntoView?.({ behavior: scrollVerhalten(), block: "start" });
    ziel?.focus?.({ preventScroll: true });
  };

  const berichtSpeichern = (art: "txt" | "json") => {
    const b = redaktionsbericht(red, eintraege, profil, APP_KENNUNG);
    dateiAnbieten(
      art === "json" ? b.json : b.text,
      mitDatum(exportStempel(zone), `Redaktionsbericht_${titel}`, art),
      art === "json" ? "application/json" : "text/plain;charset=utf-8",
    );
  };

  return (
    <div className="lb-redaktion">
      <p className="hinweis">
        Der Redaktionscheck wertet nur vorhandene Felder und die Kennsätze aus und ersetzt nicht die fachliche Prüfung: Gleiche Ereignisart heißt nicht gleicher
        Sachverhalt, und die Zahl der Meldungen belegt keine Verschärfung. Ein Abschnitt ohne Befund heißt nur, dass dessen automatische Regeln nichts gefunden
        haben.
      </p>

      <div className="lb-pruefstand">
        <fieldset className="lb-ausgabe">
          <legend>{lb.ausgabe_label || "Nächste Ausgabe"}</legend>
          <input
            type="date"
            aria-label={`${lb.ausgabe_label || "Nächste Ausgabe"}: Datum`}
            value={ausgabe}
            onChange={(e) => e.target.value && setAusgabe(e.target.value)}
          />
          <input
            type="time"
            aria-label={`${lb.ausgabe_label || "Nächste Ausgabe"}: Uhrzeit (optional)`}
            value={ausgabeZeit}
            onChange={(e) => setAusgabeZeit(e.target.value)}
          />
          <span className="hinweis">
            Maßstab für die zeitkritische Weitergabe{ausgabeZeit ? "" : ". Ohne Uhrzeit gelten Fristen am Ausgabetag als zu klären."}
          </span>
        </fieldset>
        <fieldset className="lb-ausgabe">
          <legend>Geprüft für</legend>
          <label className="lb-wahl">
            <input type="radio" name="lb-pruefstand" checked={!stichtag} onChange={() => setStichtag("")} /> jetzt (laufend aktualisiert)
          </label>
          <label className="lb-wahl">
            <input type="radio" name="lb-pruefstand" checked={!!stichtag} onChange={() => setStichtag(jetztLokal(zone, new Date()))} /> Stichtag
          </label>
          {stichtag && (
            <input
              type="datetime-local"
              aria-label="Stichtag des Redaktionschecks"
              value={stichtag}
              onChange={(e) => e.target.value && setStichtag(e.target.value)}
            />
          )}
          <span className="hinweis">
            Stand {zeitpunktDE(red.stand.jetzt, zone)} ({zone}){stichtag ? " – fester Stichtag, z. B. für Übungen oder rückblickende Prüfung" : ""}
          </span>
        </fieldset>
      </div>

      {stichtag && (
        <div className="kasten kasten-hinweis lb-stichtag-hinweis" role="note">
          <p>
            Stichtag aktiv: geprüft für {zeitpunktDE(red.stand.jetzt, zone)}
            {stichtagAlter > 0 ? `, ${stichtagAlter} Tag${stichtagAlter === 1 ? "" : "e"} zurück` : ""}. Fristen werden nicht mit der Uhr fortgeschrieben.
          </p>
          <button type="button" className="knopf klein" onClick={() => setStichtag("")}>
            Auf „jetzt“ umstellen
          </button>
        </div>
      )}

      <div className="lb-red-uebersicht">
        <p role="status">
          <strong>{red.uebersicht.zeitkritisch}</strong> zeitkritisch · <strong>{red.uebersicht.zuKlaeren}</strong> zu klären ·{" "}
          <strong>{red.uebersicht.info}</strong> Information{red.uebersicht.info === 1 ? "" : "en"}
          <span className="hinweis"> (gezählt wird jeder Befund einzeln: je Frist, Gruppe, Sachverhalt oder Meldung)</span>
        </p>
        <p className="hinweis">
          Ausgewertet: {red.abdeckung.meldungen} Meldung{red.abdeckung.meldungen === 1 ? "" : "en"} nach dem Schema des Profils
          {red.abdeckung.fremd ? `; ${red.abdeckung.fremd} in fremdem Schema nicht ausgewertet` : ""}.
        </p>
        {(red.abdeckung.nichtKonfiguriert.length > 0 || red.abdeckung.hinweise.length > 0) && (
          <ul className="hinweis">
            {red.abdeckung.nichtKonfiguriert.map((x) => (
              <li key={x}>Nicht geprüft – {x}</li>
            ))}
            {red.abdeckung.hinweise.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
        <nav className="lb-red-sprung" aria-label="Abschnitte des Redaktionschecks">
          {ABSCHNITTE.map((t, i) => (
            <a key={t} href={`#lb-red-${i + 1}`} onClick={(e) => springeZu(e, `lb-red-${i + 1}`)}>
              {i + 1} {t} ({red.abschnitte[i]})
            </a>
          ))}
        </nav>
        <div className="aktionen">
          <button type="button" className="knopf klein" onClick={() => berichtSpeichern("txt")}>
            Redaktionsbericht (TXT)
          </button>
          <button type="button" className="knopf klein" onClick={() => berichtSpeichern("json")}>
            Redaktionsbericht (JSON)
          </button>
        </div>
      </div>

      <Abschnitt nr={1} id="lb-red-1" titel={`Zeitfenster „${ks.handlungsrelevant || "Handlungsrelevant bis:"}“`} verweis={v.zeitfenster}>
        {!ks.handlungsrelevant ? (
          <p className="leer">Nicht geprüft: Das Profil definiert keinen Kennsatz für Zeitfenster.</p>
        ) : red.zeit.length === 0 ? (
          <p className="leer">Kein Sachverhalt mit diesem Kennsatz.</p>
        ) : (
          red.zeit.map((z, i) => (
            <Punkt key={i} klasse={z.klasse} marke={z.status} titel={svKennung(z.sv, profil)} aktion={zurMeldung(z.sv.eintrag.id, svKennung(z.sv, profil))}>
              {ks.handlungsrelevant} {z.text}
              {z.datum ? `\nGewertet: ${zeitpunktDE(z.datum, zone)}${z.genauigkeit === "tag" ? " (ohne Uhrzeit: Tagesende angenommen)" : ""}` : ""}
              {z.hinweis ? `\n${z.hinweis}` : ""}
            </Punkt>
          ))
        )}
      </Abschnitt>

      <Abschnitt nr={2} id="lb-red-2" titel="Zusammenhang und abweichende Bewertungen" verweis={v.zusammenhang}>
        {red.gruppen.length === 0 ? (
          <p className="leer">Keine Ereignisart wird in mehr als einer Meldung genannt.</p>
        ) : (
          red.gruppen.map((g) => (
            <Punkt
              key={g.art}
              klasse={g.abweichend || g.tendenzGegenlaeufig ? "warn" : "info"}
              marke={
                g.abweichend
                  ? "Bewertungen weichen ab – falls derselbe Sachverhalt: nebeneinander darstellen"
                  : g.tendenzGegenlaeufig
                    ? "Tendenzen gegenläufig – falls derselbe Sachverhalt: klären"
                    : "Möglicher Zusammenhang – prüfen"
              }
              titel={`${g.art}: ${g.liste.length} Sachverhalte aus ${g.meldungen} Meldungen${g.tendenzGegenlaeufig ? " · Tendenzen gegenläufig" : g.tendenzAbweichend ? " · Tendenzen unterschiedlich" : ""}`}
            >
              <div className="lb-rahmen">
                <table className="tabelle lb-tabelle lb-klein">
                  <thead>
                    <tr>
                      <th>Meldung</th>
                      <th>Stand</th>
                      <th>Sachverhalt</th>
                      {r.sv_ort && <th>{bezeichnung(ui, `${r.sachverhalte}[].${r.sv_ort}`)}</th>}
                      <th>
                        {lBeurteilung}
                        {r.sv_tendenz ? ` / ${lTendenz}` : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.liste.map((s) => (
                      <tr key={`${s.eintrag.id}-${s.index}`}>
                        <td>{absender(s.eintrag, profil)}</td>
                        <td>{datumDE(zeitpunktVon(s.eintrag, profil)) || "–"}</td>
                        <td>{s.bezeichnung || "–"}</td>
                        {r.sv_ort && <td>{s.ort || "–"}</td>}
                        <td>
                          <SvMarken s={s} profil={profil} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {g.baustein && (
                <div className="lb-baustein">
                  <div className="lb-baustein-kopf">
                    <strong>Textbaustein (Entwurf)</strong>
                    <KopierKnopf
                      html={`<p style="font-family:Arial,sans-serif;font-size:10pt;">${esc(g.baustein)}</p>`}
                      text={g.baustein}
                      was={`Textbaustein ${g.art}`}
                    />
                  </div>
                  <p className="hinweis">Nur verwenden, wenn es sich um denselben Sachverhalt handelt; Platzhalter in eckigen Klammern fachlich füllen.</p>
                  <p>{g.baustein}</p>
                </div>
              )}
            </Punkt>
          ))
        )}
        {red.vermerkt.length > 0 && (
          <>
            <h4>Bereits in Meldungen vermerkt („{ks.abweichung}“)</h4>
            {red.vermerkt.map((x, i) => (
              <Punkt key={i} klasse="" titel={svKennung(x.sv, profil)}>
                {ks.abweichung} {x.text}
              </Punkt>
            ))}
          </>
        )}
      </Abschnitt>

      <Abschnitt nr={3} id="lb-red-3" titel="Fortschreibung, Nachlauf und Abschluss" verweis={v.fortschreibung}>
        {!red.nachlauf.length && !red.abschluss.length && !red.aenderung.length && !red.mehrfach.length && !red.marker.length && (
          <p className="leer">Keine Befunde der automatischen Prüfungen dieses Abschnitts.</p>
        )}
        {red.mehrfach.map((m) => (
          <Punkt key={m.stelle} klasse="warn" marke="Mehrere Meldungen derselben Stelle" titel={m.stelle} aktion={zurMeldung(m.eintraege[0]?.id ?? "")}>
            {m.eintraege.map((e) => `${datumDE(zeitpunktVon(e, profil)) || "ohne Zeitpunkt"} – ${e.name}`).join("\n")}
            {"\n"}Fortschreibung? Eine jüngere Meldung ersetzt ältere Angaben nur, soweit sie denselben Gegenstand aktualisiert, berichtigt oder aufhebt.
            Denselben Sachverhalt nicht doppelt zählen; eigenständige Lagen derselben Stelle bleiben nebeneinander gültig.
          </Punkt>
        ))}
        {red.marker.map((x) => (
          <Punkt
            key={`k-${x.sv.eintrag.id}-${x.sv.index}-${x.kennsatz}`}
            klasse="warn"
            marke={x.art === "leer" ? "Kennsatz ohne Inhalt" : "Kennsatz ohne Aussage"}
            titel={svKennung(x.sv, profil)}
            aktion={zurMeldung(x.sv.eintrag.id, svKennung(x.sv, profil))}
          >
            {x.kennsatz} – {x.text}
          </Punkt>
        ))}
        {red.nachlauf.map((s) => (
          <Punkt
            key={`n-${s.eintrag.id}-${s.index}`}
            klasse="warn"
            marke="Nachlauf prüfen"
            titel={svKennung(s, profil)}
            aktion={zurMeldung(s.eintrag.id, svKennung(s, profil))}
          >
            {lTendenz} „{s.tendenz}“ ohne Abschlussvermerk. Ist der Zielzustand erreicht, bestehen Folgewirkungen fort?
            {ks.abschluss
              ? ` Falls abgeschlossen: „${ks.abschluss}“ mit offenen Punkten und Stelle für die Nachsorge; sonst Stand des Wiederanlaufs nennen.`
              : ""}
          </Punkt>
        ))}
        {red.abschluss.map((x) => (
          <Punkt key={`a-${x.sv.eintrag.id}-${x.sv.index}`} klasse="ok" marke="Abschluss vermerkt" titel={svKennung(x.sv, profil)}>
            {ks.abschluss} {x.text}
            {x.rueckblick ? `\nRückblick einplanen${v.rueckblick ? ` (${v.rueckblick})` : ""}.` : ""}
          </Punkt>
        ))}
        {red.aenderung.map((x) => (
          <Punkt key={`f-${x.sv.eintrag.id}-${x.sv.index}`} klasse="info" marke="Fortschreibung" titel={svKennung(x.sv, profil)}>
            {ks.aenderung} {x.text}
          </Punkt>
        ))}
      </Abschnitt>

      <Abschnitt
        nr={4}
        id="lb-red-4"
        titel={`Formale Vollständigkeit bei ${red.hoch.stufen.map((b) => `„${b}“`).join(" / ") || "hoher Beurteilung"}`}
        verweis={v.kernaussage}
      >
        <p className="hinweis">
          Geprüft wird, ob Bewertungstext{ks.neubewertung ? `, Kennsatz „${ks.neubewertung}“` : ""}
          {r.sv_massnahmen ? " und Maßnahmen" : ""} vorhanden sind – nicht, ob die Kernaussage fachlich trägt.
          {red.hoch.abgeleitet && red.hoch.stufen.length ? " Die Stufen sind aus dem Schema abgeleitet; das Profil nennt keine." : ""}
        </p>
        {!red.hoch.stufen.length ? (
          <p className="leer">Nicht geprüft: Keine hohen Beurteilungsstufen bestimmbar.</p>
        ) : red.kern.length === 0 ? (
          <p className="leer">Keine Befunde der automatischen Prüfungen dieses Abschnitts.</p>
        ) : (
          red.kern.map((x, i) => (
            <Punkt key={i} klasse="warn" titel={svKennung(x.sv, profil)} aktion={zurMeldung(x.sv.eintrag.id, svKennung(x.sv, profil))}>
              {x.fehlt.join(" · ")} – ggf. bei der meldenden Stelle nachfragen oder in der eigenen Fassung ergänzen.
            </Punkt>
          ))
        )}
      </Abschnitt>

      <Abschnitt nr={5} id="lb-red-5" titel="Quellen, Schema und Status" verweis={v.quellen}>
        {red.quellen.length === 0 ? (
          <p className="leer">
            {red.abdeckung.meldungen
              ? r.quellen
                ? "Alle ausgewerteten Meldungen bestehen die Schemaprüfung; Quellenverzeichnisse und Verweise ohne Warnhinweis."
                : "Alle ausgewerteten Meldungen bestehen die Schemaprüfung. Quellen werden mangels Profilangabe nicht geprüft."
              : "Keine Meldung nach dem Schema des Profils geladen."}
          </p>
        ) : (
          red.quellen.map((q) => (
            <Punkt
              key={q.eintrag.id}
              klasse={q.klasse}
              einstufung={q.klasse === "info" ? undefined : "zu klären"}
              marke={
                q.eintrag.fremd
                  ? "fremdes Schema"
                  : q.schema
                    ? `Schema: ${q.schema} Abweichung(en)`
                    : q.quellen
                      ? `Quellen: ${q.quellen} Hinweis(e)`
                      : "Hinweis"
              }
              titel={`${absender(q.eintrag, profil)} · ${q.eintrag.name}`}
              aktion={zurMeldung(q.eintrag.id)}
            >
              {q.zeilen.slice(0, 8).join("\n")}
              {q.zeilen.length > 8 && (
                <details className="lb-mehr">
                  <summary>{q.zeilen.length - 8} weitere</summary>
                  {q.zeilen.slice(8).join("\n")}
                </details>
              )}
            </Punkt>
          ))
        )}
      </Abschnitt>
    </div>
  );
}
