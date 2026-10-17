// Profilverwaltung: eingebaute und importierte Profilpakete, Prüfbericht, Aktivieren, Export.

import { useRef, useState } from "react";
import type { Befund } from "../kern/typen";
import type { ProfilEintrag } from "../App";
import { ausDateiliste, alsZip } from "../profil/zip";
import { dateiAnbieten } from "../speicher/speicher";

interface Props {
  profile: ProfilEintrag[];
  aktiv?: string;
  aktivieren: (schluessel: string) => void;
  importieren: (dateien: Record<string, string>) => Promise<{ ok: boolean; befunde: Befund[] }>;
  loeschen: (schluessel: string) => void;
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

export function ProfileAnsicht({ profile, aktiv, aktivieren, importieren, loeschen }: Props) {
  const zipRef = useRef<HTMLInputElement>(null);
  const ordnerRef = useRef<HTMLInputElement>(null);
  const [bericht, setBericht] = useState<{ ok: boolean; befunde: Befund[] } | null>(null);

  const einlesen = async (liste: FileList | null) => {
    if (!liste || !liste.length) return;
    try {
      const dateien = await ausDateiliste(liste);
      setBericht(await importieren(dateien));
    } catch (e) {
      setBericht({ ok: false, befunde: [{ stufe: "fehler", text: `Das Paket konnte nicht gelesen werden: ${(e as Error).message}` }] });
    }
  };

  return (
    <div className="profile">
      <div className="werkzeugleiste">
        <div className="werkzeugleiste-text">
          <h1>Profile</h1>
          <p>
            Ein Profil legt fest, nach welcher Systematik gemeldet wird: Schema, Darstellung, Arbeitsanweisung, SOP und Kodierleitfaden einer Organisation oder
            Ebene.
          </p>
        </div>
        <div className="werkzeugleiste-knoepfe">
          <button type="button" className="knopf primaer" onClick={() => zipRef.current?.click()}>
            Profilpaket importieren
          </button>
          <button type="button" className="knopf leise" onClick={() => ordnerRef.current?.click()}>
            Ordner wählen
          </button>
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
          <h3>{bericht.ok ? "Profil importiert" : "Profil nicht importiert"}</h3>
          <Befunde befunde={bericht.befunde} />
          <button type="button" className="knopf leise klein" onClick={() => setBericht(null)}>
            Ausblenden
          </button>
        </div>
      )}

      <div className="profilliste">
        {profile.map((p) => {
          const m = p.profil?.manifest;
          const istAktiv = p.schluessel === aktiv;
          return (
            <article key={p.schluessel} className={istAktiv ? "profil aktiv" : "profil"}>
              <header>
                <h2>{m?.name || p.schluessel}</h2>
                <p className="profil-meta">
                  {p.quelle === "eingebaut"
                    ? "Mitgeliefert"
                    : `Importiert${p.importiertAm ? " am " + new Date(p.importiertAm).toLocaleDateString("de-DE") : ""}`}
                  {m && `, Version ${m.version}`}
                </p>
              </header>
              {m?.beschreibung && <p>{m.beschreibung}</p>}
              {p.profil && (
                <dl className="profil-daten">
                  <div>
                    <dt>Ebene</dt>
                    <dd>{m?.ebene || "–"}</dd>
                  </div>
                  <div>
                    <dt>Referenzraum</dt>
                    <dd>{m?.referenzraum || "–"}</dd>
                  </div>
                  <div>
                    <dt>Schema</dt>
                    <dd>{m?.meldung.schema_id}</dd>
                  </div>
                  <div>
                    <dt>SOP</dt>
                    <dd>{p.profil.sops.filter((s) => !s.id.startsWith("teil-")).length || "keine"}</dd>
                  </div>
                  <div>
                    <dt>Prüfsumme</dt>
                    <dd className="hash" title={p.profil.hash}>
                      {p.profil.hash.slice(0, 12)}
                    </dd>
                  </div>
                </dl>
              )}
              <details>
                <summary>Prüfbericht und Dateien</summary>
                <Befunde befunde={p.befunde} />
                <ul className="dateiliste">
                  {Object.keys(p.dateien)
                    .sort()
                    .map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                </ul>
              </details>
              <div className="aktionen">
                {p.profil && !istAktiv && (
                  <button type="button" className="knopf primaer" onClick={() => aktivieren(p.schluessel)}>
                    Verwenden
                  </button>
                )}
                {istAktiv && <span className="aktiv-marke">In Verwendung</span>}
                <button
                  type="button"
                  className="knopf leise"
                  onClick={async () => dateiAnbieten(await alsZip(p.dateien, p.schluessel), `${p.schluessel}.leadprofil`, "application/zip")}
                >
                  Als Paket exportieren
                </button>
                {p.quelle === "importiert" && (
                  <button
                    type="button"
                    className="knopf leise"
                    onClick={() => confirm(`Profil „${m?.name || p.schluessel}“ entfernen?`) && loeschen(p.schluessel)}
                  >
                    Entfernen
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
