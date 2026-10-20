import { useEffect, useId, useRef, useState } from "react";
import { datumDE, heuteDE } from "../kern/ausgabe";
import {
  QUELLEN_ARTEN,
  erstePlatzhalterstelle,
  kategorienGeordnet,
  naechsteQuellenNr,
  quellenZeile,
  rangfolgeText,
  vorgeschlageneKategorie,
  type QuellenZusaetze,
} from "../kern/quellen";
import type { Profil } from "../kern/typen";

interface Props {
  profil: Profil;
  label: string;
  hinweis?: string;
  zeilen?: number;
  wert: string;
  onChange: (v: string) => void;
}

/** Meldung aus dem gespeicherten Lagebild, als Quelle wählbar */
interface LagebildQuelle {
  id: string;
  text: string;
  rumpf: string;
}

const PROFILVORLAGE = "profil";

/** Rumpf einer Quellenzeile für eine Meldung aus dem Lagebild (Form wie Kodierleitfaden Abschnitt 5): Absender, Meldezeitpunkt, Status, Datei */
export function lagemeldungRumpf(absender: string, zeitpunkt: string, entwurf: boolean, datei: string): string {
  const zeit = zeitpunkt ? datumDE(zeitpunkt) : "Datum";
  return `${absender.replace(/ · /g, ", ")} (${zeit}): Lagemeldung${entwurf ? " (Entwurf)" : ""} (behördenintern), Datei „${datei}“ [Zugriff: {heute}]`;
}

