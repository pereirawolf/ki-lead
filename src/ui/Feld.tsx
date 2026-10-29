// Generisches Formular: rendert ein Feld anhand von JSON-Schema und Darstellungsdatei.

import { useContext, useId, useRef } from "react";
import { aufloesen, enumWerte, leererWert, typen } from "../kern/schema";
import { generischerPfad, type Segment } from "../kern/pfad";
import { alsText, feldUi, bezeichnung, istAusgeblendet, radarFuer } from "../kern/ui";
import { holeWert } from "../kern/pfad";
import type { Profil } from "../kern/typen";
import { RadarFeld } from "./Radar";
import { QuellenFeld } from "./QuellenFeld";
import { DatumZeit } from "./DatumZeit";
import { Eingabehilfen } from "./Eingabehilfen";
import { EingabehilfeKontext } from "./eingabehilfeKontext";
import { hilfeFuer, textfeldRelativ } from "../kern/feldhilfen";
import { FeldFehler, HilfeFeld } from "./HilfeFeld";
import { feldSchluessel, FeldBefundeKontext } from "./feldBefunde";
import { rangBeurteilung, signalTendenz } from "../lagebild/lagebild";
import { bestaetigen } from "./bestaetigung";
import { springeZu, useSprung } from "./sprung";

export interface FeldProps {
  profil: Profil;
  knoten: any;
  segs: Segment[];
  wert: any;
  setze: (segs: Segment[], wert: unknown) => void;
  /** Für Statusfarben: Beurteilung des umgebenden Listenelements */
  ebene?: number;
}

/** Name mit übergeordneter Gruppe, wenn die Bezeichnung allein mehrdeutig ist (z. B. „Meldezeitraum, von“) */
function zugaenglicherName(profil: Profil, gen: string, label: string): string | undefined {
  const eltern = gen.includes(".") ? gen.slice(0, gen.lastIndexOf(".")) : "";
  const gruppe = eltern && !eltern.endsWith("[]") ? feldUi(profil.ui, eltern).label : undefined;
  return gruppe ? `${gruppe.replace(/\s*\(optional\)\s*$/, "")}, ${label}` : undefined;
}

function Hinweis({ text }: { text?: string }) {
  return text ? <p className="hinweis">{text}</p> : null;
}

