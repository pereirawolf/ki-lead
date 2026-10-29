// Wahl für einen einzelnen Lauf, abweichend von „Einstellungen“: KI-Profil oder Modell und Aufwand je KI-Stufe und,
// wenn der Lauf recherchiert, die Recherchetiefe. Seit 0.5.22 nach den Vorschlägen zu „Modelle für diesen Lauf“ vom
// 25.10.2026 (Punkte 1–10): Anzeigenamen, Kostenklasse und Vermerke aus den Testläufen (src/pipeline/modellkunde.ts),
// KI-Profil je Lauf, Recherchetiefe mit allen drei Werten wie unter „Recherche & Grenzen“, Schätzung je Stufe,
// Hinweis auf zusätzliche Anbieter, Kennzeichnung abweichender Felder und Zurücksetzen.

import { useId, useState, type ReactNode } from "react";
import type { Aufwand } from "../anbieter/typen";
import { ANBIETER_IDS, ANBIETER_NAME, anbieterVon, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import {
  AUFWAND_STUFEN,
  MIX_IDS,
  MIX_PROFILE,
  MODELL_GRUPPEN,
  STANDARD,
  STANDARD_PROFILE,
  WAHL_RECHERCHE,
  aufwandAngeboten,
  aufwandAuswahl,
  mitModellwahl,
  modellFuer,
  orientierungJeSachverhalt,
  wahlAbweichend,
  werkzeugeFuer,
  type Einstellungen,
  type MixId,
  type ModellProfil,
  type ModellWahl as Wahl,
  type Rolle,
} from "../pipeline/einstellungen";
import { kostenklasse, modellName, preisSatz, vermerkFuer, vermerkKurz } from "../pipeline/modellkunde";
import {
  feldWirkt,
  hoechstkostenText,
  RECHERCHE_STUFEN,
  stufenWerteText,
  stufeVon,
  wirkungText,
  type RechercheWerte,
  type StufeId,
} from "../pipeline/recherchetiefe";
import { dauerText, kostenText, schaetzeStufe, summe, type SchaetzArt } from "../pipeline/schaetzung";
import type { Profil } from "../kern/typen";
import { GrenzFeld, RECHERCHE_FELDER } from "./GrenzFeld";

export interface StufeModell {
  rolle: Rolle;
  /** Kurzname in der Zusammenfassung, z. B. „S1“ */
  kurz: string;
  titel: string;
  /** Art der Schätzung; ohne Angabe keine Schätzung je Stufe */
  art?: SchaetzArt;
  /** Stufe, die nur ausnahmsweise läuft (S3 Reparatur): unter „Weitere Stufe“ und in der Kopfzeile nur, wenn abweichend */
  nebenbei?: boolean;
}

interface Props {
  stufen: StufeModell[];
  /** Einstellungen ohne die Wahl dieses Laufs (für die Anzeige der Vorgaben) */
  einstellungen: Einstellungen;
  profil: Profil;
  schluessel: Schluessel;
  wahl: Wahl;
  onChange: (w: Wahl) => void;
  deaktiviert?: boolean;
  /** Ob der Lauf recherchiert; mit Angabe zeigt der Block die Recherchetiefe bzw. „ohne Recherche“ */
  websuche?: boolean;
  /** Element vor der aufklappbaren Wahl, im selben Rahmen (Schalter „Recherche durchführen“) */
  kopf?: ReactNode;
  /** Elemente nach der aufklappbaren Wahl, im selben Rahmen (Recherchezeile, Schätzung) */
  children?: ReactNode;
  /** Zu „Einstellungen → Modelle & Aufwand“, um die Vorgaben dauerhaft zu ändern */
  zuEinstellungen?: () => void;
}

type ProfilWahl = "einstellungen" | AnbieterId | MixId | "einzeln";
type TiefeWahl = "einstellungen" | StufeId | "eigen";

const PROFILE: (AnbieterId | MixId)[] = [...ANBIETER_IDS, ...MIX_IDS];
const istMix = (p: AnbieterId | MixId): p is MixId => (MIX_IDS as string[]).includes(p);
const profilDaten = (p: AnbieterId | MixId): ModellProfil => (istMix(p) ? MIX_PROFILE[p] : STANDARD_PROFILE[p]);
const profilTitel = (p: AnbieterId | MixId) => (istMix(p) ? MIX_PROFILE[p].titel : `KI-Profil ${ANBIETER_NAME[p]}`);

const aufwandTitel = (a: Aufwand) => AUFWAND_STUFEN.find((x) => x.id === a)?.titel || a;
const rechercheWerte = (e: RechercheWerte): RechercheWerte => ({ websucheMax: e.websucheMax, abrufMax: e.abrufMax, abrufMaxTokens: e.abrufMaxTokens });

export function ModellWahl({ stufen, einstellungen, profil, schluessel, wahl, onChange, deaktiviert, websuche, kopf, children, zuEinstellungen }: Props) {
  const id = useId();
  const [profilKlick, setProfilKlick] = useState<ProfilWahl | null>(null);
  const [eigenGewaehlt, setEigenGewaehlt] = useState(false);
  const [angepasst, setAngepasst] = useState<Partial<Record<Rolle, string>>>({});

  const rollen = stufen.map((s) => s.rolle);
  const endpunkt = { mistralEndpunkt: einstellungen.mistralEndpunkt ?? "eu" } as const;
  const abweichend = wahlAbweichend(wahl, rollen, !!websuche);
  const rollenAbweichend = wahlAbweichend(wahl, rollen, false);
  const stufeAbweichend = (r: Rolle) => !!wahl[r] || !!wahl.aufwand?.[r];

  const standardModell = (r: Rolle) => modellFuer(r, einstellungen, profil);
  const modellVon = (r: Rolle) => wahl[r] || standardModell(r);
  // Wirksame Stufe: nur Stufen, die das Modell anbietet (AV-2026-W43-01, -02)
  const aufwandVon = (r: Rolle) => aufwandAngeboten(modellVon(r), wahl.aufwand?.[r] || einstellungen.aufwand[r]);
  const ohneSchluessel = (m: string) => !schluessel[anbieterVon(m)];

  // ── Änderungen ──
  // Mit `angleichen` (KI-Profil) entfallen Angaben, die ohnehin den Einstellungen entsprechen; eine Wahl im Feld bleibt stehen.
  const mitRolle = (w: Wahl, r: Rolle, modell: string, aufwand: Aufwand | undefined, angleichen = false): Wahl => {
    const neu: Wahl = { ...w, aufwand: { ...(w.aufwand || {}) } };
    const m = modell || standardModell(r);
    if (modell && !(angleichen && modell === standardModell(r))) neu[r] = modell;
    else delete neu[r];
    if (aufwand && !(angleichen && aufwandAngeboten(m, aufwand) === aufwandAngeboten(m, einstellungen.aufwand[r]))) neu.aufwand![r] = aufwand;
    else delete neu.aufwand![r];
    return neu;
  };
  const setzeModell = (r: Rolle, m: string) => {
    const modell = m || standardModell(r);
    const wunsch = wahl.aufwand?.[r] || einstellungen.aufwand[r];
    const wirksam = aufwandAngeboten(modell, wunsch);
    // Beim Modellwechsel eine Stufe, die das neue Modell nicht anbietet, sichtbar anpassen und sagen, warum
    setAngepasst((x) => ({
      ...x,
      [r]: wirksam !== wunsch ? `Aufwand auf „${aufwandTitel(wirksam)}“ gesetzt: ${modellName(modell)} bietet „${aufwandTitel(wunsch)}“ nicht an.` : "",
    }));
    onChange(mitRolle(wahl, r, m, wahl.aufwand?.[r] ? wirksam : undefined));
  };
  const setzeAufwand = (r: Rolle, a: string) => {
    setAngepasst((x) => ({ ...x, [r]: "" }));
    onChange(mitRolle(wahl, r, wahl[r] || "", (a || undefined) as Aufwand | undefined));
  };
  const profilAnwenden = (p: ProfilWahl) => {
    setProfilKlick(p);
    setAngepasst({});
    if (p === "einzeln") return;
    let neu: Wahl = { ...wahl };
    for (const r of rollen) {
      if (p === "einstellungen") neu = mitRolle(neu, r, "", undefined);
      else neu = mitRolle(neu, r, profilDaten(p).modelle[r], profilDaten(p).aufwand[r], true);
    }
    onChange(neu);
  };
  const profilAktiv = (p: AnbieterId | MixId) =>
    rollen.every((r) => modellVon(r) === profilDaten(p).modelle[r] && aufwandVon(r) === aufwandAngeboten(profilDaten(p).modelle[r], profilDaten(p).aufwand[r]));
  const profilAbgeleitet: ProfilWahl = !rollenAbweichend ? "einstellungen" : (PROFILE.find(profilAktiv) ?? "einzeln");
  // Ein angeklicktes Profil bleibt gewählt, solange die Wahl ihm entspricht (auch wenn es den Einstellungen gleicht)
  const klickGilt = (k: ProfilWahl | null): k is ProfilWahl => k === "einzeln" || (k === "einstellungen" ? !rollenAbweichend : !!k && profilAktiv(k));
  const profilGewaehlt: ProfilWahl = klickGilt(profilKlick) ? profilKlick : profilAbgeleitet;
  const mitProfil = stufen.length > 1;
  const einzeln = !mitProfil || profilGewaehlt === "einzeln";

  // ── Recherche ──
  const laufE = mitModellwahl(einstellungen, wahl);
  const s2 = stufen.find((s) => s.rolle === "erfassung" || s.rolle === "verdichtung");
  const modellS2 = s2 ? modellVon(s2.rolle) : undefined;
  const werkzeuge = modellS2 ? werkzeugeFuer(modellS2, einstellungen) : { websuche: false, abruf: false };
  const rechercheZeigen = !!websuche && !!modellS2;
  const vorgabeWerte = rechercheWerte(einstellungen);
  const laufWerte = rechercheWerte(laufE);
  const vorgabeStufe = stufeVon(vorgabeWerte);
  const rechercheAbweichend = WAHL_RECHERCHE.some((f) => wahl[f] !== undefined);
  const tiefeAbgeleitet: TiefeWahl = !rechercheAbweichend || stufeVon(laufWerte) === vorgabeStufe ? "einstellungen" : stufeVon(laufWerte);
  const tiefe: TiefeWahl = eigenGewaehlt ? "eigen" : tiefeAbgeleitet;
  const setzeRecherche = (teil: Partial<RechercheWerte>) => {
    const neu: Wahl = { ...wahl };
    for (const [f, v] of Object.entries(teil) as [keyof RechercheWerte, number][]) {
      if (v === einstellungen[f]) delete neu[f];
      else neu[f] = v;
    }
    onChange(neu);
  };
  const s2Anbieter = modellS2 ? [anbieterVon(modellS2)] : [];

  // ── Anzeige ──
  const zusammenfassung = (() => {
    const teile = stufen
      .filter((s) => !s.nebenbei || stufeAbweichend(s.rolle))
      .map((s) => `${s.kurz} ${modellName(modellVon(s.rolle))} (${aufwandTitel(aufwandVon(s.rolle))})`);
    if (websuche === false) teile.push("ohne Recherche");
    else if (rechercheZeigen && !werkzeuge.websuche && !werkzeuge.abruf) teile.push("ohne Websuche");
    else if (rechercheZeigen) {
      const name =
        tiefe === "einstellungen" && vorgabeStufe === "eigen" ? "eigene Werte" : tiefe === "einstellungen" ? null : tiefe === "eigen" ? "eigene Werte" : null;
      const stufe = stufeVon(laufWerte);
      const titel = name ?? (stufe === "eigen" ? "eigene Werte" : RECHERCHE_STUFEN.find((x) => x.id === stufe)!.titel);
      teile.push(`Recherche ${titel}${werkzeuge.websuche ? ` (bis ${laufE.websucheMax} Websuchen)` : ""}`);
      // Orientierungssuchen in S1 getrennt ausgewiesen, nicht auf das Kontingent von S2 angerechnet (KP-2026-W44-09)
      const orientierung = orientierungJeSachverhalt(laufE);
      if (orientierung && werkzeugeFuer(modellFuer("vorverarbeitung", laufE, profil), laufE).websuche)
        teile.push(`Orientierung ${orientierung} Suche${orientierung === 1 ? "" : "n"} je Sachverhalt`);
    }
    const geschaetzt = stufen.filter((s) => s.art && !s.nebenbei).map((s) => schaetzeStufe(s.art!, modellVon(s.rolle), aufwandVon(s.rolle), endpunkt));
    if (geschaetzt.length) {
      const sek = summe(geschaetzt.map((g) => g.sekunden));
      const usd = summe(geschaetzt.map((g) => g.usd));
      if (sek || usd) teile.push(`≈ ${[sek && dauerText(sek), usd && kostenText(usd)].filter(Boolean).join(", ")}`);
    }
    return teile.join(" · ");
  })();
  const titel = stufen.length === 1 ? "Modell für diesen Lauf" : websuche !== undefined ? "Modelle und Recherche für diesen Lauf" : "Modelle für diesen Lauf";

  // Anbieter, an die dieser Lauf Inhalte schickt, die nach den Einstellungen keine bekämen (Punkt 5)
  const vorgabeAnbieter = new Set(rollen.map((r) => anbieterVon(standardModell(r))));
  const neueAnbieter = ANBIETER_IDS.filter((a) => !vorgabeAnbieter.has(a) && rollen.some((r) => anbieterVon(modellVon(r)) === a));

  const optionText = (m: string, r: Rolle) => {
    const kk = kostenklasse(m);
    const v = vermerkFuer(r, m);
    return (
      [modellName(m), kk && `Kosten ${kk}`, v && vermerkKurz(v, aufwandTitel)].filter(Boolean).join(" · ") +
      (ohneSchluessel(m) ? ` – kein Schlüssel für ${ANBIETER_NAME[anbieterVon(m)]}` : "")
    );
  };

  const stufeFelder = (s: StufeModell) => {
    const r = s.rolle;
    const m = modellVon(r);
    const v = vermerkFuer(r, m);
    const sch = s.art ? schaetzeStufe(s.art, m, aufwandVon(r), endpunkt) : null;
    const standard = standardModell(r);
    return (
      <fieldset key={r} className={stufeAbweichend(r) ? "modellwahl-stufe abweichend" : "modellwahl-stufe"}>
        <legend>
          {s.titel}
          {stufeAbweichend(r) && <span className="modellwahl-abweichend">abweichend</span>}
        </legend>
        <label className="feld" htmlFor={`${id}-${r}`}>
          <span className="feld-label">Modell</span>
          <select
            id={`${id}-${r}`}
            value={wahl[r] || ""}
            disabled={deaktiviert}
            aria-describedby={`${id}-${r}-info`}
            onChange={(e) => setzeModell(r, e.target.value)}
          >
            <option value="">
              Wie in den Einstellungen: {modellName(standard)}
              {ohneSchluessel(standard) ? ` – kein Schlüssel für ${ANBIETER_NAME[anbieterVon(standard)]}` : ""}
            </option>
            {MODELL_GRUPPEN.map((g) => (
              <optgroup key={g.anbieter} label={g.anbieter}>
                {g.modelle.map((x) => (
                  <option key={x} value={x} disabled={ohneSchluessel(x)}>
                    {optionText(x, r)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <p className="hinweis" id={`${id}-${r}-info`}>
          {ANBIETER_NAME[anbieterVon(m)]}, Kennung {m}. {preisSatz(m)}
          {v ? ` Aus den Testläufen: ${v.befund} Gemessen mit „${aufwandTitel(v.aufwand)}“.` : ""}
          {r === "erfassung" ? " Für S2 Recherche und Entwurf liegen noch keine Vergleichsläufe vor." : ""}
        </p>
        <label className="feld" htmlFor={`${id}-${r}-aufwand`}>
          <span className="feld-label">Aufwand</span>
          <select
            id={`${id}-${r}-aufwand`}
            value={wahl.aufwand?.[r] || ""}
            disabled={deaktiviert}
            aria-describedby={[`${id}-${r}-aufwand-hilfe`, angepasst[r] && `${id}-${r}-angepasst`, sch && `${id}-${r}-schaetzung`].filter(Boolean).join(" ")}
            onChange={(e) => setzeAufwand(r, e.target.value)}
          >
            <option value="">Wie in den Einstellungen: {aufwandTitel(aufwandAngeboten(m, einstellungen.aufwand[r]))}</option>
            {aufwandAuswahl(m).map((a) => (
              <option key={a.id} value={a.id}>
                {a.titel}
              </option>
            ))}
          </select>
        </label>
        <p className="hinweis" id={`${id}-${r}-aufwand-hilfe`}>
          Wie lange das Modell vor der Antwort nachdenkt. Höher ist meist sorgfältiger, dauert aber länger und kostet mehr.
        </p>
        {angepasst[r] && (
          <p className="kasten kasten-hinweis feld-zusatz" id={`${id}-${r}-angepasst`} role="status">
            {angepasst[r]}
          </p>
        )}
        {sch && (
          <p className="hinweis modellwahl-schaetzung" id={`${id}-${r}-schaetzung`}>
            Voraussichtlich {sch.sekunden ? `${dauerText(sch.sekunden)}, ` : ""}
            {kostenText(sch.usd)}
            {sch.gemessen ? "" : " (grob, ohne Messwert)"}.
          </p>
        )}
      </fieldset>
    );
  };

  const zuruecksetzen = () => {
    const neu: Wahl = { ...wahl, aufwand: { ...(wahl.aufwand || {}) } };
    for (const r of rollen) {
      delete neu[r];
      delete neu.aufwand![r];
    }
    if (websuche) for (const f of WAHL_RECHERCHE) delete neu[f];
    setProfilKlick(null);
    setEigenGewaehlt(false);
    setAngepasst({});
    onChange(neu);
  };

  const profilOption = (p: ProfilWahl) => {
    const daten = p === "einstellungen" || p === "einzeln" ? null : profilDaten(p);
    const fehlend = daten ? [...new Set(rollen.map((r) => anbieterVon(daten.modelle[r])))].filter((a) => !schluessel[a]) : [];
    const text =
      p === "einstellungen"
        ? "Modell und Aufwand je Stufe wie unter „Einstellungen“."
        : p === "einzeln"
          ? "Modell und Aufwand je Stufe selbst wählen."
          : stufen
              .map(
                (s) => `${s.kurz} ${modellName(daten!.modelle[s.rolle])} (${aufwandTitel(aufwandAngeboten(daten!.modelle[s.rolle], daten!.aufwand[s.rolle]))})`,
              )
              .join(" · ");
    return (
      <label key={p} className={fehlend.length ? "ablage-option gesperrt" : "ablage-option"}>
        <input
          type="radio"
          name={`${id}-profil`}
          value={p}
          checked={profilGewaehlt === p}
          disabled={deaktiviert || fehlend.length > 0}
          onChange={() => profilAnwenden(p)}
        />
        <span>
          <strong>{p === "einstellungen" ? "Wie in den Einstellungen" : p === "einzeln" ? "Einzeln anpassen" : profilTitel(p)}</strong>
          <br />
          <span className="ablage-text">
            {text}
            {fehlend.length ? ` Braucht einen Schlüssel für ${fehlend.map((a) => ANBIETER_NAME[a]).join(" und ")}.` : ""}
          </span>
        </span>
      </label>
    );
  };

  return (
    <div className="modellwahl">
      {kopf}
      <details className="modellwahl-details" open={abweichend || undefined}>
        <summary>
          <span className="modellwahl-titel">{titel}</span>
          {abweichend && <span className="modellwahl-abweichend">abweichend</span>}
          <span className="material-meta modellwahl-kurz"> {zusammenfassung}</span>
        </summary>

        {mitProfil && (
          <fieldset className="ablage-wahl modellwahl-profil">
            <legend>KI-Profil für diesen Lauf</legend>
            {(["einstellungen", ...PROFILE, "einzeln"] as ProfilWahl[]).map(profilOption)}
          </fieldset>
        )}

        {einzeln && <div className="modellwahl-felder">{stufen.filter((s) => !s.nebenbei).map(stufeFelder)}</div>}
        {einzeln &&
          stufen
            .filter((s) => s.nebenbei)
            .map((s) => (
              <details key={s.rolle} className="modellwahl-weitere" open={stufeAbweichend(s.rolle) || undefined}>
                <summary>
                  Weitere Stufe: {s.titel} · {modellName(modellVon(s.rolle))} ({aufwandTitel(aufwandVon(s.rolle))})
                </summary>
                <div className="modellwahl-felder">{stufeFelder(s)}</div>
              </details>
            ))}

        {neueAnbieter.length > 0 && (
          <div className="kasten kasten-hinweis" role="status">
            <p>
              In diesem Lauf gehen Inhalte zusätzlich an {neueAnbieter.map((a) => ANBIETER_NAME[a]).join(" und ")}. Die Bestätigung unten nennt alle Anbieter.
            </p>
          </div>
        )}

        {rechercheZeigen &&
          (!werkzeuge.websuche && !werkzeuge.abruf ? (
            <p className="hinweis">
              Mit {modellName(modellS2)} über den EU-Endpunkt von Mistral recherchiert S2 nicht im Web und arbeitet nur mit dem Material. Für eine Recherche ein
              anderes Modell für S2 wählen.
            </p>
          ) : (
            <fieldset
              className={
                rechercheAbweichend ? "ablage-wahl recherchetiefe-wahl modellwahl-recherche abweichend" : "ablage-wahl recherchetiefe-wahl modellwahl-recherche"
              }
            >
              <legend>
                Recherchetiefe für diesen Lauf
                {rechercheAbweichend && <span className="modellwahl-abweichend">abweichend</span>}
              </legend>
              <label className="ablage-option">
                <input
                  type="radio"
                  name={`${id}-tiefe`}
                  value="einstellungen"
                  checked={tiefe === "einstellungen"}
                  disabled={deaktiviert}
                  onChange={() => {
                    setEigenGewaehlt(false);
                    setzeRecherche(vorgabeWerte);
                  }}
                />
                <span>
                  <strong>Wie in den Einstellungen</strong>
                  <br />
                  <span className="ablage-text">
                    {vorgabeStufe === "eigen" ? "Eigene Werte" : RECHERCHE_STUFEN.find((x) => x.id === vorgabeStufe)!.titel} ({stufenWerteText(vorgabeWerte)})
                  </span>
                </span>
              </label>
              {RECHERCHE_STUFEN.filter((st) => st.id !== vorgabeStufe).map((st) => (
                <label key={st.id} className="ablage-option">
                  <input
                    type="radio"
                    name={`${id}-tiefe`}
                    value={st.id}
                    checked={tiefe === st.id}
                    disabled={deaktiviert}
                    onChange={() => {
                      setEigenGewaehlt(false);
                      setzeRecherche(st.werte);
                    }}
                  />
                  <span>
                    <strong>{st.titel}</strong>
                    <br />
                    <span className="ablage-text">
                      {st.text} ({stufenWerteText(st.werte)})
                    </span>
                  </span>
                </label>
              ))}
              <label className="ablage-option">
                <input
                  type="radio"
                  name={`${id}-tiefe`}
                  value="eigen"
                  checked={tiefe === "eigen"}
                  disabled={deaktiviert}
                  onChange={() => setEigenGewaehlt(true)}
                />
                <span>
                  <strong>Eigene Werte</strong>
                  <br />
                  <span className="ablage-text">Zahlen für diesen Lauf selbst festlegen.</span>
                </span>
              </label>
              {tiefe === "eigen" && (
                <div className="gruppe-spalten-zwei">
                  {RECHERCHE_FELDER.map((f) => (
                    <GrenzFeld
                      key={f.feld}
                      {...f}
                      wert={laufWerte[f.feld]}
                      setze={(n) => setzeRecherche({ [f.feld]: n })}
                      kuerzenZurueck={einstellungen.abrufMaxTokens || STANDARD.abrufMaxTokens}
                      vermerk={wirkungText(f.feld, s2Anbieter, einstellungen.mistralEndpunkt)}
                      deaktiviert={deaktiviert || !feldWirkt(f.feld, s2Anbieter, einstellungen.mistralEndpunkt)}
                    />
                  ))}
                </div>
              )}
              {(() => {
                const kosten = hoechstkostenText(modellS2, laufE);
                return kosten ? <p className="hinweis recherche-kosten">{kosten}</p> : null;
              })()}
            </fieldset>
          ))}

        <p className="hinweis">
          Gilt nur für diesen Lauf; die Vorgaben unter „Einstellungen“ bleiben unverändert. Das Laufprotokoll hält Modell und Aufwand je Stufe und die
          Recherchegrenzen fest.
        </p>
        {(abweichend || zuEinstellungen) && (
          <div className="aktionen modellwahl-fuss">
            {abweichend && (
              <button type="button" className="knopf leise klein" disabled={deaktiviert} onClick={zuruecksetzen}>
                Alles wie in den Einstellungen
              </button>
            )}
            {zuEinstellungen && (
              <button type="button" className="knopf leise klein" onClick={zuEinstellungen}>
                Vorgaben dauerhaft ändern
              </button>
            )}
          </div>
        )}
      </details>
      {children}
    </div>
  );
}