export function QuellenFeld({ profil, label, hinweis, zeilen, wert, onChange }: Props) {
  const id = useId();
  const k = profil.ui.quellen;
  const rang = rangfolgeText(profil.ui);
  const kategorien = kategorienGeordnet(profil.ui);
  const [art, setArt] = useState(PROFILVORLAGE);
  const [kategorie, setKategorie] = useState<string>(() => kategorien[0]?.[0] ?? "");
  const [zusaetze, setZusaetze] = useState<QuellenZusaetze>({});
  const [lagebild, setLagebild] = useState<LagebildQuelle[] | null>(null);
  const [lagebildFehler, setLagebildFehler] = useState<string | null>(null);
  const [lagemeldung, setLagemeldung] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const auswahlNach = useRef<[number, number] | null>(null);

  // Meldungen des gespeicherten Lagebilds erst laden, wenn diese Art gewählt wird
  useEffect(() => {
    if (art !== "lagemeldung" || lagebild) return;
    let gueltig = true;
    (async () => {
      try {
        const [{ lagebildLesen }, lb] = await Promise.all([import("../speicher/speicher"), import("../lagebild/lagebild")]);
        const stand = await lagebildLesen(profil.manifest.id);
        const { eintraege } = lb.einlesen(stand?.dateien || [], profil);
        const r = profil.ui.rollen;
        const liste = eintraege.map((e) => {
          const absender = lb.absender(e, profil);
          const zeitpunkt = lb.zeitpunktVon(e, profil);
          const entwurf = !e.fremd && !!r.status_final && lb.statusVon(e, profil) !== r.status_final;
          return {
            id: e.id,
            text: `${absender}${zeitpunkt ? ` – ${datumDE(zeitpunkt)}` : ""}${entwurf ? " (Entwurf)" : ""}`,
            rumpf: lagemeldungRumpf(absender, zeitpunkt, entwurf, e.name),
          };
        });
        if (gueltig) {
          setLagebild(liste);
          setLagemeldung(liste[0]?.id ?? "");
        }
      } catch (e) {
        if (gueltig) setLagebildFehler(`Das gespeicherte Lagebild konnte nicht gelesen werden (${(e as Error)?.message || "Speicherfehler"}).`);
      }
    })();
    return () => {
      gueltig = false;
    };
  }, [art, lagebild, profil]);

  // Nach dem Einfügen: Feld fokussieren und den ersten Platzhalter markieren, damit man ihn direkt überschreibt
  useEffect(() => {
    const a = auswahlNach.current;
    const t = textRef.current;
    if (!a || !t) return;
    auswahlNach.current = null;
    t.focus();
    t.setSelectionRange(a[0], a[1]);
  }, [wert]);

  const waehleArt = (neu: string) => {
    setArt(neu);
    const v = vorgeschlageneKategorie(neu, profil.ui);
    if (v) setKategorie(v);
  };
  const gewaehlteLagemeldung = art === "lagemeldung" ? lagebild?.find((l) => l.id === lagemeldung) : undefined;
  const zeile = quellenZeile(
    {
      nr: naechsteQuellenNr(wert),
      kategorie,
      art: art === PROFILVORLAGE ? undefined : art,
      rumpf: gewaehlteLagemeldung?.rumpf,
      zusaetze,
      heute: heuteDE(),
    },
    profil.ui,
  );
  const anfuegen = () => {
    const basis = wert.trim() ? wert.replace(/\s+$/, "") + "\n" : "";
    const stelle = erstePlatzhalterstelle(zeile);
    auswahlNach.current = stelle ? [basis.length + stelle[0], basis.length + stelle[1]] : [basis.length + zeile.length, basis.length + zeile.length];
    onChange(basis + zeile);
  };
  const zusatz = (schluessel: keyof QuellenZusaetze, text: string) => (
    <label className={zusaetze[schluessel] ? "chip an" : "chip"}>
      <input type="checkbox" checked={!!zusaetze[schluessel]} onChange={() => setZusaetze((z) => ({ ...z, [schluessel]: !z[schluessel] }))} />
      {text}
    </label>
  );

  return (
    <div className="feld feld-quellen">
      {k && (
        <dl className="kategorien">
          {kategorien.map(([code, text]) => (
            <div key={code}>
              <dt>{code}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      )}
      {rang && (
        <p className="hinweis">
          <strong>Quellenpriorität: {rang}</strong>
        </p>
      )}
      {k?.rangfolge_hinweis && <p className="hinweis">{k.rangfolge_hinweis}</p>}
      <label className="feld-label" htmlFor={id}>
        {label}
      </label>
      <textarea ref={textRef} id={id} className="quellen-text" rows={zeilen || 10} value={wert} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      {hinweis && <p className="hinweis">{hinweis}</p>}

      <fieldset className="quellen-baukasten">
        <legend>Neue Zeile zusammenstellen</legend>
        {kategorien.length > 0 && (
          <div className="quellen-reihe">
            <span className="quellen-reihe-titel" id={`${id}-kat`}>
              Kategorie
            </span>
            <div className="segmente" role="radiogroup" aria-labelledby={`${id}-kat`}>
              {kategorien.map(([code, text]) => (
                <label key={code} className={kategorie === code ? "segment an" : "segment"} title={text}>
                  <input type="radio" name={`${id}-kat`} checked={kategorie === code} onChange={() => setKategorie(code)} />
                  {code}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="quellen-reihe">
          <span className="quellen-reihe-titel" id={`${id}-art`}>
            Art
          </span>
          <div className="mehrfach" role="radiogroup" aria-labelledby={`${id}-art`}>
            {[{ id: PROFILVORLAGE, name: "Allgemein (Vorlage des Profils)" }, ...QUELLEN_ARTEN].map((a) => (
              <label key={a.id} className={art === a.id ? "chip an" : "chip"}>
                <input type="radio" name={`${id}-art`} checked={art === a.id} onChange={() => waehleArt(a.id)} />
                {a.name}
              </label>
            ))}
          </div>
        </div>
        {art === "lagemeldung" && (
          <div className="quellen-reihe">
            {lagebildFehler ? (
              <p className="fehlertext">{lagebildFehler}</p>
            ) : !lagebild ? (
              <p className="hinweis">Lagebild wird gelesen …</p>
            ) : lagebild.length === 0 ? (
              <p className="hinweis">Im Lagebild sind keine Meldungen gespeichert. Die Zeile erhält Platzhalter für Stelle und Zeitpunkt.</p>
            ) : (
              <label className="feld quellen-lagemeldung">
                <span className="quellen-reihe-titel">Meldung</span>
                <select value={lagemeldung} onChange={(e) => setLagemeldung(e.target.value)}>
                  {lagebild.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.text}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        <div className="quellen-reihe">
          <span className="quellen-reihe-titel">Zusätze</span>
          <div className="mehrfach">
            {zusatz("datenstand", "Datenstand")}
            {zusatz("paywall", "Paywall")}
            {zusatz("nichtAusgewertet", "nicht ausgewertet")}
          </div>
        </div>
        <p className="quellen-vorschau" aria-live="polite">
          <span className="quellen-reihe-titel">Vorschau</span> <code>{zeile}</code>
        </p>
        <button type="button" className="knopf" onClick={anfuegen}>
          Zeile anfügen
        </button>
        <p className="hinweis">Nach dem Anfügen ist der erste Platzhalter markiert und lässt sich direkt überschreiben.</p>
      </fieldset>
    </div>
  );
}
