// Abschnitt „Fallreihe“ unter „Einstellungen → Testläufe“ (seit 0.7.2, TP-2026-W44-62 bis -66): mitgelieferte Fälle
// und Fälle aus einem Fallpaket, Auswahl aus einem Bewertungsplan oder als Matrix Fälle × Anbieter, Start mit einem
// Klick, Kostenbremse, Ergebnis als ZIP-Datei im Archiv der Testläufe.

import { useEffect, useMemo, useRef, useState } from "react";
import { formatUsd } from "../anbieter/preise";
import { ANBIETER_NAME, anbieterVon, freigegeben, hatSchluessel, Verteiler, type AnbieterId, type Schluessel } from "../anbieter/verteiler";
import type { LlmAnbieter } from "../anbieter/typen";
import type { Profil } from "../kern/typen";
import { modellFuer, type Einstellungen } from "../pipeline/einstellungen";
import { RECHERCHE_STUFEN, type StufeId } from "../pipeline/recherchetiefe";
import { kostenText, summe } from "../pipeline/schaetzung";
import {
  faelleAusTexten,
  fallpaketLesen,
  GRUPPEN,
  katalogEintrag,
  paketEintraege,
  type Fall,
  type Fallpaket,
  type KatalogFall,
} from "../forschung/fallkatalog";
import {
  einstellungenFuerLauf,
  matrixVarianten,
  planAbgleichen,
  planLesen,
  REIHEN_ANBIETER,
  s2Rolle,
  WIEDERHOLUNGEN_MAX,
  wiederholungenBegrenzt,
  type GeladenerPlan,
  type ReihenAnbieter,
  type ReihenVariante,
} from "../forschung/fallplan";
import { fallreihe, laufplan, laufSchaetzung, type FallLaufErgebnis, type FallreiheDatei } from "../forschung/fallreihe";
import { fallreiheDateiname, fallreiheZip } from "../forschung/fallreihe-export";
import { fallpaketeLaden, fallpaketLoeschen, fallpaketSpeichern } from "../speicher/fallpakete";
import { dateiAnbieten } from "../speicher/speicher";
import { testlaufArchivieren, testlaufId } from "../speicher/testlaufarchiv";
import { bestaetigen } from "./bestaetigung";
import { useWachhalten } from "./wachhalten";

/** Mitgelieferte Fälle, ihr Material und die Profile (für Tests austauschbar) */
export interface KatalogDaten {
  faelle: Fall[];
  material: Record<string, string>;
  profile: Record<string, { name: string }>;
  profilLaden: (id: string) => Promise<Profil>;
}

export async function katalogDatenEingebaut(): Promise<KatalogDaten> {
  const d = await import("../forschung/fallkatalog-daten");
  return {
    faelle: faelleAusTexten(d.mitgelieferteFalltexte()),
    material: d.mitgeliefertesMaterial(),
    profile: d.profilVerzeichnis(),
    profilLaden: d.eingebautesProfil,
  };
}

export interface FallreiheProps {
  einstellungen: Einstellungen;
  schluessel: Schluessel;
  zeige?: (bereich: "anbieter" | "modelle") => void;
  archiviert?: () => void;
  /** für Tests */
  katalogLaden?: () => Promise<KatalogDaten>;
  anbieterFuer?: (schluessel: Schluessel, e: Einstellungen) => LlmAnbieter;
}

type Zustand =
  | { art: "bereit" }
  | { art: "laeuft"; stand?: string }
  | { art: "fertig"; reihe: FallreiheDatei; ergebnisse: FallLaufErgebnis[]; zip: Uint8Array; name: string; archivFehler?: string }
  | { art: "fehler"; text: string };

const zipBlob = (zip: Uint8Array) => new Blob([zip as BlobPart], { type: "application/zip" });
const ART_TITEL: Record<string, string> = { erfassung: "Erfassung", verdichtung: "Verdichtung", kurzfassung: "Management Summary", reparatur: "Reparatur" };
const ANBIETER_TITEL: Record<ReihenAnbieter, string> = { anthropic: "Anthropic", openai: "OpenAI", mistral: "Mistral" };

function varianteText(v: ReihenVariante): string {
  const teile = [
    v.ki_profil ? `Standardprofil ${ANBIETER_TITEL[v.ki_profil]}` : "",
    v.s1 ? `S1 ${v.s1.modell} (${v.s1.aufwand})` : "",
    v.s2 ? `S2 ${v.s2.modell} (${v.s2.aufwand})` : "",
    v.mistral_endpunkt ? `Mistral ${v.mistral_endpunkt === "eu" ? "EU" : "global"}` : "",
  ].filter(Boolean);
  return `${v.kennung}: ${teile.join(", ")}`;
}

