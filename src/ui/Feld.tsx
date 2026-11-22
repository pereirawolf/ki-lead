// Generisches Formular: rendert ein Feld anhand von JSON-Schema und Darstellungsdatei.

import { useContext, useEffect, useId, useRef, useState } from "react";
import { aufloesen, enumWerte, leererWert, typen } from "../kern/schema";
import { generischerPfad, teilePfad, type Segment } from "../kern/pfad";
import { alsText, feldUi, bezeichnung, istAusgeblendet, ordneFelder, radarFuer, wertBezeichnung } from "../kern/ui";
import { holeWert } from "../kern/pfad";
import type { Profil } from "../kern/typen";
import { RadarFeld } from "./Radar";
import { QuellenFeld } from "./QuellenFeld";
import { ZeitstrahlFeld } from "./ZeitstrahlFeld";
import { jetztLokal } from "../kern/ausgabe";
import { kennungenDerMeldung, neueKennung } from "../kern/kennung";
import { alleZeitzonen, NAHE_ZEITZONEN, zeitartImSchema, zeitzonenBezeichnung, zoneOder } from "../kern/zeit";
import { MeldungWurzelKontext } from "./meldungWurzel";
import { MeldungZoneKontext } from "./meldungZone";
import { DatumZeit } from "./DatumZeit";
import { Eingabehilfen } from "./Eingabehilfen";
import { EingabehilfeKontext } from "./eingabehilfeKontext";
import { hilfeFuer, textfeldRelativ } from "../kern/feldhilfen";
import { Beschriftung } from "./Beschriftung";
import { FeldFehler, HilfeFeld, type HilfeFeldEingabe } from "./HilfeFeld";
import { befundeUnter, feldSchluessel, FeldBefundeKontext } from "./feldBefunde";
import { rangBeurteilung, signalTendenz } from "../lagebild/lagebild";
import { bestaetigen } from "./bestaetigung";
import { springeZu, useSprung } from "./sprung";
import { elementTitel } from "../kern/listen";
import { naechsteNummer, nummerPraefix, nummerVon, verweisZiele, werteAmPfad, type VerweisZiel } from "../kern/nummern";
import { nachName, normSchluessel } from "../kern/gebiete";
import { GEBIETE_KERN } from "../pipeline/gebieteDaten";
import { GebietSuche, useVerzeichnisFuer, vorrangDesProfils, zuordnungText } from "./GebietSuche";

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

/** Hilfetext; `feld`: zwischen Beschriftung und Eingabe (Abstand wie in HilfeFeld) */
function Hinweis({ text, id, feld }: { text?: string; id?: string; feld?: boolean }) {
  return text ? (
    <p className={feld ? "hinweis feld-hilfe" : "hinweis"} id={id}>
      {text}
    </p>
  ) : null;
}

