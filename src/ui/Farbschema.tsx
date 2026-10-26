// Einstellungen → Darstellung: Farbschema der Oberfläche wählen und eigene Farben für das aktive Profil festlegen.
// Das Farbschema gilt nur für die Bildschirmdarstellung; Signalfarben der Bewertungen, PDF, Word-Kopiervorlage und
// Exporte behalten ihre Gestaltung.

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Profil } from "../kern/typen";
import { FARBSCHEMAS } from "../darstellung/katalog";
import { AUTOMATISCH, PROFIL, bandVerlauf, katalogEintrag, profilFarbschemaFehler, semantikVon } from "../darstellung/thema";
import type { AufgeloestesThema, ProfilFarbschema, UiToken } from "../darstellung/typen";

export interface FarbZugang {
  auswahl: string;
  setAuswahl: (a: string) => void;
  thema: AufgeloestesThema;
  /** Eigene Farben des aktiven Profils auf diesem Gerät */
  lokal?: ProfilFarbschema;
  /** Speichert eigene Farben (null entfernt sie); wirft bei Speicherfehlern */
  speichern: (f: ProfilFarbschema | null) => Promise<void>;
}

const NEUTRAL = FARBSCHEMAS.filter((s) => s.gruppe === "Neutral");
const KONTRAST = FARBSCHEMAS.filter((s) => s.gruppe === "Kontrast");
const BUND = FARBSCHEMAS.filter((s) => s.gruppe === "Bund");
const LAENDER = FARBSCHEMAS.filter((s) => s.gruppe === "Bundesländer").sort((a, b) => a.name.localeCompare(b.name, "de"));

/** Rollen, die der Editor direkt anbietet; weitere unter „Weitere Farben“ */
const HAUPTFARBEN: { token: UiToken; titel: string }[] = [
  { token: "amt", titel: "Primärfarbe (Knöpfe, Auswahl)" },
  { token: "auf-amt", titel: "Text auf der Primärfarbe" },
  { token: "amt-tief", titel: "Primärfarbe dunkel (Hover, Titel)" },
  { token: "link", titel: "Links" },
  { token: "marke-akzent-1", titel: "Band 1" },
  { token: "marke-akzent-2", titel: "Band 2" },
  { token: "marke-akzent-3", titel: "Band 3" },
];
const WEITERE: { token: UiToken; titel: string }[] = [
  { token: "amt-zart", titel: "Auswahlfläche" },
  { token: "auswahl-rand", titel: "Auswahlrahmen" },
  { token: "header-hintergrund", titel: "Kopfzeile" },
  { token: "header-text", titel: "Text der Kopfzeile" },
  { token: "papier", titel: "Hintergrund" },
  { token: "flaeche", titel: "Arbeitsfläche" },
  { token: "tinte", titel: "Text" },
  { token: "tinte-leise", titel: "Nebentext" },
  { token: "fokus", titel: "Fokusrahmen" },
  { token: "eingabe-rand", titel: "Rahmen von Eingabefeldern" },
];

/** CSS-Variablen für eine Vorschau (nur innerhalb des Vorschaukastens) */
function vorschauStil(basisId: string, farben: Partial<Record<string, string>> = {}): CSSProperties {
  const b = katalogEintrag(basisId) || katalogEintrag("neutral-hell")!;
  const alle: Record<string, string> = { ...b.tokens, ...semantikVon(b), ...farben };
  const eigenesBand = ["marke-akzent-1", "marke-akzent-2", "marke-akzent-3"].some((k) => farben[k] && farben[k] !== b.tokens[k as UiToken]);
  alle.band = bandVerlauf(eigenesBand ? ["marke-akzent-1", "marke-akzent-2", "marke-akzent-3"].map((k) => alle[k] ?? "") : b.band);
  return Object.fromEntries(Object.entries(alle).map(([k, v]) => [`--${k}`, v])) as CSSProperties;
}

function Vorschau({ stil, titel }: { stil: CSSProperties; titel: string }) {
  return (
    <div className="farb-vorschau" style={stil} aria-label={`Vorschau: ${titel}`}>
      <div className="farb-vorschau-kopf">{titel}</div>
      <p>
        Text auf der Arbeitsfläche, <span className="farb-vorschau-leise">Nebentext</span> und ein <span className="farb-vorschau-link">Link</span>.
      </p>
      <div className="farb-vorschau-zeile">
        <span className="farb-vorschau-knopf">Primärknopf</span>
        <span className="farb-vorschau-auswahl">ausgewählt</span>
        <span className="farb-vorschau-signal">erheblich</span>
      </div>
    </div>
  );
}

