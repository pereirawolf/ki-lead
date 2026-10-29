// Schritt „Gegenstand bestätigen“ der KI-Erfassung (seit 0.6.5, TP-2026-W44-17 in eigener Datei): Vorschlag aus S1
// prüfen und korrigieren, bei „Recherche durchführen“ Orientierungssuche und Suchbegriffe, dann S2 starten.

import { useMemo, type Dispatch } from "react";
import { sopKennung } from "../../profil/sop";
import { modellFuer, werkzeugeFuer } from "../../pipeline/einstellungen";
import { s2UmfangWarnung } from "../../pipeline/schaetzung";
import { anwendungsbereich, ereignisarten, fachSops, istInhaltsgeruest, sopGruppen, sopsNachArtwechsel } from "../../pipeline/kontext";
import { laufKostenText, type Lauf, type S1Vorschlag, type Suchbegriff } from "../../pipeline/lauf";
import { pflichtRegel } from "../../pipeline/recherchetiefe";
import { absenderFuer, istVerdichtung, vormeldungStand } from "../../pipeline/material";
import { s2Umfang } from "../../pipeline/s2s3";
import { gueltigerZeitpunkt } from "../../kern/zeit";
import { HilfeFeld } from "../HilfeFeld";
import { LaufSchaetzung } from "../LaufSchaetzung";
import { LaufModellWahl } from "./LaufModellWahl";
import { OFFLINE_HINWEIS, OfflineHinweis, ProtokollKnopf, type LaufRahmen } from "./rahmen";
import { absenderZeile, kurzeAdresse, rechercheZeile, zeitAnzeige } from "./recherche";
import { TEXT_FELD } from "./texte";
import type { KiAktion } from "./zustand";

