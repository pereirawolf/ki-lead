// Profilverwaltung: eingebaute und importierte Profilpakete, Prüfbericht, Aktivieren, Export.
// Die Profilansicht ist eine reine Leseansicht: Öffnen, Suchen und Lesen verändern weder das aktive Profil noch eine
// Meldung oder einen Nachweis. Aktiviert wird ausschließlich über „Verwenden und Meldung öffnen“.

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Befund, Profil, Sop } from "../kern/typen";
import { gemeinsameSops, sopGruppen } from "../pipeline/kontext";
import {
  arbeitsgrundlagen,
  domId,
  gruppenHinweis,
  lesedokumente,
  sopAnzahl,
  sopAnzeige,
  sopLesetext,
  sopSteckbrief,
  sopSuche,
  type Lesedokument,
} from "../profil/lesen";
import { APP_KENNUNG } from "../pipeline/lauf";
import type { ProfilEintrag } from "../App";
import { ausDateiliste, alsZip } from "../profil/zip";
import { dateiAnbieten } from "../speicher/speicher";
import { Lesetext } from "./Lesetext";
import { exportStempel, mitDatum } from "../kern/ausgabe";

export interface ImportErgebnis {
  ok: boolean;
  befunde: Befund[];
  konflikt?: boolean;
  /** Schlüssel, Name und Version des importierten Profils */
  schluessel?: string;
  name?: string;
  version?: string;
}

interface Props {
  profile: ProfilEintrag[];
  aktiv?: string;
  aktivieren: (schluessel: string) => void;
  importieren: (dateien: Record<string, string>, ersetzen?: boolean) => Promise<ImportErgebnis>;
  loeschen: (schluessel: string) => void;
}

/** Öffnet ein Aufklappelement samt umgebenden Bereichen, scrollt es in den Blick und setzt den Fokus auf den Titel. */
function bereichOeffnen(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  for (let p: HTMLElement | null = el; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
  const summary = el.querySelector(":scope > summary") as HTMLElement | null;
  (summary || el).scrollIntoView({ block: "start", behavior: "smooth" });
  summary?.focus({ preventScroll: true });
}

interface AufklappProps {
  id: string;
  titel: ReactNode;
  tag?: string;
  /** kurzer Zwecksatz unter dem Titel */
  zweck?: string;
  klasse?: string;
  /** Inhalt erst beim ersten Öffnen aufbauen (lange Texte) */
  children: () => ReactNode;
  /** „Schließen“ am Ende des geöffneten Inhalts */
  schliessen?: boolean;
}

/** Natives details/summary; der Inhalt entsteht erst beim ersten Öffnen und bleibt danach erhalten. */
function Aufklapp({ id, titel, tag, zweck, klasse, children, schliessen }: AufklappProps) {
  const [geoeffnet, setGeoeffnet] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details id={id} ref={ref} className={klasse} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && setGeoeffnet(true)}>
      <summary>
        <span className="aufklapp-titel">{titel}</span>
        {tag && (
          <>
            {" "}
            <span className="sop-version">{tag}</span>
          </>
        )}
        {zweck && <span className="aufklapp-zweck">{zweck}</span>}
      </summary>
      {geoeffnet && (
        <div className="aufklapp-inhalt">
          {children()}
          {schliessen && (
            <button
              type="button"
              className="knopf leise klein aufklapp-schliessen"
              onClick={() => {
                const d = ref.current;
                if (!d) return;
                d.open = false;
                const s = d.querySelector(":scope > summary") as HTMLElement | null;
                s?.focus({ preventScroll: true });
                s?.scrollIntoView({ block: "nearest" });
              }}
            >
              Schließen
            </button>
          )}
        </div>
      )}
    </details>
  );
}

function zielOeffner(praefix: string) {
  return (ziel: string) => {
    const [art, ...rest] = ziel.split(":");
    const wert = rest.join(":");
    bereichOeffnen(art === "sop" ? domId(praefix, "sop", wert) : domId(praefix, "dok", wert));
  };
}

