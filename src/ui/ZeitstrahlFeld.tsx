// Zeitstrahl auf der Seite „Quellen & Referenzen“ (seit 0.6.9, ZS-2026-W44-01): Textfeld mit einer Zeile je Ereignis
// in fester Form und ein Baukasten für neue Zeilen (Sachverhalt über seine Kennung, Typ, Zeitpunkt, Kurztext).
// „Chronologisch ordnen“ sortiert die Zeilen; Zeilen außerhalb der Form bleiben am Ende stehen.

import { useContext, useEffect, useId, useRef, useState } from "react";
import { jetztLokal } from "../kern/ausgabe";
import { istKennung } from "../kern/kennung";
import { holeWert } from "../kern/pfad";
import type { Profil } from "../kern/typen";
import { zoneOder } from "../kern/zeit";
import { aufnahmeErgaenzen, istAufnahmezeit, naechsteZNr, parseZeitstrahl, zeitstrahlKonfig, zeitstrahlOrdnen, zeitstrahlZeile } from "../kern/zeitstrahl";
import { DatumZeit } from "./DatumZeit";
import { EingabehilfeKontext } from "./eingabehilfeKontext";
import { FeldFehler } from "./HilfeFeld";

interface Props {
  profil: Profil;
  label: string;
  pflicht?: boolean;
  fehler?: string[];
  feld?: string;
  hinweis?: string;
  zeilen?: number;
  wert: string;
  onChange: (v: string) => void;
}