export function Bestaetigung({
  rahmen,
  lauf,
  vorschlag,
  dispatch,
  orientierungAn,
  orientierungStarten,
  s2Starten,
  zurueck,
}: {
  rahmen: LaufRahmen;
  lauf: Lauf;
  vorschlag: S1Vorschlag;
  dispatch: Dispatch<KiAktion>;
  /** Orientierungssuche in S1 möglich (Recherche, Modell mit Websuche, Einstellungen) */
  orientierungAn: boolean;
  /** `nur`: nur diese Sachverhalte (Index ab 0) */
  orientierungStarten: (nur?: number[]) => void;
  s2Starten: () => void;
  zurueck: () => void;
}) {
  const { profil, laufEinstellungen, verdichtung, material, eingaenge, stufeS2, stufeS3, schaetzS2, offline } = rahmen;
  const setVorschlag = (v: S1Vorschlag) => dispatch({ typ: "vorschlag", vorschlag: v });
  // Gleiche Arrays über Renderläufe (ModellWahl und LaufSchaetzung sind memo, seit 0.6.5, TP-2026-W44-18)
  const modellStufen = useMemo(() => [stufeS2, stufeS3], [stufeS2, stufeS3]);
  const schaetzStufen = useMemo(() => [schaetzS2], [schaetzS2]);
  const arten = useMemo(() => ereignisarten(profil), [profil]);
  const sops = useMemo(() => fachSops(profil), [profil]);
  const sopGliederung = useMemo(() => sopGruppen(profil), [profil]);
  const vormeldungsStand = vormeldungStand(material, profil);
  const absender = useMemo(() => absenderFuer(material, profil), [material, profil]);
  // Umfang der Anfrage an S2 vor dem Start (seit 0.6.4, TP-2026-W44-31); Material ist nur je Datei begrenzt
  const umfangS2 = useMemo(
    () => s2UmfangWarnung(s2Umfang(profil, material, lauf.auftrag.urls, lauf.auftrag.stichworte, vorschlag)),
    [profil, material, lauf, vorschlag],
  );
  const t0Ungueltig = !!vorschlag.meldezeitpunkt && !gueltigerZeitpunkt(vorschlag.meldezeitpunkt);
  /** Verweis der Startknöpfe auf den Grund der Sperre */
  const beschreibung = [t0Ungueltig && "t0-ungueltig", offline && OFFLINE_HINWEIS].filter(Boolean).join(" ") || undefined;
  // Orientierungssuche und Pflichtsuchen (seit 0.6.0, KP-2026-W44-06)
  const rechercheLauf = lauf.auftrag.websuche !== false;
  const orientiert = vorschlag.sachverhalte.some((sv) => sv.orientierung !== undefined);
  const regel = pflichtRegel(laufEinstellungen);
  const suchbegriffeZeigen =
    rechercheLauf &&
    regel.max > 0 &&
    werkzeugeFuer(modellFuer(verdichtung ? "verdichtung" : "erfassung", laufEinstellungen, profil), laufEinstellungen).websuche;
  const nichtZugeordnet = verdichtung ? eingaenge.filter((m) => !vorschlag.sachverhalte.some((s) => s.eingangsmeldungen?.includes(m.name))) : [];

  const setzeSv = (i: number, teil: Partial<S1Vorschlag["sachverhalte"][number]>) => {
    const sv = vorschlag.sachverhalte.map((s, j) => (j === i ? { ...s, ...teil } : s));
    setVorschlag({ ...vorschlag, sachverhalte: sv });
  };
  const artUmschalten = (i: number, art: string) => {
    const s = vorschlag.sachverhalte[i];
    if (!s) return;
    const neu = sopsNachArtwechsel(profil, s.sops, s.ereignisarten, art);
    setzeSv(i, { ereignisarten: neu.arten, sops: neu.sops });
  };
  const setzeBegriffe = (i: number, liste: Suchbegriff[]) => setzeSv(i, { suchbegriffe: liste });
  const zusammenfuehren = (i: number) => {
    if (i < 1) return;
    const a = vorschlag.sachverhalte[i - 1];
    const b = vorschlag.sachverhalte[i];
    if (!a || !b) return;
    const vereint = {
      titel: [a.titel, b.titel].filter(Boolean).join(" / "),
      ereignisarten: [...new Set([...a.ereignisarten, ...b.ereignisarten])],
      sops: [...new Set([...a.sops, ...b.sops])],
      begruendung: [a.begruendung, b.begruendung].filter(Boolean).join(" "),
      ...(a.eingangsmeldungen || b.eingangsmeldungen
        ? { eingangsmeldungen: [...new Set([...(a.eingangsmeldungen || []), ...(b.eingangsmeldungen || [])])] }
        : {}),
    };
    setVorschlag({ ...vorschlag, sachverhalte: [...vorschlag.sachverhalte.slice(0, i - 1), vereint, ...vorschlag.sachverhalte.slice(i + 1)] });
  };

  return (
    <>
      <h2 tabIndex={-1}>Gegenstand bestätigen</h2>
      <p className="einleitung">
        Vorschlag aus Stufe S1. Prüfe Gliederung, Ereignisarten und SOPs und korrigiere sie bei Bedarf. Erst danach beginnt die Recherche.
      </p>
      {!!vorschlag.appHinweise?.length && (
        <div className="kasten kasten-hinweis" role="status">
          <h3>Hinweise der App</h3>
          {vorschlag.appHinweise.map((h, i) => (
            <p key={i}>{h}</p>
          ))}
        </div>
      )}
      {vorschlag.hinweise && (
        <div className="kasten kasten-info">
          <h3>Hinweise aus S1</h3>
          <p>{vorschlag.hinweise}</p>
        </div>
      )}
      <HilfeFeld lang label={TEXT_FELD.gegenstand.label} hilfe={TEXT_FELD.gegenstandS1.hilfe}>
        {(a) => <textarea {...a} rows={3} value={vorschlag.gegenstand} onChange={(e) => setVorschlag({ ...vorschlag, gegenstand: e.target.value })} />}
      </HilfeFeld>
      <div className="gruppe-spalten-zwei">
        <label className="feld">
          <span className="feld-label">Stichtag</span>
          <input type="date" value={vorschlag.stichtag} onChange={(e) => setVorschlag({ ...vorschlag, stichtag: e.target.value })} />
        </label>
        <label className="feld">
          <span className="feld-label">Meldezeitpunkt (t0)</span>
          <div className="datum-zeit">
            <input
              type="date"
              aria-label="Datum t0"
              value={(vorschlag.meldezeitpunkt || "").slice(0, 10)}
              onChange={(e) => setVorschlag({ ...vorschlag, meldezeitpunkt: `${e.target.value}T${(vorschlag.meldezeitpunkt || "").slice(11, 16) || "12:00"}` })}
            />
            <input
              type="time"
              aria-label="Uhrzeit t0"
              value={(vorschlag.meldezeitpunkt || "").slice(11, 16)}
              onChange={(e) =>
                setVorschlag({
                  ...vorschlag,
                  meldezeitpunkt: `${(vorschlag.meldezeitpunkt || "").slice(0, 10) || vorschlag.stichtag}T${e.target.value}`,
                })
              }
            />
          </div>
          {t0Ungueltig && (
            <span className="fehlertext" id="t0-ungueltig" role="alert">
              Bitte Datum und Uhrzeit des Meldezeitpunkts vollständig angeben; S2 startet erst mit einem gültigen t0.
            </span>
          )}
          <span className="hinweis">
            Bezugszeitpunkt der Bewertung. Bei Übungs- oder Altlagen kurz nach dem jüngsten Datenstand des Materials.
            {vormeldungsStand && ` Stand der Vormeldung: ${zeitAnzeige(vormeldungsStand)} (Ausgangspunkt, nicht t0).`}
          </span>
        </label>
        <HilfeFeld label={TEXT_FELD.horizont.label} hilfe={TEXT_FELD.horizont.hilfe}>
          {(a) => <input {...a} type="text" value={vorschlag.horizont} onChange={(e) => setVorschlag({ ...vorschlag, horizont: e.target.value })} />}
        </HilfeFeld>
      </div>
      <HilfeFeld label={TEXT_FELD.referenzbezug.label} hilfe={TEXT_FELD.referenzbezug.hilfe(profil.manifest.referenzraum)}>
        {(a) => <input {...a} type="text" value={vorschlag.referenzbezug} onChange={(e) => setVorschlag({ ...vorschlag, referenzbezug: e.target.value })} />}
      </HilfeFeld>
      <label className="feld">
        <span className="feld-label">Besondere Prüffrage</span>
        <input type="text" value={vorschlag.prueffrage} onChange={(e) => setVorschlag({ ...vorschlag, prueffrage: e.target.value })} />
      </label>
      {vorschlag.prueffrageVorschlag && !vorschlag.prueffrage && (
        <p className="hinweis prueffrage-vorschlag">
          Vorschlag aus S1, nicht übernommen (der Auftrag nennt keine Prüffrage): „{vorschlag.prueffrageVorschlag}“{" "}
          <button type="button" className="knopf klein" onClick={() => setVorschlag({ ...vorschlag, prueffrage: vorschlag.prueffrageVorschlag || "" })}>
            Übernehmen
          </button>
        </p>
      )}

      {verdichtung && vorschlag.sachverhalte.length > 3 && (
        <div className="kasten kasten-hinweis" role="status">
          <p>
            {vorschlag.sachverhalte.length} Sachverhalte bei einer Verdichtung: Prüfe, ob mehrere Meldungen dasselbe Ereignis beschreiben und sich
            zusammenführen lassen (SOP-LEAD A.7.1).
          </p>
        </div>
      )}
      {nichtZugeordnet.length > 0 && (
        <div className="kasten kasten-hinweis" role="status">
          <p>Keinem Sachverhalt zugeordnet: {nichtZugeordnet.map((m) => m.eingang?.land || m.name).join(", ")}.</p>
        </div>
      )}
      <div className="liste">
        {vorschlag.sachverhalte.map((s, i) => (
          <div key={i} className="element">
            <div className="element-kopf">
              <h3>
                <span className="element-nr">Sachverhalt {i + 1}</span>
              </h3>
              <div className="aktionen">
                {i > 0 && (
                  <button type="button" className="knopf leise klein" onClick={() => zusammenfuehren(i)}>
                    Mit Sachverhalt {i} zusammenführen
                  </button>
                )}
                {vorschlag.sachverhalte.length > 1 && (
                  <button
                    type="button"
                    className="knopf leise klein"
                    aria-label={`Sachverhalt ${i + 1} entfernen`}
                    onClick={() => setVorschlag({ ...vorschlag, sachverhalte: vorschlag.sachverhalte.filter((_, j) => j !== i) })}
                  >
                    Entfernen
                  </button>
                )}
              </div>
            </div>
            <label className="feld">
              <span className="feld-label">Titel</span>
              <input type="text" value={s.titel} onChange={(e) => setzeSv(i, { titel: e.target.value })} />
            </label>
            {s.begruendung && <p className="hinweis">Begründung S1: {s.begruendung}</p>}
            {verdichtung && (
              <fieldset className="feld">
                <legend className="feld-label">Eingangsmeldungen</legend>
                <div className="mehrfach">
                  {eingaenge.map((m) => {
                    const an = !!s.eingangsmeldungen?.includes(m.name);
                    return (
                      <label key={m.id} className={an ? "chip an" : "chip"} title={m.name}>
                        <input
                          type="checkbox"
                          checked={an}
                          onChange={() =>
                            setzeSv(i, {
                              eingangsmeldungen: an ? (s.eingangsmeldungen || []).filter((x) => x !== m.name) : [...(s.eingangsmeldungen || []), m.name],
                            })
                          }
                        />
                        {[m.eingang?.land, m.eingang?.zeitpunkt?.slice(11, 16)].filter(Boolean).join(" ") || m.name}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <fieldset className="feld">
              <legend className="feld-label">Ereignisarten</legend>
              <div className="mehrfach">
                {arten.map((a) => (
                  <label key={a} className={s.ereignisarten.includes(a) ? "chip an" : "chip"}>
                    <input type="checkbox" checked={s.ereignisarten.includes(a)} onChange={() => artUmschalten(i, a)} />
                    {a}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="feld">
              <legend className="feld-label">SOPs und Bausteine für diesen Sachverhalt</legend>
              <p className="hinweis">
                Die gewählten Abschnitte gehen mit vollem Text an die KI; Teil A (gemeinsame Regeln) geht immer mit. Bausteine im Status „Inhaltsgerüst“
                ergänzen die Dach-SOP nur als Prüfhinweise.
              </p>
              {sopGliederung.map((g) => (
                <div key={g.titel} className="sop-gruppe">
                  <p className="sop-gruppe-titel">{g.titel}</p>
                  <div className="mehrfach">
                    {g.sops.map((x) => (
                      <label key={x.id} className={s.sops.includes(x.id) ? "chip an" : "chip"} title={x.lageart || undefined}>
                        <input
                          type="checkbox"
                          checked={s.sops.includes(x.id)}
                          onChange={() => setzeSv(i, { sops: s.sops.includes(x.id) ? s.sops.filter((y) => y !== x.id) : [...s.sops, x.id] })}
                        />
                        {sopKennung(x).replace(/^SOP-LEAD /, "")}
                        {istInhaltsgeruest(x) && <span className="sop-status">Inhaltsgerüst</span>}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {s.sops.length > 0 && (
                <details className="sop-details">
                  <summary>Anwendungsbereich der gewählten SOPs und Bausteine ({s.sops.length})</summary>
                  {sops
                    .filter((x) => s.sops.includes(x.id))
                    .map((x) => (
                      <div key={x.id} className="sop-auszug">
                        <strong>{sopKennung(x).replace(/^SOP-LEAD /, "")}</strong>
                        {x.status && <p className="hinweis">Status: {x.status}</p>}
                        <pre>{anwendungsbereich(x.text)}</pre>
                      </div>
                    ))}
                </details>
              )}
            </fieldset>
            {suchbegriffeZeigen && (
              <fieldset className="feld suchbegriffe">
                <legend className="feld-label">Orientierung und Suchbegriffe für S2</legend>
                {s.orientierung === undefined ? (
                  orientiert && orientierungAn ? (
                    <p className="hinweis">
                      Für diesen Sachverhalt lief noch keine Orientierungssuche.{" "}
                      <button
                        type="button"
                        className="knopf klein"
                        aria-label={`Orientierung suchen für Sachverhalt ${i + 1}`}
                        disabled={offline}
                        onClick={() => orientierungStarten([i])}
                      >
                        Orientierung suchen
                      </button>
                    </p>
                  ) : null
                ) : s.orientierung.length === 0 ? (
                  <p className="hinweis">Die Orientierungssuche blieb ohne Websuche. Suchbegriffe bitte selbst eintragen.</p>
                ) : (
                  <>
                    <p className="hinweis">
                      Orientierungssuche: {s.orientierung.map((o) => (o.suchbegriff ? `„${o.suchbegriff}“` : "ohne Angabe des Suchbegriffs")).join(", ")}
                      {s.orientierung.some((o) => o.treffer.length) ? "; Treffer (Rechercheeinstiege für S2, nicht geprüft):" : "; keine Treffer übermittelt."}
                    </p>
                    {s.orientierung.some((o) => o.treffer.length) && (
                      <ul className="orientierung-treffer">
                        {s.orientierung
                          .flatMap((o) => o.treffer)
                          .map((t, j) => (
                            <li key={j}>
                              <a href={t.url} target="_blank" rel="noopener noreferrer">
                                {t.titel && t.titel !== t.url ? t.titel : kurzeAdresse(t.url)}
                              </a>
                              {t.datum ? ` (${t.datum})` : ""}
                            </li>
                          ))}
                      </ul>
                    )}
                  </>
                )}
                {(s.suchbegriffe || []).map((b, j) => (
                  <div key={j} className="suchbegriff">
                    <input
                      type="text"
                      aria-label={`Suchbegriff ${j + 1} für Sachverhalt ${i + 1}`}
                      value={b.begriff}
                      onChange={(e) =>
                        setzeBegriffe(
                          i,
                          (s.suchbegriffe || []).map((x, k) => (k === j ? { ...x, begriff: e.target.value, herkunft: "person" as const } : x)),
                        )
                      }
                    />
                    <input
                      type="text"
                      aria-label={`Zweck von Suchbegriff ${j + 1} für Sachverhalt ${i + 1}`}
                      placeholder="Zweck, z. B. B02/R2"
                      value={b.zweck}
                      onChange={(e) =>
                        setzeBegriffe(
                          i,
                          (s.suchbegriffe || []).map((x, k) => (k === j ? { ...x, zweck: e.target.value, herkunft: "person" as const } : x)),
                        )
                      }
                    />
                    <input
                      type="text"
                      aria-label={`Zielquelle von Suchbegriff ${j + 1} für Sachverhalt ${i + 1}`}
                      placeholder="Zielquelle"
                      value={b.zielquelle || ""}
                      onChange={(e) =>
                        setzeBegriffe(
                          i,
                          (s.suchbegriffe || []).map((x, k) => (k === j ? { ...x, zielquelle: e.target.value, herkunft: "person" as const } : x)),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="knopf leise klein"
                      aria-label={`Suchbegriff ${j + 1} für Sachverhalt ${i + 1} entfernen`}
                      onClick={() =>
                        setzeBegriffe(
                          i,
                          (s.suchbegriffe || []).filter((_, k) => k !== j),
                        )
                      }
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
                {(s.suchbegriffe || []).length < regel.jeSachverhalt && (
                  <button
                    type="button"
                    className="knopf leise klein"
                    // sichtbarer Text am Anfang des Namens (WCAG 2.5.3, seit 0.6.5, TP-2026-W44-22)
                    aria-label={`Suchbegriff hinzufügen für Sachverhalt ${i + 1}`}
                    onClick={() => setzeBegriffe(i, [...(s.suchbegriffe || []), { begriff: "", zweck: "", herkunft: "person" }])}
                  >
                    Suchbegriff hinzufügen
                  </button>
                )}
                <p className="hinweis">
                  Bis zu {regel.jeSachverhalt} Begriff{regel.jeSachverhalt === 1 ? "" : "e"} je Sachverhalt, insgesamt höchstens {regel.max}, sind Pflichtsuchen
                  in S2 (Recherchetiefe „{regel.titel}“). S2 führt sie zuerst aus und recherchiert danach im übrigen Kontingent.
                </p>
              </fieldset>
            )}
          </div>
        ))}
      </div>
      <div className="aktionen">
        <button
          type="button"
          className="knopf leise"
          onClick={() => setVorschlag({ ...vorschlag, sachverhalte: [...vorschlag.sachverhalte, { titel: "", ereignisarten: [], sops: [], begruendung: "" }] })}
        >
          Sachverhalt hinzufügen
        </button>
      </div>
      <p className="hinweis">
        Kosten S1: {laufKostenText(lauf)}.{" "}
        {rechercheZeile(
          lauf?.auftrag.websuche !== false,
          laufEinstellungen,
          modellFuer(stufeS2.rolle, laufEinstellungen, profil),
          modellFuer("vorverarbeitung", laufEinstellungen, profil),
        )}{" "}
        {absenderZeile(absender)}
      </p>
      <LaufModellWahl stufen={modellStufen} websuche={lauf.auftrag.websuche !== false} wahl={rahmen.wahl} setWahl={rahmen.setWahl}>
        <LaufSchaetzung stufen={schaetzStufen} einstellungen={laufEinstellungen} profil={profil} />
        {umfangS2 && (
          <p className="kasten kasten-hinweis" role="status">
            {umfangS2}
          </p>
        )}
      </LaufModellWahl>
      <OfflineHinweis offline={offline} />
      <div className="schritt-nav">
        <div className="aktionen">
          <button type="button" className="knopf leise" onClick={zurueck}>
            Zurück zum Auftrag
          </button>
          <ProtokollKnopf lauf={lauf} text="Laufprotokoll exportieren (S1)" exportieren={rahmen.protokollExport} />
        </div>
        {orientierungAn && !orientiert ? (
          <button
            type="button"
            className="knopf primaer"
            onClick={() => orientierungStarten()}
            disabled={!vorschlag.sachverhalte.length || t0Ungueltig || offline}
            aria-describedby={beschreibung}
          >
            Gegenstand bestätigen und Orientierung suchen (S1)
          </button>
        ) : (
          <div className="aktionen">
            {orientierungAn && (
              <button
                type="button"
                className="knopf leise"
                onClick={() => orientierungStarten()}
                disabled={!vorschlag.sachverhalte.length || offline}
                aria-describedby={offline ? OFFLINE_HINWEIS : undefined}
              >
                Orientierung erneut suchen
              </button>
            )}
            <button
              type="button"
              className="knopf primaer"
              onClick={s2Starten}
              disabled={!vorschlag.sachverhalte.length || t0Ungueltig || offline}
              aria-describedby={beschreibung}
            >
              {istVerdichtung(material) ? "Bestätigen und verdichten (S2)" : "Bestätigen und recherchieren (S2)"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