function Steckbrief({ sop }: { sop: Sop }) {
  const angaben = sopSteckbrief(sop);
  if (!angaben.length) return null;
  return (
    <dl className="steckbrief">
      {angaben.map((a) => (
        <div key={a.label}>
          <dt>{a.label}</dt>
          <dd>{a.wert}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * SOP-Katalog als Lesehilfe: gemeinsame Regeln, Dach-SOPs und Bausteine mit Steckbrief und Lesetext, mit Suche.
 * Reines Lesen; es verändert keine Meldung und keinen Nachweis in `_entstehung`.
 */
function SopKatalog({ profil, praefix }: { profil: Profil; praefix: string }) {
  const [begriff, setBegriff] = useState("");
  const [imText, setImText] = useState(false);
  const katalogRef = useRef<HTMLDivElement>(null);
  const suchId = useId();
  const gemeinsam = gemeinsameSops(profil);
  const gruppen = useMemo(() => sopGruppen(profil), [profil]);
  const treffer = useMemo(() => sopSuche(profil, begriff, imText), [profil, begriff, imText]);
  if (!gemeinsam.length && !gruppen.length) return null;
  const gesamt = profil.sops.length;
  const oeffnen = zielOeffner(praefix);

  const eintrag = (s: Sop) => {
    const a = sopAnzeige(s);
    return (
      <div key={s.id} hidden={!treffer.has(s.id)}>
        <Aufklapp id={domId(praefix, "sop", s.id)} klasse="lese" titel={a.kennung ? `${a.kennung} ${a.name}` : a.name} tag={a.tag} schliessen>
          {() => (
            <>
              <Steckbrief sop={s} />
              <Lesetext
                text={sopLesetext(s)}
                von={s.datei}
                profil={profil}
                oeffnen={oeffnen}
                original={{ text: profil.dateien[s.datei] ?? s.text, dateiname: dateiname(s.datei) }}
              />
            </>
          )}
        </Aufklapp>
      </div>
    );
  };

  return (
    <details className="sop-katalog" id={domId(praefix, "katalog")}>
      <summary>SOP-Katalog lesen</summary>
      <div ref={katalogRef}>
        <p className="hinweis">Das Tag an einem Eintrag nennt die Fassung dieses einzelnen Dokuments.</p>
        <div className="katalog-werkzeuge">
          <label htmlFor={suchId} className="katalog-suche">
            <span>Suchen</span>
            <input
              id={suchId}
              type="search"
              value={begriff}
              placeholder="Kennung oder Name, z. B. C11, N02, Telekommunikation"
              onChange={(e) => setBegriff(e.target.value)}
            />
          </label>
          <label className="katalog-option">
            <input type="checkbox" checked={imText} onChange={(e) => setImText(e.target.checked)} /> auch im Text
          </label>
          <button
            type="button"
            className="knopf leise klein"
            onClick={() => katalogRef.current?.querySelectorAll("details[open]").forEach((d) => ((d as HTMLDetailsElement).open = false))}
          >
            Alle schließen
          </button>
        </div>
        <p className="katalog-treffer" aria-live="polite">
          {begriff.trim() ? (
            <>
              {treffer.size ? `${treffer.size} von ${gesamt} Einträgen` : "Kein Eintrag passt zur Suche."}{" "}
              <button type="button" className="knopf leise klein" onClick={() => setBegriff("")}>
                Suche zurücksetzen
              </button>
            </>
          ) : (
            `${gesamt} Einträge`
          )}
        </p>
        {gemeinsam.map(eintrag)}
        {gruppen.map((g) => {
          const hinweis = gruppenHinweis(g.sops);
          return (
            <div key={g.titel} className="sop-gruppe" hidden={!g.sops.some((s) => treffer.has(s.id))}>
              <p className="sop-gruppe-titel">
                {g.titel}
                {hinweis && <span className="sop-gruppe-hinweis"> · {hinweis}</span>}
              </p>
              {g.sops.map(eintrag)}
            </div>
          );
        })}
      </div>
    </details>
  );
}

/** Lesedokumente des Pakets (README, Änderungsverläufe, Arbeitsanweisungen, Kodierleitfaden), nur soweit vorhanden. */
function dateiname(pfad: string): string {
  return pfad.replace(/^.*\//, "");
}

/** Kopfzeile eines geöffneten Lesedokuments: Datei, eigene Fassung und Stand, Profil und Profilversion. */
function DokumentKopf({ d, profil }: { d: Lesedokument; profil: Profil }) {
  if (d.quelle === "app")
    return (
      <p className="dokument-kopf dokument-app">
        <strong>Standardfassung der App ({APP_KENNUNG}), kein Bestandteil des Profils.</strong> Das Profil bringt für diese Aufgabe keine eigene
        Arbeitsanweisung mit; die App verwendet beim KI-Lauf diesen Text.
      </p>
    );
  const fassung = d.version ? `Fassung ${d.version}${d.stand ? ` vom ${d.stand}` : ""}` : "Fassung nicht angegeben";
  return (
    <p className="dokument-kopf">
      Datei <code>{d.pfad}</code> · {fassung} · Profil „{profil.manifest.name}“, Profilversion {profil.manifest.version}
    </p>
  );
}

function LeseDokument({ d, profil, praefix, oeffnen }: { d: Lesedokument; profil: Profil; praefix: string; oeffnen: (ziel: string) => void }) {
  const tag = d.version ? `v${d.version}` : d.quelle === "app" ? "Standardfassung der App" : d.rolle ? "Fassung nicht angegeben" : undefined;
  return (
    <Aufklapp id={domId(praefix, "dok", d.pfad)} klasse="lese" titel={d.titel} tag={tag} zweck={d.zweck} schliessen>
      {() => (
        <>
          <DokumentKopf d={d} profil={profil} />
          {d.rolle && d.rolle !== "kodierleitfaden" && (
            <p className="hinweis">
              Vorlage: Platzhalter wie <span className="platzhalter">{"{{profil.referenzraum}}"}</span> setzt die App erst beim KI-Lauf mit den Werten des
              Profils und des Auftrags ein.
            </p>
          )}
          <Lesetext
            text={d.text}
            von={d.quelle === "paket" ? d.pfad : ""}
            profil={profil}
            oeffnen={oeffnen}
            original={{ text: d.text, dateiname: d.quelle === "paket" ? dateiname(d.pfad) : `standardfassung-${d.rolle}.md` }}
          />
        </>
      )}
    </Aufklapp>
  );
}

/** Arbeitsanweisungen (Erfassung, Verdichtung, Kurzfassung) und Kodierleitfaden des Profils, mit eigener Fassung. */
function Arbeitsgrundlagen({ profil, praefix }: { profil: Profil; praefix: string }) {
  const doks = arbeitsgrundlagen(profil);
  if (!doks.length) return null;
  const oeffnen = zielOeffner(praefix);
  return (
    <details className="sop-katalog profil-arbeit" id={domId(praefix, "arbeit")}>
      <summary>Arbeitsanweisungen und Kodierleitfaden lesen</summary>
      <p className="hinweis">Die Texte, nach denen die KI arbeitet, aus dem geladenen Paket.</p>
      {doks.map((d) => (
        <LeseDokument key={d.pfad} d={d} profil={profil} praefix={praefix} oeffnen={oeffnen} />
      ))}
    </details>
  );
}

/** Übersichten und Änderungsverläufe des Pakets (README, CHANGELOG), nur soweit vorhanden. */
function Dokumentation({ profil, praefix }: { profil: Profil; praefix: string }) {
  const doks = lesedokumente(profil);
  if (!doks.length) return null;
  const gruppen = [...new Set(doks.map((d) => d.gruppe))];
  const oeffnen = zielOeffner(praefix);
  return (
    <details className="sop-katalog profil-doku" id={domId(praefix, "doku")}>
      <summary>Dokumentation lesen</summary>
      <p className="hinweis">Übersichten und Änderungsverläufe aus dem geladenen Paket; passt damit zu Profilversion und Prüfsumme.</p>
      {gruppen.map((g) => (
        <div key={g} className="sop-gruppe">
          <p className="sop-gruppe-titel">{g}</p>
          {doks
            .filter((d) => d.gruppe === g)
            .map((d) => (
              <LeseDokument key={d.pfad} d={d} profil={profil} praefix={praefix} oeffnen={oeffnen} />
            ))}
        </div>
      ))}
    </details>
  );
}

function Pruefsumme({ hash }: { hash: string }) {
  const [voll, setVoll] = useState(false);
  const [status, setStatus] = useState("");
  return (
    <dd className="pruefsumme">
      <code className="hash" title={hash}>
        {hash.slice(0, 12)}
      </code>{" "}
      <button
        type="button"
        className="knopf leise klein"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(hash);
            setStatus("Prüfsumme kopiert.");
          } catch {
            setVoll(true);
            setStatus("Kopieren nicht möglich; bitte den Wert markieren.");
          }
        }}
      >
        Kopieren
      </button>{" "}
      <button type="button" className="knopf leise klein" aria-expanded={voll} onClick={() => setVoll((v) => !v)}>
        {voll ? "Kurz anzeigen" : "Vollständig anzeigen"}
      </button>
      {voll && <code className="hash-voll">{hash}</code>}
      <span className="pruefsumme-status" aria-live="polite">
        {status}
      </span>
    </dd>
  );
}

function Befunde({ befunde }: { befunde: Befund[] }) {
  if (!befunde.length) return <p className="befund-ok">Prüfung ohne Befund.</p>;
  return (
    <ul className="befunde">
      {befunde.map((b, i) => (
        <li key={i} className={`befund befund-${b.stufe}`}>
          <span className="befund-stufe">{b.stufe === "fehler" ? "Fehler" : b.stufe === "warnung" ? "Warnung" : "Hinweis"}</span> {b.text}
        </li>
      ))}
    </ul>
  );
}

interface MenueEintrag {
  text: string;
  aktion: () => void;
}

/**
 * Aufklappmenü nach dem Disclosure-Muster: ein Knopf mit aria-expanded, darunter eine Liste gewöhnlicher Knöpfe.
 * Schließt nach der Auswahl, mit Escape (Fokus zurück auf den Knopf), beim Klick außerhalb und wenn der Fokus das Menü verlässt.
 */
function Menue({ text, label, klasse, eintraege }: { text: string; label?: string; klasse: string; eintraege: MenueEintrag[] }) {
  const [offen, setOffen] = useState(false);
  const listId = useId();
  const wurzel = useRef<HTMLDivElement>(null);
  const knopfRef = useRef<HTMLButtonElement>(null);
  /** Liste am linken Rand des Knopfs ausrichten, wenn sie rechtsbündig links aus dem Bild liefe (schmale Bildschirme) */
  const [links, setLinks] = useState(false);
  useLayoutEffect(() => {
    if (!offen) return setLinks(false);
    const k = knopfRef.current?.getBoundingClientRect();
    const liste = wurzel.current?.querySelector(".menue-liste")?.getBoundingClientRect();
    if (k && liste) setLinks(k.right - liste.width < 8);
  }, [offen]);
  useEffect(() => {
    if (!offen) return;
    const aussen = (e: PointerEvent) => {
      if (!wurzel.current?.contains(e.target as Node)) setOffen(false);
    };
    document.addEventListener("pointerdown", aussen);
    return () => document.removeEventListener("pointerdown", aussen);
  }, [offen]);
  return (
    <div
      className="menue"
      ref={wurzel}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !offen) return;
        e.stopPropagation();
        setOffen(false);
        knopfRef.current?.focus();
      }}
      onBlur={(e) => {
        // Nur bei einem Fokuswechsel auf ein anderes Element; Safari fokussiert angeklickte Knöpfe nicht (relatedTarget leer)
        const ziel = e.relatedTarget as Node | null;
        if (ziel && !wurzel.current?.contains(ziel)) setOffen(false);
      }}
    >
      <button
        ref={knopfRef}
        type="button"
        className={klasse}
        aria-expanded={offen}
        aria-controls={offen ? listId : undefined}
        aria-label={label}
        onClick={() => setOffen((o) => !o)}
      >
        {text}
        <span className="menue-pfeil" aria-hidden="true">
          ▾
        </span>
      </button>
      {offen && (
        <ul id={listId} className={links ? "menue-liste menue-links" : "menue-liste"}>
          {eintraege.map((m) => (
            <li key={m.text}>
              <button
                type="button"
                className="menue-eintrag"
                onClick={() => {
                  setOffen(false);
                  m.aktion();
                }}
              >
                {m.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Scrollt zu einem Abschnitt der Karte und setzt den Fokus auf seine Überschrift (Sprungleiste). */
function abschnittZeigen(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: "start", behavior: "smooth" });
  el.focus({ preventScroll: true });
}

/** Befundstatus am Kartentitel; führt zum Prüfbericht. Ohne Fehler und Warnungen „Geprüft“. */
function BefundChip({ befunde, ziel }: { befunde: Befund[]; ziel: string }) {
  const zahl = befundZahl(befunde);
  const stufe = befunde.some((b) => b.stufe === "fehler") ? "fehler" : befunde.some((b) => b.stufe === "warnung") ? "warnung" : "ok";
  return (
    <a
      className={`befund-chip befund-chip-${stufe}`}
      href={`#${ziel}`}
      onClick={(e) => {
        e.preventDefault();
        bereichOeffnen(ziel);
      }}
    >
      {stufe === "ok" ? "✓ Geprüft" : zahl}
    </a>
  );
}

/** „1 Fehler, 2 Warnungen“; leer ohne Fehler und Warnungen. */
function befundZahl(befunde: Befund[]): string {
  const f = befunde.filter((b) => b.stufe === "fehler").length;
  const w = befunde.filter((b) => b.stufe === "warnung").length;
  return [f ? `${f} Fehler` : "", w ? `${w} Warnung${w === 1 ? "" : "en"}` : ""].filter(Boolean).join(", ");
}

/**
 * Inhalt einer Profilkarte: beim verwendeten Profil offen, bei den übrigen hinter „Angaben, Lesetexte und Prüfung“,
 * damit die Liste auch mit mehreren importierten Profilen überschaubar bleibt. Sprünge (Befunde, Verweise in Lesetexten)
 * öffnen das umgebende Element über bereichOeffnen().
 */
function KartenInhalt({ offen, children }: { offen: boolean; children: ReactNode }) {
  if (offen) return <>{children}</>;
  return (
    <details className="profil-details">
      <summary>Angaben, Lesetexte und Prüfung</summary>
      {children}
    </details>
  );
}

function herkunft(p: ProfilEintrag): string {
  return p.quelle === "eingebaut" ? "Mitgeliefert" : `Importiert${p.importiertAm ? " am " + new Date(p.importiertAm).toLocaleDateString("de-DE") : ""}`;
}

export function ProfileAnsicht({ profile, aktiv, aktivieren, importieren, loeschen }: Props) {
  const zipRef = useRef<HTMLInputElement>(null);
  const ordnerRef = useRef<HTMLInputElement>(null);
  const [bericht, setBericht] = useState<ImportErgebnis | null>(null);

  const einlesen = async (liste: FileList | null) => {
    if (!liste || !liste.length) return;
    try {
      const dateien = await ausDateiliste(liste);
      let erg = await importieren(dateien);
      if (
        erg.konflikt &&
        confirm(`${erg.befunde[0]?.text}\n\nTrotzdem ersetzen? Der bisherige Stand wird im Gerät archiviert, damit ältere Läufe nachvollziehbar bleiben.`)
      )
        erg = await importieren(dateien, true);
      setBericht(erg);
    } catch (e) {
      setBericht({ ok: false, befunde: [{ stufe: "fehler", text: `Das Paket konnte nicht gelesen werden: ${(e as Error).message}` }] });
    }
  };

  // Höhe des Kopfs der App als --kopf-hoehe für die Sprungleiste; der Kopf bricht je nach Breite um
  useEffect(() => {
    const kopf = document.querySelector<HTMLElement>(".kopf");
    if (!kopf || typeof ResizeObserver === "undefined") return;
    const setzen = () => document.documentElement.style.setProperty("--kopf-hoehe", `${kopf.getBoundingClientRect().height}px`);
    setzen();
    const beobachter = new ResizeObserver(setzen);
    beobachter.observe(kopf);
    return () => beobachter.disconnect();
  }, []);

  const importiertAktiv = bericht?.schluessel !== undefined && bericht.schluessel === aktiv;
  /** Das verwendete Profil zuerst, die übrigen in bisheriger Reihenfolge */
  const reihenfolge = [...profile.filter((p) => p.schluessel === aktiv), ...profile.filter((p) => p.schluessel !== aktiv)];

  return (
    <div className="profile">
      <div className="werkzeugleiste">
        <div className="werkzeugleiste-text">
          <h1>Profile</h1>
          <p>
            Ein Profil bündelt Schema, Darstellung, Arbeitsanweisungen, SOPs und Kodierleitfaden einer Organisation oder Ebene; beim Wechsel behält jedes Profil
            seinen eigenen Meldungs-Zwischenstand.
          </p>
        </div>
        <div className="werkzeugleiste-knoepfe">
          <Menue
            text="Profil hinzufügen"
            klasse="knopf primaer"
            eintraege={[
              { text: "Profilpaket importieren (ZIP)", aktion: () => zipRef.current?.click() },
              { text: "Ordner wählen", aktion: () => ordnerRef.current?.click() },
            ]}
          />
          <input
            ref={zipRef}
            type="file"
            accept=".zip,.leadprofil,.json,.md"
            multiple
            hidden
            onChange={(e) => {
              einlesen(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={ordnerRef}
            type="file"
            hidden
            multiple
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            onChange={(e) => {
              einlesen(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {bericht && (
        <div className={`kasten ${bericht.ok ? "kasten-ok" : "kasten-fehler"}`} role="status">
          <h3>
            {bericht.ok
              ? `Profil importiert: ${bericht.name ?? bericht.schluessel}${bericht.version ? `, Profilversion ${bericht.version}` : ""}`
              : "Profil nicht importiert"}
          </h3>
          {bericht.ok && <p>{importiertAktiv ? "Das Profil ist in Verwendung." : "Das Profil ist hinzugefügt, aber noch nicht in Verwendung."}</p>}
          <Befunde befunde={bericht.befunde} />
          <div className="aktionen">
            {bericht.ok && bericht.schluessel && !importiertAktiv && (
              <button type="button" className="knopf primaer" onClick={() => aktivieren(bericht.schluessel!)}>
                Jetzt verwenden
              </button>
            )}
            <button type="button" className="knopf leise klein" onClick={() => setBericht(null)}>
              Ausblenden
            </button>
          </div>
        </div>
      )}

      <div className="profilliste">
        {reihenfolge.map((p) => {
          const m = p.profil?.manifest;
          const istAktiv = p.schluessel === aktiv;
          const praefix = domId("profil", p.schluessel);
          const zahl = befundZahl(p.befunde);
          const dateien = Object.keys(p.dateien).sort();
          return (
            <article key={p.schluessel} className={istAktiv ? "profil aktiv" : "profil"} aria-label={m?.name || p.schluessel}>
              <header className="profil-kopf">
                <div className="profil-titel">
                  <h2>{m?.name || p.schluessel}</h2>
                  {istAktiv && <span className="aktiv-marke">✓ In Verwendung</span>}
                  {!p.profil && <span className="marke-fehler">nicht verwendbar</span>}
                  <BefundChip befunde={p.befunde} ziel={`${praefix}-bericht`} />
                </div>
                <div className="profil-kopf-aktionen">
                  {p.profil && !istAktiv && (
                    <button type="button" className="knopf primaer" onClick={() => aktivieren(p.schluessel)}>
                      Verwenden und Meldung öffnen
                    </button>
                  )}
                  <Menue
                    text="Mehr"
                    label={`Mehr zu Profil „${m?.name || p.schluessel}“`}
                    klasse="knopf leise"
                    eintraege={[
                      {
                        text: "Als Paket exportieren",
                        aktion: async () => {
                          const stempel = exportStempel(p.profil?.manifest.variablen?.zeitzone);
                          dateiAnbieten(await alsZip(p.dateien, p.schluessel), mitDatum(stempel, p.schluessel, "leadprofil"), "application/zip");
                        },
                      },
                      ...(p.quelle === "importiert"
                        ? [{ text: "Entfernen", aktion: () => confirm(`Profil „${m?.name || p.schluessel}“ entfernen?`) && loeschen(p.schluessel) }]
                        : []),
                    ]}
                  />
                </div>
              </header>
              <p className="profil-meta">
                {m ? `Profilversion ${m.version} · ` : ""}
                {herkunft(p)}
              </p>
              <KartenInhalt offen={istAktiv}>
                {p.profil && (
                  <nav className="profil-sprungleiste" aria-label={`Abschnitte von Profil „${m?.name || p.schluessel}“`}>
                    {[
                      ["angaben", "Angaben"],
                      ["lesen", "Lesen"],
                      ["pruefen", "Prüfen"],
                    ].map(([teil, text]) => (
                      <a
                        key={teil}
                        href={`#${praefix}-${teil}`}
                        onClick={(e) => {
                          e.preventDefault();
                          abschnittZeigen(`${praefix}-${teil}`);
                        }}
                      >
                        {text}
                      </a>
                    ))}
                  </nav>
                )}
                {!p.profil && m?.beschreibung && <p className="profil-beschreibung">{m.beschreibung}</p>}
                {p.profil && (
                  <section className="profil-bereich profil-angaben" aria-labelledby={`${praefix}-angaben`}>
                    <h3 id={`${praefix}-angaben`} tabIndex={-1}>
                      Angaben
                    </h3>
                    {m?.beschreibung && <p className="profil-beschreibung">{m.beschreibung}</p>}
                    <dl className="profil-daten">
                      <div>
                        <dt>Ebene</dt>
                        <dd>{m?.ebene || "–"}</dd>
                      </div>
                      <div>
                        <dt>Referenzraum</dt>
                        <dd>{m?.referenzraum || "–"}</dd>
                      </div>
                      <div className="profil-daten-breit">
                        <dt>SOPs und Bausteine</dt>
                        <dd>{sopAnzahl(p.profil)}</dd>
                      </div>
                      {m?.herausgeber && (
                        <div className="profil-daten-breit">
                          <dt>Herausgeber</dt>
                          <dd>{m.herausgeber}</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}
                {p.profil && (
                  <section className="profil-bereich" aria-labelledby={`${praefix}-lesen`}>
                    <h3 id={`${praefix}-lesen`} tabIndex={-1}>
                      Lesen
                    </h3>
                    <p className="hinweis">Zum Nachlesen ohne KI. Öffnen und Suchen verändern keine Meldung, keinen Nachweis und kein aktives Profil.</p>
                    <Arbeitsgrundlagen profil={p.profil} praefix={praefix} />
                    <SopKatalog profil={p.profil} praefix={praefix} />
                    <Dokumentation profil={p.profil} praefix={praefix} />
                  </section>
                )}
                <section className="profil-bereich" aria-labelledby={`${praefix}-pruefen`}>
                  <h3 id={`${praefix}-pruefen`} tabIndex={-1}>
                    Prüfen
                  </h3>
                  {p.profil && (
                    <>
                      <dl className="profil-daten profil-technik">
                        <div>
                          <dt>Schema</dt>
                          <dd className="technisch">{m?.meldung.schema_id}</dd>
                        </div>
                        {m?.lizenz && (
                          <div>
                            <dt>Lizenz</dt>
                            <dd>{m.lizenz}</dd>
                          </div>
                        )}
                        <div className="profil-daten-breit">
                          <dt>Prüfsumme</dt>
                          <Pruefsumme hash={p.profil.hash} />
                        </div>
                      </dl>
                      <p className="hinweis">Die Profilversion nennt den Stand des Pakets, die Prüfsumme seinen konkreten Inhalt.</p>
                    </>
                  )}
                  <details id={`${praefix}-bericht`}>
                    <summary>Prüfbericht{zahl ? ` (${zahl})` : ""}</summary>
                    <Befunde befunde={p.befunde} />
                  </details>
                  <details>
                    <summary>Dateien ({dateien.length})</summary>
                    <ul className="dateiliste">
                      {dateien.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </details>
                </section>
              </KartenInhalt>
            </article>
          );
        })}
      </div>
    </div>
  );
}