export function ZeitstrahlFeld({ profil, label, pflicht, fehler, feld, hinweis, zeilen, wert, onChange }: Props) {
  const id = useId();
  const kx = useContext(EingabehilfeKontext);
  const r = profil.ui.rollen;
  const kz = zeitstrahlKonfig(profil.ui);
  const zone = zoneOder(profil.manifest.variablen?.zeitzone);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const cursorNach = useRef<number | null>(null);

  // Sachverhalte mit Kennung aus dem aktuellen Stand der Meldung
  const meldung = kx?.aktuell();
  const liste = meldung ? holeWert(meldung, r.sachverhalte) : undefined;
  const sachverhalte = (Array.isArray(liste) ? liste : [])
    .map((sv: any, i: number) => ({
      kennung: r.sv_kennung ? String(holeWert(sv, r.sv_kennung) ?? "") : "",
      titel: (r.sv_bezeichnung && String(holeWert(sv, r.sv_bezeichnung) ?? "")) || `Sachverhalt ${i + 1}`,
    }))
    .filter((s) => istKennung(s.kennung));

  const [kennung, setKennung] = useState("");
  const [typ, setTyp] = useState(kz.typen[0] ?? "");
  const [zeit, setZeit] = useState(() => jetztLokal(zone, new Date()).slice(0, 10));
  const [text, setText] = useState("");
  // Kenntniszeit (ZS-2026-W44-05): Meldezeitpunkt dieser Meldung, wenn gesetzt
  const t0 = meldung && r.meldezeitpunkt ? String(holeWert(meldung, r.meldezeitpunkt) ?? "").slice(0, 16) : "";
  const aufnahme = istAufnahmezeit(t0) ? t0 : undefined;
  const gewaehlt = sachverhalte.some((s) => s.kennung === kennung) ? kennung : (sachverhalte[0]?.kennung ?? "");
  const typGewaehlt = kz.typen.includes(typ) ? typ : (kz.typen[0] ?? "");

  useEffect(() => {
    const c = cursorNach.current;
    const t = textRef.current;
    if (c === null || !t) return;
    cursorNach.current = null;
    t.focus();
    t.setSelectionRange(c, c);
  }, [wert]);

  const zeile = zeitstrahlZeile({
    nr: naechsteZNr(wert),
    zeit: zeit || "JJJJ-MM-TT",
    kennung: gewaehlt || "Kennung",
    typ: typGewaehlt,
    text: text.trim() || "Was ist geschehen? [Qn]",
    aufgenommen: aufnahme,
  });
  const anfuegen = () => {
    const basis = wert.trim() ? wert.replace(/\s+$/, "") + "\n" : "";
    cursorNach.current = basis.length + zeile.length;
    onChange(basis + zeile);
    setText("");
  };
  const lesung = parseZeitstrahl(wert);
  const ohneAufnahme = lesung.eintraege.filter((e) => !e.aufgenommen).length;
  const geordnet = zeitstrahlOrdnen(wert);
  const ungeordnet =
    wert.trim() !== "" &&
    geordnet !==
      wert
        .trim()
        .split(/\r?\n/)
        .map((z) => z.trim())
        .filter(Boolean)
        .join("\n");

  return (
    <div className="feld feld-quellen feld-zeitstrahl" data-feld={feld}>
      <label className={pflicht ? "feld-label pflicht" : "feld-label"} htmlFor={id}>
        {label}
      </label>
      {hinweis && (
        <p className="hinweis feld-hilfe" id={`${id}-hilfe`}>
          {hinweis}
        </p>
      )}
      <textarea
        ref={textRef}
        id={id}
        className="quellen-text zeitstrahl-text"
        rows={zeilen || 8}
        value={wert}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-invalid={fehler?.length ? true : undefined}
        aria-describedby={`${hinweis ? `${id}-hilfe ` : ""}${id}-stand${fehler?.length ? ` ${id}-fehler` : ""}`}
      />
      {!!fehler?.length && <FeldFehler id={`${id}-fehler`} texte={fehler} />}
      <p className="hinweis" id={`${id}-stand`}>
        {lesung.eintraege.length} Zeile{lesung.eintraege.length === 1 ? "" : "n"}
        {lesung.ungueltig.length ? `, davon ${lesung.ungueltig.length} nicht in der festen Form` : ""}
        {ungeordnet ? " · nicht zeitlich geordnet" : ""}
        {ohneAufnahme ? ` · ${ohneAufnahme} ohne Kenntniszeit` : ""}
      </p>
      <div className="zeitstrahl-knoepfe">
        <button type="button" className="knopf leise klein" disabled={!ungeordnet} onClick={() => onChange(geordnet)}>
          Chronologisch ordnen
        </button>
        {ohneAufnahme > 0 && (
          <button
            type="button"
            className="knopf leise klein"
            disabled={!aufnahme}
            title={aufnahme ? undefined : "Zuerst den Meldezeitpunkt angeben"}
            onClick={() => aufnahme && onChange(aufnahmeErgaenzen(wert, aufnahme))}
          >
            Aufnahmezeit ergänzen
          </button>
        )}
      </div>

      <fieldset className="quellen-baukasten">
        <legend>Neue Zeile zusammenstellen</legend>
        {sachverhalte.length === 0 ? (
          <p className="hinweis">
            Noch kein Sachverhalt mit Kennung. Kennungen vergibt die App im Schritt mit den Sachverhalten („Kennung vergeben“); erst dann lässt sich eine Zeile
            zuordnen.
          </p>
        ) : (
          <label className="feld quellen-lagemeldung">
            <span className="quellen-reihe-titel">Sachverhalt</span>
            <select value={gewaehlt} onChange={(e) => setKennung(e.target.value)}>
              {sachverhalte.map((s) => (
                <option key={s.kennung} value={s.kennung}>
                  {s.titel} ({s.kennung})
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="quellen-reihe">
          <span className="quellen-reihe-titel" id={`${id}-typ`}>
            Typ
          </span>
          <div className="mehrfach" role="radiogroup" aria-labelledby={`${id}-typ`}>
            {kz.typen.map((t) => (
              <label key={t} className={typGewaehlt === t ? "chip an" : "chip"}>
                <input type="radio" name={`${id}-typ`} checked={typGewaehlt === t} onChange={() => setTyp(t)} />
                {t}
              </label>
            ))}
          </div>
        </div>
        <div className="quellen-reihe">
          <span className="quellen-reihe-titel">Zeitpunkt</span>
          <DatumZeit
            id={`${id}-zeit`}
            label="Zeitpunkt"
            name="Zeitpunkt der neuen Zeile"
            modus="datum_uhrzeit"
            wert={zeit}
            zeitzone={zone}
            onChange={setZeit}
          />
        </div>
        <label className="feld quellen-lagemeldung">
          <span className="quellen-reihe-titel">Kurztext mit Beleg</span>
          <input type="text" value={text} placeholder="Was ist geschehen? [Qn]" onChange={(e) => setText(e.target.value)} />
        </label>
        <p className="quellen-vorschau">
          <span className="quellen-reihe-titel">Vorschau</span> <code>{zeile}</code>
        </p>
        <button type="button" className="knopf" disabled={!gewaehlt || !zeit} onClick={anfuegen}>
          Zeile anfügen
        </button>
        <p className="hinweis">
          Die Kenntniszeit („aufgenommen“) ist der Meldezeitpunkt dieser Meldung{aufnahme ? "" : "; er ist noch nicht angegeben"}. Frühere Zeilen behalten ihre.
        </p>
        {typGewaehlt === kz.typ_bewertung && (
          <p className="hinweis">Bewertungswechsel trägt die App bei der KI-Fortschreibung selbst ein; von Hand nur, wenn ohne KI fortgeschrieben wird.</p>
        )}
      </fieldset>
    </div>
  );
}
