// Generisches Formular: rendert ein Feld anhand von JSON-Schema und Darstellungsdatei.

import { useId } from "react";
import { aufloesen, enumWerte, leererWert, typen } from "../kern/schema";
import { generischerPfad, type Segment } from "../kern/pfad";
import { alsText, feldUi, bezeichnung, istAusgeblendet, radarFuer } from "../kern/ui";
import { holeWert } from "../kern/pfad";
import type { Profil } from "../kern/typen";
import { RadarFeld } from "./Radar";
import { QuellenFeld } from "./QuellenFeld";
import { DatumZeit } from "./DatumZeit";

export interface FeldProps {
  profil: Profil;
  knoten: any;
  segs: Segment[];
  wert: any;
  setze: (segs: Segment[], wert: unknown) => void;
  /** Für Statusfarben: Beurteilung des umgebenden Listenelements */
  ebene?: number;
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
  const t = typen(k);
  const e = enumWerte(k);

  if (f.widget === "radar") {
    const def = radarFuer(profil.ui, f);
    if (!def) return <p className="fehlertext">Radar „{f.radar}“ ist in der Darstellungsdatei nicht definiert.</p>;
    return (
      <div className="feld">
        <div className="feld-label">{label}</div>
        <Hinweis text={f.hinweis} />
        <RadarFeld def={def} wert={wert} idPraefix={id} onChange={(neu) => setze(segs, neu)} />
      </div>
    );
  }

  if (f.widget === "quellen") {
    return <QuellenFeld profil={profil} label={label} hinweis={f.hinweis} zeilen={f.zeilen} wert={String(wert ?? "")} onChange={(v) => setze(segs, v)} />;
  }

  // Liste von Objekten (z. B. Sachverhalte)
  if (t.includes("array")) {
    const items = aufloesen(k.items, profil.schema);
    const itemEnum = enumWerte(items);
    if (itemEnum) {
      const gewaehlt: unknown[] = Array.isArray(wert) ? wert : [];
      return (
        <fieldset className="feld feld-mehrfach">
          <legend className="feld-label">{label}</legend>
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
      return (
        <fieldset className="feld">
          <legend className="feld-label">{label}</legend>
          <div className="segmente" role="radiogroup">
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
              <label
                key={String(opt)}
                className={
                  wert === opt
                    ? `segment an wert-${String(opt)
                        .toLowerCase()
                        .replace(/[^a-zäöüß]/g, "")}`
                    : "segment"
                }
              >
                <input type="radio" name={id} checked={wert === opt} onChange={() => setze(segs, opt)} />
                {String(opt)}
              </label>
            ))}
          </div>
          <Hinweis text={f.hinweis} />
        </fieldset>
      );
    }
    return (
      <div className="feld">
        <label className={f.pflicht ? "feld-label pflicht" : "feld-label"} htmlFor={id}>
          {label}
        </label>
        {/* Auswahl über den Index, damit Zahlen und Wahrheitswerte ihren Typ behalten */}
        <select
          id={id}
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
        <Hinweis text={f.hinweis} />
      </div>
    );
  }

  if (t.includes("boolean")) {
    if (t.includes("null")) {
      return (
        <div className="feld">
          <label className="feld-label" htmlFor={id}>
            {label}
          </label>
          <select
            id={id}
            value={wert === true ? "ja" : wert === false ? "nein" : ""}
            onChange={(ev) => setze(segs, ev.target.value === "" ? null : ev.target.value === "ja")}
          >
            <option value="">{f.leer_label || "keine Angabe"}</option>
            <option value="ja">ja</option>
            <option value="nein">nein</option>
          </select>
          <Hinweis text={f.hinweis} />
        </div>
      );
    }
    return (
      <div className="feld">
        <label className="schalter" htmlFor={id}>
          <input id={id} type="checkbox" checked={wert === true} onChange={(ev) => setze(segs, ev.target.checked)} />
          <span>{label}</span>
        </label>
        <Hinweis text={f.hinweis} />
      </div>
    );
  }

  if (t.includes("integer") || t.includes("number")) {
    return (
      <div className="feld">
        <label className="feld-label" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={wert ?? ""}
          onChange={(ev) => setze(segs, ev.target.value === "" ? (t.includes("null") ? null : 0) : Number(ev.target.value))}
        />
        <Hinweis text={f.hinweis} />
      </div>
    );
  }

  const widget = f.widget || "text";
  const gemeinsam = {
    id,
    value: typeof wert === "string" ? wert : alsText(wert),
    placeholder: f.platzhalter,
    onChange: (ev: { target: { value: string } }) => setze(segs, ev.target.value),
  };
  return (
    <div className={widget === "text_lang" ? "feld feld-lang" : "feld"}>
      <label className={f.pflicht ? "feld-label pflicht" : "feld-label"} htmlFor={id}>
        {label}
      </label>
      {widget === "text_lang" ? (
        <textarea {...gemeinsam} rows={f.zeilen || 5} />
      ) : widget === "datum" || widget === "datumzeit" || widget === "datum_uhrzeit" ? (
        <DatumZeit id={id} label={label} modus={widget} wert={wert} zeitzone={profil.manifest.variablen?.zeitzone} onChange={(v) => setze(segs, v)} />
      ) : (
        <input {...gemeinsam} type="text" />
      )}
      <Hinweis text={f.hinweis} />
    </div>
  );
}

function ListenFeld({ profil, knoten, segs, wert, setze }: FeldProps) {
  const k = aufloesen(knoten, profil.schema);
  const gen = generischerPfad(segs);
  const f = feldUi(profil.ui, gen);
  const liste: any[] = Array.isArray(wert) ? wert : [];
  const elementName = f.element_label || "Eintrag";
  const r = profil.ui.rollen;
  const istSachverhalte = gen === r.sachverhalte;

  const hinzufuegen = () => setze(segs, [...liste, leererWert(k.items, profil.schema)]);
  const entfernen = (i: number) => {
    const titel = f.titel_feld ? alsText(holeWert(liste[i], f.titel_feld)) : "";
    if (!confirm(`${elementName} ${i + 1}${titel ? ` („${titel}“)` : ""} entfernen?`)) return;
    setze(
      segs,
      liste.filter((_, j) => j !== i),
    );
  };
  return (
    <div className="liste">
      {liste.length === 0 && <p className="leer">Noch kein {elementName} erfasst.</p>}
      {liste.map((el, i) => {
        const titel = f.titel_feld ? alsText(holeWert(el, f.titel_feld)) : "";
        const beurteilung = istSachverhalte && r.sv_beurteilung ? String(holeWert(el, r.sv_beurteilung) || "") : "";
        return (
          <section key={i} className={`element stufe-${beurteilung.toLowerCase().replace(/[^a-zäöüß]/g, "") || "leer"}`} aria-label={`${elementName} ${i + 1}`}>
            <header className="element-kopf">
              <h3>
                <span className="element-nr">
                  {elementName} {i + 1}
                </span>
                <span className="element-titel">{titel || "ohne Bezeichnung"}</span>
              </h3>
              <button type="button" className="knopf leise" onClick={() => entfernen(i)}>
                Entfernen
              </button>
            </header>
            <Feld profil={profil} knoten={k.items} segs={[...segs, i]} wert={el} setze={setze} />
          </section>
        );
      })}
      <button type="button" className="knopf" onClick={hinzufuegen}>
        {f.hinzufuegen || `${elementName} hinzufügen`}
      </button>
    </div>
  );
}