function FarbFeld({ token, titel, wert, basiswert, setzen }: { token: string; titel: string; wert?: string; basiswert: string; setzen: (v?: string) => void }) {
  const [text, setText] = useState(wert || "");
  useEffect(() => setText(wert || ""), [wert]);
  const anzeige = /^#[0-9A-Fa-f]{6}$/.test(text) ? text : wert || basiswert;
  return (
    <div className="farb-feld">
      <label htmlFor={`farbe-${token}`}>{titel}</label>
      <input type="color" aria-label={`${titel}: Farbwähler`} value={anzeige.toLowerCase()} onChange={(e) => setzen(e.target.value.toUpperCase())} />
      <input
        id={`farbe-${token}`}
        type="text"
        inputMode="text"
        spellCheck={false}
        placeholder={basiswert}
        value={text}
        onChange={(e) => {
          const v = e.target.value.trim();
          setText(v);
          if (!v) setzen(undefined);
          else if (/^#[0-9A-Fa-f]{6}$/.test(v)) setzen(v.toUpperCase());
        }}
      />
    </div>
  );
}

function EigeneFarben({ profil, zugang }: { profil: Profil; zugang: FarbZugang }) {
  const vorlage: ProfilFarbschema = zugang.lokal || profil.manifest.farbschema || { basis: "neutral-hell" };
  const [entwurf, setEntwurf] = useState<ProfilFarbschema>(() => structuredClone(vorlage));
  // Nach Speichern oder Zurücksetzen gilt der neue Stand als Ausgangspunkt (der Editor bleibt offen)
  useEffect(() => {
    setEntwurf(structuredClone(zugang.lokal || profil.manifest.farbschema || { basis: "neutral-hell" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zugang.lokal]);
  const [meldung, setMeldung] = useState<{ art: "ok" | "fehler"; text: string } | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const basis = katalogEintrag(entwurf.basis) || katalogEintrag("neutral-hell")!;
  const fehler = useMemo(() => profilFarbschemaFehler(entwurf), [entwurf]);
  const setFarbe = (token: string, v?: string) =>
    setEntwurf((e) => {
      const farben = { ...(e.farben || {}) } as Record<string, string>;
      if (v) farben[token] = v;
      else delete farben[token];
      return { ...e, farben };
    });
  const ausschnitt = JSON.stringify(
    { farbschema: { basis: entwurf.basis, ...(entwurf.name ? { name: entwurf.name } : {}), farben: entwurf.farben || {} } },
    null,
    2,
  );

  return (
    <details className="farb-editor">
      <summary>Eigene Farben für dieses Profil</summary>
      <p className="hinweis">
        Gilt auf diesem Gerät für „{profil.manifest.name}“ in Version {profil.manifest.version}. Das Profilpaket und seine Prüfsumme bleiben unverändert. Damit
        andere die Farben erhalten, den Ausschnitt in die <code>profil.json</code> des Pakets übernehmen und die Profilversion erhöhen.
      </p>
      <div className="farb-editor-raster">
        <label className="feld">
          <span>Ausgangsschema</span>
          <select value={entwurf.basis} onChange={(e) => setEntwurf((x) => ({ ...x, basis: e.target.value }))}>
            {[...NEUTRAL, ...KONTRAST, ...BUND, ...LAENDER].map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="feld">
          <span>Name (optional)</span>
          <input type="text" maxLength={80} value={entwurf.name || ""} onChange={(e) => setEntwurf((x) => ({ ...x, name: e.target.value || undefined }))} />
        </label>
      </div>
      <div className="farb-felder">
        {HAUPTFARBEN.map((f) => (
          <FarbFeld
            key={f.token}
            token={f.token}
            titel={f.titel}
            wert={entwurf.farben?.[f.token]}
            basiswert={basis.tokens[f.token]}
            setzen={(v) => setFarbe(f.token, v)}
          />
        ))}
      </div>
      <details className="farb-weitere">
        <summary>Weitere Farben</summary>
        <div className="farb-felder">
          {WEITERE.map((f) => (
            <FarbFeld
              key={f.token}
              token={f.token}
              titel={f.titel}
              wert={entwurf.farben?.[f.token]}
              basiswert={basis.tokens[f.token]}
              setzen={(v) => setFarbe(f.token, v)}
            />
          ))}
        </div>
      </details>
      <Vorschau stil={vorschauStil(entwurf.basis, entwurf.farben)} titel={entwurf.name || "Eigene Farben"} />
      {fehler.length > 0 && (
        <div className="kasten kasten-fehler" role="alert">
          <p>Nicht verwendbar:</p>
          <ul>
            {fehler.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="aktionen">
        <button
          type="button"
          className="knopf primaer"
          disabled={fehler.length > 0}
          onClick={async () => {
            try {
              await zugang.speichern(entwurf);
              setMeldung({ art: "ok", text: "Gespeichert und als Farbschema gewählt." });
            } catch (e) {
              setMeldung({ art: "fehler", text: `Nicht gespeichert: ${(e as Error).message}` });
            }
          }}
        >
          Speichern und verwenden
        </button>
        <button type="button" className="knopf" onClick={() => setEntwurf(structuredClone(vorlage))}>
          Änderungen verwerfen
        </button>
        {zugang.lokal && (
          <button
            type="button"
            className="knopf leise"
            onClick={async () => {
              try {
                await zugang.speichern(null);
                setEntwurf(structuredClone(profil.manifest.farbschema || { basis: "neutral-hell" }));
                setMeldung({ art: "ok", text: "Eigene Farben entfernt; es gilt das Farbschema des Profils." });
              } catch (e) {
                setMeldung({ art: "fehler", text: `Nicht entfernt: ${(e as Error).message}` });
              }
            }}
          >
            Auf Profilvorgabe zurücksetzen
          </button>
        )}
        <button
          type="button"
          className="knopf leise"
          disabled={fehler.length > 0}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(ausschnitt);
              setKopiert(true);
              window.setTimeout(() => setKopiert(false), 2000);
            } catch {
              setMeldung({ art: "fehler", text: "Kopieren nicht möglich; den Ausschnitt unten markieren und kopieren." });
            }
          }}
        >
          {kopiert ? "Kopiert" : "Ausschnitt für profil.json kopieren"}
        </button>
      </div>
      {meldung && (
        <p className={meldung.art === "ok" ? "hinweis" : "fehlertext"} role="status">
          {meldung.text}
        </p>
      )}
      <details>
        <summary>Ausschnitt anzeigen</summary>
        <pre className="farb-ausschnitt">{ausschnitt}</pre>
      </details>
    </details>
  );
}

export function FarbschemaAbschnitt({ profil, zugang }: { profil: Profil | null; zugang: FarbZugang }) {
  const t = zugang.thema;
  const profilSchema = profil?.manifest.farbschema;
  const quelle =
    t.quelle === "lokal"
      ? "eigene Farben dieses Geräts"
      : t.quelle === "profil"
        ? "Farbschema des Profils"
        : t.quelle === "ersatz"
          ? "Ersatz"
          : t.quelle === "automatisch"
            ? t.basis
              ? katalogEintrag(t.basis)?.herkunft || ""
              : "Standarddarstellung"
            : t.basis
              ? katalogEintrag(t.basis)?.herkunft || ""
              : "";
  return (
    <section className="schritt-inhalt abschnitt-einzeln">
      <h2>Darstellung</h2>
      <p className="einleitung">
        Farbschema der Oberfläche. Es ändert nur die Bildschirmfarben: Bewertungen behalten Bedeutung und Bezeichnung, PDF, Word-Kopiervorlage und andere
        Ausgaben ihre eigene Gestaltung. Die Kontrastschemata haben Text mit mindestens 7:1 und kräftige Konturen; eine im System eingestellte Farbanpassung (z.
        B. Kontrastdesign von Windows) geht immer vor.
      </p>
      <label className="feld">
        <span>Farbschema</span>
        <select value={zugang.auswahl} onChange={(e) => zugang.setAuswahl(e.target.value)}>
          <option value={AUTOMATISCH}>Automatisch (nach System: Neutral · Hell oder Neutral · Night Mode, bei „mehr Kontrast“ Kontrastschema)</option>
          <optgroup label="Neutral">
            {NEUTRAL.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Kontrast">
            {KONTRAST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} – {s.modus === "hell" ? "heller" : "dunkler"} Hintergrund, besonders deutlicher Text und Konturen
              </option>
            ))}
          </optgroup>
          <optgroup label="Bund">
            {BUND.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Bundesländer">
            {LAENDER.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Profil">
            <option value={PROFIL}>Farben des aktiven Profils{profil && (zugang.lokal || profilSchema) ? "" : " (keine definiert)"}</option>
          </optgroup>
        </select>
      </label>
      <p className="hinweis">
        Verwendet: <strong>{t.name}</strong>
        {quelle ? ` – ${quelle}` : ""}.
      </p>
      {t.hinweise.map((h) => (
        <p key={h} className="hinweis">
          {h}
        </p>
      ))}
      {t.basis && (
        <Vorschau stil={vorschauStil(t.basis, Object.fromEntries(Object.entries(t.tokens).filter(([k]) => !k.startsWith("radar"))))} titel={t.name} />
      )}
      {profil && <EigeneFarben key={profil.hash} profil={profil} zugang={zugang} />}
    </section>
  );
}