export function Feld(props: FeldProps) {
  const { profil, segs, wert, setze } = props;
  const k = aufloesen(props.knoten, profil.schema);
  const gen = generischerPfad(segs);
  const f = feldUi(profil.ui, gen);
  const label = bezeichnung(profil.ui, gen);
  const id = useId();
  const eingabehilfe = useContext(EingabehilfeKontext);
  const t = typen(k);
  const e = enumWerte(k);
  // Befunde und Pflichtkennzeichen am Feld (seit 0.6.5, TP-2026-W44-15)
  const schluessel = feldSchluessel(segs);
  const fehler = useContext(FeldBefundeKontext)?.befunde.get(schluessel);
  const fehlerId = fehler?.length ? `${id}-fehler` : undefined;
  const pflicht = !!f.pflicht;
  const labelKlasse = pflicht ? "feld-label pflicht" : "feld-label";
  const fehlerText = fehlerId && fehler ? <FeldFehler id={fehlerId} texte={fehler} /> : null;

  if (f.widget === "radar") {
    const def = radarFuer(profil.ui, f);
    if (!def) return <p className="fehlertext">Radar „{f.radar}“ ist in der Darstellungsdatei nicht definiert.</p>;
    return (
      <div className="feld" data-feld={schluessel}>
        <div className={labelKlasse}>{label}</div>
        <Hinweis text={f.hinweis} />
        <RadarFeld def={def} wert={wert} idPraefix={id} onChange={(neu) => setze(segs, neu)} />
        {fehlerText}
      </div>
    );
  }

  if (f.widget === "quellen") {
    return (
      <QuellenFeld
        profil={profil}
        label={label}
        pflicht={pflicht}
        fehler={fehler}
        feld={schluessel}
        hinweis={f.hinweis}
        zeilen={f.zeilen}
        wert={String(wert ?? "")}
        onChange={(v) => setze(segs, v)}
      />
    );
  }

  // Liste von Objekten (z. B. Sachverhalte)
  if (t.includes("array")) {
    const items = aufloesen(k.items, profil.schema);
    const itemEnum = enumWerte(items);
    if (itemEnum) {
      const gewaehlt: unknown[] = Array.isArray(wert) ? wert : [];
      return (
        <fieldset className="feld feld-mehrfach" aria-describedby={fehlerId} data-feld={schluessel}>
          <legend className={labelKlasse}>{label}</legend>
          <Hinweis text={f.hinweis} />
          <div className="mehrfach">
            {itemEnum.map((opt) => {
              const an = gewaehlt.includes(opt);
              return (
                <label key={String(opt)} className={an ? "chip an" : "chip"}>
                  <input type="checkbox" checked={an} onChange={() => setze(segs, an ? gewaehlt.filter((x) => x !== opt) : [...gewaehlt, opt])} />
                  {String(opt)}
                </label>
              );
            })}
          </div>
          {fehlerText}
        </fieldset>
      );
    }
    return <ListenFeld {...props} />;
  }

  if (t.includes("object") || k?.properties) {
    const kinder = Object.keys(k.properties || {}).filter((key) => !(segs.length === 0 && istAusgeblendet(profil.ui, key)));
    const klasse = f.layout === "zeile" ? "gruppe gruppe-zeile" : f.layout === "spalten" ? "gruppe gruppe-spalten" : "gruppe";
    const inhalt = kinder.map((key) => (
      <Feld key={key} profil={profil} knoten={k.properties[key]} segs={[...segs, key]} wert={wert?.[key]} setze={setze} ebene={(props.ebene ?? 0) + 1} />
    ));
    if (!f.label) return <div className="gruppe-ohne-rahmen">{inhalt}</div>;
    return (
      <fieldset className={klasse}>
        <legend>{label}</legend>
        <Hinweis text={f.hinweis} />
        <div className="gruppe-inhalt">{inhalt}</div>
      </fieldset>
    );
  }

  if (e) {
    const leerLabel = f.leer_label || "keine Angabe";
    const optionen = e.filter((x) => x !== "" && x !== null);
    const hatLeer = e.includes("") || e.includes(null);
    if (f.widget === "radio") {
      // Farbe der gewählten Bewertung nach Rang bzw. Tendenz statt nach dem Wort (seit 0.6.5, TP-2026-W44-16)
      const r = profil.ui.rollen;
      const rolle =
        r.sv_beurteilung && gen === `${r.sachverhalte}[].${r.sv_beurteilung}`
          ? "beurteilung"
          : r.sv_tendenz && gen === `${r.sachverhalte}[].${r.sv_tendenz}`
            ? "tendenz"
            : null;
      const signal = (opt: unknown) =>
        rolle === "beurteilung" ? { "data-rang": rangBeurteilung(profil, opt) } : rolle === "tendenz" ? { "data-tendenz": signalTendenz(profil, opt) } : {};
      return (
        <fieldset className="feld" data-feld={schluessel}>
          <legend className={labelKlasse}>{label}</legend>
          <div className="segmente" role="radiogroup" aria-invalid={fehlerId ? true : undefined} aria-describedby={fehlerId}>
            {hatLeer && (
              <label className={wert === "" || wert === null || wert === undefined ? "segment an" : "segment"}>
                <input
                  type="radio"
                  name={id}
                  checked={wert === "" || wert === null || wert === undefined}
                  onChange={() => setze(segs, e.includes("") ? "" : null)}
                />
                {leerLabel}
              </label>
            )}
            {optionen.map((opt) => (
              <label key={String(opt)} className={wert === opt ? "segment an" : "segment"} {...(wert === opt ? signal(opt) : {})}>
                <input type="radio" name={id} checked={wert === opt} onChange={() => setze(segs, opt)} />
                {String(opt)}
              </label>
            ))}
          </div>
          {fehlerText}
          <Hinweis text={f.hinweis} />
        </fieldset>
      );
    }
    return (
      <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} hilfeNach pflicht={pflicht} fehler={fehler}>
        {(a) => (
          /* Auswahl über den Index, damit Zahlen und Wahrheitswerte ihren Typ behalten */
          <select
            {...a}
            value={optionen.findIndex((o) => o === wert) >= 0 ? String(optionen.findIndex((o) => o === wert)) : ""}
            onChange={(ev) => setze(segs, ev.target.value === "" ? (e.includes("") ? "" : null) : optionen[Number(ev.target.value)])}
          >
            {(hatLeer || !optionen.includes(wert)) && <option value="">{f.leer_label || "– bitte wählen –"}</option>}
            {optionen.map((opt, i) => (
              <option key={String(opt)} value={String(i)}>
                {String(opt)}
              </option>
            ))}
          </select>
        )}
      </HilfeFeld>
    );
  }

  if (t.includes("boolean")) {
    if (t.includes("null")) {
      return (
        <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} hilfeNach pflicht={pflicht} fehler={fehler}>
          {(a) => (
            <select
              {...a}
              value={wert === true ? "ja" : wert === false ? "nein" : ""}
              onChange={(ev) => setze(segs, ev.target.value === "" ? null : ev.target.value === "ja")}
            >
              <option value="">{f.leer_label || "keine Angabe"}</option>
              <option value="ja">ja</option>
              <option value="nein">nein</option>
            </select>
          )}
        </HilfeFeld>
      );
    }
    return (
      <div className="feld" data-feld={schluessel}>
        <label className="schalter" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={wert === true}
            aria-invalid={fehlerId ? true : undefined}
            aria-describedby={fehlerId}
            onChange={(ev) => setze(segs, ev.target.checked)}
          />
          <span>{label}</span>
        </label>
        {fehlerText}
        <Hinweis text={f.hinweis} />
      </div>
    );
  }

  if (t.includes("integer") || t.includes("number")) {
    return (
      <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} hilfeNach pflicht={pflicht} fehler={fehler}>
        {(a) => (
          <input
            {...a}
            type="number"
            inputMode="numeric"
            value={wert ?? ""}
            onChange={(ev) => setze(segs, ev.target.value === "" ? (t.includes("null") ? null : 0) : Number(ev.target.value))}
          />
        )}
      </HilfeFeld>
    );
  }

  const widget = f.widget || "text";
  const text = typeof wert === "string" ? wert : alsText(wert);
  const gemeinsam = {
    value: text,
    placeholder: f.platzhalter,
    onChange: (ev: { target: { value: string } }) => setze(segs, ev.target.value),
  };
  return (
    <HilfeFeld
      id={id}
      feld={schluessel}
      lang={widget === "text_lang"}
      label={label}
      hilfe={f.hinweis}
      hilfeNach
      pflicht={pflicht}
      fehler={fehler}
      nach={eingabehilfe && widget === "text_lang" && <EingabehilfenFuer profil={profil} gen={gen} segs={segs} label={label} textId={id} wert={text} />}
    >
      {(a) =>
        widget === "text_lang" ? (
          <textarea {...a} {...gemeinsam} rows={f.zeilen || 5} />
        ) : widget === "datum" || widget === "datumzeit" || widget === "datum_uhrzeit" ? (
          <DatumZeit
            id={id}
            beschreibung={a["aria-describedby"]}
            ungueltig={!!a["aria-invalid"]}
            label={label}
            name={zugaenglicherName(profil, gen, label)}
            modus={widget}
            wert={wert}
            zeitzone={profil.manifest.variablen?.zeitzone}
            onChange={(v) => setze(segs, v)}
          />
        ) : (
          <input {...a} {...gemeinsam} type="text" />
        )
      }
    </HilfeFeld>
  );
}