/** Kennungen für aria-describedby: Fehlertext und Hilfetext, sofern vorhanden */
function beschrieben(...ids: (string | false | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(" ") || undefined;
}

export function Feld(props: FeldProps) {
  const { profil, segs, wert, setze } = props;
  const k = aufloesen(props.knoten, profil.schema);
  const gen = generischerPfad(segs);
  const f = feldUi(profil.ui, gen);
  const label = bezeichnung(profil.ui, gen);
  const id = useId();
  const eingabehilfe = useContext(EingabehilfeKontext);
  const meldungZone = useContext(MeldungZoneKontext);
  const wurzel = useContext(MeldungWurzelKontext);
  const t = typen(k);
  const e = enumWerte(k);
  // Befunde und Pflichtkennzeichen am Feld (seit 0.6.5, TP-2026-W44-15)
  const schluessel = feldSchluessel(segs);
  const fehler = useContext(FeldBefundeKontext)?.befunde.get(schluessel);
  const fehlerId = fehler?.length ? `${id}-fehler` : undefined;
  const pflicht = !!f.pflicht;
  const labelKlasse = pflicht ? "feld-label pflicht" : "feld-label";
  const fehlerText = fehlerId && fehler ? <FeldFehler id={fehlerId} texte={fehler} /> : null;
  // Hilfetext steht wie in HilfeFeld zwischen Beschriftung und Eingabe (seit 0.6.21)
  const hilfeId = f.hinweis ? `${id}-hilfe` : undefined;

  // Gebiet mit Name und amtlichem Schlüssel; Textfeld, das ein Gebiet nennt (seit 0.9.8)
  if (f.widget === "gebiet") return <GebietObjekt {...props} knoten={k} label={label} />;
  if (f.widget === "gebietsname" && t.includes("string")) {
    const vorrang = vorrangDesProfils(profil);
    return (
      <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} pflicht={pflicht} fehler={fehler}>
        {(a) => (
          <GebietSuche
            id={a.id}
            beschrieben={a["aria-describedby"]}
            ungueltig={!!a["aria-invalid"]}
            platzhalter={f.platzhalter}
            wert={typeof wert === "string" ? wert : ""}
            vorrang={vorrang}
            onText={(text) => setze(segs, text)}
            onWahl={(e) => setze(segs, e.name)}
          />
        )}
      </HilfeFeld>
    );
  }

  if (f.widget === "radar") {
    const def = radarFuer(profil.ui, f);
    if (!def) return <p className="fehlertext">Radar „{f.radar}“ ist in der Darstellungsdatei nicht definiert.</p>;
    return (
      <div className="feld" data-feld={schluessel}>
        <div className={labelKlasse}>
          <Beschriftung text={label} />
        </div>
        <Hinweis text={f.hinweis} id={hilfeId} feld />
        <RadarFeld def={def} wert={wert} idPraefix={id} onChange={(neu) => setze(segs, neu)} />
        {/* Achsen als Objekte (LEAD-Meldung-v2, seit 0.7.3, UP-2026-W45-03): Status, Grund, Begründung und Belege je Achse */}
        {def.achsen.map((a) => {
          const achse = aufloesen(k?.properties?.[a.key], profil.schema);
          if (!achse?.properties) return null;
          const aw = wert && typeof wert === "object" ? (wert as Record<string, any>)[a.key] : undefined;
          return (
            <details key={a.key} className="radar-achse-details">
              <summary>{a.label}: Status, Begründung und Belege</summary>
              {Object.keys(achse.properties)
                .filter((p) => p !== "stufe")
                .map((p) => (
                  <Feld key={p} {...props} knoten={achse.properties[p]} segs={[...segs, a.key, p]} wert={aw?.[p]} />
                ))}
            </details>
          );
        })}
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

  if (f.widget === "zeitstrahl") {
    return (
      <ZeitstrahlFeld
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

  // Kennungen als eine Zeile, getrennt durch Komma, Semikolon oder Leerzeichen (Bezug, seit 0.6.9)
  if (f.widget === "kennungen" && t.includes("array")) {
    // Mit `verweis` (seit 0.9.11, Profilformat 1.39): Auswahl aus der Liste, etwa „Quelle hinzufügen“ aus dem
    // Quellenverzeichnis, und die gewählten Nummern mit ihren Titeln unter der Eingabe
    // ohne den eigenen Eintrag (Ursprung einer Quelle)
    const ziele = f.verweis ? verweisZiele(wurzel, f.verweis, segs)?.filter((z) => z.segs.join("/") !== segs.slice(0, -1).join("/")) : undefined;
    const gewaehlt = Array.isArray(wert) ? wert.map(String) : [];
    return (
      <HilfeFeld
        id={id}
        feld={schluessel}
        label={label}
        hilfe={f.hinweis}
        pflicht={pflicht}
        fehler={fehler}
        nach={ziele ? <VerweisListe profil={profil} ziele={ziele} gewaehlt={gewaehlt} onWahl={(n) => setze(segs, [...gewaehlt, n])} name={label} /> : undefined}
      >
        {(a) => <KennungenEingabe a={a} wert={wert} onChange={(v) => setze(segs, v)} platzhalter={f.platzhalter} />}
      </HilfeFeld>
    );
  }

  // Liste von Objekten (z. B. Sachverhalte)
  if (t.includes("array")) {
    const items = aufloesen(k.items, profil.schema);
    const itemEnum = enumWerte(items);
    if (itemEnum) {
      const gewaehlt: unknown[] = Array.isArray(wert) ? wert : [];
      return (
        <fieldset className="feld feld-mehrfach" aria-describedby={beschrieben(fehlerId, hilfeId)} data-feld={schluessel}>
          <legend className={labelKlasse}>
            <Beschriftung text={label} />
          </legend>
          <Hinweis text={f.hinweis} id={hilfeId} feld />
          <div className="mehrfach">
            {itemEnum.map((opt) => {
              const an = gewaehlt.includes(opt);
              return (
                <label key={String(opt)} className={an ? "chip an" : "chip"}>
                  <input type="checkbox" checked={an} onChange={() => setze(segs, an ? gewaehlt.filter((x) => x !== opt) : [...gewaehlt, opt])} />
                  {wertBezeichnung(profil.ui, opt)}
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
    const kinder = ordneFelder(
      Object.keys(k.properties || {}).filter((key) => !(segs.length === 0 && istAusgeblendet(profil.ui, key))),
      f.reihenfolge,
    );
    // Listenelement: das Titelfeld der Liste (etwa „Bezeichnung“ eines Sachverhalts) zuerst, unabhängig von der
    // Reihenfolge im Schema; Schema und Ausgaben bleiben unverändert (seit 0.6.20, UX-2026-W44-07)
    if (typeof segs[segs.length - 1] === "number") {
      const titelFeld = feldUi(profil.ui, generischerPfad(segs.slice(0, -1))).titel_feld;
      const i = titelFeld ? kinder.indexOf(titelFeld) : -1;
      if (i > 0) kinder.unshift(...kinder.splice(i, 1));
    }
    const klasse = f.layout === "zeile" ? "gruppe gruppe-zeile" : f.layout === "spalten" ? "gruppe gruppe-spalten" : "gruppe";
    const inhalt = kinder.map((key) => (
      <Feld key={key} profil={profil} knoten={k.properties[key]} segs={[...segs, key]} wert={wert?.[key]} setze={setze} ebene={(props.ebene ?? 0) + 1} />
    ));
    // Ohne „label“ ohne Rahmen – außer verschachtelt in einem anderen Objekt (seit 0.6.14, Issue #114, A2): Dort trägt
    // die Gruppe den Feldnamen, damit gleichnamige Felder (etwa „wert“, „einheit“ zweier Messwerte) unterscheidbar bleiben.
    // Listenelemente und Objekte der obersten Ebene bleiben ohne Rahmen.
    const verschachtelt = segs.length >= 2 && typeof segs[segs.length - 1] === "string";
    // Feld der obersten Ebene ohne Maske (segs = []): die ganze Meldung für Nummern und Verweise (seit 0.9.11)
    if (segs.length === 0)
      return (
        <MeldungWurzelKontext.Provider value={wert}>
          <div className="gruppe-ohne-rahmen">{inhalt}</div>
        </MeldungWurzelKontext.Provider>
      );
    if (!f.label && !verschachtelt) return <div className="gruppe-ohne-rahmen">{inhalt}</div>;
    return (
      <fieldset className={klasse}>
        <legend>
          <Beschriftung text={label} />
        </legend>
        <Hinweis text={f.hinweis} />
        <div className="gruppe-inhalt">{inhalt}</div>
      </fieldset>
    );
  }

  // Verweis auf einen Eintrag einer anderen Liste als Auswahl mit Nummer und Titel (seit 0.9.11, Profilformat 1.39),
  // etwa die Empfehlung einer Frist; eine Nummer, die es nicht gibt, bleibt als „nicht vorhanden“ wählbar
  const verweisListe = f.verweis && !e && t.includes("string") ? verweisZiele(wurzel, f.verweis, segs) : undefined;
  if (verweisListe) {
    const aktuell = typeof wert === "string" ? wert : "";
    // Ein Eintrag verweist nicht auf sich selbst (Teilmenge einer Kennzahl, berichtigte Zeile)
    const eigener = segs.slice(0, -1).join("/");
    const ziele = verweisListe.filter((z) => z.segs.join("/") !== eigener);
    return (
      <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} pflicht={pflicht} fehler={fehler}>
        {(a) => (
          <select {...a} value={aktuell} onChange={(ev) => setze(segs, ev.target.value)}>
            <option value="">{f.leer_label || "keine Angabe"}</option>
            {aktuell && !ziele.some((z) => z.id === aktuell) && <option value={aktuell}>{aktuell} – nicht vorhanden</option>}
            {ziele.map((z) => (
              <option key={z.id} value={z.id}>
                {z.id} – {zielTitel(profil, z) || "ohne Titel"}
              </option>
            ))}
          </select>
        )}
      </HilfeFeld>
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
          <legend className={labelKlasse}>
            <Beschriftung text={label} />
          </legend>
          <Hinweis text={f.hinweis} id={hilfeId} feld />
          <div className="segmente" role="radiogroup" aria-invalid={fehlerId ? true : undefined} aria-describedby={beschrieben(fehlerId, hilfeId)}>
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
                {wertBezeichnung(profil.ui, opt)}
              </label>
            ))}
          </div>
          {fehlerText}
        </fieldset>
      );
    }
    return (
      <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} pflicht={pflicht} fehler={fehler}>
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
                {wertBezeichnung(profil.ui, opt)}
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
        <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} pflicht={pflicht} fehler={fehler}>
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
          <span>
            <Beschriftung text={label} />
          </span>
        </label>
        {fehlerText}
        {/* Schalter: Beschriftung steht neben dem Kästchen, der Hinweis darunter (Ausnahme von der Reihenfolge, seit 0.6.21) */}
        <Hinweis text={f.hinweis} />
      </div>
    );
  }

  if (t.includes("integer") || t.includes("number")) {
    return (
      <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} pflicht={pflicht} fehler={fehler}>
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

  // Zeitfelder nach LEAD-Meldung-v2 erkennt die Maske am Schema (seit 0.9.5); die Darstellungsdatei kann übersteuern.
  const zeitart = zeitartImSchema(k, profil.schema);
  const widget = f.widget || (gen === "zeitzone" && t.includes("string") ? "zeitzone" : zeitart) || "text";
  const text = typeof wert === "string" ? wert : alsText(wert);
  if (widget === "kennung") {
    return (
      <HilfeFeld id={id} feld={schluessel} label={label} hilfe={f.hinweis} pflicht={pflicht} fehler={fehler}>
        {(a) => (
          <div className="kennung-feld">
            <input
              {...a}
              type="text"
              value={text}
              spellCheck={false}
              placeholder={f.platzhalter}
              onChange={(ev) => setze(segs, ev.target.value.trim().toUpperCase())}
            />
            {!text.trim() && (
              <button type="button" className="knopf leise klein" onClick={() => setze(segs, kennungFuerNeu(profil, eingabehilfe?.aktuell()))}>
                Kennung vergeben
              </button>
            )}
          </div>
        )}
      </HilfeFeld>
    );
  }
  const gemeinsam = {
    value: text,
    placeholder: f.platzhalter,
    // Wert oder null (seit 0.7.3, UP-2026-W45-03): leere Eingabe heißt „unbekannt“, nicht leerer Text
    onChange: (ev: { target: { value: string } }) => setze(segs, ev.target.value === "" && t.includes("null") && !e ? null : ev.target.value),
  };
  return (
    <HilfeFeld
      id={id}
      feld={schluessel}
      lang={widget === "text_lang"}
      label={label}
      hilfe={f.hinweis}
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
            zeitzone={zeitart ? meldungZone || profil.manifest.variablen?.zeitzone : profil.manifest.variablen?.zeitzone}
            versatz={zeitart === "datumzeit" || zeitart === "datum_uhrzeit"}
            onChange={(v) => setze(segs, v === "" && t.includes("null") ? null : v)}
          />
        ) : widget === "zeitzone" ? (
          <ZeitzonenAuswahl a={a} wert={text} onChange={(v) => setze(segs, v)} />
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

/** Neue Sachverhaltskennung für die Maske: Herkunft aus dem Feld „land“, Datum heute in der Profilzeitzone */
export function kennungFuerNeu(profil: Profil, meldung: Record<string, any> | undefined): string {
  const r = profil.ui.rollen;
  const herkunft = meldung && r.land ? holeWert(meldung, r.land) : profil.manifest.variablen?.[r.land || "land"];
  const heute = jetztLokal(zoneOder(profil.manifest.variablen?.zeitzone), new Date());
  return neueKennung(profil.ui, herkunft, heute, kennungenDerMeldung(meldung, profil.ui));
}

/** Eingabe einer Liste von Kennungen als eine Zeile; übernommen wird beim Verlassen des Felds */
function KennungenEingabe({
  a,
  wert,
  onChange,
  platzhalter,
}: {
  a: Record<string, any>;
  wert: unknown;
  onChange: (v: string[]) => void;
  platzhalter?: string;
}) {
  const liste = Array.isArray(wert) ? wert.map((x) => String(x ?? "")) : [];
  const [roh, setRoh] = useState<string | null>(null);
  const zerlegen = (s: string) => [
    ...new Set(
      s
        .split(/[\s,;]+/)
        .map((x) => x.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  return (
    <input
      {...a}
      type="text"
      spellCheck={false}
      placeholder={platzhalter}
      value={roh ?? liste.join(", ")}
      onChange={(ev) => setRoh(ev.target.value)}
      onBlur={() => {
        if (roh !== null) onChange(zerlegen(roh));
        setRoh(null);
      }}
    />
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
  const listeSchluessel = feldSchluessel(segs);
  const befundKontext = useContext(FeldBefundeKontext);

  // Sachverhalte einklappbar (seit 0.6.20, UX-2026-W44-08): Ein neuer Sachverhalt ist offen; eine geladene Meldung mit
  // mehreren Sachverhalten zeigt sie eingeklappt. Ein Sprung aus dem Prüfschritt öffnet den betroffenen Sachverhalt.
  const dokument = useContext(EingabehilfeKontext)?.dok;
  const [zu, setZu] = useState<ReadonlySet<number>>(() => new Set(istSachverhalte && liste.length > 1 ? liste.map((_, i) => i) : []));
  const ersterDok = useRef(dokument);
  useEffect(() => {
    if (ersterDok.current === dokument) return;
    ersterDok.current = dokument;
    setZu(new Set(istSachverhalte && liste.length > 1 ? liste.map((_, i) => i) : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dokument]);
  const ziel = befundKontext?.ziel;
  const zielIndex = ziel && ziel.startsWith(`${listeSchluessel}/`) ? Number(ziel.slice(listeSchluessel.length + 1).split("/")[0]) : -1;
  useEffect(() => {
    if (zielIndex >= 0 && zu.has(zielIndex))
      setZu((alt) => {
        const neu = new Set(alt);
        neu.delete(zielIndex);
        return neu;
      });
  }, [zielIndex, zu]);
  const istZu = (i: number) => istSachverhalte && zu.has(i) && i !== zielIndex;
  const umschalten = (i: number) =>
    setZu((alt) => {
      const neu = new Set(alt);
      if (istZu(i)) neu.delete(i);
      else neu.add(i);
      return neu;
    });

  // Sprungziele (seit 0.6.7): Nach „hinzufügen“ der neue Eintrag mit Fokus auf seinem ersten Eingabefeld; nach
  // „Entfernen“ (der Knopf verschwindet) der vorige Eintrag, beim ersten der nachrückende, sonst „hinzufügen“.
  const listeRef = useRef<HTMLDivElement>(null);
  const sprung = useSprung();
  const eintrag = (i: number) => listeRef.current?.querySelectorAll<HTMLElement>(":scope > .element")[i] ?? null;
  const kx = useContext(EingabehilfeKontext);
  const wurzel = useContext(MeldungWurzelKontext);
  const hinzufuegen = () => {
    const neu = leererWert(k.items, profil.schema);
    // Neuer Sachverhalt erhält sofort eine Kennung (seit 0.6.9)
    if (istSachverhalte && r.sv_kennung && neu && typeof neu === "object") {
      const pfad = teilePfad(r.sv_kennung);
      let ziel: any = neu;
      for (const seg of pfad.slice(0, -1)) ziel = ziel[seg] && typeof ziel[seg] === "object" ? ziel[seg] : (ziel[seg] = {});
      ziel[pfad[pfad.length - 1]!] = kennungFuerNeu(profil, kx?.aktuell());
    }
    // Nummer des neuen Eintrags (seit 0.9.11): nach dem Muster des Feldes `id`, in der Liste oder in der ganzen Meldung
    const praefix = nummerPraefix(k.items, profil.schema);
    if (praefix && neu && typeof neu === "object" && !nummerVon(neu)) {
      const vorhandene = f.nummern === "meldung" ? werteAmPfad(wurzel ?? kx?.aktuell(), `${gen}[].id`) : liste.map(nummerVon);
      (neu as Record<string, unknown>).id = naechsteNummer(praefix, vorhandene);
    }
    setze(segs, [...liste, neu]);
    sprung(() => {
      const neu = eintrag(liste.length);
      springeZu(neu, neu?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea"), { fokus: true });
    });
  };
  const entfernen = async (i: number) => {
    const titel = elementTitel(profil, segs, liste[i]);
    if (!(await bestaetigen(`${elementName} ${i + 1}${titel ? ` („${titel}“)` : ""} entfernen?`, { ja: "Entfernen" }))) return;
    setze(
      segs,
      liste.filter((_, j) => j !== i),
    );
    setZu((alt) => new Set([...alt].filter((j) => j !== i).map((j) => (j > i ? j - 1 : j))));
    sprung(() => {
      const nachbar = eintrag(i > 0 ? i - 1 : 0);
      if (nachbar) springeZu(nachbar, nachbar.querySelector<HTMLElement>("h3"), { fokus: true, nurWennNoetig: true });
      else springeZu(hinzufuegenRef.current, hinzufuegenRef.current, { fokus: true, nurWennNoetig: true });
    });
  };
  const hinzufuegenRef = useRef<HTMLButtonElement>(null);
  // Nummer im Kopf eines Eintrags, wenn die Liste Nummern führt (seit 0.9.11)
  const nummern = !!nummerPraefix(k.items, profil.schema);
  const liste_ = (
    <div className="liste" ref={listeRef}>
      {liste.length === 0 && <p className="leer">Noch kein {elementName} erfasst.</p>}
      {liste.map((el, i) => {
        const titel = elementTitel(profil, segs, el);
        const beurteilung = istSachverhalte && r.sv_beurteilung ? String(holeWert(el, r.sv_beurteilung) || "") : "";
        const tendenz = istSachverhalte && r.sv_tendenz ? String(holeWert(el, r.sv_tendenz) || "") : "";
        const nBefunde = istSachverhalte && befundKontext ? befundeUnter(befundKontext.befunde, `${listeSchluessel}/${i}`) : 0;
        const geschlossen = istZu(i);
        const inhaltId = `${listeSchluessel.replace(/\W/g, "-")}-${i}-inhalt`;
        return (
          <section
            key={i}
            className={geschlossen ? "element zu" : "element"}
            data-rang={istSachverhalte ? rangBeurteilung(profil, beurteilung) : undefined}
            aria-label={`${elementName} ${i + 1}`}
          >
            <header className="element-kopf">
              <h3>
                <span className="element-nr">
                  {elementName} {i + 1}
                </span>
                <span className="element-titel">{titel || "ohne Bezeichnung"}</span>
                {nummern && nummerVon(el) ? <span className="element-kennung">{nummerVon(el)}</span> : null}
                {istSachverhalte && r.sv_kennung && holeWert(el, r.sv_kennung) ? (
                  <span className="element-kennung">{String(holeWert(el, r.sv_kennung))}</span>
                ) : null}
                {istSachverhalte && (beurteilung || tendenz || nBefunde > 0) ? (
                  <span className="element-stand">
                    {[beurteilung, tendenz].filter(Boolean).join(" · ")}
                    {nBefunde > 0 && (
                      <span className="element-befund">
                        {beurteilung || tendenz ? " · " : ""}
                        {nBefunde} {nBefunde === 1 ? "Feld" : "Felder"} mit Befund
                      </span>
                    )}
                  </span>
                ) : null}
              </h3>
              <span className="element-knoepfe">
                {istSachverhalte && (
                  <button
                    type="button"
                    className="knopf leise"
                    aria-expanded={!geschlossen}
                    aria-controls={inhaltId}
                    aria-label={`${elementName} ${i + 1} ${geschlossen ? "aufklappen" : "einklappen"}`}
                    onClick={() => umschalten(i)}
                  >
                    {geschlossen ? "Aufklappen" : "Einklappen"}
                  </button>
                )}
                <button type="button" className="knopf leise" aria-label={`${elementName} ${i + 1} entfernen`} onClick={() => entfernen(i)}>
                  Entfernen
                </button>
              </span>
            </header>
            <div id={inhaltId} hidden={geschlossen || undefined}>
              {!geschlossen && <Feld profil={profil} knoten={k.items} segs={[...segs, i]} wert={el} setze={setze} />}
            </div>
          </section>
        );
      })}
      <button type="button" className="knopf" ref={hinzufuegenRef} onClick={hinzufuegen}>
        {f.hinzufuegen || `${elementName} hinzufügen`}
      </button>
    </div>
  );
  // Die Sachverhaltsliste steht unter der Überschrift ihres Schritts; jede andere Liste trägt ihre Bezeichnung als
  // Gruppenüberschrift (seit 0.6.14, Issue #114, A2), auch wenn sie leer ist.
  if (istSachverhalte) return liste_;
  return (
    <fieldset className="gruppe gruppe-liste">
      <legend>
        <Beschriftung text={bezeichnung(profil.ui, gen)} />
      </legend>
      <Hinweis text={f.hinweis} />
      <div className="gruppe-inhalt">{liste_}</div>
    </fieldset>
  );
}

/**
 * Zeitzone der Meldung als Auswahl mit lesbaren Namen (seit 0.9.5): oben Deutschland, Nachbarstaaten und UTC,
 * darunter alle IANA-Zonen des Browsers. Ein gespeicherter Wert außerhalb der Liste bleibt wählbar.
 */
function ZeitzonenAuswahl({ a, wert, onChange }: { a: HilfeFeldEingabe; wert: string; onChange: (v: string) => void }) {
  const nahe = NAHE_ZEITZONEN.map(([z]) => z);
  const weitere = alleZeitzonen().filter((z) => !nahe.includes(z));
  const bekannt = !wert || nahe.includes(wert) || weitere.includes(wert);
  return (
    <select {...a} value={wert} onChange={(ev) => onChange(ev.target.value)}>
      {!wert && <option value="">Bitte wählen</option>}
      {!bekannt && <option value={wert}>{wert}</option>}
      <optgroup label="Deutschland und Nachbarstaaten">
        {nahe.map((z) => (
          <option key={z} value={z}>
            {zeitzonenBezeichnung(z)}
          </option>
        ))}
      </optgroup>
      {weitere.length > 0 && (
        <optgroup label="Weitere Zeitzonen">
          {weitere.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

/**
 * Gebiet mit Name und Schlüssel (Widget „gebiet“, seit 0.9.8): Name über die Gebietssuche oder, wenn das Schema die Namen
 * vorgibt (meldende Gebiete eines Profils), als Auswahl; der Schlüssel folgt der Wahl, bleibt aber von Hand änderbar. Die
 * Zeile unter dem Schlüssel nennt das Gebiet dazu. Ein leerer Schlüssel entfällt (das Schema lässt "" nicht zu), „DE-TH“
 * wird beim Verlassen des Felds zu „16“.
 */
function GebietObjekt(props: FeldProps & { label: string }) {
  const { profil, segs, wert, setze, label } = props;
  const k = props.knoten;
  const f = feldUi(profil.ui, generischerPfad(segs));
  const befunde = useContext(FeldBefundeKontext)?.befunde;
  const nameId = useId();
  const schluesselId = useId();
  const o: Record<string, unknown> = wert && typeof wert === "object" && !Array.isArray(wert) ? wert : {};
  const name = typeof o.name === "string" ? o.name : "";
  const schl = typeof o.schluessel === "string" ? o.schluessel : "";
  const v = useVerzeichnisFuer(schl);
  const vorrang = vorrangDesProfils(profil);
  const nameSegs = [...segs, "name"];
  const schlSegs = [...segs, "schluessel"];
  const nameUi = feldUi(profil.ui, generischerPfad(nameSegs));
  const schlUi = feldUi(profil.ui, generischerPfad(schlSegs));
  const nameEnum = enumWerte(aufloesen(k?.properties?.name, profil.schema));
  const setzeGebiet = (n: string, s: string | undefined) => {
    const { schluessel: _alt, ...rest } = o;
    setze(segs, s ? { ...rest, name: n, schluessel: s } : { ...rest, name: n });
  };
  const ausName = (n: string) => ((vorrang && nachName(GEBIETE_KERN, n, vorrang)) || nachName(GEBIETE_KERN, n))?.schluessel;
  const zuordnung = zuordnungText(v, name, schl);
  // Als Listenelement ohne eigenen Rahmen: Nummer, Titel und Knöpfe stehen schon im Kopf des Elements
  const element = typeof segs[segs.length - 1] === "number";
  const inhalt = (
    <>
      <HilfeFeld
        id={nameId}
        feld={feldSchluessel(nameSegs)}
        label={bezeichnung(profil.ui, generischerPfad(nameSegs))}
        hilfe={nameUi.hinweis}
        pflicht={!!nameUi.pflicht}
        fehler={befunde?.get(feldSchluessel(nameSegs))}
      >
        {(a) =>
          nameEnum ? (
            <select {...a} value={name} onChange={(ev) => setzeGebiet(ev.target.value, ausName(ev.target.value))}>
              {!nameEnum.includes(name) && <option value="">{nameUi.leer_label || "– bitte wählen –"}</option>}
              {nameEnum
                .filter((x): x is string => typeof x === "string" && x !== "")
                .map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
            </select>
          ) : (
            <GebietSuche
              id={a.id}
              beschrieben={a["aria-describedby"]}
              ungueltig={!!a["aria-invalid"]}
              platzhalter={nameUi.platzhalter}
              wert={name}
              vorrang={vorrang}
              onText={(text) => setze(nameSegs, text)}
              onWahl={(e) => setzeGebiet(e.name, e.schluessel)}
            />
          )
        }
      </HilfeFeld>
      <HilfeFeld
        id={schluesselId}
        feld={feldSchluessel(schlSegs)}
        label={bezeichnung(profil.ui, generischerPfad(schlSegs))}
        hilfe={schlUi.hinweis}
        fehler={befunde?.get(feldSchluessel(schlSegs))}
        weitere={[zuordnung && `${schluesselId}-zuordnung`]}
        nach={
          zuordnung ? (
            <p className="hinweis gebiet-zuordnung" id={`${schluesselId}-zuordnung`}>
              {zuordnung}
            </p>
          ) : null
        }
      >
        {(a) => (
          <input
            {...a}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={schlUi.platzhalter}
            value={schl}
            onChange={(ev) => setzeGebiet(name, ev.target.value || undefined)}
            onBlur={() => {
              const n = normSchluessel(schl);
              if (n !== schl) setzeGebiet(name, n || undefined);
            }}
          />
        )}
      </HilfeFeld>
    </>
  );
  if (element) return <div className="gruppe-ohne-rahmen gebiet">{inhalt}</div>;
  return (
    <fieldset className="gruppe gebiet" data-feld={feldSchluessel(segs)}>
      <legend>
        <Beschriftung text={label} />
      </legend>
      <Hinweis text={f.hinweis} />
      <div className="gruppe-inhalt">{inhalt}</div>
    </fieldset>
  );
}

/** Titel eines Verweisziels: Titel des Eintrags nach der Darstellungsdatei, gekürzt */
function zielTitel(profil: Profil, z: VerweisZiel): string {
  return elementTitel(profil, z.segs.slice(0, -1), z.eintrag);
}

/**
 * Gewählte Nummern mit Titel und Auswahl weiterer aus der Verweisliste (seit 0.9.11): Ein Beleg lässt sich wählen statt
 * tippen; unbekannte Nummern stehen als „nicht vorhanden“ da (die Prüfung meldet sie ohnehin).
 */
function VerweisListe({
  profil,
  ziele,
  gewaehlt,
  onWahl,
  name,
}: {
  profil: Profil;
  ziele: VerweisZiel[];
  gewaehlt: string[];
  onWahl: (nummer: string) => void;
  name: string;
}) {
  const offen = ziele.filter((z) => !gewaehlt.includes(z.id));
  const titel = new Map(ziele.map((z) => [z.id, zielTitel(profil, z)]));
  return (
    <div className="verweis-liste">
      {gewaehlt.length > 0 && (
        <ul className="verweis-gewaehlt">
          {gewaehlt.map((n) => (
            <li key={n}>
              <span className="element-kennung">{n}</span> {titel.has(n) ? titel.get(n) || "ohne Titel" : <em>nicht vorhanden</em>}
            </li>
          ))}
        </ul>
      )}
      {offen.length > 0 && (
        <select
          className="verweis-wahl"
          aria-label={`${name}: Eintrag hinzufügen`}
          value=""
          onChange={(ev) => {
            if (ev.target.value) onWahl(ev.target.value);
          }}
        >
          <option value="">Hinzufügen …</option>
          {offen.map((z) => (
            <option key={z.id} value={z.id}>
              {z.id} – {titel.get(z.id) || "ohne Titel"}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