export function FallreiheAbschnitt({
  einstellungen,
  schluessel,
  zeige,
  archiviert,
  katalogLaden = katalogDatenEingebaut,
  anbieterFuer = (s, e) => Verteiler.fuer(s, e.anbieterOptionen),
}: FallreiheProps) {
  const [daten, setDaten] = useState<KatalogDaten | null>(null);
  const [ladefehler, setLadefehler] = useState<string | null>(null);
  const [pakete, setPakete] = useState<Fallpaket[]>([]);
  const [paketMeldung, setPaketMeldung] = useState<{ text: string; fehler?: boolean } | null>(null);
  const [plan, setPlan] = useState<GeladenerPlan | null>(null);
  const [planFehler, setPlanFehler] = useState<string | null>(null);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [anbieter, setAnbieter] = useState<Set<ReihenAnbieter>>(new Set());
  const [endpunkt, setEndpunkt] = useState<"eu" | "global">(einstellungen.anbieterOptionen.mistral.endpunkt === "global" ? "global" : "eu");
  const [planVarianten, setPlanVarianten] = useState<Set<string>>(new Set());
  const [wiederholungen, setWiederholungen] = useState(1);
  const [recherche, setRecherche] = useState<StufeId | "">("");
  const [deckel, setDeckel] = useState("");
  const [zustand, setZustand] = useState<Zustand>({ art: "bereit" });
  const abbruch = useRef<AbortController | null>(null);
  const laeuft = zustand.art === "laeuft";
  useWachhalten(laeuft);

  useEffect(() => {
    let aktiv = true;
    katalogLaden()
      .then((d) => aktiv && setDaten(d))
      .catch((err) => aktiv && setLadefehler(String((err as Error)?.message || err)));
    return () => {
      aktiv = false;
    };
    // Nur beim ersten Anzeigen laden; ein neuer Lader (Tests) ändert nichts mehr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gespeicherte Fallpakete einlesen, sobald die mitgelieferten Fälle bekannt sind
  useEffect(() => {
    if (!daten) return;
    let aktiv = true;
    const ids = new Set(daten.faelle.map((f) => f.id));
    fallpaketeLaden()
      .then((liste) => Promise.all(liste.map((p) => fallpaketLesen(p.zip, p.name, ids, new Date(p.importiert)))))
      .then((ps) => aktiv && setPakete(ps))
      .catch(() => undefined); // ohne IndexedDB (Tests, private Fenster): keine gespeicherten Pakete
    return () => {
      aktiv = false;
    };
  }, [daten]);

  const katalog: KatalogFall[] = useMemo(() => {
    if (!daten) return [];
    const mit = daten.faelle.map((f) =>
      katalogEintrag(
        f,
        "mitgeliefert",
        (p) => daten.material[p],
        (id) => !!daten.profile[id],
      ),
    );
    return [...pakete.flatMap((p) => paketEintraege(p, (id) => !!daten.profile[id])), ...mit];
  }, [daten, pakete]);
  const nachId = useMemo(() => new Map(katalog.map((k) => [k.fall.id, k])), [katalog]);
  const abgleich = plan ? planAbgleichen(plan, katalog) : null;

  const varianten: ReihenVariante[] = plan
    ? (abgleich?.auswahl.varianten ?? []).filter((v) => planVarianten.has(v.kennung))
    : matrixVarianten([...anbieter], endpunkt);
  // Reihenfolge der Fälle: wie im Plan, sonst wie in der Liste
  const reihenfolge = plan
    ? [...(abgleich?.auswahl.faelle ?? []), ...katalog.map((k) => k.fall.id).filter((id) => !plan.plan.faelle.includes(id))]
    : katalog.map((k) => k.fall.id);
  const faelle = reihenfolge
    .filter((id) => auswahl.has(id))
    .map((id) => nachId.get(id)!)
    .filter((k) => k?.zulaessig);
  const n = wiederholungenBegrenzt(wiederholungen);
  const budget = deckel.trim() === "" ? undefined : Math.max(0, Number(deckel.replace(",", ".")) || 0);
  const geplant = laufplan(faelle, varianten, n);

  // Schlüssel und Freigabe je genutztem Anbieter (S1 und S2; die Reparatur läuft nur bei Schemafehlern)
  const genutzt = new Set<AnbieterId>();
  for (const v of varianten)
    for (const k of faelle) {
      const e = einstellungenFuerLauf(einstellungen, v, k.websuche && recherche ? recherche : undefined);
      genutzt.add(anbieterVon(modellFuer("vorverarbeitung", e, null)));
      genutzt.add(anbieterVon(modellFuer(s2Rolle(k.art), e, null)));
    }
  const fehlend = [...genutzt].filter((a) => !hatSchluessel(a, schluessel));
  const gesperrt = [...genutzt].filter((a) => !freigegeben(a));
  const schaetzung = summe(
    geplant.map((g) => laufSchaetzung(g.fall, einstellungenFuerLauf(einstellungen, g.variante, g.fall.websuche && recherche ? recherche : undefined), null)),
  );
  const mitWebsuche = faelle.some((k) => k.websuche);

  const planAbweichend =
    !!plan &&
    !!abgleich &&
    (abgleich.auswahl.faelle.length !== faelle.length ||
      abgleich.auswahl.faelle.some((id) => !auswahl.has(id)) ||
      abgleich.auswahl.varianten.length !== varianten.length ||
      abgleich.auswahl.wiederholungen !== n ||
      (abgleich.auswahl.recherche ?? "") !== recherche ||
      abgleich.auswahl.budgetUsd !== budget);

  const sperren = [
    ...(abgleich?.sperren ?? []),
    ...(!faelle.length ? ["Kein Fall gewählt."] : []),
    ...(!varianten.length ? [plan ? "Keine Variante gewählt." : "Kein Anbieter gewählt."] : []),
    ...gesperrt.map((a) => `${ANBIETER_NAME[a]} ist in diesem Build nicht freigegeben.`),
  ];

  function planUebernehmen(g: GeladenerPlan) {
    const a = planAbgleichen(g, katalog);
    setPlan(g);
    setPlanFehler(null);
    setAuswahl(new Set(a.auswahl.faelle.filter((id) => nachId.get(id)?.zulaessig)));
    setPlanVarianten(new Set(a.auswahl.varianten.map((v) => v.kennung)));
    setWiederholungen(a.auswahl.wiederholungen);
    setRecherche(a.auswahl.recherche ?? "");
    setDeckel(a.auswahl.budgetUsd !== undefined ? String(a.auswahl.budgetUsd) : "");
  }

  async function planDatei(datei: File | undefined) {
    if (!datei) return;
    try {
      planUebernehmen(await planLesen(await datei.text(), datei.name));
    } catch (err) {
      setPlanFehler(String((err as Error)?.message || err));
    }
  }

  async function paketDatei(datei: File | undefined) {
    if (!datei || !daten) return;
    try {
      const bytes = new Uint8Array(await datei.arrayBuffer());
      const p = await fallpaketLesen(bytes, datei.name, new Set(daten.faelle.map((f) => f.id)));
      if (!p.faelle.length) {
        setPaketMeldung({ text: `${datei.name}: ${p.befunde.join(" ")}`, fehler: true });
        return;
      }
      setPakete((alt) => [p, ...alt.filter((x) => x.sha256 !== p.sha256 && !x.faelle.some((f) => p.faelle.some((g) => g.id === f.id)))]);
      let gespeichert = true;
      try {
        await fallpaketSpeichern({ name: p.name, sha256: p.sha256, importiert: p.importiert, zip: bytes });
      } catch {
        gespeichert = false;
      }
      setPaketMeldung({
        text: `${p.name} importiert: ${p.faelle.length} ${p.faelle.length === 1 ? "Fall" : "Fälle"}${gespeichert ? ", auf diesem Gerät gespeichert bis zur Löschung" : ", nur für diese Sitzung (Gerätespeicher nicht verfügbar)"}.`,
      });
    } catch (err) {
      setPaketMeldung({ text: String((err as Error)?.message || err), fehler: true });
    }
  }

  async function paketEntfernen(p: Fallpaket) {
    if (!(await bestaetigen(`Fallpaket ${p.name} von diesem Gerät löschen?`))) return;
    try {
      await fallpaketLoeschen(p.sha256);
    } catch {
      // nicht gespeichert: nur aus der Sitzung entfernen
    }
    setPakete((alt) => alt.filter((x) => x.sha256 !== p.sha256));
    setAuswahl((alt) => new Set([...alt].filter((id) => !p.faelle.some((f) => f.id === id))));
    setPaketMeldung({ text: `${p.name} gelöscht.` });
  }

  function umschalten<T>(menge: Set<T>, wert: T, setzen: (m: Set<T>) => void) {
    const m = new Set(menge);
    if (m.has(wert)) m.delete(wert);
    else m.add(wert);
    setzen(m);
  }

  async function starten() {
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    setZustand({ art: "laeuft" });
    try {
      const genutztePakete = pakete.filter((p) => faelle.some((k) => k.paket === p.sha256)).map((p) => ({ name: p.name, sha256: p.sha256 }));
      const { reihe, ergebnisse } = await fallreihe({
        geplant,
        einstellungen,
        profilFuer: daten!.profilLaden,
        anbieterFuer: (e) => anbieterFuer(schluessel, e),
        ...(recherche ? { recherche } : {}),
        ...(budget !== undefined ? { budgetUsd: budget } : {}),
        ...(plan ? { plan: { id: plan.plan.id, name: plan.name, sha256: plan.sha256, ...(planAbweichend ? { abweichend: true } : {}) } } : {}),
        fallpakete: genutztePakete,
        signal: ctrl.signal,
        stand: (s) =>
          setZustand({
            art: "laeuft",
            stand: `Lauf ${s.nr} von ${s.anzahl} · ${s.fall} · ${s.variante} · ${s.stufe}${s.zeichen ? ` · ${s.zeichen.toLocaleString("de-DE")} Zeichen` : ""} · bisher ${formatUsd(s.kostenUsd)}`,
          }),
      });
      const zip = await fallreiheZip(reihe, ergebnisse, katalog);
      const name = fallreiheDateiname(reihe);
      setZustand({ art: "fertig", reihe, ergebnisse, zip, name });
      if (!ergebnisse.length) return;
      dateiAnbieten(zipBlob(zip), name, "application/zip");
      try {
        await testlaufArchivieren(
          {
            id: testlaufId(),
            erstellt: reihe.erstellt,
            art: "fallreihe",
            titel: "Fallreihe",
            konfiguration: `${plan ? `Plan ${plan.plan.id}${planAbweichend ? " (abweichend)" : ""}` : "Matrix"} · ${faelle.length} ${faelle.length === 1 ? "Fall" : "Fälle"} · ${varianten.map((v) => v.kennung).join(", ")}`,
            laeufe: ergebnisse.length,
            geplant: reihe.laeufe_geplant,
            ...(reihe.beendet ? { beendet: reihe.beendet } : {}),
            kostenUsd: reihe.kosten_usd_summe,
            name,
            groesse: zip.byteLength,
            app: reihe.app,
          },
          zip,
        );
        archiviert?.();
      } catch (err) {
        setZustand({ art: "fertig", reihe, ergebnisse, zip, name, archivFehler: String((err as Error)?.message || err) });
      }
    } catch (err) {
      setZustand({ art: "fehler", text: String((err as Error)?.message || err) });
    } finally {
      abbruch.current = null;
    }
  }

  const gruppen = GRUPPEN.map((g) => ({ g, faelle: katalog.filter((k) => k.gruppe === g) })).filter((x) => x.faelle.length);

  return (
    <section className="testlauf einstellung-block" aria-labelledby="fallreihe-titel">
      <h3 id="fallreihe-titel">Fallreihe</h3>
      <p className="hinweis">
        Mehrere Fälle nacheinander mit denselben Schritten wie eine Erfassung in der App: S1, Bestätigung ohne Änderung, S2 mit Prüfung und Reparatur bei
        Bedarf. Grundlage sind die mitgelieferten Bewertungsfälle (evaluation/faelle/) und importierte Fallpakete. Ein Bewertungsplan belegt Fälle, Varianten,
        Wiederholungen, Recherchetiefe und Deckel vor; ohne Plan läuft jeder gewählte Fall mit dem Standardprofil jedes gewählten Anbieters.
      </p>
      {ladefehler && (
        <p className="hinweis fehler" role="alert">
          Die Fälle ließen sich nicht laden: {ladefehler}
        </p>
      )}
      {!daten && !ladefehler && <p className="hinweis">Fälle werden geladen …</p>}
      {daten && (
        <>
          <div className="feld">
            <label className="feld-label" htmlFor="fallreihe-plan">
              Bewertungsplan laden (JSON)
            </label>
            <input id="fallreihe-plan" type="file" accept=".json,application/json" disabled={laeuft} onChange={(ev) => void planDatei(ev.target.files?.[0])} />
            {planFehler && (
              <span className="hinweis fehler" role="alert">
                {planFehler}
              </span>
            )}
            {plan && (
              <span className="hinweis" role="status">
                Plan {plan.plan.id} ({plan.name}), SHA-256 <code>{plan.sha256}</code>
                {planAbweichend ? " · Auswahl weicht vom Plan ab" : ""}{" "}
                <button type="button" className="knopf leise klein" disabled={laeuft} onClick={() => setPlan(null)}>
                  Plan verwerfen
                </button>
              </span>
            )}
          </div>
          <div className="feld">
            <label className="feld-label" htmlFor="fallreihe-paket">
              Fallpaket importieren (ZIP)
            </label>
            <input id="fallreihe-paket" type="file" accept=".zip,application/zip" disabled={laeuft} onChange={(ev) => void paketDatei(ev.target.files?.[0])} />
            <span className="hinweis">
              Fälle nach evaluation/faelle/fall.schema.json, Material unter dem Pfad aus „datei“. Das Paket bleibt bis zur Löschung auf diesem Gerät und geht
              nur an die gewählten Anbieter.
            </span>
            {paketMeldung && (
              <span className={`hinweis${paketMeldung.fehler ? " fehler" : ""}`} role={paketMeldung.fehler ? "alert" : "status"}>
                {paketMeldung.text}
              </span>
            )}
            {pakete.length > 0 && (
              <ul className="testlauf-konfiguration" aria-label="Fallpakete">
                {pakete.map((p) => (
                  <li key={p.sha256}>
                    {p.name}: {p.faelle.length} {p.faelle.length === 1 ? "Fall" : "Fälle"}, SHA-256 <code>{p.sha256}</code>
                    {p.befunde.length ? ` · ${p.befunde.join(" ")}` : ""}{" "}
                    <button type="button" className="knopf leise klein" disabled={laeuft} onClick={() => void paketEntfernen(p)}>
                      Löschen
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <fieldset className="ablage-wahl" aria-describedby="fallreihe-faelle-hinweis">
            <legend>Fälle</legend>
            <span className="hinweis" id="fallreihe-faelle-hinweis">
              {auswahl.size ? `${faelle.length} gewählt` : "Noch kein Fall gewählt"}. Ausgegraut: Fälle, die in der Fallreihe nicht laufen können, mit Grund.
            </span>
            {gruppen.map(({ g, faelle: liste }) => (
              <details
                key={g}
                open={liste.some((k) => auswahl.has(k.fall.id)) || g === "Fallpaket" || g.startsWith("Prüfsteine") || g.startsWith("Referenzfall")}
              >
                <summary>
                  {g} ({liste.length})
                </summary>
                {liste.map((k) => (
                  <label key={k.fall.id} className="ablage-option">
                    <input
                      type="checkbox"
                      checked={auswahl.has(k.fall.id)}
                      disabled={laeuft || !k.zulaessig}
                      onChange={() => umschalten(auswahl, k.fall.id, setAuswahl)}
                    />
                    <span>
                      <strong>{k.fall.titel}</strong>
                      <br />
                      <span className="ablage-text">
                        {k.fall.id} · {daten.profile[k.profilId]?.name ?? k.profilId} · {ART_TITEL[k.art]}
                        {k.websuche ? " · mit Websuche" : ""}
                        {k.grund ? ` · ${k.grund}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </details>
            ))}
          </fieldset>
          {plan ? (
            <fieldset className="ablage-wahl">
              <legend>Varianten aus dem Plan</legend>
              {(abgleich?.auswahl.varianten ?? []).map((v) => (
                <label key={v.kennung} className="ablage-option">
                  <input
                    type="checkbox"
                    checked={planVarianten.has(v.kennung)}
                    disabled={laeuft}
                    onChange={() => umschalten(planVarianten, v.kennung, setPlanVarianten)}
                  />
                  <span>{varianteText(v)}</span>
                </label>
              ))}
            </fieldset>
          ) : (
            <fieldset className="ablage-wahl">
              <legend>Anbieter (Standardprofil)</legend>
              {REIHEN_ANBIETER.filter((a) => freigegeben(a)).map((a) => (
                <label key={a} className="ablage-option">
                  <input type="checkbox" checked={anbieter.has(a)} disabled={laeuft} onChange={() => umschalten(anbieter, a, setAnbieter)} />
                  <span>{ANBIETER_TITEL[a]}</span>
                </label>
              ))}
              {anbieter.has("mistral") && (
                <label className="feld">
                  <span className="feld-label">Mistral-Endpunkt</span>
                  <select value={endpunkt} disabled={laeuft} onChange={(ev) => setEndpunkt(ev.target.value as "eu" | "global")}>
                    <option value="eu">EU (api.eu.mistral.ai, ohne Websuche)</option>
                    <option value="global">global (api.mistral.ai, mit Websuche)</option>
                  </select>
                </label>
              )}
            </fieldset>
          )}
          <label className="feld">
            <span className="feld-label">Wiederholungen je Fall und Variante</span>
            <input
              type="number"
              min={1}
              max={WIEDERHOLUNGEN_MAX}
              value={wiederholungen}
              disabled={laeuft}
              onChange={(ev) => setWiederholungen(Number(ev.target.value) || 1)}
              onBlur={() => setWiederholungen(n)}
            />
          </label>
          <label className="feld">
            <span className="feld-label">Recherchetiefe (Fälle mit Websuche)</span>
            <select value={recherche} disabled={laeuft} onChange={(ev) => setRecherche(ev.target.value as StufeId | "")}>
              <option value="">wie in den Einstellungen</option>
              {RECHERCHE_STUFEN.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titel}
                </option>
              ))}
            </select>
          </label>
          <label className="feld">
            <span className="feld-label">Kostendeckel (USD)</span>
            <input type="text" inputMode="decimal" value={deckel} disabled={laeuft} placeholder="ohne Deckel" onChange={(ev) => setDeckel(ev.target.value)} />
            <span className="hinweis">
              Die Reihe hält vor dem Lauf an, der den Deckel überschreiten würde (Schätzung oder teuerster bisheriger Lauf derselben Variante).
            </span>
          </label>
          <p className="hinweis laufschaetzung" role="status">
            {geplant.length} {geplant.length === 1 ? "Lauf" : "Läufe"} ({faelle.length} × {varianten.length} × {n}); voraussichtlich {kostenText(schaetzung)}
            {mitWebsuche ? ", Recherche ohne Messwert" : ""}. Maßgeblich ist die Abrechnung des Anbieters.
          </p>
          {sperren.length > 0 && (
            <ul className="hinweis" aria-label="Vor dem Start zu klären">
              {sperren.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {fehlend.length > 0 && (
            <p className="hinweis" role="status">
              Für die Fallreihe fehlt der Schlüssel für {fehlend.map((a) => ANBIETER_NAME[a]).join(" und ")} (Bereich „KI-Anbieter und API“).{" "}
              {zeige && (
                <button type="button" className="knopf leise klein" onClick={() => zeige("anbieter")}>
                  Schlüssel hinterlegen
                </button>
              )}
            </p>
          )}
          <p>
            {!laeuft ? (
              <button type="button" className="knopf primaer" disabled={sperren.length > 0 || fehlend.length > 0} onClick={starten}>
                Fallreihe starten
              </button>
            ) : (
              <button type="button" className="knopf" onClick={() => abbruch.current?.abort()}>
                Fallreihe abbrechen
              </button>
            )}
          </p>
          {laeuft && (
            <p className="hinweis" role="status" aria-live="polite">
              Fallreihe · {zustand.stand ?? "wird vorbereitet …"}. Bitte die Seite im Vordergrund und das Gerät entsperrt lassen.
            </p>
          )}
          {zustand.art === "fehler" && (
            <p className="hinweis fehler" role="alert">
              Fallreihe nicht möglich: {zustand.text}
            </p>
          )}
          {zustand.art === "fertig" && (
            <div role="status" className="testlauf-ergebnis">
              <p>
                Fallreihe beendet: {zustand.ergebnisse.length} von {zustand.reihe.laeufe_geplant} Läufen
                {zustand.reihe.beendet ? ` (${zustand.reihe.beendet})` : ""}, zusammen {formatUsd(zustand.reihe.kosten_usd_summe)}; schemakonform{" "}
                {zustand.ergebnisse.filter((e) => e.pruefungen.schemakonform).length}.
              </p>
              {zustand.ergebnisse.length > 0 && (
                <button type="button" className="knopf" onClick={() => dateiAnbieten(zipBlob(zustand.zip), zustand.name, "application/zip")}>
                  ZIP herunterladen
                </button>
              )}
              {zustand.archivFehler && (
                <p className="hinweis fehler" role="alert">
                  Die Fallreihe ließ sich nicht im Archiv ablegen ({zustand.archivFehler}); die ZIP-Datei wurde trotzdem angeboten.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