/** LEAD-Eingabehilfen nur für Rollenfelder mit gültiger Konfiguration im Profil */
function EingabehilfenFuer({
  profil,
  gen,
  segs,
  label,
  textId,
  wert,
}: {
  profil: Profil;
  gen: string;
  segs: Segment[];
  label: string;
  textId: string;
  wert: string;
}) {
  const feld = textfeldRelativ(gen, profil.ui);
  const hilfe = feld ? hilfeFuer(profil.ui, feld.rel) : undefined;
  if (!hilfe) return null;
  return <Eingabehilfen profil={profil} segs={segs} label={label} textId={textId} hilfe={hilfe} wert={wert} />;
}

function ListenFeld({ profil, knoten, segs, wert, setze }: FeldProps) {
  const k = aufloesen(knoten, profil.schema);
  const gen = generischerPfad(segs);
  const f = feldUi(profil.ui, gen);
  const liste: any[] = Array.isArray(wert) ? wert : [];
  const elementName = f.element_label || "Eintrag";
  const r = profil.ui.rollen;
  const istSachverhalte = gen === r.sachverhalte;

  // Sprungziele (seit 0.6.7): Nach „hinzufügen“ der neue Eintrag mit Fokus auf seinem ersten Eingabefeld; nach
  // „Entfernen“ (der Knopf verschwindet) der vorige Eintrag, beim ersten der nachrückende, sonst „hinzufügen“.
  const listeRef = useRef<HTMLDivElement>(null);
  const sprung = useSprung();
  const eintrag = (i: number) => listeRef.current?.querySelectorAll<HTMLElement>(":scope > .element")[i] ?? null;
  const hinzufuegen = () => {
    setze(segs, [...liste, leererWert(k.items, profil.schema)]);
    sprung(() => {
      const neu = eintrag(liste.length);
      springeZu(neu, neu?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea"), { fokus: true });
    });
  };
  const entfernen = async (i: number) => {
    const titel = f.titel_feld ? alsText(holeWert(liste[i], f.titel_feld)) : "";
    if (!(await bestaetigen(`${elementName} ${i + 1}${titel ? ` („${titel}“)` : ""} entfernen?`, { ja: "Entfernen" }))) return;
    setze(
      segs,
      liste.filter((_, j) => j !== i),
    );
    sprung(() => {
      const nachbar = eintrag(i > 0 ? i - 1 : 0);
      if (nachbar) springeZu(nachbar, nachbar.querySelector<HTMLElement>("h3"), { fokus: true, nurWennNoetig: true });
      else springeZu(hinzufuegenRef.current, hinzufuegenRef.current, { fokus: true, nurWennNoetig: true });
    });
  };
  const hinzufuegenRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="liste" ref={listeRef}>
      {liste.length === 0 && <p className="leer">Noch kein {elementName} erfasst.</p>}
      {liste.map((el, i) => {
        const titel = f.titel_feld ? alsText(holeWert(el, f.titel_feld)) : "";
        const beurteilung = istSachverhalte && r.sv_beurteilung ? String(holeWert(el, r.sv_beurteilung) || "") : "";
        return (
          <section
            key={i}
            className="element"
            data-rang={istSachverhalte ? rangBeurteilung(profil, beurteilung) : undefined}
            aria-label={`${elementName} ${i + 1}`}
          >
            <header className="element-kopf">
              <h3>
                <span className="element-nr">
                  {elementName} {i + 1}
                </span>
                <span className="element-titel">{titel || "ohne Bezeichnung"}</span>
              </h3>
              <button type="button" className="knopf leise" aria-label={`${elementName} ${i + 1} entfernen`} onClick={() => entfernen(i)}>
                Entfernen
              </button>
            </header>
            <Feld profil={profil} knoten={k.items} segs={[...segs, i]} wert={el} setze={setze} />
          </section>
        );
      })}
      <button type="button" className="knopf" ref={hinzufuegenRef} onClick={hinzufuegen}>
        {f.hinzufuegen || `${elementName} hinzufügen`}
      </button>
    </div>
  );
}
